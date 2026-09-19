# Phase 7: Unified REST API Endpoints

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Error Code Range:** 7820–7839  

---

## Overview

Phase 7 defines the unified REST API layer for the GSearch Business Intelligence Suite. This specification consolidates all BI features (Multi-Engine Search, FAQ Discovery, SERP Tracking, Contact Extraction, Google Maps) under a consistent RESTful interface with comprehensive OpenAPI 3.1 documentation, authentication, rate limiting, and webhook support.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                              │
├─────────────────────────────────────────────────────────────────┤
│  Auth │ Rate Limit │ Validation │ Logging │ CORS │ Compression │
└───────────────────────────┬─────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
   ┌──────────┐      ┌──────────┐      ┌──────────┐
   │ /search  │      │ /serp    │      │ /maps    │
   │ Endpoints│      │ Endpoints│      │ Endpoints│
   └──────────┘      └──────────┘      └──────────┘
         │                  │                  │
         ▼                  ▼                  ▼
   ┌──────────┐      ┌──────────┐      ┌──────────┐
   │ /extract │      │ /contact │      │ /webhook │
   │ Endpoints│      │ Endpoints│      │ Endpoints│
   └──────────┘      └──────────┘      └──────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ Response Layer   │
                  │ (Phase 6)        │
                  └──────────────────┘
```

---

## Base Configuration

### Server Setup

```go
// ApiConfig for server configuration
type ApiConfig struct {
    Host            string        `json:",omitempty"`
    Port            int           `json:",omitempty"`
    BasePath        string        `json:",omitempty"`
    EnableSwagger   bool          `json:",omitempty"`
    EnableCors      bool          `json:",omitempty"`
    EnableRateLimit bool          `json:",omitempty"`
    EnableAuth      bool          `json:",omitempty"`
    ReadTimeout     time.Duration `json:",omitempty"`
    WriteTimeout    time.Duration `json:",omitempty"`
    MaxBodySize     int64         `json:",omitempty"`
}

// DefaultApiConfig returns production defaults
func DefaultApiConfig() ApiConfig {
    return ApiConfig{
        Host:            "0.0.0.0",
        Port:            5020,
        BasePath:        "/api/v1/bi",
        EnableSwagger:   true,
        EnableCors:      true,
        EnableRateLimit: true,
        EnableAuth:      true,
        ReadTimeout:     30 * time.Second,
        WriteTimeout:    120 * time.Second,
        MaxBodySize:     10 * 1024 * 1024, // 10MB
    }
}
```

### URL Structure

```
Base URL: /api/v1/bi

Endpoints:
├── /search                 # Multi-engine search
│   ├── POST /              # Execute search
│   ├── GET  /engines       # List available engines
│   └── GET  /methods       # List search methods
│
├── /faq                    # FAQ discovery
│   ├── POST /discover      # Extract FAQs from query
│   ├── POST /expand        # Expand PAA questions
│   └── GET  /schemas       # Supported schema types
│
├── /serp                   # SERP position tracking
│   ├── POST /check         # One-time position check
│   ├── POST /track         # Create tracking job
│   ├── GET  /track/:id     # Get tracking status
│   ├── DELETE /track/:id   # Cancel tracking
│   ├── GET  /history       # Position history
│   └── GET  /competitors   # Competitor analysis
│
├── /contact                # Contact extraction
│   ├── POST /extract       # Extract from URL
│   ├── POST /batch         # Batch extraction
│   ├── GET  /batch/:id     # Batch status
│   └── GET  /verify        # Verify contact
│
├── /maps                   # Google Maps search
│   ├── POST /search        # One-time search
│   ├── POST /job           # Create scheduled job
│   ├── GET  /job/:id       # Job status
│   ├── PATCH /job/:id      # Pause/resume job
│   ├── DELETE /job/:id     # Cancel job
│   └── GET  /job/:id/results # Job results
│
├── /extract                # URL extraction
│   ├── POST /              # Extract content
│   └── POST /batch         # Batch extraction
│
├── /cache                  # Cache management
│   ├── GET  /stats         # Cache statistics
│   ├── DELETE /            # Clear cache
│   └── DELETE /:category   # Clear by category
│
├── /webhook                # Webhook management
│   ├── POST /              # Register webhook
│   ├── GET  /              # List webhooks
│   ├── DELETE /:id         # Remove webhook
│   └── POST /test/:id      # Test webhook
│
└── /health                 # Health check
    └── GET /               # Server status
