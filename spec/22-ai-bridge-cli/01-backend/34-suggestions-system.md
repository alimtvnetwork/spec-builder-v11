# Suggestions System

> **Version:** 5.0.0  
> **Updated:** 2026-03-09  
> **Status:** Draft  
> **Related:** `31-revision-feedback-system.md`, `26-database-paths-reference.md`

---

## 1. Overview

The Suggestions System generates actionable and informational recommendations after every AI response. Suggestions are module-agnostic—produced by Chat, Blog, FAQ, Code, and Revision workflows—stored in a hybrid architecture with session-scoped storage and global cross-referencing.

---

## 2. Architecture

### 2.1 Hybrid Storage Model

| Layer | Database | Purpose |
|-------|----------|---------|
| **Session-Scoped** | `data/{app}/rag/{module}/{company}/{seq}-{id}.db` | Store suggestions in context with their source content |
| **Global Registry** | `data/{app}/rag/suggestions-registry.db` | Cross-reference all suggestions for search/analytics |

### 2.2 Design Principles

- **Auto-increment**: Database handles primary key increments (`INTEGER PRIMARY KEY AUTOINCREMENT`)
- **Display Formatting**: Add `S` prefix and zero-padding at retrieval time, not storage
- **Unified Schema**: Same table structure across all modules

---

## 3. Database Schema

### 3.1 Session DB: `Suggestions` Table

Each session/content DB includes this table:

```sql
CREATE TABLE IF NOT EXISTS Suggestions (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    SessionId       TEXT NOT NULL,      -- Parent session/content ID
    Module          TEXT NOT NULL,      -- module.Variant: Chat, Blog, Faq, Code, Paragraph
    Title           TEXT NOT NULL,      -- Short actionable title
    Description     TEXT NOT NULL,      -- Detailed description (max 2000 chars)
    Type            TEXT NOT NULL,      -- suggestion_type.Variant: Actionable, Informational
    Priority        TEXT DEFAULT 'Medium', -- priority.Variant: Low, Medium, High
    Status          TEXT DEFAULT 'Open',   -- suggestion_status.Variant: Open, Accepted, Dismissed
    RelatedRevision INTEGER,            -- FK to Revisions.Id if applicable
    CreatedAt       TEXT DEFAULT (datetime('now')),
    AcceptedAt      TEXT,               -- When user accepted (if actionable)
    DismissedAt     TEXT,               -- When user dismissed
    Metadata        TEXT                -- JSON for module-specific data
);

CREATE INDEX IdxSuggestionsSession ON Suggestions(SessionId);
CREATE INDEX IdxSuggestionsStatus ON Suggestions(Status);
CREATE INDEX IdxSuggestionsType ON Suggestions(Type);
```

### 3.2 Global Registry: `SuggestionsRegistry` Table

```sql
-- File: data/{app}/rag/suggestions-registry.db
CREATE TABLE IF NOT EXISTS SuggestionsRegistry (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    Company         TEXT NOT NULL,
    Module          TEXT NOT NULL,
    SessionPath     TEXT NOT NULL,      -- Full path to session DB
    SessionId       TEXT NOT NULL,
    LocalSuggestionId INTEGER NOT NULL, -- Id in session DB
    Title           TEXT NOT NULL,
    Type            TEXT NOT NULL,
    Status          TEXT NOT NULL,
    CreatedAt       TEXT NOT NULL,
    IndexedAt       TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IdxRegistryCompany ON SuggestionsRegistry(Company);
CREATE INDEX IdxRegistryModule ON SuggestionsRegistry(Module);
CREATE INDEX IdxRegistryStatus ON SuggestionsRegistry(Status);
```

---

## 4. Display ID Formatting

### 4.1 Format Rules

| Storage | Display | Example |
|---------|---------|---------|
| `Id = 1` | `S001` | First suggestion |
| `Id = 42` | `S042` | Forty-second suggestion |
| `Id = 999` | `S999` | Near limit |
| `Id = 1000` | `S1000` | Overflow (no padding) |

