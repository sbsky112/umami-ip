#!/bin/bash

# Build Docker image with Turnstile support
echo "Building Docker image with Turnstile support..."

# Build the image
docker build -t umami-turnstile-test .

# Test the image with environment variables
echo "Testing Docker container with Turnstile..."

docker run -d \
  --name umami-turnstile-test \
  -p 3001:3000 \
  -e DATABASE_URL=postgresql://umami:umami@localhost:5432/umami \
  -e DATABASE_TYPE=postgresql \
  -e APP_SECRET=test-secret-for-docker-build \
  -e NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA \
  -e TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AA \
  umami-turnstile-test

echo "Container started on port 3001"
echo "Access it at: http://localhost:3001"
echo ""
echo "To stop the container:"
echo "  docker stop umami-turnstile-test"
echo "  docker rm umami-turnstile-test"