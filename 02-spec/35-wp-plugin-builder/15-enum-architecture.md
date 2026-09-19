# Enum Architecture

**Version:** 4.0.0  
**Status:** Active  
**Created:** 2026-03-09  
**Updated:** 2026-03-09  
**Standard:** `02-spec/02-coding-guidelines/03-golang/01-enum-specification/ v3.0.0`

> **⚠️ Migration (v3.0.0):** All enums use the single-table PascalCase `variantLabels` pattern with `type` suffix package names (no underscores). `Label()` delegates to `String()`, and `Parse()` uses `strings.EqualFold()`. See [`02-spec/02-coding-guidelines/03-golang/01-enum-specification/`](../02-coding-guidelines/03-golang/01-enum-specification/).

---

## Overview

This document defines all type-safe enums for the WP Plugin Builder CLI following the universal `type Variant byte` pattern. All enums reside in `internal/enums/{name}type/variant.go`.

**Cross-References:**
- [Enum Specification](../02-coding-guidelines/03-golang/01-enum-specification/00-overview.md)
- [Core Architecture](./01-core-architecture.md)
- [Configuration](./03-configuration.md)
- [Database Schema](./04-database-schema.md)
- [Code Generation](./07-code-generation.md)

---

## Enum Registry (14 Enums)

| Enum | Package | Values | Source |
|------|---------|--------|--------|
| `commandtype.Variant` | `internal/enums/commandtype/` | ProjectCreate, ProjectOpen, Generate, PresetImport, PresetList, SpecImport, Query, Version | `01-core-architecture.md` |
| `overwritemodetype.Variant` | `internal/enums/overwritemodetype/` | Skip, Overwrite, Backup | `03-configuration.md`, `07-code-generation.md` |
| `indentstyletype.Variant` | `internal/enums/indentstyletype/` | Tabs, Spaces | `03-configuration.md` |
| `lineendingtype.Variant` | `internal/enums/lineendingtype/` | Lf, Crlf | `03-configuration.md` |
| `logleveltype.Variant` | `internal/enums/logleveltype/` | Debug, Info, Warn, Error | `03-configuration.md` |
| `logformattype.Variant` | `internal/enums/logformattype/` | Text, Json | `03-configuration.md` |
| `presetcategorytype.Variant` | `internal/enums/presetcategorytype/` | Core, Admin, Api, Shortcode, Block, General | `04-database-schema.md` |
| `filetype.Variant` | `internal/enums/filetype/` | Php, Css, Js, Json, Md, Txt | `04-database-schema.md` |
| `ragsourcetype.Variant` | `internal/enums/ragsourcetype/` | File, Spec, Preset, Generated | `04-database-schema.md` |
| `specformattype.Variant` | `internal/enums/specformattype/` | Markdown, Json, Yaml | `04-database-schema.md` |
| `generationstatustype.Variant` | `internal/enums/generationstatustype/` | Running, Success, Failed, Cancelled | `04-database-schema.md` |
| `fileactiontype.Variant` | `internal/enums/fileactiontype/` | Created, Updated, Skipped, Backup | `04-database-schema.md`, `07-code-generation.md` |
| `dbtype.Variant` | `internal/enums/dbtype/` | Root, Project | `04-database-schema.md` |
| `componenttype.Variant` | `internal/enums/componenttype/` | Core, Admin, Public, Api, Shortcode, Block, Widget, Cpt, Taxonomy, Settings | `07-code-generation.md` |

---

## Central Registry

```go
// internal/enums/registry.go
package enums

import (
    "wp-plugin-builder/internal/enums/commandtype"
    "wp-plugin-builder/internal/enums/overwritemodetype"
    "wp-plugin-builder/internal/enums/indentstyletype"
    "wp-plugin-builder/internal/enums/lineendingtype"
    "wp-plugin-builder/internal/enums/logleveltype"
    "wp-plugin-builder/internal/enums/logformattype"
    "wp-plugin-builder/internal/enums/presetcategorytype"
    "wp-plugin-builder/internal/enums/filetype"
    "wp-plugin-builder/internal/enums/ragsourcetype"
    "wp-plugin-builder/internal/enums/specformattype"
    "wp-plugin-builder/internal/enums/generationstatustype"
    "wp-plugin-builder/internal/enums/fileactiontype"
    "wp-plugin-builder/internal/enums/dbtype"
    "wp-plugin-builder/internal/enums/componenttype"
)

type Registry struct {
    Enums []EnumMeta
}

type EnumMeta struct {
    Name   string
    Values []string
}

func NewRegistry() *Registry {
    return &Registry{
        Enums: []EnumMeta{
            {Name: "commandtype", Values: commandtype.Values()},
            {Name: "overwritemodetype", Values: overwritemodetype.Values()},
            {Name: "indentstyletype", Values: indentstyletype.Values()},
            {Name: "lineendingtype", Values: lineendingtype.Values()},
            {Name: "logleveltype", Values: logleveltype.Values()},
            {Name: "logformattype", Values: logformattype.Values()},
            {Name: "presetcategorytype", Values: presetcategorytype.Values()},
            {Name: "filetype", Values: filetype.Values()},
            {Name: "ragsourcetype", Values: ragsourcetype.Values()},
            {Name: "specformattype", Values: specformattype.Values()},
            {Name: "generationstatustype", Values: generationstatustype.Values()},
            {Name: "fileactiontype", Values: fileactiontype.Values()},
            {Name: "dbtype", Values: dbtype.Values()},
            {Name: "componenttype", Values: componenttype.Values()},
        },
    }
}
```

