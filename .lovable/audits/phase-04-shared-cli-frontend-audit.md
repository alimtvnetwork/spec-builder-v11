# Phase 4: Shared CLI Frontend Audit

**Date:** 2026-02-06  
**Auditor:** AI  
**Scope:** `spec/28-shared-cli-frontend/`  
**Files Reviewed:** 17  
**Status:** Complete

---

## 1. Inconsistency Report

| # | File(s) | Description | Severity |
|---|---------|-------------|----------|
| I-01 | `spec/28-shared-cli-frontend/00-overview.md` lines 22-24 | **Missing CLIs from the applicable list.** Lists only 4 CLIs (GSearch, BRun, AI Bridge, Nexus Flow) but the ecosystem also includes WP SEO Publish CLI, Spec Reverse CLI, and AI Transcribe CLI — all Go-based CLI tools with frontends. The overview should reference all 7. | 🟡 Warning |
| I-02 | `spec/28-shared-cli-frontend/99-consistency-report.md` lines 80-84 | **Port allocation conflicts with individual CLI specs.** The consistency report shows AI Bridge at port 8110/8111 and Nexus Flow at 8089/8120, but the `spec/06-split-db-architecture/03-database-flow-diagrams.md` shows AI Bridge at `:8089` and GSearch at `:8087`, BRun at `:8088`, Nexus Flow at `:8085`. Multiple documents disagree on port assignments. | 🔴 Critical |
| I-03 | `spec/28-shared-cli-frontend/99-consistency-report.md` lines 100-110 | **Cross-reference paths are wrong.** Lists `spec/gsearch-cli/24-frontend-architecture.md` but actual path is `spec/20-gsearch-cli/02-frontend/...`. All four CLI cross-reference paths are incorrect (missing numeric prefix). | 🔴 Critical |
| I-04 | `spec/28-shared-cli-frontend/02-websocket-protocol.md` lines 46-51 | **WebSocket message interface uses `camelCase` JSON fields.** Shows `type`, `id`, `payload`, `timestamp` — should be PascalCase (`Type`, `Id`, `Payload`, `Timestamp`) per project-wide convention. | 🟡 Warning |
| I-05 | `spec/28-shared-cli-frontend/03-settings-service.md` lines 141-159 | **Settings DB schema uses `snake_case`.** Tables `settings` and `settings_meta` with columns `created_at`, `updated_at`, `seed_version` — violates PascalCase database naming convention. | 🔴 Critical |
| I-06 | `spec/28-shared-cli-frontend/10-component-library.md` line 337 | **Broken cross-reference.** References `../cw-config-architecture/00-overview.md` but the actual path is `../07-seedable-config-architecture/00-overview.md`. | 🟠 Minor |
| I-07 | `spec/28-shared-cli-frontend/15-hooks-library.md` lines 41-61 | **Theme list doesn't match E2E test spec.** Hooks library defines 20 theme values (dracula, nord, solarized-dark, etc.) but the E2E test spec (11-e2e-test-spec.md lines 188-194) only tests 5 themes (dracula, nord, solarized-dark, monokai, tokyo-night). The consistency report (99-consistency-report.md lines 129-138) lists yet another set of themes (ocean-blue, forest-green, sunset-orange, midnight-purple, etc.) that don't match either list. Three documents, three different theme lists. | 🟡 Warning |
| I-08 | `spec/28-shared-cli-frontend/00-overview.md` line 166 | **PowerShell integration link uses old folder name.** References `spec/50-powershell-integration/` but actual folders are `spec/06-powershell-integration-v1/` and `spec/06-powershell-integration-v2/`. | 🟠 Minor |
| I-09 | `spec/28-shared-cli-frontend/11-e2e-test-spec.md` lines 155-158 | **Dark mode background color assumption.** Tests assert `background-color: rgb(10, 10, 10)` for dark mode and `rgb(255, 255, 255)` for light mode, but these are hardcoded pixel values that depend on the specific theme implementation. If CSS variables change, tests break silently. Tests should assert CSS variable values or class presence, not computed RGB values. | 🟠 Minor |

