#!/bin/bash

# Enhanced Docker build script for Umami with MySQL support
# Usage: ./docker-build-mysql.sh [OPTIONS]

# Default values
TAG="umami-ip-feature:v2.19.2-mysql"
DATABASE_TYPE="mysql"
BASE_PATH=""
NODE_OPTIONS="--max-old-space-size=4096"
PUSH=false
NO_CACHE=false

# Help message
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -t, --tag TAG          Docker image tag (default: $TAG)"
    echo "  -d, --database TYPE    Database type (default: $DATABASE_TYPE)"
    echo "  -b, --base-path PATH   Base path for the application"
    echo "  -n, --node-options OPT Node.js options (default: $NODE_OPTIONS)"
    echo "  -p, --push             Push image to registry after build"
    echo "  -c, --no-cache         Build without cache"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Build with default settings"
    echo "  $0 -t my-umami:latest                # Build with custom tag"
    echo "  $0 -t my-umami:latest -p             # Build and push"
    echo "  $0 -b /umami -c                      # Build with base path and no cache"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--tag)
            TAG="$2"
            shift 2
            ;;
        -d|--database)
            DATABASE_TYPE="$2"
            shift 2
            ;;
        -b|--base-path)
            BASE_PATH="$2"
            shift 2
            ;;
        -n|--node-options)
            NODE_OPTIONS="$2"
            shift 2
            ;;
        -p|--push)
            PUSH=true
            shift
            ;;
        -c|--no-cache)
            NO_CACHE=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Display build configuration
echo "=== Docker Build Configuration ==="
echo "Image Tag: $TAG"
echo "Database Type: $DATABASE_TYPE"
echo "Base Path: ${BASE_PATH:-"(none)"}"
echo "Node Options: $NODE_OPTIONS"
echo "Push to Registry: $PUSH"
echo "No Cache: $NO_CACHE"
echo "================================="
echo ""

# Prepare build arguments
BUILD_ARGS="--build-arg DATABASE_TYPE=$DATABASE_TYPE"
BUILD_ARGS="$BUILD_ARGS --build-arg NODE_OPTIONS=\"$NODE_OPTIONS\""

if [[ -n "$BASE_PATH" ]]; then
    BUILD_ARGS="$BUILD_ARGS --build-arg BASE_PATH=$BASE_PATH"
fi

# Add no-cache flag if requested
if [[ "$NO_CACHE" == true ]]; then
    BUILD_ARGS="$BUILD_ARGS --no-cache"
fi

# Build the Docker image
echo "Building Docker image..."
echo "Command: docker build $BUILD_ARGS -t $TAG ."
echo ""

docker build $BUILD_ARGS -t $TAG .

# Check if build was successful
if [[ $? -eq 0 ]]; then
    echo ""
    echo "✅ Build completed successfully!"
    echo "Image tagged as: $TAG"
    echo ""
    echo "Image size:"
    docker images $TAG --format "table {{.Size}}"
    echo ""
    
    # Push to registry if requested
    if [[ "$PUSH" == true ]]; then
        echo "Pushing image to registry..."
        docker push $TAG
        if [[ $? -eq 0 ]]; then
            echo "✅ Push completed successfully!"
        else
            echo "❌ Push failed!"
            exit 1
        fi
    fi
    
    echo ""
    echo "To run the container:"
    echo "docker run -d --name umami-mysql -p 3000:3000 $TAG"
    echo ""
    echo "To run with custom database URL:"
    echo "docker run -d --name umami-mysql -p 3000:3000 \\"
    echo "  -e DATABASE_URL=mysql://user:password@host:3306/umami \\"
    echo "  -e DATABASE_TYPE=mysql \\"
    echo "  -e APP_SECRET=your-secret-key \\"
    echo "  $TAG"
else
    echo ""
    echo "❌ Build failed!"
    exit 1
fi