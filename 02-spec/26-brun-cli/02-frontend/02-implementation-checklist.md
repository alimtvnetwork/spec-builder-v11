# BRun CLI Frontend Implementation Checklist

> **Version:** 2.0.0  
> **Created:** 2026-03-09  
> **Parent:** [01-frontend-architecture.md](./01-frontend-architecture.md)  
> **Purpose:** Detailed implementation reference for BRun CLI frontend build

---

## Overview

This checklist provides a step-by-step implementation guide for the BRun CLI frontend. It follows the **GSearch CLI implementation checklist** as a template and adapts it for BRun-specific features (build execution, profile management, runtime configuration).

**Time Estimate:** 12-15 hours for complete implementation

**Error Code Range:** 7150-7169 (frontend-specific)

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
  │   │   ├── build/         # BRun-specific components
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

- [ ] Install shadcn/ui:
  ```bash
  npx shadcn@latest init
  npx shadcn@latest add button card dialog input label select tabs toast badge progress
  ```

### 1.3 Configuration Files

- [ ] Configure `vite.config.ts` with proxy to port 5030:
  ```typescript
  server: {
    proxy: {
      '/api': 'http://localhost:5030',
      '/ws': { target: 'ws://localhost:5030', ws: true },
    },
  },
  ```

- [ ] Configure `tailwind.config.js` with BRun theme colors
- [ ] Configure `tsconfig.json` with path aliases

---

## Phase 2: Core Infrastructure

### 2.1 WebSocket Manager

**Reference:** `02-spec/33-shared-cli-frontend/02-websocket-protocol.md`

- [ ] Create `src/lib/websocket/WebSocketManager.ts`
- [ ] Create `src/lib/websocket/types.ts`
- [ ] Create `src/hooks/useWebSocket.ts`

### 2.2 API Client

**Reference:** `02-spec/33-shared-cli-frontend/04-api-tester.md`

- [ ] Create `src/lib/api/client.ts`
- [ ] Create `src/lib/api/endpoints.ts`
- [ ] Create API hooks:
  - [ ] `useBuild.ts` - Build operations
  - [ ] `useProfiles.ts` - Profile CRUD
  - [ ] `useSettings.ts` - Settings CRUD
  - [ ] `useHealth.ts` - Health check

### 2.3 Error Handling System

**Reference:** `02-spec/33-shared-cli-frontend/05-error-modal.md`

- [ ] Create `src/lib/errors/AppError.ts`
- [ ] Create `src/lib/errors/codes.ts` (codes 7150-7169)
- [ ] Create `src/lib/errors/ErrorBoundary.tsx`
- [ ] Create `src/stores/errorStore.ts`

### 2.4 State Management

- [ ] Create `src/stores/appStore.ts`
- [ ] Create `src/stores/settingsStore.ts`
- [ ] Create `src/stores/buildStore.ts` (BRun-specific)
- [ ] Create `src/stores/profileStore.ts` (BRun-specific)

---

## Phase 3: Common Components

### 3.1 Layout Components

**Reference:** `02-spec/33-shared-cli-frontend/08-common-components.md`

- [ ] Create `src/components/common/Layout.tsx`
- [ ] Create `src/components/common/Sidebar.tsx`
- [ ] Create `src/components/common/Header.tsx`

### 3.2 Log Viewer

- [ ] Create `src/components/common/LogViewer.tsx`
- [ ] Create `src/hooks/useLogs.ts`

### 3.3 Settings Page

**Reference:** `02-spec/33-shared-cli-frontend/03-settings-service.md`

- [ ] Create `src/pages/Settings.tsx`
- [ ] Create `src/components/common/SettingsForm.tsx`
- [ ] Create `src/components/common/SettingsCategory.tsx`

### 3.4 API Tester

**Reference:** `02-spec/33-shared-cli-frontend/04-api-tester.md`

- [ ] Create `src/pages/ApiTester.tsx`
- [ ] Create `src/components/common/EndpointCard.tsx`
- [ ] Create `src/components/common/ResponseViewer.tsx`

### 3.5 Error Modal

**Reference:** `02-spec/33-shared-cli-frontend/05-error-modal.md`

- [ ] Create `src/components/common/ErrorModal.tsx`
- [ ] Create `src/components/common/StackTraceViewer.tsx`

### 3.6 Changelog Modal

**Reference:** `02-spec/33-shared-cli-frontend/06-changelog-system.md`

- [ ] Create `src/components/common/ChangelogModal.tsx`
- [ ] Create `src/hooks/useChangelog.ts`

### 3.7 Connection Status

**Reference:** `02-spec/33-shared-cli-frontend/07-port-management.md`

- [ ] Create `src/components/common/ConnectionStatus.tsx`
- [ ] Create `src/components/common/NetworkSettings.tsx`

---

## Phase 4: BRun-Specific Components

### 4.1 Build Dashboard

- [ ] Create `src/pages/Dashboard.tsx`:
  - [ ] Active build status (if running)
  - [ ] Quick-run buttons for profiles
  - [ ] Recent builds list
  - [ ] Runtime status indicators

- [ ] Create `src/components/build/BuildForm.tsx`:
  - [ ] Profile selector
  - [ ] Runtime selector (PowerShell, Node.js, Go, etc.)
  - [ ] Command override input
  - [ ] Working directory picker
  - [ ] Environment variable editor
  - [ ] Run button with loading state

