#!/bin/bash
# drift-detect-raw-sql.sh
# RISK-001: Raw SQL Bypass Detector
# Exit code: 0 = clean, 1 = violations found

VIOLATIONS=$(grep -rn \
  -e "db\.Exec" \
  -e "db\.Raw" \
  -e "INSERT INTO" \
  -e "UPDATE .* SET" \
  -e "DELETE FROM" \
  --include="*.go" \
  ./internal/ ./pkg/ 2>/dev/null \
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
