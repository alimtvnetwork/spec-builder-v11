# File Operations Specification

> **Version:** 3.0.0  
> **Last Updated:** 2026-03-09  
> **Status:** Complete  

---

## 4.1 Overview

This document specifies the file operations system for the Spec Management Software. It covers CRUD operations for spec files, path validation, content management, and directory operations.

**Key Responsibilities:**
- Create, read, update, delete spec files
- Validate file paths and names
- Manage directory structures
- Handle file content encoding
- Trigger snapshot creation on changes

**Cross-References:**
- [Database Schema](../../07-database-design/01-schema.md) - File table structure
- [API Endpoints](../24-code-generation-system/13-api-endpoints.md) - REST interface
- [History System](../07-history-system/02-history-system.md) - Snapshot triggers
- [Git Integration](../07-history-system/01-git-integration.md) - Commit automation
- [PathManager](./02-path-manager.md) - Path validation and workDirectory management
- [RAG System](../09-knowledge-memory/01-rag-system.md) - Artifact indexing for ideas/instructions

---

## 4.2 File Path Conventions

### 4.2.1 Path Structure

All file paths are **relative to the project's workDirectory** as managed by the [PathManager](./02-path-manager.md).

> **IMPORTANT**: All paths stored in the database MUST be relative paths. The PathManager converts between absolute filesystem paths and relative database paths.

```
{workDirectory}/
└── {ProjectSlug}/
    ├── spec/
    │   ├── 00-overview.md
    │   ├── 01-feature/
    │   │   ├── 01-requirements.md
    │   │   └── 02-implementation.md
    │   └── 99-glossary.md
    ├── ideas/
    │   ├── README.md
    │   ├── 01-idea-feature-concept.md
    │   ├── 02-idea-api-design.md
    │   └── 03-idea-ux-improvements.md
    ├── instructions/
    │   ├── README.md
    │   ├── 01-instruction-feature-spec.md
    │   └── 02-instruction-api-endpoints.md
    └── .history/
        └── snapshots/
```

### 4.2.2 Ideas and Instructions Folders

The `ideas/` and `instructions/` folders are special directories used by the [RAG system](../09-knowledge-memory/01-rag-system.md):

| Folder | Purpose | Naming Pattern | Indexed |
|--------|---------|----------------|---------|
| `ideas/` | Raw ideas from voice/text input | `{nn}-idea-{slug}.md` | Yes |
| `instructions/` | Promoted, refined instructions | `{nn}-instruction-{slug}.md` | Yes |

**Idea Lifecycle:**
1. Voice/text input saved as idea in `ideas/` folder
2. Idea is indexed by RAG system for retrieval
3. When refined, idea is **promoted** to `instructions/` folder
4. Promotion creates new file, updates RAG index, and links via `PromotionEvent`

**File Naming for Ideas/Instructions:**

```go
// IdeaFilenamePattern matches idea files
var IdeaFilenamePattern = regexp.MustCompile(`^(\d{2})-idea-([a-z0-9]+(-[a-z0-9]+)*)\.md$`)

// InstructionFilenamePattern matches instruction files  
var InstructionFilenamePattern = regexp.MustCompile(`^(\d{2})-instruction-([a-z0-9]+(-[a-z0-9]+)*)\.md$`)

// Examples:
// Valid:   01-idea-api-design.md, 02-instruction-user-auth.md
// Invalid: idea-api-design.md, 01-my-idea.md
```

### 4.2.3 PathManager Integration

All file operations MUST use the PathManager for path handling:

```go
// PathManager usage in file operations
func (s *FileService) CreateFile(context stdctx.Context, projectId, relativePath, content string) appfault.Result[*File] {
    // Validate relative path
    if err := s.pathManager.ValidateRelativePath(relativePath); err != nil {
        return appfault.Fail[*File](err)
    }
    
    // Convert to absolute for filesystem write
    absResult := s.pathManager.ToAbsolute(projectId, relativePath)
    if absResult.HasError() {
        return appfault.Fail[*File](absResult.Error())
    }
    
    // Write to filesystem
    if err := pathutil.WriteFile(absResult.Value(), []byte(content), 0644); err != nil {
        return appfault.FailWrap[*File](
            err,
            "failed to write file",
        )
    }
    
    // Store relative path in database
    file := &File{
        ProjectId: projectId,
        Path:      relativePath,  // Always relative in DB
        Name:      filepath.Base(relativePath),
    }
    
    if err := s.db.Create(file).Error; err != nil {
        return appfault.FailWrap[*File](
            err,
            "failed to create file record",
        )
    }
    
    return appfault.Ok(file)
}
```

### 4.2.4 Path Validation Rules

