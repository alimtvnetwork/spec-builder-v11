# Voice Commands

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

---

## Overview

Voice command processing enables hands-free control of AI Transcribe features. Commands are detected during STT processing and trigger specific actions without requiring manual input.

**Cross-References:**
- [STT Providers](./03-stt-providers.md)
- [Realtime Conversation](./05-realtime-conversation.md)
- [API Interface](./09-api-interface.md)

---

## Command Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Voice Command Pipeline                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Audio Input ──▶ STT Engine ──▶ Command Detector ──▶ Router │
│                                       │                     │
│                                       ▼                     │
│                              ┌────────────────┐             │
│                              │ Command Types  │             │
│                              ├────────────────┤             │
│                              │ • Wake Words   │             │
│                              │ • System Cmds  │             │
│                              │ • Mode Control │             │
│                              │ • Custom Cmds  │             │
│                              └────────────────┘             │
│                                       │                     │
│                                       ▼                     │
│                              Action Executor                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Command Types

### 1. Wake Words

Activate listening mode from standby.

```go
type WakeWordConfig struct {
    Phrases      []string       // ["hey assistant", "ok transcribe"]
    Sensitivity  float64        // 0.0-1.0, default 0.7
    Timeout      time.Duration  // Return to standby after
    Confirmation bool           // Audio feedback on activation
}
```

**Default Wake Words:**
- "Hey Transcribe"
- "OK Assistant"
- "Start listening"

### 2. System Commands

Built-in commands for core functionality.

| Command Pattern | Action | Response |
|-----------------|--------|----------|
| "stop listening" | Pause STT | "Listening paused" |
| "start listening" | Resume STT | "Listening resumed" |
| "cancel" | Abort current operation | "Cancelled" |
| "repeat that" | TTS repeats last output | [Repeats] |
| "speak slower" | Reduce TTS speed | "Speaking slower" |
| "speak faster" | Increase TTS speed | "Speaking faster" |
| "louder" | Increase volume | "Volume increased" |
| "quieter" | Decrease volume | "Volume decreased" |
| "save transcript" | Export current session | "Transcript saved" |
| "clear session" | Reset conversation | "Session cleared" |

### 3. Mode Control Commands

Switch between operational modes.

```go
type ModeCommand struct {
    Pattern    string
    TargetMode string
}

var modeCommands = []ModeCommand{
    {Pattern: "dictation mode", TargetMode: "dictation"},
    {Pattern: "conversation mode", TargetMode: "conversation"},
    {Pattern: "transcription mode", TargetMode: "transcription"},
    {Pattern: "translation mode", TargetMode: "translation"},
}
```

### 4. Custom Commands

User-defined commands with configurable actions.

```go
// CommandParameters holds typed fields for all action types.
// Only the relevant fields are populated per action type.
type CommandParameters struct {
    Url         string   // webhook — target URL
    Method      string   // webhook — HTTP method
    Headers     []string // webhook — additional headers
    Command     string   // command — system command to execute
    Args        []string // command — command arguments
    Steps       []string // macro — ordered step IDs
    DelegateTo  string   // delegate — AI Bridge target
    Delta       float64  // system — speed/volume adjustment delta
}

type CustomCommand struct {
    Id          string
    Patterns    []string            // Trigger phrases
    Action      string              // Action type
    Parameters  CommandParameters   // Action params
    Response    string              // TTS response
    Enabled     bool
    CreatedAt   time.Time
}

// Action types
const (
    ActionWebhook    = "webhook"     // HTTP callback
    ActionCommand    = "command"     // System command
    ActionMacro      = "macro"       // Multi-step sequence
    ActionDelegate   = "delegate"    // Forward to AI Bridge
)
```

---

## Command Detection

### Pattern Matching Engine

```go
type CommandDetector struct {
    commands     []CommandDefinition
    fuzzyMatch   bool
    threshold    float64  // Similarity threshold (0.0-1.0)
    contextAware bool     // Use conversation context
}

type CommandMatch struct {
    Command    CommandDefinition
    Confidence float64
    Transcript string
    StartTime  float64
    EndTime    float64
}

func (d *CommandDetector) Detect(transcript string) appfault.Result[CommandMatch] {
    // 1. Exact match check
    if cmd := d.exactMatch(transcript); cmd != nil {
        return &CommandMatch{Command: *cmd, Confidence: 1.0}, nil
    }
    
    // 2. Fuzzy match if enabled
    if d.fuzzyMatch {
        if match := d.fuzzyMatchCommand(transcript); match != nil {
            if match.Confidence >= d.threshold {
                return match, nil
            }
        }
    }
    
    return nil, nil // No command detected
}
```

### Fuzzy Matching

Uses Levenshtein distance with normalization for typo tolerance.

```go
func (d *CommandDetector) fuzzyMatchCommand(transcript string) *CommandMatch {
    var bestMatch *CommandMatch
    
    for _, cmd := range d.commands {
        for _, pattern := range cmd.Patterns {
            similarity := calculateSimilarity(
                strings.ToLower(transcript),
                strings.ToLower(pattern),
            )
            
            if bestMatch == nil || similarity > bestMatch.Confidence {
                bestMatch = &CommandMatch{
                    Command:    cmd,
                    Confidence: similarity,
                    Transcript: transcript,
                }
            }
        }
    }
    
    return bestMatch
}
```

---

## Command Execution

### Executor Interface

