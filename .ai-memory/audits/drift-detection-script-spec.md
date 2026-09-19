# Compliance Drift Detection Script Specification

**Version:** 1.0.0  
**Created:** 2026-03-03  
**Status:** Implemented  
**Covers:** RISK-001, RISK-002, RISK-003

---

## Overview

This specification defines three automated drift detection scripts targeting the highest-priority compliance risks identified in the [Compliance Risk Matrix](./compliance-risk-matrix.md). These scripts are designed to run as pre-commit hooks and CI pipeline steps.

---

## Script 1: Raw SQL Bypass Detector (RISK-001)

**Risk:** Developer adds raw SQL outside `DBOperation` wrapper, bypassing structured logging and `AffectedRows` validation.

### Detection Logic

```bash
#!/bin/bash
# drift-detect-raw-sql.sh
# Exit code: 0 = clean, 1 = violations found

VIOLATIONS=$(grep -rn \
  -e "db\.Exec" \
  -e "db\.Raw" \
  -e "INSERT INTO" \
  -e "UPDATE .* SET" \
  -e "DELETE FROM" \
  --include="*.go" \
  ./internal/ ./pkg/ \
  | grep -v "_test.go" \
  | grep -v "/migrations/" \
  | grep -v "// drift-exempt:" \
)

if [ -n "$VIOLATIONS" ]; then
  echo "❌ RISK-001: Raw SQL detected outside DBOperation wrapper"
  echo ""
  echo "$VIOLATIONS"
  echo ""
  echo "Remediation: Wrap all database operations with database.NewDBOperation()"
  exit 1
fi

echo "✅ RISK-001: No raw SQL violations found"
exit 0
```

### Exemption Mechanism

Lines containing `// drift-exempt: <justification>` are excluded. Valid justifications:

| Justification | Example |
|---------------|---------|
| `fts5` | FTS5 virtual table operations (SQLite limitation) |
| `vector` | Vector storage operations (no ORM support) |
| `cte` | Complex CTEs with documented rationale |

### CI Integration

```yaml
# .github/workflows/compliance.yml (excerpt)
- name: RISK-001 Raw SQL Detection
  run: bash scripts/drift-detect-raw-sql.sh
```

---

## Script 2: Magic String Key Detector (RISK-002)

**Risk:** Settings accessed via inline string literals instead of typed constants from `pkg/settings/keys.go`.

### Detection Logic

```bash
#!/bin/bash
# drift-detect-magic-strings.sh
# Exit code: 0 = clean, 1 = violations found

# Find all Get*(key) calls that use literal strings instead of Key* constants
VIOLATIONS=$(grep -rn \
  -e 'GetString("' \
  -e 'GetInt("' \
  -e 'GetBool("' \
  -e 'GetStringArray("' \
  -e 'GetJSON("' \
  --include="*.go" \
  ./internal/ ./pkg/ \
  | grep -v "_test.go" \
  | grep -v "keys.go" \
  | grep -v "// drift-exempt:" \
)

if [ -n "$VIOLATIONS" ]; then
  echo "❌ RISK-002: Magic string configuration keys detected"
  echo ""
  echo "$VIOLATIONS"
  echo ""
  echo "Remediation: Define key in pkg/settings/keys.go as a typed constant"
  echo "Example: const KeyMyFeature = \"my.feature.enabled\""
  exit 1
fi

echo "✅ RISK-002: No magic string violations found"
exit 0
```

### CI Integration

```yaml
- name: RISK-002 Magic String Detection
  run: bash scripts/drift-detect-magic-strings.sh
```

---

## Script 3: Seed File Sync Validator (RISK-003)

**Risk:** New setting constant added to code but missing from `config.seed.json`, causing first-run failures.

### Detection Logic

