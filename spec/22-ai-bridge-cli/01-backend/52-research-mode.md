# AI Bridge Research Mode Specification

**Version:** 5.0.0  
**Updated:** 2026-03-09  
**Error Range:** 9848-9849 (delegates to Long-Chain 9970-9989, Vector DB 9990-9999, Reasoning 9790-9829)

---

## Overview

Research Mode is an advanced AI Bridge feature that enables thorough, multi-source research with customizable depth and output formats. When enabled, the system gathers extensive information, creates long-chain subtasks, and produces detail-oriented research outputs.

---

## Research Pipeline

```
┌─────────────────────────────────────────────────────────┐
│                    User Request                         │
│  "Research: Best practices for Go error handling"       │
│  + Output: Markdown, Length: Lengthy                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│               1. RESEARCH PLANNING                      │
│  • Analyze query complexity                             │
│  • Determine required sources                           │
│  • Generate research subtasks                           │
│  • Estimate token budget                                │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│               2. PARALLEL GATHERING                     │
│  • Execute GSearch queries (multi-source)               │
│  • Fetch relevant URLs concurrently                     │
│  • Query RAG for existing knowledge                     │
│  • Extract structured data                              │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│               3. SYNTHESIS & REASONING                  │
│  • Deduplicate information                              │
│  • Validate source credibility                          │
│  • Create long-chain reasoning tasks                    │
│  • Generate structured outline                          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│               4. OUTPUT GENERATION                      │
│  • Apply length constraints                             │
│  • Format to requested output type                      │
│  • Add citations and references                         │
│  • Generate executive summary                           │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│               5. QUALITY VERIFICATION                   │
│  • Check factual consistency                            │
│  • Verify citation accuracy                             │
│  • Validate output length                               │
│  • Generate confidence score                            │
└─────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Start Research

```
POST /api/v1/research
```

**Request:**

```go
type ResearchRequest struct {
    Query         string                `json:",omitempty"` // Research topic/question
    Mode          string                `json:",omitempty"` // "quick", "standard", "deep"
    OutputLength  *OutputLengthConfig   `json:",omitempty"` // User-defined limits
    OutputFormat  string                `json:",omitempty"` // "markdown", "html", "plaintext"
    Sources       *SourceConfig         `json:",omitempty"` // Source preferences
    IncludeCitations bool               `json:",omitempty"` // Include source citations
    SessionId     string                `json:",omitempty"` // Link to chat session
}

type OutputLengthConfig struct {
    MinWords   int  `json:",omitempty"` // Minimum word count
    MaxWords   int  `json:",omitempty"` // Maximum word count
    MinTokens  int  `json:",omitempty"` // Alternative: token-based
    MaxTokens  int  `json:",omitempty"`
}

type SourceConfig struct {
    EnableWeb       bool     `json:",omitempty"` // Web search via GSearch
    EnableRag       bool     `json:",omitempty"` // Internal RAG knowledge
    Platforms       []string `json:",omitempty"` // ["google", "youtube", "reddit"]
    CustomSites     []string `json:",omitempty"` // Specific sites to search
    MaxSourcesPerType int    `json:",omitempty"` // Limit per source type
}
```

**Response:**

```go
type ResearchResponse struct {
    ResearchId    string            `json:",omitempty"`
    Status        string            `json:",omitempty"` // "Queued", "Gathering", "Synthesizing", "Complete"
    Progress      int               `json:",omitempty"` // 0-100
    EstimatedTime int               `json:",omitempty"` // Seconds remaining
}
```

### Get Research Status

```
GET /api/v1/research/{id}
```

### Get Research Result

```
GET /api/v1/research/{id}/result
```

**Response:**

```go
type ResearchResult struct {
    ResearchId      string           `json:",omitempty"`
    Query           string           `json:",omitempty"`
    ExecutiveSummary string          `json:",omitempty"` // 2-3 sentence summary
    Content         string           `json:",omitempty"` // Full research output
    Format          string           `json:",omitempty"` // markdown, html, plaintext
    WordCount       int              `json:",omitempty"`
    TokenCount      int              `json:",omitempty"`
    Citations       []Citation       `json:",omitempty"`
    Subtasks        []ResearchSubtask `json:",omitempty"`
    ConfidenceScore float64          `json:",omitempty"` // 0.0-1.0
    CompletedAt     time.Time        `json:",omitempty"`
    DurationMs      int64            `json:",omitempty"`
}

