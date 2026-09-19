# AI Bridge: Input Formats

**Version:** 2.0.0  
**Status:** Complete  
**Updated:** 2026-03-09

---

## Overview

AI Bridge supports four input formats, each optimized for different use cases. All formats normalize to a unified `NormalizedRequest` structure before processing.

---

## 1. Markdown Format

**Extension:** `.md`  
**Use Case:** Prompt templates, instructions, documentation-style prompts

### Structure

```markdown
---
# YAML Frontmatter (required)
model: thinking
temperature: 0.7
maxTokens: 2048
outputFormat: markdown
variables:
  projectName: "My Project"
  targetFile: "spec/feature.md"
---

# System Prompt (optional section)
<!-- system -->
You are a technical specification writer. Follow the project coding guidelines.
<!-- /system -->

# User Prompt
Create a feature specification for {{projectName}}.

Target file: {{targetFile}}

## Requirements
- Include user stories
- Add acceptance criteria
- Define error codes
```

### Parser Implementation

```go
type MarkdownParser struct{}

type MarkdownFrontmatter struct {
    Model        string            `yaml:"model"`
    ModelId      string            `yaml:"modelId,omitempty"`
    Temperature  float64           `yaml:"temperature,omitempty"`
    MaxTokens    int               `yaml:"maxTokens,omitempty"`
    TopP         float64           `yaml:"topP,omitempty"`
    OutputFormat string            `yaml:"outputFormat,omitempty"`
    Stream       bool              `yaml:"stream,omitempty"`
    Variables    map[string]string `yaml:"variables,omitempty"`
}

func (p *MarkdownParser) Parse(content []byte) appfault.Result[NormalizedRequest] {
    // 1. Extract frontmatter
    frontmatter, body, err := p.extractFrontmatter(content)
    if err != nil {
        return nil, NewError(ErrMarkdownParseFailed, "invalid frontmatter: %v", err)
    }
    
    // 2. Parse frontmatter YAML
    var fm MarkdownFrontmatter
    if err := yaml.Unmarshal(frontmatter, &fm); err != nil {
        return nil, NewError(ErrMarkdownParseFailed, "invalid frontmatter YAML: %v", err)
    }
    
    // 3. Extract system prompt if present
    systemPrompt, userPrompt := p.extractSystemPrompt(body)
    
    // 4. Resolve variables
    userPrompt = p.resolveVariables(userPrompt, fm.Variables)
    systemPrompt = p.resolveVariables(systemPrompt, fm.Variables)
    
    return &NormalizedRequest{
        Id:            uuid.New().String(),
        SystemPrompt:  systemPrompt,
        UserPrompt:    userPrompt,
        ModelCategory: ModelCategory(fm.Model),
        ModelId:       fm.ModelId,
        Temperature:   fm.Temperature,
        MaxTokens:     fm.MaxTokens,
        TopP:          fm.TopP,
        Stream:        fm.Stream,
        OutputFormat:  OutputFormat(fm.OutputFormat),
        Variables:     fm.Variables,
        Source: InputSource{
            Format: "markdown",
        },
        CreatedAt: time.Now(),
    }, nil
}

func (p *MarkdownParser) extractSystemPrompt(body string) (system, user string) {
    systemRe := regexp.MustCompile(`(?s)<!--\s*system\s*-->(.*?)<!--\s*/system\s*-->`)
    matches := systemRe.FindStringSubmatch(body)
    
    if len(matches) > 1 {
        system = strings.TrimSpace(matches[1])
        user = strings.TrimSpace(systemRe.ReplaceAllString(body, ""))
    } else {
        user = strings.TrimSpace(body)
    }
    return
}

func (p *MarkdownParser) resolveVariables(text string, vars map[string]string) string {
    for key, value := range vars {
        placeholder := fmt.Sprintf("{{%s}}", key)
        text = strings.ReplaceAll(text, placeholder, value)
    }
    return text
}
```

---

## 2. JSON Format

**Extension:** `.json`  
**Use Case:** Structured requests, API integration, batch processing

### Structure

