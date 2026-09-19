# 32 — Publish Service Implementation

> **Location:** `02-spec/34-wp-plugin/05-wp-plugin-publish/03-implementation/32-publish-service-impl.md`  
> **Updated:** 2026-03-09  
**Version:** 1.0.0  
> **Status:** Implementation Spec

---

## Overview

Complete Go implementation for the Publish Service. This service manages plugin publishing to WordPress sites, including validation, packaging, upload, and activation.

---

## File Structure

```
backend/internal/services/publish/
├── service.go      # Main service interface and constructor
├── pipeline.go     # Publishing pipeline orchestration
├── packager.go     # ZIP file creation
├── uploader.go     # File upload to WordPress
└── types.go        # Input/output types
```

---

## Implementation: types.go

```go
package publish

import "time"

// PublishOptions configures the publish operation
type PublishOptions struct {
	Mode         string   // "full" or "selected"
	Files        []string // files to publish (for selected mode)
	CreateBackup bool     // backup before publishing
	Activate     bool     // activate plugin after publish
	DryRun       bool     // validate without publishing
}

// PublishResult represents the outcome of a publish operation
type PublishResult struct {
	PublishId        string
	Success          bool
	PluginId         int64
	SiteId           int64
	FilesUploaded    int
	BytesTransferred int64
	BackupId         *int64        `json:",omitempty"`
	ActivationStatus string        // active, inactive, error
	Duration         int64         // milliseconds
	Stages           []StageResult
	Error            string        `json:",omitempty"`
}

// StageResult tracks individual pipeline stage outcomes
type StageResult struct {
	Name     string
	Status   string // pending, running, success, failed, skipped
	Duration int64
	Error    string `json:",omitempty"`
}

// PackageInfo describes a created plugin package
type PackageInfo struct {
	Path      string
	Size      int64
	FileCount int
	Checksum  string
	CreatedAt time.Time
}
```

---

## Implementation: service.go

```go
package publish

import (
	stdctx "context"

	"wp-plugin-publish/internal/database"
	"wp-plugin-publish/internal/logger"
	"wp-plugin-publish/internal/services/backup"
	"wp-plugin-publish/internal/services/plugin"
	"wp-plugin-publish/internal/services/sync"
	"wp-plugin-publish/internal/wordpress"
	"wp-plugin-publish/internal/ws"
)

// Service interface for publish operations
type Service interface {
	// Publishing
	Publish(context stdctx.Context, pluginId, siteId int64, opts PublishOptions) apperror.Result[*PublishResult]
	PublishToAll(context stdctx.Context, pluginId int64, opts PublishOptions) apperror.Result[[]PublishResult]

	// Packaging
	CreatePackage(context stdctx.Context, pluginId int64, files []string) apperror.Result[*PackageInfo]

	// History
	GetHistory(context stdctx.Context, pluginId int64, siteId *int64) apperror.Result[[]PublishResult]

	// Rollback
	Rollback(context stdctx.Context, pluginId, siteId, backupId int64) apperror.Result[*PublishResult]
}

// Config holds publish service configuration
type Config struct {
	Db              *database.DB
	Logger          *logger.Logger
	PluginService   plugin.Service
	BackupService   *backup.Service
	SyncService     sync.Service
	WpClientFactory func(url, user, pass string) *wordpress.Client
	TempDir         string
	WsHub           *ws.Hub
}

type serviceImpl struct {
	db              *database.DB
	log             *logger.Logger
	pluginService   plugin.Service
	backupService   *backup.Service
	syncService     sync.Service
	wpClientFactory func(url, user, pass string) *wordpress.Client
	tempDir         string
	wsHub           *ws.Hub
}

// New creates a new publish service
func New(cfg Config) Service {
	return &serviceImpl{
		db:              cfg.Db,
		log:             cfg.Logger,
		pluginService:   cfg.PluginService,
		backupService:   cfg.BackupService,
		syncService:     cfg.SyncService,
		wpClientFactory: cfg.WpClientFactory,
		tempDir:         cfg.TempDir,
		wsHub:           cfg.WsHub,
	}
}
```

---

## Implementation: pipeline.go

