# GSearch CLI: Frontend Specifications

**Version:** 3.1.0  
**Updated:** 2026-03-30    
**AI Confidence:** High  
**Ambiguity:** None

---


## Keywords

`gsearch`, `cli`, `frontend`

---

## Scoring

| Criterion | Status |
|-----------|--------|
| `00-overview.md` present | ✅ |
| AI Confidence assigned | ✅ |
| Ambiguity assigned | ✅ |
| Keywords present | ✅ |
| Scoring table present | ✅ |


## Overview

This folder contains all frontend specifications for GSearch CLI.

---

## Files

| File | Description |
|------|-------------|
| 01-settings-ui-page.md | Settings page UI specification |
| 02-frontend-architecture.md | React frontend architecture |
| 03-implementation-checklist.md | Implementation checklist |
| 04-testing-ui-page.md | Testing UI with preset data |
| **05-ui-patterns.md** | **Modal, spinner, password, localStorage patterns** |
| 06-nextjs-search-interface.md | Next.js App Router, streaming retrieval, and Server Actions |

---

## Architecture

The frontend follows the Shared CLI Frontend architecture:
- React 18+ with TypeScript
- Next.js 14+ App Router & Streaming Server Components
- Tailwind CSS + shadcn/ui
- WebSocket for real-time updates
- Theme support (20+ presets)

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Overview | `../00-overview.md` |
| Backend | `../01-backend/` |
| Deploy | `../03-deploy/` |
| Shared CLI Frontend | `../../33-shared-cli-frontend/00-overview.md` |
| UI Patterns (Modals, Spinners, Security) | `./05-ui-patterns.md` |
| Shared Hooks Library | `../../33-shared-cli-frontend/15-hooks-library.md` |
