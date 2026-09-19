# GSearch CLI Frontend Implementation Checklist

> **Version:** 2.0.0  
> **Created:** 2026-03-09  
> **Parent:** [24-frontend-architecture.md](./02-frontend-architecture.md)  
> **Purpose:** Detailed implementation reference for all CLI frontend builds

---

## Overview

This checklist provides a step-by-step implementation guide for the GSearch CLI frontend. It serves as a **reference template** for implementing all CLI frontends (BRun, AI Bridge, Nexus Flow).

**Time Estimate:** 15-20 hours for complete implementation

---

## Phase 1: Project Setup

### 1.1 Directory Structure

- [ ] Create `frontend/` directory in project root
- [ ] Initialize with `npm create vite@latest . -- --template react-ts`
- [ ] Create folder structure:
  ```
  frontend/
  ├── src/
  │   ├── components/
  │   │   ├── common/        # Shared UI components
  │   │   ├── search/        # GSearch-specific (varies per CLI)
  │   │   └── ui/            # shadcn/ui components
  │   ├── hooks/             # Custom React hooks
  │   ├── lib/               # Utilities and helpers
  │   │   ├── api/           # API client
  │   │   ├── errors/        # Error handling
  │   │   └── websocket/     # WebSocket manager
  │   ├── pages/             # Route components
  │   ├── stores/            # Zustand stores
  │   └── types/             # TypeScript definitions
  ├── public/
  └── index.html
  ```

### 1.2 Dependencies

- [ ] Install core dependencies:
  ```bash
  npm install react react-dom react-router-dom
  npm install @tanstack/react-query zustand
  npm install class-variance-authority clsx tailwind-merge
  npm install lucide-react sonner
  ```

- [ ] Install dev dependencies:
  ```bash
  npm install -D typescript @types/react @types/react-dom
  npm install -D tailwindcss postcss autoprefixer
  npm install -D @vitejs/plugin-react-swc vite
  ```

- [ ] Install shadcn/ui (follow shadcn init):
  ```bash
  npx shadcn@latest init
  npx shadcn@latest add button card dialog input label select tabs toast
  ```

### 1.3 Configuration Files

- [ ] Configure `vite.config.ts`:
  ```typescript
  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react-swc'
  import path from 'path'

  export default defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': 'http://localhost:8090',
        '/ws': {
          target: 'ws://localhost:8090',
          ws: true,
        },
      },
    },
  })
  ```

- [ ] Configure `tailwind.config.js` with CLI-specific theme colors
- [ ] Configure `tsconfig.json` with path aliases

---

## Phase 2: Core Infrastructure

### 2.1 WebSocket Manager

**Reference:** `02-spec/33-shared-cli-frontend/02-websocket-protocol.md`

- [ ] Create `src/lib/websocket/WebSocketManager.ts`:
  - [ ] Connection lifecycle (connect, disconnect, reconnect)
  - [ ] Auto-reconnect with exponential backoff
  - [ ] Event subscription system
  - [ ] Message queue for offline buffering
  - [ ] Connection status observable

- [ ] Create `src/lib/websocket/types.ts`:
  - [ ] Define `WebSocketMessage<T>` interface
  - [ ] Define event type constants
  - [ ] Define connection status enum

- [ ] Create `src/hooks/useWebSocket.ts`:
  - [ ] Hook for WebSocket connection state
  - [ ] Hook for subscribing to specific events
  - [ ] Auto-cleanup on unmount

### 2.2 API Client

**Reference:** `02-spec/33-shared-cli-frontend/04-api-tester.md`

- [ ] Create `src/lib/api/client.ts`:
  - [ ] Base fetch wrapper with error handling
  - [ ] Request/response interceptors
  - [ ] Timeout configuration (default 30s)
  - [ ] Retry logic for transient failures

- [ ] Create `src/lib/api/endpoints.ts`:
  - [ ] Define all API endpoints as constants
  - [ ] Type-safe request/response definitions

- [ ] Create API hooks in `src/hooks/`:
  - [ ] `useSearch.ts` - Search operations
  - [ ] `useSettings.ts` - Settings CRUD
  - [ ] `useVersion.ts` - Version/changelog
  - [ ] `useHealth.ts` - Health check

