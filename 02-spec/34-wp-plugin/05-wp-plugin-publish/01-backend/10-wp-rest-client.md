# 10 — WP REST API Client


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

> **Parent:** [00-overview.md](../00-overview.md)  
> **Status:** Draft

---

## Overview

The WordPress REST API Client handles all communication with remote WordPress sites, including authentication, plugin management, and file uploads.

---

## Interface

```go
// internal/wordpress/client.go
package wordpress

import (
    stdctx "context"
)

type Client interface {
    // Site information
    GetSiteInfo(context stdctx.Context, url, username, password string) appfault.Result[*SiteInfo]
    
    // Plugin operations
    ListPlugins(context stdctx.Context, url, username, password string) appfault.Result[[]Plugin]
    GetPlugin(context stdctx.Context, url, username, password, slug string) appfault.Result[*Plugin]
    ActivatePlugin(context stdctx.Context, url, username, password, slug string) *appfault.AppError
    DeactivatePlugin(context stdctx.Context, url, username, password, slug string) *appfault.AppError
    DeletePlugin(context stdctx.Context, url, username, password, slug string) *appfault.AppError
    
    // Upload operations
    UploadPlugin(context stdctx.Context, url, username, password string, zipPath string) appfault.Result[*UploadResult]
    
    // Plugin files (if supported by a companion plugin)
    GetPluginFiles(context stdctx.Context, url, username, password, slug string) appfault.Result[[]RemoteFile]
    UploadPluginFile(context stdctx.Context, url, username, password, slug, filePath string, content []byte) *appfault.AppError
    
    // Health check
    Ping(context stdctx.Context, url string) *appfault.AppError
}
```

---

## Data Types

```go
// internal/wordpress/types.go
package wordpress

// EXEMPTED: WordPress REST API response format — snake_case/lowercase keys
type SiteInfo struct {
    Name        string `json:"name"`            // EXEMPTED: External WP API
    Description string `json:"description"`     // EXEMPTED: External WP API
    Url         string `json:"url"`             // EXEMPTED: External WP API
    Home        string `json:"home"`            // EXEMPTED: External WP API
    GmtOffset   int    `json:"gmt_offset"`      // EXEMPTED: External WP API
    Timezone    string `json:"timezone_string"`  // EXEMPTED: External WP API
    Version     string `json:",omitempty"`
}

// EXEMPTED: WordPress REST API response format — snake_case/lowercase keys
type Plugin struct {
    Slug        string            `json:"slug,omitempty"`   // EXEMPTED: External WP API
    Plugin      string            `json:"plugin"`           // EXEMPTED: External WP API
    Status      string            `json:"status"`           // EXEMPTED: External WP API
    Name        string            `json:"name"`             // EXEMPTED: External WP API
    PluginUri   string            `json:"plugin_uri"`       // EXEMPTED: External WP API
    Author      string            `json:"author"`           // EXEMPTED: External WP API
    AuthorUri   string            `json:"author_uri"`       // EXEMPTED: External WP API
    Description Description       `json:"description"`      // EXEMPTED: External WP API
    Version     string            `json:"version"`          // EXEMPTED: External WP API
    NetworkOnly bool              `json:"network_only"`     // EXEMPTED: External WP API
    RequiresWp  string            `json:"requires_wp"`      // EXEMPTED: External WP API
    RequiresPhp string            `json:"requires_php"`     // EXEMPTED: External WP API
    TextDomain  string            `json:"text_domain"`      // EXEMPTED: External WP API
}

// EXEMPTED: WordPress REST API response format
type Description struct {
    Raw      string `json:"raw"`      // EXEMPTED: External WP API
    Rendered string `json:"rendered"` // EXEMPTED: External WP API
}

type UploadResult struct {
    Success     bool
    PluginSlug  string `json:",omitempty"`
    Version     string `json:",omitempty"`
    WasUpdated  bool
    Error       string `json:",omitempty"`
}

type RemoteFile struct {
    Path       string
    Size       int64
    Hash       string
    ModifiedAt string
}
```

---

## Implementation

### HTTP Client

