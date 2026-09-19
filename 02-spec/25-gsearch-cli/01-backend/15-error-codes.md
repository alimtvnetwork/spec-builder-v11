# Golang Search CLI - Error Code Registry

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

---

## Overview

Comprehensive error code registry for the Golang Search CLI application. All error codes are organized by domain and include constant identifiers, descriptions, and retryability flags for programmatic handling.

**Cross-References:**
- [CLI Framework](./01-cli-framework.md)
- [Configuration](./02-configuration.md)
- [Method Switching](./08-method-switching.md)
- [Error Management Overview](../../21-app/spec-management-software/06-error-management/00-overview.md)

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

### Error Code Ranges

| Range | Domain | Description |
|-------|--------|-------------|
| 1xxx | Validation | Input validation and format errors |
| 2xxx | Authentication | API keys, OAuth tokens, permissions |
| 3xxx | Database | SQLite operations and migrations |
| 4xxx | Network | HTTP requests, DNS, TLS, rate limits |
| 5xxx | Blocking | CAPTCHA, IP blocks, method cooldowns |
| 50xx | CAPTCHA Solving | Solver service integration (63-captcha-handling.md) |
| 52xx | Stealth Scraping | Browser fingerprint evasion (64-stealth-scraping.md) |
| 53xx | Proxy Acquisition | Provider integration, pool management, budget (65-proxy-acquisition.md) |
| 6xxx | Quota | API usage limits and thresholds |
| 7xxx | Parser | HTML parsing and selector errors |
| 8xxx | Cache | Caching operations and expiry |
| 9xxx | Export | RAG export and file operations |
| 10xxx | Resource | Memory, goroutines, system resources |
| 11xxx | Config | Runtime configuration issues |
| 12xxx | Encryption | Token encryption/decryption |

---

### 1xxx - Validation Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 1001 | `ErrInvalidQuery` | Empty or malformed search query | No | 9 |
| 1002 | `ErrInvalidConfigPath` | Config file path not found | No | 2 |
| 1003 | `ErrInvalidConfigFormat` | Config file is not valid JSON | No | 2 |
| 1004 | `ErrInvalidConfigSchema` | Config fails JSON schema validation | No | 2 |
| 1005 | `ErrInvalidOutputFormat` | Unknown output format specified | No | 9 |
| 1006 | `ErrInvalidEngine` | Unknown search engine specified | No | 9 |
| 1007 | `ErrInvalidMethod` | Unknown retrieval method specified | No | 9 |
| 1008 | `ErrInvalidWeightRange` | Weight value outside 0.0-1.0 range | No | 2 |
| 1009 | `ErrInvalidWeightSum` | Weights do not sum to 1.0 | No | 2 |
| 1010 | `ErrInvalidDuration` | Invalid duration format | No | 2 |
| 1011 | `ErrInvalidDepth` | Nested search depth out of range | No | 9 |
| 1012 | `ErrInvalidLimit` | Results limit out of range | No | 9 |

---

### 2xxx - Authentication Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 2001 | `ErrAuthKeyMissing` | Required API key not configured | No | 7 |
| 2002 | `ErrAuthKeyInvalid` | API key rejected by service | No | 7 |
| 2003 | `ErrAuthTokenMissing` | OAuth access token not found | No | 7 |
| 2004 | `ErrAuthTokenExpired` | OAuth token expired, refresh required | Yes | 7 |
| 2005 | `ErrAuthTokenRevoked` | OAuth token revoked by user/admin | No | 7 |
| 2006 | `ErrAuthRefreshFailed` | OAuth token refresh failed | Yes | 7 |
| 2007 | `ErrAuthScopeInsufficient` | OAuth token lacks required scopes | No | 7 |
| 2008 | `ErrAuthCseIdMissing` | Google Custom Search Engine ID missing | No | 7 |
| 2009 | `ErrAuthCseIdInvalid` | Google CSE ID rejected | No | 7 |

---

### 3xxx - Database Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 3001 | `ErrDbOpen` | Cannot open SQLite database file | Yes | 3 |
| 3002 | `ErrDbCreate` | Cannot create database file | No | 3 |
| 3003 | `ErrDbPermission` | Insufficient permissions on database | No | 3 |
| 3004 | `ErrDbMigrationFailed` | Database migration failed | No | 3 |
| 3005 | `ErrDbMigrationDirty` | Migration in dirty state | No | 3 |
| 3006 | `ErrDbQueryFailed` | SQL query execution failed | Yes | 3 |
| 3007 | `ErrDbRecordNotFound` | Requested record does not exist | No | 3 |
| 3008 | `ErrDbConstraint` | Unique/foreign key constraint violation | No | 3 |
| 3009 | `ErrDbLocked` | Database locked by another process | Yes | 3 |
| 3010 | `ErrDbCorruption` | Database file corrupted | No | 3 |
| 3011 | `ErrDbTransaction` | Transaction commit/rollback failed | Yes | 3 |

---

### 4xxx - Network Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 4001 | `ErrHttpTimeout` | HTTP request timed out | Yes | 8 |
| 4002 | `ErrHttpDns` | DNS resolution failed | Yes | 4 |
| 4003 | `ErrHttpTls` | TLS handshake failed | Yes | 4 |
| 4004 | `ErrHttpConnection` | TCP connection failed | Yes | 4 |
| 4005 | `ErrHttpReset` | Connection reset by peer | Yes | 4 |
| 4006 | `ErrHttpStatus4xx` | HTTP 4xx client error | No | 4 |
| 4007 | `ErrHttpStatus5xx` | HTTP 5xx server error | Yes | 4 |
| 4008 | `ErrRateLimited` | Rate limited (HTTP 429) | Yes | 4 |
| 4009 | `ErrProxyAuth` | Proxy authentication failed | No | 4 |
| 4010 | `ErrProxyConnection` | Proxy connection failed | Yes | 4 |
| 4011 | `ErrProxyTimeout` | Proxy request timed out | Yes | 8 |
| 4012 | `ErrRedirectLoop` | Too many HTTP redirects | No | 4 |
| 4013 | `ErrResponseTooLarge` | Response body exceeds limit | No | 4 |

---

### 5xxx - Blocking Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 5001 | `ErrBlockedCaptcha` | CAPTCHA challenge detected | No | 5 |
| 5002 | `ErrBlockedIp` | IP address blocked by service | No | 5 |
| 5003 | `ErrBlockedUserAgent` | User-Agent rejected | No | 5 |
| 5004 | `ErrBlockedRegion` | Request blocked for region | No | 5 |
| 5005 | `ErrMethodCooldown` | Search method in cooldown period | Yes | 5 |
| 5006 | `ErrAllMethodsBlocked` | All search methods blocked | Yes | 5 |
| 5007 | `ErrEngineUnavailable` | Search engine temporarily unavailable | Yes | 5 |
| 5008 | `ErrBotDetection` | Bot/automation detection triggered | No | 5 |

---

