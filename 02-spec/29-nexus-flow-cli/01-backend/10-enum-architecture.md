# Nexus Flow CLI: Enum Architecture

**Version:** 4.0.0  
**Status:** Complete  
**Updated:** 2026-03-09  
**Standard:** `02-spec/02-coding-guidelines/03-golang/01-enum-specification/ v3.0.0`

---

## Overview

This document defines all type-safe enums for Nexus Flow CLI following the universal `type Variant byte` pattern. Each enum lives in its own package under `internal/enums/` and implements the 7 mandatory methods. All enums use a single `variantLabels` table with PascalCase values. `Label()` delegates to `String()`. `Parse()` uses `strings.EqualFold()`.

---

## Directory Structure

```
internal/enums/
├── registry.go
├── blocktype/variant.go
├── stagetype/variant.go
├── executionstatustype/variant.go
├── blockstatustype/variant.go
├── logleveltype/variant.go
├── triggertype/variant.go
├── fileoperationtype/variant.go
├── pathtype/variant.go
├── fileformattype/variant.go
├── flowreftype/variant.go
├── variabletype/variant.go
├── variablescopetype/variant.go
├── runtimetype/variant.go
├── outputcapturemodetype/variant.go
├── integrationtype/variant.go
├── buildmodetype/variant.go
├── messagetype/variant.go
├── valuetype/variant.go
├── pipelinestatustype/variant.go
├── resetscopetype/variant.go
├── resetstatustype/variant.go
├── dbcategorytype/variant.go
└── referencetype/variant.go
```

---

## 1. blocktype.Variant

```go
package blocktype

import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")

type Variant byte

const (
    Invalid    Variant = iota
    Prompt
    Search
    CodeGen
    Validation
    Transform
    Http
    FileOp
)

var variantLabels = [...]string{
    Invalid:    "Invalid",
    Prompt:     "Prompt",
    Search:     "Search",
    CodeGen:    "CodeGen",
    Validation: "Validation",
    Transform:  "Transform",
    Http:       "Http",
    FileOp:     "FileOp",
}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool    { return v == Invalid }
func (v Variant) IsPrompt() bool     { return v == Prompt }
func (v Variant) IsSearch() bool     { return v == Search }
func (v Variant) IsCodeGen() bool    { return v == CodeGen }
func (v Variant) IsValidation() bool { return v == Validation }
func (v Variant) IsTransform() bool  { return v == Transform }
func (v Variant) IsHttp() bool       { return v == Http }
func (v Variant) IsFileOp() bool     { return v == FileOp }

func All() []Variant { return []Variant{Prompt, Search, CodeGen, Validation, Transform, Http, FileOp} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7001"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid block type: "+s,
    )
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

func (v Variant) SupportsStreaming() bool {
    switch v {
    case Prompt, CodeGen: return true
    default: return false
    }
}
```

---

## 2. stagetype.Variant

