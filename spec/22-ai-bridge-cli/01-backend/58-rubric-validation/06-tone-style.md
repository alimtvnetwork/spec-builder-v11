# Rubric: Tone & Style

**Version:** 5.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  
**Profiles:** `writing`, `chat`, `all`

---

## Purpose

Evaluates whether the response matches the expected tone, voice, and stylistic requirements. This includes formality level, brand voice consistency, audience-appropriate language, and adherence to any style guides defined in presets.

---

## Scoring Criteria

| Score | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | **Poor** | Completely wrong tone; inappropriate for context | Casual/sarcastic tone in formal business context; overly technical for non-technical audience |
| 2 | **Below Standard** | Inconsistent tone; shifts between registers | Starts formal, becomes casual mid-response; mixes jargon with simple language |
| 3 | **Adequate** | Acceptable tone; minor style inconsistencies | Generally appropriate but occasionally too verbose or too terse |
| 4 | **Good** | Consistent tone matching audience and context | Professional yet approachable; appropriate complexity level throughout |
| 5 | **Excellent** | Perfect tone; feels natural and purposeful | Matches brand voice exactly; every word choice deliberate and audience-aware |

---

## Default Threshold

**3** — Acceptable tone with minor inconsistencies OK.

## Weight

**0.8** — Lower priority than accuracy/safety but important for user experience.

---

## Style Dimensions

| Dimension | Spectrum |
|-----------|----------|
| **Formality** | Casual ↔ Formal |
| **Complexity** | Simple ↔ Technical |
| **Verbosity** | Terse ↔ Verbose |
| **Personality** | Neutral ↔ Opinionated |
| **Empathy** | Matter-of-fact ↔ Empathetic |

---

## Judge Prompt Template

```
You are a tone and style judge. Evaluate whether the AI response matches the expected communication style.

## Context
- User prompt: {user_prompt}
- AI response: {ai_response}
- Expected tone: {expected_tone}
- Target audience: {target_audience}
- Style guide: {style_guide}
- Brand voice: {brand_voice}

## Instructions
1. Assess formality level against expectations
2. Check vocabulary complexity matches target audience
3. Check for tone consistency throughout the response
4. Verify adherence to any style guide rules
5. Score from 1-5

## Output (JSON)
{
  "score": <1-5>,
  "tone_detected": "<formal|casual|technical|friendly|etc>",
  "style_issues": [{"location": "...", "issue": "...", "suggestion": "..."}],
  "critique": "<actionable feedback for retry>"
}
```

---

## Retry Strategy

When score < threshold:
1. Specify the exact tone expected
2. Highlight sections with wrong tone
3. Add instruction: "Rewrite using a {expected_tone} tone appropriate for {target_audience}. Specifically fix: {style_issues}"
