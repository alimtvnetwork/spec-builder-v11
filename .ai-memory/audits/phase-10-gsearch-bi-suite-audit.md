# Phase 10: GSearch BI Suite (40-60) Audit

**Date:** 2026-02-07  
**Auditor:** AI  
**Scope:** `02-spec/20-gsearch-cli/01-backend/40-60` (21 files)  
**Files Reviewed:** 21  
**Status:** Complete

---

## 1. Inconsistency Report

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-01 | `41-business-intelligence-plan.md` line 119 | **Node.js reference contradicts Go-only architecture.** States "HTML Parser: Node.js-based DOM traversal" but the actual Phase 4 spec (`45-contact-extraction.md`) correctly uses pure Go with `goquery`. The plan document is stale. | 🔴 Critical |
| I-02 | `41-business-intelligence-plan.md` lines 134-167 | **Flat-field ContactInfo model conflicts with 54-model-decomposition.md.** Plan defines `Contacts` table with `email_1..email_5`, `phone_1..phone_5` columns. The model decomposition spec refactors this into composed pointer structs (`*EmailInfo`, `*PhoneInfo`, `*SocialProfiles`). Plan was never updated. | 🔴 Critical |
| I-03 | `41-business-intelligence-plan.md` lines 101-110, `42-multi-engine-search.md` lines 398-429 | **Database column naming: `snake_case` violates PascalCase mandate.** SQL schemas use `query_hash`, `query_raw`, `created_at`, `last_accessed`, `display_url`, `captured_at`, `ttl_expires`. Must be `QueryHash`, `QueryRaw`, `CreatedAt`, etc. | 🔴 Critical |
| I-04 | `42-multi-engine-search.md` lines 233-239 | **`FallbackStrategy` uses `int` instead of `byte` variant pattern.** `type FallbackStrategy int` should be `type Variant byte` in `internal/enums/fallback_strategy/`. Missing from `58-enum-architecture.md`. | 🔴 Critical |
| I-05 | `42-multi-engine-search.md` lines 327-333 | **`MergeStrategy` uses `int` instead of byte variant.** Same pattern violation as I-04. | 🔴 Critical |
| I-06 | `43-faq-discovery-ai-overview.md` lines 114-126 | **`QuestionType` uses `string` type alias.** `type QuestionType string` should be `type Variant byte` in `internal/enums/question_type/`. | 🔴 Critical |
| I-07 | `43-faq-discovery-ai-overview.md` lines 194-201 | **`FaqOrigin` uses `string` type alias.** `type FaqOrigin string` should be byte variant. | 🔴 Critical |
| I-08 | `44-serp-position-tracking.md` lines 146-152 | **`DeviceType` uses `string` type alias.** Should reference `device.Variant` from `58-enum-architecture.md` which already defines this enum. Duplicate/divergent definition. | 🟡 Warning |
| I-09 | `44-serp-position-tracking.md` lines 193-204 | **`ResultType` uses `string` type alias.** Should be byte variant in `internal/enums/result_type/` (already listed in `58-enum-architecture.md`). | 🔴 Critical |
| I-10 | `44-serp-position-tracking.md` lines 283-289 | **`TrendDirection` uses `string` type alias.** Should be byte variant. Missing from enum architecture. | 🟡 Warning |
| I-11 | `45-contact-extraction.md` lines 202-212 | **`EmailType` uses `string` type alias.** Should be byte variant. Not in `58-enum-architecture.md`. | 🔴 Critical |
| I-12 | `45-contact-extraction.md` lines 224-233 | **`PhoneType` uses `string` type alias.** Same issue. | 🔴 Critical |
| I-13 | `45-contact-extraction.md` lines 245-257 | **`SocialPlatform` uses `string` type alias.** Overlaps with `social_media.Variant` in `58-enum-architecture.md` but is a separate type. Redundant/conflicting enum. | 🟡 Warning |
| I-14 | `45-contact-extraction.md` lines 259-269 | **`ExtractionSource` uses `string` type alias.** Should be byte variant. Missing from enum architecture. | 🟡 Warning |
| I-15 | `46-google-maps-search.md` lines 147-180 | **`MapsSearchRequest` uses `json:"snake_case"` tags.** All JSON tags like `json:"query"`, `json:"min_rating,omitempty"`, `json:"batch_size"` violate PascalCase mandate. Must use `json:",omitempty"` only. | 🔴 Critical |
| I-16 | `46-google-maps-search.md` lines 199-242, 258-297 | **`Business` and `MapsJob` structs use `json:"snake_case"` tags.** Same violation as I-15 across 40+ fields: `json:"place_id"`, `json:"street_address"`, `json:"reviews_count"`, etc. | 🔴 Critical |
| I-17 | `46-google-maps-search.md` lines 299-317 | **`JobStatus` and `JobPhase` use `string` type aliases.** Both should be byte variants. `JobPhase` missing from enum architecture entirely. | 🔴 Critical |
| I-18 | `46-google-maps-search.md` line 322 | **`JobLog.Level` is a raw `string` field.** Should reference `log_level.Variant` from enum architecture. | 🟡 Warning |
| I-19 | `47-response-formatting-caching.md` lines 197-208 | **`OutputFormat` uses `string` type alias.** Should reference `output.Variant` from `58-enum-architecture.md`. Duplicate definition. | 🟡 Warning |
| I-20 | `48-unified-rest-api.md` lines 280-291 | **`SearchRequest` mixes PascalCase JSON tags with `binding` tags.** Uses explicit `json:"Query"` etc. — correct for Go but inconsistent with other BI specs that use `json:",omitempty"` only. | 🟡 Warning |
| I-21 | `48-unified-rest-api.md` lines 167-181 | **`ApiKeyScope` uses `string` type alias.** Should be byte variant. Missing from `58-enum-architecture.md`. | 🟡 Warning |
| I-22 | `41-business-intelligence-plan.md` line 319 | **Cross-reference filename wrong.** References `48-business-intelligence-api.md` but actual file is `48-unified-rest-api.md`. | 🟡 Warning |
| I-23 | `40-bi-suite-summary.md` vs `41-business-intelligence-plan.md` | **Phase numbering conflict.** Summary says "8 phases" (1-8). Plan says "7 phases" (dependency diagram shows 1-7 only, no Phase 8 in plan). Testing UI treated differently. | 🟡 Warning |
| I-24 | `54-model-decomposition.md` line 103 | **`PhoneInfo.Type` is raw `string`.** Should reference an enum (e.g., `phone_type.Variant`). | 🟡 Warning |
| I-25 | `54-model-decomposition.md` lines 412-458 | **SQL schema uses `snake_case` column-style naming but with PascalCase.** Actually correct — BUT index names use `snake_case`: `idx_social_contact`, `idx_hours_business`, `idx_faq_sources`. Should follow `IX_{Table}_{Column}` pattern per database conventions. | 🟡 Warning |
| I-26 | `56-multi-source-search.md` lines 399-443 | **Database columns mix PascalCase with `snake_case`-style TEXT fields.** `PlatformEnum TEXT`, `SitePattern TEXT` are fine but storing enum values as raw `TEXT` instead of typed ORM fields. | 🟡 Warning |
| I-27 | `57-scheduled-search.md` lines 37-44, 47-52 | **`ScheduleConfig.Type` and `SearchType` are raw strings.** Should reference enums: `schedule.Variant` (exists in `58-enum-architecture.md`) and a new `search_type.Variant`. | 🟡 Warning |
| I-28 | `57-scheduled-search.md` lines 104-155 | **SQL column `IntervalUnit TEXT` should be enum.** "minutes/hours/days/weeks" should be a `time_unit.Variant` byte enum. Also `Status TEXT` should be `execution_status.Variant`. | 🟡 Warning |
| I-29 | `57-scheduled-search.md` lines 299-315 | **Seed config uses `camelCase` JSON keys.** `"scheduledSearch"`, `"seedVersion"`, `"maxSchedules"` etc. violate PascalCase mandate. Should be `"ScheduledSearch"`, `"SeedVersion"`, `"MaxSchedules"`. | 🔴 Critical |
| I-30 | `58-enum-architecture.md` | **Missing 11 enums found in BI specs.** The following types used across BI specs are NOT in the enum architecture: `fallback_strategy`, `merge_strategy`, `question_type`, `faq_origin`, `trend_direction`, `email_type`, `phone_type`, `extraction_source`, `api_key_scope`, `job_phase`, `search_type`. | 🔴 Critical |
| I-31 | `59-provider-integration.md` line 209 | **Casts `engine.Variant` to `platform.Variant` directly.** `plat := platform.Variant(e)` is unsafe — engine and platform are independent byte enums with different iota values. Google engine (iota=1) would map to Google platform (also iota=1) by coincidence, but Bing (2) maps to Bing (2) only if ordering matches. Fragile and undocumented. | 🔴 Critical |
| I-32 | `60-unified-cli-api-reference.md` | **Schedule endpoints differ from `57-scheduled-search.md`.** CLI reference shows `gsearch schedule pause/resume`, API reference shows `POST /api/v1/schedules/{id}/pause` and `/resume`. But `57-scheduled-search.md` API section uses `PATCH /api/v1/schedules/{id}` for both. Three conflicting patterns. | 🟡 Warning |

