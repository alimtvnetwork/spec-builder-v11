# 29 - AI Provider Settings

> **Version:** 1.0.0  
> **Created:** 2026-01-31  
> **Status:** ✅ Complete  
> **Depends On:** `04-database-schema.md`, `66-shared-constants.md`

---

## 🎯 Purpose

Manage AI provider connections for Link Manager's AI-powered features (keyword suggestions, anchor text generation, content analysis). Supports multiple providers with seedable defaults, custom OAuth/API configurations, and user-customizable model names.

---

## 📋 Features

1. **Multi-Provider Support**: OpenAI, Gemini, Anthropic, Mistral, Groq, Ollama (local)
2. **Flexible Authentication**: Bearer Token, OAuth 2.0 Client Credentials, Custom Headers
3. **Seedable Configuration**: Default values from `config.json`, user-modifiable in SQLite
4. **Custom Providers**: Add unlimited custom AI endpoints
5. **Model Aliasing**: User-defined names for models
6. **Connection Testing**: Validate credentials before saving

---

## 🗄️ Database Schema

### Table: `AiProviders` (Main DB)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | INTEGER | PK AUTOINCREMENT | Unique identifier |
| `ProviderKey` | TEXT | NOT NULL UNIQUE | Provider slug (e.g., `openai`, `gemini`, `custom_1`) |
| `DisplayName` | TEXT | NOT NULL | User-facing name |
| `ProviderType` | TEXT | NOT NULL | Enum: `openai`, `gemini`, `anthropic`, `mistral`, `groq`, `ollama`, `custom` |
| `BaseUrl` | TEXT | NOT NULL | API base URL |
| `AuthType` | TEXT | NOT NULL | Enum: `bearer`, `oauth2_client`, `oauth2_code`, `api_key_header`, `custom_header` |
| `IsEnabled` | INTEGER | DEFAULT 0 | 0=disabled, 1=enabled |
| `IsSeeded` | INTEGER | DEFAULT 0 | 0=user-created, 1=seeded from config |
| `IsUserModified` | INTEGER | DEFAULT 0 | 0=pristine, 1=user changed |
| `SeedVersion` | TEXT | NULL | Version from config.json |
| `Priority` | INTEGER | DEFAULT 100 | Sort order (lower = higher priority) |
| `CreatedAt` | TEXT | NOT NULL | ISO 8601 timestamp |
| `UpdatedAt` | TEXT | NOT NULL | ISO 8601 timestamp |

### Table: `AiProviderCredentials` (Main DB)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | INTEGER | PK AUTOINCREMENT | Unique identifier |
| `ProviderId` | INTEGER | FK → AiProviders.Id | Parent provider |
| `CredentialKey` | TEXT | NOT NULL | Key name (e.g., `ApiKey`, `ClientId`, `AccessToken`) |
| `CredentialValue` | TEXT | NOT NULL | Encrypted value |
| `IsRequired` | INTEGER | DEFAULT 1 | 0=optional, 1=required |
| `FieldType` | TEXT | NOT NULL | Enum: `text`, `password`, `textarea`, `select` |
| `FieldLabel` | TEXT | NOT NULL | UI label |
| `FieldPlaceholder` | TEXT | NULL | Placeholder text |
| `FieldOrder` | INTEGER | DEFAULT 0 | Display order in form |
| `ValidationRegex` | TEXT | NULL | Optional validation pattern |
| `CreatedAt` | TEXT | NOT NULL | ISO 8601 timestamp |
| `UpdatedAt` | TEXT | NOT NULL | ISO 8601 timestamp |

**Unique Constraint:** `(ProviderId, CredentialKey)`

### Table: `AiModels` (Main DB)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | INTEGER | PK AUTOINCREMENT | Unique identifier |
| `ProviderId` | INTEGER | FK → AiProviders.Id | Parent provider |
| `ModelId` | TEXT | NOT NULL | Official model ID (e.g., `gpt-4o`, `gemini-2.0-flash`) |
| `DisplayName` | TEXT | NOT NULL | User-customizable name |
| `ModelCategory` | TEXT | NOT NULL | Enum: `chat`, `embedding`, `vision`, `code` |
| `IsDefault` | INTEGER | DEFAULT 0 | Default model for this provider |
| `IsEnabled` | INTEGER | DEFAULT 1 | 0=hidden, 1=available |
| `MaxTokens` | INTEGER | NULL | Context window size |
| `CostPer1kInput` | REAL | NULL | Cost tracking (optional) |
| `CostPer1kOutput` | REAL | NULL | Cost tracking (optional) |
| `CreatedAt` | TEXT | NOT NULL | ISO 8601 timestamp |
| `UpdatedAt` | TEXT | NOT NULL | ISO 8601 timestamp |

