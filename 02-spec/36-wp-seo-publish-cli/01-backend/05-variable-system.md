# WP SEO Publish CLI: Variable System

**Version:** 2.0.0  
**Updated:** 2026-03-09  

---

## Overview

The Variable System enables dynamic content generation by importing variables from CSV, JSON, and YAML files, then injecting them into SEO content via AI Bridge CLI.

---

## Variable Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Variable Scope Hierarchy                      │
└─────────────────────────────────────────────────────────────────┘

   Global Scope          Website Scope       Content Scope      Instance
   (All Websites)        (Per Website)       (Per Content Type) (Per Item)
        │                     │                    │                │
        ▼                     ▼                    ▼                ▼
   ┌─────────┐          ┌─────────┐          ┌─────────┐      ┌─────────┐
   │  Vars   │    ◄──   │  Vars   │    ◄──   │  Vars   │  ◄── │  Vars   │
   │ (Base)  │  Override│ (Site)  │  Override│ (Type)  │ Over │ (Item)  │
   └─────────┘          └─────────┘          └─────────┘      └─────────┘
```

---

## Variable Sources

### CSV Import

```go
type CsvVariableSource struct {
    Id          string    
    Name        string    
    FilePath    string    
    Delimiter   string    `json:",omitempty"` // default: ","
    HasHeader   bool      
    ColumnMap   map[string]int  // variable name -> column index
    Scope       variablescopetype.Variant  // → internal/enums/variablescopetype/
    WebsiteId   string    `json:",omitempty"`
    ImportedAt  time.Time 
    RowCount    int       
}

// Example CSV structure:
// title,keyword,area,company_name,experience_years
// "Best Cleaning Services","cleaning services","Melbourne CBD","CleanPro",15
// "Professional Cleaning","house cleaning","South Melbourne","CleanPro",15

func (s *VariableService) ImportCsv(source CsvVariableSource) apperror.Result[ImportResult] {
    file, err := pathutil.OpenFile(source.FilePath)
    if err != nil {
        return nil, err
    }
    defer file.Close()
    
    reader := csv.NewReader(file)
    if source.Delimiter != "" {
        reader.Comma = rune(source.Delimiter[0])
    }
    
    records, err := reader.ReadAll()
    if err != nil {
        return nil, err
    }
    
    // Parse headers if present
    var headers []string
    startRow := 0
    if source.HasHeader && len(records) > 0 {
        headers = records[0]
        startRow = 1
    }
    
    // Build column map if not provided
    if source.ColumnMap == nil && headers != nil {
        source.ColumnMap = make(map[string]int)
        for i, h := range headers {
            source.ColumnMap[h] = i
        }
    }
    
    // Store variables
    variables := make([]VariableRow, 0, len(records)-startRow)
    for i := startRow; i < len(records); i++ {
        row := make(map[string]json.RawMessage)
        for name, idx := range source.ColumnMap {
            if idx < len(records[i]) {
                encoded, _ := json.Marshal(records[i][idx])
                row[name] = encoded
            }
        }
        variables = append(variables, VariableRow{
            Index: i - startRow,
            Data:  row,
        })
    }
    
    // Save to database
    err = s.db.SaveVariables(source.Id, source.Scope, source.WebsiteId, variables)
    if err != nil {
        return nil, err
    }
    
    return &ImportResult{
        SourceId:   source.Id,
        RowCount:   len(variables),
        Columns:    keys(source.ColumnMap),
        ImportedAt: time.Now(),
    }, nil
}
```

### JSON Import

```go
type JsonVariableSource struct {
    Id          string    
    Name        string    
    FilePath    string    
    RootPath    string    `json:",omitempty"` // JSON path to array, e.g., "data.items"
    Scope       variablescopetype.Variant  // → internal/enums/variablescopetype/
    WebsiteId   string    `json:",omitempty"`
    ImportedAt  time.Time 
}

// Example JSON structure:
// {
//   "company": {
//     "name": "CleanPro",
//     "baseUrl": "https://cleanpro.com.au",
//     "areas": ["Melbourne CBD", "South Melbourne", "Carlton"]
//   },
//   "posts": [
//     {"title": "Best Cleaning", "keyword": "cleaning services"},
//     {"title": "Professional Clean", "keyword": "house cleaning"}
//   ]
// }

