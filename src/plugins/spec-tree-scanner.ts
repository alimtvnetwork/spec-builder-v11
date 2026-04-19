import { execSync } from "child_process";
import path from "path";
import type { Plugin } from "vite";

export function specTreeScanner(): Plugin {
  return {
    name: "spec-tree-scanner",
    buildStart() {
      try {
        const script = path.resolve(__dirname, "../scripts/generate-dashboard-data.cjs");
        execSync(`node "${script}"`, { stdio: "inherit" });
      } catch (e) {
        console.warn("⚠️  spec-tree scanner failed:", e);
      }
    },
  };
}
