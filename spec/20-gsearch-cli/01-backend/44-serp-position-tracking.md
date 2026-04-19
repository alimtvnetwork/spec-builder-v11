# GSearch SERP Position Tracking Specification

> **Phase:** 3 of 7  
> **Status:** Draft  
> **Created:** 2026-02-04  
**Version:** 1.0.0  
> **Depends On:** `42-multi-engine-search.md` (Phase 1)  
> **Parent:** `41-business-intelligence-plan.md`

---

## 1. Overview

SERP position tracking system for monitoring keyword rankings, discovering competitors on specific result pages, and tracking position changes over time with historical analysis.

---

## 2. Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                    SERP Position Tracker                           │
├───────────────────────────────────────────────────────────────────┤
│  Query Manager → Page Crawler → Position Analyzer → History Store │
└────────┬──────────────┬───────────────┬───────────────────────────┘
         │              │               │
  ┌──────▼──────┐ ┌─────▼─────┐  ┌──────▼──────┐
  │   Page      │ │ Position  │  │ Competitor  │
  │   Indexer   │ │  Tracker  │  │  Discovery  │
  └──────┬──────┘ └─────┬─────┘  └──────┬──────┘
         │              │               │
  ┌──────▼──────────────▼───────────────▼──────┐
  │              Schedule Manager               │
  │  ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
  │  │  Cron    │ │  Alert   │ │   Report    │ │
  │  │  Jobs    │ │  Engine  │ │  Generator  │ │
  │  └──────────┘ └──────────┘ └─────────────┘ │
  └─────────────────────────────────────────────┘
```

---

## 3. CLI Interface

### 3.1 Basic Commands

```bash
# Search specific SERP page
gsearch serp "plumber NYC" --page 1
gsearch serp "plumber NYC" --page 3
gsearch serp "plumber NYC" --pages 1-5

# Find position of a specific domain
gsearch serp "plumber NYC" --find-position example.com
gsearch serp "plumber NYC" --find-position example.com --max-pages 10

# Discover competitors on page range
gsearch serp "plumber NYC" --competitors --pages 2-4

# Track keyword position over time
gsearch serp track "plumber NYC" --domain example.com
gsearch serp track "plumber NYC" --domain example.com --interval 24h

# View tracking history
gsearch serp history "plumber NYC" --domain example.com
gsearch serp history "plumber NYC" --domain example.com --days 30
```

### 3.2 Advanced Options

```bash
# Multi-keyword tracking
gsearch serp track --keywords keywords.txt --domain example.com

# Competitor analysis
gsearch serp competitors "plumber NYC" --pages 1-3 --analyze
gsearch serp competitors "plumber NYC" --top 20 --with-contact

# Alerts
gsearch serp alert "plumber NYC" --domain example.com --threshold 5
gsearch serp alert list
gsearch serp alert remove <alert-id>

# Batch operations
gsearch serp batch --input queries.csv --output results.json
gsearch serp batch status <job-id>

# Output formats
gsearch serp "keyword" --output json
gsearch serp "keyword" --output csv
gsearch serp "keyword" --output table

# Engine selection
gsearch serp "keyword" --engine google
gsearch serp "keyword" --engines google,bing

# Caching
gsearch serp "keyword" --cache-days 1
gsearch serp "keyword" --force
```

### 3.3 Job Management

```bash
# List active tracking jobs
gsearch serp jobs list

# Pause/resume tracking
gsearch serp jobs pause <job-id>
gsearch serp jobs resume <job-id>

# Cancel tracking
gsearch serp jobs cancel <job-id>

# Export tracking data
gsearch serp export --domain example.com --format csv
gsearch serp export --domain example.com --days 90 --format json
```

---

## 4. Data Structures

### 4.1 Core Types

```go
type SerpRequest struct {
    Query           string            
    Engine          string            // google, bing
    Pages           []int             // [1, 2, 3]
    PageRange       *PageRange        // {start: 1, end: 5}
    FindDomain      string            // Domain to find
    MaxPages        int               // Max pages to search
    IncludeAds      bool              // Include paid results
    Region          string            // Geographic region
    Language        string            
    Device          DeviceType        // desktop, mobile
    CacheDays       int               
    ForceRefresh    bool              
}

