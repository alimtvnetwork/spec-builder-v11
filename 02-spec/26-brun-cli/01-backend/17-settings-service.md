# 17. SettingsService Implementation Specification

**Version:** 4.0.0  
**Status:** Planned  
**Updated:** 2026-03-09  
**Parent:** [BRun CLI Overview](./00-overview.md)

---

## Purpose

Define the complete Golang implementation specification for the `SettingsService` — a centralized service for managing seedable configuration values with caching, type-safe accessors, version-gated seeding, and runtime modifications for the BRun CLI.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BRUN SETTINGS SERVICE                               │
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
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         DATABASE LAYER                                  │ │
│  │                                                                         │ │
│  │  GORM with SQLite (Root DB: data/brun.db)                               │ │
│  │  Settings table with versioning                                         │ │
│  │                                                                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Module Structure

```
brun/
├── internal/
│   └── settings/
│       ├── service.go          # SettingsService implementation
│       ├── seeder.go           # ConfigSeeder for seed file processing
│       ├── cache.go            # Cache layer implementation
│       ├── models.go           # Setting model and enums
│       ├── types.go            # ConfigCategory, ValueType, SettingValue enums
│       ├── errors.go           # Custom error types (BR-7200-7249)
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
    GetString(category ConfigCategory, key string) apperror.Result[string]
    GetFloat(category ConfigCategory, key string) apperror.Result[float64]
    GetInt(category ConfigCategory, key string) apperror.Result[int]
    GetBool(category ConfigCategory, key string) apperror.Result[bool]
    GetStringSlice(category ConfigCategory, key string) apperror.Result[[]string]
    GetMap(category ConfigCategory, key string) apperror.Result[map[string]string]
    
    // Mutation methods (strongly typed value container)
    Update(category ConfigCategory, key string, value SettingValue) error
    ResetToDefault(category ConfigCategory, key string) error
    ResetCategoryToDefault(category ConfigCategory) error
    
    // Seeding methods
    SeedFromFile(filepath string) error
    
    // Query methods
    GetByCategory(category ConfigCategory) apperror.Result[[]Setting]
    GetCategoryVersion(category ConfigCategory) apperror.Result[string]
    
    // Cache management
    InvalidateCache() error
}
```

### Generic Typed Accessor (Go 1.18+)

```go
// GetTyped retrieves a setting and returns it as the specified concrete type.
// Eliminates the need for interface{} by using Go generics.
func GetTyped[T SettingConstraint](svc SettingsService, category ConfigCategory, key string) apperror.Result[T] {
    var zero T
    switch v := any(zero).(type) {
    case string:
        _ = v
        result, err := svc.GetString(category, key)
        return any(result).(T), err
    case int:
        _ = v
        result, err := svc.GetInt(category, key)
        return any(result).(T), err
    case float64:
        _ = v
        result, err := svc.GetFloat(category, key)
        return any(result).(T), err
    case bool:
        _ = v
        result, err := svc.GetBool(category, key)
        return any(result).(T), err
    case []string:
        _ = v
        result, err := svc.GetStringSlice(category, key)
        return any(result).(T), err
    case map[string]string:
        _ = v
        result, err := svc.GetMap(category, key)
        return any(result).(T), err
    default:
        return zero, apperror.New(
            ErrUnsupportedSettingType,
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
    Category       ConfigCategory `gorm:"column:Category;not null;size:50"`
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

## BRun Configuration Categories

```go
type ConfigCategory string

