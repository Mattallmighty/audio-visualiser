/**
 * Group Layer Controls
 */

import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Chip
} from '@mui/material'
import type { GroupLayer } from '../../../engines/astrofox/types'

export interface GroupControlsProps {
  layer: GroupLayer
  onUpdate: (updates: Partial<GroupLayer>) => void
}

export function GroupControls({ layer, onUpdate }: GroupControlsProps) {
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        GROUP
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={layer.mask}
            onChange={(e) => onUpdate({ mask: e.target.checked })}
            size="small"
          />
        }
        label="Mask Mode"
        sx={{ mb: 1 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        Mask mode uses the first child as a mask for other children
      </Typography>

      <Typography variant="body2" sx={{ mb: 1 }}>
        Child Layers: {layer.childIds.length}
      </Typography>
      {layer.childIds.length > 0 ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {layer.childIds.map((childId) => (
            <Chip
              key={childId}
              label={childId.slice(0, 8)}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
      ) : (
        <Typography variant="caption" color="text.secondary">
          No child layers. Drag layers onto this group to add them.
        </Typography>
      )}
    </>
  )
}

export default GroupControls
