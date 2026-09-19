# Testing UI Specification

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

---

## Overview

The AI Transcribe Testing UI provides an interactive interface for testing all voice-related functionality including STT, TTS, real-time conversation, voice cloning, and voice commands.

**Cross-References:**
- [Architecture](../01-backend/01-architecture.md)
- [API Interface](../01-backend/09-api-interface.md)
- [STT Providers](../01-backend/03-stt-providers.md)
- [TTS Providers](../01-backend/04-tts-providers.md)

---

## Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  AI Transcribe Testing UI                          [Settings]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┬─────────┬─────────┬─────────┬─────────┐       │
│  │   STT   │   TTS   │ Realtime│  Voices │ Commands│       │
│  └─────────┴─────────┴─────────┴─────────┴─────────┘       │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                                                       │ │
│  │                  Tab Content Area                     │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Status: Connected │ Provider: Whisper │ Latency: 45ms│ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. STT Testing Tab

#### Audio Capture Component

```typescript
interface AudioCaptureProps {
  onAudioData: (blob: Blob) => void;
  onStreamData?: (chunk: ArrayBuffer) => void;
  mode: 'file' | 'microphone' | 'stream';
  maxDuration?: number;
  sampleRate?: number;
}

interface AudioCaptureState {
  isRecording: boolean;
  duration: number;
  audioLevel: number;
  error?: string;
}
```

**Features:**
- Microphone recording with real-time waveform
- File upload (drag-and-drop, click to browse)
- Audio preview before transcription
- Recording timer and audio level meter

#### Transcription Display Component

```typescript
interface TranscriptionDisplayProps {
  result: TranscriptionResult | null;
  isProcessing: boolean;
  showTimestamps: boolean;
  showConfidence: boolean;
  highlightSpeakers: boolean;
}

interface TranscriptionResult {
  text: string;
  language: string;
  confidence: number;
  duration: number;
  words?: WordTimestamp[];
  speakers?: SpeakerSegment[];
}
```

**Features:**
- Real-time text display during streaming
- Word-level timestamp highlighting (click to seek)
- Speaker diarization with color coding
- Confidence score visualization
- Copy/export transcript

#### STT Settings Panel

```typescript
interface STTSettings {
  provider: 'whisper' | 'openai' | 'elevenlabs';
  language: string;
  enableTimestamps: boolean;
  enableDiarization: boolean;
  modelSize?: string;  // For Whisper
}
```

**UI Elements:**
- Provider dropdown with status indicators
- Language selector with auto-detect option
- Toggle switches for features
- Model size selector (Whisper only)

---

### 2. TTS Testing Tab

#### Text Input Component

```typescript
interface TextInputProps {
  value: string;
  onChange: (text: string) => void;
  maxLength: number;
  showCharCount: boolean;
  enableSSML?: boolean;
}
```

**Features:**
- Multi-line text area with character counter
- SSML tag insertion toolbar (optional)
- Template/preset phrases dropdown
- Clear and paste buttons

#### Audio Playback Component

```typescript
interface AudioPlaybackProps {
  audioUrl: string | null;
  isLoading: boolean;
  onPlaybackComplete?: () => void;
}

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
}
```

**Features:**
- Play/pause with progress bar
- Volume control and mute
- Playback speed adjustment (0.5x - 2x)
- Download audio button
- Waveform visualization

#### TTS Settings Panel

```typescript
interface TTSSettings {
  provider: 'xtts' | 'elevenlabs' | 'azure';
  voiceId: string;
  language: string;
  speed: number;       // 0.25 - 4.0
  pitch?: number;      // Provider-dependent
  outputFormat: 'wav' | 'mp3' | 'ogg';
}
```

**UI Elements:**
- Provider dropdown
- Voice selector with preview button
- Language selector
- Speed slider with numeric input
- Output format radio buttons

#### Voice Preview Grid

```typescript
interface VoicePreviewGridProps {
  voices: Voice[];
  selectedVoice: string;
  onSelect: (voiceId: string) => void;
  onPreview: (voiceId: string) => void;
}
```

**Features:**
- Grid/list view toggle
- Voice cards with avatar, name, language
- Play preview sample on hover/click
- Filter by language, gender, provider
- Search by voice name

