# External Tools Integration

> **Version:** 2.1.0  
> **Updated:** 2026-03-30    
**AI Confidence:** High  
**Ambiguity:** None
> **Status:** Active

---


## Keywords

`external`, `management`, `software`, `tools`

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

This folder contains reference files for standalone specifications that integrate with the Spec Management Software. Each tool has been extracted to its own root-level specification for independent development and AI training.

---

## Integrated External Tools

| # | Tool | Location | Error Range | Description |
|---|------|----------|-------------|-------------|
| 01 | [GSearch CLI](./01-gsearch-reference.md) | `spec/20-gsearch-cli/` | 7000-7999 | Search, indexing, trend analysis |
| 02 | [AI Bridge CLI](./02-ai-bridge-reference.md) | `spec/22-ai-bridge-cli/` | 9000-9999 | LLM adapter, multi-format input |
| 03 | [Nexus Flow CLI](./03-nexus-flow-reference.md) | `spec/24-nexus-flow-cli/` | 8000-8399 | Visual workflow orchestration |
| 04 | [BRun CLI](./04-brun-reference.md) | `spec/21-brun-cli/` | 7100-7599 | Build runner and task executor |
| 05 | [WP Plugin Builder](./05-wp-plugin-builder.md) | `spec/31-wp-plugin-builder/` | 10000-10999 | WordPress plugin development |

---

## Integration Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                 SPEC MANAGEMENT SOFTWARE                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              15-external-tools/                      │   │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│   │  │ GSearch │ │AI Bridge│ │Nexus    │ │ BRun    │   │   │
│   │  │Reference│ │Reference│ │Reference│ │Reference│   │   │
│   │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │   │
│   └───────┼──────────┼──────────┼──────────┼───────────┘   │
│           │          │          │          │                │
└───────────┼──────────┼──────────┼──────────┼────────────────┘
            │          │          │          │
            ▼          ▼          ▼          ▼
    ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
    │  spec/    │ │  spec/    │ │  spec/    │ │  spec/    │
    │08-gsearch-│ │10-ai-     │ │11-nexus-  │ │09-brun-   │
    │   cli/    │ │bridge-cli/│ │ flow-cli/ │ │   cli/    │
    └───────────┘ └───────────┘ └───────────┘ └───────────┘
```

---

## Extraction Status

| Phase | Tool | Status | Date |
|-------|------|--------|------|
| 1 | GSearch CLI | ✅ Complete | 2026-02-01 |
| 2 | AI Bridge | ✅ Complete | 2026-02-01 |
| 3 | Nexus Flow | ✅ Complete | 2026-02-01 |
| 4 | BRun CLI | ✅ Complete | 2026-02-01 |

---

## Usage Guidelines

1. **Do not duplicate content** — Reference files point to external specs
2. **Error code registry** — Each tool has reserved error ranges in `spec/03-error-code-registry/`
3. **Updates** — When external specs change, update reference files accordingly
4. **AI Training** — Each standalone spec is designed for independent AI training

---

*Created 2026-02-01 during spec extraction*
