# Phase 4: Chronicle Service Specification

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  
**Phase:** 4 of 9  
**Service:** `chronicle`  
**Port:** 8083  

---

## Overview

The Chronicle Service manages version control, history tracking, and Git operations for SpecBuilder Pro. It provides a complete audit trail of all specification changes and enables time-travel queries.

**Cross-References:**
- [Shared Packages](../13-shared-packages/00-overview.md)
- [SpecManager Service](./02-specmanager.md)
- [Database Design](../07-database-design/00-overview.md)

---

## Responsibilities

- **Version Control**: Track all changes to specifications
- **Git Operations**: Commit, branch, diff, merge support
- **History Queries**: Time-travel and audit queries
- **Diff Generation**: Content comparison between versions
- **Changelog Generation**: Automated changelog creation
- **Rollback**: Restore previous versions

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Chronicle :8083                                │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                      HTTP Handlers                               │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │ │
│  │  │HistoryHandler│ │  GitHandler  │ │    DiffHandler           │ │ │
│  │  └──────────────┘ └──────────────┘ └──────────────────────────┘ │ │
│  └────────────────────────────┬────────────────────────────────────┘ │
│                               │                                       │
│  ┌────────────────────────────┴────────────────────────────────────┐ │
│  │                       Service Layer                              │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │ │
│  │  │HistoryService│ │  GitService  │ │    DiffService           │ │ │
│  │  └──────────────┘ └──────────────┘ └──────────────────────────┘ │ │
│  └────────────────────────────┬────────────────────────────────────┘ │
│                               │                                       │
│  ┌────────────────────────────┴────────────────────────────────────┐ │
│  │                     Repository Layer                             │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │ │
│  │  │ CommitRepo   │ │ VersionRepo  │ │    ChangelogRepo         │ │ │
│  │  └──────────────┘ └──────────────┘ └──────────────────────────┘ │ │
│  └────────────────────────────┬────────────────────────────────────┘ │
│                               │                                       │
│  ┌────────────────────────────┴────────────────────────────────────┐ │
│  │                          Storage                                 │ │
│  │  ┌──────────────────┐ ┌──────────────────────────────────────┐  │ │
│  │  │{project-id}.db   │ │   Git Repository (optional)          │  │ │
│  │  │(history tables)  │ │   .git/                              │  │ │
│  │  └──────────────────┘ └──────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
cmd/chronicle/
├── main.go
└── config.yaml

internal/chronicle/
├── server/
│   ├── server.go
│   └── routes.go
├── handler/
│   ├── history.go          # History HTTP handlers
│   ├── git.go              # Git HTTP handlers
│   ├── diff.go             # Diff HTTP handlers
│   ├── changelog.go        # Changelog handlers
│   └── rollback.go         # Rollback handlers
├── service/
│   ├── history.go          # History business logic
│   ├── git.go              # Git operations
│   ├── diff.go             # Diff generation
│   ├── changelog.go        # Changelog generation
│   └── rollback.go         # Version rollback
├── repository/
│   ├── commit.go           # Commit data access
│   ├── version.go          # Version data access
│   ├── change.go           # Change tracking
│   └── dbmanager.go        # Database management
├── model/
│   ├── commit.go           # Commit domain model
│   ├── version.go          # Version domain model
│   ├── change.go           # Change domain model
│   ├── diff.go             # Diff domain model
│   └── changelog.go        # Changelog domain model
├── git/
│   ├── repository.go       # Git repository wrapper
│   ├── commit.go           # Git commit operations
│   ├── branch.go           # Branch operations
│   ├── diff.go             # Git diff operations
│   └── merge.go            # Merge operations
├── diff/
│   ├── engine.go           # Diff algorithm
│   ├── unified.go          # Unified diff format
│   └── semantic.go         # Semantic diff
└── migrations/
    └── chronicle/          # chronicle tables
```

---

## Domain Models

### Commit Model

```go
package model

import (
    "github.com/specbuilder/pkg/types"
)

// Commit represents a version control commit
type Commit struct {
    Id          types.CommitId
    ProjectId   types.ProjectId
    ParentId    *types.CommitId   `json:",omitempty"`
    Message     string
    Author      CommitAuthor
    Changes     []Change
    Metadata    types.Metadata
    CreatedAt   types.Timestamp
    
    // Git integration (optional)
    GitHash     string            `json:",omitempty"`
    GitBranch   string            `json:",omitempty"`
}

// CommitAuthor represents commit author information
type CommitAuthor struct {
    UserId   types.UserId
    Name     string
    Email    string
}

// CommitId is a typed identifier for commits
type CommitId struct {
    value uuid.UUID
}

func NewCommitId() CommitId { return CommitId{value: uuid.New()} }
func ParseCommitId(s string) apperror.Result[CommitId] { /* similar to other IDs */ }
func (id CommitId) String() string { return id.value.String() }

