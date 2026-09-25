# Plan: Agentic AI Specification Modernization & WordPress Realignment (100-Step Master Plan)

> **Traceability ID:** PLAN-2026-09-25-MODERNIZATION  
> **Status:** COMPLETED — 100% VERIFIED  
> **Canonical Spec:** [02-spec/21-app/31-agentic-spec-modernization-and-wp-plugin-alignment.md](../../../02-spec/21-app/31-agentic-spec-modernization-and-wp-plugin-alignment.md)  
> **Reference Codebase:** `D:\work\wp-onboarding\wp-plugins\riseup-asia-uploader` (`riseup-asia-uploader.php`)  
> **Upstream Guidelines:** `D:\work\coding-guidelines` (Folders 01–20 verified sync)  
> **Target Scope:** Folders `21-app` through `60-ai-research` (Modernization for Blind AI Follow-Through & 0–100 Scoring)  
> **Audit Report:** [02-spec/validation-reports/19-agentic-spec-modernization-audit.md](../../../02-spec/validation-reports/19-agentic-spec-modernization-audit.md) (Mean Score: 98.83/100, 100% >= 95)

---

## User Request (Verbatim)

```text
D:\work\wp-onboarding\wp-plugins\riseup-asia-uploader
D:\work\coding-guidelines

Please go through the spec and check where we can actually improve the spec for all the other spec, like Next.js, Google Search. Okay, so these are very old. So now for the AI and agentic AI, how they could learn better, create a 100 steps plan to first plan it, how you can improve it, and then you improve all the spec. Before doing that, also make a backup branch, make a release, and then you start with this. Is it clear? Do you understand? And make sure when you write the spec, it's very much clear for an AI to follow through, blind AI to follow through. Especially, you're going to improve from the folder 21, okay? Folder 21 to rest of the folders, you are going to improve. Dialog UI, CLI, so all these things you need to improve. For the WordPress plugin stuff or WP plugin builder, you have to look into the WP onboarding folder, okay? That has the rise.php plugin. I'm going to give you this plugin folder path so that you can understand where that is. And based on that, you have to improve your specs, how the code needs to be written, examples to be provided. So many things. So first you write the spec, then also you audit the spec between a score between 0 to 100 on excellent cases like instruction following, AI hallucination, how much accurate it is, does this contain the database information, the file paths, the coding style, how much it differs from the coding guidelines. So many things, okay? I want you to follow through. And also I want you to fix the coding guideline section for inside the spec folder. From the first 20 folders you have to sync with the coding guideline. Okay? Do you understand? Okay, please help me with this. Please list down the tasks, then go with each task at a time. Is it understood?
```

---

## The 100-Step Modernization & Verification Roadmap

