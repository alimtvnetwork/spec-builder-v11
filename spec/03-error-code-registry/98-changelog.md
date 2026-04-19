# Error Code Registry Changelog


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

## v2.0.0 — 2026-03-09

### Global Version Bump

Project-wide major version increment (+1.0.0) applied to all specification files in `03-error-code-registry`.

#### Changed
- All spec files received a major version bump and date update to 2026-03-09.
- Part of a global effort spanning ~638 files across all 30+ spec folders, establishing a new project-wide versioning baseline.

---

## v1.5.0 — 2026-03-02

### Inline ERR_XXXX Remediation — spec/02 Feature Specs
Converted remaining `ERR_SCREAMING_SNAKE` inline code references to `ErrPascalCase` across spec/02 feature specification and test files.

| File | Constants Updated | Examples |
|------|-------------------|----------|
| `spec/02/05-features/02-file-management/01-file-operations.md` | ~138 | `ERR_CONFLICT` → `ErrConflict`, `ERR_PATH_TOO_LONG` → `ErrPathTooLong` |
| `spec/02/05-features/09-knowledge-memory/tests/01-url-normalizer-tests.md` | 17 | `ERR_KNOWLEDGE_INVALID_URL` → `ErrKnowledgeInvalidUrl` |
| `spec/02/05-features/09-knowledge-memory/tests/02-knowledge-validator-tests.md` | ~75 | `ERR_KNOWLEDGE_PRIVATE_URL` → `ErrKnowledgePrivateUrl`, `ERR_CONFIG_PATH_INVALID` → `ErrConfigPathInvalid` |
| `spec/02/05-features/15-api-client/02-api-contracts.md` | 0 (already compliant) | — |

- Error code number corrections in file-operations EH tests: EH-004 (6004→6012), EH-005 (6005→6010), EH-006 (6006→6011)
- 6 distinct constant families remediated in knowledge-memory tests: `ErrKnowledgeInvalidUrl`, `ErrKnowledgePrivateUrl`, `ErrKnowledgePatternInvalid`, `ErrKnowledgePathNotFound`, `ErrConfigPathInvalid`
- All 7 tests pass ✓
- Advisory: `04-pattern-validator-tests.md` still contains ~60 `ERR_PATTERN_*` constants — deferred to next pass

---

## v1.4.0 — 2026-03-01

### SCREAMING_SNAKE_CASE → PascalCase Constant Rename
Dedicated remediation pass across all 9 non-compliant `error-codes.json` files. **702 constants renamed** to comply with §naming-standards (`Err` prefix, PascalCase, abbreviations as words).

| Module | Constants | Example |
|--------|-----------|---------|
| GS (GSearch CLI) | 102 | `ERR_INVALID_QUERY` → `ErrInvalidQuery` |
| SM-GS (GSearch Remap) | 92 | `ERR_INVALID_QUERY` → `ErrInvalidQuery` |
| AIT (AI Transcribe) | 141 | `ERR_TRANSCRIBE_GENERAL` → `ErrTranscribeGeneral` |
| WPB (WP Plugin Builder) | 70 | `ERR_WPB_INIT_FAILED` → `ErrWpbInitFailed` |
| NF (Nexus Flow) | 15 | `CANVAS_INIT_FAILED` → `ErrCanvasInitFailed` |
| WSP (WP SEO Publish) | 75 | `CONNECTION_FAILED` → `ErrConnectionFailed` |
| EQM (Exam Manager) | 57 | `VALIDATION_FAILED` → `ErrValidationFailed` |
| SM-CG (Code Generation) | 79 | `ERR_CODEGEN_UNKNOWN` → `ErrCodegenUnknown` |
| SM-PE (Project Editor) | 82 | `PROJECT_EDITOR_UNKNOWN` → `ErrProjectEditorUnknown` |

- Exit codes converted: `EXIT_SUCCESS` → `ExitSuccess`, etc. (GS only)
- **3 files already compliant** (no changes): AB, WPP, LM
- Abbreviation rule: `HTTP` → `Http`, `DB` → `Db`, `STT` → `Stt`, `TTS` → `Tts`, `API` → `Api`, `DNS` → `Dns`, `TLS` → `Tls`, `URL` → `Url`, `CSV` → `Csv`, `IP` → `Ip`
- Advisory: ~135 markdown spec files still reference old SCREAMING_SNAKE constants — deferred to separate pass
- All 6 collision tests pass ✓

### NF, WPB, WSP, AIT, EQM Integrity Audit
Cross-module integrity and coding guidelines audit for the remaining 5 modules. All verified consistent.

#### NF (Nexus Flow CLI)
- `totalCodes`: 15 ✓, `retryableCodes`: 1 ✓
- Range `8000-8349` verified (was incorrectly compressed to `8000-8099` in v1.1.0, reverted to `8000-8349` to accommodate codes 8101–8303)
- `rangeUtilization`: `15/350 (4.3%)` ✓
- SCREAMING_SNAKE_CASE constants flagged (15) — remediated in rename pass above

