# Memory: architecture/coding-standards/php-array-keys-pascalcase

**Updated:** 2026-03-03  
**Version:** 1.0.0  
**Status:** Active
**Priority:** Critical

---

## Rule

All PHP associative array keys in return values, API responses, internal data structures, and filter parameters must use **PascalCase** (e.g., `'PostsMissingKeyword'`, `'TotalCount'`, `'PostTypes'`). Never use camelCase or snake_case for internal array keys.

Repeated string values representing known categories (e.g., `'post'`, `'page'`, `'category'`) must use **enum backing values** (e.g., `WpPostType::Post->value`) instead of magic strings.

Configuration/setting key strings (e.g., `'meta_description.max_length'`) must use a **settings key enum** (e.g., `YoastSettingKey::MetaDescriptionMaxLength->value`).

## Exemptions

- WordPress core function parameters retain native snake_case (e.g., `'post_status'` in `WP_Query` args)
- Third-party API fields maintain original casing

## Cross-References

| Reference | Location |
|-----------|----------|
| Coding Standards §12 | `02-spec/01-general-spec/01-foundation/01-coding-standards-foundation.md` |
| PHP Naming Conventions | `02-spec/02-coding-guidelines/04-php/naming-conventions.md` §API/DB Keys |
| Forbidden Patterns §11 | `02-spec/02-coding-guidelines/04-php/forbidden-patterns.md` §11 (snake_case API keys) |
