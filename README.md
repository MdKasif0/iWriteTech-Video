# 🎬 iWriteTech — Official Launch Video

> Built using the **[`latent-spaces/brag`](https://github.com/latent-spaces/brag)** launch video methodology.  
> **Format:** 1920×1080 Full HD (16:9 Landscape) · 30 FPS · 20.0s · 48kHz Stereo AAC

![iWriteTech Launch Video Poster](brag-output/brag.jpg)

---

## 📽️ Video Overview

The official 20-second launch video for **[iWriteTech](https://iwritetech.com)** — a curated tech publication that handpicks aesthetic, minimal desk tech so enthusiasts don't have to endure the Amazon doomscroll.

- **Final Render:** [`brag-output/brag.mp4`](brag-output/brag.mp4) (1.5 MB, H.264 / AAC)
- **Settled Poster Frame:** [`brag-output/brag.jpg`](brag-output/brag.jpg) (1920×1080)
- **Creative Storyboard:** [`brag-output/brag-plan.md`](brag-output/brag-plan.md)

---

## ⏱️ Storyboard & Beat Breakdown

| Time | Scene | Visual | Audio & SFX |
|---|---|---|---|
| **0.0s – 3.0s** | **The Hook** | Dark background with warm golden radial glow. Golden serif typography: *"Still scrolling Amazon for desk tech?"* | Dm9 low warm ambient pad fades in with analog filter sweep |
| **3.0s – 7.0s** | **The Reveal** | Smooth transition to warm cream (`#F4EFE6`). Editorial logo and tagline: *"Tech that looks as good as it performs."* Stat badges slide up: `100% Hands-On Tested · 100% Editorially Independent`. | Stereo transition whoosh into Fmaj7; tactile switch click on stats |
| **7.0s – 11.0s** | **The Product** | *"Every gadget, handpicked and tested."* Category pills (`Desk Setups`, `Keyboards`, `MacBook`, `Gaming`) with high-resolution desk setup review card. | Bbmaj9 chord progression with smooth spatial motion accents |
| **11.0s – 15.0s** | **The Experience** | Interactive Light / Dark mode split-screen morph with mechanical keyboard review articles. Headline: *"Beautiful to read. Beautiful to browse."* | Gm7 harmonic shift; crisp UI toggle click sound effect |
| **15.0s – 20.0s** | **The Outro** | Deep obsidian black (`#0E0D0C`) with subtle floating gold dust particles. `iWriteTech` logo, `iwritetech.com` URL, and signoff: *"Curated · Tested · Aesthetic."* | Dsus2 resolving to D major with warm reverb decay tail |

---

## 📁 Repository Structure

```
.
├── README.md                     # This document
├── .gitignore                    # Git ignore file
└── brag-output/
    ├── brag.mp4                  # Final rendered 1080p 30fps launch video
    ├── brag.jpg                  # 1080p poster frame (baked thumbnail)
    ├── brag-poster.png           # Lossless PNG edition
    ├── brag-plan.md              # Creative plan, tone specification & storyboard
    ├── share-copy.txt            # Ready-to-post social share copy
    ├── render_video.js           # Headless Chrome CDP + FFmpeg rendering engine
    ├── composition/
    │   ├── index.html            # Web motion graphics composition (HTML5/CSS3)
    │   └── images/               # High-res photography & assets
    └── work/
        ├── generate_soundtrack.py # Audio synthesis engine (NumPy / SciPy)
        └── soundtrack.wav        # Synthesized 48kHz stereo master soundtrack
```

---

## ✍️ Social Share Copy

```text
We built a home for desk tech that doesn't look like every other blog. iWriteTech curates, tests, and reviews aesthetic gadgets — keyboards, setups, MacBook accessories — so you get the good stuff without the Amazon doomscroll.

iwritetech.com
```

---

## 🛠️ How to Re-render

### Requirements
- **Node.js** (v18+)
- **Google Chrome**
- **FFmpeg** with `libx264` and `aac` support
- **Python 3** with `numpy` and `scipy`

### Commands

1. **Synthesize the soundtrack:**
   ```bash
   python3 brag-output/work/generate_soundtrack.py
   ```

2. **Render the video:**
   ```bash
   node brag-output/render_video.js
   ```
