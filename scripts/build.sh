#!/bin/bash
# BigDeck Build Script
# Builds the application and packages it as .deb and AppImage

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "======================================"
echo "BigDeck Build Script"
echo "======================================"
echo ""

# Check for required tools
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo "Error: $1 is required but not installed."
        exit 1
    fi
}

check_command node
check_command npm

# Get Node.js version
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"

# Parse arguments
BUILD_TYPE="all"
SKIP_INSTALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --deb)
            BUILD_TYPE="deb"
            shift
            ;;
        --appimage)
            BUILD_TYPE="appimage"
            shift
            ;;
        --skip-install)
            SKIP_INSTALL=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --deb          Build only .deb package"
            echo "  --appimage     Build only AppImage"
            echo "  --skip-install Skip npm install"
            echo "  --help         Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Install dependencies
if [ "$SKIP_INSTALL" = false ]; then
    echo ""
    echo "Installing dependencies..."
    npm ci || npm install
fi

# Clean previous builds
echo ""
echo "Cleaning previous builds..."
rm -rf dist release

# Build TypeScript (main process)
echo ""
echo "Building main process..."
npm run build:main

# Build React (renderer process)
echo ""
echo "Building renderer..."
npm run build:renderer

# Package the application
echo ""
echo "Packaging application..."

case $BUILD_TYPE in
    deb)
        echo "Building .deb package..."
        npm run package:deb
        ;;
    appimage)
        echo "Building AppImage..."
        npm run package:appimage
        ;;
    all)
        echo "Building all packages..."
        npm run package
        ;;
esac

# Show results
echo ""
echo "======================================"
echo "Build complete!"
echo "======================================"
echo ""
echo "Output files:"
ls -la release/*.deb release/*.AppImage 2>/dev/null || echo "No packages found in release/"

echo ""
echo "To install the .deb package:"
echo "  sudo dpkg -i release/bigdeck_*.deb"
echo "  sudo apt-get install -f  # Fix any dependency issues"
echo ""
