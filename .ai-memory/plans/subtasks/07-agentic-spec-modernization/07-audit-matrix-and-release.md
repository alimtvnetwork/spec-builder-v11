# Subtask 07: Spec Quality Audit Matrix, Scoring & v3.19.0 Release

Traceability ID: Task-06 & Task-07
Spec Reference: [02-spec/21-app/31-agentic-spec-modernization-and-wp-plugin-alignment.md](../../../02-spec/21-app/31-agentic-spec-modernization-and-wp-plugin-alignment.md)
Target Files: [02-spec/25-app-spec-audit/01-agentic-spec-modernization-audit.md, package.json, AGENTS.md, readme.md, changelog.md, release-artifacts/]
Action:
1. Modernize auxiliary specs in folders 51 (upload-scripts), 52 (presets), 53 (activity-feed), and 60 (ai-research).
2. Author comprehensive audit report `02-spec/25-app-spec-audit/01-agentic-spec-modernization-audit.md` scoring each module 0–100 across the 5 dimensions.
3. Verify all audited modules achieve score >= 95/100.
4. Execute `bun run test` to verify 100% green test passes across all suites.
5. Execute `bun run build` to verify production Health Dashboard builds cleanly.
6. Bump version to `3.19.0` in `package.json`, `AGENTS.md`, and root `readme.md`.
7. Document release notes in `changelog.md`.
8. Package release artifacts with `release.ps1`, push commits and tags to GitHub, and publish GitHub Release `v3.19.0`.

Acceptance Criteria:
- Audit report records >= 95/100 across all modules.
- `bun run test` passes 26/26 tests.
- Production build succeeds without errors.
- Version bumped to `3.19.0`, tagged, pushed, and GitHub Release published.

Targeted Verification:
`gh release view v3.19.0` (exit 0)
