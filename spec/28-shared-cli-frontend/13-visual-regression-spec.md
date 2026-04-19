# Visual Regression Testing Specification

> **Version:** 1.0.0  
> **Created:** 2026-02-01  
> **Status:** Active  
> **Purpose:** Ensure visual consistency across CLI frontends using Storybook and Chromatic

---

## Summary

This specification defines the visual regression testing strategy for all shared CLI frontends using **Storybook** for component documentation and **Chromatic** for automated visual testing. This ensures UI consistency across themes, viewports, and component states.

---

## Technology Stack

| Tool | Purpose | Version |
|------|---------|---------|
| **Storybook** | Component development & documentation | 8.x |
| **Chromatic** | Visual regression testing & review | Latest |
| **@storybook/addon-a11y** | Accessibility testing in Storybook | 8.x |
| **@storybook/addon-themes** | Theme switching | 8.x |
| **@storybook/addon-viewport** | Responsive testing | 8.x |
| **@storybook/test** | Component interaction testing | 8.x |

---

## Storybook Configuration

### Main Configuration

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/addon-interactions',
    '@storybook/addon-coverage'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  docs: {
    autodocs: 'tag'
  },
  staticDirs: ['../public'],
  viteFinal: async (config) => {
    // Merge custom vite config
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          '@': '/src'
        }
      }
    };
  }
};

export default config;
```

### Preview Configuration

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react';
import { withThemeByClassName } from '@storybook/addon-themes';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    backgrounds: { disable: true }, // Use theme addon instead
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1280px', height: '800px' } },
        wide: { name: 'Wide', styles: { width: '1920px', height: '1080px' } }
      }
    },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'landmark-one-main', enabled: true }
        ]
      }
    }
  },
  decorators: [
    withThemeByClassName({
      themes: {
        // Base themes
        light: '',
        dark: 'dark',
        system: 'system',
        
        // Accessibility themes
        'high-contrast': 'high-contrast',
        'high-contrast-dark': 'high-contrast-dark',
        
        // Colorful themes
        dracula: 'theme-dracula',
        nord: 'theme-nord',
        'solarized-light': 'theme-solarized-light',
        'solarized-dark': 'theme-solarized-dark',
        monokai: 'theme-monokai',
        'one-dark': 'theme-one-dark',
        'github-light': 'theme-github-light',
        'github-dark': 'theme-github-dark',
        tokyo: 'theme-tokyo',
        gruvbox: 'theme-gruvbox',
        catppuccin: 'theme-catppuccin',
        'rose-pine': 'theme-rose-pine',
        everforest: 'theme-everforest',
        kanagawa: 'theme-kanagawa',
        
        // Colorful light themes
        'ocean-light': 'theme-ocean-light',
        'forest-light': 'theme-forest-light',
        'sunset-light': 'theme-sunset-light',
        'lavender-light': 'theme-lavender-light',
        
        // Colorful dark themes
        'ocean-dark': 'theme-ocean-dark',
        'forest-dark': 'theme-forest-dark',
        'sunset-dark': 'theme-sunset-dark',
        'cyberpunk': 'theme-cyberpunk'
      },
      defaultTheme: 'light'
    })
  ]
};

export default preview;
```

---

## Story Structure

### Component Story Template

```typescript
// src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    chromatic: {
      // Capture in multiple modes
      modes: {
        light: { theme: 'light' },
        dark: { theme: 'dark' },
        'high-contrast': { theme: 'high-contrast' }
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon']
    },
    disabled: { control: 'boolean' },
    asChild: { control: 'boolean' }
  },
  args: {
    onClick: fn()
  }
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Primary story
export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default'
  }
};

// Variant stories
export const Destructive: Story = {
  args: {
    children: 'Delete',
    variant: 'destructive'
  }
};

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline'
  }
};

// State stories
export const Disabled: Story = {
  args: {
    children: 'Disabled',
    disabled: true
  }
};

export const Loading: Story = {
  args: {
    children: 'Loading...',
    disabled: true,
    className: 'animate-pulse'
  }
};

// Size stories
export const Small: Story = {
  args: {
    children: 'Small',
    size: 'sm'
  }
};

export const Large: Story = {
  args: {
    children: 'Large',
    size: 'lg'
  }
};

// All variants matrix
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
  parameters: {
    chromatic: { disableSnapshot: false }
  }
};
```

### Complex Component Story

