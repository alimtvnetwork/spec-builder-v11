# Shared Preset Data — Acceptance Criteria

**Version:** 1.0.0  
**Last Updated:** 2026-03-20

---

## AC-01: Preset File Integrity

- [ ] All preset JSON files parse without errors
- [ ] Every preset has a unique `PresetId` field
- [ ] All dates are valid ISO-8601 UTC strings
- [ ] All URLs use `example.com` or `example-*.com` domains

## AC-02: Search Presets

- [ ] Each search preset includes at least 3 results across multiple engines
- [ ] Results contain all required fields: `Rank`, `Title`, `Url`, `Snippet`, `Domain`, `Engine`, `Position`
- [ ] Nested search results reference valid source URLs from the parent results

## AC-03: Extract Presets

- [ ] Extracted articles include `Content`, `Structure`, `Metadata`, `Authority`, and `Style` sections
- [ ] Authority scores are within realistic ranges (DA 1–100, PA 1–100)
- [ ] Style metrics are internally consistent (e.g., `AvgLength` matches `Total` / count)

## AC-04: Company Presets

- [ ] Each demo company has a valid profile, training articles, and style profile
- [ ] CTA configurations include at least one `phone` and one `url` type
- [ ] Generated content samples render correctly in their target formats (markdown for blogs, JSON for FAQs)

## AC-05: Infrastructure Presets

- [ ] Proxy pool presets include at least one active and one disabled proxy for edge case testing
- [ ] API key pool presets include at least one exhausted key for quota handling testing
- [ ] RAG chunk data includes valid embedding vectors of consistent dimensionality

## AC-06: Loading & Usage

- [ ] `LoadPreset[T]()` Go function successfully deserializes all preset files
- [ ] TypeScript `usePresets()` hook returns correctly typed data
- [ ] Preset loading fails gracefully with descriptive errors for missing or malformed files

---

## Cross-References

- [Overview](./00-overview.md)
- [Usage Guide](./05-usage-guide.md)
