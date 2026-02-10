/**
 * Aurora Borealis Visualizer Schema
 * 
 * Waving ribbon lights with frequency-based coloring.
 * Creates northern lights effect with audio reactivity.
 */

import { VisualizerSchema, colorProp, integerProp, numberProp, booleanProp } from './base.schema'

export const auroraBorealisSchema: VisualizerSchema = {
  $id: 'auroraborealis',
  displayName: 'Aurora Borealis',
  type: 'object',
  properties: {
    bassColor: colorProp('Bass Color', '#00ff88', {
      description: 'Color for low frequencies (green)',
      ui: { order: 0, section: 'Colors' }
    }),
    
    midColor: colorProp('Mid Color', '#ff00ff', {
      description: 'Color for mid frequencies (magenta)',
      ui: { order: 1, section: 'Colors' }
    }),
    
    highColor: colorProp('High Color', '#00ccff', {
      description: 'Color for high frequencies (cyan)',
      ui: { order: 2, section: 'Colors' }
    }),
    
    backgroundColor: colorProp('Background Color', '#0a0a1a', {
      description: 'Background color',
      ui: { order: 3, section: 'Colors' }
    }),
    
    ribbonCount: integerProp('Ribbon Count', 5, {
      description: 'Number of aurora ribbons',
      minimum: 2,
      maximum: 12,
      ui: { order: 4, section: 'Visual' }
    }),
    
    waveAmplitude: integerProp('Wave Amplitude', 80, {
      description: 'Height of wave motion',
      minimum: 20,
      maximum: 200,
      ui: { order: 5, section: 'Motion' }
    }),
    
    waveSpeed: numberProp('Wave Speed', 0.8, {
      description: 'Speed of wave motion',
      minimum: 0.1,
      maximum: 3.0,
      ui: { order: 6, section: 'Motion' }
    }),
    
    glowIntensity: integerProp('Glow Intensity', 25, {
      description: 'Ribbon glow strength',
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
    
    bassMultiplier: numberProp('Bass Multiplier', 2.0, {
      description: 'Boost for low frequencies',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 9, section: 'Audio' }
    }),
    
    midMultiplier: numberProp('Mid Multiplier', 1.5, {
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
    
    showStars: booleanProp('Show Stars', true, {
      description: 'Display star field',
      ui: { order: 12, section: 'Visual' }
    }),
    
    starCount: integerProp('Star Count', 150, {
      description: 'Number of background stars',
      minimum: 0,
      maximum: 500,
      ui: { order: 13, section: 'Visual' }
    }),
    
    // Advanced parameters (hidden)
    ribbonSegments: integerProp('Ribbon Segments', 100, { ui: { hidden: true } }),
    verticalStretch: numberProp('Vertical Stretch', 0.6, { ui: { hidden: true } }),
    trailFade: numberProp('Trail Fade', 0.03, { ui: { hidden: true } })
  },
  
  required: [
    'bassColor', 'midColor', 'highColor', 'backgroundColor', 'ribbonCount',
    'waveAmplitude', 'waveSpeed', 'glowIntensity', 'audioSensitivity',
    'bassMultiplier', 'midMultiplier', 'highMultiplier', 'showStars', 'starCount',
    'ribbonSegments', 'verticalStretch', 'trailFade'
  ],
  
  metadata: {
    category: 'Natural',
    tags: ['aurora', 'lights', 'waves', 'audio-reactive'],
    author: 'YeonV',
    version: '1.0.0'
  }
}
