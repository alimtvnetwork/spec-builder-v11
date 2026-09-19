# 30 — Plugin Service Implementation

> **Location:** `02-spec/34-wp-plugin/05-wp-plugin-publish/03-implementation/30-plugin-service-impl.md`  
> **Updated:** 2026-03-09  
**Version:** 1.0.0  
> **Status:** Implementation Spec

---

## Overview

Complete Go implementation for the Plugin Service. This service manages local plugin directories, including registration, file scanning, hash calculation, and site mappings.

---

## File Structure

```
backend/internal/services/plugin/
├── service.go      # Main service interface and constructor
├── crud.go         # CRUD operations (List, Get, Create, Update, Delete)
├── scanner.go      # Directory scanning and validation
├── hasher.go       # Hash calculation for change detection
├── mappings.go     # Plugin-site mapping operations
└── types.go        # Input/output types
```

---

## Implementation: types.go

```go
package plugin

import "time"

// CreateInput holds data for creating a plugin
type CreateInput struct {
	Name            string   `validate:"required,max=255"`
	Path            string   `validate:"required,max=4096"`
	WatchEnabled    bool
	ExcludePatterns []string
}

// UpdateInput holds data for updating a plugin
type UpdateInput struct {
	Name            *string   `json:",omitempty" validate:"omitempty,max=255"`
	Path            *string   `json:",omitempty" validate:"omitempty,max=4096"`
	WatchEnabled    *bool     `json:",omitempty"`
	ExcludePatterns *[]string `json:",omitempty"`
}

// CreateMappingInput holds data for creating a plugin-site mapping
type CreateMappingInput struct {
	PluginId   int64  `validate:"required"`
	SiteId     int64  `validate:"required"`
	RemoteSlug string `validate:"required,max=255"`
}

// ScanResult represents the result of a directory scan
type ScanResult struct {
	Path        string
	IsValid     bool
	PluginName  string     `json:",omitempty"`
	Version     string     `json:",omitempty"`
	MainFile    string     `json:",omitempty"`
	FileCount   int
	TotalSize   int64
	Files       []FileInfo `json:",omitempty"`
	Error       string     `json:",omitempty"`
}

// FileInfo holds metadata about a single file
type FileInfo struct {
	Path        string
	Size        int64
	Hash        string
	ModifiedAt  time.Time
	IsDirectory bool
}
```

---

## Implementation: service.go

```go
package plugin

import (
	stdctx "context"

	"wp-plugin-publish/internal/database"
	"wp-plugin-publish/internal/logger"
	"wp-plugin-publish/internal/models"
)

// Service interface for plugin operations
type Service interface {
	// CRUD operations
	List(context stdctx.Context) appfault.ResultSlice[models.Plugin]
	GetById(context stdctx.Context, id int64) appfault.Result[*models.Plugin]
	Create(context stdctx.Context, input CreateInput) appfault.Result[*models.Plugin]
	Update(context stdctx.Context, id int64, input UpdateInput) appfault.Result[*models.Plugin]
	Delete(context stdctx.Context, id int64) *appfault.AppError

	// Directory scanning
	ScanDirectory(context stdctx.Context, path string) appfault.Result[*ScanResult]
	ValidatePath(context stdctx.Context, path string) *appfault.AppError
	RefreshFileCount(context stdctx.Context, id int64) *appfault.AppError

	// Mappings
	GetMappings(context stdctx.Context, pluginId int64) appfault.ResultSlice[models.PluginMapping]
	CreateMapping(context stdctx.Context, input CreateMappingInput) appfault.Result[*models.PluginMapping]
	DeleteMapping(context stdctx.Context, mappingId int64) *appfault.AppError
	GetMappingsBySite(context stdctx.Context, siteId int64) appfault.ResultSlice[models.PluginMapping]
}

// Config holds service configuration
type Config struct {
	DB     *database.DB
	Logger *logger.Logger
}

type serviceImpl struct {
	db  *database.DB
	log *logger.Logger
}

// New creates a new plugin service instance
func New(cfg Config) Service {
	return &serviceImpl{
		db:  cfg.DB,
		log: cfg.Logger,
	}
}
```