```go
// internal/wordpress/client.go
package wordpress

import (
    "bytes"
    stdctx "context"
    "encoding/base64"
    "encoding/json"
    "fmt"
    "io"
    "mime/multipart"
    "net/http"
    "os"
    "path/filepath"
    "strings"
    "time"
    
    "wp-plugin-publish/internal/logger"
    "wp-plugin-publish/pkg/appfault"
)

type clientImpl struct {
    httpClient *http.Client
    log        *logger.Logger
}

func NewClient(log *logger.Logger) Client {
    return &clientImpl{
        httpClient: &http.Client{
            Timeout: 60 * time.Second,
        },
        log: log,
    }
}

func (c *clientImpl) doRequest(context stdctx.Context, method, url, username, password string, body io.Reader, contentType string) (*http.Response, error) {
    req, err := http.NewRequestWithContext(context, method, url, body)
    if err != nil {
        return nil, appfault.Wrap(err, appfault.ErrWpConnect, "failed to create request")
    }
    
    // Set Application Password authentication
    auth := base64.StdEncoding.EncodeToString([]byte(username + ":" + password))
    req.Header.Set("Authorization", "Basic "+auth)
    
    if contentType != "" {
        req.Header.Set("Content-Type", contentType)
    }
    
    req.Header.Set("Accept", "application/json")
    req.Header.Set("User-Agent", "WP-Plugin-Publish/1.0")
    
    c.log.Debug("Making WP API request",
        "method", method,
        "url", url,
    )
    
    resp, err := c.httpClient.Do(req)
    if err != nil {
        return nil, appfault.Wrap(err, appfault.ErrWpConnect, "request failed")
    }
    
    return resp, nil
}

func parseResponse[T any](c *clientImpl, resp *http.Response, target *T) error {
    defer resp.Body.Close()
    
    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return appfault.Wrap(err, appfault.ErrWpApi, "failed to read response body")
    }
    
    // Check for error status codes
    if resp.StatusCode == 401 {
        return appfault.New(appfault.ErrWpAuth, "authentication failed - check username and application password").
            WithContext("status", resp.StatusCode)
    }
    
    if resp.StatusCode == 403 {
        return appfault.New(appfault.ErrWpAuth, "access forbidden - user may lack required permissions").
            WithContext("status", resp.StatusCode)
    }
    
    if resp.StatusCode == 404 {
        return appfault.New(appfault.ErrNotFound, "endpoint not found").
            WithContext("status", resp.StatusCode)
    }
    
    if resp.StatusCode >= 400 {
        // EXEMPTED: WordPress REST API error response format
        var wpErr struct {
            Code    string `json:"code"`    // EXEMPTED: External WP API
            Message string `json:"message"` // EXEMPTED: External WP API
        }
        if json.Unmarshal(body, &wpErr) == nil && wpErr.Message != "" {
            return appfault.New(appfault.ErrWpApi, wpErr.Message).
                WithContext("wpCode", wpErr.Code).
                WithContext("status", resp.StatusCode)
        }
        
        return appfault.New(appfault.ErrWpApi, "WordPress API error").
            WithContext("status", resp.StatusCode).
            WithContext("body", string(body))
    }
    
    if target != nil {
        if err := json.Unmarshal(body, target); err != nil {
            return appfault.Wrap(err, appfault.ErrWpApi, "failed to parse response")
        }
    }
    
    return nil
}
```

### Site Information

