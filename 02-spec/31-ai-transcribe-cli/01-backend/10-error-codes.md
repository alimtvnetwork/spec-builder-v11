# AI Transcribe CLI: Error Codes

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

---

## Overview

AI Transcribe CLI uses error codes in the **14000-14499** range, partitioned by subsystem.

**Cross-References:**
- [Central Error Code Registry](../../21-app/spec-management-software/06-error-management/01-error-code-registry.md)
- [Architecture](./01-architecture.md)
- [API Interface](./09-api-interface.md)

---

## Error Code Ranges

| Range | Category | Description |
|-------|----------|-------------|
| 14000-14049 | General | Startup, configuration, system errors |
| 14050-14099 | Audio Pipeline | Audio capture, encoding, format errors |
| 14100-14149 | STT | Speech-to-text provider errors |
| 14150-14199 | TTS | Text-to-speech provider errors |
| 14200-14249 | Voice Commands | Command detection and execution |
| 14250-14299 | Voice Cloning | Clone creation, training, quality |
| 14300-14349 | Realtime | WebSocket, conversation, VAD |
| 14350-14399 | Session | Session management, transcripts |
| 14400-14449 | Configuration | Config loading, validation |
| 14450-14499 | Provider | Provider-specific errors |

---

## Error Definitions

### General Errors (14000-14049)

| Code | Constant | HTTP | Message | Description |
|------|----------|------|---------|-------------|
| 14000 | `ErrTranscribeGeneral` | 500 | Internal server error | Unspecified internal error |
| 14001 | `ErrTranscribeConfigLoad` | 500 | Failed to load configuration | Configuration file read/parse failure |
| 14002 | `ErrTranscribeConfigInvalid` | 400 | Invalid configuration | Configuration validation failed |
| 14003 | `ErrTranscribeDbInit` | 500 | Database initialization failed | SQLite database setup error |
| 14004 | `ErrTranscribeDbQuery` | 500 | Database query failed | SQL query execution error |
| 14005 | `ErrTranscribeDbWrite` | 500 | Database write failed | SQL write/update error |
| 14010 | `ErrTranscribeUnavailable` | 503 | Service unavailable | Service not ready or shutting down |
| 14011 | `ErrTranscribeRateLimited` | 429 | Rate limit exceeded | Too many requests |
| 14012 | `ErrTranscribeQuotaExceeded` | 429 | Usage quota exceeded | Monthly quota depleted |
| 14020 | `ErrTranscribeAuthRequired` | 401 | Authentication required | Missing auth token |
| 14021 | `ErrTranscribeAuthInvalid` | 401 | Invalid authentication | Bad API key or token |
| 14022 | `ErrTranscribeAuthForbidden` | 403 | Access forbidden | Insufficient permissions |
| 14030 | `ErrTranscribeModelNotFound` | 404 | Model not found | Requested model doesn't exist |
| 14031 | `ErrTranscribeModelLoad` | 500 | Model load failed | Failed to load ML model |
| 14032 | `ErrTranscribeModelNotReady` | 503 | Model not ready | Model still loading |
| 14033 | `ErrTranscribeModelInference` | 500 | Model inference failed | ML prediction error |

### Audio Pipeline Errors (14050-14099)

