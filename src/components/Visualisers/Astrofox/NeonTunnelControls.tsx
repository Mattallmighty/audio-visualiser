/**
 * Neon Tunnel Layer Controls
 */

import {
  TextField,
  Slider,
  Typography,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  SelectChangeEvent
} from '@mui/material'
import type { NeonTunnelLayer, FrequencyBand } from '../../../engines/astrofox/types'

const FREQUENCY_BANDS: FrequencyBand[] = ['bass', 'mid', 'high']

export interface NeonTunnelControlsProps {
  layer: NeonTunnelLayer
  onUpdate: (updates: Partial<NeonTunnelLayer>) => void
}

export function NeonTunnelControls({ layer, onUpdate }: NeonTunnelControlsProps) {
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        NEON TUNNEL (3D)
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
        Glow Intensity: {layer.glowIntensity.toFixed(2)}
      </Typography>
      <Slider
        value={layer.glowIntensity}
        onChange={(_, v) => onUpdate({ glowIntensity: v as number })}
        min={0}
        max={3}
        step={0.1}
        size="small"
        sx={{ mb: 2 }}
      />

      <Typography variant="caption" color="text.secondary">
        Speed: {layer.speed.toFixed(2)}
      </Typography>
      <Slider
        value={layer.speed}
        onChange={(_, v) => onUpdate({ speed: v as number })}
        min={0}
        max={2}
        step={0.1}
        size="small"
        sx={{ mb: 2 }}
      />

      <Typography variant="caption" color="text.secondary">
        Segments: {layer.segments}
      </Typography>
      <Slider
        value={layer.segments}
        onChange={(_, v) => onUpdate({ segments: v as number })}
        min={8}
        max={64}
        step={4}
        size="small"
        sx={{ mb: 2 }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={layer.cameraShakeEnabled}
            onChange={(e) => onUpdate({ cameraShakeEnabled: e.target.checked })}
            size="small"
          />
        }
        label="Camera Shake"
      />

      {layer.cameraShakeEnabled && (
        <>
          <Typography variant="caption" color="text.secondary">
            Shake Intensity: {layer.cameraShakeIntensity.toFixed(2)}
          </Typography>
          <Slider
            value={layer.cameraShakeIntensity}
            onChange={(_, v) => onUpdate({ cameraShakeIntensity: v as number })}
            min={0}
            max={0.5}
            step={0.01}
            size="small"
            sx={{ mb: 2 }}
          />
        </>
      )}
    </>
  )
}

export default NeonTunnelControls
