# Phase 8: React Testing UI

**Version:** 2.0.0  
**Updated:** 2026-03-09  
**Type:** Frontend Specification  

---

## Overview

Phase 8 defines the React-based Testing UI for the GSearch Business Intelligence API. This interactive interface provides endpoint exploration, live OpenAPI documentation, request building, response visualization, and development/debugging capabilities. Following the separate CLI frontend pattern, this UI is isolated specifically for BI API testing.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     BI Testing UI                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Sidebar    │  │  Main Panel │  │  Response   │             │
│  │  Navigation │  │  Request    │  │  Viewer     │             │
│  │             │  │  Builder    │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  OpenAPI    │  │  History    │  │  Settings   │             │
│  │  Viewer     │  │  Panel      │  │  Manager    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  API Gateway    │
                    │  /api/v1/bi     │
                    └─────────────────┘
```

---

## Component Structure

```
src/
├── pages/
│   └── BiTestingUI.tsx           # Main page component
├── components/
│   └── bi-testing/
│       ├── BiTestingLayout.tsx    # Layout wrapper
│       ├── EndpointSidebar.tsx    # Navigation sidebar
│       ├── RequestBuilder.tsx     # Request construction
│       ├── ResponseViewer.tsx     # Response display
│       ├── OpenApiViewer.tsx      # Live documentation
│       ├── HistoryPanel.tsx       # Request history
│       ├── AuthManager.tsx        # API key management
│       ├── SettingsPanel.tsx      # UI configuration
│       └── components/
│           ├── EndpointCard.tsx   # Endpoint list item
│           ├── ParamInput.tsx     # Parameter input field
│           ├── JsonEditor.tsx     # JSON body editor
│           ├── ResponseTabs.tsx   # Response sections
│           ├── StatusBadge.tsx    # HTTP status display
│           ├── CopyButton.tsx     # Copy to clipboard
│           └── CodeBlock.tsx      # Syntax highlighting
├── hooks/
│   └── bi-testing/
│       ├── useApiRequest.ts       # API request execution
│       ├── useRequestHistory.ts   # History management
│       ├── useOpenApiSpec.ts      # OpenAPI fetching
│       ├── useAuthStorage.ts      # API key storage
│       └── useEndpointSchema.ts   # Schema extraction
├── types/
│   └── bi-testing.ts              # TypeScript definitions
└── lib/
    └── bi-testing/
        ├── endpoint-registry.ts   # Endpoint definitions
        ├── request-builder.ts     # Request construction
        └── response-parser.ts     # Response formatting
```

---

## Core Components

### BiTestingLayout

```tsx
// BiTestingLayout.tsx - Main layout component
import { useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface BiTestingLayoutProps {
  children?: React.ReactNode;
}

export function BiTestingLayout({ children }: BiTestingLayoutProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [response, setResponse] = useState<ApiResponse | null>(null);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">BI API Testing</h1>
          <StatusIndicator />
        </div>
        <div className="flex items-center gap-2">
          <AuthManager />
          <SettingsButton />
        </div>
      </header>

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Sidebar */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <EndpointSidebar
            onSelect={setSelectedEndpoint}
            selected={selectedEndpoint}
          />
        </ResizablePanel>
        
        <ResizableHandle />

        {/* Request Builder */}
        <ResizablePanel defaultSize={40} minSize={30}>
          <RequestBuilder
            endpoint={selectedEndpoint}
            onResponse={setResponse}
          />
        </ResizablePanel>

        <ResizableHandle />

        {/* Response Viewer */}
        <ResizablePanel defaultSize={40} minSize={25}>
          <ResponseViewer response={response} />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Bottom Panel (collapsible) */}
      <HistoryPanel />
    </div>
  );
}
```

### EndpointSidebar

```tsx
// EndpointSidebar.tsx - Endpoint navigation
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface EndpointSidebarProps {
  onSelect: (endpoint: Endpoint) => void;
  selected: Endpoint | null;
}

