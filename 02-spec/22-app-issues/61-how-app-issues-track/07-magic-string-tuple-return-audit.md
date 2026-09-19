# 07 — Magic String & Tuple Return Compliance Audit

**Created:** 2026-02-26  
**Version:** 1.0.0  
**Status:** Open  
**Severity:** High

---

## Audit Summary

Project-wide scan of all Go API client code across CLI specs for two violation categories:

1. **Magic string HTTP methods** — Raw `"GET"`, `"POST"`, `"DELETE"`, `"PATCH"` literals instead of the `HttpMethod` enum defined in `02-spec/26-brun-cli/01-backend/19-enum-architecture.md`
2. **Tuple returns** — `(*Type, error)` instead of `appfault.Result[T]` or outcome structs with `*appfault.AppError`

---

## Violation Category 1: Magic String HTTP Methods

### Standard

Per memory `architecture/enum-standard`: Magic strings for HTTP methods (`"GET"`, `"POST"`) are **prohibited** and must be implemented as dedicated enums. The canonical `HttpMethod` enum exists in `02-spec/26-brun-cli/01-backend/19-enum-architecture.md`.

### Findings

| CLI | Files with violations | ~Violation count | Key files |
|-----|-----------------------|------------------|-----------|
| **gsearch-cli** | 7 | ~30 | `04-html-parser.md`, `07-bing-search.md`, `23-platform-search.md`, `42-multi-engine-search.md`, `59-provider-integration.md`, `12-testing-strategy.md`, `04-testing-ui-page.md` |
| **ai-bridge-cli** | 3 | ~10 | `29-gsearch-url-extraction.md`, `32-tool-delegation.md`, `56-observability.md` |
| **ai-transcribe-cli** | 5 | ~25 | `01-architecture.md`, `03-stt-providers.md`, `04-tts-providers.md`, `07-voice-cloning.md`, `11-configuration.md` |
| **wp-seo-publish-cli** | 4 | ~30 | `02-wordpress-connector.md`, `04-ai-bridge-client.md`, `01-connection-wizard.md`, `03-content-publisher.md` |
| **spec-reverse-cli** | 1 | ~4 | `03-ai-bridge-integration.md` |
| **brun-cli** | 1 | ~2 | `14-implementation-guide.md` (outside enum file) |
| **nexus-flow-cli** | 0 | 0 | ✅ Clean |

**Total: ~101 magic string HTTP method violations across 21 files in 6 CLIs.**

### Exempt matches (not violations)

- `02-spec/26-brun-cli/01-backend/19-enum-architecture.md` — This is the **enum definition** itself (`Get: "GET"` in `variantStrings`)
- `02-spec/31-ai-transcribe-cli/01-backend/11-configuration.md` — CORS config array `Methods: ["GET", "POST", ...]` is a JSON/YAML config value, not Go code
- `02-spec/25-gsearch-cli/01-backend/12-testing-strategy.md` — `httpmock.RegisterResponder("GET", ...)` uses the mock library's string API (borderline; should still use `.String()`)
- `02-spec/25-gsearch-cli/02-frontend/02-frontend-architecture.md` — JSON fixture `"method": "POST"` is data, not Go code
- HTML form `method="post"` in test fixture HTML — not Go code

### Required fix pattern

```go
// ❌ VIOLATION — magic string
req, err := http.NewRequestWithContext(ctx, "GET", url, nil)

// ✅ COMPLIANT — enum usage
req, err := http.NewRequestWithContext(ctx, HttpMethod.Get.String(), url, nil)
```

---

## Violation Category 2: Tuple Returns `(*Type, error)`

### Standard

Per memory `architecture/coding-standards/function-design`: Every function must return exactly one value — either `appfault.Result[T]` or a dedicated outcome struct containing `*appfault.AppError`. Per memory `architecture/coding-standards/go-error-handling`: Go application code must return `*appfault.AppError` exclusively; raw `error` is restricted to library boundaries.

### Findings

