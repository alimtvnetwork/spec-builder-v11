# API Tester Specification


**Last Updated:** 2026-03-20  

> **Version:** 1.0.0  
> **Parent:** [00-overview.md](./00-overview.md)

---

## Summary

Interactive API endpoint testing UI with preset data, response viewer, and cURL export.

---

## Features

| Feature | Description |
|---------|-------------|
| Endpoint Discovery | Auto-discover available endpoints from backend |
| Preset Payloads | Pre-configured test data for each endpoint |
| Response Viewer | Formatted JSON/text response display |
| Request History | Track recent API calls |
| cURL Export | Copy request as cURL command |
| Error Display | Show errors in unified error modal |

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ API Tester                                                               │
├─────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────────────────────────────────────┐ │
│ │ Endpoints       │ │ Request                                         │ │
│ │ ───────────     │ │ ─────────                                       │ │
│ │ ▸ Search        │ │ Method: [GET ▼] URL: [/api/search           ]   │ │
│ │   • /search     │ │                                                 │ │
│ │   • /search/:id │ │ Headers:                                        │ │
│ │ ▸ Settings      │ │ ┌─────────────────────────────────────────────┐ │ │
│ │   • /settings   │ │ │ Content-Type: application/json              │ │ │
│ │   • /settings/  │ │ │ Authorization: Bearer xxx                   │ │ │
│ │     :category   │ │ └─────────────────────────────────────────────┘ │ │
│ │ ▸ System        │ │                                                 │ │
│ │   • /health     │ │ Body:                                           │ │
│ │   • /version    │ │ ┌─────────────────────────────────────────────┐ │ │
│ │                 │ │ │ {                                           │ │ │
│ │ Presets         │ │ │   "keywords": "machine learning",           │ │ │
│ │ ───────         │ │ │   "engine": "google",                       │ │ │
│ │ ○ Empty         │ │ │   "maxResults": 10                          │ │ │
│ │ ● Basic Search  │ │ │ }                                           │ │ │
│ │ ○ Nested Search │ │ └─────────────────────────────────────────────┘ │ │
│ │ ○ With Cache    │ │                                                 │ │
│ │                 │ │ [Send Request] [Copy cURL] [Clear]              │ │
│ └─────────────────┘ └─────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Response                                                   200 OK   │ │
│ │ ─────────                                                  45ms     │ │
│ │ ┌─────────────────────────────────────────────────────────────────┐ │ │
│ │ │ {                                                               │ │ │
│ │ │   "searchId": "abc123",                                         │ │ │
│ │ │   "status": "completed",                                        │ │ │
│ │ │   "resultCount": 25,                                            │ │ │
│ │ │   "results": [                                                  │ │ │
│ │ │     { "title": "Introduction to ML", "url": "..." }             │ │ │
│ │ │   ]                                                             │ │ │
│ │ │ }                                                               │ │ │
│ │ └─────────────────────────────────────────────────────────────────┘ │ │
│ │ [Copy Response] [Format JSON] [Show Raw]                            │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ History                                                             │ │
│ │ ─────────                                                           │ │
│ │ 12:34:56 POST /api/search         200 OK    45ms                    │ │
│ │ 12:33:21 GET  /api/settings       200 OK    12ms                    │ │
│ │ 12:32:05 POST /api/search         500 Error  --                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Preset Data Format

### presets.json

```json
{
  "version": "1.0.0",
  "endpoints": [
    {
      "id": "search-basic",
      "name": "Basic Search",
      "method": "POST",
      "path": "/api/search",
      "description": "Perform a basic keyword search",
      "presets": [
        {
          "name": "Empty",
          "body": {}
        },
        {
          "name": "Basic Search",
          "body": {
            "keywords": "machine learning",
            "engine": "google",
            "maxResults": 10
          }
        },
        {
          "name": "Nested Search",
          "body": {
            "keywords": "artificial intelligence",
            "engine": "google",
            "nested": true,
            "maxDepth": 2
          }
        }
      ]
    },
    {
      "id": "search-status",
      "name": "Search Status",
      "method": "GET",
      "path": "/api/search/:id",
      "description": "Get status of a search request",
      "pathParams": [
        {
          "name": "id",
          "example": "abc123"
        }
      ]
    },
    {
      "id": "settings-get",
      "name": "Get Settings",
      "method": "GET",
      "path": "/api/settings",
      "description": "Retrieve all settings"
    },
    {
      "id": "health",
      "name": "Health Check",
      "method": "GET",
      "path": "/api/health",
      "description": "Check service health"
    }
  ]
}
```

