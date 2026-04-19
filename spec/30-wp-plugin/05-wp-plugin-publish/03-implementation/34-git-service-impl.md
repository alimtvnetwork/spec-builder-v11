# 34 — Git & Build Service Implementation

> **Location:** `spec/30-wp-plugin/05-wp-plugin-publish/03-implementation/34-git-service-impl.md`  
> **Updated:** 2026-03-12  
**Version:** 1.0.0  
> **Status:** Implementation Spec

---

## Overview

Complete Go implementation for Git operations and PowerShell build script execution. This service handles Git pull operations and custom build commands for plugins.

---

## File Structure

```
backend/internal/services/git/
├── service.go      # Main service interface and constructor
├── pull.go         # Git pull operations
├── build.go        # PowerShell/script execution
└── types.go        # Types and configuration
```

---

## Implementation: types.go

```go
package git

import "time"

// PullResult represents the outcome of a git pull operation
type PullResult struct {
	PluginId     int64
	PluginName   string
	Success      bool
	Branch       string
	CommitHash   string    `json:",omitempty"`
	CommitMsg    string    `json:",omitempty"`
	FilesChanged int
	Insertions   int
	Deletions    int
	Duration     int64     // milliseconds
	Output       string    `json:",omitempty"`
	Error        string    `json:",omitempty"`
	PulledAt     time.Time
}

// BuildResult represents the outcome of a build command
type BuildResult struct {
	PluginId   int64
	PluginName string
	Success    bool
	Command    string
	ExitCode   int
	Output     string
	Error      string    `json:",omitempty"`
	Duration   int64     // milliseconds
	BuiltAt    time.Time
}

// BatchPullResult holds results for multiple plugins
type BatchPullResult struct {
	Results   []PullResult
	Succeeded int
	Failed    int
	Duration  int64
}

// PluginGitConfig holds git configuration for a plugin
type PluginGitConfig struct {
	PluginId     int64
	GitEnabled   bool
	Branch       string
	BuildEnabled bool
	BuildCommand string
}
```

---

## Implementation: service.go

```go
package git

import (
	stdctx "context"
	"sync"

	"wp-plugin-publish/internal/database"
	"wp-plugin-publish/internal/logger"
	"wp-plugin-publish/internal/services/plugin"
	"wp-plugin-publish/internal/ws"
)

// Service interface for git and build operations
type Service interface {
	// Git operations
	Pull(context stdctx.Context, pluginId int64) apperror.Result[*PullResult]
	PullAll(context stdctx.Context) apperror.Result[*BatchPullResult]
	GetStatus(context stdctx.Context, pluginId int64) apperror.Result[*GitStatus]

	// Build operations
	Build(context stdctx.Context, pluginId int64) apperror.Result[*BuildResult]
	PullAndBuild(context stdctx.Context, pluginId int64) apperror.Result[PullAndBuildOutcome]
	PullAndBuildAll(context stdctx.Context) apperror.Result[PullAndBuildAllOutcome]

	// Configuration
	GetConfig(context stdctx.Context, pluginId int64) apperror.Result[*PluginGitConfig]
	UpdateConfig(context stdctx.Context, config PluginGitConfig) *apperror.AppError
}

// GitStatus represents current git repository status
type GitStatus struct {
	PluginId     int64
	IsRepo       bool
	Branch       string
	CommitHash   string
	CommitMsg    string
	HasChanges   bool
	Ahead        int
	Behind       int
}

// Config holds git service configuration
type Config struct {
	Db             *database.Db
	Logger         *logger.Logger
	PluginService  plugin.Service
	WatcherService watcher.Service  // Added for hybrid mode
	WsHub          *ws.Hub
	DefaultBranch  string
	Timeout        int // seconds
}

type serviceImpl struct {
	db             *database.Db
	log            *logger.Logger
	pluginService  plugin.Service
	watcherService watcher.Service  // Added for hybrid mode
	wsHub          *ws.Hub
	defaultBranch  string
	timeout        int
	mu             sync.Mutex
}

// New creates a new git service
func New(cfg Config) Service {
	if cfg.DefaultBranch == "" {
		cfg.DefaultBranch = "main"
	}
	if cfg.Timeout == 0 {
		cfg.Timeout = 60
	}

	return &serviceImpl{
		db:             cfg.Db,
		log:            cfg.Logger,
		pluginService:  cfg.PluginService,
		watcherService: cfg.WatcherService,
		wsHub:          cfg.WsHub,
		defaultBranch:  cfg.DefaultBranch,
		timeout:        cfg.Timeout,
	}
}
```

