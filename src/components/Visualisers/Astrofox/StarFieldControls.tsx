/**
 * Star Field Layer Controls
 */

import {
  Box,
  Slider,
  Typography,
  FormControlLabel,
  Switch,
  TextField
} from '@mui/material'
import type { StarFieldLayer } from '../../../engines/astrofox/types'

export interface StarFieldControlsProps {
  layer: StarFieldLayer
  onUpdate: (updates: Partial<StarFieldLayer>) => void
}

export function StarFieldControls({ layer, onUpdate }: StarFieldControlsProps) {
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        STAR FIELD
      </Typography>

      <Typography variant="caption" color="text.secondary">
        Star Count: {layer.starCount}
      </Typography>
      <Slider
        value={layer.starCount}
        onChange={(_, v) => onUpdate({ starCount: v as number })}
        min={20}
        max={500}
        step={10}
        size="small"
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          size="small"
          label="Star Color"
          type="color"
          value={layer.starColor}
          onChange={(e) => onUpdate({ starColor: e.target.value })}
          sx={{ flex: 1 }}
        />
      </Box>

      <Typography variant="caption" color="text.secondary">
        Max Size: {layer.maxSize.toFixed(1)}px
      </Typography>
      <Slider
        value={layer.maxSize}
        onChange={(_, v) => onUpdate({ maxSize: v as number })}
        min={0.5}
        max={5}
        step={0.1}
        size="small"
        sx={{ mb: 2 }}
      />

      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={layer.audioReactive}
            onChange={(e) => onUpdate({ audioReactive: e.target.checked })}
          />
        }
        label="Audio Reactive"
        sx={{ mb: 1 }}
      />

      {layer.audioReactive && (
        <>
          <Typography variant="caption" color="text.secondary">
            Pulse Intensity: {layer.pulseIntensity.toFixed(2)}
          </Typography>
          <Slider
            value={layer.pulseIntensity}
            onChange={(_, v) => onUpdate({ pulseIntensity: v as number })}
            min={0}
            max={1}
            step={0.05}
            size="small"
            sx={{ mb: 2 }}
          />
        </>
      )}

      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={layer.twinkle}
            onChange={(e) => onUpdate({ twinkle: e.target.checked })}
          />
        }
        label="Twinkle"
        sx={{ mb: 1 }}
      />
    </>
  )
}

export default StarFieldControls
