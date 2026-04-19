# Time Log CLI: Auto-Update

**Version:** 1.0.0  
**Updated:** 2026-03-27

---

## Overview

Built-in self-update mechanism that checks for new releases, downloads the appropriate platform binary, verifies integrity, and replaces the running binary. Uses GitHub Releases as the distribution channel.

---

## Update Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Check   │───►│ Compare  │───►│ Download │───►│ Verify   │───►│ Replace  │
│ Release  │    │ Versions │    │ Binary   │    │ Checksum │    │ & Restart│
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### Automatic Check

- **Interval:** Every 24 hours (configurable)
- **Mechanism:** Query GitHub Releases API for latest tag
- **Notification:** Log message + optional desktop notification
- **Auto-install:** Disabled by default (opt-in)

### Manual Update

```bash
# Check for updates
timelog update --check

# Download and install update
timelog update

# Force update to specific version
timelog update --version 1.2.0

# Skip version (don't notify again)
timelog update --skip 1.2.0
```

---

## Version Check

### GitHub API Query

```
GET https://api.github.com/repos/timelog/timelog-cli/releases/latest
Accept: application/vnd.github.v3+json
```

### Response Parsing

```rust
#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct ReleaseInfo {
    tag_name: String,        // "v1.2.0"
    published_at: String,
    assets: Vec<ReleaseAsset>,
    body: String,            // Release notes (Markdown)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct ReleaseAsset {
    name: String,
    browser_download_url: String,
    size: u64,
}
```

### Version Comparison

```rust
use semver::Version;

pub fn should_update(current: &str, latest: &str) -> UpdateDecision {
    let current = Version::parse(current.trim_start_matches('v')).unwrap();
    let latest = Version::parse(latest.trim_start_matches('v')).unwrap();

    if latest > current {
        UpdateDecision::Available {
            current: current.to_string(),
            latest: latest.to_string(),
            is_major: latest.major > current.major,
        }
    } else {
        UpdateDecision::UpToDate
    }
}
```

---

## Download & Verification

### Asset Selection

```rust
fn select_asset(assets: &[ReleaseAsset]) -> Option<&ReleaseAsset> {
    let expected_name = match (std::env::consts::OS, std::env::consts::ARCH) {
        ("windows", "x86_64") => "timelog-windows-x64.zip",
        ("linux", "x86_64")   => "timelog-linux-x64.tar.gz",
        ("linux", "aarch64")  => "timelog-linux-arm64.tar.gz",
        ("macos", "x86_64")   => "timelog-macos-x64.tar.gz",
        ("macos", "aarch64")  => "timelog-macos-arm64.tar.gz",
        _ => return None,
    };
    assets.iter().find(|asset| asset.name.contains(expected_name))
}
```

### Checksum Verification

```rust
use sha2::{Sha256, Digest};

pub fn verify_checksum(file_path: &Path, expected_hash: &str) -> Result<(), UpdateError> {
    let mut file = File::open(file_path)?;
    let mut hasher = Sha256::new();
    std::io::copy(&mut file, &mut hasher)?;
    let computed = format!("{:x}", hasher.finalize());

    if computed != expected_hash {
        return Err(UpdateError::ChecksumMismatch {
            expected: expected_hash.to_string(),
            computed,
        });
    }
    Ok(())
}
```

---

## Binary Replacement

### Strategy

1. Download new binary to temporary location
2. Verify SHA-256 checksum
3. Stop the daemon gracefully
4. Rename current binary to `timelog.bak`
5. Move new binary to install location
6. Set executable permissions
7. Restart daemon with new binary
8. If restart fails, rollback from `timelog.bak`

```rust
pub async fn perform_update(new_binary: &Path) -> Result<(), UpdateError> {
    let current_exe = std::env::current_exe()?;
    let backup_path = current_exe.with_extension("bak");

    // 1. Stop daemon
    send_stop_signal().await?;

    // 2. Backup current binary
    std::fs::rename(&current_exe, &backup_path)?;

    // 3. Install new binary
    std::fs::copy(new_binary, &current_exe)?;

    // 4. Set permissions (Unix)
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&current_exe, Permissions::from_mode(0o755))?;
    }

    // 5. Restart daemon
    match restart_daemon().await {
        Ok(()) => {
            // Cleanup backup
            let _ = std::fs::remove_file(&backup_path);
            Ok(())
        }
        Err(error) => {
            // Rollback
            error!(%error, "Update failed, rolling back");
            std::fs::rename(&backup_path, &current_exe)?;
            restart_daemon().await?;
            Err(UpdateError::RestartFailed(error))
        }
    }
}
```

---

## Configuration

```toml
[Update]
Enabled = true
CheckIntervalHours = 24
AutoInstall = false           # true = auto-install minor/patch updates
NotifyDesktop = true          # Show desktop notification when update available
SkippedVersions = []          # Versions the user chose to skip
Channel = "Stable"            # Stable, Beta (future)
```

---

## CLI Output

```
$ timelog update --check

Current version: v1.0.0
Latest version:  v1.2.0 (released 2026-03-25)

Release notes:
  - Added Wayland PipeWire support for screenshot capture
  - Improved idle detection accuracy on macOS
  - Fixed click tracking on multi-monitor setups

Run 'timelog update' to install.

$ timelog update

Downloading v1.2.0 for macos-arm64... 8.2 MB
Verifying checksum... ✅
Stopping daemon... ✅
Installing update... ✅
Restarting daemon... ✅

✅ Updated from v1.0.0 → v1.2.0
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 15060 | `UpdateCheckFailed` | Failed to reach GitHub Releases API |
| 15061 | `UpdateDownloadFailed` | Binary download failed or timed out |
| 15062 | `UpdateChecksumMismatch` | Downloaded binary hash doesn't match |
| 15063 | `UpdateInstallFailed` | Failed to replace binary on disk |
| 15064 | `UpdateRollbackFailed` | Rollback after failed update also failed |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Build Pipeline (release artifacts) | `./01-build-pipeline.md` |
| Error Codes | `../01-backend/07-error-codes.md` |
| Architecture (daemon lifecycle) | `../01-backend/01-architecture.md` |
