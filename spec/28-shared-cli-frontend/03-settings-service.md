# Settings Service Specification

> **Version:** 1.1.0  
> **Updated:** 2026-03-09  
> **Parent:** [00-overview.md](./00-overview.md)

---

## Summary

Seedable configuration pattern with JSON seed files, SQLite persistence, and version-aware updates.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Settings Service Flow                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   First Run                          Subsequent Runs                     │
│   ─────────                          ────────────────                    │
│   ┌──────────────┐                   ┌──────────────┐                   │
│   │ config.seed  │                   │   SQLite DB   │                   │
│   │    .json     │                   │   settings    │                   │
│   └──────┬───────┘                   └──────┬───────┘                   │
│          │                                  │                            │
│          ▼                                  ▼                            │
│   ┌──────────────┐                   ┌──────────────┐                   │
│   │ Parse JSON   │                   │  Load from   │                   │
│   │ Seed File    │                   │   Database   │                   │
│   └──────┬───────┘                   └──────┬───────┘                   │
│          │                                  │                            │
│          ▼                                  ▼                            │
│   ┌──────────────┐                   ┌──────────────┐                   │
│   │ Insert into  │                   │  Check for   │                   │
│   │   SQLite     │                   │ Version Diff │                   │
│   └──────┬───────┘                   └──────┬───────┘                   │
│          │                                  │                            │
│          ▼                                  ▼                            │
│   ┌──────────────┐                   ┌──────────────┐                   │
│   │ Store Seed   │                   │ Merge New    │                   │
│   │   Version    │                   │  Defaults    │                   │
│   └──────────────┘                   └──────────────┘                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Seed File Format

### config.seed.json

```json
{
  "$schema": "./config.schema.json",
  "version": "1.0.0",
  "categories": {
    "general": {
      "displayName": "General",
      "description": "General application settings",
      "settings": {
        "theme": {
          "type": "select",
          "label": "Theme",
          "default": "system",
          "options": ["light", "dark", "system"]
        },
        "language": {
          "type": "select",
          "label": "Language",
          "default": "en",
          "options": ["en", "es", "fr", "de"]
        }
      }
    },
    "search": {
      "displayName": "Search",
      "description": "Search engine configuration",
      "settings": {
        "defaultEngine": {
          "type": "select",
          "label": "Default Engine",
          "default": "google",
          "options": ["google", "bing", "duckduckgo"]
        },
        "maxResults": {
          "type": "number",
          "label": "Max Results",
          "default": 10,
          "min": 1,
          "max": 100
        },
        "timeout": {
          "type": "number",
          "label": "Timeout (ms)",
          "default": 30000,
          "min": 1000,
          "max": 120000
        }
      }
    },
    "network": {
      "displayName": "Network",
      "description": "Network and connection settings",
      "settings": {
        "port": {
          "type": "number",
          "label": "Server Port",
          "default": 8080,
          "min": 1024,
          "max": 65535
        },
        "wsPort": {
          "type": "number",
          "label": "WebSocket Port",
          "default": 8081,
          "min": 1024,
          "max": 65535
        },
        "retryCount": {
          "type": "number",
          "label": "Retry Count",
          "default": 3,
          "min": 0,
          "max": 10
        }
      }
    }
  }
}
```

---

## Database Schema

### SQLite Table: settings

```sql
CREATE TABLE settings (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,          -- JSON encoded value
    type TEXT NOT NULL,           -- string, number, boolean, select
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, key)
);

CREATE TABLE settings_meta (
    id TEXT PRIMARY KEY,
    seed_version TEXT NOT NULL,
    last_seeded_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
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
    StringVal  *string            `json:"StringVal,omitempty"`
    IntVal     *int               `json:"IntVal,omitempty"`
    FloatVal   *float64           `json:"FloatVal,omitempty"`
    BoolVal    *bool              `json:"BoolVal,omitempty"`
    StringsVal []string           `json:"StringsVal,omitempty"`
    MapVal     map[string]string  `json:"MapVal,omitempty"`
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

## Go Implementation

```go
package settings

import (
    "encoding/json"
    "os"
    
    "gorm.io/gorm"
)

type Setting struct {
    ID        string `gorm:"primaryKey"`
    Category  string `gorm:"not null"`
    Key       string `gorm:"not null"`
    Value     string `gorm:"not null"` // JSON encoded
    Type      string `gorm:"not null"`
    CreatedAt time.Time
    UpdatedAt time.Time
}

