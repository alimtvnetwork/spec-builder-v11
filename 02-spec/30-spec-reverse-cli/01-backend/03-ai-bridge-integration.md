# AI Bridge Integration

**Version:** 2.0.0  
**Status:** Draft  
**Created:** 2026-03-09  

---

## Overview

The AI Bridge Integration module connects the Spec Reverse CLI to the AI Bridge service for intelligent specification generation. It transforms extracted code symbols into structured prompts and processes LLM responses into specification documents.

**Cross-References:**
- [Spec Reverse CLI Overview](../00-overview.md)
- [Code Analysis Engine](./02-code-analysis.md)
- [AI Bridge CLI](../../27-ai-bridge-cli/00-overview.md)
- [RAG System](../../21-app/spec-management-software/05-features/09-knowledge-memory/01-rag-system.md)

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      AI BRIDGE INTEGRATION                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│   │  Analysis       │────▶│  Prompt         │────▶│  AI Bridge      │       │
│   │  Result         │     │  Builder        │     │  Client         │       │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│                                                           │                   │
│                                                           ▼                   │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│   │  Spec           │◀────│  Response       │◀────│  LLM Response   │       │
│   │  Document       │     │  Parser         │     │  (Streaming)    │       │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│                                                                               │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │                    RAG Context Injection                         │       │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │       │
│   │  │ Split DB │  │ Seedable │  │ Error    │  │ General Spec │    │       │
│   │  │ Patterns │  │ Config   │  │ Registry │  │ Standards    │    │       │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │       │
│   └─────────────────────────────────────────────────────────────────┘       │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. AI Bridge Client

### 2.1 Client Configuration

```go
// internal/aibridge/client.go
package aibridge

import (
    "context"
    "net/http"
    "time"
)

type AIBridgeConfig struct {
    BaseUrl        string
    ApiKey         string
    Model          string
    Temperature    float64
    MaxTokens      int
    TimeoutSeconds int
    RetryCount     int
    StreamEnabled  bool
}

type AIBridgeClient struct {
    config     *AIBridgeConfig
    httpClient *http.Client
}

func NewAIBridgeClient(config *AIBridgeConfig) *AIBridgeClient {
    return &AIBridgeClient{
        config: config,
        httpClient: &http.Client{
            Timeout: time.Duration(config.TimeoutSeconds) * time.Second,
        },
    }
}
```

### 2.2 Request Types

```go
// internal/aibridge/types.go
package aibridge

type GenerationRequest struct {
    Model       string
    Messages    []ChatMessage
    Temperature float64
    MaxTokens   int
    Stream      bool
    Context     *ContextBlock  `json:",omitempty"`
}

type ChatMessage struct {
    Role    string
    Content string
}

type ContextBlock struct {
    RagChunks     []RAGChunk    `json:",omitempty"`
    CodeSymbols   []CodeSymbol  `json:",omitempty"`
    KnowledgeBase []string      `json:",omitempty"`
}

type RAGChunk struct {
    Id       string
    Content  string
    Score    float64
    Source   string
}

type CodeSymbol struct {
    Type     string
    Name     string
    Source   string
    Metadata map[string]string
}

type GenerationResponse struct {
    Id           string
    Content      string
    Model        string
    Usage        Usage
    FinishReason string
}

type Usage struct {
    PromptTokens     int
    CompletionTokens int
    TotalTokens      int
}
```

### 2.3 Generation Methods

