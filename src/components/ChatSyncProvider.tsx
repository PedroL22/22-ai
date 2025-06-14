'use client'

import { useChatSync } from '~/lib/useChatSync'

/**
 * Global component to handle chat synchronization
 * This component should be included at the app level to ensure sync happens globally.
 */
export const ChatSyncProvider = () => {
  // Initialize sync - this will handle login/logout automatically
  useChatSync()

  // This component doesn't render anything, it just handles the sync logic
  return null
}
