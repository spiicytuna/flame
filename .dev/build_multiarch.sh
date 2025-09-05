docker buildx build \
  --platform linux/arm/v7,linux/arm64,linux/amd64 \
  -f .docker/Dockerfile.multiarch \
  -t spiicytuna/flame:multiarch \
  -t "spiicytuna/flame:multiarch$1" \
  --push .