**Unique Constraint:** `(ProviderId, ModelId)`

### Table: `AiOAuthSessions` (Main DB)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `Id` | INTEGER | PK AUTOINCREMENT | Unique identifier |
| `ProviderId` | INTEGER | FK → AiProviders.Id | Parent provider |
| `AccessToken` | TEXT | NOT NULL | Encrypted access token |
| `RefreshToken` | TEXT | NULL | Encrypted refresh token |
| `TokenType` | TEXT | DEFAULT 'Bearer' | Token type |
| `ExpiresAt` | TEXT | NULL | Token expiry (ISO 8601) |
| `Scope` | TEXT | NULL | Granted scopes |
| `State` | TEXT | NULL | CSRF state for OAuth flow |
| `CreatedAt` | TEXT | NOT NULL | ISO 8601 timestamp |
| `UpdatedAt` | TEXT | NOT NULL | ISO 8601 timestamp |

---

## 🔧 Enums (add to `66-shared-constants.md`)

```php
// AI Provider Types
enum AiProviderType: string {
    case OPENAI = 'openai';
    case GEMINI = 'gemini';
    case ANTHROPIC = 'anthropic';
    case MISTRAL = 'mistral';
    case GROQ = 'groq';
    case OLLAMA = 'ollama';
    case CUSTOM = 'custom';
}

// AI Authentication Types
enum AiAuthType: string {
    case BEARER = 'bearer';                    // Simple API key as Bearer token
    case OAUTH2_CLIENT = 'oauth2_client';      // OAuth 2.0 Client Credentials
    case OAUTH2_CODE = 'oauth2_code';          // OAuth 2.0 Authorization Code
    case API_KEY_HEADER = 'api_key_header';    // API key in custom header
    case CUSTOM_HEADER = 'custom_header';      // Custom header(s)
}

// AI Model Categories
enum AiModelCategory: string {
    case CHAT = 'chat';
    case EMBEDDING = 'embedding';
    case VISION = 'vision';
    case CODE = 'code';
}

// AI Credential Field Types
enum AiCredentialFieldType: string {
    case TEXT = 'text';
    case PASSWORD = 'password';
    case TEXTAREA = 'textarea';
    case SELECT = 'select';
}
```

---

## 📁 Seed Configuration (`config.json`)

