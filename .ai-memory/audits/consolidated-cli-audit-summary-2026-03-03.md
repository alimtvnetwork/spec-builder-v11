# Consolidated CLI Audit Summary — Side-by-Side Comparison

**Version:** 1.0.0  
**Generated:** 2026-03-03  
**Status:** All 9 CLI tools at 100% compliance

---

## 1. At-a-Glance Comparison

| Attribute | GSearch | BRun | AI Bridge | Nexus Flow | Spec Reverse | WP SEO Publish | AI Transcribe | WP Plugin Builder | WP Plugin Publish |
|-----------|---------|------|-----------|------------|--------------|----------------|---------------|-------------------|-------------------|
| **Prefix** | GS | BR | AB | NF | SRC | WSP | AIT | WPB | WPP |
| **Binary** | `gsearch` | `brun` | `aibridge` | `nexusflow` | `specrev` | `wpseo` | `aitranscribe` | `wpb` | `wpp` |
| **Version Audited** | 2.2.0 | 2.3.0 | 3.1.0 | 2.2.0 | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 |
| **Audit Date** | 2026-02-04 | 2026-02-04 | 2026-02-05 | 2026-02-05 | 2026-02-05 | 2026-02-05 | 2026-02-05 | 2026-02-06 | 2026-03-03 |
| **Total Checks** | 39 | 39 | 44 | 41 | 39 | 39 | 39 | 39 | 39 |
| **Pass / Fail** | 39/0 | 39/0 | 44/0 | 41/0 | 39/0 | 39/0 | 39/0 | 39/0 | 39/0 |
| **N/A** | 1 | 1 | 0 | 1 | 1 | 1 | 1 | 1 | 1 |
| **Score** | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |

---

## 2. Error Code Ranges

| CLI Tool | Allocated Range | Domains | Width |
|----------|----------------|---------|-------|
| GSearch CLI | 7000–7919 | Parser, Movie, BI Suite | 920 |
| BRun CLI | 7100–7599 | CLI, Config, Execution, Port, Health | 500 |
| AI Bridge CLI | 9000–9999 + 19000–19049 | Core, Input, Backend, RAG, SEO, Reasoning | 1050 |
| Nexus Flow CLI | 8000–8349 | Canvas, Workflow, Execution, State | 350 |
| Spec Reverse CLI | 11000–11999 | Analysis, AST, Output, Patterns | 1000 |
| WP SEO Publish CLI | 12000–12599 | Connection, Publishing, AI Bridge, Variables | 600 |
| AI Transcribe CLI | 14000–14499 | STT, TTS, WebSocket, Models | 500 |
| WP Plugin Builder | 10000–10499 | Plugin Generation, Templates, Export | 500 |
| WP Plugin Publish | 13000–13499 | SVN, Release, Version Management | 500 |

**Note:** BRun (7100–7599) is allocated as a sub-range within the GSearch super-range (7000–7919). AI Bridge has a secondary range (19000–19049) for Lovable Reasoning.

---

## 3. Database Standards Breakdown

| Requirement | GS | BR | AB | NF | SRC | WSP | AIT | WPB | WPP |
|-------------|:--:|:--:|:--:|:--:|:---:|:---:|:---:|:---:|:---:|
| DBOperation Wrapper | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| ExpectRows on writes | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| ORM-Only (no raw SQL) | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| Relationship-First | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| PascalCase columns | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| SQLite WAL mode | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| 7-field structured log | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| FTS5 exceptions | N/A | N/A | — | N/A | N/A | N/A | N/A | N/A | N/A |

---

## 4. Seedable Configuration Breakdown

| Requirement | GS | BR | AB | NF | SRC | WSP | AIT | WPB | WPP |
|-------------|:--:|:--:|:--:|:--:|:---:|:---:|:---:|:---:|:---:|
| config.seed.json exists | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| Typed constants (no magic strings) | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| GetString accessor | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| GetInt accessor | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| GetBool accessor | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| GetStringArray accessor | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| Version-gated seeding | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| IsUserModified tracking | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| Settings history table | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |

---

## 5. Infrastructure Breakdown

| Requirement | GS | BR | AB | NF | SRC | WSP | AIT | WPB | WPP |
|-------------|:--:|:--:|:--:|:--:|:---:|:---:|:---:|:---:|:---:|
| Init order (Config→Dirs→DB→Services→App) | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| /health/live | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| /health/ready | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| Prometheus metrics | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| OpenTelemetry tracing | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |
| Swagger /swagger/ endpoint | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ | ☑ |

