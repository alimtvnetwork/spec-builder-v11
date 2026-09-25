# Next.js Search Interface — Modern App Router & Streaming Retrieval

> **Path:** `02-spec/25-gsearch-cli/02-frontend/06-nextjs-search-interface.md`  
> **Status:** ACTIVE  
> **Target Module:** `src/app/search`  
> **Authority:** Single Source of Truth for Next.js Search UI & Streaming Client

---

## Architectural Purpose

This specification governs the Next.js 14+ / React 18 web interface for GSearch CLI. It delivers a modern, reactive search console utilizing App Router Server Components, Server Actions, and Server-Sent Events (SSE) streaming. An agentic AI can consume real-time search synthesis, query expansions, and direct source citations with zero lag.

---

## Component Topology & File Locations

| Component / File | Destination Path | Purpose |
|---|---|---|
| `SearchPage` | `src/app/search/page.tsx` | Server Component page hosting search input, filters, and streaming container |
| `SearchActions` | `src/app/search/actions.ts` | Next.js Server Actions invoking local GSearch daemon via JSON-RPC / HTTP |
| `SearchInputBar` | `src/components/search/SearchInputBar.tsx` | Debounced query input with engine selector pill bar |
| `SearchResultList` | `src/components/search/SearchResultList.tsx` | Virtualized search result list rendering ranked snippets and badges |
| `SearchStreamViewer` | `src/components/search/SearchStreamViewer.tsx` | Streaming token visualizer rendering AI synthesis in real-time |
| `types.ts` | `src/app/search/types.ts` | Centralized TypeScript contracts for search UI |

---

## Data Contracts (`src/app/search/types.ts`)

```typescript
export type PreferredEngineType = 'Auto' | 'Brave' | 'Google' | 'Bing';

export interface SearchQueryRequest {
  query: string;
  engine: PreferredEngineType;
  maxResults: number;
  hasAiSynthesis: boolean;
  hasCacheEnabled: boolean;
}

export interface SearchResultItem {
  id: string;
  url: string;
  title: string;
  snippet: string;
  engineSource: string;
  rankPosition: number;
  isCached: boolean;
  publishedDate?: string;
}

export interface SearchStreamChunk {
  chunkIndex: number;
  deltaText: string;
  isCompleted: boolean;
  hasErrors: boolean;
  errorMessage?: string;
}

export interface SearchUIState {
  activeQuery: string;
  selectedEngine: PreferredEngineType;
  isLoading: boolean;
  isStreaming: boolean;
  hasResults: boolean;
  results: SearchResultItem[];
  streamedSynthesis: string;
}
```

---

## Server Action & Streaming Architecture

1. **Server Action Dispatch (`actions.ts`):**
   - Server Action `executeSearch(request: SearchQueryRequest)` communicates directly with GSearch daemon at `http://127.0.0.1:8088/api/v1/search`.
   - Uses Node.js `fetch` with `cache: 'no-store'` for real-time fresh queries.
   - Enforces positive boolean checks (`request.hasCacheEnabled`).

2. **Edge Streaming & React Suspense:**
   - Real-time AI synthesis streams through Next.js Route Handler `src/app/api/search/stream/route.ts` using `TransformStream`.
   - `SearchStreamViewer` attaches `EventSource` or `ReadableStream` reader, appending chunks smoothly.
   - Skeleton fallback states rendered via React `<Suspense fallback={<SearchResultSkeleton />}>`.

3. **Accessibility & Keyboard Navigation:**
   - Shortcut `/`: Automatically focuses search input bar.
   - Shortcut `j` / `k`: Navigates up and down the result list items.
   - Shortcut `Enter`: Opens selected item URL in a new tab.

---

## Verification & Acceptance Criteria

```gherkin
Feature: Next.js Search Interface
  Scenario: Submitting search query streams results in real time
    Given User inputs query "Agentic AI specifications"
    When Form is submitted via executeSearch Server Action
    Then isLoading transitions to true
    And SearchResultList renders streaming chunks
    And isStreaming transitions to false upon stream completion

  Scenario: Pressing forward slash focuses search input
    Given User is navigating search results
    When User presses "/" key
    Then SearchInputBar receives keyboard focus
```
