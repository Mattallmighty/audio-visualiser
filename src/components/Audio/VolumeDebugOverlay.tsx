import React from 'react'
import { Paper, Typography, Box } from '@mui/material'

interface VolumeDebugOverlayProps {
  stream: number
  intensity: number
  normalized: number
  preset: string
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
    <Typography variant="caption" sx={{ color: '#aaa' }}>{label}</Typography>
    <Typography variant="caption" sx={{ color: '#4fc3f7', fontFamily: 'monospace' }}>{value}</Typography>
  </Box>
)

const VolumeDebugOverlay: React.FC<VolumeDebugOverlayProps> = ({ stream, intensity, normalized, preset }) => {
  return (
    <Paper
      sx={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        p: 1.5,
        width: 200,
        bgcolor: 'rgba(0,0,0,0.8)',
        color: 'white',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <Typography variant="caption" sx={{ color: '#81c784', fontWeight: 'bold', display: 'block', mb: 1 }}>
        Volume Normalizer ({preset})
      </Typography>
      <Row label="u_volumeTime" value={stream.toFixed(2)} />
      <Row label="u_volumeIntensity" value={intensity.toFixed(4)} />
      <Row label="u_volumeNorm" value={normalized.toFixed(3)} />
      <Box sx={{ mt: 1 }}>
        <Box sx={{ height: 4, bgcolor: '#333', borderRadius: 1, overflow: 'hidden' }}>
          <Box sx={{ height: '100%', width: `${Math.min(100, normalized * 100)}%`, bgcolor: '#4fc3f7', transition: 'width 0.1s' }} />
        </Box>
      </Box>
    </Paper>
  )
}

export default VolumeDebugOverlay
