# 33 — File Watcher Service Implementation

> **Location:** `spec/30-wp-plugin/05-wp-plugin-publish/03-implementation/33-watcher-service-impl.md`  
> **Updated:** 2026-03-12  
**Version:** 1.0.0  
> **Status:** Implementation Spec

---

## Overview

**Hybrid Mode Implementation**: The File Watcher Service uses an event-driven approach instead of constant polling. Scans are triggered only by:
1. **Git Pull** - Automatic scan after commits are pulled
2. **Manual Trigger** - User clicks "Refresh" button in UI

This is more efficient than polling every N seconds since it only runs when changes are expected.

---

## File Structure

```
backend/internal/services/watcher/
├── service.go      # Main service interface and constructor
├── scanner.go      # Directory scanning with hash comparison
└── types.go        # Types and configuration
```

---

## Design: No Polling Mode

```
┌─────────────────────────────────────────────────────────────┐
│                    Hybrid Watcher Mode                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Trigger Sources:                                            │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │   Git Pull      │    │  Manual Refresh │                 │
│  │  (auto-trigger) │    │   (UI button)   │                 │
│  └────────┬────────┘    └────────┬────────┘                 │
│           │                       │                          │
│           └───────────┬───────────┘                          │
│                       ▼                                      │
│              ┌─────────────────┐                             │
│              │   Scan Plugin   │                             │
│              │   Directory     │                             │
│              └────────┬────────┘                             │
│                       │                                      │
│                       ▼                                      │
│              ┌─────────────────┐                             │
│              │ Detect Changes  │                             │
│              │ (hash compare)  │                             │
│              └────────┬────────┘                             │
│                       │                                      │
│                       ▼                                      │
│              ┌─────────────────┐                             │
│              │  Broadcast via  │                             │
│              │   WebSocket     │                             │
│              └─────────────────┘                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation: types.go

```go
package watcher

import "time"

// FileChange represents a detected file modification
type FileChange struct {
	Path       string
	ChangeType string    // created, modified, deleted, renamed
	OldPath    string    `json:",omitempty"`
	Hash       string    `json:",omitempty"`
	Size       int64     `json:",omitempty"`
	ModTime    time.Time `json:",omitempty"`
}

// ScanResult contains the outcome of a directory scan
type ScanResult struct {
	PluginId     int64
	Path         string
	ScanTime     time.Time
	DurationMs   int64
	FilesScanned int
	Changes      []FileChange
	TriggerType  string // "git_pull" or "manual"
}

// fileInfo holds cached file metadata for change detection
type fileInfo struct {
	ModTime int64
	Size    int64
	Hash    string
}

// pluginScanCache stores the last known state of a plugin's files
type pluginScanCache struct {
	pluginId int64
	path     string
	excludes []string
	lastScan map[string]fileInfo
}
```

---

## Implementation: service.go

```go
package watcher

import (
	stdctx "context"
	"sync"

	"wp-plugin-publish/internal/database"
	"wp-plugin-publish/internal/logger"
	"wp-plugin-publish/internal/services/plugin"
	syncSvc "wp-plugin-publish/internal/services/sync"
	"wp-plugin-publish/internal/ws"
)

// Service interface for file scanning (no polling - event-driven)
type Service interface {
	// Manual scan - triggered by user clicking refresh
	TriggerScan(context stdctx.Context, pluginId int64) apperror.Result[*ScanResult]
	
	// Git-triggered scan - called after successful git pull
	ScanAfterGitPull(context stdctx.Context, pluginId int64) apperror.Result[*ScanResult]
	
	// Batch operations
	ScanAll(context stdctx.Context) apperror.Result[[]ScanResult]
	
	// Cache management
	InitializeCache(context stdctx.Context, pluginId int64) *apperror.AppError
	ClearCache(pluginId int64)
	GetCachedPlugins() []int64
}

// Config holds watcher configuration
type Config struct {
	Db            *database.DB
	Logger        *logger.Logger
	PluginService plugin.Service
	SyncService   syncSvc.Service
	WsHub         *ws.Hub
}

type serviceImpl struct {
	db            *database.DB
	log           *logger.Logger
	pluginService plugin.Service
	syncService   syncSvc.Service
	wsHub         *ws.Hub
	cache         map[int64]*pluginScanCache
	mu            sync.RWMutex
}

// New creates a new watcher service (no polling goroutines)
func New(cfg Config) Service {
	return &serviceImpl{
		db:            cfg.Db,
		log:           cfg.Logger,
		pluginService: cfg.PluginService,
		syncService:   cfg.SyncService,
		wsHub:         cfg.WsHub,
		cache:         make(map[int64]*pluginScanCache),
	}
}