---

## Implementation: crud.go

```go
package plugin

import (
	stdctx "context"
	"encoding/json"
	"strings"
	"time"

	"wp-plugin-publish/internal/models"
	"wp-plugin-publish/pkg/appfault"

	"gorm.io/gorm"
)

func (s *serviceImpl) List(context stdctx.Context) appfault.ResultSlice[models.Plugin] {
	s.log.Debug("Listing all plugins")

	var plugins []models.Plugin
	if err := s.db.GormDb().WithContext(context).Order("Name ASC").Find(&plugins).Error; err != nil {
		return nil, appfault.Wrap(
			err, appfault.ErrDatabaseQuery, "failed to list plugins",
		)
	}

	// Load mappings for each plugin
	for i := range plugins {
		plugins[i].Mappings, _ = s.GetMappings(context, plugins[i].Id)
	}

	return plugins, nil
}

func (s *serviceImpl) GetById(context stdctx.Context, id int64) appfault.Result[*models.Plugin] {
	s.log.Debug("Getting plugin by id", "pluginId", id)

	var p models.Plugin
	if err := s.db.GormDb().WithContext(context).First(&p, "Id = ?", id).Error; err != nil {
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

	p.Mappings, _ = s.GetMappings(context, p.Id)
	return &p, nil
}

func (s *serviceImpl) Create(context stdctx.Context, input CreateInput) appfault.Result[*models.Plugin] {
	s.log.Info("Creating plugin", "name", input.Name, "path", input.Path)

	// Validate path exists and is a valid plugin directory
	if err := s.ValidatePath(context, input.Path); err != nil {
		return nil, err
	}

	// Check for duplicate path
	var count int64
	s.db.GormDb().WithContext(context).Model(&models.Plugin{}).Where("Path = ?", input.Path).Count(&count)
	if count > 0 {
		return nil, appfault.New(
			appfault.ErrDuplicate, "plugin path already registered",
		).
			WithContext("path", input.Path)
	}

	// Scan directory to get file count
	scan, _ := s.ScanDirectory(context, input.Path)
	fileCount := 0
	if scan != nil {
		fileCount = scan.FileCount
	}

	// Encode exclude patterns as JSON
	excludeJson, _ := json.Marshal(input.ExcludePatterns)

	now := time.Now()
	p := models.Plugin{
		Name:            input.Name,
		Path:            input.Path,
		WatchEnabled:    input.WatchEnabled,
		ExcludePatterns: string(excludeJson),
		FileCount:       fileCount,
		LastScannedAt:   &now,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	if err := s.db.GormDb().WithContext(context).Create(&p).Error; err != nil {
		return nil, appfault.Wrap(
			err, appfault.ErrDatabaseExec, "failed to create plugin",
		)
	}

	s.log.Info("Plugin created", "pluginId", p.Id, "name", input.Name)
	return s.GetById(context, p.Id)
}

func (s *serviceImpl) Update(context stdctx.Context, id int64, input UpdateInput) appfault.Result[*models.Plugin] {
	s.log.Info("Updating plugin", "pluginId", id)

	// Verify plugin exists
	existing, err := s.GetById(context, id)
	if err != nil {
		return nil, err
	}

	// Apply updates to existing model
	if input.Name != nil {
		existing.Name = *input.Name
	}
	if input.Path != nil {
		if err := s.ValidatePath(context, *input.Path); err != nil {
			return nil, err
		}
		existing.Path = *input.Path
	}
	if input.WatchEnabled != nil {
		existing.WatchEnabled = *input.WatchEnabled
	}
	if input.ExcludePatterns != nil {
		excludeJson, _ := json.Marshal(*input.ExcludePatterns)
		existing.ExcludePatterns = string(excludeJson)
	}
	existing.UpdatedAt = time.Now()

	if err := s.db.GormDb().WithContext(context).Save(existing).Error; err != nil {
		return nil, appfault.Wrap(
			err, appfault.ErrDatabaseExec, "failed to update plugin",
		)
	}

	return s.GetById(context, id)
}

func (s *serviceImpl) Delete(context stdctx.Context, id int64) error {
	s.log.Info("Deleting plugin", "pluginId", id)

	// Verify plugin exists
	if _, err := s.GetById(context, id); err != nil {
		return err
	}

	// Delete mappings first (foreign key)
	if err := s.db.GormDb().WithContext(context).Where("PluginId = ?", id).Delete(&models.PluginMapping{}).Error; err != nil {
		return appfault.Wrap(
			err, appfault.ErrDatabaseExec, "failed to delete plugin mappings",
		)
	}

	// Delete plugin
	if err := s.db.GormDb().WithContext(context).Delete(&models.Plugin{}, "Id = ?", id).Error; err != nil {
		return appfault.Wrap(
			err, appfault.ErrDatabaseExec, "failed to delete plugin",
		)
	}

	s.log.Info("Plugin deleted", "pluginId", id)
	return nil
}
```