```

---

## Authentication

### API Key Authentication

```go
// ApiKeyAuth middleware for API key validation
type ApiKeyAuth struct {
    db       *gorm.DB
    keyCache *sync.Map
}

// ApiKey represents an API key record
type ApiKey struct {
    Id          string    `gorm:"primaryKey"`
    Name        string    `json:",omitempty"`
    KeyHash     string    `json:",omitempty"` // bcrypt hash
    Prefix      string    `json:",omitempty"` // first 8 chars for identification
    Scopes      string    `json:",omitempty"` // JSON array of allowed scopes
    RateLimit   int       `json:",omitempty"` // requests per minute
    ExpiresAt   *time.Time `json:",omitempty"`
    LastUsedAt  *time.Time `json:",omitempty"`
    CreatedAt   time.Time `json:",omitempty"`
    IsActive    bool      `json:",omitempty"`
}

// ApiKeyScope defines permission scopes
type ApiKeyScope string

const (
    ScopeSearchRead    ApiKeyScope = "search:read"
    ScopeSearchWrite   ApiKeyScope = "search:write"
    ScopeSerpRead      ApiKeyScope = "serp:read"
    ScopeSerpWrite     ApiKeyScope = "serp:write"
    ScopeContactRead   ApiKeyScope = "contact:read"
    ScopeContactWrite  ApiKeyScope = "contact:write"
    ScopeMapsRead      ApiKeyScope = "maps:read"
    ScopeMapsWrite     ApiKeyScope = "maps:write"
    ScopeCacheManage   ApiKeyScope = "cache:manage"
    ScopeWebhookManage ApiKeyScope = "webhook:manage"
    ScopeAdmin         ApiKeyScope = "admin"
)

// Authenticate validates API key from header
func (a *ApiKeyAuth) Authenticate(c *gin.Context) {
    apiKey := c.GetHeader("X-API-Key")
    if apiKey == "" {
        apiKey = c.Query("api_key")
    }
    
    if apiKey == "" {
        c.AbortWithStatusJSON(401, ResponseEnvelope{
            Success: false,
            Errors: []ResponseError{{
                Code:    7820,
                Message: "API key required",
            }},
        })
        return
    }
    
    key, err := a.validateKey(apiKey)
    if err != nil {
        c.AbortWithStatusJSON(401, ResponseEnvelope{
            Success: false,
            Errors: []ResponseError{{
                Code:    7821,
                Message: "Invalid API key",
            }},
        })
        return
    }
    
    c.Set("api_key", key)
    c.Next()
}
```

---

## Rate Limiting

```go
// RateLimiter implements token bucket rate limiting
type RateLimiter struct {
    buckets sync.Map
    default int // default requests per minute
}

// RateBucket tracks usage for a key
type RateBucket struct {
    tokens    float64
    lastFill  time.Time
    limit     int
    mu        sync.Mutex
}

