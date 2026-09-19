# Phase 6: Response Formatting and Caching

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Error Code Range:** 7800–7819  

---

## Overview

Phase 6 defines the unified response formatting system and advanced caching layer for the GSearch Business Intelligence Suite. This phase standardizes JSON output structures, implements configurable TTL policies, and provides cache control mechanisms across all BI features.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Response Pipeline                        │
├─────────────────────────────────────────────────────────────┤
│  Request → Cache Check → Execute/Retrieve → Format → Output │
└─────────────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │ CacheMan │   │Formatter │   │ TTLPolicy│
   │ ager     │   │ Engine   │   │ Manager  │
   └──────────┘   └──────────┘   └──────────┘
         │               │               │
         ▼               ▼               ▼
   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │ Session  │   │ Template │   │ Setting  │
   │ DBs      │   │ Registry │   │ DB       │
   └──────────┘   └──────────┘   └──────────┘
```

---

## Response Format Standards

### Unified Response Envelope

All BI endpoints return a consistent envelope structure:

```go
// ResponseEnvelope wraps all API responses
type ResponseEnvelope struct {
    Success    bool              `json:",omitempty"`
    Data       json.RawMessage   `json:",omitempty"`
    Meta       ResponseMeta      `json:",omitempty"`
    Pagination *PaginationMeta   `json:",omitempty"`
    Cache      *CacheMeta        `json:",omitempty"`
    Errors     []ResponseError   `json:",omitempty"`
}

// ResponseMeta contains request metadata
type ResponseMeta struct {
    RequestId   string    `json:",omitempty"`
    Timestamp   time.Time `json:",omitempty"`
    Duration    int64     `json:",omitempty"` // milliseconds
    Version     string    `json:",omitempty"`
    Engine      string    `json:",omitempty"` // search engine used
    Method      string    `json:",omitempty"` // api/scrape/cache
}

// PaginationMeta for paginated responses
type PaginationMeta struct {
    Page       int  `json:",omitempty"`
    PerPage    int  `json:",omitempty"`
    Total      int  `json:",omitempty"`
    TotalPages int  `json:",omitempty"`
    HasNext    bool `json:",omitempty"`
    HasPrev    bool `json:",omitempty"`
}

// CacheMeta provides cache transparency
type CacheMeta struct {
    Hit       bool      `json:",omitempty"`
    Key       string    `json:",omitempty"`
    CreatedAt time.Time `json:",omitempty"`
    ExpiresAt time.Time `json:",omitempty"`
    TtlDays   int       `json:",omitempty"`
    Source    string    `json:",omitempty"` // fresh/cache/stale
}

// ResponseError for error details
type ResponseError struct {
    Code    int    `json:",omitempty"`
    Message string `json:",omitempty"`
    Field   string `json:",omitempty"`
    Details string `json:",omitempty"`
}
```

### Nested JSON Structures

#### Search Results with Enrichment

```go
// EnrichedSearchResult combines search with extracted data
type EnrichedSearchResult struct {
    Query      string              `json:",omitempty"`
    Engine     string              `json:",omitempty"`
    Results    []SearchResultItem  `json:",omitempty"`
    AiOverview *AiOverviewData     `json:",omitempty"`
    FaqItems   []FaqItem           `json:",omitempty"`
    Related    []string            `json:",omitempty"`
}

// SearchResultItem with nested contact/authority data
type SearchResultItem struct {
    Position    int             `json:",omitempty"`
    Title       string          `json:",omitempty"`
    Url         string          `json:",omitempty"`
    Snippet     string          `json:",omitempty"`
    Domain      string          `json:",omitempty"`
    
    // Nested enrichment (optional)
    Contact     *ContactInfo    `json:",omitempty"`
    Authority   *AuthorityScore `json:",omitempty"`
    SerpHistory *PositionHistory `json:",omitempty"`
}

// ContactInfo nested structure
type ContactInfo struct {
    Emails   []EmailRecord  `json:",omitempty"`
    Phones   []PhoneRecord  `json:",omitempty"`
    Socials  []SocialLink   `json:",omitempty"`
    Verified bool           `json:",omitempty"`
}

