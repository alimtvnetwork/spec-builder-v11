# Memory: features/gsearch-cli/provider-integration

**Updated:** 2026-02-28
**Version:** 1.0.0  

---

## Summary

GSearch CLI supports multiple SERP providers (02-spec/20-gsearch-cli/01-backend/59-provider-integration.md, error range 7920-7949) with parallel execution and Split DB storage. Three providers are supported via `providertype.Variant`: SerpApi (commercial), MapsScraper (gosom, open-source), and Colly (high-performance scraping). All enum packages use the `type` suffix convention (e.g., `providertype`, `searchmodetype`).

---

## Provider Variants

| Provider | Enum Constant | Library | API Key Required | Parallel Support | Use Case |
|----------|---------------|---------|------------------|------------------|----------|
| SerpApi | `providertype.SerpApi` | SerpAPI | Yes | Limited (rate-limited) | Reliable commercial SERP data |
| MapsScraper | `providertype.MapsScraper` | gosom/google-maps-scraper | No | Yes (10 concurrent) | Google Maps local results |
| Colly | `providertype.Colly` | gocolly/colly | No | Yes (50 concurrent) | High-volume parallel scraping |

---

## Orchestrator Pattern

```go
// Use all three providers in parallel
gsearch search "query" --providers serpapi,colly,maps_scraper --mode parallel

// Round-robin across providers
gsearch search "query" --providers serpapi,colly --mode round_robin
```

---

## Split DB Storage

Results stored in: `data/{app}/serp/{provider}/{hash}.db`

Each provider has isolated storage with:
- Query hash-based sharding
- Configurable TTL (default: 5 days)
- Automatic cache expiration

---

## Key References

- Specification: `02-spec/20-gsearch-cli/01-backend/59-provider-integration.md`
- Enum Architecture: `02-spec/20-gsearch-cli/01-backend/58-enum-architecture.md`
- Split DB: `02-spec/06-split-db-architecture/00-overview.md`
