# WP SEO Publish CLI: Content Publisher

**Version:** 2.1.0  
**Updated:** 2026-03-12  

---

## Overview

The Content Publisher orchestrates the complete workflow from SEO content generation via AI Bridge CLI to final publication on WordPress.

---

## Publishing Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Publishing Flow                               │
└─────────────────────────────────────────────────────────────────┘

   ┌─────────┐     ┌─────────────┐     ┌─────────────┐
   │ Request │────►│  Variable   │────►│  AI Bridge  │
   │ Input   │     │  Injection  │     │  SEO Gen    │
   └─────────┘     └─────────────┘     └──────┬──────┘
                                              │
                                              ▼
   ┌─────────┐     ┌─────────────┐     ┌─────────────┐
   │  Save   │◄────│  WordPress  │◄────│  Category/  │
   │  to DB  │     │  Publish    │     │  Tag Assign │
   └─────────┘     └─────────────┘     └─────────────┘
```

---

## Content Types

### 1. Category Publishing

```go
type CategoryPublishRequest struct {
    WebsiteId    string            
    Name         string            
    Slug         string            `json:",omitempty"`
    ParentId     int               `json:",omitempty"`
    Description  string            `json:",omitempty"`
    SeoKeywords  []string          `json:",omitempty"`
    UseAi        bool              
    AiPrompt     string            `json:",omitempty"`
    Variables    json.RawMessage   `json:",omitempty"`
}

type CategoryPublishResult struct {
    Id          int       
    Name        string    
    Slug        string    
    Description string    
    Url         string    
    ParentId    int       `json:",omitempty"`
    CreatedAt   time.Time 
}

func (s *ContentService) PublishCategory(req CategoryPublishRequest) apperror.Result[CategoryPublishResult] {
    // 1. Process variables
    processedDesc := s.varProcessor.Process(req.Description, req.Variables)
    
    // 2. Generate AI content if requested
    if req.UseAi && req.AiPrompt != "" {
        seoReq := SeoRequest{
            ContentType:  "category",
            Title:        req.Name,
            Keywords:     req.SeoKeywords,
            Variables:    req.Variables,
            OutputFormat: "html",
        }
        seoResult := s.aiBridge.GenerateSeo(seoReq)
        if seoResult.HasError() {
            return apperror.Fail[CategoryPublishResult](seoResult.AppError())
        }
        processedDesc = seoResult.Value().Content
    }
    
    // 3. Create in WordPress
    wpCat := Category{
        Name:        req.Name,
        Slug:        req.Slug,
        Description: processedDesc,
        Parent:      req.ParentId,
    }
    catResult := s.wpClient.CreateCategory(wpCat)
    if catResult.HasError() {
        return apperror.Fail[CategoryPublishResult](catResult.AppError())
    }
    created := catResult.Value()
    
    // 4. Save to local DB
    s.db.SavePublication(Publication{
        WebsiteId:   req.WebsiteId,
        ContentType: "category",
        RemoteId:    created.Id,
        Title:       created.Name,
        Slug:        created.Slug,
    })
    
    return apperror.Ok(CategoryPublishResult{
        Id:          created.Id,
        Name:        created.Name,
        Slug:        created.Slug,
        Description: created.Description,
    })
}
```

### 2. Post Publishing

```go
type PostPublishRequest struct {
    WebsiteId       string            
    Title           string            
    Content         string            `json:",omitempty"`
    Excerpt         string            `json:",omitempty"`
    Slug            string            `json:",omitempty"`
    Status          publishstatustype.Variant // → internal/enums/publishstatustype/
    Categories      []int             `json:",omitempty"`
    Tags            []int             `json:",omitempty"`
    FeaturedImage   string            `json:",omitempty"`
    
    // SEO Options
    SeoKeywords     []string          
    Areas           []string          `json:",omitempty"`
    UseAi           bool              
    AiPrompt        string            `json:",omitempty"`
    OutputFormat    outputformattype.Variant // → internal/enums/outputformattype/
    
    // AI Suggestions
    UseAiSuggestions bool             
    
    // Linking
    LinkDensity     *LinkDensityConfig `json:",omitempty"`
    InternalLinks   []string          `json:",omitempty"`
    
    // Variables
    Variables       json.RawMessage   `json:",omitempty"`
}

type PostPublishResult struct {
    Id              int       
    Title           string    
    Slug            string    
    Url             string    
    Content         string    
    Excerpt         string    
    Categories      []int     
    Tags            []int     
    SuggestedCats   []string  `json:",omitempty"`
    SuggestedTags   []string  `json:",omitempty"`
    InternalLinks   []Link    
    GeneratedSlugs  []Slug    `json:",omitempty"`
    PublishedAt     time.Time 
}

