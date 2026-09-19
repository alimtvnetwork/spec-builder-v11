# Phase 3: SpecManager Service Specification

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  
**Phase:** 3 of 9  
**Service:** `specmgr`  
**Port:** 8081  

---

## Overview

The SpecManager Service handles all specification and project CRUD operations, file management, validation, and maintains data integrity. It's the primary data management service for SpecBuilder Pro.

**Cross-References:**
- [Shared Packages](../13-shared-packages/00-overview.md)
- [Database Design](../07-database-design/00-overview.md)
- [Gateway Service](./01-gateway.md)

---

## Responsibilities

- **Project Management**: Create, read, update, delete projects
- **Spec Management**: Full CRUD for specifications
- **File Operations**: Safe file read/write with validation
- **Path Safety**: SSRF and path traversal prevention
- **Validation**: Schema and content validation
- **Indexing**: Maintain project/spec index in projects.db

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        SpecManager :8081                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                      HTTP Handlers                               │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │ │
│  │  │ProjectHandler│ │ SpecHandler  │ │    FileHandler           │ │ │
│  │  └──────────────┘ └──────────────┘ └──────────────────────────┘ │ │
│  └────────────────────────────┬────────────────────────────────────┘ │
│                               │                                       │
│  ┌────────────────────────────┴────────────────────────────────────┐ │
│  │                       Service Layer                              │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │ │
│  │  │ProjectService│ │ SpecService  │ │    FileService           │ │ │
│  │  └──────────────┘ └──────────────┘ └──────────────────────────┘ │ │
│  └────────────────────────────┬────────────────────────────────────┘ │
│                               │                                       │
│  ┌────────────────────────────┴────────────────────────────────────┐ │
│  │                     Repository Layer                             │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │ │
│  │  │ ProjectRepo  │ │  SpecRepo    │ │    PathValidator         │ │ │
│  │  └──────────────┘ └──────────────┘ └──────────────────────────┘ │ │
│  └────────────────────────────┬────────────────────────────────────┘ │
│                               │                                       │
│  ┌────────────────────────────┴────────────────────────────────────┐ │
│  │                      Database Layer                              │ │
│  │  ┌──────────────────┐ ┌──────────────────────────────────────┐  │ │
│  │  │   projects.db    │ │   {project-id}/project.db            │  │ │
│  │  │   (Global)       │ │   (Per-Project)                      │  │ │
│  │  └──────────────────┘ └──────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
cmd/specmgr/
├── main.go
└── config.yaml

internal/specmgr/
├── server/
│   ├── server.go
│   └── routes.go
├── handler/
│   ├── project.go          # Project HTTP handlers
│   ├── spec.go             # Spec HTTP handlers
│   ├── file.go             # File HTTP handlers
│   └── validation.go       # Request validation
├── service/
│   ├── project.go          # Project business logic
│   ├── spec.go             # Spec business logic
│   ├── file.go             # File operations
│   └── validation.go       # Content validation
├── repository/
│   ├── project.go          # Project data access
│   ├── spec.go             # Spec data access
│   └── dbmanager.go        # Multi-database management
├── model/
│   ├── project.go          # Project domain model
│   ├── spec.go             # Spec domain model
│   └── file.go             # File domain model
├── security/
│   ├── pathvalidator.go    # Path traversal prevention
│   └── ssrf.go             # SSRF prevention
└── migrations/
    ├── projects/           # projects.db migrations
    └── project/            # project.db migrations
```

---

## Domain Models

### Project Model

```go
package model

import (
    "github.com/specbuilder/pkg/types"
)

// Project represents a specification project
type Project struct {
    Id          types.ProjectId
    Name        string
    Description string
    Path        string           // Root directory path
    Status      types.Status
    Tags        types.Tags
    Metadata    types.Metadata
    SpecCount   int              // Denormalized count
    Timestamps  types.Timestamps
    Version     types.Versioned
}

