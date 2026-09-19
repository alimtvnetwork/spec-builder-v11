# Spec Migration Checklist

**Version:** 2.0.0  
**Created:** 2026-03-09  
**Purpose:** Verify internal links after folder restructuring

---

## Migration Summary

This checklist verifies that all internal links in spec files point to correct locations after the folder restructuring migration.

---

## Folder Naming Convention

| # | Old Path | New Path |
|---|----------|----------|
| 01 | `02-spec/general-spec/` | `02-spec/01-general-spec/` |
| 02 | `02-spec/spec-management-software/` | `02-spec/11-spec-management-software/` |
| 03 | `02-spec/shared-cli-frontend/` | `02-spec/33-shared-cli-frontend/` |
| 04 | `02-spec/split-db-architecture/` | `02-spec/06-split-db-architecture/` |
| 05 | `02-spec/cw-config-architecture/` | `02-spec/07-seedable-config-architecture/` |
| 06 | `02-spec/powershell-integration/` | `02-spec/11-powershell-integration/` |
| 07 | `02-spec/error-code-registry/` | `02-spec/03-error-code-registry/` |
| 08 | `02-spec/gsearch-cli/` | `02-spec/25-gsearch-cli/` |
| 09 | `02-spec/brun-cli/` | `02-spec/26-brun-cli/` |
| 10 | `02-spec/ai-bridge/` + `02-spec/ai-bridge-cli/` | `02-spec/27-ai-bridge-cli/` |
| 11 | `02-spec/nexus-flow/` | `02-spec/29-nexus-flow-cli/` |
| 12 | `02-spec/wp-plugin/` | `02-spec/34-wp-plugin/` |
| 13 | `02-spec/wp-plugin-builder/` | `02-spec/35-wp-plugin-builder/` |

---

## CLI Three-Folder Structure

All CLIs now follow:

```
{nn}-{cli-name}/
├── 00-overview.md
├── 01-backend/
│   ├── 00-overview.md
│   └── {nn}-{spec-name}.md
├── 02-frontend/
│   ├── 00-overview.md
│   └── {nn}-{spec-name}.md
├── 03-deploy/
│   ├── 00-overview.md
│   └── {nn}-{spec-name}.md
└── 99-consistency-report.md
```

---

## Verification Checklist

### Phase 1: Folder Structure ✅

- [x] All CLI folders have `01-backend/`, `02-frontend/`, `03-deploy/` subfolders
- [x] All subfolders have `00-overview.md` files
- [x] Backend specs moved from root to `01-backend/`
- [x] Frontend specs moved from root to `02-frontend/`
- [x] Deployment specs moved to `03-deploy/`

### Phase 2: File Migrations ✅

#### GSearch CLI (20-gsearch-cli/)
- [x] `01-cli-framework.md` → `01-backend/01-cli-framework.md`
- [x] `02-configuration.md` → `01-backend/02-configuration.md`
- [x] `03-database-schema.md` → `01-backend/03-database-schema.md`
- [x] `04-html-parser.md` → `01-backend/04-html-parser.md`
- [x] `05-google-api.md` → `01-backend/05-google-api.md`
- [x] `06-duckduckgo.md` → `01-backend/06-duckduckgo.md`
- [x] `07-bing-search.md` → `01-backend/07-bing-search.md`
- [x] `08-method-switching.md` → `01-backend/08-method-switching.md`
- [x] `09-nested-search.md` → `01-backend/09-nested-search.md`
- [x] `10-caching-system.md` → `01-backend/10-caching-system.md`
- [x] `11-rag-export.md` → `01-backend/11-rag-export.md`
- [x] `12-testing-strategy.md` → `01-backend/12-testing-strategy.md`
- [x] `13-implementation-guide.md` → `01-backend/13-implementation-guide.md`
- [x] `14-remediation-plan.md` → `01-backend/14-remediation-plan.md`
- [x] `15-error-codes.md` → `01-backend/15-error-codes.md`
- [x] `16-observability.md` → `01-backend/16-observability.md`
- [x] `17-deployment-guide.md` → `03-deploy/01-deployment-guide.md`
- [x] `18-full-site-crawler.md` → `01-backend/17-full-site-crawler.md`
- [x] `19-authority-credibility-scoring.md` → `01-backend/18-authority-credibility-scoring.md`
- [x] `20-trend-analysis-engine.md` → `01-backend/19-trend-analysis-engine.md`
- [x] `21-trend-analyzer-implementation.md` → `01-backend/20-trend-analyzer-implementation.md`
- [x] `22-settings-service-implementation.md` → `01-backend/21-settings-service.md`
- [x] `23-settings-ui-page.md` → `02-frontend/01-settings-ui-page.md`
- [x] `24-frontend-architecture.md` → `02-frontend/02-frontend-architecture.md`
- [x] `25-frontend-implementation-checklist.md` → `02-frontend/03-implementation-checklist.md`