### 4.2 Go Helper

```go
// FormatSuggestionId formats a database Id for display
func FormatSuggestionId(id int) string {
    if id < 1000 {
        return fmt.Sprintf("S%03d", id)
    }
    return fmt.Sprintf("S%d", id)
}

// ParseSuggestionId extracts the numeric Id from display format
func ParseSuggestionId(displayId string) apperror.Result[int] {
    if stringutil.IsMissingPrefix(displayId, "S") {
        return apperror.FailNew[int](
            ErrSuggestionInvalidId,
            "invalid suggestion ID format: %s", displayId,
        )
    }
    num, err := strconv.Atoi(strings.TrimPrefix(displayId, "S"))
    if err != nil {
        return apperror.FailWrap[int](err, ErrSuggestionInvalidId, "suggestion ID parse failed")
    }
    return apperror.Ok(num)
}
```

---

## 5. Suggestion Types

### 5.1 Actionable Suggestions

User can "Accept" to queue as a new task/prompt:

| Field | Value |
|-------|-------|
| Type | `Actionable` |
| Behavior | Click → Creates new prompt in same session |
| Status Flow | `Open` → `Accepted` → (new content generated) |

**Examples:**
- "Expand the introduction with more statistics"
- "Add error handling for edge case X"
- "Generate FAQ for topic Y"

### 5.2 Informational Suggestions

Reference-only, no direct action:

| Field | Value |
|-------|-------|
| Type | `Informational` |
| Behavior | Display only, user manually creates requests |
| Status Flow | `Open` → `Dismissed` (or stays Open) |

**Examples:**
- "Consider reviewing competitor content"
- "This topic may need expert review"
- "Performance could be improved with caching"

---

## 6. Module Integration

### 6.1 Generation Trigger

Every AI response MUST include suggestion generation:

```go
type AiResponse struct {
    Content     string
    Suggestions []Suggestion
    Metadata    ResponseMeta
}

type Suggestion struct {
    Title       string
    Description string
    Type        suggestion_type.Variant   // suggestion_type.Variant: Actionable, Informational
    Priority    priority.Variant          // priority.Variant: Low, Medium, High
}
```

### 6.2 Per-Module Context

| Module | Suggestion Focus |
|--------|------------------|
| **Chat** | Follow-up questions, topic expansions |
| **Blog** | SEO improvements, content gaps, structure |
| **FAQ** | Related questions, category expansions |
| **Code** | Refactoring, tests, documentation |
| **Paragraph** | Keyword density, linking, formatting |

### 6.3 Revision Integration

When a revision is created, suggestions from that revision are linked:

```sql
-- Suggestion tied to specific revision
INSERT INTO Suggestions (SessionId, Module, Title, Description, Type, RelatedRevision)
VALUES ('blog-123', 'Blog', 'Add more H2 headers', 'The content could benefit from...', 'Actionable', 5);
```

---

## 7. API Endpoints

### 7.1 Session-Scoped Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/{module}/{id}/suggestions` | List suggestions for content |
| GET | `/{module}/{id}/suggestions/{suggestionId}` | Get single suggestion |
| POST | `/{module}/{id}/suggestions/{suggestionId}/accept` | Accept actionable suggestion |
| POST | `/{module}/{id}/suggestions/{suggestionId}/dismiss` | Dismiss suggestion |

### 7.2 Global Search Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/suggestions/search` | Search across all suggestions |

**Query Parameters:**
- `Company`: Filter by company
- `Module`: Filter by module type
- `Status`: Filter by status
- `Type`: Filter by Actionable/Informational
- `Query`: Full-text search on title/description
- `Limit`, `Offset`: Pagination

---

## 8. Response Format

### 8.1 Single Suggestion

```json
{
  "SuggestionId": "S042",
  "Title": "Add competitor comparison section",
  "Description": "The blog post covers features but lacks comparison with alternatives. Adding a comparison table could improve user decision-making and SEO rankings.",
  "Type": "Actionable",
  "Priority": "High",
  "Status": "Open",
  "Module": "Blog",
  "RelatedRevision": 3,
  "CreatedAt": "2026-02-04T10:30:00Z"
}
```

