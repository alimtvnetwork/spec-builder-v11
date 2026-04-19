# Validation Data Seeding Pattern

**Version:** 2.0.0  
**Created:** 2026-03-09  
**Status:** Active  
**Purpose:** Define pattern for loading validation arrays and lookup data from CW Config → Root DB

---

## Overview

All **validation arrays**, **lookup tables**, and **configurable data** used across CLI applications MUST follow the CW Config → Root DB pattern. This ensures:

1. **No hardcoded arrays** in Go source code
2. **Runtime configurability** via settings database
3. **Version-controlled changes** through seed versioning
4. **User customization** without code changes

---

## Anti-Pattern: Hardcoded Arrays ❌

```go
// ❌ WRONG: Hardcoded validation data
func validateTransitionDensity(content string, _ *SeoConfig) ValidationResult {
    transitions := []string{
        "however", "therefore", "additionally", "moreover", "furthermore",
        "consequently", "meanwhile", "nevertheless", "accordingly", "hence",
    }
    // ...
}
```

---

## Correct Pattern: CW Config → Root DB ✅

### Step 1: Define in config.seed.json

```json
{
  "$schema": "./config.schema.json",
  "version": "1.3.0",
  "changelog": "Added SEO validation data arrays",
  "categories": {
    "seo": {
      "displayName": "SEO Settings",
      "description": "SEO content generation configuration",
      "settings": {
        "transitionWords": {
          "type": "array",
          "label": "Transition Words",
          "description": "Words counted for transition density validation",
          "default": [
            "however", "therefore", "additionally", "moreover", "furthermore",
            "consequently", "meanwhile", "nevertheless", "accordingly", "hence",
            "thus", "indeed", "specifically", "particularly", "notably",
            "significantly", "ultimately", "essentially", "primarily", "initially",
            "subsequently", "similarly", "likewise", "conversely", "alternatively",
            "otherwise", "regardless", "nonetheless", "certainly", "undoubtedly"
          ]
        },
        "transitionDensityThreshold": {
          "type": "number",
          "label": "Transition Density Threshold",
          "description": "Minimum percentage of transition words required",
          "default": 40,
          "min": 10,
          "max": 80
        },
        "maxSentenceWords": {
          "type": "number",
          "label": "Max Sentence Words",
          "description": "Maximum words allowed per sentence",
          "default": 18,
          "min": 10,
          "max": 50
        },
        "maxParagraphWords": {
          "type": "number",
          "label": "Max Paragraph Words",
          "description": "Maximum words allowed per paragraph",
          "default": 180,
          "min": 50,
          "max": 500
        },
        "minKeywordMentions": {
          "type": "number",
          "label": "Min Keyword Mentions",
          "description": "Minimum keyword occurrences required",
          "default": 8,
          "min": 3,
          "max": 20
        },
        "minAreaMentions": {
          "type": "number",
          "label": "Min Area Mentions",
          "description": "Minimum area/location mentions per section",
          "default": 3,
          "min": 1,
          "max": 10
        },
        "maxAreaMentions": {
          "type": "number",
          "label": "Max Area Mentions",
          "description": "Maximum area/location mentions per section",
          "default": 4,
          "min": 2,
          "max": 15
        },
        "linksPerSentenceMin": {
          "type": "number",
          "label": "Min Links Per Sentence",
          "description": "Minimum internal/external links per sentence",
          "default": 2,
          "min": 0,
          "max": 5
        },
        "linksPerSentenceMax": {
          "type": "number",
          "label": "Max Links Per Sentence",
          "description": "Maximum internal/external links per sentence",
          "default": 3,
          "min": 1,
          "max": 10
        },
        "statisticalRangeMin": {
          "type": "number",
          "label": "Statistical Range Min",
          "description": "Minimum value for credibility percentages",
          "default": 2.51,
          "min": 0.01,
          "max": 10.0
        },
        "statisticalRangeMax": {
          "type": "number",
          "label": "Statistical Range Max",
          "description": "Maximum value for credibility percentages",
          "default": 2.97,
          "min": 0.01,
          "max": 10.0
        },
        "trustMetricsMax": {
          "type": "number",
          "label": "Trust Metrics Max",
          "description": "Maximum percentage for company glorification metrics",
          "default": 5,
          "min": 1,
          "max": 10
        },
        "forbiddenContainerTags": {
          "type": "array",
          "label": "Forbidden Container Tags",
          "description": "HTML tags not allowed inside seo-container-para contrast",
          "default": ["p", "div"]
        },
        "experienceYearsMin": {
          "type": "number",
          "label": "Experience Years Min",
          "description": "Minimum years for experience narratives",
          "default": 5,
          "min": 1,
          "max": 20
        },
        "experienceYearsMax": {
          "type": "number",
          "label": "Experience Years Max",
          "description": "Maximum years for experience narratives",
          "default": 15,
          "min": 5,
          "max": 50
        },
        "slugMaxWords": {
          "type": "number",
          "label": "Slug Max Words",
          "description": "Maximum words in generated URL slugs",
          "default": 4,
          "min": 2,
          "max": 8
        },
        "slugMinWords": {
          "type": "number",
          "label": "Slug Min Words",
          "description": "Minimum words in generated URL slugs",
          "default": 3,
          "min": 1,
          "max": 5
        },
        "externalLinkNofollowCount": {
          "type": "number",
          "label": "External Nofollow Count",
          "description": "Number of external links to mark as nofollow",
          "default": 2,
          "min": 0,
          "max": 5
        }
      }
    }
  }
}
```

