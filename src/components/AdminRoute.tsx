import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router'

import LoadingScreen from '@/components/LoadingScreen'
import { useAuthStore } from '@/stores/authStore'
import { useSnackbarStore } from '@/stores/snackbarStore'
import { isAdminRole } from '@/utils/constants'

function AdminRoute() {
  const user = useAuthStore(state => state.user)
  const showWarning = useSnackbarStore(state => state.showWarning)
  const hasAdminPermission = isAdminRole(user?.role)

  /**
   * 权限不足时统一弹出提示, 然后回退到普通工作台首页.
   * 这样既能阻止越权访问, 也不会让用户停留在空白页.
   */
  useEffect(() => {
    if (user && !hasAdminPermission) {
      showWarning('无权访问管理员页面.')
    }
  }, [hasAdminPermission, showWarning, user])

  /**
   * 管理员权限依赖当前用户资料中的 role 字段.
   * 当用户资料还没有准备好时, 先展示加载态, 避免在会话恢复过程中误判权限.
   */
  if (!user) {
    return (
      <LoadingScreen
        description="正在同步当前账号的管理员权限信息."
        fullscreen={false}
        title="校验管理员权限"
      />
    )
  }

  if (!hasAdminPermission) {
    return <Navigate replace to="/assessment" />
  }

  return <Outlet />
}

export default AdminRoute
