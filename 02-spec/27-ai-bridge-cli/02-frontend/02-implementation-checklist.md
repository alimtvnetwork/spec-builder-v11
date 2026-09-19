# AI Bridge CLI Frontend Implementation Checklist

> **Version:** 5.0.0  
> **Updated:** 2026-03-09  
> **Parent:** [01-architecture.md](./01-architecture.md)  
> **Purpose:** Detailed implementation reference for AI Bridge CLI frontend build

---

## Overview

This checklist provides a step-by-step implementation guide for the AI Bridge CLI frontend. It follows the **GSearch CLI implementation checklist** as a template and adapts it for AI Bridge-specific features (multi-modal AI, RAG, model management, chat interface).

**Time Estimate:** 20-25 hours for complete implementation

**Error Code Range:** 9050-9099 (frontend-specific)

**Primary Port:** 5040 (fallback: 5041, 5042)

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
  │   │   ├── chat/          # Chat interface components
  │   │   ├── models/        # Model management components
  │   │   ├── rag/           # RAG/document components
  │   │   ├── generate/      # Generation components
  │   │   └── ui/            # shadcn/ui components
  │   ├── hooks/             # Custom React hooks
  │   ├── lib/               # Utilities and helpers
  │   │   ├── api/           # API client
  │   │   ├── errors/        # Error handling
  │   │   └── websocket/     # WebSocket manager
  │   ├── pages/             # Route components (10 pages)
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
  npm install react-markdown remark-gfm  # For chat rendering
  npm install prism-react-renderer  # Code highlighting
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
  npx shadcn@latest add button card dialog input label select tabs toast badge progress textarea scroll-area avatar dropdown-menu
  ```

### 1.3 Configuration Files

- [ ] Configure `vite.config.ts` with proxy to port 5040
- [ ] Configure `tailwind.config.js` with AI Bridge theme colors
- [ ] Configure `tsconfig.json` with path aliases

---

## Phase 2: Core Infrastructure

### 2.1 WebSocket Manager

**Reference:** `02-spec/33-shared-cli-frontend/02-websocket-protocol.md`

- [ ] Create `src/lib/websocket/WebSocketManager.ts`
- [ ] Create `src/lib/websocket/types.ts`
- [ ] Create `src/hooks/useWebSocket.ts`
- [ ] Add streaming support for chat responses

### 2.2 API Client

**Reference:** `02-spec/33-shared-cli-frontend/04-api-tester.md`

- [ ] Create `src/lib/api/client.ts`
- [ ] Create `src/lib/api/endpoints.ts` (38 endpoints)
- [ ] Create API hooks:
  - [ ] `useGeneration.ts` - Text/code generation
  - [ ] `useChat.ts` - Chat operations
  - [ ] `useRAG.ts` - RAG operations
  - [ ] `useModels.ts` - Model management
  - [ ] `useBackends.ts` - Backend status
  - [ ] `useFiles.ts` - File history
  - [ ] `useSettings.ts` - Settings CRUD

### 2.3 Error Handling System

**Reference:** `02-spec/33-shared-cli-frontend/05-error-modal.md`

- [ ] Create `src/lib/errors/AppError.ts`
- [ ] Create `src/lib/errors/codes.ts` (codes 9050-9099)
- [ ] Create `src/lib/errors/ErrorBoundary.tsx`
- [ ] Create `src/stores/errorStore.ts`

### 2.4 State Management

- [ ] Create `src/stores/appStore.ts`
- [ ] Create `src/stores/chatStore.ts`
- [ ] Create `src/stores/modelStore.ts`
- [ ] Create `src/stores/ragStore.ts`
- [ ] Create `src/stores/settingsStore.ts`

---

## Phase 3: Common Components

### 3.1 Layout Components

- [ ] Create `src/components/common/Layout.tsx`
- [ ] Create `src/components/common/Sidebar.tsx` (10 nav items)
- [ ] Create `src/components/common/Header.tsx`

### 3.2 Log Viewer

- [ ] Create `src/components/common/LogViewer.tsx`
- [ ] Create `src/hooks/useLogs.ts`

### 3.3 Settings Page

- [ ] Create `src/pages/Settings.tsx`
- [ ] Create `src/components/common/SettingsForm.tsx`
- [ ] Create `src/components/common/SettingsCategory.tsx`

### 3.4 API Tester

- [ ] Create `src/pages/ApiTester.tsx`
- [ ] Create `src/components/common/EndpointCard.tsx`
- [ ] Create `src/components/common/ResponseViewer.tsx`

### 3.5 Error & Changelog Modals

- [ ] Create `src/components/common/ErrorModal.tsx`
- [ ] Create `src/components/common/ChangelogModal.tsx`

### 3.6 Connection Status

- [ ] Create `src/components/common/ConnectionStatus.tsx`
- [ ] Create `src/components/common/BackendStatus.tsx` (multi-backend)

---

## Phase 4: AI Bridge-Specific Components

### 4.1 Dashboard Page

- [ ] Create `src/pages/Dashboard.tsx`:
  - [ ] Backend status cards (Ollama, llama.cpp, Whisper, etc.)
  - [ ] Quick action buttons (Chat, Generate, RAG)
  - [ ] Recent activity feed
  - [ ] Model category summary

- [ ] Create `src/components/common/BackendCard.tsx`:
  - [ ] Backend name and type
  - [ ] Connection status indicator
  - [ ] Model count
  - [ ] Quick health check button

### 4.2 Chat Interface

- [ ] Create `src/pages/Chat.tsx`:
  - [ ] Full chat interface
  - [ ] Session sidebar
  - [ ] Model selector
  - [ ] RAG context toggle

- [ ] Create `src/components/chat/ChatContainer.tsx`:
  - [ ] Message list with virtual scrolling
  - [ ] Input area with file upload
  - [ ] Streaming response display

- [ ] Create `src/components/chat/ChatMessage.tsx`:
  - [ ] User/assistant avatar
  - [ ] Markdown rendering
  - [ ] Code block syntax highlighting
  - [ ] Copy button
  - [ ] Regenerate button (assistant only)

- [ ] Create `src/components/chat/ChatInput.tsx`:
  - [ ] Auto-resizing textarea
  - [ ] File attachment button
  - [ ] Model selector
  - [ ] Send button
  - [ ] Stop generation button

- [ ] Create `src/components/chat/SessionList.tsx`:
  - [ ] Session cards
  - [ ] Create new session
  - [ ] Delete session
  - [ ] Session title editing

### 4.3 Playground Page

- [ ] Create `src/pages/Playground.tsx`:
  - [ ] Prompt testing interface
  - [ ] Model/category selector
  - [ ] Parameters panel (temperature, max_tokens, etc.)
  - [ ] Side-by-side comparison mode

- [ ] Create `src/components/generate/PromptEditor.tsx`:
  - [ ] Multi-line prompt input
  - [ ] System prompt input
  - [ ] Template selector

- [ ] Create `src/components/generate/ParameterPanel.tsx`:
  - [ ] Temperature slider
  - [ ] Max tokens slider
  - [ ] Top-p slider
  - [ ] Repetition penalty

- [ ] Create `src/components/generate/ResponseViewer.tsx`:
  - [ ] Streaming text display
  - [ ] Token count
  - [ ] Generation time
  - [ ] Copy/save buttons

### 4.4 Models Page

- [ ] Create `src/pages/Models.tsx`:
  - [ ] Category tabs (10 categories)
  - [ ] Model list per category
  - [ ] Backend filter

- [ ] Create `src/components/models/CategoryTab.tsx`:
  - [ ] Category name and icon
  - [ ] Model count badge
  - [ ] Default model indicator

- [ ] Create `src/components/models/ModelCard.tsx`:
  - [ ] Model name and size
  - [ ] Backend source
  - [ ] Set as default button
  - [ ] Test model button
  - [ ] Performance stats

- [ ] Create `src/components/models/ModelEditor.tsx`:
  - [ ] Category assignment
  - [ ] Default parameters
  - [ ] Custom prompt template

### 4.5 RAG Page

- [ ] Create `src/pages/RAG.tsx`:
  - [ ] Document list
  - [ ] Upload documents
  - [ ] Index status
  - [ ] Query testing

- [ ] Create `src/components/rag/DocumentList.tsx`:
  - [ ] Document cards
  - [ ] Filter by type/date
  - [ ] Bulk delete

- [ ] Create `src/components/rag/DocumentCard.tsx`:
  - [ ] File name and type icon
  - [ ] Chunk count
  - [ ] Index status
  - [ ] Delete button

- [ ] Create `src/components/rag/DocumentUploader.tsx`:
  - [ ] Drag-and-drop zone
  - [ ] File type validation
  - [ ] Upload progress
  - [ ] Chunk preview

- [ ] Create `src/components/rag/QueryTester.tsx`:
  - [ ] Query input
  - [ ] Top-K selector
  - [ ] Results display with similarity scores

### 4.6 Generate Page (Multi-Modal)

- [ ] Create `src/pages/Generate.tsx`:
  - [ ] Tabs: Text, Image, Voice, Video
  - [ ] Mode-specific inputs
  - [ ] Output display

- [ ] Create `src/components/generate/ImageGenerator.tsx`:
  - [ ] Prompt input
  - [ ] Size selector
  - [ ] Style presets
  - [ ] Generated image display
  - [ ] Download button

- [ ] Create `src/components/generate/VoiceGenerator.tsx`:
  - [ ] Text input for TTS
  - [ ] Voice selector
  - [ ] Audio recording for STT
  - [ ] Audio player

- [ ] Create `src/components/generate/VideoGenerator.tsx`:
  - [ ] Prompt input
  - [ ] Duration selector
  - [ ] Generated video player
  - [ ] Download button

### 4.7 Files Page

- [ ] Create `src/pages/Files.tsx`:
  - [ ] File history browser
  - [ ] Filter by type/date
  - [ ] Split DB navigation

- [ ] Create `src/components/files/FileList.tsx`:
  - [ ] File cards with previews
  - [ ] Sort options
  - [ ] Pagination

- [ ] Create `src/components/files/FileCard.tsx`:
  - [ ] Thumbnail (images/video)
  - [ ] File name and size
  - [ ] Creation date
  - [ ] Download/delete actions

---

## Phase 5: Routing & Pages

### 5.1 Router Setup

- [ ] Create `src/App.tsx` with routes:

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Overview with backend status |
| `/chat` | Chat | Full chat interface |
| `/playground` | Playground | Prompt testing |
| `/models` | Models | Category/backend management |
| `/rag` | RAG | Document management |
| `/generate` | Generate | Multi-modal generation |
| `/files` | Files | File history browser |
| `/settings` | Settings | Configuration |
| `/logs` | Logs | Log viewer |
| `/api` | ApiTester | API tester |

### 5.2 Page Integration

- [ ] Implement all 10 pages with proper:
  - [ ] Loading states (skeletons)
  - [ ] Error states (with retry)
  - [ ] Empty states (helpful messages)

---

## Phase 6: Integration & Testing

### 6.1 Backend Integration

- [ ] Verify all 38 API endpoints work:

**Generation (6)**
- [ ] `POST /api/generate`
- [ ] `POST /api/generate/code`
- [ ] `POST /api/generate/stream`
- [ ] `POST /api/generate/complete`
- [ ] `POST /api/generate/embeddings`
- [ ] `GET /api/generate/templates`

**Chat (5)**
- [ ] `GET /api/chat/sessions`
- [ ] `POST /api/chat/sessions`
- [ ] `GET /api/chat/sessions/:id`
- [ ] `POST /api/chat/sessions/:id/messages`
- [ ] `DELETE /api/chat/sessions/:id`

**RAG (4)**
- [ ] `GET /api/rag/documents`
- [ ] `POST /api/rag/documents`
- [ ] `DELETE /api/rag/documents/:id`
- [ ] `POST /api/rag/query`

**Image/Video/Voice (6)**
- [ ] `POST /api/image/generate`
- [ ] `POST /api/image/understand`
- [ ] `POST /api/video/generate`
- [ ] `GET /api/video/:id`
- [ ] `POST /api/voice/transcribe`
- [ ] `POST /api/voice/synthesize`

**Models/Backends (8)**
- [ ] `GET /api/categories`
- [ ] `GET /api/categories/:name`
- [ ] `PUT /api/categories/:name/default`
- [ ] `GET /api/backends`
- [ ] `GET /api/backends/:name`
- [ ] `GET /api/backends/:name/models`
- [ ] `POST /api/backends/:name/pull`
- [ ] `DELETE /api/backends/:name/models/:model`

**Commands/Files/Import-Export (9)**
- [ ] `POST /api/commands/execute`
- [ ] `POST /api/commands/pipe`
- [ ] `GET /api/commands/history`
- [ ] `GET /api/files`
- [ ] `GET /api/files/:id`
- [ ] `POST /api/files`
- [ ] `DELETE /api/files/:id`
- [ ] `POST /api/import`
- [ ] `GET /api/export`

### 6.2 WebSocket Events

- [ ] `connection` / `disconnection`
- [ ] `log` events
- [ ] `chat.message.start`
- [ ] `chat.message.token`
- [ ] `chat.message.complete`
- [ ] `generation.start`
- [ ] `generation.token`
- [ ] `generation.complete`
- [ ] `rag.indexing.progress`
- [ ] `backend.status.change`

### 6.3 Testing

- [ ] Unit tests for API client, WebSocket, stores
- [ ] Component tests for ChatMessage, ModelCard, DocumentCard
- [ ] Integration tests for chat flow, RAG upload, generation
- [ ] E2E tests for complete chat workflow

### 6.4 Performance

- [ ] Verify virtual scrolling for chat messages (1,000+ messages)
- [ ] Verify streaming response performance
- [ ] Verify bundle size < 600KB gzipped
- [ ] Code splitting per route

---

## Phase 7: PowerShell Integration

**Reference:** `02-spec/33-shared-cli-frontend/09-powershell-integration.md`

- [ ] Verify `Open-AIBridgeUI` function
- [ ] Verify `Start-AIBridgeServer` spawns correctly
- [ ] Test port fallback (5040 → 5041 → 5042)
- [ ] Test firewall rule creation

---

## Completion Criteria

| Criterion | Required |
|-----------|----------|
| All 10 pages functional | ✅ |
| Chat with streaming works | ✅ |
| RAG document upload works | ✅ |
| Multi-modal generation works | ✅ |
| Model management works | ✅ |
| WebSocket real-time updates | ✅ |
| Settings persistence | ✅ |
| PowerShell integration works | ✅ |
| Tests passing | ✅ |
| Bundle size < 600KB | ✅ |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Frontend Architecture | `./01-architecture.md` |
| Overview | `../00-overview.md` |
| API Interface | `../01-backend/04-api-interface.md` |
| Error Codes | `../01-backend/05-error-codes.md` |
| Model Management | `../01-backend/07-model-management.md` |
| Split DB Integration | `../01-backend/08-split-db-integration.md` |
| Shared CLI Frontend | `../../28-shared-cli-frontend/00-overview.md` |
| GSearch Checklist (Template) | `../../25-gsearch-cli/02-frontend/03-implementation-checklist.md` |
