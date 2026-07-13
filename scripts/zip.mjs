import { execSync } from "node:child_process";
import { join } from "node:path";

const dist = join(process.cwd(), "dist");
const out = join(process.cwd(), "promptpilot.zip");

try {
  if (process.platform === "win32") {
    execSync(
      `powershell -Command "Compress-Archive -Path '${dist}\\*' -DestinationPath '${out}' -Force"`,
      { stdio: "inherit" }
    );
  } else {
    execSync(`cd dist && zip -r ../promptpilot.zip .`, { stdio: "inherit" });
  }
  console.log(`Created ${out}`);
} catch (e) {
  console.error("Zip failed:", e);
  process.exit(1);
}
