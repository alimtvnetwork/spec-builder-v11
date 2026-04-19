# GSearch CLI: Acceptance Criteria

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  
**Format:** GIVEN/WHEN/THEN (E2E-test-ready)

---

## HTML Parser (04-html-parser.md)

### HP-01: Multi-Engine Parsing

**GIVEN** raw HTML from a Google, DuckDuckGo, or Bing search result page  
**WHEN** the HTML parser processes the content  
**THEN** title, link, and description are extracted for each result  
**AND** accuracy is ≥95% for Google and ≥90% for DuckDuckGo/Bing

**Edge Cases:**
- **GIVEN** a CAPTCHA/block page is returned **WHEN** parsing runs **THEN** a `BlockedError` with the appropriate error code is returned instead of empty results
- **GIVEN** the primary CSS selectors fail to match **WHEN** parsing runs **THEN** fallback selectors are activated automatically and results are extracted
- **GIVEN** the external selector JSON file is missing **WHEN** the parser initializes **THEN** embedded default selectors are used

### HP-02: Selector Registry

**GIVEN** a selector registry JSON file exists at the configured path  
**WHEN** the parser initializes or the auto-reload interval triggers  
**THEN** selectors are loaded from the file and applied to subsequent parsing

**Edge Cases:**
- **GIVEN** the selector file contains invalid CSS syntax **WHEN** validation runs **THEN** the invalid selectors are rejected with specific error messages
- **GIVEN** the description field uses comma-separated alternative selectors **WHEN** the primary selector fails **THEN** alternatives are tried in order

### HP-03: Performance

**GIVEN** a standard search result page (~100KB HTML)  
**WHEN** parsing completes  
**THEN** the total parsing time is under 500ms  
**AND** memory usage for parsing 100 results is under 50MB

---

## Google API (05-google-api.md)

### GA-01: OAuth2 Token Management

**GIVEN** valid Google API credentials are configured  
**WHEN** a search request is made  
**THEN** the OAuth2 token is used for authentication  
**AND** expired tokens are refreshed automatically before the request

### GA-02: API Quota Handling

**GIVEN** the Google API quota is exhausted  
**WHEN** a search request is made  
**THEN** the error is detected and the engine switcher is notified  
**AND** subsequent requests fall back to HTML scraping or alternative engines

---

## DuckDuckGo (06-duckduckgo.md)

### DD-01: HTML-Based Search

**GIVEN** DuckDuckGo is selected as the search engine  
**WHEN** a search query is submitted  
**THEN** a POST-based HTML search is performed  
**AND** results are parsed from the response HTML

---

## Bing Search (07-bing-search.md)

### BS-01: Bing HTML Parsing

**GIVEN** Bing is selected as the search engine  
**WHEN** a search query is submitted  
**THEN** results are parsed from Bing's HTML response with ≥90% accuracy

---

## Method Switching (08-method-switching.md)

### MS-01: Weighted Engine Selection

**GIVEN** multiple search engines are configured with weights (e.g., Google: 70, DuckDuckGo: 20, Bing: 10)  
**WHEN** a search request is made  
**THEN** the engine is selected based on the weighted distribution

**Edge Cases:**
- **GIVEN** the selected engine fails **WHEN** retry logic runs **THEN** the next engine in priority order is tried
- **GIVEN** all engines fail **WHEN** the final retry exhausts **THEN** a consolidated error listing all engine failures is returned

---

## Nested Search (09-nested-search.md)

### NS-01: Keyword Extraction and Recursive Search

**GIVEN** an initial search returns results  
**WHEN** nested search is enabled with `depth: 2`  
**THEN** keywords are extracted from results using TF-IDF  
**AND** a second-level search is performed with extracted keywords  
**AND** results are deduplicated by URL

**Edge Cases:**
- **GIVEN** nested depth exceeds the maximum (e.g., 5) **WHEN** configuration is validated **THEN** the depth is capped at the maximum with a warning
- **GIVEN** keyword extraction yields no usable terms **WHEN** nesting is attempted **THEN** the nested level is skipped and a debug log is emitted

### NS-02: Content Fetching

**GIVEN** nested search is configured with `fetchContent: true`  
**WHEN** search results are collected  
**THEN** the full page HTML is fetched for each result URL  
**AND** the content is extracted and stored for RAG processing

**Edge Cases:**
- **GIVEN** a fetched URL returns a 429 (rate limited) **WHEN** content fetching runs **THEN** the URL is queued for retry with exponential backoff and other URLs continue fetching

