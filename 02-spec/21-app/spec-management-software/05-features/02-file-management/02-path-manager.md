# Path Manager Specification

**Version:** 1.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

The Path Manager is a centralized Go component responsible for all filesystem path operations in the Spec Management Software. It enforces the critical rule that **all paths in the database are relative to `workDirectory`**, provides security against path traversal attacks, and normalizes path handling across the entire application.

**Cross-References:**
- [File Operations](./01-file-operations.md) - Path validation rules
- [RAG System](../09-knowledge-memory/01-rag-system.md) - Artifact path handling
- [Database Schema](../../07-database-design/01-schema.md) - Path column definitions

---

## 17.1 Core Principles

### Absolute Rule: Relative Paths Only

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PATH STORAGE RULE                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ✓ Database stores:   02-spec/project-name/ideas/01-idea-auth.md           │
│  ✗ NEVER stores:      /home/user/specs/02-spec/project-name/ideas/...     │
│                                                                          │
│  At runtime:                                                             │
│    workDirectory + relativePath = absolutePath                          │
│    /home/user/specs + 02-spec/project-name/... = /home/user/specs/spec/... │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Security Guarantees

1. **No path traversal** — Reject any path containing `..`
2. **No absolute paths in DB** — All stored paths are relative
3. **Sandbox enforcement** — All operations stay within `workDirectory`
4. **Consistent normalization** — Forward slashes, no trailing slashes

---

## 17.2 Configuration

### Seeding Keys

Add to `seed.json`:

```json
{
  "Key": "path.workDirectory",
  "Value": "./data/specs",
  "Description": "Root directory for all spec files (relative to executable or absolute)"
},
{
  "Key": "path.maxLength",
  "Value": "255",
  "Description": "Maximum allowed path length"
},
{
  "Key": "path.allowedExtensions",
  "Value": "[\".md\", \".json\", \".yaml\", \".yml\"]",
  "Description": "Allowed file extensions for spec files"
}
```

### Environment Override

```bash
# Environment variable takes precedence over seed value
SPEC_WORK_DIRECTORY=/var/lib/specmgr/specs
```

### Configuration Resolution

```go
func ResolveWorkDirectory(configService *ConfigService) appfault.Result[string] {
    // 1. Check environment variable first
    if envPath := os.Getenv("SPEC_WORK_DIRECTORY"); envPath != "" {
        abs, err := filepath.Abs(envPath)
        if err != nil {
            return appfault.FailWrap[string](
                err,
                "invalid SPEC_WORK_DIRECTORY env var",
            )
        }

        return appfault.Ok(abs)
    }
    
    // 2. Check database config
    dbPath, err := configService.GetConfig("path.workDirectory")
    if err != nil || dbPath == "" {
        return appfault.FailNew[string](
            "ErrConfigMissing",
            "workDirectory not configured",
        )
    }
    
    // 3. Resolve relative paths from executable directory
    if pathutil.IsRelativePath(dbPath) {
        execDir, _ := os.Executable()
        dbPath = filepath.Join(filepath.Dir(execDir), dbPath)
    }
    
    abs, err := filepath.Abs(dbPath)
    if err != nil {
        return appfault.FailWrap[string](
            err,
            "invalid workDirectory path",
        )
    }

    return appfault.Ok(abs)
}
```

---

## 17.3 PathManager Component

### Interface Definition