| Code | Constant | HTTP | Message | Description |
|------|----------|------|---------|-------------|
| 14050 | `ErrAudioGeneral` | 500 | Audio processing error | Unspecified audio error |
| 14051 | `ErrAudioCaptureFailed` | 500 | Audio capture failed | Microphone/stream capture error |
| 14052 | `ErrAudioDeviceNotFound` | 404 | Audio device not found | No input device available |
| 14053 | `ErrAudioDeviceBusy` | 409 | Audio device busy | Device in use by another app |
| 14060 | `ErrAudioFormatUnsupported` | 400 | Unsupported audio format | Invalid audio format/codec |
| 14061 | `ErrAudioSampleRateInvalid` | 400 | Invalid sample rate | Sample rate not supported |
| 14062 | `ErrAudioChannelsInvalid` | 400 | Invalid channel count | Must be mono (1 channel) |
| 14063 | `ErrAudioBitDepthInvalid` | 400 | Invalid bit depth | Bit depth not supported |
| 14070 | `ErrAudioEncodeFailed` | 500 | Audio encoding failed | Opus/WebM/MP3 encoding error |
| 14071 | `ErrAudioDecodeFailed` | 400 | Audio decoding failed | Failed to decode input audio |
| 14072 | `ErrAudioConversionFailed` | 500 | Audio conversion failed | Format conversion error |
| 14080 | `ErrAudioTooShort` | 400 | Audio too short | Audio shorter than minimum |
| 14081 | `ErrAudioTooLong` | 400 | Audio too long | Audio exceeds maximum length |
| 14082 | `ErrAudioSilent` | 400 | Audio is silent | No speech detected in audio |
| 14083 | `ErrAudioCorrupted` | 400 | Audio data corrupted | Invalid or corrupted audio |
| 14090 | `ErrVadFailed` | 500 | VAD processing failed | Voice Activity Detection error |
| 14091 | `ErrVadModelNotLoaded` | 500 | VAD model not loaded | Silero/WebRTC VAD not ready |
| 14095 | `ErrBufferOverflow` | 500 | Audio buffer overflow | Ring buffer overrun |
| 14096 | `ErrBufferUnderflow` | 500 | Audio buffer underflow | Insufficient audio data |

### STT Provider Errors (14100-14149)

| Code | Constant | HTTP | Message | Description |
|------|----------|------|---------|-------------|
| 14100 | `ErrSttGeneral` | 500 | Transcription error | Unspecified STT error |
| 14101 | `ErrSttProviderUnavailable` | 503 | STT provider unavailable | No STT provider available |
| 14102 | `ErrSttProviderFailed` | 502 | STT provider failed | Provider returned error |
| 14103 | `ErrSttTranscriptionFailed` | 500 | Transcription failed | Processing error |
| 14104 | `ErrSttStreamFailed` | 500 | Streaming transcription failed | Real-time STT error |
| 14105 | `ErrSttLanguageUnsupported` | 400 | Language not supported | Requested language unavailable |
| 14106 | `ErrSttLanguageDetectFailed` | 500 | Language detection failed | Auto-detect failed |
| 14110 | `ErrWhisperNotLoaded` | 500 | Whisper model not loaded | Local Whisper unavailable |
| 14111 | `ErrWhisperModelInvalid` | 400 | Invalid Whisper model | Model file corrupted |
| 14112 | `ErrWhisperProcessing` | 500 | Whisper processing error | Whisper inference failed |
| 14113 | `ErrWhisperOom` | 500 | Whisper out of memory | Insufficient VRAM/RAM |
| 14120 | `ErrOpenaiSttConnection` | 502 | OpenAI connection failed | Network/API error |
| 14121 | `ErrOpenaiSttAuth` | 401 | OpenAI authentication failed | Invalid API key |
| 14122 | `ErrOpenaiSttRateLimit` | 429 | OpenAI rate limited | API rate limit hit |
| 14123 | `ErrOpenaiSttTimeout` | 504 | OpenAI request timeout | Request timed out |
| 14130 | `ErrElevenlabsSttConnection` | 502 | ElevenLabs connection failed | Network/API error |
| 14131 | `ErrElevenlabsSttAuth` | 401 | ElevenLabs auth failed | Invalid API key |
| 14132 | `ErrElevenlabsSttRateLimit` | 429 | ElevenLabs rate limited | API rate limit hit |
| 14133 | `ErrElevenlabsSttQuota` | 429 | ElevenLabs quota exceeded | Character quota depleted |
| 14140 | `ErrDiarizationFailed` | 500 | Speaker diarization failed | Speaker separation error |
| 14141 | `ErrTimestampingFailed` | 500 | Word timestamping failed | Alignment error |

