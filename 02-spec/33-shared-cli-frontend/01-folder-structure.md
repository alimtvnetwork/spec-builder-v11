# CLI Frontend Folder Structure


**Last Updated:** 2026-03-20  

> **Version:** 1.0.0  
> **Parent:** [00-overview.md](./00-overview.md)

---

## Summary

Standard folder structure for React frontend in each CLI project.

---

## Directory Layout

```
frontend/
├── public/
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── fonts/
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── ...
│   │   ├── common/                 # Shared components
│   │   │   ├── ErrorModal.tsx
│   │   │   ├── LogViewer.tsx
│   │   │   ├── SettingsPanel.tsx
│   │   │   ├── ApiTester.tsx
│   │   │   ├── ChangelogModal.tsx
│   │   │   └── ConnectionStatus.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── MainLayout.tsx
│   ├── hooks/
│   │   ├── useWebSocket.ts         # WebSocket connection
│   │   ├── useSettings.ts          # Settings management
│   │   ├── useApiTester.ts         # API testing logic
│   │   ├── useLogs.ts              # Log stream handling
│   │   └── useVersion.ts           # Version checking
│   ├── lib/
│   │   ├── api.ts                  # HTTP client
│   │   ├── websocket.ts            # WS utilities
│   │   ├── storage.ts              # Local storage helpers
│   │   └── utils.ts                # General utilities
│   ├── pages/
│   │   ├── Dashboard.tsx           # Main dashboard
│   │   ├── Settings.tsx            # Settings page
│   │   ├── Logs.tsx                # Log viewer page
│   │   ├── ApiTester.tsx           # API tester page
│   │   └── About.tsx               # Version/changelog
│   ├── stores/
│   │   ├── settingsStore.ts        # Zustand settings store
│   │   ├── logsStore.ts            # Zustand logs store
│   │   └── connectionStore.ts      # Connection state
│   ├── types/
│   │   ├── api.ts                  # API types
│   │   ├── settings.ts             # Settings types
│   │   ├── logs.ts                 # Log types
│   │   └── websocket.ts            # WS message types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## Key Files

### App.tsx

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Settings from '@/pages/Settings';
import Logs from '@/pages/Logs';
import ApiTester from '@/pages/ApiTester';
import About from '@/pages/About';
import { useVersion } from '@/hooks/useVersion';
import ChangelogModal from '@/components/common/ChangelogModal';

const queryClient = new QueryClient();

function App() {
  const { showChangelog, dismissChangelog, changelog } = useVersion();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/api-tester" element={<ApiTester />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </MainLayout>
        <ChangelogModal 
          open={showChangelog} 
          onClose={dismissChangelog}
          changelog={changelog}
        />
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

---

## Environment Variables

### .env.example

```env
# Backend connection
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080/ws

# Feature flags
VITE_ENABLE_DEV_TOOLS=true
VITE_LOG_LEVEL=debug
```

---

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx",
    "type-check": "tsc --noEmit"
  }
}
```

---

*Standard structure ensures consistency across all CLI frontends.*