| Rule ID | Rule | Example Valid | Example Invalid |
|---------|------|---------------|-----------------|
| PATH-01 | Max length 255 characters | `02-spec/feature/api.md` | `02-spec/.../very-long-path...` (>255) |
| PATH-02 | No double slashes | `02-spec/feature/` | `spec//feature/` |
| PATH-03 | No backslashes | `02-spec/feature/` | `spec\feature\` |
| PATH-04 | No path traversal | `02-spec/feature/` | `../outside/` |
| PATH-05 | Lowercase with hyphens | `01-feature-name.md` | `01_Feature_Name.md` |
| PATH-06 | Start with number prefix | `01-overview.md` | `overview.md` |
| PATH-07 | End with `.md` extension | `01-overview.md` | `01-overview.txt` |
| PATH-08 | No special characters | `01-api-spec.md` | `01-api@spec!.md` |
| PATH-09 | No spaces | `01-api-spec.md` | `01 api spec.md` |
| PATH-10 | Reserved names forbidden | `spec/overview.md` | `.git/config` |

### 4.2.5 Reserved Path Patterns

The following paths are system-reserved and cannot be modified by users:

```go
var ReservedPaths = []string{
    ".git",
    ".git/*",
    ".history",
    ".history/*",
    "node_modules",
    "node_modules/*",
}
```

### 4.2.6 Path Validation Function

```go
// ValidatePath checks if a file path is valid
// Returns nil if valid, error with code if invalid
func ValidatePath(path string) error {
    if len(path) > 255 {
        return NewError(ErrPathTooLong, "Path exceeds 255 characters")
    }
    
    if strings.Contains(path, "//") {
        return NewError(ErrInvalidPath, "Double slashes not allowed")
    }
    
    if strings.Contains(path, "\\") {
        return NewError(ErrInvalidPath, "Backslashes not allowed")
    }
    
    if strings.Contains(path, "..") {
        return NewError(ErrPathTraversal, "Path traversal not allowed")
    }
    
    for _, reserved := range ReservedPaths {
        if matchesPattern(path, reserved) {
            return NewError(ErrReservedPath, "Reserved path: "+reserved)
        }
    }
    
    if !isValidFilename(filepath.Base(path)) {
        return NewError(ErrInvalidFilename, "Invalid filename format")
    }
    
    return nil
}
```

---

## 4.3 File Name Conventions

### 4.3.1 Naming Pattern

All spec files follow this naming pattern:

```
{nn}-{topic-name}.md
```

| Component | Description | Example |
|-----------|-------------|---------|
| `{nn}` | Two-digit sequence number | `01`, `02`, `99` |
| `-` | Hyphen separator | `-` |
| `{topic-name}` | Lowercase, hyphen-separated topic | `api-endpoints`, `database-schema` |
| `.md` | Markdown extension | `.md` |

### 4.3.2 Special Files

| File Name | Purpose | Required |
|-----------|---------|----------|
| `00-overview.md` | Section overview | Yes (for directories) |
| `99-glossary.md` | Terminology definitions | Optional |
| `README.md` | Ideas folder readme | Yes (for ideas/) |

### 4.3.3 Filename Validation

```go
var filenameRegex = regexp.MustCompile(`^(\d{2})-([a-z0-9]+(-[a-z0-9]+)*)\.md$`)
var readmeRegex = regexp.MustCompile(`^README\.md$`)

func isValidFilename(filename string) bool {
    if readmeRegex.MatchString(filename) {
        return true
    }
    return filenameRegex.MatchString(filename)
}
```

---

## 4.4 CRUD Operations

### 4.4.1 Create File

**Endpoint:** `POST /api/v1/projects/{projectId}/files`

**Request:**
```json
{
    "path": "02-spec/01-feature/03-new-spec.md",
    "content": "# New Spec\n\n> **Version:** 1.0.0\n...",
    "createDirectories": true
}
```

**Validation Steps:**
1. Validate path format (PATH-01 to PATH-10)
2. Check file does not already exist
3. Validate content is valid UTF-8
4. Check user has write permission
5. Validate parent directory exists (or createDirectories=true)

**Response (Success):**
```json
{
    "success": true,
    "data": {
        "id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
        "projectId": "p1a2b3c4-d5e6-7890-abcd-ef1234567890",
        "path": "02-spec/01-feature/03-new-spec.md",
        "name": "03-new-spec.md",
        "contentHash": "sha256:abc123...",
        "sizeBytes": 1024,
        "createdAt": "2026-01-27T10:00:00Z",
        "updatedAt": "2026-01-27T10:00:00Z"
    },
    "error": null,
    "meta": {
        "requestId": "req_abc123",
        "timestamp": "2026-01-27T10:00:00Z",
        "version": "1.0.0"
    }
}
```

**Side Effects:**
- Creates file on disk
- Inserts record in `File` table
- Triggers auto-snapshot if enabled
- Schedules git commit if auto-commit enabled

---

### 4.4.2 Read File

**Endpoint:** `GET /api/v1/projects/{projectId}/files/{fileId}`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeContent` | boolean | true | Include file content in response |
| `version` | string | latest | Specific snapshot version |

