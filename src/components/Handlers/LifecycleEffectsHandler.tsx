import { useEffect } from 'react'
import { useStore } from '../../store'

interface LifecycleEffectsHandlerProps {
  ppState: { isInitialized: boolean }
  ppControls: any
  ppConfig: any
}

/**
 * Side-effect component that handles various lifecycle effects:
 * - Initializes visualizer configs on mount
 * - Tracks Astrofox ref readiness based on visualType
 * - Syncs post-processing config when it changes
 */
export const LifecycleEffectsHandler = ({ 
  ppState, 
  ppControls, 
  ppConfig 
}: LifecycleEffectsHandlerProps) => {
  const visualType = useStore(state => state.visualType)
  const setAstrofoxReady = useStore(state => state.setAstrofoxReady)
  const initializeConfigs = useStore(state => state.initializeConfigs)

  // Initialize visualizer configs on mount
  useEffect(() => {
    initializeConfigs()
  }, [initializeConfigs])

  // Track when Astrofox ref is ready for rendering controls
  useEffect(() => {
    if (visualType === 'astrofox') {
      const timer = setTimeout(() => setAstrofoxReady(true), 50)
      return () => clearTimeout(timer)
    } else {
      setAstrofoxReady(false)
    }
  }, [visualType, setAstrofoxReady])

  // Apply post-processing config when it changes
  useEffect(() => {
    if (ppState.isInitialized) {
      ppControls.setConfig(ppConfig)
    }
  }, [ppConfig, ppState.isInitialized, ppControls])

  return null
}
