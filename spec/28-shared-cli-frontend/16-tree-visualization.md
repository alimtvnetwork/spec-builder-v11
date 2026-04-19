# Shared CLI Frontend: Tree Index Visualization

**Version:** 1.0.0  
**Status:** Draft  
**Last Updated:** 2026-03-22  
**Parent:** [00-overview.md](./00-overview.md)  
**Data Source:** [spec/23-ai-bridge-non-vector-rag/02-tree-index-schema.md](../23-ai-bridge-non-vector-rag/02-tree-index-schema.md)

---

## 1. Overview

Interactive React component for exploring the tree-structured index produced by the Non-Vector RAG system (spec/32). Renders `TreeNode` records from the SQLite database as a navigable, searchable tree with metadata inspection, enabling developers to audit, debug, and understand how code/documents are indexed.

---

## 2. Component Architecture

```
tree-visualization/
├── TreeExplorer.tsx            # Root container — layout, data fetching, state
├── TreeToolbar.tsx             # Search bar, filters, view-mode toggle
├── TreeCanvas.tsx              # Renders the active view (tree or graph)
├── TreeNodeRow.tsx             # Single expandable row in list/tree view
├── TreeNodeDetail.tsx          # Right-panel detail inspector
├── TreeBreadcrumb.tsx          # Ancestry breadcrumb trail
├── TreeMinimap.tsx             # Optional minimap for large trees
├── TreeStats.tsx               # Summary statistics bar
└── hooks/
    ├── useTreeData.ts          # Fetch & cache tree from API
    ├── useTreeSearch.ts        # Client-side FTS filtering
    ├── useTreeNavigation.ts    # Keyboard nav, expand/collapse state
    └── useTreeSelection.ts    # Single/multi-select state
```

---

## 3. Data Model (Frontend)

### 3.1 TreeNode (Display)

Mapped from the backend `TreeNode` table:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | UUID |
| `parentId` | `string \| null` | Parent node UUID |
| `title` | `string` | Human-readable node title |
| `description` | `string` | LLM-generated summary |
| `nodeType` | `TreeNodeType` | `file`, `class`, `function`, `method`, `interface`, `type`, `constant`, `block`, `section`, `heading`, `paragraph`, `table`, `list` |
| `category` | `string` | One of 16 taxonomy categories |
| `subcategory` | `string` | Sub-classification |
| `importanceScore` | `number` | 0.0–1.0 |
| `filePath` | `string` | Source file path |
| `lineStart` | `number` | Start line in source |
| `lineEnd` | `number` | End line in source |
| `depth` | `number` | Tree depth (0 = root) |
| `keywords` | `string[]` | Associated keywords |
| `childCount` | `number` | Computed: number of direct children |
| `hasChildren` | `boolean` | Computed: childCount > 0 |

### 3.2 TreeIndex (Metadata)

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Index UUID |
| `appName` | `string` | Indexed application name |
| `rootPath` | `string` | Root path that was indexed |
| `status` | `string` | `building`, `ready`, `stale`, `error` |
| `nodeCount` | `number` | Total nodes |
| `fileCount` | `number` | Total files indexed |
| `createdAt` | `string` | ISO timestamp |
| `updatedAt` | `string` | ISO timestamp |

---

## 4. View Modes

### 4.1 Tree View (Default)

Indented, collapsible tree rendered as a virtualized list:

| Feature | Description |
|---------|-------------|
| Expand/Collapse | Click chevron or `→`/`←` keys |
| Lazy Loading | Children fetched on expand for large trees |
| Depth Indicators | Vertical indent guides with themed colors |
| Node Icons | Icon per `nodeType` (function, class, file, etc.) |
| Importance Badges | Color-coded dot for `importanceScore` ranges |
| Virtual Scroll | Only visible rows rendered (react-window or similar) |

```
▼ 📁 src/engine/                          [file]   ●●●○○  0.8
  ▼ 📄 retrieval.ts                        [file]   ●●●●○  0.9
    ▶ 🔷 RetrievalEngine                   [class]  ●●●●●  1.0
    ▶ 🔶 traverseTree                      [func]   ●●●●○  0.9
    ▶ 🔶 scoreNode                         [func]   ●●●○○  0.7
  ▶ 📄 parser.ts                           [file]   ●●●○○  0.7
```

### 4.2 Graph View (Optional)

Force-directed or hierarchical graph using React Flow or D3:

| Feature | Description |
|---------|-------------|
| Hierarchical Layout | Dagre/ELK layout algorithm |
| Zoom/Pan | Canvas navigation |
| Node Clustering | Group by file or category |
| Edge Labels | Relationship types |
| Minimap | Overview navigation |

### 4.3 Table View

Flat sortable table for bulk inspection:

