# GSearch Google Maps Business Search Specification

> **Phase:** 5 of 7  
> **Status:** Draft  
> **Created:** 2026-02-04  
**Version:** 1.0.0  
> **Depends On:** `45-contact-extraction.md` (Phase 4)  
> **Parent:** `41-business-intelligence-plan.md`

---

## 1. Overview

Scheduled Google Maps business discovery with batch processing, rate limiting, and automated contact enrichment. Enables large-scale lead generation by industry and location with configurable crawling schedules.

---

## 2. Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                    Google Maps Search Engine                       │
├───────────────────────────────────────────────────────────────────┤
│  Job Manager → Scheduler → Crawler → Enricher → Result Store     │
└────────┬──────────────┬───────────────┬───────────────────────────┘
         │              │               │
  ┌──────▼──────┐ ┌─────▼─────┐  ┌──────▼──────┐
  │    Job      │ │  gocron   │  │   Stealth   │
  │   Queue     │ │ Scheduler │  │   Scraper   │
  └──────┬──────┘ └─────┬─────┘  └──────┬──────┘
         │              │               │
  ┌──────▼──────────────▼───────────────▼──────┐
  │            Business Enrichment              │
  │  ┌────────────┐  ┌────────────────────────┐│
  │  │  Contact   │  │    Website Crawler     ││
  │  │ Extractor  │  │ (Phase 4 Integration)  ││
  │  └────────────┘  └────────────────────────┘│
  └──────────────────────────────────────────────┘
                        │
              ┌─────────▼─────────┐
              │   Split DB Store  │
              │  Registry + Jobs  │
              └───────────────────┘
```

---

## 3. CLI Interface

### 3.1 Basic Commands

```bash
# Immediate search (blocking)
gsearch maps "plumbers" --location "New York, NY"
gsearch maps "restaurants" --location "Los Angeles, CA" --limit 50

# Scheduled search job
gsearch maps "plumbers" --location "NYC" --schedule --limit 500
gsearch maps "dentists" --location "Chicago" --schedule --batch-size 30 --interval 2m

# Quick search (first page only)
gsearch maps "coffee shops" --location "Seattle" --quick
```

### 3.2 Job Management

```bash
# List all jobs
gsearch maps jobs list
gsearch maps jobs list --status running
gsearch maps jobs list --status completed

# Job details
gsearch maps jobs status <job-id>
gsearch maps jobs logs <job-id>

# Control jobs
gsearch maps jobs pause <job-id>
gsearch maps jobs resume <job-id>
gsearch maps jobs cancel <job-id>
gsearch maps jobs retry <job-id>

# Export results
gsearch maps jobs export <job-id> --format json
gsearch maps jobs export <job-id> --format csv
gsearch maps jobs export <job-id> --with-contacts
```

### 3.3 Advanced Options

```bash
# Search refinement
gsearch maps "plumbers" --location "NYC" --radius 10km
gsearch maps "plumbers" --location "NYC" --rating-min 4.0
gsearch maps "plumbers" --location "NYC" --reviews-min 50
gsearch maps "plumbers" --location "NYC" --open-now

# Category filters
gsearch maps --category "home_services" --location "Miami"
gsearch maps --category "restaurants" --subcategory "italian" --location "Boston"

# Business enrichment
gsearch maps "plumbers" --location "NYC" --enrich-contacts
gsearch maps "plumbers" --location "NYC" --enrich-contacts --deep

# Scheduling options
gsearch maps "keyword" --schedule --batch-size 20 --interval 1m
gsearch maps "keyword" --schedule --start-at "2026-02-05T09:00:00"
gsearch maps "keyword" --schedule --end-at "2026-02-05T18:00:00"
gsearch maps "keyword" --schedule --max-runtime 2h

# Rate limiting
gsearch maps "keyword" --delay 3s
gsearch maps "keyword" --concurrency 2

# Caching
gsearch maps "keyword" --location "NYC" --cache-days 90
gsearch maps "keyword" --location "NYC" --force

# Output
gsearch maps "keyword" --output json
gsearch maps "keyword" --output csv
gsearch maps "keyword" --output table
```

### 3.4 Batch Input

```bash
# Search from file
gsearch maps batch --input industries.csv --location "NYC"
gsearch maps batch --input queries.json

