# Authentication Specification

> **Version:** 2.0.0  
> **Last Updated:** 2026-03-09  
> **Status:** Complete  

---

## 7.1 Overview

This document specifies the authentication system for the Spec Management Software. It uses SQLite for user storage with secure password hashing and JWT-based session management.

**Key Features:**
- SQLite-based user management
- Argon2id password hashing (primary) with bcrypt fallback
- Cryptographically secure salt generation
- JWT access tokens with refresh token rotation
- Session management with device tracking
- Rate limiting for brute-force protection

**Cross-References:**
- [Database Schema: User Table](../../07-database-design/01-schema.md#user-table)
- [API Endpoints: Auth Routes](../24-code-generation-system/13-api-endpoints.md#auth-endpoints)
- [General Spec: Security Patterns](../../../01-spec-authoring-guide/04-advanced/01-security-patterns-advanced.md)

---

## 7.2 Password Security

### 7.2.1 Hashing Algorithm Selection

| Algorithm | Use Case | Parameters |
|-----------|----------|------------|
| **Argon2id** (Primary) | All new passwords | Memory: 64MB, Iterations: 3, Parallelism: 4 |
| **bcrypt** (Fallback) | Legacy migration | Cost factor: 12 |

**Why Argon2id:**
- Winner of the Password Hashing Competition (PHC)
- Memory-hard: Resistant to GPU/ASIC attacks
- Configurable time/memory trade-offs
- Recommended by OWASP for new applications

### 7.2.2 Password Hashing Implementation

```go
package auth

import (
    "crypto/rand"
    "crypto/subtle"
    "encoding/base64"
    "fmt"
    "strings"
    
    "golang.org/x/crypto/argon2"
    "golang.org/x/crypto/bcrypt"
)

// Argon2 parameters (OWASP recommended)
const (
    Argon2Memory     = 64 * 1024  // 64 MB
    Argon2Iterations = 3
    Argon2Parallelism = 4
    Argon2SaltLength = 16
    Argon2KeyLength  = 32
)

// HashPassword creates an Argon2id hash of the password
func HashPassword(password string) apperror.Result[string] {
    // Generate cryptographically secure salt
    salt := make([]byte, Argon2SaltLength)
    if _, err := rand.Read(salt); err != nil {
        return "", apperror.Wrap(
            err,
            ERR_CRYPTO_FAILURE,
            "failed to generate salt",
        )
    }
    
    // Hash password with Argon2id
    hash := argon2.IDKey(
        []byte(password),
        salt,
        Argon2Iterations,
        Argon2Memory,
        Argon2Parallelism,
        Argon2KeyLength,
    )
    
    // Encode as PHC string format
    // $argon2id$v=19$m=65536,t=3,p=4$<salt>$<hash>
    b64Salt := base64.RawStdEncoding.EncodeToString(salt)
    b64Hash := base64.RawStdEncoding.EncodeToString(hash)
    
    encoded := fmt.Sprintf(
        "$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
        argon2.Version,
        Argon2Memory,
        Argon2Iterations,
        Argon2Parallelism,
        b64Salt,
        b64Hash,
    )
    
    return encoded, nil
}

// VerifyPassword checks if password matches the hash
func VerifyPassword(password, encodedHash string) apperror.Result[bool] {
    // Check if legacy bcrypt hash
    if strings.HasPrefix(encodedHash, "$2") {
        return verifyBcrypt(password, encodedHash)
    }
    
    // Parse Argon2 hash
    parts := strings.Split(encodedHash, "$")
    if len(parts) != 6 {
        return false, ErrInvalidHash
    }
    
    var version int
    var memory, iterations, parallelism uint32
    
    _, err := fmt.Sscanf(parts[2], "v=%d", &version)
    if err != nil {
        return false, ErrInvalidHash
    }
    
    _, err = fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &memory, &iterations, &parallelism)
    if err != nil {
        return false, ErrInvalidHash
    }
    
    salt, err := base64.RawStdEncoding.DecodeString(parts[4])
    if err != nil {
        return false, ErrInvalidHash
    }
    
    storedHash, err := base64.RawStdEncoding.DecodeString(parts[5])
    if err != nil {
        return false, ErrInvalidHash
    }
    
    // Compute hash with same parameters
    computedHash := argon2.IDKey(
        []byte(password),
        salt,
        iterations,
        memory,
        uint8(parallelism),
        uint32(len(storedHash)),
    )
    
    // Constant-time comparison to prevent timing attacks
    if subtle.ConstantTimeCompare(storedHash, computedHash) == 1 {
        return true, nil
    }
    
    return false, nil
}

// verifyBcrypt handles legacy bcrypt password verification
func verifyBcrypt(password, hash string) apperror.Result[bool] {
    err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
    if err == bcrypt.ErrMismatchedHashAndPassword {
        return false, nil
    }
    if err != nil {
        return false, err
    }
    return true, nil
}
```

### 7.2.3 Salt Generation

Salts are generated using `crypto/rand` which provides cryptographically secure random bytes from the operating system.

```go
// GenerateSalt creates a cryptographically secure random salt
func GenerateSalt(length int) apperror.Result[[]byte] {
    salt := make([]byte, length)
    _, err := rand.Read(salt)
    if err != nil {
        return nil, NewError(ERR_CRYPTO_FAILURE, "salt generation failed")
    }
    return salt, nil
}
```

**Salt Properties:**
- Minimum 16 bytes (128 bits)
- Unique per password (never reused)
- Stored alongside the hash in PHC format
- Not secret, but must be unpredictable

### 7.2.4 Password Requirements

| Requirement | Rule | Error Code |
|-------------|------|------------|
| Minimum length | 8 characters | ERR_PASSWORD_TOO_SHORT (2010) |
| Maximum length | 128 characters | ERR_PASSWORD_TOO_LONG (2011) |
| Complexity | At least 1 uppercase, 1 lowercase, 1 digit | ERR_PASSWORD_WEAK (2012) |
| Common passwords | Not in top 10,000 list | ERR_PASSWORD_COMMON (2013) |
| User similarity | Not similar to username/email | ERR_PASSWORD_SIMILAR (2014) |

```go
func ValidatePassword(password, username, email string) error {
    if len(password) < 8 {
        return NewError(ERR_PASSWORD_TOO_SHORT, "Password must be at least 8 characters")
    }
    
    if len(password) > 128 {
        return NewError(ERR_PASSWORD_TOO_LONG, "Password must not exceed 128 characters")
    }
    
    if !hasComplexity(password) {
        return NewError(ERR_PASSWORD_WEAK, "Password must contain uppercase, lowercase, and digit")
    }
    
    if isCommonPassword(password) {
        return NewError(ERR_PASSWORD_COMMON, "Password is too common")
    }
    
    if isSimilar(password, username) || isSimilar(password, email) {
        return NewError(ERR_PASSWORD_SIMILAR, "Password too similar to username or email")
    }
    
    return nil
}
```

---

## 7.3 User Registration

### 7.3.1 Registration Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  Validate   │────▶│ Hash Pass   │────▶│ Create User │
│   Request   │     │   Input     │     │  (Argon2)   │     │  in SQLite  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                                       │
                           ▼                                       ▼
                    ┌─────────────┐                         ┌─────────────┐
                    │  Return     │◀────────────────────────│  Generate   │
                    │  JWT Tokens │                         │   Tokens    │
                    └─────────────┘                         └─────────────┘
```

### 7.3.2 Registration Endpoint

**Endpoint:** `POST /api/v1/auth/register`

**Request:**
```json
{
    "Username": "johndoe",
    "Email": "john@example.com",
    "Password": "SecureP@ss123",
    "DisplayName": "John Doe"
}
```

**Validation:**
| Field | Rules |
|-------|-------|
| username | 3-30 chars, alphanumeric + underscore, unique |
| email | Valid email format, unique |
| password | See password requirements (7.2.4) |
| displayName | 1-100 chars, optional |

**Response (Success):**
```json
{
    "Success": true,
    "Data": {
        "User": {
            "Id": "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
            "Username": "johndoe",
            "Email": "john@example.com",
            "DisplayName": "John Doe",
            "CreatedAt": "2026-01-27T10:00:00Z"
        },
        "Tokens": {
            "AccessToken": "eyJhbGciOiJIUzI1NiIs...",
            "RefreshToken": "dGhpcyBpcyBhIHJlZnJl...",
            "ExpiresIn": 900,
            "TokenType": "Bearer"
        }
    },
    "Error": null,
    "Meta": {
        "RequestId": "req_abc123",
        "Timestamp": "2026-01-27T10:00:00Z",
        "Version": "1.0.0"
    }
}
```

### 7.3.3 Registration Service

```go
type RegisterRequest struct {
    Username    string `validate:"required,min=3,max=30,alphanum_underscore"`
    Email       string `validate:"required,email"`
    Password    string `validate:"required,min=8,max=128"`
    DisplayName string `validate:"max=100"`
}

func (s *AuthService) Register(context stdctx.Context, req RegisterRequest) apperror.Result[*AuthResponse] {
    // 1. Validate input
    if err := s.validator.Struct(req); err != nil {
        return apperror.Fail[*AuthResponse](
            apperror.New(
                ERR_VALIDATION,
                err.Error(),
            ),
        )
    }
    
    // 2. Validate password strength
    if err := ValidatePassword(req.Password, req.Username, req.Email); err != nil {
        return apperror.Fail[*AuthResponse](err)
    }
    
    // 3. Check username uniqueness
    if s.userExists(context, "username", req.Username) {
        return apperror.Fail[*AuthResponse](
            apperror.New(
                ERR_USERNAME_TAKEN,
                "Username already in use",
            ),
        )
    }
    
    // 4. Check email uniqueness
    if s.userExists(context, "email", req.Email) {
        return apperror.Fail[*AuthResponse](
            apperror.New(
                ERR_EMAIL_TAKEN,
                "Email already registered",
            ),
        )
    }
    
    // 5. Hash password
    passwordHash, err := HashPassword(req.Password)
    if err != nil {
        return apperror.Fail[*AuthResponse](
            apperror.New(
                ERR_CRYPTO_FAILURE,
                "Failed to hash password",
            ),
        )
    }
    
    // 6. Create user record
    user := &User{
        Id:           uuid.New().String(),
        Username:     req.Username,
        Email:        strings.ToLower(req.Email),
        PasswordHash: passwordHash,
        DisplayName:  req.DisplayName,
        IsActive:     true,
        CreatedAt:    time.Now(),
        UpdatedAt:    time.Now(),
    }
    
    if err := s.db.InsertUser(context, user); err != nil {
        return apperror.Fail[*AuthResponse](
            apperror.New(
                ERR_DATABASE,
                "Failed to create user",
            ),
        )
    }
    
    // 7. Generate tokens
    tokensResult := s.generateTokens(user)
    if tokensResult.IsFailure() {
        return apperror.Fail[*AuthResponse](tokensResult.Error())
    }
    tokens := tokensResult.Value()
    
    // 8. Create session
    if err := s.createSession(context, user.Id, tokens.RefreshToken, req); err != nil {
        return apperror.Fail[*AuthResponse](err)
    }
    
    return apperror.OK(&AuthResponse{
        User:   user.ToPublic(),
        Tokens: tokens,
    })
}
```

---

## 7.4 Login Flow

### 7.4.1 Login Endpoint

**Endpoint:** `POST /api/v1/auth/login`

**Request:**
```json
{
    "Identifier": "johndoe",
    "Password": "SecureP@ss123",
    "DeviceInfo": {
        "UserAgent": "Mozilla/5.0...",
        "Platform": "web"
    }
}
```

**Notes:**
- `identifier` can be username OR email
- `deviceInfo` is optional but recommended for session tracking

### 7.4.2 Login Service

```go
func (s *AuthService) Login(context stdctx.Context, req LoginRequest) apperror.Result[*AuthResponse] {
    // 1. Find user by username or email
    userResult := s.findUserByIdentifier(context, req.Identifier)
    if userResult.IsFailure() {
        // Use same error for not found to prevent enumeration
        return apperror.Fail[*AuthResponse](
            apperror.New(
                ERR_INVALID_CREDENTIALS,
                "Invalid username/email or password",
            ),
        )
    }
    user := userResult.Value()
    
    // 2. Check if account is locked
    if s.isAccountLocked(context, user.Id) {
        return apperror.Fail[*AuthResponse](
            apperror.New(
                ERR_ACCOUNT_LOCKED,
                "Account temporarily locked due to failed attempts",
            ),
        )
    }
    
    // 3. Verify password
    valid, err := VerifyPassword(req.Password, user.PasswordHash)
    if err != nil {
        return apperror.Fail[*AuthResponse](
            apperror.New(
                ERR_INTERNAL,
                "Password verification failed",
            ),
        )
    }
    
    if !valid {
        // Record failed attempt
        s.recordFailedAttempt(context, user.Id)
        return apperror.Fail[*AuthResponse](
            apperror.New(
                ERR_INVALID_CREDENTIALS,
                "Invalid username/email or password",
            ),
        )
    }
    
    // 4. Check if password needs rehashing (legacy bcrypt)
    if needsRehash(user.PasswordHash) {
        newHash, _ := HashPassword(req.Password)
        s.updatePasswordHash(context, user.Id, newHash)
    }
    
    // 5. Check if account is active
    if !user.IsActive {
        return apperror.Fail[*AuthResponse](
            apperror.New(
                ERR_ACCOUNT_DISABLED,
                "Account is disabled",
            ),
        )
    }
    
    // 6. Clear failed attempts
    s.clearFailedAttempts(context, user.Id)
    
    // 7. Generate tokens
    tokensResult := s.generateTokens(user)
    if tokensResult.IsFailure() {
        return apperror.Fail[*AuthResponse](tokensResult.Error())
    }
    tokens := tokensResult.Value()
    
    // 8. Create session
    if err := s.createSession(context, user.Id, tokens.RefreshToken, req.DeviceInfo); err != nil {
        return apperror.Fail[*AuthResponse](err)
    }
    
    // 9. Update last login
    s.updateLastLogin(context, user.Id)
    
    return apperror.OK(&AuthResponse{
        User:   user.ToPublic(),
        Tokens: tokens,
    })
}
```

### 7.4.3 Brute Force Protection

| Threshold | Action |
|-----------|--------|
| 3 failed attempts | 30 second delay |
| 5 failed attempts | 5 minute lockout |
| 10 failed attempts | 30 minute lockout |
| 20 failed attempts | Account locked (manual unlock) |

```go
type LoginAttempt struct {
    UserId      string
    AttemptedAt time.Time
    IPAddress   string
    Success     bool
}

func (s *AuthService) isAccountLocked(context stdctx.Context, userId string) bool {
    attempts, _ := s.getRecentFailedAttempts(context, userId, time.Hour)
    
    if len(attempts) >= 20 {
        return true  // Permanent lock
    }
    
    if len(attempts) >= 10 {
        lastAttempt := attempts[0].AttemptedAt
        if time.Since(lastAttempt) < 30*time.Minute {
            return true
        }
    }
    
    if len(attempts) >= 5 {
        lastAttempt := attempts[0].AttemptedAt
        if time.Since(lastAttempt) < 5*time.Minute {
            return true
        }
    }
    
    return false
}
```

---

## 7.5 JWT Token Management

### 7.5.1 Token Structure

**Access Token (Short-lived):**
```json
{
    "header": {
        "alg": "HS256",
        "typ": "JWT"
    },
    "payload": {
        "sub": "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
        "username": "johndoe",
        "email": "john@example.com",
        "role": "user",
        "iat": 1706349600,
        "exp": 1706350500,
        "jti": "jwt_abc123"
    }
}
```

**Refresh Token (Long-lived):**
```json
{
    "payload": {
        "sub": "u1a2b3c4-d5e6-7890-abcd-ef1234567890",
        "sid": "ses_xyz789",
        "iat": 1706349600,
        "exp": 1707559200,
        "jti": "ref_def456"
    }
}
```

### 7.5.2 Token Configuration

| Token Type | Expiration | Storage | Rotation |
|------------|------------|---------|----------|
| Access Token | 15 minutes | Memory/Cookie | On refresh |
| Refresh Token | 14 days | HttpOnly Cookie | On use (rotation) |

### 7.5.3 Token Generation

```go
type TokenService struct {
    secretKey     []byte
    accessExpiry  time.Duration
    refreshExpiry time.Duration
}

func NewTokenService(config *Config) *TokenService {
    return &TokenService{
        secretKey:     []byte(config.JWTSecret),
        accessExpiry:  15 * time.Minute,
        refreshExpiry: 14 * 24 * time.Hour,
    }
}

func (s *TokenService) GenerateTokens(user *User, sessionId string) apperror.Result[*TokenPair] {
    now := time.Now()
    
    // Access token
    accessClaims := jwt.MapClaims{
        "sub":      user.Id,
        "username": user.Username,
        "email":    user.Email,
        "role":     user.Role,
        "iat":      now.Unix(),
        "exp":      now.Add(s.accessExpiry).Unix(),
        "jti":      "jwt_" + generateId(12),
    }
    
    accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
    accessString, err := accessToken.SignedString(s.secretKey)
    if err != nil {
        return apperror.Fail[*TokenPair](
            apperror.New(
                ERR_TOKEN_GENERATION,
                "Failed to generate access token",
            ),
        )
    }
    
    // Refresh token
    refreshClaims := jwt.MapClaims{
        "sub": user.Id,
        "sid": sessionId,
        "iat": now.Unix(),
        "exp": now.Add(s.refreshExpiry).Unix(),
        "jti": "ref_" + generateId(12),
    }
    
    refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
    refreshString, err := refreshToken.SignedString(s.secretKey)
    if err != nil {
        return apperror.Fail[*TokenPair](
            apperror.New(
                ERR_TOKEN_GENERATION,
                "Failed to generate refresh token",
            ),
        )
    }
    
    return apperror.OK(&TokenPair{
        AccessToken:  accessString,
        RefreshToken: refreshString,
        ExpiresIn:    int(s.accessExpiry.Seconds()),
        TokenType:    "Bearer",
    })
}
```

### 7.5.4 Token Validation

```go
func (s *TokenService) ValidateAccessToken(tokenString string) apperror.Result[*Claims] {
    token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, ErrInvalidSigningMethod
        }
        return s.secretKey, nil
    })
    
    if err != nil {
        if errors.Is(err, jwt.ErrTokenExpired) {
            return apperror.Fail[*Claims](
                apperror.New(
                    ERR_TOKEN_EXPIRED,
                    "Access token expired",
                ),
            )
        }
        return apperror.Fail[*Claims](
            apperror.New(
                ERR_TOKEN_INVALID,
                "Invalid access token",
            ),
        )
    }
    
    claims, ok := token.Claims.(jwt.MapClaims)
    if !ok || !token.Valid {
        return apperror.Fail[*Claims](
            apperror.New(
                ERR_TOKEN_INVALID,
                "Invalid token claims",
            ),
        )
    }
    
    // Extract typed claims via helper (no bare casts in business logic)
    parsedResult := extractClaims(claims)
    if parsedResult.IsFailure() {
        return apperror.Fail[*Claims](
            apperror.New(
                ERR_TOKEN_INVALID,
                parsedResult.Error().Error(),
            ),
        )
    }
    parsed := parsedResult.Value()
    
    // Check if token is revoked
    if s.isTokenRevoked(parsed.JTI) {
        return apperror.Fail[*Claims](
            apperror.New(
                ERR_TOKEN_REVOKED,
                "Token has been revoked",
            ),
        )
    }
    
    return apperror.OK(parsed)
}

