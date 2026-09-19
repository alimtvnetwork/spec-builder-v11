# 05 — Plugin Service


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

> **Parent:** [00-overview.md](../00-overview.md)  
> **Status:** Draft

---

## Overview

The Plugin Service manages local plugin directories, including registration, file scanning, hash calculation, and mapping to remote WordPress sites.

---

## Interface

```go
// internal/services/plugin/service.go
package plugin

import (
    stdctx "context"
    
    "wp-plugin-publish/internal/models"
)

type Service interface {
    // CRUD operations
    List(context stdctx.Context) appfault.Result[[]models.Plugin]
    ListBySite(context stdctx.Context, siteId int64) appfault.Result[[]models.Plugin]
    GetById(context stdctx.Context, id int64) appfault.Result[*models.Plugin]
    Create(context stdctx.Context, input CreateInput) appfault.Result[*models.Plugin]
    Update(context stdctx.Context, id int64, input UpdateInput) appfault.Result[*models.Plugin]
    Delete(context stdctx.Context, id int64) *appfault.AppError
    
    // Directory scanning
    ScanDirectory(context stdctx.Context, path string) appfault.Result[*DirectoryScan]
    ValidatePath(context stdctx.Context, path string) *appfault.AppError
    
    // Hash management
    CalculateHash(context stdctx.Context, id int64) appfault.Result[string]
    UpdateHash(context stdctx.Context, id int64, hash string) *appfault.AppError
    
    // Watcher management
    SetWatching(context stdctx.Context, id int64, watching bool) *appfault.AppError
    GetWatchedPlugins(context stdctx.Context) appfault.Result[[]models.Plugin]
    
    // Status
    UpdateLastPublished(context stdctx.Context, id int64) *appfault.AppError
}
```

---

## Data Types

### Plugin Model

```go
// internal/models/plugin.go
package models

import "time"

type Plugin struct {
    Id              int64      
    Name            string     
    LocalPath       string     
    RemoteSlug      string     
    SiteId          int64      
    IsActive        bool       
    IsWatching      bool       
    LastPublishedAt *time.Time `json:",omitempty"`
    LastHash        string     `json:",omitempty"`
    CreatedAt       time.Time  
    UpdatedAt       time.Time  
    
    // Joined data
    Site            *Site      `json:",omitempty"`
}

// PluginWithStatus includes sync and file status
type PluginWithStatus struct {
    Plugin
    PendingChanges  int    
    TotalFiles      int    
    TotalSize       int64  
    RemoteVersion   string `json:",omitempty"`
    LocalVersion    string `json:",omitempty"`
    IsSynced        bool   
}
```

### Input Types

```go
// internal/services/plugin/types.go
package plugin

type CreateInput struct {
    Name       string `validate:"required,max=255"`
    LocalPath  string `validate:"required,max=4096"`
    RemoteSlug string `validate:"required,max=255,lowercase"`
    SiteId     int64  `validate:"required"`
}

type UpdateInput struct {
    Name       *string `json:",omitempty" validate:"omitempty,max=255"`
    LocalPath  *string `json:",omitempty" validate:"omitempty,max=4096"`
    RemoteSlug *string `json:",omitempty" validate:"omitempty,max=255,lowercase"`
    IsActive   *bool   `json:",omitempty"`
}

type DirectoryScan struct {
    Path        string     
    IsValid     bool       
    PluginName  string     `json:",omitempty"`
    Version     string     `json:",omitempty"`
    MainFile    string     `json:",omitempty"`
    Files       []FileInfo 
    TotalSize   int64      
    Error       string     `json:",omitempty"`
}

type FileInfo struct {
    Path         string    
    Size         int64     
    Hash         string    
    ModifiedAt   time.Time 
    IsDirectory  bool      
}
```

---

## Implementation

### Service Constructor

```go
// internal/services/plugin/service.go
package plugin

import (
    "wp-plugin-publish/internal/logger"
    "wp-plugin-publish/internal/services/site"
    
    "gorm.io/gorm"
)

type serviceImpl struct {
    db          *gorm.DB
    siteService site.Service
    log         *logger.Logger
}

func New(db *gorm.DB, siteService site.Service, log *logger.Logger) Service {
    return &serviceImpl{
        db:          db,
        siteService: siteService,
        log:         log,
    }
}
```

