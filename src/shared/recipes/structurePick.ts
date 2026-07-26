/** Deterministic structural diversity for Instant rewrites without a sub-recipe. */

export function structureIndex(raw: string, modulo: number): number {
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % Math.max(1, modulo);
}
