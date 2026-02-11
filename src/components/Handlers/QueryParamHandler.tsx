import { useEffect } from 'react'
import { useStore } from '../../store'
import { getAllVisualizerTypes, createDisplayNameMap, type VisualisationType } from '../../engines/webgl/registry'
import { VISUALIZER_REGISTRY } from '../../_generated'
import type { SchemaProperty } from '../../../schemas/base.schema'

const VISUALIZER_TYPES = getAllVisualizerTypes()

/**
 * Converts a string value to the appropriate type based on schema property
 */
const convertValueBySchema = (value: string, property: SchemaProperty): any => {
  switch (property.type) {
    case 'boolean':
      return value === 'true' || value === '1' || value === 'yes'
    
    case 'integer': {
      const parsed = parseInt(value, 10)
      if (isNaN(parsed)) return undefined
      // Apply min/max constraints if present
      if ('minimum' in property && parsed < property.minimum!) return property.minimum
      if ('maximum' in property && parsed > property.maximum!) return property.maximum
      return parsed
    }
    
    case 'number': {
      const parsed = parseFloat(value)
      if (isNaN(parsed)) return undefined
      // Apply min/max constraints if present
      if ('minimum' in property && parsed < property.minimum!) return property.minimum
      if ('maximum' in property && parsed > property.maximum!) return property.maximum
      return parsed
    }
    
    case 'string':
      // Check enum constraint if present
      if ('enum' in property && property.enum && !property.enum.includes(value)) {
        return property.default // Fallback to default if not in enum
      }
      return value
    
    case 'array':
      // Support JSON arrays: ?colors=["red","blue"] or comma-separated: ?colors=red,blue
      try {
        return JSON.parse(value)
      } catch {
        return value.split(',').map(v => v.trim())
      }
    
    case 'object':
      // Support JSON objects: ?position={"x":1,"y":2}
      try {
        return JSON.parse(value)
      } catch {
        return undefined
      }
    
    default:
      return value
  }
}

/**
 * Side-effect component that handles URL query parameters for initial visualizer setup.
 * 
 * **Auto-generates support for ALL config properties from schemas!**
 * 
 * Usage examples:
 * - ?visual=butterchurn&currentPresetIndex=42&cycleInterval=30&blendTime=5
 * - ?visual=fluid&fluidDensity=0.8&particleCount=5000
 * - ?visual=frequencyrings&ringCount=10&rotationSpeed=2
 * - ?visual=auroraborealis&waveSpeed=1.5&colorShift=true
 * - ?visual=butterchurn&controls=false (hides overlays for clean display)
 * 
 * Special params:
 * - visual: Visualizer name (technical or display name)
 * - controls: Show/hide UI overlays (true/false, 1/0, yes/no)
 * - preset: Butterchurn preset name (legacy support)
 * - presetIndex: Butterchurn preset index (legacy support)
 */
export const QueryParamHandler = () => {
  const setVisualType = useStore(state => state.setVisualType)
  const updateButterchurnConfig = useStore(state => state.updateButterchurnConfig)
  const updateVisualizerConfig = useStore(state => state.updateVisualizerConfig)
  const setShowOverlays = useStore(state => state.setShowOverlays)

  useEffect(() => {
    // Extract query string - works for both standalone mode and HashRouter embedded mode
    // Standalone (port 3001): http://localhost:3001/?visual=butterchurn → use window.location.search
    // Embedded (port 3000): http://localhost:3000/#/visualiser?visual=butterchurn → use hash after '?'
    const hash = window.location.hash
    const hashQueryStart = hash.indexOf('?')
    const hashQueryString = hashQueryStart >= 0 ? hash.substring(hashQueryStart) : ''
    const searchQueryString = window.location.search
    
    // Prefer search string (standalone), fallback to hash (embedded)
    const queryString = searchQueryString || hashQueryString
    const params = new URLSearchParams(queryString)
    
    // Handle controls parameter (supports controls=false or showControls=false)
    const controlsParam = params.get('controls') || params.get('showControls')
    if (controlsParam !== null) {
      const showControls = controlsParam === 'true' || controlsParam === '1' || controlsParam === 'yes'
      setShowOverlays(showControls)
    }
    
    const visualParam = params.get('visual')

    if (!visualParam) return

    const displayNameMap = createDisplayNameMap()
    const normalizedParam = visualParam.toLowerCase().trim()
    
    // Try display name first, then technical name
    const targetVisualType = displayNameMap[normalizedParam] || 
                      (VISUALIZER_TYPES.includes(normalizedParam as VisualisationType) 
                        ? normalizedParam as VisualisationType 
                        : null)
    
    if (!targetVisualType) return

    setVisualType(targetVisualType)
    
    // Get schema for this visualizer
    const registryEntry = VISUALIZER_REGISTRY[targetVisualType]
    if (!registryEntry) return

    const schema = registryEntry.getUISchema()
    const properties = schema.properties || {}
    
    // Build config object from URL params matching schema properties
    const configUpdate: Record<string, any> = {}
    
    params.forEach((value, key) => {
      // Skip the 'visual' param itself
      if (key === 'visual') return
      
      // Legacy support: 'preset' → 'currentPresetName'
      const propertyKey = key === 'preset' ? 'currentPresetName' : key
      // Legacy support: 'presetIndex' → 'currentPresetIndex'
      const finalKey = propertyKey === 'presetIndex' ? 'currentPresetIndex' : propertyKey
      
      const property = properties[finalKey]
      if (!property) return
      
      const convertedValue = convertValueBySchema(value, property)
      
      if (convertedValue !== undefined) {
        configUpdate[finalKey] = convertedValue
      }
    })
    
    // Apply config if we have any updates
    if (Object.keys(configUpdate).length > 0) {
      if (targetVisualType === 'butterchurn') {
        // Butterchurn uses special initialPreset* keys for URL loading
        const butterchurnUpdate: Record<string, any> = {}
        if ('currentPresetName' in configUpdate) {
          butterchurnUpdate.initialPresetName = configUpdate.currentPresetName
          delete configUpdate.currentPresetName
        }
        if ('currentPresetIndex' in configUpdate) {
          butterchurnUpdate.initialPresetIndex = configUpdate.currentPresetIndex
          delete configUpdate.currentPresetIndex
        }
        
        updateButterchurnConfig({ ...butterchurnUpdate, ...configUpdate })
      } else {
        updateVisualizerConfig(targetVisualType, configUpdate)
      }
    }
  }, [setVisualType, updateButterchurnConfig, updateVisualizerConfig, setShowOverlays])

  return null
}
