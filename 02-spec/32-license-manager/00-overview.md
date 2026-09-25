# License Manager CLI (lm)

**Version:** 2.1.0  
**Status:** Draft  
**Updated:** 2026-03-30  
**AI Confidence:** Medium  
**Ambiguity:** Medium

---

## Keywords

`license-manager` · `golang` · `cli` · `license-keys` · `activation` · `sqlite` · `split-db` · `validation`

---

## Scoring

| Metric | Value |
|--------|-------|
| AI Confidence | Medium |
| Ambiguity | Medium |
| Health Score | 100/100 (A+) |

---

## Overview

The License Manager CLI (`lm`) manages software license keys for all ecosystem CLI tools. It handles license generation, validation, activation/deactivation, and expiration tracking. Licenses are stored in a local SQLite database following the Split DB architecture and can be validated against a remote licensing server.

---

## Architecture

The License Manager operates as a standalone CLI tool with optional server-side validation. It supports offline-first operation with periodic online verification.

### Core Capabilities

| Capability | Description |
|------------|-------------|
| License Generation | Create license keys with configurable constraints |
| Activation | Bind licenses to machine fingerprints |
| Validation | Verify license validity (offline + online) |
| Expiration Tracking | Monitor and alert on upcoming expirations |
| Usage Metering | Track feature usage against license limits |
| Reporting | Generate license utilization reports |

---

## Document Index

| # | Document | Description |
|---|----------|-------------|
| 00 | `00-overview.md` | This file — project index |
| 01 | `01-architecture.md` | System architecture and component design |
| 02 | `02-cli-interface.md` | CLI commands and flags |
| 03 | `03-data-models.md` | Database schema and GORM models |
| 04 | `04-error-handling.md` | Error codes (LM 15000–15999) |
| 05 | `05-acceptance-criteria.md` | GIVEN/WHEN/THEN test scenarios |
| 06 | `06-configuration.md` | Configuration and settings |
| — | `error-codes.json` | Machine-readable error code index |

---

## CLI Structure

```
02-spec/32-license-manager/
├── 00-overview.md
├── 01-architecture.md
├── 02-cli-interface.md
├── 03-data-models.md
├── 04-error-handling.md
├── 05-acceptance-criteria.md
├── 06-configuration.md
├── error-codes.json
└── 99-consistency-report.md
```

> **Note:** This module does not yet have `01-backend/`, `02-frontend/`, `03-deploy/` subdirectories. These will be added when the module matures beyond Draft status.

---

## Error Code Range

| Range | Purpose |
|-------|---------|
| 15000–15099 | Initialization & Configuration |
| 15100–15199 | License Generation |
| 15200–15299 | Activation & Deactivation |
| 15300–15399 | Validation |
| 15400–15499 | Expiration & Renewal |
| 15500–15599 | Usage Metering |
| 15600–15699 | Reporting |
| 15700–15999 | Reserved |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Error Code Registry | `../03-error-manage/03-error-code-registry/readme.md` |
| Error Codes JSON | `./error-codes.json` |
| Split DB Architecture | `../05-split-db-architecture/00-overview.md` |
| Seedable Config | `../06-seedable-config-architecture/00-overview.md` |
| Shared CLI Frontend | `../33-shared-cli-frontend/00-overview.md` |
| Spec Authoring Guide | `../01-spec-authoring-guide/readme.md` |