```go
package stagetype

import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")

type Variant byte

const (
    Invalid    Variant = iota
    Start; End; Prompt; CodeGen; Search; Transform; Validation; Http; FileOp
    Condition; Loop; SubFlow; Recorder; GSearch; Voice; CodeExec
)

var variantLabels = [...]string{
    Invalid: "Invalid", Start: "Start", End: "End", Prompt: "Prompt",
    CodeGen: "CodeGen", Search: "Search", Transform: "Transform",
    Validation: "Validation", Http: "Http", FileOp: "FileOp",
    Condition: "Condition", Loop: "Loop", SubFlow: "SubFlow",
    Recorder: "Recorder", GSearch: "GSearch", Voice: "Voice", CodeExec: "CodeExec",
}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool    { return v == Invalid }
func (v Variant) IsStart() bool      { return v == Start }
func (v Variant) IsEnd() bool        { return v == End }
func (v Variant) IsPrompt() bool     { return v == Prompt }
func (v Variant) IsCodeGen() bool    { return v == CodeGen }
func (v Variant) IsSearch() bool     { return v == Search }
func (v Variant) IsTransform() bool  { return v == Transform }
func (v Variant) IsValidation() bool { return v == Validation }
func (v Variant) IsHttp() bool       { return v == Http }
func (v Variant) IsFileOp() bool     { return v == FileOp }
func (v Variant) IsCondition() bool  { return v == Condition }
func (v Variant) IsLoop() bool       { return v == Loop }
func (v Variant) IsSubFlow() bool    { return v == SubFlow }
func (v Variant) IsRecorder() bool   { return v == Recorder }
func (v Variant) IsGSearch() bool    { return v == GSearch }
func (v Variant) IsVoice() bool      { return v == Voice }
func (v Variant) IsCodeExec() bool   { return v == CodeExec }

func All() []Variant { return []Variant{Start, End, Prompt, CodeGen, Search, Transform, Validation, Http, FileOp, Condition, Loop, SubFlow, Recorder, GSearch, Voice, CodeExec} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7002"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid stage type: "+s,
    )
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

func (v Variant) IsControlFlow() bool { switch v { case Condition, Loop, SubFlow: return true; default: return false } }
func (v Variant) IsTerminal() bool { return v == Start || v == End }
```

---

## 3. executionstatustype.Variant

```go
package executionstatustype

import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")

type Variant byte

const (
    Invalid Variant = iota; Pending; Running; Paused; Completed; Failed; Cancelled
)

var variantLabels = [...]string{
    Invalid: "Invalid", Pending: "Pending", Running: "Running",
    Paused: "Paused", Completed: "Completed", Failed: "Failed", Cancelled: "Cancelled",
}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool   { return v == Invalid }
func (v Variant) IsPending() bool   { return v == Pending }
func (v Variant) IsRunning() bool   { return v == Running }
func (v Variant) IsPaused() bool    { return v == Paused }
func (v Variant) IsCompleted() bool { return v == Completed }
func (v Variant) IsFailed() bool    { return v == Failed }
func (v Variant) IsCancelled() bool { return v == Cancelled }

func All() []Variant { return []Variant{Pending, Running, Paused, Completed, Failed, Cancelled} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7003"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid execution status: "+s,
    )
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

func (v Variant) IsTerminal() bool { switch v { case Completed, Failed, Cancelled: return true; default: return false } }
func (v Variant) IsActive() bool   { return v == Running || v == Paused }
```

---

## 4. blockstatustype.Variant

```go
package blockstatustype
import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")
type Variant byte
const (
    Invalid Variant = iota; Pending; Running; Completed; Failed; Skipped
)
var variantLabels = [...]string{Invalid: "Invalid", Pending: "Pending", Running: "Running", Completed: "Completed", Failed: "Failed", Skipped: "Skipped"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool   { return v == Invalid }
func (v Variant) IsPending() bool   { return v == Pending }
func (v Variant) IsRunning() bool   { return v == Running }
func (v Variant) IsCompleted() bool { return v == Completed }
func (v Variant) IsFailed() bool    { return v == Failed }
func (v Variant) IsSkipped() bool   { return v == Skipped }

func All() []Variant { return []Variant{Pending, Running, Completed, Failed, Skipped} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7004"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid block status: "+s,
    )
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

func (v Variant) IsTerminal() bool { switch v { case Completed, Failed, Skipped: return true; default: return false } }
```

---

## 5. logleveltype.Variant

```go
package logleveltype

import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")

type Variant byte

const (
    Invalid Variant = iota; Debug; Info; Warn; Error
)

var variantLabels = [...]string{
    Invalid: "Invalid", Debug: "Debug", Info: "Info", Warn: "Warn", Error: "Error",
}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsDebug() bool   { return v == Debug }
func (v Variant) IsInfo() bool    { return v == Info }
func (v Variant) IsWarn() bool    { return v == Warn }
func (v Variant) IsError() bool   { return v == Error }

func All() []Variant { return []Variant{Debug, Info, Warn, Error} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7005"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid log level: "+s,
    )
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

func (v Variant) Severity() int {
    switch v {
    case Debug: return 0; case Info: return 1; case Warn: return 2; case Error: return 3; default: return -1
    }
}
```

