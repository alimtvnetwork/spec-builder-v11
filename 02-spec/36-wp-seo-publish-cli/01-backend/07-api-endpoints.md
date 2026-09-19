# WP SEO Publish CLI: API Endpoints

**Version:** 2.0.0  
**Updated:** 2026-03-09  

---

## Overview

The WP SEO Publish CLI exposes a RESTful API with WebSocket support for real-time operations.

---

## Base Configuration

- **Default Port:** 8085
- **Base Path:** `/api/v1`
- **Content-Type:** `application/json`
- **WebSocket Path:** `/ws`

---

## Endpoint Categories

| Category | Count | Prefix |
|----------|-------|--------|
| Connection | 6 | `/connections` |
| Content | 12 | `/content` |
| Categories | 5 | `/categories` |
| Variables | 8 | `/variables` |
| Automation | 6 | `/automation` |
| Sitemap | 4 | `/sitemap` |
| Import/Export | 4 | `/data` |
| System | 3 | `/system` |
| **Total** | **48** | |

---

## Connection Endpoints

### Connect to WordPress
```
POST /api/v1/connections
```

**Request:**
```json
{
  "SiteUrl": "https://example.com",
  "Username": "admin",
  "ApplicationPass": "xxxx xxxx xxxx xxxx",
  "Nickname": "My Blog"
}
```

**Response:**
```json
{
  "Success": true,
  "Website": {
    "Id": "ws-abc123",
    "Slug": "example-com",
    "SiteUrl": "https://example.com",
    "SiteTitle": "Example Blog",
    "Connected": true
  },
  "Categories": [...],
  "Tags": [...]
}
```

### List Connections
```
GET /api/v1/connections
```

### Get Connection
```
GET /api/v1/connections/{websiteId}
```

### Validate Connection
```
POST /api/v1/connections/{websiteId}/validate
```

### Disconnect
```
DELETE /api/v1/connections/{websiteId}
```

### Sync WordPress Data
```
POST /api/v1/connections/{websiteId}/sync
```

---

## Content Endpoints

### Publish Post
```
POST /api/v1/content/{websiteId}/posts
```

**Request:**
```json
{
  "Title": "Best Cleaning Services in Melbourne",
  "SeoKeywords": ["cleaning services", "melbourne cleaning"],
  "Areas": ["Melbourne CBD", "South Melbourne"],
  "Categories": [5, 12],
  "Tags": [3, 7],
  "UseAi": true,
  "AiPrompt": "Write about professional cleaning services",
  "OutputFormat": "html",
  "UseAiSuggestions": true,
  "LinkDensity": {
    "Mode": "paragraph",
    "LinksPerParagraph": 3
  },
  "InternalLinks": [
    "https://example.com/services",
    "https://example.com/about"
  ],
  "Variables": {
    "Company": "CleanPro",
    "Experience": 15
  },
  "Status": "publish"
}
```

**Response:**
```json
{
  "Id": 1234,
  "Title": "Best Cleaning Services in Melbourne",
  "Slug": "best-cleaning-services-melbourne",
  "Url": "https://example.com/best-cleaning-services-melbourne/",
  "Categories": [5, 12, 18],
  "Tags": [3, 7, 22],
  "SuggestedCategories": ["Professional Services", "Melbourne"],
  "SuggestedTags": ["cleaning", "house cleaning"],
  "InternalLinks": [...],
  "GeneratedSlugs": [...],
  "PublishedAt": "2026-02-02T10:30:00Z"
}
```

### Publish Page
```
POST /api/v1/content/{websiteId}/pages
```

### Publish Category
```
POST /api/v1/content/{websiteId}/categories
```

### Update Post
```
PUT /api/v1/content/{websiteId}/posts/{postId}
```

### Rewrite Post
```
POST /api/v1/content/{websiteId}/posts/{postId}/rewrite
```

**Request:**
```json
{
  "Prompt": "Rewrite with more focus on eco-friendly practices",
  "PreserveMetadata": true,
  "Variables": {}
}
```

### Fetch Post for Editing
```
GET /api/v1/content/{websiteId}/posts/{postId}
```

### Batch Publish
```
POST /api/v1/content/{websiteId}/batch
```

**Request:**
```json
{
  "ContentType": "post",
  "Items": [
    {"Title": "Post 1", "Variables": {"Area": "Melbourne"}},
    {"Title": "Post 2", "Variables": {"Area": "Sydney"}}
  ],
  "CommonSettings": {
    "SeoKeywords": ["cleaning"],
    "AiPrompt": "Write about cleaning in {{area}}",
    "OutputFormat": "html",
    "DelaySeconds": 5
  }
}
```

### List Publications
```
GET /api/v1/content/{websiteId}/publications
```

### Get Publication Details
```
GET /api/v1/content/{websiteId}/publications/{publicationId}
```

### Delete Publication Record
```
DELETE /api/v1/content/{websiteId}/publications/{publicationId}
```

---

## Category Endpoints

### List Categories (from WordPress)
```
GET /api/v1/categories/{websiteId}
```

