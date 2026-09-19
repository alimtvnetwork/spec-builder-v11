# Suggestions System

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09

---

## Overview

The Suggestions System automatically generates actionable improvement recommendations during AI interactions. Each task or chat interaction produces 5-10 contextual suggestions that are tracked until resolved. Suggestions are stored in a dedicated folder structure and linked to their originating tasks.

**Cross-References:**
- [Instruction System](../06-ai-integration/03-instruction-system.md)
- [Code Generation System](./00-overview.md)
- [Project Editor UI](./20-project-editor-ui.md)
- [AI Integration](../06-ai-integration/00-overview.md)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          SUGGESTIONS SYSTEM                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │    Task/     │    │  Suggestion  │    │  Suggestion  │    │  Suggestion  │   │
│  │    Chat      │───▶│  Generator   │───▶│   Storage    │───▶│   Tracker    │   │
│  │  Completion  │    │     (AI)     │    │   (Files)    │    │     (DB)     │   │
│  └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘   │
│                             │                   │                    │           │
│                             │                   │                    │           │
│                             ▼                   ▼                    ▼           │
│                      ┌──────────────────────────────────────────────────────┐   │
│                      │               Suggestion Resolution                   │   │
│                      │                                                       │   │
│                      │  pending/             ───▶           resolved/        │   │
│                      │  suggestion_001.md    (resolve)      suggestion_001.md│   │
│                      │                                                       │   │
│                      └──────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
{workDirectory}/
└── data/
    └── projects/
        └── {project_name}/
            └── suggestions/
                ├── pending/                    # Active suggestions
                │   ├── 2026-01-29_001_add-error-handling.md
                │   ├── 2026-01-29_002_improve-api-docs.md
                │   ├── 2026-01-29_003_add-unit-tests.md
                │   └── ...
                │
                └── resolved/                   # Completed suggestions
                    ├── 2026-01-28_001_fix-auth-flow.md
                    ├── 2026-01-28_002_add-validation.md
                    └── ...
```

### File Naming Convention

| Component | Format | Example |
|-----------|--------|---------|
| Date | `YYYY-MM-DD` | `2026-01-29` |
| Sequence | `###` (3-digit daily sequence) | `001`, `002` |
| Slug | Kebab-case summary (max 50 chars) | `add-error-handling` |
| Full Name | `{date}_{seq}_{slug}.md` | `2026-01-29_001_add-error-handling.md` |

---

## Suggestion File Format

```markdown
# Suggestion: Add Error Handling to API Endpoints

**ID:** sugg_a1b2c3d4  
**Status:** pending  
**Priority:** high  
**Created:** 2026-01-29T10:30:00Z  
**Updated:** 2026-01-29T10:30:00Z  

---

## Source Reference

| Field | Value |
|-------|-------|
| Type | task |
| Source ID | task_e5f6g7h8 |
| Source Title | Implement User Authentication API |
| Chat Session | chat_i9j0k1l2 |
| Related Files | `02-spec/api/auth-endpoints.md`, `02-spec/api/error-codes.md` |

---

## Suggestion Details

### Summary

Add comprehensive error handling to all authentication API endpoints to improve reliability and debugging.

### Description

The current authentication API implementation lacks proper error handling for edge cases. This could lead to unclear error messages for clients and difficulty in debugging production issues.

### Recommended Actions

1. **Add try-catch blocks** to all endpoint handlers
2. **Create custom error classes** for auth-specific errors
3. **Implement error logging** with request context
4. **Add error response schemas** to API documentation
5. **Create error code mappings** for client consumption

### Affected Files

- `BE/internal/api/auth_handler.go`
- `BE/internal/errors/auth_errors.go`
- `02-spec/api/error-codes.md`

### Estimated Effort

- **Time:** 2-4 hours
- **Complexity:** Medium
- **Dependencies:** Error code registry must be defined first

---

## Resolution

### Resolution Status

- [ ] Not started
- [ ] In progress
- [ ] Completed
- [ ] Deferred
- [ ] Rejected

### Resolution Notes

_To be filled when resolved_

### Resolution Date

_To be filled when resolved_

### Resolved By

_To be filled when resolved_
```

---

## Database Schema

### Suggestion Table