---

## React Component

```typescript
// pages/ApiTester.tsx
import { useState } from 'react';
import { useApiTester } from '@/hooks/useApiTester';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function ApiTester() {
  const {
    endpoints,
    selectedEndpoint,
    setSelectedEndpoint,
    presets,
    selectedPreset,
    setSelectedPreset,
    body,
    setBody,
    response,
    isLoading,
    sendRequest,
    history,
    copyAsCurl
  } = useApiTester();

  return (
    <div className="grid grid-cols-4 gap-4 p-6 h-full">
      {/* Sidebar */}
      <div className="col-span-1 border rounded-lg p-4">
        <h3 className="font-semibold mb-4">Endpoints</h3>
        <div className="space-y-2">
          {endpoints.map(ep => (
            <button
              key={ep.id}
              onClick={() => setSelectedEndpoint(ep)}
              className={`w-full text-left p-2 rounded ${
                selectedEndpoint?.id === ep.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              <span className="font-mono text-xs">{ep.method}</span> {ep.name}
            </button>
          ))}
        </div>
        
        {presets.length > 0 && (
          <>
            <h3 className="font-semibold mt-6 mb-4">Presets</h3>
            <div className="space-y-2">
              {presets.map(preset => (
                <label key={preset.name} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="preset"
                    checked={selectedPreset?.name === preset.name}
                    onChange={() => setSelectedPreset(preset)}
                  />
                  {preset.name}
                </label>
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Main area */}
      <div className="col-span-3 space-y-4">
        {/* Request */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Request</h3>
          <div className="flex gap-2 mb-4">
            <span className="font-mono bg-muted px-2 py-1 rounded">
              {selectedEndpoint?.method}
            </span>
            <input
              className="flex-1 font-mono bg-muted px-2 py-1 rounded"
              value={selectedEndpoint?.path || ''}
              readOnly
            />
          </div>
          
          {selectedEndpoint?.method !== 'GET' && (
            <Textarea
              className="font-mono"
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Request body (JSON)"
            />
          )}
          
          <div className="flex gap-2 mt-4">
            <Button onClick={sendRequest} disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Request'}
            </Button>
            <Button variant="outline" onClick={copyAsCurl}>
              Copy cURL
            </Button>
          </div>
        </div>
        
        {/* Response */}
        {response && (
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Response</h3>
              <span className={`px-2 py-1 rounded text-sm ${
                response.status < 400 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {response.status} {response.statusText} • {response.duration}ms
              </span>
            </div>
            <pre className="bg-muted p-4 rounded overflow-auto max-h-64 font-mono text-sm">
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </div>
        )}
        
        {/* History */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">History</h3>
          <div className="space-y-2 max-h-32 overflow-auto">
            {history.map((item, i) => (
              <div key={i} className="flex justify-between text-sm font-mono">
                <span>{item.time}</span>
                <span>{item.method} {item.path}</span>
                <span className={item.status < 400 ? 'text-green-600' : 'text-red-600'}>
                  {item.status}
                </span>
                <span>{item.duration}ms</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## cURL Export

```typescript
function generateCurl(endpoint: Endpoint, body: string): string {
  const parts = ['curl'];
  
  parts.push(`-X ${endpoint.method}`);
  parts.push(`'${BASE_URL}${endpoint.path}'`);
  parts.push("-H 'Content-Type: application/json'");
  
  if (body && endpoint.method !== 'GET') {
    parts.push(`-d '${body}'`);
  }
  
  return parts.join(' \\\n  ');
}
```

---

*Standard API tester for all CLI frontends.*
