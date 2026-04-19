# GSearch CLI — Deep Technical Audit Report

**Version:** 1.0.0  
**Created:** 2026-03-04  
**Auditor:** AI Compliance System  
**Scope:** Specifications in `spec/20-gsearch-cli/` — SERP scraping, caching, YouTube/SRT, coding guideline compliance  
**Standards Reference:** `spec/02-coding-guidelines/01-cross-language/00-master-coding-guidelines.md`

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Files Audited** | 7 spec files |
| **Total Issues Found** | 23 |
| **🔴 Critical** | 4 |
| **🟠 High** | 8 |
| **🟡 Medium** | 7 |
| **🟢 Low** | 4 |

---

## Issue Index

| # | Severity | File | Rule Violated | Summary |
|---|----------|------|---------------|---------|
| 1 | 🔴 | 23-platform-search.md | §6 Go Error Handling | `getTranscript` return signature mismatch |
| 2 | 🔴 | 23-platform-search.md | §6 Go Error Handling | `fmt.Errorf` used instead of `apperror.Wrap` (5 instances) |
| 3 | 🔴 | 23-platform-search.md | §6.1 / §7.1 | Service methods return `(T, error)` instead of `apperror.Result[T]` (6 methods) |
| 4 | 🔴 | 05-google-api.md | §6 / §7.1 | `Search` and `handleError` return raw `error` not `*apperror.AppError` |
| 5 | 🟠 | 44-serp-position-tracking.md | §4.2 Go Enum variantLabels | `ResultType` constants use `snake_case` strings |
| 6 | 🟠 | 44-serp-position-tracking.md | §4.2 Go Enum variantLabels | `TrendDirection` constants use lowercase strings |
| 7 | 🟠 | 44-serp-position-tracking.md | §4.2 Go Enum variantLabels | `DeviceType` constants use lowercase (no protocol exemption declared) |
| 8 | 🟠 | 23-platform-search.md | §2 DB Naming — Abbreviations | `URL TEXT` column should be `Url` |
| 9 | 🟠 | 04-html-parser.md | §1.1 Naming Consistency | Struct `HTMLParser` vs receiver `HtmlParser` — internally inconsistent |
| 10 | 🟠 | 10-caching-system.md + 23 + 47 | Architecture | Three incompatible caching implementations |
| 11 | 🟠 | 23-platform-search.md | §7.2 Zero Type Assertions | Raw `cached.([]YouTubeResult)` type assertions — self-granted exemptions |
| 12 | 🟠 | 00-overview.md | Error Code Registry | Overview error range (7000-7599) doesn't cover 7600-7609 or 7800-7839 |
| 13 | 🟡 | 47-response-formatting-caching.md | §3 Boolean P1 | `Immutable bool` → should be `IsImmutable` |
| 14 | 🟡 | 10-caching-system.md | §3 Boolean P1 | `FromCache bool` → should be `IsFromCache` |
| 15 | 🟡 | 47-response-formatting-caching.md | §3 Boolean P1 | `FlattenNested bool`, `IncludeMeta bool`, `PrettyPrint bool` — missing prefixes |
| 16 | 🟡 | 23-platform-search.md | §3 Boolean P1 | `IncludeNsfw bool` → `shouldIncludeNsfw`; `IncludeComments` → similar |
| 17 | 🟡 | 04-html-parser.md + 08 | §5 R6 | Multiple functions exceed 15-line body limit |
| 18 | 🟡 | 23-platform-search.md | Functional Gap | `YouTubeResult.PublishedAt` never populated in `Search()` |
| 19 | 🟡 | 23-platform-search.md | Functional Gap | No rating/view-count-first sorting strategy for YouTube |
| 20 | 🟢 | 05-google-api.md | §1.2 Abbreviations | `apiKey`, `cx` field names fine (unexported), but JSON config uses `camelCase` keys |
| 21 | 🟢 | 23-platform-search.md | httpmethod enum | Inconsistent `httpmethod.Get.String()` usage — only in Reddit, not YouTube |
| 22 | 🟢 | 04-html-parser.md | §3 Boolean P3 | `if !seen[u]` — minor negation, could use map-based guard |
| 23 | 🟢 | 10-caching-system.md | §6 | `log.Printf` used instead of structured `zerolog` logging in cleanup |

---

## Detailed Findings

### 🔴 CRITICAL

---

#### Issue #1 — `getTranscript` Return Signature Mismatch

