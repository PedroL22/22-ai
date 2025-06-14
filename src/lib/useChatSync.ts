'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useRef } from 'react'

import { useUserSettings } from '~/lib/useUserSettings'

import { useChatStore } from '~/stores/useChatStore'

import { api } from '~/trpc/react'

/**
 * Custom hook to handle chat synchronization between local storage and database
 * - When user logs in: sync local chats to DB and load all DB chats
 * - When user logs out: clear synced chats and show only local chats
 */
export const useChatSync = () => {
  const {
    getLocalChatsForSync,
    syncChatsFromDatabase,
    moveDbChatsToLocal,
    setChatsDisplayMode,
    chatsDisplayMode,
    setSyncing,
  } = useChatStore()
  const { isSignedIn, isLoaded } = useUser()
  const { settings } = useUserSettings()
  const syncMutation = api.chat.syncLocalChatsToDatabase.useMutation()
  const clearDbChatsMutation = api.chat.clearUserChatsFromDatabase.useMutation()
  const getUserChatsQuery = api.chat.getAllUserChatsWithMessages.useQuery(undefined, {
    enabled: isSignedIn && isLoaded,
    retry: false,
  })

  const hasAttemptedSync = useRef(false)
  const previousSignInState = useRef<boolean | undefined>(undefined)
  const previousSyncSetting = useRef<boolean | null | undefined>(undefined)

  // Initialize syncing state based on auth status
  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn && !!settings?.syncWithDb) {
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
      // User just logged in - check sync settings and handle accordingly
      handleUserLogin()
    } else {
      // User just logged out - switch to local mode
      handleUserLogout()
    }
  }, [isSignedIn, isLoaded, settings?.syncWithDb])

  // Handle database chats loading after sync
  useEffect(() => {
    if (isSignedIn && getUserChatsQuery.data && !getUserChatsQuery.isLoading && hasAttemptedSync.current) {
      // Load synced chats from database
      syncChatsFromDatabase(getUserChatsQuery.data)
      setSyncing(false) // Ensure syncing is stopped after data is loaded
    }
  }, [getUserChatsQuery.data, getUserChatsQuery.isLoading, isSignedIn, syncChatsFromDatabase, setSyncing])

  // Handle sync setting changes when user is signed in
  useEffect(() => {
    if (!isSignedIn || !isLoaded || !settings) return

    const currentSyncSetting = settings.syncWithDb

    // Only proceed if sync setting has actually changed
    if (previousSyncSetting.current === currentSyncSetting) return

    previousSyncSetting.current = currentSyncSetting

    if (!currentSyncSetting && getUserChatsQuery.data) {
      // User disabled sync - move DB chats to local storage
      handleSyncDisabled()
    } else if (currentSyncSetting) {
      // User enabled sync - sync local chats to database
      handleSyncEnabled()
    }
  }, [isSignedIn, isLoaded, settings?.syncWithDb, getUserChatsQuery.data, moveDbChatsToLocal, clearDbChatsMutation])

  const handleUserLogin = async () => {
    if (hasAttemptedSync.current) return

    // Check if sync is enabled in user settings
    if (!settings?.syncWithDb) {
      console.log('⚠️ Sync is disabled - switching to local mode only')
      setChatsDisplayMode('local')
      return
    }

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
  }

  const handleSyncDisabled = async () => {
    console.log('🔄 User disabled sync - moving DB chats to local storage')
    setSyncing(true)

    try {
      if (getUserChatsQuery.data) {
        // Move DB chats to local storage and switch to local mode
        moveDbChatsToLocal(getUserChatsQuery.data)
        console.log('✅ DB chats moved to local storage.')

        await clearDbChatsMutation.mutateAsync()
        console.log('✅ DB chats cleared from database.')
      }
    } catch (error) {
      console.error('❌ Failed to move DB chats to local: ', error)
    } finally {
      setSyncing(false)
    }
  }

  const handleSyncEnabled = () => {
    console.log('🔄 User enabled sync - syncing local chats to database')

    // Reset sync attempt flag so sync can happen again
    hasAttemptedSync.current = false

    // Trigger sync process
    handleUserLogin()
  }

  return {
    syncError: syncMutation.error || getUserChatsQuery.error,
    chatsDisplayMode,
  }
}
