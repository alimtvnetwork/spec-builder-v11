# Component: Database Schema

**Parent:** [Golang Search CLI](./00-overview.md)  
**Version:** 2.0.0  
**Updated:** 2026-03-09  

---

## Summary

SQLite database schema for the Golang Search CLI, managed via GORM ORM with automatic migrations. Includes OAuth token storage with AES-256-GCM encryption for secure credential management.

---

## Database File

**Path:** `./data/search.db.sqlite`  
**Managed by:** GORM AutoMigrate

---

## Entity Relationship Diagram

```mermaid
erDiagram
    SearchRequest ||--o{ SearchResult : "has many"
    SearchRequest ||--o{ NestedSearch : "triggers"
    SearchResult ||--o| PageContent : "has one"
    NestedSearch }o--|| SearchRequest : "creates child"
    SearchRequest ||--o| RagMemory : "generates"
    CacheEntry ||--o| SearchRequest : "references"
    OAuthToken ||--o{ SearchRequest : "authenticates"
    
    SearchRequest {
        TEXT Id PK "UUID"
        TEXT Keywords "NOT NULL"
        TEXT Engine "DEFAULT google"
        TEXT Method "DEFAULT html"
        TEXT Status "DEFAULT pending"
        INTEGER ResultCount "DEFAULT 0"
        TEXT CreatedAt "ISO8601"
        TEXT UpdatedAt "ISO8601"
        TEXT CompletedAt "ISO8601 nullable"
    }
    
    SearchResult {
        TEXT Id PK "UUID"
        TEXT SearchRequestId FK "NOT NULL"
        TEXT Title
        TEXT Description
        TEXT Url
        INTEGER Position
        TEXT FetchedAt "ISO8601"
    }
    
    PageContent {
        TEXT Id PK "UUID"
        TEXT SearchResultId FK "UNIQUE"
        TEXT RawHtml
        TEXT ExtractedText
        TEXT Keywords "JSON array"
        TEXT CrawledAt "ISO8601"
    }
    
    NestedSearch {
        TEXT Id PK "UUID"
        TEXT ParentSearchId FK "NOT NULL"
        TEXT ChildSearchId FK "NOT NULL"
        TEXT TriggerKeyword
        INTEGER Depth
        TEXT CreatedAt "ISO8601"
    }
    
    CacheEntry {
        TEXT Id PK "UUID"
        TEXT KeywordHash "UNIQUE NOT NULL"
        TEXT Keywords
        TEXT CachedAt "ISO8601"
        TEXT ExpiresAt "ISO8601"
        INTEGER IsValid "DEFAULT 1"
    }
    
    RagMemory {
        TEXT Id PK "UUID"
        TEXT SearchRequestId FK
        TEXT Content "JSON/YAML/TOML"
        TEXT Format "json|yaml|toml"
        TEXT GeneratedAt "ISO8601"
    }
    
    OAuthToken {
        TEXT Id PK "UUID"
        TEXT Provider "NOT NULL INDEX"
        TEXT TokenType "DEFAULT bearer"
        TEXT AccessTokenEnc "AES-256-GCM"
        TEXT RefreshTokenEnc "AES-256-GCM"
        TEXT Scope
        TEXT ExpiresAt "ISO8601"
        TEXT LastUsedAt "ISO8601"
        TEXT CreatedAt "ISO8601"
        TEXT UpdatedAt "ISO8601"
    }
```

---

## GORM Models

### SearchRequest

