  # Memory: features/ai-bridge/plan-synchronization


**Version:** 1.0.0  

  
  **Updated:** 2026-02-05  
  **Spec Location:** `02-spec/22-ai-bridge-cli/01-backend/45-plan-synchronization.md`
  
  ---
  
  ## Overview
  
  Bidirectional sync between database (Plans, PlanTasks tables) and `.lovable/plan.md` file with conflict resolution strategies.
  
  ---
  
  ## Sync States
  
  | State | Description |
  |-------|-------------|
  | `synced` | DB and file identical |
  | `db_ahead` | DB has uncommitted changes |
  | `file_ahead` | File edited manually |
  | `conflict` | Both have divergent changes |
  
  ---
  
  ## Key Commands
  
  ```bash
  aibridge plan sync status      # Check sync state
  aibridge plan sync pull        # File → DB
  aibridge plan sync push        # DB → File
  aibridge plan sync             # Auto bidirectional
  aibridge plan watch            # File watcher mode
  ```
  
  ---
  
  ## Conflict Strategies
  
  | Strategy | Winner |
  |----------|--------|
  | `auto` | Timestamp-based |
  | `db-wins` | Database |
  | `file-wins` | File |
  | `merge` | Field-by-field |
  
  ---
  
  ## Error Codes
  
  Range: 9890-9909
  
  ---
  
  ## Related Specs
  
  - [45-plan-synchronization.md](../../../../02-spec/22-ai-bridge-cli/01-backend/45-plan-synchronization.md)
  - [44-plan-generation.md](../../../../02-spec/22-ai-bridge-cli/01-backend/44-plan-generation.md)