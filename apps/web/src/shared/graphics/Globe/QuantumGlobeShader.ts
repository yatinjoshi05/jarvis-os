import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// QUANTUM GLOBE PRODUCTION RENDERER — DENSE ENERGETIC CRISP PARTICLE LATTICE
// Particle-First Baseline: High particle visibility, crisp OLED dot profiles,
// increased energy island count, <1% hero nodes, zero smooth emissive patches.
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
      // 1. High-Density Coherent Energy Islands (Multi-Octave 3D Scalar Field E ∈ [0.0, 1.0])
      // ───────────────────────────────────────────────────────────────────────
      float f1 = sin(aBasePosition.x * 2.2 + aBasePosition.y * 1.8 + uTime * 0.55) * 0.5 + 0.5;
      float f2 = cos(aBasePosition.z * 4.4 - aBasePosition.y * 3.8 + aBasePosition.x * 2.4 + uTime * 0.95) * 0.5 + 0.5;
      float filBase = sin(aBasePosition.x * 13.0 + aBasePosition.y * 9.5 - uTime * 1.6) *
                      cos(aBasePosition.z * 11.0 + aBasePosition.y * 8.0 + uTime * 1.3);
      float filaments = pow(clamp(filBase * 0.5 + 0.5, 0.0, 1.0), 3.5);

      float rawE = f1 * 0.45 + f2 * 0.35 + filaments * 0.65;
      float E = clamp(rawE / 1.40, 0.0, 1.0);

      // ───────────────────────────────────────────────────────────────────────
      // 2. Void Channel Suppression & Discrete Hotspot Islands
      // ───────────────────────────────────────────────────────────────────────
      float voidMask   = smoothstep(0.22, 0.48, E);
      float islandMask = step(0.54, E);
      float heroMask   = step(0.92, E); // Hero activation threshold E > 0.92 (<0.8% visible)

      // ───────────────────────────────────────────────────────────────────────
      // 3. Surface Micro-Displacement (Max 0.015R)
      // ───────────────────────────────────────────────────────────────────────
      float lowFreqDeform = sin(aBasePosition.y * 5.0 - uTime * 0.8 + aBasePosition.x * 3.0) * 0.008;
      float medFreqStress = cos(aBasePosition.x * 10.0 + aBasePosition.z * 8.0 + uTime * 1.2) * 0.005;
      float edgeBreakup   = sin(aBasePosition.x * 18.0 + aBasePosition.y * 24.0 + uTime * 1.4) * 0.004;
      vec3 radialDisplacement = n * (lowFreqDeform + medFreqStress + edgeBreakup);

      vec3 up = vec3(0.0, 1.0, 0.0);
      vec3 tangent = cross(up, n);
      if (length(tangent) < 0.001) tangent = vec3(1.0, 0.0, 0.0);
      else tangent = normalize(tangent);
      vec3 bitangent = cross(n, tangent);

      float flowT1 = sin(aBasePosition.y * 5.0 + uTime * 1.1) * 0.010;
      float flowT2 = cos(aBasePosition.x * 7.0 - uTime * 0.9) * 0.008;
      vec3 tangentialDisplacement = tangent * flowT1 + bitangent * flowT2;

      vec3 pos = aBasePosition + radialDisplacement + tangentialDisplacement;

      vec4  mvPos   = modelViewMatrix * vec4(pos, 1.0);
      vec3  vNorm   = normalize(normalMatrix * n);
      vec3  viewDir = normalize(-mvPos.xyz);

      float rim   = pow(1.0 - abs(dot(vNorm, viewDir)), 2.8);
      float depth = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);

      // ───────────────────────────────────────────────────────────────────────
      // 4. 5-Stop Latitude Palette Integration (Preserved Palette Colors)
      // ───────────────────────────────────────────────────────────────────────
      float latT = clamp(-aBasePosition.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
      vec3 baseCol;
      if      (latT < 0.25) baseCol = mix(uC0, uC1, smoothstep(0.00, 0.25, latT));
      else if (latT < 0.50) baseCol = mix(uC1, uC2, smoothstep(0.25, 0.50, latT));
      else if (latT < 0.75) baseCol = mix(uC2, uC3, smoothstep(0.50, 0.75, latT));
      else                  baseCol = mix(uC3, uC4, smoothstep(0.75, 1.00, latT));

      // Enhanced Particle Visibility: High baseline alpha makes lattice dots dense & crisp across the globe
      float targetBrightness = mix(0.40, 0.95, voidMask * (0.35 + islandMask * 0.65));
      if (heroMask > 0.5) targetBrightness = 1.30;

      if (heroMask > 0.5) {
        vColor = mix(baseCol, vec3(1.35, 1.35, 1.35), 0.55) * targetBrightness;
        vAlpha = 1.0;
      } else {
        vec3 energizedCol = mix(baseCol, vec3(0.70, 0.90, 1.0), filaments * islandMask * 0.40);
        vColor = energizedCol * targetBrightness * (0.85 + rim * 0.30);
        // Minimum alpha 0.20 in void channels ensures all lattice points remain crisp and visible!
        vAlpha = (mix(0.40, 0.95, depth) * 0.85 + rim * 0.15) * mix(0.20, 1.0, voidMask);
      }

      // ───────────────────────────────────────────────────────────────────────
      // 5. Compact Point Size Hierarchy (Tiny: 0.9px, Small: 1.35px, Medium: 2.0px, Large: 2.8px, Hero: 3.6px)
      // ───────────────────────────────────────────────────────────────────────
      float targetPx = 0.90; // Tiny (65%)
      if (heroMask > 0.5) {
        targetPx = 3.6;      // Hero (<0.8%)
      } else if (E >= 0.76) {
        targetPx = 2.8;      // Large (4%)
      } else if (E >= 0.58) {
        targetPx = 2.0;      // Medium (10%)
      } else if (E >= 0.38) {
        targetPx = 1.35;     // Small (20%)
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
// LAYER 2 — Inner Depth Lattice Particles
// ─────────────────────────────────────────────────────────────────────────────
export const InnerParticleShader = {
  uniforms: {
    uSize:   { value: 0.95 },
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

      vAlpha = mix(0.12, 0.35, depth);

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
      float alphaEdge = smoothstep(0.42 + delta, 0.34 - delta, dist);

      gl_FragColor = vec4(vColor, alphaEdge * vAlpha);
    }
  `,
};

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 3 — Particle-Driven Rim Corona
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

      float edgePerturb = sin(aBasePosition.x * 22.0 + aBasePosition.y * 28.0 + uTime * 1.5) * 0.005;
      vec3 pos = aBasePosition + n * edgePerturb;

      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      vec3 vNorm = normalize(normalMatrix * n);
      vec3 view  = normalize(-mvPos.xyz);

      float rim = pow(1.0 - abs(dot(vNorm, view)), 3.0);

      float t   = clamp(-aBasePosition.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
      vec3  col = mix(uC0, uC1, t);
      col = mix(col, uC2, pow(rim, 4.0) * 0.30);
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
// LAYER 4 — Atmosphere Particles (450 Points)
// ─────────────────────────────────────────────────────────────────────────────
export const AtmosphericParticleShader = {
  uniforms: {
    uSize:   { value: 0.95 },
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

      float drift = sin(uTime * 0.25 + aBasePosition.y * 2.5 + aBasePosition.x * 1.8) * 0.010;
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
