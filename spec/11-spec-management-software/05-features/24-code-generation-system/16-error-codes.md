# Error Codes

**Version:** 3.0.0  
**Status:** Draft  
**Updated:** 2026-03-09

---

## Overview

The Code Generation System uses the **16xxx** error code range (16000-16799). This document provides the complete registry with descriptions, HTTP mappings, and retryability flags.

> ⚠️ **REASSIGNED:** Previously used the 12xxx range, which collided with WP SEO Publish CLI (WSP, 12000-12599). Moved to 16000-16799 per collision resolution (2026-02-28).

**Cross-References:**
- [Error Management](../../06-error-management/00-overview.md)
- [Error Code Registry](../../06-error-management/01-error-code-registry.md)
- [Master Registry](../../../03-error-code-registry/01-registry.md)
- [Architecture](./01-architecture.md)

---

## Error Code Ranges

| Range | Category | Description |
|-------|----------|-------------|
| 16000-16099 | General | Core code generation errors |
| 16100-16199 | Guidelines | Guideline resolution errors |
| 16200-16299 | Planning | Plan generation errors |
| 16300-16399 | Execution | Parallel execution errors |
| 16400-16499 | Git | Git operation errors |
| 16500-16599 | Build | Build verification errors |
| 16600-16699 | Credits | Credit system errors |
| 16700-16799 | Repository | Repository structure errors |

---

## Complete Error Registry

### General Errors (16000-16099)

| Code | Constant | HTTP | Retryable | Description |
|------|----------|------|-----------|-------------|
| 16000 | ErrCodegenUnknown | 500 | No | Unknown code generation error |
| 16001 | ErrCodegenNotEnabled | 403 | No | Code generation not enabled for project |
| 16002 | ErrCodegenRunNotFound | 404 | No | Generation run not found |
| 16003 | ErrCodegenRunAlreadyCompleted | 400 | No | Generation run already completed |
| 16004 | ErrCodegenRunCancelled | 400 | No | Generation run was cancelled |
| 16005 | ErrCodegenProjectLocked | 423 | Yes | Project has another generation in progress |
| 16006 | ErrCodegenTimeout | 504 | Yes | Generation timed out |
| 16007 | ErrCodegenCancelledByUser | 400 | No | Generation cancelled by user |

### Guideline Errors (16100-16199)

| Code | Constant | HTTP | Retryable | Description |
|------|----------|------|-----------|-------------|
| 16100 | ErrGuidelineNotFound | 404 | No | Guideline not found |
| 16101 | ErrGuidelineInvalidLevel | 400 | No | Invalid guideline level |
| 16102 | ErrGuidelineParseFailed | 500 | No | Failed to parse guideline sections |
| 16103 | ErrGuidelineResolutionFailed | 500 | Yes | Failed to resolve guidelines |
| 16104 | ErrGuidelineCircularRef | 400 | No | Circular reference in guidelines |
| 16105 | ErrGuidelineLanguageUnsupported | 400 | No | Language not supported |
| 16106 | ErrGuidelineDuplicateName | 409 | No | Guideline name already exists |
| 16107 | ErrGuidelineContentEmpty | 400 | No | Guideline content is empty |
| 16108 | ErrGuidelineVersionConflict | 409 | Yes | Guideline version conflict |

### Planning Errors (16200-16299)

| Code | Constant | HTTP | Retryable | Description |
|------|----------|------|-----------|-------------|
| 16200 | ErrPlanGenerationFailed | 500 | Yes | Failed to generate plan |
| 16201 | ErrPlanNoSpecs | 400 | No | No specifications provided |
| 16202 | ErrPlanSpecNotFound | 404 | No | Referenced specification not found |
| 16203 | ErrPlanSpecParseFailed | 400 | No | Failed to parse specification |
| 16204 | ErrPlanNoFiles | 400 | No | No files to generate from specs |
| 16205 | ErrPlanCircularDependency | 400 | No | Circular dependency in file plan |
| 16206 | ErrPlanDependencyResolutionFailed | 500 | Yes | Failed to resolve dependencies |
| 16207 | ErrPlanTooLarge | 400 | No | Plan exceeds maximum file count |
| 16208 | ErrPlanInvalidLanguage | 400 | No | Invalid target language specified |

