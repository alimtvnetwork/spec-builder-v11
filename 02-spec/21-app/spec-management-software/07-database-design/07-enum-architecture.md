# Spec Management Software Enum Architecture

**Version:** 4.0.0  
**Standard:** `02-spec/02-coding-guidelines/03-golang/01-enum-specification/ v3.0.0`  
**Status:** Compliant  
**Updated:** 2026-03-09

---

## Overview

This document defines all type-safe enums for Spec Management Software following the universal enum specification. All enums use `type Variant byte` with `iota`, implement 7 mandatory methods, and include domain-specific helpers. All use `Invalid` as the zero value. All package names use the `type` suffix with no underscores.

---

## Directory Structure

```
internal/enums/
├── registry.go                        # Central enum registry
├── projecttype/variant.go             # Category, Project
├── visibilitytype/variant.go          # User, Global
├── filetype/variant.go                # Folder, File
├── configsourcetype/variant.go        # Seed, User
├── seedeventtype/variant.go           # Seed, Reseed, Reset, Update, PresetSeed
├── modeltype/variant.go               # Reasoning, Voice
├── slotstatustype/variant.go          # Idle, Loading, Active, Error, Unloading
├── contenttype/variant.go             # Idea, Feature, Task, CodingGuideline, Instruction
├── overridemodetype/variant.go        # Append, Replace
├── instructionstatustype/variant.go   # Transcribed...Cancelled (11 values)
├── instructionscopetype/variant.go    # Global, Backend, Frontend, File
├── executionmodetype/variant.go       # Automatic, Approval
├── inputtype/variant.go               # Voice, Text
├── tasktype/variant.go                # Create, Update, Delete, Refactor, Review, Verify
├── taskstatustype/variant.go          # Pending, InProgress, Completed, Failed, Skipped
├── changetype/variant.go              # Created, Updated, Deleted, Renamed
├── reportstatustype/variant.go        # Pending, Open, Resolved, Ignored
├── issuephasetype/variant.go          # A, B, C, D
├── issuecategorytype/variant.go       # MissingData, Conflict, Ambiguity, Enhancement
├── issueseveritytype/variant.go       # Critical, High, Medium, Low
├── issuestatustype/variant.go         # Open, Resolved, Ignored
├── answertype/variant.go              # Radio, Checkbox, Text, Dropdown, MultiSelect
├── userroletype/variant.go            # Admin, Editor, Viewer
├── specstatustype/variant.go          # Draft, Planned, InProgress, Complete, Deprecated
├── modelprovidertype/variant.go       # Ollama, LlamaCpp, OpenAi, Anthropic
├── modelcategorytype/variant.go       # Thinking, Writing, Voice, Coding, Embedding
├── modelcapabilitytype/variant.go     # Streaming, FunctionCalling, Vision, Audio, JsonMode
├── finishreasontype/variant.go        # Stop, Length, ToolCalls, ContentFilter
└── outputformattype/variant.go        # Text, Json, Markdown, Code
```

---

## Enum Definitions

All 29 enums follow the v3.0.0 single-table PascalCase pattern: `Invalid Variant = iota` as zero value, single `variantLabels` with PascalCase values matching constant names (e.g., `Invalid: "Invalid"`, `Transcribed: "Transcribed"`), `IsInvalid()` method, `Label()` delegating to `String()`, and `Parse()` using `strings.EqualFold()` for case-insensitive matching.

### 1. projecttype.Variant
`Invalid, Category, Project` — Domain: `CanContainSpecs() bool`

### 2. visibilitytype.Variant
`Invalid, User, Global` — Domain: `IsShared() bool`

### 3. filetype.Variant
`Invalid, Folder, File` — Domain: `CanHaveChildren() bool`

### 4. configsourcetype.Variant
`Invalid, Seed, User` — Domain: `CanReseed() bool`

### 5. seedeventtype.Variant
`Invalid, Seed, Reseed, Reset, Update, PresetSeed` — Domain: `IsDestructive() bool`

### 6. modeltype.Variant
`Invalid, Reasoning, Voice` — Domain: `RequiresGpu() bool`

### 7. slotstatustype.Variant
`Invalid, Idle, Loading, Active, Error, Unloading` — Domain: `IsTransitioning() bool`, `CanAcceptRequests() bool`

### 8. contenttype.Variant
`Invalid, Idea, Feature, Task, CodingGuideline, Instruction` — Domain: `IsActionable() bool`

### 9. overridemodetype.Variant
`Invalid, Append, Replace` — Domain: `IsDestructive() bool`

### 10. instructionstatustype.Variant

