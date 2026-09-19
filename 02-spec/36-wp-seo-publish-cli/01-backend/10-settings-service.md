# WP SEO Publish CLI: Settings Service Specification

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Parent:** [WP SEO Publish CLI Overview](./00-overview.md)

---

## Purpose

Define the SettingsService implementation for the WP SEO Publish CLI — managing seedable configuration for publishing defaults, AI Bridge integration, variable processing, and automation settings.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WP SEO PUBLISH SETTINGS SERVICE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐     ┌─────────────┐     ┌──────────────────┐         │
│  │ Public Interface │────▶│ Cache Layer │────▶│ Database Layer   │         │
│  │ Typed Accessors  │     │ sync.Map    │     │ GORM + SQLite    │         │
│  └──────────────────┘     └─────────────┘     │ data/wpseo.db   │         │
│                                                └──────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Interface

```go
type SettingsService interface {
    Get(category ConfigCategory, key string) appfault.Result[json.RawMessage]
    GetString(category ConfigCategory, key string) appfault.Result[string]
    GetFloat(category ConfigCategory, key string) appfault.Result[float64]
    GetInt(category ConfigCategory, key string) appfault.Result[int]
    GetBool(category ConfigCategory, key string) appfault.Result[bool]
    GetStringSlice(category ConfigCategory, key string) appfault.Result[[]string]
    Update(category ConfigCategory, key string, value json.RawMessage) *appfault.AppError
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
    // Publishing
    CategoryPublishDefaults   ConfigCategory = "PublishDefaults"
    CategoryPublishSeo        ConfigCategory = "PublishSeo"
    CategoryPublishContent    ConfigCategory = "PublishContent"
    
    // AI Bridge Integration
    CategoryAiBridge          ConfigCategory = "AiBridge"
    CategoryAiPrompts         ConfigCategory = "AiPrompts"
    
    // GSearch Integration
    CategoryGSearch           ConfigCategory = "GSearch"
    
    // Variable System
    CategoryVariables         ConfigCategory = "Variables"
    CategoryVariableTemplates ConfigCategory = "VariableTemplates"
    
    // Automation
    CategoryAutomation        ConfigCategory = "Automation"
    CategoryBatchPublish      ConfigCategory = "BatchPublish"
    
    // Sitemap
    CategorySitemap           ConfigCategory = "Sitemap"
)
```

---

## Seed File Examples

### Publishing Defaults

```json
{
    "Version": "1.0.0",
    "Category": "PublishDefaults",
    "Description": "Default publishing configuration",
    "Values": {
        "DefaultStatus": "draft",
        "DefaultOutputFormat": "html",
        "DefaultLinkDensityMode": "paragraph",
        "LinksPerParagraph": 3,
        "UseAiSuggestions": true,
        "MaxSlugWords": 4,
        "DelayBetweenPublishes": 5
    }
}
```

### AI Bridge Settings

```json
{
    "Version": "1.0.0",
    "Category": "AiBridge",
    "Description": "AI Bridge connection defaults",
    "Values": {
        "BaseUrl": "http://127.0.0.1:5040",
        "Timeout": 120,
        "EnableStreaming": true,
        "DefaultModel": "llama3",
        "Temperature": 0.7,
        "MaxTokens": 4096
    }
}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 12520 | SETTINGS_NOT_FOUND | Setting key not found |
| 12521 | CATEGORY_NOT_FOUND | Category does not exist |
| 12522 | TYPE_MISMATCH | Value type mismatch |
| 12523 | SEED_PARSE_ERROR | Failed to parse seed file |
| 12524 | SEED_VERSION_ERROR | Seed version comparison failed |
| 12525 | CACHE_ERROR | Cache invalidation failed |
| 12526 | VALIDATION_ERROR | Value failed validation |
| 12527 | DATABASE_ERROR | Database operation failed |

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
| Split DB Schema | `./06-split-db-schema.md` |
| Error Codes | `./08-error-codes.md` |
| API Endpoints | `./07-api-endpoints.md` |
