import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ApiKeyStore = {
  currentKeyIndex: number
  lastUpdated: number
  totalKeys: number
  rateLimitedKeys: Record<number, string> // keyIndex -> date string (YYYY-MM-DD)
  setCurrentKeyIndex: (index: number) => void
  cycleToNext: () => number | null // returns next available key index or null if all are rate limited
  resetToFirst: () => void
  updateLastUpdated: () => void
  setTotalKeys: (total: number) => void
  markKeyAsRateLimited: (keyIndex: number) => void
  isKeyRateLimited: (keyIndex: number) => boolean
  getNextAvailableKeyIndex: () => number | null
  clearExpiredRateLimits: () => void
  // BYOK API keys
  geminiApiKey: string
  openaiApiKey: string
  anthropicApiKey: string
  grokApiKey: string
  setGeminiApiKey: (key: string) => void
  setOpenaiApiKey: (key: string) => void
  setAnthropicApiKey: (key: string) => void
  setGrokApiKey: (key: string) => void
}

const STORAGE_EXPIRY_HOURS = 1 // Reset to first key after 1 hour

// Helper function to get today's date string
const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0]! // YYYY-MM-DD format
}

export const useApiKeyStore = create<ApiKeyStore>()(
  persist(
    (set, get) => ({
      currentKeyIndex: 0,
      lastUpdated: Date.now(),
      totalKeys: 1,
      rateLimitedKeys: {},
      openaiApiKey: '',
      anthropicApiKey: '',
      geminiApiKey: '',
      grokApiKey: '',
      setCurrentKeyIndex: (index: number) => {
        set({
          currentKeyIndex: index,
          lastUpdated: Date.now(),
        })
      },

      markKeyAsRateLimited: (keyIndex: number) => {
        const today = getTodayString()
        set((state) => ({
          rateLimitedKeys: {
            ...state.rateLimitedKeys,
            [keyIndex]: today,
          },
        }))
        console.log(`🚫 API key #${keyIndex + 1} marked as rate limited until tomorrow`)
      },

      isKeyRateLimited: (keyIndex: number): boolean => {
        const { rateLimitedKeys } = get()
        const rateLimitDate = rateLimitedKeys[keyIndex]
        if (!rateLimitDate) return false

        const today = getTodayString()
        return rateLimitDate === today // Rate limited if marked today
      },

      clearExpiredRateLimits: () => {
        const { rateLimitedKeys } = get()
        const today = getTodayString()
        const updatedRateLimitedKeys: Record<number, string> = {}
        // Keep only rate limits from today (remove expired ones)
        for (const [keyIndex, date] of Object.entries(rateLimitedKeys)) {
          if (date === today) {
            updatedRateLimitedKeys[Number.parseInt(keyIndex)] = date
          }
        }

        set({ rateLimitedKeys: updatedRateLimitedKeys })
      },

      getNextAvailableKeyIndex: (): number | null => {
        const { totalKeys, isKeyRateLimited } = get()

        // Clear expired rate limits first
        get().clearExpiredRateLimits()

        // Find the first available key
        for (let i = 0; i < totalKeys; i++) {
          if (!isKeyRateLimited(i)) {
            return i
          }
        }

        return null // All keys are rate limited
      },

      cycleToNext: (): number | null => {
        const { currentKeyIndex, totalKeys, getNextAvailableKeyIndex } = get()

        if (totalKeys <= 1) return currentKeyIndex // Can't cycle if we only have one key

        // Clear expired rate limits first
        get().clearExpiredRateLimits()

        // Try to find next available key starting from current + 1
        let nextIndex = (currentKeyIndex + 1) % totalKeys
        let attempts = 0

        while (attempts < totalKeys) {
          if (!get().isKeyRateLimited(nextIndex)) {
            set({
              currentKeyIndex: nextIndex,
              lastUpdated: Date.now(),
            })
            console.log(`🔄 Cycling to API key #${nextIndex + 1}`)
            return nextIndex
          }

          nextIndex = (nextIndex + 1) % totalKeys
          attempts++
        }

        // If all keys are rate limited, try to find any available key
        const availableIndex = getNextAvailableKeyIndex()
        if (availableIndex !== null) {
          set({
            currentKeyIndex: availableIndex,
            lastUpdated: Date.now(),
          })
          console.log(`🔄 Cycling to API key #${availableIndex + 1}`)
          return availableIndex
        }

        console.error('🚫 All API keys are rate limited!')
        return null
      },

      resetToFirst: () => {
        // Clear expired rate limits first
        get().clearExpiredRateLimits()

        // Find first available key or default to 0
        const firstAvailable = get().getNextAvailableKeyIndex()
        const keyToUse = firstAvailable !== null ? firstAvailable : 0

        set({
          currentKeyIndex: keyToUse,
          lastUpdated: Date.now(),
        })
        console.log(`🔄 Reset to ${firstAvailable !== null ? 'first available' : 'first'} API key #${keyToUse + 1}`)
      },

      updateLastUpdated: () => {
        set({ lastUpdated: Date.now() })
      },

      setTotalKeys: (total: number) => {
        set({ totalKeys: total })
      },

      setOpenaiApiKey: (key: string) => set({ openaiApiKey: key }),
      setAnthropicApiKey: (key: string) => set({ anthropicApiKey: key }),
      setGeminiApiKey: (key: string) => set({ geminiApiKey: key }),
      setGrokApiKey: (key: string) => set({ grokApiKey: key }),
    }),
    {
      name: 'openrouter-api-key-store', // Check for expiry on hydration and clear expired rate limits
      onRehydrateStorage: () => (state) => {
        if (state) {
          const hoursSinceUpdate = (Date.now() - state.lastUpdated) / (1000 * 60 * 60)
          if (hoursSinceUpdate >= STORAGE_EXPIRY_HOURS) {
            // Reset to first available key after expiry
            state.currentKeyIndex = 0
            state.lastUpdated = Date.now()
          }

          // Clear expired rate limits on app startup
          const today = getTodayString()
          const updatedRateLimitedKeys: Record<number, string> = {}

          if (state.rateLimitedKeys) {
            for (const [keyIndex, date] of Object.entries(state.rateLimitedKeys)) {
              if (date === today) {
                updatedRateLimitedKeys[Number.parseInt(keyIndex)] = date
              }
            }
          }

          state.rateLimitedKeys = updatedRateLimitedKeys
        }
      },
    }
  )
)
