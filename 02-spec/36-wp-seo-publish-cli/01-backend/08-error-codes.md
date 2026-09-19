# WP SEO Publish CLI: Error Codes

**Version:** 2.0.0  
**Updated:** 2026-03-09  

---

## Overview

Error codes for WordPress SEO Publish CLI are in the 12000-12599 range.

---

## Error Code Registry

### Connection Errors (12000-12099)

| Code | Constant | Message | Recovery |
|------|----------|---------|----------|
| 12000 | CONNECTION_FAILED | WordPress connection failed | Verify site URL and credentials |
| 12001 | AUTH_FORBIDDEN | Access forbidden | Check user permissions |
| 12002 | AUTH_UNAUTHORIZED | Invalid credentials | Verify application password |
| 12003 | SITE_NOT_FOUND | WordPress site not found | Check site URL |
| 12004 | API_VERSION_MISMATCH | Unsupported API version | Upgrade WordPress |
| 12005 | SSL_ERROR | SSL certificate error | Verify SSL configuration |
| 12006 | TIMEOUT | Connection timeout | Check network or increase timeout |
| 12007 | RATE_LIMITED | Rate limit exceeded | Wait before retrying |
| 12010 | WEBSITE_NOT_REGISTERED | Website not registered | Connect first |
| 12011 | CREDENTIAL_DECRYPT_FAILED | Failed to decrypt credentials | Re-enter credentials |

### Publishing Errors (12100-12199)

| Code | Constant | Message | Recovery |
|------|----------|---------|----------|
| 12100 | PUBLISH_FAILED | Publishing failed | Check error details |
| 12101 | CREATE_POST_FAILED | Failed to create post | Verify content and permissions |
| 12102 | UPDATE_POST_FAILED | Failed to update post | Verify post exists |
| 12103 | DELETE_POST_FAILED | Failed to delete post | Verify permissions |
| 12104 | INVALID_POST_ID | Invalid post ID | Check post ID |
| 12105 | CREATE_PAGE_FAILED | Failed to create page | Verify permissions |
| 12106 | CREATE_CATEGORY_FAILED | Failed to create category | Category may exist |
| 12107 | CREATE_TAG_FAILED | Failed to create tag | Tag may exist |
| 12108 | MEDIA_UPLOAD_FAILED | Failed to upload media | Check file format |
| 12110 | INVALID_CONTENT_TYPE | Invalid content type | Use: post, page, category, tag |
| 12111 | INVALID_STATUS | Invalid post status | Use: publish, draft, pending |
| 12112 | CATEGORY_NOT_FOUND | Category not found | Sync categories first |
| 12113 | TAG_NOT_FOUND | Tag not found | Sync tags first |
| 12120 | BATCH_PARTIAL_FAILURE | Some items failed | Check individual results |
| 12121 | BATCH_CANCELLED | Batch operation cancelled | Restart if needed |

### AI Bridge Integration Errors (12200-12299)

| Code | Constant | Message | Recovery |
|------|----------|---------|----------|
| 12200 | AI_BRIDGE_UNAVAILABLE | AI Bridge CLI not available | Start AI Bridge CLI |
| 12201 | AI_GENERATION_FAILED | Content generation failed | Check AI Bridge logs |
| 12202 | AI_STREAM_ERROR | Streaming error | Retry request |
| 12203 | AI_TIMEOUT | AI request timeout | Increase timeout or simplify request |
| 12204 | AI_INVALID_RESPONSE | Invalid AI response | Report bug |
| 12210 | CATEGORY_SUGGESTION_FAILED | Failed to get category suggestions | Provide more content |
| 12211 | TAG_SUGGESTION_FAILED | Failed to get tag suggestions | Provide more content |
| 12220 | SITEMAP_INDEX_FAILED | Sitemap indexing failed | Check sitemap URL |
| 12221 | RAG_NOT_AVAILABLE | RAG context not available | Index sitemap first |
| 12222 | REWRITE_FAILED | Content rewrite failed | Check original content |

### Variable Processing Errors (12300-12399)

