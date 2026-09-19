# Shared Preset Data — Usage Guide

**Version:** 1.0.0  
**Last Updated:** 2026-03-20

---

## Overview

Patterns for loading and using preset data in Go backend tests and React frontend components.

---

## Go: Loading Presets

```go
func LoadPreset[T any](presetPath string) appfault.Result[T] {
    fullPath := filepath.Join("data/presets", presetPath)
    data, err := pathutil.ReadFile(fullPath)
    if err != nil {
        return appfault.Fail[T](err)
    }
    
    var preset T
    if unmarshalErr := json.Unmarshal(data, &preset); unmarshalErr != nil {
        return appfault.Fail[T](appfault.Wrap(unmarshalErr, appfault.ErrJsonParse, "unmarshal preset"))
    }
    
    return appfault.Ok(preset)
}
```

### Test Usage

```go
func TestSearchWithPreset(t *testing.T) {
    preset, err := LoadPreset[SearchPreset]("search/carpet-cleaning-results.json")
    require.NoError(t, err)
    
    for _, result := range preset.Results {
        // Test extraction, authority, etc.
    }
}
```

---

## TypeScript: Loading Presets

```typescript
// hooks/usePresets.ts
export function usePresets() {
  return useQuery({
    queryKey: ['presets'],
    queryFn: async () => {
      const response = await fetch('/api/testing/presets');
      return response.json() as PresetCollection[];
    },
  });
}

// Usage in component
const { data: presets } = usePresets();
const searchPresets = presets?.find(c => c.id === 'search')?.presets ?? [];
```

---

## Conventions

1. **Preset IDs** use lowercase kebab-case matching the filename without extension
2. **All dates** are ISO-8601 UTC
3. **URLs** use `example.com` or `example-*.com` domains (never real domains)
4. **Numeric data** uses realistic but fictional values
5. **Preset files** are JSON with a top-level `PresetId` field for identification

---

## Cross-References

- [Overview](./00-overview.md)
- [Search Presets](./01-search-presets.md)
