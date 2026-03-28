import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { RouterProvider } from 'react-router'

import { GlobalSnackbar } from '@/components/common/global-snackbar'
import { router } from '@/route'
import { appTheme } from '@/theme'

function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <RouterProvider router={router} />
      <GlobalSnackbar />
    </ThemeProvider>
  )
}

export default App
