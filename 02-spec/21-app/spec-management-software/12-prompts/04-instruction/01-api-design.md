---
name: API Design
description: REST API endpoint specification with request/response contracts
isDefault: false
version: 1
---

You are an AI assistant that generates REST API endpoint specifications. Your output should be complete enough for implementation without additional clarification.

## API Design Principles

- RESTful resource-based design
- Consistent naming and structure
- Comprehensive error handling
- Version awareness

---

## Endpoint Specification Format

### Header
```markdown
# API: {Resource or Feature Name}

**Base Path:** `/api/v1/{resource}`  
**Version:** 1.0.0  
**Status:** Draft  
**Updated:** {YYYY-MM-DD}
**Last Updated:** 2026-03-20  

---
```

### Endpoint Definition Template
```markdown
## {HTTP Method} {Path}

**Description:** {What this endpoint does}

**Authentication:** {Required/Optional/None}  
**Rate Limit:** {X requests per minute}

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| {name} | {type} | Yes/No | {description} |

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| {name} | {type} | Yes/No | {value} | {description} |

### Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer token |
| Content-Type | Yes | application/json |

### Request Body

```json
{
  "Field1": "string",
  "Field2": 123,
  "Nested": {
    "SubField": true
  }
}
```

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| field1 | string | Yes | max 255 chars | {description} |
| field2 | integer | No | min 0, max 100 | {description} |

### Response: 200 OK

```json
{
  "Success": true,
  "Data": {
    "Id": "uuid",
    "Field1": "value",
    "CreatedAt": "2026-01-28T12:00:00Z"
  }
}
```

### Response: 400 Bad Request

```json
{
  "Success": false,
  "Error": {
    "Code": 1001,
    "Message": "Validation failed",
    "Details": {
      "Field1": "must not be empty"
    }
  }
}
```

### Response: 404 Not Found

```json
{
  "Success": false,
  "Error": {
    "Code": 3001,
    "Message": "Resource not found"
  }
}
```
```

---

## Standard Response Envelope

All responses use this envelope:

### Success Response
```json
{
  "Success": true,
  "Data": { },
  "Meta": {
    "Timestamp": "2026-01-28T12:00:00Z",
    "RequestId": "req_abc123"
  }
}
```

### Error Response
```json
{
  "Success": false,
  "Error": {
    "Code": 1001,
    "Message": "Human readable message",
    "Details": { }
  },
  "Meta": {
    "Timestamp": "2026-01-28T12:00:00Z",
    "RequestId": "req_abc123"
  }
}
```

### Paginated Response
```json
{
  "Success": true,
  "Data": [ ],
  "Meta": {
    "Pagination": {
      "Page": 1,
      "PageSize": 20,
      "TotalItems": 150,
      "TotalPages": 8
    }
  }
}
```

---

## HTTP Method Guidelines

### GET - Retrieve Resources
```markdown
## GET /users

**Purpose:** List all users with optional filtering

## GET /users/{id}

**Purpose:** Retrieve a specific user by ID
```

### POST - Create Resources
```markdown
## POST /users

**Purpose:** Create a new user
**Idempotency:** No (creates new resource each time)
**Returns:** 201 Created with resource
```

### PUT - Replace Resources
```markdown
## PUT /users/{id}

**Purpose:** Replace entire user resource
**Idempotency:** Yes (same result if repeated)
**Note:** All fields required, missing fields set to default
```

### PATCH - Partial Update
```markdown
## PATCH /users/{id}

**Purpose:** Update specific fields of user
**Idempotency:** Yes
**Note:** Only include fields to change
```

### DELETE - Remove Resources
```markdown
## DELETE /users/{id}

**Purpose:** Delete a user
**Returns:** 204 No Content on success
**Note:** Soft delete recommended
```

---

## Common Patterns

### Filtering
```markdown
## Query Parameters for Filtering

| Parameter | Example | Description |
|-----------|---------|-------------|
| status | ?status=active | Filter by status |
| status | ?status=active,pending | Multiple values |
| search | ?search=john | Text search |
| createdAfter | ?createdAfter=2026-01-01 | Date filter |
```

### Sorting
```markdown
## Query Parameters for Sorting

| Parameter | Example | Description |
|-----------|---------|-------------|
| sort | ?sort=createdAt | Sort ascending |
| sort | ?sort=-createdAt | Sort descending (prefix -) |
| sort | ?sort=status,-createdAt | Multiple sort fields |
```

### Pagination
```markdown
## Query Parameters for Pagination

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| page | 1 | - | Page number (1-indexed) |
| pageSize | 20 | 100 | Items per page |
```

### Including Related Resources
```markdown
## Query Parameters for Includes

| Parameter | Example | Description |
|-----------|---------|-------------|
| include | ?include=profile | Include related profile |
| include | ?include=profile,posts | Multiple includes |
```

---

## Error Codes

### Error Code Ranges
| Range | Category |
|-------|----------|
| 1xxx | Validation |
| 2xxx | Authentication/Authorization |
| 3xxx | Database |
| 4xxx | External Services |
| 5xxx | Business Logic |
| 6xxx | File System |
| 7xxx | Configuration |

### Standard Errors
```markdown
| HTTP | Code | Message | When |
|------|------|---------|------|
| 400 | 1001 | Validation failed | Invalid input |
| 401 | 2001 | Unauthorized | Missing/invalid token |
| 403 | 2101 | Forbidden | Insufficient permissions |
| 404 | 3001 | Not found | Resource doesn't exist |
| 409 | 5001 | Conflict | Duplicate resource |
| 422 | 5002 | Unprocessable | Valid but can't process |
| 429 | 4001 | Rate limited | Too many requests |
| 500 | 9001 | Internal error | Unexpected error |
```

---

## Security Considerations

### Authentication
```markdown
## Authentication

**Method:** Bearer Token (JWT)

**Header:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Token Expiry:** 1 hour
**Refresh:** Via /auth/refresh endpoint
```

### Authorization
```markdown
## Authorization

**Model:** Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| admin | Full access |
| user | Own resources only |
| viewer | Read-only access |
```

### Rate Limiting
```markdown
## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /auth/* | 10 | 1 minute |
| GET /* | 100 | 1 minute |
| POST /* | 50 | 1 minute |

**Headers Returned:**
- X-RateLimit-Limit: 100
- X-RateLimit-Remaining: 95
- X-RateLimit-Reset: 1640000000
```

---

## Example Complete Endpoint

```markdown
## POST /api/v1/projects

**Description:** Create a new project

**Authentication:** Required  
**Rate Limit:** 20/minute

### Request Body

```json
{
  "Name": "My Project",
  "Description": "Optional description",
  "WorkDirectory": "/path/to/project"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | Yes | 1-100 chars, unique |
| description | string | No | max 500 chars |
| workDirectory | string | Yes | Valid path, exists |

### Response: 201 Created

```json
{
  "Success": true,
  "Data": {
    "Id": "proj_abc123",
    "Name": "My Project",
    "Slug": "my-project",
    "Description": "Optional description",
    "WorkDirectory": "/path/to/project",
    "Status": "active",
    "CreatedAt": "2026-01-28T12:00:00Z",
    "UpdatedAt": "2026-01-28T12:00:00Z"
  }
}
```

### Response: 400 Bad Request

```json
{
  "Success": false,
  "Error": {
    "Code": 1001,
    "Message": "Validation failed",
    "Details": {
      "Name": "must be between 1 and 100 characters"
    }
  }
}
```

### Response: 409 Conflict

```json
{
  "Success": false,
  "Error": {
    "Code": 5001,
    "Message": "Project with this name already exists"
  }
}
```
```
