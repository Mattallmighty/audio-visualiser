/**
 * VisualizerViewport - Inner viewport with fullscreen-aware layout
 */

import React from 'react'
import { Box } from '@mui/material'

interface VisualizerViewportProps {
  background?: boolean
  fullScreen: boolean
  onDoubleClick: () => void
  children: React.ReactNode
}

const VisualizerViewport: React.FC<VisualizerViewportProps> = ({
  background,
  fullScreen,
  onDoubleClick,
  children
}) => {
  return (
    <Box
      sx={{
        width: fullScreen || background ? '100vw' : '100%',
        height: fullScreen || background ? '100vh' : '100%',
        display: 'flex',
        alignItems: background ? 'stretch' : 'center',
        justifyContent: background ? 'stretch' : 'center',
        bgcolor: 'black',
        zIndex: background ? 1 : 'auto',
        '& > *': background ? { width: '100%', height: '100%' } : {}
      }}
      onDoubleClick={onDoubleClick}
    >
      {children}
    </Box>
  )
}

export default VisualizerViewport