// AuthorityScore nested structure
type AuthorityScore struct {
    DomainAuthority int     `json:",omitempty"`
    PageAuthority   int     `json:",omitempty"`
    TrustFlow       int     `json:",omitempty"`
    CitationFlow    int     `json:",omitempty"`
    BacklinkCount   int64   `json:",omitempty"`
    CompositeScore  float64 `json:",omitempty"`
}
```

#### Business Data with Full Context

```go
// BusinessRecord with nested details
type BusinessRecord struct {
    PlaceId     string           `json:",omitempty"`
    Name        string           `json:",omitempty"`
    Address     AddressData      `json:",omitempty"`
    Contact     BusinessContact  `json:",omitempty"`
    Metrics     BusinessMetrics  `json:",omitempty"`
    Hours       []HoursEntry     `json:",omitempty"`
    Categories  []string         `json:",omitempty"`
    Enrichment  *EnrichmentData  `json:",omitempty"`
}

// AddressData structured address
type AddressData struct {
    Full       string  `json:",omitempty"`
    Street     string  `json:",omitempty"`
    City       string  `json:",omitempty"`
    State      string  `json:",omitempty"`
    PostalCode string  `json:",omitempty"`
    Country    string  `json:",omitempty"`
    Latitude   float64 `json:",omitempty"`
    Longitude  float64 `json:",omitempty"`
}

// BusinessContact from Maps + website extraction
type BusinessContact struct {
    Phone       string         `json:",omitempty"`
    Website     string         `json:",omitempty"`
    Emails      []EmailRecord  `json:",omitempty"`
    Socials     []SocialLink   `json:",omitempty"`
    WhatsApp    string         `json:",omitempty"`
}

// BusinessMetrics ratings and reviews
type BusinessMetrics struct {
    Rating       float64 `json:",omitempty"`
    ReviewCount  int     `json:",omitempty"`
    PriceLevel   int     `json:",omitempty"`
    IsOpen       bool    `json:",omitempty"`
    IsPermanent  bool    `json:",omitempty"`
}
```

---

## Output Formats

### Format Types

```go
type OutputFormat string

const (
    FormatJson       OutputFormat = "json"
    FormatJsonPretty OutputFormat = "json-pretty"
    FormatJsonLines  OutputFormat = "jsonl"
    FormatCsv        OutputFormat = "csv"
    FormatTsv        OutputFormat = "tsv"
    FormatMarkdown   OutputFormat = "markdown"
    FormatTable      OutputFormat = "table"
    FormatMinimal    OutputFormat = "minimal"
)
```

### Formatter Engine

```go
// FormatterEngine handles output transformation
type FormatterEngine struct {
    format      OutputFormat
    fields      []string          // field selection
    excludes    []string          // field exclusion
    flatten     bool              // flatten nested objects
    templates   *TemplateRegistry
    writer      io.Writer
}

// FormatterConfig for customization
type FormatterConfig struct {
    Format         OutputFormat `json:",omitempty"`
    Fields         []string     `json:",omitempty"`
    Exclude        []string     `json:",omitempty"`
    FlattenNested  bool         `json:",omitempty"`
    IncludeMeta    bool         `json:",omitempty"`
    IncludeCache   bool         `json:",omitempty"`
    PrettyPrint    bool         `json:",omitempty"`
    DateFormat     string       `json:",omitempty"`
    NullValue      string       `json:",omitempty"`
}

// NewFormatterEngine creates configured formatter
func NewFormatterEngine(cfg FormatterConfig) *FormatterEngine {
    return &FormatterEngine{
        format:    cfg.Format,
        fields:    cfg.Fields,
        excludes:  cfg.Exclude,
        flatten:   cfg.FlattenNested,
        templates: NewTemplateRegistry(),
        writer:    os.Stdout,
    }
}