// InitializeCache loads the current file state for a plugin
// Call this on app startup or when adding a new plugin
func (s *serviceImpl) InitializeCache(context stdctx.Context, pluginId int64) error {
	plugin, err := s.pluginService.GetById(context, pluginId)
	if err != nil {
		return err
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	cache := &pluginScanCache{
		pluginId: pluginId,
		path:     plugin.Path,
		excludes: plugin.ExcludePatterns,
		lastScan: make(map[string]fileInfo),
	}

	// Perform initial scan to populate cache (no change detection)
	s.populateCache(cache)
	s.cache[pluginId] = cache

	s.log.Info("Initialized file cache", "pluginId", pluginId, "files", len(cache.lastScan))
	return nil
}

// TriggerScan performs a manual scan (user clicked refresh)
func (s *serviceImpl) TriggerScan(context stdctx.Context, pluginId int64) apperror.Result[ScanResult] {
	return s.performScan(context, pluginId, "manual")
}

// ScanAfterGitPull performs a scan after git pull (automatic)
func (s *serviceImpl) ScanAfterGitPull(context stdctx.Context, pluginId int64) apperror.Result[ScanResult] {
	return s.performScan(context, pluginId, "git_pull")
}

// ScanAll scans all cached plugins
func (s *serviceImpl) ScanAll(context stdctx.Context) apperror.Result[[]ScanResult] {
	s.mu.RLock()
	pluginIds := make([]int64, 0, len(s.cache))
	for id := range s.cache {
		pluginIds = append(pluginIds, id)
	}
	s.mu.RUnlock()

	var results []ScanResult
	for _, id := range pluginIds {
		result, err := s.TriggerScan(context, id)
		if err == nil && result != nil {
			results = append(results, *result)
		}
	}
	return results, nil
}

func (s *serviceImpl) ClearCache(pluginId int64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.cache, pluginId)
	s.log.Info("Cleared file cache", "pluginId", pluginId)
}

func (s *serviceImpl) GetCachedPlugins() []int64 {
	s.mu.RLock()
	defer s.mu.RUnlock()

	ids := make([]int64, 0, len(s.cache))
	for id := range s.cache {
		ids = append(ids, id)
	}
	return ids
}

// performScan executes the actual directory scan
func (s *serviceImpl) performScan(context stdctx.Context, pluginId int64, triggerType string) apperror.Result[ScanResult] {
	startTime := time.Now()

	s.log.Info("Scanning plugin", "pluginId", pluginId, "trigger", triggerType)

	// Get or create cache
	s.mu.Lock()
	cache, exists := s.cache[pluginId]
	if !exists {
		// Initialize cache first
		s.mu.Unlock()
		if err := s.InitializeCache(context, pluginId); err != nil {
			return nil, err
		}
		s.mu.Lock()
		cache = s.cache[pluginId]
	}
	s.mu.Unlock()

	// Perform scan and detect changes
	changes := s.scanAndCompare(cache)

	result := &ScanResult{
		PluginId:     pluginId,
		Path:         cache.path,
		ScanTime:     startTime,
		DurationMs:   time.Since(startTime).Milliseconds(),
		FilesScanned: len(cache.lastScan),
		Changes:      changes,
		TriggerType:  triggerType,
	}

	// Broadcast changes if any
	if len(changes) > 0 {
		s.broadcastChanges(pluginId, changes, triggerType)
	}

	return result, nil
}
```

---

## Implementation: scanner.go

```go
package watcher

import (
	"time"

	"wp-plugin-publish/internal/ws"
)

// watchLoop is the main loop for watching a plugin directory
func (s *serviceImpl) watchLoop(w *pluginWatcher) {
	ticker := time.NewTicker(s.pollInterval)
	defer ticker.Stop()

	// Initial scan to populate baseline
	s.scanDirectory(w)

	var pendingChanges []FileChange
	var debounceTimer *time.Timer

	for {
		select {
		case <-w.stopCh:
			if debounceTimer != nil {
				debounceTimer.Stop()
			}
			return

		case <-ticker.C:
			changes := s.scanDirectory(w)
			if len(changes) > 0 {
				pendingChanges = append(pendingChanges, changes...)

				// Reset debounce timer
				if debounceTimer != nil {
					debounceTimer.Stop()
				}
				debounceTimer = time.AfterFunc(time.Duration(s.debounceMs)*time.Millisecond, func() {
					s.broadcastChanges(w.pluginId, pendingChanges)
					pendingChanges = nil
				})
			}
		}
	}
}

// broadcastChanges sends file changes via WebSocket and records them
func (s *serviceImpl) broadcastChanges(pluginId int64, changes []FileChange) {
	if len(changes) == 0 {
		return
	}

	// Count change types
	var created, modified, deleted int
	for _, c := range changes {
		switch c.ChangeType {
		case "created":
			created++
		case "modified":
			modified++
		case "deleted":
			deleted++
		}
	}

	s.log.Info("File changes detected",
		"pluginId", pluginId,
		"created", created,
		"modified", modified,
		"deleted", deleted,
	)

	// Broadcast via WebSocket
	s.wsHub.Broadcast(ws.EventFileChange, ws.FileChangePayload{
		PluginId: pluginId,
		Changes:  changes,
		Summary: ws.FileChangeSummary{
			Created:  created,
			Modified: modified,
			Deleted:  deleted,
		},
	})

	// Record changes in sync service
	for _, c := range changes {
		s.syncService.RecordFileChange(nil, &models.FileChange{
			PluginId:   pluginId,
			FilePath:   c.Path,
			ChangeType: c.ChangeType,
			LocalHash:  c.Hash,
		})
	}
}

