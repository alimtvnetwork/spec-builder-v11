# Coding Guidelines

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

PHP and WordPress coding standards for generated plugin code. These guidelines are injected into AI prompts to ensure consistent, high-quality output.

**Cross-References:**
- [Code Generation](./07-code-generation.md)
- [Preset Learning](./09-preset-learning.md)
- [WordPress Plugin Spec](../34-wp-plugin/00-overview.md)

---

---

## Modern Architecture Standards (PHP 8.2+ & WordPress VIP)

All newly generated plugins must adhere to modern PHP 8.2+ object-oriented architecture and WordPress VIP standards:

### 1. Strict Typing & PSR-4 Autoloading

Every PHP file must declare strict types. Class structures use PSR-4 namespacing instead of legacy `class-*.php` prefixes:

```php
<?php

declare(strict_types=1);

namespace RiseupAsia\Core;

/**
 * Core plugin bootstrap manager.
 */
final class PluginManager
{
    public function __construct(
        private readonly string $pluginVersion,
        private readonly string $pluginDirectory
    ) {}

    public function boot(): void
    {
        // Deterministic boot sequence
    }
}
```

### 2. Backed Enums with `Type` Suffix

All options, hook names, and configuration keys must be encapsulated in PascalCase backed enums ending with `Type`:

```php
<?php

declare(strict_types=1);

namespace RiseupAsia\Enums;

enum OptionNameType: string
{
    case ApiKey       = 'rasia_api_key';
    case Environment  = 'rasia_environment';
    case UploadMaxMb  = 'rasia_upload_max_mb';
    case WebhookUrl   = 'rasia_webhook_url';
}

enum HookType: string
{
    case Init         = 'init';
    case AdminInit    = 'admin_init';
    case AdminNotices = 'admin_notices';
    case RestApiInit  = 'rest_api_init';
}
```

### 3. Boot Error Collector & Diagnostics Pattern

Never allow plugin bootstrapping exceptions to crash WordPress admin or frontend. Use the `BootErrorCollector` pattern:

```php
<?php

declare(strict_types=1);

namespace RiseupAsia\Diagnostics;

final class BootErrorCollector
{
    private static ?self $instance = null;
    private array $errors = [];

    public static function getInstance(): self
    {
        return self::$instance ??= new self();
    }

    public function record(string $stage, string $message): void
    {
        $this->errors[] = ['stage' => $stage, 'message' => $message, 'time' => time()];
    }

    public function hasErrors(): bool
    {
        return !empty($this->errors);
    }
}
```

---

## Naming Conventions

### Files

| Type | Convention | Example |
|------|------------|---------|
| Class file | `class-{class-name}.php` | `class-exam-manager.php` |
| Template | `{template-name}.php` | `single-exam.php` |
| Partial | `partial-{name}.php` | `partial-exam-list.php` |
| Asset | `{plugin-name}-{type}.{ext}` | `exam-manager-admin.css` |

### Classes

| Type | Convention | Example |
|------|------------|---------|
| Main class | `{Plugin_Name}` | `Exam_Manager` |
| Admin class | `{Plugin_Name}_Admin` | `Exam_Manager_Admin` |
| Public class | `{Plugin_Name}_Public` | `Exam_Manager_Public` |
| Loader | `{Plugin_Name}_Loader` | `Exam_Manager_Loader` |
| i18n | `{Plugin_Name}_i18n` | `Exam_Manager_i18n` |

### Functions

```php
// Prefixed functions (global scope)
function exam_manager_get_exams() {}
function exam_manager_create_exam() {}

// Hook callbacks (descriptive)
function exam_manager_add_admin_menu() {}
function exam_manager_register_settings() {}
```

### Variables

```php
// Snake case for variables
$exam_data = get_exam_data();
$user_id = get_current_user_id();

// Descriptive names
$active_exams = get_active_exams();
$total_questions = count( $questions );
```

---

## Security Requirements

### Nonces

```php
// Form nonce
wp_nonce_field( 'exam_manager_save_exam', 'exam_manager_nonce' );

// AJAX nonce
$nonce = wp_create_nonce( 'exam_manager_ajax' );

// Verification
if ( ! wp_verify_nonce( $_POST['exam_manager_nonce'], 'exam_manager_save_exam' ) ) {
    wp_die( esc_html__( 'Security check failed.', 'exam-manager' ) );
}
```

### Capability Checks

```php
// Admin capability
if ( ! current_user_can( 'manage_options' ) ) {
    wp_die( esc_html__( 'Unauthorized access.', 'exam-manager' ) );
}

// Custom capability
if ( ! current_user_can( 'edit_exams' ) ) {
    return new WP_Error( 'forbidden', 'Cannot edit exams' );
}
```

### Input Sanitization

```php
// Text fields
$title = sanitize_text_field( wp_unslash( $_POST['title'] ) );

// Textarea
$description = sanitize_textarea_field( wp_unslash( $_POST['description'] ) );

// HTML content
$content = wp_kses_post( wp_unslash( $_POST['content'] ) );

// Email
$email = sanitize_email( $_POST['email'] );

// Integer
$count = absint( $_POST['count'] );

// Array
$ids = array_map( 'absint', (array) $_POST['ids'] );
```

### Output Escaping