---

### 3. Real-time Conversation Tab

#### Conversation Interface

```typescript
interface ConversationProps {
  sessionId: string | null;
  onSessionStart: () => void;
  onSessionEnd: () => void;
}

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}
```

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Conversation Session                         [End Session] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  Message Thread                      │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ 🎤 User: "What's the weather like today?"   │   │   │
│  │  │      [Play] 0:03                             │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │ 🤖 Assistant: "I'd be happy to help..."     │   │   │
│  │  │      [Play] 0:08                             │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Live Transcription: "Tell me more about..."       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [🎤 Push to Talk]  or  [Toggle Continuous Mode]    │   │
│  │  ──────●────────────── Volume                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Message thread with audio playback per message
- Live transcription display (partial results)
- Push-to-talk and continuous listening modes
- Session timer and turn count
- Interrupt detection indicator

#### Audio Visualizer

```typescript
interface AudioVisualizerProps {
  type: 'waveform' | 'frequency' | 'circular';
  isActive: boolean;
  source: 'input' | 'output';
  color?: string;
}
```

**Visualization Types:**
- **Waveform**: Real-time amplitude display
- **Frequency**: Frequency spectrum bars
- **Circular**: Animated circular visualizer

---

### 4. Voices Tab

#### Voice Cloning Interface

```typescript
interface VoiceCloningProps {
  onCloneComplete: (voice: Voice) => void;
}

interface CloneProgress {
  status: 'uploading' | 'processing' | 'training' | 'complete' | 'error';
  progress: number;
  message: string;
}
```

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Voice Cloning                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Clone Type: ○ Instant (3-30s)  ○ Professional      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ┌───────────────────────────────────────────────┐ │   │
│  │  │         Drag audio files here                 │ │   │
│  │  │              or click to browse               │ │   │
│  │  │                                               │ │   │
│  │  │  📁 Supported: WAV, MP3, FLAC (3-30 seconds) │ │   │
│  │  └───────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Voice Name: [____________________]                 │   │
│  │  Description: [____________________]                │   │
│  │  Language: [English ▼]                              │   │
│  │                                                     │   │
│  │  Sample Quality:                                    │   │
│  │  ✅ Duration: 12.3s (min: 3s)                       │   │
│  │  ✅ Sample Rate: 44.1kHz (min: 16kHz)              │   │
│  │  ⚠️ Background Noise: -28dB (recommended: <-30dB)  │   │
│  │                                                     │   │
│  │                            [Clone Voice]            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Drag-and-drop audio upload
- Real-time sample quality analysis
- Progress indicator during training
- Test synthesize with new voice

#### Voice Management List

```typescript
interface VoiceListProps {
  voices: Voice[];
  onEdit: (voice: Voice) => void;
  onDelete: (voiceId: string) => void;
  onTest: (voiceId: string) => void;
}
```

**Features:**
- List of cloned voices with metadata
- Edit settings (stability, similarity)
- Delete with confirmation
- Quick test button

---

### 5. Commands Tab

#### Command List Component

```typescript
interface CommandListProps {
  commands: VoiceCommand[];
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (command: VoiceCommand) => void;
  onDelete: (id: string) => void;
}
```

**Features:**
- System commands (non-editable)
- Custom commands with enable/disable toggle
- Edit/delete custom commands
- Drag to reorder priority

#### Command Editor Modal

```typescript
interface CommandEditorProps {
  command?: VoiceCommand;
  onSave: (command: VoiceCommand) => void;
  onCancel: () => void;
}
```

**Form Fields:**
- Name input
- Trigger phrases (multi-input)
- Action type selector (webhook, delegate, macro)
- Action parameters (dynamic based on type)
- Response text
- Test button

#### Command Testing Interface

```typescript
interface CommandTestProps {
  onTest: (transcript: string) => Promise<CommandTestResult>;
}

interface CommandTestResult {
  detected: boolean;
  command?: VoiceCommand;
  confidence: number;
}
```

**Features:**
- Text input for testing detection
- Voice input for live testing
- Shows matched command and confidence
- Execution preview (dry run)

---

## Shared Components

### Status Bar

```typescript
interface StatusBarProps {
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  activeProvider: string;
  latency?: number;
  sessionDuration?: number;
}
```

