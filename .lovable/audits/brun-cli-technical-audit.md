# BRun CLI Technical Audit Report

**Audit Date:** 2026-03-04  
**Auditor:** AI Technical Audit  
**Scope:** `spec/21-brun-cli/` (21 backend files + frontend/deploy + consistency report)  
**Methodology:** Same as GSearch CLI audit — coding standards, cross-references, enum compliance, function design

---

## Summary

| Category | Score | Status |
|----------|-------|--------|
| Enum Architecture Compliance | 60% | ⚠️ Needs Remediation |
| Function Design Compliance | 40% | 🔴 Critical |
| Cross-Reference Integrity | 75% | ⚠️ Issues Found |
| Error Code Consistency | 70% | ⚠️ Overlaps Found |
| Version Consistency | 50% | 🔴 Critical |
| Naming Convention Compliance | 80% | ⚠️ Minor Issues |
| **Overall Health Score** | **62/100** | **Grade: C** |

---

## Critical Findings

### C-01: Pervasive Tuple Return Violations

**Severity:** 🔴 Critical  
**Standard:** `function-design.md` — single-return rule (`apperror.Result[T]`)  
**Affected Files:** 01, 04, 05, 06, 07, 08, 09, 10

Almost every function in the spec returns `(*T, error)` tuples instead of `apperror.Result[T]`:

| File | Function | Current Return | Required Return |
|------|----------|----------------|-----------------|
| `01-core-architecture.md` | `Executor.Execute()` | `(*ExecutionResult, error)` | `apperror.Result[ExecutionResult]` |
| `01-core-architecture.md` | `Executor.GetVersion()` | `(string, error)` | `apperror.Result[string]` |
| `04-runtime-executors.md` | `PowerShellExecutor.Execute()` | `(*ExecutionResult, error)` | `apperror.Result[ExecutionResult]` |
| `05-port-management.md` | `PortManager.CheckPort()` | `(*PortCheckResult, error)` | `apperror.Result[PortCheckResult]` |
| `07-build-profiles.md` | `ProfileManager.Get()` | `(*BuildProfile, error)` | `apperror.Result[BuildProfile]` |
| `09-integration-api.md` | `BrunRunner.execute()` | `(*ExecutionResult, error)` | `apperror.Result[ExecutionResult]` |
| `10-data-models.md` | `BuildRunRepository.GetByRunId()` | `(*BuildRun, error)` | `apperror.Result[BuildRun]` |

**Impact:** ~30+ functions violate the single-return rule.

---

### C-02: Legacy RuntimeType String Constants in Core Architecture

**Severity:** 🔴 Critical  
**Location:** `01-core-architecture.md` lines 76-82  
**Standard:** `19-enum-architecture.md` — `type Variant byte` with iota

```go
// ❌ FOUND in 01-core-architecture.md
type RuntimeType string
const (
    RuntimePowerShell RuntimeType = "powershell"
    RuntimeNodeJS     RuntimeType = "nodejs"
    RuntimeGolang     RuntimeType = "golang"
)

// ✅ REQUIRED (already defined in 19-enum-architecture.md)
// runtimetype.Variant with iota constants
```

The core architecture file still uses the old string-based enum pattern, contradicting the enum architecture defined in the same spec.

---

### C-03: Enum Package Name Inconsistencies

**Severity:** ⚠️ Major  
**Location:** `03-configuration.md` Go structs (lines 459-576)  
**Standard:** `19-enum-architecture.md` — package naming with `type` suffix

| Found in `03-configuration.md` | Required per `19-enum-architecture.md` |
|--------------------------------|----------------------------------------|
| `package_manager.Variant` | `packagemanagertype.Variant` |
| `mod_tidy_mode.Variant` | `modtidymodetype.Variant` |
| `http_method.Variant` | `httpmethodtype.Variant` |
| `copy_mode.Variant` | `copymodetype.Variant` |
| `output_format.Variant` | `outputformattype.Variant` |
| `runtime.Variant` | `runtimetype.Variant` |

Also affects `08-asset-operations.md` line 34: `copy_mode.Variant`.

---

### C-04: Version Number Drift

**Severity:** 🔴 Critical  
**Multiple locations report different versions:**

| Location | Version |
|----------|---------|
| `spec/21-brun-cli/00-overview.md` | 2.1.0 |
| `spec/21-brun-cli/01-backend/00-overview.md` | 2.3.0 |
| `spec/11-spec-management-software/05-features/23-build-runner-cli/00-overview.md` | 2.0.0 |
| `spec/11-spec-management-software/15-external-tools/04-brun-reference.md` | 2.1.0 |
| Individual backend files (01-08) | 1.0.0 |

No single authoritative version. Backend overview is highest at 2.3.0 but individual spec files still say 1.0.0.

---

### C-05: Error Code Range Overlaps

**Severity:** ⚠️ Major  

1. **Settings Service vs Runtime Execution:** `17-settings-service.md` defines error codes BR-7200 through BR-7209 which directly overlap with the Runtime Execution range (7200-7299) defined in `06-error-handling.md`.

2. **Reset API vs Build Process:** `18-reset-api.md` defines BR-7401 through BR-7407 which overlap with the Build Process range (7400-7499) in `06-error-handling.md`.

3. **Root overview mismatch:** `00-overview.md` error code table says "71xx = CLI/argument, 72xx = Configuration" but `06-error-handling.md` defines "70xx = CLI General, 71xx = Configuration". Off-by-one hundred in the summary.

---

### C-06: Broken Cross-References

