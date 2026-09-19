import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '../..');
const MASTER_INDEX = resolve(ROOT, '02-spec/03-error-manage/03-error-code-registry/error-codes-master.json');

function loadJson(path: string) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

/**
 * Extract ecosystem codes from an index, scoped to the given ranges.
 */
function extractEcosystemCodes(index: any, ranges: { min: number; max: number }[]) {
  const codes: { code: number; constant: string; category: string }[] = [];
  const categories = index?.categories ?? index?.Categories;
  if (!categories) return codes;

  function inRange(code: number): boolean {
    return ranges.some(r => {
      const rMin = r.min ?? (r as any).Min;
      const rMax = r.max ?? (r as any).Max;
      return code >= rMin && code <= rMax;
    });
  }

  for (const cat of categories) {
    const catCodes = cat.codes ?? cat.Codes;
    if (!catCodes) continue;
    for (const entry of catCodes) {
      const codeVal = typeof entry.code === 'number' ? entry.code : (typeof entry.Code === 'number' ? entry.Code : null);
      const constantVal = entry.constant ?? entry.Constant;
      const catName = cat.name ?? cat.Name;
      if (codeVal !== null && inRange(codeVal)) {
        codes.push({ code: codeVal, constant: constantVal, category: catName });
      }
    }
  }
  return codes;
}

/**
 * Group modules by indexFile, merging their declared ranges.
 * This prevents double-counting when AB and AB-LR share the same file.
 */
function groupModulesByIndex(modules: any[]) {
  const groups = new Map<string, { projects: string[]; ranges: { min: number; max: number }[] }>();

  for (const mod of modules) {
    const key = mod.indexFile ?? mod.IndexFile;
    if (!key) continue; // Skip modules with no index file yet
    if (!groups.has(key)) {
      groups.set(key, { projects: [], ranges: [] });
    }
    const g = groups.get(key)!;
    const proj = mod.project ?? mod.Project;
    g.projects.push(proj);
    const rawRanges = mod.ranges ?? mod.Ranges ?? (mod.range ? [mod.range] : (mod.Range ? [mod.Range] : []));
    const rs = rawRanges.map((r: any) => ({ min: r.min ?? r.Min, max: r.max ?? r.Max }));
    const remap = mod.ecosystemRemapRange ?? mod.EcosystemRemapRange;
    if (remap) rs.push({ min: remap.min ?? remap.Min, max: remap.max ?? remap.Max });
    g.ranges.push(...rs);
  }

  return groups;
}