### 2.3 Error Handling System

**Reference:** `02-spec/33-shared-cli-frontend/05-error-modal.md`

- [ ] Create `src/lib/errors/AppError.ts`:
  ```typescript
  export class AppError extends Error {
    constructor(
      public code: number,
      message: string,
      public details?: Record<string, unknown>
    ) {
      super(message);
    }
  }
  ```

- [ ] Create `src/lib/errors/codes.ts`:
  - [ ] Define error codes 7050-7069 (GSearch frontend range)
  - [ ] Export as typed constants

- [ ] Create `src/lib/errors/ErrorBoundary.tsx`:
  - [ ] React Error Boundary component
  - [ ] Capture unhandled React errors
  - [ ] Report to error modal store

- [ ] Create `src/stores/errorStore.ts`:
  - [ ] Zustand store for error state
  - [ ] Actions: setError, clearError
  - [ ] Stack trace capture (40 frames)

### 2.4 State Management

- [ ] Create `src/stores/appStore.ts`:
  - [ ] App-level state (theme, sidebar, etc.)
  
- [ ] Create `src/stores/settingsStore.ts`:
  - [ ] Settings state from backend
  - [ ] Optimistic updates
  - [ ] Sync with localStorage fallback

- [ ] Create `src/stores/searchStore.ts` (GSearch-specific):
  - [ ] Active search state
  - [ ] Search history
  - [ ] Results cache

---

## Phase 3: Common Components

### 3.1 Layout Components

**Reference:** `02-spec/33-shared-cli-frontend/08-common-components.md`

- [ ] Create `src/components/common/Layout.tsx`:
  - [ ] Sidebar navigation
  - [ ] Header with version display
  - [ ] Content area with outlet

- [ ] Create `src/components/common/Sidebar.tsx`:
  - [ ] Navigation links
  - [ ] Connection status indicator
  - [ ] Settings link

- [ ] Create `src/components/common/Header.tsx`:
  - [ ] App name/logo
  - [ ] Version badge
  - [ ] Theme toggle

### 3.2 Log Viewer

**Reference:** `02-spec/33-shared-cli-frontend/02-websocket-protocol.md`

- [ ] Create `src/components/common/LogViewer.tsx`:
  - [ ] Virtual scrolling for performance
  - [ ] Log level filtering (DEBUG, INFO, WARN, ERROR)
  - [ ] Timestamp display with timezone
  - [ ] Auto-scroll with pause on hover
  - [ ] One-click copy entire buffer
  - [ ] Clear logs button
  - [ ] Search/filter logs

- [ ] Create `src/hooks/useLogs.ts`:
  - [ ] WebSocket subscription for log events
  - [ ] Log buffer management (max 10,000 lines)
  - [ ] Log level filtering state

### 3.3 Settings Page

**Reference:** `02-spec/33-shared-cli-frontend/03-settings-service.md`

- [ ] Create `src/pages/Settings.tsx`:
  - [ ] Category tabs navigation
  - [ ] Settings form per category
  - [ ] Save/reset buttons
  - [ ] Re-seed from file button

- [ ] Create `src/components/common/SettingsForm.tsx`:
  - [ ] Dynamic form generation from schema
  - [ ] Support types: string, number, boolean, select, array
  - [ ] Validation feedback
  - [ ] Dirty state tracking

- [ ] Create `src/components/common/SettingsCategory.tsx`:
  - [ ] Category header with description
  - [ ] Settings list for category
  - [ ] Expand/collapse support

### 3.4 API Tester

**Reference:** `02-spec/33-shared-cli-frontend/04-api-tester.md`

- [ ] Create `src/pages/ApiTester.tsx`:
  - [ ] Endpoint selector dropdown
  - [ ] Preset data selector
  - [ ] Request body editor (JSON)
  - [ ] Send button
  - [ ] Response viewer

- [ ] Create `src/components/common/EndpointCard.tsx`:
  - [ ] Method badge (GET, POST, etc.)
  - [ ] Path display
  - [ ] Quick-run button

