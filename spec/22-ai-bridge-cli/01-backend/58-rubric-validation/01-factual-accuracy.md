# Rubric: Factual Accuracy

**Version:** 5.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  
**Profiles:** `coding`, `writing`, `research`, `spec`, `all`

---

## Purpose

Evaluates whether the AI response contains factually correct information. The judge checks for hallucinated facts, incorrect technical details, made-up APIs/functions, wrong statistics, and fabricated citations.

---

## Scoring Criteria

| Score | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | **Poor** | Multiple factual errors; fabricated information presented as fact | Invents a Go stdlib function that doesn't exist; cites a paper that doesn't exist |
| 2 | **Below Standard** | Contains 2+ factual inaccuracies; some hallucinated details | Incorrect function signatures; wrong version numbers; misattributed quotes |
| 3 | **Adequate** | Mostly correct; 1 minor factual error that doesn't mislead | Slightly wrong default value; outdated but close version number |
| 4 | **Good** | Fully accurate with verifiable claims; negligible issues | All APIs correct; dates accurate; technical details verified |
| 5 | **Excellent** | Technically rigorous; explicitly acknowledges uncertainty where appropriate | Correct + adds caveats like "as of v2.x" or "verify in your environment" |

---

## Default Threshold

**4** — Responses must be factually accurate. A score of 3 triggers a retry.

## Weight

**1.5** — High importance; factual errors erode trust.

---

## Judge Prompt Template

```
You are a factual accuracy judge. Evaluate the following AI response for factual correctness.

## Context
- User prompt: {user_prompt}
- AI response: {ai_response}
- Available context/sources: {rag_context}

## Instructions
1. Identify every factual claim in the response
2. Check each claim against provided context, known facts, and technical correctness
3. Flag any hallucinated, fabricated, or incorrect information
4. Score from 1-5 using the rubric below

## Scoring
- 1: Multiple factual errors, fabricated information
- 2: 2+ inaccuracies, some hallucinated details
- 3: Mostly correct, 1 minor error
- 4: Fully accurate, verifiable claims
- 5: Rigorous accuracy with uncertainty acknowledgment

## Output (JSON)
{
  "score": <1-5>,
  "claims_checked": <number>,
  "errors_found": [{"claim": "...", "issue": "...", "correction": "..."}],
  "critique": "<actionable feedback for retry>"
}
```

---

## Retry Strategy

When score < threshold:
1. Include the critique in the retry prompt
2. Specifically highlight incorrect claims and their corrections
3. Add instruction: "Verify all factual claims before responding. The following errors were found in your previous attempt: {errors}"

---

## Special Cases

| Case | Handling |
|------|----------|
| Speculative/opinion content | Judge should distinguish facts from opinions; opinions don't count as factual errors |
| Outdated information | Score 3 if the info was correct at some point but is now outdated; score 2 if fundamentally wrong |
| Hedged claims | "I believe X" or "X might be" are acceptable if clearly hedged; don't penalize uncertainty |
| Domain-specific jargon | Judge should use domain context (RAG) to verify specialized claims |

---

## Metrics

- `rubric.factual_accuracy.avg_score` — Rolling average score
- `rubric.factual_accuracy.retry_rate` — % of responses requiring retry for this dimension
- `rubric.factual_accuracy.common_errors` — Most frequent error categories
