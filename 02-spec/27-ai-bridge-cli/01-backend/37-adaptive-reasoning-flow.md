# Adaptive Reasoning Flow

> **Version:** 5.0.0  
> **Updated:** 2026-03-09  
> **Status:** Draft  
> **Related:** `34-suggestions-system.md`, `36-session-scoped-rag-memory.md`

---

## 1. Overview

The AI system implements an **adaptive reasoning flow** that intelligently selects how to process prompts. Before generating a response, the system evaluates whether to seek clarification, find more context, or proceed directly. This behavior is inspired by how Lovable asks clarifying questions.

---

## 2. Core Principle

> **First Thing AI Does: Find Questions and Suggestions**

When a prompt is received, the AI's first task is to:
1. Analyze the prompt for ambiguity
2. Determine if more context is needed
3. Generate clarifying questions if confused
4. Suggest better approaches if applicable
5. Only then proceed to generate the main response

---

## 3. Reasoning Modes

The system supports **three reasoning modes**, selected adaptively based on prompt analysis:

### 3.1 Two-Stage Mode

Best for complex or ambiguous prompts.

```
Stage 1: Reasoning Call
├── Analyze prompt for ambiguity
├── Identify missing context
├── Generate clarifying questions
├── Suggest alternative approaches
└── Output: Questions/Suggestions OR "proceed"

Stage 2: Main Response (if no questions)
├── Full context from Stage 1
├── Generate content
└── Include follow-up suggestions
```

**When Used:**
- Complex multi-step requests
- Ambiguous requirements
- Technical decisions with trade-offs
- New feature implementation

### 3.2 Single-Prompt Mode

Best for clear, well-defined requests.

```
Unified Prompt:
├── Original user request
├── Appended instruction: "If confused, ask questions first"
├── Context: available RAG chunks
└── Output: Response + embedded suggestions
```

**Appended Instruction (Default):**
```
Before responding, consider:
1. Do you understand all requirements clearly?
2. Are there any ambiguities that need clarification?
3. What are better approaches to consider?

If confused or if clarification would improve the response:
- List specific questions to ask
- Suggest alternative approaches

Otherwise, proceed with the response and include follow-up suggestions.
```

**When Used:**
- Simple, clear requests
- Follow-up messages in context
- Explicit "no questions" instruction

### 3.3 Conditional Mode

Best for general use—quick heuristic first, then decides.

```
Heuristic Check (Fast):
├── Keyword analysis for complexity
├── Question word detection
├── Context completeness score
├── Previous conversation state
└── Decision: Two-Stage OR Single-Prompt

Then Execute Selected Mode
```

**Heuristic Factors:**

| Factor | Score | Weight |
|--------|-------|--------|
| Contains "implement", "create", "build" | +2 | High complexity |
| Contains "fix", "update", "change" | +1 | Medium complexity |
| Contains "explain", "what is" | -1 | Low complexity |
| Missing code context for code request | +3 | Needs clarification |
| Question has < 10 words | -2 | Likely simple |
| Multiple requirements detected | +2 | Needs breakdown |
| Explicit "just do it" / "no questions" | -5 | Skip reasoning |

**Threshold:** Score ≥ 3 → Two-Stage, otherwise Single-Prompt

---

## 4. Mode Selection Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User Prompt Received                                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Check: Is ReasoningMode setting "Auto"?                     │
│ (Default is "Auto" which means Conditional)                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
       ┌──────────┼──────────┐
       │          │          │
       ▼          ▼          ▼
   TwoStage   SinglePrompt  Auto/Conditional
   (forced)    (forced)         │
       │          │             │
       │          │             ▼
       │          │     ┌───────────────────────┐
       │          │     │ Run Heuristic Check   │
       │          │     └───────────┬───────────┘
       │          │                 │
       │          │      ┌──────────┼──────────┐
       │          │      │                     │
       │          │      ▼                     ▼
       │          │   Score ≥ 3            Score < 3
       │          │      │                     │
       │          │      ▼                     │
       ▼          ▼      │                     │
┌──────────────────────────────────────────────────────────────┐
│ Execute Selected Mode                                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Question/Suggestion Response Format

When AI generates clarifying questions:

