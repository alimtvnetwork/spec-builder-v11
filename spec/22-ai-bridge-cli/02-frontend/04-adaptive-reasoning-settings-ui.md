# Adaptive Reasoning Settings UI

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Status:** Draft

---

## Overview

This specification defines the UI components for configuring the Adaptive Reasoning system. Users can enable/disable reasoning modes per module and configure behavior thresholds.

---

## Location

| Context | Path |
|---------|------|
| Settings Page | `/settings/reasoning` |
| Quick Access | Settings → AI Behavior → Adaptive Reasoning |

---

## Component Hierarchy

```
AdaptiveReasoningSettings
├── ReasoningModeSelector
│   ├── ModeCard (Two-Stage)
│   ├── ModeCard (Single-Prompt)
│   └── ModeCard (Conditional) [default]
├── ModuleToggles
│   ├── ModuleToggleRow (Chat)
│   ├── ModuleToggleRow (Blog)
│   ├── ModuleToggleRow (Code)
│   ├── ModuleToggleRow (FAQ)
│   └── ModuleToggleRow (Paragraph)
├── SkipSignalsConfig
│   └── TagInput (skip phrases)
└── ConnectionSettings
    ├── ReconnectBehavior
    └── QueueSizeLimit
```

---

## Components

### 1. AdaptiveReasoningSettings (Container)

**Purpose:** Main container for all reasoning configuration options.

| Property | Type | Description |
|----------|------|-------------|
| `settings` | `ReasoningSettings` | Current configuration state |
| `onSave` | `(settings) => void` | Callback on save |
| `isLoading` | `boolean` | Loading state indicator |

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Adaptive Reasoning                          [Save] │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Default Mode                                    │ │
│ │ [Two-Stage] [Single-Prompt] [Conditional ✓]    │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Per-Module Settings                             │ │
│ │ ┌───────────────────────────────────────────┐   │ │
│ │ │ Chat Session         [Toggle] [Mode ▼]   │   │ │
│ │ │ Blog Post            [Toggle] [Mode ▼]   │   │ │
│ │ │ Code Generation      [Toggle] [Mode ▼]   │   │ │
│ │ │ FAQ Writing          [Toggle] [Mode ▼]   │   │ │
│ │ │ Paragraph Writing    [Toggle] [Mode ▼]   │   │ │
│ │ └───────────────────────────────────────────┘   │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Skip Signals                                    │ │
│ │ [just do it ×] [no questions ×] [+ Add]        │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

### 2. ReasoningModeSelector

**Purpose:** Select the default reasoning mode for all modules.

| Mode | Label | Description |
|------|-------|-------------|
| `two-stage` | Two-Stage | Separate reasoning call before main response |
| `single-prompt` | Single-Prompt | Append reasoning instruction to prompt |
| `conditional` | Conditional | Heuristic determines which mode to use |

**Visual States:**
- Default: Outlined card with icon
- Selected: Filled background with checkmark
- Hover: Subtle highlight

**Implementation Notes:**
- Use `RadioGroup` pattern with card-style options
- Conditional mode should show "(Recommended)" badge
- Tooltip on each card explains behavior

---

### 3. ModuleToggleRow

**Purpose:** Per-module reasoning configuration with enable/disable and mode override.