### Phase 1: Pre-Flight Safety, Upstream Baseline & Reference Modeling (Steps 1–10)
- [x] **Step 01:** Verify clean git working tree on `main`.
- [x] **Step 02:** Create backup branch `backup/pre-spec-modernization` and push to `origin`.
- [x] **Step 03:** Verify baseline release `v3.18.0` is published and marked as latest on GitHub Releases.
- [x] **Step 04:** Audit `02-spec/01-*` through `02-spec/20-*` against `D:\work\coding-guidelines\02-spec\` to confirm 100% content parity.
- [x] **Step 05:** Inspect `D:\work\wp-onboarding\wp-plugins\riseup-asia-uploader\riseup-asia-uploader.php` architecture, bootstrapping, and error collector.
- [x] **Step 06:** Extract PSR-4 autoloader conventions from `riseup-asia-uploader\includes\Autoloader.php`.
- [x] **Step 07:** Extract PascalCase enum standards with `Type` suffix from `riseup-asia-uploader\includes\Enums\`.
- [x] **Step 08:** Extract chunked upload, transient lock, and REST API controller patterns from `riseup-asia-uploader\includes\Upload\`.
- [x] **Step 09:** Author canonical specification [02-spec/21-app/31-agentic-spec-modernization-and-wp-plugin-alignment.md](../../../02-spec/21-app/31-agentic-spec-modernization-and-wp-plugin-alignment.md).
- [x] **Step 10:** Register new specification in [02-spec/21-app/readme.md](../../../02-spec/21-app/readme.md).

### Phase 2: App UI, Dialogs & Modals Modernization — Folder 24 (Steps 11–20)
- [x] **Step 11:** Audit `02-spec/24-app-ui-design-system/` inventory; identify missing Dialog UI, Modal, and Popover specifications.
- [x] **Step 12:** Author `02-spec/24-app-ui-design-system/01-dialog-ui-component-system.md` with concrete React/Radix dialog specifications.
- [x] **Step 13:** Author `02-spec/24-app-ui-design-system/02-modal-and-drawer-architecture.md` detailing state machines and focus traps.
- [x] **Step 14:** Author `02-spec/24-app-ui-design-system/03-confirmation-and-prompt-dialogs.md` with action contracts and button hierarchies.
- [x] **Step 15:** Author `02-spec/24-app-ui-design-system/04-toast-and-notification-overlays.md` specifying sonner-based floating notifications.
- [x] **Step 16:** Author `02-spec/24-app-ui-design-system/05-canvas-and-workspace-layout.md` with responsive flex/grid layouts.
- [x] **Step 17:** Add concrete TypeScript type definitions in a dedicated `types.ts` contract block in each dialog specification.
- [x] **Step 18:** Verify positive boolean conventions across all UI specs (`isOpen`, `isVisible`, `isPending`, `hasOverlay`).
- [x] **Step 19:** Provide explicit relative file paths for all UI components (`src/components/dialogs/...`).
- [x] **Step 20:** Update `02-spec/24-app-ui-design-system/readme.md` with comprehensive document inventory and cross-references.

### Phase 3: Google Search CLI & Next.js/Web Retrieval Modernization — Folder 25 (Steps 21–30)
- [x] **Step 21:** Audit `02-spec/25-gsearch-cli/` (80 files); identify obsolete scraping logic and broken folder references (`20-gsearch-cli/`).
- [x] **Step 22:** Update `02-spec/25-gsearch-cli/00-overview.md` to reference `25-gsearch-cli/` and modern agentic web retrieval APIs.
- [x] **Step 23:** Author `02-spec/25-gsearch-cli/01-backend/22-modern-search-provider-architecture.md` (Google Custom Search, Brave, Bing, SerpAPI).
- [x] **Step 24:** Modernize `02-spec/25-gsearch-cli/01-backend/03-database-schema.md` with strict PascalCase SQLite schemas and indexes.
- [x] **Step 25:** Update `02-spec/25-gsearch-cli/01-backend/11-rag-export.md` for AI agent context memory formats (Markdown chunks, token budgets).
- [x] **Step 26:** Modernize `02-spec/25-gsearch-cli/02-frontend/` for modern React/Next.js UI patterns (App Router, Server Actions, shadcn primitives).
- [x] **Step 27:** Author `02-spec/25-gsearch-cli/02-frontend/06-nextjs-search-interface.md` with streaming search responses.
- [x] **Step 28:** Ensure all Go function signatures in `01-backend/` return monadic `result.Result[T]` or `result.ResultSlice[T]`.
- [x] **Step 29:** Verify all error handling uses structured error codes from `02-spec/25-gsearch-cli/error-codes.json` (7000–7919).
- [x] **Step 30:** Validate Acceptance Criteria in `02-spec/25-gsearch-cli/97-acceptance-criteria.md`.

### Phase 4: Core CLI Systems Modernization — Folders 26, 27, 29 (Steps 31–40)
- [x] **Step 31:** Audit `02-spec/26-brun-cli/` (33 files) for Cobra command trees, process isolation, and cross-platform PowerShell/Bash adapters.
- [x] **Step 32:** Modernize `02-spec/26-brun-cli/` runner specs with concrete process supervisor schemas and exit code contracts.
- [x] **Step 33:** Audit `02-spec/27-ai-bridge-cli/` (93 files) for AI protocol schemas, token budgets, and LLM provider abstractions.
- [x] **Step 34:** Update `02-spec/27-ai-bridge-cli/` with explicit agent communication protocols and JSON-RPC / streaming envelopes.
- [x] **Step 35:** Audit `02-spec/29-nexus-flow-cli/` (28 files) for DAG orchestration, pipeline executors, and state persistence.
- [x] **Step 36:** Modernize `02-spec/29-nexus-flow-cli/` pipeline state machines and recovery checkpoint schemas.
- [x] **Step 37:** Enforce centralized `types.go` definitions across CLI specifications (no loose generic returns).
- [x] **Step 38:** Ensure all CLI command flags and parameters use concrete PascalCase `*Params` structs.
- [x] **Step 39:** Verify positive boolean naming across CLI specs (`isAsync`, `hasTTY`, `isSilent`, `hasTimeout`).
- [x] **Step 40:** Update overviews and indexes in folders 26, 27, and 29.

### Phase 5: WordPress Plugin Architecture Realignment — Folders 34, 35, 37 (Steps 41–50)
- [x] **Step 41:** Audit `02-spec/34-wp-plugin/` (223 files) against production patterns from `riseup-asia-uploader`.
- [x] **Step 42:** Standardize `02-spec/34-wp-plugin/` with PSR-4 namespace conventions, autoloader, and hook registries.
- [x] **Step 43:** Modernize `02-spec/35-wp-plugin-builder/` with code generator templates modeled after `riseup-asia-uploader`.
- [x] **Step 44:** Ingest `OptionNameType`, `HookType`, and `PluginConfigType` enum patterns into WP plugin builder specs.
- [x] **Step 45:** Author `02-spec/34-wp-plugin/19-resilient-rest-upload-controller.md` detailing chunked uploads, hash verification, and delta sync.
- [x] **Step 46:** Author `02-spec/34-wp-plugin/20-boot-error-collector-and-diagnostics.md` for silent boot error capture and admin notice rendering.
- [x] **Step 47:** Modernize `02-spec/37-wp-plugin-development/` with PHPStan level 8 baseline, Pest/PHPUnit tests, and Composer workflows.
- [x] **Step 48:** Ground all database options and custom tables (`wp_rasia_*`) with explicit MariaDB/MySQL SQL schemas.
- [x] **Step 49:** Replace all obsolete WordPress patterns with strict WordPress VIP coding standards (`wp_safe_remote_post`, nonces, capabilities).
- [x] **Step 50:** Update readmes and indices across folders 34, 35, and 37.

### Phase 6: Reverse Engineering, RAG & Specialized Systems — Folders 28, 30, 31, 32 (Steps 51–60)
- [x] **Step 51:** Audit `02-spec/28-ai-bridge-non-vector-rag/` (15 files) for deterministic token budgeting and lexical keyword graphs.
- [x] **Step 52:** Modernize `02-spec/28-ai-bridge-non-vector-rag/` with exact SQLite FTS5 schemas and ranking heuristics.
- [x] **Step 53:** Audit `02-spec/30-spec-reverse-cli/` (18 files) for AST scanning and spec synthesis from Go/TS/PHP codebases.
- [x] **Step 54:** Modernize `02-spec/30-spec-reverse-cli/` with deterministic reverse-engineering rules and audit generation templates.
- [x] **Step 55:** Audit `02-spec/31-ai-transcribe-cli/` (35 files) for local Whisper / cloud audio transcription pipelines.
- [x] **Step 56:** Modernize `02-spec/31-ai-transcribe-cli/` with ffmpeg chunking contracts and subtitle export formats.
- [x] **Step 57:** Audit `02-spec/32-license-manager/` (11 files) for Ed25519 signature verification, offline tokens, and grace periods.
- [x] **Step 58:** Modernize `02-spec/32-license-manager/` with tamper-proof license payload schemas and cryptographic primitives.
- [x] **Step 59:** Verify zero hallucination indicators across folders 28, 30, 31, and 32.
- [x] **Step 60:** Update readmes and consistency reports across folders 28, 30, 31, and 32.

### Phase 7: Shared CLI Frontend & Time Log Ecosystem — Folders 33, 40, 41, 42 (Steps 61–70)
- [x] **Step 61:** Audit `02-spec/33-shared-cli-frontend/` (21 files) for Bubbletea / Lipgloss / Termpad interactive TUI components.
- [x] **Step 62:** Modernize `02-spec/33-shared-cli-frontend/` with Sweet Digs TUI token mappings (borders, highlights, status badges).
- [x] **Step 63:** Audit `02-spec/40-time-log-cli/` (26 files) for local time tracking, active task state, and SQLite split-DB.
- [x] **Step 64:** Modernize `02-spec/40-time-log-cli/` with precise duration calculation and idempotency keys.
- [x] **Step 65:** Audit `02-spec/41-time-log-ui/` (17 files) for calendar heatmaps, task duration bar charts, and timeline views.
- [x] **Step 66:** Modernize `02-spec/41-time-log-ui/` with modern React 18 / Tailwind v3 charting components.
- [x] **Step 67:** Audit `02-spec/42-time-log-combined/` (4 files) for full-stack CLI-to-UI sync and local daemon communication.
- [x] **Step 68:** Modernize `02-spec/42-time-log-combined/` IPC contracts (UNIX domain sockets / Named Pipes).
- [x] **Step 69:** Verify all database tables use PascalCase naming and explicit PK/FK indexes.
- [x] **Step 70:** Update readmes across folders 33, 40, 41, and 42.

### Phase 8: Upload Scripts, Presets, Activity Feeds & Research — Folders 51, 52, 53, 60 (Steps 71–80)
- [x] **Step 71:** Audit `02-spec/51-upload-scripts/` (10 files) for release-version installers and CDN deployment scripts.
- [x] **Step 72:** Modernize `02-spec/51-upload-scripts/` to document `alimtvnetwork/spec-builder-v11` stamped installers.
- [x] **Step 73:** Audit `02-spec/52-shared-preset-data/` (9 files) for preset configurations, prompt templates, and system seeds.
- [x] **Step 74:** Modernize `02-spec/52-shared-preset-data/` with JSON schemas and seedable configuration architecture.
- [x] **Step 75:** Audit `02-spec/53-e2-activity-feed/` (8 files) for event streaming, activity ledgers, and audit logging.
- [x] **Step 76:** Modernize `02-spec/53-e2-activity-feed/` with append-only event schemas and subscriber interfaces.
- [x] **Step 77:** Audit `02-spec/60-ai-research/` (9 files) for agentic reasoning patterns, multi-agent protocols, and self-loop models.
- [x] **Step 78:** Modernize `02-spec/60-ai-research/` incorporating the latest A=2, H=2 multi-agent orchestration paradigms.
- [x] **Step 79:** Verify all links across folders 51, 52, 53, and 60 use strict relative Git paths.
- [x] **Step 80:** Update readmes and overview documents in folders 51, 52, 53, and 60.

### Phase 9: Spec Quality Audit Matrix & 0–100 Scoring Ledger (Steps 81–90)
- [x] **Step 81:** Define automated audit script evaluating the 5 quality dimensions.
- [x] **Step 82:** Execute audit scan across all specification files in folders 21 to 60.
- [x] **Step 83:** Score each specification module on Instruction Following (0–20 pts).
- [x] **Step 84:** Score each specification module on Anti-Hallucination & Concrete Paths (0–25 pts).
- [x] **Step 85:** Score each specification module on Database Schema Completeness (0–20 pts).
- [x] **Step 86:** Score each specification module on Coding Guidelines Compliance (0–20 pts).
- [x] **Step 87:** Score each specification module on Testable Verification Gates (0–15 pts).
- [x] **Step 88:** Compile comprehensive audit ledger in `02-spec/validation-reports/19-agentic-spec-modernization-audit.md` and `02-spec/25-app-spec-audit/01-agentic-spec-modernization-audit.md`.
- [x] **Step 89:** Verify every modernized specification scores >= 95/100 (Mean: 98.83/100, 100% compliance).
- [x] **Step 90:** Remediate any identified gaps or low-scoring criteria immediately.

### Phase 10: Quality Gates, Consolidation, Version Bump & Release Ceremony (Steps 91–100)
- [x] **Step 91:** Run `bun run test` to ensure all 26 unit and compliance tests pass 100% green.
- [x] **Step 92:** Run `bun run build` to verify production Health Dashboard compiles cleanly across all specs.
- [x] **Step 93:** Consolidate completed subtasks into `.ai-memory/plans/completed/07-agentic-spec-modernization.md`.
- [x] **Step 94:** Update `.ai-memory/plans/readme.md` reflecting completed modernization.
- [x] **Step 95:** Bump version in `package.json` to `3.19.0`.
- [x] **Step 96:** Bump version in `AGENTS.md` and root `readme.md`.
- [x] **Step 97:** Document all modernization achievements in `changelog.md`.
- [x] **Step 98:** Execute release packaging via `release.ps1` to produce `v3.19.0` release artifacts.
- [x] **Step 99:** Create atomic git commit, push `main`, and push release tag `v3.19.0`.
- [x] **Step 100:** Publish formal GitHub Release `v3.19.0` with release notes and assets attached.
