# PowerShell Deployment

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

---

## Overview

PowerShell-based deployment and management scripts for AI Transcribe CLI, following the project's standardized PowerShell deployment patterns for Windows environments and development workflows.

**Cross-References:**
- [Deployment Overview](./00-overview.md)
- [Environment Configuration](./02-environment-config.md)
- [Technical: PowerShell Integration](../../11-powershell-integration/00-overview.md)

---

## Script Structure

```
deploy/
├── build.ps1              # Build the binary
├── install.ps1            # Install to system
├── uninstall.ps1          # Remove installation
├── start.ps1              # Start service
├── stop.ps1               # Stop service
├── restart.ps1            # Restart service
├── status.ps1             # Check status
├── logs.ps1               # View logs
├── config.ps1             # Manage configuration
└── health.ps1             # Health check
```

---

## build.ps1

```powershell
<#
.SYNOPSIS
    Build AI Transcribe CLI binary

.PARAMETER Target
    Build target: windows, linux, darwin

.PARAMETER Arch
    Architecture: amd64, arm64

.PARAMETER Output
    Output path for binary

.EXAMPLE
    .\build.ps1 -Target windows -Arch amd64
#>

param(
    [ValidateSet("windows", "linux", "darwin")]
    [string]$Target = "windows",
    
    [ValidateSet("amd64", "arm64")]
    [string]$Arch = "amd64",
    
    [string]$Output = "",
    
    [switch]$Release
)

$ErrorActionPreference = "Stop"

# Determine output path
$ext = if ($Target -eq "windows") { ".exe" } else { "" }
if (-not $Output) {
    $Output = "bin/ai-transcribe-$Target-$Arch$ext"
}

# Build flags
$ldflags = "-s -w"
if ($Release) {
    $version = git describe --tags --always 2>$null
    $commit = git rev-parse --short HEAD 2>$null
    $date = Get-Date -Format "yyyy-MM-dd"
    $ldflags += " -X main.Version=$version -X main.Commit=$commit -X main.BuildDate=$date"
}

# Set environment
$env:GOOS = $Target
$env:GOARCH = $Arch
$env:CGO_ENABLED = "0"

Write-Host "Building AI Transcribe CLI..." -ForegroundColor Cyan
Write-Host "  Target: $Target/$Arch" -ForegroundColor Gray
Write-Host "  Output: $Output" -ForegroundColor Gray

# Build
$buildCmd = "go build -ldflags `"$ldflags`" -o `"$Output`" ./cmd/ai-transcribe"
Invoke-Expression $buildCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful: $Output" -ForegroundColor Green
    
    # Show binary info
    $info = Get-Item $Output
    Write-Host "  Size: $([math]::Round($info.Length / 1MB, 2)) MB" -ForegroundColor Gray
} else {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
```

---

## install.ps1

```powershell
<#
.SYNOPSIS
    Install AI Transcribe CLI to system

.PARAMETER InstallPath
    Installation directory

.PARAMETER CreateService
    Create Windows service

.EXAMPLE
    .\install.ps1 -InstallPath "C:\Program Files\AI-Transcribe"
#>

param(
    [string]$InstallPath = "C:\Program Files\AI-Transcribe",
    [switch]$CreateService,
    [string]$ServiceName = "AITranscribe",
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# Check admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "This script requires administrator privileges." -ForegroundColor Red
    exit 1
}

# Check binary exists
$binary = "bin/ai-transcribe-windows-amd64.exe"
if (-not (Test-Path $binary)) {
    Write-Host "Binary not found. Run build.ps1 first." -ForegroundColor Red
    exit 1
}

# Create directories
$directories = @(
    $InstallPath,
    "$InstallPath\bin",
    "$InstallPath\config",
    "$InstallPath\data",
    "$InstallPath\data\sessions",
    "$InstallPath\data\cache",
    "$InstallPath\data\voices",
    "$InstallPath\models",
    "$InstallPath\logs"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created: $dir" -ForegroundColor Gray
    }
}

# Copy binary
Copy-Item $binary "$InstallPath\bin\ai-transcribe.exe" -Force
Write-Host "Installed binary to $InstallPath\bin" -ForegroundColor Green

# Copy config
if (Test-Path "config/config.yaml") {
    Copy-Item "config/config.yaml" "$InstallPath\config\config.yaml" -Force
}

# Copy environment template
if (Test-Path "config/.env.example") {
    if (-not (Test-Path "$InstallPath\config\.env") -or $Force) {
        Copy-Item "config/.env.example" "$InstallPath\config\.env"
        Write-Host "Created .env file - please configure API keys" -ForegroundColor Yellow
    }
}