**Response:**
```json
{
    "success": true,
    "data": {
        "id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
        "projectId": "p1a2b3c4-d5e6-7890-abcd-ef1234567890",
        "path": "02-spec/01-feature/03-new-spec.md",
        "name": "03-new-spec.md",
        "content": "# New Spec\n\n> **Version:** 1.0.0\n...",
        "contentHash": "sha256:abc123...",
        "sizeBytes": 1024,
        "mimeType": "text/markdown",
        "createdAt": "2026-01-27T10:00:00Z",
        "updatedAt": "2026-01-27T10:00:00Z"
    },
    "error": null,
    "meta": {
        "requestId": "req_abc123",
        "timestamp": "2026-01-27T10:00:00Z",
        "version": "1.0.0"
    }
}
```

---

### 4.4.3 Update File

**Endpoint:** `PUT /api/v1/projects/{projectId}/files/{fileId}`

**Request:**
```json
{
    "content": "# Updated Spec\n\n> **Version:** 1.1.0\n...",
    "expectedHash": "sha256:abc123..."
}
```

**Optimistic Locking:**
The `expectedHash` field enables optimistic concurrency control:
- If provided and matches current hash: Update proceeds
- If provided and doesn't match: Returns `ErrConflict` (6003)
- If not provided: Update proceeds (overwrites)

**Response (Success):**
```json
{
    "success": true,
    "data": {
        "id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
        "path": "02-spec/01-feature/03-new-spec.md",
        "contentHash": "sha256:def456...",
        "previousHash": "sha256:abc123...",
        "sizeBytes": 1100,
        "updatedAt": "2026-01-27T10:30:00Z"
    },
    "error": null,
    "meta": {
        "requestId": "req_def456",
        "timestamp": "2026-01-27T10:30:00Z",
        "version": "1.0.0"
    }
}
```

**Side Effects:**
- Updates file on disk
- Updates `File` table record
- Creates snapshot entry in `FileSnapshot` table
- Triggers auto-snapshot if threshold met
- Schedules git commit

---

### 4.4.4 Delete File

**Endpoint:** `DELETE /api/v1/projects/{projectId}/files/{fileId}`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `permanent` | boolean | false | Skip trash, delete permanently |

**Soft Delete Behavior (default):**
1. Move file to `.trash/` directory
2. Set `DeletedAt` timestamp in database
3. File recoverable for 30 days

**Permanent Delete Behavior:**
1. Remove file from disk
2. Remove database record
3. Cascade delete snapshots

**Response:**
```json
{
    "success": true,
    "data": {
        "id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
        "deletedAt": "2026-01-27T11:00:00Z",
        "permanent": false,
        "recoveryDeadline": "2026-02-26T11:00:00Z"
    },
    "error": null,
    "meta": {
        "requestId": "req_ghi789",
        "timestamp": "2026-01-27T11:00:00Z",
        "version": "1.0.0"
    }
}
```

---

### 4.4.5 Move/Rename File

**Endpoint:** `PATCH /api/v1/projects/{projectId}/files/{fileId}/move`

**Request:**
```json
{
    "newPath": "02-spec/02-backend/03-new-spec.md"
}
```

**Validation:**
- New path must be valid (PATH-01 to PATH-10)
- New path must not exist
- User must have write permission on source and destination

**Response:**
```json
{
    "success": true,
    "data": {
        "id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
        "previousPath": "02-spec/01-feature/03-new-spec.md",
        "newPath": "02-spec/02-backend/03-new-spec.md",
        "movedAt": "2026-01-27T11:30:00Z"
    },
    "error": null,
    "meta": {
        "requestId": "req_jkl012",
        "timestamp": "2026-01-27T11:30:00Z",
        "version": "1.0.0"
    }
}
```

---

## 4.5 Directory Operations

### 4.5.1 List Directory

**Endpoint:** `GET /api/v1/projects/{projectId}/files`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | string | `/` | Directory path to list |
| `recursive` | boolean | false | Include subdirectories |
| `includeDeleted` | boolean | false | Include soft-deleted files |

**Response:**
```json
{
    "success": true,
    "data": {
        "path": "spec/",
        "items": [
            {
                "type": "directory",
                "name": "01-feature",
                "path": "02-spec/01-feature/",
                "fileCount": 3
            },
            {
                "type": "file",
                "id": "f1a2b3c4...",
                "name": "00-overview.md",
                "path": "02-spec/00-overview.md",
                "sizeBytes": 2048,
                "updatedAt": "2026-01-27T09:00:00Z"
            }
        ],
        "totalFiles": 15,
        "totalDirectories": 4
    },
    "error": null,
    "meta": {
        "requestId": "req_mno345",
        "timestamp": "2026-01-27T12:00:00Z",
        "version": "1.0.0"
    }
}
```

---

### 4.5.2 Create Directory

**Endpoint:** `POST /api/v1/projects/{projectId}/directories`

**Request:**
```json
{
    "path": "02-spec/03-new-section/",
    "createOverview": true
}
```

**Behavior:**
- Creates directory on disk
- If `createOverview=true`, creates `00-overview.md` with template
- Does not create database record (directories are implicit)

