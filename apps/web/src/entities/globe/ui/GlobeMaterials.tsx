import { useMemo } from 'react'
import * as THREE from 'three'
import { GLSL_SIMPLEX_NOISE_CHUNK } from '../utils/noise'
import { GlobeState, GlobeConfig } from '../types/globe.types'
import { DEFAULT_GLOBE_CONFIG } from '../config/globe.config'

export function useSurfaceMaterial(state: GlobeState = 'idle', config: GlobeConfig = DEFAULT_GLOBE_CONFIG) {
  const palette = config.colors[state] || config.colors.idle

  return useMemo(() => {
    const cTop = new THREE.Color(palette.top)
    const cUpperMid = new THREE.Color(palette.upperMid)
    const cMid = new THREE.Color(palette.mid)
    const cLowerMid = new THREE.Color(palette.lowerMid)
    const cRed = new THREE.Color(palette.red)
    const cBottom = new THREE.Color(palette.bottom)
    const cOrange = new THREE.Color(palette.orange)
    const cInterior = new THREE.Color(palette.interiorDark)

    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uVoiceLevel: { value: 0.0 },
        uTop: { value: cTop },
        uUpperMid: { value: cUpperMid },
        uMid: { value: cMid },
        uLowerMid: { value: cLowerMid },
        uRed: { value: cRed },
        uBottom: { value: cBottom },
        uOrange: { value: cOrange },
        uInterior: { value: cInterior },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uVoiceLevel;
        attribute float size;
        varying vec3 vColor;
        varying float vRimWeight;
        varying float vFaceMask;

        ${GLSL_SIMPLEX_NOISE_CHUNK}

        void main() {
          vColor = color;
          vec3 normalVec = normalize(position);

          // Calculate view-space rimFactor
          vec4 tempMvPos = modelViewMatrix * vec4(position, 1.0);
          vec3 viewNormal = normalize(normalMatrix * normalVec);
          vec3 viewDir = normalize(-tempMvPos.xyz);
          float rimFactor = 1.0 - abs(dot(viewNormal, viewDir));

          vRimWeight = pow(rimFactor, ${config.bloom.rimPower.toFixed(1)});

          // Organic Simplex noise rim crests matching reference image
          float wavyNoise = snoise(position * ${config.noise.frequency.toFixed(1)} + vec3(0.0, uTime * ${config.noise.speed.toFixed(2)}, 0.0)) * ${config.noise.amplitude.toFixed(2)} * vRimWeight;
          
          float bottomFrac = smoothstep(-0.35, -0.95, position.y);
          float bottomScatter = snoise(position * 3.5 + vec3(uTime * 0.5, 0.0, 0.0)) * ${config.noise.bottomScatter.toFixed(2)} * bottomFrac * vRimWeight;

          vec3 displacedPos = position + normalVec * (wavyNoise + bottomScatter);
          vec4 mvPosition = modelViewMatrix * vec4(displacedPos, 1.0);

          float dynamicSize = mix(${config.bloom.corePointSize.toFixed(1)}, ${config.bloom.rimPointSize.toFixed(1)}, vRimWeight) * (1.0 + uVoiceLevel * 0.25);
          gl_PointSize = dynamicSize * (6.0 / -mvPosition.z);

          // Abstract Face Density Mask for interior points
          float eyeLeft = smoothstep(0.08, 0.0, length(vec2(position.x + 0.35, position.y - 0.28)));
          float eyeRight = smoothstep(0.08, 0.0, length(vec2(position.x - 0.35, position.y - 0.28)));
          float mouth = smoothstep(0.07, 0.0, abs(position.y - (-0.35 + position.x * position.x * 0.4)));
          vFaceMask = 1.0 - (eyeLeft * 0.6 + eyeRight * 0.6 + mouth * 0.5) * (1.0 - vRimWeight);

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uVoiceLevel;
        uniform vec3 uInterior;
        varying vec3 vColor;
        varying float vRimWeight;
        varying float vFaceMask;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float intensity = pow(1.0 - (dist * 2.0), 2.2);
          vec3 finalColor = mix(uInterior, vColor * ${config.bloom.emissiveLuminance.toFixed(2)}, vRimWeight);

          float baseAlpha = mix(0.07, 0.96, vRimWeight) * vFaceMask * (1.0 + uVoiceLevel * 0.3);
          gl_FragColor = vec4(finalColor, intensity * baseAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })
  }, [state, config, palette])
}