type PageRange struct {
    Start   int
    End     int
}

type DeviceType string

const (
    DeviceDesktop DeviceType = "desktop"
    DeviceMobile  DeviceType = "mobile"
    DeviceTablet  DeviceType = "tablet"
)

type SerpResponse struct {
    Query           string                  
    Engine          string                  
    Device          DeviceType              
    Region          string                  
    Pages           map[int]*SerpPage       
    DomainPosition  *DomainPosition         `json:",omitempty"`
    TotalResults    int64                   
    FromCache       bool                    
    CapturedAt      time.Time               
}

type SerpPage struct {
    PageNumber      int                     
    Results         []SerpResult            
    Ads             []SerpAd                `json:",omitempty"`
    LocalPack       []LocalResult           `json:",omitempty"`
    FeaturedSnippet *FeaturedSnippet        `json:",omitempty"`
    RelatedSearches []string                `json:",omitempty"`
}
```

### 4.2 Result Types

```go
type SerpResult struct {
    Position        int               // Absolute position
    PagePosition    int               // Position within page
    Url             string            
    Domain          string            
    Title           string            
    Snippet         string            
    DisplayUrl      string            
    ResultType      ResultType        // organic, featured, etc.
    RichFeatures    []RichFeature     // stars, price, etc.
    SiteLinks       []SiteLink        `json:",omitempty"`
    CapturedAt      time.Time         
}

type ResultType string

const (
    ResultOrganic         ResultType = "organic"
    ResultFeaturedSnippet ResultType = "featured_snippet"
    ResultKnowledgePanel  ResultType = "knowledge_panel"
    ResultLocalPack       ResultType = "local_pack"
    ResultImagePack       ResultType = "image_pack"
    ResultVideoPack       ResultType = "video_pack"
    ResultNews            ResultType = "news"
    ResultShopping        ResultType = "shopping"
)

type RichFeature struct {
    Type    string // stars, reviews, price, date
    Value   string
    Display string
}

type SerpAd struct {
    Position    int    
    Url         string 
    Domain      string 
    Title       string 
    Description string 
    AdType      string // text, shopping, display
}

type LocalResult struct {
    Position    int     
    Name        string  
    Address     string  
    Phone       string  `json:",omitempty"`
    Rating      float64 
    Reviews     int     
    Category    string  
    PlaceId     string  `json:",omitempty"`
}

type FeaturedSnippet struct {
    Type        string   // paragraph, list, table
    Content     string   
    SourceUrl   string   
    SourceTitle string   
    Items       []string `json:",omitempty"` // For list type
}
```

### 4.3 Position Tracking Types

```go
type DomainPosition struct {
    Domain          string            
    Found           bool              
    Position        int               // Absolute position (0 if not found)
    Page            int               // Page number
    PagePosition    int               // Position on that page
    Url             string            // Exact URL found
    ResultType      ResultType        
    PagesSearched   int               
}

type PositionHistory struct {
    Domain          string                  
    Query           string                  
    Engine          string                  
    Records         []PositionRecord        
    Summary         *PositionSummary        
}

type PositionRecord struct {
    Position        int               
    Page            int               
    Url             string            
    ResultType      ResultType        
    CapturedAt      time.Time         
}

type PositionSummary struct {
    CurrentPosition     int             
    BestPosition        int             
    WorstPosition       int             
    AveragePosition     float64         
    PositionChange      int             // vs previous
    PositionTrend       TrendDirection  
    DaysTracked         int             
    FirstSeen           time.Time       
    LastSeen            time.Time       
}

type TrendDirection string

const (
    TrendUp     TrendDirection = "up"
    TrendDown   TrendDirection = "down"
    TrendStable TrendDirection = "stable"
)
```

### 4.4 Competitor Analysis Types

```go
type CompetitorAnalysis struct {
    Query            string                  
    TargetDomain     string                  `json:",omitempty"`
    Competitors      []Competitor            
    PageDistribution map[int]int             // page -> count
    DomainOverlap    []DomainOverlap         `json:",omitempty"`
    AnalyzedAt       time.Time               
}