```sql
CREATE TABLE Suggestion (
    Id TEXT PRIMARY KEY,              -- UUID
    ProjectId TEXT NOT NULL,          -- Reference to project
    
    -- File Information
    FilePath TEXT NOT NULL,           -- Relative path to suggestion file
    FileName TEXT NOT NULL,           -- File name
    
    -- Content
    Title TEXT NOT NULL,              -- Suggestion title
    Summary TEXT NOT NULL,            -- Brief summary (max 500 chars)
    Priority TEXT NOT NULL CHECK (Priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Source Reference
    SourceType TEXT NOT NULL CHECK (SourceType IN ('task', 'chat', 'validation', 'build')),
    SourceId TEXT NOT NULL,           -- ID of originating task/chat
    SourceTitle TEXT,                 -- Title of source for display
    ChatSessionId TEXT,               -- Optional chat session
    
    -- Related Files
    RelatedFiles TEXT,                -- JSON array of file paths
    AffectedFiles TEXT,               -- JSON array of files to modify
    
    -- Effort Estimation
    EstimatedHours REAL,              -- Estimated time
    Complexity TEXT CHECK (Complexity IN ('low', 'medium', 'high')),
    
    -- Status
    Status TEXT NOT NULL CHECK (Status IN (
        'pending',      -- New suggestion
        'in_progress',  -- Being worked on
        'completed',    -- Done
        'deferred',     -- Postponed
        'rejected'      -- Not applicable
    )) DEFAULT 'pending',
    
    -- Resolution
    ResolvedAt TEXT,
    ResolvedById TEXT,
    ResolutionNotes TEXT,
    
    -- Auto-generated
    GeneratedByModel TEXT,            -- Which AI model generated
    GenerationContext TEXT,           -- Context used for generation
    
    -- Timestamps
    CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    UpdatedAt TEXT NOT NULL DEFAULT (datetime('now')),
    
    -- Sequence (daily)
    DailySequence INTEGER NOT NULL,
    
    FOREIGN KEY (ProjectId) REFERENCES Project(Id) ON DELETE CASCADE,
    FOREIGN KEY (ResolvedById) REFERENCES User(Id) ON DELETE SET NULL
);

CREATE INDEX IdxSuggestionProjectId ON Suggestion(ProjectId);
CREATE INDEX IdxSuggestionStatus ON Suggestion(Status);
CREATE INDEX IdxSuggestionSourceId ON Suggestion(SourceId);
CREATE INDEX IdxSuggestionPriority ON Suggestion(Priority);
CREATE INDEX IdxSuggestionCreatedAt ON Suggestion(CreatedAt DESC);
```

### SuggestionTag Table

```sql
CREATE TABLE SuggestionTag (
    Id TEXT PRIMARY KEY,
    SuggestionId TEXT NOT NULL,
    Tag TEXT NOT NULL,              -- e.g., 'api', 'performance', 'security'
    
    FOREIGN KEY (SuggestionId) REFERENCES Suggestion(Id) ON DELETE CASCADE
);

CREATE INDEX IdxSuggestionTagSuggestionId ON SuggestionTag(SuggestionId);
CREATE INDEX IdxSuggestionTagTag ON SuggestionTag(Tag);
CREATE UNIQUE INDEX UxSuggestionTagUnique ON SuggestionTag(SuggestionId, Tag);
```

---

## GORM Models

