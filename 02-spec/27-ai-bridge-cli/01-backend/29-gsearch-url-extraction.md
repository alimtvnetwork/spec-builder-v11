# GSearch URL Extraction & Content Analysis

> **Version:** 5.0.0  
> **Status:** Draft  
> **Last Updated:** 2026-03-09

---

## Overview

GSearch provides comprehensive URL content extraction with multiple output formats, intelligent caching, writing style analysis, nested depth crawling, and authority/traffic metrics. This module supports the SEO content generation pipeline by extracting reference articles for training.

---

## Core Capabilities

| Feature | Description |
|---------|-------------|
| Multi-Format Output | text, markdown, html, json, yaml, simple-html |
| Intelligent Caching | 5-day default TTL from global settings with force-refresh |
| Style Analysis | Sentence/paragraph/vocabulary metrics (EEAT-focused) |
| Nested Depth Crawling | Follow links to configurable depth levels |
| Authority Scoring | Ahrefs integration for domain authority, traffic |
| SSRF Protection | Blocks private IP ranges |
| Image URL Extraction | Optional image URL collection |

---

## CLI Commands

### Basic Extraction

```bash
# Extract with default format (markdown)
gsearch extract https://example.com/article

# Specify output format
gsearch extract https://example.com/article --format markdown
gsearch extract https://example.com/article --format text
gsearch extract https://example.com/article --format html
gsearch extract https://example.com/article --format simple-html
gsearch extract https://example.com/article --format json
gsearch extract https://example.com/article --format yaml

# Multiple formats at once
gsearch extract https://example.com/article --format text,markdown,html,json,yaml

# With style analysis
gsearch extract https://example.com/article --format markdown --analyze-style

# Force refresh (bypass and clear cache)
gsearch extract https://example.com/article --force

# Custom cache duration (overrides global setting)
gsearch extract https://example.com/article --cache-days 7

# Nested depth crawling (follow links)
gsearch extract https://example.com/article --depth 2

# Include authority/traffic metrics (requires Ahrefs API)
gsearch extract https://example.com/article --authority

# Include image URLs
gsearch extract https://example.com/article --include-images

# Output to file
gsearch extract https://example.com/article --format markdown -o article.md

# JSON output (for piping)
gsearch extract https://example.com/article --format markdown --output-json

# Full extraction with all features
gsearch extract https://example.com/article \
  --format text,markdown,html,simple-html,json,yaml \
  --analyze-style \
  --authority \
  --depth 2 \
  --include-images
```

### CLI Flags

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--format` | `-f` | `markdown` | Output format(s): text, markdown, html, simple-html, json, yaml |
| `--force` | `-F` | false | Force refresh: delete existing cache then fetch fresh |
| `--cache-days` | `-c` | 5 | Cache duration in days (default from global settings) |
| `--analyze-style` | `-a` | false | Extract EEAT writing style metrics |
| `--include-images` | `-i` | false | Extract image URLs |
| `--depth` | `-d` | 0 | Nested link depth (0=current page only, max 5) |
| `--authority` | `-A` | false | Include authority/traffic metrics (Ahrefs) |
| `--output` | `-o` | stdout | Output file path |
| `--output-json` | `-j` | false | Wrap output in JSON (for scripting) |
| `--quiet` | `-q` | false | Suppress progress output |

---

## Output Formats

### 1. Plain Text (`--format text`)

Extracts visible text content only, preserving paragraph structure. Best for AI training where formatting is irrelevant.

```text
Expert Guide to Carpet Maintenance

Maintaining your carpet requires regular attention and the right techniques. Professional cleaning extends carpet life significantly.

Why Regular Cleaning Matters

Carpets trap allergens, dust mites, and bacteria deep within their fibers. Regular vacuuming removes surface debris, but professional steam cleaning eliminates embedded contaminants.

Allergen removal: Reduces respiratory issues
Stain prevention: Quick treatment prevents permanent marks
Odor control: Eliminates trapped odors

"Quality cleaning transforms living spaces" — Expert Source

[...]
```

**Characteristics:**
- No formatting (bold, italics)
- No links or URLs
- Paragraphs separated by blank lines
- Headings preserved as text with blank lines
- Lists converted to plain lines
- Quotes preserved as text

### 2. Simple Markdown (`--format markdown`)

Clean markdown preserving structure without complex elements. Best for content display and editing.

```markdown
# Expert Guide to Carpet Maintenance

Maintaining your carpet requires regular attention and the right techniques. Professional cleaning extends carpet life significantly.

## Why Regular Cleaning Matters

Carpets trap allergens, dust mites, and bacteria deep within their fibers. Regular vacuuming removes surface debris, but professional steam cleaning eliminates embedded contaminants.

- **Allergen removal**: Reduces respiratory issues
- **Stain prevention**: Quick treatment prevents permanent marks
- **Odor control**: Eliminates trapped odors

> "Quality cleaning transforms living spaces" — Expert Source