func (s *VariableService) ImportJson(source JsonVariableSource) apperror.Result[ImportResult] {
    data, err := pathutil.ReadFile(source.FilePath)
    if err != nil {
        return nil, err
    }
    
    var parsed json.RawMessage
    if err := json.Unmarshal(data, &parsed); err != nil {
        return nil, err
    }
    
    // Navigate to root path if specified
    // JSON import uses json.RawMessage throughout to avoid untyped maps.
    // Rows are stored as json.RawMessage and decoded lazily at template
    // processing time using typed accessors on VariableRow.
    var rows []VariableRow
    rows = parseJsonRows(parsed, source.RootPath)
    
    // Save to database
    err = s.db.SaveVariables(source.Id, source.Scope, source.WebsiteId, rows)
    if err != nil {
        return nil, err
    }
    
    return &ImportResult{
        SourceId:   source.Id,
        RowCount:   len(rows),
        ImportedAt: time.Now(),
    }, nil
}
```

### YAML Import

```go
type YamlVariableSource struct {
    Id          string    
    Name        string    
    FilePath    string    
    RootPath    string    `json:",omitempty"`
    Scope       variablescopetype.Variant  // → internal/enums/variablescopetype/
    WebsiteId   string    `json:",omitempty"`
    ImportedAt  time.Time 
}

// Example YAML structure:
// company:
//   name: CleanPro
//   baseUrl: https://cleanpro.com.au
//   areas:
//     - Melbourne CBD
//     - South Melbourne
// defaults:
//   tone: professional
//   experience: 15

func (s *VariableService) ImportYaml(source YamlVariableSource) apperror.Result[ImportResult] {
    data, err := pathutil.ReadFile(source.FilePath)
    if err != nil {
        return nil, err
    }
    
    var parsed json.RawMessage
    if err := yaml.Unmarshal(data, &parsed); err != nil {
        return nil, err
    }
    
    // Navigate to root path if specified
    // YAML import converts to json.RawMessage for consistent handling
    // with the JSON import path.
    var rows []VariableRow
    rows = parseJsonRows(parsed, source.RootPath)
    
    // Similar handling to JSON
    // ...
}
```

---

## Variable Processing

### Template Syntax

```go
// Supported syntax:
// {{variable}}              - Simple replacement
// {{variable|format:title}} - With format specifier
// {{variable|default:N/A}}  - With default value
// {{company.name}}          - Nested property
// {{areas[0]}}              - Array access
// {{row.title}}             - Row-level variable (from CSV/JSON array)

// VariableProcessor uses json.RawMessage for scope variables.
// Template resolution decodes values lazily at render time.
type VariableProcessor struct {
    globalVars   json.RawMessage
    websiteVars  json.RawMessage
    contentVars  json.RawMessage
    instanceVars json.RawMessage
}

func (p *VariableProcessor) Process(template string, instanceVars json.RawMessage) string {
    // Merge all scopes (instance overrides content overrides website overrides global)
    merged := mergeAllRaw(p.globalVars, p.websiteVars, p.contentVars, instanceVars)
    
    // Find all {{...}} patterns
    re := regexp.MustCompile(`\{\{([^}]+)\}\}`)
    
    return re.ReplaceAllStringFunc(template, func(match string) string {
        // Extract variable path and modifiers
        inner := strings.TrimPrefix(strings.TrimSuffix(match, "}}"), "{{")
        parts := strings.Split(inner, "|")
        path := strings.TrimSpace(parts[0])
        
        // Get value from merged JSON using gjson or similar path accessor
        value := resolveJsonPath(merged, path)
        
        // Apply modifiers
        for _, mod := range parts[1:] {
            value = applyModifier(value, mod)
        }
        
        return value
    })
}

// resolveJsonPath extracts a value from merged json.RawMessage using dot-path notation.
// Handles nested paths like "company.name" and array access like "areas[0]".
func resolveJsonPath(data json.RawMessage, path string) string {
    // Implementation uses gjson or manual JSON traversal
    // to resolve dot-separated paths from the raw JSON data.
    // Returns the string representation of the resolved value.
    return ""
}
}

// VariableValue wraps resolved variable data with typed accessors — replaces raw `any`
type VariableValue struct {
    Raw    string  // original string from data source
    Number float64 // parsed numeric value (0 if not numeric)
    IsNum  bool    // whether the value parsed as a number
}

func NewVariableValue(raw string) VariableValue {
    num, err := strconv.ParseFloat(raw, 64)
    return VariableValue{
        Raw:    raw,
        Number: num,
        IsNum:  err == nil,
    }
}

func (v VariableValue) String() string { return v.Raw }