### Step 2: Database Storage

```sql
-- Root DB (settings.db) stores validation data
CREATE TABLE ValidationData (
    Id TEXT PRIMARY KEY,
    Category TEXT NOT NULL,          -- 'seo', 'rag', 'search'
    Key TEXT NOT NULL,               -- 'transitionWords', 'stopWords'
    DataType TEXT NOT NULL,          -- 'array', 'map', 'number'
    Value TEXT NOT NULL,             -- JSON encoded
    Version TEXT NOT NULL,           -- Seed version
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(Category, Key)
);

CREATE INDEX IdxValidationDataCategory ON ValidationData(Category);
```

### Step 3: Go Enums/Constants (MANDATORY)

> **CRITICAL:** Never use magic strings. Always use typed constants for categories and keys.

```go
package validation

// ============================================
// Validation Category Constants
// ============================================
type ValidationCategory string

const (
    CategorySeo    ValidationCategory = "seo"
    CategoryRag    ValidationCategory = "rag"
    CategoryFaq    ValidationCategory = "faq"
    CategorySearch ValidationCategory = "search"
)

// ============================================
// SEO Validation Key Constants
// ============================================
type SeoKey string

const (
    SeoKeyTransitionWords           SeoKey = "transitionWords"
    SeoKeyTransitionDensityThreshold SeoKey = "transitionDensityThreshold"
    SeoKeyMaxSentenceWords          SeoKey = "maxSentenceWords"
    SeoKeyMaxParagraphWords         SeoKey = "maxParagraphWords"
    SeoKeyMinKeywordMentions        SeoKey = "minKeywordMentions"
    SeoKeyMinAreaMentions           SeoKey = "minAreaMentions"
    SeoKeyMaxAreaMentions           SeoKey = "maxAreaMentions"
    SeoKeyLinksPerSentenceMin       SeoKey = "linksPerSentenceMin"
    SeoKeyLinksPerSentenceMax       SeoKey = "linksPerSentenceMax"
    SeoKeyStatisticalRangeMin       SeoKey = "statisticalRangeMin"
    SeoKeyStatisticalRangeMax       SeoKey = "statisticalRangeMax"
    SeoKeyTrustMetricsMax           SeoKey = "trustMetricsMax"
    SeoKeyForbiddenContainerTags    SeoKey = "forbiddenContainerTags"
    SeoKeyExperienceYearsMin        SeoKey = "experienceYearsMin"
    SeoKeyExperienceYearsMax        SeoKey = "experienceYearsMax"
    SeoKeySlugMinWords              SeoKey = "slugMinWords"
    SeoKeySlugMaxWords              SeoKey = "slugMaxWords"
    SeoKeyExternalLinkNofollowCount SeoKey = "externalLinkNofollowCount"
)

// ============================================
// RAG Validation Key Constants
// ============================================
type RagKey string

const (
    RagKeyStopWords    RagKey = "stopWords"
    RagKeyMinChunkSize RagKey = "minChunkSize"
    RagKeyMaxChunkSize RagKey = "maxChunkSize"
    RagKeyChunkOverlap RagKey = "chunkOverlap"
)

// ============================================
// FAQ Validation Key Constants
// ============================================
type FaqKey string

const (
    FaqKeyDefaultOutputFormat       FaqKey = "defaultOutputFormat"
    FaqKeyDefaultIncludeSchema      FaqKey = "defaultIncludeSchema"
    FaqKeyDefaultSchemaVariation    FaqKey = "defaultSchemaVariation"
    FaqKeyDefaultEncodeHtmlInJson   FaqKey = "defaultEncodeHtmlInJson"
    FaqKeyDefaultWordLimit          FaqKey = "defaultWordLimit"
    FaqKeyDefaultTransitionDensity  FaqKey = "defaultTransitionDensity"
    FaqKeyDefaultKeywordMentions    FaqKey = "defaultKeywordMentions"
    FaqKeyDefaultAreaMentions       FaqKey = "defaultAreaMentions"
    FaqKeyDefaultMaxSentenceWords   FaqKey = "defaultMaxSentenceWords"
    FaqKeyDefaultMaxParagraphWords  FaqKey = "defaultMaxParagraphWords"
    FaqKeyDefaultEnableGSearch      FaqKey = "defaultEnableGSearch"
    FaqKeyDefaultEnableSitemapLinking FaqKey = "defaultEnableSitemapLinking"
    FaqKeyDefaultEnableYouTubeEmbed FaqKey = "defaultEnableYouTubeEmbed"
    FaqKeySchemaParagraphs          FaqKey = "schemaParagraphs"
    FaqKeySchemaTemplates           FaqKey = "schemaTemplates"
    FaqKeyHtmlTemplates             FaqKey = "htmlTemplates"
    FaqKeyTransitionWords           FaqKey = "transitionWords"
    FaqKeyTrustPercentageMin        FaqKey = "trustPercentageMin"
    FaqKeyTrustPercentageMax        FaqKey = "trustPercentageMax"
    FaqKeyMonthlyImprovementMin     FaqKey = "monthlyImprovementMin"
    FaqKeyMonthlyImprovementMax     FaqKey = "monthlyImprovementMax"
    FaqKeyEffectivenessMin          FaqKey = "effectivenessMin"
    FaqKeyEffectivenessMax          FaqKey = "effectivenessMax"
    FaqKeyQuestionPatterns          FaqKey = "questionPatterns"
)

// ============================================
// Search Validation Key Constants
// ============================================
type SearchKey string

const (
    SearchKeyAllowedFileTypes     SearchKey = "allowedFileTypes"
    SearchKeyExcludedDirectories  SearchKey = "excludedDirectories"
    SearchKeyMaxFileSize          SearchKey = "maxFileSize"
)
```