// CreateProjectRequest for creating a project
type CreateProjectRequest struct {
    Name        string          `validate:"required,min=1,max=255"`
    Description string          `validate:"max=2000"`
    Path        string          `validate:"required,safepath"`
    Tags        []string        `validate:"max=20,dive,max=50"`
    Metadata    json.RawMessage
}

// UpdateProjectRequest for updating a project
type UpdateProjectRequest struct {
    Name        *string         `validate:"omitempty,min=1,max=255"`
    Description *string         `validate:"omitempty,max=2000"`
    Status      *types.Status   `validate:"omitempty,oneof=DRAFT ACTIVE ARCHIVED"`
    Tags        []string        `validate:"omitempty,max=20,dive,max=50"`
    Metadata    json.RawMessage
}
```

### Spec Model

```go
package model

import (
    "github.com/specbuilder/pkg/types"
)

// SpecType represents the type of specification
type SpecType string

const (
    SpecTypeFeature     SpecType = "FEATURE"
    SpecTypeApi         SpecType = "API"
    SpecTypeDatabase    SpecType = "DATABASE"
    SpecTypeDiagram     SpecType = "DIAGRAM"
    SpecTypeGuideline   SpecType = "GUIDELINE"
    SpecTypeOverview    SpecType = "OVERVIEW"
    SpecTypePrompt      SpecType = "PROMPT"
    SpecTypeResearch    SpecType = "RESEARCH"
)

// Spec represents a specification document
type Spec struct {
    Id          types.SpecId
    ProjectId   types.ProjectId
    Name        string
    Title       string
    Path        string           // Relative to project root
    Type        SpecType
    Status      types.Status
    Priority    types.Priority
    Content     string           // Markdown content
    ContentHash string           // SHA-256 of content
    WordCount   int
    Tags        types.Tags
    Metadata    types.Metadata
    
    // Cross-references
    References  []types.SpecId   // Specs this references
    ReferencedBy []types.SpecId  // Specs referencing this
    
    Timestamps  types.Timestamps
    Version     types.Versioned
}

// CreateSpecRequest for creating a spec
type CreateSpecRequest struct {
    ProjectId   types.ProjectId `validate:"required"`
    Name        string          `validate:"required,min=1,max=255"`
    Title       string          `validate:"required,min=1,max=500"`
    Path        string          `validate:"required,safepath,endswith=.md"`
    Type        SpecType        `validate:"required"`
    Priority    types.Priority
    Content     string          `validate:"required"`
    Tags        []string        `validate:"max=20,dive,max=50"`
    Metadata    json.RawMessage
}

// UpdateSpecRequest for updating a spec
type UpdateSpecRequest struct {
    Title      *string         `validate:"omitempty,min=1,max=500"`
    Content    *string
    Type       *SpecType
    Status     *types.Status
    Priority   *types.Priority
    Tags       []string        `validate:"omitempty,max=20,dive,max=50"`
    Metadata   json.RawMessage
}

