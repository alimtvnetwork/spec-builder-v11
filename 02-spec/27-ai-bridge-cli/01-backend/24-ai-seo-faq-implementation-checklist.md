# AI SEO FAQ Generation: Implementation Checklist

**Version:** 5.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  
**Parent:** [22-ai-seo-faq-generation.md](./22-ai-seo-faq-generation.md)

---

## Overview

Step-by-step implementation guide for the AI SEO FAQ Generation module with phases, dependencies, and acceptance criteria.

---

## Phase Summary

| Phase | Name | Duration | Dependencies |
|-------|------|----------|--------------|
| 1 | Core Infrastructure | 2-3 days | Split DB, Seedable Config |
| 2 | Training System | 2-3 days | Phase 1, RAG System |
| 3 | Generation Engine | 3-4 days | Phase 2 |
| 4 | Session Management | 1-2 days | Phase 1, Phase 2 |
| 5 | Route DB Exploration | 1 day | Phase 1, Phase 4 |
| 6 | Output Formatting | 2 days | Phase 3 |
| 7 | Error Handling | 1-2 days | All phases |
| 8 | Frontend Integration | 2-3 days | All phases |

---

## Phase 1: Core Infrastructure

### 1.1 Database Schema

- [ ] Create FAQ database paths in Split DB structure
  ```
  data/{appName}/rag/faq/
  └── {company-slug}.db    # Company-specific FAQ training
  ```

- [ ] Add FAQ settings to Route DB (aibridge.db)
  ```sql
  INSERT INTO Settings (Key, Value, ValueType, Source, Description) VALUES
  ('Faq.DefaultOutputFormat', 'html', 'string', 'seed', 'Default output format'),
  ('Faq.DefaultWordLimit', '180', 'int', 'seed', 'Max words per paragraph'),
  ('Faq.DefaultTransitionDensity', '40', 'int', 'seed', 'Min transition word %'),
  ('Faq.DefaultKeywordMentions', '8', 'int', 'seed', 'Min keyword mentions'),
  ('Faq.DefaultAreaMentions', '4', 'int', 'seed', 'Target area mentions');
  ```

- [ ] Create FaqCompanyRegistry table in Route DB
- [ ] Create FaqSessionRegistry table in Route DB

### 1.2 Configuration

- [ ] Add FAQ section to config.seed.json
  ```json
  {
    "Faq": {
      "DefaultOutputFormat": "html",
      "DefaultIncludeSchema": true,
      "DefaultWordLimit": 180,
      "DefaultTransitionDensity": 40,
      "DefaultKeywordMentions": 8,
      "DefaultAreaMentions": 4
    }
  }
  ```

- [ ] Implement FaqKey typed constants
- [ ] Implement settings getters (GetFaqString, GetFaqNumber, etc.)

### 1.3 Base API Routes

- [ ] Register FAQ API group: `/api/v1/seo/faq/*`
- [ ] Implement `POST /api/v1/seo/faq/train`
- [ ] Implement `POST /api/v1/seo/faq/generate`
- [ ] Add request validation middleware

### Acceptance Criteria - Phase 1
- [ ] FAQ database paths created on company training
- [ ] Settings readable from seedable config
- [ ] API routes registered and responding
- [ ] Route DB registry tables created

---

## Phase 2: Training System

### 2.1 Training Data Ingestion

- [ ] Implement TrainingData array processor
- [ ] Create content handlers by Type:
  - [ ] `text` - Direct string ingestion
  - [ ] `file` - Base64 decode + parse by FileType
  - [ ] `url` - HTTP fetch + parse

### 2.2 File Parsers

- [ ] Plain text parser (.txt) → chunks
- [ ] Markdown parser (.md) → chunks
- [ ] HTML parser (.html) → content extraction
- [ ] JSON parser (.json) → structured data

### 2.3 RAG Integration

- [ ] Chunk training data with configurable size
- [ ] Generate embeddings for chunks
- [ ] Store in company-specific Split DB
- [ ] Implement similarity search for retrieval

### 2.4 Company Profile Storage

- [ ] Store FaqCompanyProfile in training record
- [ ] Store FaqService array (only Name required)
- [ ] Store FaqLocation with Cities map
- [ ] Store CTAs and Variables

### 2.5 Programmatic Derivation

- [ ] Implement `slugify()` function
  ```go
  func slugify(name string) string {
      // "Atto Property" → "atto-property"
  }
  ```
- [ ] Implement `DeriveServiceFields()` for Name → lowercase, plural, slug
- [ ] Implement `DeriveLocationSlug()` for areas/cities

### Acceptance Criteria - Phase 2
- [ ] Training data ingested from text/file/url
- [ ] All file types parsed correctly
- [ ] RAG chunks stored with embeddings
- [ ] Company profile persisted in Split DB
- [ ] Slugs derived correctly from Title Case names

---

## Phase 3: Generation Engine

### 3.1 Context Assembly

- [ ] Load company training from Split DB
- [ ] Retrieve relevant RAG chunks by similarity
- [ ] Assemble system prompt with:
  - Company profile
  - Service details (AI-learned or provided)
  - Location context
  - CTAs and variables

