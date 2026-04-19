# GSearch FAQ Discovery & AI Overview Specification

> **Phase:** 2 of 8  
> **Status:** Active  
> **Created:** 2026-02-04  
> **Updated:** 2026-03-09  
**Version:** 1.0.0  
> **Error Codes:** 7720-7739  
> **Depends On:** `42-multi-engine-search.md` (Phase 1)  
> **Parent:** `41-business-intelligence-plan.md`

---

## 1. Overview

Automated discovery of FAQ content from search engines, extraction of Google's AI Overview (SGE) summaries, and multi-engine answer retrieval with source attribution.

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      FAQ Discovery Engine                         │
├──────────────────────────────────────────────────────────────────┤
│  Query Processor → SERP Analyzer → FAQ Extractor → Answer Merger │
└────────┬──────────────┬───────────────┬──────────────────────────┘
         │              │               │
  ┌──────▼──────┐ ┌─────▼─────┐  ┌──────▼──────┐
  │ AI Overview │ │    PAA    │  │ FAQ Schema  │
  │  Extractor  │ │ Extractor │  │  Scraper    │
  └──────┬──────┘ └─────┬─────┘  └──────┬──────┘
         │              │               │
  ┌──────▼──────────────▼───────────────▼──────┐
  │           Answer Enrichment Layer           │
  │  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │
  │  │ Google  │  │  Bing   │  │ DuckDuckGo  │ │
  │  │ Answers │  │ Answers │  │  Answers    │ │
  │  └─────────┘  └─────────┘  └─────────────┘ │
  └─────────────────────────────────────────────┘
```

---

## 3. CLI Interface

### 3.1 Basic Commands

```bash
# Discover FAQs for a topic
gsearch faq "plumber services NYC"

# Include AI Overview extraction
gsearch faq "plumber services NYC" --with-ai-overview

# Multi-engine FAQ discovery
gsearch faq "keyword" --engines google,bing

# Analyze source URLs from AI Overview
gsearch faq "keyword" --analyze-sources

# Get answers from multiple engines
gsearch faq "keyword" --enrich-answers
```

### 3.2 Advanced Options

```bash
# Limit number of FAQs
gsearch faq "keyword" --limit 20

# Filter by question type
gsearch faq "keyword" --type what,how,why,where,when,who

# Output formats
gsearch faq "keyword" --output json
gsearch faq "keyword" --output markdown
gsearch faq "keyword" --output csv

# Caching
gsearch faq "keyword" --cache-days 7
gsearch faq "keyword" --force

# Deep extraction (follow PAA expansions)
gsearch faq "keyword" --depth 3

# Industry context for better extraction
gsearch faq "keyword" --industry plumbing --location "New York"
```

---

## 4. Data Structures

### 4.1 Core Types

```go
// FaqDiscoveryRequest represents a FAQ discovery request
// NOTE: All fields use PascalCase with omitempty-only JSON tags per project standard
type FaqDiscoveryRequest struct {
    Query           string            `json:",omitempty"`
    Engines         []string          `json:",omitempty"` // ["google", "bing"]
    WithAiOverview  bool              `json:",omitempty"`
    AnalyzeSources  bool              `json:",omitempty"`
    EnrichAnswers   bool              `json:",omitempty"`
    Limit           int               `json:",omitempty"` // Max FAQs to return
    Depth           int               `json:",omitempty"` // PAA expansion depth (1-5)
    QuestionTypes   []QuestionType    `json:",omitempty"` // what, how, why, etc.
    Industry        string            `json:",omitempty"`
    Location        string            `json:",omitempty"`
    CacheDays       int               `json:",omitempty"`
    ForceRefresh    bool              `json:",omitempty"`
}

type QuestionType string

const (
    QuestionWhat  QuestionType = "what"
    QuestionHow   QuestionType = "how"
    QuestionWhy   QuestionType = "why"
    QuestionWhere QuestionType = "where"
    QuestionWhen  QuestionType = "when"
    QuestionWho   QuestionType = "who"
    QuestionIs    QuestionType = "is"
    QuestionCan   QuestionType = "can"
    QuestionDoes  QuestionType = "does"
)

// FaqDiscoveryResponse wraps discovery results
type FaqDiscoveryResponse struct {
    Query           string              `json:",omitempty"`
    AiOverview      *AiOverview         `json:",omitempty"`
    FaqItems        []FaqItem           `json:",omitempty"`
    Sources         []SourceAnalysis    `json:",omitempty"`
    EngineStats     map[string]Stats    `json:",omitempty"`
    FromCache       bool                `json:",omitempty"`
    CapturedAt      time.Time           `json:",omitempty"`
}
```

### 4.2 AI Overview Structure

```go
// AiOverview represents extracted SGE/AI Overview content
type AiOverview struct {
    Available       bool              `json:",omitempty"`
    Summary         string            `json:",omitempty"`
    BulletPoints    []string          `json:",omitempty"`
    CitedUrls       []CitedUrl        `json:",omitempty"`
    FollowUpQueries []string          `json:",omitempty"`
    GroupedFollowUps []FollowUpGroup  `json:",omitempty"` // Grouped by topic
    Confidence      float64           `json:",omitempty"` // 0.0-1.0 extraction confidence
    HasDisclaimer   bool              `json:",omitempty"` // "AI-generated" disclaimer
    ResponseType    string            `json:",omitempty"` // summary, list, comparison
    ExtractedAt     time.Time         `json:",omitempty"`
}

