# Error Code Registry

**Version:** 2.0.0  
**Status:** Active  
**Last Updated:** 2026-03-09

---

## Overview

Master registry of all error codes used across the Spec Management Software. This document serves as the single source of truth for error code allocation and definitions.

**Cross-References:**
- [Error Management Overview](./00-overview.md)
- [Backend Error Codes](./02-backend/01-error-codes.md)
- [Frontend Error Codes](./03-frontend/01-error-codes.md)
- [API Contracts](../05-features/15-api-client/02-api-contracts.md)
- [brun CLI Error Handling](../05-features/23-build-runner-cli/06-error-handling.md) — Detailed 7100-7599 implementation
- [Code Generation Errors](../05-features/24-code-generation-system/16-error-codes.md) — 12xxx range
- [Project Editor Errors](../05-features/28-project-editor/05-error-codes.md) — 13xxx range

---

## Error Code Architecture

### Code Range Allocation

| Range | Category | Owner | Description |
|-------|----------|-------|-------------|
| 1xxx | Validation | Shared | Input validation, format errors |
| 2xxx | Authentication | Backend | Auth, tokens, sessions |
| 3xxx | Database | Backend | SQLite, queries, transactions |
| 4xxx | External Services | Backend | Network, HTTP, third-party APIs |
| 5xxx | Business Logic | Shared | Domain rules, state, processing |
| 6xxx | File System/Git | Backend | Files, paths, Git operations |
| 7xxx | LLM/Config/CLI | Backend | LLM server, models, config, brun CLI |
| 8xxx | RAG/Knowledge | Backend | RAG, embeddings, knowledge |
| 9xxx | System/Consistency | Backend | System errors, consistency checks |
| 10xxx | Context Window | Backend | Token budgeting, context assembly |
| 11xxx | Instructions | Backend | Instruction system, tasks |
| 12xxx | Code Generation | Backend | AI code generation, Git, credits |
| **13xxx** | **Project Editor** | **Frontend** | **Input persistence, drafts, sync** |
| **14xxx** | **AI Transcribe** | **Backend** | **STT, TTS, voice processing** |

### 7xxx Sub-Range Allocation

| Sub-Range | Category | Description |
|-----------|----------|-------------|
| 7001-7049 | LLM Server | LLM model loading, execution, slots |
| 7050-7099 | Configuration | Main app config management |
| 7100-7199 | brun: CLI/Config | brun CLI args, config.json |
| 7200-7299 | brun: Runtime | PowerShell, Node.js, Go execution |
| 7300-7399 | brun: Ports | Port checking, firewall management |
| 7400-7499 | brun: Build | Compilation, assets, working dirs |
| 7500-7599 | brun: Health | Application health check monitoring |

### 12xxx Sub-Range Allocation (Code Generation)

| Sub-Range | Category | Description |
|-----------|----------|-------------|
| 12000-12099 | General | Core code generation errors |
| 12100-12199 | Guidelines | Guideline resolution errors |
| 12200-12299 | Planning | Plan generation errors |
| 12300-12399 | Execution | Parallel execution errors |
| 12400-12499 | Git | Git operation errors |
| 12500-12599 | Build | Build verification errors |
| 12600-12699 | Credits | Credit system errors |
| 12700-12799 | Repository | Repository structure errors |

### 13xxx Sub-Range Allocation (Project Editor)

| Sub-Range | Category | Description |
|-----------|----------|-------------|
| 13000-13099 | General | Module-level errors |
| 13100-13199 | Input Persistence | localStorage/IndexedDB errors |
| 13200-13299 | Draft Recovery | Recovery detection and restore errors |
| 13300-13399 | Sync API | Cross-device synchronization errors |
| 13400-13499 | Editor State | Cursor, scroll, undo/redo errors |
| 13500-13599 | Validation | Input validation errors |
| 13900-13999 | Internal | Internal/unexpected errors |

### 14xxx Sub-Range Allocation (AI Transcribe CLI)

| Sub-Range | Category | Description |
|-----------|----------|-------------|
| 14000-14049 | General | Core transcribe service errors |
| 14050-14099 | Audio Pipeline | Audio processing, format, encoding |
| 14100-14149 | STT | Speech-to-text provider errors |
| 14150-14199 | TTS | Text-to-speech provider errors |
| 14200-14249 | Voice Commands | Command detection, execution |
| 14250-14299 | Voice Cloning | Clone creation, training, quality |
| 14300-14349 | Realtime | WebSocket, conversation, VAD |
| 14350-14399 | Session | Session management, transcripts |
| 14400-14449 | Configuration | Config loading, validation |
| 14450-14499 | Provider | Provider-specific errors |

---

## 1xxx - Validation Errors

Input validation and format errors used by both frontend and backend.

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 1001 | `ErrValidationRequired` | 400 | Required field is missing | No |
| 1002 | `ErrValidationFormat` | 400 | Invalid format (email, URL, etc.) | No |
| 1003 | `ErrValidationRange` | 400 | Value outside allowed range | No |
| 1004 | `ErrValidationLength` | 400 | String length violation (min/max) | No |
| 1005 | `ErrValidationType` | 400 | Type mismatch | No |
| 1006 | `ErrValidationUnique` | 409 | Uniqueness constraint violated | No |
| 1007 | `ErrValidationReference` | 400 | Invalid reference/foreign key | No |
| 1008 | `ErrValidationPattern` | 400 | Regex pattern mismatch | No |
| 1009 | `ErrValidationEnum` | 400 | Value not in allowed set | No |
| 1010 | `ErrValidationBatch` | 400 | Multiple validation failures | No |
| 1011 | `ErrValidationUrlScheme` | 400 | Invalid URL scheme (not http/https) | No |
| 1012 | `ErrValidationPathTraversal` | 400 | Path traversal attempt detected | No |
| 1013 | `ErrValidationPatternSyntax` | 400 | Invalid regex syntax | No |
| 1014 | `ErrValidationPatternRedos` | 400 | Catastrophic backtracking detected | No |
| 1015 | `ErrValidationFileType` | 400 | Unsupported file type | No |
| 1016 | `ErrValidationFileSize` | 400 | File exceeds size limit | No |
| 1017 | `ErrValidationJson` | 400 | Invalid JSON format | No |
| 1018 | `ErrValidationMarkdown` | 400 | Invalid Markdown structure | No |

