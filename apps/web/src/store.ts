import { useSyncExternalStore } from "react";
import type { Shortlist, TestKind, Weights } from "@alchemia/schemas";
import { ALL_ONES, type TestResult } from "@alchemia/domain";
export type View = "universe" | "compare" | "test" | "process" | "footprint" | "detail";
export const VIEWS: { id: View; label: string; blurb: string }[] = [
  { id: "universe", label: "Universe", blurb: "Constellation and weights" }, { id: "compare", label: "Compare", blurb: "Radar and table" }, { id: "test", label: "Test chamber", blurb: "Tensile, bending, impact" },
  { id: "process", label: "Processes", blurb: "How it can be made" }, { id: "footprint", label: "Footprint", blurb: "Mass, carbon, cost" }, { id: "detail", label: "Detail", blurb: "Datasheet and suppliers" },
];
export type TestState = { kind: TestKind; bendSpan: number; bendThickness: number; temperature: number; vs: string; phase: "idle" | "entering" | "running" | "done"; t: number; result: TestResult | null; resultVs: TestResult | null; magnification: number };
export type State = {
  view: View; weights: Weights; preset: string; sel: string; compareIds: string[]; families: string[]; processes: string[]; q: string; shortlist: string[]; saved: Shortlist[]; test: TestState; fpMetric: "massKg" | "carbonKg" | "costSteelKg"; flash: string;
  introDone: boolean; introFx: boolean; introStep: number; reduced: boolean; pauseMotion: boolean; gfx: "webgl" | "poster";
};
export const state: State = { view: "universe", weights: { ...ALL_ONES }, preset: "balanced", sel: "al-6061", compareIds: ["steel-1020", "al-6061", "alumina", "cfrp-qi"], families: [], processes: [], q: "", shortlist: [], saved: [], test: { kind: "tensile", bendSpan: 64, bendThickness: 4, temperature: 20, vs: "alumina", phase: "idle", t: 0, result: null, resultVs: null, magnification: 1 }, fpMetric: "carbonKg", flash: "", introDone: false, introFx: false, introStep: 0, reduced: false, pauseMotion: false, gfx: "webgl" };
/** Per-frame values the intro and the canvas read; not reactive. */
export const live = { heat: 0, melt: 0, mode: 0, sphere: 1, split: 1, camT: 1, testT: 0, enter: 0, labels: 0, shake: 0, hero: 1, curve: null as TestResult | null };
let snap = { ...state }; const subs = new Set<() => void>();
export function set(p: Partial<State>) { Object.assign(state, p); snap = { ...state }; subs.forEach((f) => f()); }
export const useStore = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => snap, () => snap);
export const STORE_KEY = "alchemia:v1";
export const persist = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify({ saved: state.saved, shortlist: state.shortlist })); } catch { /* storage may be blocked */ } };
