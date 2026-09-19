# Enum Architecture

**Version:** 3.0.0  
**Status:** Active  
**Created:** 2026-03-09  
**Updated:** 2026-03-09  
**Standard:** `02-spec/02-coding-guidelines/03-golang/01-enum-specification/ v3.0.0`

---

## Overview

This document defines all type-safe enums for the Spec Reverse CLI following the universal `type Variant byte` pattern. All enums reside in `internal/enums/{category}type/variant.go`.

**Cross-References:**
- [Enum Specification](../../02-coding-guidelines/03-golang/01-enum-specification/00-overview.md)
- [Architecture](./01-architecture.md)
- [Code Analysis](./02-code-analysis.md)
- [AI Bridge Integration](./03-ai-bridge-integration.md)

---

## Enum Registry (10 Enums)

| Enum | Package | Values | Source |
|------|---------|--------|--------|
| `languagetype.Variant` | `internal/enums/languagetype/` | Go, TypeScript, JavaScript, Python, Rust, Java | `02-code-analysis.md` |
| `frameworktype.Variant` | `internal/enums/frameworktype/` | React, Vue, Angular, Gin, Echo, FastAPI, Express | `02-code-analysis.md` |
| `patterntype.Variant` | `internal/enums/patterntype/` | Mvc, Layered, Hexagonal, Microservice, Monolith | `02-code-analysis.md` |
| `symboltype.Variant` | `internal/enums/symboltype/` | Entity, Service, Handler, Repository, Utility, Constant | `01-architecture.md` |
| `severitytype.Variant` | `internal/enums/severitytype/` | Error, Warning, Info | `01-architecture.md` |
| `spectype.Variant` | `internal/enums/spectype/` | Overview, DataModels, Api, Architecture, Features | `01-architecture.md`, `03-ai-bridge-integration.md` |
| `outputformattype.Variant` | `internal/enums/outputformattype/` | Simple, Complex | `01-architecture.md` |
| `knowledgecategorytype.Variant` | `internal/enums/knowledgecategorytype/` | SplitDb, SeedableConfig, ErrorCodes, GeneralSpec, CliPatterns | `03-ai-bridge-integration.md` |
| `analysisdepthtype.Variant` | `internal/enums/analysisdepthtype/` | Shallow, Normal, Deep | config |
| `logleveltype.Variant` | `internal/enums/logleveltype/` | Debug, Info, Warn, Error | config |

---

## Central Registry

```go
// internal/enums/registry.go
package enums

import (
    "spec-reverse-cli/internal/enums/languagetype"
    "spec-reverse-cli/internal/enums/frameworktype"
    "spec-reverse-cli/internal/enums/patterntype"
    "spec-reverse-cli/internal/enums/symboltype"
    "spec-reverse-cli/internal/enums/severitytype"
    "spec-reverse-cli/internal/enums/spectype"
    "spec-reverse-cli/internal/enums/outputformattype"
    "spec-reverse-cli/internal/enums/knowledgecategorytype"
    "spec-reverse-cli/internal/enums/analysisdepthtype"
    "spec-reverse-cli/internal/enums/logleveltype"
)

// Registry provides access to all enum metadata for reflection and validation.
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
            {Name: "language", Values: languagetype.Values()},
            {Name: "framework", Values: frameworktype.Values()},
            {Name: "pattern", Values: patterntype.Values()},
            {Name: "symbol", Values: symboltype.Values()},
            {Name: "severity", Values: severitytype.Values()},
            {Name: "02-spec", Values: spectype.Values()},
            {Name: "outputformat", Values: outputformattype.Values()},
            {Name: "knowledgecategory", Values: knowledgecategorytype.Values()},
            {Name: "analysisdepth", Values: analysisdepthtype.Values()},
            {Name: "loglevel", Values: logleveltype.Values()},
        },
    }
}
```

---

## 1. languagetype.Variant

