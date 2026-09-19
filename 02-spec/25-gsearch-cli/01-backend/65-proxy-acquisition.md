# Proxy Acquisition & Management

> **Version:** 2.0.0  
> **Status:** Draft  
> **Updated:** 2026-03-09  
> **Error Range:** 5300–5349  
> **Dependencies:** `64-stealth-scraping.md` (proxy classification), `63-captcha-handling.md` (cookie affinity)

---

## Purpose

Provide a unified proxy acquisition layer that sources, validates, rotates, and auto-replenishes proxies from multiple commercial providers while tracking per-request costs and enforcing budget limits.

---

## Provider Integration

### Supported Providers

| Provider | Enum Constant | Auth Method | Proxy Types | Bandwidth Model | Geo Targeting |
|----------|---------------|-------------|-------------|-----------------|---------------|
| BrightData | `proxyvendor.BrightData` | Zone + Password | Residential, Datacenter, ISP, Mobile | Per-GB | Country, State, City, ASN |
| Oxylabs | `proxyvendor.Oxylabs` | Username + Password | Residential, Datacenter, ISP | Per-GB (Residential), Per-IP (Datacenter) | Country, State, City |
| SmartProxy | `proxyvendor.SmartProxy` | Username + Password | Residential, Datacenter | Per-GB | Country, City |

### Provider Interface

```go
// proxyvendor/provider.go
type Provider interface {
    // Acquire returns a proxy endpoint for the given requirements
    Acquire(context context.Context, request AcquireRequest) apperror.Result[Proxy]
    
    // Release marks a proxy as no longer in use
    Release(context context.Context, proxyId string) *apperror.AppError
    
    // Balance returns remaining credit/bandwidth
    Balance(context context.Context) apperror.Result[BalanceInfo]
    
    // HealthCheck validates provider API connectivity
    HealthCheck(context context.Context) *apperror.AppError
    
    // Vendor returns the provider enum constant
    Vendor() Variant
}

type AcquireRequest struct {
    ProxyType   proxytype.Variant   // Residential, Datacenter, ISP, Mobile
    Country     string              // ISO 3166-1 alpha-2 (e.g., "US")
    State       string              // Optional: state/region
    City        string              // Optional: city
    SessionTTL  time.Duration       // Sticky session duration (0 = rotating)
    TargetHost  string              // Target domain for routing rules
}

type Proxy struct {
    ID          string
    Vendor      Variant
    Endpoint    string              // host:port
    Username    string
    Password    string
    ProxyType   proxytype.Variant
    Geo         GeoInfo
    SessionId   string              // For sticky sessions
    AcquiredAt  time.Time
    ExpiresAt   time.Time
}

type GeoInfo struct {
    Country string
    State   string
    City    string
    ASN     uint32
}

type BalanceInfo struct {
    Vendor          Variant
    RemainingGB     float64         // Bandwidth remaining (residential)
    RemainingIPs    int             // IPs remaining (datacenter plans)
    CreditUSD       float64         // Dollar balance
    ResetAt         time.Time       // Next billing cycle reset
}
```

---

## Proxy Classification

Extends the ASN-based classifier from `64-stealth-scraping.md` with acquisition-time metadata.

### Type Hierarchy

| Type | Enum Constant | Detection Method | Typical Cost/GB | Bot-Detection Risk |
|------|---------------|------------------|------------------|--------------------|
| Residential | `proxytype.Residential` | ISP ASN (non-hosting) | $8–15 | Low |
| ISP | `proxytype.ISP` | Static residential IP from ISP | $12–20 | Very Low |
| Mobile | `proxytype.Mobile` | Mobile carrier ASN (CGNAT) | $20–40 | Lowest |
| Datacenter | `proxytype.Datacenter` | Hosting/cloud ASN | $0.50–2 | High |

### Domain Routing Rules

```go
// Default routing table — overridable via config
var DefaultRouting = map[string]proxytype.Variant{
    "google.com":       proxytype.Residential,
    "google.*":         proxytype.Residential,  // All TLDs
    "bing.com":         proxytype.Datacenter,   // More tolerant
    "duckduckgo.com":   proxytype.Datacenter,
    "linkedin.com":     proxytype.Residential,
    "maps.google.com":  proxytype.Residential,
    "*":                proxytype.Datacenter,   // Default fallback
}
```