### CRUD Operations

```go
// internal/services/plugin/crud.go
package plugin

import (
    stdctx "context"
    "strings"
    "time"
    
    "wp-plugin-publish/internal/models"
    "wp-plugin-publish/pkg/appfault"
    
    "gorm.io/gorm"
)

func (s *serviceImpl) List(context stdctx.Context) appfault.Result[[]models.Plugin] {
    s.log.Debug("Listing all plugins")
    
    var plugins []models.Plugin
    if err := s.db.WithContext(context).Preload("Site").Order("Name ASC").Find(&plugins).Error; err != nil {
        return nil, appfault.Wrap(
            err, appfault.ErrDatabaseQuery, "failed to list plugins",
        )
    }
    
    return plugins, nil
}

func (s *serviceImpl) ListBySite(context stdctx.Context, siteId int64) appfault.Result[[]models.Plugin] {
    s.log.Debug("Listing plugins by site", "siteId", siteId)
    
    var plugins []models.Plugin
    if err := s.db.WithContext(context).Preload("Site").Where("SiteId = ?", siteId).Order("Name ASC").Find(&plugins).Error; err != nil {
        return nil, appfault.Wrap(
            err, appfault.ErrDatabaseQuery, "failed to list plugins by site",
        )
    }
    
    return plugins, nil
}

func (s *serviceImpl) GetById(context stdctx.Context, id int64) appfault.Result[*models.Plugin] {
    s.log.Debug("Getting plugin by id", "pluginId", id)
    
    var plugin models.Plugin
    if err := s.db.WithContext(context).Preload("Site").First(&plugin, "Id = ?", id).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            return nil, appfault.New(
                appfault.ErrNotFound, "plugin not found",
            ).
                WithContext("pluginId", id)
        }
        return nil, appfault.Wrap(
            err, appfault.ErrDatabaseQuery, "failed to get plugin",
        )
    }
    
    return &plugin, nil
}

func (s *serviceImpl) Create(context stdctx.Context, input CreateInput) appfault.Result[*models.Plugin] {
    s.log.Info("Creating plugin", "name", input.Name, "path", input.LocalPath)
    
    // Validate input
    if err := s.validateCreateInput(context, input); err != nil {
        return nil, err
    }
    
    // Verify site exists
    if _, err := s.siteService.GetById(context, input.SiteId); err != nil {
        return nil, err
    }
    
    // Check for duplicate path + site combo
    var count int64
    s.db.WithContext(context).Model(&models.Plugin{}).Where("LocalPath = ? AND SiteId = ?", input.LocalPath, input.SiteId).Count(&count)
    if count > 0 {
        return nil, appfault.New(
            appfault.ErrDuplicate, "plugin already registered for this site",
        ).
            WithContext("path", input.LocalPath).
            WithContext("siteId", input.SiteId)
    }
    
    // Validate directory exists and is a valid plugin
    if err := s.ValidatePath(context, input.LocalPath); err != nil {
        return nil, err
    }
    
    // Calculate initial hash
    hash, _ := s.calculateDirectoryHash(input.LocalPath)
    
    now := time.Now()
    plugin := models.Plugin{
        Name:       input.Name,
        LocalPath:  input.LocalPath,
        RemoteSlug: strings.ToLower(input.RemoteSlug),
        SiteId:     input.SiteId,
        IsActive:   true,
        IsWatching: false,
        LastHash:   hash,
        CreatedAt:  now,
        UpdatedAt:  now,
    }
    
    if err := s.db.WithContext(context).Create(&plugin).Error; err != nil {
        return nil, appfault.Wrap(
            err, appfault.ErrDatabaseExec, "failed to create plugin",
        )
    }
    
    s.log.Info("Plugin created", "pluginId", plugin.Id, "name", input.Name)
    return s.GetById(context, plugin.Id)
}

func (s *serviceImpl) Delete(context stdctx.Context, id int64) error {
    s.log.Info("Deleting plugin", "pluginId", id)
    
    // Verify plugin exists
    if _, err := s.GetById(context, id); err != nil {
        return err
    }
    
    if err := s.db.WithContext(context).Delete(&models.Plugin{}, "Id = ?", id).Error; err != nil {
        return appfault.Wrap(
            err, appfault.ErrDatabaseExec, "failed to delete plugin",
        )
    }
    
    s.log.Info("Plugin deleted", "pluginId", id)
    return nil
}
```