describe('Error Code Collision Detection', () => {
  const master = loadJson(MASTER_INDEX);

  it('master index exists', () => {
    expect(master).not.toBeNull();
  });

  it('all module index files exist', () => {
    const missing: string[] = [];
    const modules = master?.modules ?? master?.Modules ?? [];
    for (const mod of modules) {
      const idxFile = mod.indexFile ?? mod.IndexFile;
      if (!idxFile) continue; // Skip allocated-only modules
      const path = resolve(ROOT, idxFile);
      const proj = mod.project ?? mod.Project;
      if (!existsSync(path)) missing.push(`${proj}: ${idxFile}`);
    }
    expect(missing, `Missing index files:\n${missing.join('\n')}`).toHaveLength(0);
  });

  it('no ecosystem integer code collisions across modules', () => {
    const allCodes = new Map<number, { projects: string; constant: string; category: string }[]>();
    const modules = master?.modules ?? master?.Modules ?? [];
    const groups = groupModulesByIndex(modules);

    for (const [indexFile, group] of groups) {
      const index = loadJson(resolve(ROOT, indexFile));
      if (!index) continue;
      const codes = extractEcosystemCodes(index, group.ranges);
      const label = group.projects.join('/');
      for (const c of codes) {
        if (!allCodes.has(c.code)) allCodes.set(c.code, []);
        allCodes.get(c.code)!.push({ projects: label, constant: c.constant, category: c.category });
      }
    }

    const collisions: string[] = [];
    for (const [code, owners] of allCodes) {
      if (owners.length > 1) {
        const detail = owners.map(o => `${o.projects}/${o.constant}`).join(' vs ');
        collisions.push(`Code ${code}: ${detail}`);
      }
    }

    expect(collisions, `Collisions found:\n${collisions.join('\n')}`).toHaveLength(0);
  });

  it('no unintentional range overlaps between modules', () => {
    const ranges: { project: string; min: number; max: number }[] = [];
    const modules = master?.modules ?? master?.Modules ?? [];
    for (const mod of modules) {
      // Use only the module's own range(s), not ecosystemRemapRange
      const rawRanges = mod.ranges ?? mod.Ranges ?? (mod.range ? [mod.range] : (mod.Range ? [mod.Range] : []));
      const rs = rawRanges.map((r: any) => ({ min: r.min ?? r.Min, max: r.max ?? r.Max }));
      const proj = mod.project ?? mod.Project;
      for (const r of rs) {
        ranges.push({ project: proj, min: r.min, max: r.max });
      }
    }

    const overlaps: string[] = [];
    const specialRanges = master?.specialRanges ?? master?.SpecialRanges;
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        const a = ranges[i], b = ranges[j];
        if (a.min <= b.max && b.min <= a.max) {
          // Skip known intentional overlaps
          const isKnownPsAb = (a.project === 'AB' || b.project === 'AB') &&
            specialRanges?.some((s: any) => (s.project ?? s.Project) === 'PS/AB');
          // AB-LR is a subset of AB (same index, declared separately)
          const isAbSubset = (a.project === 'AB' && b.project === 'AB-LR') ||
            (a.project === 'AB-LR' && b.project === 'AB');
          // BR is a sub-range within GS (intentional)
          const isGsBr = (a.project === 'GS' && b.project === 'BR') ||
            (a.project === 'BR' && b.project === 'GS');
          if (!isKnownPsAb && !isAbSubset && !isGsBr) {
            overlaps.push(`${a.project} [${a.min}-${a.max}] ↔ ${b.project} [${b.min}-${b.max}]`);
          }
        }
      }
    }

    expect(overlaps, `Unintentional overlaps:\n${overlaps.join('\n')}`).toHaveLength(0);
  });

  it('no duplicate constants within same module (warnings)', () => {
    const dups: string[] = [];
    const modules = master?.modules ?? master?.Modules ?? [];
    const groups = groupModulesByIndex(modules);

    for (const [indexFile, group] of groups) {
      const index = loadJson(resolve(ROOT, indexFile));
      const categories = index?.categories ?? index?.Categories;
      if (!categories) continue;

      const seen = new Map<string, number | string>();
      for (const cat of categories) {
        const catCodes = cat.codes ?? cat.Codes;
        if (!catCodes) continue;
        for (const entry of catCodes) {
          const rawCode = entry.code ?? entry.Code;
          const rawLocal = entry.localCode ?? entry.LocalCode;
          const id = typeof rawCode === 'number' ? rawCode : (rawLocal ?? rawCode);
          const constant = entry.constant ?? entry.Constant;
          if (seen.has(constant)) {
            dups.push(`${group.projects.join('/')}: "${constant}" at ${seen.get(constant)} and ${id}`);
          } else {
            seen.set(constant, id);
          }
        }
      }
    }

    if (dups.length > 0) {
      console.warn(`⚠️  Duplicate constants (non-blocking):\n${dups.join('\n')}`);
    }
    // Non-blocking: report but don't fail
    expect(true).toBe(true);
  });

  it('module code counts match stats.totalCodes (warnings)', () => {
    const mismatches: string[] = [];
    const modules = master?.modules ?? master?.Modules ?? [];
    const groups = groupModulesByIndex(modules);

    for (const [indexFile, group] of groups) {
      const index = loadJson(resolve(ROOT, indexFile));
      const categories = index?.categories ?? index?.Categories;
      const stats = index?.stats ?? index?.Stats;
      if (!categories || !stats) continue;

      let count = 0;
      for (const cat of categories) {
        const catCodes = cat.codes ?? cat.Codes;
        count += catCodes?.length ?? 0;
      }

      const totalCodes = stats.totalCodes ?? stats.TotalCodes;
      if (count !== totalCodes) {
        mismatches.push(`${group.projects.join('/')}: counted ${count}, stats says ${totalCodes}`);
      }
    }

    if (mismatches.length > 0) {
      console.warn(`⚠️  Stats mismatches (non-blocking):\n${mismatches.join('\n')}`);
    }
    // Non-blocking: report but don't fail
    expect(true).toBe(true);
  });
});
