# AI Bridge CLI: AI SEO Generate Module

**Version:** 5.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

The **AI SEO Generate** module enables automated SEO content generation with industry-specific presets, template-based generation, and file upload training capabilities.

---

## Core Features

| Feature | Description |
|---------|-------------|
| Industry Presets | Pre-trained configurations for different business types |
| Template Engine | HTML/Markdown templates with variable substitution |
| Bulk Generation | Parallel generation of multiple pages |
| File Upload Training | Learn from uploaded ZIP bundles |
| RAG Integration | Use ingested content for context |
| Live Progress | WebSocket streaming for generation status |

---

## Database Architecture

### SEO Module Paths

```
data/
└── {appName}/
    ├── seo/
    │   ├── presets/                               # Industry presets
    │   │   ├── cleaning-business/
    │   │   │   ├── instructions/
    │   │   │   │   ├── 01-general-guidelines.md
    │   │   │   │   ├── 02-keyword-strategy.md
    │   │   │   │   └── 03-local-seo.txt
    │   │   │   └── samples/
    │   │   │       ├── service-page.html
    │   │   │       ├── location-page.html
    │   │   │       └── blog-post.html
    │   │   │
    │   │   ├── ai-business/
    │   │   │   ├── instructions/
    │   │   │   └── samples/
    │   │   │
    │   │   └── ecommerce/
    │   │       ├── instructions/
    │   │       └── samples/
    │   │
    │   ├── jobs/
    │   │   ├── 001-job-abc123.db                  # Generation job session
    │   │   └── 002-job-def456.db
    │   │
    │   └── output/
    │       ├── 001-batch-abc/                     # Generated content batch
    │       │   ├── service-cleaning-nyc.html
    │       │   ├── service-cleaning-la.html
    │       │   └── manifest.json
    │       └── 002-batch-def/
    │
    └── uploads/                                   # File upload area
        └── {appName}/
            └── {uploadId}/
                ├── extracted/                     # Unzipped content
                └── metadata.json
```

---

## Preset Structure

### Folder Layout

```
data/{appName}/seo/presets/{industry}/
├── instructions/                 # Training instructions (MD, TXT)
│   ├── 01-general-guidelines.md
│   ├── 02-keyword-strategy.md
│   ├── 03-tone-and-voice.md
│   └── 04-seo-rules.txt
│
└── samples/                      # HTML/Template samples
    ├── service-page.html
    ├── location-page.html
    ├── blog-post.html
    └── product-page.html
```

### Instruction File Format

```markdown
# General Guidelines for Cleaning Business SEO

## Target Audience
- Homeowners seeking cleaning services
- Property managers
- Commercial clients

## Keyword Focus
- Primary: "[city] cleaning services"
- Secondary: "house cleaning [city]", "office cleaning [city]"
- Long-tail: "best cleaning service in [city]"

## Content Requirements
1. Include service area coverage
2. Mention satisfaction guarantee
3. List specific services offered
4. Include call-to-action
5. Use local landmarks/references
```

### Sample Template Format

```html
<!-- Template: service-page.html -->
<!-- Variables: {{city}}, {{service}}, {{phone}}, {{cta}} -->

<!DOCTYPE html>
<html lang="en">
<head>
    <title>{{service}} in {{city}} | Professional Cleaning</title>
    <meta name="description" content="Expert {{service}} in {{city}}. Call {{phone}} for a free quote.">
</head>
<body>
    <h1>{{service}} in {{city}}</h1>
    
    <section class="intro">
        <!-- AI GENERATE: Introduction paragraph about {{service}} for {{city}} audience -->
    </section>
    
    <section class="services">
        <!-- AI GENERATE: List of services included in {{service}} -->
    </section>
    
    <section class="cta">
        <a href="tel:{{phone}}">{{cta}}</a>
    </section>
</body>
</html>
```

---

## API Endpoints

### Preset Management

```
GET /api/v1/seo/presets
  Returns: List of available industry presets

GET /api/v1/seo/presets/:industry
  Returns: Preset details with instructions and samples

POST /api/v1/seo/presets/:industry
  Body: multipart/form-data with ZIP file
  Creates: New industry preset from uploaded files

PUT /api/v1/seo/presets/:industry
  Body: multipart/form-data with ZIP file
  Updates: Existing industry preset

DELETE /api/v1/seo/presets/:industry
  Deletes: Industry preset (2-step confirmation)
```

### Content Generation

