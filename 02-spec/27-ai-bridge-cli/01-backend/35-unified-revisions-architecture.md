# Unified Revisions Architecture

> **Version:** 5.0.0  
> **Updated:** 2026-03-09  
> **Status:** Draft
> **Replaces:** Portions of `31-revision-feedback-system.md` (simplified)

---

## 1. Overview

This specification defines a **unified revisions system** that applies consistently across all content types while maintaining **normalized, searchable storage** via per-type metadata tables instead of JSON columns.

---

## 2. Design Philosophy

### 2.1 Problems with JSON Metadata

❌ JSON in SQLite is hard to search efficiently  
❌ No type safety for content-specific fields  
❌ Index performance degrades with JSON queries  
❌ Schema changes require parsing/rewriting JSON

### 2.2 Per-Type Tables Approach

✅ **Normalized tables** for each content type's metadata  
✅ **Full SQL searchability** on all fields  
✅ **Type safety** via structured columns  
✅ **Same core `Revisions` table** + linked metadata tables  
✅ **Foreign key integrity** between revisions and metadata

---

## 3. Schema Architecture

### 3.1 Core Revisions Table (Shared)

Every session/content DB uses this exact schema:

```sql
CREATE TABLE IF NOT EXISTS Revisions (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    Version         INTEGER NOT NULL,           -- 1, 2, 3... auto-incremented by DB
    ContentType     TEXT NOT NULL,              -- 'Blog', 'Faq', 'Code', 'Chat', 'Paragraph'
    Content         TEXT NOT NULL,              -- The actual content (HTML, Markdown, code)
    ContentHash     TEXT NOT NULL,              -- SHA256 for deduplication
    IsActive        INTEGER DEFAULT 0,          -- 1 = current active version
    IsPinned        INTEGER DEFAULT 0,          -- 1 = protected from auto-archive
    Label           TEXT,                       -- Optional user label
    Model           TEXT,                       -- AI model used
    PromptTokens    INTEGER,                    -- Input token count
    CompletionTokens INTEGER,                   -- Output token count
    GenerationTimeMs INTEGER,                   -- Time to generate
    CreatedAt       TEXT DEFAULT (datetime('now')),
    CreatedBy       TEXT,                       -- 'System', 'User', 'Suggestion'
    ParentVersion   INTEGER                     -- Previous version this was based on
);

CREATE INDEX IdxRevisionsVersion ON Revisions(Version);
CREATE INDEX IdxRevisionsIsActive ON Revisions(IsActive);
CREATE INDEX IdxRevisionsContentType ON Revisions(ContentType);
CREATE UNIQUE INDEX IdxRevisionsContentHash ON Revisions(ContentHash);
```

### 3.2 Per-Type Metadata Tables

#### BlogRevisionMeta

```sql
CREATE TABLE IF NOT EXISTS BlogRevisionMeta (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    RevisionId      INTEGER NOT NULL UNIQUE,
    Slug            TEXT NOT NULL,
    Category        TEXT,
    WordCount       INTEGER,
    H2Count         INTEGER,
    H3Count         INTEGER,
    InternalLinks   INTEGER,
    ExternalLinks   INTEGER,
    ReadingTimeMin  INTEGER,
    FeaturedImage   TEXT,
    MetaDescription TEXT,
    FocusKeyword    TEXT,
    
    FOREIGN KEY (RevisionId) REFERENCES Revisions(Id) ON DELETE CASCADE
);

CREATE INDEX IdxBlogRevisionMetaSlug ON BlogRevisionMeta(Slug);
CREATE INDEX IdxBlogRevisionMetaCategory ON BlogRevisionMeta(Category);
CREATE INDEX IdxBlogRevisionMetaFocusKeyword ON BlogRevisionMeta(FocusKeyword);
```

#### CodeRevisionMeta

```sql
CREATE TABLE IF NOT EXISTS CodeRevisionMeta (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    RevisionId      INTEGER NOT NULL UNIQUE,
    Language        TEXT NOT NULL,
    FilePath        TEXT,
    FunctionName    TEXT,
    ClassName       TEXT,
    LinesAdded      INTEGER,
    LinesRemoved    INTEGER,
    LinesChanged    INTEGER,
    Complexity      INTEGER,                    -- Cyclomatic complexity
    TestCoverage    REAL,                       -- 0.0 to 1.0
    
    FOREIGN KEY (RevisionId) REFERENCES Revisions(Id) ON DELETE CASCADE
);

CREATE INDEX IdxCodeRevisionMetaLanguage ON CodeRevisionMeta(Language);
CREATE INDEX IdxCodeRevisionMetaFilePath ON CodeRevisionMeta(FilePath);
CREATE INDEX IdxCodeRevisionMetaFunctionName ON CodeRevisionMeta(FunctionName);
```