- [ ] Create `src/components/build/BuildStatus.tsx`:
  - [ ] Progress indicator
  - [ ] Runtime/profile display
  - [ ] Exit code display
  - [ ] Duration timer
  - [ ] Cancel button

### 4.2 Profile Manager

- [ ] Create `src/pages/Profiles.tsx`:
  - [ ] Profile list with cards
  - [ ] Create new profile button
  - [ ] Import/export buttons

- [ ] Create `src/components/build/ProfileCard.tsx`:
  - [ ] Profile name and description
  - [ ] Runtime badge
  - [ ] Quick-run button
  - [ ] Edit/delete actions
  - [ ] Last used timestamp

- [ ] Create `src/components/build/ProfileEditor.tsx`:
  - [ ] Name/description inputs
  - [ ] Runtime selector
  - [ ] Command configuration
  - [ ] Environment variable list
  - [ ] Working directory
  - [ ] Save/cancel buttons

### 4.3 Build History

- [ ] Create `src/pages/History.tsx`:
  - [ ] Build history list
  - [ ] Date range filter
  - [ ] Filter by profile/runtime
  - [ ] Bulk delete

- [ ] Create `src/components/build/HistoryList.tsx`:
  - [ ] Build summary cards
  - [ ] Re-run button
  - [ ] View logs button

- [ ] Create `src/components/build/HistoryCard.tsx`:
  - [ ] Profile/runtime used
  - [ ] Start/end time
  - [ ] Exit code (success/failure badge)
  - [ ] Duration
  - [ ] Quick actions

### 4.4 Runtime Configuration

- [ ] Create `src/pages/Runtimes.tsx`:
  - [ ] Installed runtimes list
  - [ ] Runtime health status
  - [ ] Path configuration

- [ ] Create `src/components/build/RuntimeCard.tsx`:
  - [ ] Runtime name and version
  - [ ] Path display
  - [ ] Health status indicator
  - [ ] Test button

---

## Phase 5: Routing & Pages

### 5.1 Router Setup

- [ ] Create `src/App.tsx` with routes:

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Main build interface |
| `/profiles` | Profiles | Profile management |
| `/history` | History | Build history |
| `/runtimes` | Runtimes | Runtime configuration |
| `/settings` | Settings | Configuration |
| `/api-tester` | ApiTester | API testing tool |
| `/logs` | Logs | Live log viewer |

### 5.2 Page Integration

- [ ] Implement all pages with proper:
  - [ ] Loading states (skeletons)
  - [ ] Error states (with retry)
  - [ ] Empty states (helpful messages)

---

## Phase 6: Integration & Testing

### 6.1 Backend Integration

- [ ] Verify all API endpoints work:
  - [ ] `GET /api/health`
  - [ ] `GET /api/version`
  - [ ] `POST /api/build`
  - [ ] `GET /api/build/:id`
  - [ ] `DELETE /api/build/:id` (cancel)
  - [ ] `GET /api/build/history`
  - [ ] `GET /api/profiles`
  - [ ] `POST /api/profiles`
  - [ ] `PUT /api/profiles/:id`
  - [ ] `DELETE /api/profiles/:id`
  - [ ] `GET /api/runtimes`
  - [ ] `GET /api/runtimes/:name/health`
  - [ ] `GET /api/settings`
  - [ ] `PUT /api/settings/:category`

- [ ] Verify WebSocket events:
  - [ ] `connection` / `disconnection`
  - [ ] `log` events with all levels
  - [ ] `build.started`
  - [ ] `build.progress`
  - [ ] `build.output` (stdout/stderr)
  - [ ] `build.completed`
  - [ ] `build.error`
  - [ ] `settings.updated`

### 6.2 Testing

- [ ] Unit tests for API client, WebSocket manager, stores
- [ ] Component tests for BuildForm, ProfileCard, HistoryCard
- [ ] Integration tests for build flow, profile CRUD
- [ ] E2E tests for complete build workflow

### 6.3 Performance

- [ ] Verify virtual scrolling for log viewer (10,000+ lines)
- [ ] Verify bundle size < 500KB gzipped
- [ ] Code splitting per route

---

## Phase 7: PowerShell Integration

**Reference:** `02-spec/33-shared-cli-frontend/09-powershell-integration.md`

- [ ] Verify `Open-BRunUI` function opens browser
- [ ] Verify `Start-BRunServer` spawns correctly
- [ ] Test port fallback (8100 → 8101 → 8102)
- [ ] Test firewall rule creation prompt

---

## Completion Criteria

| Criterion | Required |
|-----------|----------|
| All pages functional | ✅ |
| WebSocket real-time updates | ✅ |
| Settings persistence | ✅ |
| Error modal with stack traces | ✅ |
| Build execution works | ✅ |
| Profile CRUD works | ✅ |
| PowerShell integration works | ✅ |
| Tests passing | ✅ |
| Bundle size < 500KB | ✅ |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Frontend Architecture | `./01-frontend-architecture.md` |
| Overview | `../00-overview.md` |
| Error Codes | `../01-backend/06-error-handling.md` |
| Shared CLI Frontend | `../../28-shared-cli-frontend/00-overview.md` |
| GSearch Checklist (Template) | `../../25-gsearch-cli/02-frontend/03-implementation-checklist.md` |
