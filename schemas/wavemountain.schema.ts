/**
 * Wave Mountain Visualizer Schema
 * 
 * Creates stacked horizontal waveform lines with depth-based color interpolation.
 */

import { VisualizerSchema, colorProp, integerProp, numberProp, booleanProp } from './base.schema'

export const waveMountainSchema: VisualizerSchema = {
  $id: 'wavemountain',
  displayName: 'Wave Mountain',
  type: 'object',
  properties: {
    primaryColor: colorProp(
      'Primary Color',
      '#00ffff',
      {
        description: 'Color of front lines',
        ui: { order: 0 }
      }
    ),
    
    secondaryColor: colorProp(
      'Secondary Color',
      '#ff00ff',
      {
        description: 'Color of back lines',
        ui: { order: 1 }
      }
    ),
    
    backgroundColor: colorProp(
      'Background',
      '#1a1a2e',
      {
        description: 'Background color',
        ui: { order: 2 }
      }
    ),
    
    lineCount: integerProp(
      'Line Count',
      40,
      {
        description: 'Number of wave lines',
        minimum: 10,
        maximum: 100,
        ui: { order: 3, section: 'Visual' }
      }
    ),
    
    waveHeight: integerProp(
      'Wave Height',
      150,
      {
        description: 'Maximum wave amplitude',
        minimum: 50,
        maximum: 300,
        ui: { order: 4, section: 'Visual' }
      }
    ),
    
    audioSensitivity: numberProp(
      'Sensitivity',
      1.0,
      {
        description: 'Overall audio sensitivity',
        minimum: 0.1,
        maximum: 3.0,
        ui: { order: 5, section: 'Audio' }
      }
    ),
    
    bassMultiplier: numberProp(
      'Bass Multiplier',
      1.5,
      {
        description: 'Boost for low frequencies',
        minimum: 0.1,
        maximum: 3.0,
        ui: { order: 6, section: 'Audio' }
      }
    ),
    
    midMultiplier: numberProp(
      'Mid Multiplier',
      1.0,
      {
        description: 'Boost for mid frequencies',
        minimum: 0.1,
        maximum: 3.0,
        ui: { order: 7, section: 'Audio' }
      }
    ),
    
    highMultiplier: numberProp(
      'High Multiplier',
      0.8,
      {
        description: 'Boost for high frequencies',
        minimum: 0.1,
        maximum: 3.0,
        ui: { order: 8, section: 'Audio' }
      }
    ),
    
    // Hidden internal properties
    lineSpacing: numberProp('Line Spacing', 12, { ui: { hidden: true } }),
    pointsPerLine: integerProp('Points Per Line', 128, { ui: { hidden: true } }),
    perspectiveStrength: numberProp('Perspective Strength', 0.7, { ui: { hidden: true } }),
    smoothing: numberProp('Smoothing', 0.85, { ui: { hidden: true } }),
    trailFade: numberProp('Trail Fade', 0.02, { ui: { hidden: true } }),
    lineWidth: numberProp('Line Width', 1.5, { ui: { hidden: true } }),
    rotationSpeed: numberProp('Rotation Speed', 0, { ui: { hidden: true } }),
    perspective3D: booleanProp('Perspective 3D', true, { ui: { hidden: true } })
  },
  
  required: [
    'primaryColor',
    'secondaryColor',
    'backgroundColor',
    'lineCount',
    'waveHeight',
    'audioSensitivity',
    'bassMultiplier',
    'midMultiplier',
    'highMultiplier',
    'lineSpacing',
    'pointsPerLine',
    'perspectiveStrength',
    'smoothing',
    'trailFade',
    'lineWidth',
    'rotationSpeed',
    'perspective3D'
  ],
  
  metadata: {
    category: 'Simulation',
    tags: ['wave', '3d', 'audio-reactive'],
    author: 'YeonV',
    version: '1.0.0'
  }
}
