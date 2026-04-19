# WP SEO Publish CLI Enum Compliance Audit Report

**Date:** 2026-02-06  
**Auditor:** AI  
**Version:** 1.0.0  
**Standard:** `spec/17-enum-specification/`

> **v3.0.0 Note (2026-02-28):** Since this audit, all enums have been migrated to the v3.0.0 single `variantLabels` PascalCase pattern. The dual-table `variantStrings` + `variantLabels` pattern referenced in this report is now deprecated. `Label()` delegates to `String()`, `Parse()` uses `strings.EqualFold()`, and package names use the `type` suffix convention.

---

## Summary

| Category | Score | Max | Status |
|----------|-------|-----|--------|
| Structure | 0 | 10 | ❌ Fail |
| Declaration | 2 | 10 | ❌ Fail |
| Required Methods | 0 | 14 | ❌ Fail |
| Lookup Tables | 0 | 6 | ❌ Fail |
| No Hardcoded Strings | 3 | 10 | ❌ Fail |
| **Total** | **5** | **50** | **❌ Non-Compliant** |

---

## Critical Issues Found

### Issue 1: No Enum Directory Structure

WP SEO Publish CLI has **no `internal/enums/` directory** defined in its specifications. All type-differentiating values use string-based struct fields without proper enum infrastructure.

### Issue 2: String-Based Struct Fields in Architecture

**File:** `01-architecture.md`

| Field | Current Type | Should Be |
|-------|--------------|-----------|
| `ContentType` | `string` | `content_type.Variant` |
| `OutputFormat` | `string` | `output_format.Variant` |
| `PublishStatus` | `string` | `publish_status.Variant` |

---

### Issue 3: Implicit Enums in Split DB Schema

**File:** `06-split-db-schema.md`

| Field | Table | Current Type | Should Be |
|-------|-------|--------------|-----------|
| `Status` | `Publications` | `TEXT` (comment: "published, draft, private, pending") | `publish_status.Variant` |
| `Status` | `Automations` | `TEXT` (comment: "idle, running, paused, completed") | `automation_status.Variant` |
| `ValueType` | `Settings` | `TEXT` (comment: "string, int, float, bool, json") | `value_type.Variant` |
| `Source` | `Settings` | `TEXT` (comment: "seed, user, runtime") | `config_source.Variant` |

---

### Issue 4: Variable System Implicit Enums

**File:** `05-variable-system.md`

| Field | Current Type | Should Be |
|-------|--------------|-----------|
| `SourceType` | `string` (comment: "csv, json, yaml") | `variable_source.Variant` |
| `Scope` | `string` (comment: "global, website, content, instance") | `variable_scope.Variant` |
| `ValueType` | `string` (comment: "string, number, boolean, array") | `value_type.Variant` |

---

### Issue 5: Content Generation Implicit Enums

**File:** `03-content-generation.md`

| Field | Current Type | Should Be |
|-------|--------------|-----------|
| `LinkDensity` | `string` (comment: "paragraph, sentence, word") | `link_density.Variant` |
| `ToneOfVoice` | `string` (comment: "professional, casual, technical") | `tone.Variant` |
| `ContentLength` | `string` (comment: "short, medium, long") | `content_length.Variant` |

---

### Issue 6: Export Service Hardcoded Strings

**File:** `07-export-service.md`

```go
func (s *ExportService) Export(format string, data any) ([]byte, error) {
    switch format {
    case "csv":
        return s.exportCSV(data)
    case "json":
        return s.exportJSON(data)
    case "html":
        return s.exportHTML(data)
    default:
        return nil, fmt.Errorf("unsupported format: %s", format)
    }
}
```

**Issues:**
- ❌ Uses hardcoded string literals in switch
- ❌ No type-safe enum for format selection
- ❌ Error handling uses string interpolation

---

## Enums Required

| Enum | Package | Values | Source File |
|------|---------|--------|-------------|
| `content_type.Variant` | `internal/enums/content_type/` | Category, Page, Post, Tag | `01-architecture.md` |
| `output_format.Variant` | `internal/enums/output_format/` | Html, Markdown, Json, Csv | `01-architecture.md`, `07-export-service.md` |
| `publish_status.Variant` | `internal/enums/publish_status/` | Published, Draft, Private, Pending | `06-split-db-schema.md` |
| `automation_status.Variant` | `internal/enums/automation_status/` | Idle, Running, Paused, Completed | `06-split-db-schema.md` |
| `value_type.Variant` | `internal/enums/value_type/` | String, Int, Float, Bool, Json | `06-split-db-schema.md` |
| `config_source.Variant` | `internal/enums/config_source/` | Seed, User, Runtime | `06-split-db-schema.md` |
| `variable_source.Variant` | `internal/enums/variable_source/` | Csv, Json, Yaml | `05-variable-system.md` |
| `variable_scope.Variant` | `internal/enums/variable_scope/` | Global, Website, Content, Instance | `05-variable-system.md` |
| `link_density.Variant` | `internal/enums/link_density/` | Paragraph, Sentence, Word | `03-content-generation.md` |
| `tone.Variant` | `internal/enums/tone/` | Professional, Casual, Technical | `03-content-generation.md` |
| `content_length.Variant` | `internal/enums/content_length/` | Short, Medium, Long | `03-content-generation.md` |