---

## 2. Missing Acceptance Criteria

**All 21 BI Suite files lack formal GIVEN/WHEN/THEN acceptance criteria.**

| File | Has AC? |
|------|---------|
| `40-bi-suite-summary.md` | ❌ |
| `41-business-intelligence-plan.md` | ❌ |
| `42-multi-engine-search.md` | ❌ |
| `43-faq-discovery-ai-overview.md` | ❌ |
| `44-serp-position-tracking.md` | ❌ |
| `45-contact-extraction.md` | ❌ |
| `46-google-maps-search.md` | ❌ |
| `47-response-formatting-caching.md` | ❌ |
| `48-unified-rest-api.md` | ❌ |
| `49-testing-ui.md` | ❌ |
| `50-bi-error-codes.md` | ❌ |
| `51-bi-validation-checklist.md` | ❌ |
| `52-bi-implementation-guide.md` | ❌ |
| `53-sge-selector-tests.md` | ❌ |
| `54-model-decomposition.md` | ❌ |
| `56-multi-source-search.md` | ❌ |
| `57-scheduled-search.md` | ❌ |
| `58-enum-architecture.md` | ❌ |
| `59-provider-integration.md` | ❌ |
| `60-unified-cli-api-reference.md` | ❌ |

---

## 3. Detailed Acceptance Criteria

