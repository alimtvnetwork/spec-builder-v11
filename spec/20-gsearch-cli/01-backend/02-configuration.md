# Component: Configuration

**Parent:** [Golang Search CLI](./00-overview.md)  
**Version:** 2.0.0  
**Updated:** 2026-03-09  

---

## Summary

Configuration management using Viper with JSON file support and environment variable overrides. Includes proxy support with rotation strategies for avoiding IP-based blocking.

---

## Configuration File

**Path:** `./config.json` or `./config/config.json`

---

## Type Standards

### Weight Values (NORMALIZED)

All weight values use `float64` in range `0.0` to `1.0` and **MUST sum to 1.0** (±0.001 tolerance).

| Before | After | Meaning |
|--------|-------|---------|
| `40` (int, percentage) | `0.40` (float64) | 40% probability |
| `30` (int, percentage) | `0.30` (float64) | 30% probability |

### Duration Values (STANDARDIZED)

All duration values support both formats:
- **String format:** `"2s"`, `"500ms"`, `"30m"`, `"1h"`
- **Numeric format:** Milliseconds as integer (for backward compatibility)

| Field | String Example | Numeric Example | Internal Unit |
|-------|----------------|-----------------|---------------|
| `requestDelay` | `"2s"` | `2000` | milliseconds |
| `timeout` | `"30s"` | `30000` | milliseconds |
| `cooldown` | `"15m"` | `900000` | milliseconds |
| `cleanupInterval` | `"24h"` | `86400000` | milliseconds |

---

## Full Configuration Schema

```json
{
  "Database": {
    "Path": "./data/search.db.sqlite",
    "MaxConnections": 10,
    "LogQueries": false
  },
  "Search": {
    "DefaultEngine": "google",
    "DefaultMethod": "html",
    "RequestDelay": "2s",
    "MaxConcurrent": 5,
    "Timeout": "30s",
    "MaxRetries": 3,
    "RetryDelay": "5s",
    "UserAgents": [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ],
    "MethodWeights": {
      "Html": 0.40,
      "GoogleApi": 0.30,
      "DuckDuckGo": 0.20,
      "Bing": 0.10
    }
  },
  "Proxy": {
    "Enabled": false,
    "Type": "http",
    "Url": "${PROXY_URL}",
    "Auth": {
      "Enabled": false,
      "Username": "${PROXY_USERNAME}",
      "Password": "${PROXY_PASSWORD}"
    },
    "Rotation": {
      "Enabled": false,
      "Strategy": "round-robin",
      "Urls": [],
      "HealthCheck": {
        "Enabled": true,
        "Interval": "5m",
        "Timeout": "10s",
        "TestUrl": "https://httpbin.org/ip"
      }
    },
    "Timeout": "10s",
    "SkipVerify": false,
    "PerEngine": {}
  },
  "Cache": {
    "Enabled": true,
    "TtlDays": 5,
    "MaxEntries": 10000,
    "AutoCleanup": true,
    "CleanupInterval": "24h"
  },
  "Nested": {
    "Enabled": true,
    "MaxDepth": 3,
    "KeywordThreshold": 5,
    "MinKeywordLength": 3,
    "ExcludeKeywords": ["the", "and", "or", "is", "a", "an"]
  },
  "Output": {
    "DefaultFormat": "json",
    "SaveToDb": true,
    "PrettyPrint": true,
    "IncludeMetadata": true
  },
  "PageFetch": {
    "Enabled": false,
    "MaxSize": 1048576,
    "Timeout": "10s",
    "ExtractText": true,
    "ExtractKeywords": true
  },
  "Apis": {
    "GoogleSearchConsole": {
      "Enabled": false,
      "CredentialsPath": "./credentials.json",
      "QuotaLimit": 100
    },
    "Bing": {
      "Enabled": false,
      "ApiKeyEnv": "BING_API_KEY",
      "Endpoint": "https://api.bing.microsoft.com/v7.0/search"
    },
    "DuckDuckGo": {
      "Enabled": true,
      "Endpoint": "https://html.duckduckgo.com/html/"
    },
    "Movie": {
      "Enabled": true,
      "CacheTtlDays": 30,
      "MaxWorkers": 4,
      "RequestDelay": "500ms",
      "Tmdb": {
        "Enabled": true,
        "Endpoint": "https://api.themoviedb.org/3",
        "ApiKeys": [],
        "ApiKeyEnvs": ["TMDB_API_KEY_1", "TMDB_API_KEY_2", "TMDB_API_KEY_3"],
        "RotationMode": "round-robin",
        "DailyLimit": 1000
      },
      "Omdb": {
        "Enabled": true,
        "Endpoint": "https://www.omdbapi.com",
        "ApiKeys": [],
        "ApiKeyEnvs": ["OMDB_API_KEY_1", "OMDB_API_KEY_2"],
        "RotationMode": "round-robin",
        "DailyLimit": 1000
      },
      "Imdb": {
        "Enabled": true,
        "UseHeadless": false,
        "RequestDelay": "2s"
      }
    }
  },
  "Blocking": {
    "DetectPatterns": [
      "unusual traffic",
      "captcha",
      "blocked",
      "rate limit"
    ],
    "Cooldown": "30m",
    "MaxBlockedMethods": 2
  },
  "Backoff": {
    "InitialDelay": "1s",
    "MaxDelay": "60s",
    "Multiplier": 2.0,
    "Jitter": 0.2,
    "JitterType": "bounded",
    "MaxAttempts": 5,
    "ResetAfterSuccess": true
  },
  "Selectors": {
    "Path": "./configs/selectors.json",
    "AutoReload": false,
    "FallbackToEmbedded": true,
    "ReloadInterval": "5m"
  },
  "Shutdown": {
    "Timeout": "30s",
    "ProgressInterval": "5s",
    "ForceExitTimeout": "45s"
  },
  "Resources": {
    "MaxGoroutines": 100,
    "MaxMemoryMb": 512,
    "AcquisitionTimeout": "10s",
    "MemoryCheckInterval": "30s"
  },
  "Logging": {
    "Level": "info",
    "File": "./logs/search.log",
    "MaxSize": 10485760,
    "MaxBackups": 5
  },
  "Metrics": {
    "Enabled": true,
    "Endpoint": "/metrics",
    "Port": 9090,
    "BasicAuth": {
      "Enabled": false,
      "Username": "",
      "PasswordHash": ""
    }
  },
  "Health": {
    "Enabled": true,
    "Port": 5020,
    "Timeout": "5s",
    "DiskMinFreeMb": 100,
    "DiskPaths": ["./data"]
  },
  "Tracing": {
    "Enabled": false,
    "ServiceName": "gsearch",
    "Environment": "development",
    "OtlpEndpoint": "localhost:4317",
    "SamplingRate": 1.0,
    "BatchTimeout": "5s",
    "ExportTimeout": "30s"
  }
}
```

