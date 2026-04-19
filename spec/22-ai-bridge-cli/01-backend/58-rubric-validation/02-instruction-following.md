# Rubric: Instruction Following

**Version:** 5.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  
**Profiles:** `coding`, `writing`, `research`, `chat`, `spec`, `all`

---

## Purpose

Evaluates whether the AI response faithfully follows the user's instructions, system prompt directives, and any preset/template constraints. This is the "did it do what was asked?" check.

---

## Scoring Criteria

| Score | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | **Poor** | Ignores the instruction entirely; does something completely different | Asked for a Go struct, returns Python class; asked for list, gives essay |
| 2 | **Below Standard** | Partially follows instruction; misses key requirements | Asked for 5 items, gives 3; asked for table format, gives bullet list |
| 3 | **Adequate** | Follows the main instruction; misses minor constraints | Correct format but wrong sort order; right content but missing one requested field |
| 4 | **Good** | Follows all explicit instructions accurately | All requested items present; correct format, language, and structure |
| 5 | **Excellent** | Follows all instructions + anticipates implicit requirements | Follows instructions perfectly + adds relevant context the user would need |

---

## Default Threshold

**4** — Must follow all explicit instructions.

## Weight

**1.5** — Critical; the core purpose of the AI is to follow instructions.

---

## Judge Prompt Template

```
You are an instruction-following judge. Evaluate whether the AI response follows the user's instructions.

## Context
- User prompt: {user_prompt}
- System prompt: {system_prompt}
- Active preset/template: {preset_name}
- Preset constraints: {preset_constraints}
- AI response: {ai_response}

## Instructions
1. Extract all explicit requirements from the user prompt
2. Extract all constraints from the system prompt and active preset
3. Check each requirement/constraint against the response
4. Score compliance from 1-5

## Checklist
- [ ] Output format matches request (JSON, Markdown, code, table, etc.)
- [ ] Language/framework matches request
- [ ] Quantity matches request (N items, N paragraphs, etc.)
- [ ] Scope matches request (not over/under-delivering)
- [ ] Constraints respected (max length, no X, must include Y)
- [ ] Persona/role maintained if specified

## Output (JSON)
{
  "score": <1-5>,
  "requirements_found": <number>,
  "requirements_met": <number>,
  "violations": [{"requirement": "...", "issue": "..."}],
  "critique": "<actionable feedback for retry>"
}
```

---

## Retry Strategy

When score < threshold:
1. List unmet requirements explicitly
2. Add instruction: "Your previous response missed these requirements: {violations}. Please address each one."
3. If format was wrong, emphasize the correct format with an example

---

## Special Cases

| Case | Handling |
|------|----------|
| Ambiguous instructions | Score 3 minimum if a reasonable interpretation was followed; don't penalize ambiguity |
| Conflicting instructions | Judge should note the conflict; score based on best-effort resolution |
| Implicit instructions | Only score on explicit requirements; implicit expectations scored in other rubrics |
| "Just do it" / skip signals | Bypass this rubric entirely per adaptive reasoning settings |