// SpecVersion represents a version snapshot
type SpecVersion struct {
    Id          types.SpecId
    SpecId      types.SpecId
    Version     int
    Content     string
    ContentHash string
    ChangedBy   *types.UserId   `json:",omitempty"`
    ChangeNote  string
    CreatedAt   types.Timestamp
}
```

---

## Service Layer

### ProjectService

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
    
    "github.com/specbuilder/internal/specmgr/model"
    "github.com/specbuilder/internal/specmgr/repository"
    "github.com/specbuilder/internal/specmgr/security"
)

// ProjectService handles project business logic
type ProjectService struct {
    projectRepo  *repository.ProjectRepository
    pathValidator *security.PathValidator
    dbManager    *repository.DBManager
    logger       logging.Logger
}

// NewProjectService creates a project service
func NewProjectService(
    projectRepo *repository.ProjectRepository,
    pathValidator *security.PathValidator,
    dbManager *repository.DBManager,
    logger logging.Logger,
) *ProjectService {
    return &ProjectService{
        projectRepo:   projectRepo,
        pathValidator: pathValidator,
        dbManager:     dbManager,
        logger:        logger,
    }
}

// CreateProject creates a new project
// --- Typed Error Context Structs (no map[string]any) ---

type PathErrorContext struct {
    Path string
}

type PathPatternErrorContext struct {
    Pattern string
    Path    string
}

type PathWithRootsErrorContext struct {
    Path         string
    AllowedRoots []string
}

type EnumErrorContext struct {
    Value string
}

func (s *ProjectService) CreateProject(context stdctx.Context, req model.CreateProjectRequest) appfault.Result[model.Project] {
    // CRITICAL: Validate path is safe (no traversal, allowed directory)
    if err := s.pathValidator.ValidatePath(req.Path); err != nil {
        s.logger.WarnContext(context, "invalid project path",
            logging.Err(err),
            "path", req.Path,
        )
        return nil, errors.NewSecurity(
            errors.ErrSecurityPathTraversal,
            "invalid project path",
            PathErrorContext{Path: req.Path},
        ).WithCause(err)
    }
    
    // Check for duplicate name
    existing, err := s.projectRepo.GetByName(context, req.Name)
    if err == nil && existing != nil {
        return nil, errors.NewDatabaseDuplicate("Project", "name", req.Name)
    }
    
    // Create project
    project := &model.Project{
        Id:          types.NewProjectId(),
        Name:        req.Name,
        Description: req.Description,
        Path:        req.Path,
        Status:      types.StatusDraft,
        Tags:        req.Tags,
        Metadata:    req.Metadata,
        SpecCount:   0,
        Timestamps:  types.NewTimestamps(),
        Version:     types.NewVersioned(),
    }
    
    // Create project in global DB
    if err := s.projectRepo.Create(context, project); err != nil {
        s.logger.ErrorContext(context, "failed to create project",
            logging.Err(err),
            "projectName", req.Name,
        )
        return nil, err
    }
    
    // Initialize project-specific database
    if err := s.dbManager.InitProjectDb(context, project.Id, project.Path); err != nil {
        s.logger.ErrorContext(context, "failed to init project database",
            logging.Err(err),
            "projectId", project.Id,
        )
        // Rollback project creation
        s.projectRepo.Delete(context, project.Id)
        return nil, err
    }
    
    s.logger.InfoContext(context, "project created",
        "projectId", project.Id,
        "projectName", project.Name,
        "path", project.Path,
    )
    
    return project, nil
}

// GetProject retrieves a project by ID
func (s *ProjectService) GetProject(context stdctx.Context, id types.ProjectId) appfault.Result[model.Project] {
    project, err := s.projectRepo.GetById(context, id)
    if err != nil {
        s.logger.DebugContext(context, "project not found",
            "projectId", id,
        )
        return nil, err
    }
    
    return project, nil
}

// ListProjects lists all projects with pagination
func (s *ProjectService) ListProjects(context stdctx.Context, req types.PageRequest) appfault.Result[types.PageResponse[model.Project]] {
    projects, total, err := s.projectRepo.List(context, req)
    if err != nil {
        return nil, err
    }
    
    response := types.NewPageResponse(projects, req, total)
    return &response, nil
}

// UpdateProject updates a project
func (s *ProjectService) UpdateProject(context stdctx.Context, id types.ProjectId, req model.UpdateProjectRequest) appfault.Result[model.Project] {
    project, err := s.projectRepo.GetById(context, id)
    if err != nil {
        return nil, err
    }
    
    // Apply updates
    if req.Name != nil {
        project.Name = *req.Name
    }
    if req.Description != nil {
        project.Description = *req.Description
    }
    if req.Status != nil {
        if err := req.Status.Validate(); err != nil {
            return nil, errors.NewValidation(
                errors.ErrValidationEnum,
                "invalid status",
                EnumErrorContext{Value: string(*req.Status)},
            )
        }
        project.Status = *req.Status
    }
    if req.Tags != nil {
        project.Tags = req.Tags
    }
    if req.Metadata != nil {
        project.Metadata = req.Metadata
    }
    
    project.Timestamps.Touch()
    project.Version.Increment(nil) // TODO: Get user ID from context
    
    if err := s.projectRepo.Update(context, project); err != nil {
        return nil, err
    }
    
    s.logger.InfoContext(context, "project updated",
        "projectId", id,
        "version", project.Version.Version,
    )
    
    return project, nil
}

// DeleteProject deletes a project
func (s *ProjectService) DeleteProject(context stdctx.Context, id types.ProjectId) error {
    project, err := s.projectRepo.GetById(context, id)
    if err != nil {
        return err
    }
    
    // Soft delete
    project.Timestamps.SoftDelete()
    project.Status = types.StatusDeleted
    
    if err := s.projectRepo.Update(context, project); err != nil {
        return err
    }
    
    s.logger.InfoContext(context, "project deleted",
        "projectId", id,
    )
    
    return nil
}
```

