# GSearch Enum Architecture Specification

> **Phase:** Foundation  
> **Status:** Active — v3.0.0 compliant  
> **Created:** 2026-02-05  
> **Updated:** 2026-03-09  
**Version:** 1.0.0  
> **Error Range:** 7900-7919  
> **Parent:** `00-overview.md`  
> **Compliance:** ✅ Enum Specification v2.0.0

---

## 1. Overview

Enum-based architecture for GSearch CLI providing type-safe, extensible configuration for providers, platforms, search engines, and all configurable options. All enums follow the universal `byte` variant pattern from `02-spec/02-coding-guidelines/03-golang/01-enum-specification/` for memory efficiency, type safety, and consistency.

---

## 2. Directory Structure

```
internal/
└── enums/
    ├── providertype/
    │   └── variant.go           # SerpApi, MapsScraper, Colly
    ├── platformtype/
    │   └── variant.go           # YouTube, Reddit, Medium, LinkedIn, etc.
    ├── enginetype/
    │   └── variant.go           # Google, Bing, DuckDuckGo
    ├── devicetype/
    │   └── variant.go           # Desktop, Mobile, Tablet
    ├── outputtype/
    │   └── variant.go           # JSON, CSV, Table, Markdown
    ├── scheduletype/
    │   └── variant.go           # Cron, Interval, OneTime
    ├── conflicttype/
    │   └── variant.go           # Merge, DbWins, FileWins, Timestamp
    ├── resulttype/
    │   └── variant.go           # Organic, Featured, LocalPack, etc.
    ├── searchmodetype/
    │   └── variant.go           # Sequential, Parallel, RoundRobin
    ├── socialmediatype/
    │   └── variant.go           # LinkedIn, Instagram, Twitter, etc.
    ├── movieprovidertype/
    │   └── variant.go           # TMDB, OMDB, Trakt, IMDB
    ├── moviesearchmodetype/
    │   └── variant.go           # Movie, Series, Episode
    ├── searchstatustype/
    │   └── variant.go           # Pending, Running, Completed, Failed
    ├── proxytype/
    │   └── variant.go           # Http, Socks5, None
    ├── rotationstrategytype/
    │   └── variant.go           # RoundRobin, Random, LeastUsed
    ├── logleveltype/
    │   └── variant.go           # Debug, Info, Warn, Error
    └── registry.go              # Central enum registry
```

---

## 3. Enum Definitions

### 3.1 Provider Enum

```go
// internal/enums/providertype/variant.go
package providertype

import (
    "encoding/json"
    "gsearch/pkg/appfault"
    "strings"
)

// Variant represents a SERP data provider
type Variant byte

const (
    // Invalid is the zero value (invalid/unset)
    Invalid Variant = iota
    
    // SerpApi is the commercial SerpApi service
    SerpApi
    
    // MapsScraper is gosom/google-maps-scraper
    MapsScraper
    
    // Colly is the Colly web scraper
    Colly
)

var variantLabels = [...]string{
    Invalid:     "Invalid",
    SerpApi:     "SerpApi",
    MapsScraper: "MapsScraper",
    Colly:       "Colly",
}

// String returns the PascalCase string representation
func (v Variant) String() string {
    if v.IsInvalid() {
        return variantLabels[Invalid]
    }
    return variantLabels[v]
}

// Label delegates to String — single lookup table
func (v Variant) Label() string {
    return v.String()
}

// IsValid checks if the variant is valid (non-Invalid)
func (v Variant) IsValid() bool {
    return v > Invalid && v < Variant(len(variantLabels))
}

// Type-check methods
func (v Variant) IsInvalid() bool     { return v == Invalid }
func (v Variant) IsSerpApi() bool     { return v == SerpApi }
func (v Variant) IsMapsScraper() bool { return v == MapsScraper }
func (v Variant) IsColly() bool       { return v == Colly }

// All returns all valid variants (excludes Invalid)
func All() []Variant {
    return []Variant{SerpApi, MapsScraper, Colly}
}

// ByIndex returns variant by index, Invalid if out of range
func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) {
        return Invalid
    }
    return Variant(i)
}

// Parse converts a string to Variant (case-insensitive)
func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrInvalidVariant,
        "invalid provider: "+s,
    ))
}

// Values returns all string values for CLI help
func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] {
        result = append(result, s)
    }
    return result
}

// MarshalJSON implements json.Marshaler
func (v Variant) MarshalJSON() ([]byte, error) {
    return json.Marshal(v.String())
}

// UnmarshalJSON implements json.Unmarshaler
func (v *Variant) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return err
    }

    parsed, err := Parse(s)
    if err != nil {
        return err
    }

    *v = parsed
    return nil
}

// Domain-specific methods

// RequiresApiKey returns true if provider needs an API key
func (v Variant) RequiresApiKey() bool {
    return v == SerpApi
}

// SupportsParallel returns true if provider supports concurrent requests
func (v Variant) SupportsParallel() bool {
    return v == Colly
}

// DefaultConcurrency returns the default concurrent request limit
func (v Variant) DefaultConcurrency() int {
    switch v {
    case SerpApi:
        return 5
    case MapsScraper:
        return 10
    case Colly:
        return 50
    default:
        return 1
    }
}

// Description returns human-readable description
func (v Variant) Description() string {
    switch v {
    case SerpApi:
        return "SerpApi - Commercial SERP data provider with high reliability"
    case MapsScraper:
        return "Maps Scraper - Open-source Google Maps scraping (gosom)"
    case Colly:
        return "Colly - High-performance parallel web scraping framework"
    default:
        return "Invalid provider"
    }
}
```

