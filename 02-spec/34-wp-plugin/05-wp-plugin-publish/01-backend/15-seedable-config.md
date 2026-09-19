# Seedable Config Architecture + Changelog Versioning

> **Version:** 2.0.0  
> **Created:** 2026-02-01  
> **Updated:** 2026-03-09  
> **Status:** Active  
> **Purpose:** Reusable pattern for version-controlled configuration with automatic changelog updates and initial seeding

---

## Summary

The **Seedable Config Architecture + Changelog Versioning** defines a pattern for managing application configuration where:

1. **First-run seeding** populates SQLite DB from `config.seed.json`
2. **Every config change updates the version**
3. **Every version change logs to CHANGELOG.md**
4. **Subsequent runs respect version** to avoid duplicate seeds

This ensures configuration is always traceable, auditable, and version-aware.

---

## Core Concepts

### 1. Configuration Files

| File | Purpose |
|------|---------|
| `config.seed.json` | Default seed values for first-time setup |
| `config.schema.json` | JSON Schema for validation |
| `config.json` | Runtime configuration (gitignored) |
| `CHANGELOG.md` | Version history of config changes |

### 2. Version Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CW CONFIG VERSION FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  config.seed.json                                                        │
│  ┌─────────────────────────────────────────┐                             │
│  │ {                                       │                             │
│  │   "version": "1.2.0",                   │ ← Source of truth           │
│  │   "categories": { ... }                 │                             │
│  │ }                                       │                             │
│  └──────────────────┬──────────────────────┘                             │
│                     │                                                    │
│                     ▼                                                    │
│  ┌─────────────────────────────────────────┐                             │
│  │        Version Change Detected?          │                             │
│  └──────────────────┬──────────────────────┘                             │
│                     │                                                    │
│         ┌───────────┴───────────┐                                        │
│         │                       │                                        │
│         ▼                       ▼                                        │
│   ┌───────────┐          ┌───────────────┐                               │
│   │    NO     │          │     YES       │                               │
│   │ Skip Seed │          │ Merge + Seed  │                               │
│   └───────────┘          └───────┬───────┘                               │
│                                  │                                        │
│                                  ▼                                        │
│                          ┌───────────────┐                               │
│                          │ Update        │                               │
│                          │ CHANGELOG.md  │                               │
│                          └───────────────┘                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## File Specifications

### config.seed.json

The seed file contains default values and metadata:

```json
{
  "$schema": "./config.schema.json",
  "Version": "1.2.0",
  "Changelog": "Added new cache settings for improved performance",
  "Categories": {
    "General": {
      "DisplayName": "General",
      "Description": "General application settings",
      "Settings": {
        "Theme": {
          "Type": "select",
          "Label": "Theme",
          "Description": "Application color theme",
          "Default": "system",
          "Options": ["light", "dark", "system", "high-contrast"]
        },
        "Language": {
          "Type": "select",
          "Label": "Language",
          "Default": "en",
          "Options": ["en", "es", "fr", "de", "zh", "ja"]
        },
        "AutoSave": {
          "Type": "boolean",
          "Label": "Auto Save",
          "Description": "Automatically save changes",
          "Default": true
        }
      }
    },
    "Cache": {
      "DisplayName": "Cache",
      "Description": "Caching configuration",
      "Version": "1.2.0",
      "AddedIn": "1.2.0",
      "Settings": {
        "Enabled": {
          "Type": "boolean",
          "Label": "Enable Cache",
          "Default": true
        },
        "MaxSizeMb": {
          "Type": "number",
          "Label": "Max Cache Size (MB)",
          "Default": 100,
          "Min": 10,
          "Max": 1000
        },
        "TtlHours": {
          "Type": "number",
          "Label": "Cache TTL (hours)",
          "Default": 24,
          "Min": 1,
          "Max": 168
        }
      }
    }
  }
}
```

### config.schema.json