---

## Proxy Configuration

### Proxy Types

| Type | Protocol | Port (Default) | Use Case |
|------|----------|----------------|----------|
| `http` | HTTP CONNECT | 8080 | General HTTP proxying |
| `https` | HTTPS CONNECT | 8443 | Encrypted proxy connection |
| `socks5` | SOCKS5 | 1080 | Full TCP proxying, more anonymous |
| `socks5h` | SOCKS5 + DNS | 1080 | DNS resolved by proxy server |

### Rotation Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| `round-robin` | Cycles through proxies sequentially | Balanced distribution |
| `random` | Selects random proxy each request | Unpredictable patterns |
| `least-used` | Prefers proxies with fewer requests | Even load distribution |
| `failover` | Uses primary until failure | Reliable single proxy with backup |
| `weighted` | Selects based on configured weights | Prioritizing faster proxies |

### Per-Engine Proxy Override

```json
{
  "Proxy": {
    "Enabled": true,
    "Url": "http://default-proxy:8080",
    "PerEngine": {
      "Google": {
        "Url": "socks5://google-proxy:1080",
        "Auth": {
          "Enabled": true,
          "Username": "google_user",
          "Password": "${GOOGLE_PROXY_PASS}"
        }
      },
      "Bing": {
        "Url": "http://bing-proxy:8080"
      }
    }
  }
}
```

---

## Go Configuration Struct

