# Shared React Component Library Specification

> **Version:** 1.0.0  
> **Last Updated:** 2026-03-09  
> **Status:** Active

---

## 1. Overview

This specification defines the shared React component library used across all CLI frontends (GSearch, BRun, AI Bridge, Nexus Flow). Components are designed for consistency, accessibility, and theme compatibility.

---

## 2. Component Categories

### 2.1 Layout Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `AppShell` | Main application wrapper with sidebar | `children`, `sidebarCollapsed`, `onSidebarToggle` |
| `PageContainer` | Consistent page padding/margins | `children`, `maxWidth`, `padding` |
| `SplitPane` | Resizable split view | `left`, `right`, `defaultRatio`, `minSize` |
| `Card` | Content container with optional header | `title`, `actions`, `children`, `variant` |
| `Panel` | Collapsible content section | `title`, `defaultOpen`, `children` |

### 2.2 Navigation Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `Sidebar` | Main navigation sidebar | `items`, `collapsed`, `onToggle` |
| `NavItem` | Individual navigation item | `icon`, `label`, `to`, `badge` |
| `Breadcrumb` | Path navigation | `items`, `separator` |
| `TabBar` | Horizontal tab navigation | `tabs`, `activeTab`, `onChange` |
| `CommandPalette` | Keyboard-driven command search | `commands`, `onSelect`, `hotkey` |

### 2.3 Form Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `TextInput` | Single-line text input | `label`, `value`, `onChange`, `error`, `hint` |
| `TextArea` | Multi-line text input | `label`, `value`, `onChange`, `rows`, `autoResize` |
| `Select` | Dropdown selection | `label`, `options`, `value`, `onChange`, `searchable` |
| `Checkbox` | Boolean toggle with label | `label`, `checked`, `onChange`, `indeterminate` |
| `Switch` | Toggle switch | `label`, `checked`, `onChange`, `size` |
| `RadioGroup` | Single selection from options | `options`, `value`, `onChange`, `orientation` |
| `Slider` | Numeric range input | `min`, `max`, `value`, `onChange`, `step` |
| `ColorPicker` | Color selection | `value`, `onChange`, `presets`, `allowCustom` |
| `FileInput` | File selection | `accept`, `multiple`, `onSelect`, `dropzone` |

### 2.4 Data Display Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `DataTable` | Sortable/filterable table | `columns`, `data`, `onSort`, `onFilter`, `pagination` |
| `VirtualList` | Virtualized long lists | `items`, `itemHeight`, `renderItem` |
| `Tree` | Hierarchical data display | `nodes`, `onExpand`, `onSelect`, `multiSelect` |
| `KeyValue` | Key-value pair display | `data`, `orientation`, `copyable` |
| `Badge` | Status/count indicator | `variant`, `count`, `dot` |
| `Avatar` | User/entity representation | `src`, `fallback`, `size`, `status` |
| `Tooltip` | Contextual information | `content`, `position`, `delay` |

### 2.5 Feedback Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `Toast` | Temporary notifications | `message`, `type`, `duration`, `action` |
| `Alert` | Inline alerts | `type`, `title`, `message`, `dismissible` |
| `Modal` | Dialog overlay | `open`, `onClose`, `title`, `size`, `actions` |
| `ConfirmDialog` | Confirmation prompts | `open`, `title`, `message`, `onConfirm`, `onCancel` |
| `Progress` | Progress indication | `value`, `max`, `variant`, `showLabel` |
| `Spinner` | Loading indicator | `size`, `label` |
| `Skeleton` | Content placeholder | `variant`, `width`, `height`, `animate` |

### 2.6 CLI-Specific Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `LogViewer` | Real-time log display | `logs`, `filters`, `autoScroll`, `search` |
| `Terminal` | Terminal-style output | `lines`, `prompt`, `onCommand` |
| `CodeEditor` | Syntax-highlighted editor | `value`, `onChange`, `language`, `readOnly` |
| `JsonViewer` | Collapsible JSON display | `data`, `defaultExpanded`, `copyable` |
| `ApiTester` | HTTP request builder | `presets`, `onSend`, `history` |
| `PortStatus` | Port availability display | `ports`, `onRefresh` |
| `ConnectionBadge` | Backend connection status | `status`, `latency`, `onReconnect` |

---

## 3. Component Architecture

### 3.1 File Structure

```
frontend/src/components/
├── layout/
│   ├── AppShell.tsx
│   ├── PageContainer.tsx
│   ├── SplitPane.tsx
│   └── index.ts
├── navigation/
│   ├── Sidebar.tsx
│   ├── NavItem.tsx
│   ├── Breadcrumb.tsx
│   └── index.ts
├── form/
│   ├── TextInput.tsx
│   ├── Select.tsx
│   └── index.ts
├── data/
│   ├── DataTable.tsx
│   ├── VirtualList.tsx
│   └── index.ts
├── feedback/
│   ├── Toast.tsx
│   ├── Modal.tsx
│   └── index.ts
├── cli/
│   ├── LogViewer.tsx
│   ├── Terminal.tsx
│   ├── ApiTester.tsx
│   └── index.ts
└── index.ts  # Barrel export
```

