# E2E Test Specifications for CLI Frontends

> **Version:** 1.0.0  
> **Last Updated:** 2026-03-09  
> **Status:** Active

---

## 1. Overview

This specification defines end-to-end testing requirements for all CLI frontend applications (GSearch, BRun, AI Bridge, Nexus Flow). Tests ensure critical user flows work correctly across themes, settings, and API interactions.

---

## 2. Testing Framework

### 2.1 Technology Stack

| Tool | Purpose |
|------|---------|
| Playwright | Browser automation |
| Vitest | Test runner |
| MSW | API mocking |
| Axe-core | Accessibility testing |

### 2.2 Test Environment

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 2,
  workers: 4,
  
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
    { name: 'webkit', use: devices['Desktop Safari'] },
    { name: 'mobile', use: devices['iPhone 13'] },
  ],
  
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 3. Test Categories

### 3.1 Settings Management Tests

#### 3.1.1 General Settings

```typescript
describe('Settings - General', () => {
  test('should persist language preference', async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings');
    await page.click('[data-testid="settings-general"]');
    
    // Change language
    await page.selectOption('[data-testid="language-select"]', 'ja');
    await page.click('[data-testid="save-settings"]');
    
    // Verify persistence after reload
    await page.reload();
    await expect(page.locator('[data-testid="language-select"]'))
      .toHaveValue('ja');
  });

  test('should update port configuration', async ({ page }) => {
    await page.goto('/settings');
    
    // Change port
    await page.fill('[data-testid="port-input"]', '8095');
    await page.click('[data-testid="save-settings"]');
    
    // Verify toast notification
    await expect(page.locator('[data-testid="toast"]'))
      .toContainText('Settings saved');
    
    // Verify port check runs
    await expect(page.locator('[data-testid="port-status"]'))
      .toBeVisible();
  });

  test('should validate port range', async ({ page }) => {
    await page.goto('/settings');
    
    // Enter invalid port
    await page.fill('[data-testid="port-input"]', '99999');
    await page.click('[data-testid="save-settings"]');
    
    // Verify error
    await expect(page.locator('[data-testid="port-error"]'))
      .toContainText('Port must be between 1024 and 65535');
  });
});
```

#### 3.1.2 Logging Settings

```typescript
describe('Settings - Logging', () => {
  test('should change log level', async ({ page }) => {
    await page.goto('/settings/logging');
    
    // Select debug level
    await page.selectOption('[data-testid="log-level-select"]', 'debug');
    await page.click('[data-testid="save-settings"]');
    
    // Navigate to logs and verify debug logs appear
    await page.goto('/logs');
    await expect(page.locator('[data-testid="log-entry"][data-level="debug"]'))
      .toBeVisible();
  });

  test('should configure log retention', async ({ page }) => {
    await page.goto('/settings/logging');
    
    await page.fill('[data-testid="retention-days"]', '7');
    await page.click('[data-testid="save-settings"]');
    
    // Verify in config
    await page.goto('/settings/advanced');
    await expect(page.locator('[data-testid="config-viewer"]'))
      .toContainText('"logRetentionDays": 7');
  });
});
```

---

### 3.2 Theme Switching Tests

#### 3.2.1 Base Theme Tests

```typescript
describe('Theme - Base Modes', () => {
  test('should switch to dark theme', async ({ page }) => {
    await page.goto('/');
    
    // Open theme selector
    await page.click('[data-testid="theme-toggle"]');
    await page.click('[data-testid="theme-dark"]');
    
    // Verify dark mode applied
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('body'))
      .toHaveCss('background-color', 'rgb(10, 10, 10)');
  });

  test('should switch to light theme', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('theme', 'dark'));
    await page.reload();
    
    await page.click('[data-testid="theme-toggle"]');
    await page.click('[data-testid="theme-light"]');
    
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('body'))
      .toHaveCss('background-color', 'rgb(255, 255, 255)');
  });

  test('should respect system preference', async ({ page }) => {
    // Emulate dark mode preference
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    
    await page.click('[data-testid="theme-toggle"]');
    await page.click('[data-testid="theme-system"]');
    
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});
```

#### 3.2.2 Colorful Theme Tests