```json
{
  "Type": "Clarification",
  "Questions": [
    {
      "Id": "Q001",
      "Question": "Which authentication method should we use?",
      "Options": [
        {"Label": "OAuth 2.0", "Description": "Industry standard for third-party auth"},
        {"Label": "JWT Sessions", "Description": "Simple token-based auth"},
        {"Label": "Passkeys", "Description": "Modern passwordless authentication"}
      ],
      "MultiSelect": false,
      "Required": true
    },
    {
      "Id": "Q002",
      "Question": "Should we include email verification?",
      "Options": [
        {"Label": "Yes", "Description": "Verify email before account activation"},
        {"Label": "No", "Description": "Allow immediate access"}
      ],
      "MultiSelect": false,
      "Required": true
    }
  ],
  "Suggestions": [
    {
      "Id": "S001",
      "Title": "Consider rate limiting",
      "Description": "Authentication endpoints should have rate limiting to prevent brute force attacks",
      "Type": "Informational"
    }
  ],
  "CanProceedWithDefaults": true,
  "DefaultAction": "Proceed with OAuth 2.0 and email verification"
}
```

---

## 6. "No Context Needed" Detection

Explicit signals to skip reasoning:

```go
var SkipReasoningPatterns = []string{
    "just do it",
    "no questions",
    "don't ask",
    "proceed directly",
    "skip clarification",
    "context is clear",
    "I know what I want",
}

func ShouldSkipReasoning(prompt string) bool {
    lower := strings.ToLower(prompt)
    for _, pattern := range SkipReasoningPatterns {
        if strings.Contains(lower, pattern) {
            return true
        }
    }
    return false
}
```

---

## 7. Per-Module Settings

Each module can have reasoning configured differently:

### 7.1 Settings Schema

```sql
CREATE TABLE IF NOT EXISTS ModuleReasoningSettings (
    Id              INTEGER PRIMARY KEY AUTOINCREMENT,
    Module          TEXT UNIQUE NOT NULL,   -- module.Variant: Chat, Blog, Faq, Code, Paragraph
    ReasoningMode   TEXT DEFAULT 'Auto',    -- reasoning_mode.Variant: Auto, TwoStage, SinglePrompt, Disabled
    EnableQuestions INTEGER DEFAULT 1,      -- Allow AI to ask questions
    EnableSuggestions INTEGER DEFAULT 1,    -- Include suggestions in responses
    MaxQuestionsPerResponse INTEGER DEFAULT 5,
    HeuristicThreshold INTEGER DEFAULT 3,   -- Score threshold for Conditional mode
    UpdatedAt       TEXT DEFAULT (datetime('now'))
);

-- Default settings
INSERT OR IGNORE INTO ModuleReasoningSettings (Module) VALUES 
    ('Chat'), ('Blog'), ('Faq'), ('Code'), ('Paragraph');
```

### 7.2 Default Values

| Module | ReasoningMode | Questions | Suggestions |
|--------|---------------|-----------|-------------|
| Chat | Auto | ✓ | ✓ |
| Blog | Auto | ✓ | ✓ |
| FAQ | Auto | ✓ | ✓ |
| Code | Auto | ✓ | ✓ |
| Paragraph | SinglePrompt | ✗ | ✓ |

### 7.3 UI Settings Panel

```
┌─────────────────────────────────────────────────────────────┐
│  AI Reasoning Settings                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Chat Session                                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Reasoning Mode: [Auto ▾]                             │    │
│  │ ☑ Allow clarifying questions                         │    │
│  │ ☑ Include suggestions in responses                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Blog Writing                                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Reasoning Mode: [Auto ▾]                             │    │
│  │ ☑ Allow clarifying questions                         │    │
│  │ ☑ Include suggestions in responses                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Code Generation                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Reasoning Mode: [Two-Stage ▾]                        │    │
│  │ ☑ Allow clarifying questions                         │    │
│  │ ☑ Include suggestions in responses                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                    [Reset Defaults]  [Save]  │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. GSearch Integration

When reasoning determines more context is needed from the web:

```go
type ContextNeed struct {
    Type        context_type.Variant   // context_type.Variant: WebSearch, Codebase, Documentation
    Query       string                 // Search query
    Reason      string                 // Why this context is needed
    Priority    priority.Variant       // priority.Variant: Low, Medium, High
}

func EvaluateContextNeeds(prompt string, ragContext []Chunk) []ContextNeed {
    needs := []ContextNeed{}
    
    // Check if external information needed
    if requiresWebSearch(prompt) {
        needs = append(needs, ContextNeed{
            Type:     "WebSearch",
            Query:    extractSearchQuery(prompt),
            Reason:   "Current information about topic X needed",
            Priority: "Required",
        })
    }
    
    // Check if codebase context insufficient
    if isCodeRequest(prompt) && !hasCodeContext(ragContext) {
        needs = append(needs, ContextNeed{
            Type:     "Codebase",
            Query:    extractCodeScope(prompt),
            Reason:   "Related code files needed for context",
            Priority: "Required",
        })
    }
    
    return needs
}
```

When web search is needed, delegate to GSearch CLI:

```go
// Note: ChunkSlice is defined in types.go (created from generic appfault.ResultSlice[Chunk]):
// type ChunkSlice = appfault.ResultSlice[Chunk]
func FetchWebContext(need ContextNeed) ChunkSlice {
    if need.Type != "WebSearch" {
        return appfault.OkSlice([]Chunk(nil))
    }
    
    // Call GSearch CLI
    results, err := gsearch.Search(gsearch.SearchRequest{
        Query:     need.Query,
        MaxResults: 5,
        Type:      "web",
    })
    if err != nil {
        return appfault.FailWrap[[]Chunk](err, 9840, "web context fetch failed")
    }
    
    // Convert to RAG chunks
    return appfault.OkSlice(convertToChunks(results))
}
```

---

## 9. WebSocket Disconnect Handling

When connection is lost during reasoning or response:

### 9.1 Connection States

```go
// Connection state uses connection_state.Variant from 53-enum-architecture.md
// Values: Connected, Disconnected, Reconnecting