### 3.2 Platform Enum

```go
// internal/enums/platformtype/variant.go
package platformtype

import (
    "encoding/json"
    "gsearch/pkg/appfault"
    "strings"
)

// Variant represents a search platform
type Variant byte

const (
    // Invalid is the zero value (invalid/unset)
    Invalid Variant = iota
    Google
    Bing
    DuckDuckGo
    YouTube
    Reddit
    Medium
    LinkedIn
    Instagram
    Twitter
    GitHub
    StackOverflow
)

var variantLabels = [...]string{
    Invalid:       "Invalid",
    Google:        "Google",
    Bing:          "Bing",
    DuckDuckGo:    "DuckDuckGo",
    YouTube:       "YouTube",
    Reddit:        "Reddit",
    Medium:        "Medium",
    LinkedIn:      "LinkedIn",
    Instagram:     "Instagram",
    Twitter:       "Twitter",
    GitHub:        "GitHub",
    StackOverflow: "StackOverflow",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool {
    return v > Invalid && v < Variant(len(variantLabels))
}

func (v Variant) IsInvalid() bool       { return v == Invalid }
func (v Variant) IsGoogle() bool        { return v == Google }
func (v Variant) IsBing() bool          { return v == Bing }
func (v Variant) IsDuckDuckGo() bool    { return v == DuckDuckGo }
func (v Variant) IsYouTube() bool       { return v == YouTube }
func (v Variant) IsReddit() bool        { return v == Reddit }
func (v Variant) IsMedium() bool        { return v == Medium }
func (v Variant) IsLinkedIn() bool      { return v == LinkedIn }
func (v Variant) IsInstagram() bool     { return v == Instagram }
func (v Variant) IsTwitter() bool       { return v == Twitter }
func (v Variant) IsGitHub() bool        { return v == GitHub }
func (v Variant) IsStackOverflow() bool { return v == StackOverflow }

func All() []Variant {
    return []Variant{
        Google, Bing, DuckDuckGo,
        YouTube, Reddit, Medium,
        LinkedIn, Instagram, Twitter,
        GitHub, StackOverflow,
    }
}

func SearchEngines() []Variant { return []Variant{Google, Bing, DuckDuckGo} }
func SocialMedia() []Variant   { return []Variant{LinkedIn, Instagram, Twitter, Reddit} }
func ContentPlatforms() []Variant { return []Variant{YouTube, Medium, GitHub, StackOverflow} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}

func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrInvalidVariant,
        "invalid platform: "+s,
    ))
}

// Note: VariantSlice is defined in types.go (created from generic appfault.ResultSlice[Variant]):
// type VariantSlice = appfault.ResultSlice[Variant]
func ParseMultiple(s string) VariantSlice {
    if s == "" {
        return appfault.OkSlice([]Variant{})
    }
    parts := strings.Split(s, ",")
    variants := make([]Variant, 0, len(parts))
    for _, p := range parts {
        res := Parse(strings.TrimSpace(p))
        if res.HasError() {
            return appfault.FailSlice[Variant](res.AppError())
        }
        variants = append(variants, res.Value())
    }
    return appfault.OkSlice(variants)
}

func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] {
        result = append(result, s)
    }

    return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
    return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return err
    }

    parsed, err := Parse(s)
    if err != nil {
        return err
    }

    *v = parsed

    return nil
}

// Domain-specific methods

func (v Variant) BaseUrl() string {
    switch v {
    case Google:        return "https://www.google.com/search"
    case Bing:          return "https://www.bing.com/search"
    case DuckDuckGo:    return "https://duckduckgo.com/"
    case YouTube:       return "https://www.youtube.com/results"
    case Reddit:        return "https://www.reddit.com/search"
    case Medium:        return "https://medium.com/search"
    case LinkedIn:      return "https://www.linkedin.com/search"
    case Instagram:     return "https://www.instagram.com/explore/tags"
    case Twitter:       return "https://twitter.com/search"
    case GitHub:        return "https://github.com/search"
    case StackOverflow: return "https://stackoverflow.com/search"
    default:            return ""
    }
}

func (v Variant) SiteOperator() string {
    switch v {
    case YouTube:       return "site:youtube.com"
    case Reddit:        return "site:reddit.com"
    case Medium:        return "site:medium.com"
    case LinkedIn:      return "site:linkedin.com"
    case Instagram:     return "site:instagram.com"
    case Twitter:       return "site:twitter.com OR site:x.com"
    case GitHub:        return "site:github.com"
    case StackOverflow: return "site:stackoverflow.com"
    default:            return ""
    }
}

func (v Variant) IsSearchEngine() bool {
    return v == Google || v == Bing || v == DuckDuckGo
}

func (v Variant) IsSocialMedia() bool {
    switch v {
    case LinkedIn, Instagram, Twitter, Reddit: return true
    default: return false
    }
}
```

