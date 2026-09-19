# Memory: technical/error-code-registry

**Updated:** 2026-02-05
**Version:** 1.0.0  

---

## Summary

Error codes are strictly partitioned by prefix and range across the CLI ecosystem. All systems must map failures to these standardized codes for consistent error handling.

---

## Registered Prefixes and Ranges

| Range | Prefix | CLI/Module | Description |
|-------|--------|------------|-------------|
| 1000-1999 | GEN | General/Shared | Init, auth, authz, validation, business logic, DB, casting, filesystem, network |
| 2000-2999 | SM | Spec Management | Spec parsing, dependencies |
| 3000-3999 | LM | Link Manager | WordPress link management |
| 4000-4999 | CLI | CLI Tools (legacy) | Deprecated |
| **7000-7099** | **GS** | **GSearch Core** | CLI startup, validation |
| **7090-7096** | **GS** | **GSearch Model Decomposition** | Struct refactoring errors |
| **7100-7599** | **GS** | **GSearch BRun CLI** | Build runner operations |
| **7600-7609** | **GS** | **GSearch Movie Search** | TMDB/OMDB, filename parsing |
| **7700-7839** | **GS** | **GSearch BI Suite** | Multi-engine search, FAQ, SERP, contacts |
| **7840-7859** | **GS** | **GSearch Multi-Source** | Platform-specific + site-search |
| **7860-7879** | **GS** | **GSearch Scheduled Search** | Cron, interval, one-time scheduling |
| **7880-7899** | **GS** | **GSearch Chrome Extension** | Offline sync, browser integration |
| **7900-7919** | **GS** | **GSearch Enum Architecture** | Enum validation, parsing |
| **7920-7949** | **GS** | **GSearch Provider Integration** | SerpAPI, Colly, Maps Scraper |
| **8000-8399** | **NF** | **Nexus Flow CLI** | Workflow engine |
| **9000-9499** | **AB** | **AI Bridge Core** | Chat, providers, RAG |
| **9500-9599** | **PS** | **PowerShell Integration** | PS scripts |
| **9600-9849** | **AB** | **AI Bridge Extended** | Revisions, Suggestions, Reasoning, WS |
| **9850-9869** | **AB** | **AI Bridge Pattern Learning** | Code pattern detection |
| **9870-9889** | **AB** | **AI Bridge Plan Generation** | Plan creation and validation |
| **9890-9909** | **AB** | **AI Bridge Plan Sync** | Plan synchronization |
| **9910-9929** | **AB** | **AI Bridge Plan Templates** | Template management |
| **9930-9949** | **AB** | **AI Bridge Execution Monitoring** | Checkpoints, rollback |
| **9950-9969** | **AB** | **AI Bridge Retry Strategies** | Error recovery, backoff |
| **9970-9989** | **AB** | **AI Bridge Long-Chain Commands** | Command registry, parallel execution |
| **9990-9999** | **AB** | **AI Bridge Vector DB** | chromem-go, embeddings |
| 10000-10999 | WPB | WP Plugin Builder | WordPress plugins |
| 11000-11999 | SRC | Spec Reverse CLI | Spec reverse engineering |
| 12000-12599 | WSP | WP SEO Publish | SEO publishing |
| 13000-13499 | WPP | WP Plugin Publish | SVN, release management |
| 14000-14499 | AIT | AI Transcribe CLI | Speech-to-text, TTS |
| 14500-14999 | EQM | Exam Manager | WordPress exam plugin |
| 15000-15999 | LM | Link Manager | WordPress link management (reassigned from 3000) |
| **16000-16799** | **SM-CG** | **SM Code Generation** | Reassigned from 12xxx (collision with WSP) |
| **17000-17999** | **SM-PE** | **SM Project Editor** | Reassigned from 13xxx (collision with WPP) |

---

## GEN-000: Initialization

| Code | Name | Emitted By |
|------|------|------------|
| GEN-000-01 | `CONFIG_MISSING` | Configuration file not found |
| GEN-000-02 | `CONFIG_INVALID` | Configuration file is malformed |
| GEN-000-03 | `ENV_MISSING` | Required environment variable not set |

---

## GEN-100: Authentication

| Code | Name | Emitted By |
|------|------|------------|
| GEN-100-01 | `AUTH_REQUIRED` | Authentication required |
| GEN-100-02 | `TOKEN_EXPIRED` | Authentication token has expired |
| GEN-100-03 | `TOKEN_INVALID` | Authentication token is invalid |
| GEN-100-04 | `CREDENTIALS_INVALID` | Invalid username or password |

---

## GEN-200: Authorization

| Code | Name | Emitted By |
|------|------|------------|
| GEN-200-01 | `ACCESS_DENIED` | Access denied to this resource |
| GEN-200-02 | `ROLE_REQUIRED` | Insufficient role privileges |
| GEN-200-03 | `PERMISSION_DENIED` | Permission not granted |

---

## GEN-300: Validation

