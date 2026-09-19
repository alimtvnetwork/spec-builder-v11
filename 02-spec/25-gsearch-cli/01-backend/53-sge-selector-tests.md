# SGE/PAA Selector Validation Tests

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Status:** Active  
**Related:** `43-faq-discovery-ai-overview.md`

---

## Overview

Automated test suite to verify that 2026 SGE (Search Generative Experience) and PAA (People Also Ask) selectors continue to function against live Google search results. These tests should run on a schedule to detect selector breakage early.

---

## Test Strategy

### Execution Modes

| Mode | Frequency | Purpose |
|------|-----------|---------|
| CI Integration | On PR merge | Catch regressions |
| Scheduled | Daily at 06:00 UTC | Detect Google changes |
| Manual | On-demand | Debug failures |
| Smoke | Hourly | Critical path only |

### Rate Limiting

- **Max requests per run:** 20
- **Delay between requests:** 3-5 seconds (randomized)
- **Backoff on 429:** Exponential (5s, 15s, 45s, stop)
- **Proxy rotation:** Required for CI runs

---

## Test Queries

### AI Overview Trigger Queries

These queries are known to consistently trigger AI Overview responses:

```go
var sgeTestQueries = []TestQuery{
    // Definitional queries (high AI Overview rate)
    {Query: "what is photosynthesis", ExpectSge: true, Category: "definition"},
    {Query: "how does blockchain work", ExpectSge: true, Category: "explanation"},
    {Query: "why is the sky blue", ExpectSge: true, Category: "science"},
    
    // Comparison queries
    {Query: "iphone vs android", ExpectSge: true, Category: "comparison"},
    {Query: "react vs vue", ExpectSge: true, Category: "comparison"},
    
    // How-to queries
    {Query: "how to make sourdough bread", ExpectSge: true, Category: "howto"},
    {Query: "how to change a tire", ExpectSge: true, Category: "howto"},
    
    // Health queries (may have disclaimers)
    {Query: "symptoms of flu", ExpectSge: true, Category: "health"},
    
    // Product queries
    {Query: "best laptop for programming 2026", ExpectSge: true, Category: "product"},
    
    // Local-intent (may not trigger SGE)
    {Query: "pizza near me", ExpectSge: false, Category: "local"},
}
```

### PAA Trigger Queries

```go
var paaTestQueries = []TestQuery{
    // High PAA probability queries
    {Query: "how to start a business", ExpectPaa: true, MinQuestions: 4},
    {Query: "what is machine learning", ExpectPaa: true, MinQuestions: 4},
    {Query: "best programming language", ExpectPaa: true, MinQuestions: 3},
    {Query: "how to learn python", ExpectPaa: true, MinQuestions: 4},
    {Query: "benefits of meditation", ExpectPaa: true, MinQuestions: 3},
    
    // Navigational (lower PAA probability)
    {Query: "facebook login", ExpectPaa: false, MinQuestions: 0},
}
```

---

## Selector Test Cases

### SGE Container Selector Tests

