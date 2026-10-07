"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { AXES, MATERIALS } from "@alchemia/domain";
import { fmt } from "../data";
import { live, set, state, useStore } from "../store";

const FINAL = { heat: 0.1, melt: 0, mode: 0, sphere: 0, split: 1, camT: 1, labels: 0, shake: 0 };
const LABELS = ["strength", "thermal", "lightness", "fatigue", "cost", "carbon"].map((id) => { const a = AXES.find((x) => x.id === id)!, v = MATERIALS.map((m) => a.get(m)); return { text: id === "thermal" ? "Thermal conductivity" : id === "lightness" ? "Density" : a.label.replace("Low ", ""), range: `${fmt(Math.min(...v))} to ${fmt(Math.max(...v))} ${a.unit}` }; });
// Steps (blueprint section 3): 0 a dark lab and a metallic sphere, 1 heat softens it to liquid, 2 it pulls into crystals, 3 metal grains, carbon lattice, ceramic microstructure and composite layers, 4 property labels flash, 6 the sphere divides into the constellation and the interface settles around it.
export default function Intro() {
  const s = useStore(), tl = useRef<gsap.core.Timeline | null>(null), [cap, setCap] = useState(""), [label, setLabel] = useState(-1); const root = document.documentElement;
  const finish = () => { tl.current?.kill(); Object.assign(live, FINAL); root.style.setProperty("--ui", "1"); set({ introFx: false, introStep: 99, ...(state.introDone ? {} : { introDone: true }) }); setLabel(-1); setCap(""); }; // never overwrite what the visitor did while the last fade ran
  useEffect(() => {
    if (state.reduced) return; gsap.ticker.lagSmoothing(0);
    Object.assign(live, { heat: 0, melt: 0, mode: 0, sphere: 1, split: 0, camT: 0, labels: 0, shake: 0 }); root.style.setProperty("--ui", "0");
    const t = gsap.timeline({ defaults: { ease: "power1.inOut" }, onComplete: finish }); tl.current = t; const step = (n: number, c = "") => () => { set({ introStep: n }); setCap(c); };
    t.call(step(0, "A dark lab. A sphere of amorphous metal."), [], 0.6).to(live, { heat: 1, duration: 3.2 }, 1.8).to(live, { melt: 1, duration: 3.2 }, 2.2).call(step(1, "Raise the temperature: it softens and runs."), [], 2.0)
      .to(live, { heat: 0.25, duration: 2.2 }, 5.6).to(live, { melt: 0.0, duration: 2.2 }, 5.6).call(step(2, "Cool, and it pulls into crystals."), [], 5.8)
      .call(step(3, "Metal grains."), [], 7.8).to(live, { mode: 1, duration: 1.2 }, 8.4).call(step(3, "A carbon lattice."), [], 9.4).to(live, { mode: 2, duration: 1.2 }, 10.0).call(step(3, "Ceramic microstructure."), [], 11.0).to(live, { mode: 3, duration: 1.2 }, 11.6).call(step(3, "Composite layers."), [], 12.6)
      .call(step(4, ""), [], 13.4);
    LABELS.forEach((_, i) => { t.call(() => setLabel(i), [], 13.5 + i * 0.55); }); t.call(() => setLabel(-1), [], 17.0)
      .call(step(6, "Every material, side by side."), [], 17.0).to(live, { split: 1, duration: 3.2, ease: "power2.inOut" }, 17.2).to(live, { sphere: 0, duration: 1.4 }, 17.6).to(live, { camT: 1, duration: 0.1 }, 17.2)
      .to({ v: 0 }, { v: 1, duration: 2.4, ease: "power2.inOut", onUpdate() { root.style.setProperty("--ui", String(this.targets()[0].v)); } }, 19.0)
      .call(() => { set({ introDone: true, introFx: true, introStep: 99 }); }, [], 21.6);
    return () => { if (!state.introDone) t.kill(); }; // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const skip = () => { const tt = tl.current; if (tt && tt.time() < 17.1) tt.seek(17.1); else finish(); };
  if (s.introDone && !s.introFx) return null;
  if (s.reduced) { const fr = [["A dark lab", "A sphere of amorphous metal."], ["Heat", "It softens, becomes liquid, then pulls into crystals."], ["Microstructure", "Metal grains, a carbon lattice, ceramic and composite layers."], ["Properties", "Strength, thermal conductivity, density, fatigue, cost, carbon."], ["The universe", "The sphere divides into a constellation of materials."]];
    return (<div className="intro intro-static" role="dialog" aria-label="Opening story" data-testid="intro"><ol>{fr.map(([a, b], i) => <li key={i}><b>{a}</b> {b}</li>)}</ol><button className="btn primary" onClick={finish} data-testid="skip-intro">Enter the library</button></div>); }
  return (<div className={`intro ${s.introDone ? "fx" : ""}`} data-testid="intro" data-step={s.introStep}>
    {label >= 0 && <div className="flash" data-testid="statement" key={label}><b>{LABELS[label].text}</b><small>{LABELS[label].range} across {MATERIALS.length} materials</small></div>}<p className="caption" role="status">{cap}</p>{!s.introDone && <div className="intro-btns"><button className="btn skip" onClick={skip} data-testid="skip-intro" autoFocus>Skip intro</button></div>}</div>);
}
