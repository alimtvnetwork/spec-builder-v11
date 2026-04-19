# FAQ Schema (JSON-LD) Writing Specification

> **Purpose**: This specification enables AI systems to generate SEO-optimized FAQ Schema markup (JSON-LD) that enhances Google rich results visibility. The schema content follows the same E-E-A-T principles as HTML but with simplified markup for structured data.

---

## Schema Structure

### Base JSON-LD Template

```html
<div id="faq-schema-markup-section" class="faq-schema-markup">
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[Question text with variables]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[HTML-formatted answer with <p>, <a>, <strong> tags]"
      }
    }
  ]
}
  </script>
</div>
```

### Key Structural Requirements

1. **Valid JSON**: Ensure proper JSON formatting (escaped quotes, no trailing commas)
2. **HTML in Text**: The `text` field contains HTML markup as a string
3. **Escape Quotes**: Use single quotes (`'`) for HTML attributes inside the JSON string
4. **3 Paragraphs**: Each answer should contain exactly 3 `<p>` tags

---

## Variable Reference

### Company Variables
```
{CompanyName}                  → Company display name
{CompanyUrl}                   → Base URL (use single quotes in href)
{YearsOfExperience}            → Years of experience
{ProjectsCompleted}            → Total completed projects
```

### Location Variables
```
{AreaName}                     → Local area name
{CityName}                     → City name
{AreaUrlSlug}                  → URL-safe area name
{CityUrlSlug}                  → URL-safe city name
```

### Service Variables
```
{ServiceName}                  → Capitalized service name
{ServiceNameLowercase}         → Lowercase service name
{ServiceNameLowercasePlural}   → Plural lowercase (e.g., "carpets")
{ServiceUrlSlug}               → URL-safe service name
{ServiceAction}                → Action verb (e.g., "cleaning")
{ServiceMethod}                → Method name (e.g., "hot water extraction")
{ServiceEquipment}             → Equipment (e.g., "industrial grade extraction")
{ServiceBenefit}               → Main benefit (e.g., "sanitization")
{ServiceResult}                → Result (e.g., "pristine floors")
```

### Metrics Variables
```
{PriceRangeMinimum}            → Minimum price number
{PriceRangeMaximum}            → Maximum price number
{DryingTimeMinimumHours}       → Minimum hours
{DryingTimeMaximumHours}       → Maximum hours
{MoldGrowthTimeMinimumHours}   → Mold growth minimum hours (e.g., 24)
{MoldGrowthTimeMaximumHours}   → Mold growth maximum hours (e.g., 48)
```

### SEO Variables
```
{TransitionWord}               → Capitalized transition word
```

---

## Content Writing Rules

### Schema vs HTML Differences

| Aspect | HTML Template | Schema Template |
|--------|---------------|-----------------|
| Title attributes | Extensive on every element | Not used (no title attr in schema) |
| Link complexity | `<strong><a>` wrappers | Simple `<a>` tags only |
| Formatting | `<h4>`, `<em>`, complex nesting | Only `<p>`, `<a>`, `<strong>` |
| Transition density | 40%+ with variety | 40%+ but simplified placement |

### Writing Constraints (Same as HTML)

- **Sentence length**: Maximum 18 words
- **No hyphens**: Use spaces ("budget friendly" not "budget-friendly")
- **Transition words**: Start 40%+ of sentences with transitions
- **No repeated starts**: No two consecutive sentences with same first word
- **Answer first**: First sentence must directly answer the question

### Allowed HTML Tags in Schema

```
<p>       → Paragraph wrapper (exactly 3 per answer)
<a>       → Links (use single quotes for href)
<strong>  → Company name emphasis
```

---

## Answer Structure Pattern

### Three-Paragraph Formula

Each FAQ answer follows this exact structure:

**Paragraph 1 - Direct Answer + Company**
```
<p>[Direct answer to question]. {TransitionWord}, [supporting detail]. <strong>{CompanyName}</strong> [company benefit/credential].</p>
```

**Paragraph 2 - Details + Alternatives**
```
<p>{TransitionWord}, [expanded information]. {TransitionWord}, [comparison or additional detail]. {TransitionWord}, [technical specifics]. {TransitionWord}, [supporting fact].</p>
```

**Paragraph 3 - Location + Conclusion**
```
<p>{TransitionWord}, <a href='[location URL]'>{AreaName} or {CityName}</a> [local benefit]. {TransitionWord}, [reinforcing statement]. {TransitionWord}, [concluding recommendation with implicit CTA].</p>
```

---

## Paragraph Flow Examples

