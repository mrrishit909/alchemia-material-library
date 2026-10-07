# ALCHEMIA

Interactive materials discovery library with virtual tests (blueprint 09, Advanced Engineering Build Book Vol. VII). Static site; the Blender kit is scripted. Every material record, supplier and test result is synthetic or simplified: NOT datasheet values, NOT a test report.

- Build the asset: `npm run model` (Blender 4.5 at ~/Applications), then `node scripts/copy-assets.ts`. Contract: `model/parts.json` (35 named parts: test machine, bending rig, impact pendulum, tensile coupon, lattice block, six-ply panel, ceramic bar). The build also writes `model/exports/analysis.json`, which `packages/domain/test` checks (coupon ends meet the grips, nose touches the bar, pendulum arm length).
- Domain: `packages/domain/src` (materials.ts 44 records and suppliers, scoring.ts normalised axes, ranking and the constellation layout, tests.ts tensile, bending, impact, footprint.ts equal-stiffness beam, processes.ts suitability rules, shortlist.ts). Data: `npm run seed`. Tests: `npm test`, `npm run e2e` after `npm run build`.
- Space: 1 scene unit is about 10 cm; the constellation is centred at (-1.2, 2.4, 0), the machine at x = 5.4 and the pendulum at x = 8.8. Deformation (stretch, neck, break, bend) is done in a vertex shader on the dense gauge and bar meshes; stiff specimens are drawn with their movement magnified and the UI says so.
- R3F note: update `<shaderMaterial>` uniforms through `ref.current.uniforms`, not through the object you passed in `uniforms={...}`.
- `window.__aLive`, `window.__aStars` and `window.__alchemiaStats` are exposed for tests.
- Multi-agent is the development process only (.claude/agents); the product contains no agents.
