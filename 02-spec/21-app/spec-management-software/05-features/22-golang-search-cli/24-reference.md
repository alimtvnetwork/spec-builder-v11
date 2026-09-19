# GSearch CLI - External Specification Reference


**Last Updated:** 2026-03-20  

> **Status:** Extracted to standalone spec  
> **Location:** `02-spec/25-gsearch-cli/`  
> **Version:** 3.0.0

---

## Specification Location

This tool has been extracted to a standalone specification for independent development and AI training.

**Full Spec:** [`02-spec/25-gsearch-cli/`](../../../25-gsearch-cli/)

---

## Quick Reference

| Aspect | Value |
|--------|-------|
| Error Range | 5090-5341 (Anti-Bot), 7000-7999 (Core) |
| Language | Golang |
| Database | SQLite (FTS5 + VSS) |
| CLI Framework | Cobra |

---

## Core Capabilities

| Feature | Description |
|---------|-------------|
| Full-text Search | FTS5-based text search |
| Semantic Search | Vector similarity via sqlite-vss |
| Hybrid Scoring | Combined FTS5 + VSS results |
| Full Site Crawler | URL ingestion with SSRF protection |
| Trend Analysis | Composite scoring with multiple collectors |
| CAPTCHA Handling | Detection taxonomy, solver routing (2Captcha/CapSolver), token injection |
| Stealth Scraping | Browser fingerprint evasion, uTLS/JA3 rotation, go-rod automation |
| Proxy Acquisition | Multi-vendor proxy pool (BrightData/Oxylabs/SmartProxy), auto-replenishment, cost tracking |

---

## Usage in Spec Management Software

GSearch CLI provides:
- Search indexing for specification content
- RAG memory generation for AI context
- Trend analysis for technology adoption metrics
- Full-site crawling for external documentation

The spec-management-software integrates with GSearch via:
1. CLI invocation for batch indexing
2. REST API for real-time queries (daemon mode)
3. Shared SQLite database for result storage

---

*Reference updated 2026-03-05 — added anti-bot capabilities and error range 5090-5341*
