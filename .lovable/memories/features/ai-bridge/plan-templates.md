  # Memory: features/ai-bridge/plan-templates


**Version:** 1.0.0  

  
  **Updated:** 2026-02-05  
  **Spec Location:** `spec/22-ai-bridge-cli/01-backend/46-plan-templates.md`
  
  ---
  
  ## Overview
  
  Custom plan templates with YAML front-matter + Go template syntax. Stored in `.lovable/templates/` directory.
  
  ---
  
  ## Built-in Templates
  
  | Template | Description |
  |----------|-------------|
  | `default` | Standard Lovable-style format |
  | `minimal` | Compact checklist format |
  | `detailed` | Full format with patterns/estimates |
  | `jira-style` | JIRA ticket structure |
  
  ---
  
  ## Key Features
  
  | Feature | Description |
  |---------|-------------|
  | Categories | Custom task categories with icons/colors |
  | Auto-categorize | Keyword-based task classification |
  | Variables | `{{.Plan.Title}}`, `{{.Task.Status}}`, etc. |
  | Functions | `formatDate`, `join`, `statusIcon`, etc. |
  
  ---
  
  ## CLI Commands
  
  ```bash
  aibridge template list                    # List templates
  aibridge template create my-template      # Create new
  aibridge template set-default my-template # Set default
  aibridge plan create "X" --template minimal  # Use template
  ```
  
  ---
  
  ## Error Codes
  
  Range: 9910-9929
  
  ---
  
  ## Related Specs
  
  - [46-plan-templates.md](../../../../spec/22-ai-bridge-cli/01-backend/46-plan-templates.md)
  - [44-plan-generation.md](../../../../spec/22-ai-bridge-cli/01-backend/44-plan-generation.md)