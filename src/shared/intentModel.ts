/**
 * In-browser inference for the AskWise intent classifier.
 *
 * A quantized multinomial logistic regression over the tf-idf features from
 * intentFeatures.ts. Trained by training/12_train_intent_clf.py, shipped as
 * assets/intent-model.json and loaded lazily — classification stays synchronous
 * and rules-only until the weights arrive.
 */
import { analyze } from "./intentFeatures";
import type { ModeId } from "./types";

export interface IntentModelFile {
  version: number;
  classes: string[];
  tokens: string[];
  idf: number[];
  coefScale: number;
  coefB64: string;
  intercept: number[];
  sublinearTf: boolean;
}

interface LoadedModel {
  classes: ModeId[];
  index: Map<string, number>;
  idf: Float32Array;
  coef: Int8Array;
  coefScale: number;
  intercept: Float32Array;
  nFeatures: number;
  sublinearTf: boolean;
}

let model: LoadedModel | null = null;
let loading: Promise<boolean> | null = null;

function decodeBase64(b64: string): Int8Array {
  const bin = atob(b64);
  const out = new Int8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = (bin.charCodeAt(i) << 24) >> 24;
  return out;
}

export function setIntentModel(file: IntentModelFile): void {
  const index = new Map<string, number>();
  for (let i = 0; i < file.tokens.length; i++) index.set(file.tokens[i], i);
  model = {
    classes: file.classes as ModeId[],
    index,
    idf: Float32Array.from(file.idf),
    coef: decodeBase64(file.coefB64),
    coefScale: file.coefScale,
    intercept: Float32Array.from(file.intercept),
    nFeatures: file.tokens.length,
    sublinearTf: file.sublinearTf,
  };
}

export function isIntentModelReady(): boolean {
  return model !== null;
}

/** Raw decision-function scores per class, or null when no model is loaded. */
export function intentScores(text: string): Partial<Record<ModeId, number>> | null {
  if (!model) return null;
  const counts = new Map<number, number>();
  for (const tok of analyze(text)) {
    const idx = model.index.get(tok);
    if (idx === undefined) continue;
    counts.set(idx, (counts.get(idx) ?? 0) + 1);
  }
  if (counts.size === 0) return null;

  // tf-idf with sublinear tf, then L2 normalize (matches scikit-learn)
  let norm = 0;
  const values = new Map<number, number>();
  for (const [idx, count] of counts) {
    const tf = model.sublinearTf ? 1 + Math.log(count) : count;
    const v = tf * model.idf[idx];
    values.set(idx, v);
    norm += v * v;
  }
  norm = Math.sqrt(norm) || 1;

  const nClasses = model.classes.length;
  const out: Partial<Record<ModeId, number>> = {};
  for (let c = 0; c < nClasses; c++) {
    let sum = model.intercept[c];
    const base = c * model.nFeatures;
    for (const [idx, v] of values) {
      const w = model.coef[base + idx];
      if (w !== 0) sum += (w * model.coefScale * v) / norm;
    }
    out[model.classes[c]] = sum;
  }
  return out;
}

/** Softmax probabilities per class, or null when no model is loaded. */
export function intentProbabilities(text: string): Partial<Record<ModeId, number>> | null {
  const scores = intentScores(text);
  if (!scores) return null;
  const entries = Object.entries(scores) as Array<[ModeId, number]>;
  const max = Math.max(...entries.map(([, v]) => v));
  let total = 0;
  const exps = entries.map(([mode, v]) => {
    const e = Math.exp(v - max);
    total += e;
    return [mode, e] as [ModeId, number];
  });
  const out: Partial<Record<ModeId, number>> = {};
  for (const [mode, e] of exps) out[mode] = e / total;
  return out;
}

/**
 * Fetch the packaged model once. Safe to call repeatedly and from several
 * contexts; failures are swallowed so the extension falls back to rules.
 */
export function loadIntentModel(url?: string): Promise<boolean> {
  if (model) return Promise.resolve(true);
  if (loading) return loading;

  const resolved =
    url ??
    (typeof chrome !== "undefined" && chrome.runtime?.getURL
      ? chrome.runtime.getURL("assets/intent-model.json")
      : "assets/intent-model.json");

  loading = fetch(resolved)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((json: IntentModelFile) => {
      setIntentModel(json);
      return true;
    })
    .catch(() => false)
    .finally(() => {
      loading = null;
    });

  return loading;
}
