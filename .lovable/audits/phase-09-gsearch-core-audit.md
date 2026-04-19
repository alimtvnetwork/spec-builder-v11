# Phase 9: GSearch Core (00-23) Audit

**Date:** 2026-02-07  
**Auditor:** AI  
**Scope:** `spec/20-gsearch-cli/` — files 00-overview through 23-platform-search, plus frontend, deploy, extensions  
**Files Reviewed:** 30+  
**Status:** Complete

---

## 1. Inconsistency Report

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-01 | `01-cli-framework.md` lines 65-74 | **`AppState` uses `int` not `byte`.** Declared as `type AppState int` with a flat `String()` method using array literal. Should use `type Variant byte` pattern per `spec/17-enum-specification/` and be located in `internal/enums/app_state/`. | 🔴 Critical |
| I-02 | `01-cli-framework.md` lines 113-122 | **`ShutdownConfig` JSON tags use `camelCase`.** Fields `timeout`, `progressInterval`, `forceExitTimeout` use `json:"timeout"` etc. instead of PascalCase. Same issue in `ResourceConfig` (lines 367-378): `maxGoroutines`, `maxMemoryMB`, `acquisitionTimeout`, `memoryCheckInterval`. | 🔴 Critical |
| I-03 | `02-configuration.md` lines 341-358 | **`Config` struct uses `mapstructure` tags with `camelCase`.** All fields like `mapstructure:"database"`, `mapstructure:"search"` — while mapstructure tags are for config file parsing (acceptable for JSON config keys), the corresponding `json:` tags if present should be PascalCase for API transport. Several sub-structs (e.g., `DatabaseConfig`, `SearchConfig`, `CacheConfig`) have explicit `json:"camelCase"` tags violating the PascalCase mandate. | 🔴 Critical |
| I-04 | `03-database-schema.md` lines 120-128 | **`SearchStatus` uses `string` type.** Declared as `type SearchStatus string` with hardcoded constants (`"pending"`, `"in_progress"`, etc.). Should use `search_status.Variant` byte enum from `58-enum-architecture.md`. | 🔴 Critical |
| I-05 | `03-database-schema.md` lines 280-286 | **`RagFormat` uses `string` type.** Declared as `type RagFormat string` with constants `"json"`, `"yaml"`, `"toml"`. Should use an `output.Variant` or `rag_format.Variant` byte enum. | 🔴 Critical |
| I-06 | `03-database-schema.md` lines 311-316 | **`OAuthProvider` uses `string` type.** Declared as `type OAuthProvider string` with constants `"google"`, `"bing"`. Not listed in `58-enum-architecture.md` — either needs a new enum or should map to `engine.Variant`. | 🟡 Warning |
| I-07 | `03-database-schema.md` lines 130-146 | **GORM model missing `json:` tags.** `SearchRequest` struct has `gorm:` tags but no `json:` tags, which means Go's default PascalCase field names will be used for JSON. This is correct by convention but contradicts the memory standard that says `json:` tags should be omitted unless adding `omitempty`. However, lines 133-134 show `Engine` and `Method` as `string` type instead of enum `Variant` types. | 🟡 Warning |
| I-08 | `08-method-switching.md` lines 130-137 | **`JitterType` uses `string` type.** Declared as `type JitterType string` with 4 constants. Should use `jitter_type.Variant` byte enum. Referenced in `02-configuration.md` line 306 as imported from `gsearch/internal/enums/jitter_type` — but the actual implementation in `08-method-switching.md` still shows string-based type. | 🟡 Warning |
| I-09 | `15-error-codes.md` lines 43-58 | **Internal error code ranges conflict with central registry.** GSearch uses `1xxx`-`12xxx` internally, but the central error code registry (memory) assigns GSearch the range `7000-7099` (general) plus extended ranges `7090-7949`. The internal `1xxx`-`6xxx` and `8xxx`-`12xxx` ranges collide with other CLIs and the general spec `ERR_NXXX` pattern. | 🔴 Critical |
| I-10 | `15-error-codes.md` lines 177-191 | **Movie search errors at `76xx` but overview shows `7600-7605`.** The error codes file defines `7600-7609` for movie search, which is correct per the BI suite, but the main `00-overview.md` only shows ranges up to `7500-7599` (Crawling errors). The overview's error range table is incomplete. | 🟡 Warning |
| I-11 | `16-observability.md` lines 276-282 | **`HealthStatus` uses `string` type.** Declared as `type HealthStatus string` with constants `"healthy"`, `"degraded"`, `"unhealthy"`. Not listed in `58-enum-architecture.md` but should be. The `ComponentStatus` struct (line 267) also uses `json:",omitempty"` but the `Message` field should have explicit PascalCase tags per standard. | 🟡 Warning |
| I-12 | `16-observability.md` line 339 | **`Metadata` field uses `map[string]interface{}`.** The `ComponentStatus.Metadata` field type allows arbitrary untyped data. While acceptable for health check metadata, it violates the "no JSON blobs" standard from the database conventions. Should have typed fields. | 🟠 Minor |
| I-13 | `21-settings-service.md` lines 209-244 | **`ConfigCategory` and `ValueType` use `string` types.** Both are declared as `type ConfigCategory string` and `type ValueType string` with hardcoded constants. Should use byte variant enums. The `58-enum-architecture.md` does not define a `config_category` enum for the settings service. | 🔴 Critical |
| I-14 | `21-settings-service.md` line 170 | **`Setting` model uses `gorm:"primaryKey;size:36"` for `Id`.** The `Id` field should be `gorm:"primaryKey;type:TEXT"` per the database conventions (SQLite uses TEXT, not size-constrained strings). Other fields use `size:255` and `size:500` which are MySQL-style constraints, not SQLite. | 🟡 Warning |
| I-15 | `22-database-architecture.md` lines 64-69 | **SQL schema uses `TEXT` type comments for enum fields.** `ValueType TEXT DEFAULT 'string'` and `Source TEXT DEFAULT 'seed'` should reference `value_type.Variant` and `config_source.Variant` respectively. The comments say "string, int, float, bool, json" but should be enum-backed. | 🟡 Warning |
| I-16 | `22-database-architecture.md` vs `03-database-schema.md` | **Duplicate database schema definitions.** File `03-database-schema.md` defines the original schema with GORM models while `22-database-architecture.md` defines a Split DB schema. Both define a `Settings` table, `SearchRequest` model, and `CacheEntry` model but with different structures. No cross-reference explains which is authoritative. | 🔴 Critical |
| I-17 | `23-movie-search.md` + `23-platform-search.md` | **Dual file numbering collision.** Both files use the prefix `23-`. The folder structure in `00-overview.md` (line 44) only lists `23-platform-search.md` but `01-backend/00-overview.md` (line 40) lists `23-movie-search.md`. This is the same dual-numbering issue flagged in Phase 1 (I-03). | 🔴 Critical |
| I-18 | `04-html-parser.md` lines 91-126 | **`SelectorRegistry` and `EngineSelectors` use `json:"camelCase"` tags.** Fields like `json:"version"`, `json:"updatedAt"`, `json:"engines"`, `json:"results"`, `json:"title"`, etc. all use camelCase. For external config files this may be acceptable, but for API transport the PascalCase mandate applies. | 🟡 Warning |
| I-19 | `04-html-parser.md` lines 400-406 | **`ValidationResult` uses `json:"camelCase"` tags.** Fields `json:"engine"`, `json:"version"`, `json:"valid"`, `json:"errors,omitempty"`, `json:"warnings,omitempty"`, `json:"testedAt"` all use camelCase. | 🟡 Warning |
| I-20 | `07-bing-search.md` lines 130-161 | **`BingSearchResponse` uses `json:"camelCase"` tags.** External API response struct — this is acceptable for external API deserialization but should be documented as an exception. Fields like `json:"_type"`, `json:"originalQuery"`, `json:"totalEstimatedMatches"` are dictated by Bing's API. | 🟠 Minor (external API) |
| I-21 | `06-duckduckgo.md` lines 191-203 | **`InstantAnswer` uses mixed JSON tags.** Fields like `json:"Abstract"` (PascalCase) and `json:"FirstURL"` (PascalCase) — this is correct for DuckDuckGo's API, but `json:"RelatedTopics"` uses PascalCase while the standard says external API structs should be documented as exceptions. | 🟠 Minor |
| I-22 | `10-caching-system.md` lines 291-342 | **Cache queries use raw SQL patterns.** `db.Where("keyword_hash = ?", keyHash)` uses snake_case column name instead of PascalCase `KeywordHash`. Same for `cached_at`, `expires_at`, `is_valid` — all should be `CachedAt`, `ExpiresAt`, `IsValid`. This contradicts the PascalCase column naming standard in `22-database-architecture.md`. | 🔴 Critical |
| I-23 | `09-nested-search.md` lines 371-421 | **Nested search uses raw `db.Create()` and `db.UpdateSearchStatus()` without DBOperation wrapper.** Direct database calls like `s.db.CreateSearchRequest()`, `s.db.SaveResults()`, `s.db.UpdateSearchStatus()` bypass the mandatory `DBOperation` wrapper from the database standards. | 🟡 Warning |
| I-24 | `11-rag-export.md` line 386 | **`s.db.Create(ragMemory).Error` bypasses DBOperation wrapper.** Direct GORM call without the mandatory wrapper. | 🟡 Warning |
| I-25 | `99-consistency-report.md` lines 17-25 | **Consistency report claims 100% on all metrics.** Score of `100/100 Grade: A+` is contradicted by the 25+ issues found in this audit. The consistency report was generated `2026-02-01` but doesn't account for the enum architecture (`58-enum-architecture.md`) or the naming convention violations. | 🟡 Warning |
| I-26 | `00-overview.md` lines 104-113 | **Error range table incomplete.** Shows only `7000-7099` through `7500-7599` but actual ranges extend to `7949` (Provider Integration) per the central error code registry memory. Missing: `7090-7096` (Model Decomp), `7600-7609` (Movie), `7700-7839` (BI), `7840-7899` (Multi-Source/Scheduled/Chrome Extension), `7900-7949` (Enum/Provider). | 🟡 Warning |
| I-27 | `01-cli-framework.md` vs `02-configuration.md` | **`ShutdownConfig` defined twice.** `01-cli-framework.md` (lines 112-122) defines `ShutdownConfig` as a struct in `pkg/app/`, while `02-configuration.md` (lines 353) references the same config as part of the top-level `Config` struct. No import relationship specified. | 🟠 Minor |
| I-28 | `02-configuration.md` lines 50-238 | **Config JSON uses `camelCase` keys throughout.** `maxConnections`, `defaultEngine`, `requestDelay`, `maxConcurrent`, `ttlDays`, `maxEntries`, etc. While the config file itself can use camelCase (since Viper handles mapping), the Go struct JSON tags should be PascalCase for API serialization consistency. | 🟡 Warning |

