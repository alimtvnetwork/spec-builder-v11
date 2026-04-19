# Business Intelligence Suite: Error Code Registry

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Range:** 7700–7839  

---

## Overview

This document consolidates all error codes for the GSearch Business Intelligence Suite. Error codes are partitioned by phase and feature area, following the project's error code registry standard.

---

## Error Code Ranges

| Range | Phase | Category | Description |
|-------|-------|----------|-------------|
| 7700–7719 | 1 | Multi-Engine Search | Search execution, engine adapters, aggregation |
| 7720–7739 | 2 | FAQ Discovery | PAA extraction, JSON-LD parsing, AI Overview |
| 7740–7759 | 3 | SERP Tracking | Position discovery, history, alerts |
| 7760–7779 | 4 | Contact Extraction | Email, phone, social discovery |
| 7780–7794 | 5 | Google Maps | Maps scraping, job scheduling |
| 7795–7799 | — | Reserved | Future expansion |
| 7800–7819 | 6 | Response/Cache | Formatting, TTL, cache control |
| 7820–7839 | 7 | REST API | Authentication, rate limiting, webhooks |

---

## Phase 1: Multi-Engine Search (7700–7719)

| Code | Constant | Description |
|------|----------|-------------|
| 7700 | ErrSearchQueryEmpty | Search query is empty or whitespace |
| 7701 | ErrSearchQueryTooLong | Query exceeds maximum length (500 chars) |
| 7702 | ErrSearchEngineInvalid | Unsupported search engine specified |
| 7703 | ErrSearchMethodInvalid | Invalid search method (api/scrape/auto) |
| 7704 | ErrSearchApiKeyMissing | API key not configured for provider |
| 7705 | ErrSearchApiQuotaExceeded | API quota/rate limit exceeded |
| 7706 | ErrSearchApiResponseInvalid | Invalid response from search API |
| 7707 | ErrSearchScrapeFailed | Stealth scraper failed to retrieve results |
| 7708 | ErrSearchScrapeBlocked | Scraper blocked (CAPTCHA/IP ban) |
| 7709 | ErrSearchScrapeTimeout | Scraper request timed out |
| 7710 | ErrSearchNoResults | No results found for query |
| 7711 | ErrSearchAggregationFailed | Result aggregation failed |
| 7712 | ErrSearchDeduplicationFailed | Deduplication process failed |
| 7713 | ErrSearchEngineTimeout | Engine did not respond in time |
| 7714 | ErrSearchAllEnginesFailed | All configured engines failed |
| 7715 | ErrSearchResultParseFailed | Failed to parse search result |
| 7716 | ErrSearchProxyFailed | Proxy connection failed |
| 7717 | ErrSearchCountInvalid | Invalid result count requested |
| 7718 | ErrSearchPagesInvalid | Invalid page range specified |
| 7719 | Reserved | Reserved for future use |

---

## Phase 2: FAQ Discovery (7720–7739)

| Code | Constant | Description |
|------|----------|-------------|
| 7720 | ErrFaqQueryEmpty | FAQ query is empty |
| 7721 | ErrFaqNoResults | No FAQ/PAA results found |
| 7722 | ErrFaqPaaExpansionFailed | PAA expansion failed |
| 7723 | ErrFaqPaaDepthExceeded | Maximum PAA depth exceeded |
| 7724 | ErrFaqSchemaNotFound | No FAQ schema found on page |
| 7725 | ErrFaqSchemaParseFailed | Failed to parse FAQ JSON-LD |
| 7726 | ErrFaqSchemaInvalid | Invalid FAQ schema structure |
| 7727 | ErrFaqAiOverviewNotFound | AI Overview not present in SERP |
| 7728 | ErrFaqAiOverviewParseFailed | Failed to parse AI Overview |
| 7729 | ErrFaqSourceNotAccessible | FAQ source URL not accessible |
| 7730 | ErrFaqEnrichmentFailed | Answer enrichment failed |
| 7731 | ErrFaqAnswerEmpty | Extracted answer is empty |
| 7732 | ErrFaqQuestionDuplicate | Duplicate question detected |
| 7733 | ErrFaqExportFailed | FAQ export failed |
| 7734 | ErrFaqUrlInvalid | Invalid URL for schema extraction |
| 7735 | ErrFaqRateLimited | Too many FAQ requests |
| 7736 | ErrFaqCacheFailed | Failed to cache FAQ results |
| 7737 | Reserved | Reserved for future use |
| 7738 | Reserved | Reserved for future use |
| 7739 | Reserved | Reserved for future use |

