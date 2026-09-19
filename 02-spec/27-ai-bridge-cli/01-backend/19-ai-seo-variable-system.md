# AI Bridge CLI: AI SEO Variable System

**Version:** 5.0.0  
**Status:** Complete  
**Updated:** 2026-03-09  

---

## Overview

The **Variable System** enables dynamic content generation through app-level variable injection from CSV, JSON, and YAML files. Variables can be referenced in prompts, templates, and configurations.

---

## Variable Sources

### Supported File Formats

| Format | Extension | Use Case |
|--------|-----------|----------|
| **CSV** | `.csv` | Bulk variable rows (cities, keywords, products) |
| **JSON** | `.json` | Structured data with nested objects |
| **YAML** | `.yaml`, `.yml` | Human-readable config, multiline strings |

---

## Variable Scopes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          VARIABLE SCOPE HIERARCHY                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Level 1: Global Variables                                                  │
│   └── Defined in: data/aibridge.db (GlobalVariables table)                  │
│   └── Available to: All apps                                                │
│                                                                              │
│   Level 2: App Variables                                                     │
│   └── Defined in: data/{appName}/seo/variables/                             │
│   └── Available to: Single app, all content types                           │
│                                                                              │
│   Level 3: Content Type Variables                                            │
│   └── Defined per: content type (blog, category, page, etc.)                │
│   └── Overrides: App variables for specific type                            │
│                                                                              │
│   Level 4: Instance Variables                                                │
│   └── Defined at: Generation time                                           │
│   └── Overrides: All higher-level variables                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Variable File Storage

### Directory Structure

```
data/{appName}/seo/
├── variables/
│   ├── areas.csv                    # Service areas
│   ├── keywords.json                # Keyword configurations
│   ├── company.yaml                 # Company information
│   ├── services.csv                 # Service list
│   └── custom/                      # Custom variable files
│       ├── pricing.json
│       └── testimonials.yaml
│
└── presets/{industry}/
    └── variables/                   # Preset-specific defaults
        └── defaults.yaml
```

---

## File Format Specifications

### CSV Format

```csv
AreaName,AreaSlug,State,PostalCode,Population
Melbourne CBD,melbourne-cbd,VIC,3000,169961
Southbank,southbank,VIC,3006,18364
Docklands,docklands,VIC,3008,14609
South Yarra,south-yarra,VIC,3141,25689
```

**Parsing Rules:**
- First row = headers (variable names)
- Each subsequent row = variable set
- Use for bulk generation across multiple instances

### JSON Format

```json
{
  "Company": {
    "Name": "CleanCo Australia",
    "Founded": 2010,
    "YearsExperience": 15,
    "CombinedTeamExperience": 47,
    "ServedCustomers": 12500,
    "Website": "https://cleanco.com.au",
    "Phone": "1300-CLEAN-CO"
  },
  "Services": [
    {
      "Name": "House Cleaning",
      "Slug": "house-cleaning",
      "Keywords": ["house cleaning", "home cleaning", "residential cleaning"]
    },
    {
      "Name": "Office Cleaning",
      "Slug": "office-cleaning",
      "Keywords": ["office cleaning", "commercial cleaning", "workplace cleaning"]
    }
  ],
  "Testimonials": [
    {
      "Quote": "Best cleaning service we've ever used!",
      "Author": "Sarah M.",
      "Location": "Melbourne CBD"
    }
  ]
}
```

### YAML Format

```yaml
# Company configuration
Company:
  Name: CleanCo Australia
  Tagline: "Melbourne's Most Trusted Cleaning Service"
  Founded: 2010
  YearsExperience: 15
  Description: |
    CleanCo Australia has been serving Melbourne families and 
    businesses since 2010. With over 15 years of experience and 
    a combined team expertise of 47 years, we've built our 
    reputation on reliability, thoroughness, and customer 
    satisfaction. Our 12,500+ happy customers trust us for 
    their cleaning needs.

# Tone and voice settings
Tone:
  Primary: professional
  Secondary: friendly
  Avoid:
    - overly casual language
    - industry jargon
    - aggressive sales tactics

# Trust indicators
TrustIndicators:
  Certifications:
    - "Licensed & Insured"
    - "Green Cleaning Certified"
    - "5-Star Google Rating"
  Statistics:
    CustomerRetention: 94.7%
    SatisfactionRate: 98.2%
    OnTimeArrival: 99.1%
```

---

## Variable Reference Syntax

### Template Syntax

