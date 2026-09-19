# AI Bridge: AI SEO Generate - Error Codes Specification

**Version:** 5.0.0  
**Status:** Complete  
**Updated:** 2026-03-09  

---

## Overview

This document defines error codes, handling patterns, and recovery strategies for the AI SEO Generate module. All error codes fall within the **9500-9599** range reserved for AI SEO functionality.

---

## Error Code Ranges

| Range | Category | Description |
|-------|----------|-------------|
| 9500 | Reserved | Module initialization |
| 9501-9510 | Preset & Template | Preset loading, template parsing |
| 9511-9520 | File Upload | ZIP handling, parsing, validation |
| 9521-9530 | Job Management | Job lifecycle, WebSocket |
| 9531-9540 | Import/Export | Bundle operations |
| 9541-9550 | FAQ Generation | FAQ training, generation, schema |
| 9551-9599 | Reserved | Future expansion |

---

## Error Definitions

### 9501-9510: Preset & Template Errors

| Code | Name | Message | HTTP | Retryable |
|------|------|---------|------|-----------|
| AB-9501 | `ErrSeoPresetNotFound` | Industry preset not found | 404 | No |
| AB-9502 | `ErrSeoTemplateNotFound` | Template file not found in preset | 404 | No |
| AB-9503 | `ErrSeoVariableMissing` | Required template variable not provided | 400 | No |
| AB-9504 | `ErrSeoGenerationFailed` | Page generation failed | 500 | Yes |
| AB-9505 | `ErrSeoContextInjectionFailed` | Failed to inject RAG context | 500 | Yes |
| AB-9506 | `ErrSeoLlmTimeout` | LLM response timeout during generation | 504 | Yes |
| AB-9507 | `ErrSeoTokenLimitExceeded` | Content exceeds token limit | 400 | No |
| AB-9508 | `ErrSeoOutputWriteFailed` | Failed to write generated output | 500 | Yes |
| AB-9509 | `ErrSeoBatchLimitExceeded` | Batch exceeds maximum page limit | 400 | No |
| AB-9510 | `ErrSeoPresetInvalid` | Preset structure is invalid | 400 | No |

### 9511-9520: File Upload Errors

| Code | Name | Message | HTTP | Retryable |
|------|------|---------|------|-----------|
| AB-9511 | `ErrSeoUploadFailed` | ZIP upload failed | 500 | Yes |
| AB-9512 | `ErrSeoUploadTooLarge` | Upload exceeds size limit | 413 | No |
| AB-9513 | `ErrSeoUnsupportedFormat` | File format not supported | 400 | No |
| AB-9514 | `ErrSeoCircularDependency` | Circular dependency detected in files | 400 | No |
| AB-9515 | `ErrSeoParseMarkdownFailed` | Failed to parse Markdown file | 400 | No |
| AB-9516 | `ErrSeoParseHtmlFailed` | Failed to parse HTML template | 400 | No |
| AB-9517 | `ErrSeoParseCsvFailed` | Failed to parse CSV file | 400 | No |
| AB-9518 | `ErrSeoParseSqliteFailed` | Failed to read SQLite database | 400 | No |
| AB-9519 | `ErrSeoExtractionFailed` | ZIP extraction failed | 500 | Yes |
| AB-9520 | `ErrSeoIngestFailed` | Failed to ingest files into RAG | 500 | Yes |

### 9521-9530: Job Management Errors

| Code | Name | Message | HTTP | Retryable |
|------|------|---------|------|-----------|
| AB-9521 | `ErrSeoJobNotFound` | Generation job not found | 404 | No |
| AB-9522 | `ErrSeoJobAlreadyRunning` | Job already in progress | 409 | No |
| AB-9523 | `ErrSeoJobCancelled` | Job was cancelled | 499 | No |
| AB-9524 | `ErrSeoJobFailed` | Job failed during execution | 500 | Yes |
| AB-9525 | `ErrSeoWebsocketFailed` | WebSocket connection failed | 500 | Yes |
| AB-9526 | `ErrSeoProgressSendFailed` | Failed to send progress update | 500 | Yes |

