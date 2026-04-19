# Presets & Guidelines System

**Version:** 1.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

The Presets & Guidelines system provides layered project templates and configuration modules that enable consistent project creation and customizable spec standards. Presets define initial project structure, while Guidelines provide reusable configuration modules with inheritance.

---

## 10.1 Core Concepts

### Presets

A **Preset** is a project template that defines:
- Initial folder structure
- Default files with boilerplate content
- Pre-assigned guideline modules
- Technology stack metadata

### Guidelines

A **Guideline** is a configuration module that defines:
- Standards for a specific concern (coding, logging, errors, etc.)
- Scope level for inheritance (global → category → language → project)
- Content in both Markdown (human) and JSON (machine) formats

### Inheritance Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│  GLOBAL GUIDELINES (apply to all projects)                              │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │  CATEGORY GUIDELINES (apply to category and children)               ││
│  │  ┌─────────────────────────────────────────────────────────────────┐││
│  │  │  LANGUAGE GUIDELINES (apply to language-specific projects)      │││
│  │  │  ┌─────────────────────────────────────────────────────────────┐│││
│  │  │  │  PROJECT GUIDELINES (override for specific project)         ││││
│  │  │  └─────────────────────────────────────────────────────────────┘│││
│  │  └─────────────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 10.2 Preset Types

### Built-in Presets

| Preset ID | Name | Description | Guidelines Included |
|-----------|------|-------------|---------------------|
| `general` | General Spec | Basic project structure | coding, file-formatting, logging |
| `typescript` | TypeScript Project | TS/Node.js conventions | coding, file-formatting, logging, error-handling |
| `php-wordpress` | WordPress Plugin | WP plugin structure | wp-coding, wp-hooks, wp-security, logging |
| `golang` | Go Backend | Go service structure | go-coding, error-handling, logging |
| `python` | Python Project | Python conventions | py-coding, py-testing, logging |
| `blank` | Blank Project | Empty project | (none) |

### Preset Definition Schema

```typescript
interface Preset {
  Id: string;                    // UUID
  Slug: string;                  // unique identifier (e.g., 'typescript')
  Name: string;                  // display name
  Description: string;           // brief description
  Category: string;              // grouping (e.g., 'Language-Specific', 'Framework')
  Icon: string;                  // icon identifier (e.g., 'typescript', 'wordpress')
  IsBuiltIn: boolean;            // true = system preset, false = user-created
  IsEnabled: boolean;            // available for use
  FolderStructure: FolderNode[]; // initial folder/file tree
  GuidelineIds: string[];        // default guidelines to assign
  Metadata: Record<string, string>; // additional key-value pairs
  CreatedAt: string;             // ISO8601
  UpdatedAt: string;             // ISO8601
}

interface FolderNode {
  Name: string;                  // folder or file name
  Type: 'folder' | 'file';       // node type
  Children?: FolderNode[];       // nested items (folders only)
  TemplateContent?: string;      // boilerplate content (files only)
}
```

### Example Preset: TypeScript

```json
{
  "Id": "uuid-preset-typescript",
  "Slug": "typescript",
  "Name": "TypeScript Project",
  "Description": "Full TypeScript project with Node.js conventions",
  "Category": "Language-Specific",
  "Icon": "typescript",
  "IsBuiltIn": true,
  "IsEnabled": true,
  "FolderStructure": [
    {
      "Name": "00-overview.md",
      "Type": "file",
      "TemplateContent": "# {{projectName}}\n\n**Version:** 0.1.0\n**Status:** Draft\n\n---\n\n## Summary\n\n{{projectDescription}}\n"
    },
    {
      "Name": "01-architecture",
      "Type": "folder",
      "Children": [
        {
          "Name": "01-system-design.md",
          "Type": "file",
          "TemplateContent": "# System Design\n\n## Overview\n\n(TBD)\n"
        }
      ]
    },
    {
      "Name": "02-components",
      "Type": "folder",
      "Children": []
    },
    {
      "Name": "03-testing",
      "Type": "folder",
      "Children": []
    }
  ],
  "GuidelineIds": ["coding-ts", "file-formatting", "logging", "error-handling"],
  "Metadata": {
    "Language": "typescript",
    "Runtime": "node"
  }
}
```

---

## 10.3 Guideline Modules

### Built-in Guideline Modules

| Module Slug | Name | Scope | Description |
|-------------|------|-------|-------------|
| `coding-general` | Coding Standards | global | Naming, structure, best practices |
| `coding-ts` | TypeScript Coding | language | TS-specific conventions |
| `coding-php` | PHP Coding | language | PHP-specific conventions |
| `coding-go` | Go Coding | language | Go-specific conventions |
| `coding-py` | Python Coding | language | Python-specific conventions |
| `file-formatting` | File Formatting | global | Header format, line length, sections |
| `error-handling` | Error Management | global | Error codes, exception patterns |
| `logging` | Logging System | global | Log levels, structured logging |
| `testing` | Testing Standards | global | Test organization, coverage |
| `acceptance-criteria` | Acceptance Criteria | global | Feature validation format |
| `wp-hooks` | WordPress Hooks | category | WP hook registration patterns |
| `wp-security` | WordPress Security | category | WP sanitization, nonces, capabilities |

