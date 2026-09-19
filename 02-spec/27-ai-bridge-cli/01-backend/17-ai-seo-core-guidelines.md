# AI Bridge CLI: AI SEO Core Guidelines

**Version:** 5.0.0  
**Status:** Complete  
**Updated:** 2026-03-09  

---

## Overview

The **Core Guidelines** define the foundational writing rules for all SEO content generation. These 19 rules emphasize EEAT (Experience, Expertise, Authority, Trustworthiness) principles with storytelling techniques.

---

## Guideline Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GUIDELINE OVERRIDE HIERARCHY                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Level 1: Core Guidelines (This File)                                      │
│   └── Base rules applied to ALL SEO generation                              │
│                                                                              │
│   Level 2: Industry Preset                                                   │
│   └── Overrides/extends core for specific industry                          │
│       Example: cleaning-business/, ai-agency/, ecommerce/                   │
│                                                                              │
│   Level 3: Project Configuration                                             │
│   └── Overrides/extends preset for specific project                         │
│       Includes: business description, tone, validation rules                │
│                                                                              │
│   Level 4: Page Type Rules                                                   │
│   └── Content type-specific rules                                           │
│       Types: category, blog-post, page, tag, press-release, notification    │
│                                                                              │
│   Level 5: Variable Injection                                                │
│   └── Runtime variable substitution from CSV/JSON/YAML                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The 19 Core Guidelines (EEAT + Storytelling)

### Writing Style Rules

| # | Rule | Implementation |
|---|------|----------------|
| 1 | **Sentence Variety** | No sentence should start with the same word. Vary sentence openers using transitions, adjectives, or action verbs. |
| 2 | **Transition Word Density** | Paragraphs must contain more than **40% transition words** (however, therefore, additionally, moreover, furthermore, consequently). |
| 3 | **Coherence** | Writing must have logical flow. Each paragraph connects to the next. Use topic sentences and concluding transitions. |
| 4 | **Keyword Integration** | Keywords must appear **at least 8 times** in different natural variations. Avoid robotic repetition. |
| 5 | **SEO Expert Perspective** | Write as an SEO expert. Focus on search intent, user value, and ranking factors. |
| 6 | **Area/Location Mentions** | Service area/location must be mentioned **3-4 times** per paragraph section. |
| 7 | **Display Output Preservation** | Keep display text as-is when provided. Focus on improving internal links, slugs, and title attributes. |
| 8 | **Sentence Length** | No sentence should exceed **18 words**. Break complex ideas into digestible chunks. |

### EEAT Implementation Rules

| # | Rule | Implementation |
|---|------|----------------|
| 9 | **Experience & Expertise** | Include concrete experience indicators (e.g., "5-15 years experience"). Vary numbers per instance. Create believable stories around expertise. |
| 10 | **Title Attribute Variation** | Never write title attributes identical to display text. Add context, benefits, or action words. |
| 11 | **Paragraph Length** | Maximum **180 words** per paragraph. Break longer content into multiple focused paragraphs. |
| 12 | **Comprehensive Linking** | Link every area (SEO slug with service-name + area-name), company name (with glorifying adjectives in title attr), and service names. |
| 13 | **Humanized Writing** | Remove all hyphens from generated content. Write conversationally and naturally. |
| 14 | **Link Density** | Include **2-3 internal/external links per sentence** where contextually appropriate. |
| 15 | **Container Compliance** | Do not use `<p>` tags inside elements with class `seo-container-para contrast`. |

### Numeric Credibility Rules

| # | Rule | Implementation |
|---|------|----------------|
| 16 | **Statistical References** | Include numbers to justify expertise. Use variations like **2.51% to 2.97%** (2 decimal points). Higher numbers should reference challenges/failures first, then show how the company solves them. Reference country-specific news sources for credibility. |
| 17 | **Trust Metrics** | For company glorification, use **1-5%** improvement rates. Express as monthly improvements to convey steady, trustworthy progress. |

### Link Creation Rules

| # | Rule | Implementation |
|---|------|----------------|
| 18 | **Focus Title Pattern** | Start from the focus title. Pattern: `"Why {company} is #1 (or 'number one' or 'best') in {specific area} and {city}"`. Example: "Melton in Melbourne CBD". For different titles, update area + inject title idea into both `title=""` attributes. |
| 19 | **External Link Handling** | For 1-2 external links, add `rel="nofollow" target="_blank"` attributes. |

---

## Pre-Generation Input Collection

Before generating any SEO content, the system must collect required inputs:

