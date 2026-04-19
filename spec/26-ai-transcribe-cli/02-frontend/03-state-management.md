# AI Transcribe CLI: Frontend State Management

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09

---

## Overview

State management architecture for the AI Transcribe CLI testing interface using React Query and Zustand.

---

## Technology Stack

| Library | Purpose | Version |
|---------|---------|---------|
| TanStack Query | Server state (API data) | ^5.x |
| Zustand | Client state (UI state) | ^4.x |
| React Context | Static/configuration state | Built-in |

---

## State Categories

```
┌─────────────────────────────────────────────────────────┐
│                    State Architecture                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Server State │  │ Client State │  │ Static State │  │
│  │ (React Query)│  │  (Zustand)   │  │  (Context)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│   - Transcriptions   - UI Mode         - API Config    │
│   - Sessions         - Audio State     - Feature Flags │
│   - Voices           - WebSocket       - Theme         │
│   - Voice Clones     - Recording       - Providers     │
│   - Commands         - Playback                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Server State (React Query)

### Query Keys

```typescript
// src/lib/query-keys.ts

export const queryKeys = {
  // Transcriptions
  transcriptions: ['transcriptions'] as const,
  transcription: (id: string) => ['transcriptions', id] as const,
  
  // Sessions
  sessions: ['sessions'] as const,
  session: (id: string) => ['sessions', id] as const,
  sessionHistory: (id: string) => ['sessions', id, 'history'] as const,
  
  // Voices
  voices: ['voices'] as const,
  voicesByProvider: (provider: string) => ['voices', provider] as const,
  
  // Voice Clones
  clones: ['clones'] as const,
  clone: (id: string) => ['clones', id] as const,
  
  // Commands
  commands: ['commands'] as const,
  commandsByCategory: (category: string) => ['commands', category] as const,
  
  // Providers
  providers: ['providers'] as const,
  providerHealth: (id: string) => ['providers', id, 'health'] as const,
  
  // Health
  health: ['health'] as const,
} as const;
```

### Query Hooks

```typescript
// src/hooks/queries/use-transcriptions.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { transcriptionApi } from '@/lib/api';

export function useTranscriptions() {
  return useQuery({
    queryKey: queryKeys.transcriptions,
    queryFn: () => transcriptionApi.list(),
  });
}

export function useTranscription(id: string) {
  return useQuery({
    queryKey: queryKeys.transcription(id),
    queryFn: () => transcriptionApi.get(id),
    enabled: !!id,
  });
}

export function useTranscribeMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (audio: Blob) => transcriptionApi.transcribe(audio),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.transcriptions 
      });
    },
  });
}
```

```typescript
// src/hooks/queries/use-voices.ts

export function useVoices(provider?: string) {
  return useQuery({
    queryKey: provider 
      ? queryKeys.voicesByProvider(provider) 
      : queryKeys.voices,
    queryFn: () => voicesApi.list({ provider }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSynthesizeMutation() {
  return useMutation({
    mutationFn: (params: SynthesizeParams) => ttsApi.synthesize(params),
  });
}
```

```typescript
// src/hooks/queries/use-voice-clones.ts

export function useVoiceClones() {
  return useQuery({
    queryKey: queryKeys.clones,
    queryFn: () => voiceCloneApi.list(),
  });
}

export function useCreateCloneMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: CreateCloneParams) => voiceCloneApi.create(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clones });
      queryClient.invalidateQueries({ queryKey: queryKeys.voices });
    },
  });
}
```

### Query Provider Setup

```typescript
// src/providers/query-provider.tsx

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,        // 30 seconds
      gcTime: 5 * 60 * 1000,       // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

## Client State (Zustand)

### Audio Store

```typescript
// src/stores/audio-store.ts

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AudioState {
  // Recording state
  isRecording: boolean;
  recordingDuration: number;
  audioLevel: number;
  
  // Playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  
  // Device state
  inputDeviceId: string | null;
  outputDeviceId: string | null;
  
  // Actions
  startRecording: () => void;
  stopRecording: () => void;
  setAudioLevel: (level: number) => void;
  
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  
  setInputDevice: (deviceId: string) => void;
  setOutputDevice: (deviceId: string) => void;
}

export const useAudioStore = create<AudioState>()(
  devtools(
    (set) => ({
      // Initial state
      isRecording: false,
      recordingDuration: 0,
      audioLevel: 0,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      playbackRate: 1.0,
      inputDeviceId: null,
      outputDeviceId: null,
      
      // Actions
      startRecording: () => set({ isRecording: true, recordingDuration: 0 }),
      stopRecording: () => set({ isRecording: false }),
      setAudioLevel: (level) => set({ audioLevel: level }),
      
      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      seek: (time) => set({ currentTime: time }),
      setPlaybackRate: (rate) => set({ playbackRate: rate }),
      
      setInputDevice: (deviceId) => set({ inputDeviceId: deviceId }),
      setOutputDevice: (deviceId) => set({ outputDeviceId: deviceId }),
    }),
    { name: 'audio-store' }
  )
);
```