// FollowUpGroup represents topic-grouped follow-up questions
type FollowUpGroup struct {
    Topic     string   `json:",omitempty"`
    Questions []string `json:",omitempty"`
}

// CitedUrl represents a source cited in AI Overview
type CitedUrl struct {
    Url             string            `json:",omitempty"`
    Title           string            `json:",omitempty"`
    Snippet         string            `json:",omitempty"`
    Position        int               `json:",omitempty"` // Order in AI Overview
    Domain          string            `json:",omitempty"`
    Favicon         string            `json:",omitempty"`
    PublishDate     string            `json:",omitempty"` // When source was published
    Author          string            `json:",omitempty"` // Source author if available
    ContentType     string            `json:",omitempty"` // article, product, service
}
```

### 4.3 FAQ Structure

```go
// FaqItem represents a single FAQ entry
type FaqItem struct {
    Id              string            `json:",omitempty"` // Hash of question
    Question        string            `json:",omitempty"`
    QuestionType    QuestionType      `json:",omitempty"`
    Answers         []FaqAnswer       `json:",omitempty"`
    BestAnswer      *FaqAnswer        `json:",omitempty"`
    Sources         []string          `json:",omitempty"` // Engine names
    PaaRank         int               `json:",omitempty"` // Position in PAA (0 if from schema)
    Origin          FaqOrigin         `json:",omitempty"` // paa, schema, ai_overview
    RelatedFaqs     []string          `json:",omitempty"` // IDs of related
    CapturedAt      time.Time         `json:",omitempty"`
}

type FaqOrigin string

const (
    OriginPaa        FaqOrigin = "paa"          // People Also Ask
    OriginSchema     FaqOrigin = "schema"       // FAQPage schema
    OriginAiOverview FaqOrigin = "ai_overview"  // From AI Overview follow-ups
    OriginRelated    FaqOrigin = "related"      // Related searches
)

// FaqAnswer represents an answer from a specific source
type FaqAnswer struct {
    Text            string            `json:",omitempty"`
    Html            string            `json:",omitempty"`
    SourceUrl       string            `json:",omitempty"`
    SourceDomain    string            `json:",omitempty"`
    Engine          string            `json:",omitempty"` // google, bing, etc.
    Confidence      float64           `json:",omitempty"` // Answer quality score
    WordCount       int               `json:",omitempty"`
    HasList         bool              `json:",omitempty"` // Contains ul/ol
    HasSteps        bool              `json:",omitempty"` // Step-by-step format
    ExtractedAt     time.Time         `json:",omitempty"`
}
```

### 4.4 Source Analysis

```go
// SourceAnalysis represents analyzed source URL data
type SourceAnalysis struct {
    Url             string            `json:",omitempty"`
    Domain          string            `json:",omitempty"`
    Title           string            `json:",omitempty"`
    ContentType     string            `json:",omitempty"` // article, product, service
    WordCount       int               `json:",omitempty"`
    HeadingCount    int               `json:",omitempty"`
    FaqCount        int               `json:",omitempty"` // FAQs on page
    SchemaTypes     []string          `json:",omitempty"` // JSON-LD schemas found
    AuthorityScore  float64           `json:",omitempty"` // From Phase 1 authority
    LastModified    *time.Time        `json:",omitempty"`
    AnalyzedAt      time.Time         `json:",omitempty"`
}
```

---

## 5. Extraction Engines

### 5.1 AI Overview Extractor

```go
type AiOverviewExtractor struct {
    scraper     *StealthScraper
    parser      *goquery.Document
}

// 2026 SGE Container Selectors (updated February 2026)
// Selectors are ordered by specificity and reliability
// Google frequently updates these - check monthly for changes
var sgeContainerSelectors2026 = []SelectorConfig{
    // Primary 2026 AI Overview containers (highest priority)
    {Selector: "div[data-sgrd='true']", Priority: 1, Description: "SGE Response Data container"},
    {Selector: "div[jsname='Cpkphb']", Priority: 1, Description: "AI Overview primary container"},
    {Selector: "div[data-attrid='SGEAnswer']", Priority: 1, Description: "SGE Answer block"},
    {Selector: "div.kc-header-container[data-lk]", Priority: 2, Description: "Knowledge card with AI"},
    
    // Secondary 2026 containers
    {Selector: "div[data-hveid][data-ved] > div[data-sgrd]", Priority: 2, Description: "Nested SGE container"},
    {Selector: "div.bSaLhf", Priority: 3, Description: "AI Overview summary block"},
    {Selector: "div[jscontroller='LbZQod']", Priority: 3, Description: "Interactive AI container"},
    
    // Legacy containers (still functional as of Feb 2026)
    {Selector: "div[data-attrid='wa:/description']", Priority: 4, Description: "Legacy description"},
    {Selector: "div.kp-blk.c2xzTb", Priority: 4, Description: "Knowledge panel block"},
    {Selector: "div[data-md]", Priority: 4, Description: "Markdown container"},
    {Selector: "div.ULSxyf", Priority: 5, Description: "Universal snippet container"},
    
    // Fallback containers
    {Selector: "div[data-hveid] > div > div > span.hgKElc", Priority: 6, Description: "Featured snippet span"},
}