---

## Caching System (10-caching-system.md)

### CS-01: Cache Key Generation

**GIVEN** a search query with engine, keywords, and parameters  
**WHEN** a cache key is generated  
**THEN** the key uses consistent hashing to ensure identical queries produce the same key

### CS-02: Cache Hit

**GIVEN** a previous search result is cached and within TTL  
**WHEN** the same query is executed  
**THEN** the cached result is returned without making an HTTP request  
**AND** the response includes `cached: true`

**Edge Cases:**
- **GIVEN** the cache entry has expired **WHEN** the query is executed **THEN** a fresh search is performed and the cache is updated
- **GIVEN** the cache database is corrupted **WHEN** a read is attempted **THEN** the cache miss is logged and a fresh search proceeds

---

## RAG Export (11-rag-export.md)

### RE-01: Text Chunking

**GIVEN** search results with fetched content  
**WHEN** RAG export is triggered  
**THEN** content is split into chunks based on configured chunk size and overlap  
**AND** chunks are stored in the RAG database with metadata (source URL, timestamp, position)

### RE-02: Export Format

**GIVEN** RAG chunks exist in the database  
**WHEN** export is requested  
**THEN** chunks are exported in the configured format (JSON, SQLite)  
**AND** each chunk includes embedding-ready text and metadata

---

## Full-Site Crawler (17-full-site-crawler.md)

### FC-01: Site Crawling

**GIVEN** a root URL is provided for crawling  
**WHEN** the crawler starts  
**THEN** pages are discovered by following internal links  
**AND** external links are collected but not followed  
**AND** the crawl respects `robots.txt` directives

**Edge Cases:**
- **GIVEN** a crawl depth limit of 3 is configured **WHEN** crawling reaches depth 3 **THEN** no further links are followed from that page
- **GIVEN** a page returns a redirect **WHEN** the crawler follows it **THEN** the redirect chain is followed up to 5 hops, then abandoned
- **GIVEN** `robots.txt` is malformed (e.g., missing newlines, invalid directives) **WHEN** the crawler parses it **THEN** best-effort parsing is applied and unrecognized directives are ignored with a warning logged

---

## Authority & Credibility Scoring (18-authority-credibility-scoring.md)

### AC-01: Score Calculation

**GIVEN** search results with domain and content metadata  
**WHEN** authority scoring runs  
**THEN** each result receives a composite score based on domain authority, content freshness, and source type  
**AND** results are re-ranked by score

---

## Trend Analysis Engine (19-trend-analysis-engine.md)

### TA-01: Trend Detection

**GIVEN** historical search data exists for a keyword  
**WHEN** trend analysis is triggered  
**THEN** the engine identifies trending keywords based on frequency changes over time  
**AND** results include trend direction (rising, stable, declining) and confidence score

---

## Settings Service (21-settings-service.md)

### GS-SS-01: Settings CRUD

**GIVEN** the GSearch settings service is initialized  
**WHEN** a setting is created/read/updated/deleted via API  
**THEN** the operation is persisted in the root DB  
**AND** the in-memory cache is updated

---

## Database Architecture (22-database-architecture.md)

### GS-DA-01: Schema Migration

**GIVEN** a new version of GSearch with schema changes  
**WHEN** the CLI starts  
**THEN** GORM AutoMigrate applies all schema changes non-destructively  
**AND** existing data is preserved

---

## Reset API (24-reset-api.md)

### GS-RA-01: GSearch-Specific Reset

**GIVEN** the GSearch CLI is running  
**WHEN** a reset request is sent with `{ "Scope": "cache" }`  
**THEN** only search cache databases are listed in `AffectedItems`  
**AND** confirmation deletes cache data while preserving settings and search history

**Edge Cases:**
- **GIVEN** scope is `all` **WHEN** reset is confirmed **THEN** all GSearch data (cache, history, RAG exports, app DBs) is deleted
- **GIVEN** error codes GS-7080–7086 are used **WHEN** any reset error occurs **THEN** the error code matches the documented range

---

## BI Suite (40-52)

### BI-01: SERP Position Tracking

**GIVEN** a keyword and target domain are configured  
**WHEN** position tracking runs  
**THEN** the current SERP position is recorded with timestamp  
**AND** historical position data is queryable

### BI-02: Contact Extraction

**GIVEN** search results with fetched page content  
**WHEN** contact extraction runs  
**THEN** emails, phone numbers, and social links are extracted from the page content  
**AND** results are deduplicated and stored

