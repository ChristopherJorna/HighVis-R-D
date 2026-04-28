# SPACESHIP_UT_NB_KLC_P002_v01

**Date:** 2026-04-23
**Fork:** Classic
**Scene:** SPACESHIP
**Pass:** UT (untextured grey)
**Image model:** Nano Banana (Gemini 2.5 Flash Image)
**Video model:** Kling o1 (chunked, 2× ~6s, crossfade-stitched)
**Prompt:** P002
**Seed:** 42

## What this test was asking

First seam-clean chunked Kling o1 run. Worked around Kling's per-call cap by splitting into two ~6s chunks and stitching with a flip-book overlap. Concrete settings applied:

- Chunk1 tail frame → Chunk2 `reference_images[0]` (via rgthree SetNode/GetNode teleport) — gives Chunk2 a starting pixel to draw from.
- Gemini-restyled frame → Chunk2 `reference_images[1]` (style anchor for palette continuity).
- ColorMatch (kjnodes, method=mkl) on Chunk2 before join — re-grades Chunk2 to Chunk1.
- "HARD FIRST FRAME" prompt prefix on Chunk2 — strongest anchor available since Kling V2V has no true start-frame parameter.
- Crossfade widened 16 → 24 frames on ImageBatchJoinWithTransition after a 16-frame blend left a detectable pop.

## Result

Seam-clean. Usable as reference going forward. Documented as Classic fork dev note in `content/academic/highvis/forks/classic/findings.md`.

## Source files

- Shot folder: `content/output/highvis/classic/SPACESHIP_UT_NB_KLC_P002_v01/`
- Workflow: `tools/highvis-classic/workflow-kling-chunked.json`

## Scores

Pending CJ review. Fields required by `content/academic/highvis/comparison-template.md`:
`camera_match_score`, `photoreal_score`, `stability_score`, `cost_usd`, `wall_time_s`.
