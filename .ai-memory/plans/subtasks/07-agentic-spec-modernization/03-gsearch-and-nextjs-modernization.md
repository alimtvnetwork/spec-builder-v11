# Subtask 03: Google Search CLI & Next.js/Web Retrieval Modernization (Folder 25)

Traceability ID: Task-04
Spec Reference: [02-spec/21-app/31-agentic-spec-modernization-and-wp-plugin-alignment.md](../../../02-spec/21-app/31-agentic-spec-modernization-and-wp-plugin-alignment.md)
Target Files: [02-spec/25-gsearch-cli/00-overview.md, 02-spec/25-gsearch-cli/01-backend/22-modern-search-provider-architecture.md, 02-spec/25-gsearch-cli/02-frontend/06-nextjs-search-interface.md]
Action:
1. Update `02-spec/25-gsearch-cli/00-overview.md` to reference `25-gsearch-cli/` and remove obsolete legacy pathing.
2. Author `22-modern-search-provider-architecture.md` detailing multi-provider routing (Google Custom Search, Brave, Bing, SerpAPI).
3. Author `06-nextjs-search-interface.md` specifying modern Next.js / React 18 frontend interface with streaming results.
4. Verify Go return signatures use `result.Result[T]` or `result.ResultSlice[T]` and positive booleans (`isSuccess`, `hasResults`).
5. Ensure error codes reference the assigned range `[7000-7919]` from `error-codes.json`.

Acceptance Criteria:
- Folder path references in `00-overview.md` updated to `25-gsearch-cli/`.
- Modern search provider architecture spec and Next.js interface spec created.
- Zero bare tuple returns or unhandled generic errors in newly authored specs.

Targeted Verification:
`Test-Path 02-spec/25-gsearch-cli/01-backend/22-modern-search-provider-architecture.md` (exit 0)
