 # 43 - Code Pattern Learning System
 
 **Module:** AI Bridge CLI  
 **Version:** 5.0.0  
 **Domain:** Pattern Detection & Replication  
 **Updated:** 2026-03-09  
 **Error Range:** 9850 - 9869
 
 ---
 
 ## 1. Overview
 
 The Code Pattern Learning System enables AI Bridge to automatically detect, catalog, and replicate coding patterns from indexed codebases. This ensures generated code matches the project's existing style, conventions, and architectural decisions.
 
 ---
 
 ## 2. Pattern Categories
 
 ### 2.1 Naming Conventions
 
 | Pattern Type | Detection Method | Example |
 |--------------|------------------|---------|
 | Variable naming | Regex + frequency analysis | camelCase, snake_case, PascalCase |
 | Function naming | AST extraction | `getUser`, `GetUser`, `get_user` |
 | File naming | Directory scan | `user-service.ts`, `UserService.ts` |
 | Constant naming | AST + case detection | `MAX_RETRIES`, `maxRetries` |
 | Database columns | Schema parsing | `CreatedAt` vs `created_at` |
 
 ### 2.2 Error Handling Patterns
 
 | Pattern Type | Detection Method | Storage |
 |--------------|------------------|---------|
 | Error wrapping | AST: `fmt.Errorf`, `errors.Wrap` | ErrorPatterns table |
 | Error codes | Regex: `ERR_\d+`, `E\d{4}` | ErrorCodeRegistry |
 | Try-catch style | AST: catch block analysis | ErrorPatterns table |
 | Result types | Type detection: `Result<T, E>` | TypePatterns table |
 | Custom error types | AST: struct/class extends Error | ErrorPatterns table |
 
 ### 2.3 Architectural Patterns
 
 | Pattern | Detection Signal | Confidence |
 |---------|------------------|------------|
 | Repository pattern | Interface + `Repository` suffix | High |
 | Service layer | `Service` suffix + DI | High |
 | Factory pattern | `New*` or `Create*` functions | Medium |
 | Dependency injection | Constructor params matching interfaces | Medium |
 | Event sourcing | `Event` suffix + `Apply` methods | Medium |
 | CQRS | Separate `Command`/`Query` handlers | Medium |
 
 ### 2.4 Code Organization
 
 | Pattern | Detection Method |
 |---------|------------------|
 | Folder structure | Directory tree analysis |
 | Import grouping | Import statement ordering |
 | File length conventions | Statistical analysis |
 | Comment density | LOC vs comment ratio |
 | Test file placement | `*_test.go`, `*.spec.ts` location |
 
 ---
 
 ## 3. Detection Pipeline
 
 ```
 ┌─────────────────────────────────────────────────────────────────────┐
 │                    PATTERN DETECTION PIPELINE                       │
 ├─────────────────────────────────────────────────────────────────────┤
 │                                                                      │
 │   1. AST EXTRACTION                                                  │
 │      └── Parse all indexed files                                    │
 │      └── Extract: functions, types, variables, imports              │
 │      └── Build symbol table per file                                │
 │                                                                      │
 │   2. STATISTICAL ANALYSIS                                           │
 │      └── Frequency count for naming styles                          │
 │      └── Dominant pattern detection (>70% threshold)                │
 │      └── Outlier identification                                     │
 │                                                                      │
 │   3. PATTERN CLASSIFICATION                                         │
 │      └── Match against known pattern templates                      │
 │      └── Calculate confidence scores                                │
 │      └── Resolve conflicts (prefer higher frequency)                │
 │                                                                      │
 │   4. PATTERN STORAGE                                                 │
 │      └── Store in CodePatterns table                                │
 │      └── Link to source files for examples                          │
 │      └── Version patterns per index run                             │
 │                                                                      │
 │   5. PATTERN EXPORT                                                  │
 │      └── Generate .lovable/patterns.json                            │
 │      └── Human-readable summary                                     │
 │      └── Integration with code generation prompts                   │
 │                                                                      │
 └─────────────────────────────────────────────────────────────────────┘
 ```
 
 ---
 
 ## 4. Database Schema
 
 ### 4.1 CodePatterns Table
 
 ```sql
 CREATE TABLE CodePatterns (
     Id TEXT PRIMARY KEY,
     TaskId TEXT NOT NULL,
     Category TEXT NOT NULL,           -- naming, error, architecture, organization
     PatternType TEXT NOT NULL,        -- specific pattern within category
     PatternValue TEXT NOT NULL,       -- detected value (e.g., "PascalCase")
     Confidence REAL NOT NULL,         -- 0.0 to 1.0
     Frequency INTEGER NOT NULL,       -- occurrence count
     ExampleFiles TEXT,                -- JSON array of file paths
     ExampleSnippets TEXT,             -- JSON array of code snippets
     IsEnforced BOOLEAN DEFAULT 0,     -- user marked as mandatory
     CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
     UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (TaskId) REFERENCES Tasks(Id)
 );
 
CREATE INDEX IdxPatternsTask ON CodePatterns(TaskId);
CREATE INDEX IdxPatternsCategory ON CodePatterns(Category);
CREATE INDEX IdxPatternsConfidence ON CodePatterns(Confidence);
 ```
 
 ### 4.2 PatternViolations Table
 
 ```sql
 CREATE TABLE PatternViolations (
     Id TEXT PRIMARY KEY,
     PatternId TEXT NOT NULL,
     FilePath TEXT NOT NULL,
     LineNumber INTEGER,
     ViolationType TEXT NOT NULL,      -- detected, suggested, auto-fixed
     OriginalCode TEXT,
     SuggestedCode TEXT,
     Status TEXT DEFAULT 'Pending',    -- Pending, Accepted, Rejected, Fixed
     CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (PatternId) REFERENCES CodePatterns(Id)
 );
 ```
 
 ---
 
 ## 5. Pattern Application
 
 ### 5.1 During Code Generation
 
 ```json
 {
   "SystemPrompt": "Generate code following these project patterns:",
   "Patterns": {
     "Naming": {
       "Variables": "camelCase",
       "Functions": "PascalCase", 
       "Files": "kebab-case",
       "DbColumns": "PascalCase"
     },
     "ErrorHandling": {
       "Style": "error-codes",
       "CodeFormat": "AB{NNNN}",
       "WrapFunction": "errors.Wrap"
     },
     "Architecture": {
       "Pattern": "clean-architecture",
       "Layers": ["handler", "service", "repository"],
       "DependencyInjection": true
     }
   },
   "Examples": [
     {"File": "internal/user/service.go", "Snippet": "..."}
   ]
 }
 ```
 
 ### 5.2 Pattern Enforcement Levels
 
 | Level | Behavior |
 |-------|----------|
 | `suggest` | Include patterns in prompt, no validation |
 | `warn` | Generate code, flag violations in output |
 | `enforce` | Reject generation if patterns violated |
 | `auto-fix` | Generate, then auto-correct violations |
 
 ---
 
 ## 6. CLI Commands
 
 ```bash
 # Analyze codebase for patterns
 aibridge patterns analyze --path ./src
 
 # List detected patterns
 aibridge patterns list --category naming
 
 # Export patterns to file
 aibridge patterns export --format json --output .lovable/patterns.json
 
 # Mark pattern as enforced
 aibridge patterns enforce --id PAT_001
 
 # Check code against patterns
 aibridge patterns check --file ./src/new-feature.go
 
 # Auto-fix pattern violations
 aibridge patterns fix --file ./src/new-feature.go --dry-run
 ```
 
 ---
 
 ## 7. API Endpoints
 
 | Method | Endpoint | Description |
 |--------|----------|-------------|
 | POST | `/api/v1/patterns/analyze` | Trigger pattern analysis |
 | GET | `/api/v1/patterns` | List all detected patterns |
 | GET | `/api/v1/patterns/{id}` | Get pattern details |
 | PATCH | `/api/v1/patterns/{id}` | Update pattern (enforce/disable) |
 | GET | `/api/v1/patterns/summary` | Get pattern summary report |
 | POST | `/api/v1/patterns/check` | Check code against patterns |
 | POST | `/api/v1/patterns/export` | Export patterns to file |
 
 ---
 
 ## 8. Error Codes
 
 | Code | Constant | Description |
 |------|----------|-------------|
 | 9850 | `ErrPatternAnalysisFailed` | Pattern detection failed |
 | 9851 | `ErrNoPatternData` | No codebase indexed for analysis |
 | 9852 | `ErrPatternConflict` | Conflicting patterns detected |
 | 9853 | `ErrPatternNotFound` | Pattern ID not found |
 | 9854 | `ErrPatternExportFailed` | Failed to export patterns |
 | 9855 | `ErrPatternViolation` | Code violates enforced pattern |
 | 9856 | `ErrAutoFixFailed` | Automatic fix could not be applied |
 | 9857 | `ErrLowConfidencePattern` | Pattern confidence below threshold |
 | 9858 | `ErrPatternUpdateFailed` | Failed to update pattern |
 | 9859 | `ErrInvalidPatternCategory` | Unknown pattern category |
 
 ---
 
 ## 9. Integration with RAG
 
 When generating code, patterns are injected into the context:
 
 1. **Pre-Generation:** Load `CodePatterns` for task
 2. **Context Assembly:** Include top patterns by confidence
 3. **Example Injection:** Add 1-2 example snippets per pattern
 4. **Post-Generation:** Validate output against enforced patterns
 5. **Feedback Loop:** Log violations, update pattern statistics
 
 ---
 
 ## 10. Pattern Learning Over Time
 
 ```
 ┌─────────────────────────────────────────────────────────────────┐
 │                   PATTERN EVOLUTION                             │
 ├─────────────────────────────────────────────────────────────────┤
 │                                                                  │
 │   Initial Index ──► Pattern Detection ──► Base Patterns        │
 │                                                                  │
 │   User Writes Code ──► Re-index ──► Pattern Refinement         │
 │                                                                  │
 │   User Marks Enforced ──► Confidence Boost ──► Strict Mode     │
 │                                                                  │
 │   Violations Accepted ──► Pattern Adjustment ──► Learning      │
 │                                                                  │
 └─────────────────────────────────────────────────────────────────┘
 ```