// SelectorConfig defines a selector with metadata
type SelectorConfig struct {
    Selector    string
    Priority    int
    Description string
}

// 2026 SGE Content Selectors (for extracting content within containers)
var sgeContentSelectors2026 = struct {
    Summary      []string
    BulletPoints []string
    Citations    []string
    FollowUps    []string
    Disclaimer   []string
}{
    Summary: []string{
        "div[data-content-feature='1'] span",
        "div.wDYxhc span",
        "div.hgKElc span",
        "div[data-sgrd] > div > span",
    },
    BulletPoints: []string{
        "ul.i8Z77e li",
        "div[data-sgrd] ul li",
        "ol.X5LH0c li",
        "div.wDYxhc ul li",
    },
    Citations: []string{
        "a.cz3goc[data-ved]",
        "div[data-sgrd] a[href][data-ved]",
        "a.ruhjFe",
        "cite.iUh30",
    },
    FollowUps: []string{
        "div[jsname='yEVEwb'] div[role='button']",
        "div.oIk2Cb div[role='button']",
        "div[data-sgrd] div[jsaction*='follow']",
    },
    Disclaimer: []string{
        "div[data-attrid*='disclaimer']",
        "span.CtCigf",
        "div[jsname='Cpkphb'] span.hgKElc:contains('AI-generated')",
    },
}

func (e *AiOverviewExtractor) Extract(context stdctx.Context, query string) apperror.Result[AiOverview] {
    // 1. Perform Google search with AI Overview enabled
    page := e.scraper.NavigateGoogle(query)
    
    // 2. Detect AI Overview presence using 2026 selectors
    aiBlock, confidence := e.findAiBlock2026(page)
    if aiBlock == nil {
        return apperror.Ok(AiOverview{Available: false})
    }
    
    // 3. Determine response type
    responseType := e.detectResponseType(aiBlock)
    
    // 4. Extract summary text
    summary := e.extractSummary2026(aiBlock)
    
    // 5. Extract bullet points if present
    bullets := e.extractBullets2026(aiBlock)
    
    // 6. Extract cited sources with enhanced metadata
    citedUrls := e.extractCitedUrls2026(aiBlock)
    
    // 7. Extract follow-up queries (grouped by topic)
    followUps, groupedFollowUps := e.extractFollowUps2026(page)
    
    // 8. Check for AI disclaimer
    hasDisclaimer := e.hasAiDisclaimer(aiBlock)
    
    return apperror.Ok(AiOverview{
        Available:        true,
        Summary:          summary,
        BulletPoints:     bullets,
        CitedUrls:        citedUrls,
        FollowUpQueries:  followUps,
        GroupedFollowUps: groupedFollowUps,
        Confidence:       confidence,
        HasDisclaimer:    hasDisclaimer,
        ResponseType:     responseType,
        ExtractedAt:      time.Now(),
    })
}

// findAiBlock2026 uses prioritized 2026 selectors with confidence scoring
func (e *AiOverviewExtractor) findAiBlock2026(page *rod.Page) (*goquery.Selection, float64) {
    // Try selectors in priority order
    for _, cfg := range sgeContainerSelectors2026 {
        elements, err := page.Elements(cfg.Selector)
        if err != nil || len(elements) == 0 {
            continue
        }
        
        // Found a match - calculate confidence based on priority
        confidence := 1.0 - (float64(cfg.Priority-1) * 0.15)
        if confidence < 0.4 {
            confidence = 0.4
        }
        
        return e.parseElement(elements[0]), confidence
    }
    
    // Fallback: heuristic detection
    heuristicBlock := e.heuristicDetect2026(page)
    if heuristicBlock != nil {
        return heuristicBlock, 0.35 // Lower confidence for heuristic
    }
    
    return nil, 0
}

// heuristicDetect2026 uses content-based detection when selectors fail
func (e *AiOverviewExtractor) heuristicDetect2026(page *rod.Page) *goquery.Selection {
    // Look for large text blocks near top with:
    // 1. Multiple citation links
    // 2. Specific layout patterns
    // 3. AI-related disclaimer text
    
    candidates := page.MustElements("div[data-hveid]")
    for _, el := range candidates {
        html, _ := el.HTML()
        
        // Check for AI Overview indicators
        hasMultipleCitations := strings.Count(html, "data-ved") >= 3
        hasAiIndicator := strings.Contains(html, "AI-generated") || 
                          strings.Contains(html, "sgrd") ||
                          strings.Contains(html, "Cpkphb")
        isNearTop := e.isNearPageTop(el)
        
        if hasMultipleCitations && (hasAiIndicator || isNearTop) {
            return e.parseElement(el)
        }
    }
    
    return nil
}

