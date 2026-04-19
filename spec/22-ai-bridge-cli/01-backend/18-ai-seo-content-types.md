# AI Bridge CLI: AI SEO Content Types

**Version:** 5.0.0  
**Status:** Complete  
**Updated:** 2026-03-09  

---

## Overview

The **Content Types** specification defines the six primary SEO page types, output format options, project configuration, and internal/external linking strategies.

---

## Content Type Categories

### Primary Content Types (4)

| Type | Description | Key Features |
|------|-------------|--------------|
| **Category Description** | Product/service category pages | Title hierarchy, breadcrumb links, category-specific keywords |
| **Blog Post** | Article content with related entities | Related categories, subcategories, author bylines, publish dates |
| **Page** | Static content pages | About, contact, service pages with structured data |
| **Tag-Based Page** | Tag aggregation pages | Tag cloud, related content, cross-linking |

### Secondary Content Types (2+)

| Type | Description | Key Features |
|------|-------------|--------------|
| **Press Release** | News/announcement content | Date formatting, quote blocks, boilerplate |
| **Global Notification** | Site-wide announcements | Banner content, CTA buttons, urgency indicators |

---

## Content Type Schemas

### Category Description

```go
type CategoryDescription struct {
    Id              string
    Title           string
    DisplayHeader   string
    MetaDescription string
    Slug            string              // 3-4 words max
    ParentCategory  string              // optional
    Keywords        []string
    ServiceAreas    []string
    Content         CategoryContent
    InternalLinks   []InternalLink
    Schema          StructuredData      // JSON-LD
}

type CategoryContent struct {
    Introduction    string
    MainBody        []string    // Multiple paragraphs
    Features        []string    // Bullet points
    CallToAction    string
}
```

### Blog Post

```go
type BlogPost struct {
    Id                string
    Title             string
    DisplayHeader     string
    MetaDescription   string
    Slug              string
    Author            Author
    PublishDate       time.Time
    ModifiedDate      time.Time
    Keywords          []string
    RelatedCategory   string
    RelatedSubcategory string
    Tags              []string
    Content           BlogContent
    EmbeddedMedia     []MediaEmbed
    InternalLinks     []InternalLink
    ExternalLinks     []ExternalLink
    Schema            StructuredData
}

type BlogContent struct {
    Introduction    string
    Sections        []ContentSection
    Conclusion      string
    FAQs            []FAQ
}

type ContentSection struct {
    Heading     string      // H2/H3
    Body        []string    // Paragraphs
    ListItems   []string    // Optional bullets
}
```

### Page

```go
type Page struct {
    Id              string
    Title           string
    PageType        string          // about, contact, service, landing
    DisplayHeader   string
    MetaDescription string
    Slug            string
    Keywords        []string
    ServiceAreas    []string
    Content         PageContent
    InternalLinks   []InternalLink
    Schema          StructuredData
}
```

### Tag-Based Page

```go
type TagPage struct {
    Id              string
    TagName         string
    Title           string
    MetaDescription string
    Slug            string          // /tag/{tag-slug}
    RelatedTags     []string
    Content         TagContent
    LinkedPosts     []PostRef       // Posts with this tag
    InternalLinks   []InternalLink
}

type TagContent struct {
    Introduction     string
    TagDescription   string
    RelatedTopics    []string
}
```

### Press Release

```go
type PressRelease struct {
    Id              string
    Headline        string
    Subheadline     string
    ReleaseDate     time.Time
    Location        string          // City, State
    Dateline        string          // "NEW YORK, Feb 2, 2026"
    Content         PRContent
    Quotes          []Quote
    Boilerplate     string          // About company
    ContactInfo     ContactInfo
    Schema          StructuredData
}

type PRContent struct {
    LeadParagraph   string      // Who, what, when, where, why
    BodyParagraphs  []string
    CallToAction    string
}
```

---

## Output Formats

### Supported Formats

| Format | Extension | Use Case |
|--------|-----------|----------|
| **HTML** | `.html` | Full page with semantic markup, ready for web |
| **Markdown** | `.md` | For CMS import, GitHub, documentation |
| **Text** | `.txt` | Plain text for review, copy editing |

