#!/bin/bash
# BigDeck Development Script
# Starts the app in development mode with hot-reload

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "======================================"
echo "BigDeck Development Mode"
echo "======================================"

# Check dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build main process once (it doesn't hot-reload)
echo "Building main process..."
npm run build:main
npm run build:preload

# Start development servers
echo ""
echo "Starting development servers..."
echo "  - Vite dev server (renderer): http://localhost:5173"
echo "  - Electron app will launch shortly"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Run Vite and Electron concurrently
# Vite serves the renderer, Electron loads from localhost:5173 in dev mode
npx concurrently \
    --names "VITE,ELECTRON" \
    --prefix-colors "cyan,yellow" \
    "npm run dev:renderer" \
    "sleep 3 && npm run start:dev"
