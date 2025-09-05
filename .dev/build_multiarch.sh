#!/usr/bin/env bash
set -euo pipefail

# ----------------------------------------------------------------------------
# build_multiarch.sh — Build & publish multi-arch images to GHCR
#
# Usage:
#   ./build_multiarch.sh [dev|stable] [VERSION]
# Examples:
#   ./build_multiarch.sh dev
#   ./build_multiarch.sh dev 0.01
#   ./build_multiarch.sh stable 0.01
#
# Behavior:
#   • CHANNEL "stable" pushes to: ghcr.io/$OWNER/$IMAGE
#       - Tags: :stable, :latest, and :<VERSION> (if provided)
#   • CHANNEL "dev" pushes to:    ghcr.io/$OWNER/${IMAGE}-dev
#       - Tags: :dev, :latest, and :<VERSION> (if provided)
#   • arm/v7 is built from .docker/Dockerfile.multiarch; amd64+arm64 from .docker/Dockerfile
#   • Per-arch images get OCI labels (source/revision/created), and optional description
#     pulled from CHANGELOG via .dev/desc_from_changelog.sh (if present).  
#   • The multi-arch manifest is composed without annotations (more portable); 
#     if you want the GHCR package description to show the one-liner, run the
#     annotate-index Action after pushing.
#
# Env overrides:
#   OWNER=spiicytuna       IMAGE=flame   CTX=.   FORCE=0   USE_DESC=1
#   BUILDPLATFORM_OVERRIDE=linux/amd64   (for arm/v7 build arg)
# ----------------------------------------------------------------------------

TAG="${1:-dev}"          # dev | stable
VERSION="${2:-}"         # optional version string, e.g. 0.01

# ---- Config (override via env)
OWNER="${OWNER:-spiicytuna}"
IMAGE="${IMAGE:-flame}"
CTX="${CTX:-.}"
FORCE="${FORCE:-0}"          # 1 = allow overwriting existing :<VERSION> tag
USE_DESC="${USE_DESC:-1}"    # 1 = add per-arch image label from CHANGELOG

# Package name per channel (stable=flame / dev=flame-dev)
PKG="$IMAGE"
[[ "$TAG" == "dev" ]] && PKG="${IMAGE}-dev"

REG="ghcr.io/$OWNER"
CACHE_REF="$REG/${PKG}-buildcache:latest"

# Dockerfiles
ALPINE_DF="${ALPINE_DF:-.docker/Dockerfile}"
ARMV7_DF="${ARMV7_DF:-.docker/Dockerfile.multiarch}"

# Base labels
SOURCE="${SOURCE:-https://github.com/$OWNER/$IMAGE}"
REVISION="${REVISION:-$(git rev-parse HEAD 2>/dev/null || echo unknown)}"
CREATED="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Temporary variant tags used only to assemble the multi-arch index
ALPINE_TAG="${TAG}-alpine"
ARMV7_TAG="${TAG}-armv7"

# Optional description label builder (per-arch images only)
LABEL_ARGS=()
if [[ "$USE_DESC" == "1" ]]; then
  if [[ -x ".dev/desc_from_changelog.sh" ]]; then
    DESC_LINE="$(.dev/desc_from_changelog.sh "${VERSION:-}" CHANGELOG.md || true)"
    if [[ -z "$DESC_LINE" ]]; then
      DESC_LINE="$(.dev/desc_from_changelog.sh "" CHANGELOG.md || true)"
    fi

    if [[ -n "${VERSION:-}" ]]; then
      TITLE="v${VERSION}"
    else
      TITLE="$(grep -m1 -E '^###[[:space:]]*v?.+' CHANGELOG.md 2>/dev/null | sed -E 's/^###[[:space:]]*//')"
      [[ -z "$TITLE" ]] && TITLE="Flame"
    fi

    DESC="${TITLE}: ${DESC_LINE}"
    # sanitize + cap at 512 for GHCR description key
    DESC=$(echo "$DESC" | tr -d '\r' | tr '\n' ' ' | sed -E 's/[[:space:]]+/ /g' | sed 's/[•·–—]/-/g')
    DESC="${DESC:0:512}"

    if [[ -n "$DESC" ]]; then
      LABEL_ARGS+=( --label "org.opencontainers.image.description=$DESC" )
    fi
  fi
fi

# ----------------------------------------------------------------------------
# Build setup
# ----------------------------------------------------------------------------

echo "==> Building multi-arch image for $REG/$PKG:$TAG"
echo "    Context: $CTX"
echo "    Alpine Dockerfile: $ALPINE_DF  (amd64, arm64)"
echo "    Debian Dockerfile: $ARMV7_DF   (arm/v7)"
echo

