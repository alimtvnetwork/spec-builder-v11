# Memory: features/ai-seo-generate

**Updated:** 2026-02-02  
**Version:** 1.0.0  
**Spec Location:** `02-spec/22-ai-bridge-cli/01-backend/13-ai-seo-generate.md`

---

## Overview

AI SEO Generate module enables automated SEO content generation with industry-specific presets and comprehensive EEAT (Experience, Expertise, Authority, Trustworthiness) guidelines.

---

## Key Specifications

| Spec File | Description |
|-----------|-------------|
| 13-ai-seo-generate.md | Core module, presets, file processing |
| 17-ai-seo-core-guidelines.md | 19 EEAT writing rules |
| 18-ai-seo-content-types.md | 6 content types + output formats |
| 19-ai-seo-variable-system.md | CSV/JSON/YAML variable injection |
| 20-wordpress-integration-idea.md | WordPress publishing (idea) |

---

## 19 Core Guidelines Summary

1. Sentence variety (no repeated starters)
2. 40%+ transition words
3. Coherence and logical flow
4. Keywords 8+ times naturally
5. SEO expert perspective
6. Area/location 3-4 mentions per section
7. Preserve display text, improve links
8. Max 18 words per sentence
9. EEAT with experience indicators (5-15 years)
10. Title attributes differ from display text
11. Max 180 words per paragraph
12. Link all areas, company names, services
13. Humanized writing (no hyphens)
14. 2-3 links per sentence
15. No `<p>` inside `seo-container-para contrast`
16. Statistical references (2.51%-2.97%, 2 decimals)
17. Trust metrics (1-5% monthly improvements)
18. Focus title pattern with area injection
19. External links: `rel="nofollow" target="_blank"`

---

## Content Types

| Type | Category |
|------|----------|
| Category Description | Primary |
| Blog Post | Primary |
| Page | Primary |
| Tag-Based Page | Primary |
| Press Release | Secondary |
| Global Notification | Secondary |

---

## Output Formats

- HTML (full page with semantic markup)
- Markdown (for CMS import)
- Text (plain for review)
- File system write with download URL

---

## Variable System

- **Sources:** CSV, JSON, YAML
- **Scopes:** Global → App → Content Type → Instance
- **Syntax:** `{{Company.Name}}`, `{{Areas[0].Name}}`
- **UI:** Dynamic variable discovery from uploaded files

---

## GSearch Integration

Platform-specific search for embedding:
- YouTube (video embeds)
- Reddit (discussion references)
- Vimeo, Twitter/X, GitHub

---

## WordPress Integration (Idea)

Top-level concept for direct publishing:
- Auto-create categories, posts, pages
- Sync tags and media
- Handle category hierarchy