### WebSocket Store

```typescript
// src/stores/websocket-store.ts

interface WebSocketState {
  // Connection state
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  latency: number | null;
  error: string | null;
  
  // Session state
  sessionId: string | null;
  isListening: boolean;
  isSpeaking: boolean;
  turnState: 'idle' | 'user' | 'assistant';
  
  // Actions
  connect: (sessionId?: string) => void;
  disconnect: () => void;
  setStatus: (status: WebSocketState['status']) => void;
  setLatency: (latency: number) => void;
  setError: (error: string | null) => void;
  
  startListening: () => void;
  stopListening: () => void;
  setTurnState: (state: WebSocketState['turnState']) => void;
}

export const useWebSocketStore = create<WebSocketState>()(
  devtools(
    (set, get) => ({
      status: 'disconnected',
      latency: null,
      error: null,
      sessionId: null,
      isListening: false,
      isSpeaking: false,
      turnState: 'idle',
      
      connect: (sessionId) => {
        set({ status: 'connecting', sessionId });
        // WebSocket connection logic handled by service
      },
      disconnect: () => {
        set({ 
          status: 'disconnected', 
          sessionId: null,
          isListening: false,
          isSpeaking: false,
        });
      },
      setStatus: (status) => set({ status }),
      setLatency: (latency) => set({ latency }),
      setError: (error) => set({ error, status: error ? 'error' : get().status }),
      
      startListening: () => set({ isListening: true, turnState: 'user' }),
      stopListening: () => set({ isListening: false }),
      setTurnState: (turnState) => set({ turnState }),
    }),
    { name: 'websocket-store' }
  )
);
```

### UI Store

```typescript
// src/stores/ui-store.ts

type TabMode = 'stt' | 'tts' | 'realtime' | 'clone' | 'commands';

interface UIState {
  // Tab state
  activeTab: TabMode;
  
  // Panel state
  sidebarOpen: boolean;
  settingsOpen: boolean;
  
  // STT state
  sttProvider: string;
  sttModel: string;
  sttLanguage: string;
  
  // TTS state
  ttsProvider: string;
  ttsVoiceId: string | null;
  ttsSpeechRate: number;
  ttsPitch: number;
  
  // Actions
  setActiveTab: (tab: TabMode) => void;
  toggleSidebar: () => void;
  toggleSettings: () => void;
  
  setSttProvider: (provider: string) => void;
  setSttModel: (model: string) => void;
  setSttLanguage: (language: string) => void;
  
  setTtsProvider: (provider: string) => void;
  setTtsVoiceId: (voiceId: string | null) => void;
  setTtsSpeechRate: (rate: number) => void;
  setTtsPitch: (pitch: number) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        activeTab: 'stt',
        sidebarOpen: true,
        settingsOpen: false,
        
        sttProvider: 'whisper',
        sttModel: 'base',
        sttLanguage: 'en',
        
        ttsProvider: 'xtts',
        ttsVoiceId: null,
        ttsSpeechRate: 1.0,
        ttsPitch: 1.0,
        
        setActiveTab: (tab) => set({ activeTab: tab }),
        toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
        toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
        
        setSttProvider: (provider) => set({ sttProvider: provider }),
        setSttModel: (model) => set({ sttModel: model }),
        setSttLanguage: (language) => set({ sttLanguage: language }),
        
        setTtsProvider: (provider) => set({ ttsProvider: provider }),
        setTtsVoiceId: (voiceId) => set({ ttsVoiceId: voiceId }),
        setTtsSpeechRate: (rate) => set({ ttsSpeechRate: rate }),
        setTtsPitch: (pitch) => set({ ttsPitch: pitch }),
      }),
      {
        name: 'transcribe-ui-settings',
        partialize: (state) => ({
          sttProvider: state.sttProvider,
          sttModel: state.sttModel,
          sttLanguage: state.sttLanguage,
          ttsProvider: state.ttsProvider,
          ttsVoiceId: state.ttsVoiceId,
          ttsSpeechRate: state.ttsSpeechRate,
          ttsPitch: state.ttsPitch,
        }),
      }
    ),
    { name: 'ui-store' }
  )
);
```

### Conversation Store

