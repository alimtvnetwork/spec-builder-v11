# Backend Error Codes

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

---

## Overview

Comprehensive error codes for the Go backend, organized by category.

**Cross-References:**
- [Error Management Overview](../00-overview.md)
- [Shared Error Constants](../04-shared/01-error-constants.md)
- [Recovery Strategies](../00-overview.md)

---

## Error Code Ranges

### 1xxx - Validation Errors

| Code | Constant | HTTP | Description |
|------|----------|------|-------------|
| 1001 | `ErrValidationRequired` | 400 | Required field missing |
| 1002 | `ErrValidationFormat` | 400 | Invalid format |
| 1003 | `ErrValidationRange` | 400 | Value out of range |
| 1004 | `ErrValidationLength` | 400 | String length violation |
| 1005 | `ErrValidationType` | 400 | Type mismatch |
| 1006 | `ErrValidationUnique` | 409 | Uniqueness constraint violated |
| 1007 | `ErrValidationReference` | 400 | Invalid reference/FK |
| 1010 | `ErrValidationBatch` | 400 | Batch validation failed |

### 2xxx - Authentication/Authorization

| Code | Constant | HTTP | Description |
|------|----------|------|-------------|
| 2001 | `ErrAuthFailed` | 401 | Authentication failed |
| 2002 | `ErrAuthExpired` | 401 | Token/session expired |
| 2003 | `ErrAuthInvalidToken` | 401 | Invalid token |
| 2004 | `ErrAuthRevoked` | 401 | Token revoked |
| 2010 | `ErrAuthzDenied` | 403 | Permission denied |
| 2011 | `ErrAuthzRole` | 403 | Insufficient role |
| 2012 | `ErrAuthzResource` | 403 | No access to resource |

### 3xxx - Database Errors

| Code | Constant | HTTP | Description |
|------|----------|------|-------------|
| 3001 | `ErrDbQuery` | 500 | Query execution failed |
| 3002 | `ErrDbNotFound` | 404 | Record not found |
| 3003 | `ErrDbDuplicate` | 409 | Duplicate key |
| 3004 | `ErrDbConstraint` | 400 | Constraint violation |
| 3005 | `ErrDbTransaction` | 500 | Transaction failed |
| 3006 | `ErrDbLocked` | 503 | Database locked (SQLite) |
| 3007 | `ErrDbConnection` | 503 | Connection failed |
| 3008 | `ErrDbMigration` | 500 | Migration failed |

### 4xxx - External Services

| Code | Constant | HTTP | Description |
|------|----------|------|-------------|
| 4001 | `ErrExtTimeout` | 504 | External service timeout |
| 4002 | `ErrExtUnavailable` | 503 | Service unavailable |
| 4003 | `ErrExtResponse` | 502 | Invalid response |
| 4010 | `ErrLlamaConnection` | 503 | LLaMA server connection failed |
| 4011 | `ErrLlamaTimeout` | 504 | LLaMA request timeout |
| 4012 | `ErrLlamaResponse` | 502 | Invalid LLaMA response |
| 4020 | `ErrGitCommand` | 500 | Git command failed |
| 4021 | `ErrGitConflict` | 409 | Git merge conflict |

### 5xxx - Business Logic

| Code | Constant | HTTP | Description |
|------|----------|------|-------------|
| 5001 | `ErrLogicState` | 400 | Invalid state transition |
| 5002 | `ErrLogicLimit` | 400 | Limit exceeded |
| 5003 | `ErrLogicConflict` | 409 | Business rule conflict |
| 5004 | `ErrLogicDependency` | 400 | Dependency not met |
| 5010 | `ErrSpecInvalid` | 400 | Invalid specification format |
| 5011 | `ErrSpecCircular` | 400 | Circular reference detected |
| 5012 | `ErrSpecMissing` | 404 | Referenced spec not found |

### 6xxx - File System

| Code | Constant | HTTP | Description |
|------|----------|------|-------------|
| 6001 | `ErrFsNotFound` | 404 | File not found |
| 6002 | `ErrFsPermission` | 403 | Permission denied |
| 6003 | `ErrFsExists` | 409 | File already exists |
| 6004 | `ErrFsInvalidPath` | 400 | Invalid path |
| 6005 | `ErrFsTraversal` | 400 | Path traversal attempt |
| 6006 | `ErrFsRead` | 500 | Read operation failed |
| 6007 | `ErrFsWrite` | 500 | Write operation failed |
| 6008 | `ErrFsDelete` | 500 | Delete operation failed |
| 6009 | `ErrFsHashMismatch` | 409 | Optimistic lock failure |

### 7xxx - Configuration

| Code | Constant | HTTP | Description |
|------|----------|------|-------------|
| 7001 | `ErrConfigMissing` | 500 | Required config missing |
| 7002 | `ErrConfigInvalid` | 500 | Invalid config value |
| 7003 | `ErrConfigParse` | 500 | Config file parse error |
| 7004 | `ErrConfigSchema` | 500 | Schema validation failed |

### 8xxx - Security

| Code | Constant | HTTP | Description |
|------|----------|------|-------------|
| 8001 | `ErrSecSsrf` | 400 | SSRF attempt blocked |
| 8002 | `ErrSecXss` | 400 | XSS attempt detected |
| 8003 | `ErrSecInjection` | 400 | Injection attempt |
| 8004 | `ErrSecRateLimit` | 429 | Rate limit exceeded |
| 8005 | `ErrSecBruteForce` | 429 | Brute force lockout |

### 9xxx - System

| Code | Constant | HTTP | Description |
|------|----------|------|-------------|
| 9001 | `ErrSysInternal` | 500 | Internal server error |
| 9002 | `ErrSysMemory` | 503 | Memory exhaustion |
| 9003 | `ErrSysDisk` | 503 | Disk space exhaustion |
| 9004 | `ErrSysTimeout` | 503 | Operation timeout |
| 9005 | `ErrSysPanic` | 500 | Recovered panic |

---

## Go Implementation

```go
// internal/errors/codes.go

package errors

const (
    // Validation (1xxx)
    ErrValidationRequired = 1001
    ErrValidationFormat   = 1002
    ErrValidationRange    = 1003
    // ... etc
    
    // Authentication (2xxx)
    ErrAuthFailed        = 2001
    ErrAuthExpired       = 2002
    // ... etc
)

// Error code to HTTP status mapping
var codeToStatus = map[int]int{
    ErrValidationRequired: 400,
    ErrAuthFailed:         401,
    ErrAuthzDenied:        403,
    ErrDbNotFound:         404,
    ErrDbDuplicate:        409,
    ErrSecRateLimit:       429,
    ErrSysInternal:        500,
    ErrDbLocked:           503,
    ErrExtTimeout:         504,
}
```

---

## Related Specs

- [Recovery Strategies](../00-overview.md)
- [Logging Patterns](../00-overview.md)
- [Frontend Error Codes](../03-frontend/01-error-codes.md)
