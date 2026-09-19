# Acronym & JSON Tag Remediation Plan

**Version:** 2.0.0  
**Created:** 2026-03-09  
**Priority:** High  
**Status:** COMPLETE (50+ files fixed)

**Completed:**
- ✅ AI Transcribe CLI (6 files)
- ✅ AI Bridge CLI (8 files - vector-database-integration.md, 56-observability.md, 57-settings-service.md, 34-suggestions-system.md, 48-plan-execution-monitoring.md, 50-long-chain-command-system.md + URL→Url fixes)
- ✅ WP SEO Publish CLI (5 files - 02-wordpress-connector.md, 03-content-publisher.md, 04-ai-bridge-client.md, 05-variable-system.md - ID→Id, URL→Url, API→Api, SEO→Seo, JSON tags removed)
- ✅ Training memories (1 file)
- ✅ BRun CLI (3 files - 10-data-models.md, 09-integration-api.md, 15-observability.md)
- ✅ GSearch CLI (7 files - 11-rag-export.md, 16-observability.md, 45-contact-extraction.md, 44-serp-position-tracking.md, 21-settings-service.md, 42-multi-engine-search.md, 43-faq-discovery-ai-overview.md)
- ✅ Nexus Flow CLI (2 files - 07-observability.md, 01-core-specification.md - ID→Id, OTLP→Otlp, JSON tags removed)
- ✅ Seedable Config Architecture (2 files - 00-overview.md, 03-rag-validation-helpers.md - JSON tags removed from Go structs)
- ✅ Spec Management Software (3 files - 03-pkg-types.md, 08-pkg-database-operations.md, 04-ai-bridge.md in 14-microservices/ - ID→Id, JSON tags removed from Go structs)

---

## Problem Statement

### Issue 1: Acronym Casing
Current specs use uppercase acronyms which violates the "treat acronyms as words" convention:

| Wrong | Correct |
|-------|---------|
| `RAG` | `Rag` |
| `CLI` | `Cli` |
| `API` | `Api` |
| `URL` | `Url` |
| `HTTP` | `Http` |
| `JSON` | `Json` |
| `YAML` | `Yaml` |
| `SEO` | `Seo` |
| `FAQ` | `Faq` |
| `TTS` | `Tts` |
| `STT` | `Stt` |

### Issue 2: Explicit JSON/YAML Tags
Go struct tags should NOT specify explicit field names when using PascalCase:

**Wrong:**
```go
type RagExportManifest struct {
    TotalSources   int      `json:"totalSources" yaml:"totalSources"`
    TotalChunks    int      `json:"totalChunks" yaml:"totalChunks"`
    UniqueKeywords []string `json:"uniqueKeywords" yaml:"uniqueKeywords"`
}
```

**Correct:**
```go
type RagExportManifest struct {
    TotalSources   int
    TotalChunks    int
    UniqueKeywords []string `json:",omitempty"`
}
```

The Go JSON encoder automatically uses the PascalCase field name. Tags are only needed for:
- `,omitempty` - omit zero values
- `-` - skip field entirely

---

## Affected Files

### High Priority (Backend Specs with Go Structs)

| File | Issues |
|------|--------|
| `02-spec/25-gsearch-cli/01-backend/11-rag-export.md` | Rag→Rag, JSON tags |
| `02-spec/25-gsearch-cli/01-backend/45-contact-extraction.md` | JSON tags |
| `02-spec/25-gsearch-cli/01-backend/48-unified-rest-api.md` | Api→Api, JSON tags |
| `02-spec/25-gsearch-cli/01-backend/54-model-decomposition.md` | JSON tags |
| `02-spec/27-ai-bridge-cli/01-backend/50-long-chain-command-system.md` | Cli→Cli, JSON tags |
| `02-spec/27-ai-bridge-cli/01-backend/51-vector-database-integration.md` | Rag→Rag, JSON tags |
| `02-spec/27-ai-bridge-cli/01-backend/12-database-architecture.md` | JSON tags |
| `02-spec/27-ai-bridge-cli/01-backend/57-settings-service.md` | JSON tags |
| `02-spec/26-brun-cli/01-backend/16-database-architecture.md` | JSON tags |
| `02-spec/29-nexus-flow-cli/01-backend/05-database-architecture.md` | JSON tags |

### Medium Priority (Overview & Architecture)

| File | Issues |
|------|--------|
| `02-spec/25-gsearch-cli/01-backend/00-overview.md` | Rag, Cli, Api acronyms |
| `02-spec/27-ai-bridge-cli/01-backend/00-overview.md` | Rag, Cli, Api acronyms |
| `02-spec/27-ai-bridge-cli/00-overview.md` | Cli, Api acronyms |
| `02-spec/26-brun-cli/00-overview.md` | Cli acronyms |
| `02-spec/30-spec-reverse-cli/01-backend/01-architecture.md` | Cli, Api acronyms |

### Low Priority (Memory Files)

| File | Issues |
|------|--------|
| `.ai-memory/memories/features/ai-bridge/*.md` | Rag, Cli acronyms |
| `.ai-memory/memories/technical/rag-*.md` | Rag acronym |
| `.ai-memory/memories/architecture/rag-*.md` | Rag acronym |

---

## Remediation Rules

### Rule 1: Acronym Conversion
All acronyms in code identifiers treated as single words:

```
RAGChunk      → RagChunk
RAGExport     → RagExport
CLIConfig     → CliConfig
APIEndpoint   → ApiEndpoint
URLParser     → UrlParser
HTTPClient    → HttpClient
JSONEncoder   → JsonEncoder
SEOAnalyzer   → SeoAnalyzer
FAQExtractor  → FaqExtractor
TTSProvider   → TtsProvider
STTEngine     → SttEngine
```

### Rule 2: JSON Tag Removal
Remove explicit field name mappings:

```go
// BEFORE
Field string `json:"field" yaml:"field" toml:"field"`

// AFTER - Option A (field always present)
Field string

// AFTER - Option B (omit if empty)
Field string `json:",omitempty"`
```

### Rule 3: Preserve Semantic Tags
Keep non-naming tags:

```go
// Keep these patterns
Password string `json:"-"`           // Skip field
Optional string `json:",omitempty"`  // Omit if empty
Inline   struct `json:",inline"`     // Flatten struct
```

---

## Grep Commands for Detection

### Find Wrong Acronyms
```bash
# Find RAG (uppercase)
grep -rn "RAG[A-Z]" spec/ --include="*.md"

# Find CLI (uppercase in identifiers)
grep -rn "CLI[A-Z]" spec/ --include="*.md"

# Find API (uppercase in identifiers)  
grep -rn "API[A-Z]" spec/ --include="*.md"
```

### Find Explicit JSON Tags
```bash
# Find json:"fieldName" patterns (camelCase)
grep -rn 'json:"[a-z]' spec/ --include="*.md"

# Find yaml:"fieldName" patterns
grep -rn 'yaml:"[a-z]' spec/ --include="*.md"

# Find toml:"fieldName" patterns
grep -rn 'toml:"[a-z]' spec/ --include="*.md"
```

---

## Implementation Phases

### Phase 1: GSearch CLI (Immediate)
Files to update:
1. `02-spec/25-gsearch-cli/01-backend/11-rag-export.md`
2. `02-spec/25-gsearch-cli/01-backend/45-contact-extraction.md`
3. `02-spec/25-gsearch-cli/01-backend/48-unified-rest-api.md`
4. `02-spec/25-gsearch-cli/01-backend/54-model-decomposition.md`

### Phase 2: AI Bridge CLI
Files to update:
1. `02-spec/27-ai-bridge-cli/01-backend/50-long-chain-command-system.md`
2. `02-spec/27-ai-bridge-cli/01-backend/51-vector-database-integration.md`
3. `02-spec/27-ai-bridge-cli/01-backend/12-database-architecture.md`
4. `02-spec/27-ai-bridge-cli/01-backend/57-settings-service.md`

### Phase 3: Other CLIs
Files to update:
1. `02-spec/26-brun-cli/01-backend/16-database-architecture.md`
2. `02-spec/29-nexus-flow-cli/01-backend/05-database-architecture.md`
3. `02-spec/30-spec-reverse-cli/01-backend/01-architecture.md`

### Phase 4: Memory Files
Update all `.ai-memory/memories/` files with acronym fixes.

---

## Example Transformations

### Before (11-rag-export.md)
```go
type RAGExportManifest struct {
    TotalSources    int      `json:"totalSources" yaml:"totalSources" toml:"totalSources"`
    TotalChunks     int      `json:"totalChunks" yaml:"totalChunks" toml:"totalChunks"`
    TotalTokens     int      `json:"totalTokens" yaml:"totalTokens" toml:"totalTokens"`
    UniqueKeywords  []string `json:"uniqueKeywords" yaml:"uniqueKeywords" toml:"uniqueKeywords"`
    EnginesUsed     []string `json:"enginesUsed" yaml:"enginesUsed" toml:"enginesUsed"`
    CoverageDepth   int      `json:"coverageDepth" yaml:"coverageDepth" toml:"coverageDepth"`
}
```

### After
```go
type RagExportManifest struct {
    TotalSources   int
    TotalChunks    int
    TotalTokens    int
    UniqueKeywords []string `json:",omitempty"`
    EnginesUsed    []string `json:",omitempty"`
    CoverageDepth  int
}
```

### Before (API endpoint)
```go
type APIResponse struct {
    StatusCode int    `json:"statusCode"`
    Message    string `json:"message"`
}
```

### After
```go
type ApiResponse struct {
    StatusCode int
    Message    string
}
```

---

## Validation Checklist

After remediation, verify:

- [ ] No `RAG` followed by uppercase letter in identifiers
- [ ] No `CLI` followed by uppercase letter in identifiers
- [ ] No `API` followed by uppercase letter in identifiers
- [ ] No `json:"camelCase"` patterns (only `json:",omitempty"` or `json:"-"`)
- [ ] No `yaml:"camelCase"` patterns
- [ ] No `toml:"camelCase"` patterns
- [ ] All struct field names remain PascalCase

---

## Cross-References

| Resource | Path |
|----------|------|
| Naming Convention Memory | `.ai-memory/memories/style/naming-convention` |
| Original Remediation Plan | `02-spec/99-archive/96-naming-convention-remediation.md` |
| PascalCase Standard | `.ai-memory/memories/training/01-conventions.md` |

---

*Plan created: 2026-02-05*