- [ ] Create `src/components/common/ResponseViewer.tsx`:
  - [ ] Syntax-highlighted JSON
  - [ ] Status code display
  - [ ] Response time
  - [ ] Copy as cURL button

### 3.5 Error Modal

**Reference:** `02-spec/33-shared-cli-frontend/05-error-modal.md`

- [ ] Create `src/components/common/ErrorModal.tsx`:
  - [ ] Error code display (large, prominent)
  - [ ] Error message
  - [ ] Stack trace viewer (collapsible)
  - [ ] Copy all button
  - [ ] Dismiss button
  - [ ] "Report Issue" link (optional)

- [ ] Create `src/components/common/StackTraceViewer.tsx`:
  - [ ] Formatted stack trace display
  - [ ] File/line highlighting
  - [ ] Copy individual frames

### 3.6 Changelog Modal

**Reference:** `02-spec/33-shared-cli-frontend/06-changelog-system.md`

- [ ] Create `src/components/common/ChangelogModal.tsx`:
  - [ ] Version comparison (old → new)
  - [ ] Markdown changelog rendering
  - [ ] "Don't show again for this version" checkbox
  - [ ] Dismiss button

- [ ] Create `src/hooks/useChangelog.ts`:
  - [ ] Fetch changelog on version change
  - [ ] Store dismissed versions in localStorage
  - [ ] Auto-show modal on version update

### 3.7 Connection Status

**Reference:** `02-spec/33-shared-cli-frontend/07-port-management.md`

- [ ] Create `src/components/common/ConnectionStatus.tsx`:
  - [ ] WebSocket status indicator (connected/disconnected/reconnecting)
  - [ ] Port display
  - [ ] Firewall warning if blocked

- [ ] Create `src/components/common/NetworkSettings.tsx`:
  - [ ] Port configuration
  - [ ] Firewall status check
  - [ ] "Enable Firewall Rule" button (triggers admin prompt)

---

## Phase 4: GSearch-Specific Components

### 4.1 Search Dashboard

- [ ] Create `src/pages/Dashboard.tsx`:
  - [ ] Search form prominent
  - [ ] Quick stats (total searches, cached results)
  - [ ] Recent searches list
  - [ ] Active search progress (if any)

- [ ] Create `src/components/search/SearchForm.tsx`:
  - [ ] Keyword input (with tag support for multi-keyword)
  - [ ] Engine selector (Google, Bing, DuckDuckGo)
  - [ ] Advanced options toggle:
    - [ ] Max results
    - [ ] Enable nested search
    - [ ] Nested depth
    - [ ] Bypass cache
  - [ ] Submit button with loading state

- [ ] Create `src/components/search/SearchStatus.tsx`:
  - [ ] Progress bar
  - [ ] Current engine/method display
  - [ ] Results count (live updating)
  - [ ] Cancel button
  - [ ] Time elapsed

### 4.2 Results Viewer

- [ ] Create `src/pages/Results.tsx`:
  - [ ] Results list with pagination
  - [ ] Filter sidebar
  - [ ] Export button
  - [ ] Sort options

- [ ] Create `src/components/search/ResultsList.tsx`:
  - [ ] Virtual scrolling for large result sets
  - [ ] Result cards
  - [ ] Load more / pagination

- [ ] Create `src/components/search/ResultCard.tsx`:
  - [ ] Title (link to URL)
  - [ ] Description (truncated)
  - [ ] URL display
  - [ ] Position badge
  - [ ] Engine badge
  - [ ] Copy URL button

- [ ] Create `src/components/search/ResultFilters.tsx`:
  - [ ] Filter by engine
  - [ ] Filter by date
  - [ ] Search within results

- [ ] Create `src/components/search/ExportDialog.tsx`:
  - [ ] Format selector (JSON, CSV, RAG)
  - [ ] Options per format
  - [ ] Download button

### 4.3 Search History

- [ ] Create `src/pages/History.tsx`:
  - [ ] History list with search metadata
  - [ ] Date range filter
  - [ ] Search in history
  - [ ] Bulk delete

- [ ] Create `src/components/search/HistoryList.tsx`:
  - [ ] Search summary cards
  - [ ] Replay button
  - [ ] Delete button
  - [ ] Compare checkbox