```go
package models

import (
    "time"
    "gorm.io/datatypes"
)

// Suggestion represents an AI-generated improvement recommendation
type Suggestion struct {
    Id        string `gorm:"primaryKey;type:TEXT"`
    ProjectId string `gorm:"type:TEXT;not null;index"`
    Project   *Project `gorm:"foreignKey:ProjectId"`
    
    // File Information
    FilePath string `gorm:"type:TEXT;not null"`
    FileName string `gorm:"type:TEXT;not null"`
    
    // Content
    Title    string `gorm:"type:TEXT;not null"`
    Summary  string `gorm:"type:TEXT;not null"`
    Priority string `gorm:"type:TEXT;not null;default:'medium'"`
    
    // Source Reference
    SourceType    string  `gorm:"type:TEXT;not null"`
    SourceId      string  `gorm:"type:TEXT;not null;index"`
    SourceTitle   *string `gorm:"type:TEXT"`
    ChatSessionId *string `gorm:"type:TEXT"`
    
    // Related Files (JSON)
    RelatedFiles  datatypes.JSON `gorm:"type:TEXT"`
    AffectedFiles datatypes.JSON `gorm:"type:TEXT"`
    
    // Effort
    EstimatedHours *float64 `gorm:"type:REAL"`
    Complexity     *string  `gorm:"type:TEXT"`
    
    // Status
    Status string `gorm:"type:TEXT;not null;default:'pending';index"`
    
    // Resolution
    ResolvedAt      *time.Time
    ResolvedById    *string `gorm:"type:TEXT"`
    ResolvedBy      *User   `gorm:"foreignKey:ResolvedById"`
    ResolutionNotes *string `gorm:"type:TEXT"`
    
    // AI Generation
    GeneratedByModel  *string `gorm:"type:TEXT"`
    GenerationContext *string `gorm:"type:TEXT"`
    
    // Timestamps
    CreatedAt time.Time `gorm:"not null;index"`
    UpdatedAt time.Time `gorm:"not null"`
    
    // Sequence
    DailySequence int `gorm:"not null"`
    
    // Relations
    Tags []SuggestionTag `gorm:"foreignKey:SuggestionId;constraint:OnDelete:CASCADE"`
}

// SuggestionTag represents a tag on a suggestion
type SuggestionTag struct {
    Id           string `gorm:"primaryKey;type:TEXT"`
    SuggestionId string `gorm:"type:TEXT;not null;index"`
    Suggestion   *Suggestion `gorm:"foreignKey:SuggestionId"`
    Tag          string `gorm:"type:TEXT;not null;index"`
}
```

---

## Suggestion Generator Service

```go
package suggestions

import (
    stdctx "context"
    "encoding/json"
    "fmt"
    "time"
    
    "github.com/google/uuid"
)

// GeneratorConfig configures suggestion generation
type GeneratorConfig struct {
    MinSuggestions      int     // Minimum per task (default: 1)
    MaxSuggestions      int     // Maximum per task (default: 10)
    SuggestionsPerTask  int     // Target per small task (default: 2)
    SuggestionsPerBigTask int   // Target per complex task (default: 6)
    TaskSizeThreshold   int     // Words to consider "big" (default: 500)
}

// DefaultGeneratorConfig returns sensible defaults
func DefaultGeneratorConfig() GeneratorConfig {
    return GeneratorConfig{
        MinSuggestions:      1,
        MaxSuggestions:      10,
        SuggestionsPerTask:  2,
        SuggestionsPerBigTask: 6,
        TaskSizeThreshold:   500,
    }
}

// SuggestionGenerator creates suggestions from AI interactions
type SuggestionGenerator struct {
    config        GeneratorConfig
    aiService     AIService
    suggestionRepo SuggestionRepository
    fileService   FileService
    pathMgr       PathManager
    eventBus      EventBus
}

// GeneratePrompt is the system prompt for suggestion generation
const generatePrompt = `You are an expert software architect reviewing completed work.
Based on the task that was just completed, generate improvement suggestions.

Guidelines:
- Each suggestion should be actionable and specific
- Focus on quality, maintainability, performance, and security
- Consider edge cases and error handling
- Think about documentation and testing
- Suggest architectural improvements when relevant
- Be practical - suggestions should be implementable

Output Format (JSON array):
[
  {
    "title": "Short descriptive title",
    "summary": "One paragraph explaining the suggestion",
    "priority": "low|medium|high|critical",
    "recommendedActions": ["Action 1", "Action 2", ...],
    "affectedFiles": ["path/to/file1", "path/to/file2"],
    "estimatedHours": 2.5,
    "complexity": "low|medium|high",
    "tags": ["tag1", "tag2"]
  }
]`

// SuggestionInput represents a suggestion request
type SuggestionInput struct {
    Title    string
    Summary  string
    Priority string
    RecommendedActions []string
    AffectedFiles []string
    EstimatedHours float64
    Complexity string
    Tags []string
}

// GenerateFromTask creates suggestions after task completion
func (g *SuggestionGenerator) GenerateFromTask(
    context stdctx.Context,
    projectId string,
    task TaskInfo,
) apperror.Result[[]Suggestion] {
    // Determine target count based on task size
    targetCount := g.config.SuggestionsPerTask
    if len(task.Description) > g.config.TaskSizeThreshold {
        targetCount = g.config.SuggestionsPerBigTask
    }
    
    // Build context for AI
    contextPrompt := fmt.Sprintf(`Task Completed:
