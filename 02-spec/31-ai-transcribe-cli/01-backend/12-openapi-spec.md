# OpenAPI Specification

**Version:** 2.0.0  
**Status:** Active  
**Updated:** 2026-03-09  

---

## Overview

Complete OpenAPI 3.0 specification for the AI Transcribe CLI REST API. This specification enables API documentation generation, client SDK generation, and API testing.

**Cross-References:**
- [API Interface](./09-api-interface.md)
- [Error Codes](./10-error-codes.md)
- [Configuration](./11-configuration.md)

---

## OpenAPI Specification

```yaml
openapi: 3.0.3
info:
  title: AI Transcribe CLI API
  description: |
    Speech-to-Text (STT), Text-to-Speech (TTS), and real-time voice processing API.
    
    ## Features
    - Multiple STT providers (Whisper, OpenAI, ElevenLabs)
    - Multiple TTS providers (XTTS, ElevenLabs, Azure)
    - Real-time voice conversation via WebSocket
    - Voice cloning and custom voice management
    - Voice command processing
    
    ## Authentication
    API requests require authentication via API key in the `X-API-Key` header.
    
    ## Rate Limiting
    Default: 60 requests/minute per API key with burst of 10.
  version: 1.0.0
  contact:
    name: API Support
  license:
    name: Proprietary

servers:
  - url: http://localhost:8030/api/v1
    description: Local development
  - url: https://transcribe.example.com/api/v1
    description: Production

tags:
  - name: Health
    description: Health check endpoints
  - name: STT
    description: Speech-to-Text operations
  - name: TTS
    description: Text-to-Speech operations
  - name: Voices
    description: Voice management and cloning
  - name: Sessions
    description: Session management
  - name: Commands
    description: Voice command management
  - name: Config
    description: Configuration management

paths:
  # ===========================================================================
  # Health
  # ===========================================================================
  /health:
    get:
      tags: [Health]
      summary: Health check
      description: Returns service health status and component availability
      operationId: getHealth
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthResponse'
        '503':
          description: Service degraded
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthResponse'

  /health/ready:
    get:
      tags: [Health]
      summary: Readiness check
      description: Returns whether service is ready to accept requests
      operationId: getReadiness
      responses:
        '200':
          description: Service is ready
        '503':
          description: Service not ready

  # ===========================================================================
  # STT - Speech to Text
  # ===========================================================================
  /stt/transcribe:
    post:
      tags: [STT]
      summary: Transcribe audio
      description: |
        Transcribe audio file to text using the specified provider.
        Supports WAV, MP3, FLAC, OGG, and M4A formats.
      operationId: transcribeAudio
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: [audio]
              properties:
                audio:
                  type: string
                  format: binary
                  description: Audio file to transcribe
                provider:
                  type: string
                  enum: [whisper, openai, elevenlabs]
                  default: whisper
                language:
                  type: string
                  description: ISO 639-1 language code or "auto"
                  default: auto
                timestamps:
                  type: boolean
                  description: Include word-level timestamps
                  default: false
                diarize:
                  type: boolean
                  description: Enable speaker diarization
                  default: false
      responses:
        '200':
          description: Transcription successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TranscriptionResult'
        '400':
          $ref: '#/components/responses/BadRequest'
        '413':
          $ref: '#/components/responses/PayloadTooLarge'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'
        '500':
          $ref: '#/components/responses/InternalError'

  /stt/providers:
    get:
      tags: [STT]
      summary: List STT providers
      description: Returns available STT providers and their status
      operationId: listSttProviders
      responses:
        '200':
          description: Provider list
          content:
            application/json:
              schema:
                type: object
                properties:
                  providers:
                    type: array
                    items:
                      $ref: '#/components/schemas/ProviderInfo'

  /stt/languages:
    get:
      tags: [STT]
      summary: List supported languages
      description: Returns languages supported by each STT provider
      operationId: listSttLanguages
      parameters:
        - name: provider
          in: query
          schema:
            type: string
            enum: [whisper, openai, elevenlabs]
      responses:
        '200':
          description: Language list
          content:
            application/json:
              schema:
                type: object
                properties:
                  languages:
                    type: array
                    items:
                      $ref: '#/components/schemas/LanguageInfo'

  # ===========================================================================
  # TTS - Text to Speech
  # ===========================================================================
  /tts/synthesize:
    post:
      tags: [TTS]
      summary: Synthesize speech
      description: Convert text to speech audio using the specified voice and provider
      operationId: synthesizeSpeech
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SynthesizeRequest'
      responses:
        '200':
          description: Audio generated successfully
          content:
            audio/wav:
              schema:
                type: string
                format: binary
            audio/mpeg:
              schema:
                type: string
                format: binary
        '400':
          $ref: '#/components/responses/BadRequest'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'
        '500':
          $ref: '#/components/responses/InternalError'

  /tts/synthesize/stream:
    post:
      tags: [TTS]
      summary: Stream synthesized speech
      description: Stream audio chunks as they are generated
      operationId: streamSynthesizeSpeech
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SynthesizeRequest'
      responses:
        '200':
          description: Audio stream
          content:
            audio/wav:
              schema:
                type: string
                format: binary

  /tts/providers:
    get:
      tags: [TTS]
      summary: List TTS providers
      description: Returns available TTS providers and their status
      operationId: listTtsProviders
      responses:
        '200':
          description: Provider list
          content:
            application/json:
              schema:
                type: object
                properties:
                  providers:
                    type: array
                    items:
                      $ref: '#/components/schemas/ProviderInfo'

  # ===========================================================================
  # Voices
  # ===========================================================================
  /voices:
    get:
      tags: [Voices]
      summary: List voices
      description: List all available voices (built-in and cloned)
      operationId: listVoices
      parameters:
        - name: provider
          in: query
          schema:
            type: string
        - name: type
          in: query
          schema:
            type: string
            enum: [builtin, cloned, all]
            default: all
        - name: language
          in: query
          schema:
            type: string
      responses:
        '200':
          description: Voice list
          content:
            application/json:
              schema:
                type: object
                properties:
                  voices:
                    type: array
                    items:
                      $ref: '#/components/schemas/Voice'

  /voices/{voiceId}:
    get:
      tags: [Voices]
      summary: Get voice details
      operationId: getVoice
      parameters:
        - $ref: '#/components/parameters/voiceId'
      responses:
        '200':
          description: Voice details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Voice'
        '404':
          $ref: '#/components/responses/NotFound'

    delete:
      tags: [Voices]
      summary: Delete cloned voice
      operationId: deleteVoice
      parameters:
        - $ref: '#/components/parameters/voiceId'
      responses:
        '200':
          description: Voice deleted
          content:
            application/json:
              schema:
                type: object
                properties:
                  deleted:
                    type: boolean
        '404':
          $ref: '#/components/responses/NotFound'

  /voices/{voiceId}/settings:
    patch:
      tags: [Voices]
      summary: Update voice settings
      operationId: updateVoiceSettings
      parameters:
        - $ref: '#/components/parameters/voiceId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/VoiceSettings'
      responses:
        '200':
          description: Settings updated
          content:
            application/json:
              schema:
                type: object
                properties:
                  updated:
                    type: boolean
        '404':
          $ref: '#/components/responses/NotFound'

  /voices/clone/instant:
    post:
      tags: [Voices]
      summary: Create instant voice clone
      description: Clone a voice from a short audio sample (3-30 seconds)
      operationId: instantCloneVoice
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: [audio, name]
              properties:
                audio:
                  type: string
                  format: binary
                name:
                  type: string
                  maxLength: 100
                description:
                  type: string
                  maxLength: 500
                language:
                  type: string
                  default: en
      responses:
        '201':
          description: Voice created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Voice'
        '400':
          $ref: '#/components/responses/BadRequest'
        '422':
          $ref: '#/components/responses/UnprocessableEntity'

  /voices/clone/professional:
    post:
      tags: [Voices]
      summary: Create professional voice clone
      description: High-quality voice clone from multiple audio samples
      operationId: professionalCloneVoice
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: [samples, name]
              properties:
                samples:
                  type: array
                  items:
                    type: string
                    format: binary
                  minItems: 5
                  maxItems: 100
                transcripts:
                  type: string
                  description: JSON array of transcripts
                name:
                  type: string
                training_tier:
                  type: string
                  enum: [basic, standard, premium]
                  default: standard
      responses:
        '202':
          description: Training started
          content:
            application/json:
              schema:
                type: object
                properties:
                  VoiceId:
                    type: string
                  Status:
                    type: string
                    enum: [training]
                  EstimatedTime:
                    type: integer
                    description: Estimated training time in seconds

  /voices/{voiceId}/status:
    get:
      tags: [Voices]
      summary: Get voice training status
      operationId: getVoiceStatus
      parameters:
        - $ref: '#/components/parameters/voiceId'
      responses:
        '200':
          description: Training status
          content:
            application/json:
              schema:
                type: object
                properties:
                  Status:
                    type: string
                    enum: [training, ready, failed]
                  Progress:
                    type: number
                    format: float
                    minimum: 0
                    maximum: 1
                  EstimatedRemaining:
                    type: integer

  # ===========================================================================
  # Sessions
  # ===========================================================================
  /sessions:
    get:
      tags: [Sessions]
      summary: List sessions
      operationId: listSessions
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [active, completed, all]
            default: all
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: Session list
          content:
            application/json:
              schema:
                type: object
                properties:
                  sessions:
                    type: array
                    items:
                      $ref: '#/components/schemas/Session'
                  total:
                    type: integer

    post:
      tags: [Sessions]
      summary: Create session
      operationId: createSession
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateSessionRequest'
      responses:
        '201':
          description: Session created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Session'

  /sessions/{sessionId}:
    get:
      tags: [Sessions]
      summary: Get session
      operationId: getSession
      parameters:
        - $ref: '#/components/parameters/sessionId'
      responses:
        '200':
          description: Session details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Session'
        '404':
          $ref: '#/components/responses/NotFound'

    delete:
      tags: [Sessions]
      summary: Delete session
      operationId: deleteSession
      parameters:
        - $ref: '#/components/parameters/sessionId'
      responses:
        '200':
          description: Session deleted

  /sessions/{sessionId}/transcript:
    get:
      tags: [Sessions]
      summary: Get session transcript
      operationId: getSessionTranscript
      parameters:
        - $ref: '#/components/parameters/sessionId'
        - name: format
          in: query
          schema:
            type: string
            enum: [text, json, srt, vtt]
            default: json
      responses:
        '200':
          description: Transcript
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Transcript'
            text/plain:
              schema:
                type: string
            text/vtt:
              schema:
                type: string

  # ===========================================================================
  # Commands
  # ===========================================================================
  /commands:
    get:
      tags: [Commands]
      summary: List voice commands
      operationId: listCommands
      responses:
        '200':
          description: Command list
          content:
            application/json:
              schema:
                type: object
                properties:
                  commands:
                    type: array
                    items:
                      $ref: '#/components/schemas/VoiceCommand'

    post:
      tags: [Commands]
      summary: Create custom command
      operationId: createCommand
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateCommandRequest'
      responses:
        '201':
          description: Command created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/VoiceCommand'

  /commands/{commandId}:
    patch:
      tags: [Commands]
      summary: Update command
      operationId: updateCommand
      parameters:
        - $ref: '#/components/parameters/commandId'
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateCommandRequest'
      responses:
        '200':
          description: Command updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/VoiceCommand'

    delete:
      tags: [Commands]
      summary: Delete command
      operationId: deleteCommand
      parameters:
        - $ref: '#/components/parameters/commandId'
      responses:
        '200':
          description: Command deleted

  /commands/test:
    post:
      tags: [Commands]
      summary: Test command detection
      operationId: testCommand
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [transcript]
              properties:
                transcript:
                  type: string
      responses:
        '200':
          description: Detection result
          content:
            application/json:
              schema:
                type: object
                properties:
                  detected:
                    type: boolean
                  command_id:
                    type: string
                  confidence:
                    type: number

  # ===========================================================================
  # Config
  # ===========================================================================
  /config:
    get:
      tags: [Config]
      summary: Get configuration
      operationId: getConfig
      responses:
        '200':
          description: Current configuration
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Config'

    patch:
      tags: [Config]
      summary: Update configuration
      operationId: updateConfig
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ConfigUpdate'
      responses:
        '200':
          description: Configuration updated
          content:
            application/json:
              schema:
                type: object
                properties:
                  updated:
                    type: boolean
                  requires_restart:
                    type: boolean

# =============================================================================
# Components
# =============================================================================
components:
  parameters:
    voiceId:
      name: voiceId
      in: path
      required: true
      schema:
        type: string
    sessionId:
      name: sessionId
      in: path
      required: true
      schema:
        type: string
    commandId:
      name: commandId
      in: path
      required: true
      schema:
        type: string

  schemas:
    HealthResponse:
      type: object
      properties:
        status:
          type: string
          enum: [healthy, degraded, unhealthy]
        version:
          type: string
        uptime:
          type: integer
        components:
          type: object
          additionalProperties:
            type: object
            properties:
              status:
                type: string
              latency_ms:
                type: integer

    TranscriptionResult:
      type: object
      properties:
        text:
          type: string
        language:
          type: string
        confidence:
          type: number
        duration:
          type: number
        words:
          type: array
          items:
            type: object
            properties:
              word:
                type: string
              start:
                type: number
              end:
                type: number
              confidence:
                type: number
        speakers:
          type: array
          items:
            type: object
            properties:
              id:
                type: string
              segments:
                type: array
                items:
                  type: object

    SynthesizeRequest:
      type: object
      required: [text]
      properties:
        text:
          type: string
          maxLength: 5000
        voice_id:
          type: string
        provider:
          type: string
          enum: [xtts, elevenlabs, azure]
        language:
          type: string
          default: en
        speed:
          type: number
          minimum: 0.25
          maximum: 4.0
          default: 1.0
        output_format:
          type: string
          enum: [wav, mp3, ogg]
          default: wav

    ProviderInfo:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        status:
          type: string
          enum: [available, unavailable, degraded]
        features:
          type: array
          items:
            type: string

    LanguageInfo:
      type: object
      properties:
        code:
          type: string
        name:
          type: string
        native_name:
          type: string

    Voice:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        description:
          type: string
        provider:
          type: string
        type:
          type: string
          enum: [builtin, cloned]
        languages:
          type: array
          items:
            type: string
        preview_url:
          type: string
        settings:
          $ref: '#/components/schemas/VoiceSettings'

    VoiceSettings:
      type: object
      properties:
        stability:
          type: number
          minimum: 0
          maximum: 1
        similarity_boost:
          type: number
          minimum: 0
          maximum: 1
        style:
          type: number
          minimum: 0
          maximum: 1
        speaker_boost:
          type: boolean

    Session:
      type: object
      properties:
        id:
          type: string
        mode:
          type: string
        status:
          type: string
        created_at:
          type: string
          format: date-time
        duration:
          type: integer
        stt_provider:
          type: string
        tts_provider:
          type: string

    CreateSessionRequest:
      type: object
      properties:
        mode:
          type: string
          enum: [transcription, conversation, dictation]
          default: transcription
        stt_provider:
          type: string
        tts_provider:
          type: string
        voice_id:
          type: string

    Transcript:
      type: object
      properties:
        session_id:
          type: string
        segments:
          type: array
          items:
            type: object
            properties:
              speaker:
                type: string
              text:
                type: string
              start:
                type: number
              end:
                type: number

    VoiceCommand:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        patterns:
          type: array
          items:
            type: string
        action_type:
          type: string
        enabled:
          type: boolean

    CreateCommandRequest:
      type: object
      required: [name, patterns, action_type]
      properties:
        name:
          type: string
        patterns:
          type: array
          items:
            type: string
        action_type:
          type: string
          enum: [webhook, command, macro, delegate]
        action_params:
          type: object
        response_text:
          type: string

    UpdateCommandRequest:
      type: object
      properties:
        name:
          type: string
        patterns:
          type: array
          items:
            type: string
        enabled:
          type: boolean

    Config:
      type: object
      properties:
        stt:
          type: object
        tts:
          type: object
        audio:
          type: object
        realtime:
          type: object

    ConfigUpdate:
      type: object
      additionalProperties: true

    Error:
      type: object
      required: [code, message]
      properties:
        code:
          type: integer
        constant:
          type: string
        message:
          type: string
        details:
          type: object

  responses:
    BadRequest:
      description: Bad request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    UnprocessableEntity:
      description: Validation error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    PayloadTooLarge:
      description: File too large
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    InternalError:
      description: Internal server error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'

  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

security:
  - ApiKeyAuth: []
```

