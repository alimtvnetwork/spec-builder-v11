# License Manager: Architecture

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09

---

## Overview

The License Manager follows a layered architecture with clear separation between CLI, service, and data layers. It operates offline-first with optional online verification against a remote licensing server.

---

## System Architecture

```
┌─────────────────────────────────────────┐
│              CLI Layer (Cobra)           │
│  lm generate | activate | validate | …  │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│            Service Layer                 │
│  LicenseService   ActivationService      │
│  ValidationService MeteringService       │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│             Data Layer (GORM)            │
│  License   Activation   UsageRecord      │
│  MachineFingerprint   ExpirationAlert    │
└──────────────────┬──────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    ┌────▼────┐       ┌──────▼──────┐
    │ SQLite  │       │  Remote API │
    │ (local) │       │ (optional)  │
    └─────────┘       └─────────────┘
```

---

## Component Design

### LicenseService

Handles license lifecycle: creation, retrieval, renewal, and revocation.

```go
// ✅ Compliant — uses appfault.Result[T]
func (service *LicenseService) Generate(context context.Context, request GenerateLicenseRequest) appfault.Result[License] {
    // Validate request fields
    // Generate cryptographic key
    // Persist to database
    // Return License
}

func (service *LicenseService) Revoke(context context.Context, licenseId string) appfault.Result[bool] {
    // Verify license exists
    // Mark as revoked
    // Log revocation event
}
```

### ActivationService

Binds licenses to machine fingerprints with configurable seat limits.

```go
func (service *ActivationService) Activate(context context.Context, licenseKey string, fingerprint MachineFingerprint) appfault.Result[Activation] {
    // Validate license exists and is active
    // Check seat limit
    // Create activation record
}

func (service *ActivationService) Deactivate(context context.Context, activationId string) appfault.Result[bool] {
    // Remove activation binding
    // Free seat
}
```

### ValidationService

Verifies license validity with offline-first strategy.

```go
func (service *ValidationService) Validate(context context.Context, licenseKey string) appfault.Result[ValidationResult] {
    // Check local cache first
    // Verify expiration
    // Verify activation status
    // Optionally check remote server
}
```

### MeteringService

Tracks feature usage against license limits.

```go
func (service *MeteringService) RecordUsage(context context.Context, licenseKey string, featureKey string) appfault.Result[UsageRecord] {
    // Increment usage counter
    // Check against limit
    // Return current usage
}
```

---

## Split DB Architecture

| Database | Path | Purpose |
|----------|------|---------|
| License Store | `data/license-manager/licenses.db` | License keys, activations, fingerprints |
| Usage Store | `data/license-manager/usage.db` | Metering records, usage history |
| Settings | `data/gsearch.db` (shared root) | Seedable configuration |

---

## Security

| Aspect | Implementation |
|--------|---------------|
| Key Format | 128-bit cryptographic random, Base32 encoded |
| Storage | License keys hashed (SHA-256) at rest |
| Fingerprint | Hardware ID + OS + hostname composite hash |
| Transport | TLS 1.3 for remote validation |
| Tamper Detection | HMAC signature on local database records |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Overview | `./00-overview.md` |
| CLI Interface | `./02-cli-interface.md` |
| Data Models | `./03-data-models.md` |
| Error Handling | `./04-error-handling.md` |
| Split DB Architecture | `02-spec/06-split-db-architecture/00-overview.md` |
