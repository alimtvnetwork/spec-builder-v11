# 04 — Site Service


**Version:** 1.0.0  
**Last Updated:** 2026-03-20  

> **Parent:** [00-overview.md](../00-overview.md)  
> **Status:** Draft

---

## Overview

The Site Service manages WordPress site connections, including CRUD operations, credential encryption, and connection testing.

---

## Interface

```go
// internal/services/site/service.go
package site

import (
    stdctx "context"
    
    "wp-plugin-publish/internal/models"
)

type Service interface {
    // CRUD operations
    List(context stdctx.Context) appfault.Result[[]models.Site]
    GetById(context stdctx.Context, id int64) appfault.Result[*models.Site]
    GetByUrl(context stdctx.Context, url string) appfault.Result[*models.Site]
    Create(context stdctx.Context, input CreateInput) appfault.Result[*models.Site]
    Update(context stdctx.Context, id int64, input UpdateInput) appfault.Result[*models.Site]
    Delete(context stdctx.Context, id int64) *appfault.AppError
    
    // Connection management
    TestConnection(context stdctx.Context, id int64) appfault.Result[*ConnectionResult]
    TestCredentials(context stdctx.Context, url, username, password string) appfault.Result[*ConnectionResult]
    
    // Status updates
    UpdateLastSync(context stdctx.Context, id int64) *appfault.AppError
    SetActive(context stdctx.Context, id int64, active bool) *appfault.AppError
}
```

---

## Data Types

### Site Model

```go
// internal/models/site.go
package models

import "time"

type Site struct {
    Id           int64      
    Name         string     
    Url          string     
    Username     string     
    AppPassword  string     `json:"-"`  // Never exposed in JSON
    IsActive     bool       
    LastSyncAt   *time.Time `json:",omitempty"`
    CreatedAt    time.Time  
    UpdatedAt    time.Time  
}

// SiteWithStatus includes connection status for UI display
type SiteWithStatus struct {
    Site
    IsConnected   bool
    WpVersion     string `json:",omitempty"`
    PluginCount   int
    LastError     string `json:",omitempty"`
}
```

### Input Types

```go
// internal/services/site/types.go
package site

type CreateInput struct {
    Name        string `validate:"required,max=255"`
    Url         string `validate:"required,url,max=2048"`
    Username    string `validate:"required,max=255"`
    AppPassword string `validate:"required"`
}

type UpdateInput struct {
    Name        *string `json:",omitempty" validate:"omitempty,max=255"`
    Url         *string `json:",omitempty" validate:"omitempty,url,max=2048"`
    Username    *string `json:",omitempty" validate:"omitempty,max=255"`
    AppPassword *string `json:",omitempty"`
    IsActive    *bool   `json:",omitempty"`
}

type ConnectionResult struct {
    Success     bool   
    WpVersion   string `json:",omitempty"`
    SiteName    string `json:",omitempty"`
    PluginCount int    `json:",omitempty"`
    Error       string `json:",omitempty"`
    ErrorCode   string `json:",omitempty"`
}
```

---

## Implementation

### Service Constructor

```go
// internal/services/site/service.go
package site

import (
    "wp-plugin-publish/internal/logger"
    "wp-plugin-publish/internal/wordpress"
    
    "gorm.io/gorm"
)

type serviceImpl struct {
    db        *gorm.DB
    wpClient  *wordpress.Client
    log       *logger.Logger
    encKey    []byte  // AES-256 encryption key
}

func New(db *gorm.DB, wpClient *wordpress.Client, log *logger.Logger, encKey []byte) Service {
    return &serviceImpl{
        db:       db,
        wpClient: wpClient,
        log:      log,
        encKey:   encKey,
    }
}
```

### CRUD Operations

