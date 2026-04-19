# Phase 7: Spec Management Features Part 1 (01-15) Audit

**Date:** 2026-02-07  
**Auditor:** AI  
**Scope:** `spec/11-spec-management-software/05-features/01-authentication/` through `15-api-client/`  
**Files Reviewed:** 52+ across 15 feature folders  
**Status:** Complete

---

## 1. Inconsistency Report

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-01 | `01-authentication/01-authentication.md` lines 253-296 | **camelCase JSON fields violate PascalCase mandate.** Request body uses `displayName`, `tokenType`, `accessToken`, `refreshToken`, `expiresIn`, `requestId`. Response envelope uses `success`, `data`, `error`, `meta`. All must be PascalCase per project-wide standard (e.g., `DisplayName`, `TokenType`, `AccessToken`). | 🔴 Critical |
| I-02 | `01-authentication/01-authentication.md` lines 301-306 | **camelCase JSON tags in Go struct.** `RegisterRequest` uses `json:"username"`, `json:"email"`, `json:"password"`, `json:"displayName"` — all must be PascalCase: `json:"Username"`, `json:"Email"`, etc. | 🔴 Critical |
| I-03 | `01-authentication/01-authentication.md` line 34 | **Argon2 parameter mismatch with foundation spec.** Auth spec uses `Iterations: 3, Parallelism: 4`. Foundation spec (`01-coding-standards-foundation.md`) AC-P1-016 requires `time_cost = 4, threads = 3`. Parameters are swapped. | 🟡 Warning |
| I-04 | `01-authentication/01-authentication.md` line 415 | **Uses `!valid` negation operator.** Line `if !valid {` violates the No Negation Operator Rule (AC-P1-005). Should use `if isFalse(valid) {` or a helper function. | 🟡 Warning |
| I-05 | `01-authentication/01-authentication.md` line 197 | **Error code format mismatch.** Uses `ERR_PASSWORD_TOO_SHORT (2010)` mixing the `ERR_` prefix with numeric codes. SM CLI uses the `2000-2999` numeric range per error registry, so codes should be plain integers (2010) or consistently use `ERR_` prefix — not both in the same constant name. | 🟡 Warning |
| I-06 | `02-file-management/01-file-operations.md` lines 240-274 | **camelCase JSON fields throughout.** `projectId`, `contentHash`, `sizeBytes`, `createdAt`, `updatedAt`, `requestId`, `createDirectories` — all violate PascalCase mandate. Must be `ProjectId`, `ContentHash`, `SizeBytes`, `CreatedAt`, `UpdatedAt`, `RequestId`, `CreateDirectories`. | 🔴 Critical |
| I-07 | `02-file-management/01-file-operations.md` line 119 | **Direct `s.db.Create(file).Error` bypasses DBOperation wrapper.** All database operations must use the centralized DBOperation wrapper per database standards. | 🟡 Warning |
| I-08 | `03-project-management/01-import-export-system.md` lines 142-157 | **camelCase JSON tags in Go structs.** `ExportOptions` and `ExportResult` use `json:"includeHistory"`, `json:"zipPath"`, etc. Must be PascalCase. | 🔴 Critical |
| I-09 | `03-project-management/01-import-export-system.md` lines 419-423 | **String-based enum `ImportSourceType`.** Uses `type ImportSourceType string` with hardcoded constants `"zip"`, `"markdown"`, `"prd"`, `"folder"`. Must use `type Variant byte` per enum specification. | 🟡 Warning |
| I-10 | `03-project-management/01-import-export-system.md` lines 86-93 | **camelCase in spec.project.json schema.** Fields `aiSettings`, `thinkingModelId`, `writingModelId`, `voiceModelId`, `codingModelId`, `instructionMode`, `createdAt`, `updatedAt` — all violate PascalCase. | 🔴 Critical |
| I-11 | `04-spec-editor/01-markdown-editor.md` lines 171-176 | **Error codes 6001-6003 collide.** Markdown editor uses error codes 6001 ("Save failed"), 6002 ("Conflict detected"), 6003 ("Network error"). These same codes (ERR_6001-6005) are used by `07-history-system/01-git-integration.md` for Git operations. No namespace separation. | 🔴 Critical |
| I-12 | `05-voice-input/01-voice-recorder.md` lines 114-123 | **TypeScript enum pattern inconsistency.** Uses `const RecordingStatus = { Idle: 'idle', ... } as const` with string values. While acceptable for TypeScript frontend, the values use lowercase strings when the Go backend equivalents (if any) would use `byte`-based enums. Cross-boundary mapping is undefined. | 🟠 Minor |
| I-13 | `05-voice-input/01-voice-recorder.md` line 402 | **Hardcoded WebSocket URL `ws://localhost:8086`.** Port 8086 is not documented in any central port allocation table. Conflicts with shared CLI frontend port assignments need verification. | 🟡 Warning |
| I-14 | `06-ai-integration/01-ai-integration.md` lines 70-78 | **camelCase JSON tags in Go struct.** `LLaMAConfig` uses `json:"serverPath"`, `json:"host"`, `json:"port"`, etc. Must be PascalCase. | 🔴 Critical |
| I-15 | `06-ai-integration/01-ai-integration.md` lines 87-89 | **Raw SQL query in ConfigService.** `SELECT Key, Value FROM Config WHERE Key LIKE 'llama.%'` violates the ORM-only policy. Must use ORM (GORM) with model-based queries. | 🔴 Critical |
| I-16 | `06-ai-integration/01-ai-integration.md` lines 131-134 | **Raw SQL INSERT in ConfigService.** Uses `INSERT INTO Config ... ON CONFLICT(Key) DO UPDATE` raw SQL. Must use GORM's `Save()` or `Clauses(clause.OnConflict{...})`. | 🔴 Critical |
| I-17 | `06-ai-integration/01-ai-integration.md` lines 252-259 | **String-based enum `ModelCategory`.** Uses `type ModelCategory string` with constants `"thinking"`, `"writing"`, `"voice"`, `"coding"`. Must use `type Variant byte` per enum specification. Already defined in SM enum architecture as `model_category.Variant`. | 🟡 Warning |
| I-18 | `06-ai-integration/01-ai-integration.md` lines 308-317 | **Raw SQL INSERT for ModelRegistry.** `INSERT INTO ModelRegistry ... ON CONFLICT(FileName) DO UPDATE` bypasses ORM and DBOperation wrapper. | 🔴 Critical |
| I-19 | `06-ai-integration/01-ai-integration.md` lines 376-380 | **camelCase JSON tags in CategoryModelOverrides.** Uses `json:"thinkingModelId,omitempty"` — must be `json:"ThinkingModelId,omitempty"`. | 🔴 Critical |
| I-20 | `07-history-system/01-git-integration.md` lines 150-157 | **CommitQueueEntry uses plain `string` for Action field.** The `Action` field with values "created", "updated", "renamed", "moved", "deleted" should use a `commit_action.Variant` enum. | 🟡 Warning |
| I-21 | `07-history-system/01-git-integration.md` lines 209 | **Error code format `ERR_6001` prefix.** Uses `ERR_6001` through `ERR_6005` but the SM CLI uses numeric-only error codes in the 2000-2999 range. The `6xxx` range is not allocated in the error code registry. | 🔴 Critical |
| I-22 | `07-history-system/01-git-integration.md` lines 399-418 | **camelCase JSON fields in API responses.** `lastCommit`, `pendingPush`, `filesCommitted` — all must be PascalCase. | 🔴 Critical |
| I-23 | `08-consistency-checker/01-consistency-checker.md` lines 38-78 | **TypeScript interface uses camelCase fields.** `reportId`, `projectId`, `reportType`, `generatedAt`, `durationMs`, `totalFilesScanned`, `brokenLinks`, `warningsCount`, `errorsCount`, `autoFixable`, `estimatedEffort`, `affectedFiles` — all must be PascalCase for API transport. | 🔴 Critical |
| I-24 | `08-consistency-checker/01-consistency-checker.md` line 41 | **String union type for reportType.** Uses `'cross-reference' | 'schema-api' | 'terminology' | 'completeness' | 'full-health'` — should map to a `report_type.Variant` enum on the backend. | 🟠 Minor |
| I-25 | `09-knowledge-memory/01-rag-system.md` line 54 | **Path structure conflict.** RAG system shows `{workDirectory}/spec/{project-slug}/ideas/` but file management spec (02) shows `{workDirectory}/{ProjectSlug}/ideas/` without the `spec/` intermediate directory. Path structure is inconsistent. | 🟡 Warning |
| I-26 | `10-theme-system/01-theme-provider.md` line 58 | **ThemeId as string union.** Uses `type ThemeId = 'light' | 'dark' | 'ocean' | 'forest'` — acceptable for TypeScript frontend, but the multi-theme seeding spec (`03-multi-theme-seeding.md`) must use PascalCase values in the database seed if stored server-side. | 🟠 Minor |
| I-27 | `11-dashboard/01-project-dashboard.md` lines 82-83 | **Undefined types referenced.** `ProjectStatus[]` and `SearchResult[]` are used without definition or cross-reference to where they are defined. | 🟠 Minor |
| I-28 | `13-error-ui/01-error-components.md` line 94 | **Direct `location.reload()` usage.** Uses `onClick: () => location.reload()` which is a side effect pattern. Should use a service method for consistency. | 🟠 Minor |
| I-29 | `15-api-client/01-http-client.md` line 79 | **camelCase error response fields.** Uses `response?.data?.code`, `response?.data?.message`, `response?.data?.details` — depends on backend sending camelCase which violates PascalCase mandate. | 🟡 Warning |
| I-30 | `00-overview.md` lines 24-31 | **Statistics outdated.** States "Total Feature Folders: 25" but actual count is 30 (01-30). File counts also appear outdated. | 🟠 Minor |
| I-31 | `00-overview.md` lines 37-64 | **Folder tree missing features 26-30.** Tree only shows up to `25-ai-enhancements` but `26-ai-code-generation`, `27-automation-pipeline`, `28-project-editor`, `29-trigger-event-system`, `30-ai-bridge` exist. | 🟡 Warning |
| I-32 | `00-overview.md` line 126 | **Percentage math error.** Category percentages sum to 131% (37+19+27+48=131), not 100%. The "Percentage" column is misleading. | 🟠 Minor |