// EXEMPTED: typed accessor internal — centralized JWT claim extraction (§7.2)
func extractClaims(claims jwt.MapClaims) apperror.Result[*Claims] {
    jti, _ := claims["jti"].(string)
    sub, _ := claims["sub"].(string)
    username, _ := claims["username"].(string)
    email, _ := claims["email"].(string)
    role, _ := claims["role"].(string)
    
    if sub == "" {
        return apperror.Fail[*Claims](
            apperror.New(
                ERR_TOKEN_INVALID,
                "missing required claim: sub",
            ),
        )
    }
    
    return apperror.OK(&Claims{
        JTI:      jti,
        UserId:   sub,
        Username: username,
        Email:    email,
        Role:     role,
    })
}
```

---

## 7.6 Session Management

### 7.6.1 Session Table Schema

```sql
CREATE TABLE Session (
    Id          TEXT PRIMARY KEY,
    UserId      TEXT NOT NULL REFERENCES User(Id) ON DELETE CASCADE,
    TokenHash   TEXT NOT NULL,
    DeviceInfo  TEXT,
    IpAddress   TEXT,
    UserAgent   TEXT,
    LastActiveAt TEXT NOT NULL,
    ExpiresAt   TEXT NOT NULL,
    CreatedAt   TEXT NOT NULL DEFAULT (datetime('now')),
    RevokedAt   TEXT
);

