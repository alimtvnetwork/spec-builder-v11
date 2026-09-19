# WP SEO Publish CLI: WordPress Connector

**Version:** 2.0.0  
**Updated:** 2026-03-09  

---

## Overview

The WordPress Connector handles all communication with WordPress sites via the REST API, using Application Password authentication for secure access.

---

## Authentication

### Application Password Flow

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   WP SEO    │         │  WordPress  │         │   WP Admin  │
│   CLI UI    │         │  REST API   │         │   Panel     │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │  1. User enters site URL                      │
       │─────────────────────────────────────────────►│
       │                       │                       │
       │  2. User creates Application Password         │
       │◄─────────────────────────────────────────────│
       │                       │                       │
       │  3. CLI stores credentials                    │
       │──────────────────────►│                       │
       │                       │                       │
       │  4. Validate connection                       │
       │──────────────────────►│                       │
       │                       │                       │
       │  5. Connection confirmed                      │
       │◄──────────────────────│                       │
```

### Connection Configuration

```go
type WordPressConnection struct {
    Id              string
    SiteUrl         string
    Username        string
    ApplicationPass string    `json:"-"` // Never serialized
    Nickname        string
    SiteTitle       string
    SiteDescription string
    ApiVersion      string
    Connected       bool
    LastValidated   time.Time
    CreatedAt       time.Time
}

type ConnectionResult struct {
    Success     bool                  `json:",omitempty"`
    Website     *WordPressConnection  `json:",omitempty"`
    SiteInfo    *SiteInfo             `json:",omitempty"`
    Categories  []Category            `json:",omitempty"`
    Tags        []Tag                 `json:",omitempty"`
    Error       string                `json:",omitempty"`
    ErrorCode   string                `json:",omitempty"`
}
```

### Credential Storage

Credentials are stored securely in the Setting DB with encryption:

```go
type StoredCredential struct {
    WebsiteId       string
    EncryptedPass   []byte `json:"-"`
    Salt            []byte `json:"-"`
    CreatedAt       time.Time
    LastUsed        time.Time
}
```

---

## REST API Integration

### Base Client

```go
type WordPressClient struct {
    baseUrl     string
    username    string
    appPassword string
    httpClient  *http.Client
    rateLimiter *RateLimiter
}

func NewWordPressClient(conn WordPressConnection, decryptedPass string) *WordPressClient {
    return &WordPressClient{
        baseUrl:     strings.TrimRight(conn.SiteUrl, "/") + "/wp-json/wp/v2",
        username:    conn.Username,
        appPassword: decryptedPass,
        httpClient: &http.Client{
            Timeout: 30 * time.Second,
        },
        rateLimiter: NewRateLimiter(10, time.Second), // 10 req/sec
    }
}

func (c *WordPressClient) doRequest(method httpmethod.Variant, endpoint string, body any) appfault.Result[*http.Response] {
    c.rateLimiter.Wait()
    
    var reqBody io.Reader
    if body != nil {
        jsonBytes, err := json.Marshal(body)
        if err != nil {
            return appfault.Fail[*http.Response](
                appfault.Wrap(
                    errors.ErrJsonMarshal,
                    "marshal request body",
                    err,
                ),
            )
        }
        reqBody = bytes.NewReader(jsonBytes)
    }
    
    req, err := http.NewRequest(method.String(), c.baseUrl+endpoint, reqBody)
    if err != nil {
        return appfault.Fail[*http.Response](
            appfault.Wrap(
                errors.ErrHttpConnection,
                "create request",
                err,
            ),
        )
    }
    
    // Application Password uses Basic Auth
    auth := base64.StdEncoding.EncodeToString(
        []byte(c.username + ":" + c.appPassword),
    )
    req.Header.Set("Authorization", "Basic "+auth)
    req.Header.Set("Content-Type", "application/json")
    
    resp, err := c.httpClient.Do(req)
    if err != nil {
        return appfault.Fail[*http.Response](
            appfault.Wrap(
                errors.ErrHttpConnection,
                "execute request",
                err,
            ),
        )
    }
    return appfault.Ok(resp)
}
```

### Endpoint Implementations

#### Categories

```go
type Category struct {
    Id          int    `json:",omitempty"`
    Name        string
    Slug        string `json:",omitempty"`
    Description string `json:",omitempty"`
    Parent      int    `json:",omitempty"`
    Count       int    `json:",omitempty"`
}

