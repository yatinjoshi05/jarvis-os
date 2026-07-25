import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// QUANTUM GLOBE PRODUCTION RENDERER — LOCKED SUBSYSTEM REFINEMENT ENGINE
// 1. Edge Turbulence & Detached Atmosphere: Multi-harmonic edge breakup & orbital drift.
// 2. Interior Volumetric Depth: Parallax-sorted inner depth volume without glow.
// 3. Coherent Energy Flow: Fluid tangential vector field streamlines across lattice.
// 4. Multi-Layer Rim Structure: 3-tier view-space specular corona & rim scatter.
// ─────────────────────────────────────────────────────────────────────────────
export const SurfaceParticleShader = {
  uniforms: {
    uSize:      { value: 1.2 },
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
      // 1. Coherent Energy Flow (Multi-Octave 3D Scalar Field E ∈ [0.0, 1.0])
      // ───────────────────────────────────────────────────────────────────────
      float f1 = sin(aBasePosition.x * 2.2 + aBasePosition.y * 1.8 + uTime * 0.55) * 0.5 + 0.5;
      float f2 = cos(aBasePosition.z * 4.4 - aBasePosition.y * 3.8 + aBasePosition.x * 2.4 + uTime * 0.95) * 0.5 + 0.5;
      float filBase = sin(aBasePosition.x * 13.0 + aBasePosition.y * 9.5 - uTime * 1.6) *
                      cos(aBasePosition.z * 11.0 + aBasePosition.y * 8.0 + uTime * 1.3);
      float filaments = pow(clamp(filBase * 0.5 + 0.5, 0.0, 1.0), 3.5);

      float rawE = f1 * 0.45 + f2 * 0.35 + filaments * 0.65;
      float E = clamp(rawE / 1.40, 0.0, 1.0);

      // Void channels & Isolated Hero Peak Nodes
      float voidMask   = smoothstep(0.20, 0.46, E);
      float islandMask = step(0.50, E);

      float peakSpatial = sin(aBasePosition.x * 33.0 + aBasePosition.y * 41.0 + aBasePosition.z * 37.0) * 0.5 + 0.5;
      float heroPeakSignal = E * (0.60 + peakSpatial * 0.40);
      float heroMask   = step(0.915, heroPeakSignal);

      // ───────────────────────────────────────────────────────────────────────
      // 2. Refined Edge Turbulence & Coherent Tangential Vector Flow Streamlines
      // ───────────────────────────────────────────────────────────────────────
      float lowFreqDeform = sin(aBasePosition.y * 5.0 - uTime * 0.8 + aBasePosition.x * 3.0) * 0.008;
      float medFreqStress = cos(aBasePosition.x * 10.0 + aBasePosition.z * 8.0 + uTime * 1.2) * 0.005;

      // Multi-harmonic edge breakup turbulence
      float edgeBreakup = sin(aBasePosition.x * 24.0 + aBasePosition.y * 32.0 + uTime * 1.8) * 0.005 +
                          cos(aBasePosition.z * 28.0 - uTime * 1.2) * 0.003;
      vec3 radialDisplacement = n * (lowFreqDeform + medFreqStress + edgeBreakup);

      // Tangential vector flow field along surface tangent plane
      vec3 up = vec3(0.0, 1.0, 0.0);
      vec3 tangent = cross(up, n);
      if (length(tangent) < 0.001) tangent = vec3(1.0, 0.0, 0.0);
      else tangent = normalize(tangent);
      vec3 bitangent = cross(n, tangent);

      float flowT1 = sin(aBasePosition.y * 4.5 + aBasePosition.z * 2.5 + uTime * 1.25) * 0.012;
      float flowT2 = cos(aBasePosition.x * 6.5 - aBasePosition.y * 3.0 - uTime * 1.05) * 0.009;
      vec3 tangentialDisplacement = tangent * flowT1 + bitangent * flowT2;

      vec3 pos = aBasePosition + radialDisplacement + tangentialDisplacement;

      vec4  mvPos   = modelViewMatrix * vec4(pos, 1.0);
      vec3  vNorm   = normalize(normalMatrix * n);
      vec3  viewDir = normalize(-mvPos.xyz);

      // ───────────────────────────────────────────────────────────────────────
      // 3. Multi-Layer Rim Structure & Specular Corona Gating
      // Layer 1: Inner Shell Rim Angle | Layer 2: Specular Fresnel Corona | Layer 3: Edge Turbulence Scatter
      // ───────────────────────────────────────────────────────────────────────
      float rimAngle = 1.0 - abs(dot(vNorm, viewDir));
      float rim      = pow(rimAngle, 2.8);
      float rimSpec  = pow(rimAngle, 4.2);
      float depth    = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);

      // Preserved 5-Stop Latitude Color Palette
      float latT = clamp(-aBasePosition.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
      vec3 baseCol;
      if      (latT < 0.25) baseCol = mix(uC0, uC1, smoothstep(0.00, 0.25, latT));
      else if (latT < 0.50) baseCol = mix(uC1, uC2, smoothstep(0.25, 0.50, latT));
      else if (latT < 0.75) baseCol = mix(uC2, uC3, smoothstep(0.50, 0.75, latT));
      else                  baseCol = mix(uC3, uC4, smoothstep(0.75, 1.00, latT));

      float midEnergyRamp = smoothstep(0.42, 0.78, E);
      float targetBrightness = mix(0.45, 0.95, voidMask * (0.35 + midEnergyRamp * 0.65));
      if (heroMask > 0.5) targetBrightness = 1.30;

      if (heroMask > 0.5) {
        vColor = mix(baseCol, vec3(1.35, 1.35, 1.35), 0.60) * targetBrightness;
        vAlpha = 1.0;
      } else {
        vec3 energizedCol = mix(baseCol, vec3(0.70, 0.90, 1.0), filaments * islandMask * 0.40);
        // Multi-Layer Rim Specular Corona blend
        vec3 rimSpecularCol = mix(energizedCol, vec3(1.0, 1.0, 1.0), rimSpec * 0.45);
        vColor = rimSpecularCol * targetBrightness * (0.85 + rim * 0.35);
        vAlpha = (mix(0.42, 0.95, depth) * 0.85 + rim * 0.15) * mix(0.22, 1.0, voidMask);
      }

      // Compact Point Size Hierarchy with Rim Overlap Scaling
      float targetPx = 0.90; // Tiny (65%)
      if (heroMask > 0.5) {
        targetPx = 3.6;      // Isolated Hero Node (<0.8%)
      } else if (E >= 0.72) {
        targetPx = 2.7;      // Large (4%)
      } else if (E >= 0.50) {
        targetPx = 1.95;     // Medium State (10%)
      } else if (E >= 0.34) {
        targetPx = 1.35;     // Small State (20%)
      }

      float rimSizeMultiplier = 1.0 + rim * 0.15;
      float finalPx = targetPx * rimSizeMultiplier;

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

      // Sub-pixel OLED disc anti-aliasing (crisp discs without smooth emissive patches)
      float delta = fwidth(dist);
      float dotCore = smoothstep(0.40 + delta, 0.32 - delta, dist);
      float dotEdge = smoothstep(0.50 + delta, 0.40 - delta, dist) * 0.25;

      float alpha = (dotCore + dotEdge) * vAlpha;
      gl_FragColor = vec4(vColor, alpha);
    }
  `,
};

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 2 — Refined Interior Volumetric Depth (Parallax Depth Layering Without Glow)
// ─────────────────────────────────────────────────────────────────────────────
export const InnerParticleShader = {
  uniforms: {
    uSize:   { value: 1.05 },
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

      // Refined interior volumetric depth ramp
      float volumetricDepthRamp = smoothstep(0.10, 0.90, depth);
      float innerStructureWave = sin(aBasePosition.y * 8.0 + aBasePosition.x * 6.0) * 0.15 + 0.85;

      vAlpha = mix(0.12, 0.44, volumetricDepthRamp) * innerStructureWave;

      gl_PointSize = uSize * (0.80 + volumetricDepthRamp * 0.50) * (5.5 / -mvPos.z);
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
      float alphaEdge = smoothstep(0.42 + delta, 0.34 - delta, dist);

      gl_FragColor = vec4(vColor, alphaEdge * vAlpha);
    }
  `,
};

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 3 — Refined Multi-Layer Rim Corona
// ─────────────────────────────────────────────────────────────────────────────
export const RimParticleShader = {
  uniforms: {
    uSize:   { value: 1.15 },
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

      float edgePerturb = sin(aBasePosition.x * 24.0 + aBasePosition.y * 32.0 + uTime * 1.8) * 0.006;
      vec3 pos = aBasePosition + n * edgePerturb;

      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      vec3 vNorm = normalize(normalMatrix * n);
      vec3 view  = normalize(-mvPos.xyz);

      float rimAngle = 1.0 - abs(dot(vNorm, view));
      float rim      = pow(rimAngle, 3.0);
      float rimSpec  = pow(rimAngle, 4.2);

      float t   = clamp(-aBasePosition.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
      vec3  col = mix(uC0, uC1, t);
      col = mix(col, uC2, rimSpec * 0.35);
      vColor = col * 0.85;

      vAlpha = smoothstep(0.45, 0.92, rim) * 0.75;

      float depth = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);
      vAlpha *= mix(0.35, 1.0, depth);

      gl_PointSize = uSize * 1.1 * (5.5 / -mvPos.z);
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
      float alphaEdge = smoothstep(0.42 + delta, 0.34 - delta, dist);

      gl_FragColor = vec4(vColor, alphaEdge * vAlpha);
    }
  `,
};

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 4 — Refined Detached Atmospheric Satellites (Multi-Harmonic Orbital Drift)
// ─────────────────────────────────────────────────────────────────────────────
export const AtmosphericParticleShader = {
  uniforms: {
    uSize:   { value: 0.95 },
    uRadius: { value: 1.20 },
    uTime:   { value: 0.0 },
    uC0: { value: new THREE.Color('#00E8FF') },
    uC1: { value: new THREE.Color('#7A3CFF') },
    uC2: { value: new THREE.Color('#FF3300') },
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

      // Multi-harmonic orbital drift turbulence
      float drift = sin(uTime * 0.35 + aBasePosition.y * 3.5 + aBasePosition.x * 2.2) * 0.014 +
                    cos(uTime * 0.50 + aBasePosition.z * 4.0) * 0.006;
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

      vAlpha = mix(0.14, 0.24, rim) * mix(0.4, 1.0, depth);

      gl_PointSize = uSize * 0.95 * (5.5 / -mvPos.z);
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
      float alphaEdge = smoothstep(0.42 + delta, 0.34 - delta, dist);

      gl_FragColor = vec4(vColor, alphaEdge * vAlpha);
    }
  `,
};
