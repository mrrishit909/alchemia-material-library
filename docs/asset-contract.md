# Asset contract

`model/parts.json` is read by `build.py`, `validate.py` and the web app. Blender is Z-up, the GLB is Y-up (glTF z = minus Blender y). The machine's front faces +z in the browser. 1 unit is about 10 cm.

| Group | Names | Pivot |
|---|---|---|
| Machine | Machine_Base, Machine_Column_L/R, Machine_Crosshead, Machine_Actuator, Machine_LoadCell, Machine_GripUpper, Machine_GripLower | part centre (the browser moves the crosshead, upper grip and load cell together) |
| Gauges | Machine_Display (with a planar UV), Machine_Dial, Machine_Needle | the needle turns about the dial centre |
| Bending rig | Rig_Anvil_L/R, Rig_Nose | the nose's contact line, one bar height above the anvils |
| Impact | Pendulum_Stand, Pendulum_Arm, Pendulum_Head | the arm turns about its top axis |
| Specimens | Coupon_Grip_Top, Coupon_Gauge, Coupon_Grip_Bottom, Lattice_Block, Bar_Ceramic, Panel_Ply_0..5 | centre of each specimen group |
| Analysis | Proxy_Machine (never drawn) | origin |

`Coupon_Gauge` has 1,176 vertices (49 rings of 24) and `Bar_Ceramic` 260 (65 rings of 4) so a vertex shader can stretch, neck, break and bend them. The coupon's ends meet the machine's grips, so the crosshead and the grip move together.

Outputs: `specimens.glb` (291 KB, 52 KB gzipped, 5,404 triangles), `analysis.json` (grip, crosshead, dial, needle, display, coupon, bar, pendulum, anvil and nose positions), `poster.png`.

`validate.py` re-imports the GLB in a fresh scene and fails on: a missing part, an unparented node, an unapplied scale, a coupon end that does not meet its grip, a crosshead that would leave the columns at full travel, a gauge or bar with the wrong vertex count, a nose contact that is not at anvil top plus bar height, a needle pivot away from the dial centre, a pendulum pivot that is not at the arm's top, a display without UVs, or the triangle or byte budget being exceeded. It caught a screen that had no UVs, so no graph could be drawn on it.
