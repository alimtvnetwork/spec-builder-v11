 # 44 - Plan Generation System
 
 **Module:** AI Bridge CLI  
 **Version:** 5.0.0  
 **Domain:** Task Planning & Execution  
 **Updated:** 2026-03-09  
 **Error Range:** 9870 - 9889
 
 ---
 
 ## 1. Overview
 
 The Plan Generation System creates detailed, reviewable Markdown plans before executing any implementation task. Inspired by Lovable's planning workflow, this enables users to observe, modify, and approve execution plans before AI proceeds with code generation.
 
 ---
 
 ## 2. Plan Workflow
 
 ```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                       PLAN GENERATION WORKFLOW                          │
 ├─────────────────────────────────────────────────────────────────────────┤
 │                                                                          │
 │   ┌──────────────┐                                                       │
 │   │ User Request │ "Implement user authentication with OAuth"           │
 │   └──────┬───────┘                                                       │
 │          │                                                               │
 │          ▼                                                               │
 │   ┌──────────────────────────────────────────────────────────────────┐  │
 │   │ STEP 1: Context Gathering                                        │  │
 │   │ ├── Query RAG for relevant code patterns                         │  │
 │   │ ├── Load detected CodePatterns                                   │  │
 │   │ ├── Check existing implementations                               │  │
 │   │ └── Identify dependencies and constraints                        │  │
 │   └──────────────────────────────────────────────────────────────────┘  │
 │          │                                                               │
 │          ▼                                                               │
 │   ┌──────────────────────────────────────────────────────────────────┐  │
 │   │ STEP 2: Clarifying Questions (if needed)                         │  │
 │   │ ├── Generate questions with sample answers                       │  │
 │   │ ├── Wait for user selection                                      │  │
 │   │ └── Incorporate answers into context                             │  │
 │   └──────────────────────────────────────────────────────────────────┘  │
 │          │                                                               │
 │          ▼                                                               │
 │   ┌──────────────────────────────────────────────────────────────────┐  │
 │   │ STEP 3: Plan Generation                                          │  │
 │   │ ├── Break request into discrete tasks                            │  │
 │   │ ├── Determine file changes (create/modify/delete)                │  │
 │   │ ├── Identify integration points                                  │  │
 │   │ ├── Estimate complexity per task                                 │  │
 │   │ └── Generate Markdown plan file                                  │  │
 │   └──────────────────────────────────────────────────────────────────┘  │
 │          │                                                               │
 │          ▼                                                               │
 │   ┌──────────────────────────────────────────────────────────────────┐  │
 │   │ STEP 4: User Review                                               │  │
 │   │ ├── Display plan in CLI or save to .lovable/plan.md              │  │
 │   │ ├── User can: Approve / Modify / Reject / Add tasks              │  │
 │   │ └── Track revision history                                       │  │
 │   └──────────────────────────────────────────────────────────────────┘  │
 │          │                                                               │
 │          ▼                                                               │
 │   ┌──────────────────────────────────────────────────────────────────┐  │
 │   │ STEP 5: Execution                                                 │  │
 │   │ ├── Execute tasks in dependency order                            │  │
 │   │ ├── Update plan status (todo → in_progress → done)               │  │
 │   │ ├── Handle failures with rollback option                         │  │
 │   │ └── Generate completion summary                                  │  │
 │   └──────────────────────────────────────────────────────────────────┘  │
 │                                                                          │
 └─────────────────────────────────────────────────────────────────────────┘
 ```
 
 ---
 
 ## 3. Plan File Format
 
 ### 3.1 Standard Plan Template
 
 ```markdown
 # Implementation Plan
 
 **Request:** Implement user authentication with OAuth  
 **Created:** 2026-02-05T10:30:00Z  
 **Status:** pending_approval  
 **Estimated Tasks:** 6
 
 ---
 
 ## Summary
 
 Add OAuth 2.0 authentication supporting Google and GitHub providers,
 including user session management and protected routes.
 
 ---
 
 ## Tasks
 
 ### 1. Create OAuth Configuration
 - **Status:** `todo`
 - **File:** `internal/auth/config.go`
 - **Action:** create
 - **Complexity:** low
 - **Description:** Define OAuth provider configuration struct with client ID/secret fields
 - **Patterns Applied:** PascalCase naming, Config struct pattern
 
 ### 2. Implement OAuth Handler
 - **Status:** `todo`  
 - **File:** `internal/auth/oauth_handler.go`
 - **Action:** create
 - **Complexity:** medium
 - **Dependencies:** [Task 1]
 - **Description:** HTTP handlers for /auth/login, /auth/callback, /auth/logout
 - **Patterns Applied:** Handler interface, Error wrapping
 
 ### 3. Create User Session Service
 - **Status:** `todo`
 - **File:** `internal/auth/session_service.go`  
 - **Action:** create
 - **Complexity:** medium
 - **Dependencies:** [Task 1]
 - **Description:** JWT session creation, validation, and refresh logic
 - **Patterns Applied:** Service layer, Repository pattern
 
 ### 4. Add Session Middleware
 - **Status:** `todo`
 - **File:** `internal/middleware/auth.go`
 - **Action:** create
 - **Complexity:** low
 - **Dependencies:** [Task 3]
 - **Description:** Middleware to validate session and inject user context
 - **Patterns Applied:** Middleware chain pattern
 
 ### 5. Update Router Configuration
 - **Status:** `todo`
 - **File:** `internal/server/router.go`
 - **Action:** modify
 - **Complexity:** low
 - **Dependencies:** [Task 2, Task 4]
 - **Description:** Register auth routes and apply middleware to protected endpoints
 - **Patterns Applied:** Existing router patterns
 
 ### 6. Add Database Migrations
 - **Status:** `todo`
 - **File:** `migrations/003_add_user_sessions.sql`
 - **Action:** create
 - **Complexity:** low
 - **Description:** Create UserSessions table with UserId, Token, ExpiresAt columns
 - **Patterns Applied:** PascalCase columns, standard timestamps
 
 ---
 
 ## Dependency Graph
 
 ```
 [1: Config] ──┬──► [2: Handler] ──┐
               │                   ├──► [5: Router]
               └──► [3: Service] ──┤
                         │         │
                         ▼         │
                    [4: Middleware]┘
                    
 [6: Migrations] (parallel)
 ```
 
 ---
 
 ## Detected Patterns (Applied)
 
 | Category | Pattern | Confidence |
 |----------|---------|------------|
 | Naming | PascalCase functions | 94% |
 | Naming | PascalCase DB columns | 100% |
 | Error | Error code wrapping | 87% |
 | Architecture | Service-Repository | 91% |
 
 ---
 
 ## Notes
 
 - User requested Google and GitHub providers
 - Existing `internal/config/config.go` loads from environment
 - Error codes will use AB9870-AB9889 range
 
 ---
 
 ## Approval
 
 - [ ] User approved plan
 - [ ] Ready for execution
 ```
 
 ---
 
 ## 4. Database Schema
 
 ### 4.1 Plans Table
 
 ```sql
CREATE TABLE Plans (
    Id TEXT PRIMARY KEY,
    SessionId TEXT NOT NULL,
    Title TEXT NOT NULL,
    OriginalRequest TEXT NOT NULL,
    Summary TEXT,
    Status TEXT NOT NULL DEFAULT 'Draft',  -- Draft, PendingApproval, Approved, Executing, Completed, Failed, Cancelled
    TotalTasks INTEGER DEFAULT 0,
    CompletedTasks INTEGER DEFAULT 0,
    FilePath TEXT,                          -- .lovable/plan.md location
    Revision INTEGER DEFAULT 1,
    ParentPlanId TEXT,                      -- for plan modifications
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    ApprovedAt DATETIME,
    CompletedAt DATETIME,
    FOREIGN KEY (SessionId) REFERENCES Sessions(Id),
    FOREIGN KEY (ParentPlanId) REFERENCES Plans(Id)
);

CREATE INDEX IdxPlansSession ON Plans(SessionId);
CREATE INDEX IdxPlansStatus ON Plans(Status);
```