// Format processes and outputs data
func (f *FormatterEngine) Format(envelope ResponseEnvelope) *apperror.AppError {
    // Apply field selection
    data := f.selectFields(envelope)
    
    // Apply exclusions
    data = f.excludeFields(data)
    
    // Flatten if requested
    if f.flatten {
        data = f.flattenData(data)
    }
    
    // Output in requested format
    switch f.format {
    case FormatJson:
        return f.outputJson(data, false)
    case FormatJsonPretty:
        return f.outputJson(data, true)
    case FormatJsonLines:
        return f.outputJsonLines(data)
    case FormatCsv:
        return f.outputCsv(data)
    case FormatTsv:
        return f.outputTsv(data)
    case FormatMarkdown:
        return f.outputMarkdown(data)
    case FormatTable:
        return f.outputTable(data)
    case FormatMinimal:
        return f.outputMinimal(data)
    default:
        return apperror.New(
            "unsupported output format",
        )
    }
}
```

### Field Selection

```go
// FieldSelector for JSON path selection
type FieldSelector struct {
    paths []FieldPath
}

// FieldPath represents a JSON path
type FieldPath struct {
    segments []string
    alias    string
}

// FieldSelection holds extracted field key-value pairs
type FieldSelection struct {
    Fields map[string]json.RawMessage
}

// Select extracts fields from data
func (s *FieldSelector) Select(data json.RawMessage) FieldSelection {
    result := FieldSelection{Fields: make(map[string]json.RawMessage)}
    
    for _, path := range s.paths {
        value := s.extractPath(data, path.segments)
        key := path.alias
        if key == "" {
            key = path.segments[len(path.segments)-1]
        }
        result.Fields[key] = value
    }
    
    return result
}

// ParseFieldSpec parses field specification
// Examples: "Title,Url,Contact.Emails[0].Address as Email"
func ParseFieldSpec(spec string) apperror.Result[*FieldSelector] {
    selector := &FieldSelector{}
    
    fields := strings.Split(spec, ",")
    for _, field := range fields {
        path, err := parseFieldPath(strings.TrimSpace(field))
        if err != nil {
            return apperror.Fail[*FieldSelector](
                apperror.Wrap(
                    err,
                    "parse field path",
                ),
            )
        }

        selector.paths = append(selector.paths, path)
    }
    
    return apperror.OK(selector)
}
```

---

## Caching System

### TTL Configuration

```go
// TtlPolicy defines cache duration rules
type TtlPolicy struct {
    Category    string        `json:",omitempty"`
    DefaultTtl  time.Duration `json:",omitempty"`
    MinTtl      time.Duration `json:",omitempty"`
    MaxTtl      time.Duration `json:",omitempty"`
    Immutable   bool          `json:",omitempty"` // never expires
}

// Default TTL policies by data category
var DefaultTtlPolicies = map[string]TtlPolicy{
    "search_results": {
        Category:   "search_results",
        DefaultTtl: 5 * 24 * time.Hour,   // 5 days
        MinTtl:     1 * time.Hour,
        MaxTtl:     30 * 24 * time.Hour,
    },
    "url_extraction": {
        Category:   "url_extraction",
        DefaultTtl: 5 * 24 * time.Hour,   // 5 days
        MinTtl:     1 * time.Hour,
        MaxTtl:     30 * 24 * time.Hour,
    },
    "serp_snapshot": {
        Category:   "serp_snapshot",
        DefaultTtl: 24 * time.Hour,       // 1 day
        MinTtl:     1 * time.Hour,
        MaxTtl:     7 * 24 * time.Hour,
    },
    "position_history": {
        Category:   "position_history",
        DefaultTtl: 365 * 24 * time.Hour, // 1 year
        MinTtl:     90 * 24 * time.Hour,
        MaxTtl:     0, // unlimited
        Immutable:  true,
    },
    "contact_data": {
        Category:   "contact_data",
        DefaultTtl: 180 * 24 * time.Hour, // 180 days
        MinTtl:     30 * 24 * time.Hour,
        MaxTtl:     365 * 24 * time.Hour,
    },
    "business_data": {
        Category:   "business_data",
        DefaultTtl: 90 * 24 * time.Hour,  // 90 days
        MinTtl:     7 * 24 * time.Hour,
        MaxTtl:     180 * 24 * time.Hour,
    },
    "authority_scores": {
        Category:   "authority_scores",
        DefaultTtl: 30 * 24 * time.Hour,  // 30 days
        MinTtl:     7 * 24 * time.Hour,
        MaxTtl:     90 * 24 * time.Hour,
    },
    "faq_content": {
        Category:   "faq_content",
        DefaultTtl: 14 * 24 * time.Hour,  // 14 days
        MinTtl:     1 * 24 * time.Hour,
        MaxTtl:     60 * 24 * time.Hour,
    },
    "ai_overview": {
        Category:   "ai_overview",
        DefaultTtl: 7 * 24 * time.Hour,   // 7 days
        MinTtl:     1 * 24 * time.Hour,
        MaxTtl:     30 * 24 * time.Hour,
    },
}
```

### TTL Policy Manager

```go
// TtlPolicyManager manages cache duration policies
type TtlPolicyManager struct {
    settingDb *gorm.DB
    policies  map[string]TtlPolicy
    mu        sync.RWMutex
}