---

## Phase 3: SERP Position Tracking (7740–7759)

| Code | Constant | Description |
|------|----------|-------------|
| 7740 | ErrSerpQueryEmpty | SERP query is empty |
| 7741 | ErrSerpDomainEmpty | No domain specified for tracking |
| 7742 | ErrSerpDomainInvalid | Invalid domain format |
| 7743 | ErrSerpDomainsExceeded | Too many domains (max 20) |
| 7744 | ErrSerpPositionNotFound | Domain not found in SERP |
| 7745 | ErrSerpPageRangeInvalid | Invalid page range (1-10) |
| 7746 | ErrSerpFetchFailed | Failed to fetch SERP |
| 7747 | ErrSerpParseFailed | Failed to parse SERP results |
| 7748 | ErrTrackerNotFound | Tracking job not found |
| 7749 | ErrTrackerAlreadyExists | Tracker already exists for query/domain |
| 7750 | ErrTrackerLimitExceeded | Maximum trackers exceeded |
| 7751 | ErrTrackerIntervalInvalid | Invalid tracking interval |
| 7752 | ErrTrackerCreateFailed | Failed to create tracker |
| 7753 | ErrTrackerUpdateFailed | Failed to update tracker |
| 7754 | ErrTrackerDeleteFailed | Failed to delete tracker |
| 7755 | ErrHistoryNotFound | No position history found |
| 7756 | ErrHistoryDateRangeInvalid | Invalid history date range |
| 7757 | ErrAlertConfigInvalid | Invalid alert configuration |
| 7758 | ErrAlertDeliveryFailed | Alert delivery failed |
| 7759 | Reserved | Reserved for future use |

---

## Phase 4: Contact Extraction (7760–7779)

| Code | Constant | Description |
|------|----------|-------------|
| 7760 | ErrContactUrlEmpty | URL is empty |
| 7761 | ErrContactUrlInvalid | Invalid URL format |
| 7762 | ErrContactUrlNotAccessible | URL not accessible (4xx/5xx) |
| 7763 | ErrContactFetchFailed | Failed to fetch page content |
| 7764 | ErrContactParseFailed | Failed to parse page HTML |
| 7765 | ErrContactPageNotFound | Contact page not found |
| 7766 | ErrContactNoResults | No contact info extracted |
| 7767 | ErrEmailExtractFailed | Email extraction failed |
| 7768 | ErrEmailFormatInvalid | Invalid email format |
| 7769 | ErrEmailVerificationFailed | Email MX verification failed |
| 7770 | ErrEmailClassificationFailed | Email classification failed |
| 7771 | ErrPhoneExtractFailed | Phone extraction failed |
| 7772 | ErrPhoneFormatInvalid | Invalid phone format |
| 7773 | ErrPhoneNormalizationFailed | E.164 normalization failed |
| 7774 | ErrSocialExtractFailed | Social profile extraction failed |
| 7775 | ErrSocialVerificationFailed | Social profile verification failed |
| 7776 | ErrSocialPlatformUnknown | Unknown social platform |
| 7777 | ErrBatchSizeExceeded | Batch size exceeds limit (100) |
| 7778 | ErrBatchNotFound | Batch job not found |
| 7779 | Reserved | Reserved for future use |

---

## Phase 5: Google Maps Search (7780–7794)

