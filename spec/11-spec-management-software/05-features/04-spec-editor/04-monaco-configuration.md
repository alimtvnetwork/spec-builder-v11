# Monaco Editor Configuration

**Version:** 2.0.0  
**Status:** Draft  
**Updated:** 2026-03-09  

---

## Overview

Comprehensive Monaco Editor configuration for the Spec Management Software. Monaco is used for JSON editing, Go code viewing, and diff comparisons. CodeMirror 6 remains the primary Markdown editor (see [01-markdown-editor.md](./01-markdown-editor.md)).

**Cross-References:**
- [Spec Editor Overview](./00-overview.md)
- [Project Editor UI](../24-code-generation-system/20-project-editor-ui.md) — Layout & integration context
- [Consistency Dashboard](../08-consistency-checker/03-consistency-dashboard.md) — Diff editor usage
- [Code Review UI](../26-ai-code-generation/13-code-review-ui.md) — Code review integration
- [Coding Guidelines](../../04-coding-guidelines/00-overview.md)

---

## Editor Selection Matrix

| File Type | Editor | Rationale |
|-----------|--------|-----------|
| `.md` | CodeMirror 6 | Better Markdown extensions, lighter bundle |
| `.json` | Monaco | Native JSON schema validation, formatting |
| `.go` | Monaco | Go syntax, bracket matching, symbol outline |
| `.tsx`, `.ts` | Monaco | TypeScript language service built-in |
| `.yaml` | Monaco | Schema validation support |
| Diff views | Monaco Diff Editor | Side-by-side + inline diff modes |

---

## Package & Version

```typescript
// @monaco-editor/react ^4.6.0
import Editor, { DiffEditor, loader } from "@monaco-editor/react";
import type { editor, languages, Uri } from "monaco-editor";
```

**Bundle Strategy:**
- Use `@monaco-editor/react` wrapper (lazy-loads Monaco from CDN by default)
- For offline/self-hosted: configure `loader.config({ paths: { vs: '/monaco/vs' } })`
- Tree-shake unused languages via `monaco-editor/esm/vs/editor/editor.api`

---

## Base Configuration

```typescript
// src/config/monaco-config.ts

/** Shared options applied to all Monaco instances */
export const baseMonacoOptions: editor.IStandaloneEditorConstructionOptions = {
  // Layout
  automaticLayout: true,
  scrollBeyondLastLine: false,
  padding: { top: 12, bottom: 12 },

  // Font
  fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  fontSize: 14,
  fontLigatures: true,
  lineHeight: 22,

  // Editing
  tabSize: 2,
  insertSpaces: true,
  formatOnPaste: true,
  formatOnType: true,
  autoClosingBrackets: 'languageDefined',
  autoClosingQuotes: 'languageDefined',
  autoIndent: 'full',
  linkedEditing: true,

  // Display
  minimap: { enabled: false },
  lineNumbers: 'on',
  renderLineHighlight: 'line',
  renderWhitespace: 'selection',
  bracketPairColorization: { enabled: true },
  guides: {
    bracketPairs: true,
    indentation: true,
  },
  smoothScrolling: true,
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',

  // Word wrap
  wordWrap: 'off', // Overridden per language

  // Accessibility
  accessibilitySupport: 'auto',
  ariaLabel: 'Code Editor',
};
```

---

## Language-Specific Overrides

```typescript
// src/config/monaco-languages.ts

export const languageOverrides: Record<string, Partial<editor.IStandaloneEditorConstructionOptions>> = {
  json: {
    tabSize: 2,
    formatOnPaste: true,
    formatOnType: true,
    wordWrap: 'off',
  },
  go: {
    tabSize: 4,          // Go convention: hard tabs displayed as 4
    insertSpaces: false,  // Go uses tabs
    formatOnPaste: false, // gofmt handles formatting
    wordWrap: 'off',
  },
  typescript: {
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'off',
  },
  typescriptreact: {
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'off',
  },
  yaml: {
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'on',
  },
};

/** Merge base options with language overrides */
export function getMonacoOptions(
  language: string
): editor.IStandaloneEditorConstructionOptions {
  return {
    ...baseMonacoOptions,
    ...(languageOverrides[language] ?? {}),
    language,
  };
}
```