```
{{VariableName}}                    # Simple variable
{{Company.Name}}                    # Nested object
{{Services[0].Name}}                # Array access
{{Areas.*.AreaName}}                # Wildcard (all areas)
{{Company.Founded|default:2020}}    # With default value
{{Company.Phone|format:phone}}      # With formatter
```

### In Prompt Templates

```markdown
Write an SEO article about {{Services[0].Name}} in {{AreaName}}.

Company: {{Company.Name}}
Experience: {{Company.YearsExperience}} years
Tone: {{Tone.Primary}}

Keywords to include:
{{#each Services[0].Keywords}}
- {{this}}
{{/each}}
```

### In HTML Templates

```html
<h1>{{Services[0].Name}} in {{AreaName}}</h1>

<p>{{Company.Name}} has been providing {{Services[0].Name}} 
services in {{AreaName}} for over {{Company.YearsExperience}} years.</p>

<div class="trust-badge">
    {{#each TrustIndicators.Certifications}}
    <span class="badge">{{this}}</span>
    {{/each}}
</div>

<a href="/{{Services[0].Slug}}-{{AreaSlug}}" 
   title="Expert {{Services[0].Name}} in {{AreaName}} - {{Company.Tagline}}">
    Learn More
</a>
```

---

## Variable Processing Engine

### Parser Implementation

```go
type VariableProcessor struct {
    GlobalVars    VariableScope
    AppVars       VariableScope
    ContentVars   VariableScope
    InstanceVars  VariableScope
    
    Formatters    map[string]FormatterFunc
}

// VariableScope represents a typed scope of variables
type VariableScope struct {
    StringVars  map[string]string
    NumberVars  map[string]float64
    BoolVars    map[string]bool
    ArrayVars   map[string][]string
    ObjectVars  map[string]VariableScope
}

type FormatterFunc func(value string) string

func NewVariableProcessor() *VariableProcessor {
    vp := &VariableProcessor{
        Formatters: make(map[string]FormatterFunc),
    }
    
    // Register default formatters
    vp.Formatters["phone"] = formatPhone
    vp.Formatters["currency"] = formatCurrency
    vp.Formatters["date"] = formatDate
    vp.Formatters["slug"] = formatSlug
    vp.Formatters["upper"] = strings.ToUpper
    vp.Formatters["lower"] = strings.ToLower
    vp.Formatters["title"] = strings.Title
    
    return vp
}

func (vp *VariableProcessor) LoadCsv(path string) *apperror.AppError {
    file, err := pathutil.OpenFile(path)
    if err != nil {
        return apperror.Wrap(
            err,
            ErrSeoVariableLoadFailed,
            "failed to open CSV: %s",
            path,
        )
    }
    defer file.Close()
    
    reader := csv.NewReader(file)
    records, err := reader.ReadAll()
    if err != nil {
        return apperror.Wrap(
            err,
            ErrSeoVariableLoadFailed,
            "failed to parse CSV: %s",
            path,
        )
    }
    
    if len(records) < 2 {
        return apperror.New(
            ErrSeoVariableLoadFailed,
            "CSV must have header and at least one data row: %s",
            path,
        )
    }
    
    headers := records[0]
    var rows []map[string]string
    
    for i := 1; i < len(records); i++ {
        row := make(map[string]string)
        for j, header := range headers {
            if j < len(records[i]) {
                row[header] = records[i][j]
            }
        }
        rows = append(rows, row)
    }
    
    // Store as array under filename (without extension)
    baseName := strings.TrimSuffix(filepath.Base(path), filepath.Ext(path))
    vp.AppVars[baseName] = rows
    
    return nil
}

func (vp *VariableProcessor) LoadJson(path string) *apperror.AppError {
    data, err := pathutil.ReadFile(path)
    if err != nil {
        return apperror.Wrap(
            err,
            ErrSeoVariableLoadFailed,
            "failed to read JSON: %s",
            path,
        )
    }
    
    scope, parseErr := parseJsonToScope(data)
    if parseErr != nil {
        return apperror.Wrap(
            parseErr,
            ErrSeoVariableLoadFailed,
            "failed to parse JSON: %s",
            path,
        )
    }
    
    // Merge into app vars
    vp.AppVars = mergeScope(vp.AppVars, scope)
    
    return nil
}

func (vp *VariableProcessor) LoadYaml(path string) *apperror.AppError {
    data, err := pathutil.ReadFile(path)
    if err != nil {
        return apperror.Wrap(
            err,
            ErrSeoVariableLoadFailed,
            "failed to read YAML: %s",
            path,
        )
    }
    
    scope, parseErr := parseYamlToScope(data)
    if parseErr != nil {
        return apperror.Wrap(
            parseErr,
            ErrSeoVariableLoadFailed,
            "failed to parse YAML: %s",
            path,
        )
    }
    
    // Merge into app vars
    vp.AppVars = mergeScope(vp.AppVars, scope)
    
    return nil
}
```

