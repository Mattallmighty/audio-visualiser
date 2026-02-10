// Main store export
export { default as useStore } from './useStore'
export type { IStore } from './useStore'

// Store slice types
export type { 
  StoreVisualizerState, 
  StoreVisualizerActions 
} from './visualizer/storeVisualizer'

export type { 
  StoreUIState, 
  StoreUIActions 
} from './visualizer/storeUI'

export type { 
  StorePostProcessingState, 
  StorePostProcessingActions 
} from './visualizer/storePostProcessing'

export type { 
  StoreConfigsState, 
  StoreConfigsActions 
} from './visualizer/storeConfigs'

export type { 
  StoreShaderEditorState, 
  StoreShaderEditorActions 
} from './visualizer/storeShaderEditor'

// Migration exports
export { VISUALISER_STORE_VERSION, migrations } from './migrate'
export type { MigrationState } from './migrate'
