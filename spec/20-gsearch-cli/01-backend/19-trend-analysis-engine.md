# 20. Trend Analysis Engine


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

## Overview

The Trend Analysis Engine aggregates market signals from multiple data sources to compute composite scores for technologies, programming languages, frameworks, and tools. All scoring weights follow the **Seedable Configuration Pattern**.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA COLLECTION                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ GitHub   │  │ Stack    │  │ Job      │  │ Package  │     │
│  │ API      │  │ Overflow │  │ Boards   │  │ Registries│    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│       │             │             │             │           │
│       └─────────────┴──────┬──────┴─────────────┘           │
│                            │                                │
│                    ┌───────v───────┐                        │
│                    │ Normalizer    │                        │
│                    │ (0-1 scaling) │                        │
│                    └───────┬───────┘                        │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────v────────────────────────────────┐
│                 COMPOSITE SCORING                           │
│                                                             │
│   composite = github_stars    × 0.30 (from settings)        │
│             + job_postings    × 0.40 (from settings)        │
│             + so_questions    × 0.20 (from settings)        │
│             + pkg_downloads   × 0.10 (from settings)        │
│                                                             │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────v────────────────────────────────┐
│                 GROWTH ANALYSIS                             │
│                                                             │
│   growth_rate = wow  × 0.15 (week-over-week)                │
│               + mom  × 0.35 (month-over-month)              │
│               + qoq  × 0.30 (quarter-over-quarter)          │
│               + yoy  × 0.20 (year-over-year)                │
│                                                             │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────v────────────────────────────────┐
│              VISUALIZATION & REPORTING                      │
│                                                             │
│   • Bar charts (top N by composite score)                   │
│   • Growth trend lines                                      │
│   • Market demand heatmaps                                  │
│   • JSON/CSV export                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Seedable Configuration

### Config File: `config/seeding-trend-analysis.json`

```json
{
  "version": "1.0.0",
  "category": "trend_analysis",
  "values": {
    "composite_score_weights": {
      "github_stars": 0.30,
      "job_postings": 0.40,
      "stackoverflow_questions": 0.20,
      "package_downloads": 0.10
    },
    "growth_rate_weights": {
      "week_over_week": 0.15,
      "month_over_month": 0.35,
      "quarter_over_quarter": 0.30,
      "year_over_year": 0.20
    },
    "signal_normalization": {
      "github_stars_max": 500000,
      "job_postings_max": 100000,
      "stackoverflow_questions_max": 50000,
      "package_downloads_max": 1000000000
    }
  }
}
```

---

## Database Schema

### TrendSignal Table

```sql
CREATE TABLE TrendSignal (
    Id              TEXT PRIMARY KEY,
    EntityName      TEXT NOT NULL,           -- e.g., "Python", "React"
    EntityType      TEXT NOT NULL,           -- "language", "framework", "tool"
    GithubStars     INTEGER DEFAULT 0,
    JobPostings     INTEGER DEFAULT 0,
    StackOverflowQuestions INTEGER DEFAULT 0,
    PackageDownloads INTEGER DEFAULT 0,
    CompositeScore  REAL NOT NULL,
    GrowthRate      REAL DEFAULT 0,
    DataTimestamp   DATETIME NOT NULL,
    CreatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IdxTrendEntity ON TrendSignal(EntityName, EntityType);
CREATE INDEX IdxTrendComposite ON TrendSignal(CompositeScore DESC);
CREATE INDEX IdxTrendTimestamp ON TrendSignal(DataTimestamp);
```

### TrendHistory Table

```sql
CREATE TABLE TrendHistory (
    Id              TEXT PRIMARY KEY,
    EntityName      TEXT NOT NULL,
    EntityType      TEXT NOT NULL,
    Period          TEXT NOT NULL,           -- "daily", "weekly", "monthly"
    PeriodStart     DATE NOT NULL,
    CompositeScore  REAL NOT NULL,
    GrowthRate      REAL DEFAULT 0,
    RawSignals      TEXT NOT NULL,           -- JSON blob of signal values
    CreatedAt       DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(EntityName, EntityType, Period, PeriodStart)
);
```