---

## 6. triggertype.Variant

```go
package triggertype
import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")
type Variant byte
const (Invalid Variant = iota; Manual; Scheduled; Api; Voice)
var variantLabels = [...]string{Invalid: "Invalid", Manual: "Manual", Scheduled: "Scheduled", Api: "Api", Voice: "Voice"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool   { return v == Invalid }
func (v Variant) IsManual() bool    { return v == Manual }
func (v Variant) IsScheduled() bool { return v == Scheduled }
func (v Variant) IsApi() bool       { return v == Api }
func (v Variant) IsVoice() bool     { return v == Voice }
func All() []Variant { return []Variant{Manual, Scheduled, Api, Voice} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7006"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid trigger type: "+s,
    )
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
```

---

## 7. fileoperationtype.Variant

```go
package fileoperationtype
import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")
type Variant byte
const (Invalid Variant = iota; Read; Write; Copy; Move; Delete; Rename; Mkdir; List; Exists; Stat)
var variantLabels = [...]string{Invalid: "Invalid", Read: "Read", Write: "Write", Copy: "Copy", Move: "Move", Delete: "Delete", Rename: "Rename", Mkdir: "Mkdir", List: "List", Exists: "Exists", Stat: "Stat"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsRead() bool    { return v == Read }
func (v Variant) IsWrite() bool   { return v == Write }
func (v Variant) IsCopy() bool    { return v == Copy }
func (v Variant) IsMove() bool    { return v == Move }
func (v Variant) IsDelete() bool  { return v == Delete }
func (v Variant) IsRename() bool  { return v == Rename }
func (v Variant) IsMkdir() bool   { return v == Mkdir }
func (v Variant) IsList() bool    { return v == List }
func (v Variant) IsExists() bool  { return v == Exists }
func (v Variant) IsStat() bool    { return v == Stat }
func All() []Variant { return []Variant{Read, Write, Copy, Move, Delete, Rename, Mkdir, List, Exists, Stat} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7007"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid file operation: "+s,
    )
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

func (v Variant) IsDestructive() bool { switch v { case Write, Delete, Move, Rename: return true; default: return false } }
func (v Variant) IsReadOnly() bool { switch v { case Read, List, Exists, Stat: return true; default: return false } }
```

---

## 8. pathtype.Variant

```go
package pathtype
import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")
type Variant byte
const (Invalid Variant = iota; Relative; Absolute; ProjectRelative)
var variantLabels = [...]string{Invalid: "Invalid", Relative: "Relative", Absolute: "Absolute", ProjectRelative: "ProjectRelative"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool         { return v == Invalid }
func (v Variant) IsRelative() bool        { return v == Relative }
func (v Variant) IsAbsolute() bool        { return v == Absolute }
func (v Variant) IsProjectRelative() bool { return v == ProjectRelative }
func All() []Variant { return []Variant{Relative, Absolute, ProjectRelative} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7008"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid path type: "+s,
    )
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
```

---

## 9. fileformattype.Variant

```go
package fileformattype
import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")
type Variant byte
const (Invalid Variant = iota; Json; Yaml; Toml; Text; Binary; Html; Markdown)
var variantLabels = [...]string{Invalid: "Invalid", Json: "Json", Yaml: "Yaml", Toml: "Toml", Text: "Text", Binary: "Binary", Html: "Html", Markdown: "Markdown"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool  { return v == Invalid }
func (v Variant) IsJson() bool     { return v == Json }
func (v Variant) IsYaml() bool     { return v == Yaml }
func (v Variant) IsToml() bool     { return v == Toml }
func (v Variant) IsText() bool     { return v == Text }
func (v Variant) IsBinary() bool   { return v == Binary }
func (v Variant) IsHtml() bool     { return v == Html }
func (v Variant) IsMarkdown() bool { return v == Markdown }
func All() []Variant { return []Variant{Json, Yaml, Toml, Text, Binary, Html, Markdown} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7009"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid file format: "+s,
    )
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

func (v Variant) IsStructured() bool { switch v { case Json, Yaml, Toml: return true; default: return false } }
```

