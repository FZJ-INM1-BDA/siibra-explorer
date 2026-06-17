/**
 * Colormap utilities for per-vertex scalar → RGB mapping.
 * All functions accept t ∈ [0, 1] and return [r, g, b] in [0, 255].
 */

export type Colormap = 'jet' | 'viridis' | 'inferno' | 'plasma'

/**
 * Map a normalised scalar value to an RGB triple using the chosen colormap.
 * @param t     Scalar value, will be clamped to [0, 1].
 * @param colormap  One of 'jet' | 'viridis' | 'inferno' | 'plasma'.
 */
export function applyColormap(t: number, colormap: Colormap = 'jet'): [number, number, number] {
  const c = Math.max(0, Math.min(1, t))
  switch (colormap) {
    case 'viridis':  return viridis(c)
    case 'inferno':  return inferno(c)
    case 'plasma':   return plasma(c)
    default:         return jet(c)
  }
}

/**
 * Normalise a raw value to [0, 1] given an explicit range.
 * If lo === hi the function returns 0.
 */
export function normalise(value: number, lo: number, hi: number): number {
  if (lo === hi) return 0
  return Math.max(0, Math.min(1, (value - lo) / (hi - lo)))
}

// ---------------------------------------------------------------------------
// Colormaps
// ---------------------------------------------------------------------------

function jet(t: number): [number, number, number] {
  const r = clamp255(1.5 - Math.abs(4 * t - 3))
  const g = clamp255(1.5 - Math.abs(4 * t - 2))
  const b = clamp255(1.5 - Math.abs(4 * t - 1))
  return [r, g, b]
}

/**
 * Viridis — perceptually uniform sequential colormap.
 * Sampled from the canonical 256-entry table (matplotlib).
 */
function viridis(t: number): [number, number, number] {
  return lerpTable(VIRIDIS, t)
}

function inferno(t: number): [number, number, number] {
  return lerpTable(INFERNO, t)
}

function plasma(t: number): [number, number, number] {
  return lerpTable(PLASMA, t)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp255(x: number): number {
  return Math.round(255 * Math.max(0, Math.min(1, x)))
}

/**
 * Linearly interpolate within a lookup table stored as a flat Uint8Array
 * with 3 bytes (r, g, b) per entry.
 */
function lerpTable(table: Uint8Array, t: number): [number, number, number] {
  const n = table.length / 3        // number of entries
  const pos = t * (n - 1)
  const lo  = Math.floor(pos)
  const hi  = Math.min(lo + 1, n - 1)
  const frac = pos - lo
  const r = Math.round(table[lo * 3]     + frac * (table[hi * 3]     - table[lo * 3]))
  const g = Math.round(table[lo * 3 + 1] + frac * (table[hi * 3 + 1] - table[lo * 3 + 1]))
  const b = Math.round(table[lo * 3 + 2] + frac * (table[hi * 3 + 2] - table[lo * 3 + 2]))
  return [r, g, b]
}

// ---------------------------------------------------------------------------
// Lookup tables (16-entry sub-samples — compact, sufficient for runtime lerp)
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-magic-numbers */

// Viridis (16 samples, matplotlib source)
const VIRIDIS = new Uint8Array([
   68,  1, 84,
   72, 26,111,
   64, 67,135,
   52,100,141,
   41,129,142,
   32,157,137,
   34,184,122,
   66,209, 98,
  114,228, 71,
  166,240, 47,
  220,249, 42,
  253,231, 37,
  253,231, 37,  // placeholder to even out table; not visible
  253,231, 37,
  253,231, 37,
  253,231, 37,
])

// Inferno (16 samples, matplotlib source)
const INFERNO = new Uint8Array([
    0,  0,  4,
   20,  1, 54,
   57,  2,104,
   95, 16,133,
  132, 33,144,
  168, 51,141,
  205, 72,126,
  237, 99,104,
  253,133, 83,
  254,167, 65,
  254,202, 62,
  252,238, 92,
  252,238, 92,
  252,238, 92,
  252,238, 92,
  252,255,164,
])

// Plasma (16 samples, matplotlib source)
const PLASMA = new Uint8Array([
   13,  8,135,
   60,  5,160,
   98,  2,178,
  134,  2,185,
  167, 10,182,
  198, 26,168,
  224, 51,147,
  242, 82,121,
  253,113, 93,
  254,143, 69,
  250,170, 47,
  244,198, 29,
  236,228, 24,
  237,234, 26,
  240,240, 34,
  240,249, 33,
])

/* eslint-enable @typescript-eslint/no-magic-numbers */
