# AI Bridge CLI: FAQ Generation Go Structs

**Version:** 5.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

---

## Overview

This document defines the Go structs for FAQ generation request/response payloads. All fields follow **PascalCase** naming convention per project standards. Redundant fields (lowercase names, URL slugs) are **programmatically derived**.

---

## Request Structs

### Training Request

```go
package faq

import "time"

// FaqTrainRequest represents a request to train FAQ generation for a company
// NOTE: Company is in Title Case (e.g., "Atto Property"), slug auto-derived for file system
type FaqTrainRequest struct {
    Company        string             // "Atto Property" - auto-derives slug "atto-property"
    Website        string
    TrainingData   []FaqTrainingData  `json:",omitempty"` // Array of training sources
    Keywords       []string           `json:",omitempty"`
    Prompt         string             `json:",omitempty"` // Training instructions/focus
    CompanyProfile FaqCompanyProfile  `json:",omitempty"` // Optional - AI learns from training
    Services       []FaqService       `json:",omitempty"` // Only Name required, rest AI-learned
    Location       FaqLocation        `json:",omitempty"`
    Ctas           []FaqCta           `json:",omitempty"` // Call-to-action templates
    Variables      map[string]string  `json:",omitempty"` // {{Variable}} replacements
}

// FaqTrainingData contains a single training content source
type FaqTrainingData struct {
    Type     string `json:",omitempty"` // "text", "file", "url"
    Content  string `json:",omitempty"` // Raw text, base64 encoded file, or URL
    FileType string `json:",omitempty"` // Required when Type="file": "txt", "md", "html", "json"
}

// FaqCompanyProfile contains enriched company information for FAQ generation
// All fields optional - AI can learn from training data
type FaqCompanyProfile struct {
    Name               string   // Required: "Atto Property" (Title Case)
    Tagline            string   `json:",omitempty"` // Primary tagline
    AlternateTaglines  []string `json:",omitempty"` // Additional taglines for variation
    Description        string   `json:",omitempty"`
    Url                string   `json:",omitempty"`
    FoundedYear        string   `json:",omitempty"`
    YearsOfExperience  string   `json:",omitempty"`
    CombinedExperience string   `json:",omitempty"`
    ProjectsCompleted  string   `json:",omitempty"`
    ClientsServed      string   `json:",omitempty"`
    Certifications     []string `json:",omitempty"` // Optional - AI can infer
    Specialties        []string `json:",omitempty"` // Optional - AI can infer
}

// FaqService represents a service offering
// Only Name is required - AI learns Methods/Equipment/Benefits automatically
type FaqService struct {
    Name      string   // Required: "Carpet Cleaning" (Title Case) - auto-derives slug
    Action    string   `json:",omitempty"` // Optional: "cleaning" - AI inferred
    Methods   []string `json:",omitempty"` // Optional: AI learns from training
    Equipment string   `json:",omitempty"` // Optional: AI learns from training
    Benefits  []string `json:",omitempty"` // Optional: AI learns from training
    Result    string   `json:",omitempty"` // Optional: AI learns from training
}

// FaqLocation contains hierarchical location data
// Cities map format: { "CityName": ["Area1", "Area2", ...] }
type FaqLocation struct {
    Country string              // "Australia"
    Region  string              `json:",omitempty"` // "Victoria"
    Cities  map[string][]string `json:",omitempty"` // {"Melbourne CBD": ["Melton", "Caroline Springs"]}
}

// FaqCta represents a call-to-action template
type FaqCta struct {
    Type     string `json:",omitempty"` // "phone", "quote", "contact", "booking"
    Text     string `json:",omitempty"` // "Call us today for a free quote!"
    Url      string `json:",omitempty"` // Optional URL for CTA
    Priority int    `json:",omitempty"` // 1=primary, 2=secondary, etc.
}
```

### Generate Request

