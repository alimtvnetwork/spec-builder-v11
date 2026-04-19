# RAG Configuration Validation Helpers

**Version:** 2.0.0  
**Created:** 2026-02-02  
**Updated:** 2026-03-09  
**Status:** Active  
**Parent:** [02-rag-chunk-settings.md](./02-rag-chunk-settings.md)

---

## Overview

This document specifies validation helper patterns for RAG configuration settings in Go, including validators, error handling, and API integration.

---

## Error Code Mapping

| Error Code | Name | Validation Rule |
|------------|------|-----------------|
| AB-9301 | `RAG_CHUNK_SIZE_INVALID` | ChunkSize outside 256-8192 range |
| AB-9302 | `RAG_CHUNK_SIZE_NOT_MULTIPLE` | ChunkSize not multiple of 256 |
| AB-9303 | `RAG_OVERLAP_TOO_LARGE` | ChunkOverlap > 25% of ChunkSize |
| AB-9304 | `RAG_CONTEXT_BUDGET_INVALID` | ContextTokenBudget outside 512-16384 |
| AB-9305 | `RAG_EMBEDDING_MODEL_INVALID` | Unsupported embedding model |
| AB-9306 | `RAG_SIMILARITY_THRESHOLD_INVALID` | Threshold outside 0.0-1.0 |
| AB-9307 | `RAG_TOPK_INVALID` | TopK outside 1-50 range |
| AB-9308 | `RAG_CONFIG_LOAD_FAILED` | Failed to load configuration |
| AB-9309 | `RAG_CONFIG_SAVE_FAILED` | Failed to save configuration |
| AB-9310 | `RAG_CONFIG_SOURCE_CONFLICT` | Conflicting multi-source config |

---

## Go Implementation

### Core Types

```go
package rag

import (
    "fmt"
    "time"
)

// RagConfig represents the complete RAG configuration
type RagConfig struct {
    ChunkSize           int
    ChunkOverlap        int
    ContextTokenBudget  int
    EmbeddingModel      string
    SimilarityThreshold float64
    TopK                int
    Source              string // "seed", "root", "app"
}

// RagValidationError represents a validation failure
type RagValidationError struct {
    Code      int
    Name      string
    Message   string
    Field     string
    Value     any
    Expected  string
    Timestamp time.Time
}

func (e *RagValidationError) Error() string {
    return fmt.Sprintf("[AB-%d] %s: %s (field=%s, value=%v)", 
        e.Code, e.Name, e.Message, e.Field, e.Value)
}

// Supported embedding models
var SupportedEmbeddingModels = map[string]bool{
    "nomic-embed-text":        true,
    "text-embedding-3-small":  true,
    "text-embedding-3-large":  true,
    "all-MiniLM-L6-v2":        true,
}
```

### Validator Interface

```go
// ConfigValidator defines the validation interface
type ConfigValidator interface {
    Validate(config *RagConfig) []RagValidationError
}

// DefaultValidator implements ConfigValidator
type DefaultValidator struct{}

func (v *DefaultValidator) Validate(config *RagConfig) []RagValidationError {
    var errors []RagValidationError
    
    // ChunkSize validation
    if err := v.validateChunkSize(config.ChunkSize); err != nil {
        errors = append(errors, *err)
    }
    
    // ChunkOverlap validation (depends on ChunkSize)
    if err := v.validateChunkOverlap(config.ChunkOverlap, config.ChunkSize); err != nil {
        errors = append(errors, *err)
    }
    
    // ContextTokenBudget validation
    if err := v.validateContextBudget(config.ContextTokenBudget); err != nil {
        errors = append(errors, *err)
    }
    
    // EmbeddingModel validation
    if err := v.validateEmbeddingModel(config.EmbeddingModel); err != nil {
        errors = append(errors, *err)
    }
    
    // SimilarityThreshold validation
    if err := v.validateSimilarityThreshold(config.SimilarityThreshold); err != nil {
        errors = append(errors, *err)
    }
    
    // TopK validation
    if err := v.validateTopK(config.TopK); err != nil {
        errors = append(errors, *err)
    }
    
    return errors
}
```

### Individual Validators

