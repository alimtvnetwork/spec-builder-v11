# Memory: standards/enum-specification-standard

**Updated:** 2026-02-28
**Version:** 1.0.0  

---

## Summary

A universal enum specification (`02-spec/02-coding-guidelines/03-golang/01-enum-specification/`) defines the mandatory pattern for all Go-based CLI applications. All enums must use `type Variant byte` (not string), start with `Invalid = iota` as zero value, and use a single `variantLabels` lookup table with PascalCase values matching constant names. **All enum packages must end with `type` suffix** (e.g., `providertype`, `httpmethodtype`) with no underscores — convention over configuration. `Label()` delegates to `String()`, `Parse()` uses `strings.EqualFold()`.

---

## Required Methods

| Method | Signature | Purpose |
|--------|-----------|---------|
| `String` | `(v Variant) String() string` | PascalCase string representation via `variantLabels` |
| `Label` | `(v Variant) Label() string` | Delegates to `String()` |
| `IsValid` | `(v Variant) IsValid() bool` | Check if non-Invalid |
| `IsInvalid` | `(v Variant) IsInvalid() bool` | Check if zero value |
| `Is{Value}` | `(v Variant) IsSerpApi() bool` | Type check for each variant |
| `All` | `All() []Variant` | Returns all valid variants |
| `ByIndex` | `ByIndex(i int) Variant` | Get variant by index |
| `Parse` | `Parse(s string) (Variant, error)` | Case-insensitive parse via `strings.EqualFold()` |

---

## Folder Structure

```
internal/enums/
├── providertype/
│   └── variant.go
├── platformtype/
│   └── variant.go
└── {category}type/
    └── variant.go
```

---

## Key Pattern (v3.0.0)

```go
type Variant byte

const (
    Invalid Variant = iota  // Zero value first (never "Unknown")
    SerpApi
    MapsScraper
    Colly
)

var variantLabels = [...]string{
    Invalid:     "Invalid",
    SerpApi:     "SerpApi",
    MapsScraper: "MapsScraper",
    Colly:       "Colly",
}

func (v Variant) String() string { if v.IsInvalid() { return variantLabels[Invalid] }; return variantLabels[v] }
func (v Variant) Label() string  { return v.String() }
```

---

## Key Rules

| Rule | Detail |
|------|--------|
| Zero value name | `Invalid` (not `Unknown`) |
| Lookup table | Single `variantLabels` (no `variantStrings`) |
| variantLabels casing | **PascalCase** matching constant names |
| `Label()` behavior | Delegates to `String()` |
| `Parse()` behavior | `strings.EqualFold()` (case-insensitive) |
| Package naming | `{category}type` — no underscores |

---

## Audit Status

| CLI | Status | Score | Zero Value | v3.0.0 |
|-----|--------|-------|------------|--------|
| GSearch CLI | ✅ Compliant | 50/50 | `Invalid` ✅ | ✅ |
| BRun CLI | ✅ Compliant | 50/50 | `Invalid` ✅ | ✅ |
| AI Bridge CLI | ✅ Compliant | 50/50 | `Invalid` ✅ | ✅ |
| Nexus Flow CLI | ✅ Compliant | 50/50 | `Invalid` ✅ | ✅ |
| Spec Reverse CLI | ✅ Compliant | 50/50 | `Invalid` ✅ | ✅ |
| WP SEO Publish CLI | ✅ Compliant | 50/50 | `Invalid` ✅ | ✅ |
| AI Transcribe CLI | ✅ Compliant | 50/50 | `Invalid` ✅ | ✅ |
| WP Plugin Builder | ✅ Compliant | 50/50 | `Invalid` ✅ | ✅ |
| Spec Management | ✅ Compliant | 50/50 | `Invalid` ✅ | ✅ |

> **Note:** All 9 CLIs fully migrated to v3.0.0 (`type` suffix, single `variantLabels`, PascalCase, `strings.EqualFold()`) as of 2026-02-28.

---

## Key References

- Specification: `02-spec/02-coding-guidelines/03-golang/01-enum-specification/`
- Legacy Specification: `02-spec/02-coding-guidelines/02-typescript/`
- GSearch Audit: `.lovable/audits/gsearch-cli-enum-compliance-audit-2026-02-06.md`
