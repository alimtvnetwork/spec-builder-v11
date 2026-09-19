# 53 — Enum Architecture

**Version:** 5.0.0  
**Updated:** 2026-03-09  

> Canonical enum definitions for AI Bridge CLI following `02-spec/02-coding-guidelines/03-golang/01-enum-specification/ v3.0.0`.  
> **Total Enums:** 28  
> **Pattern:** Single `variantLabels` table, PascalCase values, `Label()` delegates to `String()`, `Parse()` uses `strings.EqualFold()`.

---

## Directory Structure

```
internal/enums/
├── steptype/variant.go
├── commandcategorytype/variant.go
├── executionstatustype/variant.go
├── backendtype/variant.go
├── logleveltype/variant.go
├── logformattype/variant.go
├── valuetype/variant.go
├── configsourcetype/variant.go
├── appstatustype/variant.go
├── modelcategorytype/variant.go
├── messageroletype/variant.go
├── reasoningmodetype/variant.go
├── contexttype/variant.go
├── connectionstatetype/variant.go
├── requeststagetype/variant.go
├── moduletype/variant.go
├── suggestiontype/variant.go
├── suggestionstatustype/variant.go
├── prioritytype/variant.go
├── contenttype/variant.go
├── feedbacktype/variant.go
├── feedbacksourcetype/variant.go
├── difftype/variant.go
├── linktype/variant.go
├── memorytiertype/variant.go
├── htmlblogstatustype/variant.go
├── contextstatustype/variant.go
├── searchplatformtype/variant.go
└── registry.go
```

---

## 1. steptype.Variant