---

## 2. Missing Acceptance Criteria

| File | Has AC? | Notes |
|------|---------|-------|
| `00-overview.md` | ❌ | Architecture overview, no testable criteria |
| `01-folder-structure.md` | ❌ | Directory layout, no validation criteria |
| `02-websocket-protocol.md` | ❌ | Protocol spec, no criteria |
| `03-settings-service.md` | ❌ | Has code examples but no criteria |
| `04-api-tester.md` | ❌ | |
| `05-error-modal.md` | ❌ | |
| `06-changelog-system.md` | ❌ | |
| `07-port-management.md` | ❌ | |
| `08-powershell-integration.md` | ❌ | |
| `09-deploy-folder.md` | ❌ | |
| `10-component-library.md` | ❌ | Has testing requirements section but no formal AC |
| `11-e2e-test-spec.md` | Partial ⚠️ | Has Playwright test code but NOT formal AC — tests are implementation, not specification |
| `12-accessibility-spec.md` | ❌ | Has WCAG requirements but no testable criteria |
| `13-visual-regression-spec.md` | ❌ | |
| `14-architecture-template.md` | ❌ | |
| `15-hooks-library.md` | ❌ | Has implementation code but no criteria |

---

## 3. Detailed Acceptance Criteria

### 3.1 WebSocket Protocol

---

**AC-P4-001: WebSocket Connection Lifecycle**

GIVEN: A Go CLI backend is running with the WebSocket endpoint registered at `/ws`, and a React frontend application is loaded in a browser

WHEN: The frontend's `useWebSocket` hook initializes a connection to `ws://{host}:{port}/ws`

THEN:
- The WebSocket connection MUST be established successfully (readyState = OPEN)
- The backend MUST immediately send a `connection.established` message with payload: `{"Version": "<cli-version>", "ServerTime": "<ISO8601>"}`
- All WebSocket messages MUST follow the standard envelope: `{"Type": "<message-type>", "Id": "<optional-uuid>", "Payload": <message-specific>, "Timestamp": "<ISO8601>"}`
- All JSON field names in WebSocket messages MUST use PascalCase (e.g., `Type`, `Payload`, `Timestamp`)
- The frontend MUST send a `ping` message every 30 seconds to keep the connection alive
- The backend MUST respond to each `ping` with a `pong` message within 10 seconds
- If no `pong` is received within 10 seconds, the frontend MUST close the current connection and attempt reconnection after a configurable interval (default: 3000ms)
- On `ws.onclose`, the frontend MUST log the close code, reason, and `wasClean` flag, then attempt automatic reconnection
- On `ws.onerror`, the frontend MUST update the connection store status to "error" and display a toast with the CLI's frontend WebSocket error code (e.g., 7050 for GSearch)

EDGE CASES:
- If the backend is restarted while the frontend is connected, the WebSocket MUST close with code 1006 (abnormal closure) and the frontend MUST automatically reconnect when the backend becomes available again
- If the frontend sends a message while the WebSocket is in CONNECTING state (readyState = 0), the message MUST be queued and sent after the connection opens, NOT dropped or errored
- If the backend sends a message with an unrecognized `Type` field, the frontend MUST log a warning but NOT crash — unknown message types are silently ignored
- If two browser tabs open WebSocket connections to the same backend, both MUST receive independent message streams without interference

---

**AC-P4-002: WebSocket Log Streaming**

GIVEN: A WebSocket connection is established and the frontend has sent a `subscribe.logs` message with payload `{"Levels": ["INFO", "WARN", "ERROR"]}`

WHEN: The Go backend generates log entries at various levels

