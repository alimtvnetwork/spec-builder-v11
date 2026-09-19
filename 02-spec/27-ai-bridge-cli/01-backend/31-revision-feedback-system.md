# AI Bridge CLI: Revision & Feedback System

**Version:** 5.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

The Revision & Feedback System enables iterative refinement of AI-generated content across all content types (blog posts, FAQ, HTML, code, chat conversations). Users can provide feedback notes that trigger regeneration while preserving full version history for comparison and rollback.

---

## Content Types Supporting Revisions

| Content Type | Database Path | Use Case |
|--------------|---------------|----------|
| Blog Post | `data/{app}/rag/seo/blog/{company}/{seq}-{slug}.db` | SEO content generation |
| FAQ | `data/{app}/rag/seo/faq/{company}/{seq}-{slug}.db` | FAQ generation |
| HTML Paragraph | `data/{app}/rag/seo/paragraph/{company}/{seq}-{slug}.db` | HTML snippet generation |
| Code | `data/{app}/rag/code/{company}/{seq}-{task-id}.db` | Code generation/refactoring |
| Chat | `data/{app}/rag/chat/{company}/{seq}-{session-id}.db` | Conversation messages |

---

## Database Schema

### Revisions Table (Added to Each Content DB)

```sql
-- ============================================
-- Table: Revisions (version history)
-- ============================================
CREATE TABLE Revisions (
    Id TEXT PRIMARY KEY,
    ContentId TEXT NOT NULL,                  -- FK to main content (BlogId, FaqId, etc.)
    Version INTEGER NOT NULL,                 -- 1, 2, 3... (monotonically increasing)
    
    -- Content snapshot
    Content TEXT NOT NULL,                    -- Full generated content at this version
    ContentType TEXT NOT NULL,                -- content_type.Variant: Blog, Faq, Html, Code, Chat
    ContentHash TEXT NOT NULL,                -- SHA256 of content for diff detection
    
    -- Generation context
    PromptUsed TEXT,                          -- System + user prompt used
    ModelUsed TEXT,                           -- "qwen2.5:32b", etc.
    Temperature REAL,
    TokensGenerated INTEGER,
    GenerationDurationMs INTEGER,
    
    -- Revision metadata
    IsActive BOOLEAN DEFAULT FALSE,           -- TRUE for current active version
    IsPinned BOOLEAN DEFAULT FALSE,           -- User-marked as important
    Label TEXT,                               -- Optional user label: "Final Draft", "Before Edit"
    
    -- Timestamps
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(ContentId, Version)
);

CREATE INDEX IdxRevisionsContent ON Revisions(ContentId);
CREATE INDEX IdxRevisionsActive ON Revisions(ContentId, IsActive) WHERE IsActive = TRUE;
CREATE INDEX IdxRevisionsVersion ON Revisions(ContentId, Version DESC);


-- ============================================
-- Table: RevisionFeedback (feedback notes)
-- ============================================
CREATE TABLE RevisionFeedback (
    Id TEXT PRIMARY KEY,
    RevisionId TEXT NOT NULL,                 -- FK to Revisions.Id
    
    -- Feedback content
    FeedbackType TEXT NOT NULL,               -- feedback_type.Variant: RevisionRequest, Approval, Rejection, Note
    FeedbackText TEXT NOT NULL,               -- User's feedback message
    FeedbackSource TEXT DEFAULT 'user',       -- feedback_source.Variant: User, Automated, Qa
    
    -- Selection context (optional - for inline feedback)
    SelectionStart INTEGER,                   -- Character offset start
    SelectionEnd INTEGER,                     -- Character offset end
    SelectedText TEXT,                        -- The highlighted text
    
    -- Processing status
    ProcessedAt DATETIME,                     -- When feedback was applied
    ResultRevisionId TEXT,                    -- FK to new Revision created from feedback
    
    -- Metadata
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    CreatedBy TEXT,                           -- User identifier
    
    FOREIGN KEY (RevisionId) REFERENCES Revisions(Id)
);

CREATE INDEX IdxFeedbackRevision ON RevisionFeedback(RevisionId);
CREATE INDEX IdxFeedbackPending ON RevisionFeedback(ProcessedAt) WHERE ProcessedAt IS NULL;


-- ============================================
-- Table: RevisionDiffs (computed differences)
-- ============================================
CREATE TABLE RevisionDiffs (
    Id TEXT PRIMARY KEY,
    FromRevisionId TEXT NOT NULL,             -- Previous version
    ToRevisionId TEXT NOT NULL,               -- New version
    
    -- Diff content
    DiffType TEXT NOT NULL,                   -- diff_type.Variant: Unified, SideBySide, Inline
    DiffContent TEXT NOT NULL,                -- Computed diff output
    
    -- Stats
    LinesAdded INTEGER DEFAULT 0,
    LinesRemoved INTEGER DEFAULT 0,
    LinesModified INTEGER DEFAULT 0,
    SimilarityScore REAL,                     -- 0.0-1.0 similarity
    
    -- Cache metadata
    ComputedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (FromRevisionId) REFERENCES Revisions(Id),
    FOREIGN KEY (ToRevisionId) REFERENCES Revisions(Id),
    UNIQUE(FromRevisionId, ToRevisionId, DiffType)
);

CREATE INDEX IdxDiffsFrom ON RevisionDiffs(FromRevisionId);
CREATE INDEX IdxDiffsTo ON RevisionDiffs(ToRevisionId);
```

