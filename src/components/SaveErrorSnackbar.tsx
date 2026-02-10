import React from 'react'
import { Snackbar, Alert } from '@mui/material'
import { useStore } from '../store'

export const SaveErrorSnackbar = () => {
  const saveError = useStore(state => state.saveError)
  const setSaveError = useStore(state => state.setSaveError)

  return (
    <Snackbar
      open={!!saveError}
      autoHideDuration={6000}
      onClose={() => setSaveError(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={() => setSaveError(null)} severity="warning" sx={{ width: '100%' }}>
        {saveError}
      </Alert>
    </Snackbar>
  )
}
