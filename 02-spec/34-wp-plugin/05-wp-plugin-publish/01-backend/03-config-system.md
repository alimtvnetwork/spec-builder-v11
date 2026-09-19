# 03 — Config System


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

> **Parent:** [00-overview.md](../00-overview.md)  
> **Status:** Draft

---

## Overview

The configuration system uses a **JSON seed file** for initial setup and version-controlled defaults, while **SQLite** serves as the runtime data store.

### Key Principles

1. **JSON is for seeding only** — Not read at runtime after initial seed
2. **SQLite is the source of truth** — All runtime reads come from the database
3. **Version-controlled seeding** — Changes to config.json trigger re-seeding of new data
4. **No duplicate entries** — Seeding skips existing records (matched by unique keys)

---

## Config File Structure

### config.json

```json
{
  "Version": 3,
  "Settings": {
    "Port": 8080,
    "WatchDebounceMs": 500,
    "BackupRetentionDays": 30,
    "MaxBackupsPerPlugin": 10,
    "TempDirectory": ".temp",
    "BackupDirectory": "backups",
    "LogLevel": "info"
  },
  "Sites": [
    {
      "Name": "Production Site",
      "Url": "https://example.com",
      "Username": "admin",
      "AppPassword": ""
    }
  ],
  "Plugins": [
    {
      "Name": "My Plugin",
      "LocalPath": "/path/to/my-plugin",
      "RemoteSlug": "my-plugin",
      "SiteName": "Production Site"
    }
  ]
}
```

---

## Version-Based Seeding

### How It Works

```
┌─────────────────────────────────────────────────────────┐
│                    Application Start                     │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Load config.json     │
                │  Read file version    │
                └───────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Get DB seed_version  │
                │  from AppConfig       │
                └───────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │  file_version > db_version? │
              └─────────────────────────────┘
                     │              │
                    Yes             No
                     │              │
                     ▼              ▼
          ┌──────────────────┐   ┌──────────────┐
          │  Seed new data   │   │  Skip seed   │
          │  (skip existing) │   │              │
          └──────────────────┘   └──────────────┘
                     │              │
                     ▼              ▼
          ┌──────────────────┐   ┌──────────────┐
          │  Update db       │   │  Continue    │
          │  seed_version    │   │  startup     │
          └──────────────────┘   └──────────────┘
```

### Implementation

```go
// internal/config/seed.go
package config

import (
    "encoding/json"
    "os"
    "time"
    
    "wp-plugin-publish/internal/models"
    "wp-plugin-publish/pkg/appfault"
    
    "gorm.io/gorm"
    "gorm.io/gorm/clause"
)

type SeedConfig struct {
    Version  int
    Settings Settings
    Sites    []SiteSeed
    Plugins  []PluginSeed
}

type Settings struct {
    Port                int
    WatchDebounceMs     int
    BackupRetentionDays int
    MaxBackupsPerPlugin int
    TempDirectory       string
    BackupDirectory     string
    LogLevel            string
}

type SiteSeed struct {
    Name        string
    Url         string
    Username    string
    AppPassword string
}

type PluginSeed struct {
    Name       string
    LocalPath  string
    RemoteSlug string
    SiteName   string  // References site by name
}

func SeedIfNeeded(db *gorm.DB, configPath string) error {
    // Load config file
    isConfigExists := pathutil.Exists(configPath)
    if !isConfigExists {
        return nil  // No config file, skip seeding
    }
    
    data, readErr := pathutil.ReadFile(configPath)
    if readErr != nil {
        return readErr
    }
    
    var cfg SeedConfig
    if err := json.Unmarshal(data, &cfg); err != nil {
        return appfault.Wrap(
            err, appfault.ErrConfigParse, "failed to parse config file",
        )
    }
    
    // Get current seed version from DB
    var appConfig models.AppConfig
    result := db.First(&appConfig, "Key = ?", "SeedVersion")
    dbVersion := 0
    if result.Error == nil {
        dbVersion = appConfig.ValueInt()
    }
    
    // Skip if already seeded with this version
    if cfg.Version <= dbVersion {
        return nil
    }
    
    // Seed settings
    if err := seedSettings(db, cfg.Settings); err != nil {
        return err
    }
    
    // Seed sites (skip existing by URL)
    siteMap := make(map[string]int64)  // name -> id
    for _, site := range cfg.Sites {
        id, err := seedSite(db, site)
        if err != nil {
            return err
        }
        siteMap[site.Name] = id
    }
    
    // Seed plugins (skip existing by LocalPath + SiteId)
    for _, plugin := range cfg.Plugins {
        siteId, ok := siteMap[plugin.SiteName]
        if !ok {
            continue  // Site not found, skip
        }
        if err := seedPlugin(db, plugin, siteId); err != nil {
            return err
        }
    }
    
    // Update seed version
    now := time.Now()
    db.Clauses(clause.OnConflict{
        Columns:   []clause.Column{{Name: "Key"}},
        DoUpdates: clause.AssignmentColumns([]string{"Value", "UpdatedAt"}),
    }).Create(&models.AppConfig{
        Key:       "SeedVersion",
        Value:     fmt.Sprintf("%d", cfg.Version),
        UpdatedAt: now,
    })
    
    return nil
}

func seedSite(db *gorm.DB, site SiteSeed) appfault.Result[int64] {
    // Check if exists
    var existing models.Site
    if err := db.First(&existing, "Url = ?", site.Url).Error; err == nil {
        return existing.Id, nil  // Already exists
    }
    
    // Insert new site
    newSite := models.Site{
        Name:        site.Name,
        Url:         site.Url,
        Username:    site.Username,
        AppPassword: site.AppPassword,
        IsActive:    true,
    }
    if err := db.Create(&newSite).Error; err != nil {
        return 0, appfault.Wrap(
            err, appfault.ErrDatabaseExec, "failed to insert site",
        )
    }
    
    return newSite.Id, nil
}

func seedPlugin(db *gorm.DB, plugin PluginSeed, siteId int64) error {
    // Check if exists
    var count int64
    db.Model(&models.Plugin{}).Where("LocalPath = ? AND SiteId = ?", plugin.LocalPath, siteId).Count(&count)
    if count > 0 {
        return nil  // Already exists
    }
    
    // Insert new plugin
    newPlugin := models.Plugin{
        Name:       plugin.Name,
        LocalPath:  plugin.LocalPath,
        RemoteSlug: plugin.RemoteSlug,
        SiteId:     siteId,
        IsActive:   true,
    }
    if err := db.Create(&newPlugin).Error; err != nil {
        return appfault.Wrap(
            err, appfault.ErrDatabaseExec, "failed to insert plugin",
        )
    }
    
    return nil
}
```