type Competitor struct {
    Domain          string            
    Position        int               
    Page            int               
    Url             string            
    Title           string            
    ResultType      ResultType        
    RichFeatures    []RichFeature     
    AuthorityScore  float64           `json:",omitempty"`
    ContactInfo     *ContactInfo      `json:",omitempty"` // If --with-contact
}

type DomainOverlap struct {
    Domain          string            
    SharedKeywords  int               
    AvgPosition     float64           
    TopPosition     int               
}

type ContactInfo struct {
    Emails          []string          `json:",omitempty"`
    Phones          []string          `json:",omitempty"`
    LinkedIn        string            `json:",omitempty"`
    Facebook        string            `json:",omitempty"`
    Twitter         string            `json:",omitempty"`
}
```

---

## 5. SERP Page Crawler

### 5.1 Page Indexer

```go
type PageIndexer struct {
    searchEngine    *SearchOrchestrator
    scraper         *StealthScraper
    resultsPerPage  int
}

func (p *PageIndexer) IndexPages(context stdctx.Context, req SERPRequest) apperror.Result[SERPResponse] {
    response := SERPResponse{
        Query:    req.Query,
        Engine:   req.Engine,
        Device:   req.Device,
        Region:   req.Region,
        Pages:    make(map[int]*SERPPage),
    }
    
    pages := p.expandPageRange(req)
    
    var wg sync.WaitGroup
    var mu sync.Mutex
    var errors []*apperror.AppError
    
    for _, pageNum := range pages {
        wg.Add(1)
        go func(page int) {
            defer wg.Done()
            
            serpPageResult := p.indexSinglePage(context, req, page)
            if serpPageResult.HasError() {
                mu.Lock()
                errors = append(errors, serpPageResult.Error())
                mu.Unlock()

                return
            }
            
            serpPage := serpPageResult.Value()

            mu.Lock()
            response.Pages[page] = &serpPage
            mu.Unlock()
        }(pageNum)
    }
    
    wg.Wait()
    
    if len(errors) == len(pages) {
        return apperror.Fail[SERPResponse](
            apperror.New(
                "E7003",
                "all SERP pages failed to index",
            ),
        )
    }
    
    response.CapturedAt = time.Now()

    return apperror.Ok(response)
}

func (p *PageIndexer) indexSinglePage(context stdctx.Context, req SERPRequest, pageNum int) apperror.Result[SERPPage] {
    // Calculate start offset
    start := (pageNum - 1) * p.resultsPerPage
    
    // Build search request
    searchReq := SearchRequest{
        Query:    req.Query,
        Engine:   req.Engine,
        Limit:    p.resultsPerPage,
        Start:    start,
        Region:   req.Region,
        Language: req.Language,
        Device:   string(req.Device),
    }
    
    // Execute search
    searchResult := p.searchEngine.Search(context, searchReq)
    if searchResult.HasError() {
        return apperror.Fail[SERPPage](searchResult.Error())
    }

    searchResp := searchResult.Value()
    
    // Convert to SERP results
    serpPage := SERPPage{
        PageNumber: pageNum,
        Results:    make([]SERPResult, 0, len(searchResp.Results)),
    }
    
    for i, result := range searchResp.Results {
        serpResult := SERPResult{
            Position:     start + i + 1,
            PagePosition: i + 1,
            Url:          result.Url,
            Domain:       extractDomain(result.Url),
            Title:        result.Title,
            Snippet:      result.Snippet,
            DisplayUrl:   result.DisplayUrl,
            ResultType:   p.classifyResultType(result),
            RichFeatures: p.extractRichFeatures(result),
            SiteLinks:    result.SiteLinks,
            CapturedAt:   time.Now(),
        }
        serpPage.Results = append(serpPage.Results, serpResult)
    }
    
    // Extract additional SERP features if scraping
    if p.scraper != nil {
        p.enrichWithSerpFeatures(context, &serpPage, req)
    }
    
    return apperror.Ok(serpPage)
}
```

### 5.2 Position Finder

```go
type PositionFinder struct {
    pageIndexer *PageIndexer
    maxPages    int
}

