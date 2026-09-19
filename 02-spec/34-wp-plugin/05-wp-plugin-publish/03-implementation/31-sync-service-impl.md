# 31 — Sync Service Implementation

> **Location:** `02-spec/34-wp-plugin/05-wp-plugin-publish/03-implementation/31-sync-service-impl.md`  
> **Updated:** 2026-03-12  
**Version:** 1.0.0  
> **Status:** Implementation Spec

---

## Overview

Complete Go implementation for the Sync Service. This service compares local plugin files with remote WordPress installations and manages file change detection.

---

## File Structure

```
backend/internal/services/sync/
├── service.go      # Main service interface and constructor
├── check.go        # Sync checking operations
├── compare.go      # Local vs remote file comparison
├── changes.go      # File change management
└── types.go        # Input/output types
```

---

## Implementation: types.go

```go
package sync

import "time"

// SyncResult represents the result of a sync check
type SyncResult struct {
	PluginId      int64        
	SiteId        int64        
	PluginName    string       
	SiteName      string       
	Status        string       // synced, pending, error
	TotalFiles    int          
	ChangedFiles  int          
	AddedFiles    int          
	ModifiedFiles int          
	DeletedFiles  int          
	Changes       []FileChange 
	CheckedAt     time.Time    
	Error         string       `json:",omitempty"`
}

// FileChange represents a detected file difference
type FileChange struct {
	Path        string    
	ChangeType  string    // added, modified, deleted
	LocalHash   string    `json:",omitempty"`
	RemoteHash  string    `json:",omitempty"`
	LocalSize   int64     `json:",omitempty"`
	RemoteSize  int64     `json:",omitempty"`
	LocalMTime  time.Time `json:",omitempty"`
	RemoteMTime time.Time `json:",omitempty"`
}

// SyncOptions configures sync behavior
type SyncOptions struct {
	IncludeUntracked bool 
	ForceFullCheck   bool 
}

// BatchSyncResult holds results for multiple sites
type BatchSyncResult struct {
	PluginId int64        
	Results  []SyncResult 
	Summary  SyncSummary  
}

// SyncSummary aggregates sync status across sites
type SyncSummary struct {
	TotalSites    int 
	SyncedSites   int 
	PendingSites  int 
	ErrorSites    int 
	TotalChanges  int 
}
```

---

## Implementation: service.go

```go
package sync

import (
	stdctx "context"

	"wp-plugin-publish/internal/database"
	"wp-plugin-publish/internal/logger"
	"wp-plugin-publish/internal/models"
	"wp-plugin-publish/internal/services/plugin"
	"wp-plugin-publish/internal/wordpress"
	"wp-plugin-publish/internal/ws"
)

// Service interface for sync operations
type Service interface {
	// Sync checking
	CheckSync(context stdctx.Context, pluginId, siteId int64) appfault.Result[*SyncResult]
	CheckAllSites(context stdctx.Context, pluginId int64) appfault.Result[*BatchSyncResult]
	CheckAllPlugins(context stdctx.Context) appfault.ResultSlice[SyncResult]

	// File change management
	GetFileChanges(context stdctx.Context, pluginId, siteId int64) appfault.ResultSlice[models.FileChange]
	RecordFileChange(context stdctx.Context, change *models.FileChange) *appfault.AppError
	MarkSynced(context stdctx.Context, pluginId, siteId int64, files []string) *appfault.AppError
	ClearChanges(context stdctx.Context, pluginId int64) *appfault.AppError
}

// Config holds sync service configuration
type Config struct {
	Db              *database.DB
	Logger          *logger.Logger
	PluginService   plugin.Service
	WpClientFactory func(url, user, pass string) *wordpress.Client
	WsHub           *ws.Hub
}

type serviceImpl struct {
	db              *database.DB
	log             *logger.Logger
	pluginService   plugin.Service
	wpClientFactory func(url, user, pass string) *wordpress.Client
	wsHub           *ws.Hub
}

// New creates a new sync service
func New(cfg Config) Service {
	return &serviceImpl{
		db:              cfg.Db,
		log:             cfg.Logger,
		pluginService:   cfg.PluginService,
		wpClientFactory: cfg.WpClientFactory,
		wsHub:           cfg.WsHub,
	}
}
```