```go
// FaqGenerateRequest represents a request to generate FAQ content
type FaqGenerateRequest struct {
    Company           string               // "Atto Property" (Title Case)
    Website           string
    SessionId         string               `json:",omitempty"` // Continue existing session
    Keywords          []string             `json:",omitempty"`
    Prompt            string               `json:",omitempty"` // Modification instructions
    Content           *FaqContentInput     `json:",omitempty"` // Bulk Q&A input
    Questions         []FaqQuestionInput   `json:",omitempty"` // Individual questions
    OutputConfig      FaqOutputConfig      `json:",omitempty"`
    SeoConfig         FaqSeoConfig         `json:",omitempty"`
    IntegrationConfig FaqIntegrationConfig `json:",omitempty"`
    Ctas              []FaqCta             `json:",omitempty"` // CTAs to include in output
    AlternateTaglines []string             `json:",omitempty"` // Taglines to use in content
    Variables         map[string]string    `json:",omitempty"` // {{Variable}} replacements
}

// FaqContentInput allows bulk content input as text/file/url
type FaqContentInput struct {
    Type     string `json:",omitempty"` // "text", "file", "url"
    Data     string `json:",omitempty"` // Content or encoded file or URL
    FileType string `json:",omitempty"` // When Type="file": "txt", "md", "html", "json"
}

// FaqQuestionInput represents a question to answer
type FaqQuestionInput struct {
    Question string         `json:",omitempty"`
    Answer   string         `json:",omitempty"` // Optional existing answer to improve
    Links    []FaqLinkInput `json:",omitempty"`
}

// FaqLinkInput represents a link to include in the answer
type FaqLinkInput struct {
    Url  string `json:",omitempty"`
    Text string `json:",omitempty"`
    Type string `json:",omitempty"` // "internal", "external"
}

// FaqOutputConfig controls output format and options
type FaqOutputConfig struct {
    Format           string `json:",omitempty"` // "html", "markdown", "text", "json"
    IncludeSchema    bool   `json:",omitempty"`
    SchemaVariation  bool   `json:",omitempty"`
    EncodeHtmlInJson bool   `json:",omitempty"`
    WordLimit        int    `json:",omitempty"`
    AnswersOnly      bool   `json:",omitempty"`
    SingleAnswer     bool   `json:",omitempty"`
}

// FaqSeoConfig controls SEO generation parameters
type FaqSeoConfig struct {
    ServiceAreas      []string `json:",omitempty"`
    TransitionDensity int      `json:",omitempty"`
    KeywordMentions   int      `json:",omitempty"`
    AreaMentions      int      `json:",omitempty"`
    MaxSentenceWords  int      `json:",omitempty"`
    MaxParagraphWords int      `json:",omitempty"`
}

// FaqIntegrationConfig controls external integrations
type FaqIntegrationConfig struct {
    EnableGSearch        bool   `json:",omitempty"`
    EnableSitemapLinking bool   `json:",omitempty"`
    EnableYouTubeEmbed   bool   `json:",omitempty"`
    SitemapUrl           string `json:",omitempty"`
}
```

---

## Response Structs

### Training Response

```go
// FaqTrainResponse represents the response from training
type FaqTrainResponse struct {
    Success   bool
    SessionId string      // New session ID for this training
    Message   string
    RagStats  FaqRagStats `json:",omitempty"`
}

// FaqRagStats contains RAG ingestion statistics
type FaqRagStats struct {
    ChunksCreated   int
    TokensProcessed int
    DbPath          string
}
```

### Generate Response