func (f *PositionFinder) FindPosition(context stdctx.Context, req SERPRequest) apperror.Result[DomainPosition] {
    domain := normalizeDomain(req.FindDomain)
    maxPages := req.MaxPages
    if maxPages == 0 {
        maxPages = f.maxPages
    }
    
    result := DomainPosition{
        Domain:        domain,
        Found:         false,
        PagesSearched: 0,
    }
    
    for page := 1; page <= maxPages; page++ {
        result.PagesSearched = page
        
        serpPageResult := f.pageIndexer.indexSinglePage(context, req, page)
        if serpPageResult.HasError() {
            continue // Try next page on error
        }

        serpPage := serpPageResult.Value()
        
        // Search for domain in results
        for _, r := range serpPage.Results {
            if matchesDomain(r.Domain, domain) {
                result.Found = true
                result.Position = r.Position
                result.Page = page
                result.PagePosition = r.PagePosition
                result.Url = r.Url
                result.ResultType = r.ResultType

                return apperror.Ok(result)
            }
        }
    }
    
    return apperror.Ok(result)
}

func matchesDomain(resultDomain, targetDomain string) bool {
    // Normalize and compare
    result := normalizeDomain(resultDomain)
    target := normalizeDomain(targetDomain)
    
    // Exact match
    if result == target {
        return true
    }
    
    // Subdomain match (www.example.com matches example.com)
    if strings.HasSuffix(result, "."+target) {
        return true
    }
    
    return false
}
```

---

## 6. Position Tracking System

### 6.1 Tracker Manager

```go
type TrackerManager struct {
    db          *sql.DB
    scheduler   *gocron.Scheduler
    indexer     *PageIndexer
    alertEngine *AlertEngine
    jobs        map[string]*TrackingJob
    mu          sync.RWMutex
}

type TrackingJob struct {
    Id              string
    Query           string
    Domain          string
    Engine          string
    Interval        time.Duration
    Status          JobStatus
    LastRun         *time.Time    `json:",omitempty"`
    NextRun         *time.Time    `json:",omitempty"`
    RunCount        int
    FailCount       int
    CreatedAt       time.Time
}

type JobStatus string

const (
    JobPending   JobStatus = "pending"
    JobRunning   JobStatus = "running"
    JobPaused    JobStatus = "paused"
    JobCompleted JobStatus = "completed"
    JobFailed    JobStatus = "failed"
)

func (m *TrackerManager) StartTracking(req TrackingRequest) apperror.Result[TrackingJob] {
    job := &TrackingJob{
        Id:        generateJobId(),
        Query:     req.Query,
        Domain:    req.Domain,
        Engine:    req.Engine,
        Interval:  req.Interval,
        Status:    JobPending,
        CreatedAt: time.Now(),
    }
    
    // Register in database
    if saveErr := m.saveJob(job); saveErr != nil {
        return apperror.Fail[TrackingJob](saveErr)
    }
    
    // Schedule with gocron
    _, scheduleErr := m.scheduler.Every(int(req.Interval.Minutes())).Minutes().Do(func() {
        m.executeTracking(job)
    })
    if scheduleErr != nil {
        return apperror.Fail[TrackingJob](
            apperror.Wrap(
                scheduleErr,
                "schedule tracking job",
            ),
        )
    }
    
    m.mu.Lock()
    m.jobs[job.Id] = job
    m.mu.Unlock()
    
    // Execute immediately
    go m.executeTracking(job)
    
    return apperror.Ok(*job)
}

