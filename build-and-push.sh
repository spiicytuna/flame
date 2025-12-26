#!/bin/bash
# Build and push Flame Docker image to GitHub Container Registry

set -e  # Exit on error

echo "Building Docker image..."
docker build -t ghcr.io/jowtron/flame:custom -f .docker/Dockerfile .

echo ""
echo "Image built successfully!"
echo ""
echo "To push to GitHub Container Registry:"
echo "1. Create a Personal Access Token at: https://github.com/settings/tokens"
echo "   - Select 'write:packages' permission"
echo "2. Export the token: export GITHUB_TOKEN=your_token_here"
echo "3. Login to GHCR: echo \$GITHUB_TOKEN | docker login ghcr.io -u jowtron --password-stdin"
echo "4. Push the image: docker push ghcr.io/jowtron/flame:custom"
echo ""
echo "Or run these commands now if you have the token ready:"
read -p "Do you have your GitHub token ready? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    read -sp "Enter your GitHub Personal Access Token: " GITHUB_TOKEN
    echo
    echo "Logging in to GHCR..."
    echo $GITHUB_TOKEN | docker login ghcr.io -u jowtron --password-stdin

    echo "Pushing image..."
    docker push ghcr.io/jowtron/flame:custom

    echo ""
    echo "✓ Image pushed successfully to ghcr.io/jowtron/flame:custom"
    echo ""
    echo "To use on your NAS, update your docker-compose.yml or container settings to use:"
    echo "  image: ghcr.io/jowtron/flame:custom"
else
    echo "Skipping push. You can push later with:"
    echo "  echo \$GITHUB_TOKEN | docker login ghcr.io -u jowtron --password-stdin"
    echo "  docker push ghcr.io/jowtron/flame:custom"
fi