// RateLimitMiddleware applies rate limiting
func (r *RateLimiter) Middleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        key := r.getKey(c)
        limit := r.getLimit(c)
        
        bucket := r.getBucket(key, limit)
        
        if !bucket.Allow() {
            c.Header("X-RateLimit-Limit", strconv.Itoa(limit))
            c.Header("X-RateLimit-Remaining", "0")
            c.Header("X-RateLimit-Reset", strconv.FormatInt(bucket.ResetTime().Unix(), 10))
            
            c.AbortWithStatusJSON(429, ResponseEnvelope{
                Success: false,
                Errors: []ResponseError{{
                    Code:    7822,
                    Message: "Rate limit exceeded",
                    Details: fmt.Sprintf("Limit: %d requests/minute", limit),
                }},
            })
            return
        }
        
        c.Header("X-RateLimit-Limit", strconv.Itoa(limit))
        c.Header("X-RateLimit-Remaining", strconv.Itoa(bucket.Remaining()))
        c.Next()
    }
}
```

---

## Endpoint Specifications

### Search Endpoints

```go
// POST /api/v1/bi/search
// Execute multi-engine search

// SearchRequest for search execution
type SearchRequest struct {
    Query       string   `binding:"required,min=1,max=500"`
    Engines     []string `json:",omitempty"`     // google, bing, duckduckgo
    Method      string   `json:",omitempty"`      // auto, api, scrape
    Count       int      `json:",omitempty"`       // results per engine
    Pages       int      `json:",omitempty"`       // pages to fetch
    Language    string   `json:",omitempty"`    // ISO 639-1
    Country     string   `json:",omitempty"`     // ISO 3166-1
    SafeSearch  string   `json:",omitempty"`  // off, moderate, strict
    Freshness   string   `json:",omitempty"`   // day, week, month, year
    Aggregate   bool     `json:",omitempty"`   // merge results
    Enrich      *EnrichOptions `json:",omitempty"`
}

// EnrichOptions for result enrichment
type EnrichOptions struct {
    IncludeFaq       bool `json:",omitempty"`
    IncludeContact   bool `json:",omitempty"`
    IncludeAuthority bool `json:",omitempty"`
    IncludeAiOverview bool `json:",omitempty"`
}

// SearchResponse for search results
type SearchResponse struct {
    Query      string                 `json:",omitempty"`
    Engines    []string               `json:",omitempty"`
    Results    []EnrichedSearchResult `json:",omitempty"`
    AiOverview *AiOverviewData        `json:",omitempty"`
    FaqItems   []FaqItem              `json:",omitempty"`
    Related    []string               `json:",omitempty"`
}

// GET /api/v1/bi/search/engines
// List available search engines

type EngineInfo struct {
    Id          string   `json:",omitempty"`
    Name        string   `json:",omitempty"`
    Methods     []string `json:",omitempty"`
    MaxResults  int      `json:",omitempty"`
    Features    []string `json:",omitempty"`
}
```

### SERP Tracking Endpoints

```go
// POST /api/v1/bi/serp/check
// One-time position check

type SerpCheckRequest struct {
    Query   string   `binding:"required"`
    Domains []string `binding:"required,min=1,max=20"`
    Engine  string   `json:",omitempty"`
    Pages   int      `json:",omitempty"`
    Country string   `json:",omitempty"`
}

type SerpCheckResponse struct {
    Query     string            `json:",omitempty"`
    Engine    string            `json:",omitempty"`
    Positions []DomainPosition  `json:",omitempty"`
    TopResults []SearchResultItem `json:",omitempty"`
}

type DomainPosition struct {
    Domain   string `json:",omitempty"`
    Position int    `json:",omitempty"` // 0 = not found
    Page     int    `json:",omitempty"`
    Url      string `json:",omitempty"`
    Title    string `json:",omitempty"`
}

// POST /api/v1/bi/serp/track
// Create tracking job

type SerpTrackRequest struct {
    Query       string   `binding:"required"`
    Domains     []string `binding:"required,min=1,max=20"`
    Engine      string   `json:",omitempty"`
    Interval    string   `json:",omitempty"`    // daily, weekly
    Pages       int      `json:",omitempty"`
    Country     string   `json:",omitempty"`
    AlertConfig *AlertConfig `json:",omitempty"`
}

