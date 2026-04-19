 # 47 - AI Bridge Onboarding Guide
 
 **Module:** AI Bridge CLI  
 **Domain:** Developer Onboarding  
 **Version:** 5.0.0
 **Updated:** 2026-03-09
 
 ---
 
 ## 1. Overview
 
 This guide walks through the complete AI Bridge workflow from codebase indexing to intelligent code generation. Follow these steps to enable AI-assisted development with full pattern recognition and plan-based execution.
 
 ---
 
 ## 2. Complete Workflow Diagram
 
 ```
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                        AI BRIDGE COMPLETE WORKFLOW                              │
 ├─────────────────────────────────────────────────────────────────────────────────┤
 │                                                                                  │
 │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
 │  │   PHASE 1   │     │   PHASE 2   │     │   PHASE 3   │     │   PHASE 4   │   │
 │  │   INDEX     │────►│   DETECT    │────►│   PLAN      │────►│   EXECUTE   │   │
 │  │   CODEBASE  │     │   PATTERNS  │     │   CREATION  │     │   WITH      │   │
 │  │             │     │             │     │             │     │   REASONING │   │
 │  └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘   │
 │        │                   │                   │                   │            │
 │        ▼                   ▼                   ▼                   ▼            │
 │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
 │  │ • Scan      │     │ • Naming    │     │ • Task      │     │ • Clarify   │   │
 │  │ • Parse     │     │ • Errors    │     │   Breakdown │     │ • Confirm   │   │
 │  │ • Chunk     │     │ • Arch      │     │ • Deps      │     │ • Generate  │   │
 │  │ • Embed     │     │ • Style     │     │ • Markdown  │     │ • Verify    │   │
 │  │ • Store     │     │ • Helpers   │     │ • Approval  │     │ • Report    │   │
 │  └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘   │
 │                                                                                  │
 └─────────────────────────────────────────────────────────────────────────────────┘
 ```
 
 ---
 
 ## 3. Phase 1: Index Codebase
 
 ### 3.1 Quick Start
 
 ```bash
 # Initialize AI Bridge for your project
 aibridge init
 
 # Index entire codebase (first time)
 aibridge index --path ./
 
 # Index with language filter
 aibridge index --path ./ --lang go,ts,js
 
 # Incremental re-index (only changed files)
 aibridge index --incremental
 ```
 
 ### 3.2 What Happens During Indexing
 
 ```
 ┌─────────────────────────────────────────────────────────────────┐
 │                   RAG INDEXING PIPELINE                         │
 ├─────────────────────────────────────────────────────────────────┤
 │                                                                  │
 │  1. SCAN        Discover all source files, compute SHA256       │
 │       │         Skip unchanged files (incremental mode)         │
 │       ▼                                                          │
 │  2. PARSE       Extract AST for Go/TypeScript/JavaScript        │
 │       │         Identify functions, structs, interfaces         │
 │       ▼                                                          │
 │  3. CHUNK       Split into semantic chunks (300-500 tokens)     │
 │       │         Preserve context boundaries                     │
 │       ▼                                                          │
 │  4. EMBED       Generate vectors via nomic-embed-text           │
 │       │         Normalize embeddings for cosine similarity      │
 │       ▼                                                          │
 │  5. STORE       Persist to Split DB architecture                │
 │                 data/{app}/rag/code/{company}/{task}.db         │
 │                                                                  │
 └─────────────────────────────────────────────────────────────────┘
 ```
 
 ### 3.3 CLI Output Example
 
 ```
 $ aibridge index --path ./
 
 ✓ Scanning codebase...
   Found 247 files (Go: 189, TS: 42, JS: 16)
   
 ✓ Parsing source files...
   Extracted 1,247 functions, 89 structs, 34 interfaces
   
 ✓ Chunking content...
   Created 2,891 semantic chunks
   
 ✓ Generating embeddings...
   [████████████████████████████████] 100%
   
 ✓ Storing in database...
   Saved to: data/myapp/rag/code/acme/001-abc123.db
   
 ═══════════════════════════════════════════════════
 INDEX COMPLETE
 ═══════════════════════════════════════════════════
 Files indexed:     247
 Chunks created:    2,891
 Patterns detected: 12
 Time elapsed:      4.2s
 Recall accuracy:   94%
 ```
 
 ### 3.4 Memory Classification
 
 Mark critical chunks for priority retrieval:
 
 ```bash
 # Mark a chunk as critical (always retrieved)
 aibridge chunk mark --id chunk_abc123 --critical
 
 # Mark as important (high priority)
 aibridge chunk mark --id chunk_def456 --important
 
 # View classified chunks
 aibridge chunk list --filter critical
 ```
 
 ---
 
 ## 4. Phase 2: Detect Patterns
 
 ### 4.1 Automatic Pattern Detection
 
 After indexing, AI Bridge automatically analyzes your codebase for patterns:
 
 ```bash
 # View detected patterns
 aibridge patterns list
 
 # Output:
 # CATEGORY       PATTERN                    CONFIDENCE   OCCURRENCES
 # ─────────────────────────────────────────────────────────────────
 # Naming         PascalCase functions       94%          847/901
 # Naming         PascalCase DB columns      100%         234/234
 # Error          fmt.Errorf with code       87%          156/179
 # Error          errors.Wrap usage          91%          89/98
 # Architecture   Service-Repository         88%          12/14
 # Architecture   Handler interface          92%          23/25
 # Style          Table-driven tests         76%          34/45
 ```
 
 ### 4.2 Pattern Categories
 
 | Category | What AI Bridge Detects |
 |----------|------------------------|
 | **Naming** | Function naming, variable casing, file naming conventions |
 | **Error Handling** | Error wrapping style, error code usage, return patterns |
 | **Architecture** | Layer patterns (service/repository), dependency injection |
 | **Style** | Test patterns, comment style, import organization |
 | **Database** | ORM patterns, query construction, relationship handling |
 
 ### 4.3 Pattern Customization
 
 ```bash
 # Add manual pattern rule
 aibridge patterns add --name "DBOperation Wrapper" \
   --category "database" \
   --regex "DBOperation\{.*\}" \
   --confidence 100
 
 # Disable a detected pattern
 aibridge patterns disable --id pat_abc123
 
 # Export patterns for sharing
 aibridge patterns export --output patterns.json
 ```
 
 ---
 
 ## 5. Phase 3: Create Plan
 
 ### 5.1 Generate Implementation Plan
 
 ```bash
 # Create plan from natural language request
 aibridge plan create "Add OAuth authentication with Google and GitHub"
 
 # Plan is saved to .lovable/plan.md
 ```
 
 ### 5.2 Plan Generation Process
 
 ```
 ┌─────────────────────────────────────────────────────────────────┐
 │                   PLAN GENERATION FLOW                          │
 ├─────────────────────────────────────────────────────────────────┤
 │                                                                  │
 │  1. CONTEXT GATHERING                                           │
 │     ├── Query RAG for relevant code chunks                     │
 │     ├── Load detected patterns (from Phase 2)                  │
 │     ├── Check existing implementations                         │
 │     └── Identify dependencies and constraints                  │
 │                                                                  │
 │  2. REASONING (Lovable-Style)                                   │
 │     ├── Analyze request complexity                             │
 │     ├── Identify ambiguities                                   │
 │     └── Generate clarifying questions (if needed)              │
 │                                                                  │
 │  3. TASK BREAKDOWN                                              │
 │     ├── Split into discrete tasks                              │
 │     ├── Determine file actions (create/modify/delete)          │
 │     ├── Map dependencies between tasks                         │
 │     └── Estimate complexity per task                           │
 │                                                                  │
 │  4. MARKDOWN GENERATION                                         │
 │     └── Output to .lovable/plan.md (reviewable format)         │
 │                                                                  │
 └─────────────────────────────────────────────────────────────────┘
 ```
 
 ### 5.3 Example Plan Output
 
 ```markdown
 # Implementation Plan
 
 **Request:** Add OAuth authentication with Google and GitHub  
 **Created:** 2026-02-05T10:30:00Z  
 **Status:** PendingApproval  
 **Estimated Tasks:** 6
 
 ---
 
 ## Tasks
 
 ### 1. Create OAuth Configuration
 - **Status:** `todo`
 - **File:** `internal/auth/config.go`
 - **Action:** create
 - **Complexity:** low
 - **Patterns Applied:** PascalCase naming, Config struct
 
 ### 2. Implement OAuth Handler
 - **Status:** `todo`
 - **File:** `internal/auth/oauth_handler.go`
 - **Action:** create
 - **Dependencies:** [Task 1]
 - **Patterns Applied:** Handler interface, Error wrapping
 
 ...
 
 ## Approval
 
 - [ ] User approved plan
 - [ ] Ready for execution
 ```
 
 ### 5.4 Review and Modify Plan
 
 ```bash
 # View current plan
 aibridge plan show
 
 # Edit task in plan
 aibridge plan edit --task 3 --description "Updated description"
 
 # Add new task
 aibridge plan add-task "Add rate limiting to OAuth endpoints"
 
 # Remove task
 aibridge plan remove-task --task 5
 
 # Sync file edits back to database
 aibridge plan sync pull
 ```
 
 ### 5.5 Approve Plan
 
 ```bash
 # Approve plan for execution
 aibridge plan approve
 
 # Approve and execute immediately
 aibridge plan approve --execute
 ```
 
 ---
 
 ## 6. Phase 4: Execute with Reasoning
 
 ### 6.1 Lovable-Style Reasoning (Default)
 
 AI Bridge uses **TwoStage reasoning** by default:
 
 ```
 ┌─────────────────────────────────────────────────────────────────┐
 │              REASONING-FIRST EXECUTION                          │
 ├─────────────────────────────────────────────────────────────────┤
 │                                                                  │
 │  STAGE 1: UNDERSTAND                                            │
 │  ┌─────────────────────────────────────────────────────────┐   │
 │  │ "Before implementing, let me clarify..."                 │   │
 │  │                                                           │   │
 │  │ Q1: Which OAuth scopes should we request?                │   │
 │  │     A) email only  B) email + profile  C) full access    │   │
 │  │                                                           │   │
 │  │ Q2: Should sessions persist across browser restarts?     │   │
 │  │     A) Yes (cookies)  B) No (session only)               │   │
 │  └─────────────────────────────────────────────────────────┘   │
 │                           │                                      │
 │                           ▼                                      │
 │  STAGE 2: CONFIRM                                               │
 │  ┌─────────────────────────────────────────────────────────┐   │
 │  │ "Here's my understanding:"                               │   │
 │  │                                                           │   │
 │  │ • Google + GitHub OAuth with email+profile scope         │   │
 │  │ • Persistent sessions using secure cookies               │   │
 │  │ • Following existing Handler pattern in codebase         │   │
 │  │                                                           │   │
 │  │ Proceed? [Y/n]                                            │   │
 │  └─────────────────────────────────────────────────────────┘   │
 │                           │                                      │
 │                           ▼                                      │
 │  STAGE 3: EXECUTE                                               │
 │  ┌─────────────────────────────────────────────────────────┐   │
 │  │ Executing tasks in dependency order...                   │   │
 │  │ [████████░░░░░░░░░░░░] Task 2/6: Creating handler...     │   │
 │  └─────────────────────────────────────────────────────────┘   │
 │                                                                  │
 └─────────────────────────────────────────────────────────────────┘
 ```
 
 ### 6.2 Execute Plan
 
 ```bash
 # Execute all tasks in approved plan
 aibridge plan execute
 
 # Execute specific task only
 aibridge plan execute --task 2
 
 # Execute with verbose output
 aibridge plan execute --verbose
 
 # Dry run (show what would happen)
 aibridge plan execute --dry-run
 ```
 
 ### 6.3 Execution Output
 
 ```
 $ aibridge plan execute
 
 ═══════════════════════════════════════════════════
 EXECUTING PLAN: Add OAuth authentication
 ═══════════════════════════════════════════════════
 
 [1/6] Create OAuth Configuration
       File: internal/auth/config.go (create)
       ✓ Created 47 lines
       Patterns: PascalCase ✓, Config struct ✓
 
 [2/6] Implement OAuth Handler
       File: internal/auth/oauth_handler.go (create)
       ✓ Created 189 lines
       Patterns: Handler interface ✓, Error wrapping ✓
 
 [3/6] Create User Session Service
       File: internal/auth/session_service.go (create)
       ✓ Created 124 lines
       Patterns: Service layer ✓, Repository pattern ✓
 
 [4/6] Add Session Middleware
       File: internal/middleware/auth.go (create)
       ✓ Created 56 lines
 
 [5/6] Update Router Configuration
       File: internal/server/router.go (modify)
       ✓ Modified: +12 lines
 
 [6/6] Add Database Migrations
       File: migrations/003_add_user_sessions.sql (create)
       ✓ Created 23 lines
       Patterns: PascalCase columns ✓
 
 ═══════════════════════════════════════════════════
 EXECUTION COMPLETE
 ═══════════════════════════════════════════════════
 Tasks completed:  6/6
 Files created:    5
 Files modified:   1
 Lines added:      451
 Time elapsed:     12.3s
 ```
 
 ---
 
 ## 7. Quick Reference
 
 ### 7.1 Essential Commands
 
 | Command | Description |
 |---------|-------------|
 | `aibridge init` | Initialize project |
 | `aibridge index` | Index codebase |
 | `aibridge patterns list` | View detected patterns |
 | `aibridge plan create "..."` | Generate implementation plan |
 | `aibridge plan show` | View current plan |
 | `aibridge plan approve` | Approve plan |
 | `aibridge plan execute` | Execute approved plan |
 | `aibridge plan sync` | Sync plan file ↔ database |
 
 ### 7.2 Configuration
 
 ```bash
 # Set default reasoning mode
 aibridge config set Reasoning.DefaultMode TwoStage
 
 # Set default plan template
 aibridge config set Template.Default minimal
 
 # Enable auto-sync for plan file
 aibridge config set Sync.AutoEnabled true
 ```
 
 ### 7.3 Modes Summary
 
 | Mode | Behavior |
 |------|----------|
 | `interactive` | Always ask for approval (default) |
 | `auto-approve` | Approve if confidence > threshold |
 | `dry-run` | Show plan, don't execute |
 | `execute-immediately` | Skip approval (automation) |
 
 ---
 
 ## 8. Troubleshooting
 
 ### 8.1 Common Issues
 
 | Issue | Solution |
 |-------|----------|
 | Low recall accuracy | Run `aibridge index --full` to rebuild |
 | Pattern not detected | Add manual rule with `aibridge patterns add` |
 | Plan sync conflict | Use `aibridge plan sync resolve --strategy file-wins` |
 | Task execution failed | Check `aibridge plan history` for error details |
 
 ### 8.2 Debug Commands
 
 ```bash
 # View execution logs
 aibridge logs --tail 100
 
 # Check RAG chunk for a file
 aibridge chunk search --file "internal/auth/handler.go"
 
 # Validate plan structure
 aibridge plan validate
 
 # Export debug information
 aibridge debug export --output debug.zip
 ```
 
 ---
 
 ## 9. Related Specifications
 
 | Spec | Description |
 |------|-------------|
 | [41-memory-classification-flags.md](41-memory-classification-flags.md) | IsCritical/IsImportant flags |
 | [42-lovable-reasoning-defaults.md](42-lovable-reasoning-defaults.md) | TwoStage reasoning |
 | [43-code-pattern-learning.md](43-code-pattern-learning.md) | Pattern detection |
 | [44-plan-generation.md](44-plan-generation.md) | Plan creation |
 | [45-plan-synchronization.md](45-plan-synchronization.md) | File ↔ DB sync |
 | [46-plan-templates.md](46-plan-templates.md) | Custom templates |
 | [48-plan-execution-monitoring.md](48-plan-execution-monitoring.md) | Execution tracking |
 
 ---
 
 *From index to execution—AI Bridge handles it all with pattern-aware, reasoning-first intelligence.*