### 3.3 Engine Enum

```go
// internal/enums/enginetype/variant.go
package enginetype

import (
    "encoding/json"
    "gsearch/pkg/appfault"
    "strings"
)

type Variant byte

const (
    Invalid Variant = iota
    Google
    Bing
    DuckDuckGo
)

var variantLabels = [...]string{
    Invalid:    "Invalid",
    Google:     "Google",
    Bing:       "Bing",
    DuckDuckGo: "DuckDuckGo",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool    { return v == Invalid }
func (v Variant) IsGoogle() bool     { return v == Google }
func (v Variant) IsBing() bool       { return v == Bing }
func (v Variant) IsDuckDuckGo() bool { return v == DuckDuckGo }

func All() []Variant     { return []Variant{Google, Bing, DuckDuckGo} }
func Default() Variant   { return Google }
func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}

func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrInvalidVariant,
        "invalid engine: "+s,
    ))
}

func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] {
        result = append(result, s)
    }

    return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
    return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return err
    }

    parsed, err := Parse(s)
    if err != nil {
        return err
    }

    *v = parsed

    return nil
}

// Domain-specific
func (v Variant) ResultsPerPage() int {
    switch v {
    case Google: return 10
    case Bing: return 10
    case DuckDuckGo: return 25
    default: return 10
    }
}

func (v Variant) MaxConcurrent() int {
    switch v {
    case Google: return 5
    case Bing: return 10
    case DuckDuckGo: return 20
    default: return 5
    }
}
```

### 3.4 Search Mode Enum

```go
// internal/enums/searchmodetype/variant.go
package searchmodetype

import (
    "encoding/json"
    "gsearch/pkg/appfault"
    "strings"
)

type Variant byte

const (
    Invalid    Variant = iota
    Sequential
    Parallel
    RoundRobin
)

var variantLabels = [...]string{
    Invalid:    "Invalid",
    Sequential: "Sequential",
    Parallel:   "Parallel",
    RoundRobin: "RoundRobin",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool    { return v == Invalid }
func (v Variant) IsSequential() bool { return v == Sequential }
func (v Variant) IsParallel() bool   { return v == Parallel }
func (v Variant) IsRoundRobin() bool { return v == RoundRobin }

func All() []Variant   { return []Variant{Sequential, Parallel, RoundRobin} }
func Default() Variant { return Parallel }
func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}

func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrInvalidVariant,
        "invalid search mode: "+s,
    ))
}

func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] {
        result = append(result, s)
    }

    return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
    return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return err
    }

    parsed, err := Parse(s)
    if err != nil {
        return err
    }

    *v = parsed

    return nil
}

func (v Variant) Description() string {
    switch v {
    case Sequential: return "Execute searches one by one in order"
    case Parallel:   return "Execute all searches concurrently"
    case RoundRobin: return "Distribute searches across providers in rotation"
    default:         return "Invalid mode"
    }
}
```

### 3.5 Social Media Enum

