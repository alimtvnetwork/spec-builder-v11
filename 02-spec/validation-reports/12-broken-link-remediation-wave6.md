# Broken Link Remediation — Wave 6: API Path Corrections

**Date:** 2026-03-15  
**Version:** 1.0.0  
**Wave:** 6 of 6  
**Links Fixed This Wave:** 4  
**Cumulative Fixed:** 817 / 876 (93%)  
**Remaining:** 21 (all planned trigger-event forward-references)

---

## Summary

Wave 6 resolved the final 4 "planned API file" broken links. Investigation revealed these were **path errors**, not missing files — links pointed to `./api/` instead of the existing `./16-api/` directory. No new placeholder files were needed.

---

## Corrections Applied

| # | File | Broken Link | Corrected To |
|---|------|-------------|--------------|
| 1 | `02-spec/11-spec-management-software/95-master-index.md` | `./api/openapi.yaml` | `./05-features/16-api/openapi.yaml` |
| 2 | `02-spec/11-spec-management-software/95-master-index.md` | `./api/types.ts` | `./05-features/16-api/types.ts` |
| 3 | `02-spec/11-spec-management-software/05-features/31-security-cross-cutting.md` | `../api/openapi.yaml` | `./16-api/openapi.yaml` |
| 4 | `02-spec/11-spec-management-software/05-features/24-code-generation-system/13-api-endpoints.md` | `../../api/openapi.yaml` | `../../16-api/openapi.yaml` |

---

## Remaining Broken Links (21)

All 21 remaining links are intentional **forward-references** to planned-but-unwritten trigger-event-system specifications (`02-spec/11-spec-management-software/05-features/29-trigger-event-system/` files 02–18). Zero actionable broken links remain.

---

## Cumulative Progress

| Wave | Links Fixed | Cumulative | Remaining |
|------|------------|------------|-----------|
| Wave 1 | 340 | 340 (39%) | 536 |
| Wave 2 | 119 | 459 (52%) | 417 |
| Wave 3 | 318 | 777 (89%) | 99 |
| Wave 4 | 18 | 795 (91%) | 47 |
| Wave 5 | 18 | 813 (93%) | 25 |
| **Wave 6** | **4** | **817 (93%)** | **21** |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Cross-Reference Validation | `./01-cross-reference-validation.md` |
| Wave 5 Report | `./11-broken-link-remediation-wave5.md` |
| Validation Reports Overview | `./00-overview.md` |
| Master Index | `../00-overview.md` |

---

*Generated 2026-03-15 by broken-link remediation tooling.*
