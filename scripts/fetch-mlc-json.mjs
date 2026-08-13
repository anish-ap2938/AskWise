/**
 * Vendor WebLLM JSON configs (and tokenizer) into the extension.
 * Weight shards stay on Hugging Face; tensor-cache dataPaths are rewritten
 * to absolute HF URLs so WebLLM does not look for .bin files next to the
 * packaged JSON.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = "anipanii/AskWise-PromptEngineer-1.5B-q4f16_1-MLC";
const WEIGHTS_BASE = `https://huggingface.co/${REPO}/resolve/main/`;
const OUT = join(ROOT, "public", "mlc-models", "askwise-ft", "resolve", "main");
const LOCAL = join(ROOT, "training", "output", "mlc_q4f16_1");

const SMALL_FILES = [
  "mlc-chat-config.json",
  "tokenizer_config.json",
  "tensor-cache.json",
];

function absolutizeTensorCache(raw, weightsBase) {
  const cache = JSON.parse(raw);
  const base = weightsBase.endsWith("/") ? weightsBase : `${weightsBase}/`;
  if (!Array.isArray(cache.records)) return cache;
  cache.records = cache.records.map((entry) => {
    if (!entry || typeof entry.dataPath !== "string") return entry;
    if (entry.dataPath.startsWith("http")) return entry;
    return { ...entry, dataPath: new URL(entry.dataPath, base).href };
  });
  return cache;
}

async function loadSource(name) {
  const localPath = join(LOCAL, name);
  if (existsSync(localPath) && statSync(localPath).size > 0) {
    console.log(`mlc-json: copy ${name} from training output`);
    return readFileSync(localPath);
  }
  const url = `${WEIGHTS_BASE}${name}`;
  console.log(`mlc-json: fetching ${name}…`);
  const res = await fetch(url, {
    headers: { Accept: "application/json, text/plain, */*" },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`mlc-json: failed ${url} (${res.status})`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const head = buf.subarray(0, 64).toString("utf8").trimStart().toLowerCase();
  if (head.startsWith("<!doctype") || head.startsWith("<html")) {
    throw new Error(`mlc-json: ${url} returned HTML instead of ${name}`);
  }
  return buf;
}

mkdirSync(OUT, { recursive: true });

for (const name of SMALL_FILES) {
  const dest = join(OUT, name);
  const buf = await loadSource(name);
  if (name === "tensor-cache.json") {
    const rewritten = absolutizeTensorCache(buf.toString("utf8"), WEIGHTS_BASE);
    writeFileSync(dest, JSON.stringify(rewritten, null, 4) + "\n");
    const httpsShards = rewritten.records.filter((r) =>
      String(r.dataPath).startsWith("https://")
    ).length;
    console.log(
      `mlc-json: wrote ${name} (${httpsShards} shard URLs → Hugging Face)`
    );
  } else {
    writeFileSync(dest, buf);
    console.log(`mlc-json: wrote ${name} (${buf.length} bytes)`);
  }
}

const tokenizerDest = join(OUT, "tokenizer.json");
if (existsSync(tokenizerDest) && statSync(tokenizerDest).size > 1_000_000) {
  console.log("mlc-json: keep tokenizer.json");
} else {
  const buf = await loadSource("tokenizer.json");
  writeFileSync(tokenizerDest, buf);
  console.log(`mlc-json: wrote tokenizer.json (${buf.length} bytes)`);
}
