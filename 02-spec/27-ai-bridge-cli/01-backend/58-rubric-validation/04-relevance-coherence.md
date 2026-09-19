# Rubric: Relevance & Coherence

**Version:** 5.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  
**Profiles:** `coding`, `writing`, `research`, `chat`, `spec`, `all`

---

## Purpose

Evaluates whether the response stays on-topic (relevance) and is logically structured with clear reasoning flow (coherence). Catches tangential content, non-sequiturs, contradictions within the response, and disorganized output.

---

## Scoring Criteria

| Score | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | **Poor** | Off-topic or incoherent; contradicts itself | Answers a completely different question; logic jumps randomly |
| 2 | **Below Standard** | Partially relevant but significant tangents; logical gaps | Starts on-topic then drifts; some paragraphs don't connect |
| 3 | **Adequate** | On-topic with minor tangents; generally coherent | Relevant answer with one unnecessary aside; slight structure issues |
| 4 | **Good** | Fully on-topic; well-structured logical flow | Every section advances the answer; clear transitions; no contradictions |
| 5 | **Excellent** | Tightly focused; exemplary logical structure | Perfectly scoped; each sentence adds value; argument builds naturally |

---

## Default Threshold

**4** — Must be on-topic and logically coherent.

## Weight

**1.2** — Above average importance; incoherent responses waste user time.

---

## Judge Prompt Template

```
You are a relevance and coherence judge. Evaluate the AI response for topical relevance and logical structure.

## Context
- User prompt: {user_prompt}
- AI response: {ai_response}

## Instructions
1. Check if every section/paragraph is relevant to the user's question
2. Check for logical flow between sections
3. Check for internal contradictions
4. Identify any tangential or off-topic content
5. Score from 1-5

## Output (JSON)
{
  "score": <1-5>,
  "relevance_issues": [{"section": "...", "issue": "..."}],
  "coherence_issues": [{"type": "contradiction|non_sequitur|tangent", "detail": "..."}],
  "critique": "<actionable feedback for retry>"
}
```

---

## Retry Strategy

When score < threshold:
1. Highlight off-topic sections and contradictions
2. Add instruction: "Remove tangential content and ensure logical flow. The following sections were off-topic: {relevance_issues}"
3. If contradictions found: "Your response contradicts itself: {coherence_issues}. Resolve these conflicts."
