# Naming Convention Remediation Plan

**Version:** 2.0.0  
**Created:** 2026-03-09  
**Purpose:** Systematic remediation of naming convention inconsistencies across ecosystem specs

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Files Affected** | 25+ |
| **Primary Violations** | camelCase, snake_case, lowercase in JSON/API |
| **Target Convention** | PascalCase for all public identifiers |
| **Estimated Effort** | 4 phases, ~2-3 hours total |
| **Priority** | High (blocks AI-handoff readiness) |

---

## Standard Reference

### Mandatory PascalCase Applies To:

| Context | Example (Wrong → Right) |
|---------|-------------------------|
| JSON field names | `userId` → `UserId` |
| API request/response | `api_key` → `ApiKey` |
| Database JSON columns | `created_at` → `CreatedAt` |
| Go struct `json:` tags | `json:"userId"` → `json:"UserId"` |
| Query parameters | `start_date` → `StartDate` |
| Config seed keys | `ollamaBaseUrl` → `OllamaBaseUrl` |

### Exceptions (Allowed Non-PascalCase):

| Context | Convention | Reason |
|---------|------------|--------|
| URL paths | lowercase-kebab | HTTP convention |
| CLI flags | lowercase-kebab | Shell convention |
| Go private fields | camelCase | Go idiom |
| SQL table/column names | PascalCase | Our standard |
| File names (docs) | lowercase-kebab | Documentation standard |

---

## Phase 1: AI Bridge CLI (Critical)

### 1.1 Vector Database Integration

**File:** `02-spec/27-ai-bridge-cli/01-backend/51-vector-database-integration.md`

| Line Range | Current | Required |
|------------|---------|----------|
| 440-460 | `ollamaBaseUrl`, `ollamaModel` | `OllamaBaseUrl`, `OllamaModel` |
| 461-470 | `openaiModel`, `openaiApiKey` | `OpenaiModel`, `OpenaiApiKey` |
| 471-490 | `minSimilarityScore`, `cacheEnabled` | `MinSimilarityScore`, `CacheEnabled` |
| 491-510 | `criticalWeight`, `importantWeight` | `CriticalWeight`, `ImportantWeight` |

**Violations:**
```json
// WRONG (current)
{
  "vector": {
    "ollamaBaseUrl": "http://localhost:11434",
    "ollamaModel": "nomic-embed-text"
  }
}

// CORRECT (target)
{
  "Vector": {
    "OllamaBaseUrl": "http://localhost:11434",
    "OllamaModel": "nomic-embed-text"
  }
}
```

### 1.2 Long-Chain Command System

**File:** `02-spec/27-ai-bridge-cli/01-backend/50-long-chain-command-system.md`

| Section | Violations | Fix |
|---------|------------|-----|
| StepResult struct | `json:"stepId"` | `json:"StepId"` |
| ExecutionResponse | `json:"executionId"` | `json:"ExecutionId"` |
| Config examples | `maxParallelSteps` | `MaxParallelSteps` |

### 1.3 GSearch Context Integration

**File:** `02-spec/27-ai-bridge-cli/01-backend/40-gsearch-context-integration.md`

| Section | Check For |
|---------|-----------|
| Request/Response JSON | camelCase field names |
| Configuration examples | snake_case keys |
| Go struct tags | Lowercase json tags |

---

## Phase 2: GSearch CLI

### 2.1 Unified REST API

**File:** `02-spec/25-gsearch-cli/01-backend/48-unified-rest-api.md`

| Line | Current | Required |
|------|---------|----------|
| 187 | `c.Query("api_key")` | `c.Query("ApiKey")` |
| 190 | `c.Set("api_key", ...)` | `c.Set("ApiKey", ...)` |
| Form tags | `form:"query"` | `form:"Query"` |

**Query Parameter Convention:**
```go
// WRONG
type SearchRequest struct {
    Query      string `form:"query"`
    StartDate  string `form:"start_date"`
    MaxResults int    `form:"max_results"`
}

// CORRECT
type SearchRequest struct {
    Query      string `form:"Query"`
    StartDate  string `form:"StartDate"`
    MaxResults int    `form:"MaxResults"`
}
```

### 2.2 Model Decomposition

**File:** `02-spec/25-gsearch-cli/01-backend/54-model-decomposition.md`

| Struct | Check Fields |
|--------|--------------|
| EmailInfo | All json tags |
| PhoneInfo | All json tags |
| SocialProfiles | All json tags |
| LocationInfo | All json tags |

### 2.3 Business Intelligence Suite Files

**Files to Review:**
- `02-spec/25-gsearch-cli/01-backend/50-bi-error-codes.md`
- `02-spec/25-gsearch-cli/01-backend/51-bi-validation-checklist.md`
- `02-spec/25-gsearch-cli/01-backend/openapi-bi-suite.yaml`

