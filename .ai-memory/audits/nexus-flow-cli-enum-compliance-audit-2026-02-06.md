# Nexus Flow CLI Enum Compliance Audit Report

**Date:** 2026-02-06  
**Auditor:** AI  
**Version:** 1.0.0  
**Standard:** `02-spec/17-enum-specification/`

> **v3.0.0 Note (2026-02-28):** Since this audit, all enums have been migrated to the v3.0.0 single `variantLabels` PascalCase pattern. The dual-table `variantStrings` + `variantLabels` pattern referenced in this report is now deprecated. `Label()` delegates to `String()`, `Parse()` uses `strings.EqualFold()`, and package names use the `type` suffix convention (e.g., `blocktype`).

---

## Summary

| Category | Score | Max | Status |
|----------|-------|-----|--------|
| Structure | 0 | 10 | ❌ Fail |
| Declaration | 2 | 10 | ❌ Fail |
| Required Methods | 0 | 14 | ❌ Fail |
| Lookup Tables | 0 | 6 | ❌ Fail |
| No Hardcoded Strings | 4 | 10 | ❌ Fail |
| **Total** | **6** | **50** | **❌ Non-Compliant** |

---

## Critical Issues Found

### Issue 1: No Enum Directory Structure

Nexus Flow CLI has **no `internal/enums/` directory** defined in its specifications. All type-differentiating values use string-based type aliases without proper enum infrastructure.

### Issue 2: String-Based Type Aliases in Core Specification

**File:** `01-core-specification.md` (lines 500-532)

```go
type MessageType string

const (
    MsgSessionConfigure  MessageType = "session.configure"
    MsgPipelineExecute   MessageType = "pipeline.execute"
    MsgPipelineCancel    MessageType = "pipeline.cancel"
    MsgPipelinePause     MessageType = "pipeline.pause"
    MsgPipelineResume    MessageType = "pipeline.resume"
    // ... 20+ more constants
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

### Issue 3: String-Based BlockType Alias

**File:** `01-core-specification.md` (lines 1072-1082)

```go
type BlockType string

const (
    BlockTypePrompt     BlockType = "prompt"
    BlockTypeSearch     BlockType = "search"
    BlockTypeCodeGen    BlockType = "codegen"
    BlockTypeValidation BlockType = "validation"
    BlockTypeTransform  BlockType = "transform"
    BlockTypeHTTP       BlockType = "http"
    BlockTypeFileOp     BlockType = "fileop"
)
```

**Issues:**
- ❌ Uses `string` instead of `byte`
- ❌ No `Unknown` zero value
- ❌ No lookup tables or required methods

---

### Issue 4: Implicit Enums in Database Architecture

**File:** `05-database-architecture.md`

| Field | Line | Current Type | Should Be |
|-------|------|--------------|-----------|
| `Settings.ValueType` | 72 | `string` (comment: "string, int, float, bool, json") | `value_type.Variant` |
| `Settings.Source` | 73 | `string` (comment: "seed, user, runtime") | `config_source.Variant` |
| `Pipelines.Status` | 100 | `string` (comment: "active, archived, deleted") | `pipeline_status.Variant` |
| `ExecutionMeta.Status` | 244 | `string` (comment: "pending, running, completed, failed, cancelled") | `execution_status.Variant` |
| `BlockExecutions.Status` | 268 | `string` (comment: "pending, running, completed, failed, skipped") | `block_status.Variant` |
| `ExecutionLogs.Level` | 284 | `string` (comment: "debug, info, warn, error") | `log_level.Variant` |
| `DbRegistry.Category` | 126 | `string` (comment: "meta, executions, checkpoints") | `db_category.Variant` |
| `Counters.Category` | 113 | `string` (comment: "pipelines, executions, checkpoints") | `counter_category.Variant` |
| `ResetRequests.Status` | 150 | `string` (comment: "pending, confirmed, expired, cancelled") | `reset_status.Variant` |

---

### Issue 5: Implicit Enums in Settings Service

**File:** `08-settings-service.md`

| Field | Line | Current Type | Should Be |
|-------|------|--------------|-----------|
| `Settings.ValueType` | 25 | `string` (comment: "string, int, bool, json, duration") | `value_type.Variant` |
| `rbac.defaultRole` | 113 | `string` (comment: "viewer") | `role.Variant` |
| `observability.logLevel` | 120 | `string` (comment: "info, debug, warn, error") | `log_level.Variant` |

---

### Issue 6: Implicit Enums in WebSocket Protocol

**File:** `01-core-specification.md` (lines 1167-1172)

```go
type StreamDelta struct {
    Type    string `json:"type"`    // "text", "code", "progress"
    Content string `json:"content"`
    Done    bool   `json:"done"`
}
```

The `Type` field should use a `delta_type.Variant` enum.

---

## Enums Required

| Enum | Package | Values | Source File |
|------|---------|--------|-------------|
| `message_type.Variant` | `internal/enums/message_type/` | SessionConfigure, PipelineExecute, PipelineCancel, PipelinePause, PipelineResume, BlockRetry, BlockSkip, InputProvide, Ping, SessionCreated, SessionConfigured, ExecutionStarted, ExecutionProgress, ExecutionCompleted, ExecutionFailed, ExecutionCanceled, BlockStarted, BlockProgress, BlockCompleted, BlockFailed, BlockWaiting, CheckpointCreated, EscalationRequired, Pong, Error | `01-core-specification.md` |
| `block_type.Variant` | `internal/enums/block_type/` | Prompt, Search, CodeGen, Validation, Transform, Http, FileOp | `01-core-specification.md` |
| `value_type.Variant` | `internal/enums/value_type/` | String, Int, Float, Bool, Json, Duration | `05-database-architecture.md`, `08-settings-service.md` |
| `config_source.Variant` | `internal/enums/config_source/` | Seed, User, Runtime | `05-database-architecture.md` |
| `pipeline_status.Variant` | `internal/enums/pipeline_status/` | Active, Archived, Deleted | `05-database-architecture.md` |
| `execution_status.Variant` | `internal/enums/execution_status/` | Pending, Running, Completed, Failed, Cancelled | `05-database-architecture.md` |
| `block_status.Variant` | `internal/enums/block_status/` | Pending, Running, Completed, Failed, Skipped | `05-database-architecture.md` |
| `log_level.Variant` | `internal/enums/log_level/` | Debug, Info, Warn, Error | `05-database-architecture.md`, `08-settings-service.md` |
| `db_category.Variant` | `internal/enums/db_category/` | Meta, Executions, Checkpoints | `05-database-architecture.md` |
| `counter_category.Variant` | `internal/enums/counter_category/` | Pipelines, Executions, Checkpoints | `05-database-architecture.md` |
| `reset_status.Variant` | `internal/enums/reset_status/` | Pending, Confirmed, Expired, Cancelled | `05-database-architecture.md` |
| `delta_type.Variant` | `internal/enums/delta_type/` | Text, Code, Progress | `01-core-specification.md` |
| `role.Variant` | `internal/enums/role/` | Viewer, Editor, Admin | `08-settings-service.md` |

---

## Remediation Plan

### Phase 1: Create Enum Architecture Specification

Create `02-spec/24-nexus-flow-cli/01-backend/10-enum-architecture.md` with all enum definitions following `02-spec/17-enum-specification/` standard.

### Phase 2: Define Compliant Enums

For each enum, ensure:
1. `type Variant byte`
2. `Unknown Variant = iota` as first constant
3. `variantStrings` and `variantLabels` arrays
4. All required methods: `String()`, `Label()`, `IsValid()`, `Is*()`, `All()`, `ByIndex()`, `Parse()`

### Phase 3: Update Existing Specs

Update these files to reference the new enums:
- `01-core-specification.md` - Replace `MessageType`, `BlockType` string types
- `05-database-architecture.md` - Replace status/type string enums
- `08-settings-service.md` - Replace value type and role enums

---

## Compliant Enum Template (block_type.Variant)

```go
// internal/enums/block_type/variant.go
package block_type

