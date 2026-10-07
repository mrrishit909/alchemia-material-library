# Architecture

```
model/parts.json ──> model/build.py ──Blender──> specimens.glb (35 named parts, 5,404 triangles), analysis.json, poster.png
                 └─> model/validate.py (fresh-scene re-import: names, pivots, grip and nose alignment, gauge and bar density, UVs, budgets)
data/simulators/generate.ts ──> materials (44), processes (12), suitability, presets, footprints
packages/domain: materials, scoring (axes, rank, layout), tests (tensile, bending, impact), footprint, processes, shortlist
apps/web (Next.js 16 static export): App ─ store ─ Panels (DOM + SVG radar and charts, six views) + Scene (R3F: matter sphere, constellation, machine) + Intro (GSAP)
apps/api (node:http): the blueprint's section 12 contract, plus footprint and shortlists
```

**The library is data, the tests are functions.** A material is a record of seven ranked properties plus elongation, service temperature, recyclability and a class. Everything else is derived: a log-scaled 0 to 1 normalisation per axis (lower-is-better axes inverted), a weighted score, a constellation position, a radar polygon, a process suitability, and three virtual tests.

**Weights move the stars.** The constellation's x is the weighted mean of strength, stiffness and fatigue; y of lightness, low carbon and low cost; z of thermal conductivity; a few relaxation steps keep stars apart. Each star springs toward its target, so changing a weight reorganises the whole sky (a test checks that more than half the stars move).

**Virtual tests.** Tensile: linear elastic to yield, concave hardening to the ultimate strength, necking to fracture; brittle records are linear to UTS over E. Bending: three-point, with stiffness 48 E I over L cubed; ceramics break at 1.4 times their tensile strength, ductile metals yield to a 5 percent strain limit. Impact: absorbed energy is toughness times an effective volume, reduced below a record's ductile-to-brittle transition, capped by the pendulum's 135 J. The animation plays the same curve the chart draws.

**Deformation in the shader.** The coupon's gauge is a dense cylinder: a vertex shader stretches it (bottom fixed), narrows it around a neck, and at fracture opens a gap and tapers the broken ends; triangles that straddle the break are discarded. The bar bends with the three-point deflection shape and splits at midspan when brittle. The machine's own display is a canvas texture, so the graph grows out of the gauge as well as in the panel.

**Matter intro.** One shader draws the sphere: a heat ramp (titanium to copper to molten orange to white-hot), noise displacement and a drooping base for melt, and four microstructures (Voronoi metal grains, a hexagonal carbon lattice, ceramic grains with pores, composite layers with a twill) blended by a mode value. The sphere then divides: the constellation's stars start on its surface and travel to their layout positions.

**Not built.** PostgreSQL and vector search (JSON files), real or licensed material data, anisotropy and temperature-dependent properties, finite element tests, MatWeb-style import, authentication, object storage.