### 50xx - CAPTCHA Solving Errors (63-captcha-handling.md)

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 5090 | `ErrCaptchaAllSolversFailed` | All solver providers failed | No | 5 |
| 5091 | `ErrCaptchaNoSolverAvailable` | No solver supports challenge type | No | 5 |
| 5092 | `ErrCaptcha2cSubmitFailed` | 2Captcha task submission HTTP error | Yes | 5 |
| 5093 | `ErrCaptcha2cDecodeError` | 2Captcha response decode error | Yes | 5 |
| 5094 | `ErrCaptcha2cRejected` | 2Captcha rejected the task | No | 5 |
| 5095 | `ErrCaptcha2cTimeout` | 2Captcha solve timed out | Yes | 8 |
| 5096 | `ErrCaptcha2cSolveError` | 2Captcha returned a solve error | No | 5 |
| 5097 | `ErrCaptcha2cBalanceCheck` | 2Captcha balance check failed | Yes | 5 |
| 5098 | `ErrCaptcha2cReportFailed` | 2Captcha bad report failed | Yes | 5 |
| 5100 | `ErrCaptchaCsCreateFailed` | CapSolver createTask failed | Yes | 5 |
| 5101 | `ErrCaptchaCsRejected` | CapSolver rejected the task | No | 5 |
| 5110 | `ErrCaptchaInjectV2Failed` | reCAPTCHA v2 token injection failed | Yes | 5 |
| 5111 | `ErrCaptchaInjectV3Failed` | reCAPTCHA v3 token injection failed | Yes | 5 |
| 5120 | `ErrCaptchaHttpFailed` | Underlying HTTP request failed | Yes | 4 |
| 5121 | `ErrCaptchaInterstitial` | Interstitial requires headless browser | No | 5 |
| 5122 | `ErrCaptchaSolveFailed` | CAPTCHA solve attempt failed | Yes | 5 |
| 5123 | `ErrCaptchaMaxRetries` | CAPTCHA solve exhausted max retries | No | 5 |

---

### 52xx - Stealth Scraping Errors (64-stealth-scraping.md)

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 5200 | `ErrStealthTlsProfileUnknown` | Unknown TLS profile name | No | 5 |
| 5201 | `ErrStealthProxyUrlInvalid` | Invalid proxy URL for TLS transport | No | 5 |
| 5210 | `ErrStealthCookieMarshal` | Failed to marshal cookie store | No | 5 |
| 5211 | `ErrStealthCookieEncrypt` | Failed to encrypt cookie store | No | 5 |
| 5212 | `ErrStealthCookieDirCreate` | Failed to create cookie storage directory | No | 5 |
| 5213 | `ErrStealthCookieWrite` | Failed to write cookie file | No | 5 |
| 5220 | `ErrStealthBrowserLaunch` | Failed to launch headless browser | No | 5 |
| 5221 | `ErrStealthBrowserConnect` | Failed to connect to browser process | No | 5 |
| 5222 | `ErrStealthPageCreate` | Failed to create browser page | Yes | 5 |
| 5223 | `ErrStealthNavigationFailed` | Page navigation timed out or failed | Yes | 5 |
| 5224 | `ErrStealthHtmlExtract` | Failed to extract HTML from page | Yes | 5 |

---

### 53xx - Proxy Acquisition Errors (65-proxy-acquisition.md)

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 5300 | `ErrProxyAcquireFailed` | Failed to acquire proxy from vendor API | Yes | 5 |
| 5301 | `ErrProxyVendorAuthFailed` | Vendor authentication rejected | No | 7 |
| 5302 | `ErrProxyConnTimeout` | Proxy connection timed out | Yes | 8 |
| 5303 | `ErrProxyBanned` | Proxy IP banned by target domain | No | 5 |
| 5310 | `ErrNoProxiesAvailable` | All proxies exhausted across all vendors | No | 5 |
| 5311 | `ErrNoHealthyProxies` | Pool exists but no healthy proxies for target | Yes | 5 |
| 5312 | `ErrProxyTypeUnavailable` | Requested proxy type not available from any vendor | No | 5 |
| 5320 | `ErrBudgetExceeded` | Daily or monthly budget limit reached | No | 6 |
| 5321 | `ErrBudgetAlertThreshold` | Spending exceeded alert threshold (warning) | No | 0 |
| 5322 | `ErrVendorBalanceLow` | Vendor account balance below $1.00 | No | 6 |
| 5330 | `ErrHealthCheckFailed` | Proxy health check failed | Yes | 5 |
| 5331 | `ErrReplenishFailed` | Auto-replenishment could not acquire proxies | Yes | 5 |
| 5340 | `ErrCostTrackingFailed` | Failed to record cost data | Yes | 3 |
| 5341 | `ErrCostReportFailed` | Failed to generate cost report | No | 1 |

---

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 6001 | `ErrQuotaDaily` | Daily API quota exceeded | No | 6 |
| 6002 | `ErrQuotaMonthly` | Monthly API quota exceeded | No | 6 |
| 6003 | `ErrQuotaPerSecond` | Requests per second limit hit | Yes | 6 |
| 6004 | `ErrQuotaPerMinute` | Requests per minute limit hit | Yes | 6 |
| 6005 | `ErrQuotaBilling` | Billing quota exceeded | No | 6 |
| 6006 | `ErrQuotaUser` | Per-user quota exceeded | No | 6 |

---

### 7xxx - Parser Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 7001 | `ErrParseHtml` | HTML document parsing failed | Yes | 1 |
| 7002 | `ErrParseJson` | JSON response parsing failed | Yes | 1 |
| 7003 | `ErrSelectorNotFound` | CSS selector matched nothing | Yes | 1 |
| 7004 | `ErrSelectorInvalid` | Invalid CSS selector syntax | No | 1 |
| 7005 | `ErrSelectorVersion` | Selector version mismatch | Yes | 1 |
| 7006 | `ErrEmptyResults` | No results found (informational) | No | 0 |
| 7007 | `ErrMalformedUrl` | Cannot parse extracted URL | No | 1 |
| 7008 | `ErrEncoding` | Character encoding error | Yes | 1 |

---

### 76xx - Movie Search Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 7600 | `ErrMovieNormalizeFailed` | Filename normalization failed | No | 1 |
| 7601 | `ErrMovieTypeDetectFailed` | Cannot detect Movie vs TV Show | No | 1 |
| 7602 | `ErrMovieTmdbApiFailed` | TMDB API request failed | Yes | 4 |
| 7603 | `ErrMovieOmdbApiFailed` | OMDB API request failed | Yes | 4 |
| 7604 | `ErrMovieImdbScrapeFailed` | IMDB scraping failed | Yes | 4 |
| 7605 | `ErrMovieNotFound` | Movie/TV show not found in any source | No | 0 |
| 7606 | `ErrMovieCacheWriteFailed` | Failed to write to movie cache DB | Yes | 3 |
| 7607 | `ErrMovieBatchPartial` | Some items in batch failed | No | 1 |
| 7608 | `ErrMovieRateLimited` | Movie API rate limit hit | Yes | 4 |
| 7609 | `ErrMovieApiKeyExhausted` | All API keys exhausted quota | No | 6 |

---