```json
{
  "AiProviders": {
    "SeedVersion": "1.0.0",
    "Providers": [
      {
        "ProviderKey": "openai",
        "DisplayName": "OpenAI",
        "ProviderType": "openai",
        "BaseUrl": "https://api.openai.com/v1",
        "AuthType": "bearer",
        "Priority": 10,
        "Credentials": [
          {
            "CredentialKey": "ApiKey",
            "FieldType": "password",
            "FieldLabel": "API Key",
            "FieldPlaceholder": "sk-...",
            "IsRequired": true,
            "FieldOrder": 1
          },
          {
            "CredentialKey": "OrganizationId",
            "FieldType": "text",
            "FieldLabel": "Organization ID (optional)",
            "FieldPlaceholder": "org-...",
            "IsRequired": false,
            "FieldOrder": 2
          }
        ],
        "Models": [
          {
            "ModelId": "gpt-4o",
            "DisplayName": "GPT-4o",
            "ModelCategory": "chat",
            "IsDefault": true,
            "MaxTokens": 128000
          },
          {
            "ModelId": "gpt-4o-mini",
            "DisplayName": "GPT-4o Mini",
            "ModelCategory": "chat",
            "MaxTokens": 128000
          },
          {
            "ModelId": "gpt-4-turbo",
            "DisplayName": "GPT-4 Turbo",
            "ModelCategory": "chat",
            "MaxTokens": 128000
          },
          {
            "ModelId": "text-embedding-3-large",
            "DisplayName": "Embeddings Large",
            "ModelCategory": "embedding",
            "MaxTokens": 8191
          }
        ]
      },
      {
        "ProviderKey": "gemini",
        "DisplayName": "Google Gemini",
        "ProviderType": "gemini",
        "BaseUrl": "https://generativelanguage.googleapis.com/v1beta",
        "AuthType": "api_key_header",
        "Priority": 20,
        "Credentials": [
          {
            "CredentialKey": "ApiKey",
            "FieldType": "password",
            "FieldLabel": "API Key",
            "FieldPlaceholder": "AIza...",
            "IsRequired": true,
            "FieldOrder": 1
          }
        ],
        "Models": [
          {
            "ModelId": "gemini-2.0-flash",
            "DisplayName": "Gemini 2.0 Flash",
            "ModelCategory": "chat",
            "IsDefault": true,
            "MaxTokens": 1000000
          },
          {
            "ModelId": "gemini-2.0-pro",
            "DisplayName": "Gemini 2.0 Pro",
            "ModelCategory": "chat",
            "MaxTokens": 2000000
          },
          {
            "ModelId": "gemini-1.5-flash",
            "DisplayName": "Gemini 1.5 Flash",
            "ModelCategory": "chat",
            "MaxTokens": 1000000
          }
        ]
      },
      {
        "ProviderKey": "anthropic",
        "DisplayName": "Anthropic Claude",
        "ProviderType": "anthropic",
        "BaseUrl": "https://api.anthropic.com/v1",
        "AuthType": "api_key_header",
        "Priority": 30,
        "Credentials": [
          {
            "CredentialKey": "ApiKey",
            "FieldType": "password",
            "FieldLabel": "API Key",
            "FieldPlaceholder": "sk-ant-...",
            "IsRequired": true,
            "FieldOrder": 1
          }
        ],
        "Models": [
          {
            "ModelId": "claude-3-5-sonnet-20241022",
            "DisplayName": "Claude 3.5 Sonnet",
            "ModelCategory": "chat",
            "IsDefault": true,
            "MaxTokens": 200000
          },
          {
            "ModelId": "claude-3-5-haiku-20241022",
            "DisplayName": "Claude 3.5 Haiku",
            "ModelCategory": "chat",
            "MaxTokens": 200000
          },
          {
            "ModelId": "claude-3-opus-20240229",
            "DisplayName": "Claude 3 Opus",
            "ModelCategory": "chat",
            "MaxTokens": 200000
          }
        ]
      },
      {
        "ProviderKey": "mistral",
        "DisplayName": "Mistral AI",
        "ProviderType": "mistral",
        "BaseUrl": "https://api.mistral.ai/v1",
        "AuthType": "bearer",
        "Priority": 40,
        "Credentials": [
          {
            "CredentialKey": "ApiKey",
            "FieldType": "password",
            "FieldLabel": "API Key",
            "IsRequired": true,
            "FieldOrder": 1
          }
        ],
        "Models": [
          {
            "ModelId": "mistral-large-latest",
            "DisplayName": "Mistral Large",
            "ModelCategory": "chat",
            "IsDefault": true,
            "MaxTokens": 128000
          },
          {
            "ModelId": "mistral-medium-latest",
            "DisplayName": "Mistral Medium",
            "ModelCategory": "chat",
            "MaxTokens": 32000
          },
          {
            "ModelId": "codestral-latest",
            "DisplayName": "Codestral",
            "ModelCategory": "code",
            "MaxTokens": 32000
          }
        ]
      },
      {
        "ProviderKey": "groq",
        "DisplayName": "Groq",
        "ProviderType": "groq",
        "BaseUrl": "https://api.groq.com/openai/v1",
        "AuthType": "bearer",
        "Priority": 50,
        "Credentials": [
          {
            "CredentialKey": "ApiKey",
            "FieldType": "password",
            "FieldLabel": "API Key",
            "FieldPlaceholder": "gsk_...",
            "IsRequired": true,
            "FieldOrder": 1
          }
        ],
        "Models": [
          {
            "ModelId": "llama-3.3-70b-versatile",
            "DisplayName": "LLaMA 3.3 70B",
            "ModelCategory": "chat",
            "IsDefault": true,
            "MaxTokens": 32768
          },
          {
            "ModelId": "mixtral-8x7b-32768",
            "DisplayName": "Mixtral 8x7B",
            "ModelCategory": "chat",
            "MaxTokens": 32768
          }
        ]
      },
      {
        "ProviderKey": "ollama",
        "DisplayName": "Ollama (Local)",
        "ProviderType": "ollama",
        "BaseUrl": "http://localhost:11434/api",
        "AuthType": "bearer",
        "Priority": 100,
        "Credentials": [
          {
            "CredentialKey": "BaseUrl",
            "FieldType": "text",
            "FieldLabel": "Ollama Server URL",
            "FieldPlaceholder": "http://localhost:11434",
            "IsRequired": true,
            "FieldOrder": 1
          }
        ],
        "Models": [
          {
            "ModelId": "llama3.2",
            "DisplayName": "LLaMA 3.2",
            "ModelCategory": "chat",
            "IsDefault": true
          },
          {
            "ModelId": "codellama",
            "DisplayName": "Code LLaMA",
            "ModelCategory": "code"
          },
          {
            "ModelId": "nomic-embed-text",
            "DisplayName": "Nomic Embed",
            "ModelCategory": "embedding"
          }
        ]
      }
    ],
    "Oauth2Templates": {
      "Oauth2Client": {
        "Credentials": [
          {"CredentialKey": "ClientId", "FieldType": "text", "FieldLabel": "Client ID", "IsRequired": true, "FieldOrder": 1},
          {"CredentialKey": "ClientSecret", "FieldType": "password", "FieldLabel": "Client Secret", "IsRequired": true, "FieldOrder": 2},
          {"CredentialKey": "TokenUrl", "FieldType": "text", "FieldLabel": "Token URL", "IsRequired": true, "FieldOrder": 3},
          {"CredentialKey": "Scope", "FieldType": "text", "FieldLabel": "Scope (optional)", "IsRequired": false, "FieldOrder": 4}
        ]
      },
      "Oauth2Code": {
        "Credentials": [
          {"CredentialKey": "ClientId", "FieldType": "text", "FieldLabel": "Client ID", "IsRequired": true, "FieldOrder": 1},
          {"CredentialKey": "ClientSecret", "FieldType": "password", "FieldLabel": "Client Secret", "IsRequired": true, "FieldOrder": 2},
          {"CredentialKey": "AuthorizeUrl", "FieldType": "text", "FieldLabel": "Authorization URL", "IsRequired": true, "FieldOrder": 3},
          {"CredentialKey": "TokenUrl", "FieldType": "text", "FieldLabel": "Token URL", "IsRequired": true, "FieldOrder": 4},
          {"CredentialKey": "RedirectUri", "FieldType": "text", "FieldLabel": "Redirect URI", "IsRequired": true, "FieldOrder": 5},
          {"CredentialKey": "Scope", "FieldType": "text", "FieldLabel": "Scope", "IsRequired": false, "FieldOrder": 6}
        ]
      },
      "CustomHeader": {
        "Credentials": [
          {"CredentialKey": "HeaderName", "FieldType": "text", "FieldLabel": "Header Name", "FieldPlaceholder": "X-API-Key", "IsRequired": true, "FieldOrder": 1},
          {"CredentialKey": "HeaderValue", "FieldType": "password", "FieldLabel": "Header Value", "IsRequired": true, "FieldOrder": 2}
        ]
      }
    }
  }
}
```