**File:** `spec/20-gsearch-cli/01-backend/23-platform-search.md` (line 864)  
**Rule:** §6 Go Error Handling, §7.1 Result Pattern

The function signature declares:
```go
func (e *YouTubeDeepExtractor) getTranscript(videoId string) apperror.Result[*TranscriptResult]
```

But the implementation body returns **three values**:
```go
return \"\", nil, err         // line 875
return \"\", nil, fmt.Errorf(...)  // line 884
return transcript, languages, nil  // line 899
```

This is a **compilation-breaking** inconsistency — `apperror.Result[T]` is a two-value return `(T, *apperror.AppError)`, not a triple.

**Remediation:** Either:
- (A) Change return to `apperror.Result[*TranscriptResult]` and return a `*TranscriptResult` struct containing both transcript and languages, OR
- (B) Return `(*TranscriptData, *apperror.AppError)` with a struct wrapping both fields

```go
// ✅ Recommended fix
type TranscriptData struct {
    Text      string
    Languages []string
}

func (e *YouTubeDeepExtractor) getTranscript(videoId string) apperror.Result[*TranscriptData] {
    // ...
    return &TranscriptData{Text: transcript, Languages: languages}, nil
}
```

---

#### Issue #2 — `fmt.Errorf` Used Instead of `apperror.Wrap`

**File:** `spec/20-gsearch-cli/01-backend/23-platform-search.md`  
**Rule:** §6 — \"Never use `fmt.Errorf()` for service errors\"

5 instances found:

| Line | Code |
|------|------|
| 189 | `fmt.Errorf(\"failed to create YouTube client: %w\", err)` |
| 633 | `fmt.Errorf(\"Medium search failed: %w\", err)` |
| 728 | `fmt.Errorf(\"LinkedIn post search failed: %w\", err)` |
| 753 | `fmt.Errorf(\"LinkedIn company search failed: %w\", err)` |
| 804 | `fmt.Errorf(\"invalid YouTube URL: %s\", videoUrl)` |

**Remediation:** Replace all with `apperror.Wrap()` or `apperror.New()` using the appropriate platform error codes (7600-7609).

```go
// ❌ Current
return nil, fmt.Errorf("failed to create YouTube client: %w", err)

// ✅ Required
return apperror.Fail[*YouTubeSearchService](
    apperror.Wrap(errors.ErrPlatformConfigInvalid, "create YouTube client", err),
)
```

---

#### Issue #3 — Service Methods Return `(T, error)` Instead of `apperror.Result[T]`

**File:** `spec/20-gsearch-cli/01-backend/23-platform-search.md`  
**Rule:** §6 — \"Service methods return `apperror.Result[T]` — never raw `(T, error)`\"

6 methods violating:

| Method | Current Return |
|--------|---------------|
| `YouTubeSearchService.Search` | `([]YouTubeResult, error)` |
| `RedditSearchService.Search` | `([]RedditResult, error)` |
| `MediumSearchService.Search` | `([]MediumResult, error)` |
| `LinkedInSearchService.SearchPosts` | `([]LinkedInPostResult, error)` |
| `LinkedInSearchService.SearchCompanies` | `([]LinkedInCompanyResult, error)` |
| `YouTubeDeepExtractor.ExtractVideo` | `(*YouTubeResult, error)` |

**Note:** The Reddit service **partially** complies — the `http.NewRequest` block (lines 336-343) uses `apperror.Fail` correctly, but the rest of the function returns raw `error`.

**Remediation:** All service methods must return `apperror.Result[T]`.

---

#### Issue #4 — Google API Module Returns Raw `error`

**File:** `spec/20-gsearch-cli/01-backend/05-google-api.md`  
**Rule:** §6 / §7.1

- `GoogleCustomSearch.Search()` returns `([]Result, error)`
- `handleError()` returns `error` (line 117)
- Error types `QuotaExhaustedError`, `BlockedError`, `NetworkError` are custom structs instead of `*apperror.AppError`

**Remediation:** Migrate to `apperror.Result[[]Result]` and replace custom error types with error code constants.

---

### 🟠 HIGH

---

#### Issue #5 — `ResultType` Constants Use `snake_case` Strings

**File:** `spec/20-gsearch-cli/01-backend/44-serp-position-tracking.md` (line 194-204)  
**Rule:** §4.2 — Go enum `variantLabels` must use PascalCase strings