```go
import stdctx "context"

type CommandExecutor interface {
    Execute(context stdctx.Context, cmd CommandMatch) appfault.Result[ExecutionResult]
    Validate(cmd CommandDefinition) *appfault.AppError
    CanExecute(cmd CommandDefinition) bool
}

// ExecutionResultData holds typed result metadata from command execution.
type ExecutionResultData struct {
    StatusCode   int    // webhook — HTTP response status code
    ResponseBody string // webhook — HTTP response body
    ExitCode     int    // command — process exit code
    Output       string // command — process stdout
}

type ExecutionResult struct {
    Success      bool                // Execution success
    Response     string              // TTS response text
    Data         ExecutionResultData  // Result data
    NextState    string              // State transition
    SuppressTts  bool                // Skip audio response
}
```

### Built-in Executors

```go
// System command executor
type SystemExecutor struct {
    session *Session
    config  *Config
}

func (e *SystemExecutor) Execute(context stdctx.Context, cmd CommandMatch) appfault.Result[ExecutionResult] {
    switch cmd.Command.Action {
    case "pause_listening":
        e.session.PauseStt()
        return &ExecutionResult{
            Success:  true,
            Response: "Listening paused. Say 'start listening' to resume.",
        }, nil
        
    case "adjust_speed":
        e.session.AdjustTtsSpeed(cmd.Command.Parameters.Delta)
        return &ExecutionResult{
            Success:  true,
            Response: fmt.Sprintf("Speech rate adjusted to %.1fx", e.session.TTSSpeed),
        }, nil
        
    // ... other system commands
    }
}

// WebhookPayload is the typed outbound body sent to webhook endpoints.
type WebhookPayload struct {
    Command    string `json:"command"`
    Transcript string `json:"transcript"`
    Timestamp  int64  `json:"timestamp"`
}

// Webhook executor
type WebhookExecutor struct {
    client  *http.Client
    timeout time.Duration
}

func (e *WebhookExecutor) Execute(context stdctx.Context, cmd CommandMatch) appfault.Result[ExecutionResult] {
    url := cmd.Command.Parameters.Url
    
    payload := WebhookPayload{
        Command:    cmd.Command.Id,
        Transcript: cmd.Transcript,
        Timestamp:  time.Now().Unix(),
    }
    
    resp, err := e.client.Post(url, "application/json", toJson(payload))
    if err != nil {
        return nil, appfault.Wrap(
            err,
            ErrVoiceCommandWebhookFailed,
            "execute webhook",
        )
    }
    
    return &ExecutionResult{
        Success:  resp.StatusCode == 200,
        Response: cmd.Command.Response,
    }, nil
}
```

---

## Command Configuration

### Database Schema

```sql
CREATE TABLE voice_commands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    patterns TEXT NOT NULL,       -- JSON array of trigger phrases
    action_type TEXT NOT NULL,    -- webhook, command, macro, delegate
    action_params TEXT,           -- JSON action parameters
    response_text TEXT,           -- TTS response
    enabled INTEGER DEFAULT 1,
    priority INTEGER DEFAULT 0,   -- Higher = checked first
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE command_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    command_id TEXT NOT NULL,
    transcript TEXT NOT NULL,
    confidence REAL NOT NULL,
    executed INTEGER NOT NULL,    -- 1 = success, 0 = failed
    execution_time_ms INTEGER,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (command_id) REFERENCES voice_commands(id)
);
```

### Configuration File

```yaml
# config/voice-commands.yaml
voice_commands:
  wake_word:
    enabled: true
    phrases:
      - "hey transcribe"
      - "ok assistant"
    sensitivity: 0.7
    timeout: 30s
    
  detection:
    fuzzy_match: true
    threshold: 0.85
    context_aware: true
    
  feedback:
    audio_confirmation: true
    visual_indicator: true
    haptic_feedback: false
    
  system_commands:
    enabled: true
    allow_override: false
    
  custom_commands:
    enabled: true
    max_commands: 100
    webhook_timeout: 5s
```

---

## API Endpoints

### Command Management

```yaml
# List all commands
GET /api/v1/commands
Response:
  - id: "cmd_001"
    name: "Send to Email"
    patterns: ["email this", "send email"]
    action_type: "webhook"
    enabled: true

# Create custom command
POST /api/v1/commands
Body:
  name: "Quick Note"
  patterns: ["take a note", "note this"]
  action_type: "delegate"
  action_params:
    target: "ai-bridge"
    action: "create_note"
  response_text: "Note saved"

# Update command
PATCH /api/v1/commands/{id}
Body:
  enabled: false

# Delete command
DELETE /api/v1/commands/{id}

# Test command detection
POST /api/v1/commands/test
Body:
  transcript: "hey transcribe, send email"
Response:
  detected: true
  command_id: "cmd_001"
  confidence: 0.95
```

---

## Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 14200 | ERR_CMD_NOT_FOUND | Command not found |
| 14201 | ERR_CMD_DISABLED | Command is disabled |
| 14202 | ERR_CMD_EXECUTION | Command execution failed |
| 14203 | ERR_CMD_WEBHOOK | Webhook call failed |
| 14204 | ERR_CMD_PATTERN | Invalid command pattern |
| 14205 | ERR_CMD_LIMIT | Max custom commands reached |
| 14206 | ERR_WAKE_WORD | Wake word detection failed |

---

## Best Practices

### Command Design

1. **Distinct Patterns**: Avoid similar-sounding commands
2. **Short Phrases**: 2-4 words optimal for recognition
3. **Action Verbs**: Start with verbs ("start", "stop", "save")
4. **Confirmation**: Provide audio feedback for actions

### Performance

1. **Priority Ordering**: Check frequent commands first
2. **Early Exit**: Stop matching on exact match
3. **Caching**: Cache compiled patterns
4. **Async Execution**: Don't block audio pipeline

---

## Related Specs

- [STT Providers](./03-stt-providers.md)
- [Realtime Conversation](./05-realtime-conversation.md)
- [Error Codes](./10-error-codes.md)
