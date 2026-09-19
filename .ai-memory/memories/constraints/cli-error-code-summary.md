# CLI Error Code Summary

> **Version:** 1.1.0  
> **Updated:** 2026-02-02  
> **Purpose:** Quick reference for all CLI tool error code ranges and their locations

---

## 🚨 CRITICAL CONSTRAINT

**THIS IS A SPEC-ONLY REPOSITORY.** No code implementation — only specifications.

---

## Error Code Range Overview

| CLI Tool | Prefix | Full Range | Frontend Sub-range | Spec Location |
|----------|--------|------------|-------------------|---------------|
| **GSearch CLI** | `GS` | 7000-7099 | 7050-7069 | `02-spec/20-gsearch-cli/` |
| **BRun CLI** | `BR` | 7100-7599 | 7150-7169 | `02-spec/21-brun-cli/` |
| **Nexus Flow** | `NF` | 8000-8399 | 8050-8069 | `02-spec/24-nexus-flow-cli/` |
| **AI Bridge** | `AB` | 9000-9540 | 9050-9069 | `02-spec/22-ai-bridge-cli/` |
| **PowerShell** | `PS` | 9500-9599 | N/A | `02-spec/50-powershell-integration/` |
| **WP Plugin Builder** | `WPB` | 10000-10999 | N/A | `02-spec/31-wp-plugin-builder/` |

---

## RAG Validation Error Codes (AB-9301 to AB-9310)

| Code | Name | Field | Test Coverage |
|------|------|-------|---------------|
| AB-9301 | `CHUNK_SIZE_OUT_OF_RANGE` | ChunkSize | 6 tests |
| AB-9302 | `CHUNK_SIZE_NOT_MULTIPLE` | ChunkSize | 4 tests |
| AB-9303 | `CHUNK_OVERLAP_INVALID` | ChunkOverlap | 10 tests |
| AB-9304 | `CONTEXT_BUDGET_INVALID` | ContextTokenBudget | 6 tests |
| AB-9305 | `EMBEDDING_MODEL_UNSUPPORTED` | EmbeddingModel | 6 tests |
| AB-9306 | `SIMILARITY_THRESHOLD_INVALID` | SimilarityThreshold | 8 tests |
| AB-9307 | `TOPK_INVALID` | TopK | 6 tests |
| AB-9308 | `CONFIG_LOAD_FAILED` | Config I/O | 4 tests |
| AB-9309 | `CONFIG_SAVE_FAILED` | Config I/O | 2 tests |
| AB-9310 | `CONFIG_CORRUPTED` | Config I/O | 2 tests |

**Test Coverage:** 54 tests total | 100% coverage  
**Spec Location:** `02-spec/07-seedable-config-architecture/03-rag-validation-helpers.md`  
**Test Spec:** `02-spec/07-seedable-config-architecture/04-rag-validation-tests.md`  
**Coverage Matrix:** `02-spec/07-seedable-config-architecture/05-rag-test-coverage-matrix.md`

---

## Detailed Error Code Documentation

### GSearch CLI (7000-7099)

| Sub-Range | Category | Error Codes Doc |
|-----------|----------|-----------------|
| 7000-7049 | Backend Core | `02-spec/20-gsearch-cli/01-backend/15-error-codes.md` |
| 7050-7069 | Frontend | Same file (frontend section) |

**Backend Categories:**
- 7001-7010: File System Errors
- 7011-7020: Git Operations
- 7021-7031: Search/HTTP Errors
- 7032-7039: Search Engine Errors

### BRun CLI (7100-7599)

| Sub-Range | Category | Error Codes Doc |
|-----------|----------|-----------------|
| 7100-7149 | Backend Core | `02-spec/21-brun-cli/01-backend/06-error-handling.md` |
| 7150-7169 | Frontend | Same file (frontend section) |

**Backend Categories:**
- 7100-7109: Configuration Errors
- 7110-7119: Build Errors
- 7120-7129: Port Management Errors
- 7130-7139: Runtime Errors
- 7140-7149: Integration Errors

### Nexus Flow CLI (8000-8399)

| Sub-Range | Category | Error Codes Doc |
|-----------|----------|-----------------|
| 8000-8049 | Backend Core | `02-spec/24-nexus-flow-cli/01-backend/04-error-codes.md` |
| 8050-8069 | Frontend | Same file (frontend section) |