- [ ] Create `src/components/search/HistoryCard.tsx`:
  - [ ] Keywords used
  - [ ] Date/time
  - [ ] Result count
  - [ ] Engine used
  - [ ] Quick actions (view, replay, delete)

- [ ] Create `src/components/search/CompareDialog.tsx`:
  - [ ] Side-by-side comparison
  - [ ] Highlight differences
  - [ ] Common results

---

## Phase 5: Routing & Pages

### 5.1 Router Setup

- [ ] Create `src/App.tsx`:
  - [ ] React Router setup
  - [ ] Layout wrapper
  - [ ] Route definitions

- [ ] Define routes:
  | Route | Page | Description |
  |-------|------|-------------|
  | `/` | Dashboard | Main search interface |
  | `/results/:id` | Results | Search results viewer |
  | `/history` | History | Search history |
  | `/settings` | Settings | Configuration |
  | `/api-tester` | ApiTester | API testing tool |
  | `/logs` | Logs | Live log viewer |

### 5.2 Page Integration

- [ ] Implement all pages with proper:
  - [ ] Loading states (skeletons)
  - [ ] Error states (with retry)
  - [ ] Empty states (helpful messages)
  - [ ] SEO meta (if applicable)

---

## Phase 6: Integration & Testing

### 6.1 Backend Integration

- [ ] Verify all API endpoints work:
  - [ ] `GET /api/health`
  - [ ] `GET /api/version`
  - [ ] `POST /api/search`
  - [ ] `GET /api/search/:id`
  - [ ] `GET /api/search/:id/results`
  - [ ] `GET /api/search/history`
  - [ ] `GET /api/settings`
  - [ ] `PUT /api/settings/:category`
  - [ ] `POST /api/settings/seed`
  - [ ] `GET /api/network/status`

- [ ] Verify WebSocket events:
  - [ ] `connection` / `disconnection`
  - [ ] `log` events with all levels
  - [ ] `search.started`
  - [ ] `search.progress`
  - [ ] `search.result`
  - [ ] `search.completed`
  - [ ] `search.error`
  - [ ] `settings.updated`

### 6.2 Testing

- [ ] Unit tests for:
  - [ ] API client
  - [ ] WebSocket manager
  - [ ] Error handling
  - [ ] Zustand stores

- [ ] Component tests for:
  - [ ] SearchForm
  - [ ] ResultCard
  - [ ] SettingsForm
  - [ ] LogViewer
  - [ ] ErrorModal

- [ ] Integration tests for:
  - [ ] Search flow (form → progress → results)
  - [ ] Settings (load → edit → save)
  - [ ] Error display (trigger → modal → dismiss)

- [ ] E2E tests for:
  - [ ] Complete search workflow
  - [ ] Settings persistence
  - [ ] WebSocket reconnection

### 6.3 Performance

- [ ] Verify virtual scrolling for:
  - [ ] Log viewer (10,000+ lines)
  - [ ] Results list (1,000+ results)
  - [ ] History list (500+ entries)

- [ ] Verify bundle size:
  - [ ] Target: < 500KB gzipped
  - [ ] Code splitting per route
  - [ ] Tree shaking for unused code

---

## Phase 7: PowerShell Integration

### 7.1 PowerShell Configuration

**Reference:** `02-spec/33-shared-cli-frontend/09-powershell-integration.md`

- [ ] Create/update `powershell.json`:
  ```json
  {
    "projectName": "gsearch",
    "rootDir": ".",
    "backendDir": "backend",
    "frontendDir": "frontend",
    "distDir": "dist",
    "targetDir": "backend/frontend/dist",
    "dataDir": "backend/data",
    "ports": [8090, 8091, 8092],
    "prerequisites": {
      "go": true,
      "node": true,
      "npm": true
    },
    "cleanPaths": [
      "frontend/node_modules",
      "frontend/dist",
      "backend/data/*.db"
    ],
    "buildCommand": "npm run build",
    "installCommand": "npm install",
    "runCommand": "go run main.go serve --port 8090"
  }
  ```

- [ ] Copy/verify `run.ps1` from shared template

### 7.2 Build Verification