type AlertConfig struct {
    OnPositionDrop  int  `json:",omitempty"`  // alert if drops by N
    OnPositionGain  int  `json:",omitempty"`  // alert if gains by N
    OnPageChange    bool `json:",omitempty"`    // alert on page change
    OnNotFound      bool `json:",omitempty"`      // alert if lost
    OnFirstPage     bool `json:",omitempty"`     // alert if reaches page 1
    WebhookId       string `json:",omitempty"`     // webhook for alerts
}

// GET /api/v1/bi/serp/history
// Position history query

// EXEMPTED: HTTP query parameter binding — snake_case is standard for URL params
type SerpHistoryRequest struct {
    Query     string    `form:"query" binding:"required"`
    Domain    string    `form:"domain" binding:"required"`
    StartDate time.Time `form:"start_date"`
    EndDate   time.Time `form:"end_date"`
    Engine    string    `form:"engine"`
}

type SerpHistoryResponse struct {
    Query    string           `json:",omitempty"`
    Domain   string           `json:",omitempty"`
    History  []PositionPoint  `json:",omitempty"`
    Stats    PositionStats    `json:",omitempty"`
    Trend    string           `json:",omitempty"` // up, down, stable
}

type PositionPoint struct {
    Date     time.Time `json:",omitempty"`
    Position int       `json:",omitempty"`
    Page     int       `json:",omitempty"`
    Url      string    `json:",omitempty"`
}

type PositionStats struct {
    Best    int     `json:",omitempty"`
    Worst   int     `json:",omitempty"`
    Average float64 `json:",omitempty"`
    Current int     `json:",omitempty"`
    Change  int     `json:",omitempty"` // vs first record
}
```

### Contact Extraction Endpoints

```go
// POST /api/v1/bi/contact/extract
// Extract contacts from URL

type ContactExtractRequest struct {
    Url           string `binding:"required,url"`
    FollowContact bool   `json:",omitempty"` // find /contact page
    VerifyEmails  bool   `json:",omitempty"`  // MX lookup
    VerifySocials bool   `json:",omitempty"` // HEAD check
    MaxDepth      int    `json:",omitempty"`      // crawl depth
}

type ContactExtractResponse struct {
    Url       string        `json:",omitempty"`
    Domain    string        `json:",omitempty"`
    Emails    []EmailRecord `json:",omitempty"`
    Phones    []PhoneRecord `json:",omitempty"`
    Socials   []SocialLink  `json:",omitempty"`
    Extracted time.Time     `json:",omitempty"`
}

// POST /api/v1/bi/contact/batch
// Batch contact extraction

type ContactBatchRequest struct {
    Urls          []string `binding:"required,min=1,max=100"`
    FollowContact bool     `json:",omitempty"`
    VerifyEmails  bool     `json:",omitempty"`
    WebhookId     string   `json:",omitempty"` // notify on complete
}

type ContactBatchResponse struct {
    BatchId     string    `json:",omitempty"`
    Status      string    `json:",omitempty"` // pending, processing, complete
    Total       int       `json:",omitempty"`
    Completed   int       `json:",omitempty"`
    Failed      int       `json:",omitempty"`
    CreatedAt   time.Time `json:",omitempty"`
    CompletedAt *time.Time `json:",omitempty"`
}
```

### Google Maps Endpoints

```go
// POST /api/v1/bi/maps/search
// One-time Maps search

type MapsSearchRequest struct {
    Query      string       `binding:"required"`
    Location   string       `json:",omitempty"`   // city, region, coords
    Radius     int          `json:",omitempty"`     // km
    MaxResults int          `json:",omitempty"` // max 60
    Filters    *MapsFilters `json:",omitempty"`
    Enrich     bool         `json:",omitempty"`     // contact extraction
}

type MapsFilters struct {
    MinRating   float64 `json:",omitempty"`
    MinReviews  int     `json:",omitempty"`
    OpenNow     bool    `json:",omitempty"`
    PriceLevel  int     `json:",omitempty"` // 1-4
}