```go
package models

import (
    "time"
    "github.com/google/uuid"
    "gorm.io/gorm"
)

type SearchStatus string

const (
    StatusPending    SearchStatus = "pending"
    StatusInProgress SearchStatus = "in_progress"
    StatusCompleted  SearchStatus = "completed"
    StatusFailed     SearchStatus = "failed"
    StatusCached     SearchStatus = "cached"
)

type SearchRequest struct {
    Id          string       `gorm:"primaryKey;type:TEXT"`
    Keywords    string       `gorm:"type:TEXT;not null"`
    Engine      string       `gorm:"type:TEXT;default:google"`
    Method      string       `gorm:"type:TEXT;default:html"`
    Status      SearchStatus `gorm:"type:TEXT;default:pending"`
    ResultCount int          `gorm:"type:INTEGER;default:0"`
    ErrorMsg    string       `gorm:"type:TEXT"`
    CreatedAt   time.Time    `gorm:"type:TEXT"`
    UpdatedAt   time.Time    `gorm:"type:TEXT"`
    CompletedAt *time.Time   `gorm:"type:TEXT"`
    
    // Relationships
    Results        []SearchResult `gorm:"foreignKey:SearchRequestId;constraint:OnDelete:CASCADE"`
    NestedSearches []NestedSearch `gorm:"foreignKey:ParentSearchId;constraint:OnDelete:CASCADE"`
    RagMemory      *RagMemory     `gorm:"foreignKey:SearchRequestId;constraint:OnDelete:SET NULL"`
}

func (r *SearchRequest) BeforeCreate(tx *gorm.DB) error {
    if r.Id == "" {
        r.Id = uuid.New().String()
    }
    return nil
}
```

### SearchResult

```go
type SearchResult struct {
    Id              string    `gorm:"primaryKey;type:TEXT"`
    SearchRequestId string    `gorm:"type:TEXT;not null;index"`
    Title           string    `gorm:"type:TEXT"`
    Description     string    `gorm:"type:TEXT"`
    Url             string    `gorm:"type:TEXT"`
    Position        int       `gorm:"type:INTEGER"`
    FetchedAt       time.Time `gorm:"type:TEXT"`
    
    // Relationships
    SearchRequest SearchRequest `gorm:"foreignKey:SearchRequestId"`
    PageContent   *PageContent  `gorm:"foreignKey:SearchResultId;constraint:OnDelete:CASCADE"`
}

func (r *SearchResult) BeforeCreate(tx *gorm.DB) error {
    if r.Id == "" {
        r.Id = uuid.New().String()
    }
    return nil
}
```

### PageContent

```go
type PageContent struct {
    Id             string    `gorm:"primaryKey;type:TEXT"`
    SearchResultId string    `gorm:"type:TEXT;uniqueIndex"`
    RawHtml        string    `gorm:"type:TEXT"`
    ExtractedText  string    `gorm:"type:TEXT"`
    Keywords       string    `gorm:"type:TEXT"` // JSON array
    CrawledAt      time.Time `gorm:"type:TEXT"`
    
    // Relationships
    SearchResult SearchResult `gorm:"foreignKey:SearchResultId"`
}

func (p *PageContent) BeforeCreate(tx *gorm.DB) error {
    if p.Id == "" {
        p.Id = uuid.New().String()
    }
    return nil
}

// Helper to get keywords as slice
func (p *PageContent) GetKeywords() StringSlice {
    var keywords []string
    if p.Keywords == "" {
        return appfault.Ok(keywords)
    }
    err := json.Unmarshal([]byte(p.Keywords), &keywords)
    if err != nil {
        return appfault.Fail[[]string](
            appfault.Wrap(err, "unmarshal keywords"),
        )
    }
    return appfault.Ok(keywords)
}

// Helper to set keywords from slice
func (p *PageContent) SetKeywords(keywords []string) *appfault.AppError {
    data, err := json.Marshal(keywords)
    if err != nil {
        return appfault.Wrap(err, "marshal keywords")
    }
    p.Keywords = string(data)
    return nil
}
```

### NestedSearch

```go
type NestedSearch struct {
    Id             string    `gorm:"primaryKey;type:TEXT"`
    ParentSearchId string    `gorm:"type:TEXT;not null;index"`
    ChildSearchId  string    `gorm:"type:TEXT;not null;index"`
    TriggerKeyword string    `gorm:"type:TEXT"`
    Depth          int       `gorm:"type:INTEGER;default:1"`
    CreatedAt      time.Time `gorm:"type:TEXT"`
    
    // Relationships
    ParentSearch SearchRequest `gorm:"foreignKey:ParentSearchId"`
    ChildSearch  SearchRequest `gorm:"foreignKey:ChildSearchId"`
}

func (n *NestedSearch) BeforeCreate(tx *gorm.DB) error {
    if n.Id == "" {
        n.Id = uuid.New().String()
    }
    return nil
}
```

### CacheEntry

