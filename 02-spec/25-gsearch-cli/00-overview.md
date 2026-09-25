# GSearch CLI

**Version:** 3.1.0  
**Status:** Complete  
**Updated:** 2026-03-30  
**AI Confidence:** Production-Ready  
**Ambiguity:** Low

---

## Keywords

`gsearch` · `golang` · `cli` · `web-search` · `multi-engine` · `html-parser` · `rag-export` · `caching` · `nested-search` · `trend-analysis`

---

## Scoring

| Metric | Value |
|--------|-------|
| AI Confidence | Production-Ready |
| Ambiguity | Low |
| Health Score | 100/100 (A+) |

---

## Summary

Standalone Golang CLI tool for multi-engine web searching with concurrent execution, intelligent method switching, anti-blocking strategies, nested search capabilities, caching, and RAG memory generation.

---

## Folder Structure

```
25-gsearch-cli/
├── 00-overview.md                              # This file
├── 01-backend/                                 # Backend specifications
│   ├── 00-overview.md                          # Backend overview
│   ├── 01-cli-framework.md                     # Command structure, Cobra
│   ├── 02-configuration.md                     # Config file management
│   ├── 03-database-schema.md                   # SQLite tables and ORM
│   ├── 04-html-parser.md                       # Direct HTML scraping
│   ├── 05-google-api.md                        # Search Console API
│   ├── 06-duckduckgo.md                        # DDG search integration
│   ├── 07-bing-search.md                       # Bing API integration
│   ├── 08-method-switching.md                  # Intelligent fallback logic
│   ├── 09-nested-search.md                     # Recursive keyword extraction
│   ├── 10-caching-system.md                    # Cache management
│   ├── 11-rag-export.md                        # Memory format generation
│   ├── 12-testing-strategy.md                  # Integration tests
│   ├── 13-implementation-guide.md              # Build setup, dependencies
│   ├── 14-remediation-plan.md                  # Quality tracking
│   ├── 15-error-codes.md                       # 92 structured error codes
│   ├── 16-observability.md                     # Metrics, health, tracing
│   ├── 17-full-site-crawler.md                 # Sitemap parsing, vector DB
│   ├── 18-authority-credibility-scoring.md     # Domain authority scoring
│   ├── 19-trend-analysis-engine.md             # Composite scoring
│   ├── 20-trend-analyzer-implementation.md     # Golang implementation
│   ├── 21-settings-service.md                  # Settings service
│   ├── 22-database-architecture.md             # Split DB implementation
│   ├── **23-platform-search.md**               # **YouTube/Reddit/Vimeo search**
│   └── 98-remediation-summary.md               # Remediation summary
├── 02-frontend/                                # Frontend specifications
│   ├── 00-overview.md                          # Frontend overview
│   ├── 01-settings-ui-page.md                  # Settings UI
│   ├── 02-frontend-architecture.md             # React architecture
│   └── 03-implementation-checklist.md          # Implementation checklist
├── 03-deploy/                                  # Deployment specifications
│   ├── 00-overview.md                          # Deploy overview
│   └── 01-deployment-guide.md                  # Production deployment
├── configs/                                    # Environment configs
└── 99-consistency-report.md                    # Consistency verification
```

---

## User Stories

- As a user, I want to search multiple keywords concurrently
- As a user, I want to use different search engines (Google, DuckDuckGo, Bing)
- As a user, I want search results saved to a database for later retrieval
- As a user, I want the system to automatically switch methods when blocked
- As a user, I want cached results to avoid redundant searches
- As a user, I want to generate RAG memory from search results
- As a user, I want nested searches based on page content

---

## CLI Commands

```bash
# Basic search
gsearch search "keyword1,keyword2,keyword3"

# With options
gsearch search "AI tools" \
  --engine google,duckduckgo \
  --output json \
  --save-db \
  --depth 2 \
  --delay 2000

# Nested search
gsearch search "machine learning" --nested --max-depth 3

# RAG export
gsearch rag --format json --output ./rag-memory.json

# Trend analysis
gsearch trends analyze --topic "react vs vue"

# Daemon mode
gsearch daemon start --port 8088
```

---

## Error Code Range

GSearch CLI uses error codes **7000-7999**.

| Range | Category |
|-------|----------|
| 7000-7099 | General/Startup |
| 7100-7199 | Search engine errors |
| 7200-7299 | Parser errors |
| 7300-7399 | Database errors |
| 7400-7499 | Cache errors |
| 7500-7599 | Crawling errors |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Split DB Architecture | `../05-split-db-architecture/00-overview.md` |
| Seedable Config Architecture | `../06-seedable-config-architecture/00-overview.md` |
| Shared CLI Frontend | `../33-shared-cli-frontend/00-overview.md` |
| PowerShell Integration | `../11-powershell-integration/00-overview.md` |
| Error Resolution | `../03-error-manage/01-error-resolution/00-overview.md` |
| External Tools Reference | `../21-app/spec-management-software/15-external-tools/01-gsearch-reference.md` |