```json
{
  "systemPrompt": "You are a code generation assistant.",
  "userPrompt": "Generate a REST API handler for user authentication.",
  "model": "coding",
  "temperature": 0.3,
  "maxTokens": 4096,
  "outputFormat": "json",
  "stream": false,
  "variables": {
    "language": "go",
    "framework": "chi"
  },
  "context": [
    {
      "role": "user",
      "content": "Previous context message"
    },
    {
      "role": "assistant", 
      "content": "Previous response"
    }
  ]
}
```

### Batch Mode

```json
{
  "systemPrompt": "Generate a product description.",
  "userPromptTemplate": "Write a description for: {{productName}} priced at {{price}}",
  "model": "writing",
  "batchMode": true,
  "batchItems": [
    { "id": "1", "variables": { "productName": "Widget A", "price": "$29.99" } },
    { "id": "2", "variables": { "productName": "Widget B", "price": "$49.99" } },
    { "id": "3", "variables": { "productName": "Widget C", "price": "$99.99" } }
  ]
}
```

### Parser Implementation

```go
type JSONParser struct {
    schema *jsonschema.Schema
}

type JSONRequest struct {
    SystemPrompt       string
    UserPrompt         string
    UserPromptTemplate string            `json:",omitempty"`
    Model              string
    ModelId            string            `json:",omitempty"`
    Temperature        float64           `json:",omitempty"`
    MaxTokens          int               `json:",omitempty"`
    TopP               float64           `json:",omitempty"`
    OutputFormat       string            `json:",omitempty"`
    Stream             bool              `json:",omitempty"`
    Variables          map[string]string `json:",omitempty"`
    Context            []ContextItem     `json:",omitempty"`
    BatchMode          bool              `json:",omitempty"`
    BatchItems         []BatchItem       `json:",omitempty"`
}

func (p *JSONParser) Parse(content []byte) appfault.Result[NormalizedRequest] {
    // 1. Validate against schema
    if err := p.schema.Validate(content); err != nil {
        return nil, NewError(ErrJsonValidationFailed, "schema validation failed: %v", err)
    }
    
    // 2. Unmarshal JSON
    var jr JSONRequest
    if err := json.Unmarshal(content, &jr); err != nil {
        return nil, NewError(ErrJsonParseFailed, "invalid JSON: %v", err)
    }
    
    // 3. Resolve variables in user prompt
    userPrompt := jr.UserPrompt
    if jr.UserPromptTemplate != "" {
        userPrompt = p.resolveVariables(jr.UserPromptTemplate, jr.Variables)
    }
    
    // 4. Build batch items if batch mode
    var batchItems []BatchItem
    if jr.BatchMode {
        for _, item := range jr.BatchItems {
            batchItems = append(batchItems, BatchItem{
                Id:        item.Id,
                Variables: item.Variables,
            })
        }
    }
    
    return &NormalizedRequest{
        Id:            uuid.New().String(),
        SystemPrompt:  jr.SystemPrompt,
        UserPrompt:    userPrompt,
        ModelCategory: ModelCategory(jr.Model),
        ModelId:       jr.ModelId,
        Temperature:   jr.Temperature,
        MaxTokens:     jr.MaxTokens,
        TopP:          jr.TopP,
        Stream:        jr.Stream,
        OutputFormat:  OutputFormat(jr.OutputFormat),
        Variables:     jr.Variables,
        Context:       jr.Context,
        BatchMode:     jr.BatchMode,
        BatchItems:    batchItems,
        Source: InputSource{
            Format: "json",
        },
        CreatedAt: time.Now(),
    }, nil
}
```

---

## 3. YAML Format

**Extension:** `.yaml`, `.yml`  
**Use Case:** Configuration files, complex prompts with anchors, multi-document streams

### Structure

```yaml
# Single document
systemPrompt: |
  You are a technical documentation writer.
  Follow these rules:
  - Use clear, concise language
  - Include code examples
  - Add diagrams where helpful

userPrompt: |
  Document the authentication flow for the application.
  
  Include:
  - Sequence diagram
  - API endpoints
  - Error handling

model: writing
temperature: 0.5
maxTokens: 4096
outputFormat: markdown

variables:
  projectName: "Spec Management Software"
  version: "1.0.0"
```

### Multi-Document Mode

