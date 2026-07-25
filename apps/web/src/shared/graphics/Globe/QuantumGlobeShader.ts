import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 1 — Surface Energy Particles
// Woven Lat/Long Digital Lattice + Traveling Energy Fields + 1-2% Local Compression
// + Rim Breakup + Broad Latitude Pulses + Coherent Region Brightness + DEBUG MODES (1-6)
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

      // 2. Local compression/expansion bands (1-2% displacement)
      float compression = sin(aBasePosition.y * 14.0 - uTime * 1.2 + aBasePosition.x * 6.0) * 0.012;

      // 3. Rim breakup perturbation (max 0.015 radius)
      float edgeBreakup = sin(aBasePosition.x * 21.0 + aBasePosition.y * 29.0 + uTime * 1.6) * 0.008;

      // 1. Low-frequency 3D energy flow (animating brightness & saturation)
      float energyField1 = sin(aBasePosition.x * 3.5 + aBasePosition.y * 2.8 + uTime * 0.9) * 0.5 + 0.5;
      float energyField2 = cos(aBasePosition.z * 4.2 - aBasePosition.y * 3.1 + uTime * 0.7) * 0.5 + 0.5;
      float coherentVal   = energyField1 * energyField2;
      float coherentBrightness = mix(0.55, 1.45, coherentVal);

      // 5. Broad latitude energy pulses (traveling along y-axis)
      float pulsePhase = mod(uTime * 0.5 - aBasePosition.y * 1.5, 6.28318);
      float latPulse   = pow(sin(pulsePhase) * 0.5 + 0.5, 4.0) * 0.55;

      float totalEnergy = coherentBrightness + latPulse;

      // Position computation based on Debug Mode
      vec3 pos = aBasePosition;
      if (uDebugMode == 1) {
        // Pure un-displaced lattice geometry
        pos = aBasePosition;
      } else if (uDebugMode == 4) {
        // Isolated compression displacement
        pos = aBasePosition + n * compression;
      } else if (uDebugMode == 5) {
        // Isolated rim edge breakup
        pos = aBasePosition + n * edgeBreakup;
      } else {
        // Composite / Energy mode
        pos = aBasePosition + n * (compression + edgeBreakup);
      }

      vec4  mvPos   = modelViewMatrix * vec4(pos, 1.0);
      vec3  vNorm   = normalize(normalMatrix * n);
      vec3  viewDir = normalize(-mvPos.xyz);

      float rim   = pow(1.0 - abs(dot(vNorm, viewDir)), 2.5);
      float depth = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);

      // Smooth continuous latitude gradient (+y Cyan -> -y Orange/Red)
      float t = clamp(-aBasePosition.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
      vec3 col;
      if      (t < 0.20) col = mix(uC0, uC1, smoothstep(0.00, 0.20, t));
      else if (t < 0.40) col = mix(uC1, uC2, smoothstep(0.20, 0.40, t));
      else if (t < 0.60) col = mix(uC2, uC3, smoothstep(0.36, 0.60, t));
      else if (t < 0.80) col = mix(uC3, uC4, smoothstep(0.60, 0.80, t));
      else               col = mix(uC4, uC5, smoothstep(0.80, 1.00, t));

      // Color/Alpha output per Debug Mode
      if (uDebugMode == 1) {
        // 1: Surface lattice only (clean cyan grid)
        vColor = uC0 * mix(0.5, 1.0, depth);
        vAlpha = mix(0.4, 0.9, depth);
      } else if (uDebugMode == 3) {
        // 3: Energy field false-color heatmap (Dark Blue -> Bright Cyan -> White)
        vec3 heatMap = mix(vec3(0.02, 0.08, 0.35), vec3(0.0, 0.95, 1.0), coherentVal);
        heatMap = mix(heatMap, vec3(1.0, 1.0, 1.0), pow(coherentVal, 3.0));
        vColor = heatMap;
        vAlpha = mix(0.3, 1.0, depth);
      } else if (uDebugMode == 4) {
        // 4: Compression field false-color heatmap (Magenta: compressed, Green: expanded)
        float compNorm = compression / 0.012 * 0.5 + 0.5;
        vColor = mix(vec3(1.0, 0.0, 0.8), vec3(0.0, 1.0, 0.4), compNorm);
        vAlpha = mix(0.4, 1.0, depth);
      } else if (uDebugMode == 5) {
        // 5: Rim breakup false-color highlight (Yellow/Red on edge perturbation)
        float edgeNorm = abs(edgeBreakup) / 0.008;
        vec3 edgeHeat  = mix(col, vec3(1.0, 0.9, 0.0), edgeNorm * rim);
        vColor = mix(edgeHeat, vec3(1.0, 0.2, 0.0), pow(rim, 3.0));
        vAlpha = (smoothstep(0.3, 0.9, rim) * 0.85 + 0.15) * mix(0.4, 1.0, depth);
      } else {
        // 6: Final Composite
        vec3 energizedColor = col * totalEnergy;
        energizedColor = mix(energizedColor, col * 1.35, latPulse * 0.45);
        vColor = energizedColor * (0.80 + rim * 0.40);
        vAlpha = (mix(0.25, 0.90, depth) * 0.80 + rim * 0.20) * (0.75 + energyField1 * 0.35);
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