### Execution Errors (16300-16399)

| Code | Constant | HTTP | Retryable | Description |
|------|----------|------|-----------|-------------|
| 16300 | ErrExecModelSelectFailed | 500 | Yes | Failed to select coding model |
| 16301 | ErrExecGenerationFailed | 500 | Yes | Code generation failed |
| 16302 | ErrExecWriteFailed | 500 | Yes | Failed to write generated file |
| 16303 | ErrExecBatchTimeout | 504 | Yes | Batch execution timeout |
| 16304 | ErrExecCircularDependency | 400 | No | Circular dependency detected |
| 16305 | ErrExecNoWorkers | 503 | Yes | No workers available |
| 16306 | ErrExecContextTooLarge | 400 | No | Context exceeds model limit |
| 16307 | ErrExecModelUnavailable | 503 | Yes | Coding model unavailable |
| 16308 | ErrExecModelTimeout | 504 | Yes | Model response timeout |
| 16309 | ErrExecInvalidResponse | 500 | Yes | Invalid model response format |
| 16310 | ErrExecCodeExtractionFailed | 500 | Yes | Failed to extract code from response |
| 16311 | ErrExecPathInvalid | 400 | No | Invalid file path in plan |
| 16312 | ErrExecPathTraversal | 403 | No | Path traversal attempt detected |

### Git Errors (16400-16499)

| Code | Constant | HTTP | Retryable | Description |
|------|----------|------|-----------|-------------|
| 16400 | ErrCodegenGitInitFailed | 500 | Yes | Failed to initialize repository |
| 16401 | ErrCodegenGitCommitFailed | 500 | Yes | Failed to commit changes |
| 16402 | ErrCodegenGitPushFailed | 500 | Yes | Failed to push to remote |
| 16403 | ErrCodegenGitPullFailed | 500 | Yes | Failed to pull from remote |
| 16404 | ErrCodegenGitConflict | 409 | No | Merge conflict detected |
| 16405 | ErrCodegenGitNoRemote | 400 | No | No remote configured |
| 16406 | ErrCodegenOauthNotConnected | 401 | No | OAuth not connected for provider |
| 16407 | ErrCodegenOauthTokenExpired | 401 | Yes | OAuth token expired |
| 16408 | ErrCodegenOauthRefreshFailed | 500 | Yes | Failed to refresh OAuth token |
| 16409 | ErrCodegenGitRepoCreateFailed | 500 | Yes | Failed to create remote repository |
| 16410 | ErrCodegenGitRepoNotFound | 404 | No | Remote repository not found |
| 16411 | ErrCodegenGitPermissionDenied | 403 | No | Git permission denied |
| 16412 | ErrCodegenGitStashFailed | 500 | Yes | Failed to stash changes |
| 16413 | ErrCodegenGitStashPopFailed | 500 | Yes | Failed to apply stashed changes |
| 16414 | ErrCodegenOauthStateMismatch | 400 | No | OAuth state mismatch |
| 16415 | ErrCodegenOauthProviderError | 502 | Yes | OAuth provider error |

### Build Errors (16500-16599)

| Code | Constant | HTTP | Retryable | Description |
|------|----------|------|-----------|-------------|
| 16500 | ErrBuildVerificationFailed | 500 | No | Build verification failed |
| 16501 | ErrBuildBrunNotFound | 500 | No | brun CLI not found |
| 16502 | ErrBuildBrunTimeout | 504 | Yes | brun execution timeout |
| 16503 | ErrBuildParseFailed | 500 | No | Failed to parse build output |
| 16504 | ErrBuildFixFailed | 500 | No | AI fix loop exhausted |
| 16505 | ErrBuildLanguageUnsupported | 400 | No | Language not supported by brun |
| 16506 | ErrBuildWorkspaceInvalid | 400 | No | Invalid build workspace |
| 16507 | ErrBuildDependenciesMissing | 400 | No | Build dependencies missing |
| 16508 | ErrBuildConfigInvalid | 400 | No | Invalid build configuration |

