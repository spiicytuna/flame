#!/usr/bin/env bash
# Add tag to :latest based on git branch checked out
#
# master      -> ghcr.io/<OWNER>/flame
# tuna-combo  -> ghcr.io/<OWNER>/flame-dev

set -euo pipefail

OWNER="${OWNER:-spiicytuna}"     # override => OWNER=...

if [[ $# -lt 1 ]]; then
  echo "usage: $0 <new-tag> [<new-tag-2> ...]" >&2
  exit 1
fi

# branch ??
BRANCH="${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')}"
if [[ -z "$BRANCH" || "$BRANCH" == "HEAD" ]]; then
  echo "Error: could not determine git branch (are you in a repo?)." >&2
  exit 1
fi

# image ??
case "$BRANCH" in
  master)
    IMAGE="flame"
    ;;
  tuna-combo)
    IMAGE="flame-dev"
    ;;
  *)
    echo "Error: unsupported branch '$BRANCH'. Expected 'master' or 'tuna-combo'." >&2
    exit 1
    ;;
esac

BASE="ghcr.io/${OWNER}/${IMAGE}"

echo "Branch: $BRANCH"
echo "Target repo: $BASE"
echo "Resolving digest behind ${BASE}:latest ..."

# must be logged in
OUT="$(docker buildx imagetools inspect "${BASE}:latest")" || {
  echo "Error: failed to inspect ${BASE}:latest" >&2
  exit 1
}

DIGEST="$(awk '/^Digest:/ {print $2; exit}' <<<"$OUT")"
if [[ -z "${DIGEST:-}" ]]; then
  echo "Error: could not parse digest for ${BASE}:latest" >&2
  exit 1
fi

echo "latest digest: ${DIGEST}"

# Create tags pointing to that digest
for T in "$@"; do
  echo "Tagging ${BASE}@${DIGEST} as ${BASE}:${T}"
  docker buildx imagetools create --tag "${BASE}:${T}" "${BASE}@${DIGEST}"
done

echo "Done."