---

## Proxy Pool Manager

### Architecture

```
┌─────────────────────────────────────────────────┐
│                  PoolManager                     │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │BrightData│  │ Oxylabs  │  │SmartProxy │      │
│  │  Pool    │  │  Pool    │  │  Pool     │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │              │              │            │
│  ┌────▼──────────────▼──────────────▼────┐      │
│  │          Unified Proxy Ring           │      │
│  │  [R:US:1] [R:US:2] [D:EU:1] [M:US:1] │      │
│  └────────────────┬──────────────────────┘      │
│                   │                              │
│  ┌────────────────▼──────────────────────┐      │
│  │           Health Monitor              │      │
│  │  • Latency tracking (p50/p95/p99)     │      │
│  │  • Success rate per proxy             │      │
│  │  • Ban detection (403/429/CAPTCHA)    │      │
│  └────────────────┬──────────────────────┘      │
│                   │                              │
│  ┌────────────────▼──────────────────────┐      │
│  │        Auto-Replenishment             │      │
│  │  • Threshold: < 20% healthy proxies   │      │
│  │  • Batch acquire from cheapest vendor │      │
│  │  • Budget gate before acquisition     │      │
│  └───────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

### Pool Manager Interface

```go
type PoolManager struct {
    providers   map[proxyvendor.Variant]Provider
    pools       map[proxytype.Variant]*ProxyRing
    health      *HealthMonitor
    costTracker *CostTracker
    config      PoolConfig
    mu          sync.RWMutex
}

type PoolConfig struct {
    // Pool sizing
    MinPoolSize         int             `yaml:"min_pool_size" default:"5"`
    MaxPoolSize         int             `yaml:"max_pool_size" default:"50"`
    ReplenishThreshold  float64         `yaml:"replenish_threshold" default:"0.2"` // 20%
    
    // Health checking
    HealthCheckInterval time.Duration   `yaml:"health_check_interval" default:"30s"`
    MaxConsecutiveFails int             `yaml:"max_consecutive_fails" default:"3"`
    BanCooldown         time.Duration   `yaml:"ban_cooldown" default:"10m"`
    
    // Vendor priority (lower = preferred)
    VendorPriority      []proxyvendor.Variant `yaml:"vendor_priority"`
    
    // Budget limits
    DailyBudgetUSD      float64         `yaml:"daily_budget_usd" default:"10.0"`
    MonthlyBudgetUSD    float64         `yaml:"monthly_budget_usd" default:"200.0"`
}
```

---

## Auto-Replenishment

### Trigger Conditions

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Healthy pool depleted | < `ReplenishThreshold` × `MinPoolSize` | Batch acquire from next vendor in priority |
| Consecutive bans on domain | ≥ 3 bans in 5 min for same domain | Escalate proxy type (Datacenter → Residential → Mobile) |
| Provider balance low | < $1.00 remaining | Switch to next vendor, emit warning |
| All providers exhausted | 0 healthy proxies across all vendors | Return `ErrNoProxiesAvailable` (5310), pause scraping |

### Replenishment Flow

```
Trigger detected
    │
    ▼
Check budget gate ──► Over budget? → Return ErrBudgetExceeded (5320)
    │
    ▼
Select vendor (priority order)
    │
    ▼
Check vendor balance ──► Insufficient? → Next vendor
    │
    ▼
Batch acquire (min 5 proxies)
    │
    ▼
Validate each proxy (latency + connectivity test)
    │
    ▼
Add healthy proxies to pool ring
    │
    ▼
Log acquisition: vendor, count, cost, proxy_type
```

### Health Monitor

```go
type ProxyHealth struct {
    ProxyId             string
    ConsecutiveFails    int
    TotalRequests       int64
    SuccessCount        int64
    LatencyP50          time.Duration
    LatencyP95          time.Duration
    LatencyP99          time.Duration
    LastUsed            time.Time
    LastFail            time.Time
    BannedDomains       map[string]time.Time  // domain → ban expiry
    BytesTransferred    int64
}

