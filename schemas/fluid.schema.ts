/**
 * Fluid Visualizer Schema
 * 
 * GPU-based fluid simulation with audio reactivity.
 * Implements Navier-Stokes fluid dynamics with particle system.
 */

import { VisualizerSchema, colorProp, integerProp, numberProp, booleanProp } from './base.schema'

export const fluidSchema: VisualizerSchema = {
  $id: 'fluid',
  displayName: 'Fluid Simulation',
  type: 'object',
  properties: {
    primaryColor: colorProp('Primary Color', '#ff00ff', {
      description: 'First splat color',
      ui: { order: 0, section: 'Visual' }
    }),
    
    secondaryColor: colorProp('Secondary Color', '#00ffff', {
      description: 'Second splat color',
      ui: { order: 1, section: 'Visual' }
    }),
    
    tertiaryColor: colorProp('Tertiary Color', '#0066ff', {
      description: 'Third splat color',
      ui: { order: 2, section: 'Visual' }
    }),
    
    bloom: booleanProp('Bloom Effect', true, {
      description: 'Enable glow/bloom post-processing',
      ui: { order: 3, section: 'Visual' }
    }),
    
    bloomIntensity: numberProp('Bloom Intensity', 0.8, {
      description: 'Intensity of bloom glow',
      minimum: 0,
      maximum: 2,
      ui: { order: 4, section: 'Visual' }
    }),
    
    audioSensitivity: numberProp('Audio Sensitivity', 1.0, {
      description: 'Overall audio response',
      minimum: 0.1,
      maximum: 3.0,
      ui: { order: 5, section: 'Audio' }
    }),
    
    bassMultiplier: numberProp('Bass Multiplier', 2.0, {
      description: 'Boost for low frequencies',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 6, section: 'Audio' }
    }),
    
    midMultiplier: numberProp('Mid Multiplier', 1.5, {
      description: 'Boost for mid frequencies',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 7, section: 'Audio' }
    }),
    
    highMultiplier: numberProp('High Multiplier', 1.0, {
      description: 'Boost for high frequencies',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 8, section: 'Audio' }
    }),
    
    autoInject: booleanProp('Auto Inject', true, {
      description: 'Automatically inject splats',
      ui: { order: 9, section: 'Behavior' }
    }),
    
    autoInjectSpeed: numberProp('Auto Inject Speed', 0.5, {
      description: 'Rate of automatic splats',
      minimum: 0.1,
      maximum: 2.0,
      ui: { order: 10, section: 'Behavior' }
    }),
    
    // Advanced physics parameters (hidden)
    particleCount: integerProp('Particle Count', 65536, { ui: { hidden: true } }),
    dyeResolution: integerProp('Dye Resolution', 1024, { ui: { hidden: true } }),
    simResolution: integerProp('Simulation Resolution', 256, { ui: { hidden: true } }),
    densityDissipation: numberProp('Density Dissipation', 0.97, { ui: { hidden: true } }),
    velocityDissipation: numberProp('Velocity Dissipation', 0.98, { ui: { hidden: true } }),
    pressureIterations: integerProp('Pressure Iterations', 20, { ui: { hidden: true } }),
    curl: numberProp('Curl', 30, { ui: { hidden: true } }),
    splatRadius: numberProp('Splat Radius', 0.25, { ui: { hidden: true } }),
    splatForce: numberProp('Splat Force', 6000, { ui: { hidden: true } }),
    colorUpdateSpeed: numberProp('Color Update Speed', 10, { ui: { hidden: true } })
  },
  
  required: [
    'primaryColor', 'secondaryColor', 'tertiaryColor', 'bloom', 'bloomIntensity',
    'audioSensitivity', 'bassMultiplier', 'midMultiplier', 'highMultiplier',
    'autoInject', 'autoInjectSpeed', 'particleCount', 'dyeResolution', 'simResolution',
    'densityDissipation', 'velocityDissipation', 'pressureIterations', 'curl',
    'splatRadius', 'splatForce', 'colorUpdateSpeed'
  ],
  
  metadata: {
    category: 'Simulation',
    tags: ['fluid', 'physics', 'particles', 'audio-reactive'],
    author: 'YeonV',
    version: '1.0.0'
  }
}
