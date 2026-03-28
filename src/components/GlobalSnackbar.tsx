import type { SyntheticEvent } from 'react'
import { Alert, Snackbar } from '@mui/material'

import { useSnackbarStore } from '@/stores/snackbarStore'

function GlobalSnackbar() {
  const { duration, hide, message, open, severity } = useSnackbarStore()

  const handleClose = (_event?: Event | SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') {
      return
    }

    hide()
  }

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      autoHideDuration={duration}
      onClose={handleClose}
      open={open}
    >
      <Alert onClose={handleClose} severity={severity} sx={{ minWidth: 280 }} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  )
}

export default GlobalSnackbar
