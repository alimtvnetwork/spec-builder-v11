# 12. SettingsService Implementation Specification

**Version:** 5.0.0  
**Status:** Planned  
**Updated:** 2026-03-09  
**Parent:** [AI Bridge CLI Overview](../00-overview.md)

---

## Purpose

Define the complete Golang implementation specification for the `SettingsService` — a centralized service for managing seedable configuration values with caching, type-safe accessors, version-gated seeding, and runtime modifications for the AI Bridge CLI.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AI BRIDGE SETTINGS SERVICE                            │
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
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │ 
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         DATABASE LAYER                                  │ │
│  │                                                                         │ │
│  │  GORM with SQLite (Root DB: data/aibridge.db)                           │ │
│  │  Settings table with versioning                                         │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Module Structure

```
aibridge/
├── internal/
│   └── settings/
│       ├── service.go          # SettingsService implementation
│       ├── seeder.go           # ConfigSeeder for seed file processing
│       ├── cache.go            # Cache layer implementation
│       ├── models.go           # Setting model and enums
│       ├── types.go            # ConfigCategory, ValueType, SettingValue enums
│       ├── errors.go           # Custom error types (AB-9200-9249)
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
    GetString(category configcategorytype.Type, key string) appfault.Result[string]
    GetFloat(category configcategorytype.Type, key string) appfault.Result[float64]
    GetInt(category configcategorytype.Type, key string) appfault.Result[int]
    GetBool(category configcategorytype.Type, key string) appfault.Result[bool]
    GetStringSlice(category configcategorytype.Type, key string) appfault.Result[[]string]
    GetMap(category configcategorytype.Type, key string) appfault.Result[map[string]string]
    
    // Mutation methods (strongly typed value container)
    Update(category configcategorytype.Type, key string, value SettingValue) *appfault.AppError
    ResetToDefault(category configcategorytype.Type, key string) *appfault.AppError
    ResetCategoryToDefault(category configcategorytype.Type) *appfault.AppError
    
    // Seeding methods
    SeedFromFile(filepath string) *appfault.AppError
    ForceReseed(category configcategorytype.Type) *appfault.AppError
    
    // Query methods
    GetByCategory(category configcategorytype.Type) appfault.Result[[]Setting]
    GetCategoryVersion(category configcategorytype.Type) appfault.Result[string]
    
    // Cache management
    InvalidateCache() *appfault.AppError
    WarmCache() *appfault.AppError
}
```

### Generic Typed Accessor (Go 1.18+)

```go
// GetTyped retrieves a setting and returns it as the specified concrete type.
// Eliminates the need for interface{} by using Go generics.
// Uses typecast.CastOrFail[T] internally per §7.2 (no manual assertions).
func GetTyped[T SettingConstraint](svc SettingsService, category configcategorytype.Type, key string) appfault.Result[T] {
    var zero T
    // EXEMPTED: type-switch on generic zero value for dispatch (§7.2 — no runtime assertion on real data)
    switch any(zero).(type) {
    case string:
        r := svc.GetString(category, key)
        if r.IsErr() {
            return appfault.Fail[T](r.Err())
        }
        return typecast.CastOrFail[T](r.Value())
    case int:
        r := svc.GetInt(category, key)
        if r.IsErr() {
            return appfault.Fail[T](r.Err())
        }
        return typecast.CastOrFail[T](r.Value())
    case float64:
        r := svc.GetFloat(category, key)
        if r.IsErr() {
            return appfault.Fail[T](r.Err())
        }
        return typecast.CastOrFail[T](r.Value())
    case bool:
        r := svc.GetBool(category, key)
        if r.IsErr() {
            return appfault.Fail[T](r.Err())
        }
        return typecast.CastOrFail[T](r.Value())
    case []string:
        r := svc.GetStringSlice(category, key)
        if r.IsErr() {
            return appfault.Fail[T](r.Err())
        }
        return typecast.CastOrFail[T](r.Value())
    case map[string]string:
        r := svc.GetMap(category, key)
        if r.IsErr() {
            return appfault.Fail[T](r.Err())
        }
        return typecast.CastOrFail[T](r.Value())
    default:
        return appfault.FailNew[T](
            ErrSettingsUnsupportedType,
            "unsupported setting type",
        )
    }
}
```

---

## Data Models

### Setting Model

