# Shared CLI Frontend: Acceptance Criteria

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  
**Format:** GIVEN/WHEN/THEN (E2E-test-ready)

---

## WebSocket Protocol (02-websocket-protocol.md)

### WS-01: Connection Establishment

**GIVEN** the Go backend is running on the configured port  
**WHEN** the React frontend opens a WebSocket connection to `ws://{host}:{port}/ws`  
**THEN** the backend sends a `connection.established` message with `version` and `serverTime` fields  
**AND** the frontend `isConnected` state becomes `true`

**Edge Cases:**
- **GIVEN** the backend is not running **WHEN** the frontend attempts connection **THEN** the `onError` callback fires and reconnection is scheduled with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- **GIVEN** the connection is established **WHEN** the backend process terminates unexpectedly **THEN** the frontend detects closure within 10 seconds via the keep-alive mechanism and triggers reconnection
- **GIVEN** a `maxRetries` option is set to 5 **WHEN** 5 consecutive reconnection attempts fail **THEN** reconnection stops and `isConnected` remains `false`

### WS-02: Log Subscription

**GIVEN** an active WebSocket connection  
**WHEN** the frontend sends `subscribe.logs` with `{ levels: ["error", "warn"] }`  
**THEN** the backend responds with `subscription.confirmed` for the `logs` subscription  
**AND** only `log.entry` messages matching the requested levels are streamed

**Edge Cases:**
- **GIVEN** an active log subscription **WHEN** the frontend sends `unsubscribe.logs` **THEN** log streaming stops immediately and no further `log.entry` messages arrive
- **GIVEN** no active connection **WHEN** `send()` is called **THEN** the message is silently dropped (no error thrown)

### WS-03: Keep-Alive Mechanism

**GIVEN** an active WebSocket connection  
**WHEN** 30 seconds elapse without activity  
**THEN** the frontend sends a `ping` message  
**AND** the backend responds with `pong` within 10 seconds

**Edge Cases:**
- **GIVEN** a `ping` was sent **WHEN** no `pong` is received within 10 seconds **THEN** the connection is closed and reconnection is initiated
- **GIVEN** rapid `ping` scheduling **WHEN** the connection is already in reconnecting state **THEN** no additional `ping` messages are sent

### WS-04: Command Execution via WebSocket

**GIVEN** an active WebSocket connection  
**WHEN** the frontend sends `command.execute` with `{ command: "search", args: ["--query", "test"] }`  
**THEN** the backend executes the command and returns `command.result` with `success`, `output`, and optional `error`

**Edge Cases:**
- **GIVEN** a command execution is in progress **WHEN** the WebSocket connection drops **THEN** the command continues server-side but the result may be lost (frontend shows timeout error after reconnection)
- **GIVEN** the incoming WebSocket message is malformed JSON **WHEN** the backend parses it **THEN** a `parse.error` message is sent back with the raw payload (truncated to 200 chars) and the connection is NOT closed

---

## Settings Service (03-settings-service.md)

### SF-SS-01: Get Settings

**GIVEN** an active WebSocket connection  
**WHEN** the frontend sends `settings.get`  
**THEN** the backend responds with `settings.current` containing the full settings object grouped by category

### SF-SS-02: Update Settings

**GIVEN** an active WebSocket connection  
**WHEN** the frontend sends `settings.update` with `{ category: "search", values: { maxResults: 20 } }`  
**THEN** the backend persists the change and responds with `settings.updated` with `success: true`  
**AND** the settings version is incremented in the database

**Edge Cases:**
- **GIVEN** the category does not exist **WHEN** `settings.update` is sent **THEN** the backend returns `settings.updated` with `success: false` and an error message
- **GIVEN** the value violates the JSON schema **WHEN** `settings.update` is sent **THEN** validation error is returned without modifying the database

---

## API Tester (04-api-tester.md)

### APT-01: Endpoint Discovery

**GIVEN** the API Tester component is mounted  
**WHEN** the backend provides its endpoint registry  
**THEN** all available endpoints are listed in the sidebar grouped by category (Search, Settings, System)

### APT-02: Preset Payloads

**GIVEN** the user selects an endpoint (e.g., `/api/search`)  
**WHEN** the preset dropdown is opened  
**THEN** pre-configured test payloads (Empty, Basic Search, Nested Search, With Cache) are available  
**AND** selecting a preset populates the request body editor