### 8xxx - Cache Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 8001 | `ErrCacheMiss` | Cache entry not found | No | 0 |
| 8002 | `ErrCacheExpired` | Cache entry expired | No | 0 |
| 8003 | `ErrCacheCorrupt` | Cache entry corrupted | No | 1 |
| 8004 | `ErrCacheWrite` | Failed to write cache entry | Yes | 1 |
| 8005 | `ErrCacheCleanup` | Cache cleanup failed | Yes | 1 |

---

### 9xxx - Export Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 9001 | `ErrExportPath` | Export path not accessible | No | 1 |
| 9002 | `ErrExportPermission` | Insufficient write permissions | No | 1 |
| 9003 | `ErrExportFormat` | Invalid export format specified | No | 9 |
| 9004 | `ErrExportSerialize` | Failed to serialize export data | No | 1 |
| 9005 | `ErrExportDiskFull` | Insufficient disk space | No | 1 |

---

### 10xxx - Resource Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 10001 | `ErrResourceTimeout` | Resource acquisition timeout | Yes | 8 |
| 10002 | `ErrResourceGoroutineLimit` | Maximum goroutines reached | Yes | 1 |
| 10003 | `ErrResourceMemory` | Memory limit exceeded | Yes | 1 |
| 10004 | `ErrResourceFileDescriptors` | File descriptor limit reached | Yes | 1 |
| 10005 | `ErrShutdownTimeout` | Graceful shutdown timed out | No | 10 |

---

### 11xxx - Configuration Runtime Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 11001 | `ErrConfigReload` | Configuration reload failed | Yes | 2 |
| 11002 | `ErrConfigEnvMissing` | Required environment variable missing | No | 2 |
| 11003 | `ErrConfigEnvInvalid` | Environment variable invalid format | No | 2 |
| 11004 | `ErrSelectorFileMissing` | Selector registry file not found | No | 2 |
| 11005 | `ErrSelectorFileInvalid` | Selector registry validation failed | No | 2 |

---

### 12xxx - Encryption Errors

| Code | Constant | Description | Retryable | Exit Code |
|------|----------|-------------|-----------|-----------|
| 12001 | `ErrEncryptKeyMissing` | Encryption key not configured | No | 7 |
| 12002 | `ErrEncryptKeyInvalid` | Encryption key invalid format | No | 7 |
| 12003 | `ErrEncryptFailed` | Encryption operation failed | No | 1 |
| 12004 | `ErrDecryptFailed` | Decryption operation failed | No | 1 |
| 12005 | `ErrDecryptCorrupted` | Ciphertext appears corrupted | No | 1 |

---

## Go Implementation

### Error Code Constants

