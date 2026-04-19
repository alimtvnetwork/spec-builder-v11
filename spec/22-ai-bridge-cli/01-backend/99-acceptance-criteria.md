# AI Bridge CLI: Acceptance Criteria

**Version:** 5.0.0  
**Status:** Active  
**Updated:** 2026-03-09  
**Format:** GIVEN/WHEN/THEN (E2E-test-ready)

---

## Architecture & Startup (01-03)

### AB-01: Startup Modes

**GIVEN** the AI Bridge CLI binary is available  
**WHEN** `aibridge start --mode interactive` is executed  
**THEN** the interactive mode starts with WebSocket server, API endpoints, and prompt interface  
**AND** the startup message includes the bound port and loaded model

**Edge Cases:**
- **GIVEN** `--mode api-only` is specified **WHEN** startup completes **THEN** only the REST API server is started (no interactive prompt)
- **GIVEN** the configured port is occupied **WHEN** startup is attempted **THEN** fallback port logic activates per the port management standard

### AB-02: Input Format Detection

**GIVEN** the user provides input  
**WHEN** the input is analyzed  
**THEN** the system detects the format (plain text, markdown, code block, file path, URL)  
**AND** the appropriate processing pipeline is selected

---

## API Interface (04-api-interface.md)

### AB-03: REST API Endpoints

**GIVEN** the API server is running  
**WHEN** a POST request is sent to `/api/v1/chat` with `{ "Message": "Hello", "AppName": "myapp" }`  
**THEN** the LLM processes the message and returns a streaming response  
**AND** the response includes `SessionId`, `Message`, and `TokensUsed`

**Edge Cases:**
- **GIVEN** the model is not loaded **WHEN** a chat request arrives **THEN** a 503 error with code in the AI Bridge range is returned
- **GIVEN** the message exceeds the context window **WHEN** processing starts **THEN** the oldest messages are truncated with a warning in the response metadata

---

## Model Management (07-model-management.md)

### AB-04: Model Download and Loading

**GIVEN** a model identifier (e.g., "llama3:8b")  
**WHEN** `aibridge model pull llama3:8b` is executed  
**THEN** the model is downloaded to the configured model directory  
**AND** progress is reported as percentage with download speed

**Edge Cases:**
- **GIVEN** the download is interrupted **WHEN** it is resumed **THEN** partial downloads are continued from where they left off
- **GIVEN** disk space is insufficient **WHEN** download starts **THEN** a clear error with required vs available space is shown

### AB-04b: Model Switching During Active Session

**GIVEN** a chat session is active with model A loaded  
**WHEN** a request to switch to model B arrives  
**THEN** the current session context is preserved  
**AND** model B is loaded and subsequent messages use model B  
**AND** a warning is emitted if model B has a smaller context window than model A

---

## Agentic Mode & Tool Delegation (09, 32)

### AB-05: Tool Delegation

**GIVEN** the LLM generates a `tool_call` for `web_search`  
**WHEN** the tool dispatcher processes it  
**THEN** the corresponding external CLI (gsearch-cli) is spawned  
**AND** stdout is captured, parsed as JSON, and injected back into the LLM context

**Edge Cases:**
- **GIVEN** the external CLI is not installed **WHEN** delegation is attempted **THEN** a graceful error is returned to the LLM context indicating the tool is unavailable
- **GIVEN** the external CLI times out **WHEN** the configured timeout (e.g., 30s) elapses **THEN** the process is killed and a timeout error is returned to the chain

### AB-06: Long-Chain Execution

**GIVEN** the LLM plans a multi-step chain (search → analyze → summarize)  
**WHEN** each step completes  
**THEN** the result is injected into context for the next step  
**AND** the full chain is logged with step-by-step timing

---

## AI SEO Generate (13-30)

### AB-07: SEO Content Generation

**GIVEN** a content type (blog post, press release, page) and topic  
**WHEN** AI SEO generation is triggered  
**THEN** content is generated following EEAT principles  
**AND** sentences are ≤18 words, paragraphs ≤180 words  
**AND** 100% of sentences start with transition words  
**AND** slugs are 3-4 words maximum

### AB-08: Variable System

**GIVEN** a template with variables (e.g., `{{CompanyName}}`, `{{TargetKeyword}}`)  
**WHEN** content is generated  
**THEN** all variables are resolved from the company profile and context  
**AND** unresolved variables are flagged as warnings

