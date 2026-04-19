# Memory: constraints/validation-data-pattern

**Updated:** 2026-02-02  
**Version:** 1.0.0  
**Status:** Active  
**Spec Location:** `spec/07-seedable-config-architecture/06-validation-data-seeding.md`

---

## Rule

**ALL validation arrays, lookup tables, and configurable thresholds MUST be loaded from Root DB via `ValidationDataService` using TYPED CONSTANTS.**

They are NEVER hardcoded in Go source code. Magic strings are FORBIDDEN.

---

## Pattern

```
config.seed.json → Root DB (on version change) → ValidationDataService (typed constants) → Runtime
```

---

## Naming Convention

Use **PascalCase** for type names (not all-caps acronyms):
- `SeoKey` (not `SEOKey`)
- `RagKey` (not `RAGKey`)
- `GetSeoNumber` (not `GetSEONumber`)
- `GetRagStringArray` (not `GetRAGStringArray`)

---

## Typed Constants (MANDATORY)

```go
// Category Constants
type ValidationCategory string
const (
    CategorySeo    ValidationCategory = "seo"
    CategoryRag    ValidationCategory = "rag"
    CategorySearch ValidationCategory = "search"
)

// SEO Key Constants
type SeoKey string
const (
    SeoKeyTransitionWords           SeoKey = "transitionWords"
    SeoKeyTransitionDensityThreshold SeoKey = "transitionDensityThreshold"
    SeoKeyMaxSentenceWords          SeoKey = "maxSentenceWords"
    SeoKeyMaxParagraphWords         SeoKey = "maxParagraphWords"
    SeoKeyMinKeywordMentions        SeoKey = "minKeywordMentions"
    SeoKeyForbiddenContainerTags    SeoKey = "forbiddenContainerTags"
    // ... see full list in spec
)

// RAG Key Constants
type RagKey string
const (
    RagKeyStopWords    RagKey = "stopWords"
    RagKeyMinChunkSize RagKey = "minChunkSize"
    // ... see full list in spec
)
```

---

## Go Pattern

### ❌ WRONG: Magic Strings
```go
transitions, _ := v.validationData.GetStringArray("seo", "transitionWords")
threshold, _ := v.validationData.GetNumber("seo", "transitionDensityThreshold")
```

### ✅ CORRECT: Typed Constants
```go
transitions, _ := v.validationData.GetSeoStringArray(SeoKeyTransitionWords)
threshold, _ := v.validationData.GetSeoNumber(SeoKeyTransitionDensityThreshold)
```

### ❌ WRONG: Hardcoded Arrays
```go
transitions := []string{"however", "therefore", ...}
threshold := 40.0
```

---

## Applies To

All CLIs: GSearch, BRun, AI Bridge, Nexus Flow, WP SEO Publish
