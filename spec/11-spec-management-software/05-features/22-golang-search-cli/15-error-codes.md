# Golang Search CLI - Error Code Registry

**Version:** 3.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

> ⚠️ **REASSIGNED (v2.0.0):** Previously used local 1xxx-12xxx codes, which collided with multiple ecosystem ranges (GEN, SM, WSP, etc.). All codes remapped to **SM-GS 18000-18249** per collision resolution (2026-02-28).

---

## Overview

Comprehensive error code registry for the Golang Search CLI application. All error codes are organized by domain and include constant identifiers, descriptions, and retryability flags for programmatic handling.

**Cross-References:**
- [CLI Framework](./01-cli-framework.md)
- [Configuration](./02-configuration.md)
- [Method Switching](./08-method-switching.md)
- [Error Management Overview](../../06-error-management/00-overview.md)

---

## Exit Codes (CLI Process)

Exit codes returned when the CLI process terminates.

| Code | Constant | Description | Recovery Action |
|------|----------|-------------|-----------------|
| 0 | `ExitSuccess` | Operation completed successfully | None |
| 1 | `ExitGeneral` | General/unspecified error | Check logs |
| 2 | `ExitConfig` | Configuration error | Validate config file |
| 3 | `ExitDatabase` | Database connection/query error | Check database path |
| 4 | `ExitNetwork` | Network/HTTP error | Check connectivity |
| 5 | `ExitAllBlocked` | All search methods blocked | Wait for cooldown |
| 6 | `ExitQuota` | API quota exhausted | Wait or use different method |
| 7 | `ExitAuth` | Authentication/authorization error | Check API credentials |
| 8 | `ExitTimeout` | Operation timeout | Retry or increase timeout |
| 9 | `ExitInvalidInput` | Invalid command arguments | Check CLI usage |
| 10 | `ExitShutdown` | Graceful shutdown completed | None |

---

## Application Error Codes

### Error Code Ranges (SM-GS 18000-18249)

| Range | Domain | Description |
|-------|--------|-------------|
| 18000-18019 | Validation | Input validation and format errors |
| 18020-18039 | Authentication | API keys, OAuth tokens, permissions |
| 18040-18059 | Database | SQLite operations and migrations |
| 18060-18079 | Network | HTTP requests, DNS, TLS, rate limits |
| 18080-18099 | Blocking | CAPTCHA, IP blocks, method cooldowns |
| 18100-18109 | Quota | API usage limits and thresholds |
| 18110-18119 | Parser | HTML parsing and selector errors |
| 18120-18129 | Cache | Caching operations and expiry |
| 18130-18139 | Export | RAG export and file operations |
| 18140-18149 | Resource | Memory, goroutines, system resources |
| 18150-18159 | Config | Runtime configuration issues |
| 18160-18169 | Encryption | Token encryption/decryption |

---

### 18000-18019 - Validation Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 18001 | `ErrInvalidQuery` | Empty or malformed search query | No | 9 |
| 18002 | `ErrInvalidConfigPath` | Config file path not found | No | 2 |
| 18003 | `ErrInvalidConfigFormat` | Config file is not valid JSON | No | 2 |
| 18004 | `ErrInvalidConfigSchema` | Config fails JSON schema validation | No | 2 |
| 18005 | `ErrInvalidOutputFormat` | Unknown output format specified | No | 9 |
| 18006 | `ErrInvalidEngine` | Unknown search engine specified | No | 9 |
| 18007 | `ErrInvalidMethod` | Unknown retrieval method specified | No | 9 |
| 18008 | `ErrInvalidWeightRange` | Weight value outside 0.0-1.0 range | No | 2 |
| 18009 | `ErrInvalidWeightSum` | Weights do not sum to 1.0 | No | 2 |
| 18010 | `ErrInvalidDuration` | Invalid duration format | No | 2 |
| 18011 | `ErrInvalidDepth` | Nested search depth out of range | No | 9 |
| 18012 | `ErrInvalidLimit` | Results limit out of range | No | 9 |

