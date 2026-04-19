# FAQ HTML Content Writing Specification

> **Purpose**: This specification enables AI systems to generate SEO-optimized FAQ HTML content that ranks highly in Google search results. Follow these patterns exactly to produce human-like, authoritative content that demonstrates E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness).

---

## Content Philosophy

### Core Principles

1. **Answer First**: Every FAQ answer MUST begin with a direct answer to the question in the first sentence
2. **Company Glorification**: Seamlessly integrate company credentials within the first 2 sentences
3. **Statistical Authority**: Use specific decimal percentages (not rounded numbers) to establish credibility
4. **Transition Density**: Maintain 40%+ transition word usage across all content
5. **Humanized Flow**: Content must read naturally—avoid robotic patterns
6. **No Hyphens**: Never use hyphens in content (use spaces instead: "budget friendly" not "budget-friendly")

### Writing Constraints

| Constraint | Requirement |
|------------|-------------|
| Sentence length | Maximum 18 words |
| Paragraph length | Maximum 180 words |
| Transition word density | Minimum 40% of sentences start with transition words |
| Keyword appearances | Minimum 8 times in varied forms |
| Area/location mentions | 3-4 times per answer |
| Sentence starts | No two consecutive sentences start with the same word |

---

## Variable Reference

### Company Variables
```
{CompanyName}                  → Display name (e.g., "Atto Property")
{CompanyUrl}                   → Base URL without trailing slash
{CompanyFoundedYear}           → Year founded (e.g., "2023")
{YearsOfExperience}            → Direct experience years (e.g., "5")
{CombinedExperience}           → Team combined years (e.g., "15")
{ProjectsCompleted}            → Total projects number (e.g., "5647")
{ClientsServed}                → Total clients served (e.g., "3000")
```

### Location Variables
```
{AreaName}                     → Local area (e.g., "Melton")
{AreaUrlSlug}                  → URL slug (e.g., "melton")
{CityName}                     → City name (e.g., "Melbourne CBD")
{CityUrlSlug}                  → URL slug (e.g., "melbourne-cbd")
{RegionName}                   → Region (e.g., "Victoria")
{CountryName}                  → Country (e.g., "Australia")
```

### Service Variables
```
{ServiceName}                  → Capitalized name (e.g., "Carpet Cleaning")
{ServiceNameLowercase}         → Lowercase (e.g., "carpet cleaning")
{ServiceNameLowercasePlural}   → Plural lowercase (e.g., "carpets")
{ServiceUrlSlug}               → URL slug (e.g., "carpet-cleaning")
{ServiceAction}                → Action verb (e.g., "cleaning")
{ServiceMethodPrimary}         → Primary method (e.g., "steam cleaning")
{ServiceMethodSecondary}       → Alternative method (e.g., "shampooing")
{ServiceEquipment}             → Equipment (e.g., "industrial extraction")
{ServiceBenefit}               → Main benefit (e.g., "sanitization")
{ServiceResult}                → End result (e.g., "pristine floors")
```

### Metrics Variables
```
{TrustPercentage}              → Random 2.51-2.97 with 2 decimals
{MonthlyImprovementPercentage} → Random 1.0-5.0 with 2 decimals
{EffectivenessPercentage}      → High percentage (e.g., "87.34")
{DryingTimeMinimumHours}       → Minimum hours (e.g., "4")
{DryingTimeMaximumHours}       → Maximum hours (e.g., "8")
{PriceRangeMinimum}            → Minimum price (e.g., "30")
{PriceRangeMaximum}            → Maximum price (e.g., "60")
```

### SEO Transition Variables
```
{TransitionWord}               → Capitalized (e.g., "Furthermore")
{TransitionWordLowercase}      → Lowercase (e.g., "furthermore")
```

### External Source Variables
```
{NewsSourceUrl}                → News URL (e.g., "https://www.abc.net.au/")
{NewsSourceName}               → News name (e.g., "ABC News")
{ConsumerSourceUrl}            → Consumer URL (e.g., "https://www.choice.com.au/")
{ConsumerSourceName}           → Consumer name (e.g., "Consumer Advocates")
```

---

## HTML Structure Requirements

### FAQ Container Structure
```html
<div class="paragraph-parent-block seo-parent-block seo-page-block center abstract-page-container abstract-page-faq-container">
  <div class="seo-faq-list seo-container-para contrast">
    <!-- FAQ items go here -->
  </div>
</div>
```

