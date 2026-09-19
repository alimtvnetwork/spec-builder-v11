# OpenAPI Specification - SEO Suite

> **Version:** 5.0.0  
> **Status:** Draft  
> **Last Updated:** 2026-03-09

---

## Overview

Complete OpenAPI 3.0 specification for all SEO endpoints including Company, Blog, FAQ, Paragraph, and Content Extraction APIs.

---

## OpenAPI Specification

```yaml
openapi: 3.0.3
info:
  title: AI Bridge SEO API
  description: |
    RESTful API for SEO content generation including company management,
    blog posts, FAQ, paragraphs, and content extraction.
  version: 1.0.0
  contact:
    name: API Support
    email: support@aibridge.dev
  license:
    name: MIT

servers:
  - url: http://localhost:5040/api/v1
    description: Local development
  - url: https://api.aibridge.dev/api/v1
    description: Production

tags:
  - name: Companies
    description: Company profile management
  - name: CTAs
    description: Call-to-action management
  - name: Blogs
    description: Blog post generation and management
  - name: FAQ
    description: FAQ generation and management
  - name: Paragraphs
    description: Paragraph generation
  - name: Categories
    description: Blog category management
  - name: Articles
    description: Reference article management
  - name: Extraction
    description: URL content extraction

paths:
  # ============================================
  # COMPANY ENDPOINTS
  # ============================================
  
  /seo/companies:
    get:
      tags: [Companies]
      summary: List all companies
      description: Returns all registered companies with summary statistics
      operationId: listCompanies
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/LimitParam'
        - name: industry
          in: query
          schema:
            type: string
          description: Filter by industry
      responses:
        '200':
          description: List of companies
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CompanyListResponse'
        '500':
          $ref: '#/components/responses/InternalError'
    
    post:
      tags: [Companies]
      summary: Create new company
      description: |
        Creates a new company profile with optional CTAs, services, locations,
        keywords, and reference articles. Optionally triggers sitemap crawling.
      operationId: createCompany
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateCompanyRequest'
      responses:
        '201':
          description: Company created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CreateCompanyResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          description: Company slug already exists
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          $ref: '#/components/responses/InternalError'

  /seo/{company}:
    parameters:
      - $ref: '#/components/parameters/CompanySlug'
    
    get:
      tags: [Companies]
      summary: Get company summary
      description: Returns company profile with SEO module statistics
      operationId: getCompanySummary
      responses:
        '200':
          description: Company summary
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CompanySummaryResponse'
        '404':
          $ref: '#/components/responses/NotFound'
    
    put:
      tags: [Companies]
      summary: Update company profile
      description: Updates company profile fields
      operationId: updateCompany
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateCompanyRequest'
      responses:
        '200':
          description: Company updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CompanyProfile'
        '404':
          $ref: '#/components/responses/NotFound'
    
    delete:
      tags: [Companies]
      summary: Delete company
      description: Deletes company and all associated data (blogs, FAQ, paragraphs)
      operationId: deleteCompany
      responses:
        '200':
          description: Company deleted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessResponse'
        '404':
          $ref: '#/components/responses/NotFound'

  # ============================================
  # CTA ENDPOINTS
  # ============================================

  /seo/{company}/ctas:
    parameters:
      - $ref: '#/components/parameters/CompanySlug'
    
    get:
      tags: [CTAs]
      summary: List all CTAs
      operationId: listCtas
      parameters:
        - name: type
          in: query
          schema:
            $ref: '#/components/schemas/CtaType'
        - name: active
          in: query
          schema:
            type: boolean
      responses:
        '200':
          description: List of CTAs
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CtaListResponse'
    
    post:
      tags: [CTAs]
      summary: Add CTA
      operationId: createCta
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateCtaRequest'
      responses:
        '201':
          description: CTA created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CompanyCta'

  /seo/{company}/ctas/random:
    parameters:
      - $ref: '#/components/parameters/CompanySlug'
    
    get:
      tags: [CTAs]
      summary: Get random CTA
      description: Returns a random active CTA weighted by priority
      operationId: getRandomCta
      parameters:
        - name: type
          in: query
          schema:
            $ref: '#/components/schemas/CtaType'
        - name: exclude
          in: query
          schema:
            type: integer
          description: CTA ID to exclude
      responses:
        '200':
          description: Random CTA
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RandomCtaResponse'

  /seo/{company}/ctas/{ctaId}:
    parameters:
      - $ref: '#/components/parameters/CompanySlug'
      - name: ctaId
        in: path
        required: true
        schema:
          type: integer
    
    put:
      tags: [CTAs]
      summary: Update CTA
      operationId: updateCta
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateCtaRequest'
      responses:
        '200':
          description: CTA updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CompanyCta'
    
    delete:
      tags: [CTAs]
      summary: Delete CTA
      operationId: deleteCta
      responses:
        '200':
          description: CTA deleted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessResponse'

  # ============================================
  # BLOG ENDPOINTS
  # ============================================

  /seo/blogs:
    get:
      tags: [Blogs]
      summary: List all blogs (admin)
      description: Lists all blogs across all companies
      operationId: listAllBlogs
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/LimitParam'
        - name: company
          in: query
          schema:
            type: string
        - name: status
          in: query
          schema:
            $ref: '#/components/schemas/BlogStatus'
      responses:
        '200':
          description: List of blogs
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BlogListResponse'

  /seo/{company}/blogs:
    parameters:
      - $ref: '#/components/parameters/CompanySlug'
    
    get:
      tags: [Blogs]
      summary: List company blogs
      operationId: listCompanyBlogs
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/LimitParam'
        - name: status
          in: query
          schema:
            $ref: '#/components/schemas/BlogStatus'
        - name: category
          in: query
          schema:
            type: string
        - name: sort
          in: query
          schema:
            type: string
            enum: [created_desc, created_asc, updated_desc, title_asc]
        - name: search
          in: query
          schema:
            type: string
      responses:
        '200':
          description: List of blogs
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BlogListResponse'
    
    post:
      tags: [Blogs]
      summary: Generate new blog
      operationId: createBlog
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateBlogRequest'
      responses:
        '201':
          description: Blog created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BlogResponse'

  /seo/{company}/blogs/{blogId}:
    parameters:
      - $ref: '#/components/parameters/CompanySlug'
      - $ref: '#/components/parameters/BlogId'
    
    get:
      tags: [Blogs]
      summary: Get single blog
      description: Returns full blog content with all sections
      operationId: getBlog
      responses:
        '200':
          description: Blog content
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BlogDetailResponse'
        '404':
          $ref: '#/components/responses/NotFound'
    
    put:
      tags: [Blogs]
      summary: Update blog
      operationId: updateBlog
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateBlogRequest'
      responses:
        '200':
          description: Blog updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BlogResponse'
    
    delete:
      tags: [Blogs]
      summary: Delete blog
      operationId: deleteBlog
      responses:
        '200':
          description: Blog deleted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessResponse'

  /seo/{company}/blogs/train:
    parameters:
      - $ref: '#/components/parameters/CompanySlug'
    
    post:
      tags: [Blogs]
      summary: Train blog generation
      operationId: trainBlog
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TrainBlogRequest'
      responses:
        '200':
          description: Training complete
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TrainingResponse'

  /seo/{company}/blogs/outline:
    parameters:
      - $ref: '#/components/parameters/CompanySlug'
    
    post:
      tags: [Blogs]
      summary: Generate outline only
      operationId: generateOutline
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/OutlineRequest'
      responses:
        '200':
          description: Outline generated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/OutlineResponse'

  # ============================================
  # FAQ ENDPOINTS
  # ============================================

  /seo/{company}/faq:
    parameters:
      - $ref: '#/components/parameters/CompanySlug'
    
    get:
      tags: [FAQ]
      summary: List FAQ sessions
      operationId: listFaq
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/LimitParam'
      responses:
        '200':
          description: List of FAQ sessions
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FaqListResponse'
    
    post:
      tags: [FAQ]
      summary: Generate FAQ
      operationId: generateFaq
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GenerateFaqRequest'
      responses:
        '201':
          description: FAQ generated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FaqResponse'

  /seo/{company}/faq/{faqId}:
    parameters:
      - $ref: '#/components/parameters/CompanySlug'
      - name: faqId
        in: path
        required: true
        schema:
          type: string
    
    get:
      tags: [FAQ]
      summary: Get FAQ content
      operationId: getFaq
      responses:
        '200':
          description: FAQ content
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FaqDetailResponse'
    
    put:
      tags: [FAQ]
      summary: Update FAQ
      operationId: updateFaq
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateFaqRequest'
      responses:
        '200':
          description: FAQ updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FaqResponse'
    
    delete:
      tags: [FAQ]
      summary: Delete FAQ
      operationId: deleteFaq
      responses:
        '200':
          description: FAQ deleted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessResponse'

  /seo/{company}/faq/train:
    parameters:
      - $ref: '#/components/parameters/CompanySlug'
    
    post:
      tags: [FAQ]
      summary: Train FAQ generation
      operationId: trainFaq
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TrainFaqRequest'
      responses:
        '200':
          description: Training complete
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TrainingResponse'

  # ============================================
  # PARAGRAPH ENDPOINTS
  # ============================================

  /seo/{company}/para:
    parameters:
      - $ref: '#/components/parameters/CompanySlug'
    
    get:
      tags: [Paragraphs]
      summary: List generated paragraphs
      operationId: listParagraphs
      parameters:
        - $ref: '#/components/parameters/PageParam'
        - $ref: '#/components/parameters/LimitParam'
      responses:
        '200':
          description: List of paragraphs
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ParagraphListResponse'
    
    post:
      tags: [Paragraphs]
      summary: Generate paragraph
      operationId: generateParagraph
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GenerateParagraphRequest'
      responses:
        '201':
          description: Paragraph generated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ParagraphResponse'

  /seo/{company}/para/{paraId}:
    parameters:
      - $ref: '#/components/parameters/CompanySlug'
      - name: paraId
        in: path
        required: true
        schema:
          type: string
    
    get:
      tags: [Paragraphs]
      summary: Get paragraph content
      operationId: getParagraph
      responses:
        '200':
          description: Paragraph content
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ParagraphDetailResponse'
    
    put:
      tags: [Paragraphs]
      summary: Update/regenerate paragraph
      operationId: updateParagraph
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateParagraphRequest'
      responses:
        '200':
          description: Paragraph updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ParagraphResponse'
    
    delete:
      tags: [Paragraphs]
      summary: Delete paragraph
      operationId: deleteParagraph
      responses:
        '200':
          description: Paragraph deleted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessResponse'

  /seo/{company}/para/train:
    parameters:
      - $ref: '#/components/parameters/CompanySlug'
    
    post:
      tags: [Paragraphs]
      summary: Train paragraph generation
      operationId: trainParagraph
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TrainParagraphRequest'
      responses:
        '200':
          description: Training complete
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TrainingResponse'

  # ============================================
  # CATEGORY ENDPOINTS
  # ============================================

  /seo/{company}/categories:
    parameters:
      - $ref: '#/components/parameters/CompanySlug'
    
    get:
      tags: [Categories]
      summary: List categories
      operationId: listCategories
      responses:
        '200':
          description: List of categories
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CategoryListResponse'
    
    post:
      tags: [Categories]
      summary: Create/update category
      operationId: upsertCategory
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpsertCategoryRequest'
      responses:
        '200':
          description: Category created/updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BlogCategory'

  /seo/{company}/categories/{categorySlug}:
    parameters:
      - $ref: '#/components/parameters/CompanySlug'
      - name: categorySlug
        in: path
        required: true
        schema:
          type: string
    
    delete:
      tags: [Categories]
      summary: Delete category
      description: Fails if blogs are assigned to this category
      operationId: deleteCategory
      responses:
        '200':
          description: Category deleted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessResponse'
        '409':
          description: Category has assigned blogs
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  # ============================================
  # REFERENCE ARTICLE ENDPOINTS
  # ============================================

  /seo/{company}/articles:
    parameters:
      - $ref: '#/components/parameters/CompanySlug'
    
    get:
      tags: [Articles]
      summary: List reference articles
      operationId: listArticles
      responses:
        '200':
          description: List of articles
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ArticleListResponse'
    
    post:
      tags: [Articles]
      summary: Add reference article
      description: Triggers GSearch extraction and style analysis
      operationId: addArticle
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AddArticleRequest'
      responses:
        '201':
          description: Article added
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ArticleResponse'

  /seo/{company}/articles/{articleId}:
    parameters:
      - $ref: '#/components/parameters/CompanySlug'
      - name: articleId
        in: path
        required: true
        schema:
          type: integer
    
    delete:
      tags: [Articles]
      summary: Delete reference article
      operationId: deleteArticle
      responses:
        '200':
          description: Article deleted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SuccessResponse'

  /seo/{company}/style:
    parameters:
      - $ref: '#/components/parameters/CompanySlug'
    
    get:
      tags: [Articles]
      summary: Get aggregated writing style
      operationId: getWritingStyle
      responses:
        '200':
          description: Writing style metrics
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WritingStyleResponse'

  /seo/{company}/style/analyze:
    parameters:
      - $ref: '#/components/parameters/CompanySlug'
    
    post:
      tags: [Articles]
      summary: Re-analyze all articles
      operationId: analyzeStyle
      responses:
        '200':
          description: Analysis complete
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WritingStyleResponse'

  # ============================================
  # EXTRACTION ENDPOINTS
  # ============================================

  /extract:
    post:
      tags: [Extraction]
      summary: Extract URL content
      description: Extracts content from URL with optional style analysis
      operationId: extractUrl
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ExtractRequest'
      responses:
        '200':
          description: Content extracted
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ExtractResponse'
        '400':
          $ref: '#/components/responses/BadRequest'

components:
  # ============================================
  # PARAMETERS
  # ============================================
  
  parameters:
    CompanySlug:
      name: company
      in: path
      required: true
      schema:
        type: string
      description: Company slug (e.g., "atto-property")
    
    BlogId:
      name: blogId
      in: path
      required: true
      schema:
        type: string
      description: Blog ID or slug (e.g., "001" or "carpet-cleaning-guide")
    
    PageParam:
      name: page
      in: query
      schema:
        type: integer
        default: 1
        minimum: 1
    
    LimitParam:
      name: limit
      in: query
      schema:
        type: integer
        default: 20
        minimum: 1
        maximum: 100

  # ============================================
  # RESPONSES
  # ============================================
  
  responses:
    BadRequest:
      description: Bad request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    
    InternalError:
      description: Internal server error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'

  # ============================================
  # SCHEMAS
  # ============================================
  
  schemas:
    # Common
    SuccessResponse:
      type: object
      properties:
        Success:
          type: boolean
        Message:
          type: string
    
    ErrorResponse:
      type: object
      properties:
        Success:
          type: boolean
          default: false
        Error:
          type: string
        Code:
          type: integer
    
    PaginationInfo:
      type: object
      properties:
        Page:
          type: integer
        Limit:
          type: integer
        TotalItems:
          type: integer
        TotalPages:
          type: integer
        HasNextPage:
          type: boolean
        HasPrevPage:
          type: boolean

    # Enums
    CtaType:
      type: string
      enum: [url, phone, email, whatsapp, form, booking]
    
    BlogStatus:
      type: string
      enum: [draft, published, archived, all]

    # Company
    CompanyProfile:
      type: object
      properties:
        Slug:
          type: string
        Name:
          type: string
        Website:
          type: string
        Industry:
          type: string
        Description:
          type: string
        Tagline:
          type: string
        SitemapUrl:
          type: string
        AutoCrawlEnabled:
          type: boolean
        TrainingComplete:
          type: boolean
        CreatedAt:
          type: string
          format: date-time
        UpdatedAt:
          type: string
          format: date-time
    
    CreateCompanyRequest:
      type: object
      required: [Name]
      properties:
        Name:
          type: string
        Website:
          type: string
        Industry:
          type: string
        Description:
          type: string
        SitemapUrl:
          type: string
        AutoCrawl:
          type: boolean
          description: Trigger sitemap crawl on creation
        Ctas:
          type: array
          items:
            $ref: '#/components/schemas/CreateCtaRequest'
        Services:
          type: array
          items:
            $ref: '#/components/schemas/ServiceInput'
        Locations:
          type: array
          items:
            $ref: '#/components/schemas/LocationInput'
        Keywords:
          type: array
          items:
            $ref: '#/components/schemas/KeywordInput'
        ReferenceArticles:
          type: array
          items:
            type: string
            format: uri
    
    CreateCompanyResponse:
      type: object
      properties:
        Success:
          type: boolean
        Company:
          $ref: '#/components/schemas/CompanyProfile'
        Ctas:
          type: object
          properties:
            Total:
              type: integer
            ByType:
              type: object
              additionalProperties:
                type: integer
        Crawl:
          type: object
          properties:
            Status:
              type: string
            Message:
              type: string
    
    UpdateCompanyRequest:
      type: object
      properties:
        Name:
          type: string
        Website:
          type: string
        Industry:
          type: string
        Description:
          type: string
        Tagline:
          type: string
        SitemapUrl:
          type: string
        AutoCrawlEnabled:
          type: boolean
    
    CompanyListResponse:
      type: object
      properties:
        Success:
          type: boolean
        Companies:
          type: array
          items:
            $ref: '#/components/schemas/CompanyProfile'
        Pagination:
          $ref: '#/components/schemas/PaginationInfo'
    
    CompanySummaryResponse:
      type: object
      properties:
        Success:
          type: boolean
        Company:
          $ref: '#/components/schemas/CompanyProfile'
        Summary:
          $ref: '#/components/schemas/SeoSummary'
        Categories:
          type: array
          items:
            $ref: '#/components/schemas/CategoryBrief'
    
    SeoSummary:
      type: object
      properties:
        Blogs:
          $ref: '#/components/schemas/BlogSummary'
        Faq:
          $ref: '#/components/schemas/FaqSummary'
        Paragraphs:
          $ref: '#/components/schemas/ParagraphSummary'
        Chat:
          $ref: '#/components/schemas/ChatSummary'
    
    BlogSummary:
      type: object
      properties:
        Total:
          type: integer
        Published:
          type: integer
        Draft:
          type: integer
        LastUpdated:
          type: string
          format: date-time
    
    FaqSummary:
      type: object
      properties:
        TotalSessions:
          type: integer
        TotalFaqs:
          type: integer
        LastUpdated:
          type: string
          format: date-time
    
    ParagraphSummary:
      type: object
      properties:
        TotalGenerated:
          type: integer
        LastUpdated:
          type: string
          format: date-time
    
    ChatSummary:
      type: object
      properties:
        TotalSessions:
          type: integer
        ActiveSessions:
          type: integer
        LastActivity:
          type: string
          format: date-time
    
    CategoryBrief:
      type: object
      properties:
        Slug:
          type: string
        Name:
          type: string
        BlogCount:
          type: integer

    # CTAs
    CompanyCta:
      type: object
      properties:
        Id:
          type: integer
        CompanySlug:
          type: string
        Type:
          $ref: '#/components/schemas/CtaType'
        Priority:
          type: integer
        Label:
          type: string
        ValueRaw:
          type: string
        ValueDisplay:
          type: string
        ValueLink:
          type: string
        Description:
          type: string
        IsActive:
          type: boolean
        CreatedAt:
          type: string
          format: date-time
    
    CreateCtaRequest:
      type: object
      required: [Type, Label, ValueRaw]
      properties:
        Type:
          $ref: '#/components/schemas/CtaType'
        Priority:
          type: integer
          default: 1
        Label:
          type: string
        ValueRaw:
          type: string
        Description:
          type: string
        IsActive:
          type: boolean
          default: true
    
    UpdateCtaRequest:
      type: object
      properties:
        Type:
          $ref: '#/components/schemas/CtaType'
        Priority:
          type: integer
        Label:
          type: string
        ValueRaw:
          type: string
        Description:
          type: string
        IsActive:
          type: boolean
    
    CtaListResponse:
      type: object
      properties:
        Success:
          type: boolean
        Ctas:
          type: array
          items:
            $ref: '#/components/schemas/CompanyCta'
    
    RandomCtaResponse:
      type: object
      properties:
        Success:
          type: boolean
        Cta:
          allOf:
            - $ref: '#/components/schemas/CompanyCta'
            - type: object
              properties:
                HtmlSnippet:
                  type: string

    # Services, Locations, Keywords
    ServiceInput:
      type: object
      required: [Name]
      properties:
        Name:
          type: string
        Description:
          type: string
        Keywords:
          type: string
        PageUrl:
          type: string
    
    LocationInput:
      type: object
      required: [Name]
      properties:
        Name:
          type: string
        Type:
          type: string
          enum: [suburb, city, region, state, country]
        State:
          type: string
        PostCode:
          type: string
        PageUrl:
          type: string
        IsPrimary:
          type: boolean
    
    KeywordInput:
      type: object
      required: [Keyword]
      properties:
        Keyword:
          type: string
        Type:
          type: string
          enum: [primary, secondary, long-tail, brand]
        SearchVol:
          type: integer
        Difficulty:
          type: integer

    # Blogs
    BlogRegistryEntry:
      type: object
      properties:
        BlogId:
          type: string
        Slug:
          type: string
        Title:
          type: string
        Category:
          type: string
        Status:
          $ref: '#/components/schemas/BlogStatus'
        WordCount:
          type: integer
        ReadTime:
          type: string
        CreatedAt:
          type: string
          format: date-time
        UpdatedAt:
          type: string
          format: date-time
    
    BlogListResponse:
      type: object
      properties:
        Success:
          type: boolean
        Blogs:
          type: array
          items:
            $ref: '#/components/schemas/BlogRegistryEntry'
        Pagination:
          $ref: '#/components/schemas/PaginationInfo'
    
    CreateBlogRequest:
      type: object
      required: [Title, Keywords]
      properties:
        Title:
          type: string
        Keywords:
          type: array
          items:
            type: string
        Category:
          type: string
        Areas:
          type: array
          items:
            type: string
        TargetWordCount:
          type: integer
          default: 1500
        Outline:
          type: array
          items:
            $ref: '#/components/schemas/OutlineSectionInput'
    
    UpdateBlogRequest:
      type: object
      properties:
        Title:
          type: string
        Status:
          $ref: '#/components/schemas/BlogStatus'
        Category:
          type: string
        MetaDescription:
          type: string
    
    BlogResponse:
      type: object
      properties:
        Success:
          type: boolean
        Blog:
          $ref: '#/components/schemas/BlogRegistryEntry'
    
    BlogDetailResponse:
      type: object
      properties:
        Success:
          type: boolean
        Blog:
          type: object
          properties:
            BlogId:
              type: string
            Slug:
              type: string
            Title:
              type: string
            MetaDescription:
              type: string
            Category:
              type: string
            Status:
              type: string
            Keywords:
              type: array
              items:
                type: string
            WordCount:
              type: integer
            ReadTime:
              type: string
            Content:
              type: object
              properties:
                Html:
                  type: string
                Markdown:
                  type: string
                Text:
                  type: string
            Sections:
              type: array
              items:
                $ref: '#/components/schemas/BlogSection'
            CreatedAt:
              type: string
              format: date-time
    
    BlogSection:
      type: object
      properties:
        Index:
          type: integer
        Type:
          type: string
        Header:
          type: string
        HtmlContent:
          type: string
        WordCount:
          type: integer
        QuotationUsed:
          type: string
        QuotationAuthor:
          type: string
    
    OutlineSectionInput:
      type: object
      properties:
        Header:
          type: string
        Intent:
          type: string
        Type:
          type: string
          enum: [introduction, body, conclusion]
    
    TrainBlogRequest:
      type: object
      properties:
        Urls:
          type: array
          items:
            type: string
            format: uri
        Content:
          type: string
        ZipFile:
          type: string
          format: binary
    
    OutlineRequest:
      type: object
      required: [Keywords]
      properties:
        Keywords:
          type: array
          items:
            type: string
        Topic:
          type: string
        TargetSections:
          type: integer
          default: 6
    
    OutlineResponse:
      type: object
      properties:
        Success:
          type: boolean
        Outline:
          type: array
          items:
            $ref: '#/components/schemas/OutlineSectionInput'
        ResearchSources:
          type: array
          items:
            type: string

    # FAQ
    FaqListResponse:
      type: object
      properties:
        Success:
          type: boolean
        Sessions:
          type: array
          items:
            type: object
            properties:
              SessionId:
                type: string
              Title:
                type: string
              FaqCount:
                type: integer
              CreatedAt:
                type: string
                format: date-time
        Pagination:
          $ref: '#/components/schemas/PaginationInfo'
    
    GenerateFaqRequest:
      type: object
      required: [Question]
      properties:
        Question:
          type: string
        Keywords:
          type: array
          items:
            type: string
        Location:
          type: string
        Format:
          type: string
          enum: [html, markdown, text, json]
          default: html
        SessionId:
          type: string
    
    FaqResponse:
      type: object
      properties:
        Success:
          type: boolean
        Faq:
          type: object
          properties:
            Id:
              type: string
            Question:
              type: string
            Answer:
              type: string
            Format:
              type: string
            WordCount:
              type: integer
            SessionId:
              type: string
            CreatedAt:
              type: string
              format: date-time
    
    FaqDetailResponse:
      type: object
      properties:
        Success:
          type: boolean
        Faq:
          type: object
          properties:
            Id:
              type: string
            Question:
              type: string
            Answer:
              type: string
            HtmlContent:
              type: string
            MarkdownContent:
              type: string
            TextContent:
              type: string
            Keywords:
              type: array
              items:
                type: string
            WordCount:
              type: integer
    
    UpdateFaqRequest:
      type: object
      properties:
        Question:
          type: string
        Keywords:
          type: array
          items:
            type: string
        Regenerate:
          type: boolean
    
    TrainFaqRequest:
      type: object
      properties:
        Urls:
          type: array
          items:
            type: string
            format: uri
        Content:
          type: string

    # Paragraphs
    ParagraphListResponse:
      type: object
      properties:
        Success:
          type: boolean
        Paragraphs:
          type: array
          items:
            type: object
            properties:
              Id:
                type: string
              Preview:
                type: string
              WordCount:
                type: integer
              Position:
                type: string
              CreatedAt:
                type: string
                format: date-time
        Pagination:
          $ref: '#/components/schemas/PaginationInfo'
    
    GenerateParagraphRequest:
      type: object
      required: [Keywords]
      properties:
        Keywords:
          type: array
          items:
            type: string
        Position:
          type: string
          enum: [intro, body, conclusion, cta]
          default: body
        SectionHeader:
          type: string
        PreviousParagraphSummary:
          type: string
        NextIntent:
          type: string
        TargetWords:
          type: integer
          minimum: 120
          maximum: 180
          default: 150
        IncludeQuotation:
          type: boolean
        FaqBlendMode:
          type: string
          enum: [inline, block, disabled]
          default: disabled
        Format:
          type: string
          enum: [html, markdown, text]
          default: html
    
    ParagraphResponse:
      type: object
      properties:
        Success:
          type: boolean
        Paragraph:
          type: object
          properties:
            Id:
              type: string
            Content:
              type: string
            Format:
              type: string
            WordCount:
              type: integer
            Position:
              type: string
            QuotationUsed:
              type: string
            CreatedAt:
              type: string
              format: date-time
    
    ParagraphDetailResponse:
      type: object
      properties:
        Success:
          type: boolean
        Paragraph:
          type: object
          properties:
            Id:
              type: string
            HtmlContent:
              type: string
            MarkdownContent:
              type: string
            TextContent:
              type: string
            WordCount:
              type: integer
            SentenceCount:
              type: integer
            Position:
              type: string
            Keywords:
              type: array
              items:
                type: string
    
    UpdateParagraphRequest:
      type: object
      properties:
        Keywords:
          type: array
          items:
            type: string
        Regenerate:
          type: boolean
    
    TrainParagraphRequest:
      type: object
      properties:
        Urls:
          type: array
          items:
            type: string
            format: uri
        Content:
          type: string
    
    TrainingResponse:
      type: object
      properties:
        Success:
          type: boolean
        SessionId:
          type: string
        ChunksProcessed:
          type: integer
        Message:
          type: string

    # Categories
    BlogCategory:
      type: object
      properties:
        Slug:
          type: string
        Name:
          type: string
        Description:
          type: string
        ParentSlug:
          type: string
        SortOrder:
          type: integer
        BlogCount:
          type: integer
        CreatedAt:
          type: string
          format: date-time
    
    CategoryListResponse:
      type: object
      properties:
        Success:
          type: boolean
        Categories:
          type: array
          items:
            $ref: '#/components/schemas/BlogCategory'
    
    UpsertCategoryRequest:
      type: object
      required: [Name]
      properties:
        Slug:
          type: string
        Name:
          type: string
        Description:
          type: string
        ParentSlug:
          type: string
        SortOrder:
          type: integer

    # Articles
    ArticleListResponse:
      type: object
      properties:
        Success:
          type: boolean
        Articles:
          type: array
          items:
            type: object
            properties:
              Id:
                type: integer
              SourceUrl:
                type: string
              Title:
                type: string
              WordCount:
                type: integer
              IsProcessed:
                type: boolean
              CacheExpiry:
                type: string
                format: date-time
    
    AddArticleRequest:
      type: object
      required: [Url]
      properties:
        Url:
          type: string
          format: uri
        ForceRefresh:
          type: boolean
          default: false
    
    ArticleResponse:
      type: object
      properties:
        Success:
          type: boolean
        Article:
          type: object
          properties:
            Id:
              type: integer
            SourceUrl:
              type: string
            Title:
              type: string
            WordCount:
              type: integer
            ContentExtracted:
              type: boolean
            StyleAnalyzed:
              type: boolean
            CacheExpiry:
              type: string
              format: date-time
        Style:
          $ref: '#/components/schemas/WritingStyleBrief'
    
    WritingStyleBrief:
      type: object
      properties:
        AvgSentenceLength:
          type: number
        AvgParagraphLength:
          type: number
        FormalityScore:
          type: number
        ReadabilityScore:
          type: number
    
    WritingStyleResponse:
      type: object
      properties:
        Success:
          type: boolean
        Style:
          type: object
          properties:
            ArticleCount:
              type: integer
            SentenceMetrics:
              type: object
              properties:
                AvgLength:
                  type: number
                MinLength:
                  type: integer
                MaxLength:
                  type: integer
            ParagraphMetrics:
              type: object
              properties:
                AvgLength:
                  type: number
                AvgSentences:
                  type: number
            ToneAnalysis:
              type: object
              properties:
                FormalityScore:
                  type: number
                ReadabilityScore:
                  type: number
                SentimentScore:
                  type: number
            PatternAnalysis:
              type: object
              properties:
                VoicePattern:
                  type: string
                TensePattern:
                  type: string
                CommonPhrases:
                  type: array
                  items:
                    type: string

    # Extraction
    ExtractRequest:
      type: object
      required: [Url]
      properties:
        Url:
          type: string
          format: uri
        Formats:
          type: array
          items:
            type: string
            enum: [text, markdown, html, json]
          default: [markdown]
        ForceRefresh:
          type: boolean
          default: false
        CacheDays:
          type: integer
          default: 5
        AnalyzeStyle:
          type: boolean
          default: false
        IncludeImages:
          type: boolean
          default: false
    
    ExtractResponse:
      type: object
      properties:
        Success:
          type: boolean
        Result:
          type: object
          properties:
            Url:
              type: string
            Title:
              type: string
            MetaDesc:
              type: string
            WordCount:
              type: integer
            ReadingTime:
              type: string
            Cached:
              type: boolean
            CacheExpiry:
              type: string
              format: date-time
            Content:
              type: object
              properties:
                Text:
                  type: string
                Markdown:
                  type: string
                Html:
                  type: string
            Structure:
              type: object
              properties:
                Headings:
                  type: array
                  items:
                    type: object
                    properties:
                      Level:
                        type: integer
                      Text:
                        type: string
                Paragraphs:
                  type: array
                  items:
                    type: object
                    properties:
                      Index:
                        type: integer
                      Text:
                        type: string
                      WordCount:
                        type: integer
            Images:
              type: array
              items:
                type: object
                properties:
                  Src:
                    type: string
                  Alt:
                    type: string
            Style:
              $ref: '#/components/schemas/WritingStyleBrief'
```

---

## Usage Notes

### Generating Client SDKs

```bash
# Generate TypeScript client
openapi-generator generate -i openapi-seo.yaml -g typescript-axios -o ./sdk/ts

# Generate Go client
openapi-generator generate -i openapi-seo.yaml -g go -o ./sdk/go

# Generate Python client
openapi-generator generate -i openapi-seo.yaml -g python -o ./sdk/python
```

### Serving Swagger UI

```bash
# Using Swagger UI Docker
docker run -p 8081:8080 -e SWAGGER_JSON=/spec/openapi-seo.yaml -v ./spec:/spec swaggerapi/swagger-ui
```

---

## Related Specifications

| Spec | Description |
|------|-------------|
| 04-api-interface.md | Core API interface |
| 27-ai-seo-blog-generation.md | Blog endpoint details |
| 28-company-profile-management.md | Company profile details |
| 29-gsearch-url-extraction.md | Extraction endpoint details |
| 55-html-blog-generation.md | HTML blog generation (categories, presets, instructions) |
| 53-enum-architecture.md | Enum definitions including `html_blog_status.Variant` |