### Step 4: ValidationDataService with Typed Methods

```go
package validation

import (
    "encoding/json"
    "sync"
)

// ValidationDataService loads validation data from Root DB
type ValidationDataService struct {
    db    *gorm.DB
    cache sync.Map  // Thread-safe cache
}

// GetStringArray retrieves a string array using typed constants
func (s *ValidationDataService) GetStringArray(category ValidationCategory, key string) apperror.Result[[]string] {
    cacheKey := string(category) + ":" + key
    // EXEMPTED: typed accessor internal — cache stores known []string values (§7.2)
    if cached, ok := s.cache.Load(cacheKey); ok {
        return cached.([]string), nil
    }
    
    var data ValidationData
    if err := s.db.Where("Category = ? AND Key = ?", string(category), key).First(&data).Error; err != nil {
        return nil, err
    }
    
    var result []string
    if err := json.Unmarshal([]byte(data.Value), &result); err != nil {
        return nil, err
    }
    
    s.cache.Store(cacheKey, result)
    return result, nil
}

// GetNumber retrieves a numeric value using typed constants
func (s *ValidationDataService) GetNumber(category ValidationCategory, key string) apperror.Result[float64] {
    cacheKey := string(category) + ":" + key
    // EXEMPTED: typed accessor internal — cache stores known float64 values (§7.2)
    if cached, ok := s.cache.Load(cacheKey); ok {
        return cached.(float64), nil
    }
    
    var data ValidationData
    if err := s.db.Where("Category = ? AND Key = ?", string(category), key).First(&data).Error; err != nil {
        return 0, err
    }
    
    var result float64
    if err := json.Unmarshal([]byte(data.Value), &result); err != nil {
        return 0, err
    }
    
    s.cache.Store(cacheKey, result)
    return result, nil
}

// SEO-specific typed accessors
func (s *ValidationDataService) GetSeoStringArray(key SeoKey) apperror.Result[[]string] {
    return s.GetStringArray(CategorySeo, string(key))
}

func (s *ValidationDataService) GetSeoNumber(key SeoKey) apperror.Result[float64] {
    return s.GetNumber(CategorySeo, string(key))
}

// RAG-specific typed accessors
func (s *ValidationDataService) GetRagStringArray(key RagKey) apperror.Result[[]string] {
    return s.GetStringArray(CategoryRag, string(key))
}

func (s *ValidationDataService) GetRagNumber(key RagKey) apperror.Result[float64] {
    return s.GetNumber(CategoryRag, string(key))
}

// FAQ-specific typed accessors
func (s *ValidationDataService) GetFaqStringArray(key FaqKey) apperror.Result[[]string] {
    return s.GetStringArray(CategoryFaq, string(key))
}

func (s *ValidationDataService) GetFaqNumber(key FaqKey) apperror.Result[float64] {
    return s.GetNumber(CategoryFaq, string(key))
}

func (s *ValidationDataService) GetFaqBool(key FaqKey) apperror.Result[bool] {
    return s.GetBool(CategoryFaq, string(key))
}

func (s *ValidationDataService) GetFaqString(key FaqKey) apperror.Result[string] {
    return s.GetString(CategoryFaq, string(key))
}

// Search-specific typed accessors
func (s *ValidationDataService) GetSearchStringArray(key SearchKey) apperror.Result[[]string] {
    return s.GetStringArray(CategorySearch, string(key))
}

func (s *ValidationDataService) GetSearchNumber(key SearchKey) apperror.Result[float64] {
    return s.GetNumber(CategorySearch, string(key))
}

// InvalidateCache clears cached validation data
func (s *ValidationDataService) InvalidateCache() {
    s.cache = sync.Map{}
}
```

