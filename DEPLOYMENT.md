# Granola CLI Deployment Guide

## Overview

This guide covers deploying the Granola CLI using Docker Compose for both development and production environments. It emphasizes secure, reproducible workflows and leverages Make commands for convenience.  
For authentication setup, see [`AUTHENTICATION.md`](AUTHENTICATION.md). For project overview and CLI usage, see [`README.md`](README.md).

---

## Quick Start

### Development Deployment

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd granola-cli
   cp .env.example .env
   ```
2. **Configure environment (optional):**
   Edit `.env` to customize paths.
3. **Start development container:**
   ```bash
   make up
   ```
4. **Run CLI commands:**
   ```bash
   make folders
   make notes
   ```
5. **Stop container:**
   ```bash
   make down
   ```

### Production Deployment

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd granola-cli
   cp .env.example .env
   ```
2. **Configure environment (optional):**
   Edit `.env` to customize config paths.
3. **Build and start production container:**
   ```bash
   make prod-up
   ```
4. **Run CLI commands:**
   ```bash
   make prod-folders
   make prod-notes
   ```
5. **Stop container:**
   ```bash
   make prod-down
   ```

---

## Docker Compose Workflows

### Development Environment

- Uses `docker-compose.yml` and `docker-compose.override.yml` (auto-loaded).
- Source code is mounted for live reload.
- Config directory is mounted read-only from host:
  ```yaml
  volumes:
    - "${HOME}/Library/Application Support/Granola:/granola-config:ro"
    - .:/app:cached
  ```
- Health checks and logs available via Make commands.

### Production Environment

- Uses `docker-compose.yml` + `docker-compose.prod.yml`.
- Optimized, secure multi-stage build (`Dockerfile.prod`).
- Config directory mounted read-only:
  ```yaml
  volumes:
    - "${GRANOLA_CONFIG_PATH:-${HOME}/Library/Application Support/Granola}:/granola-config:ro"
  ```
- Runs as non-root user, with resource limits and security hardening.
- Health checks, logging, and resource monitoring enabled.

### Configuration

- **Environment variables:**  
  | Variable              | Description        | Default       |
  |-----------------------|--------------------|---------------|
  | `NODE_ENV`            | Node environment   | `production`  |
  | `GRANOLA_CONFIG_PATH` | Custom config path | Auto-detected |
  | `DEBUG`               | Debug logging      | Disabled      |

- **Resource limits:**  
  - Development: 256MB memory, 0.5 CPU  
  - Production: 128MB memory, 0.25 CPU

---

## Docker Commands Reference

| Command                                                    | Description                      |
|------------------------------------------------------------|----------------------------------|
| `docker compose --profile development up --build`         | Start development container      |
| `docker compose --profile production up --build -d`       | Start production container       |
| `docker compose down`                                      | Stop containers                  |
| `docker compose logs -f`                                   | View logs                        |
| `docker compose exec granola-cli-dev sh`                  | Access development shell         |
| `docker compose exec granola-cli-prod sh`                 | Access production shell          |
| `docker compose exec granola-cli-dev granola folders`     | List folders (development)       |
| `docker compose exec granola-cli-prod granola folders`    | List folders (production)        |
| `docker compose exec granola-cli-dev granola notes`       | List notes (development)         |
| `docker compose exec granola-cli-prod granola notes`      | List notes (production)          |
| `docker compose ps`                                        | Check container status           |

### NPM Script Shortcuts

| Command              | Description                      |
|----------------------|----------------------------------|
| `npm run docker:dev` | Start development container      |
| `npm run docker:prod`| Start production container       |
| `npm run docker:stop`| Stop containers                  |
| `npm run docker:logs`| View logs                        |
| `npm run docker:shell`| Access container shell          |

---

## Container Configuration

### Security Features

- Runs as non-root user (`granola`, UID 1001)
- Read-only filesystem and config mounts
- Dropped capabilities, no new privileges
- Resource limits (memory, CPU)
- Proper signal handling (`dumb-init`)
- Isolated bridge network, no exposed ports

### Performance Optimizations

- Multi-stage builds for small images
- Layer caching for fast rebuilds
- Alpine Linux base for minimal attack surface
- Health checks and log rotation

### Resource Management

- Monitor with `docker stats granola-cli-prod`
- Adjust limits in `docker-compose.yml` production profile as needed

---

## Monitoring & Maintenance

### Health Checks

- Built-in health checks (interval: 60s, timeout: 10s, retries: 2)
- Test: `granola --version`
- Check status:
  ```bash
  make health        # Development
  make prod-health   # Production
  ```

### Logging

- Driver: json-file
- Max size: 10MB (dev), 5MB (prod)
- Max files: 3 (dev), 2 (prod)
- View logs:
  ```bash
  make logs         # Development
  make prod-logs    # Production
  ```

### Resource Usage

- Monitor:
  ```bash
  docker stats granola-cli-prod
  ```

### Updates

- Pull latest code and rebuild:
  ```bash
  git pull origin main
  make prod-down
  make prod-build
  make prod-up
  ```

- Clean unused Docker resources:
  ```bash
  docker system prune -f
  ```

---

## Troubleshooting

### Common Issues

- **Authentication fails:**  
  - Check config mount in container:
    ```bash
    make shell         # Dev
    make prod-shell    # Prod
    ls -la /granola-config/
    ```
  - Verify host config permissions:
    ```bash
    ls -la "$HOME/Library/Application Support/Granola/"
    ```
  - See [`AUTHENTICATION.md`](AUTHENTICATION.md) for details.

- **Build fails:**  
  - Clean and rebuild:
    ```bash
    make clean
    make build
    export DOCKER_BUILDKIT=1
    ```

- **Container won't start:**  
  - Check logs:
    ```bash
    make logs         # Dev
    make prod-logs    # Prod
    ```
  - Check health:
    ```bash
    make health
    make prod-health
    ```

- **Resource issues:**  
  - Monitor usage:
    ```bash
    docker stats granola-cli-prod
    ```
  - Adjust limits in compose files.

---

## Best Practices

### Development

1. Use override files for environment-specific config
2. Mount source code for hot reloading
3. Enable debug logging when troubleshooting
4. Use Make commands for consistency

### Production

1. Use production Dockerfile for optimized builds
2. Set resource limits to prevent exhaustion
3. Enable health checks for monitoring
4. Use read-only mounts for security
5. Monitor logs regularly

### Security

1. Never run as root in production
2. Use read-only filesystems when possible
3. Limit capabilities to minimum required
4. Mount volumes read-only when possible
5. Regularly update base images

---

For more details, see [`README.md`](README.md), [`AUTHENTICATION.md`](AUTHENTICATION.md), and [`CLI_SETUP.md`](CLI_SETUP.md).
