# AI Transcribe CLI: API Interface

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

AI Transcribe CLI exposes HTTP REST and WebSocket APIs for transcription and synthesis operations.

---

## Base Configuration

| Setting | Value |
|---------|-------|
| HTTP Port | 8030 |
| WebSocket Port | 8031 |
| Metrics Port | 8032 |
| Base Path | `/api/v1` |
| Content-Type | `application/json` |
| Audio Types | `audio/wav`, `audio/webm`, `audio/mpeg`, `audio/ogg` |

---

## Authentication

```http
Authorization: Bearer <api-key>
X-Project-Id: <project-id>
```

For internal service-to-service calls (e.g., from AI Bridge):

```http
X-Service-Key: <internal-key>
X-Service-Name: ai-bridge
```

---

## REST Endpoints

### Health & Status

#### GET /health

Health check endpoint.

**Response:**
```json
{
  "Status": "healthy",
  "Version": "1.0.0",
  "Uptime": 3600,
  "Providers": {
    "Stt": {
      "Whisper": "healthy",
      "OpenAI": "healthy",
      "ElevenLabs": "degraded"
    },
    "Tts": {
      "XTTS": "healthy",
      "ElevenLabs": "healthy"
    }
  }
}
```

#### GET /status

Detailed system status.

**Response:**
```json
{
  "ActiveSessions": 5,
  "MaxSessions": 10,
  "MemoryUsageMb": 1024,
  "ModelsLoaded": ["whisper-base-en", "xtts-v2", "silero-vad"],
  "QueuedJobs": 3,
  "AverageLatencyMs": 45
}
```

---

### Speech-to-Text

#### POST /transcribe

Transcribe audio file or raw audio data.

**Request (multipart/form-data):**
```
file: <audio file>
language: en (optional, default: auto)
provider: whisper (optional)
diarize: true (optional)
WordTimestamps: true (optional)
TagAudioEvents: true (optional)
```

**Request (application/json with base64):**
```json
{
  "Audio": "base64-encoded-audio-data",
  "AudioFormat": "webm",
  "SampleRate": 16000,
  "Language": "en",
  "Provider": "whisper",
  "Options": {
    "Diarize": true,
    "WordTimestamps": true,
    "TagAudioEvents": true
  }
}
```

**Response:**
```json
{
  "Id": "tr_abc123",
  "Text": "Hello, this is a transcription test.",
  "Language": "en",
  "LanguageConfidence": 0.98,
  "Duration": 5.2,
  "Provider": "whisper",
  "ProcessingTimeMs": 850,
  "Words": [
    {"Text": "Hello", "Start": 0.0, "End": 0.5, "Confidence": 0.95},
    {"Text": "this", "Start": 0.6, "End": 0.8, "Confidence": 0.92},
    {"Text": "is", "Start": 0.85, "End": 0.95, "Confidence": 0.98}
  ],
  "Segments": [
    {
      "Id": 0,
      "Text": "Hello, this is a transcription test.",
      "Start": 0.0,
      "End": 5.2,
      "Speaker": "SPEAKER_00"
    }
  ],
  "Speakers": [
    {"Id": "SPEAKER_00", "Label": "Speaker 1"}
  ],
  "AudioEvents": [
    {"Type": "silence", "Start": 5.2, "End": 5.5}
  ]
}
```

#### POST /transcribe/batch

Submit multiple files for batch transcription.

**Request:**
```json
{
  "Jobs": [
    {
      "Id": "job_1",
      "AudioPath": "/path/to/audio1.mp3",
      "Language": "en"
    },
    {
      "Id": "job_2", 
      "AudioPath": "/path/to/audio2.mp3",
      "Language": "es"
    }
  ],
  "Options": {
    "Provider": "whisper",
    "WordTimestamps": true
  },
  "CallbackUrl": "https://example.com/webhook"
}
```

**Response:**
```json
{
  "BatchId": "batch_xyz789",
  "JobCount": 2,
  "Status": "queued",
  "EstimatedCompletionSeconds": 120
}
```

#### GET /transcribe/batch/{batchId}

Get batch transcription status.

**Response:**
```json
{
  "BatchId": "batch_xyz789",
  "Status": "processing",
  "Progress": {
    "Total": 2,
    "Completed": 1,
    "Failed": 0,
    "Processing": 1
  },
  "Results": [
    {
      "JobId": "job_1",
      "Status": "completed",
      "TranscriptId": "tr_abc123"
    }
  ]
}
```

---

### Text-to-Speech

#### POST /synthesize

Generate speech from text.

**Request:**
```json
{
  "Text": "Hello, welcome to our application.",
  "VoiceId": "JBFqnCBsd6RMkjVDRZzb",
  "Provider": "elevenlabs",
  "ModelId": "eleven_multilingual_v2",
  "OutputFormat": "mp3",
  "SampleRate": 44100,
  "Settings": {
    "Speed": 1.0,
    "Stability": 0.5,
    "SimilarityBoost": 0.75,
    "Style": 0.3
  }
}
```

