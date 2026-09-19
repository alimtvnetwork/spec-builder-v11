# 22. SettingsService Implementation Specification

**Version:** 2.0.0  
**Status:** Planned  
**Updated:** 2026-03-09  
**Parent:** [GSearch CLI Overview](./00-overview.md)

---

## Purpose

Define the complete Golang implementation specification for the `SettingsService` — a centralized service for managing seedable configuration values with caching, type-safe accessors, version-gated seeding, and runtime modifications.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SETTINGS SERVICE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         PUBLIC INTERFACE                                │ │
│  │                                                                         │ │
│  │  GetString(category, key) → string                                      │ │
│  │  GetFloat(category, key) → float64                                      │ │
│  │  GetInt(category, key) → int                                            │ │
│  │  GetBool(category, key) → bool                                          │ │
│  │  GetStringSlice(category, key) → []string                               │ │
│  │  GetMap(category, key) → map[string]string                              │ │
│  │  GetTyped[T](category, key) → T                                         │ │
│  │  Update(category, key, value SettingValue) → error                      │ │
│  │  ResetToDefault(category, key) → error                                  │ │
│  │  SeedFromFile(filepath) → error                                         │ │
│  │  SeedAllFromDirectory(dirpath) → error                                  │ │
│  │  GetByCategory(category) → []Setting                                    │ │
│  │  ExportCategory(category) → SeedFile                                    │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         CACHE LAYER                                     │ │
│  │                                                                         │ │
│  │  sync.Map with TTL-based invalidation                                   │ │
│  │  Key format: "{category}:{key}"                                         │ │
│  │  Automatic cache warming on startup                                     │ │
│  │  Manual invalidation on Update/Reset                                    │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         DATABASE LAYER                                  │ │
│  │                                                                         │ │
│  │  GORM with SQLite                                                       │ │
│  │  Settings table with versioning                                         │ │
│  │  Atomic updates with transactions                                       │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         SEED FILE LOADER                                │ │
│  │                                                                         │ │
│  │  JSON parsing with validation                                           │ │
│  │  Version comparison logic                                               │ │
│  │  Upsert semantics for seeding                                           │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Module Structure

```
gsearch/
├── internal/
│   └── settings/
│       ├── service.go          # SettingsService implementation
│       ├── seeder.go           # ConfigSeeder for seed file processing
│       ├── cache.go            # Cache layer implementation
│       ├── models.go           # Setting model and enums
│       ├── types.go            # ConfigCategory, ValueType, SettingValue enums
│       ├── errors.go           # Custom error types
│       ├── validation.go       # Value validation logic
│       └── service_test.go     # Unit tests
```

---

## Strongly-Typed Value Container

**CRITICAL: No `interface{}` or `any` usage. All values use the `SettingValue` union struct.**

```go
// SettingConstraint defines allowed setting value types
type SettingConstraint interface {
    string | int | float64 | bool | []string | map[string]string
}

// SettingValue is the strongly-typed union container for all setting values.
// Exactly one field is non-nil at any time, determined by ValueType.
type SettingValue struct {
    StringVal  *string            `json:",omitempty"`
    IntVal     *int               `json:",omitempty"`
    FloatVal   *float64           `json:",omitempty"`
    BoolVal    *bool              `json:",omitempty"`
    StringsVal []string           `json:",omitempty"`
    MapVal     map[string]string  `json:",omitempty"`
}

// NewStringValue creates a SettingValue holding a string
func NewStringValue(v string) SettingValue {
    return SettingValue{StringVal: &v}
}

// NewIntValue creates a SettingValue holding an int
func NewIntValue(v int) SettingValue {
    return SettingValue{IntVal: &v}
}

// NewFloatValue creates a SettingValue holding a float64
func NewFloatValue(v float64) SettingValue {
    return SettingValue{FloatVal: &v}
}

// NewBoolValue creates a SettingValue holding a bool
func NewBoolValue(v bool) SettingValue {
    return SettingValue{BoolVal: &v}
}
```