```go
// internal/services/site/crud.go
package site

import (
    stdctx "context"
    "strings"
    "time"
    
    "wp-plugin-publish/internal/models"
    "wp-plugin-publish/pkg/appfault"
    
    "gorm.io/gorm"
)

func (s *serviceImpl) List(context stdctx.Context) appfault.Result[[]models.Site] {
    s.log.Debug("Listing all sites")
    
    var sites []models.Site
    if err := s.db.WithContext(context).Order("Name ASC").Find(&sites).Error; err != nil {
        return nil, appfault.Wrap(
            err, appfault.ErrDatabaseQuery, "failed to list sites",
        )
    }
    
    // Decrypt passwords
    for i := range sites {
        decrypted, err := DecryptPassword(sites[i].AppPassword, s.encKey)
        if err != nil {
            s.log.Warn("Failed to decrypt password for site", "siteId", sites[i].Id)
        }
        sites[i].AppPassword = decrypted
    }
    
    s.log.Info("Listed sites", "count", len(sites))
    return sites, nil
}

func (s *serviceImpl) GetById(context stdctx.Context, id int64) appfault.Result[*models.Site] {
    s.log.Debug("Getting site by id", "siteId", id)
    
    var site models.Site
    if err := s.db.WithContext(context).First(&site, "Id = ?", id).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            return nil, appfault.New(
                appfault.ErrNotFound, "site not found",
            ).
                WithContext("siteId", id)
        }
        return nil, appfault.Wrap(
            err, appfault.ErrDatabaseQuery, "failed to get site",
        )
    }
    
    site.AppPassword, _ = DecryptPassword(site.AppPassword, s.encKey)
    return &site, nil
}

func (s *serviceImpl) Create(context stdctx.Context, input CreateInput) appfault.Result[*models.Site] {
    s.log.Info("Creating site", "name", input.Name, "url", input.Url)
    
    // Validate input
    if err := s.validateCreateInput(input); err != nil {
        return nil, err
    }
    
    // Normalize URL (remove trailing slash)
    url := strings.TrimSuffix(input.Url, "/")
    
    // Check for duplicate URL
    existing, _ := s.GetByUrl(context, url)
    if existing != nil {
        return nil, appfault.New(
            appfault.ErrDuplicate, "site with this URL already exists",
        ).
            WithContext("url", url)
    }
    
    // Encrypt password
    encryptedPassword, err := EncryptPassword(input.AppPassword, s.encKey)
    if err != nil {
        return nil, appfault.Wrap(
            err, appfault.ErrInternal, "failed to encrypt password",
        )
    }
    
    now := time.Now()
    site := models.Site{
        Name:        input.Name,
        Url:         url,
        Username:    input.Username,
        AppPassword: encryptedPassword,
        IsActive:    true,
        CreatedAt:   now,
        UpdatedAt:   now,
    }
    
    if err := s.db.WithContext(context).Create(&site).Error; err != nil {
        return nil, appfault.Wrap(
            err, appfault.ErrDatabaseExec, "failed to create site",
        )
    }
    
    s.log.Info("Site created", "siteId", site.Id, "name", input.Name)
    return s.GetById(context, site.Id)
}

func (s *serviceImpl) Update(context stdctx.Context, id int64, input UpdateInput) appfault.Result[*models.Site] {
    s.log.Info("Updating site", "siteId", id)
    
    // Verify site exists
    existing, err := s.GetById(context, id)
    if err != nil {
        return nil, err
    }
    
    // Apply updates to existing model
    if input.Name != nil {
        existing.Name = *input.Name
    }
    if input.Url != nil {
        existing.Url = strings.TrimSuffix(*input.Url, "/")
    }
    if input.Username != nil {
        existing.Username = *input.Username
    }
    if input.AppPassword != nil {
        encrypted, err := EncryptPassword(*input.AppPassword, s.encKey)
        if err != nil {
            return nil, appfault.Wrap(
                err, appfault.ErrInternal, "failed to encrypt password",
            )
        }
        existing.AppPassword = encrypted
    }
    if input.IsActive != nil {
        existing.IsActive = *input.IsActive
    }
    existing.UpdatedAt = time.Now()
    
    if err := s.db.WithContext(context).Save(existing).Error; err != nil {
        return nil, appfault.Wrap(
            err, appfault.ErrDatabaseExec, "failed to update site",
        )
    }
    
    s.log.Info("Site updated", "siteId", id)
    return s.GetById(context, id)
}

func (s *serviceImpl) Delete(context stdctx.Context, id int64) error {
    s.log.Info("Deleting site", "siteId", id)
    
    // Verify site exists
    if _, err := s.GetById(context, id); err != nil {
        return err
    }
    
    // Delete (cascade will handle plugins)
    if err := s.db.WithContext(context).Delete(&models.Site{}, "Id = ?", id).Error; err != nil {
        return appfault.Wrap(
            err, appfault.ErrDatabaseExec, "failed to delete site",
        )
    }
    
    s.log.Info("Site deleted", "siteId", id)
    return nil
}
```

