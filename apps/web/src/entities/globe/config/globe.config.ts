import { GlobeConfig } from '../types/globe.types'

export const DEFAULT_GLOBE_CONFIG: GlobeConfig = {
  quality: {
    ultra: {
      surfaceParticleCount: 80000,
      edgeParticleCount: 15000,
      floatingParticleCount: 3000,
      microDustCount: 2000,
    },
    high: {
      surfaceParticleCount: 45000,
      edgeParticleCount: 10000,
      floatingParticleCount: 2000,
      microDustCount: 1200,
    },
    medium: {
      surfaceParticleCount: 25000,
      edgeParticleCount: 6000,
      floatingParticleCount: 1200,
      microDustCount: 800,
    },
    low: {
      surfaceParticleCount: 12000,
      edgeParticleCount: 3000,
      floatingParticleCount: 600,
      microDustCount: 400,
    },
  },

  radius: 1.8,

  colors: {
    idle: {
      top: '#7FE8FF',       // Ice Cyan
      upperMid: '#00DFFF',  // Electric Cyan
      mid: '#8B5CF6',       // Deep Purple / Violet
      lowerMid: '#D946EF',  // Magenta
      red: '#F43F5E',       // Crimson Coral Red
      bottom: '#FACC15',    // Warm Golden Yellow
      orange: '#F97316',    // Fiery Amber Orange
      interiorDark: '#010A1C',
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
    },
  },

  noise: {
    frequency: 2.6,
    amplitude: 0.12,
    speed: 0.35,
    octaves: 3,
    rimDisplacement: 0.16,
    bottomScatter: 0.18,
  },

  motion: {
    baseRotationSpeed: 0.0012,
    thinkingRotationSpeed: 0.0045,
    errorRotationSpeed: 0.0035,
    breathingAmplitude: 0.04,
    breathingSpeed: 1.2,
    audioVibrationMultiplier: 0.25,
  },

  lighting: {
    ambientIntensity: 0.4,
    directionalIntensity: 1.2,
    rimIntensity: 1.8,
    pointLightIntensity: 2.0,
  },

  bloom: {
    emissiveLuminance: 1.35,
    rimPower: 3.6,
    corePointSize: 1.3,
    rimPointSize: 4.8,
    starSize: 5.2,
  },

  camera: {
    position: [0, 0, 6.0],
    fov: 50,
    near: 0.1,
    far: 1000,
  },
}