---

## Core Interfaces

### SettingsService Interface

```go
// SettingsService provides access to seedable configuration values.
// All methods are strongly typed — no interface{} or any usage.
type SettingsService interface {
    // Type-safe accessors (preferred)
    GetString(category ConfigCategory, key string) appfault.Result[string]
    GetFloat(category ConfigCategory, key string) appfault.Result[float64]
    GetInt(category ConfigCategory, key string) appfault.Result[int]
    GetBool(category ConfigCategory, key string) appfault.Result[bool]
    GetStringSlice(category ConfigCategory, key string) appfault.ResultSlice[string]
    GetMap(category ConfigCategory, key string) appfault.Result[map[string]string]
    
    // Mutation methods (strongly typed value container)
    Update(category ConfigCategory, key string, value SettingValue) *appfault.AppError
    ResetToDefault(category ConfigCategory, key string) *appfault.AppError
    ResetCategoryToDefault(category ConfigCategory) *appfault.AppError
    
    // Seeding methods
    SeedFromFile(filepath string) *appfault.AppError
    SeedAllFromDirectory(dirpath string) *appfault.AppError
    ForceReseed(category ConfigCategory) *appfault.AppError
    
    // Query methods
    GetByCategory(category ConfigCategory) appfault.ResultSlice[Setting]
    GetAllCategories() appfault.ResultSlice[ConfigCategory]
    GetCategoryVersion(category ConfigCategory) appfault.Result[string]
    
    // Export methods
    ExportCategory(category ConfigCategory) appfault.Result[*SeedFile]
    ExportAll() appfault.Result[map[ConfigCategory]*SeedFile]
    
    // Cache management
    InvalidateCache() *appfault.AppError
    WarmCache() *appfault.AppError
}
```

### Generic Typed Accessor (Go 1.18+)

```go
// GetTyped retrieves a setting and returns it as the specified concrete type.
// Eliminates the need for interface{} by using Go generics.
func GetTyped[T SettingConstraint](svc SettingsService, category ConfigCategory, key string) appfault.Result[T] {
    var zero T
    switch v := any(zero).(type) {
    case string:
        _ = v
        result := svc.GetString(category, key)
        if !result.IsSuccess {
            return appfault.Fail[T](result.Error)
        }
        return appfault.Ok(any(result.Value).(T))
    case int:
        _ = v
        result := svc.GetInt(category, key)
        if !result.IsSuccess {
            return appfault.Fail[T](result.Error)
        }
        return appfault.Ok(any(result.Value).(T))
    case float64:
        _ = v
        result := svc.GetFloat(category, key)
        if !result.IsSuccess {
            return appfault.Fail[T](result.Error)
        }
        return appfault.Ok(any(result.Value).(T))
    case bool:
        _ = v
        result := svc.GetBool(category, key)
        if !result.IsSuccess {
            return appfault.Fail[T](result.Error)
        }
        return appfault.Ok(any(result.Value).(T))
    case []string:
        _ = v
        result := svc.GetStringSlice(category, key)
        if !result.IsSuccess {
            return appfault.Fail[T](result.Error)
        }
        return appfault.Ok(any(result.Value).(T))
    case map[string]string:
        _ = v
        result := svc.GetMap(category, key)
        if !result.IsSuccess {
            return appfault.Fail[T](result.Error)
        }
        return appfault.Ok(any(result.Value).(T))
    default:
        return appfault.Fail[T](
            appfault.New("unsupported setting type"),
        )
    }
}
```

### ConfigSeeder Interface

```go
// ConfigSeeder handles seeding from JSON files
type ConfigSeeder interface {
    // SeedIfNeeded seeds values only if version differs
    SeedIfNeeded(filepath string) error
    
    // ForceSeed seeds values regardless of version
    ForceSeed(filepath string) error
    
    // SeedDirectoryIfNeeded seeds all files in directory
    SeedDirectoryIfNeeded(dirpath string) *appfault.AppError
    
    // GetSeedFileVersion returns version from seed file without seeding
    GetSeedFileVersion(filepath string) appfault.Result[string]
    
    // ValidateSeedFile validates JSON structure
    ValidateSeedFile(filepath string) *appfault.AppError
}
```

