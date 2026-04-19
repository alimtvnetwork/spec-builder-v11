# AI Bridge CLI Enum Compliance Audit Report

**Date:** 2026-02-06  
**Auditor:** AI  
**Version:** 1.0.0  
**Standard:** `spec/17-enum-specification/`

> **v3.0.0 Note (2026-02-28):** Since this audit, all enums have been migrated to the v3.0.0 single `variantLabels` PascalCase pattern. The dual-table `variantStrings` + `variantLabels` pattern referenced in this report is now deprecated. `Label()` delegates to `String()`, `Parse()` uses `strings.EqualFold()`, and package names use the `type` suffix convention (e.g., `steptype`).

---

## Summary

| Category | Score | Max | Status |
|----------|-------|-----|--------|
| Structure | 0 | 10 | ❌ Fail |
| Declaration | 4 | 10 | ❌ Fail |
| Required Methods | 0 | 14 | ❌ Fail |
| Lookup Tables | 0 | 6 | ❌ Fail |
| No Hardcoded Strings | 4 | 10 | ❌ Fail |
| **Total** | **8** | **50** | **❌ Non-Compliant** |

---

## Critical Issues Found

### Issue 1: No Enum Directory Structure

AI Bridge CLI has **no `internal/enums/` directory** defined in its specifications. All type-differentiating values use string-based type aliases without proper enum infrastructure.

### Issue 2: String-Based Type Aliases in Long-Chain Command System

**File:** `50-long-chain-command-system.md` (lines 181-214)

```go
type StepType string

const (
    StepTypeReadFile    StepType = "ReadFile"
    StepTypeReadUrl     StepType = "ReadUrl"
    StepTypeSearch      StepType = "Search"
    StepTypeVectorQuery StepType = "VectorQuery"
    StepTypeTransform   StepType = "Transform"
    StepTypeFilter      StepType = "Filter"
    StepTypeAggregate   StepType = "Aggregate"
    StepTypeBranch      StepType = "Branch"
    StepTypeExecute     StepType = "Execute"
)

type CommandCategory string

const (
    CategoryReasoning CommandCategory = "reasoning"
    CategoryCoding    CommandCategory = "coding"
    CategorySearch    CommandCategory = "search"
    CategoryCustom    CommandCategory = "custom"
)

type ExecutionStatus string

const (
    StatusPending   ExecutionStatus = "pending"
    StatusRunning   ExecutionStatus = "running"
    StatusCompleted ExecutionStatus = "completed"
    StatusFailed    ExecutionStatus = "failed"
    StatusCancelled ExecutionStatus = "cancelled"
)
```

**Issues:**
- ❌ Uses `string` instead of `byte`
- ❌ No `Unknown` zero value
- ❌ No `variantStrings` / `variantLabels` arrays
- ❌ No `Is*()` methods
- ❌ No `All()`, `ByIndex()`, `Parse()`, `Label()` methods
- ❌ Not in `internal/enums/` folder

---

### Issue 3: Implicit Enums in Configuration

**File:** `06-configuration.md`

| Field | Line | Current Type | Should Be |
|-------|------|--------------|-----------|
| `backend.default` | 37 | `string` (comment: "ollama \| llama-cpp") | `backend_type.Variant` |
| `logging.level` | 157 | `string` (comment: "debug \| info \| warn \| error") | `log_level.Variant` |
| `logging.format` | 158 | `string` (comment: "json \| text") | `log_format.Variant` |

---

### Issue 4: Implicit Enums in Database Architecture

**File:** `12-database-architecture.md`

| Field | Line | Current Type | Should Be |
|-------|------|--------------|-----------|
| `Settings.ValueType` | 93 | `string` (comment: "string, int, float, bool, json") | `value_type.Variant` |
| `Settings.Source` | 94 | `string` (comment: "seed, user, runtime") | `config_source.Variant` |
| `Applications.Status` | 124 | `string` (comment: "active, archived, deleted") | `app_status.Variant` |
| `SessionMeta.ModelCategory` | 379 | `string` (comment: "thinking, coding, writing") | `model_category.Variant` |
| `Messages.Role` | 410 | `string` (comment: "system, user, assistant") | `message_role.Variant` |

---

### Issue 5: Implicit Enums in Adaptive Reasoning Flow

**File:** `37-adaptive-reasoning-flow.md`

| Field | Line | Current Type | Should Be |
|-------|------|--------------|-----------|
| `ReasoningMode` | 239 | `string` (comment: "Auto, TwoStage, SinglePrompt, Disabled") | `reasoning_mode.Variant` |
| `ContextNeed.Type` | 305 | `string` (comment: "WebSearch, Codebase, Documentation") | `context_type.Variant` |
| `ContextNeed.Priority` | 308 | `string` (comment: "Required, Helpful, Optional") | `priority.Variant` |
| `ConnectionState` | 371 | `string` (comment: "Connected, Disconnected, Reconnecting") | `connection_state.Variant` |
| `PendingRequest.Stage` | 388 | `string` (comment: "Reasoning, Generating, Streaming") | `request_stage.Variant` |