```go
package publish

import (
	stdctx "context"
	"fmt"
	"time"

	"wp-plugin-publish/internal/models"
	"wp-plugin-publish/internal/ws"
	"wp-plugin-publish/pkg/apperror"

	"github.com/google/uuid"
)

func (s *serviceImpl) Publish(context stdctx.Context, pluginId, siteId int64, opts PublishOptions) apperror.Result[PublishResult] {
	publishId := uuid.New().String()[:8]
	startTime := time.Now()

	s.log.Info("Starting publish", "publishId", publishId, "pluginId", pluginId, "siteId", siteId)

	result := &PublishResult{
		PublishId: publishId,
		PluginId:  pluginId,
		SiteId:    siteId,
		Stages:    make([]StageResult, 0),
	}

	// Broadcast publish started
	s.wsHub.Broadcast(ws.EventPublishStarted, ws.PublishStartedPayload{
		PublishId: publishId,
		PluginId:  pluginId,
		SiteId:    siteId,
		Mode:      opts.Mode,
	})

	// Get plugin details
	plugin, err := s.pluginService.GetById(context, pluginId)
	if err != nil {
		return s.failPublish(result, "validate", err, startTime)
	}

	// Get site details
	var site models.Site
	if err := s.db.GormDb().WithContext(context).First(&site, "Id = ?", siteId).Error; err != nil {
		return s.failPublish(result, "validate", apperror.New(
			apperror.ErrNotFound, "site not found",
		), startTime)
	}

	// Get remote slug from mapping
	var mapping models.PluginMapping
	if err := s.db.GormDb().WithContext(context).
		Where("PluginId = ? AND SiteId = ?", pluginId, siteId).
		First(&mapping).Error; err != nil {
		return s.failPublish(result, "validate", apperror.New(
			apperror.ErrNotFound, "plugin not mapped to site",
		), startTime)
	}
	remoteSlug := mapping.RemoteSlug

	// Stage 1: Validate
	result.Stages = append(result.Stages, s.runStage("validate", func() error {
		return s.pluginService.ValidatePath(context, plugin.Path)
	}))
	if result.Stages[0].Status == "failed" {
		return s.failPublish(result, "validate", apperror.New(ErrPublishStageFailed, result.Stages[0].Error), startTime)
	}

	// Stage 2: Backup (optional)
	if opts.CreateBackup {
		result.Stages = append(result.Stages, s.runStage("backup", func() error {
			backup, err := s.backupService.CreateFromRemote(context, pluginId, siteId)
			if err != nil {
				return err
			}
			result.BackupId = &backup.Id
			return nil
		}))
		if result.Stages[len(result.Stages)-1].Status == "failed" {
			s.log.Warn("Backup failed, continuing publish", "error", result.Stages[len(result.Stages)-1].Error)
		}
	}

	// Stage 3: Package
	var pkg *PackageInfo
	result.Stages = append(result.Stages, s.runStage("package", func() error {
		var err error
		pkg, err = s.CreatePackage(context, pluginId, opts.Files)
		return err
	}))
	if result.Stages[len(result.Stages)-1].Status == "failed" {
		return s.failPublish(result, "package", apperror.New(ErrPublishStageFailed, result.Stages[len(result.Stages)-1].Error), startTime)
	}

	// Dry run stops here
	if opts.DryRun {
		result.Success = true
		result.Duration = time.Since(startTime).Milliseconds()
		return result, nil
	}

	// Stage 4: Upload
	wpClient := s.wpClientFactory(site.Url, site.Username, string(site.PasswordEncrypted))
	result.Stages = append(result.Stages, s.runStage("upload", func() error {
		return s.uploadPackage(context, wpClient, pkg.Path, remoteSlug)
	}))
	if result.Stages[len(result.Stages)-1].Status == "failed" {
		return s.failPublish(result, "upload", apperror.New(ErrPublishStageFailed, result.Stages[len(result.Stages)-1].Error), startTime)
	}
	result.FilesUploaded = pkg.FileCount
	result.BytesTransferred = pkg.Size

	// Stage 5: Activate (optional)
	if opts.Activate {
		result.Stages = append(result.Stages, s.runStage("activate", func() error {
			return wpClient.ActivatePlugin(context, remoteSlug)
		}))
		if result.Stages[len(result.Stages)-1].Status == "failed" {
			result.ActivationStatus = "error"
		} else {
			result.ActivationStatus = "active"
		}
	} else {
		result.ActivationStatus = "inactive"
	}

	// Mark files as synced
	if len(opts.Files) > 0 {
		s.syncService.MarkSynced(context, pluginId, siteId, opts.Files)
	}

	// Update publish timestamp
	s.db.ExecContext(context, `
		UPDATE PluginMappings
		SET LastSyncAt = datetime('now'), SyncStatus = 'synced', UpdatedAt = datetime('now')
		WHERE PluginId = ? AND SiteId = ?
	`, pluginId, siteId)

	result.Success = true
	result.Duration = time.Since(startTime).Milliseconds()

	// Broadcast publish complete
	s.wsHub.Broadcast(ws.EventPublishComplete, ws.PublishCompletePayload{
		PublishId:     publishId,
		PluginId:      pluginId,
		SiteId:        siteId,
		Success:       true,
		FilesUploaded: result.FilesUploaded,
	})

	s.log.Info("Publish complete", "publishId", publishId, "duration", result.Duration)
	return result, nil
}

func (s *serviceImpl) runStage(name string, fn func() error) StageResult {
	start := time.Now()
	stage := StageResult{Name: name, Status: "running"}

	s.wsHub.Broadcast(ws.EventPublishProgress, ws.PublishProgressPayload{
		Stage:  name,
		Status: "running",
	})

	err := fn()
	stage.Duration = time.Since(start).Milliseconds()

	if err != nil {
		stage.Status = "failed"
		stage.Error = err.Error()
	} else {
		stage.Status = "success"
	}

	s.wsHub.Broadcast(ws.EventPublishProgress, ws.PublishProgressPayload{
		Stage:    name,
		Status:   stage.Status,
		Duration: stage.Duration,
	})

	return stage
}

func (s *serviceImpl) failPublish(result *PublishResult, stage string, err error, startTime time.Time) apperror.Result[PublishResult] {
	result.Success = false
	result.Error = err.Error()
	result.Duration = time.Since(startTime).Milliseconds()

	s.wsHub.Broadcast(ws.EventPublishFailed, ws.PublishFailedPayload{
		PublishId: result.PublishId,
		Stage:     stage,
		Error:     err.Error(),
	})

	return apperror.Fail[PublishResult](apperror.Wrap(err, apperror.ErrPublishFailed, stage))
}

func (s *serviceImpl) PublishToAll(context stdctx.Context, pluginId int64, opts PublishOptions) apperror.Result[[]PublishResult] {
	mappings, err := s.pluginService.GetMappings(context, pluginId)
	if err != nil {
		return nil, err
	}

	results := make([]PublishResult, 0, len(mappings))
	for _, m := range mappings {
		result, _ := s.Publish(context, pluginId, m.SiteId, opts)
		results = append(results, *result)
	}

	return results, nil
}

func (s *serviceImpl) GetHistory(context stdctx.Context, pluginId int64, siteId *int64) apperror.Result[[]PublishResult] {
	// TODO: Query publish history from database
	return []PublishResult{}, nil
}

func (s *serviceImpl) Rollback(context stdctx.Context, pluginId, siteId, backupId int64) apperror.Result[PublishResult] {
	// TODO: Implement rollback using backup
	return apperror.Fail[PublishResult](apperror.New(apperror.ErrNotImplemented, "rollback not yet implemented"))
}
```

