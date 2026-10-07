"use client";
import { useEffect, useState } from "react";
import { loadData, base, type Data } from "./data";
import { live, set, state, STORE_KEY, useStore, VIEWS } from "./store";
import { MATERIALS } from "@alchemia/domain";
import Intro from "./ui/Intro";
import Panels from "./ui/Panels";
import Scene from "./scene/Scene";
const webglOk = () => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } };
export default function App() {
  const s = useStore(); const [data, setData] = useState<Data | null>(null); const [err, setErr] = useState("");
  useEffect(() => {
    const q = new URLSearchParams(location.search), rm = matchMedia("(prefers-reduced-motion: reduce)").matches || q.get("motion") === "reduced", view = VIEWS.find((v) => v.id === (q.get("view") ?? location.hash.slice(1)))?.id, skip = q.get("skip") === "1" || !!view, sel = MATERIALS.find((m) => m.id === q.get("material"))?.id;
    loadData().then((d) => {
      let saved: never[] = [], shortlist: string[] = []; try { const st = JSON.parse(localStorage.getItem(STORE_KEY) ?? "null"); saved = Array.isArray(st?.saved) ? st.saved : []; shortlist = Array.isArray(st?.shortlist) ? st.shortlist.filter((i: string) => MATERIALS.some((m) => m.id === i)).slice(0, 8) : []; } catch { /* a corrupted store is ignored */ }
      set({ reduced: rm, pauseMotion: rm, gfx: q.get("gfx") === "off" || !webglOk() ? "poster" : "webgl", saved, shortlist, ...(sel ? { sel } : {}), ...(view ? { view } : {}), ...(skip ? { introDone: true, introStep: 99 } : {}) });
      if (skip) { document.documentElement.style.setProperty("--ui", "1"); Object.assign(live, { heat: 0.1, melt: 0, mode: 0, sphere: 0, split: 1, camT: 1, shake: 0 }); }
      setData(d); }).catch((e) => setErr(String(e)));
  }, []);
  useEffect(() => { const f = () => { const v = VIEWS.find((x) => x.id === location.hash.slice(1)); if (v && v.id !== state.view && state.introDone) set({ view: v.id }); }; addEventListener("hashchange", f); return () => removeEventListener("hashchange", f); }, []);
  if (err) return <div className="boot" role="alert">Could not load data: {err}</div>;
  if (!data) return <div className="boot" role="status">Heating the crucible…</div>;
  return (
    <div className="app" data-view={s.view} data-intro={s.introDone ? "done" : "running"} data-gfx={s.gfx}>
      {s.gfx === "webgl" ? <Scene /> : <div className="poster" style={{ backgroundImage: `url(${base}/posters/specimens.png)` }} role="img" aria-label="Still of a materials test machine with a tensile coupon, a lattice block and a pendulum" data-testid="poster" />}
      <div className="vignette" aria-hidden /><Panels data={data} />{(!s.introDone || s.introFx) && <Intro />}
    </div>
  );
}