```go
// internal/enums/languagetype/variant.go
package languagetype

import (
    "encoding/json"
    "fmt"
    "strings"
)

// Variant represents a programming language
type Variant byte

const (
    Invalid    Variant = iota
    Go
    TypeScript
    JavaScript
    Python
    Rust
    Java
)

var variantLabels = [...]string{
    Invalid:    "Invalid",
    Go:         "Go",
    TypeScript: "TypeScript",
    JavaScript: "JavaScript",
    Python:     "Python",
    Rust:       "Rust",
    Java:       "Java",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool    { return v == Invalid }
func (v Variant) IsGo() bool         { return v == Go }
func (v Variant) IsTypeScript() bool { return v == TypeScript }
func (v Variant) IsJavaScript() bool { return v == JavaScript }
func (v Variant) IsPython() bool     { return v == Python }
func (v Variant) IsRust() bool       { return v == Rust }
func (v Variant) IsJava() bool       { return v == Java }

func All() []Variant { return []Variant{Go, TypeScript, JavaScript, Python, Rust, Java} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}

func Parse(s string) apperror.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) { return Variant(i), nil }
    }
    return Invalid, apperror.New(
        ErrEnumParseFailed,
        "invalid language",
    ).WithContext("value", s)
}

func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] { result = append(result, s) }
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

// FileExtension returns the primary file extension
func (v Variant) FileExtension() string {
    switch v {
    case Go:         return ".go"
    case TypeScript: return ".ts"
    case JavaScript: return ".js"
    case Python:     return ".py"
    case Rust:       return ".rs"
    case Java:       return ".java"
    default:         return ""
    }
}

// SupportsAST returns true if AST parsing is available
func (v Variant) SupportsAST() bool {
    switch v {
    case Go, TypeScript, JavaScript, Python: return true
    default: return false
    }
}
```

---

## 2. frameworktype.Variant

```go
// internal/enums/frameworktype/variant.go
package frameworktype

import (
    "encoding/json"
    "fmt"
    "strings"
)

type Variant byte

const (
    Invalid Variant = iota
    React
    Vue
    Angular
    Gin
    Echo
    FastAPI
    Express
    None
)

var variantLabels = [...]string{
    Invalid: "Invalid",
    React:   "React",
    Vue:     "Vue",
    Angular: "Angular",
    Gin:     "Gin",
    Echo:    "Echo",
    FastAPI: "FastAPI",
    Express: "Express",
    None:    "None",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsReact() bool   { return v == React }
func (v Variant) IsVue() bool     { return v == Vue }
func (v Variant) IsAngular() bool { return v == Angular }
func (v Variant) IsGin() bool     { return v == Gin }
func (v Variant) IsEcho() bool    { return v == Echo }
func (v Variant) IsFastApi() bool { return v == FastAPI }
func (v Variant) IsExpress() bool { return v == Express }
func (v Variant) IsNone() bool    { return v == None }

func All() []Variant { return []Variant{React, Vue, Angular, Gin, Echo, FastAPI, Express, None} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}

func Parse(s string) apperror.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) { return Variant(i), nil }
    }
    return Invalid, apperror.New(
        ErrEnumParseFailed,
        "invalid framework",
    ).WithContext("value", s)
}

func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] { result = append(result, s) }
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

// IsFrontend returns true if the framework is frontend-focused
func (v Variant) IsFrontend() bool {
    switch v {
    case React, Vue, Angular: return true
    default: return false
    }
}
```

---

## 3. patterntype.Variant

```go
// internal/enums/patterntype/variant.go
package patterntype

import (
    "encoding/json"
    "fmt"
    "strings"
)

type Variant byte

const (
    Invalid      Variant = iota
    Mvc
    Layered
    Hexagonal
    Microservice
    Monolith
)

var variantLabels = [...]string{
    Invalid:      "Invalid",
    Mvc:          "Mvc",
    Layered:      "Layered",
    Hexagonal:    "Hexagonal",
    Microservice: "Microservice",
    Monolith:     "Monolith",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool      { return v == Invalid }
func (v Variant) IsMvc() bool          { return v == Mvc }
func (v Variant) IsLayered() bool      { return v == Layered }
func (v Variant) IsHexagonal() bool    { return v == Hexagonal }
func (v Variant) IsMicroservice() bool { return v == Microservice }
func (v Variant) IsMonolith() bool     { return v == Monolith }

func All() []Variant { return []Variant{Mvc, Layered, Hexagonal, Microservice, Monolith} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}

func Parse(s string) apperror.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) { return Variant(i), nil }
    }
    return Invalid, apperror.New(
        ErrEnumParseFailed,
        "invalid pattern type",
    ).WithContext("value", s)
}

func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] { result = append(result, s) }
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

## 4. symboltype.Variant

```go
// internal/enums/symboltype/variant.go
package symboltype