**Severity:** ⚠️ Major

| File | Reference | Issue |
|------|-----------|-------|
| `09-integration-api.md` line 17 | `../06-ai-integration/00-overview.md` | Resolves to `spec/21-brun-cli/06-ai-integration/` — does NOT exist |
| `12-ai-config-generation.md` line 16 | `../06-ai-integration/00-overview.md` | Same broken reference |
| `99-consistency-report.md` line 51 | `17-frontend-architecture.md` | File is at `02-frontend/01-frontend-architecture.md`, not in backend folder |

---

### C-07: BuildError Severity Field Type Drift

**Severity:** ⚠️ Major

| File | `Severity` Type | Required |
|------|-----------------|----------|
| `01-core-architecture.md` line 114 | `string` | `severitytype.Variant` |
| `06-error-handling.md` line 41 | `severity.Variant` ✅ | — |
| `09-integration-api.md` line 169 | `string` | `severitytype.Variant` |

The same struct `BuildError` is defined 3 times with inconsistent severity types.

---

### C-08: Duplicate BrunError Struct Definitions

**Severity:** ⚠️ Major

`BrunError` is defined in two different files with incompatible structures:

1. **`06-error-handling.md` line 560:** `Code int`, `Constant string`, `Message string`, `Details string`, `Retryable bool`, `ExitCode int`
2. **`09-integration-api.md` line 536:** `ExitCode int`, `Message string`, `Result *ExecutionResult`

These have different fields and different `Error()` method implementations.

---

### C-09: FirewallRule Uses String Fields Instead of Enums

**Severity:** ⚠️ Minor  
**Location:** `05-port-management.md` lines 196-203

```go
type FirewallRule struct {
    Protocol  string // should be enum: tcp, udp, both
    Direction string // should be enum: in, out, both
    Action    string // should be enum: allow, block
}
```

---

### C-10: Function Length Violations

**Severity:** ⚠️ Minor  
**Standard:** 15-line limit (excluding error handling)

| File | Function | Approx Lines |
|------|----------|-------------|
| `07-build-profiles.md` | `ExecuteProfile()` | ~40 lines |
| `04-runtime-executors.md` | `GolangExecutor.Execute()` | ~25 lines |
| `06-error-handling.md` | `ErrorParser.Parse()` | ~20 lines |
| `09-integration-api.md` | `BrunRunner.execute()` | ~35 lines |

---

### C-11: 99-consistency-report.md Claims 100% But Findings Contradict

**Severity:** ⚠️ Major  

The consistency report claims 100% across all metrics and "No issues found", but this audit identifies 10+ substantive issues. The report is stale and should be regenerated.

---

## Remediation Priority

| Priority | Finding | Effort |
|----------|---------|--------|
| P0 | C-01: Tuple returns → `apperror.Result[T]` | High (30+ functions) |
| P0 | C-02: Legacy RuntimeType → enum pattern | Low |
| P0 | C-04: Version alignment | Low |
| P1 | C-03: Enum package naming | Medium |
| P1 | C-05: Error code overlaps | Medium |
| P1 | C-06: Broken cross-references | Low |
| P1 | C-07: BuildError severity drift | Low |
| P1 | C-08: Duplicate BrunError | Low |
| P2 | C-09: FirewallRule string fields | Low |
| P2 | C-10: Function length | Medium |
| P2 | C-11: Stale consistency report | Medium |

---

## Positive Observations

1. **Enum architecture (`19-enum-architecture.md`)** is comprehensive and well-structured with all 7 mandatory methods
2. **Split DB architecture (`16-database-architecture.md`)** properly follows PascalCase naming
3. **Settings service (`17-settings-service.md`)** correctly avoids `interface{}` with `SettingValue` union struct
4. **Reset API (`18-reset-api.md`)** follows the 2-step confirmation standard
5. **Acceptance criteria (`11-acceptance-criteria.md`)** are thorough with GIVEN/WHEN/THEN format
6. **AI integration boundaries** are clearly documented — brun contains NO AI capabilities

---

## Files Audited

| File | Lines | Issues |
|------|-------|--------|
| `00-overview.md` (root) | 124 | C-04, C-05 |
| `01-backend/00-overview.md` | 48 | C-04 |
| `01-backend/01-core-architecture.md` | 272 | C-01, C-02, C-07 |
| `01-backend/02-cli-interface.md` | 316 | Clean |
| `01-backend/03-configuration.md` | 589 | C-03 |
| `01-backend/04-runtime-executors.md` | 403 | C-01, C-10 |
| `01-backend/05-port-management.md` | 384 | C-01, C-09 |
| `01-backend/06-error-handling.md` | 675 | C-05, C-08 |
| `01-backend/07-build-profiles.md` | 341 | C-01, C-10 |
| `01-backend/08-asset-operations.md` | 400 | C-03 |
| `01-backend/09-integration-api.md` | 930 | C-01, C-06, C-07, C-08, C-10 |
| `01-backend/10-data-models.md` | 327 | C-01 |
| `01-backend/11-acceptance-criteria.md` | 537 | Clean |
| `01-backend/12-ai-config-generation.md` | 555 | C-06 |
| `01-backend/16-database-architecture.md` | 358 | Clean |
| `01-backend/17-settings-service.md` | 469 | C-05 |
| `01-backend/18-reset-api.md` | 293 | C-05 |
| `01-backend/19-enum-architecture.md` | 713 | Clean (reference standard) |
| `99-consistency-report.md` | 247 | C-06, C-11 |

**Total lines audited: ~7,966**