### SpecService

```go
package service

import (
    stdctx "context"
    "crypto/sha256"
    "encoding/hex"
    "strings"
    "unicode/utf8"
    
    "github.com/specbuilder/pkg/database"
    "github.com/specbuilder/pkg/errors"
    "github.com/specbuilder/pkg/logging"
    "github.com/specbuilder/pkg/types"
    
    "github.com/specbuilder/internal/specmgr/model"
    "github.com/specbuilder/internal/specmgr/repository"
    "github.com/specbuilder/internal/specmgr/security"
)

// SpecService handles spec business logic
type SpecService struct {
    specRepo      *repository.SpecRepository
    projectRepo   *repository.ProjectRepository
    fileService   *FileService
    pathValidator *security.PathValidator
    dbManager     *repository.DBManager
    logger        logging.Logger
}

// NewSpecService creates a spec service
func NewSpecService(
    specRepo *repository.SpecRepository,
    projectRepo *repository.ProjectRepository,
    fileService *FileService,
    pathValidator *security.PathValidator,
    dbManager *repository.DBManager,
    logger logging.Logger,
) *SpecService {
    return &SpecService{
        specRepo:      specRepo,
        projectRepo:   projectRepo,
        fileService:   fileService,
        pathValidator: pathValidator,
        dbManager:     dbManager,
        logger:        logger,
    }
}

// CreateSpec creates a new specification
func (s *SpecService) CreateSpec(context stdctx.Context, req model.CreateSpecRequest) appfault.Result[model.Spec] {
    // Verify project exists
    project, err := s.projectRepo.GetById(context, req.ProjectId)
    if err != nil {
        return nil, err
    }
    
    // CRITICAL: Validate path is safe
    fullPath := filepath.Join(project.Path, req.Path)
    if err := s.pathValidator.ValidatePath(fullPath); err != nil {
        s.logger.WarnContext(context, "invalid spec path",
            logging.Err(err),
            "path", req.Path,
            "projectId", req.ProjectId,
        )
        return nil, errors.NewSecurity(
            errors.ErrSecurityPathTraversal,
            "invalid spec path",
            PathErrorContext{Path: req.Path},
        ).WithCause(err)
    }
    
    // Validate spec type
    if err := req.Type.Validate(); err != nil {
        return nil, errors.NewValidation(
            errors.ErrValidationEnum,
            "invalid spec type",
            EnumErrorContext{Value: string(req.Type)},
        )
    }
    
    // Compute content hash
    hash := sha256.Sum256([]byte(req.Content))
    contentHash := hex.EncodeToString(hash[:])
    
    // Count words
    wordCount := countWords(req.Content)
    
    // Set default priority
    priority := req.Priority
    if priority == "" {
        priority = types.PriorityMedium
    }
    
    // Create spec
    spec := &model.Spec{
        Id:          types.NewSpecId(),
        ProjectId:   req.ProjectId,
        Name:        req.Name,
        Title:       req.Title,
        Path:        req.Path,
        Type:        req.Type,
        Status:      types.StatusDraft,
        Priority:    priority,
        Content:     req.Content,
        ContentHash: contentHash,
        WordCount:   wordCount,
        Tags:        req.Tags,
        Metadata:    req.Metadata,
        References:  []types.SpecId{},
        ReferencedBy: []types.SpecId{},
        Timestamps:  types.NewTimestamps(),
        Version:     types.NewVersioned(),
    }
    
    // Get project database
    projectDb, err := s.dbManager.GetProjectDb(context, req.ProjectId)
    if err != nil {
        return nil, err
    }
    defer projectDb.Close()
    
    // Use transaction for consistency
    err = projectDb.WithTx(context, func(tx *database.Tx) error {
        // Create spec in database
        if err := s.specRepo.CreateWithTx(context, tx, spec); err != nil {
            return err
        }
        
        // Write file to disk
        if err := s.fileService.WriteSpec(context, project.Path, spec); err != nil {
            return err // Transaction will rollback
        }
        
        return nil
    })
    
    if err != nil {
        s.logger.ErrorContext(context, "failed to create spec",
            logging.Err(err),
            "projectId", req.ProjectId,
            "specName", req.Name,
        )
        return nil, err
    }
    
    // Update project spec count
    s.projectRepo.IncrementSpecCount(context, req.ProjectId, 1)
    
    s.logger.InfoContext(context, "spec created",
        "specId", spec.Id,
        "projectId", req.ProjectId,
        "path", req.Path,
        "wordCount", wordCount,
    )
    
    return spec, nil
}

// GetSpec retrieves a spec by ID
func (s *SpecService) GetSpec(context stdctx.Context, projectId types.ProjectId, specId types.SpecId) appfault.Result[model.Spec] {
    projectDb, err := s.dbManager.GetProjectDb(context, projectId)
    if err != nil {
        return nil, err
    }
    defer projectDb.Close()
    
    spec, err := s.specRepo.GetByIdWithDb(context, projectDb, specId)
    if err != nil {
        s.logger.DebugContext(context, "spec not found",
            "projectId", projectId,
            "specId", specId,
        )
        return nil, err
    }
    
    return spec, nil
}

// UpdateSpec updates a spec
func (s *SpecService) UpdateSpec(context stdctx.Context, projectId types.ProjectId, specId types.SpecId, req model.UpdateSpecRequest) appfault.Result[model.Spec] {
    project, err := s.projectRepo.GetById(context, projectId)
    if err != nil {
        return nil, err
    }
    
    projectDb, err := s.dbManager.GetProjectDb(context, projectId)
    if err != nil {
        return nil, err
    }
    defer projectDb.Close()
    
    spec, err := s.specRepo.GetByIdWithDb(context, projectDb, specId)
    if err != nil {
        return nil, err
    }
    
    // Apply updates
    contentChanged := false
    
    if req.Title != nil {
        spec.Title = *req.Title
    }
    if req.Content != nil {
        spec.Content = *req.Content
        hash := sha256.Sum256([]byte(*req.Content))
        spec.ContentHash = hex.EncodeToString(hash[:])
        spec.WordCount = countWords(*req.Content)
        contentChanged = true
    }
    if req.Type != nil {
        if err := req.Type.Validate(); err != nil {
            return nil, errors.NewValidation(
                errors.ErrValidationEnum,
                "invalid spec type",
                EnumErrorContext{Value: string(*req.Type)},
            )
        }
        spec.Type = *req.Type
    }
    if req.Status != nil {
        if err := req.Status.Validate(); err != nil {
            return nil, errors.NewValidation(
                errors.ErrValidationEnum,
                "invalid status",
                EnumErrorContext{Value: string(*req.Status)},
            )
        }
        spec.Status = *req.Status
    }
    if req.Priority != nil {
        if err := req.Priority.Validate(); err != nil {
            return nil, errors.NewValidation(
                errors.ErrValidationEnum,
                "invalid priority",
                EnumErrorContext{Value: string(*req.Priority)},
            )
        }
        spec.Priority = *req.Priority
    }
    if req.Tags != nil {
        spec.Tags = req.Tags
    }
    if req.Metadata != nil {
        spec.Metadata = req.Metadata
    }
    
    spec.Timestamps.Touch()
    spec.Version.Increment(nil)
    
    // Use transaction
    err = projectDb.WithTx(context, func(tx *database.Tx) error {
        // Save version before updating (for history)
        if contentChanged {
            if err := s.specRepo.SaveVersionWithTx(context, tx, spec); err != nil {
                return err
            }
        }
        
        // Update in database
        if err := s.specRepo.UpdateWithTx(context, tx, spec); err != nil {
            return err
        }
        
        // Update file on disk
        if contentChanged {
            if err := s.fileService.WriteSpec(context, project.Path, spec); err != nil {
                return err
            }
        }
        
        return nil
    })
    
    if err != nil {
        s.logger.ErrorContext(context, "failed to update spec",
            logging.Err(err),
            "specId", specId,
        )
        return nil, err
    }
    
    s.logger.InfoContext(context, "spec updated",
        "specId", specId,
        "version", spec.Version.Version,
        "contentChanged", contentChanged,
    )
    
    return spec, nil
}

// DeleteSpec soft-deletes a spec
func (s *SpecService) DeleteSpec(context stdctx.Context, projectId types.ProjectId, specId types.SpecId) error {
    projectDb, err := s.dbManager.GetProjectDb(context, projectId)
    if err != nil {
        return err
    }
    defer projectDb.Close()
    
    spec, err := s.specRepo.GetByIdWithDb(context, projectDb, specId)
    if err != nil {
        return err
    }
    
    spec.Timestamps.SoftDelete()
    spec.Status = types.StatusDeleted
    
    if err := s.specRepo.UpdateWithDb(context, projectDb, spec); err != nil {
        return err
    }
    
    // Decrement project spec count
    s.projectRepo.IncrementSpecCount(context, projectId, -1)
    
    s.logger.InfoContext(context, "spec deleted",
        "specId", specId,
        "projectId", projectId,
    )
    
    return nil
}

// ListSpecs lists specs in a project
func (s *SpecService) ListSpecs(context stdctx.Context, projectId types.ProjectId, req types.PageRequest) appfault.Result[types.PageResponse[model.Spec]] {
    projectDb, err := s.dbManager.GetProjectDb(context, projectId)
    if err != nil {
        return nil, err
    }
    defer projectDb.Close()
    
    specs, total, err := s.specRepo.ListWithDb(context, projectDb, req)
    if err != nil {
        return nil, err
    }
    
    response := types.NewPageResponse(specs, req, total)
    return &response, nil
}

func countWords(content string) int {
    return len(strings.Fields(content))
}
```