---

## Implementation: check.go

```go
package sync

import (
	stdctx "context"
	"time"

	"wp-plugin-publish/internal/models"
	"wp-plugin-publish/internal/ws"
	"wp-plugin-publish/pkg/appfault"
)

func (s *serviceImpl) CheckSync(context stdctx.Context, pluginId, siteId int64) appfault.Result[SyncResult] {
	s.log.Info("Checking sync status", "pluginId", pluginId, "siteId", siteId)

	// Broadcast sync started event
	s.wsHub.Broadcast(ws.EventSyncStarted, ws.SyncStartedPayload{
		PluginId: pluginId,
		SiteId:   siteId,
	})

	result := &SyncResult{
		PluginId:  pluginId,
		SiteId:    siteId,
		CheckedAt: time.Now(),
		Changes:   []FileChange{},
	}

	// Get plugin details
	plugin, err := s.pluginService.GetById(context, pluginId)
	if err != nil {
		result.Status = "error"
		result.Error = err.Error()
		return result, err
	}
	result.PluginName = plugin.Name

	// Get site details
	var site models.Site
	if err := s.db.GormDb().WithContext(context).First(&site, "Id = ?", siteId).Error; err != nil {
		result.Status = "error"
		result.Error = "site not found"
		return result, appfault.New(
			appfault.ErrNotFound, "site not found",
		)
	}
	result.SiteName = site.Name

	// Get mapping to find remote slug
	var mapping models.PluginMapping
	if err := s.db.GormDb().WithContext(context).
		Where("PluginId = ? AND SiteId = ?", pluginId, siteId).
		First(&mapping).Error; err != nil {
		result.Status = "error"
		result.Error = "plugin not mapped to site"
		return result, appfault.New(
			appfault.ErrNotFound, "mapping not found",
		)
	}
	remoteSlug := mapping.RemoteSlug

	// Scan local plugin directory
	localScan, err := s.pluginService.ScanDirectory(context, plugin.Path)
	if err != nil {
		result.Status = "error"
		result.Error = err.Error()
		return result, err
	}
	result.TotalFiles = localScan.FileCount

	// Create WordPress client and get remote files
	wpClient := s.wpClientFactory(site.Url, site.Username, string(site.PasswordEncrypted))
	remoteFiles, err := wpClient.GetPluginFiles(context, remoteSlug)
	if err != nil {
		// If remote plugin doesn't exist, all files are "added"
		s.log.Warn("Could not fetch remote files", "error", err)
		for _, f := range localScan.Files {
			if !f.IsDirectory {
				result.Changes = append(result.Changes, FileChange{
					Path:       f.Path,
					ChangeType: "added",
					LocalHash:  f.Hash,
					LocalSize:  f.Size,
					LocalMTime: f.ModifiedAt,
				})
				result.AddedFiles++
			}
		}
		result.ChangedFiles = result.AddedFiles
		result.Status = "pending"
	} else {
		// Compare local and remote files
		result.Changes = s.compareFiles(localScan.Files, remoteFiles)
		for _, c := range result.Changes {
			switch c.ChangeType {
			case "added":
				result.AddedFiles++
			case "modified":
				result.ModifiedFiles++
			case "deleted":
				result.DeletedFiles++
			}
		}
		result.ChangedFiles = len(result.Changes)

		if result.ChangedFiles == 0 {
			result.Status = "synced"
		} else {
			result.Status = "pending"
		}
	}

	// Update mapping sync status
	s.db.ExecContext(context, `
		UPDATE PluginMappings 
		SET SyncStatus = ?, UpdatedAt = datetime('now')
		WHERE PluginId = ? AND SiteId = ?
	`, result.Status, pluginId, siteId)

	// Broadcast sync complete event
	s.wsHub.Broadcast(ws.EventSyncComplete, ws.SyncCompletePayload{
		PluginId:     pluginId,
		SiteId:       siteId,
		Status:       result.Status,
		ChangedFiles: result.ChangedFiles,
	})

	return result, nil
}

func (s *serviceImpl) CheckAllSites(context stdctx.Context, pluginId int64) appfault.Result[BatchSyncResult] {
	s.log.Info("Checking sync for all sites", "pluginId", pluginId)

	// Get all mappings for this plugin
	mappings, err := s.pluginService.GetMappings(context, pluginId)
	if err != nil {
		return appfault.Fail[BatchSyncResult](err)
	}

	batch := &BatchSyncResult{
		PluginId: pluginId,
		Results:  make([]SyncResult, 0, len(mappings)),
		Summary:  SyncSummary{TotalSites: len(mappings)},
	}

	for _, m := range mappings {
		result, err := s.CheckSync(context, pluginId, m.SiteId)
		if err != nil {
			batch.Summary.ErrorSites++
		} else {
			switch result.Status {
			case "synced":
				batch.Summary.SyncedSites++
			case "pending":
				batch.Summary.PendingSites++
			default:
				batch.Summary.ErrorSites++
			}
			batch.Summary.TotalChanges += result.ChangedFiles
		}
		batch.Results = append(batch.Results, *result)
	}

	return batch, nil
}

func (s *serviceImpl) CheckAllPlugins(context stdctx.Context) appfault.ResultSlice[SyncResult] {
	s.log.Info("Checking sync for all plugins")

	// Get all mappings
	var mappings []models.PluginMapping
	if err := s.db.GormDb().WithContext(context).Find(&mappings).Error; err != nil {
		return nil, err
	}

	var results []SyncResult
	for _, m := range mappings {
		result, _ := s.CheckSync(context, m.PluginId, m.SiteId)
		if result != nil {
			results = append(results, *result)
		}
	}

	return results, nil
}
```

