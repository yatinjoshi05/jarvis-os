import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// QUANTUM GLOBE PRODUCTION RENDERER — SINGLE CONTINUOUS ENERGY FIELD SHADER ENGINE
// Pipeline: Energy Field -> Contrast Quantization -> Energy Clusters -> State Classification
//           -> Colour -> Point Size -> Alpha -> Hero Activation -> Bloom
// ─────────────────────────────────────────────────────────────────────────────
export const SurfaceParticleShader = {
  uniforms: {
    uSize:      { value: 2.0 },
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

    attribute vec3  aBasePosition;

    varying vec3  vColor;
    varying float vAlpha;

    void main() {
      vec3 n = normalize(aBasePosition);

      // ───────────────────────────────────────────────────────────────────────
      // PHASE 1: UNIFIED CONTINUOUS 3D SCALAR ENERGY FIELD (E ∈ [0.0, 1.0])
      // ───────────────────────────────────────────────────────────────────────
      float e1 = sin(aBasePosition.x * 1.8 + aBasePosition.y * 1.4 + uTime * 0.5) * 0.5 + 0.5;
      float e2 = cos(aBasePosition.z * 4.2 - aBasePosition.y * 3.6 + aBasePosition.x * 2.1 + uTime * 0.9) * 0.5 + 0.5;
      float filBase = sin(aBasePosition.x * 13.0 + aBasePosition.y * 10.0 - uTime * 1.8) *
                      cos(aBasePosition.z * 11.0 + aBasePosition.y * 8.0 + uTime * 1.4);
      float e3 = pow(clamp(filBase * 0.5 + 0.5, 0.0, 1.0), 4.0);

      float rawE = e1 * 0.40 + e2 * 0.35 + e3 * 0.65;
      float E = clamp(rawE / 1.40, 0.0, 1.0);

      // ───────────────────────────────────────────────────────────────────────
      // PHASE 2: CONTRAST QUANTIZATION (Discrete Hotspots & Dark Void Channels)
      // ───────────────────────────────────────────────────────────────────────
      float islandMask = step(0.56, E);
      float voidMask   = smoothstep(0.25, 0.52, E);
      float heroMask   = step(0.80, E);

      // ───────────────────────────────────────────────────────────────────────
      // PHASE 3 & 4: PARTICLE STATE CLASSIFICATION & ADAPTIVE POINT SIZING
      // ───────────────────────────────────────────────────────────────────────
      float baseStateScale = mix(0.70, 2.40, smoothstep(0.35, 0.80, E));
      if (heroMask > 0.5) baseStateScale = 3.60;

      float stateBrightness = mix(0.40, 1.60, smoothstep(0.30, 0.80, E));
      if (heroMask > 0.5) stateBrightness = 2.50;

      // ───────────────────────────────────────────────────────────────────────
      // PHASE 5: TANGENTIAL VECTOR DISPLACEMENT & RIM PERTURBATION
      // ───────────────────────────────────────────────────────────────────────
      vec3 up = vec3(0.0, 1.0, 0.0);
      vec3 tangent = cross(up, n);
      if (length(tangent) < 0.001) tangent = vec3(1.0, 0.0, 0.0);
      else tangent = normalize(tangent);
      vec3 bitangent = cross(n, tangent);

      float flowT1 = sin(aBasePosition.y * 6.0 + uTime * 1.3) * 0.015;
      float flowT2 = cos(aBasePosition.x * 8.0 - uTime * 1.1) * 0.012;
      vec3 tangentialDisplacement = tangent * flowT1 + bitangent * flowT2;

      float compression = sin(aBasePosition.y * 14.0 - uTime * 1.2 + aBasePosition.x * 6.0) * 0.012;
      float edgeBreakup = sin(aBasePosition.x * 21.0 + aBasePosition.y * 29.0 + uTime * 1.6) * 0.008;
      vec3 radialDisplacement = n * (compression + edgeBreakup);

      vec3 pos = aBasePosition + radialDisplacement + tangentialDisplacement;

      vec4  mvPos   = modelViewMatrix * vec4(pos, 1.0);
      vec3  vNorm   = normalize(normalMatrix * n);
      vec3  viewDir = normalize(-mvPos.xyz);

      // PHASE 5: View-Space Rim Angle & Specular Density Corona
      float rim   = pow(1.0 - abs(dot(vNorm, viewDir)), 2.5);
      float depth = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);

      // Base latitude color palette
      float t = clamp(-aBasePosition.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
      vec3 baseCol;
      if      (t < 0.20) baseCol = mix(uC0, uC1, smoothstep(0.00, 0.20, t));
      else if (t < 0.40) baseCol = mix(uC1, uC2, smoothstep(0.20, 0.40, t));
      else if (t < 0.60) baseCol = mix(uC2, uC3, smoothstep(0.36, 0.60, t));
      else if (t < 0.80) baseCol = mix(uC3, uC4, smoothstep(0.60, 0.80, t));
      else               baseCol = mix(uC4, uC5, smoothstep(0.80, 1.00, t));

      // Hero Ignition vs Rim Accumulation
      if (heroMask > 0.5) {
        vColor = vec3(2.2, 2.2, 2.2);
        vAlpha = 1.0;
      } else {
        vec3 energizedCol = mix(baseCol, vec3(0.85, 1.0, 1.0), e3 * islandMask * 0.60);
        vec3 rimSpecularCol = mix(energizedCol, vec3(1.0, 1.0, 1.0), pow(rim, 3.2) * 0.50);
        vColor = rimSpecularCol * stateBrightness * (0.80 + rim * 0.50);
        vAlpha = (mix(0.12, 0.95, depth) * 0.80 + rim * 0.30) * mix(0.15, 1.0, voidMask);
      }

      // PHASE 5: Thick Rim Corona via Overlapping Point Geometry Scaling
      float rimSizeBoost = 1.0 + rim * 0.70;
      gl_PointSize = uSize * baseStateScale * rimSizeBoost * (6.0 / -mvPos.z);
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
      vec3 finalColor = mix(vColor, vec3(1.0), alphaEdge * 0.25);

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
// LAYER 4 — Detached Atmospheric Particles
// ─────────────────────────────────────────────────────────────────────────────
export const AtmosphericParticleShader = {
  uniforms: {
    uSize:   { value: 1.0 },
    uRadius: { value: 1.25 },
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

      float drift = sin(uTime * 0.3 + aBasePosition.y * 3.0 + aBasePosition.x * 2.0) * 0.018;
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

      vAlpha = smoothstep(0.35, 0.90, rim) * 0.40 * mix(0.3, 1.0, depth);

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
