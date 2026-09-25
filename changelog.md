# Changelog

All notable changes to this project are documented here.
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
