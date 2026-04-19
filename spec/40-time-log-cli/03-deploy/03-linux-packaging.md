# Time Log CLI: Linux Packaging

**Version:** 1.0.0  
**Updated:** 2026-03-27

---

## Overview

Linux deployment via DEB/RPM packages, systemd user service, AppImage, and AUR. Supports both X11 and Wayland display servers.

---

## Installation Methods

| Method | Distro Family | Admin Required |
|--------|--------------|---------------|
| `.deb` package | Debian, Ubuntu, Mint | Yes |
| `.rpm` package | Fedora, RHEL, openSUSE | Yes |
| AppImage | Any (portable) | No |
| Snap | Any (snap-enabled) | Yes |
| AUR | Arch, Manjaro | Yes |
| Tarball | Any (manual) | No |

---

## DEB Package

### Package Metadata

```
Package: timelog-cli
Version: 1.0.0
Architecture: amd64
Maintainer: TimeLog Team <team@timelog.dev>
Description: Cross-platform OS-level activity tracker
 Time Log CLI monitors browser activity, application usage,
 click events, and captures periodic screenshots for
 productivity analysis.
Section: utils
Priority: optional
Depends: libx11-6 (>= 1.6), libxss1
Recommends: libwebp-dev
Suggests: timelog-browser-extension
```

### Installation Layout

```
/usr/bin/timelog                                    # Binary
/usr/lib/systemd/user/timelog.service               # systemd unit
/usr/share/doc/timelog-cli/README.md                 # Documentation
/usr/share/doc/timelog-cli/LICENSE                   # License
/usr/share/man/man1/timelog.1.gz                     # Man page
/usr/share/applications/timelog.desktop              # Desktop entry (optional)
/etc/timelog/config.toml.example                     # Example config
```

### User Data Directory

```
~/.config/timelog/config.toml        # User configuration
~/.local/share/timelog/
├── timelog.db                       # SQLite database
└── screenshots/                     # Screenshot storage
```

### Build Script

```bash
#!/bin/bash
set -euo pipefail

VERSION="${1:?Usage: build-deb.sh <version>}"
ARCH="amd64"
PACKAGE_NAME="timelog-cli_${VERSION}_${ARCH}"

mkdir -p "${PACKAGE_NAME}/DEBIAN"
mkdir -p "${PACKAGE_NAME}/usr/bin"
mkdir -p "${PACKAGE_NAME}/usr/lib/systemd/user"
mkdir -p "${PACKAGE_NAME}/usr/share/doc/timelog-cli"
mkdir -p "${PACKAGE_NAME}/usr/share/man/man1"
mkdir -p "${PACKAGE_NAME}/etc/timelog"

cp target/release/timelog "${PACKAGE_NAME}/usr/bin/"
cp deploy/systemd/timelog.service "${PACKAGE_NAME}/usr/lib/systemd/user/"
cp README.md LICENSE "${PACKAGE_NAME}/usr/share/doc/timelog-cli/"
cp deploy/man/timelog.1.gz "${PACKAGE_NAME}/usr/share/man/man1/"
cp deploy/config.toml.example "${PACKAGE_NAME}/etc/timelog/"

# Control file
cat > "${PACKAGE_NAME}/DEBIAN/control" << EOF
Package: timelog-cli
Version: ${VERSION}
Architecture: ${ARCH}
Maintainer: TimeLog Team <team@timelog.dev>
Description: Cross-platform OS-level activity tracker
Depends: libx11-6 (>= 1.6), libxss1
EOF

# Post-install script
cat > "${PACKAGE_NAME}/DEBIAN/postinst" << 'EOF'
#!/bin/bash
echo "Time Log CLI installed. To start:"
echo "  systemctl --user enable --now timelog.service"
echo ""
echo "Or run manually: timelog start"
EOF
chmod 755 "${PACKAGE_NAME}/DEBIAN/postinst"

dpkg-deb --build "${PACKAGE_NAME}"
```

---

## RPM Package

### Spec File

