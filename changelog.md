# Changelog

All notable changes to this project are documented here.
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v3.19.0] - 2026-09-25

### Added & Modernized
- **Agentic AI Specification Modernization:** Modernized specifications from folder 21 through folder 60 for zero-hallucination blind AI execution.
- **Universal Dialog & Overlay System (`02-spec/24-app-ui-design-system/`):** Authored 5 production specifications: `DialogRoot`, slide-over `DrawerContainer`, `ConfirmationDialog` with destructive keyword guards, Sonner `ToastManager`, and resizable `WorkspaceCanvas` with Sweet Digs design tokens.
- **Modern Search Engine Providers & Streaming (`02-spec/25-gsearch-cli/`):** Added multi-provider retrieval routing (Brave, Google Custom Search, Bing, SerpAPI) and reactive Next.js 14+ streaming UI with App Router Server Actions.
- **WordPress Plugin Architecture Realignment (`02-spec/34-wp-plugin/`, `35-`, `37-`):** Ingested production patterns from `riseup-asia-uploader` (`riseup-asia-uploader.php`), including chunked upload controllers with transient locks, silent `BootErrorCollector`, PSR-4 autoloader, backed enums with `Type` suffix (`OptionNameType`, `HookType`), and PHPStan Level 8 baseline standards.
- **CLI Systems & Path Sanitization:** Realigned all outdated folder references across core CLI tools (`25-gsearch-cli`, `26-brun-cli`, `27-ai-bridge-cli`, `28-ai-bridge-non-vector-rag`, `29-nexus-flow-cli`, `30-spec-reverse-cli`, `31-ai-transcribe-cli`, `33-shared-cli-frontend`).
- **0–100 Spec Quality Audit Matrix:** Audited 24 modules across 5 weighted dimensions; all 24 modules achieved scores >= 95/100 (Mean: 98.83/100, Grade A+). Published audit report in `02-spec/validation-reports/19-agentic-spec-modernization-audit.md`.

---

## [v3.18.0] - 2026-09-25

### Added & Modernized
- **Repository-Wide Index-to-Readme Migration:** Fully migrated and replaced all legacy `01-index.md` and `index.md` files across all modules, specs, memory, scripts, and tools with canonical lowercase `readme.md`.
- **Foundational Specifications Synchronization:** Synchronized specs in folders `01-` through `20-` from `coding-guidelines`, incorporating latest Sweet Digs design system, theme tokens, sliding interactions, and CSS3 animations.
- **Interactive Theme Tester:** Synchronized `theme-tester/` suite for real-time visual inspection of themes, CSS variables, and design tokens.
- **Prompts & Skills Synchronization:** Updated `01-prompts/`, `.agents/skills/`, `.agents/rules/`, and `03-ai-scripts/` with multi-agent orchestration parameters (`A=2, H=2`), GitMap pipeline-ai waiting, and `39-migrate-indexes-to-readme.py`.
- **Health Dashboard Updates:** Updated `scripts/generate-dashboard-data.cjs` and `src/utils/spec-index.ts` to seamlessly recognize and prioritize `readme.md` files as section overviews.

---

## [v3.17.0] - 2026-09-25

### Baseline Release
- Pre-migration baseline release snapshot establishing `backup/pre-sync-migration`.