# File format (CSV)
# industry,location,limit
# plumbers,New York NY,100
# electricians,New York NY,100
# hvac,New York NY,100
```

---

## 4. Data Structures

### 4.1 Core Types

```go
// EXEMPTED: Google Maps API external contract — snake_case tags required for API compatibility
type MapsSearchRequest struct {
    Query           string            `json:"query"`
    Industry        string            `json:"industry,omitempty"`
    Category        string            `json:"category,omitempty"`
    Subcategory     string            `json:"subcategory,omitempty"`
    Location        string            `json:"location"`
    Radius          string            `json:"radius,omitempty"`        // "10km", "5mi"
    Limit           int               `json:"limit"`
    
    // Filters
    MinRating       float64           `json:"min_rating,omitempty"`
    MinReviews      int               `json:"min_reviews,omitempty"`
    OpenNow         bool              `json:"open_now,omitempty"`
    PriceLevel      []int             `json:"price_level,omitempty"`   // 1-4
    
    // Enrichment
    EnrichContacts  bool              `json:"enrich_contacts"`
    DeepEnrich      bool              `json:"deep_enrich"`
    
    // Scheduling
    Schedule        bool              `json:"schedule"`
    BatchSize       int               `json:"batch_size"`
    Interval        time.Duration     `json:"interval"`
    StartAt         *time.Time        `json:"start_at,omitempty"`
    EndAt           *time.Time        `json:"end_at,omitempty"`
    MaxRuntime      time.Duration     `json:"max_runtime,omitempty"`
    
    // Rate limiting
    Delay           time.Duration     `json:"delay"`
    Concurrency     int               `json:"concurrency"`
    
    // Caching
    CacheDays       int               `json:"cache_days"`
    ForceRefresh    bool              `json:"force_refresh"`
}

// EXEMPTED: Google Maps API external contract
type MapsSearchResponse struct {
    JobId           string            `json:"job_id,omitempty"`
    Query           string            `json:"query"`
    Location        string            `json:"location"`
    Businesses      []Business        `json:"businesses"`
    TotalFound      int               `json:"total_found"`
    TotalCollected  int               `json:"total_collected"`
    Status          JobStatus         `json:"status"`
    FromCache       bool              `json:"from_cache"`
    SearchTime      time.Duration     `json:"search_time"`
    CompletedAt     *time.Time        `json:"completed_at,omitempty"`
}
```

### 4.2 Business Types

```go
// EXEMPTED: Google Maps API external contract
type Business struct {
    // Google Maps data
    PlaceId         string            `json:"place_id"`
    Name            string            `json:"name"`
    Category        string            `json:"category"`
    Categories      []string          `json:"categories,omitempty"`
    
    // Location
    Address         string            `json:"address"`
    StreetAddress   string            `json:"street_address,omitempty"`
    City            string            `json:"city,omitempty"`
    State           string            `json:"state,omitempty"`
    PostalCode      string            `json:"postal_code,omitempty"`
    Country         string            `json:"country,omitempty"`
    Latitude        float64           `json:"latitude"`
    Longitude       float64           `json:"longitude"`
    PlusCode        string            `json:"plus_code,omitempty"`
    
    // Contact (from Maps)
    Phone           string            `json:"phone,omitempty"`
    Website         string            `json:"website,omitempty"`
    
    // Metrics
    Rating          float64           `json:"rating"`
    ReviewsCount    int               `json:"reviews_count"`
    PriceLevel      int               `json:"price_level,omitempty"`     // 1-4
    
    // Hours
    Hours           *BusinessHours    `json:"hours,omitempty"`
    OpenNow         bool              `json:"open_now"`
    
    // Rich data
    Photos          []string          `json:"photos,omitempty"`
    Description     string            `json:"description,omitempty"`
    Attributes      map[string]bool   `json:"attributes,omitempty"`      // wheelchair, delivery, etc.
    
    // Enriched data (from Phase 4)
    Contact         *ContactInfo      `json:"contact,omitempty"`
    ContactEnriched bool              `json:"contact_enriched"`
    
    // Metadata
    MapsUrl         string            `json:"maps_url"`     // External API: snake_case
    ExtractedAt     time.Time         `json:"extracted_at"` // External API: snake_case
}

