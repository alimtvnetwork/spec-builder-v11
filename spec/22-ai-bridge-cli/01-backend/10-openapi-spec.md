# AI Bridge CLI: OpenAPI Specification

**Version:** 5.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

This document defines the OpenAPI/Swagger specification for AI Bridge CLI's REST API. The spec enables automatic documentation generation, client SDK generation, and API testing.

---

## Swagger Endpoints

| Endpoint | Format | Description |
|----------|--------|-------------|
| `GET /swagger/` | HTML | Swagger UI (interactive documentation) |
| `GET /swagger.yaml` | YAML | OpenAPI 3.0 specification |
| `GET /swagger.json` | JSON | OpenAPI 3.0 specification |
| `GET /redoc/` | HTML | ReDoc alternative UI |

---

## OpenAPI Specification

```yaml
openapi: "3.0.3"
info:
  title: AI Bridge CLI API
  version: "2.0.0"
  description: |
    Unified LLM interface with multi-modal support including text generation,
    image/video generation, voice processing, and RAG memory.
  contact:
    name: AI Bridge CLI Support
  license:
    name: MIT

servers:
  - url: http://localhost:5040/api/v1
    description: Local daemon (default)
  - url: http://{host}:{port}/api/v1
    description: Custom server
    variables:
      host:
        default: localhost
      port:
        default: "8089"

tags:
  - name: Generation
    description: Text generation endpoints
  - name: Chat
    description: Chat session management
  - name: RAG
    description: RAG memory management
  - name: Models
    description: Model category management
  - name: Backends
    description: Backend server management
  - name: Voice
    description: Speech-to-text and text-to-speech
  - name: Image
    description: Image generation and understanding
  - name: Video
    description: Video generation
  - name: Agentic
    description: Long-chain execution
  - name: Files
    description: File history management

paths:
  /generate:
    post:
      tags: [Generation]
      summary: Generate text
      description: Synchronous text generation with category-based model selection
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GenerateRequest'
      responses:
        '200':
          description: Generated text
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GenerateResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '500':
          $ref: '#/components/responses/InternalError'

  /generate/stream:
    post:
      tags: [Generation]
      summary: Stream text generation
      description: Server-Sent Events streaming generation
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GenerateRequest'
      responses:
        '200':
          description: SSE stream
          content:
            text/event-stream:
              schema:
                type: string

  /chat/sessions:
    post:
      tags: [Chat]
      summary: Create chat session
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
                $ref: '#/components/schemas/ChatSession'
    get:
      tags: [Chat]
      summary: List chat sessions
      parameters:
        - name: appName
          in: query
          schema:
            type: string
          description: Filter by application name
        - name: limit
          in: query
          schema:
            type: integer
            default: 50
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: List of sessions
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SessionList'

  /chat/sessions/{sessionId}/messages:
    post:
      tags: [Chat]
      summary: Send message to session
      description: Sends a message and streams the assistant response
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SendMessageRequest'
      responses:
        '200':
          description: SSE stream of response
          content:
            text/event-stream:
              schema:
                type: string
    get:
      tags: [Chat]
      summary: Get session messages
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: List of messages
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/MessageList'

  /rag/documents:
    post:
      tags: [RAG]
      summary: Ingest document
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                appName:
                  type: string
                title:
                  type: string
                chunkSize:
                  type: integer
                  default: 512
                chunkOverlap:
                  type: integer
                  default: 50
      responses:
        '201':
          description: Document ingested
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RAGDocument'
    get:
      tags: [RAG]
      summary: List documents
      parameters:
        - name: appName
          in: query
          schema:
            type: string
      responses:
        '200':
          description: List of documents
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DocumentList'

  /rag/search:
    post:
      tags: [RAG]
      summary: Search RAG memory
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RAGSearchRequest'
      responses:
        '200':
          description: Search results
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RAGSearchResponse'

  /categories:
    get:
      tags: [Models]
      summary: List model categories
      responses:
        '200':
          description: List of categories
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CategoryList'
    post:
      tags: [Models]
      summary: Create custom category
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateCategoryRequest'
      responses:
        '201':
          description: Category created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Category'

  /categories/{key}/switch:
    post:
      tags: [Models]
      summary: Switch model for category
      parameters:
        - name: key
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SwitchModelRequest'
      responses:
        '200':
          description: Model switched
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Category'

  /backends:
    get:
      tags: [Backends]
      summary: List backends
      responses:
        '200':
          description: List of backends
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BackendList'

  /backends/{key}/health:
    post:
      tags: [Backends]
      summary: Check backend health
      parameters:
        - name: key
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Health status
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthStatus'

  /voice/transcribe:
    post:
      tags: [Voice]
      summary: Transcribe audio
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                audio:
                  type: string
                  format: binary
                language:
                  type: string
                  default: en
      responses:
        '200':
          description: Transcription result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TranscriptionResult'

  /voice/synthesize:
    post:
      tags: [Voice]
      summary: Synthesize speech
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SynthesizeRequest'
      responses:
        '200':
          description: Audio data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SynthesizeResult'

  /generate/image:
    post:
      tags: [Image]
      summary: Generate image
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ImageGenerateRequest'
      responses:
        '200':
          description: Generated image
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ImageResult'

  /generate/video:
    post:
      tags: [Video]
      summary: Generate video
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/VideoGenerateRequest'
      responses:
        '202':
          description: Video generation started
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/VideoStatus'

  /agentic/execute:
    post:
      tags: [Agentic]
      summary: Execute long-chain task
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AgenticExecuteRequest'
      responses:
        '200':
          description: SSE stream of chain execution
          content:
            text/event-stream:
              schema:
                type: string

  /tools:
    get:
      tags: [Agentic]
      summary: List available tools
      responses:
        '200':
          description: List of tools
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ToolList'

components:
  schemas:
    GenerateRequest:
      type: object
      required:
        - userPrompt
      properties:
        category:
          type: string
          default: writing
        systemPrompt:
          type: string
        userPrompt:
          type: string
        temperature:
          type: number
          minimum: 0
          maximum: 2
          default: 0.7
        maxTokens:
          type: integer
          default: 2048
        outputFormat:
          type: string
          enum: [text, json, markdown]
          default: markdown

    GenerateResponse:
      type: object
      properties:
        id:
          type: string
        content:
          type: string
        finishReason:
          type: string
        tokensUsed:
          $ref: '#/components/schemas/TokenUsage'
        durationMs:
          type: integer
        modelUsed:
          type: string
        backendUsed:
          type: string

    TokenUsage:
      type: object
      properties:
        prompt:
          type: integer
        completion:
          type: integer
        total:
          type: integer

    CreateSessionRequest:
      type: object
      required:
        - appName
      properties:
        appName:
          type: string
        category:
          type: string
          default: thinking
        title:
          type: string

    ChatSession:
      type: object
      properties:
        sessionId:
          type: string
        sequenceNum:
          type: integer
        path:
          type: string
        title:
          type: string
        category:
          type: string
        messageCount:
          type: integer
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    SessionList:
      type: object
      properties:
        sessions:
          type: array
          items:
            $ref: '#/components/schemas/ChatSession'
        total:
          type: integer

    SendMessageRequest:
      type: object
      required:
        - content
      properties:
        content:
          type: string
        attachments:
          type: array
          items:
            $ref: '#/components/schemas/Attachment'

    Attachment:
      type: object
      properties:
        type:
          type: string
          enum: [file, image, audio, video]
        name:
          type: string
        content:
          type: string

    MessageList:
      type: object
      properties:
        messages:
          type: array
          items:
            $ref: '#/components/schemas/Message'

    Message:
      type: object
      properties:
        id:
          type: string
        sequenceNum:
          type: integer
        role:
          type: string
          enum: [user, assistant, system]
        content:
          type: string
        tokens:
          type: integer
        model:
          type: string
        createdAt:
          type: string
          format: date-time

    RAGDocument:
      type: object
      properties:
        docId:
          type: string
        sequenceNum:
          type: integer
        path:
          type: string
        title:
          type: string
        chunkCount:
          type: integer
        embeddingModel:
          type: string
        status:
          type: string

    DocumentList:
      type: object
      properties:
        documents:
          type: array
          items:
            $ref: '#/components/schemas/RAGDocument'

    RAGSearchRequest:
      type: object
      required:
        - appName
        - query
      properties:
        appName:
          type: string
        query:
          type: string
        topK:
          type: integer
          default: 5
        threshold:
          type: number
          default: 0.7

    RAGSearchResponse:
      type: object
      properties:
        results:
          type: array
          items:
            $ref: '#/components/schemas/RAGSearchResult'

    RAGSearchResult:
      type: object
      properties:
        docId:
          type: string
        chunkId:
          type: string
        content:
          type: string
        score:
          type: number
        metadata:
          type: object

    Category:
      type: object
      properties:
        key:
          type: string
        displayName:
          type: string
        description:
          type: string
        currentBackend:
          type: string
        currentModel:
          type: string
        isBuiltin:
          type: boolean
        parameters:
          type: object

    CategoryList:
      type: object
      properties:
        categories:
          type: array
          items:
            $ref: '#/components/schemas/Category'

    CreateCategoryRequest:
      type: object
      required:
        - key
        - displayName
        - defaultBackend
        - defaultModel
      properties:
        key:
          type: string
        displayName:
          type: string
        description:
          type: string
        defaultBackend:
          type: string
        defaultModel:
          type: string
        parameters:
          type: object

    SwitchModelRequest:
      type: object
      required:
        - backend
        - model
      properties:
        backend:
          type: string
        model:
          type: string

    BackendList:
      type: object
      properties:
        backends:
          type: array
          items:
            $ref: '#/components/schemas/Backend'

    Backend:
      type: object
      properties:
        key:
          type: string
        displayName:
          type: string
        type:
          type: string
        baseUrl:
          type: string
        healthStatus:
          type: string
        loadedModels:
          type: array
          items:
            type: string

    HealthStatus:
      type: object
      properties:
        key:
          type: string
        status:
          type: string
        latencyMs:
          type: integer
        version:
          type: string
        checkedAt:
          type: string
          format: date-time

    TranscriptionResult:
      type: object
      properties:
        id:
          type: string
        text:
          type: string
        language:
          type: string
        confidence:
          type: number
        modelUsed:
          type: string

    SynthesizeRequest:
      type: object
      required:
        - text
      properties:
        text:
          type: string
        voice:
          type: string
          default: default
        speed:
          type: number
          default: 1.0
        format:
          type: string
          default: mp3

    SynthesizeResult:
      type: object
      properties:
        id:
          type: string
        audioUrl:
          type: string
        audioBase64:
          type: string
        duration:
          type: number
        modelUsed:
          type: string

    ImageGenerateRequest:
      type: object
      required:
        - prompt
      properties:
        prompt:
          type: string
        negativePrompt:
          type: string
        width:
          type: integer
          default: 1024
        height:
          type: integer
          default: 1024
        steps:
          type: integer
          default: 30
        cfgScale:
          type: number
          default: 7.5
        seed:
          type: integer

    ImageResult:
      type: object
      properties:
        id:
          type: string
        imageUrl:
          type: string
        imageBase64:
          type: string
        width:
          type: integer
        height:
          type: integer
        modelUsed:
          type: string
        durationMs:
          type: integer

    VideoGenerateRequest:
      type: object
      required:
        - prompt
      properties:
        prompt:
          type: string
        duration:
          type: integer
          default: 4
        fps:
          type: integer
          default: 24
        width:
          type: integer
          default: 1024
        height:
          type: integer
          default: 576

    VideoStatus:
      type: object
      properties:
        id:
          type: string
        status:
          type: string
        videoUrl:
          type: string
        estimatedDurationMs:
          type: integer

    AgenticExecuteRequest:
      type: object
      required:
        - appName
        - prompt
      properties:
        appName:
          type: string
        sessionId:
          type: string
        prompt:
          type: string
        maxSteps:
          type: integer
          default: 10
        allowedTools:
          type: array
          items:
            type: string
        stream:
          type: boolean
          default: true

    ToolList:
      type: object
      properties:
        tools:
          type: array
          items:
            $ref: '#/components/schemas/Tool'

    Tool:
      type: object
      properties:
        name:
          type: string
        description:
          type: string
        parameters:
          type: object
        targetCli:
          type: string
        cacheMode:
          type: string

    Error:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: integer
            message:
              type: string
            details:
              type: string

  responses:
    BadRequest:
      description: Invalid request
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
    BearerAuth:
      type: http
      scheme: bearer

security:
  - BearerAuth: []
```

---

## Go Implementation

### Swagger Integration

```go
package api

import (
    "embed"
    "net/http"
    
    "github.com/go-chi/chi/v5"
    httpSwagger "github.com/swaggo/http-swagger"
)

//go:embed swagger.yaml
var swaggerSpec embed.FS

func (s *Server) setupSwagger(r chi.Router) {
    // Serve OpenAPI spec
    r.Get("/swagger.yaml", func(w http.ResponseWriter, r *http.Request) {
        data, _ := swaggerSpec.ReadFile("swagger.yaml")
        w.Header().Set("Content-Type", "application/yaml")
        w.Write(data)
    })
    
    r.Get("/swagger.json", func(w http.ResponseWriter, r *http.Request) {
        // Convert YAML to JSON
        data, _ := swaggerSpec.ReadFile("swagger.yaml")
        jsonData := yamlToJson(data)
        w.Header().Set("Content-Type", "application/json")
        w.Write(jsonData)
    })
    
    // Swagger UI
    r.Get("/swagger/*", httpSwagger.Handler(
        httpSwagger.URL("/swagger.yaml"),
    ))
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| API Interface | `04-api-interface.md` |
| Error Codes | `05-error-codes.md` |
| Agentic Mode | `09-agentic-mode.md` |
