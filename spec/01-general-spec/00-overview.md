# General Specification Library

> **Version:** 2.2.0  
> **Last Updated:** 2026-03-30  
> **Status:** PRODUCTION-READY  
> **AI Confidence:** Production-Ready  
> **Ambiguity:** Low  
> **Total Documents:** 32  
> **Canonical Authority:** [Master Coding Guidelines](../02-coding-guidelines/01-cross-language/15-master-coding-guidelines.md)

A comprehensive, multi-language (PHP, Go, TypeScript) architecture blueprint providing senior-level standards for building maintainable, secure, and scalable applications.

---

## Keywords

`coding-standards` · `architecture` · `multi-language` · `php` · `golang` · `typescript` · `wordpress` · `security` · `testing` · `devops` · `observability` · `data-governance`

---

## Scoring

| Metric | Value |
|--------|-------|
| AI Confidence | Production-Ready |
| Ambiguity | Low |
| Health Score | 100/100 (A+) |

---

## 📁 Directory Structure

| Phase | Directory | Description |
|-------|-----------|-------------|
| 1 | [01-foundation/](./01-foundation/) | Core coding standards and error management patterns |
| 2 | [02-systems/](./02-systems/) | Logging, configuration hierarchy, and conditional helpers |
| 3 | [03-quality/](./03-quality/) | Testing standards, file organization, and API conventions |
| 4 | [04-advanced/](./04-advanced/) | Security patterns, caching, and database conventions |
| 5 | [05-ux/](./05-ux/) | Internationalization, accessibility, and performance |
| 6 | [06-devops/](./06-devops/) | Documentation, version control, and CI/CD pipelines |
| 7 | [07-observability/](./07-observability/) | Monitoring, incident management, and runbooks |
| 8 | [08-data-governance/](./08-data-governance/) | Data classification, retention, and backup/recovery |
| 9 | [09-api-integration/](./09-api-integration/) | GraphQL, WebSocket, and message queue standards |
| 10 | [10-wordpress/](./10-wordpress/) | WordPress-specific plugin development standards |
| — | [99-meta/](./99-meta/) | AI readability review, cheatsheet, and consistency reports |

---

## 🎯 Document Index

### Phase 1: Foundation
| File | Description | Key Concepts |
|------|-------------|--------------|
| [01-coding-standards-foundation.md](./01-foundation/01-coding-standards-foundation.md) | Naming conventions, function limits, code style | camelCase, 15-line limit, early returns |
| [02-error-management-foundation.md](./01-foundation/02-error-management-foundation.md) | Exception hierarchy, error codes, stack traces | BaseException, ErrPascalCase codes, chaining |

### Phase 2: Systems
| File | Description | Key Concepts |
|------|-------------|--------------|
| [01-logging-system-systems.md](./02-systems/01-logging-system-systems.md) | Dual-file logging, levels, rotation | app.log, error.log, Gzip archival |
| [02-configuration-hierarchy-systems.md](./02-systems/02-configuration-hierarchy-systems.md) | 3-tier config pattern | Seed → Database → Constants fallback |
| [03-conditional-helpers-systems.md](./02-systems/03-conditional-helpers-systems.md) | If-avoidance patterns, helper functions | logIf, execIf, BooleanHelpers |

### Phase 3: Quality
| File | Description | Key Concepts |
|------|-------------|--------------|
| [01-testing-standards-quality.md](./03-quality/01-testing-standards-quality.md) | Test structure, fixtures, coverage | Unit/Integration/E2E, test factories |
| [02-file-organization-quality.md](./03-quality/02-file-organization-quality.md) | Directory structure, module patterns | Feature folders, barrel exports |
| [03-api-conventions-quality.md](./03-quality/03-api-conventions-quality.md) | REST patterns, response formats | Envelope pattern, error responses |

### Phase 4: Advanced
| File | Description | Key Concepts |
|------|-------------|--------------|
| [01-security-patterns-advanced.md](./04-advanced/01-security-patterns-advanced.md) | Input validation, auth, RBAC | Zod schemas, XSS/CSRF prevention, OWASP Top 10 |
| [02-caching-patterns-advanced.md](./04-advanced/02-caching-patterns-advanced.md) | Cache keys, invalidation strategies | Tag-based, TTL patterns, React Query |
| [03-database-conventions-advanced.md](./04-advanced/03-database-conventions-advanced.md) | Schema naming, indexes, migrations | PascalCase columns, soft deletes |