---

## 10. flowreftype.Variant

```go
package flowreftype
import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")
type Variant byte
const (Invalid Variant = iota; Internal; External; Remote)
var variantLabels = [...]string{Invalid: "Invalid", Internal: "Internal", External: "External", Remote: "Remote"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool  { return v == Invalid }
func (v Variant) IsInternal() bool { return v == Internal }
func (v Variant) IsExternal() bool { return v == External }
func (v Variant) IsRemote() bool   { return v == Remote }
func All() []Variant { return []Variant{Internal, External, Remote} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7010"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid flow ref type: "+s,
    )
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
```

---

## 11. variabletype.Variant

```go
package variabletype
import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")
type Variant byte
const (Invalid Variant = iota; String; Number; Boolean; Json; FilePath; Array; Object)
var variantLabels = [...]string{Invalid: "Invalid", String: "String", Number: "Number", Boolean: "Boolean", Json: "Json", FilePath: "FilePath", Array: "Array", Object: "Object"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool  { return v == Invalid }
func (v Variant) IsString() bool   { return v == String }
func (v Variant) IsNumber() bool   { return v == Number }
func (v Variant) IsBoolean() bool  { return v == Boolean }
func (v Variant) IsJson() bool     { return v == Json }
func (v Variant) IsFilePath() bool { return v == FilePath }
func (v Variant) IsArray() bool    { return v == Array }
func (v Variant) IsObject() bool   { return v == Object }
func All() []Variant { return []Variant{String, Number, Boolean, Json, FilePath, Array, Object} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7011"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid variable type: "+s,
    )
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
```

---

## 12. variablescopetype.Variant

```go
package variablescopetype
import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")
type Variant byte
const (Invalid Variant = iota; System; Global; Flow; Stage)
var variantLabels = [...]string{Invalid: "Invalid", System: "System", Global: "Global", Flow: "Flow", Stage: "Stage"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsSystem() bool  { return v == System }
func (v Variant) IsGlobal() bool  { return v == Global }
func (v Variant) IsFlow() bool    { return v == Flow }
func (v Variant) IsStage() bool   { return v == Stage }
func All() []Variant { return []Variant{System, Global, Flow, Stage} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7012"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid variable scope: "+s,
    )
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
```

---

## 13. runtimetype.Variant

```go
package runtimetype
import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")
type Variant byte
const (Invalid Variant = iota; Go; TypeScript; JavaScript; Python; Php; Shell)
var variantLabels = [...]string{Invalid: "Invalid", Go: "Go", TypeScript: "TypeScript", JavaScript: "JavaScript", Python: "Python", Php: "Php", Shell: "Shell"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool    { return v == Invalid }
func (v Variant) IsGo() bool         { return v == Go }
func (v Variant) IsTypeScript() bool { return v == TypeScript }
func (v Variant) IsJavaScript() bool { return v == JavaScript }
func (v Variant) IsPython() bool     { return v == Python }
func (v Variant) IsPhp() bool        { return v == Php }
func (v Variant) IsShell() bool      { return v == Shell }
func All() []Variant { return []Variant{Go, TypeScript, JavaScript, Python, Php, Shell} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7013"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid runtime type: "+s,
    )
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

func (v Variant) FileExtension() string {
    switch v { case Go: return ".go"; case TypeScript: return ".ts"; case JavaScript: return ".js"; case Python: return ".py"; case Php: return ".php"; case Shell: return ".sh"; default: return "" }
}
func (v Variant) DefaultExecutable() string {
    switch v { case Go: return "go"; case TypeScript: return "bun"; case JavaScript: return "node"; case Python: return "python3"; case Php: return "php"; case Shell: return "bash"; default: return "" }
}
```