```go
// internal/enums/socialmediatype/variant.go
package socialmediatype

import (
    "encoding/json"
    "gsearch/pkg/appfault"
    "strings"
)

type Variant byte

const (
    Invalid   Variant = iota
    LinkedIn
    Instagram
    Twitter
    Facebook
    TikTok
    Pinterest
    Reddit
    Discord
    Telegram
)

var variantLabels = [...]string{
    Invalid:   "Invalid",
    LinkedIn:  "LinkedIn",
    Instagram: "Instagram",
    Twitter:   "Twitter",
    Facebook:  "Facebook",
    TikTok:    "TikTok",
    Pinterest: "Pinterest",
    Reddit:    "Reddit",
    Discord:   "Discord",
    Telegram:  "Telegram",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool   { return v == Invalid }
func (v Variant) IsLinkedIn() bool  { return v == LinkedIn }
func (v Variant) IsInstagram() bool { return v == Instagram }
func (v Variant) IsTwitter() bool   { return v == Twitter }
func (v Variant) IsFacebook() bool  { return v == Facebook }
func (v Variant) IsTikTok() bool    { return v == TikTok }
func (v Variant) IsPinterest() bool { return v == Pinterest }
func (v Variant) IsReddit() bool    { return v == Reddit }
func (v Variant) IsDiscord() bool   { return v == Discord }
func (v Variant) IsTelegram() bool  { return v == Telegram }

func All() []Variant {
    return []Variant{LinkedIn, Instagram, Twitter, Facebook, TikTok, Pinterest, Reddit, Discord, Telegram}
}

func Professional() []Variant { return []Variant{LinkedIn} }
func Visual() []Variant       { return []Variant{Instagram, Pinterest, TikTok} }
func Messaging() []Variant    { return []Variant{Discord, Telegram} }

func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}

func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrInvalidVariant,
        "invalid social media: "+s,
    ))
}

func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] {
        result = append(result, s)
    }

    return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
    return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return err
    }

    parsed, err := Parse(s)
    if err != nil {
        return err
    }

    *v = parsed

    return nil
}

func (v Variant) Domain() string {
    switch v {
    case LinkedIn:  return "linkedin.com"
    case Instagram: return "instagram.com"
    case Twitter:   return "twitter.com"
    case Facebook:  return "facebook.com"
    case TikTok:    return "tiktok.com"
    case Pinterest: return "pinterest.com"
    case Reddit:    return "reddit.com"
    case Discord:   return "discord.com"
    case Telegram:  return "telegram.org"
    default:        return ""
    }
}

func (v Variant) ProfileUrlPattern() string {
    switch v {
    case LinkedIn:  return `linkedin\.com/in/([^/]+)`
    case Instagram: return `instagram\.com/([^/]+)`
    case Twitter:   return `(twitter|x)\.com/([^/]+)`
    case Facebook:  return `facebook\.com/([^/]+)`
    case TikTok:    return `tiktok\.com/@([^/]+)`
    case Pinterest: return `pinterest\.com/([^/]+)`
    case Reddit:    return `reddit\.com/user/([^/]+)`
    default:        return ""
    }
}
```

### 3.6 Output Format Enum

```go
// internal/enums/outputtype/variant.go
package outputtype

import (
    "encoding/json"
    "gsearch/pkg/appfault"
    "strings"
)

type Variant byte

const (
    Invalid  Variant = iota
    JSON
    CSV
    Table
    Markdown
    HTML
    YAML
)

var variantLabels = [...]string{
    Invalid:  "Invalid",
    JSON:     "JSON",
    CSV:      "CSV",
    Table:    "Table",
    Markdown: "Markdown",
    HTML:     "HTML",
    YAML:     "YAML",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool  { return v == Invalid }
func (v Variant) IsJson() bool     { return v == JSON }
func (v Variant) IsCsv() bool      { return v == CSV }
func (v Variant) IsTable() bool    { return v == Table }
func (v Variant) IsMarkdown() bool { return v == Markdown }
func (v Variant) IsHtml() bool     { return v == HTML }
func (v Variant) IsYaml() bool     { return v == YAML }

func All() []Variant   { return []Variant{JSON, CSV, Table, Markdown, HTML, YAML} }
func Default() Variant { return JSON }
func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}

func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrInvalidVariant,
        "invalid output format: "+s,
    ))
}

func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] {
        result = append(result, s)
    }

    return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
    return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return err
    }

    parsed, err := Parse(s)
    if err != nil {
        return err
    }

    *v = parsed

    return nil
}

func (v Variant) ContentType() string {
    switch v {
    case JSON:     return "application/json"
    case CSV:      return "text/csv"
    case Table:    return "text/plain"
    case Markdown: return "text/markdown"
    case HTML:     return "text/html"
    case YAML:     return "application/yaml"
    default:       return "text/plain"
    }
}

func (v Variant) FileExtension() string {
    switch v {
    case JSON:     return ".json"
    case CSV:      return ".csv"
    case Table:    return ".txt"
    case Markdown: return ".md"
    case HTML:     return ".html"
    case YAML:     return ".yaml"
    default:       return ".txt"
    }
}
```