---

## Implementation: packager.go

```go
package publish

import (
	"archive/zip"
	stdctx "context"
	"crypto/md5"
	"encoding/hex"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"wp-plugin-publish/pkg/apperror"
)

func (s *serviceImpl) CreatePackage(context stdctx.Context, pluginId int64, files []string) apperror.Result[PackageInfo] {
	s.log.Info("Creating package", "pluginId", pluginId, "files", len(files))

	// Get plugin details
	plugin, err := s.pluginService.GetById(context, pluginId)
	if err != nil {
		return nil, err
	}

	// Create temp zip file
	zipPath := filepath.Join(s.tempDir, fmt.Sprintf("plugin_%d_%d.zip", pluginId, time.Now().Unix()))
	zipFile, err := os.Create(zipPath)
	if err != nil {
		return nil, apperror.Wrap(
			err, apperror.ErrFileWrite, "failed to create zip file",
		)
	}
	defer zipFile.Close()

	zipWriter := zip.NewWriter(zipFile)
	defer zipWriter.Close()

	hash := md5.New()
	var totalSize int64
	var fileCount int

	// Determine which files to include
	var filesToPackage []string
	if len(files) > 0 {
		// Selected files only
		filesToPackage = files
	} else {
		// All files in plugin directory
		err = filepath.Walk(plugin.Path, func(path string, info os.FileInfo, err error) error {
			if err != nil || info.IsDir() {
				return nil
			}

			relPath, _ := filepath.Rel(plugin.Path, path)
			base := filepath.Base(path)

			// Skip hidden and excluded files
			if strings.HasPrefix(base, ".") {
				return nil
			}
			for _, exclude := range plugin.ExcludePatterns {
				if matched, _ := filepath.Match(exclude, base); matched {
					return nil
				}
			}

			filesToPackage = append(filesToPackage, relPath)
			return nil
		})
		if err != nil {
			return nil, apperror.Wrap(
				err, apperror.ErrDirRead, "failed to walk plugin directory",
			)
		}
	}

	// Add files to zip
	pluginDirName := filepath.Base(plugin.Path)
	for _, relPath := range filesToPackage {
		fullPath := filepath.Join(plugin.Path, relPath)
		info, statErr := pathutil.StatFile(fullPath)
		if statErr != nil {
			continue
		}

		// Create zip entry with plugin directory prefix
		zipPath := filepath.Join(pluginDirName, relPath)
		header, err := zip.FileInfoHeader(info)
		if err != nil {
			continue
		}
		header.Name = zipPath
		header.Method = zip.Deflate

		writer, err := zipWriter.CreateHeader(header)
		if err != nil {
			continue
		}

		file, openErr := pathutil.OpenFile(fullPath)
		if openErr != nil {
			continue
		}

		// Write to both zip and hash
		multiWriter := io.MultiWriter(writer, hash)
		written, _ := io.Copy(multiWriter, file)
		file.Close()

		totalSize += written
		fileCount++
	}

	zipWriter.Close()
	zipFile.Close()

	// Get final zip size
	zipSize := pathutil.FileSize(zipPath)

	pkg := &PackageInfo{
		Path:      zipPath,
		Size:      zipSize,
		FileCount: fileCount,
		Checksum:  hex.EncodeToString(hash.Sum(nil)),
		CreatedAt: time.Now(),
	}

	s.log.Info("Package created", "path", zipPath, "size", pkg.Size, "files", fileCount)
	return pkg, nil
}
```

