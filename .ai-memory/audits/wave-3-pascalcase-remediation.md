# Wave 3 Remediation: PascalCase Normalization (Batches 1-3)

**Date:** 2026-02-07  
**Status:** Complete (All 3 batches)
**Scope:** PascalCase violations in JSON tags, YAML keys, config keys, and API examples

---

## Batch 1 — Completed (120+ key conversions)

### Nexus Flow CLI — 8 files, ~45 keys

| File | Changes |
|------|---------|
| `08-settings-service.md` | All 20 setting keys → PascalCase (e.g., `workflow.defaultTimeout` → `Workflow.DefaultTimeout`), seed JSON keys, Go constants |
| `02-frontend/02-frontend-architecture.md` | 7 config.seed.json keys → PascalCase (`maxConcurrentNodes` → `MaxConcurrentNodes`, `snapToGrid` → `SnapToGrid`, etc.), powershell.json ports |
| `03-deploy/02-deployment-guide.md` | Log format keys → PascalCase (`workflow_id` → `WorkflowId`, `duration_ms` → `DurationMs`) |
| `01-backend/03-openapi-specification.md` | 5 OpenAPI properties → PascalCase (`fromStageId` → `FromStageId`, `includeExecutions` → `IncludeExecutions`, `builtIn` → `BuiltIn`) |

### AI Bridge CLI — 6 files, ~75+ keys

| File | Changes |
|------|---------|
| `01-architecture.md` | NormalizedRequest (15 fields), Response (6 fields), StreamChunk, InputSource, ContextItem, BatchItem — all JSON tags removed (implicit PascalCase) |
| `02-input-formats.md` | MarkdownFrontmatter (9 YAML tags), JSONRequest (15 fields), YAMLRequest (12 YAML tags), CSVConfig (10 YAML tags) — all → PascalCase |
| `04-api-interface.md` | All API JSON examples → PascalCase: /generate, /chat/sessions, /rag/documents, /rag/search, /generate/image, /voice/transcribe, /voice/synthesize, /import |
| `05-error-codes.md` | BridgeError struct (7 fields) tags removed, API error response → PascalCase |
| `06-configuration.md` | Full config.yaml YAML keys → PascalCase (~50 keys: `models` → `Models`, `daemon` → `Daemon`, etc.), Config Go struct YAML tags |
| `03-startup-modes.md` | Daemon YAML section (~25 keys) → PascalCase |

---

## Batch 2 — Completed (~230 key conversions)

### BRun CLI — 3 files, ~60 keys

| File | Changes |
|------|---------|
| `03-configuration.md` | Full JSON schema keys → PascalCase (190 keys: `runtimes` → `Runtimes`, `packageManager` → `PackageManager`, `healthCheck` → `HealthCheck`, etc.), example config, env var table, config keys summary |
| `10-data-models.md` | GORM Where clauses → PascalCase columns (`run_id` → `RunId`, `profile_name` → `ProfileName`, `created_at` → `CreatedAt`), raw SQL index names → PascalCase table references |
| `17-settings-service.md` | 12 ConfigCategory constants → PascalCase (`build_defaults` → `BuildDefaults`, `port_ranges` → `PortRanges`, etc.), seed file Category values, API response Category |

### AI Transcribe CLI — 4 files, ~150 keys

| File | Changes |
|------|---------|
| `11-configuration.md` | Full YAML config (~150 keys: `server` → `Server`, `cert_file` → `CertFile`, `rate_limit` → `RateLimit`, `default_provider` → `DefaultProvider`, etc.), Go struct acronyms (`STT` → `Stt`, `HTTP` → `Http`, `GRPC` → `Grpc`), DefaultConfig(), validation code, runtime config API |
| `09-api-interface.md` | Form-data params (`wordTimestamps` → `WordTimestamps`, `tagAudioEvents` → `TagAudioEvents`), query params (`projectId` → `ProjectId`, `includeCloned` → `IncludeCloned`) |
| `12-openapi-spec.md` | Response properties (`voice_id` → `VoiceId`, `estimated_time` → `EstimatedTime`, `estimated_remaining` → `EstimatedRemaining`) |
| `13-model-download.md` | API response JSON (`last_used` → `LastUsed`, `is_default` → `IsDefault`, `model_id` → `ModelId`, `status`/`percent`/`speed` → PascalCase) |