---

### 4.5.3 Delete Directory

**Endpoint:** `DELETE /api/v1/projects/{projectId}/directories`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | string | required | Directory path |
| `recursive` | boolean | false | Delete non-empty directories |
| `permanent` | boolean | false | Skip trash |

**Validation:**
- If `recursive=false` and directory is not empty: Returns `ErrDirNotEmpty` (6006)

---

## 4.6 Content Management

### 4.6.1 Content Encoding

All file content is stored and transmitted as UTF-8 encoded text.

```go
func ValidateContent(content []byte) error {
    if !utf8.Valid(content) {
        return NewError(ErrInvalidEncoding, "Content must be valid UTF-8")
    }
    
    if len(content) > MaxFileSizeBytes {
        return NewError(ErrFileTooLarge, "File exceeds maximum size")
    }
    
    return nil
}
```

### 4.6.2 Content Size Limits

| Limit | Value | Error Code |
|-------|-------|------------|
| Max file size | 5 MB | ErrFileTooLarge (6004) |
| Max total project size | 500 MB | ErrProjectQuota (6005) |
| Max files per directory | 100 | ErrDirLimit (6007) |
| Max directory depth | 10 | ErrDepthLimit (6008) |

### 4.6.3 Content Hashing

All content is hashed using SHA-256 for:
- Change detection
- Optimistic locking
- Deduplication

```go
func HashContent(content []byte) string {
    hash := sha256.Sum256(content)
    return "sha256:" + hex.EncodeToString(hash[:])
}
```

### 4.6.4 Auto-Save Behavior

The frontend implements auto-save with the following rules:

| Trigger | Delay | Action |
|---------|-------|--------|
| Content change | 2 seconds debounce | Save to server |
| Focus lost | Immediate | Save to server |
| Manual save (Ctrl+S) | Immediate | Save to server |

---

## 4.7 Error Codes

File operation errors use the 6xxx range as defined in [Error Management](../../../01-spec-authoring-guide/01-foundation/02-error-management-foundation.md).

| Code | Constant | Description | HTTP Status |
|------|----------|-------------|-------------|
| 6001 | ErrFileNotFound | File does not exist | 404 |
| 6002 | ErrFileExists | File already exists at path | 409 |
| 6003 | ErrConflict | Content hash mismatch (optimistic lock) | 409 |
| 6004 | ErrFileTooLarge | File exceeds size limit | 413 |
| 6005 | ErrProjectQuota | Project storage quota exceeded | 507 |
| 6006 | ErrDirNotEmpty | Cannot delete non-empty directory | 400 |
| 6007 | ErrDirLimit | Directory file count exceeded | 400 |
| 6008 | ErrDepthLimit | Directory nesting too deep | 400 |
| 6009 | ErrInvalidPath | Path format invalid | 400 |
| 6010 | ErrPathTraversal | Path traversal attempt | 403 |
| 6011 | ErrReservedPath | Attempting to modify reserved path | 403 |
| 6012 | ErrPathTooLong | Path exceeds 255 characters | 400 |
| 6013 | ErrInvalidFilename | Filename doesn't match pattern | 400 |
| 6014 | ErrInvalidEncoding | Content is not valid UTF-8 | 400 |
| 6015 | ErrReadFailed | Failed to read file from disk | 500 |
| 6016 | ErrWriteFailed | Failed to write file to disk | 500 |

---

## 4.8 Service Layer

### 4.8.1 FileService Interface

```go
type FileService interface {
    // CRUD operations
    Create(context stdctx.Context, req CreateFileRequest) appfault.Result[*File]
    Read(context stdctx.Context, projectId, fileId string) appfault.Result[*File]
    Update(context stdctx.Context, req UpdateFileRequest) appfault.Result[*File]
    Delete(context stdctx.Context, projectId, fileId string, permanent bool) *appfault.AppError
    Move(context stdctx.Context, req MoveFileRequest) appfault.Result[*File]
    
    // Directory operations
    ListDirectory(context stdctx.Context, req ListDirRequest) appfault.Result[*DirectoryListing]
    CreateDirectory(context stdctx.Context, req CreateDirRequest) *appfault.AppError
    DeleteDirectory(context stdctx.Context, req DeleteDirRequest) *appfault.AppError
    
    // Content operations
    GetContent(context stdctx.Context, projectId, fileId string) appfault.ResultSlice[byte]
    SetContent(context stdctx.Context, projectId, fileId string, content []byte) *appfault.AppError
    
    // Validation
    ValidatePath(path string) *appfault.AppError
    ValidateContent(content []byte) *appfault.AppError
}
```

### 4.8.2 Implementation Notes