```go
package pathmanager

import (
    "errors"
    "path/filepath"
    "strings"
)

// Error codes for path operations
var (
    ErrPathTraversal     = errors.New("path traversal not allowed")
    ErrAbsolutePath      = errors.New("absolute paths not allowed in storage")
    ErrPathTooLong       = errors.New("path exceeds maximum length")
    ErrInvalidExtension  = errors.New("file extension not allowed")
    ErrOutsideSandbox    = errors.New("path resolves outside work directory")
    ErrEmptyPath         = errors.New("path cannot be empty")
    ErrReservedPath      = errors.New("path is reserved by system")
)

// PathManager handles all path operations
type PathManager struct {
    workDirectory     string
    maxPathLength     int
    allowedExtensions []string
    reservedPaths     []string
}

// Config for PathManager initialization
type PathManagerConfig struct {
    WorkDirectory     string
    MaxPathLength     int
    AllowedExtensions []string
    ReservedPaths     []string
}

// DefaultConfig returns sensible defaults
func DefaultConfig() PathManagerConfig {
    return PathManagerConfig{
        WorkDirectory:     "./data/specs",
        MaxPathLength:     255,
        AllowedExtensions: []string{".md", ".json", ".yaml", ".yml"},
        ReservedPaths:     []string{".git", ".history", "node_modules", ".DS_Store"},
    }
}
```

### Constructor

```go
// NewPathManager creates a new PathManager with validated config
func NewPathManager(config PathManagerConfig) appfault.Result[*PathManager] {
    // Resolve and validate work directory
    absWorkDir, err := filepath.Abs(config.WorkDirectory)
    if err != nil {
        return appfault.FailWrap[*PathManager](
            err,
            "invalid workDirectory",
        )
    }
    
    // Ensure work directory exists
    if err := pathutil.EnsureDir(absWorkDir, 0755); err != nil {
        return appfault.FailWrap[*PathManager](
            err,
            "cannot create workDirectory",
        )
    }
    
    return appfault.Ok(&PathManager{
        workDirectory:     absWorkDir,
        maxPathLength:     config.MaxPathLength,
        allowedExtensions: config.AllowedExtensions,
        reservedPaths:     config.ReservedPaths,
    })
}

// WorkDirectory returns the absolute work directory path
func (pm *PathManager) WorkDirectory() string {
    return pm.workDirectory
}
```

---

## 17.4 Core Methods

### Validation

```go
// ValidateRelativePath checks if a relative path is safe for storage
func (pm *PathManager) ValidateRelativePath(relativePath string) error {
    if relativePath == "" {
        return ErrEmptyPath
    }
    
    // Normalize for consistent checking
    normalized := pm.NormalizePath(relativePath)
    
    // Check length
    if len(normalized) > pm.maxPathLength {
        return ErrPathTooLong
    }
    
    // Reject absolute paths
    if filepath.IsAbs(normalized) {
        return ErrAbsolutePath
    }
    
    // Check for path traversal
    if pm.hasTraversal(normalized) {
        return ErrPathTraversal
    }
    
    // Check reserved paths
    for _, reserved := range pm.reservedPaths {
        if strings.HasPrefix(normalized, reserved+"/") || normalized == reserved {
            return ErrReservedPath
        }
    }
    
    return nil
}

// hasTraversal detects path traversal attempts
func (pm *PathManager) hasTraversal(path string) bool {
    // Clean the path and check if it escapes
    cleaned := filepath.Clean(path)
    
    // Direct check for ".."
    if strings.Contains(cleaned, "..") {
        return true
    }
    
    // Additional check: cleaned path should not start with ../
    if strings.HasPrefix(cleaned, "../") || cleaned == ".." {
        return true
    }
    
    return false
}

// ValidateExtension checks if file has allowed extension
func (pm *PathManager) ValidateExtension(filename string) error {
    ext := strings.ToLower(filepath.Ext(filename))
    
    for _, allowed := range pm.allowedExtensions {
        if ext == allowed {
            return nil
        }
    }
    
    return ErrInvalidExtension
}
```

### Resolution