type MapsSearchResponse struct {
    Query      string           `json:",omitempty"`
    Location   string           `json:",omitempty"`
    Businesses []BusinessRecord `json:",omitempty"`
    Total      int              `json:",omitempty"`
}

// POST /api/v1/bi/maps/job
// Create scheduled Maps job

type MapsJobRequest struct {
    Query       string       `binding:"required"`
    Locations   []string     `binding:"required,min=1,max=50"`
    MaxResults  int          `json:",omitempty"`
    Filters     *MapsFilters `json:",omitempty"`
    Enrich      bool         `json:",omitempty"`
    Schedule    string       `json:",omitempty"`   // cron or interval
    WebhookId   string       `json:",omitempty"`
}

type MapsJobResponse struct {
    JobId       string    `json:",omitempty"`
    Status      string    `json:",omitempty"` // pending, searching, enriching, complete
    Phase       string    `json:",omitempty"`
    Progress    int       `json:",omitempty"` // percentage
    Locations   int       `json:",omitempty"`
    ResultCount int       `json:",omitempty"`
    CreatedAt   time.Time `json:",omitempty"`
    NextRun     *time.Time `json:",omitempty"`
}

// PATCH /api/v1/bi/maps/job/:id
// Update job status

type MapsJobUpdateRequest struct {
    Action string `binding:"required,oneof=pause resume cancel"`
}
```

### Webhook Endpoints

```go
// POST /api/v1/bi/webhook
// Register webhook

type WebhookCreateRequest struct {
    Url     string   `binding:"required,url"`
    Events  []string `binding:"required,min=1"`
    Secret  string   `json:",omitempty"`  // HMAC signing key
    Headers map[string]string `json:",omitempty"`
}

// Supported webhook events
const (
    EventSerpAlert       = "serp.alert"
    EventSerpComplete    = "serp.complete"
    EventContactComplete = "contact.complete"
    EventContactBatch    = "contact.batch.complete"
    EventMapsProgress    = "maps.progress"
    EventMapsComplete    = "maps.complete"
    EventMapsError       = "maps.error"
)

type WebhookResponse struct {
    Id        string    `json:",omitempty"`
    Url       string    `json:",omitempty"`
    Events    []string  `json:",omitempty"`
    IsActive  bool      `json:",omitempty"`
    CreatedAt time.Time `json:",omitempty"`
    LastFired *time.Time `json:",omitempty"`
}

// WebhookPayload sent to registered endpoints — uses generics for type-safe Data
type WebhookPayload[T any] struct {
    Event     string    `json:",omitempty"`
    Timestamp time.Time `json:",omitempty"`
    Data      T         `json:",omitempty"`
    Signature string    `json:",omitempty"` // HMAC-SHA256
}
```

---

## OpenAPI Specification

### OpenAPI Document Structure

```yaml
openapi: 3.1.0
info:
  title: GSearch Business Intelligence API
  version: 1.0.0
  description: |
    Unified API for search, SERP tracking, contact extraction, 
    and Google Maps business discovery.
  contact:
    name: API Support
    email: support@gsearch.dev
  license:
    name: Proprietary
    
servers:
  - url: http://localhost:5020/api/v1/bi
    description: Local development
  - url: https://api.gsearch.dev/v1/bi
    description: Production

security:
  - ApiKeyAuth: []

tags:
  - name: Search
    description: Multi-engine web search
  - name: FAQ
    description: FAQ and PAA discovery
  - name: SERP
    description: SERP position tracking
  - name: Contact
    description: Contact information extraction
  - name: Maps
    description: Google Maps business search
  - name: Cache
    description: Cache management
  - name: Webhook
    description: Webhook management

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
      
  schemas:
    ResponseEnvelope:
      type: object
      properties:
        Success:
          type: boolean
        Data:
          type: object
        Meta:
          $ref: '#/components/schemas/ResponseMeta'
        Pagination:
          $ref: '#/components/schemas/PaginationMeta'
        Cache:
          $ref: '#/components/schemas/CacheMeta'
        Errors:
          type: array
          items:
            $ref: '#/components/schemas/ResponseError'
            
    # Additional schemas defined for each endpoint...
