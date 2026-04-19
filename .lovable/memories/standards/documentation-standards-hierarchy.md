# Documentation Standards Hierarchy

**Version:** 1.0.0  
**Updated:** 2026-02-04  
**Purpose:** Complete map of the documentation standards ecosystem and their relationships

---

## Overview

This document defines the complete hierarchy of documentation standards established across the project ecosystem. It serves as a navigational guide for understanding how different standards relate to and reinforce each other.

---

## Hierarchy Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DOCUMENTATION STANDARDS HIERARCHY                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                     TIER 1: ROOT CONTEXT (Entry Point)                 │ │
│  │                                                                         │ │
│  │  context-for-ai.md                                                      │ │
│  │  └── Primary AI onboarding document                                     │ │
│  │  └── Links to all major architectural patterns                          │ │
│  │  └── 60-second rapid onboarding                                         │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                     TIER 2: STANDARDS HUBS                              │ │
│  │                                                                         │ │
│  │  00-database-standards-hub.md ─────────┐                                │ │
│  │  └── DBOperation wrapper mandate       │                                │ │
│  │  └── ORM-only policy                   │    CROSS-LINKED                │ │
│  │  └── 7-field logging standard          │◄───────────────────────────►   │ │
│  │                                        │                                │ │
│  │  unified-preflight-checklist.md ───────┘                                │ │
│  │  └── Combined DB + Seedable Config                                      │ │
│  │  └── Pre-implementation verification                                    │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                     TIER 3: TRAINING BUNDLES                            │ │
│  │                                                                         │ │
│  │  11-database-standards-training-bundle.md                               │ │
│  │  └── DBOperation usage patterns                                         │ │
│  │  └── Relationship-First ORM examples                                    │ │
│  │  └── Structured logging examples                                        │ │
│  │                                                                         │ │
│  │  12-seedable-config-training-bundle.md                                  │ │
│  │  └── config.seed.json patterns                                          │ │
│  │  └── Typed accessor usage                                               │ │
│  │  └── Golden Rule seeding logic                                          │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                     TIER 4: AUDIT & VERIFICATION                        │ │
│  │                                                                         │ │
│  │  cli-compliance-audit-template.md                                       │ │
│  │  └── 39-point verification checklist                                    │ │
│  │  └── grep/jq verification commands                                      │ │
│  │  └── Scoring system                                                     │ │
│  │                                                                         │ │
│  │  .lovable/audits/                                                       │ │
│  │  └── Completed audit reports                                            │ │
│  │  └── Compliance tracking                                                │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │ 
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                     TIER 5: INDIVIDUAL STANDARDS                        │ │
│  │                                                                         │ │
│  │  Database Standards:                                                    │ │
│  │  ├── orm-only-policy.md                                                 │ │
│  │  ├── database-operation-wrapper.md                                      │ │
│  │  └── database-preflight-checklist.md                                    │ │
│  │                                                                         │ │
│  │  Naming Standards:                                                      │ │
│  │  ├── 09-database-naming-conventions.md (PascalCase)                     │ │
│  │  └── documentation-naming-convention-lowercase.md                       │ │
│  │                                                                         │ │
│  │  Error Standards:                                                       │ │
│  │  ├── error-resolution-standard.md                                       │ │
│  │  └── cli-error-code-summary.md                                          │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Standards Categories

### 1. Database Standards

| Standard | Location | Purpose |
|----------|----------|---------|
| Database Standards Hub | `.lovable/memories/standards/00-database-standards-hub.md` | Central linking document |
| DBOperation Wrapper | `spec/11-spec-management-software/13-shared-packages/06-pkg-database-operations.md` | Mandatory wrapper implementation |
| ORM-Only Policy | `.lovable/memories/standards/orm-only-policy.md` | No raw SQL mandate |
| 7-Field Logging | `.lovable/memories/standards/database/seven-mandatory-log-fields.md` | Audit trail requirements |
| Stack Trace Capture | `.lovable/memories/technical/stack-trace-capture.md` | Error debugging requirement |

### 2. Configuration Standards

| Standard | Location | Purpose |
|----------|----------|---------|
| Seedable Config Architecture | `spec/07-seedable-config-architecture/00-overview.md` | Core seeding patterns |
| Settings Service Standard | `.lovable/memories/technical/settings-service-standard.md` | Typed accessor requirements |
| Validation Data Architecture | `.lovable/memories/technical/validation-data-architecture.md` | No hardcoding rule |
| Golden Rule Seeding | `.lovable/memories/technical/seeding-logic-golden-rule.md` | Version-gated seeding logic |

### 3. Naming Standards

| Standard | Location | Purpose |
|----------|----------|---------|
| PascalCase Mandate | `.lovable/memories/style/naming-convention.md` | All identifiers |
| SQL Schema PascalCase | `.lovable/memories/architecture/split-db-sql-pascal-case.md` | Database columns |
| Lowercase Filenames | `.lovable/memories/style/documentation-naming-convention-lowercase.md` | Markdown files |

### 4. CLI Documentation Standards

| Standard | Location | Purpose |
|----------|----------|---------|
| 8-Core Documents | `.lovable/memories/standards/cli-documentation-requirements.md` | Required spec documents |
| Compliance Audit Template | `.lovable/memories/standards/cli-compliance-audit-template.md` | Verification framework |
| Error Code Registry | `.lovable/memories/technical/error-code-registry.md` | Code range assignments |

### 5. Process Standards

| Standard | Location | Purpose |
|----------|----------|---------|
| Error Resolution | `spec/04-error-resolution/` | Universal debugging process |
| Frontend-Backend Sync | `.lovable/memories/standards/frontend-backend-endpoint-verification.md` | Endpoint matching |
| Initialization Order | `.lovable/memories/technical/go-service-initialization-order.md` | Config → DB → Services → HTTP |

---

## Compliance Flow

```
New CLI Tool Development
         │
         ▼
┌─────────────────────────┐
│ 1. Read context-for-ai  │
│    (60-second overview) │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 2. Study Training       │
│    Bundles (11, 12)     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 3. Apply Pre-Flight     │
│    Checklist            │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 4. Implement with       │
│    Standards            │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 5. Run Compliance       │
│    Audit                │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 6. Store Audit Report   │
│    in .lovable/audits/  │
└─────────────────────────┘
```

---

## Quick Reference

### Must-Read Before Implementation

1. `context-for-ai.md` - Entry point
2. `.lovable/memories/standards/unified-preflight-checklist.md` - Combined checklist
3. `.lovable/memories/training/11-database-standards-training-bundle.md` - DB patterns
4. `.lovable/memories/training/12-seedable-config-training-bundle.md` - Config patterns

### Must-Verify After Implementation

1. `.lovable/memories/standards/cli-compliance-audit-template.md` - Run audit
2. Store report in `.lovable/audits/`

---

## Cross-References

| Document | Purpose |
|----------|---------|
| Memory Index | `.lovable/memories/00-memory-index.md` |
| Database Standards Hub | `.lovable/memories/standards/00-database-standards-hub.md` |
| Root Context | `context-for-ai.md` |

---

*Authoritative map of documentation standards hierarchy for the project ecosystem.*
