# Accessibility Compliance Specification (WCAG 2.1 AA)

> **Version:** 1.0.0  
> **Created:** 2026-02-01  
> **Status:** Active  
> **Purpose:** Ensure all CLI frontends meet WCAG 2.1 AA accessibility standards

---

## Summary

All shared CLI frontends (GSearch, BRun, AI Bridge, Nexus Flow) must comply with **WCAG 2.1 Level AA** accessibility guidelines. This specification defines the requirements, implementation patterns, and testing procedures to ensure accessibility for users with disabilities.

---

## WCAG 2.1 AA Principles

### 1. Perceivable

| Requirement | Implementation |
|-------------|----------------|
| **1.1 Text Alternatives** | All non-text content has text alternatives |
| **1.2 Time-based Media** | Captions for audio/video (if applicable) |
| **1.3 Adaptable** | Content can be presented in different ways |
| **1.4 Distinguishable** | Easy to see and hear content |

### 2. Operable

| Requirement | Implementation |
|-------------|----------------|
| **2.1 Keyboard Accessible** | All functionality via keyboard |
| **2.2 Enough Time** | Users have enough time to read/use content |
| **2.3 Seizures/Physical** | No content that causes seizures |
| **2.4 Navigable** | Users can navigate and find content |
| **2.5 Input Modalities** | Multiple ways to operate functionality |

### 3. Understandable

| Requirement | Implementation |
|-------------|----------------|
| **3.1 Readable** | Text is readable and understandable |
| **3.2 Predictable** | Pages appear and operate predictably |
| **3.3 Input Assistance** | Help users avoid and correct mistakes |

### 4. Robust

| Requirement | Implementation |
|-------------|----------------|
| **4.1 Compatible** | Maximize compatibility with assistive tech |

---

## Color Contrast Requirements

### Minimum Contrast Ratios

| Element Type | Ratio | Example |
|--------------|-------|---------|
| Normal text | 4.5:1 | Body text, labels |
| Large text (18px+ or 14px+ bold) | 3:1 | Headings |
| UI components & graphics | 3:1 | Buttons, icons, form borders |
| Focus indicators | 3:1 | Focus rings |

### Implementation

```css
/* CSS Variables for WCAG-compliant colors */
:root {
  /* Text colors with sufficient contrast on --background */
  --foreground: 0 0% 3.9%;           /* #0a0a0a - 21:1 on white */
  --muted-foreground: 0 0% 45.1%;    /* #737373 - 4.6:1 on white */
  
  /* Interactive elements */
  --primary: 0 0% 9%;                /* Meets 3:1 for UI */
  --primary-foreground: 0 0% 98%;    /* White on dark - high contrast */
  
  /* Focus ring - must be visible */
  --ring: 0 0% 3.9%;                 /* Matches foreground */
}

.dark {
  --foreground: 0 0% 98%;            /* #fafafa - 18:1 on black */
  --muted-foreground: 0 0% 63.9%;    /* #a3a3a3 - 4.6:1 on black */
}
```

### High Contrast Theme

```css
.high-contrast {
  --foreground: 0 0% 0%;             /* Pure black */
  --background: 0 0% 100%;           /* Pure white */
  --primary: 240 100% 25%;           /* Deep blue */
  --ring: 0 0% 0%;                   /* Black focus ring */
  
  /* Minimum 7:1 contrast for AAA compliance */
}

.high-contrast-dark {
  --foreground: 0 0% 100%;           /* Pure white */
  --background: 0 0% 0%;             /* Pure black */
  --primary: 60 100% 50%;            /* Bright yellow */
}
```

---

## Keyboard Navigation

### Focus Management

```typescript
// hooks/useFocusTrap.ts
import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}
```

### Keyboard Shortcuts

| Action | Shortcut | Context |
|--------|----------|---------|
| Open settings | `Ctrl+,` | Global |
| Close modal/dialog | `Escape` | Modal open |
| Submit form | `Enter` | Form focused |
| Navigate tabs | `Arrow Left/Right` | Tab list |
| Open dropdown | `Space` or `Enter` | Dropdown trigger |
| Navigate list | `Arrow Up/Down` | List/menu |
| Skip to main | `Tab` (first press) | Page load |

