# Rubric: Completeness

**Version:** 5.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  
**Profiles:** `coding`, `writing`, `research`, `spec`, `all`

---

## Purpose

Evaluates whether the response covers all aspects of the user's request without leaving gaps, unfinished sections, or placeholder content. Balances thoroughness against unnecessary verbosity (see Conciseness rubric).

---

## Scoring Criteria

| Score | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | **Poor** | Major sections missing; response is a fragment | Only answers half the question; code has TODO placeholders everywhere |
| 2 | **Below Standard** | Significant gaps; key aspects unaddressed | Covers 2 of 4 requested topics; missing error handling in code |
| 3 | **Adequate** | Core aspects covered; minor gaps acceptable | Main answer complete but missing edge cases or examples |
| 4 | **Good** | All aspects covered thoroughly | Every requested point addressed; code handles happy path + errors |
| 5 | **Excellent** | Comprehensive with edge cases, examples, and caveats | Full coverage + anticipates follow-up questions + examples |

---

## Default Threshold

**3** — Core aspects must be covered; minor gaps acceptable.

## Weight

**1.0** — Standard importance.

---

## Judge Prompt Template

```
You are a completeness judge. Evaluate whether the AI response fully addresses the user's request.

## Context
- User prompt: {user_prompt}
- AI response: {ai_response}

## Instructions
1. Break the user's request into discrete sub-topics or requirements
2. Check which sub-topics are addressed in the response
3. Identify any gaps, unfinished sections, or placeholder content
4. Score coverage from 1-5

## Output (JSON)
{
  "score": <1-5>,
  "topics_expected": [<list>],
  "topics_covered": [<list>],
  "topics_missing": [<list>],
  "has_placeholders": <boolean>,
  "critique": "<actionable feedback for retry>"
}
```

---

## Retry Strategy

When score < threshold:
1. List missing topics/sections
2. Add instruction: "Your response is missing coverage of: {topics_missing}. Please expand to include these areas."
3. If placeholders found, instruct: "Replace all TODO/placeholder content with actual implementation."

---

## Special Cases

| Case | Handling |
|------|----------|
| Simple questions | A brief, direct answer scores 5 if it fully answers the question |
| Multi-part questions | Each part must be addressed; missing any part caps score at 3 |
| Open-ended requests | Judge should assess reasonable scope; not penalize for not covering everything possible |
| Code generation | Must include imports, error handling, and usage examples to score 4+ |