type BusinessHours struct {
    Monday          string            `json:"monday,omitempty"`
    Tuesday         string            `json:"tuesday,omitempty"`
    Wednesday       string            `json:"wednesday,omitempty"`
    Thursday        string            `json:"thursday,omitempty"`
    Friday          string            `json:"friday,omitempty"`
    Saturday        string            `json:"saturday,omitempty"`
    Sunday          string            `json:"sunday,omitempty"`
    Timezone        string            `json:"timezone,omitempty"`
}
```

### 4.3 Job Types

```go
// EXEMPTED: Google Maps API external contract
type MapsJob struct {
    Id              string
    Query           string            `json:"query"`
    Industry        string            `json:"industry,omitempty"`
    Location        string            `json:"location"`
    
    // Targets
    TargetCount     int               `json:"target_count"`
    CollectedCount  int               `json:"collected_count"`
    EnrichedCount   int               `json:"enriched_count"`
    FailedCount     int               `json:"failed_count"`
    
    // Scheduling
    BatchSize       int               `json:"batch_size"`
    IntervalSeconds int               `json:"interval_seconds"`
    
    // Status
    Status          JobStatus         `json:"status"`
    Phase           JobPhase          `json:"phase"`
    CurrentPage     int               `json:"current_page"`
    TotalPages      int               `json:"total_pages"`
    
    // Timing
    CreatedAt       time.Time         `json:"created_at"`
    StartedAt       *time.Time        `json:"started_at,omitempty"`
    PausedAt        *time.Time        `json:"paused_at,omitempty"`
    CompletedAt     *time.Time        `json:"completed_at,omitempty"`
    NextRunAt       *time.Time        `json:"next_run_at,omitempty"`
    
    // Error tracking
    LastError       string            `json:"last_error,omitempty"`
    RetryCount      int               `json:"retry_count"`
    MaxRetries      int               `json:"max_retries"`
    
    // Configuration
    EnrichContacts  bool              `json:"enrich_contacts"`
    DeepEnrich      bool              `json:"deep_enrich"`
    DelayMs         int               `json:"delay_ms"`
}

type JobStatus string

const (
    JobStatusPending    JobStatus = "pending"
    JobStatusQueued     JobStatus = "queued"
    JobStatusRunning    JobStatus = "running"
    JobStatusPaused     JobStatus = "paused"
    JobStatusCompleted  JobStatus = "completed"
    JobStatusFailed     JobStatus = "failed"
    JobStatusCancelled  JobStatus = "cancelled"
)

type JobPhase string

const (
    PhaseSearching    JobPhase = "searching"
    PhaseEnriching    JobPhase = "enriching"
    PhaseFinishing    JobPhase = "finishing"
)

// JobLogDetails holds structured context for job log entries
type JobLogDetails struct {
    Phase       string `json:",omitempty"` // Current job phase
    ItemCount   int    `json:",omitempty"` // Items processed
    ErrorCode   int    `json:",omitempty"` // Error code if applicable
    Provider    string `json:",omitempty"` // Provider name
    Duration    int64  `json:",omitempty"` // Duration in ms
}

type JobLog struct {
    Id              int64             `json:"id"`
    JobId           string            `json:"job_id"`
    Level           string            `json:"level"`      // info, warn, error
    Message         string            `json:"message"`
    Details         *JobLogDetails    `json:",omitempty"`
    Timestamp       time.Time         `json:"timestamp"`
}
```

---

## 5. Google Maps Scraper

### 5.1 Scraper Implementation

```go
type MapsScraper struct {
    browser     *rod.Browser
    stealth     *stealth.Plugin
    rateLimit   *RateLimiter
    proxyPool   *ProxyPool
}

type ScraperConfig struct {
    Headless        bool
    ProxyEnabled    bool
    RotateProxy     bool
    MinDelay        time.Duration
    MaxDelay        time.Duration
    PageTimeout     time.Duration
    MaxRetries      int
    ScrollPause     time.Duration
}

func (s *MapsScraper) Search(context stdctx.Context, req MapsSearchRequest) appfault.Result[*MapsSearchResult] {
    // Build search URL
    searchUrl := s.buildSearchUrl(req.Query, req.Location)
    
    page := s.browser.MustPage()
    defer page.Close()
    
    // Apply stealth
    s.stealth.MustApply(page)
    
    // Navigate
    if err := page.Navigate(searchUrl); err != nil {
        return appfault.Fail[*MapsSearchResult](
            appfault.Wrap(
                err,
                "navigation failed",
            ),
        )
    }
    
    // Wait for results
    if err := page.WaitLoad(); err != nil {
        return appfault.Fail[*MapsSearchResult](
            appfault.Wrap(
                err,
                "page load failed",
            ),
        )
    }
    
    // Check for CAPTCHA
    if s.detectCaptcha(page) {
        return appfault.Fail[*MapsSearchResult](
            appfault.New(
                "CAPTCHA detected on Google Maps",
            ),
        )
    }
    
    // Extract businesses from current view
    businesses := s.extractBusinesses(page)
    
    return appfault.Ok(&MapsSearchResult{
        Businesses: businesses,
        HasMore:    s.hasMoreResults(page),
    })
}

func (s *MapsScraper) buildSearchUrl(query, location string) string {
    // Google Maps search URL
    baseUrl := "https://www.google.com/maps/search/"
    searchTerm := url.QueryEscape(fmt.Sprintf("%s in %s", query, location))
    return baseUrl + searchTerm
}