Title: %s
Description: %s
Files Modified: %v
Result: %s

Generate %d improvement suggestions based on this completed work.`,
        task.Title,
        task.Description,
        task.ModifiedFiles,
        task.Result,
        targetCount,
    )
    
    // Call AI
    response, err := g.aiService.GenerateStructured(context, GenerateRequest{
        SystemPrompt: generatePrompt,
        UserPrompt:   contextPrompt,
        OutputSchema: SuggestionArraySchema,
    })
    if err != nil {
        return nil, apperror.Wrap(
            err,
            ErrAiGenerationFailed,
            "AI generation failed",
        )
    }
    
    // Parse response
    var inputs []SuggestionInput
    if err := json.Unmarshal([]byte(response.Json), &inputs); err != nil {
        return nil, apperror.Wrap(
            err,
            ErrParseSuggestions,
            "parse suggestions",
        )
    }
    
    // Create suggestions
    var suggestions []Suggestion
    for i, input := range inputs {
        suggestion, err := g.createSuggestion(context, projectId, task, input, i+1)
        if err != nil {
            continue // Log and skip failed ones
        }
        suggestions = append(suggestions, *suggestion)
    }
    
    return suggestions, nil
}

// --- Typed Event Payloads (no interface{} or map[string]any) ---

type SuggestionCreatedEvent struct {
    SuggestionId string
    ProjectId    string
    Title        string
    Priority     string
}

type SuggestionResolvedEvent struct {
    SuggestionId string
    Status       ResolutionStatus
    ResolvedBy   string
}

// createSuggestion creates a single suggestion
func (g *SuggestionGenerator) createSuggestion(
    context stdctx.Context,
    projectId string,
    task TaskInfo,
    input SuggestionInput,
    index int,
) apperror.Result[Suggestion] {
    // Get daily sequence
    today := time.Now().Format("2006-01-02")
    sequence := g.suggestionRepo.GetNextDailySequence(context, projectId, today)
    
    // Build file path
    slug := slugify(input.Title, 50)
    fileName := fmt.Sprintf("%s_%03d_%s.md", today, sequence, slug)
    relativePath := fmt.Sprintf("data/projects/%s/suggestions/pending/%s",
        g.getProjectName(context, projectId), fileName)
    
    // Create suggestion record
    suggestion := &Suggestion{
        Id:           uuid.New().String(),
        ProjectId:    projectId,
        FilePath:     relativePath,
        FileName:     fileName,
        Title:        input.Title,
        Summary:      input.Summary,
        Priority:     input.Priority,
        SourceType:   "task",
        SourceId:     task.Id,
        SourceTitle:  &task.Title,
        AffectedFiles: toJson(input.AffectedFiles),
        EstimatedHours: &input.EstimatedHours,
        Complexity:   &input.Complexity,
        Status:       "pending",
        DailySequence: sequence,
        CreatedAt:    time.Now(),
        UpdatedAt:    time.Now(),
    }
    
    // Save to database
    if err := g.suggestionRepo.Create(context, suggestion); err != nil {
        return apperror.FailWrap[Suggestion](
            err,
            "E7400",
            "failed to create suggestion",
        )
    }
    
    // Create tags
    for _, tag := range input.Tags {
        g.suggestionRepo.AddTag(context, suggestion.Id, tag)
    }
    
    // Write suggestion file
    content := g.formatSuggestionFile(suggestion, input)
    if err := g.fileService.WriteFile(context, relativePath, content); err != nil {
        return apperror.FailWrap[Suggestion](
            err,
            "E7400",
            "failed to write suggestion file",
        )
    }
    
    g.eventBus.Publish("suggestion:created", SuggestionCreatedEvent{
        SuggestionId: suggestion.Id,
        ProjectId:    projectId,
        Title:        input.Title,
        Priority:     input.Priority,
    })
    
    return apperror.Ok(*suggestion)
}

// formatSuggestionFile creates the markdown content
func (g *SuggestionGenerator) formatSuggestionFile(
    suggestion *Suggestion,
    input SuggestionInput,
) string {
    return fmt.Sprintf(`# Suggestion: %s