func (p *VariableProcessor) applyModifier(value VariableValue, modifier string) VariableValue {
    parts := strings.SplitN(modifier, ":", 2)
    modName := strings.TrimSpace(parts[0])
    modArg := ""
    if len(parts) > 1 {
        modArg = strings.TrimSpace(parts[1])
    }
    
    switch modName {
    case "format":
        return NewVariableValue(formatValue(value, modArg))
    case "default":
        if value.Raw == "" {
            return NewVariableValue(modArg)
        }
        return value
    case "upper":
        return NewVariableValue(strings.ToUpper(value.Raw))
    case "lower":
        return NewVariableValue(strings.ToLower(value.Raw))
    case "title":
        return NewVariableValue(strings.Title(value.Raw))
    case "slug":
        return NewVariableValue(toSlug(value.Raw))
    }
    
    return value
}
```

### Format Specifiers

```go
func formatValue(value VariableValue, format string) string {
    switch format {
    case "title":
        return strings.Title(value.Raw)
    case "upper":
        return strings.ToUpper(value.Raw)
    case "lower":
        return strings.ToLower(value.Raw)
    case "slug":
        return toSlug(value.Raw)
    case "currency":
        if value.IsNum {
            return fmt.Sprintf("$%.2f", value.Number)
        }
        return value.Raw
    case "percent":
        if value.IsNum {
            return fmt.Sprintf("%.2f%%", value.Number)
        }
        return value.Raw
    case "number":
        if value.IsNum {
            return humanize.Comma(int64(value.Number))
        }
        return value.Raw
    }
    return value.Raw
}
```

---

## Variable Storage Schema

```sql
-- Variable Sources
CREATE TABLE IF NOT EXISTS VariableSources (
    ID TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    Type TEXT NOT NULL, -- variable_source_type.Variant (csv, json, yaml)
    FilePath TEXT,
    Scope TEXT NOT NULL, -- variable_scope.Variant (global, website, content, instance)
    WebsiteId TEXT,
    Config TEXT, -- JSON config (delimiter, column map, etc.)
    RowCount INTEGER DEFAULT 0,
    ImportedAt TEXT,
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (WebsiteId) REFERENCES Websites(Id)
);

-- Variable Data (flattened for quick access)
CREATE TABLE IF NOT EXISTS Variables (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    SourceId TEXT NOT NULL,
    Scope TEXT NOT NULL,
    WebsiteId TEXT,
    RowIndex INTEGER DEFAULT 0,
    Key TEXT NOT NULL,
    Value TEXT,
    ValueType TEXT DEFAULT 'string', -- variable_value_type.Variant (string, number, boolean, array, object)
    CreatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (SourceId) REFERENCES VariableSources(Id)
);

CREATE INDEX IdxVariablesScope ON Variables(Scope, WebsiteId, Key);
CREATE INDEX IdxVariablesSource ON Variables(SourceId, RowIndex);
```

---

## Import/Export

### Export Variables

```go
type ExportRequest struct {
    Scope     variablescopetype.Variant        // → internal/enums/variablescopetype/
    WebsiteId string `json:",omitempty"`
    Format    variablesourcetype.Variant       // → internal/enums/variablesourcetype/
}

func (s *VariableService) Export(req ExportRequest) apperror.Result[[]byte] {
    variables, err := s.db.GetVariables(req.Scope, req.WebsiteId)
    if err != nil {
        return nil, err
    }
    
    switch req.Format {
    case "csv":
        return s.exportCsv(variables)
    case "json":
        return json.MarshalIndent(variables, "", "  ")
    case "yaml":
        return yaml.Marshal(variables)
    default:
        return nil, apperror.New(
            ErrFormatUnsupported,
            "unsupported export format",
        ).WithContext("format", req.Format)
    }
}
```

### Import from Exported File

```go
func (s *VariableService) ImportFromExport(filePath, scope, websiteId string) apperror.Result[ImportResult] {
    ext := filepath.Ext(filePath)
    
    switch ext {
    case ".csv":
        return s.ImportCsv(CsvVariableSource{
            FilePath:  filePath,
            Scope:     scope,
            WebsiteId: websiteId,
            HasHeader: true,
        })
    case ".json":
        return s.ImportJson(JsonVariableSource{
            FilePath:  filePath,
            Scope:     scope,
            WebsiteId: websiteId,
        })
    case ".yaml", ".yml":
        return s.ImportYaml(YamlVariableSource{
            FilePath:  filePath,
            Scope:     scope,
            WebsiteId: websiteId,
        })
    default:
        return nil, apperror.New(
            ErrFormatUnsupported,
            "unsupported file type for import",
        ).WithContext("extension", ext)
    }
}
```

---

## UI Integration

The frontend provides:

1. **File Upload**: Drag-and-drop CSV, JSON, YAML files
2. **Variable Preview**: Dynamic list of detected variables
3. **Scope Assignment**: Assign variables to global/website/content scope
4. **Template Editor**: Insert variables into prompts with autocomplete
5. **Row Selection**: For CSV arrays, select which rows to use

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `01-architecture.md` |
| AI Bridge Variable System | `../../27-ai-bridge-cli/01-backend/19-ai-seo-variable-system.md` |
| Split DB Schema | `06-split-db-schema.md` |
| Frontend Variable Editor | `../02-frontend/03-variable-editor.md` |
| Enum Architecture | `12-enum-architecture.md` |
