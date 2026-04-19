# Memory: architecture/naming-conventions/context-keys
Updated: 2026-02-26
**Version:** 1.0.0  

Log context keys and internal JSON/PHP seed data keys must use camelCase (e.g., 'wpId', 'stackTrace', 'credentialKey', 'errorCode', 'projectId', 'specId', 'durationSeconds', 'memoryPeak', 'wordCount', 'contentChanged'). The use of magic strings (literal string values) for log keys in code is prohibited; all keys must be defined as named PascalCase constants (e.g., 'LogKeyUserId = "userId"') to prevent typos and ensure consistency. External API parameters (such as native WordPress REST API keys like 'permission_callback', 'sanitize_callback', 'validate_callback', or third-party integration fields) are exempt from camelCase and constant requirements, maintaining their native casing (e.g., snake_case) for compatibility.

Full scan completed 2026-02-26: Zero remaining snake_case log context key violations across all spec files. Files fixed: 07-integration-patterns.md, 02-specmanager.md, 01-plugin-structure-wordpress.md, 00-overview-wordpress.md, 02-rest-api-wordpress.md, 03-cron-system-wordpress.md, 04-admin-ui-wordpress.md, 06-configuration-wordpress.md, 03-conditional-helpers-systems.md.