func (s *MapsScraper) extractBusinesses(page *rod.Page) []Business {
    businesses := []Business{}
    
    // Scroll to load more results
    resultPanel := page.MustElement("div[role='feed']")
    
    for {
        // Extract visible businesses
        cards := resultPanel.MustElements("div[jsaction*='mouseover:pane']")
        
        for _, card := range cards {
            business := s.parseBusinessCard(card)
            if business != nil {
                businesses = append(businesses, *business)
            }
        }
        
        // Scroll down
        if !s.scrollForMore(resultPanel) {
            break
        }
        
        time.Sleep(s.config.ScrollPause)
    }
    
    return businesses
}

func (s *MapsScraper) parseBusinessCard(card *rod.Element) *Business {
    business := &Business{
        ExtractedAt: time.Now(),
    }
    
    // Extract name
    nameEl := card.MustElement("div.fontHeadlineSmall")
    if nameEl != nil {
        business.Name = nameEl.MustText()
    }
    
    // Extract rating and reviews
    ratingEl := card.MustElement("span[role='img']")
    if ratingEl != nil {
        ariaLabel, _ := ratingEl.Attribute("aria-label")
        if ariaLabel != nil {
            business.Rating, business.ReviewsCount = s.parseRating(*ariaLabel)
        }
    }
    
    // Extract category
    categoryEl := card.MustElement("button[jsaction*='category']")
    if categoryEl != nil {
        business.Category = categoryEl.MustText()
    }
    
    // Extract address
    addressEls := card.MustElements("div.fontBodyMedium")
    for _, el := range addressEls {
        text := el.MustText()
        if s.looksLikeAddress(text) {
            business.Address = text
            break
        }
    }
    
    // Click to get details
    card.MustClick()
    time.Sleep(500 * time.Millisecond)
    
    // Extract from detail panel
    s.extractDetails(card.Page(), business)
    
    return business
}

func (s *MapsScraper) extractDetails(page *rod.Page, business *Business) {
    // Wait for detail panel
    detailPanel := page.MustElement("div[role='main']")
    if detailPanel == nil {
        return
    }
    
    // Phone
    phoneEl := detailPanel.MustElement("button[data-item-id*='phone']")
    if phoneEl != nil {
        business.Phone = s.extractPhone(phoneEl)
    }
    
    // Website
    websiteEl := detailPanel.MustElement("a[data-item-id*='website']")
    if websiteEl != nil {
        href, _ := websiteEl.Attribute("href")
        if href != nil {
            business.Website = s.cleanWebsiteUrl(*href)
        }
    }
    
    // Place ID (from URL)
    currentUrl := page.MustInfo().URL
    business.PlaceId = s.extractPlaceId(currentUrl)
    business.MapsUrl = currentUrl
    
    // Hours
    hoursEl := detailPanel.MustElement("div[aria-label*='hour']")
    if hoursEl != nil {
        business.Hours = s.parseHours(hoursEl)
    }
    
    // Coordinates
    business.Latitude, business.Longitude = s.extractCoordinates(currentUrl)
    
    // Parse address components
    s.parseAddressComponents(business)
}

func (s *MapsScraper) parseRating(ariaLabel string) (float64, int) {
    // Parse "4.5 stars 234 reviews"
    pattern := regexp.MustCompile(`([\d.]+)\s*stars?\s*(\d+)?\s*reviews?`)
    matches := pattern.FindStringSubmatch(ariaLabel)
    
    if len(matches) >= 2 {
        rating, _ := strconv.ParseFloat(matches[1], 64)
        reviews := 0
        if len(matches) >= 3 {
            reviews, _ = strconv.Atoi(matches[2])
        }
        return rating, reviews
    }
    
    return 0, 0
}
```

### 5.2 Pagination Handler

```go
type PaginationHandler struct {
    scraper     *MapsScraper
    batchSize   int
    delay       time.Duration
}

func (p *PaginationHandler) CollectAll(context stdctx.Context, req MapsSearchRequest, resultChan chan<- Business) *appfault.AppError {
    collected := 0
    page := 0
    
    for collected < req.Limit {
        select {
        case <-context.Done():
            return appfault.Wrap(
                context.Err(),
                "collection cancelled",
            )
        default:
        }
        
        // Search current page
        searchResult := p.scraper.Search(context, req)
        if searchResult.HasError() {
            // Cannot continue on CAPTCHA
            return searchResult.Error()
        }
        
        result := searchResult.Value()
        
        // Send businesses to channel
        for _, business := range result.Businesses {
            if collected >= req.Limit {
                break
            }
            
            resultChan <- business
            collected++
        }
        
        // Check if more results
        if !result.HasMore {
            break
        }
        
        page++
        
        // Rate limiting
        time.Sleep(p.delay)
    }
    
    return nil
}
```

---

## 6. Job Scheduler

### 6.1 Scheduler Manager

```go
type SchedulerManager struct {
    scheduler       *gocron.Scheduler
    db              *sql.DB
    scraper         *MapsScraper
    contactEnricher *ContactAggregator
    jobs            map[string]*gocron.Job
    mu              sync.RWMutex
}

