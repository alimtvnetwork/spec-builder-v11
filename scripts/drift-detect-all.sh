#!/bin/bash
# drift-detect-all.sh
# Unified runner for all compliance drift detection scripts

FAILED=0

echo "═══════════════════════════════════════"
echo "  Compliance Drift Detection Suite"
echo "═══════════════════════════════════════"
echo ""

echo "── Original Risks (R1–R3) ──"
echo ""
bash scripts/drift-detect-raw-sql.sh || FAILED=1
echo ""
bash scripts/drift-detect-magic-strings.sh || FAILED=1
echo ""
bash scripts/drift-detect-seed-sync.sh || FAILED=1

echo ""
echo "── Issue #18 Spec Code Examples (R11–R16) ──"
echo ""
bash scripts/drift-detect-ctx.sh || FAILED=1
echo ""
bash scripts/drift-detect-fmt-errorf.sh || FAILED=1
echo ""
bash scripts/drift-detect-tuple-returns.sh || FAILED=1
echo ""
bash scripts/drift-detect-raw-os.sh || FAILED=1
echo ""
bash scripts/drift-detect-bool-negation.sh || FAILED=1
echo ""
bash scripts/drift-detect-abbrev-casing.sh || FAILED=1
echo ""
bash scripts/drift-detect-type-safety.sh || FAILED=1

echo ""
echo "═══════════════════════════════════════"
if [ "$FAILED" -eq 0 ]; then
  echo "  ✅ All drift checks passed"
else
  echo "  ❌ One or more drift checks failed"
fi
echo "═══════════════════════════════════════"

exit $FAILED