```go
// FaqGenerateResponse represents the response from FAQ generation
type FaqGenerateResponse struct {
    Success     bool
    SessionId   string      // Session ID for continuation
    GeneratedAt time.Time
    Company     string
    Faqs        []FaqOutput    `json:",omitempty"`
    FullHtml    string         `json:",omitempty"`
    FullSchema  string         `json:",omitempty"`
}

// FaqOutput represents a single generated FAQ
type FaqOutput struct {
    Question string
    Answer   FaqAnswerOutput
    Schema   *FaqSchemaItem `json:",omitempty"`
    Metadata FaqMetadata    `json:",omitempty"`
}

// FaqAnswerOutput contains answer in multiple formats
type FaqAnswerOutput struct {
    Html     string
    Markdown string
    Text     string
}

// FaqSchemaItem represents the JSON-LD schema for one FAQ
// NOTE: Schema fields use lowercase per JSON-LD spec (exception to PascalCase)
type FaqSchemaItem struct {
    Type           string          `json:"@type"` // JSON-LD: special character
    Name           string
    AcceptedAnswer FaqSchemaAnswer
}

// FaqSchemaAnswer represents the answer in schema format
type FaqSchemaAnswer struct {
    Type string `json:"@type"` // JSON-LD: special character
    Text string
}

// FaqMetadata contains generation metadata
type FaqMetadata struct {
    WordCount         int
    TransitionDensity float64
    KeywordCount      int
    AreaMentions      int
    LinksUsed         int
}
```

---

## Route DB Registry

The Route DB (`data/aibridge.db`) maintains a registry of all FAQ training for exploration:

```go
// FaqCompanyRegistry stored in Route DB for exploration
type FaqCompanyRegistry struct {
    Id             string    `gorm:"primaryKey"` // Auto-generated UUID
    CompanySlug    string    `gorm:"uniqueIndex"` // "atto-property" (derived)
    CompanyName    string    // "Atto Property" (Title Case)
    Website        string
    DbPath         string    // "data/{appName}/rag/faq/atto-property.db"
    SessionCount   int
    LastTrainedAt  time.Time
    CreatedAt      time.Time
    UpdatedAt      time.Time
}

// FaqSessionRegistry stored in Route DB for session exploration
type FaqSessionRegistry struct {
    Id           string    `gorm:"primaryKey"`
    CompanySlug  string    `gorm:"index"`
    SessionId    string    `gorm:"uniqueIndex"`
    Title        string    // Session title for display
    MessageCount int
    CreatedAt    time.Time
    UpdatedAt    time.Time
}
```

---

## Internal Structs

### Database Models

```go
// FaqTrainingRecord represents a training record in Split DB
type FaqTrainingRecord struct {
    Id              string    `gorm:"primaryKey"`
    Company         string    `gorm:"index"`
    CompanySlug     string    `gorm:"index"` // Derived from Company
    Website         string
    CompanyProfile  string    `json:",omitempty"` // JSON encoded FaqCompanyProfile
    Services        string    `json:",omitempty"` // JSON encoded []FaqService
    Location        string    `json:",omitempty"` // JSON encoded FaqLocation
    Keywords        string    `json:",omitempty"` // JSON encoded []string
    Ctas            string    `json:",omitempty"` // JSON encoded []FaqCta
    Variables       string    `json:",omitempty"` // JSON encoded map[string]string
    ChunksCreated   int
    TokensProcessed int
    CreatedAt       time.Time
    UpdatedAt       time.Time
}

// FaqSession represents a chat session within company DB
type FaqSession struct {
    Id        string    `gorm:"primaryKey"`
    Company   string    `gorm:"index"`
    Title     string    // Session title for display (e.g., "Eco-friendly carpet FAQs")
    Context   string    `json:",omitempty"` // JSON encoded session context
    CreatedAt time.Time
    UpdatedAt time.Time
}

// FaqRagChunk represents a RAG chunk for FAQ content
type FaqRagChunk struct {
    Id        string    `gorm:"primaryKey"`
    Company   string    `gorm:"index"`
    SessionId string    `gorm:"index"`
    Content   string
    Embedding []float32 `gorm:"type:blob"`
    Metadata  string    `json:",omitempty"` // JSON encoded
    CreatedAt time.Time
}
```

### Derived Fields Helper

