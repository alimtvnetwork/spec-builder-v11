# Database Schema

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

Dual-database architecture: a root database for global metadata and per-project databases for RAG vectors and file tracking.

**Cross-References:**
- [Core Architecture](./01-core-architecture.md)
- [RAG System](./05-rag-system.md)
- [Project Management](./06-project-management.md)

---

## Architecture

```
~/.wpb/
├── wpb.sqlite              # Root database
├── projects/
│   ├── exam-manager.sqlite # Project database
│   ├── quiz-maker.sqlite   # Project database
│   └── form-builder.sqlite # Project database
└── backups/
    └── ...
```

---

## Root Database Schema

### projects

Tracks all created projects.

```sql
CREATE TABLE Projects (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL UNIQUE,
    Slug TEXT NOT NULL UNIQUE,
    Author TEXT,
    AuthorEmail TEXT,
    Website TEXT,
    Description TEXT,
    TextDomain TEXT,
    Namespace TEXT,
    Version TEXT DEFAULT '1.0.0',
    DbPath TEXT NOT NULL,
    OutputPath TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastGeneratedAt DATETIME,
    GenerationCount INTEGER DEFAULT 0
);

CREATE INDEX IdxProjectsSlug ON Projects(Slug);
CREATE INDEX IdxProjectsCreated ON Projects(CreatedAt);
```

**GORM Model:**

```go
type Project struct {
    ID              uint      `gorm:"primaryKey"`
    Name            string    `gorm:"uniqueIndex;not null"`
    Slug            string    `gorm:"uniqueIndex;not null"`
    Author          string
    AuthorEmail     string
    Website         string
    Description     string
    TextDomain      string
    Namespace       string
    Version         string    `gorm:"default:'1.0.0'"`
    DbPath          string    `gorm:"not null"`
    OutputPath      string
    CreatedAt       time.Time
    UpdatedAt       time.Time
    LastGeneratedAt *time.Time
    GenerationCount int       `gorm:"default:0"`
}
```

---

### presets

Global learning presets.

```sql
CREATE TABLE Presets (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL UNIQUE,
    Category TEXT NOT NULL DEFAULT 'general',
    Description TEXT,
    SourcePath TEXT,
    ContentHash TEXT,
    ChunkCount INTEGER DEFAULT 0,
    IsActive BOOLEAN DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxPresetsCategory ON Presets(Category);
CREATE INDEX IdxPresetsActive ON Presets(IsActive);
```

**Categories:** Defined by `preset_category.Variant` in [`15-enum-architecture.md`](./15-enum-architecture.md):
Core, Admin, Api, Shortcode, Block, General

---

### preset_vectors

Vector embeddings for presets (global knowledge).

```sql
CREATE TABLE PresetVectors (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    PresetId INTEGER NOT NULL REFERENCES Presets(Id) ON DELETE CASCADE,
    ChunkIndex INTEGER NOT NULL,
    Content TEXT NOT NULL,
    Embedding BLOB NOT NULL,
    Metadata JSON,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(PresetId, ChunkIndex)
);

CREATE INDEX IdxPresetVectorsPreset ON PresetVectors(PresetId);
```

---

### settings

Global settings storage.

```sql
CREATE TABLE Settings (
    Key TEXT PRIMARY KEY,
    Value TEXT,
    Type TEXT DEFAULT 'string',
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### generation_log

Global generation history.

```sql
CREATE TABLE GenerationLog (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    ProjectId INTEGER NOT NULL REFERENCES Projects(Id) ON DELETE CASCADE,
    StartedAt DATETIME NOT NULL,
    CompletedAt DATETIME,
    Status TEXT NOT NULL DEFAULT 'running',
    SpecPath TEXT,
    FilesGenerated INTEGER DEFAULT 0,
    Errors JSON,
    Metadata JSON
);