func NewSchedulerManager(db *sql.DB, scraper *MapsScraper, enricher *ContactAggregator) *SchedulerManager {
    scheduler := gocron.NewScheduler(time.UTC)
    scheduler.StartAsync()
    
    manager := &SchedulerManager{
        scheduler:       scheduler,
        db:              db,
        scraper:         scraper,
        contactEnricher: enricher,
        jobs:            make(map[string]*gocron.Job),
    }
    
    // Resume pending jobs from DB
    manager.resumePendingJobs()
    
    return manager
}

func (m *SchedulerManager) CreateJob(req MapsSearchRequest) appfault.Result[*MapsJob] {
    job := &MapsJob{
        Id:              generateJobId(),
        Query:           req.Query,
        Industry:        req.Industry,
        Location:        req.Location,
        TargetCount:     req.Limit,
        BatchSize:       req.BatchSize,
        IntervalSeconds: int(req.Interval.Seconds()),
        Status:          JobStatusQueued,
        Phase:           PhaseSearching,
        EnrichContacts:  req.EnrichContacts,
        DeepEnrich:      req.DeepEnrich,
        DelayMs:         int(req.Delay.Milliseconds()),
        MaxRetries:      3,
        CreatedAt:       time.Now(),
    }
    
    // Calculate batch size if not specified
    if job.BatchSize == 0 {
        job.BatchSize = 30
    }
    if job.IntervalSeconds == 0 {
        job.IntervalSeconds = 120 // 2 minutes
    }
    
    // Save to database
    if err := m.saveJob(job); err != nil {
        return appfault.Fail[*MapsJob](
            appfault.Wrap(
                err,
                "save job",
            ),
        )
    }
    
    // Schedule job
    if err := m.scheduleJob(job); err != nil {
        return appfault.Fail[*MapsJob](
            appfault.Wrap(
                err,
                "schedule job",
            ),
        )
    }
    
    return appfault.Ok(job)
}

func (m *SchedulerManager) scheduleJob(job *MapsJob) *appfault.AppError {
    // Create gocron job
    cronJob, err := m.scheduler.Every(job.IntervalSeconds).Seconds().Do(func() {
        m.executeJobBatch(job.Id)
    })
    if err != nil {
        return appfault.Wrap(
            err,
            "create gocron job",
        )
    }
    
    m.mu.Lock()
    m.jobs[job.Id] = cronJob
    m.mu.Unlock()
    
    // Execute first batch immediately
    go m.executeJobBatch(job.Id)
    
    return nil
}

func (m *SchedulerManager) executeJobBatch(jobId string) {
    // Load job from DB
    job, err := m.loadJob(jobId)
    if err != nil {
        m.logError(jobId, "Failed to load job", err)
        return
    }
    
    // Check if job should run
    if job.Status != JobStatusQueued && job.Status != JobStatusRunning {
        return
    }
    
    // Update status
    job.Status = JobStatusRunning
    if job.StartedAt == nil {
        now := time.Now()
        job.StartedAt = &now
    }
    m.updateJobStatus(job)
    
    // Execute batch based on phase
    switch job.Phase {
    case PhaseSearching:
        m.executeSearchBatch(job)
    case PhaseEnriching:
        m.executeEnrichBatch(job)
    case PhaseFinishing:
        m.finishJob(job)
    }
}

func (m *SchedulerManager) executeSearchBatch(job *MapsJob) {
    // Create search request
    req := MapsSearchRequest{
        Query:    job.Query,
        Location: job.Location,
        Limit:    job.BatchSize,
    }
    
    searchCtx, cancel := stdctx.WithTimeout(stdctx.Background(), 5*time.Minute)
    defer cancel()
    
    // Search
    searchResult := m.scraper.Search(searchCtx, req)
    if searchResult.HasError() {
        m.handleJobError(job, searchResult.Error())
        return
    }
    
    result := searchResult.Value()
    
    // Save businesses
    for _, business := range result.Businesses {
        if err := m.saveBusiness(job.Id, business); err != nil {
            m.logError(job.Id, "Failed to save business", err)
        } else {
            job.CollectedCount++
        }
    }
    
    // Check if collection complete
    if job.CollectedCount >= job.TargetCount || !result.HasMore {
        if job.EnrichContacts {
            job.Phase = PhaseEnriching
        } else {
            job.Phase = PhaseFinishing
        }
    }
    
    // Update next run
    nextRun := time.Now().Add(time.Duration(job.IntervalSeconds) * time.Second)
    job.NextRunAt = &nextRun
    
    m.updateJobStatus(job)
    m.logInfo(job.Id, fmt.Sprintf("Collected %d/%d businesses", job.CollectedCount, job.TargetCount))
}