const endpointGroups: EndpointGroup[] = [
  {
    name: "Search",
    icon: "Search",
    endpoints: [
      { method: HttpMethod.Post, path: "/search", name: "Execute Search" },
      { method: HttpMethod.Get, path: "/search/engines", name: "List Engines" },
      { method: HttpMethod.Get, path: "/search/methods", name: "List Methods" },
    ],
  },
  {
    name: "FAQ",
    icon: "HelpCircle",
    endpoints: [
      { method: HttpMethod.Post, path: "/faq/discover", name: "Discover FAQs" },
      { method: HttpMethod.Post, path: "/faq/expand", name: "Expand PAA" },
    ],
  },
  {
    name: "SERP Tracking",
    icon: "TrendingUp",
    endpoints: [
      { method: HttpMethod.Post, path: "/serp/check", name: "Position Check" },
      { method: HttpMethod.Post, path: "/serp/track", name: "Create Tracker" },
      { method: HttpMethod.Get, path: "/serp/track/:id", name: "Tracker Status" },
      { method: HttpMethod.Delete, path: "/serp/track/:id", name: "Cancel Tracker" },
      { method: HttpMethod.Get, path: "/serp/history", name: "Position History" },
      { method: HttpMethod.Get, path: "/serp/competitors", name: "Competitors" },
    ],
  },
  {
    name: "Contact",
    icon: "Mail",
    endpoints: [
      { method: HttpMethod.Post, path: "/contact/extract", name: "Extract Contact" },
      { method: HttpMethod.Post, path: "/contact/batch", name: "Batch Extract" },
      { method: HttpMethod.Get, path: "/contact/batch/:id", name: "Batch Status" },
      { method: HttpMethod.Get, path: "/contact/verify", name: "Verify Contact" },
    ],
  },
  {
    name: "Maps",
    icon: "MapPin",
    endpoints: [
      { method: HttpMethod.Post, path: "/maps/search", name: "Search Maps" },
      { method: HttpMethod.Post, path: "/maps/job", name: "Create Job" },
      { method: HttpMethod.Get, path: "/maps/job/:id", name: "Job Status" },
      { method: HttpMethod.Patch, path: "/maps/job/:id", name: "Update Job" },
      { method: HttpMethod.Delete, path: "/maps/job/:id", name: "Cancel Job" },
      { method: HttpMethod.Get, path: "/maps/job/:id/results", name: "Job Results" },
    ],
  },
  {
    name: "Extract",
    icon: "FileText",
    endpoints: [
      { method: HttpMethod.Post, path: "/extract", name: "Extract URL" },
      { method: HttpMethod.Post, path: "/extract/batch", name: "Batch Extract" },
    ],
  },
  {
    name: "Cache",
    icon: "Database",
    endpoints: [
      { method: HttpMethod.Get, path: "/cache/stats", name: "Cache Stats" },
      { method: HttpMethod.Delete, path: "/cache", name: "Clear All" },
      { method: HttpMethod.Delete, path: "/cache/:category", name: "Clear Category" },
    ],
  },
  {
    name: "Webhook",
    icon: "Webhook",
    endpoints: [
      { method: HttpMethod.Post, path: "/webhook", name: "Create Webhook" },
      { method: HttpMethod.Get, path: "/webhook", name: "List Webhooks" },
      { method: HttpMethod.Delete, path: "/webhook/:id", name: "Delete Webhook" },
      { method: HttpMethod.Post, path: "/webhook/test/:id", name: "Test Webhook" },
    ],
  },
];