```go
// pkg/errors/codes.go

package errors

// ErrorCode represents a structured application error code
type ErrorCode int

// Exit codes for CLI process termination
const (
    ExitSuccess     = 0
    ExitGeneral     = 1
    ExitConfig      = 2
    ExitDatabase    = 3
    ExitNetwork     = 4
    ExitAllBlocked  = 5
    ExitQuota       = 6
    ExitAuth        = 7
    ExitTimeout     = 8
    ExitInvalidInput = 9
    ExitShutdown    = 10
)

// Validation errors (1xxx)
const (
    ErrInvalidQuery        ErrorCode = 1001
    ErrInvalidConfigPath   ErrorCode = 1002
    ErrInvalidConfigFormat ErrorCode = 1003
    ErrInvalidConfigSchema ErrorCode = 1004
    ErrInvalidOutputFormat ErrorCode = 1005
    ErrInvalidEngine       ErrorCode = 1006
    ErrInvalidMethod       ErrorCode = 1007
    ErrInvalidWeightRange  ErrorCode = 1008
    ErrInvalidWeightSum    ErrorCode = 1009
    ErrInvalidDuration     ErrorCode = 1010
    ErrInvalidDepth        ErrorCode = 1011
    ErrInvalidLimit        ErrorCode = 1012
)

// Authentication errors (2xxx)
const (
    ErrAuthKeyMissing       ErrorCode = 2001
    ErrAuthKeyInvalid       ErrorCode = 2002
    ErrAuthTokenMissing     ErrorCode = 2003
    ErrAuthTokenExpired     ErrorCode = 2004
    ErrAuthTokenRevoked     ErrorCode = 2005
    ErrAuthRefreshFailed    ErrorCode = 2006
    ErrAuthScopeInsufficient ErrorCode = 2007
    ErrAuthCseIdMissing     ErrorCode = 2008
    ErrAuthCseIdInvalid     ErrorCode = 2009
)

// Database errors (3xxx)
const (
    ErrDbOpen            ErrorCode = 3001
    ErrDbCreate          ErrorCode = 3002
    ErrDbPermission      ErrorCode = 3003
    ErrDbMigrationFailed ErrorCode = 3004
    ErrDbMigrationDirty  ErrorCode = 3005
    ErrDbQueryFailed     ErrorCode = 3006
    ErrDbRecordNotFound  ErrorCode = 3007
    ErrDbConstraint      ErrorCode = 3008
    ErrDbLocked          ErrorCode = 3009
    ErrDbCorruption      ErrorCode = 3010
    ErrDbTransaction     ErrorCode = 3011
)

// Network errors (4xxx)
const (
    ErrHttpTimeout       ErrorCode = 4001
    ErrHttpDns           ErrorCode = 4002
    ErrHttpTls           ErrorCode = 4003
    ErrHttpConnection    ErrorCode = 4004
    ErrHttpReset         ErrorCode = 4005
    ErrHttpStatus4xx     ErrorCode = 4006
    ErrHttpStatus5xx     ErrorCode = 4007
    ErrRateLimited       ErrorCode = 4008
    ErrProxyAuth         ErrorCode = 4009
    ErrProxyConnection   ErrorCode = 4010
    ErrProxyTimeout      ErrorCode = 4011
    ErrRedirectLoop      ErrorCode = 4012
    ErrResponseTooLarge  ErrorCode = 4013
)

// Blocking errors (5xxx)
const (
    ErrBlockedCaptcha     ErrorCode = 5001
    ErrBlockedIp          ErrorCode = 5002
    ErrBlockedUserAgent   ErrorCode = 5003
    ErrBlockedRegion      ErrorCode = 5004
    ErrMethodCooldown     ErrorCode = 5005
    ErrAllMethodsBlocked  ErrorCode = 5006
    ErrEngineUnavailable  ErrorCode = 5007
    ErrBotDetection       ErrorCode = 5008
)

// CAPTCHA Solving errors (50xx) — 63-captcha-handling.md
const (
    ErrCaptchaAllSolversFailed  ErrorCode = 5090
    ErrCaptchaNoSolverAvailable ErrorCode = 5091
    ErrCaptcha2cSubmitFailed    ErrorCode = 5092
    ErrCaptcha2cDecodeError     ErrorCode = 5093
    ErrCaptcha2cRejected        ErrorCode = 5094
    ErrCaptcha2cTimeout         ErrorCode = 5095
    ErrCaptcha2cSolveError      ErrorCode = 5096
    ErrCaptcha2cBalanceCheck    ErrorCode = 5097
    ErrCaptcha2cReportFailed    ErrorCode = 5098
    ErrCaptchaCsCreateFailed    ErrorCode = 5100
    ErrCaptchaCsRejected        ErrorCode = 5101
    ErrCaptchaInjectV2Failed    ErrorCode = 5110
    ErrCaptchaInjectV3Failed    ErrorCode = 5111
    ErrCaptchaHttpFailed        ErrorCode = 5120
    ErrCaptchaInterstitial      ErrorCode = 5121
    ErrCaptchaSolveFailed       ErrorCode = 5122
    ErrCaptchaMaxRetries        ErrorCode = 5123
)

// Stealth Scraping errors (52xx) — 64-stealth-scraping.md
const (
    ErrStealthTlsProfileUnknown ErrorCode = 5200
    ErrStealthProxyUrlInvalid   ErrorCode = 5201
    ErrStealthCookieMarshal     ErrorCode = 5210
    ErrStealthCookieEncrypt     ErrorCode = 5211
    ErrStealthCookieDirCreate   ErrorCode = 5212
    ErrStealthCookieWrite       ErrorCode = 5213
    ErrStealthBrowserLaunch     ErrorCode = 5220
    ErrStealthBrowserConnect    ErrorCode = 5221
    ErrStealthPageCreate        ErrorCode = 5222
    ErrStealthNavigationFailed  ErrorCode = 5223
    ErrStealthHtmlExtract       ErrorCode = 5224
)

// Proxy Acquisition errors (53xx) — 65-proxy-acquisition.md
const (
    ErrProxyAcquireFailed    ErrorCode = 5300
    ErrProxyVendorAuthFailed ErrorCode = 5301
    ErrProxyConnTimeout      ErrorCode = 5302
    ErrProxyBanned           ErrorCode = 5303
    ErrNoProxiesAvailable    ErrorCode = 5310
    ErrNoHealthyProxies      ErrorCode = 5311
    ErrProxyTypeUnavailable  ErrorCode = 5312
    ErrBudgetExceeded        ErrorCode = 5320
    ErrBudgetAlertThreshold  ErrorCode = 5321
    ErrVendorBalanceLow      ErrorCode = 5322
    ErrHealthCheckFailed     ErrorCode = 5330
    ErrReplenishFailed       ErrorCode = 5331
    ErrCostTrackingFailed    ErrorCode = 5340
    ErrCostReportFailed      ErrorCode = 5341
)

// Quota errors (6xxx)
const (
    ErrQuotaDaily     ErrorCode = 6001
    ErrQuotaMonthly   ErrorCode = 6002
    ErrQuotaPerSecond ErrorCode = 6003
    ErrQuotaPerMinute ErrorCode = 6004
    ErrQuotaBilling   ErrorCode = 6005
    ErrQuotaUser      ErrorCode = 6006
)

// Parser errors (7xxx)
const (
    ErrParseHtml         ErrorCode = 7001
    ErrParseJson         ErrorCode = 7002
    ErrSelectorNotFound  ErrorCode = 7003
    ErrSelectorInvalid   ErrorCode = 7004
    ErrSelectorVersion   ErrorCode = 7005
    ErrEmptyResults      ErrorCode = 7006
    ErrMalformedUrl      ErrorCode = 7007
    ErrEncoding          ErrorCode = 7008
)

// Movie Search errors (76xx)
const (
    ErrMovieNormalizeFailed   ErrorCode = 7600
    ErrMovieTypeDetectFailed  ErrorCode = 7601
    ErrMovieTmdbApiFailed     ErrorCode = 7602
    ErrMovieOmdbApiFailed     ErrorCode = 7603
    ErrMovieImdbScrapeFailed  ErrorCode = 7604
    ErrMovieNotFound          ErrorCode = 7605
    ErrMovieCacheWriteFailed  ErrorCode = 7606
    ErrMovieBatchPartial      ErrorCode = 7607
    ErrMovieRateLimited       ErrorCode = 7608
    ErrMovieApiKeyExhausted   ErrorCode = 7609
)

// Cache errors (8xxx)
const (
    ErrCacheMiss    ErrorCode = 8001
    ErrCacheExpired ErrorCode = 8002
    ErrCacheCorrupt ErrorCode = 8003
    ErrCacheWrite   ErrorCode = 8004
    ErrCacheCleanup ErrorCode = 8005
)

// Export errors (9xxx)
const (
    ErrExportPath       ErrorCode = 9001
    ErrExportPermission ErrorCode = 9002
    ErrExportFormat     ErrorCode = 9003
    ErrExportSerialize  ErrorCode = 9004
    ErrExportDiskFull   ErrorCode = 9005
)

// Resource errors (10xxx)
const (
    ErrResourceTimeout         ErrorCode = 10001
    ErrResourceGoroutineLimit  ErrorCode = 10002
    ErrResourceMemory          ErrorCode = 10003
    ErrResourceFileDescriptors ErrorCode = 10004
    ErrShutdownTimeout         ErrorCode = 10005
)

// Configuration runtime errors (11xxx)
const (
    ErrConfigReload         ErrorCode = 11001
    ErrConfigEnvMissing     ErrorCode = 11002
    ErrConfigEnvInvalid     ErrorCode = 11003
    ErrSelectorFileMissing  ErrorCode = 11004
    ErrSelectorFileInvalid  ErrorCode = 11005
)

// Encryption errors (12xxx)
const (
    ErrEncryptKeyMissing  ErrorCode = 12001
    ErrEncryptKeyInvalid  ErrorCode = 12002
    ErrEncryptFailed      ErrorCode = 12003
    ErrDecryptFailed      ErrorCode = 12004
    ErrDecryptCorrupted   ErrorCode = 12005
)
```

---

### Error Metadata Registry