---

## 🔧 PHP Service: `AiProviderService`

```php
namespace LinkManager\Services;

class AiProviderService {
    
    /**
     * Seed providers from config.json (runs on plugin activation/update)
     */
    public function seedFromConfig(array $config): SeedResult {
        $configVersion = $config['AiProviders']['SeedVersion'];
        $results = ['Created' => 0, 'Updated' => 0, 'Skipped' => 0];
        
        foreach ($config['AiProviders']['Providers'] as $providerData) {
            $existing = $this->getByKey($providerData['ProviderKey']);
            
            if (!$existing) {
                // Create new provider
                $this->createProvider($providerData, $configVersion);
                $results['Created']++;
            } elseif (!$existing->isUserModified && version_compare($configVersion, $existing->seedVersion, '>')) {
                // Update if not user-modified and config is newer
                $this->updateProvider($existing->id, $providerData, $configVersion);
                $results['Updated']++;
            } else {
                $results['Skipped']++;
            }
        }
        
        return new SeedResult($results);
    }
    
    /**
     * Get all providers sorted by priority
     */
    public function getAllProviders(): array;
    
    /**
     * Get enabled providers only
     */
    public function getEnabledProviders(): array;
    
    /**
     * Create custom provider
     */
    public function createCustomProvider(CreateProviderDto $dto): AiProviderEntity;
    
    /**
     * Update provider (marks as user-modified)
     */
    public function updateProvider(int $id, UpdateProviderDto $dto): AiProviderEntity;
    
    /**
     * Delete provider (only custom providers)
     */
    public function deleteProvider(int $id): bool;
    
    /**
     * Test provider connection
     */
    public function testConnection(int $providerId): ConnectionTestResult;
    
    /**
     * Get credentials for provider (decrypted)
     */
    public function getCredentials(int $providerId): array;
    
    /**
     * Save credentials (encrypts before storing)
     */
    public function saveCredentials(int $providerId, array $credentials): bool;
    
    /**
     * Refresh OAuth token if expired
     */
    public function refreshOAuthToken(int $providerId): ?string;
    
    /**
     * Get models for provider
     */
    public function getModels(int $providerId): array;
    
    /**
     * Add custom model to provider
     */
    public function addModel(int $providerId, CreateModelDto $dto): AiModelEntity;
    
    /**
     * Update model display name
     */
    public function updateModelName(int $modelId, string $displayName): AiModelEntity;
}
```