// detectResponseType identifies the AI Overview format
func (e *AiOverviewExtractor) detectResponseType(block *goquery.Selection) string {
    html, _ := block.Html()
    
    switch {
    case strings.Contains(html, "<ul") || strings.Contains(html, "<ol"):
        return "list"
    case strings.Contains(html, "<table"):
        return "comparison"
    case strings.Contains(html, "vs") || strings.Contains(html, "versus"):
        return "comparison"
    default:
        return "summary"
    }
}
```

### 5.2 People Also Ask (PAA) Extractor

```go
type PaaExtractor struct {
    scraper *StealthScraper
    depth   int
}

func (e *PaaExtractor) Extract(context stdctx.Context, query string) apperror.Result[[]Faq] {
    faqs := []Faq{}
    seen := make(map[string]bool)
    
    // Initial extraction
    initialFaqs := e.extractPaaFromSerp(context, query)
    faqs = append(faqs, initialFaqs...)
    
    // Recursive expansion based on depth
    if e.depth > 1 {
        for level := 1; level < e.depth; level++ {
            newFaqs := []Faq{}
            
            for _, faq := range faqs {
                if seen[faq.Question] {
                    continue
                }

                seen[faq.Question] = true
                
                // Click to expand PAA and get related questions
                relatedFaqs := e.expandPaa(context, faq.Question)
                newFaqs = append(newFaqs, relatedFaqs...)
            }
            
            faqs = append(faqs, newFaqs...)
        }
    }
    
    return apperror.Ok(e.deduplicateFaqs(faqs))
}

// 2026 PAA Container Selectors (updated February 2026)
var paaContainerSelectors2026 = []SelectorConfig{
    // Primary 2026 PAA containers
    {Selector: "div[jsname='Cpkphb'] div.related-question-pair", Priority: 1, Description: "PAA in AI container"},
    {Selector: "div[data-initq] div.wWOJcd", Priority: 1, Description: "Interactive PAA"},
    {Selector: "div[jsname='yEVEwb'] div[role='button']", Priority: 1, Description: "PAA button format"},
    
    // Standard PAA containers
    {Selector: "div.related-question-pair", Priority: 2, Description: "Classic PAA pair"},
    {Selector: "div[jsname='N760b']", Priority: 2, Description: "Named PAA container"},
    {Selector: "div[data-sgrd] div[role='button']", Priority: 2, Description: "SGE-integrated PAA"},
    
    // Legacy selectors
    {Selector: "div.wWOJcd", Priority: 3, Description: "Legacy PAA class"},
    {Selector: "div[data-q]", Priority: 3, Description: "Data-question container"},
}

// 2026 PAA Answer Selectors
var paaAnswerSelectors2026 = []string{
    "div.wDYxhc[data-attrid]",
    "div.wDYxhc",
    "div[data-md] span",
    "div.hgKElc",
}

func (e *PaaExtractor) extractPaaFromSerp(context stdctx.Context, query string) []FaqItem {
    page := e.scraper.NavigateGoogle(query)
    
    faqs := []FaqItem{}
    rank := 1
    
    // Try 2026 selectors in priority order
    for _, cfg := range paaContainerSelectors2026 {
        elements, err := page.Elements(cfg.Selector)
        if err != nil || len(elements) == 0 {
            continue
        }
        
        for _, el := range elements {
            question := el.MustText()
            if question == "" {
                continue
            }
            
            // Click to expand and get answer
            el.MustClick()
            time.Sleep(500 * time.Millisecond)
            
            // Try multiple answer selectors
            var answerText, answerHtml string
            for _, answerSel := range paaAnswerSelectors2026 {
                if answerEl, err := el.Element(answerSel); err == nil && answerEl != nil {
                    answerText = answerEl.MustText()
                    answerHtml, _ = answerEl.HTML()
                    break
                }
            }
            
            sourceUrl := e.extractSourceUrl(el)
            
            faqs = append(faqs, FaqItem{
                Id:           hashQuestion(question),
                Question:     question,
                QuestionType: classifyQuestion(question),
                Answers: []FaqAnswer{{
                    Text:         answerText,
                    Html:         answerHtml,
                    SourceUrl:    sourceUrl,
                    SourceDomain: extractDomain(sourceUrl),
                    Engine:       "google",
                    Confidence:   0.9,
                }},
                Sources:    []string{"google"},
                PaaRank:    rank,
                Origin:     OriginPaa,
                CapturedAt: time.Now(),
            })
            
            rank++
        }
        
        if len(faqs) > 0 {
            break // Found PAA, stop trying selectors
        }
    }
    
    return faqs
}
```

### 5.3 FAQ Schema Extractor

```go
type FAQSchemaExtractor struct {
    httpClient *http.Client
}

