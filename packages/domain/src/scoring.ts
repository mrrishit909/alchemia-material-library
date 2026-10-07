// Normalised property axes, weighted ranking, and the constellation layout (a 3D position for every material that depends on the weights).
import type { Axis, Material, Weights } from "@alchemia/schemas";
import { MATERIALS } from "./materials.ts";
import { mulberry32 } from "./rng.ts";
export const AXES: { id: Axis; label: string; unit: string; get: (m: Material) => number; higherIsBetter: boolean; short: string }[] = [
  { id: "strength", label: "Strength", unit: "MPa", get: (m) => m.tensileMpa, higherIsBetter: true, short: "Tensile strength" }, { id: "stiffness", label: "Stiffness", unit: "GPa", get: (m) => m.modulusGpa, higherIsBetter: true, short: "Young's modulus" },
  { id: "thermal", label: "Thermal conductivity", unit: "W/mK", get: (m) => m.conductivityWmK, higherIsBetter: true, short: "Conductivity" }, { id: "fatigue", label: "Fatigue", unit: "MPa", get: (m) => m.fatigueMpa, higherIsBetter: true, short: "Fatigue limit" },
  { id: "lightness", label: "Lightness", unit: "kg/m³", get: (m) => m.densityKgM3, higherIsBetter: false, short: "Density" }, { id: "carbon", label: "Low carbon", unit: "kgCO₂e/kg", get: (m) => m.carbonKgPerKg, higherIsBetter: false, short: "Carbon intensity" },
  { id: "cost", label: "Low cost", unit: "× steel", get: (m) => m.relativeCost, higherIsBetter: false, short: "Relative cost" },
];
export const ALL_ONES: Weights = { strength: 1, stiffness: 1, thermal: 1, fatigue: 1, lightness: 1, carbon: 1, cost: 1 };
export const PRESETS: { id: string; label: string; weights: Weights }[] = [
  { id: "balanced", label: "Balanced", weights: ALL_ONES }, { id: "light", label: "Light and stiff", weights: { strength: 0.6, stiffness: 1, thermal: 0, fatigue: 0.3, lightness: 1, carbon: 0.1, cost: 0.1 } },
  { id: "green", label: "Low carbon", weights: { strength: 0.3, stiffness: 0.2, thermal: 0, fatigue: 0.1, lightness: 0.2, carbon: 1, cost: 0.4 } }, { id: "cheap", label: "Cheap and strong", weights: { strength: 1, stiffness: 0.3, thermal: 0, fatigue: 0.4, lightness: 0, carbon: 0.1, cost: 1 } },
  { id: "heat", label: "Heat spreader", weights: { strength: 0, stiffness: 0.1, thermal: 1, fatigue: 0, lightness: 0.5, carbon: 0, cost: 0.5 } },
];
const logs = AXES.map((a) => { const v = MATERIALS.map((m) => Math.log10(a.get(m))); return { lo: Math.min(...v), hi: Math.max(...v) }; });
/** 0..1 across the library on a log scale; always higher is better (lower-is-better axes are inverted). */
export const normalised = (m: Material, axis: Axis): number => { const i = AXES.findIndex((a) => a.id === axis), a = AXES[i], t = (Math.log10(a.get(m)) - logs[i].lo) / (logs[i].hi - logs[i].lo || 1); return a.higherIsBetter ? t : 1 - t; };
export const radarOf = (m: Material) => AXES.map((a) => normalised(m, a.id));
export function score(m: Material, w: Weights): number { let s = 0, t = 0; for (const a of AXES) { s += w[a.id] * normalised(m, a.id); t += w[a.id]; } return t > 0 ? s / t : 0; }
export const rank = (w: Weights, list: Material[] = MATERIALS) => list.map((m) => ({ m, score: score(m, w) })).sort((a, b) => b.score - a.score || a.m.id.localeCompare(b.m.id));
const group = (m: Material, w: Weights, axes: Axis[]) => { const tw = axes.reduce((a, x) => a + w[x], 0), ws = tw > 0 ? axes.map((x) => w[x]) : axes.map(() => 1), t = ws.reduce((a, b) => a + b, 0); return axes.reduce((a, x, i) => a + ws[i] * normalised(m, x), 0) / t; };
/** Constellation positions in [-1.2, 1.2]^3: x is the mechanical score, y the footprint score (lightness, carbon, cost), z the thermal score, all under the current weights; a few relaxation steps keep stars apart. Deterministic. */
export function layout(w: Weights, list: Material[] = MATERIALS): Record<string, [number, number, number]> {
  const r = mulberry32(21), pos = list.map((m) => { const j = () => (r() - 0.5) * 0.12; return [group(m, w, ["strength", "stiffness", "fatigue"]) * 2 - 1 + j(), group(m, w, ["lightness", "carbon", "cost"]) * 2 - 1 + j(), group(m, w, ["thermal"]) * 2 - 1 + j()] as [number, number, number]; });
  for (let it = 0; it < 24; it++) for (let a = 0; a < pos.length; a++) for (let b = a + 1; b < pos.length; b++) { const d = [pos[a][0] - pos[b][0], pos[a][1] - pos[b][1], pos[a][2] - pos[b][2]], L = Math.hypot(...d) || 1e-6, min = 0.13; if (L < min) { const push = (min - L) / 2; for (let k = 0; k < 3; k++) { pos[a][k] += (d[k] / L) * push; pos[b][k] -= (d[k] / L) * push; } } }
  return Object.fromEntries(list.map((m, i) => [m.id, pos[i].map((v) => Math.max(-1.2, Math.min(1.2, v))) as [number, number, number]]));
}
export const compare = (ids: string[], w: Weights = ALL_ONES) => { const ms = ids.map((id) => MATERIALS.find((m) => m.id === id)).filter((m): m is Material => !!m); return { axes: AXES.map((a) => a.id), materials: ms.map((m) => ({ id: m.id, name: m.name, values: AXES.map((a) => a.get(m)), radar: radarOf(m), score: score(m, w) })), best: AXES.map((a) => { const v = ms.map((m) => a.get(m)); const bestIdx = v.indexOf(a.higherIsBetter ? Math.max(...v) : Math.min(...v)); return ms[bestIdx]?.id ?? null; }) }; };
