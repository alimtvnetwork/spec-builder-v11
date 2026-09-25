# BRun CLI

**Version:** 4.1.0  
**Status:** Complete  
**Updated:** 2026-03-30  
**AI Confidence:** Production-Ready  
**Ambiguity:** Low

---

## Keywords

`brun` · `golang` · `cli` · `build-runner` · `multi-runtime` · `powershell` · `nodejs` · `error-capture` · `ai-integration` · `port-management`

---

## Scoring

| Metric | Value |
|--------|-------|
| AI Confidence | Production-Ready |
| Ambiguity | Low |
| Health Score | 100/100 (A+) |

---

## Summary

A lightweight Golang CLI tool for running builds, executing commands, and detecting errors across multiple runtimes (PowerShell, Node.js, Go). Designed to integrate with the main Spec Management application for AI-assisted error fixing loops.

**Binary Name:** `brun`  
**Module Path:** `github.com/user/brun`

---

## Folder Structure

```
26-brun-cli/
├── 00-overview.md                          # This file
├── 01-backend/                             # Backend specifications
│   ├── 00-overview.md                      # Backend overview
│   ├── 01-core-architecture.md             # System design
│   ├── 02-cli-interface.md                 # Commands and parameters
│   ├── 03-configuration.md                 # config.json schema
│   ├── 04-runtime-executors.md             # PowerShell, Node.js, Go
│   ├── 05-port-management.md               # Port checking, fallback
│   ├── 06-error-handling.md                # Error capture, logging
│   ├── 07-build-profiles.md                # Saved configurations
│   ├── 08-asset-operations.md              # File copy, override modes
│   ├── 09-integration-api.md               # Subprocess protocol
│   ├── 10-data-models.md                   # GORM entities
│   ├── 11-acceptance-criteria.md           # Validation requirements
│   ├── 12-ai-config-generation.md          # AI config creation
│   ├── 13-testing-strategy.md              # Integration tests, CI/CD
│   ├── 14-implementation-guide.md          # Build order
│   └── 15-observability.md                 # Prometheus, health checks
├── 02-frontend/                            # Frontend specifications
│   ├── 00-overview.md                      # Frontend overview
│   └── 01-frontend-architecture.md         # React UI
├── 03-deploy/                              # Deployment specifications
│   ├── 00-overview.md                      # Deploy overview
│   └── 01-deployment-guide.md              # Cross-platform install
└── 99-consistency-report.md                # Consistency verification
```

---

## Key Features

### 1. Multi-Runtime Execution
- **PowerShell**: Direct script execution via `-ps` flag
- **Node.js**: npm/yarn/bun build commands
- **Golang**: go build, go mod tidy, go run

### 2. Build Profile Management
- Save build configurations to config.json
- Specify source paths, output directories, asset copying
- Clear/override/skip modes for file operations

### 3. Port Management
- Check port availability before running
- Automatic fallback to alternative ports
- Firewall rule management (Windows/Linux)

### 4. Error Capture & Reporting
- JSON output for programmatic consumption
- File-based logging (log.txt, error.txt)
- Dynamic run ID with dedicated log folders
- Stack trace capture for debugging

### 5. AI Integration Loop
- Designed for recursive error-fixing workflow
- Main app triggers build → captures errors → feeds to AI → retries

---

## Quick Start

```bash
# Run PowerShell script
brun -ps "scripts/build.ps1"

# Check Go build for errors
brun check --go ./cmd/app

# Run saved build profile
brun build --profile backend-api

# Check port availability
brun port --check 8080 --fallback 8081,8082
```

---

## Error Code Range

BRun CLI uses error codes **7100-7599**.

| Range | Category |
|-------|----------|
| 71xx | CLI/argument errors |
| 72xx | Configuration errors |
| 73xx | Execution errors |
| 74xx | Port management errors |
| 75xx | Health check errors |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Split DB Architecture | `../05-split-db-architecture/00-overview.md` |
| Seedable Config Architecture | `../06-seedable-config-architecture/00-overview.md` |
| Shared CLI Frontend | `../33-shared-cli-frontend/00-overview.md` |
| PowerShell Integration | `../11-powershell-integration/00-overview.md` |
| Error Resolution | `../03-error-manage/01-error-resolution/00-overview.md` |
| **DBOperation Wrapper** | `../04-database-conventions/01-sqlite-standards.md` |
| **ORM-Only Policy** | `../04-database-conventions/02-orm-standards.md` |
| External Tools Reference | `../21-app/readme.md` |
