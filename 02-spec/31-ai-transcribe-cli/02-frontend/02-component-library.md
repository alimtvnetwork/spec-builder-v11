# AI Transcribe CLI: Frontend Component Library

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09

---

## Overview

Reusable React component library for the AI Transcribe CLI testing interface.

---

## Component Hierarchy

```
src/components/
├── audio/
│   ├── AudioRecorder.tsx
│   ├── AudioPlayer.tsx
│   ├── AudioWaveform.tsx
│   ├── AudioLevelMeter.tsx
│   └── AudioDeviceSelector.tsx
├── transcription/
│   ├── TranscriptDisplay.tsx
│   ├── TranscriptSegment.tsx
│   ├── TranscriptEditor.tsx
│   ├── WordTimestamp.tsx
│   └── SpeakerLabel.tsx
├── tts/
│   ├── TTSControls.tsx
│   ├── VoiceSelector.tsx
│   ├── VoicePreview.tsx
│   ├── SpeechRateSlider.tsx
│   └── PitchControl.tsx
├── realtime/
│   ├── ConversationPanel.tsx
│   ├── MessageBubble.tsx
│   ├── ConnectionStatus.tsx
│   ├── VoiceActivityIndicator.tsx
│   └── TurnIndicator.tsx
├── voice-clone/
│   ├── CloneWizard.tsx
│   ├── SampleUploader.tsx
│   ├── CloneProgress.tsx
│   ├── ClonePreview.tsx
│   └── CloneManager.tsx
├── commands/
│   ├── CommandList.tsx
│   ├── CommandEditor.tsx
│   ├── WakeWordConfig.tsx
│   └── CommandTester.tsx
├── providers/
│   ├── ProviderSelector.tsx
│   ├── ProviderStatus.tsx
│   └── ProviderConfig.tsx
└── shared/
    ├── LoadingSpinner.tsx
    ├── ErrorBoundary.tsx
    ├── StatusBadge.tsx
    ├── CopyButton.tsx
    └── DownloadButton.tsx
```

---

## Audio Components

### AudioRecorder

Captures audio from microphone with visual feedback.

```tsx
interface AudioRecorderProps {
  onRecordingStart?: () => void;
  onRecordingStop?: (blob: Blob) => void;
  onAudioData?: (data: Float32Array) => void;
  maxDuration?: number;       // seconds
  sampleRate?: number;        // default: 16000
  channels?: number;          // default: 1
  format?: 'wav' | 'webm' | 'mp3';
  showWaveform?: boolean;
  showTimer?: boolean;
  showLevelMeter?: boolean;
  disabled?: boolean;
  className?: string;
}

// Usage
<AudioRecorder
  onRecordingStop={(blob) => handleAudio(blob)}
  maxDuration={300}
  showWaveform
  showTimer
/>
```

### AudioPlayer

Plays audio files with playback controls.

```tsx
interface AudioPlayerProps {
  src: string | Blob;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  showWaveform?: boolean;
  showProgress?: boolean;
  showDuration?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  playbackRate?: number;
  className?: string;
}

// Usage
<AudioPlayer
  src={audioUrl}
  showWaveform
  showProgress
  playbackRate={1.0}
/>
```

### AudioWaveform

Real-time audio visualization.

```tsx
interface AudioWaveformProps {
  audioData?: Float32Array;
  audioUrl?: string;
  mode: 'realtime' | 'static';
  height?: number;
  color?: string;
  backgroundColor?: string;
  barWidth?: number;
  barGap?: number;
  smoothing?: number;
  className?: string;
}

// Usage
<AudioWaveform
  audioData={liveAudioData}
  mode="realtime"
  height={80}
  color="hsl(var(--primary))"
/>
```

### AudioLevelMeter

Shows audio input level.

```tsx
interface AudioLevelMeterProps {
  level: number;            // 0-1
  orientation?: 'horizontal' | 'vertical';
  showPeak?: boolean;
  peakHoldTime?: number;    // ms
  segments?: number;
  lowColor?: string;
  midColor?: string;
  highColor?: string;
  className?: string;
}
```

### AudioDeviceSelector

Dropdown for selecting input/output devices.

