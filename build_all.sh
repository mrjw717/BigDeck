#!/bin/bash

# BigDeck Build Script - Builds all packages for all platforms
# Usage: ./build_all.sh [options]
#   --linux-only     Build only Linux packages
#   --windows-only   Build only Windows packages (requires wine on Linux)
#   --mac-only       Build only macOS packages (requires macOS)
#   --skip-build     Skip npm build step (use existing dist/)
#   --arch=x64       Build only x64 architecture
#   --arch=arm64     Build only arm64 architecture

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

VERSION=$(node -p "require('./package.json').version")
OUTPUT_DIR="release"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}  BigDeck Build Script v${VERSION}${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Parse arguments
BUILD_LINUX=true
BUILD_WINDOWS=false
BUILD_MAC=false
SKIP_BUILD=false
ARCH=""

for arg in "$@"; do
  case $arg in
    --linux-only)
      BUILD_WINDOWS=false
      BUILD_MAC=false
      ;;
    --windows-only)
      BUILD_LINUX=false
      BUILD_WINDOWS=true
      BUILD_MAC=false
      ;;
    --mac-only)
      BUILD_LINUX=false
      BUILD_WINDOWS=false
      BUILD_MAC=true
      ;;
    --skip-build)
      SKIP_BUILD=true
      ;;
    --arch=*)
      ARCH="${arg#*=}"
      ;;
  esac
done

# Detect OS
OS="$(uname -s)"
case "${OS}" in
  Linux*)     MACHINE="Linux";;
  Darwin*)    MACHINE="Mac";;
  CYGWIN*)    MACHINE="Cygwin";;
  MINGW*)     MACHINE="MinGw";;
  *)          MACHINE="UNKNOWN:${OS}"
esac

echo -e "${YELLOW}Detected OS: ${MACHINE}${NC}"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  npm install
fi

# Build TypeScript and Vite
if [ "$SKIP_BUILD" = false ]; then
  echo -e "${GREEN}Building application...${NC}"
  npm run build
  echo ""
fi

# Create output directory
mkdir -p ${OUTPUT_DIR}

# Get arch flags for electron-builder
get_arch_flags() {
  if [ -n "$ARCH" ]; then
    echo "--$ARCH"
  else
    echo ""
  fi
}

ARCH_FLAGS=$(get_arch_flags)

# Linux Builds
if [ "$BUILD_LINUX" = true ]; then
  echo -e "${GREEN}=====================================${NC}"
  echo -e "${GREEN}  Building Linux Packages${NC}"
  echo -e "${GREEN}=====================================${NC}"
  
  # DEB package (Debian/Ubuntu)
  echo -e "${BLUE}Building DEB package...${NC}"
  npx electron-builder --linux deb ${ARCH_FLAGS}
  echo -e "${GREEN}✓ DEB package built${NC}"
  echo ""
  
  # AppImage (Universal Linux)
  echo -e "${BLUE}Building AppImage...${NC}"
  npx electron-builder --linux AppImage ${ARCH_FLAGS}
  echo -e "${GREEN}✓ AppImage built${NC}"
  echo ""
  
  # RPM package (Red Hat/Fedora)
  echo -e "${BLUE}Building RPM package...${NC}"
  npx electron-builder --linux rpm ${ARCH_FLAGS} || echo -e "${YELLOW}⚠ RPM build failed (may require rpm tools)${NC}"
  echo ""
  
  # Snap package (optional)
  # echo -e "${BLUE}Building Snap package...${NC}"
  # npx electron-builder --linux snap ${ARCH_FLAGS} || echo -e "${YELLOW}⚠ Snap build failed${NC}"
  
  # Tarball (portable)
  echo -e "${BLUE}Building tar.gz portable...${NC}"
  npx electron-builder --linux tar.gz ${ARCH_FLAGS}
  echo -e "${GREEN}✓ Tarball built${NC}"
  echo ""
fi

# Windows Builds (cross-compilation from Linux may require wine)
if [ "$BUILD_WINDOWS" = true ]; then
  echo -e "${GREEN}=====================================${NC}"
  echo -e "${GREEN}  Building Windows Packages${NC}"
  echo -e "${GREEN}=====================================${NC}"
  
  # NSIS Installer
  echo -e "${BLUE}Building Windows installer (NSIS)...${NC}"
  npx electron-builder --win nsis ${ARCH_FLAGS}
  echo -e "${GREEN}✓ Windows installer built${NC}"
  echo ""
  
  # Portable
  echo -e "${BLUE}Building Windows portable...${NC}"
  npx electron-builder --win portable ${ARCH_FLAGS}
  echo -e "${GREEN}✓ Windows portable built${NC}"
  echo ""
  
  # ZIP
  echo -e "${BLUE}Building Windows ZIP...${NC}"
  npx electron-builder --win zip ${ARCH_FLAGS}
  echo -e "${GREEN}✓ Windows ZIP built${NC}"
  echo ""
fi

# macOS Builds (only works on macOS)
if [ "$BUILD_MAC" = true ]; then
  if [ "$MACHINE" != "Mac" ]; then
    echo -e "${RED}✗ macOS builds require running on macOS${NC}"
  else
    echo -e "${GREEN}=====================================${NC}"
    echo -e "${GREEN}  Building macOS Packages${NC}"
    echo -e "${GREEN}=====================================${NC}"
    
    # DMG
    echo -e "${BLUE}Building macOS DMG...${NC}"
    npx electron-builder --mac dmg ${ARCH_FLAGS}
    echo -e "${GREEN}✓ macOS DMG built${NC}"
    echo ""
    
    # ZIP
    echo -e "${BLUE}Building macOS ZIP...${NC}"
    npx electron-builder --mac zip ${ARCH_FLAGS}
    echo -e "${GREEN}✓ macOS ZIP built${NC}"
    echo ""
  fi
fi

# Summary
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  Build Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${BLUE}Output files in ${OUTPUT_DIR}/:${NC}"
ls -lh ${OUTPUT_DIR}/*.{deb,AppImage,rpm,tar.gz,exe,zip,dmg} 2>/dev/null || ls -lh ${OUTPUT_DIR}/
echo ""
echo -e "${YELLOW}To install DEB on Linux:${NC}"
echo "  sudo dpkg -i ${OUTPUT_DIR}/bigdeck_${VERSION}_amd64.deb"
echo ""
echo -e "${YELLOW}To make AppImage executable:${NC}"
echo "  chmod +x ${OUTPUT_DIR}/BigDeck-${VERSION}-x86_64.AppImage"
echo "  ./${OUTPUT_DIR}/BigDeck-${VERSION}-x86_64.AppImage"
echo ""
echo -e "${YELLOW}Don't forget to install udev rules:${NC}"
echo "  sudo cp udev/70-streamdeck.rules /etc/udev/rules.d/"
echo "  sudo udevadm control --reload-rules"
echo "  sudo udevadm trigger"