---

## Revision Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          REVISION FEEDBACK FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. INITIAL GENERATION                                                      │
│   ─────────────────────                                                      │
│   User request ──▶ AI generates content ──▶ Revision v1 created (IsActive)  │
│                                                                              │
│   2. USER PROVIDES FEEDBACK                                                  │
│   ─────────────────────────                                                  │
│   User reviews v1 ──▶ Writes feedback note ──▶ RevisionFeedback created     │
│                       "Make the intro more engaging"                         │
│                       "Add more technical details"                           │
│                       "Remove the marketing jargon"                          │
│                                                                              │
│   3. REGENERATION WITH CONTEXT                                               │
│   ─────────────────────────────                                              │
│   System builds prompt:                                                      │
│   ┌─────────────────────────────────────────────────────────────┐           │
│   │ Previous Content: [v1 content]                               │           │
│   │ User Feedback: "Make the intro more engaging"                │           │
│   │ Task: Revise the content based on feedback                   │           │
│   └─────────────────────────────────────────────────────────────┘           │
│   ──▶ AI generates v2 ──▶ Revision v2 created (IsActive = TRUE)            │
│                          ──▶ v1.IsActive = FALSE                            │
│                          ──▶ Feedback.ProcessedAt = NOW()                   │
│                          ──▶ Feedback.ResultRevisionId = v2.Id              │
│                                                                              │
│   4. COMPARISON & ROLLBACK (Optional)                                        │
│   ──────────────────────────────────                                         │
│   User can: - View diff between any versions                                 │
│             - Rollback to any previous version                               │
│             - Pin important versions                                         │
│             - Label versions for reference                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### List Revisions

```
GET /api/v1/{contentType}/{contentId}/revisions
```

**Query Parameters:**
- `Limit`: Max revisions to return (default: 20)
- `IncludeContent`: Include full content in response (default: false)

**Response:**
```json
{
  "ContentId": "blog_abc123",
  "ContentType": "blog",
  "TotalRevisions": 5,
  "ActiveVersion": 5,
  "Revisions": [
    {
      "Id": "rev_001",
      "Version": 1,
      "Label": "Initial Draft",
      "IsActive": false,
      "IsPinned": true,
      "TokenCount": 1250,
      "CreatedAt": "2026-02-03T10:00:00Z",
      "FeedbackCount": 2
    },
    {
      "Id": "rev_005",
      "Version": 5,
      "Label": null,
      "IsActive": true,
      "IsPinned": false,
      "TokenCount": 1480,
      "CreatedAt": "2026-02-03T14:30:00Z",
      "FeedbackCount": 0
    }
  ]
}
```

### Get Revision Content

```
GET /api/v1/{contentType}/{contentId}/revisions/{version}
```

**Response:**
```json
{
  "Id": "rev_001",
  "ContentId": "blog_abc123",
  "Version": 1,
  "Content": "# How to Build...\n\n...",
  "ContentHash": "sha256:abc123...",
  "ModelUsed": "qwen2.5:32b",
  "Temperature": 0.7,
  "TokensGenerated": 1250,
  "GenerationDurationMs": 4500,
  "IsActive": false,
  "IsPinned": true,
  "Label": "Initial Draft",
  "CreatedAt": "2026-02-03T10:00:00Z",
  "Feedback": [
    {
      "Id": "fb_001",
      "FeedbackType": "revision_request",
      "FeedbackText": "Make the introduction more engaging",
      "ProcessedAt": "2026-02-03T10:15:00Z",
      "ResultVersion": 2
    }
  ]
}
```