---

## Security: Path Validation

```go
package security

import (
    "net"
    "net/url"
    "os"
    "path/filepath"
    "strings"
    
    "github.com/specbuilder/pkg/errors"
)

// PathValidator validates file paths for security
type PathValidator struct {
    allowedRoots   []string
    blockedPatterns []string
}

// NewPathValidator creates a path validator
func NewPathValidator(allowedRoots []string) *PathValidator {
    return &PathValidator{
        allowedRoots: allowedRoots,
        blockedPatterns: []string{
            "..",
            "~",
            "$",
            "`",
            "|",
            ";",
            "&",
            "\\",
        },
    }
}

// ValidatePath ensures path is safe
func (v *PathValidator) ValidatePath(path string) error {
    // Check for blocked patterns
    for _, pattern := range v.blockedPatterns {
        if strings.Contains(path, pattern) {
            return errors.NewSecurity(
                errors.ErrSecurityPathTraversal,
                "path contains blocked pattern",
                PathPatternErrorContext{Pattern: pattern, Path: path},
            )
        }
    }
    
    // Clean and normalize the path
    cleanPath := filepath.Clean(path)
    
    // Ensure path is absolute
    absPath, err := filepath.Abs(cleanPath)
    if err != nil {
        return errors.NewSecurity(
            errors.ErrSecurityPathTraversal,
            "invalid path",
            PathErrorContext{Path: path},
        ).WithCause(err)
    }
    
    // Check path is within allowed roots
    allowed := false
    for _, root := range v.allowedRoots {
        absRoot, err := filepath.Abs(root)
        if err != nil {
            continue
        }
        if strings.HasPrefix(absPath, absRoot) {
            allowed = true
            break
        }
    }
    
    if !allowed {
        return errors.NewSecurity(
            errors.ErrSecurityPathTraversal,
            "path outside allowed directories",
            PathWithRootsErrorContext{
                Path:         path,
                AllowedRoots: v.allowedRoots,
            },
        )
    }
    
    return nil
}

