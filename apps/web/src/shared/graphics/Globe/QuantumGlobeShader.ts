import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 1 — Surface Energy Particles
// Woven Lat/Long Digital Lattice. 6-stop vertical color gradient (Cyan TOP -> Orange/Red BOTTOM).
// Position animation strictly static (< 0.5% radius). Light/alpha wave animation.
// Point size strictly constant: gl_PointSize = uSize * (6.0 / -mvPos.z).
// Fragment shader: Sub-pixel OLED pixel disc, zero blob halo.
// ─────────────────────────────────────────────────────────────────────────────
export const SurfaceParticleShader = {
  uniforms: {
    uSize:   { value: 2.2 },
    uRadius: { value: 1.15 },
    uTime:   { value: 0.0 },
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
    uniform vec3 uC0, uC1, uC2, uC3, uC4, uC5;

    attribute vec3 aBasePosition;

    varying vec3  vColor;
    varying float vAlpha;

    void main() {
      vec3 n = normalize(aBasePosition);

      // Micro surface position breathing strictly < 0.5% radius for stable geometry
      float microPulse = sin(uTime * 0.5 + aBasePosition.y * 2.0) * 0.003;
      vec3 pos = aBasePosition + n * microPulse;

      // Traveling light waves across grid vertices (animating light, not geometry)
      float wave1 = sin(aBasePosition.y * 8.0 - uTime * 1.8 + aBasePosition.x * 4.0) * 0.5 + 0.5;
      float wave2 = cos(aBasePosition.z * 10.0 + uTime * 1.4 - aBasePosition.y * 3.0) * 0.5 + 0.5;
      float lightPulse = mix(0.75, 1.25, wave1 * wave2);

      // Smooth continuous latitude gradient (+y Cyan -> -y Orange/Red)
      float t = clamp(-aBasePosition.y / uRadius * 0.5 + 0.5, 0.0, 1.0);
      vec3 col;
      if      (t < 0.20) col = mix(uC0, uC1, smoothstep(0.00, 0.20, t));
      else if (t < 0.40) col = mix(uC1, uC2, smoothstep(0.20, 0.40, t));
      else if (t < 0.60) col = mix(uC2, uC3, smoothstep(0.40, 0.60, t));
      else if (t < 0.80) col = mix(uC3, uC4, smoothstep(0.60, 0.80, t));
      else               col = mix(uC4, uC5, smoothstep(0.80, 1.00, t));

      vec4  mvPos   = modelViewMatrix * vec4(pos, 1.0);
      vec3  vNorm   = normalize(normalMatrix * n);
      vec3  viewDir = normalize(-mvPos.xyz);

      float rim   = pow(1.0 - abs(dot(vNorm, viewDir)), 2.5);
      float depth = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);

      // Apply light pulse to color luminance and alpha
      col = col * (0.82 + rim * 0.38) * lightPulse;
      vColor = col;

      vAlpha = (mix(0.25, 0.90, depth) * 0.82 + rim * 0.18) * (0.85 + wave1 * 0.30);

      // CONSTANT POINT SIZE: uSize * attenuation only.
      // NO densityWave, NO rimBoost, NO random sizeScale.
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
    uC0: { value: new THREE.Color('#60FFFF') }, // Bright cyan
    uC1: { value: new THREE.Color('#FF40C0') }, // Bright pink
    uC2: { value: new THREE.Color('#FFFFFF') }, // Near-white hot center
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
// LAYER 4 — Detached Atmospheric Particles (Sparse, 2–3% satellite Nodes)
// ─────────────────────────────────────────────────────────────────────────────
export const AtmosphericParticleShader = {
  uniforms: {
    uSize:   { value: 1.0 },
    uRadius: { value: 1.25 },
    uC0: { value: new THREE.Color('#00CCFF') },
    uC1: { value: new THREE.Color('#4400FF') },
    uC2: { value: new THREE.Color('#8800CC') },
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
      vec3  n     = normalize(aBasePosition);
      vec3  vNorm = normalize(normalMatrix * n);
      vec3  view  = normalize(-mvPos.xyz);

      float rim   = pow(1.0 - abs(dot(vNorm, view)), 1.5);
      float depth = clamp((mvPos.z + uRadius) / (2.0 * uRadius), 0.0, 1.0);

      vAlpha = (0.05 + rim * 0.20) * mix(0.3, 1.0, depth);

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
