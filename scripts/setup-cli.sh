#!/bin/bash

# Setup script for Granola CLI
# This script sets up the CLI to be globally available

echo "Setting up Granola CLI..."

# Build the project if needed
if [ ! -f "bin/index.js" ]; then
    echo "Building project..."
    npm run build
fi

# Link the CLI globally
echo "Linking CLI globally..."
if sudo npm link; then
    echo "✅ Granola CLI successfully linked!"
    echo "You can now run 'granola' commands from anywhere."
else
    echo "❌ Failed to link CLI globally."
    exit 1
fi

# Verify installation
if command -v granola >/dev/null 2>&1; then
    echo "✅ CLI verification successful!"
    granola --version
else
    echo "❌ CLI verification failed."
    exit 1
fi