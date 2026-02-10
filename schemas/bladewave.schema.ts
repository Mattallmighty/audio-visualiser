/**
 * Blade Wave Visualizer Schema
 * 
 * Enhanced wave mountain with gradient depth support.
 * Creates stacked horizontal waveform lines with multi-color gradient progression.
 */

import { VisualizerSchema, colorProp, integerProp, numberProp, booleanProp } from './base.schema'

export const bladeWaveSchema: VisualizerSchema = {
  $id: 'bladewave',
  displayName: 'Blade Wave',
  type: 'object',
  properties: {
    useDepthGradient: booleanProp(
      'Use Depth Gradient',
      true,
      {
        description: 'Toggle between depth gradient (back→front) or horizontal gradients (left→right)',
        ui: { order: 0 }
      }
    ),
    
    depthGradient: colorProp(
      'Depth Gradient',
      'linear-gradient(90deg, rgb(139, 0, 0) 0%, rgb(255, 0, 0) 25%, rgb(255, 120, 0) 50%, rgb(255, 200, 0) 75%, rgb(255, 255, 0) 100%)',
      {
        description: 'Multi-color gradient from back to front',
        isGradient: true,
        ui: {
          order: 1,
          showIf: { useDepthGradient: true }
        }
      }
    ),
    
    primaryColor: colorProp(
      'Primary Gradient (Front)',
      '#00ffff',
      {
        description: 'Horizontal gradient for front lines (left→right)',
        isGradient: true,
        ui: {
          order: 2,
          showIf: { useDepthGradient: false }
        }
      }
    ),
    
    secondaryColor: colorProp(
      'Secondary Gradient (Back)',
      '#ff00ff',
      {
        description: 'Horizontal gradient for back lines (left→right)',
        isGradient: true,
        ui: {
          order: 3,
          showIf: { useDepthGradient: false }
        }
      }
    ),
    
    backgroundColor: colorProp(
      'Background',
      '#1a1a2e',
      {
        description: 'Background color',
        ui: { order: 4 }
      }
    ),
    
    lineCount: integerProp(
      'Line Count',
      40,
      {
        description: 'Number of wave lines',
        minimum: 10,
        maximum: 100,
        ui: { order: 5, section: 'Visual' }
      }
    ),
    
    waveHeight: integerProp(
      'Wave Height',
      150,
      {
        description: 'Maximum wave amplitude',
        minimum: 50,
        maximum: 300,
        ui: { order: 6, section: 'Visual' }
      }
    ),
    
    audioSensitivity: numberProp(
      'Sensitivity',
      1.0,
      {
        description: 'Overall audio sensitivity',
        minimum: 0.1,
        maximum: 3.0,
        ui: { order: 7, section: 'Audio' }
      }
    ),
    
    bassMultiplier: numberProp(
      'Bass Multiplier',
      1.5,
      {
        description: 'Boost for low frequencies',
        minimum: 0.1,
        maximum: 3.0,
        ui: { order: 8, section: 'Audio' }
      }
    ),
    
    midMultiplier: numberProp(
      'Mid Multiplier',
      1.0,
      {
        description: 'Boost for mid frequencies',
        minimum: 0.1,
        maximum: 3.0,
        ui: { order: 9, section: 'Audio' }
      }
    ),
    
    highMultiplier: numberProp(
      'High Multiplier',
      0.8,
      {
        description: 'Boost for high frequencies',
        minimum: 0.1,
        maximum: 3.0,
        ui: { order: 10, section: 'Audio' }
      }
    ),
    
    // Hidden internal properties (not shown in UI)
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
    'useDepthGradient',
    'depthGradient',
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
    tags: ['wave', 'gradient', '3d', 'audio-reactive'],
    author: 'YeonV + Copilot',
    version: '1.0.0'
  }
}
