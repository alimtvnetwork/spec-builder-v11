# Memory: features/gsearch-cli/unified-cli-api-reference

**Updated:** 2026-02-05
**Version:** 1.0.0  

---

## Summary

GSearch CLI provides a comprehensive unified CLI and REST API reference (spec/20-gsearch-cli/01-backend/60-unified-cli-api-reference.md) covering all search, provider, SERP, schedule, enum, and cache operations. All options use enum-based configuration.

---

## CLI Command Categories

| Category | Commands | Description |
|----------|----------|-------------|
| Search | `search`, `site-search` | Query execution with provider/platform selection |
| Providers | `providers list/health/config` | Provider management |
| SERP | `serp`, `serp track`, `serp competitors` | Position tracking |
| Schedule | `schedule create/list/pause/resume` | Automated searches |
| Enums | `enums list/validate/describe` | Enum inspection |
| Cache | `cache status/clear/set-ttl` | Cache management |

---

## Key CLI Examples

```bash
# Multi-provider parallel search
gsearch search "query" --providers serpapi,colly --mode parallel

# Multi-platform parallel search
gsearch search "query" --platforms youtube,reddit,linkedin --mode parallel

# All platforms at once
gsearch search "query" --all-platforms

# List enum values
gsearch enums list platform
```

---

## REST API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/search` | POST | Full search with provider control |
| `/api/v1/search/{platform}` | GET | Single platform search |
| `/api/v1/search/parallel` | POST | Parallel multi-source search |
| `/api/v1/providers` | GET | List providers with status |
| `/api/v1/enums/{type}` | GET | List enum values |

---

## Key References

- Specification: `spec/20-gsearch-cli/01-backend/60-unified-cli-api-reference.md`
- Enum Architecture: `spec/20-gsearch-cli/01-backend/58-enum-architecture.md`
- Provider Integration: `spec/20-gsearch-cli/01-backend/59-provider-integration.md`
