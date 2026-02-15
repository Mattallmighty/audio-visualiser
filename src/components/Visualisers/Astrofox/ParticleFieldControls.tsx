/**
 * Particle Field Layer Controls
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
import type { ParticleFieldLayer, FrequencyBand } from '../../../engines/astrofox/types'

const FREQUENCY_BANDS: FrequencyBand[] = ['bass', 'mid', 'high']

export interface ParticleFieldControlsProps {
  layer: ParticleFieldLayer
  onUpdate: (updates: Partial<ParticleFieldLayer>) => void
}

export function ParticleFieldControls({ layer, onUpdate }: ParticleFieldControlsProps) {
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        PARTICLE FIELD (3D)
      </Typography>

      <TextField
        fullWidth
        size="small"
        label="Particle Color"
        type="color"
        value={layer.particleColor}
        onChange={(e) => onUpdate({ particleColor: e.target.value })}
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
        Particle Count: {layer.particleCount}
      </Typography>
      <Slider
        value={layer.particleCount}
        onChange={(_, v) => onUpdate({ particleCount: v as number })}
        min={500}
        max={10000}
        step={500}
        size="small"
        sx={{ mb: 2 }}
      />

      <Typography variant="caption" color="text.secondary">
        Particle Size: {layer.particleSize.toFixed(1)}
      </Typography>
      <Slider
        value={layer.particleSize}
        onChange={(_, v) => onUpdate({ particleSize: v as number })}
        min={0.5}
        max={5}
        step={0.5}
        size="small"
        sx={{ mb: 2 }}
      />

      <Typography variant="caption" color="text.secondary">
        Speed: {layer.speed.toFixed(2)}
      </Typography>
      <Slider
        value={layer.speed}
        onChange={(_, v) => onUpdate({ speed: v as number })}
        min={0.1}
        max={3}
        step={0.1}
        size="small"
        sx={{ mb: 2 }}
      />

      <Typography variant="caption" color="text.secondary">
        Depth: {layer.depth}
      </Typography>
      <Slider
        value={layer.depth}
        onChange={(_, v) => onUpdate({ depth: v as number })}
        min={20}
        max={100}
        step={5}
        size="small"
        sx={{ mb: 2 }}
      />
    </>
  )
}

export default ParticleFieldControls