---

## Implementation: compare.go

```go
package sync

import (
	"wp-plugin-publish/internal/services/plugin"
	"wp-plugin-publish/internal/wordpress"
)

// compareFiles compares local files with remote files and returns differences
func (s *serviceImpl) compareFiles(local []plugin.FileInfo, remote []wordpress.RemoteFile) []FileChange {
	var changes []FileChange

	// Build map of remote files by path
	remoteMap := make(map[string]wordpress.RemoteFile)
	for _, f := range remote {
		remoteMap[f.Path] = f
	}

	// Check local files against remote
	localPaths := make(map[string]bool)
	for _, lf := range local {
		if lf.IsDirectory {
			continue
		}
		localPaths[lf.Path] = true

		if rf, exists := remoteMap[lf.Path]; exists {
			// File exists on both - check if modified
			if lf.Hash != rf.Hash {
				changes = append(changes, FileChange{
					Path:        lf.Path,
					ChangeType:  "modified",
					LocalHash:   lf.Hash,
					RemoteHash:  rf.Hash,
					LocalSize:   lf.Size,
					RemoteSize:  rf.Size,
					LocalMTime:  lf.ModifiedAt,
					RemoteMTime: rf.ModifiedAt,
				})
			}
		} else {
			// File only exists locally - needs to be added
			changes = append(changes, FileChange{
				Path:       lf.Path,
				ChangeType: "added",
				LocalHash:  lf.Hash,
				LocalSize:  lf.Size,
				LocalMTime: lf.ModifiedAt,
			})
		}
	}

	// Check for deleted files (exist on remote but not local)
	for _, rf := range remote {
		if !localPaths[rf.Path] {
			changes = append(changes, FileChange{
				Path:        rf.Path,
				ChangeType:  "deleted",
				RemoteHash:  rf.Hash,
				RemoteSize:  rf.Size,
				RemoteMTime: rf.ModifiedAt,
			})
		}
	}

	return changes
}
```

---

## Implementation: changes.go