```go
// internal/aibridge/generate.go
package aibridge

import (
    "bufio"
    stdctx "context"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "strings"
)

func (c *AIBridgeClient) Generate(context stdctx.Context, req *GenerationRequest) apperror.Result[*GenerationResponse] {
    if req.Stream {
        return c.generateStream(context, req)
    }
    return c.generateSync(context, req)
}

func (c *AIBridgeClient) generateSync(context stdctx.Context, req *GenerationRequest) apperror.Result[*GenerationResponse] {
    body, err := json.Marshal(req)
    if err != nil {
        return nil, NewError(SRC_ERR_AI_REQUEST, err.Error())
    }
    
    httpReq, err := http.NewRequestWithContext(context, httpmethod.Post.String(), c.config.BaseUrl+"/v1/chat/completions", strings.NewReader(string(body)))
    if err != nil {
        return nil, NewError(SRC_ERR_AI_REQUEST, err.Error())
    }
    
    httpReq.Header.Set("Content-Type", "application/json")
    if c.config.ApiKey != "" {
        httpReq.Header.Set("Authorization", "Bearer "+c.config.ApiKey)
    }
    
    resp, err := c.httpClient.Do(httpReq)
    if err != nil {
        return nil, NewError(SRC_ERR_AI_CONNECTION, err.Error())
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        return nil, NewError(SRC_ERR_AI_RESPONSE, fmt.Sprintf("status %d", resp.StatusCode))
    }
    
    var genResp GenerationResponse
    if err := json.NewDecoder(resp.Body).Decode(&genResp); err != nil {
        return nil, NewError(SRC_ERR_AI_PARSE, err.Error())
    }
    
    return &genResp, nil
}

func (c *AIBridgeClient) generateStream(context stdctx.Context, req *GenerationRequest) apperror.Result[*GenerationResponse] {
    req.Stream = true
    body, _ := json.Marshal(req)
    
    httpReq, _ := http.NewRequestWithContext(context, httpmethod.Post.String(), c.config.BaseUrl+"/v1/chat/completions", strings.NewReader(string(body)))
    httpReq.Header.Set("Content-Type", "application/json")
    httpReq.Header.Set("Accept", "text/event-stream")
    
    resp, err := c.httpClient.Do(httpReq)
    if err != nil {
        return nil, NewError(SRC_ERR_AI_CONNECTION, err.Error())
    }
    defer resp.Body.Close()
    
    var fullContent strings.Builder
    scanner := bufio.NewScanner(resp.Body)
    
    for scanner.Scan() {
        line := scanner.Text()
        if strings.HasPrefix(line, "data: ") {
            data := strings.TrimPrefix(line, "data: ")
            if data == "[DONE]" {
                break
            }
            
            var chunk struct {
                Choices []struct {
                    Delta struct {
                        Content string
                    }
                }
            }
            
            if json.Unmarshal([]byte(data), &chunk) == nil && len(chunk.Choices) > 0 {
                fullContent.WriteString(chunk.Choices[0].Delta.Content)
            }
        }
    }
    
    return &GenerationResponse{
        Content: fullContent.String(),
    }, nil
}
```

---

## 3. Prompt Builder

### 3.1 System Prompts

```go
// internal/aibridge/prompts.go
package aibridge

const SystemPromptSpecGeneration = `You are a specification writer for software projects. 
Your task is to analyze code symbols and generate structured specifications following the 
Spec Management Software format.

## Required Knowledge

You MUST apply these architectural patterns in your specifications:

### Split DB Architecture
- Three-level SQLite hierarchy: Base DB → Workspace DB → Project DB
- Settings cascade with project-level override
- RAG chunks stored at project level

### Seedable Configuration
- JSON seed files with version tracking
- Database as runtime source of truth
- changelog.json for config migrations

### Error Code Registry
- Prefixed error ranges (see context for tool-specific range)
- Structured error format with code, constant, message, details

## Output Format

Generate specifications in Markdown with:
1. Version header (1.0.0, Draft status)
2. Overview section with purpose
3. Architecture diagram in ASCII
4. Data models with Go struct examples
5. API endpoints with request/response examples
6. Error codes table
7. Cross-references section

Be precise, use PascalCase for database columns, and include code examples.`

const SystemPromptDataModels = `Analyze the provided code symbols and generate data model specifications.

For each entity:
1. Identify the table name (use PascalCase)
2. List all fields with types
3. Identify relationships (foreign keys)
4. Note indexes and constraints
5. Provide GORM struct example

Output as a Markdown table followed by Go code blocks.`

const SystemPromptApiEndpoints = `Analyze the provided handlers and generate API endpoint specifications.

For each endpoint:
1. HTTP method and route
2. Request body schema
3. Response envelope (success/data/error/meta)
4. Error codes that may be returned
5. Example request/response

Use the standard envelope format:
{
  "success": true,
  "data": {...},
  "error": null,
  "meta": { "requestId": "...", "timestamp": "...", "version": "..." }
}`
```

