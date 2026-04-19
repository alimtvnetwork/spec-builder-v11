# License Manager: Data Models

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09

---

## Overview

All data models use GORM with `BaseModel` and `TimestampModel` abstractions. Table names are PascalCase singular. JSON wire format uses PascalCase to match database columns.

---

## Database: `data/license-manager/licenses.db`

### License

Primary license record.

```go
type License struct {
    BaseModel
    TimestampModel
    LicenseKey      string          `gorm:"column:LicenseKey;uniqueIndex:IdxLicenseKey;not null" json:"LicenseKey"`
    KeyHash         string          `gorm:"column:KeyHash;uniqueIndex:IdxKeyHash;not null" json:"-"`
    Product         string          `gorm:"column:Product;index:IdxLicenseProduct;not null" json:"Product"`
    LicenseType     LicenseType     `gorm:"column:LicenseType;not null" json:"LicenseType"`
    Status          LicenseStatusType `gorm:"column:Status;index:IdxLicenseStatus;not null;default:'Active'" json:"Status"`
    MaxSeats        int             `gorm:"column:MaxSeats;not null;default:1" json:"MaxSeats"`
    Features        string          `gorm:"column:Features;type:text" json:"Features"`
    ExpiresAt       *time.Time      `gorm:"column:ExpiresAt;index:IdxLicenseExpiry" json:"ExpiresAt"`
    IssuedTo        string          `gorm:"column:IssuedTo" json:"IssuedTo"`
    RevokedAt       *time.Time      `gorm:"column:RevokedAt" json:"RevokedAt"`
    RevocationReason string         `gorm:"column:RevocationReason" json:"RevocationReason"`
    HmacSignature   string          `gorm:"column:HmacSignature;not null" json:"-"`
}

func (License) TableName() string { return "License" }
```

### Activation

Machine-license binding.

```go
type Activation struct {
    BaseModel
    TimestampModel
    LicenseId       string    `gorm:"column:LicenseId;index:IdxActivationLicense;not null" json:"LicenseId"`
    FingerprintId   string    `gorm:"column:FingerprintId;index:IdxActivationFingerprint;not null" json:"FingerprintId"`
    Label           string    `gorm:"column:Label" json:"Label"`
    ActivatedAt     time.Time `gorm:"column:ActivatedAt;not null" json:"ActivatedAt"`
    DeactivatedAt   *time.Time `gorm:"column:DeactivatedAt" json:"DeactivatedAt"`
    IsActive        bool      `gorm:"column:IsActive;index:IdxActivationActive;not null;default:true" json:"IsActive"`
}

func (Activation) TableName() string { return "Activation" }
```

### MachineFingerprint

Machine identity record.

```go
type MachineFingerprint struct {
    BaseModel
    TimestampModel
    FingerprintHash string `gorm:"column:FingerprintHash;uniqueIndex:IdxFingerprintHash;not null" json:"FingerprintHash"`
    Hostname        string `gorm:"column:Hostname" json:"Hostname"`
    OperatingSystem string `gorm:"column:OperatingSystem" json:"OperatingSystem"`
    Architecture    string `gorm:"column:Architecture" json:"Architecture"`
    HardwareId      string `gorm:"column:HardwareId" json:"HardwareId"`
    LastSeenAt      time.Time `gorm:"column:LastSeenAt" json:"LastSeenAt"`
}

func (MachineFingerprint) TableName() string { return "MachineFingerprint" }
```

---

## Database: `data/license-manager/usage.db`

### UsageRecord

Feature usage metering.

```go
type UsageRecord struct {
    BaseModel
    TimestampModel
    LicenseId   string    `gorm:"column:LicenseId;index:IdxUsageLicense;not null" json:"LicenseId"`
    FeatureKey  string    `gorm:"column:FeatureKey;index:IdxUsageFeature;not null" json:"FeatureKey"`
    Count       int64     `gorm:"column:Count;not null;default:0" json:"Count"`
    Limit       int64     `gorm:"column:Limit;not null;default:-1" json:"Limit"`
    PeriodStart time.Time `gorm:"column:PeriodStart;not null" json:"PeriodStart"`
    PeriodEnd   time.Time `gorm:"column:PeriodEnd;not null" json:"PeriodEnd"`
}

func (UsageRecord) TableName() string { return "UsageRecord" }
```

### ExpirationAlert

Expiration notification tracking.

```go
type ExpirationAlert struct {
    BaseModel
    TimestampModel
    LicenseId     string    `gorm:"column:LicenseId;index:IdxAlertLicense;not null" json:"LicenseId"`
    AlertType     AlertType `gorm:"column:AlertType;not null" json:"AlertType"`
    DaysRemaining int       `gorm:"column:DaysRemaining;not null" json:"DaysRemaining"`
    NotifiedAt    time.Time `gorm:"column:NotifiedAt;not null" json:"NotifiedAt"`
    Acknowledged  bool      `gorm:"column:Acknowledged;not null;default:false" json:"Acknowledged"`
}

func (ExpirationAlert) TableName() string { return "ExpirationAlert" }
```

---

## Enums

### LicenseType

```go
type LicenseType byte

const (
    LicenseTypeTrial        LicenseType = iota // Trial
    LicenseTypeStandard                        // Standard
    LicenseTypeProfessional                    // Professional
    LicenseTypeEnterprise                      // Enterprise
)
```

### LicenseStatusType

```go
type LicenseStatusType byte

const (
    LicenseStatusTypeActive  LicenseStatusType = iota // Active
    LicenseStatusTypeExpired                          // Expired
    LicenseStatusTypeRevoked                          // Revoked
    LicenseStatusTypeSuspended                        // Suspended
)
```

### AlertType

```go
type AlertType byte

const (
    AlertType30Day AlertType = iota // 30Day
    AlertType7Day                   // 7Day
    AlertType1Day                   // 1Day
    AlertTypeExpired                // Expired
)
```

---

## Index Summary

| Index | Table | Column(s) | Type |
|-------|-------|-----------|------|
| IdxLicenseKey | License | LicenseKey | Unique |
| IdxKeyHash | License | KeyHash | Unique |
| IdxLicenseProduct | License | Product | Standard |
| IdxLicenseStatus | License | Status | Standard |
| IdxLicenseExpiry | License | ExpiresAt | Standard |
| IdxActivationLicense | Activation | LicenseId | Standard |
| IdxActivationFingerprint | Activation | FingerprintId | Standard |
| IdxActivationActive | Activation | IsActive | Standard |
| IdxFingerprintHash | MachineFingerprint | FingerprintHash | Unique |
| IdxUsageLicense | UsageRecord | LicenseId | Standard |
| IdxUsageFeature | UsageRecord | FeatureKey | Standard |
| IdxAlertLicense | ExpirationAlert | LicenseId | Standard |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Overview | `./00-overview.md` |
| Architecture | `./01-architecture.md` |
| Error Handling | `./04-error-handling.md` |
| Database Standards | `.lovable/memories/architecture/database-standards.md` |
