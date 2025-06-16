import { env } from '~/env.js'

/**
 * Get all available API keys, filtering out undefined/empty ones
 */
const getAvailableApiKeys = (): string[] => {
  const keys = [
    env.OPENROUTER_API_KEY_1,
    env.OPENROUTER_API_KEY_2,
    env.OPENROUTER_API_KEY_3,
    env.OPENROUTER_API_KEY_4,
    env.OPENROUTER_API_KEY_5,
    env.OPENROUTER_API_KEY_6,
    env.OPENROUTER_API_KEY_7,
    env.OPENROUTER_API_KEY_8,
    env.OPENROUTER_API_KEY_9,
  ].filter((key): key is string => Boolean(key?.trim()))

  return keys
}

/**
 * Server-side fallback storage when Zustand store is not available
 */
let serverSideApiKeyIndex = 0
let serverSideRateLimitedKeys: Record<number, string> = {} // keyIndex -> date string

/**
 * Get today's date string for server-side rate limiting
 */
const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0]!
}

/**
 * Check if a key is rate limited on server-side
 */
const isServerSideKeyRateLimited = (keyIndex: number): boolean => {
  const rateLimitDate = serverSideRateLimitedKeys[keyIndex]
  if (!rateLimitDate) return false

  const today = getTodayString()
  return rateLimitDate === today
}

/**
 * Mark a key as rate limited on server-side
 */
const markServerSideKeyAsRateLimited = (keyIndex: number): void => {
  const today = getTodayString()
  serverSideRateLimitedKeys[keyIndex] = today
  console.log(`🚫 Server-side: API key #${keyIndex + 1} marked as rate limited until tomorrow`)
}

/**
 * Clear expired rate limits on server-side
 */
const clearServerSideExpiredRateLimits = (): void => {
  const today = getTodayString()
  const updatedRateLimitedKeys: Record<number, string> = {}

  for (const [keyIndex, date] of Object.entries(serverSideRateLimitedKeys)) {
    if (date === today) {
      updatedRateLimitedKeys[Number.parseInt(keyIndex)] = date
    }
  }

  serverSideRateLimitedKeys = updatedRateLimitedKeys
}

/**
 * Get next available key index on server-side
 */
const getServerSideNextAvailableKeyIndex = (): number | null => {
  const availableKeys = getAvailableApiKeys()
  clearServerSideExpiredRateLimits()

  for (let i = 0; i < availableKeys.length; i++) {
    if (!isServerSideKeyRateLimited(i)) {
      return i
    }
  }

  return null // All keys are rate limited
}

/**
 * Get the current API key to use (works both client and server side)
 */
export const getCurrentApiKey = (): string => {
  const availableKeys = getAvailableApiKeys()

  if (availableKeys.length === 0) {
    throw new Error('No OpenRouter API keys are configured')
  }

  // For server-side usage, use simple in-memory storage with rate limiting
  if (typeof window === 'undefined') {
    clearServerSideExpiredRateLimits()

    // Check if current key is rate limited
    if (isServerSideKeyRateLimited(serverSideApiKeyIndex)) {
      const nextAvailable = getServerSideNextAvailableKeyIndex()
      if (nextAvailable !== null) {
        serverSideApiKeyIndex = nextAvailable
      } else {
        console.error('🚫 All server-side API keys are rate limited!')
        // Return the current key anyway, let the API call fail
      }
    }

    // Ensure the server-side index is within bounds
    if (serverSideApiKeyIndex >= availableKeys.length) {
      serverSideApiKeyIndex = 0
    }

    return availableKeys[serverSideApiKeyIndex]!
  }

  // For client-side, we'll need to access the store differently
  // since we can't use hooks in regular functions
  // This will be handled by the hook-based functions
  return availableKeys[0]! // Fallback to first key
}

/**
 * Cycle to the next API key when the current one fails (server-side)
 */
export const cycleToNextApiKeyServerSide = (): string => {
  const availableKeys = getAvailableApiKeys()

  if (availableKeys.length <= 1) {
    return availableKeys[0] || ''
  }

  // Mark current key as potentially rate limited since we can't distinguish error types
  markServerSideKeyAsRateLimited(serverSideApiKeyIndex)

  // Clear expired rate limits
  clearServerSideExpiredRateLimits()

  // Try to find next available key starting from current + 1
  let nextIndex = (serverSideApiKeyIndex + 1) % availableKeys.length
  let attempts = 0

  while (attempts < availableKeys.length) {
    if (!isServerSideKeyRateLimited(nextIndex)) {
      serverSideApiKeyIndex = nextIndex
      console.log(`🔄 Cycling to API key #${nextIndex + 1} (server-side)`)
      return availableKeys[nextIndex]!
    }

    nextIndex = (nextIndex + 1) % availableKeys.length
    attempts++
  }

  // If all keys are rate limited, find the first one anyway
  const firstAvailable = getServerSideNextAvailableKeyIndex()
  if (firstAvailable !== null) {
    serverSideApiKeyIndex = firstAvailable
    console.log(`🔄 Using first available API key #${firstAvailable + 1} (server-side)`)
    return availableKeys[firstAvailable]!
  }

  console.error('🚫 All server-side API keys are rate limited!')
  // Return the next key in rotation anyway
  serverSideApiKeyIndex = (serverSideApiKeyIndex + 1) % availableKeys.length
  return availableKeys[serverSideApiKeyIndex]!
}

/**
 * Get information about available API keys
 */
export const getApiKeyInfo = (): {
  totalKeys: number
  hasMultipleKeys: boolean
} => {
  const availableKeys = getAvailableApiKeys()

  return {
    totalKeys: availableKeys.length,
    hasMultipleKeys: availableKeys.length > 1,
  }
}

/**
 * Get available API keys for client-side usage
 */
export const getAvailableApiKeysForClient = (): string[] => {
  return getAvailableApiKeys()
}
