# 31 — Agentic Specification Modernization & WordPress Plugin Alignment

> **Status:** ACTIVE  
> **Authority:** Single Source of Truth for Agentic AI Spec Modernization & WP Realignment  
> **Version:** 3.19.0  
> **Date:** 2026-09-25

---

## User Request (Verbatim)

```text
D:\work\wp-onboarding\wp-plugins\riseup-asia-uploader
D:\work\coding-guidelines

Please go through the spec and check where we can actually improve the spec for all the other spec, like Next.js, Google Search. Okay, so these are very old. So now for the AI and agentic AI, how they could learn better, create a 100 steps plan to first plan it, how you can improve it, and then you improve all the spec. Before doing that, also make a backup branch, make a release, and then you start with this. Is it clear? Do you understand? And make sure when you write the spec, it's very much clear for an AI to follow through, blind AI to follow through. Especially, you're going to improve from the folder 21, okay? Folder 21 to rest of the folders, you are going to improve. Dialog UI, CLI, so all these things you need to improve. For the WordPress plugin stuff or WP plugin builder, you have to look into the WP onboarding folder, okay? That has the rise.php plugin. I'm going to give you this plugin folder path so that you can understand where that is. And based on that, you have to improve your specs, how the code needs to be written, examples to be provided. So many things. So first you write the spec, then also you audit the spec between a score between 0 to 100 on excellent cases like instruction following, AI hallucination, how much accurate it is, does this contain the database information, the file paths, the coding style, how much it differs from the coding guidelines. So many things, okay? I want you to follow through. And also I want you to fix the coding guideline section for inside the spec folder. From the first 20 folders you have to sync with the coding guideline. Okay? Do you understand? Okay, please help me with this. Please list down the tasks, then go with each task at a time. Is it understood?
```

---

## Architectural Objectives & Modernization Standard

### 1. The "Blind AI Follow-Through" Benchmark
A specification is production-grade only if a fresh AI model with zero access to external chat context can execute implementation purely from the spec without guessing or hallucinating:
- **Exact File Paths:** Every component, service, model, and route must declare its exact destination relative path (e.g., `pkg/uploader/chunk_manager.go`, `src/components/dialog/PromptDialog.tsx`).
- **Complete Schemas:** No pseudo-code or hand-waving models. Full SQL table definitions with PascalCase naming, primary keys (`{Table}Id`), foreign keys, and indexes.
- **Concrete Function Signatures:** Return types must use monadic Result wrappers (`result.Result[T]`, `result.ResultSlice[T]`) and structured error types (`*appfault.AppError`).
- **Positive Booleans:** Zero negative boolean names or operators (`isReady`, `hasPermission`, `isComplete`).

### 2. WordPress Plugin Standard (`riseup-asia-uploader` Realignment)
- Reverse-engineer production conventions from `D:\work\wp-onboarding\wp-plugins\riseup-asia-uploader\rise.php`.
- Standardize WP hooks, chunked upload pipelines, transient locks, nonce verification, capabilities (`manage_options`), and modern admin notice rendering.
- Ground specs in `02-spec/34-wp-plugin-sync/`, `02-spec/35-wp-plugin-builder/`, and `02-spec/18-wp-plugin-how-to/` to reflect these exact conventions.

### 3. Application Tiers Modernization (Folders 21 to 60)
- **Folder 21 (App / Spec Management):** Modernize spec platform workflows, project editor contracts, and code generation pipelines.
- **Folder 24 (App UI Design System / Dialog UI):** Modernize dialogs, modals, and canvas controllers using Sweet Digs token primitives.
- **Folder 26 (BRun CLI) & Folder 27 (AI Bridge CLI):** Modernize CLI command trees, STDIN/STDOUT streaming, and process supervisors.
- **Folder 28 (GitMap CLI):** Update split-DB engines, termpad renderers, and pipeline-AI monitors.
- **Folder 29 (GSearch CLI / Google Search):** Eliminate legacy scrapers; establish resilient, structured search APIs.
- **Folder 30+ (WordPress & Auxiliary CLIs):** Standardize OpenAPI specs, database conventions, and error registries.

---

## 0–100 Spec Quality Audit Scorecard Criteria

Every modernized specification will be evaluated against five weighted dimensions:
1. **Instruction Following & Structure (20 pts):** Standard sections (`00-overview`, `data-contracts`, `workflow`, `verification`), lowercase `readme.md`, zero forbidden abbreviations.
2. **Anti-Hallucination & Concrete Details (25 pts):** Strict relative file paths, fully declared models, no `TODO` or placeholders.
3. **Database Architecture & Schema Accuracy (20 pts):** PascalCase tables, Split SQLite or MariaDB schemas, foreign keys, explicit column types.
4. **Coding Guidelines Adherence (20 pts):** Positive booleans, Result wrappers, `*appfault.AppError`, function caps (<= 15 lines).
5. **Verification & Acceptance Criteria (15 pts):** Testable Gherkin criteria (`Given`/`When`/`Then`), automated exit-0 validation commands.

Target Benchmark: ≥ 95/100 across all modernized modules.
