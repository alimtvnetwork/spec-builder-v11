# PHPStan Level 8 & Static Quality Assurance

> **Path:** `02-spec/37-wp-plugin-development/14-phpstan-and-quality-assurance.md`  
> **Status:** ACTIVE  
> **Target Tool:** PHPStan 1.10+, Pest PHP, Composer  
> **Authority:** Single Source of Truth for WordPress Plugin Static Analysis & QA Gates

---

## Architectural Purpose

This specification mandates static analysis and automated linting standards for WordPress plugin development. All plugin code under `RiseupAsia\` must pass PHPStan Level 8 without baseline suppressions, enforce strict typing across all parameters and returns, and maintain 0 error diagnostics.

---

## PHPStan Configuration (`phpstan.neon.dist`)

```neon
parameters:
    level: 8
    paths:
        - includes/
        - riseup-asia-uploader.php
    scanFiles:
        - vendor/php-stubs/wordpress-stubs/wordpress-stubs.php
    checkMissingIterableValueType: true
    checkGenericClassInNonGenericObjectType: true
    treatPhpDocTypesAsCertain: false
    ignoreErrors:
        # Strict exceptions for legacy WP global variables where explicit
        - '#Variable \$wpdb might not be defined#'
```

---

## Composer Scripts Pipeline (`composer.json`)

```json
{
    "name": "riseup/riseup-asia-uploader",
    "description": "Production-grade WordPress uploader and snapshot companion plugin",
    "type": "wordpress-plugin",
    "license": "GPL-2.0-or-later",
    "require": {
        "php": ">=8.2.0"
    },
    "require-dev": {
        "phpstan/phpstan": "^1.10",
        "szepeviktor/phpstan-wordpress": "^1.3",
        "pestphp/pest": "^2.0"
    },
    "autoload": {
        "psr-4": {
            "RiseupAsia\\": "includes/"
        }
    },
    "scripts": {
        "analyze": "vendor/bin/phpstan analyse --configuration=phpstan.neon.dist",
        "test": "vendor/bin/pest",
        "check": [
            "@analyze",
            "@test"
        ]
    }
}
```

---

## Static Analysis Enforcement Rules

1. **Strict Types Mandate:**
   - Every file must begin with `declare(strict_types=1);`.
   - Missing declaration is flagged as a fatal QA violation.

2. **Array Shapes & Generics:**
   - Generic arrays must specify item types in docblocks: `/** @var list<string> */` or `/** @param array<string, mixed> $options */`.
   - Never use untyped array returns or loose parameters.

3. **WordPress Stubs:**
   - Analysis uses `szepeviktor/phpstan-wordpress` to validate all core WP function signatures (`get_option`, `update_option`, `wp_remote_post`, `register_rest_route`).

---

## Verification & Acceptance Criteria

```gherkin
Feature: PHPStan Level 8 Static Analysis
  Scenario: Analyzing codebase with PHPStan Level 8
    Given Clean plugin codebase under includes/
    When Composer script "composer analyze" is executed
    Then PHPStan returns exit code 0
    And Zero errors are reported across all inspected files
```