---

## 2xxx - Authentication/Authorization Errors

Authentication and permission errors.

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 2001 | `ErrAuthFailed` | 401 | Authentication failed | No |
| 2002 | `ErrAuthExpired` | 401 | Token/session expired | Yes* |
| 2003 | `ErrAuthInvalidToken` | 401 | Invalid or malformed token | No |
| 2004 | `ErrAuthRevoked` | 401 | Token has been revoked | No |
| 2005 | `ErrAuthRefreshFailed` | 401 | Token refresh failed | No |
| 2006 | `ErrAuthMfaRequired` | 401 | Multi-factor auth required | No |
| 2007 | `ErrAuthMfaInvalid` | 401 | Invalid MFA code | No |
| 2010 | `ErrAuthzDenied` | 403 | Permission denied | No |
| 2011 | `ErrAuthzRole` | 403 | Insufficient role/privilege | No |
| 2012 | `ErrAuthzResource` | 403 | No access to resource | No |
| 2013 | `ErrAuthzProject` | 403 | No access to project | No |
| 2014 | `ErrAuthzReadonly` | 403 | Resource is read-only | No |
| 2020 | `ErrSessionInvalid` | 401 | Session not found/invalid | No |
| 2021 | `ErrSessionExpired` | 401 | Session has expired | Yes* |
| 2022 | `ErrSessionDevice` | 401 | Session device mismatch | No |

> *Retryable after token refresh

---

## 3xxx - Database Errors

SQLite database operations and queries.

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 3001 | `ErrDbConnection` | 503 | Database connection failed | Yes |
| 3002 | `ErrDbLocked` | 503 | Database is locked (SQLite busy) | Yes |
| 3003 | `ErrDbQuery` | 500 | Query execution failed | No |
| 3004 | `ErrDbTransaction` | 500 | Transaction failed/rollback | Yes |
| 3005 | `ErrDbNotFound` | 404 | Record not found | No |
| 3006 | `ErrDbDuplicate` | 409 | Duplicate key/constraint | No |
| 3007 | `ErrDbConstraint` | 400 | Constraint violation | No |
| 3008 | `ErrDbMigration` | 500 | Migration failed | No |
| 3009 | `ErrDbSchema` | 500 | Schema mismatch | No |
| 3010 | `ErrDbCheckpointSave` | 500 | Cannot save checkpoint | Yes |
| 3011 | `ErrDbCheckpointLoad` | 500 | Cannot load checkpoint | No |
| 3012 | `ErrDbVacuum` | 500 | VACUUM operation failed | Yes |
| 3013 | `ErrDbIntegrity` | 500 | Database integrity check failed | No |

---

## 4xxx - External Services/Network Errors

Network operations and third-party service errors.

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 4001 | `ErrNetTimeout` | 504 | Request timed out | Yes |
| 4002 | `ErrNetDns` | 502 | DNS resolution failed | Yes |
| 4003 | `ErrNetConnection` | 502 | Connection refused/reset | Yes |
| 4004 | `ErrNetTls` | 502 | TLS/SSL handshake failed | No |
| 4005 | `ErrNetHttp` | 502 | HTTP error (4xx/5xx response) | Yes* |
| 4006 | `ErrNetRedirectLoop` | 502 | Too many redirects | No |
| 4007 | `ErrNetRobotsTxt` | 403 | Blocked by robots.txt | No |
| 4008 | `ErrNetContentType` | 502 | Unexpected content type | No |
| 4010 | `ErrExtUnavailable` | 503 | External service unavailable | Yes |
| 4011 | `ErrExtResponse` | 502 | Invalid response from service | Yes |
| 4012 | `ErrExtRateLimited` | 429 | Rate limited by external service | Yes |
| 4020 | `ErrEmbeddingService` | 503 | Embedding service unavailable | Yes |
| 4021 | `ErrEmbeddingTimeout` | 504 | Embedding request timed out | Yes |
| 4022 | `ErrEmbeddingDimension` | 500 | Embedding dimension mismatch | No |

> *Depends on HTTP status code

---

## 5xxx - Business Logic/Processing Errors

Domain-specific rules, state transitions, and content processing.

### 5001-5049: Core Business Logic

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 5001 | `ErrLogicState` | 400 | Invalid state transition | No |
| 5002 | `ErrLogicLimit` | 400 | Limit exceeded | No |
| 5003 | `ErrLogicConflict` | 409 | Business rule conflict | No |
| 5004 | `ErrLogicDependency` | 400 | Dependency not met | No |
| 5005 | `ErrLogicPrecondition` | 400 | Precondition failed | No |
| 5006 | `ErrLogicPostcondition` | 500 | Postcondition failed | No |

### 5010-5029: Specification Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 5010 | `ErrSpecInvalid` | 400 | Invalid specification format | No |
| 5011 | `ErrSpecCircular` | 400 | Circular reference detected | No |
| 5012 | `ErrSpecMissing` | 404 | Referenced spec not found | No |
| 5013 | `ErrSpecVersion` | 400 | Spec version mismatch | No |
| 5014 | `ErrSpecSchema` | 400 | Spec schema validation failed | No |
| 5015 | `ErrSpecIncomplete` | 400 | Required sections missing | No |

### 5030-5049: Content Processing

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 5030 | `ErrProcParseHtml` | 500 | HTML parsing failed | No |
| 5031 | `ErrProcParseMd` | 500 | Markdown parsing failed | No |
| 5032 | `ErrProcParseJson` | 500 | JSON parsing failed | No |
| 5033 | `ErrProcChunk` | 500 | Chunking algorithm failed | No |
| 5034 | `ErrProcExtract` | 500 | Content extraction failed | No |
| 5035 | `ErrProcEncoding` | 500 | Character encoding error | No |
| 5036 | `ErrProcSanitize` | 500 | Content sanitization failed | No |