type SettingsMeta struct {
    ID           string `gorm:"primaryKey"`
    SeedVersion  string `gorm:"not null"`
    LastSeededAt *time.Time
    CreatedAt    time.Time
}

type SettingsService struct {
    db       *gorm.DB
    seedPath string
}

func NewSettingsService(db *gorm.DB, seedPath string) *SettingsService {
    return &SettingsService{db: db, seedPath: seedPath}
}

// SeedFromFile loads settings from JSON seed file
func (s *SettingsService) SeedFromFile() error {
    data, readErr := pathutil.ReadFile(s.seedPath)
    if readErr != nil {
        return readErr
    }
    
    var seed SeedConfig
    if err := json.Unmarshal(data, &seed); err != nil {
        return apperror.Wrap(
            err,
            ErrSeedParseFailed,
            "parse seed file",
        ).WithPath(s.seedPath)
    }
    
    // Check if already seeded with this version
    var meta SettingsMeta
    if err := s.db.First(&meta).Error; err == nil {
        if meta.SeedVersion == seed.Version {
            return nil // Already seeded
        }
        // Version changed - merge new defaults
        return s.mergeNewDefaults(seed)
    }
    
    // First time - full seed
    return s.fullSeed(seed)
}

// GetString retrieves a string setting value
func (s *SettingsService) GetString(category, key string) apperror.Result[string] {
    var setting Setting
    err := s.db.Where("category = ? AND key = ?", category, key).First(&setting).Error
    if err != nil {
        return apperror.Fail[string](
            apperror.Wrap(
                err,
                ErrSettingNotFound,
                "setting not found",
            ),
        )
    }
    
    var sv SettingValue
    if err := json.Unmarshal([]byte(setting.Value), &sv); err != nil {
        return apperror.Fail[string](
            apperror.Wrap(
                err,
                ErrSettingTypeMismatch,
                "failed to unmarshal setting value",
            ),
        )
    }
    if sv.StringVal == nil {
        return apperror.Fail[string](
            apperror.New(
                ErrSettingTypeMismatch,
                "setting is not a string",
            ).WithContext("category", category).
                WithContext("key", key),
        )
    }
    return apperror.Succeed(*sv.StringVal)
}

// GetInt retrieves an integer setting value
func (s *SettingsService) GetInt(category, key string) apperror.Result[int] {
    var setting Setting
    err := s.db.Where("category = ? AND key = ?", category, key).First(&setting).Error
    if err != nil {
        return apperror.Fail[int](
            apperror.Wrap(err, ErrSettingNotFound, "setting not found"),
        )
    }
    
    var sv SettingValue
    if err := json.Unmarshal([]byte(setting.Value), &sv); err != nil {
        return apperror.Fail[int](
            apperror.Wrap(err, ErrSettingTypeMismatch, "failed to unmarshal setting value"),
        )
    }
    if sv.IntVal == nil {
        return apperror.Fail[int](
            apperror.New(
                ErrSettingTypeMismatch,
                "setting is not an int",
            ).WithContext("category", category).
                WithContext("key", key),
        )
    }
    return apperror.Succeed(*sv.IntVal)
}

// GetFloat retrieves a float64 setting value
func (s *SettingsService) GetFloat(category, key string) apperror.Result[float64] {
    var setting Setting
    err := s.db.Where("category = ? AND key = ?", category, key).First(&setting).Error
    if err != nil {
        return apperror.Fail[float64](
            apperror.Wrap(err, ErrSettingNotFound, "setting not found"),
        )
    }
    
    var sv SettingValue
    if err := json.Unmarshal([]byte(setting.Value), &sv); err != nil {
        return apperror.Fail[float64](
            apperror.Wrap(err, ErrSettingTypeMismatch, "failed to unmarshal setting value"),
        )
    }
    if sv.FloatVal == nil {
        return apperror.Fail[float64](
            apperror.New(
                ErrSettingTypeMismatch,
                "setting is not a float",
            ).WithContext("category", category).
                WithContext("key", key),
        )
    }
    return apperror.Succeed(*sv.FloatVal)
}

// GetBool retrieves a boolean setting value
func (s *SettingsService) GetBool(category, key string) apperror.Result[bool] {
    var setting Setting
    err := s.db.Where("category = ? AND key = ?", category, key).First(&setting).Error
    if err != nil {
        return apperror.Fail[bool](
            apperror.Wrap(err, ErrSettingNotFound, "setting not found"),
        )
    }
    
    var sv SettingValue
    if err := json.Unmarshal([]byte(setting.Value), &sv); err != nil {
        return apperror.Fail[bool](
            apperror.Wrap(err, ErrSettingTypeMismatch, "failed to unmarshal setting value"),
        )
    }
    if sv.BoolVal == nil {
        return apperror.Fail[bool](
            apperror.New(
                ErrSettingTypeMismatch,
                "setting is not a bool",
            ).WithContext("category", category).
                WithContext("key", key),
        )
    }
    return apperror.Succeed(*sv.BoolVal)
}

