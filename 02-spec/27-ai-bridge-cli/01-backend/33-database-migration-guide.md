# Database Migration Guide: Company-Scoped Paths

> **Version:** 5.0.0  
> **Status:** Final  
> **Last Updated:** 2026-03-09

---

## Overview

This guide documents the migration from legacy flat database paths to the new company-scoped hierarchical structure (Split DB v3.0). The migration affects Code, Chat, and SEO content (Blog, FAQ, Paragraph) databases.

---

## Path Changes Summary

### Before (v2.x)

```
data/
├── aibridge.db                          # Root DB
└── {appName}/
    ├── ai/
    │   └── chat/
    │       └── {seq}-{session-id}.db    # Chat sessions (flat)
    ├── rag/
    │   ├── code/
    │   │   └── {seq}-{task-id}.db       # Code tasks (flat)
    │   └── seo/
    │       └── {company-slug}.db        # All SEO content in one DB
    └── search.db
```

### After (v3.0)

```
data/
├── aibridge.db                          # Root DB (unchanged)
└── {appName}/
    ├── rag/
    │   ├── code/
    │   │   └── {company}/               # NEW: Company isolation
    │   │       └── {seq}-{task-id}.db
    │   ├── chat/
    │   │   └── {company}/               # NEW: Company isolation
    │   │       └── {seq}-{session-id}.db
    │   └── seo/
    │       ├── {company-slug}.db        # Company root (training + registry)
    │       ├── blog/
    │       │   └── {company}/
    │       │       └── {seq}-{slug}.db  # Individual blog posts
    │       ├── faq/
    │       │   └── {company}/
    │       │       └── {seq}-{slug}.db  # Individual FAQs
    │       └── paragraph/
    │           └── {company}/
    │               └── {seq}-{slug}.db  # Individual paragraphs
    └── search.db
```

---

## Migration Matrix

| Module | Old Path | New Path |
|--------|----------|----------|
| Code Tasks | `data/{app}/rag/code/{seq}-{id}.db` | `data/{app}/rag/code/{company}/{seq}-{id}.db` |
| Chat Sessions | `data/{app}/ai/chat/{seq}-{id}.db` | `data/{app}/rag/chat/{company}/{seq}-{id}.db` |
| Blog Posts | `data/{app}/rag/seo/{company}.db` (table) | `data/{app}/rag/seo/blog/{company}/{seq}-{slug}.db` |
| FAQ Content | `data/{app}/rag/seo/{company}.db` (table) | `data/{app}/rag/seo/faq/{company}/{seq}-{slug}.db` |
| Paragraphs | `data/{app}/rag/seo/{company}.db` (table) | `data/{app}/rag/seo/paragraph/{company}/{seq}-{slug}.db` |

---

## Migration Steps

### Phase 1: Preparation

1. **Backup existing databases**
   ```bash
   cp -r data/ data-backup-$(date +%Y%m%d)/
   ```

2. **Verify current structure**
   ```bash
   find data/ -name "*.db" -type f | sort
   ```

3. **Check for active sessions**
   ```sql
   -- In aibridge.db
   SELECT * FROM ActiveSessions WHERE Status = 'active';
   ```

### Phase 2: Schema Migration

#### 2.1 Code Task Migration

```go
// MigrateCodeTasks moves flat code DBs to company-scoped paths
func MigrateCodeTasks(appName, defaultCompany string) *appfault.AppError {
    oldPattern := fmt.Sprintf("data/%s/rag/code/*.db", appName)
    files, _ := filepath.Glob(oldPattern)
    
    for _, oldPath := range files {
        filename := filepath.Base(oldPath)
        newDir := fmt.Sprintf("data/%s/rag/code/%s", appName, defaultCompany)
        pathutil.MkdirAll(newDir, 0755)
        
        newPath := filepath.Join(newDir, filename)
        if err := pathutil.Rename(oldPath, newPath); err != nil {
            return appfault.Wrap(
                err,
                ErrMigrationMoveFailed,
                "failed to move code task: %s",
                oldPath,
            )
        }
        
        // Update registry
        updateCodeRegistry(appName, filename, newPath)
    }

    return nil
}
```

#### 2.2 Chat Session Migration

```go
// MigrateChatSessions moves from ai/chat/ to rag/chat/{company}/
func MigrateChatSessions(appName, defaultCompany string) *appfault.AppError {
    oldPattern := fmt.Sprintf("data/%s/ai/chat/*.db", appName)
    files, _ := filepath.Glob(oldPattern)
    
    for _, oldPath := range files {
        filename := filepath.Base(oldPath)
        newDir := fmt.Sprintf("data/%s/rag/chat/%s", appName, defaultCompany)
        pathutil.MkdirAll(newDir, 0755)
        
        newPath := filepath.Join(newDir, filename)
        if err := pathutil.Rename(oldPath, newPath); err != nil {
            return appfault.Wrap(
                err,
                ErrMigrationMoveFailed,
                "failed to move chat session: %s",
                oldPath,
            )
        }
        
        // Update registry
        updateChatRegistry(appName, filename, newPath)
    }

    return nil
}
```

#### 2.3 SEO Content Migration

