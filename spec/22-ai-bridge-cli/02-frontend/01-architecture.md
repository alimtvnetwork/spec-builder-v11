# AI Bridge CLI: Frontend Architecture

**Version:** 3.0.0  
**Status:** Complete  
**Updated:** 2026-03-09  
**Parent:** [00-overview.md](./00-overview.md)  
**Shared Spec:** [spec/28-shared-cli-frontend/](../../28-shared-cli-frontend/)

---

## Summary

React frontend for AI Bridge CLI, implementing the shared CLI frontend architecture with comprehensive AI-specific features including model management, chat interfaces, RAG memory, and multi-modal generation controls.

---

## Project Structure

```
ai-bridge-cli/
├── backend/                            # Go CLI + HTTP/WS server
│   ├── cmd/
│   │   ├── root.go
│   │   ├── run.go
│   │   ├── daemon.go
│   │   └── serve.go                    # HTTP/WS server command
│   ├── internal/
│   │   ├── api/                        # HTTP/WS handlers
│   │   │   ├── router.go
│   │   │   ├── chat.go
│   │   │   ├── models.go
│   │   │   ├── rag.go
│   │   │   ├── generate.go
│   │   │   └── settings.go
│   │   ├── parser/                     # Input format parsers
│   │   │   ├── markdown.go
│   │   │   ├── json.go
│   │   │   ├── yaml.go
│   │   │   └── csv.go
│   │   ├── adapter/                    # LLM adapters
│   │   │   ├── ollama.go
│   │   │   ├── llamacpp.go
│   │   │   ├── openai.go
│   │   │   ├── whisper.go
│   │   │   ├── xtts.go
│   │   │   ├── sdapi.go
│   │   │   └── svdapi.go
│   │   ├── splitdb/                    # Split DB integration
│   │   │   ├── manager.go
│   │   │   ├── chat.go
│   │   │   ├── rag.go
│   │   │   └── history.go
│   │   ├── model/                      # Model management
│   │   │   ├── categories.go
│   │   │   ├── resolver.go
│   │   │   └── switching.go
│   │   └── config/                     # Seedable config
│   │       ├── service.go
│   │       └── seeder.go
│   ├── configs/
│   │   ├── config.seed.json
│   │   ├── config.schema.json
│   │   └── presets.json
│   ├── data/                           # Split DB data directory
│   │   └── root.db
│   └── main.go
│
├── frontend/                           # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/                 # Shared components
│   │   │   │   ├── Layout.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── LoadingSpinner.tsx
│   │   │   ├── ai/                     # AI-specific components
│   │   │   │   ├── PromptEditor.tsx
│   │   │   │   ├── ResponseViewer.tsx
│   │   │   │   ├── ModelSelector.tsx
│   │   │   │   ├── CategorySelector.tsx
│   │   │   │   ├── TokenCounter.tsx
│   │   │   │   ├── StreamingResponse.tsx
│   │   │   │   └── ToolCallViewer.tsx
│   │   │   ├── chat/                   # Chat components
│   │   │   │   ├── ChatWindow.tsx
│   │   │   │   ├── MessageList.tsx
│   │   │   │   ├── MessageInput.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── SessionList.tsx
│   │   │   │   ├── SessionCard.tsx
│   │   │   │   └── AttachmentUploader.tsx
│   │   │   ├── models/                 # Model management components
│   │   │   │   ├── CategoryCard.tsx
│   │   │   │   ├── ModelCard.tsx
│   │   │   │   ├── BackendStatus.tsx
│   │   │   │   ├── BackendControls.tsx
│   │   │   │   ├── ModelSwitcher.tsx
│   │   │   │   └── CustomCategoryForm.tsx
│   │   │   ├── rag/                    # RAG components
│   │   │   │   ├── DocumentUploader.tsx
│   │   │   │   ├── DocumentList.tsx
│   │   │   │   ├── DocumentViewer.tsx
│   │   │   │   ├── ChunkViewer.tsx
│   │   │   │   └── SearchInterface.tsx
│   │   │   ├── generation/             # Multi-modal generation
│   │   │   │   ├── TextGenerator.tsx
│   │   │   │   ├── ImageGenerator.tsx
│   │   │   │   ├── ImageViewer.tsx
│   │   │   │   ├── VideoGenerator.tsx
│   │   │   │   ├── VideoPlayer.tsx
│   │   │   │   ├── VoiceRecorder.tsx
│   │   │   │   ├── VoicePlayer.tsx
│   │   │   │   └── TTSControls.tsx
│   │   │   ├── files/                  # File management
│   │   │   │   ├── FileExplorer.tsx
│   │   │   │   ├── FileHistory.tsx
│   │   │   │   ├── VersionDiff.tsx
│   │   │   │   ├── SnapshotManager.tsx
│   │   │   │   └── FileEditor.tsx
│   │   │   ├── settings/               # Settings components
│   │   │   │   ├── SettingsPage.tsx
│   │   │   │   ├── SettingsCategory.tsx
│   │   │   │   ├── SettingItem.tsx
│   │   │   │   ├── ThemeSelector.tsx
│   │   │   │   └── PowerShellCommands.tsx
│   │   │   └── ui/                     # shadcn/ui components
│   │   │       └── ...
│   │   ├── hooks/
│   │   │   ├── useAI.ts
│   │   │   ├── useChat.ts
│   │   │   ├── useModels.ts
│   │   │   ├── useCategories.ts
│   │   │   ├── useBackends.ts
│   │   │   ├── useRAG.ts
│   │   │   ├── useFileHistory.ts
│   │   │   ├── useGeneration.ts
│   │   │   ├── useVoice.ts
│   │   │   ├── useWebSocket.ts
│   │   │   ├── useSettings.ts
│   │   │   └── useTheme.ts
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx           # Overview dashboard
│   │   │   ├── Chat.tsx                # Chat interface
│   │   │   ├── Playground.tsx          # Prompt playground
│   │   │   ├── Models.tsx              # Model management
│   │   │   ├── RAG.tsx                 # RAG memory management
│   │   │   ├── Generate.tsx            # Multi-modal generation
│   │   │   ├── Files.tsx               # File history browser
│   │   │   ├── Settings.tsx            # Settings page
│   │   │   ├── Logs.tsx                # Log viewer
│   │   │   └── API.tsx                 # API tester
│   │   ├── lib/
│   │   │   ├── api.ts                  # API client
│   │   │   ├── websocket.ts            # WebSocket client
│   │   │   ├── utils.ts
│   │   │   └── constants.ts
│   │   ├── types/
│   │   │   ├── models.ts
│   │   │   ├── chat.ts
│   │   │   ├── rag.ts
│   │   │   ├── generation.ts
│   │   │   └── settings.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
│
├── deploy/                             # Deployment & operations
│   ├── powershell/                     # PowerShell integration
│   │   ├── run.ps1                     # Main runner script
│   │   ├── powershell.json             # Project configuration
│   │   ├── clean.ps1                   # Clean build script
│   │   └── start-backends.ps1          # Start all backends
│   ├── scripts/                        # Utility scripts
│   │   ├── backup.ps1
│   │   ├── seed.ps1
│   │   └── health-check.ps1
│   ├── error-handlers/                 # Error handling utilities
│   │   └── crash-reporter.go
│   └── docs/
│       ├── SETUP.md
│       └── API.md
│
└── CHANGELOG.md
```