### Skip Links

```tsx
// components/SkipLinks.tsx
export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="absolute top-0 left-0 z-50 p-4 bg-background text-foreground underline focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <a
        href="#main-navigation"
        className="absolute top-0 left-20 z-50 p-4 bg-background text-foreground underline focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to navigation
      </a>
    </div>
  );
}
```

---

## ARIA Implementation

### Semantic Landmarks

```tsx
// Layout with proper landmarks
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SkipLinks />
      
      <header role="banner">
        <nav id="main-navigation" aria-label="Main navigation">
          {/* Navigation content */}
        </nav>
      </header>
      
      <main id="main-content" role="main" aria-label="Main content">
        {children}
      </main>
      
      <aside role="complementary" aria-label="Sidebar">
        {/* Sidebar content */}
      </aside>
      
      <footer role="contentinfo">
        {/* Footer content */}
      </footer>
    </div>
  );
}
```

### Live Regions

```tsx
// components/LiveAnnouncer.tsx
import { createContext, useContext, useState, useCallback } from 'react';

interface AnnouncerContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AnnouncerContext = createContext<AnnouncerContextType | null>(null);

export function LiveAnnouncerProvider({ children }: { children: React.ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (priority === 'assertive') {
      setAssertiveMessage(message);
      setTimeout(() => setAssertiveMessage(''), 1000);
    } else {
      setPoliteMessage(message);
      setTimeout(() => setPoliteMessage(''), 1000);
    }
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      
      {/* Polite announcements - read after current content */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      
      {/* Assertive announcements - interrupt immediately */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </AnnouncerContext.Provider>
  );
}

export function useAnnounce() {
  const context = useContext(AnnouncerContext);
  if (!context) throw new Error('useAnnounce must be used within LiveAnnouncerProvider');
  return context.announce;
}
```

### Button & Interactive Element Patterns

```tsx
// Accessible button with loading state
interface AccessibleButtonProps extends React.ButtonHtmlAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
}

export function AccessibleButton({
  children,
  isLoading,
  loadingText = 'Loading...',
  disabled,
  ...props
}: AccessibleButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <>
          <span className="sr-only">{loadingText}</span>
          <Spinner aria-hidden="true" />
        </>
      ) : (
        children
      )}
    </button>
  );
}
```

---

## Form Accessibility

### Error Handling

```tsx
// components/FormField.tsx
interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
}

export function FormField({
  id,
  label,
  error,
  required,
  description,
  children
}: FormFieldProps) {
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required && <span aria-hidden="true" className="text-destructive ml-1">*</span>}
        {required && <span className="sr-only">(required)</span>}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      {/* Clone child with accessibility props */}
      {React.cloneElement(children as React.ReactElement, {
        id,
        'aria-required': required,
        'aria-invalid': !!error,
        'aria-describedby': [
          description ? descriptionId : null,
          error ? errorId : null
        ].filter(Boolean).join(' ') || undefined
      })}
      
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          <span className="sr-only">Error: </span>
          {error}
        </p>
      )}
    </div>
  );
}
```

### Form Validation Announcements

```typescript
// hooks/useFormValidation.ts
import { useAnnounce } from '@/components/LiveAnnouncer';

export function useFormValidation() {
  const announce = useAnnounce();

  const announceErrors = (errors: Record<string, string>) => {
    const errorCount = Object.keys(errors).length;
    if (errorCount === 0) return;

    const message = errorCount === 1
      ? `Form has 1 error: ${Object.values(errors)[0]}`
      : `Form has ${errorCount} errors. First error: ${Object.values(errors)[0]}`;
    
    announce(message, 'assertive');
  };

  const announceSuccess = (message = 'Form submitted successfully') => {
    announce(message, 'polite');
  };

  return { announceErrors, announceSuccess };
}
```

---

## Component-Specific Requirements

### Modal/Dialog

