export type Family = "Metal" | "Polymer" | "Ceramic" | "Composite" | "Lattice & foam" | "Bio";
export type Material = { id: string; name: string; family: Family; cls: string; densityKgM3: number; tensileMpa: number; modulusGpa: number; conductivityWmK: number; fatigueMpa: number; carbonKgPerKg: number; relativeCost: number; elongationPct: number; maxTempC: number; recyclability: number; dbttC?: number; note: string };
export type Process = { id: string; name: string; blurb: string; constraints: string };
export type Axis = "strength" | "stiffness" | "thermal" | "fatigue" | "lightness" | "carbon" | "cost";
export type Weights = Record<Axis, number>;
export type TestKind = "tensile" | "bending" | "impact";
export type Supplier = { id: string; name: string; region: string; leadWeeks: number; minOrderKg: number; sponsored: boolean };
export type Shortlist = { id: string; name: string; at: string; ids: string[]; weights: Weights };
