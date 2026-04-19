# BRun CLI: Backend Specifications

**Version:** 4.1.0  
**Updated:** 2026-03-30    
**AI Confidence:** High  
**Ambiguity:** None

---


## Keywords

`brun`, `cli`, `backend`

---

## Scoring

| Criterion | Status |
|-----------|--------|
| `00-overview.md` present | ✅ |
| AI Confidence assigned | ✅ |
| Ambiguity assigned | ✅ |
| Keywords present | ✅ |
| Scoring table present | ✅ |


## Overview

This folder contains all backend specifications for BRun CLI.

---

## Files

| File | Description |
|------|-------------|
| 01-core-architecture.md | System design and components |
| 02-cli-interface.md | Commands and parameters |
| 03-configuration.md | config.json schema |
| 04-runtime-executors.md | PowerShell, Node.js, Go runners |
| 05-port-management.md | Port checking, fallback, firewall |
| 06-error-handling.md | Error capture, JSON output, logging |
| 07-build-profiles.md | Saved build configurations |
| 08-asset-operations.md | File copy, clear, override modes |
| 09-integration-api.md | Subprocess communication protocol |
| 10-data-models.md | GORM entities and schemas |
| 11-acceptance-criteria.md | Validation requirements |
| 12-ai-config-generation.md | AI-assisted config creation |
| 13-testing-strategy.md | Integration tests, mocks, CI/CD |
| 14-implementation-guide.md | Build order and dependency graph |
| 15-observability.md | Prometheus, health checks, logging |
| 16-database-architecture.md | Split DB + Reset API |
| 17-settings-service.md | Settings service with seedable config |
| **18-reset-api.md** | **Reset API specification** |
| **openapi-brun.yaml** | **OpenAPI 3.1 REST API specification** |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Overview | `../00-overview.md` |
| Split DB Architecture | `spec/06-split-db-architecture/00-overview.md` |
| Reset API Standard | `spec/06-split-db-architecture/02-reset-api-standard.md` |
| Frontend | `../02-frontend/` |
| Deploy | `../03-deploy/` |
