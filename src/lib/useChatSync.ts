'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useRef } from 'react'

import { useChatStore } from '~/stores/useChatStore'

import { api } from '~/trpc/react'

/**
 * Custom hook to handle chat synchronization between local storage and database
 * - When user logs in: sync local chats to DB and load all DB chats
 * - When user logs out: clear synced chats and show only local chats
 */
export const useChatSync = () => {
  const { getLocalChatsForSync, syncChatsFromDatabase, setChatsDisplayMode, chatsDisplayMode, setSyncing } =
    useChatStore()
  const { isSignedIn, isLoaded } = useUser()

  const syncMutation = api.chat.syncLocalChatsToDatabase.useMutation()
  const getUserChatsQuery = api.chat.getAllUserChatsWithMessages.useQuery(undefined, {
    enabled: isSignedIn && isLoaded,
    retry: false,
  })

  const hasAttemptedSync = useRef(false)
  const previousSignInState = useRef<boolean | undefined>(undefined)

  // Initialize syncing state based on auth status
  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      setSyncing(false)
    }
  }, [isLoaded, isSignedIn, setSyncing])

  // Handle login/logout state changes
  useEffect(() => {
    if (!isLoaded) return

    // Only proceed if sign-in state has actually changed
    if (previousSignInState.current === isSignedIn) return

    previousSignInState.current = isSignedIn

    if (isSignedIn) {
      // User just logged in - sync local chats to database
      handleUserLogin()
    } else {
      // User just logged out - switch to local mode
      handleUserLogout()
    }
  }, [isSignedIn, isLoaded])

  // Handle database chats loading after sync
  useEffect(() => {
    if (isSignedIn && getUserChatsQuery.data && !getUserChatsQuery.isLoading && hasAttemptedSync.current) {
      // Load synced chats from database
      syncChatsFromDatabase(getUserChatsQuery.data)
      setSyncing(false) // Ensure syncing is stopped after data is loaded
    }
  }, [getUserChatsQuery.data, getUserChatsQuery.isLoading, isSignedIn, syncChatsFromDatabase, setSyncing])

  const handleUserLogin = async () => {
    if (hasAttemptedSync.current) return

    setSyncing(true)

    try {
      const localChats = getLocalChatsForSync()

      if (localChats.length > 0) {
        console.log('🔄 Syncing', localChats.length, 'local chats to database...')
        // Sync local chats to database
        const chatsToSync = localChats.map((chat) => ({
          ...chat,
          title: chat.title || 'New chat', // Ensure title is never null
        }))

        await syncMutation.mutateAsync({ chats: chatsToSync })

        console.log('✅ Local chats synced successfully.')
      }

      hasAttemptedSync.current = true

      // Refetch user chats to get the latest data including synced chats
      await getUserChatsQuery.refetch()
    } catch (error) {
      console.error('❌ Failed to sync local chats: ', error)
      // If sync fails, still switch to synced mode to show DB chats
      setChatsDisplayMode('synced')
    } finally {
      setSyncing(false)
    }
  }

  const handleUserLogout = () => {
    console.log('👋 User logged out - switching to local chat mode')
    setChatsDisplayMode('local')
    setSyncing(false) // Ensure syncing is stopped when logged out
    hasAttemptedSync.current = false
    // Note: We don't clear local chats here - they remain in localStorage
    // but we switch the display mode so only local chats are shown
  }
  return {
    syncError: syncMutation.error || getUserChatsQuery.error,
    chatsDisplayMode,
  }
}
