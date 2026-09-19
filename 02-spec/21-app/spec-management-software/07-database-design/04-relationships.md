# Database Relationships

**Version:** 3.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

---

## Overview

Foreign key constraints, relationships, and index definitions for the Spec Management Software database (**32 entities**).

**Cross-References:**
- [Schema Definition](./01-schema.md)
- [ERD Diagram](./08-diagrams/01-erd.md)

---

## Relationship Types

### GORM Association Tags

| Tag | Meaning | Example |
|-----|---------|---------|
| `HasMany` | One-to-many | User has many Projects |
| `HasOne` | One-to-one | Project has one Metadata |
| `BelongsTo` | Inverse of HasMany/HasOne | Project belongs to User |
| `Many2Many` | Many-to-many (junction table) | Not used in this schema |

### Constraint Actions

| Action | Meaning |
|--------|---------|
| `OnDelete:CASCADE` | Delete children when parent deleted |
| `OnDelete:SET NULL` | Set FK to NULL when parent deleted |
| `OnDelete:RESTRICT` | Prevent deletion if children exist |

---

## Entity Relationships

### User Domain (2 entities)

```
User (1) ──────< Session (*)
     │              └── OnDelete:CASCADE
     │
     ├──────< Project (*)
     │              └── OnDelete:CASCADE
     │
     ├──────< Snapshot (*)
     │              └── OnDelete:SET NULL (CreatedById)
     │
     ├──────< Instruction (*)
     │              └── OnDelete:SET NULL (CreatedById)
     │
     ├──────< PromptPreset (*)
     │              └── OnDelete:SET NULL (CreatedById)
     │
     ├──────< UserPromptOverride (*)
     │              └── OnDelete:CASCADE
     │
     ├──────< PromotionEvent (*)
     │              └── OnDelete:SET NULL (PromotedById)
     │
     └──────< ConfigSeedEvent (*)
                    └── OnDelete:SET NULL (UserId)
```

**GORM Definition:**

```go
type User struct {
    BaseModel
    // ... fields ...
    
    Sessions        []Session            `gorm:"foreignKey:UserId;constraint:OnDelete:CASCADE"`
    Projects        []Project            `gorm:"foreignKey:OwnerId;constraint:OnDelete:CASCADE"`
    Snapshots       []Snapshot           `gorm:"foreignKey:CreatedById;constraint:OnDelete:SET NULL"`
    Instructions    []Instruction        `gorm:"foreignKey:CreatedById;constraint:OnDelete:SET NULL"`
    PromptPresets   []PromptPreset       `gorm:"foreignKey:CreatedById;constraint:OnDelete:SET NULL"`
    PromptOverrides []UserPromptOverride `gorm:"foreignKey:UserId;constraint:OnDelete:CASCADE"`
    PromotionEvents []PromotionEvent     `gorm:"foreignKey:PromotedById;constraint:OnDelete:SET NULL"`
}
```

---

### Project Domain (3 entities)

```
Project (1) ──────< Project (*) [Self-referential: ParentId]
     │                   └── OnDelete:CASCADE
     │
     ├──────< File (*)
     │              └── OnDelete:CASCADE
     │
     ├──────< Snapshot (*)
     │              └── OnDelete:CASCADE
     │
     ├────── ProjectMetadata (1)
     │              └── OnDelete:CASCADE
     │
     ├────── VectorIndexMetadata (1)
     │              └── OnDelete:CASCADE
     │
     ├──────< Instruction (*)
     │              └── OnDelete:CASCADE
     │
     ├──────< Artifact (*)
     │              └── OnDelete:CASCADE
     │
     ├──────< RetrievalSession (*)
     │              └── OnDelete:CASCADE
     │
     ├──────< PromotionEvent (*)
     │              └── OnDelete:CASCADE
     │
     └──────< ConsistencyLoop (*)
                    └── OnDelete:CASCADE
```

**GORM Definition:**