// Update saves a setting value using strongly-typed SettingValue
func (s *SettingsService) Update(category, key string, value SettingValue) error {
    valueJson, err := json.Marshal(value)
    if err != nil {
        return err
    }
    
    update := SettingUpdate{
        Value:     string(valueJson),
        UpdatedAt: time.Now(),
    }
    return s.db.Model(&Setting{}).
        Where("category = ? AND key = ?", category, key).
        Updates(update).Error
}

// SettingUpdate is the typed struct for GORM .Updates() calls — no map[string]interface{}
type SettingUpdate struct {
    Value     string    `gorm:"column:value"`
    UpdatedAt time.Time `gorm:"column:updated_at"`
}

// GetAll returns all settings grouped by category using typed containers
func (s *SettingsService) GetAll() apperror.Result[map[string]map[string]SettingValue] {
    var settings []Setting
    if err := s.db.Find(&settings).Error; err != nil {
        return apperror.Fail[map[string]map[string]SettingValue](
            apperror.Wrap(err, ErrSettingNotFound, "failed to retrieve settings"),
        )
    }
    
    result := make(map[string]map[string]SettingValue)
    for _, setting := range settings {
        if _, ok := result[setting.Category]; !ok {
            result[setting.Category] = make(map[string]SettingValue)
        }
        
        var sv SettingValue
        json.Unmarshal([]byte(setting.Value), &sv)
        result[setting.Category][setting.Key] = sv
    }
    
    return apperror.Succeed(result)
}

// GetTyped retrieves a setting and returns it as the specified concrete type.
// Eliminates the need for interface{} by using Go generics.
func GetTyped[T SettingConstraint](svc *SettingsService, category, key string) apperror.Result[T] {
    var zero T
    switch v := any(zero).(type) {
    case string:
        _ = v
        result := svc.GetString(category, key)
        if result.HasError() {
            return apperror.Fail[T](result.Error())
        }
        return apperror.Succeed(any(result.Value()).(T))
    case int:
        _ = v
        result := svc.GetInt(category, key)
        if result.HasError() {
            return apperror.Fail[T](result.Error())
        }
        return apperror.Succeed(any(result.Value()).(T))
    case float64:
        _ = v
        result := svc.GetFloat(category, key)
        if result.HasError() {
            return apperror.Fail[T](result.Error())
        }
        return apperror.Succeed(any(result.Value()).(T))
    case bool:
        _ = v
        result := svc.GetBool(category, key)
        if result.HasError() {
            return apperror.Fail[T](result.Error())
        }
        return apperror.Succeed(any(result.Value()).(T))
    default:
        return apperror.Fail[T](
            apperror.New(
                ErrSettingTypeUnsupported,
                "unsupported setting type",
            ),
        )
    }
}
```

---

## React Settings Page

```typescript
// pages/Settings.tsx
import { useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Settings() {
  const { settings, categories, updateSetting, isLoading, saveAll } = useSettings();
  
  if (isLoading) return <div>Loading settings...</div>;
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue={categories[0]?.key}>
        <TabsList>
          {categories.map(cat => (
            <TabsTrigger key={cat.key} value={cat.key}>
              {cat.displayName}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {categories.map(cat => (
          <TabsContent key={cat.key} value={cat.key}>
            <div className="space-y-4 mt-4">
              {cat.settings.map(setting => (
                <SettingField
                  key={setting.key}
                  setting={setting}
                  value={settings[cat.key]?.[setting.key]}
                  onChange={(value) => updateSetting(cat.key, setting.key, value)}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      
      <div className="mt-6 flex gap-4">
        <Button onClick={saveAll}>Save All</Button>
        <Button variant="outline" onClick={() => toast.info('Export coming soon')}>
          Export Settings
        </Button>
      </div>
    </div>
  );
}
```

---

## Version-Aware Updates

When version changes:

1. **Detect**: Compare `seed.version` with `settings_meta.seed_version`
2. **Merge**: Add new settings that don't exist in DB
3. **Preserve**: Keep user-modified existing settings
4. **Notify**: Show changelog modal with new settings
5. **Update**: Store new version in `settings_meta`

---

*Standard settings pattern for all CLI frontends.*