| Code | Constant | Description |
|------|----------|-------------|
| 7780 | ErrMapsQueryEmpty | Maps query is empty |
| 7781 | ErrMapsLocationEmpty | Location not specified |
| 7782 | ErrMapsLocationInvalid | Invalid location format |
| 7783 | ErrMapsFetchFailed | Failed to fetch Maps results |
| 7784 | ErrMapsParseFailed | Failed to parse Maps HTML |
| 7785 | ErrMapsCaptcha | CAPTCHA challenge detected |
| 7786 | ErrMapsBlocked | IP blocked by Maps |
| 7787 | ErrMapsTimeout | Maps request timed out |
| 7788 | ErrMapsNoResults | No businesses found |
| 7789 | ErrMapsJobNotFound | Scheduled job not found |
| 7790 | ErrMapsJobCreateFailed | Failed to create job |
| 7791 | ErrMapsJobUpdateFailed | Failed to update job |
| 7792 | ErrMapsJobLimitExceeded | Maximum jobs exceeded |
| 7793 | ErrMapsEnrichmentFailed | Business enrichment failed |
| 7794 | Reserved | Reserved for future use |

---

## Reserved Range (7795–7799)

| Code | Constant | Description |
|------|----------|-------------|
| 7795 | Reserved | Reserved for Phase 5 expansion |
| 7796 | Reserved | Reserved for Phase 5 expansion |
| 7797 | Reserved | Reserved for Phase 5 expansion |
| 7798 | Reserved | Reserved for Phase 5 expansion |
| 7799 | Reserved | Reserved for Phase 5 expansion |

---

## Phase 6: Response Formatting & Caching (7800–7819)

| Code | Constant | Description |
|------|----------|-------------|
| 7800 | ErrFormatUnsupported | Unsupported output format |
| 7801 | ErrFieldPathInvalid | Invalid field path syntax |
| 7802 | ErrFieldNotFound | Requested field not in data |
| 7803 | ErrFlattenFailed | Failed to flatten nested data |
| 7804 | ErrTemplateNotFound | Output template not found |
| 7805 | ErrTemplateParseFailed | Template parsing failed |
| 7806 | ErrCacheKeyInvalid | Invalid cache key format |
| 7807 | ErrCacheReadFailed | Failed to read from cache |
| 7808 | ErrCacheWriteFailed | Failed to write to cache |
| 7809 | ErrCacheDecompressFailed | Failed to decompress cached data |
| 7810 | ErrTtlOutOfRange | TTL outside allowed range |
| 7811 | ErrTtlPolicyNotFound | TTL policy not configured |
| 7812 | ErrCacheCleanupFailed | Cache cleanup operation failed |
| 7813 | ErrCacheInvalidateFailed | Cache invalidation failed |
| 7814 | ErrStaleDataExpired | Stale data beyond max age |
| 7815 | ErrCacheStatsUnavailable | Cache statistics unavailable |
| 7816 | ErrJsonMarshalFailed | JSON marshaling failed |
| 7817 | ErrCsvEncodeFailed | CSV encoding failed |
| 7818 | ErrMarkdownRenderFailed | Markdown rendering failed |
| 7819 | Reserved | Reserved for future use |

---

## Phase 7: Unified REST API (7820–7839)

| Code | Constant | Description |
|------|----------|-------------|
| 7820 | ErrApiKeyRequired | API key not provided |
| 7821 | ErrApiKeyInvalid | Invalid or expired API key |
| 7822 | ErrRateLimitExceeded | Rate limit exceeded |
| 7823 | ErrRequestBodyInvalid | Invalid request body |
| 7824 | ErrValidationFailed | Request validation failed |
| 7825 | ErrScopeInsufficient | API key lacks required scope |
| 7826 | ErrResourceNotFound | Requested resource not found |
| 7827 | ErrMethodNotAllowed | HTTP method not allowed |
| 7828 | ErrContentTypeInvalid | Invalid Content-Type header |
| 7829 | ErrWebhookUrlInvalid | Invalid webhook URL |
| 7830 | ErrWebhookDeliveryFailed | Webhook delivery failed |
| 7831 | ErrWebhookLimitExceeded | Max webhooks exceeded |
| 7832 | ErrBatchSizeExceeded | Batch size limit exceeded |
| 7833 | ErrJobNotFound | Job ID not found |
| 7834 | ErrJobActionInvalid | Invalid job action |
| 7835 | ErrServerOverloaded | Server temporarily overloaded |
| 7836 | ErrUpstreamTimeout | Upstream service timeout |
| 7837 | ErrSwaggerUnavailable | OpenAPI spec unavailable |
| 7838 | ErrCorsOriginRejected | CORS origin not allowed |
| 7839 | Reserved | Reserved for future use |

