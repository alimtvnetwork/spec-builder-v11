# Shared Preset Data — Extract Presets

**Version:** 1.0.0  
**Last Updated:** 2026-03-20

---

## Overview

Presets for extracted article content, domain authority metrics, and writing style profiles. Used by the URL extraction and content analysis pipelines.

---

## Schema: Extracted Article

```json
{
  "PresetId": "string",
  "Url": "string",
  "Title": "string",
  "ExtractedAt": "ISO-8601",
  "WordCount": "number",
  "ReadingTime": "string",
  "Content": {
    "Text": "string",
    "Markdown": "string",
    "SimpleHtml": "string"
  },
  "Structure": {
    "Headings": [{ "Level": "number", "Text": "string" }],
    "HeaderSections": [{ "Level": "number", "Title": "string", "Content": "string", "Children": [] }]
  },
  "Metadata": {
    "Author": "string",
    "PublishedDate": "date",
    "ModifiedDate": "date",
    "Language": "string"
  },
  "Authority": {
    "DomainAuthority": "number",
    "PageAuthority": "number",
    "BacklinkCount": "number",
    "ReferringDomains": "number",
    "OrganicTraffic": "number",
    "TrafficValue": "number",
    "Source": "openpagerank | ahrefs | moz",
    "FetchedAt": "ISO-8601"
  },
  "Style": {
    "SentenceMetrics": { "Total": "number", "AvgLength": "number", "StdDev": "number" },
    "ParagraphMetrics": { "Total": "number", "AvgLength": "number", "AvgSentences": "number" },
    "ToneAnalysis": { "FormalityScore": "0-1", "ReadabilityScore": "number", "SentimentScore": "-1 to 1" },
    "TransitionAnalysis": { "TransitionWordRate": "0-1", "CommonTransitions": ["string"] }
  }
}
```

---

## Schema: Authority Data

```json
{
  "PresetId": "string",
  "Domains": [
    {
      "Domain": "string",
      "DomainAuthority": "number",
      "PageAuthority": "number",
      "BacklinkCount": "number",
      "ReferringDomains": "number",
      "OrganicTraffic": "number",
      "TrafficValue": "number",
      "TopKeywords": ["string"],
      "Source": "openpagerank | ahrefs | moz"
    }
  ]
}
```

---

## Available Presets

### Articles

| Preset ID | Domain | Word Count | Authority |
|-----------|--------|-----------|-----------|
| `carpet-guide-example-com` | example-cleaning.com | 2,450 | DA 67 |
| `hvac-tips-competitor` | hvac-expert.com | 1,800 | DA 54 |
| `cleaning-best-practices` | cleaninginstitute.org | 3,100 | DA 58 |

### Authority Datasets

| Preset ID | Domains | Sources |
|-----------|---------|---------|
| `high-authority-domains` | 3 | openpagerank, ahrefs, moz |
| `competitor-analysis` | 5 | openpagerank |
| `local-business-domains` | 8 | moz |

### Style Profiles

| Preset ID | Tone | Formality | Readability |
|-----------|------|-----------|-------------|
| `professional-style-profile` | Professional | 0.72 | 9th grade |
| `conversational-style-profile` | Conversational | 0.45 | 7th grade |
| `technical-style-profile` | Technical | 0.85 | 12th grade |

---

## Cross-References

- [Search Presets](./01-search-presets.md)
- [Company Presets](./03-company-presets.md)