---

## Data Models

### Setting Model

```go
type Setting struct {
    Id             string         `gorm:"primaryKey;size:36"`
    Key            string         `gorm:"not null;size:255"`
    Value          string         `gorm:"not null;type:text"` // JSON-encoded
    Category       ConfigCategory `gorm:"not null;size:50"`
    Version        string         `gorm:"not null;size:20"`
    ValueType      ValueType      `gorm:"not null;size:20"`
    Description    string         `gorm:"size:500"`
    IsUserModified bool           `gorm:"default:false"`
    DefaultValue   string         `gorm:"type:text"` // Original seed value
    CreatedAt      time.Time
    UpdatedAt      time.Time
}

func (Setting) TableName() string {
    return "Settings"
}

// Indexes for efficient queries
func (Setting) Indexes() []schema.Index {
    return []schema.Index{
        {Fields: []string{"category"}},
        {Fields: []string{"key", "category"}, Unique: true},
    }
}
```

### SeedFile Model

```go
type SeedFile struct {
    Version     string
    Category    ConfigCategory
    Description string                 `json:",omitempty"`
    Values      map[string]SettingValue // Strongly typed — no interface{}
}
```

### Enumerations

```go
type ConfigCategory string

const (
    CategoryModelRouting          ConfigCategory = "model_routing"
    CategoryAuthorityScores       ConfigCategory = "authority_scores"
    CategorySourceWeights         ConfigCategory = "source_weights"
    CategoryCredibilityThresholds ConfigCategory = "credibility_thresholds"
    CategoryConfidenceMetrics     ConfigCategory = "confidence_metrics"
    CategoryTrendAnalysis         ConfigCategory = "trend_analysis"
    CategorySearchSettings        ConfigCategory = "search_settings"
    CategoryCacheSettings         ConfigCategory = "cache_settings"
)

// AllCategories returns all valid categories
func AllCategories() []ConfigCategory {
    return []ConfigCategory{
        CategoryModelRouting,
        CategoryAuthorityScores,
        CategorySourceWeights,
        CategoryCredibilityThresholds,
        CategoryConfidenceMetrics,
        CategoryTrendAnalysis,
        CategorySearchSettings,
        CategoryCacheSettings,
    }
}

type ValueType string

const (
    ValueTypeString  ValueType = "string"
    ValueTypeNumber  ValueType = "number"
    ValueTypeBoolean ValueType = "boolean"
    ValueTypeArray   ValueType = "array"
    ValueTypeObject  ValueType = "object"
)
```

---

## Method Specifications

### GetFloat Method

```go
// GetFloat retrieves a numeric setting as float64
// Handles both integer and float JSON values
//
// Type Coercion:
// - JSON number → float64 (direct)
// - JSON string containing number → parsed float64
// - Other types → ErrTypeMismatch
//
// Behavior:
// 1. Check cache for existing SettingValue
// 2. If cache miss, query database
// 3. Decode JSON value into SettingValue
// 4. Extract FloatVal (or coerce IntVal → float64)
// 5. Store in cache for future access
// 6. Return float64 value
//
// Errors:
// - ErrSettingNotFound: Key doesn't exist
// - ErrTypeMismatch: Value is not numeric
func (ss *SettingsServiceImpl) GetFloat(category ConfigCategory, key string) appfault.Result[float64]
```

### GetInt Method

```go
// GetInt retrieves a numeric setting as int
// Truncates decimal values
//
// Type Coercion:
// - JSON number → int (truncated)
// - JSON string containing integer → parsed int
// - Other types → ErrTypeMismatch
//
// Errors:
// - ErrSettingNotFound: Key doesn't exist
// - ErrTypeMismatch: Value is not numeric
// - ErrIntegerOverflow: Value exceeds int range
func (ss *SettingsServiceImpl) GetInt(category ConfigCategory, key string) appfault.Result[int]
```