CREATE INDEX IdxGenlogProject ON GenerationLog(ProjectId);
CREATE INDEX IdxGenlogStatus ON GenerationLog(Status);
```

---

## Project Database Schema

Each project has its own SQLite database (`{project-slug}.sqlite`).

### project_files

Tracks all files in the project.

```sql
CREATE TABLE ProjectFiles (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Path TEXT NOT NULL UNIQUE,
    RelativePath TEXT NOT NULL,
    FileType TEXT NOT NULL,
    ContentHash TEXT,
    SizeBytes INTEGER,
    IsGenerated BOOLEAN DEFAULT 0,
    GenerationId INTEGER,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxFilesPath ON ProjectFiles(Path);
CREATE INDEX IdxFilesType ON ProjectFiles(FileType);
CREATE INDEX IdxFilesGenerated ON ProjectFiles(IsGenerated);
```

**File Types:** Defined by `file_type.Variant` in [`15-enum-architecture.md`](./15-enum-architecture.md):
Php, Css, Js, Json, Md, Txt

---

### rag_vectors

Project-specific RAG vectors.

```sql
CREATE TABLE RagVectors (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    SourceType TEXT NOT NULL,
    SourceId TEXT NOT NULL,
    ChunkIndex INTEGER NOT NULL,
    Content TEXT NOT NULL,
    Embedding BLOB NOT NULL,
    Metadata JSON,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(SourceType, SourceId, ChunkIndex)
);

CREATE INDEX IdxRagSource ON RagVectors(SourceType, SourceId);
```

**Source Types:** Defined by `rag_source_type.Variant` in [`15-enum-architecture.md`](./15-enum-architecture.md):
File, Spec, Preset, Generated

---

### specifications

Imported specifications.

```sql
CREATE TABLE Specifications (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Path TEXT NOT NULL,
    Content TEXT NOT NULL,
    ContentHash TEXT,
    Format TEXT DEFAULT 'markdown',
    IsActive BOOLEAN DEFAULT 1,
    ImportedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxSpecsName ON Specifications(Name);
CREATE INDEX IdxSpecsActive ON Specifications(IsActive);
```

---

### generation_history

Detailed generation history for this project.

```sql
CREATE TABLE GenerationHistory (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    SpecId INTEGER REFERENCES Specifications(Id),
    Prompt TEXT NOT NULL,
    ContextUsed JSON,
    Output TEXT NOT NULL,
    Model TEXT,
    TokensIn INTEGER,
    TokensOut INTEGER,
    DurationMs INTEGER,
    ValidationResult JSON,
    Status TEXT DEFAULT 'success',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxGenhistSpec ON GenerationHistory(SpecId);
CREATE INDEX IdxGenhistStatus ON GenerationHistory(Status);
CREATE INDEX IdxGenhistCreated ON GenerationHistory(CreatedAt);
```

---

### file_generations

Links generated files to generation events.

```sql
CREATE TABLE FileGenerations (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    FileId INTEGER NOT NULL REFERENCES ProjectFiles(Id) ON DELETE CASCADE,
    HistoryId INTEGER NOT NULL REFERENCES GenerationHistory(Id) ON DELETE CASCADE,
    Action TEXT NOT NULL,
    PreviousHash TEXT,
    NewHash TEXT,
    Diff TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxFilegenFile ON FileGenerations(FileId);
CREATE INDEX IdxFilegenHistory ON FileGenerations(HistoryId);
```

**Actions:** Defined by `file_action.Variant` in [`15-enum-architecture.md`](./15-enum-architecture.md):
Created, Updated, Skipped, Backup

---

## Entity Relationship Diagram

```
ROOT DATABASE (wpb.sqlite)
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│  projects   │     │   presets   │     │ preset_vectors  │
├─────────────┤     ├─────────────┤     ├─────────────────┤
│ id          │     │ id          │◄────│ preset_id       │
│ name        │     │ name        │     │ chunk_index     │
│ slug        │     │ category    │     │ embedding       │
│ db_path ────┼──┐  │ content_hash│     └─────────────────┘
└─────────────┘  │  └─────────────┘
                 │
                 │  ┌─────────────────────────────────────┐
                 │  │        PROJECT DATABASE              │
                 │  │    ({project-slug}.sqlite)           │
                 ▼  ├─────────────────────────────────────┤
┌────────────────┐  │  ┌──────────────┐  ┌─────────────┐  │
│ {slug}.sqlite  │──│  │project_files │  │ rag_vectors │  │
└────────────────┘  │  └──────────────┘  └─────────────┘  │
                    │  ┌──────────────┐  ┌─────────────┐  │
                    │  │specifications│  │gen_history  │  │
                    │  └──────────────┘  └─────────────┘  │
                    └─────────────────────────────────────┘
```

---

## Vector Storage

Using SQLite with vector extension (sqlite-vec or similar):

```go
type VectorStore struct {
    db *gorm.DB
}

func (v *VectorStore) Insert(embedding []float32, content string, meta RAGResultMetadata) error {
    // Serialize float32 slice to bytes
    blob := serializeVector(embedding)
    
    return v.db.Create(&RAGVector{
        Content:   content,
        Embedding: blob,
        Metadata:  meta,
    }).Error
}

func (v *VectorStore) Search(query []float32, topK int) apperror.Result[[]RAGResult] {
    // ORM EXCEPTION: db.Raw() required — sqlite-vec cosine similarity
    // has no native GORM equivalent. See ORM-Only Policy exceptions:
    // vector search operations where native ORM support is unavailable.
    // SELECT * FROM rag_vectors 
    // ORDER BY vec_distance_cosine(embedding, ?) 
    // LIMIT ?
}
```

---

## Migrations

```go
// Import: "wp-plugin-builder/internal/enums/dbtype"

func RunMigrations(db *gorm.DB, dbType dbtype.Variant) error {
    switch {
    case dbType.IsRoot():
        return db.AutoMigrate(
            &Project{},
            &Preset{},
            &PresetVector{},
            &Setting{},
            &GenerationLog{},
        )
    case dbType.IsProject():
        return db.AutoMigrate(
            &ProjectFile{},
            &RAGVector{},
            &Specification{},
            &GenerationHistory{},
            &FileGeneration{},
        )
    }
    return errors.New(10201, "unknown database type: "+dbType.String())
}
```

---

## See Also

- [RAG System](./05-rag-system.md)
- [Project Management](./06-project-management.md)
- [Error Handling](./10-error-handling.md)