```go
// Resolve converts a relative path to absolute, with validation
func (pm *PathManager) Resolve(relativePath string) appfault.Result[string] {
    // Validate first
    if err := pm.ValidateRelativePath(relativePath); err != nil {
        return appfault.Fail[string](err)
    }
    
    // Normalize and join
    normalized := pm.NormalizePath(relativePath)
    absolute := filepath.Join(pm.workDirectory, normalized)
    
    // Final security check: ensure result is within sandbox
    absClean := filepath.Clean(absolute)
    if stringutil.IsMissingPrefix(absClean, pm.workDirectory) {
        return appfault.FailNew[string](
            "ErrOutsideSandbox",
            "path resolves outside work directory",
        )
    }
    
    return appfault.Ok(absClean)
}

// MustResolve resolves path and panics on error (use in controlled contexts)
func (pm *PathManager) MustResolve(relativePath string) string {
    result := pm.Resolve(relativePath)
    if result.HasError() {
        panic(fmt.Sprintf("path resolution failed: %v", result.Error()))
    }
    return result.Value()
}
```

### Conversion

```go
// ToRelative converts an absolute path to relative (for storage)
func (pm *PathManager) ToRelative(absolutePath string) appfault.Result[string] {
    // Clean the absolute path
    absClean := filepath.Clean(absolutePath)
    
    // Must be within work directory
    if stringutil.IsMissingPrefix(absClean, pm.workDirectory) {
        return appfault.FailNew[string](
            "ErrOutsideSandbox",
            "path resolves outside work directory",
        )
    }
    
    // Extract relative portion
    relative := strings.TrimPrefix(absClean, pm.workDirectory)
    relative = strings.TrimPrefix(relative, string(filepath.Separator))
    
    // Normalize to forward slashes for storage
    return appfault.Ok(pm.NormalizePath(relative))
}

// NormalizePath ensures consistent path format
func (pm *PathManager) NormalizePath(path string) string {
    // Convert backslashes to forward slashes
    normalized := strings.ReplaceAll(path, "\\", "/")
    
    // Remove leading slash (we store relative paths)
    normalized = strings.TrimPrefix(normalized, "/")
    
    // Remove trailing slash (except for empty string)
    if len(normalized) > 1 {
        normalized = strings.TrimSuffix(normalized, "/")
    }
    
    // Remove double slashes
    for strings.Contains(normalized, "//") {
        normalized = strings.ReplaceAll(normalized, "//", "/")
    }
    
    return normalized
}
```

### Utilities

```go
// Join safely joins path segments
func (pm *PathManager) Join(segments ...string) string {
    joined := filepath.Join(segments...)
    return pm.NormalizePath(joined)
}

// Dir returns the directory portion of a path
func (pm *PathManager) Dir(path string) string {
    return pm.NormalizePath(filepath.Dir(path))
}

// Base returns the file name portion of a path
func (pm *PathManager) Base(path string) string {
    return filepath.Base(path)
}

// Ext returns the extension of a path
func (pm *PathManager) Ext(path string) string {
    return filepath.Ext(path)
}

// Exists checks if a file exists at the relative path
func (pm *PathManager) Exists(relativePath string) appfault.Result[bool] {
    result := pm.Resolve(relativePath)
    if result.HasError() {
        return appfault.Fail[bool](result.Error())
    }
    
    existsResult, err := pathutil.Exists(result.Value())
    if err != nil {
        return appfault.FailWrap[bool](
            err,
            "failed to check path existence",
        )
    }

    return appfault.Ok(existsResult)
}

// IsDirectory checks if path is a directory
func (pm *PathManager) IsDirectory(relativePath string) appfault.Result[bool] {
    result := pm.Resolve(relativePath)
    if result.HasError() {
        return appfault.Fail[bool](result.Error())
    }
    
    info, err := pathutil.Stat(result.Value())
    if err != nil {
        return appfault.FailWrap[bool](
            err,
            "failed to stat path",
        )
    }
    
    return appfault.Ok(info.IsDir())
}
```

---

## 17.5 Project Path Helpers

### Project-Scoped Paths