// NewTtlPolicyManager creates manager with defaults
func NewTtlPolicyManager(db *gorm.DB) *TtlPolicyManager {
    mgr := &TtlPolicyManager{
        settingDb: db,
        policies:  make(map[string]TtlPolicy),
    }
    
    // Load defaults
    for k, v := range DefaultTtlPolicies {
        mgr.policies[k] = v
    }
    
    // Override from settings DB
    mgr.loadFromSettings()
    
    return mgr
}

// GetTtl returns TTL for category with optional override
func (m *TtlPolicyManager) GetTtl(category string, override *time.Duration) time.Duration {
    m.mu.RLock()
    defer m.mu.RUnlock()
    
    policy, exists := m.policies[category]
    if !exists {
        return 5 * 24 * time.Hour // fallback default
    }
    
    if override != nil {
        // Clamp to min/max
        ttl := *override
        if ttl < policy.MinTtl {
            ttl = policy.MinTtl
        }
        if policy.MaxTtl > 0 && ttl > policy.MaxTtl {
            ttl = policy.MaxTtl
        }
        return ttl
    }
    
    return policy.DefaultTtl
}

// SetPolicy updates a TTL policy
func (m *TtlPolicyManager) SetPolicy(category string, policy TtlPolicy) *apperror.AppError {
    m.mu.Lock()
    defer m.mu.Unlock()
    
    m.policies[category] = policy

    return m.persistToSettings(category, policy)
}
```

### Cache Manager

```go
// CacheManager handles all caching operations
type CacheManager struct {
    rootDb      *gorm.DB
    sessionPath string
    ttlManager  *TtlPolicyManager
    keyGen      *CacheKeyGenerator
}

// CacheEntry represents a cached item
type CacheEntry struct {
    Key       string    `gorm:"primaryKey"`
    Category  string    `gorm:"index"`
    Data      []byte    // gzip compressed JSON
    Hash      string    // content hash for dedup
    CreatedAt time.Time `gorm:"index"`
    ExpiresAt time.Time `gorm:"index"`
    HitCount  int64
    LastHit   time.Time
    SizeBytes int64
    Metadata  string    // JSON metadata
}

// CacheKeyGenerator creates consistent cache keys
type CacheKeyGenerator struct {
    prefix string
}

// GenerateKey creates a cache key from parameters
// CacheKeyParams holds typed parameters for cache key generation
type CacheKeyParams struct {
    Query      string
    Engine     string
    Platform   string
    Provider   string
    Mode       string
    MaxResults int
}

func (g *CacheKeyGenerator) GenerateKey(category string, params CacheKeyParams) string {
    // Sort keys for consistency
    keys := make([]string, 0, len(params))
    for k := range params {
        keys = append(keys, k)
    }
    sort.Strings(keys)
    
    // Build key string
    var builder strings.Builder
    builder.WriteString(g.prefix)
    builder.WriteString(":")
    builder.WriteString(category)
    
    for _, k := range keys {
        builder.WriteString(":")
        builder.WriteString(k)
        builder.WriteString("=")
        builder.WriteString(fmt.Sprintf("%v", params[k]))
    }
    
    // Hash for fixed length
    hash := sha256.Sum256([]byte(builder.String()))
    return hex.EncodeToString(hash[:16])
}

// CacheHitUpdate holds typed fields for updating cache hit statistics
type CacheHitUpdate struct {
    HitCount clause.Expr // gorm.Expr for increment
    LastHit  time.Time
}