### GetString Method

```go
// GetString retrieves a string setting
//
// Type Coercion:
// - JSON string → string (direct)
// - JSON number/bool → formatted string
// - Other types → ErrTypeMismatch
//
// Errors:
// - ErrSettingNotFound: Key doesn't exist
// - ErrTypeMismatch: Value cannot be represented as string
func (ss *SettingsServiceImpl) GetString(category ConfigCategory, key string) appfault.Result[string]
```

### GetBool Method

```go
// GetBool retrieves a boolean setting
//
// Type Coercion:
// - JSON bool → bool (direct)
// - JSON string "true"/"false" → parsed bool
// - JSON number 0/1 → false/true
// - Other values → ErrTypeMismatch
//
// Errors:
// - ErrSettingNotFound: Key doesn't exist
// - ErrTypeMismatch: Value is not boolean-coercible
func (ss *SettingsServiceImpl) GetBool(category ConfigCategory, key string) appfault.Result[bool]
```

### GetStringSlice Method

```go
// GetStringSlice retrieves an array setting as []string
//
// Type Coercion:
// - JSON array of strings → []string (direct)
// - JSON array of mixed types → each element stringified
//
// Errors:
// - ErrSettingNotFound: Key doesn't exist
// - ErrTypeMismatch: Value is not an array
func (ss *SettingsServiceImpl) GetStringSlice(category ConfigCategory, key string) appfault.ResultSlice[string]
```

### GetMap Method

```go
// GetMap retrieves an object setting as map[string]string
//
// Type Handling:
// - JSON object with string values → map[string]string (direct)
// - Nested objects → serialized to string values
//
// Errors:
// - ErrSettingNotFound: Key doesn't exist
// - ErrTypeMismatch: Value is not an object
func (ss *SettingsServiceImpl) GetMap(category ConfigCategory, key string) appfault.Result[map[string]string]
```

### Update Method

```go
// Update modifies a setting value at runtime
//
// Behavior:
// 1. Validate SettingValue has exactly one non-nil field
// 2. Validate value type matches existing ValueType
// 3. JSON-encode the new value
// 4. Update database with transaction
// 5. Set IsUserModified = true
// 6. Invalidate cache entry
// 7. Return nil on success
//
// Validation:
// - SettingValue must have exactly one field set
// - Value type must match original ValueType (or be coercible)
//
// Errors:
// - ErrSettingNotFound: Key doesn't exist
// - ErrTypeMismatch: Value type doesn't match setting type
// - ErrValidationFailed: Value fails validation rules
// - ErrDatabaseError: Database update failed
func (ss *SettingsServiceImpl) Update(category ConfigCategory, key string, value SettingValue) error
```

### ResetToDefault Method

```go
// ResetToDefault restores a setting to its original seed value
//
// Behavior:
// 1. Retrieve DefaultValue from database
// 2. Update Value = DefaultValue
// 3. Set IsUserModified = false
// 4. Invalidate cache entry
// 5. Return nil on success
//
// Errors:
// - ErrSettingNotFound: Key doesn't exist
// - ErrNoDefaultValue: DefaultValue is empty (shouldn't happen)
// - ErrDatabaseError: Database update failed
func (ss *SettingsServiceImpl) ResetToDefault(category ConfigCategory, key string) error
```

### ResetCategoryToDefault Method

```go
// ResetCategoryToDefault restores all settings in a category
//
// Behavior:
// 1. Query all settings in category
// 2. For each setting, restore Value = DefaultValue
// 3. Set IsUserModified = false for all
// 4. Invalidate all cache entries for category
// 5. Return nil on success
//
// Errors:
// - ErrCategoryNotFound: Category doesn't exist
// - ErrDatabaseError: Database update failed
func (ss *SettingsServiceImpl) ResetCategoryToDefault(category ConfigCategory) error
```