```go
package instructionstatustype

import ("encoding/json"; "fmt"; "strings")

type Variant byte

const (
    Invalid      Variant = iota
    Transcribed
    Proofreading
    Proofread
    Planning
    Planned
    Reviewing
    Ready
    Executing
    Completed
    Failed
    Cancelled
)

var variantLabels = [...]string{
    Invalid: "Invalid", Transcribed: "Transcribed", Proofreading: "Proofreading",
    Proofread: "Proofread", Planning: "Planning", Planned: "Planned",
    Reviewing: "Reviewing", Ready: "Ready", Executing: "Executing",
    Completed: "Completed", Failed: "Failed", Cancelled: "Cancelled",
}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool      { return v == Invalid }
func (v Variant) IsTranscribed() bool  { return v == Transcribed }
func (v Variant) IsProofreading() bool { return v == Proofreading }
func (v Variant) IsProofread() bool    { return v == Proofread }
func (v Variant) IsPlanning() bool     { return v == Planning }
func (v Variant) IsPlanned() bool      { return v == Planned }
func (v Variant) IsReviewing() bool    { return v == Reviewing }
func (v Variant) IsReady() bool        { return v == Ready }
func (v Variant) IsExecuting() bool    { return v == Executing }
func (v Variant) IsCompleted() bool    { return v == Completed }
func (v Variant) IsFailed() bool       { return v == Failed }
func (v Variant) IsCancelled() bool    { return v == Cancelled }

func All() []Variant { return []Variant{Transcribed, Proofreading, Proofread, Planning, Planned, Reviewing, Ready, Executing, Completed, Failed, Cancelled} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(ErrEnumParseFailed, r"invalid instruction status").WithContext("value", s))
}
func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] {
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

func (v Variant) IsTerminal() bool    { switch v { case Completed, Failed, Cancelled: return true; default: return false } }
func (v Variant) IsProcessing() bool  { switch v { case Proofreading, Planning, Executing: return true; default: return false } }
func (v Variant) CanTransitionTo(next Variant) bool {
    switch v {
    case Transcribed:  return next == Proofreading || next == Cancelled
    case Proofreading: return next == Proofread || next == Failed
    case Proofread:    return next == Planning || next == Cancelled
    case Planning:     return next == Planned || next == Failed
    case Planned:      return next == Reviewing || next == Cancelled
    case Reviewing:    return next == Ready || next == Cancelled
    case Ready:        return next == Executing || next == Cancelled
    case Executing:    return next == Completed || next == Failed
    default:           return false
    }
}
```

---

### 11. instructionscopetype.Variant
`Invalid, Global, Backend, Frontend, File` — Domain: `IsBroad() bool`

### 12. executionmodetype.Variant
`Invalid, Automatic, Approval` — Domain: `RequiresUserAction() bool`

### 13. inputtype.Variant
`Invalid, Voice, Text` — Domain: `RequiresTranscription() bool`

### 14. tasktype.Variant
`Invalid, Create, Update, Delete, Refactor, Review, Verify` — Domain: `IsDestructive() bool`, `ModifiesFiles() bool`

### 15. taskstatustype.Variant
`Invalid, Pending, InProgress, Completed, Failed, Skipped` — Domain: `IsTerminal() bool`, `IsSuccess() bool`

### 16. changetype.Variant
`Invalid, Created, Updated, Deleted, Renamed` — Domain: `IsDestructive() bool`

### 17. reportstatustype.Variant
`Invalid, Pending, Open, Resolved, Ignored` — Domain: `IsActionable() bool`, `IsClosed() bool`

### 18. issuephasetype.Variant
`Invalid, A, B, C, D` — Domain: `Priority() int`

### 19. issuecategorytype.Variant
`Invalid, MissingData, Conflict, Ambiguity, Enhancement` — Domain: `IsBlocker() bool`

### 20. issueseveritytype.Variant
`Invalid, Critical, High, Medium, Low` — Domain: `Priority() int`, `RequiresImmediateAction() bool`

### 21. issuestatustype.Variant
`Invalid, Open, Resolved, Ignored` — Domain: `IsClosed() bool`

### 22. answertype.Variant
`Invalid, Radio, Checkbox, Text, Dropdown, MultiSelect` — Domain: `AllowsMultiple() bool`, `RequiresOptions() bool`

### 23. userroletype.Variant
`Invalid, Admin, Editor, Viewer` — Domain: `CanWrite() bool`, `CanManageUsers() bool`, `PermissionLevel() int`

### 24. specstatustype.Variant
`Invalid, Draft, Planned, InProgress, Complete, Deprecated` — Domain: `IsActive() bool`, `IsEditable() bool`

### 25. modelprovidertype.Variant
`Invalid, Ollama, LlamaCpp, OpenAi, Anthropic` — Domain: `IsLocal() bool`, `RequiresApiKey() bool`, `DefaultBaseUrl() string`

### 26. modelcategorytype.Variant
`Invalid, Thinking, Writing, Voice, Coding, Embedding` — Domain: `SupportsStreaming() bool`

