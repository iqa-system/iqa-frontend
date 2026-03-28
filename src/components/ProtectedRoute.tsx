import { Navigate, Outlet, useLocation } from 'react-router'

import LoadingScreen from '@/components/LoadingScreen'
import { useAuthStore } from '@/stores/authStore'

function ProtectedRoute() {
  const isHydrated = useAuthStore(state => state.isHydrated)
  const token = useAuthStore(state => state.token)
  const location = useLocation()

  if (!isHydrated) {
    return <LoadingScreen description="正在恢复本地登录信息。" title="准备会话" />
  }

  if (!token) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return <Outlet />
}

export default ProtectedRoute
