# Shared Preset Data — Search Presets

**Version:** 1.0.0  
**Last Updated:** 2026-03-20

---

## Overview

Mock search result presets for gSearch CLI testing. Each preset simulates a complete search response including multi-engine results and nested searches.

---

## Schema: Search Preset

```json
{
  "PresetId": "string",
  "Query": "string",
  "Engines": ["google", "duckduckgo", "bing"],
  "FetchedAt": "ISO-8601",
  "TotalResults": "number",
  "Results": [
    {
      "Rank": "number",
      "Title": "string",
      "Url": "string",
      "Snippet": "string",
      "Domain": "string",
      "Engine": "string",
      "Position": "number",
      "Features": ["featured_snippet", "site_links"]
    }
  ],
  "NestedSearches": [
    {
      "SourceUrl": "string",
      "ExtractedKeywords": ["string"],
      "NestedResults": [
        {
          "Query": "string",
          "TopResult": { "Title": "string", "Url": "string", "Snippet": "string" }
        }
      ]
    }
  ]
}
```

---

## Available Presets

| Preset ID | Query | Engines | Results | Nested |
|-----------|-------|---------|---------|--------|
| `carpet-cleaning-results` | professional carpet cleaning services | google, duckduckgo, bing | 45 | 3 keywords |
| `hvac-services-results` | HVAC repair services near me | google, bing | 38 | 2 keywords |
| `plumbing-keywords-results` | emergency plumbing services | google, duckduckgo | 32 | 4 keywords |

---

## Sample: carpet-cleaning-results

```json
{
  "PresetId": "carpet-cleaning-results",
  "Query": "professional carpet cleaning services",
  "Engines": ["google", "duckduckgo", "bing"],
  "FetchedAt": "2026-02-01T10:00:00Z",
  "TotalResults": 45,
  "Results": [
    {
      "Rank": 1,
      "Title": "Ultimate Guide to Professional Carpet Cleaning | Expert Tips 2026",
      "Url": "https://example-cleaning.com/carpet-cleaning-guide",
      "Snippet": "Learn everything about professional carpet cleaning. Our comprehensive guide covers steam cleaning, dry cleaning methods, stain removal techniques, and maintenance tips from industry experts.",
      "Domain": "example-cleaning.com",
      "Engine": "google",
      "Position": 1,
      "Features": ["featured_snippet", "site_links"]
    },
    {
      "Rank": 2,
      "Title": "Carpet Cleaning Services - Compare Local Professionals",
      "Url": "https://homeadvisor.com/carpet-cleaning",
      "Snippet": "Find top-rated carpet cleaning professionals in your area. Compare prices, read reviews, and book online. Average cost: $150-$300 for standard cleaning.",
      "Domain": "homeadvisor.com",
      "Engine": "google",
      "Position": 2,
      "Features": []
    },
    {
      "Rank": 3,
      "Title": "How Often Should You Clean Your Carpets? - Cleaning Institute",
      "Url": "https://cleaninginstitute.org/carpet-frequency",
      "Snippet": "Industry experts recommend professional carpet cleaning every 12-18 months. High-traffic areas may need cleaning every 6 months.",
      "Domain": "cleaninginstitute.org",
      "Engine": "duckduckgo",
      "Position": 1,
      "Features": []
    }
  ],
  "NestedSearches": [
    {
      "SourceUrl": "https://example-cleaning.com/carpet-cleaning-guide",
      "ExtractedKeywords": ["steam cleaning", "carpet stain removal", "deep cleaning"],
      "NestedResults": [
        {
          "Query": "steam cleaning carpets",
          "TopResult": {
            "Title": "Steam Cleaning vs Dry Cleaning: Which is Better?",
            "Url": "https://example.com/steam-vs-dry",
            "Snippet": "Compare the two most popular carpet cleaning methods..."
          }
        }
      ]
    }
  ]
}
```

---

## Cross-References

- [Overview](./00-overview.md)
- [Extract Presets](./02-extract-presets.md)