```go
// ❌ Current
ResultFeaturedSnippet ResultType = "featured_snippet"
ResultKnowledgePanel  ResultType = "knowledge_panel"
ResultLocalPack       ResultType = "local_pack"
ResultImagePack       ResultType = "image_pack"
ResultVideoPack       ResultType = "video_pack"

// ✅ Required (unless declared as protocol exemption)
ResultFeaturedSnippet ResultType = "FeaturedSnippet"
ResultKnowledgePanel  ResultType = "KnowledgePanel"
ResultLocalPack       ResultType = "LocalPack"
```

If these are wire-protocol values, they need explicit protocol exemption annotation per §4.2.

---

#### Issue #6 — `TrendDirection` Constants Use Lowercase

**File:** `spec/20-gsearch-cli/01-backend/44-serp-position-tracking.md` (line 285-289)

```go
// ❌ Current
TrendUp     TrendDirection = "up"
TrendDown   TrendDirection = "down"
TrendStable TrendDirection = "stable"

// ✅ Required
TrendUp     TrendDirection = "Up"
TrendDown   TrendDirection = "Down"
TrendStable TrendDirection = "Stable"
```

---

#### Issue #7 — `DeviceType` Constants Use Lowercase Without Exemption

**File:** `spec/20-gsearch-cli/01-backend/44-serp-position-tracking.md` (line 148-152)

```go
DeviceDesktop DeviceType = "desktop"  // Should be "Desktop" or protocol-exempt
DeviceMobile  DeviceType = "mobile"
DeviceTablet  DeviceType = "tablet"
```

No protocol exemption declared.

---

#### Issue #8 — Database Column `URL` Should Be `Url`

**File:** `spec/20-gsearch-cli/01-backend/23-platform-search.md` (line 516)

```sql
-- ❌ Current
URL TEXT NOT NULL,

-- ✅ Required per §1.2 abbreviation standard
Url TEXT NOT NULL,
```

---

#### Issue #9 — Struct Name vs Receiver Inconsistency (`HTMLParser` / `HtmlParser`)

**File:** `spec/20-gsearch-cli/01-backend/04-html-parser.md`

The struct is defined as `HTMLParser` (line 668) but per §1.2 abbreviation rules, `HTML` should be `Html`. Meanwhile, the receiver methods use `HtmlParser` (line 693-696), which IS correct per conventions — but contradicts the struct definition.

```go
// Line 668: Struct definition
type HTMLParser struct { ... }  // ❌ Should be HtmlParser

// Lines 693-696: Receiver methods
func (p *HtmlParser) Id() string { ... }  // ✅ Correct per §1.2
```

**Conflict**: The struct and its methods disagree on the type name. This would be a compile error in real Go code.

**Remediation:** Rename struct to `HtmlParser` throughout.

---

#### Issue #10 — Three Incompatible Caching Implementations

**Files:**
- `10-caching-system.md` — `CacheService` with DB-backed SHA-256 key storage
- `23-platform-search.md` — `NewCacheService(\"youtube\")` with string parameter (different constructor)
- `47-response-formatting-caching.md` — `CacheManager` with gzip compression, session DBs, TTL policies

These are three distinct caching systems with different:
- Key generation strategies
- Storage backends (single DB vs session DBs)
- Constructor signatures (`NewCacheService(db, cfg)` vs `NewCacheService(\"youtube\")`)
- Compression (none vs gzip)
- TTL mechanisms (expireDays vs TTL policies)

**Impact:** Implementation ambiguity — a developer would not know which caching pattern to follow.

**Remediation:** Consolidate into a single `CacheManager` spec with platform-specific TTL policies, or explicitly document the architectural relationship between the three.

---

#### Issue #11 — Self-Granted Type Assertion Exemptions

**File:** `spec/20-gsearch-cli/01-backend/23-platform-search.md`

4 instances of `cached.([]T)` type assertions with self-granted exemptions:

```go
// EXEMPTED: typed accessor internal — cache stores known []YouTubeResult values (§7.2)
if cached, ok := s.cache.Get(cacheKey); ok {
    return cached.([]YouTubeResult), nil
}
```

§7.2 states \"Zero type assertions in business logic.\" The exemption comments reference §7.2 but don't follow a formal exemption process. The real fix is making the cache generic:

```go
// ✅ Generic cache eliminates type assertions entirely
type TypedCache[T any] struct { ... }
func (c *TypedCache[T]) Get(key string) (T, bool) { ... }
```