| Column | Sortable | Filterable |
|--------|----------|------------|
| Title | ✅ | ✅ |
| Node Type | ✅ | ✅ (dropdown) |
| Category | ✅ | ✅ (dropdown) |
| Importance | ✅ | ✅ (range slider) |
| File Path | ✅ | ✅ |
| Depth | ✅ | ✅ |
| Keywords | ❌ | ✅ (tag search) |

---

## 5. TreeToolbar

### 5.1 Search

| Feature | Description |
|---------|-------------|
| Full-Text Search | Filter nodes by title, description, keywords |
| Regex Mode | Toggle regex matching |
| Highlight Matches | Matched text highlighted in tree |
| Result Count | Display `N of M nodes matched` |
| Search Scope | All / Current subtree / Selected files |

### 5.2 Filters

| Filter | Type | Options |
|--------|------|---------|
| Node Type | Multi-select chips | `file`, `class`, `function`, `method`, etc. |
| Category | Dropdown | 16 taxonomy categories |
| Importance | Range slider | 0.0–1.0 with step 0.1 |
| Depth | Range slider | 0–max |
| File Pattern | Text input | Glob pattern (e.g., `*.ts`) |

### 5.3 Actions

| Action | Icon | Shortcut | Description |
|--------|------|----------|-------------|
| Expand All | `ChevronsDown` | `Ctrl+Shift+E` | Expand entire tree |
| Collapse All | `ChevronsUp` | `Ctrl+Shift+C` | Collapse to roots |
| View Mode | `LayoutList` / `Network` / `Table2` | `Ctrl+1/2/3` | Switch view |
| Refresh | `RefreshCw` | `F5` | Re-fetch tree data |
| Export | `Download` | `Ctrl+Shift+S` | Export as JSON/CSV |

---

## 6. TreeNodeDetail (Inspector Panel)

Right-side panel shown when a node is selected:

### 6.1 Sections

| Section | Content |
|---------|---------|
| **Header** | Title, node type icon, importance badge |
| **Metadata** | Category, subcategory, depth, file path, line range |
| **Description** | LLM-generated description (markdown rendered) |
| **Keywords** | Tag chips with weights |
| **Source Preview** | Syntax-highlighted code/content snippet from `lineStart`–`lineEnd` |
| **Children** | Count and list of direct children (clickable) |
| **Ancestry** | Breadcrumb from root to current node |
| **Related Nodes** | Nodes sharing keywords or category (top 5 by relevance) |

### 6.2 Actions

| Action | Description |
|--------|-------------|
| Copy Path | Copy `filePath:lineStart` to clipboard |
| Open in Editor | Deep-link to source (if editor integration exists) |
| Re-index Node | Trigger re-indexing of this node's source file |
| Pin | Pin node for comparison |

---

## 7. TreeStats Bar

Summary statistics displayed above the tree:

| Stat | Description |
|------|-------------|
| Total Nodes | Count of all nodes in current view |
| Files Indexed | Number of unique source files |
| Avg Depth | Average tree depth |
| Avg Importance | Mean importance score |
| Categories | Count of distinct categories |
| Last Indexed | Timestamp of last index job |

---

## 8. Keyboard Navigation

| Key | Action |
|-----|--------|
| `↑` / `↓` | Move selection up/down |
| `→` | Expand node / move to first child |
| `←` | Collapse node / move to parent |
| `Enter` | Open detail panel for selected node |
| `Space` | Toggle selection (multi-select mode) |
| `/` | Focus search input |
| `Escape` | Clear search / close detail panel |
| `Home` | Jump to first node |
| `End` | Jump to last visible node |
| `Ctrl+F` | Open search |

---

## 9. API Endpoints

Consumed from the Non-Vector RAG API (spec/32, `07-api-interface.md`):

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tree-indexes` | List all tree indexes |
| GET | `/api/tree-indexes/:id` | Get index metadata |
| GET | `/api/tree-indexes/:id/nodes` | Get root-level nodes |
| GET | `/api/tree-indexes/:id/nodes/:nodeId` | Get node detail |
| GET | `/api/tree-indexes/:id/nodes/:nodeId/children` | Get children (lazy load) |
| GET | `/api/tree-indexes/:id/search` | Search nodes (query, filters) |
| GET | `/api/tree-indexes/:id/stats` | Get index statistics |
| POST | `/api/tree-indexes/:id/reindex` | Trigger re-indexing |

### Query Parameters

| Parameter | Endpoint | Type | Description |
|-----------|----------|------|-------------|
| `q` | `/search` | `string` | Full-text search query |
| `nodeType` | `/search`, `/nodes` | `string[]` | Filter by node types |
| `category` | `/search`, `/nodes` | `string[]` | Filter by categories |
| `minImportance` | `/search`, `/nodes` | `number` | Minimum importance score |
| `maxDepth` | `/search`, `/nodes` | `number` | Maximum depth |
| `filePattern` | `/search` | `string` | Glob pattern for file paths |
| `limit` | `/search`, `/nodes` | `number` | Pagination limit (default 100) |
| `offset` | `/search`, `/nodes` | `number` | Pagination offset |

---

## 10. Hooks

### 10.1 useTreeData

```tsx
interface UseTreeDataOptions {
  indexId: string;
  autoRefresh?: boolean;       // Poll for updates (default: false)
  refreshInterval?: number;    // Poll interval ms (default: 30000)
}

