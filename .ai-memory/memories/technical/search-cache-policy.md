# Memory: technical/search-cache-policy
Updated: now
**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

A default 5-day Time-To-Live (TTL) cache policy applies to search results and URL extractions, while authority/traffic metrics use a 30-day TTL. These values are defined in seedable configuration (extract_settings category), stored in the global Setting DB, and cascade at runtime: CLI flag > request-level override > global setting > hardcoded default. Caches are stored in isolated database files following a `{seq}-{slug}.db` naming convention or content-addressable hashes. The '--force' flag performs a hard refresh by deleting existing cache before fetching fresh data.
