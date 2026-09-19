# API Interface

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09

---

## Overview

REST API for WP Plugin Builder when running in server mode. Provides HTTP endpoints for all CLI operations.

**Cross-References:**
- [CLI Interface](./02-cli-interface.md)
- [Configuration](./03-configuration.md)
- [Error Handling](./10-error-handling.md)

---

## Server Configuration

Default: `localhost:5070`

```json
{
  "Server": {
    "Host": "localhost",
    "Port": 5070,
    "Cors": true,
    "CorsOrigins": ["*"],
    "RateLimit": {
      "Enabled": true,
      "RequestsPerMinute": 60
    }
  }
}
```

---

## Base URL

```
http://localhost:5070/api/v1
```

---

## Authentication

Currently supports optional API key authentication:

```
Authorization: Bearer <api-key>
```

Configure in `wpb.json`:

```json
{
  "Server": {
    "ApiKey": "your-secret-key"
  }
}
```

---

## Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "Status": "healthy",
  "Version": "1.0.0",
  "Uptime": "2h30m15s"
}
```

---

### Projects

#### List Projects

```http
GET /projects
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sort` | string | `created` | Sort by: name, created, updated |
| `order` | string | `desc` | Order: asc, desc |

**Response:**
```json
{
  "Projects": [
    {
      "Id": 1,
      "Name": "Exam Manager",
      "Slug": "exam-manager",
      "Author": "John Doe",
      "Version": "1.0.0",
      "CreatedAt": "2026-02-01T10:00:00Z",
      "LastGeneratedAt": "2026-02-01T12:30:00Z"
    }
  ],
  "Total": 1
}
```

#### Create Project

```http
POST /projects
```

**Request Body:**
```json
{
  "Name": "Exam Manager",
  "Author": "John Doe",
  "AuthorEmail": "john@example.com",
  "Website": "https://example.com",
  "Description": "Exam management plugin"
}
```

**Response:**
```json
{
  "Id": 1,
  "Name": "Exam Manager",
  "Slug": "exam-manager",
  "DbPath": "~/.wpb/projects/exam-manager.sqlite",
  "CreatedAt": "2026-02-01T10:00:00Z"
}
```

#### Get Project

```http
GET /projects/:slug
```

**Response:**
```json
{
  "Id": 1,
  "Name": "Exam Manager",
  "Slug": "exam-manager",
  "Author": "John Doe",
  "AuthorEmail": "john@example.com",
  "Website": "https://example.com",
  "Description": "Exam management plugin",
  "Version": "1.0.0",
  "TextDomain": "exam-manager",
  "Namespace": "ExamManager",
  "CreatedAt": "2026-02-01T10:00:00Z",
  "UpdatedAt": "2026-02-01T12:30:00Z",
  "GenerationCount": 5
}
```

#### Delete Project

```http
DELETE /projects/:slug
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `KeepFiles` | boolean | `false` | Keep generated files |

**Response:**
```json
{
  "Success": true,
  "Message": "Project deleted"
}
```

#### Clone Project

```http
POST /projects/:slug/clone
```

**Request Body:**
```json
{
  "TargetName": "Quiz Maker",
  "IncludeHistory": true
}
```

#### Export Project

```http
GET /projects/:slug/export
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `Format` | string | `sqlite` | Export format: sqlite, zip |
| `IncludeFiles` | boolean | `true` | Include generated files (zip only) |

**Response:** Binary file download

#### Import Project

```http
POST /projects/import
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `file` | file | SQLite database or zip file |
| `name` | string | Override project name (optional) |
| `overwrite` | boolean | Overwrite if exists |

---

### Presets

#### List Presets

```http
GET /presets
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category |

**Response:**
```json
{
  "Presets": [
    {
      "Id": 1,
      "Name": "wordpress-core-standards",
      "Category": "core",
      "ChunkCount": 15,
      "IsActive": true
    }
  ]
}
```

#### Import Preset

```http
POST /presets
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `file` | file | Markdown preset file |
| `name` | string | Override preset name |
| `category` | string | Preset category |

#### Apply Preset to Project

```http
POST /projects/:slug/presets
```

**Request Body:**
```json
{
  "PresetName": "wordpress-security"
}
```

---

### Specifications

#### List Specifications

```http
GET /projects/:slug/specs
```

**Response:**
```json
{
  "Specifications": [
    {
      "Id": 1,
      "Name": "exam-crud.md",
      "Format": "markdown",
      "ImportedAt": "2026-02-01T11:00:00Z"
    }
  ]
}
```

#### Import Specification

```http
POST /projects/:slug/specs
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `file` | file | Markdown, folder (zip), or zip file |
| `format` | string | auto, md, zip, folder |

---

### Generation

#### Generate Code

```http
POST /projects/:slug/generate
```

**Request Body:**
```json
{
  "SpecId": 1,
  "Component": "admin",
  "Options": {
    "Validate": true,
    "OverwriteMode": "backup",
    "DryRun": false
  }
}
```

**Response:**
```json
{
  "Success": true,
  "Files": [
    {
      "Path": "admin/class-exam-manager-admin.php",
      "Action": "created",
      "Size": 5432
    }
  ],
  "Stats": {
    "FilesGenerated": 3,
    "Duration": "2.5s"
  }
}
```

#### Stream Generation

```http
POST /projects/:slug/generate/stream
```

Uses Server-Sent Events (SSE) for streaming output.

**Response (SSE):**
```
event: chunk
data: {"Content": "<?php\n/**\n * Admin class\n */"}

event: chunk
data: {"Content": "\nclass Exam_Manager_Admin {"}

event: file
data: {"Path": "admin/class-exam-manager-admin.php", "Action": "created"}

event: done
data: {"FilesGenerated": 3, "Duration": "2.5s"}
```

---

### Validation

#### Validate Code

```http
POST /projects/:slug/validate
```

**Request Body:**
```json
{
  "SpecId": 1,
  "Path": "./plugins/exam-manager"
}
```

**Response:**
```json
{
  "Valid": true,
  "warnings": [
    "Missing text domain in line 45"
  ],
  "errors": []
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "Code": 10305,
  "Message": "Project not found",
  "Details": {
    "Slug": "nonexistent-project"
  }
}
```

---

## Rate Limiting

When rate limiting is enabled:

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706792400

{
  "Code": 10463,
  "Message": "Rate limit exceeded",
  "Details": {
    "RetryAfter": 30
  }
}
```

---

## CORS

When CORS is enabled, the following headers are sent:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

---

## OpenAPI Specification

Available at:

```http
GET /openapi.json
```

---

## See Also

- [CLI Interface](./02-cli-interface.md)
- [Error Handling](./10-error-handling.md)
- [Configuration](./03-configuration.md)