```go
package config

import (
    "encoding/json"
    "math"
    "time"

    "github.com/spf13/viper"
    
    "gsearch/internal/enums/enginetype"
    "gsearch/internal/enums/jittertype"
    "gsearch/internal/enums/logleveltype"
    "gsearch/internal/enums/outputformattype"
    "gsearch/internal/enums/proxytype"
    "gsearch/internal/enums/rotationstrategytype"
    "gsearch/pkg/apperror"
)

// Duration supports both string ("2s") and numeric (milliseconds) formats
type Duration struct {
    time.Duration
}

func (d *Duration) UnmarshalJSON(data []byte) error {
    // Try string format first ("2s", "500ms"), then numeric (milliseconds)
    var strVal string
    if err := json.Unmarshal(data, &strVal); err == nil {
        parsed, parseErr := time.ParseDuration(strVal)
        if parseErr != nil {
            return parseErr
        }
        d.Duration = parsed
        return nil
    }
    var numVal float64
    if err := json.Unmarshal(data, &numVal); err != nil {
        return apperror.New(
            "duration must be a string or number, got: " + string(data),
        )
    }
    d.Duration = time.Duration(numVal) * time.Millisecond
    return nil
}

}

func (d Duration) MarshalJSON() ([]byte, error) {
    return json.Marshal(d.Duration.String())
}

type Config struct {
    Database    DatabaseConfig    `mapstructure:"Database"`
    Search      SearchConfig      `mapstructure:"Search"`
    Proxy       ProxyConfig       `mapstructure:"Proxy"`
    Cache       CacheConfig       `mapstructure:"Cache"`
    Nested      NestedConfig      `mapstructure:"Nested"`
    Output      OutputConfig      `mapstructure:"Output"`
    PageFetch   PageFetchConfig   `mapstructure:"PageFetch"`
    APIs        APIsConfig        `mapstructure:"Apis"`
    Blocking    BlockingConfig    `mapstructure:"Blocking"`
    Backoff     BackoffConfig     `mapstructure:"Backoff"`
    Selectors   SelectorConfig    `mapstructure:"Selectors"`
    Shutdown    ShutdownConfig    `mapstructure:"Shutdown"`
    Resources   ResourceConfig    `mapstructure:"Resources"`
    Logging     LoggingConfig     `mapstructure:"Logging"`
    Metrics     MetricsConfig     `mapstructure:"Metrics"`     // Prometheus metrics
    Health      HealthConfig      `mapstructure:"Health"`      // Health check endpoints
    Tracing     TracingConfig     `mapstructure:"Tracing"`     // OpenTelemetry tracing
}

type DatabaseConfig struct {
    Path           string `mapstructure:"Path"`
    MaxConnections int    `mapstructure:"MaxConnections"`
    LogQueries     bool   `mapstructure:"LogQueries"`
}

type SearchConfig struct {
    DefaultEngine  engine.Variant              `mapstructure:"DefaultEngine"`  // Type-safe: google, bing, duckduckgo
    DefaultMethod  engine.Variant              `mapstructure:"DefaultMethod"`  // Type-safe search method
    RequestDelay   Duration                    `mapstructure:"RequestDelay"`
    MaxConcurrent  int                         `mapstructure:"MaxConcurrent"`
    Timeout        Duration                    `mapstructure:"Timeout"`
    MaxRetries     int                         `mapstructure:"MaxRetries"`
    RetryDelay     Duration                    `mapstructure:"RetryDelay"`
    UserAgents     []string                    `mapstructure:"UserAgents"`
    MethodWeights  map[engine.Variant]float64  `mapstructure:"MethodWeights"`  // 0.0-1.0, must sum to 1.0
}

// ProxyConfig configures HTTP/SOCKS proxy support
type ProxyConfig struct {
    Enabled   bool                             `mapstructure:"Enabled"`
    Type      proxy_type.Variant               `mapstructure:"Type"`       // Type-safe: http, https, socks5, socks5h
    Url       string                           `mapstructure:"Url"`        // Primary proxy URL
    Auth      ProxyAuthConfig                  `mapstructure:"Auth"`
    Rotation  ProxyRotation                    `mapstructure:"Rotation"`
    Timeout   Duration                         `mapstructure:"Timeout"`
    SkipVerify bool                            `mapstructure:"SkipVerify"` // Skip TLS verification
    PerEngine map[engine.Variant]ProxyOverride `mapstructure:"PerEngine"`  // Type-safe engine keys
}

// ProxyAuthConfig configures proxy authentication
type ProxyAuthConfig struct {
    Enabled  bool   `mapstructure:"Enabled"`
    Username string `mapstructure:"Username"`
    Password string `mapstructure:"Password"`
}

// ProxyRotation configures multiple proxy rotation
type ProxyRotation struct {
    Enabled     bool                      `mapstructure:"Enabled"`
    Strategy    rotation_strategy.Variant `mapstructure:"Strategy"`         // Type-safe: round_robin, random, least_used, failover, weighted
    Urls        []string                  `mapstructure:"Urls"`
    Weights     map[string]float64        `mapstructure:"Weights,omitempty"` // For weighted strategy
    HealthCheck ProxyHealthCheck          `mapstructure:"HealthCheck"`
}

// ProxyHealthCheck configures proxy health monitoring
type ProxyHealthCheck struct {
    Enabled  bool     `mapstructure:"Enabled"`
    Interval Duration `mapstructure:"Interval"`
    Timeout  Duration `mapstructure:"Timeout"`
    TestUrl  string   `mapstructure:"TestUrl"`
}

// ProxyOverride allows per-engine proxy configuration
type ProxyOverride struct {
    Url  string          `mapstructure:"Url"`
    Auth ProxyAuthConfig `mapstructure:"Auth"`
}

type CacheConfig struct {
    Enabled         bool     `mapstructure:"Enabled"`
    TTLDays         int      `mapstructure:"TtlDays"`
    MaxEntries      int      `mapstructure:"MaxEntries"`
    AutoCleanup     bool     `mapstructure:"AutoCleanup"`
    CleanupInterval Duration `mapstructure:"CleanupInterval"`
}

type NestedConfig struct {
    Enabled          bool     `mapstructure:"Enabled"`
    MaxDepth         int      `mapstructure:"MaxDepth"`
    KeywordThreshold int      `mapstructure:"KeywordThreshold"`
    MinKeywordLength int      `mapstructure:"MinKeywordLength"`
    ExcludeKeywords  []string `mapstructure:"ExcludeKeywords"`
}

type OutputConfig struct {
    DefaultFormat   output.Variant `mapstructure:"DefaultFormat"`  // Type-safe: json, csv, table, markdown
    SaveToDb        bool           `mapstructure:"SaveToDb"`
    PrettyPrint     bool           `mapstructure:"PrettyPrint"`
    IncludeMetadata bool           `mapstructure:"IncludeMetadata"`
}

type PageFetchConfig struct {
    Enabled         bool     `mapstructure:"Enabled"`
    MaxSize         int      `mapstructure:"MaxSize"`
    Timeout         Duration `mapstructure:"Timeout"`
    ExtractText     bool     `mapstructure:"ExtractText"`
    ExtractKeywords bool     `mapstructure:"ExtractKeywords"`
}

type APIsConfig struct {
    GoogleSearchConsole GoogleApiConfig  `mapstructure:"GoogleSearchConsole"`
    Bing                BingApiConfig    `mapstructure:"Bing"`
    DuckDuckGo          DDGConfig        `mapstructure:"DuckDuckGo"`
    Movie               MovieApiConfig   `mapstructure:"Movie"`
}

type GoogleApiConfig struct {
    Enabled         bool   `mapstructure:"Enabled"`
    CredentialsPath string `mapstructure:"CredentialsPath"`
    QuotaLimit      int    `mapstructure:"QuotaLimit"`
}

type BingApiConfig struct {
    Enabled   bool   `mapstructure:"Enabled"`
    APIKeyEnv string `mapstructure:"ApiKeyEnv"`
    Endpoint  string `mapstructure:"Endpoint"`
}

type DDGConfig struct {
    Enabled  bool   `mapstructure:"Enabled"`
    Endpoint string `mapstructure:"Endpoint"`
}

// MovieApiConfig configures movie/TV metadata APIs with key rotation
type MovieApiConfig struct {
    Enabled         bool              `mapstructure:"Enabled"`
    CacheTtlDays    int               `mapstructure:"CacheTtlDays"`    // Default: 30
    MaxWorkers      int               `mapstructure:"MaxWorkers"`      // Parallel batch workers
    RequestDelay    Duration          `mapstructure:"RequestDelay"`    // Delay between API calls
    Tmdb            TmdbApiConfig     `mapstructure:"Tmdb"`
    Omdb            OmdbApiConfig     `mapstructure:"Omdb"`
    Imdb            ImdbConfig        `mapstructure:"Imdb"`
}

// TmdbApiConfig configures TMDB API with multiple rotating keys
type TmdbApiConfig struct {
    Enabled       bool                      `mapstructure:"Enabled"`
    Endpoint      string                    `mapstructure:"Endpoint"`      // Default: https://api.themoviedb.org/3
    ApiKeys       []string                  `mapstructure:"ApiKeys"`       // Multiple keys for rotation
    ApiKeyEnvs    []string                  `mapstructure:"ApiKeyEnvs"`    // Env var names: TMDB_API_KEY_1, etc.
    RotationMode  rotation_strategy.Variant `mapstructure:"RotationMode"`  // Type-safe: round_robin, random, least_used
    DailyLimit    int                       `mapstructure:"DailyLimit"`    // Per-key daily limit (default: 1000)
}

// OmdbApiConfig configures OMDB API with multiple rotating keys
type OmdbApiConfig struct {
    Enabled       bool                      `mapstructure:"Enabled"`
    Endpoint      string                    `mapstructure:"Endpoint"`      // Default: https://www.omdbapi.com
    ApiKeys       []string                  `mapstructure:"ApiKeys"`       // Multiple keys for rotation
    ApiKeyEnvs    []string                  `mapstructure:"ApiKeyEnvs"`    // Env var names: OMDB_API_KEY_1, etc.
    RotationMode  rotation_strategy.Variant `mapstructure:"RotationMode"`  // Type-safe: round_robin, random, least_used
    DailyLimit    int                       `mapstructure:"DailyLimit"`    // Per-key daily limit (default: 1000)
}

// ImdbConfig configures IMDB scraping fallback
type ImdbConfig struct {
    Enabled       bool     `mapstructure:"Enabled"`
    UseHeadless   bool     `mapstructure:"UseHeadless"`   // Use headless browser
    RequestDelay  Duration `mapstructure:"RequestDelay"`  // Delay to avoid blocking
}

type BlockingConfig struct {
    DetectPatterns    []string `mapstructure:"DetectPatterns"`
    Cooldown          Duration `mapstructure:"Cooldown"`
    MaxBlockedMethods int      `mapstructure:"MaxBlockedMethods"`
}

type BackoffConfig struct {
    InitialDelay      Duration            `mapstructure:"InitialDelay"`
    MaxDelay          Duration            `mapstructure:"MaxDelay"`
    Multiplier        float64             `mapstructure:"Multiplier"`
    Jitter            float64             `mapstructure:"Jitter"`            // 0.0-1.0
    JitterType        jitter_type.Variant `mapstructure:"JitterType"`        // Type-safe: full, equal, decorrelated, bounded
    MaxAttempts       int                 `mapstructure:"MaxAttempts"`       // Max retry attempts
    ResetAfterSuccess bool                `mapstructure:"ResetAfterSuccess"` // Reset backoff on success
}

type SelectorConfig struct {
    Path               string   `mapstructure:"Path"`
    AutoReload         bool     `mapstructure:"AutoReload"`
    FallbackToEmbedded bool     `mapstructure:"FallbackToEmbedded"`
    ReloadInterval     Duration `mapstructure:"ReloadInterval"`
}

type ShutdownConfig struct {
    Timeout          Duration `mapstructure:"Timeout"`
    ProgressInterval Duration `mapstructure:"ProgressInterval"`
    ForceExitTimeout Duration `mapstructure:"ForceExitTimeout"`
}

type ResourceConfig struct {
    MaxGoroutines       int      `mapstructure:"MaxGoroutines"`
    MaxMemoryMb         int      `mapstructure:"MaxMemoryMb"`
    AcquisitionTimeout  Duration `mapstructure:"AcquisitionTimeout"`
    MemoryCheckInterval Duration `mapstructure:"MemoryCheckInterval"`
}

type LoggingConfig struct {
    Level      log_level.Variant `mapstructure:"Level"`  // Type-safe: debug, info, warn, error
    File       string            `mapstructure:"File"`
    MaxSize    int               `mapstructure:"MaxSize"`
    MaxBackups int               `mapstructure:"MaxBackups"`
}

// MetricsConfig configures Prometheus metrics endpoint
type MetricsConfig struct {
    Enabled   bool            `mapstructure:"Enabled"`
    Endpoint  string          `mapstructure:"Endpoint"`  // Default: /metrics
    Port      int             `mapstructure:"Port"`      // Default: 9090
    BasicAuth MetricsAuthConfig `mapstructure:"BasicAuth"`
}

type MetricsAuthConfig struct {
    Enabled      bool   `mapstructure:"Enabled"`
    Username     string `mapstructure:"Username"`
    PasswordHash string `mapstructure:"PasswordHash"` // Bcrypt hash
}

// HealthConfig configures health check endpoints
type HealthConfig struct {
    Enabled     bool     `mapstructure:"Enabled"`
    Port        int      `mapstructure:"Port"`        // Default: 5020
    Timeout     Duration `mapstructure:"Timeout"`     // Default: 5s
    DiskMinFreeMB int64  `mapstructure:"DiskMinFreeMb"` // Default: 100
    DiskPaths   []string `mapstructure:"DiskPaths"`   // Default: ["./data"]
}

// TracingConfig configures OpenTelemetry distributed tracing
type TracingConfig struct {
    Enabled       bool    `mapstructure:"Enabled"`
    ServiceName   string  `mapstructure:"ServiceName"`   // Default: gsearch
    Environment   string  `mapstructure:"Environment"`   // Default: development
    OTLPEndpoint  string  `mapstructure:"OtlpEndpoint"`  // Default: localhost:4317
    SamplingRate  float64 `mapstructure:"SamplingRate"`  // Default: 1.0 (100%)
    BatchTimeout  Duration `mapstructure:"BatchTimeout"` // Default: 5s
    ExportTimeout Duration `mapstructure:"ExportTimeout"` // Default: 30s
}
```

