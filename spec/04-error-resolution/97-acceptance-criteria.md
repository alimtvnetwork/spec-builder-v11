# Error Resolution: Acceptance Criteria

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  
**Format:** GIVEN/WHEN/THEN (E2E-test-ready)

---

## Error Resolution Flow (00-overview.md)

### ER-01: Structured Error Response

**GIVEN** any CLI backend encounters an error during request processing  
**WHEN** the error response is generated  
**THEN** it contains: `Code` (numeric), `Message` (human-readable), `Details` (technical), and `Stack` (up to 40 frames)  
**AND** the error code falls within the tool's assigned range per the Error Code Registry

**Edge Cases:**
- **GIVEN** the error originates from a third-party library **WHEN** the stack trace is captured **THEN** both the library frames and the application frames are included with clear delineation
- **GIVEN** the error code is not registered in the Error Code Registry **WHEN** it is returned **THEN** a fallback generic code within the tool's range is used and a warning is logged
- **GIVEN** the error `Details` field contains sensitive data (file paths, credentials) **WHEN** the response is generated **THEN** sensitive values are redacted before sending to the client

### ER-02: Frontend-Backend Verification Protocol

**GIVEN** the frontend receives an error response from the backend  
**WHEN** the error is displayed in the error modal  
**THEN** the user can see the backend error code, the frontend component that triggered the request, and the timestamp  
**AND** "Copy All" copies both frontend and backend context

**Edge Cases:**
- **GIVEN** the clipboard API is unavailable (e.g., non-HTTPS context, browser restriction) **WHEN** "Copy All" is clicked **THEN** a fallback textarea is shown with the content pre-selected for manual copy
- **GIVEN** the backend returns an error with no `Code` field **WHEN** the frontend processes it **THEN** a synthetic code `GEN-1000` is assigned and a parsing warning is logged

---

## Retrospectives (01-retrospectives/)

### ER-03: Retrospective Document Structure

**GIVEN** a production bug has been resolved  
**WHEN** a retrospective document is created  
**THEN** it contains: Root Cause, Timeline, Resolution Steps, Prevention Measures, and Related Error Codes  
**AND** the filename follows the pattern `{YYYY-MM-DD}-{slug}.md`

---

## Verification Patterns (02-verification-patterns/)

### ER-04: Verification Pattern Application

**GIVEN** a developer implements a fix for a known error pattern  
**WHEN** they consult the verification patterns documentation  
**THEN** they find step-by-step verification instructions specific to the error category (network, database, auth, parsing)

---

## Debugging Guides (03-debugging-guides/)

### ER-05: Go Debugging Guide

**GIVEN** a developer encounters a Go backend error  
**WHEN** they follow the Go debugging guide  
**THEN** they can identify: SQLite WAL mode issues, initialization order problems, and GORM model mismatches  
**AND** each issue links to the relevant specification for the fix

### ER-06: Cross-Reference Diagram

**GIVEN** an error code is received  
**WHEN** the developer consults the cross-reference diagram (04-cross-reference-diagram.md)  
**THEN** they can trace the error to: the originating CLI, the specification file, the module, and related error codes

**Edge Cases:**
- **GIVEN** the error code belongs to a deprecated range **WHEN** lookup is performed **THEN** the diagram shows the deprecated status and points to the replacement range

---

## Debugging Cheat Sheet (05-debugging-cheat-sheet.md)

### ER-07: Quick Resolution

**GIVEN** a common error scenario (e.g., port conflict, DB locked, auth failure)  
**WHEN** the developer consults the cheat sheet  
**THEN** they find a 3-step resolution procedure: Identify → Diagnose → Fix  
**AND** each step includes the exact command or code to run

---

*Wave 6 — Batch 1 (Patched): Error Resolution acceptance criteria with added edge cases for clipboard fallback, sensitive data redaction, and deprecated error ranges.*
