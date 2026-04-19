# WP SEO Publish CLI: PowerShell Deployment

**Version:** 2.0.0  
**Updated:** 2026-03-09  

---

## Overview

PowerShell deployment scripts for WP SEO Publish CLI, following the same patterns as other CLI tools (GSearch, VRun, AI Bridge).

---

## Directory Structure

```
deploy/
├── build.ps1                    # Build script
├── install.ps1                  # Installation script
├── uninstall.ps1               # Uninstallation script
├── update.ps1                  # Update script
├── start.ps1                   # Start service
├── stop.ps1                    # Stop service
├── status.ps1                  # Check status
├── config/
│   ├── default.json            # Default configuration
│   └── sample.env              # Environment sample
└── service/
    ├── wpseo-service.ps1       # Windows service wrapper
    └── wpseo-daemon.ps1        # Background daemon
```

---

## Build Script (build.ps1)

```powershell
<#
.SYNOPSIS
    Build WP SEO Publish CLI for Windows/Linux/macOS

.DESCRIPTION
    Compiles the Go binary with proper flags and embeds frontend assets.

.PARAMETER Target
    Target OS: windows, linux, darwin, all

.PARAMETER Arch
    Target architecture: amd64, arm64

.PARAMETER Output
    Output directory for binaries

.EXAMPLE
    .\build.ps1 -Target windows -Arch amd64
#>

param(
    [ValidateSet("windows", "linux", "darwin", "all")]
    [string]$Target = "windows",
    
    [ValidateSet("amd64", "arm64")]
    [string]$Arch = "amd64",
    
    [string]$Output = ".\bin",
    
    [switch]$SkipFrontend,
    
    [switch]$Debug
)

$ErrorActionPreference = "Stop"

# Configuration
$AppName = "wpseo"
$ModulePath = "github.com/yourorg/wp-seo-publish-cli"
$Version = (Get-Content .\VERSION -Raw).Trim()
$BuildTime = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
$GitCommit = git rev-parse --short HEAD 2>$null
if (-not $GitCommit) { $GitCommit = "unknown" }

Write-Host "Building WP SEO Publish CLI v$Version" -ForegroundColor Cyan
Write-Host "  Target: $Target/$Arch"
Write-Host "  Commit: $GitCommit"

# Create output directory
New-Item -ItemType Directory -Force -Path $Output | Out-Null

# Build frontend first
if (-not $SkipFrontend) {
    Write-Host "`nBuilding frontend..." -ForegroundColor Yellow
    
    Push-Location frontend
    try {
        if (-not (Test-Path node_modules)) {
            Write-Host "  Installing dependencies..."
            npm ci
        }
        
        Write-Host "  Building React app..."
        npm run build
        
        # Copy to embed directory
        $embedDir = "..\internal\server\embed\dist"
        New-Item -ItemType Directory -Force -Path $embedDir | Out-Null
        Copy-Item -Path "dist\*" -Destination $embedDir -Recurse -Force
    }
    finally {
        Pop-Location
    }
    
    Write-Host "  Frontend built successfully" -ForegroundColor Green
}

# Build Go binary
Write-Host "`nBuilding Go binary..." -ForegroundColor Yellow

$ldFlags = @(
    "-X '$ModulePath/internal/version.Version=$Version'"
    "-X '$ModulePath/internal/version.BuildTime=$BuildTime'"
    "-X '$ModulePath/internal/version.GitCommit=$GitCommit'"
)

if (-not $Debug) {
    $ldFlags += "-s -w"  # Strip debug symbols
}

$ldFlagsStr = $ldFlags -join " "

$targets = @()
if ($Target -eq "all") {
    $targets = @(
        @{ OS = "windows"; Arch = "amd64"; Ext = ".exe" },
        @{ OS = "linux"; Arch = "amd64"; Ext = "" },
        @{ OS = "darwin"; Arch = "amd64"; Ext = "" },
        @{ OS = "darwin"; Arch = "arm64"; Ext = "" }
    )
} else {
    $ext = if ($Target -eq "windows") { ".exe" } else { "" }
    $targets = @(@{ OS = $Target; Arch = $Arch; Ext = $ext })
}

foreach ($t in $targets) {
    $outName = "$AppName-$($t.OS)-$($t.Arch)$($t.Ext)"
    $outPath = Join-Path $Output $outName
    
    Write-Host "  Building $outName..."
    
    $env:GOOS = $t.OS
    $env:GOARCH = $t.Arch
    $env:CGO_ENABLED = "0"
    
    go build -ldflags $ldFlagsStr -o $outPath ./cmd/wpseo
    
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed for $outName"
    }
    
    $size = (Get-Item $outPath).Length / 1MB
    Write-Host "    Size: $($size.ToString('F2')) MB" -ForegroundColor DarkGray
}