### Directory Scanning

```go
// internal/services/plugin/scanner.go
package plugin

import (
    "bufio"
    stdctx "context"
    "os"
    "path/filepath"
    "regexp"
    "strings"
    
    "wp-plugin-publish/pkg/appfault"
)

func (s *serviceImpl) ScanDirectory(context stdctx.Context, path string) appfault.Result[DirectoryScan] {
    s.log.Debug("Scanning directory", "path", path)
    
    scan := &DirectoryScan{
        Path:    path,
        IsValid: false,
        Files:   []FileInfo{},
    }
    
    // Check if directory exists
    isDirExists := pathutil.Exists(path)
    if !isDirExists {
        scan.Error = "directory does not exist"
        return scan, nil
    }

    if err != nil {
        return nil, appfault.Wrap(
            err, appfault.ErrDirRead, "failed to stat directory",
        )
    }

    if info.IsFile() {
        scan.Error = "path is not a directory"
        return scan, nil
    }
    
    // Find main plugin file
    fileResult := s.findMainPluginFile(path)
    if fileResult.HasError() {
        scan.Error = fileResult.Error().Message
        return scan, nil
    }
    
    outcome := fileResult.Value()
    scan.IsValid = true
    scan.MainFile = outcome.FileName
    scan.PluginName = outcome.PluginName
    scan.Version = outcome.Version
    
    // Walk directory and collect files
    err = filepath.Walk(path, func(filePath string, info os.FileInfo, err error) error {
        if err != nil {
            return nil // Skip inaccessible files
        }
        
        // Get relative path
        relPath, _ := filepath.Rel(path, filePath)
        if relPath == "." {
            return nil
        }
        
        // Skip hidden files and common ignored directories
        base := filepath.Base(filePath)
        if strings.HasPrefix(base, ".") || base == "node_modules" || base == "vendor" {
            if info.IsDir() {
                return filepath.SkipDir
            }
            return nil
        }
        
        fileInfo := FileInfo{
            Path:        relPath,
            Size:        info.Size(),
            ModifiedAt:  info.ModTime(),
            IsDirectory: info.IsDir(),
        }
        
        if info.IsFile() {
            fileInfo.Hash, _ = calculateFileHash(filePath)
            scan.TotalSize += info.Size()
        }
        
        scan.Files = append(scan.Files, fileInfo)
        return nil
    })
    
    if err != nil {
        return nil, appfault.Wrap(
            err, appfault.ErrDirRead, "failed to scan directory",
        )
    }
    
    s.log.Info("Directory scanned",
        "path", path,
        "pluginName", pluginName,
        "files", len(scan.Files),
        "size", scan.TotalSize,
    )
    
    return scan, nil
}

func (s *serviceImpl) ValidatePath(context stdctx.Context, path string) error {
    scan, err := s.ScanDirectory(context, path)
    if err != nil {
        return err
    }
    
    if !scan.IsValid {
        return appfault.New(appfault.ErrPathInvalid, scan.Error).
            WithContext("path", path)
    }
    
    return nil
}

// PluginFileOutcome holds the result of locating the main plugin PHP file
type PluginFileOutcome struct {
    FileName   string
    PluginName string
    Version    string
}

// findMainPluginFile locates the main plugin PHP file with the plugin header
func (s *serviceImpl) findMainPluginFile(path string) appfault.Result[PluginFileOutcome] {
    entries, err := os.ReadDir(path)
    if err != nil {
        return appfault.ResultErr[PluginFileOutcome](
            appfault.Wrap(
                err, appfault.ErrDirRead, "failed to read plugin directory",
            ),
        )
    }
    
    pluginNameRegex := regexp.MustCompile(`Plugin Name:\s*(.+)`)
    versionRegex := regexp.MustCompile(`Version:\s*(.+)`)
    
    for _, entry := range entries {
        if entry.IsDir() || stringutil.IsMissingSuffix(entry.Name(), ".php") {
            continue
        }
        
        filePath := filepath.Join(path, entry.Name())
        file, err := os.Open(filePath)
        if err != nil {
            continue
        }
        
        scanner := bufio.NewScanner(file)
        lineCount := 0
        var pluginName, version string
        
        for scanner.Scan() && lineCount < 30 {
            line := scanner.Text()
            lineCount++
            
            if matches := pluginNameRegex.FindStringSubmatch(line); len(matches) > 1 {
                pluginName = strings.TrimSpace(matches[1])
            }
            if matches := versionRegex.FindStringSubmatch(line); len(matches) > 1 {
                version = strings.TrimSpace(matches[1])
            }
        }
        file.Close()
        
        if pluginName != "" {
            return appfault.ResultOk(PluginFileOutcome{
                FileName:   entry.Name(),
                PluginName: pluginName,
                Version:    version,
            })
        }
    }
    
    return appfault.ResultErr[PluginFileOutcome](appfault.New(appfault.ErrPathInvalid, 
        "no valid WordPress plugin file found (missing Plugin Name header)"))
}
```

