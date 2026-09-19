# 24. Testing UI Page Specification

**Version:** 2.0.0  
**Status:** Planned  
**Updated:** 2026-03-09  
**Parent:** [GSearch CLI Overview](./00-overview.md)

---

## Purpose

Define the Testing UI page for interactive testing of gSearch CLI features. This specification covers the React/TypeScript frontend that allows rapid testing of search, extraction, authority fetching, and proxy/key pool management with preset data.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TESTING UI ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                           HEADER                                        │ │
│  │  [gSearch Testing]  [Environment: dev ▼]  [Preset: SEO Suite ▼]        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌──────────────┬──────────────────────────────────────────────────────────┐ │
│  │  TEST TABS   │                    TEST PANEL                             │ │
│  │              │                                                           │ │
│  │ □ Search     │  ┌───────────────────────────────────────────────────┐   │ │
│  │ □ Extract    │  │  INPUT SECTION                                     │   │ │
│  │ □ Authority  │  │  Query/URL: [________________________]             │   │ │
│  │ □ Nested     │  │  Options:  [x] Cache [ ] Force [ ] Authority       │   │ │
│  │ □ Proxy      │  │  Format:   [Markdown ▼]  Depth: [0 ▼]              │   │ │
│  │ □ Key Pools  │  │                        [Run Test] [Use Preset]     │   │ │
│  │ □ Pipeline   │  └───────────────────────────────────────────────────┘   │ │
│  │              │                                                           │ │
│  │              │  ┌───────────────────────────────────────────────────┐   │ │
│  │              │  │  RESULTS SECTION                                   │   │ │
│  │              │  │  ┌─────────────────────────────────────────────┐   │   │ │
│  │              │  │  │ Status: ✓ Success (234ms)                    │   │   │ │
│  │              │  │  │ Source: openpagerank (cached)                │   │   │ │
│  │              │  │  ├─────────────────────────────────────────────┤   │   │ │
│  │              │  │  │ Domain Authority: 67                         │   │   │ │
│  │              │  │  │ Backlinks: 12,450                           │   │   │ │
│  │              │  │  │ Referring Domains: 890                      │   │   │ │
│  │              │  │  └─────────────────────────────────────────────┘   │   │ │
│  │              │  └───────────────────────────────────────────────────┘   │ │
│  │              │                                                           │ │
│  │              │  ┌───────────────────────────────────────────────────┐   │ │
│  │              │  │  RAW OUTPUT (Collapsible)                          │   │ │
│  │              │  │  [JSON] [Headers] [Timing] [Cache Info]            │   │ │
│  │              │  └───────────────────────────────────────────────────┘   │ │
│  └──────────────┴──────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Structure

```
src/
├── pages/
│   └── Testing/
│       └── index.tsx                    # Main testing page
├── components/
│   └── testing/
│       ├── TestTabs.tsx                 # Test category tabs
│       ├── panels/
│       │   ├── SearchTestPanel.tsx      # Search testing
│       │   ├── ExtractTestPanel.tsx     # URL extraction testing
│       │   ├── AuthorityTestPanel.tsx   # Authority metrics testing
│       │   ├── NestedTestPanel.tsx      # Nested crawl testing
│       │   ├── ProxyTestPanel.tsx       # Proxy management/testing
│       │   ├── KeyPoolTestPanel.tsx     # API key pool testing
│       │   └── PipelineTestPanel.tsx    # Full pipeline testing
│       ├── PresetSelector.tsx           # Preset data selector
│       ├── ResultsViewer.tsx            # Results display
│       ├── RawOutputViewer.tsx          # JSON/Headers/Timing
│       ├── StatusBadge.tsx              # Success/Error/Cached badges
│       └── TimingBreakdown.tsx          # Request timing details
├── hooks/
│   ├── useTesting.ts                    # Testing API hook
│   ├── usePresets.ts                    # Preset data hook
│   └── useTestHistory.ts                # Test history hook
├── types/
│   └── testing.ts                       # TypeScript interfaces
└── api/
    └── testing.ts                       # Testing API client
```

