"""ALCHEMIA: an original virtual materials test machine, a tensile coupon, a lattice block, a composite panel, a ceramic bar and an impact pendulum. Deterministic. Run: Blender -b -P model/build.py
Blender is Z-up, the GLB is Y-up (glTF z = -Blender y), so the machine's front (Blender -y) faces +z in the browser. Writes exports/analysis.json (measured bounds) and a poster."""
import bpy, bmesh, math, os, json
from mathutils import Vector, Matrix
HERE = os.path.dirname(os.path.abspath(__file__)); P = json.load(open(os.path.join(HERE, "parts.json")))
os.makedirs(os.path.join(HERE, "exports"), exist_ok=True); os.makedirs(os.path.join(HERE, "renders"), exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True); scene = bpy.context.scene
def mat(name, color, rough=0.5, metal=0.0, emit=None, strength=3.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes["Principled BSDF"]; b.inputs["Base Color"].default_value = (*color, 1); b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    if emit: b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = strength
    return m
M = {"steel": mat("Titanium", (0.53, 0.59, 0.65), 0.35, 1.0), "dark": mat("Dark", (0.05, 0.055, 0.06), 0.6, 0.4), "copper": mat("Copper", (0.72, 0.43, 0.24), 0.3, 1.0), "ceramic": mat("Ceramic", (0.94, 0.93, 0.9), 0.45), "cobalt": mat("Cobalt", (0.19, 0.36, 0.55), 0.5), "screen": mat("Screen", (0.02, 0.05, 0.07), 0.3, 0.0, (0.3, 0.6, 0.9), 1.5), "orange": mat("Orange", (1.0, 0.6, 0.24), 0.4)}
def box_bm(bm, c, s):
    x, y, z = c; sx, sy, sz = (v / 2 for v in s); v = [bm.verts.new((x + a * sx, y + b * sy, z + d * sz)) for a in (-1, 1) for b in (-1, 1) for d in (-1, 1)]
    for f in ((0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)): bm.faces.new([v[i] for i in f])
def cyl_bm(bm, c, r, depth, axis="z", seg=20):
    rot = {"x": Matrix.Rotation(math.pi / 2, 4, "Y"), "y": Matrix.Rotation(math.pi / 2, 4, "X"), "z": Matrix.Identity(4)}[axis]
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r, radius2=r, depth=depth, matrix=Matrix.Translation(c) @ rot)
def obj(name, bm, material, parent=None, loc=(0, 0, 0)):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(material)
    o = bpy.data.objects.new(name, me); scene.collection.objects.link(o); o.parent = parent; o.location = loc; return o
def empty(name, loc=(0, 0, 0), parent=None):
    e = bpy.data.objects.new(name, None); scene.collection.objects.link(e); e.parent = parent; e.location = loc; return e
def part(name, parent, material, build, pivot=None, uv=None):
    bm = bmesh.new(); build(bm); pv = Vector(pivot) if pivot is not None else sum((v.co for v in bm.verts), Vector()) / max(1, len(bm.verts))
    for v in bm.verts: v.co -= pv
    if uv:                                   # a planar UV over (x, z), so the browser can draw a graph on a screen
        layer = bm.loops.layers.uv.new("UVMap")
        for f in bm.faces:
            for l in f.loops: l[layer].uv = ((l.vert.co.x + uv[0] / 2) / uv[0], (l.vert.co.z + uv[1] / 2) / uv[1])
    return obj(name, bm, material, parent, tuple(pv))