### TTS Provider Errors (14150-14199)

| Code | Constant | HTTP | Message | Description |
|------|----------|------|---------|-------------|
| 14150 | `ErrTtsGeneral` | 500 | Synthesis error | Unspecified TTS error |
| 14151 | `ErrTtsProviderUnavailable` | 503 | TTS provider unavailable | No TTS provider available |
| 14152 | `ErrTtsProviderFailed` | 502 | TTS provider failed | Provider returned error |
| 14153 | `ErrTtsSynthesisFailed` | 500 | Speech synthesis failed | Processing error |
| 14154 | `ErrTtsStreamFailed` | 500 | Streaming synthesis failed | Real-time TTS error |
| 14155 | `ErrTtsVoiceNotFound` | 404 | Voice not found | Invalid voice ID |
| 14156 | `ErrTtsVoiceUnavailable` | 503 | Voice unavailable | Voice not loaded/accessible |
| 14157 | `ErrTtsTextTooLong` | 400 | Text too long | Exceeds max character limit |
| 14158 | `ErrTtsTextEmpty` | 400 | Text is empty | No text provided |
| 14159 | `ErrTtsLanguageUnsupported` | 400 | Language not supported | Voice doesn't support language |
| 14160 | `ErrXttsNotLoaded` | 500 | XTTS model not loaded | Local XTTS unavailable |
| 14161 | `ErrXttsModelInvalid` | 400 | Invalid XTTS model | Model file corrupted |
| 14162 | `ErrXttsProcessing` | 500 | XTTS processing error | XTTS inference failed |
| 14163 | `ErrXttsOom` | 500 | XTTS out of memory | Insufficient VRAM/RAM |
| 14170 | `ErrElevenlabsTtsConnection` | 502 | ElevenLabs TTS connection failed | Network error |
| 14171 | `ErrElevenlabsTtsAuth` | 401 | ElevenLabs TTS auth failed | Invalid API key |
| 14172 | `ErrElevenlabsTtsRateLimit` | 429 | ElevenLabs TTS rate limited | Rate limit hit |
| 14180 | `ErrAzureTtsConnection` | 502 | Azure TTS connection failed | Network error |
| 14181 | `ErrAzureTtsAuth` | 401 | Azure TTS auth failed | Invalid subscription key |
| 14182 | `ErrAzureTtsRegion` | 400 | Invalid Azure region | Region not supported |

### Voice Command Errors (14200-14249)

| Code | Constant | HTTP | Message | Description |
|------|----------|------|---------|-------------|
| 14200 | `ErrCmdGeneral` | 500 | Voice command error | Unspecified command error |
| 14201 | `ErrCmdNotFound` | 404 | Command not found | No matching command |
| 14202 | `ErrCmdDisabled` | 400 | Command is disabled | Command currently disabled |
| 14203 | `ErrCmdExecution` | 500 | Command execution failed | Action failed |
| 14204 | `ErrCmdWebhook` | 502 | Webhook call failed | External webhook error |
| 14205 | `ErrCmdPattern` | 400 | Invalid command pattern | Malformed trigger pattern |
| 14206 | `ErrCmdLimit` | 429 | Max custom commands reached | Command quota exceeded |
| 14207 | `ErrCmdTimeout` | 504 | Command timeout | Execution timed out |
| 14210 | `ErrWakeWordFailed` | 500 | Wake word detection failed | Wake word engine error |
| 14211 | `ErrWakeWordNotLoaded` | 500 | Wake word model not loaded | Model unavailable |
| 14220 | `ErrGrammarLoadFailed` | 500 | Grammar load failed | Command grammar error |
| 14221 | `ErrGrammarInvalid` | 400 | Invalid grammar rule | Malformed grammar |

### Voice Cloning Errors (14250-14299)