**ID:** %s  
**Status:** %s  
**Priority:** %s  
**Created:** %s  
**Updated:** %s  

---

## Source Reference

| Field | Value |
|-------|-------|
| Type | %s |
| Source ID | %s |
| Source Title | %s |

---

## Suggestion Details

### Summary

%s

### Recommended Actions

%s

### Affected Files

%s

### Estimated Effort

- **Time:** %.1f hours
- **Complexity:** %s

---

## Resolution

### Resolution Status

- [ ] Not started
- [ ] In progress
- [ ] Completed
- [ ] Deferred
- [ ] Rejected

### Resolution Notes

_To be filled when resolved_
`,
        suggestion.Title,
        suggestion.Id,
        suggestion.Status,
        suggestion.Priority,
        suggestion.CreatedAt.Format(time.RFC3339),
        suggestion.UpdatedAt.Format(time.RFC3339),
        suggestion.SourceType,
        suggestion.SourceId,
        *suggestion.SourceTitle,
        input.Summary,
        formatActions(input.RecommendedActions),
        formatFiles(input.AffectedFiles),
        input.EstimatedHours,
        input.Complexity,
    )
}
```

---

## Suggestion Resolution Service

```go
package suggestions

import (
    stdctx "context"
    "fmt"
    "os"
    "path/filepath"
    "time"
)

// ResolutionStatus represents suggestion resolution states
type ResolutionStatus string

const (
    StatusPending    ResolutionStatus = "pending"
    StatusInProgress ResolutionStatus = "in_progress"
    StatusCompleted  ResolutionStatus = "completed"
    StatusDeferred   ResolutionStatus = "deferred"
    StatusRejected   ResolutionStatus = "rejected"
)

// ResolutionService handles suggestion lifecycle
type ResolutionService struct {
    suggestionRepo SuggestionRepository
    fileService    FileService
    pathMgr        PathManager
    eventBus       EventBus
}

// ResolveRequest contains resolution details
type ResolveRequest struct {
    SuggestionId    string
    Status          ResolutionStatus
    Notes           string
    ResolvedById    string
}

// ResolveSuggestion marks a suggestion as resolved
func (s *ResolutionService) ResolveSuggestion(
    context stdctx.Context,
    req ResolveRequest,
) error {
    // Get suggestion
    suggestion, err := s.suggestionRepo.GetById(context, req.SuggestionId)
    if err != nil {
        return apperror.Wrap(
            err,
            ErrSuggestionNotFound,
            "suggestion not found",
        )
    }
    
    // Validate transition
    if suggestion.Status == string(StatusCompleted) {
        return apperror.New(
            ErrSuggestionAlreadyCompleted,
            "suggestion already completed",
        )
    }
    
    // Update status
    now := time.Now()
    suggestion.Status = string(req.Status)
    suggestion.ResolvedAt = &now
    suggestion.ResolvedById = &req.ResolvedById
    suggestion.ResolutionNotes = &req.Notes
    suggestion.UpdatedAt = now
    
    if err := s.suggestionRepo.Update(context, suggestion); err != nil {
        return err
    }
    
    // Move file if completed/rejected
    if req.Status == StatusCompleted || req.Status == StatusRejected {
        if err := s.moveSuggestionFile(context, suggestion); err != nil {
            // Log but don't fail - DB is source of truth
            fmt.Printf("Warning: failed to move suggestion file: %v\n", err)
        }
    }
    
    // Update markdown file content
    if err := s.updateSuggestionFile(context, suggestion, req); err != nil {
        fmt.Printf("Warning: failed to update suggestion file: %v\n", err)
    }
    
    s.eventBus.Publish("suggestion:resolved", SuggestionResolvedEvent{
        SuggestionId: suggestion.Id,
        Status:       req.Status,
        ResolvedBy:   req.ResolvedById,
    })
    
    return nil
}

// moveSuggestionFile moves from pending to resolved folder
func (s *ResolutionService) moveSuggestionFile(
    context stdctx.Context,
    suggestion *Suggestion,
) error {
    oldPath := s.pathMgr.GetAbsolutePath(suggestion.FilePath)
    
    // Build new path (replace /pending/ with /resolved/)
    newRelativePath := filepath.Join(
        filepath.Dir(filepath.Dir(suggestion.FilePath)),
        "resolved",
        suggestion.FileName,
    )
    newPath := s.pathMgr.GetAbsolutePath(newRelativePath)
    
    // Ensure resolved directory exists
    if err := pathutil.EnsureDir(filepath.Dir(newPath)); err != nil {
        return err
    }
    
    // Move file
    if err := pathutil.Rename(oldPath, newPath); err != nil {
        return err
    }
    
    // Update file path in DB
    suggestion.FilePath = newRelativePath
    return s.suggestionRepo.Update(context, suggestion)
}

// updateSuggestionFile updates the markdown with resolution info
func (s *ResolutionService) updateSuggestionFile(
    context stdctx.Context,
    suggestion *Suggestion,
    req ResolveRequest,
) error {
    // Read current content
    content, err := s.fileService.ReadFile(context, suggestion.FilePath)
    if err != nil {
        return err
    }
    
    // Update resolution section
    resolutionSection := fmt.Sprintf(`## Resolution