[Read more about steam cleaning](https://example.com/steam-cleaning)
```

**Characteristics:**
- Headers (H1-H6) preserved with `#` syntax
- Bold/italic preserved
- Lists preserved (bullet and numbered)
- Links preserved with `[text](url)` format
- Blockquotes preserved
- No tables (converted to lists)
- No images embedded (URLs optionally listed at end)

### 3. Simple HTML (`--format simple-html`)

**Minimal HTML with only semantic header hierarchy.** Strips ALL complexity—no body, head, div, span, or structural tags. Only headers and their content paragraphs.

```html
<h1>Expert Guide to Carpet Maintenance</h1>
<p>Maintaining your carpet requires regular attention and the right techniques. Professional cleaning extends carpet life significantly.</p>

<h2>Why Regular Cleaning Matters</h2>
<p>Carpets trap allergens, dust mites, and bacteria deep within their fibers. Regular vacuuming removes surface debris, but professional steam cleaning eliminates embedded contaminants.</p>
<p>Allergen removal: Reduces respiratory issues</p>
<p>Stain prevention: Quick treatment prevents permanent marks</p>
<p>Odor control: Eliminates trapped odors</p>

<h2>Professional vs DIY Cleaning</h2>
<p>Professional cleaning uses industrial equipment that reaches deep into carpet fibers.</p>
```

**Characteristics:**
- **ONLY** `<h1>` through `<h6>` and `<p>` tags
- No `<html>`, `<head>`, `<body>`, `<article>`, `<section>`, `<div>`, `<span>`
- No `<script>`, `<style>`, `<noscript>`
- No inline styles or event handlers
- No `<ul>`, `<ol>`, `<li>` — lists converted to paragraphs
- No `<strong>`, `<em>`, `<a>` — stripped to plain text
- Header levels preserved exactly as source (h1 → h1, h2 → h2)
- Perfect for jQuery-like DOM traversal to extract header+content pairs

**Implementation Notes:**
This format is designed for programmatic parsing where you need to:
1. Get each header and its "description" (following paragraphs until next header)
2. Build structured content hierarchies
3. Feed to AI without HTML noise

```go
// Example DOM traversal logic
func ExtractHeaderSections(simpleHtml string) []HeaderSection {
    doc, _ := goquery.NewDocumentFromReader(strings.NewReader(simpleHtml))
    var sections []HeaderSection
    
    doc.Find("h1, h2, h3, h4, h5, h6").Each(func(i int, s *goquery.Selection) {
        section := HeaderSection{
            Level:   getHeaderLevel(s),
            Title:   s.Text(),
            Content: "",
        }
        
        // Get all following <p> until next header
        for sibling := s.Next(); sibling.Length() > 0; sibling = sibling.Next() {
            if isHeader(sibling) {
                break
            }
            if goquery.NodeName(sibling) == "p" {
                section.Content += sibling.Text() + "\n"
            }
        }
        sections = append(sections, section)
    })
    return sections
}
```

### 4. Cleaned HTML (`--format html`)

Full cleaned HTML with semantic structure preserved but scripts/styles removed.

```html
<article>
  <h1>Expert Guide to Carpet Maintenance</h1>
  
  <p>Maintaining your carpet requires regular attention and the right techniques. Professional cleaning extends carpet life significantly.</p>
  
  <h2>Why Regular Cleaning Matters</h2>
  
  <p>Carpets trap allergens, dust mites, and bacteria deep within their fibers. Regular vacuuming removes surface debris, but <strong>professional steam cleaning</strong> eliminates embedded contaminants.</p>
  
  <ul>
    <li><strong>Allergen removal</strong>: Reduces respiratory issues</li>
    <li><strong>Stain prevention</strong>: Quick treatment prevents permanent marks</li>
  </ul>
  
  <blockquote>
    <p>"Quality cleaning transforms living spaces" — Expert Source</p>
  </blockquote>
</article>
```

**Characteristics:**
- `<script>`, `<style>`, `<noscript>` removed
- Inline styles removed
- Event handlers removed
- Semantic tags preserved (article, section, header, footer)
- Links preserved
- Lists, blockquotes, strong/em preserved
- Images optionally preserved as `<img src="...">`

### 5. Structured JSON (`--format json`)

Fully structured extraction with all metadata, ideal for programmatic processing.

```json
{
  "Url": "https://example.com/article",
  "Title": "Expert Guide to Carpet Maintenance",
  "MetaDescription": "Learn professional carpet maintenance techniques...",
  "ExtractedAt": "2026-02-03T10:00:00Z",
  "CacheExpiry": "2026-02-08T10:00:00Z",
  "Cached": false,
  "WordCount": 1250,
  "ReadingTime": "5 min",
  "Content": {
    "Text": "Expert Guide to Carpet Maintenance\n\nMaintaining your carpet...",
    "Markdown": "# Expert Guide to Carpet Maintenance\n\nMaintaining...",
    "Html": "<article><h1>Expert Guide...</h1></article>",
    "SimpleHtml": "<h1>Expert Guide...</h1><p>Maintaining...</p>"
  },
  "Structure": {
    "Headings": [
      {"Level": 1, "Text": "Expert Guide to Carpet Maintenance", "Anchor": ""},
      {"Level": 2, "Text": "Why Regular Cleaning Matters", "Anchor": "why-regular-cleaning-matters"},
      {"Level": 2, "Text": "Professional vs DIY Cleaning", "Anchor": "professional-vs-diy"}
    ],
    "Paragraphs": [
      {"Index": 1, "Text": "Maintaining your carpet requires...", "WordCount": 45, "AfterHeading": 1},
      {"Index": 2, "Text": "Carpets trap allergens...", "WordCount": 52, "AfterHeading": 2}
    ],
    "HeaderSections": [
      {
        "Level": 1,
        "Title": "Expert Guide to Carpet Maintenance",
        "Content": "Maintaining your carpet requires regular attention...",
        "Children": [
          {
            "Level": 2,
            "Title": "Why Regular Cleaning Matters",
            "Content": "Carpets trap allergens, dust mites...",
            "Children": []
          }
        ]
      }
    ],
    "Lists": [
      {"Type": "unordered", "Items": ["Allergen removal: Reduces...", "Stain prevention: Quick..."]}
    ],
    "Quotes": [
      {"Text": "Quality cleaning transforms living spaces", "Author": "Expert Source"}
    ],
    "Links": [
      {"Text": "steam cleaning", "Url": "https://example.com/steam-cleaning", "IsExternal": false}
    ]
  },
  "Images": [
    {"Src": "https://example.com/images/carpet.jpg", "Alt": "Clean carpet example", "Width": 800, "Height": 600}
  ],
  "Metadata": {
    "Author": "John Smith",
    "PublishedDate": "2026-01-15",
    "ModifiedDate": "2026-01-20",
    "Language": "en",
    "OgImage": "https://example.com/og-image.jpg",
    "Canonical": "https://example.com/article"
  },
  "NestedLinks": [
    {
      "Url": "https://example.com/steam-cleaning",
      "Title": "Steam Cleaning Guide",
      "Snippet": "Professional steam cleaning methods...",
      "Depth": 1
    }
  ],
  "Authority": {
    "DomainAuthority": 67,
    "PageAuthority": 42,
    "BacklinkCount": 1250,
    "ReferringDomains": 89,
    "OrganicTraffic": 15000,
    "TrafficValue": 12500,
    "TopKeywords": ["carpet maintenance", "carpet cleaning tips"],
    "Source": "ahrefs",
    "FetchedAt": "2026-02-03T10:00:00Z"
  }
}
```

### 6. YAML Output (`--format yaml`)

Human-readable structured format, equivalent to JSON but in YAML syntax.

```yaml
Url: https://example.com/article
Title: Expert Guide to Carpet Maintenance
MetaDescription: Learn professional carpet maintenance techniques...
ExtractedAt: 2026-02-03T10:00:00Z
CacheExpiry: 2026-02-08T10:00:00Z
Cached: false
WordCount: 1250
ReadingTime: 5 min

Content:
  Text: |
    Expert Guide to Carpet Maintenance
    
    Maintaining your carpet requires regular attention...
  Markdown: |
    # Expert Guide to Carpet Maintenance
    
    Maintaining your carpet...
  SimpleHtml: |
    <h1>Expert Guide to Carpet Maintenance</h1>
    <p>Maintaining your carpet...</p>

Structure:
  Headings:
    - Level: 1
      Text: Expert Guide to Carpet Maintenance
      Anchor: ""
    - Level: 2
      Text: Why Regular Cleaning Matters
      Anchor: why-regular-cleaning-matters
  
  HeaderSections:
    - Level: 1
      Title: Expert Guide to Carpet Maintenance
      Content: Maintaining your carpet requires regular attention...
      Children:
        - Level: 2
          Title: Why Regular Cleaning Matters
          Content: Carpets trap allergens, dust mites...
          Children: []

Metadata:
  Author: John Smith
  PublishedDate: 2026-01-15
  Language: en

Authority:
  DomainAuthority: 67
  PageAuthority: 42
  OrganicTraffic: 15000
  Source: ahrefs
```

**Use Cases for YAML:**
- Human review of extracted content
- Configuration files that embed extracted data
- Version control diffs (more readable than JSON)
- Template engines that prefer YAML

## Writing Style Analysis

When `--analyze-style` is enabled, GSearch extracts detailed writing metrics.

### Style Metrics

```json
{
  "Style": {
    "SentenceMetrics": {
      "Total": 85,
      "AvgLength": 14.5,
      "MinLength": 4,
      "MaxLength": 28,
      "StdDev": 4.2
    },
    "ParagraphMetrics": {
      "Total": 18,
      "AvgLength": 145.5,
      "AvgSentences": 4.2
    },
    "StructureMetrics": {
      "HeadingsPerKWords": 3.2,
      "ListsPerKWords": 1.5,
      "LinksPerKWords": 2.8,
      "QuotesPerKWords": 0.4
    },
    "VocabularyMetrics": {
      "TotalWords": 1250,
      "UniqueWords": 485,
      "UniqueRatio": 0.388,
      "AvgWordLength": 5.2,
      "ComplexWordRatio": 0.12
    },
    "TransitionAnalysis": {
      "TransitionWordRate": 0.42,
      "CommonTransitions": ["Furthermore", "Moreover", "Additionally", "However"],
      "SentenceStarters": ["The", "This", "Furthermore", "Professional", "Regular"]
    },
    "ToneAnalysis": {
      "FormalityScore": 0.65,
      "ReadabilityScore": 68.5,
      "ReadabilityGrade": "8th grade",
      "SentimentScore": 0.15,
      "SentimentLabel": "slightly positive"
    },
    "PatternAnalysis": {
      "VoicePattern": "active",
      "VoiceActiveRatio": 0.82,
      "TensePattern": "present",
      "TensePresentRatio": 0.75,
      "CommonPhrases": [
        {"Phrase": "professional cleaning", "Count": 8},
        {"Phrase": "carpet maintenance", "Count": 6}
      ]
    }
  }
}
```

### Style Analysis Algorithms

#### Formality Score (0.0 - 1.0)

```go
func CalculateFormalityScore(text string) float64 {
    var score float64 = 0.5
    
    // Increase formality indicators
    score += countPassiveVoice(text) * 0.02      // Passive voice
    score += countNominalizations(text) * 0.01   // -tion, -ment, -ness words
    score += countLongWords(text) * 0.005        // 7+ character words
    score += countThirdPerson(text) * 0.01       // Third person pronouns
    
    // Decrease formality indicators
    score -= countContractions(text) * 0.03      // don't, won't, etc.
    score -= countFirstPerson(text) * 0.02       // I, we, me
    score -= countExclamations(text) * 0.05      // Exclamation marks
    score -= countInformalWords(text) * 0.02     // gonna, wanna, etc.
    
    return clamp(score, 0.0, 1.0)
}
```

#### Readability Score (Flesch-Kincaid)

```go
// ReadabilityScore holds the result of readability analysis
type ReadabilityScore struct {
    Score float64
    Grade string
}

func CalculateReadability(text string) ReadabilityScore {
    words := countWords(text)
    sentences := countSentences(text)
    syllables := countSyllables(text)
    
    // Flesch Reading Ease
    score := 206.835 - 1.015*(float64(words)/float64(sentences)) - 
            84.6*(float64(syllables)/float64(words))
    
    // Grade level
    gradeLevel := 0.39*(float64(words)/float64(sentences)) + 
                  11.8*(float64(syllables)/float64(words)) - 15.59
    
    return ReadabilityScore{Score: score, Grade: gradeToString(gradeLevel)}
}
```

---

## Nested Depth Crawling

When `--depth N` is specified (N > 0), GSearch follows internal links to build context.

### Depth Behavior

| Depth | Behavior |
|-------|----------|
| 0 | Current page only (default) |
| 1 | Current page + all linked pages |
| 2 | Current + linked + links-from-linked |
| 3-5 | Recursive up to max depth 5 |

### Nested Link Extraction

```go
type NestedLink struct {
    Url      string `json:",omitempty"`
    Title    string `json:",omitempty"`
    Snippet  string `json:",omitempty"` // First 200 chars of content
    Depth    int    `json:",omitempty"` // Distance from original URL
    Relation string `json:",omitempty"` // "internal", "external"
}

func ExtractWithDepth(url string, opts ExtractOptions) appfault.Result[*ExtractResult] {
    result := ExtractUrl(url, opts)
    
    if opts.Depth == 0 {
        return result, nil
    }
    
    // Extract links from current page
    links := result.Structure.Links
    visited := map[string]bool{url: true}
    
    for depth := 1; depth <= opts.Depth; depth++ {
        var currentLevelLinks []Link
        
        for _, link := range links {
            if visited[link.Url] {
                continue
            }
            if !isInternalLink(link.Url, url) {
                continue // Only follow internal links
            }
            
            visited[link.Url] = true
            
            // Light extraction for nested pages (text + title only)
            nested, err := ExtractUrl(link.Url, ExtractOptions{
                Formats:   []string{"text"},
                CacheDays: opts.CacheDays,
            })
            if err != nil {
                continue
            }
            
            result.NestedLinks = append(result.NestedLinks, NestedLink{
                Url:     link.Url,
                Title:   nested.Title,
                Snippet: truncate(nested.Content.Text, 200),
                Depth:   depth,
            })
            
            // Collect links for next depth level
            currentLevelLinks = append(currentLevelLinks, nested.Structure.Links...)
        }
        
        links = currentLevelLinks
    }
    
    return result, nil
}
```

### CLI Examples

```bash
# Extract with 2 levels of link following
gsearch extract https://docs.example.com/api --depth 2

# Output includes NestedLinks array with linked page info
```

---

## Authority & Traffic Metrics (Ahrefs API v3)

When `--authority` flag is used, GSearch fetches domain/page metrics via Ahrefs API v3.

> **API Version:** v3 (v2 deprecated since Nov 2025)  
> **Base URL:** `https://api.ahrefs.com/v3/site-explorer/`  
> **Documentation:** https://docs.ahrefs.com/docs/api/

---

### Authentication

Ahrefs API uses Bearer token authentication:

```go
const AhrefsBaseUrl = "https://api.ahrefs.com/v3/site-explorer"

func newAhrefsRequest(endpoint string, params url.Values) appfault.Result[*http.Request] {
    apiKey := config.Get("Ahrefs.ApiKey")
    if apiKey == "" {
        return nil, ErrAhrefsNotConfigured
    }
    
    fullUrl := fmt.Sprintf("%s/%s?%s", AhrefsBaseUrl, endpoint, params.Encode())
    
    req, err := http.NewRequest(httpmethod.Get.String(), fullUrl, nil)
    if err != nil {
        return nil, err
    }
    
    req.Header.Set("Accept", "application/json")
    req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", apiKey))
    
    return req, nil
}
```

**Environment Variable:** `AHREFS_API_KEY`

---

### Rate Limits

| Plan | Requests/Second | Monthly Rows |
|------|-----------------|--------------|
| Lite | 1 req/s | 500K rows |
| Standard | 2 req/s | 2M rows |
| Advanced | 5 req/s | 10M rows |
| Enterprise | 10 req/s | 50M+ rows |

**Implementation:**

```go
type AhrefsRateLimiter struct {
    limiter  *rate.Limiter
    mu       sync.Mutex
    rowsUsed int64
    rowLimit int64
}

func NewAhrefsRateLimiter(reqPerSec float64, rowLimit int64) *AhrefsRateLimiter {
    return &AhrefsRateLimiter{
        limiter:  rate.NewLimiter(rate.Limit(reqPerSec), 1),
        rowLimit: rowLimit,
    }
}

// EXEMPTED: Wait wraps stdlib rate.Limiter.Wait — must return error for context interface compatibility
func (r *AhrefsRateLimiter) Wait(context stdctx.Context) error {
    return r.limiter.Wait(ctx)
}

func (r *AhrefsRateLimiter) TrackRows(count int64) *appfault.AppError {
    r.mu.Lock()
    defer r.mu.Unlock()
    
    r.rowsUsed += count
    if r.rowsUsed > r.rowLimit {
        return appfault.New(
            ErrAhrefsRowLimitExceeded,
            "ahrefs row limit exceeded: %d/%d",
            r.rowsUsed,
            r.rowLimit,
        )
    }

    return nil
}
```

---

### Error Handling

| HTTP Code | Error | Description | Action |
|-----------|-------|-------------|--------|
| 400 | Bad Request | Invalid parameters | Check target format |
| 401 | Unauthorized | Invalid API key | Verify AHREFS_API_KEY |
| 403 | Forbidden | Insufficient plan | Upgrade or reduce scope |
| 404 | Not Found | No data for target | Return empty metrics |
| 429 | Too Many Requests | Rate limit exceeded | Back off and retry |
| 500 | Server Error | Ahrefs internal error | Retry with exponential backoff |

```go
type AhrefsError struct {
    StatusCode int
    Message    string
    Retryable  bool
}

func (e *AhrefsError) Error() string {
    return fmt.Sprintf("ahrefs error %d: %s", e.StatusCode, e.Message)
}

func handleAhrefsResponse(resp *http.Response) *appfault.AppError {
    if resp.StatusCode == 200 {
        return nil
    }
    
    body, _ := io.ReadAll(resp.Body)
    
    switch resp.StatusCode {
    case 401:
        return appfault.New(
            ErrAhrefsUnauthorized,
            "invalid API key",
        ).WithStatusCode(401)
    case 403:
        return appfault.New(
            ErrAhrefsForbidden,
            "insufficient plan permissions",
        ).WithStatusCode(403)
    case 404:
        return appfault.New(
            ErrAhrefsNotFound,
            "no data available for target",
        ).WithStatusCode(404)
    case 429:
        return appfault.New(
            ErrAhrefsRateLimited,
            "rate limit exceeded",
        ).WithStatusCode(429)
    case 500, 502, 503:
        return appfault.New(
            ErrAhrefsServerError,
            "server error: %s",
            string(body),
        ).WithStatusCode(resp.StatusCode)
    default:
        return appfault.New(
            ErrAhrefsUnknown,
            "unexpected response %d: %s",
            resp.StatusCode,
            string(body),
        ).WithStatusCode(resp.StatusCode)
    }
}

func fetchWithRetry(req *http.Request, maxRetries int) appfault.Result[*http.Response] {
    client := &http.Client{Timeout: 30 * time.Second}
    
    for attempt := 0; attempt <= maxRetries; attempt++ {
        resp, err := client.Do(req)
        if err != nil {
            return nil, err
        }
        
        if resp.StatusCode == 200 {
            return resp, nil
        }
        
        ahrefsErr := handleAhrefsResponse(resp)
        var aerr *AhrefsError
        isRetryable := errors.As(ahrefsErr, &aerr) && aerr.Retryable
        if isRetryable {
            resp.Body.Close()
            backoff := time.Duration(math.Pow(2, float64(attempt))) * time.Second
            time.Sleep(backoff)
            continue
        }
        
        return nil, ahrefsErr
    }
    
    return nil, &AhrefsError{0, "Max retries exceeded", false}
}
```

---

### Endpoint 1: Domain Rating

**Endpoint:** `GET /v3/site-explorer/domain-rating`

**Purpose:** Get Domain Rating (DR) score 0-100

**Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| `target` | Yes | Domain (e.g., "example.com") |
| `date` | No | Date for historical data (YYYY-MM-DD) |

**Response:**

```json
{
  "domain_rating": {
    "domain_rating": 67,
    "ahrefs_rank": 12345
  }
}
```

**Implementation:**

```go
// EXEMPTED: Ahrefs external API response contract
type DomainRatingResponse struct {
    DomainRating struct {
        DomainRating int `json:"domain_rating"`
        AhrefsRank   int `json:"ahrefs_rank"`
    } `json:"domain_rating"`
}

func FetchDomainRating(domain string) appfault.Result[DomainRatingResult] {
    params := url.Values{}
    params.Set("target", domain)
    params.Set("date", time.Now().Format("2006-01-02"))
    
    req, err := newAhrefsRequest("domain-rating", params)
    if err != nil {
        return 0, 0, err
    }
    
    resp, err := fetchWithRetry(req, 3)
    if err != nil {
        return 0, 0, err
    }
    defer resp.Body.Close()
    
    var result DomainRatingResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return 0, 0, err
    }
    
    return result.DomainRating.DomainRating, result.DomainRating.AhrefsRank, nil
}
```

---

### Endpoint 2: URL Rating

**Endpoint:** `GET /v3/site-explorer/url-rating`

**Purpose:** Get URL Rating (UR) score 0-100 for specific page

**Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| `target` | Yes | Full URL (e.g., "https://example.com/page") |
| `date` | No | Date for historical data |

**Response:**

```json
{
  "url_rating": {
    "url_rating": 42
  }
}
```

**Implementation:**

```go
// EXEMPTED: Ahrefs external API response contract
type UrlRatingResponse struct {
    UrlRating struct {
        UrlRating int `json:"url_rating"`
    } `json:"url_rating"`
}

func FetchUrlRating(targetUrl string) appfault.Result[int] {
    params := url.Values{}
    params.Set("target", targetUrl)
    params.Set("date", time.Now().Format("2006-01-02"))
    
    req, err := newAhrefsRequest("url-rating", params)
    if err != nil {
        return 0, err
    }
    
    resp, err := fetchWithRetry(req, 3)
    if err != nil {
        return 0, err
    }
    defer resp.Body.Close()
    
    var result UrlRatingResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return 0, err
    }
    
    return result.UrlRating.UrlRating, nil
}
```

---

### Endpoint 3: Backlinks Stats

**Endpoint:** `GET /v3/site-explorer/backlinks-stats`

**Purpose:** Get backlink counts and referring domains

**Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| `target` | Yes | Domain or URL |
| `mode` | No | "exact", "prefix", "domain", "subdomains" (default: domain) |
| `date` | No | Date for historical data |

**Response:**

```json
{
  "metrics": {
    "live": 125000,
    "all_time": 450000,
    "live_refdomains": 890,
    "all_time_refdomains": 2100
  }
}
```

**Implementation:**

```go
// EXEMPTED: Ahrefs external API response contract
type BacklinksStatsResponse struct {
    Metrics struct {
        Live              int64 `json:"live"`
        AllTime           int64 `json:"all_time"`
        LiveRefdomains    int   `json:"live_refdomains"`
        AllTimeRefdomains int   `json:"all_time_refdomains"`
    } `json:"metrics"`
}

func FetchBacklinksStats(domain string) appfault.Result[*BacklinksStatsResponse] {
    params := url.Values{}
    params.Set("target", domain)
    params.Set("mode", "domain")
    params.Set("date", time.Now().Format("2006-01-02"))
    
    req, err := newAhrefsRequest("backlinks-stats", params)
    if err != nil {
        return nil, err
    }
    
    resp, err := fetchWithRetry(req, 3)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var result BacklinksStatsResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }
    
    return &result, nil
}
```

---

### Endpoint 4: Organic Traffic

**Endpoint:** `GET /v3/site-explorer/metrics`

**Purpose:** Get organic traffic estimates and traffic value

**Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| `target` | Yes | Domain |
| `mode` | No | "domain", "subdomains" |
| `country` | No | Two-letter country code (e.g., "us") |
| `date` | No | Date for historical data |

**Response:**

```json
{
  "metrics": {
    "org_traffic": 15000,
    "org_traffic_value": 12500.50,
    "org_keywords": 2500,
    "org_keywords_1_3": 150
  }
}
```

**Implementation:**

```go
// EXEMPTED: Ahrefs external API response contract
type OrganicTrafficResponse struct {
    Metrics struct {
        OrgTraffic      int64   `json:"org_traffic"`
        OrgTrafficValue float64 `json:"org_traffic_value"`
        OrgKeywords     int     `json:"org_keywords"`
        OrgKeywords1To3 int     `json:"org_keywords_1_3"` // Top 3 positions
    } `json:"metrics"`
}

func FetchOrganicTraffic(domain string, country string) appfault.Result[*OrganicTrafficResponse] {
    params := url.Values{}
    params.Set("target", domain)
    params.Set("mode", "domain")
    if country != "" {
        params.Set("country", country)
    }
    params.Set("date", time.Now().Format("2006-01-02"))
    
    req, err := newAhrefsRequest("metrics", params)
    if err != nil {
        return nil, err
    }
    
    resp, err := fetchWithRetry(req, 3)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var result OrganicTrafficResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }
    
    return &result, nil
}
```

---

### Endpoint 5: Top Pages (Keywords)

**Endpoint:** `GET /v3/site-explorer/top-pages`

**Purpose:** Get top-ranking pages and their keywords

**Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| `target` | Yes | Domain |
| `mode` | No | "domain", "subdomains" |
| `country` | No | Two-letter country code |
| `limit` | No | Max results (default: 10, max: 1000) |
| `order_by` | No | "traffic", "top_keyword" (default: traffic) |

**Response:**

```json
{
  "pages": [
    {
      "url": "https://example.com/best-page",
      "traffic": 5000,
      "traffic_value": 4200.00,
      "top_keyword": "best example guide",
      "top_keyword_volume": 12000,
      "top_keyword_position": 2
    }
  ]
}
```

**Implementation:**

```go
// EXEMPTED: Ahrefs external API response contract
type TopPagesResponse struct {
    Pages []struct {
        Url                string  `json:"url"`
        Traffic            int64   `json:"traffic"`
        TrafficValue       float64 `json:"traffic_value"`
        TopKeyword         string  `json:"top_keyword"`
        TopKeywordVolume   int     `json:"top_keyword_volume"`
        TopKeywordPosition int     `json:"top_keyword_position"`
    } `json:"pages"`
}

func FetchTopPages(domain string, limit int) appfault.ResultSlice[string] {
    params := url.Values{}
    params.Set("target", domain)
    params.Set("mode", "domain")
    params.Set("limit", strconv.Itoa(limit))
    params.Set("order_by", "traffic")
    
    req, err := newAhrefsRequest("top-pages", params)
    if err != nil {
        return nil, err
    }
    
    resp, err := fetchWithRetry(req, 3)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var result TopPagesResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }
    
    // Extract top keywords
    keywords := make([]string, 0, len(result.Pages))
    seen := make(map[string]bool)
    for _, page := range result.Pages {
        if page.TopKeyword != "" && !seen[page.TopKeyword] {
            keywords = append(keywords, page.TopKeyword)
            seen[page.TopKeyword] = true
        }
    }
    
    return keywords, nil
}
```

---

### Combined Authority Fetch (Parallel)

```go
type AuthorityMetrics struct {
    DomainAuthority   int       `json:",omitempty"` // 0-100 DR score
    PageAuthority     int       `json:",omitempty"` // 0-100 UR score
    AhrefsRank        int       `json:",omitempty"` // Global Ahrefs rank
    BacklinkCount     int64     `json:",omitempty"` // Live backlinks
    ReferringDomains  int       `json:",omitempty"` // Unique referring domains
    OrganicTraffic    int64     `json:",omitempty"` // Est. monthly organic traffic
    TrafficValue      float64   `json:",omitempty"` // Est. traffic value (USD)
    TopKeywords       []string  `json:",omitempty"` // Top ranking keywords
    Source            string    `json:",omitempty"` // "ahrefs"
    FetchedAt         time.Time `json:",omitempty"`
}

func FetchAuthorityMetrics(targetUrl string) appfault.Result[*AuthorityMetrics] {
    apiKey := config.Get("Ahrefs.ApiKey")
    if apiKey == "" {
        return appfault.Fail[*AuthorityMetrics](ErrAhrefsNotConfigured)
    }
    
    domain := extractDomain(targetUrl)
    metrics := &AuthorityMetrics{
        Source:    "ahrefs",
        FetchedAt: time.Now(),
    }
    
    var wg sync.WaitGroup
    var mu sync.Mutex
    errs := make([]*appfault.AppError, 0)
    
    // 1. Domain Rating (parallel)
    wg.Add(1)
    go func() {
        defer wg.Done()
        dr, rank, err := FetchDomainRating(domain)
        mu.Lock()
        if err != nil {
            errs = append(errs, appfault.Wrap(
                err,
                ErrAhrefsRequestFailed,
                "domain-rating fetch failed",
            ))
        } else {
            metrics.DomainAuthority = dr
            metrics.AhrefsRank = rank
        }
        mu.Unlock()
    }()
    
    // 2. URL Rating (parallel)
    wg.Add(1)
    go func() {
        defer wg.Done()
        ur, err := FetchUrlRating(targetUrl)
        mu.Lock()
        if err != nil {
            errs = append(errs, appfault.Wrap(
                err,
                ErrAhrefsRequestFailed,
                "url-rating fetch failed",
            ))
        } else {
            metrics.PageAuthority = ur
        }
        mu.Unlock()
    }()
    
    // 3. Backlinks Stats (parallel)
    wg.Add(1)
    go func() {
        defer wg.Done()
        stats, err := FetchBacklinksStats(domain)
        mu.Lock()
        if err != nil {
            errs = append(errs, appfault.Wrap(
                err,
                ErrAhrefsRequestFailed,
                "backlinks-stats fetch failed",
            ))
        } else {
            metrics.BacklinkCount = stats.Metrics.Live
            metrics.ReferringDomains = stats.Metrics.LiveRefdomains
        }
        mu.Unlock()
    }()
    
    // 4. Organic Traffic (parallel)
    wg.Add(1)
    go func() {
        defer wg.Done()
        traffic, err := FetchOrganicTraffic(domain, "")
        mu.Lock()
        if err != nil {
            errs = append(errs, appfault.Wrap(
                err,
                ErrAhrefsRequestFailed,
                "organic-traffic fetch failed",
            ))
        } else {
            metrics.OrganicTraffic = traffic.Metrics.OrgTraffic
            metrics.TrafficValue = traffic.Metrics.OrgTrafficValue
        }
        mu.Unlock()
    }()
    
    // 5. Top Keywords (parallel)
    wg.Add(1)
    go func() {
        defer wg.Done()
        keywords, err := FetchTopPages(domain, 10)
        mu.Lock()
        if err != nil {
            errs = append(errs, appfault.Wrap(
                err,
                ErrAhrefsRequestFailed,
                "top-pages fetch failed",
            ))
        } else {
            metrics.TopKeywords = keywords
        }
        mu.Unlock()
    }()
    
    wg.Wait()
    
    // Log errors but don't fail if we got some data
    if len(errs) > 0 && metrics.DomainAuthority == 0 {
        return appfault.Fail[*AuthorityMetrics](
            appfault.New(
                ErrAhrefsAllFailed,
                "all ahrefs requests failed",
            ),
        )
    }
    
    return appfault.Ok(metrics)
}
```

---

### Caching Authority Data

Authority metrics are cached separately with longer TTL (30 days by default):

```sql
CREATE TABLE AuthorityCache (
    DomainHash       TEXT PRIMARY KEY,
    Domain           TEXT NOT NULL,
    MetricsJson      TEXT NOT NULL,
    FetchedAt        DATETIME NOT NULL,
    CacheExpiry      DATETIME NOT NULL,
    CreatedAt        DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxAuthorityCacheDomain ON AuthorityCache(Domain);
CREATE INDEX IdxAuthorityCacheCacheExpiry ON AuthorityCache(CacheExpiry);
```

```go
// CachedAuthorityResult holds the result of a cache lookup
type CachedAuthorityResult struct {
    Metrics *AuthorityMetrics
    Found   bool
}

func GetCachedAuthority(domain string) CachedAuthorityResult {
    hash := sha256Hash(domain)
    
    var entry AuthorityCacheEntry
    err := db.Where("DomainHash = ? AND CacheExpiry > ?", hash, time.Now()).First(&entry).Error
    if err != nil {
        return CachedAuthorityResult{Found: false}
    }
    
    var metrics AuthorityMetrics
    json.Unmarshal([]byte(entry.MetricsJson), &metrics)
    return CachedAuthorityResult{Metrics: &metrics, Found: true}
}

func CacheAuthority(domain string, metrics *AuthorityMetrics, ttlDays int) *appfault.AppError {
    hash := sha256Hash(domain)
    metricsJson, _ := json.Marshal(metrics)
    
    entry := AuthorityCacheEntry{
        DomainHash:  hash,
        Domain:      domain,
        MetricsJson: string(metricsJson),
        FetchedAt:   time.Now(),
        CacheExpiry: time.Now().AddDate(0, 0, ttlDays),
    }
    
    if err := db.Clauses(clause.OnConflict{
        Columns:   []clause.Column{{Name: "DomainHash"}},
        UpdateAll: true,
    }).Create(&entry).Error; err != nil {
        return appfault.Wrap(
            err,
            ErrAuthorityCacheFailed,
            "failed to cache authority metrics",
        )
    }

    return nil
}
```

---

### Ahrefs Error Codes

| Code | Name | Description |
|------|------|-------------|
| 9619 | EXTRACT_AHREFS_ERROR | Ahrefs API returned error |
| 9620 | EXTRACT_AHREFS_NOT_CONFIGURED | AHREFS_API_KEY missing |
| 9621 | EXTRACT_AHREFS_RATE_LIMITED | Rate limit exceeded |
| 9622 | EXTRACT_AHREFS_ROW_LIMIT | Monthly row limit exceeded |
| 9623 | EXTRACT_AHREFS_FORBIDDEN | Plan doesn't support endpoint |

---

## Free Authority Sources (Fallback Chain)

When `AHREFS_API_KEY` is not configured, GSearch automatically falls back to free data sources.

### Fallback Priority

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AUTHORITY FALLBACK CHAIN                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Ahrefs API (if configured)                                      │
│     │                                                                │
│     ▼ Not configured or failed                                       │
│  2. Open PageRank API (free, 10K/month)                             │
│     │                                                                │
│     ▼ Failed or rate limited                                         │
│  3. Moz Link Explorer API (free tier, 10/month)                     │
│     │                                                                │
│     ▼ Failed or exhausted                                            │
│  4. Headless Browser Scraping (Ahrefs free tools)                   │
│     │                                                                │
│     ▼ CAPTCHA or blocked                                             │
│  5. CommonCrawl Index (self-hosted, backlinks only)                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Source 1: Open PageRank API (Free)

**API:** https://www.domcop.com/openpagerank/  
**Free Tier:** 10,000 queries/month  
**Data:** PageRank score (0-10)

```go
const OpenPageRankUrl = "https://openpagerank.com/api/v1.0/getPageRank"

// EXEMPTED: OpenPageRank external API response contract
type OpenPageRankResponse struct {
    StatusCode int `json:"status_code"`
    Response   []struct {
        Domain         string  `json:"domain"`
        PageRankInt    int     `json:"page_rank_integer"`     // 0-10
        PageRankDecimal float64 `json:"page_rank_decimal"`    // 0.0-10.0
        Rank           int64   `json:"rank"`                  // Global rank
    } `json:"response"`
}

func FetchOpenPageRank(domain string) appfault.Result[*AuthorityMetrics] {
    apiKey := config.Get("OpenPageRank.ApiKey")
    if apiKey == "" {
        return nil, ErrOpenPageRankNotConfigured
    }
    
    req, err := http.NewRequest(httpmethod.Get.String(), OpenPageRankUrl, nil)
    if err != nil {
        return nil, err
    }
    
    q := req.URL.Query()
    q.Add("domains[]", domain)
    req.URL.RawQuery = q.Encode()
    
    req.Header.Set("API-OPR", apiKey)
    
    client := &http.Client{Timeout: 10 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode == 429 {
        return nil, ErrOpenPageRankRateLimited
    }
    
    var result OpenPageRankResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }
    
    if len(result.Response) == 0 {
        return nil, ErrOpenPageRankNoData
    }
    
    data := result.Response[0]
    
    // Convert PageRank (0-10) to approximate DA scale (0-100)
    estimatedDA := int(data.PageRankDecimal * 10)
    
    return &AuthorityMetrics{
        DomainAuthority: estimatedDA,
        PageAuthority:   estimatedDA, // Same for domain-level query
        Source:          "openpagerank",
        FetchedAt:       time.Now(),
    }, nil
}
```

**Registration:** https://www.domcop.com/openpagerank/documentation (free API key)

---

### Source 2: Moz Link Explorer API (Free Tier)

**API:** https://moz.com/products/api  
**Free Tier:** 10 queries/month (very limited, use sparingly)  
**Data:** Domain Authority (DA), Page Authority (PA), backlinks

```go
const MozApiUrl = "https://lsapi.seomoz.com/v2/url_metrics"

// EXEMPTED: Moz external API response contract
type MozResponse struct {
    DomainAuthority float64 `json:"domain_authority"`
    PageAuthority   float64 `json:"page_authority"`
    SpamScore       int     `json:"spam_score"`
    RootDomainsToRootDomain int `json:"root_domains_to_root_domain"`
}

func FetchMozMetrics(targetUrl string) appfault.Result[*AuthorityMetrics] {
    accessId := config.Get("Moz.AccessId")
    secretKey := config.Get("Moz.SecretKey")
    
    if accessId == "" || secretKey == "" {
        return nil, ErrMozNotConfigured
    }
    
    // Moz uses Basic Auth
    auth := base64.StdEncoding.EncodeToString(
        []byte(accessId + ":" + secretKey),
    )
    
    // Moz request body — strongly typed
    type MozRequest struct {
        Targets []string
    }
    payload := MozRequest{Targets: []string{targetUrl}}
    body, _ := json.Marshal(payload)
    
    req, err := http.NewRequest(httpmethod.Post.String(), MozApiUrl, bytes.NewReader(body))
    if err != nil {
        return nil, err
    }
    
    req.Header.Set("Authorization", "Basic "+auth)
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{Timeout: 15 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    if resp.StatusCode == 429 {
        return nil, ErrMozRateLimited
    }
    if resp.StatusCode == 403 {
        return nil, ErrMozQuotaExhausted
    }
    
    var results []MozResponse
    if err := json.NewDecoder(resp.Body).Decode(&results); err != nil {
        return nil, err
    }
    
    if len(results) == 0 {
        return nil, ErrMozNoData
    }
    
    data := results[0]
    
    return &AuthorityMetrics{
        DomainAuthority:  int(data.DomainAuthority),
        PageAuthority:    int(data.PageAuthority),
        ReferringDomains: data.RootDomainsToRootDomain,
        Source:           "moz",
        FetchedAt:        time.Now(),
    }, nil
}
```

---

### Source 3: Headless Browser Scraping (Ahrefs Free Tools)

When APIs are unavailable, fall back to scraping Ahrefs free tools using chromedp/rod.

**Target URLs:**
- `https://ahrefs.com/website-authority-checker?input={domain}`
- `https://ahrefs.com/backlink-checker?input={domain}`

**Go Headless Browser Options:**

| Library | Description | Best For |
|---------|-------------|----------|
| `chromedp` | Chrome DevTools Protocol | Mature, well-documented |
| `rod` | High-level CDP wrapper | Simpler API, faster dev |
| `go-rod/stealth` | Anti-detection plugin | Avoiding bot detection |

**Implementation with rod:**

```go
import (
    "github.com/go-rod/rod"
    "github.com/go-rod/rod/lib/launcher"
    "github.com/go-rod/stealth"
)

type AhrefsScraper struct {
    browser *rod.Browser
}

func NewAhrefsScraper() appfault.Result[*AhrefsScraper] {
    // Launch headless Chrome
    path, _ := launcher.LookPath()
    u := launcher.New().Bin(path).Headless(true).MustLaunch()
    
    browser := rod.New().ControlUrl(u).MustConnect()
    
    return &AhrefsScraper{browser: browser}, nil
}

func (s *AhrefsScraper) Close() {
    s.browser.MustClose()
}

func (s *AhrefsScraper) FetchAuthorityChecker(domain string) appfault.Result[*AuthorityMetrics] {
    url := fmt.Sprintf("https://ahrefs.com/website-authority-checker?input=%s", domain)
    
    // Use stealth plugin to avoid detection
    page := stealth.MustPage(s.browser)
    defer page.MustClose()
    
    // Navigate and wait for content
    page.MustNavigate(url).MustWaitLoad()
    
    // Wait for results to load (Ahrefs is React-based)
    err := page.Timeout(30 * time.Second).MustElement(".DomainRating").WaitVisible()
    if err != nil {
        // Check for CAPTCHA
        if page.MustHas(".captcha-container") {
            return nil, ErrAhrefsCaptchaRequired
        }
        return nil, ErrAhrefsScrapingFailed
    }
    
    // Extract Domain Rating
    drElement := page.MustElement(".DomainRating .rating-value")
    drText := drElement.MustText()
    dr, _ := strconv.Atoi(strings.TrimSpace(drText))
    
    // Extract backlinks count (if available)
    var backlinks int64
    if page.MustHas(".backlinks-count") {
        blElement := page.MustElement(".backlinks-count")
        blText := blElement.MustText()
        backlinks = parseShortNumber(blText) // "1.2K" → 1200
    }
    
    // Extract referring domains
    var refDomains int
    if page.MustHas(".ref-domains-count") {
        rdElement := page.MustElement(".ref-domains-count")
        rdText := rdElement.MustText()
        refDomains = int(parseShortNumber(rdText))
    }
    
    return &AuthorityMetrics{
        DomainAuthority:  dr,
        BacklinkCount:    backlinks,
        ReferringDomains: refDomains,
        Source:           "ahrefs-scrape",
        FetchedAt:        time.Now(),
    }, nil
}

// parseShortNumber converts "1.2K" → 1200, "5.3M" → 5300000
func parseShortNumber(s string) int64 {
    s = strings.TrimSpace(s)
    s = strings.ReplaceAll(s, ",", "")
    
    multiplier := int64(1)
    if strings.HasSuffix(s, "K") {
        multiplier = 1000
        s = strings.TrimSuffix(s, "K")
    } else if strings.HasSuffix(s, "M") {
        multiplier = 1000000
        s = strings.TrimSuffix(s, "M")
    } else if strings.HasSuffix(s, "B") {
        multiplier = 1000000000
        s = strings.TrimSuffix(s, "B")
    }
    
    f, _ := strconv.ParseFloat(s, 64)
    return int64(f * float64(multiplier))
}
```

**Scraping Considerations:**

| Challenge | Mitigation |
|-----------|------------|
| CAPTCHA | Detect and fail gracefully, fall to next source |
| IP Blocking | Rotate IPs via proxy, respect rate limits |
| Element Changes | Use data-testid or stable selectors when possible |
| JavaScript | Wait for React hydration before scraping |
| ToS | Use sparingly, cache aggressively (30+ days) |

---

### Source 4: CommonCrawl Index (Self-Hosted)

**Source:** https://commoncrawl.org/  
**Data:** Raw backlink data from web crawls  
**Cost:** Free (compute/storage for processing)

CommonCrawl provides monthly web crawl data. Backlinks can be extracted by processing the index.

```go
// CommonCrawl is processed offline and stored in local DB
// This function queries the pre-processed data

type CommonCrawlStore struct {
    db *gorm.DB
}

type CommonCrawlBacklinks struct {
    TargetDomain    string
    SourceUrl       string
    AnchorText      string
    DiscoveredAt    time.Time
}

func (s *CommonCrawlStore) GetBacklinkStats(domain string) appfault.Result[*AuthorityMetrics] {
    var stats struct {
        BacklinkCount    int64
        ReferringDomains int64
    }
    
    err := s.db.Model(&CommonCrawlBacklinks{}).
        Where("TargetDomain = ?", domain).
        Select("COUNT(*) as BacklinkCount, COUNT(DISTINCT SourceDomain) as ReferringDomains").
        Scan(&stats).Error
    
    if err != nil {
        return nil, err
    }
    
    if stats.BacklinkCount == 0 {
        return nil, ErrCommonCrawlNoData
    }
    
    return &AuthorityMetrics{
        BacklinkCount:    stats.BacklinkCount,
        ReferringDomains: int(stats.ReferringDomains),
        Source:           "commoncrawl",
        FetchedAt:        time.Now(),
    }, nil
}
```

---

### Combined Fallback Orchestrator

```go
type AuthoritySource string

const (
    SourceAhrefs       AuthoritySource = "ahrefs"
    SourceOpenPageRank AuthoritySource = "openpagerank"
    SourceMoz          AuthoritySource = "moz"
    SourceAhrefsScrape AuthoritySource = "ahrefs-scrape"
    SourceCommonCrawl  AuthoritySource = "commoncrawl"
)

type AuthorityFetcher struct {
    ahrefsScraper  *AhrefsScraper
    commonCrawl    *CommonCrawlStore
    enableScraping bool
}

func (f *AuthorityFetcher) FetchWithFallback(targetUrl string) appfault.Result[*AuthorityMetrics] {
    domain := extractDomain(targetUrl)
    
    // Check cache first
    if cached, found := GetCachedAuthority(domain); found {
        return appfault.Ok(cached)
    }
    
    var lastErr *appfault.AppError
    
    // 1. Try Ahrefs API (if configured)
    if config.Get("Ahrefs.ApiKey") != "" {
        result := FetchAuthorityMetrics(targetUrl)
        if result.IsSuccess() {
            CacheAuthority(domain, result.Value(), 30)
            return result
        }
        lastErr = appfault.Wrap(
            result.Err(),
            ErrAhrefsRequestFailed,
            "ahrefs API failed",
        )
        log.Printf("Ahrefs API failed, trying fallback: %v", result.Err())
    }
    
    // 2. Try Open PageRank (free, 10K/month)
    if config.Get("OpenPageRank.ApiKey") != "" {
        metrics, err := FetchOpenPageRank(domain)
        if err == nil {
            CacheAuthority(domain, metrics, 30)
            return appfault.Ok(metrics)
        }
        lastErr = appfault.Wrap(
            err,
            ErrOpenPageRankFailed,
            "openpagerank failed",
        )
        log.Printf("OpenPageRank failed, trying fallback: %v", err)
    }
    
    // 3. Try Moz (free tier, very limited)
    if config.Get("Moz.AccessId") != "" {
        metrics, err := FetchMozMetrics(targetUrl)
        if err == nil {
            CacheAuthority(domain, metrics, 30)
            return appfault.Ok(metrics)
        }
        lastErr = appfault.Wrap(
            err,
            ErrMozFailed,
            "moz failed",
        )
        log.Printf("Moz failed, trying fallback: %v", err)
    }
    
    // 4. Try headless browser scraping (if enabled)
    if f.enableScraping && f.ahrefsScraper != nil {
        metrics, err := f.ahrefsScraper.FetchAuthorityChecker(domain)
        if err == nil {
            CacheAuthority(domain, metrics, 30)
            return appfault.Ok(metrics)
        }
        lastErr = appfault.Wrap(
            err,
            ErrAhrefsScrapeFailed,
            "ahrefs scraping failed",
        )
        log.Printf("Ahrefs scraping failed, trying fallback: %v", err)
    }
    
    // 5. Try CommonCrawl (self-hosted data)
    if f.commonCrawl != nil {
        metrics, err := f.commonCrawl.GetBacklinkStats(domain)
        if err == nil {
            CacheAuthority(domain, metrics, 30)
            return appfault.Ok(metrics)
        }
        lastErr = appfault.Wrap(
            err,
            ErrCommonCrawlFailed,
            "commoncrawl failed",
        )
    }
    
    return appfault.Fail[*AuthorityMetrics](
        appfault.New(
            ErrAllAuthoritySourcesFailed,
            "all authority sources failed",
        ),
    )
}
```

---

### Free Source Error Codes

| Code | Name | Description |
|------|------|-------------|
| 9624 | EXTRACT_OPR_NOT_CONFIGURED | OpenPageRank API key missing |
| 9625 | EXTRACT_OPR_RATE_LIMITED | OpenPageRank rate limit exceeded |
| 9626 | EXTRACT_OPR_NO_DATA | No data for domain in OpenPageRank |
| 9627 | EXTRACT_MOZ_NOT_CONFIGURED | Moz credentials missing |
| 9628 | EXTRACT_MOZ_RATE_LIMITED | Moz rate limit exceeded |
| 9629 | EXTRACT_MOZ_QUOTA_EXHAUSTED | Moz monthly quota exhausted |
| 9630 | EXTRACT_SCRAPE_CAPTCHA | CAPTCHA required during scraping |
| 9631 | EXTRACT_SCRAPE_BLOCKED | IP blocked during scraping |
| 9632 | EXTRACT_SCRAPE_FAILED | General scraping failure |
| 9633 | EXTRACT_COMMONCRAWL_NO_DATA | No CommonCrawl data available |

---

## Proxy Rotation Infrastructure

GSearch supports proxy rotation for scraping operations (Google search, authority scraping) to avoid IP blocking.

### Supported Proxy Types

| Type | Protocol | Use Case |
|------|----------|----------|
| HTTP | http:// | Standard web proxies |
| HTTPS | https:// | Encrypted proxy connections |
| SOCKS5 | socks5:// | Full TCP tunneling, more anonymous |

### Proxy Configuration

```go
type ProxyConfig struct {
    Enabled          bool            `json:",omitempty"`
    Pools            []ProxyPool     `json:",omitempty"`
    RotationStrategy RotationStrategy `json:",omitempty"` // round_robin, random, weighted, smart
    HealthCheckUrl   string          `json:",omitempty"` // URL to test proxy health
    HealthCheckInterval string       `json:",omitempty"` // Duration string (e.g., "5m")
    MaxConsecutiveFailures int       `json:",omitempty"` // Remove proxy after N failures
    AutoRecoveryMinutes int          `json:",omitempty"` // Re-enable failed proxy after N minutes
}

type ProxyPool struct {
    Name        string        `json:",omitempty"` // e.g., "residential", "datacenter"
    Type        ProxyType     `json:",omitempty"` // http, https, socks5
    Proxies     []ProxyEntry  `json:",omitempty"`
    Weight      float64       `json:",omitempty"` // For weighted rotation (0.0-1.0)
    TargetSites []string      `json:",omitempty"` // Smart routing: ["google.com", "ahrefs.com"]
}

type ProxyEntry struct {
    Url         string `json:",omitempty"` // socks5://user:pass@host:port
    Weight      float64 `json:",omitempty"` // Individual proxy weight
    MaxRps      float64 `json:",omitempty"` // Rate limit for this proxy
    Region      string `json:",omitempty"` // Geographic region
    Disabled    bool   `json:",omitempty"` // Temporarily disabled
    FailureCount int   `json:",omitempty"` // Current failure count
    LastUsed    time.Time `json:",omitempty"`
    LastFailed  time.Time `json:",omitempty"`
}

type ProxyType string

const (
    ProxyTypeHttp   ProxyType = "http"
    ProxyTypeHttps  ProxyType = "https"
    ProxyTypeSocks5 ProxyType = "socks5"
)

type RotationStrategy string

const (
    RotationRoundRobin RotationStrategy = "round_robin"
    RotationRandom     RotationStrategy = "random"
    RotationWeighted   RotationStrategy = "weighted"
    RotationSmart      RotationStrategy = "smart" // Route based on target site
)
```

### Proxy Manager Implementation

```go
type ProxyManager struct {
    config      *ProxyConfig
    pools       map[string]*ProxyPool
    roundRobinIndex map[string]int // Per-pool index
    mu          sync.RWMutex
    healthTicker *time.Ticker
}

func NewProxyManager(config *ProxyConfig) *ProxyManager {
    pm := &ProxyManager{
        config:          config,
        pools:           make(map[string]*ProxyPool),
        roundRobinIndex: make(map[string]int),
    }
    
    for i := range config.Pools {
        pm.pools[config.Pools[i].Name] = &config.Pools[i]
    }
    
    if config.HealthCheckInterval != "" {
        interval, _ := time.ParseDuration(config.HealthCheckInterval)
        pm.healthTicker = time.NewTicker(interval)
        go pm.runHealthChecks()
    }
    
    return pm
}

func (pm *ProxyManager) GetProxy(targetUrl string) appfault.Result[*ProxyEntry] {
    if !pm.config.Enabled {
        return nil, nil // Direct connection
    }
    
    pm.mu.Lock()
    defer pm.mu.Unlock()
    
    // Smart routing: select pool based on target site
    pool := pm.selectPool(targetUrl)
    if pool == nil || len(pool.Proxies) == 0 {
        return nil, ErrNoProxiesAvailable
    }
    
    // Filter to enabled proxies only
    enabled := make([]*ProxyEntry, 0)
    for i := range pool.Proxies {
        if !pool.Proxies[i].Disabled {
            enabled = append(enabled, &pool.Proxies[i])
        }
    }
    
    if len(enabled) == 0 {
        return nil, ErrAllProxiesDisabled
    }
    
    // Select based on rotation strategy
    switch pm.config.RotationStrategy {
    case RotationRoundRobin:
        return pm.roundRobinSelect(pool.Name, enabled), nil
    case RotationRandom:
        return pm.randomSelect(enabled), nil
    case RotationWeighted:
        return pm.weightedSelect(enabled), nil
    default:
        return pm.randomSelect(enabled), nil
    }
}

func (pm *ProxyManager) selectPool(targetUrl string) *ProxyPool {
    targetDomain := extractDomain(targetUrl)
    
    // Smart routing: find pool that targets this site
    for _, pool := range pm.pools {
        for _, site := range pool.TargetSites {
            if strings.Contains(targetDomain, site) {
                return pool
            }
        }
    }
    
    // Fallback to first pool
    for _, pool := range pm.pools {
        return pool
    }
    return nil
}

func (pm *ProxyManager) roundRobinSelect(poolName string, proxies []*ProxyEntry) *ProxyEntry {
    index := pm.roundRobinIndex[poolName]
    proxy := proxies[index%len(proxies)]
    pm.roundRobinIndex[poolName] = (index + 1) % len(proxies)
    proxy.LastUsed = time.Now()
    return proxy
}

func (pm *ProxyManager) randomSelect(proxies []*ProxyEntry) *ProxyEntry {
    proxy := proxies[rand.Intn(len(proxies))]
    proxy.LastUsed = time.Now()
    return proxy
}

func (pm *ProxyManager) weightedSelect(proxies []*ProxyEntry) *ProxyEntry {
    totalWeight := 0.0
    for _, p := range proxies {
        totalWeight += p.Weight
    }
    
    r := rand.Float64() * totalWeight
    cumulative := 0.0
    for _, p := range proxies {
        cumulative += p.Weight
        if r <= cumulative {
            p.LastUsed = time.Now()
            return p
        }
    }
    
    proxies[0].LastUsed = time.Now()
    return proxies[0]
}

func (pm *ProxyManager) MarkFailed(proxy *ProxyEntry) {
    pm.mu.Lock()
    defer pm.mu.Unlock()
    
    proxy.FailureCount++
    proxy.LastFailed = time.Now()
    
    if proxy.FailureCount >= pm.config.MaxConsecutiveFailures {
        proxy.Disabled = true
        log.Printf("Proxy %s disabled after %d failures", proxy.Url, proxy.FailureCount)
        
        // Schedule auto-recovery
        if pm.config.AutoRecoveryMinutes > 0 {
            go func(p *ProxyEntry) {
                time.Sleep(time.Duration(pm.config.AutoRecoveryMinutes) * time.Minute)
                pm.mu.Lock()
                p.Disabled = false
                p.FailureCount = 0
                pm.mu.Unlock()
                log.Printf("Proxy %s re-enabled after recovery period", p.Url)
            }(proxy)
        }
    }
}

func (pm *ProxyManager) MarkSuccess(proxy *ProxyEntry) {
    pm.mu.Lock()
    defer pm.mu.Unlock()
    proxy.FailureCount = 0
}
```

### HTTP Client with Proxy

```go
func (pm *ProxyManager) CreateHttpClient(targetUrl string) appfault.Result[*http.Client] {
    proxyResult := pm.GetProxy(targetUrl)
    if proxyResult.IsErr() {
        return appfault.Fail[*http.Client](proxyResult.Err())
    }

    proxy := proxyResult.Value()
    
    if proxy == nil {
        // Direct connection
        return appfault.Ok(&http.Client{Timeout: 30 * time.Second})
    }
    
    transport := &http.Transport{
        TLSClientConfig: &tls.Config{InsecureSkipVerify: false},
    }
    
    proxyUrl, err := url.Parse(proxy.Url)
    if err != nil {
        return appfault.FailWrap[*http.Client](
            err,
            ErrProxyInvalidUrl,
            "invalid proxy URL",
        )
    }
    
    switch ProxyType(proxyUrl.Scheme) {
    case ProxyTypeHttp, ProxyTypeHttps:
        transport.Proxy = http.ProxyUrl(proxyUrl)
        
    case ProxyTypeSocks5:
        dialer, dialErr := proxy.SOCKS5("tcp", proxyUrl.Host, 
            &proxy.Auth{User: proxyUrl.User.Username(), Password: getPassword(proxyUrl.User)}, 
            proxy.Direct)
        if dialErr != nil {
            return appfault.FailWrap[*http.Client](
                dialErr,
                ErrProxySocks5Setup,
                "SOCKS5 setup failed",
            )
        }

        // EXEMPTED: DialContext is stdlib http.Transport interface — must return (net.Conn, error)
        transport.DialContext = func(context stdctx.Context, network, addr string) (net.Conn, error) {
            return dialer.Dial(network, addr)
        }
    }
    
    return appfault.Ok(&http.Client{
        Transport: transport,
        Timeout:   30 * time.Second,
    })
}
```

### Rod Browser with Proxy (for Scraping)

```go
func NewAhrefsScraperWithProxy(pm *ProxyManager, targetUrl string) appfault.Result[*AhrefsScraper] {
    proxy, err := pm.GetProxy(targetUrl)
    if err != nil {
        return nil, err
    }
    
    path, _ := launcher.LookPath()
    l := launcher.New().Bin(path).Headless(true)
    
    if proxy != nil {
        l = l.Proxy(proxy.Url)
    }
    
    u := l.MustLaunch()
    browser := rod.New().ControlUrl(u).MustConnect()
    
    return &AhrefsScraper{
        browser: browser,
        proxy:   proxy,
        pm:      pm,
    }, nil
}
```

### Proxy Error Codes

| Code | Name | Description |
|------|------|-------------|
| 9634 | PROXY_NOT_CONFIGURED | Proxy required but not configured |
| 9635 | PROXY_ALL_DISABLED | All proxies disabled due to failures |
| 9636 | PROXY_CONNECTION_FAILED | Failed to connect via proxy |
| 9637 | PROXY_AUTH_FAILED | Proxy authentication failed |
| 9638 | PROXY_TIMEOUT | Proxy connection timeout |

---

## Multi-Key Pooling for Free APIs

Support multiple API keys per free source for higher effective rate limits.

### Key Pool Configuration

```go
type ApiKeyPool struct {
    Keys            []ApiKeyEntry `json:",omitempty"`
    RotationStrategy string       `json:",omitempty"` // round_robin, least_used
    QuotaTracking   bool          `json:",omitempty"` // Track usage per key
}

type ApiKeyEntry struct {
    Key             string    `json:",omitempty"`
    Label           string    `json:",omitempty"` // Friendly name
    MonthlyQuota    int64     `json:",omitempty"` // Monthly request limit
    UsedThisMonth   int64     `json:",omitempty"` // Requests used this month
    QuotaResetDay   int       `json:",omitempty"` // Day of month quota resets (1-31)
    LastUsed        time.Time `json:",omitempty"`
    Disabled        bool      `json:",omitempty"` // Temporarily disabled
    DisabledReason  string    `json:",omitempty"` // e.g., "quota_exhausted"
}
```

### Key Pool Manager

```go
type KeyPoolManager struct {
    pools map[string]*ApiKeyPool // keyed by source name
    mu    sync.RWMutex
    db    *gorm.DB // For persistent quota tracking
}

func NewKeyPoolManager(db *gorm.DB) *KeyPoolManager {
    return &KeyPoolManager{
        pools: make(map[string]*ApiKeyPool),
        db:    db,
    }
}

func (kpm *KeyPoolManager) RegisterPool(source string, pool *ApiKeyPool) {
    kpm.mu.Lock()
    defer kpm.mu.Unlock()
    kpm.pools[source] = pool
    
    // Load persisted usage from DB
    for i := range pool.Keys {
        kpm.loadKeyUsage(source, &pool.Keys[i])
    }
}

func (kpm *KeyPoolManager) GetKey(source string) appfault.Result[string] {
    kpm.mu.Lock()
    defer kpm.mu.Unlock()
    
    pool, exists := kpm.pools[source]
    if !exists {
        return "", ErrKeyPoolNotConfigured
    }
    
    // Reset monthly quotas if needed
    kpm.checkQuotaReset(pool)
    
    // Filter to usable keys
    usable := make([]*ApiKeyEntry, 0)
    for i := range pool.Keys {
        key := &pool.Keys[i]
        if !key.Disabled && key.UsedThisMonth < key.MonthlyQuota {
            usable = append(usable, key)
        }
    }
    
    if len(usable) == 0 {
        return "", ErrAllKeysExhausted
    }
    
    // Select based on strategy
    var selected *ApiKeyEntry
    switch pool.RotationStrategy {
    case "least_used":
        selected = kpm.leastUsedSelect(usable)
    default: // round_robin
        selected = kpm.roundRobinSelect(source, usable)
    }
    
    selected.LastUsed = time.Now()
    selected.UsedThisMonth++
    
    // Persist usage
    if pool.QuotaTracking {
        kpm.saveKeyUsage(source, selected)
    }
    
    return selected.Key, nil
}

func (kpm *KeyPoolManager) leastUsedSelect(keys []*ApiKeyEntry) *ApiKeyEntry {
    var minUsed *ApiKeyEntry
    for _, key := range keys {
        if minUsed == nil || key.UsedThisMonth < minUsed.UsedThisMonth {
            minUsed = key
        }
    }
    return minUsed
}

func (kpm *KeyPoolManager) checkQuotaReset(pool *ApiKeyPool) {
    now := time.Now()
    for i := range pool.Keys {
        key := &pool.Keys[i]
        if key.QuotaResetDay > 0 && now.Day() == key.QuotaResetDay {
            // Check if we already reset this month
            if key.LastUsed.Month() != now.Month() || key.LastUsed.Year() != now.Year() {
                key.UsedThisMonth = 0
                key.Disabled = false
                key.DisabledReason = ""
            }
        }
    }
}

func (kpm *KeyPoolManager) MarkKeyExhausted(source, apiKey string) {
    kpm.mu.Lock()
    defer kpm.mu.Unlock()
    
    pool, exists := kpm.pools[source]
    if !exists {
        return
    }
    
    for i := range pool.Keys {
        if pool.Keys[i].Key == apiKey {
            pool.Keys[i].Disabled = true
            pool.Keys[i].DisabledReason = "quota_exhausted"
            break
        }
    }
}

// GetPoolStatus returns usage stats for UI display
func (kpm *KeyPoolManager) GetPoolStatus(source string) *ApiKeyPoolStatus {
    kpm.mu.RLock()
    defer kpm.mu.RUnlock()
    
    pool, exists := kpm.pools[source]
    if !exists {
        return nil
    }
    
    status := &ApiKeyPoolStatus{
        Source:      source,
        TotalKeys:   len(pool.Keys),
        ActiveKeys:  0,
        TotalQuota:  0,
        UsedQuota:   0,
        KeyStatuses: make([]ApiKeyStatus, len(pool.Keys)),
    }
    
    for i, key := range pool.Keys {
        status.TotalQuota += key.MonthlyQuota
        status.UsedQuota += key.UsedThisMonth
        
        if !key.Disabled {
            status.ActiveKeys++
        }
        
        status.KeyStatuses[i] = ApiKeyStatus{
            Label:       key.Label,
            UsedQuota:   key.UsedThisMonth,
            TotalQuota:  key.MonthlyQuota,
            Disabled:    key.Disabled,
            Reason:      key.DisabledReason,
        }
    }
    
    return status
}
```

### Key Pool Error Codes

| Code | Name | Description |
|------|------|-------------|
| 9639 | KEY_POOL_NOT_CONFIGURED | No key pool for source |
| 9640 | KEY_POOL_ALL_EXHAUSTED | All API keys exhausted quota |
| 9641 | KEY_POOL_RATE_LIMITED | Key pool rate limited |

---

### Configuration

```json
{
  "authority": {
    "sources_priority": ["ahrefs", "openpagerank", "moz", "scrape", "commoncrawl"],
    "enable_scraping": true,
    "cache_ttl_days": 30,
    "ahrefs": {
      "api_key": "",
      "rate_limit_per_sec": 1
    },
    "openpagerank": {
      "key_pool": {
        "keys": [
          {"key": "opr_key_1", "label": "Primary", "monthly_quota": 10000, "quota_reset_day": 1},
          {"key": "opr_key_2", "label": "Secondary", "monthly_quota": 10000, "quota_reset_day": 1}
        ],
        "rotation_strategy": "least_used",
        "quota_tracking": true
      }
    },
    "moz": {
      "key_pool": {
        "keys": [
          {"key": "moz_access:moz_secret_1", "label": "Account 1", "monthly_quota": 10, "quota_reset_day": 15},
          {"key": "moz_access:moz_secret_2", "label": "Account 2", "monthly_quota": 10, "quota_reset_day": 15}
        ],
        "rotation_strategy": "least_used",
        "quota_tracking": true
      }
    },
    "scraping": {
      "headless": true,
      "timeout_seconds": 30,
      "retry_on_captcha": false
    },
    "commoncrawl": {
      "enabled": false,
      "db_path": "./data/commoncrawl.db"
    }
  },
  "proxy": {
    "enabled": true,
    "rotation_strategy": "smart",
    "health_check_url": "https://httpbin.org/ip",
    "health_check_interval": "5m",
    "max_consecutive_failures": 3,
    "auto_recovery_minutes": 30,
    "pools": [
      {
        "name": "residential",
        "type": "socks5",
        "weight": 0.7,
        "target_sites": ["google.com", "ahrefs.com"],
        "proxies": [
          {"url": "socks5://user:pass@proxy1.example.com:1080", "weight": 1.0, "max_rps": 0.5, "region": "us"},
          {"url": "socks5://user:pass@proxy2.example.com:1080", "weight": 1.0, "max_rps": 0.5, "region": "eu"}
        ]
      },
      {
        "name": "datacenter",
        "type": "http",
        "weight": 0.3,
        "target_sites": ["duckduckgo.com", "bing.com"],
        "proxies": [
          {"url": "http://user:pass@dc1.example.com:8080", "weight": 1.0, "max_rps": 1.0},
          {"url": "http://user:pass@dc2.example.com:8080", "weight": 1.0, "max_rps": 1.0}
        ]
      }
    ]
  }
}
```

---

## Caching System

### Global Cache TTL Setting

The default cache TTL comes from global settings (seedable config):

```json
{
  "version": "1.0.0",
  "category": "cache_settings",
  "values": {
    "extract_cache_days": 5,
    "authority_cache_days": 30,
    "search_cache_days": 5
  }
}
```

At runtime, cache days cascade:
1. CLI `--cache-days` flag (highest priority)
2. Request-level override in API
3. Global setting from DB
4. Hardcoded default (5 days)

### Cache Storage

Extracted content is cached in the search cache directory:

```
data/{appName}/rag/cache/extract/{url-hash}.db
```

### Cache Structure

```sql
CREATE TABLE ExtractCache (
    UrlHash          TEXT PRIMARY KEY,
    Url              TEXT NOT NULL,
    Title            TEXT,
    ContentText      TEXT,
    ContentMd        TEXT,
    ContentHtml      TEXT,
    ContentSimpleHtml TEXT,
    ContentJson      TEXT,
    ContentYaml      TEXT,
    StyleJson        TEXT,
    NestedLinksJson  TEXT,
    AuthorityJson    TEXT,
    WordCount        INTEGER,
    ExtractedAt      DATETIME NOT NULL,
    CacheExpiry      DATETIME NOT NULL,
    ForceRefreshed   INTEGER DEFAULT 0,
    CreatedAt        DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxExtractCacheCacheExpiry ON ExtractCache(CacheExpiry);
CREATE INDEX IdxExtractCacheUrl ON ExtractCache(Url);
```

### Force Refresh Behavior

When `--force` is used:
1. **Delete** existing cache entry for this URL
2. Fetch fresh content from source
3. Store new entry with fresh TTL

This is different from "bypass" — force actually clears the old data.

---

## Processing Architecture

### Why NOT Raw HTML Chunking

**Problem:** Splitting raw HTML into chunks for parallel processing is risky:

```html
<!-- Chunk 1 ends here: -->
<div class="contai
<!-- Chunk 2 starts here: -->
ner">Content</div>
```

**Breaking points that corrupt data:**
- Tag names: `<di` + `v>`
- Attributes: `class="hello wo` + `rld"`
- Nested structures: closing tag in different chunk than opening
- Comments: `<!-- comme` + `nt -->`
- Script/style content: JS/CSS syntax broken mid-statement

**Conclusion:** Raw byte-level chunking of HTML is **NOT recommended**.

---

### Safe Parallel Processing Strategy

Instead of chunking raw HTML, parallelize **after** DOM parsing:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTRACTION PIPELINE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐                                                   │
│  │ 1. FETCH     │  Sequential: HTTP GET → Temp File                 │
│  │    (Network) │  File: data/temp/extract/{request-id}.html        │
│  └──────┬───────┘                                                   │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────────┐                                                   │
│  │ 2. PARSE     │  Sequential: goquery.NewDocument()                │
│  │    (DOM)     │  Fast: ~5ms for 1MB HTML                          │
│  └──────┬───────┘                                                   │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 3. EXTRACT (Parallel)                                         │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │   │
│  │  │Headings │ │  Paras  │ │  Links  │ │ Images  │ │  Lists  │ │   │
│  │  │Worker   │ │ Worker  │ │ Worker  │ │ Worker  │ │ Worker  │ │   │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ │   │
│  │       │           │           │           │           │       │   │
│  │       └───────────┴───────────┴───────────┴───────────┘       │   │
│  │                               │                                │   │
│  └───────────────────────────────┼────────────────────────────────┘   │
│                                  ▼                                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 4. FORMAT (Parallel)                                          │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │   │
│  │  │  Text   │ │Markdown │ │  HTML   │ │  JSON   │ │  YAML   │ │   │
│  │  │ Worker  │ │ Worker  │ │ Worker  │ │ Worker  │ │ Worker  │ │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                  │                                    │
│                                  ▼                                    │
│  ┌──────────────┐                                                   │
│  │ 5. COMBINE   │  Merge all extracted data + formats               │
│  │    & CACHE   │  Save to cache DB                                 │
│  └──────────────┘                                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Temp File Management

HTML is downloaded to temp storage before processing:

```
data/{appName}/temp/extract/
├── {request-id-1}.html    # Raw HTML from URL
├── {request-id-2}.html    # Another extraction
└── ...
```

**Lifecycle:**
1. **Create**: On fetch, write to `{uuid}.html`
2. **Process**: Parse and extract from file
3. **Delete**: Remove after successful extraction (or after 1 hour for failures)

```go
type TempFileManager struct {
    basePath string
    ttl      time.Duration // 1 hour default
}

func (tm *TempFileManager) SaveHtml(content []byte) appfault.Result[string] {
    requestId := uuid.New().String()
    filePath := filepath.Join(tm.basePath, requestId+".html")
    
    if writeErr := pathutil.WriteFile(filePath, content, 0644); writeErr != nil {
        return appfault.FailWrap[string](
            writeErr,
            ErrTempFileSaveFailed,
            "failed to save temp HTML file",
        )
    }
    
    return appfault.Ok(requestId)
}

func (tm *TempFileManager) GetPath(requestId string) string {
    return filepath.Join(tm.basePath, requestId+".html")
}

func (tm *TempFileManager) Cleanup(requestId string) *appfault.AppError {
    if removeErr := pathutil.Remove(tm.GetPath(requestId)); removeErr != nil {
        return appfault.Wrap(
            removeErr,
            ErrTempFileCleanupFailed,
            "failed to cleanup temp file: %s",
            requestId,
        )
    }

    return nil
}

func (tm *TempFileManager) CleanupStale() *appfault.AppError {
    entries, _ := pathutil.ReadDir(tm.basePath)
    cutoff := time.Now().Add(-tm.ttl)
    
    for _, entry := range entries {
        info, _ := entry.Info()
        if info.ModTime().Before(cutoff) {
            pathutil.Remove(filepath.Join(tm.basePath, entry.Name()))
        }
    }

    return nil
}
```

---

### Parallel Extraction Implementation

```go
package extractor

import (
    "sync"
    
    "github.com/PuerkitoBio/goquery"
)

type ParallelExtractor struct {
    doc *goquery.Document
}

type ExtractionResult struct {
    Headings   []Heading
    Paragraphs []Paragraph
    Links      []Link
    Images     []ImageInfo
    Lists      []List
    Quotes     []Quote
    Metadata   PageMetadata
}

func (pe *ParallelExtractor) ExtractAll() *ExtractionResult {
    result := &ExtractionResult{}
    var wg sync.WaitGroup
    
    // Parallel extraction workers
    wg.Add(6)
    
    go func() {
        defer wg.Done()
        result.Headings = pe.extractHeadings()
    }()
    
    go func() {
        defer wg.Done()
        result.Paragraphs = pe.extractParagraphs()
    }()
    
    go func() {
        defer wg.Done()
        result.Links = pe.extractLinks()
    }()
    
    go func() {
        defer wg.Done()
        result.Images = pe.extractImages()
    }()
    
    go func() {
        defer wg.Done()
        result.Lists = pe.extractLists()
    }()
    
    go func() {
        defer wg.Done()
        result.Quotes = pe.extractQuotes()
    }()
    
    wg.Wait()
    
    // Metadata extraction (needs headings result)
    result.Metadata = pe.extractMetadata()
    
    return result
}

func (pe *ParallelExtractor) extractHeadings() []Heading {
    var headings []Heading
    pe.doc.Find("h1, h2, h3, h4, h5, h6").Each(func(i int, s *goquery.Selection) {
        level := getHeaderLevel(goquery.NodeName(s))
        headings = append(headings, Heading{
            Level:  level,
            Text:   strings.TrimSpace(s.Text()),
            Anchor: s.AttrOr("id", ""),
        })
    })
    return headings
}

func (pe *ParallelExtractor) extractParagraphs() []Paragraph {
    var paragraphs []Paragraph
    pe.doc.Find("p").Each(func(i int, s *goquery.Selection) {
        text := strings.TrimSpace(s.Text())
        if text != "" {
            paragraphs = append(paragraphs, Paragraph{
                Index:     i + 1,
                Text:      text,
                WordCount: countWords(text),
            })
        }
    })
    return paragraphs
}

// ... similar implementations for Links, Images, Lists, Quotes
```

---

### Parallel Format Generation

```go
func GenerateFormats(extracted *ExtractionResult, formats []string) *ExtractContent {
    content := &ExtractContent{}
    var wg sync.WaitGroup
    var mu sync.Mutex
    
    formatFuncs := map[string]func() string{
        "text":        func() string { return toPlainText(extracted) },
        "markdown":    func() string { return toMarkdown(extracted) },
        "html":        func() string { return toCleanHtml(extracted) },
        "simple-html": func() string { return toSimpleHtml(extracted) },
        "yaml":        func() string { return toYaml(extracted) },
    }
    
    for _, format := range formats {
        if fn, ok := formatFuncs[format]; ok {
            wg.Add(1)
            go func(f string, generator func() string) {
                defer wg.Done()
                result := generator()
                
                mu.Lock()
                switch f {
                case "text":
                    content.Text = result
                case "markdown":
                    content.Markdown = result
                case "html":
                    content.Html = result
                case "simple-html":
                    content.SimpleHtml = result
                case "yaml":
                    content.Yaml = result
                }
                mu.Unlock()
            }(format, fn)
        }
    }
    
    wg.Wait()
    return content
}
```

---

### Complete Extraction Flow

```go
func ExtractUrl(url string, opts ExtractOptions) appfault.Result[*ExtractResult] {
    // 1. Check cache (unless force refresh)
    if isFalse(opts.ForceRefresh) {
        cached := getFromCache(url)
        if isDefined(cached) {
            return cached, nil
        }
    } else {
        deleteFromCache(url)
    }
    
    // 2. Fetch HTML
    htmlBytes, err := fetchUrl(url)
    if err != nil {
        return nil, err
    }
    
    // 3. Save to temp file
    tempMgr := NewTempFileManager()
    requestId, err := tempMgr.SaveHtml(htmlBytes)
    if err != nil {
        return nil, err
    }
    defer tempMgr.Cleanup(requestId)
    
    // 4. Parse DOM (sequential - fast)
    doc, err := goquery.NewDocumentFromReader(bytes.NewReader(htmlBytes))
    if err != nil {
        return nil, err
    }
    
    // 5. Parallel extraction
    extractor := &ParallelExtractor{doc: doc}
    extracted := extractor.ExtractAll()
    
    // 6. Parallel format generation
    content := GenerateFormats(extracted, opts.Formats)
    
    // 7. Build result
    result := &ExtractResult{
        Url:         url,
        Title:       extracted.Metadata.Title,
        MetaDesc:    extracted.Metadata.Description,
        ExtractedAt: time.Now(),
        Content:     *content,
        Structure: ContentStructure{
            Headings:   extracted.Headings,
            Paragraphs: extracted.Paragraphs,
            Links:      extracted.Links,
            Lists:      extracted.Lists,
            Quotes:     extracted.Quotes,
        },
        Images:   extracted.Images,
        Metadata: extracted.Metadata,
    }
    
    // 8. Parallel: Style analysis + Authority (if requested)
    var wg sync.WaitGroup
    
    if opts.AnalyzeStyle {
        wg.Add(1)
        go func() {
            defer wg.Done()
            result.Style = analyzeWritingStyle(content.Text)
        }()
    }
    
    if opts.IncludeAuth {
        wg.Add(1)
        go func() {
            defer wg.Done()
            result.Authority, _ = FetchAuthorityMetrics(url)
        }()
    }
    
    wg.Wait()
    
    // 9. Cache result
    saveToCache(url, result, opts.CacheDays)
    
    return result, nil
}
```

---

### Performance Characteristics

| Stage | Approach | Typical Time (1MB HTML) |
|-------|----------|-------------------------|
| Fetch | Sequential (network bound) | 200-2000ms |
| Parse DOM | Sequential (CPU) | 5-15ms |
| Extract content | Parallel (6 workers) | 10-30ms |
| Generate formats | Parallel (5 workers) | 5-15ms |
| Style analysis | Parallel (optional) | 20-50ms |
| Authority fetch | Parallel (optional, network) | 100-500ms |
| **Total** | | **~250-2500ms** |

**Key Insight:** Network fetch is the bottleneck, not parsing. Parallelizing extraction and format generation provides marginal but consistent speedup for large documents.

---

## Go Structs

### ExtractOptions

```go
// ExtractOptions configures extraction behavior
type ExtractOptions struct {
    Formats        []string `json:",omitempty"` // "text", "markdown", "html", "simple-html", "json", "yaml"
    ForceRefresh   bool     `json:",omitempty"` // Delete cache then fetch fresh
    CacheDays      int      `json:",omitempty"` // Cache TTL (default from global settings: 5)
    AnalyzeStyle   bool     `json:",omitempty"` // Extract EEAT writing style metrics
    IncludeImages  bool     `json:",omitempty"` // Include image URLs
    Depth          int      `json:",omitempty"` // Nested link depth (0-5, default 0)
    IncludeAuth    bool     `json:",omitempty"` // Include authority/traffic metrics
    MaxLength      int      `json:",omitempty"` // Max content length (0 = unlimited)
}
```

### ExtractResult

```go
// ExtractResult contains extracted content
type ExtractResult struct {
    Url           string            `json:",omitempty"`
    Title         string            `json:",omitempty"`
    MetaDesc      string            `json:",omitempty"`
    ExtractedAt   time.Time         `json:",omitempty"`
    CacheExpiry   time.Time         `json:",omitempty"`
    Cached        bool              `json:",omitempty"` // Was this from cache?
    WordCount     int               `json:",omitempty"`
    ReadingTime   string            `json:",omitempty"`
    Content       ExtractContent    `json:",omitempty"`
    Structure     ContentStructure  `json:",omitempty"`
    Images        []ImageInfo       `json:",omitempty"`
    Metadata      PageMetadata      `json:",omitempty"`
    NestedLinks   []NestedLink      `json:",omitempty"` // Links from depth crawling
    Authority     *AuthorityMetrics `json:",omitempty"` // Optional authority/traffic
    Style         *WritingStyle     `json:",omitempty"` // Optional style analysis
}

// ExtractContent holds multi-format content
type ExtractContent struct {
    Text       string `json:",omitempty"`
    Markdown   string `json:",omitempty"`
    Html       string `json:",omitempty"`
    SimpleHtml string `json:",omitempty"` // Headers + paragraphs only
    Yaml       string `json:",omitempty"` // YAML formatted output
}

// ContentStructure holds parsed structure
type ContentStructure struct {
    Headings       []Heading        `json:",omitempty"`
    Paragraphs     []Paragraph      `json:",omitempty"`
    HeaderSections []HeaderSection  `json:",omitempty"` // Hierarchical header+content
    Lists          []List           `json:",omitempty"`
    Quotes         []Quote          `json:",omitempty"`
    Links          []Link           `json:",omitempty"`
}

// HeaderSection represents a header with its following content
type HeaderSection struct {
    Level    int             `json:",omitempty"` // 1-6
    Title    string          `json:",omitempty"` // Header text
    Content  string          `json:",omitempty"` // All paragraphs until next header
    Anchor   string          `json:",omitempty"` // ID/anchor for linking
    Children []HeaderSection `json:",omitempty"` // Nested sub-headers
}

// NestedLink represents a page discovered via depth crawling
type NestedLink struct {
    Url      string `json:",omitempty"`
    Title    string `json:",omitempty"`
    Snippet  string `json:",omitempty"` // First 200 chars of content
    Depth    int    `json:",omitempty"` // Distance from original URL
    Relation string `json:",omitempty"` // "internal", "external"
}

// AuthorityMetrics contains domain/page authority data
type AuthorityMetrics struct {
    DomainAuthority   int       `json:",omitempty"` // 0-100 DR score
    PageAuthority     int       `json:",omitempty"` // 0-100 UR score
    BacklinkCount     int64     `json:",omitempty"` // Total backlinks
    ReferringDomains  int       `json:",omitempty"` // Unique referring domains
    OrganicTraffic    int64     `json:",omitempty"` // Estimated monthly organic traffic
    TrafficValue      float64   `json:",omitempty"` // Estimated traffic value (USD)
    TopKeywords       []string  `json:",omitempty"` // Top ranking keywords
    Source            string    `json:",omitempty"` // "ahrefs", "moz", etc.
    FetchedAt         time.Time `json:",omitempty"`
}

// WritingStyle holds EEAT-focused style metrics
type WritingStyle struct {
    SentenceMetrics    SentenceMetrics    `json:",omitempty"`
    ParagraphMetrics   ParagraphMetrics   `json:",omitempty"`
    StructureMetrics   StructureMetrics   `json:",omitempty"`
    VocabularyMetrics  VocabularyMetrics  `json:",omitempty"`
    TransitionAnalysis TransitionAnalysis `json:",omitempty"`
    ToneAnalysis       ToneAnalysis       `json:",omitempty"`
    PatternAnalysis    PatternAnalysis    `json:",omitempty"`
}

// Paragraph with header context
type Paragraph struct {
    Index       int    `json:",omitempty"`
    Text        string `json:",omitempty"`
    WordCount   int    `json:",omitempty"`
    AfterHeading int   `json:",omitempty"` // Which heading level this follows
}
```

---

## API Integration

### REST Endpoint

**POST** `/api/v1/extract`

```json
{
  "Url": "https://example.com/article",
  "Formats": ["text", "markdown", "simple-html", "json", "yaml"],
  "ForceRefresh": false,
  "CacheDays": 5,
  "AnalyzeStyle": true,
  "IncludeImages": true,
  "Depth": 2,
  "IncludeAuthority": true
}
```

### Response

```json
{
  "Success": true,
  "Result": {
    "Url": "https://example.com/article",
    "Title": "Expert Guide to Carpet Maintenance",
    "WordCount": 1250,
    "Cached": false,
    "CacheExpiry": "2026-02-08T10:00:00Z",
    "Content": {
      "Text": "...",
      "Markdown": "...",
      "SimpleHtml": "<h1>...</h1><p>...</p>",
      "Yaml": "..."
    },
    "Structure": {
      "Headings": [...],
      "HeaderSections": [
        {
          "Level": 1,
          "Title": "Expert Guide to Carpet Maintenance",
          "Content": "Maintaining your carpet...",
          "Children": [
            {"Level": 2, "Title": "Why Regular Cleaning Matters", "Content": "..."}
          ]
        }
      ]
    },
    "NestedLinks": [
      {"Url": "https://example.com/steam-cleaning", "Title": "Steam Cleaning", "Depth": 1}
    ],
    "Authority": {
      "DomainAuthority": 67,
      "PageAuthority": 42,
      "OrganicTraffic": 15000,
      "Source": "ahrefs"
    },
    "Style": {...}
  }
}
```

---

## Simple HTML Extraction Implementation

Core implementation for the `simple-html` format using goquery:

```go
package extractor

import (
    "strings"
    
    "github.com/PuerkitoBio/goquery"
)

// ToSimpleHtml converts complex HTML to minimal h1-h6 + p only
func ToSimpleHtml(rawHtml string) appfault.Result[string] {
    doc, err := goquery.NewDocumentFromReader(strings.NewReader(rawHtml))
    if err != nil {
        return "", err
    }
    
    var result strings.Builder
    
    // Process in document order
    doc.Find("body").Children().Each(func(i int, s *goquery.Selection) {
        processNodeToSimple(&result, s)
    })
    
    return strings.TrimSpace(result.String()), nil
}

func processNodeToSimple(result *strings.Builder, s *goquery.Selection) {
    nodeName := goquery.NodeName(s)
    
    // Handle headers
    if isHeaderTag(nodeName) {
        text := strings.TrimSpace(s.Text())
        if text != "" {
            result.WriteString("<" + nodeName + ">" + text + "</" + nodeName + ">\n")
        }
        return
    }
    
    // Handle paragraphs (and convert divs with text to p)
    if nodeName == "p" || (nodeName == "div" && hasDirectText(s)) {
        text := strings.TrimSpace(s.Text())
        if text != "" {
            result.WriteString("<p>" + text + "</p>\n")
        }
        return
    }
    
    // Handle lists - convert to paragraphs
    if nodeName == "ul" || nodeName == "ol" {
        s.Find("li").Each(func(i int, li *goquery.Selection) {
            text := strings.TrimSpace(li.Text())
            if text != "" {
                result.WriteString("<p>" + text + "</p>\n")
            }
        })
        return
    }
    
    // Recurse into containers
    if isContainerTag(nodeName) {
        s.Children().Each(func(i int, child *goquery.Selection) {
            processNodeToSimple(result, child)
        })
    }
}

func isHeaderTag(tag string) bool {
    return tag == "h1" || tag == "h2" || tag == "h3" || 
           tag == "h4" || tag == "h5" || tag == "h6"
}

func isContainerTag(tag string) bool {
    containers := []string{"div", "article", "section", "main", "aside", "header", "footer", "nav"}
    for _, c := range containers {
        if tag == c {
            return true
        }
    }
    return false
}

func hasDirectText(s *goquery.Selection) bool {
    // Check if this element has direct text (not just child elements)
    html, _ := s.Html()
    text := s.Text()
    return len(strings.TrimSpace(text)) > 0 && 
           len(strings.TrimSpace(text)) < len(html)*2
}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 9610 | EXTRACT_URL_INVALID | Malformed URL |
| 9611 | EXTRACT_FETCH_FAILED | Could not fetch URL |
| 9612 | EXTRACT_SSRF_BLOCKED | Private/internal URL blocked |
| 9613 | EXTRACT_PARSE_FAILED | HTML parsing error |
| 9614 | EXTRACT_TIMEOUT | Request timeout |
| 9615 | EXTRACT_CACHE_ERROR | Cache read/write error |
| 9616 | EXTRACT_STYLE_ERROR | Style analysis failed |
| 9617 | EXTRACT_TOO_LARGE | Content exceeds max length |
| 9618 | EXTRACT_DEPTH_EXCEEDED | Depth limit (5) exceeded |
| 9619 | EXTRACT_AHREFS_ERROR | Ahrefs API error |
| 9620 | EXTRACT_AHREFS_NOT_CONFIGURED | Ahrefs API key missing |

---

## Security

### SSRF Protection

All URL extraction goes through the existing SSRFProtector:

```go
protector := NewSsrfProtector()
if safe, err := protector.IsUrlSafe(url); !safe {
    return nil, ErrSsrfBlocked
}
```

### Rate Limiting

- Default: 1 request per second per domain
- Configurable via `--delay` flag
- Respects `robots.txt` crawl-delay if present
- Ahrefs API has separate rate limits (check API docs)

---

## Configuration

### Seed File: `config/seeding-extract-settings.json`

```json
{
  "version": "1.0.0",
  "category": "extract_settings",
  "values": {
    "cache_ttl_days": 5,
    "authority_cache_ttl_days": 30,
    "max_depth": 5,
    "max_content_length": 500000,
    "default_formats": ["markdown"],
    "rate_limit_per_domain": 1.0,
    "ahrefs_enabled": false
  }
}
```

---

## Related Specifications

| Spec | Description |
|------|-------------|
| 17-full-site-crawler.md (gsearch) | Full site crawling |
| 10-caching-system.md (gsearch) | Cache architecture |
| 18-authority-credibility-scoring.md (gsearch) | Authority scoring integration |
| 28-company-profile-management.md | Company profile using extraction |