type Citation struct {
    Id       int    `json:",omitempty"`
    Title    string `json:",omitempty"`
    Url      string `json:",omitempty"`
    Source   string `json:",omitempty"` // "google", "reddit", "rag"
    Accessed string `json:",omitempty"` // ISO 8601
}

type ResearchSubtask struct {
    Id          string `json:",omitempty"`
    Description string `json:",omitempty"`
    Status      string `json:",omitempty"`
    Result      string `json:",omitempty"`
}
```

### Stream Research Progress

```
WebSocket: /ws/research/{id}
```

---

## Research Modes

| Mode | Description | Typical Duration | Sources |
|------|-------------|------------------|---------|
| Quick | Fast overview, key points only | 30-60s | 5-10 sources |
| Standard | Balanced depth and speed | 2-5 min | 15-30 sources |
| Deep | Comprehensive, multi-angle analysis | 5-15 min | 50+ sources |

---

## Output Length Presets

| Preset | Word Range | Use Case |
|--------|------------|----------|
| Compact | 300-500 | Quick summaries, briefs |
| Standard | 800-1500 | Reports, articles |
| Detailed | 2000-3500 | In-depth analysis |
| Comprehensive | 5000+ | Research papers, guides |

Users can also specify exact limits via `OutputLengthConfig`.

---

## Database Schema

### Researches Table

```sql
CREATE TABLE Researches (
    Id TEXT PRIMARY KEY,
    SessionId TEXT,
    Query TEXT NOT NULL,
    Mode TEXT NOT NULL,
    Status TEXT NOT NULL,
    Progress INTEGER DEFAULT 0,
    OutputFormat TEXT DEFAULT 'markdown',
    MinWords INTEGER,
    MaxWords INTEGER,
    SourceConfig TEXT,               -- JSON
    ExecutiveSummary TEXT,
    Content TEXT,
    WordCount INTEGER,
    TokenCount INTEGER,
    ConfidenceScore REAL,
    StartedAt DATETIME NOT NULL,
    CompletedAt DATETIME,
    DurationMs INTEGER,
    ErrorMessage TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (SessionId) REFERENCES Sessions(Id)
);

CREATE INDEX IdxResearchesSession ON Researches(SessionId);
CREATE INDEX IdxResearchesStatus ON Researches(Status);
```

### ResearchSubtasks Table

```sql
CREATE TABLE ResearchSubtasks (
    Id TEXT PRIMARY KEY,
    ResearchId TEXT NOT NULL,
    Description TEXT NOT NULL,
    Type TEXT NOT NULL,              -- "Search", "Fetch", "Analyze", "Synthesize"
    Status TEXT NOT NULL,            -- "Pending", "Running", "Complete", "Failed"
    InputData TEXT,                  -- JSON
    OutputData TEXT,                 -- JSON
    StartedAt DATETIME,
    CompletedAt DATETIME,
    DurationMs INTEGER,
    ErrorMessage TEXT,
    FOREIGN KEY (ResearchId) REFERENCES Researches(Id) ON DELETE CASCADE
);

CREATE INDEX IdxSubtasksResearch ON ResearchSubtasks(ResearchId);
```

### ResearchCitations Table

```sql
CREATE TABLE ResearchCitations (
    Id TEXT PRIMARY KEY,
    ResearchId TEXT NOT NULL,
    CitationNumber INTEGER NOT NULL,
    Title TEXT,
    Url TEXT,
    Source TEXT,
    Snippet TEXT,
    AccessedAt DATETIME,
    FOREIGN KEY (ResearchId) REFERENCES Researches(Id) ON DELETE CASCADE
);

CREATE INDEX IdxCitationsResearch ON ResearchCitations(ResearchId);
```

---

## Go Interfaces

```go
type ResearchService interface {
    Start(context stdctx.Context, req ResearchRequest) apperror.Result[*ResearchResponse]
    GetStatus(context stdctx.Context, id string) apperror.Result[*ResearchStatus]
    GetResult(context stdctx.Context, id string) apperror.Result[*ResearchResult]
    Cancel(context stdctx.Context, id string) *apperror.AppError
    List(context stdctx.Context, sessionId string, opts ListOptions) apperror.Result[[]Research]
}

type ResearchPlanner interface {
    AnalyzeQuery(query string) apperror.Result[*QueryAnalysis]
    GenerateSubtasks(analysis *QueryAnalysis, config SourceConfig) apperror.Result[[]ResearchSubtask]
    EstimateTokenBudget(subtasks []ResearchSubtask, lengthConfig OutputLengthConfig) apperror.Result[int]
}