func (m *SchedulerManager) executeEnrichBatch(job *MapsJob) {
    // Get businesses needing enrichment
    businesses, err := m.getUnenrichedBusinesses(job.Id, job.BatchSize)
    if err != nil {
        m.handleJobError(job, err)
        return
    }
    
    if len(businesses) == 0 {
        job.Phase = PhaseFinishing
        m.updateJobStatus(job)
        return
    }
    
    // Enrich with contact info
    for _, business := range businesses {
        if business.Website == "" {
            continue
        }
        
        enrichCtx, cancel := stdctx.WithTimeout(stdctx.Background(), 30*time.Second)
        
        contactResult := m.contactEnricher.Extract(enrichCtx, ContactExtractionRequest{
            Url:  business.Website,
            Deep: job.DeepEnrich,
        })
        cancel()
        
        if contactResult.HasError() {
            m.logWarn(job.Id, fmt.Sprintf("Contact extraction failed for %s: %v", business.Name, contactResult.Error()))
            continue
        }
        
        // Update business with contact
        contact := contactResult.Value()
        business.Contact = contact.Contact
        business.ContactEnriched = true
        m.updateBusiness(job.Id, business)
        job.EnrichedCount++
        
        // Delay between extractions
        time.Sleep(time.Duration(job.DelayMs) * time.Millisecond)
    }
    
    m.updateJobStatus(job)
    m.logInfo(job.Id, fmt.Sprintf("Enriched %d/%d businesses", job.EnrichedCount, job.CollectedCount))
}

func (m *SchedulerManager) finishJob(job *MapsJob) {
    now := time.Now()
    job.Status = JobStatusCompleted
    job.CompletedAt = &now
    
    // Remove from scheduler
    m.mu.Lock()
    if cronJob, ok := m.jobs[job.Id]; ok {
        m.scheduler.RemoveByReference(cronJob)
        delete(m.jobs, job.Id)
    }
    m.mu.Unlock()
    
    m.updateJobStatus(job)
    m.logInfo(job.Id, fmt.Sprintf("Job completed: %d businesses, %d enriched", job.CollectedCount, job.EnrichedCount))
}

func (m *SchedulerManager) handleJobError(job *MapsJob, err error) {
    job.RetryCount++
    job.LastError = err.Error()
    
    if job.RetryCount >= job.MaxRetries {
        job.Status = JobStatusFailed
        m.finishJob(job)
        return
    }
    
    // Exponential backoff
    backoff := time.Duration(job.RetryCount*job.RetryCount) * time.Minute
    nextRun := time.Now().Add(backoff)
    job.NextRunAt = &nextRun
    
    m.updateJobStatus(job)
    m.logWarn(job.Id, fmt.Sprintf("Job error (retry %d/%d): %v", job.RetryCount, job.MaxRetries, err))
}
```

### 6.2 Job Control

```go
func (m *SchedulerManager) PauseJob(jobId string) *appfault.AppError {
    job, err := m.loadJob(jobId)
    if err != nil {
        return appfault.Wrap(
            err,
            "load job for pause",
        )
    }
    
    if job.Status != JobStatusRunning && job.Status != JobStatusQueued {
        return appfault.New(
            "job not in running or queued state",
        )
    }
    
    // Stop scheduled execution
    m.mu.Lock()
    if cronJob, ok := m.jobs[jobId]; ok {
        m.scheduler.RemoveByReference(cronJob)
        delete(m.jobs, jobId)
    }
    m.mu.Unlock()
    
    now := time.Now()
    job.Status = JobStatusPaused
    job.PausedAt = &now
    job.NextRunAt = nil
    
    return m.updateJobStatus(job)
}

func (m *SchedulerManager) ResumeJob(jobId string) *appfault.AppError {
    job, err := m.loadJob(jobId)
    if err != nil {
        return appfault.Wrap(
            err,
            "load job for resume",
        )
    }
    
    if job.Status != JobStatusPaused {
        return appfault.New(
            "job not in paused state",
        )
    }
    
    job.Status = JobStatusQueued
    job.PausedAt = nil
    
    if appErr := m.updateJobStatus(job); appErr != nil {
        return appErr
    }
    
    return m.scheduleJob(job)
}

func (m *SchedulerManager) CancelJob(jobId string) *appfault.AppError {
    job, err := m.loadJob(jobId)
    if err != nil {
        return appfault.Wrap(
            err,
            "load job for cancel",
        )
    }
    
    // Stop scheduled execution
    m.mu.Lock()
    if cronJob, ok := m.jobs[jobId]; ok {
        m.scheduler.RemoveByReference(cronJob)
        delete(m.jobs, jobId)
    }
    m.mu.Unlock()
    
    now := time.Now()
    job.Status = JobStatusCancelled
    job.CompletedAt = &now
    
    return m.updateJobStatus(job)
}