### SeedFromFile Method

```go
// SeedFromFile loads and seeds configuration from a JSON file
//
// Behavior:
// 1. Read and parse JSON file
// 2. Validate seed file structure
// 3. Check version against existing category version
// 4. If version differs OR category empty → seed all values
// 5. If version matches → skip (preserve user changes)
// 6. Return nil on success
//
// Seeding Logic:
// - Uses UPSERT semantics (insert or update on conflict)
// - Stores original value in DefaultValue field
// - Sets IsUserModified = false for new seeds
//
// Errors:
// - ErrFileNotFound: File doesn't exist
// - ErrInvalidSeedFile: JSON parse or validation failed
// - ErrDatabaseError: Database operation failed
func (ss *SettingsServiceImpl) SeedFromFile(filepath string) error
```

### SeedAllFromDirectory Method

```go
// SeedAllFromDirectory seeds all JSON files in a directory
//
// Behavior:
// 1. List all *.json files matching "seeding-*.json" pattern
// 2. For each file, call SeedFromFile
// 3. Continue on individual file errors (log and track)
// 4. Return aggregate error if any files failed
//
// File Pattern: seeding-*.json
//
// Errors:
// - ErrDirectoryNotFound: Directory doesn't exist
// - ErrPartialSeedFailure: Some files failed (details in error)
func (ss *SettingsServiceImpl) SeedAllFromDirectory(dirpath string) error
```

### ForceReseed Method

```go
// ForceReseed re-seeds a category regardless of version
//
// Behavior:
// 1. Find seed file for category
// 2. Parse seed file
// 3. Delete all existing settings in category
// 4. Seed all values from file
// 5. Invalidate all cache entries for category
//
// Use Cases:
// - Recovery from corrupted settings
// - Admin-initiated reset to defaults
//
// Errors:
// - ErrCategoryNotFound: Category not valid
// - ErrSeedFileNotFound: No seed file for category
// - ErrDatabaseError: Database operation failed
func (ss *SettingsServiceImpl) ForceReseed(category ConfigCategory) error
```

### GetByCategory Method

```go
// GetByCategory returns all settings in a category
//
// Returns:
// - Slice of Setting structs
// - Settings are ordered by Key alphabetically
//
// Errors:
// - ErrCategoryNotFound: Category doesn't exist
func (ss *SettingsServiceImpl) GetByCategory(category ConfigCategory) appfault.ResultSlice[Setting]
```

### ExportCategory Method

```go
// ExportCategory generates a SeedFile from current category values
//
// Use Cases:
// - Backup current configuration
// - Generate updated seed file after UI modifications
// - Migrate settings between environments
//
// Returns:
// - SeedFile with current version, category, and all values as SettingValue
//
// Errors:
// - ErrCategoryNotFound: Category doesn't exist
func (ss *SettingsServiceImpl) ExportCategory(category ConfigCategory) appfault.Result[*SeedFile]
```

---

## Cache Implementation

### Cache Structure

```go
// CacheEntry is a strongly-typed cache entry with TTL tracking
type CacheEntry struct {
    Value     SettingValue
    StoredAt  time.Time
}

type SettingsCache struct {
    cache     sync.Map // map[string]CacheEntry
    ttl       time.Duration
}
```

### Cache Methods

```go
// NewSettingsCache creates a cache with specified TTL
func NewSettingsCache(ttl time.Duration) *SettingsCache

// Get retrieves value from cache, returns empty SettingValue if expired or missing
func (c *SettingsCache) Get(category ConfigCategory, key string) (SettingValue, bool)

// Set stores value in cache with TTL
func (c *SettingsCache) Set(category ConfigCategory, key string, value SettingValue)

// Delete removes a specific entry
func (c *SettingsCache) Delete(category ConfigCategory, key string)

// DeleteCategory removes all entries for a category
func (c *SettingsCache) DeleteCategory(category ConfigCategory)

// Clear removes all entries
func (c *SettingsCache) Clear()

// WarmFromDb loads all settings into cache
func (c *SettingsCache) WarmFromDb(db *gorm.DB) *appfault.AppError
```