#### WPB (WP Plugin Builder)
- `totalCodes`: 70 ✓, `retryableCodes`: 9 ✓
- Range `10000-10499` ✓
- `rangeUtilization`: `70/500 (14.0%)` ✓
- SCREAMING_SNAKE_CASE constants flagged (70) — remediated in rename pass above

#### WSP (WP SEO Publish CLI)
- `totalCodes`: 75 ✓, `retryableCodes`: 4 ✓
- Range `12000-12599` ✓
- `rangeUtilization`: `75/600 (12.5%)` ✓
- SCREAMING_SNAKE_CASE constants flagged (75) — remediated in rename pass above

#### AIT (AI Transcribe CLI)
- `totalCodes`: 141 ✓, `retryableCodes`: 27 ✓
- Range `14000-14499` ✓
- `rangeUtilization`: `141/500 (28.2%)` — approaching 30% utilization threshold ⚠️
- SCREAMING_SNAKE_CASE constants flagged (141) — remediated in rename pass above

#### EQM (Exam Manager)
- `totalCodes`: 57 ✓, `retryableCodes`: 5 ✓
- Range `14500-14999` ✓
- `rangeUtilization`: `57/500 (11.4%)` ✓
- SCREAMING_SNAKE_CASE constants flagged (57) — remediated in rename pass above

### Markdown Spec Remediation (SCREAMING_SNAKE_CASE → PascalCase)
Updated ~328 error constant references across 7 markdown specification files to match the PascalCase constants in `error-codes.json`.

| File | Module | Constants Updated |
|------|--------|-------------------|
| `spec/24-nexus-flow-cli/01-backend/04-error-codes.md` | NF | 15 |
| `spec/31-wp-plugin-builder/10-error-handling.md` | WPB | 70 |
| `spec/26-ai-transcribe-cli/01-backend/10-error-codes.md` | AIT | 141 |
| `spec/11-spec-management-software/05-features/24-code-generation-system/16-error-codes.md` | SM-CG | 79 |
| `spec/11-spec-management-software/06-error-management/shared/01-error-constants.md` | SM | ~10 |
| `spec/11-spec-management-software/06-error-management/frontend/01-error-codes.md` | SM | ~8 |
| `spec/11-spec-management-software/06-error-management/00-overview.md` | SM | ~5 |

- Deferred: GS `15-error-codes.md`, SM-GS `15-error-codes.md`, SM `error-code-registry.md` (large files, separate pass)
- All 6 collision tests pass ✓

### Documentation
- All 6 collision tests pass with 16 modules
- Master `totalRetryableCodes` updated: 150 → **159** (post-audit correction)

---

## v1.3.0 — 2026-03-01

### Retryable Count Audit
Cross-module integrity audit identified **retryable count mismatches in 7 modules**. All corrected:

| Module | Was (master) | Actual | Delta |
|--------|-------------|--------|-------|
| AB (AI Bridge) | 18 | **8** | -10 |
| SM-CG (Code Generation) | 8 | **32** | +24 |
| SM-PE (Project Editor) | 7 | **3** | -4 |
| GS (GSearch CLI) | 34 | **37** | +3 |
| SM-GS (GSearch Remap) | 34 | **32** | -2 |
| WPP (WP Plugin Publish) | 5 | **1** | -4 |
| **Master total** | **143** | **150** | **+7** |

### AB (AI Bridge) Audit Fixes
- Fixed stale range in description: `19000-19019` → **`19000-19049`**
- Fixed stale `rangeUtilization`: `125/1020 (12.3%)` → **`168/1050 (16.0%)`**
- Fixed stale `totalCategories`: 18 → **19**
- Renamed 3 CSV constants to comply with §abbreviation-casing: `ErrCSVParseFailed` → `ErrCsvParseFailed`, `ErrCSVRequiresConfig` → `ErrCsvRequiresConfig`, `ErrCSVEmpty` → `ErrCsvEmpty`
- Renamed 6 Lovable Reasoning constants from SCREAMING_SNAKE_CASE to PascalCase `Err` prefix: `REASONING_REQUIRED` → `ErrReasoningRequired`, etc.
- Updated Lovable Reasoning category range: `19000-19019` → **`19000-19049`**

### SM Sub-Module Audit Fixes
- **SM-CG**: Fixed local `retryableCodes` (30 → **32**) and `rangeUtilization` (`80/800` → **`79/800 (9.9%)`**)
- **SM-PE**: Master `retryableCodes` corrected (7 → **3**)
- **SM-GS**: Stats verified consistent ✓
- Advisory: SCREAMING_SNAKE_CASE constants flagged across SM-CG (79), SM-PE (82), SM-GS (92) — deferred to naming remediation pass

