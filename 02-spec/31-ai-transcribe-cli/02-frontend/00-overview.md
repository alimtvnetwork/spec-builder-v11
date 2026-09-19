# AI Transcribe CLI: Frontend Overview

**Version:** 2.1.0  
**Status:** Complete  
**Updated:** 2026-03-30  
**AI Confidence:** High  
**Ambiguity:** None

---


## Keywords

`transcribe`, `cli`, `frontend`

---

## Scoring

| Criterion | Status |
|-----------|--------|
| `00-overview.md` present | ✅ |
| AI Confidence assigned | ✅ |
| Ambiguity assigned | ✅ |
| Keywords present | ✅ |
| Scoring table present | ✅ |


## Overview

Frontend specifications for the AI Transcribe CLI testing interface, providing interactive tools for STT, TTS, real-time conversation, voice cloning, and voice commands.

---

## Module Index

| Module | Spec | Description |
|--------|------|-------------|
| Testing UI | [01-testing-ui.md](./01-testing-ui.md) | Main testing interface layout and pages |
| Component Library | [02-component-library.md](./02-component-library.md) | Reusable React components |
| State Management | [03-state-management.md](./03-state-management.md) | React Query + Zustand architecture |

---

## Technology Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| React | UI framework | ^18.x |
| TypeScript | Type safety | ^5.x |
| Vite | Build tool | ^5.x |
| TanStack Query | Server state | ^5.x |
| Zustand | Client state | ^4.x |
| Tailwind CSS | Styling | ^3.x |
| shadcn/ui | Component primitives | Latest |
| Lucide React | Icons | ^0.460.x |

---

## Page Structure

```
/                           → Dashboard/home
/stt                        → Speech-to-Text testing
/tts                        → Text-to-Speech testing
/realtime                   → Real-time conversation
/clone                      → Voice cloning wizard
/clone/:id                  → Clone details/preview
/commands                   → Voice command management
/sessions                   → Session history
/sessions/:id               → Session details
/settings                   → Provider configuration
/swagger                    → API documentation
```

---

## Component Hierarchy

```
VoiceApp/
├── AudioCapturePanel/
│   ├── AudioRecorder
│   ├── AudioDeviceSelector
│   ├── AudioWaveform
│   ├── AudioLevelMeter
│   └── RecordingControls
├── TranscriptionPanel/
│   ├── TranscriptDisplay
│   ├── TranscriptSegment
│   ├── WordTimestamp
│   ├── SpeakerLabel
│   └── TranscriptEditor
├── TTSPanel/
│   ├── TTSControls
│   ├── VoiceSelector
│   ├── VoicePreview
│   ├── SpeechRateSlider
│   └── AudioPlayer
├── RealtimePanel/
│   ├── ConversationPanel
│   ├── MessageBubble
│   ├── ConnectionStatus
│   ├── VoiceActivityIndicator
│   └── TurnIndicator
├── VoiceClonePanel/
│   ├── CloneWizard
│   ├── SampleUploader
│   ├── CloneProgress
│   └── CloneManager
├── CommandsPanel/
│   ├── CommandList
│   ├── CommandEditor
│   └── WakeWordConfig
└── ProviderPanel/
    ├── ProviderSelector
    ├── ProviderStatus
    └── ProviderConfig
```

---

## State Management

### Server State (React Query)
```typescript
// Query keys for API data
queryKeys.transcriptions     // Transcription sessions
queryKeys.voices             // Available TTS voices
queryKeys.clones             // Voice clones
queryKeys.commands           // Voice commands
queryKeys.providers          // Provider health
```

### Client State (Zustand)
```typescript
interface VoiceState {
  // Audio capture
  isRecording: boolean;
  audioLevel: number;
  recordingDuration: number;
  
  // STT
  isTranscribing: boolean;
  partialTranscript: string;
  
  // TTS
  isSynthesizing: boolean;
  isPlaying: boolean;
  
  // WebSocket
  connectionStatus: 'connected' | 'disconnected';
  isListening: boolean;
  
  // Settings
  sttProvider: 'whisper' | 'openai' | 'elevenlabs';
  ttsProvider: 'xtts' | 'elevenlabs' | 'azure';
  language: string;
  voiceId: string | null;
}
```

---

## Key Features

### Speech-to-Text (STT)
- Audio recording with waveform visualization
- File upload support (WAV, MP3, WebM)
- Real-time streaming transcription
- Provider/model selection
- Transcript display with timestamps

### Text-to-Speech (TTS)
- Text input with character count
- Voice selector with preview
- Speech rate and pitch controls
- Audio playback with waveform
- Download synthesized audio

### Real-time Conversation
- WebSocket-based bidirectional audio
- Conversation history display
- Voice activity detection
- Turn-based interaction
- Connection status indicator

### Voice Cloning
- Sample upload/recording wizard
- Instant and professional cloning modes
- Clone management and preview
- Integration with TTS voice selector

### Voice Commands
- Command list with categories
- Command editor with action builder
- Wake word configuration
- Command testing interface

---

## API Integration

The frontend communicates with:

| Endpoint | Port | Protocol |
|----------|------|----------|
| REST API | 8030 | HTTP |
| Real-time | 8031 | WebSocket |

Base URL configuration via environment:
- `VITE_API_BASE_URL` (default: `/api/v1`)
- `VITE_WS_BASE_URL` (default: `ws://localhost:8031`)

---

## Design System

All components use semantic design tokens from `index.css`:

```css
/* Primary palette */
--primary
--primary-foreground

/* Backgrounds */
--background
--foreground
--muted
--muted-foreground

/* Accents */
--accent
--accent-foreground

/* States */
--destructive
--success
--warning
```

---

## See Also

- [Main Overview](../00-overview.md)
- [Backend API Interface](../01-backend/09-api-interface.md)
- [Backend OpenAPI Spec](../01-backend/12-openapi-spec.md)