---

## Pages

### 1. Dashboard

Overview of AI Bridge CLI status:

| Widget | Description |
|--------|-------------|
| Backend Status | Health of all configured backends |
| Active Sessions | Currently open chat sessions |
| Recent Activity | Recent AI operations |
| Model Usage | Token consumption per category |
| Quick Actions | Common operations |

### 2. Chat

Full-featured chat interface:

| Feature | Description |
|---------|-------------|
| Session List | Sidebar with all chat sessions |
| Message History | Scrollable message history |
| Streaming Response | Real-time token streaming |
| Model Selection | Per-session model/category |
| Attachments | File/image attachments |
| Tool Calls | Agentic mode tool visualization |

### 3. Models

Model management interface:

| Feature | Description |
|---------|-------------|
| Category Grid | All model categories with current assignments |
| Backend Status | Health and resource usage per backend |
| Model Switcher | Switch models for categories |
| Custom Categories | Create/edit custom categories |
| PowerShell Commands | Configure and run backend commands |

### 4. Playground

Interactive prompt testing:

| Feature | Description |
|---------|-------------|
| Prompt Editor | Syntax highlighting for prompts |
| Variable Injection | Template variable support |
| Format Selection | Markdown, JSON, YAML, CSV input |
| Response Streaming | Real-time response display |
| History | Recent prompt history |

