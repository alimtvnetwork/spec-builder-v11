# Company Profile Management

> **Version:** 5.0.0  
> **Status:** Draft  
> **Last Updated:** 2026-03-09

---

## Overview

The Company Profile module provides comprehensive company management including creation, training data ingestion, multi-CTA support, and reference article processing for writing style analysis. This serves as the foundation for all SEO content generation (FAQ, Paragraph, Blog).

---

## Architecture

### Split DB Tables (Normalized)

All company data is stored in the unified SEO database with **normalized tables** (no JSON columns for searchable data):

```
data/{appName}/rag/seo/{company-slug}.db
```

#### Tables

| Table | Purpose |
|-------|---------|
| `CompanyProfile` | Core company metadata |
| `CompanyCtas` | Multiple CTA entries with type/priority |
| `CompanyServices` | Services offered |
| `CompanyLocations` | Service areas/locations |
| `CompanyKeywords` | Target keywords |
| `CompanyReferenceArticles` | Reference articles for style training |
| `CompanyWritingStyle` | Extracted writing style metrics |

---

## Go Structs

### CompanyProfile (Core Table)

```go
// CompanyProfile stores core company information
type CompanyProfile struct {
    Slug              string    `json:",omitempty"` // Primary key: "atto-property"
    Name              string    `json:",omitempty"` // "Atto Property"
    Website           string    `json:",omitempty"` // "https://attoproperty.com.au"
    Industry          string    `json:",omitempty"` // "cleaning", "real-estate"
    Description       string    `json:",omitempty"` // Brief company description
    Tagline           string    `json:",omitempty"` // Company tagline
    LogoUrl           string    `json:",omitempty"` // Logo URL
    PrimaryColor      string    `json:",omitempty"` // Brand color: "#FF6B35"
    SecondaryColor    string    `json:",omitempty"` // Secondary: "#004E89"
    SitemapUrl        string    `json:",omitempty"` // For auto-crawling
    AutoCrawlEnabled  bool      `json:",omitempty"` // Trigger sitemap crawl on create
    CrawlLastRun      time.Time `json:",omitempty"` // Last sitemap crawl
    CrawlPagesIndexed int       `json:",omitempty"` // Pages indexed
    TrainingComplete  bool      `json:",omitempty"` // Has training data
    CreatedAt         time.Time `json:",omitempty"`
    UpdatedAt         time.Time `json:",omitempty"`
}
```

### CompanyCta (Normalized CTA Table)

```go
// CompanyCta represents a single call-to-action option
type CompanyCta struct {
    Id           int       `json:",omitempty"` // Auto-increment
    CompanySlug  string    `json:",omitempty"` // FK to CompanyProfile
    Type         string    `json:",omitempty"` // "url", "phone", "email", "whatsapp", "form", "booking"
    Priority     int       `json:",omitempty"` // 1 = highest, random selection weighted by priority
    Label        string    `json:",omitempty"` // Display label: "Call Now", "Get Quote"
    ValueRaw     string    `json:",omitempty"` // Raw value: "+61412345678", "info@company.com"
    ValueDisplay string    `json:",omitempty"` // Formatted: "0412 345 678", "info@company.com"
    ValueLink    string    `json:",omitempty"` // Link format: "tel:+61412345678", "mailto:info@..."
    Description  string    `json:",omitempty"` // Optional description for context
    IsActive     bool      `json:",omitempty"` // Enable/disable CTA
    CreatedAt    time.Time `json:",omitempty"`
    UpdatedAt    time.Time `json:",omitempty"`
}
```

#### CTA Type Reference

| Type | ValueRaw Example | ValueDisplay | ValueLink |
|------|------------------|--------------|-----------|
| `url` | `https://site.com/quote` | `Get Your Free Quote` | `https://site.com/quote` |
| `phone` | `+61412345678` | `0412 345 678` | `tel:+61412345678` |
| `email` | `info@company.com` | `info@company.com` | `mailto:info@company.com` |
| `whatsapp` | `+61412345678` | `WhatsApp Us` | `https://wa.me/61412345678` |
| `form` | `/contact-form` | `Request Callback` | `/contact-form` |
| `booking` | `https://calendly.com/...` | `Book Appointment` | `https://calendly.com/...` |

### CompanyService (Normalized Services)