```

### Swagger Integration

```go
// SwaggerHandler serves OpenAPI documentation
type SwaggerHandler struct {
    spec     []byte
    specJson []byte
}

// RegisterSwagger adds swagger routes
func RegisterSwagger(router *gin.Engine, cfg ApiConfig) {
    if !cfg.EnableSwagger {
        return
    }
    
    handler := NewSwaggerHandler()
    
    // Serve OpenAPI spec
    router.GET("/swagger/openapi.yaml", handler.ServeYaml)
    router.GET("/swagger/openapi.json", handler.ServeJson)
    
    // Serve Swagger UI
    router.GET("/swagger/*any", handler.ServeUI)
    
    // Serve ReDoc alternative
    router.GET("/docs/*any", handler.ServeRedoc)
}

// GenerateOpenApiSpec creates spec from route definitions
func GenerateOpenApiSpec(router *gin.Engine) appfault.ResultSlice[byte] {
    spec := openapi3.T{
        OpenAPI: "3.1.0",
        Info: &openapi3.Info{
            Title:   "GSearch Business Intelligence API",
            Version: "1.0.0",
        },
        Servers: openapi3.Servers{
            &openapi3.Server{URL: "/api/v1/bi"},
        },
    }
    
    // Auto-generate from registered routes and struct tags
    for _, route := range router.Routes() {
        addPathFromRoute(&spec, route)
    }
    
    return spec.MarshalYaml()
}
```

---

## Request Validation

```go
// Validator wraps go-playground/validator
type RequestValidator struct {
    validate *validator.Validate
}

// NewRequestValidator creates validator with custom rules
func NewRequestValidator() *RequestValidator {
    v := validator.New()
    
    // Register custom validations
    v.RegisterValidation("domain", validateDomain)
    v.RegisterValidation("engines", validateEngines)
    v.RegisterValidation("interval", validateInterval)
    
    return &RequestValidator{validate: v}
}

// ValidateRequest validates request body using generics
func ValidateRequest[T any](v *RequestValidator, c *gin.Context) appfault.Result[T] {
    var req T
    if err := c.ShouldBindJSON(&req); err != nil {
        return &ValidationError{
            Code:    7823,
            Message: "Invalid request body",
            Details: err.Error(),
        }
    }
    
    if err := v.validate.Struct(req); err != nil {
        return v.formatValidationError(err)
    }
    
    return nil
}

// ValidationError represents validation failure
type ValidationError struct {
    Code    int
    Message string
    Details string
    Fields  []FieldError
}

type FieldError struct {
    Field   string `json:",omitempty"`
    Message string `json:",omitempty"`
    Value   string `json:",omitempty"`
}
```

---

## Response Helpers

```go
// RespondSuccess sends successful response
func RespondSuccess[T any](c *gin.Context, data T, meta *ResponseMeta) {
    envelope := ResponseEnvelope{
        Success: true,
        Data:    data,
    }
    
    if meta != nil {
        envelope.Meta = *meta
    }
    
    // Add cache info if available
    if cache, exists := c.Get("cache_meta"); exists {
        cacheMeta := cache.(CacheMeta)
        envelope.Cache = &cacheMeta
    }
    
    c.JSON(http.StatusOK, envelope)
}

// RespondError sends error response
func RespondError(c *gin.Context, status int, errors ...ResponseError) {
    c.JSON(status, ResponseEnvelope{
        Success: false,
        Errors:  errors,
    })
}