type RequestQueue struct {
    Pending   []PendingRequest
    MaxSize   int
    RetainFor time.Duration
}

type PendingRequest struct {
    Id          string
    Prompt      string
    Context     []Chunk
    Stage       request_stage.Variant  // request_stage.Variant: Reasoning, Generating, Streaming
    Progress    float64     // 0.0 to 1.0
    QueuedAt    time.Time
    LastChunk   string      // Last received chunk
}
```

### 9.2 Disconnect Behavior

```
┌─────────────────────────────────────────────────────────────┐
│ Connection Lost During Request                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Show "Disconnected" indicator with spinner               │
│ 2. Queue pending request with current progress              │
│ 3. Attempt reconnection (exponential backoff)               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼ (Reconnected)
┌─────────────────────────────────────────────────────────────┐
│ Resume Strategy (based on stage):                           │
│                                                              │
│ • Reasoning Stage: Restart reasoning call                   │
│ • Generating Stage: Resume from last position               │
│ • Streaming Stage: Continue from lastChunk offset           │
└─────────────────────────────────────────────────────────────┘
```

### 9.3 UI Reconnection Flow

```
Disconnected State:
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ Connection lost. Reconnecting...  ○○○                    │
│                                                              │
│  Your request is queued and will resume automatically.       │
│                                                              │
│  Progress: ████████░░░░ 65%                                  │
│  Stage: Generating content...                                │
└─────────────────────────────────────────────────────────────┘

Reconnected State:
┌─────────────────────────────────────────────────────────────┐
│  ✓ Reconnected! Resuming your request...                    │
│                                                              │
│  Progress: ████████████ 100%                                 │
│  Stage: Complete                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Configuration (Seedable)

Add to `config.seed.json`:

```json
{
  "AdaptiveReasoning": {
    "DefaultMode": "Auto",
    "HeuristicThreshold": 3,
    "EnableQuestionsDefault": true,
    "EnableSuggestionsDefault": true,
    "MaxQuestionsPerResponse": 5,
    "MaxSuggestionsPerResponse": 5,
    "SkipReasoningPatterns": [
      "just do it",
      "no questions",
      "proceed directly"
    ]
  },
  "WebSocket": {
    "ReconnectMaxAttempts": 10,
    "ReconnectBackoffMs": 1000,
    "ReconnectBackoffMultiplier": 2,
    "ReconnectMaxDelayMs": 30000,
    "RequestQueueMaxSize": 10,
    "RequestQueueRetainMinutes": 30
  }
}
```

---

## 11. Error Codes

| Code | Name | Description |
|------|------|-------------|
| 9820 | `ErrReasoningModeInvalid` | Unknown reasoning mode specified |
| 9821 | `ErrReasoningTimeout` | Reasoning stage timed out |
| 9822 | `ErrContextFetchFailed` | Failed to fetch required context |
| 9823 | `ErrGsearchUnavailable` | GSearch CLI not available for web search |
| 9824 | `ErrQuestionLimitExceeded` | Too many questions in response |
| 9825 | `ErrWebsocketQueueFull` | Request queue capacity exceeded |
| 9826 | `ErrWebsocketResumeFailed` | Failed to resume after reconnection |

---

## 12. Related Specifications

| Spec | Relationship |
|------|--------------|
| `09-agentic-mode.md` | Prompt-to-Search pipeline, SearchPlan schema, fast model config |
| `34-suggestions-system.md` | Suggestion output format |
| `36-session-scoped-rag-memory.md` | RAG context for reasoning |
| `40-gsearch-context-integration.md` | GSearch delegation, context detection heuristics |
| `50-long-chain-command-system.md` | Task DAG construction, parallel wave scheduler |
| `31-revision-feedback-system.md` | Feedback-driven regeneration |
| `53-enum-architecture.md` | Enum type definitions |
