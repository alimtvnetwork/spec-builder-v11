# WP SEO Publish CLI: Content Manager

**Version:** 2.0.0  
**Updated:** 2026-03-09  

---

## Overview

The Content Manager provides interfaces for creating, publishing, and managing WordPress content (categories, posts, pages, tags) with AI-powered SEO content generation.

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Content Manager - example.com                                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ [Categories] [Posts] [Pages] [Tags] [Press Releases]                            ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌──────────────────────────────────┐  ┌────────────────────────────────────────┐  │
│  │ Content List                     │  │ Editor / Preview                       │  │
│  │ ─────────────────────────────────│  │ ────────────────────────────────────── │  │
│  │ ☐ Melbourne Cleaning Guide    ▶ │  │ Title: [                           ]  │  │
│  │ ☐ Sydney Office Services      ▶ │  │                                        │  │
│  │ ☐ Brisbane Home Tips          ▶ │  │ Keywords: [tag] [tag] [tag] [+]       │  │
│  │                                  │  │                                        │  │
│  │ [+ New Post]                     │  │ ┌──────────────────────────────────┐  │  │
│  │                                  │  │ │ AI Generated Content Preview     │  │  │
│  │                                  │  │ │                                  │  │  │
│  │                                  │  │ │                                  │  │  │
│  │                                  │  │ └──────────────────────────────────┘  │  │
│  │                                  │  │                                        │  │
│  │                                  │  │ Categories: [Select...]               │  │
│  │                                  │  │ Tags: [AI Suggested] [Custom...]      │  │
│  │                                  │  │                                        │  │
│  │                                  │  │ [Generate Content] [Publish]          │  │
│  └──────────────────────────────────┘  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Content Type Tabs

```tsx
interface ContentManagerProps {
  websiteId: string;
}

type ContentTab = "categories" | "posts" | "pages" | "tags" | "press";

const ContentManager: React.FC<ContentManagerProps> = ({ websiteId }) => {
  const [activeTab, setActiveTab] = useState<ContentTab>("posts");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ContentTab)}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="press">Press Releases</TabsTrigger>
        </TabsList>

        <div className="flex-1 flex mt-4 gap-4">
          {/* Content List Panel */}
          <div className="w-1/3 border rounded-lg">
            <TabsContent value="categories" className="m-0">
              <CategoryList 
                websiteId={websiteId}
                onSelect={setSelectedItem}
              />
            </TabsContent>
            <TabsContent value="posts" className="m-0">
              <PostList 
                websiteId={websiteId}
                onSelect={setSelectedItem}
              />
            </TabsContent>
            {/* Similar for pages, tags, press */}
          </div>

          {/* Editor Panel */}
          <div className="flex-1 border rounded-lg p-4">
            <ContentEditor
              websiteId={websiteId}
              contentType={activeTab}
              contentId={selectedItem}
            />
          </div>
        </div>
      </Tabs>
    </div>
  );
};
```

---

## Post Editor with AI Generation

