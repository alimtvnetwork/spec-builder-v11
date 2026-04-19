# Time Log CLI: Build Pipeline

**Version:** 1.0.0  
**Updated:** 2026-03-27

---

## Overview

Cross-platform build pipeline using Rust's `cargo` toolchain with GitHub Actions CI/CD. Produces optimized release binaries for Windows (x64), Linux (x64, ARM64), and macOS (x64, ARM64/Apple Silicon).

---

## Target Matrix

| OS | Architecture | Target Triple | Binary Name |
|----|-------------|---------------|-------------|
| Windows | x86_64 | `x86_64-pc-windows-msvc` | `timelog.exe` |
| Linux | x86_64 | `x86_64-unknown-linux-gnu` | `timelog` |
| Linux | ARM64 | `aarch64-unknown-linux-gnu` | `timelog` |
| macOS | x86_64 | `x86_64-apple-darwin` | `timelog` |
| macOS | ARM64 | `aarch64-apple-darwin` | `timelog` |

---

## Release Profile

```toml
# Cargo.toml

[profile.release]
opt-level = 3           # Maximum optimization
lto = "fat"             # Full link-time optimization (smaller binary)
codegen-units = 1       # Single codegen unit (slower build, better optimization)
panic = "abort"         # No unwinding (smaller binary)
strip = true            # Strip debug symbols
```

### Binary Size Targets

| Platform | Target Size | Notes |
|----------|------------|-------|
| Windows (x64) | < 12 MB | Includes Win32 API bindings |
| Linux (x64) | < 10 MB | Statically linked with musl option |
| macOS (universal) | < 15 MB | Universal binary (x64 + ARM64 combined) |

---

## CI/CD Pipeline (GitHub Actions)

### Workflow Triggers

```yaml
on:
  push:
    tags: ['v*']        # Release on version tags
  pull_request:
    branches: [main]    # Test on PRs
```

### Pipeline Stages

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Lint &  │───►│  Test    │───►│  Build   │───►│ Package  │
│  Format  │    │  Suite   │    │ Release  │    │ & Upload │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │
  clippy          cargo test     cross-compile    installers
  rustfmt         all targets    5 targets        MSI/DEB/DMG
```

### Build Job Matrix

```yaml
jobs:
  build:
    strategy:
      matrix:
        include:
          - os: windows-latest
            target: x86_64-pc-windows-msvc
            artifact: timelog-windows-x64
          - os: ubuntu-latest
            target: x86_64-unknown-linux-gnu
            artifact: timelog-linux-x64
          - os: ubuntu-latest
            target: aarch64-unknown-linux-gnu
            artifact: timelog-linux-arm64
            cross: true
          - os: macos-latest
            target: x86_64-apple-darwin
            artifact: timelog-macos-x64
          - os: macos-latest
            target: aarch64-apple-darwin
            artifact: timelog-macos-arm64

    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust toolchain
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}

      - name: Build release binary
        run: cargo build --release --target ${{ matrix.target }}

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.artifact }}
          path: target/${{ matrix.target }}/release/timelog*
```

---

## Feature Flags Per Platform

```toml
[features]
default = ["x11"]

# Linux display server support
x11 = ["x11rb"]
wayland = ["wayland-client", "pipewire-rs"]

# Optional features
browser-extension = []     # Native messaging host support
self-update = ["self_update"]  # Built-in auto-updater
```

### Platform Feature Matrix

| Feature | Windows | Linux | macOS |
|---------|---------|-------|-------|
| `x11` | — | ✅ Default | — |
| `wayland` | — | Optional | — |
| `browser-extension` | Optional | Optional | Optional |
| `self-update` | ✅ Default | ✅ Default | ✅ Default |

---

## Versioning

Follows [Semantic Versioning](https://semver.org/):

```
v{MAJOR}.{MINOR}.{PATCH}
```

- **MAJOR:** Breaking changes to CLI interface or config format
- **MINOR:** New features, new collectors, new API endpoints
- **PATCH:** Bug fixes, performance improvements

Version is embedded at compile time:

```rust
const VERSION: &str = env!("CARGO_PKG_VERSION");
const GIT_HASH: &str = env!("GIT_HASH"); // Set via build.rs
const BUILD_DATE: &str = env!("BUILD_DATE");
```

---

## Release Artifacts

Each release produces:

| Artifact | Contents |
|----------|----------|
| `timelog-v{X.Y.Z}-windows-x64.zip` | `timelog.exe` + `README.md` + `LICENSE` |
| `timelog-v{X.Y.Z}-windows-x64.msi` | Windows installer (MSI) |
| `timelog-v{X.Y.Z}-linux-x64.tar.gz` | Binary + man page + systemd unit |
| `timelog-v{X.Y.Z}-linux-arm64.tar.gz` | Binary + man page + systemd unit |
| `timelog-v{X.Y.Z}-linux-x64.deb` | Debian package |
| `timelog-v{X.Y.Z}-linux-x64.rpm` | Red Hat package |
| `timelog-v{X.Y.Z}-macos-universal.tar.gz` | Universal binary (x64 + ARM64) |
| `timelog-v{X.Y.Z}-macos-universal.dmg` | macOS disk image |
| `checksums.sha256` | SHA-256 checksums for all artifacts |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Windows Installer | `./02-windows-installer.md` |
| Linux Packaging | `./03-linux-packaging.md` |
| macOS Packaging | `./04-macos-packaging.md` |
| Auto-Update | `./05-auto-update.md` |