### GS (GSearch CLI) Audit Fixes
- Fixed local `retryableCodes`: 34 → **37** (3 uncounted retryables found)
- Fixed SM-GS remap `retryableCodes`: 34 → **32** (Movie Search retryables correctly excluded)
- GS ↔ SM-GS cross-reference verified: constants, descriptions, code counts all consistent ✓
- Advisory: SCREAMING_SNAKE_CASE + abbreviation casing flagged (~102 constants) — deferred

### WPP (WP Plugin Publish) Audit Fixes
- Fixed master `retryableCodes`: 5 → **1** (only `E9004 ErrTimeout` is retryable)
- Fixed stale range in local file: `13000-13999` → **`13000-13499`** (compressed per Resolution 5)
- Renamed `ErrDatabaseTx` → **`ErrDatabaseTransaction`** (§meaningful-identifiers)
- Renamed `ErrNotImpl` → **`ErrNotImplemented`** (§meaningful-identifiers)
- Advisory: No integer ecosystem mapping (E1001–E9004 → 13000–13499) — structural gap flagged

### Documentation
- Regenerated `04-error-code-utilization-report.md` with corrected retryable counts across all modules
- All 6 collision tests pass with 16 modules

---

## v1.2.0 — 2026-02-28

### New Modules
- **SM** (Spec Management): Added as tracked module with range **2000–2999** (allocated, no index yet)
- **BR** (BRun CLI): Added as tracked module with range **7100–7599** (sub-range within GS, no index yet)
- **SRC** (Spec Reverse CLI): Added as tracked module with range **11000–11999** (allocated, no index yet)
- `stats.totalModules` updated: 13 → **16**; `pendingModules`: `["SM", "BR", "SRC"]`
- `allocatedRange` updated: `6010-19019` → **`2000-19049`**

### Fixes
- Removed duplicate GS module entry in `error-codes-master.json`
- Fixed AB module `ranges` array: `19000-19019` → **`19000-19049`** (was stale after AB-LR expansion)
- Corrected overview quick reference: GEN `1000-1999` → **`0-999`**, GS `7000-7949` → **`7000-7919`**, PS `9500-9599` → **`9500-9540`**
- Split unallocated range `10500-11999` → `10500-10999` (SRC now occupies `11000-11999`)

### Test Suite Updates
- Test suite now skips modules without `indexFile` (prevents `undefined` path errors for pending modules)
- Added GS/BR intentional sub-range overlap whitelist to range overlap detection
- All 6 tests pass with 16 modules

### Documentation
- Regenerated `04-error-code-utilization-report.md` with all 16 modules
- Updated [project-allocations memory](../../.lovable/memories/architecture/error-code-registry/project-allocations.md) with SM, GS, BR, SRC
- Added SM-GS, AB-LR to quick reference table in `00-overview.md`
- Added `error-codes-master.json`, `04-error-code-utilization-report.md`, `98-changelog.md` to "Files in This Spec" table

---

## v1.1.0 — 2026-02-28

### Stats Corrections
- **AB** (AI Bridge): `totalCodes` corrected from 125 → 168
- **WPB** (WP Plugin Builder): `totalCodes` corrected from 30 → 70
- **WSP** (WP SEO Publish): `totalCodes` corrected from 78 → 75
- **AIT** (AI Transcribe): `totalCodes` corrected from 136 → 141
- **EQM** (Exam Manager): `totalCodes` corrected from 52 → 57
- **SM-CG** (Code Generation): `totalCodes` corrected from 80 → 79
- Global `stats.totalIndexedCodes` recalculated: 743 → **933**
- Global `stats.totalRetryableCodes` recalculated: 108 → **143**

### Range Changes
- **NF** (Nexus Flow): Compressed from 8000–8399 → **8000–8099** (freed 300 codes)
- **WPP** (WP Plugin Publish): Compressed from 13000–13999 → **13000–13499** (freed 500 codes)
- **AB-LR** (Lovable Reasoning): Expanded from 19000–19019 → **19000–19049** (added 30 codes headroom)
- Total unallocated capacity increased to **6,000 codes**

### CI / Automation
- Added GitHub Actions workflow (`.github/workflows/validate-errors.yml`) running `validate:errors` on every PR
- Added `report:errors` script (`generate-utilization-report.mjs`) to auto-generate utilization report
- Added master index stats drift detection (`validate-master-stats.mjs`) to CI
- Added utilization report drift detection (git diff) to CI
- Added utilization threshold warnings (`check-utilization-threshold.mjs`) — flags modules ≥30% utilization via `::warning::` annotations

### Documentation
- Regenerated `04-error-code-utilization-report.md` with all corrected totals and range changes
- Updated [project-allocations memory](../../.lovable/memories/architecture/error-code-registry/project-allocations.md)

---

## v1.0.0 — 2026-02-28

- Initial `error-codes-master.json` with 13 modules, 12 indexed
- Collision detection suite (`detect-collisions.mjs`) with Vitest wrapper
- JSON Schema validation for all module `error-codes.json` files
- Husky pre-commit hook enforcement