```go
// internal/wordpress/site.go
package wordpress

import (
    stdctx "context"
    "strings"
    
    "wp-plugin-publish/pkg/appfault"
)

func (c *clientImpl) GetSiteInfo(context stdctx.Context, url, username, password string) appfault.Result[SiteInfo] {
    c.log.Info("Getting site info", "url", url)
    
    // Normalize URL
    url = strings.TrimSuffix(url, "/")
    
    // First, get basic site info from /wp-json
    resp, err := c.doRequest(context, "GET", url+"/wp-json", username, password, nil, "")
    if err != nil {
        return appfault.Fail[SiteInfo](err)
    }
    
    // EXEMPTED: WordPress REST API response format — snake_case/lowercase keys
    var indexResponse struct {
        Name        string   `json:"name"`            // EXEMPTED: External WP API
        Description string   `json:"description"`     // EXEMPTED: External WP API
        URL         string   `json:"url"`             // EXEMPTED: External WP API
        Home        string   `json:"home"`            // EXEMPTED: External WP API
        GMTOffset   int      `json:"gmt_offset"`      // EXEMPTED: External WP API
        Timezone    string   `json:"timezone_string"`  // EXEMPTED: External WP API
        Namespaces  []string `json:"namespaces"`       // EXEMPTED: External WP API
    }
    
    if err := c.parseResponse(resp, &indexResponse); err != nil {
        return appfault.Fail[SiteInfo](err)
    }
    
    // Check if wp/v2 namespace is available
    hasWpV2 := false
    for _, ns := range indexResponse.Namespaces {
        if ns == "wp/v2" {
            hasWpV2 = true
            break
        }
    }
    
    if !hasWpV2 {
        return appfault.Fail[SiteInfo](appfault.New(appfault.ErrWpVersion, 
            "WordPress REST API v2 not available - WordPress 4.7+ required"))
    }
    
    // Get WordPress version from root namespace
    version := ""
    resp2, err := c.doRequest(context, "GET", url+"/wp-json/wp/v2", username, password, nil, "")
    if err == nil {
        var v2Info struct {
            Version string `json:"wp_version"`
        }
        if c.parseResponse(resp2, &v2Info) == nil {
            version = v2Info.Version
        }
    }
    
    return appfault.Ok(SiteInfo{
        Name:        indexResponse.Name,
        Description: indexResponse.Description,
        Url:         indexResponse.Url,
        Home:        indexResponse.Home,
        GmtOffset:   indexResponse.GmtOffset,
        Timezone:    indexResponse.Timezone,
        Version:     version,
    })
}

func (c *clientImpl) Ping(context stdctx.Context, url string) error {
    url = strings.TrimSuffix(url, "/")
    
    resp, err := c.httpClient.Get(url + "/wp-json")
    if err != nil {
        return appfault.Wrap(err, appfault.ErrWpConnect, "failed to ping site")
    }
    defer resp.Body.Close()
    
    if resp.StatusCode >= 400 {
        return appfault.New(appfault.ErrWpConnect, "site not reachable").
            WithContext("status", resp.StatusCode)
    }
    
    return nil
}
```

### Plugin Operations

```go
// internal/wordpress/plugins.go
package wordpress

import (
    "bytes"
    stdctx "context"
    "encoding/json"
    "strings"
    
    "wp-plugin-publish/pkg/appfault"
)

func (c *clientImpl) ListPlugins(context stdctx.Context, url, username, password string) appfault.Result[[]Plugin] {
    c.log.Debug("Listing plugins", "url", url)
    
    url = strings.TrimSuffix(url, "/")
    
    resp, err := c.doRequest(context, "GET", url+"/wp-json/wp/v2/plugins", username, password, nil, "")
    if err != nil {
        return nil, err
    }
    
    var plugins []Plugin
    if err := c.parseResponse(resp, &plugins); err != nil {
        return nil, err
    }
    
    // Extract slug from plugin file path
    for i := range plugins {
        if plugins[i].Plugin != "" {
            parts := strings.Split(plugins[i].Plugin, "/")
            if len(parts) > 0 {
                plugins[i].Slug = parts[0]
            }
        }
    }
    
    c.log.Info("Listed plugins", "url", url, "count", len(plugins))
    return plugins, nil
}

func (c *clientImpl) GetPlugin(context stdctx.Context, url, username, password, slug string) appfault.Result[Plugin] {
    c.log.Debug("Getting plugin", "url", url, "slug", slug)
    
    plugins, err := c.ListPlugins(context, url, username, password)
    if err != nil {
        return appfault.Fail[Plugin](err)
    }
    
    for _, p := range plugins {
        if p.Slug == slug || strings.HasPrefix(p.Plugin, slug+"/") {
            return appfault.Ok(p)
        }
    }
    
    return appfault.Fail[Plugin](appfault.New(appfault.ErrNotFound, "plugin not found on remote site").
        WithContext("slug", slug))
}

func (c *clientImpl) ActivatePlugin(context stdctx.Context, url, username, password, slug string) error {
    c.log.Info("Activating plugin", "url", url, "slug", slug)
    
    plugin, err := c.GetPlugin(context, url, username, password, slug)
    if err != nil {
        return err
    }
    
    if plugin.Status == "active" {
        c.log.Debug("Plugin already active", "slug", slug)
        return nil
    }
    
    url = strings.TrimSuffix(url, "/")
    endpoint := url + "/wp-json/wp/v2/plugins/" + plugin.Plugin
    
    body, _ := json.Marshal(map[string]string{"status": "active"})
    
    resp, err := c.doRequest(context, "PUT", endpoint, username, password, bytes.NewReader(body), "application/json")
    if err != nil {
        return appfault.Wrap(err, appfault.ErrWpActivate, "failed to activate plugin")
    }
    
    if err := c.parseResponse(resp, nil); err != nil {
        return appfault.Wrap(err, appfault.ErrWpActivate, "plugin activation failed")
    }
    
    c.log.Info("Plugin activated", "slug", slug)
    return nil
}

func (c *clientImpl) DeactivatePlugin(context stdctx.Context, url, username, password, slug string) error {
    c.log.Info("Deactivating plugin", "url", url, "slug", slug)
    
    plugin, err := c.GetPlugin(context, url, username, password, slug)
    if err != nil {
        return err
    }
    
    if plugin.Status == "inactive" {
        c.log.Debug("Plugin already inactive", "slug", slug)
        return nil
    }
    
    url = strings.TrimSuffix(url, "/")
    endpoint := url + "/wp-json/wp/v2/plugins/" + plugin.Plugin
    
    body, _ := json.Marshal(map[string]string{"status": "inactive"})
    
    resp, err := c.doRequest(context, "PUT", endpoint, username, password, bytes.NewReader(body), "application/json")
    if err != nil {
        return appfault.Wrap(
            err, appfault.ErrWpDeactivate, "failed to deactivate plugin",
        )
    }
    
    if err := c.parseResponse(resp, nil); err != nil {
        return appfault.Wrap(
            err, appfault.ErrWpDeactivate, "plugin deactivation failed",
        )
    }
    
    c.log.Info("Plugin deactivated", "slug", slug)
    return nil
}

func (c *clientImpl) DeletePlugin(context stdctx.Context, url, username, password, slug string) error {
    c.log.Info("Deleting plugin", "url", url, "slug", slug)
    
    plugin, err := c.GetPlugin(context, url, username, password, slug)
    if err != nil {
        return err
    }
    
    // Must deactivate first
    if plugin.Status == "active" {
        if err := c.DeactivatePlugin(context, url, username, password, slug); err != nil {
            return err
        }
    }
    
    url = strings.TrimSuffix(url, "/")
    endpoint := url + "/wp-json/wp/v2/plugins/" + plugin.Plugin
    
    resp, err := c.doRequest(context, "DELETE", endpoint, username, password, nil, "")
    if err != nil {
        return appfault.Wrap(err, appfault.ErrWpPlugin, "failed to delete plugin")
    }
    
    if err := c.parseResponse(resp, nil); err != nil {
        return appfault.Wrap(err, appfault.ErrWpPlugin, "plugin deletion failed")
    }
    
    c.log.Info("Plugin deleted", "slug", slug)
    return nil
}
```

