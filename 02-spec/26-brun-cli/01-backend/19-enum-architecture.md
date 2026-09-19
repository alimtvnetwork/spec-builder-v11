# BRun CLI Enum Architecture

**Version:** 4.0.0  
**Standard:** `02-spec/02-coding-guidelines/03-golang/01-enum-specification/ v3.0.0`  
**Status:** Phase 1 Complete  
**Updated:** 2026-03-09

---

## Overview

This document defines all type-safe enums for BRun CLI following the universal enum specification. All enums use the `type Variant byte` pattern with `iota` constants, a single `variantLabels` table with PascalCase values, and implement the 7 mandatory methods.

---

## Directory Structure

```
internal/enums/
├── runtimetype/
│   └── variant.go
├── copymodetype/
│   └── variant.go
├── severitytype/
│   └── variant.go
├── packagemanagertype/
│   └── variant.go
├── modtidymodetype/
│   └── variant.go
├── outputformattype/
│   └── variant.go
├── httpmethodtype/
│   └── variant.go
└── registry.go
```

---

## Enum Definitions

### 1. runtimetype.Variant

Represents build runtime types.

```go
// internal/enums/runtimetype/variant.go
package runtimetype

import (
    "encoding/json"
    "fmt"
    "strings"
)

// Variant represents a build runtime type
type Variant byte

const (
    // Invalid is the zero value (invalid/unset)
    Invalid Variant = iota
    
    // PowerShell is the PowerShell runtime
    PowerShell
    
    // NodeJs is the Node.js runtime
    NodeJs
    
    // Golang is the Go runtime
    Golang
)

var variantLabels = [...]string{
    Invalid:    "Invalid",
    PowerShell: "PowerShell",
    NodeJs:     "NodeJs",
    Golang:     "Golang",
}

func (v Variant) String() string {
    if v.IsInvalid() {
        return variantLabels[Invalid]
    }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool {
    return v > Invalid && v < Variant(len(variantLabels))
}

func (v Variant) IsInvalid() bool    { return v == Invalid }
func (v Variant) IsPowerShell() bool { return v == PowerShell }
func (v Variant) IsNodeJs() bool     { return v == NodeJs }
func (v Variant) IsGolang() bool     { return v == Golang }

func All() []Variant {
    return []Variant{PowerShell, NodeJs, Golang}
}

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) {
        return Invalid
    }
    return Variant(i)
}

func Parse(s string) apperror.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }
    return Invalid, apperror.New(
        ErrEnumParseFailed,
        "invalid runtime",
    ).WithContext("value", s)
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

// Domain-specific methods

// DefaultBuildCommand returns the default build command for this runtime
func (v Variant) DefaultBuildCommand() string {
    switch v {
    case PowerShell:
        return ""
    case NodeJs:
        return "npm run build"
    case Golang:
        return "go build"
    default:
        return ""
    }
}

// SupportsHotReload returns true if runtime supports hot reload
func (v Variant) SupportsHotReload() bool {
    switch v {
    case NodeJs:
        return true
    default:
        return false
    }
}
```

---

### 2. copymodetype.Variant

Represents asset copy operation modes.

```go
// internal/enums/copymodetype/variant.go
package copymodetype

import (
    "encoding/json"
    "fmt"
    "strings"
)

// Variant represents an asset copy mode
type Variant byte

const (
    Invalid Variant = iota
    Copy
    ClearCopy
    Override
    SkipExisting
)

var variantLabels = [...]string{
    Invalid:      "Invalid",
    Copy:         "Copy",
    ClearCopy:    "ClearCopy",
    Override:     "Override",
    SkipExisting: "SkipExisting",
}

func (v Variant) String() string {
    if v.IsInvalid() {
        return variantLabels[Invalid]
    }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool {
    return v > Invalid && v < Variant(len(variantLabels))
}

func (v Variant) IsInvalid() bool      { return v == Invalid }
func (v Variant) IsCopy() bool         { return v == Copy }
func (v Variant) IsClearCopy() bool    { return v == ClearCopy }
func (v Variant) IsOverride() bool     { return v == Override }
func (v Variant) IsSkipExisting() bool { return v == SkipExisting }

func All() []Variant {
    return []Variant{Copy, ClearCopy, Override, SkipExisting}
}

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) {
        return Invalid
    }
    return Variant(i)
}

func Parse(s string) apperror.Result[Variant] {
    normalized := strings.TrimSpace(s)
    for i, label := range variantLabels {
        if strings.EqualFold(label, normalized) {
            return Variant(i), nil
        }
    }
    return Invalid, apperror.New(
        ErrEnumParseFailed,
        "invalid copy mode",
    ).WithContext("value", s)
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

// Domain-specific methods

func (v Variant) ClearsDestination() bool {
    return v == ClearCopy
}

func (v Variant) PreservesExisting() bool {
    return v == SkipExisting
}
```