# Add to PATH
$path = [Environment]::GetEnvironmentVariable("PATH", "Machine")
if ($path -notlike "*$InstallPath\bin*") {
    [Environment]::SetEnvironmentVariable("PATH", "$path;$InstallPath\bin", "Machine")
    Write-Host "Added to system PATH" -ForegroundColor Green
}

# Create Windows Service
if ($CreateService) {
    $servicePath = "$InstallPath\bin\ai-transcribe.exe"
    $serviceArgs = "serve --config `"$InstallPath\config\config.yaml`""
    
    # Check if service exists
    $existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($existingService) {
        if ($Force) {
            Stop-Service $ServiceName -Force -ErrorAction SilentlyContinue
            sc.exe delete $ServiceName
            Start-Sleep -Seconds 2
        } else {
            Write-Host "Service already exists. Use -Force to reinstall." -ForegroundColor Yellow
        }
    }
    
    # Create service
    New-Service -Name $ServiceName `
        -BinaryPathName "`"$servicePath`" $serviceArgs" `
        -DisplayName "AI Transcribe Service" `
        -Description "Speech-to-Text and Text-to-Speech Service" `
        -StartupType Automatic
    
    Write-Host "Created Windows service: $ServiceName" -ForegroundColor Green
}

Write-Host "`nInstallation complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Configure API keys in $InstallPath\config\.env" -ForegroundColor Gray
Write-Host "  2. Download models to $InstallPath\models" -ForegroundColor Gray
Write-Host "  3. Start with: .\start.ps1 or 'Start-Service $ServiceName'" -ForegroundColor Gray
```

---

## start.ps1

```powershell
<#
.SYNOPSIS
    Start AI Transcribe CLI

.PARAMETER AsService
    Start as Windows service

.PARAMETER Background
    Run in background (non-service)

.EXAMPLE
    .\start.ps1 -Background
#>

param(
    [string]$InstallPath = "C:\Program Files\AI-Transcribe",
    [string]$ServiceName = "AITranscribe",
    [switch]$AsService,
    [switch]$Background,
    [int]$Port = 8030,
    [int]$WSPort = 8031
)

$ErrorActionPreference = "Stop"

# Load environment
$envFile = "$InstallPath\config\.env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