```go
func (v *DefaultValidator) validateChunkSize(size int) *RagValidationError {
    if size < 256 || size > 8192 {
        return &RagValidationError{
            Code:      9301,
            Name:      "RAG_CHUNK_SIZE_INVALID",
            Message:   "Chunk size outside valid range",
            Field:     "ChunkSize",
            Value:     size,
            Expected:  "256-8192",
            Timestamp: time.Now(),
        }
    }
    
    if size%256 != 0 {
        return &RagValidationError{
            Code:      9302,
            Name:      "RAG_CHUNK_SIZE_NOT_MULTIPLE",
            Message:   "Chunk size must be multiple of 256",
            Field:     "ChunkSize",
            Value:     size,
            Expected:  "Multiple of 256",
            Timestamp: time.Now(),
        }
    }
    
    return nil
}

func (v *DefaultValidator) validateChunkOverlap(overlap, chunkSize int) *RagValidationError {
    if overlap < 0 || overlap > 512 {
        return &RagValidationError{
            Code:      9303,
            Name:      "RAG_OVERLAP_TOO_LARGE",
            Message:   "Chunk overlap outside valid range",
            Field:     "ChunkOverlap",
            Value:     overlap,
            Expected:  "0-512",
            Timestamp: time.Now(),
        }
    }
    
    // Overlap cannot exceed 25% of chunk size
    maxOverlap := chunkSize / 4
    if overlap > maxOverlap {
        return &RagValidationError{
            Code:      9303,
            Name:      "RAG_OVERLAP_TOO_LARGE",
            Message:   fmt.Sprintf("Chunk overlap cannot exceed 25%% of chunk size (%d)", maxOverlap),
            Field:     "ChunkOverlap",
            Value:     overlap,
            Expected:  fmt.Sprintf("<= %d (25%% of ChunkSize)", maxOverlap),
            Timestamp: time.Now(),
        }
    }
    
    return nil
}

func (v *DefaultValidator) validateContextBudget(budget int) *RagValidationError {
    if budget < 512 || budget > 16384 {
        return &RagValidationError{
            Code:      9304,
            Name:      "RAG_CONTEXT_BUDGET_INVALID",
            Message:   "Context token budget outside valid range",
            Field:     "ContextTokenBudget",
            Value:     budget,
            Expected:  "512-16384",
            Timestamp: time.Now(),
        }
    }
    return nil
}

func (v *DefaultValidator) validateEmbeddingModel(model string) *RagValidationError {
    if !SupportedEmbeddingModels[model] {
        return &RagValidationError{
            Code:      9305,
            Name:      "RAG_EMBEDDING_MODEL_INVALID",
            Message:   "Embedding model not supported",
            Field:     "EmbeddingModel",
            Value:     model,
            Expected:  "nomic-embed-text, text-embedding-3-small, text-embedding-3-large, all-MiniLM-L6-v2",
            Timestamp: time.Now(),
        }
    }
    return nil
}

func (v *DefaultValidator) validateSimilarityThreshold(threshold float64) *RagValidationError {
    if threshold < 0.0 || threshold > 1.0 {
        return &RagValidationError{
            Code:      9306,
            Name:      "RAG_SIMILARITY_THRESHOLD_INVALID",
            Message:   "Similarity threshold outside valid range",
            Field:     "SimilarityThreshold",
            Value:     threshold,
            Expected:  "0.0-1.0",
            Timestamp: time.Now(),
        }
    }
    return nil
}

func (v *DefaultValidator) validateTopK(topK int) *RagValidationError {
    if topK < 1 || topK > 50 {
        return &RagValidationError{
            Code:      9307,
            Name:      "RAG_TOPK_INVALID",
            Message:   "TopK outside valid range",
            Field:     "TopK",
            Value:     topK,
            Expected:  "1-50",
            Timestamp: time.Now(),
        }
    }
    return nil
}
```

### Validation Service

