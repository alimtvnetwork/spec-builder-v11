# GSearch Contact Information Extraction Specification

> **Phase:** 4 of 7  
> **Status:** Draft  
> **Created:** 2026-02-04  
**Version:** 1.0.0  
> **Depends On:** `42-multi-engine-search.md` (Phase 1)  
> **Used By:** Phase 3 (Competitors), Phase 5 (Google Maps)  
> **Parent:** `41-business-intelligence-plan.md`

---

## 1. Overview

Automated extraction of contact information from websites including emails, phone numbers, social media profiles, and business details using Go-based HTML parsing with intelligent contact page discovery.

---

## 2. Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                   Contact Extraction Engine                        │
├───────────────────────────────────────────────────────────────────┤
│  URL Fetcher → Page Analyzer → Contact Finder → Data Normalizer  │
└────────┬──────────────┬───────────────┬───────────────────────────┘
         │              │               │
  ┌──────▼──────┐ ┌─────▼─────┐  ┌──────▼──────┐
  │   Contact   │ │   Email   │  │   Phone     │
  │   Page      │ │ Extractor │  │  Extractor  │
  │   Finder    │ │           │  │             │
  └──────┬──────┘ └─────┬─────┘  └──────┬──────┘
         │              │               │
  ┌──────▼──────────────▼───────────────▼──────┐
  │            Social Profile Extractor         │
  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐ │
  │  │LinkedIn│ │Facebook│ │Twitter │ │ More │ │
  │  └────────┘ └────────┘ └────────┘ └──────┘ │
  └──────────────────────────────────────────────┘
                        │
              ┌─────────▼─────────┐
              │   Validator &     │
              │   Deduplicator    │
              └───────────────────┘
```

---

## 3. CLI Interface

### 3.1 Basic Commands

```bash
# Extract contact from single URL
gsearch contact "https://example.com"

# Deep extraction (follow contact page links)
gsearch contact "https://example.com" --deep

# Extract only specific types
gsearch contact "https://example.com" --emails
gsearch contact "https://example.com" --phones
gsearch contact "https://example.com" --socials

# Extract from multiple URLs
gsearch contact --urls urls.txt
gsearch contact --urls "https://a.com,https://b.com"
```

### 3.2 Advanced Options

```bash
# Control extraction depth
gsearch contact "https://example.com" --deep --max-pages 5

# Specify pages to check
gsearch contact "https://example.com" --pages contact,about,team

# Verification options
gsearch contact "https://example.com" --verify-emails
gsearch contact "https://example.com" --verify-socials

# Output formats
gsearch contact "https://example.com" --output json
gsearch contact "https://example.com" --output csv
gsearch contact "https://example.com" --output table

# Caching
gsearch contact "https://example.com" --cache-days 180
gsearch contact "https://example.com" --force

# Batch processing
gsearch contact batch --input domains.csv --output results.json
gsearch contact batch status <job-id>

# Rate limiting
gsearch contact "https://example.com" --delay 2s
gsearch contact batch --input domains.csv --concurrency 3
```

### 3.3 Social Profile Search

```bash
# Find social profiles for a company name
gsearch contact search-social "Company Name"
gsearch contact search-social "Company Name" --platforms linkedin,twitter

# Find social from domain
gsearch contact find-social "example.com"
```

---

## 4. Data Structures

### 4.1 Core Types

```go
type ContactExtractionRequest struct {
    Url             string            
    Urls            []string          `json:",omitempty"`
    Deep            bool              
    MaxPages        int               
    TargetPages     []string          // contact, about, team
    ExtractEmails   bool              
    ExtractPhones   bool              
    ExtractSocials  bool              
    VerifyEmails    bool              
    VerifySocials   bool              
    CacheDays       int               
    ForceRefresh    bool              
    Delay           time.Duration     
}

type ContactExtractionResponse struct {
    Url             string            
    Domain          string            
    Contact         *ContactInfo      
    PagesScanned    []string          
    ExtractionTime  time.Duration     
    FromCache       bool              
    ExtractedAt     time.Time         
}