### 8.2 AI Response with Suggestions

```json
{
  "Content": "Here is your generated blog post about...",
  "Suggestions": [
    {
      "SuggestionId": "S001",
      "Title": "Add internal links",
      "Description": "Include 3-4 internal links to related content for SEO boost.",
      "Type": "Actionable",
      "Priority": "Medium"
    },
    {
      "SuggestionId": "S002",
      "Title": "Consider expert quotes",
      "Description": "Industry expert quotes could enhance credibility.",
      "Type": "Informational",
      "Priority": "Low"
    }
  ],
  "Metadata": {
    "RevisionId": 1,
    "Model": "gemini-2.5-flash",
    "TokensUsed": 1250
  }
}
```

---

## 9. Accept Flow (Actionable)

When user accepts a suggestion:

1. **Update Status**: `Status = 'Accepted'`, `AcceptedAt = NOW()`
2. **Create Prompt**: Build new user message from suggestion
3. **Submit to AI**: Same session continues with suggestion as prompt
4. **New Revision**: Response creates new revision linked to accepted suggestion

```go
func AcceptSuggestion(sessionId string, suggestionId int) *apperror.AppError {
    // 1. Load suggestion
    suggestionResult := GetSuggestion(sessionId, suggestionId)
    if suggestionResult.HasError() {
        return suggestionResult.Error()
    }

    suggestion := suggestionResult.Value()
    
    if suggestion.Type != suggestion_type.Actionable {
        return apperror.New(
            ErrSuggestionNotActionable,
            "suggestion %d is not actionable",
            suggestionId,
        )
    }
    
    // 2. Update status
    if err := UpdateSuggestionStatus(sessionId, suggestionId, suggestion_status.Accepted); err != nil {
        return err
    }
    
    // 3. Create and submit prompt
    prompt := buildPromptFromSuggestion(suggestion)
    return SubmitToSession(sessionId, prompt)
}
```

---

## 10. Error Codes

| Code | Name | Description |
|------|------|-------------|
| 9710 | `ErrSuggestionNotFound` | Suggestion ID does not exist |
| 9711 | `ErrSuggestionNotActionable` | Cannot accept informational suggestion |
| 9712 | `ErrSuggestionAlreadyProcessed` | Already accepted or dismissed |
| 9713 | `ErrSuggestionCreateFailed` | Failed to save suggestion |
| 9714 | `ErrRegistrySyncFailed` | Failed to sync with global registry |
| 9715 | `ErrSuggestionLimitExceeded` | Too many suggestions in session |

---

## 11. Configuration (Seedable)

Add to `config.seed.json`:

```json
{
  "Suggestion": {
    "MaxPerResponse": 5,
    "MaxPerSession": 100,
    "DefaultType": "Actionable",
    "TitleMaxLength": 100,
    "DescriptionMaxLength": 2000,
    "RegistrySyncEnabled": true,
    "AutoDismissAfterDays": 30
  }
}
```

---

## 12. Path Reference Update

Add to `26-database-paths-reference.md`:

```go
const (
    // Suggestions Registry
    SuggestionsRegistryDb = "data/%s/rag/suggestions-registry.db"
)

// GetSuggestionsRegistryPath returns the global registry path
func GetSuggestionsRegistryPath(appName string) string {
    return fmt.Sprintf(SuggestionsRegistryDb, appName)
}
```

---

## 13. Related Specifications

| Spec | Relationship |
|------|--------------|
| `31-revision-feedback-system.md` | Suggestions can link to revisions |
| `26-database-paths-reference.md` | Path constants for registry |
| `27-ai-seo-blog-generation.md` | Blog-specific suggestions |
| `22-ai-seo-faq-generation.md` | FAQ-specific suggestions |
| `08-split-db-integration.md` | Storage architecture |
| `53-enum-architecture.md` | Enum type definitions |
