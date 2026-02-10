/**
 * Frequency Rings Visualizer Schema
 * 
 * Expanding concentric rings colored by frequency band.
 * Creates pulsing ring effects from center.
 */

import { VisualizerSchema, colorProp, integerProp, numberProp, booleanProp } from './base.schema'

export const frequencyRingsSchema: VisualizerSchema = {
  $id: 'frequencyrings',
  displayName: 'Frequency Rings',
  type: 'object',
  properties: {
    bassColor: colorProp('Bass Color', '#ff4400', {
      description: 'Color for low frequencies (red/orange)',
      ui: { order: 0, section: 'Colors' }
    }),
    
    midColor: colorProp('Mid Color', '#44ff00', {
      description: 'Color for mid frequencies (green)',
      ui: { order: 1, section: 'Colors' }
    }),
    
    highColor: colorProp('High Color', '#0088ff', {
      description: 'Color for high frequencies (blue)',
      ui: { order: 2, section: 'Colors' }
    }),
    
    backgroundColor: colorProp('Background Color', '#0a0a0f', {
      description: 'Background color',
      ui: { order: 3, section: 'Colors' }
    }),
    
    maxRings: integerProp('Max Rings', 30, {
      description: 'Maximum simultaneous rings',
      minimum: 10,
      maximum: 100,
      ui: { order: 4, section: 'Visual' }
    }),
    
    ringExpansionSpeed: integerProp('Expansion Speed', 2, {
      description: 'How fast rings expand',
      minimum: 1,
      maximum: 10,
      ui: { order: 5, section: 'Motion' }
    }),
    
    ringThickness: integerProp('Ring Thickness', 3, {
      description: 'Width of ring lines',
      minimum: 1,
      maximum: 10,
      ui: { order: 6, section: 'Visual' }
    }),
    
    glowIntensity: integerProp('Glow Intensity', 20, {
      description: 'Ring glow strength',
      minimum: 5,
      maximum: 50,
      ui: { order: 7, section: 'Visual' }
    }),
    
    audioSensitivity: numberProp('Audio Sensitivity', 1.5, {
      description: 'Overall audio response',
      minimum: 0.1,
      maximum: 3.0,
      ui: { order: 8, section: 'Audio' }
    }),
    
    bassMultiplier: numberProp('Bass Multiplier', 2.5, {
      description: 'Boost for low frequencies',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 9, section: 'Audio' }
    }),
    
    midMultiplier: numberProp('Mid Multiplier', 1.8, {
      description: 'Boost for mid frequencies',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 10, section: 'Audio' }
    }),
    
    highMultiplier: numberProp('High Multiplier', 1.2, {
      description: 'Boost for high frequencies',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 11, section: 'Audio' }
    }),
    
    pulseOnBeat: booleanProp('Pulse on Beat', true, {
      description: 'Create ring on beat',
      ui: { order: 12, section: 'Behavior' }
    }),
    
    showCenterCore: booleanProp('Show Center Core', true, {
      description: 'Display glowing center',
      ui: { order: 13, section: 'Visual' }
    }),
    
    // Advanced parameters (hidden)
    ringSpawnRate: numberProp('Ring Spawn Rate', 0.1, { ui: { hidden: true } }),
    trailFade: numberProp('Trail Fade', 0.08, { ui: { hidden: true } })
  },
  
  required: [
    'bassColor', 'midColor', 'highColor', 'backgroundColor', 'maxRings',
    'ringExpansionSpeed', 'ringThickness', 'glowIntensity', 'audioSensitivity',
    'bassMultiplier', 'midMultiplier', 'highMultiplier', 'pulseOnBeat',
    'showCenterCore', 'ringSpawnRate', 'trailFade'
  ],
  
  metadata: {
    category: 'Geometric',
    tags: ['rings', 'circles', 'frequency', 'audio-reactive'],
    author: 'YeonV',
    version: '1.0.0'
  }
}
