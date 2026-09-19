# AI Bridge: Error Codes

**Version:** 5.0.0  
**Status:** Complete  
**Updated:** 2026-03-09

---

## Overview

AI Bridge uses error codes in the **9000-9999** range, following the project's standardized error code system.

---

## Error Code Registry

### 9000-9099: General/Startup Errors

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| 9000 | `ErrConfigNotFound` | Configuration file not found | Create config.yaml or specify --config path |
| 9001 | `ErrConfigInvalid` | Configuration file is invalid | Check YAML syntax and required fields |
| 9002 | `ErrConfigMissingRequired` | Required configuration field missing | Add required field to config |
| 9010 | `ErrDaemonAlreadyRunning` | Daemon is already running | Use `aibridge daemon stop` first |
| 9011 | `ErrDaemonNotRunning` | Daemon is not running | Use `aibridge daemon start` |
| 9012 | `ErrDaemonStartFailed` | Failed to start daemon | Check port availability and permissions |
| 9013 | `ErrDaemonStopFailed` | Failed to stop daemon | Check PID file and process state |
| 9020 | `ErrPortInUse` | Daemon port is already in use | Change port in config or stop conflicting process |
| 9021 | `ErrPermissionDenied` | Insufficient permissions | Run with elevated privileges or change paths |

### 9100-9199: Input Parsing Errors

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| 9100 | `ErrUnsupportedFormat` | Input format not supported | Use .md, .json, .yaml, or .csv |
| 9101 | `ErrJsonParseFailed` | Failed to parse JSON | Check JSON syntax |
| 9102 | `ErrJsonValidationFailed` | JSON schema validation failed | Check required fields and types |
| 9110 | `ErrYamlParseFailed` | Failed to parse YAML | Check YAML syntax and indentation |
| 9111 | `ErrYamlEmpty` | YAML document is empty | Add content to YAML file |
| 9120 | `ErrMarkdownParseFailed` | Failed to parse Markdown | Check frontmatter syntax |
| 9121 | `ErrMarkdownMissingFrontmatter` | Markdown missing frontmatter | Add YAML frontmatter with --- delimiters |
| 9130 | `ErrCSVParseFailed` | Failed to parse CSV | Check CSV format and encoding |
| 9131 | `ErrCSVRequiresConfig` | CSV requires companion config | Create .config.yaml file with prompt template |
| 9132 | `ErrCSVEmpty` | CSV has no data rows | Add data rows to CSV |
| 9140 | `ErrVariableNotFound` | Template variable not resolved | Define missing variable in variables map |
| 9141 | `ErrVariableTypeMismatch` | Variable type mismatch | Check variable type in template |

### 9200-9299: Backend Connection Errors

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| 9200 | `ErrNoBackendAvailable` | No LLM backend is available | Start Ollama or llama.cpp server |
| 9201 | `ErrBackendConnectionFailed` | Failed to connect to backend | Check backend URL and network |
| 9202 | `ErrBackendTimeout` | Backend connection timed out | Increase timeout or check backend health |
| 9210 | `ErrOllamaNotRunning` | Ollama server not running | Run `ollama serve` |
| 9211 | `ErrOllamaModelNotFound` | Model not found in Ollama | Run `ollama pull <model>` |
| 9212 | `ErrOllamaModelLoadFailed` | Failed to load Ollama model | Check GPU memory and model compatibility |
| 9220 | `ErrLlamaCppNotRunning` | llama.cpp server not running | Start llama-server |
| 9221 | `ErrLlamaCppModelNotFound` | Model file not found | Check model path in config |
| 9222 | `ErrLlamaCppModelLoadFailed` | Failed to load llama.cpp model | Check GPU memory and model format |
| 9230 | `ErrBackendHealthCheckFailed` | Backend health check failed | Restart backend service |
| 9231 | `ErrBackendOverloaded` | Backend is overloaded | Wait or reduce request rate |

