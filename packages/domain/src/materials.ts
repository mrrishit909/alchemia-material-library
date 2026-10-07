// Synthetic, realistic-looking material records: rounded, handbook-order numbers for a demo. NOT datasheet values and not for design use; a real deployment would ingest licensed or supplier data.
import type { Family, Material, Supplier } from "@alchemia/schemas";
type Row = [string, string, Family, string, number, number, number, number, number, number, number, number, number, number, string, number?];
//   id, name, family, class, density kg/m3, tensile MPa, modulus GPa, conductivity W/mK, fatigue MPa, carbon kgCO2e/kg, cost (mild steel = 1), elongation %, max temp C, recyclability 0..1, note, DBTT C
const ROWS: Row[] = [
  ["steel-1020", "Carbon steel 1020", "Metal", "carbon-steel", 7850, 420, 205, 51, 210, 1.9, 1, 25, 400, 0.9, "General purpose structural steel.", -20],
  ["steel-4140", "Alloy steel 4140 (Q&T)", "Metal", "alloy-steel", 7850, 1000, 205, 42, 480, 2.4, 1.8, 14, 450, 0.9, "Quenched and tempered shafts and gears.", -30],
  ["ss-304", "Stainless steel 304", "Metal", "stainless", 8000, 580, 193, 16, 260, 6.1, 4.2, 45, 800, 0.85, "Austenitic, corrosion resistant, tough at low temperature."],
  ["ss-17-4", "Stainless steel 17-4 PH", "Metal", "stainless", 7800, 1100, 197, 18, 520, 6.5, 6, 12, 450, 0.85, "Precipitation hardened, strong and corrosion resistant."],
  ["tool-a2", "Tool steel A2", "Metal", "tool-steel", 7860, 1800, 203, 24, 700, 3, 5, 6, 450, 0.85, "Air hardening die steel.", 0],
  ["iron-grey", "Grey cast iron", "Metal", "cast-iron", 7100, 250, 110, 46, 100, 1.6, 0.9, 1, 350, 0.9, "Damps vibration, brittle in tension.", 40],
  ["al-6061", "Aluminium 6061-T6", "Metal", "al-wrought", 2700, 310, 69, 167, 95, 8.2, 2.8, 12, 150, 0.95, "The workhorse extrusion and plate alloy."],
  ["al-7075", "Aluminium 7075-T6", "Metal", "al-wrought", 2810, 570, 72, 130, 160, 8.6, 4, 11, 120, 0.95, "Aerospace strength, poor weldability."],
  ["al-5083", "Aluminium 5083", "Metal", "al-wrought", 2660, 300, 71, 117, 150, 8, 3, 17, 100, 0.95, "Marine plate, weldable."],
  ["al-a356", "Aluminium A356 casting", "Metal", "al-cast", 2680, 260, 72, 150, 80, 7, 2.5, 5, 180, 0.95, "Sand and permanent mould castings."],
  ["ti-64", "Titanium Ti-6Al-4V", "Metal", "titanium", 4430, 950, 114, 6.7, 510, 35, 40, 14, 350, 0.8, "Aerospace and implants; strong, light, costly."],
  ["ti-cp2", "Titanium grade 2", "Metal", "titanium", 4510, 345, 105, 16, 240, 30, 25, 25, 300, 0.8, "Commercially pure, corrosion resistant."],
  ["mg-az31", "Magnesium AZ31B", "Metal", "magnesium", 1770, 260, 45, 96, 120, 20, 5, 12, 120, 0.8, "The lightest structural metal."],
  ["cu-c110", "Copper C110", "Metal", "copper", 8940, 220, 117, 390, 90, 3.8, 8, 45, 200, 0.95, "Electrical and thermal conductor."],
  ["brass-c360", "Brass C360", "Metal", "copper", 8500, 360, 97, 115, 140, 4.5, 7, 25, 200, 0.95, "Free machining."],
  ["bronze-c932", "Bronze C932", "Metal", "copper", 7600, 310, 100, 59, 120, 4, 9, 18, 250, 0.9, "Bearing bronze."],
  ["ni-718", "Nickel alloy 718", "Metal", "nickel", 8190, 1240, 200, 11, 600, 12, 70, 12, 700, 0.8, "High temperature superalloy."],
  ["abs", "ABS", "Polymer", "thermoplastic", 1050, 40, 2.3, 0.17, 12, 3.8, 3, 25, 80, 0.2, "Tough, easy to mould and print.", -20],
  ["pc", "Polycarbonate", "Polymer", "thermoplastic", 1200, 65, 2.4, 0.2, 15, 6, 5, 100, 120, 0.25, "Clear, very tough.", -40],
  ["pa66", "Nylon 66", "Polymer", "thermoplastic", 1140, 80, 2.9, 0.25, 20, 8, 4.5, 40, 120, 0.2, "Wear resistant, absorbs moisture."],
  ["hdpe", "HDPE", "Polymer", "thermoplastic", 950, 28, 1, 0.45, 8, 1.9, 1.5, 600, 80, 0.5, "Cheap, tough, chemical resistant.", -100],
  ["peek", "PEEK", "Polymer", "peek", 1300, 100, 3.6, 0.25, 25, 45, 90, 40, 250, 0.1, "High performance, high temperature."],
  ["ptfe", "PTFE", "Polymer", "ptfe", 2200, 25, 0.5, 0.25, 6, 11, 18, 300, 260, 0.1, "Lowest friction, creeps."],
  ["pom", "Acetal (POM)", "Polymer", "thermoplastic", 1410, 70, 3.1, 0.31, 20, 4.5, 4, 40, 100, 0.2, "Stiff, low friction gears."],
  ["silicone", "Silicone rubber", "Polymer", "elastomer", 1150, 8, 0.01, 0.25, 2, 6, 10, 400, 200, 0.05, "Soft, heat resistant elastomer."],
  ["alumina", "Alumina 99%", "Ceramic", "ceramic", 3900, 300, 370, 30, 150, 1.6, 7, 0.1, 1600, 0.1, "Hard, insulating, wear resistant."],
  ["sic", "Silicon carbide", "Ceramic", "ceramic", 3100, 400, 410, 120, 200, 5, 30, 0.1, 1600, 0.1, "Very hard, conducts heat."],
  ["zirconia", "Zirconia (Y-TZP)", "Ceramic", "ceramic", 6050, 800, 210, 2.5, 350, 4, 25, 0.4, 1000, 0.1, "The toughest of the oxide ceramics."],
  ["si3n4", "Silicon nitride", "Ceramic", "ceramic", 3200, 700, 300, 30, 300, 6, 50, 0.2, 1200, 0.1, "Bearings and turbines."],
  ["borosilicate", "Borosilicate glass", "Ceramic", "glass", 2230, 70, 63, 1.1, 30, 1.3, 2, 0.1, 500, 0.7, "Low thermal expansion glass."],
  ["porcelain", "Porcelain", "Ceramic", "ceramic", 2400, 60, 70, 1.5, 30, 0.9, 1.5, 0.1, 1000, 0.1, "Fired clay body."],
  ["cfrp-qi", "CFRP quasi-isotropic", "Composite", "composite", 1550, 600, 70, 5, 280, 25, 60, 1.2, 150, 0.05, "Carbon fibre and epoxy, layers in four directions."],
  ["cfrp-ud", "CFRP unidirectional", "Composite", "composite", 1600, 1500, 135, 6, 700, 28, 70, 1.5, 150, 0.05, "Strongest along the fibres."],
  ["gfrp", "GFRP E-glass", "Composite", "composite", 1900, 400, 25, 0.5, 100, 3.5, 6, 2, 120, 0.05, "Glass fibre and epoxy."],
  ["afrp", "Aramid composite", "Composite", "composite", 1380, 1100, 60, 0.5, 350, 14, 45, 2, 150, 0.05, "Tough, impact tolerant."],
  ["bfrp", "Basalt fibre composite", "Composite", "composite", 2000, 500, 38, 0.6, 130, 3, 8, 1.8, 150, 0.05, "Volcanic rock fibres."],
  ["pa66-gf30", "Nylon 66 GF30", "Composite", "composite-tp", 1370, 180, 8.5, 0.35, 55, 5.5, 5, 3, 150, 0.2, "Glass filled, mouldable."],
  ["al-foam", "Aluminium foam", "Lattice & foam", "foam", 450, 12, 1.5, 12, 5, 8, 20, 10, 250, 0.9, "Closed cell, absorbs impact."],
  ["ti-lattice", "Ti-6Al-4V lattice (printed)", "Lattice & foam", "lattice-metal", 900, 120, 8, 0.7, 60, 55, 120, 4, 350, 0.8, "20 percent relative density, printed."],
  ["pa-lattice", "Nylon lattice (printed)", "Lattice & foam", "lattice-polymer", 300, 8, 0.4, 0.05, 2, 9, 12, 8, 90, 0.2, "25 percent relative density, printed."],
  ["pu-foam", "Rigid PU foam", "Lattice & foam", "foam", 60, 1, 0.05, 0.03, 0.4, 4, 3, 3, 90, 0.05, "Insulating core material."],
  ["bamboo", "Laminated bamboo", "Bio", "bio", 700, 120, 12, 0.25, 40, 0.5, 2, 2, 100, 0.6, "Fast growing, strong along the grain."],
  ["oak", "Oak", "Bio", "bio", 700, 90, 12, 0.17, 30, 0.4, 3, 2, 100, 0.6, "Hardwood, along the grain."],
  ["clt", "Spruce cross-laminated", "Bio", "bio", 450, 30, 11, 0.12, 12, 0.4, 2, 2, 90, 0.6, "Engineered timber panel."],
];
export const MATERIALS: Material[] = ROWS.map(([id, name, family, cls, d, u, e, k, f, c, cost, el, t, rc, note, dbtt]) => ({ id, name, family, cls, densityKgM3: d, tensileMpa: u, modulusGpa: e, conductivityWmK: k, fatigueMpa: f, carbonKgPerKg: c, relativeCost: cost, elongationPct: el, maxTempC: t, recyclability: rc, note, ...(dbtt === undefined ? {} : { dbttC: dbtt }) }));
export const FAMILIES: Family[] = ["Metal", "Polymer", "Ceramic", "Composite", "Lattice & foam", "Bio"];
export const material = (id: string): Material => { const m = MATERIALS.find((x) => x.id === id); if (!m) throw new RangeError(`unknown material "${id}"`); return m; };
// ---- synthetic suppliers: invented names; exactly one is flagged as sponsored, and the interface labels it
const SUP: Supplier[] = [
  { id: "halden", name: "Halden Metals", region: "Nordic", leadWeeks: 3, minOrderKg: 25, sponsored: true }, { id: "meridian", name: "Meridian Polymers", region: "EU", leadWeeks: 2, minOrderKg: 10, sponsored: false },
  { id: "kiln", name: "Kiln & Co. Technical Ceramics", region: "EU", leadWeeks: 6, minOrderKg: 5, sponsored: false }, { id: "fibrelab", name: "Fibrelab Composites", region: "US", leadWeeks: 5, minOrderKg: 8, sponsored: false },
  { id: "granite", name: "Granite Bay Alloys", region: "US", leadWeeks: 4, minOrderKg: 50, sponsored: false }, { id: "lattice", name: "Voxel Works (additive)", region: "Asia", leadWeeks: 2, minOrderKg: 1, sponsored: false }, { id: "timber", name: "Sylva Engineered Timber", region: "EU", leadWeeks: 3, minOrderKg: 100, sponsored: false },
];
export const suppliersFor = (m: Material): Supplier[] => { const by = (...ids: string[]) => ids.map((i) => SUP.find((s) => s.id === i)!); switch (m.family) { case "Metal": return by("halden", "granite"); case "Polymer": return by("meridian", "granite"); case "Ceramic": return by("kiln", "granite"); case "Composite": return by("fibrelab", "meridian"); case "Lattice & foam": return by("lattice", "halden"); default: return by("timber", "meridian"); } };