```go
type Project struct {
    BaseModel
    ParentId *string `gorm:"type:text;index"`
    OwnerId  string  `gorm:"type:text;not null;index"`
    // ... fields ...
    
    Parent              *Project             `gorm:"foreignKey:ParentId;constraint:OnDelete:CASCADE"`
    Children            []Project            `gorm:"foreignKey:ParentId"`
    Owner               User                 `gorm:"foreignKey:OwnerId;constraint:OnDelete:CASCADE"`
    Files               []File               `gorm:"foreignKey:ProjectId;constraint:OnDelete:CASCADE"`
    Snapshots           []Snapshot           `gorm:"foreignKey:ProjectId;constraint:OnDelete:CASCADE"`
    Metadata            *ProjectMetadata     `gorm:"foreignKey:ProjectId;constraint:OnDelete:CASCADE"`
    VectorIndex         *VectorIndexMetadata `gorm:"foreignKey:ProjectId;constraint:OnDelete:CASCADE"`
    Instructions        []Instruction        `gorm:"foreignKey:ProjectId;constraint:OnDelete:CASCADE"`
    Artifacts           []Artifact           `gorm:"foreignKey:ProjectId;constraint:OnDelete:CASCADE"`
    RetrievalSessions   []RetrievalSession   `gorm:"foreignKey:ProjectId;constraint:OnDelete:CASCADE"`
    PromotionEvents     []PromotionEvent     `gorm:"foreignKey:ProjectId;constraint:OnDelete:CASCADE"`
    ConsistencyLoops    []ConsistencyLoop    `gorm:"foreignKey:ProjectId;constraint:OnDelete:CASCADE"`
}

type VectorIndexMetadata struct {
    Id        string `gorm:"type:text;primaryKey"`
    ProjectId string `gorm:"type:text;not null;uniqueIndex"`
    // ... fields ...
    
    Project Project `gorm:"foreignKey:ProjectId;constraint:OnDelete:CASCADE"`
}
```

---

### File Domain (2 entities)

```
File (1) ──────< File (*) [Self-referential: ParentId]
     │              └── OnDelete:CASCADE
     │
     └──────< FileChange (*)
                    └── OnDelete:SET NULL (FileId)
```

**GORM Definition:**

```go
type File struct {
    BaseModel
    ProjectId string  `gorm:"type:text;not null;index"`
    ParentId  *string `gorm:"type:text;index"`
    // ... fields ...
    
    Project     Project      `gorm:"foreignKey:ProjectId;constraint:OnDelete:CASCADE"`
    Parent      *File        `gorm:"foreignKey:ParentId;constraint:OnDelete:CASCADE"`
    Children    []File       `gorm:"foreignKey:ParentId"`
    FileChanges []FileChange `gorm:"foreignKey:FileId;constraint:OnDelete:SET NULL"`
}
```

---

### Instruction Domain (5 entities)

```
Instruction (1) ──────< InstructionTask (*)
     │                        │    └── OnDelete:CASCADE
     │                        │
     │                        └──────< FileChange (*)
     │                                       └── OnDelete:CASCADE
     │
     ├────── InconsistencyReport (0..1)
     │              └── OnDelete:CASCADE
     │
     ├──────< RegenerationEvent (*)
     │              └── OnDelete:CASCADE
     │
     ├──────< InstructionSegment (*)
     │              └── OnDelete:CASCADE
     │
     ├──────< MemoryEntry (*)
     │              └── OnDelete:CASCADE
     │
     └────── Artifact (0..1) [Bidirectional: PromotedFromId]
                    └── OnDelete:SET NULL
```

**GORM Definition:**

