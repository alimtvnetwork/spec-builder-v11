# Memory: workflow/cli-cross-reference-completion

**Updated:** 2026-02-04  
**Version:** 1.0.0  
**Status:** Active

---

## Overview

Tracks DBOperation wrapper cross-reference requirements across all CLI tools and specifications.

---

## Go-Based CLI Tools (DBOperation Required)

All Go-based tools MUST reference the DBOperation wrapper specification.

| CLI Tool | Specification Location | Status |
|----------|----------------------|--------|
| GSearch CLI | `spec/20-gsearch-cli/01-backend/00-overview.md` | ✅ Complete |
| BRun CLI | `spec/21-brun-cli/00-overview.md` | ✅ Complete |
| AI Bridge CLI | `spec/22-ai-bridge-cli/00-overview.md` | ✅ Complete |
| Nexus Flow CLI | `spec/24-nexus-flow-cli/00-overview.md` | ✅ Complete |
| Spec Reverse CLI | `spec/25-spec-reverse-cli/00-overview.md` | ✅ Complete |
| AI Transcribe CLI | `spec/26-ai-transcribe-cli/00-overview.md` | ✅ Complete |
| WP SEO Publish CLI | `spec/32-wp-seo-publish-cli/00-overview.md` | ✅ Complete |
| WP Plugin Builder CLI | `spec/31-wp-plugin-builder/00-overview.md` | ✅ Complete |
| WP Plugin Publish | `spec/30-wp-plugin/wp-plugin-publish/00-overview.md` | ✅ Complete |

**Total: 9 Go-based tools — 100% compliant**

---

## PHP-Based Plugins (Excluded from DBOperation)

PHP WordPress plugins use different ORM patterns and are NOT subject to Go DBOperation requirements.

| Plugin | Specification Location | Reason for Exclusion |
|--------|----------------------|---------------------|
| Exam Manager | `spec/30-wp-plugin/exam-manager/` | PHP plugin, uses WordPress $wpdb |
| Link Manager | `link-manager/spec/` | PHP plugin, uses WordPress $wpdb |

**Note:** These plugins follow WordPress database conventions (`$wpdb`, prepared statements) rather than Go GORM patterns.

---

## Required Cross-References

Every Go-based CLI specification MUST include these three references:

| Reference | Path |
|-----------|------|
| DBOperation Wrapper | `spec/11-spec-management-software/13-shared-packages/06-pkg-database-operations.md` |
| ORM-Only Policy | `.lovable/memories/standards/orm-only-policy.md` |
| Database Pre-flight Checklist | `.lovable/memories/standards/database-preflight-checklist.md` |

---

## Shared Architecture

| Component | Location | DBOperation Reference |
|-----------|----------|----------------------|
| Shared CLI Frontend | `spec/28-shared-cli-frontend/00-overview.md` | ✅ In patterns table |
| pkg/database | `spec/11-spec-management-software/13-shared-packages/06-pkg-database-operations.md` | Source of truth |

---

## Verification Command

To verify compliance, check each overview file for the string "DBOperation Wrapper":

```bash
grep -l "DBOperation Wrapper" spec/*/00-overview.md spec/*/*/00-overview.md
```

---

*Tracks DBOperation wrapper requirements and exclusions across the ecosystem.*