**Backend Categories:**
- 8000-8009: Initialization Errors
- 8010-8019: Pipeline Errors
- 8020-8029: Orchestration Errors
- 8030-8039: Integration Errors

### AI Bridge CLI (9000-9999)

| Sub-Range | Category | Error Codes Doc |
|-----------|----------|-----------------|
| 9000-9049 | Backend Core | `02-spec/22-ai-bridge-cli/01-backend/05-error-codes.md` |
| 9050-9099 | Frontend | Same file (frontend section) |
| 9100-9199 | Input Parsing | Provider adapter errors |
| 9200-9299 | Backend Connection | LLM/backend connectivity |
| 9301-9310 | RAG Validation | RAG chunk config validation |
| 9311-9319 | Request Processing | Request validation errors |
| 9320-9339 | Model & Generation | Model loading, generation |
| 9400-9499 | Rate Limiting | Rate limit and quota errors |
| 9500-9540 | AI SEO Generate | SEO module errors |
| 9541-9599 | (Reserved) | Future SEO expansion |
| 9600-9699 | Split DB | Database operation errors |
| 9700-9799 | RAG/Embedding | Vector search errors |
| 9800-9899 | Voice/Image/Video | Multi-modal errors |

**AI Bridge Backend Categories:**
- 9000-9009: Startup/Initialization
- 9010-9019: Configuration Loading
- 9020-9029: Provider Registration
- 9030-9039: Model Category Mapping
- 9040-9049: General Backend Errors
- 9301-9310: RAG Configuration Validation
- 9500-9540: AI SEO Generate Module

---

## Frontend Error Code Pattern

All CLI frontends use a consistent error code pattern at offset +50 from their base range:

| Offset | Error Constant | Description |
|--------|----------------|-------------|
| +50 | `WS_CONNECTION_FAILED` | WebSocket connection failure |
| +51 | `WS_DISCONNECTED` | WebSocket unexpectedly closed |
| +52 | `SETTINGS_LOAD_FAILED` | Failed to load settings |
| +53 | `SETTINGS_SAVE_FAILED` | Failed to save settings |
| +54 | `API_TIMEOUT` | API request timeout |
| +55 | `API_ERROR` | API returned error response |
| +56 | `CONFIG_PARSE_ERROR` | Failed to parse config |
| +57 | `VERSION_MISMATCH` | Frontend/backend version mismatch |
| +58 | `PORT_UNAVAILABLE` | Configured port not available |
| +59 | `FIREWALL_BLOCKED` | Firewall blocking connection |

**Applied to each CLI:**
- GSearch: 7050-7059
- BRun: 7150-7159
- Nexus Flow: 8050-8059
- AI Bridge: 9050-9059

---

## Central Registry

The central error code registry is located at:
```
02-spec/03-error-code-registry/01-registry.md
```

This file contains:
- All registered project prefixes
- Complete error code listings per project
- Guidelines for adding new codes

---

## Port Assignments

| CLI | Primary Port | Fallback Ports |
|-----|--------------|----------------|
| GSearch | 8090 | 8091, 8092, 8093 |
| BRun | 8100 | 8101, 8102 |
| AI Bridge | 8089 | 8110, 8111, 8112 |
| Nexus Flow | 8120 | 8121, 8122 |

---

## Cross-References

| Document | Purpose |
|----------|---------|
| [Error Code Registry](../../../02-spec/03-error-code-registry/01-registry.md) | Central registry |
| [GSearch Error Codes](../../../02-spec/20-gsearch-cli/01-backend/15-error-codes.md) | GSearch CLI errors |
| [BRun Error Handling](../../../02-spec/21-brun-cli/01-backend/06-error-handling.md) | BRun CLI errors |
| [AI Bridge Error Codes](../../../02-spec/22-ai-bridge-cli/01-backend/05-error-codes.md) | AI Bridge CLI errors |
| [Nexus Flow Error Codes](../../../02-spec/24-nexus-flow-cli/01-backend/04-error-codes.md) | Nexus Flow CLI errors |

---

*Updated 2026-02-01. This file consolidates error code ranges across all CLI tools.*