// CreateCommitRequest for creating a commit
type CreateCommitRequest struct {
    ProjectId types.ProjectId `validate:"required"`
    Message   string          `validate:"required,min=1,max=1000"`
    Changes   []ChangeInput   `validate:"required,min=1,max=100"`
}

// ChangeInput represents a single change in a commit request
type ChangeInput struct {
    SpecId      types.SpecId  `validate:"required"`
    Type        ChangeType    `validate:"required"`
    ContentDiff string        `json:",omitempty"`
}
```

### Change Model

```go
package model

import (
    "github.com/specbuilder/pkg/types"
)

// ChangeType represents the type of change
type ChangeType string

const (
    ChangeTypeCreate ChangeType = "CREATE"
    ChangeTypeUpdate ChangeType = "UPDATE"
    ChangeTypeDelete ChangeType = "DELETE"
    ChangeTypeRename ChangeType = "RENAME"
    ChangeTypeMove   ChangeType = "MOVE"
)

// Change represents a single change in a commit
type Change struct {
    Id          types.ChangeId
    CommitId    types.CommitId
    SpecId      types.SpecId
    Type        ChangeType
    
    // Content changes
    OldContent    string          `json:",omitempty"`
    NewContent    string          `json:",omitempty"`
    OldHash       string          `json:",omitempty"`
    NewHash       string          `json:",omitempty"`
    
    // Path changes (for rename/move)
    OldPath       string          `json:",omitempty"`
    NewPath       string          `json:",omitempty"`
    
    // Statistics
    Additions     int
    Deletions     int
    
    CreatedAt     types.Timestamp
}

// ChangeId is a typed identifier for changes
type ChangeId struct {
    value uuid.UUID
}
```

### Version Model

```go
package model

import (
    "github.com/specbuilder/pkg/types"
)

// SpecVersion represents a point-in-time version of a spec
type SpecVersion struct {
    Id          types.VersionId
    SpecId      types.SpecId
    CommitId    types.CommitId
    Version     int              // Sequential version number
    Content     string
    ContentHash string
    Path        string
    Metadata    types.Metadata
    CreatedAt   types.Timestamp
    CreatedBy   *types.UserId    `json:",omitempty"`
}

// VersionId is a typed identifier for versions
type VersionId struct {
    value uuid.UUID
}
```

### Diff Model

```go
package model

// DiffResult represents the difference between two versions
type DiffResult struct {
    SpecId      types.SpecId
    OldVersion  int
    NewVersion  int
    Changes     []DiffHunk
    Statistics  DiffStats
    
    // Unified diff format
    UnifiedDiff string `json:",omitempty"`
}

// DiffHunk represents a single change region
type DiffHunk struct {
    OldStart    int
    OldLines    int
    NewStart    int
    NewLines    int
    Lines       []DiffLine
}

// DiffLine represents a single line in a diff
type DiffLine struct {
    Type    DiffLineType
    Content string
    OldNum  int `json:",omitempty"`
    NewNum  int `json:",omitempty"`
}

// DiffLineType represents the type of diff line
type DiffLineType string

const (
    DiffLineContext   DiffLineType = "context"
    DiffLineAddition  DiffLineType = "addition"
    DiffLineDeletion  DiffLineType = "deletion"
)

// DiffStats contains diff statistics
type DiffStats struct {
    Additions   int
    Deletions   int
    Changes     int
}
```

### Changelog Model

```go
package model

import (
    "github.com/specbuilder/pkg/types"
)

// Changelog represents a generated changelog
type Changelog struct {
    Id          types.ChangelogId
    ProjectId   types.ProjectId
    FromCommit  types.CommitId
    ToCommit    types.CommitId
    Title       string
    Content     string              // Markdown format
    Sections    []ChangelogSection
    CreatedAt   types.Timestamp
}

// ChangelogSection represents a section in a changelog
type ChangelogSection struct {
    Title   string          // e.g., "Added", "Changed", "Fixed"
    Items   []ChangelogItem
}

// ChangelogItem represents a single changelog entry
type ChangelogItem struct {
    SpecId      types.SpecId
    SpecName    string
    ChangeType  ChangeType
    Description string
}
```

---

## Service Layer

### HistoryService

```go
package service

import (
    stdctx "context"
    "crypto/sha256"
    "encoding/hex"
    
    "github.com/specbuilder/pkg/database"
    "github.com/specbuilder/pkg/errors"
    "github.com/specbuilder/pkg/logging"
    "github.com/specbuilder/pkg/types"
    
    "github.com/specbuilder/internal/chronicle/model"
    "github.com/specbuilder/internal/chronicle/repository"
)

// HistoryService manages version history
type HistoryService struct {
    commitRepo  *repository.CommitRepository
    versionRepo *repository.VersionRepository
    changeRepo  *repository.ChangeRepository
    dbManager   *repository.DbManager
    logger      logging.Logger
}