```yaml
# Document 1 - Shared settings (anchor)
defaults: &defaults
  model: writing
  temperature: 0.7
  maxTokens: 2048

---
# Document 2 - Feature 1
<<: *defaults
userPrompt: "Write spec for user authentication"
variables:
  feature: "authentication"

---
# Document 3 - Feature 2
<<: *defaults
userPrompt: "Write spec for file management"
variables:
  feature: "file-management"
```

### Parser Implementation

```go
type YAMLParser struct{}

type YAMLRequest struct {
    SystemPrompt string            `yaml:"systemPrompt"`
    UserPrompt   string            `yaml:"userPrompt"`
    Model        string            `yaml:"model"`
    ModelId      string            `yaml:"modelId,omitempty"`
    Temperature  float64           `yaml:"temperature,omitempty"`
    MaxTokens    int               `yaml:"maxTokens,omitempty"`
    TopP         float64           `yaml:"topP,omitempty"`
    OutputFormat string            `yaml:"outputFormat,omitempty"`
    Stream       bool              `yaml:"stream,omitempty"`
    Variables    map[string]string `yaml:"variables,omitempty"`
    Context      []ContextItem     `yaml:"context,omitempty"`
}

func (p *YAMLParser) Parse(content []byte) appfault.Result[NormalizedRequest] {
    // Check for multi-document
    if bytes.Contains(content, []byte("\n---\n")) {
        return p.parseMultiDocument(content)
    }
    return p.parseSingleDocument(content)
}

func (p *YamlParser) parseSingleDocument(content []byte) appfault.Result[NormalizedRequest] {
    var yr YamlRequest
    if err := yaml.Unmarshal(content, &yr); err != nil {
        return nil, NewError(ErrYamlParseFailed, "invalid YAML: %v", err)
    }
    
    return &NormalizedRequest{
        Id:            uuid.New().String(),
        SystemPrompt:  yr.SystemPrompt,
        UserPrompt:    p.resolveVariables(yr.UserPrompt, yr.Variables),
        ModelCategory: ModelCategory(yr.Model),
        ModelId:       yr.ModelId,
        Temperature:   yr.Temperature,
        MaxTokens:     yr.MaxTokens,
        TopP:          yr.TopP,
        Stream:        yr.Stream,
        OutputFormat:  OutputFormat(yr.OutputFormat),
        Variables:     yr.Variables,
        Context:       yr.Context,
        Source: InputSource{
            Format: "yaml",
        },
        CreatedAt: time.Now(),
    }, nil
}

func (p *YamlParser) parseMultiDocument(content []byte) appfault.Result[NormalizedRequest] {
    decoder := yaml.NewDecoder(bytes.NewReader(content))
    
    var requests []YamlRequest
    for {
        var yr YamlRequest
        if err := decoder.Decode(&yr); err != nil {
            if err == io.EOF {
                break
            }
            return nil, NewError(ErrYamlParseFailed, "invalid YAML document: %v", err)
        }
        // Skip anchor-only documents
        if yr.UserPrompt != "" {
            requests = append(requests, yr)
        }
    }
    
    if len(requests) == 0 {
        return nil, NewError(ErrYamlEmpty, "no valid YAML documents found")
    }
    
    // Convert to batch mode
    var batchItems []BatchItem
    for i, req := range requests {
        batchItems = append(batchItems, BatchItem{
            Id:        fmt.Sprintf("doc-%d", i+1),
            Variables: req.Variables,
        })
    }
    
    // Use first document as template
    first := requests[0]
    return &NormalizedRequest{
        Id:            uuid.New().String(),
        SystemPrompt:  first.SystemPrompt,
        UserPrompt:    first.UserPrompt,
        ModelCategory: ModelCategory(first.Model),
        ModelId:       first.ModelId,
        Temperature:   first.Temperature,
        MaxTokens:     first.MaxTokens,
        BatchMode:     len(requests) > 1,
        BatchItems:    batchItems,
        Source: InputSource{
            Format: "yaml",
        },
        CreatedAt: time.Now(),
    }, nil
}
```

---

## 4. CSV Format

**Extension:** `.csv`  
**Use Case:** Bulk data processing, keyword generation, batch operations

### Structure

```csv
id,productName,category,targetAudience
1,Smart Widget,Electronics,Tech enthusiasts
2,Eco Bottle,Sustainability,Environmentally conscious
3,Speed Runner,Sports,Athletes
```