- [ ] Test PowerShell runner:
  - [ ] `.\run.ps1` - Full build and run
  - [ ] `.\run.ps1 -SkipBuild` - Run without rebuild
  - [ ] `.\run.ps1 -Clean` - Clean before build
  - [ ] `.\run.ps1 -Port 8091` - Custom port

- [ ] Verify embedded frontend:
  - [ ] Frontend builds to `frontend/dist`
  - [ ] Backend serves from `backend/frontend/dist`
  - [ ] Static assets load correctly

---

## Phase 8: Documentation

- [ ] Update `README.md` with:
  - [ ] Frontend development instructions
  - [ ] Available scripts
  - [ ] Architecture overview

- [ ] Create `CHANGELOG.md` following format:
  ```markdown
  # Changelog
  
  ## [1.0.0] - 2026-02-01
  
  ### Added
  - Initial frontend implementation
  - WebSocket live logs
  - Settings management
  - Search dashboard
  - Results viewer
  - Search history
  ```

- [ ] Update spec consistency report

---

## Adaptation Guide for Other CLIs

### BRun CLI Adaptations

| GSearch Component | BRun Equivalent |
|-------------------|-----------------|
| `SearchForm.tsx` | `BuildForm.tsx` |
| `ResultCard.tsx` | `BuildOutputCard.tsx` |
| `SearchStatus.tsx` | `BuildProgress.tsx` |
| Search history | Build history |
| Engine selector | Build target selector |

### AI Bridge Adaptations

| GSearch Component | AI Bridge Equivalent |
|-------------------|---------------------|
| `SearchForm.tsx` | `PromptForm.tsx` |
| `ResultCard.tsx` | `ResponseCard.tsx` |
| `SearchStatus.tsx` | `StreamingStatus.tsx` |
| Engine selector | Model selector |
| Search history | Conversation history |

### Nexus Flow Adaptations

| GSearch Component | Nexus Flow Equivalent |
|-------------------|----------------------|
| `SearchForm.tsx` | `WorkflowSelector.tsx` |
| `ResultCard.tsx` | `NodeCard.tsx` |
| `SearchStatus.tsx` | `ExecutionStatus.tsx` |
| Results list | React Flow canvas |
| Search history | Execution history |

---

## Completion Checklist

### Phase Sign-offs

- [ ] Phase 1: Project Setup complete
- [ ] Phase 2: Core Infrastructure complete
- [ ] Phase 3: Common Components complete
- [ ] Phase 4: CLI-Specific Components complete
- [ ] Phase 5: Routing & Pages complete
- [ ] Phase 6: Integration & Testing complete
- [ ] Phase 7: PowerShell Integration complete
- [ ] Phase 8: Documentation complete

### Final Verification

- [ ] All pages load without errors
- [ ] WebSocket connects and streams logs
- [ ] Settings load, edit, and save
- [ ] Search executes and displays results
- [ ] Error modal captures and displays errors
- [ ] Changelog shows on version update
- [ ] PowerShell runner builds and starts app
- [ ] All tests pass
- [ ] Bundle size under target
- [ ] Spec consistency report updated

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Shared Frontend Spec | `02-spec/33-shared-cli-frontend/` |
| GSearch Frontend Architecture | `02-spec/25-gsearch-cli/02-frontend/02-frontend-architecture.md` |
| BRun Frontend Architecture | `02-spec/26-brun-cli/02-frontend/01-frontend-architecture.md` |
| AI Bridge Frontend Architecture | `02-spec/27-ai-bridge-cli/02-frontend/01-architecture.md` |
| Nexus Flow Frontend Architecture | `02-spec/29-nexus-flow-cli/02-frontend/02-frontend-architecture.md` |
| PowerShell Integration | `02-spec/11-powershell-integration/` |
| Error Management | `02-spec/11-spec-management-software/06-error-management/` |
| **UI Patterns** | `02-spec/25-gsearch-cli/02-frontend/05-ui-patterns.md` — Modal scroll, spinner, password, localStorage |
| **Shared Hooks** | `02-spec/33-shared-cli-frontend/15-hooks-library.md` — `useLocalStorageForm` |

---

*This checklist serves as the canonical implementation guide for all CLI frontends.*
