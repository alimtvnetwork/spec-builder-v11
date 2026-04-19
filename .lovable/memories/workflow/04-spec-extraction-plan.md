# Spec Extraction Plan

> **Version:** 2.0.0  
> **Created:** 2026-02-01  
> **Status:** ✅ Complete (All Phases + Frontend Specs)  
> **Purpose:** Extract standalone specs from spec-management-software

---

## Overview

Extract four tools/systems from `spec/11-spec-management-software/05-features/` into standalone root-level specifications, while maintaining references from the parent spec.

---

## Extraction Targets

| # | Source Location | Target Location | Files | Status |
|---|-----------------|-----------------|-------|--------|
| 1 | `05-features/22-golang-search-cli/` | `spec/20-gsearch-cli/` | 27 files | ✅ Complete |
| 2 | `05-features/30-ai-bridge/` | `spec/22-ai-bridge-cli/` | 8 files | ✅ Complete |
| 3 | `14-microservices/` (Nexus files) | `spec/24-nexus-flow-cli/` | 7 files | ✅ Complete |
| 4 | `05-features/23-build-runner-cli/` | `spec/21-brun-cli/` | 19 files | ✅ Complete |
| 5 | *NEW* | `spec/28-shared-cli-frontend/` | 10 files | ✅ Complete |

---

## Completed Phases

### Phase 1-4: CLI Extraction ✅
All four CLI tools extracted to standalone specifications.

### Phase 5: Integration References ✅
Updated in `spec/11-spec-management-software/15-external-tools/`

### Phase 6: Consistency Check ✅
All cross-references verified valid.

### Phase 7: Frontend Architecture ✅ NEW
Created shared CLI frontend specification and added frontend specs to each CLI:

| CLI | Frontend Spec | Port Range |
|-----|---------------|------------|
| GSearch CLI | `24-frontend-architecture.md` | 8090-8092 |
| BRun CLI | `17-frontend-architecture.md` | 8100-8102 |
| AI Bridge | `07-frontend-architecture.md` | 8110-8112 |
| Nexus Flow | `06-frontend-architecture.md` | 8089, 8120-8121 |

**Shared Spec:** `spec/28-shared-cli-frontend/` (10 files)

---

## Completion Summary

All 7 phases completed successfully:

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | GSearch CLI Extraction | ✅ Complete |
| 2 | AI Bridge Extraction | ✅ Complete |
| 3 | Nexus Flow Extraction | ✅ Complete |
| 4 | BRun CLI Extraction | ✅ Complete |
| 5 | Integration References | ✅ Complete |
| 6 | Consistency Check | ✅ Complete |
| 7 | Frontend Architecture | ✅ Complete |

**Total Files:** 71 across 5 standalone specifications

---

## Current Root Spec Structure

```
spec/
├── 20-gsearch-cli/              # ✅ 27 files
├── 22-ai-bridge-cli/            # ✅ 8 files
├── 24-nexus-flow-cli/           # ✅ 7 files
├── 21-brun-cli/                 # ✅ 19 files
├── 28-shared-cli-frontend/      # ✅ 10 files (NEW)
├── 50-powershell-integration/   # Existing
├── 03-error-code-registry/      # Existing
├── 01-general-spec/             # Existing
├── 11-spec-management-software/ # Parent
└── 30-wp-plugin/                # WordPress plugins
```

---

## Error Code Allocation

| Range | Tool | Frontend Sub-range |
|-------|------|-------------------|
| 7000-7099 | GSearch CLI | 7050-7069 |
| 7100-7599 | BRun CLI | 7150-7169 |
| 8000-8399 | Nexus Flow | 8050-8069 |
| 9000-9999 | AI Bridge | 9050-9069 |

---

## Next Steps

1. Implement CLI backend code
2. Implement React frontends following `spec/28-shared-cli-frontend/`
3. Set up PowerShell runners for each CLI

---

*Updated 2026-02-01 — Phase 7 (Frontend Architecture) complete*
