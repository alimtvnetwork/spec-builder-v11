# Completed: Link Manager Cleanup Guide


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

> **ID:** C-005  
> **Original ID:** 20260131-154000-suggestion-cleanup-guide  
> **Completed:** 2026-01-31  
> **Project:** Link Manager WP Plugin

---

## Summary

Created guide for removing/separating Link Manager if not implementing in this repository.

## Decision Made

Instead of removing Link Manager, it was extracted to a self-contained folder with complete specs and memories for independent handoff.

## What to Keep

- Spec Management Software specs (`02-spec/11-spec-management-software/`)
- General workflow memories (`.lovable/memory/workflow/`)
- Suggestion workflow convention (`.lovable/memory/suggestions/README.md`)

## Outcome

- `link-manager/` folder contains complete specs
- `link-manager/.lovable/` folder contains memories and plan
- Memory files cleaned or updated in main repo
- Plan.md updated to focus on Spec Management
- Policy memory created for LM separation