---

## Settings Management

Settings are stored in AppConfig table as key-value pairs:

```go
// internal/config/settings.go
func seedSettings(db *gorm.DB, settings Settings) error {
    pairs := []struct{ key, value string }{
        {"Port", fmt.Sprintf("%d", settings.Port)},
        {"WatchDebounceMs", fmt.Sprintf("%d", settings.WatchDebounceMs)},
        {"BackupRetentionDays", fmt.Sprintf("%d", settings.BackupRetentionDays)},
        {"MaxBackupsPerPlugin", fmt.Sprintf("%d", settings.MaxBackupsPerPlugin)},
        {"TempDirectory", settings.TempDirectory},
        {"BackupDirectory", settings.BackupDirectory},
        {"LogLevel", settings.LogLevel},
    }
    
    for _, p := range pairs {
        // Only insert if not exists (don't overwrite user changes)
        var count int64
        db.Model(&models.AppConfig{}).Where("Key = ?", p.key).Count(&count)
        if count == 0 {
            db.Create(&models.AppConfig{
                Key:       p.key,
                Value:     p.value,
                UpdatedAt: time.Now(),
            })
        }
    }
    
    return nil
}

func GetSetting(db *gorm.DB, key string) appfault.Result[string] {
    var config models.AppConfig
    if err := db.First(&config, "Key = ?", key).Error; err != nil {
        return "", appfault.Wrap(
            err, appfault.ErrDatabaseQuery, "failed to get setting: "+key,
        )
    }
    return config.Value, nil
}

func SetSetting(db *gorm.DB, key, value string) error {
    now := time.Now()
    result := db.Model(&models.AppConfig{}).Where("Key = ?", key).Updates(models.AppConfig{
        Value:     value,
        UpdatedAt: now,
    })
    if result.RowsAffected == 0 {
        db.Create(&models.AppConfig{Key: key, Value: value, UpdatedAt: now})
    }
    if result.Error != nil {
        return appfault.Wrap(
            result.Error, appfault.ErrDatabaseExec, "failed to set setting: "+key,
        )
    }
    return nil
}
```

---

## Workflow Example

### First Run (Fresh Install)

1. User copies `config.json.example` to `config.json`
2. User edits with their sites and plugin paths
3. User sets `version: 1`
4. Application starts, reads `version: 1`
5. DB has `seed_version: 0`
6. All sites and plugins are seeded
7. DB updated to `seed_version: 1`

### Adding a New Site via Config

1. User adds new site to `config.json`
2. User increments to `version: 2`
3. Application restarts
4. DB has `seed_version: 1`
5. New site is seeded (existing sites skipped)
6. DB updated to `seed_version: 2`

### User Edits via UI

1. User changes site password via React UI
2. Change saved directly to SQLite
3. `config.json` not touched
4. Re-seeding won't overwrite (unique constraint)

---

## Next Document

See [04-site-service.md](./04-site-service.md) for site management implementation.