---

## Theme Configuration

```typescript
// src/config/monaco-theme.ts
import type { editor } from "monaco-editor";

/** Custom dark theme aligned with application design system */
export const specDarkTheme: editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
    { token: 'keyword', foreground: '569CD6' },
    { token: 'string', foreground: 'CE9178' },
    { token: 'number', foreground: 'B5CEA8' },
    { token: 'type', foreground: '4EC9B0' },
    { token: 'function', foreground: 'DCDCAA' },
    { token: 'variable', foreground: '9CDCFE' },
    { token: 'operator', foreground: 'D4D4D4' },
    { token: 'delimiter', foreground: 'D4D4D4' },
  ],
  colors: {
    'editor.background': '#1E1E2E',
    'editor.foreground': '#CDD6F4',
    'editor.lineHighlightBackground': '#2A2B3D',
    'editor.selectionBackground': '#45475A',
    'editorCursor.foreground': '#F5E0DC',
    'editorLineNumber.foreground': '#6C7086',
    'editorLineNumber.activeForeground': '#CDD6F4',
    'editor.inactiveSelectionBackground': '#313244',
    'editorIndentGuide.background': '#313244',
    'editorIndentGuide.activeBackground': '#45475A',
  },
};

/** Custom light theme */
export const specLightTheme: editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
    { token: 'keyword', foreground: '0000FF' },
    { token: 'string', foreground: 'A31515' },
    { token: 'number', foreground: '098658' },
    { token: 'type', foreground: '267F99' },
    { token: 'function', foreground: '795E26' },
    { token: 'variable', foreground: '001080' },
  ],
  colors: {
    'editor.background': '#FFFFFF',
    'editor.foreground': '#1E1E1E',
    'editor.lineHighlightBackground': '#F5F5F5',
    'editor.selectionBackground': '#ADD6FF',
  },
};

/** Register themes on Monaco init */
export function registerThemes(monaco: typeof import("monaco-editor")): void {
  monaco.editor.defineTheme('spec-dark', specDarkTheme);
  monaco.editor.defineTheme('spec-light', specLightTheme);
}
```

---

## JSON Schema Validation

```typescript
// src/config/monaco-json-schemas.ts
import type { languages } from "monaco-editor";

/** Register JSON schemas for validation + autocompletion */
export function configureJsonSchemas(
  monaco: typeof import("monaco-editor")
): void {
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    allowComments: false,
    trailingCommas: 'error',
    schemas: [
      {
        uri: 'schema://spec-config',
        fileMatch: ['**/spec-config.json', '**/spec.config.json'],
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Project name' },
            version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
            specRoot: { type: 'string', description: 'Root spec directory' },
            outputDir: { type: 'string', description: 'Code output directory' },
            language: { type: 'string', enum: ['golang', 'react', 'both'] },
          },
          required: ['name', 'version', 'specRoot'],
        },
      },
      {
        uri: 'schema://pipeline-config',
        fileMatch: ['**/pipeline.json', '**/automation/*.json'],
        schema: {
          type: 'object',
          properties: {
            stages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string', enum: ['validate', 'generate', 'build', 'test'] },
                  config: { type: 'object' },
                },
                required: ['name', 'type'],
              },
            },
          },
        },
      },
    ],
  });
}
```

---

## Diff Editor Configuration