CREATE INDEX IdxSessionUser ON Session(UserId);
CREATE INDEX IdxSessionExpires ON Session(ExpiresAt);
```

### 7.6.2 Session Operations

```go
type Session struct {
    Id           string
    UserId       string
    TokenHash    string
    DeviceInfo   string
    IpAddress    string
    UserAgent    string
    LastActiveAt time.Time
    ExpiresAt    time.Time
    CreatedAt    time.Time
    RevokedAt    *time.Time
}

func (s *SessionService) Create(context stdctx.Context, userId string, refreshToken string, deviceInfo DeviceInfo) apperror.Result[*Session] {
    session := &Session{
        Id:           "ses_" + generateId(16),
        UserId:       userId,
        TokenHash:    hashToken(refreshToken),
        DeviceInfo:   deviceInfo.Platform,
        IpAddress:    deviceInfo.IpAddress,
        UserAgent:    deviceInfo.UserAgent,
        LastActiveAt: time.Now(),
        ExpiresAt:    time.Now().Add(14 * 24 * time.Hour),
        CreatedAt:    time.Now(),
    }
    
    if err := s.db.InsertSession(context, session); err != nil {
        return apperror.Fail[*Session](err)
    }
    
    return apperror.OK(session)
}

func (s *SessionService) Validate(context stdctx.Context, sessionId string, refreshToken string) apperror.Result[*Session] {
    session, err := s.db.GetSession(context, sessionId)
    if err != nil {
        return apperror.Fail[*Session](
            apperror.New(ERR_SESSION_NOT_FOUND, "Session not found"),
        )
    }
    
    if session.RevokedAt != nil {
        return apperror.Fail[*Session](
            apperror.New(ERR_SESSION_REVOKED, "Session has been revoked"),
        )
    }
    
    if time.Now().After(session.ExpiresAt) {
        return apperror.Fail[*Session](
            apperror.New(ERR_SESSION_EXPIRED, "Session has expired"),
        )
    }
    
    if !verifyTokenHash(refreshToken, session.TokenHash) {
        return apperror.Fail[*Session](
            apperror.New(ERR_TOKEN_INVALID, "Invalid refresh token"),
        )
    }
    
    return apperror.OK(session)
}