### 3.2 Component Template

```typescript
// Standard component structure
interface ComponentProps {
  // Required props first
  value: string;
  onChange: (value: string) => void;
  
  // Optional props with defaults
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
}

const Component = forwardRef<HTMLElement, ComponentProps>(
  ({ variant = 'default', size = 'md', ...props }, ref) => {
    // Implementation
  }
);
Component.displayName = 'Component';
```

---

## 4. Theming Integration

### 4.1 CSS Variable Usage

All components MUST use semantic CSS variables:

```typescript
// ✅ Correct - uses semantic tokens
className="bg-background text-foreground border-border"

// ❌ Incorrect - hardcoded colors
className="bg-white text-gray-900 border-gray-200"
```

### 4.2 Theme-Aware Variants

```typescript
const variants = {
  default: "bg-background border-border",
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  destructive: "bg-destructive text-destructive-foreground",
  ghost: "bg-transparent hover:bg-accent",
  outline: "border border-input bg-transparent",
};
```

### 4.3 Dark Mode Support

Components must work in all theme modes without additional props:

```typescript
// Theme context provides current mode
const { theme, resolvedTheme } = useTheme();

// Components adapt automatically via CSS variables
```

---

## 5. Accessibility Requirements

### 5.1 Keyboard Navigation

| Component Type | Required Keys |
|----------------|---------------|
| Buttons | Enter, Space |
| Modals | Escape to close, Tab trap |
| Dropdowns | Arrow keys, Enter, Escape |
| Tables | Arrow keys for cell navigation |
| Trees | Arrow keys for expand/collapse |

### 5.2 ARIA Attributes

```typescript
// Required ARIA patterns
<button aria-pressed={isActive}>Toggle</button>
<div role="alert" aria-live="polite">{message}</div>
<input aria-invalid={hasError} aria-describedby={errorId} />
<div role="tree" aria-multiselectable={multiSelect}>...</div>
```

### 5.3 Focus Management

- Visible focus indicators on all interactive elements
- Focus trap in modals and dialogs
- Return focus to trigger element on modal close
- Skip links for main content areas

---

## 6. Responsive Behavior

### 6.1 Breakpoints

```typescript
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
};
```

### 6.2 Component Adaptations

| Component | Mobile Behavior |
|-----------|-----------------|
| Sidebar | Collapses to hamburger menu |
| DataTable | Horizontal scroll or card view |
| Modal | Full-screen on small viewports |
| SplitPane | Stacks vertically |

---

## 7. Performance Guidelines

### 7.1 Optimization Patterns

```typescript
// Memoization for expensive renders
const MemoizedRow = memo(TableRow);

// Virtual scrolling for long lists
<VirtualList items={logs} itemHeight={24} />

// Lazy loading for heavy components
const CodeEditor = lazy(() => import('./CodeEditor'));
```

### 7.2 Bundle Size Targets

| Category | Max Size (gzipped) |
|----------|-------------------|
| Core components | 50KB |
| Form components | 30KB |
| Data components | 40KB |
| CLI components | 35KB |
| Total library | 150KB |

---

## 8. Testing Requirements

### 8.1 Unit Tests

Each component requires:
- Render test (default props)
- Props variation tests
- Event handler tests
- Accessibility audit (jest-axe)

### 8.2 Visual Regression

- Storybook stories for all variants
- Chromatic snapshots across themes
- Mobile/desktop viewport tests

---

## 9. Documentation Standards

### 9.1 Component Documentation

Each component must have:
- JSDoc comments on props interface
- Usage examples in Storybook
- Accessibility notes
- Related components section

### 9.2 Storybook Structure

```
stories/
├── Layout/
│   ├── AppShell.stories.tsx
│   └── Card.stories.tsx
├── Form/
│   ├── TextInput.stories.tsx
│   └── Select.stories.tsx
└── CLI/
    ├── LogViewer.stories.tsx
    └── Terminal.stories.tsx
```

---

## 10. Version Compatibility

| Dependency | Version |
|------------|---------|
| React | ^18.x |
| TypeScript | ^5.x |
| Tailwind CSS | ^3.x |
| Radix UI | ^1.x |
| Lucide Icons | ^0.4x |

---

## References

- [CW Config Architecture](../06-seedable-config-architecture/00-overview.md) - Theme system
- [Shared CLI Frontend](./00-overview.md) - Frontend standards
- [E2E Test Specifications](./11-e2e-test-spec.md) - Testing patterns