```go
type fileService struct {
    db          *sql.DB
    projectRoot string
    snapshots   SnapshotService
    git         GitService
    config      ConfigService
}

func (s *fileService) Create(context stdctx.Context, req CreateFileRequest) appfault.Result[*File] {
    // 1. Validate path
    if err := s.ValidatePath(req.Path); err != nil {
        return appfault.Fail[*File](err)
    }
    
    // 2. Check file doesn't exist
    if s.fileExists(req.ProjectId, req.Path) {
        return appfault.FailNew[*File](
            "ErrFileExists",
            "File already exists",
        )
    }
    
    // 3. Validate content
    if err := s.ValidateContent([]byte(req.Content)); err != nil {
        return appfault.Fail[*File](err)
    }
    
    // 4. Create parent directories if needed
    if req.CreateDirectories {
        if err := s.ensureDirectories(req.ProjectId, req.Path); err != nil {
            return appfault.Fail[*File](err)
        }
    }
    
    // 5. Write to disk
    fullPath := s.getFullPath(req.ProjectId, req.Path)
    if err := pathutil.WriteFile(fullPath, []byte(req.Content), 0644); err != nil {
        return appfault.FailWrap[*File](
            err,
            "failed to write file to disk",
        )
    }
    
    // 6. Create database record
    file := &File{
        Id:          uuid.New().String(),
        ProjectId:   req.ProjectId,
        Path:        req.Path,
        Name:        filepath.Base(req.Path),
        ContentHash: HashContent([]byte(req.Content)),
        SizeBytes:   len(req.Content),
        CreatedAt:   time.Now(),
        UpdatedAt:   time.Now(),
    }
    
    if err := s.insertFile(context, file); err != nil {
        // Rollback: delete file from disk
        pathutil.Remove(fullPath)
        return appfault.Fail[*File](err)
    }
    
    // 7. Trigger snapshot if configured
    s.snapshots.TriggerIfNeeded(context, req.ProjectId)
    
    // 8. Schedule git commit if configured
    s.git.ScheduleCommit(context, req.ProjectId, "Created "+req.Path)
    
    return appfault.Ok(file)
}
```

---

## 4.9 Bulk Operations

### 4.9.1 Bulk Create

**Endpoint:** `POST /api/v1/projects/{projectId}/files/bulk`

**Request:**
```json
{
    "files": [
        {
            "path": "02-spec/01-feature/01-overview.md",
            "content": "# Overview\n..."
        },
        {
            "path": "02-spec/01-feature/02-requirements.md",
            "content": "# Requirements\n..."
        }
    ],
    "createDirectories": true,
    "atomicOperation": true
}
```

**Behavior:**
- If `atomicOperation=true`: All files created or none (transaction)
- If `atomicOperation=false`: Best-effort, returns partial results

---

### 4.9.2 Bulk Delete

**Endpoint:** `DELETE /api/v1/projects/{projectId}/files/bulk`

**Request:**
```json
{
    "fileIds": [
        "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
        "f2b3c4d5-e6f7-8901-bcde-f23456789012"
    ],
    "permanent": false
}
```

---

## 4.10 File Templates

### 4.10.1 Overview Template

When creating a new directory with `createOverview=true`:

```markdown
# {Section Name}

> **Version:** 1.0.0  
> **Last Updated:** {Date}  
> **Status:** Draft  

---

## Overview

{Description}

---

## Document Index

- [01-first-topic.md](./01-first-topic.md) - {Description}

---

## Cross-References

- [Parent Overview](../00-overview.md)
```

### 4.10.2 Spec File Template

Default template for new spec files:

```markdown
# {Topic Name}

> **Version:** 1.0.0  
> **Last Updated:** {Date}  
> **Status:** Draft  

---

## Overview

{Description}

---

## Details

{Content}

---

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

---

## Cross-References

- [Section Overview](./00-overview.md)
```

---

## 4.11 Project Metadata File (spec.project.json)

### 4.11.1 Overview

Each project has a `spec.project.json` file at its root that stores extended metadata. This file enables bidirectional synchronization between the filesystem and database.

```
{ProjectId}/
├── spec.project.json    ← Project metadata file
├── spec/
│   └── ...
├── ideas/
│   └── ...
└── .history/
```

### 4.11.2 Schema Definition

```typescript
interface ProjectMetadataJson {
  // Core identifiers
  projectName: string;        // Display name
  projectSlug: string;        // URL-safe identifier
  version: string;            // Semantic version (e.g., "1.0.0")
  
  // Descriptive fields
  summary: string;            // Brief one-line description
  description: string;        // Extended description (optional)
  
  // Ownership and contacts
  authorName: string;         // Primary author
  authorEmail?: string;       // Author email (optional)
  designerName?: string;      // UI/UX designer (optional)
  responsiblePerson: {        // Project owner/manager
    name: string;
    email: string;
  };
  
  // Classification
  language?: string;          // Primary language (e.g., "typescript", "php")
  framework?: string;         // Framework (e.g., "react", "wordpress")
  tags?: string[];            // Custom tags for organization
  
  // Timestamps
  createdAt: string;          // ISO8601 timestamp
  updatedAt: string;          // ISO8601 timestamp
  
  // Guidelines override
  guidelineOverrides?: {      // Per-project guideline customization
    excluded: string[];       // Guideline slugs to exclude
    added: string[];          // Additional guideline slugs
  };
  
  // AI settings
  aiSettings?: {
    defaultReasoningModelId?: string;  // Override system default
    defaultVoiceModelId?: string;      // Override system default
    instructionMode?: 'automatic' | 'approval';
  };
  
  // Custom metadata
  custom?: Record<string, string | number | boolean>;
}
```