```go
type Instruction struct {
    BaseModel
    ProjectId        string  `gorm:"type:text;not null;index"`
    CreatedById      string  `gorm:"type:text;not null;index"`
    ReasoningModelId *string `gorm:"type:text;index"`
    PromotedFromId   *string `gorm:"type:text;index"` // Links to Artifact
    // ... fields ...
    
    Project        Project              `gorm:"foreignKey:ProjectId;constraint:OnDelete:CASCADE"`
    CreatedBy      User                 `gorm:"foreignKey:CreatedById;constraint:OnDelete:SET NULL"`
    ReasoningModel *ModelRegistry       `gorm:"foreignKey:ReasoningModelId;constraint:OnDelete:SET NULL"`
    PromotedFrom   *Artifact            `gorm:"foreignKey:PromotedFromId;constraint:OnDelete:SET NULL"`
    Tasks          []InstructionTask    `gorm:"foreignKey:InstructionId;constraint:OnDelete:CASCADE"`
    Report         *InconsistencyReport `gorm:"foreignKey:InstructionId;constraint:OnDelete:CASCADE"`
    Regenerations  []RegenerationEvent  `gorm:"foreignKey:InstructionId;constraint:OnDelete:CASCADE"`
    Segments       []InstructionSegment `gorm:"foreignKey:InstructionId;constraint:OnDelete:CASCADE"`
    MemoryEntries  []MemoryEntry        `gorm:"foreignKey:InstructionId;constraint:OnDelete:CASCADE"`
}

type InstructionTask struct {
    BaseModel
    InstructionId string  `gorm:"type:text;not null;index"`
    ParentTaskId  *string `gorm:"type:text;index"`
    // ... fields ...
    
    Instruction Instruction      `gorm:"foreignKey:InstructionId;constraint:OnDelete:CASCADE"`
    Parent      *InstructionTask `gorm:"foreignKey:ParentTaskId;constraint:OnDelete:CASCADE"`
    Children    []InstructionTask `gorm:"foreignKey:ParentTaskId"`
    FileChanges []FileChange     `gorm:"foreignKey:InstructionTaskId;constraint:OnDelete:CASCADE"`
}

type FileChange struct {
    TimestampModel
    InstructionTaskId string  `gorm:"type:text;not null;index"`
    FileId            *string `gorm:"type:text;index"`
    // ... fields ...
    
    InstructionTask InstructionTask `gorm:"foreignKey:InstructionTaskId;constraint:OnDelete:CASCADE"`
    File            *File           `gorm:"foreignKey:FileId;constraint:OnDelete:SET NULL"`
}

type InstructionSegment struct {
    BaseModel
    InstructionId string `gorm:"type:text;not null;index"`
    // ... fields ...
    
    Instruction Instruction `gorm:"foreignKey:InstructionId;constraint:OnDelete:CASCADE"`
}

type MemoryEntry struct {
    BaseModel
    InstructionId string `gorm:"type:text;not null;index"`
    // ... fields ...
    
    Instruction Instruction `gorm:"foreignKey:InstructionId;constraint:OnDelete:CASCADE"`
}
```

---

### Inconsistency Analysis Domain (5 entities)

```
InconsistencyReport (1) ──────< InconsistencyIssue (*)
                                      │    └── OnDelete:CASCADE
                                      │
                                      └──────< ClarificationQuestion (*)
                                                     │    └── OnDelete:CASCADE
                                                     │
                                                     └────── ClarificationAnswer (0..1)
                                                                    └── OnDelete:CASCADE

Instruction (1) ──────< RegenerationEvent (*)
                               └── OnDelete:CASCADE
```

**GORM Definition:**

```go
type InconsistencyReport struct {
    BaseModel
    InstructionId string `gorm:"type:text;uniqueIndex"`
    // ... fields ...
    
    Instruction Instruction          `gorm:"foreignKey:InstructionId;constraint:OnDelete:CASCADE"`
    Issues      []InconsistencyIssue `gorm:"foreignKey:ReportId;constraint:OnDelete:CASCADE"`
}

type InconsistencyIssue struct {
    BaseModel
    ReportId string `gorm:"type:text;not null;index"`
    // ... fields ...
    
    Report    InconsistencyReport     `gorm:"foreignKey:ReportId;constraint:OnDelete:CASCADE"`
    Questions []ClarificationQuestion `gorm:"foreignKey:IssueId;constraint:OnDelete:CASCADE"`
}

type ClarificationQuestion struct {
    BaseModel
    IssueId string `gorm:"type:text;not null;index"`
    // ... fields ...
    
    Issue  InconsistencyIssue   `gorm:"foreignKey:IssueId;constraint:OnDelete:CASCADE"`
    Answer *ClarificationAnswer `gorm:"foreignKey:QuestionId;constraint:OnDelete:CASCADE"`
}

type ClarificationAnswer struct {
    BaseModel
    QuestionId string `gorm:"type:text;uniqueIndex"`
    // ... fields ...
    
    Question ClarificationQuestion `gorm:"foreignKey:QuestionId;constraint:OnDelete:CASCADE"`
}

type RegenerationEvent struct {
    BaseModel
    InstructionId string `gorm:"type:text;not null;index"`
    // ... fields ...
    
    Instruction Instruction `gorm:"foreignKey:InstructionId;constraint:OnDelete:CASCADE"`
}
```

