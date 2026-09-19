  # Memory: features/ai-bridge/retry-strategies


**Version:** 1.0.0  

  
  **Updated:** 2026-02-05  
  **Spec Location:** `02-spec/22-ai-bridge-cli/01-backend/49-execution-retry-strategies.md`
  
  ---
  
  ## Overview
  
  Intelligent retry system with exponential backoff, error classification, and partial task recovery.
  
  ---
  
  ## Error Categories
  
  | Category | Retry? | Examples |
  |----------|--------|----------|
  | Transient | Yes | Network timeout, rate limit |
  | Permanent | No | Syntax error, invalid config |
  | Partial | Resume | File write interrupted |
  
  ---
  
  ## Backoff Profiles
  
  | Profile | Initial | Max | Multiplier |
  |---------|---------|-----|------------|
  | Aggressive | 100ms | 5s | 1.5x |
  | Standard | 500ms | 30s | 2.0x |
  | Conservative | 1s | 60s | 2.5x |
  
  ---
  
  ## Budget System
  
  - Max attempts per task (default: 3)
  - Max time per task (default: 5m)
  - Global max retries (default: 20)
  
  ---
  
  ## Error Codes
  
  Range: 9950-9969
  
  ---
  
  ## Related Specs
  
  - [49-execution-retry-strategies.md](../../../../02-spec/22-ai-bridge-cli/01-backend/49-execution-retry-strategies.md)
  - [48-plan-execution-monitoring.md](../../../../02-spec/22-ai-bridge-cli/01-backend/48-plan-execution-monitoring.md)