| Property | Type | Description |
|----------|------|-------------|
| `module` | `ModuleType` | Module identifier |
| `enabled` | `boolean` | Whether reasoning is enabled |
| `mode` | `ReasoningMode | 'inherit'` | Override mode or inherit default |
| `onChange` | `(config) => void` | Change callback |

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│ [Icon] Chat Session                                  │
│                                    [○ On] [Mode ▼]   │
│ ─────────────────────────────────────────────────── │
│ When enabled, AI will seek clarification before      │
│ responding to chat messages.                         │
└──────────────────────────────────────────────────────┘
```

**Module Types:**

| Module | Icon | Description |
|--------|------|-------------|
| `chat` | `MessageSquare` | Chat session conversations |
| `blog` | `FileText` | Blog post generation |
| `code` | `Code` | Code generation/editing |
| `faq` | `HelpCircle` | FAQ content creation |
| `paragraph` | `AlignLeft` | Paragraph/content writing |

**Mode Dropdown Options:**
- "Inherit Default" (uses global setting)
- "Two-Stage"
- "Single-Prompt"
- "Conditional"

---

### 4. SkipSignalsConfig

**Purpose:** Configure phrases that bypass reasoning entirely.

| Property | Type | Description |
|----------|------|-------------|
| `signals` | `string[]` | List of skip phrases |
| `onChange` | `(signals) => void` | Update callback |

**Default Signals:**
```
- "just do it"
- "no questions"
- "skip reasoning"
- "proceed directly"
```

**Implementation Notes:**
- Use tag-style input with removable chips
- Add button opens inline text input
- Validation: minimum 2 characters, no duplicates
- Max 20 custom signals

---

### 5. ConnectionSettings

**Purpose:** Configure WebSocket disconnect behavior.

**Reconnect Behavior Options:**

| Option | Label | Description |
|--------|-------|-------------|
| `auto-resume` | Auto-Resume | Automatically resend queued requests |
| `user-confirm` | Confirm First | Prompt user before resuming |
| `fresh-start` | Discard Queue | Clear pending requests |

**Queue Settings:**

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `maxQueueSize` | `number` | 10 | Max pending requests |
| `showIndicator` | `boolean` | true | Show connection status |

---

## Data Structures

### ReasoningSettings

```typescript
interface ReasoningSettings {
  defaultMode: 'two-stage' | 'single-prompt' | 'conditional';
  modules: ModuleReasoningConfig[];
  skipSignals: string[];
  connection: ConnectionConfig;
}

interface ModuleReasoningConfig {
  module: 'chat' | 'blog' | 'code' | 'faq' | 'paragraph';
  enabled: boolean;
  mode: 'two-stage' | 'single-prompt' | 'conditional' | 'inherit';
}

interface ConnectionConfig {
  reconnectBehavior: 'auto-resume' | 'user-confirm' | 'fresh-start';
  maxQueueSize: number;
  showIndicator: boolean;
}
```

---

## API Integration

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/settings/reasoning` | Fetch current config |
| `PUT` | `/api/settings/reasoning` | Update config |
| `POST` | `/api/settings/reasoning/reset` | Reset to defaults |

### Request/Response

**GET Response:**
```json
{
  "defaultMode": "conditional",
  "modules": [
    { "module": "chat", "enabled": true, "mode": "inherit" },
    { "module": "blog", "enabled": true, "mode": "two-stage" },
    { "module": "code", "enabled": true, "mode": "inherit" },
    { "module": "faq", "enabled": false, "mode": "inherit" },
    { "module": "paragraph", "enabled": true, "mode": "inherit" }
  ],
  "skipSignals": ["just do it", "no questions"],
  "connection": {
    "reconnectBehavior": "auto-resume",
    "maxQueueSize": 10,
    "showIndicator": true
  }
}
```

---

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Keyboard Navigation | Tab through all controls, Enter/Space to toggle |
| Screen Reader | ARIA labels on all toggles and selectors |
| Focus Indicators | Visible focus ring on interactive elements |
| Color Contrast | Minimum 4.5:1 for text, 3:1 for UI components |

---

## Responsive Behavior

| Breakpoint | Layout Change |
|------------|---------------|
| Desktop (≥1024px) | Side-by-side mode cards, full toggle rows |
| Tablet (768-1023px) | Stacked mode cards, compact toggle rows |
| Mobile (<768px) | Full-width cards, collapsible module sections |

---

## Error States

| State | Display |
|-------|---------|
| Load Failed | Error banner with retry button |
| Save Failed | Toast notification with error message |
| Validation Error | Inline field-level error messages |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Backend Spec | `../01-backend/37-adaptive-reasoning-flow.md` |
| Error Codes | `../01-backend/05-error-codes.md` (9820-9826) |
| Shared UI Patterns | `../../28-shared-cli-frontend/00-overview.md` |