```tsx
interface PostEditorProps {
  websiteId: string;
  postId?: string; // undefined for new post
}

interface PostFormData {
  Title: string;
  Keywords: string[];
  Areas: string[];
  Categories: number[];
  Tags: number[];
  OutputFormat: "html" | "markdown";
  Prompt: string;
  Variables: Record<string, any>;
}

const PostEditor: React.FC<PostEditorProps> = ({ websiteId, postId }) => {
  const [formData, setFormData] = useState<PostFormData>({
    Title: "",
    Keywords: [],
    Areas: [],
    Categories: [],
    Tags: [],
    OutputFormat: "html",
    Prompt: "",
    Variables: {},
  });
  
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [suggestedCategories, setSuggestedCategories] = useState<CategorySuggestion[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<TagSuggestion[]>([]);

  // Fetch existing categories/tags
  const { data: categories } = useQuery({
    queryKey: ["categories", websiteId],
    queryFn: () => fetchCategories(websiteId),
  });

  const { data: tags } = useQuery({
    queryKey: ["tags", websiteId],
    queryFn: () => fetchTags(websiteId),
  });

  // Generate content via AI Bridge
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const resp = await fetch(`/api/v1/sites/${websiteId}/content/generate`, {
        method: HttpMethod.Post,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ContentType: "blog_post",
          Title: formData.Title,
          Keywords: formData.Keywords,
          Areas: formData.Areas,
          OutputFormat: formData.OutputFormat,
          Prompt: formData.Prompt,
          Variables: formData.Variables,
        }),
      });

      const data = await resp.json();
      setGeneratedContent(data.Content);
      setSuggestedCategories(data.SuggestedCategories || []);
      setSuggestedTags(data.SuggestedTags || []);
    } catch (err) {
      toast.error("Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  // Publish to WordPress
  const handlePublish = async () => {
    if (!generatedContent) return;
    
    setPublishing(true);
    try {
      const resp = await fetch(`/api/v1/sites/${websiteId}/posts`, {
        method: HttpMethod.Post,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Title: formData.Title,
          Content: generatedContent,
          Categories: formData.Categories,
          Tags: formData.Tags,
          Status: "publish",
        }),
      });

      const data = await resp.json();
      toast.success(`Published: ${data.Url}`);
    } catch (err) {
      toast.error("Publishing failed");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={formData.Title}
          onChange={(e) => setFormData({ ...formData, Title: e.target.value })}
          placeholder="Enter post title..."
        />
      </div>

      {/* Keywords */}
      <div className="space-y-2">
        <Label>Keywords</Label>
        <TagInput
          tags={formData.Keywords}
          onChange={(tags) => setFormData({ ...formData, Keywords: tags })}
          placeholder="Add keyword..."
        />
        <p className="text-xs text-muted-foreground">
          Keywords will be mentioned 8+ times per guideline
        </p>
      </div>

      {/* Service Areas */}
      <div className="space-y-2">
        <Label>Service Areas</Label>
        <TagInput
          tags={formData.Areas}
          onChange={(areas) => setFormData({ ...formData, Areas: areas })}
          placeholder="Add area..."
        />
        <p className="text-xs text-muted-foreground">
          Each area will be mentioned 3-4 times per paragraph
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        <Label>Categories</Label>
        <MultiSelect
          options={categories?.map(c => ({ value: c.Id, label: c.Name })) || []}
          selected={formData.Categories}
          onChange={(cats) => setFormData({ ...formData, Categories: cats })}
          placeholder="Select categories..."
        />
        {suggestedCategories.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-2">
            <span className="text-xs text-muted-foreground">AI Suggested:</span>
            {suggestedCategories.map((cat) => (
              <Badge 
                key={cat.Name}
                variant="secondary"
                className="cursor-pointer"
                onClick={() => {
                  // Add suggested category
                }}
              >
                {cat.Name} ({(cat.Confidence * 100).toFixed(0)}%)
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <MultiSelect
          options={tags?.map(t => ({ value: t.Id, label: t.Name })) || []}
          selected={formData.Tags}
          onChange={(ts) => setFormData({ ...formData, Tags: ts })}
          placeholder="Select tags..."
        />
        {suggestedTags.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-2">
            <span className="text-xs text-muted-foreground">AI Suggested:</span>
            {suggestedTags.map((tag) => (
              <Badge 
                key={tag.Name}
                variant="outline"
                className="cursor-pointer"
              >
                {tag.Name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Custom Prompt */}
      <div className="space-y-2">
        <Label>Additional Instructions</Label>
        <Textarea
          value={formData.Prompt}
          onChange={(e) => setFormData({ ...formData, Prompt: e.target.value })}
          placeholder="Any specific instructions for content generation..."
          rows={3}
        />
      </div>

      {/* Output Format */}
      <div className="space-y-2">
        <Label>Output Format</Label>
        <RadioGroup
          value={formData.OutputFormat}
          onValueChange={(v) => setFormData({ ...formData, OutputFormat: v as any })}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="html" id="html" />
            <Label htmlFor="html">HTML</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="markdown" id="markdown" />
            <Label htmlFor="markdown">Markdown</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Generated Content Preview */}
      {generatedContent && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Generated Content</Label>
            <Button variant="ghost" size="sm" onClick={() => setGeneratedContent(null)}>
              Clear
            </Button>
          </div>
          <div className="border rounded-lg p-4 max-h-96 overflow-auto bg-muted/50">
            {formData.OutputFormat === "html" ? (
              <div dangerouslySetInnerHTML={{ __html: generatedContent }} />
            ) : (
              <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button 
          variant="outline"
          onClick={handleGenerate}
          disabled={generating || !formData.Title}
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Content
            </>
          )}
        </Button>
        
        <Button
          onClick={handlePublish}
          disabled={publishing || !generatedContent}
        >
          {publishing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Publish to WordPress
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
```

---

## Category Manager

