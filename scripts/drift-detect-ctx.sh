#!/bin/bash
# drift-detect-ctx.sh
# Issue #18 Cat 1: Context Naming — detects raw `ctx context.Context` in spec code examples
# Exit code: 0 = within baseline, 1 = drift detected

BASELINE=0
LABEL="CAT-1 (ctx abbreviation)"

COUNT=$(grep -rn "ctx context\.Context" \
  --include="*.md" \
  ./spec/ 2>/dev/null \
  | grep -v "02-spec/22-how-app-issues-track/" \
  | grep -v "02-spec/23-coding-guidelines/" \
  | grep -v "02-spec/25-golang-standards/" \
  | grep -v "02-spec/30-generic-enforce/" \
  | grep -v "// drift-exempt:" \
  | grep -v "❌" \
  | wc -l)

if [ "$COUNT" -gt "$BASELINE" ]; then
  echo "❌ $LABEL: $COUNT matches (baseline: $BASELINE) — DRIFT DETECTED"
  exit 1
fi

echo "✅ $LABEL: $COUNT matches (baseline: $BASELINE)"
exit 0