// RespondPaginated sends paginated response
func RespondPaginated[T any](c *gin.Context, data T, pagination PaginationMeta) {
    c.JSON(http.StatusOK, ResponseEnvelope{
        Success:    true,
        Data:       data,
        Pagination: &pagination,
    })
}
```

---

## Middleware Stack

```go
// SetupMiddleware configures all middleware
func SetupMiddleware(router *gin.Engine, cfg ApiConfig) {
    // Recovery from panics
    router.Use(gin.Recovery())
    
    // Request ID
    router.Use(RequestIdMiddleware())
    
    // Logging
    router.Use(RequestLoggingMiddleware())
    
    // CORS
    if cfg.EnableCors {
        router.Use(CorsMiddleware())
    }
    
    // Compression
    router.Use(gzip.Gzip(gzip.DefaultCompression))
    
    // Rate limiting
    if cfg.EnableRateLimit {
        router.Use(NewRateLimiter(100).Middleware())
    }
    
    // Auth (applied to /api routes)
    if cfg.EnableAuth {
        api := router.Group("/api")
        api.Use(NewApiKeyAuth(db).Authenticate)
    }
}

// RequestIdMiddleware adds unique request ID
func RequestIdMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        requestId := c.GetHeader("X-Request-ID")
        if requestId == "" {
            requestId = uuid.New().String()
        }
        c.Set("request_id", requestId)
        c.Header("X-Request-ID", requestId)
        c.Next()
    }
}

// CorsMiddleware configures CORS headers
func CorsMiddleware() gin.HandlerFunc {
    return cors.New(cors.Config{
        AllowOrigins:     []string{"*"},
        AllowMethods:     []string{httpmethodtype.Get.HttpVerb(), httpmethodtype.Post.HttpVerb(), httpmethodtype.Put.HttpVerb(), httpmethodtype.Patch.HttpVerb(), httpmethodtype.Delete.HttpVerb(), httpmethodtype.Options.HttpVerb()},
        AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "X-API-Key", "X-Request-ID"},
        ExposeHeaders:    []string{"X-Request-ID", "X-RateLimit-Limit", "X-RateLimit-Remaining"},
        AllowCredentials: true,
        MaxAge:           12 * time.Hour,
    })
}
```

---

## CLI Integration

```bash
# Start API server
gsearch serve                           # Start with defaults
gsearch serve --port 9090               # Custom port
gsearch serve --no-auth                 # Disable auth (dev only)
gsearch serve --no-swagger              # Disable Swagger UI

# API key management
gsearch api-key create --name "My App" --scopes "search:read,serp:read"
gsearch api-key list
gsearch api-key revoke <key-id>
gsearch api-key rotate <key-id>

# Webhook management
gsearch webhook create --url "https://..." --events "serp.alert,maps.complete"
gsearch webhook list
gsearch webhook test <webhook-id>
gsearch webhook delete <webhook-id>
```

---

## Database Schema

```sql
-- API keys table
CREATE TABLE ApiKeys (
    Id          TEXT PRIMARY KEY,
    Name        TEXT NOT NULL,
    KeyHash     TEXT NOT NULL,
    Prefix      TEXT NOT NULL,
    Scopes      TEXT NOT NULL,          -- JSON array
    RateLimit   INTEGER DEFAULT 100,
    ExpiresAt   DATETIME,
    LastUsedAt  DATETIME,
    CreatedAt   DATETIME NOT NULL,
    IsActive    BOOLEAN DEFAULT TRUE
);

CREATE INDEX IdxApikeyPrefix ON ApiKeys(Prefix);
CREATE INDEX IdxApikeyActive ON ApiKeys(IsActive);

-- Webhooks table
CREATE TABLE Webhooks (
    Id          TEXT PRIMARY KEY,
    ApiKeyId    TEXT NOT NULL,
    Url         TEXT NOT NULL,
    Events      TEXT NOT NULL,          -- JSON array
    Secret      TEXT,
    Headers     TEXT,                   -- JSON object
    IsActive    BOOLEAN DEFAULT TRUE,
    LastFiredAt DATETIME,
    FailCount   INTEGER DEFAULT 0,
    CreatedAt   DATETIME NOT NULL,
    FOREIGN KEY (ApiKeyId) REFERENCES ApiKeys(Id)
);