---

## Phase 3: Supporting CLIs

### 3.1 AI Transcribe CLI

**Files:**

| File | Violations |
|------|------------|
| `10-error-codes.md` | `success`, `error`, `code`, `request_id` |
| `13-model-download.md` | `installed`, `last_used`, `is_default` |
| `08-database-schema.md` | `sample_rate`, `audio_format`, `model_id` |
| `06-voice-commands.md` | lowercase JSON keys |
| `07-voice-cloning.md` | snake_case JSON keys |

**Error Response Fix:**
```json
// WRONG (current)
{
  "success": false,
  "error": {
    "code": 14100,
    "constant": "ERR_STT_INIT_FAILED",
    "message": "...",
    "request_id": "abc123"
  }
}

// CORRECT (target)
{
  "Success": false,
  "Error": {
    "Code": 14100,
    "Constant": "ERR_STT_INIT_FAILED",
    "Message": "...",
    "RequestId": "abc123"
  }
}
```

### 3.2 WP SEO Publish CLI

**File:** `02-spec/36-wp-seo-publish-cli/01-backend/07-api-endpoints.md`

| Current | Required |
|---------|----------|
| `siteUrl` | `SiteUrl` |
| `seoKeywords` | `SeoKeywords` |
| `aiPrompt` | `AiPrompt` |
| `outputFormat` | `OutputFormat` |
| `linkDensity` | `LinkDensity` |
| `generatedSlugs` | `GeneratedSlugs` |

### 3.3 WP Plugin Builder

**File:** `02-spec/35-wp-plugin-builder/11-api-interface.md`

| Current | Required |
|---------|----------|
| `corsOrigins` | `CorsOrigins` |
| `rateLimit` | `RateLimit` |
| `requestsPerMinute` | `RequestsPerMinute` |
| `apiKey` | `ApiKey` |
| `createdAt` | `CreatedAt` |

---

## Phase 4: Research & Documentation

### 4.1 AI Research Folder

**Folder:** `02-spec/60-ai-research/`

| File | Status |
|------|--------|
| `RAG_Programming_Language_Analysis.md` | Review JSON examples |
| `Complete_AI_Database_and_Framework_Ecosystem_Guide.md` | Review JSON examples |
| `Additional_Vector_Databases_and_Tools_Guide.md` | Review JSON examples |

**Note:** Research docs may contain external library examples with their native conventions. Add disclaimers where external API examples differ from our standard.

### 4.2 Update Standards Documentation

**Files to Update:**

| File | Action |
|------|--------|
| `.ai-memory/memories/training/01-conventions.md` | Add explicit JSON/API examples |
| `context-for-ai.md` | Reference remediation completion |
| `.ai-memory/memories/standards/00-database-standards-hub.md` | Cross-reference JSON naming |

---

## Verification Checklist

### Per-File Verification

```bash
# Grep for common violations
grep -rn '"[a-z][a-zA-Z]*":' spec/  # camelCase JSON keys
grep -rn '"[a-z_]*":' spec/         # snake_case JSON keys
grep -rn 'json:"[a-z]' spec/        # lowercase json tags
grep -rn "form:\"[a-z_]" spec/      # lowercase form tags
```

### Automated Checks

| Check | Command |
|-------|---------|
| JSON keys in markdown | `grep -E '"\w+":' *.md | grep -v '"[A-Z]'` |
| Go json tags | `grep -E 'json:"[a-z]' *.md` |
| Form tags | `grep -E 'form:"[a-z]' *.md` |

---

## Completion Criteria

| Criterion | Target |
|-----------|--------|
| All JSON examples use PascalCase | 100% |
| All `json:` tags use PascalCase | 100% |
| All `form:` tags use PascalCase | 100% |
| All config.seed.json keys PascalCase | 100% |
| Standards docs updated | Complete |
| Memory index updated | Complete |

---

## Priority Order

1. **Immediate** (blocks implementation):
   - `51-vector-database-integration.md`
   - `50-long-chain-command-system.md`
   - `48-unified-rest-api.md`

2. **High** (affects API contracts):
   - `54-model-decomposition.md`
   - AI Transcribe error codes
   - WP SEO Publish endpoints

3. **Medium** (internal consistency):
   - Database schema JSON columns
   - Research folder examples

4. **Low** (documentation only):
   - Training materials
   - Memory index cross-references

---

## Cross-References

| Document | Purpose |
|----------|---------|
| `.ai-memory/memories/training/01-conventions.md` | Naming convention source |
| `02-02-spec/99-consistency-report.md` | Prior consistency audit |
| `.ai-memory/memories/workflow/spec-audit-consistency-review.md` | Memory tracking |

---

*Created as part of 8-phase improvement roadmap - Phase 3 prerequisite*