### 3.2 Answer Generation

- [ ] Implement answer-first pattern
- [ ] Enforce three-paragraph structure
- [ ] Apply content constraints:
  - Max 18 words per sentence
  - Max 180 words per paragraph
  - 40%+ transition word density
  - 8+ keyword mentions
  - 3-4 area mentions
  - No hyphens (e.g., "budget friendly" not "budget-friendly")

### 3.3 Link Integration

- [ ] Internal link generation with title attributes
- [ ] GSearch integration for external sources (optional)
- [ ] Sitemap indexing for automatic internal linking (optional)
- [ ] YouTube embed integration (optional)

### 3.4 Variable Substitution

- [ ] Parse `{{Variable}}` syntax
- [ ] Substitute from Variables map
- [ ] Validate all variables resolved

### 3.5 Validation

- [ ] Implement `FaqValidationResult` checks
- [ ] Transition word density calculation
- [ ] Sentence/paragraph word count validation
- [ ] Hyphen detection and rejection
- [ ] Consecutive same-start detection

### Acceptance Criteria - Phase 3
- [ ] FAQ answers generated with correct structure
- [ ] Content constraints enforced
- [ ] Links integrated correctly
- [ ] Variables substituted
- [ ] Validation catches constraint violations

---

## Phase 4: Session Management

### 4.1 Session Creation

- [ ] Generate unique SessionId on training
- [ ] Create FaqSession record in company DB
- [ ] Register session in Route DB (FaqSessionRegistry)
- [ ] Set initial Title from prompt or auto-generate

### 4.2 Session Continuation

- [ ] Load session context from company DB
- [ ] Preserve conversation history
- [ ] Update session on new generations
- [ ] Increment MessageCount

### 4.3 Session API

- [ ] Return SessionId in train response
- [ ] Accept SessionId in generate request
- [ ] Create new session if SessionId omitted
- [ ] Implement session deletion

### Acceptance Criteria - Phase 4
- [ ] Sessions created and persisted
- [ ] Session continuation works with context
- [ ] Multiple sessions per company supported
- [ ] Sessions have editable titles

---

## Phase 5: Route DB Exploration

### 5.1 Company Registry

- [ ] Register company on first training
- [ ] Update LastTrainedAt on subsequent training
- [ ] Track SessionCount per company
- [ ] Store DbPath for direct access

### 5.2 Exploration Endpoints

- [ ] `GET /api/v1/seo/faq` - List all companies
  ```json
  {
    "Success": true,
    "Companies": [
      {
        "CompanySlug": "atto-property",
        "CompanyName": "Atto Property",
        "SessionCount": 3
      }
    ]
  }
  ```

- [ ] `GET /api/v1/seo/faq/{companySlug}` - Company + sessions
  ```json
  {
    "Success": true,
    "Company": {...},
    "Training": {...},
    "Sessions": [
      {"SessionId": "...", "Title": "...", "MessageCount": 5}
    ]
  }
  ```

### Acceptance Criteria - Phase 5
- [ ] Companies listed from Route DB
- [ ] Company details include all sessions
- [ ] Session titles and message counts accurate
- [ ] DB paths accessible for debugging

---

## Phase 6: Output Formatting

### 6.1 HTML Output

- [ ] Implement FAQ HTML template (see faq-html-spec.md)
- [ ] Details/summary accordion structure
- [ ] Icon wrapper with CSS animations
- [ ] Link title attribute patterns

### 6.2 Schema Output

- [ ] Implement JSON-LD FAQPage schema
- [ ] Schema variation support (attribute style)
- [ ] Exactly 3 paragraphs per schema answer
- [ ] HTML encoding for JSON output

### 6.3 Multiple Formats

- [ ] HTML format with schema
- [ ] Markdown format (clean, no HTML)
- [ ] Text format (plain Q&A)
- [ ] JSON format (structured with encoded HTML)

### 6.4 Full Output Assembly

- [ ] Combine multiple FAQs into single HTML block
- [ ] Combine schemas into single FAQPage
- [ ] Support AnswersOnly mode
- [ ] Support SingleAnswer mode

### Acceptance Criteria - Phase 6
- [ ] HTML output matches specification
- [ ] Schema validates against JSON-LD
- [ ] All four output formats working
- [ ] Full HTML/schema assembly correct

---

## Phase 7: Error Handling

### 7.1 Error Type Implementation

- [ ] Create `FaqError` struct
  ```go
  type FaqError struct {
      Code       int
      Name       string
      Message    string
      Details    string         `json:",omitempty"`
      Context    FaqErrorContext `json:",omitempty"`
      Retryable  bool
      HttpStatus int
      Timestamp  time.Time
  }

  // FaqErrorContext provides structured error context for FAQ operations
  type FaqErrorContext struct {
      QuestionId string `json:",omitempty"`
      Category   string `json:",omitempty"`
      Keyword    string `json:",omitempty"`
      Input      string `json:",omitempty"`
  }
  ```

- [ ] Implement error constructors for codes 9541-9553
- [ ] Add `IsRetryable()` helper function