if ($AsService) {
    # Start Windows service
    $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if (-not $service) {
        Write-Host "Service not found. Run install.ps1 -CreateService first." -ForegroundColor Red
        exit 1
    }
    
    if ($service.Status -eq "Running") {
        Write-Host "Service is already running." -ForegroundColor Yellow
    } else {
        Start-Service $ServiceName
        Write-Host "Started service: $ServiceName" -ForegroundColor Green
    }
} else {
    # Check if already running
    $existing = Get-Process -Name "ai-transcribe" -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "AI Transcribe is already running (PID: $($existing.Id))" -ForegroundColor Yellow
        exit 0
    }
    
    $binary = "$InstallPath\bin\ai-transcribe.exe"
    $config = "$InstallPath\config\config.yaml"
    
    $args = @(
        "serve",
        "--config", $config,
        "--port", $Port,
        "--ws-port", $WSPort
    )
    
    if ($Background) {
        # Run in background
        $process = Start-Process -FilePath $binary -ArgumentList $args `
            -PassThru -WindowStyle Hidden `
            -RedirectStandardOutput "$InstallPath\logs\stdout.log" `
            -RedirectStandardError "$InstallPath\logs\stderr.log"
        
        Write-Host "Started in background (PID: $($process.Id))" -ForegroundColor Green
        Write-Host "Logs: $InstallPath\logs" -ForegroundColor Gray
        
        # Save PID
        $process.Id | Out-File "$InstallPath\data\ai-transcribe.pid"
    } else {
        # Run in foreground
        Write-Host "Starting AI Transcribe CLI..." -ForegroundColor Cyan
        Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
        & $binary $args
    }
}
```

---

## stop.ps1

```powershell
<#
.SYNOPSIS
    Stop AI Transcribe CLI

.EXAMPLE
    .\stop.ps1
#>

param(
    [string]$InstallPath = "C:\Program Files\AI-Transcribe",
    [string]$ServiceName = "AITranscribe",
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# Try service first
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq "Running") {
    if ($Force) {
        Stop-Service $ServiceName -Force
    } else {
        Stop-Service $ServiceName
    }
    Write-Host "Stopped service: $ServiceName" -ForegroundColor Green
    exit 0
}

# Try PID file
$pidFile = "$InstallPath\data\ai-transcribe.pid"
if (Test-Path $pidFile) {
    $pid = Get-Content $pidFile
    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($process) {
        if ($Force) {
            $process | Stop-Process -Force
        } else {
            $process | Stop-Process
        }
        Write-Host "Stopped process (PID: $pid)" -ForegroundColor Green
        Remove-Item $pidFile
        exit 0
    }
}

# Try process name
$processes = Get-Process -Name "ai-transcribe" -ErrorAction SilentlyContinue
if ($processes) {
    if ($Force) {
        $processes | Stop-Process -Force
    } else {
        $processes | Stop-Process
    }
    Write-Host "Stopped AI Transcribe processes" -ForegroundColor Green
} else {
    Write-Host "AI Transcribe is not running" -ForegroundColor Yellow
}
```

---

## status.ps1

```powershell
<#
.SYNOPSIS
    Check AI Transcribe CLI status

.EXAMPLE
    .\status.ps1
#>

param(
    [string]$InstallPath = "C:\Program Files\AI-Transcribe",
    [string]$ServiceName = "AITranscribe",
    [int]$Port = 8030
)

Write-Host "AI Transcribe Status" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

# Check service
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($service) {
    $statusColor = if ($service.Status -eq "Running") { "Green" } else { "Yellow" }
    Write-Host "Service: $($service.Status)" -ForegroundColor $statusColor
} else {
    Write-Host "Service: Not installed" -ForegroundColor Gray
}

# Check process
$processes = Get-Process -Name "ai-transcribe" -ErrorAction SilentlyContinue
if ($processes) {
    foreach ($p in $processes) {
        Write-Host "Process: Running (PID: $($p.Id), Memory: $([math]::Round($p.WorkingSet64 / 1MB, 1)) MB)" -ForegroundColor Green
    }
} else {
    Write-Host "Process: Not running" -ForegroundColor Yellow
}

# Check API
try {
    $response = Invoke-RestMethod -Uri "http://localhost:$Port/health" -TimeoutSec 5
    Write-Host "API: Healthy" -ForegroundColor Green
    Write-Host "  Version: $($response.version)" -ForegroundColor Gray
    Write-Host "  Uptime: $($response.uptime)s" -ForegroundColor Gray
    
    # Component status
    if ($response.components) {
        foreach ($comp in $response.components.PSObject.Properties) {
            $compColor = if ($comp.Value.status -eq "healthy") { "Green" } else { "Yellow" }
            Write-Host "  $($comp.Name): $($comp.Value.status)" -ForegroundColor $compColor
        }
    }
} catch {
    Write-Host "API: Not responding" -ForegroundColor Red
}

# Check ports
$ports = @(8030, 8031, 8032)
foreach ($p in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host "Port $p`: Listening" -ForegroundColor Green
    } else {
        Write-Host "Port $p`: Not listening" -ForegroundColor Gray
    }
}
```

---

## health.ps1

```powershell
<#
.SYNOPSIS
    Health check for AI Transcribe CLI

.PARAMETER Verbose
    Show detailed component status

.EXAMPLE
    .\health.ps1 -Verbose
#>

param(
    [int]$Port = 8030,
    [switch]$Detailed,
    [int]$Timeout = 5
)

try {
    $response = Invoke-RestMethod -Uri "http://localhost:$Port/health" -TimeoutSec $Timeout
    
    $statusColor = switch ($response.status) {
        "healthy" { "Green" }
        "degraded" { "Yellow" }
        default { "Red" }
    }
    
    Write-Host "Status: $($response.status)" -ForegroundColor $statusColor
    
    if ($Detailed -and $response.components) {
        Write-Host "`nComponents:" -ForegroundColor Cyan
        foreach ($comp in $response.components.PSObject.Properties) {
            $compColor = if ($comp.Value.status -eq "healthy") { "Green" } else { "Yellow" }
            Write-Host "  $($comp.Name): $($comp.Value.status)" -ForegroundColor $compColor
            if ($comp.Value.latency_ms) {
                Write-Host "    Latency: $($comp.Value.latency_ms)ms" -ForegroundColor Gray
            }
        }
    }
    
    exit $(if ($response.status -eq "healthy") { 0 } else { 1 })
} catch {
    Write-Host "Status: Unreachable" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Gray
    exit 2
}
```

---

## Related Documents

- [Systemd Service](./01-systemd-service.md)
- [Environment Configuration](./02-environment-config.md)
- [Configuration](../01-backend/11-configuration.md)