# Copy default config
Copy-Item -Path "deploy\config\default.json" -Destination "$Output\config.json" -Force

Write-Host "`nBuild completed successfully!" -ForegroundColor Green
Write-Host "Binaries are in: $Output"
```

---

## Install Script (install.ps1)

```powershell
<#
.SYNOPSIS
    Install WP SEO Publish CLI

.DESCRIPTION
    Installs the CLI binary, creates data directories, and optionally installs as a Windows service.

.PARAMETER InstallPath
    Installation directory (default: C:\Program Files\WPSeoPublish)

.PARAMETER DataPath
    Data directory for databases (default: C:\ProgramData\WPSeoPublish)

.PARAMETER AsService
    Install as Windows service

.PARAMETER Port
    HTTP server port (default: 8090)

.EXAMPLE
    .\install.ps1 -AsService -Port 8090
#>

param(
    [string]$InstallPath = "C:\Program Files\WPSeoPublish",
    [string]$DataPath = "C:\ProgramData\WPSeoPublish",
    [switch]$AsService,
    [int]$Port = 5060,
    [string]$AIBridgeUrl = "http://127.0.0.1:5040",
    [string]$GSearchUrl = "http://127.0.0.1:5020"
)

$ErrorActionPreference = "Stop"

# Check admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    throw "This script requires administrator privileges. Please run as Administrator."
}

Write-Host "Installing WP SEO Publish CLI" -ForegroundColor Cyan
Write-Host "  Install path: $InstallPath"
Write-Host "  Data path: $DataPath"
Write-Host "  Port: $Port"

# Create directories
Write-Host "`nCreating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $InstallPath | Out-Null
New-Item -ItemType Directory -Force -Path $DataPath | Out-Null
New-Item -ItemType Directory -Force -Path "$DataPath\logs" | Out-Null

# Copy binary
Write-Host "Copying files..." -ForegroundColor Yellow
$binaryName = "wpseo-windows-amd64.exe"
$binaryPath = Join-Path $PSScriptRoot "bin\$binaryName"

if (-not (Test-Path $binaryPath)) {
    # Try current directory
    $binaryPath = Join-Path $PSScriptRoot $binaryName
}

if (-not (Test-Path $binaryPath)) {
    throw "Binary not found: $binaryName. Please build first with .\build.ps1"
}

Copy-Item -Path $binaryPath -Destination "$InstallPath\wpseo.exe" -Force

# Create configuration
Write-Host "Creating configuration..." -ForegroundColor Yellow
$config = @{
    Server = @{
        Port = $Port
        Host = "127.0.0.1"
    }
    Data = @{
        Path = $DataPath
    }
    AIBridge = @{
        Url = $AIBridgeUrl
        Timeout = 120
    }
    GSearch = @{
        Url = $GSearchUrl
        Timeout = 30
    }
    Logging = @{
        Level = "info"
        File = "$DataPath\logs\wpseo.log"
        MaxSize = 100
        MaxBackups = 5
    }
}

$config | ConvertTo-Json -Depth 10 | Set-Content "$InstallPath\config.json"

# Add to PATH
Write-Host "Adding to PATH..." -ForegroundColor Yellow
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($currentPath -notlike "*$InstallPath*") {
    [Environment]::SetEnvironmentVariable(
        "Path",
        "$currentPath;$InstallPath",
        "Machine"
    )
}

# Install as service
if ($AsService) {
    Write-Host "Installing Windows service..." -ForegroundColor Yellow
    
    $serviceName = "WPSeoPublish"
    $displayName = "WP SEO Publish CLI"
    $description = "WordPress SEO content publishing service"
    
    # Stop existing service if running
    $existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if ($existingService) {
        if ($existingService.Status -eq "Running") {
            Stop-Service -Name $serviceName
        }
        sc.exe delete $serviceName | Out-Null
        Start-Sleep -Seconds 2
    }
    
    # Create service
    $binPath = "`"$InstallPath\wpseo.exe`" serve --config `"$InstallPath\config.json`""
    
    New-Service -Name $serviceName `
        -BinaryPathName $binPath `
        -DisplayName $displayName `
        -Description $description `
        -StartupType Automatic
    
    # Set recovery options
    sc.exe failure $serviceName reset= 86400 actions= restart/60000/restart/60000/restart/60000 | Out-Null
    
    Write-Host "  Service installed: $serviceName" -ForegroundColor Green
    
    # Start service
    Start-Service -Name $serviceName
    Write-Host "  Service started" -ForegroundColor Green
}

