# Stale Reference Batch Fix List

**Generated:** 2026-02-02  
**Version:** 1.0.0  
**Pattern:** `../general-spec/` → `../01-general-spec/`  
**Total Files:** 22

---

## Files to Fix

| # | File Path | Occurrences |
|---|-----------|-------------|
| 1 | `02-spec/11-spec-management-software/00-overview.md` | 1 |
| 2 | `02-spec/11-spec-management-software/01-ideas/04-spec-update-plan.md` | 1 |
| 3 | `02-spec/11-spec-management-software/04-coding-guidelines/00-overview.md` | 2 |
| 4 | `02-spec/11-spec-management-software/04-coding-guidelines/03-typescript-guidelines.md` | 2 |
| 5 | `02-spec/11-spec-management-software/05-features/01-authentication/01-authentication.md` | 3 |
| 6 | `02-spec/11-spec-management-software/05-features/02-file-management/01-file-operations.md` | 2 |
| 7 | `02-spec/11-spec-management-software/05-features/06-ai-integration/06-llm-live-logging.md` | 1 |
| 8 | `02-spec/11-spec-management-software/05-features/07-history-system/01-git-integration.md` | 1 |
| 9 | `02-spec/11-spec-management-software/05-features/08-consistency-checker/tests/01-consistency-checker-tests.md` | 2 |
| 10 | `02-spec/11-spec-management-software/05-features/09-knowledge-memory/tests/04-pattern-validator-tests.md` | 1 |
| 11 | `02-spec/11-spec-management-software/06-error-management/00-overview.md` | 2 |
| 12 | `02-spec/11-spec-management-software/08-roadmap-overview/01-roadmap.md` | 1 |
| 13 | `02-spec/11-spec-management-software/08-roadmap-overview/02b-summary.md` | 1 |
| 14 | `02-spec/11-spec-management-software/08-roadmap-overview/03-glossary.md` | 1 |
| 15 | `02-spec/11-spec-management-software/08-roadmap-overview/07-integration-tests-pipeline.md` | 2 |
| 16 | `02-spec/11-spec-management-software/99-consistency-report.md` | 1 |

---

## Find & Replace Commands

### Option A: sed (Linux/Mac)
```bash
find 02-spec/11-spec-management-software -name "*.md" -exec sed -i '' 's|../general-spec/|../01-general-spec/|g' {} \;
```

### Option B: PowerShell (Windows)
```powershell
Get-ChildItem -Path "02-spec/11-spec-management-software" -Filter "*.md" -Recurse | 
ForEach-Object {
    (Get-Content $_.FullName) -replace '\.\./general-spec/', '../01-general-spec/' | 
    Set-Content $_.FullName
}
```

### Option C: VS Code
1. Open Search & Replace (Ctrl+Shift+H)
2. Files to include: `02-spec/11-spec-management-software/**/*.md`
3. Search: `../general-spec/`
4. Replace: `../01-general-spec/`
5. Replace All

---

## Verification After Fix

```bash
grep -r "../general-spec/" 02-spec/11-spec-management-software --include="*.md" | wc -l
# Should return 0
```

---

*Batch fix list generated 2026-02-02*