### GSearch CLI — 1 file, ~120 mapstructure tags

| File | Changes |
|------|---------|
| `02-configuration.md` | Full JSON schema → PascalCase (~120 keys), all Go struct `mapstructure` tags → PascalCase (`database` → `Database`, `maxConnections` → `MaxConnections`, etc.), per-engine proxy example |

## Batch 3 — Completed (~105 key conversions)

### WP Plugin Builder — 4 files, ~60 keys

| File | Changes |
|------|---------|
| `03-configuration.md` | Full JSON schema + example config → PascalCase (~40 keys: `version` → `Version`, `seededAt` → `SeededAt`, `database.rootPath` → `Database.RootPath`, etc.), env var table |
| `04-database-schema.md` | All 7 SQL CREATE TABLE statements → PascalCase columns (~50 columns: `projects` → `Projects`, `author_email` → `AuthorEmail`, `content_hash` → `ContentHash`, etc.), all indexes |
| `05-rag-system.md` | RAGConfig struct JSON tags removed, metadata keys → PascalCase (`source_name` → `SourceName`) |
| `11-api-interface.md` | All API JSON payloads → PascalCase (~30 keys: request/response for projects, presets, specs, generation, validation, errors, SSE events, server config) |

### WP SEO Publish — 1 file, ~25 keys

| File | Changes |
|------|---------|
| `07-api-endpoints.md` | All JSON request/response examples → PascalCase (~25 keys: `siteUrl` → `SiteUrl`, `useAI` → `UseAi`, `seoKeywords` → `SeoKeywords`, `outputFormat` → `OutputFormat`, WebSocket messages, automation, variable, reset payloads) |

### Spec Reverse — 2 files, ~30 keys

| File | Changes |
|------|---------|
| `01-architecture.md` | Seedable config keys → PascalCase (`src.database.path` → `Src.Database.Path`), `AIBridgeConfig.URL` → `Url`, configutil calls |
| `03-ai-bridge-integration.md` | All Go struct JSON tags removed (~30 fields: `AIBridgeConfig`, `GenerationRequest`, `ChatMessage`, `ContextBlock`, `RAGChunk`, `CodeSymbol`, `GenerationResponse`, `Usage`, streaming chunk struct) |

### AI Bridge Advanced — 1 file, ~30 keys

| File | Changes |
|------|---------|
| `38-websocket-connection-manager.md` | Full WebSocket config JSON → PascalCase (~30 keys: `websocket` → `Websocket`, `baseDelay` → `BaseDelay`, `pingInterval` → `PingInterval`, `maxSize` → `MaxSize`, `defaultTTL` → `DefaultTtl`, etc.) |

---

## Pattern Reference

### Go Struct Tags — Before/After

```go
// ❌ BEFORE (camelCase tags)
Name string `json:"name"`
MaxTokens int `json:"maxTokens,omitempty"`

// ✅ AFTER (tags removed — PascalCase field name IS the JSON key)
Name string
MaxTokens int `json:",omitempty"`
```

### YAML Config Keys — Before/After

```yaml
# ❌ BEFORE
daemon:
  pidFile: /var/run/app.pid
  rateLimit:
    requestsPerMinute: 60

# ✅ AFTER
Daemon:
  PidFile: /var/run/app.pid
  RateLimit:
    RequestsPerMinute: 60
```

### JSON API Examples — Before/After

```json
// ❌ BEFORE
{"sessionId": "abc", "messageCount": 12, "createdAt": "..."}

// ✅ AFTER  
{"SessionId": "abc", "MessageCount": 12, "CreatedAt": "..."}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Wave 1 (Error Registry) | `.lovable/audits/wave-1-error-registry-remediation.md` |
| Wave 2 (Port Sync) | `.lovable/audits/wave-2-port-synchronization-remediation.md` |
| Naming Convention | `.lovable/memories/style/naming-convention.md` |
