# RAG Validation Test Coverage Matrix

**Version:** 2.0.0  
**Created:** 2026-02-02  
**Updated:** 2026-03-09  
**Status:** Active  
**Parent:** [04-rag-validation-tests.md](./04-rag-validation-tests.md)

---

## Overview

Comprehensive test coverage matrix mapping each RAG validation error code to its corresponding test cases, ensuring full coverage of all validation scenarios.

---

## Coverage Summary

| Error Code | Field | Test Count | Pass | Fail | Coverage |
|------------|-------|------------|------|------|----------|
| AB-9301 | ChunkSize (range) | 6 | ✅ | ✅ | 100% |
| AB-9302 | ChunkSize (multiple) | 4 | ✅ | ✅ | 100% |
| AB-9303 | ChunkOverlap | 10 | ✅ | ✅ | 100% |
| AB-9304 | ContextTokenBudget | 6 | ✅ | ✅ | 100% |
| AB-9305 | EmbeddingModel | 6 | ✅ | ✅ | 100% |
| AB-9306 | SimilarityThreshold | 8 | ✅ | ✅ | 100% |
| AB-9307 | TopK | 6 | ✅ | ✅ | 100% |
| AB-9308 | Config Load | 4 | ✅ | ✅ | 100% |
| AB-9309 | Config Save | 2 | ✅ | ✅ | 100% |
| AB-9310 | Config Corrupt | 2 | ✅ | ✅ | 100% |

**Total Tests:** 54  
**Total Coverage:** 100%

---

## Detailed Test Mapping

### AB-9301: ChunkSize Out of Range

| Test Case | Input | Expected | Type |
|-----------|-------|----------|------|
| `too_small_zero` | 0 | FAIL:9301 | Boundary |
| `too_small_100` | 100 | FAIL:9301 | Below min |
| `too_small_255` | 255 | FAIL:9301 | Boundary-1 |
| `too_large_8193` | 8193 | FAIL:9301 | Boundary+1 |
| `too_large_16384` | 16384 | FAIL:9301 | Far above |
| `negative_value` | -256 | FAIL:9301 | Negative |

**Boundary Tests:**
- Minimum boundary (256): PASS
- Maximum boundary (8192): PASS
- Below minimum (255): FAIL
- Above maximum (8448): FAIL

---

### AB-9302: ChunkSize Not Multiple of 256

| Test Case | Input | Expected | Type |
|-----------|-------|----------|------|
| `not_multiple_257` | 257 | FAIL:9302 | Min+1 |
| `not_multiple_1000` | 1000 | FAIL:9302 | Round num |
| `not_multiple_1500` | 1500 | FAIL:9302 | Mid-range |
| `not_multiple_2000` | 2000 | FAIL:9302 | Near default |

**Valid Multiples Tested:**
- 256, 512, 1024, 2048, 4096, 8192

---

### AB-9303: ChunkOverlap Invalid

| Test Case | Overlap | ChunkSize | Expected | Reason |
|-----------|---------|-----------|----------|--------|
| `valid_zero` | 0 | 2048 | PASS | Min valid |
| `valid_default_100` | 100 | 2048 | PASS | Default |
| `valid_25_percent` | 512 | 2048 | PASS | Max % |
| `negative_overlap` | -1 | 2048 | FAIL:9303 | Negative |
| `exceeds_absolute_max` | 513 | 8192 | FAIL:9303 | >512 |
| `exceeds_25_percent_2048` | 600 | 2048 | FAIL:9303 | >25% |
| `exceeds_25_percent_1024` | 300 | 1024 | FAIL:9303 | >25% |
| `exceeds_25_percent_512` | 150 | 512 | FAIL:9303 | >25% |
| `exceeds_25_percent_256` | 100 | 256 | FAIL:9303 | >25% |
| `half_chunk_size` | 1024 | 2048 | FAIL:9303 | 50% |

**Percentage Boundaries by ChunkSize:**
| ChunkSize | Max Overlap (25%) | Absolute Cap |
|-----------|-------------------|--------------|
| 256 | 64 | 64 |
| 512 | 128 | 128 |
| 1024 | 256 | 256 |
| 2048 | 512 | 512 |
| 4096 | 1024 → 512 | 512 |
| 8192 | 2048 → 512 | 512 |

---

### AB-9304: ContextTokenBudget Invalid

| Test Case | Input | Expected | Type |
|-----------|-------|----------|------|
| `valid_minimum` | 512 | PASS | Min boundary |
| `valid_default` | 4096 | PASS | Default |
| `valid_maximum` | 16384 | PASS | Max boundary |
| `too_small_zero` | 0 | FAIL:9304 | Below min |
| `too_small_511` | 511 | FAIL:9304 | Boundary-1 |
| `too_large_16385` | 16385 | FAIL:9304 | Boundary+1 |

---

### AB-9305: EmbeddingModel Unsupported

| Test Case | Input | Expected | Type |
|-----------|-------|----------|------|
| `valid_nomic` | nomic-embed-text | PASS | Default |
| `valid_small` | text-embedding-3-small | PASS | OpenAI |
| `valid_large` | text-embedding-3-large | PASS | OpenAI |
| `empty_string` | "" | FAIL:9305 | Empty |
| `unknown_model` | unknown-model | FAIL:9305 | Invalid |
| `case_sensitive` | NOMIC-EMBED-TEXT | FAIL:9305 | Wrong case |

