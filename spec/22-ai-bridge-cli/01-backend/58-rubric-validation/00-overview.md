# Rubric Validation System

**Version:** 5.1.0  
**Status:** Draft  
**Updated:** 2026-03-30    
**AI Confidence:** High  
**Ambiguity:** None

---


## Keywords

`bridge`, `cli`, `backend`, `rubric`, `validation`

---

## Scoring

| Criterion | Status |
|-----------|--------|
| `00-overview.md` present | ✅ |
| AI Confidence assigned | ✅ |
| Ambiguity assigned | ✅ |
| Keywords present | ✅ |
| Scoring table present | ✅ |


## Summary

A self-grading rubric validation system for AI Bridge CLI. Before returning a response to the user, the AI evaluates its own output against a configurable set of rubric dimensions, scores each on a 1–5 scale, and retries (up to N attempts) if any dimension falls below its threshold. This is inspired by Anthropic's Constitutional AI and LLM-as-a-Judge patterns.

---

## How It Works

```
User Prompt
    │
    ▼
┌──────────────┐
│  AI Generate │◄──── Retry with feedback (max 3)
│   Response   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Rubric Judge │──── Separate LLM call (thinking model)
│  (Score 1-5) │
└──────┬───────┘
       │
       ├── All dimensions ≥ threshold? ──► Return response ✓
       │
       └── Any dimension < threshold? ──► Retry with critique ↺
```

### Pipeline

1. **Generate**: AI produces a candidate response using the configured model
2. **Judge**: A separate LLM call (thinking model) scores the response against all active rubric dimensions
3. **Evaluate**: If all scores meet thresholds, return the response
4. **Retry**: If any score fails, feed the critique back as context and regenerate
5. **Fallback**: After max retries, return best-scoring attempt with a quality warning

---

## Rubric Dimensions

Each dimension is a separate spec file with its own scoring criteria, thresholds, and examples.

| # | Dimension | File | Default Threshold | Weight |
|---|-----------|------|-------------------|--------|
| 01 | [Factual Accuracy](./01-factual-accuracy.md) | `01-factual-accuracy.md` | 4 | 1.5 |
| 02 | [Instruction Following](./02-instruction-following.md) | `02-instruction-following.md` | 4 | 1.5 |
| 03 | [Completeness](./03-completeness.md) | `03-completeness.md` | 3 | 1.0 |
| 04 | [Relevance & Coherence](./04-relevance-coherence.md) | `04-relevance-coherence.md` | 4 | 1.2 |
| 05 | [Safety & Harmlessness](./05-safety-harmlessness.md) | `05-safety-harmlessness.md` | 5 | 2.0 |
| 06 | [Tone & Style](./06-tone-style.md) | `06-tone-style.md` | 3 | 0.8 |
| 07 | [Code Quality](./07-code-quality.md) | `07-code-quality.md` | 4 | 1.3 |
| 08 | [Groundedness](./08-groundedness.md) | `08-groundedness.md` | 4 | 1.4 |
| 09 | [Consistency](./09-consistency.md) | `09-consistency.md` | 4 | 1.0 |
| 10 | [Conciseness](./10-conciseness.md) | `10-conciseness.md` | 3 | 0.7 |
| 11 | [Context Utilization](./11-context-utilization.md) | `11-context-utilization.md` | 3 | 1.0 |
| 12 | [Self-Validation Engine](./12-self-validation-engine.md) | `12-self-validation-engine.md` | — | — |

---

## Scoring Scale (Universal)

| Score | Label | Description |
|-------|-------|-------------|
| 1 | **Poor** | Fails the criterion entirely; critical issues present |
| 2 | **Below Standard** | Partially meets criterion; significant gaps |
| 3 | **Adequate** | Meets minimum expectations; minor issues |
| 4 | **Good** | Meets expectations well; negligible issues |
| 5 | **Excellent** | Exceeds expectations; no issues detected |

---

## Rubric Profiles

Different task types activate different rubric subsets:

| Profile | Active Dimensions | Use Case |
|---------|-------------------|----------|
| `coding` | 01, 02, 03, 04, 05, 07, 09 | Code generation tasks |
| `writing` | 01, 02, 03, 04, 05, 06, 08, 10 | Content/blog/SEO writing |
| `research` | 01, 02, 03, 04, 05, 08, 11 | Research & synthesis tasks |
| `chat` | 02, 04, 05, 06, 09, 10, 11 | Conversational responses |
| `spec` | 01, 02, 03, 04, 05, 09, 11 | Specification drafting |
| `all` | 01–11 | Full validation (expensive) |

---

## Configuration

```yaml
# config/seed.yaml additions
ai:
  rubric_validation:
    enabled: true
    max_retries: 3
    judge_model: "thinking"              # Model category for judge
    default_profile: "chat"
    min_weighted_score: 3.5              # Weighted average minimum
    fail_fast_threshold: 2              # Any dimension ≤ 2 triggers immediate retry
    log_all_scores: true                 # Log scores for analytics
    bypass_signals:                       # Skip validation
      - "no rubric"
      - "skip validation"
      - "raw output"
```

---

## Database Schema (GORM Models)

```go
// RubricScore stores per-dimension scores for each validation attempt.
type RubricScore struct {
    Id            string  `gorm:"primaryKey"`
    SessionId     string  `gorm:"not null;index:IdxRubricScoreSession"`
    MessageId     string  `gorm:"not null"`
    AttemptNumber int     `gorm:"not null;default:1"`
    Dimension     string  `gorm:"not null;index:IdxRubricScoreDimension"`
    Score         int     `gorm:"not null"`  // CHECK constraint: 1-5, enforced in validation layer
    Weight        float64 `gorm:"not null;default:1.0"`
    Critique      string  `gorm:"type:text"`
    CreatedAt     time.Time

    // Relationships
    Session ChatSession `gorm:"foreignKey:SessionId;references:Id"`
}

// RubricAttempt stores aggregate results for each validation attempt.
type RubricAttempt struct {
    Id             string  `gorm:"primaryKey"`
    SessionId      string  `gorm:"not null"`
    MessageId      string  `gorm:"not null;index:IdxRubricAttemptMessage"`
    AttemptNumber  int     `gorm:"not null"`
    Profile        string  `gorm:"not null"`
    WeightedScore  float64 `gorm:"not null"`
    Passed         bool    `gorm:"not null"`
    JudgeModel     string  `gorm:"not null"`
    JudgeLatencyMs int
    CreatedAt      time.Time
}
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 9900 | `ErrRubricJudgeFailed` | Judge model call failed |
| 9901 | `ErrRubricMaxRetries` | Max retry attempts exhausted |
| 9902 | `ErrRubricParseFailed` | Could not parse judge scores |
| 9903 | `ErrRubricProfileUnknown` | Unknown rubric profile requested |
| 9904 | `ErrRubricDimensionUnknown` | Unknown rubric dimension |
| 9905 | `ErrRubricThresholdInvalid` | Threshold value out of range |

---

## Related Specs

- [Adaptive Reasoning Flow](../37-adaptive-reasoning-flow.md)
- [Lovable Reasoning Defaults](../42-lovable-reasoning-defaults.md)
- [Suggestions System](../34-suggestions-system.md)
- [Execution Retry Strategies](../49-execution-retry-strategies.md)
- [Resilient Execution System](../../../11-spec-management-software/05-features/06-ai-integration/12-resilient-execution-system.md)