func (s *serviceImpl) TriggerScan(pluginId int64) apperror.Result[ScanResult] {
	s.mu.RLock()
	w, exists := s.watchers[pluginId]
	s.mu.RUnlock()

	if !exists {
		// Plugin not being watched, get details and do one-time scan
		plugin, err := s.pluginService.GetById(nil, pluginId)
		if err != nil {
			return nil, err
		}

		w = &pluginWatcher{
			pluginId: pluginId,
			path:     plugin.Path,
			excludes: plugin.ExcludePatterns,
			lastScan: make(map[string]fileInfo),
		}
	}

	startTime := time.Now()
	changes := s.scanDirectory(w)

	return &ScanResult{
		PluginId:     pluginId,
		Path:         w.path,
		ScanTime:     startTime,
		DurationMs:   time.Since(startTime).Milliseconds(),
		FilesScanned: len(w.lastScan),
		Changes:      changes,
	}, nil
}
```

---

## Implementation: scanner.go

```go
package watcher

import (
	"crypto/md5"
	"encoding/hex"
	"io"
	"os"
	"path/filepath"
	"strings"
)

// scanDirectory scans a directory and returns detected changes
func (s *serviceImpl) scanDirectory(w *pluginWatcher) []FileChange {
	var changes []FileChange
	currentFiles := make(map[string]fileInfo)

	// Walk directory
	err := filepath.Walk(w.path, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // Skip inaccessible files
		}

		// Get relative path
		relPath, _ := filepath.Rel(w.path, path)
		if relPath == "." {
			return nil
		}

		// Skip directories
		if info.IsDir() {
			// Check if should skip this directory
			base := filepath.Base(path)
			if s.isExcluded(base, w.excludes) {
				return filepath.SkipDir
			}
			return nil
		}

		// Skip excluded files
		base := filepath.Base(path)
		if s.isExcluded(base, w.excludes) {
			return nil
		}

		// Calculate hash
		hash, _ := s.calculateHash(path)

		fi := fileInfo{
			ModTime: info.ModTime().Unix(),
			Size:    info.Size(),
			Hash:    hash,
		}
		currentFiles[relPath] = fi

		// Compare with last scan
		if lastInfo, exists := w.lastScan[relPath]; exists {
			// File existed before - check if modified
			if lastInfo.Hash != fi.Hash {
				changes = append(changes, FileChange{
					Path:       relPath,
					ChangeType: "modified",
					Hash:       fi.Hash,
					Size:       fi.Size,
					ModTime:    info.ModTime(),
				})
			}
		} else {
			// New file
			changes = append(changes, FileChange{
				Path:       relPath,
				ChangeType: "created",
				Hash:       fi.Hash,
				Size:       fi.Size,
				ModTime:    info.ModTime(),
			})
		}

		return nil
	})

	if err != nil {
		s.log.Error("Error scanning directory", "path", w.path, "error", err)
		return changes
	}

	// Check for deleted files
	for path := range w.lastScan {
		if _, exists := currentFiles[path]; !exists {
			changes = append(changes, FileChange{
				Path:       path,
				ChangeType: "deleted",
			})
		}
	}

	// Update last scan
	w.lastScan = currentFiles

	return changes
}

// isExcluded checks if a file/directory should be excluded
func (s *serviceImpl) isExcluded(name string, excludes []string) bool {
	// Always exclude hidden files and common directories
	if strings.HasPrefix(name, ".") {
		return true
	}

	defaultExcludes := []string{"node_modules", "vendor", ".git", ".svn", ".idea", ".vscode"}
	for _, ex := range defaultExcludes {
		if name == ex {
			return true
		}
	}

	// Check custom excludes
	for _, pattern := range excludes {
		if matched, _ := filepath.Match(pattern, name); matched {
			return true
		}
	}

	return false
}

// calculateHash computes MD5 hash of a file
func (s *serviceImpl) calculateHash(path string) apperror.Result[string] {
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

## WebSocket Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `file:change` | `{pluginId, changes, summary}` | Files changed |
| `watcher:started` | `{pluginId, path}` | Watcher started |
| `watcher:stopped` | `{pluginId}` | Watcher stopped |
| `watcher:error` | `{pluginId, error}` | Scan error |

---

## API Endpoints

| Method | Endpoint | Handler |
|--------|----------|---------|
| GET | `/api/watcher/status` | Get all watchers status |
| POST | `/api/watcher/start/:pluginId` | Start watching plugin |
| POST | `/api/watcher/stop/:pluginId` | Stop watching plugin |
| POST | `/api/watcher/scan/:pluginId` | Trigger manual scan |

---

*See also: [34-git-service-impl.md](34-git-service-impl.md)*