| CLI | Files | ~Tuple return signatures | Example functions |
|-----|-------|--------------------------|-------------------|
| **gsearch-cli** | 27 | ~456 | `Search()`, `Extract()`, `Get()`, `Parse()`, `SelectProvider()` |
| **wp-seo-publish-cli** | 7 | ~223 | `CreatePost()`, `CreateCategory()`, `doRequest()`, `ImportCsv()`, `Publish()` |
| **ai-bridge-cli** | 16 | ~199 | `ExecuteTool()`, `Load()`, `StartSession()`, `ExtractUrl()`, `FetchBacklinksStats()` |
| **ai-transcribe-cli** | 9 | ~150 | `Transcribe()`, `Synthesize()`, `CloneVoice()`, `Process()`, `Load()` |
| **brun-cli** | 8 | ~140 | `Execute()`, `CheckPort()`, `ResolvePort()`, `Build()`, `Run()` |
| **nexus-flow-cli** | 2 | ~80 | `Execute()`, `Build()`, `Export()`, `Import()`, `TranscriptToFlow()` |
| **spec-reverse-cli** | 3 | ~50 | `Generate()`, `Parse()`, `Detect()`, `Extract()`, `Analyze()` |

**Total: ~1,298 tuple return violations across 72 files in 7 CLIs.**

### Sub-violations within tuple returns

| Sub-violation | Description | ~Count |
|---------------|-------------|--------|
| `(*Type, error)` — raw `error` | Must be `*appfault.AppError` | ~1,250 |
| `([]Type, error)` — slice + raw error | Must be `appfault.Result[[]Type]` | ~48 |
| `(string, error)` — primitive + raw error | Must be `appfault.Result[string]` | ~30 |

### Required fix pattern

```go
// ❌ VIOLATION — tuple return with raw error
func (c *WordPressClient) CreatePost(req PostCreateRequest) (*Post, error) {
    resp, err := c.doRequest("POST", "/posts", req)
    if err != nil {
        return nil, err
    }
    // ...
    return &post, nil
}

// ✅ COMPLIANT — Result wrapper with AppError
func (c *WordPressClient) CreatePost(req PostCreateRequest) appfault.Result[Post] {
    resp := c.doRequest(HttpMethod.Post, "/posts", req)
    if resp.HasError() {
        return appfault.Fail[Post](resp.Error())
    }
    // ...
    return appfault.Ok(post)
}
```

---

## Compliance Scorecard

| CLI | Magic Strings | Tuple Returns | Overall Grade |
|-----|---------------|---------------|---------------|
| **gsearch-cli** | ❌ ~30 violations | ❌ ~456 violations | **F** |
| **wp-seo-publish-cli** | ❌ ~30 violations | ❌ ~223 violations | **F** |
| **ai-bridge-cli** | ❌ ~10 violations | ❌ ~199 violations | **F** |
| **ai-transcribe-cli** | ❌ ~25 violations | ❌ ~150 violations | **F** |
| **brun-cli** | ⚠️ ~2 violations | ❌ ~140 violations | **F** |
| **nexus-flow-cli** | ✅ Clean | ❌ ~80 violations | **D** |
| **spec-reverse-cli** | ❌ ~4 violations | ❌ ~50 violations | **F** |

**Project-wide: ~101 magic string + ~1,298 tuple return = ~1,399 total violations across 7 CLIs.**

---

## Recommended Remediation Order

1. **`wp-seo-publish-cli/02-wordpress-connector.md`** — Highest density of both violation types in a single file (~25 magic strings + ~20 tuple returns)
2. **`gsearch-cli/01-backend/`** — Largest absolute count; fix search/scrape/API client functions first
3. **`ai-transcribe-cli/01-backend/`** — Provider integration files have concentrated violations
4. **`ai-bridge-cli/01-backend/29-gsearch-url-extraction.md`** — Single file with ~15 magic strings + ~20 tuple returns
5. **`brun-cli`** — Lowest violation count; quickest to bring compliant

---

## Prevention

### Prevention rule

All new Go function signatures in spec code examples **must** use `appfault.Result[T]` (or outcome struct with `*appfault.AppError`) and the `HttpMethod` enum — no raw `error` returns or string HTTP method literals.

### Acceptance criteria

- `grep -rn '"GET"\|"POST"\|"PUT"\|"DELETE"\|"PATCH"' spec/*/01-backend/*.md` returns only exempt matches (enum definitions, CORS config, HTML fixtures)
- `grep -rn 'func.*) (.*,.* error)' spec/*/01-backend/*.md` returns zero matches in application-layer code

---

## Done Checklist

- [x] Audit scan completed across all 7 CLI specs
- [x] Violations categorized with file-level detail
- [x] Exempt patterns identified and excluded
- [x] Fix patterns documented with before/after examples
- [x] Remediation priority order established
- [ ] Remediation execution (pending — separate task)