### 9531-9540: Import/Export Errors

| Code | Name | Message | HTTP | Retryable |
|------|------|---------|------|-----------|
| AB-9531 | `ErrSeoExportFailed` | Failed to export bundle | 500 | Yes |
| AB-9532 | `ErrSeoImportFailed` | Failed to import bundle | 500 | Yes |
| AB-9533 | `ErrSeoBundleInvalid` | Bundle format is invalid | 400 | No |
| AB-9534 | `ErrSeoBundleVersionMismatch` | Bundle version not compatible | 400 | No |
| AB-9535 | `ErrSeoBundleCorrupt` | Bundle file is corrupted | 400 | No |

### 9541-9550: FAQ Generation Errors

| Code | Name | Message | HTTP | Retryable |
|------|------|---------|------|-----------|
| AB-9541 | `ErrFaqTrainingFailed` | FAQ training data ingestion failed | 500 | Yes |
| AB-9542 | `ErrFaqCompanyNotFound` | No training data for company | 404 | No |
| AB-9543 | `ErrFaqRagRetrievalFailed` | Failed to retrieve from FAQ RAG | 500 | Yes |
| AB-9544 | `ErrFaqGenerationFailed` | FAQ AI generation failed | 500 | Yes |
| AB-9545 | `ErrFaqSchemaInvalid` | Generated FAQ schema is invalid | 400 | No |
| AB-9546 | `ErrFaqOutputFormatUnsupported` | Requested FAQ format not supported | 400 | No |
| AB-9547 | `ErrFaqWordLimitExceeded` | FAQ answer exceeds word limit | 400 | No |
| AB-9548 | `ErrFaqTransitionDensityLow` | FAQ below minimum transition density | 400 | No |
| AB-9549 | `ErrFaqGsearchFailed` | GSearch integration failed for FAQ | 500 | Yes |
| AB-9550 | `ErrFaqYoutubeSearchFailed` | YouTube video search failed for FAQ | 500 | Yes |

---

## Error Handling Patterns

### Go Error Types