JSON Schema for validation:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Application Configuration",
  "type": "object",
  "required": ["Version", "Categories"],
  "properties": {
    "Version": {
      "type": "string",
      "pattern": "^\\\\d+\\\\.\\\\d+\\\\.\\\\d+$",
      "description": "Semantic version of configuration"
    },
    "Changelog": {
      "type": "string",
      "description": "Description of changes in this version"
    },
    "Categories": {
      "type": "object",
      "additionalProperties": {
        "$ref": "#/definitions/Category"
      }
    }
  },
  "definitions": {
    "Category": {
      "type": "object",
      "required": ["DisplayName", "Settings"],
      "properties": {
        "DisplayName": { "type": "string" },
        "Description": { "type": "string" },
        "Version": { "type": "string" },
        "AddedIn": { "type": "string" },
        "Settings": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/definitions/Setting"
          }
        }
      }
    },
    "Setting": {
      "type": "object",
      "required": ["Type", "Label", "Default"],
      "properties": {
        "Type": {
          "type": "string",
          "enum": ["string", "number", "boolean", "select", "array", "object"]
        },
        "Label": { "type": "string" },
        "Description": { "type": "string" },
        "Default": {},
        "Min": { "type": "number" },
        "Max": { "type": "number" },
        "Options": { "type": "array" },
        "AddedIn": { "type": "string" },
        "DeprecatedIn": { "type": "string" }
      }
    }
  }
}
```

### CHANGELOG.md Format

```markdown
# Changelog

All notable configuration changes are documented here.

## [1.2.0] - 2026-02-01

### Added
- Cache category with Enabled, MaxSizeMb, TtlHours settings

### Changed
- Theme options now include "high-contrast"

## [1.1.0] - 2026-01-15

### Added
- Network category with port and timeout settings

## [1.0.0] - 2026-01-01

