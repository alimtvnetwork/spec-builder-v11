# Non-Vector RAG: Error Codes

**Version:** 2.0.0  
**Status:** Draft  
**Last Updated:** 2026-03-22  

---

## Overview

Error code registry for the Non-Vector RAG system, using range **20000-20999** (prefix `AB-TR`).

> ⚠️ **Reassigned:** Originally claimed 12000-12999, which overlapped with WSP (WP SEO Publish, 12000-12599). Moved to 20000-20999 per collision resolution.

---

## Error Code Table

| Code | Name | Category | Description | HTTP | Severity |
|------|------|----------|-------------|------|----------|
| **20000** | ErrTreeRagStartupError | General | Service failed to initialize | 500 | Critical |
| **20001** | ErrTreeRagConfigInvalid | General | Invalid configuration parameters | 400 | High |
| **20002** | ErrTreeRagDatabaseError | General | SQLite connection or migration failure | 500 | Critical |
| **20003** | ErrTreeRagModelUnavailable | General | Required LLM model not available | 503 | High |
| | | | | | |
| **20100** | ErrParseRouterNoParser | Code Parsing | No parser registered for file extension | 400 | Medium |
| **20101** | ErrParseFileReadError | Code Parsing | Failed to read source file from disk | 500 | High |
| **20102** | ErrParseAstError | Code Parsing | Go AST parsing failed | 500 | Medium |
| **20103** | ErrParseRegexError | Code Parsing | Regex-based extraction failed | 500 | Medium |
| **20104** | ErrParseBraceMatchError | Code Parsing | Unmatched braces in source file | 400 | Low |
| **20105** | ErrParseDepthExceeded | Code Parsing | Maximum parse depth exceeded | 400 | Low |
| **20106** | ErrParseFileTooLarge | Code Parsing | File exceeds maximum size limit | 400 | Low |
| **20107** | ErrParseTimeout | Code Parsing | Single file parsing timed out | 408 | Medium |
| **20108** | ErrParseEncodingError | Code Parsing | File encoding not supported | 400 | Low |
| | | | | | |
| **20200** | ErrDocParseReadError | Document Parsing | Failed to read document file | 500 | High |
| **20201** | ErrDocParseHeadingError | Document Parsing | Invalid heading structure detected | 400 | Low |
| **20202** | ErrDocParseHtmlError | Document Parsing | HTML DOM parsing failed | 500 | Medium |
| **20203** | ErrDocParseCsvError | Document Parsing | CSV format error | 400 | Medium |
| **20204** | ErrDocParseTooLarge | Document Parsing | Document exceeds size limit | 400 | Low |
| **20205** | ErrDocParseEncoding | Document Parsing | Unsupported file encoding | 400 | Low |
| **20206** | ErrDocParseFrontmatter | Document Parsing | Invalid YAML frontmatter | 400 | Low |
| | | | | | |
| **20300** | ErrEnrichmentLlmUnavailable | Tree Construction | LLM/Ollama not running or unreachable | 503 | Critical |
| **20301** | ErrEnrichmentLlmTimeout | Tree Construction | LLM enrichment call timed out | 408 | High |
| **20302** | ErrEnrichmentInvalidJson | Tree Construction | LLM returned unparseable JSON | 500 | Medium |
| **20303** | ErrEnrichmentBatchFailed | Tree Construction | Batch failed after all retry attempts | 500 | High |
| **20304** | ErrEnrichmentCategoryUnknown | Tree Construction | LLM assigned non-predefined category | 400 | Low |
| **20305** | ErrEnrichmentScoreOutOfRange | Tree Construction | Importance score not in 0.0-1.0 | 400 | Low |
| **20306** | ErrEnrichmentCacheError | Tree Construction | Cache read/write failure | 500 | Medium |
| | | | | | |
| **20400** | ErrStorageWriteError | Tree Storage | SQLite write operation failed | 500 | Critical |
| **20401** | ErrStorageTransactionError | Tree Storage | Transaction commit/rollback failed | 500 | Critical |
| **20402** | ErrStorageFts5Error | Tree Storage | FTS5 index update failed | 500 | High |
| **20403** | ErrStorageMigrationError | Tree Storage | Schema migration failed | 500 | Critical |
| **20404** | ErrStorageCapacityExceeded | Tree Storage | Database size limit exceeded | 507 | High |
| | | | | | |
| **20500** | ErrRetrievalQueryAnalysisFailed | Retrieval | LLM query analysis returned invalid result | 500 | High |
| **20501** | ErrRetrievalTreeEmpty | Retrieval | Tree index has zero nodes | 404 | Medium |
| **20502** | ErrRetrievalTraversalTimeout | Retrieval | Tree traversal exceeded time limit | 408 | High |
| **20503** | ErrRetrievalNoResults | Retrieval | No nodes scored above threshold | 200 | Low |
| **20504** | ErrRetrievalTokenBudgetExceeded | Retrieval | Cannot fit any nodes in token budget | 400 | Medium |
| **20505** | ErrRetrievalFts5Error | Retrieval | FTS5 query execution failed | 500 | High |
| **20506** | ErrRetrievalScoringError | Retrieval | Node scoring computation failed | 500 | Medium |
| **20507** | ErrRetrievalContextAssemblyError | Retrieval | Context formatting failed | 500 | Medium |
| | | | | | |
| **20600** | ErrApiIndexNotFound | API | Tree index not found for app name | 404 | Medium |
| **20601** | ErrApiJobNotFound | API | Indexing job ID not found | 404 | Medium |
| **20602** | ErrApiInvalidRequest | API | Request validation failed | 400 | Low |
| **20603** | ErrApiIndexAlreadyRunning | API | Index job already in progress for this app | 409 | Low |
| **20604** | ErrApiRateLimited | API | Too many requests | 429 | Low |
| | | | | | |
| **20700** | ErrConfigFileNotFound | Configuration | Config file not found at path | 404 | Medium |
| **20701** | ErrConfigParseError | Configuration | Config file parse error | 400 | High |
| **20702** | ErrConfigValidationError | Configuration | Config value out of valid range | 400 | Medium |
| | | | | | |
| **20800** | ErrIntegrationBridgeError | AI Bridge | Failed to communicate with AI Bridge | 503 | Critical |
| **20801** | ErrIntegrationRouterError | AI Bridge | Retrieval strategy router failed | 500 | High |
| **20802** | ErrIntegrationSessionError | AI Bridge | Session context injection failed | 500 | High |
| | | | | | |
| **20850** | ErrRouterClassificationFailed | Retrieval Router | Both LLM and heuristic classifiers returned invalid result | 500 | High |
| **20851** | ErrRouterNoIndexAvailable | Retrieval Router | Neither vector nor tree index exists for app | 404 | Medium |
| **20852** | ErrRouterFallbackExhausted | Retrieval Router | Primary and fallback strategies both returned zero results | 200 | Low |
| **20853** | ErrRouterInvalidOverride | Retrieval Router | User-specified strategy not available (index missing) | 400 | Medium |
| **20854** | ErrRouterLatencyGuardTriggered | Retrieval Router | Hybrid skipped due to session latency threshold (informational) | 200 | Low |

---

## Error Handling Patterns

### Retry Policy

| Category | Max Retries | Backoff | Fallback |
|----------|-------------|---------|----------|
| LLM calls (enrichment) | 2 | Exponential (1s, 3s) | Skip node, mark as unenriched |
| LLM calls (retrieval) | 1 | None | Fall back to FTS5-only retrieval |
| SQLite writes | 3 | Linear (500ms) | Fail job |
| File reads | 1 | None | Skip file, log warning |

---

## Migration Log

| Date | Change |
|------|--------|
| 2026-03-22 | Reassigned from 12000-12999 → 20000-20999 to resolve overlap with WSP (12000-12599) |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Overview | `./00-overview.md` |
| Error Code Registry | `../03-error-manage/03-error-code-registry/02-registry.md` |
| Error Resolution | `../03-error-manage/01-error-resolution/00-overview.md` |

---

*Error codes reassigned to 20000-20999 on 2026-03-22 to resolve collision with WSP.*