### Hash Calculation

```go
// internal/services/plugin/hasher.go
package plugin

import (
    stdctx "context"
    "crypto/sha256"
    "encoding/hex"
    "io"
    "os"
    "path/filepath"
    "sort"
    "strings"
    
    "wp-plugin-publish/pkg/appfault"
)

func (s *serviceImpl) CalculateHash(context stdctx.Context, id int64) appfault.Result[string] {
    plugin, err := s.GetById(context, id)
    if err != nil {
        return "", err
    }
    
    return s.calculateDirectoryHash(plugin.LocalPath)
}

// PluginHashUpdate is a typed GORM update struct
type PluginHashUpdate struct {
    LastHash  string    `gorm:"column:LastHash"`
    UpdatedAt time.Time `gorm:"column:UpdatedAt"`
}

func (s *serviceImpl) UpdateHash(context stdctx.Context, id int64, hash string) error {
    now := time.Now()
    if err := s.db.WithContext(context).Model(&models.Plugin{}).Where("Id = ?", id).
        Updates(PluginHashUpdate{LastHash: hash, UpdatedAt: now}).Error; err != nil {
        return appfault.Wrap(
            err, appfault.ErrDatabaseExec, "failed to update plugin hash",
        )
    }
    return nil
}

func (s *serviceImpl) calculateDirectoryHash(path string) appfault.Result[string] {
    hasher := sha256.New()
    
    // Collect all file hashes in sorted order for deterministic output
    var fileHashes []string
    
    err := filepath.Walk(path, func(filePath string, info os.FileInfo, err error) error {
        if err != nil || info.IsDir() {
            return nil
        }
        
        // Skip hidden files
        if strings.HasPrefix(filepath.Base(filePath), ".") {
            return nil
        }
        
        relPath, _ := filepath.Rel(path, filePath)
        fileHash, err := calculateFileHash(filePath)
        if err != nil {
            return nil // Skip files we can't read
        }
        
        fileHashes = append(fileHashes, relPath+":"+fileHash)
        return nil
    })
    
    if err != nil {
        return "", appfault.Wrap(
            err, appfault.ErrDirRead, "failed to walk directory",
        )
    }
    
    // Sort for deterministic ordering
    sort.Strings(fileHashes)
    
    for _, fh := range fileHashes {
        hasher.Write([]byte(fh))
    }
    
    return hex.EncodeToString(hasher.Sum(nil)), nil
}

func calculateFileHash(path string) appfault.Result[string] {
    file, err := os.Open(path)
    if err != nil {
        return "", err
    }
    defer file.Close()
    
    hasher := sha256.New()
    if _, err := io.Copy(hasher, file); err != nil {
        return "", err
    }
    
    return hex.EncodeToString(hasher.Sum(nil)), nil
}
```

### Watcher Management