### Credit Errors (16600-16699)

| Code | Constant | HTTP | Retryable | Description |
|------|----------|------|-----------|-------------|
| 16600 | ErrCreditsInsufficient | 402 | No | Insufficient credits for operation |
| 16601 | ErrCreditsEstimationFailed | 500 | Yes | Failed to estimate credit cost |
| 16602 | ErrCreditsTransactionFailed | 500 | Yes | Failed to record transaction |
| 16603 | ErrCreditsPlanNotFound | 404 | No | Credit plan not found |
| 16604 | ErrCreditsPurchaseFailed | 500 | Yes | Credit purchase failed |
| 16605 | ErrCreditsNegativeBalance | 400 | No | Balance would be negative |
| 16606 | ErrCreditsUserNotFound | 404 | No | User credits not found |
| 16607 | ErrCreditsAlreadyRefunded | 400 | No | Transaction already refunded |

### Repository Structure Errors (16700-16799)

| Code | Constant | HTTP | Retryable | Description |
|------|----------|------|-----------|-------------|
| 16700 | ErrRepoCreateDirFailed | 500 | Yes | Failed to create directory |
| 16701 | ErrRepoTemplateFailed | 500 | Yes | Failed to generate template file |
| 16702 | ErrRepoInvalidStructure | 400 | No | Invalid custom structure |
| 16703 | ErrRepoCopySpecFailed | 500 | Yes | Failed to copy specification |
| 16704 | ErrRepoPathExists | 409 | No | Repository path already exists |
| 16705 | ErrRepoRootNotConfigured | 500 | No | Repository root not configured |
| 16706 | ErrRepoPermissionDenied | 403 | No | Repository permission denied |

---

## Go Error Definitions

```go
package codegen

import "errors"

// General Errors
var (
    ErrCodegenUnknown           = errors.New("ErrCodegenUnknown")
    ErrCodegenNotEnabled        = errors.New("ErrCodegenNotEnabled")
    ErrCodegenRunNotFound       = errors.New("ErrCodegenRunNotFound")
    ErrCodegenRunCompleted      = errors.New("ErrCodegenRunAlreadyCompleted")
    ErrCodegenRunCancelled      = errors.New("ErrCodegenRunCancelled")
    ErrCodegenProjectLocked     = errors.New("ErrCodegenProjectLocked")
    ErrCodegenTimeout           = errors.New("ErrCodegenTimeout")
    ErrCodegenCancelledByUser   = errors.New("ErrCodegenCancelledByUser")
)

// Guideline Errors
var (
    ErrGuidelineNotFound        = errors.New("ErrGuidelineNotFound")
    ErrGuidelineInvalidLevel    = errors.New("ErrGuidelineInvalidLevel")
    ErrGuidelineParseFailed     = errors.New("ErrGuidelineParseFailed")
    ErrGuidelineResolutionFailed = errors.New("ErrGuidelineResolutionFailed")
    ErrGuidelineCircularRef     = errors.New("ErrGuidelineCircularRef")
    ErrGuidelineLanguageUnsupported = errors.New("ErrGuidelineLanguageUnsupported")
)

// Execution Errors
var (
    ErrExecModelSelectFailed    = errors.New("ErrExecModelSelectFailed")
    ErrExecGenerationFailed     = errors.New("ErrExecGenerationFailed")
    ErrExecWriteFailed          = errors.New("ErrExecWriteFailed")
    ErrExecBatchTimeout         = errors.New("ErrExecBatchTimeout")
    ErrExecNoWorkers            = errors.New("ErrExecNoWorkers")
    ErrExecContextTooLarge      = errors.New("ErrExecContextTooLarge")
)

// Credit Errors
var (
    ErrCreditsInsufficient      = errors.New("ErrCreditsInsufficient")
    ErrCreditsEstimationFailed  = errors.New("ErrCreditsEstimationFailed")
    ErrCreditsTransactionFailed = errors.New("ErrCreditsTransactionFailed")
)

// ErrorCode mapping — UPDATED: 12xxx → 16xxx
var ErrorCodeMap = map[string]int{
    "ErrCodegenUnknown":           16000,
    "ErrCodegenNotEnabled":        16001,
    "ErrCodegenRunNotFound":       16002,
    // ... etc
}

func GetHttpStatus(code int) int {
    switch {
    case code >= 16000 && code < 16100:
        return getGeneralHttpStatus(code)
    case code >= 16100 && code < 16200:
        return getGuidelineHttpStatus(code)
    case code >= 16200 && code < 16300:
        return getPlanHttpStatus(code)
    case code >= 16300 && code < 16400:
        return getExecHttpStatus(code)
    case code >= 16400 && code < 16500:
        return getGitHttpStatus(code)
    case code >= 16500 && code < 16600:
        return getBuildHttpStatus(code)
    case code >= 16600 && code < 16700:
        return getCreditHttpStatus(code)
    case code >= 16700 && code < 16800:
        return getRepoHttpStatus(code)
    default:
        return 500
    }
}

func IsRetryable(code int) bool {
    retryableCodes := map[int]bool{
        16005: true, 16006: true,           // General
        16103: true, 16108: true,           // Guidelines
        16200: true, 16206: true,           // Planning
        16300: true, 16301: true, 16302: true, 16303: true, 16305: true, 16307: true, 16308: true, 16309: true, 16310: true, // Execution
        16400: true, 16401: true, 16402: true, 16403: true, 16407: true, 16408: true, 16409: true, 16412: true, 16413: true, 16415: true, // Git
        16502: true,                        // Build
        16601: true, 16602: true, 16604: true, // Credits
        16700: true, 16701: true, 16703: true, // Repository
    }
    return retryableCodes[code]
}
```

