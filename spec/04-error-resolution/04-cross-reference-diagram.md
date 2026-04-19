# Error Resolution Cross-Reference Diagram

> **Generated:** 2026-03-09  
**Version:** 1.0.0  
> **Status:** Complete  
> **Total Connections:** 18 outbound, 19 inbound

---

## Visual Architecture

```
                                    ┌─────────────────────────────────────────────┐
                                    │         ERROR RESOLUTION                     │
                                    │         spec/04-error-resolution/            │
                                    │                                              │
                                    │  ┌──────────────────────────────────────┐   │
                                    │  │ 00-overview.md                       │   │
                                    │  │ 01-retrospectives/                   │   │
                                    │  │ 02-verification-patterns/            │   │
                                    │  │ 03-debugging-guides/                 │   │
                                    │  │   ├── 01-debugging-php.md            │   │
                                    │  │   ├── 02-debugging-go.md             │   │
                                    │  │   └── 03-debugging-typescript.md     │   │
                                    │  └──────────────────────────────────────┘   │
                                    └─────────────────────────────────────────────┘
                                                           │
                                                           │
            ┌──────────────────────────────────────────────┼──────────────────────────────────────────────┐
            │                                              │                                               │
            ▼                                              ▼                                               ▼
┌───────────────────────────┐              ┌───────────────────────────┐               ┌───────────────────────────┐
│    ARCHITECTURE SPECS     │              │       CLI TOOLS           │               │    WORDPRESS SPECS        │
│                           │              │                           │               │                           │
│ ┌───────────────────────┐ │              │ ┌───────────────────────┐ │               │ ┌───────────────────────┐ │
│ │ 04-split-db           │◄├──────────────┤►│ 20-gsearch-cli        │ │               │ │ 30-wp-plugin/         │ │
│ │   architecture/       │ │              │ │   [Go + TS debug]     │ │               │ │   exam-manager/       │ │
│ └───────────────────────┘ │              │ └───────────────────────┘ │               │ │   [PHP + Go debug]    │ │
│                           │              │                           │               │ └───────────────────────┘ │
│ ┌───────────────────────┐ │              │ ┌───────────────────────┐ │               │                           │
│ │ 05-seedable-config    │◄├──────────────┤►│ 21-brun-cli           │ │               │ ┌───────────────────────┐ │
│ │   architecture/       │ │              │ │   [Go + TS debug]     │ │               │ │ 30-wp-plugin/         │ │
│ └───────────────────────┘ │              │ └───────────────────────┘ │               │ │   link-manager/       │ │
│                           │              │                           │               │ │   [PHP + Go debug]    │ │
│ ┌───────────────────────┐ │              │ ┌───────────────────────┐ │               │ └───────────────────────┘ │
│ │ 06-powershell         │◄├──────────────┤►│ 22-ai-bridge-cli      │ │               │                           │
│ │   integration-v2/     │ │              │ │   [Go + TS debug]     │ │               │ ┌───────────────────────┐ │
│ └───────────────────────┘ │              │ └───────────────────────┘ │               │ │ 30-wp-plugin/         │ │
│                           │              │                           │               │ │   wp-plugin-publish/  │ │
│ ┌───────────────────────┐ │              │ ┌───────────────────────┐ │               │ │   [PHP debug]         │ │
│ │ 07-error-code         │◄├──────────────┤►│ 24-nexus-flow-cli     │ │               │ └───────────────────────┘ │
│ │   registry/           │ │              │ │   [Go + TS debug]     │ │               │                           │
│ └───────────────────────┘ │              │ └───────────────────────┘ │               │ ┌───────────────────────┐ │
│                           │              │                           │               │ │ 31-wp-plugin-builder/ │ │
└───────────────────────────┘              │ ┌───────────────────────┐ │               │ │   [PHP + Go debug]    │ │
                                           │ │ 25-spec-reverse-cli   │ │               │ └───────────────────────┘ │
                                           │ │   [Go + TS debug]     │ │               │                           │
                                           │ └───────────────────────┘ │               └───────────────────────────┘
                                           │                           │
                                            │ ┌───────────────────────┐ │
                                            │ │ 32-wp-seo-publish-cli │ │
                                            │ │   [Go + TS debug]     │ │
                                            │ └───────────────────────┘ │
                                           │                           │
                                           │ ┌───────────────────────┐ │
                                           │ │ 26-ai-transcribe-cli  │ │
                                           │ │   [Go + TS debug]     │ │
                                           │ └───────────────────────┘ │
                                           │                           │
                                           └───────────────────────────┘

            ┌───────────────────────────┐
            │    SUPPORTING SPECS       │
            │                           │
            │ ┌───────────────────────┐ │
            │ │ 01-general-spec/      │ │        Legend:
            │ │   [Reference only]    │ │        ────────
            │ └───────────────────────┘ │        ◄► = Bidirectional reference
            │                           │        → = Outbound reference from Error Resolution
            │ ┌───────────────────────┐ │        [Go debug] = References 02-debugging-go.md
            │ │ 03-shared-cli         │◄├────────[PHP debug] = References 01-debugging-php.md
            │ │   frontend/           │ │        [TS debug] = References 03-debugging-typescript.md
            │ └───────────────────────┘ │
            │                           │
            └───────────────────────────┘
```

