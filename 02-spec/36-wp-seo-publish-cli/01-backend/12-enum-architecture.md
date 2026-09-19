# WP SEO Publish CLI: Enum Architecture

**Version:** 4.0.0  
**Updated:** 2026-03-09  
**Standard:** `02-spec/02-coding-guidelines/03-golang/01-enum-specification/ v3.0.0`

---

## Overview

All type-differentiating values in WP SEO Publish CLI use the `type Variant byte` pattern with `iota`. Each enum resides in its own package under `internal/enums/` with a `type` suffix and no underscores. Single `variantLabels` table with PascalCase values, `Label()` delegates to `String()`, `Parse()` uses `strings.EqualFold()`.

---

## Directory Structure

```
internal/enums/
├── contenttype/variant.go
├── publishstatustype/variant.go
├── outputformattype/variant.go
├── linkdensitymodetype/variant.go
├── variablesourcetype/variant.go
├── variablescopetype/variant.go
├── variablevaluetype/variant.go
├── automationstatustype/variant.go
├── runstatustype/variant.go
├── exportformattype/variant.go
├── mergemodetype/variant.go
└── registry.go
```

---

## 1. contenttype.Variant

WordPress content types for publishing.

```go
package contenttype

type Variant byte

const (
	Invalid  Variant = iota
	Category
	Post
	Page
	Tag
)

var variantLabels = [...]string{
	Invalid:  "Invalid",
	Category: "Category",
	Post:     "Post",
	Page:     "Page",
	Tag:      "Tag",
}

func (v Variant) String() string {
	if v.IsInvalid() { return variantLabels[Invalid] }
	return variantLabels[v]
}
func (v Variant) Label() string { return v.String() }
func (v Variant) IsValid() bool { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool  { return v == Invalid }
func (v Variant) IsCategory() bool { return v == Category }
func (v Variant) IsPost() bool     { return v == Post }
func (v Variant) IsPage() bool     { return v == Page }
func (v Variant) IsTag() bool      { return v == Tag }

func All() []Variant { return []Variant{Category, Post, Page, Tag} }
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
		"invalid content type",
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

// Domain-specific
func (v Variant) SupportsCategories() bool { return v == Post }
func (v Variant) SupportsTags() bool { return v == Post }
func (v Variant) SupportsExcerpt() bool { return v == Post || v == Page }
```

---

## 2. publishstatustype.Variant

```go
package publishstatustype

type Variant byte

const (Invalid Variant = iota; Published; Draft; Private; Pending)

var variantLabels = [...]string{Invalid: "Invalid", Published: "Published", Draft: "Draft", Private: "Private", Pending: "Pending"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool   { return v == Invalid }
func (v Variant) IsPublished() bool { return v == Published }
func (v Variant) IsDraft() bool     { return v == Draft }
func (v Variant) IsPrivate() bool   { return v == Private }
func (v Variant) IsPending() bool   { return v == Pending }

func All() []Variant { return []Variant{Published, Draft, Private, Pending} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) {
        return Invalid
    }
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
		"invalid publish status",
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

// Domain-specific
func (v Variant) IsPublic() bool { return v == Published }
func (v Variant) IsVisible() bool { return v == Published || v == Private }
```

---

## 3. outputformattype.Variant

```go
package outputformattype

type Variant byte

const (Invalid Variant = iota; Html; Markdown; Json)

var variantLabels = [...]string{Invalid: "Invalid", Html: "Html", Markdown: "Markdown", Json: "Json"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool  { return v == Invalid }
func (v Variant) IsHtml() bool     { return v == Html }
func (v Variant) IsMarkdown() bool { return v == Markdown }
func (v Variant) IsJson() bool     { return v == Json }

func All() []Variant { return []Variant{Html, Markdown, Json} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) {
        return Invalid
    }
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
		"invalid output format",
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

// Domain-specific
func (v Variant) FileExtension() string {
	switch v {
	case Html: return ".html"
	case Markdown: return ".md"
	case Json: return ".json"
	default: return ".txt"
	}
}
func (v Variant) MimeType() string {
	switch v {
	case Html: return "text/html"
	case Markdown: return "text/markdown"
	case Json: return "application/json"
	default: return "text/plain"
	}
}
```

---

## 4. linkdensitymodetype.Variant