```tsx
interface AudioDeviceSelectorProps {
  type: 'input' | 'output';
  value?: string;
  onChange: (deviceId: string) => void;
  showRefresh?: boolean;
  disabled?: boolean;
  className?: string;
}
```

---

## Transcription Components

### TranscriptDisplay

Shows transcription results with segments.

```tsx
interface TranscriptDisplayProps {
  segments: TranscriptSegment[];
  currentTime?: number;
  highlightCurrent?: boolean;
  showTimestamps?: boolean;
  showSpeakers?: boolean;
  showConfidence?: boolean;
  editable?: boolean;
  onSegmentClick?: (segment: TranscriptSegment) => void;
  onSegmentEdit?: (id: string, text: string) => void;
  className?: string;
}

interface TranscriptSegment {
  id: string;
  text: string;
  start: number;
  end: number;
  speaker?: string;
  confidence?: number;
  words?: WordTimestamp[];
}

// Usage
<TranscriptDisplay
  segments={transcription.segments}
  currentTime={audioPlayer.currentTime}
  highlightCurrent
  showTimestamps
  showSpeakers
/>
```

### TranscriptSegment

Individual transcript segment.

```tsx
interface TranscriptSegmentProps {
  segment: TranscriptSegment;
  isActive?: boolean;
  showTimestamp?: boolean;
  showSpeaker?: boolean;
  showConfidence?: boolean;
  editable?: boolean;
  onClick?: () => void;
  onEdit?: (text: string) => void;
  className?: string;
}
```

### WordTimestamp

Word-level timing display.

```tsx
interface WordTimestampProps {
  word: string;
  start: number;
  end: number;
  confidence?: number;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}
```

---

## TTS Components

### TTSControls

Main TTS control panel.

```tsx
interface TTSControlsProps {
  text: string;
  onTextChange: (text: string) => void;
  voice?: Voice;
  onVoiceChange: (voice: Voice) => void;
  rate?: number;
  onRateChange?: (rate: number) => void;
  pitch?: number;
  onPitchChange?: (pitch: number) => void;
  onSynthesize: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

// Usage
<TTSControls
  text={inputText}
  onTextChange={setInputText}
  voice={selectedVoice}
  onVoiceChange={setSelectedVoice}
  onSynthesize={handleSynthesize}
  isLoading={isSynthesizing}
/>
```

### VoiceSelector

Dropdown for selecting TTS voices.

```tsx
interface VoiceSelectorProps {
  voices: Voice[];
  value?: Voice;
  onChange: (voice: Voice) => void;
  provider?: 'all' | 'xtts' | 'elevenlabs' | 'azure';
  language?: string;
  showPreview?: boolean;
  disabled?: boolean;
  className?: string;
}

interface Voice {
  id: string;
  name: string;
  provider: string;
  language: string;
  gender?: 'male' | 'female' | 'neutral';
  previewUrl?: string;
  isCloned?: boolean;
}
```

### VoicePreview

Preview a voice with sample audio.

```tsx
interface VoicePreviewProps {
  voice: Voice;
  sampleText?: string;
  autoPlay?: boolean;
  onPlay?: () => void;
  className?: string;
}
```

---

## Realtime Components

### ConversationPanel

Full conversation interface.

```tsx
interface ConversationPanelProps {
  messages: ConversationMessage[];
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  onSendMessage?: (text: string) => void;
  onStartListening?: () => void;
  onStopListening?: () => void;
  showVoiceActivity?: boolean;
  className?: string;
}

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}
```

### MessageBubble

Single message in conversation.

```tsx
interface MessageBubbleProps {
  message: ConversationMessage;
  showTimestamp?: boolean;
  showAudioPlayer?: boolean;
  className?: string;
}
```

### ConnectionStatus

WebSocket connection indicator.

```tsx
interface ConnectionStatusProps {
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  latency?: number;
  onReconnect?: () => void;
  className?: string;
}
```

### VoiceActivityIndicator

Shows when voice activity is detected.

```tsx
interface VoiceActivityIndicatorProps {
  isActive: boolean;
  level?: number;
  variant?: 'dot' | 'wave' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

---

## Voice Clone Components

### CloneWizard

Step-by-step voice cloning flow.

```tsx
interface CloneWizardProps {
  onComplete: (cloneId: string) => void;
  onCancel: () => void;
  method?: 'instant' | 'professional';
  maxSamples?: number;
  className?: string;
}

