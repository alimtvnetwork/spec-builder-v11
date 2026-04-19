# License Manager: Error Handling

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09

---

## Overview

License Manager error codes occupy the **LM 15000–15999** range. All error constants use PascalCase with the `Err` prefix. All functions return `apperror.Result[T]` — tuple returns `(*T, error)` are forbidden.

---

## Error Code Registry

### 15000–15099: Initialization & Configuration

| Code | Constant | Description | Retryable |
|------|----------|-------------|-----------|
| 15000 | `ErrLmConfigMissing` | Configuration file not found | ❌ |
| 15001 | `ErrLmConfigInvalid` | Configuration file malformed | ❌ |
| 15002 | `ErrLmDbInitFailed` | Database initialization failure | ✅ |
| 15003 | `ErrLmDbMigrationFailed` | Schema migration failure | ❌ |
| 15004 | `ErrLmDbConnectionLost` | Database connection lost | ✅ |

### 15100–15199: License Generation

| Code | Constant | Description | Retryable |
|------|----------|-------------|-----------|
| 15100 | `ErrLmGenerateFailed` | License key generation failure | ✅ |
| 15101 | `ErrLmInvalidProduct` | Unknown product identifier | ❌ |
| 15102 | `ErrLmInvalidLicenseType` | Invalid license type specified | ❌ |
| 15103 | `ErrLmInvalidExpiry` | Expiry date in the past | ❌ |
| 15104 | `ErrLmInvalidSeats` | Seat count must be ≥ 1 | ❌ |
| 15105 | `ErrLmDuplicateKey` | Generated key collides with existing | ✅ |
| 15106 | `ErrLmHmacFailed` | HMAC signature generation failure | ❌ |

### 15200–15299: Activation & Deactivation

| Code | Constant | Description | Retryable |
|------|----------|-------------|-----------|
| 15200 | `ErrLmActivationFailed` | Activation process failure | ✅ |
| 15201 | `ErrLmLicenseNotFound` | License key not found | ❌ |
| 15202 | `ErrLmLicenseRevoked` | License has been revoked | ❌ |
| 15203 | `ErrLmLicenseExpired` | License has expired | ❌ |
| 15204 | `ErrLmSeatLimitReached` | Maximum activations exceeded | ❌ |
| 15205 | `ErrLmAlreadyActivated` | License already active on this machine | ❌ |
| 15206 | `ErrLmDeactivationFailed` | Deactivation process failure | ✅ |
| 15207 | `ErrLmActivationNotFound` | Activation record not found | ❌ |
| 15208 | `ErrLmFingerprintMismatch` | Machine fingerprint does not match | ❌ |

### 15300–15399: Validation

| Code | Constant | Description | Retryable |
|------|----------|-------------|-----------|
| 15300 | `ErrLmValidationFailed` | License validation failure | ✅ |
| 15301 | `ErrLmTamperDetected` | HMAC signature mismatch — possible tampering | ❌ |
| 15302 | `ErrLmRemoteValidationFailed` | Remote server validation failed | ✅ |
| 15303 | `ErrLmRemoteServerUnreachable` | Cannot reach remote licensing server | ✅ |
| 15304 | `ErrLmFeatureNotLicensed` | Feature not included in license | ❌ |

### 15400–15499: Expiration & Renewal

| Code | Constant | Description | Retryable |
|------|----------|-------------|-----------|
| 15400 | `ErrLmRenewalFailed` | License renewal failure | ✅ |
| 15401 | `ErrLmAlreadyRenewed` | License already renewed for this period | ❌ |
| 15402 | `ErrLmCannotRenewRevoked` | Cannot renew a revoked license | ❌ |

### 15500–15599: Usage Metering

| Code | Constant | Description | Retryable |
|------|----------|-------------|-----------|
| 15500 | `ErrLmUsageRecordFailed` | Failed to record usage | ✅ |
| 15501 | `ErrLmUsageLimitExceeded` | Feature usage limit exceeded | ❌ |
| 15502 | `ErrLmUsageResetFailed` | Failed to reset usage counters | ✅ |
| 15503 | `ErrLmInvalidFeatureKey` | Unknown feature key | ❌ |

### 15600–15699: Reporting

| Code | Constant | Description | Retryable |
|------|----------|-------------|-----------|
| 15600 | `ErrLmReportGenerationFailed` | Report generation failure | ✅ |
| 15601 | `ErrLmInvalidDateRange` | Invalid date range for report | ❌ |
| 15602 | `ErrLmExportFailed` | Report export failure | ✅ |

---

## Error Constant Examples

```go
// ✅ Compliant — PascalCase with Err prefix
var ErrLmLicenseNotFound = apperror.New(15201, "License key not found")
var ErrLmSeatLimitReached = apperror.New(15204, "Maximum activations exceeded")
var ErrLmTamperDetected = apperror.New(15301, "HMAC signature mismatch")

// ❌ Forbidden — SCREAMING_SNAKE_CASE
// var ERR_LM_LICENSE_NOT_FOUND = apperror.New(15201, "...")
```

---

## Statistics

| Metric | Value |
|--------|-------|
| Total Codes | 35 |
| Retryable | 13 |
| Non-Retryable | 22 |
| Range Utilization | 35/1000 (3.5%) |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Overview | `./00-overview.md` |
| Architecture | `./01-architecture.md` |
| Error Code Registry | `spec/03-error-code-registry/01-registry.md` |
| Error Codes JSON | `./error-codes.json` |
| Error Naming Standard | `.lovable/memories/architecture/error-code-registry/naming-standards.md` |
