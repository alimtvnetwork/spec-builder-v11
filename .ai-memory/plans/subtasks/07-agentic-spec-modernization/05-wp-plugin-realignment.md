# Subtask 05: WordPress Plugin Architecture Realignment (Folders 34, 35, 37)

Traceability ID: Task-05
Spec Reference: [02-spec/21-app/31-agentic-spec-modernization-and-wp-plugin-alignment.md](../../../02-spec/21-app/31-agentic-spec-modernization-and-wp-plugin-alignment.md)
Target Files: [02-spec/34-wp-plugin/19-resilient-rest-upload-controller.md, 02-spec/34-wp-plugin/20-boot-error-collector-and-diagnostics.md, 02-spec/35-wp-plugin-builder/00-overview.md, 02-spec/37-wp-plugin-development/00-overview.md]
Action:
1. Ingest production patterns from `riseup-asia-uploader` (`riseup-asia-uploader.php`) into WP specifications.
2. Author `19-resilient-rest-upload-controller.md` under `02-spec/34-wp-plugin/` specifying chunked uploads, transient locks, hash checks, and delta sync.
3. Author `20-boot-error-collector-and-diagnostics.md` under `02-spec/34-wp-plugin/` specifying silent boot error capture and admin notice rendering.
4. Modernize WP Plugin Builder templates (`02-spec/35-wp-plugin-builder/`) with PSR-4 autoloader, Enums (`HookType`, `OptionNameType`), and strict PHP 8.2+ typing.
5. Update `02-spec/37-wp-plugin-development/` with PHPStan level 8 baseline standards and Composer-driven plugin skeletons.

Acceptance Criteria:
- Upload controller and boot error collector specifications authored and registered in `34-wp-plugin`.
- Enums standards with `Type` suffix and strict typing documented in `35-wp-plugin-builder`.
- Explicit MariaDB / WordPress option keys documented with complete schemas.

Targeted Verification:
`Test-Path 02-spec/34-wp-plugin/19-resilient-rest-upload-controller.md` (exit 0)
