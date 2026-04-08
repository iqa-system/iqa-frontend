import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider } from '@mui/material'

import App from '@/App'
import ErrorBoundary from '@/components/ErrorBoundary'
import GlobalSnackbar from '@/components/GlobalSnackbar'
import { useUiPreferencesStore } from '@/stores/uiPreferencesStore'
import '@/styles/global.scss'
import { createAppTheme, type ThemeMode } from '@/theme'

function ThemedApp() {
  const darkModeEnabled = useUiPreferencesStore(state => state.darkModeEnabled)
  const themeMode: ThemeMode = darkModeEnabled ? 'dark' : 'light'
  const theme = useMemo(() => createAppTheme(themeMode), [themeMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <App />
        <GlobalSnackbar />
      </ErrorBoundary>
    </ThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemedApp />
  </StrictMode>
)
