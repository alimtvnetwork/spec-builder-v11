# Drift Detection Baseline — 2026-03-09

**Purpose:** Establish per-module violation counts before mass remediation.  
**Method:** Regex search across `spec/` directory for all violation patterns.

---

## Global Totals

| Violation Type | Pattern | Total Matches | Files |
|---------------|---------|---------------|-------|
| `fmt.Errorf` | `fmt\.Errorf` | **3,625** | 149 |
| `ctx` param naming | `ctx context\.Context` | **4,570** | 136 |
| Tuple returns | `) (*T, error)` | **4,413** | 216 |
| `return nil,` (tuple indicator) | `return nil, ` | **5,749** | 172 |
| `errors.New(` (sentinel) | `errors\.New\(` | **694** | 42 |
| `errors.Wrap` (old pkg) | `errors\.Wrap` | **515** | 21 |
| **Combined Total** | — | **~19,566** | ~286 unique files |

---

## Per-Module Breakdown: `fmt.Errorf`

| Module | Path | Matches | Files | Status |
|--------|------|---------|-------|--------|
| GSearch CLI (main) | `02-spec/20-gsearch-cli/` | **431** | 16 | 🔴 Active remediation |
| BRun CLI | `02-spec/21-brun-cli/` | **143** | 7 | 🔴 Open (BR-I08) |
| AI Bridge CLI | `02-spec/22-ai-bridge-cli/` | **73** | 10 | 🟢 Mostly exempted (v4.0.1) |
| NexusFlow CLI | `02-spec/24-nexus-flow-cli/` | **120** | 2 | 🔴 Unremediated |
| WP Plugin Publish | `02-spec/30-wp-plugin/` | **75** | 4 | 🔴 Unremediated |
| WP Plugin Builder | `02-spec/31-wp-plugin-builder/` | **70** | 1 | 🟡 All in enum Parse() |
| AI Transcribe CLI | `02-spec/26-ai-transcribe-cli/` | **295** | 9 | 🔴 Unremediated |
| Spec Management | `02-spec/11-spec-management-software/` | **1,953** | 73 | 🔴 Largest backlog |
| License Manager | `02-spec/27-license-manager/` | **5** | 1 | 🟢 Report text only |
| Golang Standards | `02-spec/02-coding-guidelines/03-golang/` | **77** | 7 | 🟡 Mixed (examples + templates) |

---

## Per-Module Breakdown: `ctx context.Context`

| Module | Path | Matches | Files | Status |
|--------|------|---------|-------|--------|
| GSearch CLI (main) | `02-spec/20-gsearch-cli/` | **374** | 17 | 🔴 Active remediation |
| BRun CLI | `02-spec/21-brun-cli/` | **20** | 3 | 🟡 Low count (BR-I10) |
| AI Bridge CLI | `02-spec/22-ai-bridge-cli/` | **199** | 13 | 🟡 Partially remediated |
| NexusFlow CLI | `02-spec/24-nexus-flow-cli/` | **152** | 3 | 🔴 Unremediated |
| WP Plugin Publish | `02-spec/30-wp-plugin/` | **508** | 10 | 🔴 Unremediated |
| WP Plugin Builder | `02-spec/31-wp-plugin-builder/` | **0** | 0 | 🟢 Clean |
| AI Transcribe CLI | `02-spec/26-ai-transcribe-cli/` | **233** | 6 | 🔴 Unremediated |
| Spec Management | `02-spec/11-spec-management-software/` | **2,856** | 71 | 🔴 Largest backlog |
| License Manager | `02-spec/27-license-manager/` | **0** | 0 | 🟢 Clean |

---

## Remediation Priority Matrix

| Priority | Module | `fmt.Errorf` | `ctx` | Est. Effort | Justification |
|----------|--------|-------------|-------|-------------|---------------|
| **P0** | GSearch CLI main (`08`) | 431 | 374 | High | Active remediation in progress |
| **P1** | BRun CLI (`09`) | 143 | 20 | Medium | Grade F, 14 open violations |
| **P2** | Spec Management (`02`) | 1,953 | 2,856 | Very High | Largest absolute count |
| **P3** | AI Transcribe CLI (`15`) | 295 | 233 | Medium | Fully unremediated |
| **P4** | NexusFlow CLI (`11`) | 120 | 152 | Medium | Fully unremediated |
| **P5** | WP Plugin Publish (`12`) | 75 | 508 | Medium | High `ctx` count |
| **P6** | WP Plugin Builder (`13`) | 70 | 0 | Low | Only enum Parse() |
| **Exempt** | AI Bridge CLI (`10`) | 73 | 199 | — | v4.0.1 compliant, remaining are exempted |
| **Exempt** | License Manager (`18`) | 5 | 0 | — | 100/100 compliant |
| **Exempt** | Golang Standards (`25`) | 77 | — | — | Reference/template examples |

---

## Notes

- **Enum `Parse()` functions** using `fmt.Errorf` in modules 11, 13, 25 may be considered exempt (stdlib `error` interface requirement for enum parsing). Decision pending.
- **AI Bridge CLI** `fmt.Errorf` matches are mostly in changelog/report text or exempted stdlib boundaries.
- **`return nil,`** count (5,749) is the most reliable proxy for total tuple-return violations still present.
- **`errors.New`** (694 matches) includes both legitimate sentinel errors and violations — needs per-file triage.
- GSearch CLI feature spec directory (`02-spec/11-spec-management-software/05-features/22-golang-search-cli/`) was remediated in Wave 2/2.5 and is at ~99/100.

---

*Baseline established 2026-03-09 to track remediation progress across waves.*