### 5050-5069: Project Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 5050 | `ErrProjectNotFound` | 404 | Project does not exist | No |
| 5051 | `ErrProjectArchived` | 400 | Project is archived | No |
| 5052 | `ErrProjectLocked` | 423 | Project is locked for editing | Yes |
| 5053 | `ErrProjectQuota` | 400 | Project quota exceeded | No |

### 5070-5089: History/Rollback Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 5070 | `ErrHistoryNotFound` | 404 | History record not found | No |
| 5071 | `ErrHistoryNoChanges` | 400 | No changes recorded | No |
| 5072 | `ErrHistoryRollbackConflict` | 409 | File modified since snapshot | No |
| 5073 | `ErrHistorySnapshotFailed` | 500 | Snapshot creation failed | Yes |
| 5074 | `ErrHistoryRestoreFailed` | 500 | Restore operation failed | Yes |

### 5100-5119: UI State Errors (Frontend)

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 5100 | `ErrUiState` | 400 | Invalid UI state transition | No |
| 5101 | `ErrUiNavigation` | 400 | Navigation blocked (unsaved) | No |
| 5102 | `ErrUiSelection` | 400 | Invalid selection state | No |
| 5103 | `ErrUiClipboard` | 500 | Clipboard operation failed | No |
| 5104 | `ErrUiStorage` | 500 | Local storage error | No |

---

## 6xxx - File System/Git Errors

File operations, path validation, and Git integration.

### 6001-6049: File System Operations

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 6001 | `ErrFsNotFound` | 404 | File not found | No |
| 6002 | `ErrFsPermission` | 403 | Permission denied | No |
| 6003 | `ErrFsExists` | 409 | File already exists | No |
| 6004 | `ErrFsInvalidPath` | 400 | Invalid file path | No |
| 6005 | `ErrFsTraversal` | 400 | Path traversal attempt | No |
| 6006 | `ErrFsRead` | 500 | Read operation failed | Yes |
| 6007 | `ErrFsWrite` | 500 | Write operation failed | Yes |
| 6008 | `ErrFsDelete` | 500 | Delete operation failed | Yes |
| 6009 | `ErrFsHashMismatch` | 409 | Optimistic lock failure (hash) | No |
| 6010 | `ErrFsRename` | 500 | Rename operation failed | Yes |
| 6011 | `ErrFsCopy` | 500 | Copy operation failed | Yes |
| 6012 | `ErrFsMkdir` | 500 | Directory creation failed | Yes |
| 6013 | `ErrFsRmdir` | 500 | Directory removal failed | Yes |
| 6014 | `ErrFsSymlink` | 400 | Symlink outside allowed path | No |
| 6015 | `ErrFsReservedPath` | 400 | Path is system-reserved | No |
| 6016 | `ErrFsNameInvalid` | 400 | Invalid filename format | No |
| 6017 | `ErrFsSizeLimit` | 400 | File size exceeds limit | No |
| 6018 | `ErrFsDiskFull` | 503 | Insufficient disk space | No |

### 6050-6099: Git Integration

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 6050 | `ErrGitInit` | 500 | Git init failed | Yes |
| 6051 | `ErrGitClone` | 500 | Git clone failed | Yes |
| 6052 | `ErrGitCommit` | 500 | Git commit failed | Yes |
| 6053 | `ErrGitPush` | 500 | Git push failed | Yes |
| 6054 | `ErrGitPull` | 500 | Git pull failed | Yes |
| 6055 | `ErrGitMergeConflict` | 409 | Merge conflict detected | No |
| 6056 | `ErrGitRepoNotFound` | 404 | Repository not found | No |
| 6057 | `ErrGitAuth` | 401 | Git authentication failed | No |
| 6058 | `ErrGitRemote` | 500 | Remote operation failed | Yes |
| 6059 | `ErrGitBranch` | 500 | Branch operation failed | Yes |
| 6060 | `ErrGitStash` | 500 | Stash operation failed | Yes |
| 6061 | `ErrGitCheckout` | 500 | Checkout failed | Yes |
| 6062 | `ErrGitReset` | 500 | Reset operation failed | Yes |

---

## 7xxx - LLM/Configuration/CLI Errors

LLM server management, model operations, configuration, and brun CLI.

### 7001-7049: LLM Server Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 7001 | `ErrLlmServerOffline` | 503 | LLM server not running | Yes |
| 7002 | `ErrLlmModelNotFound` | 404 | Model not available | No |
| 7003 | `ErrLlmModelLoadFailed` | 500 | Model failed to load | Yes |
| 7004 | `ErrLlmTimeout` | 504 | LLM request timed out | Yes |
| 7005 | `ErrLlmConnection` | 503 | LLM server connection failed | Yes |
| 7006 | `ErrLlmOom` | 503 | Out of memory (model too large) | No |
| 7007 | `ErrLlmCanceled` | 499 | LLM request canceled | No |
| 7008 | `ErrLlmResponseInvalid` | 502 | Invalid LLM response | Yes |
| 7009 | `ErrLlmGenerationFailed` | 500 | Text generation failed | Yes |
| 7010 | `ErrLlmPortUnavailable` | 503 | No available port in range | Yes |
| 7011 | `ErrLlmBackendMismatch` | 400 | Model incompatible with backend | No |
| 7012 | `ErrLlmContextOverflow` | 400 | Context exceeds model limit | No |
| 7013 | `ErrLlmStreamError` | 500 | Streaming response error | Yes |
| 7020 | `ErrLlmEvictionFailed` | 500 | Model eviction failed | Yes |
| 7021 | `ErrLlmSlotExhausted` | 503 | All model slots in use | Yes |