---

## Connection Matrix

| Source Spec | Debugging Guide | Verification Pattern | Status |
|-------------|-----------------|---------------------|--------|
| **Architecture Specs** | | | |
| 06-split-db-architecture | Go | ✓ | ✅ Connected |
| 07-seedable-config-architecture | Go | ✓ | ✅ Connected |
| 50-powershell-integration | — | ✓ | ✅ Connected |
| 03-error-code-registry | PHP + Go | ✓ | ✅ Connected |
| **CLI Tools** | | | |
| 20-gsearch-cli | Go + TS | ✓ | ✅ Connected |
| 21-brun-cli | Go + TS | ✓ | ✅ Connected |
| 22-ai-bridge-cli | Go + TS | ✓ | ✅ Connected |
| 24-nexus-flow-cli | Go + TS | ✓ | ✅ Connected |
| 25-spec-reverse-cli | Go + TS | ✓ | ✅ Connected |
| 32-wp-seo-publish-cli | Go + TS | ✓ | ✅ Connected |
| 26-ai-transcribe-cli | Go + TS | ✓ | ✅ Connected |
| **WordPress Specs** | | | |
| 30-wp-plugin/exam-manager | PHP + Go | ✓ | ✅ Connected |
| 30-wp-plugin/link-manager | PHP + Go | ✓ | ✅ Connected |
| 30-wp-plugin/wp-plugin-publish | PHP | ✓ | ✅ Connected |
| 31-wp-plugin-builder | PHP + Go | ✓ | ✅ Connected |
| **Supporting Specs** | | | |
| 01-general-spec | — | — | ⚪ Reference only |
| 11-spec-management-software | — | — | ⚪ Reference only |
| 28-shared-cli-frontend | TS | ✓ | ✅ Connected |

---

## Coverage Summary

```
┌────────────────────────────────────────┐
│         COVERAGE STATISTICS            │
├────────────────────────────────────────┤
│                                        │
│  Total Specs in Project:    18         │
│  Connected to Error Resolution: 16     │
│  Reference Only (no debug):  2         │
│                                        │
│  Coverage: 100%                        │
│                                        │
├────────────────────────────────────────┤
│  Debugging Guides Used:                │
│    - PHP:        5 specs               │
│    - Go:        14 specs               │
│    - TypeScript: 8 specs               │
│                                        │
└────────────────────────────────────────┘
```

---

## Specs Not Requiring References

These specs are **reference-only** and don't require direct error resolution links:

| Spec | Reason |
|------|--------|
| 01-general-spec | High-level standards library (contains own error patterns) |
| 11-spec-management-software | Application spec (references general-spec for errors) |
| 52-shared-preset-data | Data only, no code |

---

*This diagram provides a visual overview of all error resolution cross-references.*