### 3.2 Prompt Construction

```go
// internal/aibridge/prompt_builder.go
package aibridge

type PromptBuilder struct {
    analysisResult *AnalysisResult
    specType       SpecType
    ragContext     []RAGChunk
}

// SpecType enum is defined in 12-enum-architecture.md
// Import: "spec-reverse-cli/internal/enums/spectype"
//
// spectype.Variant: Unknown, Overview, DataModels, Api, Architecture, Features

func (b *PromptBuilder) Build() []ChatMessage {
    messages := []ChatMessage{
        {
            Role:    "system",
            Content: b.getSystemPrompt(),
        },
    }
    
    // Add RAG context as assistant knowledge
    if len(b.ragContext) > 0 {
        messages = append(messages, ChatMessage{
            Role:    "assistant",
            Content: b.formatRAGContext(),
        })
    }
    
    // Add code analysis as user message
    messages = append(messages, ChatMessage{
        Role:    "user",
        Content: b.formatAnalysisRequest(),
    })
    
    return messages
}

func (b *PromptBuilder) getSystemPrompt() string {
    switch b.specType {
    case SpecTypeDataModels:
        return SystemPromptDataModels
    case SpecTypeApi:
        return SystemPromptApiEndpoints
    default:
        return SystemPromptSpecGeneration
    }
}

func (b *PromptBuilder) formatRAGContext() string {
    var sb strings.Builder
    sb.WriteString("## Relevant Knowledge\n\n")
    
    for _, chunk := range b.ragContext {
        sb.WriteString(fmt.Sprintf("### From: %s\n\n", chunk.Source))
        sb.WriteString(chunk.Content)
        sb.WriteString("\n\n---\n\n")
    }
    
    return sb.String()
}

func (b *PromptBuilder) formatAnalysisRequest() string {
    var sb strings.Builder
    
    sb.WriteString("## Code Analysis Results\n\n")
    sb.WriteString(fmt.Sprintf("**Language:** %s\n", b.analysisResult.Language.Language))
    sb.WriteString(fmt.Sprintf("**Framework:** %s\n", b.analysisResult.Language.Framework))
    sb.WriteString(fmt.Sprintf("**Architecture:** %s (%.0f%% confidence)\n\n", 
        b.analysisResult.Architecture.Type,
        b.analysisResult.Architecture.Confidence*100))
    
    // Add entities
    sb.WriteString("### Entities\n\n")
    for _, entity := range b.analysisResult.Symbols.Entities {
        sb.WriteString(fmt.Sprintf("- **%s** (%s)\n", entity.Name, entity.Source))
        for _, field := range entity.Fields {
            sb.WriteString(fmt.Sprintf("  - %s: %s\n", field.Name, field.Type))
        }
    }
    
    // Add services
    sb.WriteString("\n### Services\n\n")
    for _, service := range b.analysisResult.Symbols.Services {
        sb.WriteString(fmt.Sprintf("- **%s** (%s)\n", service.Name, service.Source))
        for _, method := range service.Methods {
            sb.WriteString(fmt.Sprintf("  - %s(%s) → %s\n", method.Name, method.Params, method.Returns))
        }
    }
    
    // Add handlers
    sb.WriteString("\n### HTTP Handlers\n\n")
    for _, handler := range b.analysisResult.Symbols.Handlers {
        sb.WriteString(fmt.Sprintf("- %s %s → %s\n", handler.Method, handler.Route, handler.Name))
    }
    
    sb.WriteString("\n## Task\n\n")
    sb.WriteString("Generate a complete specification document based on the above analysis. ")
    sb.WriteString("Follow the Spec Management Software format and include all required sections.")
    
    return sb.String()
}
```

---

## 4. RAG Context Injection

### 4.1 Knowledge Base Loader