---

## Proxy Manager Implementation

```go
// pkg/proxy/manager.go

package proxy

import (
    stdctx "context"
    "crypto/tls"
    "math/rand"
    "net"
    "net/http"
    "net/url"
    "sync"
    "sync/atomic"
    "time"
    
    "github.com/rs/zerolog/log"
    "golang.org/x/net/proxy"
    "gsearch/pkg/apperror"
    "gsearch/pkg/config"
)

// ProxyManager manages proxy selection and rotation
type ProxyManager struct {
    config      config.ProxyConfig
    proxies     []*ProxyEntry
    current     atomic.Int64
    mu          sync.RWMutex
    healthStop  chan struct{}
}

// ProxyEntry represents a single proxy with metadata
type ProxyEntry struct {
    Url         *url.URL
    Auth        *url.Userinfo
    Healthy     bool
    LastCheck   time.Time
    RequestCount int64
    FailCount   int64
    Weight      float64
    mu          sync.Mutex
}

// NewProxyManager creates a new proxy manager
func NewProxyManager(cfg config.ProxyConfig) apperror.Result[*ProxyManager] {
    pm := &ProxyManager{
        config:     cfg,
        healthStop: make(chan struct{}),
    }
    
    if !cfg.Enabled {
        return apperror.OK(pm)
    }
    
    // Initialize proxy list
    if cfg.Rotation.Enabled && len(cfg.Rotation.Urls) > 0 {
        for _, urlStr := range cfg.Rotation.Urls {
            entryResult := pm.parseProxyUrl(urlStr, cfg.Auth)
            if !entryResult.IsSuccess {
                return apperror.Fail[*ProxyManager](
                    apperror.Wrap(
                        entryResult.Error,
                        "invalid proxy URL: "+urlStr,
                    ),
                )
            }
            
            entry := entryResult.Value
            // Set weight if using weighted strategy
            if w, ok := cfg.Rotation.Weights[urlStr]; ok {
                entry.Weight = w
            } else {
                entry.Weight = 1.0
            }
            
            pm.proxies = append(pm.proxies, entry)
        }
    } else if cfg.Url != "" {
        entryResult := pm.parseProxyUrl(cfg.Url, cfg.Auth)
        if !entryResult.IsSuccess {
            return apperror.Fail[*ProxyManager](
                apperror.Wrap(
                    entryResult.Error,
                    "invalid proxy URL",
                ),
            )
        }
        pm.proxies = append(pm.proxies, entryResult.Value)
    }
    
    // Start health check if enabled
    if cfg.Rotation.Enabled && cfg.Rotation.HealthCheck.Enabled {
        go pm.healthCheckLoop()
    }
    
    return apperror.OK(pm)
}

// parseProxyUrl parses a proxy URL string
func (pm *ProxyManager) parseProxyUrl(urlStr string, auth config.ProxyAuthConfig) apperror.Result[*ProxyEntry] {
    parsed, err := url.Parse(urlStr)
    if err != nil {
        return apperror.Fail[*ProxyEntry](
            apperror.Wrap(
                err,
                "parse proxy URL",
            ),
        )
    }
    
    entry := &ProxyEntry{
        Url:     parsed,
        Healthy: true, // Assume healthy initially
        Weight:  1.0,
    }
    
    // Set auth if configured
    if auth.Enabled && auth.Username != "" {
        entry.Auth = url.UserPassword(auth.Username, auth.Password)
    } else if parsed.User != nil {
        entry.Auth = parsed.User
    }
    
    return apperror.OK(entry)
}

// GetProxy returns the next proxy based on rotation strategy
func (pm *ProxyManager) GetProxy() apperror.Result[*url.URL] {
    if !pm.config.Enabled || len(pm.proxies) == 0 {
        return apperror.OK[*url.URL](nil) // Direct connection
    }
    
    pm.mu.RLock()
    defer pm.mu.RUnlock()
    
    var entry *ProxyEntry
    
    switch pm.config.Rotation.Strategy {
    case "round-robin":
        entry = pm.selectRoundRobin()
    case "random":
        entry = pm.selectRandom()
    case "least-used":
        entry = pm.selectLeastUsed()
    case "failover":
        entry = pm.selectFailover()
    case "weighted":
        entry = pm.selectWeighted()
    default:
        entry = pm.selectRoundRobin()
    }
    
    if entry == nil {
        return apperror.Fail[*url.URL](
            apperror.New(
                "no healthy proxies available",
            ),
        )
    }
    
    // Clone URL and add auth
    proxyUrl := *entry.Url
    if entry.Auth != nil {
        proxyUrl.User = entry.Auth
    }
    
    // Track usage
    entry.mu.Lock()
    entry.RequestCount++
    entry.mu.Unlock()
    
    return apperror.OK(&proxyUrl)
}

// selectRoundRobin cycles through proxies sequentially
func (pm *ProxyManager) selectRoundRobin() *ProxyEntry {
    for attempts := 0; attempts < len(pm.proxies); attempts++ {
        idx := pm.current.Add(1) % int64(len(pm.proxies))
        entry := pm.proxies[idx]
        if entry.Healthy {
            return entry
        }
    }
    return nil
}

// selectRandom selects a random healthy proxy
func (pm *ProxyManager) selectRandom() *ProxyEntry {
    healthy := pm.getHealthyProxies()
    if len(healthy) == 0 {
        return nil
    }
    return healthy[rand.Intn(len(healthy))]
}

// selectLeastUsed selects the proxy with fewest requests
func (pm *ProxyManager) selectLeastUsed() *ProxyEntry {
    var selected *ProxyEntry
    minCount := int64(^uint64(0) >> 1) // Max int64
    
    for _, entry := range pm.proxies {
        if entry.Healthy {
            entry.mu.Lock()
            count := entry.RequestCount
            entry.mu.Unlock()
            
            if count < minCount {
                minCount = count
                selected = entry
            }
        }
    }
    return selected
}

// selectFailover uses first healthy proxy
func (pm *ProxyManager) selectFailover() *ProxyEntry {
    for _, entry := range pm.proxies {
        if entry.Healthy {
            return entry
        }
    }
    return nil
}

// selectWeighted selects based on configured weights
func (pm *ProxyManager) selectWeighted() *ProxyEntry {
    healthy := pm.getHealthyProxies()
    if len(healthy) == 0 {
        return nil
    }
    
    // Calculate total weight
    var totalWeight float64
    for _, entry := range healthy {
        totalWeight += entry.Weight
    }
    
    // Random selection based on weight
    r := rand.Float64() * totalWeight
    var cumulative float64
    for _, entry := range healthy {
        cumulative += entry.Weight
        if r <= cumulative {
            return entry
        }
    }
    
    return healthy[len(healthy)-1]
}

// getHealthyProxies returns all healthy proxy entries
func (pm *ProxyManager) getHealthyProxies() []*ProxyEntry {
    var healthy []*ProxyEntry
    for _, entry := range pm.proxies {
        if entry.Healthy {
            healthy = append(healthy, entry)
        }
    }
    return healthy
}

// GetProxyForEngine returns proxy for specific engine (with override support)
func (pm *ProxyManager) GetProxyForEngine(engine string) apperror.Result[*url.URL] {
    if override, ok := pm.config.PerEngine[engine]; ok {
        parsed, err := url.Parse(override.Url)
        if err != nil {
            return apperror.Fail[*url.URL](
                apperror.Wrap(
                    err,
                    "parse engine proxy URL",
                ),
            )
        }
        
        if override.Auth.Enabled {
            parsed.User = url.UserPassword(override.Auth.Username, override.Auth.Password)
        }
        
        return apperror.OK(parsed)
    }
    
    return pm.GetProxy()
}

// CreateHttpClient creates an HTTP client configured with proxy
func (pm *ProxyManager) CreateHttpClient(timeout time.Duration) apperror.Result[http.Client] {
    transport := &http.Transport{
        DialContext: (&net.Dialer{
            Timeout:   30 * time.Second,
            KeepAlive: 30 * time.Second,
        }).DialContext,
        MaxIdleConns:          100,
        IdleConnTimeout:       90 * time.Second,
        TLSHandshakeTimeout:   10 * time.Second,
        ExpectContinueTimeout: 1 * time.Second,
    }
    
    if pm.config.SkipVerify {
        transport.TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
    }
    
    if pm.config.Enabled {
        transport.Proxy = pm.proxyFunc
    }
    
    return apperror.Ok(http.Client{
        Transport: transport,
        Timeout:   timeout,
    })
}

// proxyFunc is the proxy selector for http.Transport
// NOTE: This signature is dictated by http.Transport.Proxy — library boundary, raw error exempt
func (pm *ProxyManager) proxyFunc(req *http.Request) (*url.URL, error) { // EXEMPTED: http.Transport.Proxy signature
    // Check for per-engine override based on request URL
    engine := pm.detectEngine(req.URL.Host)
    if engine != "" {
        proxyResult := pm.GetProxyForEngine(engine)
        if proxyResult.HasError() {
            return nil, proxyResult.Error()
        }

        return proxyResult.Value(), nil
    }
    
    proxyResult := pm.GetProxy()
    if proxyResult.HasError() {
        return nil, proxyResult.Error()
    }

    return proxyResult.Value(), nil
}

// detectEngine identifies the search engine from host
func (pm *ProxyManager) detectEngine(host string) string {
    switch {
    case contains(host, "google"):
        return "google"
    case contains(host, "bing"):
        return "bing"
    case contains(host, "duckduckgo"):
        return "duckduckgo"
    default:
        return ""
    }
}

// CreateSocks5Client creates an HTTP client with SOCKS5 proxy
func (pm *ProxyManager) CreateSocks5Client(proxyUrl *url.URL, timeout time.Duration) apperror.Result[*http.Client] {
    var auth *proxy.Auth
    if proxyUrl.User != nil {
        pass, _ := proxyUrl.User.Password()
        auth = &proxy.Auth{
            User:     proxyUrl.User.Username(),
            Password: pass,
        }
    }
    
    dialer, err := proxy.SOCKS5("tcp", proxyUrl.Host, auth, proxy.Direct)
    if err != nil {
        return apperror.Fail[*http.Client](
            apperror.Wrap(
                err,
                "failed to create SOCKS5 dialer",
            ),
        )
    }
    
    transport := &http.Transport{
        DialContext: func(context stdctx.Context, network, addr string) (net.Conn, error) { // EXEMPTED: net.Dialer signature
            return dialer.Dial(network, addr)
        },
    }
    
    if pm.config.SkipVerify {
        transport.TLSClientConfig = &tls.Config{InsecureSkipVerify: true}
    }
    
    return apperror.OK(&http.Client{
        Transport: transport,
        Timeout:   timeout,
    })
}

// healthCheckLoop periodically checks proxy health
func (pm *ProxyManager) healthCheckLoop() {
    interval := pm.config.Rotation.HealthCheck.Interval.Duration
    ticker := time.NewTicker(interval)
    defer ticker.Stop()
    
    // Initial check
    pm.checkAllProxies()
    
    for {
        select {
        case <-ticker.C:
            pm.checkAllProxies()
        case <-pm.healthStop:
            return
        }
    }
}

// checkAllProxies checks health of all configured proxies
func (pm *ProxyManager) checkAllProxies() {
    testUrl := pm.config.Rotation.HealthCheck.TestUrl
    timeout := pm.config.Rotation.HealthCheck.Timeout.Duration
    
    var wg sync.WaitGroup
    for _, entry := range pm.proxies {
        wg.Add(1)
        go func(e *ProxyEntry) {
            defer wg.Done()
            pm.checkProxyHealth(e, testUrl, timeout)
        }(entry)
    }
    wg.Wait()
}

// checkProxyHealth checks if a single proxy is working
func (pm *ProxyManager) checkProxyHealth(entry *ProxyEntry, testUrl string, timeout time.Duration) {
    proxyUrl := entry.Url
    if entry.Auth != nil {
        proxyUrl.User = entry.Auth
    }
    
    client := &http.Client{
        Transport: &http.Transport{
            Proxy: http.ProxyUrl(proxyUrl),
        },
        Timeout: timeout,
    }
    
    resp, err := client.Get(testUrl)
    
    entry.mu.Lock()
    defer entry.mu.Unlock()
    
    entry.LastCheck = time.Now()
    
    if err != nil {
        entry.FailCount++
        if entry.FailCount >= 3 {
            entry.Healthy = false
            log.Warn().
                Str("proxy", entry.Url.Host).
                Int64("failCount", entry.FailCount).
                Msg("Proxy marked unhealthy")
        }
    } else {
        resp.Body.Close()
        if resp.StatusCode == http.StatusOK {
            entry.Healthy = true
            entry.FailCount = 0
        }
    }
}

// MarkFailed marks a proxy as failed (for external failure reporting)
func (pm *ProxyManager) MarkFailed(proxyUrl *url.URL) {
    pm.mu.Lock()
    defer pm.mu.Unlock()
    
    for _, entry := range pm.proxies {
        if entry.Url.Host == proxyUrl.Host {
            entry.mu.Lock()
            entry.FailCount++
            if entry.FailCount >= 3 {
                entry.Healthy = false
            }
            entry.mu.Unlock()
            break
        }
    }
}

// Stop stops the proxy manager
func (pm *ProxyManager) Stop() {
    close(pm.healthStop)
}

// Stats returns proxy statistics
func (pm *ProxyManager) Stats() []ProxyStats {
    pm.mu.RLock()
    defer pm.mu.RUnlock()
    
    var stats []ProxyStats
    for _, entry := range pm.proxies {
        entry.mu.Lock()
        stats = append(stats, ProxyStats{
            Url:          entry.Url.String(),
            Healthy:      entry.Healthy,
            RequestCount: entry.RequestCount,
            FailCount:    entry.FailCount,
            LastCheck:    entry.LastCheck,
            Weight:       entry.Weight,
        })
        entry.mu.Unlock()
    }
    return stats
}

// ProxyStats contains proxy statistics
type ProxyStats struct {
    Url          string
    Healthy      bool
    RequestCount int64
    FailCount    int64
    LastCheck    time.Time
    Weight       float64
}

func contains(s, substr string) bool {
    return len(s) >= len(substr) && (s == substr || 
        len(s) > 0 && containsIgnoreCase(s, substr))
}

func containsIgnoreCase(s, substr string) bool {
    // Simple case-insensitive contains
    return len(s) >= len(substr) && 
        (s[:len(substr)] == substr || containsIgnoreCase(s[1:], substr))
}
```

