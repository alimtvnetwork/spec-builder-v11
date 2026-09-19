# Memory: features/adaptive-reasoning-flow

**Updated:** 2026-02-04
**Version:** 1.0.0  

---

## Summary

The AI system implements an adaptive reasoning flow that intelligently selects how to process prompts. Before generating a response, the system evaluates whether to seek clarification, find more context, or proceed directly. Three modes are available: Two-Stage (separate reasoning call), Single-Prompt (appended instruction), and Conditional (heuristic-based selection). Per-module settings allow customization.

---

## Key Points

- **First Task**: AI finds questions and suggestions before main response
- **Three Modes**: 
  - Two-Stage: Separate reasoning call, then main response
  - Single-Prompt: Append "ask if confused" instruction to prompt
  - Conditional (default): Heuristic selects Two-Stage or Single-Prompt
- **Skip Signals**: Phrases like "just do it", "no questions" bypass reasoning
- **Per-Module Settings**: Each module (Chat, Blog, Code, FAQ, Paragraph) configurable separately
- **GSearch Integration**: Web search delegated to GSearch CLI when context needed
- **WebSocket Reconnection**: Pending requests queued, auto-resume on reconnect
- **Error Codes**: 9820-9826 for reasoning and WebSocket operations

---

## UI Components

- **Settings Path**: `/settings/reasoning`
- **Components**: ReasoningModeSelector, ModuleToggleRow, SkipSignalsConfig, ConnectionSettings
- **API**: GET/PUT `/api/settings/reasoning`

---

## Related Specs

- `02-spec/22-ai-bridge-cli/01-backend/37-adaptive-reasoning-flow.md`
- `02-spec/22-ai-bridge-cli/02-frontend/04-adaptive-reasoning-settings-ui.md`
- `02-spec/22-ai-bridge-cli/01-backend/34-suggestions-system.md`
