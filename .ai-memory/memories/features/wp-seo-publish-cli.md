# Memory: features/wp-seo-publish-cli

**Updated:** 2026-02-09  
**Version:** 1.0.0  
**Status:** Active  
**Spec Location:** `02-spec/32-wp-seo-publish-cli/`

---

## Overview

WordPress SEO Publish CLI is a dedicated CLI tool for publishing SEO-optimized content to WordPress sites, delegating content generation to AI Bridge CLI.

---

## Key Features

- **WordPress Connection**: Application Password authentication, multi-site support
- **Content Publishing**: Categories, pages, posts, tags with AI-generated SEO content
- **AI Bridge Integration**: Delegates SEO writing, receives category/tag suggestions
- **Variable System**: CSV, JSON, YAML import with scope hierarchy (Global → Website → Content → Instance)
- **Internal Linking**: Sitemap-based RAG for link discovery, configurable link density
- **Content Modification**: Fetch and rewrite existing posts via AI
- **Automation**: Batch publishing with variable iteration

---

## Integration Points

| CLI | Purpose |
|-----|---------|
| AI Bridge CLI | SEO content generation, category/tag suggestions |
| GSearch CLI | Sitemap indexing for RAG |
| PowerShell | Deployment automation |

---

## Error Code Range

12000-12599 (Connection, Publishing, AI Bridge, Variables, Import/Export, Database)
