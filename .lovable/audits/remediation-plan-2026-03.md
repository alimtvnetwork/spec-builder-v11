# Ecosystem Remediation Plan — March 2026

**Version:** 1.0.0  
**Created:** 2026-03-09  
**Status:** Active

---

## Executive Summary

A comprehensive remediation plan to achieve 100% compliance with Master Coding Guidelines across all 187+ specification files.

### Current Violation Counts

| Violation Type | Total Matches | Files Affected |
|----------------|---------------|----------------|
| `ctx` abbreviation | ~12,480 | 187 files |
| `fmt.Errorf` usage | ~3,795 | 156 files |
| `(*T, error)` tuples | ~5,197 | 216 files |

### Completed Modules (100% Compliant)

| Module | Score | Grade |
|--------|-------|-------|
| AI Bridge CLI | 100/100 | A+ |
| BRun CLI | 100/100 | A+ |
| License Manager | 100/100 | A+ |

---

## Priority Tiers

### Tier 1: High-Volume Backend Modules (P0)

These modules have the highest violation density and are critical for implementation readiness.

| Module | Path | Est. Violations | Priority |
|--------|------|-----------------|----------|
| **GSearch CLI (main)** | `spec/20-gsearch-cli/01-backend/` | ~1,500 ctx, ~600 fmt.Errorf, ~800 tuples | 🔴 Critical |
| **Spec Management Software** | `spec/11-spec-management-software/` | ~2,000 ctx, ~800 fmt.Errorf, ~1,200 tuples | 🔴 Critical |
| **GSearch CLI (features)** | `spec/02-.../22-golang-search-cli/` | ~500 ctx, ~250 fmt.Errorf, ~400 tuples | 🔴 Critical |

**Estimated Effort:** 15-20 waves, ~3,000 violations per tier

### Tier 2: CLI Modules (P1)

Secondary CLI tools requiring compliance.

| Module | Path | Est. Violations | Priority |
|--------|------|-----------------|----------|
| **Nexus Flow CLI** | `spec/24-nexus-flow-cli/` | ~400 ctx, ~150 fmt.Errorf, ~250 tuples | 🟠 High |
| **WP Plugin Builder** | `spec/31-wp-plugin-builder/` | ~300 ctx, ~120 fmt.Errorf, ~200 tuples | 🟠 High |
| **Spec Reverse CLI** | `spec/25-spec-reverse-cli/` | ~200 ctx, ~80 fmt.Errorf, ~150 tuples | 🟠 High |
| **AI Transcribe CLI** | `spec/26-ai-transcribe-cli/` | ~250 ctx, ~100 fmt.Errorf, ~180 tuples | 🟠 High |
| **WP SEO Publish** | `spec/32-wp-seo-publish-cli/` | ~180 ctx, ~70 fmt.Errorf, ~120 tuples | 🟠 High |

**Estimated Effort:** 8-10 waves, ~1,500 violations

### Tier 3: Shared Infrastructure (P2)

Foundation specifications and shared components.

| Module | Path | Est. Violations | Priority |
|--------|------|-----------------|----------|
| **Shared CLI Frontend** | `spec/28-shared-cli-frontend/` | ~300 ctx, ~150 fmt.Errorf, ~200 tuples | 🟡 Medium |
| **Error Code Registry** | `spec/03-error-code-registry/` | ~50 ctx, ~20 fmt.Errorf, ~30 tuples | 🟡 Medium |
| **PowerShell Integration** | `spec/50-powershell-integration/` | ~100 ctx, ~40 fmt.Errorf, ~60 tuples | 🟡 Medium |

**Estimated Effort:** 3-5 waves, ~500 violations

### Tier 4: Standards & Guidelines (P3)

These files contain intentional non-compliant examples for documentation purposes.

| Module | Path | Handling |
|--------|------|----------|
| **Coding Guidelines** | `spec/02-coding-guidelines/01-cross-language/` | Mark with ❌ indicators |
| **Go Standards** | `spec/02-coding-guidelines/03-golang/` | Mark with ❌ indicators |
| **Training Bundles** | `.lovable/memories/training/` | Mark with ❌ indicators |

**Note:** Forbidden patterns in documentation MUST be annotated with `❌` to prevent misuse.

---

## Remediation Waves

### Wave 10-14: GSearch CLI Main Backend

| Wave | Files | Target |
|------|-------|--------|
| 10 | `20-gsearch-cli/01-backend/01-05` | Core architecture |
| 11 | `20-gsearch-cli/01-backend/06-15` | Search engines |
| 12 | `20-gsearch-cli/01-backend/16-30` | Anti-bot, stealth |
| 13 | `20-gsearch-cli/01-backend/31-50` | Multi-engine, extraction |
| 14 | `20-gsearch-cli/01-backend/51-65` | Advanced features |

