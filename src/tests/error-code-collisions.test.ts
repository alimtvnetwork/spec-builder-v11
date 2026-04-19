import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, '../..');
const MASTER_INDEX = resolve(ROOT, 'spec/03-error-code-registry/error-codes-master.json');

function loadJson(path: string) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

/**
 * Extract ecosystem codes from an index, scoped to the given ranges.
 */
function extractEcosystemCodes(index: any, ranges: { min: number; max: number }[]) {
  const codes: { code: number; constant: string; category: string }[] = [];
  if (!index?.categories) return codes;

  function inRange(code: number): boolean {
    return ranges.some(r => code >= r.min && code <= r.max);
  }

  for (const cat of index.categories) {
    if (!cat.codes) continue;
    for (const entry of cat.codes) {
      if (typeof entry.code === 'number' && inRange(entry.code)) {
        codes.push({ code: entry.code, constant: entry.constant, category: cat.name });
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
    const key = mod.indexFile;
    if (!key) continue; // Skip modules with no index file yet
    if (!groups.has(key)) {
      groups.set(key, { projects: [], ranges: [] });
    }
    const g = groups.get(key)!;
    g.projects.push(mod.project);
    const rs = mod.ranges ?? (mod.range ? [mod.range] : []);
    if (mod.ecosystemRemapRange) rs.push(mod.ecosystemRemapRange);
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
    for (const mod of master.modules) {
      if (!mod.indexFile) continue; // Skip allocated-only modules
      const path = resolve(ROOT, mod.indexFile);
      if (!existsSync(path)) missing.push(`${mod.project}: ${mod.indexFile}`);
    }
    expect(missing, `Missing index files:\n${missing.join('\n')}`).toHaveLength(0);
  });

  it('no ecosystem integer code collisions across modules', () => {
    const allCodes = new Map<number, { projects: string; constant: string; category: string }[]>();
    const groups = groupModulesByIndex(master.modules);

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
    for (const mod of master.modules) {
      // Use only the module's own range(s), not ecosystemRemapRange
      const rs = mod.ranges ?? (mod.range ? [mod.range] : []);
      for (const r of rs) {
        ranges.push({ project: mod.project, min: r.min, max: r.max });
      }
    }

    const overlaps: string[] = [];
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        const a = ranges[i], b = ranges[j];
        if (a.min <= b.max && b.min <= a.max) {
          // Skip known intentional overlaps
          const isKnownPsAb = (a.project === 'AB' || b.project === 'AB') &&
            master.specialRanges?.some((s: any) => s.project === 'PS/AB');
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
    const groups = groupModulesByIndex(master.modules);

    for (const [indexFile, group] of groups) {
      const index = loadJson(resolve(ROOT, indexFile));
      if (!index?.categories) continue;

      const seen = new Map<string, number | string>();
      for (const cat of index.categories) {
        if (!cat.codes) continue;
        for (const entry of cat.codes) {
          const id = typeof entry.code === 'number' ? entry.code : entry.localCode ?? entry.code;
          if (seen.has(entry.constant)) {
            dups.push(`${group.projects.join('/')}: "${entry.constant}" at ${seen.get(entry.constant)} and ${id}`);
          } else {
            seen.set(entry.constant, id);
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
    const groups = groupModulesByIndex(master.modules);

    for (const [indexFile, group] of groups) {
      const index = loadJson(resolve(ROOT, indexFile));
      if (!index?.categories || !index.stats) continue;

      let count = 0;
      for (const cat of index.categories) {
        count += cat.codes?.length ?? 0;
      }

      if (count !== index.stats.totalCodes) {
        mismatches.push(`${group.projects.join('/')}: counted ${count}, stats says ${index.stats.totalCodes}`);
      }
    }

    if (mismatches.length > 0) {
      console.warn(`⚠️  Stats mismatches (non-blocking):\n${mismatches.join('\n')}`);
    }
    // Non-blocking: report but don't fail
    expect(true).toBe(true);
  });
});
