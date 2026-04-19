#!/usr/bin/env node

/**
 * Flags modules whose error code utilization exceeds a threshold.
 * Emits GitHub Actions warnings but does not fail the build.
 * Usage: node spec/07-error-code-registry/scripts/check-utilization-threshold.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const THRESHOLD = 0.30; // 30%

const __dir = dirname(fileURLToPath(import.meta.url));
const MASTER = resolve(__dir, '../../..', 'spec/07-error-code-registry/error-codes-master.json');
const master = JSON.parse(readFileSync(MASTER, 'utf-8'));

function rangeCapacity(mod) {
  if (mod.range) return mod.range.max - mod.range.min + 1;
  if (mod.ranges) return mod.ranges.reduce((s, r) => s + (r.max - r.min + 1), 0);
  return 0;
}

const warnings = [];

for (const m of master.modules) {
  const cap = rangeCapacity(m);
  if (cap === 0 || m.totalCodes === 0) continue;
  const util = m.totalCodes / cap;
  if (util >= THRESHOLD) {
    const pct = (util * 100).toFixed(1);
    const remaining = cap - m.totalCodes;
    warnings.push({ project: m.project, name: m.name, pct, used: m.totalCodes, cap, remaining });
  }
}

if (warnings.length === 0) {
  console.log(`✅ All modules below ${(THRESHOLD * 100).toFixed(0)}% utilization threshold`);
} else {
  console.log(`⚠️  ${warnings.length} module(s) exceed ${(THRESHOLD * 100).toFixed(0)}% utilization:\n`);
  for (const w of warnings) {
    const msg = `${w.name} (${w.project}): ${w.pct}% — ${w.used}/${w.cap} used, ${w.remaining} remaining`;
    console.log(`  • ${msg}`);
    // Emit GitHub Actions warning annotation
    console.log(`::warning::${msg}`);
  }
}