func (s *ContentService) PublishPost(req PostPublishRequest) apperror.Result[PostPublishResult] {
    var content string
    var suggestedCats, suggestedTags []string
    var internalLinks []Link
    var generatedSlugs []Slug
    
    // 1. Generate SEO content via AI Bridge
    if req.UseAi {
        seoReq := SeoRequest{
            ContentType:   "blog_post",
            Title:         req.Title,
            Keywords:      req.SeoKeywords,
            Areas:         req.Areas,
            Variables:     req.Variables,
            OutputFormat:  req.OutputFormat,
            LinkDensity:   *req.LinkDensity,
            InternalLinks: req.InternalLinks,
        }
        
        seoResult := s.aiBridge.GenerateSeo(seoReq)
        if seoResult.HasError() {
            return apperror.Fail[PostPublishResult](seoResult.AppError())
        }
        seoResp := seoResult.Value()
        
        content = seoResp.Content
        suggestedCats = seoResp.SuggestedCategories
        suggestedTags = seoResp.SuggestedTags
        internalLinks = seoResp.InternalLinks
        generatedSlugs = seoResp.GeneratedSlugs
    } else {
        content = s.varProcessor.Process(req.Content, req.Variables)
    }
    
    // 2. Handle AI category/tag suggestions
    categories := req.Categories
    tags := req.Tags
    
    if req.UseAiSuggestions {
        // Create categories that don't exist
        for _, catName := range suggestedCats {
            catResult := s.findOrCreateCategory(req.WebsiteId, catName)
            if catResult.IsSafe() {
                categories = append(categories, catResult.Value().Id)
            }
        }
        
        // Create tags that don't exist
        for _, tagName := range suggestedTags {
            tagResult := s.findOrCreateTag(req.WebsiteId, tagName)
            if tagResult.IsSafe() {
                tags = append(tags, tagResult.Value().Id)
            }
        }
    }
    
    // 3. Publish to WordPress
    wpReq := PostCreateRequest{
        Title:      req.Title,
        Content:    content,
        Excerpt:    req.Excerpt,
        Slug:       req.Slug,
        Status:     req.Status,
        Categories: unique(categories),
        Tags:       unique(tags),
    }
    
    postResult := s.wpClient.CreatePost(wpReq)
    if postResult.HasError() {
        return apperror.Fail[PostPublishResult](postResult.AppError())
    }
    created := postResult.Value()
    
    // 4. Save to local DB
    s.db.SavePublication(Publication{
        WebsiteId:     req.WebsiteId,
        ContentType:   "post",
        RemoteId:      created.Id,
        Title:         created.Title.Rendered,
        Slug:          created.Slug,
        Categories:    categories,
        Tags:          tags,
        InternalLinks: internalLinks,
    })
    
    return apperror.Ok(PostPublishResult{
        Id:             created.Id,
        Title:          created.Title.Rendered,
        Slug:           created.Slug,
        Url:            created.Link,
        Content:        created.Content.Rendered,
        Categories:     categories,
        Tags:           tags,
        SuggestedCats:  suggestedCats,
        SuggestedTags:  suggestedTags,
        InternalLinks:  internalLinks,
        GeneratedSlugs: generatedSlugs,
        PublishedAt:    time.Now(),
    })
}
```

### 3. Page Publishing

```go
type PagePublishRequest struct {
    WebsiteId       string            
    Title           string            
    Content         string            `json:",omitempty"`
    Slug            string            `json:",omitempty"`
    Status          publishstatustype.Variant // → internal/enums/publishstatustype/
    ParentId        int               `json:",omitempty"`
    Template        string            `json:",omitempty"`
    
    // SEO Options
    SeoKeywords     []string          
    Areas           []string          `json:",omitempty"`
    UseAi           bool              
    AiPrompt        string            `json:",omitempty"`
    OutputFormat    outputformattype.Variant // → internal/enums/outputformattype/
    
    // Linking
    LinkDensity     *LinkDensityConfig `json:",omitempty"`
    InternalLinks   []string          `json:",omitempty"`
    
    // Variables
    Variables       json.RawMessage   `json:",omitempty"`
}

func (s *ContentService) PublishPage(req PagePublishRequest) apperror.Result[PagePublishResult] {
    // Similar flow to PostPublish but for pages
    // ...
}
```

---

## Content Modification (Rewriting)

```go
type RewriteRequest struct {
    WebsiteId        string            
    PostId           int               
    ContentType      contenttype.Variant // → internal/enums/contenttype/
    Prompt           string            
    PreserveMetadata bool          
    Variables        json.RawMessage   `json:",omitempty"`
}

type RewriteResult struct {
    OriginalContent string    
    NewContent      string    
    UpdatedAt       time.Time 
    Diff            string    `json:",omitempty"`
}