### Create Category
```
POST /api/v1/categories/{websiteId}
```

### Update Category
```
PUT /api/v1/categories/{websiteId}/{categoryId}
```

### Sync Categories
```
POST /api/v1/categories/{websiteId}/sync
```

### Suggest Categories (via AI)
```
POST /api/v1/categories/{websiteId}/suggest
```

---

## Variable Endpoints

### Import Variables
```
POST /api/v1/variables/import
```

**Request (multipart/form-data):**
```
file: [CSV/JSON/YAML file]
scope: website
websiteId: ws-abc123
name: Company Variables
```

### List Variable Sources
```
GET /api/v1/variables/sources
```

### Get Variables by Source
```
GET /api/v1/variables/sources/{sourceId}
```

### Get Variables by Scope
```
GET /api/v1/variables?scope=website&websiteId=ws-abc123
```

### Set Variable
```
POST /api/v1/variables
```

**Request:**
```json
{
  "Scope": "website",
  "WebsiteId": "ws-abc123",
  "Key": "company.name",
  "Value": "CleanPro",
  "ValueType": "string"
}
```

### Delete Variable Source
```
DELETE /api/v1/variables/sources/{sourceId}
```

### Export Variables
```
GET /api/v1/variables/export?scope=website&websiteId=ws-abc123&format=json
```

### Preview Variable Processing
```
POST /api/v1/variables/preview
```

**Request:**
```json
{
  "Template": "{{company.name}} has {{experience}} years of experience",
  "Scope": "website",
  "WebsiteId": "ws-abc123",
  "InstanceVars": {"Experience": 15}
}
```

---

## Automation Endpoints

### Create Automation
```
POST /api/v1/automation/{websiteId}
```

**Request:**
```json
{
  "Name": "Melbourne Area Posts",
  "ContentType": "post",
  "VariableSourceId": "src-abc123",
  "AiPromptTemplate": "Write about {{service}} in {{area}}",
  "CommonSettings": {
    "SeoKeywords": ["cleaning"],
    "UseAiSuggestions": true,
    "BatchSize": 10,
    "DelaySeconds": 5
  }
}
```

### List Automations
```
GET /api/v1/automation/{websiteId}
```

### Run Automation
```
POST /api/v1/automation/{websiteId}/{automationId}/run
```

### Pause Automation
```
POST /api/v1/automation/{websiteId}/{automationId}/pause
```

### Get Automation Status
```
GET /api/v1/automation/{websiteId}/{automationId}/status
```

### Get Automation Runs
```
GET /api/v1/automation/{websiteId}/{automationId}/runs
```

---

## Sitemap Endpoints

### Index Sitemap
```
POST /api/v1/sitemap/{websiteId}/index
```

**Request:**
```json
{
  "SitemapUrl": "https://example.com/sitemap.xml",
  "ForceRefresh": false
}
```

### Refresh Sitemap Cache
```
POST /api/v1/sitemap/{websiteId}/refresh
```

### Clear Sitemap Cache
```
DELETE /api/v1/sitemap/{websiteId}/cache
```

### Get Sitemap Status
```
GET /api/v1/sitemap/{websiteId}/status
```

---

## Import/Export Endpoints

### Export Website Data
```
GET /api/v1/data/{websiteId}/export
```

**Query Parameters:**
- `include`: publications,variables,settings (comma-separated)
- `format`: json, zip

### Import Website Data
```
POST /api/v1/data/{websiteId}/import
```

### Export All Data
```
GET /api/v1/data/export-all
```

### Reset Website
```
POST /api/v1/data/{websiteId}/reset
```

**Request:**
```json
{
  "ConfirmPhrase": "RESET-ws-abc123",
  "KeepConnection": true,
  "KeepVariables": false
}
```

---

## System Endpoints

### Health Check
```
GET /api/v1/system/health
```

### Get Config
```
GET /api/v1/system/config
```

### Update Config
```
PUT /api/v1/system/config
```

---

## WebSocket Endpoints

### Publishing Stream
```
WS /ws/publish/{websiteId}
```

**Messages (Server → Client):**
```json
{"Type": "progress", "Step": "generating", "Percent": 30}
{"Type": "content", "Chunk": "..."}
{"Type": "link", "Link": {...}}
{"Type": "complete", "Result": {...}}
{"Type": "error", "Message": "..."}
```

### Automation Stream
```
WS /ws/automation/{websiteId}/{automationId}
```

**Messages:**
```json
{"Type": "started", "TotalItems": 50}
{"Type": "item", "Index": 1, "Status": "success", "PostId": 123}
{"Type": "item", "Index": 2, "Status": "failed", "Error": "..."}
{"Type": "completed", "Successful": 48, "Failed": 2}
```

---

## Error Response Format

```json
{
  "error": true,
  "code": 12101,
  "message": "Failed to create post",
  "details": "WordPress returned: rest_cannot_create"
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `01-architecture.md` |
| Error Codes | `08-error-codes.md` |
| OpenAPI Spec | `10-openapi-spec.md` (TODO) |