### Individual FAQ Item Structure
```html
<div class="faq-item">
  <details class="faq-detail-tab">
    <summary class="faq-summary-tab">
      <h3 title="[UNIQUE TITLE ATTRIBUTE - SEE TITLE SECTION]">
        {FaqQuestion}
      </h3>
      <i class="faq-icon-wrapper"><i class="faq-icon"></i></i>
    </summary>
    <div class="faq-content">
      <!-- Answer content with rich linking -->
    </div>
  </details>
</div>
```

### Critical HTML Rules

1. **No P tags inside `seo-container-para contrast`**: Content flows directly in the `faq-content` div
2. **Use `<strong>` for important links**: Wrap anchor tags in `<strong>` with descriptive title attributes
3. **Use `<em>` for location emphasis**: Wrap location links in `<em>` tags
4. **Use `<h4 class="inner-seo-header">` for inline emphasis**: For key phrases within content

---

## Title Attribute Writing

### H3 Title Attribute Pattern

The `<h3>` title attribute provides hidden SEO context. Structure:

```
"{TransitionWord}, [Topic Summary]: [benefit description] growing trust by {TransitionWordLowercase} {TrustPercentage}% monthly in {AreaName}. {TransitionWord}, this validates [positive outcome] over indeed [negative alternative] consistently."
```

**Example:**
```html
<h3 title="Moreover, Budget Carpet Cleaning: affordable maintenance strategies growing trust by consequently 2.74% monthly in Melton. Additionally, this validates professional packages over indeed DIY repeated attempts consistently.">
  How to clean a carpet on a budget?
</h3>
```

### Strong/Anchor Title Attribute Pattern

**Company Link Title:**
```
"{TransitionWord}, founded {CompanyFoundedYear} yet bringing {TransitionWordLowercase} {CombinedExperience} years combined expertise across {TransitionWordLowercase} {CityName}. {TransitionWord}, client loyalty growing {TrustPercentage}% monthly. {TransitionWord}, this demonstrates consistent service excellence indeed building lasting relationships."
```

**Service Link Title:**
```
"{TransitionWord}, professional {ServiceName} technology delivering affordability without compromising quality. {TransitionWord}, trust increasing {TrustPercentage}% monthly in {TransitionWordLowercase} {AreaName} area. {TransitionWord}, families choose value over thus expensive alternatives consistently."
```

### Title Attribute Rules

1. **Always unique**: No two title attributes should be identical
2. **Include transition words**: 2-3 transition words per title
3. **Include metrics**: At least one percentage with decimals
4. **End with "indeed" + noun**: Provides natural flow
5. **Glorify the company**: Mention credentials, experience, or client trust

---

## Answer Content Writing

### First Sentence Formula

```
[Direct Answer to Question]. {TransitionWord}, [supporting fact or company credential].
```

**Examples:**

| Question Type | First Sentence Pattern |
|---------------|------------------------|
| "How to..." | "Budget friendly {ServiceNameLowercase} starts with [direct answer]. {TransitionWord}, {CompanyName} offers [company benefit]." |
| "Is it better..." | "{ServiceMethodPrimary} remains the superior choice for {ServiceNameLowercase} maintenance. At {CompanyName}, we exclusively offer [specific service]." |
| "How long..." | "Most professionally treated {ServiceNameLowercasePlural} need about {TimeMin} to {TimeMax} hours. {TransitionWord}, {CompanyName} employs advanced techniques." |
| "How much..." | "Professional {ServiceNameLowercase} {ServiceAction} generally runs ${Min} to ${Max} per room. {TransitionWord}, {CompanyName} provides upfront rates." |
| "Is it worth..." | "Absolutely; [direct answer about value]. {TransitionWord}, {CompanyName} delivers [specific benefit]." |

### Content Flow Structure

Each answer should follow this 3-paragraph flow:

**Paragraph 1 - Direct Answer + Company:**
- Answer the question immediately
- Introduce company within first 2 sentences
- Include 2-3 internal links