```go
type CacheEntry struct {
    Id          string    `gorm:"primaryKey;type:TEXT"`
    KeywordHash string    `gorm:"type:TEXT;uniqueIndex;not null"`
    Keywords    string    `gorm:"type:TEXT"`
    Engine      string    `gorm:"type:TEXT"`
    CachedAt    time.Time `gorm:"type:TEXT"`
    ExpiresAt   time.Time `gorm:"type:TEXT"`
    IsValid     bool      `gorm:"type:INTEGER;default:1"`
    
    // Reference to cached search
    SearchRequestId string        `gorm:"type:TEXT;index"`
    SearchRequest   SearchRequest `gorm:"foreignKey:SearchRequestId"`
}

func (c *CacheEntry) BeforeCreate(tx *gorm.DB) error {
    if c.Id == "" {
        c.Id = uuid.New().String()
    }
    return nil
}

func (c *CacheEntry) IsExpired() bool {
    return time.Now().After(c.ExpiresAt)
}
```

### RagMemory

```go
type RagFormat string

const (
    FormatJson RagFormat = "json"
    FormatYaml RagFormat = "yaml"
    FormatToml RagFormat = "toml"
)

type RagMemory struct {
    Id              string    `gorm:"primaryKey;type:TEXT"`
    SearchRequestId string    `gorm:"type:TEXT;index"`
    Content         string    `gorm:"type:TEXT"` // Formatted content
    Format          RagFormat `gorm:"type:TEXT;default:json"`
    GeneratedAt     time.Time `gorm:"type:TEXT"`
    
    // Relationships
    SearchRequest SearchRequest `gorm:"foreignKey:SearchRequestId"`
}

func (r *RagMemory) BeforeCreate(tx *gorm.DB) error {
    if r.Id == "" {
        r.Id = uuid.New().String()
    }
    return nil
}
```

### OAuthToken

```go
// OAuthProvider represents supported OAuth providers
type OAuthProvider string

const (
    ProviderGoogle OAuthProvider = "google"
    ProviderBing   OAuthProvider = "bing"
)

// OAuthToken stores encrypted OAuth credentials for API access
type OAuthToken struct {
    Id              string        `gorm:"primaryKey;type:TEXT"`
    Provider        OAuthProvider `gorm:"type:TEXT;not null;index"`
    TokenType       string        `gorm:"type:TEXT;default:bearer"`
    AccessTokenEnc  string        `gorm:"type:TEXT"`  // AES-256-GCM encrypted
    RefreshTokenEnc string        `gorm:"type:TEXT"`  // AES-256-GCM encrypted
    Scope           string        `gorm:"type:TEXT"`
    ExpiresAt       time.Time     `gorm:"type:TEXT"`
    LastUsedAt      *time.Time    `gorm:"type:TEXT"`
    CreatedAt       time.Time     `gorm:"type:TEXT"`
    UpdatedAt       time.Time     `gorm:"type:TEXT"`
}

func (t *OAuthToken) BeforeCreate(tx *gorm.DB) error {
    if t.Id == "" {
        t.Id = uuid.New().String()
    }
    return nil
}

// IsExpired checks if the access token has expired
func (t *OAuthToken) IsExpired() bool {
    return time.Now().After(t.ExpiresAt)
}

// NeedsRefresh checks if token should be refreshed (5 min before expiry)
func (t *OAuthToken) NeedsRefresh() bool {
    return time.Now().Add(5 * time.Minute).After(t.ExpiresAt)
}
```

---

## Token Encryption

### Encryption Configuration

