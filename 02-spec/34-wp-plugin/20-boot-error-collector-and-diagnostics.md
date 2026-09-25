# Boot Error Collector & Diagnostics — Silent Capture & Admin Notices

> **Path:** `02-spec/34-wp-plugin/20-boot-error-collector-and-diagnostics.md`  
> **Status:** ACTIVE  
> **Target Module:** `includes/Diagnostics/BootErrorCollector.php`  
> **Authority:** Single Source of Truth for WordPress Boot Error Handling & Diagnostics  
> **Reference:** `D:\work\wp-onboarding\wp-plugins\riseup-asia-uploader`

---

## Architectural Purpose

This specification defines the bootstrapping error collector and diagnostics reporting subsystem for WordPress plugins. It prevents plugin activation fatal crashes (White Screen of Death / WSOD) by intercepting early initialization failures, recording structured diagnostics into memory and database options, and presenting non-destructive administrative notices with remediation actions.

---

## Component Topology & File Locations

| Class / File | Destination Path | Purpose |
|---|---|---|
| `BootErrorCollector` | `includes/Diagnostics/BootErrorCollector.php` | Singleton error aggregator capturing early bootstrap and hook exceptions |
| `DiagnosticNoticeRenderer` | `includes/Diagnostics/DiagnosticNoticeRenderer.php` | Hooks into `admin_notices` to render clean, dismissible warning banners |
| `SeverityType` | `includes/Enums/SeverityType.php` | PascalCase backed enum for error severity levels |
| `BootErrorItem` | `includes/Diagnostics/BootErrorItem.php` | Value object encapsulating individual recorded diagnostic events |

---

## PHP 8.2+ Architecture & Contracts

```php
<?php

declare(strict_types=1);

namespace RiseupAsia\Diagnostics;

use RiseupAsia\Enums\SeverityType;

final class BootErrorCollector
{
    private static ?self $instance = null;
    
    /** @var list<BootErrorItem> */
    private array $errors = [];

    private function __construct() {}

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function record(string $stage, string $message, SeverityType $severity = SeverityType::Warning): void
    {
        $this->errors[] = new BootErrorItem(
            stage: $stage,
            message: $message,
            severity: $severity,
            timestamp: time()
        );
    }

    public function hasErrors(): bool
    {
        return !empty($this->errors);
    }

    public function hasCriticalErrors(): bool
    {
        foreach ($this->errors as $error) {
            if ($error->severity === SeverityType::Critical) {
                return true;
            }
        }
        return false;
    }

    /**
     * @return list<BootErrorItem>
     */
    public function getErrors(): array
    {
        return $this->errors;
    }
}
```

---

## Enum Definitions (`includes/Enums/SeverityType.php`)

```php
<?php

declare(strict_types=1);

namespace RiseupAsia\Enums;

enum SeverityType: string
{
    case Notice   = 'Notice';
    case Warning  = 'Warning';
    case Critical = 'Critical';
}
```

---

## Admin Notice Rendering Flow

1. **Bootstrapping Phase:**
   - In the root plugin entry file (`plugin-slug.php`), every critical initialization step (autoloader registration, database table verification, hook setup) is wrapped in `try/catch (\Throwable $e)`.
   - On exception, `BootErrorCollector::getInstance()->record('Init', $e->getMessage(), SeverityType::Critical)` is invoked.
   - Boot execution safely halts without triggering a PHP fatal crash.

2. **Notice Hooking:**
   - `add_action('admin_notices', [DiagnosticNoticeRenderer::class, 'render']);` is registered.
   - When an administrator visits `wp-admin`, if `BootErrorCollector::getInstance()->hasErrors()` is `true`:
     - Render an HTML notice with appropriate CSS class: `notice notice-error is-dismissible`.
     - Output timestamp, offending stage, and error details.

---

## Verification & Acceptance Criteria

```gherkin
Feature: Boot Error Collector and Diagnostics
  Scenario: Caught exception records error without crashing WordPress
    Given A missing optional database table during plugin boot
    When Boot routine throws PDOException
    Then BootErrorCollector records stage: "Init" and severity: "Warning"
    And WordPress admin panel loads successfully without fatal crash

  Scenario: Admin notice renders when boot errors are present
    Given BootErrorCollector has 1 or more recorded errors
    When Administrator accesses wp-admin dashboard
    Then An administrative notice with class "notice-error" is rendered
```