---

## WebSocket API

WebSocket endpoints are not covered by OpenAPI but follow this pattern:

```yaml
# WebSocket: Real-time transcription
ws://localhost:8031/ws/transcribe
Messages:
  # Client → Server
  - type: audio_chunk
    data: [base64 encoded audio]
  - type: config
    provider: whisper
    language: en
  
  # Server → Client
  - type: partial
    text: "Hello wo..."
  - type: final
    text: "Hello world"
    confidence: 0.95

# WebSocket: Real-time conversation
ws://localhost:8031/ws/conversation
Messages:
  # Client → Server
  - type: audio_chunk
    data: [base64 audio]
  - type: text_input
    text: "Hello"
  
  # Server → Client
  - type: user_transcript
    text: "How are you?"
  - type: agent_response
    text: "I'm doing well, thanks!"
  - type: audio_response
    data: [base64 audio]
```

---

## SDK Generation

Generate client SDKs from this specification:

```bash
# TypeScript
npx @openapitools/openapi-generator-cli generate \
  -i openapi.yaml \
  -g typescript-axios \
  -o ./sdk/typescript

# Go
openapi-generator generate \
  -i openapi.yaml \
  -g go \
  -o ./sdk/go

# Python
openapi-generator generate \
  -i openapi.yaml \
  -g python \
  -o ./sdk/python
```

---

## Related Specs

- [API Interface](./09-api-interface.md)
- [Error Codes](./10-error-codes.md)
- [Realtime Conversation](./05-realtime-conversation.md)