---

## Configuration Loading

```go
package config

import (
    "fmt"

    "github.com/spf13/viper"
)

func Load(configPath string) apperror.Result[Config] {
    if configPath != "" {
        viper.SetConfigFile(configPath)
    } else {
        viper.SetConfigName("config")
        viper.SetConfigType("json")
        viper.AddConfigPath(".")
        viper.AddConfigPath("./config")
    }
    
    // Set defaults
    setDefaults()
    
    // Environment variable overrides
    viper.SetEnvPrefix("GSEARCH")
    viper.AutomaticEnv()
    
    // Read config file
    if err := viper.ReadInConfig(); err != nil {
        if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
            return apperror.Fail[Config](
                apperror.Wrap(
                    err,
                    "error reading config",
                ),
            )
        }
        // Config file not found, use defaults
    }
    
    var cfg Config
    if err := viper.Unmarshal(&cfg); err != nil {
        return apperror.Fail[Config](
            apperror.Wrap(
                err,
                "error unmarshaling config",
            ),
        )
    }
    
    if validationErr := cfg.Validate(); validationErr != nil {
        return apperror.Fail[Config](validationErr)
    }
    
    return apperror.Ok(cfg)
}

func setDefaults() {
    viper.SetDefault("database.path", "./data/search.db.sqlite")
    viper.SetDefault("database.maxConnections", 10)
    
    viper.SetDefault("search.defaultEngine", "google")
    viper.SetDefault("search.defaultMethod", "html")
    viper.SetDefault("search.requestDelay", "2s")
    viper.SetDefault("search.maxConcurrent", 5)
    viper.SetDefault("search.timeout", "30s")
    viper.SetDefault("search.maxRetries", 3)
    viper.SetDefault("search.retryDelay", "5s")
    
    // Default weights (sum to 1.0)
    viper.SetDefault("search.methodWeights", map[string]float64{
        "html":       0.40,
        "google_api": 0.30,
        "duckduckgo": 0.20,
        "bing":       0.10,
    })
    
    // Proxy defaults
    viper.SetDefault("proxy.enabled", false)
    viper.SetDefault("proxy.type", "http")
    viper.SetDefault("proxy.timeout", "10s")
    viper.SetDefault("proxy.skipVerify", false)
    viper.SetDefault("proxy.rotation.strategy", "round-robin")
    viper.SetDefault("proxy.rotation.healthCheck.enabled", true)
    viper.SetDefault("proxy.rotation.healthCheck.interval", "5m")
    viper.SetDefault("proxy.rotation.healthCheck.timeout", "10s")
    viper.SetDefault("proxy.rotation.healthCheck.testUrl", "https://httpbin.org/ip")
    
    viper.SetDefault("cache.enabled", true)
    viper.SetDefault("cache.ttlDays", 5)
    viper.SetDefault("cache.maxEntries", 10000)
    viper.SetDefault("cache.cleanupInterval", "24h")
    
    viper.SetDefault("nested.enabled", true)
    viper.SetDefault("nested.maxDepth", 3)
    
    viper.SetDefault("output.defaultFormat", "json")
    viper.SetDefault("output.saveToDb", true)
    viper.SetDefault("output.prettyPrint", true)
    
    viper.SetDefault("blocking.cooldown", "30m")
    
    viper.SetDefault("backoff.initialDelay", "1s")
    viper.SetDefault("backoff.maxDelay", "60s")
    viper.SetDefault("backoff.multiplier", 2.0)
    viper.SetDefault("backoff.jitter", 0.2)
    
    viper.SetDefault("selectors.path", "./configs/selectors.json")
    viper.SetDefault("selectors.fallbackToEmbedded", true)
    
    viper.SetDefault("shutdown.timeout", "30s")
    viper.SetDefault("shutdown.progressInterval", "5s")
    viper.SetDefault("shutdown.forceExitTimeout", "45s")
    
    viper.SetDefault("resources.maxGoroutines", 100)
    viper.SetDefault("resources.maxMemoryMB", 512)
    viper.SetDefault("resources.acquisitionTimeout", "10s")
}
```