```tsx
// Must include:
// - role="dialog"
// - aria-modal="true"
// - aria-labelledby (title)
// - aria-describedby (description)
// - Focus trap
// - Escape key closes
// - Return focus on close

export function AccessibleDialog({
  isOpen,
  onClose,
  title,
  description,
  children
}: DialogProps) {
  const titleId = useId();
  const descId = useId();
  const previousFocus = useRef<HTMLElement | null>(null);
  const dialogRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
    } else {
      previousFocus.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <h2 id={titleId}>{title}</h2>
      {description && <p id={descId}>{description}</p>}
      {children}
    </div>
  );
}
```

### Tabs

```tsx
// Accessible tabs pattern
export function AccessibleTabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div>
      <div role="tablist" aria-label="Content tabs">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                const next = tabs[(index + 1) % tabs.length];
                onChange(next.id);
              } else if (e.key === 'ArrowLeft') {
                const prev = tabs[(index - 1 + tabs.length) % tabs.length];
                onChange(prev.id);
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`panel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
```

### Data Tables

```tsx
// Accessible table with sorting
export function AccessibleTable({ data, columns, sortConfig, onSort }: TableProps) {
  return (
    <table role="grid" aria-label="Data table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.id}
              scope="col"
              aria-sort={
                sortConfig?.column === col.id
                  ? sortConfig.direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
            >
              <button
                onClick={() => onSort(col.id)}
                aria-label={`Sort by ${col.label}`}
              >
                {col.label}
                <SortIcon direction={sortConfig?.column === col.id ? sortConfig.direction : null} />
              </button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={row.id}>
            {columns.map((col, colIndex) => (
              <td
                key={col.id}
                role="gridcell"
                aria-rowindex={rowIndex + 2}
                aria-colindex={colIndex + 1}
              >
                {row[col.id]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## Testing Requirements

### Automated Testing

| Tool | Purpose | Integration |
|------|---------|-------------|
| **axe-core** | Automated accessibility testing | Jest/Vitest |
| **jest-axe** | Jest matcher for axe | Unit tests |
| **Playwright Axe** | E2E accessibility testing | Playwright |
| **ESLint a11y** | Static analysis | CI pipeline |

### Axe Integration

```typescript
// tests/accessibility.test.ts
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('Settings page has no accessibility violations', async () => {
    const { container } = render(<SettingsPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('Modal dialog has no accessibility violations', async () => {
    const { container } = render(<Dialog isOpen title="Test" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Manual Testing Checklist

| Test | Method | Frequency |
|------|--------|-----------|
| Keyboard navigation | Tab through all elements | Every PR |
| Screen reader | NVDA/VoiceOver test | Weekly |
| Color contrast | DevTools/axe | Every PR |
| Focus visibility | Visual inspection | Every PR |
| Zoom 200% | Browser zoom | Monthly |
| Motion reduction | prefers-reduced-motion | Monthly |

---

## Reduced Motion Support

```css
/* Respect user preference for reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```typescript
// hooks/useReducedMotion.ts
export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}
```

---

## Compliance Checklist

### Level A (Required)

- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Links have descriptive text
- [ ] Page has lang attribute
- [ ] No keyboard traps
- [ ] Content readable without CSS
- [ ] No auto-playing media with sound

### Level AA (Required)

- [ ] 4.5:1 contrast for normal text
- [ ] 3:1 contrast for large text
- [ ] Text resizable to 200%
- [ ] Multiple navigation methods
- [ ] Consistent navigation
- [ ] Consistent identification
- [ ] Error suggestions provided
- [ ] Focus visible

### Level AAA (Recommended)

- [ ] 7:1 contrast ratio
- [ ] Sign language for media
- [ ] Extended time limits
- [ ] No timing required
- [ ] Location indicators

---

## Cross-References

- **Component Library:** `02-spec/33-shared-cli-frontend/10-component-library.md`
- **E2E Testing:** `02-spec/33-shared-cli-frontend/11-e2e-test-spec.md`
- **Theme Support:** `02-spec/07-seedable-config-architecture/00-overview.md#theme-support`
