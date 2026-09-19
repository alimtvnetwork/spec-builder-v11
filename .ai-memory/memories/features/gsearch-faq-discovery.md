# Memory: features/gsearch-faq-discovery
Updated: now
**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

GSearch FAQ Discovery (Phase 2) extracts FAQs from three sources: Google's People Also Ask (PAA) boxes, FAQPage JSON-LD schema, and AI Overview (SGE) summaries. PAA extraction supports recursive depth expansion (default: 2 levels). AI Overview extraction uses go-rod with stealth plugin and multiple fallback selectors. Questions are classified by type (what/how/why/where/when/who/is/can/does). Multi-engine answer enrichment fetches answers from Google/Bing/DuckDuckGo with best-answer selection based on confidence, length, structure, and source authority. Error codes: 7720-7739. Caching uses 7-day TTL for FAQs, 3-day TTL for AI Overview.