```go
// MigrateSeoContent splits unified company DB into individual content DBs
func MigrateSeoContent(appName, company string) *appfault.AppError {
    companyDb := fmt.Sprintf("data/%s/rag/seo/%s.db", appName, company)
    
    // Extract blog posts
    blogPosts := extractBlogPosts(companyDb)
    for seq, post := range blogPosts {
        newPath := fmt.Sprintf("data/%s/rag/seo/blog/%s/%03d-%s.db", 
            appName, company, seq, post.Slug)
        createContentDb(newPath, "blog", post)
    }
    
    // Extract FAQs
    faqs := extractFaqs(companyDb)
    for seq, faq := range faqs {
        newPath := fmt.Sprintf("data/%s/rag/seo/faq/%s/%03d-%s.db",
            appName, company, seq, faq.Slug)
        createContentDb(newPath, "faq", faq)
    }
    
    // Extract paragraphs
    paragraphs := extractParagraphs(companyDb)
    for seq, para := range paragraphs {
        newPath := fmt.Sprintf("data/%s/rag/seo/paragraph/%s/%03d-%s.db",
            appName, company, seq, para.Slug)
        createContentDb(newPath, "paragraph", para)
    }
    
    // Keep training data in company root DB
    cleanCompanyDb(companyDb)
    
    return nil
}
```

### Phase 3: Registry Updates

Update the root database registry to reflect new paths:

```sql
-- Update CodeTasks registry
UPDATE CodeTasks 
SET DbPath = REPLACE(
    DbPath, 
    'rag/code/', 
    'rag/code/default-company/'
)
WHERE DbPath LIKE '%rag/code/%'
AND DbPath NOT LIKE '%rag/code/%/%';

-- Update ChatSessions registry
UPDATE ChatSessions 
SET DbPath = REPLACE(
    DbPath, 
    'ai/chat/', 
    'rag/chat/default-company/'
)
WHERE DbPath LIKE '%ai/chat/%';

-- Add company column if missing
ALTER TABLE CodeTasks ADD COLUMN Company TEXT DEFAULT 'default';
ALTER TABLE ChatSessions ADD COLUMN Company TEXT DEFAULT 'default';
```

### Phase 4: Verification

```go
// VerifyMigration checks all paths are valid
func VerifyMigration(appName string) MigrationReport {
    report := MigrationReport{}
    
    // Check code tasks
    codePaths := getCodePaths(appName)
    for _, path := range codePaths {
        if !fileExists(path) {
            report.MissingFiles = append(report.MissingFiles, path)
        }
    }
    
    // Verify path structure
    expectedPattern := regexp.MustCompile(
        `data/[^/]+/rag/(code|chat)/[^/]+/\\d{3}-[^/]+\\.db`)
    // ... validation logic
    
    return report
}
```

---

## Rollback Procedure

If migration fails, restore from backup:

```bash
# Stop services
systemctl stop aibridge

# Restore backup
rm -rf data/
cp -r data-backup-YYYYMMDD/ data/

# Restart services
systemctl start aibridge
```

---

## CLI Migration Command

```bash
# Dry run (preview changes)
aibridge migrate --app myapp --dry-run

# Migrate with default company
aibridge migrate --app myapp --company default

# Migrate specific module
aibridge migrate --app myapp --module seo --company atto-property

# Verify migration
aibridge migrate --app myapp --verify
```

---

## API Migration Endpoint

**POST** `/api/v1/admin/migrate`

```json
{
  "AppName": "myapp",
  "Modules": ["code", "chat", "seo"],
  "DefaultCompany": "default",
  "DryRun": false
}
```

**Response:**

```json
{
  "Success": true,
  "MigratedFiles": 156,
  "SkippedFiles": 0,
  "Errors": [],
  "Duration": "2.3s",
  "NewStructure": {
    "Code": "data/myapp/rag/code/{company}/",
    "Chat": "data/myapp/rag/chat/{company}/",
    "Blog": "data/myapp/rag/seo/blog/{company}/",
    "Faq": "data/myapp/rag/seo/faq/{company}/",
    "Paragraph": "data/myapp/rag/seo/paragraph/{company}/"
  }
}
```

---

## Compatibility

### Backward Compatibility

The migration tool automatically handles legacy paths:

```go
// ResolvePath handles both old and new path formats
func ResolvePath(pathKey PathKey, params PathParams) string {
    // Check for legacy path first
    legacyPath := buildLegacyPath(pathKey, params)
    if fileExists(legacyPath) {
        log.Warn("Using legacy path, consider migrating: %s", legacyPath)
        return legacyPath
    }
    
    // Return new path
    return buildNewPath(pathKey, params)
}
```

### PascalCase Enforcement

All JSON transport and database schemas use PascalCase:

```go
// Correct
type MigrationResult struct {
    AppName       string
    MigratedFiles int
    Company       string
}

// INCORRECT - snake_case
type MigrationResult struct {
    AppName       string `json:"app_name"`       // ❌
    MigratedFiles int    `json:"migrated_files"` // ❌
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Database Paths Reference | `26-database-paths-reference.md` |
| Split DB Architecture | `02-spec/06-split-db-architecture/00-overview.md` |
| Blog Generation | `27-ai-seo-blog-generation.md` |
| FAQ Generation | `22-ai-seo-faq-generation.md` |
| Paragraph Generation | `25-ai-seo-paragraph-generation.md` |

---

*This migration guide ensures smooth transition to company-scoped database paths while maintaining data integrity and backward compatibility.*