func (c *WordPressClient) CreateCategory(cat Category) appfault.Result[*Category] {
    resp := c.doRequest(httpmethod.Post, "/categories", cat)
    if resp.HasError() {
        return appfault.Fail[*Category](resp.Error())
    }
    defer resp.Value().Body.Close()
    
    if resp.Value().StatusCode != http.StatusCreated {
        return appfault.Fail[*Category](parseWpAppError(resp.Value()))
    }
    
    var result Category
    if err := json.NewDecoder(resp.Value().Body).Decode(&result); err != nil {
        return appfault.Fail[*Category](
            appfault.Wrap(
                errors.ErrJsonDecode,
                "decode category",
                err,
            ),
        )
    }
    return appfault.Ok(&result)
}

func (c *WordPressClient) GetCategories() appfault.Result[[]Category] {
    resp := c.doRequest(httpmethod.Get, "/categories?per_page=100", nil)
    if resp.HasError() {
        return appfault.Fail[[]Category](resp.Error())
    }
    defer resp.Value().Body.Close()
    
    var categories []Category
    if err := json.NewDecoder(resp.Value().Body).Decode(&categories); err != nil {
        return appfault.Fail[[]Category](
            appfault.Wrap(
                errors.ErrJsonDecode,
                "decode categories",
                err,
            ),
        )
    }
    return appfault.Ok(categories)
}

func (c *WordPressClient) UpdateCategory(id int, cat Category) appfault.Result[*Category] {
    endpoint := fmt.Sprintf("/categories/%d", id)
    resp := c.doRequest(httpmethod.Post, endpoint, cat)
    if resp.HasError() {
        return appfault.Fail[*Category](resp.Error())
    }
    defer resp.Value().Body.Close()
    
    var result Category
    if err := json.NewDecoder(resp.Value().Body).Decode(&result); err != nil {
        return appfault.Fail[*Category](
            appfault.Wrap(
                errors.ErrJsonDecode,
                "decode category",
                err,
            ),
        )
    }
    return appfault.Ok(&result)
}
```

#### Posts

```go
type Post struct {
    Id            int      `json:",omitempty"`
    Title         Rendered
    Content       Rendered
    Excerpt       Rendered `json:",omitempty"`
    Slug          string   `json:",omitempty"`
    Status        string   // publish, draft, pending
    Categories    []int    `json:",omitempty"`
    Tags          []int    `json:",omitempty"`
    FeaturedMedia int      `json:",omitempty"`
    Author        int      `json:",omitempty"`
    Date          string   `json:",omitempty"`
    Modified      string   `json:",omitempty"`
    Link          string   `json:",omitempty"`
}

type Rendered struct {
    Raw      string `json:",omitempty"`
    Rendered string `json:",omitempty"`
}

type PostCreateRequest struct {
    Title      string
    Content    string
    Excerpt    string `json:",omitempty"`
    Slug       string `json:",omitempty"`
    Status     string
    Categories []int  `json:",omitempty"`
    Tags       []int  `json:",omitempty"`
}

func (c *WordPressClient) CreatePost(req PostCreateRequest) appfault.Result[*Post] {
    resp := c.doRequest(httpmethod.Post, "/posts", req)
    if resp.HasError() {
        return appfault.Fail[*Post](resp.Error())
    }
    defer resp.Value().Body.Close()
    
    if resp.Value().StatusCode != http.StatusCreated {
        return appfault.Fail[*Post](parseWpAppError(resp.Value()))
    }
    
    var result Post
    if err := json.NewDecoder(resp.Value().Body).Decode(&result); err != nil {
        return appfault.Fail[*Post](
            appfault.Wrap(
                errors.ErrJsonDecode,
                "decode post",
                err,
            ),
        )
    }
    return appfault.Ok(&result)
}