THEN:
- The backend MUST send a `subscription.confirmed` message with payload `{"Subscription": "logs"}` acknowledging the subscription
- For each log entry at a subscribed level, the backend MUST send a `log.entry` message with payload: `{"Id": "<unique-id>", "Level": "INFO|WARN|ERROR", "Message": "<log text>", "Timestamp": "<ISO8601>", "Source": "<module.function>", "File": "<source-file>", "Line": <line-number>, "Metadata": {<optional-key-value-pairs>}}`
- Log entries at levels NOT in the subscription (e.g., DEBUG) MUST NOT be sent to the frontend
- The frontend's LogViewer component MUST append each received log entry to its display buffer
- If auto-scroll is enabled, the LogViewer MUST scroll to the bottom after each new entry
- If auto-scroll is disabled (user scrolled up), new entries MUST be appended without scrolling
- The frontend MUST support filtering displayed logs by level, searching log text, and copying the entire log buffer to clipboard
- When `unsubscribe.logs` is sent, the backend MUST stop sending log entries

EDGE CASES:
- If the backend generates logs faster than the WebSocket can transmit (backpressure), the backend MUST buffer up to 1000 entries and drop the oldest if the buffer overflows — the frontend MUST be notified of dropped entries via a `log.overflow` message with the count of dropped entries
- If the log message contains HTML/script content, the frontend MUST render it as plain text (escaped) to prevent XSS
- If the WebSocket disconnects and reconnects, the frontend MUST re-send `subscribe.logs` to restore the subscription — it MUST NOT assume the subscription persists across reconnections

---

### 3.2 Settings Service

---

**AC-P4-003: Settings CRUD Operations**

GIVEN: A CLI backend has a seeded `Settings` table with categories "general", "search", and "network", and the settings API endpoints are available at `/api/v1/settings`

WHEN: Various CRUD operations are performed on settings

THEN:
- **GET /api/v1/settings**: MUST return all settings grouped by category in the standard response envelope: `{"Success": true, "Data": {"General": {"Theme": "system", "Language": "en"}, "Search": {...}, "Network": {...}}}`
- **GET /api/v1/settings/{category}**: MUST return settings for a single category. If the category does not exist, MUST return HTTP 404 with error
- **PUT /api/v1/settings/{category}**: MUST accept a JSON body with key-value pairs and update only the provided settings within that category. Settings not included in the body MUST NOT be modified. Each updated setting's `UpdatedAt` timestamp MUST be refreshed. The response MUST include the list of actually updated keys and their new values
- **Settings validation**: Before saving, each setting value MUST be validated against its declared type and constraints (e.g., a `number` type setting with `min: 1024` and `max: 65535` MUST reject value `99999`). Validation failures MUST return HTTP 400 with per-field error details
- **Settings persistence**: All settings MUST be stored in the SQLite database and MUST survive backend restarts
- **Settings change notification**: After successful update, a `settings.updated` WebSocket message MUST be broadcast to all connected frontend clients

EDGE CASES:
- If a setting key in the PUT body does not exist in the database, the system MUST return HTTP 400 with `"Unknown setting: {key}"` — it MUST NOT silently create new settings via the API
- If the database is locked during a write, the system MUST retry with the busy_timeout (5000ms) before returning HTTP 503
- If a `select` type setting receives a value not in its `options` array, the validation MUST reject it with a message listing the valid options

---

### 3.3 Component Library

---

**AC-P4-004: Shared Component Theming Compliance**

GIVEN: The shared component library is used across all CLI frontends with the theme system providing CSS custom properties

WHEN: A component is rendered in any of the supported themes (light, dark, system, high-contrast, dracula, nord, etc.)

THEN:
- Every component MUST use only semantic CSS variable tokens for colors: `bg-background`, `text-foreground`, `border-border`, `bg-primary`, `text-primary-foreground`, `bg-secondary`, `bg-muted`, `bg-accent`, `bg-destructive`, etc.
- NO component MAY contain hardcoded color classes (e.g., `text-white`, `bg-gray-900`, `border-gray-200`) — all colors MUST flow from the theme system
- In high-contrast mode, all text MUST meet WCAG 2.1 AAA contrast ratio (7:1) against its background
- In all other modes, all text MUST meet WCAG 2.1 AA contrast ratio (4.5:1 for normal text, 3:1 for large text)
- All interactive elements (buttons, inputs, links) MUST have visible focus indicators with contrast ratio ≥ 3:1 against adjacent colors
- Theme switching MUST be instantaneous (no flash of unstyled content) — CSS variables are updated on the `:root` element via class/attribute change
- The currently active theme MUST persist across page reloads via `localStorage` key `cli-theme`