---

## TypeScript Interfaces

### Core Types

```typescript
enum TestCategory {
  Search = "search",
  Extract = "extract",
  Authority = "authority",
  Nested = "nested",
  Proxy = "proxy",
  KeyPool = "keypool",
  Pipeline = "pipeline",
}

interface TestRequest {
  readonly category: TestCategory;
  readonly input: SearchInput | ExtractInput | AuthorityInput | NestedInput | ProxyInput | PipelineInput;
  readonly usePreset?: string;
}

interface SearchInput {
  readonly query: string;
  readonly engines?: readonly string[];
  readonly maxResults?: number;
  readonly nestedEnabled?: boolean;
  readonly nestedDepth?: number;
}

interface ExtractInput {
  readonly url: string;
  readonly formats?: readonly string[];
  readonly analyzeStyle?: boolean;
  readonly includeImages?: boolean;
  readonly force?: boolean;
  readonly cacheDays?: number;
}

interface AuthorityInput {
  readonly domain: string;
  readonly sources?: readonly string[]; // Override fallback chain
  readonly forceSource?: string; // Test specific source
}

interface NestedInput {
  readonly url: string;
  readonly depth: number;
  readonly maxPagesPerLevel?: number;
  readonly extractFormat?: string;
}

interface ProxyInput {
  readonly action: "test" | "health_check" | "list" | "toggle";
  readonly proxyUrl?: string;
  readonly poolName?: string;
}

interface PipelineInput {
  readonly query: string;
  readonly extractTop?: number;
  readonly analyzeAuthority?: boolean;
  readonly analyzeStyle?: boolean;
  readonly generateRagChunks?: boolean;
}

interface TestResult {
  readonly success: boolean;
  readonly duration: number; // ms
  readonly cached: boolean;
  readonly source?: string;
  readonly data: unknown;
  readonly error?: TestError;
  readonly timing?: TimingBreakdown;
  readonly headers?: Record<string, string>;
}

interface TimingBreakdown {
  readonly dns?: number;
  readonly connect?: number;
  readonly tls?: number;
  readonly firstByte?: number;
  readonly download?: number;
  readonly parse?: number;
  readonly total: number;
}

interface TestError {
  readonly code: number;
  readonly message: string;
  readonly details?: string;
}
```

### Preset Types

```typescript
interface TestPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: TestCategory;
  readonly input: TestRequest["input"];
  readonly expectedOutput?: unknown; // For validation
}

interface PresetCollection {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly presets: readonly TestPreset[];
}
```

---

## Test Panels

### 1. Search Test Panel

```typescript
interface SearchTestPanelProps {
  onRunTest: (input: SearchInput) => Promise<TestResult>;
  presets: readonly TestPreset[];
}

export function SearchTestPanel({ onRunTest, presets }: SearchTestPanelProps) {
  const [query, setQuery] = useState("");
  const [engines, setEngines] = useState<string[]>(["google", "duckduckgo", "bing"]);
  const [maxResults, setMaxResults] = useState(10);
  const [nestedEnabled, setNestedEnabled] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleRunTest = async () => {
    setLoading(true);
    try {
      const res = await onRunTest({ query, engines, maxResults, nestedEnabled });
      setResult(res);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Search Test</CardTitle>
          <CardDescription>Test search across configured engines</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Query</Label>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter search query..." />
          </div>
          
          <div>
            <Label>Engines</Label>
            <div className="flex gap-2 mt-1">
              {["google", "duckduckgo", "bing"].map((engine) => (
                <Checkbox
                  key={engine}
                  checked={engines.includes(engine)}
                  onCheckedChange={(checked) => {
                    setEngines(checked ? [...engines, engine] : engines.filter(e => e !== engine));
                  }}
                  label={engine}
                />
              ))}
            </div>
          </div>
          
          <div className="flex gap-4">
            <div>
              <Label>Max Results</Label>
              <Select value={String(maxResults)} onValueChange={(v) => setMaxResults(Number(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox checked={nestedEnabled} onCheckedChange={setNestedEnabled} />
              <Label>Enable Nested Search</Label>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleRunTest} disabled={loading || !query}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : <Play className="mr-2" />}
              Run Test
            </Button>
            <PresetDropdown presets={presets} onSelect={(p) => { setQuery(p.input.query); }} />
          </div>
        </CardContent>
      </Card>
      
      {result && <ResultsViewer result={result} />}
    </div>
  );
}
```