### 9300-9310: RAG Configuration Validation Errors

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| 9301 | `ErrRagChunkSizeInvalid` | Chunk size outside valid range (256-8192) | Set ChunkSize between 256 and 8192 |
| 9302 | `ErrRagChunkSizeNotMultiple` | Chunk size not multiple of 256 | Set ChunkSize to multiple of 256 |
| 9303 | `ErrRagOverlapTooLarge` | Chunk overlap exceeds 25% of chunk size | Reduce ChunkOverlap to ≤25% of ChunkSize |
| 9304 | `ErrRagContextBudgetInvalid` | Context token budget outside range (512-16384) | Set ContextTokenBudget between 512 and 16384 |
| 9305 | `ErrRagEmbeddingModelInvalid` | Embedding model not supported | Use supported model: nomic-embed-text, etc. |
| 9306 | `ErrRagSimilarityThresholdInvalid` | Similarity threshold outside range (0.0-1.0) | Set SimilarityThreshold between 0.0 and 1.0 |
| 9307 | `ErrRagTopKInvalid` | TopK outside valid range (1-50) | Set TopK between 1 and 50 |
| 9308 | `ErrRagConfigLoadFailed` | Failed to load RAG configuration | Check config file syntax and permissions |
| 9309 | `ErrRagConfigSaveFailed` | Failed to save RAG configuration | Check file permissions |
| 9310 | `ErrRagConfigSourceConflict` | Conflicting config from multiple sources | Review priority: app > root > seed |

### 9311-9319: Request Processing Errors

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| 9311 | `ErrRequestInvalid` | Request is invalid | Check request format and required fields |
| 9312 | `ErrRequestTooLarge` | Request exceeds size limit | Reduce prompt size |
| 9313 | `ErrContextTooLong` | Context exceeds model limit | Reduce context or use larger model |

### 9320-9339: Model & Generation Errors

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| 9320 | `ErrModelCategoryInvalid` | Invalid model category | Use: thinking, writing, coding, or voice |
| 9321 | `ErrModelNotFound` | Specified model not found | Check model ID or use category |
| 9322 | `ErrModelNotLoaded` | Model not currently loaded | Load model or wait for auto-load |
| 9330 | `ErrGenerationFailed` | Text generation failed | Check backend logs |
| 9331 | `ErrGenerationTimeout` | Generation timed out | Increase timeout or reduce maxTokens |
| 9332 | `ErrGenerationCancelled` | Generation was cancelled | Request was cancelled by user |
| 9335 | `ErrBatchItemFailed` | Batch item processing failed | Check individual item for errors |
| 9336 | `ErrBatchPartialFailure` | Some batch items failed | Review failed items in response |

### 9400-9499: Response Handling Errors

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| 9400 | `ErrResponseInvalid` | Invalid response from backend | Report as bug if persistent |
| 9401 | `ErrResponseParseFailed` | Failed to parse backend response | Check backend compatibility |
| 9410 | `ErrStreamInterrupted` | Streaming was interrupted | Retry request |
| 9411 | `ErrStreamTimeout` | Streaming timed out | Increase timeout |
| 9420 | `ErrOutputFormatFailed` | Failed to format output | Check output format setting |
| 9421 | `ErrOutputWriteFailed` | Failed to write output file | Check file permissions and path |

---

## Error Structure

```go
type BridgeError struct {
    Code       int               
    Message    string            
    Details    string            `json:",omitempty"`
    Cause      error             `json:"-"` // EXEMPTED: AppError internal cause (I-2)
    Context    ErrorContext      `json:",omitempty"`
    Retryable  bool              
    Timestamp  time.Time         
}

// ErrorContext provides structured error context fields
type ErrorContext struct {
    Table      string `json:",omitempty"` // Affected table name
    Operation  string `json:",omitempty"` // CRUD operation
    Input      string `json:",omitempty"` // Sanitized input summary
    Stack      string `json:",omitempty"` // Caller chain
    SessionId  string `json:",omitempty"` // Related session
    AppName    string `json:",omitempty"` // Related application
}

func NewError(code int, message string, args ...string) *BridgeError {
    return &BridgeError{
        Code:      code,
        Message:   fmt.Sprintf(message, args...),
        Timestamp: time.Now(),
        Retryable: isRetryable(code),
    }
}

func isRetryable(code int) bool {
    retryableCodes := map[int]bool{
        9200: true, // No backend available
        9201: true, // Connection failed
        9202: true, // Timeout
        9230: true, // Health check failed
        9231: true, // Overloaded
        9321: true, // Generation timeout
        9410: true, // Stream interrupted
        9411: true, // Stream timeout
    }
    return retryableCodes[code]
}
```