### 4.11.3 Example File

```json
{
  "projectName": "Exam Manager Plugin",
  "projectSlug": "exam-manager",
  "version": "2.1.0",
  "summary": "WordPress plugin for managing examinations and participant progress",
  "description": "A comprehensive exam management system with support for deadlines, extensions, secret keys, and progress tracking.",
  "authorName": "John Doe",
  "authorEmail": "john@example.com",
  "designerName": "Jane Smith",
  "responsiblePerson": {
    "name": "Project Manager",
    "email": "pm@example.com"
  },
  "language": "php",
  "framework": "wordpress",
  "tags": ["education", "exam", "plugin"],
  "createdAt": "2025-06-15T10:00:00Z",
  "updatedAt": "2026-01-27T14:30:00Z",
  "guidelineOverrides": {
    "excluded": [],
    "added": ["custom-wp-hooks"]
  },
  "aiSettings": {
    "instructionMode": "approval"
  },
  "custom": {
    "clientName": "University of Example",
    "contractId": "EDU-2025-001"
  }
}
```

### 4.11.4 Bidirectional Sync Logic

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    BIDIRECTIONAL SYNC FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐                          ┌──────────────┐            │
│  │   Database   │  ←── Sync Direction ──→  │  JSON File   │            │
│  │  (Project +  │                          │ spec.project │            │
│  │   Metadata)  │                          │    .json     │            │
│  └──────────────┘                          └──────────────┘            │
│         │                                         │                    │
│         ▼                                         ▼                    │
│  ┌──────────────┐                          ┌──────────────┐            │
│  │ Last Updated │                          │ File ModTime │            │
│  │  Timestamp   │                          │  + Hash      │            │
│  └──────────────┘                          └──────────────┘            │
│                                                                         │
│  CONFLICT RESOLUTION:                                                   │
│  • If DB newer → Write JSON                                            │
│  • If JSON newer → Update DB                                           │
│  • If same time → DB wins (source of truth)                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.11.5 Sync Service Interface

```go
type ProjectMetadataService interface {
    // Read metadata from JSON file
    ReadFromFile(projectId string) appfault.Result[*ProjectMetadata]
    
    // Write metadata to JSON file
    WriteToFile(projectId string, metadata *ProjectMetadata) *appfault.AppError
    
    // Sync database ↔ filesystem
    SyncToFile(projectId string) *appfault.AppError   // DB → JSON
    SyncFromFile(projectId string) *appfault.AppError // JSON → DB
    
    // Full bidirectional sync
    Sync(projectId string) appfault.Result[*SyncResult]
    
    // Watch for external changes
    WatchFile(projectId string, onChange func()) *appfault.AppError
    StopWatching(projectId string) *appfault.AppError
}
```

### 4.11.6 Sync Implementation