### BI-03: Google Maps Search

**GIVEN** a location-based query  
**WHEN** Maps search is triggered  
**THEN** business listings with name, address, rating, and coordinates are returned

---

## Scheduled Search (57-scheduled-search.md)

### GS-SS-02: Scheduled Execution

**GIVEN** a search schedule is configured (e.g., daily at 06:00)  
**WHEN** the scheduled time arrives  
**THEN** the configured search query is executed automatically  
**AND** results are stored and any configured notifications are sent

> **Note:** Renamed from `SS-01` to `GS-SS-02` to resolve ID collision with Shared Frontend Settings Service `SS-01`.

**Edge Cases:**
- **GIVEN** the CLI is not running at the scheduled time **WHEN** it starts later **THEN** missed executions are detected and optionally run (configurable catch-up policy)

---

## Anti-Bot Acceptance Criteria Summary

| ID | Title | Spec | Error Codes | Edge Cases |
|----|-------|------|-------------|------------|
| CH-01 | CAPTCHA Detection | 63 | — | Overlapping signals, false positives |
| CH-02 | Solver Service Integration | 63 | 5091, 5093 | Solver timeout/fallback, low balance, all fail |
| CH-03 | reCAPTCHA v2 Token Injection | 63 | — | — |
| CH-04 | reCAPTCHA v3 Token Injection | 63 | — | — |
| CH-05 | Cookie Replay | 63 | — | Expired cookie, proxy IP change |
| ST-01 | Canvas Fingerprint Evasion | 64 | — | — |
| ST-02 | WebGL Fingerprint Spoofing | 64 | — | — |
| ST-03 | AudioContext Fingerprint Evasion | 64 | — | — |
| ST-04 | TLS/JA3 Fingerprint Rotation | 64 | 5200 | Bot blocklist, unsupported profile |
| ST-05 | Cookie Persistence Across Sessions | 64 | 5211 | Key rotation, DB corruption |
| ST-06 | Browser Automation Anti-Detection | 64 | — | Advanced bot detection (Akamai, PerimeterX) |
| ST-07 | Proxy Type Routing | 64 | 5312 | Type unavailable, escalation chain |
| PA-01 | Multi-Vendor Pool Initialization | 65 | 5300, 5311 | Vendor unreachable, all vendors fail |
| PA-02 | Domain-Specific Proxy Routing | 65 | 5303, 5312 | No healthy proxies, proxy banned |
| PA-03 | Auto-Replenishment | 65 | 5320 | Vendor rate limits, budget exhausted |
| PA-04 | Budget & Cost Tracking | 65 | 5322, 5340 | 90% budget warning, low vendor balance, DB unavailable |
| PA-05 | Proxy Health Monitoring | 65 | 5310 | Timeout, recovery re-add |

**Error Code Ranges:** CAPTCHA 5090–5099 · Stealth 5200–5224 · Proxy 5300–5341

---

## CAPTCHA Handling (63-captcha-handling.md)

### CH-01: CAPTCHA Detection

**GIVEN** a search engine response contains CAPTCHA signals  
**WHEN** the detection taxonomy evaluates the response  
**THEN** the CAPTCHA type is identified (reCAPTCHA v2, reCAPTCHA v3, hCaptcha, Turnstile, custom interstitial)  
**AND** a `CaptchaDetected` event is emitted with the type and confidence score

**Edge Cases:**
- **GIVEN** the response contains multiple overlapping CAPTCHA signals (e.g., reCAPTCHA script + hCaptcha div) **WHEN** detection runs **THEN** the highest-confidence match is selected
- **GIVEN** a false-positive CAPTCHA detection occurs on a legitimate page **WHEN** the confidence score is below 0.6 **THEN** the detection is discarded and normal parsing proceeds

### CH-02: Solver Service Integration

**GIVEN** a CAPTCHA is detected and solver services are configured  
**WHEN** the `SolverRouter` dispatches the solve request  
**THEN** the request is sent to the highest-priority solver (2Captcha or CapSolver)  
**AND** the solve completes within the configured timeout (default: 120s)  
**AND** the cost is recorded in the cost tracker

**Edge Cases:**
- **GIVEN** the primary solver (2Captcha) times out **WHEN** fallback is enabled **THEN** the request is re-dispatched to CapSolver
- **GIVEN** the solver account balance is below $0.50 **WHEN** a solve is requested **THEN** error `5093` is returned and the next solver is tried
- **GIVEN** all solvers fail **WHEN** the final attempt exhausts **THEN** error `5091` is returned with a consolidated failure report