func (s *ContentService) RewritePost(req RewriteRequest) apperror.Result[RewriteResult] {
    // 1. Fetch existing post from WordPress
    existingResult := s.wpClient.GetPost(req.PostId)
    if existingResult.HasError() {
        return apperror.Fail[RewriteResult](existingResult.AppError())
    }
    existingPost := existingResult.Value()
    
    originalContent := existingPost.Content.Raw
    
    // 2. Send to AI Bridge for rewriting
    seoResult := s.aiBridge.RewriteContent(RewriteContentRequest{
        OriginalContent: originalContent,
        Prompt:          req.Prompt,
    })
    if seoResult.HasError() {
        return apperror.Fail[RewriteResult](seoResult.AppError())
    }
    seoResp := seoResult.Value()
    
    // 3. Update in WordPress
    updateReq := PostCreateRequest{
        Title:   existingPost.Title.Raw,
        Content: seoResp.Content,
        Status:  existingPost.Status,
    }
    
    if req.PreserveMetadata {
        updateReq.Categories = existingPost.Categories
        updateReq.Tags = existingPost.Tags
    }
    
    updateResult := s.wpClient.UpdatePost(req.PostId, updateReq)
    if updateResult.HasError() {
        return apperror.Fail[RewriteResult](updateResult.AppError())
    }
    
    // 4. Track modification in local DB
    s.db.SaveModification(Modification{
        WebsiteId:       req.WebsiteId,
        ContentType:     req.ContentType,
        RemoteId:        req.PostId,
        OriginalContent: originalContent,
        NewContent:      seoResp.Content,
        Prompt:          req.Prompt,
        ModifiedAt:      time.Now(),
    })
    
    return apperror.Ok(RewriteResult{
        OriginalContent: originalContent,
        NewContent:      seoResp.Content,
        UpdatedAt:       time.Now(),
    })
}
```

---

## Batch Publishing

```go
type BatchPublishRequest struct {
    WebsiteId       string              
    ContentType     contenttype.Variant // → internal/enums/contenttype/
    Items           []BatchItem         
    CommonSettings  BatchCommonSettings 
}

type BatchItem struct {
    Title       string         
    Variables   json.RawMessage 
    Categories  []int          `json:",omitempty"`
    Tags        []int          `json:",omitempty"`
}

type BatchCommonSettings struct {
    SeoKeywords      []string           
    AiPrompt         string             
    OutputFormat     outputformattype.Variant   // → internal/enums/outputformattype/
    UseAiSuggestions bool               
    LinkDensity      *LinkDensityConfig 
    Status           publishstatustype.Variant  // → internal/enums/publishstatustype/
    DelaySeconds     int                
}

type BatchPublishResult struct {
    TotalItems    int                  
    Successful    int                  
    Failed        int                  
    Results       []BatchItemResult    
}

func (s *ContentService) BatchPublish(req BatchPublishRequest) apperror.Result[BatchPublishResult] {
    results := make([]BatchItemResult, 0, len(req.Items))
    successful, failed := 0, 0
    
    for i, item := range req.Items {
        // Delay between items (except first)
        if i > 0 && req.CommonSettings.DelaySeconds > 0 {
            time.Sleep(time.Duration(req.CommonSettings.DelaySeconds) * time.Second)
        }
        
        // Merge variables
        mergedVars := mergeVariables(req.CommonSettings.Variables, item.Variables)
        
        publishReq := PostPublishRequest{
            WebsiteId:        req.WebsiteId,
            Title:            item.Title,
            Categories:       item.Categories,
            Tags:             item.Tags,
            SeoKeywords:      req.CommonSettings.SeoKeywords,
            UseAi:            true,
            AiPrompt:         req.CommonSettings.AiPrompt,
            OutputFormat:     req.CommonSettings.OutputFormat,
            UseAiSuggestions: req.CommonSettings.UseAiSuggestions,
            LinkDensity:      req.CommonSettings.LinkDensity,
            Variables:        mergedVars,
            Status:           req.CommonSettings.Status,
        }
        
        postResult := s.PublishPost(publishReq)
        if postResult.HasError() {
            failed++
            results = append(results, BatchItemResult{
                Index:   i,
                Title:   item.Title,
                Success: false,
                Error:   postResult.AppError().Error(),
            })
        } else {
            successful++
            results = append(results, BatchItemResult{
                Index:     i,
                Title:     item.Title,
                Success:   true,
                PostId:    postResult.Value().Id,
                Url:       postResult.Value().Url,
            })
        }
    }
    
    return apperror.Ok(BatchPublishResult{
        TotalItems: len(req.Items),
        Successful: successful,
        Failed:     failed,
        Results:    results,
    })
}
```

---

## Link Density Configuration

```go
type LinkDensityConfig struct {
    Mode              linkdensitymodetype.Variant // → internal/enums/linkdensitymodetype/
    LinksPerParagraph int    `json:",omitempty"` // default: 3
    LinksPerSentence  int    `json:",omitempty"` // default: 2
    MaxNewSlugs       int    `json:",omitempty"` // default: 2
    SlugWordCount     int    `json:",omitempty"` // default: 4
    PreferExisting    bool   // use sitemap URLs first
}

// Default configuration from config.json
func DefaultLinkDensity() LinkDensityConfig {
    return LinkDensityConfig{
        Mode:              linkdensitymodetype.Paragraph,
        LinksPerParagraph: 3,
        LinksPerSentence:  2,
        MaxNewSlugs:       2,
        SlugWordCount:     4,
        PreferExisting:    true,
    }
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `01-architecture.md` |
| WordPress Connector | `02-wordpress-connector.md` |
| AI Bridge Client | `04-ai-bridge-client.md` |
| Variable System | `05-variable-system.md` |
| Enum Architecture | `12-enum-architecture.md` |