```go
package sge_test

import (
    "testing"
    "time"
    
    "github.com/go-rod/rod"
    "github.com/go-rod/stealth"
)

// TestSgeContainerSelectors2026 validates all SGE container selectors
func TestSgeContainerSelectors2026(t *testing.T) {
    browser := rod.New().MustConnect()
    defer browser.MustClose()
    
    page := stealth.MustPage(browser)
    defer page.MustClose()
    
    testCases := []struct {
        name     string
        selector string
        priority int
        query    string
    }{
        // Priority 1 selectors
        {"SGE Response Data", "div[data-sgrd='true']", 1, "what is photosynthesis"},
        {"AI Overview Primary", "div[jsname='Cpkphb']", 1, "how does blockchain work"},
        {"SGE Answer Block", "div[data-attrid='SGEAnswer']", 1, "why is the sky blue"},
        {"Knowledge Card AI", "div.kc-header-container[data-lk]", 2, "what is machine learning"},
        
        // Priority 2 selectors
        {"Nested SGE", "div[data-hveid][data-ved] > div[data-sgrd]", 2, "how to invest money"},
        {"Summary Block", "div.bSaLhf", 3, "benefits of exercise"},
        {"Interactive AI", "div[jscontroller='LbZQod']", 3, "iphone vs android"},
        
        // Legacy selectors
        {"Legacy Description", "div[data-attrid='wa:/description']", 4, "what is DNA"},
        {"Knowledge Panel", "div.kp-blk.c2xzTb", 4, "famous scientists"},
        {"Markdown Container", "div[data-md]", 4, "how to cook pasta"},
        {"Universal Snippet", "div.ULSxyf", 5, "weather forecast"},
    }
    
    results := make([]SelectorTestResult, 0)
    
    for _, tc := range testCases {
        t.Run(tc.name, func(t *testing.T) {
            result := testSelector(page, tc.query, tc.selector, tc.priority)
            results = append(results, result)
            
            if !result.Found && tc.priority <= 2 {
                t.Logf("WARNING: Priority %d selector not found: %s", tc.priority, tc.selector)
            }
        })
        
        // Rate limiting
        time.Sleep(randomDelay(3*time.Second, 5*time.Second))
    }
    
    // Generate report
    generateSelectorReport(results)
}

// SelectorTestResult captures test outcome
type SelectorTestResult struct {
    Name       string
    Selector   string
    Priority   int
    Query      string
    Found      bool
    ElementCount int
    HasContent bool
    Timestamp  time.Time
    Duration   time.Duration
    Error      string
}

func testSelector(page *rod.Page, query, selector string, priority int) SelectorTestResult {
    start := time.Now()
    result := SelectorTestResult{
        Selector:  selector,
        Priority:  priority,
        Query:     query,
        Timestamp: start,
    }
    
    // Navigate to Google search
    searchUrl := "https://www.google.com/search?q=" + url.QueryEscape(query)
    if err := page.Navigate(searchUrl); err != nil {
        result.Error = err.Error()
        return result
    }
    
    page.MustWaitLoad()
    time.Sleep(2 * time.Second) // Wait for dynamic content
    
    // Test selector
    elements, err := page.Elements(selector)
    if err != nil {
        result.Error = err.Error()
        return result
    }
    
    result.Found = len(elements) > 0
    result.ElementCount = len(elements)
    result.Duration = time.Since(start)
    
    if result.Found {
        // Check if element has meaningful content
        text := elements[0].MustText()
        result.HasContent = len(text) > 50
    }
    
    return result
}
```

### PAA Container Selector Tests

```go
// TestPaaContainerSelectors2026 validates all PAA container selectors
func TestPaaContainerSelectors2026(t *testing.T) {
    browser := rod.New().MustConnect()
    defer browser.MustClose()
    
    page := stealth.MustPage(browser)
    defer page.MustClose()
    
    testCases := []struct {
        name     string
        selector string
        priority int
        query    string
    }{
        // Priority 1 PAA selectors
        {"PAA in AI Container", "div[jsname='Cpkphb'] div.related-question-pair", 1, "how to start a business"},
        {"Interactive PAA", "div[data-initq] div.wWOJcd", 1, "what is machine learning"},
        {"PAA Button Format", "div[jsname='yEVEwb'] div[role='button']", 1, "how to learn python"},
        
        // Priority 2 PAA selectors
        {"Classic PAA Pair", "div.related-question-pair", 2, "best programming language"},
        {"Named PAA Container", "div[jsname='N760b']", 2, "benefits of meditation"},
        {"SGE-integrated PAA", "div[data-sgrd] div[role='button']", 2, "how to cook healthy"},
        
        // Priority 3 (legacy)
        {"Legacy PAA Class", "div.wWOJcd", 3, "home workout tips"},
        {"Data-question Container", "div[data-q]", 3, "productivity tips"},
    }
    
    for _, tc := range testCases {
        t.Run(tc.name, func(t *testing.T) {
            result := testPaaSelector(page, tc.query, tc.selector, tc.priority)
            
            if !result.Found && tc.priority <= 2 {
                t.Errorf("Priority %d PAA selector not found: %s for query: %s", 
                    tc.priority, tc.selector, tc.query)
            }
            
            if result.Found && result.QuestionCount < 3 {
                t.Logf("Warning: Only %d PAA questions found (expected 3+)", result.QuestionCount)
            }
        })
        
        time.Sleep(randomDelay(3*time.Second, 5*time.Second))
    }
}

type PaaTestResult struct {
    SelectorTestResult
    QuestionCount int
    CanExpand     bool
    HasAnswers    bool
}

func testPaaSelector(page *rod.Page, query, selector string, priority int) PaaTestResult {
    base := testSelector(page, query, selector, priority)
    result := PaaTestResult{SelectorTestResult: base}
    
    if !base.Found {
        return result
    }
    
    // Count questions
    elements, _ := page.Elements(selector)
    result.QuestionCount = len(elements)
    
    // Test expansion
    if len(elements) > 0 {
        elements[0].MustClick()
        time.Sleep(500 * time.Millisecond)
        
        // Check for answer content
        for _, answerSel := range paaAnswerSelectors2026 {
            if answerEl, err := elements[0].Element(answerSel); err == nil && answerEl != nil {
                text := answerEl.MustText()
                result.HasAnswers = len(text) > 20
                result.CanExpand = true
                break
            }
        }
    }
    
    return result
}
```