func (s *SessionService) Revoke(context stdctx.Context, sessionId string) error {
    // SessionRevokeUpdate is the typed GORM update (no map[string]interface{})
    type SessionRevokeUpdate struct {
        RevokedAt time.Time
    }
    return s.db.UpdateSession(context, sessionId, SessionRevokeUpdate{
        RevokedAt: time.Now(),
    })
}

func (s *SessionService) RevokeAllForUser(context stdctx.Context, userId string) error {
    return s.db.RevokeUserSessions(context, userId)
}
```

### 7.6.3 Token Refresh with Rotation

**Endpoint:** `POST /api/v1/auth/refresh`

```go
func (s *AuthService) RefreshTokens(context stdctx.Context, refreshToken string) apperror.Result[*TokenPair] {
    // 1. Parse refresh token
    claimsResult := s.tokens.ParseRefreshToken(refreshToken)
    if claimsResult.IsFailure() {
        return apperror.Fail[*TokenPair](claimsResult.Error())
    }
    claims := claimsResult.Value()
    
    // 2. Validate session
    sessionResult := s.sessions.Validate(context, claims.SessionId, refreshToken)
    if sessionResult.IsFailure() {
        return apperror.Fail[*TokenPair](sessionResult.Error())
    }
    session := sessionResult.Value()
    
    // 3. Get user
    user, err := s.db.GetUser(context, claims.UserId)
    if err != nil {
        return apperror.Fail[*TokenPair](
            apperror.New(
                ERR_USER_NOT_FOUND,
                "User not found",
            ),
        )
    }
    
    // 4. Check if user is still active
    if !user.IsActive {
        s.sessions.Revoke(context, session.Id)
        return apperror.Fail[*TokenPair](
            apperror.New(
                ERR_ACCOUNT_DISABLED,
                "Account is disabled",
            ),
        )
    }
    
    // 5. Generate new token pair (rotation)
    newTokensResult := s.tokens.GenerateTokens(user, session.Id)
    if newTokensResult.IsFailure() {
        return apperror.Fail[*TokenPair](newTokensResult.Error())
    }
    newTokens := newTokensResult.Value()
    
    // 6. Update session with new token hash
    s.sessions.UpdateTokenHash(context, session.Id, hashToken(newTokens.RefreshToken))
    
    // 7. Update last active time
    s.sessions.UpdateLastActive(context, session.Id)
    
    return apperror.OK(newTokens)
}
```

---

## 7.7 Logout

### 7.7.1 Logout Endpoint

**Endpoint:** `POST /api/v1/auth/logout`

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body (optional):**
```json
{
    "AllDevices": false
}
```

### 7.7.2 Logout Service

```go
func (s *AuthService) Logout(context stdctx.Context, userId string, sessionId string, allDevices bool) error {
    if allDevices {
        // Revoke all sessions for user
        return s.sessions.RevokeAllForUser(context, userId)
    }
    
    // Revoke current session only
    return s.sessions.Revoke(context, sessionId)
}
```

---

## 7.8 Password Reset

### 7.8.1 Request Reset

**Endpoint:** `POST /api/v1/auth/forgot-password`

```json
{
    "email": "john@example.com"
}
```

**Response:** Always returns success (prevents email enumeration)

### 7.8.2 Reset Token Generation

```go
type PasswordResetToken struct {
    Id        string
    UserId    string
    TokenHash string
    ExpiresAt time.Time
    UsedAt    *time.Time
    CreatedAt time.Time
}