```go
type Setting struct {
    Id             string         `gorm:"column:Id;primaryKey;size:36"`
    Key            string         `gorm:"column:Key;not null;size:255"`
    Value          string         `gorm:"column:Value;not null;type:text"` // JSON-encoded
    Category       configcategorytype.Type `gorm:"column:Category;not null;size:50"`
    Version        string         `gorm:"column:Version;not null;size:20"`
    ValueType      ValueType      `gorm:"column:ValueType;not null;size:20"`
    Description    string         `gorm:"column:Description;size:500"`
    IsUserModified bool           `gorm:"column:IsUserModified;default:false"`
    DefaultValue   string         `gorm:"column:DefaultValue;type:text"`
    CreatedAt      time.Time      `gorm:"column:CreatedAt"`
    UpdatedAt      time.Time      `gorm:"column:UpdatedAt"`
}

func (Setting) TableName() string {
    return "Settings"
}
```

---

## AI Bridge Configuration Categories

```go
// Package configcategorytype defines the ConfigCategoryType enum.
// Location: internal/enum/configcategorytype/configcategorytype.go
package configcategorytype

type Type byte

const (
    // LLM Provider Settings
    LlmProviders      Type = iota
    ModelRouting
    TokenLimits

    // RAG Settings
    RagChunking
    RagEmbeddings
    RagRetrieval

    // Session Settings
    SessionDefaults
    ContextWindow

    // Reasoning Settings (per 09-adaptive-reasoning.md)
    ReasoningFlow
    SkipSignals

    // WebSocket Settings
    WebSocket
    StreamingDefaults

    // SEO Module Settings
    SeoGeneration
    SeoPresets
)

var variantLabels = map[Type]string{
    LlmProviders:      "LlmProviders",
    ModelRouting:       "ModelRouting",
    TokenLimits:        "TokenLimits",
    RagChunking:        "RagChunking",
    RagEmbeddings:      "RagEmbeddings",
    RagRetrieval:       "RagRetrieval",
    SessionDefaults:    "SessionDefaults",
    ContextWindow:      "ContextWindow",
    ReasoningFlow:      "ReasoningFlow",
    SkipSignals:        "SkipSignals",
    WebSocket:          "WebSocket",
    StreamingDefaults:  "StreamingDefaults",
    SeoGeneration:      "SeoGeneration",
    SeoPresets:         "SeoPresets",
}

func (t Type) String() string {
    if label, ok := variantLabels[t]; ok {
        return label
    }
    return "Unknown"
}

func (t Type) Label() string {
    return t.String()
}

func Values() []Type {
    vals := make([]Type, 0, len(variantLabels))
    for v := range variantLabels {
        vals = append(vals, v)
    }
    return vals
}

func Parse(s string) appfault.Result[Type] {
    for k, v := range variantLabels {
        if strings.EqualFold(v, s) {
            return appfault.Ok(k)
        }
    }
    return appfault.FailNew[Type](
        ErrEnumInvalidVariant,
        "invalid ConfigCategoryType: %q",
        s,
    )
}

// EXEMPTED: MarshalJSON implements json.Marshaler stdlib interface — must return ([]byte, error)
func (t Type) MarshalJSON() ([]byte, error) {
    return json.Marshal(t.String())
}

// EXEMPTED: UnmarshalJSON implements json.Unmarshaler stdlib interface — must return error
func (t *Type) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return fmt.Errorf("ConfigCategoryType unmarshal: %w", err)
    }
    parseResult := Parse(s)
    if parseResult.IsErr() {
        return parseResult.Err()
    }
    *t = parseResult.Value()
    return nil
}
```

---

## Seed File Examples

### LLM Providers Seed (`config/seeds/llm_providers.seed.json`)

```json
{
    "Version": "1.0.0",
    "Category": "LlmProviders",
    "Description": "LLM provider configurations",
    "Values": {
        "DefaultProvider": "openai",
        "Providers": {
            "openai": {
                "BaseUrl": "https://api.openai.com/v1",
                "DefaultModel": "gpt-4-turbo",
                "MaxRetries": 3,
                "TimeoutSeconds": 60
            },
            "anthropic": {
                "BaseUrl": "https://api.anthropic.com/v1",
                "DefaultModel": "claude-3-opus",
                "MaxRetries": 3,
                "TimeoutSeconds": 90
            },
            "ollama": {
                "BaseUrl": "http://localhost:11434",
                "DefaultModel": "llama2",
                "MaxRetries": 2,
                "TimeoutSeconds": 120
            }
        },
        "FallbackChain": ["openai", "anthropic", "ollama"]
    }
}
```

