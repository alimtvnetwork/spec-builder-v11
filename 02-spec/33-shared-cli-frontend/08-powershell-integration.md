# PowerShell Integration for CLI


**Last Updated:** 2026-03-20  

> **Version:** 1.0.0  
> **Parent:** [00-overview.md](./00-overview.md)

---

## Summary

Each CLI project includes a PowerShell runner script following the pattern defined in `02-spec/11-powershell-integration/`.

---

## Standard Files

Each CLI project contains:

```
{cli-name}/
├── run.ps1                     # PowerShell runner script
├── powershell.json             # Project-specific configuration
└── ...
```

---

## Configuration Template

### powershell.json

```json
{
  "projectName": "{cli-name}",
  "rootDir": ".",
  "backendDir": "backend",
  "frontendDir": "frontend",
  "distDir": "dist",
  "targetDir": "backend/frontend/dist",
  "dataDir": "backend/data",
  "ports": [8080, 8081],
  "prerequisites": {
    "go": true,
    "node": true,
    "npm": true
  },
  "cleanPaths": [
    "frontend/node_modules",
    "frontend/dist",
    "frontend/.vite",
    "backend/data/*.db",
    "backend/data/*.db-shm",
    "backend/data/*.db-wal"
  ],
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "runCommand": "go run main.go serve",
  "seedingDir": "backend/data/seeding",
  "configFile": "config.json",
  "configExampleFile": "config.example.json"
}
```

---

## CLI-Specific Configurations

### GSearch CLI

```json
{
  "projectName": "gsearch",
  "ports": [8090, 8091, 8092],
  "runCommand": "go run main.go serve --port 8090"
}
```

### BRun CLI

```json
{
  "projectName": "brun",
  "ports": [8100, 8101, 8102],
  "runCommand": "go run main.go serve --port 8100"
}
```

### AI Bridge

```json
{
  "projectName": "ai-bridge",
  "ports": [8110, 8111, 8112],
  "runCommand": "go run main.go serve --port 8110"
}
```

### Nexus Flow

```json
{
  "projectName": "nexus-flow",
  "ports": [8089, 8120, 8121],
  "runCommand": "go run main.go daemon start --port 8089"
}
```

---

## Usage Commands

```powershell
# Full build and run
.\run.ps1

# Clean rebuild
.\run.ps1 -Force

# Build frontend only
.\run.ps1 -BuildOnly

# Skip frontend build
.\run.ps1 -SkipBuild

# Configure firewall
.\run.ps1 -OpenFirewall
```

---

## Cross-Reference

See full PowerShell integration specification at:
- `02-spec/11-powershell-integration/00-overview.md`
- `02-spec/11-powershell-integration/02-script-reference.md`
- `02-spec/11-powershell-integration/05-firewall-rules.md`

---

*Standard PowerShell setup for all CLI projects.*