// IsHealthy returns true if the proxy is usable for the given domain
func (h *ProxyHealth) IsHealthy(domain string) bool {
    if h.ConsecutiveFails >= maxConsecutiveFails {
        return false
    }
    if banExpiry, banned := h.BannedDomains[domain]; banned {
        return time.Now().After(banExpiry)
    }
    return true
}
```

---

## Cost Tracking

### Per-Request Cost Model

```go
type RequestCost struct {
    ID              string
    Timestamp       time.Time
    ProxyId         string
    Vendor          proxyvendor.Variant
    ProxyType       proxytype.Variant
    TargetDomain    string
    BytesSent       int64
    BytesReceived   int64
    CostUSD         float64             // Calculated from vendor rate
    Latency         time.Duration
    StatusCode      int
    CaptchaSolved   bool                // Links to 63-captcha-handling.md cost
    CaptchaCostUSD  float64
}
```

### Vendor Rate Table

| Vendor | Proxy Type | Rate | Unit | Minimum |
|--------|------------|------|------|---------|
| BrightData | Residential | $8.40 | per GB | $500/mo |
| BrightData | Datacenter | $0.60 | per GB | $500/mo |
| BrightData | ISP | $12.00 | per GB | $500/mo |
| BrightData | Mobile | $24.00 | per GB | $500/mo |
| Oxylabs | Residential | $10.00 | per GB | $300/mo |
| Oxylabs | Datacenter | $1.20 | per IP/day | 100 IPs min |
| SmartProxy | Residential | $8.50 | per GB | $200/mo |
| SmartProxy | Datacenter | $0.80 | per GB | $200/mo |

### Cost Aggregation

```go
type CostTracker struct {
    db          *gorm.DB
    mu          sync.Mutex
    dailySpend  float64
    monthlySpend float64
}

type CostReport struct {
    Period          string                          // "daily" | "monthly"
    TotalUSD        float64
    ByVendor        map[proxyvendor.Variant]float64
    ByProxyType     map[proxytype.Variant]float64
    ByDomain        map[string]float64
    RequestCount    int64
    TotalBytesGB    float64
    CaptchaCostUSD  float64                         // From 63-captcha-handling.md
    AvgCostPerReq   float64
    BudgetRemaining float64
}
```

### CLI Cost Commands

```bash
# View today's spend
gsearch proxy cost --period today

# Monthly breakdown by vendor
gsearch proxy cost --period month --group-by vendor

# Set budget alert
gsearch proxy budget --daily 15.00 --monthly 300.00

# Estimate cost for a scraping job
gsearch proxy estimate --urls 10000 --type residential --target google.com
```

---

## Storage

### Split DB Pattern

Path: `data/{app}/proxy/`

| Database | Contents | TTL |
|----------|----------|-----|
| `pool.db` | Active proxy inventory, health stats | Persistent |
| `cost.db` | Per-request cost records | 90 days |
| `bans.db` | Domain-proxy ban mappings | Configurable (default: 24h) |

### Schema (GORM Models)

```go
type ProxyRecord struct {
    ID          string              `gorm:"primaryKey"`
    Vendor      string              `gorm:"index"`
    ProxyType   string              `gorm:"index"`
    Endpoint    string
    Geo         string              // JSON-encoded GeoInfo
    AcquiredAt  time.Time
    ExpiresAt   time.Time
    IsHealthy   bool                `gorm:"index"`
    HealthJson  string              // JSON-encoded ProxyHealth
}

type CostRecord struct {
    ID              uint            `gorm:"primaryKey;autoIncrement"`
    Timestamp       time.Time       `gorm:"index"`
    ProxyId         string          `gorm:"index"`
    Vendor          string          `gorm:"index"`
    ProxyType       string
    TargetDomain    string          `gorm:"index"`
    BytesTotal      int64
    CostUSD         float64
    CaptchaCostUSD  float64
    StatusCode      int
}