type ContactInfo struct {
    // Company info
    CompanyName     string            `json:",omitempty"`
    
    // Emails (up to 5)
    Email1          string            `json:",omitempty"`
    Email2          string            `json:",omitempty"`
    Email3          string            `json:",omitempty"`
    Email4          string            `json:",omitempty"`
    Email5          string            `json:",omitempty"`
    
    // Phones (up to 5)
    Phone1          string            `json:",omitempty"`
    Phone2          string            `json:",omitempty"`
    Phone3          string            `json:",omitempty"`
    Phone4          string            `json:",omitempty"`
    Phone5          string            `json:",omitempty"`
    
    // Social profiles
    LinkedIn        string            `json:",omitempty"`
    Facebook        string            `json:",omitempty"`
    Twitter         string            `json:",omitempty"`
    Instagram       string            `json:",omitempty"`
    YouTube         string            `json:",omitempty"`
    TikTok          string            `json:",omitempty"`
    Pinterest       string            `json:",omitempty"`
    
    // Messaging
    WhatsApp        string            `json:",omitempty"`
    Telegram        string            `json:",omitempty"`
    
    // Location
    Address         string            `json:",omitempty"`
    City            string            `json:",omitempty"`
    State           string            `json:",omitempty"`
    Country         string            `json:",omitempty"`
    PostalCode      string            `json:",omitempty"`
    
    // Metadata
    ExtractedFrom   []string          
    Confidence      float64           
    Verified        bool              
}
```

### 4.2 Extracted Item Types

```go
type ExtractedEmail struct {
    Email           string            
    Type            EmailType         // general, support, sales, etc.
    Source          ExtractionSource  // mailto, text, schema
    Context         string            // Surrounding text
    Confidence      float64           
    Verified        bool              
    VerifiedAt      *time.Time        `json:",omitempty"`
}

type EmailType string

const (
    EmailGeneral    EmailType = "general"      // info@, contact@
    EmailSupport    EmailType = "support"      // support@, help@
    EmailSales      EmailType = "sales"        // sales@
    EmailHr         EmailType = "hr"           // hr@, jobs@, careers@
    EmailPress      EmailType = "press"        // press@, media@
    EmailPersonal   EmailType = "personal"     // firstname.lastname@
    EmailUnknown    EmailType = "unknown"
)

type ExtractedPhone struct {
    RawValue        string            
    Formatted       string            // E.164 format
    Display         string            // Human readable
    CountryCode     string            
    Type            PhoneType         
    Source          ExtractionSource  
    Confidence      float64           
}

type PhoneType string

const (
    PhoneMain       PhoneType = "main"
    PhoneMobile     PhoneType = "mobile"
    PhoneTollFree   PhoneType = "toll_free"
    PhoneFax        PhoneType = "fax"
    PhoneWhatsApp   PhoneType = "whatsapp"
    PhoneUnknown    PhoneType = "unknown"
)

type ExtractedSocial struct {
    Platform        SocialPlatform    
    Url             string            
    Handle          string            // @username
    DisplayName     string            `json:",omitempty"`
    Source          ExtractionSource  
    Verified        bool              
    Confidence      float64           
}

type SocialPlatform string

const (
    PlatformLinkedIn   SocialPlatform = "linkedin"
    PlatformFacebook   SocialPlatform = "facebook"
    PlatformTwitter    SocialPlatform = "twitter"
    PlatformInstagram  SocialPlatform = "instagram"
    PlatformYouTube    SocialPlatform = "youtube"
    PlatformTikTok     SocialPlatform = "tiktok"
    PlatformPinterest  SocialPlatform = "pinterest"
    PlatformWhatsApp   SocialPlatform = "whatsapp"
    PlatformTelegram   SocialPlatform = "telegram"
)

type ExtractionSource string

const (
    SourceLink      ExtractionSource = "link"        // <a href="">
    SourceMailto    ExtractionSource = "mailto"      // mailto: link
    SourceTel       ExtractionSource = "tel"         // tel: link
    SourceText      ExtractionSource = "text"        // Plain text match
    SourceSchema    ExtractionSource = "schema"      // JSON-LD schema
    SourceMeta      ExtractionSource = "meta"        // Meta tags
    SourceFooter    ExtractionSource = "footer"      // Footer section
)
```

---

## 5. Extraction Engine

### 5.1 Contact Page Finder

```go
type ContactPageFinder struct {
    httpClient  *http.Client
    scraper     *StealthScraper
}

var contactPagePatterns = []string{
    "/contact",
    "/contact-us",
    "/contactus",
    "/get-in-touch",
    "/reach-us",
    "/about",
    "/about-us",
    "/aboutus",
    "/team",
    "/our-team",
    "/company",
    "/support",
    "/help",
}

var contactLinkPatterns = []*regexp.Regexp{
    regexp.MustCompile(`(?i)contact\s*(us)?`),
    regexp.MustCompile(`(?i)get\s*in\s*touch`),
    regexp.MustCompile(`(?i)reach\s*(us|out)`),
    regexp.MustCompile(`(?i)about\s*(us)?`),
    regexp.MustCompile(`(?i)support`),
}

