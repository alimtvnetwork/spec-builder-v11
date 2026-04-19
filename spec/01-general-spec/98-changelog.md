# General Spec — Changelog


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

All notable changes to the General Specification are documented here.

---

## v3.0.0 — 2026-03-09

### Global Version Bump

Project-wide major version increment (+1.0.0) applied to all specification files as part of a synchronized versioning milestone.

#### Changed
- All spec files in `01-general-spec` received a major version bump and date update to 2026-03-09.
- Part of a global effort spanning ~638 files across all 30+ spec folders, establishing a new project-wide versioning baseline.
- Reflects cumulative compliance remediations, naming convention fixes, return signature migrations, and structural improvements completed since the last versioned entries.

---

## v2.2.0 — 2026-03-02

### PascalCase JSON Example Key Remediation

Full remediation of camelCase keys in JSON API response/request examples, config examples, AI prompt templates, log format examples, and error responses across ~30 spec files.

#### Changed
- **API Response Envelopes**: `success`/`data`/`error`/`meta` → `Success`/`Data`/`Error`/`Meta` across all standard response formats (01-general-spec, 02-spec-management-software, 10-brun-cli, 30-wp-plugin).
- **Authentication Payloads**: `username`, `displayName`, `accessToken`, `refreshToken`, `expiresIn`, `tokenType`, `deviceInfo`, `allDevices`, `newPassword` → PascalCase.
- **AI Model Registry**: `displayName`, `fileName`, `modelType`, `modelPath`, `fileSizeBytes`, `isEnabled`, `contextSize`, `gpuLayers`, `lastScannedAt` → PascalCase.
- **AI Slot Management**: `slotIndex`, `modelId`, `modelName`, `startedAt`, `lastAccessedAt`, `maxConcurrentModels`, `activeCount`, `wasAlreadyLoaded`, `previousModelId`, `responseTimeMs`, `lastCheckedAt` → PascalCase.
- **Knowledge Sources API**: `sourceType`, `sourceProjectId`, `includeFolders`, `excludeFolders`, `fileExtensions`, `crawlSubPages`, `maxDepth`, `maxPages`, `stayWithinDomain`, `crawlDelayMs`, `respectRobotsTxt`, `totalChunks`, `totalTokens`, `crawledPages`, `jobType`, `processedItems`, `totalItems`, `currentItem`, `startedAt` → PascalCase.
- **Plan Generation**: `projectId`, `specPaths`, `includeTests`, `includeMigrations`, `planId`, `totalFiles`, `totalBatches`, `estimatedTokens`, `dependsOn` → PascalCase.
- **Parallel Executor Config**: `maxWorkersPerProject`, `maxConcurrentProjects`, `taskQueueSize`, `batchTimeout`, `fileTimeout`, `retryAttempts`, `retryDelay` → PascalCase.
- **Sync API**: `operations`, `entityType`, `entityId`, `clientTimestamp`, `serverTimestamp` → PascalCase.
- **AI Prompt Templates**: `needsClarification`, `allowOther`, `estimatedDuration`, `mermaidDiagram` → PascalCase.
- **Transcription API**: `text`, `language`, `duration`, `segments`, `start`, `end`, `confidence` → PascalCase.
- **Code Generation Tasks**: `lastTaskNumber`, `createdAt`, `reusable` → PascalCase.
- **Multi-Model Executor Config**: `complexity_threshold`, `model_pool`, `category_models` → PascalCase (also fixed residual snake_case).
- **Agentic Search Config**: `embeddingModel`, `dimensions`, `neuralModel`, `maxPasses`, `coverageThreshold`, `votingModels`, `minConfidence`, `mmrWeight`, `tokenBudget`, `maxResults`, `minScore` → PascalCase.
- **Microservices Overview**: `timestamp`, `level`, `source`, `function`, `file`, `line`, `code`, `constant`, `message`, `stackTrace`, `retryable` → PascalCase in log/error JSON examples.
- **Scout Search API**: `query`, `projectId`, `searchType`, `topK`, `minScore`, `filters`, `fileTypes`, `chunkId`, `fileId`, `ftsScore`, `vssScore`, `highlights`, `totalCount`, `queryTimeMs`, `maxTokens`, `includeRecent`, `recentCount`, `tokenCount`, `startLine`, `endLine`, `retrievalTimeMs`, `formattedPrompt` → PascalCase.
- **AI Bridge CLI Microservice**: `displayName`, `dataPath`, `createdAt`, `sessionId`, `conversationId`, `errorCode`, `errorConstant`, `stack`, `provider`, `url` → PascalCase.
- **BRun CLI**: Reset API (`scope`, `filter`, `profileIds`, `olderThan`, `resetId`, `expiresAt`, `affectedItems`, `freedSpace`, `completedAt`, `cancelledAt`), port management (`requestedPort`, `availablePort`, `checkedPorts`, `pid`), observability (`runId`, `exitCode`, `errorMsg`, `stackTrace`, `sourceFiles`) → PascalCase.
- **WP Plugin Publish**: Site CRUD (`isActive`, `lastSyncAt`, `createdAt`, `updatedAt`), plugin CRUD (`localPath`, `remoteSlug`, `siteId`, `isWatching`, `lastPublishedAt`, `lastHash`), sync/changes (`pluginId`, `filePath`, `changeType`, `fileHash`, `isPending`, `detectedAt`, `localHash`, `remoteHash`, `isSynced`, `localVersion`, `remoteVersion`, `changedFiles`, `newFiles`, `deletedFiles`), publish (`createBackup`, `pluginSlug`, `wasUpdated`, `backupId`, `filesPublished`), backups (`fileSize`, `pluginVersion`) → PascalCase.
- **WP Frontend Logging**: `examId`, `participantId`, `sessionId`, `action`, `details`, `sectionNumber`, `timestamp` → PascalCase.
- **Cheatsheet Meta**: Standard envelope and error format examples → PascalCase.