```spec
Name:           timelog-cli
Version:        1.0.0
Release:        1%{?dist}
Summary:        Cross-platform OS-level activity tracker
License:        MIT
URL:            https://github.com/timelog/timelog-cli

%description
Time Log CLI monitors browser activity, application usage,
click events, and captures periodic screenshots.

%install
install -Dm755 timelog %{buildroot}/usr/bin/timelog
install -Dm644 timelog.service %{buildroot}/usr/lib/systemd/user/timelog.service
install -Dm644 config.toml.example %{buildroot}/etc/timelog/config.toml.example

%files
/usr/bin/timelog
/usr/lib/systemd/user/timelog.service
/etc/timelog/config.toml.example

%post
echo "Run: systemctl --user enable --now timelog.service"
```

---

## systemd User Service

```ini
# /usr/lib/systemd/user/timelog.service
[Unit]
Description=Time Log Activity Tracker
Documentation=https://github.com/timelog/timelog-cli
After=graphical-session.target
Wants=graphical-session.target

[Service]
Type=simple
ExecStart=/usr/bin/timelog --daemon
ExecStop=/usr/bin/timelog stop
Restart=on-failure
RestartSec=5
Environment=DISPLAY=:0
Environment=XDG_RUNTIME_DIR=/run/user/%U

# Resource limits
MemoryMax=100M
CPUQuota=5%

[Install]
WantedBy=default.target
```

### Service Management

```bash
# Enable and start
systemctl --user enable --now timelog.service

# Check status
systemctl --user status timelog.service

# View logs
journalctl --user -u timelog.service -f

# Stop
systemctl --user stop timelog.service

# Disable autostart
systemctl --user disable timelog.service
```

---

## AppImage (Portable)

```bash
# AppImage build using linuxdeploy
linuxdeploy \
  --appdir AppDir \
  --executable target/release/timelog \
  --desktop-file deploy/timelog.desktop \
  --icon-file deploy/timelog.png \
  --output appimage

# User runs:
chmod +x TimeLog-x86_64.AppImage
./TimeLog-x86_64.AppImage --daemon
```

### Desktop Entry

```ini
[Desktop Entry]
Name=Time Log CLI
Comment=OS-level activity tracker
Exec=timelog --daemon
Icon=timelog
Type=Application
Categories=Utility;
StartupNotify=false
Terminal=false
```

---

## AUR Package (Arch Linux)

```bash
# PKGBUILD
pkgname=timelog-cli-bin
pkgver=1.0.0
pkgrel=1
pkgdesc="Cross-platform OS-level activity tracker"
arch=('x86_64')
url="https://github.com/timelog/timelog-cli"
license=('MIT')
depends=('libx11' 'libxss')
optdepends=('libpipewire: Wayland screenshot support')

source=("https://github.com/timelog/timelog-cli/releases/download/v${pkgver}/timelog-v${pkgver}-linux-x64.tar.gz")
sha256sums=('SKIP')

package() {
  install -Dm755 timelog "${pkgdir}/usr/bin/timelog"
  install -Dm644 timelog.service "${pkgdir}/usr/lib/systemd/user/timelog.service"
}
```

---

## Wayland Considerations

| Feature | X11 | Wayland |
|---------|-----|---------|
| Window tracking | `_NET_ACTIVE_WINDOW` | `wlr-foreign-toplevel` or DBus |
| Screen capture | `XGetImage` | PipeWire / `xdg-desktop-portal` |
| Click hooks | `XRecord` | `libinput` (requires `input` group) |
| Idle detection | `XScreenSaverQueryInfo` | `logind` DBus `IdleHint` |

### Wayland Permissions

```bash
# Add user to input group for click tracking on Wayland
sudo usermod -aG input $USER
# Requires logout/login to take effect

# Grant PipeWire screen capture (usually granted via portal dialog)
# No manual configuration needed — user is prompted on first capture
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Build Pipeline | `./01-build-pipeline.md` |
| OS Integration (Linux APIs) | `../01-backend/02-os-integration.md` |
