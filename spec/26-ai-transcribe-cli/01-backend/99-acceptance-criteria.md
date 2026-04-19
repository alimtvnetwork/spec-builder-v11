# AI Transcribe CLI: Acceptance Criteria

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  
**Format:** GIVEN/WHEN/THEN (E2E-test-ready)

---

## Architecture (01-architecture.md)

### AT-01: Audio Pipeline

**GIVEN** an audio file (WAV, MP3, FLAC, OGG)  
**WHEN** `aitranscribe transcribe --file recording.mp3` is executed  
**THEN** the audio is processed through the pipeline (format detection → preprocessing → STT)  
**AND** the transcription is returned with timestamps per segment

**Edge Cases:**
- **GIVEN** an unsupported audio format (e.g., MIDI) **WHEN** transcription is attempted **THEN** a clear error lists supported formats
- **GIVEN** the audio file is corrupted **WHEN** processing starts **THEN** a decode error is returned with the byte offset of corruption

---

## STT Providers (03-stt-providers.md)

### AT-02: Provider Switching

**GIVEN** multiple STT providers are configured (Whisper, Google, Azure)  
**WHEN** the primary provider fails  
**THEN** the system automatically falls back to the next provider  
**AND** the fallback is logged with provider name and error reason

### AT-03: Whisper Local Transcription

**GIVEN** a Whisper model is downloaded locally  
**WHEN** transcription runs  
**THEN** audio is processed entirely on-device  
**AND** no data is sent to external services

---

## TTS Providers (04-tts-providers.md)

### AT-04: Text-to-Speech

**GIVEN** text content and a selected voice  
**WHEN** `aitranscribe speak --text "Hello world" --voice en-US-1` is executed  
**THEN** audio is generated and saved to the output file  
**AND** the audio format matches the configured output format (WAV/MP3)

---

## Real-Time Conversation (05-realtime-conversation.md)

### AT-05: Live Transcription

**GIVEN** a microphone input is available  
**WHEN** `aitranscribe listen` is executed  
**THEN** audio is captured and transcribed in real-time  
**AND** partial transcriptions are streamed via WebSocket as they become available

**Edge Cases:**
- **GIVEN** no microphone is detected **WHEN** listen mode starts **THEN** a device error is returned listing available audio devices
- **GIVEN** ambient noise exceeds the configured threshold **WHEN** silence detection runs **THEN** the noise floor is adjusted and a warning is logged
- **GIVEN** the OS denies microphone permission (e.g., macOS privacy settings) **WHEN** audio capture is attempted **THEN** a clear error with OS-specific instructions to grant permission is returned

---

## Voice Commands (06-voice-commands.md)

### AT-06: Command Recognition

**GIVEN** voice command mode is active  
**WHEN** the user speaks a registered command (e.g., "search for Go patterns")  
**THEN** the command is recognized and dispatched to the appropriate handler  
**AND** the recognition confidence score is included in the response

**Edge Cases:**
- **GIVEN** the confidence score is below the threshold (e.g., <0.7) **WHEN** a command is detected **THEN** the user is prompted for confirmation before execution

---

## Voice Cloning (07-voice-cloning.md)

### AT-07: Voice Profile Creation

**GIVEN** a reference audio sample (≥30 seconds)  
**WHEN** `aitranscribe voice clone --sample voice.wav --name my-voice` is executed  
**THEN** a voice profile is created and stored  
**AND** subsequent TTS requests can use the cloned voice via `--voice my-voice`

**Edge Cases:**
- **GIVEN** the reference audio is shorter than 30 seconds **WHEN** cloning is attempted **THEN** a validation error is returned specifying the minimum duration requirement

---

## Model Download (13-model-download.md)

### AT-08: Model Management

**GIVEN** a model identifier (e.g., "whisper-large-v3")  
**WHEN** `aitranscribe model pull whisper-large-v3` is executed  
**THEN** the model is downloaded with progress reporting  
**AND** integrity is verified via SHA256 checksum

**Edge Cases:**
- **GIVEN** the checksum doesn't match **WHEN** verification fails **THEN** the corrupted file is deleted and re-download is suggested
- **GIVEN** error codes at 14200+ **WHEN** a collision with Voice Commands occurs **THEN** the correct range per the Phase 17 audit is used

---

## Database Schema (08-database-schema.md)

### AT-09: Schema Migration

**GIVEN** AI Transcribe starts  
**WHEN** database initialization runs  
**THEN** all tables are created via GORM AutoMigrate with PascalCase columns

---

## Settings, Observability, Reset (15-17)

### AT-10: Settings Service

**GIVEN** the AI Transcribe settings service  
**WHEN** audio processing settings are modified  
**THEN** changes follow the seedable config golden rule with error codes 14300–14307

### AT-11: Health Check

**GIVEN** AI Transcribe is running  
**WHEN** GET `/health/ready` is called  
**THEN** model status, audio device availability, and provider connectivity are returned

### AT-12: Reset API

**GIVEN** a reset request with scope `transcriptions`  
**WHEN** confirmed within 5 minutes  
**THEN** all transcription data and voice profiles are deleted  
**AND** downloaded models and settings are preserved  
**AND** error codes 14350–14356 are used

---

*Wave 6 — Batch 4 (Patched): AI Transcribe acceptance criteria with added OS-level microphone permission denial, voice cloning minimum duration validation, and error code collision awareness.*