func (f *ContactPageFinder) FindContactPages(context stdctx.Context, baseUrl string) apperror.Result[[]string] {
    pages := []string{baseUrl}
    
    // Parse base URL
    base, err := url.Parse(baseUrl)
    if err != nil {
        return apperror.Fail[[]string](
            apperror.Wrap(
                err,
                "parse base URL",
            ),
        )
    }
    
    // Fetch homepage
    doc, err := f.fetchPage(context, baseUrl)
    if err != nil {
        return apperror.OK(pages) // Return just homepage on error
    }
    
    // 1. Check common URL patterns
    for _, pattern := range contactPagePatterns {
        testUrl := base.Scheme + "://" + base.Host + pattern
        if f.pageExists(context, testUrl) {
            pages = append(pages, testUrl)
        }
    }
    
    // 2. Find links matching contact patterns
    doc.Find("a[href]").Each(func(i int, s *goquery.Selection) {
        href, exists := s.Attr("href")
        if !exists {
            return
        }
        
        linkText := strings.TrimSpace(s.Text())
        
        // Check link text against patterns
        for _, pattern := range contactLinkPatterns {
            if pattern.MatchString(linkText) {
                fullUrl := f.resolveUrl(base, href)
                if fullUrl != "" && !contains(pages, fullUrl) {
                    pages = append(pages, fullUrl)
                }
                break
            }
        }
    })
    
    // 3. Check footer for contact links
    footerLinks := f.extractFooterLinks(doc, base)
    pages = append(pages, footerLinks...)
    
    return apperror.OK(deduplicateStrings(pages))
}

func (f *ContactPageFinder) extractFooterLinks(doc *goquery.Document, base *url.URL) []string {
    links := []string{}
    
    footerSelectors := []string{
        "footer",
        "#footer",
        ".footer",
        "[role='contentinfo']",
    }
    
    for _, sel := range footerSelectors {
        doc.Find(sel).Find("a[href]").Each(func(i int, s *goquery.Selection) {
            href, exists := s.Attr("href")
            if !exists {
                return
            }
            
            // Check if likely contact/about link
            hrefLower := strings.ToLower(href)
            if strings.Contains(hrefLower, "contact") ||
               strings.Contains(hrefLower, "about") {
                fullUrl := f.resolveUrl(base, href)
                if fullUrl != "" {
                    links = append(links, fullUrl)
                }
            }
        })
    }
    
    return links
}
```

### 5.2 Email Extractor

```go
type EmailExtractor struct {
    verifier *EmailVerifier
}

// RFC 5322 compliant email regex (simplified)
var emailRegex = regexp.MustCompile(`[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}`)

// Common invalid patterns to filter
var invalidEmailPatterns = []*regexp.Regexp{
    regexp.MustCompile(`(?i)example\.(com|org|net)`),
    regexp.MustCompile(`(?i)test@`),
    regexp.MustCompile(`(?i)@sentry\.io`),
    regexp.MustCompile(`(?i)@wixpress\.com`),
    regexp.MustCompile(`(?i)\.png$|\.jpg$|\.gif$`), // Image filenames
}

func (e *EmailExtractor) Extract(doc *goquery.Document, pageUrl string) []ExtractedEmail {
    emails := []ExtractedEmail{}
    seen := make(map[string]bool)
    
    // 1. Extract from mailto: links
    doc.Find("a[href^='mailto:']").Each(func(i int, s *goquery.Selection) {
        href, _ := s.Attr("href")
        email := strings.TrimPrefix(href, "mailto:")
        email = strings.Split(email, "?")[0] // Remove query params
        email = strings.ToLower(strings.TrimSpace(email))
        
        if e.isValidEmail(email) && !seen[email] {
            seen[email] = true
            emails = append(emails, ExtractedEmail{
                Email:      email,
                Type:       e.classifyEmail(email),
                Source:     SourceMailto,
                Context:    s.Text(),
                Confidence: 0.95,
            })
        }
    })
    
    // 2. Extract from JSON-LD schema
    doc.Find("script[type='application/ld+json']").Each(func(i int, s *goquery.Selection) {
        schemaEmails := e.extractFromSchema(s.Text())
        for _, email := range schemaEmails {
            if !seen[email] {
                seen[email] = true
                emails = append(emails, ExtractedEmail{
                    Email:      email,
                    Type:       e.classifyEmail(email),
                    Source:     SourceSchema,
                    Confidence: 0.9,
                })
            }
        }
    })
    
    // 3. Extract from page text (lower confidence)
    pageText := doc.Find("body").Text()
    textEmails := emailRegex.FindAllString(pageText, -1)
    for _, email := range textEmails {
        email = strings.ToLower(email)
        if e.isValidEmail(email) && !seen[email] {
            seen[email] = true
            emails = append(emails, ExtractedEmail{
                Email:      email,
                Type:       e.classifyEmail(email),
                Source:     SourceText,
                Confidence: 0.7,
            })
        }
    }
    
    // Sort by confidence
    sort.Slice(emails, func(i, j int) bool {
        return emails[i].Confidence > emails[j].Confidence
    })
    
    return emails
}

