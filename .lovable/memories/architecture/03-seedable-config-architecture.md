# Memory: architecture/seedable-config-architecture

**Updated:** 2026-02-02  
**Version:** 1.0.0  
**Status:** Active  
**Spec Location:** `spec/07-seedable-config-architecture/00-overview.md`

---

## Overview

**Seedable Config Architecture + Changelog Versioning** ensures:

1. First-run seeding from `config.seed.json` to SQLite DB
2. Every config change updates the version
3. Every version change logs to CHANGELOG.md
4. Subsequent runs respect version to avoid duplicate seeds

---

## CRITICAL: No Hardcoded Arrays

**All validation arrays, lookup tables, and configurable data MUST use CW Config → Root DB pattern.**

### Anti-Pattern ❌
```go
// WRONG: Hardcoded in source
transitions := []string{"however", "therefore", ...}
```

### Correct Pattern ✅
```go
// RIGHT: Load from Root DB (seeded via config.seed.json)
transitions, _ := validationData.GetStringArray("seo", "transitionWords")
```

**Spec:** `spec/07-seedable-config-architecture/06-validation-data-seeding.md`

---

## Files

| File | Purpose |
|------|---------|
| `config.seed.json` | Default seed values (arrays, thresholds) |
| `config.schema.json` | JSON Schema validation |
| `config.json` | Runtime config (gitignored) |
| `CHANGELOG.md` | Version history |

---

## Version Flow

```
config.seed.json (version: 1.2.0)
         ↓
  Version > DB version?
         ↓
    YES → Merge new settings + Update CHANGELOG
    NO  → Skip seed
```

---

## Version Bumping

| Change | Bump |
|--------|------|
| New category | Minor |
| New setting | Minor |
| Default changed | Patch |
| Breaking change | Major |

---

## Theme Support

All CLIs support 20+ themes via Seedable Config:
- Base: light, dark, system, high-contrast
- Editor: dracula, nord, solarized, monokai, one-dark
- Colorful: ocean, forest, sunset, lavender, cyberpunk

---

## Applicable Projects

- All CLI frontends (`spec/28-shared-cli-frontend/`)
- GSearch CLI, BRun CLI, AI Bridge CLI, Nexus Flow CLI, WP SEO Publish CLI
