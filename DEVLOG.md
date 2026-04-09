# HighVis R&D — Development Log

**Project:** Fivefold HighVis R&D pipeline comparison tool
**Built:** 2026-04-09
**Session:** CJ + Claude (MARVIN)

---

## What We Built

A local web tool for comparing AI video generation pipeline outputs. Specifically for a white-wall compositing R&D project where an untextured Unreal Engine render is passed through image gen → upscale → video gen to produce a photorealistic result.

### Pages

| Page | File | Purpose |
|------|------|---------|
| Comparison | `index.html` | Full-width scrolling video sliders, one per video model |
| Images | `images.html` | Drag sliders comparing source → imggen → magnific. Grid of all image outputs with lightbox |
| Pipeline | `pipeline.html` | Node graph showing the full AI pipeline with connections, thumbnails, prompt text |

### Supporting files
- `categorize.py` — smart file mover: reads keywords from dump filenames, assigns proper test IDs, moves to `scenes/[SCENE]/tests/[TEST_ID]/`, updates `index.md` and `board_data.json`
- `board_data.json` — source of truth for all tests, consumed by all HTML pages
- `board.html` — original card grid view (kept, may deprecate)
- `assets/fivefold-logo-transparent.png` — white-bg-stripped logo (PIL processed)
- `prompts/P001.md`, `P002.md` — prompt files with methodology notes

---

## Pipeline Structure

```
[Unreal Render (unlit)]
    → first frame (PNG)
    → Image Gen (Nano Banana Pro / Flux 2 Pro) using P001
    → Magnific Precision Upscale
    + [Unlit video] + [P002 prompt]
    → Video Gen (Luma Modify / Kling o1 / Wan 2.7)
    → Final rendered video output
```

### Test naming convention
```
[SCENE]_[PASS]_[IMG]_[VID]_[PROMPT]_v[N]
e.g. SPACESHIP_UT_NB_LM_P001_v01
```

| Code | Meaning |
|------|---------|
| UT | Untextured render pass |
| TX | Textured render pass |
| LT | Lit render pass |
| NB | Nano Banana Pro |
| FL | Flux 2 Pro |
| LM | Luma Modify |
| KL | Kling o1 |
| WN | Wan 2.7 |

### File structure per test
```
scenes/SPACESHIP/tests/SPACESHIP_UT_NB_LM_P001_v01/
    source_frame.png    ← first frame of unlit render
    img_gen.png         ← image model output
    img_magnific.png    ← magnific upscale
    video_output.mp4    ← final video gen output
    notes.md            ← verdict + score
```

---

## Comparison Page (index.html)

### Video comparison slider
- Bottom layer: rendered video output (full width, always visible)
- Top layer: unlit content (video when available, falls back to source frame image)
- `clip-path: inset(0 X% 0 0)` applied to unlit layer to reveal/hide it
- Auto-wipe: JS `requestAnimationFrame` oscillates slider between 20–80% (speed 0.12%/frame), pauses 90 frames at each end
- User drag overrides auto — auto resumes after 3s inactivity
- `pointer-events: none` on all media elements so drag goes to the wrap container

### Label system
- Two "label zones" — full-size absolute divs, each with same `clip-path` as their respective video layer
- Left zone (unlit): `clip-path: inset(0 (100-pos)% 0 0)` — physically hidden when slider goes left
- Right zone (rendered): `clip-path: inset(0 0 0 pos%)` — physically hidden when slider goes right
- Labels switch orange when their side is dominant (>50%)

### Unlit video fallback
- Source frame img shown by default (`display: block`)
- Video starts `display: none`
- `loadeddata` event on video swaps it in (hides img, shows video, syncs clip-path)
- This means the page works even before unlit.mp4 is added

---

## Pipeline Page (pipeline.html)

- 4-column CSS flex layout: inputs → img gen → upscale+prompt → video gen
- SVG bezier curves for connection lines (calculated from `getBoundingClientRect`)
- Purple lines = prompt connections, teal = media/render connections
- Port dots at each end of connections
- Videos in nodes autoplay muted loop
- Prompt text loaded from `prompts/P001.md` and `P002.md` (fetched, regex extracts code block)
- Lines redrawn on resize and after media load via ResizeObserver pattern

---

## Images Page (images.html)

