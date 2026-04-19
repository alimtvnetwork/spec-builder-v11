# AI Bridge CLI: Testing UI Page Specification

**Version:** 2.0.0  
**Status:** Planned  
**Updated:** 2026-03-09  
**Parent:** [00-overview.md](./00-overview.md)

---

## Purpose

Define the Testing UI page for interactive testing of AI Bridge CLI features. This includes chat testing, RAG pipeline testing, SEO generation testing, and comprehensive preset data for rapid iteration.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AI BRIDGE TESTING UI                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  HEADER                                                                 │ │
│  │  [AI Bridge Testing]  [App: demo ▼]  [Preset: Blog Gen ▼]  [History]   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌──────────────┬──────────────────────────────────────────────────────────┐ │
│  │  TEST TABS   │                    TEST PANEL                             │ │
│  │              │                                                           │ │
│  │ □ Chat       │  ┌───────────────────────────────────────────────────┐   │ │
│  │ □ RAG        │  │  BLOG GENERATION TEST                              │   │ │
│  │ □ Blog Gen   │  │                                                    │   │ │
│  │ □ FAQ Gen    │  │  Company: [Acme Cleaning ▼]                        │   │ │
│  │ □ Paragraph  │  │  Topic:   [___________________________]            │   │ │
│  │ □ Style      │  │                                                    │   │ │
│  │ □ Pipeline   │  │  ┌─────────────────────────────────────────────┐   │   │ │
│  │              │  │  │ Training Data                                │   │   │ │
│  │              │  │  │ [x] Use Reference Articles (5 loaded)        │   │   │ │
│  │              │  │  │ [x] Use Style Analysis                       │   │   │ │
│  │              │  │  │ [ ] Custom System Prompt                     │   │   │ │
│  │              │  │  └─────────────────────────────────────────────┘   │   │ │
│  │              │  │                                                    │   │ │
│  │              │  │  [Generate Blog] [Use Preset] [Clear]              │   │ │
│  │              │  └───────────────────────────────────────────────────┘   │ │
│  │              │                                                           │ │
│  │              │  ┌───────────────────────────────────────────────────┐   │ │
│  │              │  │  GENERATED CONTENT                                 │   │ │
│  │              │  │  ┌────────────┬────────────┬────────────────────┐ │   │ │
│  │              │  │  │ Streaming  │ Preview    │ Metadata           │ │   │ │
│  │              │  │  └────────────┴────────────┴────────────────────┘ │   │ │
│  │              │  │                                                    │   │ │
│  │              │  │  # Best Practices for Carpet Cleaning in 2026     │   │ │
│  │              │  │                                                    │   │ │
│  │              │  │  Professional carpet cleaning requires...█        │   │ │
│  │              │  │                                                    │   │ │
│  │              │  └───────────────────────────────────────────────────┘   │ │
│  │              │                                                           │ │
│  │              │  ┌───────────────────────────────────────────────────┐   │ │
│  │              │  │  METRICS                                           │   │ │
│  │              │  │  Tokens: 1,234  |  Time: 12.3s  |  Model: llama3  │   │ │
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
│       │   ├── ChatTestPanel.tsx        # Chat completion testing
│       │   ├── RagTestPanel.tsx         # RAG retrieval testing
│       │   ├── BlogGenTestPanel.tsx     # Blog generation testing
│       │   ├── FaqGenTestPanel.tsx      # FAQ generation testing
│       │   ├── ParagraphGenTestPanel.tsx # Paragraph generation testing
│       │   ├── StyleAnalysisPanel.tsx   # Style analysis testing
│       │   └── SeoPipelinePanel.tsx     # Full SEO pipeline testing
│       ├── CompanySelector.tsx          # Company profile selector
│       ├── TrainingDataViewer.tsx       # View loaded training data
│       ├── StreamingViewer.tsx          # Real-time token streaming
│       ├── MarkdownPreview.tsx          # Rendered markdown preview
│       ├── GenerationMetrics.tsx        # Tokens/time/model metrics
│       ├── PresetSelector.tsx           # Preset data selector
│       └── TestHistory.tsx              # Recent test history
├── hooks/
│   ├── useSeOTesting.ts                 # SEO testing hook
│   ├── useChatTesting.ts                # Chat testing hook
│   ├── useRagTesting.ts                 # RAG testing hook
│   └── usePresets.ts                    # Preset data hook
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
  Chat = "chat",
  Rag = "rag",
  BlogGen = "blog_gen",
  FaqGen = "faq_gen",
  ParagraphGen = "paragraph_gen",
  StyleAnalysis = "style_analysis",
  SeoPipeline = "seo_pipeline",
}