```go
package linkdensitymodetype

type Variant byte

const (Invalid Variant = iota; Paragraph; Sentence; Custom)

var variantLabels = [...]string{Invalid: "Invalid", Paragraph: "Paragraph", Sentence: "Sentence", Custom: "Custom"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool   { return v == Invalid }
func (v Variant) IsParagraph() bool { return v == Paragraph }
func (v Variant) IsSentence() bool  { return v == Sentence }
func (v Variant) IsCustom() bool    { return v == Custom }

func All() []Variant { return []Variant{Paragraph, Sentence, Custom} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) {
        return Invalid
    }
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
		"invalid link density mode",
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

## 5. variablesourcetype.Variant

```go
package variablesourcetype

type Variant byte

const (Invalid Variant = iota; Csv; Json; Yaml)

var variantLabels = [...]string{Invalid: "Invalid", Csv: "Csv", Json: "Json", Yaml: "Yaml"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsCsv() bool     { return v == Csv }
func (v Variant) IsJson() bool    { return v == Json }
func (v Variant) IsYaml() bool    { return v == Yaml }

func All() []Variant { return []Variant{Csv, Json, Yaml} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) {
        return Invalid
    }
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
		"invalid variable source type",
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

// Domain-specific
func (v Variant) FileExtensions() []string {
	switch v {
	case Csv:  return []string{".csv"}
	case Json: return []string{".json"}
	case Yaml: return []string{".yaml", ".yml"}
	default:   return nil
	}
}
```

---

## 6. variablescopetype.Variant

```go
package variablescopetype

type Variant byte

const (Invalid Variant = iota; Global; Website; Content; Instance)

var variantLabels = [...]string{Invalid: "Invalid", Global: "Global", Website: "Website", Content: "Content", Instance: "Instance"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool  { return v == Invalid }
func (v Variant) IsGlobal() bool   { return v == Global }
func (v Variant) IsWebsite() bool  { return v == Website }
func (v Variant) IsContent() bool  { return v == Content }
func (v Variant) IsInstance() bool { return v == Instance }

func All() []Variant { return []Variant{Global, Website, Content, Instance} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) {
        return Invalid
    }
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
		"invalid variable scope",
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

// Domain-specific
func (v Variant) Priority() int {
	switch v {
	case Global: return 0
	case Website: return 1
	case Content: return 2
	case Instance: return 3
	default: return -1
	}
}
```

---

## 7. variablevaluetype.Variant

```go
package variablevaluetype

type Variant byte

const (Invalid Variant = iota; String; Number; Boolean; Array; Object)

var variantLabels = [...]string{Invalid: "Invalid", String: "String", Number: "Number", Boolean: "Boolean", Array: "Array", Object: "Object"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsString() bool  { return v == String }
func (v Variant) IsNumber() bool  { return v == Number }
func (v Variant) IsBoolean() bool { return v == Boolean }
func (v Variant) IsArray() bool   { return v == Array }
func (v Variant) IsObject() bool  { return v == Object }

func All() []Variant { return []Variant{String, Number, Boolean, Array, Object} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) {
        return Invalid
    }
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
		"invalid variable value type",
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

## 8. automationstatustype.Variant

```go
package automationstatustype

type Variant byte

const (Invalid Variant = iota; Idle; Running; Paused; Completed)

var variantLabels = [...]string{Invalid: "Invalid", Idle: "Idle", Running: "Running", Paused: "Paused", Completed: "Completed"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool   { return v == Invalid }
func (v Variant) IsIdle() bool      { return v == Idle }
func (v Variant) IsRunning() bool   { return v == Running }
func (v Variant) IsPaused() bool    { return v == Paused }
func (v Variant) IsCompleted() bool { return v == Completed }

func All() []Variant { return []Variant{Idle, Running, Paused, Completed} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) {
        return Invalid
    }
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
		"invalid automation status",
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

// Domain-specific
func (v Variant) IsTerminal() bool { return v == Completed }
func (v Variant) IsActive() bool { return v == Running }
```

---

## 9. runstatustype.Variant

```go
package runstatustype

type Variant byte

const (Invalid Variant = iota; Running; Completed; Failed; Cancelled)

var variantLabels = [...]string{Invalid: "Invalid", Running: "Running", Completed: "Completed", Failed: "Failed", Cancelled: "Cancelled"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool   { return v == Invalid }
func (v Variant) IsRunning() bool   { return v == Running }
func (v Variant) IsCompleted() bool { return v == Completed }
func (v Variant) IsFailed() bool    { return v == Failed }
func (v Variant) IsCancelled() bool { return v == Cancelled }

func All() []Variant { return []Variant{Running, Completed, Failed, Cancelled} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) {
        return Invalid
    }
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
		"invalid run status",
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

// Domain-specific
func (v Variant) IsTerminal() bool { return v == Completed || v == Failed || v == Cancelled }
```

---

## 10. exportformattype.Variant

```go
package exportformattype

type Variant byte

const (Invalid Variant = iota; Json; Zip)

var variantLabels = [...]string{Invalid: "Invalid", Json: "Json", Zip: "Zip"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsJson() bool    { return v == Json }
func (v Variant) IsZip() bool     { return v == Zip }

func All() []Variant { return []Variant{Json, Zip} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) {
        return Invalid
    }
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
		"invalid export format",
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

// Domain-specific
func (v Variant) FileExtension() string {
	switch v {
	case Json: return ".json"
	case Zip:  return ".zip"
	default:   return ""
	}
}
```

---

## 11. mergemodetype.Variant

```go
package mergemodetype

type Variant byte

const (Invalid Variant = iota; Replace; Merge; Skip)

var variantLabels = [...]string{Invalid: "Invalid", Replace: "Replace", Merge: "Merge", Skip: "Skip"}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
func (v Variant) IsValid() bool  { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsReplace() bool { return v == Replace }
func (v Variant) IsMerge() bool   { return v == Merge }
func (v Variant) IsSkip() bool    { return v == Skip }

func All() []Variant { return []Variant{Replace, Merge, Skip} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) {
        return Invalid
    }
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
		"invalid merge mode",
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

## Central Registry

```go
// internal/enums/registry.go
package enums

import (
	"wpseo-cli/internal/enums/contenttype"
	"wpseo-cli/internal/enums/publishstatustype"
	"wpseo-cli/internal/enums/outputformattype"
	"wpseo-cli/internal/enums/linkdensitymodetype"
	"wpseo-cli/internal/enums/variablesourcetype"
	"wpseo-cli/internal/enums/variablescopetype"
	"wpseo-cli/internal/enums/variablevaluetype"
	"wpseo-cli/internal/enums/automationstatustype"
	"wpseo-cli/internal/enums/runstatustype"
	"wpseo-cli/internal/enums/exportformattype"
	"wpseo-cli/internal/enums/mergemodetype"
)

type Registry struct {
	ContentTypes        []contenttype.Variant
	PublishStatuses     []publishstatustype.Variant
	OutputFormats       []outputformattype.Variant
	LinkDensityModes    []linkdensitymodetype.Variant
	VariableSourceTypes []variablesourcetype.Variant
	VariableScopes      []variablescopetype.Variant
	VariableValueTypes  []variablevaluetype.Variant
	AutomationStatuses  []automationstatustype.Variant
	RunStatuses         []runstatustype.Variant
	ExportFormats       []exportformattype.Variant
	MergeModes          []mergemodetype.Variant
}

func NewRegistry() *Registry {
	return &Registry{
		ContentTypes:        contenttype.All(),
		PublishStatuses:     publishstatustype.All(),
		OutputFormats:       outputformattype.All(),
		LinkDensityModes:    linkdensitymodetype.All(),
		VariableSourceTypes: variablesourcetype.All(),
		VariableScopes:      variablescopetype.All(),
		VariableValueTypes:  variablevaluetype.All(),
		AutomationStatuses:  automationstatustype.All(),
		RunStatuses:         runstatustype.All(),
		ExportFormats:       exportformattype.All(),
		MergeModes:          mergemodetype.All(),
	}
}
```

---

## Cross-References

| Resource | Location |
|----------|----------|
| Enum Specification | `02-spec/02-coding-guidelines/03-golang/01-enum-specification/` |
| Architecture | `01-architecture.md` |
| Content Publisher | `03-content-publisher.md` |
| Variable System | `05-variable-system.md` |
| Split DB Schema | `06-split-db-schema.md` |
| Import/Export | `09-import-export.md` |