```tsx
interface CategoryManagerProps {
  websiteId: string;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ websiteId }) => {
  const [newCategory, setNewCategory] = useState({
    Name: "",
    Parent: 0,
    Description: "",
  });

  const { data: categories, refetch } = useQuery({
    queryKey: ["categories", websiteId],
    queryFn: () => fetchCategories(websiteId),
  });

  const createMutation = useMutation({
    mutationFn: async (cat: typeof newCategory) => {
      const resp = await fetch(`/api/v1/sites/${websiteId}/categories`, {
        method: HttpMethod.Post,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cat),
      });
      return resp.json();
    },
    onSuccess: () => {
      refetch();
      setNewCategory({ Name: "", Parent: 0, Description: "" });
      toast.success("Category created");
    },
  });

  // Build category tree
  const categoryTree = useMemo(() => {
    if (!categories) return [];
    return buildTree(categories);
  }, [categories]);

  return (
    <div className="space-y-6">
      {/* Category Tree */}
      <div className="border rounded-lg">
        <div className="p-4 border-b bg-muted/50">
          <h3 className="font-semibold">WordPress Categories</h3>
        </div>
        <div className="p-4">
          <CategoryTree 
            categories={categoryTree}
            onSelect={(cat) => {/* handle selection */}}
          />
        </div>
      </div>

      {/* Create New Category */}
      <Card>
        <CardHeader>
          <CardTitle>Create Category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={newCategory.Name}
              onChange={(e) => setNewCategory({ ...newCategory, Name: e.target.value })}
              placeholder="Category name..."
            />
          </div>
          
          <div className="space-y-2">
            <Label>Parent Category</Label>
            <Select
              value={String(newCategory.Parent)}
              onValueChange={(v) => setNewCategory({ ...newCategory, Parent: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue placeholder="None (top-level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None (top-level)</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.Id} value={String(cat.Id)}>
                    {cat.Name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              value={newCategory.Description}
              onChange={(e) => setNewCategory({ ...newCategory, Description: e.target.value })}
              placeholder="Category description..."
              rows={2}
            />
          </div>

          <Button 
            onClick={() => createMutation.mutate(newCategory)}
            disabled={!newCategory.Name || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Create Category
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## Rewrite Existing Content

```tsx
interface RewriteModalProps {
  websiteId: string;
  postId: number;
  originalContent: string;
  onComplete: () => void;
}

const RewriteModal: React.FC<RewriteModalProps> = ({ 
  websiteId, 
  postId, 
  originalContent, 
  onComplete 
}) => {
  const [prompt, setPrompt] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const [rewrittenContent, setRewrittenContent] = useState<string | null>(null);

  const handleRewrite = async () => {
    setRewriting(true);
    try {
      const resp = await fetch(`/api/v1/sites/${websiteId}/posts/${postId}/rewrite`, {
        method: HttpMethod.Post,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          OriginalContent: originalContent,
          Prompt: prompt,
          PreserveLinks: true,
        }),
      });

      const data = await resp.json();
      setRewrittenContent(data.Content);
    } catch (err) {
      toast.error("Rewrite failed");
    } finally {
      setRewriting(false);
    }
  };

  const handleUpdate = async () => {
    if (!rewrittenContent) return;
    
    try {
      await fetch(`/api/v1/sites/${websiteId}/posts/${postId}`, {
        method: HttpMethod.Put,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Content: rewrittenContent,
        }),
      });
      
      toast.success("Post updated");
      onComplete();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  return (
    <Dialog>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Rewrite Content with AI</DialogTitle>
          <DialogDescription>
            Provide instructions for how you want the content rewritten
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          {/* Original */}
          <div className="space-y-2">
            <Label>Original Content</Label>
            <div className="border rounded-lg p-4 max-h-60 overflow-auto bg-muted/50">
              <div dangerouslySetInnerHTML={{ __html: originalContent }} />
            </div>
          </div>

          {/* Rewritten */}
          <div className="space-y-2">
            <Label>Rewritten Content</Label>
            <div className="border rounded-lg p-4 max-h-60 overflow-auto">
              {rewrittenContent ? (
                <div dangerouslySetInnerHTML={{ __html: rewrittenContent }} />
              ) : (
                <div className="text-muted-foreground text-center py-8">
                  Enter a prompt and click Rewrite
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Rewrite Instructions</Label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Make it more concise, update the statistics, add more local references..."
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleRewrite} disabled={rewriting || !prompt}>
            {rewriting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Rewrite
          </Button>
          <Button onClick={handleUpdate} disabled={!rewrittenContent}>
            Update Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Connection Wizard | `01-connection-wizard.md` |
| Variable Editor | `03-variable-editor.md` |
| Backend Content Publisher | `../01-backend/03-content-publisher.md` |
| AI SEO Core Guidelines | `../../27-ai-bridge-cli/01-backend/17-ai-seo-core-guidelines.md` |
