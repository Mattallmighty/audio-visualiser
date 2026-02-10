/**
 * Neon Terrain Visualizer Schema
 * 
 * Retro 80s wireframe landscape with scrolling grid.
 * Creates synthwave-style terrain with audio-reactive peaks.
 */

import { VisualizerSchema, colorProp, integerProp, numberProp, booleanProp } from './base.schema'

export const neonTerrainSchema: VisualizerSchema = {
  $id: 'neonterrain',
  displayName: 'Neon Terrain',
  type: 'object',
  properties: {
    bassColor: colorProp('Bass Color', '#ff0066', {
      description: 'Color for low frequencies (hot pink)',
      ui: { order: 0, section: 'Colors' }
    }),
    
    midColor: colorProp('Mid Color', '#ff6600', {
      description: 'Color for mid frequencies (orange)',
      ui: { order: 1, section: 'Colors' }
    }),
    
    highColor: colorProp('High Color', '#00ffff', {
      description: 'Color for high frequencies (cyan)',
      ui: { order: 2, section: 'Colors' }
    }),
    
    sunColor: colorProp('Sun Color', '#ff00ff', {
      description: 'Color of the sun',
      ui: { order: 3, section: 'Colors' }
    }),
    
    backgroundColor: colorProp('Background Color', '#0a0010', {
      description: 'Background color',
      ui: { order: 4, section: 'Colors' }
    }),
    
    gridWidth: integerProp('Grid Width', 30, {
      description: 'Number of columns',
      minimum: 10,
      maximum: 60,
      ui: { order: 5, section: 'Grid' }
    }),
    
    gridDepth: integerProp('Grid Depth', 40, {
      description: 'Number of rows',
      minimum: 20,
      maximum: 80,
      ui: { order: 6, section: 'Grid' }
    }),
    
    terrainHeight: integerProp('Terrain Height', 150, {
      description: 'Maximum height of peaks',
      minimum: 50,
      maximum: 300,
      ui: { order: 7, section: 'Visual' }
    }),
    
    scrollSpeed: numberProp('Scroll Speed', 1.5, {
      description: 'Speed of forward motion',
      minimum: 0.5,
      maximum: 5.0,
      ui: { order: 8, section: 'Motion' }
    }),
    
    glowIntensity: integerProp('Glow Intensity', 15, {
      description: 'Line glow strength',
      minimum: 5,
      maximum: 40,
      ui: { order: 9, section: 'Visual' }
    }),
    
    audioSensitivity: numberProp('Audio Sensitivity', 1.5, {
      description: 'Overall audio response',
      minimum: 0.1,
      maximum: 3.0,
      ui: { order: 10, section: 'Audio' }
    }),
    
    bassMultiplier: numberProp('Bass Multiplier', 2.0, {
      description: 'Boost for low frequencies',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 11, section: 'Audio' }
    }),
    
    midMultiplier: numberProp('Mid Multiplier', 1.5, {
      description: 'Boost for mid frequencies',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 12, section: 'Audio' }
    }),
    
    highMultiplier: numberProp('High Multiplier', 1.0, {
      description: 'Boost for high frequencies',
      minimum: 0.1,
      maximum: 5.0,
      ui: { order: 13, section: 'Audio' }
    }),
    
    showSun: booleanProp('Show Sun', true, {
      description: 'Display sun on horizon',
      ui: { order: 14, section: 'Visual' }
    }),
    
    showStars: booleanProp('Show Stars', false, {
      description: 'Display star field',
      ui: { order: 15, section: 'Visual' }
    }),
    
    // Advanced parameters (hidden)
    cellSize: integerProp('Cell Size', 40, { ui: { hidden: true } }),
    perspectiveStrength: numberProp('Perspective Strength', 0.8, { ui: { hidden: true } }),
    horizonY: numberProp('Horizon Y', 0.35, { ui: { hidden: true } }),
    lineWidth: numberProp('Line Width', 1.5, { ui: { hidden: true } }),
    trailFade: numberProp('Trail Fade', 0.05, { ui: { hidden: true } })
  },
  
  required: [
    'bassColor', 'midColor', 'highColor', 'sunColor', 'backgroundColor',
    'gridWidth', 'gridDepth', 'terrainHeight', 'scrollSpeed', 'glowIntensity',
    'audioSensitivity', 'bassMultiplier', 'midMultiplier', 'highMultiplier',
    'showSun', 'showStars', 'cellSize', 'perspectiveStrength', 'horizonY',
    'lineWidth', 'trailFade'
  ],
  
  metadata: {
    category: 'Retro',
    tags: ['synthwave', 'retro', 'terrain', '80s', 'audio-reactive'],
    author: 'YeonV',
    version: '1.0.0'
  }
}