// NewHistoryService creates a history service
func NewHistoryService(
    commitRepo *repository.CommitRepository,
    versionRepo *repository.VersionRepository,
    changeRepo *repository.ChangeRepository,
    dbManager *repository.DbManager,
    logger logging.Logger,
) *HistoryService {
    return &HistoryService{
        commitRepo:  commitRepo,
        versionRepo: versionRepo,
        changeRepo:  changeRepo,
        dbManager:   dbManager,
        logger:      logger,
    }
}

// CreateCommit records a new commit with changes
func (s *HistoryService) CreateCommit(context stdctx.Context, req model.CreateCommitRequest, author model.CommitAuthor) apperror.Result[*model.Commit] {
    projectDb, err := s.dbManager.GetProjectDb(context, req.ProjectId)
    if err != nil {
        return apperror.Fail[*model.Commit](apperror.Wrap(err, "get project db"))
    }
    defer projectDb.Close()
    
    // Get latest commit as parent
    latestCommit, _ := s.commitRepo.GetLatest(context, projectDb, req.ProjectId)
    var parentId *model.CommitId
    if latestCommit != nil {
        parentId = &latestCommit.Id
    }
    
    // Create commit
    commit := &model.Commit{
        Id:        model.NewCommitId(),
        ProjectId: req.ProjectId,
        ParentId:  parentId,
        Message:   req.Message,
        Author:    author,
        Changes:   make([]model.Change, 0, len(req.Changes)),
        CreatedAt: types.Now(),
    }
    
    // Process changes in transaction
    txErr := projectDb.WithTx(context, func(tx *database.Tx) error {
        // Create commit record
        if err := s.commitRepo.CreateWithTx(context, tx, commit); err != nil {
            return err
        }
        
        // Process each change
        for _, changeInput := range req.Changes {
            changeResult := s.processChange(context, tx, commit.Id, changeInput)
            if changeResult.HasError() {
                return changeResult.Error()
            }
            commit.Changes = append(commit.Changes, *changeResult.Value())
        }
        
        return nil
    })
    
    if txErr != nil {
        s.logger.ErrorContext(context, "failed to create commit",
            logging.Err(txErr),
            "project_id", req.ProjectId,
            "message", req.Message,
        )
        return apperror.Fail[*model.Commit](apperror.Wrap(txErr, "create commit"))
    }
    
    s.logger.InfoContext(context, "commit created",
        "commit_id", commit.Id,
        "project_id", req.ProjectId,
        "changes_count", len(commit.Changes),
        "message", req.Message,
    )
    
    return apperror.OK(commit)
}

// processChange creates a change record and version snapshot
func (s *HistoryService) processChange(context stdctx.Context, tx *database.Tx, commitId model.CommitId, input model.ChangeInput) apperror.Result[*model.Change] {
    // Get current spec version
    currentVersion, _ := s.versionRepo.GetLatestForSpec(context, tx, input.SpecId)
    
    var oldContent, oldHash, oldPath string
    var newVersion int
    
    if currentVersion != nil {
        oldContent = currentVersion.Content
        oldHash = currentVersion.ContentHash
        oldPath = currentVersion.Path
        newVersion = currentVersion.Version + 1
    } else {
        newVersion = 1
    }
    
    // Calculate diff statistics
    additions, deletions := calculateDiffStats(oldContent, input.ContentDiff)
    
    change := &model.Change{
        Id:        model.NewChangeId(),
        CommitId:  commitId,
        SpecId:    input.SpecId,
        Type:      input.Type,
        OldContent: oldContent,
        OldHash:    oldHash,
        Additions:  additions,
        Deletions:  deletions,
        CreatedAt:  types.Now(),
    }
    
    // Create new version snapshot
    if input.Type != model.ChangeTypeDelete {
        newContent := input.ContentDiff // Simplified - would apply patch in real impl
        hash := sha256.Sum256([]byte(newContent))
        
        version := &model.SpecVersion{
            Id:          model.NewVersionId(),
            SpecId:      input.SpecId,
            CommitId:    commitId,
            Version:     newVersion,
            Content:     newContent,
            ContentHash: hex.EncodeToString(hash[:]),
            CreatedAt:   types.Now(),
        }
        
        if err := s.versionRepo.CreateWithTx(context, tx, version); err != nil {
            return apperror.Fail[*model.Change](apperror.Wrap(err, "create version"))
        }
        
        change.NewContent = newContent
        change.NewHash = version.ContentHash
    }
    
    // Save change record
    if err := s.changeRepo.CreateWithTx(context, tx, change); err != nil {
        return apperror.Fail[*model.Change](apperror.Wrap(err, "create change"))
    }
    
    return apperror.OK(change)
}