### Upload Operations

```go
// internal/wordpress/upload.go
package wordpress

import (
    "bytes"
    stdctx "context"
    "io"
    "mime/multipart"
    "os"
    "path/filepath"
    "strings"
    
    "wp-plugin-publish/pkg/appfault"
)

func (c *clientImpl) UploadPlugin(context stdctx.Context, url, username, password string, zipPath string) appfault.Result[UploadResult] {
    c.log.Info("Uploading plugin", "url", url, "zip", zipPath)
    
    // Open the zip file
    file, err := os.Open(zipPath)
    if err != nil {
        return appfault.Fail[UploadResult](appfault.Wrap(err, appfault.ErrFileRead, "failed to open zip file"))
    }
    defer file.Close()
    
    // Get file info for size
    stat, err := file.Stat()
    if err != nil {
        return nil, appfault.Wrap(err, appfault.ErrFileRead, "failed to stat zip file")
    }
    
    c.log.Debug("Uploading plugin zip",
        "size", stat.Size(),
        "filename", filepath.Base(zipPath),
    )
    
    // Create multipart form
    var body bytes.Buffer
    writer := multipart.NewWriter(&body)
    
    // Add the file
    part, err := writer.CreateFormFile("pluginzip", filepath.Base(zipPath))
    if err != nil {
        return nil, appfault.Wrap(err, appfault.ErrInternal, "failed to create form file")
    }
    
    if _, err := io.Copy(part, file); err != nil {
        return nil, appfault.Wrap(err, appfault.ErrInternal, "failed to copy file content")
    }
    
    // Add overwrite flag
    writer.WriteField("overwrite", "true")
    
    writer.Close()
    
    // Make the upload request
    url = strings.TrimSuffix(url, "/")
    endpoint := url + "/wp-json/wp/v2/plugins"
    
    resp, err := c.doRequest(context, "POST", endpoint, username, password, &body, writer.FormDataContentType())
    if err != nil {
        return nil, appfault.Wrap(err, appfault.ErrWpUpload, "failed to upload plugin")
    }
    
    // EXEMPTED: WordPress REST API response format
    var uploadResp struct {
        Plugin  string `json:"plugin"`  // EXEMPTED: External WP API
        Status  string `json:"status"`  // EXEMPTED: External WP API
        Name    string `json:"name"`    // EXEMPTED: External WP API
        Version string `json:"version"` // EXEMPTED: External WP API
    }
    
    if err := c.parseResponse(resp, &uploadResp); err != nil {
        return &UploadResult{
            Success: false,
            Error:   err.Error(),
        }, nil
    }
    
    // Extract slug from plugin path
    slug := ""
    if uploadResp.Plugin != "" {
        parts := strings.Split(uploadResp.Plugin, "/")
        if len(parts) > 0 {
            slug = parts[0]
        }
    }
    
    c.log.Info("Plugin uploaded successfully",
        "slug", slug,
        "version", uploadResp.Version,
    )
    
    return &UploadResult{
        Success:    true,
        PluginSlug: slug,
        Version:    uploadResp.Version,
        WasUpdated: true,
    }, nil
}

// GetPluginFiles requires a companion WP plugin to expose file information
func (c *clientImpl) GetPluginFiles(context stdctx.Context, url, username, password, slug string) appfault.Result[[]RemoteFile] {
    c.log.Debug("Getting plugin files", "url", url, "slug", slug)
    
    // This requires a custom endpoint - the standard WP REST API doesn't expose plugin files
    url = strings.TrimSuffix(url, "/")
    endpoint := url + "/wp-json/wp-plugin-publish/v1/plugins/" + slug + "/files"
    
    resp, err := c.doRequest(context, "GET", endpoint, username, password, nil, "")
    if err != nil {
        return nil, appfault.Wrap(err, appfault.ErrWpApi, 
            "failed to get plugin files - wp-plugin-publish companion plugin may not be installed")
    }
    
    var files []RemoteFile
    if err := c.parseResponse(resp, &files); err != nil {
        return nil, err
    }
    
    return files, nil
}

// UploadPluginFile requires a companion WP plugin
func (c *clientImpl) UploadPluginFile(context stdctx.Context, url, username, password, slug, filePath string, content []byte) error {
    c.log.Debug("Uploading single file", "url", url, "slug", slug, "file", filePath)
    
    // This requires a custom endpoint
    url = strings.TrimSuffix(url, "/")
    endpoint := url + "/wp-json/wp-plugin-publish/v1/plugins/" + slug + "/files"
    
    var body bytes.Buffer
    writer := multipart.NewWriter(&body)
    
    writer.WriteField("path", filePath)
    
    part, err := writer.CreateFormFile("file", filepath.Base(filePath))
    if err != nil {
        return appfault.Wrap(err, appfault.ErrInternal, "failed to create form file")
    }
    
    if _, err := part.Write(content); err != nil {
        return appfault.Wrap(err, appfault.ErrInternal, "failed to write file content")
    }
    
    writer.Close()
    
    resp, err := c.doRequest(context, "POST", endpoint, username, password, &body, writer.FormDataContentType())
    if err != nil {
        return appfault.Wrap(err, appfault.ErrWpUpload, 
            "failed to upload file - wp-plugin-publish companion plugin may not be installed")
    }
    
    return c.parseResponse(resp, nil)
}
```