EDGE CASES:
- If `localStorage` is unavailable (e.g., private browsing in some browsers), the theme MUST fall back to "system" and the system MUST NOT throw an error
- If the stored theme value is invalid (e.g., corrupted localStorage), the system MUST reset to "system" and remove the invalid value
- If the user's system preference changes while the app is open (e.g., macOS auto-switches to dark mode at sunset), and the theme is set to "system", the app MUST immediately reflect the change via the `matchMedia('(prefers-color-scheme: dark)')` listener

---

### 3.4 Accessibility

---

**AC-P4-005: WCAG 2.1 AA Keyboard Navigation Compliance**

GIVEN: A CLI frontend application is loaded in a browser and the user is navigating exclusively via keyboard (no mouse/touch)

WHEN: The user presses Tab, Shift+Tab, Enter, Space, Escape, and Arrow keys

THEN:
- **Tab order**: Pressing Tab MUST move focus through all interactive elements in a logical, predictable order matching the visual layout. Pressing Shift+Tab MUST reverse the order
- **Skip links**: On the first Tab press after page load, a "Skip to main content" link MUST become visible and focused. Pressing Enter on this link MUST move focus to the `<main>` element
- **Buttons**: Pressing Enter or Space on a focused button MUST trigger its click handler
- **Modals**: When a modal opens, focus MUST be trapped within the modal. Tab MUST cycle through modal elements only. Escape MUST close the modal. On close, focus MUST return to the element that opened the modal
- **Dropdowns/Select**: Space or Enter MUST open the dropdown. Arrow Up/Down MUST navigate options. Enter MUST select the focused option. Escape MUST close without selecting
- **Tabs (TabBar)**: Arrow Left/Right MUST switch between tabs. The active tab MUST have `aria-selected="true"` and `tabIndex={0}`. Inactive tabs MUST have `tabIndex={-1}`
- **Focus indicators**: Every focused element MUST have a visible focus ring with contrast ratio ≥ 3:1 against its background. The focus ring MUST be visible in ALL themes (light, dark, high-contrast)
- **No focus traps**: Outside of modals, the user MUST be able to Tab through ALL interactive elements on the page and eventually reach the browser's address bar — there MUST be no accidental focus traps

EDGE CASES:
- If a button is disabled (`aria-disabled="true"`), it MUST still be focusable but MUST NOT trigger its action on Enter/Space
- If a component is dynamically added to the DOM (e.g., a toast notification), it MUST NOT steal focus from the user's current position unless it has `role="alert"` with `aria-live="assertive"`
- If the user activates "reduced motion" in their OS settings, all CSS transitions and animations MUST be disabled or reduced to opacity-only transitions (via `prefers-reduced-motion: reduce` media query)

---

**AC-P4-006: Screen Reader Compatibility**

GIVEN: A CLI frontend is loaded in a browser with a screen reader active (NVDA, VoiceOver, or JAWS)

WHEN: The screen reader navigates the page

THEN:
- The page MUST have semantic landmarks: `<header>` with `role="banner"`, `<nav>` with `aria-label="Main navigation"`, `<main>` with `role="main"`, `<aside>` with `role="complementary"` (if sidebar exists), `<footer>` with `role="contentinfo"`
- All images MUST have descriptive `alt` attributes. Decorative images MUST have `alt=""`and `aria-hidden="true"`
- All form fields MUST have associated `<label>` elements via `htmlFor`/`id` pairing. Required fields MUST have `aria-required="true"` and a visual indicator (asterisk) that is also announced via `<span className="sr-only">(required)</span>`
- Form validation errors MUST be announced via `role="alert"` and `aria-live="assertive"` when they appear
- Loading states MUST be announced: buttons with loading spinners MUST have `aria-busy="true"` and a `<span className="sr-only">Loading...</span>`
- Toast notifications MUST use `aria-live="polite"` for informational messages and `aria-live="assertive"` for errors
- Data tables MUST use proper `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>` markup with `scope="col"` on header cells