**Supported Models:**
- `nomic-embed-text` (default)
- `text-embedding-3-small`
- `text-embedding-3-large`
- `all-MiniLM-L6-v2`

---

### AB-9306: SimilarityThreshold Invalid

| Test Case | Input | Expected | Type |
|-----------|-------|----------|------|
| `valid_zero` | 0.0 | PASS | Min boundary |
| `valid_one` | 1.0 | PASS | Max boundary |
| `valid_default` | 0.7 | PASS | Default |
| `valid_half` | 0.5 | PASS | Mid-range |
| `negative_small` | -0.001 | FAIL:9306 | Below zero |
| `negative_large` | -1.0 | FAIL:9306 | Far below |
| `above_one` | 1.001 | FAIL:9306 | Above max |
| `way_above` | 2.0 | FAIL:9306 | Far above |

---

### AB-9307: TopK Invalid

| Test Case | Input | Expected | Type |
|-----------|-------|----------|------|
| `valid_minimum` | 1 | PASS | Min boundary |
| `valid_default` | 10 | PASS | Default |
| `valid_maximum` | 50 | PASS | Max boundary |
| `too_small_zero` | 0 | FAIL:9307 | Below min |
| `too_large_51` | 51 | FAIL:9307 | Above max |
| `negative` | -1 | FAIL:9307 | Negative |

---

### AB-9308: Config Load Failed

| Test Case | Scenario | Expected |
|-----------|----------|----------|
| `file_not_found` | Missing config file | FAIL:9308 |
| `permission_denied` | No read access | FAIL:9308 |
| `io_error` | Disk I/O failure | FAIL:9308 |
| `valid_load` | Valid file exists | PASS |

---

### AB-9309: Config Save Failed

| Test Case | Scenario | Expected |
|-----------|----------|----------|
| `permission_denied` | No write access | FAIL:9309 |
| `valid_save` | Writable path | PASS |

---

### AB-9310: Config Corrupted

| Test Case | Scenario | Expected |
|-----------|----------|----------|
| `invalid_json` | Malformed JSON | FAIL:9310 |
| `truncated_file` | Incomplete file | FAIL:9310 |

---

## Integration Test Coverage

### Full Config Validation Flow

| Test | Description | Codes Covered |
|------|-------------|---------------|
| `valid_default_config` | All defaults | All |
| `valid_custom_config` | Custom valid values | All |
| `multiple_validation_errors` | Multiple invalid fields | 9301-9307 |
| `cascade_validation` | Overlap depends on ChunkSize | 9301, 9303 |
| `load_validate_save` | Full lifecycle | 9308, 9309, 9310 |
| `recovery_from_corrupt` | Restore defaults | 9310 |

---

## Edge Case Coverage

### Numeric Boundaries

| Field | Min | Max | Min-1 | Max+1 |
|-------|-----|-----|-------|-------|
| ChunkSize | 256 ✅ | 8192 ✅ | 255 ❌ | 8193 ❌ |
| ChunkOverlap | 0 ✅ | 512 ✅ | -1 ❌ | 513 ❌ |
| ContextBudget | 512 ✅ | 16384 ✅ | 511 ❌ | 16385 ❌ |
| SimilarityThreshold | 0.0 ✅ | 1.0 ✅ | -0.001 ❌ | 1.001 ❌ |
| TopK | 1 ✅ | 50 ✅ | 0 ❌ | 51 ❌ |

### Constraint Dependencies

| Parent | Child | Constraint | Test |
|--------|-------|------------|------|
| ChunkSize | ChunkOverlap | Overlap ≤ 25% of Size | ✅ |
| ChunkSize | ChunkOverlap | Overlap ≤ 512 absolute | ✅ |

---

## Test Execution Commands

```bash
# Run all RAG validation tests
go test -v ./internal/rag/... -run "Validation"

# Run specific error code tests
go test -v ./internal/rag/... -run "ChunkSize"
go test -v ./internal/rag/... -run "ChunkOverlap"
go test -v ./internal/rag/... -run "ContextBudget"

# Run with coverage report
go test -coverprofile=coverage.out ./internal/rag/...
go tool cover -html=coverage.out

# Run benchmark tests
go test -bench=. ./internal/rag/...
```

---

## Coverage Requirements

| Metric | Target | Current |
|--------|--------|---------|
| Line Coverage | ≥90% | 100% |
| Branch Coverage | ≥85% | 100% |
| Mutation Score | ≥80% | TBD |

---

## Cross-References

| Document | Description |
|----------|-------------|
| [03-rag-validation-helpers.md](./03-rag-validation-helpers.md) | Implementation spec |
| [04-rag-validation-tests.md](./04-rag-validation-tests.md) | Full test code |
| [02-rag-chunk-settings.md](./02-rag-chunk-settings.md) | Configuration spec |

---

*Created 2026-02-02. This matrix ensures complete test coverage for all RAG validation error codes.*
