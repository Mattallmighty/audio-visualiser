import React from 'react'
import { Card, CardContent, Grid } from '@mui/material'

interface CanvasCardProps {
  background?: boolean
  children: React.ReactNode
}

const CanvasCard: React.FC<CanvasCardProps> = ({ background, children }) => {
  return (
    <Grid size={{ xs: 12 }}>
      <Card
        variant="outlined"
        sx={{
          '& > .MuiCardContent-root': { pb: '0.25rem' },
          ...(background && {
            border: 'none',
            background: 'transparent',
            boxShadow: 'none'
          })
        }}
      >
        <CardContent sx={background ? { padding: 0, '&:last-child': { paddingBottom: 0 } } : {}}>
          {children}
        </CardContent>
      </Card>
    </Grid>
  )
}

export default CanvasCard