### 27. modelcapabilitytype.Variant
`Invalid, Streaming, FunctionCalling, Vision, Audio, JsonMode` — Domain: `IsMultimodal() bool`

### 28. finishreasontype.Variant
`Invalid, Stop, Length, ToolCalls, ContentFilter` — Domain: `IsSuccess() bool`, `RequiresRetry() bool`

### 29. outputformattype.Variant
`Invalid, Text, Json, Markdown, Code` — Domain: `IsStructured() bool`, `ContentType() string`

---

## Central Registry

```go
// internal/enums/registry.go
package enums

import (
    "internal/enums/answertype"
    "internal/enums/changetype"
    "internal/enums/configsourcetype"
    "internal/enums/contenttype"
    "internal/enums/executionmodetype"
    "internal/enums/filetype"
    "internal/enums/finishreasontype"
    "internal/enums/inputtype"
    "internal/enums/instructionscopetype"
    "internal/enums/instructionstatustype"
    "internal/enums/issuecategorytype"
    "internal/enums/issuephasetype"
    "internal/enums/issueseveritytype"
    "internal/enums/issuestatustype"
    "internal/enums/modelcapabilitytype"
    "internal/enums/modelcategorytype"
    "internal/enums/modelprovidertype"
    "internal/enums/modeltype"
    "internal/enums/outputformattype"
    "internal/enums/overridemodetype"
    "internal/enums/projecttype"
    "internal/enums/reportstatustype"
    "internal/enums/seedeventtype"
    "internal/enums/slotstatustype"
    "internal/enums/specstatustype"
    "internal/enums/taskstatustype"
    "internal/enums/tasktype"
    "internal/enums/userroletype"
    "internal/enums/visibilitytype"
)

type EnumInfo struct {
    Name       string
    Package    string
    ValueCount int
    Values     []string
}

func Registry() []EnumInfo {
    return []EnumInfo{
        {"ProjectType", "projecttype", 2, projecttype.Values()},
        {"Visibility", "visibilitytype", 2, visibilitytype.Values()},
        {"FileType", "filetype", 2, filetype.Values()},
        {"ConfigSource", "configsourcetype", 2, configsourcetype.Values()},
        {"SeedEventType", "seedeventtype", 5, seedeventtype.Values()},
        {"ModelType", "modeltype", 2, modeltype.Values()},
        {"SlotStatus", "slotstatustype", 5, slotstatustype.Values()},
        {"ContentType", "contenttype", 5, contenttype.Values()},
        {"OverrideMode", "overridemodetype", 2, overridemodetype.Values()},
        {"InstructionStatus", "instructionstatustype", 11, instructionstatustype.Values()},
        {"InstructionScope", "instructionscopetype", 4, instructionscopetype.Values()},
        {"ExecutionMode", "executionmodetype", 2, executionmodetype.Values()},
        {"InputType", "inputtype", 2, inputtype.Values()},
        {"TaskType", "tasktype", 6, tasktype.Values()},
        {"TaskStatus", "taskstatustype", 5, taskstatustype.Values()},
        {"ChangeType", "changetype", 4, changetype.Values()},
        {"ReportStatus", "reportstatustype", 4, reportstatustype.Values()},
        {"IssuePhase", "issuephasetype", 4, issuephasetype.Values()},
        {"IssueCategory", "issuecategorytype", 4, issuecategorytype.Values()},
        {"IssueSeverity", "issueseveritytype", 4, issueseveritytype.Values()},
        {"IssueStatus", "issuestatustype", 3, issuestatustype.Values()},
        {"AnswerType", "answertype", 5, answertype.Values()},
        {"UserRole", "userroletype", 3, userroletype.Values()},
        {"SpecStatus", "specstatustype", 5, specstatustype.Values()},
        {"ModelProvider", "modelprovidertype", 4, modelprovidertype.Values()},
        {"ModelCategory", "modelcategorytype", 5, modelcategorytype.Values()},
        {"ModelCapability", "modelcapabilitytype", 5, modelcapabilitytype.Values()},
        {"FinishReason", "finishreasontype", 4, finishreasontype.Values()},
        {"OutputFormat", "outputformattype", 4, outputformattype.Values()},
    }
}
```

---

## Cross-References

| Resource | Location |
|----------|----------|
| Enum Specification | `02-spec/02-coding-guidelines/03-golang/01-enum-specification/` |
| Database Schema | `02-spec/11-spec-management-software/07-database-design/01-schema.md` |
| Core Entities | `02-spec/11-spec-management-software/19-data-models/01-core-entities.md` |
| AI Types | `02-spec/11-spec-management-software/19-data-models/02-ai-types.md` |

---

*Spec Management Software enum architecture v3.0.0 — 29 compliant enums, fully migrated to type suffix convention per spec v3.0.0*