### 7050-7099: Configuration Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 7050 | `ErrConfigMissing` | 500 | Required config missing | No |
| 7051 | `ErrConfigInvalid` | 500 | Invalid config value | No |
| 7052 | `ErrConfigParse` | 500 | Config file parse error | No |
| 7053 | `ErrConfigSchema` | 500 | Config schema validation failed | No |
| 7054 | `ErrConfigRange` | 500 | Config value out of range | No |
| 7055 | `ErrConfigFormat` | 500 | Config format invalid (e.g., CIDR) | No |
| 7056 | `ErrConfigDependency` | 500 | Config cross-field dependency | No |
| 7057 | `ErrConfigMismatch` | 500 | Config value doesn't match expected | No |
| 7058 | `ErrConfigFileRead` | 500 | Cannot read config file | Yes |
| 7059 | `ErrConfigWatch` | 500 | Config file watch failed | Yes |

### 7100-7199: brun CLI & Configuration

Build Runner CLI command-line parsing and config.json management.

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 7101 | `ErrBrunInvalidCommand` | 400 | Unknown or invalid CLI command | No |
| 7102 | `ErrBrunInvalidFlag` | 400 | Unknown or invalid CLI flag | No |
| 7103 | `ErrBrunMissingArgument` | 400 | Required argument not provided | No |
| 7104 | `ErrBrunConflictingFlags` | 400 | Mutually exclusive flags specified | No |
| 7105 | `ErrBrunBinaryNotFound` | 500 | brun executable not in PATH | No |
| 7106 | `ErrBrunVersionMismatch` | 400 | Config version incompatible with binary | No |
| 7110 | `ErrBrunConfigNotFound` | 404 | config.json not found at path | No |
| 7111 | `ErrBrunConfigParseError` | 400 | Invalid JSON in config file | No |
| 7112 | `ErrBrunConfigSchemaInvalid` | 400 | Config does not match JSON schema | No |
| 7113 | `ErrBrunConfigProfileNotFound` | 404 | Named profile not defined in config | No |
| 7114 | `ErrBrunConfigAppNotFound` | 404 | Named application not defined in config | No |
| 7115 | `ErrBrunConfigRuntimeInvalid` | 400 | Invalid runtime type specified | No |
| 7116 | `ErrBrunConfigPathInvalid` | 400 | Invalid path in configuration | No |
| 7117 | `ErrBrunConfigWriteFailed` | 500 | Failed to write config file | No |
| 7118 | `ErrBrunConfigPermission` | 403 | Permission denied reading/writing config | No |

### 7200-7299: brun Runtime Execution

PowerShell, Node.js, and Go runtime execution errors.

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 7201 | `ErrBrunRuntimeNotFound` | 500 | Runtime executable not found (go, node, pwsh) | No |
| 7202 | `ErrBrunRuntimeVersion` | 500 | Runtime version not supported | No |
| 7203 | `ErrBrunRuntimeCrashed` | 500 | Runtime process crashed unexpectedly | Yes |
| 7204 | `ErrBrunRuntimeTimeout` | 408 | Runtime execution exceeded timeout | Yes |
| 7205 | `ErrBrunRuntimePermission` | 403 | Permission denied executing runtime | No |
| 7206 | `ErrBrunRuntimeSignaled` | 500 | Runtime killed by signal (SIGINT/SIGTERM) | No |
| 7210 | `ErrBrunGoBuildFailed` | 422 | Go compilation failed | No |
| 7211 | `ErrBrunGoModTidyFailed` | 422 | go mod tidy failed | No |
| 7212 | `ErrBrunGoUndefinedSymbol` | 422 | Undefined variable/function in Go code | No |
| 7213 | `ErrBrunGoImportError` | 422 | Go import/package not found | No |
| 7220 | `ErrBrunNodeBuildFailed` | 422 | Node.js/npm build failed | No |
| 7221 | `ErrBrunNodePackageMissing` | 422 | npm package not installed | No |
| 7222 | `ErrBrunNodeScriptNotFound` | 404 | npm script not defined in package.json | No |
| 7223 | `ErrBrunTsCompileError` | 422 | TypeScript compilation error | No |
| 7230 | `ErrBrunPsScriptError` | 422 | PowerShell script execution error | No |
| 7231 | `ErrBrunPsSyntaxError` | 422 | PowerShell syntax error | No |
| 7232 | `ErrBrunPsCmdletNotFound` | 422 | PowerShell cmdlet not found | No |

### 7300-7399: brun Port Management

Port checking, allocation, and firewall management.

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 7301 | `ErrBrunPortUnavailable` | 409 | Requested port in use, no fallback available | Yes |
| 7302 | `ErrBrunPortPermission` | 403 | Permission denied binding to port (<1024) | No |
| 7303 | `ErrBrunPortInvalid` | 400 | Invalid port number (0, >65535) | No |
| 7304 | `ErrBrunFirewallFailed` | 500 | Firewall rule creation/deletion failed | No |
| 7305 | `ErrBrunFirewallPermission` | 403 | Insufficient privileges for firewall ops | No |
| 7306 | `ErrBrunFirewallNotFound` | 404 | Firewall rule not found for deletion | No |
| 7307 | `ErrBrunNetworkUnreachable` | 503 | Network interface not available | Yes |

### 7400-7499: brun Build Process

Compilation, asset operations, and working directory management.

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 7401 | `ErrBrunBuildFailed` | 422 | General build failure | No |
| 7402 | `ErrBrunSourceNotFound` | 404 | Source path does not exist | No |
| 7403 | `ErrBrunOutputDirFailed` | 500 | Cannot create output directory | No |
| 7404 | `ErrBrunAssetCopyFailed` | 500 | Asset copy operation failed | No |
| 7405 | `ErrBrunAssetClearFailed` | 500 | Asset clear operation failed | No |
| 7406 | `ErrBrunAssetSourceMissing` | 404 | Asset source path not found | No |
| 7407 | `ErrBrunWorkdirNotFound` | 404 | Working directory does not exist | No |
| 7408 | `ErrBrunWorkdirPermission` | 403 | Working directory not accessible | No |
| 7409 | `ErrBrunExternalDirBlocked` | 403 | External directory access denied (allowExternalDirs=false) | No |
| 7410 | `ErrBrunPathTraversal` | 403 | Path traversal attempt blocked | No |

