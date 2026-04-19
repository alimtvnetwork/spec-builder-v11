# License Manager: Acceptance Criteria

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09

---

## Overview

All acceptance criteria follow GIVEN/WHEN/THEN format. Each scenario maps to specific error codes and data models.

---

## LM-AC-01: License Generation

**GIVEN** a valid product identifier and license type  
**WHEN** `lm generate --product gsearch --type Standard --seats 3 --expires 2027-03-06`  
**THEN** a unique license key is generated, stored in `licenses.db`, HMAC-signed, and returned to the user  

**GIVEN** an invalid product identifier  
**WHEN** `lm generate --product unknown --type Standard`  
**THEN** error `ErrLmInvalidProduct` (15101) is returned  

**GIVEN** an expiry date in the past  
**WHEN** `lm generate --product gsearch --type Trial --expires 2020-01-01`  
**THEN** error `ErrLmInvalidExpiry` (15103) is returned  

---

## LM-AC-02: License Activation

**GIVEN** a valid, active license with available seats  
**WHEN** `lm activate --key <key>`  
**THEN** an activation record is created binding the license to the current machine fingerprint  

**GIVEN** a license with all seats occupied  
**WHEN** `lm activate --key <key>`  
**THEN** error `ErrLmSeatLimitReached` (15204) is returned  

**GIVEN** a revoked license  
**WHEN** `lm activate --key <key>`  
**THEN** error `ErrLmLicenseRevoked` (15202) is returned  

**GIVEN** a license already active on this machine  
**WHEN** `lm activate --key <key>`  
**THEN** error `ErrLmAlreadyActivated` (15205) is returned  

---

## LM-AC-03: License Validation

**GIVEN** an active, non-expired license activated on this machine  
**WHEN** `lm validate --key <key>`  
**THEN** validation succeeds with status `Valid`  

**GIVEN** an expired license  
**WHEN** `lm validate --key <key>`  
**THEN** validation fails with `ErrLmLicenseExpired` (15203)  

**GIVEN** a license with a tampered database record  
**WHEN** `lm validate --key <key>`  
**THEN** validation fails with `ErrLmTamperDetected` (15301)  

**GIVEN** `--online` flag and an unreachable remote server  
**WHEN** `lm validate --key <key> --online`  
**THEN** error `ErrLmRemoteServerUnreachable` (15303) is returned, local validation falls back  

---

## LM-AC-04: License Deactivation

**GIVEN** an active activation on this machine  
**WHEN** `lm deactivate --key <key>`  
**THEN** the activation record is marked inactive, freeing one seat  

**GIVEN** no activation for this license on this machine  
**WHEN** `lm deactivate --key <key>`  
**THEN** error `ErrLmActivationNotFound` (15207) is returned  

---

## LM-AC-05: Usage Metering

**GIVEN** a license with feature limits configured  
**WHEN** a feature is invoked and usage is recorded  
**THEN** the usage counter increments and the current count is returned  

**GIVEN** usage has reached the configured limit  
**WHEN** the feature is invoked again  
**THEN** error `ErrLmUsageLimitExceeded` (15501) is returned  

---

## LM-AC-06: Expiration Alerts

**GIVEN** a license expiring within 30 days  
**WHEN** `lm validate --key <key>` is run  
**THEN** an `AlertType30Day` expiration alert is created and displayed to the user  

**GIVEN** a license expiring within 1 day  
**WHEN** `lm validate --key <key>` is run  
**THEN** an `AlertType1Day` expiration alert is created with high-priority formatting  

---

## LM-AC-07: Machine Fingerprint

**GIVEN** any machine  
**WHEN** `lm fingerprint` is run  
**THEN** a deterministic fingerprint hash is displayed based on hardware ID, OS, and hostname  

**GIVEN** the same machine run twice  
**WHEN** `lm fingerprint` is run both times  
**THEN** identical fingerprint hashes are produced  

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Overview | `./00-overview.md` |
| Data Models | `./03-data-models.md` |
| Error Handling | `./04-error-handling.md` |
| CLI Interface | `./02-cli-interface.md` |