---

## Error Response Format

### CLI Output

```
Error [9101]: Invalid JSON in request body
Details: unexpected end of JSON input at position 45
File: prompt.json

Run with --verbose for more details.
```

### API Response

```json
{
  "Error": {
    "Code": 9101,
    "Message": "Invalid JSON in request body",
    "Details": "unexpected end of JSON input at position 45",
    "Retryable": false,
    "Timestamp": "2026-01-31T10:30:00Z"
  }
}
```

---

## Logging

All errors are logged with context:

```go
log.Error().
    Int("code", err.Code).
    Str("message", err.Message).
    Str("file", sourceFile).
    Int("line", lineNumber).
    Err(err.Cause).
    Msg("AI Bridge error")
```

---

## 9500-9599: AI SEO Generation Errors

### 9541-9553: FAQ Generation Errors

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| 9541 | `ErrFaqTrainingFailed` | Training data ingestion failed | Check training data format and content |
| 9542 | `ErrFaqCompanyNotFound` | No training data for company | Run training first |
| 9543 | `ErrFaqRagRetrievalFailed` | Failed to retrieve from RAG | Check database connectivity |
| 9544 | `ErrFaqGenerationFailed` | AI generation failed | Check backend availability |
| 9545 | `ErrFaqWordLimitExceeded` | FAQ exceeds word limit | Reduce content length |
| 9546 | `ErrFaqSentenceTooLong` | Sentence exceeds 18 words | Shorten sentence |
| 9547 | `ErrFaqTransitionMissing` | Sentence missing transition word | Add transition word to start |
| 9548 | `ErrFaqParagraphCountInvalid` | Must have exactly 3 paragraphs | Restructure content |
| 9549 | `ErrFaqAnswerFirstMissing` | Answer not in first 2 sentences | Move answer to beginning |
| 9550 | `ErrFaqCompanyMentionMissing` | Company not in first 2 sentences | Add company reference |
| 9551 | `ErrFaqTransitionDensityLow` | Below 40% transition density | Add more transition words |
| 9552 | `ErrFaqOutputFormatUnsupported` | Requested format not supported | Use html, text, or markdown |
| 9553 | `ErrFaqSessionNotFound` | FAQ session not found | Check session ID |

### 9561-9575: Paragraph Generation Errors

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| 9561 | `ErrParaTrainingFailed` | Training data ingestion failed | Check training data format |
| 9562 | `ErrParaCompanyNotFound` | No training data for company | Run training first |
| 9563 | `ErrParaRagRetrievalFailed` | Failed to retrieve from RAG | Check database connectivity |
| 9564 | `ErrParaGenerationFailed` | AI generation failed | Check backend availability |
| 9565 | `ErrParaWordLimitExceeded` | Paragraph exceeds word limit | Reduce paragraph length |
| 9566 | `ErrParaWordLimitBelow` | Paragraph below minimum words | Expand paragraph content |
| 9567 | `ErrParaSentenceTooLong` | Sentence exceeds word limit | Shorten sentence |
| 9568 | `ErrParaTransitionMissing` | Sentence missing transition word | Add transition word to start |
| 9569 | `ErrParaConsecutiveStart` | Consecutive sentences same start | Vary sentence beginnings |
| 9570 | `ErrParaHyphenDetected` | Hyphen found in content | Remove or replace hyphens |
| 9571 | `ErrParaLinkCountLow` | Below minimum links per paragraph | Add more internal links |
| 9572 | `ErrParaSitemapFailed` | Sitemap fetch/parse failed | Check sitemap URL |
| 9573 | `ErrParaSlugGenerationFailed` | Slug generation failed | Check keyword input |
| 9574 | `ErrParaOutputFormatUnsupported` | Requested format not supported | Use html, text, or markdown |
| 9575 | `ErrParaContentTypeUnknown` | Unknown content type | Use valid content type |

