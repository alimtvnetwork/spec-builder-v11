# Memory: features/gsearch-cli/movie-provider-integration

**Updated:** 2026-02-28
**Version:** 1.0.0  

---

## Summary

GSearch CLI Movie Search supports four switchable providers via `movieprovidertype.Variant`: **Tmdb** (primary, via `golang-tmdb`), **Omdb** (ratings aggregation), **Trakt** (discovery/ID mapping), and **ImdbScraper** (fallback). Providers implement a unified `Provider` interface and can execute in parallel via the `Orchestrator`. All enum packages use the `type` suffix convention with no underscores.

---

## Provider Enum

```go
// internal/enums/movieprovidertype/variant.go
package movieprovidertype

type Variant byte

const (
    Invalid     Variant = iota
    Tmdb
    Omdb
    Trakt
    ImdbScraper
)

var variantLabels = [...]string{
    Invalid: "Invalid", Tmdb: "Tmdb", Omdb: "Omdb",
    Trakt: "Trakt", ImdbScraper: "ImdbScraper",
}
```

---

## Go Libraries

| Provider | Package | API Key | Use Case |
|----------|---------|---------|----------|
| Tmdb | `github.com/cyruzin/golang-tmdb` | Yes | Primary metadata, episodes |
| Omdb | `github.com/mohan3d/omdbapi` | Yes | IMDB/RT/Metacritic ratings |
| Trakt | `gitlab.com/ydkn/go-trakt` | Yes | ID mapping, discovery |
| ImdbScraper | Custom Colly scraper | No | Fallback only |

---

## Key Features

- **Parallel Provider Execution**: Query Tmdb + Omdb simultaneously
- **Split DB Storage**: Results cached in `data/movies-and-tv.db`
- **ID Mapping**: Trakt provides IMDB ↔ TMDB ↔ TVDB cross-references
- **Episode Support**: Tmdb and Trakt support season/episode queries

---

## CLI Usage

```bash
# Use specific provider
gsearch movie search "Oppenheimer" --provider tmdb

# Use multiple providers in parallel
gsearch movie search "Fallout" --providers tmdb,omdb --mode parallel

# Batch normalize with TMDB
gsearch movie batch ./downloads --provider tmdb
```

---

## Key References

- Specification: `02-spec/20-gsearch-cli/01-backend/23-movie-search.md`
- Enum Architecture: `02-spec/20-gsearch-cli/01-backend/58-enum-architecture.md`
- Provider Integration: `02-spec/20-gsearch-cli/01-backend/59-provider-integration.md`
