# ALCHEMIA: a materials library you can break

A dark lab. A sphere of amorphous metal heats until it runs, cools into crystals, and morphs through metal grains, a carbon lattice, ceramic microstructure and composite layers. Property labels flash. Then the sphere divides into a constellation of 44 materials and **the interface settles around it**.

Weight strength, carbon and cost and the stars reorganise. Pick one and it travels into a virtual test machine: a tensile coupon that stretches, necks and snaps, a bar bent between anvils, a pendulum that strikes a specimen. The graph grows out of the machine's own gauge. Compare it with a ceramic, filter by how it can be made, see what a beam of equal stiffness weighs, costs and emits, and save a shortlist.

Built from blueprint 09 of the *Advanced Engineering Build Book, Volume VII* as a **vertical slice**. **Every material record and supplier is synthetic, and the tests are simplified models: not datasheet values and not a test report.**

- Live: https://mrrishit909.github.io/projects/alchemia-material-library/demo/
- Case study: https://mrrishit909.github.io/projects/alchemia-material-library/

## Run it
```bash
npm ci
npm run seed                      # materials, processes, suitability, presets
npm run model                     # Blender 4.5: build.py then validate.py (the GLB is committed, so optional)
npm test                          # 32 domain + API tests
npm run build && node scripts/serve.ts 8711   # static export at http://127.0.0.1:8711
npm run e2e                       # 26 Playwright tests (needs Google Chrome)
node apps/api/src/server.ts       # /v1 API on :8710, OpenAPI at /openapi.json
```
`?skip=1`, `?view=universe|compare|test|process|footprint|detail`, `&material=ti-64`, `?gfx=off`, `?motion=reduced`.

## The pipeline
`model/parts.json` is the contract for 35 named parts. `build.py` makes the test machine, the bending rig, the pendulum and the specimens (a dense gauge and bar that a vertex shader can deform) and writes `analysis.json`; `validate.py` re-imports the GLB and fails on a missing part, a misaligned grip or nose, or a screen without UVs. The library, the weighting, the tests and the process rules are in `packages/domain`, shared by the browser and the API. See [docs/](docs/) and [design/](design/).

## Agent roles
`.claude/agents/` defines the twelve roles from the book, `.claude/skills/` the project skills. **Honest note:** this repository was produced by one Claude Code session playing those roles in sequence on one working tree, not by parallel subagents in separate worktrees. The multi-agent workflow is the development process; the product contains no agents.

## Not built, and why
PostgreSQL and vector search (JSON files), real or licensed material data, anisotropy and temperature-dependent properties, finite element tests, authentication, dragging the 3D camera, touch tests beyond the phone layout, and a measurement on a physical GPU. Frame numbers are SwiftShader. One synthetic supplier is labelled Sponsored to show how a sponsored catalogue would be marked; it is not a real sponsorship.