---

### 3. severitytype.Variant

```go
package severitytype

import ("encoding/json"; "fmt"; "strings")

type Variant byte

const (
    Invalid Variant = iota
    Error
    Warning
    Info
)

var variantLabels = [...]string{
    Invalid: "Invalid",
    Error:   "Error",
    Warning: "Warning",
    Info:    "Info",
}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsError() bool   { return v == Error }
func (v Variant) IsWarning() bool { return v == Warning }
func (v Variant) IsInfo() bool    { return v == Info }

func All() []Variant { return []Variant{Error, Warning, Info} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) (Variant, error) { normalized := strings.TrimSpace(s); for i, label := range variantLabels { if strings.EqualFold(label, normalized) { return Variant(i), nil } }; return Invalid, apperror.New(ErrEnumParseFailed, "invalid severity").WithContext("value", s) }
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

func (v Variant) ShouldFailBuild() bool { return v == Error }
func (v Variant) Priority() int {
    switch v {
    case Error: return 3
    case Warning: return 2
    case Info: return 1
    default: return 0
    }
}
```

---

### 4. packagemanagertype.Variant

```go
package packagemanagertype

import ("encoding/json"; "fmt"; "strings")

type Variant byte

const (
    Invalid Variant = iota
    Npm
    Yarn
    Bun
)

var variantLabels = [...]string{
    Invalid: "Invalid",
    Npm:     "Npm",
    Yarn:    "Yarn",
    Bun:     "Bun",
}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsNpm() bool     { return v == Npm }
func (v Variant) IsYarn() bool    { return v == Yarn }
func (v Variant) IsBun() bool     { return v == Bun }

func All() []Variant { return []Variant{Npm, Yarn, Bun} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) (Variant, error) { normalized := strings.TrimSpace(s); for i, label := range variantLabels { if strings.EqualFold(label, normalized) { return Variant(i), nil } }; return Invalid, apperror.New(ErrEnumParseFailed, "invalid package manager").WithContext("value", s) }
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

func (v Variant) InstallCommand() string {
    switch v {
    case Npm: return "npm install"
    case Yarn: return "yarn install"
    case Bun: return "bun install"
    default: return ""
    }
}

func (v Variant) RunCommand(script string) string {
    switch v {
    case Npm: return fmt.Sprintf("npm run %s", script)
    case Yarn: return fmt.Sprintf("yarn %s", script)
    case Bun: return fmt.Sprintf("bun run %s", script)
    default: return ""
    }
}

func (v Variant) LockFileName() string {
    switch v {
    case Npm: return "package-lock.json"
    case Yarn: return "yarn.lock"
    case Bun: return "bun.lockb"
    default: return ""
    }
}
```

---

### 5. modtidymodetype.Variant

```go
package modtidymodetype

import ("encoding/json"; "fmt"; "strings")

type Variant byte

const (
    Invalid Variant = iota
    Skip
    Run
    Force
)

var variantLabels = [...]string{
    Invalid: "Invalid",
    Skip:    "Skip",
    Run:     "Run",
    Force:   "Force",
}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsSkip() bool    { return v == Skip }
func (v Variant) IsRun() bool     { return v == Run }
func (v Variant) IsForce() bool   { return v == Force }

func All() []Variant { return []Variant{Skip, Run, Force} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) (Variant, error) { normalized := strings.TrimSpace(s); for i, label := range variantLabels { if strings.EqualFold(label, normalized) { return Variant(i), nil } }; return Invalid, apperror.New(ErrEnumParseFailed, "invalid mod tidy mode").WithContext("value", s) }
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

func (v Variant) ShouldRun() bool { return v == Run || v == Force }
func (v Variant) IsForced() bool  { return v == Force }
```

