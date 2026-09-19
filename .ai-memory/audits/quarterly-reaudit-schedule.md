# Quarterly Re-Audit Schedule

**Version:** 1.0.0  
**Created:** 2026-03-03  
**Status:** Active

---

## Overview

This document defines the quarterly compliance re-audit schedule for all 9 Go-based CLI tools in the ecosystem. Each tool undergoes a full audit against Database Standards and Seedable Configuration requirements every quarter.

---

## Schedule

### Q1 2026 (January – March)

| Week | CLI Tool | Prefix | Auditor | Status | Report Path |
|------|----------|--------|---------|--------|-------------|
| W1 Jan | GSearch CLI | GS | AI/Manual | ✅ Complete | `gsearch-cli-compliance-audit-2026-02-04.md` |
| W1 Jan | BRun CLI | BR | AI/Manual | ✅ Complete | `brun-cli-compliance-audit-2026-02-04.md` |
| W2 Jan | AI Bridge CLI | AB | AI/Manual | ✅ Complete | `ai-bridge-cli-compliance-audit-2026-02-05.md` |
| W2 Jan | Nexus Flow CLI | NF | AI/Manual | ✅ Complete | `nexus-flow-cli-compliance-audit-2026-02-05.md` |
| W3 Jan | Spec Reverse CLI | SRC | AI/Manual | ✅ Complete | `spec-reverse-cli-compliance-audit-2026-02-05.md` |
| W3 Jan | WP SEO Publish CLI | WSP | AI/Manual | ✅ Complete | `wp-seo-publish-cli-compliance-audit-2026-02-05.md` |
| W4 Jan | AI Transcribe CLI | AIT | AI/Manual | ✅ Complete | `ai-transcribe-cli-compliance-audit-2026-02-05.md` |
| W4 Jan | WP Plugin Builder | WPB | AI/Manual | ✅ Complete | `wp-plugin-builder-compliance-audit-2026-02-04.md` |
| W1 Mar | WP Plugin Publish | WPP | AI/Manual | ✅ Complete | `wp-plugin-publish-cli-compliance-audit-2026-03-03.md` |

### Q2 2026 (April – June)

| Week | CLI Tool | Prefix | Auditor | Status | Report Path |
|------|----------|--------|---------|--------|-------------|
| W1 Apr | GSearch CLI | GS | — | ☐ Scheduled | — |
| W1 Apr | BRun CLI | BR | — | ☐ Scheduled | — |
| W2 Apr | AI Bridge CLI | AB | — | ☐ Scheduled | — |
| W2 Apr | Nexus Flow CLI | NF | — | ☐ Scheduled | — |
| W3 Apr | Spec Reverse CLI | SRC | — | ☐ Scheduled | — |
| W3 Apr | WP SEO Publish CLI | WSP | — | ☐ Scheduled | — |
| W4 Apr | AI Transcribe CLI | AIT | — | ☐ Scheduled | — |
| W4 Apr | WP Plugin Builder | WPB | — | ☐ Scheduled | — |
| W1 May | WP Plugin Publish | WPP | — | ☐ Scheduled | — |

### Q3 2026 (July – September)

| Week | CLI Tool | Prefix | Auditor | Status | Report Path |
|------|----------|--------|---------|--------|-------------|
| W1 Jul | GSearch CLI | GS | — | ☐ Scheduled | — |
| W1 Jul | BRun CLI | BR | — | ☐ Scheduled | — |
| W2 Jul | AI Bridge CLI | AB | — | ☐ Scheduled | — |
| W2 Jul | Nexus Flow CLI | NF | — | ☐ Scheduled | — |
| W3 Jul | Spec Reverse CLI | SRC | — | ☐ Scheduled | — |
| W3 Jul | WP SEO Publish CLI | WSP | — | ☐ Scheduled | — |
| W4 Jul | AI Transcribe CLI | AIT | — | ☐ Scheduled | — |
| W4 Jul | WP Plugin Builder | WPB | — | ☐ Scheduled | — |
| W1 Aug | WP Plugin Publish | WPP | — | ☐ Scheduled | — |

### Q4 2026 (October – December)

| Week | CLI Tool | Prefix | Auditor | Status | Report Path |
|------|----------|--------|---------|--------|-------------|
| W1 Oct | GSearch CLI | GS | — | ☐ Scheduled | — |
| W1 Oct | BRun CLI | BR | — | ☐ Scheduled | — |
| W2 Oct | AI Bridge CLI | AB | — | ☐ Scheduled | — |
| W2 Oct | Nexus Flow CLI | NF | — | ☐ Scheduled | — |
| W3 Oct | Spec Reverse CLI | SRC | — | ☐ Scheduled | — |
| W3 Oct | WP SEO Publish CLI | WSP | — | ☐ Scheduled | — |
| W4 Oct | AI Transcribe CLI | AIT | — | ☐ Scheduled | — |
| W4 Oct | WP Plugin Builder | WPB | — | ☐ Scheduled | — |
| W1 Nov | WP Plugin Publish | WPP | — | ☐ Scheduled | — |

---

## Audit Scope per Cycle

Each quarterly re-audit covers:

| # | Area | Checks | Template Reference |
|---|------|--------|--------------------|
| 1 | DBOperation Wrapper | 4 checks | Section 1.1 |
| 2 | ORM-Only Policy | 5 checks | Section 1.2 |
| 3 | Structured Logging (7 fields) | 7 checks | Section 1.3 |
| 4 | Schema Standards | 4 checks | Section 1.4 |
| 5 | Seedable Configuration | 12 checks | Section 2 |
| 6 | Initialization Order | 6 checks | Section 3 |
| 7 | Health Endpoints | 2 checks | Section 4 |
| 8 | Error Handling | 4 checks | Section 5 |

**Template:** `.lovable/memories/standards/cli-compliance-audit-template.md`

---

## Naming Convention

Audit report filenames follow this pattern:

```
{tool-slug}-compliance-audit-{YYYY-MM-DD}.md
```

Examples:
- `gsearch-cli-compliance-audit-2026-04-07.md`
- `wp-plugin-publish-cli-compliance-audit-2026-04-28.md`

---

## Triggers for Ad-Hoc Re-Audit

Outside the quarterly schedule, a re-audit is required when:

1. **Major version bump** of any CLI tool
2. **Database schema migration** affecting core tables
3. **Shared package update** (`pkg/database`, `pkg/settings`)
4. **New compliance standard** added to the ecosystem
5. **Incident remediation** documented in `02-spec/61-how-app-issues-track/`

---

## Related Documents

| Document | Path |
|----------|------|
| Compliance Dashboard | `.lovable/audits/00-compliance-dashboard.md` |
| Compliance Registry | `.lovable/memories/standards/cli-compliance-registry-complete.md` |
| Audit Template | `.lovable/memories/standards/cli-compliance-audit-template.md` |
| Preflight Checklist | `.lovable/memories/standards/unified-preflight-checklist.md` |

---

*Quarterly schedule ensuring continuous compliance verification across the CLI ecosystem.*