---

## 1. commandtype.Variant

```go
package commandtype

import (
    "encoding/json"
    "fmt"
    "strings"
)

type Variant byte

const (
    Invalid       Variant = iota
    ProjectCreate
    ProjectOpen
    Generate
    PresetImport
    PresetList
    SpecImport
    Query
    Version
)

var variantLabels = [...]string{
    Invalid:       "Invalid",
    ProjectCreate: "ProjectCreate",
    ProjectOpen:   "ProjectOpen",
    Generate:      "Generate",
    PresetImport:  "PresetImport",
    PresetList:    "PresetList",
    SpecImport:    "SpecImport",
    Query:         "Query",
    Version:       "Version",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool       { return v == Invalid }
func (v Variant) IsProjectCreate() bool { return v == ProjectCreate }
func (v Variant) IsProjectOpen() bool   { return v == ProjectOpen }
func (v Variant) IsGenerate() bool      { return v == Generate }
func (v Variant) IsPresetImport() bool  { return v == PresetImport }
func (v Variant) IsPresetList() bool    { return v == PresetList }
func (v Variant) IsSpecImport() bool    { return v == SpecImport }
func (v Variant) IsQuery() bool         { return v == Query }
func (v Variant) IsVersion() bool       { return v == Version }

func All() []Variant {
    return []Variant{ProjectCreate, ProjectOpen, Generate, PresetImport, PresetList, SpecImport, Query, Version}
}
func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}
func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrEnumParseFailed,
        "invalid command type",
    ).WithContext("value", s))
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

// RequiresProject returns true if command needs an active project
func (v Variant) RequiresProject() bool {
    switch v {
    case Generate, SpecImport, Query: return true
    default: return false
    }
}
```

---

## 2. overwritemodetype.Variant

```go
package overwritemodetype

import (
    "encoding/json"
    "fmt"
    "strings"
)

type Variant byte

const (
    Invalid   Variant = iota
    Skip
    Overwrite
    Backup
)

var variantLabels = [...]string{
    Invalid:   "Invalid",
    Skip:      "Skip",
    Overwrite: "Overwrite",
    Backup:    "Backup",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool   { return v == Invalid }
func (v Variant) IsSkip() bool      { return v == Skip }
func (v Variant) IsOverwrite() bool { return v == Overwrite }
func (v Variant) IsBackup() bool    { return v == Backup }

func All() []Variant { return []Variant{Skip, Overwrite, Backup} }
func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}
func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrEnumParseFailed,
        "invalid overwrite mode",
    ).WithContext("value", s))
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

## 3. indentstyletype.Variant

```go
package indentstyletype

import ("encoding/json"; "fmt"; "strings")

type Variant byte

const (Invalid Variant = iota; Tabs; Spaces)

var variantLabels = [...]string{Invalid: "Invalid", Tabs: "Tabs", Spaces: "Spaces"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsTabs() bool    { return v == Tabs }
func (v Variant) IsSpaces() bool  { return v == Spaces }

func All() []Variant { return []Variant{Tabs, Spaces} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrEnumParseFailed,
        "invalid indent style",
    ).WithContext("value", s))
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

## 4. lineendingtype.Variant

```go
package lineendingtype

import ("encoding/json"; "fmt"; "strings")

type Variant byte

const (Invalid Variant = iota; Lf; Crlf)

var variantLabels = [...]string{Invalid: "Invalid", Lf: "Lf", Crlf: "Crlf"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsLf() bool      { return v == Lf }
func (v Variant) IsCrlf() bool    { return v == Crlf }

func All() []Variant { return []Variant{Lf, Crlf} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrEnumParseFailed,
        "invalid line ending",
    ).WithContext("value", s))
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

// Char returns the actual line ending characters
func (v Variant) Char() string {
    switch v {
    case Lf:   return "\n"
    case Crlf: return "\r\n"
    default:   return "\n"
    }
}
```

---

## 5. logleveltype.Variant

