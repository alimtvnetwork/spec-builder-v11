#!/bin/bash
# drift-detect-tuple-returns.sh
# Issue #18 Cat 3: Return Signatures — detects raw `(*T, error)` and `(T, error)` tuples
# Exit code: 0 = within baseline, 1 = drift detected

BASELINE=1
LABEL="CAT-3 (tuple returns)"

COUNT=$(grep -rn -E "\) \((\*?[A-Z][a-zA-Z]+,\s*error|error)\)" \
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
  | grep -v "enum-architecture" \
  | wc -l)

if [ "$COUNT" -gt "$BASELINE" ]; then
  echo "❌ $LABEL: $COUNT matches (baseline: $BASELINE) — DRIFT DETECTED"
  exit 1
fi

echo "✅ $LABEL: $COUNT matches (baseline: $BASELINE)"
exit 0