func (m *SchedulerManager) resumePendingJobs() {
    jobs, err := m.loadJobsByStatus(JobStatusQueued, JobStatusRunning)
    if err != nil {
        return
    }
    
    for _, job := range jobs {
        if err := m.scheduleJob(&job); err != nil {
            m.logError(job.Id, "Failed to resume job", err)
        }
    }
}
```

---

## 7. Database Schema

### 7.1 Root DB

```sql
-- Root DB: data/{appName}/rag/maps/registry.db

CREATE TABLE MapsJobs (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    industry TEXT,
    location TEXT NOT NULL,
    
    -- Targets
    target_count INTEGER NOT NULL,
    collected_count INTEGER DEFAULT 0,
    enriched_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    
    -- Scheduling
    batch_size INTEGER DEFAULT 30,
    interval_seconds INTEGER DEFAULT 120,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'pending',
    phase TEXT DEFAULT 'searching',
    current_page INTEGER DEFAULT 0,
    total_pages INTEGER DEFAULT 0,
    
    -- Timing
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    paused_at DATETIME,
    completed_at DATETIME,
    next_run_at DATETIME,
    
    -- Errors
    last_error TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Configuration
    enrich_contacts BOOLEAN DEFAULT FALSE,
    deep_enrich BOOLEAN DEFAULT FALSE,
    delay_ms INTEGER DEFAULT 1000
);

CREATE TABLE JobLogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT NOT NULL,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    details TEXT,                             -- JSON
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES MapsJobs(id)
);

CREATE TABLE SearchTermIndex (
    query_hash TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    location TEXT NOT NULL,
    job_ids TEXT NOT NULL,                    -- JSON array
    last_searched DATETIME,
    total_results INTEGER DEFAULT 0
);

CREATE INDEX IdxJobsStatus ON MapsJobs(status);
CREATE INDEX IdxJobsLocation ON MapsJobs(location);
CREATE INDEX IdxLogsJob ON JobLogs(job_id);
CREATE INDEX IdxLogsTimestamp ON JobLogs(timestamp);
```

### 7.2 Session DB (Per Job)

```sql
-- Session DB: data/{appName}/rag/maps/results/{job-id}.db

CREATE TABLE Businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    place_id TEXT UNIQUE,
    name TEXT NOT NULL,
    category TEXT,
    categories TEXT,                          -- JSON array
    
    -- Location
    address TEXT,
    street_address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    latitude REAL,
    longitude REAL,
    plus_code TEXT,
    
    -- Contact (from Maps)
    phone TEXT,
    website TEXT,
    
    -- Metrics
    rating REAL,
    reviews_count INTEGER,
    price_level INTEGER,
    
    -- Hours
    hours TEXT,                               -- JSON
    open_now BOOLEAN,
    
    -- Rich data
    photos TEXT,                              -- JSON array
    description TEXT,
    attributes TEXT,                          -- JSON
    
    -- Enrichment
    contact_id INTEGER,                       -- FK to Contacts table
    contact_enriched BOOLEAN DEFAULT FALSE,
    enriched_at DATETIME,
    
    -- Metadata
    maps_url TEXT,
    extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (contact_id) REFERENCES Contacts(id)
);

CREATE TABLE Contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_id INTEGER NOT NULL,
    
    -- Emails
    email_1 TEXT,
    email_2 TEXT,
    email_3 TEXT,
    email_4 TEXT,
    email_5 TEXT,
    
    -- Phones
    phone_1 TEXT,
    phone_2 TEXT,
    phone_3 TEXT,
    phone_4 TEXT,
    phone_5 TEXT,
    
    -- Socials
    linkedin TEXT,
    facebook TEXT,
    twitter TEXT,
    instagram TEXT,
    youtube TEXT,
    tiktok TEXT,
    whatsapp TEXT,
    
    -- Metadata
    extracted_from TEXT,                      -- JSON array
    confidence REAL,
    extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (business_id) REFERENCES Businesses(id)
);

