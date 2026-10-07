// Virtual tests: simplified, deterministic models that turn a material record into a curve and a few numbers. Educational, NOT a substitute for a test report.
import type { Material, TestKind } from "@alchemia/schemas";
export type Curve = { x: number[]; y: number[] };
export type TensileResult = { kind: "tensile"; curve: Curve; modulusGpa: number; yieldMpa: number; utsMpa: number; strainAtUtsPct: number; fractureStrainPct: number; toughnessMJm3: number; mode: "ductile" | "brittle"; necking: number; xLabel: string; yLabel: string };
export type BendingResult = { kind: "bending"; curve: Curve; stiffnessNmm: number; modulusGpa: number; maxLoadN: number; flexuralStrengthMpa: number; deflectionAtMaxMm: number; mode: "brittle" | "yield"; xLabel: string; yLabel: string; params: BendingParams };
export type ImpactResult = { kind: "impact"; absorbedJ: number; remainingJ: number; startAngleDeg: number; riseAngleDeg: number; mode: "brittle" | "ductile"; passes27J: boolean; params: ImpactParams };
export type TestResult = TensileResult | BendingResult | ImpactResult;
export type BendingParams = { spanMm: number; widthMm: number; thicknessMm: number };
export type ImpactParams = { temperatureC: number };
export const DEFAULT_BENDING: BendingParams = { spanMm: 64, widthMm: 10, thicknessMm: 4 };
export const DEFAULT_IMPACT: ImpactParams = { temperatureC: 20 };
export const PENDULUM = { massKg: 20, armM: 0.75, startEnergyJ: 135, g: 9.81, effectiveVolumeMm3: 800 };
export const isBrittle = (m: Material) => m.elongationPct < 3;
const trapz = (x: number[], y: number[]) => x.reduce((a, xi, i) => (i ? a + ((xi - x[i - 1]) * (y[i] + y[i - 1])) / 2 : 0), 0);
/** Engineering stress-strain curve: linear to yield, concave hardening to the ultimate strength, then necking to fracture. Brittle materials are linear to fracture. */
export function tensile(m: Material): TensileResult {
  const E = m.modulusGpa * 1000, uts = m.tensileMpa, x: number[] = [], y: number[] = [];
  if (isBrittle(m)) { const ef = uts / E; for (let i = 0; i <= 40; i++) { const e = (ef * i) / 40; x.push(e * 100); y.push(E * e); } return { kind: "tensile", curve: { x, y }, modulusGpa: m.modulusGpa, yieldMpa: uts, utsMpa: uts, strainAtUtsPct: ef * 100, fractureStrainPct: ef * 100, toughnessMJm3: trapz(x.map((v) => v / 100), y), mode: "brittle", necking: 0, xLabel: "Strain (%)", yLabel: "Stress (MPa)" }; }
  const ratio = 0.62 + 0.25 * Math.min(1, uts / 1200), sy = ratio * uts, ey = sy / E, ef = m.elongationPct / 100, eu = Math.max(ey * 1.3, ef * 0.6);
  for (let i = 0; i <= 12; i++) { const e = (ey * i) / 12; x.push(e * 100); y.push(E * e); }
  for (let i = 1; i <= 40; i++) { const t = i / 40, e = ey + (eu - ey) * t; x.push(e * 100); y.push(sy + (uts - sy) * Math.sqrt(t)); }
  for (let i = 1; i <= 20; i++) { const t = i / 20, e = eu + (ef - eu) * t; x.push(e * 100); y.push(uts * (1 - 0.2 * t * t)); }
  return { kind: "tensile", curve: { x, y }, modulusGpa: m.modulusGpa, yieldMpa: sy, utsMpa: uts, strainAtUtsPct: eu * 100, fractureStrainPct: ef * 100, toughnessMJm3: trapz(x.map((v) => v / 100), y), mode: "ductile", necking: Math.min(1, 0.25 + (ef - eu) / Math.max(ef, 1e-9)), xLabel: "Strain (%)", yLabel: "Stress (MPa)" };
}
/** Three-point bending of a rectangular bar. Ceramics and glass are stronger in bending than in tension (factor 1.4). */
export function bending(m: Material, p: BendingParams = DEFAULT_BENDING): BendingResult {
  const E = m.modulusGpa * 1000, b = p.widthMm, h = p.thicknessMm, L = p.spanMm, I = (b * h ** 3) / 12, k = (48 * E * I) / L ** 3, brittle = isBrittle(m), strength = m.tensileMpa * (m.cls === "ceramic" || m.cls === "glass" ? 1.4 : 1), sigY = brittle ? strength : (0.62 + 0.25 * Math.min(1, m.tensileMpa / 1200)) * m.tensileMpa;
  const Fy = (2 * sigY * b * h ** 2) / (3 * L), dy = Fy / k, x: number[] = [], y: number[] = [];
  for (let i = 0; i <= 20; i++) { x.push((dy * i) / 20); y.push((Fy * i) / 20); }
  let dmax = dy, Fmax = Fy;
  if (!brittle) { const strainLimit = 0.05, dEnd = (strainLimit * L ** 2) / (6 * h), d1 = Math.max(dy * 1.5, Math.min(dEnd, dy * 6)); for (let i = 1; i <= 30; i++) { const t = i / 30, d = dy + (d1 - dy) * t; x.push(d); y.push(Fy * (1 + (m.tensileMpa / sigY - 1) * Math.sqrt(t))); } Fmax = y[y.length - 1]; dmax = d1; }
  return { kind: "bending", curve: { x, y }, stiffnessNmm: k, modulusGpa: m.modulusGpa, maxLoadN: Fmax, flexuralStrengthMpa: (3 * Fmax * L) / (2 * b * h ** 2), deflectionAtMaxMm: dmax, mode: brittle ? "brittle" : "yield", xLabel: "Deflection (mm)", yLabel: "Load (N)", params: p };
}
/** A simplified Charpy-style test: absorbed energy = toughness x an effective volume, reduced below the ductile-to-brittle transition temperature, capped by the pendulum's energy. */
export function impact(m: Material, p: ImpactParams = DEFAULT_IMPACT): ImpactResult {
  const t = tensile(m), toughness = t.toughnessMJm3, e0 = PENDULUM.startEnergyJ, mgL = PENDULUM.massKg * PENDULUM.g * PENDULUM.armM;
  const cold = m.dbttC === undefined ? 1 : 0.08 + 0.92 / (1 + Math.exp(-(p.temperatureC - m.dbttC) / 12)), notch = t.mode === "brittle" ? 0.5 : 1, abs = Math.min(e0, toughness * 1e6 * (PENDULUM.effectiveVolumeMm3 * 1e-9) * notch * cold), rem = e0 - abs, deg = (c: number) => (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
  return { kind: "impact", absorbedJ: abs, remainingJ: rem, startAngleDeg: deg(1 - e0 / mgL), riseAngleDeg: deg(1 - rem / mgL), mode: abs < 0.25 * e0 && t.mode === "brittle" || abs < 10 ? "brittle" : "ductile", passes27J: abs >= 27, params: p };
}
export function simulate(m: Material, kind: TestKind, params?: Partial<BendingParams & ImpactParams>): TestResult { return kind === "tensile" ? tensile(m) : kind === "bending" ? bending(m, { ...DEFAULT_BENDING, ...params }) : impact(m, { ...DEFAULT_IMPACT, ...params }); }
/** Interpolate a curve at a fraction 0..1 of its length (by index), for the animation. */
export function curveAt(c: Curve, f: number) { const n = c.x.length - 1, k = Math.max(0, Math.min(1, f)) * n, i = Math.min(n - 1, Math.floor(k)), u = k - i; return n < 1 ? { x: c.x[0], y: c.y[0], i: 0 } : { x: c.x[i] + (c.x[i + 1] - c.x[i]) * u, y: c.y[i] + (c.y[i + 1] - c.y[i]) * u, i }; }