### Cache Key Format

```
{category}:{key}

Examples:
- model_routing:complexity_threshold
- confidence_metrics:weights
- trend_analysis:composite_score_weights
```

---

## Error Types

```go
var (
    ErrSettingNotFound     = errors.New("setting not found")
    ErrCategoryNotFound    = errors.New("category not found")
    ErrTypeMismatch        = errors.New("value type mismatch")
    ErrValueDecodeFailed   = errors.New("failed to decode value")
    ErrValidationFailed    = errors.New("validation failed")
    ErrDatabaseError       = errors.New("database operation failed")
    ErrFileNotFound        = errors.New("file not found")
    ErrInvalidSeedFile     = errors.New("invalid seed file format")
    ErrSeedFileNotFound    = errors.New("seed file not found for category")
    ErrPartialSeedFailure  = errors.New("some seed files failed")
    ErrNoDefaultValue      = errors.New("no default value stored")
    ErrIntegerOverflow     = errors.New("integer value overflow")
    ErrCacheWarmFailed     = errors.New("cache warming failed")
)

// SettingsError wraps errors with additional context
type SettingsError struct {
    Op       string         // Operation that failed
    Category ConfigCategory // Category involved
    Key      string         // Key involved (optional)
    Err      error          `json:"-"` // EXEMPTED: AppError internal cause (I-2)
}

func (e *SettingsError) Error() string {
    if e.Key != "" {
        return fmt.Sprintf("%s failed for %s:%s: %v", e.Op, e.Category, e.Key, e.Err)
    }
    return fmt.Sprintf("%s failed for category %s: %v", e.Op, e.Category, e.Err)
}

func (e *SettingsError) Unwrap() error {
    return e.Err
}
```

---

## Initialization Flow

```go
// InitializeSettings sets up the settings service with seeding
func InitializeSettings(db *gorm.DB, seedDir string) appfault.Result[*SettingsServiceImpl] {
    // 1. Auto-migrate Settings table
    if err := db.AutoMigrate(&Setting{}); err != nil {
        return appfault.Fail[*SettingsServiceImpl](appfault.Wrap(
            err,
            "failed to migrate Settings table",
        ))
    }
    
    // 2. Create service with cache
    cache := NewSettingsCache(5 * time.Minute)
    service := &SettingsServiceImpl{
        db:      db,
        cache:   cache,
        seedDir: seedDir,
    }
    
    // 3. Seed from all seed files
    if seedErr := service.SeedAllFromDirectory(seedDir); seedErr != nil {
        // Log warning but don't fail - partial seeding is acceptable
        log.Printf("Warning: partial seed failure: %v", seedErr)
    }
    
    // 4. Warm cache
    if warmErr := cache.WarmFromDb(db); warmErr != nil {
        log.Printf("Warning: cache warming failed: %v", warmErr)
    }
    
    return appfault.Ok(service)
}
```

---

## Configuration Categories Mapping

| Category | Seed File | Description |
|----------|-----------|-------------|
| `model_routing` | `seeding-models.json` | LLM thresholds, model pools, timeouts |
| `authority_scores` | `seeding-authority-scores.json` | Domain authority values |
| `source_weights` | `seeding-source-weights.json` | Weight formula coefficients |
| `credibility_thresholds` | `seeding-credibility.json` | Classification thresholds |
| `confidence_metrics` | `seeding-confidence-metrics.json` | Confidence analysis weights |
| `trend_analysis` | `seeding-trend-analysis.json` | Trend composite scoring |
| `search_settings` | `seeding-search-settings.json` | Search behavior settings |
| `cache_settings` | `seeding-cache-settings.json` | Cache TTL and limits |

---

## Usage Examples

### Basic Usage

