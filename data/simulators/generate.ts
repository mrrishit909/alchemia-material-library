// Deterministic synthetic data: the material library, processes with suitability, presets and the measured model. Run: node data/simulators/generate.ts
import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { MATERIALS, PRESETS, PROCESSES, suitability, suppliersFor, footprints } from "../../packages/domain/src/index.ts";
const root = new URL("../../", import.meta.url).pathname, out = root + "data/generated/";
mkdirSync(out, { recursive: true });
writeFileSync(out + "materials.json", JSON.stringify(MATERIALS.map((m) => ({ ...m, suppliers: suppliersFor(m).map((s) => s.id) })))); writeFileSync(out + "processes.json", JSON.stringify(PROCESSES));
writeFileSync(out + "suitability.json", JSON.stringify(Object.fromEntries(MATERIALS.map((m) => [m.id, Object.fromEntries(PROCESSES.map((p) => [p.id, suitability(m, p.id)]))])))); writeFileSync(out + "presets.json", JSON.stringify(PRESETS));
writeFileSync(out + "footprints.json", JSON.stringify(footprints().map((f) => ({ ...f, sideMm: Math.round(f.sideMm * 10) / 10, massKg: Math.round(f.massKg * 1000) / 1000, carbonKg: Math.round(f.carbonKg * 1000) / 1000, costSteelKg: Math.round(f.costSteelKg * 1000) / 1000, sectionMm2: Math.round(f.sectionMm2) }))));
cpSync(root + "model/exports/analysis.json", out + "model.json");
console.log("generated", MATERIALS.length, "materials,", PROCESSES.length, "processes");
