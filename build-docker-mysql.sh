#!/bin/bash

# Docker build script for Umami with MySQL support
# Usage: ./build-docker-mysql.sh [tag]

# Set default tag if not provided
TAG=${1:-umami-ip-feature:v2.19.2-mysql}

echo "Building Docker image with MySQL support..."
echo "Tag: $TAG"
echo ""

# Build the Docker image
docker build \
  --build-arg DATABASE_TYPE=mysql \
  -t $TAG .

echo ""
echo "Build completed successfully!"
echo "Image tagged as: $TAG"
echo ""
echo "To run the container:"
echo "docker run -d --name umami-mysql -p 3000:3000 $TAG"