```go
// FaqDerivedFields contains programmatically generated fields
type FaqDerivedFields struct {
    NameLowercase string // Auto: strings.ToLower(Name)
    NamePlural    string // Auto: pluralize(Name)
    UrlSlug       string // Auto: slugify(Name)
}

// DeriveServiceFields generates derived fields from service name
func DeriveServiceFields(name string) FaqDerivedFields {
    return FaqDerivedFields{
        NameLowercase: strings.ToLower(name),
        NamePlural:    pluralize(extractNoun(name)),
        UrlSlug:       slugify(name),
    }
}

// DeriveLocationSlug generates URL slug from location name
func DeriveLocationSlug(name string) string {
    return slugify(name)
}

// slugify converts name to URL-safe slug
// "Carpet Cleaning" -> "carpet-cleaning"
// "Melbourne CBD" -> "melbourne-cbd"
func slugify(name string) string {
    // 1. Lowercase
    // 2. Replace spaces with hyphens
    // 3. Remove special characters
    // 4. Collapse multiple hyphens
    return strings.ToLower(strings.ReplaceAll(name, " ", "-"))
}
```

### Template Models

```go
// FaqHtmlTemplate represents an HTML template configuration
type FaqHtmlTemplate struct {
    Name      string
    Container string
    Item      string
}

// FaqSchemaTemplate represents a schema template configuration
type FaqSchemaTemplate struct {
    Name     string
    Wrapper  string
    Base     FaqSchemaTemplateFields `json:",omitempty"`
    Question FaqSchemaTemplateFields `json:",omitempty"`
}

// FaqLinkTemplate represents a link template configuration
type FaqLinkTemplate struct {
    Name     string
    Template string
}

// FaqTitlePattern represents a title attribute pattern
type FaqTitlePattern struct {
    Name    string
    Pattern string
}
```

---

## Validation Structs

```go
// FaqValidationResult represents validation outcome
type FaqValidationResult struct {
    Valid             bool
    TransitionDensity float64
    SentenceWords     int
    ParagraphWords    int
    KeywordCount      int
    AreaMentions      int
    HasHyphens        bool
    Issues            []string `json:",omitempty"`
}

// FaqContentConstraints represents content generation constraints
type FaqContentConstraints struct {
    MaxSentenceWords       int
    MaxParagraphWords      int
    MinTransitionDensity   float64
    MinKeywordMentions     int
    MinAreaMentions        int
    MaxAreaMentions        int
    SchemaParagraphs       int
    NoHyphens              bool
    NoConsecutiveSameStart bool
    AnswerFirstSentence    bool
    CompanyInFirst2        bool
}
```

---

## Error Structs

```go
// FaqError represents an FAQ module error
type FaqError struct {
    Code       int
    Name       string
    Message    string
    Details    string         `json:",omitempty"`
    Context    SeoErrorContext `json:",omitempty"`
    Retryable  bool
    HttpStatus int
    Timestamp  time.Time
}

func (e *FaqError) Error() string {
    return fmt.Sprintf("[AB-%d] %s: %s", e.Code, e.Name, e.Message)
}
```

---

## Service Interface

```go
// FaqServiceInterface defines the FAQ generation service interface
// Note: Named FaqServiceInterface to avoid conflict with FaqService struct
type FaqServiceInterface interface {
    // Training
    Train(req *FaqTrainRequest) appfault.Result[*FaqTrainResponse]

    // Generation
    Generate(req *FaqGenerateRequest) appfault.Result[*FaqGenerateResponse]
    GenerateSingle(company string, question string, sessionId string) appfault.Result[*FaqOutput]

    // Sessions
    GetSession(sessionId string) appfault.Result[*FaqSession]
    ListSessions(company string) appfault.ResultSlice[FaqSession]
    DeleteSession(sessionId string) *appfault.AppError

    // RAG
    GetTrainingInfo(company string) appfault.Result[*FaqTrainingRecord]
    ClearTraining(company string) *appfault.AppError

    // Templates
    GetHtmlTemplates() []FaqHtmlTemplate
    GetSchemaTemplates() []FaqSchemaTemplate

    // Validation
    ValidateContent(content string) *FaqValidationResult

    // Route DB Exploration (registered companies/sessions)
    ListCompanies() appfault.ResultSlice[FaqCompanyRegistry]
    GetCompany(companySlug string) appfault.Result[*FaqCompanyRegistry]
    ListCompanySessions(companySlug string) appfault.ResultSlice[FaqSessionRegistry]
}
```