---

## 14. outputcapturemodetype.Variant

```go
package outputcapturemodetype
import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")
type Variant byte
const (Invalid Variant = iota; Stdout; Stderr; Both; Json)
var variantLabels = [...]string{Invalid: "Invalid", Stdout: "Stdout", Stderr: "Stderr", Both: "Both", Json: "Json"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsStdout() bool  { return v == Stdout }
func (v Variant) IsStderr() bool  { return v == Stderr }
func (v Variant) IsBoth() bool    { return v == Both }
func (v Variant) IsJson() bool    { return v == Json }
func All() []Variant { return []Variant{Stdout, Stderr, Both, Json} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7014"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid output capture mode: "+s,
    )
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
```

---

## 15. integrationtype.Variant

```go
package integrationtype
import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")
type Variant byte
const (Invalid Variant = iota; Recorder; GSearch; Voice; Rag; Http)
var variantLabels = [...]string{Invalid: "Invalid", Recorder: "Recorder", GSearch: "GSearch", Voice: "Voice", Rag: "Rag", Http: "Http"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool  { return v == Invalid }
func (v Variant) IsRecorder() bool { return v == Recorder }
func (v Variant) IsGSearch() bool  { return v == GSearch }
func (v Variant) IsVoice() bool    { return v == Voice }
func (v Variant) IsRag() bool      { return v == Rag }
func (v Variant) IsHttp() bool     { return v == Http }
func All() []Variant { return []Variant{Recorder, GSearch, Voice, Rag, Http} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7015"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid integration type: "+s,
    )
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
```

---

## 16. buildmodetype.Variant

```go
package buildmodetype
import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")
type Variant byte
const (Invalid Variant = iota; Compact; Bundle; Debug)
var variantLabels = [...]string{Invalid: "Invalid", Compact: "Compact", Bundle: "Bundle", Debug: "Debug"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsCompact() bool { return v == Compact }
func (v Variant) IsBundle() bool  { return v == Bundle }
func (v Variant) IsDebug() bool   { return v == Debug }
func All() []Variant { return []Variant{Compact, Bundle, Debug} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7016"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid build mode: "+s,
    )
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
```

---

## 17. messagetype.Variant

