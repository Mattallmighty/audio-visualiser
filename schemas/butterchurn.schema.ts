/**
 * Butterchurn Visualizer Schema
 * 
 * Milkdrop preset player with automatic cycling and audio reactivity.
 * Uses external Butterchurn library with 500+ classic Milkdrop presets.
 */

import { VisualizerSchema, numberProp, booleanProp, integerProp, stringProp } from './base.schema'

export const butterchurnSchema: VisualizerSchema = {
  $id: 'butterchurn',
  displayName: 'Butterchurn Milkdrop',
  type: 'object',
  properties: {
    currentPresetName: stringProp('Preset Name', '', {
      description: 'Select or type a Milkdrop preset name',
      enum: [], // Populated at runtime via getUISchema
      ui: { order: 0, section: 'Preset', width: 'full' }
    }),
    
    currentPresetIndex: integerProp('Preset Index', 0, {
      description: 'Preset number (0-394)',
      minimum: 0,
      maximum: 394,
      ui: { order: 1, section: 'Preset' }
    }),
    
    cycleInterval: numberProp('Cycle Interval', 25, {
      description: 'Seconds between preset changes (0 = disabled)',
      minimum: 0,
      maximum: 120,
      ui: { order: 2, section: 'Playback' }
    }),
    
    blendTime: numberProp('Blend Time', 2.7, {
      description: 'Seconds to blend between presets',
      minimum: 0,
      maximum: 10,
      ui: { order: 2, section: 'Playback' }
    }),
    
    shufflePresets: booleanProp('Shuffle Presets', false, {
      description: 'Randomly select next preset',
      ui: { order: 3, section: 'Playback' }
    })
  },
  
  required: ['currentPresetName', 'cycleInterval', 'blendTime', 'shufflePresets', 'currentPresetIndex'],
  
  metadata: {
    category: 'Preset Player',
    tags: ['milkdrop', 'butterchurn', 'presets', 'player'],
    author: 'YeonV',
    version: '1.0.0',
    description: 'Milkdrop preset player with 500+ classic presets and automatic cycling'
  }
}
