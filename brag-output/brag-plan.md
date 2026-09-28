# iWriteTech — Official Launch Film Storyboard & Technical Plan

> **Inspired by `reference_video6.mp4` (High-Velocity Recraft Flash Motion Commercial)**  
> **Duration:** 22.06 seconds | **Framerate:** 30 FPS (662 Frames) | **Format:** 1920×1080 Full HD (16:9 Widescreen)  
> **Visual Direction:** High-octane tech commercial, 16:9 Cinema Studio Card with rounded corners, supersonic light trails, bold italic grotesque kinetic typography (`Space Grotesk`, `Outfit`, `JetBrains Mono`), 3D card fanning, disassembled switch macro photography, massive 80+ specimen mosaic, and chromatic aberration glitch logo reveal.  
> **Soundtrack:** Master 48kHz Stereo AAC audio track from `reference_video6.mp4` (`soundtrack_ref6.m4a`) featuring driving electronic percussion, vocal risers, and punchy rhythmic accents.

---

## 🎯 Creative Translation of `reference_video6.mp4`

Reference 6 is an ultra-fast, rhythmic 22-second product showcase highlighting speed, generation velocity, cost disruption, pro-level refinement, infinite tile mosaic, and a punchy brand outro.

We reinterpreted these high-energy motion design motifs directly into **iWriteTech**:

| Scene Motif in Reference 6 | Reinterpretation for iWriteTech |
|---|---|
| **High-Speed Opener: Motorcycle with speed streaks & "INTRODUCING"** | High-velocity camera sweep into a custom matte black 65% CNC keyboard chassis with luminous amber and cyan speed streaks, accompanied by huge bold italic condensed typography: `INTRODUCING` and telemetry badge `[0.12ms LATENCY · 8,000Hz POLLING]`. |
| **Rapid Fan/Carousel: "V4.1 FLASH" & "THE FASTEST ON THE MARKET"** | Dynamic 3D fan of verified hardware specimen cards whipping into perspective with motion blur, accompanied by emphatic kinetic typography: `SANCTUARY PROTOCOL` → `THE MOST REFINED ON THE MARKET`. |
| **Rocket & Metric Velocity: "GENERATE IN 1.3 SEC"** | Rocketing acoustic frequency curve soaring upward with an animated numeric counter ticking to `0240+ SPECIMENS BENCHMARKED` and real-time sound resonance locking to `42.8 dB SPL`. |
| **Cost Disruption: "FOR A FRACTION OF THE COST"** | High-contrast hardware comparison stack (`$850 Curated Sanctuary vs $3,200 Hype Tax`) with shuffling specimen cards and badges: `ZERO AFFILIATE NOISE · 100% INDEPENDENT LAB`. |
| **Pro Refinement: "REFINE TO PRO QUALITY AT ANY TIME"** | Macro photography of an artisanal disassembled mechanical switch (transparent polycarbonate housing, gold spring, brass leaf) with holographic sparkles and an animated OS cursor clicking `[✦ Studio Thock: Active]`. |
| **Massive Grid: "CREATE AS FAST AS YOU THINK"** | Single hardware card explodes outward into a dynamic diagonal mosaic of 80+ curated desk setup photography tiles, ambient lightbars, and artisan keycaps covering the screen: `BUILD AS FAST AS YOU DREAM`. |
| **Brand Outro & Glitch: "RECRAFT"** | Chromatic aberration RGB-split glitch transition resolving into the clean studio card with the precision squircle logo emblem (glowing amber dot), bold custom wordmark: **iWriteTech**, subtitle `The Definitive Standard for Desk Tech & Workspaces.`, and punchline: `Build your sanctuary.` |

---

## ⏱️ Detailed 7-Scene Breakdown (22.06s / 662 Frames)

```
[0.00s – 2.20s]  Scene 1: Velocity Intro — "INTRODUCING: THE SANCTUARY PROTOCOL"
[2.20s – 5.50s]  Scene 2: 3D Hardware Fan — "SANCTUARY PROTOCOL: THE MOST REFINED"
[5.50s – 9.00s]  Scene 3: Metric Velocity — "BENCHMARK IN 1.3 SEC (0240+ Setups)"
[9.00s – 12.50s] Scene 4: Cost Disruption — "FOR A FRACTION OF THE COST"
[12.50s – 16.50s] Scene 5: Pro Calibration — "REFINE TO PRO QUALITY (Switch Macro & Cursor Click)"
[16.50s – 19.80s] Scene 6: Massive Specimen Mosaic — "BUILD AS FAST AS YOU DREAM"
[19.80s – 22.06s] Scene 7: Chromatic Glitch & Brand Finale — "iWriteTech (Build your sanctuary.)"
```

---

## 🛠️ HyperFrames Automated Pipeline

- **Composition:** `brag-output/composition/index.html` (100% deterministic time control via `window.seekTo(t)`).
- **Preview Engine:** `brag-output/test_preview.js` captures all keyframes in `brag-output/work/test_previews_ref6/`.
- **Production CDP Renderer:** `brag-output/render_video.js` evaluates all 662 frames at 30 fps in Headless Chromium at 1920×1080 and streams raw frames directly to FFmpeg with `libx264` (`crf 18`, `+faststart`) muxed with `soundtrack_ref6.m4a`.
