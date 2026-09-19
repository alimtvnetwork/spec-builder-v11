# WP Plugin Builder: Settings Service Specification

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Parent:** [WP Plugin Builder Overview](./00-overview.md)

---

## Purpose

Define the SettingsService for WP Plugin Builder — managing seedable configuration for project generation, RAG indexing, code generation templates, and preset learning.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WP PLUGIN BUILDER SETTINGS SERVICE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐     ┌─────────────┐     ┌──────────────────┐         │
│  │ Public Interface │────▶│ Cache Layer │────▶│ Database Layer   │         │
│  │ Typed Accessors  │     │ sync.Map    │     │ GORM + SQLite    │         │
│  └──────────────────┘     └─────────────┘     │ ~/.wpb/wpb.sqlite│         │
│                                                └──────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Interface

```go
type SettingsService interface {
    Get(category ConfigCategory, key string) apperror.Result[json.RawMessage]
    GetString(category ConfigCategory, key string) apperror.Result[string]
    GetFloat(category ConfigCategory, key string) apperror.Result[float64]
    GetInt(category ConfigCategory, key string) apperror.Result[int]
    GetBool(category ConfigCategory, key string) apperror.Result[bool]
    GetStringSlice(category ConfigCategory, key string) apperror.Result[[]string]
    Update(category ConfigCategory, key string, value json.RawMessage) *apperror.AppError
    ResetToDefault(category ConfigCategory, key string) *apperror.AppError
    ResetCategoryToDefault(category ConfigCategory) *apperror.AppError
    SeedFromFile(filepath string) *apperror.AppError
    GetByCategory(category ConfigCategory) apperror.Result[[]Setting]
    InvalidateCache() *apperror.AppError
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
    // Project Generation
    CategoryProjectDefaults  ConfigCategory = "ProjectDefaults"
    CategoryProjectTemplates ConfigCategory = "ProjectTemplates"
    
    // Code Generation
    CategoryCodeGeneration   ConfigCategory = "CodeGeneration"
    CategoryCodeTemplates    ConfigCategory = "CodeTemplates"
    
    // RAG System
    CategoryRagIndexing      ConfigCategory = "RagIndexing"
    CategoryRagSearch        ConfigCategory = "RagSearch"
    CategoryRagEmbeddings    ConfigCategory = "RagEmbeddings"
    
    // Preset Learning
    CategoryPresetDefaults   ConfigCategory = "PresetDefaults"
    CategoryPresetCategories ConfigCategory = "PresetCategories"
    
    // AI Bridge
    CategoryAiBridge         ConfigCategory = "AiBridge"
    
    // Server
    CategoryServer           ConfigCategory = "Server"
)
```

---

## Seed File Example

```json
{
    "Version": "1.0.0",
    "Category": "ProjectDefaults",
    "Description": "Default project generation settings",
    "Values": {
        "DefaultVersion": "1.0.0",
        "DefaultTextDomain": "auto",
        "DefaultNamespace": "auto",
        "IncludeAdmin": true,
        "IncludeApi": true,
        "IncludeBlocks": false,
        "PhpMinVersion": "7.4",
        "WpMinVersion": "5.9"
    }
}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 10480 | SETTINGS_NOT_FOUND | Setting key not found |
| 10481 | CATEGORY_NOT_FOUND | Category does not exist |
| 10482 | TYPE_MISMATCH | Value type mismatch |
| 10483 | SEED_PARSE_ERROR | Failed to parse seed file |
| 10484 | SEED_VERSION_ERROR | Seed version comparison failed |
| 10485 | CACHE_ERROR | Cache invalidation failed |
| 10486 | VALIDATION_ERROR | Value failed validation |
| 10487 | DATABASE_ERROR | Database operation failed |

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
| Core Architecture | `./01-core-architecture.md` |
| Configuration | `./03-configuration.md` |
| Database Schema | `./04-database-schema.md` |
| Error Handling | `./10-error-handling.md` |
