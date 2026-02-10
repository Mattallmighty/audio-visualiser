import { useEffect } from 'react'
import { FullScreenHandle } from 'react-full-screen'
import { useStore } from '../../store'
import { VISUALIZER_REGISTRY, getVisualizerIds } from '../../_generated'
import type { VisualiserWindowApi } from '../../types/VisualiserWindowApi'

interface WindowApiHandlerProps {
  butterchurnRef: React.RefObject<any>
  fullscreenHandle: FullScreenHandle
}

/**
 * Side-effect component that sets up the window.visualiserApi.
 * Provides methods requiring component internals (refs, fullscreen handle).
 * Store state/actions are accessed via window.YzAudioVisualiser.useStore
 */
export const WindowApiHandler = ({ butterchurnRef, fullscreenHandle }: WindowApiHandlerProps) => {
  const visualType = useStore(state => state.visualType)
  const butterchurnConfig = useStore(state => state.butterchurnConfig)
  const fullScreen = useStore(state => state.fullScreen)

  useEffect(() => {
    const api: VisualiserWindowApi = {
      // Butterchurn methods (need butterchurnRef access)
      loadPreset: (index: number) => {
        if (visualType === 'butterchurn') {
          const store = useStore.getState()
          store.updateButterchurnConfig({ currentPresetIndex: index })
          butterchurnRef.current?.setPreset(index)
        }
      },
      loadPresetByName: (name: string) => {
        if (visualType === 'butterchurn') {
          butterchurnRef.current?.loadPresetByName(name)
        }
      },
      getCurrentPreset: () => ({
        name: butterchurnRef.current?.getCurrentPresetName?.() || '',
        index: butterchurnConfig.currentPresetIndex
      }),
      getPresetNames: () => {
        return butterchurnRef.current?.getPresetNames?.() || []
      },
      
      // Fullscreen (needs fullscreenHandle)
      toggleFullscreen: () => {
        if (fullScreen) {
          fullscreenHandle.exit()
        } else {
          fullscreenHandle.enter()
        }
      },
      
      // Static registry data
      getVisualizerIds: () => getVisualizerIds(),
      getVisualizerMetadata: (id: string) => VISUALIZER_REGISTRY[id]?.metadata,
      getVisualizerRegistry: () => VISUALIZER_REGISTRY
    }

    window.visualiserApi = api

    return () => {
      delete window.visualiserApi
    }
  }, [visualType, butterchurnConfig, fullScreen, fullscreenHandle, butterchurnRef])

  return null
}