### Reasoning Flow Seed (`config/seeds/reasoning_flow.seed.json`)

```json
{
    "Version": "1.0.0",
    "Category": "ReasoningFlow",
    "Description": "Adaptive reasoning configuration",
    "Values": {
        "DefaultMode": "TwoStage",
        "Modes": {
            "TwoStage": {
                "Enabled": true,
                "MaxIterations": 3
            },
            "SinglePrompt": {
                "Enabled": true
            },
            "Conditional": {
                "Enabled": true,
                "ConfidenceThreshold": 0.8
            }
        },
        "ModuleOverrides": {
            "Chat": "TwoStage",
            "Blog": "Conditional",
            "Code": "TwoStage",
            "Faq": "SinglePrompt",
            "Paragraph": "SinglePrompt"
        }
    }
}
```

### RAG Chunking Seed (`config/seeds/rag_chunking.seed.json`)

```json
{
    "Version": "1.0.0",
    "Category": "RagChunking",
    "Description": "RAG chunking configuration",
    "Values": {
        "ChunkMaxTokens": 512,
        "ChunkOverlapTokens": 50,
        "ChunkStrategy": "Semantic",
        "MinChunkSize": 100,
        "MaxChunkSize": 1024,
        "SeparatorPatterns": ["\n\n", "\n", ". ", " "]
    }
}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| AB-9200 | SETTINGS_NOT_FOUND | Setting key not found in category |
| AB-9201 | CATEGORY_NOT_FOUND | Category does not exist |
| AB-9202 | TYPE_MISMATCH | Value type mismatch |
| AB-9203 | SEED_PARSE_ERROR | Failed to parse seed file |
| AB-9204 | SEED_VERSION_ERROR | Seed version comparison failed |
| AB-9205 | CACHE_INVALIDATION_ERROR | Cache invalidation failed |
| AB-9206 | VALUE_VALIDATION_ERROR | Value failed validation |
| AB-9207 | DATABASE_ERROR | Database operation failed |

---

## REST API Endpoints

### GET /api/v1/settings/{category}

Returns all settings in a category.

**Response:**
```json
{
    "Category": "LlmProviders",
    "Version": "1.0.0",
    "Settings": [
        {
            "Key": "DefaultProvider",
            "Value": "openai",
            "ValueType": "String",
            "IsUserModified": false
        }
    ]
}
```

### GET /api/v1/settings/{category}/{key}

Returns a specific setting value.

### PUT /api/v1/settings/{category}/{key}

Updates a setting value.

**Request:**
```json
{
    "Value": "anthropic",
    "ValueType": "String"
}
```

### POST /api/v1/settings/{category}/reset

Resets all settings in category to defaults.

### POST /api/v1/settings/{category}/{key}/reset

Resets a specific setting to default.

---

## Integration with Split DB

The Settings table resides in the **Root DB** (`data/aibridge.db`) as defined in `02-spec/06-split-db-architecture/00-overview.md`:

```
data/
├── aibridge.db                    # Root DB - contains Settings table
├── {appName}/
│   ├── search.db                  # App-level search metadata
│   └── rag/
│       └── ...                    # Session-scoped databases
```

---

## Cache Implementation

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

func (c *SettingsCache) Get(key string) (SettingValue, bool) {
    raw, ok := c.cache.Load(key)
    if !ok {
        return SettingValue{}, false
    }
    entry := raw.(CacheEntry)
    if time.Since(entry.StoredAt) > c.ttl {
        c.cache.Delete(key)
        return SettingValue{}, false
    }
    return entry.Value, true
}

func (c *SettingsCache) Set(key string, value SettingValue) {
    c.cache.Store(key, CacheEntry{
        Value:    value,
        StoredAt: time.Now(),
    })
}
```

---

## Related Specifications

- [09-adaptive-reasoning.md](./00-overview.md) - Reasoning settings integration
- [12-database-architecture.md](./12-database-architecture.md) - Split DB structure
- [14-reset-api.md](./00-overview.md) - Reset functionality for settings
