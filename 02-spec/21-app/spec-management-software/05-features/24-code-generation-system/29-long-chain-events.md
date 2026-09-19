# Long Chain Event System

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09

---

## Overview

Real-time streaming display for long-running AI operations showing detailed reasoning steps, tool usage, intermediate results, and progress tracking. Supports enable/disable toggle for users who prefer simplified output.

**Cross-References:**
- [AI Chat Interface](./25-ai-chat-interface.md) - Parent interface
- [File Modification Display](./28-file-modification-display.md) - File changes
- [WebSocket Events](./15-websocket-events.md) - Event transport
- [SSE Streaming](../18-realtime/02-sse-streaming.md) - Streaming patterns

---

## Event Chain Visualization

### Collapsed View (Default)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🤖 AI                                                            10:30 AM     │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ ⚡ Processing: Creating authentication module                               ││
│  │                                                                              ││
│  │  Step 4/7: Writing handler code                    ████████████░░░░ 57%    ││
│  │                                                                              ││
│  │  [Show Details ▼]                                                           ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Expanded View (Long Chain Enabled)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🤖 AI                                                            10:30 AM     │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ ⚡ Long Chain: Creating authentication module            [Hide Details ▲]   ││
│  ├─────────────────────────────────────────────────────────────────────────────┤│
│  │                                                                              ││
│  │  ✅ 1. Analyzing specification                              00:02.3s       ││
│  │     └─ Read auth-spec.md, identified 4 endpoints                           ││
│  │                                                                              ││
│  │  ✅ 2. Resolving coding guidelines                          00:01.1s       ││
│  │     └─ Merged: General → Go → User → Project                               ││
│  │                                                                              ││
│  │  ✅ 3. Creating file plan                                   00:03.7s       ││
│  │     └─ Generated 6 files, 2 parallel batches                               ││
│  │                                                                              ││
│  │  🔄 4. Writing handler code                                 00:15.2s ⏳    ││
│  │     ├─ Thinking: Implementing JWT validation...                             ││
│  │     ├─ Tool: file_write("internal/auth/handler.go")                        ││
│  │     └─ Progress: 127/200 lines                                              ││
│  │                                                                              ││
│  │  ⏳ 5. Writing service layer                                pending        ││
│  │  ⏳ 6. Updating router                                      pending        ││
│  │  ⏳ 7. Running build verification                           pending        ││
│  │                                                                              ││
│  │  ──────────────────────────────────────────────────────────────────────────││
│  │  Total Time: 00:22.3s                      Tokens: 4,521 in / 2,103 out    ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Toggle Configuration

### User Preference

```typescript
interface LongChainPreferences {
  // Enable/disable long chain visibility
  enabled: boolean;
  
  // Auto-expand on specific event types
  autoExpandOn: ('error' | 'search' | 'tool_use' | 'thinking')[];
  
  // Detail level
  detailLevel: 'minimal' | 'normal' | 'verbose';
  
  // Show timing information
  showTiming: boolean;
  
  // Show token counts
  showTokens: boolean;
  
  // Max visible steps before collapse
  maxVisibleSteps: number;
}

// Default preferences
const defaultPreferences: LongChainPreferences = {
  enabled: true,
  autoExpandOn: ['error', 'tool_use'],
  detailLevel: 'normal',
  showTiming: true,
  showTokens: true,
  maxVisibleSteps: 10
};
```

### Toggle UI Component

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚙️ AI Settings                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Long Chain Events                                              │
│  ┌─────────────────────────────────────────────────┐            │
│  │ Show detailed AI reasoning steps    [────●────] │  ON       │
│  └─────────────────────────────────────────────────┘            │
│                                                                  │
│  Detail Level                                                   │
│  ○ Minimal    ● Normal    ○ Verbose                            │
│                                                                  │
│  Auto-expand on:                                                │
│  [✓] Errors  [✓] Tool Usage  [ ] Thinking  [ ] Search         │
│                                                                  │
│  Display Options:                                               │
│  [✓] Show timing  [✓] Show token counts                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Event Types

### Chain Step Types

