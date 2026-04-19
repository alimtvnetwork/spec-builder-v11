#!/bin/bash
# drift-detect-abbrev-casing.sh
# Issue #18 Cat 7 / RISK-017: Abbreviation Casing
# Detects uppercase abbreviations (ID, URL, API, JSON, HTTP, HTML, LLM, DB) in
# code identifiers within spec markdown files.
#
# Exempt: Go stdlib (MarshalJSON, ServeHTTP), framework (ShouldBindJSON),
#   proper nouns (OpenAPI, DuckDB, ChromaDB, MongoDB, IndexedDB, TailwindCSS, cURL),
#   external libraries (chromem.NewDB, RocksDB), research docs (spec/16-ai-research/),
#   Mermaid diagrams, test data strings, SCREAMING_SNAKE env vars,
#   guideline/issue/enforcement directories, ❌ anti-pattern markers.
#
# Exit code: 0 = within baseline, 1 = drift detected

BASELINE=0
LABEL="CAT-7 (abbreviation casing)"

COUNT=$(grep -rn -P '(?<=[a-z])(ID|URL|API|JSON|HTTP|HTML|LLM|DB)(?=[A-Z\s\(\)\{\},;:]|$)' \
  --include="*.md" \
  ./spec/ 2>/dev/null \
  | grep -v "spec/22-how-app-issues-track/" \
  | grep -v "spec/23-coding-guidelines/" \
  | grep -v "spec/25-golang-standards/" \
  | grep -v "spec/30-generic-enforce/" \
  | grep -v "spec/99-archive/" \
  | grep -v "spec/16-ai-research/" \
  | grep -v "spec/02-spec-management-software/10-research/" \
  | grep -v "// drift-exempt:" \
  | grep -v "// EXEMPTED:" \
  | grep -v "❌" \
  | grep -v "99-consistency-report\|98-changelog" \
  | grep -v "diagrams/\|architecture-diagram" \
  | grep -v "MarshalJSON\|UnmarshalJSON\|ServeHTTP\|ShouldBindJSON\|AbortWithStatusJSON\|BindJSON" \
  | grep -v "OpenAPI\|FastAPI\|IndexedDB\|IDBOpen\|MongoDB\|TailwindCSS\|cURL\|GraphQL" \
  | grep -v "indexedDB\|indexedDb" \
  | grep -v "DuckDB\|RocksDB\|ChromaDB\|chromem\.\|NewDB\|PersistentDB" \
  | grep -v "LIBXML_" \
  | grep -v "DB_VERSION\|DB_NAME\|DB_HOST\|DB_PORT\|DB_USER\|DB_PASSWORD\|DB_SSLMODE" \
  | grep -v "FontSubsetJSON\|LanguagesJSON" \
  | grep -v "TLSProfile\|ClientHello" \
  | grep -v "ElevenLabs\|FGY2WhTYpPnr" \
  | wc -l)

if [ "$COUNT" -gt "$BASELINE" ]; then
  echo "❌ $LABEL: $COUNT matches (baseline: $BASELINE) — DRIFT DETECTED"
  grep -rn -P '(?<=[a-z])(ID|URL|API|JSON|HTTP|HTML|LLM|DB)(?=[A-Z\s\(\)\{\},;:]|$)' \
    --include="*.md" \
    ./spec/ 2>/dev/null \
    | grep -v "spec/22-how-app-issues-track/" \
    | grep -v "spec/23-coding-guidelines/" \
    | grep -v "spec/25-golang-standards/" \
    | grep -v "spec/30-generic-enforce/" \
    | grep -v "spec/99-archive/" \
    | grep -v "spec/16-ai-research/" \
    | grep -v "spec/02-spec-management-software/10-research/" \
    | grep -v "// drift-exempt:" \
    | grep -v "// EXEMPTED:" \
    | grep -v "❌" \
    | grep -v "99-consistency-report\|98-changelog" \
    | grep -v "diagrams/\|architecture-diagram" \
    | grep -v "MarshalJSON\|UnmarshalJSON\|ServeHTTP\|ShouldBindJSON\|AbortWithStatusJSON\|BindJSON" \
    | grep -v "OpenAPI\|FastAPI\|IndexedDB\|IDBOpen\|MongoDB\|TailwindCSS\|cURL\|GraphQL" \
    | grep -v "indexedDB\|indexedDb" \
    | grep -v "DuckDB\|RocksDB\|ChromaDB\|chromem\.\|NewDB\|PersistentDB" \
    | grep -v "LIBXML_" \
    | grep -v "DB_VERSION\|DB_NAME\|DB_HOST\|DB_PORT\|DB_USER\|DB_PASSWORD\|DB_SSLMODE" \
    | grep -v "FontSubsetJSON\|LanguagesJSON" \
    | grep -v "TLSProfile\|ClientHello" \
    | grep -v "ElevenLabs\|FGY2WhTYpPnr" \
    | head -20
  exit 1
fi

echo "✅ $LABEL: $COUNT matches (baseline: $BASELINE)"
exit 0