func (c *WordPressClient) UpdatePost(id int, req PostCreateRequest) appfault.Result[*Post] {
    endpoint := fmt.Sprintf("/posts/%d", id)
    resp := c.doRequest(httpmethod.Post, endpoint, req)
    if resp.HasError() {
        return appfault.Fail[*Post](resp.Error())
    }
    defer resp.Value().Body.Close()
    
    var result Post
    if err := json.NewDecoder(resp.Value().Body).Decode(&result); err != nil {
        return appfault.Fail[*Post](
            appfault.Wrap(
                errors.ErrJsonDecode,
                "decode post",
                err,
            ),
        )
    }
    return appfault.Ok(&result)
}

func (c *WordPressClient) GetPost(id int) appfault.Result[*Post] {
    endpoint := fmt.Sprintf("/posts/%d?context=edit", id)
    resp := c.doRequest(httpmethod.Get, endpoint, nil)
    if resp.HasError() {
        return appfault.Fail[*Post](resp.Error())
    }
    defer resp.Value().Body.Close()
    
    var result Post
    if err := json.NewDecoder(resp.Value().Body).Decode(&result); err != nil {
        return appfault.Fail[*Post](
            appfault.Wrap(
                errors.ErrJsonDecode,
                "decode post",
                err,
            ),
        )
    }
    return appfault.Ok(&result)
}
```

#### Pages

```go
type Page struct {
    Id            int      `json:",omitempty"`
    Title         Rendered
    Content       Rendered
    Slug          string   `json:",omitempty"`
    Status        string
    Parent        int      `json:",omitempty"`
    Template      string   `json:",omitempty"`
    FeaturedMedia int      `json:",omitempty"`
    Link          string   `json:",omitempty"`
}

func (c *WordPressClient) CreatePage(page Page) appfault.Result[*Page] {
    resp := c.doRequest(httpmethod.Post, "/pages", page)
    if resp.HasError() {
        return appfault.Fail[*Page](resp.Error())
    }
    defer resp.Value().Body.Close()
    
    if resp.Value().StatusCode != http.StatusCreated {
        return appfault.Fail[*Page](parseWpAppError(resp.Value()))
    }
    
    var result Page
    if err := json.NewDecoder(resp.Value().Body).Decode(&result); err != nil {
        return appfault.Fail[*Page](
            appfault.Wrap(
                errors.ErrJsonDecode,
                "decode page",
                err,
            ),
        )
    }
    return appfault.Ok(&result)
}

func (c *WordPressClient) UpdatePage(id int, page Page) appfault.Result[*Page] {
    endpoint := fmt.Sprintf("/pages/%d", id)
    resp := c.doRequest(httpmethod.Post, endpoint, page)
    if resp.HasError() {
        return appfault.Fail[*Page](resp.Error())
    }
    defer resp.Value().Body.Close()
    
    var result Page
    if err := json.NewDecoder(resp.Value().Body).Decode(&result); err != nil {
        return appfault.Fail[*Page](
            appfault.Wrap(
                errors.ErrJsonDecode,
                "decode page",
                err,
            ),
        )
    }
    return appfault.Ok(&result)
}
```

#### Tags

```go
type Tag struct {
    Id          int    `json:",omitempty"`
    Name        string
    Slug        string `json:",omitempty"`
    Description string `json:",omitempty"`
    Count       int    `json:",omitempty"`
}

func (c *WordPressClient) CreateTag(tag Tag) appfault.Result[*Tag] {
    resp := c.doRequest(httpmethod.Post, "/tags", tag)
    if resp.HasError() {
        return appfault.Fail[*Tag](resp.Error())
    }
    defer resp.Value().Body.Close()
    
    if resp.Value().StatusCode != http.StatusCreated {
        return appfault.Fail[*Tag](parseWpAppError(resp.Value()))
    }
    
    var result Tag
    if err := json.NewDecoder(resp.Value().Body).Decode(&result); err != nil {
        return appfault.Fail[*Tag](
            appfault.Wrap(
                errors.ErrJsonDecode,
                "decode tag",
                err,
            ),
        )
    }
    return appfault.Ok(&result)
}

func (c *WordPressClient) GetTags() appfault.Result[[]Tag] {
    resp := c.doRequest(httpmethod.Get, "/tags?per_page=100", nil)
    if resp.HasError() {
        return appfault.Fail[[]Tag](resp.Error())
    }
    defer resp.Value().Body.Close()
    
    var tags []Tag
    if err := json.NewDecoder(resp.Value().Body).Decode(&tags); err != nil {
        return appfault.Fail[[]Tag](
            appfault.Wrap(
                errors.ErrJsonDecode,
                "decode tags",
                err,
            ),
        )
    }
    return appfault.Ok(tags)
}
```

---

## Error Handling

```go
type WpError struct {
    Code    string
    Message string
    Data    struct {
        Status int
    }
}

