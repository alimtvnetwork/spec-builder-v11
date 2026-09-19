# GSearch CLI: Backend Specifications

**Version:** 3.1.0  
**Updated:** 2026-03-30  
**AI Confidence:** High  
**Ambiguity:** None

---


## Keywords

`gsearch`, `cli`, `backend`

---

## Scoring

| Criterion | Status |
|-----------|--------|
| `00-overview.md` present | ✅ |
| AI Confidence assigned | ✅ |
| Ambiguity assigned | ✅ |
| Keywords present | ✅ |
| Scoring table present | ✅ |


## Overview

This folder contains all backend specifications for GSearch CLI.

---

## Files

| File | Description |
|------|-------------|
| 01-cli-framework.md | CLI command structure (Cobra) |
| 02-configuration.md | Configuration system |
| 03-database-schema.md | SQLite schema (GORM) |
| 04-html-parser.md | HTML parsing |
| 05-google-api.md | Google Search API |
| 06-duckduckgo.md | DuckDuckGo integration |
| 07-bing-search.md | Bing Search API |
| 08-method-switching.md | Search method switching |
| 09-nested-search.md | Nested search |
| 10-caching-system.md | Cache management |
| 11-rag-export.md | RAG export |
| 12-testing-strategy.md | Testing approach |
| 13-implementation-guide.md | Implementation guide |
| 14-remediation-plan.md | Remediation |
| 15-error-codes.md | Error codes (7xxx) |
| 16-observability.md | Monitoring |
| 17-full-site-crawler.md | Site crawler |
| 18-authority-credibility-scoring.md | Authority scoring |
| 19-trend-analysis-engine.md | Trend analysis |
| 20-trend-analyzer-implementation.md | Trend implementation |
| 21-settings-service.md | Settings service |
| **22-database-architecture.md** | **Split DB + Reset API** |
| **61-movie-search.md** | **Movie/TV search with IMDB/TMDB** |
| **40-bi-suite-summary.md** | **BI Suite Summary (All Phases)** |
| **41-business-intelligence-plan.md** | **Business Intelligence 8-phase plan** |
| **42-multi-engine-search.md** | **Multi-engine search (Phase 1)** |
| **43-faq-discovery-ai-overview.md** | **FAQ Discovery & AI Overview (Phase 2)** |
| **44-serp-position-tracking.md** | **SERP Position Tracking (Phase 3)** |
| **45-contact-extraction.md** | **Contact Extraction (Phase 4)** |
| **46-google-maps-search.md** | **Google Maps Search (Phase 5)** |
| **47-response-formatting-caching.md** | **Response Formatting & Caching (Phase 6)** |
| **48-unified-rest-api.md** | **Unified REST API (Phase 7)** |
| **49-testing-ui.md** | **React Testing UI (Phase 8)** |
| **50-bi-error-codes.md** | **BI Suite Error Codes (7700-7839)** |
| **51-bi-validation-checklist.md** | **BI Suite Validation Checklist** |
| **52-bi-implementation-guide.md** | **BI Suite Implementation Guide** |
| **53-sge-selector-tests.md** | **SGE/PAA Selector Validation Tests** |
| **openapi-bi-suite.yaml** | **Complete OpenAPI 3.1 Specification** |
| **63-captcha-handling.md** | **CAPTCHA detection, solver routing (2Captcha/CapSolver), token injection** |
| **64-stealth-scraping.md** | **Browser fingerprint evasion, uTLS/JA3 rotation, go-rod automation** |
| **65-proxy-acquisition.md** | **Proxy pool management (BrightData/Oxylabs/SmartProxy), auto-replenishment, cost tracking** |
| 99-acceptance-criteria.md | Acceptance criteria (GIVEN/WHEN/THEN) |
| 98-remediation-summary.md | Remediation summary |

---

## Acceptance Criteria Index

All acceptance criteria are in `99-acceptance-criteria.md` (v1.4.0).

| ID | Spec | Area | Error Codes |
|----|------|------|-------------|
| HP-01–03 | 04-html-parser.md | Multi-engine parsing, selector registry, performance | — |
| GA-01–02 | 05-google-api.md | OAuth2 tokens, quota handling | — |
| DD-01 | 06-duckduckgo.md | HTML-based search | — |
| BS-01 | 07-bing-search.md | Bing HTML parsing | — |
| MS-01 | 08-method-switching.md | Weighted engine selection | — |
| NS-01–02 | 09-nested-search.md | Keyword extraction, content fetching | — |
| CS-01–02 | 10-caching-system.md | Cache keys, cache hit/miss | — |
| RE-01–02 | 11-rag-export.md | Text chunking, export format | — |
| FC-01 | 17-full-site-crawler.md | Site crawling, robots.txt | — |
| AC-01 | 18-authority-credibility-scoring.md | Score calculation | — |
| TA-01 | 19-trend-analysis-engine.md | Trend detection | — |
| GS-SS-01 | 21-settings-service.md | Settings CRUD | — |
| GS-DA-01 | 22-database-architecture.md | Schema migration | — |
| GS-RA-01 | 24-reset-api.md | GSearch-specific reset | 7080–7086 |
| BI-01–03 | 40-52 (BI Suite) | SERP tracking, contact extraction, Maps | 7700–7839 |
| GS-SS-02 | 57-scheduled-search.md | Scheduled execution | — |
| CH-01–05 | 63-captcha-handling.md | Detection, solver routing, token injection, cookie replay | 5090–5099 |
| ST-01–07 | 64-stealth-scraping.md | Fingerprint evasion, TLS rotation, browser anti-detection | 5200–5224 |
| PA-01–05 | 65-proxy-acquisition.md | Pool init, domain routing, replenishment, budget, health | 5300–5341 |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Overview | `../00-overview.md` |
| Split DB Architecture | `02-spec/06-split-db-architecture/00-overview.md` |
| Reset API Standard | `02-spec/06-split-db-architecture/02-reset-api-standard.md` |
| **DBOperation Wrapper** | `02-spec/11-spec-management-software/13-shared-packages/08-pkg-database-operations.md` |
| **ORM-Only Policy** | `.ai-memory/memories/standards/orm-only-policy.md` |
| Frontend | `../02-frontend/` |
| Deploy | `../03-deploy/` |