func (m *TrackerManager) executeTracking(job *TrackingJob) {
    m.updateJobStatus(job.Id, JobRunning)
    
    // Find current position
    resp, err := m.indexer.IndexPages(context.Background(), SERPRequest{
        Query:      job.Query,
        Engine:     job.Engine,
        FindDomain: job.Domain,
        MaxPages:   10,
    })
    
    if err != nil {
        m.recordFailure(job.Id, err)
        return
    }
    
    // Find domain in results
    position := m.findDomainPosition(resp, job.Domain)
    
    // Record position
    record := PositionRecord{
        Position:   position.Position,
        Page:       position.Page,
        Url:        position.Url,
        ResultType: position.ResultType,
        CapturedAt: time.Now(),
    }
    
    if err := m.savePositionRecord(job, record); err != nil {
        m.recordFailure(job.Id, err)
        return
    }
    
    // Check alerts
    m.alertEngine.CheckPosition(job, record)
    
    m.updateJobSuccess(job.Id)
}
```

### 6.2 History Analyzer

```go
type HistoryAnalyzer struct {
    db *sql.DB
}

func (h *HistoryAnalyzer) GetHistory(query, domain, engine string) apperror.Result[PositionHistory] {
    // Load records from database
    recordsResult := h.loadRecords(query, domain, engine)
    if recordsResult.HasError() {
        return apperror.Fail[PositionHistory](recordsResult.Error())
    }

    records := recordsResult.Value()
    
    history := PositionHistory{
        Domain:  domain,
        Query:   query,
        Engine:  engine,
        Records: records,
    }
    
    // Calculate summary
    history.Summary = h.calculateSummary(records)
    
    return apperror.Ok(history)
}

func (h *HistoryAnalyzer) calculateSummary(records []PositionRecord) *PositionSummary {
    if len(records) == 0 {
        return nil
    }
    
    summary := &PositionSummary{
        FirstSeen:   records[0].CapturedAt,
        LastSeen:    records[len(records)-1].CapturedAt,
        DaysTracked: int(records[len(records)-1].CapturedAt.Sub(records[0].CapturedAt).Hours() / 24),
    }
    
    // Calculate position stats
    positions := make([]int, 0, len(records))
    for _, r := range records {
        if r.Position > 0 { // Only count found positions
            positions = append(positions, r.Position)
        }
    }
    
    if len(positions) > 0 {
        summary.CurrentPosition = positions[len(positions)-1]
        summary.BestPosition = minInt(positions...)
        summary.WorstPosition = maxInt(positions...)
        summary.AveragePosition = average(positions)
        
        if len(positions) >= 2 {
            summary.PositionChange = positions[len(positions)-2] - positions[len(positions)-1]
            summary.PositionTrend = h.calculateTrend(positions)
        }
    }
    
    return summary
}

func (h *HistoryAnalyzer) calculateTrend(positions []int) TrendDirection {
    if len(positions) < 3 {
        return TrendStable
    }
    
    // Use last 7 positions for trend
    window := positions
    if len(positions) > 7 {
        window = positions[len(positions)-7:]
    }
    
    // Calculate linear regression slope
    slope := linearRegressionSlope(window)
    
    if slope < -0.5 {
        return TrendUp   // Lower position = better
    } else if slope > 0.5 {
        return TrendDown
    }
    return TrendStable
}
```

---

## 7. Competitor Discovery

### 7.1 Competitor Analyzer

```go
type CompetitorAnalyzer struct {
    pageIndexer     *PageIndexer
    authorityScorer *AuthorityScorer
    contactExtractor *ContactExtractor  // From Phase 4
}

