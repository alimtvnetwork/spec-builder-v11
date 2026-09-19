# Self-Validation Engine

**Version:** 5.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Summary

The Self-Validation Engine orchestrates the rubric evaluation loop. It sits between the AI generation step and the response delivery, running the judge model against the configured rubric profile, managing retries, and selecting the best response across attempts.

---

## Architecture

```
                    ┌─────────────────────────────┐
                    │     Self-Validation Engine    │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                     │
        ┌─────▼──────┐    ┌───────▼───────┐    ┌───────▼───────┐
        │  Generator  │    │  Rubric Judge │    │  Best-of-N    │
        │  (AI Model) │    │  (Thinking    │    │  Selector     │
        │             │    │   Model)      │    │               │
        └─────────────┘    └───────────────┘    └───────────────┘
```

---

## Go Interface

```go
type ValidationEngine struct {
    generator    AiClient       // Main AI model for generation
    judge        AiClient       // Thinking model for judging
    config       RubricConfig
    store        RubricStore    // Persistence for scores/attempts
}

type RubricConfig struct {
    Enabled          bool
    MaxRetries       int
    Profile          string
    MinWeightedScore float64
    FailFastThreshold int
    BypassSignals    []string
    Dimensions       []DimensionConfig
}

type DimensionConfig struct {
    Name      string
    Threshold int
    Weight    float64
    Enabled   bool
    Prompt    string       // Judge prompt template
}

type ValidationResult struct {
    Passed         bool
    AttemptNumber  int
    WeightedScore  float64
    Scores         []DimensionScore
    BestResponse   string
    Critique       string        `json:",omitempty"`
    RetryFeedback  string        `json:",omitempty"`
}

type DimensionScore struct {
    Dimension string
    Score     int
    Weight    float64
    Threshold int
    Passed    bool
    Critique  string
}
```

---

## Validation Loop

```go
func (e *ValidationEngine) ValidateAndReturn(
    context stdctx.Context,
    prompt string,
    conversationHistory []Message,
    ragContext []RagChunk,
) apperror.Result[ValidationResult] {
    
    // 1. Check bypass signals
    if e.shouldBypass(prompt) {
        response := e.generator.Generate(context, prompt)
        return apperror.Ok(ValidationResult{Passed: true, BestResponse: response})
    }
    
    // 2. Get active dimensions for profile
    dimensions := e.getActiveDimensions()
    
    // 3. Retry loop
    var bestResult ValidationResult
    for attempt := 1; attempt <= e.config.MaxRetries; attempt++ {
        
        // Generate response (with retry feedback if not first attempt)
        response := e.generate(context, prompt, bestResult.RetryFeedback)
        
        // Judge against all dimensions
        scores := e.judge(context, response, dimensions, prompt, ragContext)
        
        // Calculate weighted score
        result := e.evaluate(scores, attempt, response)
        
        // Store scores for analytics
        e.store.SaveAttempt(context, result)
        
        // Check if passed
        if result.Passed {
            return apperror.Ok(result)
        }
        
        // Track best result
        if result.WeightedScore > bestResult.WeightedScore {
            bestResult = result
        }
        
        // Fail-fast: if any dimension ≤ fail-fast threshold
        if e.hasFailFast(scores) {
            bestResult.RetryFeedback = e.buildCritique(scores)
            continue
        }
    }
    
    // Max retries exhausted — return best attempt with warning
    bestResult.Passed = false

    return apperror.FailNew[ValidationResult](
        ErrMaxRetriesExhausted,
        "max retries exhausted",
    )
}
```

---

## Weighted Score Calculation

```
weighted_score = Σ(dimension_score × dimension_weight) / Σ(dimension_weight)
```

A response passes if:
1. `weighted_score >= min_weighted_score` (default 3.5)
2. No individual dimension score is ≤ `fail_fast_threshold` (default 2)
3. Safety dimension score == 5 (hardcoded, non-negotiable)

---

## Judge Call Strategy

The judge call can be structured in two ways:

### Single-Call Judge (Default)
One LLM call scores ALL dimensions at once. Faster but less thorough.