### Paragraph 1 Examples

**Budget Question:**
```
<p>Budget friendly {ServiceNameLowercase} {ServiceAction} starts with regular vacuuming and immediate spot treatment. {TransitionWord}, using household items like baking soda helps maintain freshness. <strong>{CompanyName}</strong> offers affordable multi room packages.</p>
```

**Comparison Question:**
```
<p>Steam cleaning remains the superior choice for <a href='{CompanyUrl}/{ServiceUrlSlug}-service-in-{AreaUrlSlug}/'>{ServiceNameLowercase} maintenance</a>. At <strong>{CompanyName}</strong>, we exclusively offer professional {ServiceMethod} services. {TransitionWord}, this method deeply sanitizes fibers without leaving chemical residue.</p>
```

**Cost Question:**
```
<p>Professional <a href='{CompanyUrl}/{ServiceUrlSlug}-cheapest/'>{ServiceNameLowercase} {ServiceAction}</a> generally runs ${PriceRangeMinimum} to ${PriceRangeMaximum} per room based on size. {TransitionWord}, <strong>{CompanyName}</strong> provides upfront, competitive rates without surprise charges after completion. Soil level significantly impacts the final cost for each room treated.</p>
```

### Paragraph 2 Examples

**Expanding Details:**
```
<p>{TransitionWord}, strategic deep {ServiceAction} of high traffic areas remains essential. {TransitionWord}, placing mats at entryways prevents excessive dirt accumulation. {TransitionWord}, removing shoes indoors significantly reduces soil buildup. {TransitionWord}, addressing spills instantly prevents costly stain setting.</p>
```

**Technical Information:**
```
<p>{TransitionWord}, proper ventilation dramatically reduces waiting time for residents. {TransitionWord}, we suggest running fans to accelerate moisture evaporation effectively. {TransitionWord}, opening windows ensures strong ventilation throughout the space after treatment. {TransitionWord}, {ServiceNameLowercase} density impacts the overall drying duration significantly.</p>
```

### Paragraph 3 Examples

**Location + Conclusion:**
```
<p>{TransitionWord}, homemade solutions work for minor maintenance tasks. {TransitionWord}, periodic <a href='{CompanyUrl}/{ServiceUrlSlug}-service-in-{AreaUrlSlug}/'>professional {ServiceAction}</a> prevents premature {ServiceNameLowercase} replacement. {TransitionWord}, {ProjectsCompleted} completed projects prove cost effectiveness. {TransitionWord}, our budget conscious service packages cost less than repeated DIY attempts. {TransitionWord}, for {ServiceResult} in <a href='{CompanyUrl}/{ServiceUrlSlug}-in-{CityUrlSlug}/'>{CityName}</a>, professional treatment is the smart choice today.</p>
```

---

## Linking in Schema

### URL Patterns

Use single quotes for all href attributes in schema:

```
'{CompanyUrl}/{ServiceUrlSlug}-in-{AreaUrlSlug}/'
'{CompanyUrl}/{ServiceUrlSlug}-service-in-{AreaUrlSlug}/'
'{CompanyUrl}/{ServiceUrlSlug}-in-{CityUrlSlug}/'
'{CompanyUrl}/top-{ServiceUrlSlug}-in-{AreaUrlSlug}/'
'{CompanyUrl}/{ServiceUrlSlug}-cheapest/'
```

### Link Frequency

- **Paragraph 1**: 1-2 links (service + company reference)
- **Paragraph 2**: 0-1 links (optional, for key terms)
- **Paragraph 3**: 1-2 links (location + service CTA)

### Link Examples

**Service Link:**
```html
<a href='{CompanyUrl}/{ServiceUrlSlug}-in-{AreaUrlSlug}/'>{ServiceNameLowercase} {ServiceAction}</a>
```

**Location Link:**
```html
<a href='{CompanyUrl}/{ServiceUrlSlug}-in-{CityUrlSlug}/'>{CityName}</a>
```

**Action Link:**
```html
<a href='{CompanyUrl}/{ServiceUrlSlug}-service-in-{AreaUrlSlug}/'>professional {ServiceAction}</a>
```

---

## Question Patterns

### Service-Agnostic Question Templates