```typescript
// src/stores/conversation-store.ts

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

interface ConversationState {
  messages: Message[];
  
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, content: Partial<Message>) => void;
  clearMessages: () => void;
}

export const useConversationStore = create<ConversationState>()(
  devtools(
    (set) => ({
      messages: [],
      
      addMessage: (message) => set((state) => ({
        messages: [
          ...state.messages,
          {
            ...message,
            id: crypto.randomUUID(),
            timestamp: new Date(),
          },
        ],
      })),
      
      updateMessage: (id, content) => set((state) => ({
        messages: state.messages.map((m) =>
          m.id === id ? { ...m, ...content } : m
        ),
      })),
      
      clearMessages: () => set({ messages: [] }),
    }),
    { name: 'conversation-store' }
  )
);
```

---

## Static State (React Context)

### Config Context

```typescript
// src/contexts/config-context.tsx

interface Config {
  apiBaseUrl: string;
  wsBaseUrl: string;
  maxRecordingDuration: number;
  supportedAudioFormats: string[];
  defaultSttProvider: string;
  defaultTtsProvider: string;
}

const defaultConfig: Config = {
  apiBaseUrl: '/api/v1',
  wsBaseUrl: 'ws://localhost:8031',
  maxRecordingDuration: 300,
  supportedAudioFormats: ['wav', 'mp3', 'webm', 'ogg'],
  defaultSttProvider: 'whisper',
  defaultTtsProvider: 'xtts',
};

const ConfigContext = createContext<Config>(defaultConfig);

export function ConfigProvider({ 
  children,
  config: customConfig,
}: { 
  children: React.ReactNode;
  config?: Partial<Config>;
}) {
  const config = { ...defaultConfig, ...customConfig };
  
  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
```

### Feature Flags Context

```typescript
// src/contexts/feature-flags-context.tsx

interface FeatureFlags {
  enableVoiceCloning: boolean;
  enableVoiceCommands: boolean;
  enableRealtimeConversation: boolean;
  enableMultiSpeaker: boolean;
  enableWordTimestamps: boolean;
}

const defaultFlags: FeatureFlags = {
  enableVoiceCloning: true,
  enableVoiceCommands: true,
  enableRealtimeConversation: true,
  enableMultiSpeaker: false,
  enableWordTimestamps: true,
};

export function FeatureFlagsProvider({ 
  children,
  flags: customFlags,
}: { 
  children: React.ReactNode;
  flags?: Partial<FeatureFlags>;
}) {
  const flags = { ...defaultFlags, ...customFlags };
  
  return (
    <FeatureFlagsContext.Provider value={flags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  const flags = useContext(FeatureFlagsContext);
  return flags[flag];
}
```

---

## Custom Hooks

### useAudioRecorder

```typescript
// src/hooks/use-audio-recorder.ts

export function useAudioRecorder(options?: AudioRecorderOptions) {
  const { isRecording, startRecording, stopRecording, setAudioLevel } = useAudioStore();
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    chunksRef.current = [];
    
    mediaRecorderRef.current.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };
    
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
      setAudioBlob(blob);
    };
    
    mediaRecorderRef.current.start();
    startRecording();
  }, [startRecording]);
  
  const stop = useCallback(() => {
    mediaRecorderRef.current?.stop();
    stopRecording();
  }, [stopRecording]);
  
  return {
    isRecording,
    audioBlob,
    start,
    stop,
  };
}
```

### useWebSocket

```typescript
// src/hooks/use-websocket.ts

export function useWebSocket(sessionId?: string) {
  const config = useConfig();
  const store = useWebSocketStore();
  const wsRef = useRef<WebSocket | null>(null);
  
  const connect = useCallback(() => {
    const url = `${config.wsBaseUrl}/ws/realtime${sessionId ? `?session=${sessionId}` : ''}`;
    wsRef.current = new WebSocket(url);
    
    wsRef.current.onopen = () => store.setStatus('connected');
    wsRef.current.onclose = () => store.setStatus('disconnected');
    wsRef.current.onerror = () => store.setError('Connection failed');
    
    wsRef.current.onmessage = (event) => {
      handleMessage(JSON.parse(event.data));
    };
    
    store.connect(sessionId);
  }, [config.wsBaseUrl, sessionId]);
  
  const disconnect = useCallback(() => {
    wsRef.current?.close();
    store.disconnect();
  }, []);
  
  const send = useCallback((data: any) => {
    wsRef.current?.send(JSON.stringify(data));
  }, []);
  
  return {
    ...store,
    connect,
    disconnect,
    send,
  };
}
```

---

## Provider Composition

```typescript
// src/providers/index.tsx

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ConfigProvider>
        <FeatureFlagsProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </FeatureFlagsProvider>
      </ConfigProvider>
    </QueryProvider>
  );
}
```

---

## See Also

- [Component Library](./02-component-library.md)
- [Testing UI](./01-testing-ui.md)
- [API Interface](../01-backend/09-api-interface.md)