```go
// pkg/crypto/config.go

package crypto

import (
    "os"
    "encoding/hex"
    "errors"
)

const (
    // Environment variable for encryption key
    EnvTokenKey = "GSEARCH_TOKEN_KEY"
    
    // Key size for AES-256
    KeySizeBytes = 32
    
    // Nonce size for GCM
    NonceSizeBytes = 12
)

var (
    ErrKeyMissing     = errors.New("encryption key not configured")
    ErrKeyInvalidSize = errors.New("encryption key must be 32 bytes (64 hex chars)")
    ErrKeyInvalidHex  = errors.New("encryption key must be valid hex string")
)

// GetEncryptionKey retrieves and validates the encryption key from environment
func GetEncryptionKey() ByteSlice {
    keyHex := os.Getenv(EnvTokenKey)
    if keyHex == "" {
        return appfault.Fail[[]byte](
            appfault.New("encryption key not configured"),
        )
    }
    
    key, err := hex.DecodeString(keyHex)
    if err != nil {
        return appfault.Fail[[]byte](
            appfault.New("encryption key must be valid hex string"),
        )
    }
    
    if len(key) != KeySizeBytes {
        return appfault.Fail[[]byte](
            appfault.New("encryption key must be 32 bytes (64 hex chars)"),
        )
    }
    
    return appfault.Ok(key)
}

// GenerateKey creates a new random encryption key (for initial setup)
func GenerateKey() appfault.Result[string] {
    key := make([]byte, KeySizeBytes)
    if _, err := rand.Read(key); err != nil {
        return appfault.Fail[string](
            appfault.Wrap(err, "generate key"),
        )
    }
    return appfault.Ok(hex.EncodeToString(key))
}
```

### TokenEncryptor

```go
// pkg/crypto/encryptor.go

package crypto

import (
    "crypto/aes"
    "crypto/cipher"
    "crypto/rand"
    "encoding/base64"
    "errors"
    "io"
)

var (
    ErrEncryptionFailed = errors.New("encryption failed")
    ErrDecryptionFailed = errors.New("decryption failed")
    ErrCiphertextShort  = errors.New("ciphertext too short")
    ErrCiphertextCorrupt = errors.New("ciphertext appears corrupted")
)

// TokenEncryptor handles AES-256-GCM encryption for OAuth tokens
type TokenEncryptor struct {
    key    []byte
    gcm    cipher.AEAD
}

// NewTokenEncryptor creates a new encryptor with the provided key
func NewTokenEncryptor(key []byte) appfault.Result[*TokenEncryptor] {
    block, err := aes.NewCipher(key)
    if err != nil {
        return appfault.Fail[*TokenEncryptor](
            appfault.Wrap(
                errors.ErrEncryptFailed,
                "create cipher",
                err,
            ),
        )
    }
    
    gcm, err := cipher.NewGCM(block)
    if err != nil {
        return appfault.Fail[*TokenEncryptor](
            appfault.Wrap(
                errors.ErrEncryptFailed,
                "create GCM",
                err,
            ),
        )
    }
    
    return appfault.Ok(&TokenEncryptor{
        key: key,
        gcm: gcm,
    })
}

// NewTokenEncryptorFromEnv creates encryptor using environment variable
func NewTokenEncryptorFromEnv() appfault.Result[*TokenEncryptor] {
    keyResult := GetEncryptionKey()
    if !keyResult.IsSuccess {
        return appfault.Fail[*TokenEncryptor](keyResult.Error)
    }
    return NewTokenEncryptor(keyResult.Value)
}

// Encrypt encrypts plaintext and returns base64-encoded ciphertext
func (e *TokenEncryptor) Encrypt(plaintext string) appfault.Result[string] {
    if plaintext == "" {
        return appfault.Ok("")
    }
    
    // Generate random nonce
    nonce := make([]byte, e.gcm.NonceSize())
    if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
        return appfault.Fail[string](
            appfault.New("encryption failed"),
        )
    }
    
    // Encrypt with GCM (includes authentication tag)
    ciphertext := e.gcm.Seal(nonce, nonce, []byte(plaintext), nil)
    
    // Return base64-encoded result
    return appfault.Ok(base64.StdEncoding.EncodeToString(ciphertext))
}

// Decrypt decrypts base64-encoded ciphertext and returns plaintext
func (e *TokenEncryptor) Decrypt(ciphertextB64 string) appfault.Result[string] {
    if ciphertextB64 == "" {
        return appfault.Ok("")
    }
    
    // Decode from base64
    ciphertext, err := base64.StdEncoding.DecodeString(ciphertextB64)
    if err != nil {
        return appfault.Fail[string](
            appfault.New("ciphertext appears corrupted"),
        )
    }
    
    // Validate minimum length (nonce + at least 1 byte + auth tag)
    if len(ciphertext) < e.gcm.NonceSize() + 1 {
        return appfault.Fail[string](
            appfault.New("ciphertext too short"),
        )
    }
    
    // Extract nonce
    nonce := ciphertext[:e.gcm.NonceSize()]
    ciphertext = ciphertext[e.gcm.NonceSize():]
    
    // Decrypt and verify authentication tag
    plaintext, err := e.gcm.Open(nil, nonce, ciphertext, nil)
    if err != nil {
        return appfault.Fail[string](
            appfault.New("ciphertext appears corrupted"),
        )
    }
    
    return appfault.Ok(string(plaintext))
}

// RotateKey re-encrypts all tokens with a new key
func RotateKey(db *gorm.DB, oldKey, newKey []byte) error {
    oldEnc, err := NewTokenEncryptor(oldKey)
    if err != nil {
        return err
    }
    
    newEnc, err := NewTokenEncryptor(newKey)
    if err != nil {
        return err
    }
    
    var tokens []OAuthToken
    if err := db.Find(&tokens).Error; err != nil {
        return err
    }
    
    return db.Transaction(func(tx *gorm.DB) error {
        for _, token := range tokens {
            // Decrypt with old key
            accessToken, err := oldEnc.Decrypt(token.AccessTokenEnc)
            if err != nil {
                return err
            }
            refreshToken, err := oldEnc.Decrypt(token.RefreshTokenEnc)
            if err != nil {
                return err
            }
            
            // Re-encrypt with new key
            token.AccessTokenEnc, err = newEnc.Encrypt(accessToken)
            if err != nil {
                return err
            }
            token.RefreshTokenEnc, err = newEnc.Encrypt(refreshToken)
            if err != nil {
                return err
            }
            
            // Update in database
            if err := tx.Save(&token).Error; err != nil {
                return err
            }
        }
        return nil
    })
}
```

