# Memory: architecture/coding-standards/json-serialization

**Updated:** 2026-02-25  
**Version:** 1.0.0  
**Scope:** All CLI Tools  

---

## Rule

Go struct definitions **must omit redundant JSON tags**. Explicit tags are permitted **only** for:

1. **Functional modifiers**: `json:",omitempty"`, `json:",inline"`
2. **Field exclusion**: `json:"-"`
3. **Special characters in keys**: `json:"@type"` (JSON-LD), `json:"_type"` (Bing API prefix)

## Prohibited

```go
// ❌ Redundant — field name matches JSON key (case-insensitive)
Title string `json:"Title"`
Title string `json:"title"`

// ❌ Redundant — Go decoder matches case-insensitively
AbstractUrl string `json:"AbstractURL"`
SessionId   string `json:"sessionId"`
```

## Correct

```go
// ✅ No tag — Go uses field name automatically
Title       string
AbstractUrl string
SessionId   string

// ✅ Functional modifier only
Description string `json:",omitempty"`
Password    string `json:"-"`

// ✅ Special characters — cannot be expressed as Go identifiers
Type string `json:"@type"`  // JSON-LD
Kind string `json:"_type"`  // Bing API
```

## External API Responses

Go's `encoding/json` decoder performs **case-insensitive key matching**. This means explicit mapping tags are unnecessary even when consuming external APIs that use different casing conventions (camelCase, ALLCAPS, etc.):

```go
// DuckDuckGo API returns {"AbstractURL": "..."} — matches without tag
type InstantAnswer struct {
    AbstractUrl string  // Matches "AbstractURL" case-insensitively
    FirstUrl    string  // Matches "FirstURL" case-insensitively
}

// Bing API returns {"totalEstimatedMatches": 500} — matches without tag
type BingWebPages struct {
    TotalEstimatedMatches int64  // Matches case-insensitively
}
```

**Exception:** Tags are still required for keys containing characters that cannot appear in Go identifiers (`@`, `_` prefix, hyphens).

## YAML/TOML Tags

Same rule applies — omit redundant `yaml:` and `toml:` tags. Only use for functional modifiers or when the key genuinely differs from the field name in a way that case-insensitive matching cannot resolve.

---

*PascalCase field names. No redundant tags. No exceptions.*
