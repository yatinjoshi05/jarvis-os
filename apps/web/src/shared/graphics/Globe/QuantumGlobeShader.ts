import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// QUANTUM GLOBE PRODUCTION RENDERER — FINAL CONCENTRIC LUMINANCE MATCH
// Target concentric brightness distribution (Reference Ground Truth Image A):
// 1. Outer Rim: 95% (+0%) | Outer Shell: 90% (+0%)
// 2. Upper Mid: 85% (+25%) | Middle: 80% (+30%)
// 3. Inner Shell: 70% (+35%) | Core: 60% (+40%)
// 4. Medium-Energy Particle Visibility +35% | Interior Lattice Visibility 70%
// ─────────────────────────────────────────────────────────────────────────────
export const SurfaceParticleShader = {
  uniforms: {
    uSize:      { value: 1.25 },
    uRadius:    { value: 1.15 },
    uTime:      { value: 0.0 },
    uDebugMode: { value: 6 }, // 1: Lattice, 2: Atmosphere, 3: Energy, 4: Compression, 5: Rim, 6: Composite
    uC0: { value: new THREE.Color('#00E8FF') }, // Top pole (+y) - Electric Cyan
    uC1: { value: new THREE.Color('#3366FF') }, // Upper Mid - Blue
    uC2: { value: new THREE.Color('#8833FF') }, // Centre - Deep Violet
    uC3: { value: new THREE.Color('#E028BB') }, // Lower Mid - Magenta
    uC4: { value: new THREE.Color('#FF3333') }, // Bottom pole (-y) - Vivid Red
    uC5: { value: new THREE.Color('#FF7722') }, // Bottom rim accent - Amber Orange
  },
  vertexShader: /* glsl */`
    uniform float uSize;
    uniform float uRadius;
    uniform float uTime;
    uniform int   uDebugMode;
    uniform vec3  uC0, uC1, uC2, uC3, uC4, uC5;

    attribute vec3 aBasePosition;

    varying vec3  vColor;
    varying float vAlpha;

    void main() {
      vec3 n = normalize(aBasePosition);

      // ───────────────────────────────────────────────────────────────────────
      // 1. Multi-Octave 3D Scalar Field E ∈ [0.0, 1.0]
      // ───────────────────────────────────────────────────────────────────────
      float f1 = sin(aBasePosition.x * 2.2 + aBasePosition.y * 1.8 + uTime * 0.55) * 0.5 + 0.5;
      float f2 = cos(aBasePosition.z * 4.4 - aBasePosition.y * 3.8 + aBasePosition.x * 2.4 + uTime * 0.95) * 0.5 + 0.5;
      float filBase = sin(aBasePosition.x * 13.0 + aBasePosition.y * 9.5 - uTime * 1.6) *
                      cos(aBasePosition.z * 11.0 + aBasePosition.y * 8.0 + uTime * 1.3);
      float filaments = pow(clamp(filBase * 0.5 + 0.5, 0.0, 1.0), 3.5);

      float rawE = f1 * 0.45 + f2 * 0.35 + filaments * 0.65;
      float E = clamp(rawE / 1.40, 0.0, 1.0);

      // Void channels & Isolated Hero Peak Nodes
      float voidMask   = smoothstep(0.16, 0.42, E);
      float islandMask = step(0.46, E);

      float peakSpatial = sin(aBasePosition.x * 33.0 + aBasePosition.y * 41.0 + aBasePosition.z * 37.0) * 0.5 + 0.5;
      float heroPeakSignal = E * (0.60 + peakSpatial * 0.40);
      float heroMask   = step(0.915, heroPeakSignal);

      // ───────────────────────────────────────────────────────────────────────
      // 2. View-Space Radial Edge Wave Displacement (0.045R)
      // ───────────────────────────────────────────────────────────────────────
      vec4  mvPos   = modelViewMatrix * vec4(aBasePosition, 1.0);
      vec3  vNorm   = normalize(normalMatrix * n);
      vec3  viewDir = normalize(-mvPos.xyz);

      float rimAngle = 1.0 - abs(dot(vNorm, viewDir));
      float rim      = pow(rimAngle, 2.8);
      float rimSpec  = pow(rimAngle, 4.2);

      float waveEdge = sin(aBasePosition.x * 16.0 + aBasePosition.y * 22.0 + uTime * 1.6) *
                       cos(aBasePosition.z * 18.0 - uTime * 1.2);
      float radialWave = waveEdge * rim * 0.045;

      vec3 up = vec3(0.0, 1.0, 0.0);
      vec3 tangent = cross(up, n);
      if (length(tangent) < 0.001) tangent = vec3(1.0, 0.0, 0.0);
      else tangent = normalize(tangent);
      vec3 bitangent = cross(n, tangent);

      float flowT1 = sin(aBasePosition.y * 4.5 + aBasePosition.z * 2.5 + uTime * 1.25) * 0.010;
      float flowT2 = cos(aBasePosition.x * 6.5 - aBasePosition.y * 3.0 - uTime * 1.05) * 0.008;
      vec3 tangentialDisplacement = tangent * flowT1 + bitangent * flowT2;

      vec3 pos = aBasePosition + n * radialWave + tangentialDisplacement;

      mvPos   = modelViewMatrix * vec4(pos, 1.0);
      float depth = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);

      // ───────────────────────────────────────────────────────────────────────
      // 3. CONCENTRIC BRIGHTNESS REDISTRIBUTION
      // Outer Rim 95% (+0%) | Outer Shell 90% (+0%) | Upper Mid 85% (+25%)
      // Middle 80% (+30%) | Inner Shell 70% (+35%) | Core 60% (+40%)
      // ───────────────────────────────────────────────────────────────────────
      float latT = clamp(-aBasePosition.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
      vec3 baseCol;
      if      (latT < 0.20) baseCol = mix(uC0, uC1, smoothstep(0.00, 0.20, latT));
      else if (latT < 0.45) baseCol = mix(uC1, uC2, smoothstep(0.20, 0.45, latT));
      else if (latT < 0.70) baseCol = mix(uC2, uC3, smoothstep(0.45, 0.70, latT));
      else if (latT < 0.88) baseCol = mix(uC3, uC4, smoothstep(0.70, 0.88, latT));
      else                  baseCol = mix(uC4, uC5, smoothstep(0.88, 1.00, latT));

      // Elevated centerOcclusion floor to 0.95 (+30% boost to mid, inner & core zones)
      float centerOcclusion = mix(0.95, 1.42, rim);
      float midEnergyRamp   = smoothstep(0.32, 0.72, E);
      float targetBrightness = mix(0.78, 1.25, voidMask * (0.45 + midEnergyRamp * 0.55)) * centerOcclusion;
      if (heroMask > 0.5) targetBrightness = 1.48;

      if (heroMask > 0.5) {
        vColor = mix(baseCol, vec3(1.48, 1.48, 1.48), 0.60) * targetBrightness;
        vAlpha = 1.0;
      } else {
        vec3 energizedCol = mix(baseCol, vec3(0.70, 0.90, 1.0), filaments * islandMask * 0.45);
        vec3 rimSpecularCol = mix(energizedCol, vec3(1.0, 1.0, 1.0), rimSpec * 0.50);
        vColor = rimSpecularCol * targetBrightness;
        // Medium Energy Particle Visibility +35%: alpha floor elevated to 0.50
        vAlpha = (mix(0.72, 0.98, depth) * 0.85 + rim * 0.15) * mix(0.50, 1.0, voidMask);
      }

      // Point Sizing (Preserved Crisp Particle Scaling)
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

      float rimSizeMultiplier = 1.0 + rim * 0.25;
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
// LAYER 2 — Interior Volumetric Depth (Core Brightness 60%, Target Visibility 70%)
// ─────────────────────────────────────────────────────────────────────────────
export const InnerParticleShader = {
  uniforms: {
    uSize:   { value: 1.05 },
    uRadius: { value: 0.82 },
    uC0: { value: new THREE.Color('#0044BB') }, // Vivid Midnight Blue
    uC1: { value: new THREE.Color('#6611BB') }, // Deep Purple
    uC2: { value: new THREE.Color('#881166') }, // Magenta Core
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
      // Core Brightness +40% (Target 60%): emission multiplier boosted to 1.50
      vColor    = col * 1.50;

      vec4  mvPos = modelViewMatrix * vec4(aBasePosition, 1.0);
      float depth = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);

      float volumetricDepthRamp = smoothstep(0.10, 0.90, depth);
      float innerStructureWave = sin(aBasePosition.y * 8.0 + aBasePosition.x * 6.0) * 0.15 + 0.85;

      // Interior Lattice Visibility Target 70%: alpha ramp elevated to 0.55 - 0.85
      vAlpha = mix(0.55, 0.85, volumetricDepthRamp) * innerStructureWave;

      gl_PointSize = uSize * (0.85 + volumetricDepthRamp * 0.45) * (5.5 / -mvPos.z);
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
// LAYER 3 — Organic Rim Corona (Target Brightness 95%, Preserved)
// ─────────────────────────────────────────────────────────────────────────────
export const RimParticleShader = {
  uniforms: {
    uSize:   { value: 1.25 },
    uRadius: { value: 1.16 },
    uTime:   { value: 0.0 },
    uC0: { value: new THREE.Color('#00E8FF') }, // Top Cyan
    uC1: { value: new THREE.Color('#E028BB') }, // Magenta
    uC2: { value: new THREE.Color('#FF4422') }, // Red/Orange
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

      vec4 mvPos = modelViewMatrix * vec4(aBasePosition, 1.0);
      vec3 vNorm = normalize(normalMatrix * n);
      vec3 view  = normalize(-mvPos.xyz);

      float rimAngle = 1.0 - abs(dot(vNorm, view));
      float rim      = pow(rimAngle, 2.5);

      float wavePattern = sin(aBasePosition.x * 14.0 + aBasePosition.y * 18.0 + uTime * 1.5) *
                          cos(aBasePosition.z * 16.0 - uTime * 1.1);
      float rimDisplacement = wavePattern * rim * 0.055;
      vec3 pos = aBasePosition + n * rimDisplacement;

      mvPos = modelViewMatrix * vec4(pos, 1.0);

      float t   = clamp(-aBasePosition.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
      vec3  col = mix(uC0, uC1, smoothstep(0.0, 0.6, t));
      col = mix(col, uC2, smoothstep(0.6, 1.0, t));
      vColor = col * (1.15 + pow(rimAngle, 4.0) * 0.55);

      vAlpha = smoothstep(0.30, 0.90, rim) * 0.92;

      float depth = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);
      vAlpha *= mix(0.40, 1.0, depth);

      gl_PointSize = uSize * (1.0 + rim * 0.40) * (5.5 / -mvPos.z);
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
// LAYER 4 — Detached Atmospheric Spray
// ─────────────────────────────────────────────────────────────────────────────
export const AtmosphericParticleShader = {
  uniforms: {
    uSize:   { value: 1.0 },
    uRadius: { value: 1.20 },
    uTime:   { value: 0.0 },
    uC0: { value: new THREE.Color('#00E8FF') },
    uC1: { value: new THREE.Color('#8833FF') },
    uC2: { value: new THREE.Color('#FF3344') },
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

      float drift = sin(uTime * 0.35 + aBasePosition.y * 3.5 + aBasePosition.x * 2.2) * 0.016 +
                    cos(uTime * 0.50 + aBasePosition.z * 4.0) * 0.008;
      vec3 pos = aBasePosition + n * drift;

      float t = clamp(-aBasePosition.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
      vec3 col = mix(uC0, uC1, smoothstep(0.0, 0.5, t));
      col = mix(col, uC2, smoothstep(0.5, 1.0, t));
      vColor = col * 0.90;

      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      vec3 vNorm = normalize(normalMatrix * n);
      vec3 view  = normalize(-mvPos.xyz);

      float rim   = pow(1.0 - abs(dot(vNorm, view)), 1.8);
      float depth = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);

      vAlpha = mix(0.18, 0.35, rim) * mix(0.4, 1.0, depth);

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