**Response:**
```
Content-Type: audio/mpeg
Content-Length: 45678
X-Duration: 3.5
X-Character-Count: 38
X-Processing-Time-Ms: 1200

<binary audio data>
```

#### POST /synthesize/stream

Stream audio generation.

**Request:** Same as `/synthesize`

**Response:** Chunked transfer encoding with audio data.

#### POST /synthesize/batch

Generate audio for multiple texts.

**Request:**
```json
{
  "Items": [
    {"Id": "1", "Text": "First sentence."},
    {"Id": "2", "Text": "Second sentence."}
  ],
  "VoiceId": "en_male_1",
  "Provider": "xtts",
  "OutputFormat": "mp3",
  "OutputDirectory": "/output/audio"
}
```

**Response:**
```json
{
  "BatchId": "tts_batch_123",
  "Status": "processing",
  "ItemCount": 2
}
```

---

### Voice Management

#### GET /voices

List available voices.

**Query Parameters:**
- `Provider` - Filter by provider
- `Language` - Filter by language
- `Gender` - Filter by gender
- `IncludeCloned` - Include cloned voices (default: true)

**Response:**
```json
{
  "Voices": [
    {
      "Id": "JBFqnCBsd6RMkjVDRZzb",
      "Name": "George",
      "Provider": "elevenlabs",
      "Language": "en",
      "Gender": "male",
      "Description": "Warm, conversational voice",
      "PreviewUrl": "https://...",
      "IsCloned": false
    },
    {
      "Id": "xtts-en-female-1",
      "Name": "XTTS English Female",
      "Provider": "xtts",
      "Language": "en",
      "Gender": "female",
      "IsCloned": false
    }
  ],
  "Total": 2
}
```

#### GET /voices/{voiceId}

Get voice details.

**Response:**
```json
{
  "Id": "JBFqnCBsd6RMkjVDRZzb",
  "Name": "George",
  "Provider": "elevenlabs",
  "Language": "en",
  "Gender": "male",
  "Description": "Warm, conversational voice",
  "UseCase": "narration",
  "Settings": {
    "Stability": 0.5,
    "SimilarityBoost": 0.75
  },
  "PreviewUrl": "https://..."
}
```

#### POST /voices/clone

Clone a voice from samples.

**Request (multipart/form-data):**
```
name: My Cloned Voice
description: Custom voice for narration
samples[]: <audio file 1>
samples[]: <audio file 2>
provider: xtts (optional, default based on availability)
```

**Response:**
```json
{
  "Id": "voice_cloned_123",
  "Name": "My Cloned Voice",
  "Provider": "xtts",
  "IsCloned": true,
  "CreatedAt": "2026-02-03T10:30:00Z"
}
```

#### DELETE /voices/{voiceId}

Delete a cloned voice.

**Response:**
```json
{
  "Success": true,
  "Message": "Voice deleted successfully"
}
```

---

### Sessions & History

#### GET /sessions

List transcription/TTS sessions.

**Query Parameters:**
- `ProjectId` - Filter by project
- `Type` - Filter by type (transcription, tts, conversation)
- `Status` - Filter by status
- `Limit` - Results per page (default: 50)
- `Offset` - Pagination offset

**Response:**
```json
{
  "Sessions": [
    {
      "Id": "session_abc",
      "ProjectId": "proj_123",
      "Type": "transcription",
      "Status": "completed",
      "Provider": "whisper",
      "TotalDuration": 125.5,
      "StartedAt": "2026-02-03T09:00:00Z",
      "CompletedAt": "2026-02-03T09:02:30Z"
    }
  ],
  "Total": 1,
  "Limit": 50,
  "Offset": 0
}
```

#### GET /sessions/{sessionId}/transcripts

Get transcripts for a session.

**Response:**
```json
{
  "Transcripts": [
    {
      "Id": "tr_abc123",
      "Text": "Hello, this is...",
      "Language": "en",
      "Duration": 5.2,
      "CreatedAt": "2026-02-03T09:00:05Z"
    }
  ],
  "Total": 1
}
```

#### GET /transcripts/{transcriptId}

Get full transcript with all details.

**Response:**
```json
{
  "Id": "tr_abc123",
  "SessionId": "session_abc",
  "Text": "Hello, this is a transcription test.",
  "Language": "en",
  "Duration": 5.2,
  "Words": [...],
  "Segments": [...],
  "Speakers": [...],
  "AudioEvents": [...],
  "CreatedAt": "2026-02-03T09:00:05Z"
}
```

#### PATCH /transcripts/{transcriptId}

Update transcript (corrections).

**Request:**
```json
{
  "Corrections": [
    {
      "WordIndex": 5,
      "OriginalText": "test",
      "CorrectedText": "testing"
    }
  ]
}
```