// GetCommitHistory returns commit history for a project
func (s *HistoryService) GetCommitHistory(context stdctx.Context, projectId types.ProjectId, req types.PageRequest) apperror.Result[*types.PageResponse[model.Commit]] {
    projectDb, err := s.dbManager.GetProjectDb(context, projectId)
    if err != nil {
        return apperror.Fail[*types.PageResponse[model.Commit]](apperror.Wrap(err, "get project db"))
    }
    defer projectDb.Close()
    
    commits, total, err := s.commitRepo.List(context, projectDb, projectId, req)
    if err != nil {
        return apperror.Fail[*types.PageResponse[model.Commit]](apperror.Wrap(err, "list commits"))
    }
    
    response := types.NewPageResponse(commits, req, total)
    return apperror.OK(&response)
}

// GetSpecHistory returns version history for a specific spec
func (s *HistoryService) GetSpecHistory(context stdctx.Context, projectId types.ProjectId, specId types.SpecId, req types.PageRequest) apperror.Result[*types.PageResponse[model.SpecVersion]] {
    projectDb, err := s.dbManager.GetProjectDb(context, projectId)
    if err != nil {
        return apperror.Fail[*types.PageResponse[model.SpecVersion]](apperror.Wrap(err, "get project db"))
    }
    defer projectDb.Close()
    
    versions, total, err := s.versionRepo.ListForSpec(context, projectDb, specId, req)
    if err != nil {
        return apperror.Fail[*types.PageResponse[model.SpecVersion]](apperror.Wrap(err, "list versions"))
    }
    
    response := types.NewPageResponse(versions, req, total)
    return apperror.OK(&response)
}

// GetVersionAtTime returns the spec version at a specific point in time
func (s *HistoryService) GetVersionAtTime(context stdctx.Context, projectId types.ProjectId, specId types.SpecId, timestamp types.Timestamp) apperror.Result[*model.SpecVersion] {
    projectDb, err := s.dbManager.GetProjectDb(context, projectId)
    if err != nil {
        return apperror.Fail[*model.SpecVersion](apperror.Wrap(err, "get project db"))
    }
    defer projectDb.Close()
    
    version, err := s.versionRepo.GetAtTime(context, projectDb, specId, timestamp)
    if err != nil {
        s.logger.DebugContext(context, "no version found at time",
            "spec_id", specId,
            "timestamp", timestamp,
        )
        return apperror.Fail[*model.SpecVersion](
            apperror.Wrap(errors.NewDatabaseNotFound("SpecVersion", specId.String()), "version at time"),
        )
    }
    
    return apperror.OK(version)
}

func calculateDiffStats(oldContent, newContent string) (additions, deletions int) {
    // Simplified - real implementation would use proper diff algorithm
    oldLines := strings.Split(oldContent, "\n")
    newLines := strings.Split(newContent, "\n")
    
    additions = len(newLines) - len(oldLines)
    if additions < 0 {
        deletions = -additions
        additions = 0
    }
    
    return
}
```

### DiffService

```go
package service

import (
    stdctx "context"
    "strings"
    
    "github.com/specbuilder/pkg/errors"
    "github.com/specbuilder/pkg/logging"
    "github.com/specbuilder/pkg/types"
    
    "github.com/specbuilder/internal/chronicle/diff"
    "github.com/specbuilder/internal/chronicle/model"
    "github.com/specbuilder/internal/chronicle/repository"
)

// DiffService generates diffs between versions
type DiffService struct {
    versionRepo *repository.VersionRepository
    diffEngine  *diff.Engine
    dbManager   *repository.DbManager
    logger      logging.Logger
}

// NewDiffService creates a diff service
func NewDiffService(
    versionRepo *repository.VersionRepository,
    dbManager *repository.DbManager,
    logger logging.Logger,
) *DiffService {
    return &DiffService{
        versionRepo: versionRepo,
        diffEngine:  diff.NewEngine(),
        dbManager:   dbManager,
        logger:      logger,
    }
}

// CompareVersions generates a diff between two versions
func (s *DiffService) CompareVersions(context stdctx.Context, projectId types.ProjectId, specId types.SpecId, oldVersion, newVersion int) apperror.Result[*model.DiffResult] {
    projectDb, err := s.dbManager.GetProjectDb(context, projectId)
    if err != nil {
        return apperror.Fail[*model.DiffResult](apperror.Wrap(err, "get project db"))
    }
    defer projectDb.Close()
    
    // Get both versions
    oldVer, err := s.versionRepo.GetByVersion(context, projectDb, specId, oldVersion)
    if err != nil {
        s.logger.DebugContext(context, "old version not found",
            "spec_id", specId,
            "version", oldVersion,
        )
        return apperror.Fail[*model.DiffResult](
            apperror.Wrap(errors.NewDatabaseNotFound("SpecVersion", fmt.Sprintf("%s@v%d", specId, oldVersion)), "old version"),
        )
    }
    
    newVer, err := s.versionRepo.GetByVersion(context, projectDb, specId, newVersion)
    if err != nil {
        s.logger.DebugContext(context, "new version not found",
            "spec_id", specId,
            "version", newVersion,
        )
        return apperror.Fail[*model.DiffResult](
            apperror.Wrap(errors.NewDatabaseNotFound("SpecVersion", fmt.Sprintf("%s@v%d", specId, newVersion)), "new version"),
        )
    }
    
    // Generate diff
    hunks := s.diffEngine.Diff(oldVer.Content, newVer.Content)
    
    // Calculate statistics
    stats := calculateStats(hunks)
    
    // Generate unified diff
    unifiedDiff := s.diffEngine.UnifiedDiff(
        oldVer.Content, newVer.Content,
        fmt.Sprintf("v%d", oldVersion),
        fmt.Sprintf("v%d", newVersion),
    )
    
    result := &model.DiffResult{
        SpecId:      specId,
        OldVersion:  oldVersion,
        NewVersion:  newVersion,
        Changes:     hunks,
        Statistics:  stats,
        UnifiedDiff: unifiedDiff,
    }
    
    s.logger.DebugContext(context, "diff generated",
        "spec_id", specId,
        "old_version", oldVersion,
        "new_version", newVersion,
        "additions", stats.Additions,
        "deletions", stats.Deletions,
    )
    
    return apperror.OK(result)
}