func (e *FAQSchemaExtractor) ExtractFromUrl(context stdctx.Context, targetUrl string) apperror.Result[[]FAQ] {
    // Fetch page
    resp, err := e.httpClient.Get(targetUrl)
    if err != nil {
        return apperror.Fail[[]FAQ](apperror.Wrap(err, "fetch page"))
    }
    defer resp.Body.Close()
    
    doc, err := goquery.NewDocumentFromReader(resp.Body)
    if err != nil {
        return apperror.Fail[[]FAQ](apperror.Wrap(err, "parse document"))
    }
    
    faqs := []FAQ{}
    
    // Extract JSON-LD FAQPage schema
    // ALLOWED: dynamic JSON-LD schema — structure defined by external schema.org spec
    doc.Find("script[type='application/ld+json']").Each(func(i int, s *goquery.Selection) {
        var schema map[string]interface{}
        if err := json.Unmarshal([]byte(s.Text()), &schema); err != nil {
            return
        }
        
        // Check for FAQPage type
        // EXEMPTED: external JSON-LD schema — dynamic structure from third-party HTML (§7.2)
        if schemaType, ok := schema["@type"].(string); ok && schemaType == "FAQPage" {
            if mainEntity, ok := schema["mainEntity"].([]interface{}); ok {
                for _, item := range mainEntity {
                    if q, ok := item.(map[string]interface{}); ok {
                        question, _ := q["name"].(string)
                        acceptedAnswer, _ := q["acceptedAnswer"].(map[string]interface{})
                        answerText, _ := acceptedAnswer["text"].(string)
                        
                        faqs = append(faqs, FAQ{
                            Id:           hashQuestion(question),
                            Question:     question,
                            QuestionType: classifyQuestion(question),
                            Answers: []Answer{{
                                Text:         answerText,
                                SourceUrl:    targetUrl,
                                SourceDomain: extractDomain(targetUrl),
                                Engine:       "schema",
                                Confidence:   1.0, // Schema is authoritative
                            }},
                            Origin: OriginSchema,
                        })
                    }
                }
            }
        }
    })
    
    // Also extract semantic FAQ patterns in HTML
    faqs = append(faqs, e.extractSemanticFaqs(doc, targetUrl)...)
    
    return apperror.OK(faqs)
}

func (e *FaqSchemaExtractor) extractSemanticFaqs(doc *goquery.Document, url string) []Faq {
    faqs := []Faq{}
    
    // Pattern 1: <details><summary>Question</summary>Answer</details>
    doc.Find("details").Each(func(i int, s *goquery.Selection) {
        question := s.Find("summary").Text()
        answer := s.Clone().Children().Remove().End().Text()
        
        if question != "" && answer != "" {
            faqs = append(faqs, e.createFaq(question, answer, url))
        }
    })
    
    // Pattern 2: <dt>Question</dt><dd>Answer</dd>
    doc.Find("dl").Each(func(i int, dl *goquery.Selection) {
        dl.Find("dt").Each(func(j int, dt *goquery.Selection) {
            question := dt.Text()
            answer := dt.Next().Text() // Assumes next sibling is dd
            
            if question != "" && answer != "" {
                faqs = append(faqs, e.createFaq(question, answer, url))
            }
        })
    })
    
    // Pattern 3: Sections with FAQ-like headings
    faqPatterns := []string{
        "h2:contains('FAQ')",
        "h2:contains('Frequently Asked')",
        "h3:contains('FAQ')",
        ".faq-section",
        "#faq",
    }
    
    for _, pattern := range faqPatterns {
        doc.Find(pattern).Each(func(i int, s *goquery.Selection) {
            // Extract Q&A pairs from the section
            section := s.Parent()
            faqs = append(faqs, e.extractQAPairs(section, url)...)
        })
    }
    
    return faqs
}
```

### 5.4 Multi-Engine Answer Enrichment

```go
type AnswerEnricher struct {
    searchOrchestrator *SearchOrchestrator
    engines            []string
}

func (e *AnswerEnricher) EnrichFaqs(context stdctx.Context, faqs []Faq) apperror.Result[[]Faq] {
    enriched := make([]Faq, len(faqs))
    copy(enriched, faqs)
    
    var wg sync.WaitGroup
    var mu sync.Mutex
    
    for i, faq := range enriched {
        wg.Add(1)
        go func(idx int, f FAQ) {
            defer wg.Done()
            
            // Search for this question across engines
            resp, err := e.searchOrchestrator.Search(context, SearchRequest{
                Query:   f.Question,
                Engines: e.engines,
                Limit:   5,
            })
            if err != nil {
                return
            }
            
            // Extract answers from search results
            newAnswers := e.extractAnswersFromResults(context, f.Question, resp.Results)
            
            mu.Lock()
            enriched[idx].Answers = append(enriched[idx].Answers, newAnswers...)
            enriched[idx].Sources = e.mergeEngines(enriched[idx].Sources, e.engines)
            enriched[idx].BestAnswer = e.selectBestAnswer(enriched[idx].Answers)
            mu.Unlock()
        }(i, faq)
    }
    
    wg.Wait()
    return apperror.OK(enriched)
}