| Code | Name | Emitted By |
|------|------|------------|
| GEN-300-01 | `FIELD_REQUIRED` | Required field is missing |
| GEN-300-02 | `FIELD_INVALID` | Field value is invalid |
| GEN-300-03 | `FORMAT_INVALID` | Input format is invalid |
| GEN-300-04 | `LENGTH_EXCEEDED` | Input exceeds maximum length |

---

## GEN-400: Business Logic

| Code | Name | Emitted By |
|------|------|------------|
| GEN-400-01 | `OPERATION_FAILED` | General business operation failure |
| GEN-400-02 | `STATE_INVALID` | Invalid state for requested operation |
| GEN-400-03 | `CONFLICT` | Operation conflicts with current state |
| GEN-400-04 | `LIMIT_EXCEEDED` | Operation limit exceeded |

---

## GEN-500: Database

| Code | Name | Emitted By |
|------|------|------------|
| GEN-500-01 | `DB_CONNECTION` | Database connection failed |
| GEN-500-02 | `DB_QUERY` | Database query failed |
| GEN-500-03 | `DB_TRANSACTION` | Transaction failed |
| GEN-500-04 | `RECORD_NOT_FOUND` | Record not found |
| GEN-500-05 | `DUPLICATE_RECORD` | Record already exists |

---

## GEN-600: Type Casting / Conversion

| Code | Go Constant | Name | Emitted By |
|------|-------------|------|------------|
| GEN-600-01 | `ECast001` | `CAST_TYPE_ASSERTION_FAILED` | `typecast.CastOrFail[T]()` |
| GEN-600-02 | `ECast002` | `CAST_SLICE_ELEMENT_FAILED` | `typecast.CastSliceOrFail[T]()` |

- Prefix: `CAST` (cross-cutting, lives under GEN range)
- Source: `pkg/typecast/`
- Spec: `02-spec/02-coding-guidelines/01-cross-language/03-casting-elimination-patterns.md`

---

## GEN-700: File System

| Code | Name | Emitted By |
|------|------|------------|
| GEN-700-01 | `FILE_NOT_FOUND` | File not found at specified path |
| GEN-700-02 | `FILE_READ_FAILED` | Failed to read file |
| GEN-700-03 | `FILE_WRITE_FAILED` | Failed to write file |
| GEN-700-04 | `DIR_CREATE_FAILED` | Failed to create directory |
| GEN-700-05 | `PERMISSION_DENIED` | Insufficient file system permissions |

---

## GEN-800: Network

| Code | Name | Emitted By |
|------|------|------------|
| GEN-800-01 | `NETWORK_ERROR` | Network request failed |
| GEN-800-02 | `TIMEOUT` | Request timed out |
| GEN-800-03 | `SERVICE_UNAVAILABLE` | Service temporarily unavailable |

---

## GEN-900: Reserved

> Reserved for future cross-cutting error categories. No codes should be registered in this range until a new category is formally defined and documented.

| Code | Name | Emitted By |
|------|------|------------|
| *(none allocated)* | — | Reserved for future use |

---

## GSearch BI Suite Detail (7700-7839)

| Range | Category |
|-------|----------|
| 7700-7709 | Multi-Engine Search |
| 7710-7719 | FAQ Discovery |
| 7720-7729 | SERP Tracking |
| 7730-7739 | Contact Extraction |
| 7740-7749 | Maps Search |
| 7750-7759 | Response Formatting/Cache |
| 7760-7769 | Webhook |
| 7800-7819 | Frontend |
| 7820-7839 | Reserved |

---

## AI Bridge Extended Detail (9600-9999)

| Range | Category |
|-------|----------|
| 9700-9709 | Revisions |
| 9710-9719 | Suggestions |
| 9800-9809 | RAG Session |
| 9820-9829 | Reasoning |
| 9830-9839 | WebSocket Resilience |
| 9840-9847 | Context Integration |
| 9848-9849 | Research Mode |
| 9850-9869 | Code Pattern Learning |
| 9870-9889 | Plan Generation |
| 9890-9909 | Plan Synchronization |
| 9910-9929 | Plan Templates |
| 9930-9949 | Execution Monitoring |
| 9950-9969 | Retry Strategies |
| 9970-9989 | Long-Chain Command System |
| 9990-9999 | Vector Database Integration |

---

## Key References

- Central Registry: `02-spec/03-error-code-registry/01-registry.md`
- GSearch BI Suite: `02-spec/20-gsearch-cli/01-backend/openapi-bi-suite.yaml`
- GSearch Movie Search: `02-spec/20-gsearch-cli/01-backend/15-error-codes.md`
- GSearch Model Decomposition: `02-spec/20-gsearch-cli/01-backend/54-model-decomposition.md`
- AI Bridge Errors: `02-spec/22-ai-bridge-cli/01-backend/05-error-codes.md`
- AI Bridge Long-Chain: `02-spec/22-ai-bridge-cli/01-backend/50-long-chain-command-system.md`
- AI Bridge Vector DB: `02-spec/22-ai-bridge-cli/01-backend/51-vector-database-integration.md`
- BRun CLI Errors: `02-spec/21-brun-cli/01-backend/06-error-handling.md`
- Nexus Flow Errors: `02-spec/24-nexus-flow-cli/01-backend/04-error-codes.md`
