# Memory: features/gsearch-movie-search

**Updated:** 2026-02-03
**Version:** 1.0.0  

---

## Summary

The GSearch CLI includes a movie search feature that retrieves metadata (rating, description, cast) from TMDB (Primary), OMDB (Secondary), and IMDb. It features a normalization pipeline to clean release-format filenames (e.g., `Fallout.2024.S01E01...` → `Fallout 2024 S01E01`) and intelligently distinguishes between Movies and TV Shows. Results are cached for 30 days in a Split DB architecture with content at `data/movies-and-tv.db` and search history at `data/movies/search.db`. The system supports batch processing with parallel workers and token-bucket rate limiting with multiple rotating API keys to prevent quota exhaustion.

---

## Database Architecture

| Database | Path | Purpose |
|----------|------|---------|
| Content Cache | `data/movies-and-tv.db` | All movie/TV show metadata |
| Search Registry | `data/movies/search.db` | Search history, batch jobs |
| Episodes DB | `data/movies/tv-episodes.db` | All episodes across all shows |
| Folder Batch | `data/movies/folder-batch-cache.db` | All folder batch scan results |

Normalization tokens (quality, encoding, source, language codes) are stored in seedable configuration (`config.seed.json`) and accessed via typed constants (e.g., `MovieKeyQualityTokens`, `MovieKeyLanguageCodes`).

---

## Key Details

### Normalization Pipeline

1. Strip release-group artifacts (e.g., `-ELiTE`, `[Pir8]`)
2. Replace dots/underscores with spaces
3. Extract season/episode patterns (S01E03, Season 1, etc.)
4. Detect content type (Movie vs TV Show)
5. Clean quality/codec tags (1080p, x265, AAC, etc.)

### Content Type Detection

| Pattern | Detection |
|---------|-----------|
| `S01E03`, `Season 1` | TV Show |
| `2024` (4-digit year only) | Movie |
| `Complete Series` | TV Show |

### API Key Rotation

Multiple API keys configured for TMDB and OMDB with round-robin rotation to maximize throughput and avoid rate limits.

### Caching

- **TTL:** 30 days for metadata
- **Force Refresh:** `--force` flag bypasses cache

---

## Cross-References

- Spec: `spec/20-gsearch-cli/01-backend/61-movie-search.md`
- Error Codes: 7600-7609 in `spec/20-gsearch-cli/01-backend/15-error-codes.md`
- Configuration: `spec/20-gsearch-cli/01-backend/02-configuration.md`
