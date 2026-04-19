# Wave 2 Remediation: Port Synchronization

**Date:** 2026-02-07  
**Status:** Complete  
**Scope:** All port violations identified in phases 11-17

---

## Canonical Port Registry

| CLI Tool | Canonical Port | Worker/Secondary | Frontend |
|----------|---------------|------------------|----------|
| Spec Management | 5010 | — | Vite default |
| GSearch | 5020 | — | Vite default |
| BRun | 5030 | — | Vite default |
| AI Bridge | 5040 | 5041, 5042 (fallback) | 5175 |
| Nexus Flow | 5050 | 5051 (worker) | 5176 |
| WP SEO Publish | 5060 | — | — |
| WP Plugin Builder | 5070 | — | — |
| Spec Reverse | 5080 | — | — |
| AI Transcribe | 8030 | 8031 (WS), 8032 (metrics) | — (exception) |

---

## Changes Applied (52 edits across 25 files)

### Nexus Flow CLI (5050/5051) — 10 files

| File | Old Port(s) | New Port(s) | Change |
|------|------------|-------------|--------|
| `01-backend/01-core-specification.md` L4 | 8085 | 5050 | Header |
| `01-backend/01-core-specification.md` L33 | :8085 | :5050 | Diagram |
| `01-backend/01-core-specification.md` L63-64 | :8082, :8081 | :5040, :5010 | Dependency diagram |
| `01-backend/01-core-specification.md` L2527 | localhost:8082 | localhost:5040 | AI Bridge config |
| `01-backend/00-microservices-context.md` L29 | 9000 | 5050 | Service Registry |
| `01-backend/00-microservices-context.md` L46 | 9000, 10xxx | 5050, 8xxx | OpenAPI table |
| `01-backend/03-openapi-specification.md` L6-7 | 8092, 10xxx | 5050, 8xxx | Header |
| `01-backend/03-openapi-specification.md` L27-28, 64-67 | 8092, 8080 | 5050 | Base URLs |
| `01-backend/03-openapi-specification.md` L1986-1998 | 8092 | 5050 | WebSocket URLs |
| `02-frontend/02-frontend-architecture.md` L234 | 8089 | 5050 | Port default |
| `02-frontend/02-implementation-checklist.md` L18 | 8089 | 5050 | Primary port |
| `03-deploy/01-powershell.md` L21-98 | 8113/8114/8089/8088/8100 | 5050/5051/5040/5020/5030 | All ports |
| `03-deploy/02-deployment-guide.md` L76-221 | 8113/8114/8089/8088/8100 | 5050/5051/5040/5020/5030 | All ports |

### AI Bridge CLI (5040) — 10 files

| File | Old Port(s) | New Port(s) |
|------|------------|-------------|
| `01-backend/06-configuration.md` L104 | 8089 | 5040 |
| `01-backend/10-openapi-spec.md` L42 | 8089 | 5040 |
| `01-backend/30-openapi-spec-seo.md` L32 | 8080 | 5040 |
| `01-backend/11-observability.md` L477 | 8089 | 5040 |
| `01-backend/voice/REFERENCE.md` L17 | 8089 | 5040 |
| `01-backend/13-ai-seo-generate.md` L371 | 8089 | 5040 |
| `01-backend/11-rag-reindexing.md` L158 | 8089 | 5040 |
| `02-frontend/01-architecture.md` L623-624 | 8089 | 5040 |
| `02-frontend/02-implementation-checklist.md` L18,78,459 | 8089 | 5040 |
| `02-frontend/01-dashboard-specification.md` L402,433 | 8080 | 5040 |
| `03-deploy/01-powershell.md` L21-34 | 8089 | 5040 |
| `04-verification-report.md` L311,380,408 | 8089 | 5040 |

### WP Plugin Builder (5070) — 3 files

| File | Old Port(s) | New Port(s) |
|------|------------|-------------|
| `11-api-interface.md` L22,28,44 | 8090 | 5070 |
| `03-configuration.md` L114,347 | 8089 (AI Bridge) | 5040 |
| `02-cli-interface.md` L395 | 8089 (AI Bridge) | 5040 |

### WP SEO Publish (5060) — 3 files

| File | Old Port(s) | New Port(s) |
|------|------------|-------------|
| `01-backend/01-architecture.md` L277-286 | 8085, 8083, 8080 | 5060, 5040, 5020 |
| `01-backend/06-split-db-schema.md` L92,101 | 8083, 8080 | 5040, 5020 |
| `03-deploy/00-powershell-scripts.md` L202-204 | 8090, 8083, 8080 | 5060, 5040, 5020 |

### Spec Reverse (5080) — 2 files

| File | Old Port(s) | New Port(s) |
|------|------------|-------------|
| `01-backend/01-architecture.md` L356,417 | 9000 | 5040 |
| `01-backend/03-ai-bridge-integration.md` L67,699 | 9000 | 5040 |

### AI Transcribe (8030 exception) — 2 files

| File | Old Port(s) | New Port(s) |
|------|------------|-------------|
| `01-backend/11-configuration.md` L294 | 8020 (AI Bridge) | 5040 |
| `03-deploy/02-environment-config.md` L118 | 8089 (AI Bridge) | 5040 |

### GSearch (5020) — 3 files

| File | Old Port(s) | New Port(s) |
|------|------------|-------------|
| `01-backend/02-configuration.md` L224,574 | 8080 | 5020 |
| `01-backend/48-unified-rest-api.md` L69,577 | 8080 | 5020 |
| `03-extensions/01-chrome-extension.md` L396 | 8080 | 5020 |

### BRun (5030) — 1 file

| File | Old Port(s) | New Port(s) |
|------|------------|-------------|
| `02-frontend/02-implementation-checklist.md` L71-76 | 8100 | 5030 |

---

## Remaining Port References (Not Changed)

These legacy port references were **intentionally not changed** as they refer to:

1. **External/third-party services** (not CLI tools): Ollama (11434), llama.cpp (8080), Whisper server (9000), XTTS (8020)
2. **Generic examples** in BRun CLI's documentation (port management, firewall rules, deployment guide) that use `8080` as generic placeholders for user applications being managed by BRun
3. **Proxy configuration examples** in GSearch that reference external proxy servers
4. **SpecBuilder Pro microservices context** file ports (Gateway 8080, SpecManager 8081, etc.) — this is a legacy document describing the monolithic architecture, not the standalone CLI tools

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Port Registry Memory | `.lovable/memories/technical/cli-port-registry.md` |
| Wave 1 (Error Registry) | `.lovable/audits/wave-1-error-registry-remediation.md` |
| Phase 11 Audit | `.lovable/audits/phase-11-brun-cli-audit.md` |
| Phase 12 Audit | `.lovable/audits/phase-12-ai-bridge-core-audit.md` |
| Phase 15 Audit | `.lovable/audits/phase-15-nexus-flow-cli-audit.md` |
| Phase 16 Audit | `.lovable/audits/phase-16-wp-specrev-audit.md` |
| Phase 17 Audit | `.lovable/audits/phase-17-ai-transcribe-research-audit.md` |