// ValidateSpecPath validates a spec file path
func (v *PathValidator) ValidateSpecPath(projectRoot, specPath string) error {
    // Spec path must be relative
    if filepath.IsAbs(specPath) {
        return errors.NewValidation(
            errors.ErrValidationFormat,
            "spec path must be relative",
            PathErrorContext{Path: specPath},
        )
    }
    
    // Must end with .md
    if stringutil.IsMissingSuffix(strings.ToLower(specPath), ".md") {
        return errors.NewValidation(
            errors.ErrValidationFormat,
            "spec path must end with .md",
            PathErrorContext{Path: specPath},
        )
    }
    
    // Full path validation
    fullPath := filepath.Join(projectRoot, specPath)
    return v.ValidatePath(fullPath)
}
```

---

## API Endpoints

### Project Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List projects |
| GET | `/api/projects/{id}` | Get project |
| PUT | `/api/projects/{id}` | Update project |
| DELETE | `/api/projects/{id}` | Delete project |

### Spec Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/projects/{projectId}/specs` | Create spec |
| GET | `/api/projects/{projectId}/specs` | List specs |
| GET | `/api/projects/{projectId}/specs/{specId}` | Get spec |
| PUT | `/api/projects/{projectId}/specs/{specId}` | Update spec |
| DELETE | `/api/projects/{projectId}/specs/{specId}` | Delete spec |
| GET | `/api/projects/{projectId}/specs/{specId}/versions` | List versions |

