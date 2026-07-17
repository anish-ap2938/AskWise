/**
 * Package dist/ for Chrome Web Store upload.
 * Ensures manifest.json is at the archive root and omits macOS metadata.
 */
import { readFileSync, existsSync, unlinkSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { execFileSync } from "node:child_process";

const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
const version = pkg.version ?? "0.0.0";
const dist = join(process.cwd(), "dist");
const outName = `askwise-${version}.zip`;
const out = join(process.cwd(), outName);

if (!existsSync(join(dist, "manifest.json"))) {
  console.error("dist/manifest.json missing — run npm run build first");
  process.exit(1);
}

for (const p of [out, join(process.cwd(), "promptpilot.zip")]) {
  if (existsSync(p)) unlinkSync(p);
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === ".DS_Store" || name.startsWith("._") || name === "__MACOSX") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

const files = walk(dist);
const relFiles = files.map((f) => relative(dist, f));
if (!relFiles.includes("manifest.json")) {
  console.error("manifest.json not found under dist/");
  process.exit(1);
}

try {
  // -X = no extra file attributes (helps avoid macOS metadata in the archive)
  execFileSync("zip", ["-r", "-X", out, ...relFiles], {
    cwd: dist,
    stdio: "inherit",
  });
} catch {
  const py = `
import zipfile, os
dist = ${JSON.stringify(dist)}
out = ${JSON.stringify(out)}
files = ${JSON.stringify(relFiles)}
with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_DEFLATED) as z:
    for rel in files:
        z.write(os.path.join(dist, rel), arcname=rel)
print("Wrote", out)
`;
  execFileSync("python3", ["-c", py], { stdio: "inherit" });
}

const listing = execFileSync("unzip", ["-l", out], { encoding: "utf8" });
const hasRootManifest = listing
  .split("\n")
  .some((line) => /\smanifest\.json\s*$/.test(line) && !line.includes("/"));
if (!hasRootManifest) {
  console.error("Zip verification failed — manifest.json must be at archive root");
  process.exit(1);
}
if (listing.includes("__MACOSX") || listing.includes(".DS_Store") || listing.includes("dist/manifest")) {
  console.error("Zip contains junk or a nested dist/ folder — refusing to publish");
  process.exit(1);
}

console.log(`Created ${out}`);
