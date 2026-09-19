# Seedable Configuration Training Bundle

**Version:** 1.0.0  
**Updated:** 2026-02-04  
**Purpose:** Rapid onboarding for Seedable Configuration pattern

---

## Overview

This bundle consolidates the ecosystem's Seedable Configuration requirements for efficient AI model training. All CLI tools must follow these patterns for runtime configurability.

---

## Core Principle

**Configuration data must never be hardcoded.** All settings, validation rules, and runtime parameters are seeded from `config.seed.json` into the Root DB at startup.

---

## 1. Architecture Pattern

### Database Hierarchy

```
┌─────────────────────────────────────────┐
│           Root/Setting DB               │
│  (Global registry, seeded config)       │
│  Example: data/gsearch.db               │
├─────────────────────────────────────────┤
│              App DB                     │
│  (Application-level metadata)           │
│  Example: data/projects/{id}/app.db     │
├─────────────────────────────────────────┤
│           Session/Cache DB              │
│  (Isolated per-chat, per-RAG-chunk)     │
│  Example: data/sessions/{id}.db         │
└─────────────────────────────────────────┘
```

### Settings Schema

```go
type Setting struct {
    Id        uint   `gorm:"primaryKey"`
    Key       string `gorm:"uniqueIndex;not null"`
    Value     string `gorm:"type:text"`
    Category  string `gorm:"index"`
    Version   string
    ValueType string // "string", "int", "bool", "json", "stringArray"
}
```

---

## 2. Seeding Pattern

### config.seed.json Structure

```json
{
  "settings": [
    {
      "key": "cache.ttl.days",
      "value": "5",
      "category": "cache",
      "valueType": "int"
    },
    {
      "key": "seo.transition_words",
      "value": "[\"however\",\"therefore\",\"moreover\"]",
      "category": "seo",
      "valueType": "stringArray"
    }
  ]
}
```

### Startup Seeding

```go
func (s *SettingsService) SeedFromFile(path string) error {
    data, err := os.ReadFile(path)
    if err != nil {
        return err
    }
    
    var config SeedConfig
    if err := json.Unmarshal(data, &config); err != nil {
        return err
    }
    
    for _, setting := range config.Settings {
        s.Upsert(setting.Key, setting.Value, setting.Category, setting.ValueType)
    }
    return nil
}
```

---

## 3. Typed Accessors (Mandatory)

### ❌ FORBIDDEN: Magic Strings

```go
// NEVER do this
value, _ := db.GetSetting("cache.ttl.days")
```

### ✅ REQUIRED: Typed Constants + Getters

```go
// Constants file: pkg/settings/keys.go
const (
    KeyCacheTTLDays       = "cache.ttl.days"
    KeySeoTransitionWords = "seo.transition_words"
    KeyMaxRetries         = "api.max_retries"
)

// Usage with typed getters
ttl := settings.GetInt(KeyCacheTTLDays)           // Returns int
words := settings.GetStringArray(KeySeoTransitionWords) // Returns []string
retries := settings.GetInt(KeyMaxRetries)         // Returns int with default
```

### Typed Getter Interface

```go
type SettingsService interface {
    GetString(key string) string
    GetInt(key string) int
    GetBool(key string) bool
    GetStringArray(key string) []string
    GetJSON(key string, target interface{}) error
    
    // With defaults
    GetStringOrDefault(key, defaultValue string) string
    GetIntOrDefault(key string, defaultValue int) int
}
```

---

## 4. Cache Policy Integration

### Default TTL: 5 Days

All external search results and URL extractions use a seedable 5-day TTL:

```go
ttl := settings.GetIntOrDefault(KeyCacheTTLDays, 5)
cacheExpiry := time.Now().Add(time.Duration(ttl) * 24 * time.Hour)
```

### Force Refresh Override

```go
// CLI flag overrides cached data
if forceFlag {
    cache.Invalidate(cacheKey)
}
```

---

## 5. Validation Data Pattern

### SEO Rules Example

```go
// Seeded data access (never hardcoded)
func (v *SeoValidator) GetTransitionWords() []string {
    return v.settings.GetStringArray(KeySeoTransitionWords)
}

// Usage in validation
func (v *SeoValidator) ContainsTransitionWord(text string) bool {
    words := v.GetTransitionWords()
    for _, word := range words {
        if strings.Contains(strings.ToLower(text), word) {
            return true
        }
    }
    return false
}
```

---

## 6. Compliant CLI Tools

| Tool | Root DB Location | Status |
|------|------------------|--------|
| GSearch | `data/gsearch.db` | ✅ Compliant |
| BRun | `data/brun.db` | ✅ Compliant |
| AI Bridge | `data/aibridge.db` | ✅ Compliant |
| Nexus Flow | `data/nexusflow.db` | ✅ Compliant |
| Article Butler | `data/articlebutler.db` | ✅ Compliant |
| Prompt Shaper | `data/promptshaper.db` | ✅ Compliant |
| Noteflow | `data/noteflow.db` | ✅ Compliant |
| Source Search | `data/sourcesearch.db` | ✅ Compliant |
| Whisper Shaper | `data/whispershaper.db` | ✅ Compliant |

---

## 7. Pre-Flight Checklist

Before implementing any configuration:

- [ ] **No hardcoded values** - All config in `config.seed.json`
- [ ] **Typed constants defined** - Keys in `pkg/settings/keys.go`
- [ ] **Typed getters used** - No raw string queries
- [ ] **Category assigned** - Proper grouping for UI/filtering
- [ ] **ValueType specified** - Enables proper parsing

---

## Quick Reference

| Pattern | Implementation |
|---------|----------------|
| Define key | `const KeyName = "category.setting_name"` |
| Seed value | Add to `config.seed.json` |
| Read string | `settings.GetString(KeyName)` |
| Read int | `settings.GetInt(KeyName)` |
| Read array | `settings.GetStringArray(KeyName)` |
| Override | CLI flag or API parameter |

---

## Related Documentation

| Document | Path |
|----------|------|
| Seedable Config Spec | `02-spec/07-seedable-config-architecture/` |
| Settings Service Memory | `.lovable/memories/patterns/settings-service.md` |
| Split DB Architecture | `02-spec/06-split-db-architecture/` |
| Database Standards Hub | `.lovable/memories/standards/00-database-standards-hub.md` |

---

## Cross-Reference: Database Standards

The Seedable Configuration pattern works alongside the Database Standards:

- **DBOperation Wrapper**: Used when reading/writing settings to Root DB
- **ORM-First**: Settings table managed via GORM models
- **Structured Logging**: Setting changes logged with standard fields

See: [Database Standards Training Bundle](./11-database-standards-training-bundle.md)