### SGE Content Selector Tests

```go
// TestSgeContentSelectors2026 validates content extraction within SGE containers
func TestSgeContentSelectors2026(t *testing.T) {
    browser := rod.New().MustConnect()
    defer browser.MustClose()
    
    page := stealth.MustPage(browser)
    defer page.MustClose()
    
    // Use a query known to trigger rich SGE response
    query := "how does photosynthesis work"
    searchUrl := "https://www.google.com/search?q=" + url.QueryEscape(query)
    page.MustNavigate(searchUrl).MustWaitLoad()
    time.Sleep(2 * time.Second)
    
    // Find SGE container first
    var sgeContainer *rod.Element
    for _, sel := range sgeContainerSelectors2026 {
        if el, err := page.Element(sel.Selector); err == nil && el != nil {
            sgeContainer = el
            break
        }
    }
    
    if sgeContainer == nil {
        t.Skip("No SGE container found - may not be available for this query/region")
        return
    }
    
    t.Run("Summary Extraction", func(t *testing.T) {
        for _, sel := range sgeContentSelectors2026.Summary {
            if el, err := sgeContainer.Element(sel); err == nil && el != nil {
                text := el.MustText()
                if len(text) > 100 {
                    t.Logf("✓ Summary found with selector: %s (%d chars)", sel, len(text))
                    return
                }
            }
        }
        t.Error("No summary content found with any selector")
    })
    
    t.Run("Citation Extraction", func(t *testing.T) {
        for _, sel := range sgeContentSelectors2026.Citations {
            elements, err := sgeContainer.Elements(sel)
            if err == nil && len(elements) > 0 {
                t.Logf("✓ Found %d citations with selector: %s", len(elements), sel)
                
                // Verify citation has href
                href, _ := elements[0].Attribute("href")
                if href != nil && *href != "" {
                    t.Logf("  First citation URL: %s", *href)
                }
                return
            }
        }
        t.Error("No citations found with any selector")
    })
    
    t.Run("Bullet Points", func(t *testing.T) {
        for _, sel := range sgeContentSelectors2026.BulletPoints {
            elements, err := sgeContainer.Elements(sel)
            if err == nil && len(elements) > 0 {
                t.Logf("✓ Found %d bullet points with selector: %s", len(elements), sel)
                return
            }
        }
        t.Log("No bullet points found (may not be present for this query)")
    })
    
    t.Run("Follow-up Questions", func(t *testing.T) {
        for _, sel := range sgeContentSelectors2026.FollowUps {
            elements, err := page.Elements(sel) // Search full page
            if err == nil && len(elements) > 0 {
                t.Logf("✓ Found %d follow-up questions with selector: %s", len(elements), sel)
                return
            }
        }
        t.Log("No follow-up questions found (may not be present)")
    })
}
```

---

## Heuristic Detection Tests

```go
// TestHeuristicDetection validates fallback detection when selectors fail
func TestHeuristicDetection(t *testing.T) {
    browser := rod.New().MustConnect()
    defer browser.MustClose()
    
    page := stealth.MustPage(browser)
    defer page.MustClose()
    
    testCases := []struct {
        name          string
        query         string
        expectSge     bool
        minCitations  int
    }{
        {"Definition Query", "what is quantum computing", true, 2},
        {"How-to Query", "how to tie a tie", true, 1},
        {"Comparison Query", "python vs javascript", true, 2},
        {"Navigational Query", "youtube.com", false, 0},
    }
    
    for _, tc := range testCases {
        t.Run(tc.name, func(t *testing.T) {
            searchUrl := "https://www.google.com/search?q=" + url.QueryEscape(tc.query)
            page.MustNavigate(searchUrl).MustWaitLoad()
            time.Sleep(2 * time.Second)
            
            // Try heuristic detection
            result := heuristicDetect2026(page)
            
            if tc.expectSge {
                if result == nil {
                    t.Logf("Warning: Heuristic detection failed for: %s", tc.query)
                } else {
                    t.Log("✓ Heuristic detection succeeded")
                    
                    // Verify citation count
                    html, _ := result.Html()
                    citationCount := strings.Count(html, "data-ved")
                    if citationCount < tc.minCitations {
                        t.Logf("Warning: Expected %d+ citations, found %d", 
                            tc.minCitations, citationCount)
                    }
                }
            } else {
                if result != nil {
                    t.Logf("Warning: Heuristic detected SGE for non-SGE query: %s", tc.query)
                }
            }
        })
        
        time.Sleep(randomDelay(3*time.Second, 5*time.Second))
    }
}
```

