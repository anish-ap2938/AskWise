/**
 * WebLLM resolves shard paths with `new URL(dataPath, modelUrl)`.
 * Packaged configs live on chrome-extension://; weight shards stay on Hugging Face.
 * Absolute https dataPaths keep those two origins separate.
 */
export function absolutizeTensorCachePaths(
  cache: unknown,
  weightsBaseUrl: string
): unknown {
  const base = weightsBaseUrl.endsWith("/")
    ? weightsBaseUrl
    : `${weightsBaseUrl}/`;
  if (!cache || typeof cache !== "object") return cache;
  const records = (cache as { records?: unknown }).records;
  if (!Array.isArray(records)) return cache;

  return {
    ...cache,
    records: records.map((entry) => {
      if (!entry || typeof entry !== "object") return entry;
      const rec = entry as { dataPath?: unknown };
      if (typeof rec.dataPath !== "string" || rec.dataPath.startsWith("http")) {
        return entry;
      }
      return { ...rec, dataPath: new URL(rec.dataPath, base).href };
    }),
  };
}