interface ChatTestInput {
  readonly category: string; // Model category
  readonly messages: readonly ChatMessage[];
  readonly systemPrompt?: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly stream?: boolean;
}

interface RagTestInput {
  readonly query: string;
  readonly documentIds?: readonly string[];
  readonly topK?: number;
  readonly minScore?: number;
}

interface BlogGenTestInput {
  readonly companySlug: string;
  readonly topic: string;
  readonly keywords?: readonly string[];
  readonly wordCount?: number;
  readonly useTrainingData?: boolean;
  readonly useStyleAnalysis?: boolean;
  readonly customSystemPrompt?: string;
  readonly stream?: boolean;
}

interface FaqGenTestInput {
  readonly companySlug: string;
  readonly topic: string;
  readonly questionCount?: number;
  readonly style?: "concise" | "detailed";
}

interface ParagraphGenTestInput {
  readonly companySlug: string;
  readonly context: string;
  readonly tone?: "professional" | "conversational" | "technical";
  readonly wordCount?: number;
}

interface StyleAnalysisInput {
  readonly url?: string;
  readonly text?: string;
  readonly compareToCompany?: string;
}

interface SeoPipelineInput {
  readonly companySlug: string;
  readonly searchQuery: string;
  readonly extractTop?: number;
  readonly generateBlog?: boolean;
  readonly generateFaq?: boolean;
  readonly analyzeCompetitors?: boolean;
}

interface TestResult<T> {
  readonly success: boolean;
  readonly duration: number;
  readonly data: T;
  readonly metrics?: GenerationMetrics;
  readonly error?: TestError;
}

