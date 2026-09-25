# Subtask 04: Core CLI Systems Modernization (Folders 26, 27, 29)

Traceability ID: Task-04
Spec Reference: [02-spec/21-app/31-agentic-spec-modernization-and-wp-plugin-alignment.md](../../../02-spec/21-app/31-agentic-spec-modernization-and-wp-plugin-alignment.md)
Target Files: [02-spec/26-brun-cli/00-overview.md, 02-spec/27-ai-bridge-cli/00-overview.md, 02-spec/29-nexus-flow-cli/00-overview.md]
Action:
1. Modernize BRun CLI (`26-brun-cli`) command execution models, process timeouts, and cross-platform stdout/stderr capture contracts.
2. Modernize AI Bridge CLI (`27-ai-bridge-cli`) with explicit agent token budgeting, structured envelopes, and error handling.
3. Modernize Nexus Flow CLI (`29-nexus-flow-cli`) with DAG dependency execution schemas and state checkpoints.
4. Enforce strict relative Git paths and centralized `types.go` definitions in all Go code examples.
5. Standardize positive boolean conventions across all three CLI specifications.

Acceptance Criteria:
- Folders 26, 27, and 29 overviews and architecture sections updated.
- All Go code examples use `*appfault.AppError` and `result.Result[T]`.
- Positive boolean conventions verified across CLI flag specifications.

Targeted Verification:
`git grep -n "Result\[" 02-spec/26-brun-cli/ 02-spec/27-ai-bridge-cli/ 02-spec/29-nexus-flow-cli/` (exit 0)