### Wave 15-19: Spec Management Software

| Wave | Files | Target |
|------|-------|--------|
| 15 | `11-spec-management-software/01-04` | Core system design |
| 16 | `11-spec-management-software/05-features/01-10` | File management, knowledge |
| 17 | `11-spec-management-software/05-features/11-20` | Code generation, editor |
| 18 | `11-spec-management-software/05-features/21-30` | Search, settings |
| 19 | `11-spec-management-software/06-08` | Error handling, roadmap |

### Wave 20-24: Remaining CLI Modules

| Wave | Files | Target |
|------|-------|--------|
| 20 | `spec/24-nexus-flow-cli/` | Context assembly, RAG |
| 21 | `spec/31-wp-plugin-builder/` | Plugin generation |
| 22 | `spec/25-spec-reverse-cli/` | Reverse engineering |
| 23 | `spec/26-ai-transcribe-cli/` | Audio transcription |
| 24 | `spec/32-wp-seo-publish-cli/` | SEO publishing |

### Wave 25-27: Shared Infrastructure

| Wave | Files | Target |
|------|-------|--------|
| 25 | `spec/28-shared-cli-frontend/` | Frontend hooks, services |
| 26 | `spec/50-powershell-integration/` | PS cmdlets |
| 27 | `spec/03-error-code-registry/` | Error definitions |

### Wave 28-30: Standards Annotation

| Wave | Files | Target |
|------|-------|--------|
| 28 | `spec/02-coding-guidelines/01-cross-language/` | Add ❌ markers to forbidden patterns |
| 29 | `spec/02-coding-guidelines/03-golang/` | Add ❌ markers to forbidden patterns |
| 30 | `.lovable/memories/training/` | Add ❌ markers to forbidden patterns |

---

## Remediation Patterns

### 1. Context Naming (`ctx` → `context`)

```go
// ❌ FORBIDDEN
func (s *Service) DoWork(ctx context.Context) error

// ✅ REQUIRED
func (s *Service) DoWork(context context.Context) error
```

**Import Alias Pattern:**
```go
import stdctx "context"

func (s *Service) DoWork(context stdctx.Context) error
```

### 2. Error Wrapping (`fmt.Errorf` → `apperror`)

```go
// ❌ FORBIDDEN
return fmt.Errorf("failed to load: %w", err)

// ✅ REQUIRED
return apperror.Wrap(
    err,
    "failed to load",
)
```

### 3. Return Signatures (`(*T, error)` → `apperror.Result[T]`)

```go
// ❌ FORBIDDEN
func GetUser(id string) (*User, error)

// ✅ REQUIRED
func GetUser(id string) apperror.Result[*User]
```

---

## Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| `ctx` violations | 12,480 | 0 | 30 waves |
| `fmt.Errorf` violations | 3,795 | 0 | 30 waves |
| Tuple return violations | 5,197 | 0 | 30 waves |
| Modules at 100% | 3 | 15+ | 30 waves |
| Overall compliance | ~40% | 100% | 30 waves |

---

## Automation Opportunities

### Pre-commit Validation

The existing drift detection scripts can be extended:

```bash
# scripts/drift-detect-ctx.sh
grep -rn '\bctx\b' spec/ --include="*.md" | grep -v "❌"
```

### Batch Replacement Candidates

Files with >50 violations are candidates for full rewrites:
- `spec/20-gsearch-cli/01-backend/42-multi-engine-search.md`
- `spec/11-spec-management-software/05-features/02-file-management/01-file-operations.md`
- `spec/11-spec-management-software/05-features/09-knowledge-memory/08-vector-db-implementation-guide.md`

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking working spec logic | Review each change in context |
| Introducing new violations | Run drift-detect after each wave |
| Standards doc confusion | Always annotate forbidden patterns with ❌ |
| Incomplete remediation | Track per-file compliance in audit reports |

---

## Next Actions

1. **Immediate:** Complete GSearch CLI feature spec (remaining 6 files)
2. **Wave 10:** Start GSearch CLI main backend remediation
3. **Weekly:** Update global audit findings after each wave
4. **Ongoing:** Maintain consistency reports per module

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Global Audit Findings | `.lovable/memories/project/global-audit-findings.md` |
| BRun CLI Audit | `.lovable/memories/features/brun-cli/technical-audit-findings.md` |
| GSearch CLI Audit | `.lovable/memories/features/gsearch-cli/technical-audit-findings.md` |
| Compliance Dashboard | `.lovable/audits/00-compliance-dashboard.md` |
| Master Coding Guidelines | `spec/02-coding-guidelines/01-cross-language/` |
