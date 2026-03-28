import { Outlet } from 'react-router'

import { AppLoadingScreen } from '@/components/common/app-loading-screen'
import { useAuthBootstrap } from '@/hooks/use-auth-bootstrap'

export function RootLayout() {
  const { isInitializing, hasInitialized } = useAuthBootstrap()

  if (isInitializing || !hasInitialized) {
    return <AppLoadingScreen />
  }

  return <Outlet />
}