---

## Remediation Plan

### Phase 1: Create Enum Architecture Specification

Create `spec/12-wp-seo-publish-cli/01-backend/12-enum-architecture.md` with all enum definitions following `spec/17-enum-specification/` standard.

### Phase 2: Define Compliant Enums

For each enum, ensure:
1. `type Variant byte`
2. `Unknown Variant = iota` as first constant
3. `variantStrings` and `variantLabels` arrays
4. All required methods: `String()`, `Label()`, `IsValid()`, `Is*()`, `All()`, `ByIndex()`, `Parse()`

### Phase 3: Update Existing Specs

Update these files to reference the new enums:
- `01-architecture.md` - Replace content type and format strings
- `03-content-generation.md` - Replace link density, tone, length strings
- `05-variable-system.md` - Replace source, scope, value type strings
- `06-split-db-schema.md` - Replace status and type string columns
- `07-export-service.md` - Replace hardcoded format switch

---

## Compliant Enum Template (publish_status.Variant)

```go
// internal/enums/publish_status/variant.go
package publish_status

import (
    "encoding/json"
    "fmt"
    "strings"
)

// Variant represents a WordPress publication status
type Variant byte

const (
    // Unknown is the zero value (invalid/unset)
    Unknown Variant = iota
    
    // Published is publicly visible
    Published
    
    // Draft is not yet published
    Draft
    
    // Private is visible only to admins
    Private
    
    // Pending is awaiting review
    Pending
)

var variantStrings = [...]string{
    Unknown:   "unknown",
    Published: "published",
    Draft:     "draft",
    Private:   "private",
    Pending:   "pending",
}

var variantLabels = [...]string{
    Unknown:   "Unknown Status",
    Published: "Published",
    Draft:     "Draft",
    Private:   "Private",
    Pending:   "Pending Review",
}

func (v Variant) String() string {
    if !v.IsValid() {
        return variantStrings[Unknown]
    }
    return variantStrings[v]
}

func (v Variant) Label() string {
    if !v.IsValid() {
        return variantLabels[Unknown]
    }
    return variantLabels[v]
}

func (v Variant) IsValid() bool {
    return v > Unknown && v < Variant(len(variantStrings))
}

func (v Variant) IsUnknown() bool   { return v == Unknown }
func (v Variant) IsPublished() bool { return v == Published }
func (v Variant) IsDraft() bool     { return v == Draft }
func (v Variant) IsPrivate() bool   { return v == Private }
func (v Variant) IsPending() bool   { return v == Pending }

func All() []Variant {
    return []Variant{Published, Draft, Private, Pending}
}

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantStrings) {
        return Unknown
    }
    return Variant(i)
}

func Parse(s string) (Variant, error) {
    lower := strings.ToLower(strings.TrimSpace(s))
    for i, str := range variantStrings {
        if str == lower {
            return Variant(i), nil
        }
    }
    return Unknown, fmt.Errorf("invalid publish status: %q", s)
}

func Values() []string {
    result := make([]string, 0, len(variantStrings)-1)
    for _, s := range variantStrings[1:] {
        result = append(result, s)
    }
    return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
    return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return err
    }
    parsed, err := Parse(s)
    if err != nil {
        return err
    }
    *v = parsed
    return nil
}

// Domain-specific methods

// IsVisible returns true if status allows public viewing
func (v Variant) IsVisible() bool {
    return v == Published
}

// AllowsEditing returns true if content can still be modified
func (v Variant) AllowsEditing() bool {
    return v != Unknown
}

// WordPressStatus returns the WordPress REST API status value
func (v Variant) WordPressStatus() string {
    switch v {
    case Published:
        return "publish"
    case Draft:
        return "draft"
    case Private:
        return "private"
    case Pending:
        return "pending"
    default:
        return "draft"
    }
}
```

---

## Cross-References

| Resource | Location |
|----------|----------|
| Enum Specification | `spec/17-enum-specification/` |
| Architecture | `spec/12-wp-seo-publish-cli/01-backend/01-architecture.md` |
| Content Generation | `spec/12-wp-seo-publish-cli/01-backend/03-content-generation.md` |
| Variable System | `spec/12-wp-seo-publish-cli/01-backend/05-variable-system.md` |
| Split DB Schema | `spec/12-wp-seo-publish-cli/01-backend/06-split-db-schema.md` |
| Export Service | `spec/12-wp-seo-publish-cli/01-backend/07-export-service.md` |

---

*WP SEO Publish CLI enum compliance audit completed. Score: 5/50 (Non-Compliant)*