```go
package sync

import (
	stdctx "context"
	"time"

	"wp-plugin-publish/internal/models"
	"wp-plugin-publish/pkg/appfault"

	"gorm.io/gorm"
)

func (s *serviceImpl) GetFileChanges(context stdctx.Context, pluginId, siteId int64) appfault.ResultSlice[models.FileChange] {
	var changes []models.FileChange
	if err := s.db.GormDb().WithContext(context).
		Where("PluginId = ? AND SyncedAt IS NULL", pluginId).
		Order("DetectedAt DESC").
		Find(&changes).Error; err != nil {
		return nil, appfault.Wrap(
			err, appfault.ErrDatabaseQuery, "failed to get file changes",
		)
	}

	return changes, nil
}

func (s *serviceImpl) RecordFileChange(context stdctx.Context, change *models.FileChange) error {
	// Check if change already exists for this file
	var existing models.FileChange
	err := s.db.GormDb().WithContext(context).
		Where("PluginId = ? AND FilePath = ? AND SyncedAt IS NULL", change.PluginId, change.FilePath).
		First(&existing).Error

	if err == gorm.ErrRecordNotFound {
		// Insert new change
		change.DetectedAt = time.Now()
		return s.db.GormDb().WithContext(context).Create(change).Error
	} else if err == nil {
		// Update existing change
		existing.ChangeType = change.ChangeType
		existing.LocalHash = change.LocalHash
		existing.LocalModifiedAt = change.LocalModifiedAt
		existing.DetectedAt = time.Now()
		return s.db.GormDb().WithContext(context).Save(&existing).Error
	}

	return err
}

func (s *serviceImpl) MarkSynced(context stdctx.Context, pluginId, siteId int64, files []string) error {
	s.log.Info("Marking files as synced", "pluginId", pluginId, "siteId", siteId, "files", len(files))

	now := time.Now()
	for _, path := range files {
		if err := s.db.GormDb().WithContext(context).
			Model(&models.FileChange{}).
			Where("PluginId = ? AND FilePath = ? AND SyncedAt IS NULL", pluginId, path).
			Update("SyncedAt", now).Error; err != nil {
			return appfault.Wrap(
				err, appfault.ErrDatabaseExec, "failed to mark file synced",
			)
		}
	}

	// Update mapping sync status
	return s.db.GormDb().WithContext(context).
		Model(&models.PluginMapping{}).
		Where("PluginId = ? AND SiteId = ?", pluginId, siteId).
		Updates(models.PluginMapping{
			SyncStatus: "synced",
			LastSyncAt: &now,
			UpdatedAt:  now,
		}).Error
}

func (s *serviceImpl) ClearChanges(context stdctx.Context, pluginId int64) error {
	return s.db.GormDb().WithContext(context).Where("PluginId = ?", pluginId).Delete(&models.FileChange{}).Error
}
```

---

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS FileChange (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    PluginId INTEGER NOT NULL,
    FilePath TEXT NOT NULL,
    ChangeType TEXT NOT NULL, -- added, modified, deleted
    LocalHash TEXT,
    RemoteHash TEXT,
    LocalModifiedAt TEXT,
    DetectedAt TEXT NOT NULL,
    SyncedAt TEXT,
    FOREIGN KEY (PluginId) REFERENCES Plugin(Id)
);

CREATE INDEX IF NOT EXISTS IdxChangePlugin ON FileChange(PluginId);
CREATE INDEX IF NOT EXISTS IdxChangeSynced ON FileChange(SyncedAt);
```

---

## API Endpoints

| Method | Endpoint | Handler |
|--------|----------|---------|
| GET | `/api/sync/check/:pluginId/:siteId` | Check sync status |
| GET | `/api/sync/check/:pluginId` | Check all sites for plugin |
| GET | `/api/sync/check` | Check all mappings |
| GET | `/api/sync/changes/:pluginId/:siteId` | Get file changes |
| POST | `/api/sync/mark-synced` | Mark files as synced |

---

*See also: [32-publish-service-impl.md](32-publish-service-impl.md)*
