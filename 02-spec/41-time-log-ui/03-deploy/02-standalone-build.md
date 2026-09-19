# Time Log UI: Standalone Build

**Version:** 1.0.0  
**Updated:** 2026-03-28

---

## Overview

For development and testing, the UI runs as a standalone Vite application on `localhost:5173`, proxying API requests to the CLI daemon on `localhost:9847`. This enables hot module replacement (HMR), fast iteration, and browser DevTools debugging.

---

## Development Server

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:9847",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query"],
          charts: ["recharts"],
          ui: ["@radix-ui/react-tooltip", "lucide-react"],
        },
      },
    },
  },
});
```

### Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 5173",
    "lint": "eslint . --ext ts,tsx",
    "test": "vitest",
    "test:ci": "vitest run --coverage"
  }
}
```

---

## Production Build

### Build Output

```bash
npm run build
```

Produces `dist/` directory:

```
dist/
├── index.html              # Entry HTML (references hashed assets)
├── assets/
│   ├── index-[hash].js     # Main application bundle
│   ├── vendor-[hash].js    # React + router chunk
│   ├── query-[hash].js     # TanStack Query chunk
│   ├── charts-[hash].js    # Recharts chunk
│   ├── ui-[hash].js        # Radix + Lucide chunk
│   ├── index-[hash].css    # Compiled Tailwind CSS
│   └── *.woff2             # Font files
└── favicon.ico
```

### Size Targets

| Chunk | Target | Notes |
|-------|--------|-------|
| Main bundle | < 150 KB (gzip) | App logic, pages, components |
| Vendor | < 50 KB (gzip) | React, React DOM, Router |
| Query | < 15 KB (gzip) | TanStack Query |
| Charts | < 80 KB (gzip) | Recharts |
| CSS | < 20 KB (gzip) | Tailwind (purged) |
| **Total** | **< 350 KB (gzip)** | All assets combined |

---

## Environment Variables

```bash
# .env.development (standalone dev)
VITE_API_BASE_URL=http://127.0.0.1:9847/api/v1

# .env.production (embedded mode — relative URL)
VITE_API_BASE_URL=/api/v1
```

```typescript
// src/lib/constants.ts
export const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";
```

This allows the same codebase to work in both standalone (absolute URL) and embedded (relative URL) modes.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 18 LTS | Runtime |
| npm | ≥ 9 | Package manager |
| Time Log CLI | Running | API source on port 9847 |

### Quick Start

```bash
# 1. Install dependencies
cd timelog-ui && npm install

# 2. Ensure CLI daemon is running
timelog daemon start

# 3. Start dev server
npm run dev

# 4. Open http://localhost:5173
```

---

## Proxy Error Handling

When the CLI daemon is not running, the Vite proxy returns connection errors. The UI handles this gracefully:

1. API client catches `ECONNREFUSED` / network errors
2. Status indicator shows 🔴 Disconnected
3. Reconnect banner displayed with "Start the daemon" instructions
4. Polling retries every 5 seconds

---

## Static File Serving (Alternative)

For testing the production build without embedding in the CLI binary:

```bash
# Build
npm run build

# Serve with Vite preview
npm run preview

# Or use any static server
npx serve dist -l 5173
```

The Vite preview server also proxies `/api` requests to the CLI daemon.

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Embedded Serving | `./01-embedded-serving.md` |
| UI Architecture | `../02-frontend/01-architecture.md` |
| State Management | `../02-frontend/03-state-management.md` |
