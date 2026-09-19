# WP SEO Publish CLI: Variable Editor

**Version:** 2.0.0  
**Updated:** 2026-03-09  

---

## Overview

The Variable Editor provides a UI for importing, managing, and using dynamic variables from CSV, JSON, and YAML files. Variables can be injected into AI prompts and SEO content generation.

---

## Page Layout

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  Variable Editor - example.com                                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │ [Upload File] [Create Variable]                         [Import] [Export]       ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                                                                      │
│  ┌───────────────────────────────┐  ┌──────────────────────────────────────────────┐│
│  │ Variable Sources              │  │ Variables Preview                            ││
│  │ ─────────────────────────────│  │ ──────────────────────────────────────────── ││
│  │ 📄 locations.csv         (42)│  │ Source: locations.csv                        ││
│  │ 📄 services.json         (15)│  │                                              ││
│  │ 📄 company-info.yaml      (8)│  │ ┌────────────┬─────────────┬───────────┐    ││
│  │                              │  │ │ City       │ State       │ Postcode  │    ││
│  │ Custom Variables             │  │ ├────────────┼─────────────┼───────────┤    ││
│  │ ─────────────────────────────│  │ │ Melbourne  │ VIC         │ 3000      │    ││
│  │ • CompanyName                │  │ │ Sydney     │ NSW         │ 2000      │    ││
│  │ • PhoneNumber                │  │ │ Brisbane   │ QLD         │ 4000      │    ││
│  │ • YearsExperience            │  │ └────────────┴─────────────┴───────────┘    ││
│  │                              │  │                                              ││
│  │ [+ Add Custom]               │  │ Template Syntax:                             ││
│  └───────────────────────────────┘  │ {{City}} → Melbourne                        ││
│                                     │ {{City|uppercase}} → MELBOURNE              ││
│                                     └──────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Variable Source Manager

```tsx
interface VariableSourceManagerProps {
  websiteId: string;
}

interface VariableSource {
  Id: string;
  Name: string;
  Type: "csv" | "json" | "yaml";
  FilePath: string;
  RowCount: number;
  Columns: string[];
  Scope: "website" | "content";
  ImportedAt: string;
}

const VariableSourceManager: React.FC<VariableSourceManagerProps> = ({ websiteId }) => {
  const [selectedSource, setSelectedSource] = useState<VariableSource | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const { data: sources, refetch } = useQuery({
    queryKey: ["variable-sources", websiteId],
    queryFn: () => fetchVariableSources(websiteId),
  });

  return (
    <div className="flex gap-6">
      {/* Sources List */}
      <div className="w-1/3 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Variable Sources</h3>
          <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
        </div>

        <div className="space-y-2">
          {sources?.map((source) => (
            <div
              key={source.Id}
              className={cn(
                "p-3 border rounded-lg cursor-pointer hover:bg-muted/50",
                selectedSource?.Id === source.Id && "border-primary bg-muted/50"
              )}
              onClick={() => setSelectedSource(source)}
            >
              <div className="flex items-center gap-2">
                <FileIcon type={source.Type} />
                <div className="flex-1">
                  <div className="font-medium">{source.Name}</div>
                  <div className="text-xs text-muted-foreground">
                    {source.RowCount} rows • {source.Columns.length} columns
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleRefresh(source.Id)}>
                      Refresh
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport(source.Id)}>
                      Export
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDelete(source.Id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Custom Variables */}
        <CustomVariablesSection websiteId={websiteId} />
      </div>

      {/* Preview Panel */}
      <div className="flex-1">
        {selectedSource ? (
          <VariablePreview source={selectedSource} websiteId={websiteId} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select a source to preview variables
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <UploadVariableDialog 
        open={uploadOpen} 
        onOpenChange={setUploadOpen}
        websiteId={websiteId}
        onComplete={() => {
          refetch();
          setUploadOpen(false);
        }}
      />
    </div>
  );
};
```

---

## File Upload Dialog