// CompareWithCurrent generates a diff between a version and current
func (s *DiffService) CompareWithCurrent(context stdctx.Context, projectId types.ProjectId, specId types.SpecId, version int) apperror.Result[*model.DiffResult] {
    projectDb, err := s.dbManager.GetProjectDb(context, projectId)
    if err != nil {
        return apperror.Fail[*model.DiffResult](apperror.Wrap(err, "get project db"))
    }
    defer projectDb.Close()
    
    // Get latest version
    latestVer, err := s.versionRepo.GetLatestForSpec(context, projectDb, specId)
    if err != nil {
        return apperror.Fail[*model.DiffResult](apperror.Wrap(err, "get latest version"))
    }
    
    return s.CompareVersions(context, projectId, specId, version, latestVer.Version)
}

func calculateStats(hunks []model.DiffHunk) model.DiffStats {
    var stats model.DiffStats
    
    for _, hunk := range hunks {
        for _, line := range hunk.Lines {
            switch line.Type {
            case model.DiffLineAddition:
                stats.Additions++
            case model.DiffLineDeletion:
                stats.Deletions++
            }
        }
        stats.Changes++
    }
    
    return stats
}
```

### RollbackService

```go
package service

import (
    stdctx "context"
    
    "github.com/specbuilder/pkg/database"
    "github.com/specbuilder/pkg/errors"
    "github.com/specbuilder/pkg/logging"
    "github.com/specbuilder/pkg/types"
    
    "github.com/specbuilder/internal/chronicle/model"
    "github.com/specbuilder/internal/chronicle/repository"
)

// RollbackService handles version rollback
type RollbackService struct {
    historyService *HistoryService
    versionRepo    *repository.VersionRepository
    specClient     SpecManagerClient // HTTP client to SpecManager
    dbManager      *repository.DBManager
    logger         logging.Logger
}

// RollbackRequest for rolling back a spec
type RollbackRequest struct {
    ProjectId types.ProjectId `validate:"required"`
    SpecId    types.SpecId    `validate:"required"`
    Version   int             `validate:"required,min=1"`
    Message   string          `validate:"required,min=1,max=1000"`
}

// Rollback restores a spec to a previous version
func (s *RollbackService) Rollback(context stdctx.Context, req RollbackRequest, author model.CommitAuthor) apperror.Result[*model.Commit] {
    projectDb, err := s.dbManager.GetProjectDb(context, req.ProjectId)
    if err != nil {
        return apperror.Fail[*model.Commit](apperror.Wrap(err, "get project db"))
    }
    defer projectDb.Close()
    
    // Get the target version
    targetVersion, err := s.versionRepo.GetByVersion(context, projectDb, req.SpecId, req.Version)
    if err != nil {
        s.logger.WarnContext(context, "rollback target version not found",
            "spec_id", req.SpecId,
            "version", req.Version,
        )
        return apperror.Fail[*model.Commit](
            apperror.Wrap(errors.NewDatabaseNotFound("SpecVersion", fmt.Sprintf("%s@v%d", req.SpecId, req.Version)), "target version"),
        )
    }
    
    // Get current version for comparison
    currentVersion, err := s.versionRepo.GetLatestForSpec(context, projectDb, req.SpecId)
    if err != nil {
        return apperror.Fail[*model.Commit](apperror.Wrap(err, "get current version"))
    }
    
    // Prevent rollback to current version
    if targetVersion.Version == currentVersion.Version {
        // RollbackErrorContext provides typed context for rollback errors.
        type RollbackErrorContext struct {
            Version int
        }
        return apperror.Fail[*model.Commit](
            apperror.New("cannot rollback to current version"),
        )
    }
    
    s.logger.InfoContext(context, "starting rollback",
        "spec_id", req.SpecId,
        "from_version", currentVersion.Version,
        "to_version", targetVersion.Version,
    )
    
    // Create rollback commit
    commitReq := model.CreateCommitRequest{
        ProjectId: req.ProjectId,
        Message:   fmt.Sprintf("Rollback to v%d: %s", req.Version, req.Message),
        Changes: []model.ChangeInput{
            {
                SpecId:      req.SpecId,
                Type:        model.ChangeTypeUpdate,
                ContentDiff: targetVersion.Content,
            },
        },
    }
    
    commitResult := s.historyService.CreateCommit(context, commitReq, author)
    if commitResult.HasError() {
        return apperror.Fail[*model.Commit](commitResult.Error())
    }
    
    commit := commitResult.Value()
    
    // Update spec in SpecManager
    if err := s.specClient.UpdateSpecContent(context, req.ProjectId, req.SpecId, targetVersion.Content); err != nil {
        s.logger.ErrorContext(context, "failed to update spec after rollback",
            logging.Err(err),
            "spec_id", req.SpecId,
        )
        // Note: Commit is already recorded, spec update failed
        // This is logged but we still return success for the commit
    }
    
    s.logger.InfoContext(context, "rollback completed",
        "spec_id", req.SpecId,
        "commit_id", commit.Id,
        "to_version", req.Version,
    )
    
    return apperror.OK(commit)
}
```

### ChangelogService

```go
package service