```typescript
// src/config/monaco-diff.ts

/** Options for the Monaco Diff Editor used in consistency dashboard and code review */
export const diffEditorOptions: editor.IDiffEditorConstructionOptions = {
  // Layout
  automaticLayout: true,
  padding: { top: 12, bottom: 12 },

  // Diff rendering
  renderSideBySide: true,        // false = inline mode
  enableSplitViewResizing: true,
  ignoreTrimWhitespace: true,
  renderIndicators: true,
  renderMarginRevertIcon: true,

  // Display
  minimap: { enabled: false },
  lineNumbers: 'on',
  readOnly: true,               // Diff views are read-only by default
  renderOverviewRuler: true,

  // Font (inherit from base)
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  fontSize: 13,
  lineHeight: 20,
};

/** Diff editor component props */
export interface DiffEditorProps {
  original: string;
  modified: string;
  language: string;
  inline?: boolean;       // Inline vs side-by-side
  readOnly?: boolean;
  onAccept?: () => void;  // Accept modified version
  onReject?: () => void;  // Reject and keep original
}
```

---

## Editor Component Wrapper

```typescript
// src/components/editor/MonacoWrapper.tsx
import Editor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { getMonacoOptions } from "@/config/monaco-languages";
import { registerThemes, configureJsonSchemas } from "@/config/monaco-theme";

interface MonacoWrapperProps {
  content: string;
  language: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  readOnly?: boolean;
  height?: string;
  theme?: 'spec-dark' | 'spec-light';
}

export function MonacoWrapper({
  content,
  language,
  onChange,
  onSave,
  readOnly = false,
  height = '100%',
  theme = 'spec-dark',
}: MonacoWrapperProps) {
  const options = getMonacoOptions(language);

  function handleBeforeMount(monaco: typeof import("monaco-editor")) {
    registerThemes(monaco);
    if (language === 'json') {
      configureJsonSchemas(monaco);
    }
  }

  function handleMount(editor: editor.IStandaloneCodeEditor) {
    // Register Ctrl+S save action
    if (onSave) {
      editor.addAction({
        id: 'save-file',
        label: 'Save File',
        keybindings: [
          // KeyMod.CtrlCmd | KeyCode.KeyS
          2048 | 49, // monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS
        ],
        run: () => onSave(),
      });
    }
  }

  return (
    <Editor
      height={height}
      language={language}
      value={content}
      theme={theme}
      options={{ ...options, readOnly }}
      beforeMount={handleBeforeMount}
      onMount={handleMount}
      onChange={(value) => onChange(value ?? '')}
    />
  );
}
```

---

## Go Language Support

