# Performance report

Measured with `node scripts/measure.mjs` on an Apple M3 Pro with Chrome through SwiftShader (CPU rasteriser). These are bounds, **not GPU results**; no physical GPU was available.

| Metric | Value |
|---|---|
| Transfer | 504 KB, 20 requests (the model is 291 KB, 52 KB gzipped) |
| LCP | 4,760 ms (software rendering) |
| CLS | 0 |
| Long tasks | 2,907 ms in total during load |
| Frame time, universe view | median 33.4 ms, p95 66.6 ms in software |
| Draw calls / triangles | 16 / 21,168 (44 instanced stars, the machine, the pendulum and the specimens) |
| Reweighting | a preset click to a re-ranked list took 166 ms |

Budgets enforced by the e2e suite: GLB under 500 KB, the library JSON under 60 KB, gzipped JS under 750 KB, fewer than 120 draw calls and 60,000 triangles, a preset to a new ranking in under 3 s.