```go
// internal/services/plugin/watcher.go
package plugin

import (
    stdctx "context"
    
    "wp-plugin-publish/internal/models"
    "wp-plugin-publish/pkg/appfault"
)

// PluginWatchingUpdate is a typed GORM update struct
type PluginWatchingUpdate struct {
    IsWatching bool      `gorm:"column:IsWatching"`
    UpdatedAt  time.Time `gorm:"column:UpdatedAt"`
}

func (s *serviceImpl) SetWatching(context stdctx.Context, id int64, watching bool) error {
    s.log.Info("Setting plugin watching status", "pluginId", id, "watching", watching)
    
    now := time.Now()
    if err := s.db.WithContext(context).Model(&models.Plugin{}).Where("Id = ?", id).
        Updates(PluginWatchingUpdate{IsWatching: watching, UpdatedAt: now}).Error; err != nil {
        return appfault.Wrap(
            err, appfault.ErrDatabaseExec, "failed to update watching status",
        )
    }
    
    return nil
}

func (s *serviceImpl) GetWatchedPlugins(context stdctx.Context) appfault.Result[[]models.Plugin] {
    s.log.Debug("Getting watched plugins")
    
    var plugins []models.Plugin
    if err := s.db.WithContext(context).Preload("Site").
        Where("IsWatching = ? AND IsActive = ?", 1, 1).
        Order("Name ASC").
        Find(&plugins).Error; err != nil {
        return nil, appfault.Wrap(
            err, appfault.ErrDatabaseQuery, "failed to get watched plugins",
        )
    }
    
    return plugins, nil
}

// PluginPublishedUpdate is a typed GORM update struct
type PluginPublishedUpdate struct {
    LastPublishedAt time.Time `gorm:"column:LastPublishedAt"`
    UpdatedAt       time.Time `gorm:"column:UpdatedAt"`
}

func (s *serviceImpl) UpdateLastPublished(context stdctx.Context, id int64) error {
    now := time.Now()
    if err := s.db.WithContext(context).Model(&models.Plugin{}).Where("Id = ?", id).
        Updates(PluginPublishedUpdate{LastPublishedAt: now, UpdatedAt: now}).Error; err != nil {
        return appfault.Wrap(
            err, appfault.ErrDatabaseExec, "failed to update last published",
        )
    }
    return nil
}
```

### Validation

```go
// internal/services/plugin/validator.go
package plugin

import (
    stdctx "context"
    "path/filepath"
    "regexp"
    "strings"
    
    "wp-plugin-publish/pkg/appfault"
)

var slugRegex = regexp.MustCompile(`^[a-z0-9-]+$`)

func (s *serviceImpl) validateCreateInput(context stdctx.Context, input CreateInput) error {
    if strings.TrimSpace(input.Name) == "" {
        return appfault.New(
            appfault.ErrValidationEmpty, "plugin name is required",
        )
    }
    
    if len(input.Name) > 255 {
        return appfault.New(
            appfault.ErrValidationLength, "plugin name must be 255 characters or less",
        )
    }
    
    if strings.TrimSpace(input.LocalPath) == "" {
        return appfault.New(
            appfault.ErrValidationEmpty, "local path is required",
        )
    }
    
    // Must be absolute path
    if pathutil.IsRelativePath(input.LocalPath) {
        return appfault.New(
            appfault.ErrValidationPath, "local path must be absolute",
        )
    }
    
    if len(input.LocalPath) > 4096 {
        return appfault.New(
            appfault.ErrValidationLength, "local path must be 4096 characters or less",
        )
    }
    
    if strings.TrimSpace(input.RemoteSlug) == "" {
        return appfault.New(
            appfault.ErrValidationEmpty, "remote slug is required",
        )
    }
    
    slug := strings.ToLower(strings.TrimSpace(input.RemoteSlug))
    if !slugRegex.MatchString(slug) {
        return appfault.New(appfault.ErrValidationFormat, 
            "remote slug must be lowercase with only letters, numbers, and hyphens")
    }
    
    if len(input.RemoteSlug) > 255 {
        return appfault.New(
            appfault.ErrValidationLength, "remote slug must be 255 characters or less",
        )
    }
    
    if input.SiteId <= 0 {
        return appfault.New(
            appfault.ErrValidationEmpty, "site id is required",
        )
    }
    
    return nil
}
```

---

## Error Scenarios

| Scenario | Error Code | HTTP Status |
|----------|------------|-------------|
| Plugin not found | E2005 | 404 |
| Duplicate plugin+site | E2006 | 409 |
| Path not found | E4009 | 400 |
| Invalid plugin directory | E4008 | 400 |
| Invalid slug format | E6006 | 400 |

---

## Next Document

See [06-file-watcher.md](./06-file-watcher.md) for file change detection.