export function EndpointSidebar({ onSelect, selected }: EndpointSidebarProps) {
  const [search, setSearch] = useState("");
  
  const filteredGroups = filterEndpoints(endpointGroups, search);

  return (
    <div className="h-full flex flex-col border-r">
      <div className="p-3 border-b">
        <Input
          placeholder="Search endpoints..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8"
        />
      </div>
      
      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={["Search", "SERP Tracking"]}>
          {filteredGroups.map((group) => (
            <AccordionItem key={group.name} value={group.name}>
              <AccordionTrigger className="px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <Icon name={group.icon} className="h-4 w-4" />
                  {group.name}
                  <span className="text-muted-foreground text-xs">
                    ({group.endpoints.length})
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {group.endpoints.map((endpoint) => (
                  <EndpointCard
                    key={`${endpoint.method}-${endpoint.path}`}
                    endpoint={endpoint}
                    isSelected={selected?.path === endpoint.path}
                    onClick={() => onSelect(endpoint)}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  );
}
```

### RequestBuilder

```tsx
// RequestBuilder.tsx - Request construction panel
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useApiRequest } from "@/hooks/bi-testing/useApiRequest";
import { useEndpointSchema } from "@/hooks/bi-testing/useEndpointSchema";

interface RequestBuilderProps {
  endpoint: Endpoint | null;
  onResponse: (response: ApiResponse) => void;
}

export function RequestBuilder({ endpoint, onResponse }: RequestBuilderProps) {
  const [params, setParams] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [body, setBody] = useState<string>("{}");
  const [headers, setHeaders] = useState<Record<string, string>>({});
  
  const { execute, loading, error } = useApiRequest();
  const { schema, examples } = useEndpointSchema(endpoint);

  useEffect(() => {
    if (endpoint && examples?.request) {
      setBody(JSON.stringify(examples.request, null, 2));
    }
  }, [endpoint, examples]);

  const handleSend = async () => {
    if (!endpoint) return;

    const response = await execute({
      method: endpoint.method,
      path: buildPath(endpoint.path, params),
      query: queryParams,
      body: endpoint.method !== HttpMethod.Get ? JSON.parse(body) : undefined,
      headers,
    });

    onResponse(response);
  };

  if (!endpoint) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Select an endpoint to start
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Endpoint Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <MethodBadge method={endpoint.method} />
          <code className="text-sm flex-1">{endpoint.path}</code>
          <Button onClick={handleSend} disabled={loading}>
            {loading ? <Spinner /> : "Send"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{endpoint.name}</p>
      </div>

      {/* Request Tabs */}
      <Tabs defaultValue="body" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          {hasPathParams(endpoint.path) && (
            <TabsTrigger value="params">Path Params</TabsTrigger>
          )}
          <TabsTrigger value="query">Query</TabsTrigger>
           {endpoint.method !== HttpMethod.Get && (
            <TabsTrigger value="body">Body</TabsTrigger>
          )}
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="auth">Auth</TabsTrigger>
        </TabsList>

        {hasPathParams(endpoint.path) && (
          <TabsContent value="params" className="flex-1 p-4">
            <PathParamsEditor
              path={endpoint.path}
              values={params}
              onChange={setParams}
            />
          </TabsContent>
        )}

        <TabsContent value="query" className="flex-1 p-4">
          <KeyValueEditor
            title="Query Parameters"
            values={queryParams}
            onChange={setQueryParams}
            schema={schema?.queryParams}
          />
        </TabsContent>

        {endpoint.method !== HttpMethod.Get && (
          <TabsContent value="body" className="flex-1 p-4">
            <div className="h-full flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Request Body</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBody(JSON.stringify(examples?.request, null, 2))}
                  >
                    Load Example
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setBody("{}")}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <JsonEditor
                value={body}
                onChange={setBody}
                schema={schema?.requestBody}
                className="flex-1"
              />
            </div>
          </TabsContent>
        )}

        <TabsContent value="headers" className="flex-1 p-4">
          <KeyValueEditor
            title="Custom Headers"
            values={headers}
            onChange={setHeaders}
          />
        </TabsContent>

        <TabsContent value="auth" className="flex-1 p-4">
          <AuthEditor endpoint={endpoint} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### ResponseViewer

```tsx
// ResponseViewer.tsx - Response display panel
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ResponseViewerProps {
  response: ApiResponse | null;
}

export function ResponseViewer({ response }: ResponseViewerProps) {
  const [activeTab, setActiveTab] = useState("body");

  if (!response) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground border-l">
        Response will appear here
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border-l">
      {/* Response Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <StatusBadge status={response.status} />
          <span className="text-sm text-muted-foreground">
            {response.duration}ms
          </span>
          <span className="text-sm text-muted-foreground">
            {formatBytes(response.size)}
          </span>
          <div className="flex-1" />
          <CopyButton value={JSON.stringify(response.data, null, 2)} />
        </div>
      </div>

      {/* Response Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="meta">Meta</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
        </TabsList>

        <TabsContent value="body" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              <CodeBlock
                language="json"
                code={JSON.stringify(response.data?.Data ?? response.data, null, 2)}
              />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="headers" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              <HeadersTable headers={response.headers} />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="meta" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              {response.data?.Meta ? (
                <CodeBlock
                  language="json"
                  code={JSON.stringify(response.data.Meta, null, 2)}
                />
              ) : (
                <p className="text-muted-foreground">No metadata available</p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="cache" className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              {response.data?.Cache ? (
                <CacheInfoCard cache={response.data.Cache} />
              ) : (
                <p className="text-muted-foreground">No cache information</p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### OpenApiViewer

```tsx
// OpenApiViewer.tsx - Live OpenAPI documentation
import { useOpenApiSpec } from "@/hooks/bi-testing/useOpenApiSpec";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface OpenApiViewerProps {
  endpoint?: Endpoint;
}

export function OpenApiViewer({ endpoint }: OpenApiViewerProps) {
  const { spec, loading, error } = useOpenApiSpec();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error.message} />;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold">API Documentation</h2>
        <p className="text-sm text-muted-foreground">
          {spec?.info?.title} v{spec?.info?.version}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {endpoint ? (
            <EndpointDocumentation
              spec={spec}
              method={endpoint.method}
              path={endpoint.path}
            />
          ) : (
            <FullApiDocumentation spec={spec} />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function EndpointDocumentation({ spec, method, path }) {
  const operation = spec?.paths?.[path]?.[method.toLowerCase()];

  if (!operation) {
    return <p className="text-muted-foreground">No documentation available</p>;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <section>
        <h3 className="font-medium mb-2">Description</h3>
        <p className="text-sm">{operation.description || operation.summary}</p>
      </section>

      {/* Parameters */}
      {operation.parameters?.length > 0 && (
        <section>
          <h3 className="font-medium mb-2">Parameters</h3>
          <ParameterTable parameters={operation.parameters} />
        </section>
      )}

      {/* Request Body */}
      {operation.requestBody && (
        <section>
          <h3 className="font-medium mb-2">Request Body</h3>
          <SchemaViewer schema={operation.requestBody.content?.["application/json"]?.schema} />
        </section>
      )}

      {/* Responses */}
      <section>
        <h3 className="font-medium mb-2">Responses</h3>
        <Accordion type="single" collapsible>
          {Object.entries(operation.responses || {}).map(([code, response]) => (
            <AccordionItem key={code} value={code}>
              <AccordionTrigger>
                <StatusBadge status={parseInt(code)} />
                <span className="ml-2">{response.description}</span>
              </AccordionTrigger>
              <AccordionContent>
                <SchemaViewer schema={response.content?.["application/json"]?.schema} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
```

### HistoryPanel

```tsx
// HistoryPanel.tsx - Request history panel
import { useState } from "react";
import { useRequestHistory } from "@/hooks/bi-testing/useRequestHistory";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface HistoryPanelProps {
  onReplay: (request: HistoryEntry) => void;
}

export function HistoryPanel({ onReplay }: HistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { history, clearHistory, removeEntry } = useRequestHistory();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border-t">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-muted/50">
            <div className="flex items-center gap-2">
              <ChevronIcon direction={isOpen ? "down" : "up"} />
              <span className="text-sm font-medium">History</span>
              <span className="text-xs text-muted-foreground">
                ({history.length} requests)
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                clearHistory();
              }}
            >
              Clear
            </Button>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <ScrollArea className="h-48">
            <div className="p-2 space-y-1">
              {history.map((entry) => (
                <HistoryEntry
                  key={entry.id}
                  entry={entry}
                  onReplay={() => onReplay(entry)}
                  onRemove={() => removeEntry(entry.id)}
                />
              ))}
              {history.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No requests yet
                </p>
              )}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function HistoryEntry({ entry, onReplay, onRemove }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 group">
      <MethodBadge method={entry.method} size="sm" />
      <code className="text-xs flex-1 truncate">{entry.path}</code>
      <StatusBadge status={entry.status} size="sm" />
      <span className="text-xs text-muted-foreground">{entry.duration}ms</span>
      <span className="text-xs text-muted-foreground">
        {formatTime(entry.timestamp)}
      </span>
      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
        <Button variant="ghost" size="icon" onClick={onReplay}>
          <PlayIcon className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <TrashIcon className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
```

---

## Hooks

### useApiRequest

```tsx
// hooks/bi-testing/useApiRequest.ts
import { useState, useCallback } from "react";
import { useAuthStorage } from "./useAuthStorage";
import { useRequestHistory } from "./useRequestHistory";

interface RequestOptions {
  method: string;
  path: string;
  query?: Record<string, string>;
  body?: unknown;
  headers?: Record<string, string>;
}

interface ApiResponse {
  status: number;
  data: unknown;
  headers: Record<string, string>;
  duration: number;
  size: number;
}

export function useApiRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { getApiKey } = useAuthStorage();
  const { addEntry } = useRequestHistory();

  const execute = useCallback(async (options: RequestOptions): Promise<ApiResponse> => {
    setLoading(true);
    setError(null);

    const startTime = performance.now();
    const apiKey = getApiKey();

    try {
      const url = new URL(`/api/v1/bi${options.path}`, window.location.origin);
      
      if (options.query) {
        Object.entries(options.query).forEach(([key, value]) => {
          if (value) url.searchParams.set(key, value);
        });
      }

      const response = await fetch(url.toString(), {
        method: options.method,
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey || "",
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const data = await response.json();
      const duration = Math.round(performance.now() - startTime);
      const size = new Blob([JSON.stringify(data)]).size;

      const result: ApiResponse = {
        status: response.status,
        data,
        headers: Object.fromEntries(response.headers.entries()),
        duration,
        size,
      };

      // Add to history
      addEntry({
        method: options.method,
        path: options.path,
        query: options.query,
        body: options.body,
        status: response.status,
        duration,
        timestamp: new Date(),
      });

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Request failed");
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getApiKey, addEntry]);

  return { execute, loading, error };
}
```

### useRequestHistory

```tsx
// hooks/bi-testing/useRequestHistory.ts
import { useState, useEffect, useCallback } from "react";

interface HistoryEntry {
  id: string;
  method: string;
  path: string;
  query?: Record<string, string>;
  body?: unknown;
  status: number;
  duration: number;
  timestamp: Date;
}

const MAX_HISTORY = 50;
const STORAGE_KEY = "bi-testing-history";

export function useRequestHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        })));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const addEntry = useCallback((entry: Omit<HistoryEntry, "id">) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
    };

    setHistory((prev) => [newEntry, ...prev].slice(0, MAX_HISTORY));
  }, []);

  const removeEntry = useCallback((id: string) => {
    setHistory((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return { history, addEntry, removeEntry, clearHistory };
}
```

### useAuthStorage

```tsx
// hooks/bi-testing/useAuthStorage.ts
import { useState, useCallback } from "react";

interface StoredKey {
  id: string;
  name: string;
  prefix: string; // First 8 chars for display
  isActive: boolean;
}

const STORAGE_KEY = "bi-testing-auth";

export function useAuthStorage() {
  const [keys, setKeys] = useState<StoredKey[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(`${STORAGE_KEY}-keys`) || "[]");
    } catch {
      return [];
    }
  });

  const [activeKeyId, setActiveKeyId] = useState<string | null>(() => {
    return sessionStorage.getItem(`${STORAGE_KEY}-active`);
  });

  const addKey = useCallback((name: string, key: string) => {
    const id = crypto.randomUUID();
    const prefix = key.slice(0, 8);

    // Store key in session only (not localStorage for security)
    sessionStorage.setItem(`${STORAGE_KEY}-${id}`, key);

    const newKey: StoredKey = { id, name, prefix, isActive: false };
    setKeys((prev) => {
      const updated = [...prev, newKey];
      sessionStorage.setItem(`${STORAGE_KEY}-keys`, JSON.stringify(updated));
      return updated;
    });

    return id;
  }, []);

  const removeKey = useCallback((id: string) => {
    sessionStorage.removeItem(`${STORAGE_KEY}-${id}`);
    setKeys((prev) => {
      const updated = prev.filter((k) => k.id !== id);
      sessionStorage.setItem(`${STORAGE_KEY}-keys`, JSON.stringify(updated));
      return updated;
    });

    if (activeKeyId === id) {
      setActiveKeyId(null);
      sessionStorage.removeItem(`${STORAGE_KEY}-active`);
    }
  }, [activeKeyId]);

  const setActiveKey = useCallback((id: string | null) => {
    setActiveKeyId(id);
    if (id) {
      sessionStorage.setItem(`${STORAGE_KEY}-active`, id);
    } else {
      sessionStorage.removeItem(`${STORAGE_KEY}-active`);
    }
  }, []);

  const getApiKey = useCallback((): string | null => {
    if (!activeKeyId) return null;
    return sessionStorage.getItem(`${STORAGE_KEY}-${activeKeyId}`);
  }, [activeKeyId]);

  return { keys, activeKeyId, addKey, removeKey, setActiveKey, getApiKey };
}
```

---

## Type Definitions

```tsx
// types/bi-testing.ts

export interface Endpoint {
  method: HttpMethod;
  path: string;
  name: string;
  description?: string;
  tags?: string[];
}

export interface EndpointGroup {
  name: string;
  icon: string;
  endpoints: Endpoint[];
}

export interface ApiResponse {
  status: number;
  data: ResponseEnvelope | unknown;
  headers: Record<string, string>;
  duration: number;
  size: number;
}

export interface ResponseEnvelope {
  Success: boolean;
  Data?: unknown;
  Meta?: ResponseMeta;
  Pagination?: PaginationMeta;
  Cache?: CacheMeta;
  Errors?: ResponseError[];
}

export interface ResponseMeta {
  RequestId: string;
  Timestamp: string;
  Duration: number;
  Version: string;
  Engine?: string;
  Method?: string;
}

export interface PaginationMeta {
  Page: number;
  PerPage: number;
  Total: number;
  TotalPages: number;
  HasNext: boolean;
  HasPrev: boolean;
}

export interface CacheMeta {
  Hit: boolean;
  Key: string;
  CreatedAt: string;
  ExpiresAt: string;
  TtlDays: number;
  Source: "fresh" | "cache" | "stale";
}

export interface ResponseError {
  Code: number;
  Message: string;
  Field?: string;
  Details?: string;
}

export interface HistoryEntry {
  id: string;
  method: string;
  path: string;
  query?: Record<string, string>;
  body?: unknown;
  status: number;
  duration: number;
  timestamp: Date;
}

export interface EndpointSchema {
  pathParams?: ParameterSchema[];
  queryParams?: ParameterSchema[];
  requestBody?: JsonSchema;
  responses?: Record<string, ResponseSchema>;
}

export interface ParameterSchema {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  default?: unknown;
  enum?: string[];
}

export interface JsonSchema {
  type: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  description?: string;
}

export interface ResponseSchema {
  description: string;
  schema?: JsonSchema;
}
```

---

## Styling

### Method Badges

```tsx
// components/bi-testing/components/MethodBadge.tsx
import { cn } from "@/lib/utils";

const methodColors: Record<string, string> = {
  GET: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  POST: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  PUT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  PATCH: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  DELETE: "bg-red-500/10 text-red-600 border-red-500/20",
};

interface MethodBadgeProps {
  method: string;
  size?: "sm" | "md";
}

export function MethodBadge({ method, size = "md" }: MethodBadgeProps) {
  return (
    <span
      className={cn(
        "font-mono font-medium border rounded",
        methodColors[method] || "bg-muted text-muted-foreground",
        size === "sm" ? "text-xs px-1.5 py-0.5" : "text-sm px-2 py-1"
      )}
    >
      {method}
    </span>
  );
}
```

### Status Badges

```tsx
// components/bi-testing/components/StatusBadge.tsx
import { cn } from "@/lib/utils";

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) {
    return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  }
  if (status >= 300 && status < 400) {
    return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  }
  if (status >= 400 && status < 500) {
    return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  }
  return "bg-red-500/10 text-red-600 border-red-500/20";
}

interface StatusBadgeProps {
  status: number;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "font-mono font-medium border rounded",
        getStatusColor(status),
        size === "sm" ? "text-xs px-1.5 py-0.5" : "text-sm px-2 py-1"
      )}
    >
      {status}
    </span>
  );
}
```

---

## Features

### Endpoint Explorer
- Grouped navigation by feature area
- Search/filter functionality
- Method-colored badges
- Quick endpoint switching

### Request Builder
- Path parameter substitution
- Query parameter editor
- JSON body editor with validation
- Custom headers support
- API key management

### Response Viewer
- Syntax-highlighted JSON
- Tabbed sections (Body, Headers, Meta, Cache)
- Status/timing display
- Copy to clipboard
- Size formatting

### Live Documentation
- OpenAPI spec integration
- Schema visualization
- Parameter documentation
- Response examples

### History Panel
- Collapsible design
- Request replay
- Persistent storage (non-sensitive only)
- Clear/remove functionality

### Security
- API keys in sessionStorage only
- No password/token persistence to localStorage
- Secure form handling

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Unified REST API | `48-unified-rest-api.md` |
| BI Suite Summary | `40-bi-suite-summary.md` |
| Frontend UI Patterns | `.ai-memory/memories/technical/frontend-ui-patterns.md` |
| CLI Frontend Standard | `.ai-memory/memories/technical/frontend-ui-patterns.md` |
| SEO Testing Infrastructure | `.ai-memory/memories/technical/seo-openapi-specification.md` |