### Configuration (companion `.json` or `.yaml`)

```yaml
# products.config.yaml (companion to products.csv)
systemPrompt: "You are a product marketing specialist."
userPromptTemplate: |
  Create a marketing tagline for:
  Product: {{productName}}
  Category: {{category}}
  Target: {{targetAudience}}
  
  Return only the tagline, no explanation.

model: writing
temperature: 0.8
outputFormat: text
idColumn: id
```

### Parser Implementation

```go
type CSVParser struct{}

type CSVConfig struct {
    SystemPrompt       string `yaml:"systemPrompt"`
    UserPromptTemplate string `yaml:"userPromptTemplate"`
    Model              string `yaml:"model"`
    ModelId            string `yaml:"modelId,omitempty"`
    Temperature        float64 `yaml:"temperature,omitempty"`
    MaxTokens          int     `yaml:"maxTokens,omitempty"`
    OutputFormat       string  `yaml:"outputFormat,omitempty"`
    IdColumn           string  `yaml:"idColumn"` // Which column to use as batch item Id
    SkipHeader         bool    `yaml:"skipHeader,omitempty"`
}

func (p *CSVParser) Parse(content []byte) appfault.Result[NormalizedRequest] {
    return nil, NewError(ErrCSVRequiresConfig, "CSV parsing requires companion config file")
}

func (p *CSVParser) ParseWithConfig(csvContent []byte, config CSVConfig) appfault.Result[NormalizedRequest] {
    // 1. Parse CSV
    reader := csv.NewReader(bytes.NewReader(csvContent))
    records, err := reader.ReadAll()
    if err != nil {
        return nil, NewError(ErrCSVParseFailed, "invalid CSV: %v", err)
    }
    
    if len(records) < 2 {
        return nil, NewError(ErrCSVEmpty, "CSV must have header and at least one data row")
    }
    
    // 2. Extract headers
    headers := records[0]
    headerMap := make(map[string]int)
    for i, h := range headers {
        headerMap[strings.TrimSpace(h)] = i
    }
    
    // 3. Find Id column
    idColIndex, ok := headerMap[config.IdColumn]
    if !ok {
        idColIndex = 0 // Default to first column
    }
    
    // 4. Build batch items
    var batchItems []BatchItem
    for i := 1; i < len(records); i++ {
        row := records[i]
        variables := make(map[string]string)
        
        for j, value := range row {
            if j < len(headers) {
                variables[headers[j]] = strings.TrimSpace(value)
            }
        }
        
        id := fmt.Sprintf("row-%d", i)
        if idColIndex < len(row) {
            id = row[idColIndex]
        }
        
        batchItems = append(batchItems, BatchItem{
            Id:        id,
            Variables: variables,
        })
    }
    
    return &NormalizedRequest{
        Id:            uuid.New().String(),
        SystemPrompt:  config.SystemPrompt,
        UserPrompt:    config.UserPromptTemplate,
        ModelCategory: ModelCategory(config.Model),
        ModelId:       config.ModelId,
        Temperature:   config.Temperature,
        MaxTokens:     config.MaxTokens,
        OutputFormat:  OutputFormat(config.OutputFormat),
        BatchMode:     true,
        BatchItems:    batchItems,
        Source: InputSource{
            Format: "csv",
        },
        CreatedAt: time.Now(),
    }, nil
}
```

---

## Format Selection Matrix

| Requirement | Recommended Format |
|-------------|-------------------|
| Simple prompt with variables | Markdown |
| API integration | JSON |
| Complex config with reuse | YAML |
| Bulk data processing | CSV |
| Human-readable templates | Markdown |
| Strict schema validation | JSON |
| Multi-step prompts | YAML multi-doc |
| Spreadsheet data | CSV |

---

## Variable Resolution

All formats support `{{variable}}` syntax:

```go
func resolveVariables(template string, variables map[string]string) string {
    result := template
    for key, value := range variables {
        placeholder := fmt.Sprintf("{{%s}}", key)
        result = strings.ReplaceAll(result, placeholder, value)
    }
    return result
}
```

---

## See Also

- [Architecture](./01-architecture.md)
- [Error Codes](./05-error-codes.md)
