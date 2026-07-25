import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 1 — Surface Energy Particles
// Multi-Octave Spectral Energy Field (Global Macro Flow + Medium Rotational Flow
// + High-Frequency Filaments) + Tangential Vector Flow + Energy-Driven Color
// ─────────────────────────────────────────────────────────────────────────────
export const SurfaceParticleShader = {
  uniforms: {
    uSize:      { value: 2.2 },
    uRadius:    { value: 1.15 },
    uTime:      { value: 0.0 },
    uDebugMode: { value: 6 }, // 1: Lattice, 2: Atmosphere, 3: Energy, 4: Compression, 5: Rim, 6: Composite
    uC0: { value: new THREE.Color('#00EEFF') }, // Cyan top pole (+y)
    uC1: { value: new THREE.Color('#0044FF') }, // Blue
    uC2: { value: new THREE.Color('#7700FF') }, // Violet
    uC3: { value: new THREE.Color('#CC00BB') }, // Magenta/Purple
    uC4: { value: new THREE.Color('#FF0080') }, // Pink
    uC5: { value: new THREE.Color('#FF3300') }, // Orange/Red bottom pole (-y)
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
      // 1. Multi-Octave Spectral Energy Field Computation
      // ───────────────────────────────────────────────────────────────────────
      // Octave 1: Low-Frequency Global Macro Flow (f ~ 1.8)
      float f1 = sin(aBasePosition.x * 1.8 + aBasePosition.y * 1.4 + uTime * 0.6) * 0.5 + 0.5;

      // Octave 2: Medium-Frequency Rotational Directional Current (f ~ 4.5)
      float f2 = cos(aBasePosition.z * 4.5 - aBasePosition.y * 3.8 + aBasePosition.x * 2.2 + uTime * 1.1) * 0.5 + 0.5;

      // Octave 3: High-Frequency Sharp Energy Filaments (f ~ 14.0 with power exponent 5.0)
      float filamentBase = sin(aBasePosition.x * 14.0 + aBasePosition.y * 11.0 - uTime * 2.0) *
                           cos(aBasePosition.z * 12.0 + aBasePosition.y * 9.0 + uTime * 1.5);
      float filaments = pow(clamp(filamentBase * 0.5 + 0.5, 0.0, 1.0), 5.0);

      // Total multi-scale energy magnitude
      float energyMag = f1 * 0.45 + f2 * 0.35 + filaments * 0.75;

      // ───────────────────────────────────────────────────────────────────────
      // 2. Tangential Flow Vector Field (1-2% Surface Displacement)
      // ───────────────────────────────────────────────────────────────────────
      vec3 up = vec3(0.0, 1.0, 0.0);
      vec3 tangent = cross(up, n);
      if (length(tangent) < 0.001) tangent = vec3(1.0, 0.0, 0.0);
      else tangent = normalize(tangent);
      vec3 bitangent = cross(n, tangent);

      // Surface flow vector displacement along local tangent plane (1-2% radius)
      float flowT1 = sin(aBasePosition.y * 6.0 + uTime * 1.3) * 0.015;
      float flowT2 = cos(aBasePosition.x * 8.0 - uTime * 1.1) * 0.012;
      vec3 tangentialDisplacement = tangent * flowT1 + bitangent * flowT2;

      // Radial compression (1-2%) & rim edge breakup (0.015 max)
      float compression = sin(aBasePosition.y * 14.0 - uTime * 1.2 + aBasePosition.x * 6.0) * 0.012;
      float edgeBreakup = sin(aBasePosition.x * 21.0 + aBasePosition.y * 29.0 + uTime * 1.6) * 0.008;
      vec3 radialDisplacement = n * (compression + edgeBreakup);

      // Position selection based on Debug Mode
      vec3 pos = aBasePosition;
      if (uDebugMode == 1) {
        pos = aBasePosition;
      } else if (uDebugMode == 4) {
        pos = aBasePosition + radialDisplacement;
      } else if (uDebugMode == 5) {
        pos = aBasePosition + n * edgeBreakup;
      } else {
        pos = aBasePosition + radialDisplacement + tangentialDisplacement;
      }

      vec4  mvPos   = modelViewMatrix * vec4(pos, 1.0);
      vec3  vNorm   = normalize(normalMatrix * n);
      vec3  viewDir = normalize(-mvPos.xyz);

      float rim   = pow(1.0 - abs(dot(vNorm, viewDir)), 2.5);
      float depth = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);

      // ───────────────────────────────────────────────────────────────────────
      // 3. Dynamic Energy-Driven Color & Luminance Modulation
      // ───────────────────────────────────────────────────────────────────────
      float t = clamp(-aBasePosition.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
      vec3 baseCol;
      if      (t < 0.20) baseCol = mix(uC0, uC1, smoothstep(0.00, 0.20, t));
      else if (t < 0.40) baseCol = mix(uC1, uC2, smoothstep(0.20, 0.40, t));
      else if (t < 0.60) baseCol = mix(uC2, uC3, smoothstep(0.36, 0.60, t));
      else if (t < 0.80) baseCol = mix(uC3, uC4, smoothstep(0.60, 0.80, t));
      else               baseCol = mix(uC4, uC5, smoothstep(0.80, 1.00, t));

      // Dynamically shift color toward hot cyan/white filament energy peak
      vec3 energizedCol = mix(baseCol, vec3(0.85, 1.0, 1.0), filaments * 0.70);
      energizedCol *= (0.65 + energyMag * 0.85);

      if (uDebugMode == 1) {
        vColor = uC0 * mix(0.5, 1.0, depth);
        vAlpha = mix(0.4, 0.9, depth);
      } else if (uDebugMode == 3) {
        // Multi-octave energy false-color heatmap
        vec3 heatMap = mix(vec3(0.02, 0.08, 0.35), vec3(0.0, 0.95, 1.0), energyMag / 1.5);
        heatMap = mix(heatMap, vec3(1.0, 1.0, 1.0), filaments);
        vColor = heatMap;
        vAlpha = mix(0.3, 1.0, depth);
      } else if (uDebugMode == 4) {
        float compNorm = compression / 0.012 * 0.5 + 0.5;
        vColor = mix(vec3(1.0, 0.0, 0.8), vec3(0.0, 1.0, 0.4), compNorm);
        vAlpha = mix(0.4, 1.0, depth);
      } else if (uDebugMode == 5) {
        float edgeNorm = abs(edgeBreakup) / 0.008;
        vec3 edgeHeat  = mix(baseCol, vec3(1.0, 0.9, 0.0), edgeNorm * rim);
        vColor = mix(edgeHeat, vec3(1.0, 0.2, 0.0), pow(rim, 3.0));
        vAlpha = (smoothstep(0.3, 0.9, rim) * 0.85 + 0.15) * mix(0.4, 1.0, depth);
      } else {
        // Composite Mode
        vColor = energizedCol * (0.80 + rim * 0.40);
        vAlpha = (mix(0.25, 0.90, depth) * 0.80 + rim * 0.20) * (0.65 + energyMag * 0.45);
      }

      // Constant point size: gl_PointSize = uSize * attenuation
      gl_PointSize = uSize * (6.0 / -mvPos.z);
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

      // Sub-pixel derivative anti-aliasing for tiny OLED pixel discs
      float delta = fwidth(dist);
      float alphaEdge = smoothstep(0.44 + delta, 0.44 - delta, dist);

      float alpha = alphaEdge * vAlpha;
      vec3 finalColor = mix(vColor, vec3(1.0), alphaEdge * 0.20);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `,
};

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 2 — Inner Depth Lattice Particles
// ─────────────────────────────────────────────────────────────────────────────
export const InnerParticleShader = {
  uniforms: {
    uSize:   { value: 1.2 },
    uRadius: { value: 0.82 },
    uC0: { value: new THREE.Color('#0033CC') },
    uC1: { value: new THREE.Color('#6600CC') },
    uC2: { value: new THREE.Color('#AA0066') },
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
      vColor    = col;

      vec4  mvPos = modelViewMatrix * vec4(aBasePosition, 1.0);
      float depth = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);

      vAlpha = mix(0.08, 0.35, depth);

      gl_PointSize = uSize * (5.5 / -mvPos.z);
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
// LAYER 3 — Rim Lattice Particles
// ─────────────────────────────────────────────────────────────────────────────
export const RimParticleShader = {
  uniforms: {
    uSize:   { value: 1.8 },
    uRadius: { value: 1.16 },
    uTime:   { value: 0.0 },
    uC0: { value: new THREE.Color('#60FFFF') },
    uC1: { value: new THREE.Color('#FF40C0') },
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

      // Subtle edge perturbation for natural rim breakup
      float edgePerturb = sin(aBasePosition.x * 25.0 + aBasePosition.y * 31.0 + uTime * 1.8) * 0.012;
      vec3 pos = aBasePosition + n * edgePerturb;

      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      vec3 vNorm = normalize(normalMatrix * n);
      vec3 view  = normalize(-mvPos.xyz);

      float rim = pow(1.0 - abs(dot(vNorm, view)), 2.8);

      float t   = clamp(-aBasePosition.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
      vec3  col = mix(uC0, uC1, t);
      col = mix(col, uC2, pow(rim, 4.0) * 0.50);
      vColor = col;

      vAlpha = smoothstep(0.40, 0.88, rim) * 0.80;

      float depth = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);
      vAlpha *= mix(0.35, 1.0, depth);

      gl_PointSize = uSize * (6.0 / -mvPos.z);
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
// LAYER 4 — Detached Atmospheric Particles (2,000 particles, r: 1.03 - 1.12)
// Slow drift, very low alpha, crisp OLED discs near the rim.
// ─────────────────────────────────────────────────────────────────────────────
export const AtmosphericParticleShader = {
  uniforms: {
    uSize:   { value: 1.0 },
    uRadius: { value: 1.10 },
    uTime:   { value: 0.0 },
    uC0: { value: new THREE.Color('#00EEFF') },
    uC1: { value: new THREE.Color('#7700FF') },
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

      // Slow drift near surface (r: 1.03 - 1.12)
      float drift = sin(uTime * 0.3 + aBasePosition.y * 3.0 + aBasePosition.x * 2.0) * 0.015;
      vec3 pos = aBasePosition + n * drift;

      float t = clamp(-aBasePosition.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
      vec3 col = mix(uC0, uC1, smoothstep(0.0, 0.5, t));
      col = mix(col, uC2, smoothstep(0.5, 1.0, t));
      vColor = col;

      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      vec3 vNorm = normalize(normalMatrix * n);
      vec3 view  = normalize(-mvPos.xyz);

      float rim   = pow(1.0 - abs(dot(vNorm, view)), 1.8);
      float depth = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);

      // Very low alpha, visible primarily near the rim silhouette
      vAlpha = smoothstep(0.35, 0.90, rim) * 0.35 * mix(0.3, 1.0, depth);

      gl_PointSize = uSize * (5.0 / -mvPos.z);
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
