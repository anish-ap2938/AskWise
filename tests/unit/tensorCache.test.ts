import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { absolutizeTensorCachePaths } from "../../src/shared/tensorCache";

describe("tensor-cache shard URLs", () => {
  it("rewrites relative dataPaths to absolute Hugging Face URLs", () => {
    const rewritten = absolutizeTensorCachePaths(
      {
        metadata: { ParamSize: 1 },
        records: [
          { dataPath: "params_shard_0.bin", nbytes: 10 },
          {
            dataPath:
              "https://huggingface.co/anipanii/AskWise-PromptEngineer-1.5B-q4f16_1-MLC/resolve/main/params_shard_1.bin",
            nbytes: 20,
          },
        ],
      },
      "https://huggingface.co/anipanii/AskWise-PromptEngineer-1.5B-q4f16_1-MLC/resolve/main/"
    ) as { records: Array<{ dataPath: string }> };

    expect(rewritten.records[0]?.dataPath).toBe(
      "https://huggingface.co/anipanii/AskWise-PromptEngineer-1.5B-q4f16_1-MLC/resolve/main/params_shard_0.bin"
    );
    expect(rewritten.records[1]?.dataPath).toContain("params_shard_1.bin");
  });

  it("packages tensor-cache.json with Hugging Face shard URLs", () => {
    const raw = readFileSync(
      join(
        process.cwd(),
        "public/mlc-models/askwise-ft/resolve/main/tensor-cache.json"
      ),
      "utf8"
    );
    const cache = JSON.parse(raw) as { records: Array<{ dataPath: string }> };
    expect(cache.records.length).toBeGreaterThan(0);
    for (const rec of cache.records) {
      expect(rec.dataPath).toMatch(
        /^https:\/\/huggingface\.co\/.+\/resolve\/main\/params_shard_\d+\.bin$/
      );
    }
  });
});
