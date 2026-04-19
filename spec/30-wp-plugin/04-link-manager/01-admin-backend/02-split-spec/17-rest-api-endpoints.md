# 17 - REST API Endpoints

> **Status:** Complete  
> **Priority:** High  
> **Updated:** 2026-03-09
**Version:** 1.0.0  

---

## Purpose

Consolidated reference for all Link Manager REST API endpoints. All endpoints use the `lm/v1` namespace and require WordPress admin authentication (`manage_options` capability).

---

## Authentication

All endpoints require:
- WordPress admin login (cookie auth)
- OR valid REST API nonce via `X-WP-Nonce` header

```javascript
// Example fetch with nonce
fetch('/wp-json/lm/v1/posts', {
  headers: {
    'X-WP-Nonce': wpApiSettings.nonce,
    'Content-Type': 'application/json'
  }
});
```

---

## Content Endpoints

### List Posts/Pages/Categories

```
GET /lm/v1/posts
GET /lm/v1/pages
GET /lm/v1/categories
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `per_page` | int | 20 | Items per page (max 100) |
| `search` | string | - | Search term |
| `search_type` | string | title | `title` or `slug` |
| `sort_by` | string | title | `title`, `links`, `broken`, `updated` |
| `sort_dir` | string | asc | `asc` or `desc` |
| `has_broken` | bool | - | Filter to items with broken links |

**Response:**

```json
{
  "Items": [
    {
      "Id": 123,
      "Title": "Getting Started Guide",
      "Slug": "getting-started",
      "Url": "https://example.com/getting-started",
      "MetaDescription": "Learn how to...",
      "TotalLinks": 12,
      "BrokenLinks": 2,
      "WorkingLinks": 10,
      "HistoryCount": 3,
      "LastScanned": "2026-01-31T10:30:00Z",
      "LastModified": "2026-01-30T15:00:00Z"
    }
  ],
  "Total": 294,
  "Page": 1,
  "PerPage": 20,
  "TotalPages": 15
}
```

---

### Get Content Details

```
GET /lm/v1/posts/{id}
GET /lm/v1/pages/{id}
GET /lm/v1/categories/{id}
```

**Response:**

```json
{
  "Id": 123,
  "Type": "post",
  "Title": "Getting Started Guide",
  "Slug": "getting-started",
  "Url": "https://example.com/getting-started",
  "WpEditUrl": "https://example.com/wp-admin/post.php?post=123&action=edit",
  "MetaDescription": "Learn how to...",
  "LastScanned": "2026-01-31T10:30:00Z",
  "HistoryCount": 3,
  "IsElementor": true,
  "LinkStats": {
    "Total": 12,
    "Working": 10,
    "Broken": 2,
    "JsonLd": 3
  }
}
```

---

## Link Endpoints

### Get Links for Content

```
GET /lm/v1/posts/{id}/links
GET /lm/v1/pages/{id}/links
GET /lm/v1/categories/{id}/links
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | all | `all`, `working`, `broken`, `unknown` |
| `source` | string | all | `all`, `html`, `json_ld` |
| `wrapper` | string | - | Filter by wrapper: `h1`-`h6`, `strong`, `em` |
| `word_count` | string | - | `1`, `2`, `3+` |
| `has_title` | bool | - | Has title attribute |

**Response:**

```json
{
  "Links": [
    {
      "Id": "link_abc123",
      "Url": "https://example.com/page",
      "AnchorText": "click here",
      "WordCount": 2,
      "TitleAttribute": "Visit page",
      "Status": "broken",
      "StatusCode": 404,
      "WrapperStack": ["h2", "strong"],
      "SourceType": "html",
      "JsonLdPath": null,
      "ElementorElementId": "abc123",
      "Position": { "Start": 1234, "End": 1290 },
      "OuterHtml": "<a href=\"...\" title=\"...\">click here</a>"
    }
  ],
  "Total": 12,
  "Stats": {
    "ByStatus": { "Working": 10, "Broken": 2 },
    "ByWrapper": { "H2": 3, "Strong": 5, "None": 4 },
    "ByWordCount": { "1": 2, "2": 6, "3+": 4 }
  }
}
```

---

### Modify Link

```
PUT /lm/v1/links/{id}
```

**Request Body:**

```json
{
  "Url": "https://new-url.com/page",
  "TitleAttribute": "New title",
  "RemoveTitle": false
}
```

**Response:**

```json
{
  "Success": true,
  "Link": { /* updated link object */ },
  "HistoryId": "hist_xyz789"
}
```

---

### Remove Link