### 7500-7599: brun Health Check

Application health monitoring and verification.

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 7501 | `ErrBrunHealthTimeout` | 408 | Health check did not pass in time | Yes |
| 7502 | `ErrBrunHealthFailed` | 503 | Health check endpoint returned error | Yes |
| 7503 | `ErrBrunHealthUnreachable` | 503 | Health check endpoint unreachable | Yes |
| 7504 | `ErrBrunHealthStatusMismatch` | 422 | Unexpected HTTP status from health endpoint | No |
| 7505 | `ErrBrunHealthBodyMismatch` | 422 | Health response body did not match expected | No |

---

## 8xxx - RAG/Knowledge/Security Errors

RAG system, knowledge management, and security violations.

### 8001-8049: RAG System Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 8001 | `ErrRagIndexFailed` | 500 | Failed to index artifact | Yes |
| 8002 | `ErrRagEmbedFailed` | 500 | Embedding generation failed | Yes |
| 8003 | `ErrRagQueryFailed` | 500 | Retrieval query failed | Yes |
| 8004 | `ErrRagNoContext` | 404 | No relevant context found | No |
| 8005 | `ErrRagCacheFull` | 503 | RAG cache capacity exceeded | Yes |
| 8006 | `ErrRagChunkFailed` | 500 | Chunking operation failed | Yes |
| 8007 | `ErrRagRerankFailed` | 500 | Re-ranking operation failed | Yes |
| 8008 | `ErrRagVectorSearch` | 500 | Vector search failed | Yes |
| 8009 | `ErrRagFtsSearch` | 500 | Full-text search failed | Yes |
| 8010 | `ErrRagHybridMerge` | 500 | Hybrid result merge failed | Yes |

### 8020-8039: Idea/Artifact Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 8020 | `ErrIdeaNotFound` | 404 | Idea not found | No |
| 8021 | `ErrIdeaInvalidStatus` | 400 | Cannot perform action with current status | No |
| 8022 | `ErrIdeaAlreadyPromoted` | 409 | Idea already promoted | No |
| 8023 | `ErrIdeaPromotionFailed` | 500 | Idea promotion failed | Yes |
| 8024 | `ErrArtifactInvalid` | 400 | Artifact format invalid | No |
| 8025 | `ErrArtifactFrontmatter` | 400 | Missing required frontmatter | No |

### 8050-8079: Knowledge System Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 8050 | `ErrKnowledgeSourceInvalid` | 400 | Invalid knowledge source | No |
| 8051 | `ErrKnowledgeSyncFailed` | 500 | Knowledge sync failed | Yes |
| 8052 | `ErrKnowledgeCrawlFailed` | 500 | Crawler operation failed | Yes |
| 8053 | `ErrKnowledgeParseFailed` | 500 | Content parsing failed | Yes |
| 8054 | `ErrKnowledgeDuplicate` | 409 | Duplicate knowledge source | No |

### 8080-8099: Security Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 8080 | `ErrSecSsrf` | 400 | SSRF attempt - private network | No |
| 8081 | `ErrSecBlockedIp` | 400 | IP address is blocked | No |
| 8082 | `ErrSecMetadata` | 400 | Cloud metadata endpoint blocked | No |
| 8083 | `ErrSecLocalhost` | 400 | Localhost access blocked | No |
| 8084 | `ErrSecXss` | 400 | XSS attempt detected | No |
| 8085 | `ErrSecInjection` | 400 | Injection attempt detected | No |
| 8086 | `ErrSecRateLimit` | 429 | Rate limit exceeded | Yes |
| 8087 | `ErrSecBruteForce` | 429 | Brute force lockout | No |
| 8088 | `ErrSecCsrf` | 400 | CSRF token invalid | No |

---

## 9xxx - System/Consistency Errors

System-level errors and consistency checker results.

### 9001-9049: System Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 9001 | `ErrSysInternal` | 500 | Internal server error | No |
| 9002 | `ErrSysMemory` | 503 | Memory exhaustion | No |
| 9003 | `ErrSysDisk` | 503 | Disk space exhaustion | No |
| 9004 | `ErrSysTimeout` | 503 | Operation timeout | Yes |
| 9005 | `ErrSysPanic` | 500 | Recovered panic | No |
| 9006 | `ErrSysSignal` | 500 | Unexpected signal received | No |
| 9007 | `ErrSysResource` | 503 | Resource exhaustion (generic) | Yes |
| 9008 | `ErrSysShutdown` | 503 | Server shutting down | No |
| 9009 | `ErrSysMaintenance` | 503 | System in maintenance mode | No |

### 9050-9099: Consistency Checker Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 9050 | `ErrConsistencyScanFailed` | 500 | Consistency scan failed | Yes |
| 9051 | `ErrConsistencyBrokenLink` | 400 | Broken internal link detected | No |
| 9052 | `ErrConsistencyOrphanFile` | 400 | Orphan file detected | No |
| 9053 | `ErrConsistencyDuplicate` | 400 | Duplicate definition found | No |
| 9054 | `ErrConsistencyNaming` | 400 | Naming convention violation | No |
| 9055 | `ErrConsistencySection` | 400 | Missing required section | No |
| 9056 | `ErrConsistencySchema` | 400 | Schema-API mismatch | No |
| 9057 | `ErrConsistencyTerm` | 400 | Terminology inconsistency | No |
| 9058 | `ErrConsistencyAutofixFailed` | 500 | Auto-fix operation failed | Yes |
| 9059 | `ErrConsistencyReportFailed` | 500 | Report generation failed | Yes |

---

## 10xxx - Context Window Errors

Token budgeting and context assembly errors.

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 10001 | `ErrContextOverflow` | 400 | Context exceeds token budget | No |
| 10002 | `ErrContextAssemblyFailed` | 500 | Context assembly failed | Yes |
| 10003 | `ErrContextTokenizeFailed` | 500 | Tokenization failed | Yes |
| 10004 | `ErrContextTruncateFailed` | 500 | Truncation strategy failed | Yes |
| 10005 | `ErrContextPriorityInvalid` | 400 | Invalid priority configuration | No |
| 10006 | `ErrContextCompressionFailed` | 500 | Memory compression failed | Yes |
| 10007 | `ErrContextCacheMiss` | 404 | Cached context not found | No |