```go
package messagetype
import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")
type Variant byte
const (
    Invalid Variant = iota
    SessionConfigure; PipelineExecute; PipelineCancel; PipelinePause; PipelineResume
    BlockRetry; BlockSkip; InputProvide; Ping
    SessionCreated; SessionConfigured
    ExecutionStarted; ExecutionProgress; ExecutionCompleted; ExecutionFailed; ExecutionCanceled
    BlockStarted; BlockProgress; BlockCompleted; BlockFailed; BlockWaiting
    CheckpointCreated; EscalationRequired; Pong; Error
)

var variantLabels = [...]string{
    Invalid: "Invalid",
    SessionConfigure: "SessionConfigure", PipelineExecute: "PipelineExecute",
    PipelineCancel: "PipelineCancel", PipelinePause: "PipelinePause", PipelineResume: "PipelineResume",
    BlockRetry: "BlockRetry", BlockSkip: "BlockSkip", InputProvide: "InputProvide", Ping: "Ping",
    SessionCreated: "SessionCreated", SessionConfigured: "SessionConfigured",
    ExecutionStarted: "ExecutionStarted", ExecutionProgress: "ExecutionProgress",
    ExecutionCompleted: "ExecutionCompleted", ExecutionFailed: "ExecutionFailed",
    ExecutionCanceled: "ExecutionCanceled",
    BlockStarted: "BlockStarted", BlockProgress: "BlockProgress",
    BlockCompleted: "BlockCompleted", BlockFailed: "BlockFailed", BlockWaiting: "BlockWaiting",
    CheckpointCreated: "CheckpointCreated", EscalationRequired: "EscalationRequired",
    Pong: "Pong", Error: "Error",
}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool            { return v == Invalid }
func (v Variant) IsSessionConfigure() bool   { return v == SessionConfigure }
func (v Variant) IsPipelineExecute() bool    { return v == PipelineExecute }
func (v Variant) IsPipelineCancel() bool     { return v == PipelineCancel }
func (v Variant) IsPipelinePause() bool      { return v == PipelinePause }
func (v Variant) IsPipelineResume() bool     { return v == PipelineResume }
func (v Variant) IsBlockRetry() bool         { return v == BlockRetry }
func (v Variant) IsBlockSkip() bool          { return v == BlockSkip }
func (v Variant) IsInputProvide() bool       { return v == InputProvide }
func (v Variant) IsPing() bool               { return v == Ping }
func (v Variant) IsSessionCreated() bool     { return v == SessionCreated }
func (v Variant) IsSessionConfigured() bool  { return v == SessionConfigured }
func (v Variant) IsExecutionStarted() bool   { return v == ExecutionStarted }
func (v Variant) IsExecutionProgress() bool  { return v == ExecutionProgress }
func (v Variant) IsExecutionCompleted() bool { return v == ExecutionCompleted }
func (v Variant) IsExecutionFailed() bool    { return v == ExecutionFailed }
func (v Variant) IsExecutionCanceled() bool  { return v == ExecutionCanceled }
func (v Variant) IsBlockStarted() bool       { return v == BlockStarted }
func (v Variant) IsBlockProgress() bool      { return v == BlockProgress }
func (v Variant) IsBlockCompleted() bool     { return v == BlockCompleted }
func (v Variant) IsBlockFailed() bool        { return v == BlockFailed }
func (v Variant) IsBlockWaiting() bool       { return v == BlockWaiting }
func (v Variant) IsCheckpointCreated() bool  { return v == CheckpointCreated }
func (v Variant) IsEscalationRequired() bool { return v == EscalationRequired }
func (v Variant) IsPong() bool               { return v == Pong }
func (v Variant) IsError() bool              { return v == Error }

func All() []Variant { return []Variant{SessionConfigure, PipelineExecute, PipelineCancel, PipelinePause, PipelineResume, BlockRetry, BlockSkip, InputProvide, Ping, SessionCreated, SessionConfigured, ExecutionStarted, ExecutionProgress, ExecutionCompleted, ExecutionFailed, ExecutionCanceled, BlockStarted, BlockProgress, BlockCompleted, BlockFailed, BlockWaiting, CheckpointCreated, EscalationRequired, Pong, Error} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7017"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid message type: "+s,
    )
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

func (v Variant) IsClientMessage() bool {
    switch v { case SessionConfigure, PipelineExecute, PipelineCancel, PipelinePause, PipelineResume, BlockRetry, BlockSkip, InputProvide, Ping: return true; default: return false }
}
func (v Variant) IsServerMessage() bool { return v.IsValid() && v.IsServerMessage() }
```

---

## 18. valuetype.Variant

```go
package valuetype
import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")
type Variant byte
const (Invalid Variant = iota; String; Int; Float; Bool; Json; Duration)
var variantLabels = [...]string{Invalid: "Invalid", String: "String", Int: "Int", Float: "Float", Bool: "Bool", Json: "Json", Duration: "Duration"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool  { return v == Invalid }
func (v Variant) IsString() bool   { return v == String }
func (v Variant) IsInt() bool      { return v == Int }
func (v Variant) IsFloat() bool    { return v == Float }
func (v Variant) IsBool() bool     { return v == Bool }
func (v Variant) IsJson() bool     { return v == Json }
func (v Variant) IsDuration() bool { return v == Duration }
func All() []Variant { return []Variant{String, Int, Float, Bool, Json, Duration} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7018"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid value type: "+s,
    )
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
```

