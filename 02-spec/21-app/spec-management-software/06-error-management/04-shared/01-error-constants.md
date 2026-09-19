# Shared Error Constants

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

---

## Overview

Error codes and constants shared between frontend and backend. These must be kept in sync.

**Cross-References:**
- [Error Management Overview](../00-overview.md)
- [Backend Error Codes](../02-backend/01-error-codes.md)
- [Frontend Error Codes](../03-frontend/01-error-codes.md)

---

## Shared Code Ranges

Codes in these ranges are used by both frontend and backend:

| Range | Category | Description |
|-------|----------|-------------|
| 1xxx | Validation | Input validation (forms, API requests) |
| 5xxx | Business Logic | Domain-specific errors |

---

## Shared Error Constants

### Validation Errors (1xxx)

| Code | Constant | Description |
|------|----------|-------------|
| 1001 | `ErrValidationRequired` | Required field missing |
| 1002 | `ErrValidationFormat` | Invalid format |
| 1003 | `ErrValidationRange` | Value out of range |
| 1004 | `ErrValidationLength` | String length violation |
| 1005 | `ErrValidationType` | Type mismatch |
| 1006 | `ErrValidationUnique` | Uniqueness constraint |
| 1010 | `ErrValidationBatch` | Multiple validation failures |

### Business Logic (5xxx)

| Code | Constant | Description |
|------|----------|-------------|
| 5001 | `ErrLogicState` | Invalid state transition |
| 5002 | `ErrLogicLimit` | Limit exceeded |
| 5003 | `ErrLogicConflict` | Business rule conflict |
| 5010 | `ErrSpecInvalid` | Invalid specification |
| 5011 | `ErrSpecCircular` | Circular reference |
| 5012 | `ErrSpecMissing` | Referenced spec not found |

---

## TypeScript Definition

```typescript
// src/lib/errors/shared-codes.ts

export enum SharedErrorCode {
  // Validation
  ValidationRequired = 1001,
  ValidationFormat = 1002,
  ValidationRange = 1003,
  ValidationLength = 1004,
  ValidationType = 1005,
  ValidationUnique = 1006,
  ValidationBatch = 1010,
  
  // Business Logic
  LogicState = 5001,
  LogicLimit = 5002,
  LogicConflict = 5003,
  SpecInvalid = 5010,
  SpecCircular = 5011,
  SpecMissing = 5012,
}
```

---

## Go Definition

```go
// internal/errors/shared.go

package errors

// Shared error codes used by both frontend and backend
const (
    // Validation (1xxx)
    ErrValidationRequired ErrorCode = 1001
    ErrValidationFormat   ErrorCode = 1002
    ErrValidationRange    ErrorCode = 1003
    ErrValidationLength   ErrorCode = 1004
    ErrValidationType     ErrorCode = 1005
    ErrValidationUnique   ErrorCode = 1006
    ErrValidationBatch    ErrorCode = 1010
    
    // Business Logic (5xxx)
    ErrLogicState    ErrorCode = 5001
    ErrLogicLimit    ErrorCode = 5002
    ErrLogicConflict ErrorCode = 5003
    ErrSpecInvalid   ErrorCode = 5010
    ErrSpecCircular  ErrorCode = 5011
    ErrSpecMissing   ErrorCode = 5012
)
```

---

## Sync Process

To keep frontend and backend in sync:

1. Update this file first
2. Update backend `internal/errors/shared.go`
3. Update frontend `src/lib/errors/shared-codes.ts`
4. Run validation tests

---

## Related Specs

- [Backend Error Codes](../02-backend/01-error-codes.md) — Full backend codes
- [Frontend Error Codes](../03-frontend/01-error-codes.md) — Full frontend codes
