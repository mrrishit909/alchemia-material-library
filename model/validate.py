"""Fresh-scene re-import of exports/specimens.glb checked against parts.json and analysis.json. Exit 1 on failure."""
import bpy, os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); P = json.load(open(os.path.join(HERE, "parts.json"))); A = json.load(open(os.path.join(HERE, "exports", "analysis.json")))
bpy.ops.wm.read_factory_settings(use_empty=True); path = os.path.join(HERE, "exports", "specimens.glb"); bpy.ops.import_scene.gltf(filepath=path)
objs = {o.name.split(".")[0]: o for o in bpy.data.objects}; tris = lambda o: sum(len(p.vertices) - 2 for p in o.data.polygons)
G = P["groups"]; need = list(G["machine"]) + list(G["rigs"]) + list(G["specimens"]) + list(G["proxy"]) + ["Machine", "Pendulum", "Coupon", "Lattice", "Panel", "Bar"] + [f"{G['panel']['prefix']}{i}" for i in range(G["panel"]["count"])]
missing = [n for n in need if n not in objs]; bad = []
def wb(o):
    ws = [o.matrix_world @ v.co for v in o.data.vertices]; return [min(w[i] for w in ws) for i in range(3)], [max(w[i] for w in ws) for i in range(3)]
for n in need:
    o = objs.get(n)
    if o is None or o.type != "MESH": continue
    if tuple(round(v, 4) for v in o.scale) != (1.0, 1.0, 1.0): bad.append(f"{n}: unapplied scale")
# the specimen must sit between the grips: the coupon's ends meet the grips, so a stretch can move the crosshead and the grip together
M, C, B, S = P["machine"], P["coupon"], P["bar"], A
if abs(S["coupon"]["bottomEnd"] - S["machine"]["gripLowerTop"]) > 0.02: bad.append(f"coupon bottom ({S['coupon']['bottomEnd']}) does not meet the lower grip ({S['machine']['gripLowerTop']})")
if abs(S["coupon"]["topEnd"] - S["machine"]["gripUpperBottom"]) > 0.02: bad.append(f"coupon top ({S['coupon']['topEnd']}) does not meet the upper grip ({S['machine']['gripUpperBottom']})")
if S["machine"]["crossheadCentre"][1] + M["travel"] > S["machine"]["columnTop"]: bad.append("the crosshead would leave the columns at full travel")
# the gauge mesh must be dense enough for a vertex shader to neck and break it, and the bar dense enough to bend
exp_g = (C["rings"] + 1) * C["sides"]
if S["coupon"]["gaugeVertices"] != exp_g: bad.append(f"Coupon_Gauge has {S['coupon']['gaugeVertices']} vertices, expected {exp_g}")
if S["bar"]["vertices"] != (B["segments"] + 1) * 4: bad.append(f"Bar_Ceramic has {S['bar']['vertices']} vertices, expected {(B['segments'] + 1) * 4}")
gl, gh = S["coupon"]["gaugeBounds"]
if abs((gh[1] - gl[1]) - C["gaugeLength"]) > 0.01: bad.append("gauge length differs from the contract")
# the bending nose touches the bar's top face when the bar rests on the anvils
anvil_top = S["machine"]["gripLowerTop"]
if abs(S["noseContact"][1] - (anvil_top + B["height"])) > 0.02: bad.append(f"Rig_Nose contact {S['noseContact'][1]} is not at anvil top + bar height {anvil_top + B['height']}")
# the needle turns about the dial's centre and the pendulum about its axis
nd, dl = S["machine"]["needlePivot"], S["machine"]["dial"]
if abs(nd[0] - dl[0]) > 0.02 or abs(nd[1] - dl[1]) > 0.02: bad.append("Machine_Needle pivot is not at the dial centre")
arm = objs.get("Pendulum_Arm")
if arm:
    lo, hi = wb(arm)
    if abs(arm.matrix_world.translation.z - hi[2]) > 0.02: bad.append("Pendulum_Arm pivot is not at its top")
disp = objs.get('Machine_Display')
if disp and not disp.data.uv_layers: bad.append('Machine_Display has no UVs, so a graph cannot be drawn on it')
orphans = [o.name for o in bpy.data.objects if o.parent is None and o.name.split(".")[0] not in ("Machine", "Pendulum", "Coupon", "Lattice", "Panel", "Bar", "Proxy_Machine")]
total_tris = sum(tris(o) for o in bpy.data.objects if o.type == "MESH"); size = os.path.getsize(path); fail = list(bad)
if missing: fail.append(f"missing {missing}")
if orphans: fail.append(f"unparented {orphans}")
if total_tris > P["budget"]["tris"]: fail.append(f"{total_tris} tris over budget")
if size > P["budget"]["bytes"]: fail.append(f"{size} bytes over budget")
rep = {"tris": total_tris, "bytes": size, "parts": len(need), "missing": missing, "orphans": orphans, "problems": bad}
json.dump(rep, open(os.path.join(HERE, "exports", "validation.json"), "w"), indent=1); print(json.dumps(rep, indent=1))
if fail: print("VALIDATION FAILED:", fail); sys.exit(1)
print("VALIDATION OK")