---

## Confidence Scoring Tests

```go
// TestConfidenceScoring validates priority-based confidence calculation
func TestConfidenceScoring(t *testing.T) {
    testCases := []struct {
        priority       int
        expectedMin    float64
        expectedMax    float64
    }{
        {1, 0.85, 1.0},
        {2, 0.70, 0.85},
        {3, 0.55, 0.70},
        {4, 0.40, 0.55},
        {5, 0.40, 0.55},
        {6, 0.35, 0.45},
    }
    
    for _, tc := range testCases {
        t.Run(fmt.Sprintf("Priority_%d", tc.priority), func(t *testing.T) {
            confidence := calculateConfidenceFromPriority(tc.priority)
            
            if confidence < tc.expectedMin || confidence > tc.expectedMax {
                t.Errorf("Priority %d: confidence %.2f outside range [%.2f, %.2f]",
                    tc.priority, confidence, tc.expectedMin, tc.expectedMax)
            }
        })
    }
}

func calculateConfidenceFromPriority(priority int) float64 {
    confidence := 1.0 - (float64(priority-1) * 0.15)
    if confidence < 0.4 {
        confidence = 0.4
    }
    return confidence
}
```

---

## Response Type Detection Tests

```go
// TestResponseTypeDetection validates SGE response format classification
func TestResponseTypeDetection(t *testing.T) {
    testCases := []struct {
        html         string
        expectedType string
    }{
        {"<div><p>This is a summary paragraph about the topic.</p></div>", "summary"},
        {"<div><ul><li>First item</li><li>Second item</li></ul></div>", "list"},
        {"<div><ol><li>Step 1</li><li>Step 2</li></ol></div>", "list"},
        {"<div><table><tr><td>A</td><td>B</td></tr></table></div>", "comparison"},
        {"<div><p>iPhone vs Android comparison</p></div>", "comparison"},
        {"<div><p>A versus B analysis</p></div>", "comparison"},
    }
    
    for _, tc := range testCases {
        t.Run(tc.expectedType, func(t *testing.T) {
            doc, _ := goquery.NewDocumentFromReader(strings.NewReader(tc.html))
            block := doc.Find("div").First()
            
            result := detectResponseType(block)
            
            if result != tc.expectedType {
                t.Errorf("Expected %s, got %s for HTML: %s", 
                    tc.expectedType, result, tc.html[:50])
            }
        })
    }
}
```

---

## Integration Tests

```go
// TestFullExtractionPipeline validates end-to-end FAQ extraction
func TestFullExtractionPipeline(t *testing.T) {
    if testing.Short() {
        t.Skip("Skipping integration test in short mode")
    }
    
    extractor := NewFaqExtractor(DefaultConfig())
    
    testCases := []struct {
        query          string
        expectSge      bool
        expectPaa      bool
        minFaqs        int
    }{
        {"what is machine learning", true, true, 3},
        {"how to learn programming", true, true, 4},
        {"benefits of meditation", true, true, 3},
    }
    
    for _, tc := range testCases {
        t.Run(tc.query, func(t *testing.T) {
            result, err := extractor.Extract(context.Background(), FaqDiscoveryRequest{
                Query:          tc.query,
                WithAiOverview: true,
                Depth:          2,
            })
            
            if err != nil {
                t.Fatalf("Extraction failed: %v", err)
            }
            
            // Verify AI Overview
            if tc.expectSge {
                if result.AiOverview == nil || !result.AiOverview.Available {
                    t.Error("Expected AI Overview but none found")
                } else {
                    t.Logf("✓ AI Overview found (confidence: %.2f, type: %s)",
                        result.AiOverview.Confidence, result.AiOverview.ResponseType)
                }
            }
            
            // Verify PAA/FAQ count
            if len(result.FaqItems) < tc.minFaqs {
                t.Errorf("Expected %d+ FAQs, got %d", tc.minFaqs, len(result.FaqItems))
            } else {
                t.Logf("✓ Found %d FAQ items", len(result.FaqItems))
            }
            
            // Verify question types are classified
            for _, faq := range result.FaqItems {
                if faq.QuestionType == "" {
                    t.Errorf("FAQ missing question type: %s", faq.Question[:50])
                }
            }
        })
        
        time.Sleep(5 * time.Second) // Longer delay between full extractions
    }
}
```