import (
    stdctx "context"
    "fmt"
    "strings"
    
    "github.com/specbuilder/pkg/logging"
    "github.com/specbuilder/pkg/types"
    
    "github.com/specbuilder/internal/chronicle/model"
    "github.com/specbuilder/internal/chronicle/repository"
)

// ChangelogService generates changelogs
type ChangelogService struct {
    commitRepo *repository.CommitRepository
    changeRepo *repository.ChangeRepository
    dbManager  *repository.DBManager
    logger     logging.Logger
}

// GenerateChangelogRequest for generating a changelog
type GenerateChangelogRequest struct {
    ProjectId  types.ProjectId `validate:"required"`
    FromCommit model.CommitId  `validate:"required"`
    ToCommit   model.CommitId  `validate:"required"`
    Title      string          `validate:"required"`
}

// GenerateChangelog creates a changelog between two commits
func (s *ChangelogService) GenerateChangelog(context stdctx.Context, req GenerateChangelogRequest) apperror.Result[*model.Changelog] {
    projectDb, err := s.dbManager.GetProjectDb(context, req.ProjectId)
    if err != nil {
        return apperror.Fail[*model.Changelog](apperror.Wrap(err, "get project db"))
    }
    defer projectDb.Close()
    
    // Get all commits between from and to
    commits, err := s.commitRepo.GetRange(context, projectDb, req.FromCommit, req.ToCommit)
    if err != nil {
        return apperror.Fail[*model.Changelog](apperror.Wrap(err, "get commit range"))
    }
    
    // Group changes by type
    sections := make(map[string][]model.ChangelogItem)
    sectionOrder := []string{"Added", "Changed", "Removed", "Fixed"}
    
    for _, commit := range commits {
        for _, change := range commit.Changes {
            section := changeTypeToSection(change.Type)
            item := model.ChangelogItem{
                SpecId:      change.SpecId,
                ChangeType:  change.Type,
                Description: generateDescription(change),
            }
            sections[section] = append(sections[section], item)
        }
    }
    
    // Build sections in order
    var changelogSections []model.ChangelogSection
    for _, title := range sectionOrder {
        items, isFound := sections[title]
        hasItems := isFound && len(items) > 0

        if hasItems {
            changelogSections = append(changelogSections, model.ChangelogSection{
                Title: title,
                Items: items,
            })
        }
    }
    
    // Generate markdown content
    content := s.generateMarkdown(req.Title, changelogSections)
    
    changelog := &model.Changelog{
        Id:         model.NewChangelogId(),
        ProjectId:  req.ProjectId,
        FromCommit: req.FromCommit,
        ToCommit:   req.ToCommit,
        Title:      req.Title,
        Content:    content,
        Sections:   changelogSections,
        CreatedAt:  types.Now(),
    }
    
    s.logger.InfoContext(context, "changelog generated",
        "project_id", req.ProjectId,
        "from_commit", req.FromCommit,
        "to_commit", req.ToCommit,
        "sections", len(changelogSections),
    )
    
    return apperror.OK(changelog)
}

func (s *ChangelogService) generateMarkdown(title string, sections []model.ChangelogSection) string {
    var sb strings.Builder
    
    sb.WriteString(fmt.Sprintf("# %s\n\n", title))
    
    for _, section := range sections {
        sb.WriteString(fmt.Sprintf("## %s\n\n", section.Title))
        
        for _, item := range section.Items {
            sb.WriteString(fmt.Sprintf("- %s\n", item.Description))
        }
        sb.WriteString("\n")
    }
    
    return sb.String()
}