---

## Environment Variables

| Variable | Config Path | Description |
|----------|-------------|-------------|
| `GSEARCH_DATABASE_PATH` | `database.path` | Database file path |
| `GSEARCH_SEARCH_REQUESTDELAY` | `search.requestDelay` | Request delay (e.g., "2s") |
| `GSEARCH_SEARCH_TIMEOUT` | `search.timeout` | Request timeout |
| `GSEARCH_CACHE_TTLDAYS` | `cache.ttlDays` | Cache TTL in days |
| `GSEARCH_PROXY_ENABLED` | `proxy.enabled` | Enable proxy |
| `GSEARCH_PROXY_URL` | `proxy.url` | Proxy URL |
| `PROXY_URL` | (external) | Proxy URL (alternative) |
| `PROXY_USERNAME` | (external) | Proxy username |
| `PROXY_PASSWORD` | (external) | Proxy password |
| `BING_API_KEY` | (external) | Bing API key |
| `GOOGLE_APPLICATION_CREDENTIALS` | (external) | Google API credentials |
| `GSEARCH_TOKEN_KEY` | (external) | OAuth token encryption key |

---

## Validation

```go
func (c *Config) Validate() *apperror.AppError {
    // Validate request delay
    if c.Search.RequestDelay.Duration < 500*time.Millisecond {
        return apperror.New(
            fmt.Sprintf("search.requestDelay must be >= 500ms, got %v", c.Search.RequestDelay),
        )
    }
    
    // Validate concurrency
    if c.Search.MaxConcurrent < 1 || c.Search.MaxConcurrent > 20 {
        return apperror.New(
            fmt.Sprintf("search.maxConcurrent must be 1-20, got %d", c.Search.MaxConcurrent),
        )
    }
    
    // Validate cache TTL
    if c.Cache.TTLDays < 1 {
        return apperror.New(
            fmt.Sprintf("cache.ttlDays must be >= 1, got %d", c.Cache.TTLDays),
        )
    }
    
    // Validate nested depth
    if c.Nested.MaxDepth < 1 || c.Nested.MaxDepth > 5 {
        return apperror.New(
            fmt.Sprintf("nested.maxDepth must be 1-5, got %d", c.Nested.MaxDepth),
        )
    }
    
    // Validate method weights
    if weightsErr := c.ValidateWeights(); weightsErr != nil {
        return weightsErr
    }
    
    // Validate backoff config
    if c.Backoff.Multiplier < 1.0 {
        return apperror.New(
            fmt.Sprintf("backoff.multiplier must be >= 1.0, got %f", c.Backoff.Multiplier),
        )
    }

    if c.Backoff.Jitter < 0.0 || c.Backoff.Jitter > 1.0 {
        return apperror.New(
            fmt.Sprintf("backoff.jitter must be 0.0-1.0, got %f", c.Backoff.Jitter),
        )
    }
    
    // Validate proxy config
    if proxyErr := c.ValidateProxy(); proxyErr != nil {
        return proxyErr
    }
    
    return nil
}

// ValidateWeights ensures all weights are 0.0-1.0 and sum to 1.0
func (c *Config) ValidateWeights() *apperror.AppError {
    var total float64
    for method, weight := range c.Search.MethodWeights {
        if weight < 0.0 || weight > 1.0 {
            return apperror.New(
                fmt.Sprintf("weight for %s must be 0.0-1.0, got %f", method, weight),
            )
        }
        total += weight
    }
    
    // Allow small floating point tolerance
    if math.Abs(total-1.0) > 0.001 {
        return apperror.New(
            fmt.Sprintf("search.methodWeights must sum to 1.0 (±0.001), got %f", total),
        )
    }
    
    return nil
}

// ValidateProxy validates proxy configuration
func (c *Config) ValidateProxy() *apperror.AppError {
    if !c.Proxy.Enabled {
        return nil
    }
    
    // Validate proxy type
    validTypes := map[string]bool{
        "http": true, "https": true, "socks5": true, "socks5h": true,
    }
    if !validTypes[c.Proxy.Type] {
        return apperror.New(
            fmt.Sprintf("proxy.type must be http/https/socks5/socks5h, got %s", c.Proxy.Type),
        )
    }
    
    // Validate rotation strategy
    if c.Proxy.Rotation.Enabled {
        validStrategies := map[string]bool{
            "round-robin": true, "random": true, "least-used": true,
            "failover": true, "weighted": true,
        }
        if !validStrategies[c.Proxy.Rotation.Strategy] {
            return apperror.New(
                "proxy.rotation.strategy must be one of: round-robin, random, least-used, failover, weighted",
            )
        }
        
        if len(c.Proxy.Rotation.Urls) == 0 {
            return apperror.New(
                "proxy.rotation.urls must have at least one proxy when rotation is enabled",
            )
        }
        
        // Validate weighted strategy has weights
        if c.Proxy.Rotation.Strategy == "weighted" {
            if len(c.Proxy.Rotation.Weights) == 0 {
                return apperror.New(
                    "proxy.rotation.weights required for weighted strategy",
                )
            }
        }
    } else if c.Proxy.Url == "" {
        return apperror.New(
            "proxy.url required when proxy is enabled without rotation",
        )
    }
    
    return nil
}
```