```typescript
describe('Theme - Colorful Variants', () => {
  const themes = [
    { name: 'dracula', bg: 'rgb(40, 42, 54)', accent: 'rgb(189, 147, 249)' },
    { name: 'nord', bg: 'rgb(46, 52, 64)', accent: 'rgb(136, 192, 208)' },
    { name: 'solarized-dark', bg: 'rgb(0, 43, 54)', accent: 'rgb(38, 139, 210)' },
    { name: 'monokai', bg: 'rgb(39, 40, 34)', accent: 'rgb(166, 226, 46)' },
    { name: 'tokyo-night', bg: 'rgb(26, 27, 38)', accent: 'rgb(187, 154, 247)' },
  ];

  for (const theme of themes) {
    test(`should apply ${theme.name} theme`, async ({ page }) => {
      await page.goto('/settings/appearance');
      
      await page.click('[data-testid="theme-preset-select"]');
      await page.click(`[data-testid="theme-${theme.name}"]`);
      
      // Verify background color
      await expect(page.locator('body'))
        .toHaveCss('background-color', theme.bg);
      
      // Verify accent color on primary button
      await expect(page.locator('[data-testid="primary-button"]'))
        .toHaveCss('background-color', theme.accent);
    });
  }

  test('should persist theme across sessions', async ({ page }) => {
    await page.goto('/settings/appearance');
    await page.click('[data-testid="theme-preset-select"]');
    await page.click('[data-testid="theme-dracula"]');
    
    // Close and reopen
    await page.close();
    const newPage = await page.context().newPage();
    await newPage.goto('/');
    
    await expect(newPage.locator('html'))
      .toHaveAttribute('data-theme', 'dracula');
  });
});
```

#### 3.2.3 Accent Color Tests

```typescript
describe('Theme - Custom Accent Colors', () => {
  test('should apply custom accent color', async ({ page }) => {
    await page.goto('/settings/appearance');
    
    // Open color picker
    await page.click('[data-testid="accent-color-picker"]');
    await page.fill('[data-testid="color-hex-input"]', '#FF6B6B');
    await page.click('[data-testid="apply-color"]');
    
    // Verify accent applied
    await expect(page.locator('[data-testid="primary-button"]'))
      .toHaveCss('background-color', 'rgb(255, 107, 107)');
  });

  test('should show preset accent colors', async ({ page }) => {
    await page.goto('/settings/appearance');
    
    const presets = ['blue', 'purple', 'green', 'orange', 'pink'];
    for (const preset of presets) {
      await expect(page.locator(`[data-testid="accent-preset-${preset}"]`))
        .toBeVisible();
    }
  });
});
```

---

### 3.3 API Tester Tests

#### 3.3.1 Request Building

```typescript
describe('API Tester - Request Building', () => {
  test('should build GET request', async ({ page }) => {
    await page.goto('/api-tester');
    
    // Configure request
    await page.selectOption('[data-testid="method-select"]', 'GET');
    await page.fill('[data-testid="url-input"]', '/api/health');
    
    // Add header
    await page.click('[data-testid="add-header"]');
    await page.fill('[data-testid="header-key-0"]', 'Authorization');
    await page.fill('[data-testid="header-value-0"]', 'Bearer token123');
    
    // Verify request preview
    await expect(page.locator('[data-testid="request-preview"]'))
      .toContainText('GET /api/health');
    await expect(page.locator('[data-testid="request-preview"]'))
      .toContainText('Authorization: Bearer token123');
  });

  test('should build POST request with JSON body', async ({ page }) => {
    await page.goto('/api-tester');
    
    await page.selectOption('[data-testid="method-select"]', 'POST');
    await page.fill('[data-testid="url-input"]', '/api/search');
    
    // Add JSON body
    await page.click('[data-testid="body-tab"]');
    await page.fill('[data-testid="body-editor"]', '{"query": "test"}');
    
    // Verify content-type auto-set
    await page.click('[data-testid="headers-tab"]');
    await expect(page.locator('[data-testid="header-value-content-type"]'))
      .toHaveValue('application/json');
  });
});
```

#### 3.3.2 Request Execution