const (
    // Build Settings
    CategoryBuildDefaults   ConfigCategory = "BuildDefaults"
    CategoryBuildProfiles   ConfigCategory = "BuildProfiles"
    CategoryBuildTimeouts   ConfigCategory = "BuildTimeouts"
    
    // Run Settings
    CategoryRunDefaults     ConfigCategory = "RunDefaults"
    CategoryRunEnvironments ConfigCategory = "RunEnvironments"
    
    // Port Management
    CategoryPortRanges      ConfigCategory = "PortRanges"
    CategoryPortAllocation  ConfigCategory = "PortAllocation"
    
    // Process Management
    CategoryProcessLimits   ConfigCategory = "ProcessLimits"
    CategoryHealthChecks    ConfigCategory = "HealthChecks"
    
    // Logging
    CategoryLogging         ConfigCategory = "Logging"
    CategoryLogRotation     ConfigCategory = "LogRotation"
)
```

---

## Seed File Examples

### Build Defaults Seed (`config/seeds/build_defaults.seed.json`)

```json
{
    "Version": "1.0.0",
    "Category": "BuildDefaults",
    "Description": "Default build configuration",
    "Values": {
        "DefaultTimeout": 300,
        "ParallelJobs": 4,
        "CacheEnabled": true,
        "VerboseOutput": false,
        "CleanBeforeBuild": false,
        "FailFast": true
    }
}
```

### Port Ranges Seed (`config/seeds/port_ranges.seed.json`)

```json
{
    "Version": "1.0.0",
    "Category": "PortRanges",
    "Description": "Port range configurations per error code range 7100-7599",
    "Values": {
        "DefaultRange": {
            "Start": 7100,
            "End": 7599
        },
        "Reserved": [7100, 7101, 7102],
        "DynamicAllocation": true,
        "AllocationStrategy": "sequential",
        "PortCheckTimeout": 5
    }
}
```

### Build Profiles Seed (`config/seeds/build_profiles.seed.json`)

```json
{
    "Version": "1.0.0",
    "Category": "BuildProfiles",
    "Description": "Predefined build profiles",
    "Values": {
        "Profiles": {
            "development": {
                "Optimization": "none",
                "Debug": true,
                "SourceMaps": true,
                "HotReload": true
            },
            "staging": {
                "Optimization": "basic",
                "Debug": true,
                "SourceMaps": true,
                "HotReload": false
            },
            "production": {
                "Optimization": "full",
                "Debug": false,
                "SourceMaps": false,
                "HotReload": false,
                "Minify": true,
                "TreeShake": true
            }
        },
        "DefaultProfile": "development"
    }
}
```

### Process Limits Seed (`config/seeds/process_limits.seed.json`)

```json
{
    "Version": "1.0.0",
    "Category": "ProcessLimits",
    "Description": "Process resource limits",
    "Values": {
        "MaxConcurrentBuilds": 3,
        "MaxConcurrentRuns": 10,
        "MemoryLimitMB": 2048,
        "CpuLimit": 0.8,
        "MaxFileDescriptors": 1024,
        "GracefulShutdownSeconds": 30
    }
}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| BR-7200 | SETTINGS_NOT_FOUND | Setting key not found in category |
| BR-7201 | CATEGORY_NOT_FOUND | Category does not exist |
| BR-7202 | TYPE_MISMATCH | Value type mismatch |
| BR-7203 | SEED_PARSE_ERROR | Failed to parse seed file |
| BR-7204 | SEED_VERSION_ERROR | Seed version comparison failed |
| BR-7205 | CACHE_INVALIDATION_ERROR | Cache invalidation failed |
| BR-7206 | VALUE_VALIDATION_ERROR | Value failed validation |
| BR-7207 | DATABASE_ERROR | Database operation failed |
| BR-7208 | PORT_RANGE_INVALID | Invalid port range configuration |
| BR-7209 | PROFILE_NOT_FOUND | Build profile not found |

---

## REST API Endpoints

### GET /api/v1/settings/{category}

Returns all settings in a category.

**Response:**
```json
{
    "Category": "BuildDefaults",
    "Version": "1.0.0",
    "Settings": [
        {
            "Key": "DefaultTimeout",
            "Value": 300,
            "ValueType": "number",
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
    "Value": 600
}
```

### POST /api/v1/settings/{category}/reset

Resets all settings in category to defaults.

### GET /api/v1/profiles

Returns all available build profiles.

**Response:**
```json
{
    "Profiles": ["development", "staging", "production"],
    "Default": "development"
}
```

### GET /api/v1/profiles/{name}

Returns a specific build profile configuration.

---

## Integration with Split DB

The Settings table resides in the **Root DB** (`data/brun.db`) as defined in `02-spec/06-split-db-architecture/00-overview.md`:

```
data/
├── brun.db                        # Root DB - contains Settings table
├── {projectName}/
│   ├── builds/
│   │   └── {buildId}.db           # Build-scoped databases
│   └── runs/
│       └── {runId}.db             # Run-scoped databases
```

---

## Port Management Integration

The Settings service integrates with the Port Management system defined in the OpenAPI spec:

```go
// GetAvailablePort returns next available port from configured range
func (s *SettingsServiceImpl) GetAvailablePort() apperror.Result[int] {
    // Use typed accessors — no interface{} assertions
    start, err := GetTyped[int](s, CategoryPortRanges, "DefaultRangeStart")
    if err != nil {
        return 0, err
    }
    end, err := GetTyped[int](s, CategoryPortRanges, "DefaultRangeEnd")
    if err != nil {
        return 0, err
    }
    reserved, _ := s.GetStringSlice(CategoryPortRanges, "Reserved")
    
    // Find next available port in range
    return s.portManager.FindAvailable(start, end, reserved)
}
```

---

## Related Specifications

- [00-overview.md](./00-overview.md) - BRun CLI overview
- [06-error-codes.md](./06-error-handling.md) - Error code definitions
- [15-observability.md](./15-observability.md) - Metrics and health checks
- [openapi-brun.yaml](./openapi-brun.yaml) - REST API specification
