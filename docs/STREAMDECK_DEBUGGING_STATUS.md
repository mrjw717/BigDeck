# Stream Deck Debugging Status (Paused)
**Date:** 2025-12-19
**Status:** In Progress / Unresolved

## Executive Summary
We have been debugging critical issues with Stream Deck integration (Visuals, Multi-triggering, and Row Mapping). While significant code changes were made to address hardware quirks, the issues are reported as **not completely resolved**. Work is being paused.

## Current State

### Hardware Identified
- **Device**: Stream Deck XL (`CL10K1A01679`)
- **Previous Assumption**: Original V1 (based on visual artifact descriptions).
- **Core Conflict**: The application was initially sending 72x72px images (V1 spec) to a 96x96px device (XL spec), and potentially using the wrong image format (Raw vs JPEG).

### Attempted Fixes (Implemented)
1.  **USB Flood Protection**:
    -   Added a `50ms` delay between key image updates in `src/main/index.ts`.
    -   *Hypothesis*: The XL device driver crashes if 32 keys are updated instantly.
2.  **Auto-Profile Logic**:
    -   Added logic to detect Profile/Device mismatch and auto-switch to an XL profile.
    -   *Goal*: Ensure all 32 keys are mapped/addressable, fixing the "Bottom Row Only" issue.
3.  **Visual Artifacts**:
    -   Implemented logic to send **JPEG** to XL devices and **Raw BGR** to V1 devices.
    -   *Goal*: Fix "static columns" artifacts.
4.  **Debouncing**:
    -   Increased Hardware Debounce to `500ms`.
    -   Increased Action Debounce to `1000ms`.
    -   *Goal*: Stop "1 press = 10 actions" executions.

## Remaining / Known Issues
The user reports the system is **still not working completely**. Potential causes to investigate next:
-   **Device Driver/HID Lock**: The `device error: could not read from HID` logs suggest a deeper driver-level instability or conflict with another process (e.g. `streamdeck-ui` or another service grabbing the PID).
-   **Profile Persistence**: The auto-switch logic might be fighting with a stored default profile.
-   **Image Format Details**: The specific JPEG quality settings or packet size might still be rejected by the XL firmware.

## Next Steps (When Resuming)
1.  **Isolate Hardware**: Test with a minimal script (outside Electron) to verify if the physical hardware is healthy and accessible.
2.  **Verify Profile**: Manually inspect `~/.config/bigdeck/profiles.json` to ensure a valid XL profile exists.
3.  **Check Permissions**: Verify udev rules are strictly applied and no other user processes are locking the HID device.