### CH-03: reCAPTCHA v2 Token Injection

**GIVEN** a reCAPTCHA v2 challenge is solved and a token is returned  
**WHEN** the token is injected into the form  
**THEN** the `g-recaptcha-response` field is populated  
**AND** the form is submitted via POST  
**AND** the search results page is returned successfully

### CH-04: reCAPTCHA v3 Token Injection

**GIVEN** a reCAPTCHA v3 token is obtained  
**WHEN** the scraper retries the request  
**THEN** the token is attached via the configured method (header or query parameter)  
**AND** the response returns a valid search results page

### CH-05: Cookie Replay

**GIVEN** a CAPTCHA was previously solved for a domain+proxy combination  
**WHEN** a subsequent request is made with the same domain and proxy IP  
**THEN** the cached cookies from the `CookieStore` are replayed  
**AND** no new CAPTCHA solve is required  
**AND** the cookie TTL is validated before replay

**Edge Cases:**
- **GIVEN** the replayed cookie has expired **WHEN** the request receives a new CAPTCHA challenge **THEN** a fresh solve is triggered and the cookie store is updated
- **GIVEN** the proxy IP changes **WHEN** cookies are looked up **THEN** a cache miss occurs (composite key: `domain:proxyIP`) and a fresh solve proceeds

---

## Stealth Scraping (64-stealth-scraping.md)

### ST-01: Canvas Fingerprint Evasion

**GIVEN** the stealth scraper is configured with fingerprint evasion enabled  
**WHEN** a target page executes `canvas.toDataUrl()` or `canvas.toBlob()`  
**THEN** seeded pixel-level noise is injected into the output  
**AND** the noise is deterministic per session (same seed = same fingerprint)  
**AND** the resulting hash differs from the default headless browser hash

### ST-02: WebGL Fingerprint Spoofing

**GIVEN** stealth mode is active  
**WHEN** a target page queries `WEBGL_debug_renderer_info` for vendor/renderer strings  
**THEN** the values are overridden to match a common consumer GPU (e.g., "ANGLE (Intel, Intel(R) UHD Graphics 620)")  
**AND** the spoofed values are consistent within a single session

### ST-03: AudioContext Fingerprint Evasion

**GIVEN** stealth mode is active  
**WHEN** a target page creates an `OfflineAudioContext` and processes a signal  
**THEN** sample-level noise is added to the output buffer  
**AND** the resulting fingerprint hash differs from the default headless browser value

### ST-04: TLS/JA3 Fingerprint Rotation

**GIVEN** uTLS is configured with browser profiles  
**WHEN** a TLS handshake is initiated  
**THEN** the ClientHello matches the signature of the selected browser profile (Chrome 120+, Firefox, Safari, or Edge)  
**AND** the JA3 hash matches known real-browser hashes  
**AND** profiles are rotated per-session or per-request based on configuration

**Edge Cases:**
- **GIVEN** the target validates JA3 hashes against a known-bot blocklist **WHEN** the scraper connects **THEN** the spoofed JA3 hash passes validation
- **GIVEN** an unsupported browser profile is configured **WHEN** uTLS initializes **THEN** error `5200` is returned with a list of supported profiles

### ST-05: Cookie Persistence Across Sessions

**GIVEN** authenticated cookies exist in the AES-256 encrypted `CookieStore`  
**WHEN** a new CLI session starts and targets the same domain+proxy  
**THEN** cookies are decrypted and attached to the request  
**AND** the session continues without re-authentication

**Edge Cases:**
- **GIVEN** the encryption key is rotated **WHEN** old cookies are decrypted **THEN** decryption fails gracefully with error `5211` and a fresh session is started
- **GIVEN** the `CookieStore` database is corrupted **WHEN** a read is attempted **THEN** the corruption is logged, the store is rebuilt, and a fresh session proceeds

### ST-06: Browser Automation Anti-Detection

**GIVEN** go-rod is launched in stealth mode  
**WHEN** a target page checks `navigator.webdriver` or `window.chrome.runtime`  
**THEN** `navigator.webdriver` returns `false`  
**AND** `window.chrome.runtime` is present and non-empty  
**AND** the `AutomationControlled` Chrome flag is disabled

**Edge Cases:**
- **GIVEN** the target runs advanced bot detection (e.g., Akamai, PerimeterX) **WHEN** multiple signals are checked simultaneously **THEN** all injected overrides (navigator, chrome, permissions, plugins) pass validation consistently

