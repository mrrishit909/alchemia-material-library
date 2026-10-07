import type { Material, Process, Shortlist, Weights } from "@alchemia/schemas";
export type MatRow = Material & { suppliers: string[] };
export type Data = { materials: MatRow[]; processes: Process[]; suitability: Record<string, Record<string, number>>; presets: { id: string; label: string; weights: Weights }[]; model: Record<string, any> };
export const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export async function loadData(): Promise<Data> { const g = async <T,>(n: string) => (await fetch(`${base}/data/${n}.json`)).json() as Promise<T>; const [materials, processes, suitability, presets, model] = await Promise.all([g<MatRow[]>("materials"), g<Process[]>("processes"), g<Data["suitability"]>("suitability"), g<Data["presets"]>("presets"), g<Data["model"]>("model")]); return { materials, processes, suitability, presets, model }; }
export const PALETTE = { black: "#0E1114", copper: "#B86E3C", orange: "#FF9A3D", titanium: "#8796A5", ceramic: "#EFEDE5", cobalt: "#315D8C" };
export const FAMILY_COLOR: Record<string, string> = { Metal: PALETTE.titanium, Polymer: PALETTE.orange, Ceramic: PALETTE.ceramic, Composite: PALETTE.cobalt, "Lattice & foam": PALETTE.copper, Bio: "#D9A06B" };
/** How a material looks on the specimen. Display only, not a measurement. */
export function lookFor(m: Material): { color: string; metalness: number; roughness: number; pattern: number } {
  const c = FAMILY_COLOR[m.family];
  switch (m.cls) { case "copper": return { color: PALETTE.copper, metalness: 1, roughness: 0.3, pattern: 0 }; case "titanium": return { color: "#9aa3ad", metalness: 1, roughness: 0.38, pattern: 0 }; case "ceramic": case "glass": return { color: m.cls === "glass" ? "#bcd6dc" : PALETTE.ceramic, metalness: 0, roughness: m.cls === "glass" ? 0.08 : 0.45, pattern: 0 }; case "composite": return { color: "#161a1f", metalness: 0.2, roughness: 0.35, pattern: 1 }; case "bio": return { color: "#b98a58", metalness: 0, roughness: 0.7, pattern: 2 }; default: return m.family === "Metal" ? { color: c, metalness: 1, roughness: 0.32, pattern: 0 } : { color: c, metalness: 0, roughness: 0.55, pattern: 0 }; }
}
export const fmt = (x: number) => (Math.abs(x) >= 100 ? Math.round(x).toLocaleString("en-US") : Math.abs(x) >= 10 ? (Math.round(x * 10) / 10).toString() : (Math.round(x * 100) / 100).toString());
export type SavedList = Shortlist;
