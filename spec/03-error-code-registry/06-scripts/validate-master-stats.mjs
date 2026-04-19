#!/usr/bin/env node

/**
 * Validates that error-codes-master.json stats.totalIndexedCodes and
 * stats.totalRetryableCodes match the sum of per-module values.
 * Exits non-zero if they are stale.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const MASTER = resolve(__dir, '../../..', 'spec/07-error-code-registry/error-codes-master.json');

const master = JSON.parse(readFileSync(MASTER, 'utf-8'));
const modules = master.modules;

const computedCodes = modules.reduce((s, m) => s + (m.totalCodes || 0), 0);
const computedRetryable = modules.reduce((s, m) => s + (m.retryableCodes || 0), 0);

let failed = false;

if (master.stats.totalIndexedCodes !== computedCodes) {
  console.error(`❌ stats.totalIndexedCodes is ${master.stats.totalIndexedCodes} but sum of modules is ${computedCodes}`);
  failed = true;
}

if (master.stats.totalRetryableCodes !== computedRetryable) {
  console.error(`❌ stats.totalRetryableCodes is ${master.stats.totalRetryableCodes} but sum of modules is ${computedRetryable}`);
  failed = true;
}

if (failed) {
  console.error('\nRun the following to fix:\n  Update stats.totalIndexedCodes and stats.totalRetryableCodes in error-codes-master.json');
  process.exit(1);
} else {
  console.log(`✅ Master index stats are consistent (${computedCodes} codes, ${computedRetryable} retryable)`);
}