func parseWpAppError(resp *http.Response) *appfault.AppError {
    var wpErr WpError
    if err := json.NewDecoder(resp.Body).Decode(&wpErr); err != nil {
        return appfault.New(
            fmt.Sprintf("E%d", WpErrorMapping["rest_cannot_create"]),
            fmt.Sprintf("HTTP %d: %s", resp.StatusCode, resp.Status),
        )
    }
    
    code := WpErrorMapping[wpErr.Code]
    if code == 0 {
        code = 12199 // Unknown WP error
    }
    return appfault.New(
        fmt.Sprintf("E%d", code),
        fmt.Sprintf("WordPress error [%s]: %s", wpErr.Code, wpErr.Message),
    )
}

// Error code mapping
var WpErrorMapping = map[string]int{
    "rest_cannot_create":   12101,
    "rest_cannot_update":   12102,
    "rest_cannot_delete":   12103,
    "rest_post_invalid_id": 12104,
    "rest_forbidden":       12001,
    "rest_unauthorized":    12002,
}
```

---

## Connection Validation

```go
type ValidationResult struct {
    Valid           bool
    SiteInfo        *SiteInfo `json:",omitempty"`
    Capabilities    []string  `json:",omitempty"`
    CanPublishPosts bool
    CanPublishPages bool
    CanManageCats   bool
    Error           string    `json:",omitempty"`
}

func (c *WordPressClient) ValidateConnection() appfault.Result[*ValidationResult] {
    // Check /users/me endpoint
    resp := c.doRequest(httpmethod.Get, "/users/me?context=edit", nil)
    if resp.HasError() {
        return appfault.Ok(&ValidationResult{Valid: false, Error: resp.Error().Message})
    }
    defer resp.Value().Body.Close()
    
    if resp.Value().StatusCode == http.StatusUnauthorized {
        return appfault.Ok(&ValidationResult{
            Valid: false,
            Error: "Invalid credentials",
        })
    }
    
    var user struct {
        Id           int
        Name         string
        Capabilities map[string]bool
    }
    if err := json.NewDecoder(resp.Value().Body).Decode(&user); err != nil {
        return appfault.Fail[*ValidationResult](
            appfault.Wrap(
                errors.ErrJsonDecode,
                "decode user",
                err,
            ),
        )
    }
    
    caps := make([]string, 0)
    for cap, enabled := range user.Capabilities {
        if enabled {
            caps = append(caps, cap)
        }
    }
    
    return appfault.Ok(&ValidationResult{
        Valid:           true,
        Capabilities:    caps,
        CanPublishPosts: user.Capabilities["publish_posts"],
        CanPublishPages: user.Capabilities["publish_pages"],
        CanManageCats:   user.Capabilities["manage_categories"],
    })
}
```

---

## Multi-Site Support

```go
type SiteManager struct {
    db       *Database
    clients  map[string]*WordPressClient
    mu       sync.RWMutex
}

func (m *SiteManager) GetClient(websiteId string) appfault.Result[*WordPressClient] {
    m.mu.RLock()
    client, exists := m.clients[websiteId]
    m.mu.RUnlock()
    
    if exists {
        return appfault.Ok(client)
    }
    
    // Load from database
    conn := m.db.GetConnection(websiteId)
    if conn.HasError() {
        return appfault.Fail[*WordPressClient](conn.Error())
    }
    
    decryptedPass := m.db.DecryptPassword(conn.Value().Id)
    if decryptedPass.HasError() {
        return appfault.Fail[*WordPressClient](decryptedPass.Error())
    }
    
    client = NewWordPressClient(*conn.Value(), decryptedPass.Value())
    
    m.mu.Lock()
    m.clients[websiteId] = client
    m.mu.Unlock()
    
    return appfault.Ok(client)
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Architecture | `01-architecture.md` |
| Content Publisher | `03-content-publisher.md` |
| Split DB Schema | `06-split-db-schema.md` |
| Error Codes | `08-error-codes.md` |