#### ChatRevisionMeta

```sql
CREATE TABLE IF NOT EXISTS ChatRevisionMeta (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    RevisionId      INTEGER NOT NULL UNIQUE,
    MessageRole     TEXT NOT NULL,              -- 'User', 'Assistant', 'System'
    TurnNumber      INTEGER,
    IsEdited        INTEGER DEFAULT 0,
    OriginalContent TEXT,                       -- Original before edit
    EditReason      TEXT,
    
    FOREIGN KEY (RevisionId) REFERENCES Revisions(Id) ON DELETE CASCADE
);

CREATE INDEX IdxChatRevisionMetaMessageRole ON ChatRevisionMeta(MessageRole);
CREATE INDEX IdxChatRevisionMetaTurnNumber ON ChatRevisionMeta(TurnNumber);
```

#### FaqRevisionMeta

```sql
CREATE TABLE IF NOT EXISTS FaqRevisionMeta (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    RevisionId      INTEGER NOT NULL UNIQUE,
    QuestionCount   INTEGER,
    Category        TEXT,
    SchemaType      TEXT DEFAULT 'FAQPage',     -- JSON-LD schema type
    TargetKeyword   TEXT,
    AnswerWordCount INTEGER,
    
    FOREIGN KEY (RevisionId) REFERENCES Revisions(Id) ON DELETE CASCADE
);

CREATE INDEX IdxFaqRevisionMetaCategory ON FaqRevisionMeta(Category);
CREATE INDEX IdxFaqRevisionMetaTargetKeyword ON FaqRevisionMeta(TargetKeyword);
```

#### ParagraphRevisionMeta

```sql
CREATE TABLE IF NOT EXISTS ParagraphRevisionMeta (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    RevisionId      INTEGER NOT NULL UNIQUE,
    ContentIntent   TEXT,                       -- 'Intro', 'Body', 'Conclusion', 'CTA'
    WordCount       INTEGER,
    SentenceCount   INTEGER,
    TransitionWords INTEGER,
    LinksIncluded   INTEGER,
    TargetKeyword   TEXT,
    KeywordDensity  REAL,                       -- Percentage
    
    FOREIGN KEY (RevisionId) REFERENCES Revisions(Id) ON DELETE CASCADE
);

CREATE INDEX IdxParagraphRevisionMetaContentIntent ON ParagraphRevisionMeta(ContentIntent);
CREATE INDEX IdxParagraphRevisionMetaTargetKeyword ON ParagraphRevisionMeta(TargetKeyword);
```

---

## 4. Version Calculation

### 4.1 Database-Level Auto-Increment

**CRITICAL**: Version is calculated atomically by the database, not application code.

```sql
-- Atomic version calculation using subquery
INSERT INTO Revisions (Version, ContentType, Content, ContentHash, IsActive)
SELECT 
    COALESCE(MAX(Version), 0) + 1,
    'Blog',
    :content,
    :hash,
    1
FROM Revisions WHERE ContentType = 'Blog';
```

### 4.2 Go Helper (Atomic Transaction)

**CRITICAL: No `interface{}` usage. All metadata uses the `RevisionMeta` typed union.**