```go
// pkg/errors/metadata.go

package errors

// ErrorMetadata contains static information about an error code
type ErrorMetadata struct {
    Code      ErrorCode
    Constant  string
    Domain    string
    Message   string
    Retryable bool
    ExitCode  int
}

// Registry maps error codes to their metadata
var Registry = map[ErrorCode]ErrorMetadata{
    // Validation (1xxx)
    ErrInvalidQuery:        {1001, "ErrInvalidQuery", "validation", "Empty or malformed search query", false, ExitInvalidInput},
    ErrInvalidConfigPath:   {1002, "ErrInvalidConfigPath", "validation", "Config file path not found", false, ExitConfig},
    ErrInvalidConfigFormat: {1003, "ErrInvalidConfigFormat", "validation", "Config file is not valid JSON", false, ExitConfig},
    ErrInvalidConfigSchema: {1004, "ErrInvalidConfigSchema", "validation", "Config fails JSON schema validation", false, ExitConfig},
    ErrInvalidOutputFormat: {1005, "ErrInvalidOutputFormat", "validation", "Unknown output format specified", false, ExitInvalidInput},
    ErrInvalidEngine:       {1006, "ErrInvalidEngine", "validation", "Unknown search engine specified", false, ExitInvalidInput},
    ErrInvalidMethod:       {1007, "ErrInvalidMethod", "validation", "Unknown retrieval method specified", false, ExitInvalidInput},
    ErrInvalidWeightRange:  {1008, "ErrInvalidWeightRange", "validation", "Weight value outside 0.0-1.0 range", false, ExitConfig},
    ErrInvalidWeightSum:    {1009, "ErrInvalidWeightSum", "validation", "Weights do not sum to 1.0", false, ExitConfig},
    ErrInvalidDuration:     {1010, "ErrInvalidDuration", "validation", "Invalid duration format", false, ExitConfig},
    ErrInvalidDepth:        {1011, "ErrInvalidDepth", "validation", "Nested search depth out of range", false, ExitInvalidInput},
    ErrInvalidLimit:        {1012, "ErrInvalidLimit", "validation", "Results limit out of range", false, ExitInvalidInput},
    
    // Authentication (2xxx)
    ErrAuthKeyMissing:        {2001, "ErrAuthKeyMissing", "auth", "Required API key not configured", false, ExitAuth},
    ErrAuthKeyInvalid:        {2002, "ErrAuthKeyInvalid", "auth", "API key rejected by service", false, ExitAuth},
    ErrAuthTokenMissing:      {2003, "ErrAuthTokenMissing", "auth", "OAuth access token not found", false, ExitAuth},
    ErrAuthTokenExpired:      {2004, "ErrAuthTokenExpired", "auth", "OAuth token expired, refresh required", true, ExitAuth},
    ErrAuthTokenRevoked:      {2005, "ErrAuthTokenRevoked", "auth", "OAuth token revoked by user/admin", false, ExitAuth},
    ErrAuthRefreshFailed:     {2006, "ErrAuthRefreshFailed", "auth", "OAuth token refresh failed", true, ExitAuth},
    ErrAuthScopeInsufficient: {2007, "ErrAuthScopeInsufficient", "auth", "OAuth token lacks required scopes", false, ExitAuth},
    ErrAuthCseIdMissing:      {2008, "ErrAuthCseIdMissing", "auth", "Google Custom Search Engine ID missing", false, ExitAuth},
    ErrAuthCseIdInvalid:      {2009, "ErrAuthCseIdInvalid", "auth", "Google CSE ID rejected", false, ExitAuth},
    
    // Database (3xxx)
    ErrDbOpen:            {3001, "ErrDbOpen", "database", "Cannot open SQLite database file", true, ExitDatabase},
    ErrDbCreate:          {3002, "ErrDbCreate", "database", "Cannot create database file", false, ExitDatabase},
    ErrDbPermission:      {3003, "ErrDbPermission", "database", "Insufficient permissions on database", false, ExitDatabase},
    ErrDbMigrationFailed: {3004, "ErrDbMigrationFailed", "database", "Database migration failed", false, ExitDatabase},
    ErrDbMigrationDirty:  {3005, "ErrDbMigrationDirty", "database", "Migration in dirty state", false, ExitDatabase},
    ErrDbQueryFailed:     {3006, "ErrDbQueryFailed", "database", "SQL query execution failed", true, ExitDatabase},
    ErrDbRecordNotFound:  {3007, "ErrDbRecordNotFound", "database", "Requested record does not exist", false, ExitDatabase},
    ErrDbConstraint:      {3008, "ErrDbConstraint", "database", "Unique/foreign key constraint violation", false, ExitDatabase},
    ErrDbLocked:          {3009, "ErrDbLocked", "database", "Database locked by another process", true, ExitDatabase},
    ErrDbCorruption:      {3010, "ErrDbCorruption", "database", "Database file corrupted", false, ExitDatabase},
    ErrDbTransaction:     {3011, "ErrDbTransaction", "database", "Transaction commit/rollback failed", true, ExitDatabase},
    
    // Network (4xxx)
    ErrHttpTimeout:      {4001, "ErrHttpTimeout", "network", "HTTP request timed out", true, ExitTimeout},
    ErrHttpDns:          {4002, "ErrHttpDns", "network", "DNS resolution failed", true, ExitNetwork},
    ErrHttpTls:          {4003, "ErrHttpTls", "network", "TLS handshake failed", true, ExitNetwork},
    ErrHttpConnection:   {4004, "ErrHttpConnection", "network", "TCP connection failed", true, ExitNetwork},
    ErrHttpReset:        {4005, "ErrHttpReset", "network", "Connection reset by peer", true, ExitNetwork},
    ErrHttpStatus4xx:    {4006, "ErrHttpStatus4xx", "network", "HTTP 4xx client error", false, ExitNetwork},
    ErrHttpStatus5xx:    {4007, "ErrHttpStatus5xx", "network", "HTTP 5xx server error", true, ExitNetwork},
    ErrRateLimited:      {4008, "ErrRateLimited", "network", "Rate limited (HTTP 429)", true, ExitNetwork},
    ErrProxyAuth:        {4009, "ErrProxyAuth", "network", "Proxy authentication failed", false, ExitNetwork},
    ErrProxyConnection:  {4010, "ErrProxyConnection", "network", "Proxy connection failed", true, ExitNetwork},
    ErrProxyTimeout:     {4011, "ErrProxyTimeout", "network", "Proxy request timed out", true, ExitTimeout},
    ErrRedirectLoop:     {4012, "ErrRedirectLoop", "network", "Too many HTTP redirects", false, ExitNetwork},
    ErrResponseTooLarge: {4013, "ErrResponseTooLarge", "network", "Response body exceeds limit", false, ExitNetwork},
    
    // Blocking (5xxx)
    ErrBlockedCaptcha:    {5001, "ErrBlockedCaptcha", "blocking", "CAPTCHA challenge detected", false, ExitAllBlocked},
    ErrBlockedIp:         {5002, "ErrBlockedIp", "blocking", "IP address blocked by service", false, ExitAllBlocked},
    ErrBlockedUserAgent:  {5003, "ErrBlockedUserAgent", "blocking", "User-Agent rejected", false, ExitAllBlocked},
    ErrBlockedRegion:     {5004, "ErrBlockedRegion", "blocking", "Request blocked for region", false, ExitAllBlocked},
    ErrMethodCooldown:    {5005, "ErrMethodCooldown", "blocking", "Search method in cooldown period", true, ExitAllBlocked},
    ErrAllMethodsBlocked: {5006, "ErrAllMethodsBlocked", "blocking", "All search methods blocked", true, ExitAllBlocked},
    ErrEngineUnavailable: {5007, "ErrEngineUnavailable", "blocking", "Search engine temporarily unavailable", true, ExitAllBlocked},
    ErrBotDetection:      {5008, "ErrBotDetection", "blocking", "Bot/automation detection triggered", false, ExitAllBlocked},
    
    // CAPTCHA Solving (50xx)
    ErrCaptchaAllSolversFailed:  {5090, "ErrCaptchaAllSolversFailed", "captcha", "All solver providers failed", false, ExitAllBlocked},
    ErrCaptchaNoSolverAvailable: {5091, "ErrCaptchaNoSolverAvailable", "captcha", "No solver supports challenge type", false, ExitAllBlocked},
    ErrCaptcha2cSubmitFailed:    {5092, "ErrCaptcha2cSubmitFailed", "captcha", "2Captcha task submission HTTP error", true, ExitAllBlocked},
    ErrCaptcha2cDecodeError:     {5093, "ErrCaptcha2cDecodeError", "captcha", "2Captcha response decode error", true, ExitAllBlocked},
    ErrCaptcha2cRejected:        {5094, "ErrCaptcha2cRejected", "captcha", "2Captcha rejected the task", false, ExitAllBlocked},
    ErrCaptcha2cTimeout:         {5095, "ErrCaptcha2cTimeout", "captcha", "2Captcha solve timed out", true, ExitTimeout},
    ErrCaptcha2cSolveError:      {5096, "ErrCaptcha2cSolveError", "captcha", "2Captcha returned a solve error", false, ExitAllBlocked},
    ErrCaptcha2cBalanceCheck:    {5097, "ErrCaptcha2cBalanceCheck", "captcha", "2Captcha balance check failed", true, ExitAllBlocked},
    ErrCaptcha2cReportFailed:    {5098, "ErrCaptcha2cReportFailed", "captcha", "2Captcha bad report failed", true, ExitAllBlocked},
    ErrCaptchaCsCreateFailed:    {5100, "ErrCaptchaCsCreateFailed", "captcha", "CapSolver createTask failed", true, ExitAllBlocked},
    ErrCaptchaCsRejected:        {5101, "ErrCaptchaCsRejected", "captcha", "CapSolver rejected the task", false, ExitAllBlocked},
    ErrCaptchaInjectV2Failed:    {5110, "ErrCaptchaInjectV2Failed", "captcha", "reCAPTCHA v2 token injection failed", true, ExitAllBlocked},
    ErrCaptchaInjectV3Failed:    {5111, "ErrCaptchaInjectV3Failed", "captcha", "reCAPTCHA v3 token injection failed", true, ExitAllBlocked},
    ErrCaptchaHttpFailed:        {5120, "ErrCaptchaHttpFailed", "captcha", "Underlying HTTP request failed", true, ExitNetwork},
    ErrCaptchaInterstitial:      {5121, "ErrCaptchaInterstitial", "captcha", "Interstitial requires headless browser", false, ExitAllBlocked},
    ErrCaptchaSolveFailed:       {5122, "ErrCaptchaSolveFailed", "captcha", "CAPTCHA solve attempt failed", true, ExitAllBlocked},
    ErrCaptchaMaxRetries:        {5123, "ErrCaptchaMaxRetries", "captcha", "CAPTCHA solve exhausted max retries", false, ExitAllBlocked},
    
    // Stealth Scraping (52xx)
    ErrStealthTlsProfileUnknown: {5200, "ErrStealthTlsProfileUnknown", "stealth", "Unknown TLS profile name", false, ExitAllBlocked},
    ErrStealthProxyUrlInvalid:   {5201, "ErrStealthProxyUrlInvalid", "stealth", "Invalid proxy URL for TLS transport", false, ExitAllBlocked},
    ErrStealthCookieMarshal:     {5210, "ErrStealthCookieMarshal", "stealth", "Failed to marshal cookie store", false, ExitAllBlocked},
    ErrStealthCookieEncrypt:     {5211, "ErrStealthCookieEncrypt", "stealth", "Failed to encrypt cookie store", false, ExitAllBlocked},
    ErrStealthCookieDirCreate:   {5212, "ErrStealthCookieDirCreate", "stealth", "Failed to create cookie storage directory", false, ExitAllBlocked},
    ErrStealthCookieWrite:       {5213, "ErrStealthCookieWrite", "stealth", "Failed to write cookie file", false, ExitAllBlocked},
    ErrStealthBrowserLaunch:     {5220, "ErrStealthBrowserLaunch", "stealth", "Failed to launch headless browser", false, ExitAllBlocked},
    ErrStealthBrowserConnect:    {5221, "ErrStealthBrowserConnect", "stealth", "Failed to connect to browser process", false, ExitAllBlocked},
    ErrStealthPageCreate:        {5222, "ErrStealthPageCreate", "stealth", "Failed to create browser page", true, ExitAllBlocked},
    ErrStealthNavigationFailed:  {5223, "ErrStealthNavigationFailed", "stealth", "Page navigation timed out or failed", true, ExitAllBlocked},
    ErrStealthHtmlExtract:       {5224, "ErrStealthHtmlExtract", "stealth", "Failed to extract HTML from page", true, ExitAllBlocked},
    
    // Proxy Acquisition (53xx)
    ErrProxyAcquireFailed:    {5300, "ErrProxyAcquireFailed", "proxy", "Failed to acquire proxy from vendor API", true, ExitAllBlocked},
    ErrProxyVendorAuthFailed: {5301, "ErrProxyVendorAuthFailed", "proxy", "Vendor authentication rejected", false, ExitAuth},
    ErrProxyConnTimeout:      {5302, "ErrProxyConnTimeout", "proxy", "Proxy connection timed out", true, ExitTimeout},
    ErrProxyBanned:           {5303, "ErrProxyBanned", "proxy", "Proxy IP banned by target domain", false, ExitAllBlocked},
    ErrNoProxiesAvailable:    {5310, "ErrNoProxiesAvailable", "proxy", "All proxies exhausted across all vendors", false, ExitAllBlocked},
    ErrNoHealthyProxies:      {5311, "ErrNoHealthyProxies", "proxy", "Pool exists but no healthy proxies for target", true, ExitAllBlocked},
    ErrProxyTypeUnavailable:  {5312, "ErrProxyTypeUnavailable", "proxy", "Requested proxy type not available from any vendor", false, ExitAllBlocked},
    ErrBudgetExceeded:        {5320, "ErrBudgetExceeded", "proxy", "Daily or monthly budget limit reached", false, ExitQuota},
    ErrBudgetAlertThreshold:  {5321, "ErrBudgetAlertThreshold", "proxy", "Spending exceeded alert threshold (warning)", false, ExitSuccess},
    ErrVendorBalanceLow:      {5322, "ErrVendorBalanceLow", "proxy", "Vendor account balance below $1.00", false, ExitQuota},
    ErrHealthCheckFailed:     {5330, "ErrHealthCheckFailed", "proxy", "Proxy health check failed", true, ExitAllBlocked},
    ErrReplenishFailed:       {5331, "ErrReplenishFailed", "proxy", "Auto-replenishment could not acquire proxies", true, ExitAllBlocked},
    ErrCostTrackingFailed:    {5340, "ErrCostTrackingFailed", "proxy", "Failed to record cost data", true, ExitDatabase},
    ErrCostReportFailed:      {5341, "ErrCostReportFailed", "proxy", "Failed to generate cost report", false, ExitGeneral},
    
    // Quota (6xxx)
    ErrQuotaDaily:     {6001, "ErrQuotaDaily", "quota", "Daily API quota exceeded", false, ExitQuota},
    ErrQuotaMonthly:   {6002, "ErrQuotaMonthly", "quota", "Monthly API quota exceeded", false, ExitQuota},
    ErrQuotaPerSecond: {6003, "ErrQuotaPerSecond", "quota", "Requests per second limit hit", true, ExitQuota},
    ErrQuotaPerMinute: {6004, "ErrQuotaPerMinute", "quota", "Requests per minute limit hit", true, ExitQuota},
    ErrQuotaBilling:   {6005, "ErrQuotaBilling", "quota", "Billing quota exceeded", false, ExitQuota},
    ErrQuotaUser:      {6006, "ErrQuotaUser", "quota", "Per-user quota exceeded", false, ExitQuota},
    
    // Parser (7xxx)
    ErrParseHtml:        {7001, "ErrParseHtml", "parser", "HTML document parsing failed", true, ExitGeneral},
    ErrParseJson:        {7002, "ErrParseJson", "parser", "JSON response parsing failed", true, ExitGeneral},
    ErrSelectorNotFound: {7003, "ErrSelectorNotFound", "parser", "CSS selector matched nothing", true, ExitGeneral},
    ErrSelectorInvalid:  {7004, "ErrSelectorInvalid", "parser", "Invalid CSS selector syntax", false, ExitGeneral},
    ErrSelectorVersion:  {7005, "ErrSelectorVersion", "parser", "Selector version mismatch", true, ExitGeneral},
    ErrEmptyResults:     {7006, "ErrEmptyResults", "parser", "No results found (informational)", false, ExitSuccess},
    ErrMalformedUrl:     {7007, "ErrMalformedUrl", "parser", "Cannot parse extracted URL", false, ExitGeneral},
    ErrEncoding:         {7008, "ErrEncoding", "parser", "Character encoding error", true, ExitGeneral},
    
    // Movie Search (76xx)
    ErrMovieNormalizeFailed:  {7600, "ErrMovieNormalizeFailed", "movie", "Filename normalization failed", false, ExitGeneral},
    ErrMovieTypeDetectFailed: {7601, "ErrMovieTypeDetectFailed", "movie", "Cannot detect Movie vs TV Show", false, ExitGeneral},
    ErrMovieTmdbApiFailed:    {7602, "ErrMovieTmdbApiFailed", "movie", "TMDB API request failed", true, ExitNetwork},
    ErrMovieOmdbApiFailed:    {7603, "ErrMovieOmdbApiFailed", "movie", "OMDB API request failed", true, ExitNetwork},
    ErrMovieImdbScrapeFailed: {7604, "ErrMovieImdbScrapeFailed", "movie", "IMDB scraping failed", true, ExitNetwork},
    ErrMovieNotFound:         {7605, "ErrMovieNotFound", "movie", "Movie/TV show not found in any source", false, ExitSuccess},
    ErrMovieCacheWriteFailed: {7606, "ErrMovieCacheWriteFailed", "movie", "Failed to write to movie cache DB", true, ExitDatabase},
    ErrMovieBatchPartial:     {7607, "ErrMovieBatchPartial", "movie", "Some items in batch failed", false, ExitGeneral},
    ErrMovieRateLimited:      {7608, "ErrMovieRateLimited", "movie", "Movie API rate limit hit", true, ExitNetwork},
    ErrMovieApiKeyExhausted:  {7609, "ErrMovieApiKeyExhausted", "movie", "All API keys exhausted quota", false, ExitQuota},
    
    // Cache (8xxx)
    ErrCacheMiss:    {8001, "ErrCacheMiss", "cache", "Cache entry not found", false, ExitSuccess},
    ErrCacheExpired: {8002, "ErrCacheExpired", "cache", "Cache entry expired", false, ExitSuccess},
    ErrCacheCorrupt: {8003, "ErrCacheCorrupt", "cache", "Cache entry corrupted", false, ExitGeneral},
    ErrCacheWrite:   {8004, "ErrCacheWrite", "cache", "Failed to write cache entry", true, ExitGeneral},
    ErrCacheCleanup: {8005, "ErrCacheCleanup", "cache", "Cache cleanup failed", true, ExitGeneral},
    
    // Export (9xxx)
    ErrExportPath:       {9001, "ErrExportPath", "export", "Export path not accessible", false, ExitGeneral},
    ErrExportPermission: {9002, "ErrExportPermission", "export", "Insufficient write permissions", false, ExitGeneral},
    ErrExportFormat:     {9003, "ErrExportFormat", "export", "Invalid export format specified", false, ExitInvalidInput},
    ErrExportSerialize:  {9004, "ErrExportSerialize", "export", "Failed to serialize export data", false, ExitGeneral},
    ErrExportDiskFull:   {9005, "ErrExportDiskFull", "export", "Insufficient disk space", false, ExitGeneral},
    
    // Resource (10xxx)
    ErrResourceTimeout:         {10001, "ErrResourceTimeout", "resource", "Resource acquisition timeout", true, ExitTimeout},
    ErrResourceGoroutineLimit:  {10002, "ErrResourceGoroutineLimit", "resource", "Maximum goroutines reached", true, ExitGeneral},
    ErrResourceMemory:          {10003, "ErrResourceMemory", "resource", "Memory limit exceeded", true, ExitGeneral},
    ErrResourceFileDescriptors: {10004, "ErrResourceFileDescriptors", "resource", "File descriptor limit reached", true, ExitGeneral},
    ErrShutdownTimeout:         {10005, "ErrShutdownTimeout", "resource", "Graceful shutdown timed out", false, ExitShutdown},
    
    // Configuration Runtime (11xxx)
    ErrConfigReload:        {11001, "ErrConfigReload", "config", "Configuration reload failed", true, ExitConfig},
    ErrConfigEnvMissing:    {11002, "ErrConfigEnvMissing", "config", "Required environment variable missing", false, ExitConfig},
    ErrConfigEnvInvalid:    {11003, "ErrConfigEnvInvalid", "config", "Environment variable invalid format", false, ExitConfig},
    ErrSelectorFileMissing: {11004, "ErrSelectorFileMissing", "config", "Selector registry file not found", false, ExitConfig},
    ErrSelectorFileInvalid: {11005, "ErrSelectorFileInvalid", "config", "Selector registry validation failed", false, ExitConfig},
    
    // Encryption (12xxx)
    ErrEncryptKeyMissing: {12001, "ErrEncryptKeyMissing", "encryption", "Encryption key not configured", false, ExitAuth},
    ErrEncryptKeyInvalid: {12002, "ErrEncryptKeyInvalid", "encryption", "Encryption key invalid format", false, ExitAuth},
    ErrEncryptFailed:     {12003, "ErrEncryptFailed", "encryption", "Encryption operation failed", false, ExitGeneral},
    ErrDecryptFailed:     {12004, "ErrDecryptFailed", "encryption", "Decryption operation failed", false, ExitGeneral},
    ErrDecryptCorrupted:  {12005, "ErrDecryptCorrupted", "encryption", "Ciphertext appears corrupted", false, ExitGeneral},
}
```