```typescript
// src/components/LogViewer/LogViewer.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect } from '@storybook/test';
import { LogViewer } from './LogViewer';

const mockLogs = [
  { id: '1', level: 'info', message: 'Application started', timestamp: '2026-02-01T10:00:00Z' },
  { id: '2', level: 'warn', message: 'Cache miss detected', timestamp: '2026-02-01T10:00:01Z' },
  { id: '3', level: 'error', message: 'Connection failed', timestamp: '2026-02-01T10:00:02Z' },
  { id: '4', level: 'debug', message: 'Query executed in 45ms', timestamp: '2026-02-01T10:00:03Z' }
];

const meta = {
  title: 'CLI/LogViewer',
  component: LogViewer,
  parameters: {
    layout: 'fullscreen',
    chromatic: {
      viewports: [375, 768, 1280],
      modes: {
        light: { theme: 'light' },
        dark: { theme: 'dark' },
        dracula: { theme: 'dracula' }
      }
    }
  },
  decorators: [
    (Story) => (
      <div className="h-[500px] p-4">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof LogViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    logs: []
  }
};

export const WithLogs: Story = {
  args: {
    logs: mockLogs,
    autoScroll: true
  }
};

export const Filtered: Story = {
  args: {
    logs: mockLogs,
    filter: 'error'
  }
};

// Interaction test
export const FilterInteraction: Story = {
  args: {
    logs: mockLogs
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find and click filter dropdown
    const filterButton = canvas.getByRole('combobox', { name: /filter/i });
    await userEvent.click(filterButton);
    
    // Select error filter
    const errorOption = canvas.getByRole('option', { name: /error/i });
    await userEvent.click(errorOption);
    
    // Verify only error logs visible
    const logEntries = canvas.getAllByRole('listitem');
    expect(logEntries).toHaveLength(1);
  }
};
```

---

## Chromatic Configuration

### Setup

```bash
# Install Chromatic
npm install --save-dev chromatic

# Add to package.json scripts
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build",
    "chromatic": "chromatic --exit-zero-on-changes"
  }
}
```

### CI Integration (GitHub Actions)

```yaml
# .github/workflows/chromatic.yml
name: Chromatic

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Storybook
        run: npm run build-storybook

      - name: Run Chromatic
        uses: chromaui/action@latest
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          buildScriptName: build-storybook
          onlyChanged: true
          externals: |
            - 'src/**/*.css'
            - 'public/**/*'
```

### Chromatic Modes Configuration

```typescript
// .storybook/modes.ts
export const chromaticModes = {
  // Theme modes
  themes: {
    light: { theme: 'light' },
    dark: { theme: 'dark' },
    'high-contrast': { theme: 'high-contrast' },
    dracula: { theme: 'dracula' },
    nord: { theme: 'nord' }
  },
  
  // Viewport modes
  viewports: {
    mobile: { viewport: 'mobile' },
    tablet: { viewport: 'tablet' },
    desktop: { viewport: 'desktop' }
  },
  
  // Combined modes for critical components
  critical: {
    'light-mobile': { theme: 'light', viewport: 'mobile' },
    'light-desktop': { theme: 'light', viewport: 'desktop' },
    'dark-mobile': { theme: 'dark', viewport: 'mobile' },
    'dark-desktop': { theme: 'dark', viewport: 'desktop' }
  }
};
```

---

## Snapshot Strategy

### Component Categories

| Category | Themes | Viewports | States |
|----------|--------|-----------|--------|
| **Core UI** | All 20+ | Mobile, Desktop | Default, Hover, Focus, Disabled |
| **Layout** | Light, Dark, HC | All 4 | Default |
| **Forms** | Light, Dark, HC | Mobile, Desktop | Empty, Filled, Error, Loading |
| **CLI Specific** | All 20+ | All 4 | Default, Active, Streaming |

### Snapshot Configuration

```typescript
// Component-level chromatic config
export const parameters = {
  chromatic: {
    // Capture in these modes
    modes: {
      'light-desktop': { theme: 'light', viewport: 'desktop' },
      'dark-mobile': { theme: 'dark', viewport: 'mobile' },
      'hc-desktop': { theme: 'high-contrast', viewport: 'desktop' }
    },
    
    // Delay for animations to complete
    delay: 300,
    
    // Diff threshold (0-1)
    diffThreshold: 0.05,
    
    // Disable for stories that change frequently
    // disableSnapshot: true,
    
    // Pause animations
    pauseAnimationAtEnd: true
  }
};
```

