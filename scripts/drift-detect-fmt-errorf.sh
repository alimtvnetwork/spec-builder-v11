#!/bin/bash
# drift-detect-fmt-errorf.sh
# Issue #18 Cat 2: Error Wrapping — detects raw `fmt.Errorf` in spec code examples
# Exit code: 0 = within baseline, 1 = drift detected

BASELINE=11
LABEL="CAT-2 (fmt.Errorf)"

COUNT=$(grep -rn "fmt\.Errorf" \
  --include="*.md" \
  ./spec/ 2>/dev/null \
  | grep -v "02-spec/22-how-app-issues-track/" \
  | grep -v "02-spec/23-coding-guidelines/" \
  | grep -v "02-spec/25-golang-standards/" \
  | grep -v "02-spec/30-generic-enforce/" \
  | grep -v "02-spec/99-archive/" \
  | grep -v "// drift-exempt:" \
  | grep -v "❌" \
  | grep -v "99-consistency-report" \
  | grep -v "98-changelog" \
  | wc -l)

if [ "$COUNT" -gt "$BASELINE" ]; then
  echo "❌ $LABEL: $COUNT matches (baseline: $BASELINE) — DRIFT DETECTED"
  exit 1
fi

echo "✅ $LABEL: $COUNT matches (baseline: $BASELINE)"
exit 0