func (e *EmailExtractor) classifyEmail(email string) EmailType {
    local := strings.Split(email, "@")[0]
    localLower := strings.ToLower(local)
    
    switch {
    case strings.HasPrefix(localLower, "info") ||
         strings.HasPrefix(localLower, "contact") ||
         strings.HasPrefix(localLower, "hello"):
        return EmailGeneral
    case strings.HasPrefix(localLower, "support") ||
         strings.HasPrefix(localLower, "help"):
        return EmailSupport
    case strings.HasPrefix(localLower, "sales") ||
         strings.HasPrefix(localLower, "inquiry"):
        return EmailSales
    case strings.HasPrefix(localLower, "hr") ||
         strings.HasPrefix(localLower, "jobs") ||
         strings.HasPrefix(localLower, "careers"):
        return EmailHR
    case strings.HasPrefix(localLower, "press") ||
         strings.HasPrefix(localLower, "media"):
        return EmailPress
    case strings.Contains(localLower, "."):
        return EmailPersonal // firstname.lastname pattern
    default:
        return EmailUnknown
    }
}

func (e *EmailExtractor) isValidEmail(email string) bool {
    // Basic validation
    if !emailRegex.MatchString(email) {
        return false
    }
    
    // Check against invalid patterns
    for _, pattern := range invalidEmailPatterns {
        if pattern.MatchString(email) {
            return false
        }
    }
    
    // Check TLD is valid
    parts := strings.Split(email, ".")
    tld := parts[len(parts)-1]
    if len(tld) < 2 || len(tld) > 10 {
        return false
    }
    
    return true
}
```

### 5.3 Phone Extractor

```go
type PhoneExtractor struct {
    defaultCountry string
}

// Phone patterns for various formats
var phonePatterns = []*regexp.Regexp{
    // International format
    regexp.MustCompile(`\+\d{1,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}`),
    // US/Canada format
    regexp.MustCompile(`\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}`),
    // Toll-free
    regexp.MustCompile(`(?i)1[\s.-]?(?:800|888|877|866|855|844|833)[\s.-]?\d{3}[\s.-]?\d{4}`),
    // General with country code
    regexp.MustCompile(`\d{1,4}[\s.-]\d{2,4}[\s.-]\d{2,4}[\s.-]?\d{0,4}`),
}

func (p *PhoneExtractor) Extract(doc *goquery.Document) []ExtractedPhone {
    phones := []ExtractedPhone{}
    seen := make(map[string]bool)
    
    // 1. Extract from tel: links
    doc.Find("a[href^='tel:']").Each(func(i int, s *goquery.Selection) {
        href, _ := s.Attr("href")
        rawPhone := strings.TrimPrefix(href, "tel:")
        rawPhone = strings.ReplaceAll(rawPhone, "%20", "")
        
        phone := p.parsePhone(rawPhone)
        if phone != nil && !seen[phone.Formatted] {
            seen[phone.Formatted] = true
            phone.Source = SourceTel
            phone.Confidence = 0.95
            phones = append(phones, *phone)
        }
    })
    
    // 2. Extract from WhatsApp links
    doc.Find("a[href*='wa.me'], a[href*='whatsapp']").Each(func(i int, s *goquery.Selection) {
        href, _ := s.Attr("href")
        rawPhone := p.extractWhatsAppNumber(href)
        
        if rawPhone != "" {
            phone := p.parsePhone(rawPhone)
            if phone != nil && !seen[phone.Formatted] {
                seen[phone.Formatted] = true
                phone.Type = PhoneWhatsApp
                phone.Source = SourceLink
                phone.Confidence = 0.95
                phones = append(phones, *phone)
            }
        }
    })
    
    // 3. Extract from JSON-LD schema
    doc.Find("script[type='application/ld+json']").Each(func(i int, s *goquery.Selection) {
        schemaPhones := p.extractFromSchema(s.Text())
        for _, rawPhone := range schemaPhones {
            phone := p.parsePhone(rawPhone)
            if phone != nil && !seen[phone.Formatted] {
                seen[phone.Formatted] = true
                phone.Source = SourceSchema
                phone.Confidence = 0.9
                phones = append(phones, *phone)
            }
        }
    })
    
    // 4. Extract from page text
    pageText := doc.Find("body").Text()
    for _, pattern := range phonePatterns {
        matches := pattern.FindAllString(pageText, -1)
        for _, match := range matches {
            phone := p.parsePhone(match)
            if phone != nil && !seen[phone.Formatted] {
                seen[phone.Formatted] = true
                phone.Source = SourceText
                phone.Confidence = 0.6
                phones = append(phones, *phone)
            }
        }
    }
    
    return phones
}

