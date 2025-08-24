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

Turnstile is now configured through the Umami admin interface instead of environment variables. Here's how to set it up:

### Step 1: Deploy Umami

Deploy Umami using Docker as usual. No Turnstile environment variables are needed:

```yaml
# docker-compose.yml
environment:
  DATABASE_URL: postgresql://umami:umami@db:5432/umami
  DATABASE_TYPE: postgresql
  APP_SECRET: your-random-secret-string-here
```

### Step 2: Configure Turnstile in Admin Settings

1. Start your Umami instance
2. Log in with an admin account
3. Navigate to Settings → Admin Settings
4. Enable the "Enable Turnstile" toggle
5. Enter your Turnstile Site Key and Secret Key
6. Click Save

### Using Podman

1. Copy `podman-compose.yml` and `env.sample` to your server
2. Rename `env.sample` to `.env`
3. Update only the required environment variables:

```bash
# Database Configuration
DATABASE_URL=postgresql://umami:replace-me-with-a-random-string@db:5432/umami
DATABASE_TYPE=postgresql
APP_SECRET=replace-me-with-a-random-string

# Postgres Configuration
POSTGRES_DB=umami
POSTGRES_USER=umami
POSTGRES_PASSWORD=replace-me-with-a-random-string
```

Note: Turnstile environment variables are no longer required and can be omitted.

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

1. Check that Turnstile is enabled in Admin Settings
2. Verify that your Site Key is correctly entered and valid
3. Check browser console for any errors
4. Ensure you have saved the settings after entering the keys

### Login Always Fails with Turnstile Error

1. Verify that your Secret Key matches your Cloudflare dashboard
2. Ensure your server can reach `https://challenges.cloudflare.com`
3. Check the application logs for detailed error messages
4. Make sure both Site Key and Secret Key are properly saved in admin settings

### How to Disable Turnstile

If you want to disable Turnstile verification:

1. Log in with an admin account
2. Navigate to Settings → Admin Settings
3. Disable the "Enable Turnstile" toggle
4. Click Save
5. The login form will work without verification

### Lost Your Turnstile Keys?

If you've lost your Turnstile keys:

1. Log in to your Cloudflare dashboard
2. Navigate to Turnstile section
3. Find your widget or create a new one
4. Update the keys in Umami admin settings

## Security Considerations

- Never commit your Turnstile keys to version control
- Your Secret Key is stored encrypted in the database and is never exposed to the frontend
- Regularly rotate your keys if you suspect they might be compromised
- Monitor your Cloudflare dashboard for unusual activity
- Only admin users can access and modify Turnstile settings

## Support

If you encounter issues:

1. Check the Umami [GitHub Issues](https://github.com/umami-software/umami/issues)
2. Review Cloudflare [Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
3. Ensure you're using the latest version of Umami