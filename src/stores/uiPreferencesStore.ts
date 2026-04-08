import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface UiPreferencesState {
  darkModeEnabled: boolean
  isHydrated: boolean
  setDarkModeEnabled: (darkModeEnabled: boolean) => void
  setHydrated: (isHydrated: boolean) => void
}

export const useUiPreferencesStore = create<UiPreferencesState>()(
  persist(
    set => ({
      darkModeEnabled: false,
      isHydrated: false,
      setDarkModeEnabled: darkModeEnabled => set({ darkModeEnabled }),
      setHydrated: isHydrated => set({ isHydrated }),
    }),
    {
      name: 'iqa-ui-preferences-storage',
      partialize: state => ({
        darkModeEnabled: state.darkModeEnabled,
      }),
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => state => {
        state?.setHydrated(true)
      },
    },
  ),
)
