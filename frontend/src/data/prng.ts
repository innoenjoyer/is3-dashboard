/**
 * Seeded deterministic PRNG (mulberry32) plus sampling helpers.
 *
 * The mock layer must be reproducible: the same seed always produces the same
 * fleet. Math.random is never used anywhere in this layer.
 */

export type Rng = () => number

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return function next() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Uniform float in [min, max). */
export function range(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min)
}

/** Uniform integer in [min, max], inclusive. */
export function int(rng: Rng, min: number, max: number): number {
  return Math.floor(range(rng, min, max + 1))
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]
}

/** Roughly normal distribution (sum of uniforms) clamped to ±2 sd. */
export function normal(rng: Rng, mean: number, sd: number): number {
  const u = (rng() + rng() + rng() + rng() - 2) / 2 // in [-1, 1], bell-ish
  return mean + u * sd
}

/** In-place Fisher–Yates shuffle driven by the seeded rng. */
export function shuffle<T>(items: T[], rng: Rng): void {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = items[i]
    items[i] = items[j]
    items[j] = tmp
  }
}