**CRITICAL: No `map[string]any` or `any` usage. All variable data uses the `VariableScope` struct with typed maps.**

### Variable Resolution

```go
func (vp *VariableProcessor) Resolve(key string) apperror.Result[string] {
    // Check scopes in order (instance -> content -> app -> global)
    if val, ok := vp.resolveInScope(key, vp.InstanceVars); ok {
        return apperror.Ok(val)
    }
    if val, ok := vp.resolveInScope(key, vp.ContentVars); ok {
        return apperror.Ok(val)
    }
    if val, ok := vp.resolveInScope(key, vp.AppVars); ok {
        return apperror.Ok(val)
    }
    if val, ok := vp.resolveInScope(key, vp.GlobalVars); ok {
        return apperror.Ok(val)
    }
    
    return apperror.FailNew[string](
        ErrVariableNotFound,
        "variable not found: %s", key,
    )
}

func (vp *VariableProcessor) resolveInScope(key string, scope VariableScope) (string, bool) {
    // Handle nested keys: "Company.Name"
    parts := strings.Split(key, ".")
    
    // Simple single-key lookup
    if len(parts) == 1 {
        if val, ok := scope.StringVars[key]; ok {
            return val, true
        }
        if val, ok := scope.NumberVars[key]; ok {
            return fmt.Sprintf("%g", val), true
        }
        if val, ok := scope.BoolVars[key]; ok {
            return fmt.Sprintf("%t", val), true
        }
        return "", false
    }
    
    // Nested key: traverse ObjectVars
    currentScope := scope
    for i, part := range parts {
        // Handle array access: "Services[0]"
        if idx := strings.Index(part, "["); idx != -1 {
            arrayKey := part[:idx]
            indexStr := strings.TrimSuffix(part[idx+1:], "]")
            
            arr, exists := currentScope.ArrayVars[arrayKey]
            if !exists {
                return "", false
            }
            
            index, err := strconv.Atoi(indexStr)
            if err != nil || index < 0 || index >= len(arr) {
                return "", false
            }
            return arr[index], true
        } else if i < len(parts)-1 {
            // Intermediate key: descend into ObjectVars
            nested, exists := currentScope.ObjectVars[part]
            if !exists {
                return "", false
            }
            currentScope = nested
        } else {
            // Final key: resolve from current scope
            return vp.resolveInScope(part, currentScope)
        }
    }
    
    return "", false
}
```

### Template Processing

```go
func (vp *VariableProcessor) ProcessTemplate(template string) apperror.Result[string] {
    // Regex to match {{variable|formatter:arg}}
    re := regexp.MustCompile(`\{\{([^}]+)\}\}`)
    
    result := re.ReplaceAllStringFunc(template, func(match string) string {
        // Extract variable reference
        inner := strings.TrimPrefix(strings.TrimSuffix(match, "}}"), "{{")
        
        // Check for formatter
        parts := strings.SplitN(inner, "|", 2)
        varKey := strings.TrimSpace(parts[0])
        
        // Resolve variable
        resolved := vp.Resolve(varKey)
        if resolved.HasError() {
            // Check for default value
            if len(parts) > 1 && strings.HasPrefix(parts[1], "default:") {
                return strings.TrimPrefix(parts[1], "default:")
            }
            return match // Return original if not found
        }
        
        value := resolved.Value()
        
        // Apply formatter if specified
        if len(parts) > 1 && stringutil.IsMissingPrefix(parts[1], "default:") {
            formatterSpec := strings.SplitN(parts[1], ":", 2)
            formatterName := formatterSpec[0]
            
            if formatter, ok := vp.Formatters[formatterName]; ok {
                return formatter(value)
            }
        }
        
        return fmt.Sprintf("%v", value)
    })
    
    return apperror.Ok(result)
}
```

---

## UI Integration

