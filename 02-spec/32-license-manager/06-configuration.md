# License Manager: Configuration

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09

---

## Overview

Configuration follows the seedable config architecture. Default values are loaded from `config.seed.json` into the root database at first launch.

---

## Configuration Keys

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `Lm.DbPath` | string | `data/license-manager/` | Database directory path |
| `Lm.KeyLength` | int | 128 | License key bit length |
| `Lm.KeyFormat` | string | `XXXXX-XXXXX-XXXXX-XXXXX-XXXXX` | Display format for keys |
| `Lm.DefaultExpiry` | duration | `8760h` (1 year) | Default license duration |
| `Lm.DefaultSeats` | int | 1 | Default seat count |
| `Lm.HmacSecret` | string | (generated) | HMAC signing secret |
| `Lm.RemoteValidation.Enabled` | bool | false | Enable remote server validation |
| `Lm.RemoteValidation.Url` | string | — | Remote licensing server URL |
| `Lm.RemoteValidation.Timeout` | duration | `10s` | Remote validation timeout |
| `Lm.Alerts.30Day` | bool | true | Enable 30-day expiry alerts |
| `Lm.Alerts.7Day` | bool | true | Enable 7-day expiry alerts |
| `Lm.Alerts.1Day` | bool | true | Enable 1-day expiry alerts |

---

## Seedable Config Example

```json
{
  "Lm.DbPath": "data/license-manager/",
  "Lm.KeyLength": 128,
  "Lm.KeyFormat": "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
  "Lm.DefaultExpiry": "8760h",
  "Lm.DefaultSeats": 1,
  "Lm.RemoteValidation.Enabled": false,
  "Lm.RemoteValidation.Timeout": "10s",
  "Lm.Alerts.30Day": true,
  "Lm.Alerts.7Day": true,
  "Lm.Alerts.1Day": true
}
```

---

## Config File Location

| Platform | Path |
|----------|------|
| Linux/macOS | `~/.lm/config.yaml` |
| Windows | `%APPDATA%\lm\config.yaml` |
| Override | `--config <path>` flag |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Overview | `./00-overview.md` |
| Architecture | `./01-architecture.md` |
| Seedable Config Architecture | `02-spec/07-seedable-config-architecture/00-overview.md` |