```go
// RagConfigService handles loading, validation, and saving of RAG config
type RagConfigService struct {
    validator ConfigValidator
    seedPath  string
    rootDb    string
}

func NewRagConfigService(seedPath, rootDb string) *RagConfigService {
    return &RagConfigService{
        validator: &DefaultValidator{},
        seedPath:  seedPath,
        rootDb:    rootDb,
    }
}

// Load retrieves config with priority resolution
func (s *RagConfigService) Load(appName string) apperror.Result[*RagConfig] {
    config := &RagConfig{}
    
    // 1. Load seed defaults
    seedConfig, err := s.loadSeed()
    if err != nil {
        return nil, &RagValidationError{
            Code:    9308,
            Name:    "RAG_CONFIG_LOAD_FAILED",
            Message: "Failed to load seed configuration",
            Field:   "seed",
            Value:   s.seedPath,
        }
    }
    *config = *seedConfig
    config.Source = "seed"
    
    // 2. Override with root DB settings
    if rootConfig, err := s.loadRootDb(); err == nil {
        s.mergeConfig(config, rootConfig, "root")
    }
    
    // 3. Override with app-level settings
    if appName != "" {
        if appConfig, err := s.loadAppDb(appName); err == nil {
            s.mergeConfig(config, appConfig, "app")
        }
    }
    
    // Validate final config
    if errors := s.validator.Validate(config); len(errors) > 0 {
        return nil, &errors[0]
    }
    
    return config, nil
}

// Save persists config with validation
func (s *RagConfigService) Save(appName string, config *RagConfig) error {
    // Validate before saving
    if errors := s.validator.Validate(config); len(errors) > 0 {
        return &errors[0]
    }
    
    // Save to appropriate location
    if appName != "" {
        return s.saveAppDb(appName, config)
    }
    return s.saveRootDb(config)
}

// RagConfigUpdate holds typed partial update fields
type RagConfigUpdate struct {
    ChunkSize           *int     `json:"ChunkSize,omitempty"`
    ChunkOverlap        *int     `json:"ChunkOverlap,omitempty"`
    ContextTokenBudget  *int     `json:"ContextTokenBudget,omitempty"`
    EmbeddingModel      *string  `json:"EmbeddingModel,omitempty"`
    SimilarityThreshold *float64 `json:"SimilarityThreshold,omitempty"`
    TopK                *int     `json:"TopK,omitempty"`
}

// ValidatePartial validates only provided fields
func (s *RagConfigService) ValidatePartial(updates *RagConfigUpdate) []RagValidationError {
    var errors []RagValidationError
    
    if updates.ChunkSize != nil {
        if err := (&DefaultValidator{}).validateChunkSize(*updates.ChunkSize); err != nil {
            errors = append(errors, *err)
        }
    }
    
    // Check overlap with size if both provided
    if updates.ChunkOverlap != nil {
        chunkSize := 2048 // default
        if updates.ChunkSize != nil {
            chunkSize = *updates.ChunkSize
        }
        if err := (&DefaultValidator{}).validateChunkOverlap(*updates.ChunkOverlap, chunkSize); err != nil {
            errors = append(errors, *err)
        }
    }
    
    // Continue for other fields...
    return errors
}

func (s *RagConfigService) mergeConfig(base *RagConfig, override *RagConfig, source string) {
    if override.ChunkSize != 0 {
        base.ChunkSize = override.ChunkSize
        base.Source = source
    }
    if override.ChunkOverlap != 0 {
        base.ChunkOverlap = override.ChunkOverlap
    }
    if override.ContextTokenBudget != 0 {
        base.ContextTokenBudget = override.ContextTokenBudget
    }
    if override.EmbeddingModel != "" {
        base.EmbeddingModel = override.EmbeddingModel
    }
    if override.SimilarityThreshold != 0 {
        base.SimilarityThreshold = override.SimilarityThreshold
    }
    if override.TopK != 0 {
        base.TopK = override.TopK
    }
}
```

---

## API Integration

### Validation Middleware

```go
// ValidationMiddleware validates RAG config in requests
func ValidationMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        if r.Method == "PUT" || r.Method == "POST" {
            var config RagConfig
            if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
                http.Error(w, "Invalid JSON", http.StatusBadRequest)
                return
            }
            
            validator := &DefaultValidator{}
            if errors := validator.Validate(&config); len(errors) > 0 {
                w.Header().Set("Content-Type", "application/json")
                w.WriteHeader(http.StatusBadRequest)
                json.NewEncoder(w).Encode(RagValidationErrorResponse{
                    Errors: errors,
                })
                return
            }
            
            // Re-encode for next handler
            encoded, _ := json.Marshal(config)
            r.Body = io.NopCloser(bytes.NewReader(encoded))
        }
        next.ServeHTTP(w, r)
    })
}
```

### API Handler