```php
// HTML
echo esc_html( $user_input );

// Attributes
echo '<div class="' . esc_attr( $class ) . '">';

// URLs
echo '<a href="' . esc_url( $link ) . '">';

// JavaScript
echo '<script>var data = ' . wp_json_encode( $data ) . ';</script>';

// Translation
echo esc_html__( 'Text', 'exam-manager' );
echo esc_html_e( 'Text', 'exam-manager' );
```

---

## Database Operations

### Using $wpdb

```php
global $wpdb;

// Prepared statements (ALWAYS use)
$results = $wpdb->get_results(
    $wpdb->prepare(
        "SELECT * FROM {$wpdb->prefix}exams WHERE status = %s AND user_id = %d",
        'active',
        $user_id
    )
);

// Insert
$wpdb->insert(
    $wpdb->prefix . 'exams',
    array(
        'Title'      => $title,
        'UserId'     => $userId,
        'CreatedAt'  => current_time( 'mysql' ),
    ),
    array( '%s', '%d', '%s' )
);

// Update
$wpdb->update(
    $wpdb->prefix . 'exams',
    array( 'title' => $new_title ),
    array( 'id' => $exam_id ),
    array( '%s' ),
    array( '%d' )
);

// Delete
$wpdb->delete(
    $wpdb->prefix . 'exams',
    array( 'id' => $exam_id ),
    array( '%d' )
);
```

### Custom Tables

```php
function exam_manager_create_tables() {
    global $wpdb;
    
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE {$wpdb->prefix}exams (
        id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
        title varchar(255) NOT NULL,
        description text,
        user_id bigint(20) unsigned NOT NULL,
        status varchar(20) DEFAULT 'draft',
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY user_id (user_id),
        KEY status (status)
    ) $charset_collate;";
    
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta( $sql );
}
```

---

## REST API

```php
class Exam_Manager_REST_Controller extends WP_REST_Controller {

    /**
     * Register routes.
     */
    public function register_routes() {
        register_rest_route(
            'exam-manager/v1',
            '/exams',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_items' ),
                    'permission_callback' => array( $this, 'get_items_permissions_check' ),
                    'args'                => $this->get_collection_params(),
                ),
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array( $this, 'create_item' ),
                    'permission_callback' => array( $this, 'create_item_permissions_check' ),
                    'args'                => $this->get_endpoint_args_for_item_schema( true ),
                ),
            )
        );
    }

    /**
     * Check permissions for getting items.
     *
     * @param WP_REST_Request $request Request object.
     * @return bool|WP_Error
     */
    public function get_items_permissions_check( $request ) {
        return current_user_can( 'read' );
    }

    /**
     * Get items.
     *
     * @param WP_REST_Request $request Request object.
     * @return WP_REST_Response|WP_Error
     */
    public function get_items( $request ) {
        $exams = $this->get_exams( $request->get_params() );
        
        $data = array();
        foreach ( $exams as $exam ) {
            $data[] = $this->prepare_item_for_response( $exam, $request );
        }
        
        return rest_ensure_response( $data );
    }
}
```

---

## Hooks Pattern

```php
/**
 * Define admin hooks.
 */
private function define_admin_hooks() {
    $plugin_admin = new Exam_Manager_Admin( $this->get_plugin_name(), $this->get_version() );

    // Actions
    $this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_styles' );
    $this->loader->add_action( 'admin_enqueue_scripts', $plugin_admin, 'enqueue_scripts' );
    $this->loader->add_action( 'admin_menu', $plugin_admin, 'add_admin_menu' );

    // Filters
    $this->loader->add_filter( 'plugin_action_links', $plugin_admin, 'add_action_links', 10, 2 );
}
```

---

## Internationalization

```php
// Text domain loading
function exam_manager_load_textdomain() {
    load_plugin_textdomain(
        'exam-manager',
        false,
        dirname( plugin_basename( __FILE__ ) ) . '/languages/'
    );
}
add_action( 'plugins_loaded', 'exam_manager_load_textdomain' );

// Usage
__( 'Text to translate', 'exam-manager' );
_e( 'Text to translate and echo', 'exam-manager' );
_n( 'One item', '%s items', $count, 'exam-manager' );
_x( 'Post', 'verb', 'exam-manager' );
```

---

## Error Handling

```php
// WP_Error usage
function exam_manager_create_exam( $data ) {
    if ( empty( $data['title'] ) ) {
        return new WP_Error(
            'missing_title',
            __( 'Exam title is required.', 'exam-manager' ),
            array( 'status' => 400 )
        );
    }
    
    // ... create exam
    
    if ( is_wp_error( $result ) ) {
        return $result;
    }
    
    return $exam_id;
}

// Checking for errors
$result = exam_manager_create_exam( $data );
if ( is_wp_error( $result ) ) {
    wp_send_json_error( array(
        'message' => $result->get_error_message(),
    ) );
}
```

---

## PHPDoc Standards

```php
/**
 * Get exams by user.
 *
 * Retrieves all exams belonging to a specific user with optional
 * filtering by status.
 *
 * @since 1.0.0
 *
 * @param int    $user_id User ID.
 * @param string $status  Optional. Exam status. Default 'all'.
 * @param array  $args    Optional. Additional arguments.
 *
 * @return array|WP_Error Array of exam objects on success, WP_Error on failure.
 */
function exam_manager_get_exams_by_user( $user_id, $status = 'all', $args = array() ) {
    // ...
}
```

---

## See Also

- [Code Generation](./07-code-generation.md)
- [Preset Learning](./09-preset-learning.md)
- [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/)