---

## 📡 REST API Endpoints

**Namespace:** `lm/v1/ai-providers`

### Provider Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai-providers` | List all providers |
| GET | `/ai-providers/{id}` | Get single provider |
| POST | `/ai-providers` | Create custom provider |
| PUT | `/ai-providers/{id}` | Update provider |
| DELETE | `/ai-providers/{id}` | Delete custom provider |
| POST | `/ai-providers/{id}/enable` | Enable provider |
| POST | `/ai-providers/{id}/disable` | Disable provider |
| POST | `/ai-providers/{id}/test` | Test connection |
| POST | `/ai-providers/reseed` | Re-seed from config.json |

### Credentials Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai-providers/{id}/credentials` | Get credential fields (values masked) |
| PUT | `/ai-providers/{id}/credentials` | Save credentials |
| DELETE | `/ai-providers/{id}/credentials` | Clear all credentials |

### OAuth Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai-providers/{id}/oauth/authorize` | Get OAuth authorization URL |
| POST | `/ai-providers/{id}/oauth/callback` | Handle OAuth callback |
| POST | `/ai-providers/{id}/oauth/refresh` | Refresh OAuth token |
| DELETE | `/ai-providers/{id}/oauth/revoke` | Revoke OAuth session |

### Model Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai-providers/{id}/models` | List models for provider |
| POST | `/ai-providers/{id}/models` | Add custom model |
| PUT | `/ai-providers/{id}/models/{modelId}` | Update model |
| DELETE | `/ai-providers/{id}/models/{modelId}` | Delete custom model |
| POST | `/ai-providers/{id}/models/{modelId}/set-default` | Set as default model |

---

## 📋 Request/Response Schemas

### GET `/ai-providers`

**Response:**
```json
{
  "Success": true,
  "Data": {
    "Providers": [
      {
        "Id": 1,
        "ProviderKey": "openai",
        "DisplayName": "OpenAI",
        "ProviderType": "openai",
        "BaseUrl": "https://api.openai.com/v1",
        "AuthType": "bearer",
        "IsEnabled": true,
        "IsSeeded": true,
        "IsUserModified": false,
        "IsConfigured": true,
        "Priority": 10,
        "ModelCount": 4,
        "DefaultModel": "gpt-4o"
      }
    ],
    "Total": 6
  }
}
```

### POST `/ai-providers` (Create Custom)

**Request:**
```json
{
  "DisplayName": "Azure OpenAI",
  "ProviderType": "custom",
  "BaseUrl": "https://my-resource.openai.azure.com",
  "AuthType": "api_key_header",
  "Credentials": [
    {
      "CredentialKey": "ApiKey",
      "FieldType": "password",
      "FieldLabel": "API Key",
      "IsRequired": true
    },
    {
      "CredentialKey": "ApiVersion",
      "FieldType": "text",
      "FieldLabel": "API Version",
      "IsRequired": true,
      "DefaultValue": "2024-02-15-preview"
    }
  ],
  "Models": [
    {
      "ModelId": "gpt-4-deployment",
      "DisplayName": "GPT-4 (Azure)",
      "ModelCategory": "chat",
      "IsDefault": true
    }
  ]
}
```

### PUT `/ai-providers/{id}/credentials`

**Request:**
```json
{
  "Credentials": {
    "ApiKey": "sk-proj-xxxxxxxxxxxx",
    "OrganizationId": "org-xxxxxxxxxxxx"
  }
}
```

### POST `/ai-providers/{id}/test`

**Response (Success):**
```json
{
  "Success": true,
  "Data": {
    "Status": "connected",
    "LatencyMs": 245,
    "ModelTested": "gpt-4o",
    "Message": "Connection successful"
  }
}
```