### Ignoring Flaky Elements

```typescript
// For elements that change (dates, random IDs)
export const parameters = {
  chromatic: {
    diffIncludeAntiAliasing: false,
    // Ignore specific regions
    ignoreSelectors: [
      '[data-chromatic-ignore]',
      '.timestamp',
      '.random-id'
    ]
  }
};

// In component
<span data-chromatic-ignore>{new Date().toISOString()}</span>
```

---

## Story Organization

### Folder Structure

```
src/
├── components/
│   ├── ui/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.stories.tsx
│   │   │   └── Button.test.tsx
│   │   ├── Card/
│   │   │   ├── Card.tsx
│   │   │   └── Card.stories.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── Header/
│   │   │   ├── Header.tsx
│   │   │   └── Header.stories.tsx
│   │   └── Sidebar/
│   └── cli/
│       ├── LogViewer/
│       │   ├── LogViewer.tsx
│       │   └── LogViewer.stories.tsx
│       ├── Terminal/
│       └── ApiTester/
├── pages/
│   ├── Settings/
│   │   ├── Settings.tsx
│   │   └── Settings.stories.tsx
│   └── ...
└── stories/
    ├── Introduction.mdx
    ├── Colors.mdx
    ├── Typography.mdx
    └── Themes.mdx
```

### Documentation Stories

```mdx
{/* stories/Themes.mdx */}
import { Meta, ColorPalette, ColorItem } from '@storybook/blocks';

<Meta title="Design System/Themes" />

# Theme System

All CLI frontends support 20+ themes selectable via settings.

## Base Themes

<ColorPalette>
  <ColorItem title="Light" subtitle="Default light theme" colors={{ 
    background: '#ffffff',
    foreground: '#0a0a0a',
    primary: '#171717',
    secondary: '#f5f5f5'
  }} />
  <ColorItem title="Dark" subtitle="Default dark theme" colors={{
    background: '#0a0a0a',
    foreground: '#fafafa',
    primary: '#fafafa',
    secondary: '#262626'
  }} />
</ColorPalette>

## Editor Themes

<ColorPalette>
  <ColorItem title="Dracula" subtitle="Popular dark theme" colors={{
    background: '#282a36',
    foreground: '#f8f8f2',
    primary: '#bd93f9',
    accent: '#ff79c6'
  }} />
  <ColorItem title="Nord" subtitle="Arctic-inspired" colors={{
    background: '#2e3440',
    foreground: '#eceff4',
    primary: '#88c0d0',
    accent: '#5e81ac'
  }} />
</ColorPalette>
```

---

## Testing Workflow

### Local Development

```bash
# Start Storybook
npm run storybook

# Run interaction tests
npm run test-storybook

# Build for Chromatic
npm run build-storybook
```

### Pull Request Workflow

1. **Developer pushes changes**
2. **CI builds Storybook**
3. **Chromatic captures snapshots**
4. **Visual diff generated**
5. **Reviewer approves/rejects changes**
6. **Approved changes become new baseline**

### Review Process

| Status | Action |
|--------|--------|
| ✅ No changes | Auto-approve |
| ⚠️ Visual changes | Review required |
| ❌ Build failure | Fix and re-run |

---

## Performance Optimization

### Snapshot Limits

| Component Type | Max Snapshots |
|---------------|---------------|
| Core UI components | 5 themes × 2 viewports = 10 |
| Layout components | 2 themes × 4 viewports = 8 |
| Page compositions | 2 themes × 2 viewports = 4 |
| CLI-specific | All themes × 2 viewports = 40+ |

### Optimization Strategies

```typescript
// Skip snapshots for dev-only stories
export const Playground: Story = {
  parameters: {
    chromatic: { disableSnapshot: true }
  }
};

// Reduce viewport coverage for simple components
export const Simple: Story = {
  parameters: {
    chromatic: {
      viewports: [1280] // Desktop only
    }
  }
};

// Batch related components
export const AllSizes: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  )
};
```

---

## Cross-References

- **Component Library:** `spec/28-shared-cli-frontend/10-component-library.md`
- **E2E Testing:** `spec/28-shared-cli-frontend/11-e2e-test-spec.md`
- **Accessibility:** `spec/28-shared-cli-frontend/12-accessibility-spec.md`
- **Theme Support:** `spec/07-seedable-config-architecture/00-overview.md#theme-support`