func (s *AuthService) RequestPasswordReset(context stdctx.Context, email string) error {
    user, err := s.db.GetUserByEmail(context, email)
    if err != nil {
        // Don't reveal if email exists
        return nil
    }
    
    // Generate secure token
    token := generateSecureToken(32)
    
    // Store hashed token
    resetToken := &PasswordResetToken{
        Id:        "rst_" + generateId(16),
        UserId:    user.Id,
        TokenHash: hashToken(token),
        ExpiresAt: time.Now().Add(1 * time.Hour),
        CreatedAt: time.Now(),
    }
    
    if err := s.db.InsertResetToken(context, resetToken); err != nil {
        return err
    }
    
    // Send email (async)
    go s.email.SendPasswordReset(user.Email, token)
    
    return nil
}
```

### 7.8.3 Reset Password

**Endpoint:** `POST /api/v1/auth/reset-password`

```json
{
    "Token": "abc123...",
    "NewPassword": "NewSecureP@ss456"
}
```

```go
func (s *AuthService) ResetPassword(context stdctx.Context, token, newPassword string) error {
    // 1. Find valid reset token
    resetToken, err := s.db.FindValidResetToken(context, hashToken(token))
    if err != nil {
        return NewError(ERR_TOKEN_INVALID, "Invalid or expired reset token")
    }
    
    // 2. Check if already used
    if resetToken.UsedAt != nil {
        return NewError(ERR_TOKEN_USED, "Reset token already used")
    }
    
    // 3. Check expiration
    if time.Now().After(resetToken.ExpiresAt) {
        return NewError(ERR_TOKEN_EXPIRED, "Reset token expired")
    }
    
    // 4. Validate new password
    user, _ := s.db.GetUser(context, resetToken.UserId)
    if err := ValidatePassword(newPassword, user.Username, user.Email); err != nil {
        return err
    }
    
    // 5. Hash new password
    newHash, err := HashPassword(newPassword)
    if err != nil {
        return err
    }
    
    // 6. Update password
    if err := s.db.UpdateUserPassword(context, resetToken.UserId, newHash); err != nil {
        return err
    }
    
    // 7. Mark token as used
    s.db.MarkResetTokenUsed(context, resetToken.Id)
    
    // 8. Revoke all sessions (force re-login)
    s.sessions.RevokeAllForUser(context, resetToken.UserId)
    
    return nil
}
```

---

## 7.9 Error Codes

Authentication errors use the 2xxx range.

| Code | Constant | Description | HTTP Status |
|------|----------|-------------|-------------|
| 2001 | ERR_INVALID_CREDENTIALS | Wrong username/password | 401 |
| 2002 | ERR_TOKEN_EXPIRED | JWT token expired | 401 |
| 2003 | ERR_TOKEN_INVALID | JWT token malformed/invalid | 401 |
| 2004 | ERR_TOKEN_REVOKED | Token has been revoked | 401 |
| 2005 | ERR_SESSION_NOT_FOUND | Session does not exist | 401 |
| 2006 | ERR_SESSION_EXPIRED | Session has expired | 401 |
| 2007 | ERR_SESSION_REVOKED | Session was revoked | 401 |
| 2008 | ERR_ACCOUNT_LOCKED | Too many failed attempts | 423 |
| 2009 | ERR_ACCOUNT_DISABLED | Account is deactivated | 403 |
| 2010 | ERR_PASSWORD_TOO_SHORT | Password under 8 chars | 400 |
| 2011 | ERR_PASSWORD_TOO_LONG | Password over 128 chars | 400 |
| 2012 | ERR_PASSWORD_WEAK | Missing complexity | 400 |
| 2013 | ERR_PASSWORD_COMMON | In common passwords list | 400 |
| 2014 | ERR_PASSWORD_SIMILAR | Too similar to username | 400 |
| 2015 | ERR_USERNAME_TAKEN | Username already exists | 409 |
| 2016 | ERR_EMAIL_TAKEN | Email already registered | 409 |
| 2017 | ERR_TOKEN_GENERATION | Failed to create token | 500 |
| 2018 | ERR_CRYPTO_FAILURE | Cryptographic operation failed | 500 |
| 2019 | ERR_TOKEN_USED | Reset token already used | 400 |

---

## 7.10 Security Headers

All auth responses include these security headers:

```go
func SetSecurityHeaders(w http.ResponseWriter) {
    w.Header().Set("X-Content-Type-Options", "nosniff")
    w.Header().Set("X-Frame-Options", "DENY")
    w.Header().Set("X-XSS-Protection", "1; mode=block")
    w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate")
    w.Header().Set("Pragma", "no-cache")
}
```

---

## 7.11 Acceptance Criteria

- [ ] Passwords are hashed with Argon2id (64MB memory, 3 iterations)
- [ ] Salts are 16 bytes, cryptographically random, unique per password
- [ ] Legacy bcrypt passwords are automatically upgraded on login
- [ ] Password validation enforces length and complexity requirements
- [ ] JWT access tokens expire in 15 minutes
- [ ] Refresh tokens use rotation on each use
- [ ] Sessions are tracked per device with IP and user agent
- [ ] Failed login attempts trigger progressive lockouts
- [ ] Password reset tokens expire in 1 hour
- [ ] All sessions are revoked on password change
- [ ] Constant-time comparison prevents timing attacks
- [ ] Error messages don't reveal user existence

---

## Cross-References

- [Database Schema](../../07-database-design/01-schema.md) - User & Session Tables
- [General Spec: Security Patterns](../../../01-spec-authoring-guide/04-advanced/01-security-patterns-advanced.md)
- [General Spec: Error Management](../../../01-spec-authoring-guide/01-foundation/02-error-management-foundation.md)