```go
// CompanyService represents a service offered
type CompanyService struct {
    Id          int       `json:",omitempty"` // Auto-increment
    CompanySlug string    `json:",omitempty"` // FK
    Name        string    `json:",omitempty"` // "Carpet Cleaning"
    Slug        string    `json:",omitempty"` // "carpet-cleaning"
    Description string    `json:",omitempty"` // Service description
    Keywords    string    `json:",omitempty"` // Comma-separated keywords
    PageUrl     string    `json:",omitempty"` // Service page URL
    SortOrder   int       `json:",omitempty"` // Display order
    IsActive    bool      `json:",omitempty"`
    CreatedAt   time.Time `json:",omitempty"`
}
```

### CompanyLocation (Normalized Locations)

```go
// CompanyLocation represents a service area
type CompanyLocation struct {
    Id          int       `json:",omitempty"` // Auto-increment
    CompanySlug string    `json:",omitempty"` // FK
    Name        string    `json:",omitempty"` // "Melton"
    Type        string    `json:",omitempty"` // "suburb", "city", "region", "state"
    State       string    `json:",omitempty"` // "VIC", "NSW"
    PostCode    string    `json:",omitempty"` // "3337"
    PageUrl     string    `json:",omitempty"` // Location page URL
    IsPrimary   bool      `json:",omitempty"` // Primary service area
    IsActive    bool      `json:",omitempty"`
    CreatedAt   time.Time `json:",omitempty"`
}
```

### CompanyKeyword (Normalized Keywords)

```go
// CompanyKeyword stores target keywords with priority
type CompanyKeyword struct {
    Id          int       `json:",omitempty"` // Auto-increment
    CompanySlug string    `json:",omitempty"` // FK
    Keyword     string    `json:",omitempty"` // "carpet cleaning melbourne"
    Type        string    `json:",omitempty"` // "primary", "secondary", "long-tail"
    SearchVol   int       `json:",omitempty"` // Monthly search volume (if known)
    Difficulty  int       `json:",omitempty"` // 0-100 difficulty score
    IsActive    bool      `json:",omitempty"`
    CreatedAt   time.Time `json:",omitempty"`
}
```

### CompanyReferenceArticle (Writing Style Source)

```go
// CompanyReferenceArticle stores reference articles for style training
type CompanyReferenceArticle struct {
    Id              int       `json:",omitempty"` // Auto-increment
    CompanySlug     string    `json:",omitempty"` // FK
    SourceUrl       string    `json:",omitempty"` // Original URL
    Title           string    `json:",omitempty"` // Article title
    ContentText     string    `json:",omitempty"` // Extracted plain text
    ContentMarkdown string    `json:",omitempty"` // Extracted markdown
    ContentHtml     string    `json:",omitempty"` // Cleaned HTML
    WordCount       int       `json:",omitempty"` // Total words
    ExtractedAt     time.Time `json:",omitempty"` // When extracted
    CacheExpiry     time.Time `json:",omitempty"` // Cache TTL (default 5 days)
    IsProcessed     bool      `json:",omitempty"` // Style analysis complete
    CreatedAt       time.Time `json:",omitempty"`
}
```

### CompanyWritingStyle (Extracted Style Metrics)

```go
// CompanyWritingStyle stores writing style analysis
type CompanyWritingStyle struct {
    Id                   int       `json:",omitempty"` // Auto-increment
    CompanySlug          string    `json:",omitempty"` // FK
    ArticleId            int       `json:",omitempty"` // FK to ReferenceArticle (0 = aggregate)
    // Sentence Metrics
    AvgSentenceLength    float64   `json:",omitempty"` // Average words per sentence
    MinSentenceLength    int       `json:",omitempty"` // Shortest sentence
    MaxSentenceLength    int       `json:",omitempty"` // Longest sentence
    SentenceLengthStdDev float64   `json:",omitempty"` // Variation in length
    // Paragraph Metrics
    AvgParagraphLength   float64   `json:",omitempty"` // Average words per paragraph
    AvgSentencesPerPara  float64   `json:",omitempty"` // Sentences per paragraph
    // Structure Metrics
    HeadingFrequency     float64   `json:",omitempty"` // Headings per 1000 words
    ListFrequency        float64   `json:",omitempty"` // Lists per 1000 words
    LinkDensity          float64   `json:",omitempty"` // Links per 1000 words
    // Vocabulary Metrics
    AvgWordLength        float64   `json:",omitempty"` // Average characters per word
    UniqueWordRatio      float64   `json:",omitempty"` // Unique words / total words
    TransitionWordRate   float64   `json:",omitempty"` // % sentences starting with transitions
    // Tone Analysis
    FormalityScore       float64   `json:",omitempty"` // 0.0 (casual) to 1.0 (formal)
    ReadabilityScore     float64   `json:",omitempty"` // Flesch-Kincaid or similar
    SentimentScore       float64   `json:",omitempty"` // -1.0 to 1.0
    // Pattern Detection
    CommonPhrases        string    `json:",omitempty"` // JSON array of frequent phrases
    SentenceStarters     string    `json:",omitempty"` // JSON array of common starters
    VoicePattern         string    `json:",omitempty"` // "active", "passive", "mixed"
    TensePattern         string    `json:",omitempty"` // "present", "past", "future", "mixed"
    CreatedAt            time.Time `json:",omitempty"`
    UpdatedAt            time.Time `json:",omitempty"`
}
```

