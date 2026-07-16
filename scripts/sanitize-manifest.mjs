/**
 * Post-build guard for CRXJS output.
 * Dev mode can leave broad web_accessible_resources (all_urls + wildcards),
 * and mix Vite HMR loaders into dist/. Strip/fail those before zip/store upload.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");
const manifestPath = join(dist, "manifest.json");

if (!existsSync(manifestPath)) {
  console.error("sanitize-manifest: dist/manifest.json missing — run build first");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
let changed = false;

const wars = Array.isArray(manifest.web_accessible_resources)
  ? manifest.web_accessible_resources
  : [];

manifest.web_accessible_resources = wars.filter((entry) => {
  const matches = entry?.matches ?? [];
  const resources = entry?.resources ?? [];
  const isDevLeak =
    matches.includes("<all_urls>") ||
    resources.includes("**/*") ||
    resources.includes("*");
  if (isDevLeak) {
    console.warn(
      "sanitize-manifest: removed permissive web_accessible_resources entry",
      entry
    );
    changed = true;
    return false;
  }
  return true;
});

const contentJs = manifest.content_scripts?.[0]?.js ?? [];
for (const file of contentJs) {
  const abs = join(dist, file);
  if (!existsSync(abs)) {
    console.error(`sanitize-manifest: content script missing: ${file}`);
    process.exit(1);
  }
  const src = readFileSync(abs, "utf8");
  if (src.includes("vite-client") || src.includes("crx-client-preamble")) {
    console.error(
      `sanitize-manifest: ${file} looks like a Vite DEV loader.\n` +
        "  dist/ was polluted by `npm run dev`. Run: rm -rf dist && npm run build"
    );
    process.exit(1);
  }
}

if (contentJs.some((f) => f.includes("src/content/") && f.endsWith("-loader.js"))) {
  console.warn(
    "sanitize-manifest: content script still points at src/content/*-loader.js — " +
      "expected assets/*-loader-*.js after a clean production build"
  );
}

if (changed) {
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log("sanitize-manifest: wrote cleaned dist/manifest.json");
} else {
  console.log("sanitize-manifest: ok");
}
