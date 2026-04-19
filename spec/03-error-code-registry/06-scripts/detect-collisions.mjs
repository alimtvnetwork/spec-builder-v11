#!/usr/bin/env node
/**
 * Collision Detection Script for Ecosystem Error Codes
 * 
 * Validates that no two modules have overlapping ecosystem integer codes
 * across all error-codes.json index files.
 * 
 * Usage: node spec/07-error-code-registry/scripts/detect-collisions.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../..');

const MASTER_INDEX = resolve(ROOT, 'spec/07-error-code-registry/error-codes-master.json');

// ── Helpers ──────────────────────────────────────────────────────────

function loadJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function extractEcosystemCodes(index) {
  const codes = [];
  if (!index?.categories) return codes;

  for (const cat of index.categories) {
    if (!cat.codes) continue;
    for (const entry of cat.codes) {
      // Integer code = ecosystem code
      if (typeof entry.code === 'number') {
        codes.push({
          code: entry.code,
          constant: entry.constant,
          category: cat.name,
          localCode: entry.localCode ?? null,
        });
      }
      // String codes like "E1001" are local/prefixed — skip unless mapped
    }
  }
  return codes;
}

// ── Main ─────────────────────────────────────────────────────────────

function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   Error Code Collision Detection                       ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const master = loadJson(MASTER_INDEX);
  if (!master) {
    console.error('❌ Master index not found:', MASTER_INDEX);
    process.exit(1);
  }

  // Collect all codes from all modules
  const allCodes = new Map(); // code → [{ project, constant, category, file }]
  const moduleResults = [];
  let totalCodes = 0;
  let filesScanned = 0;

  for (const mod of master.modules) {
    const indexPath = resolve(ROOT, mod.indexFile);
    const index = loadJson(indexPath);

    if (!index) {
      moduleResults.push({ project: mod.project, name: mod.name, status: 'MISSING', codes: 0 });
      continue;
    }

    filesScanned++;
    const codes = extractEcosystemCodes(index);
    totalCodes += codes.length;

    moduleResults.push({ project: mod.project, name: mod.name, status: 'OK', codes: codes.length });

    for (const c of codes) {
      if (!allCodes.has(c.code)) {
        allCodes.set(c.code, []);
      }
      allCodes.get(c.code).push({
        project: mod.project,
        constant: c.constant,
        category: c.category,
        file: mod.indexFile,
      });
    }
  }

  // ── Module summary ───────────────────────────────────────────────

  console.log('Modules scanned:');
  console.log('─'.repeat(60));
  for (const m of moduleResults) {
    const icon = m.status === 'OK' ? '✅' : m.status === 'MISSING' ? '⚠️ ' : '❌';
    const codesStr = m.codes > 0 ? `${m.codes} codes` : m.status === 'MISSING' ? 'file missing' : '0 codes';
    console.log(`  ${icon} ${m.project.padEnd(8)} ${m.name.padEnd(40)} ${codesStr}`);
  }
  console.log('─'.repeat(60));
  console.log(`  Files: ${filesScanned}/${master.modules.length}  |  Ecosystem codes: ${totalCodes}\n`);

  // ── Collision detection ──────────────────────────────────────────

  const collisions = [];
  for (const [code, owners] of allCodes) {
    if (owners.length > 1) {
      collisions.push({ code, owners });
    }
  }

  // ── Range overlap detection ──────────────────────────────────────

  const rangeOverlaps = [];
  const moduleRanges = [];
  for (const mod of master.modules) {
    const ranges = mod.ranges ?? (mod.range ? [mod.range] : []);
    for (const r of ranges) {
      moduleRanges.push({ project: mod.project, min: r.min, max: r.max });
    }
  }

  for (let i = 0; i < moduleRanges.length; i++) {
    for (let j = i + 1; j < moduleRanges.length; j++) {
      const a = moduleRanges[i];
      const b = moduleRanges[j];
      if (a.min <= b.max && b.min <= a.max) {
        // Check if it's the known intentional PS/AB overlap
        const knownOverlap =
          (a.project === 'AB' || b.project === 'AB') &&
          master.specialRanges?.some(s => s.project === 'PS/AB');
        rangeOverlaps.push({
          a: `${a.project} [${a.min}-${a.max}]`,
          b: `${b.project} [${b.min}-${b.max}]`,
          intentional: knownOverlap,
        });
      }
    }
  }

  // ── Gap analysis ─────────────────────────────────────────────────

  const sortedRanges = [...moduleRanges].sort((a, b) => a.min - b.min);
  const gaps = [];
  for (let i = 0; i < sortedRanges.length - 1; i++) {
    const gapStart = sortedRanges[i].max + 1;
    const gapEnd = sortedRanges[i + 1].min - 1;
    if (gapEnd >= gapStart && (gapEnd - gapStart) >= 10) {
      gaps.push({ min: gapStart, max: gapEnd, size: gapEnd - gapStart + 1 });
    }
  }

  // ── Duplicate constant detection (within same module) ────────────

  const dupConstants = [];
  for (const mod of master.modules) {
    const indexPath = resolve(ROOT, mod.indexFile);
    const index = loadJson(indexPath);
    if (!index?.categories) continue;

    const seen = new Map();
    for (const cat of index.categories) {
      if (!cat.codes) continue;
      for (const entry of cat.codes) {
        if (seen.has(entry.constant)) {
          dupConstants.push({
            project: mod.project,
            constant: entry.constant,
            first: seen.get(entry.constant),
            second: typeof entry.code === 'number' ? entry.code : entry.localCode ?? entry.code,
          });
        } else {
          seen.set(entry.constant, typeof entry.code === 'number' ? entry.code : entry.localCode ?? entry.code);
        }
      }
    }
  }

  // ── Results ──────────────────────────────────────────────────────

  console.log('══════════════════════════════════════════════════════════');
  console.log('  RESULTS');
  console.log('══════════════════════════════════════════════════════════\n');

  // Code collisions
  if (collisions.length === 0) {
    console.log('✅ Code Collisions: NONE — all ecosystem integer codes are unique\n');
  } else {
    console.log(`❌ Code Collisions: ${collisions.length} FOUND\n`);
    for (const c of collisions) {
      console.log(`   Code ${c.code}:`);
      for (const o of c.owners) {
        console.log(`     → ${o.project} / ${o.constant} (${o.category}) in ${o.file}`);
      }
      console.log();
    }
  }

  // Range overlaps
  if (rangeOverlaps.length === 0) {
    console.log('✅ Range Overlaps: NONE\n');
  } else {
    const intentional = rangeOverlaps.filter(r => r.intentional);
    const unintentional = rangeOverlaps.filter(r => !r.intentional);
    if (unintentional.length > 0) {
      console.log(`❌ Range Overlaps: ${unintentional.length} UNINTENTIONAL\n`);
      for (const r of unintentional) {
        console.log(`     ${r.a}  ↔  ${r.b}`);
      }
      console.log();
    }
    if (intentional.length > 0) {
      console.log(`ℹ️  Range Overlaps: ${intentional.length} intentional (format-separated)\n`);
      for (const r of intentional) {
        console.log(`     ${r.a}  ↔  ${r.b}  [known PS/AB SEO overlap]`);
      }
      console.log();
    }
  }

  // Duplicate constants
  if (dupConstants.length === 0) {
    console.log('✅ Duplicate Constants: NONE\n');
  } else {
    console.log(`⚠️  Duplicate Constants: ${dupConstants.length} found\n`);
    for (const d of dupConstants) {
      console.log(`     ${d.project}: "${d.constant}" at codes ${d.first} and ${d.second}`);
    }
    console.log();
  }

  // Gaps
  if (gaps.length > 0) {
    console.log(`ℹ️  Unallocated Gaps (≥10 codes):`);
    for (const g of gaps) {
      console.log(`     [${g.min}-${g.max}] (${g.size} codes)`);
    }
    console.log();
  }

  // Final verdict
  const hasFailures = collisions.length > 0 || rangeOverlaps.some(r => !r.intentional);
  console.log('══════════════════════════════════════════════════════════');
  if (hasFailures) {
    console.log('  ❌ VALIDATION FAILED — collisions detected');
    process.exit(1);
  } else {
    console.log('  ✅ VALIDATION PASSED — no collisions detected');
    process.exit(0);
  }
}

main();