```go
type SyncResult struct {
    Direction    SyncDirection // "db_to_file", "file_to_db", "none", "conflict"
    FieldsUpdated []string
    Timestamp    time.Time
    Error        *appfault.AppError `json:",omitempty"`
}

type SyncDirection string

const (
    SyncNone       SyncDirection = "none"
    SyncDbToFile   SyncDirection = "db_to_file"
    SyncFileToDb   SyncDirection = "file_to_db"
    SyncConflict   SyncDirection = "conflict"
)

func (s *metadataService) Sync(projectId string) appfault.Result[*SyncResult] {
    // 1. Get DB record with timestamp
    dbResult := s.getFromDb(projectId)
    if dbResult.HasError() {
        return appfault.Fail[*SyncResult](dbResult.Error())
    }
    dbRecord := dbResult.Value()
    
    // 2. Get file info with modification time
    filePath := s.getMetadataFilePath(projectId)
    fileInfo, err := pathutil.Stat(filePath)
    
    // 3. Handle file not existing
    if pathutil.IsNotExistError(err) {
        // File doesn't exist: create from DB
        return s.syncDbToFile(projectId, dbRecord)
    }
    
    // 4. Read file content and parse
    fileContent, err := pathutil.ReadFile(filePath)
    if err != nil {
        return appfault.FailNew[*SyncResult](
            "ErrReadFailed",
            "Failed to read metadata file",
        )
    }
    
    var fileRecord ProjectMetadata
    if err := json.Unmarshal(fileContent, &fileRecord); err != nil {
        return appfault.FailNew[*SyncResult](
            "ErrInvalidJson",
            "Invalid JSON in metadata file",
        )
    }
    
    // 5. Compare timestamps
    dbUpdated := dbRecord.UpdatedAt
    fileUpdated := fileRecord.UpdatedAt
    fileModTime := fileInfo.ModTime()
    
    // 6. Determine sync direction
    if dbUpdated.After(fileUpdated) {
        // DB is newer: write to file
        return s.syncDbToFile(projectId, dbRecord)
    } else if fileUpdated.After(dbUpdated) || fileModTime.After(dbUpdated) {
        // File is newer: update DB
        return s.syncFileToDb(projectId, &fileRecord)
    }
    
    // 7. No sync needed
    return appfault.Ok(&SyncResult{
        Direction: SyncNone,
        Timestamp: time.Now(),
    })
}

func (s *metadataService) syncDbToFile(projectId string, record *ProjectMetadata) appfault.Result[*SyncResult] {
    filePath := s.getMetadataFilePath(projectId)
    
    content, err := json.MarshalIndent(record, "", "  ")
    if err != nil {
        return appfault.FailWrap[*SyncResult](
            err,
            "failed to marshal metadata",
        )
    }
    
    if err := pathutil.WriteFile(filePath, content, 0644); err != nil {
        return appfault.FailNew[*SyncResult](
            "ErrWriteFailed",
            "Failed to write metadata file",
        )
    }
    
    return appfault.Ok(&SyncResult{
        Direction:     SyncDbToFile,
        FieldsUpdated: []string{"all"},
        Timestamp:     time.Now(),
    })
}

func (s *metadataService) syncFileToDb(projectId string, record *ProjectMetadata) appfault.Result[*SyncResult] {
    // Validate required fields
    if record.ProjectName == "" || record.ProjectSlug == "" {
        return appfault.FailNew[*SyncResult](
            "ErrValidationFailed",
            "Missing required fields in metadata",
        )
    }
    
    // Update database
    if err := s.updateProjectMetadata(projectId, record); err != nil {
        return appfault.Fail[*SyncResult](err)
    }
    
    return appfault.Ok(&SyncResult{
        Direction:     SyncFileToDb,
        FieldsUpdated: s.getChangedFields(projectId, record),
        Timestamp:     time.Now(),
    })
}
```

### 4.11.7 File Watcher Integration

```go
func (s *metadataService) WatchFile(projectId string) error {
    filePath := s.getMetadataFilePath(projectId)
    
    watcher, err := fsnotify.NewWatcher()
    if err != nil {
        return err
    }
    
    go func() {
        for {
            select {
            case event, ok := <-watcher.Events:
                if !ok {
                    return
                }
                if event.Op&fsnotify.Write == fsnotify.Write {
                    // File was modified externally
                    s.handleExternalChange(projectId)
                }
            case err, ok := <-watcher.Errors:
                if !ok {
                    return
                }
                s.logger.Error("Watch error", "projectId", projectId, "error", err)
            }
        }
    }()
    
    return watcher.Add(filePath)
}

func (s *metadataService) handleExternalChange(projectId string) {
    // Debounce to avoid rapid-fire updates
    s.debouncer.Do(projectId, 500*time.Millisecond, func() {
        result, err := s.Sync(projectId)
        if err != nil {
            s.logger.Error("Sync failed after external change", 
                "projectId", projectId, "error", err)
            return
        }
        
        if result.Direction == SyncFileToDb {
            s.eventBus.Publish("project.metadata.updated", projectId)
        }
    })
}
```

### 4.11.8 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/projects/{projectId}/metadata` | Get project metadata |
| PUT | `/api/v1/projects/{projectId}/metadata` | Update project metadata |
| POST | `/api/v1/projects/{projectId}/metadata/sync` | Force bidirectional sync |
| GET | `/api/v1/projects/{projectId}/metadata/diff` | Compare DB vs file |

### 4.11.9 Sync Trigger Points

| Trigger | Action |
|---------|--------|
| Project opened | Sync on load |
| File watcher event | Sync from file |
| Metadata edited in UI | Sync to file |
| Git pull detected | Sync from file |
| Export project | Sync to file first |

### 4.11.10 Error Codes (Project Metadata)

| Code | Constant | Description |
|------|----------|-------------|
| 6020 | ErrMetadataNotFound | spec.project.json does not exist |
| 6021 | ErrMetadataInvalidJson | JSON parsing failed |
| 6022 | ErrMetadataValidation | Required field missing or invalid |
| 6023 | ErrMetadataSyncFailed | Bidirectional sync failed |
| 6024 | ErrMetadataConflict | Unresolvable conflict detected |

---

## 4.12 Acceptance Criteria

