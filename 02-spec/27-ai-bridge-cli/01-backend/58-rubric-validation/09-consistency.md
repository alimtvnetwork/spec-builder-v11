# Rubric: Consistency

**Version:** 5.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  
**Profiles:** `coding`, `chat`, `spec`, `all`

---

## Purpose

Evaluates whether the response is internally consistent and consistent with prior conversation context. Catches contradictions within the response, contradictions with previous messages, and inconsistent terminology/naming.

---

## Scoring Criteria

| Score | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | **Poor** | Major contradictions; directly conflicts with prior context | Says "use library X" then "don't use library X"; contradicts user's stated requirements |
| 2 | **Below Standard** | Multiple inconsistencies in terminology or logic | Uses different names for same concept; changes recommendations mid-response |
| 3 | **Adequate** | Mostly consistent; minor terminology variations | Slight naming inconsistencies (e.g., "config" vs "configuration" interchangeably) |
| 4 | **Good** | Fully consistent internally and with conversation context | Same terms throughout; aligns with all prior decisions and context |
| 5 | **Excellent** | Perfectly consistent; explicitly builds on prior context | References previous decisions; maintains terminology; flags any intentional changes |

---

## Default Threshold

**4** — Must be consistent with itself and prior context.

## Weight

**1.0** — Standard importance.

---

## Consistency Checks

| Type | What to Check |
|------|---------------|
| **Internal** | No contradictions within the response itself |
| **Conversational** | Aligns with prior messages in the session |
| **Terminological** | Same concepts use same names throughout |
| **Decisional** | Doesn't reverse prior agreed-upon decisions without flagging the change |
| **Technical** | Same patterns/architectures used consistently |

---

## Judge Prompt Template

```
You are a consistency judge. Evaluate the AI response for internal and contextual consistency.

## Context
- User prompt: {user_prompt}
- AI response: {ai_response}
- Conversation history: {conversation_history}
- Prior decisions/agreements: {prior_decisions}

## Instructions
1. Check for internal contradictions within the response
2. Check for contradictions with prior conversation messages
3. Check terminology consistency
4. Check if prior decisions are respected or changes are flagged
5. Score from 1-5

## Output (JSON)
{
  "score": <1-5>,
  "contradictions": [{"type": "internal|contextual|terminological", "detail": "..."}],
  "critique": "<actionable feedback for retry>"
}
```

---

## Retry Strategy

When score < threshold:
1. List all contradictions found
2. Specify which prior decisions or terminology should be maintained
3. Add instruction: "Your response contains inconsistencies: {contradictions}. Ensure alignment with the conversation context and use consistent terminology."
