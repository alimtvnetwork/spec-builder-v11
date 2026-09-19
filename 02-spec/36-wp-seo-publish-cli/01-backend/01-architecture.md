# WP SEO Publish CLI: Architecture

**Version:** 2.0.0  
**Updated:** 2026-03-09  

---

## Overview

The WordPress SEO Publish CLI follows a modular architecture designed for reliability, extensibility, and seamless integration with AI Bridge CLI for content generation.

---

## System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application Layer                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   HTTP      │  │  WebSocket  │  │   CLI       │              │
│  │   Server    │  │   Handler   │  │   Handler   │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          │                                       │
├──────────────────────────┴───────────────────────────────────────┤
│                        Service Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Connection     │  │   Content       │  │   Variable      │  │
│  │  Service        │  │   Service       │  │   Service       │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │            │
│  ┌────────┴────────┐  ┌────────┴────────┐  ┌───────┴─────────┐  │
│  │  Automation     │  │   Sync          │  │   Import/Export │  │
│  │  Service        │  │   Service       │  │   Service       │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                        Client Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   WordPress     │  │   AI Bridge     │  │   GSearch       │  │
│  │   Client        │  │   Client        │  │   Client        │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                        Data Layer                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Setting DB    │  │   Website DB    │  │   Publish DB    │  │
│  │   (Root)        │  │   (Per Site)    │  │   (Per Site)    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Application Layer

#### HTTP Server
- RESTful API endpoints for all operations
- JSON request/response format
- CORS support for frontend
- Rate limiting per client

#### WebSocket Handler
- Real-time publishing progress
- AI content generation streaming
- Connection status updates

#### CLI Handler
- Command-line interface for scripting
- Batch operations support
- PowerShell integration hooks

### 2. Service Layer

#### Connection Service
```go
type ConnectionService struct {
    db           *Database
    wpClient     *WordPressClient
    validator    *ConnectionValidator
}

type ConnectionConfig struct {
    SiteUrl         string
    Username        string
    ApplicationPass string
    Nickname        string
}

func (s *ConnectionService) Connect(cfg ConnectionConfig) appfault.Result[Website]
func (s *ConnectionService) Validate(websiteId string) appfault.Result[ValidationResult]
func (s *ConnectionService) Disconnect(websiteId string) *appfault.AppError
// Note: WebsiteSlice is defined in types.go (created from generic appfault.ResultSlice[Website]):
// type WebsiteSlice = appfault.ResultSlice[Website]
func (s *ConnectionService) List() WebsiteSlice
```

#### Content Service
```go
type ContentService struct {
    db           *Database
    wpClient     *WordPressClient
    aiBridge     *AIBridgeClient
    varProcessor *VariableProcessor
}

type PublishRequest struct {
    WebsiteId        string
    ContentType      contenttype.Variant          // → internal/enums/contenttype/
    Title            string
    SeoKeywords      []string
    Categories       []int                       `json:",omitempty"`
    Tags             []int                       `json:",omitempty"`
    Variables        json.RawMessage             `json:",omitempty"`
    AiPrompt         string                      `json:",omitempty"`
    OutputFormat     outputformattype.Variant     // → internal/enums/outputformattype/
    LinkDensity      *LinkDensityConfig           `json:",omitempty"`
    InternalLinks    []string                    `json:",omitempty"`
    UseAiSuggestions bool
}

type PublishResponse struct {
    Id              int
    Url             string
    Title           string
    Content         string
    Categories      []int
    Tags            []int
    SuggestedCats   []string  `json:",omitempty"`
    SuggestedTags   []string  `json:",omitempty"`
    InternalLinks   []Link
    PublishedAt     time.Time
}

func (s *ContentService) Publish(req PublishRequest) appfault.Result[PublishResponse]
func (s *ContentService) Update(postId int, req PublishRequest) appfault.Result[PublishResponse]
func (s *ContentService) Fetch(websiteId string, postId int) appfault.Result[Content]
func (s *ContentService) Rewrite(postId int, prompt string) appfault.Result[PublishResponse]
```

#### Variable Service
```go
type VariableService struct {
    db        *Database
    processor *VariableProcessor
}

type VariableSource struct {
    ID       string
    Name     string
    Type     variablesourcetype.Variant   // → internal/enums/variablesourcetype/
    FilePath string
    Scope    variablescopetype.Variant    // → internal/enums/variablescopetype/
}

func (s *VariableService) Import(source VariableSource) appfault.Result[ImportResult]
// Note: ByteSlice is defined in types.go (created from generic appfault.ResultSlice[byte]):
// type ByteSlice = appfault.ResultSlice[byte]
func (s *VariableService) Export(scope string, format string) ByteSlice
func (s *VariableService) Get(scope string, key string) appfault.Result[any]
func (s *VariableService) Set(scope string, key string, value any) *appfault.AppError
// Note: VariableSlice is defined in types.go (created from generic appfault.ResultSlice[Variable]):
// type VariableSlice = appfault.ResultSlice[Variable]
func (s *VariableService) List(scope string) VariableSlice
```