---

## Token Manager

```go
// pkg/auth/token_manager.go

package auth

import (
    stdctx "context"
    "time"
    "golang.org/x/oauth2"
    "gsearch/pkg/appfault"
    "gsearch/pkg/crypto"
    "gsearch/pkg/models"
    "gorm.io/gorm"
)

// TokenManager handles OAuth token storage and retrieval
type TokenManager struct {
    db        *gorm.DB
    encryptor *crypto.TokenEncryptor
}

// NewTokenManager creates a new token manager
func NewTokenManager(db *gorm.DB) appfault.Result[*TokenManager] {
    encryptorResult := crypto.NewTokenEncryptorFromEnv()
    if !encryptorResult.IsSuccess {
        return appfault.Fail[*TokenManager](
            appfault.Wrap(
                encryptorResult.Error,
                "failed to initialize token encryptor",
            ),
        )
    }
    
    return appfault.Ok(&TokenManager{
        db:        db,
        encryptor: encryptorResult.Value,
    })
}

// StoreToken encrypts and stores an OAuth token
func (m *TokenManager) StoreToken(provider models.OAuthProvider, token *oauth2.Token, scope string) *appfault.AppError {
    accessResult := m.encryptor.Encrypt(token.AccessToken)
    if !accessResult.IsSuccess {
        return appfault.Wrap(
            accessResult.Error,
            "failed to encrypt access token",
        )
    }
    
    refreshResult := m.encryptor.Encrypt(token.RefreshToken)
    if !refreshResult.IsSuccess {
        return appfault.Wrap(
            refreshResult.Error,
            "failed to encrypt refresh token",
        )
    }
    
    oauthToken := &models.OAuthToken{
        Provider:        provider,
        TokenType:       token.TokenType,
        AccessTokenEnc:  accessResult.Value,
        RefreshTokenEnc: refreshResult.Value,
        Scope:           scope,
        ExpiresAt:       token.Expiry,
        CreatedAt:       time.Now(),
        UpdatedAt:       time.Now(),
    }
    
    // Upsert - update if exists, create if not
    if err := m.db.Where("provider = ?", provider).Assign(*oauthToken).FirstOrCreate(oauthToken).Error; err != nil {
        return appfault.Wrap(err, "store token")
    }
    
    return nil
}

// GetToken retrieves and decrypts an OAuth token
func (m *TokenManager) GetToken(provider models.OAuthProvider) appfault.Result[*oauth2.Token] {
    var stored models.OAuthToken
    err := m.db.Where("provider = ?", provider).First(&stored).Error
    if err != nil {
        if err == gorm.ErrRecordNotFound {
            return appfault.Fail[*oauth2.Token](
                appfault.New(
                    "no token found for provider: " + string(provider),
                ),
            )
        }
        return appfault.Fail[*oauth2.Token](
            appfault.Wrap(
                err,
                "failed to retrieve token",
            ),
        )
    }
    
    accessResult := m.encryptor.Decrypt(stored.AccessTokenEnc)
    if !accessResult.IsSuccess {
        return appfault.Fail[*oauth2.Token](
            appfault.Wrap(
                accessResult.Error,
                "failed to decrypt access token",
            ),
        )
    }
    
    refreshResult := m.encryptor.Decrypt(stored.RefreshTokenEnc)
    if !refreshResult.IsSuccess {
        return appfault.Fail[*oauth2.Token](
            appfault.Wrap(
                refreshResult.Error,
                "failed to decrypt refresh token",
            ),
        )
    }
    
    return appfault.Ok(&oauth2.Token{
        AccessToken:  accessResult.Value,
        RefreshToken: refreshResult.Value,
        TokenType:    stored.TokenType,
        Expiry:       stored.ExpiresAt,
    })
}

// GetValidToken retrieves a token, refreshing if necessary
func (m *TokenManager) GetValidToken(context stdctx.Context, provider models.OAuthProvider, config *oauth2.Config) appfault.Result[*oauth2.Token] {
    tokenResult := m.GetToken(provider)
    if !tokenResult.IsSuccess {
        return tokenResult
    }
    
    token := tokenResult.Value
    
    // Check if token needs refresh
    if !token.Valid() || token.Expiry.Before(time.Now().Add(5*time.Minute)) {
        return m.refreshToken(context, provider, token, config)
    }
    
    // Update last used timestamp
    m.db.Model(&models.OAuthToken{}).
        Where("provider = ?", provider).
        Update("last_used_at", time.Now())
    
    return appfault.Ok(token)
}

// refreshToken refreshes an expired token and stores the new one
func (m *TokenManager) refreshToken(context stdctx.Context, provider models.OAuthProvider, token *oauth2.Token, config *oauth2.Config) appfault.Result[*oauth2.Token] {
    if token.RefreshToken == "" {
        return appfault.Fail[*oauth2.Token](
            appfault.New(
                "token expired and no refresh token available",
            ),
        )
    }
    
    // Use OAuth2 TokenSource to refresh
    ts := config.TokenSource(context, token)
    newToken, err := ts.Token()
    if err != nil {
        return appfault.Fail[*oauth2.Token](
            appfault.Wrap(
                err,
                "failed to refresh token",
            ),
        )
    }
    
    // Store the refreshed token
    scope := "" // Preserve original scope if needed
    storedResult := m.getStoredToken(provider)
    if storedResult.IsSuccess {
        scope = storedResult.Value.Scope
    }
    
    if storeErr := m.StoreToken(provider, newToken, scope); storeErr != nil {
        return appfault.Fail[*oauth2.Token](storeErr)
    }
    
    return appfault.Ok(newToken)
}

// getStoredToken retrieves raw stored token without decryption
func (m *TokenManager) getStoredToken(provider models.OAuthProvider) appfault.Result[*models.OAuthToken] {
    var stored models.OAuthToken
    err := m.db.Where("provider = ?", provider).First(&stored).Error
    if err != nil {
        return appfault.Fail[*models.OAuthToken](
            appfault.Wrap(err, "get stored token"),
        )
    }
    return appfault.Ok(&stored)
}

// RevokeToken removes a stored token
func (m *TokenManager) RevokeToken(provider models.OAuthProvider) *appfault.AppError {
    result := m.db.Where("provider = ?", provider).Delete(&models.OAuthToken{})
    if result.Error != nil {
        return appfault.Wrap(
            result.Error,
            "failed to revoke token",
        )
    }
    return nil
}

// HasValidToken checks if a valid token exists for provider
func (m *TokenManager) HasValidToken(provider models.OAuthProvider) bool {
    var stored models.OAuthToken
    err := m.db.Where("provider = ?", provider).First(&stored).Error
    if err != nil {
        return false
    }
    return stored.IsActive() || stored.RefreshTokenEnc != ""
}
```