### 7.2 Error Codes Implementation

| Code | Name | Implementation |
|------|------|----------------|
| 9541 | `FAQ_TRAINING_FAILED` | Wrap RAG ingestion errors |
| 9542 | `FAQ_COMPANY_NOT_FOUND` | Check company registry |
| 9543 | `FAQ_RAG_RETRIEVAL_FAILED` | Wrap similarity search errors |
| 9544 | `FAQ_GENERATION_FAILED` | Wrap LLM errors |
| 9545 | `FAQ_SCHEMA_INVALID` | Validate JSON-LD output |
| 9546 | `FAQ_OUTPUT_FORMAT_UNSUPPORTED` | Validate format parameter |
| 9547 | `FAQ_WORD_LIMIT_EXCEEDED` | Check paragraph length |
| 9548 | `FAQ_TRANSITION_DENSITY_LOW` | Check transition % |
| 9549 | `FAQ_GSEARCH_FAILED` | Wrap GSearch errors |
| 9550 | `FAQ_YOUTUBE_SEARCH_FAILED` | Wrap YouTube errors |
| 9551 | `FAQ_SESSION_NOT_FOUND` | Check session registry |
| 9552 | `FAQ_FILE_DECODE_FAILED` | Wrap base64/parse errors |
| 9553 | `FAQ_URL_FETCH_FAILED` | Wrap HTTP errors |

### 7.3 Retry Logic

- [ ] Implement retry for retryable errors (9541, 9543, 9544, 9549, 9550, 9553)
- [ ] Exponential backoff configuration
- [ ] Max retry limit (default 3)

### Acceptance Criteria - Phase 7
- [ ] All error codes have constructors
- [ ] Errors include helpful context
- [ ] Retry logic working for appropriate errors
- [ ] HTTP status codes mapped correctly

---

## Phase 8: Frontend Integration

### 8.1 Training UI

- [ ] Company selection/creation
- [ ] Training data input (text/file/URL)
- [ ] Service list management
- [ ] Location configuration
- [ ] CTA management

### 8.2 Generation UI

- [ ] Session selection or new session
- [ ] Keyword input
- [ ] Prompt/instruction input
- [ ] Output format selection
- [ ] Generate button with loading state

### 8.3 Session Browser

- [ ] List companies from `/api/v1/seo/faq`
- [ ] Expand company to show sessions
- [ ] Session title display and editing
- [ ] Continue session button

### 8.4 Output Display

- [ ] HTML preview with accordion
- [ ] Schema preview (formatted JSON)
- [ ] Copy buttons for each format
- [ ] Download options

### Acceptance Criteria - Phase 8
- [ ] Training workflow complete
- [ ] Generation workflow complete
- [ ] Sessions browsable and continuable
- [ ] Output viewable and copyable

---

## Testing Checklist

### Unit Tests

- [ ] Slug generation tests
- [ ] Training data parser tests
- [ ] Validation constraint tests
- [ ] Schema generation tests

### Integration Tests

- [ ] Full training flow test
- [ ] Generation with RAG context test
- [ ] Session continuation test
- [ ] Output format conversion test

### Validation Tests

- [ ] Transition word density calculation
- [ ] Word count validation
- [ ] Hyphen detection
- [ ] Schema JSON-LD validation

---

## Error Codes Reference (9541-9553)

| Code | Name | Retryable | HTTP |
|------|------|-----------|------|
| 9541 | `FAQ_TRAINING_FAILED` | Yes | 500 |
| 9542 | `FAQ_COMPANY_NOT_FOUND` | No | 404 |
| 9543 | `FAQ_RAG_RETRIEVAL_FAILED` | Yes | 500 |
| 9544 | `FAQ_GENERATION_FAILED` | Yes | 500 |
| 9545 | `FAQ_SCHEMA_INVALID` | No | 500 |
| 9546 | `FAQ_OUTPUT_FORMAT_UNSUPPORTED` | No | 400 |
| 9547 | `FAQ_WORD_LIMIT_EXCEEDED` | No | 400 |
| 9548 | `FAQ_TRANSITION_DENSITY_LOW` | No | 400 |
| 9549 | `FAQ_GSEARCH_FAILED` | Yes | 502 |
| 9550 | `FAQ_YOUTUBE_SEARCH_FAILED` | Yes | 502 |
| 9551 | `FAQ_SESSION_NOT_FOUND` | No | 404 |
| 9552 | `FAQ_FILE_DECODE_FAILED` | No | 400 |
| 9553 | `FAQ_URL_FETCH_FAILED` | Yes | 502 |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Main Specification | `./22-ai-seo-faq-generation.md` |
| Go Structs | `./23-ai-seo-faq-go-structs.md` |
| Error Codes Specification | `./16-ai-seo-error-codes.md` |
| HTML Spec | `../../data/presets/seo/faq/faq-html-spec.md` |
| Schema Spec | `../../data/presets/seo/faq/faq-schema-spec.md` |
| SEO Generate Checklist | `./15-ai-seo-implementation-checklist.md` |