### 5. RAG

RAG memory management:

| Feature | Description |
|---------|-------------|
| Document Upload | Ingest files for RAG |
| Document List | All ingested documents |
| Chunk Viewer | View document chunks |
| Search Interface | Search across RAG memory |
| Export/Import | Backup RAG databases |

### 6. Generate

Multi-modal generation:

| Feature | Description |
|---------|-------------|
| Text Generation | Standard text generation |
| Image Generation | Text-to-image generation |
| Image Understanding | Image analysis/description |
| Video Generation | Text-to-video generation |
| Voice (STT) | Speech-to-text recording |
| Voice (TTS) | Text-to-speech synthesis |

### 7. Files

File history browser:

| Feature | Description |
|---------|-------------|
| File Explorer | Browse tracked files |
| Version History | View all versions |
| Diff Viewer | Compare versions |
| Snapshots | Named checkpoints |
| Revert | Revert to previous versions |

### 8. Settings

Configuration management:

| Feature | Description |
|---------|-------------|
| Categories | Grouped settings |
| Theme Selector | 20+ theme presets |
| Backend Config | Backend URLs and settings |
| PowerShell | Configure commands |
| Import/Export | Settings backup |

---

## Key Components

### CategorySelector

```tsx
interface CategorySelectorProps {
  value: string;
  onChange: (category: string) => void;
  showModelInfo?: boolean;
}

export function CategorySelector({ value, onChange, showModelInfo }: CategorySelectorProps) {
  const { categories } = useCategories();
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((cat) => (
          <SelectItem key={cat.key} value={cat.key}>
            <div className="flex items-center gap-2">
              <CategoryIcon category={cat.key} />
              <span>{cat.displayName}</span>
              {showModelInfo && (
                <Badge variant="outline" className="ml-2">
                  {cat.currentModel}
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### BackendControls

```tsx
interface BackendControlsProps {
  backend: Backend;
  onStart: () => void;
  onStop: () => void;
  onHealthCheck: () => void;
}