func (e *AnswerEnricher) selectBestAnswer(answers []Answer) *Answer {
    if len(answers) == 0 {
        return nil
    }
    
    // Score each answer
    type scoredAnswer struct {
        answer Answer
        score  float64
    }
    
    scored := make([]scoredAnswer, len(answers))
    for i, a := range answers {
        score := 0.0
        
        // Base confidence
        score += a.Confidence * 0.4
        
        // Prefer moderate length (50-300 words)
        if a.WordCount >= 50 && a.WordCount <= 300 {
            score += 0.2
        } else if a.WordCount > 300 {
            score += 0.1
        }
        
        // Bonus for structured content
        if a.HasList {
            score += 0.1
        }
        if a.HasSteps {
            score += 0.15
        }
        
        // Source authority bonus
        if isAuthoritative(a.SourceDomain) {
            score += 0.15
        }
        
        scored[i] = scoredAnswer{answer: a, score: score}
    }
    
    // Sort by score descending
    sort.Slice(scored, func(i, j int) bool {
        return scored[i].score > scored[j].score
    })
    
    return &scored[0].answer
}
```

---

## 6. Question Classification

```go
var questionPatterns = map[QuestionType]*regexp.Regexp{
    QuestionWhat:  regexp.MustCompile(`(?i)^what\s`),
    QuestionHow:   regexp.MustCompile(`(?i)^how\s`),
    QuestionWhy:   regexp.MustCompile(`(?i)^why\s`),
    QuestionWhere: regexp.MustCompile(`(?i)^where\s`),
    QuestionWhen:  regexp.MustCompile(`(?i)^when\s`),
    QuestionWho:   regexp.MustCompile(`(?i)^who\s`),
    QuestionIs:    regexp.MustCompile(`(?i)^(is|are|am)\s`),
    QuestionCan:   regexp.MustCompile(`(?i)^(can|could)\s`),
    QuestionDoes:  regexp.MustCompile(`(?i)^(do|does|did)\s`),
}

func classifyQuestion(question string) QuestionType {
    normalized := strings.TrimSpace(question)
    
    for qType, pattern := range questionPatterns {
        if pattern.MatchString(normalized) {
            return qType
        }
    }
    
    return QuestionWhat // Default
}

// Filter FAQs by question types
func filterByType(faqs []FAQ, types []QuestionType) []FAQ {
    if len(types) == 0 {
        return faqs
    }
    
    typeSet := make(map[QuestionType]bool)
    for _, t := range types {
        typeSet[t] = true
    }
    
    filtered := []FAQ{}
    for _, faq := range faqs {
        if typeSet[faq.QuestionType] {
            filtered = append(filtered, faq)
        }
    }
    
    return filtered
}
```

---

## 7. Caching

### 7.1 Database Schema

```sql
-- Root DB: data/{appName}/rag/faq/registry.db
CREATE TABLE FAQQueries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_hash TEXT UNIQUE NOT NULL,
    query_raw TEXT NOT NULL,
    engines TEXT NOT NULL,                    -- JSON array
    with_ai_overview BOOLEAN DEFAULT FALSE,
    faq_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME,
    access_count INTEGER DEFAULT 0
);

CREATE TABLE AIOverviewCache (
    query_hash TEXT PRIMARY KEY,
    available BOOLEAN NOT NULL,
    summary TEXT,
    bullet_points TEXT,                       -- JSON array
    cited_urls TEXT,                          -- JSON array
    follow_up_queries TEXT,                   -- JSON array
    confidence REAL,
    captured_at DATETIME,
    ttl_expires DATETIME NOT NULL
);

-- Session DB: data/{appName}/rag/faq/cache/{query-hash}.db
CREATE TABLE FAQs (
    id TEXT PRIMARY KEY,                      -- Hash of question
    question TEXT NOT NULL,
    question_type TEXT NOT NULL,
    paa_rank INTEGER DEFAULT 0,
    origin TEXT NOT NULL,                     -- paa, schema, ai_overview
    sources TEXT NOT NULL,                    -- JSON array of engine names
    captured_at DATETIME,
    ttl_expires DATETIME NOT NULL
);

CREATE TABLE Answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faq_id TEXT NOT NULL,
    text TEXT NOT NULL,
    html TEXT,
    source_url TEXT,
    source_domain TEXT,
    engine TEXT NOT NULL,
    confidence REAL,
    word_count INTEGER,
    has_list BOOLEAN DEFAULT FALSE,
    has_steps BOOLEAN DEFAULT FALSE,
    extracted_at DATETIME,
    FOREIGN KEY (faq_id) REFERENCES FAQs(id)
);

CREATE INDEX IdxFaqsType ON FAQs(question_type);
CREATE INDEX IdxFaqsOrigin ON FAQs(origin);
CREATE INDEX IdxAnswersFaq ON Answers(faq_id);
CREATE INDEX IdxAnswersEngine ON Answers(engine);
```

### 7.2 Cache Configuration

```yaml
# config/gsearch.seed.yaml
faq:
  cache:
    ttl_days: 7
    ai_overview_ttl_days: 3     # AI Overview changes frequently
    max_queries: 10000
    cleanup_interval: 24h
    
  extraction:
    paa_depth: 2                # Default PAA expansion depth
    max_faqs_per_query: 50
    answer_timeout_seconds: 10
    
  enrichment:
    enabled: true
    engines: ["google", "bing"]
    max_answers_per_faq: 5
