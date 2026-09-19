# Memory: style/naming-convention

**Updated:** 2026-02-02  
**Version:** 1.0.0  
**Scope:** All CLI Tools  

---

## Overview

This memory defines the mandatory naming conventions for all database columns, JSON transport fields, and API payloads across the entire project ecosystem.

---

## Core Rules

### 1. PascalCase Everywhere

**ALL of the following MUST use PascalCase:**

| Context | Example |
|---------|---------|
| Database column names | `UserId`, `CreatedAt`, `ContentType` |
| JSON field names | `"Title"`, `"Keywords"`, `"ServiceAreas"` |
| API request/response payloads | `{ "UserName": "...", "EmailAddress": "..." }` |
| Go struct field names | `Title`, `Keywords`, `OutputFormat` |
| SQLite table names | `Publications`, `Categories`, `VariableSources` |

### 2. No Underscores

**NEVER use underscores** in database columns, JSON keys, or API fields:

```go
// ❌ WRONG - snake_case
type BlogPost struct {
    user_id     string `json:"user_id"`
    created_at  string `json:"created_at"`
}

// ✅ CORRECT - PascalCase
type BlogPost struct {
    UserId    string `json:"UserId"`
    CreatedAt string `json:"CreatedAt"`
}
```

### 3. Go JSON Tags

Since we use PascalCase for JSON, the Go struct field names match the JSON output automatically. **Omit the JSON tag entirely** unless using `omitempty`:

```go
// ✅ CORRECT - No JSON tag needed (Go uses field name)
type SEORequest struct {
    Title       string            // Outputs: "Title"
    Keywords    []string          // Outputs: "Keywords"
    ContentType string            // Outputs: "ContentType"
    Slug        string `json:",omitempty"` // Only for omitempty
}

// ❌ WRONG - Redundant JSON tags
type SEORequest struct {
    Title       string `json:"Title"`       // Redundant
    Keywords    []string `json:"Keywords"`  // Redundant
}
```

### 4. When to Use JSON Tags

Only use JSON tags for:

1. **omitempty** - To omit zero values:
   ```go
   Description string `json:",omitempty"`
   ```

2. **Renaming** (rare, only for external API compatibility):
   ```go
   // External API uses different naming
   ExternalID string `json:"external_id"` // Only for external APIs
   ```

---

## Database Schema Examples

```sql
-- ✅ CORRECT
CREATE TABLE Publications (
    Id TEXT PRIMARY KEY,
    ContentType TEXT NOT NULL,
    Title TEXT NOT NULL,
    Slug TEXT,
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE VariableSources (
    Id TEXT PRIMARY KEY,
    SourceName TEXT NOT NULL,
    FileType TEXT NOT NULL,
    RowCount INTEGER DEFAULT 0
);

-- ❌ WRONG - snake_case columns
CREATE TABLE publications (
    id TEXT PRIMARY KEY,
    content_type TEXT NOT NULL,
    created_at TEXT
);
```

---

## API Payload Examples

### Request

```json
{
  "Title": "Professional Cleaning Services",
  "Keywords": ["cleaning", "house cleaning", "Melbourne"],
  "ServiceAreas": ["Melbourne CBD", "Southbank"],
  "OutputFormat": "html",
  "ContentType": "blog_post",
  "Variables": {
    "CompanyName": "CleanCo",
    "YearsExperience": 15
  }
}
```

### Response

```json
{
  "Id": "post_abc123",
  "Content": "<div>...</div>",
  "SuggestedCategories": ["Cleaning Tips", "Home Services"],
  "SuggestedTags": ["cleaning", "professional"],
  "GeneratedSlugs": [
    {
      "Slug": "melbourne-cleaning-experts",
      "Title": "Melbourne Cleaning Experts",
      "Generated": true
    }
  ],
  "Metadata": {
    "KeywordCount": 12,
    "WordCount": 850,
    "TransitionRatio": 0.42
  }
}
```

---

## Affected CLIs

This convention applies to ALL CLIs in the ecosystem:

| CLI | Database | JSON API |
|-----|----------|----------|
| GSearch CLI | ✅ PascalCase | ✅ PascalCase |
| VRun CLI | ✅ PascalCase | ✅ PascalCase |
| AI Bridge CLI | ✅ PascalCase | ✅ PascalCase |
| WP SEO Publish CLI | ✅ PascalCase | ✅ PascalCase |
| All Future CLIs | ✅ PascalCase | ✅ PascalCase |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| AI Bridge DB Schema | `02-spec/22-ai-bridge-cli/01-backend/12-database-architecture.md` |
| WP SEO DB Schema | `02-spec/32-wp-seo-publish-cli/01-backend/06-split-db-schema.md` |
| GSearch DB Schema | `02-spec/20-gsearch-cli/01-backend/` |
