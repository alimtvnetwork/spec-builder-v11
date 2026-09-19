# Asset Operations

**Version:** 4.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

---

## Overview

File copy operations for managing build assets. Supports multiple copy modes and pattern-based filtering.

**Cross-References:**
- [Build Profiles](./07-build-profiles.md)
- [Configuration](./03-configuration.md)
- [Core Architecture](./01-core-architecture.md)
- [Enum Architecture](./19-enum-architecture.md)

---

## Asset Configuration Schema

```go
import "internal/enums/copymodetype"

type AssetConfig struct {
    Enabled    bool             `json:",omitempty"`
    Operations []AssetOperation `json:",omitempty"`
}

type AssetOperation struct {
    Source      string             // Source path or glob pattern
    Destination string             // Destination directory
    Mode        copymodetype.Variant  // Type-safe copy mode enum
    Pattern     string             `json:",omitempty"` // File pattern (e.g., "*.js")
    Exclude     []string           `json:",omitempty"` // Exclusion patterns
    Flatten     bool               `json:",omitempty"` // Flatten directory structure
}

// copymodetype.Variant values:
// - copymodetype.Copy         → Copy, fail if exists
// - copymodetype.ClearCopy    → Clear destination, then copy
// - copymodetype.Override     → Overwrite existing files
// - copymodetype.SkipExisting → Skip if file exists
//
// See: internal/enums/copymodetype/variant.go
```

---

## Copy Modes

### 1. Copy (Default)

Copy files to destination. Fails if destination files exist.

```json
{
  "source": "./dist",
  "destination": "./public",
  "mode": "copy"
}
```

### 2. Clear-Copy

Delete all files in destination directory, then copy new files.

```json
{
  "source": "./frontend/dist",
  "destination": "./public",
  "mode": "clear-copy"
}
```

### 3. Override

Overwrite existing files without error. New files are added.

```json
{
  "source": "./assets",
  "destination": "./static",
  "mode": "override"
}
```

### 4. Skip-Existing

Copy only files that don't exist at destination.

```json
{
  "source": "./templates",
  "destination": "./config",
  "mode": "skip-existing"
}
```

---

## Asset Copier Implementation

```go
type AssetCopier struct {
    logger *LogService
}

type CopyResult struct {
    Operation   AssetOperation
    FilesCopied int
    FilesSkipped int
    BytesCopied int64
    Duration    time.Duration
    Errors      []string `json:",omitempty"`
}

func (c *AssetCopier) Execute(config *AssetConfig) *appfault.AppError {
    if !config.Enabled {
        return nil
    }
    
    for _, op := range config.Operations {
        opResult := c.executeOperation(op)
        if opResult.IsErr() {
            return appfault.Wrap(
                opResult.Err(),
                ErrBrunAssetCopyFailed,
                "asset operation failed ["+op.Source+" -> "+op.Destination+"]",
            )
        }
        result := opResult.Value()
        
        c.logger.Info("Asset copy completed",
            "source", op.Source,
            "destination", op.Destination,
            "files", result.FilesCopied,
            "bytes", result.BytesCopied,
        )
    }
    
    return nil
}

func (c *AssetCopier) executeOperation(op AssetOperation) appfault.Result[CopyResult] {
    result := CopyResult{
        Operation: op,
    }
    startTime := time.Now()
    
    // Validate source exists
    isSourceExists := pathutil.Exists(op.Source)
    if !isSourceExists {
        return appfault.Fail[CopyResult](
            appfault.New(ErrBrunAssetSourceMissing, "source not found: "+op.Source),
        )
    }
    
    // Handle clear-copy mode using type-safe enum
    if op.Mode.IsClearCopy() {
        clearErr := pathutil.RemoveAll(op.Destination)
        if clearErr != nil {
            return appfault.Fail[CopyResult](
                appfault.Wrap(clearErr, ErrBrunAssetClearFailed, "failed to clear destination"),
            )
        }
    }
    
    // Ensure destination exists
    ensureErr := pathutil.EnsureDir(op.Destination)
    if ensureErr != nil {
        return appfault.Fail[CopyResult](
            appfault.Wrap(ensureErr, ErrBrunOutputDirFailed, "failed to create destination"),
        )
    }
    
    // Get list of files to copy
    filesResult := c.getFilesToCopy(op)
    if filesResult.IsErr() {
        return appfault.Fail[CopyResult](filesResult.Err())
    }
    
    // Copy files
    for _, file := range files {
        destPath := c.getDestPath(op, file)
        
        copied, err := c.copyFile(file, destPath, op.Mode)
        if err != nil {
            result.Errors = append(result.Errors, err.Error())
            continue
        }
        
        if copied {
            result.FilesCopied++
            fileSize := pathutil.FileSize(destPath)
            result.BytesCopied += fileSize
        } else {
            result.FilesSkipped++
        }
    }
    
    result.Duration = time.Since(startTime)
    return result, nil
}
```

