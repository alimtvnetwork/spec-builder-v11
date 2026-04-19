 # 46 - Plan Template Customization
 
 **Module:** AI Bridge CLI  
 **Version:** 5.0.0  
 **Domain:** Plan Output Formatting  
 **Updated:** 2026-03-09  
 **Error Range:** 9910 - 9929
 
 ---
 
 ## 1. Overview
 
 Plan Template Customization allows users to define custom plan formats, task categories, output structures, and branding. Templates are stored in `.lovable/templates/` and can be shared across projects.
 
 ---
 
 ## 2. Template Architecture
 
 ```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                       TEMPLATE SYSTEM ARCHITECTURE                          │
 ├─────────────────────────────────────────────────────────────────────────────┤
 │                                                                              │
 │     ┌────────────────────┐      ┌────────────────────┐                     │
 │     │  Built-in Templates │      │  Custom Templates   │                     │
 │     │  ├── default.md     │      │  .lovable/templates/│                     │
 │     │  ├── minimal.md     │      │  ├── my-format.md   │                     │
 │     │  ├── detailed.md    │      │  ├── team-std.md    │                     │
 │     │  └── jira-style.md  │      │  └── client-x.md    │                     │
 │     └──────────┬─────────┘      └──────────┬─────────┘                     │
 │                │                           │                                │
 │                └─────────────┬─────────────┘                                │
 │                              ▼                                              │
 │     ┌───────────────────────────────────────────────────────────────┐      │
 │     │                  TEMPLATE ENGINE                               │      │
 │     │  ├── Load Template (YAML front-matter + Markdown body)        │      │
 │     │  ├── Parse Variables: {{.Plan.Title}}, {{.Task.Status}}       │      │
 │     │  ├── Apply Conditionals: {{if .Task.IsCritical}}...{{end}}    │      │
 │     │  ├── Execute Loops: {{range .Tasks}}...{{end}}                │      │
 │     │  └── Render Output → .lovable/plan.md                         │      │
 │     └───────────────────────────────────────────────────────────────┘      │
 │                                                                              │
 └─────────────────────────────────────────────────────────────────────────────┘
 ```
 
 ---
 
 ## 3. Template File Structure
 
 Templates use YAML front-matter for configuration + Go template syntax for content.
 
 ### 3.1 Template Location
 
 ```
 .lovable/
 ├── plan.md                    # Generated plan output
 └── templates/
     ├── default.md             # Default template (copy of built-in)
     ├── minimal.md             # User-created minimal template
     └── custom-project.md      # Project-specific template
 ```
 
 ### 3.2 Template Format
 
 ```markdown
 ---
 Name: detailed
 Version: 1.0.0
 Description: Detailed plan format with full task breakdown
 Author: AI Bridge
 Categories:
   - name: Setup
     icon: 🔧
     color: blue
   - name: Implementation
     icon: 💻
     color: green
   - name: Testing
     icon: 🧪
     color: yellow
   - name: Documentation
     icon: 📝
     color: purple
 TaskFields:
   - Status
   - File
   - Action
   - Complexity
   - Dependencies
   - Description
   - PatternsApplied
   - EstimatedTime
 OutputFormat: markdown
 ---
 
 # {{.Plan.Title}}
 
 **Request:** {{.Plan.OriginalRequest}}  
 **Created:** {{.Plan.CreatedAt | formatDate}}  
 **Status:** {{.Plan.Status}}  
 **Total Tasks:** {{len .Tasks}}
 
 ---
 
 ## Summary
 
 {{.Plan.Summary}}
 
 ---
 
 ## Tasks
 
 {{range .Tasks}}
 ### {{.TaskNumber}}. {{.Title}}
 {{if .Category}}- **Category:** {{.Category.Icon}} {{.Category.Name}}{{end}}
 - **Status:** `{{.Status}}`
 - **File:** `{{.FilePath}}`
 - **Action:** {{.Action}}
 - **Complexity:** {{.Complexity}}
 {{if .Dependencies}}- **Dependencies:** {{.Dependencies | joinTasks}}{{end}}
 - **Description:** {{.Description}}
 {{if .PatternsApplied}}- **Patterns Applied:** {{.PatternsApplied | join ", "}}{{end}}
 {{if .EstimatedTime}}- **Estimated Time:** {{.EstimatedTime}}{{end}}
 
 {{end}}
 
 ---
 
 ## Dependency Graph
 
 ```
 {{.DependencyGraph}}
 ```
 
 ---
 
 {{if .DetectedPatterns}}
 ## Detected Patterns
 
 | Category | Pattern | Confidence |
 |----------|---------|------------|
 {{range .DetectedPatterns}}- {{.Category}} | {{.Name}} | {{.Confidence}}% |
 {{end}}
 {{end}}
 
 ---
 
 ## Approval
 
 - [{{if .Plan.Approved}}x{{else}} {{end}}] User approved plan
 - [{{if eq .Plan.Status "approved"}}x{{else}} {{end}}] Ready for execution
 ```
 
 ---
 
 ## 4. Database Schema
 
 ### 4.1 PlanTemplates Table
 
 ```sql
 CREATE TABLE PlanTemplates (
     Id TEXT PRIMARY KEY,
     Name TEXT NOT NULL UNIQUE,
     Version TEXT NOT NULL DEFAULT '1.0.0',
     Description TEXT,
     Author TEXT,
     IsBuiltIn INTEGER DEFAULT 0,
     IsDefault INTEGER DEFAULT 0,
     Content TEXT NOT NULL,                   -- Full template with front-matter
     Categories TEXT,                         -- JSON array of category definitions
     TaskFields TEXT,                         -- JSON array of enabled fields
     OutputFormat TEXT DEFAULT 'markdown',    -- markdown, json, yaml
     CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
     UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
 );
 
 CREATE UNIQUE INDEX IdxTemplatesName ON PlanTemplates(Name);
 ```
 
 ### 4.2 TaskCategories Table
 
 ```sql
 CREATE TABLE TaskCategories (
     Id TEXT PRIMARY KEY,
     Name TEXT NOT NULL,
     Icon TEXT,
     Color TEXT,
     SortOrder INTEGER DEFAULT 0,
     Description TEXT,
     Keywords TEXT,                           -- JSON array for auto-categorization
     IsBuiltIn INTEGER DEFAULT 0,
     CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
 );
 
 CREATE UNIQUE INDEX IdxCategoriesName ON TaskCategories(Name);
 ```
 
 ### 4.3 TemplateVariables Table
 
 ```sql
 CREATE TABLE TemplateVariables (
     Id TEXT PRIMARY KEY,
     TemplateId TEXT NOT NULL,
     Name TEXT NOT NULL,
     DefaultValue TEXT,
     Description TEXT,
     Required INTEGER DEFAULT 0,
     FOREIGN KEY (TemplateId) REFERENCES PlanTemplates(Id)
 );
 
 CREATE INDEX IdxTemplatevarsTemplate ON TemplateVariables(TemplateId);
 ```
 
 ---
 
 ## 5. Built-in Templates
 
 ### 5.1 Default Template
 
 Standard Lovable-style format with all fields.
 
 ### 5.2 Minimal Template
 
 ```markdown
 ---
 Name: minimal
 Description: Compact plan format for quick review
 TaskFields: [Status, File, Action, Description]
 ---
 
 # {{.Plan.Title}}
 
 {{range .Tasks}}
 - [{{if eq .Status "done"}}x{{else}} {{end}}] **{{.TaskNumber}}.** {{.Title}} (`{{.FilePath}}`)
 {{end}}
 ```
 
 ### 5.3 Detailed Template
 
 Full format with patterns, estimates, and dependency visualization.
 
 ### 5.4 JIRA-Style Template
 
 ```markdown
 ---
 Name: jira-style
 Description: Format mimicking JIRA ticket structure
 Categories:
   - name: Story
     icon: 📖
   - name: Task
     icon: ✅
   - name: Bug
     icon: 🐛
   - name: Spike
     icon: 🔬
 TaskFields: [Status, File, Action, Complexity, Description, AcceptanceCriteria]
 ---
 
 # {{.Plan.Title}}
 
 **Epic:** {{.Plan.Title}}  
 **Reporter:** AI Bridge  
 **Created:** {{.Plan.CreatedAt | formatDate}}
 
 ## Description
 
 {{.Plan.Summary}}
 
 ---
 
 ## Tickets
 
 {{range .Tasks}}
 ### [{{.Category.Name | upper}}] {{.Title}}
 
 | Field | Value |
 |-------|-------|
 | Status | {{.Status}} |
 | File | `{{.FilePath}}` |
 | Complexity | {{.Complexity}} |
 
 **Description:**  
 {{.Description}}
 
 {{if .AcceptanceCriteria}}
 **Acceptance Criteria:**
 {{range .AcceptanceCriteria}}
 - [ ] {{.}}
 {{end}}
 {{end}}
 
 ---
 {{end}}
 ```
 
 ---
 
 ## 6. CLI Commands
 
 ### 6.1 Template Management
 
 ```bash
 # List available templates
 aibridge template list
 # Output:
 # NAME          VERSION   DEFAULT   BUILT-IN   DESCRIPTION
 # default       1.0.0     ✓         ✓          Standard Lovable-style format
 # minimal       1.0.0               ✓          Compact plan format
 # detailed      1.0.0               ✓          Full format with patterns
 # jira-style    1.0.0               ✓          JIRA ticket structure
 # my-custom     1.0.0                          My project template
 
 # Show template content
 aibridge template show default
 
 # Create new template (interactive)
 aibridge template create my-template
 
 # Create from existing
 aibridge template create my-template --from default
 
 # Import template from file
 aibridge template import ./my-template.md
 
 # Export template to file
 aibridge template export default --output ./default-backup.md
 
 # Set default template
 aibridge template set-default my-template
 
 # Delete custom template
 aibridge template delete my-template
 
 # Validate template syntax
 aibridge template validate ./my-template.md
 
 # Preview template with sample data
 aibridge template preview my-template
 ```
 
 ### 6.2 Category Management
 
 ```bash
 # List categories
 aibridge category list
 
 # Add category
 aibridge category add "Security" --icon "🔒" --color "red"
 
 # Update category
 aibridge category update "Security" --keywords "auth,token,password,encryption"
 
 # Delete category
 aibridge category delete "Security"
 
 # Set category on task (in active plan)
 aibridge plan task --id 3 --category "Testing"
 ```
 
 ### 6.3 Plan Generation with Template
 
 ```bash
 # Generate plan with specific template
 aibridge plan create "Add OAuth" --template minimal
 
 # Generate with template and variables
 aibridge plan create "Add OAuth" --template detailed --var "EstimateUnit=hours"
 
 # Override output format
 aibridge plan create "Add OAuth" --template default --format json
 ```
 
 ---
 
 ## 7. API Endpoints
 
 ### 7.1 Template Endpoints
 
 | Method | Endpoint | Description |
 |--------|----------|-------------|
 | GET | `/api/v1/templates` | List all templates |
 | GET | `/api/v1/templates/{name}` | Get template by name |
 | POST | `/api/v1/templates` | Create new template |
 | PUT | `/api/v1/templates/{name}` | Update template |
 | DELETE | `/api/v1/templates/{name}` | Delete template |
 | POST | `/api/v1/templates/{name}/validate` | Validate template syntax |
 | POST | `/api/v1/templates/{name}/preview` | Preview with sample data |
 | POST | `/api/v1/templates/{name}/set-default` | Set as default |
 | POST | `/api/v1/templates/import` | Import template file |
 | GET | `/api/v1/templates/{name}/export` | Export template |
 
 ### 7.2 Category Endpoints
 
 | Method | Endpoint | Description |
 |--------|----------|-------------|
 | GET | `/api/v1/categories` | List all categories |
 | GET | `/api/v1/categories/{id}` | Get category |
 | POST | `/api/v1/categories` | Create category |
 | PUT | `/api/v1/categories/{id}` | Update category |
 | DELETE | `/api/v1/categories/{id}` | Delete category |
 
 ---
 
 ## 8. Request/Response Schemas
 
 ### 8.1 Create Template Request
 
 ```json
 {
   "Name": "my-custom-template",
   "Version": "1.0.0",
   "Description": "Custom template for my project",
   "Categories": [
     {"Name": "Backend", "Icon": "⚙️", "Color": "blue"},
     {"Name": "Frontend", "Icon": "🎨", "Color": "green"}
   ],
   "TaskFields": ["Status", "File", "Action", "Complexity", "Description"],
   "OutputFormat": "markdown",
   "Content": "# {{.Plan.Title}}\n\n{{range .Tasks}}..."
 }
 ```
 
 ### 8.2 Template Response
 
 ```json
 {
   "Id": "tmpl_abc123",
   "Name": "my-custom-template",
   "Version": "1.0.0",
   "Description": "Custom template for my project",
   "Author": "user@example.com",
   "IsBuiltIn": false,
   "IsDefault": false,
   "Categories": [...],
   "TaskFields": [...],
   "OutputFormat": "markdown",
   "Content": "...",
   "CreatedAt": "2026-02-05T12:00:00Z",
   "UpdatedAt": "2026-02-05T12:00:00Z"
 }
 ```
 
 ### 8.3 Create Category Request
 
 ```json
 {
   "Name": "Security",
   "Icon": "🔒",
   "Color": "red",
   "Description": "Security-related tasks",
   "Keywords": ["auth", "token", "password", "encryption", "ssl", "certificate"]
 }
 ```
 
 ---
 
 ## 9. Template Variables Reference
 
 ### 9.1 Plan Variables
 
 | Variable | Type | Description |
 |----------|------|-------------|
 | `{{.Plan.Id}}` | string | Plan ID |
 | `{{.Plan.Title}}` | string | Plan title |
 | `{{.Plan.OriginalRequest}}` | string | User's original request |
 | `{{.Plan.Summary}}` | string | AI-generated summary |
 | `{{.Plan.Status}}` | string | Plan status |
 | `{{.Plan.CreatedAt}}` | time | Creation timestamp |
 | `{{.Plan.ApprovedAt}}` | time | Approval timestamp |
 | `{{.Plan.Approved}}` | bool | Whether plan is approved |
 | `{{.Plan.Revision}}` | int | Current revision number |
 
 ### 9.2 Task Variables
 
 | Variable | Type | Description |
 |----------|------|-------------|
 | `{{.Task.TaskNumber}}` | int | Task number (1-based) |
 | `{{.Task.Title}}` | string | Task title |
 | `{{.Task.Status}}` | string | todo/in_progress/done/failed |
 | `{{.Task.FilePath}}` | string | Target file path |
 | `{{.Task.Action}}` | string | create/modify/delete/execute |
 | `{{.Task.Complexity}}` | string | low/medium/high |
 | `{{.Task.Dependencies}}` | []int | Dependent task numbers |
 | `{{.Task.Description}}` | string | Task description |
 | `{{.Task.PatternsApplied}}` | []string | Applied code patterns |
 | `{{.Task.Category}}` | Category | Task category object |
 | `{{.Task.EstimatedTime}}` | string | Time estimate |
 | `{{.Task.IsCritical}}` | bool | Critical flag |
 | `{{.Task.IsImportant}}` | bool | Important flag |
 
 ### 9.3 Global Variables
 
 | Variable | Type | Description |
 |----------|------|-------------|
 | `{{.Tasks}}` | []Task | All tasks array |
 | `{{.DetectedPatterns}}` | []Pattern | Detected code patterns |
 | `{{.DependencyGraph}}` | string | ASCII dependency graph |
 | `{{.ProjectName}}` | string | Current project name |
 | `{{.GeneratedAt}}` | time | Generation timestamp |
 
 ---
 
 ## 10. Template Functions
 
 | Function | Usage | Description |
 |----------|-------|-------------|
 | `formatDate` | `{{.CreatedAt \| formatDate}}` | Format as YYYY-MM-DD |
 | `formatDateTime` | `{{.CreatedAt \| formatDateTime}}` | Format as ISO 8601 |
 | `join` | `{{.Items \| join ", "}}` | Join array with separator |
 | `joinTasks` | `{{.Dependencies \| joinTasks}}` | Format as [Task 1, Task 2] |
 | `upper` | `{{.Name \| upper}}` | Uppercase string |
 | `lower` | `{{.Name \| lower}}` | Lowercase string |
 | `title` | `{{.Name \| title}}` | Title case string |
 | `truncate` | `{{.Desc \| truncate 50}}` | Truncate with ellipsis |
 | `default` | `{{.Value \| default "N/A"}}` | Default if empty |
 | `statusIcon` | `{{.Status \| statusIcon}}` | ✅/🔄/⏳/❌ |
 | `complexityBadge` | `{{.Complexity \| complexityBadge}}` | 🟢/🟡/🔴 |
 
 ---
 
 ## 11. Auto-Categorization
 
 Tasks can be automatically categorized based on keywords:
 
 ```go
 type AutoCategorizer struct {
     Categories []TaskCategory
 }
 
 func (c *AutoCategorizer) Categorize(task PlanTask) *TaskCategory {
     // Check file path patterns
     if strings.Contains(task.FilePath, "test") || 
        strings.Contains(task.FilePath, "_test.go") {
         return c.findCategory("Testing")
     }
     
     // Check description keywords
     for _, cat := range c.Categories {
         for _, keyword := range cat.Keywords {
             if strings.Contains(strings.ToLower(task.Description), keyword) {
                 return &cat
             }
         }
     }
     
     // Default to Implementation
     return c.findCategory("Implementation")
 }
 ```
 
 ---
 
 ## 12. Error Codes
 
 | Code | Constant | Description |
 |------|----------|-------------|
 | 9910 | `ErrTemplateNotFound` | Template name not found |
 | 9911 | `ErrTemplateParseError` | Failed to parse template |
 | 9912 | `ErrTemplateRenderError` | Failed to render template |
 | 9913 | `ErrTemplateValidationError` | Template syntax invalid |
 | 9914 | `ErrTemplateNameExists` | Template name already exists |
 | 9915 | `ErrTemplateBuiltIn` | Cannot modify built-in template |
 | 9916 | `ErrTemplateImportFailed` | Failed to import template |
 | 9917 | `ErrTemplateExportFailed` | Failed to export template |
 | 9918 | `ErrCategoryNotFound` | Category not found |
 | 9919 | `ErrCategoryNameExists` | Category name already exists |
 | 9920 | `ErrCategoryBuiltIn` | Cannot delete built-in category |
 | 9921 | `ErrTemplateVariableUndefined` | Required variable not provided |
 | 9922 | `ErrTemplateVersionInvalid` | Invalid version format |
 | 9923 | `ErrTemplateFrontmatterInvalid` | Invalid YAML front-matter |
 
 ---
 
 ## 13. Configuration
 
 ### 13.1 Settings Keys
 
 ```go
 const (
     SettingDefaultTemplate      = "Template.Default"        // string, default: "default"
     SettingTemplateDir          = "Template.Directory"      // string, default: ".lovable/templates"
     SettingAutoCategorize       = "Template.AutoCategorize" // bool, default: true
     SettingShowPatterns         = "Template.ShowPatterns"   // bool, default: true
     SettingShowDependencyGraph  = "Template.ShowGraph"      // bool, default: true
 )
 ```
 
 ---
 
 ## 14. Related Specifications
 
 - [44-plan-generation.md](44-plan-generation.md) - Core plan generation
 - [45-plan-synchronization.md](45-plan-synchronization.md) - Plan sync system
 - [43-code-pattern-learning.md](43-code-pattern-learning.md) - Pattern integration
 
 ---
 
 *Customize how your plans look—from minimal checklists to detailed JIRA-style tickets.*