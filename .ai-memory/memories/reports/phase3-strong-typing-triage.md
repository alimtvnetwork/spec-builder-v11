# Phase 3: Strong Typing Triage Report

**Created:** 2026-02-12  
**Purpose:** Classify all `interface{}`/`map[string]any`/`map[string]interface{}` usages as MUST-FIX or LEGITIMATE  
**Scan Result:** ~95 files across 7 spec directories contain violations

---

## Summary

| Category | Files | Matches (approx) | Action |
|----------|-------|-------------------|--------|
| 🔴 MUST-FIX | 68 | ~1,600 | Replace with typed structs |
| 🟡 LEGITIMATE (3rd-party API) | 8 | ~80 | Add `// ALLOWED: external API` comments |
| 🟢 LEGITIMATE (guideline/reference) | 10 | ~120 | No change — these TEACH the rule |
| 🔵 LEGITIMATE (already-remediated exemplar) | 5 | ~35 | No change — show CORRECT pattern with `interface{}` in comments/docs only |
| **Total** | **~91** | **~1,835** | |

**Projected compliance after fixing MUST-FIX:** ≥95% (up from ~78%)

---

## 🟢 LEGITIMATE — Guideline / Teaching Files (NO FIX NEEDED)

These files reference `interface{}` in the context of **forbidding** it or explaining replacements:

| File | Reason |
|------|--------|
| `02-spec/11-spec-management-software/12-prompts/01-coding-guideline/01-backend-go.md` | Coding standard — shows forbidden vs correct patterns |
| `02-spec/01-general-spec/99-meta/01-ai-readability-review-meta.md` | Meta doc — explains "use generics instead of interface{}" |
| `02-spec/22-ai-bridge-cli/01-backend/35-unified-revisions-architecture.md` | States "No `interface{}` usage" as CRITICAL rule |
| `02-spec/22-ai-bridge-cli/01-backend/11-observability.md` | States "No `interface{}` or `map[string]interface{}` usage" |
| `02-spec/22-ai-bridge-cli/01-backend/19-ai-seo-variable-system.md` | States "No `map[string]any`" as CRITICAL rule |
| `02-spec/22-ai-bridge-cli/01-backend/12-settings-service.md` | Shows remediated settings service — references `interface{}` only in doc comments explaining what was replaced |
| `02-spec/22-ai-bridge-cli/01-backend/32-tool-delegation.md` | States "No `interface{}` or `map[string]interface{}` usage" |

---

## 🟡 LEGITIMATE — 3rd-Party / External API Patterns (ADD COMMENTS)

These use `interface{}` because the external library API requires it (e.g., LangChain Go, Qdrant client):

| File | Library/Reason | Action |
|------|---------------|--------|
| `02-spec/60-ai-research/04-rag-memory-systems-complete-guide.md` | LangChain Go `chain.Call()` requires `map[string]interface{}` | Add `// ALLOWED: LangChain Go API` |
| `02-spec/60-ai-research/01-additional-vector-databases-and-tools-guide.md` | Raw OpenAI API JSON + Qdrant client | Add `// ALLOWED: external API` |
| `02-spec/60-ai-research/03-rag-programming-language-analysis.md` | LangChain Go `chain.Call()` | Add `// ALLOWED: LangChain Go API` |
| `02-spec/60-ai-research/05-rag-memory-training-and-go-implementation-guide.md` | LangChain Go + entity attributes (schemaless by design) | Add `// ALLOWED: LangChain Go API` |
| `02-spec/20-gsearch-cli/01-backend/43-faq-discovery-ai-overview.md` (JSON-LD parsing only) | JSON-LD `application/ld+json` — schema is truly dynamic | Add `// ALLOWED: dynamic JSON-LD schema` |

---

## 🔵 ALREADY-REMEDIATED EXEMPLARS (NO FIX NEEDED)

AI-Bridge CLI files that already show the correct typed pattern and only mention `interface{}` in CRITICAL prohibition notes:

