# Assets Manifest (ASSETS.md)

This file defines the directory structure, file formats, and storage standards for all graphical, audio, font, and animation assets inside Jarvis OS.

## Directory Structure

All visual and audio assets live within the frontend client or shared assets modules:

```text
apps/web/public/assets/
├── fonts/          # Custom typography files (.woff2)
├── icons/          # SVG vector icons (or lucide-react overrides)
├── logos/          # Brand logotypes and emblem SVGs
├── sounds/         # Ambient audio feedback files (.wav, .mp3)
├── animations/     # Pre-rendered motion templates (.json / Lottie)
└── particles/      # Canvas shader resources & textures
```

---

## Asset Classification & Standards

### 1. Vector Icons & Logos

- **Location**: `apps/web/public/assets/icons/` and `apps/web/public/assets/logos/`
- **Format**: `.svg` (Scalable Vector Graphics)
- **Standard**: All icons must use vector line paths, transparent backgrounds, and default stroke weights that allow styling via CSS classes or Tailwind custom color tokens (e.g., `stroke="currentColor"`).

### 2. Custom Typography & Fonts

- **Location**: `apps/web/public/assets/fonts/`
- **Format**: `.woff2` (Web Open Font Format 2.0)
- **Standard**: Fonts must be subsetted for optimal web loading.

### 3. Sounds

- **Location**: `apps/web/public/assets/sounds/`
- **Format**: `.wav` (PCM 16-bit) or `.mp3`
- **Standard**: Sound assets must be highly optimized, short clips (< 1.5 seconds) with normalized volume settings to prevent clipping.

### 4. Particles & Shaders

- **Location**: `apps/web/public/assets/particles/`
- **Format**: `.glsl` (OpenGL Shading Language) or `.json` point clouds
- **Standard**: Textures used in particle loops must be low-res alphas (e.g., 64x64) to minimize GPU memory pressure.

---

## TODO

- [ ] Upload primary SVG logotype resources.
- [ ] Compile short list of approved ambient notification sound files.