EDGE CASES:
- If a component uses `display: none` or `visibility: hidden`, it MUST NOT be announced by the screen reader. If it should be visually hidden but still announced, it MUST use the `sr-only` CSS class (position: absolute, width: 1px, height: 1px, overflow: hidden, clip: rect(0,0,0,0))
- If dynamic content updates (e.g., new log entries in LogViewer), the live region MUST NOT announce every single log entry — instead, a periodic summary (e.g., "5 new log entries") SHOULD be announced via a throttled live region
- If the application uses `aria-label` on a container, the label MUST be concise and descriptive (not the full content of the container)

---

### 3.5 E2E Test Coverage

---

**AC-P4-007: E2E Test Suite Minimum Coverage**

GIVEN: The shared CLI frontend E2E test suite is executed via Playwright across all target browsers (Chromium, Firefox, WebKit) and mobile viewport

WHEN: The full test suite completes

THEN:
- The test suite MUST cover these critical user flows with at least one test each: (1) Settings load, modify, save, and persist across reload, (2) Theme switching for light, dark, system, and at least one colorful theme, (3) WebSocket connection establishment and log streaming, (4) API Tester request building, execution, and response display, (5) Error modal display with diagnostics on connection failure, (6) Changelog modal display on version change, (7) Port configuration and validation
- Each test MUST complete within its timeout (default: 30 seconds, network tests: 35 seconds)
- Failed tests MUST retry up to 2 times before being marked as failed
- The test suite MUST generate: a JUnit XML report for CI integration, HTML report with screenshots on failure, and trace files for debugging
- All tests MUST pass in all 4 browser projects (Chromium, Firefox, WebKit, mobile iPhone 13 viewport)
- Tests MUST NOT depend on external services — all API calls MUST be mocked via Playwright's `route()` or MSW
- Test assertions MUST use `data-testid` attributes for element selection, NOT CSS classes or text content (which can change with themes/i18n)

EDGE CASES:
- If a test is flaky (passes intermittently), it MUST be quarantined with a `test.fixme()` annotation and a linked issue — flaky tests MUST NOT block CI
- If a new component is added to the shared library, at minimum a render test and an accessibility audit test (via `axe-core`) MUST be added before merge
- Mobile viewport tests MAY have relaxed timing constraints (timeouts multiplied by 1.5) to account for slower rendering

---

## 4. Remediation Recommendations

| Priority | Action | Files Affected |
|----------|--------|----------------|
| 🔴 P0 | Establish a single authoritative port allocation document and fix conflicting port numbers across specs. Recommended: create `spec/28-shared-cli-frontend/16-port-allocation.md` as the single source of truth. | `99-consistency-report.md`, `spec/06-split-db-architecture/03-database-flow-diagrams.md`, all CLI overview files |
| 🔴 P0 | Fix cross-reference paths in consistency report to include numeric prefixes (e.g., `spec/20-gsearch-cli/...`) | `99-consistency-report.md` |
| 🔴 P0 | Convert settings DB schema from `snake_case` to PascalCase in `03-settings-service.md` | `03-settings-service.md` |
| 🟡 P1 | Convert WebSocket message JSON fields from `camelCase` to PascalCase in `02-websocket-protocol.md` | `02-websocket-protocol.md` |
| 🟡 P1 | Establish a single authoritative theme list and update all three documents (hooks library, E2E tests, consistency report) to reference it | `15-hooks-library.md`, `11-e2e-test-spec.md`, `99-consistency-report.md` |
| 🟡 P1 | Add WP SEO Publish, Spec Reverse, and AI Transcribe CLIs to the applicable CLIs list | `00-overview.md` |
| 🟠 P2 | Fix broken cross-reference to CW Config architecture in component library | `10-component-library.md` |
| 🟠 P2 | Replace hardcoded RGB values in E2E tests with CSS variable-based assertions | `11-e2e-test-spec.md` |

---

*Phase 4 audit completed. 9 inconsistencies found, 7 acceptance criteria written.*
