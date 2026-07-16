import { execSync } from "node:child_process";
import { readFileSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
const version = pkg.version ?? "0.0.0";
const dist = join(process.cwd(), "dist");
const outName = `askwise-${version}.zip`;
const out = join(process.cwd(), outName);
const legacy = join(process.cwd(), "promptpilot.zip");

if (existsSync(out)) unlinkSync(out);
if (existsSync(legacy)) unlinkSync(legacy);

try {
  if (process.platform === "win32") {
    execSync(
      `powershell -Command "Compress-Archive -Path '${dist}\\*' -DestinationPath '${out}' -Force"`,
      { stdio: "inherit" }
    );
  } else {
    execSync(`cd dist && zip -r ../${outName} .`, { stdio: "inherit" });
  }
  console.log(`Created ${out}`);
} catch (e) {
  console.error("Zip failed:", e);
  process.exit(1);
}