```go
// Initialize service
service, err := InitializeSettings(db, "./config")
if err != nil {
    log.Fatal(err)
}

// Get a float value
threshold, err := service.GetFloat(CategoryModelRouting, "complexity_threshold")
if err != nil {
    log.Printf("Error: %v", err)
}

// Get a map value (strongly typed)
weights, err := service.GetMap(CategoryConfidenceMetrics, "weights")
if err != nil {
    log.Printf("Error: %v", err)
}
sourceAgreement := weights["source_agreement"] // string — parse if needed

// Using generic accessor
threshold2, err := GetTyped[float64](service, CategoryModelRouting, "complexity_threshold")

// Update a value at runtime (strongly typed)
err = service.Update(CategoryTrendAnalysis, "top_n_results", NewIntValue(15))
if err != nil {
    log.Printf("Update failed: %v", err)
}

// Reset to seed default
err = service.ResetToDefault(CategoryTrendAnalysis, "top_n_results")
```

### Integration with TrendAnalyzer

```go
func NewTrendAnalyzer(settings SettingsService) *TrendAnalyzer {
    // Load configuration from settings using typed accessors
    ghStars, _ := GetTyped[float64](settings, CategoryTrendAnalysis, "github_stars_weight")
    jobPostings, _ := GetTyped[float64](settings, CategoryTrendAnalysis, "job_postings_weight")
    soQuestions, _ := GetTyped[float64](settings, CategoryTrendAnalysis, "stackoverflow_weight")
    pkgDownloads, _ := GetTyped[float64](settings, CategoryTrendAnalysis, "package_downloads_weight")
    
    return &TrendAnalyzer{
        settings: settings,
        weights: TrendWeights{
            GitHubStars:            ghStars,
            JobPostings:            jobPostings,
            StackOverflowQuestions: soQuestions,
            PackageDownloads:       pkgDownloads,
        },
    }
}
```

### Integration with ConfidenceAnalyzer

```go
func NewConfidenceAnalyzer(settings SettingsService) *ConfidenceAnalyzer {
    // Load configuration from settings using typed accessors
    srcAgreement, _ := GetTyped[float64](settings, CategoryConfidenceMetrics, "source_agreement_weight")
    freshness, _ := GetTyped[float64](settings, CategoryConfidenceMetrics, "data_freshness_weight")
    srcCount, _ := GetTyped[float64](settings, CategoryConfidenceMetrics, "source_count_weight")
    authDiversity, _ := GetTyped[float64](settings, CategoryConfidenceMetrics, "authority_diversity_weight")
    
    return &ConfidenceAnalyzer{
        settings: settings,
        weights: ConfidenceWeights{
            SourceAgreement:       srcAgreement,
            DataFreshness:         freshness,
            SourceCountConfidence: srcCount,
            AuthorityDiversity:    authDiversity,
        },
    }
}
```

---

## Testing Strategy

### Unit Tests

