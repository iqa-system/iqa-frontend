import { useEffect, useRef } from 'react'

import { useLocation, useNavigate } from 'react-router'

import { refreshAuthToken } from '@/services/auth-service'
import { getCurrentUserInfo } from '@/services/user-service'
import { useAuthStore } from '@/stores/auth-store'

function isProtectedPath(pathname: string) {
  return (
    pathname === '/' ||
    pathname.startsWith('/assess') ||
    pathname.startsWith('/history') ||
    pathname.startsWith('/profile')
  )
}

function getPersistedAccessToken() {
  if (typeof window === 'undefined') {
    return ''
  }

  try {
    const storageValue = window.localStorage.getItem('iqa-auth-storage')

    if (!storageValue) {
      return ''
    }

    const parsedStorage = JSON.parse(storageValue) as {
      state?: {
        accessToken?: string
      }
    }

    return parsedStorage.state?.accessToken ?? ''
  } catch {
    return ''
  }
}

// 应用启动时统一从这里执行自动登录逻辑.
// 这样根布局只需要关心“是否初始化完成”, 不需要把鉴权细节散落在多个页面里.
export function useAuthBootstrap() {
  const navigate = useNavigate()
  const location = useLocation()
  const hasInitialized = useAuthStore((state) => state.hasInitialized)
  const isInitializing = useAuthStore((state) => state.isInitializing)
  const bootstrapStartedRef = useRef(false)

  useEffect(() => {
    if (hasInitialized || bootstrapStartedRef.current) {
      return
    }

    bootstrapStartedRef.current = true

    const bootstrapAuth = async () => {
      const authStore = useAuthStore.getState()
      const savedAccessToken = getPersistedAccessToken()

      authStore.setInitializing(true)

      // 启动时直接从 localStorage 判断是否存在可用 token.
      // 这样就不会因为 persist 的 hydration 回调异常而一直卡在初始化页.
      if (!savedAccessToken) {
        authStore.clearAuth()
        authStore.finishInitialization()

        if (isProtectedPath(location.pathname)) {
          navigate('/auth', { replace: true })
        }

        return
      }

      try {
        const refreshedSession = await refreshAuthToken(savedAccessToken)

        authStore.setSession(refreshedSession)

        const currentUserInfo = await getCurrentUserInfo()

        authStore.setUserInfo(currentUserInfo)
        authStore.finishInitialization()

        // 按既定方案, 自动登录成功后统一落到主页.
        navigate('/assess', { replace: true })
      } catch {
        authStore.clearAuth()
        authStore.finishInitialization()

        if (location.pathname !== '/auth') {
          navigate('/auth', { replace: true })
        }
      }
    }

    void bootstrapAuth()
  }, [hasInitialized, location.pathname, navigate])

  return {
    isInitializing,
    hasInitialized,
  }
}
