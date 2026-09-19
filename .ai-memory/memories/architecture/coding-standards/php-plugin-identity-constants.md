# Memory: architecture/coding-standards/php-plugin-identity-constants

**Updated:** 2026-03-03  
**Version:** 1.0.0  
**Scope:** All WordPress plugins (Riseup Asia Uploader and derivatives)

---

## Rule

All plugin identity strings **must** be sourced from the `PluginConfigType` backed enum. Three canonical constants exist:

| Constant | Value | Usage |
|----------|-------|-------|
| `PluginConfigType::Slug` | `'riseup-asia-uploader'` | Directory names, CSS/JS handles, option keys, path segments |
| `PluginConfigType::Name` | `'Riseup Asia Uploader'` | User-facing display text, admin notices, email subjects, generated file comments |
| `PluginConfigType::LogPrefix` | `'[Riseup Asia]'` | Log line prefixes, `InitHelpers::errorLogWithPrefix()` formatting, diagnostic output |

Additional constants: `ApiBase`, `ApiVersion`, `Version`.

## Prohibited

```php
// ❌ FORBIDDEN — hardcoded plugin identity strings
private const LOG_PREFIX = '[Riseup Asia] ClassName: ';
$subject = '[Riseup Asia] Plugin Boot Errors on ' . $site;
$title = 'Riseup Asia Uploader — Boot Error Report';
$handle = 'riseup-asia-uploader-admin';
```

## Required

```php
// ✅ REQUIRED — derive from PluginConfigType enum
private static function logPrefix(): string {
    return PluginConfigType::LogPrefix->value . ' ClassName: ';
}
$subject = PluginConfigType::LogPrefix->value . ' Plugin Boot Errors on ' . $site;
$title = PluginConfigType::Name->value . ' — Boot Error Report';
$handle = PluginConfigType::Slug->value . '-admin';
```

## Templates

Template files (`.php` view files) must also use `PluginConfigType` constants — never inline the plugin name or slug as magic strings. Pass constants via controller or use directly in templates.

## Exception

The `Autoloader` class is exempt — it loads before enums are available.
PHPDoc `@package` headers are documentation, not logic — they are exempt.

## Reference

- `02-spec/02-coding-guidelines/04-php/forbidden-patterns.md` § 9 (Magic Strings — Plugin Identity)
- `02-spec/33-wp-plugin-development/11-coding-guidelines.md` (Early-boot logging)