```tsx
interface UploadVariableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  websiteId: string;
  onComplete: () => void;
}

const UploadVariableDialog: React.FC<UploadVariableDialogProps> = ({
  open,
  onOpenChange,
  websiteId,
  onComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [config, setConfig] = useState({
    Name: "",
    Scope: "website" as "website" | "content",
    HasHeader: true,
    Delimiter: ",",
  });
  const [preview, setPreview] = useState<any[] | null>(null);
  const [uploading, setUploading] = useState(false);

  // Preview file on selection
  useEffect(() => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parsePreview(content, file.name, config);
      setPreview(parsed);
    };
    reader.readAsText(file);
  }, [file, config]);

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("config", JSON.stringify(config));

      await fetch(`/api/v1/sites/${websiteId}/variables/upload`, {
        method: HttpMethod.Post,
        body: formData,
      });

      toast.success("Variables imported");
      onComplete();
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Import Variables</DialogTitle>
          <DialogDescription>
            Upload a CSV, JSON, or YAML file containing variable data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Drop Zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center",
              "hover:border-primary/50 hover:bg-muted/50 transition-colors",
              file && "border-primary bg-muted/50"
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const droppedFile = e.dataTransfer.files[0];
              if (droppedFile) {
                setFile(droppedFile);
                setConfig({ ...config, Name: droppedFile.name.replace(/\.[^/.]+$/, "") });
              }
            }}
          >
            {file ? (
              <div className="space-y-2">
                <File className="h-12 w-12 mx-auto text-primary" />
                <div className="font-medium">{file.name}</div>
                <div className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Change File
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div className="font-medium">Drop file here or click to browse</div>
                <div className="text-sm text-muted-foreground">
                  Supports CSV, JSON, YAML
                </div>
                <input
                  type="file"
                  accept=".csv,.json,.yaml,.yml"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                      setFile(selectedFile);
                      setConfig({ ...config, Name: selectedFile.name.replace(/\.[^/.]+$/, "") });
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Configuration */}
          {file && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source Name</Label>
                <Input
                  value={config.Name}
                  onChange={(e) => setConfig({ ...config, Name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Scope</Label>
                <Select
                  value={config.Scope}
                  onValueChange={(v) => setConfig({ ...config, Scope: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website (all content)</SelectItem>
                    <SelectItem value="content">Content Type specific</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {file.name.endsWith(".csv") && (
                <>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasHeader"
                      checked={config.HasHeader}
                      onCheckedChange={(c) => setConfig({ ...config, HasHeader: !!c })}
                    />
                    <Label htmlFor="hasHeader">First row is header</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>Delimiter</Label>
                    <Select
                      value={config.Delimiter}
                      onValueChange={(v) => setConfig({ ...config, Delimiter: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=",">Comma (,)</SelectItem>
                        <SelectItem value=";">Semicolon (;)</SelectItem>
                        <SelectItem value="\t">Tab</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="space-y-2">
              <Label>Preview (first 5 rows)</Label>
              <div className="border rounded-lg overflow-auto max-h-48">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(preview[0] || {}).map((key) => (
                        <TableHead key={key}>{key}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.slice(0, 5).map((row, i) => (
                      <TableRow key={i}>
                        {Object.values(row).map((val, j) => (
                          <TableCell key={j}>{String(val)}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Import Variables
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

---

## Custom Variables Section

```tsx
interface CustomVariablesSectionProps {
  websiteId: string;
}

interface CustomVariable {
  Id: number;
  Key: string;
  Value: string;
  ValueType: "string" | "number" | "boolean" | "json";
}