M_ = P["machine"]; machine = empty("Machine")
# ---- test machine (front faces Blender -y)
part("Machine_Base", machine, M["dark"], lambda b: box_bm(b, (0, 0, 0.25), (3.6, 1.7, 0.5)))
for s, x in (("L", -1.35), ("R", 1.35)): part(f"Machine_Column_{s}", machine, M["steel"], lambda b, x=x: cyl_bm(b, (x, 0.25, 2.6), 0.11, 4.2, "z", 16))
part("Machine_Crosshead", machine, M["copper"], lambda b: box_bm(b, (0, 0.25, M_["crossheadRestY"]), (3.1, 0.7, 0.4)))
part("Machine_Actuator", machine, M["steel"], lambda b: cyl_bm(b, (0, 0, 0.65), 0.15, 0.3, "z", 20))
part("Machine_LoadCell", machine, M["orange"], lambda b: cyl_bm(b, (0, 0.25, M_["crossheadRestY"] + 0.35), 0.18, 0.3, "z", 20))
part("Machine_GripUpper", machine, M["steel"], lambda b: box_bm(b, (0, 0, M_["upperGripY"]), (0.55, 0.55, 0.35)))
part("Machine_GripLower", machine, M["steel"], lambda b: box_bm(b, (0, 0, M_["lowerGripY"]), (0.55, 0.55, 0.35)))
part("Machine_Display", machine, M["screen"], lambda b: box_bm(b, (0.85, -0.9, 0.95), (1.2, 0.05, 0.75)), uv=(1.2, 0.75))
part("Machine_Dial", machine, M["ceramic"], lambda b: cyl_bm(b, (-0.8, -0.9, 0.95), 0.34, 0.05, "y", 28))
part("Machine_Needle", machine, M["dark"], lambda b: box_bm(b, (-0.8, -0.94, 1.075), (0.03, 0.02, 0.25)), pivot=(-0.8, -0.94, 0.95))
# ---- bending rig and the pendulum
for s, x in (("L", -1.0), ("R", 1.0)): part(f"Rig_Anvil_{s}", machine, M["steel"], lambda b, x=x: box_bm(b, (x, 0, 0.975), (0.24, 0.6, 0.35)))
part("Rig_Nose", machine, M["steel"], lambda b: (box_bm(b, (0, 0, 2.0), (0.12, 0.12, 1.0)), cyl_bm(b, (0, 0, 1.5), 0.1, 0.6, "y", 16)), pivot=(0, 0, 1.45))
pend = empty("Pendulum", (3.4, 0, 0))
part("Pendulum_Stand", pend, M["dark"], lambda b: (box_bm(b, (0, 0, 0.1), (1.6, 1.3, 0.2)), box_bm(b, (-0.3, 0.55, 2.2), (0.12, 0.12, 4.0)), box_bm(b, (-0.3, -0.55, 2.2), (0.12, 0.12, 4.0)), box_bm(b, (0, 0, 1.0), (0.9, 0.5, 0.15))))
part("Pendulum_Arm", pend, M["steel"], lambda b: box_bm(b, (0, 0, 2.7), (0.08, 0.08, 3.0)), pivot=(0, 0, 4.2))
part("Pendulum_Head", pend, M["copper"], lambda b: box_bm(b, (0, 0, 1.15), (0.34, 0.5, 0.34)), pivot=(0, 0, 1.15))
# ---- specimens (each group is centred where the browser places it)
C = P["coupon"]; coupon = empty("Coupon", (0, 0, C["center"][1]))
part("Coupon_Grip_Top", coupon, M["steel"], lambda b: cyl_bm(b, (0, 0, 0.75), 0.2, 0.5, "z", 20), pivot=(0, 0, 0.75)); part("Coupon_Grip_Bottom", coupon, M["steel"], lambda b: cyl_bm(b, (0, 0, -0.75), 0.2, 0.5, "z", 20), pivot=(0, 0, -0.75))
def gauge(b):
    rings, sides, L, R = C["rings"], C["sides"], C["gaugeLength"], C["gaugeRadius"]; rs = []
    for i in range(rings + 1):
        z = -L / 2 + L * i / rings; t = abs(z) / (L / 2); r = R * (1 + 0.55 * t ** 3)          # a dog-bone: flares toward the grips
        rs.append([b.verts.new((r * math.cos(2 * math.pi * k / sides), r * math.sin(2 * math.pi * k / sides), z)) for k in range(sides)])
    for i in range(rings):
        for k in range(sides): b.faces.new((rs[i][k], rs[i][(k + 1) % sides], rs[i + 1][(k + 1) % sides], rs[i + 1][k]))
gauge_obj = part("Coupon_Gauge", coupon, M["copper"], gauge, pivot=(0, 0, 0))
lat = empty("Lattice", (-3.0, 0, 1.0)); N = 4
def lattice(b):
    pitch, w = 0.3, 0.045
    for i in range(N):
        for j in range(N):
            for k in range(N):
                c = ((i - (N - 1) / 2) * pitch, (j - (N - 1) / 2) * pitch, (k - (N - 1) / 2) * pitch)
                if i < N - 1: box_bm(b, (c[0] + pitch / 2, c[1], c[2]), (pitch, w, w))
                if j < N - 1: box_bm(b, (c[0], c[1] + pitch / 2, c[2]), (w, pitch, w))
                if k < N - 1: box_bm(b, (c[0], c[1], c[2] + pitch / 2), (w, w, pitch))