```
POST /api/v1/seo/generate
  Body: {
    "AppName": "my-project",
    "Preset": "cleaning-business",
    "Template": "service-page.html",
    "Variables": [
      { "City": "New York", "Service": "House Cleaning", "Phone": "555-0123" },
      { "City": "Los Angeles", "Service": "House Cleaning", "Phone": "555-0124" }
    ],
    "OutputFormat": "html",
    "Parallelism": 3
  }
  Returns: { "JobId": "job_abc123", "Status": "processing", "TotalPages": 2 }

GET /api/v1/seo/jobs/:id
  Returns: Job status with progress

GET /api/v1/seo/jobs/:id/stream
  WebSocket: Live generation progress

GET /api/v1/seo/output/:batchId
  Returns: List of generated files

GET /api/v1/seo/output/:batchId/:filename
  Returns: Generated file content
```

### File Upload & Training

```
POST /api/v1/seo/upload
  Body: multipart/form-data with ZIP file
  Accepts: ZIP containing CSV, HTML, Markdown, SQLite
  Returns: { "UploadId": "upl_xyz", "Files": [...], "Status": "processing" }

GET /api/v1/seo/upload/:id/status
  Returns: Processing status with WebSocket for live updates

POST /api/v1/seo/upload/:id/ingest
  Ingests uploaded files into RAG memory
```

---

## File Upload Processing

### Supported Formats in ZIP

| Format | Handler | Purpose |
|--------|---------|---------|
| `.md` | Markdown Parser | Instructions, guidelines |
| `.txt` | Plain Text | Keywords, rules |
| `.html` | HTML Parser | Templates, samples |
| `.csv` | CSV Parser | Bulk variables, data |
| `.db` / `.sqlite` | SQLite Reader | Pre-existing RAG data |

### Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FILE UPLOAD PROCESSING FLOW                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. UPLOAD                                                                  │
│      POST /api/v1/seo/upload                                                │
│      └── Save to: data/uploads/{app}/{uploadId}/                            │
│                                                                              │
│   2. EXTRACT                                                                 │
│      └── Unzip to: data/uploads/{app}/{uploadId}/extracted/                 │
│      └── Create metadata.json with file manifest                            │
│                                                                              │
│   3. PARALLEL PROCESSING (WebSocket Progress)                                │
│      ┌─────────────────────────────────────────────────────────────────┐    │
│      │ For each file:                                                   │    │
│      │   a. Detect file type                                           │    │
│      │   b. Check dependencies (if file X needs Y, pause X)            │    │
│      │   c. Parse content                                              │    │
│      │   d. Generate embeddings                                        │    │
│      │   e. Store in RAG memory                                        │    │
│      │   f. Send progress via WebSocket                                │    │
│      └─────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│   4. COMPLETION                                                              │
│      └── All files indexed in RAG                                           │
│      └── Ready for generation                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Dependency Resolution (Unlimited with Cycle Detection)

```go
type FileProcessor struct {
    processed   map[string]bool
    processing  map[string]bool  // For cycle detection
    dependencies map[string][]string
}

func (p *FileProcessor) ProcessFile(path string) *appfault.AppError {
    // Check for cycle
    if p.processing[path] {
        return appfault.New(
            ErrSeoCircularDependency,
            "circular dependency detected: %s",
            path,
        )
    }
    
    // Already processed
    if p.processed[path] {
        return nil
    }
    
    // Mark as processing
    p.processing[path] = true
    defer func() { delete(p.processing, path) }()
    
    // Process dependencies first
    for _, dep := range p.dependencies[path] {
        if err := p.ProcessFile(dep); err != nil {
            return err
        }
    }
    
    // Process this file
    if err := p.parseAndIngest(path); err != nil {
        return err
    }
    
    p.processed[path] = true
    return nil
}
```

---

## Job Session Database

### Path: `data/{appName}/seo/jobs/{seq}-{id}.db`

```sql
-- ============================================
-- Table: JobMeta (job metadata - singleton)
-- ============================================
CREATE TABLE JobMeta (
    Id TEXT PRIMARY KEY DEFAULT 'singleton',
    JobId TEXT UNIQUE NOT NULL,
    Preset TEXT NOT NULL,
    Template TEXT NOT NULL,
    TotalPages INTEGER NOT NULL,
    CompletedPages INTEGER DEFAULT 0,
    FailedPages INTEGER DEFAULT 0,
    OutputBatchId TEXT,
    StartedAt DATETIME,
    CompletedAt DATETIME,
    Status TEXT DEFAULT 'Pending'                  -- Pending, Processing, Completed, Failed
);


-- ============================================
-- Table: PageGenerations (individual page jobs)
-- ============================================
CREATE TABLE PageGenerations (
    Id TEXT PRIMARY KEY,
    SequenceNum INTEGER NOT NULL,
    Variables TEXT NOT NULL,                       -- JSON: page variables
    OutputPath TEXT,
    GeneratedContent TEXT,
    TokensUsed INTEGER,
    DurationMs INTEGER,
    StartedAt DATETIME,
    CompletedAt DATETIME,
    Status TEXT DEFAULT 'Pending',                 -- Pending, Processing, Completed, Failed
    ErrorMessage TEXT
);

CREATE INDEX IdxPageGenSeq ON PageGenerations(SequenceNum);
CREATE INDEX IdxPageGenStatus ON PageGenerations(Status);


-- ============================================
-- Table: GenerationLogs (detailed logs)
-- ============================================
CREATE TABLE GenerationLogs (
    Id TEXT PRIMARY KEY,
    PageId TEXT,
    Level TEXT NOT NULL,                           -- info, warn, error
    Message TEXT NOT NULL,
    Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PageId) REFERENCES PageGenerations(Id)
);
```