### 4.2 PlanTasks Table

```sql
CREATE TABLE PlanTasks (
    Id TEXT PRIMARY KEY,
    PlanId TEXT NOT NULL,
    TaskNumber INTEGER NOT NULL,
    Title TEXT NOT NULL,
    Description TEXT,
    FilePath TEXT,
    Action TEXT NOT NULL,                   -- Create, Modify, Delete, Execute
    Complexity TEXT DEFAULT 'Medium',       -- Low, Medium, High
    Status TEXT NOT NULL DEFAULT 'Todo',    -- Todo, InProgress, Done, Failed, Skipped
    Dependencies TEXT,                      -- JSON array of TaskNumbers
    PatternsApplied TEXT,                   -- JSON array of pattern IDs
    ErrorMessage TEXT,
    StartedAt DATETIME,
    CompletedAt DATETIME,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PlanId) REFERENCES Plans(Id)
);

CREATE INDEX IdxTasksPlan ON PlanTasks(PlanId);
CREATE INDEX IdxTasksStatus ON PlanTasks(Status);
CREATE UNIQUE INDEX IdxTasksPlanNumber ON PlanTasks(PlanId, TaskNumber);
```

### 4.3 PlanRevisions Table

```sql
CREATE TABLE PlanRevisions (
    Id TEXT PRIMARY KEY,
    PlanId TEXT NOT NULL,
    Revision INTEGER NOT NULL,
    ChangeType TEXT NOT NULL,              -- UserEdit, AiUpdate, TaskAdded, TaskRemoved
    ChangeDescription TEXT,
    PreviousContent TEXT,                  -- JSON snapshot
    NewContent TEXT,                       -- JSON snapshot
    CreatedBy TEXT,                        -- User or Ai
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PlanId) REFERENCES Plans(Id)
);

CREATE INDEX IdxRevisionsPlan ON PlanRevisions(PlanId);
 ```
 
 ---
 
 ## 5. CLI Commands
 
 ```bash
 # Generate plan from request (does not execute)
 aibridge plan create "Implement user authentication with OAuth"
 
 # Generate and save to file
 aibridge plan create "Add payment integration" --output .lovable/plan.md
 
 # View current plan
 aibridge plan show
 
 # View plan history
 aibridge plan history
 
 # Approve plan for execution
 aibridge plan approve
 
 # Approve and execute immediately
 aibridge plan approve --execute
 
 # Modify a task in the plan
 aibridge plan edit --task 3 --description "Updated description"
 
 # Add a task to existing plan
 aibridge plan add-task "Add unit tests for OAuth handler"
 
 # Remove a task
 aibridge plan remove-task --task 5
 
 # Execute approved plan
 aibridge plan execute
 
 # Execute single task from plan
 aibridge plan execute --task 2
 
 # Cancel execution
 aibridge plan cancel
 
 # Export plan to different format
 aibridge plan export --format json --output plan.json
 ```
 
 ---
 
 ## 6. API Endpoints
 
 | Method | Endpoint | Description |
 |--------|----------|-------------|
 | POST | `/api/v1/plans` | Create new plan from request |
 | GET | `/api/v1/plans` | List all plans for session |
 | GET | `/api/v1/plans/{id}` | Get plan details |
 | GET | `/api/v1/plans/{id}/markdown` | Get plan as Markdown |
 | PATCH | `/api/v1/plans/{id}` | Update plan (add notes, modify) |
 | POST | `/api/v1/plans/{id}/approve` | Approve plan |
 | POST | `/api/v1/plans/{id}/execute` | Execute approved plan |
 | POST | `/api/v1/plans/{id}/cancel` | Cancel plan/execution |
 | GET | `/api/v1/plans/{id}/tasks` | List tasks in plan |
 | POST | `/api/v1/plans/{id}/tasks` | Add task to plan |
 | PATCH | `/api/v1/plans/{id}/tasks/{taskId}` | Update task |
 | DELETE | `/api/v1/plans/{id}/tasks/{taskId}` | Remove task |
 | GET | `/api/v1/plans/{id}/revisions` | Get plan revision history |
 
 ---
 
 ## 7. WebSocket Events
 
 | Event | Direction | Description |
 |-------|-----------|-------------|
 | `plan.created` | Server→Client | New plan generated |
 | `plan.updated` | Server→Client | Plan modified |
 | `plan.approved` | Server→Client | Plan approved |
 | `plan.task.started` | Server→Client | Task execution started |
 | `plan.task.progress` | Server→Client | Task progress update |
 | `plan.task.completed` | Server→Client | Task completed |
 | `plan.task.failed` | Server→Client | Task failed |
 | `plan.completed` | Server→Client | All tasks completed |
 | `plan.failed` | Server→Client | Plan execution failed |
 
 ---
 
 ## 8. Error Codes
 
 | Code | Constant | Description |
 |------|----------|-------------|
 | 9870 | `ErrPlanCreationFailed` | Failed to generate plan |
 | 9871 | `ErrPlanNotFound` | Plan ID not found |
 | 9872 | `ErrPlanNotApproved` | Attempted execute without approval |
 | 9873 | `ErrPlanAlreadyExecuting` | Plan already in execution |
 | 9874 | `ErrTaskNotFound` | Task ID not found in plan |
 | 9875 | `ErrTaskDependencyFailed` | Dependency task not completed |
 | 9876 | `ErrPlanModificationLocked` | Cannot modify executing plan |
 | 9877 | `ErrTaskExecutionFailed` | Task execution error |
 | 9878 | `ErrPlanCancelled` | Plan was cancelled |
 | 9879 | `ErrInvalidPlanStatus` | Invalid status transition |
 | 9880 | `ErrPlanExportFailed` | Failed to export plan |
 | 9881 | `ErrPlanApprovalRequired` | User approval required |
 | 9882 | `ErrCyclicDependency` | Task dependencies form cycle |
 | 9883 | `ErrPlanRevisionFailed` | Failed to save revision |
 
 ---
 
 ## 9. Plan Modes
 
 ### 9.1 Mode Configuration
 
 | Mode | Behavior |
 |------|----------|
 | `interactive` | Always pause for approval before execution |
 | `auto-approve` | Approve automatically if confidence > threshold |
 | `dry-run` | Generate plan, show what would happen, don't execute |
 | `execute-immediately` | Skip approval, execute directly (use with caution) |
 
 ### 9.2 CLI Flags
 
 ```bash
 # Default: interactive mode
 aibridge plan create "Add feature X"
 
 # Auto-approve if AI confidence > 90%
 aibridge plan create "Add feature X" --auto-approve --threshold 0.9
 
 # Dry run - just show the plan
 aibridge plan create "Add feature X" --dry-run
 
 # Skip approval (for scripts/automation)
 aibridge plan create "Add feature X" --execute-immediately
 ```
 
 ---
 
 ## 10. Integration with Lovable-Style Reasoning
 
 Plan generation is tightly coupled with the Lovable-style reasoning flow:
 
 1. **Before Plan:** Reasoning step identifies ambiguities → clarifying questions
 2. **During Plan:** Pattern analysis → task breakdown → dependency resolution
 3. **After Plan:** Understanding check → user reviews plan → approval gate
 4. **Execution:** Tasks executed with progress streaming → completion summary
 
 ```
 ┌─────────────────────────────────────────────────────────────────┐
 │              REASONING + PLAN INTEGRATION                       │
 ├─────────────────────────────────────────────────────────────────┤
 │                                                                  │
 │  Request ──► Reasoning ──► Questions ──► Plan ──► Approval ──► Execute
 │                  │              │           │           │
 │                  ▼              ▼           ▼           ▼
 │           Analyze for      Get user     Generate    Confirm
 │           ambiguity       choices       tasks      understanding
 │                                                                  │
 └─────────────────────────────────────────────────────────────────┘
 ```
 
 ---
 
 ## 11. Plan Persistence
 
 Plans are stored in two locations:
 
 1. **Database:** `Plans`, `PlanTasks`, `PlanRevisions` tables (machine-readable)
 2. **Filesystem:** `.lovable/plan.md` (human-readable, editable)
 
 Changes sync bidirectionally:
 - Database → File: On plan creation/update
 - File → Database: On `aibridge plan sync` or before execution