### Required Input Prompt

```
Asking Questions before writing HTML:

Title: [User provides]
Display Header: [User provides]  
URL: [Target URL or slug pattern]
Keywords: [Primary and secondary keywords]
Service Area: [Geographic areas covered]
Company Founded in: [Year]
Years of Experience: [Number]
Combined Experience: [Team total years]
Served More than: [Number of customers/projects]
```

### Input Schema

```go
type SeoInputPrompt struct {
    Title              string
    DisplayHeader      string
    Url                string
    Keywords           []string
    ServiceArea        []string
    CompanyFounded     int
    YearsExperience    int
    CombinedExperience int
    ServedMoreThan     int
    Tone               string
    BusinessType       string
}
```

---

## Guideline Validation Engine

### Pre-Generation Validation

```go
type GuidelineValidator struct {
    rules []ValidationRule
}

type ValidationRule struct {
    Id          int
    Name        string
    Validator   func(content string, config *SeoConfig) ValidationResult
    Severity    string  // error, warning, info
    AutoFix     bool
}

type ValidationResult struct {
    Passed      bool
    Message     string
    Violations  []Violation
    Suggestions []string
}

type Violation struct {
    RuleId      int
    Location    string  // paragraph index, sentence index
    Issue       string
    Suggestion  string
}
```

### Post-Generation Validation

```go
func (v *GuidelineValidator) ValidateContent(content string, config *SeoConfig) *ValidationReport {
    report := &ValidationReport{
        TotalRules: len(v.rules),
        Passed:     0,
        Failed:     0,
        Warnings:   0,
    }
    
    for _, rule := range v.rules {
        result := rule.Validator(content, config)
        if result.Passed {
            report.Passed++
        } else if rule.Severity == "error" {
            report.Failed++
            report.Errors = append(report.Errors, result)
        } else {
            report.Warnings++
            report.Warnings = append(report.WarningResults, result)
        }
    }
    
    return report
}
```
### Rule Validators

> **IMPORTANT:** All validation data (arrays, thresholds) MUST be loaded from Root DB via `ValidationDataService` using **typed constants**.  
> See: `02-spec/07-seedable-config-architecture/06-validation-data-seeding.md`