### Output Configuration

```go
type OutputConfig struct {
    Format          string      // html, markdown, text
    Destination     string      // stream, file, both
    FilePath        string      // Output directory
    IncludeMetadata bool        // Include frontmatter/meta tags
    MinifyHtml      bool        // Minify HTML output
    DownloadUrl     bool        // Generate download URL
}
```

### Output Examples

#### HTML Output

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Professional Cleaning Services in Melbourne CBD | CleanCo</title>
    <meta name="description" content="Expert cleaning services in Melbourne CBD...">
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "CleanCo Melbourne CBD",
        ...
    }
    </script>
</head>
<body>
    <article class="seo-content">
        <h1>Professional Cleaning Services in Melbourne CBD</h1>
        <div class="seo-container-para contrast">
            <!-- Generated content with internal links -->
        </div>
    </article>
</body>
</html>
```

#### Markdown Output

```markdown
---
title: "Professional Cleaning Services in Melbourne CBD"
description: "Expert cleaning services in Melbourne CBD..."
keywords: ["cleaning services", "Melbourne CBD", "house cleaning"]
author: "CleanCo Team"
date: 2026-02-02
category: "Services"
---

# Professional Cleaning Services in Melbourne CBD

Professional cleaning services have transformed how Melbourne CBD residents...

## Our Expert Team

With [15 years of combined experience](/about-us "Learn about CleanCo's expert team")...
```

---

## Slug Generation Rules

### Guidelines

1. **Maximum 3-4 words** per slug
2. **All lowercase** with hyphens
3. **Include service + area** when applicable
4. **Remove stop words** (the, and, or, in, of)

### Slug Generator

```go
type SlugGenerator struct {
    MaxWords    int         // Default: 4
    StopWords   []string
    Separator   string      // Default: "-"
}

func (g *SlugGenerator) Generate(title string, area string, service string) string {
    // Priority: service + area pattern
    if service != "" && area != "" {
        return g.normalize(service + " " + area)
    }
    
    // Fallback: title-based
    words := strings.Fields(strings.ToLower(title))
    filtered := g.removeStopWords(words)
    
    if len(filtered) > g.MaxWords {
        filtered = filtered[:g.MaxWords]
    }
    
    return strings.Join(filtered, g.Separator)
}

// Example outputs:
// "cleaning-services-melbourne"
// "house-cleaning-cbd"
// "commercial-cleaning-sydney"
```

---

## Internal Linking Strategy

### Link Structure

```go
type InternalLink struct {
    DisplayText     string
    URL             string      // SEO-friendly slug
    TitleAttribute  string      // Must differ from display
    Context         string      // area, company, service
}

type ExternalLink struct {
    DisplayText     string
    URL             string
    TitleAttribute  string
    NoFollow        bool        // Add rel="nofollow"
    NewTab          bool        // Add target="_blank"
}
```

### Link Generation Rules

```go
func generateInternalLinks(content *SeoContent) []InternalLink {
    var links []InternalLink
    
    // Link all service areas
    for _, area := range content.ServiceAreas {
        links = append(links, InternalLink{
            DisplayText:    area,
            Url:            fmt.Sprintf("/%s-%s", slugify(content.ServiceName), slugify(area)),
            TitleAttribute: fmt.Sprintf("Expert %s services in %s - trusted by local residents", content.ServiceName, area),
            Context:        "area",
        })
    }
    
    // Link company mentions with glorifying adjectives
    links = append(links, InternalLink{
        DisplayText:    content.CompanyName,
        URL:            "/about-us",
        TitleAttribute: fmt.Sprintf("Award-winning %s - Melbourne's most trusted service provider", content.CompanyName),
        Context:        "company",
    })
    
    // Link service mentions
    for _, service := range content.RelatedServices {
        links = append(links, InternalLink{
            DisplayText:    service,
            URL:            fmt.Sprintf("/%s", slugify(service)),
            TitleAttribute: fmt.Sprintf("Professional %s with 15+ years experience", service),
            Context:        "service",
        })
    }
    
    return links
}
```

---

## Media Embedding

### Video Embed Integration

```go
type MediaEmbed struct {
    Platform    string      // youtube, vimeo, reddit
    URL         string
    EmbedCode   string
    Title       string
    Description string
    Relevance   float64     // 0.0-1.0 from GSearch
}