func (p *PhoneExtractor) parsePhone(raw string) *ExtractedPhone {
    // Remove non-numeric except + at start
    cleaned := regexp.MustCompile(`[^\d+]`).ReplaceAllString(raw, "")
    
    // Validate length
    digitsOnly := regexp.MustCompile(`\d`).FindAllString(cleaned, -1)
    if len(digitsOnly) < 7 || len(digitsOnly) > 15 {
        return nil
    }
    
    phone := &ExtractedPhone{
        RawValue: raw,
    }
    
    // Determine country code and format
    if strings.HasPrefix(cleaned, "+") {
        phone.Formatted = cleaned
        phone.CountryCode = p.extractCountryCode(cleaned)
    } else if len(digitsOnly) == 10 {
        // Assume US/Canada
        phone.Formatted = "+1" + strings.Join(digitsOnly, "")
        phone.CountryCode = "US"
    } else {
        phone.Formatted = "+" + strings.Join(digitsOnly, "")
    }
    
    // Format for display
    phone.Display = p.formatForDisplay(phone.Formatted)
    phone.Type = p.classifyPhone(phone.Formatted)
    
    return phone
}

func (p *PhoneExtractor) classifyPhone(phone string) PhoneType {
    if strings.Contains(phone, "800") || strings.Contains(phone, "888") ||
       strings.Contains(phone, "877") || strings.Contains(phone, "866") {
        return PhoneTollFree
    }
    return PhoneMain
}

func (p *PhoneExtractor) extractWhatsAppNumber(href string) string {
    // Handle wa.me/1234567890 and api.whatsapp.com/send?phone=1234567890
    if strings.Contains(href, "wa.me/") {
        parts := strings.Split(href, "wa.me/")
        if len(parts) > 1 {
            return strings.Split(parts[1], "?")[0]
        }
    }
    if strings.Contains(href, "phone=") {
        parts := strings.Split(href, "phone=")
        if len(parts) > 1 {
            return strings.Split(parts[1], "&")[0]
        }
    }
    return ""
}
```

### 5.4 Social Profile Extractor

```go
type SocialExtractor struct {
    verifier *SocialVerifier
}

var socialPatterns = map[SocialPlatform]*regexp.Regexp{
    PlatformLinkedIn:  regexp.MustCompile(`(?i)linkedin\.com/(company|in)/([a-zA-Z0-9_-]+)`),
    PlatformFacebook:  regexp.MustCompile(`(?i)facebook\.com/([a-zA-Z0-9._-]+)`),
    PlatformTwitter:   regexp.MustCompile(`(?i)(twitter|x)\.com/([a-zA-Z0-9_]+)`),
    PlatformInstagram: regexp.MustCompile(`(?i)instagram\.com/([a-zA-Z0-9._]+)`),
    PlatformYouTube:   regexp.MustCompile(`(?i)youtube\.com/(channel|c|user|@)([a-zA-Z0-9_-]+)`),
    PlatformTikTok:    regexp.MustCompile(`(?i)tiktok\.com/@([a-zA-Z0-9._-]+)`),
    PlatformPinterest: regexp.MustCompile(`(?i)pinterest\.com/([a-zA-Z0-9_-]+)`),
    PlatformTelegram:  regexp.MustCompile(`(?i)t\.me/([a-zA-Z0-9_]+)`),
}

func (s *SocialExtractor) Extract(doc *goquery.Document) []ExtractedSocial {
    socials := []ExtractedSocial{}
    seen := make(map[SocialPlatform]bool)
    
    // 1. Extract from all links
    doc.Find("a[href]").Each(func(i int, sel *goquery.Selection) {
        href, exists := sel.Attr("href")
        if !exists {
            return
        }
        
        for platform, pattern := range socialPatterns {
            if seen[platform] {
                continue // Only first match per platform
            }
            
            matches := pattern.FindStringSubmatch(href)
            if len(matches) > 0 {
                social := s.parseSocialUrl(platform, href, matches)
                if social != nil {
                    social.Source = SourceLink
                    socials = append(socials, *social)
                    seen[platform] = true
                }
            }
        }
    })
    
    // 2. Check JSON-LD schema for sameAs
    doc.Find("script[type='application/ld+json']").Each(func(i int, sel *goquery.Selection) {
        schemaUrls := s.extractSameAsUrls(sel.Text())
        for _, url := range schemaUrls {
            for platform, pattern := range socialPatterns {
                if seen[platform] {
                    continue
                }
                
                matches := pattern.FindStringSubmatch(url)
                if len(matches) > 0 {
                    social := s.parseSocialUrl(platform, url, matches)
                    if social != nil {
                        social.Source = SourceSchema
                        social.Confidence = 0.95
                        socials = append(socials, *social)
                        seen[platform] = true
                    }
                }
            }
        }
    })
    
    return socials
}