---

## 11xxx - Instruction System Errors

Instruction lifecycle and task execution errors.

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 11001 | `ErrInstructionNotFound` | 404 | Instruction ID does not exist | No |
| 11002 | `ErrInstructionInvalidScope` | 400 | Invalid scope value | No |
| 11003 | `ErrInstructionFileRequired` | 400 | File path required for file scope | No |
| 11004 | `ErrInstructionAlreadyApproved` | 409 | Cannot modify approved instruction | No |
| 11005 | `ErrInstructionNotPlanned` | 400 | Cannot approve before planning | No |
| 11006 | `ErrInstructionCancelled` | 400 | Instruction was cancelled | No |
| 11007 | `ErrInstructionExecuting` | 409 | Instruction currently executing | No |
| 11008 | `ErrInstructionCompleted` | 409 | Instruction already completed | No |
| 11010 | `ErrTaskNotFound` | 404 | Task ID does not exist | No |
| 11011 | `ErrTaskAlreadyCompleted` | 409 | Cannot modify completed task | No |
| 11012 | `ErrTaskBlocked` | 400 | Task blocked by dependencies | No |
| 11013 | `ErrTaskExecutionFailed` | 500 | Task execution failed | Yes |
| 11014 | `ErrTaskCycleDetected` | 400 | Circular task dependency | No |
| 11020 | `ErrTranscriptionFailed` | 500 | Voice transcription failed | Yes |
| 11021 | `ErrProofreadingFailed` | 500 | Proofreading step failed | Yes |
| 11022 | `ErrPlanningFailed` | 500 | Planning step failed | Yes |

---

## 12xxx - Code Generation System Errors

AI-powered code generation, Git integration, and credit management.

### 12000-12099: General Code Generation

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 12000 | `ErrCodegenUnknown` | 500 | Unknown code generation error | No |
| 12001 | `ErrCodegenNotEnabled` | 403 | Code generation not enabled for project | No |
| 12002 | `ErrCodegenRunNotFound` | 404 | Generation run not found | No |
| 12003 | `ErrCodegenRunAlreadyCompleted` | 400 | Generation run already completed | No |
| 12004 | `ErrCodegenRunCancelled` | 400 | Generation run was cancelled | No |
| 12005 | `ErrCodegenProjectLocked` | 423 | Project has another generation in progress | Yes |
| 12006 | `ErrCodegenTimeout` | 504 | Generation timed out | Yes |
| 12007 | `ErrCodegenCancelledByUser` | 400 | Generation cancelled by user | No |

### 12100-12199: Guideline Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 12100 | `ErrGuidelineNotFound` | 404 | Guideline not found | No |
| 12101 | `ErrGuidelineInvalidLevel` | 400 | Invalid guideline level | No |
| 12102 | `ErrGuidelineParseFailed` | 500 | Failed to parse guideline sections | No |
| 12103 | `ErrGuidelineResolutionFailed` | 500 | Failed to resolve guidelines | Yes |
| 12104 | `ErrGuidelineCircularRef` | 400 | Circular reference in guidelines | No |
| 12105 | `ErrGuidelineLanguageUnsupported` | 400 | Language not supported | No |
| 12106 | `ErrGuidelineDuplicateName` | 409 | Guideline name already exists | No |
| 12107 | `ErrGuidelineContentEmpty` | 400 | Guideline content is empty | No |
| 12108 | `ErrGuidelineVersionConflict` | 409 | Guideline version conflict | Yes |

### 12200-12299: Planning Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 12200 | `ErrPlanGenerationFailed` | 500 | Failed to generate plan | Yes |
| 12201 | `ErrPlanNoSpecs` | 400 | No specifications provided | No |
| 12202 | `ErrPlanSpecNotFound` | 404 | Referenced specification not found | No |
| 12203 | `ErrPlanSpecParseFailed` | 400 | Failed to parse specification | No |
| 12204 | `ErrPlanNoFiles` | 400 | No files to generate from specs | No |
| 12205 | `ErrPlanCircularDependency` | 400 | Circular dependency in file plan | No |
| 12206 | `ErrPlanDependencyResolutionFailed` | 500 | Failed to resolve dependencies | Yes |
| 12207 | `ErrPlanTooLarge` | 400 | Plan exceeds maximum file count | No |
| 12208 | `ErrPlanInvalidLanguage` | 400 | Invalid target language specified | No |

### 12300-12399: Execution Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 12300 | `ErrExecModelSelectFailed` | 500 | Failed to select coding model | Yes |
| 12301 | `ErrExecGenerationFailed` | 500 | Code generation failed | Yes |
| 12302 | `ErrExecWriteFailed` | 500 | Failed to write generated file | Yes |
| 12303 | `ErrExecBatchTimeout` | 504 | Batch execution timeout | Yes |
| 12304 | `ErrExecCircularDependency` | 400 | Circular dependency detected | No |
| 12305 | `ErrExecNoWorkers` | 503 | No workers available | Yes |
| 12306 | `ErrExecContextTooLarge` | 400 | Context exceeds model limit | No |
| 12307 | `ErrExecModelUnavailable` | 503 | Coding model unavailable | Yes |
| 12308 | `ErrExecModelTimeout` | 504 | Model response timeout | Yes |
| 12309 | `ErrExecInvalidResponse` | 500 | Invalid model response format | Yes |
| 12310 | `ErrExecCodeExtractionFailed` | 500 | Failed to extract code from response | Yes |
| 12311 | `ErrExecPathInvalid` | 400 | Invalid file path in plan | No |
| 12312 | `ErrExecPathTraversal` | 403 | Path traversal attempt detected | No |