---

## Monitoring & Alerting

### Selector Health Dashboard

```go
// SelectorHealthReport aggregates test results for monitoring
type SelectorHealthReport struct {
    Timestamp       time.Time
    TotalSelectors  int
    WorkingCount    int
    FailedSelectors []FailedSelector
    SuccessRate     float64
    P1SuccessRate   float64 // Priority 1 only
    P2SuccessRate   float64 // Priority 2 only
}

type FailedSelector struct {
    Selector    string
    Priority    int
    Description string
    LastWorked  time.Time
    FailCount   int
}

// GenerateHealthReport creates monitoring output
func GenerateHealthReport(results []SelectorTestResult) SelectorHealthReport {
    report := SelectorHealthReport{
        Timestamp:      time.Now(),
        TotalSelectors: len(results),
    }
    
    var p1Total, p1Pass, p2Total, p2Pass int
    
    for _, r := range results {
        if r.Found {
            report.WorkingCount++
        } else {
            report.FailedSelectors = append(report.FailedSelectors, FailedSelector{
                Selector:    r.Selector,
                Priority:    r.Priority,
                Description: r.Name,
            })
        }
        
        if r.Priority == 1 {
            p1Total++
            if r.Found {
                p1Pass++
            }
        } else if r.Priority == 2 {
            p2Total++
            if r.Found {
                p2Pass++
            }
        }
    }
    
    report.SuccessRate = float64(report.WorkingCount) / float64(report.TotalSelectors)
    if p1Total > 0 {
        report.P1SuccessRate = float64(p1Pass) / float64(p1Total)
    }
    if p2Total > 0 {
        report.P2SuccessRate = float64(p2Pass) / float64(p2Total)
    }
    
    return report
}
```

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Overall Success Rate | < 80% | < 60% |
| Priority 1 Success | < 90% | < 70% |
| Priority 2 Success | < 80% | < 60% |
| Consecutive Failures | 3 | 5 |

### Alert Actions

```go
// AlertConfig for selector monitoring
type AlertConfig struct {
    WarningThreshold  float64 // 0.8
    CriticalThreshold float64 // 0.6
    SlackWebhook      string
    EmailRecipients   []string
    PagerDutyKey      string // For critical only
}

func checkAndAlert(report SelectorHealthReport, config AlertConfig) {
    if report.P1SuccessRate < config.CriticalThreshold {
        // Critical: Priority 1 selectors failing
        sendCriticalAlert(report, config)
        createGitHubIssue(report)
    } else if report.SuccessRate < config.WarningThreshold {
        // Warning: Overall health degraded
        sendWarningAlert(report, config)
    }
}
```

---

## Scheduled Test Configuration

### GitHub Actions Workflow

```yaml
# .github/workflows/sge-selector-tests.yml
name: SGE Selector Validation

on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 06:00 UTC
  workflow_dispatch:      # Manual trigger

jobs:
  test-selectors:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'
      
      - name: Install Chrome
        uses: browser-actions/setup-chrome@v1
      
      - name: Run Selector Tests
        run: |
          go test -v ./internal/bi/faq/... -run "Test.*Selectors2026" \
            -timeout 10m \
            -count=1
        env:
          HEADLESS: true
          PROXY_URL: ${{ secrets.PROXY_URL }}
      
      - name: Generate Report
        if: always()
        run: go run ./cmd/selector-report/main.go
      
      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: selector-report
          path: reports/selector-health-*.json
      
      - name: Notify on Failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "⚠️ SGE Selector Tests Failed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "SGE/PAA selectors may need updating. <${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View Details>"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Selector Update Procedure

When tests fail consistently:

1. **Investigate:** Open Chrome DevTools on Google search, inspect current SGE/PAA structure
2. **Document:** Note new selectors and their structure
3. **Update:** Modify `sgeContainerSelectors2026` / `paaContainerSelectors2026`
4. **Version:** Update selector version date in comments
5. **Test:** Run full test suite locally
6. **PR:** Create PR with selector updates and test evidence
7. **Monitor:** Watch next 24h of scheduled runs

---

## Cross-References

| Reference | Location |
|-----------|----------|
| FAQ Discovery Spec | `43-faq-discovery-ai-overview.md` |
| 2026 Selectors | `43-faq-discovery-ai-overview.md` (Section 5.1-5.2) |
| Error Codes | `50-bi-error-codes.md` (7720-7739) |
| Implementation Guide | `52-bi-implementation-guide.md` |
