/**
 * CanvasContainer - Outer canvas wrapper with background-aware positioning
 */

import React from 'react'
import { Box } from '@mui/material'

interface CanvasContainerProps {
  background?: boolean
  children: React.ReactNode
}

const CanvasContainer: React.FC<CanvasContainerProps> = ({ background, children }) => {
  return (
    <Box
      sx={{
        position: background ? 'fixed' : 'relative',
        top: background ? 0 : 'auto',
        left: background ? 0 : 'auto',
        width: background ? '100vw' : '100%',
        height: background ? '100vh' : '60vh',
        minHeight: background ? '100vh' : '400px',
        bgcolor: 'black',
        borderRadius: background ? 0 : 1,
        overflow: 'hidden',
        zIndex: background ? 9999 : 'auto',
        '& .fullscreen-wrapper': { width: '100%', height: '100%' }
      }}
    >
      {children}
    </Box>
  )
}

export default CanvasContainer