---

## SQL Schema

```sql
-- Core company profile
CREATE TABLE CompanyProfile (
    Slug              TEXT PRIMARY KEY,
    Name              TEXT NOT NULL,
    Website           TEXT,
    Industry          TEXT,
    Description       TEXT,
    Tagline           TEXT,
    LogoUrl           TEXT,
    PrimaryColor      TEXT,
    SecondaryColor    TEXT,
    SitemapUrl        TEXT,
    AutoCrawlEnabled  INTEGER DEFAULT 0,
    CrawlLastRun      DATETIME,
    CrawlPagesIndexed INTEGER DEFAULT 0,
    TrainingComplete  INTEGER DEFAULT 0,
    CreatedAt         DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt         DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Normalized CTAs (multiple per company)
CREATE TABLE CompanyCtas (
    Id           INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanySlug  TEXT NOT NULL REFERENCES CompanyProfile(Slug) ON DELETE CASCADE,
    Type         TEXT NOT NULL CHECK(Type IN ('Url', 'Phone', 'Email', 'Whatsapp', 'Form', 'Booking')),
    Priority     INTEGER DEFAULT 1,
    Label        TEXT NOT NULL,
    ValueRaw     TEXT NOT NULL,
    ValueDisplay TEXT,
    ValueLink    TEXT,
    Description  TEXT,
    IsActive     INTEGER DEFAULT 1,
    CreatedAt    DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt    DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IdxCtasCompany ON CompanyCtas(CompanySlug);
CREATE INDEX IdxCtasType ON CompanyCtas(Type);
CREATE INDEX IdxCtasActive ON CompanyCtas(IsActive);

-- Normalized services
CREATE TABLE CompanyServices (
    Id          INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanySlug TEXT NOT NULL REFERENCES CompanyProfile(Slug) ON DELETE CASCADE,
    Name        TEXT NOT NULL,
    Slug        TEXT NOT NULL,
    Description TEXT,
    Keywords    TEXT,
    PageUrl     TEXT,
    SortOrder   INTEGER DEFAULT 0,
    IsActive    INTEGER DEFAULT 1,
    CreatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(CompanySlug, Slug)
);
CREATE INDEX IdxServicesCompany ON CompanyServices(CompanySlug);

-- Normalized locations
CREATE TABLE CompanyLocations (
    Id          INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanySlug TEXT NOT NULL REFERENCES CompanyProfile(Slug) ON DELETE CASCADE,
    Name        TEXT NOT NULL,
    Type        TEXT DEFAULT 'Suburb' CHECK(Type IN ('Suburb', 'City', 'Region', 'State', 'Country')),
    State       TEXT,
    PostCode    TEXT,
    PageUrl     TEXT,
    IsPrimary   INTEGER DEFAULT 0,
    IsActive    INTEGER DEFAULT 1,
    CreatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(CompanySlug, Name, Type)
);
CREATE INDEX IdxLocationsCompany ON CompanyLocations(CompanySlug);

-- Normalized keywords
CREATE TABLE CompanyKeywords (
    Id          INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanySlug TEXT NOT NULL REFERENCES CompanyProfile(Slug) ON DELETE CASCADE,
    Keyword     TEXT NOT NULL,
    Type        TEXT DEFAULT 'Primary' CHECK(Type IN ('Primary', 'Secondary', 'LongTail', 'Brand')),
    SearchVol   INTEGER DEFAULT 0,
    Difficulty  INTEGER DEFAULT 0,
    IsActive    INTEGER DEFAULT 1,
    CreatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(CompanySlug, Keyword)
);
CREATE INDEX IdxKeywordsCompany ON CompanyKeywords(CompanySlug);
CREATE INDEX IdxKeywordsType ON CompanyKeywords(Type);

-- Reference articles for style training
CREATE TABLE CompanyReferenceArticles (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanySlug     TEXT NOT NULL REFERENCES CompanyProfile(Slug) ON DELETE CASCADE,
    SourceUrl       TEXT NOT NULL,
    Title           TEXT,
    ContentText     TEXT,
    ContentMarkdown TEXT,
    ContentHtml     TEXT,
    WordCount       INTEGER DEFAULT 0,
    ExtractedAt     DATETIME,
    CacheExpiry     DATETIME,
    IsProcessed     INTEGER DEFAULT 0,
    CreatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(CompanySlug, SourceUrl)
);
CREATE INDEX IdxArticlesCompany ON CompanyReferenceArticles(CompanySlug);

-- Writing style analysis
CREATE TABLE CompanyWritingStyle (
    Id                   INTEGER PRIMARY KEY AUTOINCREMENT,
    CompanySlug          TEXT NOT NULL REFERENCES CompanyProfile(Slug) ON DELETE CASCADE,
    ArticleId            INTEGER DEFAULT 0,  -- 0 = aggregate across all articles
    AvgSentenceLength    REAL DEFAULT 0,
    MinSentenceLength    INTEGER DEFAULT 0,
    MaxSentenceLength    INTEGER DEFAULT 0,
    SentenceLengthStdDev REAL DEFAULT 0,
    AvgParagraphLength   REAL DEFAULT 0,
    AvgSentencesPerPara  REAL DEFAULT 0,
    HeadingFrequency     REAL DEFAULT 0,
    ListFrequency        REAL DEFAULT 0,
    LinkDensity          REAL DEFAULT 0,
    AvgWordLength        REAL DEFAULT 0,
    UniqueWordRatio      REAL DEFAULT 0,
    TransitionWordRate   REAL DEFAULT 0,
    FormalityScore       REAL DEFAULT 0.5,
    ReadabilityScore     REAL DEFAULT 0,
    SentimentScore       REAL DEFAULT 0,
    CommonPhrases        TEXT,  -- JSON array
    SentenceStarters     TEXT,  -- JSON array
    VoicePattern         TEXT DEFAULT 'Active',
    TensePattern         TEXT DEFAULT 'Present',
    CreatedAt            DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt            DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IdxStyleCompany ON CompanyWritingStyle(CompanySlug);
CREATE INDEX IdxStyleArticle ON CompanyWritingStyle(ArticleId);
```