```typescript
type ChainStepType =
  | 'thinking'           // AI reasoning/planning
  | 'tool_call'          // Tool invocation
  | 'tool_result'        // Tool response
  | 'search'             // Web/code search
  | 'file_read'          // Reading files
  | 'file_write'         // Writing files
  | 'validation'         // Spec/code validation
  | 'build'              // Build verification
  | 'question'           // Clarifying question
  | 'decision'           // AI decision point
  | 'error'              // Error occurred
  | 'retry'              // Retry attempt
  | 'complete';          // Step completed

type ChainStepStatus =
  | 'pending'            // Not yet started
  | 'in_progress'        // Currently executing
  | 'completed'          // Successfully finished
  | 'failed'             // Error occurred
  | 'skipped'            // Conditionally skipped
  | 'cancelled';         // User cancelled

interface ChainStep {
  id: string;
  chainId: string;
  stepNumber: number;
  
  type: ChainStepType;
  status: ChainStepStatus;
  
  title: string;
  description?: string;
  
  // Timing
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  
  // Progress (for long-running steps)
  progress?: number;           // 0-100
  progressLabel?: string;      // "127/200 lines"
  
  // Details
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  
  // For tool calls
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  
  // For search
  searchQuery?: string;
  searchResults?: number;
  
  // For errors
  errorCode?: string;
  errorMessage?: string;
  
  // Nested steps (for complex operations)
  subSteps?: ChainStep[];
  
  // Token tracking
  inputTokens?: number;
  outputTokens?: number;
}

interface EventChain {
  id: string;
  sessionId: string;
  messageId: string;
  
  title: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  
  steps: ChainStep[];
  currentStepId?: string;
  
  // Aggregate stats
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  
  // Timing
  startedAt: Date;
  completedAt?: Date;
  totalDurationMs?: number;
  
  // Token totals
  totalInputTokens: number;
  totalOutputTokens: number;
  
  // Display state
  isExpanded: boolean;
}
```

---

## WebSocket Events

### Chain Lifecycle Events

```typescript
// Server → Client: Chain started
interface ChainStartedEvent {
  type: 'chain:started';
  payload: {
    chainId: string;
    sessionId: string;
    messageId: string;
    title: string;
    estimatedSteps: number;
  };
}

// Server → Client: Step started
interface StepStartedEvent {
  type: 'chain:step:started';
  payload: {
    chainId: string;
    step: ChainStep;
  };
}

// Server → Client: Step progress update
interface StepProgressEvent {
  type: 'chain:step:progress';
  payload: {
    chainId: string;
    stepId: string;
    progress: number;
    progressLabel?: string;
    description?: string;
  };
}

// Server → Client: Step completed
interface StepCompletedEvent {
  type: 'chain:step:completed';
  payload: {
    chainId: string;
    stepId: string;
    status: 'completed' | 'failed' | 'skipped';
    durationMs: number;
    output?: Record<string, unknown>;
    errorMessage?: string;
    inputTokens?: number;
    outputTokens?: number;
  };
}

// Server → Client: Chain completed
interface ChainCompletedEvent {
  type: 'chain:completed';
  payload: {
    chainId: string;
    status: 'completed' | 'failed' | 'cancelled';
    totalDurationMs: number;
    completedSteps: number;
    failedSteps: number;
    totalInputTokens: number;
    totalOutputTokens: number;
  };
}

// Server → Client: Thinking stream
interface ThinkingStreamEvent {
  type: 'chain:thinking';
  payload: {
    chainId: string;
    stepId: string;
    content: string;        // Incremental thinking text
    isComplete: boolean;
  };
}

// Server → Client: Tool invocation
interface ToolInvocationEvent {
  type: 'chain:tool:invoked';
  payload: {
    chainId: string;
    stepId: string;
    toolName: string;
    toolArgs: Record<string, unknown>;
  };
}

// Server → Client: Search performed
interface SearchPerformedEvent {
  type: 'chain:search:performed';
  payload: {
    chainId: string;
    stepId: string;
    searchType: 'web' | 'code' | 'site';
    query: string;
    engine?: string;
    resultCount: number;
    usedResults: string[];   // URLs/references actually used
  };
}
```

---

## Go Backend Implementation

### Chain Manager