---

## Error Response Format

All errors are returned in the standard ResponseEnvelope:

```json
{
  "Success": false,
  "Errors": [
    {
      "Code": 7700,
      "Message": "Search query is empty or whitespace",
      "Field": "Query",
      "Details": "The Query field is required and must contain at least one non-whitespace character"
    }
  ],
  "Meta": {
    "RequestId": "req_abc123",
    "Timestamp": "2026-02-04T12:00:00Z"
  }
}
```

---

## Error Code Constants (Go)

```go
package bierrors

// Phase 1: Multi-Engine Search
const (
    ErrSearchQueryEmpty       = 7700
    ErrSearchQueryTooLong     = 7701
    ErrSearchEngineInvalid    = 7702
    ErrSearchMethodInvalid    = 7703
    ErrSearchApiKeyMissing    = 7704
    ErrSearchApiQuotaExceeded = 7705
    ErrSearchApiResponseInvalid = 7706
    ErrSearchScrapeFailed     = 7707
    ErrSearchScrapeBlocked    = 7708
    ErrSearchScrapeTimeout    = 7709
    ErrSearchNoResults        = 7710
    ErrSearchAggregationFailed = 7711
    ErrSearchDeduplicationFailed = 7712
    ErrSearchEngineTimeout    = 7713
    ErrSearchAllEnginesFailed = 7714
    ErrSearchResultParseFailed = 7715
    ErrSearchProxyFailed      = 7716
    ErrSearchCountInvalid     = 7717
    ErrSearchPagesInvalid     = 7718
)

// Phase 2: FAQ Discovery
const (
    ErrFaqQueryEmpty          = 7720
    ErrFaqNoResults           = 7721
    ErrFaqPaaExpansionFailed  = 7722
    ErrFaqPaaDepthExceeded    = 7723
    ErrFaqSchemaNotFound      = 7724
    ErrFaqSchemaParseFailed   = 7725
    ErrFaqSchemaInvalid       = 7726
    ErrFaqAiOverviewNotFound  = 7727
    ErrFaqAiOverviewParseFailed = 7728
    ErrFaqSourceNotAccessible = 7729
    ErrFaqEnrichmentFailed    = 7730
    ErrFaqAnswerEmpty         = 7731
    ErrFaqQuestionDuplicate   = 7732
    ErrFaqExportFailed        = 7733
    ErrFaqUrlInvalid          = 7734
    ErrFaqRateLimited         = 7735
    ErrFaqCacheFailed         = 7736
)

// Phase 3: SERP Position Tracking
const (
    ErrSerpQueryEmpty         = 7740
    ErrSerpDomainEmpty        = 7741
    ErrSerpDomainInvalid      = 7742
    ErrSerpDomainsExceeded    = 7743
    ErrSerpPositionNotFound   = 7744
    ErrSerpPageRangeInvalid   = 7745
    ErrSerpFetchFailed        = 7746
    ErrSerpParseFailed        = 7747
    ErrTrackerNotFound        = 7748
    ErrTrackerAlreadyExists   = 7749
    ErrTrackerLimitExceeded   = 7750
    ErrTrackerIntervalInvalid = 7751
    ErrTrackerCreateFailed    = 7752
    ErrTrackerUpdateFailed    = 7753
    ErrTrackerDeleteFailed    = 7754
    ErrHistoryNotFound        = 7755
    ErrHistoryDateRangeInvalid = 7756
    ErrAlertConfigInvalid     = 7757
    ErrAlertDeliveryFailed    = 7758
)

// Phase 4: Contact Extraction
const (
    ErrContactUrlEmpty        = 7760
    ErrContactUrlInvalid      = 7761
    ErrContactUrlNotAccessible = 7762
    ErrContactFetchFailed     = 7763
    ErrContactParseFailed     = 7764
    ErrContactPageNotFound    = 7765
    ErrContactNoResults       = 7766
    ErrEmailExtractFailed     = 7767
    ErrEmailFormatInvalid     = 7768
    ErrEmailVerificationFailed = 7769
    ErrEmailClassificationFailed = 7770
    ErrPhoneExtractFailed     = 7771
    ErrPhoneFormatInvalid     = 7772
    ErrPhoneNormalizationFailed = 7773
    ErrSocialExtractFailed    = 7774
    ErrSocialVerificationFailed = 7775
    ErrSocialPlatformUnknown  = 7776
    ErrBatchSizeExceeded      = 7777
    ErrBatchNotFound          = 7778
)

// Phase 5: Google Maps
const (
    ErrMapsQueryEmpty         = 7780
    ErrMapsLocationEmpty      = 7781
    ErrMapsLocationInvalid    = 7782
    ErrMapsFetchFailed        = 7783
    ErrMapsParseFailed        = 7784
    ErrMapsCaptcha            = 7785
    ErrMapsBlocked            = 7786
    ErrMapsTimeout            = 7787
    ErrMapsNoResults          = 7788
    ErrMapsJobNotFound        = 7789
    ErrMapsJobCreateFailed    = 7790
    ErrMapsJobUpdateFailed    = 7791
    ErrMapsJobLimitExceeded   = 7792
    ErrMapsEnrichmentFailed   = 7793
)

// Phase 6: Response Formatting & Caching
const (
    ErrFormatUnsupported      = 7800
    ErrFieldPathInvalid       = 7801
    ErrFieldNotFound          = 7802
    ErrFlattenFailed          = 7803
    ErrTemplateNotFound       = 7804
    ErrTemplateParseFailed    = 7805
    ErrCacheKeyInvalid        = 7806
    ErrCacheReadFailed        = 7807
    ErrCacheWriteFailed       = 7808
    ErrCacheDecompressFailed  = 7809
    ErrTtlOutOfRange          = 7810
    ErrTtlPolicyNotFound      = 7811
    ErrCacheCleanupFailed     = 7812
    ErrCacheInvalidateFailed  = 7813
    ErrStaleDataExpired       = 7814
    ErrCacheStatsUnavailable  = 7815
    ErrJsonMarshalFailed      = 7816
    ErrCsvEncodeFailed        = 7817
    ErrMarkdownRenderFailed   = 7818
)

// Phase 7: REST API
const (
    ErrApiKeyRequired         = 7820
    ErrApiKeyInvalid          = 7821
    ErrRateLimitExceeded      = 7822
    ErrRequestBodyInvalid     = 7823
    ErrValidationFailed       = 7824
    ErrScopeInsufficient      = 7825
    ErrResourceNotFound       = 7826
    ErrMethodNotAllowed       = 7827
    ErrContentTypeInvalid     = 7828
    ErrWebhookUrlInvalid      = 7829
    ErrWebhookDeliveryFailed  = 7830
    ErrWebhookLimitExceeded   = 7831
    ErrBatchSizeExceeded      = 7832
    ErrJobNotFound            = 7833
    ErrJobActionInvalid       = 7834
    ErrServerOverloaded       = 7835
    ErrUpstreamTimeout        = 7836
    ErrSwaggerUnavailable     = 7837
    ErrCorsOriginRejected     = 7838
)

// ErrorMessages maps codes to messages
var ErrorMessages = map[int]string{
    ErrSearchQueryEmpty:       "Search query is empty or whitespace",
    ErrSearchQueryTooLong:     "Query exceeds maximum length",
    // ... all other mappings
}

// NewBiError creates a structured BI error
func NewBiError(code int, field string, details string) *BiError {
    return &BiError{
        Code:    code,
        Message: ErrorMessages[code],
        Field:   field,
        Details: details,
    }
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| BI Suite Summary | `40-bi-suite-summary.md` |
| Global Error Codes | `15-error-codes.md` |
| Error Code Registry | `.lovable/memories/technical/error-code-registry.md` |
| Multi-Engine Search | `42-multi-engine-search.md` |
| FAQ Discovery | `43-faq-discovery-ai-overview.md` |
| SERP Tracking | `44-serp-position-tracking.md` |
| Contact Extraction | `45-contact-extraction.md` |
| Google Maps | `46-google-maps-search.md` |
| Response Formatting | `47-response-formatting-caching.md` |
| REST API | `48-unified-rest-api.md` |