```go
// internal/aibridge/rag_loader.go
package aibridge

type RAGLoader struct {
    db        *gorm.DB
    embedder  EmbeddingService
}

// KnowledgeCategory enum is defined in 12-enum-architecture.md
// Import: "spec-reverse-cli/internal/enums/knowledgecategorytype"
//
// knowledgecategorytype.Variant: Unknown, SplitDb, SeedableConfig, ErrorCodes, GeneralSpec, CliPatterns

func (l *RAGLoader) LoadKnowledge(categories []KnowledgeCategory) apperror.Result[[]RAGChunk] {
    var chunks []RAGChunk
    
    for _, cat := range categories {
        catChunks, err := l.loadCategory(cat)
        if err != nil {
            return nil, err
        }
        chunks = append(chunks, catChunks...)
    }
    
    return chunks, nil
}

func (l *RAGLoader) loadCategory(category KnowledgeCategory) apperror.Result[[]RAGChunk] {
    paths := map[KnowledgeCategory]string{
        KnowledgeSplitDb:     "02-spec/06-split-db-architecture/00-overview.md",
        KnowledgeSeedable:    "02-spec/07-seedable-config-architecture/00-overview.md",
        KnowledgeErrorCodes:  "02-spec/03-error-code-registry/00-overview.md",
        KnowledgeGeneralSpec: "02-spec/01-general-spec/00-overview.md",
        KnowledgeCLIPatterns: "02-spec/33-shared-cli-frontend/00-overview.md",
    }
    
    path := paths[category]
    if path == "" {
        return nil, NewError(SRC_ERR_RAG_CATEGORY, "Unknown category: "+string(category))
    }
    
    content, err := os.ReadFile(path)
    if err != nil {
        return nil, NewError(SRC_ERR_RAG_LOAD, err.Error())
    }
    
    // Chunk the content
    chunks := l.chunkContent(string(content), path)
    return chunks, nil
}

func (l *RAGLoader) chunkContent(content, source string) []RAGChunk {
    // Split by headings
    sections := splitByHeadings(content)
    
    var chunks []RAGChunk
    for i, section := range sections {
        if len(section) > 100 { // Skip tiny sections
            chunks = append(chunks, RAGChunk{
                ID:      fmt.Sprintf("%s-chunk-%d", filepath.Base(source), i),
                Content: section,
                Source:  source,
                Score:   1.0, // Pre-loaded knowledge gets max score
            })
        }
    }
    
    return chunks
}
```

### 4.2 Semantic Search

```go
// internal/aibridge/semantic_search.go
package aibridge

type SemanticSearcher struct {
    db       *gorm.DB
    embedder EmbeddingService
}

func (s *SemanticSearcher) Search(query string, limit int) apperror.Result[[]RAGChunk] {
    // Get query embedding
    embedding, err := s.embedder.Embed(query)
    if err != nil {
        return nil, NewError(SRC_ERR_EMBED, err.Error())
    }
    
    // ORM EXCEPTION: db.Raw() required — SQLite-vss distance function
    // has no native GORM equivalent. See ORM-Only Policy exceptions:
    // vector search operations where native ORM support is unavailable.
    var results []struct {
        ChunkId   string
        Content   string
        Source    string
        Distance  float64
    }
    
    err = s.db.Raw(`
        SELECT c.Id as chunk_id, c.Content, c.Source, 
               vss_distance(v.embedding, ?) as distance
        FROM RagChunk c
        JOIN RagVector v ON c.Id = v.ChunkId
        ORDER BY distance ASC
        LIMIT ?
    `, embedding, limit).Scan(&results).Error
    
    if err != nil {
        return nil, NewError(SRC_ERR_SEARCH, err.Error())
    }
    
    var chunks []RagChunk
    for _, r := range results {
        chunks = append(chunks, RagChunk{
            Id:      r.ChunkId,
            Content: r.Content,
            Source:  r.Source,
            Score:   1.0 - r.Distance, // Convert distance to similarity
        })
    }
    
    return chunks, nil
}
```

---

## 5. Response Parser

### 5.1 Spec Document Parser