type BanRecord struct {
    ProxyId     string          `gorm:"primaryKey"`
    Domain      string          `gorm:"primaryKey"`
    BannedAt    time.Time
    ExpiresAt   time.Time       `gorm:"index"`
    Reason      string          // "403" | "429" | "captcha" | "empty_results"
}
```

---

## Configuration

```yaml
# gsearch.yaml
proxy:
  enabled: true
  
  vendors:
    brightdata:
      enabled: true
      zone: "serp_zone1"
      username: "${BRIGHTDATA_USER}"
      password: "${BRIGHTDATA_PASS}"
      host: "brd.superproxy.io"
      port: 22225
      priority: 1
      
    oxylabs:
      enabled: true
      username: "${OXYLABS_USER}"
      password: "${OXYLABS_PASS}"
      host: "pr.oxylabs.io"
      port: 7777
      priority: 2
      
    smartproxy:
      enabled: false
      username: "${SMARTPROXY_USER}"
      password: "${SMARTPROXY_PASS}"
      host: "gate.smartproxy.com"
      port: 7000
      priority: 3
  
  pool:
    min_size: 5
    max_size: 50
    replenish_threshold: 0.2
    health_check_interval: 30s
    max_consecutive_fails: 3
    ban_cooldown: 10m
  
  budget:
    daily_usd: 10.00
    monthly_usd: 200.00
    alert_threshold: 0.8       # Alert at 80% of budget
  
  routing:
    google.com: residential
    bing.com: datacenter
    duckduckgo.com: datacenter
    default: datacenter
```

---

## Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| 5300 | `ErrProxyAcquireFailed` | Failed to acquire proxy from vendor API |
| 5301 | `ErrProxyAuthFailed` | Vendor authentication rejected |
| 5302 | `ErrProxyTimeout` | Proxy connection timed out |
| 5303 | `ErrProxyBanned` | Proxy IP banned by target domain |
| 5310 | `ErrNoProxiesAvailable` | All proxies exhausted across all vendors |
| 5311 | `ErrNoHealthyProxies` | Pool exists but no healthy proxies for target |
| 5312 | `ErrProxyTypeUnavailable` | Requested proxy type not available from any vendor |
| 5320 | `ErrBudgetExceeded` | Daily or monthly budget limit reached |
| 5321 | `ErrBudgetAlertThreshold` | Spending exceeded alert threshold (warning) |
| 5322 | `ErrVendorBalanceLow` | Vendor account balance below $1.00 |
| 5330 | `ErrHealthCheckFailed` | Proxy health check failed |
| 5331 | `ErrReplenishFailed` | Auto-replenishment could not acquire proxies |
| 5340 | `ErrCostTrackingFailed` | Failed to record cost data |
| 5341 | `ErrCostReportFailed` | Failed to generate cost report |

---

## Acceptance Criteria

### PA-01: Provider Acquisition

**GIVEN** BrightData credentials are configured  
**WHEN** a residential proxy is requested for `google.com`  
**THEN** a proxy is acquired via the BrightData API with geo targeting  
**AND** the proxy is validated with a connectivity test before use

### PA-02: Auto-Replenishment

**GIVEN** the healthy proxy pool drops below 20% of minimum size  
**WHEN** the health monitor detects the threshold breach  
**THEN** proxies are batch-acquired from the highest-priority vendor with budget remaining  
**AND** each proxy is health-checked before pool insertion

### PA-03: Budget Enforcement

**GIVEN** daily spend reaches the configured budget limit  
**WHEN** a new proxy request is made  
**THEN** `ErrBudgetExceeded` (5320) is returned  
**AND** no further proxy acquisitions occur until the next day

### PA-04: Failover

**GIVEN** the primary vendor (BrightData) returns an auth error  
**WHEN** a proxy is requested  
**THEN** the system falls back to the next vendor in priority order (Oxylabs)  
**AND** the failure is logged with error code 5301

### PA-05: Cost Tracking

**GIVEN** a scraping request completes through a proxy  
**WHEN** the response is received  
**THEN** bytes transferred are recorded  
**AND** cost is calculated using the vendor rate table  
**AND** the cost record is persisted to `cost.db`

### PA-06: Ban Detection & Cooldown

**GIVEN** a proxy receives 3 consecutive 403 responses from `google.com`  
**WHEN** the health monitor processes the failures  
**THEN** the proxy is marked as banned for `google.com` with a 10-minute cooldown  
**AND** the proxy remains available for other domains

---

## Cross-References

| Spec | Relationship |
|------|-------------|
| `63-captcha-handling.md` | CAPTCHA solve costs included in cost tracking |
| `64-stealth-scraping.md` | Proxy classification (ASN-based) and domain routing |
| `08-method-switching.md` | Engine fallback may trigger proxy type escalation |
| `10-caching-system.md` | Cached responses bypass proxy usage entirely |
| `22-database-architecture.md` | Split DB storage pattern |

---

*Proxy acquisition layer for GSearch anti-bot infrastructure.*
