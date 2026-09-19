# License Manager: CLI Interface

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09

---

## Overview

The License Manager CLI (`lm`) uses Cobra for command registration. All commands follow the project-wide CLI conventions with consistent flag naming and output formatting.

---

## Command Tree

```
lm
├── generate        # Generate a new license key
├── activate        # Activate a license on this machine
├── deactivate      # Deactivate a license from this machine
├── validate        # Validate a license key
├── list            # List all licenses
├── revoke          # Revoke a license key
├── renew           # Renew an expiring license
├── usage           # View usage metering
│   ├── report      # Generate usage report
│   └── reset       # Reset usage counters
├── fingerprint     # Show this machine's fingerprint
├── config          # Configuration management
│   ├── show        # Show current configuration
│   └── set         # Update configuration
└── version         # Show CLI version
```

---

## Commands

### `lm generate`

Generate a new license key.

```bash
lm generate --product <product> --type <type> [--seats <n>] [--expires <date>] [--features <list>]
```

| Flag | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `--product` | string | ✅ | — | Product identifier (e.g., `gsearch`, `brun`) |
| `--type` | LicenseType | ✅ | — | `Trial`, `Standard`, `Professional`, `Enterprise` |
| `--seats` | int | ❌ | 1 | Maximum concurrent activations |
| `--expires` | date | ❌ | +1 year | Expiration date (ISO 8601) |
| `--features` | []string | ❌ | all | Comma-separated feature keys |
| `--output` | string | ❌ | `text` | Output format: `text`, `json` |

### `lm activate`

Activate a license on the current machine.

```bash
lm activate --key <license-key> [--name <label>]
```

| Flag | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `--key` | string | ✅ | — | License key to activate |
| `--name` | string | ❌ | hostname | Human-readable label for this activation |

### `lm deactivate`

Deactivate a license from the current machine.

```bash
lm deactivate --key <license-key> [--force]
```

| Flag | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `--key` | string | ✅ | — | License key to deactivate |
| `--force` | bool | ❌ | false | Skip confirmation prompt |

### `lm validate`

Validate a license key's current status.

```bash
lm validate --key <license-key> [--online] [--verbose]
```

| Flag | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `--key` | string | ✅ | — | License key to validate |
| `--online` | bool | ❌ | false | Force remote server validation |
| `--verbose` | bool | ❌ | false | Show detailed validation breakdown |

### `lm list`

List all registered licenses.

```bash
lm list [--product <product>] [--status <status>] [--output <format>]
```

| Flag | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `--product` | string | ❌ | all | Filter by product |
| `--status` | StatusType | ❌ | all | Filter: `Active`, `Expired`, `Revoked`, `Trial` |
| `--output` | string | ❌ | `table` | Output format: `table`, `json`, `csv` |

### `lm revoke`

Permanently revoke a license.

```bash
lm revoke --key <license-key> [--reason <text>]
```

### `lm usage report`

Generate a usage report.

```bash
lm usage report --key <license-key> [--from <date>] [--to <date>] [--output <format>]
```

### `lm fingerprint`

Display the current machine's fingerprint.

```bash
lm fingerprint [--output <format>]
```

---

## Global Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--config` | string | `~/.lm/config.yaml` | Config file path |
| `--db-path` | string | `data/license-manager/` | Database directory |
| `--quiet` | bool | false | Suppress non-essential output |
| `--debug` | bool | false | Enable debug logging |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Overview | `./00-overview.md` |
| Architecture | `./01-architecture.md` |
| Data Models | `./03-data-models.md` |
| Error Handling | `./04-error-handling.md` |