---

#### Issue #12 — Error Code Range Mismatch in Overview

**File:** `spec/20-gsearch-cli/00-overview.md` (line 105-113)

Overview declares GSearch error codes as **7000-7599** with sub-ranges only up to 7599. But actual specs use:
- 7600-7609 — Platform search errors (`23-platform-search.md`)
- 7800-7839 — BI Suite response/caching errors (`47-response-formatting-caching.md`)

**Remediation:** Update overview error code table to include full range (7000-7839).

---

### 🟡 MEDIUM

---

#### Issue #13-16 — Boolean Naming Violations (P1)

Multiple boolean fields missing `is`/`has`/`can`/`should`/`was` prefix:

| File | Current | Required |
|------|---------|----------|
| 47-response-formatting-caching.md | `Immutable bool` | `IsImmutable` |
| 47-response-formatting-caching.md | `FlattenNested bool` | `ShouldFlattenNested` |
| 47-response-formatting-caching.md | `IncludeMeta bool` | `ShouldIncludeMeta` |
| 47-response-formatting-caching.md | `PrettyPrint bool` | `ShouldPrettyPrint` |
| 10-caching-system.md | `FromCache bool` | `IsFromCache` |
| 23-platform-search.md | `IncludeNsfw bool` | `ShouldIncludeNsfw` |
| 23-platform-search.md | `IncludeComments bool` | `ShouldIncludeComments` |
| 23-platform-search.md | `IncludeTranscript bool` | `ShouldIncludeTranscript` |
| 23-platform-search.md | `IncludeSubtitleLangs bool` | `ShouldIncludeSubtitleLangs` |
| 23-platform-search.md | `IncludeExternalUrls bool` | `ShouldIncludeExternalUrls` |
| 44-serp-position-tracking.md | `IncludeAds bool` | `ShouldIncludeAds` |
| 44-serp-position-tracking.md | `ForceRefresh bool` | `ShouldForceRefresh` |

---

#### Issue #17 — Functions Exceeding 15-Line Limit (R6)

| File | Function | Approx Lines |
|------|----------|-------------|
| 04-html-parser.md | `parseWithSelectors` | ~55 lines |
| 04-html-parser.md | `fetchAndParse` | ~45 lines |
| 23-platform-search.md | `YouTubeSearchService.Search` | ~40 lines |
| 23-platform-search.md | `RedditSearchService.Search` | ~50 lines |
| 44-serp-position-tracking.md | `PageIndexer.IndexPages` | ~45 lines |

---

#### Issue #18 — `YouTubeResult.PublishedAt` Never Populated

**File:** `spec/20-gsearch-cli/01-backend/23-platform-search.md` (line 249-268)

The `YouTubeResult` struct has a `PublishedAt time.Time` field (line 117), but the `Search()` method never sets it from `item.Snippet.PublishedAt`. This means all results have zero-value timestamps.

**Remediation:** Add `PublishedAt` parsing:
```go
publishedAt, _ := time.Parse(time.RFC3339, item.Snippet.PublishedAt)
result.PublishedAt = publishedAt
```

---

#### Issue #19 — No Rating/View-Count-First Sorting for YouTube

**File:** `spec/20-gsearch-cli/01-backend/23-platform-search.md`

The spec only supports `--sort relevance` (hardcoded `Order(\"relevance\")` on line 212). There is no mechanism to:
1. Sort by rating or view count before processing
2. Filter by minimum view count or like ratio
3. Rank results by engagement metrics

**Impact:** Users cannot prioritize high-quality videos. The `Relevance` field is a simple position-based decay (`1.0 - (float64(i) * 0.1)`) that doesn't incorporate any quality signals.

**Remediation:**
```go
type YouTubeConfig struct {
    // ... existing fields
    SortBy          string  // relevance, rating, viewCount, date
    MinViewCount    int64   // Minimum view threshold
    MinLikeRatio    float64 // Minimum likes/(likes+dislikes) ratio
}
```

Add a post-fetch ranking step that combines relevance with engagement metrics:
```go
func (s *YouTubeSearchService) rankByEngagement(results []YouTubeResult) []YouTubeResult {
    sort.Slice(results, func(i, j int) bool {
        scoreI := float64(results[i].ViewCount) * results[i].Relevance
        scoreJ := float64(results[j].ViewCount) * results[j].Relevance

        return scoreI > scoreJ
    })

    return results
}
```

