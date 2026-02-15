/**
 * Layer Controls Renderer
 *
 * Orchestrates which control components to render based on layer type.
 * Uses a lookup table pattern for clean type-specific control rendering.
 */

import { Box } from '@mui/material'
import type { AstrofoxLayer } from '../../../engines/astrofox/types'
import { CommonControls } from './CommonControls'
import { BarSpectrumControls } from './BarSpectrumControls'
import { WaveSpectrumControls } from './WaveSpectrumControls'
import { SoundWaveControls } from './SoundWaveControls'
import { SoundWave2Controls } from './SoundWave2Controls'
import { TextControls } from './TextControls'
import { ImageControls } from './ImageControls'
import { Geometry3DControls } from './Geometry3DControls'
import { GroupControls } from './GroupControls'
import { NeonTunnelControls } from './NeonTunnelControls'
import { ReactiveOrbControls } from './ReactiveOrbControls'
import { ParticleFieldControls } from './ParticleFieldControls'

export interface LayerControlsRendererProps {
  layer: AstrofoxLayer
  onUpdate: (updates: Partial<AstrofoxLayer>) => void
  allLayers?: AstrofoxLayer[]
}

// Lookup table mapping layer types to their specific control components
const LAYER_CONTROL_MAP = {
  barSpectrum: BarSpectrumControls,
  waveSpectrum: WaveSpectrumControls,
  soundWave: SoundWaveControls,
  soundWave2: SoundWave2Controls,
  text: TextControls,
  image: ImageControls,
  geometry3d: Geometry3DControls,
  group: GroupControls
} as const

export function LayerControlsRenderer({ layer, onUpdate, allLayers = [] }: LayerControlsRendererProps) {
  // Render type-specific controls based on layer type
  const renderTypeSpecificControls = () => {
    switch (layer.type) {
      case 'barSpectrum':
        return <BarSpectrumControls layer={layer} onUpdate={onUpdate} />
      case 'waveSpectrum':
        return <WaveSpectrumControls layer={layer} onUpdate={onUpdate} />
      case 'soundWave':
        return <SoundWaveControls layer={layer} onUpdate={onUpdate} />
      case 'soundWave2':
        return <SoundWave2Controls layer={layer} onUpdate={onUpdate} />
      case 'text':
        return <TextControls layer={layer} onUpdate={onUpdate} />
      case 'image':
        return <ImageControls layer={layer} onUpdate={onUpdate} />
      case 'geometry3d':
        return <Geometry3DControls layer={layer} onUpdate={onUpdate} />
      case 'group':
        return <GroupControls layer={layer} onUpdate={onUpdate} />
      case 'neonTunnel':
        return <NeonTunnelControls layer={layer} onUpdate={onUpdate} />
      case 'reactiveOrb':
        return <ReactiveOrbControls layer={layer} onUpdate={onUpdate} />
      case 'particleField':
        return <ParticleFieldControls layer={layer} onUpdate={onUpdate} />
      default:
        return null
    }
  }

  return (
    <Box sx={{ p: 2, overflow: 'auto', maxHeight: 600 }}>
      {/* Common controls for all layer types */}
      <CommonControls layer={layer} onUpdate={onUpdate} allLayers={allLayers} />

      {/* Type-specific controls */}
      {renderTypeSpecificControls()}
    </Box>
  )
}

export default LayerControlsRenderer