---

## Implementation: pull.go

```go
package git

import (
	"bytes"
	stdctx "context"
	"fmt"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"wp-plugin-publish/internal/ws"
	"wp-plugin-publish/pkg/apperror"
)

func (s *serviceImpl) Pull(context stdctx.Context, pluginId int64) apperror.Result[PullResult] {
	startTime := time.Now()

	s.log.Info("Starting git pull", "pluginId", pluginId)

	// Get plugin details
	plugin, err := s.pluginService.GetById(context, pluginId)
	if err != nil {
		return nil, err
	}

	result := &PullResult{
		PluginId:   pluginId,
		PluginName: plugin.Name,
		PulledAt:   time.Now(),
	}

	// Broadcast pull started
	s.wsHub.Broadcast(ws.EventGitPullStarted, ws.GitPullStartedPayload{
		PluginId:   pluginId,
		PluginName: plugin.Name,
	})

	// Check if directory is a git repo
	gitDir := filepath.Join(plugin.Path, ".git")
	if !dirExists(gitDir) {
		result.Success = false
		result.Error = "not a git repository"
		result.Duration = time.Since(startTime).Milliseconds()
		return result, apperror.New(
			apperror.ErrGitNotRepo, "directory is not a git repository",
		)
	}

	// Get current branch
	branch, err := s.runGitCommand(plugin.Path, "rev-parse", "--abbrev-ref", "HEAD")
	if err != nil {
		result.Success = false
		result.Error = err.Error()
		result.Duration = time.Since(startTime).Milliseconds()
		return result, err
	}
	result.Branch = strings.TrimSpace(branch)

	// Run git pull
	output, err := s.runGitCommand(plugin.Path, "pull", "origin", result.Branch)
	result.Output = output
	result.Duration = time.Since(startTime).Milliseconds()

	if err != nil {
		result.Success = false
		result.Error = err.Error()

		s.wsHub.Broadcast(ws.EventGitPullFailed, ws.GitPullFailedPayload{
			PluginId: pluginId,
			Error:    result.Error,
		})
		return result, err
	}

	// Parse output for stats
	result.Success = true
	s.parseGitOutput(output, result)

	// Get latest commit info
	commitHash, _ := s.runGitCommand(plugin.Path, "rev-parse", "--short", "HEAD")
	result.CommitHash = strings.TrimSpace(commitHash)

	commitMsg, _ := s.runGitCommand(plugin.Path, "log", "-1", "--format=%s")
	result.CommitMsg = strings.TrimSpace(commitMsg)

	// ========================================
	// HYBRID WATCHER: Trigger scan after pull
	// ========================================
	if result.FilesChanged > 0 && s.watcherService != nil {
		s.log.Info("Git pull detected changes, triggering file scan", "pluginId", pluginId)
		scanResult, _ := s.watcherService.ScanAfterGitPull(context, pluginId)
		if scanResult != nil && len(scanResult.Changes) > 0 {
			s.log.Info("File scan complete", "changes", len(scanResult.Changes))
		}
	}

	// Broadcast pull complete
	s.wsHub.Broadcast(ws.EventGitPullComplete, ws.GitPullCompletePayload{
		PluginId:     pluginId,
		Success:      true,
		FilesChanged: result.FilesChanged,
		CommitHash:   result.CommitHash,
	})

	s.log.Info("Git pull complete",
		"pluginId", pluginId,
		"filesChanged", result.FilesChanged,
		"duration", result.Duration,
	)

	return result, nil
}

func (s *serviceImpl) PullAll(context stdctx.Context) apperror.Result[BatchPullResult] {
	startTime := time.Now()

	s.log.Info("Starting git pull for all plugins")

	// Get all plugins with git enabled
	plugins, err := s.pluginService.List(context)
	if err != nil {
		return nil, err
	}

	batch := &BatchPullResult{
		Results: make([]PullResult, 0),
	}

	for _, p := range plugins {
		// Check if git directory exists
		gitDir := filepath.Join(p.Path, ".git")
		if !dirExists(gitDir) {
			continue
		}

		result, _ := s.Pull(context, p.Id)
		if result != nil {
			batch.Results = append(batch.Results, *result)
			if result.Success {
				batch.Succeeded++
			} else {
				batch.Failed++
			}
		}
	}

	batch.Duration = time.Since(startTime).Milliseconds()

	s.wsHub.Broadcast(ws.EventGitPullAllComplete, ws.GitPullAllCompletePayload{
		Succeeded: batch.Succeeded,
		Failed:    batch.Failed,
		Duration:  batch.Duration,
	})

	return batch, nil
}

func (s *serviceImpl) GetStatus(context stdctx.Context, pluginId int64) apperror.Result[GitStatus] {
	plugin, err := s.pluginService.GetById(context, pluginId)
	if err != nil {
		return nil, err
	}

	status := &GitStatus{
		PluginId: pluginId,
	}

	gitDir := filepath.Join(plugin.Path, ".git")
	if !dirExists(gitDir) {
		status.IsRepo = false
		return status, nil
	}
	status.IsRepo = true

	// Get branch
	branch, _ := s.runGitCommand(plugin.Path, "rev-parse", "--abbrev-ref", "HEAD")
	status.Branch = strings.TrimSpace(branch)

	// Get commit hash
	hash, _ := s.runGitCommand(plugin.Path, "rev-parse", "--short", "HEAD")
	status.CommitHash = strings.TrimSpace(hash)

	// Get commit message
	msg, _ := s.runGitCommand(plugin.Path, "log", "-1", "--format=%s")
	status.CommitMsg = strings.TrimSpace(msg)

	// Check for local changes
	diffOutput, _ := s.runGitCommand(plugin.Path, "status", "--porcelain")
	status.HasChanges = len(strings.TrimSpace(diffOutput)) > 0

	// Check ahead/behind
	s.runGitCommand(plugin.Path, "fetch", "origin", status.Branch)
	aheadBehind, _ := s.runGitCommand(plugin.Path, "rev-list", "--left-right", "--count",
		fmt.Sprintf("%s...origin/%s", status.Branch, status.Branch))
	parts := strings.Fields(aheadBehind)
	if len(parts) >= 2 {
		status.Ahead, _ = strconv.Atoi(parts[0])
		status.Behind, _ = strconv.Atoi(parts[1])
	}

	return status, nil
}

// runGitCommand executes a git command in the specified directory
func (s *serviceImpl) runGitCommand(dir string, args ...string) apperror.Result[string] {
	context, cancel := stdctx.WithTimeout(stdctx.Background(), time.Duration(s.timeout)*time.Second)
	defer cancel()

	cmd := exec.CommandContext(context, "git", args...)
	cmd.Dir = dir

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return stderr.String(), apperror.Wrap(
			err, apperror.ErrGitCommand, stderr.String(),
		)
	}

	return stdout.String(), nil
}

// parseGitOutput extracts statistics from git pull output
func (s *serviceImpl) parseGitOutput(output string, result *PullResult) {
	// Parse "X files changed, Y insertions(+), Z deletions(-)"
	re := regexp.MustCompile(`(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?`)
	matches := re.FindStringSubmatch(output)
	if len(matches) >= 2 {
		result.FilesChanged, _ = strconv.Atoi(matches[1])
		if len(matches) >= 3 {
			result.Insertions, _ = strconv.Atoi(matches[2])
		}
		if len(matches) >= 4 {
			result.Deletions, _ = strconv.Atoi(matches[3])
		}
	}
}

func dirExists(path string) bool {
	return pathutil.IsDir(path)
}
```

---

## Implementation: build.go

```go
package git

import (
	"bytes"
	stdctx "context"
	"os/exec"
	"runtime"
	"time"

	"wp-plugin-publish/internal/ws"
	"wp-plugin-publish/pkg/apperror"
)

func (s *serviceImpl) Build(context stdctx.Context, pluginId int64) apperror.Result[BuildResult] {
	startTime := time.Now()

	s.log.Info("Starting build", "pluginId", pluginId)

	// Get plugin and config
	plugin, err := s.pluginService.GetById(context, pluginId)
	if err != nil {
		return nil, err
	}

	config, err := s.GetConfig(context, pluginId)
	if err != nil || !config.BuildEnabled || config.BuildCommand == "" {
		return nil, apperror.New(
			apperror.ErrBuildNotConfigured, "build not configured for this plugin",
		)
	}

	result := &BuildResult{
		PluginId:   pluginId,
		PluginName: plugin.Name,
		Command:    config.BuildCommand,
		BuiltAt:    time.Now(),
	}

	// Broadcast build started
	s.wsHub.Broadcast(ws.EventBuildStarted, ws.BuildStartedPayload{
		PluginId:   pluginId,
		PluginName: plugin.Name,
		Command:    config.BuildCommand,
	})

	// Execute build command
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		// PowerShell on Windows
		cmd = exec.CommandContext(context, "powershell", "-ExecutionPolicy", "Bypass", "-File", config.BuildCommand)
	} else {
		// Bash on Linux/Mac
		cmd = exec.CommandContext(context, "bash", "-c", config.BuildCommand)
	}

	cmd.Dir = plugin.Path

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err = cmd.Run()
	result.Duration = time.Since(startTime).Milliseconds()
	result.Output = stdout.String()

	if err != nil {
		result.Success = false
		result.Error = stderr.String()
		// EXEMPTED: stdlib boundary — exec.ExitError (§7.2)
		if exitErr, ok := err.(*exec.ExitError); ok {
			result.ExitCode = exitErr.ExitCode()
		}

		s.wsHub.Broadcast(ws.EventBuildFailed, ws.BuildFailedPayload{
			PluginId: pluginId,
			Error:    result.Error,
			ExitCode: result.ExitCode,
		})

		return result, apperror.Wrap(
			err, apperror.ErrBuildFailed, result.Error,
		)
	}

	result.Success = true
	result.ExitCode = 0

	s.wsHub.Broadcast(ws.EventBuildComplete, ws.BuildCompletePayload{
		PluginId: pluginId,
		Success:  true,
		Duration: result.Duration,
	})

	s.log.Info("Build complete", "pluginId", pluginId, "duration", result.Duration)
	return result, nil
}

// PullAndBuildOutcome holds the combined result of a pull + conditional build
type PullAndBuildOutcome struct {
	Pull  *PullResult
	Build *BuildResult
}

// PullAndBuildAllOutcome holds batch results for all plugins
type PullAndBuildAllOutcome struct {
	PullResults  []PullResult
	BuildResults []BuildResult
}

func (s *serviceImpl) PullAndBuild(context stdctx.Context, pluginId int64) apperror.Result[PullAndBuildOutcome] {
	s.log.Info("Starting pull and build", "pluginId", pluginId)

	// First pull
	pullResult, err := s.Pull(context, pluginId)
	if err != nil {
		return PullAndBuildOutcome{Pull: pullResult}, err
	}

	// Only build if pull was successful and there were changes
	if pullResult.Success && pullResult.FilesChanged > 0 {
		buildResult, err := s.Build(context, pluginId)
		return PullAndBuildOutcome{Pull: pullResult, Build: buildResult}, err
	}

	return PullAndBuildOutcome{Pull: pullResult}, nil
}

func (s *serviceImpl) PullAndBuildAll(context stdctx.Context) apperror.Result[PullAndBuildAllOutcome] {
	s.log.Info("Starting pull and build for all plugins")

	plugins, err := s.pluginService.List(context)
	if err != nil {
		return PullAndBuildAllOutcome{}, err
	}

	var outcome PullAndBuildAllOutcome

	for _, p := range plugins {
		result, _ := s.PullAndBuild(context, p.Id)
		if result.Pull != nil {
			outcome.PullResults = append(outcome.PullResults, *result.Pull)
		}
		if result.Build != nil {
			outcome.BuildResults = append(outcome.BuildResults, *result.Build)
		}
	}

	return outcome, nil
}

func (s *serviceImpl) GetConfig(context stdctx.Context, pluginId int64) apperror.Result[PluginGitConfig] {
	var config PluginGitConfig
	config.PluginId = pluginId

	err := s.db.QueryRowContext(context, `
		SELECT GitEnabled, GitBranch, BuildEnabled, BuildCommand
		FROM PluginGitConfig
		WHERE PluginId = ?
	`, pluginId).Scan(&config.GitEnabled, &config.Branch, &config.BuildEnabled, &config.BuildCommand)

	if err != nil {
		// Return default config
		config.GitEnabled = true
		config.Branch = s.defaultBranch
		config.BuildEnabled = false
		return &config, nil
	}

	return &config, nil
}

func (s *serviceImpl) UpdateConfig(context stdctx.Context, config PluginGitConfig) error {
	_, err := s.db.ExecContext(context, `
		INSERT OR REPLACE INTO PluginGitConfig (PluginId, GitEnabled, GitBranch, BuildEnabled, BuildCommand, UpdatedAt)
		VALUES (?, ?, ?, ?, ?, datetime('now'))
	`, config.PluginId, config.GitEnabled, config.Branch, config.BuildEnabled, config.BuildCommand)

	return err
}
```

---

## Database Schema

```sql
CREATE TABLE IF NOT EXISTS PluginGitConfig (
    PluginId INTEGER PRIMARY KEY,
    GitEnabled INTEGER DEFAULT 1,
    GitBranch TEXT DEFAULT 'main',
    BuildEnabled INTEGER DEFAULT 0,
    BuildCommand TEXT,
    UpdatedAt TEXT NOT NULL,
    FOREIGN KEY (PluginId) REFERENCES Plugin(Id)
);
```

---

## WebSocket Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `git:pull:started` | `{pluginId, pluginName}` | Pull started |
| `git:pull:complete` | `{pluginId, success, filesChanged}` | Pull finished |
| `git:pull:failed` | `{pluginId, error}` | Pull error |
| `git:pullall:complete` | `{succeeded, failed, duration}` | Batch pull done |
| `build:started` | `{pluginId, command}` | Build started |
| `build:complete` | `{pluginId, success, duration}` | Build finished |
| `build:failed` | `{pluginId, error, exitCode}` | Build error |

---

## API Endpoints

| Method | Endpoint | Handler |
|--------|----------|---------|
| POST | `/api/git/pull/:pluginId` | Pull single plugin |
| POST | `/api/git/pull-all` | Pull all plugins |
| GET | `/api/git/status/:pluginId` | Get git status |
| POST | `/api/git/build/:pluginId` | Run build command |
| POST | `/api/git/pull-build/:pluginId` | Pull then build |
| POST | `/api/git/pull-build-all` | Pull & build all |
| GET | `/api/git/config/:pluginId` | Get git config |
| PUT | `/api/git/config/:pluginId` | Update git config |

---

*See also: [35-implementation-plan.md](35-implementation-plan.md)*