**Edge Cases:**
- **GIVEN** a variable references another variable (e.g., `{{FullName}}` → `{{FirstName}} {{LastName}}`) **WHEN** resolution runs **THEN** recursive resolution is applied up to 3 levels deep
- **GIVEN** a circular variable reference exists (e.g., `{{A}}` → `{{B}}` → `{{A}}`) **WHEN** resolution runs **THEN** the cycle is detected and an error listing the cycle chain is returned

### AB-09: FAQ Generation

**GIVEN** a topic and existing content  
**WHEN** FAQ generation is triggered  
**THEN** relevant questions are generated based on the content  
**AND** answers follow the EEAT format with structured data (JSON-LD) output

### AB-10: GSearch URL Extraction

**GIVEN** a search query for content research  
**WHEN** GSearch integration is invoked  
**THEN** URLs from search results are extracted and used for internal linking suggestions  
**AND** sitemap-based links are prioritized

---

## Revisions Architecture (35-unified-revisions-architecture.md)

### AB-11: Revision Tracking

**GIVEN** generated content exists  
**WHEN** the user requests a revision with feedback  
**THEN** a new revision is created with the revision number, diff, and feedback stored  
**AND** previous revisions remain accessible for comparison

**Edge Cases:**
- **GIVEN** the user reverts to revision 2 out of 5 **WHEN** the revert is applied **THEN** revision 6 is created as a copy of revision 2 (no history is lost)

---

## Session-Scoped RAG Memory (36)

### AB-12: RAG Context Injection

**GIVEN** a chat session with RAG enabled for an app  
**WHEN** the user asks a question  
**THEN** relevant chunks from the app's RAG database are retrieved  
**AND** they are injected into the LLM context before generation  
**AND** source attributions are included in the response

---

## Adaptive Reasoning (37, 39)

### AB-13: Reasoning Flow Selection

**GIVEN** a user query  
**WHEN** the adaptive reasoning engine analyzes it  
**THEN** the appropriate reasoning flow is selected (direct, chain-of-thought, multi-step)  
**AND** the selection rationale is logged for observability

---

## WebSocket Connection Manager (38)

### AB-14: WebSocket Lifecycle

**GIVEN** the WebSocket server is running  
**WHEN** a client connects  
**THEN** connection is established with the configured `PingInterval` and `DefaultTtl`  
**AND** connection state is tracked in the connection registry

**Edge Cases:**
- **GIVEN** `MaxConnections` is reached **WHEN** a new client attempts connection **THEN** the connection is rejected with a 429 status and retry-after header
- **GIVEN** a client's connection is idle beyond `DefaultTtl` **WHEN** the TTL check runs **THEN** the connection is closed with a proper close frame

---

## Code Pattern Learning (43)

### AB-15: Pattern Detection

**GIVEN** a codebase is loaded for analysis  
**WHEN** the AST-based pattern detector runs  
**THEN** naming conventions, error handling patterns, and architectural styles are detected  
**AND** detected patterns are stored for reuse in subsequent code generation

---

## Plan Generation & Execution (44-49)

### AB-16: Plan Generation

**GIVEN** a user request for a complex task  
**WHEN** plan generation is triggered  
**THEN** a structured plan with steps, dependencies, and estimated durations is created  
**AND** the plan can be reviewed before execution

### AB-17: Plan Execution Monitoring

**GIVEN** a plan is being executed  
**WHEN** each step completes or fails  
**THEN** the status is updated in real-time via WebSocket  
**AND** failed steps trigger the configured retry strategy (linear, exponential, or manual)

---

## Vector Database Integration (51)

### AB-18: Vector Storage and Search

**GIVEN** content chunks with embeddings exist in the vector DB  
**WHEN** a similarity search is performed with a query embedding  
**THEN** the top-K most similar chunks are returned with similarity scores  
**AND** the search completes within 100ms for databases under 1M vectors

---

## Settings, Observability, Reset (12, 11, 14)

### AB-19: Settings Service

**GIVEN** the AI Bridge settings service is initialized  
**WHEN** settings are modified via API  
**THEN** changes are persisted with `IsUserModified: true` and the cache is updated

### AB-20: Health Check

**GIVEN** the AI Bridge server is running  
**WHEN** GET `/health/ready` is called  
**THEN** the response includes: model status, database connectivity, WebSocket status, and uptime

### AB-21: Reset API

**GIVEN** a reset request for scope `rag`  
**WHEN** confirmed within 5 minutes  
**THEN** all RAG databases for all apps are deleted  
**AND** model files and settings are preserved

---

*Wave 6 — Batch 3 (Patched): AI Bridge acceptance criteria with added model switching edge case, circular variable reference detection, and recursive variable resolution.*