### 9576-9595: Blog Post Generation Errors

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| 9576 | `ErrBlogTrainingFailed` | Training data ingestion failed | Check training data format |
| 9577 | `ErrBlogCompanyNotFound` | No training data for company | Run training first |
| 9578 | `ErrBlogSessionNotFound` | Blog session not found | Check session ID |
| 9579 | `ErrBlogOutlineFailed` | Outline generation failed | Check keywords and topic |
| 9580 | `ErrBlogGsearchFailed` | GSearch integration failed | Check GSearch CLI availability |
| 9581 | `ErrBlogPaaFailed` | PAA extraction failed | Retry with different keywords |
| 9582 | `ErrBlogCompetitorScrapeFailed` | Competitor heading scrape failed | Check target URLs |
| 9583 | `ErrBlogGenerationFailed` | Blog content generation failed | Check backend availability |
| 9584 | `ErrBlogSectionFailed` | Individual section failed | Check section configuration |
| 9585 | `ErrBlogParaCallFailed` | Internal paragraph generator call failed | Check paragraph generator |
| 9586 | `ErrBlogFaqBlendFailed` | FAQ blending failed | Check FAQ session |
| 9587 | `ErrBlogQuoteInjectionFailed` | Quotation injection failed | Check quotes preset |
| 9588 | `ErrBlogCoherenceValidationFailed` | Coherence check failed | Review section flow |
| 9589 | `ErrBlogHeaderValidationFailed` | Header requirements not met | Add company/service/location |
| 9590 | `ErrBlogCategoryInvalid` | Invalid blog category | Use valid category slug |
| 9591 | `ErrBlogRegistryFailed` | Blog registry operation failed | Check company DB |
| 9592 | `ErrBlogSchemaGenerationFailed` | Schema markup failed | Check schema configuration |
| 9593 | `ErrBlogTocGenerationFailed` | Table of contents failed | Check section headers |
| 9594 | `ErrBlogOutputFormatUnsupported` | Requested format not supported | Use html, text, or markdown |
| 9595 | `ErrBlogOutlineRequired` | Outline missing for generate | Provide outline or use generate-all |

### 9700-9709: Revision System Errors

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| 9700 | `ErrRevisionNotFound` | Version does not exist | Check version number |
| 9701 | `ErrRevisionCreateFailed` | Failed to create revision | Check database connectivity |
| 9702 | `ErrFeedbackInvalid` | Feedback text empty or too long | Provide valid feedback text |
| 9703 | `ErrSelectionOutOfBounds` | Inline selection exceeds content length | Check selection offsets |
| 9704 | `ErrRollbackFailed` | Could not activate specified version | Version may be corrupted |
| 9705 | `ErrDiffComputeFailed` | Error computing version diff | Check content encoding |
| 9706 | `ErrVersionPinned` | Cannot modify pinned version | Unpin version first |
| 9707 | `ErrRegenerationInProgress` | Another regeneration is running | Wait for completion |
| 9708 | `ErrContentHashDuplicate` | Identical content already exists | Content unchanged |
| 9709 | `ErrMaxVersionsExceeded` | Too many versions for content | Archive old versions |

### 9710-9719: Suggestions System Errors

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| 9710 | `ErrSuggestionNotFound` | Suggestion ID does not exist | Check suggestion ID |
| 9711 | `ErrSuggestionNotActionable` | Cannot accept informational suggestion | Only actionable suggestions can be accepted |
| 9712 | `ErrSuggestionAlreadyProcessed` | Already accepted or dismissed | Cannot process twice |
| 9713 | `ErrSuggestionCreateFailed` | Failed to save suggestion | Check database connectivity |
| 9714 | `ErrRegistrySyncFailed` | Failed to sync with global registry | Check registry DB path |
| 9715 | `ErrSuggestionLimitExceeded` | Too many suggestions in session | Archive old suggestions |

