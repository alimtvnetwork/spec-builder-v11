# Shared Preset Data — Company Presets

**Version:** 1.0.0  
**Last Updated:** 2026-03-20

---

## Overview

Demo company profiles for AI Bridge CLI testing, including company metadata, training articles, style profiles, CTA configuration, and sample generated content (blogs, FAQs, paragraphs).

---

## Schema: Company Profile

```json
{
  "PresetId": "string",
  "CompanySlug": "string",
  "CompanyName": "string",
  "Tagline": "string",
  "Industry": "string",
  "Location": {
    "City": "string", "State": "string", "Country": "string", "ServiceRadius": "string"
  },
  "Services": [{ "Name": "string", "Description": "string", "PriceRange": "string" }],
  "Ctas": [{ "Type": "phone | url | email", "Value": "string", "DisplayText": "string", "Priority": "number" }],
  "StyleProfile": {
    "Tone": "string", "VoicePattern": "string",
    "FormalityTarget": "0-1", "ReadabilityTarget": "string",
    "TransitionWords": ["string"]
  },
  "TrainingArticleCount": "number",
  "LastUpdated": "ISO-8601"
}
```

---

## Available Demo Companies

| Slug | Name | Industry | Services | Location |
|------|------|----------|----------|----------|
| `demo-cleaning` | Acme Professional Cleaning | Cleaning Services | 3 | Austin, TX |
| `demo-hvac` | CoolAir HVAC Solutions | HVAC | 4 | Denver, CO |
| `demo-plumbing` | QuickFix Plumbing | Plumbing | 3 | Portland, OR |

---

## Training Articles Schema

```json
{
  "PresetId": "string",
  "CompanySlug": "string",
  "Articles": [
    {
      "Id": "string",
      "SourceUrl": "string",
      "Title": "string",
      "WordCount": "number",
      "DomainAuthority": "number",
      "StyleScore": "0-1",
      "ExtractedAt": "ISO-8601",
      "ChunkCount": "number",
      "TopKeywords": ["string"]
    }
  ],
  "AggregatedStyleProfile": {
    "AvgSentenceLength": "number",
    "FormalityScore": "0-1",
    "ReadabilityGrade": "string",
    "TopTransitions": ["string"],
    "CommonPhrases": [{ "Phrase": "string", "Frequency": "number" }]
  }
}
```

---

## Generated Content Samples

Each demo company includes pre-generated content samples for testing rendering and quality comparison:

| Company | Sample Type | File |
|---------|------------|------|
| `demo-cleaning` | Blog post | `generated-samples/blog-stain-removal.md` |
| `demo-cleaning` | FAQ | `generated-samples/faq-pricing.json` |
| `demo-cleaning` | Paragraphs | `generated-samples/paragraphs-services.json` |

### Sample FAQ Schema

```json
{
  "PresetId": "string",
  "CompanySlug": "string",
  "Topic": "string",
  "GeneratedAt": "ISO-8601",
  "Faqs": [
    {
      "Question": "string",
      "Answer": "string",
      "Keywords": ["string"]
    }
  ]
}
```

---

## Cross-References

- [Extract Presets](./02-extract-presets.md)
- [Infrastructure Presets](./04-infrastructure-presets.md)
- [AI Bridge Company Profiles](../27-ai-bridge-cli/01-backend/28-company-profile-management.md)
