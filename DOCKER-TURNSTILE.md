# Docker Deployment with Cloudflare Turnstile

This document explains how to configure Cloudflare Turnstile when deploying Umami with Docker.

## What is Cloudflare Turnstile?

Cloudflare Turnstile is a free, privacy-first CAPTCHA alternative that helps protect your login page from bots and automated attacks while providing a better user experience than traditional CAPTCHAs.

## Prerequisites

Before configuring Turnstile, you need to:

1. Have a Cloudflare account (free tier is sufficient)
2. Create a Turnstile widget at [Cloudflare Dashboard](https://dash.cloudflare.com/?to=/:account/turnstile)
3. Get your Site Key and Secret Key

## Configuration

### Using docker-compose.yml

1. Copy `docker-compose.yml` to your server
2. Update the environment variables in the `umami` service:

```yaml
environment:
  DATABASE_URL: postgresql://umami:umami@db:5432/umami
  DATABASE_TYPE: postgresql
  APP_SECRET: your-random-secret-string-here
  # Cloudflare Turnstile Configuration
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: 1x00000000000000000000AA
  TURNSTILE_SECRET_KEY: 2x0000000000000000000000000000000AA
```

Replace the placeholder values with your actual Turnstile keys.

### Using Podman

1. Copy `podman-compose.yml` and `env.sample` to your server
2. Rename `env.sample` to `.env`
3. Update the environment variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://umami:replace-me-with-a-random-string@db:5432/umami
DATABASE_TYPE=postgresql
APP_SECRET=replace-me-with-a-random-string

# Cloudflare Turnstile Configuration
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key_here
TURNSTILE_SECRET_KEY=your_turnstile_secret_key_here

# Postgres Configuration
POSTGRES_DB=umami
POSTGRES_USER=umami
POSTGRES_PASSWORD=replace-me-with-a-random-string
```

## Starting the Services

### For docker-compose:

```bash
docker-compose up -d
```

### For Podman:

```bash
podman-compose up -d
```

## Verification

1. Open your browser to `http://your-server:3000`
2. Navigate to the login page
3. You should see a Cloudflare Turnstile widget below the password field
4. The login button will be disabled until you complete the Turnstile verification

## Troubleshooting

### Turnstile Widget Not Visible

1. Check that `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is correctly set
2. Ensure your Site Key is valid and not expired
3. Check browser console for any errors

### Login Always Fails with Turnstile Error

1. Verify that `TURNSTILE_SECRET_KEY` matches your Cloudflare dashboard
2. Ensure your server can reach `https://challenges.cloudflare.com`
3. Check the application logs for detailed error messages

### Optional: Disable Turnstile

If you want to disable Turnstile verification:

1. Remove or comment out the Turnstile environment variables
2. Restart the container
3. The login form will work without verification

## Security Considerations

- Never commit your Turnstile keys to version control
- Use environment variables or Docker secrets for sensitive data
- Regularly rotate your keys if you suspect they might be compromised
- Monitor your Cloudflare dashboard for unusual activity

## Support

If you encounter issues:

1. Check the Umami [GitHub Issues](https://github.com/umami-software/umami/issues)
2. Review Cloudflare [Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
3. Ensure you're using the latest version of Umami