import (
    "encoding/json"
    "fmt"
    "strings"
)

type Variant byte

const (
    Invalid    Variant = iota
    Entity
    Service
    Handler
    Repository
    Utility
    Constant
)

var variantLabels = [...]string{
    Invalid:    "Invalid",
    Entity:     "Entity",
    Service:    "Service",
    Handler:    "Handler",
    Repository: "Repository",
    Utility:    "Utility",
    Constant:   "Constant",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool    { return v == Invalid }
func (v Variant) IsEntity() bool     { return v == Entity }
func (v Variant) IsService() bool    { return v == Service }
func (v Variant) IsHandler() bool    { return v == Handler }
func (v Variant) IsRepository() bool { return v == Repository }
func (v Variant) IsUtility() bool    { return v == Utility }
func (v Variant) IsConstant() bool   { return v == Constant }

func All() []Variant { return []Variant{Entity, Service, Handler, Repository, Utility, Constant} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}

func Parse(s string) apperror.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) { return Variant(i), nil }
    }
    return Invalid, apperror.New(
        ErrEnumParseFailed,
        "invalid symbol type",
    ).WithContext("value", s)
}

func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] { result = append(result, s) }
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

## 5. severitytype.Variant

```go
// internal/enums/severitytype/variant.go
package severitytype

import (
    "encoding/json"
    "fmt"
    "strings"
)

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

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsError() bool   { return v == Error }
func (v Variant) IsWarning() bool { return v == Warning }
func (v Variant) IsInfo() bool    { return v == Info }

func All() []Variant { return []Variant{Error, Warning, Info} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}

func Parse(s string) apperror.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) { return Variant(i), nil }
    }
    return Invalid, apperror.New(
        ErrEnumParseFailed,
        "invalid severity",
    ).WithContext("value", s)
}

func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] { result = append(result, s) }
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

## 6. spectype.Variant

```go
// internal/enums/spectype/variant.go
package spectype

import (
    "encoding/json"
    "fmt"
    "strings"
)

type Variant byte

const (
    Invalid      Variant = iota
    Overview
    DataModels
    Api
    Architecture
    Features
)

var variantLabels = [...]string{
    Invalid:      "Invalid",
    Overview:     "Overview",
    DataModels:   "DataModels",
    Api:          "Api",
    Architecture: "Architecture",
    Features:     "Features",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool      { return v == Invalid }
func (v Variant) IsOverview() bool     { return v == Overview }
func (v Variant) IsDataModels() bool   { return v == DataModels }
func (v Variant) IsApi() bool          { return v == Api }
func (v Variant) IsArchitecture() bool { return v == Architecture }
func (v Variant) IsFeatures() bool     { return v == Features }

func All() []Variant { return []Variant{Overview, DataModels, Api, Architecture, Features} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}

func Parse(s string) apperror.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) { return Variant(i), nil }
    }
    return Invalid, apperror.New(
        ErrEnumParseFailed,
        "invalid spec type",
    ).WithContext("value", s)
}

func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] { result = append(result, s) }
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

## 7. outputformattype.Variant

```go
// internal/enums/outputformattype/variant.go
package outputformattype

import (
    "encoding/json"
    "fmt"
    "strings"
)

type Variant byte

const (
    Invalid Variant = iota
    Simple
    Complex
)

var variantLabels = [...]string{
    Invalid: "Invalid",
    Simple:  "Simple",
    Complex: "Complex",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsSimple() bool  { return v == Simple }
func (v Variant) IsComplex() bool { return v == Complex }

func All() []Variant { return []Variant{Simple, Complex} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}

func Parse(s string) apperror.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) { return Variant(i), nil }
    }
    return Invalid, apperror.New(
        ErrEnumParseFailed,
        "invalid output format",
    ).WithContext("value", s)
}

func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] { result = append(result, s) }
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

## 8. knowledgecategorytype.Variant

```go
// internal/enums/knowledgecategorytype/variant.go
package knowledgecategorytype