---

### 18020-18039 - Authentication Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 18021 | `ErrAuthKeyMissing` | Required API key not configured | No | 7 |
| 18022 | `ErrAuthKeyInvalid` | API key rejected by service | No | 7 |
| 18023 | `ErrAuthTokenMissing` | OAuth access token not found | No | 7 |
| 18024 | `ErrAuthTokenExpired` | OAuth token expired, refresh required | Yes | 7 |
| 18025 | `ErrAuthTokenRevoked` | OAuth token revoked by user/admin | No | 7 |
| 18026 | `ErrAuthRefreshFailed` | OAuth token refresh failed | Yes | 7 |
| 18027 | `ErrAuthScopeInsufficient` | OAuth token lacks required scopes | No | 7 |
| 18028 | `ErrAuthCseIdMissing` | Google Custom Search Engine ID missing | No | 7 |
| 18029 | `ErrAuthCseIdInvalid` | Google CSE ID rejected | No | 7 |

---

### 18040-18059 - Database Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 18041 | `ErrDbOpen` | Cannot open SQLite database file | Yes | 3 |
| 18042 | `ErrDbCreate` | Cannot create database file | No | 3 |
| 18043 | `ErrDbPermission` | Insufficient permissions on database | No | 3 |
| 18044 | `ErrDbMigrationFailed` | Database migration failed | No | 3 |
| 18045 | `ErrDbMigrationDirty` | Migration in dirty state | No | 3 |
| 18046 | `ErrDbQueryFailed` | SQL query execution failed | Yes | 3 |
| 18047 | `ErrDbRecordNotFound` | Requested record does not exist | No | 3 |
| 18048 | `ErrDbConstraint` | Unique/foreign key constraint violation | No | 3 |
| 18049 | `ErrDbLocked` | Database locked by another process | Yes | 3 |
| 18050 | `ErrDbCorruption` | Database file corrupted | No | 3 |
| 18051 | `ErrDbTransaction` | Transaction commit/rollback failed | Yes | 3 |

---

### 18060-18079 - Network Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 18061 | `ErrHttpTimeout` | HTTP request timed out | Yes | 8 |
| 18062 | `ErrHttpDns` | DNS resolution failed | Yes | 4 |
| 18063 | `ErrHttpTls` | TLS handshake failed | Yes | 4 |
| 18064 | `ErrHttpConnection` | TCP connection failed | Yes | 4 |
| 18065 | `ErrHttpReset` | Connection reset by peer | Yes | 4 |
| 18066 | `ErrHttpStatus4xx` | HTTP 4xx client error | No | 4 |
| 18067 | `ErrHttpStatus5xx` | HTTP 5xx server error | Yes | 4 |
| 18068 | `ErrRateLimited` | Rate limited (HTTP 429) | Yes | 4 |
| 18069 | `ErrProxyAuth` | Proxy authentication failed | No | 4 |
| 18070 | `ErrProxyConnection` | Proxy connection failed | Yes | 4 |
| 18071 | `ErrProxyTimeout` | Proxy request timed out | Yes | 8 |
| 18072 | `ErrRedirectLoop` | Too many HTTP redirects | No | 4 |
| 18073 | `ErrResponseTooLarge` | Response body exceeds limit | No | 4 |

---

### 18080-18099 - Blocking Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 18081 | `ErrBlockedCaptcha` | CAPTCHA challenge detected | No | 5 |
| 18082 | `ErrBlockedIp` | IP address blocked by service | No | 5 |
| 18083 | `ErrBlockedUserAgent` | User-Agent rejected | No | 5 |
| 18084 | `ErrBlockedRegion` | Request blocked for region | No | 5 |
| 18085 | `ErrMethodCooldown` | Search method in cooldown period | Yes | 5 |
| 18086 | `ErrAllMethodsBlocked` | All search methods blocked | Yes | 5 |
| 18087 | `ErrEngineUnavailable` | Search engine temporarily unavailable | Yes | 5 |
| 18088 | `ErrBotDetection` | Bot/automation detection triggered | No | 5 |