### Submit Feedback

```
POST /api/v1/{contentType}/{contentId}/revisions/{version}/feedback
```

**Request:**
```json
{
  "FeedbackType": "revision_request",
  "FeedbackText": "The technical section is too basic. Add more advanced examples with error handling.",
  "Selection": {
    "Start": 450,
    "End": 780,
    "Text": "Here is a basic example..."
  },
  "AutoRegenerate": true
}
```

**Response:**
```json
{
  "FeedbackId": "fb_003",
  "Status": "processing",
  "NewRevisionId": "rev_006",
  "NewVersion": 6,
  "Message": "Regenerating content with feedback..."
}
```

### Regenerate from Feedback

```
POST /api/v1/{contentType}/{contentId}/revisions/{version}/regenerate
```

**Request:**
```json
{
  "FeedbackIds": ["fb_001", "fb_002"],
  "AdditionalInstructions": "Also improve formatting",
  "ModelOverride": "llama3.1:70b"
}
```

### Compare Revisions

```
GET /api/v1/{contentType}/{contentId}/revisions/diff?From={v1}&To={v2}
```

**Query Parameters:**
- `From`: Source version number
- `To`: Target version number
- `Format`: diff_type.Variant - "Unified" | "SideBySide" | "Inline" (default: "Unified")

**Response:**
```json
{
  "FromVersion": 1,
  "ToVersion": 3,
  "Format": "unified",
  "Diff": "--- v1\n+++ v3\n@@ -1,5 +1,7 @@\n # How to Build...",
  "Stats": {
    "LinesAdded": 15,
    "LinesRemoved": 8,
    "LinesModified": 12,
    "SimilarityScore": 0.78
  }
}
```

### Rollback to Version

```
POST /api/v1/{contentType}/{contentId}/revisions/{version}/rollback
```

**Request:**
```json
{
  "CreateCopy": true,
  "Label": "Rollback from v5 to v2"
}
```

**Response:**
```json
{
  "PreviousActiveVersion": 5,
  "NewActiveVersion": 6,
  "RolledBackFrom": 2,
  "Message": "Created new revision v6 from v2 content"
}
```

### Label/Pin Revision

```
PATCH /api/v1/{contentType}/{contentId}/revisions/{version}
```

**Request:**
```json
{
  "Label": "Client Approved",
  "IsPinned": true
}
```

---

## Content-Type Specific Integration

### Blog Post Revisions

```go
// In blog generation handler
func (h *BlogHandler) GenerateWithFeedback(context stdctx.Context, req *BlogGenerateRequest) appfault.Result[*BlogResponse] {
    // 1. Get previous revision if exists
    prevRevision, _ := h.revisionRepo.GetActiveRevision(req.BlogId)
    
    // 2. Get unprocessed feedback
    pendingFeedback, _ := h.feedbackRepo.GetPending(prevRevision.Id)
    
    // 3. Build enhanced prompt with feedback context
    prompt := h.promptBuilder.BuildWithFeedback(
        req.OriginalPrompt,
        prevRevision.Content,
        pendingFeedback,
    )
    
    // 4. Generate new content
    content, err := h.aiClient.Generate(context, prompt)
    
    // 5. Create new revision
    newRevision := &Revision{
        ContentId:   req.BlogId,
        Version:     prevRevision.Version + 1,
        Content:     content,
        ContentType: content_type.Blog,
        IsActive:    true,
    }
    h.revisionRepo.Create(newRevision)
    
    // 6. Mark previous as inactive
    h.revisionRepo.DeactivateVersion(prevRevision.Id)
    
    // 7. Mark feedback as processed
    h.feedbackRepo.MarkProcessed(pendingFeedback, newRevision.Id)
    
    _ = err // Content generation errors handled by aiClient internally
    return appfault.Ok(&BlogResponse{Revision: newRevision})
}
```

### Chat Message Revisions

For chat, revisions track individual message regenerations:

