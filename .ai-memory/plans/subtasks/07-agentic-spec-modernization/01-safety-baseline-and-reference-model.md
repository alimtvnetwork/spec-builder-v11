# Subtask 01: Pre-Flight Safety, Upstream Baseline & Reference Modeling

Traceability ID: Task-01 & Task-02
Spec Reference: [02-spec/21-app/31-agentic-spec-modernization-and-wp-plugin-alignment.md](../../../02-spec/21-app/31-agentic-spec-modernization-and-wp-plugin-alignment.md)
Target Files: [git refs/heads/backup/pre-spec-modernization, 02-spec/21-app/31-agentic-spec-modernization-and-wp-plugin-alignment.md]
Action:
1. Confirm backup branch `backup/pre-spec-modernization` is pushed to remote.
2. Verify baseline release v3.18.0 is marked as Latest on GitHub Releases.
3. Confirm 100% content parity across 02-spec folders 01 to 20 with coding-guidelines.
4. Extract architectural patterns from D:\work\wp-onboarding\wp-plugins\riseup-asia-uploader\riseup-asia-uploader.php and includes/ directory.

Acceptance Criteria:
- Backup branch `backup/pre-spec-modernization` exists on origin.
- Content parity across folders 01–20 verified with upstream.
- Canonical specification `02-spec/21-app/31-agentic-spec-modernization-and-wp-plugin-alignment.md` registered in `21-app/readme.md`.

Targeted Verification:
`git branch -r | Select-String "backup/pre-spec-modernization"` (exit 0)
