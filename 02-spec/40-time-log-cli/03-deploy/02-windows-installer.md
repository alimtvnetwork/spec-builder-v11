# Time Log CLI: Windows Installer

**Version:** 1.0.0  
**Updated:** 2026-03-27

---

## Overview

Windows deployment via MSI installer (WiX Toolset) and portable ZIP. Supports silent installation, autostart registration, and optional Windows Service mode.

---

## Installation Methods

| Method | Use Case | Admin Required |
|--------|----------|---------------|
| MSI Installer | Standard installation with Start Menu entry | Yes |
| Portable ZIP | No-install, run from any directory | No |
| `winget` | Windows Package Manager | Yes |
| `scoop` | Developer-focused package manager | No |

---

## MSI Installer (WiX Toolset)

### Installation Layout

```
C:\Program Files\TimeLog\
├── timelog.exe              # Main binary
├── LICENSE                  # License file
└── README.md                # Quick start guide

%LOCALAPPDATA%\TimeLog\
├── config.toml              # User configuration (created on first run)
├── state.json               # Daemon state
└── data\
    ├── timelog.db            # SQLite database
    └── screenshots\          # Screenshot storage
```

### WiX Configuration

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Product
    Name="Time Log CLI"
    Manufacturer="TimeLog"
    Version="$(var.Version)"
    UpgradeCode="GUID-HERE">

    <Package InstallerVersion="500" Compressed="yes" Scope="perMachine" />

    <MajorUpgrade
      DowngradeErrorMessage="A newer version is already installed."
      AllowSameVersionUpgrades="yes" />

    <Feature Id="MainFeature" Title="Time Log CLI" Level="1">
      <ComponentRef Id="TimeLogExe" />
      <ComponentRef Id="PathEntry" />
      <ComponentRef Id="AutostartEntry" />
    </Feature>

    <!-- Add to PATH -->
    <Component Id="PathEntry" Directory="INSTALLDIR">
      <Environment Id="PATH" Name="PATH" Value="[INSTALLDIR]"
                   Permanent="no" Part="last" Action="set" System="yes" />
    </Component>

    <!-- Autostart registry entry (optional) -->
    <Component Id="AutostartEntry" Directory="INSTALLDIR">
      <RegistryValue
        Root="HKCU"
        Key="SOFTWARE\Microsoft\Windows\CurrentVersion\Run"
        Name="TimeLogCli"
        Type="string"
        Value="&quot;[INSTALLDIR]timelog.exe&quot; --daemon"
        KeyPath="yes" />
      <Condition>AUTOSTART = "1"</Condition>
    </Component>
  </Product>
</Wix>
```

### Silent Installation

```powershell
# Silent install with autostart enabled
msiexec /i timelog-v1.0.0-windows-x64.msi /quiet AUTOSTART=1

# Silent install without autostart
msiexec /i timelog-v1.0.0-windows-x64.msi /quiet

# Silent uninstall
msiexec /x timelog-v1.0.0-windows-x64.msi /quiet
```

---

## Windows Service Mode (Optional)

For enterprise deployments, the Time Log CLI can run as a Windows Service instead of a user-session daemon.

### Service Registration

```powershell
# Install as Windows Service
timelog service install --name "TimeLogTracker" --display-name "Time Log Activity Tracker"

# Start service
timelog service start

# Stop service
timelog service stop

# Uninstall service
timelog service uninstall
```

### Service Implementation

```rust
#[cfg(target_os = "windows")]
mod windows_service {
    use windows_service::{
        define_windows_service,
        service_dispatcher,
        service_control_handler::{self, ServiceControlHandlerResult},
    };

    define_windows_service!(ffi_service_main, service_main);

    fn service_main(_arguments: Vec<OsString>) {
        let event_handler = move |control_event| -> ServiceControlHandlerResult {
            match control_event {
                ServiceControl::Stop => {
                    // Signal daemon to shutdown
                    ServiceControlHandlerResult::NoError
                }
                ServiceControl::Interrogate => ServiceControlHandlerResult::NoError,
                _ => ServiceControlHandlerResult::NotImplemented,
            }
        };

        let status_handle = service_control_handler::register(
            "TimeLogTracker",
            event_handler,
        ).unwrap();

        // Run daemon loop
        // Report stopped when done
    }
}
```

---

## Package Manager Manifests

### winget

```yaml
# manifests/t/TimeLog/TimeLogCli/1.0.0/TimeLog.TimeLogCli.yaml
PackageIdentifier: TimeLog.TimeLogCli
PackageVersion: 1.0.0
PackageName: Time Log CLI
Publisher: TimeLog
License: MIT
ShortDescription: Cross-platform OS-level activity tracker
InstallerType: msi
Installers:
  - Architecture: x64
    InstallerUrl: https://github.com/timelog/timelog-cli/releases/download/v1.0.0/timelog-v1.0.0-windows-x64.msi
    InstallerSha256: <SHA256>
```

### Scoop

```json
{
  "version": "1.0.0",
  "description": "Cross-platform OS-level activity tracker",
  "homepage": "https://github.com/timelog/timelog-cli",
  "license": "MIT",
  "architecture": {
    "64bit": {
      "url": "https://github.com/timelog/timelog-cli/releases/download/v1.0.0/timelog-v1.0.0-windows-x64.zip",
      "hash": "<SHA256>"
    }
  },
  "bin": "timelog.exe"
}
```

---

## Post-Install Actions

```powershell
# PowerShell post-install script (run by MSI CustomAction)

# 1. Create default config if not exists
$ConfigPath = "$env:LOCALAPPDATA\TimeLog\config.toml"
if (-not (Test-Path $ConfigPath)) {
    New-Item -ItemType Directory -Path (Split-Path $ConfigPath) -Force
    timelog config --init
}

# 2. Start daemon
Start-Process -FilePath "timelog.exe" -ArgumentList "--daemon" -WindowStyle Hidden
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Build Pipeline | `./01-build-pipeline.md` |
| OS Integration (Windows hooks) | `../01-backend/02-os-integration.md` |
| PowerShell Integration | `../../11-powershell-integration/00-overview.md` |