- Two manual drag sliders: Source → NB, then NB → Magnific
- Same clip-path technique as video comparison but for static images
- Card grid of all image outputs
- Lightbox on card click (full size, Escape to close)

---

## MARVIN Launcher Integration

Added HighVis R&D card to `tools/launcher/marvin_tray.py`:
- Toggle starts `python -m http.server 8090` in `HighVisRnD/` directory
- Uses `shutil.which("python")` NOT `sys.executable` (which points to MARVIN.exe in frozen build)
- ↗ button opens `http://localhost:8090/index.html` in browser
- Status shows `● localhost:8090` when running
- Port 8090 (not 8080 — that's reserved for the MARVIN Chat UI)

---

## Learnings

### Video comparison sliders
- Apply `pointer-events: none` to ALL media layers — otherwise video elements swallow mouse events before the drag handler gets them
- Use `clip-path: inset(0 X% 0 0)` on the TOP layer (not width/overflow) — it's smoother and GPU accelerated
- Never apply `clip-path` directly to label elements — it clips relative to the label's own box, not the container. Use full-size zone divs as clip wrappers instead.
- Reliable video fallback: show static img by default, swap to video on `loadeddata` (not `onerror` — browser error events on video 404s are inconsistent)

### PyInstaller frozen exe
- `sys.executable` inside a frozen `.exe` returns the path to the `.exe` itself, not Python
- Always use `shutil.which("python")` to find system Python when spawning subprocesses from a frozen app

### Clip-path for physical label hiding
- To make a label "physically disappear" as the slider moves, wrap it in a full-size positioned div and apply the same clip-path as the layer it belongs to
- This is better than opacity — the label is genuinely not rendered outside its zone

### Logo transparency
- PIL `Image.getdata()` + threshold on RGB (>210) to zero alpha — fast, works well for clean white backgrounds
- Save as PNG to `assets/fivefold-logo-transparent.png` alongside original

### Categorizer
- Weavy exports have descriptive filenames, not structured ones — keyword matching works well
- Group files by scene+pass+img+vid key before assigning version numbers
- When multiple video models share the same imggen (NB+Magnific → Luma, Kling, Wan), copy the shared files rather than moving them

### HTTP server for local dev
- `python -m http.server` works perfectly for local HTML+video serving
- Videos won't play from `file://` in Chrome (CORS/range request issues) — always need a server
- Use a different port from any other running services (8090 here)

---

## Current Tests (Spaceship scene)

| Test ID | Img Model | Vid Model | Status |
|---------|-----------|-----------|--------|
| SPACESHIP_UT_NB_KL_P001_v01 | Nano Banana | Kling o1 | ✓ Complete |
| SPACESHIP_UT_NB_LM_P001_v01 | Nano Banana | Luma Modify | ✓ Complete |
| SPACESHIP_UT_NB_WN_P001_v01 | Nano Banana | Wan 2.7 | ✓ Complete |
| SPACESHIP_UT_FL_XX_P001_v01 | Flux 2 Pro | — | Image only |

---

## Session 2 — 2026-04-09 (post-compact)

### What We Added

**Lit render pass integration**
- Moved `unlit render spaceship.mp4` → `scenes/SPACESHIP/unlit.mp4`
- Moved `lit render spaceship.mp4` → `scenes/SPACESHIP/lit.mp4`
- Added two new comparison sections at the bottom of `index.html`:
  - **Unlit vs Lit Render** — pure Unreal pass comparison, no AI
  - **Lit Render vs Kling o1** — lit Unreal vs full AI pipeline output
- Used `buildCustomSection()` helper (explicit before/after paths + labels) instead of data-driven `buildSection()`
- Custom sections use `idx` 1 and 2; videos start visible (no img fallback needed since both paths always exist)

**Single-video dropdown redesign (index.html)**
- Replaced 3 scrolling AI model sections with 1 section + `<select>` dropdown
- Only 2 video elements load at a time (unlit + selected model) — previously 6
- Dropdown: orange border, white bold text, 13px, more padding — clearly visible
- On switch: rendered video `src` swapped, both videos reset to `currentTime=0` on `canplay`, both `.play()` called together

**Video sync system**
- `syncVideos()` runs every `requestAnimationFrame` tick
- Rendered video = primary clock; unlit video = secondary (rate-nudged to match)
- Drift >0.5s → hard `currentTime` seek (handles loop boundaries and src swaps)
- Drift >1 frame (0.033s) → ±8% playback rate nudge until locked
- Initial sync: `unlitVid.currentTime = rendered.currentTime` in `loadeddata` handler

**Performance — IntersectionObserver**
- Added to every slider via `initSlider()`
- All videos in a section pause when section leaves viewport (threshold: 10%)
- Resumes on scroll back in — only the visible section actively decodes

**Swipe lag fix**
- Removed `transition: clip-path 0.06s linear` from `.vc-unlit`
- Clip-path now updates in the same frame as the divider line — zero lag

**Logo size**
- `index.html`: 28px → 44px → 60px → 80px (images.html was left behind at 44px each time — now both at 80px)

**Images page fixes (images.html)**
- Left/right swap: clip-path moved from `.ic-after` to `.ic-before` so unlit source appears on the left, NB on the right
- Stacking order bug: `.ic-after` (NB) was rendering on top, covering `.ic-before` entirely — fixed with `z-index: 1` on `.ic-before`, `z-index: 2` on `.ic-zone` divs, `z-index: 3` on divider/handle
- Label zone highlighting: same orange/dim system as video page — zones physically clip their labels, dominant side goes orange
- Labels: unlit source (left) vs NB (right) for slider 1; NB vs Magnific for slider 2

---

## Learnings (Session 2)

### Video sync via playback rate nudge
- Two independent `<video>` elements drift because the browser decodes them independently
- Designate one as "primary clock" — check `primary.currentTime - secondary.currentTime` every rAF
- Small drift (>1 frame): nudge secondary `playbackRate` ±8% — smooth, no visible stutter
- Large drift (>0.5s): hard seek — handles loop boundary desync
- On src swap: listen for `canplay`, then set both `currentTime = 0` and call `.play()` together

### IntersectionObserver for video performance
- `querySelectorAll("video")` inside the slider wrap gets all video elements for that section
- `.pause()` on scroll out, `.play()` on scroll in — threshold 0.1 means 10% visible triggers resume
- Dramatically reduces concurrent decode load; only visible section is active

### z-index stacking in image sliders
- When two `position: absolute` divs overlap, DOM order determines paint order — later = on top
- The clipped "reveal" layer must be on top, otherwise the base layer covers it regardless of clip-path
- Fix: `z-index: 1` on the clipped layer, `z-index: 2` on UI chrome (zones/labels), `z-index: 3` on divider/handle

### CSS transition on clip-path causes drag lag
- Even a short `transition: clip-path 0.06s` makes the clipped layer trail behind the divider line during fast drags
- Remove all transitions on the clip-path property — rAF-driven updates are already smooth at 60fps

### Images page left/right
- `clip-path: inset(0 X% 0 0)` clips from the RIGHT — so the clipped element shows on the LEFT
- The non-clipped element is the base layer, always fully visible, showing on the RIGHT
- To get "A on left, B on right": A = ic-before with clip-path + z-index:1, B = ic-after underneath

---

## Current State

| Asset | Location |
|-------|----------|
| Unlit video | `scenes/SPACESHIP/unlit.mp4` ✓ |
| Lit video | `scenes/SPACESHIP/lit.mp4` ✓ |
| All test videos | `scenes/SPACESHIP/tests/*/video_output.mp4` ✓ |
| Image comparisons | `scenes/SPACESHIP/tests/SPACESHIP_UT_NB_LM_P001_v01/` ✓ |

## Current Tests (Spaceship scene)

| Test ID | Img Model | Vid Model | Status |
|---------|-----------|-----------|--------|
| SPACESHIP_UT_NB_KL_P001_v01 | Nano Banana | Kling o1 | ✓ Complete |
| SPACESHIP_UT_NB_LM_P001_v01 | Nano Banana | Luma Modify | ✓ Complete |
| SPACESHIP_UT_NB_WN_P001_v01 | Nano Banana | Wan 2.7 | ✓ Complete |
| SPACESHIP_UT_FL_XX_P001_v01 | Flux 2 Pro | — | Image only |

## Next Steps

- [ ] Add scoring/notes UI to comparison page
- [ ] Consider Netlify/GitHub Pages deploy for sharing with Fivefold team
- [ ] Process any new dump files as more tests are run
- [ ] Pipeline page (pipeline.html) — may need updating to reflect lit pass and new structure
