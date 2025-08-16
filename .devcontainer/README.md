# DevContainer Setup Guide

This guide covers everything you need to develop Granola CLI in a consistent, containerized environment using VS Code Dev Containers.

---

## Quick Start

1. **Prerequisites:**
   - [VS Code](https://code.visualstudio.com/) with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
   - [Docker Desktop](https://www.docker.com/products/docker-desktop/) running

2. **Open in DevContainer:**
   ```bash
   code .
   # VS Code will prompt: "Reopen in Container"
   # Or use Command Palette: "Dev Containers: Reopen in Container"
   ```

3. **Wait for Setup:**
   - First build: 2–3 minutes (downloads images, installs tools)
   - Subsequent opens: much faster (Docker layer caching)

---

## Configuration Details

- **Base Image:** `node:20-alpine`
- **Shell:** Zsh + Oh My Zsh
- **User:** `node-dev` (non-root, UID:1000)
- **Working Directory:** `/workspaces/granola-cli`
- **VS Code Extensions:** ESLint, Prettier, TypeScript, Tailwind CSS
- **Dev Tools:** TypeScript, Git, curl, wget, etc.
- **Persistent bash history** and auto-formatting on save

**Key Files:**
- [`Dockerfile.dev`](./Dockerfile.dev): DevContainer definition
- [`devcontainer.json`](./devcontainer.json): VS Code container config
- [`README.md`](./README.md): This documentation

For production, see [`../DOCKER.md`](../DOCKER.md).

---

## Development Workflow

- **DevContainer** uses `Dockerfile.dev` for a full-featured dev environment.
- **Production** uses the main `Dockerfile` (minimal, runtime-only).

**Common Commands:**
```bash
# Start development server (watch mode)
npm run dev

# Build the project
npm run build

# Run CLI locally
node bin/granola.js --help

# Test production build
docker build -t granola-cli . && docker run granola-cli --help
```

**Authentication:**  
Ensure you are authenticated with the Granola desktop app for full CLI functionality.

---

## Customization

### Add Development Tools
Edit [`Dockerfile.dev`](./Dockerfile.dev):
```dockerfile
RUN apk add --no-cache your-package-here
```

### VS Code Settings
Edit [`devcontainer.json`](./devcontainer.json) to change:
- Editor settings
- Extensions
- Port forwarding
- Environment variables

### Shell Configuration
- Customize in `~/.zshrc` (persists across rebuilds)
- For permanent changes, edit `Dockerfile.dev`

---

## Troubleshooting

### Container Won't Start
1. Ensure Docker Desktop is running:  
   ```bash
   docker version
   ```
2. Rebuild container:  
   Command Palette → "Dev Containers: Rebuild Container"
3. Check VS Code Dev Containers extension is installed and up-to-date.

### Permission Issues
```bash
# Fix file permissions (in container terminal)
sudo chown -R node-dev:node-dev /workspaces/granola-cli
```

### Docker Credential Errors
- **Problem:**  
  `docker-credential-desktop: executable file not found in $PATH`
- **Solution:**  
  The new setup uses a custom Dockerfile and does NOT require Docker credential helpers or features.  
  - Ensure `devcontainer.json` uses `"dockerFile": "Dockerfile.dev"` and does NOT have a `features` section.
  - Rebuild without cache if issues persist.

### How to Test the Fix
1. **Close Current DevContainer:**  
   Command Palette → "Dev Containers: Reopen Folder Locally"
2. **Reopen in DevContainer:**  
   Command Palette → "Dev Containers: Reopen in Container"
3. **Verify Setup:**  
   ```bash
   node --version      # Should show v20.x.x
   tsc --version       # Should show TypeScript version
   echo $SHELL         # Should show /bin/zsh
   ls ~/.oh-my-zsh     # Should list Oh My Zsh files
   npm run dev         # Should start TypeScript in watch mode
   ```
4. **Verify Production Unchanged:**  
   ```bash
   docker build -t granola-cli .
   docker run granola-cli --help
   ```

### Performance Notes
- **First build:** 2–3 minutes (downloads, installs)
- **Subsequent builds:** 30–60 seconds (Docker cache)
- **Startup:** 10–15 seconds after initial build

### Additional Help
- See [`../README.md`](../README.md) for project overview and development tips.
- For configuration, see [`devcontainer.json`](./devcontainer.json) and [`Dockerfile.dev`](./Dockerfile.dev).

---

## Advanced Usage

### Port Forwarding
Add ports in [`devcontainer.json`](./devcontainer.json):
```json
"forwardPorts": [3000, 8080]
```

### Multiple Containers
For complex setups, use `docker-compose.yml`:
```json
"dockerComposeFile": "docker-compose.dev.yml"
```

### Remote Development
Works with:
- **GitHub Codespaces**
- **Remote SSH**
- **WSL2** (Windows)

---

## Documentation Locations

| Information         | Location                          |
|---------------------|-----------------------------------|
| Quick Start         | [`../README.md`](../README.md)    |
| Detailed Setup      | `.devcontainer/README.md`         |
| Configuration       | `.devcontainer/devcontainer.json` |
| Container Definition| `.devcontainer/Dockerfile.dev`    |

---