### 2. Authority Test Panel

```typescript
export function AuthorityTestPanel({ onRunTest, presets }: AuthorityTestPanelProps) {
  const [domain, setDomain] = useState("");
  const [forceSource, setForceSource] = useState<string>("");
  const [result, setResult] = useState<TestResult | null>(null);
  
  const sources = ["ahrefs", "openpagerank", "moz", "scrape", "commoncrawl"];
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Authority Metrics Test</CardTitle>
          <CardDescription>Test authority data fetching with fallback chain</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Domain</Label>
            <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" />
          </div>
          
          <div>
            <Label>Force Source (optional)</Label>
            <Select value={forceSource} onValueChange={setForceSource}>
              <SelectTrigger>
                <SelectValue placeholder="Auto (fallback chain)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Auto (fallback chain)</SelectItem>
                {sources.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to test full fallback chain
            </p>
          </div>
          
          <Button onClick={() => onRunTest({ domain, forceSource })}>
            <Play className="mr-2 h-4 w-4" />
            Fetch Authority
          </Button>
        </CardContent>
      </Card>
      
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <StatusBadge success={result.success} cached={result.cached} />
              <span className="text-sm text-muted-foreground">
                Source: {result.source} • {result.duration}ms
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <AuthorityMetricsDisplay data={result.data} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AuthorityMetricsDisplay({ data }: { data: AuthorityMetrics }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard label="Domain Authority" value={data.DomainAuthority} max={100} />
      <MetricCard label="Page Authority" value={data.PageAuthority} max={100} />
      <MetricCard label="Backlinks" value={formatNumber(data.BacklinkCount)} />
      <MetricCard label="Referring Domains" value={formatNumber(data.ReferringDomains)} />
      {data.OrganicTraffic && (
        <MetricCard label="Organic Traffic" value={formatNumber(data.OrganicTraffic)} subtitle="/month" />
      )}
      {data.TrafficValue && (
        <MetricCard label="Traffic Value" value={`$${formatNumber(data.TrafficValue)}`} subtitle="/month" />
      )}
    </div>
  );
}
```

### 3. Proxy Test Panel