### 3.7 Movie Provider Enum

```go
// internal/enums/movieprovidertype/variant.go
package movieprovidertype

import (
    "encoding/json"
    "gsearch/pkg/appfault"
    "strings"
)

type Variant byte

const (
    Invalid Variant = iota
    TMDB
    OMDB
    Trakt
    IMDB
)

var variantLabels = [...]string{
    Invalid: "Invalid",
    TMDB:    "TMDB",
    OMDB:    "OMDB",
    Trakt:   "Trakt",
    IMDB:    "IMDB",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsTMDB() bool    { return v == TMDB }
func (v Variant) IsOMDB() bool    { return v == OMDB }
func (v Variant) IsTrakt() bool   { return v == Trakt }
func (v Variant) IsIMDB() bool    { return v == IMDB }

func All() []Variant   { return []Variant{TMDB, OMDB, Trakt, IMDB} }
func Default() Variant { return TMDB }
func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}

func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrInvalidVariant,
        "invalid movie provider: "+s,
    ))
}

func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] {
        result = append(result, s)
    }

    return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
    return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return err
    }

    parsed, err := Parse(s)
    if err != nil {
        return err
    }

    *v = parsed

    return nil
}

func (v Variant) RequiresApiKey() bool {
    switch v {
    case TMDB, OMDB, Trakt: return true
    default: return false
    }
}

func (v Variant) IsScraper() bool { return v == IMDB }
```

### 3.8 Search Status Enum

```go
// internal/enums/searchstatustype/variant.go
package searchstatustype

import (
    "encoding/json"
    "gsearch/pkg/appfault"
    "strings"
)

type Variant byte

const (
    Invalid   Variant = iota
    Pending
    Running
    Completed
    Failed
    Cancelled
)

var variantLabels = [...]string{
    Invalid:   "Invalid",
    Pending:   "Pending",
    Running:   "Running",
    Completed: "Completed",
    Failed:    "Failed",
    Cancelled: "Cancelled",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool   { return v == Invalid }
func (v Variant) IsPending() bool   { return v == Pending }
func (v Variant) IsRunning() bool   { return v == Running }
func (v Variant) IsCompleted() bool { return v == Completed }
func (v Variant) IsFailed() bool    { return v == Failed }
func (v Variant) IsCancelled() bool { return v == Cancelled }

func All() []Variant { return []Variant{Pending, Running, Completed, Failed, Cancelled} }
func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}

func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrInvalidVariant,
        "invalid search status: "+s,
    ))
}

func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] {
        result = append(result, s)
    }

    return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
    return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return err
    }

    parsed, err := Parse(s)
    if err != nil {
        return err
    }

    *v = parsed

    return nil
}

func (v Variant) IsTerminal() bool {
    switch v {
    case Completed, Failed, Cancelled: return true
    default: return false
    }
}

func (v Variant) IsActive() bool { return v == Pending || v == Running }
```

### 3.9 Log Level Enum

```go
// internal/enums/logleveltype/variant.go
package logleveltype

import (
    "encoding/json"
    "gsearch/pkg/appfault"
    "strings"
)

type Variant byte

const (
    Invalid Variant = iota
    Debug
    Info
    Warn
    Error
)

var variantLabels = [...]string{
    Invalid: "Invalid",
    Debug:   "Debug",
    Info:    "Info",
    Warn:    "Warn",
    Error:   "Error",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsDebug() bool   { return v == Debug }
func (v Variant) IsInfo() bool    { return v == Info }
func (v Variant) IsWarn() bool    { return v == Warn }
func (v Variant) IsError() bool   { return v == Error }

func All() []Variant   { return []Variant{Debug, Info, Warn, Error} }
func Default() Variant { return Info }
func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}

func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrInvalidVariant,
        "invalid log level: "+s,
    ))
}

func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] {
        result = append(result, s)
    }

    return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
    return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return err
    }

    parsed, err := Parse(s)
    if err != nil {
        return err
    }

    *v = parsed

    return nil
}

func (v Variant) Severity() int {
    switch v {
    case Debug: return 1
    case Info:  return 2
    case Warn:  return 3
    case Error: return 4
    default:    return 0
    }
}

func (v Variant) ShouldLog(threshold Variant) bool {
    return v.Severity() >= threshold.Severity()
}
```