// Get retrieves cached data
func (m *CacheManager) Get(key string) apperror.Result[*CacheEntry] {
    var entry CacheEntry
    
    result := m.rootDb.Where("Key = ? AND ExpiresAt > ?", key, time.Now()).First(&entry)
    if result.Error != nil {
        if errors.Is(result.Error, gorm.ErrRecordNotFound) {
            return apperror.OK[*CacheEntry](nil) // cache miss
        }

        return apperror.Fail[*CacheEntry](
            apperror.Wrap(
                result.Error,
                "cache read failed",
            ),
        )
    }
    
    // Update hit stats
    m.rootDb.Model(&entry).Updates(CacheHitUpdate{
        HitCount: gorm.Expr("HitCount + 1"),
        LastHit:  time.Now(),
    })
    
    return apperror.OK(&entry)
}

// Set stores data in cache
func (m *CacheManager) Set(key, category string, data json.RawMessage, ttlOverride *time.Duration) *apperror.AppError {
    // Serialize and compress
    jsonData, err := json.Marshal(data)
    if err != nil {
        return apperror.Wrap(
            err,
            "marshal cache data",
        )
    }
    
    var compressed bytes.Buffer
    gz := gzip.NewWriter(&compressed)
    gz.Write(jsonData)
    gz.Close()
    
    // Calculate TTL
    ttl := m.ttlManager.GetTtl(category, ttlOverride)
    
    entry := CacheEntry{
        Key:       key,
        Category:  category,
        Data:      compressed.Bytes(),
        Hash:      m.hashContent(jsonData),
        CreatedAt: time.Now(),
        ExpiresAt: time.Now().Add(ttl),
        SizeBytes: int64(len(compressed.Bytes())),
    }
    
    dbResult := m.rootDb.Clauses(clause.OnConflict{
        Columns:   []clause.Column{{Name: "Key"}},
        UpdateAll: true,
    }).Create(&entry)

    if dbResult.Error != nil {
        return apperror.Wrap(
            dbResult.Error,
            "cache write failed",
        )
    }

    return nil
}

// InvalidateOutcome holds the result of a cache invalidation
type InvalidateOutcome struct {
    RowsAffected int64
    Err          *apperror.AppError
}

// Invalidate removes cache entries
func (m *CacheManager) Invalidate(pattern string) InvalidateOutcome {
    result := m.rootDb.Where("Key LIKE ?", pattern+"%").Delete(&CacheEntry{})
    if result.Error != nil {
        return InvalidateOutcome{Err: apperror.Wrap(result.Error, "cache invalidate failed")}
    }

    return InvalidateOutcome{RowsAffected: result.RowsAffected}
}

// InvalidateByCategory removes all entries in a category
func (m *CacheManager) InvalidateByCategory(category string) InvalidateOutcome {
    result := m.rootDb.Where("Category = ?", category).Delete(&CacheEntry{})
    if result.Error != nil {
        return InvalidateOutcome{Err: apperror.Wrap(result.Error, "category invalidate failed")}
    }

    return InvalidateOutcome{RowsAffected: result.RowsAffected}
}

// Cleanup removes expired entries
func (m *CacheManager) Cleanup() InvalidateOutcome {
    result := m.rootDb.Where("ExpiresAt < ?", time.Now()).Delete(&CacheEntry{})
    if result.Error != nil {
        return InvalidateOutcome{Err: apperror.Wrap(result.Error, "cache cleanup failed")}
    }

    return InvalidateOutcome{RowsAffected: result.RowsAffected}
}
```

---

## Cache Control

### Cache Control Flags

```go
// CacheControl defines cache behavior
type CacheControl struct {
    NoCache     bool           // bypass cache, fetch fresh
    NoStore     bool           // don't cache result
    ForceRefresh bool          // delete existing, fetch fresh
    MaxAge      *time.Duration // custom TTL
    StaleOk     bool           // accept stale if fresh fails
    StaleMaxAge *time.Duration // max staleness acceptable
}