```
DELETE /lm/v1/links/{id}
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | string | keep_text | `keep_text`, `keep_href_only`, `remove_all` |

**Response:**

```json
{
  "Success": true,
  "HistoryId": "hist_xyz789"
}
```

---

### Bulk Link Operations

```
POST /lm/v1/links/bulk
```

**Request Body:**

```json
{
  "LinkIds": ["link_abc", "link_def", "link_ghi"],
  "Action": "remove_title",
  "Options": {}
}
```

**Available Actions:**

| Action | Options | Description |
|--------|---------|-------------|
| `remove_title` | - | Remove title attribute |
| `remove_link` | `mode`: keep_text/keep_href_only | Remove anchor tag |
| `remove_wrapper` | `wrapper`: h1-h6/strong/em | Remove wrapper tag |
| `change_url` | `new_url`: string | Change href value |
| `set_title` | `title`: string | Set title attribute |
| `set_title_from_csv` | `mapping`: object | Bulk title from CSV data |

**Response:**

```json
{
  "Success": true,
  "Modified": 3,
  "Failed": 0,
  "Errors": [],
  "HistoryId": "hist_xyz789"
}
```

---

## Scan Endpoints

### Start Scan

```
POST /lm/v1/scan
```

**Request Body:**

```json
{
  "ScanType": "all",
  "ContentType": null,
  "ContentIds": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ScanType` | string | `all`, `broken`, `selected` |
| `ContentType` | string? | `posts`, `pages`, `categories` |
| `ContentIds` | int[]? | Specific IDs to scan |

**Response:**

```json
{
  "JobId": "job_abc123",
  "Status": "pending",
  "TotalItems": 294
}
```

---

### Get Scan Progress

```
GET /lm/v1/scan/{job_id}/progress
```

**Response:**

```json
{
  "Id": "job_abc123",
  "Status": "running",
  "Progress": {
    "Total": 294,
    "Completed": 45,
    "Percentage": 15.3,
    "CurrentItem": "Getting Started Guide",
    "LinksFound": 234,
    "BrokenFound": 12,
    "EtaSeconds": 180
  },
  "StartedAt": "2026-01-31T10:30:00Z",
  "Errors": []
}
```

---

### Cancel Scan

```
POST /lm/v1/scan/{job_id}/cancel
```

**Response:**

```json
{
  "Success": true,
  "Status": "cancelled"
}
```

---

## Snapshot Endpoints

### List Snapshots

```
GET /lm/v1/snapshots
```

**Response:**

```json
{
  "Snapshots": [
    {
      "Id": 3,
      "Sequence": 3,
      "Name": "pre-cleanup",
      "FileName": "003-pre-cleanup-2026-01-31.db",
      "SizeBytes": 2457600,
      "ContentCounts": {
        "Posts": 294,
        "Pages": 45,
        "Categories": 12
      },
      "IsAutoSnapshot": false,
      "CreatedAt": "2026-01-31T10:00:00Z",
      "RestoredAt": null
    }
  ],
  "Total": 7
}
```

---

### Create Snapshot

```
POST /lm/v1/snapshots
```

**Request Body:**

```json
{
  "Name": "before-bulk-edit",
  "IncludeHistory": false,
  "ContentTypes": ["posts", "pages", "categories"]
}
```

**Response:**

```json
{
  "Success": true,
  "Snapshot": { /* snapshot object */ }
}
```

---

### Restore Snapshot

```
POST /lm/v1/snapshots/{id}/restore
```

**Request Body:**

```json
{
  "ContentTypes": ["posts"]
}
```

**Response:**

```json
{
  "Success": true,
  "RestoredCounts": {
    "Posts": 294,
    "Pages": 0,
    "Categories": 0,
    "Links": 1847
  },
  "BackupPath": "wp-content/uploads/link-manager/snapshots/004-pre-restore-backup-2026-01-31.db"
}
```

---

### Delete Snapshot

```
DELETE /lm/v1/snapshots/{id}
```

**Response:**

```json
{
  "Success": true
}
```

---

## History Endpoints

### Get Content History

```
GET /lm/v1/posts/{id}/history
GET /lm/v1/pages/{id}/history
GET /lm/v1/categories/{id}/history
```

**Response:**

```json
{
  "Versions": [
    {
      "Id": "v3",
      "VersionNumber": 3,
      "Changes": [
        { "Type": "remove_title", "Count": 2 }
      ],
      "CreatedAt": "2026-01-31T14:30:00Z",
      "CreatedBy": "admin"
    }
  ],
  "Total": 3
}
```

---

### Restore to Version

```
POST /lm/v1/posts/{id}/history/{version}/restore
POST /lm/v1/pages/{id}/history/{version}/restore
```

**Response:**

```json
{
  "Success": true,
  "RestoredVersion": 1,
  "NewVersion": 4
}
```

---

### Compare Versions

```
GET /lm/v1/posts/{id}/history/compare?from=1&to=3
```

**Response:**

```json
{
  "FromVersion": 1,
  "ToVersion": 3,
  "Changes": [
    {
      "Type": "link_removed",
      "Url": "https://example.com/old",
      "AnchorText": "old link"
    },
    {
      "Type": "url_changed",
      "OldUrl": "https://old.com",
      "NewUrl": "https://new.com"
    }
  ]
}
```

---

## Import Endpoints

### Upload CSV

```
POST /lm/v1/import/upload
Content-Type: multipart/form-data
```

**Response:**

```json
{
  "FileId": "tmp_abc123",
  "FileName": "broken-links.csv",
  "RowCount": 150,
  "DetectedColumns": {
    "BrokenUrl": "url",
    "Source": "source_page",
    "StatusCode": "status",
    "Unmapped": ["extra_column"]
  }
}
```

---

### Preview Import

```
POST /lm/v1/import/preview
```

**Request Body:**

```json
{
  "FileId": "tmp_abc123",
  "ColumnMapping": {
    "BrokenUrl": "url",
    "Source": "source_page"
  },
  "MatchBy": "url"
}
```

**Response:**

```json
{
  "TotalRows": 150,
  "MatchedRows": 142,
  "UnmatchedRows": 8,
  "PreviewRows": [
    {
      "Row": 1,
      "BrokenUrl": "https://example.com/old",
      "Source": "/getting-started",
      "Matched": true,
      "PostId": 123
    }
  ]
}
```

---

### Execute Import

```
POST /lm/v1/import/execute
```

**Request Body:**

```json
{
  "FileId": "tmp_abc123",
  "ColumnMapping": { /* ... */ },
  "MatchBy": "url",
  "SkipDuplicates": true
}
```

**Response:**

```json
{
  "Success": true,
  "Imported": 142,
  "Skipped": 8,
  "DuplicatesSkipped": 5,
  "Errors": []
}
```

---

## Settings Endpoints

### Get Settings

```
GET /lm/v1/settings
```

**Response:**

```json
{
  "AutoSnapshotEnabled": true,
  "SnapshotRetentionLimit": 50,
  "ShowFirstModificationWarning": true,
  "DefaultItemsPerPage": 20,
  "DefaultTab": "posts",
  "ValidateLinkStatus": true,
  "FollowRedirects": true,
  "RequestTimeout": 10,
  "ConcurrentRequests": 5,
  "BatchSize": 20,
  "ScanPostContent": true,
  "ScanElementorData": true,
  "ScanJsonLd": true,
  "EnabledPostTypes": ["post", "page"]
}
```

---

### Update Settings

```
PUT /lm/v1/settings
```

**Request Body:** Partial settings object

**Response:**

```json
{
  "Success": true,
  "Settings": { /* updated settings */ }
}
```

---

### Get Database Stats

```
GET /lm/v1/database/stats
```

**Response:**

```json
{
  "MainDatabase": {
    "Path": "wp-content/uploads/link-manager/link-manager.db",
    "SizeBytes": 2457600,
    "Posts": 294,
    "Pages": 45,
    "Categories": 12,
    "Links": 1847
  },
  "HistoryDatabases": {
    "Path": "wp-content/uploads/link-manager/history-manage/",
    "Posts": { "Count": 47, "SizeBytes": 12902400 },
    "Pages": { "Count": 8, "SizeBytes": 1258291 },
    "Categories": { "Count": 3, "SizeBytes": 419430 }
  },
  "Snapshots": {
    "Path": "wp-content/uploads/link-manager/snapshots/",
    "Count": 7,
    "TotalSizeBytes": 47185920
  }
}
```

---

## Error Response Format

All errors follow this format:

```json
{
  "Code": 14404,
  "Message": "Snapshot not found",
  "Details": {
    "SnapshotId": 99
  }
}
```

HTTP status codes:
- `400` - Invalid request
- `401` - Not authenticated
- `403` - Not authorized
- `404` - Resource not found
- `500` - Server error

---

## Internal Linking Endpoints

### Link Targets

#### List Targets

```
GET /lm/v1/internal-linking/targets
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `per_page` | int | 20 | Items per page (max 100) |
| `search` | string | - | Search in URL or title |
| `category` | string | - | Filter by category |
| `is_active` | bool | true | Only active targets |

**Response:**

```json
{
  "Targets": [
    {
      "Id": 1,
      "Url": "/carpet-cleaning-guide",
      "Title": "Carpet Cleaning Guide",
      "Category": "cleaning",
      "Priority": 5,
      "TimesLinked": 23,
      "IsActive": true,
      "Source": "MANUAL_IMPORT",
      "CreatedAt": "2026-01-31T10:00:00Z"
    }
  ],
  "Total": 127,
  "Page": 1,
  "PerPage": 20
}
```

---

#### Add Target

```
POST /lm/v1/internal-linking/targets
```

**Request Body:**

```json
{
  "Url": "/carpet-cleaning-guide",
  "Title": "Carpet Cleaning Guide",
  "Category": "cleaning",
  "Priority": 5,
  "Keywords": ["carpet", "cleaning tips"]
}
```

**Response:**

```json
{
  "Success": true,
  "Target": { /* target object */ }
}
```

---

#### Update Target

```
PUT /lm/v1/internal-linking/targets/{id}
```

**Request Body:** Partial target object

**Response:**

```json
{
  "Success": true,
  "Target": { /* updated target */ }
}
```

---

#### Delete Target

```
DELETE /lm/v1/internal-linking/targets/{id}
```

**Response:**

```json
{
  "Success": true
}
```

```
POST /lm/v1/internal-linking/import/csv
Content-Type: multipart/form-data
```

**Form Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `file` | file | CSV file |
| `url_column` | string | Column name for URL |
| `title_column` | string | Column name for title |
| `category_column` | string? | Optional category column |
| `auto_detect` | bool | Auto-detect columns |

**Response:**

```json
{
  "Success": true,
  "Imported": 127,
  "Skipped": 3,
  "Failed": 0,
  "Errors": []
}
```

---

#### Import Targets from JSON

```
POST /lm/v1/internal-linking/import/json
Content-Type: multipart/form-data
```

**Response:**

```json
{
  "Success": true,
  "Imported": 45,
  "VariablesCreated": 3,
  "Errors": []
}
```

---

### Templates

#### List Templates

```
GET /lm/v1/internal-linking/templates
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `active_only` | bool | true | Only active templates |

**Response:**

```json
{
  "Templates": [
    {
      "Id": 1,
      "Name": "Basic Link",
      "Template": "<a href=\"{{url}}\" title=\"{{title}}\">{{anchor_text}}</a>",
      "IsDefault": true,
      "IsActive": true,
      "CreatedAt": "2026-01-31T10:00:00Z"
    }
  ]
}
```

---

#### Create Template

```
POST /lm/v1/internal-linking/templates
```

**Request Body:**

```json
{
  "Name": "Bold Heading Link",
  "Template": "<{{heading_tag}}><strong><a href=\"{{url}}\" title=\"{{title_attr}}\">{{anchor_text}}</a></strong></{{heading_tag}}>",
  "IsDefault": false
}
```

**Response:**

```json
{
  "Success": true,
  "Template": { /* template object */ }
}
```

---

#### Update Template

```
PUT /lm/v1/internal-linking/templates/{id}
```

**Request Body:** Partial template object

---

#### Delete Template

```
DELETE /lm/v1/internal-linking/templates/{id}
```

---

#### Set Default Template

```
POST /lm/v1/internal-linking/templates/{id}/default
```

**Response:**

```json
{
  "Success": true,
  "Template": { /* updated template with IsDefault: true */ }
}
```

---

### Variables

#### List Variables

```
GET /lm/v1/internal-linking/variables
```

**Response:**

```json
{
  "Variables": [
    {
      "Id": 1,
      "Name": "title_attr",
      "SourceType": "csv",
      "SourceFile": "title-variations.csv",
      "ValuesCount": 15,
      "SelectionMode": "SEQUENTIAL",
      "CurrentIndex": 3,
      "LastRefreshedAt": "2026-01-31T10:00:00Z"
    }
  ]
}
```

---

#### Create Variable

```
POST /lm/v1/internal-linking/variables
```

**Request Body (from file):**

```json
{
  "Name": "title_attr",
  "SourceType": "csv",
  "SourceFile": "title-variations.csv",
  "ColumnOrKey": "title_text",
  "SelectionMode": "SEQUENTIAL"
}
```

**Request Body (manual values):**

```json
{
  "Name": "heading_tag",
  "SourceType": "manual",
  "Values": ["h2", "h3", "h4"],
  "SelectionMode": "RANDOM"
}
```

---

#### Update Variable

```
PUT /lm/v1/internal-linking/variables/{id}
```

---

#### Delete Variable

```
DELETE /lm/v1/internal-linking/variables/{id}
```

---

#### Refresh Variable Values

```
POST /lm/v1/internal-linking/variables/{id}/refresh
```

Reloads values from source file.

**Response:**

```json
{
  "Success": true,
  "ValuesCount": 18,
  "PreviousCount": 15
}
```

---

#### Reset Variable Index

```
POST /lm/v1/internal-linking/variables/{id}/reset
```

Resets sequential index to 0.

---

### Auto-Linking

#### Find Orphan Content

```
GET /lm/v1/internal-linking/orphans
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `content_type` | string | all | `posts`, `pages`, `all` |
| `max_links` | int | 5 | Content with fewer than this |
| `category_id` | int | - | Filter by category |

**Response:**

```json
{
  "Orphans": [
    {
      "Id": 123,
      "Type": "post",
      "Title": "How to Clean Carpets",
      "InternalLinkCount": 2,
      "TotalLinks": 8
    }
  ],
  "Total": 47
}
```

---

#### Preview Links

```
POST /lm/v1/internal-linking/generate/preview
```

**Request Body:**

```json
{
  "ContentType": "post",
  "ContentId": 123,
  "LinkCount": 5,
  "TemplateId": 2
}
```

**Response:**

```json
{
  "ProposedLinks": [
    {
      "TargetUrl": "/carpet-cleaning-guide",
      "AnchorText": "carpet cleaning tips",
      "PhraseContext": "...professional carpet cleaning tips that will help...",
      "TemplatePreview": "<h2><a href=\"/carpet-cleaning-guide\">carpet cleaning tips</a></h2>"
    }
  ],
  "TotalMatches": 5
}
```

---

#### Generate Links

```
POST /lm/v1/internal-linking/generate
```

**Request Body:**

```json
{
  "ContentType": "post",
  "ContentId": 123,
  "LinkCount": 5,
  "TemplateId": 2,
  "InsertionMode": "FIRST_MATCH"
}
```

**Response:**

```json
{
  "Success": true,
  "LinksCreated": 5,
  "HistoryId": "hist_abc123",
  "Links": [
    {
      "TargetUrl": "/carpet-cleaning-guide",
      "AnchorText": "carpet cleaning tips"
    }
  ]
}
```

---

#### Bulk Generate Links

```
POST /lm/v1/internal-linking/generate/bulk
```

**Request Body:**

```json
{
  "ContentType": "post",
  "ContentIds": [123, 456, 789],
  "LinksPerContent": 5,
  "TemplateId": null,
  "InsertionMode": "FIRST_MATCH"
}
```

**Response:**

```json
{
  "Success": true,
  "TotalProcessed": 3,
  "TotalLinksCreated": 12,
  "ContentWithLinks": 3,
  "ContentFailed": 0,
  "Results": [
    { "ContentId": 123, "LinksCreated": 5 },
    { "ContentId": 456, "LinksCreated": 4 },
    { "ContentId": 789, "LinksCreated": 3 }
  ]
}
```

---

#### Remove Internal Links

```
DELETE /lm/v1/internal-linking/links/{content_type}/{content_id}
```

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `link_ids` | string | Comma-separated IDs (optional, removes all if empty) |

**Response:**

```json
{
  "Success": true,
  "LinksRemoved": 5,
  "HistoryId": "hist_xyz789"
}
```

---

### Reports

#### Get Site Linking Report

```
GET /lm/v1/internal-linking/report
```

**Response:**

```json
{
  "TotalContent": 234,
  "ContentWithLinks": 187,
  "OrphanContent": 47,
  "TotalInternalLinks": 589,
  "AvgLinksPerContent": 3.2,
  "Distribution": {
    "0": 47,
    "1-2": 34,
    "3-5": 68,
    "6-10": 52,
    "10+": 33
  },
  "TopTargets": [
    { "Url": "/carpet-cleaning-guide", "TimesLinked": 23 }
  ],
  "HistorySummary": {
    "ContentWithHistory": 89,
    "TotalVersions": 312
  }
}
```

---

#### Export Report

```
GET /lm/v1/internal-linking/report/export
```

Returns CSV file with full report data.

---

## Link Health Monitor Endpoints

### Health Summary

```
GET /lm/v1/health/summary
```

Get overall health statistics for all monitored links.

**Response:**

```json
{
  "TotalLinks": 1847,
  "CheckedLinks": 1620,
  "Healthy": 1502,
  "Broken": 45,
  "Slow": 23,
  "Redirects": 50,
  "Excluded": 12,
  "Unknown": 215,
  "AverageResponseMs": 342,
  "LastFullScan": "2026-01-31T08:00:00Z",
  "ActiveAlerts": 68,
  "CriticalAlerts": 12
}
```

---

### List Health Checks

```
GET /lm/v1/health/checks
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `per_page` | int | 20 | Items per page (max 100) |
| `status` | string | all | `healthy`, `broken`, `slow`, `redirect`, `unknown`, `excluded` |
| `priority` | string | all | `high`, `normal`, `low` |
| `sort_by` | string | last_checked | `last_checked`, `response_time`, `failures` |
| `sort_dir` | string | desc | `asc` or `desc` |

**Response:**

```json
{
  "Items": [
    {
      "Id": 1,
      "LinkId": 456,
      "Url": "https://example.com/page",
      "Status": "broken",
      "HttpCode": 404,
      "ResponseTimeMs": null,
      "RedirectCount": 0,
      "FinalUrl": null,
      "ErrorMessage": "Not Found",
      "SslValid": true,
      "SslExpiry": "2027-06-15T00:00:00Z",
      "Priority": "high",
      "LastCheckedAt": "2026-01-31T10:30:00Z",
      "NextCheckAt": "2026-02-01T10:30:00Z",
      "CheckCount": 5,
      "ConsecutiveFailures": 3
    }
  ],
  "Total": 1847,
  "Page": 1,
  "PerPage": 20,
  "TotalPages": 93
}
```

---

### Get Health Check Details

```
GET /lm/v1/health/checks/{id}
```

**Response:**

```json
{
  "Id": 1,
  "LinkId": 456,
  "Url": "https://example.com/page",
  "Status": "broken",
  "HttpCode": 404,
  "ResponseTimeMs": null,
  "RedirectCount": 0,
  "FinalUrl": null,
  "RedirectChain": [],
  "ErrorMessage": "Not Found",
  "SslValid": true,
  "SslExpiry": "2027-06-15T00:00:00Z",
  "Priority": "high",
  "LastCheckedAt": "2026-01-31T10:30:00Z",
  "NextCheckAt": "2026-02-01T10:30:00Z",
  "CheckCount": 5,
  "ConsecutiveFailures": 3,
  "ContentReferences": [
    { "Id": 123, "Type": "post", "Title": "Getting Started" },
    { "Id": 45, "Type": "page", "Title": "About Us" }
  ],
  "CheckHistory": [
    { "CheckedAt": "2026-01-31T10:30:00Z", "Status": "broken", "HttpCode": 404 },
    { "CheckedAt": "2026-01-30T10:30:00Z", "Status": "broken", "HttpCode": 404 }
  ]
}
```

---

### Check Single URL

```
POST /lm/v1/health/check
```

Immediately check a URL without scheduling.

**Request Body:**

```json
{
  "Url": "https://example.com/page-to-check"
}
```

**Response:**

```json
{
  "Url": "https://example.com/page-to-check",
  "Status": "healthy",
  "HttpCode": 200,
  "ResponseTimeMs": 234,
  "RedirectCount": 1,
  "FinalUrl": "https://example.com/page-to-check/",
  "RedirectChain": ["https://example.com/page-to-check/"],
  "SslValid": true,
  "SslExpiry": "2027-06-15T00:00:00Z",
  "CheckedAt": "2026-01-31T14:30:00Z"
}
```

---

### Check Specific Link

```
POST /lm/v1/health/check/{linkId}
```

Check a specific link from the database immediately.

**Response:**

```json
{
  "Success": true,
  "Result": { /* HealthCheckResult object */ }
}
```

---

### Start Full Health Scan

```
POST /lm/v1/health/scan/start
```

Start a background health scan of all links.

**Request Body:**

```json
{
  "Priority": "all",
  "ForceRecheck": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `Priority` | string | `all`, `high`, `stale` (links not checked recently) |
| `ForceRecheck` | bool | Recheck even recently checked links |

**Response:**

```json
{
  "JobId": 1,
  "Status": "pending",
  "TotalLinks": 1847
}
```

---

### Get Scan Progress

```
GET /lm/v1/health/scan/{jobId}
```

**Response:**

```json
{
  "Id": 1,
  "Status": "running",
  "TotalLinks": 1847,
  "ProcessedLinks": 450,
  "HealthyCount": 412,
  "BrokenCount": 18,
  "SlowCount": 8,
  "RedirectCount": 12,
  "Percentage": 24.4,
  "StartedAt": "2026-01-31T10:00:00Z",
  "EtaSeconds": 320
}
```

---

### Cancel Health Scan

```
POST /lm/v1/health/scan/{jobId}/cancel
```

**Response:**

```json
{
  "Success": true,
  "Status": "cancelled"
}
```

---

### List Scan Jobs

```
GET /lm/v1/health/jobs
```

**Response:**

```json
{
  "Jobs": [
    {
      "Id": 1,
      "Status": "completed",
      "TotalLinks": 1847,
      "ProcessedLinks": 1847,
      "HealthyCount": 1702,
      "BrokenCount": 45,
      "SlowCount": 23,
      "RedirectCount": 77,
      "StartedAt": "2026-01-31T08:00:00Z",
      "CompletedAt": "2026-01-31T08:45:00Z"
    }
  ],
  "Total": 12
}
```

---

### List Active Alerts

```
GET /lm/v1/health/alerts
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `per_page` | int | 20 | Items per page (max 100) |
| `severity` | string | all | `info`, `warning`, `error`, `critical` |
| `type` | string | all | `broken_link`, `redirect_chain`, `slow_response`, `ssl_error`, `dns_error`, `timeout` |
| `acknowledged` | bool | false | Include acknowledged alerts |

**Response:**

```json
{
  "Items": [
    {
      "Id": 1,
      "HealthCheckId": 456,
      "AlertType": "broken_link",
      "Severity": "error",
      "Message": "Link returns 404 Not Found",
      "Details": {
        "Url": "https://example.com/missing-page",
        "HttpCode": 404
      },
      "ContentId": 123,
      "ContentType": "post",
      "Acknowledged": false,
      "AcknowledgedBy": null,
      "AcknowledgedAt": null,
      "ResolvedAt": null,
      "CreatedAt": "2026-01-31T10:30:00Z"
    }
  ],
  "Total": 68,
  "Page": 1,
  "PerPage": 20,
  "TotalPages": 4
}
```

---

### Get Alert Statistics

```
GET /lm/v1/health/alerts/stats
```

**Response:**

```json
{
  "TotalActive": 68,
  "BySeverity": {
    "Critical": 12,
    "Error": 33,
    "Warning": 18,
    "Info": 5
  },
  "ByType": {
    "BrokenLink": 45,
    "RedirectChain": 8,
    "SlowResponse": 10,
    "SslError": 3,
    "DnsError": 2,
    "Timeout": 0
  },
  "Acknowledged": 15,
  "ResolvedToday": 23,
  "NewToday": 8
}
```

---

### Acknowledge Alert

```
PUT /lm/v1/health/alerts/{id}/acknowledge
```

**Response:**

```json
{
  "Success": true,
  "AcknowledgedAt": "2026-01-31T14:30:00Z",
  "AcknowledgedBy": "admin"
}
```

---

### Resolve Alert

```
PUT /lm/v1/health/alerts/{id}/resolve
```

**Response:**

```json
{
  "Success": true,
  "ResolvedAt": "2026-01-31T14:30:00Z"
}
```

---

### Delete Alert

```
DELETE /lm/v1/health/alerts/{id}
```

**Response:**

```json
{
  "Success": true
}
```

```
GET /lm/v1/health/broken
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `per_page` | int | 20 | Items per page |
| `consecutive_failures` | int | - | Min consecutive failures |

**Response:**

```json
{
  "Items": [
    {
      "Url": "https://example.com/missing",
      "HttpCode": 404,
      "ErrorMessage": "Not Found",
      "ConsecutiveFailures": 5,
      "LastCheckedAt": "2026-01-31T10:30:00Z",
      "ContentCount": 3,
      "ContentReferences": [
        { "Id": 123, "Type": "post", "Title": "Article A" }
      ]
    }
  ],
  "Total": 45,
  "Page": 1,
  "PerPage": 20,
  "TotalPages": 3
}
```

---

### List Slow Links Report

```
GET /lm/v1/health/slow
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `per_page` | int | 20 | Items per page |
| `min_response_ms` | int | 2000 | Minimum response time |

**Response:**

```json
{
  "Items": [
    {
      "Url": "https://slow-server.com/page",
      "ResponseTimeMs": 4500,
      "HttpCode": 200,
      "LastCheckedAt": "2026-01-31T10:30:00Z",
      "ContentCount": 2
    }
  ],
  "Total": 23,
  "Page": 1,
  "PerPage": 20,
  "TotalPages": 2
}
```

---

### List Redirect Chains

```
GET /lm/v1/health/redirects
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `min_depth` | int | 2 | Minimum redirect chain depth |

**Response:**

```json
{
  "Items": [
    {
      "OriginalUrl": "http://example.com/old",
      "FinalUrl": "https://example.com/new-page/",
      "RedirectCount": 3,
      "RedirectChain": [
        "https://example.com/old",
        "https://example.com/old/",
        "https://example.com/new-page/"
      ],
      "TotalTimeMs": 890,
      "ContentCount": 5
    }
  ],
  "Total": 8
}
```

---

### Export Health Report

```
GET /lm/v1/health/export
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `format` | string | csv | `csv` or `json` |
| `status` | string | all | Filter by status |

Returns downloadable file with health check data.

---

### List Exclusions

```
GET /lm/v1/health/exclusions
```

**Response:**

```json
{
  "Items": [
    {
      "Id": 1,
      "Pattern": "localhost",
      "PatternType": "domain",
      "Reason": "Development URLs",
      "CreatedBy": "admin",
      "CreatedAt": "2026-01-15T10:00:00Z"
    }
  ],
  "Total": 5
}
```

---

### Add Exclusion

```
POST /lm/v1/health/exclusions
```

**Request Body:**

```json
{
  "Pattern": "internal.example.com",
  "PatternType": "domain",
  "Reason": "Internal network, not accessible externally"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `Pattern` | string | URL pattern, domain, or regex |
| `PatternType` | string | `domain`, `url`, `regex` |
| `Reason` | string | Reason for exclusion |

**Response:**

```json
{
  "Success": true,
  "Exclusion": { /* exclusion object */ }
}
```

---

### Delete Exclusion

```
DELETE /lm/v1/health/exclusions/{id}
```

**Response:**

```json
{
  "Success": true
}
```

### List Notification Queue

```
GET /lm/v1/notifications
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `per_page` | int | 20 | Items per page (max 100) |
| `status` | string | all | `PENDING`, `SENT`, `FAILED`, `RETRYING`, `CANCELLED` |
| `channel` | string | all | `EMAIL`, `WEBHOOK`, `ADMIN_NOTICE`, `LOG` |
| `type` | string | - | Filter by notification type |

**Response:**

```json
{
  "Items": [
    {
      "Id": 1,
      "Type": "BROKEN_LINK_DETECTED",
      "Channel": "EMAIL",
      "Priority": "HIGH",
      "Status": "SENT",
      "Recipient": "admin@example.com",
      "Subject": "Broken Link Detected",
      "Attempts": 1,
      "SentAt": "2026-01-31T10:30:00Z",
      "CreatedAt": "2026-01-31T10:29:55Z"
    }
  ],
  "Total": 156,
  "Page": 1,
  "PerPage": 20,
  "TotalPages": 8
}
```

---

### Get Notification Details

```
GET /lm/v1/notifications/{id}
```

**Response:**

```json
{
  "Id": 1,
  "Type": "BROKEN_LINK_DETECTED",
  "Channel": "EMAIL",
  "Priority": "HIGH",
  "Status": "SENT",
  "Recipient": "admin@example.com",
  "Subject": "Broken Link Detected",
  "Payload": {
    "Type": "BROKEN_LINK_DETECTED",
    "Timestamp": "2026-01-31T10:29:55Z",
    "SiteUrl": "https://example.com",
    "SiteName": "Example Site",
    "Alert": {
      "Id": 42,
      "Severity": "ERROR",
      "Url": "https://broken-link.com/page",
      "HttpCode": 404,
      "ContentTitle": "Getting Started Guide",
      "ContentUrl": "https://example.com/getting-started"
    }
  },
  "Attempts": 1,
  "LastAttemptAt": "2026-01-31T10:30:00Z",
  "LastError": null,
  "ScheduledFor": null,
  "SentAt": "2026-01-31T10:30:00Z",
  "CreatedAt": "2026-01-31T10:29:55Z"
}
```

---

### Retry Failed Notification

```
POST /lm/v1/notifications/{id}/retry
```

**Response:**

```json
{
  "Success": true,
  "Status": "RETRYING",
  "Attempt": 2
}
```

---

### Cancel/Delete Notification

```
DELETE /lm/v1/notifications/{id}
```

**Response:**

```json
{
  "Success": true
}
```

```
GET /lm/v1/notifications/recipients
```

**Response:**

```json
{
  "Items": [
    {
      "Id": 1,
      "Email": "admin@example.com",
      "Name": "Site Admin",
      "IsActive": true,
      "NotificationTypes": ["BROKEN_LINK_DETECTED", "DAILY_HEALTH_DIGEST"],
      "Channels": ["EMAIL"],
      "DigestPreference": "DAILY",
      "CreatedAt": "2026-01-15T09:00:00Z",
      "UpdatedAt": "2026-01-31T10:00:00Z"
    }
  ],
  "Total": 3
}
```

---

### Add Recipient

```
POST /lm/v1/notifications/recipients
```

**Request Body:**

```json
{
  "Email": "editor@example.com",
  "Name": "Content Editor",
  "NotificationTypes": ["BROKEN_LINK_DETECTED", "SCAN_COMPLETE"],
  "Channels": ["EMAIL"],
  "DigestPreference": "WEEKLY"
}
```

**Response:**

```json
{
  "Success": true,
  "Recipient": { /* recipient object */ }
}
```

---

### Update Recipient

```
PUT /lm/v1/notifications/recipients/{id}
```

**Request Body:**

```json
{
  "Name": "Senior Editor",
  "NotificationTypes": ["BROKEN_LINK_DETECTED", "SSL_EXPIRY_WARNING"],
  "DigestPreference": "DAILY",
  "IsActive": true
}
```

**Response:**

```json
{
  "Success": true,
  "Recipient": { /* updated recipient object */ }
}
```

---

### Remove Recipient

```
DELETE /lm/v1/notifications/recipients/{id}
```

**Response:**

```json
{
  "Success": true
}
```

```
GET /lm/v1/notifications/webhooks
```

**Response:**

```json
{
  "Items": [
    {
      "Id": 1,
      "Name": "Slack Alerts",
      "Url": "https://hooks.slack.com/services/xxx/yyy/zzz",
      "AuthType": "NONE",
      "IsActive": true,
      "NotificationTypes": ["BROKEN_LINK_DETECTED", "BROKEN_THRESHOLD_EXCEEDED"],
      "Headers": {},
      "RetryEnabled": true,
      "LastSuccessAt": "2026-01-31T09:00:00Z",
      "LastFailureAt": null,
      "ConsecutiveFailures": 0,
      "CreatedAt": "2026-01-15T10:00:00Z",
      "UpdatedAt": "2026-01-31T09:00:00Z"
    }
  ],
  "Total": 2
}
```

---

### Add Webhook Endpoint

```
POST /lm/v1/notifications/webhooks
```

**Request Body:**

```json
{
  "Name": "Custom Integration",
  "Url": "https://api.myapp.com/webhooks/link-manager",
  "AuthType": "HMAC_SHA256",
  "AuthSecret": "my-webhook-secret-key",
  "NotificationTypes": ["BROKEN_LINK_DETECTED", "HEALTH_SCAN_COMPLETE"],
  "Headers": {
    "X-Custom-Header": "custom-value"
  },
  "RetryEnabled": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `Name` | string | Display name for endpoint |
| `Url` | string | Webhook URL |
| `AuthType` | string | `NONE`, `HMAC_SHA256`, `BEARER_TOKEN`, `BASIC_AUTH` |
| `AuthSecret` | string | Secret for authentication |
| `NotificationTypes` | array | Subscribed notification types |
| `Headers` | object | Custom HTTP headers |
| `RetryEnabled` | bool | Enable automatic retries |

**Response:**

```json
{
  "Success": true,
  "Webhook": { /* webhook object (AuthSecret redacted) */ }
}
```

---

### Update Webhook Endpoint

```
PUT /lm/v1/notifications/webhooks/{id}
```

**Request Body:**

```json
{
  "Name": "Updated Integration",
  "NotificationTypes": ["BROKEN_LINK_DETECTED"],
  "IsActive": false
}
```

**Response:**

```json
{
  "Success": true,
  "Webhook": { /* updated webhook object */ }
}
```

---

### Remove Webhook Endpoint

```
DELETE /lm/v1/notifications/webhooks/{id}
```

**Response:**

```json
{
  "Success": true
}
```

```
POST /lm/v1/notifications/webhooks/{id}/test
```

**Response:**

```json
{
  "Success": true,
  "ResponseCode": 200,
  "ResponseTimeMs": 245,
  "ResponseBody": "{\"ok\":true}"
}
```

---

### Get Notification Settings

```
GET /lm/v1/notifications/settings
```

**Response:**

```json
{
  "EmailEnabled": true,
  "WebhookEnabled": true,
  "AdminNoticeEnabled": true,
  "DigestEnabled": true,
  "DigestTime": "09:00",
  "BrokenThreshold": 5,
  "SlowThreshold": 10,
  "SslWarningDays": 30
}
```

---

### Update Notification Settings

```
PUT /lm/v1/notifications/settings
```

**Request Body:**

```json
{
  "EmailEnabled": true,
  "DigestTime": "08:00",
  "BrokenThreshold": 10,
  "SslWarningDays": 14
}
```

**Response:**

```json
{
  "Success": true,
  "Settings": { /* updated settings object */ }
}
```

---

### Get Notification Statistics

```
GET /lm/v1/notifications/stats
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | string | 7d | Time period: `24h`, `7d`, `30d`, `all` |

**Response:**

```json
{
  "Period": "7d",
  "TotalSent": 156,
  "TotalFailed": 3,
  "ByChannel": {
    "EMAIL": { "Sent": 120, "Failed": 2 },
    "WEBHOOK": { "Sent": 35, "Failed": 1 },
    "ADMIN_NOTICE": { "Sent": 1, "Failed": 0 }
  },
  "ByType": {
    "BROKEN_LINK_DETECTED": 45,
    "DAILY_HEALTH_DIGEST": 7,
    "HEALTH_SCAN_COMPLETE": 14
  },
  "AvgDeliveryTimeMs": 1250,
  "SuccessRate": 98.1
}
```

---

### Get Delivery Log

```
GET /lm/v1/notifications/log
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `per_page` | int | 50 | Items per page (max 100) |
| `channel` | string | all | Filter by channel |
| `status` | string | all | `SENT` or `FAILED` |
| `from` | string | - | ISO date start |
| `to` | string | - | ISO date end |

**Response:**

```json
{
  "Items": [
    {
      "Id": 1,
      "NotificationId": 42,
      "Channel": "EMAIL",
      "Recipient": "admin@example.com",
      "Type": "BROKEN_LINK_DETECTED",
      "Status": "SENT",
      "ResponseCode": null,
      "DurationMs": 1540,
      "ErrorMessage": null,
      "CreatedAt": "2026-01-31T10:30:00Z"
    }
  ],
  "Total": 2450,
  "Page": 1,
  "PerPage": 50,
  "TotalPages": 49
}
```

---

### Clear Old Log Entries

```
DELETE /lm/v1/notifications/log
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `days` | int | 30 | Delete entries older than X days |

**Response:**

```json
{
  "Success": true,
  "DeletedCount": 1845
}
```

---

### Send Digest Now

```
POST /lm/v1/notifications/digest/send
```

**Request Body:**

```json
{
  "RecipientId": 1,
  "Period": "daily"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `RecipientId` | int? | Specific recipient (null = all) |
| `Period` | string | `daily` or `weekly` |

**Response:**

```json
{
  "Success": true,
  "SentCount": 3,
  "Recipients": ["admin@example.com", "editor@example.com", "manager@example.com"]
}
```

---

### Preview Digest Content

```
GET /lm/v1/notifications/digest/preview
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `period` | string | daily | `daily` or `weekly` |

**Response:**

```json
{
  "Period": "daily",
  "From": "2026-01-30T00:00:00Z",
  "To": "2026-01-31T00:00:00Z",
  "Summary": {
    "TotalLinks": 1847,
    "BrokenLinks": 12,
    "SlowLinks": 8,
    "NewAlerts": 5,
    "ResolvedAlerts": 3
  },
  "TopIssues": [
    {
      "Url": "https://broken-site.com/page",
      "HttpCode": 404,
      "AffectedContentCount": 3
    }
  ],
  "HtmlPreview": "<!-- rendered email HTML -->"
}
```

---

### Update Digest Schedule

```
PUT /lm/v1/notifications/digest/schedule
```

**Request Body:**

```json
{
  "Time": "08:00",
  "Timezone": "America/New_York",
  "Days": ["monday", "wednesday", "friday"]
}
```

**Response:**

```json
{
  "Success": true,
  "NextScheduled": "2026-02-01T08:00:00-05:00"
}
```

---

## Yoast SEO Endpoints

### Check Yoast Status

```
GET /lm/v1/yoast/status
```

**Response:**

```json
{
  "Installed": true,
  "Active": true,
  "Version": "23.1",
  "PremiumInstalled": true,
  "PremiumActive": true,
  "PremiumVersion": "23.1"
}
```

---

### Get Yoast Settings

```
GET /lm/v1/yoast/settings
```

**Response:**

```json
{
  "FocusKeyword": {
    "AutoGenerateEnabled": true,
    "Source": "title",
    "MaxLength": 60,
    "TrimMode": "word_boundary",
    "MinWords": 1,
    "MaxWords": 5,
    "ExcludeStopWords": true,
    "StopWords": ["a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"]
  },
  "MultipleKeywords": {
    "Enabled": true,
    "MaxKeywords": 5,
    "ExtractionMethod": "title_words",
    "MinWordLength": 3,
    "ExcludeNumbers": true
  },
  "MetaDescription": {
    "MaxLength": 140,
    "MinLength": 50,
    "TrimEnabled": true,
    "TrimMode": "remove_last_word",
    "AddEllipsis": true
  },
  "ContentTypes": {
    "Posts": true,
    "Pages": true,
    "Categories": true,
    "Tags": false,
    "CustomPostTypes": []
  },
  "BatchProcessing": {
    "BatchSize": 25,
    "DelayBetweenBatchesMs": 500
  }
}
```

---

### Update Yoast Settings

```
PUT /lm/v1/yoast/settings
```

**Request Body:**

```json
{
  "FocusKeyword.MaxLength": 60,
  "FocusKeyword.TrimMode": "word_boundary",
  "FocusKeyword.ExcludeStopWords": true,
  "MetaDescription.MaxLength": 140,
  "MetaDescription.TrimMode": "remove_last_word",
  "MetaDescription.AddEllipsis": true,
  "BatchProcessing.BatchSize": 25
}
```

**Response:**

```json
{
  "Success": true,
  "UpdatedSettings": ["FocusKeyword.MaxLength", "MetaDescription.TrimMode"],
  "Settings": { /* full settings object */ }
}
```

---

### Reset Settings to Defaults

```
POST /lm/v1/yoast/settings/reset
```

**Response:**

```json
{
  "Success": true,
  "Settings": { /* default settings object */ }
}
```

---

### List Content Missing Focus Keywords

```
GET /lm/v1/yoast/content/missing-keywords
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `per_page` | int | 20 | Items per page (max 100) |
| `post_types` | string | post,page | Comma-separated: `post`, `page`, `category` |
| `search` | string | - | Search by title |

**Response:**

```json
{
  "Items": [
    {
      "Id": 123,
      "Type": "post",
      "Title": "How to Optimize Your Website for Better Performance",
      "Slug": "optimize-website-performance",
      "Url": "https://example.com/optimize-website-performance",
      "EditUrl": "https://example.com/wp-admin/post.php?post=123&action=edit",
      "PublishedAt": "2026-01-15T10:00:00Z",
      "SuggestedKeyword": "optimize website",
      "SuggestedMultipleKeywords": ["optimize", "website", "performance", "better"]
    }
  ],
  "Total": 67,
  "Page": 1,
  "PerPage": 20,
  "TotalPages": 4,
  "Stats": {
    "PostsMissing": 47,
    "PagesMissing": 12,
    "CategoriesMissing": 8
  }
}
```

---

### List Oversized Meta Descriptions

```
GET /lm/v1/yoast/content/oversized-descriptions
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `per_page` | int | 20 | Items per page (max 100) |
| `max_length` | int | 140 | Description length threshold |
| `post_types` | string | post,page | Comma-separated: `post`, `page`, `category` |

**Response:**

```json
{
  "Items": [
    {
      "Id": 456,
      "Type": "page",
      "Title": "About Our Company",
      "MetaDescription": "This comprehensive page covers everything you need to know about our company, including our history, mission, values, team members, and what makes us unique in the industry.",
      "DescriptionLength": 187,
      "TrimmedPreview": "This comprehensive page covers everything you need to know about our company, including our history, mission, values, team...",
      "CharsToRemove": 47
    }
  ],
  "Total": 23,
  "Page": 1,
  "PerPage": 20,
  "TotalPages": 2
}
```

---

### Get Content Statistics

```
GET /lm/v1/yoast/content/stats
```

**Response:**

```json
{
  "Posts": {
    "Total": 294,
    "MissingKeyword": 47,
    "WithKeyword": 247,
    "WithMultipleKeywords": 89,
    "OversizedDescriptions": 15
  },
  "Pages": {
    "Total": 45,
    "MissingKeyword": 12,
    "WithKeyword": 33,
    "WithMultipleKeywords": 20,
    "OversizedDescriptions": 5
  },
  "Categories": {
    "Total": 28,
    "MissingKeyword": 8,
    "WithKeyword": 20,
    "WithMultipleKeywords": 0,
    "OversizedDescriptions": 3
  },
  "OverallSeoScore": 78
}
```

---

### Optimize Single Content Item

```
POST /lm/v1/yoast/content/{id}/optimize
```

**Request Body:**

```json
{
  "PostType": "post",
  "Operations": ["focus_keyword", "multiple_keywords", "meta_description"],
  "CustomKeyword": null,
  "CustomDescription": null
}
```

| Field | Type | Description |
|-------|------|-------------|
| `PostType` | string | `post`, `page`, or `category` |
| `Operations` | string[] | Which optimizations to apply |
| `CustomKeyword` | string? | Override auto-generated keyword |
| `CustomDescription` | string? | Override trimmed description |

**Response:**

```json
{
  "Success": true,
  "ContentId": 123,
  "Applied": {
    "FocusKeyword": {
      "OldValue": null,
      "NewValue": "optimize website performance",
      "Source": "auto_generated"
    },
    "MultipleKeywords": {
      "OldValue": [],
      "NewValue": ["optimize", "website", "performance"],
      "Source": "auto_generated"
    },
    "MetaDescription": {
      "OldValue": "This is a very long description that exceeds the configured limit...",
      "NewValue": "This is a very long description that exceeds the configured...",
      "CharsRemoved": 47
    }
  },
  "AuditLogIds": [101, 102, 103]
}
```

---

### Batch Set Focus Keywords

```
POST /lm/v1/yoast/batch/focus-keywords
```

**Request Body:**

```json
{
  "ContentIds": [123, 456, 789],
  "PostType": "post",
  "UseCustom": false,
  "CustomKeywords": null,
  "AddToQueue": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `ContentIds` | int[] | Content IDs to optimize |
| `PostType` | string | `post`, `page`, or `category` |
| `UseCustom` | bool | Use custom keywords mapping |
| `CustomKeywords` | object? | Map of `{id: keyword}` |
| `AddToQueue` | bool | Process immediately or queue |

**Response (immediate):**

```json
{
  "Success": true,
  "Processed": 3,
  "Results": [
    { "Id": 123, "Success": true, "Keyword": "optimize website" },
    { "Id": 456, "Success": true, "Keyword": "contact us" },
    { "Id": 789, "Success": false, "Error": "Post not found", "ErrorCode": 14953 }
  ],
  "Failed": 1
}
```

**Response (queued):**

```json
{
  "Success": true,
  "Queued": 3,
  "QueueIds": [501, 502, 503],
  "EstimatedCompletion": "2026-01-31T11:00:00Z"
}
```

---

### Batch Set Multiple Keywords (Premium)

```
POST /lm/v1/yoast/batch/multiple-keywords
```

**Request Body:**

```json
{
  "ContentIds": [123, 456],
  "PostType": "post",
  "ExtractionSettings": {
    "MaxKeywords": 5,
    "MinWordLength": 3,
    "ExcludeNumbers": true
  }
}
```

**Response:**

```json
{
  "Success": true,
  "Processed": 2,
  "Results": [
    { "Id": 123, "Success": true, "Keywords": ["optimize", "website", "performance"] },
    { "Id": 456, "Success": true, "Keywords": ["contact", "support", "help"] }
  ],
  "Failed": 0,
  "PremiumRequired": false
}
```

**Error Response (no Premium):**

```json
{
  "Success": false,
  "Error": "Yoast Premium is required for multiple keywords",
  "ErrorCode": 14951
}
```

---

### Batch Trim Meta Descriptions

```
POST /lm/v1/yoast/batch/trim-descriptions
```

**Request Body:**

```json
{
  "ContentIds": [123, 456, 789],
  "PostType": "post",
  "MaxLength": 140,
  "TrimMode": "remove_last_word",
  "AddEllipsis": true,
  "AddToQueue": false
}
```

**Response:**

```json
{
  "Success": true,
  "Processed": 3,
  "Results": [
    { 
      "Id": 123, 
      "Success": true, 
      "OldLength": 187, 
      "NewLength": 138,
      "TrimmedDescription": "This comprehensive page covers everything you need to know about our company, including our history, mission, values..."
    },
    { "Id": 456, "Success": true, "OldLength": 156, "NewLength": 139 },
    { "Id": 789, "Success": false, "Error": "No meta description set", "Skipped": true }
  ],
  "Failed": 0,
  "Skipped": 1
}
```

---

### Get Optimization Queue

```
GET /lm/v1/yoast/queue
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | all | `all`, `pending`, `processing`, `completed`, `failed` |
| `type` | string | all | `all`, `focus_keyword`, `multiple_keywords`, `meta_description` |
| `page` | int | 1 | Page number |
| `per_page` | int | 50 | Items per page |

**Response:**

```json
{
  "Items": [
    {
      "Id": 501,
      "WpPostId": 123,
      "PostType": "post",
      "PostTitle": "How to Optimize Your Website",
      "OptimizationType": "FOCUS_KEYWORD",
      "Status": "PENDING",
      "Priority": 0,
      "ScheduledAt": null,
      "ProcessedAt": null,
      "ErrorMessage": null,
      "CreatedAt": "2026-01-31T10:30:00Z"
    }
  ],
  "Total": 47,
  "Page": 1,
  "PerPage": 50,
  "TotalPages": 1,
  "Stats": {
    "Pending": 42,
    "Processing": 1,
    "Completed": 156,
    "Failed": 4
  }
}
```

---

### Cancel Queued Optimization

```
DELETE /lm/v1/yoast/queue/{id}
```

**Response:**

```json
{
  "Success": true,
  "QueueId": 501,
  "Status": "CANCELLED"
}
```

---

### Get Audit Log

```
GET /lm/v1/yoast/audit-log
```

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `per_page` | int | 50 | Items per page |
| `action_type` | string | all | `focus_keyword`, `multiple_keywords`, `meta_description` |
| `post_type` | string | all | `post`, `page`, `category` |
| `from_date` | string | - | ISO 8601 date |
| `to_date` | string | - | ISO 8601 date |

**Response:**

```json
{
  "Items": [
    {
      "Id": 101,
      "WpPostId": 123,
      "PostType": "post",
      "PostTitle": "How to Optimize Your Website",
      "ActionType": "focus_keyword",
      "FieldModified": "_yoast_wpseo_focuskw",
      "OldValue": null,
      "NewValue": "optimize website performance",
      "AutoGenerated": true,
      "CreatedAt": "2026-01-31T10:35:00Z",
      "CanRevert": true
    }
  ],
  "Total": 234,
  "Page": 1,
  "PerPage": 50,
  "TotalPages": 5
}
```

---

### Revert Audit Log Entry

```
POST /lm/v1/yoast/audit-log/{id}/revert
```

**Response:**

```json
{
  "Success": true,
  "Reverted": {
    "AuditId": 101,
    "WpPostId": 123,
    "Field": "_yoast_wpseo_focuskw",
    "FromValue": "optimize website performance",
    "ToValue": null
  },
  "NewAuditId": 235
}
```

**Error Response:**

```json
{
  "Success": false,
  "Error": "Cannot revert: field has been modified since this change",
  "ErrorCode": 14956,
  "CurrentValue": "different keyword"
}
```

---

## Rate Limiting

No explicit rate limiting, but scan, bulk linking, health check, notification, and Yoast optimization operations are naturally throttled via batch processing.

---

## Dependencies

- All backend service specs (09-16, 21-24, 27)
- WordPress REST API
- WordPress authentication
- Yoast SEO plugin (for Yoast endpoints)