### 3.1 Multi-Engine Search (`42-multi-engine-search.md`)

---

**AC-P10-001: API Provider Rotation**

GIVEN: Multiple API providers are configured for a search engine (e.g., SerpAPI, Serper, SearchAPI for Google)

WHEN: A search request is executed with `--method auto`

THEN:
- The system MUST select a healthy provider with remaining quota
- Provider selection MUST follow priority order: healthy → under-limit → priority rank → least-recently-used
- If the selected provider fails, the system MUST automatically try the next provider in priority order
- If all API providers fail and `Method != MethodAPI`, the system MUST fall back to the stealth scraper
- If all providers AND scraper fail, the system MUST return error code 7714 (`ErrSearchAllEnginesFailed`)
- Provider health status MUST be updated after each request (success resets error count, failure increments it)
- A provider with 3+ consecutive failures MUST be marked unhealthy for 5 minutes (configurable)

EDGE CASES:
- If only one provider is configured and it fails, fallback to scraper MUST still be attempted
- If the API key environment variable is unset for a provider, that provider MUST be skipped (not error)
- Rate limit exhaustion (quota = 0) MUST mark provider as temporarily unavailable, not unhealthy

---

**AC-P10-002: Result Aggregation Across Engines**

GIVEN: A search is executed with `--engines google,bing --merge`

WHEN: Both engines return results

