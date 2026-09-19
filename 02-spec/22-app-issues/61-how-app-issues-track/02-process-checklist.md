# 02 — Process Checklist

**Version:** 2.0.0  
**Created:** 2026-03-09

---

## Mandatory Checklist — After Every Fix

Follow this checklist **every time** a mistake is discovered and fixed. A fix is incomplete until all items are checked.

---

### Step 1 — Document the Issue

- [ ] Create a new file at `02-spec/61-how-app-issues-track/{NN}-{issue-slug}.md`
- [ ] Use the template from `01-issue-template.md`
- [ ] Fill in all mandatory sections (Summary, Root Cause, Fix, Prevention)
- [ ] Record iterations if more than one attempt was needed

### Step 2 — Update the Relevant Spec

- [ ] Identify the spec file(s) that should have prevented this
- [ ] Add corrected behavior and explicit constraints
- [ ] Add a **Known Pitfalls and Prevention** section referencing the issue file
- [ ] Update acceptance criteria to make regression testable

### Step 3 — Update Memory

- [ ] Update `.ai-memory/memories/workflow/03-mistake-remediation-protocol.md`
- [ ] Include: short description, prevention rule, issue file path
- [ ] **Memory update is mandatory — fix is not complete without it**

### Step 4 — Verify

- [ ] Confirm the issue file follows naming convention: `{NN}-{issue-slug}.md`
- [ ] Confirm cross-references between issue file ↔ spec ↔ memory are valid
- [ ] Confirm no broken links were introduced

---

## Quick Reference

| Item | Location |
|------|----------|
| Issue files | `02-spec/61-how-app-issues-track/{NN}-{slug}.md` |
| Template | `02-spec/61-how-app-issues-track/01-issue-template.md` |
| Memory | `.ai-memory/memories/workflow/03-mistake-remediation-protocol.md` |
| Next issue number | Sequential from `03` onward |
