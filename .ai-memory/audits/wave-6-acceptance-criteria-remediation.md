# Wave 6 Remediation: GIVEN/WHEN/THEN Acceptance Criteria

**Version:** 1.0.0  
**Status:** Complete  
**Updated:** 2026-02-07

---

## Summary

Wave 6 converted all ecosystem specifications from legacy table-based acceptance criteria (ID|Criterion|Priority|Validation) to the mandated **GIVEN/WHEN/THEN** format with explicit **Edge Cases**, ensuring all criteria are directly translatable to automated E2E tests.

---

## Files Created/Updated

| File | Silo | Criteria Count | Action |
|------|------|---------------|--------|
| `02-spec/04-error-resolution/99-acceptance-criteria.md` | Error Resolution | 7 | Created |
| `02-spec/28-shared-cli-frontend/99-acceptance-criteria.md` | Shared CLI Frontend | 16 | Created |
| `02-spec/06-split-db-architecture/99-acceptance-criteria.md` | Split DB Architecture | 10 | Created |
| `02-spec/07-seedable-config-architecture/99-acceptance-criteria.md` | Seedable Config | 8 | Created |
| `02-spec/06-powershell-integration-v2/99-acceptance-criteria.md` | PowerShell v2 | 8 | Created |
| `02-spec/20-gsearch-cli/01-backend/99-acceptance-criteria.md` | GSearch CLI | 22 | Created |
| `02-spec/21-brun-cli/01-backend/11-acceptance-criteria.md` | BRun CLI | 47 | Rewritten |
| `02-spec/22-ai-bridge-cli/01-backend/99-acceptance-criteria.md` | AI Bridge CLI | 21 | Created |
| `02-spec/24-nexus-flow-cli/01-backend/99-acceptance-criteria.md` | Nexus Flow CLI | 8 | Created |
| `02-spec/31-wp-plugin-builder/99-acceptance-criteria.md` | WP Plugin Builder | 11 | Created |
| `02-spec/14-wp-seo-publish-cli/01-backend/99-acceptance-criteria.md` | WP SEO Publish | 11 | Created |
| `02-spec/25-spec-reverse-cli/01-backend/99-acceptance-criteria.md` | Spec Reverse | 7 | Created |
| `02-spec/26-ai-transcribe-cli/01-backend/99-acceptance-criteria.md` | AI Transcribe | 12 | Created |

---

## Totals

| Metric | Count |
|--------|-------|
| Files created | 12 |
| Files rewritten | 1 (BRun) |
| Total acceptance criteria | ~188 |
| Edge cases documented | ~95 |
| Silos covered | 13 |

---

## Excluded from Wave 6

| Silo | Reason |
|------|--------|
| `02-spec/60-ai-research/` | Reference-only, exempt from compliance |
| `02-spec/30-wp-plugin/` | PHP plugins, follow separate standards |
| `02-spec/17-enum-specification/` | Standard definition, no behavioral criteria needed |
| `02-spec/01-general-spec/` | Foundation standards, criteria embedded in consuming specs |
| `02-spec/03-error-code-registry/` | Registry data, not behavioral |
| `02-spec/12-spec-management-software/` | Separate product with own lifecycle |

---

## Format Standard

All criteria follow:

```
### {ID}: {Title}

**GIVEN** {precondition}  
**WHEN** {action}  
**THEN** {expected result}  
**AND** {additional assertions}

**Edge Cases:**
- **GIVEN** {edge precondition} **WHEN** {edge action} **THEN** {edge result}
```

---

## Cross-References

- [Detailed Acceptance Criteria Format Standard](../memories/standards/documentation-standards-hierarchy.md)
- [Wave 1: Error Registry](./wave-1-error-registry-remediation.md)
- [Wave 2: Port Unification](./wave-5-missing-mandatory-specs.md)
- [Wave 3: PascalCase](./wave-3-pascalcase-remediation.md)
- [Wave 4: ORM Migration](./wave-4-orm-migration-remediation.md)
- [Wave 5: Missing Mandatory Specs](./wave-5-missing-mandatory-specs.md)