```go
package steptype
type Variant byte
const (Invalid Variant = iota; ReadFile; ReadUrl; Search; VectorQuery; Transform; Filter; Aggregate; Branch; Execute)
var variantLabels = [...]string{Invalid: "Invalid", ReadFile: "ReadFile", ReadUrl: "ReadUrl", Search: "Search", VectorQuery: "VectorQuery", Transform: "Transform", Filter: "Filter", Aggregate: "Aggregate", Branch: "Branch", Execute: "Execute"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

**Domain:**

```go
func (v Variant) IsParallelizable() bool {
    switch v { case ReadFile, ReadUrl, Search, VectorQuery: return true; default: return false }
}
func (v Variant) DefaultTimeoutMs() int {
    switch v { case ReadUrl: return 10000; case Search: return 15000; case VectorQuery: return 5000; default: return 30000 }
}
```

---

## 2. commandcategorytype.Variant

```go
package commandcategorytype
type Variant byte
const (Invalid Variant = iota; Reasoning; Coding; Search; Custom)
var variantLabels = [...]string{Invalid: "Invalid", Reasoning: "Reasoning", Coding: "Coding", Search: "Search", Custom: "Custom"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

---

## 3. executionstatustype.Variant

```go
package executionstatustype
type Variant byte
const (Invalid Variant = iota; Pending; Running; Completed; Failed; Cancelled)
var variantLabels = [...]string{Invalid: "Invalid", Pending: "Pending", Running: "Running", Completed: "Completed", Failed: "Failed", Cancelled: "Cancelled"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

**Domain:**

```go
func (v Variant) IsTerminal() bool {
    switch v { case Completed, Failed, Cancelled: return true; default: return false }
}
```

---

## 4. backendtype.Variant

```go
package backendtype
type Variant byte
const (Invalid Variant = iota; Ollama; LlamaCpp)
var variantLabels = [...]string{Invalid: "Invalid", Ollama: "Ollama", LlamaCpp: "LlamaCpp"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

**Domain:**

```go
func (v Variant) DefaultPort() int {
    switch v { case Ollama: return 11434; case LlamaCpp: return 8080; default: return 0 }
}
```

---

## 5. logleveltype.Variant

```go
package logleveltype
type Variant byte
const (Invalid Variant = iota; Debug; Info; Warn; Error)
var variantLabels = [...]string{Invalid: "Invalid", Debug: "Debug", Info: "Info", Warn: "Warn", Error: "Error"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

---

## 6. logformattype.Variant

```go
package logformattype
type Variant byte
const (Invalid Variant = iota; Json; Text)
var variantLabels = [...]string{Invalid: "Invalid", Json: "Json", Text: "Text"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

---

## 7. valuetype.Variant

```go
package valuetype
type Variant byte
const (Invalid Variant = iota; String; Int; Float; Bool; Json)
var variantLabels = [...]string{Invalid: "Invalid", String: "String", Int: "Int", Float: "Float", Bool: "Bool", Json: "Json"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

---

## 8. configsourcetype.Variant

```go
package configsourcetype
type Variant byte
const (Invalid Variant = iota; Seed; User; Runtime)
var variantLabels = [...]string{Invalid: "Invalid", Seed: "Seed", User: "User", Runtime: "Runtime"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

---

## 9. appstatustype.Variant

```go
package appstatustype
type Variant byte
const (Invalid Variant = iota; Active; Archived; Deleted)
var variantLabels = [...]string{Invalid: "Invalid", Active: "Active", Archived: "Archived", Deleted: "Deleted"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

---

## 10. modelcategorytype.Variant

```go
package modelcategorytype
type Variant byte
const (Invalid Variant = iota; Thinking; Coding; Writing)
var variantLabels = [...]string{Invalid: "Invalid", Thinking: "Thinking", Coding: "Coding", Writing: "Writing"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

---

## 11. messageroletype.Variant

```go
package messageroletype
type Variant byte
const (Invalid Variant = iota; System; User; Assistant)
var variantLabels = [...]string{Invalid: "Invalid", System: "System", User: "User", Assistant: "Assistant"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

---

## 12. reasoningmodetype.Variant

```go
package reasoningmodetype
type Variant byte
const (Invalid Variant = iota; Auto; TwoStage; SinglePrompt; Disabled)
var variantLabels = [...]string{Invalid: "Invalid", Auto: "Auto", TwoStage: "TwoStage", SinglePrompt: "SinglePrompt", Disabled: "Disabled"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

**Domain:**

```go
func (v Variant) RequiresReasoningStep() bool {
    switch v { case Auto, TwoStage: return true; default: return false }
}
```

---

## 13. contexttype.Variant

```go
package contexttype
type Variant byte
const (Invalid Variant = iota; WebSearch; Codebase; Documentation)
var variantLabels = [...]string{Invalid: "Invalid", WebSearch: "WebSearch", Codebase: "Codebase", Documentation: "Documentation"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

---

## 14. connectionstatetype.Variant

```go
package connectionstatetype
type Variant byte
const (Invalid Variant = iota; Connected; Disconnected; Reconnecting)
var variantLabels = [...]string{Invalid: "Invalid", Connected: "Connected", Disconnected: "Disconnected", Reconnecting: "Reconnecting"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

---

## 15. requeststagetype.Variant

```go
package requeststagetype
type Variant byte
const (Invalid Variant = iota; Reasoning; Generating; Streaming)
var variantLabels = [...]string{Invalid: "Invalid", Reasoning: "Reasoning", Generating: "Generating", Streaming: "Streaming"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

---

## 16. moduletype.Variant

```go
package moduletype
type Variant byte
const (Invalid Variant = iota; Chat; Blog; Faq; Code; Paragraph)
var variantLabels = [...]string{Invalid: "Invalid", Chat: "Chat", Blog: "Blog", Faq: "Faq", Code: "Code", Paragraph: "Paragraph"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

---

## 17. suggestiontype.Variant

```go
package suggestiontype
type Variant byte
const (Invalid Variant = iota; Actionable; Informational)
var variantLabels = [...]string{Invalid: "Invalid", Actionable: "Actionable", Informational: "Informational"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

---

## 18. suggestionstatustype.Variant

```go
package suggestionstatustype
type Variant byte
const (Invalid Variant = iota; Open; Accepted; Dismissed)
var variantLabels = [...]string{Invalid: "Invalid", Open: "Open", Accepted: "Accepted", Dismissed: "Dismissed"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

---

## 19. prioritytype.Variant

```go
package prioritytype
type Variant byte
const (Invalid Variant = iota; Low; Medium; High)
var variantLabels = [...]string{Invalid: "Invalid", Low: "Low", Medium: "Medium", High: "High"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

**Domain:**

```go
func (v Variant) Weight() float64 {
    switch v { case High: return 1.0; case Medium: return 0.5; case Low: return 0.2; default: return 0.0 }
}
```

---

## 20. contenttype.Variant

```go
package contenttype
type Variant byte
const (Invalid Variant = iota; Blog; Faq; Html; Code; Chat)
var variantLabels = [...]string{Invalid: "Invalid", Blog: "Blog", Faq: "Faq", Html: "Html", Code: "Code", Chat: "Chat"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

---

## 21. feedbacktype.Variant

```go
package feedbacktype
type Variant byte
const (Invalid Variant = iota; RevisionRequest; Approval; Rejection; Note)
var variantLabels = [...]string{Invalid: "Invalid", RevisionRequest: "RevisionRequest", Approval: "Approval", Rejection: "Rejection", Note: "Note"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

---

## 22. feedbacksourcetype.Variant

```go
package feedbacksourcetype
type Variant byte
const (Invalid Variant = iota; User; Automated; Qa)
var variantLabels = [...]string{Invalid: "Invalid", User: "User", Automated: "Automated", Qa: "Qa"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

---

## 23. difftype.Variant

```go
package difftype
type Variant byte
const (Invalid Variant = iota; Unified; SideBySide; Inline)
var variantLabels = [...]string{Invalid: "Invalid", Unified: "Unified", SideBySide: "SideBySide", Inline: "Inline"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

---

## 24. linktype.Variant

```go
package linktype
type Variant byte
const (Invalid Variant = iota; Related; DependsOn; DerivedFrom)
var variantLabels = [...]string{Invalid: "Invalid", Related: "Related", DependsOn: "DependsOn", DerivedFrom: "DerivedFrom"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

**Domain:**

```go
func (v Variant) IsBidirectional() bool { return v == Related }
```

---

## 25. memorytiertype.Variant

```go
package memorytiertype
type Variant byte
const (Invalid Variant = iota; Attention; ShortTerm; Critical; Important; Regular)
var variantLabels = [...]string{Invalid: "Invalid", Attention: "Attention", ShortTerm: "ShortTerm", Critical: "Critical", Important: "Important", Regular: "Regular"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

**Domain:**

```go
func (v Variant) RetrievalBoost() float64 {
    switch v { case Attention: return 4.0; case Critical: return 3.0; case ShortTerm: return 2.0; case Important: return 2.0; case Regular: return 1.0; default: return 0.0 }
}
func (v Variant) IsAutoManaged() bool { switch v { case Attention, ShortTerm: return true; default: return false } }
func (v Variant) IsPersistent() bool { switch v { case Critical, Important: return true; default: return false } }
```

---

## 26. htmlblogstatustype.Variant

```go
package htmlblogstatustype
type Variant byte
const (Invalid Variant = iota; Draft; Generating; Published; Archived)
var variantLabels = [...]string{Invalid: "Invalid", Draft: "Draft", Generating: "Generating", Published: "Published", Archived: "Archived"}

func (v Variant) String() string  { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string   { return v.String() }
func (v Variant) IsValid() bool   { return v > Invalid && v < Variant(len(variantLabels)) }
func (v Variant) IsInvalid() bool     { return v == Invalid }
func (v Variant) IsDraft() bool       { return v == Draft }
func (v Variant) IsGenerating() bool  { return v == Generating }
func (v Variant) IsPublished() bool   { return v == Published }
func (v Variant) IsArchived() bool    { return v == Archived }
func All() []Variant { return []Variant{Draft, Generating, Published, Archived} }
func ByIndex(i int) Variant { if i < 0 || i >= len(variantLabels) { return Invalid }; return Variant(i) }
func Parse(s string) appfault.Result[Variant] { normalized := strings.TrimSpace(s); for i, label := range variantLabels { if strings.EqualFold(label, normalized) { return appfault.Ok(Variant(i)) } }; return appfault.FailNew[Variant](ErrEnumInvalidVariant, "invalid html blog status: %q", s) }
func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] {
        result = append(result, s)
    }

    return result
}

func (v Variant) IsTerminal() bool { return v == Published || v == Archived }
func (v Variant) IsEditable() bool { return v == Draft }
```

---

## 27. contextstatustype.Variant

```go
package contextstatustype
type Variant byte
const (Invalid Variant = iota; Pending; Fetching; Complete; Failed; Cached)
var variantLabels = [...]string{Invalid: "Invalid", Pending: "Pending", Fetching: "Fetching", Complete: "Complete", Failed: "Failed", Cached: "Cached"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

**Domain:**

```go
func (v Variant) IsTerminal() bool { switch v { case Complete, Failed, Cached: return true; default: return false } }
func (v Variant) IsSuccess() bool { return v == Complete || v == Cached }
```

---

## 28. searchplatformtype.Variant

```go
package searchplatformtype
type Variant byte
const (Invalid Variant = iota; Google; YouTube; Reddit; Medium; LinkedIn)
var variantLabels = [...]string{Invalid: "Invalid", Google: "Google", YouTube: "YouTube", Reddit: "Reddit", Medium: "Medium", LinkedIn: "LinkedIn"}
```

**Methods:** String, Label, IsValid, Is{Value}, All, ByIndex, Parse, Values, MarshalJSON, UnmarshalJSON

**Domain:**

```go
func (v Variant) SupportsTranscript() bool { return v == YouTube }
func (v Variant) IsDefaultPlatform() bool { switch v { case Google, YouTube, Reddit: return true; default: return false } }
```

---

## Central Registry

```go
// internal/enums/registry.go
package enums

import (
    "ai-bridge-cli/internal/enums/steptype"
    "ai-bridge-cli/internal/enums/commandcategorytype"
    "ai-bridge-cli/internal/enums/executionstatustype"
    "ai-bridge-cli/internal/enums/backendtype"
    "ai-bridge-cli/internal/enums/logleveltype"
    "ai-bridge-cli/internal/enums/logformattype"
    "ai-bridge-cli/internal/enums/valuetype"
    "ai-bridge-cli/internal/enums/configsourcetype"
    "ai-bridge-cli/internal/enums/appstatustype"
    "ai-bridge-cli/internal/enums/modelcategorytype"
    "ai-bridge-cli/internal/enums/messageroletype"
    "ai-bridge-cli/internal/enums/reasoningmodetype"
    "ai-bridge-cli/internal/enums/contexttype"
    "ai-bridge-cli/internal/enums/connectionstatetype"
    "ai-bridge-cli/internal/enums/requeststagetype"
    "ai-bridge-cli/internal/enums/moduletype"
    "ai-bridge-cli/internal/enums/suggestiontype"
    "ai-bridge-cli/internal/enums/suggestionstatustype"
    "ai-bridge-cli/internal/enums/prioritytype"
    "ai-bridge-cli/internal/enums/contenttype"
    "ai-bridge-cli/internal/enums/feedbacktype"
    "ai-bridge-cli/internal/enums/feedbacksourcetype"
    "ai-bridge-cli/internal/enums/difftype"
    "ai-bridge-cli/internal/enums/linktype"
    "ai-bridge-cli/internal/enums/memorytiertype"
    "ai-bridge-cli/internal/enums/htmlblogstatustype"
    "ai-bridge-cli/internal/enums/contextstatustype"
    "ai-bridge-cli/internal/enums/searchplatformtype"
)
```

---

## Cross-References

| Resource | Location |
|----------|----------|
| Enum Specification | `02-spec/02-coding-guidelines/03-golang/01-enum-specification/` |
| Long-Chain Command System | `50-long-chain-command-system.md` |
| Configuration | `06-configuration.md` |
| Database Architecture | `12-database-architecture.md` |
| Adaptive Reasoning Flow | `37-adaptive-reasoning-flow.md` |
| Suggestions System | `34-suggestions-system.md` |
| Revision Feedback System | `31-revision-feedback-system.md` |
| Memory Classification | `41-memory-classification-flags.md` |
| Memory Retrieval Best Practices | `54-memory-retrieval-best-practices.md` |
| HTML Blog Generation | `55-html-blog-generation.md` |
| GSearch Context Integration | `40-gsearch-context-integration.md` |

---

*AI Bridge CLI — 28 enums, v3.0.0 single variantLabels PascalCase pattern. All zero values use `Invalid`.*