func changeTypeToSection(changeType model.ChangeType) string {
    switch changeType {
    case model.ChangeTypeCreate:
        return "Added"
    case model.ChangeTypeUpdate:
        return "Changed"
    case model.ChangeTypeDelete:
        return "Removed"
    default:
        return "Changed"
    }
}

func generateDescription(change model.Change) string {
    switch change.Type {
    case model.ChangeTypeCreate:
        return fmt.Sprintf("Added `%s`", change.NewPath)
    case model.ChangeTypeDelete:
        return fmt.Sprintf("Removed `%s`", change.OldPath)
    case model.ChangeTypeRename:
        return fmt.Sprintf("Renamed `%s` to `%s`", change.OldPath, change.NewPath)
    case model.ChangeTypeUpdate:
        return fmt.Sprintf("Updated `%s` (+%d/-%d)", change.NewPath, change.Additions, change.Deletions)
    default:
        return fmt.Sprintf("Modified `%s`", change.NewPath)
    }
}
```

---

## Diff Engine

```go
package diff

import (
    "strings"
    
    "github.com/specbuilder/internal/chronicle/model"
)

// Engine implements diff algorithms
type Engine struct{}

// NewEngine creates a diff engine
func NewEngine() *Engine {
    return &Engine{}
}

// Diff generates diff hunks between two texts
func (e *Engine) Diff(oldText, newText string) []model.DiffHunk {
    oldLines := strings.Split(oldText, "\n")
    newLines := strings.Split(newText, "\n")
    
    // Use Myers diff algorithm (simplified)
    hunks := e.myersDiff(oldLines, newLines)
    
    return hunks
}

// UnifiedDiff generates a unified diff format
func (e *Engine) UnifiedDiff(oldText, newText, oldLabel, newLabel string) string {
    hunks := e.Diff(oldText, newText)
    
    var sb strings.Builder
    sb.WriteString(fmt.Sprintf("--- %s\n", oldLabel))
    sb.WriteString(fmt.Sprintf("+++ %s\n", newLabel))
    
    for _, hunk := range hunks {
        sb.WriteString(fmt.Sprintf("@@ -%d,%d +%d,%d @@\n",
            hunk.OldStart, hunk.OldLines,
            hunk.NewStart, hunk.NewLines,
        ))
        
        for _, line := range hunk.Lines {
            switch line.Type {
            case model.DiffLineContext:
                sb.WriteString(" " + line.Content + "\n")
            case model.DiffLineAddition:
                sb.WriteString("+" + line.Content + "\n")
            case model.DiffLineDeletion:
                sb.WriteString("-" + line.Content + "\n")
            }
        }
    }
    
    return sb.String()
}

// myersDiff implements Myers diff algorithm
func (e *Engine) myersDiff(oldLines, newLines []string) []model.DiffHunk {
    // Simplified implementation
    // Real implementation would use proper Myers algorithm
    
    var hunks []model.DiffHunk
    var currentHunk *model.DiffHunk
    
    maxLen := len(oldLines)
    if len(newLines) > maxLen {
        maxLen = len(newLines)
    }
    
    for i := 0; i < maxLen; i++ {
        var oldLine, newLine string
        hasOld := i < len(oldLines)
        hasNew := i < len(newLines)
        
        if hasOld {
            oldLine = oldLines[i]
        }
        if hasNew {
            newLine = newLines[i]
        }
        
        if hasOld && hasNew && oldLine == newLine {
            // Context line
            if currentHunk != nil {
                currentHunk.Lines = append(currentHunk.Lines, model.DiffLine{
                    Type:    model.DiffLineContext,
                    Content: oldLine,
                    OldNum:  i + 1,
                    NewNum:  i + 1,
                })
            }
        } else {
            // Start new hunk if needed
            if currentHunk == nil {
                currentHunk = &model.DiffHunk{
                    OldStart: i + 1,
                    NewStart: i + 1,
                }
                hunks = append(hunks, *currentHunk)
            }
            
            if hasOld && (!hasNew || oldLine != newLine) {
                currentHunk.Lines = append(currentHunk.Lines, model.DiffLine{
                    Type:    model.DiffLineDeletion,
                    Content: oldLine,
                    OldNum:  i + 1,
                })
                currentHunk.OldLines++
            }
            
            if hasNew && (!hasOld || oldLine != newLine) {
                currentHunk.Lines = append(currentHunk.Lines, model.DiffLine{
                    Type:    model.DiffLineAddition,
                    Content: newLine,
                    NewNum:  i + 1,
                })
                currentHunk.NewLines++
            }
        }
    }
    
    return hunks
}
```

---

## API Endpoints

### History Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects/{projectId}/history` | List commit history |
| GET | `/api/projects/{projectId}/commits/{commitId}` | Get commit details |
| POST | `/api/projects/{projectId}/commits` | Create commit |

