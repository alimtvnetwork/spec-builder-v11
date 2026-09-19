# 01 — Issue Write-Up Template


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

**Usage:** Copy this template when creating a new issue file at `02-spec/61-how-app-issues-track/{NN}-{issue-slug}.md`.

---

## Copy-Paste Template

````markdown
# {NN} — {Issue Title}

**Created:** {YYYY-MM-DD}  
**Status:** Resolved | Open | In Progress  
**Severity:** Critical | High | Medium | Low

---

## Issue Summary

### What happened

{Describe the mistake or bug in plain language.}

### Where it happened

- **Feature / Module:** {Name}
- **File paths:** {List affected files}

### Symptoms and impact

{What was the visible effect? What broke or was wrong?}

### How it was discovered

{Who found it, when, and how.}

---

## Root Cause Analysis

### Direct cause

{The immediate technical reason.}

### Contributing factors

{What made it possible for this to happen?}

### Triggering conditions

{Under what circumstances does this occur?}

### Why the existing spec did not prevent it

{What was missing from the spec that allowed this?}

---

## Fix Description

### What was changed in the spec

{List the spec file(s) modified and what was added/changed. No code.}

### New rules or constraints added

{The explicit rules that now prevent recurrence.}

### Why the fix resolves the root cause

{Explain causally how the new rules prevent the issue.}

### Config changes or defaults affected

{Any configuration or default value changes. Write "None" if not applicable.}

### Logging or diagnostics required

{Any observability additions. Write "None" if not applicable.}

---

## Iterations History

> Include this section only if multiple attempts were needed.

### Iteration 1

- **What was tried:** {Description}
- **Why it failed:** {Reason}

### Iteration 2

- **What was tried:** {Description}
- **Why it failed:** {Reason}

> Continue until final resolution.

---

## Prevention and Non-Regression

### Prevention rule

{The single, clear rule that stops recurrence.}

### Acceptance criteria / test scenarios

{How to detect regression early.}

### Guardrails or linting policies

{Any automated checks. Write "None" if not applicable.}

### Spec sections updated

{List exact file paths of updated spec files.}

---

## TODO and Follow-Ups

- [ ] {Remaining task 1}
- [ ] {Remaining task 2}

---

## Done Checklist

- [ ] Issue write-up created at `02-spec/61-how-app-issues-track/{NN}-{slug}.md`
- [ ] Relevant spec(s) updated with corrected behavior and constraints
- [ ] Memory updated with summary and prevention rule
- [ ] Acceptance criteria updated or added
- [ ] Iterations recorded (if applicable)
````
