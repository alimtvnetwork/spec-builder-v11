# AI Bridge CLI: WordPress Integration (Top-Level Idea)

**Version:** 5.0.0  
**Status:** Idea  
**Updated:** 2026-03-09  

---

## Overview

**Top-level concept** for a dedicated WordPress CLI that connects with AI Bridge to programmatically publish generated SEO assets (categories, blog posts, pages, and tags) directly to WordPress sites.

---

## Vision

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      WORDPRESS INTEGRATION VISION                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   AI Bridge CLI                       WordPress CLI                          │
│   ┌─────────────┐                    ┌─────────────┐                        │
│   │ AI SEO      │ ──── Generated ───▶│ WP Publish  │ ────▶ WordPress Site   │
│   │ Generate    │      Content        │ Module      │                        │
│   └─────────────┘                    └─────────────┘                        │
│                                            │                                 │
│                                            ▼                                 │
│                                      Auto-create:                           │
│                                      • Categories                           │
│                                      • Blog Posts                           │
│                                      • Pages                                │
│                                      • Tags                                 │
│                                      • Media (images)                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Capabilities (Proposed)

### Content Publishing

| Feature | Description |
|---------|-------------|
| **Category Creation** | Auto-create WordPress categories from SEO content hierarchy |
| **Blog Post Publishing** | Push generated blog posts with proper formatting |
| **Page Publishing** | Create static pages (about, contact, service pages) |
| **Tag Management** | Create and assign tags from SEO keywords |
| **Media Upload** | Upload embedded images to WordPress media library |
| **Schedule Publishing** | Queue posts for scheduled publication |

### Synchronization

| Feature | Description |
|---------|-------------|
| **Slug Matching** | Match SEO slugs to WordPress permalinks |
| **Content Updates** | Detect and update existing content |
| **Category Mapping** | Map AI SEO categories to WordPress taxonomies |
| **Conflict Resolution** | Handle duplicate slugs and content conflicts |

---

## Proposed CLI Commands

```bash
# Connect to WordPress site
wp-bridge connect https://example.com \
  --username admin \
  --app-password "xxxx xxxx xxxx xxxx"

# Publish single post
wp-bridge publish post ./output/blog-cleaning-tips.html \
  --category "Cleaning Tips" \
  --tags "cleaning,tips,home" \
  --status draft

# Bulk publish from AI SEO batch
wp-bridge publish batch ./output/001-batch-abc/ \
  --content-type blog-post \
  --auto-categories \
  --auto-tags

# Create categories from SEO structure
wp-bridge categories sync ./seo-structure.json \
  --create-missing \
  --hierarchical

# Check site status
wp-bridge status
```

---

## Known Challenges

### Category Creation Problem

WordPress categories require:
1. **Parent category exists** before child can be created
2. **Slug uniqueness** across all categories
3. **Term hierarchy** management

**Proposed Solution:**
- Pre-analyze category structure before publishing
- Create categories in hierarchical order (root → children)
- Cache category IDs for efficient lookups

### Content Mapping

| SEO Content | WordPress Entity |
|-------------|------------------|
| Category Description | Category with description |
| Blog Post | Post with category/tag assignment |
| Page | Static page |
| Tag-Based Page | Custom taxonomy or tag archive |
| Press Release | Post with "Press Release" category |

---

## Integration Points

### With AI Bridge CLI

```go
// Proposed interface
type WordPressPublisher interface {
    Connect(config *WPConfig) *appfault.AppError
    PublishPost(content *BlogPost) appfault.Result[*WPPost]
    CreateCategory(name string, parent string) appfault.Result[*WPCategory]
    CreatePage(content *Page) appfault.Result[*WPPage]
    UploadMedia(path string) appfault.Result[*WPMedia]
    SyncCategories(structure *CategoryStructure) *appfault.AppError
}
```

### With GSearch

- Use GSearch to fetch existing WordPress content for duplicate detection
- Cross-reference published URLs for internal linking

---

## Technical Requirements (TBD)

1. **WordPress REST API v2** authentication
2. **Application Passwords** or OAuth support
3. **Rate limiting** for bulk operations
4. **Rollback capability** for failed publishes
5. **Dry-run mode** for testing

---

## Future Expansion

- **Multi-site support** (WordPress Multisite)
- **Custom post types** (WooCommerce products, portfolio items)
- **ACF/Custom fields** population
- **Yoast/RankMath** SEO meta synchronization
- **Featured image** generation and upload
- **Revision management**

---

## Status

**This is a top-level idea document.** No implementation has begun. This serves as a placeholder for future specification development.

---

## Cross-References

| Reference | Location |
|-----------|----------|
| AI SEO Generate | `./13-ai-seo-generate.md` |
| Content Types | `./18-ai-seo-content-types.md` |
| Variable System | `./19-ai-seo-variable-system.md` |