func (c *CompetitorAnalyzer) DiscoverCompetitors(context stdctx.Context, req CompetitorRequest) apperror.Result[CompetitorAnalysis] {
    // Fetch SERP pages
    serpResult := c.pageIndexer.IndexPages(context, SERPRequest{
        Query:     req.Query,
        Engine:    req.Engine,
        PageRange: req.PageRange,
    })
    if serpResult.HasError() {
        return apperror.Fail[CompetitorAnalysis](serpResult.Error())
    }

    serpResp := serpResult.Value()
    
    // Extract competitors
    competitors := []Competitor{}
    pageDistribution := make(map[int]int)
    seenDomains := make(map[string]bool)
    
    for pageNum, page := range serpResp.Pages {
        for _, result := range page.Results {
            // Skip target domain if specified
            if req.TargetDomain != "" && matchesDomain(result.Domain, req.TargetDomain) {
                continue
            }
            
            // Deduplicate by domain
            if seenDomains[result.Domain] {
                continue
            }
            seenDomains[result.Domain] = true
            
            competitor := Competitor{
                Domain:       result.Domain,
                Position:     result.Position,
                Page:         pageNum,
                Url:          result.Url,
                Title:        result.Title,
                ResultType:   result.ResultType,
                RichFeatures: result.RichFeatures,
            }
            
            competitors = append(competitors, competitor)
            pageDistribution[pageNum]++
        }
    }
    
    // Enrich with authority scores (async)
    if req.WithAuthority {
        c.enrichWithAuthority(context, competitors)
    }
    
    // Extract contact info if requested
    if req.WithContact {
        c.enrichWithContact(context, competitors)
    }
    
    // Sort by position
    sort.Slice(competitors, func(i, j int) bool {
        return competitors[i].Position < competitors[j].Position
    })
    
    // Limit results
    if req.Limit > 0 && len(competitors) > req.Limit {
        competitors = competitors[:req.Limit]
    }
    
    return apperror.Ok(CompetitorAnalysis{
        Query:            req.Query,
        TargetDomain:     req.TargetDomain,
        Competitors:      competitors,
        PageDistribution: pageDistribution,
        AnalyzedAt:       time.Now(),
    })
}

func (c *CompetitorAnalyzer) enrichWithAuthority(context stdctx.Context, competitors []Competitor) {
    var wg sync.WaitGroup
    sem := make(chan struct{}, 5) // Limit concurrency
    
    for i := range competitors {
        wg.Add(1)
        go func(idx int) {
            defer wg.Done()
            sem <- struct{}{}
            defer func() { <-sem }()
            
            score, err := c.authorityScorer.GetScore(context, competitors[idx].Domain)
            if err == nil {
                competitors[idx].AuthorityScore = score
            }
        }(i)
    }
    
    wg.Wait()
}

func (c *CompetitorAnalyzer) enrichWithContact(context stdctx.Context, competitors []Competitor) {
    var wg sync.WaitGroup
    sem := make(chan struct{}, 3) // Lower concurrency for contact extraction
    
    for i := range competitors {
        wg.Add(1)
        go func(idx int) {
            defer wg.Done()
            sem <- struct{}{}
            defer func() { <-sem }()
            
            contact, err := c.contactExtractor.Extract(context, competitors[idx].Url)
            if err == nil {
                competitors[idx].ContactInfo = contact
            }
        }(i)
    }
    
    wg.Wait()
}
```

---

## 8. Alert System

### 8.1 Alert Engine

```go
type AlertEngine struct {
    db        *sql.DB
    notifiers []Notifier
}

type Alert struct {
    Id              string
    Query           string
    Domain          string
    Engine          string
    AlertType       AlertType
    Threshold       int
    Direction       AlertDirection
    Enabled         bool
    LastTriggered   *time.Time `json:",omitempty"`
    TriggerCount    int
    CreatedAt       time.Time
}

type AlertType string

const (
    AlertPositionDrop   AlertType = "position_drop"
    AlertPositionGain   AlertType = "position_gain"
    AlertPositionChange AlertType = "position_change"
    AlertPageChange     AlertType = "page_change"
    AlertNotFound       AlertType = "not_found"
    AlertFirstPage      AlertType = "first_page"
)

type AlertDirection string

const (
    DirectionUp   AlertDirection = "up"
    DirectionDown AlertDirection = "down"
    DirectionAny  AlertDirection = "any"
)

func (e *AlertEngine) CheckPosition(job *TrackingJob, current PositionRecord) {
    alerts, err := e.getAlerts(job.Query, job.Domain, job.Engine)
    if err != nil {
        return
    }
    
    previous, err := e.getPreviousRecord(job)
    if err != nil {
        return
    }
    
    for _, alert := range alerts {
        if !alert.Enabled {
            continue
        }
        
        triggered := e.evaluateAlert(alert, current, previous)
        if triggered {
            e.triggerAlert(alert, current, previous)
        }
    }
}