part("Lattice_Block", lat, M["steel"], lattice, pivot=(0, 0, 0))
pan = empty("Panel", (-3.0, 2.0, 1.0))
for i in range(P["groups"]["panel"]["count"]): part(f"Panel_Ply_{i}", pan, M["cobalt"] if i % 2 == 0 else M["dark"], lambda b, i=i: box_bm(b, (0, 0, (i - 2.5) * 0.07), (1.2, 0.8, 0.06)))
Bp = P["bar"]; bar = empty("Bar", (0, -3.0, 1.0))
def barmesh(b):
    L, w, h, n = Bp["length"], Bp["width"], Bp["height"], Bp["segments"]; rs = []
    for i in range(n + 1):
        x = -L / 2 + L * i / n; rs.append([b.verts.new((x, sy * w / 2, sz * h / 2)) for sy, sz in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
    for i in range(n):
        for k in range(4): b.faces.new((rs[i][k], rs[i][(k + 1) % 4], rs[i + 1][(k + 1) % 4], rs[i + 1][k]))
    b.faces.new(rs[0][::-1]); b.faces.new(rs[n])
part("Bar_Ceramic", bar, M["ceramic"], barmesh, pivot=(0, 0, 0))
px = bmesh.new(); box_bm(px, (1.2, 0, 2.5), (8.6, 1.8, 5.0)); proxy = obj("Proxy_Machine", px, M["dark"])
# ---- measure and write analysis.json in glTF axes
bpy.context.view_layer.update()
def gl(v): return [round(v[0], 3), round(v[2], 3), round(-v[1], 3)]
def wb(o):
    ws = [o.matrix_world @ v.co for v in o.data.vertices]; a = gl([min(w[i] for w in ws) for i in range(3)]); b = gl([max(w[i] for w in ws) for i in range(3)]); return [[min(a[i], b[i]) for i in range(3)], [max(a[i], b[i]) for i in range(3)]]
ob = bpy.data.objects
A = {"machine": {"gripLowerTop": wb(ob["Machine_GripLower"])[1][1], "gripUpperBottom": wb(ob["Machine_GripUpper"])[0][1], "crossheadCentre": gl(ob["Machine_Crosshead"].matrix_world.translation), "dial": gl(ob["Machine_Dial"].matrix_world.translation), "needlePivot": gl(ob["Machine_Needle"].matrix_world.translation), "display": gl(ob["Machine_Display"].matrix_world.translation), "columnTop": wb(ob["Machine_Column_L"])[1][1]},
     "coupon": {"center": gl(coupon.matrix_world.translation), "topEnd": wb(ob["Coupon_Grip_Top"])[1][1], "bottomEnd": wb(ob["Coupon_Grip_Bottom"])[0][1], "gaugeVertices": len(gauge_obj.data.vertices), "gaugeBounds": wb(gauge_obj)},
     "bar": {"bounds": wb(ob["Bar_Ceramic"]), "vertices": len(ob["Bar_Ceramic"].data.vertices)}, "pendulum": {"axis": gl(ob["Pendulum_Arm"].matrix_world.translation), "head": gl(ob["Pendulum_Head"].matrix_world.translation)},
     "anvils": [gl(ob["Rig_Anvil_L"].matrix_world.translation), gl(ob["Rig_Anvil_R"].matrix_world.translation)], "noseContact": gl(ob["Rig_Nose"].matrix_world.translation)}
json.dump(A, open(os.path.join(HERE, "exports", "analysis.json"), "w"), indent=1)
# ---- poster
proxy.hide_render = True
for o in (ob["Lattice"], ob["Panel"], ob["Bar"]): o.hide_render = False
w = bpy.data.worlds.new("W"); scene.world = w; w.use_nodes = True; w.node_tree.nodes["Background"].inputs[0].default_value = (0.014, 0.017, 0.02, 1)
fl = bmesh.new(); box_bm(fl, (1.2, 0, -0.1), (16, 12, 0.2)); obj("Poster_Floor", fl, M["dark"])
def light(kind, loc, energy, color, size=1.0, rot=None):
    d = bpy.data.lights.new("L", kind); d.energy = energy; d.color = color
    if kind == "AREA": d.size = size
    o = bpy.data.objects.new("L", d); scene.collection.objects.link(o); o.location = loc
    if rot: o.rotation_euler = rot
light("AREA", (-4, -5, 5), 700, (1.0, 0.6, 0.3), 5); light("AREA", (4, -4, 4), 400, (0.55, 0.7, 1.0), 5); light("POINT", (0, -2, 2.2), 120, (1.0, 0.8, 0.6))
bpy.ops.object.camera_add(location=(1.5, -9.5, 3.4)); cam = bpy.context.active_object; scene.camera = cam; cam.data.lens = 38; cam.rotation_euler = (Vector((0.4, 0, 2.3)) - cam.location).to_track_quat("-Z", "Y").to_euler()
scene.render.engine = "BLENDER_EEVEE_NEXT"; scene.render.resolution_x, scene.render.resolution_y = 1280, 720; scene.render.filepath = os.path.join(HERE, "renders", "poster.png")
bpy.ops.object.select_all(action="DESELECT")
for o in bpy.data.objects:
    if o.type in ("MESH", "EMPTY") and not o.name.startswith("Poster_"): o.select_set(True)
bpy.context.view_layer.objects.active = machine
bpy.ops.export_scene.gltf(filepath=os.path.join(HERE, "exports", "specimens.glb"), export_format="GLB", use_selection=True, export_apply=True, export_yup=True, export_cameras=False, export_lights=False)
tris = sum(len(p.vertices) - 2 for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith("Poster_") for p in o.data.polygons)
print("specimens.glb", os.path.getsize(os.path.join(HERE, "exports", "specimens.glb")), "bytes", tris, "tris")
try: bpy.ops.render.render(write_still=True)
except Exception as e: print("poster failed", e)
