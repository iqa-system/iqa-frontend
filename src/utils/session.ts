import { useAuthStore } from '@/stores/auth-store'
import { useSnackbarStore } from '@/stores/snackbar-store'

// 这个工具专门处理“会话失效后回到登录页”的统一动作.
// 这样 axios 拦截器和 fetch 流接口都可以复用同一套逻辑.
export function clearAuthSession(message?: string) {
  useAuthStore.getState().clearAuth()

  if (message) {
    useSnackbarStore.getState().openSnackbar({
      message,
      severity: 'warning',
    })
  }

  redirectToAuthPage()
}

export function redirectToAuthPage() {
  if (typeof window === 'undefined') {
    return
  }

  if (window.location.pathname === '/auth') {
    return
  }

  window.location.replace('/auth')
}

