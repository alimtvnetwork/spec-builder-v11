# Rubric: Groundedness

**Version:** 5.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  
**Profiles:** `writing`, `research`, `all`

---

## Purpose

Evaluates whether claims in the response are grounded in provided sources, RAG context, or verifiable knowledge. Catches unsupported assertions, fabricated references, and claims that go beyond what the evidence supports.

---

## Scoring Criteria

| Score | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | **Poor** | Most claims unsupported; fabricated citations | Invents research papers; makes statistical claims with no source |
| 2 | **Below Standard** | Multiple unsupported claims; some real sources misrepresented | Cites real source but misquotes it; extrapolates far beyond evidence |
| 3 | **Adequate** | Core claims grounded; some minor unsupported assertions | Main argument supported; a few tangential claims lack backing |
| 4 | **Good** | All significant claims grounded in provided context | Every major point traceable to sources; appropriate attribution |
| 5 | **Excellent** | Fully grounded with explicit source attribution; acknowledges gaps | Cites specific sections; notes when evidence is limited; distinguishes fact from inference |

---

## Default Threshold

**4** — Claims must be supported by provided context.

## Weight

**1.4** — High importance for research and writing tasks.

---

## Judge Prompt Template

```
You are a groundedness judge. Evaluate whether the AI response's claims are supported by the provided sources.

## Context
- User prompt: {user_prompt}
- AI response: {ai_response}
- RAG context/sources: {rag_sources}
- Cited references: {cited_references}

## Instructions
1. Extract all factual claims from the response
2. For each claim, check if it is supported by the provided sources
3. Check if citations/references actually exist and are accurately represented
4. Identify claims that go beyond what sources support
5. Score from 1-5

## Output (JSON)
{
  "score": <1-5>,
  "claims_total": <number>,
  "claims_grounded": <number>,
  "claims_ungrounded": [{"claim": "...", "issue": "unsupported|misrepresented|fabricated"}],
  "critique": "<actionable feedback for retry>"
}
```

---

## Retry Strategy

When score < threshold:
1. List ungrounded claims
2. Add instruction: "The following claims are not supported by the provided sources: {claims_ungrounded}. Either ground them in the provided context, remove them, or explicitly mark them as your inference."
3. Re-inject RAG context to make sources available

---

## Integration with RAG

- This rubric works best when RAG context is available
- If no RAG context provided, judge assesses against general knowledge only
- GSearch integration can be triggered to find supporting sources for ungrounded claims
