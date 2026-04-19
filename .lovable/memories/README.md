# .lovable/memories - Memory Index

> **Updated:** 2026-02-04  
**Version:** 1.0.0  
> **Purpose:** Central navigation for all Lovable AI memories

---

## 📍 Comprehensive Inventory

**For a complete inventory of all ~172 memory files across 21 folders, see:**

👉 **[`00-memory-index.md`](./00-memory-index.md)** — Full breakdown with tiered ingestion strategy

**For rapid 5-minute onboarding, see:**

👉 **[`context-for-ai.md`](../../context-for-ai.md)** — Single-page summary in project root

---

## 🚨 CRITICAL CONSTRAINT

**THIS IS A SPEC-ONLY REPOSITORY.**

| Rule | Description |
|------|-------------|
| ❌ **NO CODE IMPLEMENTATION** | Never implement code unless explicitly requested by the user |
| ❌ **NO "Implement X" SUGGESTIONS** | Do not suggest code implementation as next steps |
| ✅ **SPECS ONLY** | Only write specifications, documentation, and planning documents |
| ✅ **SPEC IMPROVEMENTS** | Suggestions should focus on improving specs, not implementing them |

**This repository contains specifications to be handed off to other AI models or developers for implementation. The work here is documentation and planning only.**

---

## Directory Structure

> **Note:** This tree shows key files only. For the complete inventory (~172 files across 21 folders), see [`00-memory-index.md`](./00-memory-index.md).

```
.lovable/memories/
├── 00-memory-index.md           # 📍 COMPREHENSIVE INVENTORY (~172 files, 21 folders)
├── README.md                    # This file (🚨 READ CRITICAL CONSTRAINT ABOVE)
├── suggestions.md               # Legacy tracker (redirects to suggestions/)
├── training/                    # 🎯 AI TRAINING PACKAGE (start here)
│   ├── 00-onboarding.md         # Entry point for AI agents
│   ├── 01-conventions.md        # Naming and structure rules
│   ├── 02-folder-structure.md   # Directory organization
│   ├── 03-spec-patterns.md      # Example specifications
│   ├── 04-feature-template.md   # New feature boilerplate
│   ├── 05-training-package.md   # 📦 SUBSYSTEM TRAINING PACKAGES
│   ├── 13-ai-comprehension-quiz.md # Training verification quiz
│   └── 14-ai-training-complete.md  # Training completion marker
├── constraints/                 # ⚠️ CRITICAL RULES & PATTERNS
│   ├── coding-guidelines.md     # TypeScript/Go standards, enums
│   ├── error-management.md      # Error codes (347 total), handling patterns
│   └── cli-error-code-summary.md# 🆕 All CLI error code ranges
├── spec-management/             # Project-level documentation
│   ├── project-overview.md
│   ├── file-structure-conventions.md
│   └── cross-reference-validation.md
├── features/                    # Feature specifications
│   ├── code-generation-system-architecture.md
│   ├── build-runner-cli.md
│   ├── golang-search-cli.md
│   ├── consistency-checker.md
│   ├── automation-pipeline.md
│   ├── escalation-notifications.md
│   ├── mermaid-diagrams.md
│   ├── resilient-execution-system.md
│   ├── ai-bridge/               # AI Bridge adapter
│   └── telemetry-dashboard.md
├── ai-integration/              # AI system documentation
│   ├── instruction-system.md
│   ├── rag-system.md
│   ├── knowledge-memory-system.md
│   └── model-management.md
├── logic/                       # 🧮 FORMULAS & ALGORITHMS
│   └── health-score-formula.md  # Canonical 6-field HealthScore
├── wp-plugins/                  # 🔌 WORDPRESS PLUGIN SPECS
│   └── link-manager.md          # Link management plugin (14xxx errors)
├── qa/                          # 🟡 Quality assurance baselines
│   ├── consistency-standards.md # v30.0.0 health score (100/100 A+)
│   └── link-integrity.md       # v30.0.0 link remediation (847/847)
├── ui/                          # UI component documentation
│   ├── project-editor.md
│   ├── ai-chat-interface.md
│   └── code-generation-dashboard.md
└── guidelines/                  # Standards and conventions
    ├── ai-output-standard.md
    ├── quality-standards.md
    └── typescript-enums.md
```

---

## 🎯 AI Training (Start Here)

To train an external AI model to write specs for this project:

**Feed these files in order:**
1. `.lovable/memories/training/00-onboarding.md` — Entry point
2. `.lovable/memories/training/01-conventions.md` — Naming rules
3. `.lovable/memories/training/02-folder-structure.md` — Directory organization
4. `.lovable/memories/training/03-spec-patterns.md` — Example templates
5. `.lovable/memories/training/04-feature-template.md` — New feature boilerplate

**Minimum viable package:** Just feed the entire `training/` folder.

---

## Quick Reference

| Domain | Key Files |
|--------|-----------|
| **🚨 Critical Constraint** | THIS FILE — Read first! No implementation, specs only |
| **🎯 Training** | `training/00-onboarding.md` (start here) |
| **📦 Subsystem Packages** | `training/05-training-package.md` (AI Bridge, gsearch, brun, full backend) |
| **⚠️ Constraints** | `constraints/coding-guidelines.md`, `constraints/error-management.md` |
| **🔢 Error Codes** | `constraints/cli-error-code-summary.md` (all CLI error ranges) |
| **📋 Remediation** | `project/spec-remediation-plan.md` (Tier 1-4 priorities) |
| **📝 Patterns** | `patterns/spec-template.md` (Minimum Viable Spec format) |
| **🧮 Logic** | `logic/health-score-formula.md` (canonical 6-field formula) |
| **🔌 AI Bridge** | `features/ai-bridge/`, `spec/22-ai-bridge-cli/` |
| **Project** | `spec-management/project-overview.md` |
| **Code Gen** | `features/code-generation-system-architecture.md` |
| **AI** | `ai-integration/instruction-system.md`, `model-management.md` |
| **UI** | `ui/project-editor.md`, `ai-chat-interface.md` |

---

## Quick Context Entry Point

For rapid AI onboarding, see [`context-for-ai.md`](../../context-for-ai.md) in the project root — a single-file summary covering:
- Split Database System (4-tier SQLite architecture)
- Seedable Configuration Pattern (versioned config lifecycle)
- Key directory structure and coding standards

---

## Bidirectional Sync

All project memories are consolidated in this folder (`.lovable/memories/`).

---

## Usage

Reference memories when:
1. **Quick start** — Read `context-for-ai.md` for essential patterns
2. **Full training** — Use `training/` folder as comprehensive context
3. Understanding project structure
4. Following naming conventions
5. Validating cross-references
6. Writing new specifications
7. Generating specification documents

---

## ⚠️ REMINDER: NO IMPLEMENTATION

This repository is for **specifications only**. When a new AI agent or developer is handed these specs, **they** will implement the code in a separate repository. Our job here is:

✅ Write detailed specifications  
✅ Document error codes and patterns  
✅ Create consistency reports  
✅ Maintain cross-references  
✅ Plan and prioritize work  
❌ Never implement code  
❌ Never suggest "Implement X" as a next step
