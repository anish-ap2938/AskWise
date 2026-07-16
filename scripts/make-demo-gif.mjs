import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const assets = join(root, "store-assets");
const docsAssets = join(root, "docs", "assets");
const frames = [
  "01-hero.png",
  "02-diff.png",
  "03-ats.png",
  "04-placeholder.png",
  "06-onboarding.png",
];

for (const f of frames) {
  if (!existsSync(join(assets, f))) {
    console.error(`Missing ${f} — run CAPTURE=1 npm run capture:assets first`);
    process.exit(1);
  }
}

mkdirSync(docsAssets, { recursive: true });
const out = join(docsAssets, "demo.gif");

// Hold each frame ~1.2s, scale to 960px wide for README.
const inputs = frames.flatMap((f) => ["-loop", "1", "-t", "1.2", "-i", join(assets, f)]);
const n = frames.length;
const filter = [
  ...frames.map((_, i) => `[${i}:v]scale=960:-1:flags=lanczos,setsar=1[v${i}]`),
  `${frames.map((_, i) => `[v${i}]`).join("")}concat=n=${n}:v=1:a=0,format=rgb24[gif]`,
].join(";");

try {
  execSync(
    `ffmpeg -y ${inputs.join(" ")} -filter_complex "${filter}" -map "[gif]" -r 8 "${out}"`,
    { stdio: "inherit" }
  );
  console.log(`Wrote ${out}`);
} catch {
  console.error("ffmpeg failed — install ffmpeg or skip the demo GIF");
  process.exit(1);
}