```go
// ProjectPaths provides helpers for project-specific paths
type ProjectPaths struct {
    pm          *PathManager
    projectSlug string
}

// ForProject creates project-scoped path helpers
func (pm *PathManager) ForProject(projectSlug string) *ProjectPaths {
    return &ProjectPaths{
        pm:          pm,
        projectSlug: projectSlug,
    }
}

// Root returns the project root path
func (pp *ProjectPaths) Root() string {
    return pp.pm.Join("02-spec", pp.projectSlug)
}

// Ideas returns the ideas folder path
func (pp *ProjectPaths) Ideas() string {
    return pp.pm.Join("02-spec", pp.projectSlug, "ideas")
}

// Instructions returns the instructions folder path
func (pp *ProjectPaths) Instructions() string {
    return pp.pm.Join("02-spec", pp.projectSlug, "instructions")
}

// Spec returns the spec folder path
func (pp *ProjectPaths) Spec() string {
    return pp.pm.Join("02-spec", pp.projectSlug, "02-spec")
}

// IdeaFile returns path for a specific idea file
func (pp *ProjectPaths) IdeaFile(filename string) string {
    return pp.pm.Join("02-spec", pp.projectSlug, "ideas", filename)
}

// InstructionFile returns path for a specific instruction file
func (pp *ProjectPaths) InstructionFile(filename string) string {
    return pp.pm.Join("02-spec", pp.projectSlug, "instructions", filename)
}

// SpecFile returns path for a specific spec file
func (pp *ProjectPaths) SpecFile(relativePath string) string {
    return pp.pm.Join("02-spec", pp.projectSlug, "02-spec", relativePath)
}
```

---

## 17.6 Filename Generation

### Numbered Filename Generator

```go
// NextNumberedFilename generates the next sequential filename
func (pm *PathManager) NextNumberedFilename(
    directory string,
    artifactType string, // "idea" or "instruction"
    slug string,
) appfault.Result[string] {
    result := pm.Resolve(directory)
    if result.HasError() {
        return appfault.Fail[string](result.Error())
    }
    
    // Get next available number
    nextNum := pm.findNextNumber(result.Value())
    
    // Generate filename
    filename := fmt.Sprintf("%02d-%s-%s.md", nextNum, artifactType, slug)
    
    return appfault.Ok(filename)
}

// findNextNumber scans directory for highest numbered file
func (pm *PathManager) findNextNumber(absDir string) int {
    entries, err := os.ReadDir(absDir)
    if err != nil {
        return 1 // Start at 1 if directory doesn't exist
    }
    
    maxNum := 0
    pattern := regexp.MustCompile(`^(\d{2})-`)
    
    for _, entry := range entries {
        if entry.IsDir() {
            continue
        }
        
        matches := pattern.FindStringSubmatch(entry.Name())
        if len(matches) >= 2 {
            num, _ := strconv.Atoi(matches[1])
            if num > maxNum {
                maxNum = num
            }
        }
    }
    
    return maxNum + 1
}

// SlugFromTitle generates URL-safe slug from title
func SlugFromTitle(title string) string {
    // Lowercase
    slug := strings.ToLower(title)
    
    // Replace spaces and underscores with hyphens
    slug = strings.ReplaceAll(slug, " ", "-")
    slug = strings.ReplaceAll(slug, "_", "-")
    
    // Remove non-alphanumeric except hyphens
    re := regexp.MustCompile(`[^a-z0-9-]`)
    slug = re.ReplaceAllString(slug, "")
    
    // Collapse multiple hyphens
    re = regexp.MustCompile(`-+`)
    slug = re.ReplaceAllString(slug, "-")
    
    // Trim hyphens from ends
    slug = strings.Trim(slug, "-")
    
    // Limit length
    if len(slug) > 50 {
        slug = slug[:50]
        slug = strings.TrimSuffix(slug, "-")
    }
    
    return slug
}
```

---

## 17.7 File Operations Integration

### Safe File Operations