```typescript
describe('API Tester - Execution', () => {
  test('should execute request and show response', async ({ page }) => {
    // Mock API response
    await page.route('**/api/health', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'healthy', uptime: 3600 }),
      });
    });

    await page.goto('/api-tester');
    await page.fill('[data-testid="url-input"]', '/api/health');
    await page.click('[data-testid="send-request"]');
    
    // Verify response displayed
    await expect(page.locator('[data-testid="response-status"]'))
      .toContainText('200 OK');
    await expect(page.locator('[data-testid="response-body"]'))
      .toContainText('"status": "healthy"');
    await expect(page.locator('[data-testid="response-time"]'))
      .toBeVisible();
  });

  test('should handle error responses', async ({ page }) => {
    await page.route('**/api/error', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/api-tester');
    await page.fill('[data-testid="url-input"]', '/api/error');
    await page.click('[data-testid="send-request"]');
    
    await expect(page.locator('[data-testid="response-status"]'))
      .toContainText('500');
    await expect(page.locator('[data-testid="response-status"]'))
      .toHaveClass(/error/);
  });

  test('should handle network timeout', async ({ page }) => {
    await page.route('**/api/slow', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 35000));
      await route.fulfill({ status: 200 });
    });

    await page.goto('/api-tester');
    await page.fill('[data-testid="url-input"]', '/api/slow');
    await page.click('[data-testid="send-request"]');
    
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Request timeout', { timeout: 35000 });
  });
});
```

#### 3.3.3 Presets Management

```typescript
describe('API Tester - Presets', () => {
  test('should save request as preset', async ({ page }) => {
    await page.goto('/api-tester');
    
    // Configure request
    await page.fill('[data-testid="url-input"]', '/api/search');
    await page.selectOption('[data-testid="method-select"]', 'POST');
    
    // Save preset
    await page.click('[data-testid="save-preset"]');
    await page.fill('[data-testid="preset-name"]', 'Search API');
    await page.click('[data-testid="confirm-save"]');
    
    // Verify in preset list
    await page.click('[data-testid="presets-dropdown"]');
    await expect(page.locator('[data-testid="preset-item"]'))
      .toContainText('Search API');
  });

  test('should load preset', async ({ page }) => {
    // Pre-populate preset
    await page.evaluate(() => {
      localStorage.setItem('api-presets', JSON.stringify([
        { name: 'Health Check', method: HttpMethod.Get, url: '/api/health' }
      ]));
    });

    await page.goto('/api-tester');
    await page.click('[data-testid="presets-dropdown"]');
    await page.click('[data-testid="preset-item"]:has-text("Health Check")');
    
    await expect(page.locator('[data-testid="url-input"]'))
      .toHaveValue('/api/health');
    await expect(page.locator('[data-testid="method-select"]'))
      .toHaveValue('GET');
  });

  test('should delete preset', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('api-presets', JSON.stringify([
        { name: 'To Delete', method: HttpMethod.Get, url: '/api/test' }
      ]));
    });

    await page.goto('/api-tester');
    await page.click('[data-testid="presets-dropdown"]');
    await page.click('[data-testid="preset-delete-To Delete"]');
    await page.click('[data-testid="confirm-delete"]');
    
    await expect(page.locator('[data-testid="preset-item"]'))
      .not.toContainText('To Delete');
  });
});
```

---

### 3.4 WebSocket Log Viewer Tests

```typescript
describe('Log Viewer - WebSocket', () => {
  test('should connect to log stream', async ({ page }) => {
    await page.goto('/logs');
    
    await expect(page.locator('[data-testid="connection-status"]'))
      .toContainText('Connected');
  });

  test('should display incoming logs', async ({ page }) => {
    await page.goto('/logs');
    
    // Simulate WebSocket message
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('ws-log', {
        detail: { level: 'info', message: 'Test log message', timestamp: Date.now() }
      }));
    });
    
    await expect(page.locator('[data-testid="log-entry"]'))
      .toContainText('Test log message');
  });

  test('should filter logs by level', async ({ page }) => {
    await page.goto('/logs');
    
    // Add mixed logs
    await page.evaluate(() => {
      ['info', 'warn', 'error'].forEach((level) => {
        window.dispatchEvent(new CustomEvent('ws-log', {
          detail: { level, message: `${level} message`, timestamp: Date.now() }
        }));
      });
    });
    
    // Filter to errors only
    await page.click('[data-testid="filter-error"]');
    
    await expect(page.locator('[data-testid="log-entry"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="log-entry"]'))
      .toContainText('error message');
  });

  test('should search logs', async ({ page }) => {
    await page.goto('/logs');
    
    await page.fill('[data-testid="log-search"]', 'specific');
    
    await expect(page.locator('[data-testid="log-entry"]:visible'))
      .toContainText('specific');
  });

  test('should auto-scroll to latest', async ({ page }) => {
    await page.goto('/logs');
    
    // Enable auto-scroll
    await page.click('[data-testid="auto-scroll-toggle"]');
    
    // Add many logs
    await page.evaluate(() => {
      for (let i = 0; i < 100; i++) {
        window.dispatchEvent(new CustomEvent('ws-log', {
          detail: { level: 'info', message: `Log ${i}`, timestamp: Date.now() }
        }));
      }
    });
    
    // Verify scrolled to bottom
    const scrollContainer = page.locator('[data-testid="log-container"]');
    const scrollTop = await scrollContainer.evaluate((el) => el.scrollTop);
    const scrollHeight = await scrollContainer.evaluate((el) => el.scrollHeight);
    const clientHeight = await scrollContainer.evaluate((el) => el.clientHeight);
    
    expect(scrollTop + clientHeight).toBeCloseTo(scrollHeight, 10);
  });
});
```