---

## Token Queries

### Get OAuth Token

```go
func (db *DB) GetOAuthToken(provider OAuthProvider) appfault.Result[OAuthToken] {
    var token OAuthToken
    err := db.Where("provider = ?", provider).First(&token).Error
    if err != nil {
        return appfault.Fail[OAuthToken](appfault.Wrap(err, 7100, "get oauth token"))
    }
    return appfault.Ok(token)
}
```

### List All Tokens

```go
func (db *DB) ListOAuthTokens() OAuthTokenSlice {
    var tokens []OAuthToken
    err := db.Find(&tokens).Error

    if err != nil {
        return appfault.Fail[[]OAuthToken](appfault.Wrap(err, 7106, "list oauth tokens"))
    }

    return appfault.Ok(tokens)
}
```

### Delete Expired Tokens

```go
func (db *DB) DeleteExpiredTokens() appfault.Result[int64] {
    // Delete tokens that are expired AND have no refresh token
    result := db.Where("expires_at < ? AND refresh_token_enc = ''", time.Now()).
        Delete(&OAuthToken{})

    if result.Error != nil {
        return appfault.Fail[int64](appfault.Wrap(result.Error, 7107, "delete expired tokens"))
    }

    return appfault.Ok(result.RowsAffected)
}
```

---

