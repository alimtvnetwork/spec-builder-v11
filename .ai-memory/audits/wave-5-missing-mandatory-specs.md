# Wave 5 Remediation: Missing Mandatory Specs

**Date:** 2026-02-07  
**Status:** Complete  
**Scope:** Add Settings Service, Observability, and Reset API specs for CLIs that lacked them

---

## Gap Analysis

| CLI | Settings Service | Observability | Reset API | Status |
|-----|:---------------:|:-------------:|:---------:|--------|
| GSearch | ✅ existed | ✅ existed | ❌ → ✅ | 1 added |
| BRun | ✅ existed | ✅ existed | ✅ existed | Complete |
| AI Bridge | ✅ existed | ✅ existed | ✅ existed | Complete |
| Nexus Flow | ✅ existed | ✅ existed | ✅ existed | Complete |
| WP Plugin Builder | ❌ → ✅ | ❌ → ✅ | ❌ → ✅ | 3 added |
| Spec Reverse | ❌ → ✅ | ❌ → ✅ | ❌ → ✅ | 3 added |
| WP SEO Publish | ❌ → ✅ | ❌ → ✅ | ❌ → ✅ | 3 added |
| AI Transcribe | ❌ → ✅ | ❌ → ✅ | ❌ → ✅ | 3 added |

---

## Files Created (13 total)

### GSearch CLI — 1 file
| File | Description |
|------|-------------|
| `02-spec/20-gsearch-cli/01-backend/24-reset-api.md` | Reset API with scopes: all, cache, history, rag, bi, crawler. Error codes GS-7080–7086. |

### AI Transcribe CLI — 3 files
| File | Description |
|------|-------------|
| `02-spec/26-ai-transcribe-cli/01-backend/15-settings-service.md` | Settings with categories: AudioDefaults, SttProviders, TtsDefaults, VoiceCloning, ModelDownload, Server. Error codes 14300–14307. |
| `02-spec/26-ai-transcribe-cli/01-backend/16-observability.md` | Prometheus metrics (aitrans namespace): STT/TTS latency, voice cloning, model downloads, realtime sessions. Health checks for providers and model storage. |
| `02-spec/26-ai-transcribe-cli/01-backend/17-reset-api.md` | Reset API with scopes: all, history, models, voices, sessions, cache. Error codes 14350–14356. |

### WP SEO Publish CLI — 3 files
| File | Description |
|------|-------------|
| `02-spec/14-wp-seo-publish-cli/01-backend/10-settings-service.md` | Settings with categories: PublishDefaults, AiBridge, GSearch, Variables, Automation, Sitemap. Error codes 12500–12507. |
| `02-spec/14-wp-seo-publish-cli/01-backend/11-observability.md` | Prometheus metrics (wpseo namespace): publish latency, WP API calls, AI Bridge generation, automation runs. Health checks for WordPress connections. |
| `02-spec/14-wp-seo-publish-cli/01-backend/13-reset-api.md` | Reset API with scopes: all, website, publications, variables, automations, cache. Error codes 12550–12556. Complements existing import-export reset. |

### WP Plugin Builder — 3 files
| File | Description |
|------|-------------|
| `02-spec/31-wp-plugin-builder/16-settings-service.md` | Settings with categories: ProjectDefaults, CodeGeneration, RagIndexing, PresetDefaults, AiBridge. Error codes 10800–10807. |
| `02-spec/31-wp-plugin-builder/17-observability.md` | Prometheus metrics (wpb namespace): generation latency, RAG indexing/search, preset ingestion, AI Bridge requests. |
| `02-spec/31-wp-plugin-builder/18-reset-api.md` | Reset API with scopes: all, project, presets, rag, history. Error codes 10900–10906. |

### Spec Reverse CLI — 3 files
| File | Description |
|------|-------------|
| `02-spec/25-spec-reverse-cli/01-backend/04-settings-service.md` | Settings with categories: AnalysisDefaults, AiBridge, OutputDefaults, RagDefaults. Error codes 11500–11507. |
| `02-spec/25-spec-reverse-cli/01-backend/05-observability.md` | Prometheus metrics (src namespace): analysis latency, symbol extraction, spec generation, RAG search. |
| `02-spec/25-spec-reverse-cli/01-backend/06-reset-api.md` | Reset API with scopes: all, analysis, specs, rag, cache. Error codes 11600–11606. |

---

## Standards Compliance

All 13 new specs follow:
- **SettingsService pattern**: Typed accessors, sync.Map cache, version-gated seeding (Golden Rule), `Setting` GORM model with `IsUserModified` flag
- **Observability pattern**: Prometheus metrics with namespace/subsystem, health check endpoints (/health/live, /health/ready), zerolog structured logging with CorrelationId
- **Reset API pattern**: 2-step flow (request → confirm), 5-minute TTL, preview with affected items, cancel support, `ResetRequest` GORM model
- **PascalCase**: All JSON keys, Go struct fields, API payloads
- **Error codes**: Allocated within each CLI's designated range per the Error Registry

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Wave 1 (Error Registry) | `.lovable/audits/wave-1-error-registry-remediation.md` |
| Wave 2 (Port Sync) | `.lovable/audits/wave-2-port-synchronization-remediation.md` |
| Wave 3 (PascalCase) | `.lovable/audits/wave-3-pascalcase-remediation.md` |
| Wave 4 (ORM Migration) | `.lovable/audits/wave-4-orm-migration-remediation.md` |
| CLI Documentation Requirements | `.lovable/memories/standards/cli-documentation-requirements.md` |
