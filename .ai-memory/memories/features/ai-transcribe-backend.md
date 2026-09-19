# Memory: features/ai-transcribe-backend
Updated: 2026-02-03
**Version:** 1.0.0  

## Overview
AI Transcribe CLI backend specs define a complete voice processing microservice with STT, TTS, and real-time conversation capabilities.

## Key Specs Created
- **01-architecture.md**: Component hierarchy, data flow, concurrency model, provider selection strategy
- **02-audio-pipeline.md**: Capture, VAD (Silero/WebRTC), preprocessing, encoding, ring buffer
- **03-stt-providers.md**: Whisper (local), OpenAI Realtime, ElevenLabs Scribe with streaming support
- **04-tts-providers.md**: XTTS (local), ElevenLabs, Azure TTS with voice cloning
- **05-realtime-conversation.md**: WebSocket protocol, session state machine, bidirectional voice
- **08-database-schema.md**: Split DB architecture (root + project), GORM models, FTS
- **09-api-interface.md**: REST + WebSocket endpoints, auth, rate limiting
- **10-error-codes.md**: 13000-13499 range with HTTP status mappings

## Provider Priority
- STT: Whisper (local) → OpenAI → ElevenLabs
- TTS: XTTS (local) → ElevenLabs → Azure

## Ports
- HTTP: 8030, WebSocket: 8031, Metrics: 8032