func (s *SocialExtractor) parseSocialUrl(platform SocialPlatform, url string, matches []string) *ExtractedSocial {
    social := &ExtractedSocial{
        Platform:   platform,
        Url:        s.normalizeUrl(url),
        Confidence: 0.9,
    }
    
    // Extract handle based on platform
    switch platform {
    case PlatformLinkedIn:
        if len(matches) > 2 {
            social.Handle = matches[2]
        }
    case PlatformFacebook:
        if len(matches) > 1 {
            social.Handle = matches[1]
        }
    case PlatformTwitter:
        if len(matches) > 2 {
            social.Handle = "@" + matches[2]
        }
    case PlatformInstagram:
        if len(matches) > 1 {
            social.Handle = "@" + matches[1]
        }
    case PlatformYouTube:
        if len(matches) > 2 {
            social.Handle = matches[2]
        }
    case PlatformTikTok:
        if len(matches) > 1 {
            social.Handle = "@" + matches[1]
        }
    }
    
    // Filter out generic/share links
    if s.isGenericLink(social.Handle) {
        return nil
    }
    
    return social
}

func (s *SocialExtractor) isGenericLink(handle string) bool {
    genericPatterns := []string{
        "share", "sharer", "intent", "dialog", 
        "login", "signup", "home", "feed",
    }
    
    handleLower := strings.ToLower(handle)
    for _, pattern := range genericPatterns {
        if strings.Contains(handleLower, pattern) {
            return true
        }
    }
    return false
}

func (s *SocialExtractor) extractSameAsUrls(schemaJson string) []string {
    urls := []string{}
    
    // Concrete struct for JSON-LD sameAs — replaces map[string]interface{}
    var schema JsonLdSchema
    if err := json.Unmarshal([]byte(schemaJson), &schema); err != nil {
        return urls
    }
    
    urls = append(urls, schema.SameAs.Urls()...)
    
    return urls
}

// JsonLdSchema represents the subset of schema.org JSON-LD we parse
// EXEMPTED: schema.org JSON-LD external standard — tags must match spec keys
type JsonLdSchema struct {
    Type   string        `json:"@type"`
    Name   string        `json:"name"`
    SameAs SameAsField   `json:"sameAs"`
}

// SameAsField handles schema.org sameAs which can be a string or []string
type SameAsField struct {
    values []string
}

func (f *SameAsField) UnmarshalJSON(data []byte) error {
    // Try single string first
    var single string
    if err := json.Unmarshal(data, &single); err == nil {
        f.values = []string{single}
        return nil
    }
    
    // Try string array
    var arr []string
    if err := json.Unmarshal(data, &arr); err == nil {
        f.values = arr
        return nil
    }
    
    return nil
}

func (f SameAsField) Urls() []string {
    return f.values
}
```

---

## 6. Verification

### 6.1 Email Verification

```go
type EmailVerifier struct {
    mxCache map[string]bool
    mu      sync.RWMutex
}

func (v *EmailVerifier) Verify(email string) bool {
    parts := strings.Split(email, "@")
    if len(parts) != 2 {
        return false
    }
    
    domain := parts[1]
    
    // Check cache
    v.mu.RLock()
    if cached, ok := v.mxCache[domain]; ok {
        v.mu.RUnlock()
        return cached
    }
    v.mu.RUnlock()
    
    // Lookup MX records
    mxRecords, err := net.LookupMX(domain)
    isLookupSuccess := err == nil
    hasMxRecords := len(mxRecords) > 0
    valid := isLookupSuccess && hasMxRecords
    
    // Cache result
    v.mu.Lock()
    v.mxCache[domain] = valid
    v.mu.Unlock()
    
    return valid
}
```

### 6.2 Social Profile Verification

```go
type SocialVerifier struct {
    httpClient *http.Client
}

func (v *SocialVerifier) Verify(social ExtractedSocial) bool {
    // HEAD request to check if profile exists
    req, err := http.NewRequest("HEAD", social.Url, nil)
    if err != nil {
        return false
    }
    
    req.Header.Set("User-Agent", randomUserAgent())
    
    resp, err := v.httpClient.Do(req)
    if err != nil {
        return false
    }
    defer resp.Body.Close()
    
    // 200 = exists, 404 = doesn't exist
    return resp.StatusCode == 200
}
```

---

## 7. Contact Aggregator

```go
type ContactAggregator struct {
    pageFinder     *ContactPageFinder
    emailExtractor *EmailExtractor
    phoneExtractor *PhoneExtractor
    socialExtractor *SocialExtractor
    httpClient     *http.Client
}

