---
name: Backend PHP
description: PHP backend coding standards for WordPress and general PHP development
isDefault: false
version: 1
---

**Version:** 1.0.0  
**Last Updated:** 2026-03-20


You are an AI assistant that generates PHP backend coding guidelines. These guidelines ensure consistent, maintainable, and secure PHP code.

## PHP Philosophy

- **Simplicity First**: Keep end-level code simple and concise
- **Positive Boolean Functions**: Always use positive words (no "not", "un-", "non-")
- **15-Line Function Limit**: Break large functions into smaller helpers
- **Early Returns**: Use early returns over if-else chains
- **Push Validation into Classes**: Let classes handle their own validation

---

## Core Principles

### 1. Simplicity First

Push complexity into classes, not into calling code. Let classes handle their own validation.

```php
// ✅ CORRECT: Simple, concise
$this->oauth = new OAuth($this->db, $this->audit_logger);
Logger::debug('OAuth initialized');

// ❌ WRONG: Unnecessary conditionals at call site
if (BooleanUtil::is_class_exists('OAuth') && BooleanUtil::is_set($this->audit_logger)) {
    $this->oauth = new OAuth($this->db, $this->audit_logger);
    Logger::debug('OAuth initialized');
}
```

**Let the class constructor handle validation internally:**

```php
// Inside OAuth constructor
public function __construct($db, $audit_logger) {
    if (!$db || !$audit_logger) {
        throw new Exception('Database and audit logger required');
    }
    $this->db = $db;
    $this->audit_logger = $audit_logger;
}
```

### 2. Boolean Functions

**Use positive boolean functions with `is_` or `has_` prefix**

1. **ALWAYS** use positive words (no "not", "un-", "non-")
2. **NEVER** use negations (`!`) in if statements
3. Create separate positive functions for both cases
4. Keep functions under 15 lines maximum

---

## Boolean Helper Class Pattern

Use a dedicated utility class for all boolean checks:

```php
<?php
namespace PluginNamespace\Utils;

/**
 * Boolean helper utilities - always use positive function names
 */
class BooleanUtil
{
    // Function Checks
    public static function is_func_exists(string $function_name): bool
    {
        return function_exists($function_name);
    }
    
    public static function is_func_missing(string $function_name): bool
    {
        return !function_exists($function_name);
    }
    
    // Class Checks
    public static function is_class_exists(string $class_name): bool
    {
        return class_exists($class_name);
    }
    
    public static function is_class_missing(string $class_name): bool
    {
        return !class_exists($class_name);
    }
    
    // Extension Checks
    public static function is_extension_loaded(string $extension_name): bool
    {
        return extension_loaded($extension_name);
    }
    
    public static function is_extension_missing(string $extension_name): bool
    {
        return !extension_loaded($extension_name);
    }
    
    // Directory Checks
    public static function is_dir_exists(string $dir_path): bool
    {
        return is_dir($dir_path);
    }
    
    public static function is_dir_missing(string $dir_path): bool
    {
        return !is_dir($dir_path);
    }
    
    public static function is_dir_writable(string $dir_path): bool
    {
        return is_writable($dir_path);
    }
    
    public static function is_dir_readonly(string $dir_path): bool
    {
        return !is_writable($dir_path);
    }
    
    // File Checks
    public static function is_file_exists(string $file_path): bool
    {
        return file_exists($file_path);
    }
    
    public static function is_file_missing(string $file_path): bool
    {
        return !file_exists($file_path);
    }
    
    // Value Checks
    public static function is_empty($value): bool
    {
        return empty($value);
    }
    
    public static function has_content($value): bool
    {
        return !empty($value);
    }
    
    public static function is_null($value): bool
    {
        return is_null($value);
    }
    
    public static function is_set($value): bool
    {
        return !is_null($value);
    }
    
    // Database Checks
    public static function is_db_connected($db): bool
    {
        return $db !== null && $db instanceof \PDO;
    }
    
    public static function is_db_disconnected($db): bool
    {
        return $db === null || !($db instanceof \PDO);
    }
}
```

### Usage Examples

```php
use PluginNamespace\Utils\BooleanUtil;

// ✅ CORRECT: Positive conditional
if (BooleanUtil::is_class_missing('Database')) {
    Logger::error('Database class not found');
    return null;
}

// ❌ WRONG: Negative conditional
if (!class_exists('Database')) {
    Logger::error('Database class not found');
    return null;
}

// ✅ CORRECT: Directory checks with positive names
if (BooleanUtil::is_dir_missing($db_dir)) {
    Logger::error('Directory does not exist');
    return;
}

if (BooleanUtil::is_dir_readonly($db_dir)) {
    Logger::error('Directory is read-only');
    return;
}
```

---

## Naming Pairs Reference

Always provide BOTH versions using positive words:

| Positive (True Case) | Positive (False Case) | Avoid |
|---------------------|----------------------|-------|
| `is_exists()` | `is_missing()` | `is_not_exists()` |
| `is_writable()` | `is_readonly()` | `is_not_writable()` |
| `is_empty()` | `has_content()` | `is_not_empty()` |
| `is_null()` | `is_set()` | `is_not_null()` |
| `is_enabled()` | `is_disabled()` | `is_not_enabled()` |
| `is_valid()` | `is_invalid()` | `is_not_valid()` |
| `is_active()` | `is_inactive()` | `is_not_active()` |
| `is_connected()` | `is_disconnected()` | `is_not_connected()` |

---

## Function Size Limit

**MAXIMUM 15 LINES per function**

If a function exceeds 15 lines, break it into smaller helper functions.

```php
// ✅ CORRECT: Small, focused functions
public function process_item($item): bool
{
    if (BooleanUtil::is_empty($item)) {
        return false;
    }
    
    if ($this->is_item_invalid($item)) {
        return false;
    }
    
    return $this->save_item($item);
}

private function is_item_invalid($item): bool
{
    // Validation logic here
    return false;
}

private function save_item($item): bool
{
    // Save logic here
    return true;
}
```

---

## Early Returns Pattern

**Use early returns instead of nested if-else.**

```php
// ✅ CORRECT: Early returns
public function process(): bool
{
    if (BooleanUtil::is_empty($this->data)) {
        return false;
    }

    if ($this->is_data_invalid()) {
        return false;
    }

    return $this->save();
}

// ❌ WRONG: Nested if-else
public function process(): bool
{
    if (!empty($this->data)) {
        if ($this->validate()) {
            return $this->save();
        } else {
            return false;
        }
    } else {
        return false;
    }
}
```

---

## WordPress-Specific Guidelines

### Sanitization Functions

| Function | Use Case |
|----------|----------|
| `sanitize_text_field()` | Single-line text |
| `sanitize_textarea_field()` | Multi-line text |
| `sanitize_email()` | Email addresses |
| `sanitize_url()` | URLs |
| `absint()` | Positive integers |
| `wp_kses_post()` | Rich HTML content |

### Escape Functions

| Function | Context |
|----------|---------|
| `esc_html()` | HTML content (between tags) |
| `esc_attr()` | HTML attributes |
| `esc_url()` | URLs (href, src) |
| `esc_js()` | Inline JavaScript |
| `wp_json_encode()` | JSON in script tags |

### Nonce Pattern

```php
// Generate
wp_nonce_field('action_name', 'nonce_field');

// Verify
if (BooleanUtil::is_empty($_POST['nonce_field'])) {
    wp_die('Security check failed');
}

if (!wp_verify_nonce($_POST['nonce_field'], 'action_name')) {
    wp_die('Security check failed');
}
```

### Capability Checks

```php
// Check before action
if (!current_user_can('manage_options')) {
    wp_die('Unauthorized access');
}
```

---

## Error Handling

### WP_Error Usage

```php
function create_item($data): int|WP_Error
{
    if (BooleanUtil::is_empty($data['title'])) {
        return new WP_Error(
            'missing_title',
            __('Title is required.', 'plugin-slug'),
            array('status' => 400)
        );
    }
    
    // ... create item
    
    return $item_id;
}

// Checking for errors
$result = create_item($data);
if (is_wp_error($result)) {
    Logger::error('Failed to create item', [
        'error' => $result->get_error_message()
    ]);
}
```

### Stack Trace Logging

```php
try {
    // Operation
} catch (\Throwable $e) {
    Logger::error('Operation failed', [
        'file' => __FILE__,
        'action' => 'method_name',
        'error' => $e->getMessage(),
        'stackTrace' => $e->getTraceAsString()
    ]);
    throw $e; // Re-throw if critical
}
```

---

## Initialization Order

Always follow this order:

1. **Directories First**: Use `InitHelper::ensure_directories_exist()`
2. **Database Second**: Use `InitHelper::ensure_database_ready()`
3. **Components Third**: Initialize all other components

This ensures proper dependency resolution and prevents initialization errors.

```php
class Plugin
{
    public function initialize(): void
    {
        // Step 1: Directories
        InitHelper::ensure_directories_exist();
        
        // Step 2: Database
        InitHelper::ensure_database_ready();
        
        // Step 3: Components
        $this->oauth = new OAuth($this->db, $this->audit_logger);
        $this->api = new API($this->db, $this->oauth);
    }
}
```

---

## Cross-References

- [Error Resolution Specification](../../../03-error-manage/01-error-resolution/00-overview.md)
- [PHP Debugging Guide](../../../03-error-manage/01-error-resolution/05-debugging-cheat-sheet.md)
- [WordPress Plugin Guidelines](../../../01-spec-authoring-guide/10-wordpress/07-overview-wordpress.md)
- [WordPress Sanitization](../../../01-spec-authoring-guide/10-wordpress/05-sanitization-wordpress.md)
