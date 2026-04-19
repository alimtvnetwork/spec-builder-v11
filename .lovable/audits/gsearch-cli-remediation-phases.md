# GSearch CLI Enum Remediation Phases

**Goal:** Achieve 50/50 compliance score  
**Initial Score:** 26/50  
**Final Score:** 50/50 ✅  
**Status:** COMPLETE

---

## Phase Overview

| Phase | Description | Score Impact | Status |
|-------|-------------|--------------|--------|
| **Phase 1** | Convert `type Variant string` → `type Variant byte` | +8 | ✅ Complete |
| **Phase 2** | Add `Unknown` zero value to all enums | +4 | ✅ Complete |
| **Phase 3** | Add `variantStrings` and `variantLabels` lookup tables | +6 | ✅ Complete |
| **Phase 4** | Add `Label()` and `Is{Value}()` methods | +6 | ✅ Complete |
| **Phase 5** | Add `ByIndex()` method | +2 | ✅ Complete |
| **Phase 6** | Add JSON Marshal/Unmarshal support | +2 | ✅ Complete |
| **Phase 7** | Remove hardcoded strings from configuration | +4 | ✅ Complete |
| **Phase 8** | Add movie search enums + database enums | +4 | ✅ Complete |
| **Phase 9** | Final audit and documentation | — | ✅ Complete |

**All phases complete. GSearch CLI is now fully compliant with spec/17-enum-specification/.**

---

## Phase 1: Convert String to Byte

**Objective:** Change all `type Variant string` declarations to `type Variant byte` with `iota`.

**Files to Update:**
- `spec/20-gsearch-cli/01-backend/58-enum-architecture.md`

**Enums Affected:**
1. `provider.Variant` (lines 56-63)
2. `platform.Variant` (lines 147-162)
3. `engine.Variant` (lines 306-313)
4. `search_mode.Variant` (lines 384-390)
5. `social_media.Variant` (lines 448-460)
6. `output.Variant` (lines 565-574)

**Before:**
```go
type Variant string

const (
    SerpAPI     Variant = "serpapi"
    MapsScraper Variant = "maps_scraper"
)
```

**After:**
```go
type Variant byte

const (
    Unknown     Variant = iota
    SerpAPI
    MapsScraper
)

var variantStrings = [...]string{
    Unknown:     "unknown",
    SerpAPI:     "serpapi",
    MapsScraper: "maps_scraper",
}
```

---

## Phase 2: Add Unknown Zero Value

**Objective:** Ensure every enum has `Unknown` as the first constant (zero value).

**Pattern:**
```go
const (
    Unknown Variant = iota  // Always first
    // ... valid values
)
```

---

## Phase 3: Add Lookup Tables

**Objective:** Add `variantStrings` and `variantLabels` arrays to all enums.

**Pattern:**
```go
var variantStrings = [...]string{
    Unknown:     "unknown",
    SerpAPI:     "serpapi",
    // ...
}

var variantLabels = [...]string{
    Unknown:     "Unknown Provider",
    SerpAPI:     "SerpAPI",
    // ...
}
```

---

## Phase 4: Add Label and Is{Value} Methods

**Objective:** Add `Label()` method and individual `Is{Value}()` methods.

**Pattern:**
```go
func (v Variant) Label() string {
    if !v.IsValid() {
        return variantLabels[Unknown]
    }
    return variantLabels[v]
}

func (v Variant) IsUnknown() bool     { return v == Unknown }
func (v Variant) IsSerpAPI() bool     { return v == SerpAPI }
func (v Variant) IsMapsScraper() bool { return v == MapsScraper }
func (v Variant) IsColly() bool       { return v == Colly }
```

---

## Phase 5: Add ByIndex Method

**Objective:** Add `ByIndex(int) Variant` method for indexed access.

**Pattern:**
```go
func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantStrings) {
        return Unknown
    }
    return Variant(i)
}
```

---

## Phase 6: Add JSON Support

**Objective:** Add `MarshalJSON` and `UnmarshalJSON` methods.

**Pattern:**
```go
func (v Variant) MarshalJSON() ([]byte, error) {
    return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return err
    }
    parsed, err := Parse(s)
    if err != nil {
        return err
    }
    *v = parsed
    return nil
}
```

---

## Phase 7: Remove Hardcoded Strings ✅ COMPLETE

**Objective:** Update configuration spec to use enum types instead of strings.

**Files Updated:**
- `spec/20-gsearch-cli/01-backend/02-configuration.md`
- `spec/20-gsearch-cli/01-backend/58-enum-architecture.md`

**Changes Made:**
1. Replaced `SearchConfig.DefaultEngine string` → `engine.Variant`
2. Replaced `ProxyConfig.Type string` → `proxy_type.Variant`
3. Replaced `ProxyRotation.Strategy string` → `rotation_strategy.Variant`
4. Replaced `OutputConfig.DefaultFormat string` → `output.Variant`
5. Replaced `BackoffConfig.JitterType string` → `jitter_type.Variant`
6. Replaced `LoggingConfig.Level string` → `log_level.Variant`
7. Replaced `TmdbAPIConfig.RotationMode string` → `rotation_strategy.Variant`
8. Replaced `OmdbAPIConfig.RotationMode string` → `rotation_strategy.Variant`

**New Enums Added:**
- `proxy_type.Variant` - Http, Https, Socks5, Socks5h
- `rotation_strategy.Variant` - RoundRobin, Random, LeastUsed, Failover, Weighted
- `jitter_type.Variant` - Full, Equal, Decorrelated, Bounded

---

## Phase 8: Add Missing Enums

**Objective:** Create enums identified in movie search and database schema.

**New Enums:**
- `movie_provider.Variant` (TMDB, OMDB, Trakt, IMDB)
- `movie_search_mode.Variant` (Movie, Series, Episode)
- `search_status.Variant` (Pending, Running, Completed, Failed)
- `rag_format.Variant` (JSON, Markdown, YAML)

---

## Phase 9: Final Audit

**Objective:** Re-run compliance audit and update documentation.

**Deliverables:**
- Updated audit score (target: 50/50)
- Updated `spec/17-enum-specification/00-overview.md`
- Updated memory: `standards/compliance/enum-audit-registry`

---

*GSearch CLI enum remediation tracking document.*