CREATE INDEX IdxBusinessesCategory ON Businesses(category);
CREATE INDEX IdxBusinessesRating ON Businesses(rating);
CREATE INDEX IdxBusinessesEnriched ON Businesses(contact_enriched);
CREATE INDEX IdxContactsBusiness ON Contacts(business_id);
```

---

## 8. Configuration

```yaml
# config/gsearch.seed.yaml
maps:
  cache:
    ttl_days: 90                # Business data cache
    cleanup_interval: 24h
    max_jobs: 1000
    
  scraper:
    headless: true
    proxy_enabled: false
    rotate_proxy: true
    min_delay_ms: 1500
    max_delay_ms: 3000
    page_timeout_seconds: 30
    scroll_pause_ms: 800
    max_retries: 3
    
  scheduling:
    default_batch_size: 30
    default_interval_seconds: 120
    min_interval_seconds: 60
    max_concurrent_jobs: 5
    max_jobs_per_location: 10
    job_retention_days: 365
    
  enrichment:
    enabled: true
    deep_default: false
    concurrency: 2
    timeout_seconds: 30
    
  limits:
    max_results_per_search: 1000
    max_daily_searches: 500
    
  categories:
    home_services:
      - plumbers
      - electricians
      - hvac
      - roofers
      - landscapers
    health:
      - dentists
      - doctors
      - chiropractors
      - therapists
    food:
      - restaurants
      - cafes
      - bakeries
      - bars
```

---

## 9. Error Handling

### 9.1 Error Codes (7780-7799)

| Code | Constant | Description |
|------|----------|-------------|
| 7780 | `ErrMapsQueryInvalid` | Empty or malformed query |
| 7781 | `ErrMapsLocationInvalid` | Invalid or unrecognized location |
| 7782 | `ErrMapsScrapeFailed` | Failed to scrape Google Maps |
| 7783 | `ErrMapsCaptcha` | CAPTCHA detected |
| 7784 | `ErrMapsRateLimited` | Rate limit exceeded |
| 7785 | `ErrMapsNoResults` | No results found |
| 7786 | `ErrMapsJobNotFound` | Job ID not found |
| 7787 | `ErrMapsJobExists` | Duplicate job for query/location |
| 7788 | `ErrMapsJobNotRunning` | Job not in running state |
| 7789 | `ErrMapsJobNotPaused` | Job not in paused state |
| 7790 | `ErrMapsJobLimitExceeded` | Max concurrent jobs exceeded |
| 7791 | `ErrMapsEnrichmentFailed` | Contact enrichment failed |
| 7792 | `ErrMapsSchedulerFailed` | Scheduler error |
| 7793 | `ErrMapsExportFailed` | Export failed |
| 7794 | `ErrMapsBatchFailed` | Batch processing failed |

---

## 10. API Endpoints

```
POST /api/v1/maps/search           # Immediate search
POST /api/v1/maps/search/scheduled # Create scheduled job

GET  /api/v1/maps/jobs             # List all jobs
GET  /api/v1/maps/jobs/{id}        # Get job details
GET  /api/v1/maps/jobs/{id}/logs   # Get job logs
PUT  /api/v1/maps/jobs/{id}/pause  # Pause job
PUT  /api/v1/maps/jobs/{id}/resume # Resume job
DELETE /api/v1/maps/jobs/{id}      # Cancel job

GET  /api/v1/maps/results/{id}     # Get job results
GET  /api/v1/maps/results/{id}/export # Export results

GET  /api/v1/maps/businesses/{place_id} # Get single business
```

---

## 11. JSON Response Examples

### 11.1 Job Status Response

```json
{
  "success": true,
  "job": {
    "id": "maps_job_abc123",
    "query": "plumbers",
    "location": "New York, NY",
    "target_count": 500,
    "collected_count": 245,
    "enriched_count": 180,
    "status": "running",
    "phase": "enriching",
    "batch_size": 30,
    "interval_seconds": 120,
    "created_at": "2026-02-04T10:00:00Z",
    "started_at": "2026-02-04T10:00:05Z",
    "next_run_at": "2026-02-04T10:14:00Z",
    "progress_percent": 49,
    "estimated_completion": "2026-02-04T11:30:00Z"
  }
}
```

### 11.2 Business Result

```json
{
  "place_id": "ChIJ...",
  "name": "ABC Plumbing",
  "category": "Plumber",
  "address": "123 Main St, New York, NY 10001",
  "phone": "+1 (212) 555-1234",
  "website": "https://abcplumbing.com",
  "rating": 4.8,
  "reviews_count": 234,
  "latitude": 40.7128,
  "longitude": -74.006,
  "hours": {
    "monday": "8:00 AM – 6:00 PM",
    "tuesday": "8:00 AM – 6:00 PM"
  },
  "contact": {
    "email_1": "info@abcplumbing.com",
    "phone_1": "+1 (212) 555-1234",
    "linkedin": "https://linkedin.com/company/abc-plumbing",
    "facebook": "https://facebook.com/abcplumbing"
  },
  "contact_enriched": true,
  "maps_url": "https://maps.google.com/?cid=..."
}
```

---

## 12. Related Files

- Plan: `41-business-intelligence-plan.md`
- Phase 4: `45-contact-extraction.md`
- Phase 6: `47-response-formatting-caching.md`
- Scheduler: Uses `go-co-op/gocron`