### Path Validation (99% Required)

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| PV-001 | Path length ≤255 characters enforced | Critical | Length test |
| PV-002 | Double slashes (//) rejected | Critical | Regex test |
| PV-003 | Backslashes (\) rejected | Critical | Regex test |
| PV-004 | Path traversal (..) rejected | Critical | Security test |
| PV-005 | Lowercase with hyphens enforced | High | Format test |
| PV-006 | Two-digit prefix required (01-, 02-, etc.) | High | Prefix test |
| PV-007 | .md extension required | High | Extension test |
| PV-008 | Special characters rejected | High | Char test |
| PV-009 | Spaces rejected | High | Space test |
| PV-010 | Reserved paths (.git, .history, node_modules) blocked | Critical | Reserved test |

### CRUD Operations (99% Required)

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| CR-001 | POST /files creates file on disk and in database | Critical | Create test |
| CR-002 | GET /files/{id} returns file content and metadata | Critical | Read test |
| CR-003 | PUT /files/{id} updates file with optimistic locking | Critical | Update test |
| CR-004 | DELETE /files/{id} soft-deletes to .trash/ | Critical | Delete test |
| CR-005 | DELETE with permanent=true removes permanently | Critical | Permanent delete test |
| CR-006 | PATCH /files/{id}/move renames/moves file | Critical | Move test |
| CR-007 | expectedHash mismatch returns ErrConflict (6003) | Critical | Conflict test |
| CR-008 | File content validated as UTF-8 | High | Encoding test |
| CR-009 | File size ≤10MB enforced | High | Size limit test |
| CR-010 | createDirectories=true creates parent folders | Medium | Auto-create test |

### Directory Operations (99% Required)

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| DO-001 | GET /files?path=spec/ lists directory contents | Critical | List test |
| DO-002 | recursive=true includes subdirectories | High | Recursive test |
| DO-003 | POST /directories creates folder with 00-overview.md | Critical | Create dir test |
| DO-004 | DELETE directory works for empty directories | High | Delete empty test |
| DO-005 | DELETE with force=true removes non-empty directories | High | Force delete test |
| DO-006 | Directory paths end with / | Medium | Trailing slash test |

### Ideas & Instructions Folders (99% Required)

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| II-001 | ideas/ folder accepts `{nn}-idea-{slug}.md` files | Critical | Idea naming test |
| II-002 | instructions/ folder accepts `{nn}-instruction-{slug}.md` files | Critical | Instruction naming test |
| II-003 | README.md allowed in ideas/ and instructions/ | High | Readme test |
| II-004 | RAG indexing triggered on file changes in these folders | High | Index trigger test |
| II-005 | Next sequence number derived from MAX(existing) + 1 | Medium | Sequence test |

### Snapshots & History (99% Required)

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| SH-001 | File update creates snapshot entry | Critical | Snapshot create test |
| SH-002 | Auto-save triggers snapshot at threshold | High | Auto-save test |
| SH-003 | Git commit scheduled on file changes | High | Git schedule test |
| SH-004 | version query param retrieves historical content | Medium | Version retrieval test |

### Metadata Sync (99% Required)

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| MS-001 | spec.project.json created for new projects | Critical | Auto-create test |
| MS-002 | DB → file sync on metadata update | Critical | DB-to-file test |
| MS-003 | File → DB sync on external file change | Critical | File-to-DB test |
| MS-004 | File watcher detects spec.project.json changes | High | Watcher test |
| MS-005 | Conflict resolution: DB wins on tie | High | Conflict test |
| MS-006 | Invalid JSON returns ErrMetadataInvalidJson (6021) | High | Validation test |

### Bulk Operations (99% Required)

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| BO-001 | POST /files/bulk creates multiple files atomically | Critical | Bulk create test |
| BO-002 | DELETE /files/bulk deletes multiple files atomically | Critical | Bulk delete test |
| BO-003 | Partial failure rolls back entire transaction | High | Rollback test |
| BO-004 | Bulk operations limited to 100 files per request | Medium | Limit test |

### Error Handling (99% Required)

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| EH-001 | ErrFileNotFound (6001) for missing files | Critical | Error code test |
| EH-002 | ErrFileExists (6002) for duplicate creation | Critical | Error code test |
| EH-003 | ErrConflict (6003) for hash mismatch | Critical | Error code test |
| EH-004 | ErrPathTooLong (6012) for >255 char paths | Critical | Error code test |
| EH-005 | ErrPathTraversal (6010) for .. patterns | Critical | Error code test |
| EH-006 | ErrReservedPath (6011) for .git, etc. | Critical | Error code test |
| EH-007 | All errors include filePath for debugging | High | Error context test |

---

## Cross-References

- [Database Schema: File Table](../../07-database-design/01-schema.md#file-table)
- [Database Schema: Project Metadata](../../07-database-design/01-schema.md#projectmetadata)
- [Database Schema: PromotionEvent](../../07-database-design/01-schema.md#promotionevent)
- [API Endpoints: File Routes](../24-code-generation-system/13-api-endpoints.md#file-endpoints)
- [History System: Snapshot Triggers](../07-history-system/02-history-system.md)
- [Git Integration: Auto-Commit](../07-history-system/01-git-integration.md)
- [PathManager: Path Validation](./02-path-manager.md)
- [RAG System: Artifact Indexing](../09-knowledge-memory/01-rag-system.md)
- [General Spec: Error Management](../../../01-spec-authoring-guide/01-foundation/02-error-management-foundation.md)
