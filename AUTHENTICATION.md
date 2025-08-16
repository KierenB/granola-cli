# Granola CLI Authentication Guide

## Overview

Granola CLI uses dynamic token reading from the Granola desktop app’s configuration file. Tokens rotate automatically every ~24 hours, so the CLI always uses the latest token. This guide covers authentication methods, configuration, container usage, troubleshooting, and security best practices.

For setup and deployment, see:
- [CLI Overview](README.md)
- [Deployment Guide](DEPLOYMENT.md)

## Authentication Methods

The CLI reads your access token from the Granola app’s `supabase.json` config file. No manual token management is required.

**Default macOS Config Location:**
```
~/Library/Application Support/Granola/supabase.json
```

### Custom Config Path

To use a different config file location, set:
```bash
export GRANOLA_CONFIG_PATH="/path/to/your/supabase.json"
granola folders
```

### File Search Order

The CLI searches for the config file in this order:
1. `$GRANOLA_CONFIG_PATH` environment variable
2. `/granola-config/supabase.json` (container mount)
3. `~/granola-config/supabase.json` (alternative mount)
4. `~/Library/Application Support/Granola/supabase.json` (native macOS)

### Token File Structure

Example `supabase.json`:
```json
{
  "cognito_tokens": {
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "...",
    "id_token": "..."
  }
}
```
The CLI extracts `access_token` for API authentication.

## Configuration

### DevContainer (Development)

The devcontainer mounts your host Granola config automatically:
```json
"mounts": [
  "source=${localEnv:HOME}/Library/Application Support/Granola,target=/granola-config,type=bind,consistency=cached"
]
```
Rebuilding the devcontainer ensures access to live authentication.

### Production Container

Mount your host config directory:
```bash
docker run --rm -it \
  -v "$HOME/Library/Application Support/Granola:/granola-config:ro" \
  granola-cli folders
```
Always use `:ro` for read-only access.

## Container Authentication

- The CLI detects `/granola-config/supabase.json` inside containers.
- For custom setups, set `GRANOLA_CONFIG_PATH` as above.
- See [Deployment Guide](DEPLOYMENT.md) for more on containerization.

## Troubleshooting

### "Not authenticated" Error

1. Ensure the Granola app is running and you are logged in.
2. Verify the container can access `/granola-config/supabase.json`.
3. Check file permissions (read access required).

### Container/DevContainer Issues

- Rebuild the container to refresh mounts.
- Run `echo $HOME` in your host terminal to verify the path.
- Ensure Granola is installed in the standard location.
- Test file access in the container:
  ```bash
  docker run --rm -it \
    -v "$HOME/Library/Application Support/Granola:/granola-config:ro" \
    your-image \
    ls -la /granola-config/
  ```
  You should see `supabase.json`.

### Debugging

The CLI logs which config path it checks:
```bash
granola folders
# Look for "Checking for Granola config at: ..." messages
```

## Security Best Practices

- Always use `:ro` for production container mounts.
- Protect config file permissions; tokens are sensitive.
- Tokens are only accessible inside the container.
- No manual token copying—tokens never leave your machine.

## Additional Resources

- [CLI Overview](README.md)
- [Deployment Guide](DEPLOYMENT.md)
