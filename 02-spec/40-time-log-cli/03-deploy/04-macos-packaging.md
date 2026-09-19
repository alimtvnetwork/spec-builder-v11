# Time Log CLI: macOS Packaging

**Version:** 1.0.0  
**Updated:** 2026-03-27

---

## Overview

macOS deployment via Homebrew, DMG disk image, and direct download. Handles code signing, notarization, and Gatekeeper compliance.

---

## Installation Methods

| Method | Use Case | Admin Required |
|--------|----------|---------------|
| Homebrew | Developer-preferred, auto-updates | No |
| DMG installer | GUI-based drag-and-drop install | No |
| Tarball | Manual installation | No |
| MacPorts | Alternative package manager | Yes |

---

## Homebrew Formula

```ruby
class TimelogCli < Formula
  desc "Cross-platform OS-level activity tracker"
  homepage "https://github.com/timelog/timelog-cli"
  version "1.0.0"
  license "MIT"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/timelog/timelog-cli/releases/download/v1.0.0/timelog-v1.0.0-macos-arm64.tar.gz"
      sha256 "<SHA256_ARM64>"
    else
      url "https://github.com/timelog/timelog-cli/releases/download/v1.0.0/timelog-v1.0.0-macos-x64.tar.gz"
      sha256 "<SHA256_X64>"
    end
  end

  def install
    bin.install "timelog"
    man1.install "timelog.1"
  end

  service do
    run [opt_bin/"timelog", "--daemon"]
    keep_alive true
    log_path var/"log/timelog.log"
    error_log_path var/"log/timelog-error.log"
  end

  def caveats
    <<~EOS
      Time Log CLI requires macOS permissions:

      1. System Preferences → Privacy & Security → Accessibility
         Grant access to "timelog" for window tracking

      2. System Preferences → Privacy & Security → Screen Recording
         Grant access to "timelog" for screenshot capture

      To start the background service:
        brew services start timelog-cli

      Or run manually:
        timelog start
    EOS
  end

  test do
    assert_match "timelog #{version}", shell_output("#{bin}/timelog version")
  end
end
```

### Installation

```bash
# Install via Homebrew tap
brew tap timelog/tap
brew install timelog-cli

# Start as service
brew services start timelog-cli

# Check status
timelog status
```

---

## DMG Disk Image

### DMG Layout

```
TimeLog-v1.0.0.dmg
├── Time Log.app/               # Application bundle (optional launcher)
│   └── Contents/
│       ├── Info.plist
│       ├── MacOS/
│       │   └── timelog          # Binary
│       └── Resources/
│           └── timelog.icns     # App icon
├── Install CLI →               # Symlink to /usr/local/bin installer script
├── README.md
└── .background/
    └── installer-bg.png        # DMG background image
```

### DMG Build Script

```bash
#!/bin/bash
set -euo pipefail

VERSION="${1:?Usage: build-dmg.sh <version>}"
DMG_NAME="TimeLog-v${VERSION}"

# Create staging directory
STAGING="/tmp/${DMG_NAME}"
rm -rf "${STAGING}"
mkdir -p "${STAGING}"

# Copy binary
cp target/release/timelog "${STAGING}/"
cp README.md LICENSE "${STAGING}/"

# Create install script
cat > "${STAGING}/install.sh" << 'SCRIPT'
#!/bin/bash
set -e
INSTALL_DIR="/usr/local/bin"
cp "$(dirname "$0")/timelog" "${INSTALL_DIR}/timelog"
chmod +x "${INSTALL_DIR}/timelog"
echo "✅ Time Log CLI installed to ${INSTALL_DIR}/timelog"
echo "Run 'timelog start' to begin tracking."
SCRIPT
chmod +x "${STAGING}/install.sh"

# Create DMG
hdiutil create -volname "${DMG_NAME}" \
  -srcfolder "${STAGING}" \
  -ov -format UDZO \
  "${DMG_NAME}.dmg"

echo "✅ Created ${DMG_NAME}.dmg"
```

---

## LaunchAgent (Autostart)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>dev.timelog.cli</string>

    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/timelog</string>
        <string>--daemon</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
    </dict>

    <key>StandardOutPath</key>
    <string>/tmp/timelog.stdout.log</string>

    <key>StandardErrorPath</key>
    <string>/tmp/timelog.stderr.log</string>

    <key>ProcessType</key>
    <string>Background</string>

    <key>LowPriorityBackgroundIO</key>
    <true/>

    <key>Nice</key>
    <integer>10</integer>
</dict>
</plist>
```

### Service Management

```bash
# Install LaunchAgent
timelog install
# Copies plist to ~/Library/LaunchAgents/dev.timelog.cli.plist

# Load and start
launchctl load ~/Library/LaunchAgents/dev.timelog.cli.plist

# Check status
launchctl list | grep timelog

# Stop and unload
launchctl unload ~/Library/LaunchAgents/dev.timelog.cli.plist

# Uninstall
timelog uninstall
```

---

## Code Signing & Notarization

### Code Signing

```bash
# Sign the binary with Developer ID
codesign --force --options runtime \
  --sign "Developer ID Application: TimeLog (TEAM_ID)" \
  --timestamp \
  target/release/timelog

# Verify signature
codesign --verify --verbose target/release/timelog
```

### Notarization

```bash
# Create ZIP for notarization
ditto -c -k --keepParent target/release/timelog timelog.zip

# Submit for notarization
xcrun notarytool submit timelog.zip \
  --apple-id "developer@timelog.dev" \
  --team-id "TEAM_ID" \
  --password "@keychain:AC_PASSWORD" \
  --wait

# Staple the notarization ticket (for DMG)
xcrun stapler staple TimeLog-v1.0.0.dmg
```

### Gatekeeper Compliance

| Requirement | Status |
|-------------|--------|
| Code signed with Developer ID | ✅ Required |
| Notarized with Apple | ✅ Required |
| Hardened runtime enabled | ✅ Required |
| Entitlements declared | ✅ Required |

### Entitlements

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Required for CGEventTap (click tracking) -->
    <key>com.apple.security.automation.apple-events</key>
    <true/>
</dict>
</plist>
```

---

## macOS Permissions Guide

Users must manually grant these permissions on first run:

| Permission | Location | Required For |
|------------|----------|-------------|
| Accessibility | Privacy & Security → Accessibility | Window tracking, click capture |
| Screen Recording | Privacy & Security → Screen Recording | Screenshot capture |
| Automation | Privacy & Security → Automation | Safari tab detection (AppleScript) |

### Programmatic Permission Check

```rust
#[cfg(target_os = "macos")]
pub fn check_accessibility_permission() -> bool {
    // AXIsProcessTrustedWithOptions
    // Returns true if accessibility access is granted
    unsafe {
        let options = CFDictionaryCreate(/* kAXTrustedCheckOptionPrompt: true */);
        AXIsProcessTrustedWithOptions(options)
    }
}
```

The CLI prompts the user on first run:

```
$ timelog start

⚠️  Time Log CLI requires macOS permissions to function:

  1. Accessibility  — needed for window and click tracking
     → System Preferences → Privacy & Security → Accessibility → Add "timelog"

  2. Screen Recording — needed for screenshot capture
     → System Preferences → Privacy & Security → Screen Recording → Add "timelog"

Press Enter after granting permissions, or Ctrl+C to skip...
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Build Pipeline | `./01-build-pipeline.md` |
| OS Integration (macOS APIs) | `../01-backend/02-os-integration.md` |
| Screenshot Capture | `../01-backend/04-screenshot-capture.md` |
