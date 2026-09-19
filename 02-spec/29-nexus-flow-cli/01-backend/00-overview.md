# Nexus Flow CLI: Backend Specifications

**Version:** 3.1.0  
**Updated:** 2026-03-30    
**AI Confidence:** High  
**Ambiguity:** None

---


## Keywords

`nexus`, `flow`, `cli`, `backend`

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

This folder contains all backend specifications for Nexus Flow CLI.

---

## Files

| File | Description |
|------|-------------|
| 11-microservices-context.md | Microservices ecosystem context |
| 01-core-specification.md | Core workflow engine specification |
| 02-standalone-architecture.md | Standalone deployment architecture |
| 03-openapi-specification.md | REST API specification |
| 04-error-codes.md | Error code definitions (8xxx range) |
| 05-database-architecture.md | Split DB + Reset API |
| 06-implementation-checklist.md | Phase-based implementation guide |
| 07-observability.md | Prometheus, health checks, tracing |
| 08-settings-service.md | Settings service with seedable config |
| **09-reset-api.md** | **Reset API specification** |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Overview | `../00-overview.md` |
| Split DB Architecture | `02-spec/06-split-db-architecture/00-overview.md` |
| Reset API Standard | `02-spec/06-split-db-architecture/02-reset-api-standard.md` |
| Frontend | `../02-frontend/` |
| Deploy | `../03-deploy/` |