### Variable Upload Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VARIABLE FILE UPLOAD FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. FILE UPLOAD                                                             │
│      └── User uploads CSV/JSON/YAML file                                    │
│      └── File saved to: data/{appName}/seo/variables/                       │
│                                                                              │
│   2. VARIABLE EXTRACTION                                                     │
│      └── Parse file based on extension                                       │
│      └── Extract all variable keys                                          │
│      └── Build variable reference list                                      │
│                                                                              │
│   3. UI DISPLAY                                                              │
│      └── Show extracted variables in UI                                     │
│      └── Allow drag-and-drop into prompt/template                           │
│      └── Preview variable values                                            │
│                                                                              │
│   4. VALIDATION                                                              │
│      └── Check for naming conflicts                                         │
│      └── Validate data types                                                │
│      └── Report missing required variables                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Variable Discovery API

```go
type VariableInfo struct {
    Key         string
    Path        string      // Full path: Company.Name
    Type        string      // string, number, array, object
    SampleValue string
    Source      string      // filename
    Scope       string      // global, app, content
    IsArray     bool
    ArrayLength int         // If array
    Children    []string    // If object
}

func (vp *VariableProcessor) DiscoverVariables() []VariableInfo {
    var vars []VariableInfo
    
    // Recursively extract all variable paths
    vp.discoverInScope("", vp.GlobalVars, "global", &vars)
    vp.discoverInScope("", vp.AppVars, "app", &vars)
    vp.discoverInScope("", vp.ContentVars, "content", &vars)
    
    return vars
}
```

---

## Database Schema

### Variable Storage Tables

```sql
-- ============================================
-- Table: GlobalVariables (system-wide)
-- ============================================
CREATE TABLE GlobalVariables (
    Id TEXT PRIMARY KEY,
    Key TEXT UNIQUE NOT NULL,
    Value TEXT NOT NULL,                         -- JSON-encoded value
    Type TEXT NOT NULL,                          -- string, number, boolean, array, object
    Description TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: VariableFiles (uploaded files)
-- ============================================
CREATE TABLE VariableFiles (
    Id TEXT PRIMARY KEY,
    AppName TEXT NOT NULL,
    FileName TEXT NOT NULL,
    FileType TEXT NOT NULL,                      -- csv, json, yaml
    FilePath TEXT NOT NULL,
    VariableCount INTEGER,
    ParsedSchema TEXT,                           -- JSON: discovered variables
    UploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(AppName, FileName)
);

CREATE INDEX IdxVarFilesApp ON VariableFiles(AppName);

-- ============================================
-- Table: VariableUsage (tracking references)
-- ============================================
CREATE TABLE VariableUsage (
    Id TEXT PRIMARY KEY,
    VariableKey TEXT NOT NULL,
    UsedIn TEXT NOT NULL,                        -- template ID or prompt ID
    UsageType TEXT NOT NULL,                     -- template, prompt, config
    AppName TEXT NOT NULL,
    LastUsedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxVarUsageKey ON VariableUsage(VariableKey);
CREATE INDEX IdxVarUsageApp ON VariableUsage(AppName);
```

---

## API Endpoints

### Variable Management

```
GET /api/v1/seo/:appName/variables
  Returns: All variables for app (discovered + uploaded)

POST /api/v1/seo/:appName/variables/upload
  Body: multipart/form-data with CSV/JSON/YAML file
  Returns: { "FileId": "...", "Variables": [...discovered vars] }

GET /api/v1/seo/:appName/variables/discover
  Returns: All discovered variable paths with sample values

POST /api/v1/seo/:appName/variables/preview
  Body: { "Template": "...", "Variables": {...} }
  Returns: Processed template with values substituted

DELETE /api/v1/seo/:appName/variables/:fileId
  Deletes: Variable file and clears cache

GET /api/v1/seo/variables/global
  Returns: All global variables

POST /api/v1/seo/variables/global
  Body: { "Key": "...", "Value": "...", "Type": "..." }
  Creates: New global variable
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 9550 | `VAR_FILE_PARSE_ERROR` | Failed to parse variable file |
| 9551 | `VAR_KEY_NOT_FOUND` | Variable key not found in any scope |
| 9552 | `VAR_TYPE_MISMATCH` | Variable value type doesn't match expected |
| 9553 | `VAR_CIRCULAR_REF` | Circular variable reference detected |
| 9554 | `VAR_INVALID_SYNTAX` | Invalid variable reference syntax |
| 9555 | `VAR_SCOPE_CONFLICT` | Variable name conflicts across scopes |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Core Guidelines | `./17-ai-seo-core-guidelines.md` |
| Content Types | `./18-ai-seo-content-types.md` |
| AI SEO Generate | `./13-ai-seo-generate.md` |
| Error Codes | `./16-ai-seo-error-codes.md` |
