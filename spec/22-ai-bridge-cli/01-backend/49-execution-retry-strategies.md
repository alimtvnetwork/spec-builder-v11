 # 49 - Execution Retry Strategies
 
 **Module:** AI Bridge CLI  
 **Version:** 5.0.0  
 **Domain:** Fault Tolerance & Recovery  
 **Updated:** 2026-03-09  
 **Error Range:** 9950 - 9969
 
 ---
 
 ## 1. Overview
 
 Execution Retry Strategies provide intelligent fault tolerance for plan execution through exponential backoff, error-type-based conditional retry logic, and partial task recovery. This ensures robust execution that gracefully handles transient failures while avoiding infinite retry loops.
 
 ---
 
 ## 2. Retry Architecture
 
 ```
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                        RETRY STRATEGY ARCHITECTURE                              │
 ├─────────────────────────────────────────────────────────────────────────────────┤
 │                                                                                  │
 │     ┌───────────────────────────────────────────────────────────────────┐       │
 │     │                    TASK EXECUTION                                 │       │
 │     └───────────────────────────────────────────────────────────────────┘       │
 │                                    │                                            │
 │                              FAILURE?                                           │
 │                                    │                                            │
 │              ┌─────────────────────┼─────────────────────┐                     │
 │              ▼                     ▼                     ▼                     │
 │     ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐           │
 │     │   CLASSIFY      │   │   CALCULATE     │   │   CHECK         │           │
 │     │   ERROR TYPE    │   │   BACKOFF       │   │   RETRY BUDGET  │           │
 │     │                 │   │                 │   │                 │           │
 │     │ • Transient     │   │ • Base delay    │   │ • Max attempts  │           │
 │     │ • Permanent     │   │ • Multiplier    │   │ • Time budget   │           │
 │     │ • Partial       │   │ • Jitter        │   │ • Cost budget   │           │
 │     │ • Unknown       │   │ • Max delay     │   │                 │           │
 │     └────────┬────────┘   └────────┬────────┘   └────────┬────────┘           │
 │              │                     │                     │                     │
 │              └─────────────────────┼─────────────────────┘                     │
 │                                    ▼                                            │
 │     ┌───────────────────────────────────────────────────────────────────┐      │
 │     │                    RETRY DECISION ENGINE                          │      │
 │     │  ├── Should retry? (error type + budget + policy)                 │      │
 │     │  ├── Wait duration (exponential backoff with jitter)              │      │
 │     │  ├── Recovery mode (full retry / partial / skip)                  │      │
 │     │  └── Escalation (notify / rollback / abort)                       │      │
 │     └───────────────────────────────────────────────────────────────────┘      │
 │                                                                                  │
 └─────────────────────────────────────────────────────────────────────────────────┘
 ```
 
 ---
 
 ## 3. Error Classification
 
 ### 3.1 Error Categories
 
 | Category | Description | Retry Policy | Examples |
 |----------|-------------|--------------|----------|
 | **Transient** | Temporary failures, likely to succeed on retry | Always retry | Network timeout, rate limit, temp file lock |
 | **Permanent** | Unrecoverable errors, retry won't help | Never retry | Syntax error, missing dependency, invalid config |
 | **Partial** | Task partially succeeded, can resume | Retry from checkpoint | File write interrupted, partial API response |
 | **Unknown** | Unclassified errors | Retry with caution | Unexpected exceptions |
 
 ### 3.2 Error Classification Matrix
 
 ```go
 type ErrorClassification struct {
     Category       string   // Transient, Permanent, Partial, Unknown
     Retryable      bool
     MaxRetries     int      // Override default if set
     BackoffProfile string   // Aggressive, Standard, Conservative
     RecoveryMode   string   // Full, Partial, Skip
 }
 
 var ErrorClassifications = map[int]ErrorClassification{
     // Transient errors - always retry
     9934: {Category: "Transient", Retryable: true, MaxRetries: 5, BackoffProfile: "Standard"},   // ErrTaskExecutionFailed
     9935: {Category: "Transient", Retryable: true, MaxRetries: 3, BackoffProfile: "Aggressive"}, // ErrTaskTimeout
     9942: {Category: "Partial", Retryable: true, MaxRetries: 3, RecoveryMode: "Partial"},        // ErrFileRestoreFailed
     
     // Permanent errors - never retry
     9871: {Category: "Permanent", Retryable: false}, // ErrPlanNotFound
     9882: {Category: "Permanent", Retryable: false}, // ErrCyclicDependency
     9913: {Category: "Permanent", Retryable: false}, // ErrTemplateValidationError
     
     // Network/API errors
     9960: {Category: "Transient", Retryable: true, MaxRetries: 5, BackoffProfile: "Conservative"}, // ErrNetworkTimeout
     9961: {Category: "Transient", Retryable: true, MaxRetries: 10, BackoffProfile: "Aggressive"},  // ErrRateLimited
     9962: {Category: "Transient", Retryable: true, MaxRetries: 3, BackoffProfile: "Standard"},     // ErrServiceUnavailable
 }
 ```
 
 ### 3.3 Custom Error Classification
 
 ```bash
 # Add custom error classification
 aibridge retry classify --code 9999 --category transient --max-retries 5
 
 # View all classifications
 aibridge retry classifications list
 
 # Reset to defaults
 aibridge retry classifications reset
 ```
 
 ---
 
 ## 4. Exponential Backoff
 
 ### 4.1 Backoff Algorithm
 
 ```go
 type BackoffConfig struct {
     InitialDelayMs int     // First retry delay
     MaxDelayMs     int     // Cap on delay
     Multiplier     float64 // Growth factor
     JitterFactor   float64 // Randomization (0-1)
 }
 
 // Backoff Profiles
 var BackoffProfiles = map[string]BackoffConfig{
     "Aggressive": {
         InitialDelayMs: 100,
         MaxDelayMs:     5000,
         Multiplier:     1.5,
         JitterFactor:   0.1,
     },
     "Standard": {
         InitialDelayMs: 500,
         MaxDelayMs:     30000,
         Multiplier:     2.0,
         JitterFactor:   0.2,
     },
     "Conservative": {
         InitialDelayMs: 1000,
         MaxDelayMs:     60000,
         Multiplier:     2.5,
         JitterFactor:   0.3,
     },
 }
 
 func CalculateBackoff(attempt int, config BackoffConfig) time.Duration {
     delay := float64(config.InitialDelayMs) * math.Pow(config.Multiplier, float64(attempt-1))
     
     // Apply cap
     if delay > float64(config.MaxDelayMs) {
         delay = float64(config.MaxDelayMs)
     }
     
     // Apply jitter
     jitter := delay * config.JitterFactor * (rand.Float64()*2 - 1)
     delay += jitter
     
     return time.Duration(delay) * time.Millisecond
 }
 ```
 
 ### 4.2 Backoff Visualization
 
 ```
 STANDARD BACKOFF PROFILE (Multiplier: 2.0)
 ═══════════════════════════════════════════════════════════════
 
 Attempt 1: ████ 500ms
 Attempt 2: ████████ 1000ms
 Attempt 3: ████████████████ 2000ms
 Attempt 4: ████████████████████████████████ 4000ms
 Attempt 5: ████████████████████████████████████████████████ 8000ms
 Attempt 6: ████████████████████████████████████████████████████████████ 16000ms
 Attempt 7: ████████████████████████████████████████████████████████████ 30000ms (capped)
 
 + Random jitter (±20%) applied to each delay
 ```
 
 ---
 
 ## 5. Retry Budget System
 
 ### 5.1 Budget Types
 
 | Budget Type | Description | Default |
 |-------------|-------------|---------|
 | **Attempt Budget** | Max retry attempts per task | 3 |
 | **Time Budget** | Max total time for retries | 5 minutes |
 | **Cost Budget** | Max "cost" units (API calls, tokens) | 1000 |
 | **Global Budget** | Max retries across entire execution | 20 |
 
 ### 5.2 Budget Configuration
 
 ```go
 type RetryBudget struct {
     MaxAttemptsPerTask int
     MaxTimePerTask     time.Duration
     MaxCostPerTask     int
     GlobalMaxRetries   int
     GlobalTimeLimit    time.Duration
     ResetOnSuccess     bool // Reset task budget after success
 }
 
 type BudgetTracker struct {
     TaskAttempts   map[string]int
     TaskTime       map[string]time.Duration
     TaskCost       map[string]int
     GlobalRetries  int
     GlobalTimeUsed time.Duration
 }
 
 // RetryDecision holds whether a retry is allowed and the reason if denied
 type RetryDecision struct {
     Allowed bool
     Reason  string
 }

 func (b *BudgetTracker) CanRetry(taskId string, budget RetryBudget) RetryDecision {
     // Check task-level budgets
     if b.TaskAttempts[taskId] >= budget.MaxAttemptsPerTask {
         return RetryDecision{Allowed: false, Reason: "task attempt budget exhausted"}
     }

     if b.TaskTime[taskId] >= budget.MaxTimePerTask {
         return RetryDecision{Allowed: false, Reason: "task time budget exhausted"}
     }

     if b.TaskCost[taskId] >= budget.MaxCostPerTask {
         return RetryDecision{Allowed: false, Reason: "task cost budget exhausted"}
     }
     
     // Check global budgets
     if b.GlobalRetries >= budget.GlobalMaxRetries {
         return RetryDecision{Allowed: false, Reason: "global retry budget exhausted"}
     }

     if b.GlobalTimeUsed >= budget.GlobalTimeLimit {
         return RetryDecision{Allowed: false, Reason: "global time budget exhausted"}
     }
     
     return RetryDecision{Allowed: true}
 }
 ```
 
 ---
 
 ## 6. Conditional Retry Logic
 
 ### 6.1 Retry Policies
 
 ```go
 type RetryPolicy struct {
     Name            string
     Conditions      []RetryCondition
     DefaultAction   string // Retry, Skip, Abort, Escalate
     OnBudgetExhaust string // Skip, Abort, Rollback
 }
 
 type RetryCondition struct {
     ErrorCodeRange []int  // [start, end] or [single]
     ErrorMessage   string // Regex pattern
     TaskAction     string // Create, Modify, Delete
     FilePattern    string // Glob pattern
     Action         string // Retry, Skip, Abort, Escalate
     MaxRetries     int    // Override
     BackoffProfile string // Override
 }
 ```
 
 ### 6.2 Built-in Policies
 
 ```yaml
 # Default retry policy
 Name: Default
 Conditions:
   - ErrorCodeRange: [9960, 9969]  # Network errors
     Action: Retry
     MaxRetries: 5
     BackoffProfile: Conservative
     
   - ErrorCodeRange: [9870, 9889]  # Plan errors
     Action: Abort
     
   - ErrorMessage: "rate limit"
     Action: Retry
     MaxRetries: 10
     BackoffProfile: Aggressive
     
   - TaskAction: Delete
     Action: Escalate  # Confirm before retrying deletes
     
   - FilePattern: "*.sql"
     Action: Abort  # Don't retry failed migrations
     
 DefaultAction: Retry
 OnBudgetExhaust: Rollback
 ```
 
 ### 6.3 Policy Selection
 
 ```bash
 # Use specific retry policy
 aibridge plan execute --retry-policy conservative
 
 # Create custom policy
 aibridge retry policy create my-policy --from default
 
 # Edit policy
 aibridge retry policy edit my-policy
 
 # List policies
 aibridge retry policy list
 ```
 
 ---
 
 ## 7. Partial Task Recovery
 
 ### 7.1 Recovery Modes
 
 | Mode | Description | Use Case |
 |------|-------------|----------|
 | **Full** | Retry entire task from scratch | Clean retry needed |
 | **Partial** | Resume from last successful step | Multi-step tasks |
 | **Skip** | Mark as skipped, continue execution | Non-critical tasks |
 | **Substitute** | Use alternative implementation | Fallback available |
 
 ### 7.2 Task State Tracking
 
 ```go
 type TaskState struct {
     TaskId           string
     Status           string
     CompletedSteps   []string
     CurrentStep      string
     FailedStep       string
     PartialOutput    PartialTaskOutput
     RecoveryChecksum string
 }
 
 // PartialTaskOutput holds intermediate step results for recovery
 type PartialTaskOutput struct {
     GeneratedCode string `json:",omitempty"`
     ValidatedAt   string `json:",omitempty"`
     StepData      string `json:",omitempty"` // JSON-serialized step-specific data
 }
 
 // Example: Multi-step file creation task
 // Steps: validate → generate → write → verify
 // If "write" fails, recovery can skip validate and generate
 ```
 
 ### 7.3 Recovery Flow
 
 ```
 ┌─────────────────────────────────────────────────────────────────┐
 │                  PARTIAL RECOVERY FLOW                          │
 ├─────────────────────────────────────────────────────────────────┤
 │                                                                  │
 │  TASK EXECUTION: Create auth/handler.go                         │
 │                                                                  │
 │  [✓] Step 1: Validate patterns          ──── COMPLETED          │
 │  [✓] Step 2: Generate code              ──── COMPLETED          │
 │  [✗] Step 3: Write to file              ──── FAILED (disk full) │
 │  [ ] Step 4: Verify syntax              ──── PENDING            │
 │                                                                  │
 │                     │                                            │
 │                     ▼                                            │
 │            RECOVERY OPTIONS                                      │
 │                                                                  │
 │  ┌─────────────────────────────────────────────────────────┐   │
 │  │ 1. FULL RETRY                                            │   │
 │  │    └── Re-run all 4 steps from beginning                 │   │
 │  │                                                           │   │
 │  │ 2. PARTIAL RETRY (Recommended)                           │   │
 │  │    └── Resume from Step 3 (cached output from Step 2)    │   │
 │  │                                                           │   │
 │  │ 3. SKIP TASK                                              │   │
 │  │    └── Mark as skipped, notify dependent tasks           │   │
 │  │                                                           │   │
 │  │ 4. SUBSTITUTE                                             │   │
 │  │    └── Try alternative code generation approach          │   │
 │  └─────────────────────────────────────────────────────────┘   │
 │                                                                  │
 └─────────────────────────────────────────────────────────────────┘
 ```
 
 ---
 
 ## 8. Database Schema
 
 ### 8.1 RetryAttempts Table
 
 ```sql
 CREATE TABLE RetryAttempts (
     Id TEXT PRIMARY KEY,
     ExecutionId TEXT NOT NULL,
     TaskId TEXT NOT NULL,
     AttemptNumber INTEGER NOT NULL,
     ErrorCode INTEGER,
     ErrorMessage TEXT,
    ErrorCategory TEXT,                      -- Transient, Permanent, Partial, Unknown
    BackoffMs INTEGER,
    RecoveryMode TEXT,                       -- Full, Partial, Skip
     StartedAt DATETIME,
     CompletedAt DATETIME,
     Success INTEGER DEFAULT 0,
     CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (ExecutionId) REFERENCES Executions(Id),
     FOREIGN KEY (TaskId) REFERENCES PlanTasks(Id)
 );
 
 CREATE INDEX IdxRetryExecution ON RetryAttempts(ExecutionId);
 CREATE INDEX IdxRetryTask ON RetryAttempts(TaskId);
 ```
 
 ### 8.2 RetryPolicies Table
 
 ```sql
 CREATE TABLE RetryPolicies (
     Id TEXT PRIMARY KEY,
     Name TEXT NOT NULL UNIQUE,
     Description TEXT,
     IsBuiltIn INTEGER DEFAULT 0,
     IsDefault INTEGER DEFAULT 0,
     Config TEXT NOT NULL,                    -- JSON: full policy definition
     CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
     UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
 );
 ```
 
 ### 8.3 TaskRecoveryState Table
 
 ```sql
 CREATE TABLE TaskRecoveryState (
     Id TEXT PRIMARY KEY,
     TaskId TEXT NOT NULL,
     ExecutionId TEXT NOT NULL,
     CompletedSteps TEXT,                     -- JSON array
     CurrentStep TEXT,
     PartialOutput TEXT,                      -- JSON object
     RecoveryChecksum TEXT,
     CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
     UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (TaskId) REFERENCES PlanTasks(Id),
     FOREIGN KEY (ExecutionId) REFERENCES Executions(Id)
 );
 
 CREATE UNIQUE INDEX IdxRecoveryTaskExec ON TaskRecoveryState(TaskId, ExecutionId);
 ```
 
 ---
 
 ## 9. CLI Commands
 
 ### 9.1 Retry Configuration
 
 ```bash
 # View current retry settings
 aibridge retry config show
 
 # Set default backoff profile
 aibridge retry config set --backoff conservative
 
 # Set global retry budget
 aibridge retry config set --max-global-retries 30
 
 # Set task-level budget
 aibridge retry config set --max-task-retries 5 --max-task-time 5m
 ```
 
 ### 9.2 Policy Management
 
 ```bash
 # List retry policies
 aibridge retry policy list
 
 # Show policy details
 aibridge retry policy show default
 
 # Create policy from template
 aibridge retry policy create my-policy --from conservative
 
 # Delete custom policy
 aibridge retry policy delete my-policy
 
 # Set default policy
 aibridge retry policy set-default my-policy
 ```
 
 ### 9.3 Manual Retry
 
 ```bash
 # Retry failed task
 aibridge retry task --id task_abc123
 
 # Retry with specific mode
 aibridge retry task --id task_abc123 --mode partial
 
 # Retry all failed tasks in execution
 aibridge retry execution --id exec_xyz789
 
 # Skip failed task and continue
 aibridge retry skip --id task_abc123
 ```
 
 ### 9.4 Retry History
 
 ```bash
 # View retry attempts for task
 aibridge retry history --task task_abc123
 
 # View retry statistics
 aibridge retry stats
 # Output: success rate, common errors, avg retries per task
 
 # Export retry data
 aibridge retry export --format json --output retries.json
 ```
 
 ---
 
 ## 10. API Endpoints
 
 | Method | Endpoint | Description |
 |--------|----------|-------------|
 | GET | `/api/v1/retry/config` | Get retry configuration |
 | PUT | `/api/v1/retry/config` | Update retry configuration |
 | GET | `/api/v1/retry/policies` | List retry policies |
 | POST | `/api/v1/retry/policies` | Create retry policy |
 | GET | `/api/v1/retry/policies/{name}` | Get policy details |
 | PUT | `/api/v1/retry/policies/{name}` | Update policy |
 | DELETE | `/api/v1/retry/policies/{name}` | Delete policy |
 | POST | `/api/v1/retry/policies/{name}/set-default` | Set as default |
 | POST | `/api/v1/tasks/{id}/retry` | Retry specific task |
 | POST | `/api/v1/tasks/{id}/skip` | Skip task |
 | GET | `/api/v1/executions/{id}/retries` | Get retry history |
 | GET | `/api/v1/retry/stats` | Get retry statistics |
 | GET | `/api/v1/retry/classifications` | List error classifications |
 | PUT | `/api/v1/retry/classifications/{code}` | Update classification |
 
 ---
 
 ## 11. WebSocket Events
 
 | Event | Direction | Description |
 |-------|-----------|-------------|
 | `Retry.Scheduled` | Server→Client | Retry scheduled with delay |
 | `Retry.Started` | Server→Client | Retry attempt started |
 | `Retry.Succeeded` | Server→Client | Retry succeeded |
 | `Retry.Failed` | Server→Client | Retry failed |
 | `Retry.Exhausted` | Server→Client | All retries exhausted |
 | `Retry.Skipped` | Server→Client | Task skipped |
 | `Retry.Escalated` | Server→Client | Escalated for user decision |
 | `Recovery.Started` | Server→Client | Partial recovery started |
 | `Recovery.Completed` | Server→Client | Recovery completed |
 
 ---
 
 ## 12. Error Codes
 
 | Code | Constant | Description |
 |------|----------|-------------|
 | 9950 | `ErrRetryBudgetExhausted` | All retry attempts used |
 | 9951 | `ErrRetryTimeBudgetExhausted` | Time limit exceeded |
 | 9952 | `ErrRetryNotAllowed` | Error classified as permanent |
 | 9953 | `ErrRetryPolicyNotFound` | Policy name not found |
 | 9954 | `ErrRetryPolicyInvalid` | Invalid policy configuration |
 | 9955 | `ErrRecoveryStateMissing` | No recovery state for task |
 | 9956 | `ErrRecoveryChecksumMismatch` | Partial output corrupted |
 | 9957 | `ErrRecoveryStepNotFound` | Cannot resume from step |
 | 9958 | `ErrBackoffConfigInvalid` | Invalid backoff configuration |
 | 9959 | `ErrClassificationNotFound` | Error code not classified |
 | 9960 | `ErrNetworkTimeout` | Network request timed out |
 | 9961 | `ErrRateLimited` | API rate limit hit |
 | 9962 | `ErrServiceUnavailable` | External service down |
 | 9963 | `ErrGlobalBudgetExhausted` | Global retry limit reached |
 
 ---
 
 ## 13. Configuration
 
 ### 13.1 Settings Keys
 
 ```go
 const (
     SettingRetryMaxPerTask        = "Retry.MaxPerTask"         // int, default: 3
     SettingRetryMaxGlobal         = "Retry.MaxGlobal"          // int, default: 20
     SettingRetryMaxTimePerTask    = "Retry.MaxTimePerTask"     // duration, default: 5m
     SettingRetryGlobalTimeLimit   = "Retry.GlobalTimeLimit"    // duration, default: 30m
     SettingRetryDefaultBackoff    = "Retry.DefaultBackoff"     // string, default: "standard"
     SettingRetryDefaultPolicy     = "Retry.DefaultPolicy"      // string, default: "default"
     SettingRetryAutoClassify      = "Retry.AutoClassify"       // bool, default: true
     SettingRetryPreservePartial   = "Retry.PreservePartial"    // bool, default: true
 )
 ```
 
 ---
 
 ## 14. Related Specifications
 
 - [48-plan-execution-monitoring.md](48-plan-execution-monitoring.md) - Execution tracking
 - [44-plan-generation.md](44-plan-generation.md) - Plan creation
 - [47-onboarding-guide.md](47-onboarding-guide.md) - Workflow guide
 
 ---
 
 *Intelligent retry with exponential backoff, conditional logic, and partial recovery—because failures happen.*