```go
package seo

import (
    "fmt"
    "time"
)

// SeoError represents an AI SEO module error
type SeoError struct {
    Code       int
    Name       string
    Message    string
    Details    string            `json:",omitempty"`
    Context    SeoErrorContext   `json:",omitempty"`
    Retryable  bool
    HttpStatus int
    Timestamp  time.Time
}

func (e *SeoError) Error() string {
    return fmt.Sprintf("[AB-%d] %s: %s", e.Code, e.Name, e.Message)
}

// SeoErrorContext provides strongly-typed context for SEO errors
type SeoErrorContext struct {
    Required         []string          `json:",omitempty"`
    Provided         []string          `json:",omitempty"`
    Cycle            []string          `json:",omitempty"`
    Supported        []string          `json:",omitempty"`
    SupportedFormats map[string]bool   `json:",omitempty"`
}

// Error constructors
var (
    ErrPresetNotFound = func(preset string) *SeoError {
        return &SeoError{
            Code:       9501,
            Name:       "ErrSeoPresetNotFound",
            Message:    "Industry preset not found",
            Details:    fmt.Sprintf("Preset '%s' does not exist", preset),
            HttpStatus: 404,
            Retryable:  false,
            Timestamp:  time.Now(),
        }
    }

    ErrTemplateNotFound = func(template, preset string) *SeoError {
        return &SeoError{
            Code:       9502,
            Name:       "ErrSeoTemplateNotFound",
            Message:    "Template file not found in preset",
            Details:    fmt.Sprintf("Template '%s' not found in preset '%s'", template, preset),
            HttpStatus: 404,
            Retryable:  false,
            Timestamp:  time.Now(),
        }
    }

    ErrVariableMissing = func(variable string, required []string) *SeoError {
        return &SeoError{
            Code:       9503,
            Name:       "ErrSeoVariableMissing",
            Message:    "Required template variable not provided",
            Details:    fmt.Sprintf("Missing variable: %s", variable),
            Context:    SeoErrorContext{Required: required},
            HttpStatus: 400,
            Retryable:  false,
            Timestamp:  time.Now(),
        }
    }

    ErrCircularDependency = func(cycle []string) *SeoError {
        return &SeoError{
            Code:       9514,
            Name:       "ErrSeoCircularDependency",
            Message:    "Circular dependency detected in files",
            Details:    fmt.Sprintf("Cycle: %v", cycle),
            Context:    SeoErrorContext{Cycle: cycle},
            HttpStatus: 400,
            Retryable:  false,
            Timestamp:  time.Now(),
        }
    }

    ErrUploadTooLarge = func(size, maxSize int64) *SeoError {
        return &SeoError{
            Code:       9512,
            Name:       "ErrSeoUploadTooLarge",
            Message:    "Upload exceeds size limit",
            Details:    fmt.Sprintf("Size: %d bytes, Max: %d bytes", size, maxSize),
            HttpStatus: 413,
            Retryable:  false,
            Timestamp:  time.Now(),
        }
    }

    // FAQ Error Constructors
    ErrFaqTrainingFailed = func(company string, reason string) *SeoError {
        return &SeoError{
            Code:       9541,
            Name:       "ErrFaqTrainingFailed",
            Message:    "FAQ training data ingestion failed",
            Details:    fmt.Sprintf("Company: %s, Reason: %s", company, reason),
            HttpStatus: 500,
            Retryable:  true,
            Timestamp:  time.Now(),
        }
    }

    ErrFaqCompanyNotFound = func(company string) *SeoError {
        return &SeoError{
            Code:       9542,
            Name:       "ErrFaqCompanyNotFound",
            Message:    "No training data for company",
            Details:    fmt.Sprintf("Company '%s' has no FAQ training data", company),
            HttpStatus: 404,
            Retryable:  false,
            Timestamp:  time.Now(),
        }
    }

    ErrFaqRagRetrievalFailed = func(company string) *SeoError {
        return &SeoError{
            Code:       9543,
            Name:       "ErrFaqRagRetrievalFailed",
            Message:    "Failed to retrieve from FAQ RAG",
            Details:    fmt.Sprintf("RAG retrieval failed for company: %s", company),
            HttpStatus: 500,
            Retryable:  true,
            Timestamp:  time.Now(),
        }
    }

    ErrFaqGenerationFailed = func(question string, reason string) *SeoError {
        return &SeoError{
            Code:       9544,
            Name:       "ErrFaqGenerationFailed",
            Message:    "FAQ AI generation failed",
            Details:    fmt.Sprintf("Question: %s, Reason: %s", question, reason),
            HttpStatus: 500,
            Retryable:  true,
            Timestamp:  time.Now(),
        }
    }

    ErrFaqSchemaInvalid = func(issue string) *SeoError {
        return &SeoError{
            Code:       9545,
            Name:       "ErrFaqSchemaInvalid",
            Message:    "Generated FAQ schema is invalid",
            Details:    issue,
            HttpStatus: 400,
            Retryable:  false,
            Timestamp:  time.Now(),
        }
    }

    ErrFaqOutputFormatUnsupported = func(format string, supported []string) *SeoError {
        return &SeoError{
            Code:       9546,
            Name:       "ErrFaqOutputFormatUnsupported",
            Message:    "Requested FAQ format not supported",
            Details:    fmt.Sprintf("Format '%s' not supported", format),
            Context:    SeoErrorContext{Supported: supported},
            HttpStatus: 400,
            Retryable:  false,
            Timestamp:  time.Now(),
        }
    }

    ErrFaqWordLimitExceeded = func(words, limit int) *SeoError {
        return &SeoError{
            Code:       9547,
            Name:       "ErrFaqWordLimitExceeded",
            Message:    "FAQ answer exceeds word limit",
            Details:    fmt.Sprintf("Words: %d, Limit: %d", words, limit),
            HttpStatus: 400,
            Retryable:  false,
            Timestamp:  time.Now(),
        }
    }

    ErrFaqTransitionDensityLow = func(density, required float64) *SeoError {
        return &SeoError{
            Code:       9548,
            Name:       "ErrFaqTransitionDensityLow",
            Message:    "FAQ below minimum transition density",
            Details:    fmt.Sprintf("Density: %.1f%%, Required: %.1f%%", density, required),
            HttpStatus: 400,
            Retryable:  false,
            Timestamp:  time.Now(),
        }
    }

    ErrFaqGSearchFailed = func(reason string) *SeoError {
        return &SeoError{
            Code:       9549,
            Name:       "ErrFaqGsearchFailed",
            Message:    "GSearch integration failed for FAQ",
            Details:    reason,
            HttpStatus: 500,
            Retryable:  true,
            Timestamp:  time.Now(),
        }
    }

    ErrFaqYouTubeSearchFailed = func(query string) *SeoError {
        return &SeoError{
            Code:       9550,
            Name:       "ErrFaqYoutubeSearchFailed",
            Message:    "YouTube video search failed for FAQ",
            Details:    fmt.Sprintf("Search query: %s", query),
            HttpStatus: 500,
            Retryable:  true,
            Timestamp:  time.Now(),
        }
    }
)
```