### APT-03: Send Request and View Response

**GIVEN** the user has configured method, URL, headers, and body  
**WHEN** the user clicks "Send Request"  
**THEN** the request is sent to the backend  
**AND** the response panel shows status code, timing (ms), and formatted JSON body

**Edge Cases:**
- **GIVEN** the backend returns a 500 error **WHEN** the response is displayed **THEN** the error is also shown in the unified error modal
- **GIVEN** the request times out (>30s) **WHEN** no response arrives **THEN** a timeout error is displayed with the elapsed time

### APT-04: cURL Export

**GIVEN** a request is configured with method, URL, headers, and body  
**WHEN** the user clicks "Copy cURL"  
**THEN** a valid cURL command is copied to the clipboard  
**AND** a toast notification confirms the copy

**Edge Cases:**
- **GIVEN** the clipboard API is unavailable **WHEN** "Copy cURL" is clicked **THEN** a fallback textarea with the cURL command is displayed for manual copy

### APT-05: Request History

**GIVEN** the user has sent multiple requests  
**WHEN** the history panel is viewed  
**THEN** recent requests are listed with method, URL, status code, and timestamp  
**AND** clicking a history entry restores the request configuration

---

## Error Modal (05-error-modal.md)

### EM-01: Display Backend Error

**GIVEN** the backend returns a structured error with code, message, details, and stack trace  
**WHEN** the error is received by the frontend  
**THEN** the error modal displays the error code, human-readable message, details section, and full 40-frame stack trace

### EM-02: Display Frontend Error

**GIVEN** a React component throws an unhandled error  
**WHEN** the ErrorBoundary catches it  
**THEN** the error modal displays with `source: "frontend"`, the error message, and the component stack trace

### EM-03: Copy All Error Details

**GIVEN** the error modal is open with error information  
**WHEN** the user clicks "Copy All"  
**THEN** all error details (code, message, details, stack, timestamp, context) are copied to clipboard as formatted text  
**AND** a toast confirms the copy action

**Edge Cases:**
- **GIVEN** the error has no stack trace **WHEN** "Copy All" is clicked **THEN** the copied text omits the stack section gracefully
- **GIVEN** the clipboard API is unavailable **WHEN** "Copy All" is clicked **THEN** a fallback textarea selection is triggered

### EM-04: Dismiss Behavior

**GIVEN** the error modal is open  
**WHEN** the user clicks the [X] button or presses Escape  
**THEN** the modal closes  
**AND** if "Don't show again" is checked, errors of the same code are suppressed for the session

---

## Changelog System (06-changelog-system.md)

### CL-01: Changelog Display

**GIVEN** the frontend loads the changelog component  
**WHEN** CHANGELOG.md content is fetched from the backend  
**THEN** entries are displayed in reverse chronological order with version, date, and change descriptions

### CL-02: Version Filtering

**GIVEN** multiple changelog entries exist  
**WHEN** the user filters by version range  
**THEN** only entries within the specified range are displayed

---

## Port Management (07-port-management.md)

### SF-PM-01: Port Availability Check

**GIVEN** the CLI is starting up  
**WHEN** the configured port is checked for availability  
**THEN** if the port is free, the server binds to it  
**AND** if the port is occupied, the process name and PID are reported

**Edge Cases:**
- **GIVEN** the primary port is occupied **WHEN** fallback is enabled **THEN** the next available port in the range is used and the actual port is logged
- **GIVEN** all ports in the range are occupied **WHEN** startup is attempted **THEN** a clear error with all attempted ports is displayed

---

## Component Library (10-component-library.md)

### CL-03: Shared Components Render

**GIVEN** any CLI frontend imports shared components  
**WHEN** the component is rendered  
**THEN** it uses the standardized design tokens and responds to light/dark theme changes

> **Note:** Renamed from `CL-01` to `CL-03` to resolve ID collision with Changelog `CL-01`.

---

*Wave 6 — Batch 1 (Patched v2): Shared CLI Frontend acceptance criteria. ID renames: CL-01→CL-03, SS→SF-SS, AT→APT (API Tester), PM→SF-PM. Resolves cross-silo collisions with AI Transcribe (AT) and BRun (PM).*