func (a *ContactAggregator) Extract(context stdctx.Context, req ContactExtractionRequest) apperror.Result[*ContactExtractionResponse] {
    startTime := time.Now()
    
    response := &ContactExtractionResponse{
        Url:    req.Url,
        Domain: extractDomain(req.Url),
    }
    
    // Find pages to scan
    pagesToScan := []string{req.Url}
    if req.Deep {
        pagesResult := a.pageFinder.FindContactPages(context, req.Url)
        if pagesResult.IsSuccess() {
            pagesToScan = pagesResult.Value()
        }
    }
    
    // Limit pages
    if req.MaxPages > 0 && len(pagesToScan) > req.MaxPages {
        pagesToScan = pagesToScan[:req.MaxPages]
    }
    
    response.PagesScanned = pagesToScan
    
    // Extract from all pages
    allEmails := []ExtractedEmail{}
    allPhones := []ExtractedPhone{}
    allSocials := []ExtractedSocial{}
    
    for _, pageUrl := range pagesToScan {
        // Rate limiting
        if req.Delay > 0 {
            time.Sleep(req.Delay)
        }
        
        doc, err := a.fetchPage(context, pageUrl)
        if err != nil {
            continue
        }
        
        if req.ExtractEmails || (!req.ExtractPhones && !req.ExtractSocials) {
            emails := a.emailExtractor.Extract(doc, pageUrl)
            allEmails = append(allEmails, emails...)
        }
        
        if req.ExtractPhones || (!req.ExtractEmails && !req.ExtractSocials) {
            phones := a.phoneExtractor.Extract(doc)
            allPhones = append(allPhones, phones...)
        }
        
        if req.ExtractSocials || (!req.ExtractEmails && !req.ExtractPhones) {
            socials := a.socialExtractor.Extract(doc)
            allSocials = append(allSocials, socials...)
        }
    }
    
    // Build ContactInfo
    response.Contact = a.buildContactInfo(allEmails, allPhones, allSocials)
    response.ExtractionTime = time.Since(startTime)
    response.ExtractedAt = time.Now()
    
    return apperror.OK(response)
}

func (a *ContactAggregator) buildContactInfo(
    emails []ExtractedEmail,
    phones []ExtractedPhone,
    socials []ExtractedSocial,
) *ContactInfo {
    contact := &ContactInfo{
        ExtractedFrom: []string{},
    }
    
    // Assign emails (up to 5)
    emailFields := []*string{&contact.Email1, &contact.Email2, &contact.Email3, &contact.Email4, &contact.Email5}
    for i, email := range emails {
        if i >= 5 {
            break
        }
        *emailFields[i] = email.Email
        if !contains(contact.ExtractedFrom, string(email.Source)) {
            contact.ExtractedFrom = append(contact.ExtractedFrom, string(email.Source))
        }
    }
    
    // Assign phones (up to 5)
    phoneFields := []*string{&contact.Phone1, &contact.Phone2, &contact.Phone3, &contact.Phone4, &contact.Phone5}
    for i, phone := range phones {
        if i >= 5 {
            break
        }
        *phoneFields[i] = phone.Display
    }
    
    // Assign socials
    for _, social := range socials {
        switch social.Platform {
        case PlatformLinkedIn:
            contact.LinkedIn = social.URL
        case PlatformFacebook:
            contact.Facebook = social.URL
        case PlatformTwitter:
            contact.Twitter = social.URL
        case PlatformInstagram:
            contact.Instagram = social.URL
        case PlatformYouTube:
            contact.YouTube = social.URL
        case PlatformTikTok:
            contact.TikTok = social.URL
        case PlatformWhatsApp:
            contact.WhatsApp = social.URL
        case PlatformTelegram:
            contact.Telegram = social.URL
        }
    }
    
    // Calculate confidence
    contact.Confidence = a.calculateConfidence(emails, phones, socials)
    
    return contact
}
```

---

## 8. Database Schema

```sql
-- Root DB: data/{appName}/rag/contacts/registry.db

CREATE TABLE ExtractionJobs (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'pending',
    total_urls INTEGER NOT NULL,
    processed_urls INTEGER DEFAULT 0,
    failed_urls INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

CREATE TABLE DomainIndex (
    domain TEXT PRIMARY KEY,
    last_extracted DATETIME,
    extraction_count INTEGER DEFAULT 0,
    cache_hash TEXT
);

-- Session DB: data/{appName}/rag/contacts/cache/{domain-hash}.db

CREATE TABLE Contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_url TEXT NOT NULL,
    company_name TEXT,
    
    -- Emails (up to 5)
    email_1 TEXT,
    email_2 TEXT,
    email_3 TEXT,
    email_4 TEXT,
    email_5 TEXT,
    
    -- Phones (up to 5)
    phone_1 TEXT,
    phone_2 TEXT,
    phone_3 TEXT,
    phone_4 TEXT,
    phone_5 TEXT,
    
    -- Social profiles
    linkedin TEXT,
    facebook TEXT,
    twitter TEXT,
    instagram TEXT,
    youtube TEXT,
    tiktok TEXT,
    pinterest TEXT,
    whatsapp TEXT,
    telegram TEXT,
    
    -- Location
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    postal_code TEXT,
    
    -- Metadata
    pages_scanned TEXT,                       -- JSON array
    extracted_from TEXT,                      -- JSON array of sources
    confidence REAL,
    verified BOOLEAN DEFAULT FALSE,
    extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ttl_expires DATETIME NOT NULL
);

CREATE TABLE EmailDetails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    email_type TEXT,
    source TEXT,
    confidence REAL,
    verified BOOLEAN DEFAULT FALSE,
    verified_at DATETIME,
    FOREIGN KEY (contact_id) REFERENCES Contacts(id)
);