```typescript
// src/config/monaco-go.ts

/** Register Go language configuration for Monaco */
export function configureGoLanguage(
  monaco: typeof import("monaco-editor")
): void {
  // Register Go if not already available
  monaco.languages.register({ id: 'go' });

  monaco.languages.setMonarchTokensProvider('go', {
    keywords: [
      'break', 'case', 'chan', 'const', 'continue', 'default', 'defer',
      'else', 'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import',
      'interface', 'map', 'package', 'range', 'return', 'select', 'struct',
      'switch', 'type', 'var',
    ],
    builtinTypes: [
      'bool', 'byte', 'complex64', 'complex128', 'error', 'float32',
      'float64', 'int', 'int8', 'int16', 'int32', 'int64', 'rune',
      'string', 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'uintptr',
    ],
    builtinFunctions: [
      'append', 'cap', 'close', 'complex', 'copy', 'delete', 'imag',
      'len', 'make', 'new', 'panic', 'print', 'println', 'real', 'recover',
    ],
    operators: [
      '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
      '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^',
      '%', '<<', '>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
      '%=', '<<=', '>>=', ':=',
    ],
    symbols: /[=><!~?:&|+\-*/^%]+/,
    tokenizer: {
      root: [
        [/[a-zA-Z_]\w*/, {
          cases: {
            '@keywords': 'keyword',
            '@builtinTypes': 'type',
            '@builtinFunctions': 'predefined',
            '@default': 'identifier',
          },
        }],
        { include: '@whitespace' },
        [/[{}()[\]]/, '@brackets'],
        [/@symbols/, { cases: { '@operators': 'operator', '@default': '' } }],
        [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
        [/0[xX][0-9a-fA-F]+/, 'number.hex'],
        [/\d+/, 'number'],
        [/"([^"\\]|\\.)*$/, 'string.invalid'],
        [/"/, { token: 'string.quote', next: '@string' }],
        [/`/, { token: 'string.quote', next: '@rawstring' }],
        [/'[^\\']'/, 'string'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, { token: 'string.quote', next: '@pop' }],
      ],
      rawstring: [
        [/[^`]+/, 'string'],
        [/`/, { token: 'string.quote', next: '@pop' }],
      ],
      whitespace: [
        [/[ \t\r\n]+/, 'white'],
        [/\/\*/, 'comment', '@comment'],
        [/\/\/.*$/, 'comment'],
      ],
      comment: [
        [/[^/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/[/*]/, 'comment'],
      ],
    },
  });

  // Go language configuration (brackets, comments, auto-closing)
  monaco.languages.setLanguageConfiguration('go', {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/'],
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"', notIn: ['string'] },
      { open: '`', close: '`', notIn: ['string'] },
      { open: "'", close: "'", notIn: ['string'] },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: '`', close: '`' },
    ],
    folding: {
      markers: {
        start: /^\s*\/\/\s*#?region\b/,
        end: /^\s*\/\/\s*#?endregion\b/,
      },
    },
    indentationRules: {
      increaseIndentPattern: /^.*\{\s*$/,
      decreaseIndentPattern: /^\s*\}/,
    },
  });
}
```

---

## Performance Considerations

| Concern | Mitigation |
|---------|------------|
| Bundle size (~2MB) | Lazy-load via `@monaco-editor/react`; only load needed languages |
| Multiple instances | Share a single Monaco instance across tabs via `loader.init()` |
| Large files (>10K lines) | Enable `largeFileOptimizations: true`; disable minimap & bracket colorization |
| Memory leaks | Dispose editor instances via `editor.dispose()` on component unmount |
| Initial load time | Show skeleton/spinner during Monaco CDN load; preload on route entry |

```typescript
/** Large file detection and option adjustment */
export function getLargeFileOptions(
  lineCount: number
): Partial<editor.IStandaloneEditorConstructionOptions> {
  if (lineCount > 10_000) {
    return {
      minimap: { enabled: false },
      bracketPairColorization: { enabled: false },
      guides: { bracketPairs: false, indentation: false },
      renderLineHighlight: 'none',
      folding: false,
      wordWrap: 'off',
      largeFileOptimizations: true,
    };
  }
  return {};
}
```

---

## Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| 1 | Monaco loads lazily without blocking initial page render | Network tab shows deferred Monaco chunk |
| 2 | JSON files get schema validation with red squiggles | Open invalid `spec-config.json`, verify error markers |
| 3 | Go files get syntax highlighting with correct keyword coloring | Open `.go` file, verify `func`/`type` highlighted |
| 4 | Dark and light themes match application design system | Toggle theme, verify no jarring color mismatches |
| 5 | Diff editor renders side-by-side with accept/reject actions | Open consistency diff, verify navigation + actions |
| 6 | Ctrl+S triggers save in all editor instances | Press Ctrl+S, verify `onSave` callback fires |
| 7 | Files >10K lines load without visible lag | Open large file, verify <500ms editor ready |
| 8 | Editor instances are disposed on unmount (no memory leaks) | Switch tabs repeatedly, verify stable memory in DevTools |

---

## Error Handling

| Error | Code | User Message |
|-------|------|--------------|
| Monaco load failed | 6010 | "Editor failed to load. Check your connection and refresh." |
| Schema validation error | 6011 | "JSON does not match expected schema." |
| Large file warning | 6012 | "Large file detected. Some editor features are disabled for performance." |
| Theme registration failed | 6013 | "Custom theme failed to load. Using default theme." |

---

## Related Specs

- [Markdown Editor (CodeMirror)](./01-markdown-editor.md)
- [Preview Renderer](./02-preview-renderer.md)
- [Project Editor UI](../24-code-generation-system/20-project-editor-ui.md)
- [Code Review UI](../26-ai-code-generation/13-code-review-ui.md)
- [Consistency Dashboard](../08-consistency-checker/03-consistency-dashboard.md)