```go
package logleveltype

import ("encoding/json"; "fmt"; "strings")

type Variant byte

const (Invalid Variant = iota; Debug; Info; Warn; Error)

var variantLabels = [...]string{Invalid: "Invalid", Debug: "Debug", Info: "Info", Warn: "Warn", Error: "Error"}

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
func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrEnumParseFailed,
        "invalid log level",
    ).WithContext("value", s))
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

## 6. logformattype.Variant

```go
package logformattype

import ("encoding/json"; "fmt"; "strings")

type Variant byte

const (Invalid Variant = iota; Text; Json)

var variantLabels = [...]string{Invalid: "Invalid", Text: "Text", Json: "Json"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsText() bool    { return v == Text }
func (v Variant) IsJson() bool    { return v == Json }

func All() []Variant { return []Variant{Text, Json} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrEnumParseFailed,
        "invalid log format",
    ).WithContext("value", s))
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

## 7. presetcategorytype.Variant

```go
package presetcategorytype

import ("encoding/json"; "fmt"; "strings")

type Variant byte

const (
    Invalid   Variant = iota
    Core
    Admin
    Api
    Shortcode
    Block
    General
)

var variantLabels = [...]string{
    Invalid: "Invalid", Core: "Core", Admin: "Admin",
    Api: "Api", Shortcode: "Shortcode", Block: "Block", General: "General",
}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool   { return v == Invalid }
func (v Variant) IsCore() bool      { return v == Core }
func (v Variant) IsAdmin() bool     { return v == Admin }
func (v Variant) IsApi() bool       { return v == Api }
func (v Variant) IsShortcode() bool { return v == Shortcode }
func (v Variant) IsBlock() bool     { return v == Block }
func (v Variant) IsGeneral() bool   { return v == General }

func All() []Variant { return []Variant{Core, Admin, Api, Shortcode, Block, General} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrEnumParseFailed,
        "invalid preset category",
    ).WithContext("value", s))
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

// DefaultPriority returns loading priority (lower = earlier)
func (v Variant) DefaultPriority() int {
    switch v {
    case Core: return 1
    case Admin: return 2
    case Api: return 3
    case Shortcode: return 4
    case Block: return 5
    case General: return 10
    default: return 99
    }
}
```

---

## 8. filetype.Variant

```go
package filetype

import ("encoding/json"; "fmt"; "strings")

type Variant byte

const (
    Invalid Variant = iota
    Php; Css; Js; Json; Md; Txt
)

var variantLabels = [...]string{
    Invalid: "Invalid", Php: "Php", Css: "Css",
    Js: "Js", Json: "Json", Md: "Md", Txt: "Txt",
}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsPhp() bool     { return v == Php }
func (v Variant) IsCss() bool     { return v == Css }
func (v Variant) IsJs() bool      { return v == Js }
func (v Variant) IsJson() bool    { return v == Json }
func (v Variant) IsMd() bool      { return v == Md }
func (v Variant) IsTxt() bool     { return v == Txt }

func All() []Variant { return []Variant{Php, Css, Js, Json, Md, Txt} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrEnumParseFailed,
        "invalid file type",
    ).WithContext("value", s))
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

// Extension returns the file extension with dot
func (v Variant) Extension() string {
    if v.IsInvalid() { return "" }
    return "." + strings.ToLower(v.String())
}
```

---

## 9. ragsourcetype.Variant

```go
package ragsourcetype

import ("encoding/json"; "fmt"; "strings")

type Variant byte

const (Invalid Variant = iota; File; Spec; Preset; Generated)

var variantLabels = [...]string{Invalid: "Invalid", File: "File", Spec: "Spec", Preset: "Preset", Generated: "Generated"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool   { return v == Invalid }
func (v Variant) IsFile() bool      { return v == File }
func (v Variant) IsSpec() bool      { return v == Spec }
func (v Variant) IsPreset() bool    { return v == Preset }
func (v Variant) IsGenerated() bool { return v == Generated }

func All() []Variant { return []Variant{File, Spec, Preset, Generated} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrEnumParseFailed,
        "invalid rag source type",
    ).WithContext("value", s))
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

## 10. specformattype.Variant

```go
package specformattype

import ("encoding/json"; "fmt"; "strings")

type Variant byte

const (Invalid Variant = iota; Markdown; Json; Yaml)

var variantLabels = [...]string{Invalid: "Invalid", Markdown: "Markdown", Json: "Json", Yaml: "Yaml"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool  { return v == Invalid }
func (v Variant) IsMarkdown() bool { return v == Markdown }
func (v Variant) IsJson() bool     { return v == Json }
func (v Variant) IsYaml() bool     { return v == Yaml }
func All() []Variant { return []Variant{Markdown, Json, Yaml} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrEnumParseFailed,
        "invalid spec format",
    ).WithContext("value", s))
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

## 11. generationstatustype.Variant