### Phase 5: User Experience
| File | Description | Key Concepts |
|------|-------------|--------------|
| [01-internationalization-ux.md](./05-ux/01-internationalization-ux.md) | Multi-language support, localization | ICU MessageFormat, RTL, logical CSS |
| [02-accessibility-standards-ux.md](./05-ux/02-accessibility-standards-ux.md) | WCAG 2.1 AA compliance | POUR framework, ARIA, keyboard nav |
| [03-performance-optimization-ux.md](./05-ux/03-performance-optimization-ux.md) | Core Web Vitals, optimization | LCP ≤2.5s, INP ≤200ms, CLS |
| [04-keyboard-shortcuts-ux.md](./05-ux/04-keyboard-shortcuts-ux.md) | Universal keyboard shortcuts | Customizable bindings, persistence, tooltips |
| [05-accessibility-checklist-ux.md](./05-ux/05-accessibility-checklist-ux.md) | Component accessibility audit | WCAG AA, focus management, screen readers |

### Phase 6: DevOps
| File | Description | Key Concepts |
|------|-------------|--------------|
| [01-documentation-standards-devops.md](./06-devops/01-documentation-standards-devops.md) | Code docs, API specs, changelogs | PHPDoc/TSDoc, OpenAPI 3.0+, ADRs |
| [02-version-control-devops.md](./06-devops/02-version-control-devops.md) | Git workflow, commit conventions | Conventional Commits, Git Flow |
| [03-deployment-cicd-devops.md](./06-devops/03-deployment-cicd-devops.md) | CI/CD pipelines, deployments | 5-stage pipeline, rollbacks |

### Phase 7: Observability
| File | Description | Key Concepts |
|------|-------------|--------------|
| [01-monitoring-observability.md](./07-observability/01-monitoring-observability.md) | Metrics, tracing, health checks | Prometheus, OpenTelemetry, SLOs |
| [02-incident-management-observability.md](./07-observability/02-incident-management-observability.md) | Incident lifecycle, PIRs | SEV-1 to SEV-4, blameless culture |
| [03-oncall-runbooks-observability.md](./07-observability/03-oncall-runbooks-observability.md) | On-call rotations, runbook templates | Escalation, alert response |

### Phase 8: Data Governance
| File | Description | Key Concepts |
|------|-------------|--------------|
| [01-data-classification-data-governance.md](./08-data-governance/01-data-classification-data-governance.md) | Data sensitivity levels, PII handling | 4-tier classification, encryption |
| [02-retention-policies-data-governance.md](./08-data-governance/02-retention-policies-data-governance.md) | Data lifecycle, GDPR compliance | Retention periods, right to erasure |
| [03-backup-recovery-data-governance.md](./08-data-governance/03-backup-recovery-data-governance.md) | Backup strategies, disaster recovery | 3-2-1 rule, RPO/RTO, PITR |

### Phase 9: API Integration
| File | Description | Key Concepts |
|------|-------------|--------------|
| [01-graphql-conventions-api-integration.md](./09-api-integration/01-graphql-conventions-api-integration.md) | GraphQL schema design, resolvers | Relay connections, DataLoader |
| [02-websocket-patterns-api-integration.md](./09-api-integration/02-websocket-patterns-api-integration.md) | Real-time communication patterns | Channels, presence, reconnection |
| [03-message-queue-standards-api-integration.md](./09-api-integration/03-message-queue-standards-api-integration.md) | Async messaging, event-driven | Pub/Sub, Saga, dead letter queues |

### Phase 10: WordPress
| File | Description | Key Concepts |
|------|-------------|--------------|
| [07-overview-wordpress.md](./10-wordpress/07-overview-wordpress.md) | WordPress development overview | Plugin lifecycle, best practices |
| [01-plugin-structure-wordpress.md](./10-wordpress/01-plugin-structure-wordpress.md) | Plugin file organization | PSR-4, activation/deactivation |
| [02-rest-api-wordpress.md](./10-wordpress/02-rest-api-wordpress.md) | REST API integration | Nonce verification, permissions |
| [03-cron-system-wordpress.md](./10-wordpress/03-cron-system-wordpress.md) | Background jobs, scheduling | WP-Cron, job locks |
| [04-admin-ui-wordpress.md](./10-wordpress/04-admin-ui-wordpress.md) | Admin menus, settings pages | Asset enqueueing, notices |
| [05-sanitization-wordpress.md](./10-wordpress/05-sanitization-wordpress.md) | Input/output security | Sanitize functions, escaping |
| [06-configuration-wordpress.md](./10-wordpress/06-configuration-wordpress.md) | Settings management | 3-tier hierarchy, seeding |

### Meta
| File | Description | Key Concepts |
|------|-------------|--------------|
| [01-ai-readability-review-meta.md](./99-meta/01-ai-readability-review-meta.md) | AI agent optimization | Context clarity, prompt patterns |
| [02-cheatsheet-meta.md](./99-meta/02-cheatsheet-meta.md) | Quick reference card | All patterns at a glance |
| [03-consistency-report-meta.md](./99-meta/03-consistency-report-meta.md) | Cross-document audit | Consistency score: 9.9/10 |

