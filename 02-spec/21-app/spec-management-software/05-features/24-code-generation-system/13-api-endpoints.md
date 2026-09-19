# Code Generation System - API Endpoints

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09

---

## Overview

REST API specification for the Code Generation System. All endpoints follow the standard response envelope format and require JWT authentication.

**Cross-References:**
- [Overview](./00-overview.md)
- [Architecture](./01-architecture.md)
- [Data Models](./14-data-models.md)
- [WebSocket Events](./15-websocket-events.md)
- [OpenAPI Specification](../../16-api/openapi.yaml)

---

## Response Envelope

All responses use the standard JSON envelope:

```json
{
  "Success": true,
  "Data": { },
  "Error": null,
  "Meta": {
    "Timestamp": "2026-01-29T10:30:00Z",
    "RequestId": "req_abc123"
  }
}
```

### Error Response

```json
{
  "Success": false,
  "Data": null,
  "Error": {
    "Code": 16201,
    "Message": "Spec file not found",
    "Details": "File '02-spec/05-features/missing.md' does not exist"
  },
  "Meta": {
    "Timestamp": "2026-01-29T10:30:00Z",
    "RequestId": "req_abc123"
  }
}
```

---

## Endpoint Summary

| Domain | Endpoints | Base Path |
|--------|-----------|-----------|
| [Guidelines](#1-guidelines-api) | 12 | `/api/v1/guidelines` |
| [Plans](#2-plans-api) | 6 | `/api/v1/codegen/plans` |
| [Sessions](#3-sessions-api) | 7 | `/api/v1/codegen/sessions` |
| [Git](#4-git-api) | 10 | `/api/v1/git` |
| [Build](#5-build-verification-api) | 4 | `/api/v1/codegen/build` |
| [Credits](#6-credits-api) | 7 | `/api/v1/credits` |

**Total:** 46 endpoints

---

## 1. Guidelines API

### GET /api/v1/guidelines/resolved

Get merged guidelines for a project and language.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectId | string | Yes | Project UUID |
| language | string | Yes | Target language (go, react, php) |

**Response:**

```json
{
  "Success": true,
  "Data": {
    "MergedPrompt": "You are an expert Go developer...",
    "Layers": {
      "General": [
        { "Id": 1, "Name": "Error Handling", "Category": "error_handling" }
      ],
      "Language": [
        { "Id": 5, "Name": "Go Conventions", "Language": "go" }
      ],
      "User": [],
      "Project": [
        { "Id": 12, "Name": "Project Standards", "ProjectId": "uuid" }
      ]
    },
    "EffectiveRules": {
      "ErrorHandling": "Return early, wrap errors with context...",
      "Naming": "Use camelCase for functions..."
    }
  }
}
```

**Errors:** 16100, 16101, 16102

---

### GET /api/v1/guidelines/general

List all general guidelines.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| category | string | No | Filter by category |
| isActive | boolean | No | Filter by active status |
| page | int | No | Page number (default: 1) |
| limit | int | No | Items per page (default: 20) |

**Response:**

```json
{
  "Success": true,
  "Data": {
    "Items": [
      {
        "Id": 1,
        "Name": "Error Handling",
        "Category": "error_handling",
        "Content": "## Error Handling\n\n...",
        "Priority": 0,
        "IsActive": true,
        "Version": "1.0.0"
      }
    ],
    "Pagination": {
      "Page": 1,
      "Limit": 20,
      "Total": 15,
      "TotalPages": 1
    }
  }
}
```

---

### POST /api/v1/guidelines/general

Create a general guideline.

**Request Body:**

```json
{
  "Name": "Documentation Standards",
  "Category": "documentation",
  "Content": "## Documentation\n\nAll functions must have...",
  "Priority": 10,
  "Version": "1.0.0"
}
```

**Response:** Created guideline object with `Id`.

**Errors:** 16100, 16103

---

### PUT /api/v1/guidelines/general/{id}

Update a general guideline.

---

### DELETE /api/v1/guidelines/general/{id}

Delete a general guideline.

---

### GET /api/v1/guidelines/language

List language-specific guidelines.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| language | string | No | Filter by language |
| category | string | No | Filter by category |

---

### POST /api/v1/guidelines/language

Create a language-specific guideline.

**Request Body:**

```json
{
  "Language": "go",
  "Name": "Go Error Wrapping",
  "Category": "error_handling",
  "Content": "Use apperror.Wrap with error codes...",
  "ExtendsRule": "error_handling",
  "OverrideKey": "error_messages"
}
```

---

### GET /api/v1/guidelines/user

List current user's preferences.

---

### POST /api/v1/guidelines/user

Create a user preference.

**Request Body:**

```json
{
  "Language": "go",
  "Name": "Personal Logging Style",
  "Category": "logging",
  "Content": "Always use structured logging...",
  "OverrideKey": "logging_format"
}
```

---

### GET /api/v1/guidelines/project/{projectId}

List project-specific guidelines.

---

### POST /api/v1/guidelines/project/{projectId}

Create a project guideline.

**Request Body:**

```json
{
  "Language": "go",
  "Name": "API Response Format",
  "Category": "api",
  "Content": "All responses use envelope format...",
  "SpecFileRef": "02-spec/03-api-design/01-response-format.md"
}
```

---

### DELETE /api/v1/guidelines/project/{projectId}/{id}

Delete a project guideline.

---

## 2. Plans API

### POST /api/v1/codegen/plans

Generate a new execution plan from specifications.

**Request Body:**

```json
{
  "ProjectId": "uuid",
  "Name": "Initial Backend Generation",
  "SpecPaths": [
    "02-spec/05-features/03-api-design/",
    "02-spec/05-features/07-database-design/"
  ],
  "Languages": ["go", "react"],
  "Options": {
    "IncludeTests": true,
    "IncludeMigrations": true,
    "IncludeDocumentation": false
  }
}
```

**Response:**

```json
{
  "Success": true,
  "Data": {
    "Id": 1,
    "Uuid": "plan_uuid",
    "ProjectId": "project_uuid",
    "Name": "Initial Backend Generation",
    "Status": "ready",
    "TotalFiles": 45,
    "TotalBatches": 8,
    "EstimatedTokens": 125000,
    "Batches": [
      {
        "Index": 0,
        "FileCount": 6,
        "Files": ["internal/model/user.go", "internal/model/project.go"],
        "DependsOn": []
      },
      {
        "Index": 1,
        "FileCount": 4,
        "Files": ["internal/repository/user_repo.go"],
        "DependsOn": [0]
      }
    ],
    "CreatedAt": "2026-01-29T10:30:00Z"
  }
}
```

**Errors:** 16200, 16201, 16202, 16203, 16204

---

### GET /api/v1/codegen/plans

List plans for a project.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectId | string | Yes | Project UUID |
| status | string | No | Filter by status |
| page | int | No | Page number |
| limit | int | No | Items per page |

---

### GET /api/v1/codegen/plans/{planId}

Get plan details.

**Response:**

```json
{
  "Success": true,
  "Data": {
    "Id": 1,
    "Uuid": "plan_uuid",
    "ProjectId": "project_uuid",
    "Name": "Initial Backend Generation",
    "Status": "ready",
    "TotalFiles": 45,
    "TotalBatches": 8,
    "EstimatedTokens": 125000,
    "ActualTokens": 0,
    "SpecSnapshot": { },
    "CreatedAt": "2026-01-29T10:30:00Z",
    "Files": [
      {
        "Id": 1,
        "FilePath": "internal/model/user.go",
        "Language": "go",
        "FileType": "source",
        "BatchIndex": 0,
        "Status": "pending",
        "Dependencies": [],
        "EstimatedTokens": 2500
      }
    ],
    "Batches": [
      {
        "Index": 0,
        "FileCount": 6,
        "Status": "pending",
        "DependsOn": []
      }
    ]
  }
}
```

---

### GET /api/v1/codegen/plans/{planId}/files

Get all planned files with dependency details.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| batchIndex | int | No | Filter by batch |
| status | string | No | Filter by status |
| language | string | No | Filter by language |

---

### DELETE /api/v1/codegen/plans/{planId}

Cancel and delete a plan.

**Errors:** 16206 (Plan not found)

---

### POST /api/v1/codegen/plans/{planId}/duplicate

Duplicate a plan for re-execution.

---

## 3. Sessions API

### POST /api/v1/codegen/sessions

Start a new execution session from a plan.

**Request Body:**

```json
{
  "PlanId": "plan_uuid",
  "Options": {
    "MaxWorkers": 4,
    "AutoCommit": true,
    "AutoPush": false,
    "SkipExisting": true
  }
}
```

**Response:**

```json
{
  "Success": true,
  "Data": {
    "Id": 1,
    "Uuid": "session_uuid",
    "PlanId": 1,
    "Status": "running",
    "TotalFiles": 45,
    "CompletedFiles": 0,
    "FailedFiles": 0,
    "CurrentBatch": 0,
    "WorkersActive": 4,
    "StartedAt": "2026-01-29T10:30:00Z",
    "WebsocketUrl": "/ws/codegen/session_uuid"
  }
}
```

**Errors:** 16300, 16306 (Insufficient credits)

---

### GET /api/v1/codegen/sessions

List sessions for a project.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| projectId | string | Yes | Project UUID |
| status | string | No | Filter by status |
| page | int | No | Page number |
| limit | int | No | Items per page |

---

### GET /api/v1/codegen/sessions/{sessionId}

Get session status and progress.

**Response:**

```json
{
  "Success": true,
  "Data": {
    "Id": 1,
    "Uuid": "session_uuid",
    "PlanId": 1,
    "Status": "running",
    "TotalFiles": 45,
    "CompletedFiles": 23,
    "FailedFiles": 1,
    "SkippedFiles": 0,
    "TotalTokens": 58000,
    "TotalCredits": 1.74,
    "CurrentBatch": 4,
    "WorkersActive": 4,
    "StartedAt": "2026-01-29T10:30:00Z",
    "ElapsedMs": 125000,
    "EstimatedRemainingMs": 95000,
    "CurrentFiles": [
      "internal/service/user_service.go",
      "internal/service/project_service.go"
    ]
  }
}
```

---

### GET /api/v1/codegen/sessions/{sessionId}/files

Get generated files for a session.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status |
| includeContent | boolean | No | Include file content (default: false) |

**Response:**

```json
{
  "Success": true,
  "Data": {
    "Items": [
      {
        "Id": 1,
        "FilePath": "internal/model/user.go",
        "Status": "success",
        "ModelUsed": "coding1",
        "PromptTokens": 1200,
        "CompletionTokens": 800,
        "GenerationTimeMs": 3500,
        "Content": "package model\n\n..."
      }
    ]
  }
}
```

---

### POST /api/v1/codegen/sessions/{sessionId}/pause

Pause a running session.

---

### POST /api/v1/codegen/sessions/{sessionId}/resume

Resume a paused session.

---

### POST /api/v1/codegen/sessions/{sessionId}/stop

Stop and cancel a session.

---

## 4. Git API

### POST /api/v1/git/repos/{projectId}/init

Initialize a local Git repository for a project.

**Request Body:**

```json
{
  "LocalPath": "/projects/code-output/my-project",
  "IncludeSpec": true,
  "CreateReadme": true
}
```

**Response:**

```json
{
  "Success": true,
  "Data": {
    "Id": 1,
    "ProjectId": "project_uuid",
    "LocalPath": "/projects/code-output/my-project",
    "IsInitialized": true,
    "RemoteBranch": "main",
    "AutoCommit": true,
    "AutoPush": false,
    "CreatedAt": "2026-01-29T10:30:00Z"
  }
}
```

**Errors:** 16400, 16401

---

### GET /api/v1/git/repos/{projectId}

Get repository configuration.

---

### PUT /api/v1/git/repos/{projectId}

Update repository settings.

**Request Body:**

```json
{
  "AutoCommit": true,
  "AutoPush": true,
  "RemoteBranch": "develop"
}
```

---

### POST /api/v1/git/repos/{projectId}/connect-remote

Connect repository to GitHub/GitLab.

**Request Body:**

```json
{
  "Provider": "github",
  "RemoteUrl": "https://github.com/user/repo.git",
  "Branch": "main"
}
```

**Errors:** 16404, 16408, 16409

---

### POST /api/v1/git/repos/{projectId}/push

Push commits to remote.

**Errors:** 16405

---

### POST /api/v1/git/repos/{projectId}/pull

Pull from remote.

**Errors:** 16406, 16407 (Merge conflict)

---

### GET /api/v1/git/repos/{projectId}/commits

List commits.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | int | No | Page number |
| limit | int | No | Items per page |
| isPushed | boolean | No | Filter by pushed status |

**Response:**

```json
{
  "Success": true,
  "Data": {
    "Items": [
      {
        "Id": 1,
        "CommitHash": "abc123def456",
        "Message": "[CodeGen] Generated 5 file(s)\n\nSpec References:\n- 02-spec/03-api/...",
        "FilesAdded": 5,
        "FilesModified": 0,
        "FilesDeleted": 0,
        "IsPushed": true,
        "PushedAt": "2026-01-29T10:35:00Z",
        "CreatedAt": "2026-01-29T10:30:00Z"
      }
    ],
    "Pagination": { }
  }
}
```

---

### GET /api/v1/git/oauth/{provider}/url

Get OAuth authorization URL.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| provider | string | `github` or `gitlab` |

**Response:**

```json
{
  "Success": true,
  "Data": {
    "AuthUrl": "https://github.com/login/oauth/authorize?client_id=...",
    "State": "random_state_token"
  }
}
```

---

### POST /api/v1/git/oauth/{provider}/callback

Handle OAuth callback.

**Request Body:**

```json
{
  "Code": "oauth_authorization_code",
  "State": "random_state_token"
}
```

**Response:**

```json
{
  "Success": true,
  "Data": {
    "Id": 1,
    "Provider": "github",
    "Username": "user123",
    "Email": "user@example.com",
    "IsActive": true,
    "ConnectedAt": "2026-01-29T10:30:00Z"
  }
}
```

**Errors:** 16402, 16403

---

### GET /api/v1/git/oauth/connections

List user's OAuth connections.

---

## 5. Build Verification API

### POST /api/v1/codegen/build/{sessionId}/verify

Start build verification for a session.

**Request Body:**

```json
{
  "Languages": ["go", "react"],
  "MaxFixAttempts": 3,
  "AutoFix": true
}
```

**Response:**

```json
{
  "Success": true,
  "Data": {
    "Verifications": [
      {
        "Id": 1,
        "Language": "go",
        "Status": "running",
        "MaxAttempts": 3
      },
      {
        "Id": 2,
        "Language": "react",
        "Status": "pending",
        "MaxAttempts": 3
      }
    ]
  }
}
```

**Errors:** 16500, 16501

---

### GET /api/v1/codegen/build/{sessionId}

Get verification status for a session.

**Response:**

```json
{
  "Success": true,
  "Data": {
    "Verifications": [
      {
        "Id": 1,
        "Language": "go",
        "Status": "success",
        "AttemptCount": 1,
        "InitialErrors": 3,
        "FinalErrors": 0,
        "FixedErrors": 3,
        "Duration": 45000
      },
      {
        "Id": 2,
        "Language": "react",
        "Status": "failed",
        "AttemptCount": 3,
        "InitialErrors": 5,
        "FinalErrors": 2,
        "FixedErrors": 3,
        "Duration": 120000
      }
    ]
  }
}
```

---

### GET /api/v1/codegen/build/verification/{verificationId}

Get detailed verification results.

**Response:**

```json
{
  "Success": true,
  "Data": {
    "Id": 1,
    "Language": "go",
    "Status": "success",
    "AttemptCount": 2,
    "InitialErrors": 5,
    "FinalErrors": 0,
    "FixedErrors": 5,
    "Errors": [
      {
        "Id": 1,
        "FilePath": "internal/handler/user.go",
        "Line": 45,
        "Column": 12,
        "ErrorCode": "undeclared",
        "ErrorMessage": "undefined: UserService",
        "Severity": "error",
        "IsFixed": true,
        "FixAttempt": 1
      }
    ],
    "FixAttempts": [
      {
        "AttemptNumber": 1,
        "ErrorsAtStart": 5,
        "ErrorsAfterFix": 2,
        "FilesModified": ["internal/handler/user.go"],
        "TokensUsed": 3500,
        "Success": true
      },
      {
        "AttemptNumber": 2,
        "ErrorsAtStart": 2,
        "ErrorsAfterFix": 0,
        "FilesModified": ["internal/service/user.go"],
        "TokensUsed": 2800,
        "Success": true
      }
    ]
  }
}
```

---

### POST /api/v1/codegen/build/verification/{verificationId}/retry

Retry a failed verification.

**Errors:** 16504 (Max retries exceeded)

---

## 6. Credits API

### GET /api/v1/credits/balance

Get current user's credit balance.

**Response:**

```json
{
  "Success": true,
  "Data": {
    "UserId": "user_uuid",
    "TotalCredits": 500.0000,
    "UsedCredits": 125.5000,
    "Balance": 374.5000,
    "FreeCredits": 100.0000,
    "FreeUsed": 100.0000,
    "LastTopupAt": "2026-01-15T10:00:00Z",
    "LastUsageAt": "2026-01-29T10:30:00Z"
  }
}
```

---

### GET /api/v1/credits/transactions

List credit transactions.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | No | Filter by type (usage, purchase, refund) |
| startDate | string | No | Filter from date (ISO8601) |
| endDate | string | No | Filter to date (ISO8601) |
| page | int | No | Page number |
| limit | int | No | Items per page |

**Response:**

```json
{
  "Success": true,
  "Data": {
    "Items": [
      {
        "Id": 1,
        "Uuid": "txn_uuid",
        "Type": "usage",
        "Amount": -1.2500,
        "Description": "code_generation: 25000 input + 12000 output tokens",
        "ModelId": "coding1",
        "TokensInput": 25000,
        "TokensOutput": 12000,
        "BalanceBefore": 375.7500,
        "BalanceAfter": 374.5000,
        "CreatedAt": "2026-01-29T10:30:00Z"
      }
    ],
    "Pagination": { },
    "Summary": {
      "TotalUsage": 125.5000,
      "TotalPurchased": 500.0000,
      "PeriodStart": "2026-01-01T00:00:00Z",
      "PeriodEnd": "2026-01-29T23:59:59Z"
    }
  }
}
```

---

### GET /api/v1/credits/usage

Get usage statistics.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| period | string | No | `day`, `week`, `month` (default: month) |
| groupBy | string | No | `model`, `project`, `requestType` |

**Response:**

```json
{
  "Success": true,
  "Data": {
    "Period": "month",
    "TotalCredits": 125.5000,
    "TotalTokens": 2500000,
    "TotalRequests": 850,
    "ByModel": {
      "coding1": { "Credits": 80.0000, "Tokens": 1600000, "Requests": 550 },
      "coding2": { "Credits": 45.5000, "Tokens": 900000, "Requests": 300 }
    },
    "ByProject": {
      "project_uuid": { "Credits": 125.5000, "Name": "My Project" }
    },
    "DailyUsage": [
      { "Date": "2026-01-29", "Credits": 15.2500 },
      { "Date": "2026-01-28", "Credits": 22.1000 }
    ]
  }
}
```

---

### GET /api/v1/credits/plans

List available credit plans.

**Response:**

```json
{
  "Success": true,
  "Data": {
    "Plans": [
      {
        "Id": 1,
        "Name": "Starter",
        "Description": "Perfect for trying out code generation",
        "Credits": 100.0000,
        "Price": 5.00,
        "Currency": "USD",
        "BonusCredits": 0,
        "BonusPercent": 0,
        "IsPopular": false
      },
      {
        "Id": 2,
        "Name": "Developer",
        "Description": "Best value for active developers",
        "Credits": 500.0000,
        "Price": 20.00,
        "Currency": "USD",
        "BonusCredits": 50.0000,
        "BonusPercent": 0,
        "IsPopular": true
      }
    ]
  }
}
```

---

### POST /api/v1/credits/purchase

Initiate credit purchase.

**Request Body:**

```json
{
  "PlanId": 2
}
```

**Response:**

```json
{
  "Success": true,
  "Data": {
    "PaymentIntentId": "pi_abc123",
    "ClientSecret": "pi_abc123_secret_xyz",
    "Amount": 20.00,
    "Currency": "USD",
    "Credits": 550.0000
  }
}
```

**Errors:** 16602, 16603

---

### POST /api/v1/credits/purchase/confirm

Confirm completed purchase.

**Request Body:**

```json
{
  "PaymentIntentId": "pi_abc123"
}
```

**Response:**

```json
{
  "Success": true,
  "Data": {
    "Transaction": {
      "Id": 10,
      "Uuid": "txn_uuid",
      "Type": "purchase",
      "Amount": 550.0000,
      "Description": "Purchased Developer plan",
      "BalanceAfter": 924.5000
    },
    "NewBalance": 924.5000
  }
}
```

---

### GET /api/v1/credits/estimate

Estimate credits for a plan.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| planId | string | Yes | Plan UUID to estimate |

**Response:**

```json
{
  "Success": true,
  "Data": {
    "PlanId": "plan_uuid",
    "EstimatedTokens": 125000,
    "EstimatedCredits": 3.75,
    "Breakdown": {
      "CodeGeneration": 3.25,
      "BuildVerification": 0.50
    },
    "CurrentBalance": 374.5000,
    "Sufficient": true
  }
}
```

---

## Authentication

All endpoints require JWT authentication via Bearer token:

```
Authorization: Bearer <jwt_token>
```

---

## Rate Limiting

| Endpoint Category | Rate Limit |
|-------------------|------------|
| Guidelines (read) | 100/minute |
| Guidelines (write) | 20/minute |
| Plans | 30/minute |
| Sessions | 10/minute |
| Git operations | 20/minute |
| Build verification | 10/minute |
| Credits | 50/minute |

---

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| 16100 | 500 | Guideline resolution failed |
| 16101 | 404 | Guideline not found |
| 16102 | 400 | Invalid language |
| 16103 | 400 | Validation error |
| 16200 | 500 | Plan generation failed |
| 16201 | 404 | Spec file not found |
| 16202 | 400 | Invalid spec format |
| 16203 | 400 | Circular dependency |
| 16204 | 400 | Unsupported language |
| 16206 | 404 | Plan not found |
| 16300 | 500 | Session failed |
| 16306 | 402 | Insufficient credits |
| 16400 | 500 | Git operation failed |
| 16401 | 400 | Repository not initialized |
| 16402 | 401 | OAuth connection failed |
| 16403 | 401 | Token refresh failed |
| 16404 | 400 | Remote not configured |
| 16405 | 500 | Push failed |
| 16406 | 500 | Pull failed |
| 16407 | 409 | Merge conflict |
| 16408 | 400 | Invalid remote URL |
| 16409 | 403 | Permission denied |
| 16500 | 500 | Build verification failed |
| 16501 | 404 | brun CLI not found |
| 16504 | 400 | Max retries exceeded |
| 16601 | 402 | Insufficient credits |
| 16602 | 404 | Invalid credit plan |
| 16603 | 402 | Payment failed |

---

## Related Specifications

- [WebSocket Events](./15-websocket-events.md)
- [Data Models](./14-data-models.md)
- [Error Codes](./16-error-codes.md)
