# QA report

Apple M3 Pro, Chrome stable, Playwright 1.63, WebGL through SwiftShader. Last full runs: 26 e2e passed three times in a row after the final fix; 32 unit and API tests passed.

| Matrix row (blueprint 18) | Covered by | Result |
|---|---|---|
| Intro first load, skip, refresh mid-sequence | demo walk (asserts HUD opacity 1, sphere gone, constellation settled), refresh test, choices during the last fade kept, a mid-melt check | pass |
| Input: click, keyboard | demo walk, weight slider and shortlist star reached by keyboard, the constellation's list | pass |
| Input: drag, touch | the 3D scene is not draggable; stars are clickable in 3D but only the list is tested | partial |
| Responsive | phone 390 px: rail becomes a strip, panel below, no sideways overflow | pass at one phone size |
| Motion: reduced | static story, same library, a test runs without the animation | pass |
| Graphics: success, failure, context loss | `?gfx=off` journey through a tensile test, compare and footprint; lost-context event | pass |
| Domain | tensile slope equals the modulus, UTS is the peak, brittle fracture is UTS over E, bending stiffness is 48 E I over L cubed, steel loses toughness when cold, process rules, shortlist caps, footprint formula, ranking follows weights | pass (32 tests) |
| API | paging, filters, compare, idempotent simulation and shortlists, validation, OpenAPI 3.1 | pass |
| Visual regression | six views against the poster fallback | pass |
| Performance | budgets in tests/e2e/performance.spec.ts | pass |

**Not validated against real materials.** The records are invented and the tests are simplified models; they are checked against the formulas they implement.

Defects found during the build: shader uniforms updated through the object passed to `<shaderMaterial uniforms>` never reached the GPU (the sphere stayed cold and grey), so they are now set through the material's own `uniforms`; the crosshead vanished because its absolute position overwrote the pivot offset Blender had given it; metals rendered black without an environment map; the display had no UVs, so the graph could not be drawn on it; two tests waited for a list item that was not in the top twelve and ran into the test timeout; a keyboard test pressed Enter before the focus had landed.
