/**
 * Spec index augmentation utility.
 *
 * The spec browser uses curated `specFolders` lists for ordering and labels,
 * but those lists can drift behind the actual filesystem. This helper merges
 * every `.md` file discovered via Vite's `import.meta.glob` into the curated
 * list so newly added folders (e.g. `09-code-block-system`) and any nested
 * spec docs always appear in the search index — without having to hand-edit
 * the curated arrays.
 */

export interface SpecFileLike {
  name: string;
  path: string;
}

export interface SpecFolderLike {
  id: string;
  label: string;
  path: string;
  description: string;
  category:
    | "foundation"
    | "core"
    | "cli"
    | "wordpress"
    | "standards"
    | "utilities"
    | "enforcement";
  files: SpecFileLike[];
  children?: SpecFolderLike[];
}

// Discover every spec markdown file at build time. Keys look like:
//   "/02-spec/09-code-block-system/00-overview.md"
const discoveredSpecPaths = Object.keys(
  import.meta.glob(["/02-spec/**/*.md", "/spec/**/*.md"], { query: "?raw", import: "default" }),
)
  .map((key) => key.replace(/^\//, "")) // -> "02-spec/09-code-block-system/00-overview.md"
  .sort();

const formatLabel = (slug: string): string =>
  slug
    .replace(/^\d+-/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatFileName = (filename: string, includeNumberPrefix: boolean): string => {
  const base = filename.replace(/\.md$/, "");
  if (includeNumberPrefix) {
    return base.replace(/^(\d+)-/, "$1 — ").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return base.replace(/^\d+-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const inferCategory = (folderName: string): SpecFolderLike["category"] => {
  if (folderName.startsWith("30-") || folderName.startsWith("31-") || folderName.startsWith("32-") || folderName.startsWith("33-") || folderName.startsWith("34-") || folderName.startsWith("35-") || folderName.startsWith("36-") || folderName.startsWith("37-") || folderName.startsWith("18-")) return "wordpress";
  if (folderName.startsWith("20-") || folderName.startsWith("21-") || folderName.startsWith("22-") || folderName.startsWith("23-") || folderName.startsWith("24-") || folderName.startsWith("25-") || folderName.startsWith("26-") || folderName.startsWith("27-") || folderName.startsWith("28-") || folderName.startsWith("29-") || folderName.startsWith("13-")) return "cli";
  if (folderName.startsWith("02-") || folderName.startsWith("05-") || folderName.startsWith("01-")) return "standards";
  if (folderName.startsWith("08-") || folderName.startsWith("17-")) return "enforcement";
  if (folderName.startsWith("03-") || folderName.startsWith("04-") || folderName.startsWith("06-") || folderName.startsWith("07-") || folderName.startsWith("09-") || folderName.startsWith("10-") || folderName.startsWith("11-") || folderName.startsWith("12-") || folderName.startsWith("14-") || folderName.startsWith("15-") || folderName.startsWith("16-") || folderName.startsWith("19-") || folderName.startsWith("21-")) return "core";
  if (folderName.startsWith("40-") || folderName.startsWith("41-") || folderName.startsWith("42-") || folderName.startsWith("50-") || folderName.startsWith("51-") || folderName.startsWith("52-") || folderName.startsWith("53-") || folderName.startsWith("60-") || folderName.startsWith("61-")) return "utilities";
  return "foundation";
};

interface AugmentOptions {
  /** Whether file labels should keep the numeric prefix (e.g. "00 — Overview"). */
  includeNumberPrefix: boolean;
}

/**
 * Merge auto-discovered spec files into a curated folder list.
 * - Files already listed in a curated folder keep their order/label.
 * - Files missing from a curated folder are appended (sorted by path).
 * - Folders not present in the curated list are appended as new folders.
 */
export function augmentSpecFolders<T extends SpecFolderLike>(
  curated: T[],
  options: AugmentOptions,
): T[] {
  // Build map: folder path -> { existing folder reference, set of known file paths }
  const folderByPath = new Map<string, T>();
  const knownFilesByFolder = new Map<string, Set<string>>();

  const indexFolder = (folder: T) => {
    folderByPath.set(folder.path, folder);
    knownFilesByFolder.set(folder.path, new Set(folder.files.map((f) => f.path)));
    folder.children?.forEach((c) => indexFolder(c as T));
  };
  curated.forEach(indexFolder);

  // Group all discovered files by their immediate parent folder path
  const discoveredByFolder = new Map<string, string[]>();
  for (const filePath of discoveredSpecPaths) {
    const parent = filePath.substring(0, filePath.lastIndexOf("/"));
    if (!discoveredByFolder.has(parent)) discoveredByFolder.set(parent, []);
    discoveredByFolder.get(parent)!.push(filePath);
  }

  // Clone curated folders so we can mutate file lists safely
  const cloneFolder = (folder: T): T => ({
    ...folder,
    files: [...folder.files],
    children: folder.children?.map((c) => cloneFolder(c as T)),
  });
  const result: T[] = curated.map(cloneFolder);

  // Reindex into the cloned tree
  folderByPath.clear();
  knownFilesByFolder.clear();
  result.forEach(indexFolder);

  // 1) Append missing files to known folders
  for (const [folderPath, files] of discoveredByFolder) {
    const folder = folderByPath.get(folderPath);
    if (!folder) continue;
    const known = knownFilesByFolder.get(folderPath)!;
    for (const filePath of files) {
      if (known.has(filePath)) continue;
      const filename = filePath.substring(filePath.lastIndexOf("/") + 1);
      folder.files.push({
        name: formatFileName(filename, options.includeNumberPrefix),
        path: filePath,
      });
      known.add(filePath);
    }
    folder.files.sort((a, b) => a.path.localeCompare(b.path));
  }

  // 2) Add brand-new folders (not in curated list at all)
  const seenNewFolders = new Set<string>();
  for (const [folderPath, files] of discoveredByFolder) {
    if (folderByPath.has(folderPath)) continue;
    if (folderPath === "02-spec" || folderPath === "02-spec") continue; // root files handled by curated "root" entry
    if (seenNewFolders.has(folderPath)) continue;
    seenNewFolders.add(folderPath);

    const segments = folderPath.split("/");
    const folderName = segments[segments.length - 1];
    // Only auto-add top-level spec folders (spec/NN-name). Skip deeper nesting
    // (those are spec subfolders without their own card, handled by parent).
    if (segments.length !== 2) continue;

    const id = folderName.match(/^(\d+)/)?.[1] ?? folderName;
    const newFolder = {
      id,
      label: options.includeNumberPrefix
        ? `${id} — ${formatLabel(folderName)}`
        : formatLabel(folderName),
      path: folderPath,
      description: `Auto-discovered spec module: ${formatLabel(folderName)}.`,
      category: inferCategory(folderName),
      files: files
        .map((filePath) => {
          const filename = filePath.substring(filePath.lastIndexOf("/") + 1);
          return {
            name: formatFileName(filename, options.includeNumberPrefix),
            path: filePath,
          };
        })
        .sort((a, b) => a.path.localeCompare(b.path)),
    } as T;

    result.push(newFolder);
  }

  // 3) For curated folders, also pick up files in nested subdirectories that
  //    don't have their own curated folder entry, so they remain searchable.
  for (const [folderPath, files] of discoveredByFolder) {
    const segments = folderPath.split("/");
    if (segments.length <= 2) continue; // top-level handled above
    if (folderByPath.has(folderPath)) continue;
    // Find nearest curated ancestor
    let ancestorPath = "";
    for (let i = segments.length - 1; i >= 2; i--) {
      const candidate = segments.slice(0, i).join("/");
      if (folderByPath.has(candidate)) {
        ancestorPath = candidate;
        break;
      }
    }
    if (!ancestorPath) continue;
    const ancestor = folderByPath.get(ancestorPath)!;
    const known = knownFilesByFolder.get(ancestorPath)!;
    const subPath = folderPath.substring(ancestorPath.length + 1);
    for (const filePath of files) {
      if (known.has(filePath)) continue;
      const filename = filePath.substring(filePath.lastIndexOf("/") + 1);
      const baseName = formatFileName(filename, options.includeNumberPrefix);
      ancestor.files.push({
        name: `${subPath}/${baseName}`,
        path: filePath,
      });
      known.add(filePath);
    }
    ancestor.files.sort((a, b) => a.path.localeCompare(b.path));
  }

  return result;
}
