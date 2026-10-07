"use client";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MATERIALS, curveAt, filterMaterials, layout, material, rank } from "@alchemia/domain";
import { base, FAMILY_COLOR, lookFor, PALETTE } from "../data";
import { live, set, state, useStore } from "../store";

const C0 = new THREE.Vector3(-1.2, 2.4, 0), MACHINE = new THREE.Vector3(5.4, 0, 0), PEND = new THREE.Vector3(5.4 + 3.4, 0, 0), SCALE = 2.4;
const GLSL_NOISE = `float h31(vec3 p){ p = fract(p*vec3(.1031,.1030,.0973)); p += dot(p, p.yxz+33.33); return fract((p.x+p.y)*p.z); }
float vn(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x), mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x), f.y), mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x), mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x), f.y), f.z); }`;
const ss = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const PAT = { value: 0 };   // 0 plain, 1 twill weave (composites), 2 wood grain (bio): shared by every specimen material
// ---- specimen materials: one look, three deformation behaviours (a coupon that stretches, necks and breaks; a bar that bends and breaks)
function specimenMat(kind: "coupon" | "bar" | "plain") {
  const m = new THREE.MeshPhysicalMaterial({ color: "#8796A5", metalness: 1, roughness: 0.32 }), u = { uStrain: { value: 0 }, uNeck: { value: 0 }, uBreak: { value: 0 }, uYn: { value: 0.1 }, uGap: { value: 0.14 }, uDelta: { value: 0 }, uHalf: { value: 1 }, uGapB: { value: 0.12 } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u, { uPat: PAT });
    sh.vertexShader = "uniform float uStrain, uNeck, uBreak, uYn, uGap, uDelta, uHalf, uGapB; varying float vSide; varying vec3 vLp;\n" + sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
      vLp = position; vSide = 1.0;
      ${kind === "coupon" ? `float yy = transformed.y; float nw = exp(-pow((yy - uYn)/0.14, 2.0)); float up = step(uYn, yy);
        float rs = (1.0 - uNeck*0.62*nw) * mix(1.0, 0.45, uBreak*exp(-pow((yy - uYn)/0.05, 2.0)));
        transformed.xz *= rs; transformed.y = (yy + 0.5)*(1.0 + uStrain) - 0.5 + uBreak*up*uGap; vSide = uBreak > 0.5 ? (up > 0.5 ? 1.0 : -1.0) : 1.0;` : ""}
      ${kind === "bar" ? `float X = transformed.x; float s = clamp(1.0 - abs(X)/uHalf, 0.0, 1.0); transformed.y -= uDelta*0.5*s*(3.0 - s*s); float sd = X >= 0.0 ? 1.0 : -1.0;
        transformed.x += uBreak*sd*uGapB*0.5; transformed.y -= uBreak*0.06*abs(X); vSide = uBreak > 0.5 ? sd : 1.0;` : ""}`);
    sh.fragmentShader = "uniform float uPat; varying float vSide; varying vec3 vLp;\n" + sh.fragmentShader.replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\nif (abs(vSide) < 0.9) discard;").replace("#include <color_fragment>", `#include <color_fragment>
      if (uPat > 0.5 && uPat < 1.5) { float t = fract((vLp.x + vLp.y + vLp.z)*16.0); float w = step(0.5, fract(vLp.x*22.0)) + step(0.5, fract(vLp.z*22.0)); diffuseColor.rgb *= 0.5 + 0.7*step(0.5, t) + 0.25*w; }
      if (uPat > 1.5) { diffuseColor.rgb *= 0.72 + 0.38*sin(vLp.x*55.0 + sin(vLp.y*9.0 + vLp.z*7.0)*3.0); }`);
  };
  m.customProgramCacheKey = () => `alchemia-${kind}`; return { m, u };
}
// ---- the matter sphere of the intro: heat, melt and four microstructures in one shader
function Matter() {
  const mat = useRef<THREE.ShaderMaterial>(null), u = useMemo(() => ({ uTime: { value: 0 }, uHeat: { value: 0 }, uMelt: { value: 0 }, uMode: { value: 0 }, uScale: { value: 1 } }), []);
  useFrame(({ clock }) => { const U = mat.current?.uniforms ?? u; U.uTime.value = state.pauseMotion ? U.uTime.value : clock.elapsedTime; U.uHeat.value = live.heat; U.uMelt.value = live.melt; U.uMode.value = live.mode; U.uScale.value = state.introDone ? 0 : live.sphere; });
  if (state.introDone && !state.introFx) return null;
  return (<mesh position={C0} renderOrder={2}><icosahedronGeometry args={[1.1, 6]} /><shaderMaterial ref={mat} uniforms={u} transparent vertexShader={`uniform float uTime, uMelt, uScale; varying vec3 vP; varying vec3 vN; ${GLSL_NOISE}
      void main(){ vec3 p = position; float n = vn(p*1.7 + vec3(0.0, uTime*(0.12+0.5*uMelt), 0.0))*0.6 + vn(p*3.4 - uTime*0.2)*0.3; p *= 1.0 + (n-0.45)*uMelt*0.55 + sin(p.y*5.0 + uTime*2.2)*0.04*uMelt; p.y -= uMelt*0.2*(1.0 + position.y); p *= uScale; vP = position; vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0); }`}
    fragmentShader={`uniform float uTime, uHeat, uMelt, uMode; varying vec3 vP; varying vec3 vN; ${GLSL_NOISE}
      float vor(vec3 p){ vec3 i=floor(p), f=fract(p); float d=1.0, d2=1.0; for(int x=-1;x<=1;x++) for(int y=-1;y<=1;y++) for(int z=-1;z<=1;z++){ vec3 g=vec3(float(x),float(y),float(z)); vec3 o=vec3(h31(i+g), h31(i+g+7.1), h31(i+g+13.7)); float r=length(g+o-f); if(r<d){ d2=d; d=r; } else if(r<d2){ d2=r; } } return d2-d; }
      void main(){ vec3 n = normalize(vN); float L = max(dot(n, normalize(vec3(-0.5,0.8,0.6))), 0.0), rim = pow(1.0-max(dot(n, vec3(0,0,1)),0.0), 2.5);
        vec3 ti = vec3(0.53,0.59,0.65), cu = vec3(0.72,0.43,0.24), mo = vec3(1.0,0.6,0.24), wh = vec3(1.0,0.95,0.85);
        vec3 base = uHeat < 0.45 ? mix(ti, cu, uHeat/0.45) : uHeat < 0.8 ? mix(cu, mo, (uHeat-0.45)/0.35) : mix(mo, wh, (uHeat-0.8)/0.2);
        float g = vor(vP*3.2), grain = smoothstep(0.0, 0.08, g);
        vec3 q = vP*5.0; float hex = abs(sin(q.x*3.1416)) * abs(sin((q.x*0.5 + q.y*0.866)*3.1416)) * abs(sin((q.x*0.5 - q.y*0.866)*3.1416)); float lat = smoothstep(0.35, 0.0, hex) ;
        float cer = smoothstep(0.0, 0.05, vor(vP*7.0)); float pore = smoothstep(0.62, 0.7, vn(vP*11.0));
        float lay = 0.5 + 0.5*sin(vP.y*16.0 + vn(vP*3.0)*2.0); float tw = step(0.5, fract((vP.x+vP.z)*14.0));
        float m = uMode; vec3 col = base;
        float w0 = 1.0 - ss(0.0, 1.0, m), w1 = ss(0.0,1.0,m) * (1.0 - ss(1.0,2.0,m)), w2 = ss(1.0,2.0,m) * (1.0 - ss(2.0,3.0,m)), w3 = ss(2.0,3.0,m);
        vec3 c0 = base*(0.55 + 0.45*grain) + (1.0-grain)*0.05, c1 = mix(vec3(0.05,0.06,0.07), vec3(0.85,0.9,0.95), lat) * (0.6 + 0.4*L), c2 = mix(vec3(0.93,0.92,0.88), vec3(0.45,0.44,0.42), cer*0.0 + (1.0-cer)) * (1.0 - 0.6*pore), c3 = mix(vec3(0.19,0.36,0.55), vec3(0.06,0.07,0.08), step(0.5,lay)) * (0.75 + 0.25*tw);
        vec3 pat = c0*w0 + c1*w1 + c2*w2 + c3*w3; float pm = smoothstep(0.0, 0.7, 1.0 - uMelt) * (m > 0.001 ? 1.0 : 0.0);
        col = mix(base, pat, pm * (1.0 - uHeat*0.6)); col *= 0.35 + 0.8*L + 0.5*rim; col += mo*uHeat*0.55*(0.5+0.5*rim);
        gl_FragColor = vec4(col, 1.0); }`.replace(/ss\(/g, "smoothstep(")} /></mesh>);
}
// ---- the constellation
function Stars() {
  const s = useStore(), mesh = useRef<THREE.InstancedMesh>(null), cur = useRef<THREE.Vector3[]>([]), targets = useMemo(() => layout(s.weights), [s.weights]), ranked = useMemo(() => new Set(rank(s.weights).slice(0, 5).map((r) => r.m.id)), [s.weights]), vis = useMemo(() => new Set(filterMaterials({ families: s.families, processes: s.processes, q: s.q }).map((m) => m.id)), [s.families, s.processes, s.q]);
  const sph = useMemo(() => MATERIALS.map((_, i) => { const y = 1 - (2 * (i + 0.5)) / MATERIALS.length, r = Math.sqrt(1 - y * y), a = i * 2.39996; return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r).multiplyScalar(1.1); }), []);
  const m4 = useMemo(() => new THREE.Matrix4(), []), col = useMemo(() => new THREE.Color(), []), q = useMemo(() => new THREE.Quaternion(), []);
  useFrame(({ clock }, dt) => {
    const im = mesh.current; if (!im) return; if (!cur.current.length) cur.current = MATERIALS.map((_, i) => sph[i].clone().add(C0)); const k = state.reduced ? 1 : 1 - Math.exp(-dt * 3);
    const cmp = state.view === "compare" ? new Set(state.compareIds) : null, sl = new Set(state.shortlist), fp = state.view === "footprint";
    MATERIALS.forEach((m, i) => {
      const t = targets[m.id], goal = new THREE.Vector3(t[0] * SCALE, t[1] * SCALE, t[2] * SCALE).add(C0), p = cur.current[i], sp = state.introDone ? 1 : ss(0, 1, live.split);
      const own = new THREE.Vector3().lerpVectors(sph[i].clone().add(C0), goal, sp); if (state.introDone) p.lerp(goal, k); else p.copy(own);
      const selected = m.id === state.sel, flying = selected && live.enter > 0.02, shown = vis.has(m.id), sc = !shown ? 0.35 : (selected ? 1.9 : sl.has(m.id) ? 1.5 : ranked.has(m.id) ? 1.4 : 1) * (cmp ? (cmp.has(m.id) ? 1.6 : 0.6) : 1) * (fp && sl.size >= 2 && !sl.has(m.id) ? 0.6 : 1) * (1 + 0.08 * Math.sin(clock.elapsedTime * 2 + i) * (state.pauseMotion ? 0 : 1));
      m4.compose(p, q, new THREE.Vector3(1, 1, 1).multiplyScalar(flying ? 0.0001 : sc * (0.05 + 0.95 * ss(0, 0.3, state.introDone ? 1 : live.split)))); im.setMatrixAt(i, m4);
      col.set(FAMILY_COLOR[m.family]); if (!shown) col.multiplyScalar(0.25); else if (selected) col.lerp(new THREE.Color("#ffffff"), 0.4); im.setColorAt(i, col);
    }); im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; (window as unknown as { __aStars: () => number[][] }).__aStars = () => cur.current.map((v) => [v.x, v.y, v.z]);
  });
  return <instancedMesh ref={mesh} args={[undefined, undefined, MATERIALS.length]} frustumCulled={false} renderOrder={3} onClick={(e) => { if (!state.introDone || e.instanceId === undefined || state.view === "test") return; e.stopPropagation(); set({ sel: MATERIALS[e.instanceId].id }); }}><sphereGeometry args={[0.11, 18, 14]} /><meshStandardMaterial roughness={0.35} metalness={0.1} emissive="#ffffff" emissiveIntensity={0.06} /></instancedMesh>;
}
// ---- the machine, the pendulum and the specimens (from the Blender kit)
function Rig3D() {
  const s = useStore(), gltf = useLoader(GLTFLoader, `${base}/models/specimens.glb`), g = useRef<THREE.Group>(null), pend = useRef<THREE.Group>(null), disp = useRef<{ c: HTMLCanvasElement; t: THREE.CanvasTexture } | null>(null);
  const R = useMemo(() => {
    const get = (n: string) => gltf.scene.getObjectByName(n)!, machine = get("Machine").clone(true), pendulum = get("Pendulum").clone(true), coupon = get("Coupon").clone(true), bar = get("Bar").clone(true), impBar = get("Bar").clone(true), lattice = get("Lattice").clone(true), panel = get("Panel").clone(true);
    const gauge = specimenMat("coupon"), barM = specimenMat("bar"), impM = specimenMat("bar"), plain = specimenMat("plain"), steel = new THREE.MeshStandardMaterial({ color: "#8796A5", metalness: 1, roughness: 0.35 });
    coupon.traverse((o) => { const m = o as THREE.Mesh; if (!m.isMesh) return; m.material = o.name === "Coupon_Gauge" ? gauge.m : steel; }); bar.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.material = barM.m; }); impBar.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.material = impM.m; });
    [lattice, panel].forEach((r) => r.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.material = plain.m; }));
    const dispMesh = machine.getObjectByName("Machine_Display") as THREE.Mesh, c = document.createElement("canvas"); c.width = 256; c.height = 160; const tex = new THREE.CanvasTexture(c); dispMesh.material = new THREE.MeshBasicMaterial({ map: tex }); tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false; disp.current = { c, t: tex };
    const hero = new THREE.Group(); const hc = coupon.clone(true), hb = bar.clone(true), hl = lattice.clone(true), hp = panel.clone(true); hero.add(hc, hb, hl, hp);
    return { machine, pendulum, coupon, bar, impBar, lattice, panel, gauge, barM, impM, plain, hero, hc, hb, hl, hp, parts: { cross: machine.getObjectByName("Machine_Crosshead")!, gripU: machine.getObjectByName("Machine_GripUpper")!, cell: machine.getObjectByName("Machine_LoadCell")!, needle: machine.getObjectByName("Machine_Needle")!, nose: machine.getObjectByName("Rig_Nose")!, anvils: ["Rig_Anvil_L", "Rig_Anvil_R"].map((n) => machine.getObjectByName(n)!), arm: pendulum.getObjectByName("Pendulum_Arm")!, plies: Array.from({ length: 6 }, (_, i) => panel.getObjectByName(`Panel_Ply_${i}`)!) } };
  }, [gltf]);
  const look = useMemo(() => ({ color: new THREE.Color("#8796A5"), metalness: 1, roughness: 0.32 }), []);
  useEffect(() => { const l = lookFor(material(s.sel)); (look as any).target = l; PAT.value = l.pattern; }, [s.sel, look]);
  useEffect(() => { R.machine.position.copy(MACHINE); R.pendulum.position.copy(PEND); }, [R]);
  useFrame(({ clock }, dt) => {
    const t = state.test, kind = t.kind, inTest = state.view === "test", target = inTest && t.phase !== "idle" ? 1 : 0, k = state.reduced ? 1 : 1 - Math.exp(-dt * (target ? 2.2 : 1.6)); live.enter += (target - live.enter) * k; if (Math.abs(target - live.enter) < 0.001) live.enter = target;
    const L = (look as any).target, e = ss(0, 1, live.enter);
    if (L) { const c = new THREE.Color(L.color); for (const m of [R.gauge.m, R.barM.m, R.impM.m, R.plain.m]) { m.color.lerp(c, 0.12); m.metalness += (L.metalness - m.metalness) * 0.12; m.roughness += (L.roughness - m.roughness) * 0.12; } }
    const r = t.result, f = live.testT, base = state.introDone ? 1 : 0;
    // where the specimen is: at the star (entering), in the machine (tensile/bending) or on the pendulum's table (impact)
    const star = new THREE.Vector3(...(layout(state.weights)[state.sel].map((v) => v * SCALE) as [number, number, number])).add(C0);
    const mount = kind === "tensile" ? MACHINE.clone().add(new THREE.Vector3(0, 2.15, 0)) : kind === "bending" ? MACHINE.clone().add(new THREE.Vector3(0, 1.3, 0)) : PEND.clone().add(new THREE.Vector3(0.15, 1.13, 0));
    const pos = new THREE.Vector3().lerpVectors(star, mount, e); pos.y += Math.sin(e * Math.PI) * 1.4; const sc = ss(0, 0.25, e) * (0.15 + 0.85 * e);
    const showCoupon = kind === "tensile" && e > 0.01, showBar = kind === "bending" && e > 0.01, showImp = kind === "impact" && e > 0.01;
    R.coupon.visible = showCoupon && base > 0; R.coupon.position.copy(pos); R.coupon.scale.setScalar(sc); R.coupon.rotation.set(0, e * Math.PI * 2 * (1 - e) * 0 + (1 - e) * 3, (1 - e) * 1.2);
    R.bar.visible = showBar && base > 0; R.bar.position.copy(pos); R.bar.scale.setScalar(sc); R.bar.rotation.set((1 - e) * 1.5, (1 - e) * 2, 0);
    R.impBar.visible = showImp && base > 0; R.impBar.position.copy(pos); R.impBar.scale.setScalar(sc * 0.2); R.impBar.rotation.set(0, Math.PI / 2, 0);
    const P = R.parts, rest = 3.7, mag = t.magnification; let crossDy = 0, needle = -2.3, gx = 0, gy = 0, brk = 0;
    if (r && r.kind === "tensile" && kind === "tensile" && t.phase !== "idle") { const p = curveAt(r.curve, f), st = (p.x / 100) * mag, afterUts = ss(r.strainAtUtsPct, Math.max(r.strainAtUtsPct + 1e-6, r.fractureStrainPct), p.x); R.gauge.u.uStrain.value = st; R.gauge.u.uNeck.value = r.mode === "ductile" ? afterUts * Math.min(1, r.necking + 0.2) : 0; R.gauge.u.uBreak.value = f >= 0.999 ? 1 : 0; R.gauge.u.uYn.value = 0.08; crossDy = st; needle = -2.3 + (p.y / Math.max(1, r.utsMpa)) * 4.6; gx = p.x; gy = p.y; brk = f >= 0.999 ? 1 : 0; }
    else { R.gauge.u.uStrain.value = 0; R.gauge.u.uNeck.value = 0; R.gauge.u.uBreak.value = 0; }
    if (r && r.kind === "bending" && kind === "bending" && t.phase !== "idle") { const p = curveAt(r.curve, f), dU = p.x * (2 / r.params.spanMm) * mag; R.barM.u.uDelta.value = dU; R.barM.u.uBreak.value = r.mode === "brittle" && f >= 0.999 ? 1 : 0; crossDy = -(2.7 - rest) * 0 - dU - (rest - 2.7) * e; needle = -2.3 + (p.y / Math.max(1, r.maxLoadN)) * 4.6; gx = p.x; gy = p.y; brk = R.barM.u.uBreak.value; }
    else R.barM.u.uDelta.value = 0, R.barM.u.uBreak.value = 0;
    for (const o of [R.parts.cross, R.parts.gripU, R.parts.cell]) o.position.y = (o.userData.y0 ??= o.position.y) + crossDy;
    R.parts.gripU.visible = kind !== "bending" || e < 0.01; R.parts.nose.visible = kind === "bending"; R.parts.anvils.forEach((a) => (a.visible = kind === "bending")); R.parts.nose.position.y = (R.parts.nose.userData.y0 ??= R.parts.nose.position.y) + (kind === "bending" ? crossDy : 0);
    R.parts.needle.rotation.z = needle * (state.pauseMotion ? 1 : 1);
    // the pendulum swings down, strikes, and rises by the angle the specimen left it
    if (r && r.kind === "impact" && kind === "impact" && t.phase !== "idle") { const sa = (r.startAngleDeg * Math.PI) / 180, ra = (r.riseAngleDeg * Math.PI) / 180, hit = 0.45; let ang: number; if (f < hit) { const u = f / hit; ang = sa * (1 - Math.sin((u * Math.PI) / 2)); } else { const u = (f - hit) / (1 - hit); ang = -ra * Math.sin((Math.min(1, u) * Math.PI) / 2); } R.parts.arm.rotation.z = ang; const hitDone = f >= hit; R.impM.u.uBreak.value = hitDone && r.mode === "brittle" ? 1 : 0; R.impM.u.uDelta.value = hitDone && r.mode === "ductile" ? 1.2 : 0; R.impM.u.uHalf.value = 3; R.impBar.position.x += hitDone ? Math.min(1, (f - hit) * 4) * 0.5 : 0; gx = r.absorbedJ; }
    else { R.parts.arm.rotation.z = ((85 * Math.PI) / 180) * (target && kind === "impact" ? 1 : 0); R.impM.u.uBreak.value = 0; R.impM.u.uDelta.value = 0; }
    // the machine's own display: the graph grows out of the gauge
    if (disp.current && (t.phase === "running" || t.phase === "done") && r && r.kind !== "impact" && Math.floor(clock.elapsedTime * 15) % 2 === 0) { const c = disp.current.c, x = c.getContext("2d")!, mx = Math.max(...r.curve.x), my = Math.max(...r.curve.y); x.fillStyle = "#06141c"; x.fillRect(0, 0, 256, 160); x.strokeStyle = "#315D8C"; x.lineWidth = 2; x.beginPath(); x.moveTo(20, 10); x.lineTo(20, 140); x.lineTo(246, 140); x.stroke(); x.strokeStyle = "#FF9A3D"; x.lineWidth = 3; x.beginPath(); const n = r.curve.x.length - 1, upto = Math.floor(f * n); for (let i = 0; i <= upto; i++) { const px = 20 + (r.curve.x[i] / mx) * 220, py = 140 - (r.curve.y[i] / my) * 120; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); x.fillStyle = "#EFEDE5"; x.font = "16px monospace"; x.fillText(`${gx.toFixed(2)} / ${gy.toFixed(0)}`, 26, 26); disp.current.t.needsUpdate = true; }
    void brk;
    // the hero specimen of the detail page: the family's own piece, exploded when it is a laminate
    const m = material(state.sel), fam = m.family, hero = R.hero; hero.position.copy(C0); const heroOn = state.view === "detail" && state.introDone; live.hero += ((heroOn ? 1 : 0) - live.hero) * k; hero.visible = live.hero > 0.02; hero.scale.setScalar(Math.max(0.0001, live.hero) * 1.7); hero.rotation.y = state.pauseMotion ? hero.rotation.y : hero.rotation.y + dt * 0.35; hero.rotation.x = 0.35;
    R.hc.visible = fam === "Metal" || fam === "Polymer"; R.hb.visible = fam === "Ceramic" || fam === "Bio"; R.hl.visible = fam === "Lattice & foam"; R.hp.visible = fam === "Composite"; [R.hc, R.hb, R.hl, R.hp].forEach((o) => o.position.set(0, 0, 0)); R.hc.rotation.set(0, 0, 0.0); R.hb.scale.setScalar(0.6); R.hc.scale.setScalar(0.9); R.hl.scale.setScalar(1.6); R.hp.scale.setScalar(1.4);
    const ex = 0.12 + 0.08 * Math.sin(clock.elapsedTime * 0.8); R.hp.traverse((o) => { if (o.name.startsWith("Panel_Ply_")) o.position.z = (Number(o.name.slice(-1)) - 2.5) * (0.07 + ex * (state.pauseMotion ? 0.5 : 1)); });
    [R.hc, R.hb, R.hl, R.hp].forEach((o) => o.traverse((x) => { const mm = x as THREE.Mesh; if (mm.isMesh && mm.material === R.gauge.m) mm.material = R.plain.m; }));
    R.hero.traverse((x) => { const mm = x as THREE.Mesh; if (mm.isMesh && (mm.material === R.gauge.m || mm.material === R.barM.m)) mm.material = R.plain.m; });
  });
  return <><primitive object={R.machine} /><primitive object={R.pendulum} /><primitive object={R.coupon} /><primitive object={R.bar} /><primitive object={R.impBar} /><primitive object={R.hero} /><group ref={g} /><group ref={pend} /></>;
}
const POSE = { universe: { p: [-1.2, 2.6, 10.5], l: [-1.2, 2.4, 0], f: 46 }, detail: { p: [-1.2, 2.7, 6], l: [-1.2, 2.4, 0], f: 40 }, tensile: { p: [5.4, 2.6, 8.4], l: [5.4, 2.3, 0], f: 40 }, bending: { p: [5.4, 2.4, 7.2], l: [5.4, 1.6, 0], f: 40 }, impact: { p: [7.6, 2.6, 9.4], l: [7.8, 2.2, 0], f: 44 }, intro: { p: [-1.2, 2.5, 5.2], l: [-1.2, 2.4, 0], f: 42 } } as const;
function CameraRig() {
  const { camera, size } = useThree(), cam = camera as THREE.PerspectiveCamera, cur = useRef({ p: new THREE.Vector3(...POSE.intro.p), l: new THREE.Vector3(...POSE.intro.l), f: 42 });
  useFrame((_, dt) => {
    const s = state, key = !s.introDone ? (live.camT < 0.5 ? "intro" : "universe") : s.view === "test" ? s.test.kind : s.view === "detail" ? "detail" : "universe", g = POSE[key as keyof typeof POSE], c = cur.current, k = !s.introDone ? 1 - Math.exp(-dt * 1.2) : s.reduced ? 1 : 1 - Math.exp(-dt * 2.2);
    c.p.lerp(new THREE.Vector3(...g.p), k); c.l.lerp(new THREE.Vector3(...g.l), k); c.f += (g.f - c.f) * k;
    const sh = !s.introDone && live.shake > 0 && !s.reduced ? live.shake : 0; cam.position.copy(c.p).add(new THREE.Vector3((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh, 0)); cam.lookAt(c.l); cam.fov = c.f; cam.near = 0.1; cam.far = 120;
    if (size.width > 900 && s.introDone) cam.setViewOffset(size.width, size.height, size.width * 0.13, 0, size.width, size.height); else cam.clearViewOffset(); cam.updateProjectionMatrix();
  });
  return null;
}
function Lab() {
  const s = useStore(), glow = useRef<THREE.PointLight>(null);
  useFrame(() => { if (glow.current) glow.current.intensity = (state.introDone ? 6 : 10 + live.heat * 120) + (state.introDone ? 0 : 0); });
  return (<><ambientLight intensity={0.5} color="#9fb4c8" /><directionalLight position={[-6, 9, 8]} intensity={2.2} color="#ffd9b0" /><directionalLight position={[8, 5, 5]} intensity={1.1} color="#9bb8e0" /><pointLight ref={glow} position={C0.toArray()} color="#FF9A3D" distance={14} decay={1.5} intensity={6} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}><circleGeometry args={[40, 64]} /><meshStandardMaterial color="#14181c" roughness={0.55} metalness={0.5} /></mesh><gridHelper args={[60, 60, "#2a3138", "#1b2127"]} position={[0, 0, 0]} />{s.view ? null : null}</>);
}
function Lifecycle() {
  const { setFrameloop, gl } = useThree();
  useEffect(() => { const vis = () => setFrameloop(document.hidden ? "never" : "always"), lost = (e: Event) => { e.preventDefault(); set({ gfx: "poster" }); };
    document.addEventListener("visibilitychange", vis); gl.domElement.addEventListener("webglcontextlost", lost); (window as unknown as { __alchemiaStats: () => unknown }).__alchemiaStats = () => ({ calls: gl.info.render.calls, triangles: gl.info.render.triangles, geometries: gl.info.memory.geometries, textures: gl.info.memory.textures });
    return () => { document.removeEventListener("visibilitychange", vis); gl.domElement.removeEventListener("webglcontextlost", lost); }; }, [setFrameloop, gl]);
  return null;
}
export default function Scene() {
  useStore(); useEffect(() => { (window as unknown as { __aLive: typeof live }).__aLive = live; }, []);
  return (
    <Canvas className="stage" data-testid="stage" dpr={[1, 1.5]} camera={{ fov: 42, position: POSE.intro.p as unknown as [number, number, number] }} gl={{ antialias: true, powerPreference: "high-performance" }} onCreated={({ gl, scene }) => { gl.setClearColor("#0E1114"); gl.toneMapping = THREE.ACESFilmicToneMapping; scene.fog = new THREE.FogExp2("#0E1114", 0.03); scene.environment = new THREE.PMREMGenerator(gl).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.4; }}>
      <Lab /><CameraRig /><Matter /><Stars /><Rig3D /><Lifecycle />
    </Canvas>
  );
}
void PALETTE;
