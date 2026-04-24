import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dashboardRoot = path.join(__dirname, "..");
const analysisDir = path.join(dashboardRoot, "..", "analysis_output");
const outDir = path.join(dashboardRoot, "public", "data");

const files = [
  "term_summary.json",
  "term_university_origin_pct.json",
  "term_summary.csv",
  "term_university_origin_pct.csv",
];

fs.mkdirSync(outDir, { recursive: true });

for (const f of files) {
  const src = path.join(analysisDir, f);
  const dest = path.join(outDir, f);
  if (!fs.existsSync(src)) {
    console.warn(`[sync-data] skip (not found): ${src}`);
    continue;
  }
  fs.copyFileSync(src, dest);
  console.log(`[sync-data] ${f}`);
}