// ParseCacheControl parses cache-control header/flag
func ParseCacheControl(value string) CacheControl {
    cc := CacheControl{}
    
    directives := strings.Split(value, ",")
    for _, d := range directives {
        d = strings.TrimSpace(strings.ToLower(d))
        
        switch {
        case d == "no-cache":
            cc.NoCache = true
        case d == "no-store":
            cc.NoStore = true
        case d == "force-refresh":
            cc.ForceRefresh = true
        case d == "stale-ok":
            cc.StaleOk = true
        case strings.HasPrefix(d, "max-age="):
            if days, err := strconv.Atoi(d[8:]); err == nil {
                age := time.Duration(days) * 24 * time.Hour
                cc.MaxAge = &age
            }
        case strings.HasPrefix(d, "stale-max-age="):
            if days, err := strconv.Atoi(d[14:]); err == nil {
                age := time.Duration(days) * 24 * time.Hour
                cc.StaleMaxAge = &age
            }
        }
    }
    
    return cc
}
```

### Stale-While-Revalidate

```go
// StaleRevalidator handles stale cache with background refresh
type StaleRevalidator struct {
    cache     *CacheManager
    refreshCh chan refreshJob
    wg        sync.WaitGroup
}

type refreshJob struct {
    key      string
    category string
    fetcher  func() apperror.Result[json.RawMessage]
}

// RevalidateOutcome holds the result of a cache revalidation
type RevalidateOutcome struct {
    Data json.RawMessage
    Meta *CacheMeta
}

// GetWithRevalidate returns cached data, refreshing in background if stale
func (r *StaleRevalidator) GetWithRevalidate(
    key, category string,
    cc CacheControl,
    fetcher func() apperror.Result[json.RawMessage],
) apperror.Result[RevalidateOutcome] {
    
    entry, err := r.cache.Get(key)
    if err != nil {
        return apperror.Fail[RevalidateOutcome](apperror.Wrap(err, 7110, "get cache entry"))
    }
    
    // Cache miss
    if entry == nil {
        fetchResult := fetcher()
        if fetchResult.IsFailure() {
            return nil, nil, err
        }
        
        if !cc.NoStore {
            r.cache.Set(key, category, data, cc.MaxAge)
        }
        
        return data, &CacheMeta{
            Hit:    false,
            Source: "fresh",
        }, nil
    }
    
    // Check if stale
    isStale := entry.ExpiresAt.Before(time.Now())
    
    if isStale && !cc.StaleOk {
        // Must fetch fresh
        data, err := fetcher()
        if err != nil {
            return nil, nil, err
        }
        
        if !cc.NoStore {
            r.cache.Set(key, category, data, cc.MaxAge)
        }
        
        return data, &CacheMeta{
            Hit:    false,
            Source: "fresh",
        }, nil
    }
    
    // Return cached, optionally refresh in background
    data, err := r.decompress(entry.Data)
    if err != nil {
        return nil, nil, err
    }
    
    if isStale {
        // Background refresh
        r.refreshCh <- refreshJob{
            key:      key,
            category: category,
            fetcher:  fetcher,
        }
    }
    
    return data, &CacheMeta{
        Hit:       true,
        Key:       key,
        CreatedAt: entry.CreatedAt,
        ExpiresAt: entry.ExpiresAt,
        Source:    map[bool]string{true: "stale", false: "cache"}[isStale],
    }, nil
}
```

---

## CLI Integration

### Format Flags

```bash
# Output format flags
gsearch search "query" --format json          # Default JSON
gsearch search "query" --format json-pretty   # Indented JSON
gsearch search "query" --format jsonl         # JSON Lines (streaming)
gsearch search "query" --format csv           # CSV export
gsearch search "query" --format markdown      # Markdown table
gsearch search "query" --format table         # ASCII table

# Field selection
gsearch search "query" --fields "Title,Url,Position"
gsearch search "query" --fields "Title,Contact.Emails[0].Address as Email"
gsearch search "query" --exclude "Snippet,Meta"

# Flatten nested objects
gsearch search "query" --flatten

# Include/exclude metadata
gsearch search "query" --with-meta
gsearch search "query" --with-cache-info
gsearch search "query" --no-meta
```

### Cache Control Flags

```bash
# Cache behavior flags
gsearch search "query"                    # Use cache if available
gsearch search "query" --no-cache         # Bypass cache, fetch fresh
gsearch search "query" --force            # Delete cache, fetch fresh
gsearch search "query" --no-store         # Don't cache result
gsearch search "query" --ttl 10           # Custom TTL (days)
gsearch search "query" --stale-ok         # Accept stale if fresh fails
gsearch search "query" --stale-max-age 7  # Max stale age (days)