Write-Host "`nInstallation completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Usage:"
Write-Host "  Start manually:  wpseo serve"
Write-Host "  View help:       wpseo --help"
Write-Host "  Open UI:         http://localhost:$Port"
if ($AsService) {
    Write-Host "  Service status:  Get-Service WPSeoPublish"
}
```

---

## Start/Stop Scripts

### start.ps1

```powershell
<#
.SYNOPSIS
    Start WP SEO Publish CLI

.PARAMETER AsService
    Start as Windows service

.PARAMETER Port
    Override port from config
#>

param(
    [switch]$AsService,
    [int]$Port,
    [switch]$Background
)

$serviceName = "WPSeoPublish"
$installPath = "C:\Program Files\WPSeoPublish"

if ($AsService) {
    $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
    if (-not $service) {
        throw "Service not installed. Run install.ps1 -AsService first."
    }
    
    if ($service.Status -eq "Running") {
        Write-Host "Service is already running" -ForegroundColor Yellow
    } else {
        Start-Service -Name $serviceName
        Write-Host "Service started" -ForegroundColor Green
    }
} else {
    $exe = "$installPath\wpseo.exe"
    if (-not (Test-Path $exe)) {
        $exe = "wpseo.exe"  # Try PATH
    }
    
    $args = @("serve")
    if ($Port) {
        $args += "--port"
        $args += $Port.ToString()
    }
    
    if ($Background) {
        Start-Process -FilePath $exe -ArgumentList $args -WindowStyle Hidden
        Write-Host "Started in background" -ForegroundColor Green
    } else {
        & $exe @args
    }
}
```

### stop.ps1

```powershell
<#
.SYNOPSIS
    Stop WP SEO Publish CLI
#>

param(
    [switch]$Force
)

$serviceName = "WPSeoPublish"

# Try service first
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq "Running") {
    Write-Host "Stopping service..." -ForegroundColor Yellow
    Stop-Service -Name $serviceName -Force:$Force
    Write-Host "Service stopped" -ForegroundColor Green
    return
}

# Try process
$processes = Get-Process -Name "wpseo*" -ErrorAction SilentlyContinue
if ($processes) {
    Write-Host "Stopping process(es)..." -ForegroundColor Yellow
    $processes | Stop-Process -Force:$Force
    Write-Host "Stopped" -ForegroundColor Green
} else {
    Write-Host "WP SEO Publish is not running" -ForegroundColor DarkGray
}
```

---

## Status Script (status.ps1)

```powershell
<#
.SYNOPSIS
    Check WP SEO Publish CLI status
#>

param(
    [switch]$Json
)

$serviceName = "WPSeoPublish"
$installPath = "C:\Program Files\WPSeoPublish"
$dataPath = "C:\ProgramData\WPSeoPublish"

$status = @{
    Installed = $false
    Running = $false
    Service = $null
    Process = $null
    Config = $null
    DataPath = $null
    Websites = 0
}

# Check installation
if (Test-Path "$installPath\wpseo.exe") {
    $status.Installed = $true
    
    # Get version
    $version = & "$installPath\wpseo.exe" --version 2>$null
    $status.Version = $version
}

# Check service
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service) {
    $status.Service = @{
        Status = $service.Status.ToString()
        StartType = $service.StartType.ToString()
    }
    if ($service.Status -eq "Running") {
        $status.Running = $true
    }
}

# Check process
$processes = Get-Process -Name "wpseo*" -ErrorAction SilentlyContinue
if ($processes) {
    $status.Process = @{
        Id = $processes[0].Id
        Memory = [math]::Round($processes[0].WorkingSet64 / 1MB, 2)
        StartTime = $processes[0].StartTime.ToString("yyyy-MM-dd HH:mm:ss")
    }
    $status.Running = $true
}

# Check config
if (Test-Path "$installPath\config.json") {
    $config = Get-Content "$installPath\config.json" | ConvertFrom-Json
    $status.Config = @{
        Port = $config.Server.Port
        AIBridgeUrl = $config.AIBridge.Url
        GSearchUrl = $config.GSearch.Url
    }
}