---

### RAG Domain (6 entities)

```
Artifact (1) ──────< Chunk (*)
     │                   │    └── OnDelete:CASCADE
     │                   │
     │                   └────── Embedding (1)
     │                                 └── OnDelete:CASCADE
     │
     ├────── Instruction (0..1) [Promotion link: PromotedToId]
     │              └── OnDelete:SET NULL
     │
     └──────< PromotionEvent (*) [as SourceArtifact]
                    └── OnDelete:CASCADE


RetrievalSession (1) ──────< RetrievalSessionChunk (*)
                                    │    └── OnDelete:CASCADE
                                    │
                                    └────── Chunk (*)
                                                  └── OnDelete:CASCADE


PromotionEvent links:
     ├── Project (ProjectId) → OnDelete:CASCADE
     ├── Artifact (SourceArtifactId) → OnDelete:CASCADE
     ├── Artifact (TargetArtifactId) → OnDelete:SET NULL
     ├── Instruction (TargetInstructionId) → OnDelete:SET NULL
     └── User (PromotedById) → OnDelete:SET NULL
```

**GORM Definition:**

```go
type Artifact struct {
    BaseModel
    ProjectId    string  `gorm:"type:text;not null;index"`
    PromotedToId *string `gorm:"type:text;index"` // Links to Instruction
    // ... fields ...
    
    Project         Project          `gorm:"foreignKey:ProjectId;constraint:OnDelete:CASCADE"`
    PromotedTo      *Instruction     `gorm:"foreignKey:PromotedToId;constraint:OnDelete:SET NULL"`
    Chunks          []Chunk          `gorm:"foreignKey:ArtifactId;constraint:OnDelete:CASCADE"`
    PromotionEvents []PromotionEvent `gorm:"foreignKey:SourceArtifactId;constraint:OnDelete:CASCADE"`
}

type Chunk struct {
    BaseModel
    ArtifactId string `gorm:"type:text;not null;index"`
    // ... fields ...
    
    Artifact              Artifact                `gorm:"foreignKey:ArtifactId;constraint:OnDelete:CASCADE"`
    Embedding             *Embedding              `gorm:"foreignKey:ChunkId;constraint:OnDelete:CASCADE"`
    RetrievalSessionChunks []RetrievalSessionChunk `gorm:"foreignKey:ChunkId;constraint:OnDelete:CASCADE"`
}

type Embedding struct {
    BaseModel
    ChunkId string `gorm:"type:text;uniqueIndex"`
    // ... fields ...
    
    Chunk Chunk `gorm:"foreignKey:ChunkId;constraint:OnDelete:CASCADE"`
}

type RetrievalSession struct {
    BaseModel
    ProjectId string `gorm:"type:text;not null;index"`
    // ... fields ...
    
    Project Project                 `gorm:"foreignKey:ProjectId;constraint:OnDelete:CASCADE"`
    Chunks  []RetrievalSessionChunk `gorm:"foreignKey:SessionId;constraint:OnDelete:CASCADE"`
}

type RetrievalSessionChunk struct {
    BaseModel
    SessionId string `gorm:"type:text;not null;index"`
    ChunkId   string `gorm:"type:text;not null;index"`
    // ... fields ...
    
    Session RetrievalSession `gorm:"foreignKey:SessionId;constraint:OnDelete:CASCADE"`
    Chunk   Chunk            `gorm:"foreignKey:ChunkId;constraint:OnDelete:CASCADE"`
}

type PromotionEvent struct {
    BaseModel
    ProjectId           string  `gorm:"type:text;not null;index"`
    SourceArtifactId    string  `gorm:"type:text;not null;index"`
    TargetArtifactId    *string `gorm:"type:text;index"`
    TargetInstructionId *string `gorm:"type:text;index"`
    PromotedById        *string `gorm:"type:text;index"`
    // ... fields ...
    
    Project           Project      `gorm:"foreignKey:ProjectId;constraint:OnDelete:CASCADE"`
    SourceArtifact    Artifact     `gorm:"foreignKey:SourceArtifactId;constraint:OnDelete:CASCADE"`
    TargetArtifact    *Artifact    `gorm:"foreignKey:TargetArtifactId;constraint:OnDelete:SET NULL"`
    TargetInstruction *Instruction `gorm:"foreignKey:TargetInstructionId;constraint:OnDelete:SET NULL"`
    PromotedBy        *User        `gorm:"foreignKey:PromotedById;constraint:OnDelete:SET NULL"`
}
```