import (
    "encoding/json"
    "fmt"
    "strings"
)

type Variant byte

const (
    Invalid        Variant = iota
    SplitDb
    SeedableConfig
    ErrorCodes
    GeneralSpec
    CliPatterns
)

var variantLabels = [...]string{
    Invalid:        "Invalid",
    SplitDb:        "SplitDb",
    SeedableConfig: "SeedableConfig",
    ErrorCodes:     "ErrorCodes",
    GeneralSpec:    "GeneralSpec",
    CliPatterns:    "CliPatterns",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool        { return v == Invalid }
func (v Variant) IsSplitDb() bool        { return v == SplitDb }
func (v Variant) IsSeedableConfig() bool { return v == SeedableConfig }
func (v Variant) IsErrorCodes() bool     { return v == ErrorCodes }
func (v Variant) IsGeneralSpec() bool    { return v == GeneralSpec }
func (v Variant) IsCliPatterns() bool    { return v == CliPatterns }

func All() []Variant { return []Variant{SplitDb, SeedableConfig, ErrorCodes, GeneralSpec, CliPatterns} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}

func Parse(s string) apperror.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) { return Variant(i), nil }
    }
    return Invalid, apperror.New(
        ErrEnumParseFailed,
        "invalid knowledge category",
    ).WithContext("value", s)
}

func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] { result = append(result, s) }
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

// SpecPath returns the spec file path for this knowledge category
func (v Variant) SpecPath() string {
    switch v {
    case SplitDb:        return "02-spec/06-split-db-architecture/00-overview.md"
    case SeedableConfig: return "02-spec/07-seedable-config-architecture/00-overview.md"
    case ErrorCodes:     return "02-spec/03-error-code-registry/00-overview.md"
    case GeneralSpec:    return "02-spec/01-general-spec/00-overview.md"
    case CliPatterns:    return "02-spec/33-shared-cli-frontend/00-overview.md"
    default:             return ""
    }
}
```

---

## 9. analysisdepthtype.Variant

```go
// internal/enums/analysisdepthtype/variant.go
package analysisdepthtype

import (
    "encoding/json"
    "fmt"
    "strings"
)

type Variant byte

const (
    Invalid Variant = iota
    Shallow
    Normal
    Deep
)

var variantLabels = [...]string{
    Invalid: "Invalid",
    Shallow: "Shallow",
    Normal:  "Normal",
    Deep:    "Deep",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsShallow() bool { return v == Shallow }
func (v Variant) IsNormal() bool  { return v == Normal }
func (v Variant) IsDeep() bool    { return v == Deep }

func All() []Variant { return []Variant{Shallow, Normal, Deep} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}

func Parse(s string) apperror.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) { return Variant(i), nil }
    }
    return Invalid, apperror.New(
        ErrEnumParseFailed,
        "invalid analysis depth",
    ).WithContext("value", s)
}

func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] { result = append(result, s) }
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

## 10. logleveltype.Variant

```go
// internal/enums/logleveltype/variant.go
package logleveltype

import (
    "encoding/json"
    "fmt"
    "strings"
)

type Variant byte

const (
    Invalid Variant = iota
    Debug
    Info
    Warn
    Error
)

var variantLabels = [...]string{
    Invalid: "Invalid",
    Debug:   "Debug",
    Info:    "Info",
    Warn:    "Warn",
    Error:   "Error",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsDebug() bool   { return v == Debug }
func (v Variant) IsInfo() bool    { return v == Info }
func (v Variant) IsWarn() bool    { return v == Warn }
func (v Variant) IsError() bool   { return v == Error }

func All() []Variant { return []Variant{Debug, Info, Warn, Error} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}

func Parse(s string) apperror.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) { return Variant(i), nil }
    }
    return Invalid, apperror.New(
        ErrEnumParseFailed,
        "invalid log level",
    ).WithContext("value", s)
}

func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] { result = append(result, s) }
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

*Spec Reverse CLI enum architecture v2.0.0 — 10 compliant enums following 02-spec/02-coding-guidelines/03-golang/01-enum-specification/.*
