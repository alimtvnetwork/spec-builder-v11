# Wave 1 Remediation Report: Error Code Registry Synchronization

**Date:** 2026-02-07  
**Status:** Central Registry Updated — Per-Silo Propagation Required  
**Scope:** 6 collision resolutions, 3 path corrections, 7 missing range registrations

---

## Completed Actions

### ✅ Central Registry Updated (`spec/03-error-code-registry/01-registry.md`)

1. **All 6 collisions resolved** with Collision Resolution Log
2. **Range Allocation Map** added for visual conflict prevention
3. **Path corrections:** SRC → `spec/25-spec-reverse-cli/`, WSP → `spec/14-wp-seo-publish-cli/`, LM → `spec/30-wp-plugin/link-manager/`
4. **7 missing AI Bridge sub-ranges registered** (9850-9989)
5. **3 new prefixes added:** WPP (13000-13999), EQM (14500-14999), LM (15000-15999)
6. **WPB range narrowed** to 10000-10499 (Lovable Reasoning takes 10500-10519)

### ✅ Registry Overview Updated (`spec/03-error-code-registry/00-overview.md`)

1. **Dual format system reconciled** — both `XX-NNN-NN` and integer formats documented
2. **Stale prefix table replaced** with complete quick-reference
3. **Code examples updated** for both Go CLI (integer) and PHP/General (prefixed) usage

### ✅ JSON Schema Updated (`spec/03-error-code-registry/schemas/error-code.schema.json`)

1. **`oneOf` pattern** now validates both prefixed strings and integer codes

---

## Pending Per-Silo File Changes

> These changes propagate the central registry corrections into individual silo specs. Each entry lists the exact file and change required.

### Silo: AI Bridge (`spec/22-ai-bridge-cli/`)

| # | File | Change | Source |
|---|------|--------|--------|
| 1 | `01-backend/42-lovable-reasoning-defaults.md` | Change error codes 9830-9835 → **10500-10505** | Phase 14 CRIT-07 |
| 2 | `01-backend/05-error-codes.md` | Add Lovable Reasoning range **10500-10519**; confirm 9830-9839 is WebSocket only | Phase 14 CRIT-07, CRIT-08 |
| 3 | `01-backend/05-error-codes.md` | Register sub-ranges: Pattern Learning (9850-9869), Plan Gen (9870-9889), Plan Sync (9890-9909), Plan Templates (9910-9929), Exec Monitoring (9930-9949), Retry (9950-9969), Long-Chain (9970-9989) | Phase 14 CRIT-08 |

### Silo: Nexus Flow (`spec/24-nexus-flow-cli/`)

| # | File | Change | Source |
|---|------|--------|--------|
| 4 | `01-backend/00-microservices-context.md` L46 | Change error range from `10xxx` → `8xxx (8000-8399)` | Phase 15 C-02 |
| 5 | `01-backend/03-openapi-specification.md` L7 | Change error range from `10xxx` → `8xxx (8000-8399)` | Phase 15 C-02 |
| 6 | `01-backend/09-reset-api.md` | Reassign Reset API errors NF-8301 through NF-8308 → **NF-8350 through NF-8358** | Phase 15 W-12 |
| 7 | `01-backend/04-error-codes.md` | Add Reset API range 8350-8369; confirm State Errors retain 8301-8303 | Phase 15 W-12 |

### Silo: WP Plugins (`spec/30-wp-plugin/`)

| # | File | Change | Source |
|---|------|--------|--------|
| 8 | `link-manager/00-overview.md` L8 | Change error range from `14000-14999` → **`15000-15999`** | Phase 16 Finding 1.1 |
| 9 | `link-manager/` (all error code references) | Convert all `14xxx` codes to `15xxx` equivalents | Phase 16 Finding 1.1 |
| 10 | `wp-plugin-publish/66-shared-constants.md` | Convert `E{x}xxx` local codes to `13xxx` integer format with `WPP` prefix | Phase 16 Finding 1.3 |
| 11 | `exam-manager/66-shared-constants.md` | Register local codes under `EQM` prefix (14500-14999) — no code changes needed if already within range | Phase 16 Finding 1.7 |

### Silo: AI Transcribe (`spec/26-ai-transcribe-cli/`)

| # | File | Change | Source |
|---|------|--------|--------|
| 12 | `00-overview.md` | Update error range table from `13xxx` → `14xxx` (14000-14499) | Phase 17 Finding 1.2 |
| 13 | `01-backend/10-error-codes.md` | Reassign Model Download errors from 14200-14208 → **14470-14489** | Phase 17 Finding 1.1 |
| 14 | `01-backend/13-model-download.md` | Update all error code references from 14200-14208 → **14470-14489** | Phase 17 Finding 1.1 |

### Silo: Debugging Cheat Sheet (`spec/04-error-resolution/`)

| # | File | Change | Source |
|---|------|--------|--------|
| 15 | `05-debugging-cheat-sheet.md` L267-279 | Add missing ranges: AB extended (9600-9999, 10500-10519), GS BI (7700-7839), GS YouTube (7606-7609), WPP (13000-13999), EQM (14500-14999), LM (15000-15999) | Phase 2 I-07 |

---

## Validation Checklist

After all per-silo changes are applied, verify:

- [ ] `grep -r "14000" spec/30-wp-plugin/link-manager/` returns 0 results (LM fully migrated to 15000+)
- [ ] `grep -r "9830" spec/22-ai-bridge-cli/01-backend/42-lovable-reasoning-defaults.md` returns 0 results (Lovable Reasoning migrated to 10500+)
- [ ] `grep -r "10xxx\|10000-10999" spec/24-nexus-flow-cli/` returns 0 results (NF uses 8000-8399)
- [ ] `grep -r "13[0-4][0-9][0-9]" spec/26-ai-transcribe-cli/00-overview.md` returns 0 results (AIT uses 14xxx only)
- [ ] `grep -r "8301\|8302\|8303" spec/24-nexus-flow-cli/01-backend/09-reset-api.md` returns 0 results (Reset API moved to 8350+)
- [ ] No two distinct prefixes share overlapping numeric ranges in `01-registry.md`

---

## Cross-References

| Document | Status |
|----------|--------|
| `spec/03-error-code-registry/01-registry.md` | ✅ Updated |
| `spec/03-error-code-registry/00-overview.md` | ✅ Updated |
| `spec/03-error-code-registry/schemas/error-code.schema.json` | ✅ Updated |
| `.lovable/memories/technical/error-code-registry` | ✅ Updated |
| `.lovable/audits/phase-18-error-resolution-registry-audit.md` | Referenced (I-01 through I-08) |
| `.lovable/audits/phase-14-ai-bridge-advanced-audit.md` | Referenced (CRIT-07, CRIT-08) |
| `.lovable/audits/phase-15-nexus-flow-cli-audit.md` | Referenced (C-02, W-12) |
| `.lovable/audits/phase-16-wp-specrev-audit.md` | Referenced (1.1, 1.2, 1.3, X.1) |
| `.lovable/audits/phase-17-ai-transcribe-research-audit.md` | Referenced (1.1, 1.2, 1.3) |
