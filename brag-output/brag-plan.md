# iWriteTech — Official Launch Film Storyboard & Creative Plan

> **Inspired by `reference_video4.mp4` (Shownmedia Launch Film)**  
> **Duration:** 46.06 seconds | **Framerate:** 30 FPS (1,382 Frames) | **Format:** 1920×1080 Full HD  
> **Theme:** 100% Light Theme (Bright clean backgrounds, white & soft-neutral surfaces, subtle shadows, refined hairline borders, editorial typography)  
> **Soundtrack:** Master 48kHz Stereo AAC audio track from `reference_video4.mp4` (`soundtrack_ref4.m4a`) with synchronized rhythmic events and micro-interaction sound design.

---

## 🎯 Creative Translation of `reference_video4.mp4`

Rather than copying the reference directly, its core storytelling progression, typography elegance, camera depth, collaborative motion, and rhythm have been reinterpreted into an original, high-end identity for **iWriteTech**:

| Principle in Reference 4 | Reinterpretation for iWriteTech |
|---|---|
| **Macro Zoom to Mobile Chat:** Extreme macro texture transitioning into 3D phone screen with messaging dialogue | Macro camera sweep across CNC keyboard chassis resolving into floating 3D iPhone with Dynamic Island, active curation studio header, and relatable community dialogue on ditching cheap affiliate gear. |
| **Interactive Card Burst:** Visual assets bursting out in 3D parallax space around the mobile viewport | Four tactile hardware specimen cards bursting outwards in 3D parallax (`Keychron Q1 Pro`, `Solid Walnut Stand`, `ScreenBar Halo`, `Thunderbolt 4 Hub`). |
| **Floating Studio Frame & Viewport:** 3D elevated macOS window with telemetry sidebar, live product mockup, and waypoint pins | 3D elevated Blueprint Inspector (`Minimalist Oak Edition`) with real-time budget breakdown (`$1,850`), acoustic measurement (`42.8 dB`), photography viewport, and floating waypoint chips (`Apple Studio Display 5K`, `Mode Sonnet 75% Custom`, `100% Merino Wool Felt`). |
| **Swiss Editorial Poster:** Large serif editorial headline with structured hardware breakdown | **"The Anatomy of Pure Focus."** Swiss grid with three interactive dissection cards (`Holy Panda X 62g`, `American Walnut Shelf`, `BenQ ScreenBar Halo`) with lab badges. |
| **Collaborative Motion & Spectrogram:** Multi-user cursors manipulating real-time charts and parameters | Multi-user lab session with **Marcus (Hardware)** and **Elena (Ergonomics)** cursors adjusting a real-time FFT acoustic spectrum curve alongside a live YAML lab configuration and verified `9.8` acoustic score box. |
| **Circadian Telemetry & Flow State:** Clean data card with environmental sensors and schedule | Circadian workspace card highlighting `450 LUX` lighting, `21.5°C` ambient temperature, `38 dB` sound floor, and Mon–Sat deep focus schedule. |
| **Brand Lockup & Punchline:** Clean brand emblem followed by cinematic tagline | Precision squircle emblem with signature amber dot, bold **iWriteTech** wordmark, and the iconic closing punchline: **"Build your sanctuary."** |

---

## ⏱️ Scene Breakdown (46.06s)

```
[0.0s – 7.5s]   Macro Hardware Pan & 3D Phone Chat Reveal (with Parallax Burst Cards)
     │
[7.5s – 16.0s]  3D Hardware Specimen Viewport (Elevated Blueprint Inspector & Waypoint Chips)
     │
[16.0s – 25.0s] Swiss Editorial Grid: "The Anatomy of Pure Focus." Dissection Cards
     │
[25.0s – 35.0s] Collaborative Hardware Lab (Marcus & Elena Cursors & Real-Time FFT Wave)
     │
[35.0s – 40.5s] Circadian Lighting & Deep Work Telemetry (450 LUX & Weekly Schedule)
     │
[40.5s – 46.06s] Climax Brand Reveal & Iconic Punchline: "Build your sanctuary."
```

---

## 🛠️ Verification & Rendering Engine

- **Preview Verification:** `test_preview.js` deterministically tests all 6 scenes at key timestamps (`1.0s`, `3.0s`, `5.5s`, `10.0s`, `18.0s`, `28.0s`, `37.0s`, `42.0s`, `45.0s`) using headless Chrome CDP.
- **Deterministic CDP Renderer:** `render_video.js` evaluates every millisecond deterministically through Chrome DevTools Protocol (`window.seekTo(t)`), streaming 1,382 JPEG frames at 30 fps into FFmpeg H.264 (`crf 18`, `+faststart`) muxed with the master audio track.