---

## Golang Implementation

### Types

```go
// TrendSignal represents market signals for an entity
type TrendSignal struct {
    Id                     string
    EntityName             string
    EntityType             string
    GithubStars            int
    JobPostings            int
    StackOverflowQuestions int
    PackageDownloads       int64
    CompositeScore         float64
    GrowthRate             float64
    DataTimestamp          time.Time
}

// CompositeWeights from settings
type CompositeWeights struct {
    GithubStars            float64
    JobPostings            float64
    StackOverflowQuestions float64
    PackageDownloads       float64
}

// GrowthWeights from settings
type GrowthWeights struct {
    WeekOverWeek       float64
    MonthOverMonth     float64
    QuarterOverQuarter float64
    YearOverYear       float64
}

// NormalizationLimits for signal scaling
type NormalizationLimits struct {
    GithubStarsMax            int
    JobPostingsMax            int
    StackOverflowQuestionsMax int
    PackageDownloadsMax       int64
}
```

### TrendAnalyzer

```go
// TrendAnalyzer computes composite scores using seedable weights
type TrendAnalyzer struct {
    settings           SettingsService
    compositeWeights   CompositeWeights
    growthWeights      GrowthWeights
    normalizationLimits NormalizationLimits
}

// NewTrendAnalyzer creates analyzer with settings from DB
func NewTrendAnalyzer(settings SettingsService) apperror.Result[TrendAnalyzer] {
    analyzer := TrendAnalyzer{settings: settings}
    
    if loadErr := analyzer.loadWeights(); loadErr != nil {
        return apperror.Fail[TrendAnalyzer](
            apperror.Wrap(
                loadErr,
                "loading trend weights",
            ),
        )
    }
    
    return apperror.Ok(analyzer)
}

// loadWeights retrieves current weights from settings using typed accessors
func (a *TrendAnalyzer) loadWeights() *apperror.AppError {
    compositeResult := GetTyped[CompositeWeights](a.settings, "trend_analysis", "composite_score_weights")
    if compositeResult.HasError() {
        return compositeResult.Error()
    }

    a.compositeWeights = compositeResult.Value()
    
    growthResult := GetTyped[GrowthWeights](a.settings, "trend_analysis", "growth_rate_weights")
    if growthResult.HasError() {
        return growthResult.Error()
    }

    a.growthWeights = growthResult.Value()
    
    normResult := GetTyped[NormalizationLimits](a.settings, "trend_analysis", "signal_normalization")
    if normResult.HasError() {
        return normResult.Error()
    }

    a.normalizationLimits = normResult.Value()
    
    return nil
}

// Normalize scales a value to 0-1 range
func (a *TrendAnalyzer) Normalize(value, max int) float64 {
    if max <= 0 {
        return 0
    }
    normalized := float64(value) / float64(max)
    if normalized > 1.0 {
        return 1.0
    }
    return normalized
}

// ComputeCompositeScore calculates weighted score from signals
func (a *TrendAnalyzer) ComputeCompositeScore(signal TrendSignal) float64 {
    githubNorm := a.Normalize(signal.GithubStars, a.normalizationLimits.GithubStarsMax)
    jobsNorm := a.Normalize(signal.JobPostings, a.normalizationLimits.JobPostingsMax)
    soNorm := a.Normalize(signal.StackOverflowQuestions, a.normalizationLimits.StackOverflowQuestionsMax)
    pkgNorm := a.Normalize(int(signal.PackageDownloads), int(a.normalizationLimits.PackageDownloadsMax))
    
    return githubNorm*a.compositeWeights.GithubStars +
           jobsNorm*a.compositeWeights.JobPostings +
           soNorm*a.compositeWeights.StackOverflowQuestions +
           pkgNorm*a.compositeWeights.PackageDownloads
}

// ComputeGrowthRate calculates weighted growth from multiple periods
func (a *TrendAnalyzer) ComputeGrowthRate(wow, mom, qoq, yoy float64) float64 {
    return wow*a.growthWeights.WeekOverWeek +
           mom*a.growthWeights.MonthOverMonth +
           qoq*a.growthWeights.QuarterOverQuarter +
           yoy*a.growthWeights.YearOverYear
}

// AnalyzeTrends processes signals and returns top N
func (a *TrendAnalyzer) AnalyzeTrends(signals []TrendSignal, topN int) []TrendSignal {
    for i := range signals {
        signals[i].CompositeScore = a.ComputeCompositeScore(signals[i])
    }
    
    // Sort by composite score descending
    sort.Slice(signals, func(i, j int) bool {
        return signals[i].CompositeScore > signals[j].CompositeScore
    })
    
    if topN > 0 && len(signals) > topN {
        return signals[:topN]
    }
    return signals
}
```