```go
// SafeRead reads file content with path validation
// Note: ByteSlice is defined in types.go (created from generic appfault.ResultSlice[byte]):
// type ByteSlice = appfault.ResultSlice[byte]
func (pm *PathManager) SafeRead(relativePath string) ByteSlice {
    result := pm.Resolve(relativePath)
    if result.HasError() {
        return appfault.FailSlice[byte](result.Error())
    }
    
    data, err := pathutil.ReadFile(result.Value())
    if err != nil {
        return appfault.FailWrap[[]byte](
            err,
            "failed to read file",
        )
    }
    
    return appfault.OkSlice(data)
}

// SafeWrite writes content with path validation
func (pm *PathManager) SafeWrite(relativePath string, content []byte) error {
    abs, err := pm.Resolve(relativePath)
    if err != nil {
        return err
    }
    
    // Ensure parent directory exists
    dir := filepath.Dir(abs)
    if err := pathutil.EnsureDir(dir, 0755); err != nil {
        return err
    }
    
    return pathutil.WriteFile(abs, content, 0644)
}

// SafeDelete deletes a file with path validation
func (pm *PathManager) SafeDelete(relativePath string) error {
    abs, err := pm.Resolve(relativePath)
    if err != nil {
        return err
    }
    
    return pathutil.Remove(abs)
}

// SafeMove moves a file with path validation
func (pm *PathManager) SafeMove(fromRelative, toRelative string) error {
    fromAbs, err := pm.Resolve(fromRelative)
    if err != nil {
        return appfault.Wrap(
            err,
            ErrPathInvalid,
            "source path invalid",
        )
    }
    
    toAbs, err := pm.Resolve(toRelative)
    if err != nil {
        return appfault.Wrap(
            err,
            ErrPathInvalid,
            "destination path invalid",
        )
    }
    
    // Ensure destination directory exists
    dir := filepath.Dir(toAbs)
    if err := pathutil.EnsureDir(dir, 0755); err != nil {
        return err
    }
    
    return pathutil.Rename(fromAbs, toAbs)
}
```

---

## 17.8 Singleton Pattern

### Global Instance

```go
package pathmanager

import (
    "sync"
)

var (
    instance *PathManager
    once     sync.Once
    initErr  *appfault.AppError
)

// Initialize sets up the global PathManager instance
func Initialize(config PathManagerConfig) *appfault.AppError {
    once.Do(func() {
        result := NewPathManager(config)
        if result.HasError() {
            initErr = result.Error()
        } else {
            instance = result.Value()
        }
    })
    return initErr
}

// Get returns the global PathManager instance
func Get() *PathManager {
    if instance == nil {
        panic("PathManager not initialized - call Initialize first")
    }
    return instance
}

// InitializeFromConfig sets up PathManager from ConfigService
func InitializeFromConfig(configService *ConfigService) error {
    workDir, err := ResolveWorkDirectory(configService)
    if err != nil {
        return err
    }
    
    maxLength, _ := configService.GetConfigAsInt("path.maxLength")
    if maxLength == 0 {
        maxLength = 255
    }
    
    extensions, _ := configService.GetConfigAsArray("path.allowedExtensions")
    if len(extensions) == 0 {
        extensions = []string{".md", ".json", ".yaml", ".yml"}
    }
    
    return Initialize(PathManagerConfig{
        WorkDirectory:     workDir,
        MaxPathLength:     maxLength,
        AllowedExtensions: extensions,
        ReservedPaths:     DefaultConfig().ReservedPaths,
    })
}
```

---

## 17.9 Usage Examples

### Service Integration

```go
// FileService uses PathManager for all operations
type FileService struct {
    pm   *PathManager
    repo FileRepository
}

func NewFileService(pm *PathManager, repo FileRepository) *FileService {
    return &FileService{pm: pm, repo: repo}
}

func (s *FileService) CreateFile(projectSlug, subPath, content string) appfault.Result[*File] {
    // Build relative path
    paths := s.pm.ForProject(projectSlug)
    relativePath := paths.SpecFile(subPath)
    
    // Validate
    if err := s.pm.ValidateRelativePath(relativePath); err != nil {
        return appfault.Fail[*File](err)
    }
    if err := s.pm.ValidateExtension(subPath); err != nil {
        return appfault.Fail[*File](err)
    }
    
    // Write file
    if err := s.pm.SafeWrite(relativePath, []byte(content)); err != nil {
        return appfault.Fail[*File](err)
    }
    
    // Create DB record with RELATIVE path only
    file := &File{
        Id:          uuid.NewString(),
        ProjectId:   projectId,
        Path:        relativePath, // RELATIVE - never absolute!
        Name:        s.pm.Base(subPath),
        ContentHash: HashContent([]byte(content)),
    }
    
    return s.repo.Create(file)
}
```