### Step 5: Correct Validator Implementation (Using Typed Constants)

```go
// ✅ CORRECT: Using typed constants - no magic strings
func (v *GuidelineValidator) validateTransitionDensity(content string, _ *SeoConfig) ValidationResult {
    // Load transition words using typed accessor
    transitions, err := v.validationData.GetSeoStringArray(SeoKeyTransitionWords)
    if err != nil {
        return ValidationResult{
            Passed:  false,
            Message: "Failed to load transition words from config",
        }
    }
    
    // Load threshold using typed accessor
    threshold, err := v.validationData.GetSeoNumber(SeoKeyTransitionDensityThreshold)
    if err != nil {
        threshold = 40.0  // Fallback if not configured
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

// Example: Using RAG constants
func (s *RagService) GetStopWords() apperror.Result[[]string] {
    return s.validationData.GetRagStringArray(RagKeyStopWords)
}

// Example: Using Search constants
func (s *SearchService) GetAllowedFileTypes() apperror.Result[[]string] {
    return s.validationData.GetSearchStringArray(SearchKeyAllowedFileTypes)
}
```

---

## Anti-Pattern vs Correct Pattern

### ❌ WRONG: Magic Strings
```go
// Never do this
transitions, _ := v.validationData.GetStringArray("seo", "transitionWords")
threshold, _ := v.validationData.GetNumber("seo", "transitionDensityThreshold")
```