---

### Issue 6: Implicit Enums in Suggestions System

**File:** `34-suggestions-system.md`

| Field | Line | Current Type | Should Be |
|-------|------|--------------|-----------|
| `Suggestions.Module` | 43 | `string` (comment: "Chat, Blog, Faq, Code, Paragraph") | `module.Variant` |
| `Suggestions.Type` | 46 | `string` (comment: "Actionable, Informational") | `suggestion_type.Variant` |
| `Suggestions.Priority` | 47 | `string` (comment: "Low, Medium, High") | `priority.Variant` |
| `Suggestions.Status` | 48 | `string` (comment: "Open, Accepted, Dismissed") | `suggestion_status.Variant` |

---

### Issue 7: Implicit Enums in Revision System

**File:** `31-revision-feedback-system.md`

| Field | Line | Current Type | Should Be |
|-------|------|--------------|-----------|
| `Revisions.ContentType` | 43 | `string` (comment: "blog, faq, html, code, chat") | `content_type.Variant` |
| `RevisionFeedback.FeedbackType` | 76 | `string` (comment: "revision_request, approval, rejection, note") | `feedback_type.Variant` |
| `RevisionFeedback.FeedbackSource` | 78 | `string` (comment: "user, automated, qa") | `feedback_source.Variant` |
| `RevisionDiffs.DiffType` | 109 | `string` (comment: "unified, side_by_side, inline") | `diff_type.Variant` |

---

## Enums Required

| Enum | Package | Values | Source File |
|------|---------|--------|-------------|
| `step_type.Variant` | `internal/enums/step_type/` | ReadFile, ReadUrl, Search, VectorQuery, Transform, Filter, Aggregate, Branch, Execute | `50-long-chain-command-system.md` |
| `command_category.Variant` | `internal/enums/command_category/` | Reasoning, Coding, Search, Custom | `50-long-chain-command-system.md` |
| `execution_status.Variant` | `internal/enums/execution_status/` | Pending, Running, Completed, Failed, Cancelled | `50-long-chain-command-system.md` |
| `backend_type.Variant` | `internal/enums/backend_type/` | Ollama, LlamaCpp | `06-configuration.md` |
| `log_level.Variant` | `internal/enums/log_level/` | Debug, Info, Warn, Error | `06-configuration.md` |
| `log_format.Variant` | `internal/enums/log_format/` | Json, Text | `06-configuration.md` |
| `value_type.Variant` | `internal/enums/value_type/` | String, Int, Float, Bool, Json | `12-database-architecture.md` |
| `config_source.Variant` | `internal/enums/config_source/` | Seed, User, Runtime | `12-database-architecture.md` |
| `app_status.Variant` | `internal/enums/app_status/` | Active, Archived, Deleted | `12-database-architecture.md` |
| `model_category.Variant` | `internal/enums/model_category/` | Thinking, Coding, Writing | `12-database-architecture.md` |
| `message_role.Variant` | `internal/enums/message_role/` | System, User, Assistant | `12-database-architecture.md` |
| `reasoning_mode.Variant` | `internal/enums/reasoning_mode/` | Auto, TwoStage, SinglePrompt, Disabled | `37-adaptive-reasoning-flow.md` |
| `context_type.Variant` | `internal/enums/context_type/` | WebSearch, Codebase, Documentation | `37-adaptive-reasoning-flow.md` |
| `connection_state.Variant` | `internal/enums/connection_state/` | Connected, Disconnected, Reconnecting | `37-adaptive-reasoning-flow.md` |
| `request_stage.Variant` | `internal/enums/request_stage/` | Reasoning, Generating, Streaming | `37-adaptive-reasoning-flow.md` |
| `module.Variant` | `internal/enums/module/` | Chat, Blog, Faq, Code, Paragraph | `34-suggestions-system.md` |
| `suggestion_type.Variant` | `internal/enums/suggestion_type/` | Actionable, Informational | `34-suggestions-system.md` |
| `priority.Variant` | `internal/enums/priority/` | Low, Medium, High | `34-suggestions-system.md`, `37-adaptive-reasoning-flow.md` |
| `suggestion_status.Variant` | `internal/enums/suggestion_status/` | Open, Accepted, Dismissed | `34-suggestions-system.md` |
| `content_type.Variant` | `internal/enums/content_type/` | Blog, Faq, Html, Code, Chat | `31-revision-feedback-system.md` |
| `feedback_type.Variant` | `internal/enums/feedback_type/` | RevisionRequest, Approval, Rejection, Note | `31-revision-feedback-system.md` |
| `feedback_source.Variant` | `internal/enums/feedback_source/` | User, Automated, Qa | `31-revision-feedback-system.md` |
| `diff_type.Variant` | `internal/enums/diff_type/` | Unified, SideBySide, Inline | `31-revision-feedback-system.md` |