---

### Prompt System Domain (3 entities)

```
PromptPreset (1) ──────< PromptPresetVersion (*)
     │                          └── OnDelete:CASCADE
     │
     └──────< UserPromptOverride (*)
                    └── OnDelete:CASCADE
```

**GORM Definition:**

```go
type PromptPreset struct {
    BaseModel
    CreatedById *string `gorm:"type:text;index"`
    // ... fields ...
    
    CreatedBy User                  `gorm:"foreignKey:CreatedById;constraint:OnDelete:SET NULL"`
    Versions  []PromptPresetVersion `gorm:"foreignKey:PresetId;constraint:OnDelete:CASCADE"`
    Overrides []UserPromptOverride  `gorm:"foreignKey:PresetId;constraint:OnDelete:CASCADE"`
}

type PromptPresetVersion struct {
    TimestampModel
    PresetId string `gorm:"type:text;not null;index"`
    // ... fields ...
    
    Preset PromptPreset `gorm:"foreignKey:PresetId;constraint:OnDelete:CASCADE"`
}

type UserPromptOverride struct {
    BaseModel
    UserId   string `gorm:"type:text;not null;index"`
    PresetId string `gorm:"type:text;not null;index"`
    // ... fields ...
    
    User   User         `gorm:"foreignKey:UserId;constraint:OnDelete:CASCADE"`
    Preset PromptPreset `gorm:"foreignKey:PresetId;constraint:OnDelete:CASCADE"`
}
```

---

### LLM Model Domain (2 entities)

```
ModelRegistry (1) ──────< ModelSlot (*)
     │                         └── OnDelete:SET NULL (ModelId)
     │
     └──────< Instruction (*)
                    └── OnDelete:SET NULL (ReasoningModelId)
```

**GORM Definition:**

```go
type ModelRegistry struct {
    BaseModel
    // ... fields ...
    
    ModelSlots   []ModelSlot   `gorm:"foreignKey:ModelId;constraint:OnDelete:SET NULL"`
    Instructions []Instruction `gorm:"foreignKey:ReasoningModelId;constraint:OnDelete:SET NULL"`
}

type ModelSlot struct {
    BaseModel
    ModelId *string `gorm:"type:text;index"`
    // ... fields ...
    
    Model *ModelRegistry `gorm:"foreignKey:ModelId;constraint:OnDelete:SET NULL"`
}
```

---

### Consistency Checker Domain (2 entities)

```
ConsistencyLoop (1) ──────< ConsistencyLoopIteration (*)
                                   └── OnDelete:CASCADE
```

**GORM Definition:**

```go
type ConsistencyLoop struct {
    BaseModel
    ProjectId string `gorm:"type:text;not null;index"`
    // ... fields ...
    
    Project    Project                    `gorm:"foreignKey:ProjectId;constraint:OnDelete:CASCADE"`
    Iterations []ConsistencyLoopIteration `gorm:"foreignKey:LoopId;constraint:OnDelete:CASCADE"`
}

type ConsistencyLoopIteration struct {
    BaseModel
    LoopId string `gorm:"type:text;not null;index"`
    // ... fields ...
    
    Loop ConsistencyLoop `gorm:"foreignKey:LoopId;constraint:OnDelete:CASCADE"`
}
```

---

### Configuration Domain (2 entities)