```go
type ChainManager struct {
    db        *gorm.DB
    wsHub     *websocket.Hub
    tokenizer *tokenizer.Tokenizer
}

func NewChainManager(db *gorm.DB, wsHub *websocket.Hub) *ChainManager {
    return &ChainManager{
        db:        db,
        wsHub:     wsHub,
        tokenizer: tokenizer.New(),
    }
}

// StartChain creates a new event chain
func (m *ChainManager) StartChain(sessionId, messageId, title string, estimatedSteps int) apperror.Result[EventChain] {
    chain := &EventChain{
        Id:                 uuid.NewString(),
        SessionId:          sessionId,
        MessageId:          messageId,
        Title:              title,
        Status:             "running",
        TotalSteps:         estimatedSteps,
        StartedAt:          time.Now(),
        IsExpanded:         true,
    }
    
    if err := m.db.Create(chain).Error; err != nil {
        return apperror.FailWrap[EventChain](
            err,
            "E7200",
            "failed to create event chain",
        )
    }
    
    m.wsHub.BroadcastToSession(sessionId, ChainStartedEvent{
        Type: "chain:started",
        Payload: ChainStartedPayload{
            ChainId:        chain.Id,
            SessionId:      sessionId,
            MessageId:      messageId,
            Title:          title,
            EstimatedSteps: estimatedSteps,
        },
    })
    
    return apperror.Ok(*chain)
}

// StartStep begins a new step in the chain
func (m *ChainManager) StartStep(chainId string, stepType ChainStepType, title string) apperror.Result[ChainStep] {
    var chain EventChain
    if err := m.db.First(&chain, "id = ?", chainId).Error; err != nil {
        return apperror.FailWrap[ChainStep](
            err,
            "E7201",
            "chain not found",
        )
    }
    
    stepNumber := len(chain.Steps) + 1
    step := &ChainStep{
        Id:          uuid.NewString(),
        ChainId:     chainId,
        StepNumber:  stepNumber,
        Type:        stepType,
        Status:      "in_progress",
        Title:       title,
        StartedAt:   ptr(time.Now()),
    }
    
    if err := m.db.Create(step).Error; err != nil {
        return apperror.FailWrap[ChainStep](
            err,
            "E7201",
            "failed to create chain step",
        )
    }
    
    // Update chain's current step
    m.db.Model(&chain).Update("current_step_id", step.Id)
    
    m.wsHub.BroadcastToSession(chain.SessionId, StepStartedEvent{
        Type: "chain:step:started",
        Payload: StepStartedPayload{
            ChainId: chainId,
            Step:    step,
        },
    })
    
    return apperror.Ok(*step)
}

// --- Typed Update Structs for GORM (no map[string]interface{}) ---

// ChainStepProgressUpdate is the typed struct for step progress GORM updates
type ChainStepProgressUpdate struct {
    Progress      int    `gorm:"column:progress"`
    ProgressLabel string `gorm:"column:progress_label"`
}

// ChainStepCompletionUpdate is the typed struct for step completion GORM updates
type ChainStepCompletionUpdate struct {
    Status       string     `gorm:"column:status"`
    CompletedAt  time.Time  `gorm:"column:completed_at"`
    DurationMs   int64      `gorm:"column:duration_ms"`
    InputTokens  int        `gorm:"column:input_tokens"`
    OutputTokens int        `gorm:"column:output_tokens"`
    Output       *string    `gorm:"column:output"`
}

// ChainTotalsUpdate is the typed struct for chain totals GORM updates
type ChainTotalsUpdate struct {
    CompletedSteps    interface{} `gorm:"column:completed_steps"`     // gorm.Expr
    TotalInputTokens  interface{} `gorm:"column:total_input_tokens"`  // gorm.Expr
    TotalOutputTokens interface{} `gorm:"column:total_output_tokens"` // gorm.Expr
}
// NOTE: ChainTotalsUpdate uses interface{} ONLY for gorm.Expr() — this is
// a documented GORM requirement. See ALLOWED pattern in triage report.

// StepOutput is the typed container for step output data (replaces map[string]interface{})
type StepOutput struct {
    GeneratedCode string   `json:",omitempty"`
    FilesModified []string `json:",omitempty"`
    Summary       string   `json:",omitempty"`
}

// UpdateStepProgress sends progress update
func (m *ChainManager) UpdateStepProgress(chainId, stepId string, progress int, label string) error {
    var chain EventChain
    if err := m.db.First(&chain, "id = ?", chainId).Error; err != nil {
        return err
    }
    
    m.db.Model(&ChainStep{}).Where("id = ?", stepId).Updates(ChainStepProgressUpdate{
        Progress:      progress,
        ProgressLabel: label,
    })
    
    m.wsHub.BroadcastToSession(chain.SessionId, StepProgressEvent{
        Type: "chain:step:progress",
        Payload: StepProgressPayload{
            ChainId:       chainId,
            StepId:        stepId,
            Progress:      progress,
            ProgressLabel: label,
        },
    })
    
    return nil
}

// StreamThinking sends incremental thinking content
func (m *ChainManager) StreamThinking(chainId, stepId, sessionId string, content string, isComplete bool) {
    m.wsHub.BroadcastToSession(sessionId, ThinkingStreamEvent{
        Type: "chain:thinking",
        Payload: ThinkingPayload{
            ChainId:    chainId,
            StepId:     stepId,
            Content:    content,
            IsComplete: isComplete,
        },
    })
}

// CompleteStep marks a step as finished
func (m *ChainManager) CompleteStep(
    chainId, stepId string,
    status string,
    output *StepOutput,
    inputTokens, outputTokens int,
) error {
    var chain EventChain
    if err := m.db.First(&chain, "id = ?", chainId).Error; err != nil {
        return err
    }
    
    now := time.Now()
    var step ChainStep
    if err := m.db.First(&step, "id = ?", stepId).Error; err != nil {
        return err
    }
    
    durationMs := now.Sub(*step.StartedAt).Milliseconds()
    
    stepUpdate := ChainStepCompletionUpdate{
        Status:       status,
        CompletedAt:  now,
        DurationMs:   durationMs,
        InputTokens:  inputTokens,
        OutputTokens: outputTokens,
    }
    
    if output != nil {
        outputJson, _ := json.Marshal(output)
        outputStr := string(outputJson)
        stepUpdate.Output = &outputStr
    }
    
    m.db.Model(&step).Updates(stepUpdate)
    
    // Update chain totals
    m.db.Model(&chain).Updates(ChainTotalsUpdate{
        CompletedSteps:    gorm.Expr("completed_steps + 1"),
        TotalInputTokens:  gorm.Expr("total_input_tokens + ?", inputTokens),
        TotalOutputTokens: gorm.Expr("total_output_tokens + ?", outputTokens),
    })
    
    m.wsHub.BroadcastToSession(chain.SessionId, StepCompletedEvent{
        Type: "chain:step:completed",
        Payload: StepCompletedPayload{
            ChainId:      chainId,
            StepId:       stepId,
            Status:       status,
            DurationMs:   int(durationMs),
            Output:       output,
            InputTokens:  inputTokens,
            OutputTokens: outputTokens,
        },
    })
    
    return nil
}
```

