import { refreshAccessToken } from '@/services/auth'
import { getUserInfo } from '@/services/user'
import { useAuthStore } from '@/stores/authStore'
import type { AuthTokenResponse } from '@/types/api'

export async function applyTokenAndLoadUser(token: AuthTokenResponse) {
  const authStore = useAuthStore.getState()

  authStore.setToken(token)

  try {
    console.warn('正在使用新的访问令牌加载用户信息...')
    const user = await getUserInfo()
    console.warn('用户信息加载成功:', user)
    authStore.login(token, user)
    return user
  } catch (error) {
    authStore.logout()
    throw error
  }
}

export async function refreshSessionAndUser() {
  const authStore = useAuthStore.getState()

  if (!authStore.token?.accessToken) {
    throw new Error('未找到有效的登录令牌。')
  }
  const refreshedToken = await refreshAccessToken(authStore.token.accessToken)
  const user = await applyTokenAndLoadUser(refreshedToken)

  return {
    token: refreshedToken,
    user,
  }
}
