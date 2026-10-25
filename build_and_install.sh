#!/bin/bash
set -e

echo "➡️  Building BigDeck..."
npm run build

echo "➡️  Packaging (.deb)..."
npm run package:deb

echo "➡️  Installing..."
# Find the .deb file in release/ (assuming only one version exists or picking the latest)
DEB_FILE=$(ls release/*.deb | head -n 1)

if [ -z "$DEB_FILE" ]; then
  echo "❌ Error: No .deb file found in release/"
  exit 1
fi

echo "📦 Installing $DEB_FILE..."
sudo dpkg -i "$DEB_FILE"

echo "✅ Done! You can now restart BigDeck."
