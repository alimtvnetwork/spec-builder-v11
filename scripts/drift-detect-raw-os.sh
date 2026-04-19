#!/bin/bash
# drift-detect-raw-os.sh
# Issue #18 Cat 4+5: Raw Filesystem — detects raw os.* calls and os.IsNotExist
# Exit code: 0 = within baseline, 1 = drift detected

BASELINE_OS=10
BASELINE_ISNOTEXIST=0
LABEL_OS="CAT-4 (raw os.*)"
LABEL_INE="CAT-5 (os.IsNotExist)"

COUNT_OS=$(grep -rn -E "os\.(Remove|Stat|MkdirAll|WriteFile|ReadFile|Rename|RemoveAll|Open)\b" \
  --include="*.md" \
  ./spec/ 2>/dev/null \
  | grep -v "spec/22-how-app-issues-track/" \
  | grep -v "spec/23-coding-guidelines/" \
  | grep -v "spec/25-golang-standards/" \
  | grep -v "spec/30-generic-enforce/" \
  | grep -v "// drift-exempt:" \
  | grep -v "❌" \
  | wc -l)

COUNT_INE=$(grep -rn "os\.IsNotExist" \
  --include="*.md" \
  ./spec/ 2>/dev/null \
  | grep -v "spec/22-how-app-issues-track/" \
  | grep -v "spec/23-coding-guidelines/" \
  | grep -v "spec/25-golang-standards/" \
  | grep -v "spec/30-generic-enforce/" \
  | grep -v "// drift-exempt:" \
  | grep -v "❌" \
  | wc -l)

FAILED=0

if [ "$COUNT_OS" -gt "$BASELINE_OS" ]; then
  echo "❌ $LABEL_OS: $COUNT_OS matches (baseline: $BASELINE_OS) — DRIFT DETECTED"
  FAILED=1
else
  echo "✅ $LABEL_OS: $COUNT_OS matches (baseline: $BASELINE_OS)"
fi

if [ "$COUNT_INE" -gt "$BASELINE_ISNOTEXIST" ]; then
  echo "❌ $LABEL_INE: $COUNT_INE matches (baseline: $BASELINE_ISNOTEXIST) — DRIFT DETECTED"
  FAILED=1
else
  echo "✅ $LABEL_INE: $COUNT_INE matches (baseline: $BASELINE_ISNOTEXIST)"
fi

exit $FAILED