### 9800-9809: RAG Session Memory Errors

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| 9800 | `ErrRagMemoryLoadFailed` | Failed to load RAG memory on session start | Check session DB path |
| 9801 | `ErrRagMemoryThresholdExceeded` | Memory size exceeds critical threshold | Archive or start new session |
| 9802 | `ErrRagArchiveFailed` | Failed to archive old chunks | Check write permissions |
| 9803 | `ErrRagSessionNotFound` | Session ID does not exist | Check session ID |
| 9804 | `ErrRagChunkLimitExceeded` | Too many chunks in session | Consolidate or archive |
| 9805 | `ErrRagFreshSessionFailed` | Failed to start fresh session | Check minimal memory config |

### 9820-9829: Adaptive Reasoning Errors

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| 9820 | `ErrReasoningModeInvalid` | Unknown reasoning mode specified | Use Auto, TwoStage, or SinglePrompt |
| 9821 | `ErrReasoningTimeout` | Reasoning stage timed out | Increase timeout or simplify prompt |
| 9822 | `ErrContextFetchFailed` | Failed to fetch required context | Check RAG/GSearch availability |
| 9823 | `ErrGsearchUnavailable` | GSearch CLI not available for web search | Start GSearch service |
| 9824 | `ErrQuestionLimitExceeded` | Too many questions in response | Reduce question complexity |
| 9825 | `ErrWebsocketQueueFull` | Request queue capacity exceeded | Clear old requests |
| 9826 | `ErrWebsocketResumeFailed` | Failed to resume after reconnection | Retry request |

### 9830-9839: WebSocket Connection Manager Errors

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| 9830 | `ErrWsConnectionFailed` | Initial WebSocket connection failed | Check endpoint URL and network |
| 9831 | `ErrWsConnectionLost` | Connection dropped unexpectedly | Automatic reconnection will attempt |
| 9832 | `ErrWsReconnectFailed` | Reconnection attempt failed | Wait for next retry or reconnect manually |
| 9833 | `ErrWsMaxRetries` | Max retry attempts exceeded | Manual reconnect required |
| 9834 | `ErrWsQueueFull` | Message queue at capacity | Wait for drain or increase limit |
| 9835 | `ErrWsMessageExpired` | Queued message TTL exceeded | Re-send message |
| 9836 | `ErrWsSendFailed` | Message send failed | Check connection state |
| 9837 | `ErrWsAuthRequired` | Authentication needed for connection | Re-authenticate |
| 9838 | `ErrWsHeartbeatTimeout` | Pong not received in time | Connection may be unhealthy |
| 9839 | `ErrWsInvalidState` | Operation invalid in current state | Check connection state first |

### 9840-9849: GSearch Context Integration Errors

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| 9840 | `ErrContextDetectionFailed` | Failed to analyze prompt for context needs | Check prompt format |
| 9841 | `ErrGSearchNotAvailable` | GSearch CLI not found or not executable | Install/configure GSearch CLI |
| 9842 | `ErrGSearchTimeout` | GSearch CLI execution timed out | Increase timeout or check network |
| 9843 | `ErrContextFetchFailed` | Failed to fetch required context | Check GSearch availability |
| 9844 | `ErrContextCacheCorrupt` | Context cache database corrupted | Clear cache and retry |
| 9845 | `ErrTokenBudgetExceeded` | Context exceeds token budget | Reduce context needs or increase budget |
| 9846 | `ErrChunkConversionFailed` | Failed to convert search result to chunk | Check result format |
| 9847 | `ErrContextPriorityConflict` | Conflicting priority assignments | Review context need priorities |

### 9848-9849: Research Mode Errors

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| 9848 | `ErrResearchModeUnavailable` | Research mode requires GSearch | Enable GSearch integration |
| 9849 | `ErrResearchContextEmpty` | Research returned no usable results | Broaden search keywords |

