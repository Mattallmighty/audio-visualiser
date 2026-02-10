/**
 * Hex Grid Visualizer Schema
 * 
 * Audio-reactive hexagonal honeycomb grid.
 * Creates rippling hexagons that pulse with audio.
 */

import { VisualizerSchema, colorProp, integerProp, numberProp, booleanProp } from './base.schema'

export const hexGridSchema: VisualizerSchema = {
  $id: 'hexgrid',
  displayName: 'Hex Grid',
  type: 'object',
  properties: {
    primaryColor: colorProp('Primary Color', '#00ffff', {
      description: 'Color for front hexagons',
      ui: { order: 0, section: 'Visual' }
    }),
    
    secondaryColor: colorProp('Secondary Color', '#ff00ff', {
      description: 'Color for back hexagons',
      ui: { order: 1, section: 'Visual' }
    }),
    
    backgroundColor: colorProp('Background Color', '#1a1a2e', {
      description: 'Background color',
      ui: { order: 2, section: 'Visual' }
    }),
    
    hexSize: integerProp('Hex Size', 30, {
      description: 'Size of each hexagon',
      minimum: 10,
      maximum: 100,
      ui: { order: 3, section: 'Visual' }
    }),
    
    gridRadius: integerProp('Grid Radius', 12, {
      description: 'Number of hex rings',
      minimum: 5,
      maximum: 25,
      ui: { order: 4, section: 'Visual' }
    }),
    
    glowIntensity: integerProp('Glow Intensity', 15, {
      description: 'Glow strength',
      minimum: 0,
      maximum: 50,
      ui: { order: 5, section: 'Visual' }
    }),
    
    audioSensitivity: numberProp('Audio Sensitivity', 1.2, {
      description: 'Overall audio response',
      minimum: 0.1,
      maximum: 3.0,
      ui: { order: 6, section: 'Audio' }
    }),
    
    bassMultiplier: numberProp('Bass Multiplier', 2.0, {
      description: 'Boost for low frequencies',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 7, section: 'Audio' }
    }),
    
    midMultiplier: numberProp('Mid Multiplier', 1.0, {
      description: 'Boost for mid frequencies',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 8, section: 'Audio' }
    }),
    
    highMultiplier: numberProp('High Multiplier', 0.6, {
      description: 'Boost for high frequencies',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 9, section: 'Audio' }
    }),
    
    pulseOnBeat: booleanProp('Pulse on Beat', true, {
      description: 'Extra pulse effect on beats',
      ui: { order: 10, section: 'Behavior' }
    }),
    
    fillHexagons: booleanProp('Fill Hexagons', false, {
      description: 'Fill instead of stroke',
      ui: { order: 11, section: 'Visual' }
    }),
    
    // Advanced parameters (hidden)
    strokeWidth: numberProp('Stroke Width', 1.5, { ui: { hidden: true } }),
    rippleSpeed: numberProp('Ripple Speed', 2, { ui: { hidden: true } }),
    rotationSpeed: numberProp('Rotation Speed', 0.1, { ui: { hidden: true } }),
    perspectiveDepth: numberProp('Perspective Depth', 0.3, { ui: { hidden: true } })
  },
  
  required: [
    'primaryColor', 'secondaryColor', 'backgroundColor', 'hexSize', 'gridRadius',
    'glowIntensity', 'audioSensitivity', 'bassMultiplier', 'midMultiplier',
    'highMultiplier', 'pulseOnBeat', 'fillHexagons', 'strokeWidth', 'rippleSpeed',
    'rotationSpeed', 'perspectiveDepth'
  ],
  
  metadata: {
    category: 'Geometric',
    tags: ['hexagon', 'grid', 'geometric', 'audio-reactive'],
    author: 'YeonV',
    version: '1.0.0'
  }
}