### Connection Testing

```go
// internal/services/site/connection.go
package site

import (
    stdctx "context"
    
    "wp-plugin-publish/pkg/appfault"
)

func (s *serviceImpl) TestConnection(context stdctx.Context, id int64) appfault.Result[ConnectionResult] {
    s.log.Info("Testing connection", "siteId", id)
    
    site, err := s.GetById(context, id)
    if err != nil {
        return appfault.Fail[ConnectionResult](err)
    }
    
    return s.TestCredentials(context, site.Url, site.Username, site.AppPassword)
}

func (s *serviceImpl) TestCredentials(context stdctx.Context, url, username, password string) appfault.Result[ConnectionResult] {
    s.log.Debug("Testing credentials", "url", url, "username", username)
    
    // Test connection via WP REST API
    info, err := s.wpClient.GetSiteInfo(context, url, username, password)
    if err != nil {
        appErr, ok := err.(*appfault.AppError)
        if ok {
            return &ConnectionResult{
                Success:   false,
                Error:     appErr.Message,
                ErrorCode: appErr.Code,
            }, nil
        }
        return &ConnectionResult{
            Success:   false,
            Error:     err.Error(),
            ErrorCode: appfault.ErrWpConnect,
        }, nil
    }
    
    // Get plugin count
    plugins, err := s.wpClient.ListPlugins(context, url, username, password)
    pluginCount := 0
    if err == nil {
        pluginCount = len(plugins)
    }
    
    s.log.Info("Connection test successful",
        "url", url,
        "wpVersion", info.Version,
        "siteName", info.Name,
    )
    
    return &ConnectionResult{
        Success:     true,
        WPVersion:   info.Version,
        SiteName:    info.Name,
        PluginCount: pluginCount,
    }, nil
}

func (s *serviceImpl) UpdateLastSync(context stdctx.Context, id int64) error {
    _, err := s.db.ExecContext(context,
        "UPDATE Sites SET LastSyncAt = datetime('now'), UpdatedAt = datetime('now') WHERE Id = ?",
        id,
    )
    if err != nil {
        return appfault.Wrap(
            err, appfault.ErrDatabaseExec, "failed to update last sync",
        )
    }
    return nil
}

func (s *serviceImpl) SetActive(context stdctx.Context, id int64, active bool) error {
    activeInt := 0
    if active {
        activeInt = 1
    }
    
    _, err := s.db.ExecContext(context,
        "UPDATE Sites SET IsActive = ?, UpdatedAt = datetime('now') WHERE Id = ?",
        activeInt, id,
    )
    if err != nil {
        return appfault.Wrap(
            err, appfault.ErrDatabaseExec, "failed to update site active status",
        )
    }
    return nil
}
```

### Validation

