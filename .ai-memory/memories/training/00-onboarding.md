# AI Training: Onboarding Guide

**Version:** 2.0.0  
**Updated:** 2026-02-04  
**Purpose:** Primary entry point for AI agents to understand and write specs

---

## 🚀 Recommended Entry Point

> **For fastest onboarding, start with [context-for-ai.md](../../../context-for-ai.md)** in the project root.
>
> This consolidated file provides a complete 5-minute overview of:
> - Split Database System (4-tier SQLite)
> - Seedable Configuration Pattern
> - Error Code Registry
> - Initialization Order
> - Naming Conventions
> - Coding Standards
>
> **Local copy:** [10-context-for-ai-consolidated.md](./10-context-for-ai-consolidated.md)

---

## Project Identity

**Spec Management Software** is a local-first specification authoring and validation system.

- **Backend:** Golang + SQLite (GORM)
- **Frontend:** React + TypeScript + Tailwind CSS
- **Architecture:** Local-first with hybrid storage

---

## 🚨 Critical Constraint

**THIS IS A SPEC-ONLY REPOSITORY.**

| ❌ Never Do | ✅ Always Do |
|-------------|--------------|
| Implement code | Write specifications |
| Suggest "Implement X" | Suggest spec improvements |
| Generate source files | Generate documentation |

---

## Core Principles

1. **100% Health Score Target** — All specs must pass consistency checks
2. **Dual-Format Artifacts** — Markdown for humans, JSON for machines
3. **Bidirectional Cross-References** — All links must work both ways
4. **Iterative Quality Loops** — Auto-fix until 99%+ target reached

---

## Key Capabilities

| Capability | Description |
|------------|-------------|
| Spec Authoring | Markdown templates with YAML frontmatter |
| AI Drafting | Voice-to-text → Proofread → Plan → Execute |
| Consistency Checking | Link validation, naming enforcement |
| Code Generation | Three-phase pipeline (Writing → Consistency → Build) |
| CLI Tools | `gsearch` (search), `brun` (build runner) |

---

## AI Authorization

AI models are explicitly authorized to:
- Access, read, write, and rewrite files
- Follow the established folder conventions
- Maintain cross-reference integrity
- Generate new specs following patterns

---

## Learning Path

### Quick Start (60 seconds)
1. [context-for-ai.md](../../../context-for-ai.md) — Consolidated context
2. [No-Code Policy](../constraints/01-no-code-policy.md) — Critical constraint

### Standard Path (5 minutes)
1. [Conventions](./01-conventions.md) — Naming and structure rules
2. [Folder Structure](./02-folder-structure.md) — Directory organization
3. [Spec Patterns](./03-spec-patterns.md) — Example specifications
4. [Feature Template](./04-feature-template.md) — New feature boilerplate

### Full Training (15 minutes)
1. [AI Handoff Package](./06-ai-handoff-package.md) — Complete handoff bundle
2. [AI Quickstart Guide](./08-ai-quickstart-guide.md) — Rapid onboarding
3. [Memory Index](../00-memory-index.md) — Full 79-file inventory

---

## Related Files

- [Consolidated Context](./10-context-for-ai-consolidated.md)
- [Memory Index](../00-memory-index.md)
- [Reliability Report](../../reliability-risk-report.md)
