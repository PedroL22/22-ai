import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SidebarStore = {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  selectedTab: 'chat' | 'settings'
  setSelectedTab: (selectedTab: 'chat' | 'settings') => void
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      isOpen: true,
      setIsOpen: (isOpen) => set({ isOpen }),
      selectedTab: 'chat',
      setSelectedTab: (selectedTab) => set({ selectedTab }),
    }),
    {
      name: 'sidebar-storage',
    }
  )
)
