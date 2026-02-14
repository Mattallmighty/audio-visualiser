/**
 * Wave Spectrum Layer Controls
 */

import {
  Box,
  TextField,
  Slider,
  Typography,
  FormControlLabel,
  Switch
} from '@mui/material'
import type { WaveSpectrumLayer } from '../../../engines/astrofox/types'

export interface WaveSpectrumControlsProps {
  layer: WaveSpectrumLayer
  onUpdate: (updates: Partial<WaveSpectrumLayer>) => void
}

export function WaveSpectrumControls({ layer, onUpdate }: WaveSpectrumControlsProps) {
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        WAVE SPECTRUM
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          label="Line Width"
          type="number"
          value={layer.lineWidth}
          onChange={(e) => onUpdate({ lineWidth: Number(e.target.value) })}
          sx={{ flex: 1 }}
        />
        <TextField
          size="small"
          label="Line Color"
          type="color"
          value={layer.lineColor}
          onChange={(e) => onUpdate({ lineColor: e.target.value })}
          sx={{ flex: 1 }}
        />
      </Box>

      <FormControlLabel
        control={
          <Switch
            checked={layer.fill}
            onChange={(e) => onUpdate({ fill: e.target.checked })}
            size="small"
          />
        }
        label="Fill"
        sx={{ mb: 1 }}
      />

      {layer.fill && (
        <TextField
          fullWidth
          size="small"
          label="Fill Color"
          type="color"
          value={layer.fillColor}
          onChange={(e) => onUpdate({ fillColor: e.target.value })}
          sx={{ mb: 2 }}
        />
      )}

      <Typography variant="caption" color="text.secondary">
        Min Frequency: {layer.minFrequency} Hz
      </Typography>
      <Slider
        value={layer.minFrequency}
        onChange={(_, v) => onUpdate({ minFrequency: v as number })}
        min={20}
        max={1000}
        size="small"
      />

      <Typography variant="caption" color="text.secondary">
        Max Frequency: {layer.maxFrequency} Hz
      </Typography>
      <Slider
        value={layer.maxFrequency}
        onChange={(_, v) => onUpdate({ maxFrequency: v as number })}
        min={1000}
        max={20000}
        size="small"
      />

      <Typography variant="caption" color="text.secondary">
        Smoothing: {layer.smoothing.toFixed(2)}
      </Typography>
      <Slider
        value={layer.smoothing}
        onChange={(_, v) => onUpdate({ smoothing: v as number })}
        min={0}
        max={0.99}
        step={0.01}
        size="small"
      />
    </>
  )
}

export default WaveSpectrumControls
