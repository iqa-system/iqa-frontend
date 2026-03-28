import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { AuthTokenResponse, UserInfo } from '@/types/api'

interface AuthState {
  accessToken: string
  expiresIn: number | null
  username: string
  userId: number | null
  registerTime: string
  isAuthenticated: boolean
  isInitializing: boolean
  hasInitialized: boolean
  setInitializing: (value: boolean) => void
  finishInitialization: () => void
  setSession: (payload: AuthTokenResponse) => void
  setUserInfo: (payload: UserInfo) => void
  clearAuth: () => void
}

const createInitialAuthState = () => ({
  accessToken: '',
  expiresIn: null,
  username: '',
  userId: null,
  registerTime: '',
  isAuthenticated: false,
  isInitializing: true,
  hasInitialized: false,
})

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...createInitialAuthState(),

      setInitializing: (value) => {
        set({ isInitializing: value })
      },

      finishInitialization: () => {
        set({
          isInitializing: false,
          hasInitialized: true,
        })
      },

      // token 刷新成功或手动登录成功后, 统一通过这里保存会话信息.
      setSession: (payload) => {
        set({
          accessToken: payload.accessToken,
          expiresIn: payload.expiresIn,
          isAuthenticated: Boolean(payload.accessToken),
        })
      },

      setUserInfo: (payload) => {
        set({
          username: payload.username,
          userId: payload.id,
          registerTime: payload.registerTime,
          isAuthenticated: true,
        })
      },

      // 清空登录态时不重置初始化标记, 避免应用在同一轮启动中反复抖动.
      clearAuth: () => {
        set((state) => ({
          ...state,
          accessToken: '',
          expiresIn: null,
          username: '',
          userId: null,
          registerTime: '',
          isAuthenticated: false,
        }))
      },
    }),
    {
      name: 'iqa-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        expiresIn: state.expiresIn,
        username: state.username,
        userId: state.userId,
        registerTime: state.registerTime,
      }),
    }
  )
)
