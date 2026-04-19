# Rubric: Conciseness

**Version:** 5.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  
**Profiles:** `writing`, `chat`, `all`

---

## Purpose

Evaluates whether the response is appropriately concise without sacrificing clarity or completeness. Catches unnecessary verbosity, redundant explanations, filler phrases, and over-qualification. Balances with the Completeness rubric.

---

## Scoring Criteria

| Score | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | **Poor** | Extremely verbose; buries the answer in filler | 500 words where 50 would suffice; repeats same point 3 times; walls of text |
| 2 | **Below Standard** | Noticeably padded; significant redundancy | Unnecessary preambles ("Great question! Let me explain..."); restates obvious context |
| 3 | **Adequate** | Reasonable length; some trimming possible | Slightly verbose but not egregious; a few unnecessary qualifiers |
| 4 | **Good** | Well-edited; every paragraph serves a purpose | Concise without being terse; no filler; appropriate depth |
| 5 | **Excellent** | Maximally efficient; dense with value | Every sentence adds unique value; perfectly scoped to the question |

---

## Default Threshold

**3** — Minor verbosity acceptable; no egregious padding.

## Weight

**0.7** — Lower priority; prefer complete over concise.

---

## Anti-Patterns

| Pattern | Example | Fix |
|---------|---------|-----|
| **Preamble filler** | "That's a great question! Let me break this down..." | Remove; start with the answer |
| **Redundant restating** | Repeating the user's question back before answering | Unnecessary unless clarifying ambiguity |
| **Over-qualification** | "It's important to note that, generally speaking, in most cases..." | State directly |
| **Unnecessary caveats** | Adding disclaimers to every statement | Reserve for genuinely uncertain claims |
| **Repetition** | Same point made in introduction, body, and conclusion | State once clearly |

---

## Judge Prompt Template

```
You are a conciseness judge. Evaluate whether the AI response is appropriately concise.

## Context
- User prompt: {user_prompt}
- AI response: {ai_response}
- Response length: {word_count} words

## Instructions
1. Check for filler phrases and unnecessary preambles
2. Check for redundant repetition of the same points
3. Check for over-qualification and excessive caveats
4. Assess if the response could be significantly shorter without losing value
5. Score from 1-5

## Output (JSON)
{
  "score": <1-5>,
  "word_count": <number>,
  "estimated_optimal_length": <number>,
  "verbosity_ratio": <float>,
  "filler_phrases": [<list>],
  "redundancies": [<list>],
  "critique": "<actionable feedback for retry>"
}
```

---

## Retry Strategy

When score < threshold:
1. Specify target word count range
2. List filler phrases and redundancies to remove
3. Add instruction: "Your response is {verbosity_ratio}x longer than necessary. Remove: {filler_phrases}. Eliminate redundant sections: {redundancies}. Target ~{estimated_optimal_length} words."