### Resolution Status

%s

### Resolution Notes

%s

### Resolution Date

%s

### Resolved By

%s`,
        formatStatus(req.Status),
        req.Notes,
        time.Now().Format(time.RFC3339),
        req.ResolvedById,
    )
    
    // Replace resolution section in content
    updatedContent := replaceSection(content, "## Resolution", resolutionSection)
    
    return s.fileService.WriteFile(context, suggestion.FilePath, updatedContent)
}

// formatStatus formats status as checkbox list
func formatStatus(status ResolutionStatus) string {
    statuses := []struct {
        status ResolutionStatus
        label  string
    }{
        {StatusPending, "Not started"},
        {StatusInProgress, "In progress"},
        {StatusCompleted, "Completed"},
        {StatusDeferred, "Deferred"},
        {StatusRejected, "Rejected"},
    }
    
    var result string
    for _, s := range statuses {
        check := " "
        if s.status == status {
            check = "x"
        }
        result += fmt.Sprintf("- [%s] %s\n", check, s.label)
    }
    return result
}
```

---

## Suggestion Query Service

```go
package suggestions

import (
    stdctx "context"
)

// QueryOptions for filtering suggestions
type QueryOptions struct {
    ProjectId    string
    Status       []string    // Filter by status
    Priority     []string    // Filter by priority
    SourceType   string      // Filter by source type
    SourceId     string      // Filter by source
    Tags         []string    // Filter by tags
    Search       string      // Full-text search
    SortBy       string      // Field to sort by
    SortOrder    string      // asc or desc
    Limit        int
    Offset       int
}

// SuggestionStats provides aggregate statistics
type SuggestionStats struct {
    TotalPending    int
    TotalInProgress int
    TotalCompleted  int
    TotalDeferred   int
    TotalRejected   int
    ByPriority      map[string]int
    ByTag           map[string]int
    AvgResolutionHours float64
}

// QueryService handles suggestion queries
type QueryService struct {
    suggestionRepo SuggestionRepository
}

// ListSuggestions returns filtered suggestions
func (q *QueryService) ListSuggestions(
    context stdctx.Context,
    opts QueryOptions,
) apperror.Result[SuggestionListResult] {
    suggestions, count, err := q.suggestionRepo.Query(context, opts)
    if err != nil {
        return apperror.FailWrap[SuggestionListResult](
            err,
            "E7401",
            "suggestion query failed",
        )
    }

    return apperror.Ok(SuggestionListResult{
        Suggestions: suggestions,
        TotalCount:  count,
    })
}

// GetStats returns aggregate statistics
func (q *QueryService) GetStats(
    context stdctx.Context,
    projectId string,
) apperror.Result[SuggestionStats] {
    stats, err := q.suggestionRepo.GetStats(context, projectId)
    if err != nil {
        return apperror.FailWrap[SuggestionStats](
            err,
            "E7401",
            "suggestion stats query failed",
        )
    }

    return apperror.Ok(*stats)
}

// GetBySource returns suggestions for a specific task/chat
func (q *QueryService) GetBySource(
    context stdctx.Context,
    sourceType string,
    sourceId string,
) apperror.Result[[]Suggestion] {
    suggestions, _, err := q.suggestionRepo.Query(context, QueryOptions{
        SourceType: sourceType,
        SourceId:   sourceId,
    })
    if err != nil {
        return apperror.FailWrap[[]Suggestion](
            err,
            "E7401",
            "suggestion source query failed",
        )
    }

    return apperror.Ok(suggestions)
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/projects/{projectId}/suggestions` | List suggestions with filters |
| GET | `/api/v1/projects/{projectId}/suggestions/stats` | Get suggestion statistics |
| GET | `/api/v1/suggestions/{id}` | Get suggestion details |
| PUT | `/api/v1/suggestions/{id}` | Update suggestion |
| POST | `/api/v1/suggestions/{id}/resolve` | Resolve suggestion |
| DELETE | `/api/v1/suggestions/{id}` | Delete suggestion |
| GET | `/api/v1/tasks/{taskId}/suggestions` | Get suggestions for task |
| GET | `/api/v1/chats/{chatId}/suggestions` | Get suggestions for chat |

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string[] | Filter by status (pending, completed, etc.) |
| `priority` | string[] | Filter by priority (low, medium, high, critical) |
| `tags` | string[] | Filter by tags |
| `sourceType` | string | Filter by source type (task, chat, validation) |
| `search` | string | Full-text search |
| `sortBy` | string | Sort field (createdAt, priority, etc.) |
| `sortOrder` | string | asc or desc |
| `limit` | int | Page size (default: 20) |
| `offset` | int | Page offset |