### 3.10 Proxy Type Enum

```go
// internal/enums/proxytype/variant.go
package proxytype

import (
    "encoding/json"
    "gsearch/pkg/appfault"
    "strings"
)

type Variant byte

const (
    Invalid Variant = iota
    Http
    Https
    Socks5
    Socks5h
)

var variantLabels = [...]string{
    Invalid: "Invalid",
    Http:    "Http",
    Https:   "Https",
    Socks5:  "Socks5",
    Socks5h: "Socks5h",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool { return v == Invalid }
func (v Variant) IsHttp() bool    { return v == Http }
func (v Variant) IsHttps() bool   { return v == Https }
func (v Variant) IsSocks5() bool  { return v == Socks5 }
func (v Variant) IsSocks5h() bool { return v == Socks5h }

func All() []Variant { return []Variant{Http, Https, Socks5, Socks5h} }
func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}

func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrInvalidVariant,
        "invalid proxy type: "+s,
    ))
}

func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] {
        result = append(result, s)
    }

    return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
    return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return err
    }

    parsed, err := Parse(s)
    if err != nil {
        return err
    }

    *v = parsed

    return nil
}

func (v Variant) DefaultPort() int {
    switch v {
    case Http:            return 8080
    case Https:           return 8443
    case Socks5, Socks5h: return 1080
    default:              return 0
    }
}

func (v Variant) IsSocks() bool { return v == Socks5 || v == Socks5h }
```

### 3.11 Rotation Strategy Enum

```go
// internal/enums/rotationstrategytype/variant.go
package rotationstrategytype

import (
    "encoding/json"
    "gsearch/pkg/appfault"
    "strings"
)

type Variant byte

const (
    Invalid    Variant = iota
    RoundRobin
    Random
    LeastUsed
    Failover
    Weighted
)

var variantLabels = [...]string{
    Invalid:    "Invalid",
    RoundRobin: "RoundRobin",
    Random:     "Random",
    LeastUsed:  "LeastUsed",
    Failover:   "Failover",
    Weighted:   "Weighted",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool    { return v == Invalid }
func (v Variant) IsRoundRobin() bool { return v == RoundRobin }
func (v Variant) IsRandom() bool     { return v == Random }
func (v Variant) IsLeastUsed() bool  { return v == LeastUsed }
func (v Variant) IsFailover() bool   { return v == Failover }
func (v Variant) IsWeighted() bool   { return v == Weighted }

func All() []Variant { return []Variant{RoundRobin, Random, LeastUsed, Failover, Weighted} }
func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}

func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrInvalidVariant,
        "invalid rotation strategy: "+s,
    ))
}

func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] {
        result = append(result, s)
    }

    return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
    return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return err
    }

    parsed, err := Parse(s)
    if err != nil {
        return err
    }

    *v = parsed

    return nil
}

func (v Variant) RequiresWeights() bool     { return v == Weighted }
func (v Variant) RequiresHealthCheck() bool { return v == Failover || v == LeastUsed }
```

### 3.12 Jitter Type Enum

