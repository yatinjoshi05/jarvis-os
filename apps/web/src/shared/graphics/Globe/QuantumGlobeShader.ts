import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// QUANTUM GLOBE PRODUCTION RENDERER — LOCKED CONVERGENCE SHADER ENGINE
// Color Palette: Top #00E8FF | Upper Mid #2F6BFF | Centre #7A3CFF | Lower #D83BFF | Bottom #FF5A4A
// Point Size Hierarchy: Tiny 1.0px (65%) | Small 1.4px (20%) | Medium 2.2px (10%) | Large 3.8px (4%) | Hero 5.2px (<0.8%, E > 0.92)
// ─────────────────────────────────────────────────────────────────────────────
export const SurfaceParticleShader = {
  uniforms: {
    uSize:      { value: 1.6 },
    uRadius:    { value: 1.15 },
    uTime:      { value: 0.0 },
    uDebugMode: { value: 6 }, // 1: Lattice, 2: Atmosphere, 3: Energy, 4: Compression, 5: Rim, 6: Composite
    uC0: { value: new THREE.Color('#00E8FF') }, // Top pole (+y)
    uC1: { value: new THREE.Color('#2F6BFF') }, // Upper Mid
    uC2: { value: new THREE.Color('#7A3CFF') }, // Centre
    uC3: { value: new THREE.Color('#D83BFF') }, // Lower Mid
    uC4: { value: new THREE.Color('#FF5A4A') }, // Bottom pole (-y)
  },
  vertexShader: /* glsl */`
    uniform float uSize;
    uniform float uRadius;
    uniform float uTime;
    uniform int   uDebugMode;
    uniform vec3  uC0, uC1, uC2, uC3, uC4;

    attribute vec3 aBasePosition;

    varying vec3  vColor;
    varying float vAlpha;

    void main() {
      vec3 n = normalize(aBasePosition);

      // ───────────────────────────────────────────────────────────────────────
      // 1. 6–8 Coherent Energy Islands (3D Scalar Energy Field E ∈ [0.0, 1.0])
      // ───────────────────────────────────────────────────────────────────────
      // Low-Frequency Hemispheric Swell (Macro islands, f ~ 1.6)
      float f1 = sin(aBasePosition.x * 1.6 + aBasePosition.y * 1.2 + uTime * 0.45) * 0.5 + 0.5;

      // Rotational Directional Wave (f ~ 3.6)
      float f2 = cos(aBasePosition.z * 3.6 - aBasePosition.y * 3.0 + aBasePosition.x * 1.8 + uTime * 0.8) * 0.5 + 0.5;

      // High-Frequency Energy Filaments (f ~ 11.0 with exponent 4.0)
      float filBase = sin(aBasePosition.x * 11.0 + aBasePosition.y * 8.5 - uTime * 1.5) *
                      cos(aBasePosition.z * 9.5 + aBasePosition.y * 7.0 + uTime * 1.2);
      float filaments = pow(clamp(filBase * 0.5 + 0.5, 0.0, 1.0), 4.0);

      // Total unified continuous scalar field E normalized strictly to [0.0, 1.0]
      float rawE = f1 * 0.45 + f2 * 0.35 + filaments * 0.60;
      float E = clamp(rawE / 1.40, 0.0, 1.0);

      // ───────────────────────────────────────────────────────────────────────
      // 2. Void Channel Suppression (RGB ~ 0.02 in dark channels, 5-12° width)
      // ───────────────────────────────────────────────────────────────────────
      // Smoothstep ramp for sharp 5-12° dark void separation between islands
      float voidMask = smoothstep(0.28, 0.52, E);
      float islandMask = step(0.58, E);
      float heroMask = step(0.92, E); // Strict Hero Threshold E > 0.92 (<0.8% of visible points)

      // ───────────────────────────────────────────────────────────────────────
      // 3. Surface Deformation (Max 0.018R displacement)
      // ───────────────────────────────────────────────────────────────────────
      float lowFreqDeform = sin(aBasePosition.y * 5.0 - uTime * 0.8 + aBasePosition.x * 3.0) * 0.010;
      float medFreqStress = cos(aBasePosition.x * 10.0 + aBasePosition.z * 8.0 + uTime * 1.2) * 0.008;
      float edgeBreakup   = sin(aBasePosition.x * 18.0 + aBasePosition.y * 24.0 + uTime * 1.4) * 0.006;
      vec3 radialDisplacement = n * (lowFreqDeform + medFreqStress + edgeBreakup);

      // Tangential vector flow along surface tangent plane (1-2% radius)
      vec3 up = vec3(0.0, 1.0, 0.0);
      vec3 tangent = cross(up, n);
      if (length(tangent) < 0.001) tangent = vec3(1.0, 0.0, 0.0);
      else tangent = normalize(tangent);
      vec3 bitangent = cross(n, tangent);

      float flowT1 = sin(aBasePosition.y * 5.0 + uTime * 1.1) * 0.012;
      float flowT2 = cos(aBasePosition.x * 7.0 - uTime * 0.9) * 0.010;
      vec3 tangentialDisplacement = tangent * flowT1 + bitangent * flowT2;

      vec3 pos = aBasePosition + radialDisplacement + tangentialDisplacement;

      vec4  mvPos   = modelViewMatrix * vec4(pos, 1.0);
      vec3  vNorm   = normalize(normalMatrix * n);
      vec3  viewDir = normalize(-mvPos.xyz);

      float rim   = pow(1.0 - abs(dot(vNorm, viewDir)), 2.8);
      float depth = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);

      // ───────────────────────────────────────────────────────────────────────
      // 4. Exact 5-Stop Latitude Color Palette Integration
      // Top #00E8FF -> Upper Mid #2F6BFF -> Centre #7A3CFF -> Lower #D83BFF -> Bottom #FF5A4A
      // ───────────────────────────────────────────────────────────────────────
      float latT = clamp(-aBasePosition.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
      vec3 baseCol;
      if      (latT < 0.25) baseCol = mix(uC0, uC1, smoothstep(0.00, 0.25, latT));
      else if (latT < 0.50) baseCol = mix(uC1, uC2, smoothstep(0.25, 0.50, latT));
      else if (latT < 0.75) baseCol = mix(uC2, uC3, smoothstep(0.50, 0.75, latT));
      else                  baseCol = mix(uC3, uC4, smoothstep(0.75, 1.00, latT));

      // Brightness Limits: Normal 0.35-0.75 | Bright 0.75-1.00 | Hero 1.15-1.45 | Max 1.65
      float targetBrightness = mix(0.35, 1.00, voidMask * (0.30 + islandMask * 0.70));
      if (heroMask > 0.5) targetBrightness = 1.35; // Hero emission brightness (1.15-1.45)
      targetBrightness = min(targetBrightness, 1.65);

      if (heroMask > 0.5) {
        // Hero core: subtle white tint while maintaining underlying palette integrity
        vColor = mix(baseCol, vec3(1.4, 1.4, 1.4), 0.65) * targetBrightness;
        vAlpha = 1.0;
      } else {
        vec3 energizedCol = mix(baseCol, vec3(0.75, 0.95, 1.0), filaments * islandMask * 0.40);
        vColor = energizedCol * targetBrightness * (0.85 + rim * 0.35);
        // Dark void channels drop to RGB ~ 0.02 opacity
        vAlpha = (mix(0.18, 0.95, depth) * 0.85 + rim * 0.15) * mix(0.04, 1.0, voidMask);
      }

      // ───────────────────────────────────────────────────────────────────────
      // 5. Point Size Hierarchy Limits (Strictly clamped to max 6.0px before bloom)
      // Tiny: 1.0px | Small: 1.4px | Medium: 2.2px | Large: 3.8px | Hero: 5.2px
      // ───────────────────────────────────────────────────────────────────────
      float targetPx = 1.0; // Tiny (65%)
      if (heroMask > 0.5) {
        targetPx = 5.2;     // Hero (1%, E > 0.92)
      } else if (E >= 0.76) {
        targetPx = 3.8;     // Large (4%)
      } else if (E >= 0.58) {
        targetPx = 2.2;     // Medium (10%)
      } else if (E >= 0.38) {
        targetPx = 1.4;     // Small (20%)
      }

      // 15% Rim Point Size Increase (Particle-driven rim)
      float rimSizeMultiplier = 1.0 + rim * 0.15;
      float finalPx = min(6.0, targetPx * rimSizeMultiplier);

      // Distance attenuation (Standard 6.0 / -mvPos.z scale factor)
      gl_PointSize = uSize * finalPx * (5.5 / -mvPos.z);
      gl_Position  = projectionMatrix * mvPos;
    }
  `,
  fragmentShader: /* glsl */`
    #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
    #else
      precision mediump float;
    #endif

    varying vec3  vColor;
    varying float vAlpha;

    void main() {
      vec2  uv   = gl_PointCoord - vec2(0.5);
      float dist = length(uv);
      if (dist > 0.5) discard;

      // Sub-pixel OLED disc anti-aliasing (crisp discs without blurry halos)
      float delta = fwidth(dist);
      float alphaEdge = smoothstep(0.44 + delta, 0.44 - delta, dist);

      float alpha = alphaEdge * vAlpha;
      vec3 finalColor = vColor;

      gl_FragColor = vec4(finalColor, alpha);
    }
  `,
};

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 2 — Inner Depth Lattice Particles (7,000 Points)
// ─────────────────────────────────────────────────────────────────────────────
export const InnerParticleShader = {
  uniforms: {
    uSize:   { value: 1.0 },
    uRadius: { value: 0.82 },
    uC0: { value: new THREE.Color('#0022AA') },
    uC1: { value: new THREE.Color('#5500AA') },
    uC2: { value: new THREE.Color('#990055') },
  },
  vertexShader: /* glsl */`
    uniform float uSize;
    uniform float uRadius;
    uniform vec3  uC0, uC1, uC2;

    attribute vec3 aBasePosition;

    varying vec3  vColor;
    varying float vAlpha;

    void main() {
      float t   = clamp(-aBasePosition.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
      vec3  col = mix(uC0, uC1, smoothstep(0.0, 0.5, t));
      col       = mix(col, uC2, smoothstep(0.5, 1.0, t));
      vColor    = col * 0.45;

      vec4  mvPos = modelViewMatrix * vec4(aBasePosition, 1.0);
      float depth = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);

      vAlpha = mix(0.06, 0.28, depth);

      gl_PointSize = uSize * 1.2 * (5.5 / -mvPos.z);
      gl_Position  = projectionMatrix * mvPos;
    }
  `,
  fragmentShader: /* glsl */`
    #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
    #else
      precision mediump float;
    #endif

    varying vec3  vColor;
    varying float vAlpha;

    void main() {
      vec2  uv   = gl_PointCoord - vec2(0.5);
      float dist = length(uv);
      if (dist > 0.5) discard;

      float delta = fwidth(dist);
      float alphaEdge = smoothstep(0.44 + delta, 0.44 - delta, dist);

      gl_FragColor = vec4(vColor, alphaEdge * vAlpha);
    }
  `,
};

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 3 — Particle-Driven Rim Corona (Density +25%, Size +15%)
// ─────────────────────────────────────────────────────────────────────────────
export const RimParticleShader = {
  uniforms: {
    uSize:   { value: 1.4 },
    uRadius: { value: 1.16 },
    uTime:   { value: 0.0 },
    uC0: { value: new THREE.Color('#00E8FF') },
    uC1: { value: new THREE.Color('#D83BFF') },
    uC2: { value: new THREE.Color('#FFFFFF') },
  },
  vertexShader: /* glsl */`
    uniform float uSize;
    uniform float uRadius;
    uniform float uTime;
    uniform vec3  uC0, uC1, uC2;

    attribute vec3 aBasePosition;

    varying vec3  vColor;
    varying float vAlpha;

    void main() {
      vec3 n = normalize(aBasePosition);

      // Minor edge perturbation (0.006R)
      float edgePerturb = sin(aBasePosition.x * 22.0 + aBasePosition.y * 28.0 + uTime * 1.5) * 0.006;
      vec3 pos = aBasePosition + n * edgePerturb;

      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      vec3 vNorm = normalize(normalMatrix * n);
      vec3 view  = normalize(-mvPos.xyz);

      float rim = pow(1.0 - abs(dot(vNorm, view)), 3.0);

      float t   = clamp(-aBasePosition.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
      vec3  col = mix(uC0, uC1, t);
      col = mix(col, uC2, pow(rim, 4.0) * 0.35);
      vColor = col * 0.85;

      vAlpha = smoothstep(0.45, 0.92, rim) * 0.75;

      float depth = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);
      vAlpha *= mix(0.30, 1.0, depth);

      // 15% size increase for particle-driven rim overlap
      gl_PointSize = uSize * 1.15 * (5.5 / -mvPos.z);
      gl_Position  = projectionMatrix * mvPos;
    }
  `,
  fragmentShader: /* glsl */`
    #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
    #else
      precision mediump float;
    #endif

    varying vec3  vColor;
    varying float vAlpha;

    void main() {
      vec2  uv   = gl_PointCoord - vec2(0.5);
      float dist = length(uv);
      if (dist > 0.5) discard;

      float delta = fwidth(dist);
      float alphaEdge = smoothstep(0.44 + delta, 0.44 - delta, dist);

      gl_FragColor = vec4(vColor, alphaEdge * vAlpha);
    }
  `,
};

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 4 — Atmosphere Particles (450 Points, r: 1.08R - 1.18R, Opacity: 0.12 - 0.22)
// ─────────────────────────────────────────────────────────────────────────────
export const AtmosphericParticleShader = {
  uniforms: {
    uSize:   { value: 1.0 },
    uRadius: { value: 1.20 },
    uTime:   { value: 0.0 },
    uC0: { value: new THREE.Color('#00E8FF') },
    uC1: { value: new THREE.Color('#7A3CFF') },
    uC2: { value: new THREE.Color('#FF5A4A') },
  },
  vertexShader: /* glsl */`
    uniform float uSize;
    uniform float uRadius;
    uniform float uTime;
    uniform vec3  uC0, uC1, uC2;

    attribute vec3 aBasePosition;

    varying vec3  vColor;
    varying float vAlpha;

    void main() {
      vec3 n = normalize(aBasePosition);

      float drift = sin(uTime * 0.25 + aBasePosition.y * 2.5 + aBasePosition.x * 1.8) * 0.012;
      vec3 pos = aBasePosition + n * drift;

      float t = clamp(-aBasePosition.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
      vec3 col = mix(uC0, uC1, smoothstep(0.0, 0.5, t));
      col = mix(col, uC2, smoothstep(0.5, 1.0, t));
      vColor = col * 0.70;

      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      vec3 vNorm = normalize(normalMatrix * n);
      vec3 view  = normalize(-mvPos.xyz);

      float rim   = pow(1.0 - abs(dot(vNorm, view)), 1.8);
      float depth = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);

      // Opacity strictly bounded to 0.12 - 0.22
      vAlpha = mix(0.12, 0.22, rim) * mix(0.4, 1.0, depth);

      gl_PointSize = uSize * 1.0 * (5.5 / -mvPos.z);
      gl_Position  = projectionMatrix * mvPos;
    }
  `,
  fragmentShader: /* glsl */`
    #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
    #else
      precision mediump float;
    #endif

    varying vec3  vColor;
    varying float vAlpha;

    void main() {
      vec2  uv   = gl_PointCoord - vec2(0.5);
      float dist = length(uv);
      if (dist > 0.5) discard;

      float delta = fwidth(dist);
      float alphaEdge = smoothstep(0.44 + delta, 0.44 - delta, dist);

      gl_FragColor = vec4(vColor, alphaEdge * vAlpha);
    }
  `,
};