---

## 2. Missing Acceptance Criteria

**All 52+ files across features 01-15 lack formal GIVEN/WHEN/THEN acceptance criteria.** While many have detailed code samples and interface definitions, none include testable criteria suitable for E2E test generation.

---

## 3. Detailed Acceptance Criteria

### 3.1 Authentication (`01-authentication/`)

---

**AC-P7-001: User Registration**

GIVEN: A client sends `POST /api/v1/auth/register` with valid username, email, password, and optional display name

WHEN: The server processes the registration request

THEN:
- Username MUST be validated: 3-30 chars, alphanumeric + underscore, unique (case-insensitive)
- Email MUST be validated: RFC 5322 format, unique (case-insensitive, stored lowercase)
- Password MUST be validated per rules: 8-128 chars, 1 uppercase, 1 lowercase, 1 digit, not in common passwords list, not similar to username/email
- Password MUST be hashed using Argon2id with parameters: memory=64MB, iterations=3, parallelism=4, salt=16 bytes, key=32 bytes
- A User record MUST be created with `IsActive = true`
- JWT access token (15 min expiry) and refresh token (7 day expiry) MUST be generated
- A Session record MUST be created linking user, refresh token, and device info
- Response MUST use PascalCase JSON fields: `Success`, `Data`, `Error`, `Meta`
- HTTP status MUST be `201 Created`