### Retry Logic

```go
// RetryConfig defines retry behavior for recoverable errors
type RetryConfig struct {
    MaxAttempts     int
    InitialDelay    time.Duration
    MaxDelay        time.Duration
    BackoffFactor   float64
}

var DefaultRetryConfig = RetryConfig{
    MaxAttempts:   3,
    InitialDelay:  500 * time.Millisecond,
    MaxDelay:      10 * time.Second,
    BackoffFactor: 2.0,
}

// IsRetryable checks if error code is retryable
func IsRetryable(code int) bool {
    retryable := map[int]bool{
        9504: true,  // Generation failed
        9505: true,  // Context injection failed
        9506: true,  // LLM timeout
        9508: true,  // Output write failed
        9511: true,  // Upload failed
        9519: true,  // Extraction failed
        9520: true,  // Ingest failed
        9524: true,  // Job failed
        9525: true,  // WebSocket failed
        9526: true,  // Progress send failed
        9531: true,  // Export failed
        9532: true,  // Import failed
        // FAQ retryable errors
        9541: true,  // FAQ training failed
        9543: true,  // FAQ RAG retrieval failed
        9544: true,  // FAQ generation failed
        9549: true,  // FAQ GSearch failed
        9550: true,  // FAQ YouTube search failed
    }
    return retryable[code]
}

// RetryWithBackoff executes operation with exponential backoff
func RetryWithBackoff(context stdctx.Context, cfg RetryConfig, op func() *appfault.AppError) *appfault.AppError {
    var lastErr *appfault.AppError
    delay := cfg.InitialDelay

    for attempt := 1; attempt <= cfg.MaxAttempts; attempt++ {
        err := op()
        if err == nil {
            return nil
        }

        // Check if error is retryable
        var seoErr *SeoError
        isNonRetryable := errors.As(err, &seoErr) && !seoErr.Retryable
        if isNonRetryable {
            return err
        }

        lastErr = err

        if attempt < cfg.MaxAttempts {
            select {
            case <-context.Done():
                return appfault.Wrap(
                    context.Err(),
                    ErrSeoRetryContextCancelled,
                    "retry cancelled by context",
                )
            case <-time.After(delay):
            }
            delay = time.Duration(float64(delay) * cfg.BackoffFactor)
            if delay > cfg.MaxDelay {
                delay = cfg.MaxDelay
            }
        }
    }

    return appfault.Wrap(
        lastErr,
        ErrSeoRetryExhausted,
        "max retries exceeded after %d attempts",
        cfg.MaxAttempts,
    )
}
```

### WebSocket Error Broadcasting