### 9900-9905: Rubric Validation Errors

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| 9900 | `ErrRubricJudgeFailed` | Judge model call failed | Check judge model availability |
| 9901 | `ErrRubricMaxRetries` | Max retry attempts exhausted | Review rubric thresholds |
| 9902 | `ErrRubricParseFailed` | Could not parse judge scores | Check judge response format |
| 9903 | `ErrRubricProfileUnknown` | Unknown rubric profile requested | Use: coding, writing, research, chat, spec, all |
| 9904 | `ErrRubricDimensionUnknown` | Unknown rubric dimension | Check dimension ID |
| 9905 | `ErrRubricThresholdInvalid` | Threshold value out of range | Use 1-5 range |

### 9910-9916: Memory Retrieval Errors

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| 9910 | `ErrRetrievalFailed` | Complete retrieval pipeline failed | Check RAG pipeline health |
| 9911 | `ErrTagPrefilterFailed` | Tag pre-filtering step failed | Verify tag index |
| 9912 | `ErrVectorSearchFailed` | Vector similarity computation failed | Check vector DB |
| 9913 | `ErrLinkTraversalFailed` | Link graph traversal failed | Check link graph integrity |
| 9914 | `ErrTokenBudgetExceeded` | Retrieved context exceeds token budget | Reduce retrieval scope |
| 9915 | `ErrEmbeddingFailed` | Query embedding generation failed | Check embedding model |
| 9916 | `ErrKeywordExtractionFailed` | Failed to extract keywords from query | Check query format |

### 9920-9927: RAG Reindexing Errors

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| 9920 | `ErrReindexSourceNotFound` | Source path does not exist | Check source path |
| 9921 | `ErrReindexPermissionDenied` | Cannot read source files | Check file permissions |
| 9922 | `ErrReindexEmbeddingFailed` | Embedding generation failed | Check embedding model |
| 9923 | `ErrReindexDbError` | Database write error | Check DB connection |
| 9924 | `ErrReindexCancelled` | Job was cancelled | Restart reindex job |
| 9925 | `ErrReindexTimeout` | Job exceeded timeout | Increase timeout or reduce batch |
| 9926 | `ErrReindexOom` | Out of memory during embedding | Reduce batch size |
| 9927 | `ErrReindexInvalidOptions` | Invalid re-index options | Check option values |

### 9990-9999: Vector DB Integration Errors

| Code | Name | Description | Resolution |
|------|------|-------------|------------|
| 9990 | `ErrVectorDbInitFailed` | Vector database initialization failed | Check chromem-go configuration |
| 9991 | `ErrVectorDbQueryFailed` | Vector similarity query failed | Check embedding dimensions |
| 9992 | `ErrVectorDbStoreFailed` | Failed to store vector embedding | Check disk space and permissions |
| 9993 | `ErrEmbeddingGenerationFailed` | Ollama embedding generation failed | Check Ollama availability |
| 9994 | `ErrEmbeddingModelNotFound` | Embedding model not available | Pull model: ollama pull nomic-embed-text |
| 9995 | `ErrVectorCollectionNotFound` | Vector collection does not exist | Create collection first |

---

## See Also

- [Architecture](./01-architecture.md)
- [Error Management Spec](../../21-app/spec-management-software/06-error-management/00-overview.md)
- [Error Code Registry](../../03-error-manage/03-error-code-registry/02-registry.md)
- [Unified Revisions Architecture](./35-unified-revisions-architecture.md)
- [Suggestions System](./34-suggestions-system.md)
- [Session-Scoped RAG Memory](./36-session-scoped-rag-memory.md)
- [Adaptive Reasoning Flow](./37-adaptive-reasoning-flow.md)
- [WebSocket Connection Manager](./38-websocket-connection-manager.md)
- [GSearch Context Integration](./40-gsearch-context-integration.md)
- [HTML Blog Generation](./55-html-blog-generation.md)
- [Memory Retrieval Best Practices](./54-memory-retrieval-best-practices.md)