EDGE CASES:
- Registration with existing username (different case) MUST return error code 2020
- Registration with email containing `+` aliases MUST be treated as unique (not deduplicated)
- Concurrent registrations with same username MUST be handled via database unique constraint — second request gets error, not duplicate user
- Password exactly 128 characters MUST be accepted; 129 characters MUST be rejected

---

**AC-P7-002: Login with Brute Force Protection**

GIVEN: A client sends `POST /api/v1/auth/login` with identifier (username or email) and password

WHEN: The server processes the login request

THEN:
- System MUST look up user by username OR email (single query, same error for both "not found" and "wrong password")
- After 3 failed attempts within 1 hour: 30 second delay before next attempt allowed
- After 5 failed attempts within 1 hour: 5 minute lockout
- After 10 failed attempts within 1 hour: 30 minute lockout
- After 20 failed attempts: account locked (requires manual unlock)
- On successful login: failed attempt counter MUST be cleared
- If stored password uses legacy bcrypt hash: MUST transparently rehash with Argon2id and update stored hash
- `LastLoginAt` MUST be updated on successful login
- Response MUST include JWT access and refresh tokens

EDGE CASES:
- Login attempt on a locked account MUST return error code indicating lockout duration remaining
- Login with disabled account (`IsActive = false`) MUST return specific error (not generic "invalid credentials")
- Simultaneous login from two devices MUST create two separate sessions