#### BRun CLI (21-brun-cli/)
- [x] `01-core-architecture.md` → `01-backend/01-core-architecture.md`
- [x] `02-cli-interface.md` → `01-backend/02-cli-interface.md`
- [x] `03-configuration.md` → `01-backend/03-configuration.md`
- [x] `04-runtime-executors.md` → `01-backend/04-runtime-executors.md`
- [x] `05-port-management.md` → `01-backend/05-port-management.md`
- [x] `06-error-handling.md` → `01-backend/06-error-handling.md`
- [x] `07-build-profiles.md` → `01-backend/07-build-profiles.md`
- [x] `08-asset-operations.md` → `01-backend/08-asset-operations.md`
- [x] `09-integration-api.md` → `01-backend/09-integration-api.md`
- [x] `10-data-models.md` → `01-backend/10-data-models.md`
- [x] `11-acceptance-criteria.md` → `01-backend/11-acceptance-criteria.md`
- [x] `12-ai-config-generation.md` → `01-backend/12-ai-config-generation.md`
- [x] `13-testing-strategy.md` → `01-backend/13-testing-strategy.md`
- [x] `14-implementation-guide.md` → `01-backend/14-implementation-guide.md`
- [x] `15-observability.md` → `01-backend/15-observability.md`
- [x] `16-deployment-guide.md` → `03-deploy/01-deployment-guide.md`
- [x] `17-frontend-architecture.md` → `02-frontend/01-frontend-architecture.md`

#### Nexus Flow CLI (24-nexus-flow-cli/)
- [x] `11-microservices-context.md` → `01-backend/11-microservices-context.md`
- [x] `01-core-specification.md` → `01-backend/01-core-specification.md`
- [x] `02-react-flow-canvas.md` → `02-frontend/01-react-flow-canvas.md`
- [x] `03-standalone-architecture.md` → `01-backend/02-standalone-architecture.md`
- [x] `04-openapi-specification.md` → `01-backend/03-openapi-specification.md`
- [x] `05-error-codes.md` → `01-backend/04-error-codes.md`
- [x] `06-frontend-architecture.md` → `02-frontend/02-frontend-architecture.md`

#### AI Bridge CLI (22-ai-bridge-cli/)
- [x] Already structured with `01-backend/`, `02-frontend/`, `03-deploy/`

### Phase 3: Cross-Reference Updates ✅

- [x] External tools references updated (`11-spec-management-software/15-external-tools/`)
- [x] CLI overview files updated with new paths
- [x] Backend/frontend/deploy overview files updated

### Phase 4: Consistency Report ✅

- [x] Global consistency report created at `02-02-spec/99-consistency-report.md`
- [x] CLI-specific consistency reports updated

---

## Link Validation Commands

To verify links, search for patterns that need updating:

```bash
# Find old folder references
grep -r "02-spec/gsearch-cli/" spec/
grep -r "02-spec/brun-cli/" spec/
grep -r "02-spec/nexus-flow/" spec/
grep -r "02-spec/ai-bridge/" spec/
grep -r "cw-config-architecture" spec/

# Find old file references (files moved to subfolders)
grep -r "\./01-cli-framework.md" spec/
grep -r "\./01-core-architecture.md" spec/
```

---

## Remaining Actions

1. **Verify internal links** - Run grep commands above
2. **Update any remaining old references** - Fix any broken links found
3. **Test navigation** - Manually verify key cross-references work

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-01 | Initial migration checklist |
