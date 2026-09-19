---
name: Backend Go
description: Go backend coding standards and best practices
isDefault: true
version: 1
---

**Version:** 1.0.0  
**Last Updated:** 2026-03-20


You are an AI assistant that generates Go backend coding guidelines. These guidelines ensure consistency, maintainability, and idiomatic Go code.

## Go Philosophy

- Simplicity over cleverness
- Explicit over implicit
- Composition over inheritance
- Errors are values

---

## Project Structure

```
project/
├── cmd/                    # Entry points
│   ├── server/
│   │   └── main.go
│   └── migrate/
│       └── main.go
├── internal/               # Private packages
│   ├── api/               # HTTP handlers
│   │   ├── handlers/
│   │   ├── middleware/
│   │   └── router.go
│   ├── service/           # Business logic
│   ├── repository/        # Data access
│   ├── model/             # Domain models
│   └── config/            # Configuration
├── pkg/                    # Public packages (if any)
├── migrations/            # Database migrations
├── config/                # Config files
├── scripts/               # Build/deploy scripts
├── go.mod
└── go.sum
```

---

## Naming Conventions

### General Rules
- `PascalCase` for exported (public) identifiers
- `camelCase` for unexported (private) identifiers
- Acronyms treated as words: `Rag`, `Cli`, `Api`, `Http` (NOT all-caps)
- Interface names: often end in `-er`: `Reader`, `Writer`, `Stringer`

### 🔴 PascalCase Mandate (ALL Transport & Storage)
All JSON keys, YAML tags, database column names, API request/response fields, WebSocket message types, and configuration keys **MUST** use PascalCase. No exceptions.

```go
// ❌ WRONG — snake_case/camelCase keys
json:"user_id"     // snake_case
json:"userId"      // camelCase
json:"finish_reason"

// ❌ ALSO WRONG — redundant explicit PascalCase tags (Go uses field name by default)
json:"UserId"
json:"FinishReason"

// ✅ CORRECT — omit tag entirely, Go serializes PascalCase automatically
type User struct {
    UserId       string
    FinishReason string
}
```

**Exception:** Prometheus metric names remain snake_case per Prometheus convention (`requests_total`, `latency_seconds`).

### 🔴 Implicit JSON Serialization
Go struct fields serialize to PascalCase by default. **Omit explicit JSON tags** unless the field name differs from the desired key or `omitempty` is needed.

```go
// ✅ CORRECT — implicit PascalCase serialization
type User struct {
    Id        string
    SessionId string
    CreatedAt time.Time
}
// Serializes to: {"Id":"...","SessionId":"...","CreatedAt":"..."}

// ✅ CORRECT — explicit tag only when needed
type Response struct {
    Data      string `json:",omitempty"`
    ErrorCode string `json:",omitempty"`
}
```

### Specific Patterns
```go
// Package names: lowercase, single word
package user

// Types: noun, describes what it is
type User struct {}
type UserService struct {}
type UserRepository interface {}

// Functions: verb, describes action
func CreateUser() {}
func (s *UserService) FindByEmail() {}

// Variables: short but descriptive
var userCount int
var u *User  // OK in small scope

// Constants: describe the value
const MaxRetries = 3
const DefaultTimeout = 30 * time.Second
```

---

## Error Handling

### Always Check Errors
```go
// Good
result, err := doSomething()
if err != nil {
    return appfault.Wrap(
        err,
        ErrOperationFailed,
        "do something",
    )
}

// Bad - ignoring errors
result, _ := doSomething()
```

### Error Wrapping
```go
// Wrap with context
if err != nil {
    return appfault.Wrap(
        err,
        ErrUserCreateFailed,
        "creating user",
    ).WithContext("email", email)
}

// Check wrapped errors
if errors.Is(err, ErrNotFound) {
    // Handle not found
}

// Type assertion for custom errors
var validationErr *ValidationError
if errors.As(err, &validationErr) {
    // Handle validation error
}
```

