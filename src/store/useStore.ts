import { create } from 'zustand'
import { devtools, combine, persist } from 'zustand/middleware'

import storeVisualizer from './visualizer/storeVisualizer'
import storeUI from './visualizer/storeUI'
import storePostProcessing from './visualizer/storePostProcessing'
import storeConfigs from './visualizer/storeConfigs'
import storeShaderEditor from './visualizer/storeShaderEditor'
import { migrations, MigrationState, VISUALISER_STORE_VERSION } from './migrate'

// Type declaration for Vite's define
declare const process: { env: { NODE_ENV: string } }

const useStore = create(
  devtools(
    persist(
      combine(
        {
          // Initial marker
          version: VISUALISER_STORE_VERSION
        },
        (set, get) => ({
          // Combine all store slices
          ...storeVisualizer(set),
          ...storeUI(set),
          ...storePostProcessing(set),
          ...storeConfigs(set, get),
          ...storeShaderEditor(set)
        })
      ),
      {
        name: 'visualiser-storage',
        version: VISUALISER_STORE_VERSION,
        migrate: (persistedState, version) => {
          console.log(`[Zustand] Migrating store from version ${version} to ${VISUALISER_STORE_VERSION}`)
          let state = persistedState as MigrationState
          
          // Apply migrations sequentially
          for (let i = version + 1; i <= VISUALISER_STORE_VERSION; i++) {
            if (migrations[i]) {
              state = migrations[i](state)
            }
          }

          return state
        },
        partialize: (state) =>
          Object.fromEntries(
            Object.entries(state).filter(
              ([key]) =>
                // Exclude runtime-only state from persistence
                ![
                  'glContext',
                  'canvasSize',
                  'astrofoxReady',
                  'saveError'
                ].includes(key)
            )
          )
      }
    ),
    {
      name: 'Visualiser Store',
      enabled: process.env.NODE_ENV !== 'production' // Only enable devtools in development
    }
  )
)

// Export store state type for TypeScript
const state = useStore.getState()
export type IStore = typeof state

export default useStore