| Category | Question Pattern |
|----------|-----------------|
| Budget | "How to clean a {ServiceNameLowercase} on a budget?" |
| Comparison | "Is it better to [method A] or [method B] {ServiceNameLowercasePlural}?" |
| Duration | "How long does it take for {ServiceNameLowercase} to dry after {ServiceAction}?" |
| Time Rules | "What is the 20-minute rule in {ServiceAction}?" |
| Cost General | "How much does it cost to clean a {ServiceNameLowercase} per room?" |
| Cost Local | "How much does it cost to clean a {ServiceNameLowercase} per room in {CityName}?" |
| Value | "Is it worth professionally {ServiceAction} a {ServiceNameLowercase}?" |
| Deep Clean | "Is it worth paying for a deep clean?" |
| Difficult | "How to clean a really filthy {ServiceNameLowercase}?" |
| DIY | "How can I deep clean my {ServiceNameLowercase} myself?" |
| DIY vs Pro | "Is it cheaper to DIY or rent a cleaner?" |
| Process | "Where does the dirt go when you steam clean a {ServiceNameLowercase}?" |
| Best Method | "Which method of {ServiceNameLowercase} {ServiceAction} is best?" |
| Disadvantages | "What are the disadvantages of steam {ServiceAction} {ServiceNameLowercasePlural}?" |
| Mistakes | "What not to do when shampooing {ServiceNameLowercase}?" |
| Drying | "Is heat or AC better to dry {ServiceNameLowercase}?" |
| Risks | "How quickly can mold grow under wet {ServiceNameLowercase}?" |

---

## Complete Examples

### Example 1: Budget Question

```json
{
  "@type": "Question",
  "name": "How to clean a {ServiceNameLowercase} on a budget?",
  "acceptedAnswer": {
    "@type": "Answer",
    "text": "<p>Budget friendly {ServiceNameLowercase} {ServiceAction} starts with regular vacuuming and immediate spot treatment. {TransitionWord}, using household items like baking soda helps maintain freshness. <strong>{CompanyName}</strong> offers affordable multi room packages.</p><p>{TransitionWord}, strategic deep {ServiceAction} of high traffic areas remains essential. {TransitionWord}, placing mats at entryways prevents excessive dirt accumulation. {TransitionWord}, removing shoes indoors significantly reduces soil buildup. {TransitionWord}, addressing spills instantly prevents costly stain setting.</p><p>{TransitionWord}, homemade solutions work for minor maintenance tasks. {TransitionWord}, periodic <a href='{CompanyUrl}/{ServiceUrlSlug}-service-in-{AreaUrlSlug}/'>professional {ServiceAction}</a> prevents premature {ServiceNameLowercase} replacement. {TransitionWord}, {ProjectsCompleted} completed projects prove cost effectiveness. {TransitionWord}, our budget conscious service packages cost less than repeated DIY attempts. {TransitionWord}, for {ServiceResult} in <a href='{CompanyUrl}/{ServiceUrlSlug}-in-{CityUrlSlug}/'>{CityName}</a>, professional treatment is the smart choice today.</p>"
  }
}
```

### Example 2: Comparison Question

```json
{
  "@type": "Question",
  "name": "Is it better to shampoo or steam clean {ServiceNameLowercasePlural}?",
  "acceptedAnswer": {
    "@type": "Answer",
    "text": "<p>Steam cleaning remains the superior choice for {ServiceNameLowercase} maintenance. At <strong>{CompanyName}</strong>, we exclusively offer professional {ServiceMethod} services. {TransitionWord}, this method deeply sanitizes fibers without leaving chemical residue.</p><p>{TransitionWord}, shampooing tends to leave sticky film that attracts dirt quickly. {TransitionWord}, your floors look dull within days of traditional {ServiceAction}. {TransitionWord}, our steam {ServiceAction} method delivers deeper {ServiceBenefit} with faster drying times. {TransitionWord}, {ServiceNameLowercasePlural} typically dry within {DryingTimeMinimumHours} to {DryingTimeMaximumHours} hours after treatment.</p><p>{TransitionWord}, <a href='{CompanyUrl}/{ServiceUrlSlug}-service-in-{CityUrlSlug}/'>{CityName} families</a> enjoy fresh, healthy homes without extended wait times. {TransitionWord}, avoiding chemical buildup protects children and pets effectively. {TransitionWord}, professional steam treatment is your best investment for long term {ServiceNameLowercase} health.</p>"
  }
}
```

### Example 3: Cost Question with Location