CREATE TABLE PhoneDetails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER NOT NULL,
    raw_value TEXT,
    formatted TEXT NOT NULL,
    display TEXT,
    country_code TEXT,
    phone_type TEXT,
    source TEXT,
    confidence REAL,
    FOREIGN KEY (contact_id) REFERENCES Contacts(id)
);

CREATE TABLE SocialDetails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER NOT NULL,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    handle TEXT,
    source TEXT,
    verified BOOLEAN DEFAULT FALSE,
    confidence REAL,
    FOREIGN KEY (contact_id) REFERENCES Contacts(id)
);

CREATE INDEX IdxContactsDomain ON Contacts(source_url);
CREATE INDEX IdxEmailsContact ON EmailDetails(contact_id);
CREATE INDEX IdxPhonesContact ON PhoneDetails(contact_id);
CREATE INDEX IdxSocialsContact ON SocialDetails(contact_id);
CREATE INDEX IdxSocialsPlatform ON SocialDetails(platform);
```

---

## 9. Configuration

```yaml
# config/gsearch.seed.yaml
contact:
  cache:
    ttl_days: 180               # 6 months for contact data
    max_entries: 50000
    
  extraction:
    deep_default: false
    max_pages: 5
    request_delay_ms: 1000
    request_timeout_seconds: 15
    max_emails_per_domain: 5
    max_phones_per_domain: 5
    
  verification:
    verify_emails_default: false
    verify_socials_default: false
    mx_cache_hours: 24
    
  target_pages:
    - contact
    - contact-us
    - about
    - about-us
    - team
    - support
    
  social_platforms:
    enabled:
      - linkedin
      - facebook
      - twitter
      - instagram
      - youtube
      - tiktok
      - whatsapp
    verify_by_default: false
```

---

## 10. Error Handling

### 10.1 Error Codes (7760-7779)

| Code | Constant | Description |
|------|----------|-------------|
| 7760 | `ErrContactUrlInvalid` | Invalid or malformed URL |
| 7761 | `ErrContactFetchFailed` | Failed to fetch page |
| 7762 | `ErrContactParseFailed` | Failed to parse HTML |
| 7763 | `ErrContactPageNotFound` | Contact page not found |
| 7764 | `ErrContactTimeout` | Extraction timed out |
| 7765 | `ErrContactRateLimited` | Target site rate limited |
| 7766 | `ErrContactBlocked` | Scraping blocked by target |
| 7767 | `ErrEmailVerificationFailed` | Email verification failed |
| 7768 | `ErrSocialVerificationFailed` | Social profile verification failed |
| 7769 | `ErrContactCacheFailed` | Cache read/write error |
| 7770 | `ErrBatchJobFailed` | Batch processing failed |
| 7771 | `ErrContactNoResults` | No contact info found |

---

## 11. API Endpoints

```
POST /api/v1/extract/contact        # Extract from single URL
POST /api/v1/extract/contact/batch  # Batch extraction
GET  /api/v1/extract/contact/batch/{id} # Batch status

POST /api/v1/extract/social         # Find social profiles
POST /api/v1/verify/email           # Verify email
POST /api/v1/verify/social          # Verify social profile

GET  /api/v1/contacts/{domain}      # Get cached contact
DELETE /api/v1/contacts/{domain}    # Clear cache
```

---

## 12. JSON Response Example

```json
{
  "success": true,
  "url": "https://example.com",
  "domain": "example.com",
  "contact": {
    "company_name": "Example Corp",
    "email_1": "info@example.com",
    "email_2": "support@example.com",
    "phone_1": "+1 (555) 123-4567",
    "phone_2": "+1 (800) 555-1234",
    "linkedin": "https://linkedin.com/company/example-corp",
    "facebook": "https://facebook.com/examplecorp",
    "twitter": "https://twitter.com/examplecorp",
    "instagram": "https://instagram.com/examplecorp",
    "youtube": "https://youtube.com/@examplecorp",
    "whatsapp": "https://wa.me/15551234567",
    "address": "123 Main St, Suite 100",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "postal_code": "10001",
    "extracted_from": ["mailto", "schema", "link"],
    "confidence": 0.92,
    "verified": true
  },
  "pages_scanned": [
    "https://example.com",
    "https://example.com/contact",
    "https://example.com/about"
  ],
  "extraction_time_ms": 2340,
  "from_cache": false,
  "extracted_at": "2026-02-04T10:30:00Z"
}
```

---

## 13. Related Files

- Plan: `41-business-intelligence-plan.md`
- Phase 3: `44-serp-position-tracking.md` (uses contact extraction)
- Phase 5: `46-google-maps-search.md` (uses contact extraction)
- URL Extraction: `../../../25-gsearch-cli/01-backend/gsearch-url-extraction.md`
