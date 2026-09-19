# Rubric: Code Quality

**Version:** 5.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  
**Profiles:** `coding`, `all`

---

## Purpose

Evaluates the quality of any generated code in the response. Checks for correctness, readability, idiomatic patterns, error handling, performance, and adherence to project coding standards. Only active when the response contains code.

---

## Scoring Criteria

| Score | Label | Description | Examples |
|-------|-------|-------------|----------|
| 1 | **Poor** | Code won't compile/run; fundamental logic errors | Syntax errors; undefined variables; infinite loops; wrong language |
| 2 | **Below Standard** | Code runs but has significant bugs or anti-patterns | Missing error handling; race conditions; SQL injection; global state abuse |
| 3 | **Adequate** | Code works for happy path; some quality issues | No edge case handling; inconsistent naming; missing docs |
| 4 | **Good** | Clean, idiomatic code with proper error handling | Follows language conventions; handles errors; readable; testable |
| 5 | **Excellent** | Production-quality; follows all project standards | Idiomatic; well-documented; performant; handles edge cases; testable |

---

## Default Threshold

**4** — Code must be clean and handle errors properly.

## Weight

**1.3** — High importance for coding tasks.

---

## Quality Dimensions

| Dimension | What to Check |
|-----------|---------------|
| **Correctness** | Does the code do what was asked? Logic errors? |
| **Compilability** | Will it compile/parse without errors? |
| **Error Handling** | Are errors caught and handled gracefully? |
| **Idiomaticity** | Does it follow language conventions? (Go: error returns, not exceptions) |
| **Readability** | Clear naming, comments, structure? |
| **Performance** | Obvious inefficiencies? N+1 queries? Unnecessary allocations? |
| **Security** | Input validation? SQL injection? XSS? (Also covered by Safety rubric) |
| **Testability** | Can the code be unit tested? Dependency injection? |
| **Standards Compliance** | Follows project coding guidelines? (See coding-guidelines specs) |

---

## Language-Specific Checks

### Go
- Error handling via return values, not panics
- Proper use of `context.Context`
- No redundant JSON tags (project standard)
- Abbreviation casing follows project conventions (Id, Url, Api)
- Structs use GORM tags correctly

### TypeScript
- Proper typing (no `any` abuse)
- React hooks rules followed
- No memory leaks in useEffect

### PHP (WordPress)
- Proper escaping/sanitization
- Nonce verification
- Capability checks

---

## Judge Prompt Template

```
You are a code quality judge. Evaluate the generated code for quality, correctness, and standards compliance.

## Context
- User prompt: {user_prompt}
- AI response: {ai_response}
- Target language: {language}
- Project coding standards: {coding_standards}

## Instructions
1. Check if code compiles/parses correctly
2. Check for logic errors and bugs
3. Evaluate error handling completeness
4. Check language idiomaticity
5. Check readability and naming conventions
6. Check for performance anti-patterns
7. Verify against project coding standards
8. Score from 1-5

## Output (JSON)
{
  "score": <1-5>,
  "language_detected": "<go|typescript|php|etc>",
  "issues": [{"severity": "critical|major|minor", "type": "...", "location": "...", "detail": "...", "fix": "..."}],
  "standards_violations": [{"rule": "...", "detail": "..."}],
  "critique": "<actionable feedback for retry>"
}
```

---

## Retry Strategy

When score < threshold:
1. List all code issues with severity levels
2. Critical issues first, then major, then minor
3. Add instruction: "Fix the following code issues: {issues}. Ensure compliance with project standards: {standards_violations}"
4. Include the project's coding guidelines as additional context