---

## File Matching

### Pattern Support

```go
func (c *AssetCopier) getFilesToCopy(op AssetOperation) appfault.ResultSlice[string] {
    var files []string
    
    err := filepath.Walk(op.Source, func(path string, info os.FileInfo, err error) error {
        if err != nil {
            return err
        }
        
        // Skip directories
        if info.IsDir() {
            return nil
        }
        
        // Apply pattern filter
        if op.Pattern != "" {
            matched, err := filepath.Match(op.Pattern, filepath.Base(path))
            if err != nil || !matched {
                return nil
            }
        }
        
        // Apply exclusions
        for _, exclude := range op.Exclude {
            if matched, _ := filepath.Match(exclude, filepath.Base(path)); matched {
                return nil
            }
            // Also check path-based exclusion
            if strings.Contains(path, exclude) {
                return nil
            }
        }
        
        files = append(files, path)
        return nil
    })
    
    return files, err
}
```

### Glob Patterns

```json
{
  "source": "./dist/**/*.js",
  "destination": "./public/js",
  "mode": "override"
}
```

### Exclusions

```json
{
  "source": "./build",
  "destination": "./release",
  "mode": "clear-copy",
  "exclude": [
    "*.map",
    "*.test.js",
    "__tests__",
    "node_modules"
  ]
}
```

---

## Directory Flattening

Copy all files to a single destination directory, ignoring source structure.

```json
{
  "source": "./src/assets/images",
  "destination": "./public/images",
  "mode": "override",
  "flatten": true
}
```

```go
func (c *AssetCopier) getDestPath(op AssetOperation, srcPath string) string {
    if op.Flatten {
        // Just use filename
        return filepath.Join(op.Destination, filepath.Base(srcPath))
    }
    
    // Preserve directory structure
    relPath, _ := filepath.Rel(op.Source, srcPath)
    return filepath.Join(op.Destination, relPath)
}
```

---

## Complex Example

```json
{
  "assets": {
    "enabled": true,
    "operations": [
      {
        "source": "./frontend/dist",
        "destination": "./public",
        "mode": "clear-copy",
        "exclude": ["*.map"]
      },
      {
        "source": "./docs/api",
        "destination": "./public/docs",
        "mode": "override",
        "pattern": "*.html"
      },
      {
        "source": "./static/images",
        "destination": "./public/images",
        "mode": "skip-existing"
      },
      {
        "source": "./configs/templates",
        "destination": "./release/config",
        "mode": "copy",
        "flatten": true,
        "pattern": "*.json"
      }
    ]
  }
}
```

---

## CLI Usage

```bash
# Run build with asset copy
brun build --profile frontend --copy-assets

# Clean destination before copy (forces clear-copy mode)
brun build --profile frontend --copy-assets --clean

# Dry run to preview what would be copied
brun build --profile frontend --copy-assets --dry-run
```

---

## Output

### Text Output

```
Asset Operations:
  [1/3] ./frontend/dist → ./public (clear-copy)
        Cleared: 15 files
        Copied: 23 files (1.2 MB)
  
  [2/3] ./docs/api → ./public/docs (override)
        Copied: 8 files (45 KB)
        Overwritten: 3 files
  
  [3/3] ./static/images → ./public/images (skip-existing)
        Copied: 5 files (890 KB)
        Skipped: 12 files (already exist)

Total: 36 files copied, 12 skipped, 2.1 MB transferred
```

### JSON Output

```json
{
  "success": true,
  "operations": [
    {
      "source": "./frontend/dist",
      "destination": "./public",
      "mode": "clear-copy",
      "filesCopied": 23,
      "filesSkipped": 0,
      "bytesCopied": 1258291,
      "duration": "245ms"
    }
  ],
  "totalFiles": 36,
  "totalBytes": 2203648,
  "totalDuration": "512ms"
}
```

---

## See Also

- [Build Profiles](./07-build-profiles.md)
- [Configuration](./03-configuration.md)
- [CLI Interface](./02-cli-interface.md)
