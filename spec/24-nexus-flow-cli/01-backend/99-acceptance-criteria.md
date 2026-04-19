# Nexus Flow CLI: Acceptance Criteria

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  
**Format:** GIVEN/WHEN/THEN (E2E-test-ready)

---

## Core Specification (01-core-specification.md)

### NF-01: Pipeline Execution

**GIVEN** a pipeline definition with multiple stages  
**WHEN** `nexusflow run --pipeline build-deploy` is executed  
**THEN** stages execute in dependency order  
**AND** each stage's output is available as input to dependent stages  
**AND** the overall status reflects success only if all stages succeed

**Edge Cases:**
- **GIVEN** a stage fails **WHEN** the pipeline has `continueOnError: false` **THEN** execution stops immediately and remaining stages are skipped
- **GIVEN** a stage fails **WHEN** `continueOnError: true` **THEN** execution continues and the final status is `partial`
- **GIVEN** a pipeline has a circular dependency (stage A depends on B, B depends on A) **WHEN** the pipeline is validated before execution **THEN** a cycle detection error is returned listing the full dependency cycle

### NF-02: Standalone Mode

**GIVEN** Nexus Flow is deployed as a standalone service  
**WHEN** the API server starts  
**THEN** all pipeline management endpoints are available  
**AND** the service operates independently without requiring other CLIs

### NF-03: Parallel Stage Execution

**GIVEN** a pipeline with stages A, B (independent) and C (depends on A and B)  
**WHEN** the pipeline runs  
**THEN** stages A and B execute in parallel  
**AND** stage C starts only after both A and B complete successfully

**Edge Cases:**
- **GIVEN** stage A completes but stage B fails **WHEN** `continueOnError: false` **THEN** stage C is skipped and the pipeline status is `failed`

### NF-04: Pipeline Dry Run

**GIVEN** a valid pipeline definition  
**WHEN** `nexusflow run --pipeline build-deploy --dry-run` is executed  
**THEN** the execution plan is displayed without running any stages  
**AND** dependency order, estimated duration, and required tools are shown

---

## OpenAPI Specification (03-openapi-specification.md)

### NF-05: API Compliance

**GIVEN** the Nexus Flow REST API  
**WHEN** endpoints are validated against the OpenAPI spec  
**THEN** all request/response schemas match  
**AND** all documented endpoints are implemented

---

## Error Codes (04-error-codes.md)

### NF-06: Error Range Compliance

**GIVEN** any error occurs in Nexus Flow  
**WHEN** the error response is generated  
**THEN** the error code falls within the Nexus Flow assigned range (8000–8399)  
**AND** the code is registered in the Error Code Registry

**Edge Cases:**
- **GIVEN** an error originates from a delegated CLI tool **WHEN** the error is propagated **THEN** the original tool's error code is preserved and wrapped in a Nexus Flow envelope with its own code

---

## Database Architecture (05-database-architecture.md)

### NF-07: Pipeline Persistence

**GIVEN** a pipeline execution completes  
**WHEN** the result is persisted  
**THEN** the pipeline run record includes: runId, pipeline name, stages executed, status, duration, and timestamp

### NF-08: Pipeline Definition CRUD

**GIVEN** the Nexus Flow API is running  
**WHEN** a POST to `/api/v1/pipelines` creates a new pipeline definition  
**THEN** the definition is validated and stored in the database  
**AND** the pipeline is available for execution

**Edge Cases:**
- **GIVEN** a pipeline with the same name already exists **WHEN** creation is attempted **THEN** a 409 Conflict error is returned

---

## Settings, Observability, Reset (08, 07, 09)

### NF-09: Settings Service

**GIVEN** the Nexus Flow settings service  
**WHEN** pipeline configuration settings are modified  
**THEN** changes follow the seedable config golden rule (version-gated, IsUserModified tracking)

### NF-10: Health Check

**GIVEN** Nexus Flow is running  
**WHEN** GET `/health/ready` is called  
**THEN** pipeline engine status, database connectivity, and registered pipelines count are returned

**Edge Cases:**
- **GIVEN** the database is unreachable **WHEN** health check runs **THEN** the response returns `status: "degraded"` with `database: "unreachable"` instead of a 500 error

### NF-11: Reset API

**GIVEN** a reset request with scope `pipelines`  
**WHEN** confirmed within 5 minutes  
**THEN** all pipeline run history is deleted while definitions and settings are preserved

**Edge Cases:**
- **GIVEN** scope is `all` **WHEN** reset is confirmed **THEN** pipeline definitions, run history, and stage logs are all deleted
- **GIVEN** error codes NF-8350–8369 are used **WHEN** any reset error occurs **THEN** the error code matches the documented Reset API range

### NF-12: Observability Metrics

**GIVEN** Nexus Flow is running with Prometheus metrics enabled  
**WHEN** metrics are scraped at `/metrics`  
**THEN** pipeline execution latency, stage success/failure counts, and queue depth are available

---

## Pipeline Execution Engine

### NF-13: Stage Timeout

**GIVEN** a stage has a configured timeout of 60 seconds  
**WHEN** the stage execution exceeds 60 seconds  
**THEN** the stage is terminated with a timeout error  
**AND** the pipeline proceeds based on the `continueOnError` setting

### NF-14: Stage Output Capture

**GIVEN** a stage produces stdout and stderr output  
**WHEN** the stage completes  
**THEN** both stdout and stderr are captured and stored with the run record  
**AND** output is available via API for debugging

### NF-15: Pipeline Cancellation

**GIVEN** a pipeline is currently executing  
**WHEN** a DELETE request is sent to `/api/v1/pipelines/runs/{runId}`  
**THEN** currently running stages receive SIGTERM  
**AND** queued stages are cancelled  
**AND** the run status is set to `cancelled`

### NF-16: Webhook Notifications

**GIVEN** a pipeline has webhook notifications configured  
**WHEN** the pipeline completes (success or failure)  
**THEN** a POST request with the run summary is sent to the configured webhook URL  
**AND** delivery failures are retried up to 3 times with exponential backoff

---

*Wave 6 — Batch 3 (Patched): Nexus Flow acceptance criteria expanded from 8 to 16 criteria with circular dependency detection, parallel execution, dry run, cancellation, stage timeout, and webhook notification edge cases.*