```json
{
  "model": "thinking",
  "messages": [
    {"role": "system", "content": "<combined rubric prompt>"},
    {"role": "user", "content": "Score this response:\n{response}"}
  ],
  "tools": [{
    "type": "function",
    "function": {
      "name": "submit_scores",
      "parameters": {
        "type": "object",
        "properties": {
          "scores": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "dimension": {"type": "string"},
                "score": {"type": "integer", "minimum": 1, "maximum": 5},
                "critique": {"type": "string"}
              }
            }
          },
          "overall_critique": {"type": "string"}
        }
      }
    }
  }]
}
```

### Multi-Call Judge (Thorough)
One LLM call per dimension. More expensive but more accurate. Use for high-criticality tasks.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/rubric/config` | Get current rubric configuration |
| `PUT` | `/api/rubric/config` | Update rubric configuration |
| `GET` | `/api/rubric/profiles` | List available rubric profiles |
| `GET` | `/api/rubric/profiles/{name}` | Get profile details |
| `PUT` | `/api/rubric/profiles/{name}` | Update profile |
| `POST` | `/api/rubric/profiles` | Create custom profile |
| `GET` | `/api/rubric/scores/{sessionId}` | Get scores for a session |
| `GET` | `/api/rubric/analytics` | Aggregate rubric analytics |
| `POST` | `/api/rubric/test` | Test a response against a rubric (dry run) |

---

## Settings Integration

```yaml
# Seedable via settings service (spec 57)
rubric_validation:
  enabled: true
  max_retries: 3
  default_profile: "chat"
  judge_model: "thinking"
  judge_strategy: "single"     # single | multi
  min_weighted_score: 3.5
  fail_fast_threshold: 2
  log_all_scores: true
  bypass_signals:
    - "no rubric"
    - "skip validation"
    - "raw output"
  dimensions:
    factual_accuracy:
      enabled: true
      threshold: 4
      weight: 1.5
    instruction_following:
      enabled: true
      threshold: 4
      weight: 1.5
    completeness:
      enabled: true
      threshold: 3
      weight: 1.0
    relevance_coherence:
      enabled: true
      threshold: 4
      weight: 1.2
    safety_harmlessness:
      enabled: true
      threshold: 5
      weight: 2.0
    tone_style:
      enabled: true
      threshold: 3
      weight: 0.8
    code_quality:
      enabled: true
      threshold: 4
      weight: 1.3
    groundedness:
      enabled: true
      threshold: 4
      weight: 1.4
    consistency:
      enabled: true
      threshold: 4
      weight: 1.0
    conciseness:
      enabled: true
      threshold: 3
      weight: 0.7
    context_utilization:
      enabled: true
      threshold: 3
      weight: 1.0
```

---

## Analytics & Observability

### Prometheus Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `rubric_validation_total` | Counter | Total validation attempts |
| `rubric_validation_passed` | Counter | Validations that passed |
| `rubric_validation_retries` | Histogram | Retry count distribution |
| `rubric_dimension_score` | Histogram | Score distribution per dimension |
| `rubric_judge_latency_ms` | Histogram | Judge call latency |
| `rubric_weighted_score` | Histogram | Weighted score distribution |

### Dashboard Queries

- **Pass Rate**: `rubric_validation_passed / rubric_validation_total`
- **Avg Retries**: Mean of `rubric_validation_retries`
- **Weakest Dimension**: Dimension with lowest average score
- **Cost Impact**: Additional token usage from judge calls + retries

---

## Performance Considerations

| Concern | Mitigation |
|---------|------------|
| **Latency** | Single-call judge adds ~1-3s; bypass signals skip entirely |
| **Cost** | Judge call uses ~500-1000 tokens; retries multiply cost |
| **False Positives** | Calibrate thresholds; start lenient and tighten |
| **Judge Reliability** | Use thinking model for better judgment; calibrate against human scores |

---

## Error Codes

Uses error codes 9900-9905 defined in [Overview](./00-overview.md).

---

## Related Specs

- [Adaptive Reasoning Flow](../37-adaptive-reasoning-flow.md)
- [Execution Retry Strategies](../49-execution-retry-strategies.md)
- [Settings Service](../57-settings-service.md)
- [Observability](../56-observability.md)
- [Error Codes](../05-error-codes.md)