---

## Implementation: scanner.go

```go
package plugin

import (
	"bufio"
	stdctx "context"
	"crypto/md5"
	"encoding/hex"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"wp-plugin-publish/pkg/appfault"
)

func (s *serviceImpl) ScanDirectory(context stdctx.Context, path string) appfault.Result[ScanResult] {
	s.log.Debug("Scanning directory", "path", path)

	scan := &ScanResult{
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
			fileInfo.Hash, _ = s.calculateFileHash(filePath)
			scan.TotalSize += info.Size()
			scan.FileCount++
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
		"files", scan.FileCount,
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

func (s *serviceImpl) RefreshFileCount(context stdctx.Context, id int64) error {
	plugin, err := s.GetById(context, id)
	if err != nil {
		return err
	}

	scan, err := s.ScanDirectory(context, plugin.Path)
	if err != nil {
		return err
	}

	now := time.Now()
	return s.db.GormDb().WithContext(context).Model(&models.Plugin{}).Where("Id = ?", id).Updates(models.Plugin{
		FileCount:     scan.FileCount,
		LastScannedAt: &now,
		UpdatedAt:     now,
	}).Error
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

// calculateFileHash computes MD5 hash of a file
func (s *serviceImpl) calculateFileHash(path string) appfault.Result[string] {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	hash := md5.New()
	if _, err := io.Copy(hash, file); err != nil {
		return "", err
	}

	return hex.EncodeToString(hash.Sum(nil)), nil
}
```

---

## Implementation: mappings.go