---

## Error Handling

| HTTP Status | Error Code | Meaning |
|-------------|------------|---------|
| 401 | E3002 | Invalid credentials |
| 403 | E3002 | Insufficient permissions |
| 404 | E2005 | Plugin/endpoint not found |
| 500+ | E3003 | WordPress server error |

---

## Rate Limiting

The client respects WordPress rate limiting:

```go
// internal/wordpress/ratelimit.go
package wordpress

import (
    "sync"
    "time"
)

type RateLimiter struct {
    mu          sync.Mutex
    lastRequest map[string]time.Time
    minInterval time.Duration
}

func NewRateLimiter(minInterval time.Duration) *RateLimiter {
    return &RateLimiter{
        lastRequest: make(map[string]time.Time),
        minInterval: minInterval,
    }
}

func (rl *RateLimiter) Wait(host string) {
    rl.mu.Lock()
    defer rl.mu.Unlock()
    
    if last, ok := rl.lastRequest[host]; ok {
        elapsed := time.Since(last)
        if elapsed < rl.minInterval {
            time.Sleep(rl.minInterval - elapsed)
        }
    }
    
    rl.lastRequest[host] = time.Now()
}
```

---

## Next Document

See [11-rest-api-endpoints.md](./11-rest-api-endpoints.md) for backend HTTP API.