// Steps:
// 1. Method selection (instant/professional)
// 2. Sample upload/recording
// 3. Processing
// 4. Preview and confirm
```

### SampleUploader

Upload or record voice samples.

```tsx
interface SampleUploaderProps {
  samples: VoiceSample[];
  onSamplesChange: (samples: VoiceSample[]) => void;
  minSamples?: number;
  maxSamples?: number;
  minDuration?: number;      // per sample, seconds
  maxDuration?: number;
  allowRecord?: boolean;
  allowUpload?: boolean;
  className?: string;
}

interface VoiceSample {
  id: string;
  file: File | Blob;
  name: string;
  duration: number;
  isValid: boolean;
}
```

### CloneProgress

Shows cloning progress.

```tsx
interface CloneProgressProps {
  status: 'uploading' | 'processing' | 'training' | 'complete' | 'error';
  progress?: number;         // 0-100
  estimatedTime?: number;    // seconds remaining
  error?: string;
  className?: string;
}
```

---

## Command Components

### CommandList

Display registered voice commands.

```tsx
interface CommandListProps {
  commands: VoiceCommand[];
  onEdit?: (command: VoiceCommand) => void;
  onDelete?: (id: string) => void;
  onTest?: (command: VoiceCommand) => void;
  showCategories?: boolean;
  className?: string;
}

interface VoiceCommand {
  id: string;
  phrase: string;
  action: string;
  category: 'system' | 'navigation' | 'control' | 'custom';
  parameters?: Record<string, any>;
  isEnabled: boolean;
}
```

### CommandEditor

Create/edit voice commands.

```tsx
interface CommandEditorProps {
  command?: VoiceCommand;
  onSave: (command: VoiceCommand) => void;
  onCancel: () => void;
  className?: string;
}
```

### WakeWordConfig

Configure wake word settings.

```tsx
interface WakeWordConfigProps {
  wakeWord: string;
  onWakeWordChange: (word: string) => void;
  sensitivity?: number;
  onSensitivityChange?: (sensitivity: number) => void;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}
```

---

## Provider Components

### ProviderSelector

Select STT/TTS provider.

```tsx
interface ProviderSelectorProps {
  type: 'stt' | 'tts';
  value: string;
  onChange: (provider: string) => void;
  providers: ProviderInfo[];
  showStatus?: boolean;
  className?: string;
}

interface ProviderInfo {
  id: string;
  name: string;
  type: 'local' | 'cloud';
  status: 'available' | 'unavailable' | 'loading';
  models?: string[];
}
```

### ProviderStatus

Shows provider health/availability.

```tsx
interface ProviderStatusProps {
  provider: ProviderInfo;
  showLatency?: boolean;
  showModels?: boolean;
  onRefresh?: () => void;
  className?: string;
}
```

---

## Shared Components

### StatusBadge

Colored status indicator.

```tsx
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'pending';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}
```

### CopyButton

Copy text to clipboard.

```tsx
interface CopyButtonProps {
  text: string;
  onCopy?: () => void;
  successMessage?: string;
  variant?: 'icon' | 'button';
  className?: string;
}
```

### DownloadButton

Download file/blob.

```tsx
interface DownloadButtonProps {
  data: Blob | string;
  filename: string;
  mimeType?: string;
  onDownload?: () => void;
  variant?: 'icon' | 'button';
  className?: string;
}
```

---

## Styling Guidelines

### Design Tokens

All components use semantic design tokens:

```tsx
// Colors
className="text-foreground"
className="bg-background"
className="border-border"
className="text-muted-foreground"

// Primary actions
className="bg-primary text-primary-foreground"

// Status colors
className="text-destructive"      // errors
className="text-warning"          // warnings
className="text-success"          // success
```

### Responsive Breakpoints

```tsx
// Mobile-first approach
className="w-full md:w-1/2 lg:w-1/3"
className="flex-col md:flex-row"
className="p-4 md:p-6 lg:p-8"
```

---

## See Also

- [Testing UI](./01-testing-ui.md)
- [State Management](./03-state-management.md)
- [API Interface](../01-backend/09-api-interface.md)
