#!/bin/bash
# BigDeck Post-Installation Script

set -e

echo "BigDeck: Running post-installation tasks..."

# Install udev rules for Streamdeck access without root
UDEV_RULES_DIR="/etc/udev/rules.d"
UDEV_RULES_FILE="70-streamdeck.rules"
RULES_SOURCE="/opt/BigDeck/resources/udev/${UDEV_RULES_FILE}"

if [ -f "$RULES_SOURCE" ]; then
    echo "Installing udev rules for Streamdeck access..."
    cp "$RULES_SOURCE" "${UDEV_RULES_DIR}/${UDEV_RULES_FILE}"
    chmod 644 "${UDEV_RULES_DIR}/${UDEV_RULES_FILE}"
    
    # Reload udev rules
    udevadm control --reload-rules 2>/dev/null || true
    udevadm trigger 2>/dev/null || true
    
    echo "udev rules installed successfully."
else
    echo "Warning: udev rules file not found at $RULES_SOURCE"
fi

# Create desktop entry
DESKTOP_FILE="/usr/share/applications/bigdeck.desktop"
cat > "$DESKTOP_FILE" << 'EOF'
[Desktop Entry]
Name=BigDeck
Comment=Streamdeck Controller for Linux
Exec=/opt/BigDeck/bigdeck %U
Icon=bigdeck
Terminal=false
Type=Application
Categories=Utility;System;
Keywords=streamdeck;elgato;hotkey;macro;
StartupWMClass=BigDeck
EOF

# Create icon symlinks
ICON_SOURCE="/opt/BigDeck/resources/app/assets/icons"
if [ -d "$ICON_SOURCE" ]; then
    for size in 16 24 32 48 64 128 256 512; do
        ICON_DIR="/usr/share/icons/hicolor/${size}x${size}/apps"
        mkdir -p "$ICON_DIR"
        if [ -f "${ICON_SOURCE}/${size}x${size}.png" ]; then
            cp "${ICON_SOURCE}/${size}x${size}.png" "${ICON_DIR}/bigdeck.png"
        fi
    done
    
    # Update icon cache
    gtk-update-icon-cache /usr/share/icons/hicolor 2>/dev/null || true
fi

# Install systemd user service (optional)
SYSTEMD_USER_DIR="/usr/lib/systemd/user"
SYSTEMD_SOURCE="/opt/BigDeck/resources/systemd/bigdeck.service"

if [ -f "$SYSTEMD_SOURCE" ] && [ -d "$SYSTEMD_USER_DIR" ]; then
    echo "Installing systemd user service..."
    cp "$SYSTEMD_SOURCE" "${SYSTEMD_USER_DIR}/bigdeck.service"
    chmod 644 "${SYSTEMD_USER_DIR}/bigdeck.service"
    
    # Reload systemd
    systemctl daemon-reload 2>/dev/null || true
fi

# Add current user to plugdev group (if it exists)
if getent group plugdev > /dev/null 2>&1; then
    SUDO_USER="${SUDO_USER:-$USER}"
    if [ -n "$SUDO_USER" ] && [ "$SUDO_USER" != "root" ]; then
        usermod -aG plugdev "$SUDO_USER" 2>/dev/null || true
        echo "Added $SUDO_USER to plugdev group."
        echo "Please log out and back in for group changes to take effect."
    fi
fi

echo ""
echo "======================================"
echo "BigDeck installation complete!"
echo ""
echo "To use your Streamdeck without root:"
echo "  1. Log out and log back in (for group changes)"
echo "  2. Unplug and replug your Streamdeck"
echo ""
echo "To start BigDeck:"
echo "  - Run 'bigdeck' from the terminal"
echo "  - Or launch from your application menu"
echo ""
echo "To enable auto-start as a service:"
echo "  systemctl --user enable bigdeck"
echo "  systemctl --user start bigdeck"
echo "======================================"

exit 0
