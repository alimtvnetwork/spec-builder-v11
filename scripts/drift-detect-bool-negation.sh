#!/bin/bash
# drift-detect-bool-negation.sh
# Issue #18 Cat 6: Boolean Negation — detects raw `!` on method calls
# Exit code: 0 = within baseline, 1 = drift detected

BASELINE=32
LABEL="CAT-6 (boolean negation)"

COUNT=$(grep -rn -E "if !([a-zA-Z]+\.)[A-Z][a-zA-Z]+\(" \
  --include="*.md" \
  ./spec/ 2>/dev/null \
  | grep -v "spec/22-how-app-issues-track/" \
  | grep -v "spec/23-coding-guidelines/" \
  | grep -v "spec/25-golang-standards/" \
  | grep -v "spec/30-generic-enforce/" \
  | grep -v "// drift-exempt:" \
  | grep -v "❌" \
  | grep -v "!ok" \
  | grep -v "!= nil" \
  | wc -l)

if [ "$COUNT" -gt "$BASELINE" ]; then
  echo "❌ $LABEL: $COUNT matches (baseline: $BASELINE) — DRIFT DETECTED"
  exit 1
fi

echo "✅ $LABEL: $COUNT matches (baseline: $BASELINE)"
exit 0