### Idea Creation

```go
func (s *IdeaService) CreateIdea(projectSlug, title, content string) appfault.Result[*Idea] {
    paths := s.pm.ForProject(projectSlug)
    
    // Generate slug from title
    slug := SlugFromTitle(title)
    
    // Get next numbered filename
    filenameResult := s.pm.NextNumberedFilename(paths.Ideas(), "idea", slug)
    if filenameResult.HasError() {
        return appfault.Fail[*Idea](filenameResult.Error())
    }
    
    // Build full relative path
    relativePath := paths.IdeaFile(filenameResult.Value())
    
    // Format content
    markdown := s.formatIdeaMarkdown(title, content)
    
    // Write to filesystem
    if err := s.pm.SafeWrite(relativePath, []byte(markdown)); err != nil {
        return appfault.Fail[*Idea](err)
    }
    
    // Create DB record
    idea := &Idea{
        Id:           uuid.NewString(),
        ProjectId:    projectId,
        Title:        title,
        RelativePath: relativePath, // RELATIVE path stored
        Status:       "draft",
    }
    
    return s.repo.Create(idea)
}
```

---

## 17.10 Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 6010 | `ErrPathTraversal` | Path contains traversal attempt (`..`) |
| 6011 | `ErrPathAbsolute` | Attempted to store absolute path |
| 6012 | `ErrPathTooLong` | Path exceeds configured maximum length |
| 6013 | `ErrPathInvalidExt` | File extension not in allowed list |
| 6014 | `ErrPathOutsideSandbox` | Resolved path escapes work directory |
| 6015 | `ErrPathEmpty` | Empty path provided |
| 6016 | `ErrPathReserved` | Path matches reserved system path |

---

## 17.11 Testing

### Unit Tests

```go
func TestPathManager_ValidateRelativePath(t *testing.T) {
    pmResult := NewPathManager(DefaultConfig())
    assert.False(t, pmResult.HasError())
    pm := pmResult.Value()
    
    tests := []struct {
        path    string
        wantErr error
    }{
        {"02-spec/project/file.md", nil},
        {"ideas/01-idea-auth.md", nil},
        {"../escape/file.md", ErrPathTraversal},
        {"02-spec/../../../etc/passwd", ErrPathTraversal},
        {"/absolute/path.md", ErrAbsolutePath},
        {"", ErrEmptyPath},
        {".git/config", ErrReservedPath},
        {strings.Repeat("a", 300), ErrPathTooLong},
    }
    
    for _, tt := range tests {
        t.Run(tt.path, func(t *testing.T) {
            err := pm.ValidateRelativePath(tt.path)
            if errors.IsNot(err, tt.wantErr) {
                t.Errorf("got %v, want %v", err, tt.wantErr)
            }
        })
    }
}

func TestPathManager_Resolve(t *testing.T) {
    pmResult := NewPathManager(PathManagerConfig{
        WorkDirectory: "/home/user/specs",
        MaxPathLength: 255,
    })
    assert.False(t, pmResult.HasError())
    pm := pmResult.Value()
    
    result := pm.Resolve("02-spec/project/file.md")
    assert.False(t, result.HasError())
    assert.Equal(t, "/home/user/specs/02-spec/project/file.md", result.Value())
}

func TestPathManager_ToRelative(t *testing.T) {
    pmResult := NewPathManager(PathManagerConfig{
        WorkDirectory: "/home/user/specs",
        MaxPathLength: 255,
    })
    assert.False(t, pmResult.HasError())
    pm := pmResult.Value()
    
    relResult := pm.ToRelative("/home/user/specs/02-spec/project/file.md")
    assert.False(t, relResult.HasError())
    assert.Equal(t, "02-spec/project/file.md", relResult.Value())
    
    // Outside sandbox should fail
    outsideResult := pm.ToRelative("/etc/passwd")
    assert.True(t, outsideResult.HasError())
}
```