```sql
-- In chat session DB: data/{app}/rag/chat/{company}/{seq}-{id}.db
ALTER TABLE Messages ADD COLUMN RevisionVersion INTEGER DEFAULT 1;
ALTER TABLE Messages ADD COLUMN ParentMessageId TEXT;  -- Original message if regenerated

-- RevisionFeedback can reference message IDs
-- RevisionFeedback.ContentId = MessageId
```

### Code Generation Revisions

```
data/{app}/rag/code/{company}/{seq}-{task-id}.db
├── CodeMeta (task info)
├── CodeFiles (generated files per revision)
├── Revisions (version history)
├── RevisionFeedback (code review comments)
└── RevisionDiffs (code diffs)
```

---

## Go Structs

### Revision

```go
type Revision struct {
    Id                   string
    ContentId            string
    Version              int
    Content              string
    ContentType          content_type.Variant
    ContentHash          string
    PromptUsed           string    `json:",omitempty"`
    ModelUsed            string    `json:",omitempty"`
    Temperature          float64   `json:",omitempty"`
    TokensGenerated      int       `json:",omitempty"`
    GenerationDurationMs int       `json:",omitempty"`
    IsActive             bool
    IsPinned             bool
    Label                string    `json:",omitempty"`
    CreatedAt            time.Time
}
```

### RevisionFeedback

```go
type RevisionFeedback struct {
    Id               string
    RevisionId       string
    FeedbackType     feedback_type.Variant
    FeedbackText     string
    FeedbackSource   feedback_source.Variant
    SelectionStart   int       `json:",omitempty"`
    SelectionEnd     int       `json:",omitempty"`
    SelectedText     string    `json:",omitempty"`
    ProcessedAt      time.Time `json:",omitempty"`
    ResultRevisionId string    `json:",omitempty"`
    CreatedAt        time.Time
    CreatedBy        string    `json:",omitempty"`
}
```

### RevisionDiff

```go
type RevisionDiff struct {
    Id             string
    FromRevisionId string
    ToRevisionId   string
    DiffType       diff_type.Variant
    DiffContent    string
    LinesAdded     int
    LinesRemoved   int
    LinesModified  int
    SimilarityScore float64
    ComputedAt     time.Time
}
```

---

## Prompt Template for Revision

```markdown
## Previous Content

{PreviousContent}

## User Feedback

{FeedbackNotes}

## Inline Selections

{#each Selections}
Selected text: "{SelectedText}"
Feedback: "{FeedbackForSelection}"
{/each}

## Task

Revise the previous content based on the user feedback above. 
- Address each feedback point explicitly
- Maintain the overall structure unless feedback requests changes
- Preserve any sections not mentioned in feedback
- Keep the same tone and style unless feedback requests changes

## Output Format

{OutputFormat}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 9700 | `ErrRevisionNotFound` | Specified revision version does not exist |
| 9701 | `ErrRevisionCreateFailed` | Failed to create new revision |
| 9702 | `ErrFeedbackInvalid` | Feedback text is empty or malformed |
| 9703 | `ErrSelectionOutOfBounds` | Selection offsets exceed content length |
| 9704 | `ErrRollbackFailed` | Could not rollback to specified version |
| 9705 | `ErrDiffComputeFailed` | Failed to compute difference between versions |
| 9706 | `ErrVersionPinned` | Cannot delete pinned version |
| 9707 | `ErrRegenerationInProgress` | Another regeneration is already running |

---

## Configuration

```yaml
# config.seed.yaml additions
Revision:
  MaxVersionsPerContent: 50          # Max revisions before oldest auto-archived
  AutoArchiveAfterDays: 90           # Archive old revisions after N days
  DiffCacheEnabled: true             # Cache computed diffs
  DiffCacheTtlDays: 30               # Diff cache TTL
  FeedbackMaxLength: 5000            # Max chars per feedback note
  SelectionsMaxPerFeedback: 10       # Max inline selections per feedback
```

---

## See Also

- [Database Paths Reference](./26-database-paths-reference.md)
- [Database Architecture](./12-database-architecture.md)
- [Blog Generation](./27-ai-seo-blog-generation.md)
- [FAQ Generation](./22-ai-seo-faq-generation.md)
- [Paragraph Generation](./25-ai-seo-paragraph-generation.md)
- [Enum Architecture](./53-enum-architecture.md)
