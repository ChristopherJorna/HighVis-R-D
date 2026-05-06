# HighVis Local Fork — V5 Parameter Tuning Dataset

**Date:** 2026-05-06
**Scene:** Spaceship (unlit 3D render from Unreal Engine)
**GPU:** RTX 5090 32GB (RunPod, EUR-NO-1)
**Pipeline:** Source video -> Resize (1280x720) -> Nano Banana Pro (Gemini 3 Pro) -> 4x-UltraSharp upscale -> LTX 2.3 22B FP8 + IC-LoRA HDR -> MP4

---

## Files

### Root outputs

| File | Description |
|------|-------------|
| `highvis-local-v5_run1_2026-05-06.mp4` | First successful end-to-end output (run 1) |
| `nano-banana-frame_2026-05-06.png` | Nano Banana Pro restyled reference frame used across all runs |
| `v5_run1_metadata.json` | Full metadata for run 1 (models, settings, signal path, observations) |
| `v5_iteration_log.json` | Complete iteration log — all 15 runs with settings, results, and plain-English explanations of each parameter |
| `Highvis-Local-V5-final.json` | The ComfyUI workflow JSON used for these runs |

### v5_runs/ — Per-run outputs

15 parameter tuning runs. Files use ComfyUI's counter naming convention.

**Nano Banana reference images (9 PNG, ~7MB each):**
`LC_20260506_NB_%counter:4%_00001_.png` through `_00009_.png`

These are the Nano Banana Pro restyled first frames. 9 unique restyles were generated (the same reference was reused for multiple V2V runs when only V2V settings changed).

**V2V output videos (15 MP4, 0.5-3MB each):**
`LC_20260506_V2V_%counter:4%_00001_.mp4` through `_00015_.mp4`

Each video is one parameter tuning run. 6-8 seconds long. The counter number maps directly to the run number in the iteration log.

### v5_runs/thumbs/ — Web thumbnails

Generated for the website test board. Not source data.

| Pattern | Description |
|---------|-------------|
| `nb_01.jpg` - `nb_09.jpg` | Nano Banana frames resized to 960px wide, JPEG quality 80 |
| `v2v_01_mid.jpg` - `v2v_15_mid.jpg` | Mid-frame captures from each V2V video (middle of the clip, more representative than the first frame which always has full style) |

---

## Run-by-run mapping

| Run | Video file | Key settings | Motion | Style | Notes |
|-----|-----------|--------------|--------|-------|-------|
| 1 | `_00001_.mp4` | sigma 0.975, CFG 1.0, LoRA 0.5 | Good | Faded | First successful output |
| 2 | `_00002_.mp4` | sigma 0.985, CFG 1.0, LoRA 0.5, 8 steps | Poor | Faded | Too much freedom |
| 3 | `_00003_.mp4` | sigma 0.985, CFG 1.0, LoRA 0.5, 14 steps | Poor | Faded | Compounded deviation |
| 4 | `_00004_.mp4` | ~sigma 0.8 | Good | Low | Exploring range |
| 5 | `_00005_.mp4` | ~sigma 0.7, CFG 1.5 | Good | Low | CFG increase began |
| 6 | `_00006_.mp4` | ~sigma 0.6, CFG 1.5 | Good | Low | Further reduction |
| 7 | `_00007_.mp4` | ~sigma 0.5, CFG 2.0 | Good | Low | CFG at 2.0 |
| 8 | `_00008_.mp4` | ~sigma 0.5, CFG 2.0, LoRA 0.7 | Good | Low | LoRA strength test |
| 9 | `_00009_.mp4` | ~sigma 0.5, CFG 2.0, LoRA 0.7 | Good | Low | Transitional |
| 10 | `_00010_.mp4` | sigma 0.4, CFG 2.0, LoRA 0.7 | **Perfect** | None | Motion lock proof (F-LC-007) |
| 11 | `_00011_.mp4` | sigma 0.4, CFG 2.0, LoRA 1.0 | **Perfect** | None | LoRA max — no difference |
| 12 | `_00012_.mp4` | sigma 0.55, CFG 2.0, LoRA 0.7 | Good | ~5% | Starting sigma = main style lever |
| 13 | `_00013_.mp4` | sigma 0.7, CFG 2.0, LoRA 0.7 | Good | ~8% | Style fade first observed |
| 14 | `_00014_.mp4` | sigma 0.9, CFG 2.0, LoRA 0.7 | Good | ~60% | Binary search jump; style fade confirmed (F-LC-008) |
| 15 | `_00015_.mp4` | sigma 0.95, CFG 2.0, LoRA 0.7 | Good | **Best** | Current optimum |

---

## Findings from this session

- **F-LC-007:** Motion and style are separate controls. Sigmas control motion (lower = more faithful). CFG and prompts control style. Can be tuned independently.
- **F-LC-008:** Style fades over time. Single reference frame guides the whole clip. Strongest on frame 1, drops to ~60% after 1 second. Fundamental IC-LoRA limitation.
- **F-LC-009:** Proposed fix: chunked generation with per-chunk style anchors. Split into 2-3s chunks, fresh Nano Banana reference per chunk. Planned as V6 workflow.

---

## How to reproduce

1. Start a RunPod pod with RTX 5090 and the HighVis network volume attached
2. Load `Highvis-Local-V5-final.json` into ComfyUI
3. Set the source video, Nano Banana reference, and sigma/CFG/LoRA values per the table above
4. All runs use seed 42, euler_ancestral sampler, prompt "HDR footage", negative "pc game, cartoon, ugly"