### Custom Errors
```go
// Define package-level errors
var (
    ErrNotFound     = errors.New("not found")
    ErrUnauthorized = errors.New("unauthorized")
)

// Custom error types for complex cases
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation failed for %s: %s", e.Field, e.Message)
}
```

---

## GORM Guidelines

### Model Definition
```go
type User struct {
    ID        string    `gorm:"primaryKey;type:text"`
    Email     string    `gorm:"not null;uniqueIndex"`
    Name      string    `gorm:"not null"`
    CreatedAt time.Time
    UpdatedAt time.Time
    DeletedAt gorm.DeletedAt `gorm:"index"`
    
    // Relationships
    Posts []Post `gorm:"foreignKey:UserId;constraint:OnDelete:CASCADE"`
}

func (User) TableName() string {
    return "users"
}
```

### Repository Pattern
```go
import stdctx "context"

type UserRepository interface {
    Create(context stdctx.Context, user *User) *appfault.AppError
    FindById(context stdctx.Context, id string) appfault.Result[User]
    FindByEmail(context stdctx.Context, email string) appfault.Result[User]
    Update(context stdctx.Context, user *User) *appfault.AppError
    Delete(context stdctx.Context, id string) *appfault.AppError
}

type userRepository struct {
    db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
    return &userRepository{db: db}
}

func (r *userRepository) FindById(context stdctx.Context, id string) appfault.Result[User] {
    var user User
    if err := r.db.WithContext(context).First(&user, "id = ?", id).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, ErrNotFound
        }
        return nil, appfault.Wrap(
            err,
            ErrDatabaseQuery,
            "finding user by id",
        )
    }
    return &user, nil
}
```

### Transaction Handling
```go
func (s *UserService) CreateWithProfile(context stdctx.Context, user *User, profile *Profile) error {
    return s.db.WithContext(context).Transaction(func(tx *gorm.DB) error {
        if err := tx.Create(user).Error; err != nil {
            return appfault.Wrap(
                err,
                ErrUserCreateFailed,
                "creating user",
            )
        }
        
        profile.UserId = user.Id
        if err := tx.Create(profile).Error; err != nil {
            return appfault.Wrap(
                err,
                ErrProfileCreateFailed,
                "creating profile",
            )
        }
        
        return nil
    })
}
```

---

## HTTP Handlers

### Handler Structure
```go
type UserHandler struct {
    service UserService
    logger  *slog.Logger
}

func NewUserHandler(service UserService, logger *slog.Logger) *UserHandler {
    return &UserHandler{
        service: service,
        logger:  logger,
    }
}

func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
    context := r.Context()
    
    var req CreateUserRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        h.respondError(w, http.StatusBadRequest, "invalid request body")
        return
    }
    
    if err := req.Validate(); err != nil {
        h.respondError(w, http.StatusBadRequest, err.Error())
        return
    }
    
    user, err := h.service.Create(context, req.ToUser())
    if err != nil {
        h.logger.Error("creating user", "error", err)
        h.respondError(w, http.StatusInternalServerError, "internal error")
        return
    }
    
    h.respondJson(w, http.StatusCreated, user)
}
```

### Response Helpers
```go
// Use generics for type-safe API responses — NEVER use interface{}
type ApiResponse[T any] struct {
    Success bool
    Data    T      `json:",omitempty"`
    Error   string `json:",omitempty"`
}

func respondJson[T any](w http.ResponseWriter, status int, data T) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(APIResponse[T]{
        Success: true,
        Data:    data,
    })
}

func respondError(w http.ResponseWriter, status int, message string) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(APIResponse[struct{}]{
        Success: false,
        Error:   message,
    })
}
```

---

## Testing