| Code | Constant | HTTP | Message | Description |
|------|----------|------|---------|-------------|
| 14250 | `ErrCloneSampleShort` | 400 | Audio sample too short | Need more audio |
| 14251 | `ErrCloneSampleLong` | 400 | Audio sample too long | Exceeds maximum |
| 14252 | `ErrCloneQuality` | 400 | Poor audio quality | Sample unsuitable |
| 14253 | `ErrCloneFormat` | 400 | Unsupported audio format | Invalid format |
| 14254 | `ErrCloneTraining` | 500 | Voice training failed | Training process error |
| 14255 | `ErrCloneLimit` | 429 | Maximum voices reached | Clone quota exceeded |
| 14256 | `ErrCloneProvider` | 502 | Provider cloning error | External provider failed |
| 14257 | `ErrVoiceNotFound` | 404 | Cloned voice not found | Invalid voice ID |
| 14260 | `ErrCloneEmbedding` | 500 | Voice embedding failed | Feature extraction error |
| 14261 | `ErrCloneConsent` | 400 | Missing consent | Voice consent not provided |

### Realtime/WebSocket Errors (14300-14349)

| Code | Constant | HTTP | Message | Description |
|------|----------|------|---------|-------------|
| 14300 | `ErrWsGeneral` | 500 | WebSocket error | Unspecified WS error |
| 14301 | `ErrWsConnectionFailed` | 500 | WebSocket connection failed | Connection error |
| 14302 | `ErrWsConnectionClosed` | 410 | WebSocket connection closed | Unexpected close |
| 14303 | `ErrWsMessageInvalid` | 400 | Invalid WebSocket message | Malformed message |
| 14304 | `ErrWsMessageTooLarge` | 413 | Message too large | Exceeds size limit |
| 14305 | `ErrWsRateLimit` | 429 | WebSocket rate limited | Too many messages |
| 14310 | `ErrRealtimeSessionInvalid` | 400 | Invalid session state | Bad session transition |
| 14311 | `ErrRealtimeNotConfigured` | 400 | Session not configured | Missing configuration |
| 14312 | `ErrRealtimeBufferFull` | 429 | Audio buffer full | Client sending too fast |
| 14320 | `ErrRealtimeTurnTimeout` | 504 | Turn detection timeout | No speech detected |
| 14321 | `ErrRealtimeInterrupt` | 400 | Interrupted | User interrupted agent |
| 14330 | `ErrProviderSwitchFailed` | 500 | Provider switch failed | Fallback failed |
| 14331 | `ErrReconnectFailed` | 500 | Reconnection failed | Auto-reconnect failed |

### Session Management Errors (14350-14399)

| Code | Constant | HTTP | Message | Description |
|------|----------|------|---------|-------------|
| 14350 | `ErrSessionGeneral` | 500 | Session error | Unspecified session error |
| 14351 | `ErrSessionNotFound` | 404 | Session not found | Invalid session ID |
| 14352 | `ErrSessionExpired` | 410 | Session expired | Session timed out |
| 14353 | `ErrSessionLimitReached` | 429 | Session limit reached | Max concurrent sessions |
| 14360 | `ErrTranscriptNotFound` | 404 | Transcript not found | No transcript for session |
| 14361 | `ErrTranscriptExportFailed` | 500 | Transcript export failed | Export error |
| 14362 | `ErrTranscriptFormat` | 400 | Invalid transcript format | Format not supported |

### Configuration Errors (14400-14449)