#### Automation Service
```go
type AutomationService struct {
    db          *Database
    content     *ContentService
    aiBridge    *AIBridgeClient
}

type AutomationConfig struct {
    WebsiteId       string
    ContentType     string
    VariableSource  string
    RowRange        string `json:",omitempty"` // e.g., "1-100"
    AiPromptTemplate string
    AutoCategories  bool
    AutoTags        bool
    BatchSize       int
    DelaySeconds    int
}

type AutomationResult struct {
    TotalRows    int
    Successful   int
    Failed       int
    Publications []PublishResult
}

func (s *AutomationService) Run(cfg AutomationConfig) appfault.Result[AutomationResult]
// Note: PreviewItemSlice is defined in types.go (created from generic appfault.ResultSlice[PreviewItem]):
// type PreviewItemSlice = appfault.ResultSlice[PreviewItem]
func (s *AutomationService) Preview(cfg AutomationConfig, limit int) PreviewItemSlice
```

### 3. Client Layer

#### WordPress Client
```go
type WordPressClient struct {
    baseUrl     string
    username    string
    appPassword string
    httpClient  *http.Client
}

// Categories
func (c *WordPressClient) CreateCategory(cat Category) appfault.Result[Category]
func (c *WordPressClient) UpdateCategory(id int, cat Category) appfault.Result[Category]
// Note: CategorySlice is defined in types.go (created from generic appfault.ResultSlice[Category]):
// type CategorySlice = appfault.ResultSlice[Category]
func (c *WordPressClient) GetCategories() CategorySlice

// Posts
func (c *WordPressClient) CreatePost(post Post) appfault.Result[Post]
func (c *WordPressClient) UpdatePost(id int, post Post) appfault.Result[Post]
func (c *WordPressClient) GetPost(id int) appfault.Result[Post]
// Note: PostSlice is defined in types.go (created from generic appfault.ResultSlice[Post]):
// type PostSlice = appfault.ResultSlice[Post]
func (c *WordPressClient) GetPosts(params PostQuery) PostSlice

// Pages
func (c *WordPressClient) CreatePage(page Page) appfault.Result[Page]
func (c *WordPressClient) UpdatePage(id int, page Page) appfault.Result[Page]
func (c *WordPressClient) GetPage(id int) appfault.Result[Page]

// Tags
func (c *WordPressClient) CreateTag(tag Tag) appfault.Result[Tag]
// Note: TagSlice is defined in types.go (created from generic appfault.ResultSlice[Tag]):
// type TagSlice = appfault.ResultSlice[Tag]
func (c *WordPressClient) GetTags() TagSlice

// Media
func (c *WordPressClient) UploadMedia(file []byte, filename string) appfault.Result[Media]
```

#### AI Bridge Client
```go
type AIBridgeClient struct {
    baseUrl    string
    httpClient *http.Client
}

type SEORequest struct {
    ContentType     contenttype.Variant        // → internal/enums/contenttype/
    Title           string
    Keywords        []string
    Areas           []string
    Variables       json.RawMessage
    OutputFormat    outputformattype.Variant    // → internal/enums/outputformattype/
    LinkDensity     LinkDensityConfig
    InternalLinks   []string
    SitemapRAG      string                 `json:",omitempty"`
    SlugGuideline   string                 `json:",omitempty"`
}

type SeoResponse struct {
    Content         string
    Format          string
    SuggestedCats   []string
    SuggestedTags   []string
    GeneratedSlugs  []Slug
    InternalLinks   []Link
    Metadata        SeoMeta
}

func (c *AiBridgeClient) GenerateSeo(req SeoRequest) appfault.Result[SeoResponse]
func (c *AiBridgeClient) GenerateSeoStream(req SeoRequest) appfault.Result[<-chan SeoChunk]
// Note: StringSlice is defined in types.go (created from generic appfault.ResultSlice[string]):
// type StringSlice = appfault.ResultSlice[string]
func (c *AiBridgeClient) SuggestCategories(content string) StringSlice
// Note: StringSlice is defined in types.go (created from generic appfault.ResultSlice[string]):
// type StringSlice = appfault.ResultSlice[string]
func (c *AiBridgeClient) SuggestTags(content string) StringSlice
func (c *AiBridgeClient) RewriteContent(content, prompt string) appfault.Result[SeoResponse]
```

---

## Configuration

### Default Config (config.json)
```json
{
  "server": {
    "port": 5060,
    "host": "127.0.0.1"
  },
  "aiBridge": {
    "url": "http://127.0.0.1:5040",
    "timeout": 120
  },
  "gsearch": {
    "url": "http://127.0.0.1:5020"
  },
  "database": {
    "dataDir": "data",
    "settingDb": "wpseo.db"
  },
  "publishing": {
    "defaultLinkDensity": "paragraph",
    "linksPerParagraph": 3,
    "linksPerSentence": 2,
    "maxNewSlugsPerPost": 2,
    "slugWordCount": 4
  },
  "automation": {
    "defaultBatchSize": 10,
    "defaultDelaySeconds": 5,
    "maxConcurrent": 3
  }
}
```

---

## Startup Modes

### Binary Mode
```bash
wpseo-cli serve --port 8085
wpseo-cli publish --website "my-site" --type post --title "New Post"
wpseo-cli import-vars --file variables.csv --scope website --website "my-site"
```

### Daemon Mode
```bash
wpseo-cli daemon start
wpseo-cli daemon status
wpseo-cli daemon stop
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| WordPress Connector | `02-wordpress-connector.md` |
| Content Publisher | `03-content-publisher.md` |
| AI Bridge Client | `04-ai-bridge-client.md` |
| Variable System | `05-variable-system.md` |
| Split DB Schema | `06-split-db-schema.md` |
| Enum Architecture | `12-enum-architecture.md` |