---

### AppError Implementation

```go
// pkg/errors/app_error.go

package errors

import (
    "encoding/json"
    "fmt"
)

// AppError represents a structured application error
type AppError struct {
    Code      ErrorCode
    Constant  string
    Domain    string
    Message   string
    Details   string `json:",omitempty"`
    Retryable bool
    ExitCode  int
    Wrapped   error  `json:"-"` // EXEMPTED: AppError internal cause (I-2)
}

// Error implements the error interface
func (e *AppError) Error() string {
    if e.Details != "" {
        return fmt.Sprintf("[%d] %s: %s - %s", e.Code, e.Constant, e.Message, e.Details)
    }
    return fmt.Sprintf("[%d] %s: %s", e.Code, e.Constant, e.Message)
}

// Unwrap returns the wrapped error for errors.Is/As support
func (e *AppError) Unwrap() error {
    return e.Wrapped
}

// JSON returns the error as a JSON string
func (e *AppError) JSON() string {
    data, _ := json.Marshal(e)
    return string(data)
}

// NewError creates a new AppError from an error code
func NewError(code ErrorCode, details string) *AppError {
    meta, ok := Registry[code]
    if !ok {
        meta = ErrorMetadata{
            Code:      code,
            Constant:  "ErrUnknown",
            Domain:    "unknown",
            Message:   "Unknown error",
            Retryable: false,
            ExitCode:  ExitGeneral,
        }
    }
    
    return &AppError{
        Code:      code,
        Constant:  meta.Constant,
        Domain:    meta.Domain,
        Message:   meta.Message,
        Details:   details,
        Retryable: meta.Retryable,
        ExitCode:  meta.ExitCode,
    }
}

// WrapError wraps an existing error with an AppError
func WrapError(code ErrorCode, details string, wrapped error) *AppError {
    appErr := NewError(code, details)
    appErr.Wrapped = wrapped
    return appErr
}

// IsRetryable checks if an error is retryable
func IsRetryable(err error) bool {
    var appErr *AppError
    if errors.As(err, &appErr) {
        return appErr.Retryable
    }
    return false
}

// GetExitCode extracts the exit code from an error
func GetExitCode(err error) int {
    var appErr *AppError
    if errors.As(err, &appErr) {
        return appErr.ExitCode
    }
    return ExitGeneral
}

// GetDomain extracts the domain from an error
func GetDomain(err error) string {
    var appErr *AppError
    if errors.As(err, &appErr) {
        return appErr.Domain
    }
    return "unknown"
}
```

