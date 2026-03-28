import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { AuthTokenResponse, UserInfo } from '@/types/api'

interface AuthState {
  token: AuthTokenResponse | null
  user: UserInfo | null
  isHydrated: boolean
  isSessionChecking: boolean
  isSessionValidated: boolean
  login: (token: AuthTokenResponse, user: UserInfo | null) => void
  logout: () => void
  setHydrated: (isHydrated: boolean) => void
  setSessionChecking: (isSessionChecking: boolean) => void
  setSessionValidated: (isSessionValidated: boolean) => void
  setToken: (token: AuthTokenResponse | null) => void
  setUser: (user: UserInfo | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      token: null,
      user: null,
      isHydrated: false,
      isSessionChecking: false,
      isSessionValidated: false,
      login: (token, user) =>
        set({
          token,
          user,
          isSessionValidated: true,
        }),
      logout: () =>
        set({
          token: null,
          user: null,
          isSessionChecking: false,
          isSessionValidated: false,
        }),
      setHydrated: isHydrated => set({ isHydrated }),
      setSessionChecking: isSessionChecking => set({ isSessionChecking }),
      setSessionValidated: isSessionValidated => set({ isSessionValidated }),
      setToken: token =>
        set(state => ({
          token,
          isSessionValidated: token ? state.isSessionValidated : false,
        })),
      setUser: user => set({ user }),
    }),
    {
      name: 'iqa-auth-storage',
      partialize: state => ({
        token: state.token,
        user: state.user,
      }),
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => state => {
        state?.setHydrated(true)
      },
    },
  ),
)
