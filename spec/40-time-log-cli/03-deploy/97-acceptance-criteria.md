# Time Log CLI Deploy: Acceptance Criteria

**Version:** 1.0.0  
**Updated:** 2026-03-28

---

## Overview

Acceptance criteria for the Time Log CLI deployment module. Organized by spec file, each criterion defines a testable requirement for release sign-off.

---

## Acceptance Criteria Index

| Group | Source File | Criteria |
|-------|-----------|----------|
| AC-DEPLOY-BUILD | `01-build-pipeline.md` | 01–10 |
| AC-DEPLOY-WIN | `02-windows-installer.md` | 11–19 |
| AC-DEPLOY-LIN | `03-linux-packaging.md` | 20–28 |
| AC-DEPLOY-MAC | `04-macos-packaging.md` | 29–37 |
| AC-DEPLOY-UPDATE | `05-auto-update.md` | 38–46 |

---

## AC-DEPLOY-BUILD — Build Pipeline

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 01 | CI pipeline produces release binaries for all 5 target triples | Cross-compilation failures fail the build |
| 02 | Release profile applies `opt-level = 3`, `lto = "fat"`, `strip = true` | Debug builds excluded from release artifacts |
| 03 | Windows binary < 12 MB, Linux binary < 10 MB, macOS universal < 15 MB | Size regression fails CI with threshold check |
| 04 | Version tag triggers release workflow; PRs trigger test-only workflow | Tags not matching `v*` pattern are ignored |
| 05 | `clippy` and `rustfmt` pass with zero warnings before build stage | `#[allow]` annotations require justification comment |
| 06 | `cargo test` passes on all targets before packaging | Platform-specific tests gated by `#[cfg(target_os)]` |
| 07 | Feature flags (`x11`, `wayland`, `self-update`) compile independently | Invalid flag combinations produce compile-time error |
| 08 | Version string embeds `CARGO_PKG_VERSION`, `GIT_HASH`, and `BUILD_DATE` | `timelog --version` outputs all three fields |
| 09 | Release artifacts include SHA-256 checksums file | Checksum file covers every artifact in the release |
| 10 | GitHub Release is created with changelog from conventional commits | Empty changelog section shows "Maintenance release" |

---

## AC-DEPLOY-WIN — Windows Installer

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 11 | MSI installer places binary in `C:\Program Files\TimeLog\` | Custom install path respected if user overrides |
| 12 | `timelog` added to system PATH after MSI install | PATH entry removed on uninstall |
| 13 | Silent install via `msiexec /i timelog.msi /quiet` completes without UI | Exit code 0 on success, non-zero on failure |
| 14 | Autostart registry entry created in `HKCU\...\Run` during install | User can opt out via installer checkbox |
| 15 | Upgrade install preserves user data in `%LOCALAPPDATA%\TimeLog\` | Downgrade blocked with user-facing error message |
| 16 | Uninstall removes binary and registry entries but preserves user data | `--purge` flag removes user data on uninstall |
| 17 | Portable ZIP runs without installation from any directory | Creates data directory relative to binary or in `%LOCALAPPDATA%` |
| 18 | Windows Service mode (`timelog service install`) registers as a service | Service auto-starts on boot, restarts on crash |
| 19 | `winget install timelog` and `scoop install timelog` both succeed | Package manifests validated in CI |

---

## AC-DEPLOY-LIN — Linux Packaging

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 20 | `.deb` package installs binary to `/usr/bin/timelog` | Depends on `libx11-6`, `libxss1` validated |
| 21 | `.rpm` package installs with correct spec file metadata | `rpm -V timelog-cli` reports no issues |
| 22 | systemd user service starts daemon on login | `systemctl --user status timelog` shows active |
| 23 | systemd service restarts on crash with 5s delay (max 3 retries) | After 3 failures, service stays stopped and logs error |
| 24 | AppImage runs without installation on any distro | Missing `libfuse2` shows actionable error message |
| 25 | Man page installed at `/usr/share/man/man1/timelog.1.gz` | `man timelog` renders correctly |
| 26 | Wayland support enabled with `--features wayland` flag | X11 remains default; Wayland-only builds exclude X11 deps |
| 27 | AUR package (`timelog-cli`) builds from source successfully | `makepkg -si` completes on clean Arch install |
| 28 | User data stored in `~/.local/share/timelog/` per XDG spec | `$XDG_DATA_HOME` override respected |

---

## AC-DEPLOY-MAC — macOS Packaging

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 29 | Homebrew formula installs binary and man page | `brew install timelog-cli` on fresh macOS succeeds |
| 30 | `brew services start timelog-cli` starts LaunchAgent | Agent persists across reboots |
| 31 | DMG disk image opens with drag-to-Applications layout | Unsigned binary shows Gatekeeper warning with bypass instructions |
| 32 | Binary is code-signed with Developer ID certificate | `codesign --verify` passes |
| 33 | Binary is notarized with Apple notary service | `spctl --assess` returns "accepted" |
| 34 | Universal binary contains both x86_64 and ARM64 slices | `lipo -info` confirms two architectures |
| 35 | Accessibility permission prompt triggers on first launch | App functions with limited features if permission denied |
| 36 | Screen Recording permission prompt triggers on first screenshot | Screenshots disabled (not failed) if permission denied |
| 37 | User data stored in `~/Library/Application Support/TimeLog/` | Path fallback if directory creation fails |

---

## AC-DEPLOY-UPDATE — Auto-Update

| # | Criterion | Edge Cases |
|---|-----------|------------|
| 38 | `timelog update --check` queries GitHub Releases API and reports status | Network failure shows "Could not check for updates" |
| 39 | Auto-check runs every 24 hours (configurable via `config.toml`) | Interval of 0 disables auto-check |
| 40 | `timelog update` downloads correct platform binary from release assets | Mismatched platform/architecture detected and rejected |
| 41 | Downloaded binary verified against SHA-256 checksum before replacement | Checksum mismatch aborts update with error 15470 |
| 42 | Binary replacement uses atomic rename to prevent corruption | Interrupted update leaves original binary intact |
| 43 | Daemon restarts automatically after successful binary replacement | Restart failure rolls back to previous binary |
| 44 | `timelog update --version 1.2.0` pins to specific version | Non-existent version returns clear error |
| 45 | `timelog update --skip 1.2.0` suppresses notifications for that version | Skipped versions re-appear if `--skip` is cleared |
| 46 | Rollback restores previous binary if new version crashes within 60 seconds | Rollback logged with error code 15471 |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Build Pipeline | `01-build-pipeline.md` |
| Windows Installer | `02-windows-installer.md` |
| Linux Packaging | `03-linux-packaging.md` |
| macOS Packaging | `04-macos-packaging.md` |
| Auto-Update | `05-auto-update.md` |
| CLI Error Codes | `../../40-time-log-cli/01-backend/04-error-codes.md` |