```go
// RevisionMeta is a strongly-typed union for per-content-type metadata.
// Exactly one field is non-nil, determined by ContentType.
type RevisionMeta struct {
    Blog      *BlogMeta      `json:",omitempty"`
    Code      *CodeMeta      `json:",omitempty"`
    Chat      *ChatMeta      `json:",omitempty"`
    Faq       *FaqMeta       `json:",omitempty"`
    Paragraph *ParagraphMeta `json:",omitempty"`
}

func CreateRevision(db *gorm.DB, contentType, content string, meta RevisionMeta) apperror.Result[int64] {
    var revisionId int64
    // EXEMPTED: gorm.Transaction callback — must return error
    txErr := db.Transaction(func(tx *gorm.DB) error {
        // Deactivate current active revision
        tx.Model(&Revision{}).
            Where("ContentType = ? AND IsActive = 1", contentType).
            Update("IsActive", 0)

        // Calculate next version atomically
        var maxVersion int
        tx.Model(&Revision{}).
            Where("ContentType = ?", contentType).
            Select("COALESCE(MAX(Version), 0)").
            Scan(&maxVersion)

        // Insert new revision
        hash := sha256Hash(content)
        revision := Revision{
            Version:     maxVersion + 1,
            ContentType: contentType,
            Content:     content,
            ContentHash: hash,
            IsActive:    1,
        }
        if err := tx.Create(&revision).Error; err != nil {
            return err
        }

        revisionId = revision.Id

        // Insert type-specific metadata via typed union
        return insertMetadata(tx, contentType, revision.Id, meta)
    })
    if txErr != nil {
        return apperror.FailWrap[int64](
            txErr,
            ErrRevisionCreateFailed,
            "failed to create revision",
        )
    }

    return apperror.Ok(revisionId)
}

func insertMetadata(tx *gorm.DB, contentType string, revisionId int64, meta RevisionMeta) error {
    // EXEMPTED: returns raw error — internal to gorm.Transaction callback (stdlib boundary)
    switch contentType {
    case "Blog":
        if meta.Blog == nil {
            return fmt.Errorf("Blog metadata required for Blog content type")
        }
        m := meta.Blog
        entry := BlogRevisionMeta{
            RevisionId:    revisionId,
            Slug:          m.Slug,
            Category:      m.Category,
            WordCount:     m.WordCount,
            H2Count:       m.H2Count,
            InternalLinks: m.InternalLinks,
            ExternalLinks: m.ExternalLinks,
            FocusKeyword:  m.FocusKeyword,
        }
        return tx.Create(&entry).Error

    case "Code":
        if meta.Code == nil {
            return fmt.Errorf("Code metadata required for Code content type")
        }
        m := meta.Code
        entry := CodeRevisionMeta{
            RevisionId:   revisionId,
            Language:     m.Language,
            FilePath:     m.FilePath,
            FunctionName: m.FunctionName,
            LinesChanged: m.LinesChanged,
        }
        return tx.Create(&entry).Error

    // ... other content types follow same pattern
    }
    return nil
}
```

---

## 5. Unified Feedback Table

```sql
CREATE TABLE IF NOT EXISTS RevisionFeedback (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    RevisionId      INTEGER NOT NULL,
    FeedbackType    TEXT NOT NULL,          -- 'General', 'Inline', 'Suggestion'
    FeedbackText    TEXT NOT NULL,          -- The feedback content
    SelectionStart  INTEGER,                -- For inline: char offset start
    SelectionEnd    INTEGER,                -- For inline: char offset end
    SelectedText    TEXT,                   -- For inline: the selected text
    Status          TEXT DEFAULT 'Pending', -- 'Pending', 'Applied', 'Rejected'
    ProcessedAt     TEXT,                   -- When feedback was processed
    CreatedAt       TEXT DEFAULT (datetime('now')),
    
    FOREIGN KEY (RevisionId) REFERENCES Revisions(Id) ON DELETE CASCADE
);

CREATE INDEX IdxRevisionFeedbackRevisionId ON RevisionFeedback(RevisionId);
CREATE INDEX IdxRevisionFeedbackStatus ON RevisionFeedback(Status);
```

---

## 6. Searchable Queries

With normalized tables, full SQL search is available:

### 6.1 Search Blog Revisions by Keyword

```sql
SELECT r.*, b.*
FROM Revisions r
JOIN BlogRevisionMeta b ON r.Id = b.RevisionId
WHERE r.ContentType = 'Blog'
  AND b.FocusKeyword LIKE '%carpet cleaning%'
  AND r.IsActive = 1;
```

### 6.2 Find Code Changes by File Path

```sql
SELECT r.*, c.*
FROM Revisions r
JOIN CodeRevisionMeta c ON r.Id = c.RevisionId
WHERE c.FilePath LIKE '%/handlers/%'
  AND c.LinesChanged > 50
ORDER BY r.CreatedAt DESC;
```

### 6.3 Get FAQ Revisions by Category

```sql
SELECT r.*, f.*
FROM Revisions r
JOIN FaqRevisionMeta f ON r.Id = f.RevisionId
WHERE f.Category = 'Pricing'
ORDER BY r.Version DESC;
```

---

## 7. Unified API Pattern

### 7.1 Generic Endpoints