---

### Models

#### GET /models

List available models.

**Response:**
```json
{
  "Models": [
    {
      "Id": "whisper-base-en",
      "Name": "Whisper Base English",
      "Type": "stt",
      "Provider": "whisper",
      "Status": "available",
      "FileSize": 147951465
    }
  ]
}
```

#### POST /models/{modelId}/load

Load a model into memory.

**Response:**
```json
{
  "ModelId": "whisper-medium",
  "Status": "loaded",
  "LoadTimeMs": 5200,
  "MemoryUsageMb": 769
}
```

#### POST /models/{modelId}/unload

Unload a model from memory.

---

### Configuration

#### GET /config

Get current configuration.

**Response:**
```json
{
  "DefaultSttProvider": "whisper",
  "DefaultTtsProvider": "xtts",
  "EnableFallback": true,
  "MaxConcurrentSessions": 10,
  "DefaultLanguage": "en"
}
```

#### PATCH /config

Update configuration.

**Request:**
```json
{
  "DefaultSttProvider": "openai",
  "MaxConcurrentSessions": 15
}
```

---

## WebSocket Endpoints

### WS /ws/transcribe

Real-time streaming transcription.

#### Connection

```javascript
const ws = new WebSocket('ws://localhost:8031/ws/transcribe');
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'configure',
    config: {
      language: 'en',
      provider: 'whisper',
      enableVad: true,
      wordTimestamps: true
    }
  }));
};
```

#### Client Messages

**Audio Chunk:**
```json
{
  "Type": "audio",
  "Audio": "base64-encoded-pcm-data",
  "SampleRate": 16000,
  "Timestamp": 1706954400000
}
```

**Control:**
```json
{
  "Type": "control",
  "Action": "flush"  // or "stop", "reset"
}
```

#### Server Messages

**Partial Transcript:**
```json
{
  "Type": "partial",
  "Text": "Hello, this is",
  "Confidence": 0.85,
  "Timestamp": 1706954400500
}
```

**Committed Transcript:**
```json
{
  "Type": "committed",
  "Id": "tr_abc123",
  "Text": "Hello, this is a transcription test.",
  "Words": [
    {"Text": "Hello", "Start": 0.0, "End": 0.5}
  ],
  "Timestamp": 1706954401000
}
```

**Audio Event:**
```json
{
  "Type": "audioEvent",
  "EventType": "speech_start",
  "Timestamp": 1706954400100
}
```

**Error:**
```json
{
  "Type": "error",
  "Code": 14103,
  "Message": "Transcription failed",
  "Details": "..."
}
```

---

### WS /ws/conversation

Real-time voice conversation (bidirectional).

#### Connection

```javascript
const ws = new WebSocket('ws://localhost:8031/ws/conversation');
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'configure',
    config: {
      sttProvider: 'whisper',
      ttsProvider: 'xtts',
      voiceId: 'en_male_1',
      language: 'en'
    }
  }));
};
```

#### Client Messages

**Audio Input:**
```json
{
  "Type": "audio",
  "Audio": "base64-encoded-pcm-data"
}
```

**Text Input (for TTS):**
```json
{
  "Type": "text",
  "Text": "Hello, how are you?"
}
```

#### Server Messages

**Transcription:**
```json
{
  "Type": "transcription",
  "Text": "I said something",
  "IsFinal": true
}
```

**Audio Response (TTS output):**
```json
{
  "Type": "audioResponse",
  "Audio": "base64-encoded-audio",
  "Text": "Hello, how are you?",
  "Duration": 2.5
}
```

---

### WS /ws/tts/stream

Streaming TTS synthesis.

#### Client Message

```json
{
  "Type": "synthesize",
  "Text": "This is a long text that will be streamed...",
  "VoiceId": "en_female_1",
  "OutputFormat": "opus"
}
```

#### Server Messages

**Audio Chunks:**
```json
{
  "Type": "audioChunk",
  "Index": 0,
  "Audio": "base64-encoded-chunk",
  "IsFinal": false
}
```

**Completion:**
```json
{
  "Type": "complete",
  "TotalChunks": 15,
  "TotalDuration": 12.5
}
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "Error": {
    "Code": 14103,
    "Message": "Transcription failed",
    "Details": "Model not loaded",
    "RequestId": "req_xyz789"
  }
}
```

### HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 413 | Audio Too Large |
| 422 | Unprocessable Entity |
| 429 | Rate Limited |
| 500 | Internal Error |
| 503 | Service Unavailable |

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| /transcribe | 60/min |
| /synthesize | 100/min |
| /voices/clone | 5/hour |
| WebSocket | 10 connections |

Rate limit headers:
```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1706954460
```

---

## See Also

- [Architecture](./01-architecture.md) — System design
- [Error Codes](./10-error-codes.md) — Full error registry
- [OpenAPI Spec](./12-openapi-spec.md) — OpenAPI definition