---

## TypeScript Error Types

```typescript
export enum CodegenErrorCode {
    // General
    UNKNOWN = 16000,
    NOT_ENABLED = 16001,
    RUN_NOT_FOUND = 16002,
    RUN_ALREADY_COMPLETED = 16003,
    RUN_CANCELLED = 16004,
    PROJECT_LOCKED = 16005,
    TIMEOUT = 16006,
    CANCELLED_BY_USER = 16007,
    
    // Guidelines
    GUIDELINE_NOT_FOUND = 16100,
    GUIDELINE_INVALID_LEVEL = 16101,
    // ... etc
    
    // Credits
    CREDITS_INSUFFICIENT = 16600,
    // ... etc
}

export function isRetryable(code: CodegenErrorCode): boolean {
    const retryableCodes = new Set([
        CodegenErrorCode.PROJECT_LOCKED,
        CodegenErrorCode.TIMEOUT,
        // ... etc
    ]);
    return retryableCodes.has(code);
}

export function getErrorMessage(code: CodegenErrorCode): string {
    const messages: Record<CodegenErrorCode, string> = {
        [CodegenErrorCode.UNKNOWN]: 'An unknown error occurred',
        [CodegenErrorCode.CREDITS_INSUFFICIENT]: 'Insufficient credits. Please add more credits to continue.',
        // ... etc
    };
    return messages[code] ?? 'Unknown error';
}
```

---

## Migration Notes

### 12xxx → 16xxx Mapping

| Old Code | New Code | Category |
|----------|----------|----------|
| 12000-12099 | 16000-16099 | General |
| 12100-12199 | 16100-16199 | Guidelines |
| 12200-12299 | 16200-16299 | Planning |
| 12300-12399 | 16300-16399 | Execution |
| 12400-12499 | 16400-16499 | Git |
| 12500-12599 | 16500-16599 | Build |
| 12600-12699 | 16600-16699 | Credits |
| 12700-12799 | 16700-16799 | Repository |

**Reason:** The 12xxx range collided with WP SEO Publish CLI (WSP, 12000-12599). The Code Generation System was reassigned to 16000-16799 to eliminate the overlap.

---

## Related Specs

- [Error Management](../../06-error-management/00-overview.md)
- [Error Code Registry](../../06-error-management/01-error-code-registry.md)
- [Master Registry](../../../03-error-code-registry/01-registry.md)
- [API Endpoints](./13-api-endpoints.md)