# Ensure buildx exists
if ! docker buildx inspect >/dev/null 2>&1; then
  docker buildx create --name multi --use
fi
docker buildx inspect --bootstrap >/dev/null

# ----------------------------------------------------------------------------
# 1) Build & push Alpine (amd64 + arm64)
# ----------------------------------------------------------------------------

echo "==> Building amd64+arm64 (Alpine) -> $REG/$PKG:$ALPINE_TAG"
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t "$REG/$PKG:$ALPINE_TAG" \
  --label "org.opencontainers.image.source=$SOURCE" \
  --label "org.opencontainers.image.revision=$REVISION" \
  --label "org.opencontainers.image.created=$CREATED" \
  ${LABEL_ARGS[@]+"${LABEL_ARGS[@]}"} \
  -f "$ALPINE_DF" \
  "$CTX" \
  --push

# ----------------------------------------------------------------------------
# 2) Build & push Debian (arm/v7)
# ----------------------------------------------------------------------------

echo "==> Building arm/v7 (Debian) -> $REG/$PKG:$ARMV7_TAG"
docker buildx build \
  --platform linux/arm/v7 \
  --build-arg BUILDPLATFORM=${BUILDPLATFORM_OVERRIDE:-linux/amd64} \
  --build-arg TARGETPLATFORM=linux/arm/v7 \
  --cache-from type=registry,ref="$CACHE_REF" \
  --cache-to   type=registry,ref="$CACHE_REF",mode=max \
  -t "$REG/$PKG:$ARMV7_TAG" \
  --label "org.opencontainers.image.source=$SOURCE" \
  --label "org.opencontainers.image.revision=$REVISION" \
  --label "org.opencontainers.image.created=$CREATED" \
  ${LABEL_ARGS[@]+"${LABEL_ARGS[@]}"} \
  -f "$ARMV7_DF" \
  "$CTX" \
  --push

# ----------------------------------------------------------------------------
# 3) Compose the final multi-arch tag(s)
# ----------------------------------------------------------------------------

echo "==> Creating manifest(s)"

# Which tags should point to the composed index?
TAG_ARGS=()
if [[ "$TAG" == "stable" ]]; then
  TAG_ARGS+=( --tag "$REG/$PKG:stable" --tag "$REG/$PKG:latest" )
  [[ -n "$VERSION" ]] && TAG_ARGS+=( --tag "$REG/$PKG:$VERSION" )
else
  TAG_ARGS+=( --tag "$REG/$PKG:dev" --tag "$REG/$PKG:latest" )
  [[ -n "$VERSION" ]] && TAG_ARGS+=( --tag "$REG/$PKG:$VERSION" )
fi

# Protect immutable version tags unless FORCE=1
IMMUTABLE_TAGS=()
[[ -n "$VERSION" ]] && IMMUTABLE_TAGS+=( "$REG/$PKG:$VERSION" )

for t in "${IMMUTABLE_TAGS[@]}"; do
  if docker buildx imagetools inspect "$t" >/dev/null 2>&1; then
    if [[ "$FORCE" != "1" ]]; then
      echo "Refusing to overwrite existing version tag: $t"
      echo "Set FORCE=1 to allow overwriting."
      exit 1
    else
      echo "FORCE=1: overwriting existing tag $t"
    fi
  fi
done

# Create the composed manifest (no annotations here for maximum compatibility)
docker buildx imagetools create \
  "${TAG_ARGS[@]}" \
  "$REG/$PKG:$ALPINE_TAG" \
  "$REG/$PKG:$ARMV7_TAG"

# ----------------------------------------------------------------------------
# Show result
# ----------------------------------------------------------------------------

echo "==> Inspecting:"
if [[ "$TAG" == "stable" ]]; then
  docker buildx imagetools inspect "$REG/$PKG:stable"
else
  docker buildx imagetools inspect "$REG/$PKG:dev"
fi

cat <<EOF

Done!

Channel / package layout:
- Stable -> $REG/$IMAGE :stable and :latest; optional version tag :$VERSION
- Dev    -> $REG/${IMAGE}-dev :dev and :latest; optional version tag :$VERSION

Examples:
  docker pull $REG/$IMAGE:stable
  docker pull $REG/$IMAGE:0.01
  docker pull $REG/${IMAGE}-dev:dev
  docker pull $REG/${IMAGE}-dev:0.01

Notes:
- Must be logged into GHCR:  echo "$GHCR_PAT" | docker login ghcr.io -u $OWNER --password-stdin
- After pushing, run the repo Action "Annotate GHCR index" to set the multi-arch
  index description from CHANGELOG (optional cosmetic step).
EOF