All content types use the same endpoint pattern:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/{module}/{id}/revisions` | List all revisions with metadata |
| GET | `/{module}/{id}/revisions/active` | Get active revision |
| GET | `/{module}/{id}/revisions/{version}` | Get specific version |
| POST | `/{module}/{id}/revisions` | Create new revision |
| POST | `/{module}/{id}/revisions/{version}/activate` | Set as active |
| POST | `/{module}/{id}/revisions/{version}/rollback` | Rollback to version |
| POST | `/{module}/{id}/revisions/{version}/feedback` | Submit feedback |
| POST | `/{module}/{id}/revisions/{version}/regenerate` | Regenerate from feedback |
| GET | `/{module}/{id}/revisions/diff?v1=X&v2=Y` | Compare versions |
| POST | `/{module}/{id}/revisions/{version}/pin` | Pin/unpin version |
| POST | `/{module}/{id}/revisions/{version}/label` | Add label |

### 7.2 Module Substitution

| Module | Example Endpoint |
|--------|------------------|
| Blog | `/seo/blog/{company}/{slug}/revisions` |
| FAQ | `/seo/faq/{company}/{slug}/revisions` |
| Paragraph | `/seo/paragraph/{company}/{slug}/revisions` |
| Code | `/code/{company}/{taskId}/revisions` |
| Chat | `/chat/{company}/{sessionId}/revisions` |

---

## 8. RAG Memory Update

When content is regenerated, RAG memory MUST be updated for the session scope:

```go
func OnRevisionCreated(revision Revision, feedback *RevisionFeedback) *apperror.AppError {
    // Update RAG with new content (session-scoped)
    if err := rag.UpdateSessionChunks(revision.SessionPath, revision.Content); err != nil {
        return err
    }
    
    // If feedback-driven, learn from the correction
    if feedback != nil {
        return rag.LearnFromFeedback(revision.SessionPath, feedback)
    }

    return nil
}
```

---

## 9. Error Codes

| Code | Name | Description |
|------|------|-------------|
| 9700 | REVISION_NOT_FOUND | Version does not exist |
| 9701 | REVISION_CREATE_FAILED | Failed to create revision |
| 9702 | FEEDBACK_INVALID | Feedback text empty or too long |
| 9703 | SELECTION_OUT_OF_BOUNDS | Inline selection exceeds content length |
| 9704 | ROLLBACK_FAILED | Could not activate specified version |
| 9705 | DIFF_COMPUTE_FAILED | Error computing version diff |
| 9706 | VERSION_PINNED | Cannot modify pinned version |
| 9707 | REGENERATION_IN_PROGRESS | Another regeneration is running |
| 9708 | CONTENT_HASH_DUPLICATE | Identical content already exists |
| 9709 | MAX_VERSIONS_EXCEEDED | Too many versions for content |

---

## 10. Configuration (Seedable)

```json
{
  "Revision": {
    "MaxVersionsPerContent": 50,
    "AutoArchiveAfterDays": 90,
    "DiffAlgorithm": "myers",
    "DiffContextLines": 3,
    "FeedbackMaxLength": 5000,
    "SelectionsMaxPerFeedback": 10,
    "HashAlgorithm": "sha256",
    "PinnedVersionsMax": 5
  }
}
```

---

## 11. Migration from JSON Metadata

If existing DBs have JSON `Metadata` column:

```sql
-- Step 1: Create new metadata table
CREATE TABLE BlogRevisionMeta (...);

-- Step 2: Migrate data from JSON
INSERT INTO BlogRevisionMeta (RevisionId, Slug, Category, WordCount, H2Count, InternalLinks, ExternalLinks)
SELECT 
    Id,
    json_extract(Metadata, '$.Slug'),
    json_extract(Metadata, '$.Category'),
    json_extract(Metadata, '$.WordCount'),
    json_extract(Metadata, '$.H2Count'),
    json_extract(Metadata, '$.InternalLinks'),
    json_extract(Metadata, '$.ExternalLinks')
FROM Revisions
WHERE ContentType = 'Blog' AND Metadata IS NOT NULL;

-- Step 3: Drop Metadata column (optional, or keep for backwards compat)
-- ALTER TABLE Revisions DROP COLUMN Metadata;
```

---

## 12. Related Specifications

| Spec | Relationship |
|------|--------------|
| `34-suggestions-system.md` | Suggestions can trigger revisions |
| `36-session-scoped-rag-memory.md` | RAG updates are session-scoped |
| `26-database-paths-reference.md` | Session DB paths |
| `27-ai-seo-blog-generation.md` | Blog content type |
| `22-ai-seo-faq-generation.md` | FAQ content type |
| `11-rag-reindexing.md` | RAG update on revision |