export function BackendControls({ backend, onStart, onStop, onHealthCheck }: BackendControlsProps) {
  const { runCommand } = useCommands();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BackendIcon type={backend.type} />
          {backend.displayName}
          <HealthBadge status={backend.healthStatus} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onStart}
            disabled={backend.healthStatus === 'healthy'}
          >
            <Play className="h-4 w-4 mr-2" />
            Start
          </Button>
          <Button 
            variant="outline" 
            onClick={onStop}
            disabled={backend.healthStatus !== 'healthy'}
          >
            <Square className="h-4 w-4 mr-2" />
            Stop
          </Button>
          <Button variant="ghost" onClick={onHealthCheck}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Health
          </Button>
        </div>
        {backend.config.baseUrl && (
          <p className="text-sm text-muted-foreground mt-2">
            {backend.config.baseUrl}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

### GenerationPanel

```tsx
export function GenerationPanel() {
  const [mode, setMode] = useState<'text' | 'image' | 'video' | 'voice'>('text');
  
  return (
    <Tabs value={mode} onValueChange={setMode}>
      <TabsList>
        <TabsTrigger value="text">
          <Type className="h-4 w-4 mr-2" />
          Text
        </TabsTrigger>
        <TabsTrigger value="image">
          <Image className="h-4 w-4 mr-2" />
          Image
        </TabsTrigger>
        <TabsTrigger value="video">
          <Video className="h-4 w-4 mr-2" />
          Video
        </TabsTrigger>
        <TabsTrigger value="voice">
          <Mic className="h-4 w-4 mr-2" />
          Voice
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="text">
        <TextGenerator />
      </TabsContent>
      <TabsContent value="image">
        <ImageGenerator />
      </TabsContent>
      <TabsContent value="video">
        <VideoGenerator />
      </TabsContent>
      <TabsContent value="voice">
        <VoicePanel />
      </TabsContent>
    </Tabs>
  );
}
```

---

## Hooks

### useCategories

```tsx
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchCategories().then(setCategories).finally(() => setLoading(false));
  }, []);
  
  const switchModel = async (categoryKey: string, backend: string, model: string) => {
    await api.post(`/categories/${categoryKey}/switch`, { backend, model });
    // Refresh categories
    const updated = await fetchCategories();
    setCategories(updated);
  };
  
  const createCategory = async (data: CreateCategoryData) => {
    await api.post('/categories', data);
    const updated = await fetchCategories();
    setCategories(updated);
  };
  
  return { categories, loading, switchModel, createCategory };
}
```

### useGeneration

```tsx
interface GenerationOptions {
  category: string;
  prompt: string;
  parameters?: Record<string, any>;
}

export function useGeneration() {
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  
  const generateText = async (options: GenerationOptions) => {
    setGenerating(true);
    try {
      const response = await api.post('/generate', options);
      setResult(response.data);
      return response.data;
    } finally {
      setGenerating(false);
    }
  };
  
  const generateImage = async (prompt: string, options?: ImageOptions) => {
    setGenerating(true);
    try {
      const response = await api.post('/generate/image', { prompt, ...options });
      setResult(response.data);
      return response.data;
    } finally {
      setGenerating(false);
    }
  };
  
  const generateVideo = async (prompt: string, options?: VideoOptions) => {
    setGenerating(true);
    try {
      const response = await api.post('/generate/video', { prompt, ...options });
      setResult(response.data);
      return response.data;
    } finally {
      setGenerating(false);
    }
  };
  
  return { generating, result, generateText, generateImage, generateVideo };
}
```

---

## API Endpoints Summary

### Generation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/generate` | Generate text |
| POST | `/api/v1/generate/stream` | Stream text generation |
| POST | `/api/v1/generate/image` | Generate image |
| POST | `/api/v1/generate/video` | Generate video |
| POST | `/api/v1/voice/transcribe` | Speech-to-text |
| POST | `/api/v1/voice/synthesize` | Text-to-speech |

### Model Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/categories` | List categories |
| POST | `/api/v1/categories` | Create category |
| PUT | `/api/v1/categories/:key/model` | Switch model |
| GET | `/api/v1/backends` | List backends |
| POST | `/api/v1/backends/:key/start` | Start backend |
| POST | `/api/v1/backends/:key/stop` | Stop backend |

### Chat Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/chat/sessions` | Create session |
| GET | `/api/v1/chat/sessions` | List sessions |
| POST | `/api/v1/chat/sessions/:id/messages` | Send message |
| GET | `/api/v1/chat/sessions/:id/messages` | Get messages |

### RAG Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/rag/documents` | Ingest document |
| GET | `/api/v1/rag/documents` | List documents |
| POST | `/api/v1/rag/search` | Search memory |

### PowerShell Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/commands` | List commands |
| PUT | `/api/v1/commands/:key` | Update command |
| POST | `/api/v1/commands/:key/run` | Run command |

---

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `generate.token` | B→F | Streamed token |
| `generate.complete` | B→F | Generation finished |
| `chat.message` | B→F | New chat message |
| `model.switched` | B→F | Model switched |
| `backend.status` | B→F | Backend health change |
| `command.output` | B→F | PowerShell output |
| `command.complete` | B→F | Command finished |

---

## Configuration

### config.seed.json (Frontend-relevant)

```json
{
  "categories": {
    "ui": {
      "displayName": "User Interface",
      "settings": {
        "theme": {
          "type": "select",
          "label": "Theme",
          "default": "system",
          "options": [
            "light", "dark", "system", "high-contrast",
            "dracula", "nord", "solarized-light", "solarized-dark",
            "monokai", "one-dark", "github-light", "github-dark"
          ]
        },
        "accentColor": {
          "type": "string",
          "label": "Accent Color",
          "default": "#3b82f6"
        },
        "fontSize": {
          "type": "select",
          "label": "Font Size",
          "default": "medium",
          "options": ["small", "medium", "large"]
        }
      }
    }
  }
}
```

### powershell.json

```json
{
  "projectName": "ai-bridge-cli",
  "displayName": "AI Bridge CLI",
  "ports": [5040, 5041, 5042],
  "runCommand": "go run main.go serve --port 5040",
  "frontendPort": 5173,
  "commands": {
    "serve": "go run main.go serve",
    "build": "go build -o ai-bridge-cli.exe",
    "frontend": "cd frontend && bun run dev"
  }
}
```

---

## Error Codes

AI Bridge CLI frontend uses error range **9050-9099**:

| Code | Error | Description |
|------|-------|-------------|
| 9050 | WS_CONNECTION_FAILED | WebSocket connection failure |
| 9051 | WS_DISCONNECTED | WebSocket unexpectedly closed |
| 9052 | SETTINGS_LOAD_FAILED | Failed to load settings |
| 9053 | SETTINGS_SAVE_FAILED | Failed to save settings |
| 9054 | API_TIMEOUT | API request timeout |
| 9055 | API_ERROR | API returned error response |
| 9056 | CONFIG_PARSE_ERROR | Failed to parse config |
| 9057 | VERSION_MISMATCH | Frontend/backend version mismatch |
| 9058 | PORT_UNAVAILABLE | Configured port not available |
| 9059 | FIREWALL_BLOCKED | Firewall blocking connection |
| 9060 | MODEL_NOT_FOUND | Requested model not available |
| 9061 | BACKEND_OFFLINE | LLM backend not responding |
| 9062 | TOKEN_LIMIT_EXCEEDED | Token limit exceeded |
| 9063 | GENERATION_FAILED | Generation request failed |
| 9064 | RAG_INGEST_FAILED | RAG document ingestion failed |
| 9065 | VOICE_RECORDING_FAILED | Voice recording failed |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Shared Frontend Spec | `spec/28-shared-cli-frontend/` |
| Component Library | `spec/28-shared-cli-frontend/10-component-library.md` |
| E2E Test Spec | `spec/28-shared-cli-frontend/11-e2e-test-spec.md` |
| Accessibility Spec | `spec/28-shared-cli-frontend/12-accessibility-spec.md` |
| Visual Regression | `spec/28-shared-cli-frontend/13-visual-regression-spec.md` |
| Deploy Folder Spec | `spec/28-shared-cli-frontend/09-deploy-folder.md` |
| Split DB Architecture | `spec/06-split-db-architecture/00-overview.md` |
| Seedable Config | `spec/07-seedable-config-architecture/00-overview.md` |
| Model Management | `spec/22-ai-bridge-cli/01-backend/07-model-management.md` |
| Split DB Integration | `spec/22-ai-bridge-cli/01-backend/08-split-db-integration.md` |

---

*AI Bridge CLI frontend implements the shared CLI frontend architecture with comprehensive AI-specific features and three-folder structure (backend/, frontend/, deploy/).*
