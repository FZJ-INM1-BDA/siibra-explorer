/**
 * Re-exports ColoredPolygon and its associated types from poly.ts.
 *
 * ColoredPolygon lives in poly.ts (right after Polygon) to avoid the
 * circular dependency that would arise from poly.ts ← colored-poly.ts ← poly.ts.
 * This shim keeps the public import path stable for any external consumers.
 */
export { ColoredPolygon, TColoredPolyJsonSpec, TNgAnnotationColoredLine } from './poly'
export type { Colormap } from './colormap.util'
