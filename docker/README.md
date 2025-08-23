# Docker Deployment Guide

This directory contains Docker configuration files for deploying Umami.

## Quick Start

### Using PostgreSQL (Recommended)

1. Copy the environment file:
   ```bash
   cp .env.docker .env
   ```

2. Edit the `.env` file and update at least the `APP_SECRET`:
   ```bash
   # Generate a random secret
   openssl rand -base64 32
   ```

3. Start the services:
   ```bash
   docker-compose up -d
   ```

4. Access the application at http://localhost:3000

### Using MySQL

1. Copy the environment file:
   ```bash
   cp .env.docker .env
   ```

2. Update the database configuration in `.env`:
   ```bash
   DATABASE_TYPE=mysql
   DATABASE_URL=mysql://umami:umami@db:3306/umami
   ```

3. Start with MySQL configuration:
   ```bash
   docker-compose -f docker-compose.mysql.yml up -d
   ```

## Development Environment

To run in development mode with hot-reloading:

```bash
# This will use docker-compose.override.yml automatically
docker-compose up -d
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_PASSWORD` | PostgreSQL password | `umami` |
| `MYSQL_PASSWORD` | MySQL password | `umami` |
| `APP_SECRET` | Application secret key | *Required* |
| `DATABASE_TYPE` | Database type | `postgresql` |
| `DATABASE_URL` | Database connection string | Auto-generated |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key | - |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key | - |
| `BASE_PATH` | Base path for subdirectory deployment | - |
| `NODE_OPTIONS` | Node.js options | `--max-old-space-size=4096` |

### Volumes

- `umami-db-data`: Persistent database storage
- `umami-data`: Application data (logs, uploads, etc.)

## Health Checks

Both the application and database containers include health checks:

- **Application**: Checks `/api/heartbeat` endpoint
- **PostgreSQL**: Uses `pg_isready`
- **MySQL**: Uses `mysqladmin ping`

## Security Considerations

1. **Always change** the default passwords in production
2. **Generate a strong** `APP_SECRET` value
3. **Use HTTPS** in production
4. **Consider using** a reverse proxy (nginx, traefik)
5. **Enable** Cloudflare Turnstile for bot protection

## Backup and Restore

### PostgreSQL Backup
```bash
docker exec umami-db pg_dump -U umami umami > backup.sql
```

### PostgreSQL Restore
```bash
docker exec -i umami-db psql -U umami umami < backup.sql
```

### MySQL Backup
```bash
docker exec umami-db-mysql mysqldump -u umami -pumami umami > backup.sql
```

### MySQL Restore
```bash
docker exec -i umami-db-mysql mysql -u umami -pumami umami < backup.sql
```

## Troubleshooting

### Common Issues

1. **Database connection errors**: Check database logs and ensure passwords match
2. **Migration failures**: The application handles migrations automatically on startup
3. **High memory usage**: Adjust `NODE_OPTIONS` in docker-compose.yml

### Viewing Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f umami
docker-compose logs -f db

# View recent logs
docker-compose logs --tail=100 umami
```

### Container Shell Access

```bash
# Access application container
docker exec -it umami-app sh

# Access database container
docker exec -it umami-db psql -U umami
# or for MySQL
docker exec -it umami-db-mysql mysql -u umami -p
```

## Scaling

For production deployments, consider:

1. **External database**: Use managed database services
2. **Load balancing**: Multiple app containers behind a load balancer
3. **CDN**: For static assets
4. **Monitoring**: Add Prometheus/Grafana for metrics
5. **Logging**: Centralized logging with ELK stack

## Updates

To update the application:

1. Pull the latest changes
2. Rebuild the image:
   ```bash
   docker-compose build --no-cache
   ```
3. Restart the services:
   ```bash
   docker-compose up -d
   ```

The database migrations will run automatically on startup.