---

## 17.12 Acceptance Criteria

### Path Storage (99% Required)

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| PS-001 | All database paths are relative to workDirectory | Critical | Database query audit |
| PS-002 | PathManager.Resolve() returns absolute path for relative input | Critical | Unit test |
| PS-003 | PathManager.ToRelative() converts absolute to relative | Critical | Unit test |
| PS-004 | workDirectory configurable via seed.json | Critical | Config test |
| PS-005 | SPEC_WORK_DIRECTORY env var overrides seed value | High | Env var test |
| PS-006 | PathManager initialized before any file operations | Critical | Startup order test |

### Security Validation (99% Required)

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| SV-001 | Path traversal (`..`) rejected in all operations | Critical | Security test |
| SV-002 | Absolute paths rejected for storage | Critical | Input validation test |
| SV-003 | Resolved paths verified within sandbox | Critical | Boundary test |
| SV-004 | Reserved paths (`.git`, `.history`, `node_modules`) blocked | Critical | Reserved path test |
| SV-005 | Path length ≤255 enforced | High | Length validation test |
| SV-006 | Double slashes normalized | High | Normalization test |
| SV-007 | Backslashes converted to forward slashes | High | Platform test |
| SV-008 | ErrOutsideSandbox returned for escape attempts | Critical | Error code test |

### Extension & Format Validation (99% Required)

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| EV-001 | ValidateExtension accepts .md, .json, .yaml, .yml | Critical | Extension test |
| EV-002 | Invalid extensions return ErrInvalidExtension | High | Error code test |
| EV-003 | Paths normalized to lowercase | Medium | Case test |
| EV-004 | Trailing slashes removed (except empty string) | Medium | Normalization test |

### Project Path Helpers (99% Required)

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| PH-001 | ForProject(slug).Ideas() returns correct path | Critical | Path helper test |
| PH-002 | ForProject(slug).Instructions() returns correct path | Critical | Path helper test |
| PH-003 | ForProject(slug).Spec() returns correct path | Critical | Path helper test |
| PH-004 | IdeaFile() generates path in ideas/ folder | High | Path construction test |
| PH-005 | InstructionFile() generates path in instructions/ folder | High | Path construction test |

### Filename Generation (99% Required)

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| FG-001 | NextNumberedFilename returns correct sequence | Critical | Sequence test |
| FG-002 | Sequence derived from MAX(existing) + 1 | High | Max detection test |
| FG-003 | Two-digit prefix with leading zero (01, 02) | High | Format test |
| FG-004 | Empty directory starts at 01 | Medium | Empty dir test |

### Error Handling (99% Required)

| ID | Criterion | Priority | Validation Method |
|----|-----------|----------|-------------------|
| EH-001 | ErrPathTraversal for `..` patterns | Critical | Error code test |
| EH-002 | ErrAbsolutePath for absolute path storage | Critical | Error code test |
| EH-003 | ErrPathTooLong for >255 chars | Critical | Error code test |
| EH-004 | ErrReservedPath for .git, .history | Critical | Error code test |
| EH-005 | ErrEmptyPath for empty string | High | Error code test |
| EH-006 | All errors include path for debugging | High | Error context test |

---

## Related Specs

- [File Operations](./01-file-operations.md)
- [RAG System](../09-knowledge-memory/01-rag-system.md)
- [Database Schema](../../07-database-design/01-schema.md)
