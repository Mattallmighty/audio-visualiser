/**
 * Spiral Galaxy Visualizer Schema
 * 
 * Particle spiral arms from glowing center.
 * Creates galaxy-like rotating spirals with audio-reactive motion.
 */

import { VisualizerSchema, colorProp, integerProp, numberProp, booleanProp } from './base.schema'

export const spiralGalaxySchema: VisualizerSchema = {
  $id: 'spiralgalaxy',
  displayName: 'Spiral Galaxy',
  type: 'object',
  properties: {
    primaryColor: colorProp('Primary Color', '#00ffff', {
      description: 'Color for inner particles',
      ui: { order: 0, section: 'Visual' }
    }),
    
    secondaryColor: colorProp('Secondary Color', '#ff00ff', {
      description: 'Color for outer particles',
      ui: { order: 1, section: 'Visual' }
    }),
    
    backgroundColor: colorProp('Background Color', '#0a0a15', {
      description: 'Background color',
      ui: { order: 2, section: 'Visual' }
    }),
    
    particleCount: integerProp('Particle Count', 3000, {
      description: 'Total number of particles',
      minimum: 500,
      maximum: 10000,
      ui: { order: 3, section: 'Visual' }
    }),
    
    armCount: integerProp('Arm Count', 4, {
      description: 'Number of spiral arms',
      minimum: 2,
      maximum: 8,
      ui: { order: 4, section: 'Visual' }
    }),
    
    spiralTightness: numberProp('Spiral Tightness', 0.3, {
      description: 'How tightly spirals wind',
      minimum: 0.1,
      maximum: 1.0,
      ui: { order: 5, section: 'Visual' }
    }),
    
    rotationSpeed: numberProp('Rotation Speed', 0.15, {
      description: 'Speed of rotation',
      minimum: 0,
      maximum: 2.0,
      ui: { order: 6, section: 'Motion' }
    }),
    
    glowIntensity: integerProp('Glow Intensity', 20, {
      description: 'Particle glow strength',
      minimum: 0,
      maximum: 50,
      ui: { order: 7, section: 'Visual' }
    }),
    
    audioSensitivity: numberProp('Audio Sensitivity', 1.5, {
      description: 'Overall audio response',
      minimum: 0.1,
      maximum: 3.0,
      ui: { order: 8, section: 'Audio' }
    }),
    
    bassMultiplier: numberProp('Bass Multiplier', 2.0, {
      description: 'Boost for low frequencies',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 9, section: 'Audio' }
    }),
    
    midMultiplier: numberProp('Mid Multiplier', 1.2, {
      description: 'Boost for mid frequencies',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 10, section: 'Audio' }
    }),
    
    highMultiplier: numberProp('High Multiplier', 0.8, {
      description: 'Boost for high frequencies',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 11, section: 'Audio' }
    }),
    
    pulseOnBeat: booleanProp('Pulse on Beat', true, {
      description: 'Expand on beat detection',
      ui: { order: 12, section: 'Behavior' }
    }),
    
    centerGlow: booleanProp('Center Glow', true, {
      description: 'Show glowing center',
      ui: { order: 13, section: 'Visual' }
    }),
    
    // Advanced parameters (hidden)
    armSpread: numberProp('Arm Spread', 0.4, { ui: { hidden: true } }),
    particleSize: integerProp('Particle Size', 2, { ui: { hidden: true } }),
    trailLength: numberProp('Trail Length', 0.95, { ui: { hidden: true } })
  },
  
  required: [
    'primaryColor', 'secondaryColor', 'backgroundColor', 'particleCount', 'armCount',
    'spiralTightness', 'rotationSpeed', 'glowIntensity', 'audioSensitivity',
    'bassMultiplier', 'midMultiplier', 'highMultiplier', 'pulseOnBeat', 'centerGlow',
    'armSpread', 'particleSize', 'trailLength'
  ],
  
  metadata: {
    category: 'Simulation',
    tags: ['spiral', 'galaxy', 'particles', 'audio-reactive'],
    author: 'YeonV',
    version: '1.0.0'
  }
}