## Database Initialization

```go
package database

import (
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
    "gorm.io/gorm/logger"
)

type DB struct {
    *gorm.DB
}

func NewDatabase(dbPath string) appfault.Result[*DB] {
    db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
        Logger: logger.Default.LogMode(logger.Info),
    })
    if err != nil {
        return appfault.Fail[*DB](appfault.Wrap(err, 7101, "open database"))
    }
    
    // Enable foreign keys
    db.Exec("PRAGMA foreign_keys = ON")
    
    // Run migrations
    err = db.AutoMigrate(
        &SearchRequest{},
        &SearchResult{},
        &PageContent{},
        &NestedSearch{},
        &CacheEntry{},
        &RagMemory{},
        &OAuthToken{},  // Added for Phase 3
    )
    if err != nil {
        return appfault.Fail[*DB](appfault.Wrap(err, 7102, "auto migrate"))
    }
    
    return appfault.Ok(&DB{db})
}
```

---

## Common Queries

### Create Search Request

```go
func (db *DB) CreateSearchRequest(keywords, engine, method string) appfault.Result[SearchRequest] {
    request := SearchRequest{
        Keywords:  keywords,
        Engine:    engine,
        Method:    method,
        Status:    StatusPending,
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }
    
    result := db.Create(&request)
    if result.Error != nil {
        return appfault.Fail[SearchRequest](appfault.Wrap(result.Error, 7103, "create search request"))
    }
    return appfault.Ok(request)
}
```

### Update Status

```go
// SearchStatusUpdate is a typed GORM update struct
type SearchStatusUpdate struct {
    Status      SearchStatus `gorm:"column:Status"`
    ResultCount int          `gorm:"column:ResultCount"`
    UpdatedAt   time.Time    `gorm:"column:UpdatedAt"`
    CompletedAt time.Time    `gorm:"column:CompletedAt;default:null"`
}

func (db *DB) UpdateSearchStatus(id string, status SearchStatus, resultCount int) *appfault.AppError {
    update := SearchStatusUpdate{
        Status:      status,
        ResultCount: resultCount,
        UpdatedAt:   time.Now(),
    }
    
    if status == StatusCompleted || status == StatusFailed {
        update.CompletedAt = time.Now()
    }
    
    err := db.Model(&SearchRequest{}).Where("id = ?", id).Updates(update).Error

    if err != nil {
        return appfault.Wrap(err, 7108, "update search status")
    }

    return nil
}
```

### Get Results with Page Content

```go
func (db *DB) GetResultsWithContent(searchId string) SearchResultSlice {
    var results []SearchResult
    err := db.Preload("PageContent").
        Where("search_request_id = ?", searchId).
        Order("position ASC").
        Find(&results).Error

    if err != nil {
        return appfault.Fail[[]SearchResult](appfault.Wrap(err, 7109, "get results with content"))
    }

    return appfault.Ok(results)
}
```

