#!/bin/bash
# drift-detect-type-safety.sh
# Issue #18 Cat 8: Type Safety — detects interface{} and map[string]any
# Exit code: 0 = within baseline, 1 = drift detected

BASELINE_IFACE=121
BASELINE_MAP=73
LABEL_IFACE="CAT-8a (interface{})"
LABEL_MAP="CAT-8b (map[string]any)"

COUNT_IFACE=$(grep -rn "interface{}" \
  --include="*.md" \
  ./spec/ 2>/dev/null \
  | grep -v "02-spec/22-how-app-issues-track/" \
  | grep -v "02-spec/23-coding-guidelines/" \
  | grep -v "02-spec/25-golang-standards/" \
  | grep -v "02-spec/30-generic-enforce/" \
  | grep -v "// drift-exempt:" \
  | grep -v "// ALLOWED:" \
  | grep -v "// EXEMPTED:" \
  | grep -v "❌" \
  | wc -l)

COUNT_MAP=$(grep -rn 'map\[string\]any' \
  --include="*.md" \
  ./spec/ 2>/dev/null \
  | grep -v "02-spec/22-how-app-issues-track/" \
  | grep -v "02-spec/23-coding-guidelines/" \
  | grep -v "02-spec/25-golang-standards/" \
  | grep -v "02-spec/30-generic-enforce/" \
  | grep -v "// drift-exempt:" \
  | grep -v "// ALLOWED:" \
  | grep -v "// EXEMPTED:" \
  | grep -v "❌" \
  | wc -l)

FAILED=0

if [ "$COUNT_IFACE" -gt "$BASELINE_IFACE" ]; then
  echo "❌ $LABEL_IFACE: $COUNT_IFACE matches (baseline: $BASELINE_IFACE) — DRIFT DETECTED"
  FAILED=1
else
  echo "✅ $LABEL_IFACE: $COUNT_IFACE matches (baseline: $BASELINE_IFACE)"
fi

if [ "$COUNT_MAP" -gt "$BASELINE_MAP" ]; then
  echo "❌ $LABEL_MAP: $COUNT_MAP matches (baseline: $BASELINE_MAP) — DRIFT DETECTED"
  FAILED=1
else
  echo "✅ $LABEL_MAP: $COUNT_MAP matches (baseline: $BASELINE_MAP)"
fi

exit $FAILED