```

---

## 8. Error Handling

### 8.1 Error Codes (7720-7739)

> **Note:** Aligned with consolidated registry `50-bi-error-codes.md`

| Code | Constant | Description |
|------|----------|-------------|
| 7720 | `ErrFaqQueryEmpty` | FAQ query is empty |
| 7721 | `ErrFaqNoResults` | No FAQ/PAA results found |
| 7722 | `ErrFaqPaaExpansionFailed` | PAA expansion failed |
| 7723 | `ErrFaqPaaDepthExceeded` | Maximum PAA depth exceeded (5) |
| 7724 | `ErrFaqSchemaNotFound` | No FAQ schema found on page |
| 7725 | `ErrFaqSchemaParseFailed` | Failed to parse FAQ JSON-LD |
| 7726 | `ErrFaqSchemaInvalid` | Invalid FAQ schema structure |
| 7727 | `ErrFaqAiOverviewNotFound` | AI Overview not present in SERP |
| 7728 | `ErrFaqAiOverviewParseFailed` | Failed to parse AI Overview |
| 7729 | `ErrFaqSourceNotAccessible` | FAQ source URL not accessible |
| 7730 | `ErrFaqEnrichmentFailed` | Answer enrichment failed |
| 7731 | `ErrFaqAnswerEmpty` | Extracted answer is empty |
| 7732 | `ErrFaqQuestionDuplicate` | Duplicate question detected |
| 7733 | `ErrFaqExportFailed` | FAQ export failed |
| 7734 | `ErrFaqUrlInvalid` | Invalid URL for schema extraction |
| 7735 | `ErrFaqRateLimited` | Too many FAQ requests |
| 7736 | `ErrFaqCacheFailed` | Failed to cache FAQ results |
| 7737-7739 | Reserved | Reserved for future use |

---

## 9. API Endpoints

> **Note:** Aligned with Phase 7 REST API standard (`48-unified-rest-api.md`)

### 9.1 Discover FAQs

```
POST /api/v1/bi/faq/discover
Content-Type: application/json
X-API-Key: <api_key>

{
  "Query": "plumber services NYC",
  "Engines": ["google", "bing"],
  "WithAiOverview": true,
  "AnalyzeSources": true,
  "EnrichAnswers": true,
  "Limit": 20,
  "Depth": 2,
  "QuestionTypes": ["what", "how", "why"],
  "Industry": "plumbing",
  "Location": "New York, NY"
}
```

### 9.2 Expand PAA Questions

```
POST /api/v1/bi/faq/expand
Content-Type: application/json
X-API-Key: <api_key>

{
  "Questions": ["How much does a plumber cost?", "What does a plumber do?"],
  "Depth": 2
}
```

### 9.3 Extract Schema from URL

```
POST /api/v1/bi/faq/extract
Content-Type: application/json
X-API-Key: <api_key>

{
  "Url": "https://example.com/faq"
}
```

### 9.4 Response Format (ResponseEnvelope)

```json
{
  "Success": true,
  "Data": {
    "Query": "plumber services NYC",
    "AiOverview": {
      "Available": true,
      "Summary": "Plumber services in NYC typically cost between $150-$500 for common repairs. Most plumbers offer 24/7 emergency services and can handle...",
      "BulletPoints": [
        "Average cost: $150-$500 for common repairs",
        "Emergency services available 24/7",
        "Licensed plumbers required in NYC"
      ],
      "CitedUrls": [
        {
          "Url": "https://example.com/nyc-plumber-guide",
          "Title": "NYC Plumber Cost Guide 2026",
          "Position": 1,
          "Domain": "example.com"
        }
      ],
      "FollowUpQueries": [
        "How much does emergency plumber cost in NYC?",
        "Best rated plumbers in Manhattan"
      ],
      "Confidence": 0.92,
      "HasDisclaimer": false,
      "ResponseType": "summary"
    },
    "FaqItems": [
      {
        "Id": "a1b2c3d4",
        "Question": "How much does a plumber cost in NYC?",
        "QuestionType": "how",
        "Answers": [
          {
            "Text": "The average cost for a plumber in NYC ranges from $150 to $500...",
            "SourceUrl": "https://example.com/plumber-costs",
            "SourceDomain": "example.com",
            "Engine": "google",
            "Confidence": 0.95,
            "WordCount": 87,
            "HasList": true
          },
          {
            "Text": "NYC plumbers typically charge between $100-$300 per hour...",
            "SourceUrl": "https://bing-source.com/nyc-plumbers",
            "Engine": "bing",
            "Confidence": 0.88,
            "WordCount": 65
          }
        ],
        "BestAnswer": {
          "Text": "The average cost for a plumber in NYC ranges from $150 to $500...",
          "SourceUrl": "https://example.com/plumber-costs",
          "Engine": "google",
          "Confidence": 0.95
        },
        "Sources": ["google", "bing"],
        "PaaRank": 1,
        "Origin": "paa"
      }
    ],
    "Sources": [
      {
        "Url": "https://example.com/nyc-plumber-guide",
        "Domain": "example.com",
        "Title": "NYC Plumber Cost Guide 2026",
        "ContentType": "article",
        "WordCount": 2450,
        "HeadingCount": 12,
        "FaqCount": 8,
        "SchemaTypes": ["Article", "FAQPage"],
        "AuthorityScore": 0.87
      }
    ],
    "EngineStats": {
      "google": {
        "FaqCount": 12,
        "AiOverviewFound": true,
        "ExtractionTimeMs": 1234
      },
      "bing": {
        "FaqCount": 8,
        "AiOverviewFound": false,
        "ExtractionTimeMs": 987
      }
    },
    "FromCache": false,
    "CapturedAt": "2026-02-04T10:30:00Z"
  },
  "Meta": {
    "RequestId": "req_abc123",
    "Timestamp": "2026-02-04T10:30:00Z",
    "Duration": 2500,
    "Version": "1.0.0"
  },
  "Cache": {
    "Hit": false,
    "Source": "fresh",
    "TtlDays": 14
  }
}
```

---

## 10. Integration with SEO Module

### 10.1 FAQ Generation Pipeline

```go
// FaqGenerationBridge bridges FAQ Discovery and AI SEO FAQ Generator
type FaqGenerationBridge struct {
    discoveryEngine *FaqDiscoveryEngine
    seoGenerator    *SeoFaqGenerator
}