---

### 3.5 Error Modal Tests

```typescript
describe('Error Modal', () => {
  test('should display error details', async ({ page }) => {
    await page.goto('/');
    
    // Trigger error
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('app-error', {
        detail: {
          code: 'E1001',
          message: 'Connection failed',
          stack: 'Error at line 42...',
        }
      }));
    });
    
    await expect(page.locator('[data-testid="error-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-code"]'))
      .toContainText('E1001');
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Connection failed');
  });

  test('should copy error to clipboard', async ({ page }) => {
    await page.goto('/');
    
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('app-error', {
        detail: { code: 'E1001', message: 'Test error' }
      }));
    });
    
    await page.click('[data-testid="copy-error"]');
    
    await expect(page.locator('[data-testid="copy-success"]'))
      .toBeVisible();
  });

  test('should show recovery actions', async ({ page }) => {
    await page.goto('/');
    
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('app-error', {
        detail: {
          code: 'E2001',
          message: 'Backend unreachable',
          recoverable: true,
          actions: ['retry', 'check-port']
        }
      }));
    });
    
    await expect(page.locator('[data-testid="action-retry"]')).toBeVisible();
    await expect(page.locator('[data-testid="action-check-port"]')).toBeVisible();
  });
});
```

---

### 3.6 Changelog Tests

```typescript
describe('Changelog', () => {
  test('should show changelog on version update', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('lastSeenVersion', '1.0.0');
    });
    
    // App detects new version 1.1.0
    await page.goto('/');
    
    await expect(page.locator('[data-testid="changelog-modal"]'))
      .toBeVisible();
    await expect(page.locator('[data-testid="changelog-version"]'))
      .toContainText('1.1.0');
  });

  test('should dismiss and remember', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('lastSeenVersion', '1.0.0');
    });
    
    await page.goto('/');
    await page.click('[data-testid="changelog-dismiss"]');
    
    // Reload - should not show again
    await page.reload();
    await expect(page.locator('[data-testid="changelog-modal"]'))
      .not.toBeVisible();
  });
});
```

---

## 4. Accessibility Tests

```typescript
describe('Accessibility', () => {
  test('should pass axe audit on main pages', async ({ page }) => {
    const pages = ['/', '/settings', '/logs', '/api-tester'];
    
    for (const path of pages) {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Tab through main navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nav-home"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="nav-settings"]')).toBeFocused();
  });

  test('should trap focus in modals', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="open-modal"]');
    
    // Tab should cycle within modal
    const focusableElements = await page.locator('[data-testid="modal"] :focus-visible').count();
    for (let i = 0; i < focusableElements + 1; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Should still be in modal
    await expect(page.locator('[data-testid="modal"] :focus')).toBeVisible();
  });
});
```

---

## 5. Cross-Browser Matrix

| Test Suite | Chrome | Firefox | Safari | Mobile |
|------------|--------|---------|--------|--------|
| Settings | ✓ | ✓ | ✓ | ✓ |
| Theme Switching | ✓ | ✓ | ✓ | ✓ |
| API Tester | ✓ | ✓ | ✓ | — |
| Log Viewer | ✓ | ✓ | ✓ | ✓ |
| Error Modal | ✓ | ✓ | ✓ | ✓ |
| Accessibility | ✓ | ✓ | ✓ | ✓ |

---

## 6. CI/CD Integration

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## References

- [Component Library](./10-component-library.md)
- [CW Config Architecture](../07-seedable-config-architecture/00-overview.md)
- [Shared CLI Frontend](./00-overview.md)