---

## Implementation: uploader.go

```go
package publish

import (
	stdctx "context"
	"os"

	"wp-plugin-publish/internal/wordpress"
	"wp-plugin-publish/pkg/apperror"
)

func (s *serviceImpl) uploadPackage(context stdctx.Context, client *wordpress.Client, zipPath, remoteSlug string) error {
	s.log.Info("Uploading package", "path", zipPath, "slug", remoteSlug)

	// Read zip file
	data, readErr := pathutil.ReadFile(zipPath)
	if readErr != nil {
		return apperror.Wrap(
			readErr, apperror.ErrFileRead, "failed to read package",
		)
	}

	// Upload via WordPress REST API
	err = client.UploadPlugin(context, remoteSlug, data)
	if err != nil {
		return apperror.Wrap(
			err, apperror.ErrRemoteUpload, "failed to upload to WordPress",
		)
	}

	// Clean up temp file
	pathutil.Remove(zipPath)

	s.log.Info("Package uploaded successfully", "slug", remoteSlug)
	return nil
}
```

---

## API Endpoints

| Method | Endpoint | Handler |
|--------|----------|---------|
| POST | `/api/publish/:pluginId/:siteId` | Publish to single site |
| POST | `/api/publish/:pluginId` | Publish to all mapped sites |
| GET | `/api/publish/history/:pluginId` | Get publish history |
| POST | `/api/publish/rollback` | Rollback to backup |

---

*See also: [33-watcher-service-impl.md](33-watcher-service-impl.md)*