---

## WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `suggestion:created` | Server→Client | `{suggestionId, projectId, title, priority}` |
| `suggestion:updated` | Server→Client | `{suggestionId, status}` |
| `suggestion:resolved` | Server→Client | `{suggestionId, status, resolvedBy}` |
| `suggestion:deleted` | Server→Client | `{suggestionId}` |

---

## Frontend Components

### Suggestions Panel

```typescript
interface SuggestionsPanelProps {
  projectId: string;
  sourceType?: 'task' | 'chat' | 'validation' | 'build';
  sourceId?: string;
  showStats?: boolean;
}

// Component structure
const SuggestionsPanel = ({ projectId, sourceType, sourceId }) => {
  return (
    <div className="suggestions-panel">
      <SuggestionsHeader stats={stats} />
      <SuggestionsFilters 
        onFilterChange={handleFilterChange}
        availableTags={tags}
      />
      <SuggestionsList 
        suggestions={suggestions}
        onResolve={handleResolve}
        onSelect={handleSelect}
      />
      <SuggestionDetail 
        suggestion={selectedSuggestion}
        onUpdate={handleUpdate}
      />
    </div>
  );
};
```

### Suggestion Card

```typescript
interface SuggestionCardProps {
  suggestion: Suggestion;
  onResolve: (id: string, status: ResolutionStatus) => void;
  onClick: () => void;
}

// Visual indicators
const priorityColors = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-gray-500',
};
```

---

## Configuration Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `suggestions.generator.minPerTask` | int | 1 | Minimum suggestions per task |
| `suggestions.generator.maxPerTask` | int | 10 | Maximum suggestions per task |
| `suggestions.generator.targetSmall` | int | 2 | Target for small tasks |
| `suggestions.generator.targetLarge` | int | 6 | Target for large tasks |
| `suggestions.storage.basePath` | string | "suggestions" | Folder name |
| `suggestions.cleanup.resolvedRetentionDays` | int | 90 | Days to keep resolved |
| `suggestions.ai.modelCategory` | string | "thinking" | Model for generation |

---

## Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 16800 | `ErrSuggestionNotFound` | Suggestion not found |
| 16801 | `ErrSuggestionAlreadyResolved` | Already resolved |
| 16802 | `ErrSuggestionInvalidStatus` | Invalid status transition |
| 16803 | `ErrSuggestionFileWriteFailed` | Failed to write file |
| 16804 | `ErrSuggestionFileMoveFailed` | Failed to move file |
| 16805 | `ErrSuggestionGenerationFailed` | AI generation failed |

---

## Related Specifications

- [Instruction System](../06-ai-integration/03-instruction-system.md)
- [Code Generation System](./00-overview.md)
- [Project Editor UI](./20-project-editor-ui.md)
- [AI Integration](../06-ai-integration/00-overview.md)
- [Error Code Registry](../../06-error-management/01-error-code-registry.md)