THEN:
- Results MUST be deduplicated by URL (normalized: lowercase, trailing slash stripped, query params sorted)
- When the same URL appears in multiple engines, the result MUST include an `Engines` array listing all sources
- The `AggScore` MUST be computed as: `sum(1/position_in_engine)` across all engines where the result appeared
- Results MUST be sorted by `AggScore` descending (highest relevance first)
- The `Consensus` field MUST equal the count of engines that returned this URL
- `EngineStats` MUST include per-engine: result count, search time, method used, cache status, and error (if any)

EDGE CASES:
- If one engine returns 0 results, aggregation MUST proceed with the other engine's results only
- If both engines return 0 results, error code 7710 MUST be returned
- URLs differing only by protocol (`http` vs `https`) MUST be treated as the same URL for deduplication

---

### 3.2 FAQ Discovery (`43-faq-discovery-ai-overview.md`)

---

**AC-P10-003: AI Overview Extraction with 2026 Selectors**

GIVEN: A search query is executed that triggers Google's AI Overview (SGE)

WHEN: The AI Overview extractor processes the SERP page

THEN:
- The system MUST try selectors in priority order (1 = highest, 6 = lowest) from `sgeContainerSelectors2026`
- Extraction confidence MUST be calculated as `1.0 - ((priority - 1) * 0.15)` with a floor of 0.4
- If no CSS selectors match, the system MUST invoke `heuristicDetect2026` which checks for: ≥3 `data-ved` attributes, AI indicator text, and near-top-of-page positioning
- Heuristic detection MUST have a confidence of 0.35
- The response type MUST be classified as "list" (if `<ul>` or `<ol>` present), "comparison" (if `<table>` or "vs"/"versus" present), or "summary" (default)
- If no AI Overview is found, `Available` MUST be `false` with no error (graceful absence)

EDGE CASES:
- If the CAPTCHA detection fires during extraction, the system MUST return error 7708 (`ErrSearchScrapeBlocked`)
- If the page loads but all selectors return empty content, `Available` MUST be `true` but `Summary` MUST be empty and `Confidence` < 0.5
- Selectors containing `:contains()` pseudo-class MUST fall back to text matching if the CSS engine doesn't support it

---

**AC-P10-004: PAA Recursive Expansion**

GIVEN: A FAQ discovery request with `--depth 3`

WHEN: People Also Ask (PAA) questions are extracted

THEN:
- Level 0: Extract all visible PAA questions from the initial SERP (typically 4-6 questions)
- Level 1-N: For each unseen question, simulate click to expand and extract child questions
- Questions MUST be deduplicated by normalized text (lowercase, trimmed, punctuation-stripped)
- Expansion MUST stop at the configured depth OR when no new questions are found
- Each `FaqItem.PaaRank` MUST reflect the original position in the PAA box (1-based)
- `FaqItem.Origin` MUST be set to `OriginPaa` for PAA-sourced questions

EDGE CASES:
- If PAA expansion triggers a page reload or navigation, the system MUST abort expansion at current depth
- If Google returns 0 PAA questions (no PAA box), the system MUST return empty results without error
- Circular PAA chains (question A → B → A) MUST be detected via the `seen` map and skipped

---

### 3.3 SERP Position Tracking (`44-serp-position-tracking.md`)

---

**AC-P10-005: Domain Position Discovery**

GIVEN: `gsearch serp "keyword" --find-position example.com --max-pages 10`

WHEN: The position finder searches through SERP pages

THEN:
- Pages MUST be searched sequentially from page 1 to `max-pages`
- Domain matching MUST be case-insensitive and support: exact match, subdomain match (`www.example.com` matches `example.com`), and path-only match (`example.com/blog` matches `example.com`)
- On first match, search MUST stop immediately and return: absolute position, page number, page-relative position, exact URL, and result type
- If domain is not found after all pages, `Found` MUST be `false` with `PagesSearched` reflecting total pages checked
- Each page MUST be fetched via the multi-engine search system (reusing caching)

EDGE CASES:
- If a page fetch fails, the system MUST skip to the next page (not abort entirely)
- If ALL pages fail, error MUST be returned with partial results (pages that succeeded)
- Domain matching for `example.co.uk` MUST NOT match `example.co` or `co.uk`

---

**AC-P10-006: Position Alert Engine**