---

## WebSocket Protocol

### Connection

```
ws://localhost:5040/ws/seo/jobs/:jobId
```

### Messages

```json
// Server → Client: Progress update
{
  "Type": "progress",
  "JobId": "job_abc123",
  "CurrentPage": 15,
  "TotalPages": 50,
  "CurrentFile": "service-cleaning-nyc.html",
    "Status": "Processing"
}

// Server → Client: Page completed
{
  "Type": "PageCompleted",
  "PageId": "page_xyz",
  "OutputPath": "output/001-batch/service-cleaning-nyc.html",
  "TokensUsed": 523,
  "DurationMs": 2341
}

// Server → Client: Job completed
{
  "Type": "Completed",
  "JobId": "job_abc123",
  "TotalPages": 50,
  "SuccessfulPages": 48,
  "FailedPages": 2,
  "OutputBatchId": "001-batch-abc"
}

// Server → Client: File processing (for uploads)
{
  "Type": "FileProcessing",
  "UploadId": "upl_xyz",
  "CurrentFile": "instructions/02-keyword-strategy.md",
  "ProcessedFiles": 5,
  "TotalFiles": 12,
  "Status": "processing"
}

// Server → Client: Dependency resolution
{
  "Type": "DependencyPaused",
  "CurrentFile": "templates/service-page.html",
  "RequiredFile": "instructions/01-general-guidelines.md",
  "Message": "Pausing to process dependency first"
}
```

---

## RAG Memory Export/Import

### Export SEO Training Data

```
POST /api/v1/seo/export
  Body: { "Type": "preset" | "rag" | "all", "Preset": "cleaning-business" }
  Returns: Binary SQLite bundle download
```

### Import SEO Training Data

```
POST /api/v1/seo/import
  Body: multipart/form-data with .db file
  Returns: { "Imported": true, "PresetCount": 3, "ChunkCount": 1500 }
```

### Portable RAG Bundle Schema

```sql
-- Exportable RAG bundle includes:
-- 1. Preset configuration
-- 2. Instruction chunks with embeddings
-- 3. Sample templates
-- 4. Generation history metadata

CREATE TABLE ExportMeta (
    Id TEXT PRIMARY KEY DEFAULT 'singleton',
    ExportedAt DATETIME,
    SourceApp TEXT,
    Version TEXT,
    PresetName TEXT,
    ChunkCount INTEGER,
    TemplateCount INTEGER
);

CREATE TABLE InstructionChunks (
    Id TEXT PRIMARY KEY,
    SourceFile TEXT,
    ChunkIndex INTEGER,
    Content TEXT,
    Embedding BLOB,
    EmbeddingModel TEXT,
    Metadata TEXT
);

CREATE TABLE TemplateDefinitions (
    Id TEXT PRIMARY KEY,
    Name TEXT,
    Content TEXT,
    Variables TEXT,                                -- JSON: list of variables
    Metadata TEXT
);
```

---

## Configuration (config.seed.json)

```json
{
  "Rag": {
    "ChunkSize": 2048,
    "ChunkSizeMin": 256,
    "ChunkSizeMax": 8192,
    "ChunkOverlap": 100,
    "ChunkOverlapMin": 0,
    "ChunkOverlapMax": 512,
    "EmbeddingModel": "nomic-embed-text",
    "ContextTokenBudget": 4096,
    "TopK": 10,
    "SimilarityThreshold": 0.7
  },
  "Seo": {
    "DefaultModel": "thinking",
    "Parallelism": 3,
    "MaxPagesPerJob": 100,
    "OutputFormats": ["html", "markdown", "json"],
    "UploadMaxSizeMb": 50,
    "SupportedFormats": [".md", ".txt", ".html", ".csv", ".db", ".sqlite"],
    "DependencyResolution": "Unlimited",
    "CycleDetection": true
  }
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Database Architecture | `./12-database-architecture.md` |
| API Interface | `./04-api-interface.md` |
| RAG Reindexing | `./11-rag-reindexing.md` |
| Model Management | `./07-model-management.md` |
