import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

// Minimal 1x1 purple PNG, scaled by browser for each size
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const buf = Buffer.from(PNG_BASE64, "base64");
const dir = join(process.cwd(), "icons");
mkdirSync(dir, { recursive: true });

for (const size of [16, 48, 128]) {
  writeFileSync(join(dir, `${size}.png`), buf);
  console.log(`Created icons/${size}.png`);
}