```go
package generationstatustype

import ("encoding/json"; "fmt"; "strings")

type Variant byte

const (Invalid Variant = iota; Running; Success; Failed; Cancelled)

var variantLabels = [...]string{Invalid: "Invalid", Running: "Running", Success: "Success", Failed: "Failed", Cancelled: "Cancelled"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool   { return v == Invalid }
func (v Variant) IsRunning() bool   { return v == Running }
func (v Variant) IsSuccess() bool   { return v == Success }
func (v Variant) IsFailed() bool    { return v == Failed }
func (v Variant) IsCancelled() bool { return v == Cancelled }
func All() []Variant { return []Variant{Running, Success, Failed, Cancelled} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrEnumParseFailed,
        "invalid generation status",
    ).WithContext("value", s))
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

// IsTerminal returns true if status is a final state
func (v Variant) IsTerminal() bool {
    switch v {
    case Success, Failed, Cancelled: return true
    default: return false
    }
}
```

---

## 12. fileactiontype.Variant

```go
package fileactiontype

import ("encoding/json"; "fmt"; "strings")

type Variant byte

const (Invalid Variant = iota; Created; Updated; Skipped; Backup)

var variantLabels = [...]string{Invalid: "Invalid", Created: "Created", Updated: "Updated", Skipped: "Skipped", Backup: "Backup"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsCreated() bool { return v == Created }
func (v Variant) IsUpdated() bool { return v == Updated }
func (v Variant) IsSkipped() bool { return v == Skipped }
func (v Variant) IsBackup() bool  { return v == Backup }
func All() []Variant { return []Variant{Created, Updated, Skipped, Backup} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrEnumParseFailed,
        "invalid file action",
    ).WithContext("value", s))
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

## 13. dbtype.Variant

```go
package dbtype

import ("encoding/json"; "fmt"; "strings")

type Variant byte

const (Invalid Variant = iota; Root; Project)

var variantLabels = [...]string{Invalid: "Invalid", Root: "Root", Project: "Project"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsRoot() bool    { return v == Root }
func (v Variant) IsProject() bool { return v == Project }
func All() []Variant { return []Variant{Root, Project} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrEnumParseFailed,
        "invalid db type",
    ).WithContext("value", s))
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

## 14. componenttype.Variant

```go
package componenttype

import ("encoding/json"; "fmt"; "strings")

type Variant byte

const (
    Invalid  Variant = iota
    Core
    Admin
    Public
    Api
    Shortcode
    Block
    Widget
    Cpt
    Taxonomy
    Settings
)

var variantLabels = [...]string{
    Invalid: "Invalid", Core: "Core", Admin: "Admin", Public: "Public",
    Api: "Api", Shortcode: "Shortcode", Block: "Block", Widget: "Widget",
    Cpt: "Cpt", Taxonomy: "Taxonomy", Settings: "Settings",
}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool   { return v == Invalid }
func (v Variant) IsCore() bool      { return v == Core }
func (v Variant) IsAdmin() bool     { return v == Admin }
func (v Variant) IsPublic() bool    { return v == Public }
func (v Variant) IsApi() bool       { return v == Api }
func (v Variant) IsShortcode() bool { return v == Shortcode }
func (v Variant) IsBlock() bool     { return v == Block }
func (v Variant) IsWidget() bool    { return v == Widget }
func (v Variant) IsCpt() bool       { return v == Cpt }
func (v Variant) IsTaxonomy() bool  { return v == Taxonomy }
func (v Variant) IsSettings() bool  { return v == Settings }

func All() []Variant {
    return []Variant{Core, Admin, Public, Api, Shortcode, Block, Widget, Cpt, Taxonomy, Settings}
}
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrEnumParseFailed,
        "invalid component type",
    ).WithContext("value", s))
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

// OutputPattern returns the file path pattern for this component type
func (v Variant) OutputPattern(name string) string {
    switch v {
    case Core:      return fmt.Sprintf("includes/class-%s.php", name)
    case Admin:     return fmt.Sprintf("admin/class-%s-admin.php", name)
    case Public:    return fmt.Sprintf("public/class-%s-public.php", name)
    case Api:       return fmt.Sprintf("includes/class-%s-api.php", name)
    case Shortcode: return fmt.Sprintf("includes/class-%s-shortcode.php", name)
    case Block:     return fmt.Sprintf("blocks/%s/", name)
    case Widget:    return fmt.Sprintf("includes/class-%s-widget.php", name)
    case Cpt:       return fmt.Sprintf("includes/class-%s-cpt.php", name)
    case Taxonomy:  return fmt.Sprintf("includes/class-%s-taxonomy.php", name)
    case Settings:  return fmt.Sprintf("admin/class-%s-settings.php", name)
    default:        return ""
    }
}
```

---

*WP Plugin Builder CLI enum architecture v3.0.0 — 14 compliant enums following 02-spec/02-coding-guidelines/03-golang/01-enum-specification/.*
