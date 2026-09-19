# Memory: features/gsearch-cli/enum-architecture

**Updated:** 2026-02-28
**Version:** 1.0.0  

---

## Summary

GSearch CLI implements a comprehensive enum-based architecture (02-spec/20-gsearch-cli/01-backend/58-enum-architecture.md, error range 7900-7919) for type-safe configuration. All platform, provider, engine, and mode selections use typed enums from the `internal/enums/` directory structure. All packages use the `type` suffix convention with no underscores, single `variantLabels` table with PascalCase values, `Label()` delegates to `String()`, `Parse()` uses `strings.EqualFold()`.

---

## Enum Directory Structure

```
internal/enums/
├── providertype/variant.go      # SerpApi, MapsScraper, Colly
├── platformtype/variant.go      # YouTube, Reddit, Medium, LinkedIn, etc.
├── enginetype/variant.go        # Google, Bing, DuckDuckGo
├── searchmodetype/variant.go    # Sequential, Parallel, RoundRobin
├── socialmediatype/variant.go   # LinkedIn, Instagram, Twitter, etc.
├── outputformattype/variant.go  # Json, Csv, Table, Markdown
├── movieprovidertype/variant.go # Tmdb, Omdb, Trakt, ImdbScraper
├── contenttype/variant.go       # Web, Image, Video, News
└── registry.go                  # Central enum registry
```

---

## Key Enums

| Enum | Values | Purpose |
|------|--------|---------|
| `providertype.Variant` | SerpApi, MapsScraper, Colly | SERP data provider selection |
| `platformtype.Variant` | Google, YouTube, Reddit, LinkedIn, etc. | Search platform targeting |
| `enginetype.Variant` | Google, Bing, DuckDuckGo | Search engine selection |
| `searchmodetype.Variant` | Sequential, Parallel, RoundRobin | Execution mode |
| `movieprovidertype.Variant` | Tmdb, Omdb, Trakt, ImdbScraper | Movie data provider selection |

---

## Usage Pattern

```go
import "gsearch/internal/enums/platformtype"

// Type-safe platform selection
platforms := []platformtype.Variant{
    platformtype.YouTube,
    platformtype.Reddit,
    platformtype.LinkedIn,
}

// Validation
if !platformtype.YouTube.IsValid() { ... }

// Site operator
siteOp := platformtype.Reddit.SiteOperator() // "site:reddit.com"
```

---

## Key References

- Specification: `02-spec/20-gsearch-cli/01-backend/58-enum-architecture.md`
- Provider Integration: `02-spec/20-gsearch-cli/01-backend/59-provider-integration.md`