```bash
#!/bin/bash
# drift-detect-seed-sync.sh
# Exit code: 0 = clean, 1 = mismatch found

KEYS_FILE="pkg/settings/keys.go"
SEED_FILE="config.seed.json"

if [ ! -f "$KEYS_FILE" ]; then
  echo "⚠️  Keys file not found: $KEYS_FILE"
  exit 1
fi

if [ ! -f "$SEED_FILE" ]; then
  echo "⚠️  Seed file not found: $SEED_FILE"
  exit 1
fi

# Extract constant values from keys.go
CODE_KEYS=$(grep -oP '=\s*"([^"]+)"' "$KEYS_FILE" | sed 's/= *"//;s/"//' | sort)

# Extract keys from config.seed.json
SEED_KEYS=$(jq -r '.settings[].key' "$SEED_FILE" | sort)

# Diff
MISSING_FROM_SEED=$(comm -23 <(echo "$CODE_KEYS") <(echo "$SEED_KEYS"))
MISSING_FROM_CODE=$(comm -13 <(echo "$CODE_KEYS") <(echo "$SEED_KEYS"))

HAS_ERROR=0

if [ -n "$MISSING_FROM_SEED" ]; then
  echo "❌ RISK-003: Constants defined in code but missing from config.seed.json:"
  echo "$MISSING_FROM_SEED" | sed 's/^/  - /'
  HAS_ERROR=1
fi

if [ -n "$MISSING_FROM_CODE" ]; then
  echo "⚠️  Keys in config.seed.json with no matching constant (review recommended):"
  echo "$MISSING_FROM_CODE" | sed 's/^/  - /'
fi

if [ "$HAS_ERROR" -eq 0 ]; then
  echo "✅ RISK-003: Code constants and seed file are in sync"
  exit 0
fi

echo ""
echo "Remediation: Add missing keys to config.seed.json with key, value, category, valueType"
exit 1
```

### CI Integration

```yaml
- name: RISK-003 Seed File Sync
  run: bash scripts/drift-detect-seed-sync.sh
```

---

## Unified Runner

A single entrypoint script runs all three detectors and reports a combined result.

```bash
#!/bin/bash
# drift-detect-all.sh

FAILED=0

echo "═══════════════════════════════════════"
echo "  Compliance Drift Detection Suite"
echo "═══════════════════════════════════════"
echo ""

bash scripts/drift-detect-raw-sql.sh || FAILED=1
echo ""
bash scripts/drift-detect-magic-strings.sh || FAILED=1
echo ""
bash scripts/drift-detect-seed-sync.sh || FAILED=1

echo ""
echo "═══════════════════════════════════════"
if [ "$FAILED" -eq 0 ]; then
  echo "  ✅ All drift checks passed"
else
  echo "  ❌ One or more drift checks failed"
fi
echo "═══════════════════════════════════════"

exit $FAILED
```

---

## Pre-Commit Hook Integration

```bash
# .husky/pre-commit (append)
bash scripts/drift-detect-all.sh
```

---

## CI Pipeline Integration

```yaml
# .github/workflows/compliance.yml
name: Compliance Drift Detection

on:
  pull_request:
    paths:
      - 'internal/**'
      - 'pkg/**'
      - 'config.seed.json'

jobs:
  drift-detection:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install jq
        run: sudo apt-get install -y jq

      - name: Run Drift Detection Suite
        run: bash scripts/drift-detect-all.sh
```

---

## File Manifest

| Script | Path | Covers |
|--------|------|--------|
| Raw SQL Detector | `scripts/drift-detect-raw-sql.sh` | RISK-001 |
| Magic String Detector | `scripts/drift-detect-magic-strings.sh` | RISK-002 |
| Seed Sync Validator | `scripts/drift-detect-seed-sync.sh` | RISK-003 |
| Unified Runner | `scripts/drift-detect-all.sh` | All |

---

## Related Documents

| Document | Path |
|----------|------|
| Compliance Risk Matrix | [compliance-risk-matrix.md](./compliance-risk-matrix.md) |
| Compliance Dashboard | [00-compliance-dashboard.md](./00-compliance-dashboard.md) |
| Unified Preflight Checklist | `.lovable/memories/standards/unified-preflight-checklist.md` |
| Quarterly Re-Audit Schedule | [quarterly-reaudit-schedule.md](./quarterly-reaudit-schedule.md) |

---

*Specification created 2026-03-03. Scripts should be implemented and integrated into CI before Q2 2026 re-audit window.*