---

## Component Structure

```
LongChain/
├── components/
│   ├── EventChainPanel.tsx        # Main container
│   ├── ChainHeader.tsx            # Title, status, toggle
│   ├── ChainStep.tsx              # Individual step row
│   ├── StepIcon.tsx               # Type-specific icons
│   ├── StepProgress.tsx           # Progress bar
│   ├── ThinkingStream.tsx         # Streaming thought display
│   ├── ToolInvocation.tsx         # Tool call display
│   ├── SearchResult.tsx           # Search result summary
│   ├── ChainSummary.tsx           # Final stats
│   └── ChainSettings.tsx          # Toggle/preferences
│
├── hooks/
│   ├── useEventChain.ts           # Chain state management
│   ├── useChainWebSocket.ts       # WS event handling
│   ├── useChainPreferences.ts     # User preferences
│   └── useThinkingStream.ts       # Streaming text
│
└── types/
    └── chain.ts                   # TypeScript interfaces
```

---

## React Component Examples

### EventChainPanel

```tsx
interface EventChainPanelProps {
  chain: EventChain;
  preferences: LongChainPreferences;
}

export const EventChainPanel: React.FC<EventChainPanelProps> = ({
  chain,
  preferences
}) => {
  const [isExpanded, setIsExpanded] = useState(preferences.enabled);
  
  // Don't render if disabled and nothing special
  if (!preferences.enabled && !chain.steps.some(s => 
    preferences.autoExpandOn.includes(s.type as any)
  )) {
    return <MinimalChainView chain={chain} />;
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <ChainHeader 
        chain={chain}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
        preferences={preferences}
      />
      
      {/* Steps */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="divide-y divide-border"
          >
            {chain.steps.map((step, index) => (
              <ChainStep
                key={step.id}
                step={step}
                isLast={index === chain.steps.length - 1}
                showTiming={preferences.showTiming}
                detailLevel={preferences.detailLevel}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Summary Footer */}
      {chain.status !== 'running' && (
        <ChainSummary 
          chain={chain}
          showTokens={preferences.showTokens}
          showTiming={preferences.showTiming}
        />
      )}
    </div>
  );
};
```

### ChainStep Component