---

### 🟢 LOW

---

#### Issue #20 — JSON Config Keys Use camelCase

**File:** `spec/20-gsearch-cli/01-backend/05-google-api.md` (line 288-303)

Config JSON uses `\"googleCustomSearch\"`, `\"apiKeyEnv\"`, `\"engineId\"`, `\"dailyQuota\"` — should be PascalCase per §1.1 JSON/API key standard.

---

#### Issue #21 — Inconsistent `httpmethod.Get.String()` Usage

Reddit service uses the enum-based `httpmethod.Get.String()` (correct), but YouTube and other services use implicit string methods or `http.NewRequest` without the httpmethod enum.

---

#### Issue #22 — Minor Negation in `extractUrls`

`if !seen[u]` — technically a P3 violation but falls near the `!ok` comma-ok exemption. Low priority.

---

#### Issue #23 — `log.Printf` Instead of Structured Logging

**File:** `spec/20-gsearch-cli/01-backend/10-caching-system.md` (lines 278, 283)

```go
// ❌ Current
log.Printf("cache cleanup error: %v", err)

// ✅ Required — structured zerolog
log.Error().Err(err).Msg("cache cleanup failed")
```

---

## Functional Gap Analysis

### SERP Scraping Strategy

**Strengths:**
- ✅ Externalized selector versioning system — excellent maintainability
- ✅ Multi-engine support (Google, DuckDuckGo, Bing) with fallback selectors
- ✅ CAPTCHA/block detection with user-agent rotation
- ✅ Weighted random method selection with exponential backoff + 4 jitter strategies

**Gaps:**
- ⚠️ No proxy rotation support — single IP will get blocked under load
- ⚠️ No headless browser fallback for JavaScript-rendered SERP features
- ⚠️ Google AI Overview extraction not covered in HTML parser (only in BI suite)

### Caching Strategy

**Strengths:**
- ✅ Cache-first retrieval with keyword normalization (case-insensitive, word-order-agnostic)
- ✅ Automatic cleanup job with configurable intervals
- ✅ TTL policies per data category (search: 5d, SERP: 1d, position history: immutable)
- ✅ Cache stats and CLI management commands

**Gaps:**
- ⚠️ Three incompatible cache implementations (Issue #10)
- ⚠️ No cache warming / preloading for scheduled searches
- ⚠️ No stale-while-revalidate pattern — expired cache immediately triggers re-fetch

### YouTube / SRT / Transcript

**Strengths:**
- ✅ Deep extraction: metadata + external URLs + transcript/captions
- ✅ Batch extraction with semaphore-based concurrency limiting (5 concurrent)
- ✅ Multiple subtitle language detection
- ✅ Authenticated access support (cookies, session tokens)

**Gaps:**
- ⚠️ `getTranscript` signature broken (Issue #1)
- ⚠️ No SRT format output — transcript is raw text, not timed subtitles
- ⚠️ No language preference for transcript selection (always picks first available)
- ⚠️ No transcript caching — deep extraction hits YouTube every time
- ⚠️ `PublishedAt` not populated (Issue #18)
- ⚠️ No rating-first / engagement-weighted sorting (Issue #19)

---

## Priority Remediation Order

| Priority | Issues | Effort |
|----------|--------|--------|
| **P0 — Fix Now** | #1 (signature mismatch), #9 (compile error) | 1 hour |
| **P1 — Sprint** | #2, #3, #4 (error handling migration) | 4 hours |
| **P2 — Sprint** | #5, #6, #7 (enum PascalCase), #8 (DB column) | 2 hours |
| **P3 — Quarter** | #10 (cache consolidation), #19 (rating sort) | 8 hours |
| **P4 — Opportunistic** | #13-16 (boolean naming), #17 (function length) | 4 hours |

---

## Cross-References

| Document | Path |
|----------|------|
| Master Coding Guidelines | `spec/02-coding-guidelines/01-cross-language/00-master-coding-guidelines.md` |
| Go Enum Specification | `spec/02-coding-guidelines/03-golang/01-enum-specification/` |
| GSearch Overview | `spec/20-gsearch-cli/00-overview.md` |
| Error Code Registry | `.lovable/memories/technical/error-code-registry.md` |
| Compliance Dashboard | `.lovable/audits/00-compliance-dashboard.md` |

---

*Audit generated 2026-03-04. Next: Apply P0 fixes, then schedule P1/P2 for current sprint.*
