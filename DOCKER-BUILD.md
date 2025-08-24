# Docker Build Instructions for Umami with MySQL

This document provides instructions for building Umami with MySQL support using Docker.

## Prerequisites

- Docker installed on your system
- Git (to clone the repository)

## Quick Build

To build the Docker image with MySQL support using your exact command:

```bash
docker build \
  --build-arg DATABASE_TYPE=mysql \
  -t umami-ip-feature:v2.19.2-mysql .
```

## Using Build Scripts

### Simple Build Script

Use the simple build script for quick builds:

```bash
./build-docker-mysql.sh [tag]
```

Example:
```bash
./build-docker-mysql.sh                    # Uses default tag
./build-docker-mysql.sh my-umami:latest   # Uses custom tag
```

### Enhanced Build Script

Use the enhanced build script for more options:

```bash
./docker-build-mysql.sh [OPTIONS]
```

Options:
- `-t, --tag TAG`: Docker image tag (default: umami-ip-feature:v2.19.2-mysql)
- `-d, --database TYPE`: Database type (default: mysql)
- `-b, --base-path PATH`: Base path for the application
- `-n, --node-options OPT`: Node.js options (default: --max-old-space-size=4096)
- `-p, --push`: Push image to registry after build
- `-c, --no-cache`: Build without cache
- `-h, --help`: Show help message

Examples:
```bash
./docker-build-mysql.sh                                    # Build with defaults
./docker-build-mysql.sh -t my-umami:latest                # Custom tag
./docker-build-mysql.sh -t my-umami:latest -p             # Build and push
./docker-build-mysql.sh -b /umami -c                      # With base path, no cache
```

## Docker Compose

You can also use Docker Compose for development:

### MySQL Configuration

```bash
docker-compose -f docker-compose.mysql.yml up -d
```

This will:
- Build the image with MySQL support
- Start a MySQL database
- Start the Umami application

## Running the Built Image

After building the image, you can run it with:

```bash
# Basic run
docker run -d --name umami-mysql -p 3000:3000 umami-ip-feature:v2.19.2-mysql

# Run with environment variables
docker run -d \
  --name umami-mysql \
  -p 3000:3000 \
  -e DATABASE_URL=mysql://user:password@host:3306/umami \
  -e DATABASE_TYPE=mysql \
  -e APP_SECRET=your-secret-key \
  umami-ip-feature:v2.19.2-mysql
```

## Environment Variables

The following environment variables can be used to configure the application:

- `DATABASE_URL`: MySQL connection string
- `DATABASE_TYPE`: Set to `mysql`
- `APP_SECRET`: Application secret key
- `BASE_PATH`: Base path for the application (optional)
- `NODE_OPTIONS`: Node.js runtime options

## Build Arguments

The following build arguments are available:

- `DATABASE_TYPE`: Database type (mysql or postgresql)
- `BASE_PATH`: Base path for the application
- `NODE_OPTIONS`: Node.js options (default: --max-old-space-size=4096)
- `COMMIT_SHA`: Git commit SHA (for version tracking)

## Troubleshooting

### Build Failures

1. **Out of Memory**: If you encounter out-of-memory errors during build, increase the Node.js memory limit:
   ```bash
   docker build \
     --build-arg DATABASE_TYPE=mysql \
     --build-arg NODE_OPTIONS="--max-old-space-size=8192" \
     -t umami-ip-feature:v2.19.2-mysql .
   ```

2. **Permission Issues**: Ensure Docker has proper permissions to access the build context.

3. **Cache Issues**: Use the `--no-cache` flag if you suspect cached layers are causing issues:
   ```bash
   docker build --no-cache --build-arg DATABASE_TYPE=mysql -t umami-ip-feature:v2.19.2-mysql .
   ```

### Runtime Issues

1. **Database Connection**: Ensure your MySQL database is accessible and the connection string is correct.

2. **Port Conflicts**: Make sure port 3000 is not already in use on your host system.

3. **Environment Variables**: Double-check that all required environment variables are set correctly.