CREATE INDEX IdxWebhookApikey ON Webhooks(ApiKeyId);
CREATE INDEX IdxWebhookActive ON Webhooks(IsActive);

-- Webhook delivery log
CREATE TABLE WebhookDeliveries (
    Id          TEXT PRIMARY KEY,
    WebhookId   TEXT NOT NULL,
    Event       TEXT NOT NULL,
    Payload     TEXT NOT NULL,
    StatusCode  INTEGER,
    Response    TEXT,
    Duration    INTEGER,                -- milliseconds
    Success     BOOLEAN NOT NULL,
    CreatedAt   DATETIME NOT NULL,
    FOREIGN KEY (WebhookId) REFERENCES Webhooks(Id)
);

CREATE INDEX IdxDeliveryWebhook ON WebhookDeliveries(WebhookId);
CREATE INDEX IdxDeliveryCreated ON WebhookDeliveries(CreatedAt);

-- Request log table
CREATE TABLE RequestLog (
    Id          TEXT PRIMARY KEY,
    RequestId   TEXT NOT NULL,
    ApiKeyId    TEXT,
    Method      TEXT NOT NULL,
    Path        TEXT NOT NULL,
    StatusCode  INTEGER NOT NULL,
    Duration    INTEGER NOT NULL,       -- milliseconds
    RequestSize INTEGER,
    ResponseSize INTEGER,
    UserAgent   TEXT,
    IpAddress   TEXT,
    CreatedAt   DATETIME NOT NULL
);

CREATE INDEX IdxRequestApikey ON RequestLog(ApiKeyId);
CREATE INDEX IdxRequestCreated ON RequestLog(CreatedAt);
CREATE INDEX IdxRequestPath ON RequestLog(Path);
```

---

## Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 7820 | ErrApiKeyRequired | API key not provided |
| 7821 | ErrApiKeyInvalid | Invalid or expired API key |
| 7822 | ErrRateLimitExceeded | Rate limit exceeded |
| 7823 | ErrRequestBodyInvalid | Invalid request body |
| 7824 | ErrValidationFailed | Request validation failed |
| 7825 | ErrScopeInsufficient | API key lacks required scope |
| 7826 | ErrResourceNotFound | Requested resource not found |
| 7827 | ErrMethodNotAllowed | HTTP method not allowed |
| 7828 | ErrContentTypeInvalid | Invalid Content-Type header |
| 7829 | ErrWebhookUrlInvalid | Invalid webhook URL |
| 7830 | ErrWebhookDeliveryFailed | Webhook delivery failed |
| 7831 | ErrWebhookLimitExceeded | Max webhooks exceeded |
| 7832 | ErrBatchSizeExceeded | Batch size limit exceeded |
| 7833 | ErrJobNotFound | Job ID not found |
| 7834 | ErrJobActionInvalid | Invalid job action |
| 7835 | ErrServerOverloaded | Server temporarily overloaded |
| 7836 | ErrUpstreamTimeout | Upstream service timeout |
| 7837 | ErrSwaggerUnavailable | OpenAPI spec unavailable |
| 7838 | ErrCorsOriginRejected | CORS origin not allowed |
| 7839 | Reserved | Reserved for future use |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Response Formatting | `47-response-formatting-caching.md` |
| Multi-Engine Search | `42-multi-engine-search.md` |
| FAQ Discovery | `43-faq-discovery-ai-overview.md` |
| SERP Tracking | `44-serp-position-tracking.md` |
| Contact Extraction | `45-contact-extraction.md` |
| Google Maps Search | `46-google-maps-search.md` |
| CLI Frontend Standard | `.ai-memory/memories/technical/frontend-ui-patterns.md` |
| Error Codes | `15-error-codes.md` |