```go
// internal/enums/jittertype/variant.go
package jittertype

import (
    "encoding/json"
    "gsearch/pkg/appfault"
    "strings"
)

type Variant byte

const (
    Invalid      Variant = iota
    Full
    Equal
    Decorrelated
    Bounded
)

var variantLabels = [...]string{
    Invalid:      "Invalid",
    Full:         "Full",
    Equal:        "Equal",
    Decorrelated: "Decorrelated",
    Bounded:      "Bounded",
}

func (v Variant) String() string {
    if v.IsInvalid() { return variantLabels[Invalid] }
    return variantLabels[v]
}

func (v Variant) Label() string {
    return v.String()
}

func (v Variant) IsValid() bool { return v > Invalid && v < Variant(len(variantLabels)) }

func (v Variant) IsInvalid() bool      { return v == Invalid }
func (v Variant) IsFull() bool         { return v == Full }
func (v Variant) IsEqual() bool        { return v == Equal }
func (v Variant) IsDecorrelated() bool { return v == Decorrelated }
func (v Variant) IsBounded() bool      { return v == Bounded }

func All() []Variant { return []Variant{Full, Equal, Decorrelated, Bounded} }
func ByIndex(i int) Variant {
    if i < 0 || i >= len(variantLabels) { return Invalid }
    return Variant(i)
}

func Parse(s string) appfault.Result[Variant] {
    trimmed := strings.TrimSpace(s)
    for i, str := range variantLabels {
        if strings.EqualFold(str, trimmed) {
            return appfault.Ok(Variant(i))
        }
    }
    return appfault.Fail[Variant](appfault.New(
        ErrInvalidVariant,
        "invalid jitter type: "+s,
    ))
}

func Values() []string {
    result := make([]string, 0, len(variantLabels)-1)
    for _, s := range variantLabels[1:] {
        result = append(result, s)
    }

    return result
}

func (v Variant) MarshalJSON() ([]byte, error) {
    return json.Marshal(v.String())
}

func (v *Variant) UnmarshalJSON(data []byte) error {
    var s string
    if err := json.Unmarshal(data, &s); err != nil {
        return err
    }

    parsed, err := Parse(s)
    if err != nil {
        return err
    }

    *v = parsed

    return nil
}

func (v Variant) Description() string {
    switch v {
    case Full:         return "Random delay from 0 to computed delay"
    case Equal:        return "Half base delay plus random up to half delay"
    case Decorrelated: return "Previous delay influences next delay range"
    case Bounded:      return "Computed delay ±jitter percentage"
    default:           return "Invalid jitter type"
    }
}
```

---

## 4. Enum Registry

```go
// internal/enums/registry.go
package enums

import (
    "gsearch/internal/enums/enginetype"
    "gsearch/internal/enums/jittertype"
    "gsearch/internal/enums/logleveltype"
    "gsearch/internal/enums/movieprovidertype"
    "gsearch/internal/enums/outputtype"
    "gsearch/internal/enums/platformtype"
    "gsearch/internal/enums/providertype"
    "gsearch/internal/enums/proxytype"
    "gsearch/internal/enums/rotationstrategytype"
    "gsearch/internal/enums/searchmodetype"
    "gsearch/internal/enums/searchstatustype"
    "gsearch/internal/enums/socialmediatype"
)

// Registry provides access to all enum types
type Registry struct{}

func NewRegistry() *Registry { return &Registry{} }

func (r *Registry) Providers() []providertype.Variant           { return providertype.All() }
func (r *Registry) Platforms() []platformtype.Variant           { return platformtype.All() }
func (r *Registry) Engines() []enginetype.Variant               { return enginetype.All() }
func (r *Registry) SearchModes() []searchmodetype.Variant       { return searchmodetype.All() }
func (r *Registry) SocialMedia() []socialmediatype.Variant      { return socialmediatype.All() }
func (r *Registry) OutputFormats() []outputtype.Variant         { return outputtype.All() }
func (r *Registry) MovieProviders() []movieprovidertype.Variant { return movieprovidertype.All() }
func (r *Registry) SearchStatuses() []searchstatustype.Variant  { return searchstatustype.All() }
func (r *Registry) LogLevels() []logleveltype.Variant           { return logleveltype.All() }

func (r *Registry) ValidateProvider(s string) bool { _, err := providertype.Parse(s); return err == nil }
func (r *Registry) ValidatePlatform(s string) bool { _, err := platformtype.Parse(s); return err == nil }
func (r *Registry) ValidateEngine(s string) bool   { _, err := enginetype.Parse(s); return err == nil }
```

---

## 5. Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 7900 | ERR_INVALID_PROVIDER | Invalid provider variant |
| 7901 | ERR_INVALID_PLATFORM | Invalid platform variant |
| 7902 | ERR_INVALID_ENGINE | Invalid engine variant |
| 7903 | ERR_INVALID_SEARCH_MODE | Invalid search mode variant |
| 7904 | ERR_INVALID_SOCIAL_MEDIA | Invalid social media variant |
| 7905 | ERR_INVALID_OUTPUT | Invalid output format variant |
| 7906 | ERR_ENUM_PARSE_FAILED | Failed to parse enum value |
| 7907 | ERR_ENUM_NOT_FOUND | Enum type not found in registry |
| 7908 | ERR_MULTIPLE_PARSE_FAILED | Failed to parse multiple enum values |
| 7909 | ERR_INVALID_MOVIE_PROVIDER | Invalid movie provider variant |
| 7910 | ERR_INVALID_SEARCH_STATUS | Invalid search status variant |
| 7911 | ERR_INVALID_LOG_LEVEL | Invalid log level variant |

---

## 6. CLI Integration