---

## 2. Missing Acceptance Criteria

Most core files (01-07, 08, 12-13, 15-16, 17-23) lack formal GIVEN/WHEN/THEN acceptance criteria. Files 04 (HTML Parser), 09 (Nested Search), 10 (Caching), and 11 (RAG Export) have table-based AC but not in the E2E-test-ready format.

| File | Has AC? | Format |
|------|---------|--------|
| `01-cli-framework.md` | ❌ | No criteria |
| `02-configuration.md` | ❌ | No criteria |
| `03-database-schema.md` | ❌ | No criteria |
| `04-html-parser.md` | ✅ | Table format (15 criteria), not GIVEN/WHEN/THEN |
| `05-google-api.md` | ❌ | No criteria |
| `06-duckduckgo.md` | ❌ | No criteria |
| `07-bing-search.md` | ❌ | No criteria |
| `08-method-switching.md` | ❌ | No criteria |
| `09-nested-search.md` | ✅ | Table format (16 criteria), not GIVEN/WHEN/THEN |
| `10-caching-system.md` | ✅ | Table format (20 criteria), not GIVEN/WHEN/THEN |
| `11-rag-export.md` | ✅ | Table format (21 criteria), not GIVEN/WHEN/THEN |
| `15-error-codes.md` | ❌ | No criteria |
| `16-observability.md` | ❌ | No criteria |
| `17-full-site-crawler.md` | ❌ | No criteria |
| `18-authority-credibility-scoring.md` | ❌ | No criteria |
| `21-settings-service.md` | ❌ | Method specs but no AC |
| `22-database-architecture.md` | ❌ | No criteria |
| `23-movie-search.md` | ❌ | No criteria |
| `23-platform-search.md` | ❌ | No criteria |

