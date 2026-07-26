/**
 * Download packaged WebGPU model libraries used by on-device inference.
 * These ship inside the extension so AskWise does not fetch remote WASM.
 */
import { mkdirSync, existsSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const VERSION = "v0_2_84/base";
const BASE =
  `https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/${VERSION}`;
const OUT = join(process.cwd(), "public", "model-libs");

const FILES = [
  "Qwen2-1.5B-Instruct-q4f16_1_cs1k-webgpu.wasm",
  "Qwen2.5-3B-Instruct-q4f16_1_cs1k-webgpu.wasm",
  "Llama-3.2-1B-Instruct-q4f16_1_cs1k-webgpu.wasm",
];

mkdirSync(OUT, { recursive: true });

for (const name of FILES) {
  const dest = join(OUT, name);
  if (existsSync(dest) && statSync(dest).size > 1_000_000) {
    console.log(`model-libs: keep ${name}`);
    continue;
  }
  const url = `${BASE}/${name}`;
  console.log(`model-libs: fetching ${name}…`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`model-libs: failed ${url} (${res.status})`);
    process.exit(1);
  }
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  console.log(`model-libs: wrote ${name} (${statSync(dest).size} bytes)`);
}