---

## 6. Key Differences Between Tools

### Check Count Variance

| Tool | Total Checks | Why Different |
|------|:------------:|---------------|
| AI Bridge CLI | **44** | Additional checks for multi-backend adapter pattern (4 backend types) and extended health endpoint verification |
| Nexus Flow CLI | **41** | Additional checks for canvas state persistence and workflow execution engine |
| All others | **39** | Standard audit scope with 1 N/A (FTS5 exception not applicable) |

### Database Architecture

| Pattern | Tools |
|---------|-------|
| **Single DB** | GSearch, BRun, Spec Reverse, WP SEO Publish, AI Transcribe, WP Plugin Publish |
| **Dual DB** (root + per-project) | WP Plugin Builder |
| **Split DB** (root + session) | AI Bridge, Nexus Flow |

### AI Integration

| Level | Tools |
|-------|-------|
| **Primary AI tool** | AI Bridge CLI (LLM adapter layer) |
| **AI consumer** | WP Plugin Builder, WP SEO Publish, AI Transcribe |
| **No AI dependency** | GSearch, BRun, Nexus Flow, Spec Reverse, WP Plugin Publish |

### Maturity (Version at Audit)

| Tier | Tools | Version |
|------|-------|---------|
| **Mature** | GSearch (2.2), BRun (2.3), AI Bridge (3.1), Nexus Flow (2.2) | 2.x–3.x |
| **Initial release** | Spec Reverse, WP SEO Publish, AI Transcribe, WP Plugin Builder, WP Plugin Publish | 1.0.0 |

---

## 7. Non-Blocking Recommendations

| Tool | Recommendation | Priority |
|------|----------------|----------|
| GSearch CLI | Add BI Suite error codes to main registry doc | Low |
| BRun CLI | Consolidate seed files to central directory | Low |
| AI Bridge CLI | Add explicit DBOperation wrapper cross-reference in docs | Low |
| Nexus Flow CLI | Add explicit DBOperation wrapper cross-reference in docs | Low |
| WP Plugin Builder | Document dual-database migration strategy | Medium |
| WP Plugin Publish | Align audit date with next quarterly cycle (Q2 2026) | Low |

---

## 8. Audit Report Index

| CLI Tool | Report |
|----------|--------|
| GSearch CLI | [gsearch-cli-compliance-audit-2026-02-04.md](./gsearch-cli-compliance-audit-2026-02-04.md) |
| BRun CLI | [brun-cli-compliance-audit-2026-02-04.md](./brun-cli-compliance-audit-2026-02-04.md) |
| AI Bridge CLI | [ai-bridge-cli-compliance-audit-2026-02-05.md](./ai-bridge-cli-compliance-audit-2026-02-05.md) |
| Nexus Flow CLI | [nexus-flow-cli-compliance-audit-2026-02-05.md](./nexus-flow-cli-compliance-audit-2026-02-05.md) |
| Spec Reverse CLI | [spec-reverse-cli-compliance-audit-2026-02-05.md](./spec-reverse-cli-compliance-audit-2026-02-05.md) |
| WP SEO Publish CLI | [wp-seo-publish-cli-compliance-audit-2026-02-05.md](./wp-seo-publish-cli-compliance-audit-2026-02-05.md) |
| AI Transcribe CLI | [ai-transcribe-cli-compliance-audit-2026-02-05.md](./ai-transcribe-cli-compliance-audit-2026-02-05.md) |
| WP Plugin Builder | [wp-plugin-builder-cli-enum-compliance-audit-2026-02-06.md](./wp-plugin-builder-cli-enum-compliance-audit-2026-02-06.md) |
| WP Plugin Publish | [wp-plugin-publish-cli-compliance-audit-2026-03-03.md](./wp-plugin-publish-cli-compliance-audit-2026-03-03.md) |

---

## Related Documents

| Document | Path |
|----------|------|
| Compliance Dashboard | [00-compliance-dashboard.md](./00-compliance-dashboard.md) |
| Quarterly Re-Audit Schedule | [quarterly-reaudit-schedule.md](./quarterly-reaudit-schedule.md) |
| Audit Template | `.lovable/memories/standards/cli-compliance-audit-template.md` |
| Compliance Registry | `.lovable/memories/standards/cli-compliance-registry-complete.md` |
| Error Code Allocations | `.lovable/memories/technical/error-code-registry.md` |

---

*Consolidated comparison generated 2026-03-03. Next scheduled comparison: Q2 2026.*