---

## 3. Detailed Acceptance Criteria

### 3.1 CLI Framework (`01-cli-framework.md`)

---

**AC-P9-001: Graceful Shutdown Signal Handling**

GIVEN: The GSearch CLI is running in daemon mode with active search operations

WHEN: A SIGINT or SIGTERM signal is received

THEN:
- The `ShutdownManager` MUST transition state from `Running` → `ShuttingDown` → `Draining` → `Closing` → `Closed`
- The context returned by `Context()` MUST be cancelled immediately on signal receipt
- All in-flight operations tracked via `TrackOperation()` MUST be given up to `config.Timeout` (default 30s) to complete
- Progress MUST be logged at `config.ProgressInterval` (default 5s) intervals showing remaining in-flight operation count
- If a second signal is received during shutdown, the process MUST force-exit immediately with exit code 10
- Cleanup functions registered via `RegisterCleanup()` MUST execute in LIFO (reverse registration) order
- If the `ForceExitTimeout` (default 45s) elapses, the process MUST terminate via `os.Exit(10)`

EDGE CASES:
- If `initiateShutdown()` is called while already shutting down, it MUST be a no-op (via `CompareAndSwap`)
- If a cleanup function itself panics, the remaining cleanup functions MUST still execute
- If no operations are in-flight at signal time, shutdown MUST complete in <1 second