### ST-07: Proxy Type Routing

> **Cross-ref:** See also PA-02 (Domain-Specific Proxy Routing) for acquisition-side routing logic.

**GIVEN** a domain routing table maps `google.com` to `Residential`  
**WHEN** a scraping request targets `google.com`  
**THEN** a residential proxy is selected from the pool  
**AND** datacenter proxies are not used for that request

**Edge Cases:**
- **GIVEN** no residential proxies are available **WHEN** `google.com` is targeted **THEN** the system escalates to ISP proxies, then Mobile, before returning `ErrProxyTypeUnavailable` (5312)

---

## Proxy Acquisition (65-proxy-acquisition.md)

### PA-01: Multi-Vendor Proxy Pool Initialization

**GIVEN** proxy vendor credentials are configured (BrightData, Oxylabs, SmartProxy)  
**WHEN** the proxy pool initializes  
**THEN** proxies are fetched from all configured vendors  
**AND** each proxy is health-checked and classified by ASN type (Residential, Datacenter, ISP, Mobile)  
**AND** unhealthy proxies are excluded from the active pool

**Edge Cases:**
- **GIVEN** a vendor API is unreachable **WHEN** initialization runs **THEN** error `5300` is logged and remaining vendors are loaded
- **GIVEN** all vendors fail **WHEN** initialization completes **THEN** error `5311` (`ErrNoHealthyProxies`) is returned

### PA-02: Domain-Specific Proxy Routing

> **Cross-ref:** See also ST-07 (Proxy Type Routing) for stealth-layer routing logic.

**GIVEN** a domain routing table maps domains to proxy types (e.g., `google.com → Residential`)  
**WHEN** a request targets a mapped domain  
**THEN** a proxy of the required type is selected from the pool  
**AND** the selection uses weighted random from healthy proxies of that type

**Edge Cases:**
- **GIVEN** the required proxy type has no healthy proxies **WHEN** routing runs **THEN** fallback escalation applies (Residential → ISP → Mobile) before returning `5312`
- **GIVEN** a proxy is banned for the target domain **WHEN** selection runs **THEN** error `5303` is recorded and the proxy is excluded for that domain

### PA-03: Auto-Replenishment

**GIVEN** the healthy proxy count for a type drops below the configured minimum threshold  
**WHEN** the replenishment check runs  
**THEN** new proxies are acquired from the preferred vendor for that type  
**AND** the acquisition is logged with cost and count

**Edge Cases:**
- **GIVEN** replenishment fails due to vendor rate limits **WHEN** retry runs **THEN** exponential backoff is applied up to 3 retries
- **GIVEN** the budget is exhausted **WHEN** replenishment is attempted **THEN** error `5320` (`ErrBudgetExceeded`) is returned and no purchase is made

### PA-04: Budget & Cost Tracking

**GIVEN** a monthly proxy budget is configured  
**WHEN** a proxy purchase or CAPTCHA solve incurs cost  
**THEN** the cost is recorded with timestamp, vendor, proxy type, and amount  
**AND** cumulative spend is tracked against the budget

**Edge Cases:**
- **GIVEN** cumulative spend reaches 90% of budget **WHEN** a cost event is recorded **THEN** a `BudgetWarning` alert is emitted
- **GIVEN** the vendor account balance is below the configured threshold **WHEN** a purchase is attempted **THEN** error `5322` (`ErrVendorBalanceLow`) is returned
- **GIVEN** the cost tracking database is unavailable **WHEN** a cost event occurs **THEN** error `5340` is logged and the operation proceeds (cost tracking is non-blocking)

### PA-05: Proxy Health Monitoring

**GIVEN** the proxy pool contains active proxies  
**WHEN** the health-check interval triggers  
**THEN** each proxy is tested for connectivity and response time  
**AND** proxies exceeding the latency threshold or failing connectivity are marked unhealthy  
**AND** proxies with consecutive failures exceeding the threshold are removed from the pool

**Edge Cases:**
- **GIVEN** a proxy times out during health check **WHEN** the timeout threshold is exceeded **THEN** error `5310` (`ErrProxyConnTimeout`) is recorded and the proxy's failure count increments
- **GIVEN** a previously unhealthy proxy recovers **WHEN** the next health check succeeds **THEN** the proxy is re-added to the active pool

---

*Wave 8: Added proxy acquisition (PA-01–PA-05) acceptance criteria for anti-bot infrastructure spec 65.*