// Fetched via GSearch platform-specific search
type VideoSearchResult struct {
    Platform    string
    VideoId     string
    Title       string
    Channel     string
    ViewCount   int64
    PublishedAt string
    Relevance   float64
}
```

### Embed HTML Generation

```go
func generateYouTubeEmbed(videoId string, title string) string {
    return fmt.Sprintf(`
<div class="video-embed">
    <iframe 
        width="560" 
        height="315" 
        src="https://www.youtube.com/embed/%s" 
        title="%s"
        frameborder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen>
    </iframe>
</div>`, videoId, title)
}
```

---

## Project Configuration Schema

### Project Settings

```go
type ProjectSeoConfig struct {
    AppName             string
    BusinessName        string
    BusinessType        string
    BaseUrl             string
    Description         string              // ~2000 words
    Tone                string              // professional, casual, authoritative
    ServiceAreas        []string
    PrimaryKeywords     []string
    SecondaryKeywords   []string
    RankingGoals        []string
    ValidationRules     ValidationConfig
    ExistingUrls        []string            // For internal linking
    ContentPreferences  ContentPrefs
}

type ContentPrefs struct {
    PreferredLinkDensity    int         // Links per sentence
    KeywordRepetition       int         // Min keyword mentions
    AreaMentions            int         // Area mentions per section
    IncludeStatistics       bool        // Include % stats
    VideoEmbedding          bool        // Auto-embed videos
    ExternalLinkRatio       float64     // Max external/internal
}
```

---

## Database Schema

### Content Type Tables

```sql
-- ============================================
-- Table: ContentTypes (type definitions)
-- ============================================
CREATE TABLE ContentTypes (
    Id TEXT PRIMARY KEY,
    Name TEXT UNIQUE NOT NULL,
    Category TEXT NOT NULL,              -- primary, secondary
    SchemaTemplate TEXT,                 -- JSON: field schema
    DefaultPreset TEXT,
    Enabled BOOLEAN DEFAULT TRUE,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: GeneratedContent (output tracking)
-- ============================================
CREATE TABLE GeneratedContent (
    Id TEXT PRIMARY KEY,
    AppName TEXT NOT NULL,
    ContentType TEXT NOT NULL,
    Title TEXT NOT NULL,
    Slug TEXT NOT NULL,
    OutputFormat TEXT NOT NULL,          -- html, markdown, text
    FilePath TEXT,
    DownloadUrl TEXT,
    Variables TEXT,                      -- JSON: used variables
    ValidationScore REAL,                -- 0.0-100.0
    GeneratedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ContentType) REFERENCES ContentTypes(Id)
);

CREATE INDEX IdxGenContentApp ON GeneratedContent(AppName);
CREATE INDEX IdxGenContentType ON GeneratedContent(ContentType);
```

---

## API Endpoints

### Content Type Management

```
GET /api/v1/seo/content-types
  Returns: List of all content types

GET /api/v1/seo/content-types/:type
  Returns: Content type schema and defaults

POST /api/v1/seo/generate/:type
  Body: { "AppName": "...", "Variables": {...}, "OutputFormat": "html" }
  Returns: Generated content or job ID for async

GET /api/v1/seo/output/:appName
  Returns: List of generated content for project

GET /api/v1/seo/output/:appName/:contentId/download
  Returns: File download URL (valid for 1 hour)
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Core Guidelines | `./17-ai-seo-core-guidelines.md` |
| Variable System | `./19-ai-seo-variable-system.md` |
| AI SEO Generate | `./13-ai-seo-generate.md` |
| GSearch Integration | `../../20-gsearch-cli/06-platform-search.md` |