---

**AC-P9-002: Resource Limiter Memory Protection**

GIVEN: The `ResourceLimiter` is configured with `MaxMemoryMB` and `MaxGoroutines`

WHEN: An `Acquire()` call is made

THEN:
- The limiter MUST check current memory usage via `runtime.ReadMemStats()` before granting a slot
- If `Alloc` exceeds `MaxMemoryMB`, `runtime.GC()` MUST be triggered
- If memory still exceeds the limit after GC, `ErrResourceMemory` (code 10003) MUST be returned
- If the goroutine semaphore is full, `Acquire()` MUST block until `config.AcquisitionTimeout` (default 10s)
- If timeout elapses, `ErrResourceTimeout` (code 10001) MUST be returned
- `Release()` MUST decrement both the semaphore and the `activeCount` metric
- `TryAcquire()` MUST return `false` immediately if no slots are available (non-blocking)

EDGE CASES:
- If `Release()` is called without a matching `Acquire()`, a warning MUST be logged but no panic
- Memory check overhead MUST be <1ms per call

---

### 3.2 Configuration (`02-configuration.md`)

---

**AC-P9-003: Duration Dual-Format Parsing**

GIVEN: A configuration value can be either a string duration (`"2s"`, `"500ms"`) or a numeric millisecond value (`2000`)

WHEN: The `Duration.UnmarshalJSON()` method deserializes the value

THEN:
- String values MUST be parsed via `time.ParseDuration()` supporting: `ns`, `us`, `ms`, `s`, `m`, `h`
- Numeric values (JSON `float64`) MUST be interpreted as milliseconds
- Invalid string formats (e.g., `"2x"`) MUST return a descriptive error
- Invalid types (e.g., JSON boolean, array) MUST return `"invalid duration type: %T"` error
- `MarshalJSON()` MUST always output the string format (e.g., `"2s"`) regardless of how it was input