---

## API Endpoints

### Company CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/seo/companies` | List all companies |
| GET | `/api/v1/seo/{company}` | Get company summary (existing) |
| POST | `/api/v1/seo/companies` | Create new company |
| PUT | `/api/v1/seo/{company}` | Update company profile |
| DELETE | `/api/v1/seo/{company}` | Delete company and all data |

### CTA Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/seo/{company}/ctas` | List all CTAs |
| POST | `/api/v1/seo/{company}/ctas` | Add CTA |
| PUT | `/api/v1/seo/{company}/ctas/{id}` | Update CTA |
| DELETE | `/api/v1/seo/{company}/ctas/{id}` | Delete CTA |
| GET | `/api/v1/seo/{company}/ctas/random` | Get random active CTA (weighted by priority) |

### Reference Articles & Style Training

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/seo/{company}/articles` | List reference articles |
| POST | `/api/v1/seo/{company}/articles` | Add reference article (triggers GSearch extraction) |
| DELETE | `/api/v1/seo/{company}/articles/{id}` | Delete reference article |
| GET | `/api/v1/seo/{company}/style` | Get aggregated writing style metrics |
| POST | `/api/v1/seo/{company}/style/analyze` | Re-analyze all articles and update style |

---

### Create Company

**POST** `/api/v1/seo/companies`

Creates a new company profile with optional auto-crawling.

#### Request

```json
{
  "Name": "Atto Property",
  "Website": "https://attoproperty.com.au",
  "Industry": "cleaning",
  "Description": "Professional carpet and upholstery cleaning services",
  "SitemapUrl": "https://attoproperty.com.au/sitemap.xml",
  "AutoCrawl": true,
  "Ctas": [
    {
      "Type": "phone",
      "Priority": 1,
      "Label": "Call Now",
      "ValueRaw": "+61412345678"
    },
    {
      "Type": "whatsapp",
      "Priority": 2,
      "Label": "WhatsApp Us",
      "ValueRaw": "+61412345678"
    },
    {
      "Type": "email",
      "Priority": 3,
      "Label": "Email Us",
      "ValueRaw": "info@attoproperty.com.au"
    },
    {
      "Type": "url",
      "Priority": 1,
      "Label": "Get Free Quote",
      "ValueRaw": "https://attoproperty.com.au/quote"
    }
  ],
  "Services": [
    {"Name": "Carpet Cleaning", "Keywords": "carpet cleaning, steam cleaning"},
    {"Name": "Upholstery Cleaning", "Keywords": "upholstery, couch cleaning"}
  ],
  "Locations": [
    {"Name": "Melton", "Type": "suburb", "State": "VIC", "IsPrimary": true},
    {"Name": "Caroline Springs", "Type": "suburb", "State": "VIC"}
  ],
  "Keywords": [
    {"Keyword": "carpet cleaning melton", "Type": "primary"},
    {"Keyword": "steam cleaning services", "Type": "secondary"}
  ],
  "ReferenceArticles": [
    "https://example.com/reference-article-1",
    "https://example.com/reference-article-2"
  ]
}
```

#### Response

```json
{
  "Success": true,
  "Company": {
    "Slug": "atto-property",
    "Name": "Atto Property",
    "Website": "https://attoproperty.com.au",
    "Industry": "cleaning",
    "AutoCrawlEnabled": true,
    "TrainingComplete": false,
    "CreatedAt": "2026-02-03T10:00:00Z"
  },
  "Ctas": {
    "Total": 4,
    "ByType": {
      "phone": 1,
      "whatsapp": 1,
      "email": 1,
      "url": 1
    }
  },
  "Services": {
    "Total": 2
  },
  "Locations": {
    "Total": 2,
    "Primary": "Melton"
  },
  "Keywords": {
    "Total": 2,
    "Primary": 1,
    "Secondary": 1
  },
  "ReferenceArticles": {
    "Total": 2,
    "Processing": true,
    "Message": "Articles queued for extraction via GSearch"
  },
  "Crawl": {
    "Status": "Queued",
    "Message": "Sitemap crawl scheduled"
  }
}
```

---

### Get Random CTA

**GET** `/api/v1/seo/{company}/ctas/random`

Returns a random active CTA weighted by priority for natural variation.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | - | Filter by type: `phone`, `email`, `whatsapp`, `url` |
| `exclude` | int | - | Exclude CTA ID (for sequential uniqueness) |

#### Response

```json
{
  "Success": true,
  "Cta": {
    "Id": 2,
    "Type": "whatsapp",
    "Label": "WhatsApp Us",
    "ValueRaw": "+61412345678",
    "ValueDisplay": "0412 345 678",
    "ValueLink": "https://wa.me/61412345678",
    "HtmlSnippet": "<a href=\"https://wa.me/61412345678\" class=\"cta-whatsapp\" title=\"Chat on WhatsApp\">WhatsApp Us</a>"
  }
}
```

---

### Add Reference Article

**POST** `/api/v1/seo/{company}/articles`

Adds a reference article URL and triggers GSearch extraction.

#### Request

```json
{
  "Url": "https://example.com/well-written-article",
  "ForceRefresh": false
}
```

#### Response

```json
{
  "Success": true,
  "Article": {
    "Id": 1,
    "SourceUrl": "https://example.com/well-written-article",
    "Title": "Expert Guide to Carpet Maintenance",
    "WordCount": 1250,
    "ContentExtracted": true,
    "StyleAnalyzed": true,
    "CacheExpiry": "2026-02-08T10:00:00Z"
  },
  "Extraction": {
    "Format": "markdown",
    "Cached": false,
    "ExtractedAt": "2026-02-03T10:00:00Z"
  },
  "Style": {
    "AvgSentenceLength": 14.5,
    "AvgParagraphLength": 145,
    "FormalityScore": 0.65,
    "ReadabilityScore": 68.5
  }
}
```

---

## CTA Formatting Helper

```go
// FormatCta generates display and link values from raw input
func FormatCta(cta *CompanyCta) {
    switch cta.Type {
    case "phone":
        // +61412345678 → "0412 345 678", "tel:+61412345678"
        cta.ValueDisplay = FormatPhoneDisplay(cta.ValueRaw)
        cta.ValueLink = "tel:" + cta.ValueRaw
    case "whatsapp":
        // +61412345678 → "WhatsApp Us", "https://wa.me/61412345678"
        number := strings.TrimPrefix(cta.ValueRaw, "+")
        cta.ValueLink = "https://wa.me/" + number
        if cta.ValueDisplay == "" {
            cta.ValueDisplay = cta.Label
        }
    case "email":
        // info@company.com → "info@company.com", "mailto:info@company.com"
        cta.ValueDisplay = cta.ValueRaw
        cta.ValueLink = "mailto:" + cta.ValueRaw
    case "url", "form", "booking":
        // URL stays as-is
        cta.ValueDisplay = cta.Label
        cta.ValueLink = cta.ValueRaw
    }
}