- `02-spec/22-ai-bridge-cli/01-backend/12-settings-service.md`
- `02-spec/22-ai-bridge-cli/01-backend/11-observability.md`
- `02-spec/22-ai-bridge-cli/01-backend/32-tool-delegation.md`
- `02-spec/22-ai-bridge-cli/01-backend/35-unified-revisions-architecture.md`
- `02-spec/22-ai-bridge-cli/01-backend/19-ai-seo-variable-system.md`

---

## 🔴 MUST-FIX Files — Grouped by Module

### A. Settings Services (~4 files, HIGH PRIORITY — pattern sets the standard)

These SettingsService specs use `interface{}` for Get/Update/GetMap. The ai-bridge-cli version (12-settings-service.md) shows the correct remediated pattern using `SettingValue` union struct and generics.

| File | Matches | Fix Pattern |
|------|---------|-------------|
| `02-spec/20-gsearch-cli/01-backend/21-settings-service.md` | ~30 | Use `SettingValue` union + `GetTyped[T]()` generic |
| `02-spec/21-brun-cli/01-backend/17-settings-service.md` | ~15 | Same as above |
| `02-spec/28-shared-cli-frontend/03-settings-service.md` | ~12 | Same as above |
| `02-spec/07-seedable-config-architecture/00-overview.md` | ~5 | Use typed `ConfigEntry` struct |

### B. Event Bus / EventBus.Publish() calls (~12 files, HIGH PRIORITY)

Pattern: `eventBus.Publish("event:name", map[string]interface{}{...})` — should use typed event payload structs.

| File | Matches |
|------|---------|
| `02-spec/11-spec-management-software/05-features/05-voice-input/04-voice-processing-pipeline.md` | ~8 |
| `02-spec/11-spec-management-software/05-features/24-code-generation-system/21-suggestions-system.md` | ~4 |
| `02-spec/11-spec-management-software/05-features/24-code-generation-system/29-long-chain-events.md` | ~6 |
| `02-spec/11-spec-management-software/05-features/06-ai-integration/05-instruction-segmentation.md` | ~3 |
| `02-spec/11-spec-management-software/05-features/08-consistency-checker/02-consistency-checker-implementation.md` | ~4 |

**Fix:** Create typed event payload structs (e.g., `VoiceChunkStartedEvent`, `SuggestionCreatedEvent`).

### C. GORM `.Updates(map[string]interface{}{...})` calls (~10 files)

Pattern: `db.Model(&X{}).Updates(map[string]interface{}{...})` — should use typed update structs.

| File | Matches |
|------|---------|
| `02-spec/11-spec-management-software/05-features/24-code-generation-system/29-long-chain-events.md` | ~4 |
| `02-spec/11-spec-management-software/05-features/06-ai-integration/05-instruction-segmentation.md` | ~2 |
| `02-spec/07-seedable-config-architecture/00-overview.md` | ~2 |
| `02-spec/28-shared-cli-frontend/03-settings-service.md` | ~2 |

**Fix:** Use typed struct in `.Updates()` — GORM accepts structs directly.

### D. API Response / WebSocket payload with `interface{}` fields (~8 files)

| File | Matches |
|------|---------|
| `02-spec/20-gsearch-cli/01-backend/48-unified-rest-api.md` | ~8 |
| `02-spec/28-shared-cli-frontend/02-websocket-protocol.md` | ~4 |
| `02-spec/28-shared-cli-frontend/09-deploy-folder.md` | ~5 |
| `02-spec/20-gsearch-cli/01-backend/54-model-decomposition.md` | ~2 |
| `02-spec/20-gsearch-cli/01-backend/59-provider-integration.md` | ~2 |

**Fix:** Use generics `APIResponse[T any]` or typed payload structs.

### E. Observability / Health Check metadata (~3 files)

| File | Matches |
|------|---------|
| `02-spec/21-brun-cli/01-backend/15-observability.md` | ~10 |
| `02-spec/21-brun-cli/01-backend/06-error-handling.md` | ~3 |

**Fix:** Use typed `HealthMetadata` struct (ai-bridge-cli `11-observability.md` shows the pattern).

### F. Testing / JSON parsing with `map[string]interface{}` (~4 files)