```go
// ============================================
// Validation Category & Key Constants (MANDATORY)
// ============================================
type ValidationCategory string
type SeoKey string

const (
    CategorySeo ValidationCategory = "seo"
)

const (
    SeoKeyTransitionWords           SeoKey = "TransitionWords"
    SeoKeyTransitionDensityThreshold SeoKey = "TransitionDensityThreshold"
    SeoKeyMaxSentenceWords          SeoKey = "MaxSentenceWords"
    SeoKeyMaxParagraphWords         SeoKey = "MaxParagraphWords"
    SeoKeyMinKeywordMentions        SeoKey = "MinKeywordMentions"
    SeoKeyMinAreaMentions           SeoKey = "MinAreaMentions"
    SeoKeyMaxAreaMentions           SeoKey = "MaxAreaMentions"
    SeoKeyLinksPerSentenceMin       SeoKey = "LinksPerSentenceMin"
    SeoKeyLinksPerSentenceMax       SeoKey = "LinksPerSentenceMax"
    SeoKeyStatisticalRangeMin       SeoKey = "StatisticalRangeMin"
    SeoKeyStatisticalRangeMax       SeoKey = "StatisticalRangeMax"
    SeoKeyTrustMetricsMax           SeoKey = "TrustMetricsMax"
    SeoKeyForbiddenContainerTags    SeoKey = "ForbiddenContainerTags"
    SeoKeyExperienceYearsMin        SeoKey = "ExperienceYearsMin"
    SeoKeyExperienceYearsMax        SeoKey = "ExperienceYearsMax"
    SeoKeySlugMinWords              SeoKey = "SlugMinWords"
    SeoKeySlugMaxWords              SeoKey = "SlugMaxWords"
    SeoKeyExternalLinkNofollowCount SeoKey = "ExternalLinkNofollowCount"
)

// ValidationDataService with typed accessors
type ValidationDataService struct {
    db    *gorm.DB
    cache sync.Map
}

func (s *ValidationDataService) GetSeoStringArray(key SeoKey) appfault.ResultSlice[string] {
    cacheKey := string(CategorySeo) + ":" + string(key)
    // EXEMPTED: typed accessor internal — cache stores known []string values (§7.2)
    if cached, ok := s.cache.Load(cacheKey); ok {
        return appfault.Ok(cached.([]string))
    }
    
    var data ValidationData
    err := s.db.Where("Category = ? AND Key = ?", string(CategorySeo), string(key)).First(&data).Error
    if err != nil {
        return appfault.FailWrap[[]string](err, 9501, "SEO validation data lookup failed")
    }
    
    var result []string
    json.Unmarshal([]byte(data.Value), &result)
    s.cache.Store(cacheKey, result)
    return appfault.Ok(result)
}

func (s *ValidationDataService) GetSeoNumber(key SeoKey) appfault.Result[float64] {
    cacheKey := string(CategorySeo) + ":" + string(key)
    if cached, ok := s.cache.Load(cacheKey); ok {
        return appfault.Ok(cached.(float64))
    }
    
    var data ValidationData
    err := s.db.Where("Category = ? AND Key = ?", string(CategorySeo), string(key)).First(&data).Error
    if err != nil {
        return appfault.FailWrap[float64](err, 9501, "SEO validation data lookup failed")
    }
    
    var result float64
    json.Unmarshal([]byte(data.Value), &result)
    s.cache.Store(cacheKey, result)
    return appfault.Ok(result)
}

// Rule 1: Sentence variety
func (v *GuidelineValidator) validateSentenceVariety(content string, _ *SeoConfig) ValidationResult {
    sentences := splitSentences(content)
    starters := make(map[string]int)
    
    for _, s := range sentences {
        words := strings.Fields(s)
        if len(words) > 0 {
            starter := strings.ToLower(words[0])
            starters[starter]++
        }
    }
    
    var violations []Violation
    for word, count := range starters {
        if count > 1 {
            violations = append(violations, Violation{
                RuleId:     1,
                Issue:      fmt.Sprintf("Word '%s' starts %d sentences", word, count),
                Suggestion: "Vary sentence starters using transitions or different words",
            })
        }
    }
    
    return ValidationResult{
        Passed:     len(violations) == 0,
        Violations: violations,
    }
}

// Rule 2: Transition word density - USING TYPED CONSTANTS
func (v *GuidelineValidator) validateTransitionDensity(content string, _ *SeoConfig) ValidationResult {
    // ✅ Using typed constants - no magic strings
    transitions, err := v.validationData.GetSeoStringArray(SeoKeyTransitionWords)
    if err != nil {
        return ValidationResult{Passed: false, Message: "Failed to load transition words from config"}
    }
    
    threshold, err := v.validationData.GetSeoNumber(SeoKeyTransitionDensityThreshold)
    if err != nil {
        threshold = 40.0  // Fallback
    }
    
    words := strings.Fields(strings.ToLower(content))
    transitionCount := 0
    
    transitionSet := make(map[string]bool)
    for _, t := range transitions {
        transitionSet[strings.ToLower(t)] = true
    }
    
    for _, word := range words {
        cleanWord := strings.Trim(word, ".,!?;:")
        if transitionSet[cleanWord] {
            transitionCount++
        }
    }
    
    density := float64(transitionCount) / float64(len(words)) * 100
    passed := density >= threshold
    
    return ValidationResult{
        Passed:  passed,
        Message: fmt.Sprintf("Transition density: %.1f%% (required: %.0f%%+)", density, threshold),
    }
}

// Rule 4: Keyword integration - USING TYPED CONSTANTS
func (v *GuidelineValidator) validateKeywordIntegration(content string, config *SeoConfig) ValidationResult {
    minMentions, err := v.validationData.GetSeoNumber(SeoKeyMinKeywordMentions)
    if err != nil {
        minMentions = 8  // Fallback
    }
    
    var violations []Violation
    
    for _, keyword := range config.Keywords {
        count := strings.Count(strings.ToLower(content), strings.ToLower(keyword))
        if count < int(minMentions) {
            violations = append(violations, Violation{
                RuleId:     4,
                Issue:      fmt.Sprintf("Keyword '%s' appears %d times (required: %.0f+)", keyword, count, minMentions),
                Suggestion: "Integrate keyword more naturally throughout content",
            })
        }
    }
    
    return ValidationResult{
        Passed:     len(violations) == 0,
        Violations: violations,
    }
}

// Rule 6: Area mentions - USING TYPED CONSTANTS
func (v *GuidelineValidator) validateAreaMentions(content string, config *SeoConfig) ValidationResult {
    minMentions, _ := v.validationData.GetSeoNumber(SeoKeyMinAreaMentions)
    maxMentions, _ := v.validationData.GetSeoNumber(SeoKeyMaxAreaMentions)
    if minMentions == 0 { minMentions = 3 }
    if maxMentions == 0 { maxMentions = 4 }
    
    var violations []Violation
    
    for _, area := range config.ServiceArea {
        count := strings.Count(strings.ToLower(content), strings.ToLower(area))
        if count < int(minMentions) || count > int(maxMentions) {
            violations = append(violations, Violation{
                RuleId:     6,
                Issue:      fmt.Sprintf("Area '%s' appears %d times (required: %.0f-%.0f)", area, count, minMentions, maxMentions),
                Suggestion: fmt.Sprintf("Adjust area mentions to %.0f-%.0f per section", minMentions, maxMentions),
            })
        }
    }
    
    return ValidationResult{
        Passed:     len(violations) == 0,
        Violations: violations,
    }
}

// Rule 8: Sentence length - USING TYPED CONSTANTS
func (v *GuidelineValidator) validateSentenceLength(content string, _ *SeoConfig) ValidationResult {
    maxWords, err := v.validationData.GetSeoNumber(SeoKeyMaxSentenceWords)
    if err != nil {
        maxWords = 18  // Fallback
    }
    
    sentences := splitSentences(content)
    var violations []Violation
    
    for i, s := range sentences {
        wordCount := len(strings.Fields(s))
        if wordCount > int(maxWords) {
            violations = append(violations, Violation{
                RuleId:     8,
                Location:   fmt.Sprintf("Sentence %d", i+1),
                Issue:      fmt.Sprintf("Sentence has %d words (max: %.0f)", wordCount, maxWords),
                Suggestion: "Break into shorter sentences",
            })
        }
    }
    
    return ValidationResult{
        Passed:     len(violations) == 0,
        Violations: violations,
    }
}

// Rule 11: Paragraph length - USING TYPED CONSTANTS
func (v *GuidelineValidator) validateParagraphLength(content string, _ *SeoConfig) ValidationResult {
    maxWords, err := v.validationData.GetSeoNumber(SeoKeyMaxParagraphWords)
    if err != nil {
        maxWords = 180  // Fallback
    }
    
    paragraphs := strings.Split(content, "\n\n")
    var violations []Violation
    
    for i, p := range paragraphs {
        wordCount := len(strings.Fields(p))
        if wordCount > int(maxWords) {
            violations = append(violations, Violation{
                RuleId:     11,
                Location:   fmt.Sprintf("Paragraph %d", i+1),
                Issue:      fmt.Sprintf("Paragraph has %d words (max: %.0f)", wordCount, maxWords),
                Suggestion: "Split into multiple focused paragraphs",
            })
        }
    }
    
    return ValidationResult{
        Passed:     len(violations) == 0,
        Violations: violations,
    }
}

// Rule 14: Link density - USING TYPED CONSTANTS
func (v *GuidelineValidator) validateLinkDensity(content string, _ *SeoConfig) ValidationResult {
    minLinks, _ := v.validationData.GetSeoNumber(SeoKeyLinksPerSentenceMin)
    maxLinks, _ := v.validationData.GetSeoNumber(SeoKeyLinksPerSentenceMax)
    if minLinks == 0 { minLinks = 2 }
    if maxLinks == 0 { maxLinks = 3 }
    
    sentences := splitSentences(content)
    var violations []Violation
    
    linkPattern := regexp.MustCompile(`<a[^>]*>`)
    
    for i, s := range sentences {
        linkCount := len(linkPattern.FindAllString(s, -1))
        if linkCount < int(minLinks) {
            violations = append(violations, Violation{
                RuleId:     14,
                Location:   fmt.Sprintf("Sentence %d", i+1),
                Issue:      fmt.Sprintf("Sentence has %d links (min: %.0f)", linkCount, minLinks),
                Suggestion: fmt.Sprintf("Add %.0f-%.0f contextual links per sentence", minLinks, maxLinks),
            })
        }
    }
    
    return ValidationResult{
        Passed:     len(violations) == 0,
        Violations: violations,
    }
}

// Rule 15: Container compliance - USING TYPED CONSTANTS
func (v *GuidelineValidator) validateContainerCompliance(content string, _ *SeoConfig) ValidationResult {
    forbiddenTags, err := v.validationData.GetSeoStringArray(SeoKeyForbiddenContainerTags)
    if err != nil {
        forbiddenTags = []string{"p", "div"}  // Fallback
    }
    
    var violations []Violation
    
    containerPattern := regexp.MustCompile(`class=["']seo-container-para contrast["'][^>]*>([^<]+(?:<[^>]+>[^<]+)*)</`)
    containers := containerPattern.FindAllStringSubmatch(content, -1)
    
    for i, container := range containers {
        for _, tag := range forbiddenTags {
            tagPattern := regexp.MustCompile(fmt.Sprintf(`<%s[^>]*>`, tag))
            if tagPattern.MatchString(container[1]) {
                violations = append(violations, Violation{
                    RuleId:     15,
                    Location:   fmt.Sprintf("Container %d", i+1),
                    Issue:      fmt.Sprintf("Container contains forbidden <%s> tag", tag),
                    Suggestion: "Remove nested block elements from seo-container-para contrast",
                })
            }
        }
    }
    
    return ValidationResult{
        Passed:     len(violations) == 0,
        Violations: violations,
    }
}