type ResearchGatherer interface {
    ExecuteSubtasks(context stdctx.Context, subtasks []ResearchSubtask) apperror.Result[<-chan SubtaskResult]
    FetchSources(context stdctx.Context, urls []string) apperror.Result[[]SourceContent]
    QueryRag(context stdctx.Context, query string, limit int) apperror.Result[[]RagChunk]
}

// CitatedContent holds content with its citations after processing
type CitatedContent struct {
    Content   string
    Citations []Citation
}

type ResearchSynthesizer interface {
    Deduplicate(sources []SourceContent) []SourceContent
    CreateOutline(sources []SourceContent, query string) apperror.Result[*Outline]
    GenerateContent(outline *Outline, format string, lengthConfig OutputLengthConfig) apperror.Result[string]
    AddCitations(content string, sources []SourceContent) apperror.Result[CitatedContent]
}

type ResearchVerifier interface {
    CheckConsistency(content string, sources []SourceContent) apperror.Result[float64]
    ValidateCitations(content string, citations []Citation) *apperror.AppError
    CalculateConfidence(research *Research) float64
}
```

---

## Long-Chain Integration

Research Mode leverages the Long-Chain Command System for subtask execution:

```go
// Research subtasks map to long-chain steps
type ResearchLongChain struct {
    Id          string
    Name        string
    Steps       []LongChainStep
}

// Example: Deep research on "Go error handling"
var exampleChain = ResearchLongChain{
    Name: "go-error-handling-research",
    Steps: []LongChainStep{
        {Type: "Search", Config: SearchConfig{Query: "Go error handling best practices", Platforms: []string{"google", "medium"}}},
        {Type: "Search", Config: SearchConfig{Query: "Go error wrapping patterns", Platforms: []string{"reddit", "youtube"}}},
        {Type: "ReadUrl", Config: ReadUrlConfig{Urls: []string{/* from search results */}}},
        {Type: "VectorQuery", Config: VectorConfig{Query: "error handling", Collection: "code"}},
        {Type: "Transform", Config: TransformConfig{Operation: "Deduplicate"}},
        {Type: "Aggregate", Config: AggregateConfig{Operation: "MergeByTopic"}},
        {Type: "Execute", Config: ExecuteConfig{Command: "SynthesizeReport"}},
    },
}
```

---

## CLI Commands

```bash
# Start research
aibridge research "Best practices for microservices in Go" \
  --mode deep \
  --format markdown \
  --max-words 5000

# With specific sources
aibridge research "React performance optimization" \
  --platforms google,youtube,medium \
  --sites react.dev,kentcdodds.com

# Quick research
aibridge research "What is RAG?" --mode quick --max-words 500

# Check status
aibridge research status {id}

# Get result
aibridge research result {id} --output research-output.md
```

---

## Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 9848 | ErrResearchModeInvalid | Invalid research mode specified |
| 9849 | ErrResearchOutputConfig | Invalid output length or format configuration |

**Delegated Error Ranges:**
- Long-Chain (9970-9989): For subtask execution errors
- Vector DB (9990-9999): For RAG query errors
- Reasoning (9790-9829): For synthesis/reasoning errors

---

## Configuration (config.seed.json)

```json
{
  "ResearchMode": {
    "SeedVersion": "1.0.0",
    "Values": {
      "DefaultMode": "Standard",
      "DefaultFormat": "Markdown",
      "DefaultMaxWords": 2000,
      "QuickModeMaxSources": 10,
      "StandardModeMaxSources": 30,
      "DeepModeMaxSources": 100,
      "MaxConcurrentGathers": 20,
      "GatherTimeoutSeconds": 60,
      "SynthesisTimeoutSeconds": 120,
      "EnableWebSearch": true,
      "EnableRagSearch": true,
      "DefaultPlatforms": ["google", "medium", "reddit"],
      "CitationFormat": "Numbered"
    }
  }
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Long-Chain Commands | `spec/22-ai-bridge-cli/01-backend/50-long-chain-command-system.md` |
| Vector Database | `spec/22-ai-bridge-cli/01-backend/51-vector-database-integration.md` |
| Reasoning Defaults | `spec/22-ai-bridge-cli/01-backend/42-lovable-reasoning-defaults.md` |
| GSearch Multi-Source | `spec/20-gsearch-cli/01-backend/56-multi-source-search.md` |
| Plan Generation | `spec/22-ai-bridge-cli/01-backend/44-plan-generation.md` |
