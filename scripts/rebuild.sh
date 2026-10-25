#!/usr/bin/env bash
#
# BigDeck automated rebuild + reinstall helper.
# - bumps package.json patch version
# - rebuilds a clean .deb artifact
# - uninstalls existing system package
# - installs the freshly built version

set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

command -v node >/dev/null || { echo "node is required"; exit 1; }
command -v npm >/dev/null || { echo "npm is required"; exit 1; }
command -v dpkg >/dev/null || { echo "dpkg is required (Debian/Ubuntu only)"; exit 1; }

CURRENT_VERSION="$(node -p "require('./package.json').version")"

echo "Current BigDeck version: ${CURRENT_VERSION}"
echo "Incrementing patch version..."
npm version patch --no-git-tag-version >/dev/null
NEW_VERSION="$(node -p "require('./package.json').version")"
echo "New version: ${NEW_VERSION}"

echo "Cleaning previous build artifacts..."
rm -rf dist release

echo "Installing dependencies..."
npm install

echo "Building Debian package..."
npm run package:deb

ARCH="$(dpkg --print-architecture)"
DEB_FILE="release/bigdeck_${NEW_VERSION}_${ARCH}.deb"

if [[ ! -f "$DEB_FILE" ]]; then
  echo "Unable to find ${DEB_FILE}"
  echo "Available artifacts:"
  ls -1 release || true
  exit 1;
fi

echo "Uninstalling previous BigDeck package (if installed)..."
if dpkg -l | grep -q "^ii\s\+bigdeck"; then
  sudo dpkg -r bigdeck
fi

echo "Installing ${DEB_FILE}..."
if ! sudo dpkg -i "$DEB_FILE"; then
  echo "dpkg reported dependency issues, attempting to resolve..."
  sudo apt-get install -f -y
  sudo dpkg -i "$DEB_FILE"
fi

echo ""
echo "BigDeck ${NEW_VERSION} installed successfully."
echo "If your Stream Deck still shows as 'No Device', ensure:"
echo "  - udev rules are installed (npm run udev:install)"
echo "  - you replug the Stream Deck after installation"
echo ""