const CustomVariablesSection: React.FC<CustomVariablesSectionProps> = ({ websiteId }) => {
  const [newVar, setNewVar] = useState({ Key: "", Value: "", ValueType: "string" as const });
  const [editing, setEditing] = useState<CustomVariable | null>(null);

  const { data: customVars, refetch } = useQuery({
    queryKey: ["custom-variables", websiteId],
    queryFn: () => fetchCustomVariables(websiteId),
  });

  const createMutation = useMutation({
    mutationFn: async (variable: typeof newVar) => {
      await fetch(`/api/v1/sites/${websiteId}/variables/custom`, {
        method: HttpMethod.Post,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variable),
      });
    },
    onSuccess: () => {
      refetch();
      setNewVar({ Key: "", Value: "", ValueType: "string" });
    },
  });

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm">Custom Variables</h3>

      <div className="space-y-2">
        {customVars?.map((v) => (
          <div 
            key={v.Id} 
            className="flex items-center gap-2 p-2 border rounded text-sm"
          >
            <code className="bg-muted px-1 rounded">{`{{${v.Key}}}`}</code>
            <span className="flex-1 truncate text-muted-foreground">{v.Value}</span>
            <Button variant="ghost" size="sm" onClick={() => setEditing(v)}>
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add New */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Key"
            value={newVar.Key}
            onChange={(e) => setNewVar({ ...newVar, Key: e.target.value })}
            className="flex-1"
          />
          <Input
            placeholder="Value"
            value={newVar.Value}
            onChange={(e) => setNewVar({ ...newVar, Value: e.target.value })}
            className="flex-1"
          />
        </div>
        <Button 
          size="sm" 
          onClick={() => createMutation.mutate(newVar)}
          disabled={!newVar.Key || createMutation.isPending}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Variable
        </Button>
      </div>
    </div>
  );
};
```

---

## Variable Preview Panel

```tsx
interface VariablePreviewProps {
  source: VariableSource;
  websiteId: string;
}

const VariablePreview: React.FC<VariablePreviewProps> = ({ source, websiteId }) => {
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const { data } = useQuery({
    queryKey: ["variable-rows", websiteId, source.Id, page],
    queryFn: () => fetchVariableRows(websiteId, source.Id, page, pageSize),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">{source.Name}</h3>
          <p className="text-sm text-muted-foreground">
            {source.RowCount} rows • Imported {new Date(source.ImportedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Data Table */}
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              {source.Columns.map((col) => (
                <TableHead key={col}>{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.Rows.map((row, i) => (
              <TableRow key={row.RowIndex}>
                <TableCell className="text-muted-foreground">
                  {row.RowIndex + 1}
                </TableCell>
                {source.Columns.map((col) => (
                  <TableCell key={col}>{row.Data[col]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, source.RowCount)} of {source.RowCount}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={(page + 1) * pageSize >= source.RowCount}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Template Syntax Help */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Template Syntax</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Use these variables in your prompts and content:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {source.Columns.map((col) => (
              <div key={col} className="flex items-center gap-2">
                <code className="bg-muted px-2 py-1 rounded text-xs">{`{{${col}}}`}</code>
                <span className="text-muted-foreground">→</span>
                <span className="text-xs">{data?.Rows[0]?.Data[col] || "..."}</span>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="space-y-1">
            <div className="font-medium">Format Modifiers:</div>
            <ul className="text-muted-foreground space-y-1">
              <li><code>{`{{City|uppercase}}`}</code> → MELBOURNE</li>
              <li><code>{`{{City|lowercase}}`}</code> → melbourne</li>
              <li><code>{`{{City|title}}`}</code> → Melbourne</li>
              <li><code>{`{{Price|currency}}`}</code> → $1,500.00</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

---

## Import/Export Functions

```typescript
// api/variables.ts

export async function exportVariables(
  websiteId: string, 
  sourceId?: string
): Promise<Blob> {
  const url = sourceId 
    ? `/api/v1/sites/${websiteId}/variables/export/${sourceId}`
    : `/api/v1/sites/${websiteId}/variables/export`;
    
  const resp = await fetch(url);
  return resp.blob();
}

export async function importVariables(
  websiteId: string,
  file: File,
  config: VariableImportConfig
): Promise<VariableSource> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("config", JSON.stringify(config));

  const resp = await fetch(`/api/v1/sites/${websiteId}/variables/upload`, {
    method: HttpMethod.Post,
    body: formData,
  });

  return resp.json();
}

interface VariableImportConfig {
  Name: string;
  Scope: "website" | "content";
  HasHeader?: boolean;
  Delimiter?: string;
  ColumnMap?: Record<string, string>;
}
```

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Backend Variable System | `../01-backend/05-variable-system.md` |
| AI Bridge Variable System | `../../27-ai-bridge-cli/01-backend/19-ai-seo-variable-system.md` |
| Content Manager | `02-content-manager.md` |