```tsx
interface ChainStepProps {
  step: ChainStep;
  isLast: boolean;
  showTiming: boolean;
  detailLevel: 'minimal' | 'normal' | 'verbose';
}

export const ChainStep: React.FC<ChainStepProps> = ({
  step,
  isLast,
  showTiming,
  detailLevel
}) => {
  const statusIcon = useMemo(() => {
    switch (step.status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'in_progress': return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'failed': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending': return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'skipped': return <SkipForward className="h-4 w-4 text-muted-foreground" />;
      default: return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  }, [step.status]);

  return (
    <div className={cn(
      "relative py-3 px-4",
      step.status === 'in_progress' && "bg-primary/5"
    )}>
      {/* Timeline connector */}
      {!isLast && (
        <div className="absolute left-6 top-10 bottom-0 w-px bg-border" />
      )}
      
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="flex-shrink-0 mt-0.5">
          {statusIcon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {step.stepNumber}. {step.title}
              </span>
              <StepTypeBadge type={step.type} />
            </div>
            
            {showTiming && step.durationMs && (
              <span className="text-xs text-muted-foreground font-mono">
                {formatDuration(step.durationMs)}
              </span>
            )}
          </div>
          
          {/* Description */}
          {step.description && detailLevel !== 'minimal' && (
            <p className="text-sm text-muted-foreground mt-1">
              {step.description}
            </p>
          )}
          
          {/* Progress bar */}
          {step.status === 'in_progress' && step.progress !== undefined && (
            <div className="mt-2">
              <Progress value={step.progress} className="h-1" />
              {step.progressLabel && (
                <span className="text-xs text-muted-foreground mt-1">
                  {step.progressLabel}
                </span>
              )}
            </div>
          )}
          
          {/* Tool call details */}
          {step.type === 'tool_call' && step.toolName && detailLevel === 'verbose' && (
            <ToolInvocation 
              toolName={step.toolName}
              args={step.toolArgs}
            />
          )}
          
          {/* Search details */}
          {step.type === 'search' && detailLevel !== 'minimal' && (
            <SearchResult
              query={step.searchQuery}
              resultCount={step.searchResults}
            />
          )}
          
          {/* Thinking stream */}
          {step.type === 'thinking' && step.status === StepStatus.InProgress && (
            <ThinkingStream stepId={step.id} />
          )}
          
          {/* Error message */}
          {step.status === StepStatus.Failed && step.errorMessage && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{step.errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
};
```

---

## Database Schema

```sql
CREATE TABLE event_chains (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'running',
    
    total_steps INTEGER DEFAULT 0,
    completed_steps INTEGER DEFAULT 0,
    failed_steps INTEGER DEFAULT 0,
    
    current_step_id TEXT,
    
    started_at DATETIME NOT NULL,
    completed_at DATETIME,
    total_duration_ms INTEGER,
    
    total_input_tokens INTEGER DEFAULT 0,
    total_output_tokens INTEGER DEFAULT 0,
    
    is_expanded BOOLEAN DEFAULT TRUE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id),
    FOREIGN KEY (message_id) REFERENCES chat_messages(id)
);

CREATE TABLE chain_steps (
    id TEXT PRIMARY KEY,
    chain_id TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    
    type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    
    title TEXT NOT NULL,
    description TEXT,
    
    started_at DATETIME,
    completed_at DATETIME,
    duration_ms INTEGER,
    
    progress INTEGER,
    progress_label TEXT,
    
    input TEXT,
    output TEXT,
    
    tool_name TEXT,
    tool_args TEXT,
    
    search_query TEXT,
    search_results INTEGER,
    
    error_code TEXT,
    error_message TEXT,
    
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (chain_id) REFERENCES event_chains(id) ON DELETE CASCADE
);

CREATE INDEX IdxChainStepsChain ON chain_steps(chain_id);
CREATE INDEX IdxEventChainsSession ON event_chains(session_id);
CREATE INDEX IdxEventChainsMessage ON event_chains(message_id);
```

---

## Configuration Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `ui.longChain.defaultEnabled` | bool | true | Enable by default |
| `ui.longChain.defaultDetailLevel` | string | "normal" | minimal/normal/verbose |
| `ui.longChain.showTiming` | bool | true | Show step durations |
| `ui.longChain.showTokens` | bool | true | Show token counts |
| `ui.longChain.maxVisibleSteps` | int | 10 | Collapse after N steps |
| `ui.longChain.thinkingStreamDelay` | int | 50 | Streaming delay (ms) |

---

## Error Codes

| Code | Description |
|------|-------------|
| 12810 | Chain not found |
| 12811 | Step not found |
| 12812 | Cannot start step: chain completed |
| 12813 | Invalid step transition |
| 12814 | Chain timeout exceeded |
| 12815 | Maximum steps exceeded |