| File | Matches |
|------|---------|
| `02-spec/21-brun-cli/01-backend/13-testing-strategy.md` | ~4 |
| `02-spec/11-spec-management-software/05-features/23-build-runner-cli/13-testing-strategy.md` | ~3 |
| `02-spec/11-spec-management-software/05-features/22-golang-search-cli/12-testing-strategy.md` | ~4 |

**Fix:** Define typed response structs for test assertions instead of `var parsed map[string]interface{}`.

### G. Remaining spec-management-software features (~25+ files)

Large group of feature specs using `interface{}`/`map[string]any` in code blocks:

| File | Primary Violation |
|------|------------------|
| `02-spec/11-spec-management-software/05-features/00-security-cross-cutting.md` | `redactSensitive(data map[string]interface{})` |
| `02-spec/11-spec-management-software/05-features/26-ai-code-generation/10-agentic-search.md` | `modelPool map[string]interface{}` |
| `02-spec/11-spec-management-software/05-features/26-ai-code-generation/08-history-logger.md` | Metadata fields |
| `02-spec/11-spec-management-software/13-shared-packages/06-pkg-database.md` | `map[string]any` in error context |
| `02-spec/11-spec-management-software/14-microservices/21-integration-tests.md` | `Config: map[string]any{...}` |
| `02-spec/07-seedable-config-architecture/03-rag-validation-helpers.md` | `ValidatePartial(updates map[string]any)`, JSON response encoding |
| `02-spec/20-gsearch-cli/05-ai-bridge-integration.md` | `map[string]any{"results": []any{}}` |
| `02-spec/20-gsearch-cli/01-backend/43-faq-discovery-ai-overview.md` (non-JSON-LD parts) | `Metadata: map[string]any{...}` in result structs |
| *(~17 more files in 02-spec/11-spec-management-software/05-features/)* | Various event/metadata/config patterns |

---

## Recommended Fix Order

| Priority | Group | Files | Effort | Impact |
|----------|-------|-------|--------|--------|
| 1 | **Settings Services** (A) | 4 | ~30min | Sets the universal pattern for all CLIs |
| 2 | **Event Bus payloads** (B) | 12 | ~30min | Eliminates the most common violation pattern |
| 3 | **GORM `.Updates()`** (C) | 10 | ~15min | Mechanical — replace map with struct |
| 4 | **API/WebSocket payloads** (D) | 8 | ~20min | Use generics pattern |
| 5 | **Observability** (E) | 3 | ~10min | Copy ai-bridge pattern |
| 6 | **Test JSON parsing** (F) | 4 | ~10min | Define response structs |
| 7 | **Remaining features** (G) | 25+ | ~30min | Mixed patterns, case-by-case |
| 8 | **ALLOWED comments** (🟡) | 5 | ~5min | Add justification comments |

**Total estimated effort:** ~2.5h for full remediation

---

## Reference Patterns (from already-remediated ai-bridge-cli)

### Settings Service → `SettingValue` union
```go
type SettingValue struct {
    StringVal  *string   `json:"stringVal,omitempty"`
    FloatVal   *float64  `json:"floatVal,omitempty"`
    IntVal     *int      `json:"intVal,omitempty"`
    BoolVal    *bool     `json:"boolVal,omitempty"`
    StringList []string  `json:"stringList,omitempty"`
    MapVal     map[string]string `json:"mapVal,omitempty"`
}
```

### Event Bus → typed payload struct
```go
type VoiceChunkStartedEvent struct {
    ChunkID string `json:"chunkId"`
    Index   int    `json:"index"`
}
eventBus.Publish("voice:chunk:started", VoiceChunkStartedEvent{...})
```

### GORM Updates → typed struct
```go
type ChainStepProgress struct {
    Progress      float64 `gorm:"column:progress"`
    ProgressLabel string  `gorm:"column:progress_label"`
}
db.Model(&ChainStep{}).Where("id = ?", id).Updates(ChainStepProgress{...})
```

### Health Check → typed metadata
```go
type DatabaseHealthMeta struct {
    OpenConnections int `json:"open_connections"`
    InUse           int `json:"in_use"`
}
```