---

## TypeScript Interfaces

```typescript
interface TrendSignal {
  readonly id: string;
  readonly entityName: string;
  readonly entityType: 'language' | 'framework' | 'tool' | 'library';
  readonly githubStars: number;
  readonly jobPostings: number;
  readonly stackoverflowQuestions: number;
  readonly packageDownloads: number;
  readonly compositeScore: number;
  readonly growthRate: number;
  readonly dataTimestamp: string;
}

interface CompositeWeights {
  readonly github_stars: number;
  readonly job_postings: number;
  readonly stackoverflow_questions: number;
  readonly package_downloads: number;
}

interface GrowthWeights {
  readonly week_over_week: number;
  readonly month_over_month: number;
  readonly quarter_over_quarter: number;
  readonly year_over_year: number;
}

interface TrendAnalysisSettings {
  readonly composite_score_weights: CompositeWeights;
  readonly growth_rate_weights: GrowthWeights;
  readonly signal_normalization: {
    readonly github_stars_max: number;
    readonly job_postings_max: number;
    readonly stackoverflow_questions_max: number;
    readonly package_downloads_max: number;
  };
  readonly visualization: {
    readonly top_n_results: number;
    readonly chart_dpi: number;
    readonly figure_width: number;
    readonly figure_height: number;
  };
}
```

---

## CLI Commands

```bash
# Analyze trends for programming languages
gsearch trends --type=language --top=10

# Analyze with custom weights (override settings)
gsearch trends --type=framework --github-weight=0.4 --jobs-weight=0.3

# Export trend data
gsearch trends --type=tool --format=json --output=trends.json

# Historical comparison
gsearch trends --type=language --compare=2024-01-01:2025-01-01

# Growth leaders
gsearch trends --type=library --sort=growth --top=20
```

---

## Visualization Outputs

### Chart Types

| Chart | Description | Use Case |
|-------|-------------|----------|
| Bar Chart | Top N by composite score | Quick comparison |
| Line Chart | Growth trends over time | Trajectory analysis |
| Heatmap | Signal strength by category | Multi-dimensional view |
| Radar Chart | Signal distribution per entity | Profile comparison |

### Output Formats

- **PNG**: High-resolution charts (300 DPI default)
- **SVG**: Vector graphics for web embedding
- **JSON**: Raw data for custom visualization
- **CSV**: Spreadsheet-compatible export

---

## Settings UI Integration

The Trend Analysis settings appear in the Settings UI under:
- **Category**: `trend_analysis`
- **Sections**:
  - Composite Score Weights (4 sliders, must sum to 1.0)
  - Growth Rate Weights (4 sliders, must sum to 1.0)
  - Normalization Limits (4 number inputs)
  - Visualization Defaults (chart size, DPI, top N)

---

## Related Specifications

- [05-seedable-config-pattern.md](../../11-spec-management-software/04-coding-guidelines/05-seedable-config-pattern.md)
- [19-authority-credibility-scoring.md](./18-authority-credibility-scoring.md)
- [00-overview.md](./00-overview.md)