```go
// cmd/gsearch/enums.go
package main

import (
    "fmt"
    "github.com/spf13/cobra"
    "gsearch/internal/enums"
)

var enumsCmd = &cobra.Command{
    Use:   "enums",
    Short: "List and validate enum values",
}

var enumsListCmd = &cobra.Command{
    Use:   "list [type]",
    Short: "List all values for an enum type",
    Args:  cobra.MaximumNArgs(1),
    Run: func(cmd *cobra.Command, args []string) {
        registry := enums.NewRegistry()
        
        if len(args) == 0 {
            fmt.Println("Available enum types:")
            fmt.Println("  - provider")
            fmt.Println("  - platform")
            fmt.Println("  - engine")
            fmt.Println("  - searchmode")
            fmt.Println("  - socialmedia")
            fmt.Println("  - output")
            fmt.Println("  - movieprovider")
            fmt.Println("  - searchstatus")
            fmt.Println("  - loglevel")
            return
        }
        
        switch args[0] {
        case "provider":
            for _, v := range registry.Providers() {
                fmt.Printf("  %s - %s\n", v.String(), v.Label())
            }
        case "platform":
            for _, v := range registry.Platforms() {
                fmt.Printf("  %s - %s\n", v.String(), v.Label())
            }
        case "engine":
            for _, v := range registry.Engines() {
                fmt.Printf("  %s - %s\n", v.String(), v.Label())
            }
        case "searchmode":
            for _, v := range registry.SearchModes() {
                fmt.Printf("  %s - %s\n", v.String(), v.Label())
            }
        case "output":
            for _, v := range registry.OutputFormats() {
                fmt.Printf("  %s - %s\n", v.String(), v.Label())
            }
        case "movieprovider":
            for _, v := range registry.MovieProviders() {
                fmt.Printf("  %s - %s\n", v.String(), v.Label())
            }
        case "searchstatus":
            for _, v := range registry.SearchStatuses() {
                fmt.Printf("  %s - %s\n", v.String(), v.Label())
            }
        case "loglevel":
            for _, v := range registry.LogLevels() {
                fmt.Printf("  %s - %s\n", v.String(), v.Label())
            }
        default:
            fmt.Printf("Unknown enum type: %s\n", args[0])
        }
    },
}

var enumsValidateCmd = &cobra.Command{
    Use:   "validate <type> <value>",
    Short: "Validate an enum value",
    Args:  cobra.ExactArgs(2),
    Run: func(cmd *cobra.Command, args []string) {
        registry := enums.NewRegistry()
        
        valid := false
        switch args[0] {
        case "provider":
            valid = registry.ValidateProvider(args[1])
        case "platform":
            valid = registry.ValidatePlatform(args[1])
        case "engine":
            valid = registry.ValidateEngine(args[1])
        }
        
        if valid {
            fmt.Printf("✓ '%s' is a valid %s\n", args[1], args[0])
        } else {
            fmt.Printf("✗ '%s' is not a valid %s\n", args[1], args[0])
        }
    },
}

func init() {
    enumsCmd.AddCommand(enumsListCmd)
    enumsCmd.AddCommand(enumsValidateCmd)
    rootCmd.AddCommand(enumsCmd)
}
```

---

## 7. Compliance Checklist

| Requirement | Status |
|-------------|--------|
| `type Variant byte` declaration | ✅ |
| `Invalid` as zero value | ✅ |
| `variantLabels` single lookup table | ✅ |
| `String()` method | ✅ |
| `Label()` delegates to `String()` | ✅ |
| `IsValid()` method | ✅ |
| `Is{Value}()` methods | ✅ |
| `All()` function | ✅ |
| `ByIndex()` function | ✅ |
| `Parse()` with `EqualFold` | ✅ |
| `Values()` function | ✅ |
| `MarshalJSON()` method | ✅ |
| `UnmarshalJSON()` method | ✅ |
| Package names use `type` suffix | ✅ |
| Domain-specific methods | ✅ |

---

## 8. Cross-References

| Reference | Location |
|-----------|----------|
| Enum Specification | `02-spec/02-coding-guidelines/03-golang/01-enum-specification/` |
| Multi-Source Search | `56-multi-source-search.md` |
| SERP Position Tracking | `44-serp-position-tracking.md` |
| Provider Integration | `59-provider-integration.md` |
| Error Registry | `02-spec/03-error-code-registry/01-registry.md` |
| Movie Search | `61-movie-search.md` |

---

*Enum architecture for type-safe, extensible configuration - fully compliant with 02-spec/02-coding-guidelines/03-golang/01-enum-specification/ v3.0.0*