---

## 19. pipelinestatustype.Variant

```go
package pipelinestatustype
import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")
type Variant byte
const (Invalid Variant = iota; Active; Archived; Deleted)
var variantLabels = [...]string{Invalid: "Invalid", Active: "Active", Archived: "Archived", Deleted: "Deleted"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool  { return v == Invalid }
func (v Variant) IsActive() bool   { return v == Active }
func (v Variant) IsArchived() bool { return v == Archived }
func (v Variant) IsDeleted() bool  { return v == Deleted }
func All() []Variant { return []Variant{Active, Archived, Deleted} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7019"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid pipeline status: "+s,
    )
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
```

---

## 20. resetscopetype.Variant

```go
package resetscopetype
import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")
type Variant byte
const (Invalid Variant = iota; All; Executions; Pipeline; Checkpoints)
var variantLabels = [...]string{Invalid: "Invalid", All: "All", Executions: "Executions", Pipeline: "Pipeline", Checkpoints: "Checkpoints"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool     { return v == Invalid }
func (v Variant) IsAll() bool         { return v == All }
func (v Variant) IsExecutions() bool  { return v == Executions }
func (v Variant) IsPipeline() bool    { return v == Pipeline }
func (v Variant) IsCheckpoints() bool { return v == Checkpoints }
func All() []Variant { return []Variant{All, Executions, Pipeline, Checkpoints} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7020"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid reset scope: "+s,
    )
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
```

---

## 21. resetstatustype.Variant

```go
package resetstatustype
import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")
type Variant byte
const (Invalid Variant = iota; Pending; Confirmed; Expired; Cancelled)
var variantLabels = [...]string{Invalid: "Invalid", Pending: "Pending", Confirmed: "Confirmed", Expired: "Expired", Cancelled: "Cancelled"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool   { return v == Invalid }
func (v Variant) IsPending() bool   { return v == Pending }
func (v Variant) IsConfirmed() bool { return v == Confirmed }
func (v Variant) IsExpired() bool   { return v == Expired }
func (v Variant) IsCancelled() bool { return v == Cancelled }
func All() []Variant { return []Variant{Pending, Confirmed, Expired, Cancelled} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7021"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid reset status: "+s,
    )
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

func (v Variant) IsTerminal() bool { switch v { case Confirmed, Expired, Cancelled: return true; default: return false } }
```

---

## 22. dbcategorytype.Variant

```go
package dbcategorytype
import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")
type Variant byte
const (Invalid Variant = iota; Pipelines; Meta; Executions; Checkpoints)
var variantLabels = [...]string{Invalid: "Invalid", Pipelines: "Pipelines", Meta: "Meta", Executions: "Executions", Checkpoints: "Checkpoints"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool     { return v == Invalid }
func (v Variant) IsPipelines() bool   { return v == Pipelines }
func (v Variant) IsMeta() bool        { return v == Meta }
func (v Variant) IsExecutions() bool  { return v == Executions }
func (v Variant) IsCheckpoints() bool { return v == Checkpoints }
func All() []Variant { return []Variant{Pipelines, Meta, Executions, Checkpoints} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7022"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid db category: "+s,
    )
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
```

---

## 23. referencetype.Variant

```go
package referencetype
import ("encoding/json"; "strings"; "nexus-flow/pkg/appfault")
type Variant byte
const (Invalid Variant = iota; Input; Output; Dependency)
var variantLabels = [...]string{Invalid: "Invalid", Input: "Input", Output: "Output", Dependency: "Dependency"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool    { return v == Invalid }
func (v Variant) IsInput() bool      { return v == Input }
func (v Variant) IsOutput() bool     { return v == Output }
func (v Variant) IsDependency() bool { return v == Dependency }
func All() []Variant { return []Variant{Input, Output, Dependency} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
const ErrInvalidVariant = "NF7023"
func Parse(s string) appfault.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }

    return Invalid, appfault.New(
        ErrInvalidVariant,
        "invalid reference type: "+s,
    )
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
```