---

### 18100-18109 - Quota Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 18101 | `ErrQuotaDaily` | Daily API quota exceeded | No | 6 |
| 18102 | `ErrQuotaMonthly` | Monthly API quota exceeded | No | 6 |
| 18103 | `ErrQuotaPerSecond` | Requests per second limit hit | Yes | 6 |
| 18104 | `ErrQuotaPerMinute` | Requests per minute limit hit | Yes | 6 |
| 18105 | `ErrQuotaBilling` | Billing quota exceeded | No | 6 |
| 18106 | `ErrQuotaUser` | Per-user quota exceeded | No | 6 |

---

### 18110-18119 - Parser Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 18111 | `ErrParseHtml` | HTML document parsing failed | Yes | 1 |
| 18112 | `ErrParseJson` | JSON response parsing failed | Yes | 1 |
| 18113 | `ErrSelectorNotFound` | CSS selector matched nothing | Yes | 1 |
| 18114 | `ErrSelectorInvalid` | Invalid CSS selector syntax | No | 1 |
| 18115 | `ErrSelectorVersion` | Selector version mismatch | Yes | 1 |
| 18116 | `ErrEmptyResults` | No results found (informational) | No | 0 |
| 18117 | `ErrMalformedUrl` | Cannot parse extracted URL | No | 1 |
| 18118 | `ErrEncoding` | Character encoding error | Yes | 1 |

---

### 18120-18129 - Cache Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 18121 | `ErrCacheMiss` | Cache entry not found | No | 0 |
| 18122 | `ErrCacheExpired` | Cache entry expired | No | 0 |
| 18123 | `ErrCacheCorrupt` | Cache entry corrupted | No | 1 |
| 18124 | `ErrCacheWrite` | Failed to write cache entry | Yes | 1 |
| 18125 | `ErrCacheCleanup` | Cache cleanup failed | Yes | 1 |

---

### 18130-18139 - Export Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 18131 | `ErrExportPath` | Export path not accessible | No | 1 |
| 18132 | `ErrExportPermission` | Insufficient write permissions | No | 1 |
| 18133 | `ErrExportFormat` | Invalid export format specified | No | 9 |
| 18134 | `ErrExportSerialize` | Failed to serialize export data | No | 1 |
| 18135 | `ErrExportDiskFull` | Insufficient disk space | No | 1 |

---

### 18140-18149 - Resource Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 18141 | `ErrResourceTimeout` | Resource acquisition timeout | Yes | 8 |
| 18142 | `ErrResourceGoroutineLimit` | Maximum goroutines reached | Yes | 1 |
| 18143 | `ErrResourceMemory` | Memory limit exceeded | Yes | 1 |
| 18144 | `ErrResourceFileDescriptors` | File descriptor limit reached | Yes | 1 |
| 18145 | `ErrShutdownTimeout` | Graceful shutdown timed out | No | 10 |

---

### 18150-18159 - Configuration Runtime Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 18151 | `ErrConfigReload` | Configuration reload failed | Yes | 2 |
| 18152 | `ErrConfigEnvMissing` | Required environment variable missing | No | 2 |
| 18153 | `ErrConfigEnvInvalid` | Environment variable invalid format | No | 2 |
| 18154 | `ErrSelectorFileMissing` | Selector registry file not found | No | 2 |
| 18155 | `ErrSelectorFileInvalid` | Selector registry validation failed | No | 2 |

---

### 18160-18169 - Encryption Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 18161 | `ErrEncryptKeyMissing` | Encryption key not configured | No | 7 |
| 18162 | `ErrEncryptKeyInvalid` | Encryption key invalid format | No | 7 |
| 18163 | `ErrEncryptFailed` | Encryption operation failed | No | 1 |
| 18164 | `ErrDecryptFailed` | Decryption operation failed | No | 1 |
| 18165 | `ErrDecryptCorrupted` | Ciphertext appears corrupted | No | 1 |