# Cache management commands
gsearch cache stats                       # Show cache statistics
gsearch cache list [category]             # List cached items
gsearch cache clear [category]            # Clear cache
gsearch cache cleanup                     # Remove expired entries
gsearch cache inspect <key>               # View cache entry details
```

### CLI Implementation

```go
// FormatFlags for Cobra commands
type FormatFlags struct {
    Format       string
    Fields       string
    Exclude      string
    Flatten      bool
    WithMeta     bool
    WithCache    bool
    NoMeta       bool
}

// CacheFlags for cache control
type CacheFlags struct {
    NoCache     bool
    NoStore     bool
    Force       bool
    Ttl         int
    StaleOk     bool
    StaleMaxAge int
}

// AddFormatFlags adds format flags to command
func AddFormatFlags(cmd *cobra.Command, flags *FormatFlags) {
    cmd.Flags().StringVar(&flags.Format, "format", "json", 
        "Output format: json, json-pretty, jsonl, csv, tsv, markdown, table")
    cmd.Flags().StringVar(&flags.Fields, "fields", "", 
        "Comma-separated fields to include")
    cmd.Flags().StringVar(&flags.Exclude, "exclude", "", 
        "Comma-separated fields to exclude")
    cmd.Flags().BoolVar(&flags.Flatten, "flatten", false, 
        "Flatten nested objects")
    cmd.Flags().BoolVar(&flags.WithMeta, "with-meta", false, 
        "Include response metadata")
    cmd.Flags().BoolVar(&flags.WithCache, "with-cache-info", false, 
        "Include cache information")
    cmd.Flags().BoolVar(&flags.NoMeta, "no-meta", false, 
        "Exclude all metadata")
}

// AddCacheFlags adds cache control flags to command
func AddCacheFlags(cmd *cobra.Command, flags *CacheFlags) {
    cmd.Flags().BoolVar(&flags.NoCache, "no-cache", false, 
        "Bypass cache, fetch fresh data")
    cmd.Flags().BoolVar(&flags.NoStore, "no-store", false, 
        "Don't cache the result")
    cmd.Flags().BoolVar(&flags.Force, "force", false, 
        "Delete existing cache, fetch fresh")
    cmd.Flags().IntVar(&flags.Ttl, "ttl", 0, 
        "Custom TTL in days (0 = default)")
    cmd.Flags().BoolVar(&flags.StaleOk, "stale-ok", false, 
        "Accept stale data if fresh fetch fails")
    cmd.Flags().IntVar(&flags.StaleMaxAge, "stale-max-age", 0, 
        "Maximum stale age in days")
}
```

---

## Database Schema

### Cache Tables

```sql
-- Cache entries table
CREATE TABLE CacheEntries (
    Key         TEXT PRIMARY KEY,
    Category    TEXT NOT NULL,
    Data        BLOB NOT NULL,          -- gzip compressed
    Hash        TEXT NOT NULL,          -- content hash
    CreatedAt   DATETIME NOT NULL,
    ExpiresAt   DATETIME NOT NULL,
    HitCount    INTEGER DEFAULT 0,
    LastHit     DATETIME,
    SizeBytes   INTEGER NOT NULL,
    Metadata    TEXT                    -- JSON
);

CREATE INDEX IdxCacheCategory ON CacheEntries(Category);
CREATE INDEX IdxCacheExpires ON CacheEntries(ExpiresAt);
CREATE INDEX IdxCacheCreated ON CacheEntries(CreatedAt);

-- TTL policies table (in Setting DB)
CREATE TABLE TtlPolicies (
    Category    TEXT PRIMARY KEY,
    DefaultTtl  INTEGER NOT NULL,       -- seconds
    MinTtl      INTEGER NOT NULL,
    MaxTtl      INTEGER NOT NULL,
    Immutable   BOOLEAN DEFAULT FALSE,
    UpdatedAt   DATETIME NOT NULL
);

