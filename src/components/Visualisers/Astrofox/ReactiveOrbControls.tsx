/**
 * Reactive Orb Layer Controls
 */

import {
  TextField,
  Slider,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  SelectChangeEvent
} from '@mui/material'
import type { ReactiveOrbLayer, FrequencyBand } from '../../../engines/astrofox/types'

const FREQUENCY_BANDS: FrequencyBand[] = ['bass', 'mid', 'high']

export interface ReactiveOrbControlsProps {
  layer: ReactiveOrbLayer
  onUpdate: (updates: Partial<ReactiveOrbLayer>) => void
}

export function ReactiveOrbControls({ layer, onUpdate }: ReactiveOrbControlsProps) {
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        REACTIVE ORB (3D)
      </Typography>

      <TextField
        fullWidth
        size="small"
        label="Color"
        type="color"
        value={layer.color}
        onChange={(e) => onUpdate({ color: e.target.value })}
        sx={{ mb: 2 }}
      />

      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>Frequency Bands</InputLabel>
        <Select
          multiple
          value={layer.frequencyBands as unknown as string}
          onChange={(e: SelectChangeEvent<string>) => {
            const value = e.target.value
            const bands = typeof value === 'string' ? value.split(',') as FrequencyBand[] : value as unknown as FrequencyBand[]
            onUpdate({ frequencyBands: bands })
          }}
          input={<OutlinedInput label="Frequency Bands" />}
          renderValue={(selected) => (typeof selected === 'string' ? selected : (selected as unknown as FrequencyBand[]).join(', '))}
        >
          {FREQUENCY_BANDS.map((band) => (
            <MenuItem key={band} value={band}>
              <Checkbox checked={layer.frequencyBands.indexOf(band) > -1} />
              <ListItemText primary={band.charAt(0).toUpperCase() + band.slice(1)} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography variant="caption" color="text.secondary">
        Audio Sensitivity: {layer.audioSensitivity.toFixed(2)}
      </Typography>
      <Slider
        value={layer.audioSensitivity}
        onChange={(_, v) => onUpdate({ audioSensitivity: v as number })}
        min={0}
        max={3}
        step={0.1}
        size="small"
        sx={{ mb: 2 }}
      />

      <Typography variant="caption" color="text.secondary">
        Displacement: {layer.displacementAmount.toFixed(2)}
      </Typography>
      <Slider
        value={layer.displacementAmount}
        onChange={(_, v) => onUpdate({ displacementAmount: v as number })}
        min={0}
        max={1}
        step={0.05}
        size="small"
        sx={{ mb: 2 }}
      />

      <Typography variant="caption" color="text.secondary">
        Noise Scale: {layer.noiseScale.toFixed(2)}
      </Typography>
      <Slider
        value={layer.noiseScale}
        onChange={(_, v) => onUpdate({ noiseScale: v as number })}
        min={0.5}
        max={3}
        step={0.1}
        size="small"
        sx={{ mb: 2 }}
      />

      <Typography variant="caption" color="text.secondary">
        Subdivisions: {layer.subdivisions}
      </Typography>
      <Slider
        value={layer.subdivisions}
        onChange={(_, v) => onUpdate({ subdivisions: v as number })}
        min={2}
        max={6}
        step={1}
        size="small"
        sx={{ mb: 2 }}
      />

      <Typography variant="caption" color="text.secondary">
        Fresnel Intensity: {layer.fresnelIntensity.toFixed(2)}
      </Typography>
      <Slider
        value={layer.fresnelIntensity}
        onChange={(_, v) => onUpdate({ fresnelIntensity: v as number })}
        min={0}
        max={3}
        step={0.1}
        size="small"
        sx={{ mb: 2 }}
      />
    </>
  )
}

export default ReactiveOrbControls
