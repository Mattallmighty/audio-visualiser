import { useEffect } from 'react'
import { useStore } from '../../store'
import { getAllVisualizerTypes, createDisplayNameMap, type VisualisationType } from '../../engines/webgl/registry'

const VISUALIZER_TYPES = getAllVisualizerTypes()

/**
 * Side-effect component that handles URL query parameters for initial visualizer setup.
 * Supports: ?visual=<name>&preset=<name>&presetIndex=<number>
 */
export const QueryParamHandler = () => {
  const setVisualType = useStore(state => state.setVisualType)
  const updateButterchurnConfig = useStore(state => state.updateButterchurnConfig)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const visualParam = params.get('visual')
    const presetParam = params.get('preset')
    const presetIndexParam = params.get('presetIndex')

    if (visualParam) {
      const displayNameMap = createDisplayNameMap()
      const normalizedParam = visualParam.toLowerCase().trim()
      
      // Try display name first, then technical name
      const targetVisualType = displayNameMap[normalizedParam] || 
                        (VISUALIZER_TYPES.includes(normalizedParam as VisualisationType) 
                          ? normalizedParam as VisualisationType 
                          : null)
      
      if (targetVisualType) {
        setVisualType(targetVisualType)
        
        // If preset parameters are provided and we're loading butterchurn, set them
        if (targetVisualType === 'butterchurn') {
          if (presetParam) {
            updateButterchurnConfig({ initialPresetName: presetParam })
          } else if (presetIndexParam) {
            const presetIndex = parseInt(presetIndexParam, 10)
            if (!isNaN(presetIndex) && presetIndex >= 0) {
              updateButterchurnConfig({ initialPresetIndex: presetIndex })
            }
          }
        }
      }
    }
  }, [setVisualType, updateButterchurnConfig])

  return null
}
