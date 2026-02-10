/**
 * RootGrid - Root container grid with background-aware styling
 */

import React from 'react'
import { Grid } from '@mui/material'

interface RootGridProps {
  background?: boolean
  children: React.ReactNode
}

const RootGrid: React.FC<RootGridProps> = ({ background, children }) => {
  return (
    <Grid
      container
      spacing={background ? 0 : 2}
      sx={{
        justifyContent: 'center',
        paddingTop: background ? 0 : '1rem',
        width: '100%',
        maxWidth: background ? '100%' : '1600px',
        height: background ? '100vh' : 'auto',
        margin: background ? 0 : '0 auto'
      }}
    >
      {children}
    </Grid>
  )
}

export default RootGrid