interface GenerationMetrics {
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly totalTokens: number;
  readonly tokensPerSecond: number;
  readonly model: string;
  readonly category: string;
}
```

---

## Test Panels

### 1. Chat Test Panel

```typescript
export function ChatTestPanel() {
  const [category, setCategory] = useState("general");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(true);
  const [response, setResponse] = useState("");
  const [metrics, setMetrics] = useState<GenerationMetrics | null>(null);
  
  const { categories } = useCategories();
  
  const handleSend = async () => {
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    
    if (streaming) {
      const ws = new WebSocket(`${WS_BASE}/testing/chat/stream`);
      ws.onopen = () => {
        ws.send(JSON.stringify({ category, messages: newMessages }));
      };
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === "token") {
          setResponse((prev) => prev + data.token);
        } else if (data.type === "done") {
          setMetrics(data.metrics);
          setMessages([...newMessages, { role: "assistant", content: response }]);
          ws.close();
        }
      };
    } else {
      const result = await testingApi.runChatTest({ category, messages: newMessages });
      setResponse(result.data.content);
      setMetrics(result.metrics);
    }
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Chat Completion Test</CardTitle>
          <div className="flex gap-4">
            <div>
              <Label>Model Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.key} value={c.key}>
                      {c.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={streaming} onCheckedChange={setStreaming} />
              <Label>Stream Response</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Message History */}
          <div className="border rounded-lg p-4 h-64 overflow-y-auto mb-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
            {response && (
              <div className="p-2 bg-muted rounded">
                <StreamingText text={response} />
              </div>
            )}
          </div>
          
          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {metrics && <GenerationMetricsCard metrics={metrics} />}
    </div>
  );
}
```

### 2. Blog Generation Test Panel

```typescript
export function BlogGenTestPanel({ presets }: { presets: TestPreset[] }) {
  const [companySlug, setCompanySlug] = useState("");
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState(1500);
  const [useTrainingData, setUseTrainingData] = useState(true);
  const [useStyleAnalysis, setUseStyleAnalysis] = useState(true);
  const [streaming, setStreaming] = useState(true);
  
  const [generatedContent, setGeneratedContent] = useState("");
  const [metadata, setMetadata] = useState<BlogMetadata | null>(null);
  const [metrics, setMetrics] = useState<GenerationMetrics | null>(null);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  
  const { companies } = useCompanies();
  const { trainingData } = useCompanyTrainingData(companySlug);
  
  const handleGenerate = async () => {
    setGeneratedContent("");
    setProgress({ stage: "initializing", percent: 0 });
    
    const ws = new WebSocket(`${WS_BASE}/testing/blog/stream`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        companySlug,
        topic,
        keywords,
        wordCount,
        useTrainingData,
        useStyleAnalysis,
      }));
    };
    
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      switch (data.type) {
        case "progress":
          setProgress(data.progress);
          break;
        case "token":
          setGeneratedContent((prev) => prev + data.token);
          break;
        case "metadata":
          setMetadata(data.metadata);
          break;
        case "done":
          setMetrics(data.metrics);
          setProgress(null);
          ws.close();
          break;
      }
    };
  };
  
  return (
    <div className="space-y-4">
      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle>Blog Generation Test</CardTitle>
          <CardDescription>
            Generate SEO-optimized blog content using company training data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Company</Label>
              <CompanySelector value={companySlug} onChange={setCompanySlug} companies={companies} />
            </div>
            <div>
              <Label>Target Word Count</Label>
              <Slider
                value={[wordCount]}
                onValueChange={([v]) => setWordCount(v)}
                min={500}
                max={5000}
                step={100}
              />
              <span className="text-sm text-muted-foreground">{wordCount} words</span>
            </div>
          </div>
          
          <div>
            <Label>Topic</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Best Practices for Carpet Cleaning in 2026"
            />
          </div>
          
          <div>
            <Label>Target Keywords</Label>
            <KeywordInput keywords={keywords} onChange={setKeywords} />
          </div>
          
          {/* Training Data Panel */}
          <Card className="bg-muted/50">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Training Data</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox checked={useTrainingData} onCheckedChange={setUseTrainingData} />
                  <Label>Use Reference Articles</Label>
                  {trainingData?.articles && (
                    <Badge variant="secondary">{trainingData.articles.length} loaded</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={useStyleAnalysis} onCheckedChange={setUseStyleAnalysis} />
                  <Label>Use Style Analysis</Label>
                  {trainingData?.styleProfile && (
                    <Badge variant="secondary">Profile loaded</Badge>
                  )}
                </div>
              </div>
              
              {trainingData && (
                <Accordion type="single" collapsible className="mt-2">
                  <AccordionItem value="articles">
                    <AccordionTrigger className="text-sm">
                      View Training Articles
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {trainingData.articles?.map((article, i) => (
                          <div key={i} className="p-2 bg-background rounded text-sm">
                            <div className="font-medium">{article.title}</div>
                            <div className="text-muted-foreground text-xs">
                              {article.wordCount} words • DA: {article.domainAuthority}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </CardContent>
          </Card>
          
          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={!companySlug || !topic}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Blog
            </Button>
            <PresetDropdown
              presets={presets.filter(p => p.category === TestCategory.BlogGen)}
              onSelect={(p) => {
                const input = p.input as BlogGenTestInput;
                setCompanySlug(input.companySlug);
                setTopic(input.topic);
                if (input.keywords) setKeywords([...input.keywords]);
                if (input.wordCount) setWordCount(input.wordCount);
              }}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Progress Indicator */}
      {progress && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Loader2 className="h-5 w-5 animate-spin" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>{progress.stage}</span>
                  <span>{progress.percent}%</span>
                </div>
                <Progress value={progress.percent} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Generated Content */}
      {generatedContent && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Content</CardTitle>
            <Tabs defaultValue="streaming">
              <TabsList>
                <TabsTrigger value="streaming">Streaming</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <TabsContent value="streaming">
              <div className="prose prose-sm max-w-none">
                <StreamingText text={generatedContent} />
              </div>
            </TabsContent>
            <TabsContent value="preview">
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{generatedContent}</ReactMarkdown>
              </div>
            </TabsContent>
            <TabsContent value="metadata">
              {metadata && <BlogMetadataDisplay metadata={metadata} />}
            </TabsContent>
          </CardContent>
        </Card>
      )}
      
      {/* Metrics */}
      {metrics && <GenerationMetricsCard metrics={metrics} />}
    </div>
  );
}
```

### 3. RAG Test Panel

```typescript
export function RagTestPanel() {
  const [query, setQuery] = useState("");
  const [topK, setTopK] = useState(5);
  const [minScore, setMinScore] = useState(0.7);
  const [results, setResults] = useState<RagResult[] | null>(null);
  
  const handleSearch = async () => {
    const result = await testingApi.runRagTest({ query, topK, minScore });
    setResults(result.data.chunks);
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>RAG Retrieval Test</CardTitle>
          <CardDescription>
            Search across indexed documents and view retrieved chunks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Search Query</Label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter semantic search query..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Top K Results</Label>
              <Select value={String(topK)} onValueChange={(v) => setTopK(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 5, 10, 20].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Min Score: {minScore}</Label>
              <Slider
                value={[minScore]}
                onValueChange={([v]) => setMinScore(v)}
                min={0}
                max={1}
                step={0.05}
              />
            </div>
          </div>
          
          <Button onClick={handleSearch} disabled={!query}>
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </CardContent>
      </Card>
      
      {/* Results */}
      {results && (
        <div className="space-y-2">
          {results.map((chunk, i) => (
            <Card key={i}>
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">#{i + 1}</Badge>
                    <span className="text-sm font-medium">{chunk.documentTitle}</span>
                  </div>
                  <Badge variant={chunk.score > 0.9 ? "default" : "secondary"}>
                    Score: {chunk.score.toFixed(3)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="py-3">
                <p className="text-sm">{chunk.content}</p>
                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                  <span>Tokens: {chunk.tokenCount}</span>
                  <span>•</span>
                  <span>Section: {chunk.sectionPath}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 4. Full SEO Pipeline Panel

```typescript
export function SeoPipelinePanel({ presets }: { presets: TestPreset[] }) {
  const [companySlug, setCompanySlug] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [extractTop, setExtractTop] = useState(10);
  const [generateBlog, setGenerateBlog] = useState(true);
  const [generateFaq, setGenerateFaq] = useState(true);
  const [analyzeCompetitors, setAnalyzeCompetitors] = useState(true);
  
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [results, setResults] = useState<SeoPipelineResult | null>(null);
  
  const handleRunPipeline = async () => {
    const ws = new WebSocket(`${WS_BASE}/testing/seo-pipeline`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({
        companySlug,
        searchQuery,
        extractTop,
        generateBlog,
        generateFaq,
        analyzeCompetitors,
      }));
    };
    
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "progress") {
        setProgress(data);
      } else if (data.type === "done") {
        setResults(data.result);
        setProgress(null);
        ws.close();
      }
    };
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Full SEO Pipeline</CardTitle>
          <CardDescription>
            Search → Extract → Analyze → Generate (Blog + FAQ)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Company</Label>
              <CompanySelector value={companySlug} onChange={setCompanySlug} />
            </div>
            <div>
              <Label>Extract Top N</Label>
              <Slider
                value={[extractTop]}
                onValueChange={([v]) => setExtractTop(v)}
                min={5}
                max={30}
                step={5}
              />
              <span className="text-sm text-muted-foreground">{extractTop} results</span>
            </div>
          </div>
          
          <div>
            <Label>Search Query</Label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., professional carpet cleaning services"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Checkbox checked={generateBlog} onCheckedChange={setGenerateBlog} />
              <Label>Generate Blog Post</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={generateFaq} onCheckedChange={setGenerateFaq} />
              <Label>Generate FAQ</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={analyzeCompetitors} onCheckedChange={setAnalyzeCompetitors} />
              <Label>Analyze Competitor Authority</Label>
            </div>
          </div>
          
          <Button onClick={handleRunPipeline} disabled={!companySlug || !searchQuery}>
            <Workflow className="mr-2 h-4 w-4" />
            Run Pipeline
          </Button>
        </CardContent>
      </Card>
      
      {/* Pipeline Progress */}
      {progress && <PipelineProgressCard progress={progress} />}
      
      {/* Pipeline Results */}
      {results && (
        <Tabs defaultValue="search">
          <TabsList>
            <TabsTrigger value="search">
              Search ({results.searchResults.length})
            </TabsTrigger>
            <TabsTrigger value="extracted">
              Extracted ({results.extractedPages.length})
            </TabsTrigger>
            <TabsTrigger value="authority">
              Authority
            </TabsTrigger>
            {results.generatedBlog && (
              <TabsTrigger value="blog">Blog</TabsTrigger>
            )}
            {results.generatedFaq && (
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="search">
            <SearchResultsTable results={results.searchResults} />
          </TabsContent>
          <TabsContent value="extracted">
            <ExtractedPagesGrid pages={results.extractedPages} />
          </TabsContent>
          <TabsContent value="authority">
            <AuthorityComparisonChart data={results.authorityData} />
          </TabsContent>
          <TabsContent value="blog">
            <BlogPreview content={results.generatedBlog} />
          </TabsContent>
          <TabsContent value="faq">
            <FaqPreview faqs={results.generatedFaq} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
```

---

## Preset Data

### Preset Collection Structure

```typescript
const AI_BRIDGE_PRESET_COLLECTION: PresetCollection = {
  id: "ai-bridge-testing",
  name: "AI Bridge Testing",
  description: "Comprehensive testing presets for AI Bridge CLI",
  presets: [
    // Chat Presets
    {
      id: "chat-general",
      name: "General Chat",
      category: TestCategory.Chat,
      input: {
        category: "general",
        messages: [
          { role: "user", content: "Explain the benefits of professional carpet cleaning in 3 bullet points." }
        ],
      },
    },
    {
      id: "chat-code",
      name: "Code Generation",
      category: TestCategory.Chat,
      input: {
        category: "coding",
        messages: [
          { role: "user", content: "Write a Go function to calculate Flesch-Kincaid readability score." }
        ],
      },
    },
    
    // Blog Generation Presets
    {
      id: "blog-carpet-cleaning",
      name: "Carpet Cleaning Blog",
      category: TestCategory.BlogGen,
      input: {
        companySlug: "demo-cleaning",
        topic: "Ultimate Guide to Carpet Stain Removal",
        keywords: ["carpet stain removal", "DIY carpet cleaning", "professional cleaning"],
        wordCount: 1500,
        useTrainingData: true,
        useStyleAnalysis: true,
      },
    },
    {
      id: "blog-hvac-guide",
      name: "HVAC Maintenance Blog",
      category: TestCategory.BlogGen,
      input: {
        companySlug: "demo-hvac",
        topic: "Seasonal HVAC Maintenance Checklist",
        keywords: ["HVAC maintenance", "AC tune-up", "furnace inspection"],
        wordCount: 2000,
      },
    },
    
    // FAQ Presets
    {
      id: "faq-pricing",
      name: "Service Pricing FAQ",
      category: TestCategory.FaqGen,
      input: {
        companySlug: "demo-cleaning",
        topic: "Carpet Cleaning Service Pricing",
        questionCount: 10,
        style: "detailed",
      },
    },
    
    // Full Pipeline Presets
    {
      id: "pipeline-local-seo",
      name: "Local SEO Pipeline",
      category: TestCategory.SeoPipeline,
      input: {
        companySlug: "demo-cleaning",
        searchQuery: "carpet cleaning services [city name]",
        extractTop: 15,
        generateBlog: true,
        generateFaq: true,
        analyzeCompetitors: true,
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
  // Chat testing
  async runChatTest(input: ChatTestInput): Promise<TestResult<ChatResponse>> {
    return fetch(`${API_BASE}/chat`, {
      method: HttpMethod.Post,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then((r) => r.json());
  },
  
  // RAG testing
  async runRagTest(input: RagTestInput): Promise<TestResult<RagResponse>> {
    return fetch(`${API_BASE}/rag`, {
      method: HttpMethod.Post,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then((r) => r.json());
  },
  
  // Blog generation testing
  async runBlogGenTest(input: BlogGenTestInput): Promise<TestResult<BlogResponse>> {
    return fetch(`${API_BASE}/blog`, {
      method: HttpMethod.Post,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then((r) => r.json());
  },
  
  // Get company training data
  async getCompanyTrainingData(companySlug: string): Promise<CompanyTrainingData> {
    return fetch(`${API_BASE}/companies/${companySlug}/training`).then((r) => r.json());
  },
  
  // Get presets
  async getPresets(): Promise<PresetCollection[]> {
    return fetch(`${API_BASE}/presets`).then((r) => r.json());
  },
  
  // Get test history
  async getHistory(limit?: number): Promise<TestHistoryEntry[]> {
    return fetch(`${API_BASE}/history?limit=${limit ?? 50}`).then((r) => r.json());
  },
};
```

---

## Related Specifications

| Spec | Description |
|------|-------------|
| 01-architecture.md | Frontend architecture |
| 02-implementation-checklist.md | Implementation checklist |
| 29-gsearch-url-extraction.md | URL extraction backend |
| 04-preset-data.md | Preset data specification |