```
Config (standalone - no FK relationships)

ConfigSeedEvent (1) ────── User (0..1)
                                └── OnDelete:SET NULL (UserId)
```

**GORM Definition:**

```go
type Config struct {
    Key   string `gorm:"type:text;primaryKey"`
    Value string `gorm:"type:text;not null"`
    // No FK relationships
}

type ConfigSeedEvent struct {
    TimestampModel
    UserId *string `gorm:"type:text;index"`
    // ... fields ...
    
    User *User `gorm:"foreignKey:UserId;constraint:OnDelete:SET NULL"`
}
```

---

## Index Definitions

### Primary Indexes

All tables have primary key index on `Id` column (automatic via GORM).

### Foreign Key Indexes

| Table | Index | Columns |
|-------|-------|---------|
| Session | `IdxSessionUserId` | UserId |
| Project | `IdxProjectParentId` | ParentId |
| Project | `IdxProjectOwnerId` | OwnerId |
| File | `IdxFileProjectId` | ProjectId |
| File | `IdxFileParentId` | ParentId |
| Snapshot | `IdxSnapshotProjectId` | ProjectId |
| Instruction | `IdxInstructionProjectId` | ProjectId |
| Instruction | `IdxInstructionCreatedById` | CreatedById |
| InstructionTask | `IdxInstructionTaskInstructionId` | InstructionId |
| FileChange | `IdxFileChangeInstructionTaskId` | InstructionTaskId |
| FileChange | `IdxFileChangeFileId` | FileId |
| InstructionSegment | `IdxInstructionSegmentInstruction` | InstructionId |
| MemoryEntry | `IdxMemoryEntryInstruction` | InstructionId |
| Artifact | `IdxArtifactProjectId` | ProjectId |
| Chunk | `IdxChunkArtifactId` | ArtifactId |
| PromotionEvent | `IdxPromotionEventProject` | ProjectId |
| PromotionEvent | `IdxPromotionEventSource` | SourceArtifactId |
| RetrievalSession | `IdxRetrievalSessionProjectId` | ProjectId |
| ConsistencyLoop | `IdxConsistencyLoopProject` | ProjectId |
| ConsistencyLoopIteration | `IdxConsistencyLoopIterationLoop` | LoopId |

### Unique Indexes

| Table | Index | Columns |
|-------|-------|---------|
| User | `IdxUserUsername` | Username |
| User | `IdxUserEmail` | Email |
| Project | `IdxProjectSlug` | Slug |
| Project | `IdxProjectPath` | Path |
| File | `IdxFilePath` | Path |
| Session | `IdxSessionToken` | Token |
| Config | `PK_Config` | Key |
| ProjectMetadata | `IdxProjectMetadataProjectId` | ProjectId |
| VectorIndexMetadata | `IdxVectorIndexMetadataProject` | ProjectId |
| Embedding | `IdxEmbeddingChunkId` | ChunkId |
| ClarificationAnswer | `IdxClarificationAnswerQuestionId` | QuestionId |

### Query Optimization Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| Project | `IdxProjectType` | Type | Filter by category/project |
| Project | `IdxProjectVisibility` | Visibility | Filter global projects |
| File | `IdxFileType` | Type | Filter files vs folders |
| ModelRegistry | `IdxModelRegistryModelType` | ModelType | Filter reasoning/voice |
| ModelSlot | `IdxModelSlotStatus` | Status | Find available slots |
| Instruction | `IdxInstructionStatus` | Status | Filter by status |
| InstructionSegment | `IdxInstructionSegmentStatus` | Status | Filter segment status |
| PromotionEvent | `IdxPromotionEventStatus` | Status | Filter promotion status |
| ConsistencyLoop | `IdxConsistencyLoopTargetReached` | TargetReached | Filter completed loops |

### Composite Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| File | `IdxFileProjectPath` | ProjectId, Path | Fast file lookup |
| Chunk | `IdxChunkArtifactSequence` | ArtifactId, SequenceNumber | Ordered chunk retrieval |
| RetrievalSessionChunk | `IdxRSCSessionChunk` | SessionId, ChunkId | Fast join queries |

---

## Cascade Delete Chains

Understanding delete propagation:

### User Deletion