### Table-Driven Tests
```go
func TestUserService_Create(t *testing.T) {
    tests := []struct {
        name    string
        input   CreateUserInput
        wantErr bool
        errType error
    }{
        {
            name:    "valid user",
            input:   CreateUserInput{Email: "test@example.com", Name: "Test"},
            wantErr: false,
        },
        {
            name:    "duplicate email",
            input:   CreateUserInput{Email: "existing@example.com", Name: "Test"},
            wantErr: true,
            errType: ErrDuplicateEmail,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Setup
            svc := setupTestService(t)
            
            // Execute
            _, err := svc.Create(context.Background(), tt.input)
            
            // Assert
            if tt.wantErr {
                require.Error(t, err)
                if tt.errType != nil {
                    assert.ErrorIs(t, err, tt.errType)
                }
            } else {
                require.NoError(t, err)
            }
        })
    }
}
```

### Mocking
```go
// Use interfaces for dependencies
type UserService struct {
    repo   UserRepository  // interface
    mailer Mailer          // interface
}

// In tests, use mock implementations
type mockUserRepository struct {
    users map[string]*User
}

func (m *mockUserRepository) FindById(context stdctx.Context, id string) appfault.Result[User] {
    if user, ok := m.users[id]; ok {
        return user, nil
    }
    return nil, ErrNotFound
}
```

---

## 🔴 STRICT TYPE-SAFETY RULES

### Absolute Prohibition: `interface{}`, `any` as value types

The use of `interface{}` (or its alias `any`) as a **value type** is **strictly forbidden** across the entire codebase. This includes function parameters, return values, struct fields, map values, and type assertions.

```go
// ❌ FORBIDDEN — empty interface as value
func Process(data interface{}) error { ... }
func GetSetting(key string) (interface{}, error) { ... } // ❌ FORBIDDEN
type Event struct {
    Payload interface{}
}
var metadata map[string]interface{}

// ✅ CORRECT — concrete types
func Process(data ProcessInput) error { ... }
func GetSetting(key string) appfault.Result[SettingValue] { ... }
type Event struct {
    Payload EventPayload
}
var metadata map[string]string

// ✅ CORRECT — generics when polymorphism is needed
func GetTyped[T SettingConstraint](key string) appfault.Result[T] { ... }
type Result[T any] struct {
    Data  T
    Error string
}
```

### Allowed Uses of `any` (ONLY as generic constraint)

```go
// ✅ OK — `any` as a generic type constraint
func Map[T any, U any](items []T, fn func(T) U) []U { ... }
type Response[T any] struct { Data T }

// ❌ FORBIDDEN — `any` as a value type
func Process(data any) error { ... }
var x any = "hello"
```

### Replacement Patterns

| Forbidden Pattern | Replacement |
|---|---|
| `interface{}` / `any` parameter | Concrete struct type |
| `map[string]interface{}` | Typed struct or `map[string]string` |
| `[]interface{}` | `[]ConcreteType` |
| `interface{}` return | Union struct with typed fields |
| Type switch on `interface{}` | Discriminated union or visitor pattern |

---

## Best Practices

### Context Usage
```go
// Always accept context as first parameter
func (s *Service) DoWork(context stdctx.Context, input Input) error {
    // Use context for cancellation and deadlines
    select {
    case <-context.Done():
        return context.Err()
    default:
    }
    
    // Pass context to downstream calls
    return s.repo.Save(context, input)
}
```

### Logging
```go
// Use structured logging (slog)
logger := slog.New(slog.NewJsonHandler(os.Stdout, nil))

logger.Info("user created",
    "UserId", user.ID,
    "Email", user.Email,
)

logger.Error("failed to create user",
    "Error", err,
    "Email", input.Email,
)
```

### Configuration
```go
type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
}

type ServerConfig struct {
    Port         int           `env:"SERVER_PORT" envDefault:"8080"`
    ReadTimeout  time.Duration `env:"SERVER_READ_TIMEOUT" envDefault:"30s"`
    WriteTimeout time.Duration `env:"SERVER_WRITE_TIMEOUT" envDefault:"30s"`
}

// Load with env-based library or manual parsing
```
