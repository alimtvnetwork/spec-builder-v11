# Subtask 06: Specialized Systems, RAG & Time Log Modernization (Folders 28, 30, 31, 32, 33, 40, 41, 42)

Traceability ID: Task-04
Spec Reference: [02-spec/21-app/31-agentic-spec-modernization-and-wp-plugin-alignment.md](../../../02-spec/21-app/31-agentic-spec-modernization-and-wp-plugin-alignment.md)
Target Files: [02-spec/28-ai-bridge-non-vector-rag/00-overview.md, 02-spec/30-spec-reverse-cli/00-overview.md, 02-spec/31-ai-transcribe-cli/00-overview.md, 02-spec/32-license-manager/00-overview.md, 02-spec/33-shared-cli-frontend/00-overview.md, 02-spec/40-time-log-cli/00-overview.md, 02-spec/41-time-log-ui/00-overview.md, 02-spec/42-time-log-combined/00-overview.md]
Action:
1. Modernize non-vector RAG specs (`28`) with exact SQLite FTS5 schemas and deterministic ranking heuristics.
2. Modernize spec-reverse CLI (`30`) with AST parsing contracts and automated spec generation templates.
3. Modernize transcribe CLI (`31`) with ffmpeg audio preprocessing and subtitle format schemas.
4. Modernize license manager (`32`) with Ed25519 cryptographic signatures and tamper-proof verification payloads.
5. Modernize shared CLI frontend (`33`) with Sweet Digs TUI token mappings for Bubbletea / Lipgloss.
6. Modernize Time Log suite (`40`, `41`, `42`) with PascalCase SQLite tables, IPC contracts, and duration calculators.

Acceptance Criteria:
- All overviews and core specs updated across folders 28, 30, 31, 32, 33, 40, 41, and 42.
- PascalCase table naming and explicit PK/FK indexes documented.
- Zero bare errors or untyped structures in specifications.

Targeted Verification:
`Test-Path 02-spec/32-license-manager/00-overview.md` (exit 0)