```go
package plugin

import (
	stdctx "context"
	"time"

	"wp-plugin-publish/internal/models"
	"wp-plugin-publish/pkg/appfault"

	"gorm.io/gorm"
)

func (s *serviceImpl) GetMappings(context stdctx.Context, pluginId int64) appfault.ResultSlice[models.PluginMapping] {
	var mappings []models.PluginMapping
	if err := s.db.GormDb().WithContext(context).
		Joins("JOIN Sites s ON s.Id = PluginMappings.SiteId").
		Where("PluginMappings.PluginId = ?", pluginId).
		Order("s.Name ASC").
		Find(&mappings).Error; err != nil {
		return nil, appfault.Wrap(
			err, appfault.ErrDatabaseQuery, "failed to get mappings",
		)
	}

	return mappings, nil
}

func (s *serviceImpl) GetMappingsBySite(context stdctx.Context, siteId int64) appfault.ResultSlice[models.PluginMapping] {
	var mappings []models.PluginMapping
	if err := s.db.GormDb().WithContext(context).
		Joins("JOIN Plugins p ON p.Id = PluginMappings.PluginId").
		Where("PluginMappings.SiteId = ?", siteId).
		Order("p.Name ASC").
		Find(&mappings).Error; err != nil {
		return nil, appfault.Wrap(
			err, appfault.ErrDatabaseQuery, "failed to get mappings by site",
		)
	}

	return mappings, nil
}

func (s *serviceImpl) CreateMapping(context stdctx.Context, input CreateMappingInput) appfault.Result[*models.PluginMapping] {
	s.log.Info("Creating plugin mapping", "pluginId", input.PluginId, "siteId", input.SiteId)

	// Check for duplicate mapping
	var count int64
	s.db.GormDb().WithContext(context).Model(&models.PluginMapping{}).
		Where("PluginId = ? AND SiteId = ?", input.PluginId, input.SiteId).Count(&count)
	if count > 0 {
		return nil, appfault.New(
			appfault.ErrDuplicate, "mapping already exists",
		).
			WithContext("pluginId", input.PluginId).
			WithContext("siteId", input.SiteId)
	}

	now := time.Now()
	m := models.PluginMapping{
		PluginId:   input.PluginId,
		SiteId:     input.SiteId,
		RemoteSlug: input.RemoteSlug,
		SyncStatus: "pending",
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	if err := s.db.GormDb().WithContext(context).Create(&m).Error; err != nil {
		return nil, appfault.Wrap(
			err, appfault.ErrDatabaseExec, "failed to create mapping",
		)
	}

	// Reload with site info
	s.db.GormDb().WithContext(context).Preload("Site").First(&m, "Id = ?", m.Id)
	return &m, nil
}

func (s *serviceImpl) DeleteMapping(context stdctx.Context, mappingId int64) error {
	s.log.Info("Deleting plugin mapping", "mappingId", mappingId)

	result := s.db.GormDb().WithContext(context).Delete(&models.PluginMapping{}, "Id = ?", mappingId)
	if result.Error != nil {
		return appfault.Wrap(
			result.Error, appfault.ErrDatabaseExec, "failed to delete mapping",
		)
	}

	if result.RowsAffected == 0 {
		return appfault.New(
			appfault.ErrNotFound, "mapping not found",
		)
	}

	return nil
}
```

---

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS Plugin (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Path TEXT NOT NULL UNIQUE,
    WatchEnabled INTEGER DEFAULT 0,
    ExcludePatterns TEXT DEFAULT '[]',
    FileCount INTEGER DEFAULT 0,
    LastScannedAt TEXT,
    CreatedAt TEXT NOT NULL,
    UpdatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS PluginMapping (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    PluginId INTEGER NOT NULL,
    SiteId INTEGER NOT NULL,
    RemoteSlug TEXT NOT NULL,
    SyncStatus TEXT DEFAULT 'pending',
    LastSyncAt TEXT,
    LastBackupAt TEXT,
    CreatedAt TEXT NOT NULL,
    UpdatedAt TEXT NOT NULL,
    FOREIGN KEY (PluginId) REFERENCES Plugin(Id),
    FOREIGN KEY (SiteId) REFERENCES Site(Id),
    UNIQUE(PluginId, SiteId)
);

CREATE INDEX IF NOT EXISTS IdxPluginPath ON Plugin(Path);
CREATE INDEX IF NOT EXISTS IdxMappingPlugin ON PluginMapping(PluginId);
CREATE INDEX IF NOT EXISTS IdxMappingSite ON PluginMapping(SiteId);
```

---

## API Endpoints

| Method | Endpoint | Handler |
|--------|----------|---------|
| GET | `/api/plugins` | List all plugins |
| GET | `/api/plugins/:id` | Get plugin by ID |
| POST | `/api/plugins` | Create plugin |
| PUT | `/api/plugins/:id` | Update plugin |
| DELETE | `/api/plugins/:id` | Delete plugin |
| POST | `/api/plugins/scan` | Scan directory |
| GET | `/api/plugins/:id/mappings` | Get mappings |
| POST | `/api/plugins/:id/mappings` | Create mapping |
| DELETE | `/api/mappings/:id` | Delete mapping |

---

*See also: [31-sync-service-impl.md](31-sync-service-impl.md)*