### Check Cache

```go
func (db *DB) CheckCache(keywords, engine string) appfault.Result[CacheEntry] {
    hash := generateKeywordHash(keywords, engine)
    
    var entry CacheEntry
    err := db.Where("keyword_hash = ? AND is_valid = ?", hash, true).
        First(&entry).Error
    
    if err != nil {
        return appfault.Fail[CacheEntry](appfault.Wrap(err, 7104, "check cache"))
    }
    
    if entry.IsExpired() {
        // Invalidate expired cache
        db.Model(&entry).Update("is_valid", false)
        return appfault.Fail[CacheEntry](appfault.New(7105, "cache entry expired"))
    }
    
    return appfault.Ok(entry)
}
```

### Get Nested Search Tree

```go
func (db *DB) GetNestedSearchTree(rootId string, maxDepth int) NestedSearchSlice {
    var nested []NestedSearch
    err := db.Where("parent_search_id = ? AND depth <= ?", rootId, maxDepth).
        Preload("ChildSearch").
        Find(&nested).Error
    return nested, err
}
```

---

## Indexes

```go
// Additional indexes for performance
func (db *DB) CreateIndexes() error {
    // Composite index for cache lookups
    db.Exec("CREATE INDEX IF NOT EXISTS IdxCacheLookup ON cache_entries(keyword_hash, is_valid)")
    
    // Index for status queries
    db.Exec("CREATE INDEX IF NOT EXISTS IdxSearchStatus ON search_requests(status)")
    
    // Index for nested search depth queries
    db.Exec("CREATE INDEX IF NOT EXISTS IdxNestedDepth ON nested_searches(parent_search_id, depth)")
    
    // Index for OAuth token provider lookups
    db.Exec("CREATE INDEX IF NOT EXISTS IdxOauthProvider ON oauth_tokens(provider)")
    
    // Index for expired token cleanup
    db.Exec("CREATE INDEX IF NOT EXISTS IdxOauthExpiry ON oauth_tokens(expires_at)")
    
    return nil
}
```

---

## Data Integrity

### Cascade Behaviors

| Parent | Child | OnDelete |
|--------|-------|----------|
| SearchRequest | SearchResult | CASCADE |
| SearchRequest | NestedSearch | CASCADE |
| SearchRequest | RagMemory | SET NULL |
| SearchResult | PageContent | CASCADE |

### Constraints

- `SearchResult.SearchRequestId` — NOT NULL, FK to SearchRequest
- `CacheEntry.KeywordHash` — UNIQUE, NOT NULL
- `PageContent.SearchResultId` — UNIQUE (one-to-one)
- `OAuthToken.Provider` — NOT NULL, indexed

---

## Security Considerations

### Token Storage Security

| Aspect | Implementation |
|--------|----------------|
| **Algorithm** | AES-256-GCM (authenticated encryption) |
| **Key Storage** | Environment variable `GSEARCH_TOKEN_KEY` |
| **Key Format** | 64 hex characters (32 bytes) |
| **Nonce** | Random 12-byte nonce per encryption |
| **Output** | Base64-encoded (nonce + ciphertext + auth tag) |

### Key Management Best Practices

1. **Key Generation**: Use `crypto.GenerateKey()` to create secure keys
2. **Key Storage**: Store in environment, not in config files
3. **Key Rotation**: Use `crypto.RotateKey()` to re-encrypt all tokens
4. **Access Control**: Restrict access to the encryption key

### Environment Setup

```bash
# Generate a new encryption key
GSEARCH_TOKEN_KEY=$(openssl rand -hex 32)
export GSEARCH_TOKEN_KEY

# Or use the built-in generator
gsearch config generate-key
```

---

## Related Specs

- [Configuration](./02-configuration.md) — Database path settings
- [RAG Export](./11-rag-export.md) — RagMemory generation
- [Google API](./05-google-api.md) — OAuth token usage
- [Error Codes](./15-error-codes.md) — Encryption error codes (12xxx)
- [Remediation Plan](./14-remediation-plan.md) — Phase 3 implementation

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-28 | Initial schema with core entities |
| 1.1.0 | 2026-01-28 | Added OAuthToken model with AES-256-GCM encryption |