import (
    "encoding/json"
    "fmt"
    "strings"
)

// Variant represents a workflow block type
type Variant byte

const (
    // Unknown is the zero value (invalid/unset)
    Unknown Variant = iota
    
    // Prompt executes AI prompts via AI-Bridge
    Prompt
    
    // Search performs RAG-powered search
    Search
    
    // CodeGen generates code artifacts
    CodeGen
    
    // Validation validates output data
    Validation
    
    // Transform transforms data between formats
    Transform
    
    // Http makes external HTTP requests
    Http
    
    // FileOp performs file system operations
    FileOp
)

var variantStrings = [...]string{
    Unknown:    "unknown",
    Prompt:     "prompt",
    Search:     "search",
    CodeGen:    "codegen",
    Validation: "validation",
    Transform:  "transform",
    Http:       "http",
    FileOp:     "fileop",
}

var variantLabels = [...]string{
    Unknown:    "Unknown Block",
    Prompt:     "AI Prompt",
    Search:     "RAG Search",
    CodeGen:    "Code Generation",
    Validation: "Validation",
    Transform:  "Transform",
    Http:       "HTTP Request",
    FileOp:     "File Operation",
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

func (v Variant) IsUnknown() bool    { return v == Unknown }
func (v Variant) IsPrompt() bool     { return v == Prompt }
func (v Variant) IsSearch() bool     { return v == Search }
func (v Variant) IsCodeGen() bool    { return v == CodeGen }
func (v Variant) IsValidation() bool { return v == Validation }
func (v Variant) IsTransform() bool  { return v == Transform }
func (v Variant) IsHttp() bool       { return v == Http }
func (v Variant) IsFileOp() bool     { return v == FileOp }

func All() []Variant {
    return []Variant{Prompt, Search, CodeGen, Validation, Transform, Http, FileOp}
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
    return Unknown, fmt.Errorf("invalid block type: %q", s)
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

// SupportsStreaming returns true if block type supports streaming output
func (v Variant) SupportsStreaming() bool {
    switch v {
    case Prompt, CodeGen:
        return true
    default:
        return false
    }
}

// DefaultTimeoutMs returns default timeout for block type
func (v Variant) DefaultTimeoutMs() int {
    switch v {
    case Http:
        return 30000
    case Prompt, CodeGen:
        return 120000
    case Search:
        return 15000
    default:
        return 60000
    }
}

// RequiresExternalService returns true if block needs external service
func (v Variant) RequiresExternalService() bool {
    switch v {
    case Prompt, Search, CodeGen, Http:
        return true
    default:
        return false
    }
}
```

---

## Cross-References

| Resource | Location |
|----------|----------|
| Enum Specification | `02-spec/17-enum-specification/` |
| Core Specification | `02-spec/24-nexus-flow-cli/01-backend/01-core-specification.md` |
| Database Architecture | `02-spec/24-nexus-flow-cli/01-backend/05-database-architecture.md` |
| Settings Service | `02-spec/24-nexus-flow-cli/01-backend/08-settings-service.md` |

---

*Nexus Flow CLI enum compliance audit completed. Score: 6/50 (Non-Compliant)*
