# AI Transcribe CLI: Settings Service Specification

**Version:** 2.0.0  
**Status:** Planned  
**Updated:** 2026-03-09
**Parent:** [AI Transcribe CLI Overview](./00-overview.md)

---

## Purpose

Define the complete SettingsService implementation for the AI Transcribe CLI — a centralized service for managing seedable configuration values with caching, type-safe accessors, version-gated seeding, and runtime modifications.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AI TRANSCRIBE SETTINGS SERVICE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         PUBLIC INTERFACE                                │ │
│  │  Get(category, key) → SettingValue                                      │ │
│  │  GetString / GetFloat / GetInt / GetBool / GetStringSlice               │ │
│  │  Update / ResetToDefault / ResetCategoryToDefault                       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────┐          ┌──────────────────┐                              │
│  │ Cache Layer │          │  Database Layer   │                              │
│  │ sync.Map    │◄────────▶│  GORM + SQLite    │                              │
│  │ TTL-based   │          │  data/aitrans.db  │                              │
│  └─────────────┘          └──────────────────┘                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Module Structure

```
ai-transcribe-cli/
├── internal/
│   └── settings/
│       ├── service.go          # SettingsService implementation
│       ├── seeder.go           # ConfigSeeder for seed file processing
│       ├── cache.go            # Cache layer
│       ├── models.go           # Setting model
│       ├── types.go            # ConfigCategory constants
│       └── errors.go           # Error types (14300-14349)
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
    GetStringSlice(category ConfigCategory, key string) appfault.ResultSlice[string]
    Update(category ConfigCategory, key string, value any) *appfault.AppError
    ResetToDefault(category ConfigCategory, key string) *appfault.AppError
    ResetCategoryToDefault(category ConfigCategory) *appfault.AppError
    SeedFromFile(filepath string) *appfault.AppError
    GetByCategory(category ConfigCategory) appfault.ResultSlice[Setting]
    InvalidateCache() *appfault.AppError
}
```

---

## Data Model

```go
type Setting struct {
    Id             string         `gorm:"primaryKey;size:36"`
    Key            string         `gorm:"not null;size:255"`
    Value          string         `gorm:"not null;type:text"` // JSON-encoded
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
    // Audio Pipeline
    CategoryAudioDefaults    ConfigCategory = "AudioDefaults"
    CategoryAudioFormats     ConfigCategory = "AudioFormats"
    CategoryAudioProcessing  ConfigCategory = "AudioProcessing"
    
    // STT Providers
    CategorySttProviders     ConfigCategory = "SttProviders"
    CategorySttDefaults      ConfigCategory = "SttDefaults"
    
    // TTS Providers
    CategoryTtsProviders     ConfigCategory = "TtsProviders"
    CategoryTtsDefaults      ConfigCategory = "TtsDefaults"
    
    // Voice Cloning
    CategoryVoiceCloning     ConfigCategory = "VoiceCloning"
    
    // Model Management
    CategoryModelDownload    ConfigCategory = "ModelDownload"
    CategoryModelStorage     ConfigCategory = "ModelStorage"
    
    // Server
    CategoryServer           ConfigCategory = "Server"
    CategoryRateLimit        ConfigCategory = "RateLimit"
)
```

---

## Seed File Example

```json
{
    "Version": "1.0.0",
    "Category": "SttDefaults",
    "Description": "Default STT configuration",
    "Values": {
        "DefaultProvider": "whisper",
        "DefaultModel": "base",
        "DefaultLanguage": "en",
        "WordTimestamps": true,
        "TagAudioEvents": false,
        "MaxDurationSeconds": 3600,
        "ChunkSizeMs": 30000
    }
}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 14300 | SETTINGS_NOT_FOUND | Setting key not found |
| 14301 | CATEGORY_NOT_FOUND | Category does not exist |
| 14302 | TYPE_MISMATCH | Value type mismatch |
| 14303 | SEED_PARSE_ERROR | Failed to parse seed file |
| 14304 | SEED_VERSION_ERROR | Seed version comparison failed |
| 14305 | CACHE_ERROR | Cache invalidation failed |
| 14306 | VALIDATION_ERROR | Value failed validation |
| 14307 | DATABASE_ERROR | Database operation failed |

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
| Configuration | `./11-configuration.md` |
| Error Codes | `./10-error-codes.md` |
| Database Schema | `./08-database-schema.md` |
| Observability | `./16-observability.md` |