func (b *FaqGenerationBridge) GenerateSeoFaqs(context stdctx.Context, req SeoFaqRequest) apperror.Result[*SeoFaqResponse] {
    // 1. Discover FAQs from search engines
    discoveryResult := b.discoveryEngine.Discover(context, FaqDiscoveryRequest{
        Query:          req.Keywords,
        Engines:        []string{"google", "bing"},
        WithAiOverview: true,
        EnrichAnswers:  true,
        Limit:          20,
    })
    if discoveryResult.HasError() {
        return apperror.Fail[*SeoFaqResponse](discoveryResult.Error())
    }
    
    discovered := discoveryResult.Value()
    
    // 2. Convert to RAG chunks for context
    chunks := b.convertToRagChunks(discovered)
    
    // 3. Generate SEO-optimized FAQ content
    return b.seoGenerator.Generate(context, SeoFaqGenerateRequest{
        Company:     req.Company,
        Service:     req.Service,
        Location:    req.Location,
        RagContext:  chunks,
        SourceFaqs:  discovered.Faqs,
        Style:       req.Style,
    })
}

func (b *FAQGenerationBridge) convertToRAGChunks(resp *FAQDiscoveryResponse) []RAGChunk {
    chunks := []RAGChunk{}
    
    // Add AI Overview as high-priority chunk
    if resp.AIOverview != nil && resp.AIOverview.Available {
        chunks = append(chunks, RAGChunk{
            Content:  resp.AIOverview.Summary,
            Source:   "ai_overview",
            Priority: 1.0,
            Metadata: RAGChunkMetadata{
                Type:       "ai_overview",
                Confidence: resp.AIOverview.Confidence,
            },
        })
    }
    
    // Add FAQ answers as chunks
    for _, faq := range resp.FAQs {
        if faq.BestAnswer != nil {
            chunks = append(chunks, RAGChunk{
                Content:  fmt.Sprintf("Q: %s\nA: %s", faq.Question, faq.BestAnswer.Text),
                Source:   faq.BestAnswer.SourceUrl,
                Priority: faq.BestAnswer.Confidence,
                Metadata: RAGChunkMetadata{
                    Type:         "faq",
                    QuestionType: faq.QuestionType,
                    PAARank:      faq.PAARank,
                },
            })
        }
    }
    
    return chunks
}
```

---

## 11. Testing

### 11.1 Unit Tests

```go
func TestAIOverviewExtractor(t *testing.T) {
    tests := []struct {
        name     string
        mockHtml string
        want     *AIOverview
        wantErr  bool
    }{
        {
            name:     "extracts AI overview with bullets",
            mockHtml: loadFixture("ai_overview_with_bullets.html"),
            want: &AIOverview{
                Available:    true,
                Summary:      "...",
                BulletPoints: []string{"Point 1", "Point 2"},
            },
        },
        {
            name:     "handles missing AI overview",
            mockHtml: loadFixture("serp_no_ai_overview.html"),
            want:     &AIOverview{Available: false},
        },
    }
    // ...
}

func TestQuestionClassification(t *testing.T) {
    tests := []struct {
        question string
        want     QuestionType
    }{
        {"What is a plumber?", QuestionWhat},
        {"How much does plumbing cost?", QuestionHow},
        {"Why do pipes leak?", QuestionWhy},
        {"Is plumbing expensive?", QuestionIs},
    }
    
    for _, tt := range tests {
        t.Run(tt.question, func(t *testing.T) {
            got := classifyQuestion(tt.question)
            assert.Equal(t, tt.want, got)
        })
    }
}
```

---

## 12. Related Files

- Plan: `41-business-intelligence-plan.md`
- Phase 1: `42-multi-engine-search.md`
- Phase 3: `44-serp-position-tracking.md`
- SEO FAQ: `../../../22-ai-bridge-cli/01-backend/20-faq-generation.md`