---

**AC-P7-003: JWT Token Refresh**

GIVEN: A client sends a valid refresh token to the token refresh endpoint

WHEN: The server processes the refresh request

THEN:
- The refresh token MUST be validated for: existence in sessions table, not expired, not revoked
- A new access token MUST be generated with fresh 15-minute expiry
- A new refresh token MUST be generated (rotation) and the old one MUST be invalidated
- If the old refresh token has already been used (replay attack), ALL sessions for that user MUST be revoked
- Response MUST contain new access token and new refresh token

EDGE CASES:
- Refresh with expired token MUST return 401 and redirect to login
- Refresh with revoked token MUST trigger security alert (potential token theft)
- Clock skew of up to 30 seconds MUST be tolerated for token expiry checks

---

### 3.2 File Management (`02-file-management/`)

---

**AC-P7-004: File Path Validation**

GIVEN: A file operation (create, move, rename) is requested with a path

WHEN: The path is validated

THEN:
- Path MUST NOT exceed 255 characters (error: ERR_PATH_TOO_LONG)
- Path MUST NOT contain double slashes `//` (error: ERR_INVALID_PATH)
- Path MUST NOT contain backslashes `\` (error: ERR_INVALID_PATH)
- Path MUST NOT contain `..` path traversal (error: ERR_PATH_TRAVERSAL)
- Filename MUST match pattern `{NN}-{kebab-case}.md` or `README.md`
- Path MUST NOT match reserved patterns: `.git`, `.git/*`, `.history`, `.history/*`, `node_modules`, `node_modules/*`
- All paths stored in database MUST be relative (never absolute)

EDGE CASES:
- Path with trailing slash (directory) MUST be accepted for directory operations, rejected for file operations
- Path `spec/00-overview.md` at max length (255 chars) MUST be accepted; 256 chars MUST be rejected
- Unicode characters in paths MUST be rejected (ASCII alphanumeric + hyphens only)
- Null bytes in path strings MUST be stripped or rejected

---

**AC-P7-005: File CRUD with Optimistic Locking**

GIVEN: A user updates a file via `PUT /api/v1/projects/{projectId}/files/{fileId}`

WHEN: The `ExpectedHash` field is provided in the request

THEN:
- If `ExpectedHash` matches current file's `ContentHash`: update proceeds normally
- If `ExpectedHash` does NOT match: server MUST return HTTP 409 with error code indicating conflict
- If `ExpectedHash` is omitted: update proceeds (forced overwrite)
- On successful update: a `FileSnapshot` record MUST be created with the previous content
- On successful update: git auto-commit MUST be triggered (debounced by 2 seconds)
- The new `ContentHash` (SHA-256) MUST be returned in the response

EDGE CASES:
- Two simultaneous updates with same `ExpectedHash`: first succeeds, second gets 409
- Update with empty content (0 bytes) MUST be accepted (valid empty file)
- Update to a soft-deleted file MUST return 404

---

**AC-P7-006: Soft Delete and Trash Recovery**

GIVEN: A file delete is requested via `DELETE /api/v1/projects/{projectId}/files/{fileId}`

WHEN: The `Permanent` query parameter is `false` (default)

THEN:
- File MUST be moved to `.trash/` directory on disk
- `DeletedAt` timestamp MUST be set in database (soft delete)
- File MUST be recoverable for 30 days
- After 30 days, file MUST be automatically purged (permanent delete)
- Soft-deleted files MUST NOT appear in normal directory listings unless `IncludeDeleted=true`
- Recovery MUST restore file to original path; if original path is now occupied, MUST return conflict error

EDGE CASES:
- Deleting a file that is already soft-deleted MUST return appropriate error
- Permanent delete (`Permanent=true`) MUST cascade delete all snapshots
- Deleting a directory MUST soft-delete all contained files recursively

---

### 3.3 Import/Export (`03-project-management/`)

---

**AC-P7-007: Project Export**

GIVEN: A user requests project export via `POST /api/v1/projects/:id/export`

WHEN: The export job is processed

THEN:
- Export MUST create a ZIP file named `{project-slug}-export-YYYY-MM-DD.zip`
- ZIP MUST contain `spec.project.json` with project metadata
- ZIP MUST contain `export-manifest.json` with SHA-256 checksums for all files
- Files MUST be organized in the same directory structure as the project
- If `IncludeHistory = false`: `.history/` directory MUST be excluded
- If `IncludeIdeas = false`: `ideas/` directory MUST be excluded
- Export MUST return `202 Accepted` with an export ID for status polling
- Completed exports MUST have a download URL that expires after 24 hours

EDGE CASES:
- Export of project with 0 files MUST still produce valid ZIP with `spec.project.json` only
- Export of project with 1000+ files MUST complete within 60 seconds
- Concurrent export requests for same project MUST be deduplicated (return existing job ID)

---

**AC-P7-008: Project Import**

GIVEN: A user uploads a ZIP archive or single markdown file for import

WHEN: The import is processed

THEN:
- System MUST auto-detect import type: ZIP (by extension), PRD (by content analysis with 3+ indicator matches), or plain Markdown
- For ZIP imports: `spec.project.json` MUST be parsed to pre-fill project name, description, tags
- For ZIP imports: if `spec.project.json` is missing but valid spec folder structure exists, system MUST auto-generate it
- For PRD imports: system MUST split document into individual spec files by heading structure
- All imported file paths MUST be validated against PATH-01 through PATH-10 rules
- Import MUST be idempotent: re-importing same content MUST update existing files (by path), not create duplicates

EDGE CASES:
- ZIP with path traversal (`../../../etc/passwd`) MUST be rejected with security error
- ZIP bomb (highly compressed, expanding to >1GB) MUST be rejected with size limit error
- Import of ZIP with 0 valid markdown files MUST return error, not create empty project
- Encoding detection: files with BOM (Byte Order Mark) MUST have BOM stripped

---

### 3.4 Spec Editor (`04-spec-editor/`)

---

**AC-P7-009: Auto-Save with Conflict Detection**

GIVEN: A user is editing a markdown file in the spec editor

WHEN: The user stops typing for 1000ms (configurable debounce)

THEN:
- Auto-save MUST trigger with the current `ExpectedHash` for optimistic locking
- Status indicator MUST show "Saving..." during the save operation
- On success: status MUST show "Saved" with timestamp
- On 409 Conflict: a conflict modal MUST appear with options: Overwrite, Reload, or Merge (future)
- On network error: status MUST show "Connection lost. Changes saved locally." and content MUST be preserved in localStorage
- Retry on network failure MUST use exponential backoff (1s, 2s, 4s, max 30s)

EDGE CASES:
- Closing browser tab during save MUST attempt `navigator.sendBeacon` to save
- Rapid typing producing many saves MUST be debounced to at most 1 save per second
- File content exceeding 5MB MUST show warning but still allow save

---

### 3.5 Voice Input (`05-voice-input/`)

---

**AC-P7-010: Voice Recording with WebSocket Streaming**

GIVEN: A user clicks the Record button in the VoiceRecorder component

WHEN: Microphone permission is granted and WebSocket connection is established

THEN:
- Audio MUST be captured at 16kHz sample rate, mono channel, PCM16 format
- Audio MUST be streamed to Voice-CLI service via WebSocket in chunks of 4096 samples (~100ms)
- Waveform visualization MUST update in real-time on a canvas element
- VAD state changes (silence → speech → silence) MUST be reflected in the StatusIndicator
- Partial transcripts MUST appear in TranscriptPreview as they arrive
- Final transcripts MUST include confidence score and word-level timestamps
- Recording MUST auto-stop after 5 minutes (MAX_RECORDING_DURATION_MS = 300000)

EDGE CASES:
- Microphone permission denied MUST show PermissionPrompt component, not crash
- WebSocket disconnection during recording MUST trigger reconnection (max 5 attempts, 1s delay)
- Browser tab losing focus MUST NOT pause audio capture (AudioWorklet runs in separate thread)
- Multiple simultaneous recordings MUST be prevented (only one VoiceRecorder active at a time)

---

### 3.6 AI Integration (`06-ai-integration/`)

---

**AC-P7-011: Model Resolution Hierarchy**

GIVEN: An AI task is initiated requiring a model for a specific category (thinking, writing, voice, coding)

WHEN: The system resolves which model to use

THEN:
- Priority 1: Per-instruction override (explicit model selection for this task) MUST be checked first
- Priority 2: Per-project default MUST be checked if no instruction override
- Priority 3: Per-user default MUST be checked if no project default
- Priority 4: System default (from config table) MUST be checked if no user default
- Priority 5: First enabled model of the requested category MUST be used as final fallback
- Resolution MUST complete in <10ms (all data is in SQLite, no network calls)

EDGE CASES:
- Selected model that no longer exists on disk MUST fall to next priority level, not error
- Category with no models at all MUST return a clear error (not null/panic)
- Model file that exists but is corrupted (invalid GGUF) MUST be flagged as `model_status.Corrupted`

---

**AC-P7-012: Model Registry Scan**

GIVEN: The system scans configured model root paths for GGUF files

WHEN: `SyncRegistry()` is called

THEN:
- All directories in `llama.models.rootPaths` config MUST be scanned
- Only files ending in `.gguf` MUST be registered
- Model category MUST be inferred from filename patterns (whisper→voice, code→coding, think/r1→thinking, default→writing)
- New models MUST be inserted into `ModelRegistry` table via ORM (not raw SQL)
- Existing models (matched by FileName) MUST have path, size, and category updated
- Inaccessible root paths MUST be skipped with a warning log, not cause scan failure

EDGE CASES:
- Symlinked model files MUST be resolved to their real path
- Model files with identical names in different root paths: the first discovered MUST take precedence
- Empty root paths config MUST return empty results, not error

---

### 3.7 History System (`07-history-system/`)

---

**AC-P7-013: Git Auto-Commit with Debounce**

GIVEN: A file is created, updated, or deleted in the project

WHEN: The commit queue processes the change

THEN:
- Changes MUST be debounced by 2000ms (configurable via `commit_debounce_ms`)
- Multiple changes within the debounce window MUST be batched into a single commit
- Rename and Move operations MUST trigger immediate commits (bypass debounce) for full reversibility
- Commit message MUST follow format: `[Spec] {Action}: {Target}` with file count and username
- Bulk commits (2+ files) MUST list up to 10 file paths, then `... and N more`
- If auto-push is enabled: push MUST be triggered asynchronously after commit
- Push failures MUST retry up to 3 times with 5000ms delay between attempts

EDGE CASES:
- 100 rapid file changes within 2 seconds MUST result in exactly 1 commit
- Push failure after all retries MUST record failed push for manual retry, not block future commits
- Git repository not initialized MUST return ERR_6003 and disable auto-commit gracefully

---

### 3.8 Consistency Checker (`08-consistency-checker/`)

---

**AC-P7-014: Cross-Reference Validation**

GIVEN: A consistency check of type `cross-reference` is triggered for a project

WHEN: The checker scans all markdown files

THEN:
- Every internal markdown link `[text](path)` MUST be resolved relative to the containing file
- Links starting with `http` MUST be skipped (external links)
- Links with `#anchor` MUST validate that the heading exists in the target file
- Anchors MUST be computed as lowercase, hyphenated versions of headings
- Broken links MUST be reported as findings with severity `error`, file path, and line number
- The report MUST include a health score (0-100) and letter grade (A=90+, B=80+, C=70+, D=60+, F=<60)
- `AutoFixable` MUST be set to `true` for findings where the correct target can be inferred (e.g., renamed file)

EDGE CASES:
- Circular references (A→B→A) MUST be detected but not flagged as errors
- Links to files outside the project directory MUST be flagged as warnings
- Empty link targets `[text]()` MUST be flagged as errors
- Links in code blocks (fenced with ```) MUST be ignored

---

### 3.9 Knowledge Memory / RAG (`09-knowledge-memory/`)

---

**AC-P7-015: Idea-to-Instruction Promotion**

GIVEN: An idea file exists in the `ideas/` folder and the user triggers promotion

WHEN: The promotion workflow executes

THEN:
- A new file MUST be created in `instructions/` with pattern `{NN}-instruction-{slug}.md`
- The sequence number MUST be `MAX(existing instruction numbers) + 1`
- The original idea file MUST remain in `ideas/` (not deleted)
- A `PromotionEvent` record MUST be created linking the idea file to the instruction file
- The RAG index MUST be updated to include the new instruction
- The promoted instruction MUST inherit the idea's content with optional refinement

EDGE CASES:
- Promoting the same idea twice MUST be allowed (creates two separate instructions)
- Promoting an idea when `instructions/` folder doesn't exist MUST auto-create it
- Promotion of idea with sequence number gap (e.g., only 01 and 05 exist) MUST use next number (06), not fill gap

---

### 3.10 Theme System (`10-theme-system/`)

---

**AC-P7-016: Theme Switching**

GIVEN: The application is running with the ThemeProvider wrapping the component tree

WHEN: The user calls `setTheme('dark')` via the useTheme hook

THEN:
- CSS variables on `:root` MUST be updated immediately (no page reload)
- All HSL-based color tokens MUST be swapped: `--background`, `--foreground`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`
- Theme preference MUST be persisted to localStorage
- On next page load, persisted theme MUST be applied before first paint (no flash of wrong theme)
- `toggleTheme()` MUST cycle through: light → dark → ocean → forest → light
- `systemTheme` MUST reflect the OS `prefers-color-scheme` media query

EDGE CASES:
- localStorage unavailable (private browsing) MUST fall back to system theme without error
- Invalid theme ID in localStorage MUST fall back to 'light'
- Theme switch during animation MUST not cause visual glitches (transition CSS property recommended)

---

### 3.11 Dashboard (`11-dashboard/`)

---

**AC-P7-017: Project Dashboard**

GIVEN: An authenticated user navigates to the root path `/`

WHEN: The ProjectDashboard component renders

THEN:
- Quick stats MUST display: total projects, total spec files, average health score, recent edits (7 days)
- Projects MUST be displayed as cards in a responsive grid (1 col mobile, 2 col tablet, 3-4 col desktop)
- Each project card MUST show: name, description (truncated), file count, last modified date, health score badge, visibility indicator
- A "+ New Project" card MUST always be visible as the last card
- Search MUST filter projects by name, description, and tags in real-time
- View mode toggle (grid/list) MUST persist to localStorage

EDGE CASES:
- User with 0 projects MUST see an onboarding empty state with "Create your first project" CTA
- Project with 0 files MUST show "Empty" badge, not "0 files"
- Health score that hasn't been computed MUST show "—" not "0"

---

### 3.12 Routing (`12-routing-navigation/`)

---

**AC-P7-018: Protected Route Navigation**

GIVEN: A user attempts to navigate to a protected route (e.g., `/projects/:id`)

WHEN: The ProtectedRoute guard evaluates authentication state

THEN:
- If authenticated: route content MUST render normally
- If not authenticated: user MUST be redirected to `/login` with `state.from` set to the attempted URL
- After successful login: user MUST be redirected back to the originally attempted URL
- If loading auth state: a loading spinner MUST be shown (not a flash of login page)
- ProjectGuard MUST additionally verify the user has access to the specific project

EDGE CASES:
- Deep link to `/projects/invalid-uuid/editor/file-id` with valid auth but invalid project MUST redirect to `/` (dashboard)
- Browser back button after login redirect MUST not show login page if already authenticated
- Expired JWT during navigation MUST trigger silent token refresh before showing login

---

### 3.13 Error UI (`13-error-ui/`)

---

**AC-P7-019: Error Boundary Recovery**

GIVEN: A React component throws an error during rendering

WHEN: The ErrorBoundary catches the error

THEN:
- The error MUST be caught without crashing the entire application
- A fallback UI MUST be displayed with: error description, "Try Again" button, "Go Home" link
- The `onError` callback MUST be invoked with the error and component stack trace
- Clicking "Try Again" MUST attempt to re-render the failed component
- `resetKeys` prop changes MUST automatically reset the error boundary state
- In development mode: the full stack trace MUST be shown; in production: only user-friendly message

EDGE CASES:
- Error in the error boundary's fallback itself MUST propagate to parent boundary
- Async errors (in useEffect) are NOT caught by ErrorBoundary — these MUST be handled by the API client interceptor
- Error boundary MUST reset when navigating to a different route

---

### 3.14 Mobile Responsive (`14-mobile-responsive/`)

---

**AC-P7-020: Responsive Layout Breakpoints**

GIVEN: The application is rendered at different viewport widths

WHEN: The viewport crosses a breakpoint threshold

THEN:
- Mobile (<640px): sidebar MUST be hidden, bottom navigation MUST appear, content MUST be full-width
- Tablet (768px-1023px): sidebar MUST show in collapsed (icons-only) mode, no bottom navigation
- Desktop (≥1024px): sidebar MUST show fully expanded with labels
- Sidebar on mobile MUST be accessible via hamburger menu as a slide-in drawer (Sheet component)
- Grid layouts MUST adapt: 1 col (mobile), 2 cols (sm), 3 cols (lg), 4 cols (xl)
- All interactive elements MUST have minimum touch target of 44×44px on mobile

EDGE CASES:
- Orientation change (portrait → landscape) MUST trigger layout recalculation
- Sidebar open state MUST persist across route navigation on desktop, but auto-close on mobile after selection
- Editor panel on mobile MUST use full screen with swipe-to-dismiss for preview

---

### 3.15 API Client (`15-api-client/`)

---

**AC-P7-021: Token Refresh on 401**

GIVEN: The API client receives a 401 Unauthorized response

WHEN: The response interceptor processes the error

THEN:
- The interceptor MUST attempt to refresh the access token using the stored refresh token
- If refresh succeeds: the original failed request MUST be automatically retried with the new token
- If refresh fails: the user MUST be redirected to `/login`
- Multiple concurrent 401 responses MUST share a single refresh attempt (not trigger multiple refreshes)
- All queued requests waiting for refresh MUST be retried after successful refresh

EDGE CASES:
- 401 on the refresh endpoint itself MUST NOT trigger another refresh (infinite loop prevention)
- Network error during refresh MUST redirect to login after retry timeout
- Requests made while refresh is in-progress MUST be queued and resolved when refresh completes

---

## 4. Remediation Priorities

### Priority 1: Critical (Must Fix)
1. **PascalCase JSON fields** — Convert ALL camelCase JSON fields/tags across features 01-15 to PascalCase (I-01, I-02, I-06, I-08, I-10, I-14, I-19, I-22, I-23)
2. **Raw SQL elimination** — Replace all raw SQL in `06-ai-integration/01-ai-integration.md` with GORM operations (I-15, I-16, I-18)
3. **Error code collision** — Resolve 6001-6005 collision between markdown editor and git integration (I-11, I-21)
4. **DBOperation wrapper** — Wrap all `db.Create()` calls in centralized wrapper (I-07)

### Priority 2: Warning (Should Fix)
5. **String-based enums** — Convert `ImportSourceType`, `ModelCategory`, `CommitQueueEntry.Action` to `byte` enums (I-09, I-17, I-20)
6. **Argon2 parameter alignment** — Reconcile iterations/parallelism between auth spec and foundation spec (I-03)
7. **Negation operators** — Replace `!valid` with helper functions (I-04)
8. **Path structure alignment** — Reconcile RAG path vs file management path (I-25)
9. **Features overview update** — Add features 26-30, fix percentage math, update counts (I-30, I-31, I-32)
10. **Port allocation** — Document Voice-CLI port 8086 in central allocation table (I-13)

### Priority 3: Minor
11. **TypeScript enum patterns** — Document cross-boundary mapping between TS `as const` and Go `byte` enums (I-12, I-24, I-26)
12. **Undefined type references** — Add cross-references for `ProjectStatus`, `SearchResult` (I-27)

---

## 5. Cross-References

| Resource | Location |
|----------|----------|
| Features Overview | `spec/11-spec-management-software/05-features/00-overview.md` |
| Database Schema | `spec/11-spec-management-software/07-database-design/01-schema.md` |
| Error Management | `spec/11-spec-management-software/06-error-management/00-overview.md` |
| Enum Specification | `spec/17-enum-specification/` |
| Foundation Standards | `spec/01-general-spec/01-foundation/` |
| SM Enum Architecture | SM enum architecture (29 categories, 50/50 compliant) |

---

*Phase 7 audit complete. 32 inconsistencies identified. 21 acceptance criteria generated (AC-P7-001 through AC-P7-021).*