---

## 🔑 Core Principles

1. **15-Line Function Limit** — Functions exceeding 15 lines must be refactored
2. **Positive Boolean Logic** — Use `BooleanHelpers` (`isNull`, `isDefined`, `hasMismatch`) and positive guard methods (`isDefined()`, `isInvalid()`) — never use `!` operator
3. **Positive Booleans** — `isEnabled` not `isDisabled`, `hasAccess` not `lacksAccess`
4. **PascalCase Database** — All custom table and column names use PascalCase
5. **Constants Over Magic Values** — All repeated values must be constants; log keys must be named `const`
6. **Single Source of Truth** — Database > File > Code hierarchy
7. **Abbreviations as Words** — `Id` not `ID`, `Url` not `URL`, `Http` not `HTTP` (Go stdlib exempted)
8. **Zero Underscore Policy** — snake_case prohibited for all logic-level identifiers (WordPress/persistence exempted)
9. **PascalCase Source Files** — Source files defining a single type must match the type name (e.g., `UserService.ts`)

---

## 📊 Quick Reference

### Naming Conventions
| Context | Convention | Example |
|---------|------------|---------|
| Variables/Functions | `camelCase` | `getUserById` |
| Classes/Structs | `PascalCase` | `UserService` |
| Interfaces | `PascalCase` (no `I` prefix) | `UserService`, `Repository` |
| Enum type names | `PascalCase` + `Type` suffix | `StatusType`, `ActionType` |
| Enum values | `PascalCase` | `Active`, `SoftDeadlineReached` |
| Constants (non-error) | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Constants (error codes) | `PascalCase` with `Err` prefix | `ErrInvalidQuery` |
| Database Tables | `PascalCase` singular | `User`, `OrderItem` |
| Database Columns | `PascalCase` | `CreatedAt`, `UserId` |
| Booleans | Prefix with `is/has/can/should/was` | `isEnabled`, `hasAccess`, `canEdit` |
| Abbreviations | First letter only caps | `postId`, `fileUrl`, `httpClient` |
| JSON/API keys | `PascalCase` | `"PluginSlug"`, `"CreatedAt"` |
| Source files | `PascalCase` for single-type files | `UserService.ts`, `SnapshotManager.go` |

### Error Code Ranges
| Range | Category |
|-------|----------|
| `1xxx` | Validation errors |
| `2xxx` | Authentication/Authorization |
| `3xxx` | Database errors |
| `4xxx` | External service errors |
| `5xxx` | Business logic errors |
| `9xxx` | System/Fatal errors |

### Configuration Priority
```
Database Override → Config File → Code Constant
     (highest)                       (lowest)
```

---

## 📈 Success Metrics

| Metric | Target |
|--------|--------|
| AI first-attempt success rate | 99%+ |
| Consistency score | 9.9/10 |
| Code review rejections | <5% |
| Production bugs from logic errors | Near zero |

---

## 🚀 Getting Started

1. Start with **[01-foundation/](./01-foundation/)** for coding standards
2. Review **[99-meta/02-cheatsheet-meta.md](./99-meta/02-cheatsheet-meta.md)** for quick patterns
3. Apply relevant phase standards based on your feature requirements

---

## 📜 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.2.0 | 2026-03-30 | Added AI Confidence, Ambiguity metadata, Keywords section, Scoring section per spec authoring guide v2.0.0 |
| 2.1.0 | 2026-03-02 | Aligned with Master Coding Guidelines (spec/23): abbreviation standard, zero underscore, PascalCase files, enum Type suffix, guard patterns, Go language support |
| 2.0.0 | 2026-01-26 | Reorganized into 11 thematic subdirectories |
| 1.9.0 | 2026-01-26 | Added Phase 10: WordPress Plugin Development |
| 1.8.1 | 2026-01-26 | Changed database naming to PascalCase |
| 1.8.0 | 2026-01-26 | Added Phase 9: API Integration |
| 1.7.0 | 2026-01-26 | Added Phase 8: Data Governance |
| 1.6.0 | 2026-01-26 | Added Phase 7: Observability |
| 1.5.0 | 2026-01-26 | Added Phase 6: DevOps |
| 1.0.0 | 2026-01-26 | Initial release with Phases 1-5 |

---

## Related Specifications

| Specification | Location |
|--------------|----------|
| Master Coding Guidelines | [../02-coding-guidelines/01-cross-language/](../02-coding-guidelines/01-cross-language/15-master-coding-guidelines.md) — **Canonical authority** for all naming, boolean, and style rules |
| Error Resolution | [../04-error-resolution/](../04-error-resolution/) — Debugging guides and verification patterns |
| Error Code Registry | [../03-error-code-registry/](../03-error-code-registry/) — Centralized error code allocation |

---

*This overview document should be read first before any other guideline files.*
