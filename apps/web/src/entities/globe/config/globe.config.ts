import { GlobeConfig } from '../types/globe.types'

export const DEFAULT_GLOBE_CONFIG: GlobeConfig = {
  layers: {
    coreEnabled: true,
    surfaceEnabled: true,
    edgeRimEnabled: true,
    floatingOrbitEnabled: true,
    dustEnabled: true,
    glowEnabled: true,
    lightingEnabled: true,
    postProcessingEnabled: true,
    audioReactiveEnabled: true,
    aiStateEnabled: true,
  },

  quality: {
    ultra: {
      totalParticles: 100000,
      surfaceParticles: 80000,
      edgeParticles: 10000,
      floatingParticles: 7000,
      dustParticles: 3000,
    },
    high: {
      totalParticles: 60000,
      surfaceParticles: 48000,
      edgeParticles: 6000,
      floatingParticles: 4200,
      dustParticles: 1800,
    },
    medium: {
      totalParticles: 35000,
      surfaceParticles: 28000,
      edgeParticles: 3500,
      floatingParticles: 2450,
      dustParticles: 1050,
    },
    low: {
      totalParticles: 18000,
      surfaceParticles: 14400,
      edgeParticles: 1800,
      floatingParticles: 1260,
      dustParticles: 540,
    },
  },

  radius: 1.8,

  colors: {
    idle: {
      top: '#FFFFFF',       // White
      upperMid: '#7FE8FF',  // Light Cyan
      mid: '#00DFFF',       // Blue / Cyan
      lowerMid: '#4A5FE8',  // Indigo
      red: '#8B3FD9',       // Purple
      bottom: '#E8397F',    // Pink / Orange / Red
      orange: '#FF5500',    // Fiery Orange
      interiorDark: '#010A1C',
      rimGlow: '#00DFFF',
    },
    listening: {
      top: '#E0FFFF',
      upperMid: '#00FFFF',
      mid: '#0099FF',
      lowerMid: '#0055FF',
      red: '#3300FF',
      bottom: '#00DFFF',
      orange: '#0088FF',
      interiorDark: '#001133',
      rimGlow: '#00FFFF',
    },
    thinking: {
      top: '#F5D0FE',
      upperMid: '#E0E7FF',
      mid: '#A855F7',
      lowerMid: '#9333EA',
      red: '#7E22CE',
      bottom: '#C084FC',
      orange: '#A855F7',
      interiorDark: '#1A0B2E',
      rimGlow: '#C084FC',
    },
    speaking: {
      top: '#FFFFFF',
      upperMid: '#7FE8FF',
      mid: '#EC4899',
      lowerMid: '#F43F5E',
      red: '#FF1155',
      bottom: '#FFD700',
      orange: '#FF6600',
      interiorDark: '#1A0010',
      rimGlow: '#FF1155',
    },
    success: {
      top: '#F0FDF4',
      upperMid: '#86EFAC',
      mid: '#22C55E',
      lowerMid: '#16A34A',
      red: '#15803D',
      bottom: '#A3E635',
      orange: '#4ADE80',
      interiorDark: '#022C22',
      rimGlow: '#22C55E',
    },
    warning: {
      top: '#FEF9C3',
      upperMid: '#FDE047',
      mid: '#EAB308',
      lowerMid: '#CA8A04',
      red: '#D97706',
      bottom: '#F59E0B',
      orange: '#F97316',
      interiorDark: '#291E03',
      rimGlow: '#EAB308',
    },
    error: {
      top: '#FEE2E2',
      upperMid: '#FCA5A5',
      mid: '#EF4444',
      lowerMid: '#DC2626',
      red: '#B91C1C',
      bottom: '#F87171',
      orange: '#EF4444',
      interiorDark: '#310404',
      rimGlow: '#EF4444',
    },
  },

  noise: {
    frequency: 2.4,
    amplitude: 0.10,
    speed: 0.35,
    octaves: 3,
    rimDisplacement: 0.14,
    bottomScatter: 0.16,
    curlFrequency: 1.8,
  },

  motion: {
    baseRotationSpeedY: 0.08, // 0.08 rad/sec
    baseRotationSpeedX: 0.035,
    thinkingRotationSpeed: 0.18,
    errorRotationSpeed: 0.14,
    breathingAmplitude: 0.035,
    breathingSpeed: 1.2,
    audioVibrationMultiplier: 0.25,
    microVibrationFrequency: 12.0,
  },

  lighting: {
    ambientIntensity: 0.4,
    directionalIntensity: 1.2,
    rimIntensity: 1.8,
    pointLightIntensity: 2.0,
  },

  bloom: {
    emissiveLuminance: 1.45,
    rimPower: 3.8,
    corePointSize: 1.4,
    rimPointSize: 4.8,
    floatingPointSize: 2.2,
    dustPointSize: 1.1,
    starSize: 5.2,
    depthFadingFactor: 0.75,
  },

  camera: {
    position: [0, 0.35, 5.5],
    lookAt: [0, 0, 0],
    fov: 35,
    near: 0.1,
    far: 1000,
    autoRotate: true,
    autoRotateSpeed: 0.8,
  },
}
