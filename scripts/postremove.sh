#!/bin/bash
# BigDeck Post-Removal Script

set -e

echo "BigDeck: Running post-removal cleanup..."

# Remove udev rules
UDEV_RULES="/etc/udev/rules.d/70-streamdeck.rules"
if [ -f "$UDEV_RULES" ]; then
    echo "Removing udev rules..."
    rm -f "$UDEV_RULES"
    udevadm control --reload-rules 2>/dev/null || true
fi

# Remove desktop entry
rm -f /usr/share/applications/bigdeck.desktop

# Remove icons
for size in 16 24 32 48 64 128 256 512; do
    rm -f "/usr/share/icons/hicolor/${size}x${size}/apps/bigdeck.png"
done
gtk-update-icon-cache /usr/share/icons/hicolor 2>/dev/null || true

# Remove systemd service
if [ -f "/usr/lib/systemd/user/bigdeck.service" ]; then
    echo "Removing systemd service..."
    rm -f /usr/lib/systemd/user/bigdeck.service
    systemctl daemon-reload 2>/dev/null || true
fi

# Note: We don't remove user config in ~/.config/bigdeck
# to preserve user profiles and settings

echo "BigDeck removal complete."
echo "Note: User configuration in ~/.config/bigdeck was preserved."

exit 0
