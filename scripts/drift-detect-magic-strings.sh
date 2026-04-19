#!/bin/bash
# drift-detect-magic-strings.sh
# RISK-002: Magic String Key Detector
# Exit code: 0 = clean, 1 = violations found

VIOLATIONS=$(grep -rn \
  -e 'GetString("' \
  -e 'GetInt("' \
  -e 'GetBool("' \
  -e 'GetStringArray("' \
  -e 'GetJSON("' \
  --include="*.go" \
  ./internal/ ./pkg/ 2>/dev/null \
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