| Code | Constant | Message | Recovery |
|------|----------|---------|----------|
| 12300 | VARIABLE_IMPORT_FAILED | Variable import failed | Check file format |
| 12301 | CSV_PARSE_ERROR | CSV parsing error | Verify CSV format |
| 12302 | JSON_PARSE_ERROR | JSON parsing error | Verify JSON format |
| 12303 | YAML_PARSE_ERROR | YAML parsing error | Verify YAML format |
| 12304 | VARIABLE_NOT_FOUND | Variable not found | Check variable key |
| 12305 | INVALID_SCOPE | Invalid variable scope | Use: global, website, content, instance |
| 12306 | TEMPLATE_SYNTAX_ERROR | Template syntax error | Check {{variable}} syntax |
| 12307 | VARIABLE_TYPE_MISMATCH | Variable type mismatch | Check expected type |
| 12310 | SOURCE_NOT_FOUND | Variable source not found | Import source first |
| 12311 | SOURCE_EMPTY | Variable source is empty | Add data to source |
| 12312 | ROW_OUT_OF_RANGE | Row index out of range | Check row count |

### Import/Export Errors (12400-12499)

| Code | Constant | Message | Recovery |
|------|----------|---------|----------|
| 12400 | EXPORT_FAILED | Export failed | Check disk space |
| 12401 | IMPORT_FAILED | Import failed | Check file format |
| 12402 | INVALID_EXPORT_FORMAT | Invalid export format | Use: json, zip |
| 12403 | CORRUPT_IMPORT_FILE | Corrupt import file | Re-export source |
| 12404 | VERSION_MISMATCH | Import version mismatch | Upgrade CLI |
| 12410 | RESET_FAILED | Reset operation failed | Check database access |
| 12411 | RESET_CONFIRMATION_MISMATCH | Reset confirmation mismatch | Use exact phrase |

### Database Errors (12500-12519)

| Code | Constant | Message | Recovery |
|------|----------|---------|----------|
| 12500 | DB_OPEN_FAILED | Failed to open database | Check file permissions |
| 12501 | DB_QUERY_FAILED | Database query failed | Check SQL syntax |
| 12502 | DB_WRITE_FAILED | Failed to write to database | Check disk space |
| 12503 | DB_SCHEMA_ERROR | Schema migration error | Report bug |
| 12504 | DB_CORRUPTION | Database corruption detected | Restore from backup |
| 12510 | WEBSITE_DB_NOT_FOUND | Website database not found | Re-connect website |
| 12511 | PUBLICATION_DB_ERROR | Publication database error | Check publication ID |

### Settings Errors (12520-12527)

| Code | Constant | Message | Recovery |
|------|----------|---------|----------|
| 12520 | SETTINGS_NOT_FOUND | Setting key not found | Check setting key |
| 12521 | CATEGORY_NOT_FOUND | Category does not exist | Use valid category |
| 12522 | TYPE_MISMATCH | Value type mismatch | Check expected type |
| 12523 | SEED_PARSE_ERROR | Failed to parse seed file | Verify seed JSON format |
| 12524 | SEED_VERSION_ERROR | Seed version comparison failed | Check version string |
| 12525 | CACHE_ERROR | Cache invalidation failed | Restart service |
| 12526 | VALIDATION_ERROR | Value failed validation | Check value constraints |
| 12527 | DATABASE_ERROR | Database operation failed | Check database access |

---

## Error Structure

```go
type WpSeoError struct {
    Code    int
    Message string
    Details string `json:",omitempty"`
    Cause   error  `json:"-"` // EXEMPTED: AppError internal cause (I-2)
}

func (e WPSEOError) Error() string {
    if e.Details != "" {
        return fmt.Sprintf("[%d] %s: %s", e.Code, e.Message, e.Details)
    }
    return fmt.Sprintf("[%d] %s", e.Code, e.Message)
}

// Error constructors
func ErrConnectionFailed(cause error) WPSEOError {
    return WPSEOError{
        Code:    12000,
        Message: "WordPress connection failed",
        Details: cause.Error(),
        Cause:   cause,
    }
}

func ErrPublishFailed(contentType string, cause error) WPSEOError {
    return WPSEOError{
        Code:    12100,
        Message: "Publishing failed",
        Details: fmt.Sprintf("Content type: %s, Error: %s", contentType, cause.Error()),
        Cause:   cause,
    }
}

func ErrVariableNotFound(key string) WPSEOError {
    return WPSEOError{
        Code:    12304,
        Message: "Variable not found",
        Details: fmt.Sprintf("Key: %s", key),
    }
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `01-architecture.md` |
| Error Code Registry | `../../03-error-manage/03-error-code-registry/01-index.md` |
| AI Bridge Error Codes | `../../27-ai-bridge-cli/01-backend/05-error-codes.md` |