func (e *AlertEngine) evaluateAlert(alert Alert, current, previous PositionRecord) bool {
    switch alert.AlertType {
    case AlertPositionDrop:
        // Position increased (worse)
        if previous.Position > 0 && current.Position > 0 {
            return current.Position - previous.Position >= alert.Threshold
        }
    case AlertPositionGain:
        // Position decreased (better)
        if previous.Position > 0 && current.Position > 0 {
            return previous.Position - current.Position >= alert.Threshold
        }
    case AlertPositionChange:
        // Any change >= threshold
        if previous.Position > 0 && current.Position > 0 {
            change := abs(current.Position - previous.Position)
            return change >= alert.Threshold
        }
    case AlertPageChange:
        return current.Page != previous.Page
    case AlertNotFound:
        return current.Position == 0 && previous.Position > 0
    case AlertFirstPage:
        return current.Page == 1 && previous.Page > 1
    }
    return false
}

func (e *AlertEngine) triggerAlert(alert Alert, current, previous PositionRecord) {
    event := AlertEvent{
        AlertId:          alert.Id,
        Query:            alert.Query,
        Domain:           alert.Domain,
        PreviousPosition: previous.Position,
        CurrentPosition:  current.Position,
        TriggeredAt:      time.Now(),
    }
    
    // Update alert
    alert.LastTriggered = &event.TriggeredAt
    alert.TriggerCount++
    e.updateAlert(alert)
    
    // Notify
    for _, notifier := range e.notifiers {
        notifier.Notify(event)
    }
}
```

---

## 9. Database Schema

### 9.1 Root DB

```sql
-- Root DB: data/{appName}/rag/serp/registry.db