### 12400-12499: Git Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 12400 | `ErrCodegenGitInitFailed` | 500 | Failed to initialize repository | Yes |
| 12401 | `ErrCodegenGitCommitFailed` | 500 | Failed to commit changes | Yes |
| 12402 | `ErrCodegenGitPushFailed` | 500 | Failed to push to remote | Yes |
| 12403 | `ErrCodegenGitPullFailed` | 500 | Failed to pull from remote | Yes |
| 12404 | `ErrCodegenGitConflict` | 409 | Merge conflict detected | No |
| 12405 | `ErrCodegenGitNoRemote` | 400 | No remote configured | No |
| 12406 | `ErrCodegenOauthNotConnected` | 401 | OAuth not connected for provider | No |
| 12407 | `ErrCodegenOauthTokenExpired` | 401 | OAuth token expired | Yes |
| 12408 | `ErrCodegenOauthRefreshFailed` | 500 | Failed to refresh OAuth token | Yes |
| 12409 | `ErrCodegenGitRepoCreateFailed` | 500 | Failed to create remote repository | Yes |
| 12410 | `ErrCodegenGitRepoNotFound` | 404 | Remote repository not found | No |
| 12411 | `ErrCodegenGitPermissionDenied` | 403 | Git permission denied | No |
| 12412 | `ErrCodegenGitStashFailed` | 500 | Failed to stash changes | Yes |
| 12413 | `ErrCodegenGitStashPopFailed` | 500 | Failed to apply stashed changes | Yes |
| 12414 | `ErrCodegenOauthStateMismatch` | 400 | OAuth state mismatch | No |
| 12415 | `ErrCodegenOauthProviderError` | 502 | OAuth provider error | Yes |

### 12500-12599: Build Verification Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 12500 | `ErrBuildVerificationFailed` | 500 | Build verification failed | No |
| 12501 | `ErrBuildBrunNotFound` | 500 | brun CLI not found | No |
| 12502 | `ErrBuildBrunTimeout` | 504 | brun execution timeout | Yes |
| 12503 | `ErrBuildParseFailed` | 500 | Failed to parse build output | No |
| 12504 | `ErrBuildFixFailed` | 500 | AI fix loop exhausted | No |
| 12505 | `ErrBuildLanguageUnsupported` | 400 | Language not supported by brun | No |
| 12506 | `ErrBuildWorkspaceInvalid` | 400 | Invalid build workspace | No |
| 12507 | `ErrBuildDependenciesMissing` | 400 | Build dependencies missing | No |
| 12508 | `ErrBuildConfigInvalid` | 400 | Invalid build configuration | No |

### 12600-12699: Credit System Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 12600 | `ErrCreditsInsufficient` | 402 | Insufficient credits for operation | No |
| 12601 | `ErrCreditsEstimationFailed` | 500 | Failed to estimate credit cost | Yes |
| 12602 | `ErrCreditsTransactionFailed` | 500 | Failed to record transaction | Yes |
| 12603 | `ErrCreditsPlanNotFound` | 404 | Credit plan not found | No |
| 12604 | `ErrCreditsPurchaseFailed` | 500 | Credit purchase failed | Yes |
| 12605 | `ErrCreditsNegativeBalance` | 400 | Balance would be negative | No |
| 12606 | `ErrCreditsUserNotFound` | 404 | User credits not found | No |
| 12607 | `ErrCreditsAlreadyRefunded` | 400 | Transaction already refunded | No |

### 12700-12799: Repository Structure Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 12700 | `ErrRepoCreateDirFailed` | 500 | Failed to create directory | Yes |
| 12701 | `ErrRepoTemplateFailed` | 500 | Failed to generate template file | Yes |
| 12702 | `ErrRepoInvalidStructure` | 400 | Invalid custom structure | No |
| 12703 | `ErrRepoCopySpecFailed` | 500 | Failed to copy specification | Yes |
| 12704 | `ErrRepoPathExists` | 409 | Repository path already exists | No |
| 12705 | `ErrRepoRootNotConfigured` | 500 | Repository root not configured | No |
| 12706 | `ErrRepoPermissionDenied` | 403 | Repository permission denied | No |

---

## 14xxx - AI Transcribe CLI Errors

Speech-to-text, text-to-speech, and voice processing errors.

**Full Specification:** [AI Transcribe Error Codes](../../26-ai-transcribe-cli/01-backend/10-error-codes.md)

### 14000-14049: General Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 14000 | `ErrTranscribeGeneral` | 500 | Internal server error | No |
| 14001 | `ErrTranscribeConfigLoad` | 500 | Configuration load failed | No |
| 14002 | `ErrTranscribeConfigInvalid` | 400 | Invalid configuration | No |
| 14010 | `ErrTranscribeUnavailable` | 503 | Service unavailable | Yes |
| 14011 | `ErrTranscribeRateLimited` | 429 | Rate limit exceeded | Yes |
| 14020 | `ErrTranscribeAuthRequired` | 401 | Authentication required | No |
| 14021 | `ErrTranscribeAuthInvalid` | 401 | Invalid authentication | No |

### 14050-14099: Audio Pipeline Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 14050 | `ErrAudioGeneral` | 500 | Audio processing error | No |
| 14060 | `ErrAudioFormatUnsupported` | 400 | Unsupported audio format | No |
| 14080 | `ErrAudioTooShort` | 400 | Audio too short | No |
| 14081 | `ErrAudioTooLong` | 400 | Audio too long | No |
| 14090 | `ErrVadFailed` | 500 | VAD processing failed | Yes |

### 14100-14149: STT Provider Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 14100 | `ErrSttGeneral` | 500 | Transcription error | No |
| 14101 | `ErrSttProviderUnavailable` | 503 | STT provider unavailable | Yes |
| 14103 | `ErrSttTranscriptionFailed` | 500 | Transcription failed | Yes |
| 14110 | `ErrWhisperNotLoaded` | 500 | Whisper model not loaded | Yes |
| 14120 | `ErrOpenaiSttConnection` | 502 | OpenAI connection failed | Yes |