### Spec Version Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects/{projectId}/specs/{specId}/history` | List spec versions |
| GET | `/api/projects/{projectId}/specs/{specId}/versions/{version}` | Get specific version |
| GET | `/api/projects/{projectId}/specs/{specId}/at?timestamp=` | Get version at time |

### Diff Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects/{projectId}/specs/{specId}/diff?from=&to=` | Compare versions |
| GET | `/api/projects/{projectId}/commits/{commitId}/diff` | Get commit diff |

### Rollback Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/projects/{projectId}/specs/{specId}/rollback` | Rollback to version |

### Changelog Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/projects/{projectId}/changelog/generate` | Generate changelog |
| GET | `/api/projects/{projectId}/changelogs` | List changelogs |

---

## Database Migrations

```sql
-- 001_create_chronicle.up.sql

-- Commits table
CREATE TABLE Commits (
    Id          TEXT PRIMARY KEY,
    ProjectId   TEXT NOT NULL,
    ParentId    TEXT,
    Message     TEXT NOT NULL,
    AuthorId    TEXT,
    AuthorName  TEXT NOT NULL,
    AuthorEmail TEXT,
    GitHash     TEXT,
    GitBranch   TEXT,
    Metadata    TEXT DEFAULT '{}',
    CreatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ParentId) REFERENCES Commits(Id)
);

CREATE INDEX IdxCommitsProject ON Commits(ProjectId);
CREATE INDEX IdxCommitsParent ON Commits(ParentId);
CREATE INDEX IdxCommitsCreated ON Commits(CreatedAt DESC);
CREATE INDEX IdxCommitsGit ON Commits(GitHash) WHERE GitHash IS NOT NULL;

-- Changes table
CREATE TABLE Changes (
    Id          TEXT PRIMARY KEY,
    CommitId    TEXT NOT NULL,
    SpecId      TEXT NOT NULL,
    Type        TEXT NOT NULL,
    OldContent  TEXT,
    NewContent  TEXT,
    OldHash     TEXT,
    NewHash     TEXT,
    OldPath     TEXT,
    NewPath     TEXT,
    Additions   INTEGER DEFAULT 0,
    Deletions   INTEGER DEFAULT 0,
    CreatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (CommitId) REFERENCES Commits(Id)
);

CREATE INDEX IdxChangesCommit ON Changes(CommitId);
CREATE INDEX IdxChangesSpec ON Changes(SpecId);
CREATE INDEX IdxChangesType ON Changes(Type);

-- Spec versions table
CREATE TABLE SpecVersions (
    Id          TEXT PRIMARY KEY,
    SpecId      TEXT NOT NULL,
    CommitId    TEXT NOT NULL,
    Version     INTEGER NOT NULL,
    Content     TEXT NOT NULL,
    ContentHash TEXT NOT NULL,
    Path        TEXT NOT NULL,
    Metadata    TEXT DEFAULT '{}',
    CreatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CreatedBy   TEXT,
    
    FOREIGN KEY (CommitId) REFERENCES Commits(Id)
);

CREATE UNIQUE INDEX IdxSpecVersionsUnique ON SpecVersions(SpecId, Version);
CREATE INDEX IdxSpecVersionsSpec ON SpecVersions(SpecId);
CREATE INDEX IdxSpecVersionsCommit ON SpecVersions(CommitId);
CREATE INDEX IdxSpecVersionsCreated ON SpecVersions(CreatedAt);

-- Changelogs table
CREATE TABLE Changelogs (
    Id          TEXT PRIMARY KEY,
    ProjectId   TEXT NOT NULL,
    FromCommit  TEXT NOT NULL,
    ToCommit    TEXT NOT NULL,
    Title       TEXT NOT NULL,
    Content     TEXT NOT NULL,
    Sections    TEXT DEFAULT '[]',  -- JSON array
    CreatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (FromCommit) REFERENCES Commits(Id),
    FOREIGN KEY (ToCommit) REFERENCES Commits(Id)
);

CREATE INDEX IdxChangelogsProject ON Changelogs(ProjectId);
CREATE INDEX IdxChangelogsRange ON Changelogs(FromCommit, ToCommit);
```

---

## Configuration

```yaml
# chronicle/config.yaml
environment: development

server:
  host: "0.0.0.0"
  port: 8083
  read_timeout: 30s
  write_timeout: 30s

database:
  project_data_dir: "./data/projects"

logging:
  level: debug
  format: json
  add_source: true  # MANDATORY

services:
  specmgr:
    host: localhost
    port: 8081
    timeout: 30s

history:
  max_versions_per_spec: 1000
  prune_after_days: 365

diff:
  context_lines: 3
  max_file_size: 1048576  # 1MB

changelog:
  default_format: "markdown"
```

---

## Related Specifications

- [Phase 1: Shared Packages](../13-shared-packages/00-overview.md)
- [Phase 2: Gateway](./01-gateway.md)
- [Phase 3: SpecManager](./02-specmanager.md)
- [Phase 5: AI-Bridge](./04-ai-bridge.md)