interface UseTreeDataReturn {
  index: TreeIndex | null;
  roots: TreeNode[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  fetchChildren: (nodeId: string) => Promise<TreeNode[]>;
}
```

### 10.2 useTreeSearch

```tsx
interface UseTreeSearchOptions {
  indexId: string;
  debounceMs?: number;         // Default: 300
}

interface UseTreeSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  results: TreeNode[];
  resultCount: number;
  totalCount: number;
  isSearching: boolean;
  filters: TreeFilters;
  setFilters: (f: TreeFilters) => void;
  clearSearch: () => void;
}
```

### 10.3 useTreeNavigation

```tsx
interface UseTreeNavigationReturn {
  expandedIds: Set<string>;
  selectedId: string | null;
  focusedId: string | null;
  expand: (id: string) => void;
  collapse: (id: string) => void;
  toggleExpand: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  select: (id: string) => void;
  focusNext: () => void;
  focusPrev: () => void;
  focusParent: () => void;
  focusFirstChild: () => void;
}
```

---

## 11. Theme Integration

Uses shared CLI frontend theme tokens:

| Token | Usage |
|-------|-------|
| `--background` | Tree container background |
| `--foreground` | Node text |
| `--muted` | Depth guide lines, inactive nodes |
| `--muted-foreground` | Secondary text (description, metadata) |
| `--primary` | Selected node highlight |
| `--accent` | Hovered node background |
| `--success` | High importance indicator (≥ 0.8) |
| `--warning` | Medium importance indicator (0.5–0.79) |
| `--info` | Low importance indicator (< 0.5) |
| `--border` | Panel borders, dividers |
| `--destructive` | Error state, stale index indicator |

Node type icons use category-specific colors from the theme palette.

---

## 12. Accessibility

| Requirement | Implementation |
|-------------|----------------|
| ARIA Role | `role="tree"` on container, `role="treeitem"` on nodes |
| Expand State | `aria-expanded="true/false"` on parent nodes |
| Selection | `aria-selected="true"` on active node |
| Level | `aria-level` reflecting depth |
| Set Size | `aria-setsize` and `aria-posinset` for siblings |
| Label | `aria-label` on toolbar actions |
| Live Region | `aria-live="polite"` for search result count |
| Focus Management | Roving tabindex within tree |
| Screen Reader | Announce node type and importance on focus |

---

## 13. Performance

| Concern | Strategy |
|---------|----------|
| Large Trees (100K+ nodes) | Virtual scrolling, lazy child loading |
| Search | Debounced API calls (300ms), server-side FTS5 |
| Re-renders | Memoized node rows, stable callback refs |
| Graph View | Web Worker for layout computation |
| Initial Load | Fetch only root nodes, progressive disclosure |
| Caching | React Query with 5-minute stale time |

---

## 14. Integration Points

| Integration | Description |
|-------------|-------------|
| **Settings Page** | Tree index management (create, delete, re-index) via Seedable Config |
| **API Tester** | Pre-populated tree search queries in API tester presets |
| **Error Modal** | Tree indexing errors displayed via shared error modal (codes 12000–12999) |
| **WebSocket** | Real-time index-building progress via `index.progress` events |
| **Changelog** | Tree visualization features tracked in shared changelog |

---

## 15. WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `index.progress` | B→F | Index build progress (files scanned, nodes created) |
| `index.completed` | B→F | Index build finished |
| `index.error` | B→F | Index build error |
| `node.updated` | B→F | Single node re-indexed |

---

## Cross-References

| Reference | Location |
|-----------|----------|
| Non-Vector RAG Overview | `spec/23-ai-bridge-non-vector-rag/00-overview.md` |
| Tree Index Schema | `spec/23-ai-bridge-non-vector-rag/02-tree-index-schema.md` |
| API Interface | `spec/23-ai-bridge-non-vector-rag/07-api-interface.md` |
| Component Library | `./10-component-library.md` |
| Hooks Library | `./15-hooks-library.md` |
| Accessibility Spec | `./12-accessibility-spec.md` |
| Error Codes (12000–12999) | `spec/23-ai-bridge-non-vector-rag/08-error-codes.md` |

---

*Tree visualization component provides interactive exploration of Non-Vector RAG tree indexes within the shared CLI frontend.*