| Code | Constant | HTTP | Message | Description |
|------|----------|------|---------|-------------|
| 14400 | `ErrConfigGeneral` | 500 | Configuration error | Unspecified config error |
| 14401 | `ErrConfigFileNotFound` | 404 | Config file not found | Missing config file |
| 14402 | `ErrConfigParse` | 500 | Config parse error | YAML/JSON parse failed |
| 14403 | `ErrConfigValidation` | 400 | Config validation failed | Invalid config values |
| 14404 | `ErrConfigMissingKey` | 400 | Missing required config | Required key not set |
| 14410 | `ErrConfigProvider` | 400 | Invalid provider config | Provider settings invalid |
| 14411 | `ErrConfigAudio` | 400 | Invalid audio config | Audio settings invalid |
| 14412 | `ErrConfigApiKey` | 400 | Missing API key | Required API key not set |

### Provider-Specific Errors (14450-14499)

| Code | Constant | HTTP | Message | Description |
|------|----------|------|---------|-------------|
| 14450 | `ErrProviderGeneral` | 500 | Provider error | Unspecified provider error |
| 14451 | `ErrProviderNotConfigured` | 400 | Provider not configured | Missing provider config |
| 14452 | `ErrProviderInitFailed` | 500 | Provider init failed | Provider startup error |
| 14453 | `ErrProviderHealthCheck` | 503 | Provider health check failed | Provider unhealthy |
| 14460 | `ErrProviderFallback` | 503 | All providers failed | No fallback available |
| 14461 | `ErrProviderMismatch` | 400 | Provider mismatch | Wrong provider for request |

---

## Error Response Format

### HTTP Error Response

```json
{
  "success": false,
  "error": {
    "code": 14103,
    "constant": "ErrSttTranscriptionFailed",
    "message": "Transcription failed",
    "details": "Whisper model inference error: out of memory",
    "timestamp": "2026-02-03T10:30:00Z",
    "request_id": "req_abc123",
    "retryable": true
  }
}
```

### WebSocket Error Message

```json
{
  "type": "error",
  "error": {
    "code": 14104,
    "constant": "ErrSttStreamFailed",
    "message": "Streaming transcription failed",
    "details": "Connection to provider lost",
    "recoverable": true,
    "retry_after_ms": 1000
  }
}
```

---

## Error Handling Implementation

### Go Error Types

```go
type TranscribeError struct {
    Code       int
    Constant   string
    Message    string
    Details    string    `json:",omitempty"`
    Timestamp  time.Time
    RequestId  string    `json:",omitempty"`
    Retryable  bool
    Inner      error     `json:"-"` // EXEMPTED: AppError internal cause (I-2)
}

func (e *TranscribeError) Error() string {
    return fmt.Sprintf("[%d] %s: %s", e.Code, e.Message, e.Details)
}

func NewError(code int, constant, message, details string) *TranscribeError {
    return &TranscribeError{
        Code:      code,
        Constant:  constant,
        Message:   message,
        Details:   details,
        Timestamp: time.Now(),
        Retryable: isRetryable(code),
    }
}

// Error code constants
const (
    ErrSttProviderUnavailable  = 14101
    ErrSttTranscriptionFailed  = 14103
    ErrTtsVoiceNotFound        = 14155
    ErrCloneSampleShort        = 14250
    // ... etc
)
```

### HTTP Status Mapping

```go
func ErrorToHttpStatus(code int) int {
    switch {
    case code >= 14020 && code <= 14022:
        return http.StatusUnauthorized
    case code == 14011 || code == 14012 || code == 14353:
        return http.StatusTooManyRequests
    case code == 14351 || code == 14155 || code == 14257:
        return http.StatusNotFound
    case code >= 14060 && code <= 14083:
        return http.StatusBadRequest
    case code >= 14301 && code <= 14305:
        return http.StatusBadGateway
    default:
        return http.StatusInternalServerError
    }
}

func IsRetryable(code int) bool {
    switch code {
    case 14101, 14102, 14151, 14152, 14331:
        return true
    default:
        return false
    }
}
```

---

## See Also

- [Architecture](./01-architecture.md) — System design
- [API Interface](./09-api-interface.md) — REST endpoints
- [Central Error Code Registry](../../21-app/spec-management-software/06-error-management/01-error-code-registry.md) — Central registry