GIVEN: A tracking job exists with alert configuration: `OnPositionDrop: 5, OnPageChange: true, OnNotFound: true`

WHEN: A scheduled position check detects a change

THEN:
- If position drops by ≥5 places vs previous check, a `serp.alert` webhook event MUST fire
- If the domain moves to a different page (e.g., page 1 → page 2), a `serp.alert` MUST fire with `Type: "page_change"`
- If the domain is no longer found at all, a `serp.alert` MUST fire with `Type: "not_found"`
- If the domain reaches page 1 for the first time AND `OnFirstPage: true`, a `serp.alert` MUST fire with `Type: "first_page"`
- Alert webhooks MUST be signed with HMAC-SHA256 using the registered webhook secret
- Alert delivery failures MUST be retried up to 3 times with exponential backoff

EDGE CASES:
- If the webhook URL is unreachable for all retries, error 7758 MUST be logged but the tracker MUST continue operating
- Position improvements (gains) MUST NOT trigger `OnPositionDrop` alerts
- The first check for a new tracker has no "previous" — it MUST NOT trigger any change-based alerts

---

### 3.4 Contact Extraction (`45-contact-extraction.md`)

---

**AC-P10-007: Email Discovery and Classification**

GIVEN: A contact extraction request for a URL with `--verify-emails`

WHEN: The email extractor processes the page

THEN:
- Emails MUST be extracted in priority order: (1) `mailto:` links (confidence 0.95), (2) JSON-LD schema (confidence 0.9), (3) plain text regex (confidence 0.7)
- Maximum 5 emails per domain
- Each email MUST be classified: `info@`/`contact@`/`hello@` → General, `support@`/`help@` → Support, `sales@` → Sales, `hr@`/`jobs@` → HR, `press@`/`media@` → Press, `firstname.lastname@` → Personal
- Emails matching invalid patterns (`@sentry.io`, `@wixpress.com`, `example.com`, image filenames) MUST be filtered
- With `--verify-emails`, an MX record lookup MUST be performed; `Verified` set to result
- Results MUST be sorted by confidence descending

EDGE CASES:
- Obfuscated emails (`info [at] example [dot] com`) SHOULD be detected with lower confidence (0.5)
- If the page returns 403/404, error 7762 MUST be returned
- Empty `mailto:` links (`mailto:`) MUST be ignored

---

**AC-P10-008: Social Profile Extraction**

GIVEN: A URL is processed for social profile extraction

WHEN: The extractor scans `<a>` tags

THEN:
- Links MUST be matched against 9 platform domains: linkedin.com, facebook.com, twitter.com/x.com, instagram.com, youtube.com, tiktok.com, pinterest.com, wa.me/whatsapp, t.me/telegram
- Each social link MUST extract: platform name, full URL, handle (username portion), and verification status
- Footer sections (`<footer>`, `#footer`, `.footer`, `[role='contentinfo']`) MUST be prioritized for social link discovery
- Duplicate platform links (same platform, same handle) MUST be deduplicated

EDGE CASES:
- Links to platform login/help pages (e.g., `linkedin.com/help`) MUST be excluded
- Short URLs (e.g., `bit.ly/xxx` redirecting to LinkedIn) are NOT followed (only direct platform URLs)
- `x.com` links MUST be treated as Twitter/X platform

---

### 3.5 Google Maps Search (`46-google-maps-search.md`)

---

**AC-P10-009: Scheduled Maps Job Lifecycle**

GIVEN: A Maps job is created with `--schedule --limit 500 --batch-size 30 --interval 2m`

WHEN: The scheduler processes the job

THEN:
- Job MUST progress through 3 phases: `Searching` → `Enriching` → `Finishing`
- In `Searching` phase: scrape 30 businesses per batch, wait 2 minutes between batches
- After all businesses are collected, transition to `Enriching` phase: visit each business website for contact extraction (if `--enrich-contacts`)
- After enrichment, transition to `Finishing` phase: persist final results, update job status to `completed`
- `CollectedCount` MUST be updated after each batch
- If CAPTCHA is detected, job MUST pause and retry after exponential backoff (5min, 15min, 45min)
- After 3 consecutive CAPTCHA failures, job status MUST change to `failed` with error 7785