```
DELETE User
├── CASCADE → Session (all user sessions)
├── CASCADE → Project (all owned projects)
│   ├── CASCADE → File (all project files)
│   │   └── SET NULL → FileChange.FileId
│   ├── CASCADE → Snapshot (all snapshots)
│   ├── CASCADE → ProjectMetadata
│   ├── CASCADE → VectorIndexMetadata
│   ├── CASCADE → Instruction (all instructions)
│   │   ├── CASCADE → InstructionTask
│   │   │   └── CASCADE → FileChange
│   │   ├── CASCADE → InconsistencyReport
│   │   │   └── CASCADE → InconsistencyIssue
│   │   │       └── CASCADE → ClarificationQuestion
│   │   │           └── CASCADE → ClarificationAnswer
│   │   ├── CASCADE → RegenerationEvent
│   │   ├── CASCADE → InstructionSegment
│   │   └── CASCADE → MemoryEntry
│   ├── CASCADE → Artifact (all artifacts)
│   │   ├── CASCADE → Chunk
│   │   │   └── CASCADE → Embedding
│   │   └── CASCADE → PromotionEvent (as source)
│   ├── CASCADE → RetrievalSession
│   │   └── CASCADE → RetrievalSessionChunk
│   ├── CASCADE → PromotionEvent
│   └── CASCADE → ConsistencyLoop
│       └── CASCADE → ConsistencyLoopIteration
├── SET NULL → Snapshot.CreatedById
├── SET NULL → Instruction.CreatedById
├── SET NULL → PromptPreset.CreatedById
├── SET NULL → PromotionEvent.PromotedById
└── SET NULL → ConfigSeedEvent.UserId
```

### Project Deletion

```
DELETE Project
├── CASCADE → Children Projects (recursive)
├── CASCADE → File (all files)
├── CASCADE → Snapshot
├── CASCADE → ProjectMetadata
├── CASCADE → VectorIndexMetadata
├── CASCADE → Instruction
│   └── (full instruction cascade - see above)
├── CASCADE → Artifact
│   ├── CASCADE → Chunk → Embedding
│   └── CASCADE → PromotionEvent
├── CASCADE → RetrievalSession
│   └── CASCADE → RetrievalSessionChunk
├── CASCADE → PromotionEvent
└── CASCADE → ConsistencyLoop
    └── CASCADE → ConsistencyLoopIteration
```

### Instruction Deletion

```
DELETE Instruction
├── CASCADE → InstructionTask
│   └── CASCADE → FileChange
├── CASCADE → InconsistencyReport
│   └── CASCADE → InconsistencyIssue
│       └── CASCADE → ClarificationQuestion
│           └── CASCADE → ClarificationAnswer
├── CASCADE → RegenerationEvent
├── CASCADE → InstructionSegment
├── CASCADE → MemoryEntry
└── SET NULL → Artifact.PromotedToId
```

---

## Entity Count Summary

| Domain | Count | Entities |
|--------|-------|----------|
| User & Auth | 2 | User, Session |
| Project & Organization | 3 | Project, ProjectMetadata, VectorIndexMetadata |
| File & Snapshots | 2 | File, Snapshot |
| Configuration | 2 | Config, ConfigSeedEvent |
| LLM Models | 2 | ModelRegistry, ModelSlot |
| Prompt System | 3 | PromptPreset, PromptPresetVersion, UserPromptOverride |
| Instructions | 5 | Instruction, InstructionTask, FileChange, InstructionSegment, MemoryEntry |
| Inconsistency Analysis | 5 | InconsistencyReport, InconsistencyIssue, ClarificationQuestion, ClarificationAnswer, RegenerationEvent |
| RAG | 6 | Artifact, Chunk, Embedding, RetrievalSession, RetrievalSessionChunk, PromotionEvent |
| Consistency Checker | 2 | ConsistencyLoop, ConsistencyLoopIteration |
| **Total** | **32** | |

---

## Related Specs

- [Schema Definition](./01-schema.md) — Complete GORM models (32 entities)
- [ERD Diagram](./08-diagrams/01-erd.md) — Visual representation
- [Conventions](./06-conventions.md) — Naming standards
