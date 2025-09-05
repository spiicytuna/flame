#!/usr/bin/env bash
set -euo pipefail

# Usage: ./publish-ghcr.sh [dev|stable]
TAG="${1:-dev}"

# ---- Config (override via env)
OWNER="${OWNER:-spiicytuna}"
IMAGE="${IMAGE:-flame}"
CTX="${CTX:-.}"

# Alpine (amd64+arm64) Dockerfile and Debian (arm/v7) Dockerfile
ALPINE_DF="${ALPINE_DF:-.docker/Dockerfile}"
ARMV7_DF="${ARMV7_DF:-.docker/Dockerfile.multiarch}"

# OCI labels
SOURCE="${SOURCE:-https://github.com/$OWNER/$IMAGE}"
REVISION="${REVISION:-$(git rev-parse HEAD 2>/dev/null || echo unknown)}"
CREATED="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
SHORT="${REVISION:0:12}"

# Variants
ALPINE_TAG="${TAG}-alpine"
ARMV7_TAG="${TAG}-armv7"

echo "==> Building multi-arch image for ghcr.io/$OWNER/$IMAGE:$TAG"
echo "    Context: $CTX"
echo "    Alpine Dockerfile: $ALPINE_DF  (amd64, arm64)"
echo "    Debian Dockerfile: $ARMV7_DF   (arm/v7)"
echo

# logged into ghcr.io ??
if ! docker buildx imagetools inspect "ghcr.io/$OWNER/$IMAGE:dev" >/dev/null 2>&1 \
&& ! docker buildx imagetools inspect "ghcr.io/$OWNER/$IMAGE:stable" >/dev/null 2>&1; then
  echo "Note: ghcr.io/$OWNER/$IMAGE not found yet (first push or private). Proceeding…"
fi

# buildx ready ??
if ! docker buildx inspect >/dev/null 2>&1; then
  docker buildx create --name multi --use
fi
docker buildx inspect --bootstrap >/dev/null

# 1) Build & push Alpine (amd64 + arm64)
echo "==> Building amd64+arm64 (Alpine) -> ghcr.io/$OWNER/$IMAGE:$ALPINE_TAG"
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t "ghcr.io/$OWNER/$IMAGE:$ALPINE_TAG" \
  --label "org.opencontainers.image.source=$SOURCE" \
  --label "org.opencontainers.image.revision=$REVISION" \
  --label "org.opencontainers.image.created=$CREATED" \
  -f "$ALPINE_DF" \
  "$CTX" \
  --push

# 2) Build & push Debian (arm/v7)
echo "==> Building arm/v7 (Debian) -> ghcr.io/$OWNER/$IMAGE:$ARMV7_TAG"
docker buildx build \
  --platform linux/arm/v7 \
  --build-arg BUILDPLATFORM=${BUILDPLATFORM_OVERRIDE:-linux/amd64} \
  --build-arg TARGETPLATFORM=linux/arm/v7 \
  --cache-from type=registry,ref=ghcr.io/$OWNER/$IMAGE:buildcache \
  --cache-to   type=registry,ref=ghcr.io/$OWNER/$IMAGE:buildcache,mode=max \
  -t ghcr.io/$OWNER/$IMAGE:$ARMV7_TAG \
  --label org.opencontainers.image.source=https://github.com/$OWNER/$IMAGE \
  --label org.opencontainers.image.revision=$(git rev-parse HEAD) \
  --label org.opencontainers.image.created=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
  -f "$ARMV7_DF" \
  "$CTX" \
  --push

# 3) Compose final multi-arch tag (:dev | :stable) + immutable :sha-<commit>
echo "==> Creating manifest ghcr.io/$OWNER/$IMAGE:$TAG (and :sha-$SHORT)"
docker buildx imagetools create \
  --tag "ghcr.io/$OWNER/$IMAGE:$TAG" \
  --tag "ghcr.io/$OWNER/$IMAGE:sha-$SHORT" \
  "ghcr.io/$OWNER/$IMAGE:$ALPINE_TAG" \
  "ghcr.io/$OWNER/$IMAGE:$ARMV7_TAG"

echo "==> Inspecting final manifest:"
docker buildx imagetools inspect "ghcr.io/$OWNER/$IMAGE:$TAG"

cat <<EOF

Done !!!

Pull test:
  docker pull ghcr.io/$OWNER/$IMAGE:$TAG

Notes:
- Must be logged into GHCR:  docker login ghcr.io
- FYI: make the package public  GitHub => Packages => image => Settings => Change visibility
- Override the script defaults with env vars, e.g.:
    OWNER=myorg IMAGE=myapp CTX=. \
    ALPINE_DF=.docker/Dockerfile \
    ARMV7_DF=.docker/Dockerfile.multiarch \
    ./publish-ghcr.sh dev
EOF