---

## Usage Examples

### Training Request Example (Minimal - AI Learns)

```go
// Minimal request - AI learns Methods/Equipment/Benefits from training
req := &FaqTrainRequest{
    Company: "Atto Property", // Title Case - slug auto-derived as "atto-property"
    Website: "https://attoproperty.com.au",
    TrainingData: []FaqTrainingData{
        {
            Type:    "text",
            Content: "Company information and FAQ training content...",
        },
        {
            Type:    "url",
            Content: "https://attoproperty.com.au/about-us/",
        },
    },
    Keywords: []string{"carpet cleaning", "steam cleaning"},
    Prompt:   "Focus on eco-friendly methods and budget-conscious families",
    Services: []FaqService{
        {Name: "Carpet Cleaning"}, // Only Name required - AI learns the rest
        {Name: "Tile Cleaning"},
    },
    Location: FaqLocation{
        Country: "Australia",
        Region:  "Victoria",
        Cities: map[string][]string{
            "Melbourne CBD": {"Melton", "Caroline Springs"},
        },
    },
}

### Training Request Example (Full - Explicit Details)

```go
req := &FaqTrainRequest{
    Company: "Atto Property", // Title Case - slug auto-derived
    Website: "https://attoproperty.com.au",
    TrainingData: []FaqTrainingData{
        {Type: "text", Content: "Company information..."},
        {Type: "file", Content: "base64encodedcontent==", FileType: "md"},
    },
    Keywords: []string{"carpet cleaning", "steam cleaning", "professional cleaning"},
    Prompt:   "Emphasize eco-friendly certifications and fast turnaround times",
    CompanyProfile: FaqCompanyProfile{
        Name:              "Atto Property",
        Tagline:           "Melbourne's Trusted Cleaning Experts",
        AlternateTaglines: []string{"Your Local Cleaning Specialists", "Clean Homes, Happy Families"},
        Description:       "Full-service property cleaning company",
        Url:               "https://attoproperty.com.au",
        FoundedYear:       "2023",
        YearsOfExperience: "5",
        Certifications:    []string{"IICRC Certified", "EPA Approved"}, // Optional
        Specialties:       []string{"Eco-friendly", "Same-day service"}, // Optional
    },
    Services: []FaqService{
        {
            Name:      "Carpet Cleaning", // Auto-derives: carpet-cleaning slug
            Action:    "cleaning",        // Optional
            Methods:   []string{"steam cleaning", "shampooing"}, // Optional - AI can infer
            Equipment: "industrial extraction", // Optional
            Benefits:  []string{"sanitization", "allergen removal"}, // Optional
            Result:    "pristine floors", // Optional
        },
    },
    Location: FaqLocation{
        Country: "Australia",
        Region:  "Victoria",
        Cities: map[string][]string{
            "Melbourne CBD": {"Melton", "Caroline Springs", "Taylors Lakes"},
            "Geelong":       {"Lara", "Corio", "Belmont"},
        },
    },
    Ctas: []FaqCta{
        {Type: "phone", Text: "Call us today for a free quote!", Priority: 1},
        {Type: "quote", Text: "Get your instant estimate", Url: "/quote", Priority: 2},
    },
    Variables: map[string]string{
        "PriceRange":    "$99-$299",
        "ResponseTime":  "within 24 hours",
        "ServiceRadius": "50km",
    },
}
```

### Generate Request with Prompt Example

```go
req := &FaqGenerateRequest{
    Company:   "Atto Property", // Title Case
    Website:   "https://attoproperty.com.au",
    SessionId: "faq-sess-abc123", // Continue existing session
    Keywords:  []string{"budget carpet cleaning", "affordable cleaning"},
    Prompt:    "Rewrite with eco-friendly focus. Mention green certifications. Target young families.",
    Content: &FaqContentInput{
        Type: "text",
        Data: "Q: How to clean carpet on a budget?\nA: Use baking soda...",
    },
    OutputConfig: FaqOutputConfig{
        Format:           "json",
        IncludeSchema:    true,
        EncodeHtmlInJson: true,
        WordLimit:        180,
    },
    SeoConfig: FaqSeoConfig{
        ServiceAreas:      []string{"Melton", "Caroline Springs"},
        TransitionDensity: 40,
        KeywordMentions:   8,
        AreaMentions:      4,
    },
    Ctas: []FaqCta{
        {Type: "quote", Text: "Get your free estimate today!"},
    },
    AlternateTaglines: []string{
        "Melbourne's #1 Eco-Friendly Cleaners",
        "Clean Living, Green Solutions",
    },
    Variables: map[string]string{
        "Discount": "20% off first booking",
    },
}
```

### File Upload Training Example

```go
req := &FaqTrainRequest{
    Company: "Atto Property", // Title Case - slug "atto-property" derived
    Website: "https://attoproperty.com.au",
    TrainingData: []FaqTrainingData{
        {
            Type:     "file",
            Content:  "PGRpdiBjbGFzcz0iZmFxIj4uLi48L2Rpdj4=", // Base64 HTML
            FileType: "html",
        },
    },
    // ... rest of profile
}
```

---

## Route DB Exploration Endpoints

These endpoints allow exploring the Route DB registry:

### List Companies

**GET** `/api/v1/seo/faq`

```json
{
    "Success": true,
    "Companies": [
        {
            "CompanySlug": "atto-property",
            "CompanyName": "Atto Property",
            "Website": "https://attoproperty.com.au",
            "DbPath": "data/myapp/rag/faq/atto-property.db",
            "SessionCount": 3,
            "LastTrainedAt": "2026-02-02T10:00:00Z"
        }
    ]
}
```

### Get Company Details with Sessions

**GET** `/api/v1/seo/faq/{companySlug}`

Returns company info, training stats, and all session IDs with titles:

```json
{
    "Success": true,
    "Company": {
        "CompanySlug": "atto-property",
        "CompanyName": "Atto Property",
        "Website": "https://attoproperty.com.au",
        "DbPath": "data/myapp/rag/faq/atto-property.db"
    },
    "Training": {
        "ChunksCreated": 45,
        "TokensProcessed": 12500,
        "Services": ["Carpet Cleaning", "Tile Cleaning"],
        "Keywords": ["carpet cleaning", "steam cleaning"]
    },
    "Sessions": [
        {
            "SessionId": "faq-sess-abc123",
            "Title": "Eco-friendly carpet cleaning FAQs",
            "MessageCount": 5,
            "CreatedAt": "2026-02-01T10:00:00Z",
            "UpdatedAt": "2026-02-02T10:00:00Z"
        },
        {
            "SessionId": "faq-sess-def456",
            "Title": "Budget cleaning tips",
            "MessageCount": 3,
            "CreatedAt": "2026-02-02T08:00:00Z",
            "UpdatedAt": "2026-02-02T09:00:00Z"
        }
    ]
}
```
    "Success": true,
    "Company": {
        "CompanySlug": "atto-property",
        "CompanyName": "Atto Property",
        "Website": "https://attoproperty.com.au",
        "DbPath": "data/myapp/rag/faq/atto-property.db",
        "SessionCount": 3,
        "LastTrainedAt": "2026-02-02T10:00:00Z"
    },
    "Training": {
        "ChunksCreated": 45,
        "TokensProcessed": 12500,
        "Services": ["Carpet Cleaning", "Tile Cleaning"],
        "Keywords": ["carpet cleaning", "steam cleaning"]
    }
}
```

### List Company Sessions

**GET** `/api/v1/seo/faq/companies/{companySlug}/sessions`

```json
{
    "Success": true,
    "Sessions": [
        {
            "SessionId": "faq-sess-abc123",
            "MessageCount": 5,
            "CreatedAt": "2026-02-01T10:00:00Z",
            "UpdatedAt": "2026-02-02T10:00:00Z"
        }
    ]
}
```
