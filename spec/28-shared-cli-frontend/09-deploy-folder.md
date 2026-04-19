# Deploy Folder Specification

> **Version:** 1.0.0  
> **Created:** 2026-02-01  
> **Parent:** [00-overview.md](./00-overview.md)

---

## Summary

Every CLI project includes a **deploy/** folder containing PowerShell integration, code management scripts, and error handling utilities. This folder provides the deployment and operations infrastructure.

---

## Folder Structure

```
{cli-name}/
├── backend/                    # Go CLI + HTTP/WS server
├── frontend/                   # React application
└── deploy/                     # Deployment & operations
    ├── powershell/             # PowerShell integration
    │   ├── run.ps1             # Main runner script
    │   ├── powershell.json     # Project configuration
    │   ├── clean.ps1           # Clean build script
    │   ├── firewall.ps1        # Firewall configuration
    │   └── install-deps.ps1    # Dependency installer
    ├── scripts/                # Utility scripts
    │   ├── backup.ps1          # Database backup
    │   ├── restore.ps1         # Database restore
    │   ├── seed.ps1            # Seed configuration
    │   └── update.ps1          # Update checker
    ├── error-handlers/         # Error handling utilities
    │   ├── crash-reporter.go   # Go crash reporter
    │   ├── error-logger.go     # Structured error logging
    │   └── recovery.go         # Panic recovery
    └── docs/                   # Deployment documentation
        ├── SETUP.md            # Setup instructions
        ├── TROUBLESHOOTING.md  # Common issues
        └── FIREWALL.md         # Firewall guide
```

---

## PowerShell Integration

### powershell.json

Each CLI has a project-specific configuration:

```json
{
  "projectName": "{cli-name}",
  "rootDir": "..",
  "backendDir": "../backend",
  "frontendDir": "../frontend",
  "distDir": "dist",
  "targetDir": "../backend/frontend/dist",
  "dataDir": "../backend/data",
  "ports": [8090, 8091],
  "prerequisites": {
    "go": true,
    "node": true,
    "npm": true
  },
  "cleanPaths": [
    "../frontend/node_modules",
    "../frontend/dist",
    "../frontend/.vite",
    "../backend/data/*.db",
    "../backend/data/*.db-shm",
    "../backend/data/*.db-wal"
  ],
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "runCommand": "go run main.go serve",
  "seedingDir": "../backend/data/seeding",
  "configFile": "config.json",
  "configExampleFile": "config.example.json",
  "gitPull": true,
  "openBrowser": true,
  "browserUrl": "http://localhost:{port}"
}
```

### run.ps1 Reference

```powershell
# Main runner script with all features
param(
    [switch]$Force,          # Clean rebuild
    [switch]$SkipPull,       # Skip git pull
    [switch]$SkipBuild,      # Skip frontend build
    [switch]$BuildOnly,      # Don't start server
    [switch]$OpenFirewall,   # Configure firewall
    [switch]$NoBrowser,      # Don't open browser
    [switch]$Help            # Show help
)

# Load configuration
$config = Get-Content "powershell.json" | ConvertFrom-Json

# Pipeline steps:
# 1. Git Pull (unless -SkipPull)
# 2. Check Prerequisites (Go, Node.js, npm)
# 3. Install Dependencies (npm install)
# 4. Build Frontend (npm run build)
# 5. Copy Build to Backend
# 6. Start Backend (go run main.go serve)
# 7. Open Browser (unless -NoBrowser)
```

---

## Error Handlers

### Error Code Integration

Each CLI's error handlers reference the project's error code range:

| CLI | Error Range | Deploy Error Subrange |
|-----|-------------|----------------------|
| GSearch | 7000-7099 | 7090-7099 |
| BRun | 7100-7599 | 7590-7599 |
| AI Bridge | 9000-9999 | 9090-9099 |
| Nexus Flow | 8000-8399 | 8090-8099 |

### Crash Reporter

```go
// deploy/error-handlers/crash-reporter.go
package handlers

import (
    "encoding/json"
    "fmt"
    "os"
    "runtime/debug"
    "time"
)

// CrashContext holds typed diagnostic fields for crash reports.
type CrashContext struct {
    Path       string // HTTP request path (if applicable)
    Method     string // HTTP method (if applicable)
    Component  string // Component or module that crashed
    SessionId  string // Active session ID (if applicable)
}

type CrashReport struct {
    Timestamp  time.Time
    Version    string
    ErrorCode  int
    Message    string
    StackTrace string
    Context    CrashContext
}

func ReportCrash(errorCode int, message string, context CrashContext) {
    report := CrashReport{
        Timestamp:  time.Now(),
        Version:    os.Getenv("APP_VERSION"),
        ErrorCode:  errorCode,
        Message:    message,
        StackTrace: string(debug.Stack()),
        Context:    context,
    }
    
    // Save to crash log
    data, _ := json.MarshalIndent(report, "", "  ")
    filename := fmt.Sprintf("crash-%s.json", time.Now().Format("20060102-150405"))
    pathutil.WriteFile(filepath.Join("logs", filename), data, 0644)
}
```

### Recovery Middleware

```go
// deploy/error-handlers/recovery.go
package handlers

import (
    "net/http"
)

func RecoveryMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        defer func() {
            if err := recover(); err != nil {
                // Log crash
                ReportCrash(
                    ErrorCodePanic,
                    fmt.Sprintf("Panic recovered: %v", err),
                    CrashContext{
                        Path:   r.URL.Path,
                        Method: r.Method,
                    },
                )
                
                // Return error response
                http.Error(w, "Internal Server Error", http.StatusInternalServerError)
            }
        }()
        
        next.ServeHTTP(w, r)
    })
}
```

---

## Utility Scripts

### backup.ps1

```powershell
# Backup databases and configuration
param(
    [string]$OutputDir = "./backups",
    [switch]$IncludeConfig
)

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $OutputDir $timestamp

# Create backup directory
New-Item -ItemType Directory -Path $backupDir -Force

# Backup databases
$dataDir = "../backend/data"
Get-ChildItem "$dataDir/*.db" | ForEach-Object {
    Copy-Item $_.FullName $backupDir
}

# Backup config if requested
if ($IncludeConfig) {
    Copy-Item "../backend/configs/*.json" $backupDir
}

Write-Host "Backup created: $backupDir"
```

### seed.ps1

```powershell
# Re-seed configuration from seed file
param(
    [switch]$Force  # Force re-seed even if version matches
)

$seedFile = "../backend/configs/config.seed.json"
$seed = Get-Content $seedFile | ConvertFrom-Json

Write-Host "Seeding version: $($seed.version)"

# Call backend seed endpoint
$response = Invoke-RestMethod -Uri "http://localhost:$port/api/settings/seed" -Method POST -Body @{
    force = $Force.IsPresent
}

Write-Host "Seed complete: $($response.message)"
```

---

## Reference to Core Guidelines

The deploy folder follows these core specifications:

| Topic | Reference |
|-------|-----------|
| PowerShell Runner | [50-powershell-integration/00-overview.md](../50-powershell-integration/00-overview.md) |
| Error Codes | [03-error-code-registry/](../03-error-code-registry/) |
| Configuration | [07-seedable-config-architecture/00-overview.md](../07-seedable-config-architecture/00-overview.md) |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| GSearch Deploy | `spec/20-gsearch-cli/03-deploy/` |
| BRun Deploy | `spec/21-brun-cli/03-deploy/` |
| AI Bridge Deploy | `spec/22-ai-bridge-cli/03-deploy/` |
| Nexus Flow Deploy | `spec/24-nexus-flow-cli/03-deploy/` |

---

*Every CLI includes a deploy folder for consistent operations.*
