'use client'

import { useEffect } from 'react'
import { useApiKeyStore } from '~/stores/useApiKeyStore'
import { getApiKeyInfo, getAvailableApiKeysForClient } from './api-key-manager'

/**
 * Hook for managing API keys on the client side using Zustand store
 */
export const useApiKeyManager = () => {
  const {
    currentKeyIndex,
    totalKeys,
    rateLimitedKeys,
    setCurrentKeyIndex,
    cycleToNext,
    resetToFirst,
    updateLastUpdated,
    setTotalKeys,
    markKeyAsRateLimited,
    isKeyRateLimited,
    getNextAvailableKeyIndex,
    clearExpiredRateLimits,
  } = useApiKeyStore()

  // Initialize the store with available keys info
  useEffect(() => {
    const info = getApiKeyInfo()
    setTotalKeys(info.totalKeys)

    // Clear expired rate limits on component mount
    clearExpiredRateLimits()

    // Ensure current index is within bounds and not rate limited
    if (currentKeyIndex >= info.totalKeys || isKeyRateLimited(currentKeyIndex)) {
      const nextAvailable = getNextAvailableKeyIndex()
      if (nextAvailable !== null) {
        setCurrentKeyIndex(nextAvailable)
      }
    }
  }, [
    currentKeyIndex,
    setCurrentKeyIndex,
    setTotalKeys,
    clearExpiredRateLimits,
    isKeyRateLimited,
    getNextAvailableKeyIndex,
  ])

  /**
   * Get the current API key
   */
  const getCurrentApiKey = (): string | null => {
    const availableKeys = getAvailableApiKeysForClient()

    if (availableKeys.length === 0) {
      throw new Error('No OpenRouter API keys are configured')
    }

    // Clear expired rate limits first
    clearExpiredRateLimits() // Check if current key is rate limited
    if (isKeyRateLimited(currentKeyIndex)) {
      const nextAvailable = getNextAvailableKeyIndex()
      if (nextAvailable !== null) {
        setCurrentKeyIndex(nextAvailable)
        return availableKeys[nextAvailable]!
      }

      console.error('🚫 All API keys are rate limited!')
      return null
    }

    // Ensure the current index is within bounds
    const safeIndex = currentKeyIndex >= availableKeys.length ? 0 : currentKeyIndex

    if (safeIndex !== currentKeyIndex) {
      setCurrentKeyIndex(safeIndex)
    }

    return availableKeys[safeIndex]!
  }

  /**
   * Cycle to the next API key when the current one fails
   */
  const cycleToNextApiKey = (): string | null => {
    const nextIndex = cycleToNext()
    if (nextIndex === null) {
      console.error('🚫 All API keys are rate limited!')
      return null
    }

    const availableKeys = getAvailableApiKeysForClient()
    return availableKeys[nextIndex]!
  }

  /**
   * Mark current API key as rate limited and cycle to next
   */
  const markCurrentAsRateLimited = (): string | null => {
    markKeyAsRateLimited(currentKeyIndex)
    return cycleToNextApiKey()
  }

  /**
   * Reset to the first available API key
   */
  const resetToFirstApiKey = () => {
    resetToFirst()
  }
  /**
   * Get API key information
   */
  const getKeyInfo = () => {
    const rateLimitedCount = Object.keys(rateLimitedKeys).length

    return {
      currentIndex: currentKeyIndex,
      totalKeys,
      hasMultipleKeys: totalKeys > 1,
      currentKeyNumber: currentKeyIndex + 1,
      rateLimitedCount,
      availableCount: totalKeys - rateLimitedCount,
      allRateLimited: rateLimitedCount === totalKeys,
      currentKeyRateLimited: isKeyRateLimited(currentKeyIndex),
    }
  }

  return {
    getCurrentApiKey,
    cycleToNextApiKey,
    markCurrentAsRateLimited,
    resetToFirstApiKey,
    getKeyInfo,
    // Direct access to store actions
    updateLastUpdated,
    clearExpiredRateLimits,
  }
}