---

## Central Registry

```go
// internal/enums/registry.go
package enums

import (
    "nexus-flow/internal/enums/blocktype"
    "nexus-flow/internal/enums/stagetype"
    "nexus-flow/internal/enums/executionstatustype"
    "nexus-flow/internal/enums/blockstatustype"
    "nexus-flow/internal/enums/logleveltype"
    "nexus-flow/internal/enums/triggertype"
    "nexus-flow/internal/enums/fileoperationtype"
    "nexus-flow/internal/enums/pathtype"
    "nexus-flow/internal/enums/fileformattype"
    "nexus-flow/internal/enums/flowreftype"
    "nexus-flow/internal/enums/variabletype"
    "nexus-flow/internal/enums/variablescopetype"
    "nexus-flow/internal/enums/runtimetype"
    "nexus-flow/internal/enums/outputcapturemodetype"
    "nexus-flow/internal/enums/integrationtype"
    "nexus-flow/internal/enums/buildmodetype"
    "nexus-flow/internal/enums/messagetype"
    "nexus-flow/internal/enums/valuetype"
    "nexus-flow/internal/enums/pipelinestatustype"
    "nexus-flow/internal/enums/resetscopetype"
    "nexus-flow/internal/enums/resetstatustype"
    "nexus-flow/internal/enums/dbcategorytype"
    "nexus-flow/internal/enums/referencetype"
)

type EnumInfo struct {
    Name    string
    Package string
    Count   int
    Values  []string
}

func Registry() []EnumInfo {
    return []EnumInfo{
        {"BlockType", "blocktype", 7, blocktype.Values()},
        {"StageType", "stagetype", 16, stagetype.Values()},
        {"ExecutionStatus", "executionstatustype", 6, executionstatustype.Values()},
        {"BlockStatus", "blockstatustype", 5, blockstatustype.Values()},
        {"LogLevel", "logleveltype", 4, logleveltype.Values()},
        {"TriggerType", "triggertype", 4, triggertype.Values()},
        {"FileOperation", "fileoperationtype", 10, fileoperationtype.Values()},
        {"PathType", "pathtype", 3, pathtype.Values()},
        {"FileFormat", "fileformattype", 7, fileformattype.Values()},
        {"FlowRefType", "flowreftype", 3, flowreftype.Values()},
        {"VariableType", "variabletype", 7, variabletype.Values()},
        {"VariableScope", "variablescopetype", 4, variablescopetype.Values()},
        {"RuntimeType", "runtimetype", 6, runtimetype.Values()},
        {"OutputCaptureMode", "outputcapturemodetype", 4, outputcapturemodetype.Values()},
        {"IntegrationType", "integrationtype", 5, integrationtype.Values()},
        {"BuildMode", "buildmodetype", 3, buildmodetype.Values()},
        {"MessageType", "messagetype", 25, messagetype.Values()},
        {"ValueType", "valuetype", 6, valuetype.Values()},
        {"PipelineStatus", "pipelinestatustype", 3, pipelinestatustype.Values()},
        {"ResetScope", "resetscopetype", 4, resetscopetype.Values()},
        {"ResetStatus", "resetstatustype", 4, resetstatustype.Values()},
        {"DbCategory", "dbcategorytype", 4, dbcategorytype.Values()},
        {"ReferenceType", "referencetype", 3, referencetype.Values()},
    }
}
```

---

## Cross-References

| Resource | Location |
|----------|----------|
| Enum Specification | `02-spec/02-coding-guidelines/03-golang/01-enum-specification/` |
| Flow Architecture | `01-architecture.md` |
| WebSocket Protocol | `07-websocket-protocol.md` |
| Pipeline Engine | `05-pipeline-engine.md` |

---

*Nexus Flow CLI enum architecture - 23 compliant enums, v3.0.0 single variantLabels PascalCase pattern*