```json
{
  "@type": "Question",
  "name": "How much does it cost to clean a {ServiceNameLowercase} per room in {CityName}?",
  "acceptedAnswer": {
    "@type": "Answer",
    "text": "<p>In <a href='{CompanyUrl}/{ServiceUrlSlug}-in-{CityUrlSlug}/'>{CityName}</a>, professional {ServiceNameLowercase} {ServiceAction} typically ranges from ${PriceRangeMinimum} to ${PriceRangeMaximum} per room. {TransitionWord}, dimensions and condition directly influence the final cost for treatment. <strong>{CompanyName}</strong> offers clear, market appropriate pricing designed specifically for local homeowners.</p><p>{TransitionWord}, larger areas or particularly dirty {ServiceNameLowercasePlural} may increase the price based on required effort. {TransitionWord}, bundled services for multiple rooms deliver better value for homeowners. {TransitionWord}, treating several rooms simultaneously reduces the per room cost effectively. {TransitionWord}, our {CityName} specific rates ensure you receive outstanding service aligned with local market expectations.</p><p>{TransitionWord}, residents enjoy premium results without excessive costs compared to alternatives. {TransitionWord}, transparent quotes before work begins eliminate surprise charges entirely. {TransitionWord}, choosing <a href='{CompanyUrl}/{ServiceUrlSlug}-service-in-{CityUrlSlug}/'>local {CityName} specialists</a> ensures you receive appropriate, fair pricing with exceptional service quality.</p>"
  }
}
```

### Example 4: Risk/Safety Question

```json
{
  "@type": "Question",
  "name": "How quickly can mold grow under wet {ServiceNameLowercase}?",
  "acceptedAnswer": {
    "@type": "Answer",
    "text": "<p>Mold can develop in as little as {MoldGrowthTimeMinimumHours} to {MoldGrowthTimeMaximumHours} hours when {ServiceNameLowercasePlural} stay moist beyond recommended drying periods. {TransitionWord}, this represents a significant risk that <strong>{CompanyName}</strong> prevents with powerful extraction technology and proper technique. Effective moisture removal is essential for preventing health hazards associated with mold exposure and respiratory issues.</p><p>{TransitionWord}, {ServiceNameLowercasePlural} should feel barely damp after professional treatment, never soaked through. {TransitionWord}, our {ServiceEquipment} removes far more moisture than consumer machines possibly can. {TransitionWord}, we advise using fans right after {ServiceAction} to accelerate evaporation process.</p><p>{TransitionWord}, <a href='{CompanyUrl}/{ServiceUrlSlug}-in-{CityUrlSlug}/'>{CityName}</a> homes remain protected from dangerous mold development after our treatment sessions. {TransitionWord}, if {ServiceNameLowercasePlural} have not dried within 12 hours, additional steps may be needed. {TransitionWord}, choosing professional service with proper extraction eliminates mold risks while ensuring complete {ServiceNameLowercase} health.</p>"
  }
}
```

---

## JSON Formatting Checklist

Before outputting schema:

- [ ] All HTML attributes use single quotes (`'`)
- [ ] No trailing commas after last array/object items
- [ ] Proper JSON escaping for special characters
- [ ] Exactly 3 `<p>` tags per answer
- [ ] Only `<p>`, `<a>`, `<strong>` tags used
- [ ] First sentence directly answers the question
- [ ] Company name in `<strong>` tags within paragraph 1
- [ ] 40%+ sentences start with {TransitionWord}
- [ ] Location link in paragraph 3
- [ ] No hyphens in content text

---

## Industry Adaptation Guide

To adapt for different industries, replace these core variables:

### Carpet Cleaning → Plumbing
```
{ServiceName} = "Plumbing"
{ServiceNameLowercase} = "plumbing"
{ServiceNameLowercasePlural} = "pipes"
{ServiceAction} = "repair"
{ServiceMethod} = "hydro jetting"
{ServiceEquipment} = "professional grade tools"
{ServiceBenefit} = "leak prevention"
{ServiceResult} = "fully functional plumbing"
```

### Carpet Cleaning → HVAC
```
{ServiceName} = "HVAC Maintenance"
{ServiceNameLowercase} = "air conditioning"
{ServiceNameLowercasePlural} = "HVAC units"
{ServiceAction} = "servicing"
{ServiceMethod} = "refrigerant recharge"
{ServiceEquipment} = "diagnostic equipment"
{ServiceBenefit} = "energy efficiency"
{ServiceResult} = "optimal cooling performance"
```

### Carpet Cleaning → Window Cleaning
```
{ServiceName} = "Window Cleaning"
{ServiceNameLowercase} = "window cleaning"
{ServiceNameLowercasePlural} = "windows"
{ServiceAction} = "cleaning"
{ServiceMethod} = "pure water technology"
{ServiceEquipment} = "water fed poles"
{ServiceBenefit} = "streak free clarity"
{ServiceResult} = "crystal clear windows"
```