### Guideline Definition Schema

```typescript
interface Guideline {
  Id: string;                    // UUID
  Slug: string;                  // unique identifier
  Name: string;                  // display name
  Description: string;           // brief description
  Scope: GuidelineScope;         // inheritance level
  ScopeTargetId: string | null;  // target project/category ID (null for global)
  IsBuiltIn: boolean;            // true = system, false = user-created
  IsEnabled: boolean;            // active for inheritance
  Priority: number;              // conflict resolution (higher wins)
  ContentMarkdown: string;       // human-readable spec
  ContentJson: string;           // machine-parseable rules (optional)
  Version: string;               // semantic version
  CreatedAt: string;             // ISO8601
  UpdatedAt: string;             // ISO8601
}

type GuidelineScope = 'global' | 'category' | 'language' | 'project';
```

### Guideline JSON Schema

The `contentJson` field supports structured rules for AI processing:

```json
{
  "Rules": [
    {
      "Id": "naming-functions",
      "Type": "naming",
      "Pattern": "^[a-z][a-zA-Z0-9]*$",
      "AppliesTo": "functions",
      "Severity": "error",
      "Message": "Function names must be camelCase"
    },
    {
      "Id": "max-line-length",
      "Type": "formatting",
      "Value": 100,
      "Severity": "warning",
      "Message": "Lines should not exceed 100 characters"
    }
  ],
  "Extends": ["coding-general"]
}
```

---

## 10.4 Inheritance Resolution

### Resolution Algorithm

```go
func ResolveGuidelines(projectId string) []Guideline {
    // 1. Get project info (path, language, category)
    // 2. Collect applicable guidelines in order:
    //    a. Global scope (scopeTargetId = NULL)
    //    b. Category scope (scopeTargetId = project's category ID)
    //    c. Language scope (scopeTargetId = NULL, matches language tag)
    //    d. Project scope (scopeTargetId = projectId)
    // 3. For conflicting rules (same module slug):
    //    - Higher priority value wins
    //    - More specific scope wins (project > language > category > global)
    // 4. Return merged guideline list
}
```

### Conflict Resolution Example

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Module: coding-general (global, priority: 10)                          │
│    Rule: max-line-length = 120                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  Module: coding-ts (language, priority: 20)                             │
│    Rule: max-line-length = 100 (overrides global)                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Module: custom-coding (project, priority: 30)                          │
│    Rule: max-line-length = 80 (overrides language and global)           │
└─────────────────────────────────────────────────────────────────────────┘

Result: max-line-length = 80 (project-level wins)
```

---

## 10.5 API Endpoints

### Preset Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/presets` | List all available presets |
| GET | `/api/presets/:id` | Get preset details |
| POST | `/api/presets` | Create custom preset |
| PUT | `/api/presets/:id` | Update preset |
| DELETE | `/api/presets/:id` | Delete custom preset |
| GET | `/api/presets/:id/preview` | Preview folder structure |

### Guideline Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/guidelines` | List all guidelines |
| GET | `/api/guidelines/:id` | Get guideline details |
| POST | `/api/guidelines` | Create custom guideline |
| PUT | `/api/guidelines/:id` | Update guideline |
| DELETE | `/api/guidelines/:id` | Delete custom guideline |
| GET | `/api/guidelines/resolve/:projectId` | Get resolved guidelines for project |

### Project Creation with Preset

```http
POST /api/projects
Content-Type: application/json

{
  "Name": "My New Plugin",
  "Slug": "my-new-plugin",
  "Description": "A WordPress plugin for...",
  "ParentId": null,
  "PresetId": "uuid-preset-php-wordpress",
  "AdditionalGuidelineIds": ["custom-logging"],
  "TemplateVariables": {
    "ProjectName": "My New Plugin",
    "ProjectDescription": "A WordPress plugin for managing custom data.",
    "AuthorName": "John Doe"
  }
}
```

---

## 10.6 Request/Response Schemas

### List Presets Response

```typescript
interface ListPresetsResponse {
  Presets: PresetSummary[];
  TotalCount: number;
}

interface PresetSummary {
  Id: string;
  Slug: string;
  Name: string;
  Description: string;
  Category: string;
  Icon: string;
  IsBuiltIn: boolean;
  GuidelineCount: number;
}
```

### Preset Preview Response

```typescript
interface PresetPreviewResponse {
  Preset: PresetSummary;
  FolderTree: FolderNode[];
  Guidelines: GuidelineSummary[];
  TemplateVariables: string[]; // Variables used in templates (e.g., "ProjectName")
}
```

### Resolved Guidelines Response