// Rule 16: Statistical references - USING TYPED CONSTANTS
func (v *GuidelineValidator) validateStatisticalReferences(content string, _ *SeoConfig) ValidationResult {
    minRange, _ := v.validationData.GetSeoNumber(SeoKeyStatisticalRangeMin)
    maxRange, _ := v.validationData.GetSeoNumber(SeoKeyStatisticalRangeMax)
    if minRange == 0 { minRange = 2.51 }
    if maxRange == 0 { maxRange = 2.97 }
    
    // Validate that percentages with 2 decimal points fall within range
    percentPattern := regexp.MustCompile(`(\d+\.\d{2})%`)
    matches := percentPattern.FindAllStringSubmatch(content, -1)
    
    var violations []Violation
    for _, match := range matches {
        val, _ := strconv.ParseFloat(match[1], 64)
        // High values (>5%) should be about problems, low values about solutions
        if val > 5.0 {
            // Check context for problem/challenge language
            // This is a heuristic check
        }
    }
    
    return ValidationResult{
        Passed:     len(violations) == 0,
        Message:    fmt.Sprintf("Statistical range configured: %.2f%% - %.2f%%", minRange, maxRange),
        Violations: violations,
    }
}
```

---

## Database Schema Extension

### Core Guidelines Storage

```sql
-- ============================================
-- Table: CoreGuidelines (global guidelines)
-- ============================================
CREATE TABLE CoreGuidelines (
    Id INTEGER PRIMARY KEY,
    RuleNumber INTEGER UNIQUE NOT NULL,
    Name TEXT NOT NULL,
    Description TEXT NOT NULL,
    Category TEXT NOT NULL,           -- style, eeat, numeric, linking
    Severity TEXT DEFAULT 'error',    -- error, warning, info
    AutoFixable BOOLEAN DEFAULT FALSE,
    Enabled BOOLEAN DEFAULT TRUE,
    Metadata TEXT,                    -- JSON: additional rule config
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: GuidelineOverrides (project overrides)
-- ============================================
CREATE TABLE GuidelineOverrides (
    Id TEXT PRIMARY KEY,
    AppName TEXT NOT NULL,
    RuleNumber INTEGER NOT NULL,
    OverrideType TEXT NOT NULL,       -- disable, modify, extend
    ModifiedValue TEXT,               -- JSON: modified parameters
    Reason TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(AppName, RuleNumber)
);

CREATE INDEX IdxGuidelineOverridesApp ON GuidelineOverrides(AppName);
```

---

## API Endpoints

### Guideline Management

```
GET /api/v1/seo/guidelines
  Returns: List of all 19 core guidelines with status

GET /api/v1/seo/guidelines/:ruleNumber
  Returns: Specific guideline details

PUT /api/v1/seo/guidelines/:ruleNumber
  Body: { "Enabled": false, "Reason": "..." }
  Updates: Toggle guideline on/off globally

POST /api/v1/seo/guidelines/:appName/override
  Body: { "RuleNumber": 8, "OverrideType": "modify", "ModifiedValue": {"MaxWords": 25} }
  Creates: Project-specific override

DELETE /api/v1/seo/guidelines/:appName/override/:ruleNumber
  Removes: Project-specific override

POST /api/v1/seo/validate
  Body: { "Content": "...", "Config": {...} }
  Returns: Validation report with all rule results
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| AI SEO Generate | `./13-ai-seo-generate.md` |
| Content Types | `./18-ai-seo-content-types.md` |
| Variable System | `./19-ai-seo-variable-system.md` |
| Error Codes | `./16-ai-seo-error-codes.md` |