**Paragraph 2 - Supporting Details:**
- Expand on the answer with specifics
- Compare alternatives (favor company's approach)
- Include statistics and timeframes

**Paragraph 3 - Local Authority + CTA:**
- Reference the local area/city
- Mention external authority sources (news, consumer advocates)
- End with implicit call-to-action

---

## Internal Linking Strategy

### Link Frequency
- **2-3 links per paragraph**
- Every company mention should be linked
- Service mentions should alternate between linked and unlinked

### URL Slug Patterns

| Link Type | URL Pattern |
|-----------|-------------|
| Service in Area | `{CompanyUrl}/{ServiceUrlSlug}-in-{AreaUrlSlug}/` |
| Service in City | `{CompanyUrl}/{ServiceUrlSlug}-in-{CityUrlSlug}/` |
| Top Service in Area | `{CompanyUrl}/top-{ServiceUrlSlug}-in-{AreaUrlSlug}/` |
| Cheapest Service | `{CompanyUrl}/{ServiceUrlSlug}-cheapest/` |
| Service Details | `{CompanyUrl}/{ServiceUrlSlug}-service-in-{AreaUrlSlug}/` |
| Projects Portfolio | `{CompanyUrl}/{ServiceUrlSlug}-projects-completed-{CityUrlSlug}` |
| Home Page | `{CompanyUrl}/` |

### Link Wrapper Examples

**Service Link with Strong:**
```html
<strong title="[SEO title attribute]">
  <a href="{CompanyUrl}/{ServiceUrlSlug}-in-{AreaUrlSlug}/" 
     title="[Different anchor title]">
    {ServiceName}
  </a>
</strong>
```

**Company Link with Strong:**
```html
<strong title="[Company credential title]">
  <a href="{CompanyUrl}/" 
     title="{TransitionWord}, {CityName} {ServiceName} specialists serving {TransitionWordLowercase} {ClientsServed} satisfied clients">
    {CompanyName}
  </a>
</strong>
```

**Location Link with Em:**
```html
<em title="[Location benefit title]">
  <a href="{CompanyUrl}/{ServiceUrlSlug}-in-{CityUrlSlug}/" 
     title="{TransitionWord}, serving {CityName} families with {TransitionWordLowercase} specialized {ServiceAction}">
    {CityName}
  </a>
</em>
```

**External Link with NoFollow:**
```html
<a href="{NewsSourceUrl}" 
   title="{TransitionWord}, {CountryName} news source confirming {TransitionWordLowercase} professional {ServiceAction} benefits" 
   target="_blank" 
   rel="nofollow">
  {NewsSourceName}
</a>
```

---

## Transition Word Usage

### Approved Transition Words
```
Furthermore, Moreover, Additionally, Consequently, Therefore,
However, Nevertheless, Thus, Indeed, Notably,
Subsequently, Meanwhile, Ultimately, Accordingly, Hence,
Similarly, Likewise, In contrast, On the other hand, As a result
```

### Usage Rules

1. **40%+ of sentences** must begin with a transition word
2. **Vary the words**: Don't use the same transition word in consecutive sentences
3. **Match context**:
   - `Furthermore/Moreover/Additionally` - Adding information
   - `However/Nevertheless` - Contrasting
   - `Therefore/Consequently/Thus` - Cause and effect
   - `Ultimately` - Concluding statements
   - `Indeed` - Emphasis

---

## E-E-A-T Storytelling

### Experience Pattern
```
"{ProjectsCompleted} completed projects prove [benefit]"
"through {YearsOfExperience} years of experience"
"founded {CompanyFoundedYear} with {CombinedExperience} years combined expertise"
```

### Expertise Pattern
```
"our technicians assess fiber type before selecting treatment methods"
"certified professionals understand precise moisture levels"
"we utilize specialized formulations and {ServiceEquipment}"
```

### Authoritativeness Pattern
```
"{NewsSourceName} reports {EffectivenessPercentage}% of homeowners..."
"{ConsumerSourceName} recommend {ServiceMethodPrimary} over alternatives"
"major {ServiceNameLowercase} manufacturers specifically recommend..."
```

### Trustworthiness Pattern
```
"transparent quotes eliminate surprise charges entirely"
"our zero mold incident record across varied conditions"
"satisfaction guarantees unavailable with alternatives"
```

---

## Quick Reference Checklist

Before submitting generated content, verify:

- [ ] First sentence directly answers the question
- [ ] Company name appears in first 2 sentences
- [ ] 40%+ sentences start with transition words
- [ ] No two consecutive sentences start with same word
- [ ] All sentences under 18 words
- [ ] No hyphens in content
- [ ] 2-3 internal links per paragraph
- [ ] Title attributes are all unique
- [ ] Metrics use decimal percentages (not rounded)
- [ ] Location mentioned 3-4 times
- [ ] No P tags inside seo-container-para contrast class
- [ ] External links have target="_blank" rel="nofollow"
