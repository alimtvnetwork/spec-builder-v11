# Shared Preset Data — Infrastructure Presets

**Version:** 1.0.0  
**Last Updated:** 2026-03-20

---

## Overview

Mock infrastructure presets for proxy pools, API key quota status, and RAG chunk data. These presets enable testing of resource management, quota tracking, and vector search without live infrastructure.

---

## Proxy Pool Schema

```json
{
  "PresetId": "string",
  "Pools": [
    {
      "Name": "string",
      "Type": "socks5 | http",
      "Weight": "0-1",
      "TargetSites": ["string"],
      "Proxies": [
        {
          "Url": "string",
          "Weight": "0-1",
          "Region": "string",
          "Disabled": "boolean",
          "FailureCount": "number"
        }
      ]
    }
  ]
}
```

### Available Proxy Presets

| Preset ID | Pools | Total Proxies | Disabled |
|-----------|-------|--------------|----------|
| `mock-proxy-pool` | 2 (residential + datacenter) | 5 | 1 |

---

## API Key Pool Schema

```json
{
  "PresetId": "string",
  "Pools": [
    {
      "Source": "openpagerank | moz | ahrefs",
      "TotalKeys": "number",
      "ActiveKeys": "number",
      "TotalQuota": "number",
      "UsedQuota": "number",
      "KeyStatuses": [
        {
          "Label": "string",
          "UsedQuota": "number",
          "TotalQuota": "number",
          "Disabled": "boolean",
          "Reason": "string (optional)"
        }
      ]
    }
  ]
}
```

### Available Key Pool Presets

| Preset ID | Sources | Total Keys | Exhausted |
|-----------|---------|-----------|-----------|
| `mock-key-pool-status` | openpagerank, moz | 5 | 1 |

---

## RAG Chunk Data

| Preset ID | Description |
|-----------|-------------|
| `sample-chunks` | Pre-chunked article content for vector search testing |
| `embeddings-cache` | Cached embedding vectors for similarity search testing |

### Chunk Schema

```json
{
  "ChunkId": "string",
  "SourceUrl": "string",
  "Content": "string",
  "TokenCount": "number",
  "Embedding": [0.0],
  "Metadata": {
    "HeadingPath": "string",
    "Position": "number",
    "TotalChunks": "number"
  }
}
```

---

## Mock API Response Fixtures

| Preset ID | Service | Description |
|-----------|---------|-------------|
| `mock-openpagerank-responses` | OpenPageRank | Domain authority lookup responses |
| `mock-moz-responses` | Moz | Domain + page authority responses |

---

## Cross-References

- [Company Presets](./03-company-presets.md)
- [Usage Guide](./05-usage-guide.md)