### ✅ CORRECT: Typed Constants
```go
// Always use typed constants
transitions, _ := v.validationData.GetSeoStringArray(SeoKeyTransitionWords)
threshold, _ := v.validationData.GetSeoNumber(SeoKeyTransitionDensityThreshold)
```

---

## Common Validation Data Categories

### SEO Validation

| Key | Type | Description |
|-----|------|-------------|
| `transitionWords` | array | Words for transition density |
| `transitionDensityThreshold` | number | Min % required |
| `maxSentenceWords` | number | Max words per sentence |
| `maxParagraphWords` | number | Max words per paragraph |
| `minKeywordMentions` | number | Min keyword occurrences |
| `forbiddenContainerTags` | array | Tags not allowed in containers |

### RAG Validation

| Key | Type | Description |
|-----|------|-------------|
| `stopWords` | array | Words to exclude from indexing |
| `minChunkSize` | number | Minimum chunk size |
| `maxChunkSize` | number | Maximum chunk size |
| `chunkOverlap` | number | Overlap between chunks |

### Search Validation

| Key | Type | Description |
|-----|------|-------------|
| `allowedFileTypes` | array | File extensions to index |
| `excludedDirectories` | array | Directories to skip |
| `maxFileSize` | number | Max file size to process |

---

## Version Seeding Behavior

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    VALIDATION DATA SEEDING FLOW                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  config.seed.json (v1.3.0)                                               │
│  └── categories.seo.settings.transitionWords: [...]                     │
│                                                                          │
│                          ↓                                               │
│                                                                          │
│  ConfigService.SeedWithVersionCheck()                                    │
│  └── Check: seed_version (1.3.0) > db_version (1.2.0)?                  │
│                                                                          │
│                          ↓ YES                                           │
│                                                                          │
│  INSERT INTO ValidationData                                              │
│  └── Category: 'seo'                                                    │
│  └── Key: 'transitionWords'                                             │
│  └── Value: '["however","therefore",...]'                               │
│  └── Version: '1.3.0'                                                   │
│                                                                          │
│                          ↓                                               │
│                                                                          │
│  Update ConfigMeta.seed_version = '1.3.0'                               │
│  Append to CHANGELOG.md                                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## API for Runtime Updates

```
PUT /api/v1/config/validation/:category/:key
  Body: { "Value": [...], "Reason": "Added new transition words" }
  Effect: Updates ValidationData, invalidates cache, logs change

GET /api/v1/config/validation/:category
  Returns: All validation data for category

GET /api/v1/config/validation/:category/:key
  Returns: Specific validation data entry
```

---

## Checklist for New Validation Data

- [ ] Define in `config.seed.json` under appropriate category
- [ ] Bump config version (minor for new setting)
- [ ] Add changelog entry
- [ ] Create Go accessor using `ValidationDataService`
- [ ] Never hardcode the array in source code
- [ ] Add API endpoint for runtime updates if needed
- [ ] Add tests for default values

---

## Cross-References

| Reference | Location |
|-----------|----------|
| CW Config Overview | `./00-overview.md` |
| RAG Chunk Settings | `./02-rag-chunk-settings.md` |
| RAG Validation Helpers | `./03-rag-validation-helpers.md` |
| AI SEO Guidelines | `../22-ai-bridge-cli/01-backend/17-ai-seo-core-guidelines.md` |