#### Preserved (Exemptions)
- JWT standard claims (`sub`, `iat`, `exp`, `jti`, `sid`) — industry standard.
- External API contracts (OpenAI, Ollama, Resend, GitHub, Slack webhook fields).
- WordPress native REST API parameters (`permission_callback`, `sanitize_callback`).
- `package.json` keys and Go `slog` built-in fields (`time`, `level`, `msg`).

---

## v2.1.0 — 2026-03-02

### Alignment with Master Coding Guidelines (spec/23)

Full alignment of `00-overview.md` and `01-foundation/01-coding-standards-foundation.md` with the canonical authority in `spec/02-coding-guidelines/01-cross-language/15-master-coding-guidelines.md`.

#### Added
- **Abbreviation Standard**: All abbreviations treated as words in PascalCase (`Id`, `Url`, `Http`, `Api`, `Json`, `Db`, `Wp`, `Ws`, `Xml`, `Yaml`, `Css`, `Html`). Go stdlib interfaces (`MarshalJSON`) exempted.
- **Zero Underscore Policy**: No underscores permitted in identifiers except `SCREAMING_SNAKE_CASE` non-error constants (e.g., `MAX_RETRY_COUNT`).
- **Enum Type Suffix**: Enum types must end in `Type` (e.g., `StatusType`, `VariableDataType`).
- **Guard Patterns**: Replaced raw null/nil checks with canonical positive guards (`IsDefined()`, `IsDefinedAndValid()`, `HasError()`). Compound guards prohibited.
- **PascalCase Log Keys**: All log context keys use PascalCase (`ErrorCode`, `StackTrace`), not camelCase.
- **PascalCase JSON/API Keys**: All serialized keys use PascalCase (`UserId`, `CreatedAt`).
- **PascalCase Source Files**: File naming standardized to PascalCase across Go, PHP, TypeScript.

#### Changed
- **Language Scope**: Updated primary languages to Go, PHP, TypeScript (Python removed from primary scope).
- **Boolean Prefixes**: Expanded from `is`/`has` to `is`, `has`, `can`, `should`, `was`.
- **Interface Naming**: Dropped `I` prefix requirement (`UserService` not `IUserService`).
- **Constants Split**: Error codes use `ErrPascalCase`; non-error constants remain `SCREAMING_SNAKE_CASE`.
- **Enum Values**: Restricted to `PascalCase` only (removed `SCREAMING_SNAKE` option).
- **If-Avoidance → Positive Boolean Logic**: Replaced "If-Avoidance" principle with `BooleanHelpers` and guard patterns.
- **Error Patterns**: Updated code examples from `ERR_xxxx` to `ErrPascalCase`.
- **Python Helpers Renamed**: `is_different` → `has_mismatch`, `has_no_key` → `is_missing_key`, `is_not_in_list` → `excludes`.

#### Documentation
- Added cross-references to `spec/23` as canonical authority throughout both files.
- Version bumped to 2.1.0.
- All 6 collision tests pass ✓