```go
// internal/aibridge/response_parser.go
package aibridge

type ResponseParser struct{}

type ParsedSpec struct {
    Title       string
    Version     string
    Status      string
    Sections    []SpecSection
    RawMarkdown string
}

type SpecSection struct {
    Heading  string
    Level    int
    Content  string
    CodeBlocks []CodeBlock
}

type CodeBlock struct {
    Language string
    Code     string
}

func (p *ResponseParser) Parse(response *GenerationResponse) apperror.Result[*ParsedSpec] {
    content := response.Content
    
    spec := &ParsedSpec{
        RawMarkdown: content,
    }
    
    // Extract title (first H1)
    titleMatch := regexp.MustCompile(`^#\s+(.+)`).FindStringSubmatch(content)
    if len(titleMatch) > 1 {
        spec.Title = titleMatch[1]
    }
    
    // Extract version from header
    versionMatch := regexp.MustCompile(`\*\*Version:\*\*\s*(\d+\.\d+\.\d+)`).FindStringSubmatch(content)
    if len(versionMatch) > 1 {
        spec.Version = versionMatch[1]
    }
    
    // Extract status
    statusMatch := regexp.MustCompile(`\*\*Status:\*\*\s*(\w+)`).FindStringSubmatch(content)
    if len(statusMatch) > 1 {
        spec.Status = statusMatch[1]
    }
    
    // Parse sections
    spec.Sections = p.parseSections(content)
    
    return spec, nil
}

func (p *ResponseParser) parseSections(content string) []SpecSection {
    var sections []SpecSection
    
    // Split by headings
    headingPattern := regexp.MustCompile(`(?m)^(#{1,6})\s+(.+)$`)
    matches := headingPattern.FindAllStringSubmatchIndex(content, -1)
    
    for i, match := range matches {
        level := match[3] - match[2] // Length of # characters
        heading := content[match[4]:match[5]]
        
        // Content is from end of heading to start of next heading (or end)
        contentStart := match[1]
        var contentEnd int
        if i+1 < len(matches) {
            contentEnd = matches[i+1][0]
        } else {
            contentEnd = len(content)
        }
        
        sectionContent := strings.TrimSpace(content[contentStart:contentEnd])
        
        sections = append(sections, SpecSection{
            Heading:    heading,
            Level:      level,
            Content:    sectionContent,
            CodeBlocks: p.extractCodeBlocks(sectionContent),
        })
    }
    
    return sections
}

func (p *ResponseParser) extractCodeBlocks(content string) []CodeBlock {
    var blocks []CodeBlock
    
    pattern := regexp.MustCompile("```(\\w*)\\n([\\s\\S]*?)```")
    matches := pattern.FindAllStringSubmatch(content, -1)
    
    for _, match := range matches {
        blocks = append(blocks, CodeBlock{
            Language: match[1],
            Code:     match[2],
        })
    }
    
    return blocks
}
```

---

## 6. Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 11200 | SRC_ERR_AI_REQUEST | Failed to build AI request |
| 11201 | SRC_ERR_AI_CONNECTION | Cannot connect to AI Bridge |
| 11202 | SRC_ERR_AI_RESPONSE | AI Bridge returned error |
| 11203 | SRC_ERR_AI_PARSE | Failed to parse AI response |
| 11204 | SRC_ERR_AI_TIMEOUT | AI request timed out |
| 11210 | SRC_ERR_RAG_CATEGORY | Unknown RAG category |
| 11211 | SRC_ERR_RAG_LOAD | Failed to load RAG content |
| 11212 | SRC_ERR_EMBED | Embedding generation failed |
| 11213 | SRC_ERR_SEARCH | Vector search failed |

---

## 7. Configuration

### 7.1 Seedable Config Keys

| Key | Default | Description |
|-----|---------|-------------|
| `src.aibridge.url` | `http://localhost:5040` | AI Bridge base URL |
| `src.aibridge.model` | `llama3` | Default LLM model |
| `src.aibridge.temperature` | `0.7` | Generation temperature |
| `src.aibridge.maxTokens` | `4096` | Max output tokens |
| `src.aibridge.timeout` | `120` | Request timeout seconds |
| `src.rag.enabled` | `true` | Enable RAG context |
| `src.rag.chunkLimit` | `10` | Max RAG chunks per request |

---

## 8. Cross-References

| Reference | Location |
|-----------|----------|
| Code Analysis | `./02-code-analysis.md` |
| Output Formats | `./04-output-formats.md` |
| AI Bridge CLI | `../../27-ai-bridge-cli/00-overview.md` |
| RAG System | `../../21-app/spec-management-software/05-features/09-knowledge-memory/01-rag-system.md` |

---

*AI Bridge Integration specification for Spec Reverse CLI.*