---

## Database Migrations

### projects.db Migration

```sql
-- 001_create_projects.up.sql
CREATE TABLE Projects (
    Id          TEXT PRIMARY KEY,
    Name        TEXT NOT NULL UNIQUE,
    Description TEXT,
    Path        TEXT NOT NULL,
    Status      TEXT NOT NULL DEFAULT 'DRAFT',
    Tags        TEXT DEFAULT '[]',      -- JSON array
    Metadata    TEXT DEFAULT '{}',      -- JSON object
    SpecCount   INTEGER DEFAULT 0,
    CreatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    DeletedAt   DATETIME,
    Version     INTEGER DEFAULT 1,
    UpdatedBy   TEXT
);

CREATE INDEX IdxProjectsName ON Projects(Name);
CREATE INDEX IdxProjectsStatus ON Projects(Status) WHERE DeletedAt IS NULL;
CREATE INDEX IdxProjectsDeleted ON Projects(DeletedAt);
```

### project.db Migration

```sql
-- 001_create_specs.up.sql
CREATE TABLE Specs (
    Id          TEXT PRIMARY KEY,
    ProjectId   TEXT NOT NULL,
    Name        TEXT NOT NULL,
    Title       TEXT NOT NULL,
    Path        TEXT NOT NULL,
    Type        TEXT NOT NULL,
    Status      TEXT NOT NULL DEFAULT 'DRAFT',
    Priority    TEXT NOT NULL DEFAULT 'MEDIUM',
    Content     TEXT NOT NULL,
    ContentHash TEXT NOT NULL,
    WordCount   INTEGER DEFAULT 0,
    Tags        TEXT DEFAULT '[]',
    Metadata    TEXT DEFAULT '{}',
    References  TEXT DEFAULT '[]',
    ReferencedBy TEXT DEFAULT '[]',
    CreatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    DeletedAt   DATETIME,
    Version     INTEGER DEFAULT 1,
    UpdatedBy   TEXT
);

CREATE UNIQUE INDEX IdxSpecsPath ON Specs(ProjectId, Path) WHERE DeletedAt IS NULL;
CREATE INDEX IdxSpecsType ON Specs(Type) WHERE DeletedAt IS NULL;
CREATE INDEX IdxSpecsStatus ON Specs(Status) WHERE DeletedAt IS NULL;
CREATE INDEX IdxSpecsDeleted ON Specs(DeletedAt);

-- FTS for content search
CREATE VIRTUAL TABLE SpecsFTS USING fts5(
    Id,
    Name,
    Title,
    Content,
    Tags,
    content='Specs',
    content_rowid='rowid'
);

CREATE TRIGGER specs_ai AFTER INSERT ON Specs BEGIN
    INSERT INTO SpecsFTS(rowid, Id, Name, Title, Content, Tags)
    VALUES (new.rowid, new.Id, new.Name, new.Title, new.Content, new.Tags);
END;

CREATE TRIGGER specs_ad AFTER DELETE ON Specs BEGIN
    INSERT INTO SpecsFTS(SpecsFTS, rowid, Id, Name, Title, Content, Tags)
    VALUES ('delete', old.rowid, old.Id, old.Name, old.Title, old.Content, old.Tags);
END;

CREATE TRIGGER specs_au AFTER UPDATE ON Specs BEGIN
    INSERT INTO SpecsFTS(SpecsFTS, rowid, Id, Name, Title, Content, Tags)
    VALUES ('delete', old.rowid, old.Id, old.Name, old.Title, old.Content, old.Tags);
    INSERT INTO SpecsFTS(rowid, Id, Name, Title, Content, Tags)
    VALUES (new.rowid, new.Id, new.Name, new.Title, new.Content, new.Tags);
END;

-- Version history
CREATE TABLE SpecVersions (
    Id          TEXT PRIMARY KEY,
    SpecId      TEXT NOT NULL,
    Version     INTEGER NOT NULL,
    Content     TEXT NOT NULL,
    ContentHash TEXT NOT NULL,
    ChangedBy   TEXT,
    ChangeNote  TEXT,
    CreatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (SpecId) REFERENCES Specs(Id)
);

CREATE INDEX IdxSpecVersions ON SpecVersions(SpecId, Version);
```

---

## Configuration

```yaml
# specmgr/config.yaml
environment: development

server:
  host: "0.0.0.0"
  port: 8081
  read_timeout: 30s
  write_timeout: 30s

database:
  projects_path: "./data/projects.db"
  project_data_dir: "./data/projects"
  auto_migrate: true

logging:
  level: debug
  format: json
  add_source: true  # MANDATORY

security:
  allowed_roots:
    - "./data/projects"
    - "/home/specbuilder/projects"
  max_file_size: 10485760  # 10MB
  allowed_extensions:
    - ".md"
    - ".yaml"
    - ".json"

validation:
  max_name_length: 255
  max_title_length: 500
  max_content_length: 1048576  # 1MB
  max_tags: 20
  max_tag_length: 50
```

---

## Related Specifications

- [Phase 1: Shared Packages](../13-shared-packages/00-overview.md)
- [Phase 2: Gateway](./01-gateway.md)
- [Phase 4: Chronicle](./03-chronicle.md)