---

## Usage Examples

### Single Proxy

```json
{
  "proxy": {
    "enabled": true,
    "type": "http",
    "url": "http://proxy.example.com:8080",
    "timeout": "10s"
  }
}
```

### Proxy with Authentication

```json
{
  "proxy": {
    "enabled": true,
    "type": "http",
    "url": "http://proxy.example.com:8080",
    "auth": {
      "enabled": true,
      "username": "${PROXY_USERNAME}",
      "password": "${PROXY_PASSWORD}"
    }
  }
}
```

### SOCKS5 Proxy

```json
{
  "proxy": {
    "enabled": true,
    "type": "socks5",
    "url": "socks5://127.0.0.1:1080"
  }
}
```

### Proxy Rotation

```json
{
  "proxy": {
    "enabled": true,
    "rotation": {
      "enabled": true,
      "strategy": "round-robin",
      "urls": [
        "http://proxy1.example.com:8080",
        "http://proxy2.example.com:8080",
        "http://proxy3.example.com:8080"
      ],
      "healthCheck": {
        "enabled": true,
        "interval": "5m",
        "timeout": "10s"
      }
    }
  }
}
```

### Weighted Proxy Rotation

```json
{
  "proxy": {
    "enabled": true,
    "rotation": {
      "enabled": true,
      "strategy": "weighted",
      "urls": [
        "http://fast-proxy.example.com:8080",
        "http://slow-proxy.example.com:8080"
      ],
      "weights": {
        "http://fast-proxy.example.com:8080": 0.8,
        "http://slow-proxy.example.com:8080": 0.2
      }
    }
  }
}
```

---

## Related Specs

- [CLI Framework](./01-cli-framework.md) — Command integration, shutdown config
- [Method Switching](./08-method-switching.md) — Weight-based selection
- [HTML Parser](./04-html-parser.md) — Selector config, proxy usage
- [Error Codes](./15-error-codes.md) — Proxy error codes (4009-4011)
- [Remediation Plan](./14-remediation-plan.md) — Phase 6 implementation

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-28 | Initial configuration with Viper |
| 1.1.0 | 2026-01-28 | Normalized weights, standardized durations (Phase 1) |
| 1.2.0 | 2026-01-28 | Added proxy support with rotation strategies (Phase 6) |