EDGE CASES:
- If the CLI process restarts, pending/running jobs MUST be resumed from their last `CurrentPage`
- If `--max-runtime 2h` is set and exceeded, job MUST be paused (not failed) to allow manual resume
- Duplicate businesses (same `PlaceId`) across batches MUST be deduplicated

---

### 3.6 Response Formatting & Caching (`47-response-formatting-caching.md`)

---

**AC-P10-010: TTL Policy Clamping**

GIVEN: A cache TTL policy exists for `search_results` with `MinTtl: 1h, MaxTtl: 30d, DefaultTtl: 5d`

WHEN: A user requests `--ttl 10` (10 days) or `--ttl 0` or `--ttl 365`

THEN:
- `--ttl 10`: TTL MUST be accepted as-is (within range)
- `--ttl 0`: TTL MUST be clamped UP to `MinTtl` (1 hour)
- `--ttl 365`: TTL MUST be clamped DOWN to `MaxTtl` (30 days)
- The `CacheMeta` in response MUST include actual `TtlDays` used (after clamping)
- If no override is provided, `DefaultTtl` (5 days) MUST be used
- `position_history` category with `Immutable: true` MUST never expire regardless of override

EDGE CASES:
- Negative TTL values MUST be treated as MinTtl
- If the TTL policy is not found for a category, the system MUST use 5-day fallback default
- Stale-while-revalidate MUST serve expired cache while triggering background refresh

---

**AC-P10-011: Field Selection via JSON Path**

GIVEN: A request with `--fields "Title,Url,Contact.Emails[0].Address as Email"`

WHEN: The formatter processes the response

