# Non-Vector RAG: API Interface

**Version:** 1.0.0  
**Status:** Draft  
**Last Updated:** 2026-03-22  

---

## Overview

REST API endpoints for the Non-Vector RAG system, integrated into AI Bridge CLI's existing API server. All endpoints are prefixed with `/api/v1/tree-rag/`.

---

## Endpoints

### POST /api/v1/tree-rag/index

Create or update a tree index for a codebase.

**Request:**

```json
{
  "appName": "my-project",
  "rootPath": "/path/to/codebase",
  "mode": "full",
  "options": {
    "includePatterns": ["**/*.go", "**/*.ts", "**/*.md"],
    "excludePatterns": ["**/vendor/**", "**/node_modules/**"],
    "maxFileSize": 1048576,
    "maxDepth": 15,
    "enrichmentModel": "llama3.1:8b",
    "batchSize": 10,
    "maxConcurrentLLM": 4
  },
  "async": true
}
```

**Response (async=true):**

```json
{
  "jobId": "idx_abc123",
  "treeIndexId": "ti_def456",
  "status": "queued",
  "estimatedDurationMs": 60000,
  "createdAt": "2026-03-22T10:00:00Z"
}
```

**Response (async=false):**

```json
{
  "jobId": "idx_abc123",
  "treeIndexId": "ti_def456",
  "status": "completed",
  "stats": {
    "filesScanned": 150,
    "filesIndexed": 120,
    "filesSkipped": 30,
    "nodesCreated": 1450,
    "llmCallsMade": 145,
    "llmTokensUsed": 58000,
    "durationMs": 45000
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| appName | string | Yes | Application/project identifier |
| rootPath | string | Yes | Filesystem path to codebase |
| mode | string | Yes | `full`, `incremental`, `metadata-only` |
| async | boolean | No | Return immediately with job ID (default: true) |

---

### POST /api/v1/tree-rag/query

Query the tree index for relevant content.

**Request:**

```json
{
  "appName": "my-project",
  "query": "How does JWT token validation work?",
  "options": {
    "strategy": "auto",
    "maxResults": 5,
    "maxTokens": 4000,
    "includeContent": true,
    "includeTraversalPath": true,
    "categories": [],
    "minScore": 0.3
  }
}
```

**Response:**

```json
{
  "nodes": [
    {
      "nodeId": "tn_123",
      "title": "ValidateToken Function",
      "description": "Validates JWT tokens and extracts claims",
      "content": "func ValidateToken(...) { ... }",
      "filePath": "internal/auth/jwt.go",
      "lineRange": [45, 89],
      "score": 0.95,
      "depth": 3,
      "ancestorPath": "authentication > jwt-validation > ValidateToken",
      "category": "authentication",
      "subcategory": "jwt-validation",
      "tokenCount": 320
    }
  ],
  "traversalPath": [
    {"nodeId": "tn_001", "title": "authentication", "score": 0.9, "depth": 0},
    {"nodeId": "tn_045", "title": "jwt-validation", "score": 0.95, "depth": 1},
    {"nodeId": "tn_123", "title": "ValidateToken Function", "score": 0.95, "depth": 2}
  ],
  "metadata": {
    "strategy": "greedy",
    "totalCandidates": 1450,
    "totalRetrieved": 3,
    "totalTokens": 890,
    "timeTakenMs": 245,
    "fts5Used": false,
    "llmCallsMade": 2
  }
}
```

---

### GET /api/v1/tree-rag/index/{appName}

Get tree index status and statistics.

**Response:**

```json
{
  "treeIndexId": "ti_def456",
  "appName": "my-project",
  "status": "ready",
  "stats": {
    "totalNodes": 1450,
    "totalFiles": 120,
    "maxDepth": 6,
    "categories": {
      "authentication": 45,
      "database": 89,
      "api": 120,
      "business-logic": 230
    }
  },
  "lastIndexed": "2026-03-22T10:01:00Z",
  "createdAt": "2026-03-22T10:00:00Z"
}
```

---

### GET /api/v1/tree-rag/index/{appName}/tree

Get the full tree structure (without content) for visualization.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| maxDepth | int | 3 | Maximum depth to return |
| includeMetadata | bool | true | Include title, description, keywords |

**Response:**

```json
{
  "roots": [
    {
      "nodeId": "tn_001",
      "title": "authentication",
      "category": "authentication",
      "nodeType": "package",
      "importance": 0.9,
      "childCount": 5,
      "children": [
        {
          "nodeId": "tn_045",
          "title": "jwt-validation",
          "category": "authentication",
          "nodeType": "file",
          "importance": 0.85,
          "childCount": 4,
          "children": []
        }
      ]
    }
  ],
  "totalNodes": 1450,
  "truncatedAtDepth": 3
}
```

---

### DELETE /api/v1/tree-rag/index/{appName}

Delete a tree index and all associated data.

**Response:**

```json
{
  "deleted": true,
  "nodesDeleted": 1450,
  "filesDeleted": 120
}
```

---

### GET /api/v1/tree-rag/jobs/{jobId}

Check status of an async indexing job.

**Response:**

```json
{
  "jobId": "idx_abc123",
  "status": "running",
  "progress": {
    "filesScanned": 80,
    "filesTotal": 150,
    "percentComplete": 53.3,
    "currentFile": "internal/auth/jwt.go"
  },
  "startedAt": "2026-03-22T10:00:00Z"
}
```

---

### GET /api/v1/tree-rag/categories

List all available categories and their node counts across all indexes.

**Response:**

```json
{
  "categories": [
    {"name": "authentication", "nodeCount": 45, "subcategories": ["jwt", "oauth", "session"]},
    {"name": "database", "nodeCount": 89, "subcategories": ["schema", "migration", "query"]}
  ]
}
```

---

## Authentication

All endpoints require the same authentication as existing AI Bridge API endpoints (API key header or session token).

---

## Error Responses

Standard error envelope per project conventions:

```json
{
  "error": {
    "code": 20600,
    "message": "Tree index not found for app: my-project",
    "details": {}
  }
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `./01-architecture.md` |
| Retrieval Engine | `./06-tree-retrieval-engine.md` |
| Error Codes | `./08-error-codes.md` |
| AI Bridge API Interface | `../22-ai-bridge-cli/01-backend/04-api-interface.md` |

---

*API interface specification created 2026-03-22.*
