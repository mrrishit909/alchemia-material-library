// Manufacturing methods and how suited each synthetic material is to them (0 not possible, 1 ideal). Rules, not data: they follow broad class and ductility.
import type { Material, Process } from "@alchemia/schemas";
import { MATERIALS } from "./materials.ts";
export const PROCESSES: Process[] = [
  { id: "cnc", name: "CNC machining", blurb: "Cut from stock.", constraints: "Hard or brittle materials wear tools." }, { id: "investment-casting", name: "Investment casting", blurb: "Lost-wax metal casting.", constraints: "Castable alloys only." },
  { id: "die-casting", name: "Die casting", blurb: "Molten metal into steel dies.", constraints: "Aluminium, magnesium, zinc families; high tooling cost." }, { id: "forging", name: "Forging", blurb: "Hammered or pressed to shape.", constraints: "Ductile metals (elongation 8 percent or more)." },
  { id: "sheet-forming", name: "Sheet forming", blurb: "Bent and stamped from sheet.", constraints: "Ductile metals (elongation 10 percent or more)." }, { id: "extrusion", name: "Extrusion", blurb: "Pushed through a die.", constraints: "Constant cross-sections." },
  { id: "injection-molding", name: "Injection moulding", blurb: "Melt injected into a mould.", constraints: "Thermoplastics; high tooling cost." }, { id: "am-metal", name: "Additive, metal powder bed", blurb: "Laser melted layer by layer.", constraints: "Weldable powders." },
  { id: "am-polymer", name: "Additive, polymer", blurb: "Sintered or extruded layers.", constraints: "Thermoplastics." }, { id: "composite-layup", name: "Composite layup", blurb: "Fibres and resin cured in a mould.", constraints: "Fibre composites only." },
  { id: "ceramic-sinter", name: "Ceramic sintering", blurb: "Powder pressed and fired.", constraints: "Ceramic powders." }, { id: "timber-working", name: "Timber working and lamination", blurb: "Cut, glued and pressed.", constraints: "Wood and bamboo." },
];
const isMetal = (m: Material) => m.family === "Metal", ductile = (m: Material, pct: number) => m.elongationPct >= pct;
const RULES: Record<string, (m: Material) => number> = {
  cnc: (m) => (isMetal(m) ? (m.cls === "tool-steel" || m.cls === "nickel" ? 0.5 : m.cls === "titanium" ? 0.7 : 0.9) : m.family === "Polymer" ? (m.cls === "elastomer" ? 0.3 : 0.8) : m.family === "Ceramic" ? 0.2 : m.family === "Composite" ? 0.5 : m.family === "Bio" ? 0.9 : 0.1),
  "investment-casting": (m) => (m.cls === "al-wrought" ? (m.id === "al-7075" ? 0.1 : 0.4) : isMetal(m) && m.cls !== "magnesium" ? (m.cls === "cast-iron" || m.cls === "al-cast" || m.cls === "nickel" ? 0.9 : 0.75) : m.cls === "magnesium" ? 0.5 : 0),
  "die-casting": (m) => (m.cls === "al-cast" ? 0.95 : m.cls === "magnesium" ? 0.9 : m.cls === "al-wrought" ? 0.2 : m.id === "brass-c360" ? 0.3 : 0),
  forging: (m) => (isMetal(m) && ductile(m, 8) ? (m.cls === "tool-steel" ? 0.4 : m.cls === "nickel" ? 0.7 : m.cls === "titanium" ? 0.8 : 0.9) : 0),
  "sheet-forming": (m) => (isMetal(m) && ductile(m, 10) ? (m.cls === "titanium" ? 0.5 : m.cls === "nickel" ? 0.3 : 0.85) : 0),
  extrusion: (m) => (m.cls === "al-wrought" ? 0.95 : m.cls === "copper" ? 0.7 : m.cls === "magnesium" ? 0.6 : m.cls === "thermoplastic" ? 0.9 : m.cls === "steel" ? 0.2 : isMetal(m) && ductile(m, 20) ? 0.3 : 0),
  "injection-molding": (m) => (m.cls === "thermoplastic" ? 0.95 : m.cls === "composite-tp" ? 0.9 : m.cls === "peek" ? 0.7 : m.cls === "elastomer" ? 0.6 : 0),
  "am-metal": (m) => (m.id === "ti-64" || m.id === "ti-lattice" || m.id === "ni-718" ? 0.95 : m.cls === "titanium" || m.cls === "stainless" || m.cls === "al-cast" ? 0.85 : m.cls === "tool-steel" || m.cls === "alloy-steel" ? 0.6 : m.cls === "carbon-steel" ? 0.5 : m.cls === "copper" ? 0.3 : m.id === "al-7075" ? 0.2 : 0),
  "am-polymer": (m) => (m.id === "pa66" || m.id === "pa-lattice" ? 0.95 : m.id === "abs" ? 0.8 : m.id === "pa66-gf30" ? 0.7 : m.id === "pc" ? 0.5 : m.id === "peek" ? 0.4 : m.id === "silicone" ? 0.3 : 0),
  "composite-layup": (m) => (m.cls === "composite" ? 0.95 : 0), "ceramic-sinter": (m) => (m.cls === "ceramic" ? 0.95 : m.cls === "glass" ? 0.3 : m.id === "al-foam" ? 0.2 : 0), "timber-working": (m) => (m.cls === "bio" ? 0.95 : 0),
};
export const suitability = (m: Material, processId: string): number => { const r = RULES[processId]; if (!r) throw new RangeError(`unknown process "${processId}"`); return Math.round(r(m) * 100) / 100; };
export const processesFor = (m: Material, min = 0.3) => PROCESSES.map((p) => ({ process: p, suitability: suitability(m, p.id) })).filter((x) => x.suitability >= min).sort((a, b) => b.suitability - a.suitability);
export const materialsFor = (processId: string, min = 0.3, list: Material[] = MATERIALS) => list.filter((m) => suitability(m, processId) >= min);
/** Filter the library by family, process (any of) and a free-text query. */
export function filterMaterials(f: { families?: string[]; processes?: string[]; minSuitability?: number; q?: string }, list: Material[] = MATERIALS): Material[] {
  const q = f.q?.trim().toLowerCase(), min = f.minSuitability ?? 0.3;
  return list.filter((m) => (!f.families?.length || f.families.includes(m.family)) && (!f.processes?.length || f.processes.some((p) => suitability(m, p) >= min)) && (!q || m.name.toLowerCase().includes(q) || m.family.toLowerCase().includes(q) || m.id.includes(q)));
}
