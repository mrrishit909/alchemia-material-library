import type { Shortlist, Weights } from "@alchemia/schemas";
export const MAX_SHORTLIST = 8;
/** Toggle a material in a shortlist, newest last, capped. Returns the list and whether it was added. */
export function toggle(ids: string[], id: string, cap = MAX_SHORTLIST): { ids: string[]; added: boolean; full: boolean } {
  if (ids.includes(id)) return { ids: ids.filter((x) => x !== id), added: false, full: false }; if (ids.length >= cap) return { ids, added: false, full: true }; return { ids: [...ids, id], added: true, full: false };
}
export const makeShortlist = (name: string, ids: string[], weights: Weights, at = new Date().toISOString()): Shortlist => ({ id: `sl${Date.parse(at).toString(36)}${ids.length}`, name: name.trim().slice(0, 60) || "Shortlist", at, ids: [...ids], weights: { ...weights } });
export const validateShortlist = (s: Partial<Shortlist>, known: Set<string>): string | null => { if (!Array.isArray(s.ids) || s.ids.length < 1 || s.ids.length > MAX_SHORTLIST) return `a shortlist holds 1 to ${MAX_SHORTLIST} materials`; const bad = s.ids.find((i) => !known.has(i)); if (bad) return `unknown material "${bad}"`; if (new Set(s.ids).size !== s.ids.length) return "a material can only be on a shortlist once"; return null; };