---

### 6. outputformattype.Variant

```go
package outputformattype

import ("encoding/json"; "fmt"; "strings")

type Variant byte

const (
    Invalid Variant = iota
    Text
    Json
)

var variantLabels = [...]string{
    Invalid: "Invalid",
    Text:    "Text",
    Json:    "Json",
}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsText() bool    { return v == Text }
func (v Variant) IsJson() bool    { return v == Json }

func All() []Variant { return []Variant{Text, Json} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) (Variant, error) { normalized := strings.TrimSpace(s); for i, label := range variantLabels { if strings.EqualFold(label, normalized) { return Variant(i), nil } }; return Invalid, apperror.New(ErrEnumParseFailed, "invalid output format").WithContext("value", s) }
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

// content_type is a protocol-driven value — exempt from PascalCase
func (v Variant) ContentType() string {
    switch v {
    case Json: return "application/json"
    case Text: return "text/plain"
    default: return "text/plain"
    }
}

func (v Variant) FileExtension() string {
    switch v {
    case Json: return ".json"
    case Text: return ".txt"
    default: return ".txt"
    }
}
```

---

### 7. httpmethodtype.Variant

```go
package httpmethodtype

import ("encoding/json"; "fmt"; "strings")

type Variant byte

const (
    Invalid Variant = iota
    Get
    Head
)

var variantLabels = [...]string{
    Invalid: "Invalid",
    Get:     "Get",
    Head:    "Head",
}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsGet() bool     { return v == Get }
func (v Variant) IsHead() bool    { return v == Head }

func All() []Variant { return []Variant{Get, Head} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) (Variant, error) { normalized := strings.TrimSpace(s); for i, label := range variantLabels { if strings.EqualFold(label, normalized) { return Variant(i), nil } }; return Invalid, apperror.New(ErrEnumParseFailed, "invalid http method").WithContext("value", s) }
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

func (v Variant) HasBody() bool { return false }
func (v Variant) ExpectsResponseBody() bool { return v == Get }
```

---

## Central Registry

```go
// internal/enums/registry.go
package enums

import (
    "github.com/user/brun-cli/internal/enums/copymodetype"
    "github.com/user/brun-cli/internal/enums/httpmethodtype"
    "github.com/user/brun-cli/internal/enums/modtidymodetype"
    "github.com/user/brun-cli/internal/enums/outputformattype"
    "github.com/user/brun-cli/internal/enums/packagemanagertype"
    "github.com/user/brun-cli/internal/enums/runtimetype"
    "github.com/user/brun-cli/internal/enums/severitytype"
)

// Registry provides centralized access to all enum types
type Registry struct{}

func (r Registry) Runtimes() []runtimetype.Variant { return runtimetype.All() }
func (r Registry) CopyModes() []copymodetype.Variant { return copymodetype.All() }
func (r Registry) Severities() []severitytype.Variant { return severitytype.All() }
func (r Registry) PackageManagers() []packagemanagertype.Variant { return packagemanagertype.All() }
func (r Registry) ModTidyModes() []modtidymodetype.Variant { return modtidymodetype.All() }
func (r Registry) OutputFormats() []outputformattype.Variant { return outputformattype.All() }
func (r Registry) HttpMethods() []httpmethodtype.Variant { return httpmethodtype.All() }
```

---

## Cross-References

| Resource | Location |
|----------|----------|
| Enum Specification | `02-spec/02-coding-guidelines/03-golang/01-enum-specification/` |
| BRun Configuration | `02-spec/26-brun-cli/01-backend/03-configuration.md` |
| BRun Data Models | `02-spec/26-brun-cli/01-backend/10-data-models.md` |
| BRun Asset Operations | `02-spec/26-brun-cli/01-backend/08-asset-operations.md` |
| BRun Runtime Executors | `02-spec/26-brun-cli/01-backend/04-runtime-executors.md` |

---

*BRun CLI enum architecture specification v3.0.0 — single variantLabels PascalCase pattern*
