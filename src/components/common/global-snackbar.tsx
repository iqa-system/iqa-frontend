import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'

import { useSnackbarStore } from '@/stores/snackbar-store'

export function GlobalSnackbar() {
  const { open, message, severity, closeSnackbar } = useSnackbarStore()

  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={closeSnackbar}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
    >
      <Alert
        onClose={closeSnackbar}
        severity={severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  )
}

