# Multi-stage Dockerfile for Granola CLI
# Supports development, production, and devcontainer environments

# =============================================================================
# Base stage - Common dependencies
# =============================================================================
FROM node:20-alpine AS base

WORKDIR /app

# Install common dependencies
RUN apk add --no-cache \
    git \
    curl \
    wget \
    bash \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# =============================================================================
# Development stage - For devcontainer and local development
# =============================================================================
FROM base AS development

# Install development tools
RUN apk add --no-cache \
    zsh \
    sudo \
    shadow \
    openssh-client \
    && rm -rf /var/cache/apk/*

# Install Oh My Zsh for better development experience
RUN sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# Configure node user for development
RUN echo 'node ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers && \
    chsh -s /bin/zsh node

# Set up Oh My Zsh for the development user
USER node
RUN sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
USER root

# Install global development tools
RUN npm install -g typescript ts-node nodemon

# Install all dependencies including dev dependencies
RUN npm install

# Copy source code
COPY . .

# Set appropriate permissions
RUN chown -R node:node /app

# Create mount point for Granola config
RUN mkdir -p /granola-config && \
    chown node:node /granola-config

# Switch to development user
USER node

# Set zsh as default shell
SHELL ["/bin/zsh", "-c"]

# Default command for development
CMD ["sleep", "infinity"]

# =============================================================================
# Builder stage - For production builds
# =============================================================================
FROM base AS builder

# Install production dependencies only
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove development files and clean up
RUN rm -rf src/ *.md tsconfig.json .git* && \
    rm -rf node_modules/@types/

# =============================================================================
# Production stage - Optimized for production deployment
# =============================================================================
FROM node:20-alpine AS production

# Install security updates and runtime dependencies
RUN apk --no-cache upgrade && \
    apk --no-cache add dumb-init && \
    rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S granola -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=granola:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=granola:nodejs /app/bin ./bin
COPY --from=builder --chown=granola:nodejs /app/package.json ./

# Create mount point for Granola config
RUN mkdir -p /granola-config && \
    chown granola:nodejs /granola-config

# Link CLI globally
RUN npm link

# Switch to non-root user
USER granola

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "process.exit(0)" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Default command
CMD ["granola", "--help"]

# =============================================================================
# Simple stage - Basic setup for simple deployments
# =============================================================================
FROM base AS simple

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Link CLI globally for container usage
RUN npm link

# Create mount point for Granola config
RUN mkdir -p /granola-config

# Default entrypoint
ENTRYPOINT ["node", "bin/granola.js"]