```go
// internal/services/site/validator.go
package site

import (
    "net/url"
    "strings"
    
    "wp-plugin-publish/pkg/appfault"
)

func (s *serviceImpl) validateCreateInput(input CreateInput) error {
    if strings.TrimSpace(input.Name) == "" {
        return appfault.New(
            appfault.ErrValidationEmpty, "site name is required",
        )
    }
    
    if len(input.Name) > 255 {
        return appfault.New(
            appfault.ErrValidationLength, "site name must be 255 characters or less",
        )
    }
    
    if strings.TrimSpace(input.Url) == "" {
        return appfault.New(
            appfault.ErrValidationEmpty, "site URL is required",
        )
    }
    
    parsedUrl, err := url.Parse(input.Url)
    if err != nil || (parsedUrl.Scheme != "http" && parsedUrl.Scheme != "https") {
        return appfault.New(
            appfault.ErrValidationUrl, "invalid site URL format",
        )
    }
    
    if len(input.Url) > 2048 {
        return appfault.New(
            appfault.ErrValidationLength, "site URL must be 2048 characters or less",
        )
    }
    
    if strings.TrimSpace(input.Username) == "" {
        return appfault.New(
            appfault.ErrValidationEmpty, "username is required",
        )
    }
    
    if strings.TrimSpace(input.AppPassword) == "" {
        return appfault.New(
            appfault.ErrValidationEmpty, "application password is required",
        )
    }
    
    // Normalize app password (remove spaces for validation)
    normalized := strings.ReplaceAll(input.AppPassword, " ", "")
    if len(normalized) != 24 {
        return appfault.New(appfault.ErrValidationFormat, 
            "application password must be 24 characters (format: xxxx xxxx xxxx xxxx xxxx xxxx)")
    }
    
    return nil
}
```

### Encryption

```go
// internal/services/site/encryption.go
package site

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "encoding/base64"
    "io"
    
    "wp-plugin-publish/pkg/appfault"
)

func EncryptPassword(plaintext string, key []byte) appfault.Result[string] {
    block, err := aes.NewCipher(key)
    if err != nil {
        return "", appfault.Wrap(
            err, appfault.ErrInternal, "failed to create cipher",
        )
    }
    
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", appfault.Wrap(
            err, appfault.ErrInternal, "failed to create GCM",
        )
    }
    
    nonce := make([]byte, gcm.NonceSize())
    if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
        return "", appfault.Wrap(
            err, appfault.ErrInternal, "failed to generate nonce",
        )
    }
    
    ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
    return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func DecryptPassword(ciphertext string, key []byte) appfault.Result[string] {
    data, err := base64.StdEncoding.DecodeString(ciphertext)
    if err != nil {
        return "", appfault.Wrap(
            err, appfault.ErrInternal, "failed to decode ciphertext",
        )
    }
    
    block, err := aes.NewCipher(key)
    if err != nil {
        return "", appfault.Wrap(
            err, appfault.ErrInternal, "failed to create cipher",
        )
    }
    
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return "", appfault.Wrap(
            err, appfault.ErrInternal, "failed to create GCM",
        )
    }
    
    if len(data) < gcm.NonceSize() {
        return "", appfault.New(
            appfault.ErrInternal, "ciphertext too short",
        )
    }
    
    nonce := data[:gcm.NonceSize()]
    ciphertextBytes := data[gcm.NonceSize():]
    
    plaintext, err := gcm.Open(nil, nonce, ciphertextBytes, nil)
    if err != nil {
        return "", appfault.Wrap(
            err, appfault.ErrInternal, "failed to decrypt",
        )
    }
    
    return string(plaintext), nil
}
```

---

## Error Scenarios

| Scenario | Error Code | HTTP Status |
|----------|------------|-------------|
| Site not found | E2005 | 404 |
| Duplicate URL | E2006 | 409 |
| Invalid URL format | E6002 | 400 |
| Empty required field | E6004 | 400 |
| Connection failed | E3001 | 502 |
| Auth failed | E3002 | 401 |

---

## Next Document

See [05-plugin-service.md](./05-plugin-service.md) for plugin management.