---

## Remediation Plan

### Phase 1: Create Enum Architecture Specification

Create `spec/22-ai-bridge-cli/01-backend/53-enum-architecture.md` with all enum definitions following `spec/17-enum-specification/` standard.

### Phase 2: Define Compliant Enums

For each enum, ensure:
1. `type Variant byte`
2. `Unknown Variant = iota` as first constant
3. `variantStrings` and `variantLabels` arrays
4. All required methods: `String()`, `Label()`, `IsValid()`, `Is*()`, `All()`, `ByIndex()`, `Parse()`

### Phase 3: Update Existing Specs

Update these files to reference the new enums:
- `50-long-chain-command-system.md` - Replace `StepType`, `CommandCategory`, `ExecutionStatus` string types
- `06-configuration.md` - Replace backend/logging string enums
- `12-database-architecture.md` - Replace status/type string enums
- `37-adaptive-reasoning-flow.md` - Replace reasoning mode and state enums
- `34-suggestions-system.md` - Replace module/type/status enums
- `31-revision-feedback-system.md` - Replace content/feedback type enums

---

## Compliant Enum Template (step_type.Variant)

```go
// internal/enums/step_type/variant.go
package step_type

import (
    "encoding/json"
    "fmt"
    "strings"
)

// Variant represents a long-chain step type
type Variant byte

const (
    // Unknown is the zero value (invalid/unset)
    Unknown Variant = iota
    
    // ReadFile reads local files
    ReadFile
    
    // ReadUrl fetches remote URLs
    ReadUrl
    
    // Search performs web/code search
    Search
    
    // VectorQuery queries vector database
    VectorQuery
    
    // Transform transforms data
    Transform
    
    // Filter filters results
    Filter
    
    // Aggregate aggregates results
    Aggregate
    
    // Branch conditional branching
    Branch
    
    // Execute runs external commands
    Execute
)

var variantStrings = [...]string{
    Unknown:     "unknown",
    ReadFile:    "read_file",
    ReadUrl:     "read_url",
    Search:      "search",
    VectorQuery: "vector_query",
    Transform:   "transform",
    Filter:      "filter",
    Aggregate:   "aggregate",
    Branch:      "branch",
    Execute:     "execute",
}

var variantLabels = [...]string{
    Unknown:     "Unknown Step",
    ReadFile:    "Read File",
    ReadUrl:     "Read URL",
    Search:      "Search",
    VectorQuery: "Vector Query",
    Transform:   "Transform",
    Filter:      "Filter",
    Aggregate:   "Aggregate",
    Branch:      "Branch",
    Execute:     "Execute",
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

func (v Variant) IsUnknown() bool     { return v == Unknown }
func (v Variant) IsReadFile() bool    { return v == ReadFile }
func (v Variant) IsReadUrl() bool     { return v == ReadUrl }
func (v Variant) IsSearch() bool      { return v == Search }
func (v Variant) IsVectorQuery() bool { return v == VectorQuery }
func (v Variant) IsTransform() bool   { return v == Transform }
func (v Variant) IsFilter() bool      { return v == Filter }
func (v Variant) IsAggregate() bool   { return v == Aggregate }
func (v Variant) IsBranch() bool      { return v == Branch }
func (v Variant) IsExecute() bool     { return v == Execute }

func All() []Variant {
    return []Variant{ReadFile, ReadUrl, Search, VectorQuery, Transform, Filter, Aggregate, Branch, Execute}
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
    return Unknown, fmt.Errorf("invalid step type: %q", s)
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

// IsParallelizable returns true if step can run in parallel
func (v Variant) IsParallelizable() bool {
    switch v {
    case ReadFile, ReadUrl, Search, VectorQuery:
        return true
    default:
        return false
    }
}

// DefaultTimeoutMs returns default timeout for step type
func (v Variant) DefaultTimeoutMs() int {
    switch v {
    case ReadUrl:
        return 10000
    case Search:
        return 15000
    case VectorQuery:
        return 5000
    default:
        return 30000
    }
}
```

---

## Cross-References

| Resource | Location |
|----------|----------|
| Enum Specification | `spec/17-enum-specification/` |
| Long-Chain Command System | `spec/22-ai-bridge-cli/01-backend/50-long-chain-command-system.md` |
| Configuration | `spec/22-ai-bridge-cli/01-backend/06-configuration.md` |
| Database Architecture | `spec/22-ai-bridge-cli/01-backend/12-database-architecture.md` |
| Adaptive Reasoning Flow | `spec/22-ai-bridge-cli/01-backend/37-adaptive-reasoning-flow.md` |
| Suggestions System | `spec/22-ai-bridge-cli/01-backend/34-suggestions-system.md` |
| Revision Feedback System | `spec/22-ai-bridge-cli/01-backend/31-revision-feedback-system.md` |

---

*AI Bridge CLI enum compliance audit completed. Score: 8/50 (Non-Compliant)*