// FormatPhoneDisplay formats international number for display
func FormatPhoneDisplay(raw string) string {
    // +61412345678 → "0412 345 678"
    if strings.HasPrefix(raw, "+61") {
        num := strings.TrimPrefix(raw, "+61")
        if len(num) == 9 {
            return fmt.Sprintf("0%s %s %s", num[:3], num[3:6], num[6:])
        }
    }
    return raw
}

// GetRandomCta selects CTA weighted by priority
func GetRandomCta(ctas []CompanyCta, ctaType string, excludeId int) *CompanyCta {
    var candidates []CompanyCta
    var weights []int
    
    for _, c := range ctas {
        if !c.IsActive {
            continue
        }
        if ctaType != "" && c.Type != ctaType {
            continue
        }
        if c.Id == excludeId {
            continue
        }
        candidates = append(candidates, c)
        // Higher priority = higher weight (inverse: priority 1 gets weight 10)
        weights = append(weights, 11 - c.Priority)
    }
    
    if len(candidates) == 0 {
        return nil
    }
    
    // Weighted random selection
    totalWeight := 0
    for _, w := range weights {
        totalWeight += w
    }
    
    r := rand.Intn(totalWeight)
    cumulative := 0
    for i, w := range weights {
        cumulative += w
        if r < cumulative {
            return &candidates[i]
        }
    }
    
    return &candidates[0]
}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 9596 | `ErrCompanyNotFound` | Company slug does not exist |
| 9597 | `ErrCompanyAlreadyExists` | Slug already in use |
| 9598 | `ErrCompanyCreationFailed` | Database error on create |
| 9599 | `ErrCtaInvalidType` | Unknown CTA type |
| 9600 | `ErrCtaNotFound` | CTA ID does not exist |
| 9601 | `ErrArticleExtractionFailed` | GSearch could not extract content |
| 9602 | `ErrStyleAnalysisFailed` | Writing style analysis error |
| 9603 | `ErrCrawlQueueFailed` | Could not queue sitemap crawl |

---

## Integration with GSearch

### Reference Article Extraction

When a reference article URL is provided, the system calls GSearch to extract content:

```bash
# GSearch extracts content in multiple formats
gsearch extract https://example.com/article \
  --format text,markdown,html,json \
  --analyze-style \
  --cache-days 5
```

### Sitemap Crawling (Optional)

When `AutoCrawl: true`, the system queues a sitemap crawl:

```bash
gsearch crawl https://company.com/sitemap.xml \
  --sitemap \
  --max-pages 500 \
  --store-to data/{appName}/rag/seo/{company-slug}.db
```

---

## Related Specifications

| Spec | Description |
|------|-------------|
| 26-database-paths-reference.md | Database path definitions |
| 27-ai-seo-blog-generation.md | Blog generation using company profile |
| 29-gsearch-url-extraction.md | GSearch content extraction (NEW) |
| 30-openapi-spec-seo.md | OpenAPI for all SEO endpoints (NEW) |