### 14150-14199: TTS Provider Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 14150 | `ErrTtsGeneral` | 500 | Synthesis error | No |
| 14151 | `ErrTtsProviderUnavailable` | 503 | TTS provider unavailable | Yes |
| 14155 | `ErrTtsVoiceNotFound` | 404 | Voice not found | No |
| 14160 | `ErrXttsNotLoaded` | 500 | XTTS model not loaded | Yes |
| 14170 | `ErrElevenlabsTtsConnection` | 502 | ElevenLabs connection failed | Yes |

### 14200-14249: Voice Command Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 14200 | `ErrCmdGeneral` | 500 | Voice command error | No |
| 14201 | `ErrCmdNotFound` | 404 | Command not found | No |
| 14203 | `ErrCmdExecution` | 500 | Command execution failed | Yes |
| 14206 | `ErrCmdLimit` | 429 | Max commands reached | No |
| 14210 | `ErrWakeWordFailed` | 500 | Wake word detection failed | Yes |

### 14250-14299: Voice Cloning Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 14250 | `ErrCloneSampleShort` | 400 | Audio sample too short | No |
| 14252 | `ErrCloneQuality` | 400 | Poor audio quality | No |
| 14254 | `ErrCloneTraining` | 500 | Voice training failed | Yes |
| 14255 | `ErrCloneLimit` | 429 | Maximum voices reached | No |
| 14257 | `ErrVoiceNotFound` | 404 | Cloned voice not found | No |

### 14300-14349: Realtime/WebSocket Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 14300 | `ErrWsGeneral` | 500 | WebSocket error | No |
| 14301 | `ErrWsConnectionFailed` | 500 | WebSocket connection failed | Yes |
| 14302 | `ErrWsConnectionClosed` | 410 | Connection closed | Yes |
| 14305 | `ErrWsRateLimit` | 429 | WebSocket rate limited | Yes |
| 14331 | `ErrReconnectFailed` | 500 | Reconnection failed | Yes |

### 14350-14399: Session Management Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 14350 | `ErrSessionGeneral` | 500 | Session error | No |
| 14351 | `ErrSessionNotFound` | 404 | Session not found | No |
| 14352 | `ErrSessionExpired` | 410 | Session expired | No |
| 14353 | `ErrSessionLimitReached` | 429 | Session limit reached | Yes |

### 14400-14449: Configuration Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 14400 | `ErrConfigGeneral` | 500 | Configuration error | No |
| 14401 | `ErrConfigFileNotFound` | 404 | Config file not found | No |
| 14403 | `ErrConfigValidation` | 400 | Config validation failed | No |
| 14412 | `ErrConfigApiKey` | 400 | Missing API key | No |

### 14450-14499: Provider Errors

| Code | Constant | HTTP | Description | Retryable |
|------|----------|------|-------------|-----------|
| 14450 | `ErrProviderGeneral` | 500 | Provider error | No |
| 14451 | `ErrProviderNotConfigured` | 400 | Provider not configured | No |
| 14453 | `ErrProviderHealthCheck` | 503 | Provider unhealthy | Yes |
| 14460 | `ErrProviderFallback` | 503 | All providers failed | No |

---

## HTTP Status Code Mapping

Standard mapping from error code ranges to HTTP status codes:

| Range | Primary HTTP | Secondary HTTP |
|-------|--------------|----------------|
| 1xxx | 400 Bad Request | 409 Conflict |
| 2xxx | 401 Unauthorized | 403 Forbidden |
| 3xxx | 500 Internal | 404 Not Found, 409 Conflict |
| 4xxx | 502/503/504 | 429 Too Many Requests |
| 5xxx | 400 Bad Request | 404 Not Found, 409 Conflict |
| 6xxx | 500 Internal | 400 Bad Request, 403/404/409 |
| 7xxx | 500/503/504 | 404 Not Found |
| 8xxx | 500 Internal | 400 Bad Request, 429 |
| 9xxx | 500/503 | - |
| 10xxx | 400/500 | - |
| 11xxx | 400/500 | 404 Not Found, 409 Conflict |
| 12xxx | 500/503/504 | 400 Bad Request, 402 Payment Required, 404/409 |
| 13xxx | 400/500 | 404 Not Found |
| **14xxx** | **500/502/503** | **400 Bad Request, 404/429** |

---

## Implementation

### Go Constants

```go
// internal/errors/registry.go

package errors

// Validation (1xxx)
const (
    ErrValidationRequired    = 1001
    ErrValidationFormat      = 1002
    // ... all 1xxx codes
)

// Authentication (2xxx)
const (
    ErrAuthFailed        = 2001
    ErrAuthExpired       = 2002
    // ... all 2xxx codes
)

// Database (3xxx)
const (
    ErrDbConnection = 3001
    ErrDbLocked     = 3002
    // ... all 3xxx codes
)

// ... continue for all ranges
```

### TypeScript Constants

```typescript
// src/lib/errors/error-codes.ts

export const ERROR_CODES = {
  // Validation (1xxx)
  ErrValidationRequired: 1001,
  ErrValidationFormat: 1002,
  // ... all 1xxx codes
  
  // Authentication (2xxx)
  ErrAuthFailed: 2001,
  ErrAuthExpired: 2002,
  // ... all 2xxx codes
  
  // ... continue for all ranges
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
```

---

## Maintenance Guidelines

### Adding New Error Codes

1. Choose appropriate range based on category
2. Use next available number in range
3. Update this registry document
4. Update Go constants in `internal/errors/registry.go`
5. Update TypeScript constants in `src/lib/errors/error-codes.ts`
6. Add to relevant spec documentation

### Deprecating Error Codes

1. Mark as deprecated in this registry (add `⚠️ DEPRECATED` suffix)
2. Keep code allocated to prevent reuse
3. Update implementation to use replacement code
4. Document migration path

### Code Range Expansion

If a range is exhausted, request allocation of next available range from architecture team. Never reuse codes from other ranges.

---

## Related Specs

- [Error Management Overview](./00-overview.md)
- [Backend Error Codes](./02-backend/01-error-codes.md)
- [Frontend Error Codes](./03-frontend/01-error-codes.md)
- [API Contracts](../05-features/15-api-client/02-api-contracts.md)