-- Cache statistics table
CREATE TABLE CacheStats (
    Category    TEXT PRIMARY KEY,
    TotalHits   INTEGER DEFAULT 0,
    TotalMisses INTEGER DEFAULT 0,
    TotalSize   INTEGER DEFAULT 0,
    EntryCount  INTEGER DEFAULT 0,
    LastCleanup DATETIME,
    UpdatedAt   DATETIME NOT NULL
);
```

---

## Cache Statistics

```go
// CacheStats provides cache metrics
type CacheStats struct {
    Category      string
    TotalHits     int64
    TotalMisses   int64
    HitRate       float64
    TotalSize     int64
    EntryCount    int64
    AvgEntrySize  int64
    OldestEntry   time.Time
    NewestEntry   time.Time
    ExpiredCount  int64
}

// GetStats retrieves cache statistics
func (m *CacheManager) GetStats(category string) apperror.Result[*CacheStats] {
    var stats CacheStats
    
    query := m.rootDb.Model(&CacheEntry{})
    if category != "" {
        query = query.Where("Category = ?", category)
    }
    
    // Count and size
    var count int64
    var totalSize int64
    query.Count(&count)
    query.Select("COALESCE(SUM(SizeBytes), 0)").Scan(&totalSize)
    
    stats.EntryCount = count
    stats.TotalSize = totalSize
    if count > 0 {
        stats.AvgEntrySize = totalSize / count
    }
    
    // Hit stats from stats table
    var cached CacheStats
    m.rootDb.Table("CacheStats").Where("Category = ?", category).First(&cached)
    stats.TotalHits = cached.TotalHits
    stats.TotalMisses = cached.TotalMisses
    
    if stats.TotalHits+stats.TotalMisses > 0 {
        stats.HitRate = float64(stats.TotalHits) / float64(stats.TotalHits+stats.TotalMisses)
    }
    
    // Age stats
    query.Select("MIN(CreatedAt)").Scan(&stats.OldestEntry)
    query.Select("MAX(CreatedAt)").Scan(&stats.NewestEntry)
    
    // Expired count
    m.rootDb.Model(&CacheEntry{}).
        Where("Category = ? AND ExpiresAt < ?", category, time.Now()).
        Count(&stats.ExpiredCount)
    
    return apperror.OK(&stats)
}
```

---

## Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 7800 | ErrFormatUnsupported | Unsupported output format |
| 7801 | ErrFieldPathInvalid | Invalid field path syntax |
| 7802 | ErrFieldNotFound | Requested field not in data |
| 7803 | ErrFlattenFailed | Failed to flatten nested data |
| 7804 | ErrTemplateNotFound | Output template not found |
| 7805 | ErrTemplateParseFailed | Template parsing failed |
| 7806 | ErrCacheKeyInvalid | Invalid cache key format |
| 7807 | ErrCacheReadFailed | Failed to read from cache |
| 7808 | ErrCacheWriteFailed | Failed to write to cache |
| 7809 | ErrCacheDecompressFailed | Failed to decompress cached data |
| 7810 | ErrTtlOutOfRange | TTL outside allowed range |
| 7811 | ErrTtlPolicyNotFound | TTL policy not configured |
| 7812 | ErrCacheCleanupFailed | Cache cleanup operation failed |
| 7813 | ErrCacheInvalidateFailed | Cache invalidation failed |
| 7814 | ErrStaleDataExpired | Stale data beyond max age |
| 7815 | ErrCacheStatsUnavailable | Cache statistics unavailable |
| 7816 | ErrJsonMarshalFailed | JSON marshaling failed |
| 7817 | ErrCsvEncodeFailed | CSV encoding failed |
| 7818 | ErrMarkdownRenderFailed | Markdown rendering failed |
| 7819 | Reserved | Reserved for future use |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Split DB Architecture | `02-spec/06-split-db-architecture/00-overview.md` |
| Settings Service | `21-settings-service.md` |
| Multi-Engine Search | `42-multi-engine-search.md` |
| Contact Extraction | `45-contact-extraction.md` |
| Google Maps Search | `46-google-maps-search.md` |
| Error Codes | `15-error-codes.md` |