---

### Usage Examples

#### Creating Errors

```go
package main

import (
    "fmt"
    "gsearch/pkg/errors"
)

func validateQuery(query string) error {
    if query == "" {
        return errors.NewError(errors.ErrInvalidQuery, "query parameter is empty")
    }
    return nil
}

func executeSearch(query string) error {
    // Simulate a rate limit
    return errors.WrapError(
        errors.ErrRateLimited,
        "Google API returned 429",
        appfault.New(
            ErrHttpRateLimited,
            "http: 429 Too Many Requests",
        ),
    )
}

func main() {
    err := validateQuery("")
    if err != nil {
        appErr := err.(*errors.AppError)
        fmt.Printf("Error: %s\n", appErr.Error())
        fmt.Printf("Retryable: %t\n", appErr.Retryable)
        fmt.Printf("Exit Code: %d\n", appErr.ExitCode)
    }
}
```

#### CLI Exit Code Handling

```go
func main() {
    if err := run(); err != nil {
        exitCode := errors.GetExitCode(err)
        
        // Log error
        log.Error().
            Int("code", int(err.(*errors.AppError).Code)).
            Str("constant", err.(*errors.AppError).Constant).
            Str("domain", err.(*errors.AppError).Domain).
            Msg(err.Error())
        
        os.Exit(exitCode)
    }
    os.Exit(errors.ExitSuccess)
}
```