# Check data
if (Test-Path $dataPath) {
    $status.DataPath = $dataPath
    
    # Count websites
    if (Test-Path "$dataPath\wpseo.db") {
        # Would query SQLite for website count
        $status.Websites = (Get-ChildItem -Path $dataPath -Directory -ErrorAction SilentlyContinue | 
            Where-Object { Test-Path "$($_.FullName)\website.db" }).Count
    }
}

# Output
if ($Json) {
    $status | ConvertTo-Json -Depth 10
} else {
    Write-Host "WP SEO Publish CLI Status" -ForegroundColor Cyan
    Write-Host "=========================" -ForegroundColor Cyan
    Write-Host ""
    
    if ($status.Installed) {
        Write-Host "  Installed: " -NoNewline
        Write-Host "Yes ($($status.Version))" -ForegroundColor Green
    } else {
        Write-Host "  Installed: " -NoNewline
        Write-Host "No" -ForegroundColor Red
    }
    
    Write-Host "  Running:   " -NoNewline
    if ($status.Running) {
        Write-Host "Yes" -ForegroundColor Green
    } else {
        Write-Host "No" -ForegroundColor Yellow
    }
    
    if ($status.Service) {
        Write-Host ""
        Write-Host "  Service:"
        Write-Host "    Status:     $($status.Service.Status)"
        Write-Host "    Start Type: $($status.Service.StartType)"
    }
    
    if ($status.Process) {
        Write-Host ""
        Write-Host "  Process:"
        Write-Host "    PID:       $($status.Process.Id)"
        Write-Host "    Memory:    $($status.Process.Memory) MB"
        Write-Host "    Started:   $($status.Process.StartTime)"
    }
    
    if ($status.Config) {
        Write-Host ""
        Write-Host "  Configuration:"
        Write-Host "    Port:      $($status.Config.Port)"
        Write-Host "    AI Bridge: $($status.Config.AIBridgeUrl)"
        Write-Host "    GSearch:   $($status.Config.GSearchUrl)"
    }
    
    Write-Host ""
    Write-Host "  Data:"
    Write-Host "    Path:     $($status.DataPath)"
    Write-Host "    Websites: $($status.Websites)"
}
```

---

## Uninstall Script (uninstall.ps1)

```powershell
<#
.SYNOPSIS
    Uninstall WP SEO Publish CLI

.PARAMETER KeepData
    Keep data directory after uninstall
#>

param(
    [switch]$KeepData,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$serviceName = "WPSeoPublish"
$installPath = "C:\Program Files\WPSeoPublish"
$dataPath = "C:\ProgramData\WPSeoPublish"

# Check admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    throw "This script requires administrator privileges."
}

Write-Host "Uninstalling WP SEO Publish CLI" -ForegroundColor Cyan

# Confirm
if (-not $Force) {
    $confirm = Read-Host "Are you sure you want to uninstall? (y/N)"
    if ($confirm -ne "y") {
        Write-Host "Cancelled" -ForegroundColor Yellow
        return
    }
}

# Stop and remove service
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "Removing service..." -ForegroundColor Yellow
    if ($service.Status -eq "Running") {
        Stop-Service -Name $serviceName -Force
    }
    sc.exe delete $serviceName | Out-Null
    Write-Host "  Service removed" -ForegroundColor Green
}

# Stop processes
$processes = Get-Process -Name "wpseo*" -ErrorAction SilentlyContinue
if ($processes) {
    Write-Host "Stopping processes..." -ForegroundColor Yellow
    $processes | Stop-Process -Force
}

# Remove from PATH
Write-Host "Removing from PATH..." -ForegroundColor Yellow
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$newPath = ($currentPath -split ";" | Where-Object { $_ -ne $installPath }) -join ";"
[Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")

# Remove installation directory
if (Test-Path $installPath) {
    Write-Host "Removing installation..." -ForegroundColor Yellow
    Remove-Item -Path $installPath -Recurse -Force
    Write-Host "  Installation removed" -ForegroundColor Green
}

# Remove data
if (-not $KeepData -and (Test-Path $dataPath)) {
    Write-Host "Removing data..." -ForegroundColor Yellow
    Remove-Item -Path $dataPath -Recurse -Force
    Write-Host "  Data removed" -ForegroundColor Green
} elseif ($KeepData) {
    Write-Host "Data preserved at: $dataPath" -ForegroundColor DarkGray
}

Write-Host "`nUninstallation completed!" -ForegroundColor Green
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Backend Architecture | `../01-backend/01-architecture.md` |
| AI Bridge Deploy | `../../22-ai-bridge-cli/03-deploy/` |
| GSearch Deploy | `../../20-gsearch-cli/03-deploy/` |
