#!/bin/bash
# drift-detect-seed-sync.sh
# RISK-003: Seed File Sync Validator
# Exit code: 0 = clean, 1 = mismatch found

KEYS_FILE="pkg/settings/keys.go"
SEED_FILE="config.seed.json"

if [ ! -f "$KEYS_FILE" ] && [ ! -f "$SEED_FILE" ]; then
  echo "ℹ️  RISK-003: Neither $KEYS_FILE nor $SEED_FILE found — skipping"
  exit 0
fi

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