**Response (Failure):**
```json
{
  "Success": false,
  "Error": {
    "Code": 14810,
    "Message": "Authentication failed",
    "Details": "Invalid API key provided"
  }
}
```

---

## 🔒 Security

### Credential Encryption
- All credentials encrypted with WordPress `wp_encrypt()` or OpenSSL AES-256-GCM
- Encryption key derived from `AUTH_KEY` + plugin salt
- Credentials never logged or exposed in responses

### OAuth Security
- CSRF protection via `state` parameter
- Token refresh with sliding window
- Automatic token revocation on provider deletion

### API Security
- All endpoints require `manage_options` capability
- Rate limiting: 60 requests/minute
- Input validation with sanitization

---

## 🚨 Error Codes (add to `66-shared-constants.md`)

| Code | Constant | Message |
|------|----------|---------|
| 14810 | `AI_PROVIDER_AUTH_FAILED` | Authentication failed |
| 14811 | `AI_PROVIDER_NOT_FOUND` | Provider not found |
| 14812 | `AI_PROVIDER_DUPLICATE_KEY` | Provider key already exists |
| 14813 | `AI_PROVIDER_CANNOT_DELETE_SEEDED` | Cannot delete seeded provider |
| 14814 | `AI_PROVIDER_INVALID_AUTH_TYPE` | Invalid authentication type |
| 14815 | `AI_PROVIDER_MISSING_CREDENTIALS` | Required credentials missing |
| 14816 | `AI_PROVIDER_CONNECTION_FAILED` | Connection test failed |
| 14817 | `AI_PROVIDER_OAUTH_STATE_MISMATCH` | OAuth state mismatch |
| 14818 | `AI_PROVIDER_OAUTH_TOKEN_EXPIRED` | OAuth token expired and refresh failed |
| 14819 | `AI_PROVIDER_MODEL_NOT_FOUND` | Model not found |
| 14820 | `AI_PROVIDER_ENCRYPTION_FAILED` | Credential encryption failed |

---

## 🖥️ UI Integration

See `30-ai-provider-settings-page.md` for admin UI specification.

### Settings Page Section
- Located in Settings → AI Providers tab
- Provider cards with enable/disable toggles
- Credential forms with field validation
- OAuth connect buttons with status indicators
- Connection test with real-time feedback
- Model list with rename capability

---

## 📝 Entity Classes (add to `08-entity-models.md`)

```php
class AiProviderEntity extends BaseEntity {
    public int $id;
    public string $providerKey;
    public string $displayName;
    public AiProviderType $providerType;
    public string $baseUrl;
    public AiAuthType $authType;
    public bool $isEnabled;
    public bool $isSeeded;
    public bool $isUserModified;
    public ?string $seedVersion;
    public int $priority;
    public DateTimeImmutable $createdAt;
    public DateTimeImmutable $updatedAt;
    
    // Computed
    public bool $isConfigured;
    public int $modelCount;
    public ?string $defaultModel;
}

class AiProviderCredentialEntity extends BaseEntity {
    public int $id;
    public int $providerId;
    public string $credentialKey;
    public string $credentialValue; // Encrypted
    public bool $isRequired;
    public AiCredentialFieldType $fieldType;
    public string $fieldLabel;
    public ?string $fieldPlaceholder;
    public int $fieldOrder;
    public ?string $validationRegex;
}

class AiModelEntity extends BaseEntity {
    public int $id;
    public int $providerId;
    public string $modelId;
    public string $displayName;
    public AiModelCategory $modelCategory;
    public bool $isDefault;
    public bool $isEnabled;
    public ?int $maxTokens;
    public ?float $costPer1kInput;
    public ?float $costPer1kOutput;
}

class AiOAuthSessionEntity extends BaseEntity {
    public int $id;
    public int $providerId;
    public string $accessToken; // Encrypted
    public ?string $refreshToken; // Encrypted
    public string $tokenType;
    public ?DateTimeImmutable $expiresAt;
    public ?string $scope;
    public ?string $state;
}
```

---

## 📋 Acceptance Criteria

- [ ] Seeded providers load from config.json on plugin activation
- [ ] User modifications prevent automatic seed updates
- [ ] Manual re-seed option available for admins
- [ ] All 6 default providers configurable
- [ ] Custom providers can be added with any auth type
- [ ] OAuth 2.0 flows complete successfully
- [ ] Credentials encrypted at rest
- [ ] Connection test validates provider accessibility
- [ ] Model names user-customizable
- [ ] Settings persist across plugin updates
