import { useCallback } from 'react'
import { getAllVisualizerTypes, type VisualisationType } from '../engines/webgl/registry'

const VISUALIZER_TYPES = getAllVisualizerTypes()

/**
 * Custom hook for visualizer navigation (previous/next).
 * Handles cycling through the visualizer types list.
 */
export const useVisualizerNavigation = (
  visualType: VisualisationType,
  onTypeChange: (type: VisualisationType) => void
) => {
  const handlePrevVisualizer = useCallback(() => {
    const currentIndex = VISUALIZER_TYPES.indexOf(visualType)
    const prevIndex = currentIndex <= 0 ? VISUALIZER_TYPES.length - 1 : currentIndex - 1
    onTypeChange(VISUALIZER_TYPES[prevIndex])
  }, [visualType, onTypeChange])

  const handleNextVisualizer = useCallback(() => {
    const currentIndex = VISUALIZER_TYPES.indexOf(visualType)
    const nextIndex = currentIndex >= VISUALIZER_TYPES.length - 1 ? 0 : currentIndex + 1
    onTypeChange(VISUALIZER_TYPES[nextIndex])
  }, [visualType, onTypeChange])

  return { handlePrevVisualizer, handleNextVisualizer }
}
