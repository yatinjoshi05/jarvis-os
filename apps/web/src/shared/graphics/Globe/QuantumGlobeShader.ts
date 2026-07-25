import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 1 — Surface Energy Particles
// Dense Fibonacci shell. 6-stop vertical color gradient (Cyan/Blue -> Violet/Magenta -> Pink/Orange).
// ─────────────────────────────────────────────────────────────────────────────
export const SurfaceParticleShader = {
  uniforms: {
    uSize:   { value: 3.0 },
    uRadius: { value: 1.15 },
    uTime:   { value: 0.0 },
    uC0: { value: new THREE.Color('#00EEFF') }, // Cyan bottom
    uC1: { value: new THREE.Color('#0044FF') }, // Blue
    uC2: { value: new THREE.Color('#7700FF') }, // Violet
    uC3: { value: new THREE.Color('#CC00BB') }, // Magenta/Purple
    uC4: { value: new THREE.Color('#FF0080') }, // Pink
    uC5: { value: new THREE.Color('#FF3300') }, // Orange top
  },
  vertexShader: /* glsl */`
    uniform float uSize;
    uniform float uRadius;
    uniform float uTime;
    uniform vec3 uC0, uC1, uC2, uC3, uC4, uC5;

    attribute float aSizeScale;
    attribute vec3  aBasePosition;

    varying vec3  vColor;
    varying float vAlpha;

    void main() {
      vec3 n = normalize(aBasePosition);

      // 1. Low-frequency procedural wave breathing deformation
      float breathe = sin(uTime * 0.4 + aBasePosition.y * 1.8) * 0.015;

      // 2. Local particle turbulence
      float turb1 = sin(aBasePosition.x * 8.0 + uTime * 1.2) * cos(aBasePosition.z * 7.5 - uTime * 0.9);
      float turb2 = cos(aBasePosition.y * 9.5 + uTime * 1.4) * sin(aBasePosition.x * 6.2 + uTime * 1.1);
      float turbulence = (turb1 + turb2) * 0.012;

      // 3. Micro particle escape
      float escapeSeed = sin(aBasePosition.x * 17.3 + aBasePosition.y * 31.7 + aBasePosition.z * 13.1);
      float microEscape = pow(clamp(sin(escapeSeed * 6.0 + uTime * 1.8), 0.0, 1.0), 6.0) * 0.038;

      // 5. Energy ripples
      float ripple = sin(aBasePosition.y * 12.0 - uTime * 2.2 + aBasePosition.x * 4.0) * 0.009;

      // Dynamic surface position displacement
      vec3 pos = aBasePosition + n * (breathe + turbulence + microEscape + ripple);

      // 4. Density variation modulating point size dynamically
      float densityWave = sin(aBasePosition.y * 4.0 - aBasePosition.x * 3.0 + uTime * 0.8) * 0.15 + 1.0;

      // Vertical color — 6 stops mapped to sphere latitude
      float t = clamp(aBasePosition.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
      vec3 col;
      if      (t < 0.18) col = mix(uC0, uC1, smoothstep(0.00, 0.18, t));
      else if (t < 0.36) col = mix(uC1, uC2, smoothstep(0.18, 0.36, t));
      else if (t < 0.54) col = mix(uC2, uC3, smoothstep(0.36, 0.54, t));
      else if (t < 0.72) col = mix(uC3, uC4, smoothstep(0.54, 0.72, t));
      else               col = mix(uC4, uC5, smoothstep(0.72, 1.00, t));

      vec4  mvPos   = modelViewMatrix * vec4(pos, 1.0);
      vec3  vNorm   = normalize(normalMatrix * n);
      vec3  viewDir = normalize(-mvPos.xyz);

      float rim = pow(1.0 - abs(dot(vNorm, viewDir)), 2.2);

      // Depth: back particles fade but remain individually visible
      float depth  = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);
      float dAlpha = mix(0.18, 0.88, depth);
      float dScale = mix(0.50, 1.00, depth);

      col    = col * (0.85 + rim * 0.45);
      vColor = col;

      vAlpha = dAlpha * 0.85 + rim * 0.15;

      float rimBoost = 1.0 + rim * 0.35;
      gl_PointSize = uSize * aSizeScale * dScale * rimBoost * densityWave * (6.0 / -mvPos.z);
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

      // Hardware Sub-Pixel Anti-Aliased Sharp Core + Tight Micro Glow Profile
      float delta = fwidth(dist);

      // Razor-sharp solid core edge using screen-space derivative anti-aliasing
      float coreEdge = smoothstep(0.38 + delta, 0.38 - delta, dist);

      // Tight sub-pixel light dispersion halo
      float halo = smoothstep(0.48 + delta, 0.38, dist) * 0.35;

      float alpha = (coreEdge + halo) * vAlpha;

      // High local contrast HDR core center boost
      vec3 finalColor = mix(vColor, vec3(1.0), coreEdge * 0.30);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `,
};

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 2 — Inner Sparse Particles
// Smaller radius, slightly more visible — creates perceivable 3D interior depth.
// ─────────────────────────────────────────────────────────────────────────────
export const InnerParticleShader = {
  uniforms: {
    uSize:   { value: 1.3 },
    uRadius: { value: 0.82 },
    uC0: { value: new THREE.Color('#0033CC') },
    uC1: { value: new THREE.Color('#6600CC') },
    uC2: { value: new THREE.Color('#AA0066') },
  },
  vertexShader: /* glsl */`
    uniform float uSize;
    uniform float uRadius;
    uniform vec3  uC0, uC1, uC2;

    attribute float aSizeScale;
    attribute vec3  aBasePosition;

    varying vec3  vColor;
    varying float vAlpha;

    void main() {
      float t = clamp(aBasePosition.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
      vec3  col = mix(uC0, uC1, smoothstep(0.0, 0.5, t));
      col       = mix(col, uC2, smoothstep(0.5, 1.0, t));
      vColor    = col;

      vec4  mvPos = modelViewMatrix * vec4(aBasePosition, 1.0);
      float depth = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);

      vAlpha = mix(0.05, 0.32, depth) * aSizeScale;

      gl_PointSize = uSize * aSizeScale * (5.5 / -mvPos.z);
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
      float coreEdge = smoothstep(0.38 + delta, 0.38 - delta, dist);
      float halo = smoothstep(0.48 + delta, 0.38, dist) * 0.30;

      float alpha = (coreEdge + halo) * vAlpha;
      gl_FragColor = vec4(vColor, alpha);
    }
  `,
};

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 3 — Rim Particle Clusters
// Particles whose alpha is ONLY non-zero when they are near the view-space edge.
// ─────────────────────────────────────────────────────────────────────────────
export const RimParticleShader = {
  uniforms: {
    uSize:   { value: 2.2 },
    uRadius: { value: 1.16 },
    uTime:   { value: 0.0 },
    uC0: { value: new THREE.Color('#60FFFF') }, // Bright cyan
    uC1: { value: new THREE.Color('#FF40C0') }, // Bright pink
    uC2: { value: new THREE.Color('#FFFFFF') }, // Near-white hot center
  },
  vertexShader: /* glsl */`
    uniform float uSize;
    uniform float uRadius;
    uniform float uTime;
    uniform vec3  uC0, uC1, uC2;

    attribute float aSizeScale;
    attribute vec3  aBasePosition;

    varying vec3  vColor;
    varying float vAlpha;

    void main() {
      vec3 n = normalize(aBasePosition);

      float breathe = sin(uTime * 0.4 + aBasePosition.y * 1.8) * 0.015;
      float turbulence = sin(aBasePosition.x * 7.5 + uTime * 1.3) * cos(aBasePosition.y * 6.2 - uTime * 1.1) * 0.012;
      float microEscape = pow(clamp(sin(aBasePosition.x * 19.1 + aBasePosition.z * 11.3 + uTime * 1.7), 0.0, 1.0), 7.0) * 0.035;

      vec3 pos = aBasePosition + n * (breathe + turbulence + microEscape);

      vec4  mvPos   = modelViewMatrix * vec4(pos, 1.0);
      vec3  vNorm   = normalize(normalMatrix * n);
      vec3  viewDir = normalize(-mvPos.xyz);

      float rim = pow(1.0 - abs(dot(vNorm, viewDir)), 3.5);

      float t   = clamp(aBasePosition.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
      vec3  col = mix(uC0, uC1, t);
      col = mix(col, uC2, pow(rim, 5.0) * 0.5);
      vColor = col;

      vAlpha = smoothstep(0.45, 0.92, rim) * 0.80;

      float depth = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);
      vAlpha *= mix(0.3, 1.0, depth);

      float rimBoost = 1.0 + rim * 0.6;
      gl_PointSize = uSize * aSizeScale * rimBoost * (6.5 / -mvPos.z);
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
      float coreEdge = smoothstep(0.40 + delta, 0.40 - delta, dist);
      float halo = smoothstep(0.49 + delta, 0.40, dist) * 0.40;

      float alpha = (coreEdge + halo) * vAlpha;
      vec3 finalColor = mix(vColor, vec3(1.0), coreEdge * 0.45);

      gl_FragColor = vec4(finalColor, alpha);
    }
  `,
};

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 4 — Detached Atmospheric Particles
// Outside the sphere (R 1.25–1.55). Very sparse. Pure ionized energy feeling.
// ─────────────────────────────────────────────────────────────────────────────
export const AtmosphericParticleShader = {
  uniforms: {
    uSize:   { value: 1.3 },
    uRadius: { value: 1.38 },
    uC0: { value: new THREE.Color('#00CCFF') },
    uC1: { value: new THREE.Color('#4400FF') },
    uC2: { value: new THREE.Color('#8800CC') },
  },
  vertexShader: /* glsl */`
    uniform float uSize;
    uniform float uRadius;
    uniform vec3  uC0, uC1, uC2;

    attribute float aSizeScale;
    attribute vec3  aBasePosition;

    varying vec3  vColor;
    varying float vAlpha;

    void main() {
      float t   = clamp(aBasePosition.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
      vec3  col = mix(uC0, uC1, smoothstep(0.0, 0.5, t));
      col       = mix(col, uC2, smoothstep(0.5, 1.0, t));
      vColor    = col;

      vec4  mvPos = modelViewMatrix * vec4(aBasePosition, 1.0);
      vec3  n     = normalize(aBasePosition);
      vec3  vNorm = normalize(normalMatrix * n);
      vec3  view  = normalize(-mvPos.xyz);

      float rim   = pow(1.0 - abs(dot(vNorm, view)), 1.5);
      float depth = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);

      vAlpha = (0.04 + rim * 0.18) * mix(0.2, 1.0, depth) * aSizeScale;

      gl_PointSize = uSize * aSizeScale * (5.5 / -mvPos.z);
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
      float coreEdge = smoothstep(0.38 + delta, 0.38 - delta, dist);
      float halo = smoothstep(0.48 + delta, 0.38, dist) * 0.30;

      float alpha = (coreEdge + halo) * vAlpha;
      gl_FragColor = vec4(vColor, alpha);
    }
  `,
};