EDGE CASES:
- Negative durations MUST be accepted (Go's `time.ParseDuration` allows them) but SHOULD be validated at config load
- Zero duration (`"0s"` or `0`) MUST be valid and represent no delay
- Very large values (>24h) MUST be accepted without overflow

---

**AC-P9-004: Method Weight Validation**

GIVEN: The `search.methodWeights` configuration contains weight values for each search engine

WHEN: Configuration is loaded and validated

THEN:
- All weight values MUST be `float64` in the range `[0.0, 1.0]`
- The sum of all weights MUST equal `1.0` within ±0.001 tolerance
- A weight value < 0.0 MUST trigger `ErrInvalidWeightRange` (code 1008)
- A weight value > 1.0 MUST trigger `ErrInvalidWeightRange` (code 1008)
- A weight sum not equal to 1.0 (±0.001) MUST trigger `ErrInvalidWeightSum` (code 1009)
- Weights for unavailable engines (e.g., Bing without API key) MUST be redistributed proportionally among available engines

EDGE CASES:
- If all engines have weight 0.0, `ErrAllMethodsBlocked` MUST be returned
- If only one engine is available, its weight MUST be implicitly set to 1.0 regardless of config

---

### 3.3 Database Schema (`03-database-schema.md`)

---

**AC-P9-005: OAuth Token Encryption Lifecycle**

GIVEN: An OAuth token is stored with AES-256-GCM encryption

WHEN: The token is encrypted, stored, retrieved, and decrypted

THEN:
- The encryption key MUST be sourced from `GSEARCH_TOKEN_KEY` environment variable as a 64-character hex string (32 bytes)
- `Encrypt()` MUST generate a unique 12-byte nonce via `crypto/rand` for each call
- The ciphertext MUST be prepended with the nonce and base64-encoded for storage
- `Decrypt()` MUST extract the nonce from the first 12 bytes of the decoded ciphertext
- Empty string inputs to `Encrypt()`/`Decrypt()` MUST return empty string (no-op)
- `NeedsRefresh()` MUST return `true` when the token expires within 5 minutes
- `IsExpired()` MUST return `true` when current time is after `ExpiresAt`

EDGE CASES:
- If `GSEARCH_TOKEN_KEY` is missing, `ErrEncryptKeyMissing` (code 12001) MUST be returned
- If the key is not exactly 64 hex characters, `ErrEncryptKeyInvalid` (code 12002) MUST be returned
- If the ciphertext is tampered with (authentication tag mismatch), `ErrDecryptFailed` (code 12004) MUST be returned
- If the base64 encoding is invalid, `ErrDecryptCorrupted` (code 12005) MUST be returned

---

### 3.4 Search Engines (`05-google-api.md`, `06-duckduckgo.md`, `07-bing-search.md`)

---

**AC-P9-006: Quota Tracker Daily Reset**

GIVEN: A `QuotaTracker` is initialized with a `dailyLimit` (e.g., 100 for Google, 1000 for Bing)

WHEN: API requests are made throughout the day

THEN:
- `CanMakeRequest()` MUST return `true` when `used < dailyLimit`
- `RecordRequest()` MUST increment the `used` counter atomically (mutex-protected)
- After `MarkExhausted()`, `IsExhausted()` MUST return `true` until reset
- When `time.Now()` passes midnight UTC, the counter MUST auto-reset to 0
- The `resetTime` MUST be recalculated to the next midnight UTC after each reset

EDGE CASES:
- Concurrent calls to `RecordRequest()` MUST not cause a data race (mutex protection)
- If the system clock jumps backward (NTP adjustment), the quota MUST NOT reset early
- If `dailyLimit` is 0, `CanMakeRequest()` MUST always return `false`

---

**AC-P9-007: DuckDuckGo URL Extraction**

GIVEN: DuckDuckGo wraps result URLs in redirect format `//duckduckgo.com/l/?uddg=...`

WHEN: `extractActualURL()` processes a redirect URL

THEN:
- The `uddg` query parameter MUST be URL-decoded to extract the actual destination URL
- If the URL starts with `//` (protocol-relative), `https:` MUST be prepended
- If the URL is already a direct URL (no redirect wrapper), it MUST be returned as-is
- If URL parsing fails, the original URL MUST be returned unmodified

EDGE CASES:
- Double-encoded URLs (`%2520` instead of `%20`) MUST be handled with a single decode pass
- URLs containing special characters (query strings, fragments) MUST be preserved after extraction

---

### 3.5 Method Switching (`08-method-switching.md`)

---

**AC-P9-008: Exponential Backoff with Jitter**

GIVEN: A `Backoff` instance is configured with `InitialDelay=1s`, `Multiplier=2.0`, `MaxDelay=60s`, `Jitter=0.2`, `JitterType=bounded`

WHEN: `NextDelay()` is called for successive retry attempts

THEN:
- Attempt 0: base delay = 1s, final delay in range [0.8s, 1.2s] (±20% bounded jitter)
- Attempt 1: base delay = 2s, final delay in range [1.6s, 2.4s]
- Attempt 2: base delay = 4s, final delay in range [3.2s, 4.8s]
- Attempt 3: base delay = 8s, final delay in range [6.4s, 9.6s]
- Attempt 6+: base delay capped at 60s, final delay in range [48s, 60s] (capped at MaxDelay)
- `ShouldRetry()` MUST return `false` after `MaxAttempts` (default 5) attempts
- After a successful operation, `Reset()` MUST return the attempt counter to 0

EDGE CASES:
- `JitterType=full`: delay MUST be in range [0, baseDelay]
- `JitterType=equal`: delay MUST be in range [baseDelay/2, baseDelay]
- `JitterType=decorrelated`: delay MUST be in range [InitialDelay, 3×previousDelay] capped at MaxDelay
- Negative delay (mathematically impossible with bounded, but defensive): MUST be clamped to 0

---

### 3.6 Caching System (`10-caching-system.md`)

---

**AC-P9-009: Cache Key Determinism**

GIVEN: A cache key is generated from keywords and engine name

WHEN: `GenerateKey("AI tools", "google")` is called multiple times

THEN:
- The key MUST be identical for every call with the same inputs
- Keywords MUST be normalized: lowercased, split into words, sorted alphabetically, re-joined
- Therefore `GenerateKey("AI tools", "google")` = `GenerateKey("tools AI", "google")` = `GenerateKey("TOOLS ai", "google")`
- The key MUST be the first 16 bytes (32 hex characters) of the SHA-256 hash of `"{normalized}|{engine}"`
- Different engines with the same keywords MUST produce different keys

EDGE CASES:
- Extra whitespace in keywords MUST be normalized (trimmed and collapsed)
- Empty keywords MUST produce a valid (but useless) hash, not an error
- Unicode keywords MUST be lowercased using `strings.ToLower()` (locale-independent)

---

### 3.7 RAG Export (`11-rag-export.md`)

---

**AC-P9-010: Text Chunking with Sentence Boundaries**

GIVEN: A text chunker is configured with `chunkSize=500` tokens and `overlap=50` tokens

WHEN: A document of 1500 tokens is chunked

THEN:
- Each chunk MUST contain ≤ `chunkSize` tokens (500)
- Chunks MUST break at sentence boundaries (`.`, `!`, `?` followed by whitespace)
- Each chunk's `TokenCount` MUST reflect the estimated token count (≈ `len(text) / 4`)
- Token estimation MUST be within ±20% of actual tokenizer output for English text
- Chunk `Position` MUST be monotonically increasing starting from 0
- Each chunk MUST be attributed to its `SourceID`

EDGE CASES:
- A single sentence longer than `chunkSize` tokens MUST be its own chunk (no split mid-sentence)
- Text with no sentence-ending punctuation MUST be chunked at word boundaries using the size limit
- Empty text input MUST produce zero chunks, not an error

---

### 3.8 Observability (`16-observability.md`)

---

**AC-P9-011: Health Check Aggregation**

GIVEN: The health endpoint runs checks on database, cache, engines, and disk

WHEN: `GET /health/ready` is called

THEN:
- The response MUST include overall `Status` as the worst status among all components
- If any component is `unhealthy`, overall status MUST be `unhealthy` with HTTP 503
- If any component is `degraded` but none `unhealthy`, overall status MUST be `degraded` with HTTP 200
- If all components are `healthy`, overall status MUST be `healthy` with HTTP 200
- Each component MUST include `Name`, `Status`, `Latency`, and `CheckedAt`
- The health check MUST complete within `config.health.timeout` (default 5s)
- `GET /health/live` MUST always return `200 OK` if the process is running (no component checks)

EDGE CASES:
- If a component check itself times out, that component MUST be marked `unhealthy`
- If disk space is below `diskMinFreeMB` (default 100MB), disk component MUST be `degraded`
- `GET /health` (without `/ready` or `/live`) MUST return a simple 200/503 based on overall status

---

### 3.9 Settings Service (`21-settings-service.md`)

---

**AC-P9-012: Version-Gated Seeding**

GIVEN: A seed file with `version: "1.2.0"` for category `"search_settings"` exists

WHEN: `SeedFromFile()` is called

THEN:
- If no settings exist for the category, ALL values MUST be seeded
- If existing version matches `"1.2.0"`, seeding MUST be skipped (no-op) to preserve user modifications
- If existing version is older (e.g., `"1.1.0"`), ALL values MUST be re-seeded with the new version
- For re-seeded values, `DefaultValue` MUST be updated to the new seed value
- User-modified values (`IsUserModified = true`) MUST be overwritten during re-seeding (version upgrade takes priority)
- The category version stored in DB MUST be updated to `"1.2.0"` after successful seeding

EDGE CASES:
- If the seed file contains invalid JSON, `ErrSeedFileInvalid` MUST be returned without modifying any existing values
- If the database is locked during seeding, the operation MUST retry with backoff up to 3 times
- If `ForceReseed()` is called, seeding MUST occur regardless of version match

---

### 3.10 Database Architecture (`22-database-architecture.md`)

---

**AC-P9-013: Split DB Registry Consistency**

GIVEN: The Root DB (`data/gsearch.db`) contains a `DbRegistry` table tracking all child databases

WHEN: A new cache database is created for a search operation

THEN:
- A unique sequential number MUST be obtained from the `Counters` table (category `"cache"`)
- The cache DB path MUST follow the pattern `data/searches/cache/{seq}-{slug}-{hash}.db`
- A `DbRegistry` row MUST be created with `Path`, `Category` (`"cache"`), `CreatedAt`, and `SizeBytes`
- The `IsActive` flag MUST be set to `true`
- All operations MUST use the `DBOperation` wrapper for stack trace capture

EDGE CASES:
- If the cache DB file already exists (from a previous crashed operation), it MUST be overwritten
- If the `Counters` table returns a duplicate sequence number (concurrent access), the insert MUST retry with the next sequence
- `SizeBytes` MUST be updated after database operations complete, not at creation time

---

### 3.11 Platform Search (`23-platform-search.md`)

---

**AC-P9-014: YouTube Deep Extraction**

GIVEN: A YouTube video URL is provided with deep extraction enabled

WHEN: The `YouTubeDeepExtractor` processes the video

THEN:
- The extractor MUST retrieve: video title, description, channel name, view count, like count, publish date, duration, thumbnail URL
- If `IncludeTranscript` is `true`, the video transcript MUST be fetched (requires `YouTubeAuthConfig`)
- If `IncludeExternalUrls` is `true`, URLs in the description MUST be extracted and validated
- Parallel batch extraction of multiple videos MUST respect the configured `RequestDelay` between API calls
- If transcript extraction fails, the error MUST be logged as `7608` (Platform Transcript Extraction Failed) but the remaining metadata MUST still be returned

EDGE CASES:
- If the video is private or age-restricted, `7607` (Platform Extraction Failed) MUST be returned
- If the YouTube API key quota is exhausted, the extractor MUST fall back to HTML scraping (if available)
- If `YouTubeAuthConfig` session cookies are expired, `7609` (Platform Auth Failed) MUST be returned

---

### 3.12 Movie Search (`23-movie-search.md`)

---

**AC-P9-015: Filename Normalization Pipeline**

GIVEN: A release-format filename like `"Fallout.2024.S02E03.1080p.x265-ELiTE"`

WHEN: The normalization pipeline processes the filename

THEN:
- Step 1: Dots and underscores MUST be replaced with spaces
- Step 2: Content type detection MUST identify `S\d{1,2}E\d{1,2}` as TV Episode
- Step 3: Title MUST be extracted as text before the year/season pattern: `"Fallout"`
- Step 4: Year MUST be extracted: `2024`, Season: `2`, Episode: `3`
- Quality markers (`1080p`, `x265`, release group `-ELiTE`) MUST be stripped from the search query
- The API search query MUST be the cleaned title only: `"Fallout"`

EDGE CASES:
- Filenames with no year or season patterns MUST be searched as both movie and TV show
- Year-only filenames (e.g., `"Movie.2024.1080p"`) MUST be typed as Movie
- Filenames with multiple years (e.g., `"Movie.2024.2025"`) MUST use the first year as production year
- Normalization tokens (quality markers, release group patterns) MUST be loaded from seedable config, not hardcoded

---

**AC-P9-016: Multi-Source API Search with Key Rotation**

GIVEN: TMDB and OMDB APIs are configured with multiple API keys each

WHEN: A movie search is executed

THEN:
- API keys MUST be rotated per `rotation_strategy.Variant` (RoundRobin, Random, or LeastUsed)
- Each key's daily usage MUST be tracked in the `ApiKeyUsage` table
- When a key exceeds its `dailyLimit` (default 1000), the next key MUST be selected
- If ALL keys for a provider are exhausted, `ErrMovieApiKeyExhausted` (code 7609) MUST be returned
- TMDB results MUST be merged with OMDB results, with TMDB taking priority for conflicting fields
- IMDB scraping MUST be used as a fallback only when both APIs fail or return no results

EDGE CASES:
- If API keys are stored in environment variables (`TMDB_API_KEY_1`), they MUST be resolved at startup
- If a key returns HTTP 401 (invalid), it MUST be permanently marked as invalid (not just exhausted)
- Rate limiting (HTTP 429) MUST trigger `ErrMovieRateLimited` (7608) and retry with exponential backoff

---

## 4. Key Remediation Actions

### Priority 1: Critical Fixes

| # | Action | Files Affected |
|---|--------|----------------|
| R-01 | Convert all string-based enums (`SearchStatus`, `RagFormat`, `OAuthProvider`, `JitterType`, `HealthStatus`, `ConfigCategory`, `ValueType`, `AppState`) to byte variant pattern | `03-database-schema.md`, `08-method-switching.md`, `16-observability.md`, `21-settings-service.md`, `01-cli-framework.md` |
| R-02 | Resolve internal error code ranges (1xxx-12xxx) conflict with central registry | `15-error-codes.md` |
| R-03 | Resolve `23-` dual numbering collision | `23-movie-search.md` → rename to `24-movie-search.md` |
| R-04 | Resolve duplicate schema definitions between `03-database-schema.md` and `22-database-architecture.md` | Mark `22-database-architecture.md` as authoritative, add deprecation note to `03-database-schema.md` |
| R-05 | Fix snake_case column names in cache queries | `10-caching-system.md` |

### Priority 2: Naming Convention Fixes

| # | Action | Files Affected |
|---|--------|----------------|
| R-06 | Convert `ShutdownConfig`, `ResourceConfig` JSON tags to PascalCase | `01-cli-framework.md` |
| R-07 | Convert `SelectorRegistry`, `ValidationResult` JSON tags to PascalCase | `04-html-parser.md` |
| R-08 | Convert `Setting` model GORM size constraints to SQLite `type:TEXT` | `21-settings-service.md` |

### Priority 3: Missing Items

| # | Action | Files Affected |
|---|--------|----------------|
| R-09 | Add `config_category` and `value_type` enums to `58-enum-architecture.md` | `58-enum-architecture.md` |
| R-10 | Add `oauth_provider` or map to `engine.Variant` in enum architecture | `58-enum-architecture.md` |
| R-11 | Add `app_state` and `health_status` enums to `58-enum-architecture.md` | `58-enum-architecture.md` |
| R-12 | Update `00-overview.md` error range table to include all ranges through 7949 | `00-overview.md` |
| R-13 | Convert table-format ACs in 04, 09, 10, 11 to GIVEN/WHEN/THEN format | `04-html-parser.md`, `09-nested-search.md`, `10-caching-system.md`, `11-rag-export.md` |
| R-14 | Wrap all direct DB calls with `DBOperation` wrapper | `09-nested-search.md`, `11-rag-export.md`, `10-caching-system.md` |

---

## 5. Cross-References

| Resource | Location |
|----------|----------|
| Enum Specification | `spec/17-enum-specification/` |
| GSearch Enum Architecture | `spec/20-gsearch-cli/01-backend/58-enum-architecture.md` |
| Split DB Architecture | `spec/06-split-db-architecture/` |
| Central Error Registry | `spec/03-error-code-registry/` |
| Database Naming Standard | `.lovable/memories/training/09-database-naming-conventions.md` |
| DBOperation Wrapper | `spec/11-spec-management-software/13-shared-packages/06-pkg-database-operations.md` |

---

*Phase 9: GSearch Core audit completed. 28 inconsistencies found (9 critical, 12 warnings, 7 minor). 16 acceptance criteria generated.*