```typescript
export function ProxyTestPanel({ onRunTest }: ProxyTestPanelProps) {
  const [pools, setPools] = useState<ProxyPool[]>([]);
  const [selectedPool, setSelectedPool] = useState("");
  const [testUrl, setTestUrl] = useState("https://httpbin.org/ip");
  
  const { data: poolStatus, refetch } = useQuery({
    queryKey: ["proxy-pools"],
    queryFn: () => testingApi.getProxyPools(),
  });
  
  const handleHealthCheck = async () => {
    await onRunTest({ action: "health_check", poolName: selectedPool });
    refetch();
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Proxy Management</CardTitle>
          <CardDescription>Test and manage proxy pools</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Test URL</Label>
            <Input value={testUrl} onChange={(e) => setTestUrl(e.target.value)} />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleHealthCheck}>
              <Activity className="mr-2 h-4 w-4" />
              Health Check All
            </Button>
            <Button variant="outline" onClick={() => onRunTest({ action: "test", proxyUrl: testUrl })}>
              <Zap className="mr-2 h-4 w-4" />
              Test Single
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Proxy Pool Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {poolStatus?.pools.map((pool) => (
          <Card key={pool.name}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant={pool.type === "socks5" ? "default" : "secondary"}>
                  {pool.type}
                </Badge>
                {pool.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active Proxies</span>
                  <span>{pool.activeCount}/{pool.totalCount}</span>
                </div>
                <Progress value={(pool.activeCount / pool.totalCount) * 100} />
                <div className="text-xs text-muted-foreground">
                  Target sites: {pool.targetSites.join(", ")}
                </div>
              </div>
              
              {/* Individual Proxy List */}
              <Accordion type="single" collapsible className="mt-4">
                <AccordionItem value="proxies">
                  <AccordionTrigger>Proxies ({pool.proxies.length})</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {pool.proxies.map((proxy, i) => (
                        <div key={i} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <StatusDot status={proxy.disabled ? "error" : "success"} />
                            <span className="text-sm font-mono truncate max-w-[200px]">
                              {maskProxyUrl(proxy.url)}
                            </span>
                            {proxy.region && <Badge variant="outline">{proxy.region}</Badge>}
                          </div>
                          <div className="flex gap-2">
                            <span className="text-xs text-muted-foreground">
                              Fails: {proxy.failureCount}
                            </span>
                            <Button size="sm" variant="ghost" onClick={() => toggleProxy(pool.name, i)}>
                              {proxy.disabled ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### 4. Key Pool Test Panel

```typescript
export function KeyPoolTestPanel({ onRunTest }: KeyPoolTestPanelProps) {
  const { data: poolStatus, refetch } = useQuery({
    queryKey: ["key-pools"],
    queryFn: () => testingApi.getKeyPoolStatus(),
  });
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>API Key Pools</CardTitle>
          <CardDescription>Monitor and manage API key quotas for free sources</CardDescription>
        </CardHeader>
      </Card>
      
      {/* Key Pool Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {poolStatus?.pools.map((pool) => (
          <Card key={pool.source}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SourceIcon source={pool.source} />
                {pool.source}
              </CardTitle>
              <CardDescription>
                {pool.activeKeys}/{pool.totalKeys} keys active
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Overall Quota */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Monthly Quota</span>
                    <span>{formatNumber(pool.usedQuota)}/{formatNumber(pool.totalQuota)}</span>
                  </div>
                  <Progress 
                    value={(pool.usedQuota / pool.totalQuota) * 100} 
                    className={pool.usedQuota > pool.totalQuota * 0.9 ? "bg-destructive" : ""}
                  />
                </div>
                
                {/* Individual Keys */}
                <div className="space-y-2">
                  {pool.keyStatuses.map((key, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded text-sm">
                      <div className="flex items-center gap-2">
                        <StatusDot status={key.disabled ? "error" : "success"} />
                        <span>{key.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {formatNumber(key.usedQuota)}/{formatNumber(key.totalQuota)}
                        </span>
                        <Progress 
                          value={(key.usedQuota / key.totalQuota) * 100} 
                          className="w-20 h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Add Key Button */}
                <Button variant="outline" size="sm" onClick={() => openAddKeyDialog(pool.source)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Key
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### 5. Full Pipeline Test Panel

```typescript
export function PipelineTestPanel({ onRunTest, presets }: PipelineTestPanelProps) {
  const [query, setQuery] = useState("");
  const [extractTop, setExtractTop] = useState(5);
  const [analyzeAuthority, setAnalyzeAuthority] = useState(true);
  const [analyzeStyle, setAnalyzeStyle] = useState(true);
  const [generateRagChunks, setGenerateRagChunks] = useState(true);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  
  const handleRunPipeline = async () => {
    // Connect to WebSocket for progress updates
    const ws = new WebSocket(`${WS_BASE}/testing/pipeline`);
    ws.onmessage = (e) => setProgress(JSON.parse(e.data));
    
    const res = await onRunTest({
      query,
      extractTop,
      analyzeAuthority,
      analyzeStyle,
      generateRagChunks,
    });
    
    ws.close();
    setResult(res);
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Full Pipeline Test</CardTitle>
          <CardDescription>
            Search → Extract → Authority → Style → RAG Chunks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Search Query</Label>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter search query..." />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Extract Top N Results</Label>
              <Slider value={[extractTop]} onValueChange={([v]) => setExtractTop(v)} min={1} max={20} step={1} />
              <span className="text-sm text-muted-foreground">{extractTop} results</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox checked={analyzeAuthority} onCheckedChange={setAnalyzeAuthority} />
              <Label>Authority Metrics</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={analyzeStyle} onCheckedChange={setAnalyzeStyle} />
              <Label>Style Analysis</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={generateRagChunks} onCheckedChange={setGenerateRagChunks} />
              <Label>Generate RAG Chunks</Label>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleRunPipeline} disabled={!query}>
              <Play className="mr-2 h-4 w-4" />
              Run Pipeline
            </Button>
            <PresetDropdown presets={presets} onSelect={(p) => setQuery(p.input.query)} />
          </div>
        </CardContent>
      </Card>
      
      {/* Progress Display */}
      {progress && (
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineProgressDisplay progress={progress} />
          </CardContent>
        </Card>
      )}
      
      {/* Results */}
      {result && <PipelineResultsDisplay result={result} />}
    </div>
  );
}
```

---

## Preset Data

### Preset Collection Structure

```typescript
const SEO_PRESET_COLLECTION: PresetCollection = {
  id: "seo-suite",
  name: "SEO Suite",
  description: "Presets for SEO content testing",
  presets: [
    {
      id: "search-carpet-cleaning",
      name: "Carpet Cleaning Keywords",
      category: TestCategory.Search,
      input: {
        query: "professional carpet cleaning services near me",
        engines: ["google", "duckduckgo"],
        maxResults: 20,
      },
    },
    {
      id: "extract-competitor",
      name: "Competitor Article Extract",
      category: TestCategory.Extract,
      input: {
        url: "https://example.com/blog/carpet-cleaning-guide",
        formats: ["markdown", "json"],
        analyzeStyle: true,
      },
    },
    {
      id: "authority-domain",
      name: "Authority Check - Example.com",
      category: TestCategory.Authority,
      input: {
        domain: "example.com",
      },
    },
    {
      id: "pipeline-seo-research",
      name: "Full SEO Research Pipeline",
      category: TestCategory.Pipeline,
      input: {
        query: "best carpet cleaning methods 2026",
        extractTop: 10,
        analyzeAuthority: true,
        analyzeStyle: true,
        generateRagChunks: true,
      },
    },
  ],
};
```

---

## API Endpoints

```typescript
// api/testing.ts

const API_BASE = "/api/testing";

export const testingApi = {
  // Run a test
  async runTest(request: TestRequest): Promise<TestResult> {
    const response = await fetch(`${API_BASE}/run`, {
      method: HttpMethod.Post,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    return response.json();
  },
  
  // Get proxy pool status
  async getProxyPools(): Promise<ProxyPoolsStatus> {
    const response = await fetch(`${API_BASE}/proxy/pools`);
    return response.json();
  },
  
  // Get key pool status
  async getKeyPoolStatus(): Promise<KeyPoolsStatus> {
    const response = await fetch(`${API_BASE}/keys/pools`);
    return response.json();
  },
  
  // Get available presets
  async getPresets(): Promise<PresetCollection[]> {
    const response = await fetch(`${API_BASE}/presets`);
    return response.json();
  },
  
  // Toggle proxy enabled/disabled
  async toggleProxy(poolName: string, proxyIndex: number): Promise<void> {
    await fetch(`${API_BASE}/proxy/toggle`, {
      method: HttpMethod.Post,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ poolName, proxyIndex }),
    });
  },
  
  // Add new API key
  async addApiKey(source: string, key: ApiKeyEntry): Promise<void> {
    await fetch(`${API_BASE}/keys/add`, {
      method: HttpMethod.Post,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, key }),
    });
  },
  
  // Get test history
  async getHistory(limit?: number): Promise<TestHistoryEntry[]> {
    const response = await fetch(`${API_BASE}/history?limit=${limit ?? 50}`);
    return response.json();
  },
};
```

---

## Related Specifications

| Spec | Description |
|------|-------------|
| 01-settings-ui-page.md | Settings configuration UI |
| 02-frontend-architecture.md | Frontend architecture |
| 29-gsearch-url-extraction.md | Extraction backend |
| 05-preset-data.md | Preset data specification |