```go
// UpdateRagSettings handles PUT /api/v1/settings/rag
func (h *SettingsHandler) UpdateRagSettings(w http.ResponseWriter, r *http.Request) {
    var updates RagConfigUpdate
    if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
        h.respondError(w, 9308, "Invalid request body", http.StatusBadRequest)
        return
    }
    
    // Validate partial updates
    if errors := h.configService.ValidatePartial(&updates); len(errors) > 0 {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(RagValidationErrorResponse{
            Error:  &errors[0],
            Errors: errors,
        })
        return
    }
    
    // Load current config
    appName := r.URL.Query().Get("app")
    config, err := h.configService.Load(appName)
    if err != nil {
        h.respondError(w, 9308, "Failed to load config", http.StatusInternalServerError)
        return
    }
    
    // Apply typed updates
    if updates.ChunkSize != nil {
        config.ChunkSize = *updates.ChunkSize
    }
    if updates.ChunkOverlap != nil {
        config.ChunkOverlap = *updates.ChunkOverlap
    }
    if updates.ContextTokenBudget != nil {
        config.ContextTokenBudget = *updates.ContextTokenBudget
    }
    if updates.EmbeddingModel != nil {
        config.EmbeddingModel = *updates.EmbeddingModel
    }
    if updates.SimilarityThreshold != nil {
        config.SimilarityThreshold = *updates.SimilarityThreshold
    }
    if updates.TopK != nil {
        config.TopK = *updates.TopK
    }
    
    // Save updated config
    if err := h.configService.Save(appName, config); err != nil {
        var valErr *RagValidationError
        if errors.As(err, &valErr) {
            w.Header().Set("Content-Type", "application/json")
            w.WriteHeader(http.StatusBadRequest)
            json.NewEncoder(w).Encode(valErr)
            return
        }
        h.respondError(w, 9309, "Failed to save config", http.StatusInternalServerError)
        return
    }
    
    // Return updated config
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(RagConfigUpdateResponse{
        Config:  *config,
        Updated: getUpdatedFieldsFromUpdate(&updates),
        Source:  config.Source,
    })
}
```

---

## Response Formats

### Validation Success

```json
{
  "config": {
    "ChunkSize": 4096,
    "ChunkOverlap": 200,
    "ContextTokenBudget": 4096,
    "EmbeddingModel": "nomic-embed-text",
    "SimilarityThreshold": 0.7,
    "TopK": 10,
    "Source": "app"
  },
  "updated": ["ChunkSize", "ChunkOverlap"],
  "source": "app"
}
```

### Validation Error

```json
{
  "error": {
    "code": 9301,
    "name": "RAG_CHUNK_SIZE_INVALID",
    "message": "Chunk size outside valid range",
    "field": "ChunkSize",
    "value": 100,
    "expected": "256-8192",
    "timestamp": "2026-02-02T10:30:00Z"
  },
  "errors": [
    {
      "code": 9301,
      "name": "RAG_CHUNK_SIZE_INVALID",
      "message": "Chunk size outside valid range",
      "field": "ChunkSize",
      "value": 100,
      "expected": "256-8192"
    }
  ]
}
```

### Multi-Error Response

```json
{
  "errors": [
    {
      "code": 9301,
      "name": "RAG_CHUNK_SIZE_INVALID",
      "field": "ChunkSize",
      "value": 100
    },
    {
      "code": 9303,
      "name": "RAG_OVERLAP_TOO_LARGE",
      "field": "ChunkOverlap",
      "value": 600
    }
  ]
}
```

---

## Unit Tests

```go
func TestChunkSizeValidation(t *testing.T) {
    v := &DefaultValidator{}
    
    tests := []struct {
        name     string
        size     int
        wantCode int
    }{
        {"valid_2048", 2048, 0},
        {"valid_min", 256, 0},
        {"valid_max", 8192, 0},
        {"too_small", 100, 9301},
        {"too_large", 10000, 9301},
        {"not_multiple", 1000, 9302},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := v.validateChunkSize(tt.size)
            if tt.wantCode == 0 {
                if err != nil {
                    t.Errorf("expected no error, got %v", err)
                }
            } else {
                if err == nil {
                    t.Errorf("expected error code %d, got nil", tt.wantCode)
                } else if err.Code != tt.wantCode {
                    t.Errorf("expected error code %d, got %d", tt.wantCode, err.Code)
                }
            }
        })
    }
}

func TestOverlapPercentageValidation(t *testing.T) {
    v := &DefaultValidator{}
    
    tests := []struct {
        name      string
        chunkSize int
        overlap   int
        wantErr   bool
    }{
        {"25_percent_ok", 2048, 512, false},
        {"20_percent_ok", 2048, 400, false},
        {"26_percent_fail", 2048, 600, true},
        {"50_percent_fail", 2048, 1024, true},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := v.validateChunkOverlap(tt.overlap, tt.chunkSize)
            if tt.wantErr && err == nil {
                t.Error("expected error, got nil")
            }
            if !tt.wantErr && err != nil {
                t.Errorf("expected no error, got %v", err)
            }
        })
    }
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| RAG Chunk Settings | `./02-rag-chunk-settings.md` |
| Error Code Registry | `../03-error-code-registry/01-registry.md` |
| AI Bridge Error Codes | `../22-ai-bridge-cli/01-backend/05-error-codes.md` |
| Seedable Config Overview | `./00-overview.md` |