#### Retry Logic

```go
func executeWithRetry(context stdctx.Context, fn func() error, maxAttempts int) error {
    var lastErr error
    
    for attempt := 1; attempt <= maxAttempts; attempt++ {
        lastErr = fn()
        if lastErr == nil {
            return nil
        }
        
        if errors.IsTerminal(lastErr) {
            return lastErr
        }
        
        // Calculate backoff delay
        delay := calculateBackoff(attempt)
        
        select {
        case <-context.Done():
            return context.Err()
        case <-time.After(delay):
            continue
        }
    }
    
    return lastErr
}
```

---

## Error Handling Best Practices

### 1. Always Use Constants

```go
// ✓ Correct - uses constant
return errors.NewError(errors.ErrDbQueryFailed, "SELECT failed")

// ✗ Incorrect - magic number
return &AppError{Code: 3006, Message: "query failed"}
```

### 2. Include Contextual Details

```go
// ✓ Correct - includes context
return errors.NewError(errors.ErrInvalidEngine, 
    fmt.Sprintf("engine '%s' not recognized, valid: google, bing, duckduckgo", engine))

// ✗ Incorrect - no context
return errors.NewError(errors.ErrInvalidEngine, "invalid engine")
```

### 3. Wrap Underlying Errors

```go
// ✓ Correct - preserves stack
result, err := db.Query(sql)
if err != nil {
    return errors.WrapError(errors.ErrDbQueryFailed, sql, err)
}

// ✗ Incorrect - loses original error
if err != nil {
    return errors.NewError(errors.ErrDbQueryFailed, "query failed")
}
```

### 4. Check Retryability

```go
// ✓ Correct - respects retryability
if errors.IsRetryable(err) {
    return retry(fn)
}
return err

// ✗ Incorrect - retries non-retryable errors
return retry(fn) // might retry forever on validation errors
```

---

## Error Code Statistics

| Domain | Total Codes | Retryable | Non-Retryable |
|--------|-------------|-----------|---------------|
| Validation | 12 | 0 | 12 |
| Authentication | 9 | 2 | 7 |
| Database | 11 | 5 | 6 |
| Network | 13 | 10 | 3 |
| Blocking | 8 | 3 | 5 |
| CAPTCHA Solving | 17 | 10 | 7 |
| Stealth Scraping | 11 | 3 | 8 |
| Proxy Acquisition | 14 | 6 | 8 |
| Quota | 6 | 2 | 4 |
| Parser | 8 | 5 | 3 |
| Movie Search | 10 | 6 | 4 |
| Cache | 5 | 2 | 3 |
| Export | 5 | 0 | 5 |
| Resource | 5 | 4 | 1 |
| Configuration | 5 | 1 | 4 |
| Encryption | 5 | 0 | 5 |
| **Total** | **144** | **59** | **85** |

---

## Related Specifications

- [CLI Framework](./01-cli-framework.md) - Exit code usage
- [Configuration](./02-configuration.md) - Configuration validation errors
- [Database Schema](./03-database-schema.md) - Database error handling
- [Method Switching](./08-method-switching.md) - Blocking and retry logic
- [CAPTCHA Handling](./63-captcha-handling.md) - CAPTCHA solving errors (50xx)
- [Stealth Scraping](./64-stealth-scraping.md) - Browser evasion errors (52xx)
- [Proxy Acquisition](./65-proxy-acquisition.md) - Proxy management errors (53xx)
- [Remediation Plan](./14-remediation-plan.md) - Phase 5 implementation

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.4.0 | 2026-03-05 | Added proxy acquisition (53xx) error codes |
| 1.3.0 | 2026-03-05 | Added CAPTCHA solving (50xx) and stealth scraping (52xx) error codes |
| 1.2.0 | 2026-01-28 | Added Movie Search error codes (76xx) |
| 1.1.0 | 2026-01-20 | Added encryption errors (12xxx) |
| 1.0.0 | 2026-01-15 | Initial error code registry |