CREATE TABLE TrackingJobs (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    domain TEXT NOT NULL,
    engine TEXT NOT NULL DEFAULT 'google',
    interval_minutes INTEGER NOT NULL DEFAULT 1440,
    status TEXT NOT NULL DEFAULT 'pending',
    last_run DATETIME,
    next_run DATETIME,
    run_count INTEGER DEFAULT 0,
    fail_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Alerts (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    domain TEXT NOT NULL,
    engine TEXT NOT NULL DEFAULT 'google',
    alert_type TEXT NOT NULL,
    threshold INTEGER DEFAULT 5,
    direction TEXT DEFAULT 'any',
    enabled BOOLEAN DEFAULT TRUE,
    last_triggered DATETIME,
    trigger_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE SearchTerms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_hash TEXT UNIQUE NOT NULL,
    query_raw TEXT NOT NULL,
    engines TEXT NOT NULL,                    -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME,
    access_count INTEGER DEFAULT 0
);

CREATE INDEX IdxJobsStatus ON TrackingJobs(status);
CREATE INDEX IdxJobsDomain ON TrackingJobs(domain);
CREATE INDEX IdxAlertsDomain ON Alerts(domain);
CREATE INDEX IdxTermsHash ON SearchTerms(query_hash);
```

### 9.2 Session DB

```sql
-- Session DB: data/{appName}/rag/serp/results/{query-hash}.db

CREATE TABLE SERPResults (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    engine TEXT NOT NULL,
    page_number INTEGER NOT NULL,
    position INTEGER NOT NULL,
    page_position INTEGER NOT NULL,
    url TEXT NOT NULL,
    domain TEXT NOT NULL,
    title TEXT,
    snippet TEXT,
    display_url TEXT,
    result_type TEXT DEFAULT 'organic',
    rich_features TEXT,                       -- JSON array
    captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ttl_expires DATETIME NOT NULL
);

CREATE TABLE PositionHistory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL,
    position INTEGER NOT NULL,
    page INTEGER NOT NULL,
    url TEXT,
    result_type TEXT,
    captured_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Competitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL,
    position INTEGER NOT NULL,
    page INTEGER NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    authority_score REAL,
    contact_info TEXT,                        -- JSON
    analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxResultsDomain ON SERPResults(domain);
CREATE INDEX IdxResultsPosition ON SERPResults(position);
CREATE INDEX IdxHistoryDomain ON PositionHistory(domain);
CREATE INDEX IdxHistoryCaptured ON PositionHistory(captured_at);
CREATE INDEX IdxCompetitorsDomain ON Competitors(domain);
```

---

## 10. Configuration

```yaml
# config/gsearch.seed.yaml
serp:
  results_per_page: 10
  max_pages: 10
  default_engine: google
  
  tracking:
    default_interval_hours: 24
    min_interval_hours: 1
    max_jobs_per_domain: 100
    retention_days: 365
    
  alerts:
    enabled: true
    default_threshold: 5
    max_alerts_per_domain: 50
    cooldown_hours: 1          # Min time between same alert
    
  cache:
    ttl_hours: 24              # SERP results cache
    history_retention_days: 365
    
  competitors:
    max_per_query: 100
    authority_concurrency: 5
    contact_concurrency: 3
    
  device:
    default: desktop
    rotate: false
```

---

## 11. Error Handling

### 11.1 Error Codes (7740-7759)

| Code | Constant | Description |
|------|----------|-------------|
| 7740 | `ErrSerpQueryInvalid` | Empty or malformed SERP query |
| 7741 | `ErrSerpPageOutOfRange` | Page number out of valid range |
| 7742 | `ErrSerpEngineUnsupported` | Unsupported search engine |
| 7743 | `ErrSerpCrawlFailed` | Failed to crawl SERP page |
| 7744 | `ErrSerpRateLimited` | Search engine rate limit hit |
| 7745 | `ErrSerpPositionNotFound` | Domain not found in max pages |
| 7746 | `ErrTrackingJobExists` | Duplicate tracking job |
| 7747 | `ErrTrackingJobNotFound` | Job ID not found |
| 7748 | `ErrTrackingLimitExceeded` | Max tracking jobs exceeded |
| 7749 | `ErrAlertNotFound` | Alert ID not found |
| 7750 | `ErrAlertLimitExceeded` | Max alerts exceeded |
| 7751 | `ErrHistoryNotFound` | No history for query/domain |
| 7752 | `ErrCompetitorAnalysisFailed` | Competitor analysis failed |
| 7753 | `ErrSchedulerFailed` | Job scheduler error |

---

## 12. API Endpoints

```
POST /api/v1/serp/search          # One-time SERP search
POST /api/v1/serp/position        # Find domain position
POST /api/v1/serp/competitors     # Competitor discovery

POST /api/v1/serp/track           # Start tracking
GET  /api/v1/serp/track           # List tracking jobs
GET  /api/v1/serp/track/{id}      # Get job details
PUT  /api/v1/serp/track/{id}      # Update job
DELETE /api/v1/serp/track/{id}    # Stop tracking

GET  /api/v1/serp/history         # Get position history
GET  /api/v1/serp/history/export  # Export history

POST /api/v1/serp/alert           # Create alert
GET  /api/v1/serp/alert           # List alerts
PUT  /api/v1/serp/alert/{id}      # Update alert
DELETE /api/v1/serp/alert/{id}    # Delete alert
```

---

## 13. Related Files

- Plan: `41-business-intelligence-plan.md`
- Phase 1: `42-multi-engine-search.md`
- Phase 2: `43-faq-discovery-ai-overview.md`
- Phase 4: `45-contact-extraction.md`
- Authority Scoring: `18-authority-credibility-scoring.md`
- **Enum Architecture:** `58-enum-architecture.md` (provider, engine, platform enums)
- **Provider Integration:** `59-provider-integration.md` (SerpApi, Colly, Maps Scraper)
- **Multi-Source Search:** `56-multi-source-search.md` (parallel platform search)
- **Unified CLI/API:** `60-unified-cli-api-reference.md` (complete endpoint reference)