```typescript
interface ResolvedGuidelinesResponse {
  ProjectId: string;
  Guidelines: ResolvedGuideline[];
  InheritanceChain: InheritanceNode[];
}

interface ResolvedGuideline {
  Id: string;
  Slug: string;
  Name: string;
  SourceScope: GuidelineScope;
  SourceId: string | null;
  Priority: number;
  ContentMarkdown: string;
}

interface InheritanceNode {
  Scope: GuidelineScope;
  TargetId: string | null;
  TargetName: string;
  GuidelineSlugs: string[];
}
```

---

## 10.7 Template Variable Substitution

### Supported Variables

| Variable | Source | Example |
|----------|--------|---------|
| `{{projectName}}` | User input | "My WordPress Plugin" |
| `{{projectSlug}}` | User input | "my-wordpress-plugin" |
| `{{projectDescription}}` | User input | "A plugin for..." |
| `{{authorName}}` | User profile or input | "John Doe" |
| `{{createdDate}}` | System | "2026-01-27" |
| `{{currentYear}}` | System | "2026" |

### Substitution Logic

```go
func ApplyTemplateVariables(content string, vars map[string]string) string {
    result := content
    for key, value := range vars {
        placeholder := "{{" + key + "}}"
        result = strings.ReplaceAll(result, placeholder, value)
    }
    return result
}
```

---

## 10.8 Project Assignment Table

### ProjectGuideline Junction

Tracks which guidelines are assigned to which projects:

```sql
CREATE TABLE ProjectGuideline (
    Id TEXT PRIMARY KEY,
    ProjectId TEXT NOT NULL,
    GuidelineId TEXT NOT NULL,
    AssignedAt TEXT NOT NULL,
    IsExcluded INTEGER DEFAULT 0,  -- 1 = explicitly excluded
    FOREIGN KEY (ProjectId) REFERENCES Project(Id) ON DELETE CASCADE,
    FOREIGN KEY (GuidelineId) REFERENCES Guideline(Id) ON DELETE CASCADE,
    UNIQUE(ProjectId, GuidelineId)
);
```

This allows:
- Adding extra guidelines beyond preset defaults
- Excluding inherited guidelines for specific projects
- Tracking when guidelines were assigned

---

## 10.9 Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 10001 | `ErrPresetNotFound` | Preset ID does not exist |
| 10002 | `ErrPresetBuiltinReadonly` | Cannot modify built-in preset |
| 10003 | `ErrPresetSlugExists` | Preset slug already taken |
| 10004 | `ErrGuidelineNotFound` | Guideline ID does not exist |
| 10005 | `ErrGuidelineBuiltinReadonly` | Cannot modify built-in guideline |
| 10006 | `ErrGuidelineSlugExists` | Guideline slug already taken |
| 10007 | `ErrTemplateVariableMissing` | Required template variable not provided |
| 10008 | `ErrInvalidFolderStructure` | Preset folder structure is malformed |
| 10009 | `ErrCircularGuidelineExtends` | Guideline extends itself (circular) |
| 10010 | `ErrScopeTargetNotFound` | Scope target project/category not found |

---

## 10.10 Acceptance Criteria

### Preset Management

- [ ] User can view list of available presets grouped by category
- [ ] User can preview folder structure before creating project
- [ ] User can create project from any enabled preset
- [ ] Template variables are substituted in all generated files
- [ ] User can create custom presets from existing projects
- [ ] Built-in presets cannot be modified or deleted

### Guideline Inheritance

- [ ] Global guidelines apply to all projects
- [ ] Category guidelines apply to projects in that category tree
- [ ] Language guidelines apply to projects with matching language
- [ ] Project guidelines override inherited ones
- [ ] Higher priority guidelines win conflicts
- [ ] User can exclude inherited guidelines per project

### API Behavior

- [ ] GET `/api/presets` returns all enabled presets
- [ ] GET `/api/guidelines/resolve/:projectId` returns merged guidelines
- [ ] POST `/api/projects` with `presetId` creates folder structure
- [ ] Missing template variables return 400 with clear error

---

## 10.11 Implementation Notes

### Built-in Seeding

On first run, seed built-in presets and guidelines from embedded JSON:

```go
//go:embed presets/*.json
var builtInPresets embed.FS

//go:embed guidelines/*.json
var builtInGuidelines embed.FS

func SeedBuiltIns(db *sql.DB) error {
    // 1. Load embedded JSON files
    // 2. Insert with isBuiltIn = true
    // 3. Skip if slug already exists (for upgrades)
}
```

### Upgrade Path

When adding new built-in presets/guidelines in future versions:
1. Check if slug exists
2. If exists and isBuiltIn, update content (user can't modify)
3. If exists and !isBuiltIn, skip (user customized)
4. If not exists, insert

---

## Related Specs

- [Database Schema](../../07-database-design/01-schema.md)
- [AI Integration Overview](./00-overview.md)
- [Dashboard](../11-dashboard/00-overview.md)