```go
func TestSettingsService_GetFloat(t *testing.T) {
    // Setup test Db and seed
    db := setupTestDb(t)
    service := setupService(t, db)
    
    // Test valid float
    value, err := service.GetFloat(CategoryModelRouting, "complexity_threshold")
    assert.NoError(t, err)
    assert.Equal(t, 0.7, value)
    
    // Test missing key
    _, err = service.GetFloat(CategoryModelRouting, "nonexistent")
    assert.ErrorIs(t, err, ErrSettingNotFound)
    
    // Test type mismatch
    _, err = service.GetFloat(CategoryModelRouting, "model_pool")
    assert.ErrorIs(t, err, ErrTypeMismatch)
}

func TestSettingsService_Update(t *testing.T) {
    db := setupTestDb(t)
    service := setupService(t, db)
    
    // Update value (strongly typed)
    err := service.Update(CategoryModelRouting, "complexity_threshold", NewFloatValue(0.8))
    assert.NoError(t, err)
    
    // Verify update
    value, _ := service.GetFloat(CategoryModelRouting, "complexity_threshold")
    assert.Equal(t, 0.8, value)
    
    // Verify IsUserModified flag
    settings, _ := service.GetByCategory(CategoryModelRouting)
    for _, s := range settings {
        if s.Key == "complexity_threshold" {
            assert.True(t, s.IsUserModified)
        }
    }
}

func TestSettingsService_GetTyped(t *testing.T) {
    db := setupTestDb(t)
    service := setupService(t, db)
    
    // Test generic accessor
    threshold, err := GetTyped[float64](service, CategoryModelRouting, "complexity_threshold")
    assert.NoError(t, err)
    assert.Equal(t, 0.7, threshold)
    
    // Test generic accessor with string
    name, err := GetTyped[string](service, CategorySearchSettings, "engine_name")
    assert.NoError(t, err)
    assert.NotEmpty(t, name)
}

func TestSettingsService_ResetToDefault(t *testing.T) {
    db := setupTestDb(t)
    service := setupService(t, db)
    
    // Modify then reset
    service.Update(CategoryModelRouting, "complexity_threshold", NewFloatValue(0.9))
    err := service.ResetToDefault(CategoryModelRouting, "complexity_threshold")
    assert.NoError(t, err)
    
    // Verify reset
    value, _ := service.GetFloat(CategoryModelRouting, "complexity_threshold")
    assert.Equal(t, 0.7, value) // Original seed value
}

func TestSettingsService_SeedFromFile(t *testing.T) {
    db := setupTestDb(t)
    service := &SettingsServiceImpl{db: db, cache: NewSettingsCache(5*time.Minute)}
    
    // Seed from file
    err := service.SeedFromFile("./testdata/seeding-test.json")
    assert.NoError(t, err)
    
    // Verify seeded values
    value, _ := service.GetFloat(CategoryModelRouting, "complexity_threshold")
    assert.Equal(t, 0.7, value)
}
```

---

## YouTube Seedable Settings

The following settings control YouTube deep extraction behavior. They are seeded via `seeding-youtube.json`.

```json
{
  "Version": "1.0.0",
  "Category": "youtube_settings",
  "Values": {
    "YouTube.IncludeThumbnail": {
      "Value": true,
      "ValueType": "boolean",
      "Description": "Include high-resolution thumbnail URL in results"
    },
    "YouTube.IncludeDescription": {
      "Value": true,
      "ValueType": "boolean",
      "Description": "Include full video description in results"
    },
    "YouTube.IncludeExternalUrls": {
      "Value": true,
      "ValueType": "boolean",
      "Description": "Extract external URLs from video description"
    },
    "YouTube.IncludeTranscript": {
      "Value": false,
      "ValueType": "boolean",
      "Description": "Fetch auto-generated captions/subtitles (slower, requires extra request)"
    },
    "YouTube.IncludeSubtitleLanguages": {
      "Value": false,
      "ValueType": "boolean",
      "Description": "List available subtitle languages"
    },
    "YouTube.Auth.Enabled": {
      "Value": false,
      "ValueType": "boolean",
      "Description": "Enable authenticated YouTube access via cookies or session token"
    },
    "YouTube.Auth.CookieFile": {
      "Value": "",
      "ValueType": "string",
      "Description": "Path to cookies.txt file for authenticated access (Netscape format)"
    },
    "YouTube.Auth.SessionToken": {
      "Value": "",
      "ValueType": "string",
      "Description": "Browser session token for authenticated access"
    },
    "YouTube.BatchMaxParallel": {
      "Value": 5,
      "ValueType": "number",
      "Description": "Maximum concurrent video extractions in batch mode"
    }
  }
}
```

---

## Related Specifications

- [Seedable Config Pattern](../../21-app/spec-management-software/04-coding-guidelines/05-seedable-config-pattern.md)
- [TrendAnalyzer Implementation](./20-trend-analyzer-implementation.md)
- [Authority & Credibility Scoring](./18-authority-credibility-scoring.md)
- [Settings UI Page](../02-frontend/01-settings-ui-page.md)
- [Platform Search](./23-platform-search.md)
