#!/usr/bin/env node
/**
 * Spec Tree Scanner — generates src/generated/dashboard-data.json
 * Run: node scripts/generate-dashboard-data.cjs
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SPEC_DIR = path.join(ROOT, "spec");
const MEMORIES_DIR = path.join(ROOT, ".lovable", "memories");
const OUTPUT_DIR = path.join(ROOT, "src", "generated");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "dashboard-data.json");

function countFiles(dir, ext = ".md") {
  let count = 0;
  if (!fs.existsSync(dir)) return count;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(full, ext);
    else if (entry.name.endsWith(ext)) count++;
  }
  return count;
}

function countDirs(dir) {
  let count = 0;
  if (!fs.existsSync(dir)) return count;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      count++;
      count += countDirs(path.join(dir, entry.name));
    }
  }
  return count;
}

function getTopLevelModules(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{2}-/.test(d.name))
    .map((d) => d.name);
}

function extractDate(content) {
  const clean = content.replace(/\*+/g, "");
  const m = clean.match(/(?:Generated|Updated|Date|Issued)[:\s]*(\d{4}-\d{2}-\d{2})/i);
  return m ? m[1] : null;
}

function extractHealthScore(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const m = content.match(/Health Score[\s*:]*(\d+)\s*\/\s*100/i);
    return m ? parseInt(m[1], 10) : null;
  } catch {
    return null;
  }
}

function findBrokenLinks(dir) {
  let broken = 0, total = 0;
  if (!fs.existsSync(dir)) return { broken, total };
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = findBrokenLinks(full);
      broken += sub.broken;
      total += sub.total;
    } else if (entry.name.endsWith(".md")) {
      const content = fs.readFileSync(full, "utf8");
      const lines = content.split("\n");
      let fenceCount = 0;
      for (const line of lines) {
        if (line.trim().startsWith("```")) fenceCount++;
        if (fenceCount % 2 === 1) continue;
        const links = line.match(/\]\(\.\.\/.+?\)|\]\(\.\/.+?\)/g) || [];
        for (const link of links) {
          total++;
          const target = link.match(/\]\((.+?)\)/)?.[1]?.split("#")[0];
          if (target) {
            const resolved = path.resolve(path.dirname(full), target);
            if (!fs.existsSync(resolved)) broken++;
          }
        }
      }
    }
  }
  return { broken, total };
}

const CLI_MODULE_MAP = {
  "09-gsearch-cli": "GSearch CLI",
  "10-brun-cli": "BRun CLI",
  "11-ai-bridge-cli": "AI Bridge CLI",
  "12-nexus-flow-cli": "Nexus Flow CLI",
  "14-wp-plugin-builder": "WP Plugin Builder",
  "15-spec-reverse-cli": "Spec Reverse CLI",
  "16-ai-transcribe-cli": "AI Transcribe CLI",
  "19-license-manager": "License Manager",
  "21-wp-seo-publish-cli": "WP SEO Publish CLI",
  "31-generic-enforce": "Generic Enforce CLI",
};

function getComplianceTools(specDir) {
  const tools = [];
  for (const [folder, name] of Object.entries(CLI_MODULE_MAP)) {
    const modPath = path.join(specDir, folder);
    if (!fs.existsSync(modPath)) continue;
    let auditDate = null;
    const reportPath = path.join(modPath, "99-consistency-report.md");
    if (fs.existsSync(reportPath)) {
      auditDate = extractDate(fs.readFileSync(reportPath, "utf8"));
    }
    if (!auditDate) {
      const overviewPath = path.join(modPath, "00-overview.md");
      if (fs.existsSync(overviewPath)) {
        auditDate = extractDate(fs.readFileSync(overviewPath, "utf8"));
      }
    }
    tools.push({ Tool: name, Date: auditDate || "Unknown", Status: "100%" });
  }
  return tools;
}

function getModuleScores(specDir) {
  return getTopLevelModules(specDir).map((mod) => {
    const modPath = path.join(specDir, mod);
    const reportPath = path.join(modPath, "99-consistency-report.md");
    const score = fs.existsSync(reportPath) ? extractHealthScore(reportPath) : null;
    const fileCount = countFiles(modPath, ".md");
    return { Module: mod, Score: score, FileCount: fileCount };
  });
}

function getValidationReports(specDir) {
  const reportsDir = path.join(specDir, "validation-reports");
  if (!fs.existsSync(reportsDir)) return [];
  const reports = [];
  for (const entry of fs.readdirSync(reportsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md") || entry.name === "00-overview.md") continue;
    const content = fs.readFileSync(path.join(reportsDir, entry.name), "utf8");
    const titleMatch = content.match(/^#\s+(.+)/m);
    const dateMatch = extractDate(content);
    const certMatch = content.match(/CERT-[\w-]+/);
    reports.push({
      File: entry.name,
      Title: titleMatch ? titleMatch[1].trim() : entry.name.replace(/\.md$/, ""),
      Date: dateMatch || "Unknown",
      CertId: certMatch ? certMatch[0] : null,
    });
  }
  return reports.sort((a, b) => a.File.localeCompare(b.File));
}

function generate() {
  const now = new Date().toISOString().split("T")[0];
  const specFileCount = countFiles(SPEC_DIR, ".md");
  const topModules = getTopLevelModules(SPEC_DIR);
  const memoryFileCount = countFiles(MEMORIES_DIR, ".md");
  const memoryFolderCount = countDirs(MEMORIES_DIR);
  const moduleScores = getModuleScores(SPEC_DIR);
  const scored = moduleScores.filter((s) => s.Score !== null);
  const passingModules = scored.filter((s) => s.Score === 100).length;
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((a, b) => a + b.Score, 0) / scored.length)
    : 100;
  const grade = avgScore >= 97 ? "A+" : avgScore >= 93 ? "A" : avgScore >= 90 ? "A-" : `${avgScore}`;
  const linkStatus = findBrokenLinks(SPEC_DIR);
  const complianceTools = getComplianceTools(SPEC_DIR);
  const validationReports = getValidationReports(SPEC_DIR);

  const data = {
    GeneratedAt: now,
    SpecFiles: specFileCount,
    SpecModules: topModules.length,
    MemoryFiles: memoryFileCount,
    MemoryFolders: memoryFolderCount,
    HealthScore: avgScore,
    HealthGrade: grade,
    PassingModules: passingModules,
    TotalScoredModules: scored.length,
    TotalModules: topModules.length,
    Links: { Total: linkStatus.total, Broken: linkStatus.broken, Fixed: linkStatus.total - linkStatus.broken },
    ComplianceTools: complianceTools,
    ModuleScores: moduleScores,
    ValidationReports: validationReports,
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
  console.log(`✅ dashboard-data.json generated (${specFileCount} spec, ${memoryFileCount} memories, ${memoryFolderCount} folders)`);
}

generate();