### Initial Release
- General category with Theme, Language, AutoSave
```

---

## Database Schema

### Table: config_meta

```sql
CREATE TABLE config_meta (
    id TEXT PRIMARY KEY DEFAULT 'singleton',
    seed_version TEXT NOT NULL,
    current_version TEXT NOT NULL,
    last_seeded_at DATETIME,
    changelog_updated_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table: settings

```sql
CREATE TABLE settings (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,           -- JSON encoded
    type TEXT NOT NULL,
    added_in_version TEXT,         -- Version when setting was added
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, key)
);

CREATE INDEX IdxSettingsCategory ON settings(category);
```

### Table: settings_history

```sql
CREATE TABLE settings_history (
    id TEXT PRIMARY KEY,
    setting_id TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT NOT NULL,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    changed_by TEXT,               -- user, system, seed
    version TEXT,                  -- Version at time of change
    FOREIGN KEY (setting_id) REFERENCES settings(id)
);

CREATE INDEX IdxHistorySetting ON settings_history(setting_id);
CREATE INDEX IdxHistoryChanged ON settings_history(changed_at);
```

---

## Go Implementation

### ConfigService

```go
package config

import (
    "encoding/json"
    "fmt"
    "os"
    "time"
    
    "github.com/Masterminds/semver/v3"
    "gorm.io/gorm"
)

type ConfigService struct {
    db           *gorm.DB
    seedPath     string
    changelogPath string
}

type SeedConfig struct {
    Version    string
    Changelog  string
    Categories map[string]CategoryConfig
}

type CategoryConfig struct {
    DisplayName string
    Description string
    Version     string                   `json:",omitempty"`
    AddedIn     string                   `json:",omitempty"`
    Settings    map[string]SettingConfig
}

type SettingConfig struct {
    Type        string
    Label       string
    Description string          `json:",omitempty"`
    Default     json.RawMessage
    Min         *float64        `json:",omitempty"`
    Max         *float64        `json:",omitempty"`
    Options     []string        `json:",omitempty"`
    AddedIn     string          `json:",omitempty"`
}

// SeedWithVersionCheck seeds config if version changed
func (s *ConfigService) SeedWithVersionCheck() error {
    seed, err := s.loadSeedFile()
    if err != nil {
        return appfault.Wrap(
            err,
            ErrSeedLoadFailed,
            "load seed file",
        )
    }
    
    meta, err := s.getMeta()
    if err != nil {
        // First time - full seed
        return s.fullSeed(seed)
    }
    
    // Compare versions
    currentVer, _ := semver.NewVersion(meta.SeedVersion)
    seedVer, _ := semver.NewVersion(seed.Version)
    
    if !seedVer.GreaterThan(currentVer) {
        // No version change, skip seed
        return nil
    }
    
    // Version increased - merge new settings
    if err := s.mergeSeed(seed, meta.SeedVersion); err != nil {
        return err
    }
    
    // Update changelog
    return s.updateChangelog(seed)
}

// mergeSeed adds new settings without overwriting existing
func (s *ConfigService) mergeSeed(seed SeedConfig, previousVersion string) error {
    for catKey, cat := range seed.Categories {
        for settingKey, setting := range cat.Settings {
            // Check if setting exists
            var existing Setting
            err := s.db.Where("category = ? AND key = ?", catKey, settingKey).First(&existing).Error
            
            if err == gorm.ErrRecordNotFound {
                // New setting - insert with default
                valueJson, _ := json.Marshal(setting.Default)
                newSetting := Setting{
                    Id:            generateId(),
                    Category:      catKey,
                    Key:           settingKey,
                    Value:         string(valueJson),
                    Type:          setting.Type,
                    AddedInVersion: seed.Version,
                }
                s.db.Create(&newSetting)
            }
            // Existing settings are preserved
        }
    }
    
    // Update meta
    s.db.Model(&ConfigMeta{}).Where("id = 'singleton'").Updates(ConfigMeta{
        SeedVersion:    seed.Version,
        CurrentVersion: seed.Version,
        LastSeededAt:   time.Now(),
        UpdatedAt:      time.Now(),
    })
    
    return nil
}

// updateChangelog appends version entry to CHANGELOG.md
func (s *ConfigService) updateChangelog(seed SeedConfig) error {
    if seed.Changelog == "" {
        return nil
    }
    
    entry := fmt.Sprintf("\n## [%s] - %s\n\n%s\n",
        seed.Version,
        time.Now().Format("2006-01-02"),
        seed.Changelog,
    )
    
    // Read existing changelog
    contentResult := pathutil.ReadFileIfExists(s.changelogPath)
    if contentResult.IsErr() {
        return contentResult.Err()
    }
    content := contentResult.Value()
    
    // Insert after header
    header := "# Changelog\n\nAll notable configuration changes are documented here.\n"
    
    if len(content) == 0 {
        content = []byte(header)
    }
    
    // Find insert position (after header)
    insertPos := len(header)
    if len(content) >= len(header) {
        insertPos = len(header)
    }
    
    newContent := string(content[:insertPos]) + entry + string(content[insertPos:])
    
    return pathutil.WriteFile(s.changelogPath, []byte(newContent))
}
```

---

## Version Bumping Rules

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| New category added | Minor | 1.0.0 → 1.1.0 |
| New setting added | Minor | 1.1.0 → 1.2.0 |
| Default value changed | Patch | 1.2.0 → 1.2.1 |
| Setting deprecated | Patch | 1.2.1 → 1.2.2 |
| Breaking change (setting removed) | Major | 1.2.2 → 2.0.0 |

---

## UI Integration

### Version Badge Component

```typescript
// components/VersionBadge.tsx
import { Badge } from '@/components/ui/badge';
import { useConfig } from '@/hooks/useConfig';

export function VersionBadge() {
  const { meta } = useConfig();
  
  const isNew = meta.SeedVersion !== meta.CurrentVersion;
  
  return (
    <Badge variant={isNew ? "default" : "secondary"}>
      v{meta.CurrentVersion}
      {isNew && " (updated)"}
    </Badge>
  );
}
```

### New Settings Highlight

```typescript
// Highlight settings added in current version
function SettingItem({ setting, currentVersion }: Props) {
  const isNew = setting.AddedInVersion === currentVersion;
  
  return (
    <div className={cn("setting-item", isNew && "ring-2 ring-primary")}>
      {isNew && <Badge variant="outline">New in v{CurrentVersion}</Badge>}
      {/* ... setting content */}
    </div>
  );
}
```

---

## Theme Support

### Comprehensive Theme System

The Seedable Config pattern supports a rich theme system with multiple customization options:

```json
{
  "Categories": {
    "Appearance": {
      "DisplayName": "Appearance",
      "Description": "Visual customization options",
      "Settings": {
        "Theme": {
          "Type": "select",
          "Label": "Theme",
          "Description": "Base color scheme",
          "Default": "system",
          "Options": [
            "light",
            "dark",
            "system",
            "high-contrast",
            "high-contrast-dark",
            "colorful-light",
            "colorful-dark",
            "ocean-blue",
            "ocean-dark",
            "forest-green",
            "forest-dark",
            "sunset-orange",
            "sunset-dark",
            "midnight-purple",
            "rose-pink",
            "slate-gray",
            "nord-light",
            "nord-dark",
            "solarized-light",
            "solarized-dark",
            "dracula",
            "monokai",
            "github-light",
            "github-dark"
          ]
        },
        "AccentColor": {
          "Type": "select",
          "Label": "Accent Color",
          "Description": "Primary action color",
          "Default": "blue",
          "Options": [
            "blue",
            "indigo",
            "violet",
            "purple",
            "fuchsia",
            "pink",
            "rose",
            "red",
            "orange",
            "amber",
            "yellow",
            "lime",
            "green",
            "emerald",
            "teal",
            "cyan",
            "sky"
          ]
        },
        "FontSize": {
          "Type": "select",
          "Label": "Font Size",
          "Description": "Base text size",
          "Default": "medium",
          "Options": ["x-small", "small", "medium", "large", "x-large"]
        },
        "FontFamily": {
          "Type": "select",
          "Label": "Font Family",
          "Description": "Text font style",
          "Default": "system",
          "Options": [
            "system",
            "inter",
            "roboto",
            "open-sans",
            "lato",
            "poppins",
            "source-sans",
            "jetbrains-mono",
            "fira-code"
          ]
        },
        "BorderRadius": {
          "Type": "select",
          "Label": "Border Radius",
          "Description": "Corner rounding style",
          "Default": "medium",
          "Options": ["none", "small", "medium", "large", "full"]
        },
        "AnimationSpeed": {
          "Type": "select",
          "Label": "Animation Speed",
          "Description": "UI transition speed",
          "Default": "normal",
          "Options": ["none", "reduced", "normal", "fast"]
        },
        "CompactMode": {
          "Type": "boolean",
          "Label": "Compact Mode",
          "Description": "Reduce padding and spacing",
          "Default": false
        },
        "ShowIcons": {
          "Type": "boolean",
          "Label": "Show Icons",
          "Description": "Display icons in navigation",
          "Default": true
        }
      }
    }
  }
}
```

### Theme CSS Variables

Each theme maps to CSS custom properties:

```css
/* Example: ocean-blue theme */
[data-theme="ocean-blue"] {
  --background: 200 30% 98%;
  --foreground: 200 50% 10%;
  --primary: 200 80% 50%;
  --primary-foreground: 200 10% 98%;
  --secondary: 180 40% 90%;
  --muted: 200 20% 95%;
  --accent: 180 60% 45%;
  --destructive: 0 70% 50%;
  --border: 200 20% 85%;
  --ring: 200 80% 50%;
  --radius: 0.5rem;
}

/* Example: dracula theme */
[data-theme="dracula"] {
  --background: 231 15% 18%;
  --foreground: 60 30% 96%;
  --primary: 265 89% 78%;
  --primary-foreground: 231 15% 18%;
  --secondary: 225 27% 26%;
  --muted: 232 14% 31%;
  --accent: 135 94% 65%;
  --destructive: 0 100% 67%;
  --border: 232 14% 31%;
  --ring: 265 89% 78%;
}
```

### React Theme Provider

```typescript
// hooks/useTheme.ts
import { useSettings } from './useSettings';

export function useTheme() {
  const { settings, updateSetting } = useSettings();
  
  const theme = settings?.Appearance?.Theme ?? 'system';
  const accentColor = settings?.Appearance?.AccentColor ?? 'blue';
  
  const setTheme = (newTheme: string) => {
    updateSetting('Appearance', 'Theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };
  
  const setAccentColor = (color: string) => {
    updateSetting('Appearance', 'AccentColor', color);
    document.documentElement.setAttribute('data-accent', color);
  };
  
  return { Theme: theme, AccentColor: accentColor, setTheme, setAccentColor };
}
```

---

## Integration with WP Plugin Publish

For this project, the seedable config pattern applies to:

| Config Area | Seed File Location |
|-------------|-------------------|
| Backend settings | `backend/config.seed.json` |
| Watcher settings | Included in backend seed |
| Backup settings | Included in backend seed |
| WordPress settings | Included in backend seed |

### Migration from config.json

The existing `backend/config.json` will be renamed to `config.seed.json` and enhanced with:
- Version field
- Changelog field  
- Category structure for UI rendering

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Config System | [03-config-system.md](./03-config-system.md) |
| Database Schema | [02-database-schema.md](./02-database-schema.md) |
| Settings Page UI | [../02-frontend/25-settings-page.md](../02-frontend/25-settings-page.md) |

---

*This pattern ensures all configuration changes are versioned and documented.*
