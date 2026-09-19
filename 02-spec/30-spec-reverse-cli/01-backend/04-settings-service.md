# Spec Reverse CLI: Settings Service Specification

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Parent:** [Spec Reverse CLI Architecture](./01-architecture.md)

---

## Purpose

Define the SettingsService for the Spec Reverse CLI — managing seedable configuration for code analysis, AI Bridge integration, output format preferences, and RAG parameters.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SPEC REVERSE SETTINGS SERVICE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐     ┌─────────────┐     ┌──────────────────┐         │
│  │ Public Interface │────▶│ Cache Layer │────▶│ Database Layer   │         │
│  │ Typed Accessors  │     │ sync.Map    │     │ GORM + SQLite    │         │
│  └──────────────────┘     └─────────────┘     │ data/src.db      │         │
│                                                └──────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Interface

```go
type SettingsService interface {
    Get(category ConfigCategory, key string) appfault.Result[any]
    GetString(category ConfigCategory, key string) appfault.Result[string]
    GetFloat(category ConfigCategory, key string) appfault.Result[float64]
    GetInt(category ConfigCategory, key string) appfault.Result[int]
    GetBool(category ConfigCategory, key string) appfault.Result[bool]
    GetStringSlice(category ConfigCategory, key string) appfault.Result[[]string]
    Update(category ConfigCategory, key string, value any) *appfault.AppError
    ResetToDefault(category ConfigCategory, key string) *appfault.AppError
    ResetCategoryToDefault(category ConfigCategory) *appfault.AppError
    SeedFromFile(filepath string) *appfault.AppError
    GetByCategory(category ConfigCategory) appfault.Result[[]Setting]
    InvalidateCache() *appfault.AppError
}
```

---

## Data Model

```go
type Setting struct {
    Id             string         `gorm:"primaryKey;size:36"`
    Key            string         `gorm:"not null;size:255"`
    Value          string         `gorm:"not null;type:text"`
    Category       ConfigCategory `gorm:"not null;size:50"`
    Version        string         `gorm:"not null;size:20"`
    ValueType      string         `gorm:"not null;size:20"`
    Description    string         `gorm:"size:500"`
    IsUserModified bool           `gorm:"default:false"`
    DefaultValue   string         `gorm:"type:text"`
    CreatedAt      time.Time
    UpdatedAt      time.Time
}

func (Setting) TableName() string {
    return "Settings"
}
```

---

## Configuration Categories

```go
type ConfigCategory string

const (
    // Analysis
    CategoryAnalysisDefaults  ConfigCategory = "AnalysisDefaults"
    CategoryAnalysisPatterns  ConfigCategory = "AnalysisPatterns"
    
    // AI Bridge
    CategoryAiBridge          ConfigCategory = "AiBridge"
    
    // Output
    CategoryOutputDefaults    ConfigCategory = "OutputDefaults"
    CategoryOutputTemplates   ConfigCategory = "OutputTemplates"
    
    // RAG
    CategoryRagDefaults       ConfigCategory = "RagDefaults"
    
    // Server
    CategoryServer            ConfigCategory = "Server"
)
```

---

## Seed File Example

```json
{
    "Version": "1.0.0",
    "Category": "AnalysisDefaults",
    "Description": "Default code analysis configuration",
    "Values": {
        "MaxFileSize": 1048576,
        "ExcludePatterns": ["node_modules", "vendor", ".git", "dist", "build"],
        "Recursive": true,
        "DetectFramework": true,
        "ExtractPatterns": true
    }
}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 11500 | SETTINGS_NOT_FOUND | Setting key not found |
| 11501 | CATEGORY_NOT_FOUND | Category does not exist |
| 11502 | TYPE_MISMATCH | Value type mismatch |
| 11503 | SEED_PARSE_ERROR | Failed to parse seed file |
| 11504 | SEED_VERSION_ERROR | Seed version comparison failed |
| 11505 | CACHE_ERROR | Cache invalidation failed |
| 11506 | VALIDATION_ERROR | Value failed validation |
| 11507 | DATABASE_ERROR | Database operation failed |

---

## REST API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/settings/{category}` | List all settings in category |
| GET | `/api/v1/settings/{category}/{key}` | Get specific setting |
| PUT | `/api/v1/settings/{category}/{key}` | Update setting value |
| POST | `/api/v1/settings/{category}/reset` | Reset category to defaults |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `./01-architecture.md` |
| AI Bridge Integration | `./03-ai-bridge-integration.md` |
| Enum Architecture | `./12-enum-architecture.md` |
