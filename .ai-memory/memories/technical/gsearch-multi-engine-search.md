# Memory: technical/gsearch-multi-engine-search
Updated: now
**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

GSearch Multi-Engine Search (Phase 1 of Business Intelligence Suite) supports Google, Bing, and DuckDuckGo with pluggable adapters. The system uses API rotation with priority-based fallback (SerpAPI, Serper, Azure Bing) and stealth scraping via go-rod as last resort. Results are normalized to a unified schema with optional cross-engine deduplication and aggregation. Error codes occupy range 7700-7719. Caching follows Split DB pattern with 5-day default TTL. CLI syntax: `gsearch search "query" --engines google,bing --method auto`.