```go
// ProgressError represents an error in the progress stream
type ProgressError struct {
    JobId     string
    Error     *SeoError
    ItemIndex int       `json:",omitempty"`
    Timestamp time.Time
}

// BroadcastError sends error to connected WebSocket clients
func (s *SeoService) BroadcastError(jobId string, err *SeoError, itemIndex int) {
    msg := ProgressError{
        JobId:     jobId,
        Error:     err,
        ItemIndex: itemIndex,
        Timestamp: time.Now(),
    }
    
    s.wsHub.Broadcast(jobId, WebSocketMessage{
        Type:    "error",
        Payload: msg,
    })
}
```

---

## API Error Responses

### Standard Error Response

```json
{
  "error": {
    "code": 9503,
    "name": "ErrSeoVariableMissing",
    "message": "Required template variable not provided",
    "details": "Missing variable: business_name",
    "context": {
      "required": ["business_name", "city", "service_type"],
      "provided": ["city", "service_type"]
    },
    "retryable": false,
    "timestamp": "2026-02-02T10:30:00Z"
  }
}
```

### Batch Processing Error Response

```json
{
  "jobId": "seo-job-123",
  "status": "partial_failure",
  "completed": 45,
  "failed": 5,
  "total": 50,
  "errors": [
    {
      "itemIndex": 12,
      "error": {
        "code": 9507,
        "name": "ErrSeoTokenLimitExceeded",
        "message": "Content exceeds token limit",
        "details": "Generated content: 5200 tokens, limit: 4096 tokens"
      }
    },
    {
      "itemIndex": 23,
      "error": {
        "code": 9506,
        "name": "ErrSeoLlmTimeout",
        "message": "LLM response timeout during generation",
        "details": "Timeout after 30s"
      }
    }
  ]
}
```

---

## Validation Error Patterns

### Template Variable Validation

```go
func ValidateTemplateVariables(template string, vars map[string]string) *SeoError {
    required := extractRequiredVariables(template)
    missing := []string{}
    
    for _, v := range required {
        if _, ok := vars[v]; !ok {
            missing = append(missing, v)
        }
    }
    
    if len(missing) > 0 {
        return ErrVariableMissing(missing[0], required)
    }
    return nil
}
```

### File Format Validation

```go
var supportedFormats = map[string]bool{
    ".md":     true,
    ".txt":    true,
    ".html":   true,
    ".csv":    true,
    ".db":     true,
    ".sqlite": true,
}

func ValidateFileFormat(filename string) *SeoError {
    ext := filepath.Ext(filename)
    if !supportedFormats[ext] {
        return &SeoError{
            Code:       9513,
            Name:       "ErrSeoUnsupportedFormat",
            Message:    "File format not supported",
            Details:    fmt.Sprintf("Extension '%s' is not supported", ext),
            Context:    SeoErrorContext{SupportedFormats: supportedFormats},
            HttpStatus: 400,
            Retryable:  false,
            Timestamp:  time.Now(),
        }
    }
    return nil
}
```

---

## Recovery Strategies

| Error Code | Strategy | Action |
|------------|----------|--------|
| 9504 | Retry | Retry generation with exponential backoff |
| 9505 | Fallback | Generate without RAG context, mark as degraded |
| 9506 | Retry + Reduce | Retry with reduced token budget |
| 9508 | Retry | Retry write operation |
| 9511 | Retry | Retry upload with fresh connection |
| 9519 | Retry | Retry extraction with clean temp directory |
| 9520 | Partial | Ingest successful files, report failures |

---

## Logging Standards

```go
// Error logging with structured context
func LogSeoError(err *SeoError, ctx SeoErrorContext) {
    log.Error().
        Int("code", err.Code).
        Str("name", err.Name).
        Str("message", err.Message).
        Str("details", err.Details).
        Bool("retryable", err.Retryable).
        Int("HttpStatus", err.HttpStatus).
        Interface("context", ctx).
        Time("timestamp", err.Timestamp).
        Msg("AI SEO error")
}
```

---

## See Also

- [AI SEO Generate Specification](./13-ai-seo-generate.md)
- [AI SEO Implementation Checklist](./15-ai-seo-implementation-checklist.md)
- [Error Code Registry](../../03-error-manage/03-error-code-registry/02-registry.md)
- [AI Bridge Error Codes](./05-error-codes.md)
