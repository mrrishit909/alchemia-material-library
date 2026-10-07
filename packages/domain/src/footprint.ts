// "Same function" comparison: the square beam of length L that reaches a target bending stiffness EI, in each material, and what it weighs, costs and emits.
import type { Material } from "@alchemia/schemas";
import { MATERIALS } from "./materials.ts";
export const FOOTPRINT = { lengthM: 0.5, targetEINm2: 2000 };
export type Footprint = { id: string; name: string; family: string; sideMm: number; massKg: number; carbonKg: number; costSteelKg: number; sectionMm2: number };
export function footprint(m: Material, p = FOOTPRINT): Footprint {
  const I = p.targetEINm2 / (m.modulusGpa * 1e9), a = (12 * I) ** 0.25, mass = m.densityKgM3 * a * a * p.lengthM;
  return { id: m.id, name: m.name, family: m.family, sideMm: a * 1000, massKg: mass, carbonKg: mass * m.carbonKgPerKg, costSteelKg: mass * m.relativeCost, sectionMm2: a * a * 1e6 };
}
export const footprints = (list: Material[] = MATERIALS, p = FOOTPRINT) => list.map((m) => footprint(m, p));
export type Metric = "massKg" | "carbonKg" | "costSteelKg";
export const bestBy = (fs: Footprint[], metric: Metric) => fs.reduce((a, b) => (b[metric] < a[metric] ? b : a));