### Settings Modal

```typescript
interface SettingsModalProps {
  config: Config;
  onSave: (config: Config) => void;
}
```

**Sections:**
- Audio Input/Output device selection
- Default providers
- API key configuration
- Advanced audio settings

### Error Toast

```typescript
interface ErrorToastProps {
  error: AppError;
  onDismiss: () => void;
  onRetry?: () => void;
}
```

---

## State Management

### React Context Structure

```typescript
interface TranscribeContextValue {
  // Connection state
  isConnected: boolean;
  connectionError?: string;
  
  // Active session
  session: Session | null;
  
  // Settings
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  
  // Providers
  sttProviders: ProviderInfo[];
  ttsProviders: ProviderInfo[];
  
  // Voices
  voices: Voice[];
  refreshVoices: () => Promise<void>;
  
  // Commands
  commands: VoiceCommand[];
  refreshCommands: () => Promise<void>;
}
```

### Hooks

```typescript
// Audio recording hook
function useAudioRecorder(options: RecorderOptions): {
  isRecording: boolean;
  audioBlob: Blob | null;
  duration: number;
  audioLevel: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
}

// WebSocket connection hook
function useTranscribeSocket(url: string): {
  isConnected: boolean;
  sendAudio: (chunk: ArrayBuffer) => void;
  sendMessage: (msg: object) => void;
  lastMessage: object | null;
}

// Audio playback hook
function useAudioPlayer(audioUrl: string | null): {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
}
```

---

## Styling Guidelines

### Theme Variables

```css
:root {
  /* Primary colors */
  --transcribe-primary: hsl(var(--primary));
  --transcribe-secondary: hsl(var(--secondary));
  
  /* Status colors */
  --status-recording: hsl(0, 84%, 60%);    /* Red pulse */
  --status-processing: hsl(45, 93%, 47%);  /* Yellow */
  --status-ready: hsl(142, 71%, 45%);      /* Green */
  
  /* Audio visualization */
  --waveform-color: hsl(var(--primary));
  --waveform-bg: hsl(var(--muted));
  
  /* Speaker colors for diarization */
  --speaker-1: hsl(210, 100%, 60%);
  --speaker-2: hsl(340, 82%, 52%);
  --speaker-3: hsl(142, 71%, 45%);
  --speaker-4: hsl(45, 93%, 47%);
}
```

### Component Classes

```css
/* Recording indicator */
.recording-indicator {
  @apply animate-pulse bg-red-500 rounded-full;
}

/* Audio waveform */
.waveform-container {
  @apply h-16 bg-muted rounded-lg overflow-hidden;
}

/* Transcript segment */
.transcript-segment {
  @apply p-3 rounded-lg mb-2 transition-colors;
}

.transcript-segment:hover {
  @apply bg-muted/50;
}

/* Voice card */
.voice-card {
  @apply p-4 border rounded-lg cursor-pointer transition-all;
}

.voice-card:hover {
  @apply border-primary shadow-md;
}

.voice-card.selected {
  @apply border-primary bg-primary/5;
}
```

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Space` | Start/stop recording (when focused) |
| `Enter` | Confirm action |
| `Escape` | Cancel/close modal |
| `Tab` | Navigate between controls |
| `Arrow keys` | Navigate within lists |

### Screen Reader Support

- All buttons have descriptive aria-labels
- Live regions for transcription updates
- Status announcements for recording state
- Progress announcements during processing

### Visual Indicators

- High contrast mode support
- Color-blind friendly speaker colors
- Text alternatives for audio content
- Clear focus indicators

---

## Error Handling

### Error States by Component

| Component | Error State | Recovery Action |
|-----------|-------------|-----------------|
| AudioCapture | Microphone denied | Show permission guide |
| Transcription | Provider timeout | Retry with fallback |
| TTS Playback | Audio load failed | Show download option |
| WebSocket | Connection lost | Auto-reconnect |
| Voice Clone | Quality check failed | Show requirements |

---

## Related Specs

- [Architecture](../01-backend/01-architecture.md)
- [API Interface](../01-backend/09-api-interface.md)
- [OpenAPI Spec](../01-backend/12-openapi-spec.md)