THEN:
- Only specified fields MUST appear in output
- Nested paths MUST be traversed (e.g., `Contact.Emails[0].Address` resolves the first email's address)
- The `as` keyword MUST create an alias (output key is `Email`, not `Address`)
- If a path doesn't resolve (field not present), the value MUST be null/empty (not error)
- Field selection MUST work with all output formats (JSON, CSV, table, markdown)

EDGE CASES:
- Array index out of bounds (`Emails[5]` when only 3 exist) MUST return null
- Wildcard paths (`Contact.Emails[*].Address`) SHOULD return an array of all matching values
- Empty `--fields ""` MUST return all fields (same as no field selection)

---

### 3.7 REST API (`48-unified-rest-api.md`)

---

**AC-P10-012: API Key Authentication and Scopes**

GIVEN: An API key is registered with scopes `["search:read", "serp:read"]`

WHEN: Requests are made with this key

THEN:
- `GET /api/v1/bi/search/engines` MUST succeed (requires `search:read`)
- `POST /api/v1/bi/search` MUST fail with 403 and error 7825 (`ErrScopeInsufficient`) because it requires `search:write`
- `POST /api/v1/bi/maps/search` MUST fail with 403 because `maps:read`/`maps:write` not in scopes
- API key MUST be accepted from `X-API-Key` header OR `api_key` query parameter
- Missing API key MUST return 401 with error 7820
- Invalid/expired key MUST return 401 with error 7821
- `LastUsedAt` MUST be updated on every successful authentication

EDGE CASES:
- API key with `admin` scope MUST have access to ALL endpoints
- Expired key (past `ExpiresAt`) MUST be rejected even if scopes are valid
- Keys with `IsActive: false` MUST be rejected with 7821

---

**AC-P10-013: Token Bucket Rate Limiting**

GIVEN: An API key has a rate limit of 60 requests/minute

WHEN: Requests are made at varying rates

THEN:
- Requests within limit MUST succeed with headers: `X-RateLimit-Limit: 60`, `X-RateLimit-Remaining: N`
- When limit is exhausted, response MUST be 429 with error 7822 and `X-RateLimit-Reset` header (Unix timestamp)
- Tokens MUST refill at a steady rate (1 per second for 60/min)
- Rate limit MUST be tracked per API key, not per IP
- The `X-RateLimit-Remaining` header MUST accurately reflect current token count

EDGE CASES:
- Burst of 60 requests in 1 second MUST be allowed (bucket starts full)
- After exhaustion, exactly one request per second MUST succeed
- If no API key is provided (auth disabled), rate limiting MUST fall back to IP-based limiting

---

### 3.8 Webhook System (`48-unified-rest-api.md`)

---

**AC-P10-014: Webhook HMAC-SHA256 Signing**

GIVEN: A webhook is registered with a `Secret` value

WHEN: An event triggers webhook delivery

THEN:
- The request body MUST be JSON with fields: `Event` (string), `Data` (object), `Timestamp` (ISO 8601), `WebhookId` (string)
- The `X-Webhook-Signature` header MUST contain `sha256=` followed by the hex-encoded HMAC-SHA256 of the raw request body using the registered secret
- The receiver MUST be able to verify: `HMAC-SHA256(secret, raw_body) == signature`
- Delivery MUST use POST with `Content-Type: application/json`
- Delivery timeout MUST be 30 seconds
- Failed deliveries MUST be retried: 3 attempts with delays of 10s, 30s, 90s
- All delivery attempts MUST be logged in `WebhookDeliveries` table with status code and response body

EDGE CASES:
- If the webhook URL returns 3xx redirect, the system MUST NOT follow redirects (security)
- If the secret is empty/null, the signature header MUST still be sent with HMAC of empty string
- Concurrent events for the same webhook MUST be delivered in order (FIFO)

---

### 3.9 Multi-Source Search (`56-multi-source-search.md`)

---

**AC-P10-015: Parallel Platform Search Execution**

GIVEN: A parallel search request with `Platforms: [YouTube, Reddit, LinkedIn]` and `Engines: [Google, Bing]`

WHEN: The multi-source orchestrator executes

THEN:
- All 5 sources (3 platforms + 2 engines) MUST be searched concurrently using goroutines
- Each goroutine MUST acquire a worker slot from the bounded pool (`MaxConcurrent: 20`)
- Platform searches MUST use `site:` operator (e.g., `site:youtube.com {query}`) via the default engine (Google)
- Engine searches MUST query directly without site scoping
- Results MUST be keyed by `platform.Variant` in the response map
- `TotalCount` MUST equal the sum of all results across all sources
- `SuccessCount` + `FailureCount` MUST equal total sources attempted
- `Duration` MUST reflect wall-clock time (not sum of individual durations)

EDGE CASES:
- If 2 of 5 sources fail, response MUST still be `Success: true` with partial results and errors in `Errors` map
- If ALL sources fail, error 7852 MUST be returned
- Invalid platform enum values MUST be recorded in `Errors` and skipped (not abort entire search)
- Worker pool exhaustion MUST block (not error) until a slot becomes available

---

### 3.10 Scheduled Search (`57-scheduled-search.md`)

---

**AC-P10-016: Cron and Interval Schedule Execution**

GIVEN: A schedule with `Type: "cron"` and `CronExpression: "0 9 * * 1"` (Monday 9am UTC)

WHEN: The scheduler service is running

THEN:
- `NextRunAt` MUST be calculated from the cron expression relative to the configured timezone
- The scheduler MUST poll every 30 seconds for due jobs (`NextRunAt <= now`)
- When triggered, the scheduler MUST: create a `ScheduleExecution` record with `Status: "running"`, execute the search, update with results, set `Status: "completed"` or `"failed"`
- `NextRunAt` MUST be recalculated to the next occurrence after completion
- `RunCount` MUST increment by 1 per execution
- `SuccessCount` or `FailureCount` MUST increment based on outcome
- For interval schedules (`every 6 hours`), `NextRunAt = LastRunAt + interval`

EDGE CASES:
- If the scheduler was down during a scheduled time, missed executions MUST be detected and run once on startup (not multiple catchup runs)
- If execution exceeds `executionTimeoutSeconds` (300s default), the execution MUST be marked `"failed"` with error 7870
- Disabled schedules (`IsEnabled: false`) MUST be skipped even if `NextRunAt` has passed
- One-time schedules MUST set `IsEnabled: false` after execution

---

### 3.11 Provider Integration (`59-provider-integration.md`)

---

**AC-P10-017: Provider Health Check and Failover**

GIVEN: Three providers are configured: SerpAPI (priority 1), MapsScraper (priority 2), Colly (priority 3)

WHEN: A search request is routed to providers

THEN:
- The orchestrator MUST first try SerpAPI (highest priority)
- If SerpAPI fails, MUST automatically try MapsScraper
- If MapsScraper fails, MUST try Colly
- Each provider's `HealthCheck()` MUST be called on startup and every 5 minutes thereafter
- Unhealthy providers MUST be excluded from selection until their next successful health check
- Rate-limited providers (`IsLimited: true`) MUST be excluded until `ResetAt` passes
- All results MUST be normalized to the unified `SearchResponse` format regardless of source provider

EDGE CASES:
- If SerpAPI API key is missing, the provider MUST be marked unhealthy at startup (not crash)
- If all providers are unhealthy, error 7714 MUST be returned with a message listing all provider statuses
- Provider responses with different field formats MUST be normalized (e.g., SerpAPI's `organic_results` → unified `Results[]`)

---

### 3.12 Model Decomposition (`54-model-decomposition.md`)

---

**AC-P10-018: Composed Pointer Model Serialization**

GIVEN: A `ContactInfo` struct with `Email: *EmailInfo{Address: "info@example.com"}` and `Phone: nil`

WHEN: The struct is serialized to JSON

THEN:
- `Email` MUST be serialized as a nested object: `{"Email": {"Address": "info@example.com", ...}}`
- `Phone` MUST be omitted entirely (not `"Phone": null`) due to `omitempty` on pointer fields
- `Social` (stored in separate table via `gorm:"-"`) MUST be populated via ORM preloading before serialization
- GORM embedded fields MUST use `embeddedPrefix` to avoid column name collisions (e.g., `EmailAddress`, `PhoneRaw`)
- API backward compatibility MUST be maintained: clients expecting flat fields MUST receive them via a compatibility layer during migration

EDGE CASES:
- A `ContactInfo` with ALL pointer fields nil MUST serialize to `{"Id": "...", "SourceUrl": "...", ...}` without any nested objects
- Nested struct fields with `omitempty` MUST correctly omit zero-value primitives (`0`, `""`, `false`)
- `SocialProfiles` with 9 nil platform pointers MUST serialize as `{}` (empty object), not as an object with 9 null fields

---

## 4. Summary

| Category | Count |
|----------|-------|
| Critical Issues | 15 |
| Warnings | 17 |
| Total Inconsistencies | 32 |
| Acceptance Criteria Generated | 18 (AC-P10-001 through AC-P10-018) |

### Key Remediation Actions

1. **Enum Compliance (I-04 through I-17, I-30):** Convert 11+ string/int type aliases to byte variants and register in `58-enum-architecture.md`
2. **JSON Tag Standardization (I-15, I-16, I-29):** Replace all `json:"snake_case"` and `json:"camelCase"` tags with PascalCase or `json:",omitempty"` only
3. **SQL Schema Naming (I-03, I-25):** Convert all `snake_case` column names and index names to PascalCase/`IX_` pattern
4. **Stale Plan Document (I-01, I-02, I-22):** Update `41-business-intelligence-plan.md` to reflect current architecture decisions
5. **Unsafe Enum Cast (I-31):** Replace direct `platform.Variant(e)` cast with a lookup function that maps engine variants to their corresponding platform variants

---

## 5. Cross-References

| Reference | Location |
|-----------|----------|
| Phase 9 Audit | `.lovable/audits/phase-09-gsearch-core-audit.md` |
| Enum Specification | `02-spec/17-enum-specification/` |
| Database Conventions | `02-spec/01-general-spec/04-advanced/03-database-conventions-advanced.md` |
| Error Code Registry | `02-spec/03-error-code-registry/` |
| GSearch Enum Architecture | `02-spec/20-gsearch-cli/01-backend/58-enum-architecture.md` |

---

*Phase 10 GSearch BI Suite audit completed. 32 inconsistencies found, 18 acceptance criteria generated.*
