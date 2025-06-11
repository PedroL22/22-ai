import { useUser } from '@clerk/nextjs'
import { useCallback, useEffect, useRef, useState } from 'react'

import { useChatStore } from '~/stores/useChatStore'
import { api } from '~/trpc/react'

type SyncStatus = {
  isLoading: boolean
  isComplete: boolean
  syncedCount: number
  errors: string[]
}

/**
 * Hook that automatically syncs local chats to database when user logs in
 */
export function useAutoSyncChats() {
  const { user, isLoaded } = useUser()
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isLoading: false,
    isComplete: false,
    syncedCount: 0,
    errors: [],
  })

  const syncCompletedRef = useRef<string | null>(null)
  const isSyncingRef = useRef(false)

  const { localChats, forceCleanLocalChats } = useChatStore()
  const syncMutation = api.chat.syncLocalChats.useMutation()
  const refetchChats = api.chat.getUserChats.useQuery(undefined, {
    enabled: !!user,
    refetchOnWindowFocus: false,
  })

  const performSync = useCallback(async () => {
    if (!user || !isLoaded) return

    const userId = user.id

    if (syncCompletedRef.current === userId || isSyncingRef.current) return

    if (localChats.length === 0) {
      setSyncStatus((prev) => ({ ...prev, isComplete: true }))
      syncCompletedRef.current = userId
      return
    }
    isSyncingRef.current = true
    setSyncStatus((prev) => ({ ...prev, isLoading: true }))

    try {
      const result = await syncMutation.mutateAsync({
        localChats: localChats,
      })

      setSyncStatus({
        isLoading: false,
        isComplete: true,
        syncedCount: result.synced,
        errors: result.errors,
      })
      if (result.synced > 0) {
        forceCleanLocalChats()

        await new Promise((resolve) => setTimeout(resolve, 100))

        const state = useChatStore.getState()
        if (state.localChats.length > 0) {
          console.warn('Local chats not properly cleared, forcing clear again')
          forceCleanLocalChats()
        }

        await refetchChats.refetch()
      }

      syncCompletedRef.current = userId
    } catch (error) {
      setSyncStatus({
        isLoading: false,
        isComplete: false,
        syncedCount: 0,
        errors: [error instanceof Error ? error.message : 'Sync failed'],
      })
    } finally {
      isSyncingRef.current = false
    }
  }, [user, isLoaded, localChats.length, syncMutation, forceCleanLocalChats, refetchChats])

  useEffect(() => {
    performSync()
  }, [performSync])

  useEffect(() => {
    if (user && syncCompletedRef.current !== user.id) {
      syncCompletedRef.current = null
      setSyncStatus({
        isLoading: false,
        isComplete: false,
        syncedCount: 0,
        errors: [],
      })
    }
  }, [user?.id])

  useEffect(() => {
    if (!user && isLoaded) {
      syncCompletedRef.current = null
      setSyncStatus({
        isLoading: false,
        isComplete: false,
        syncedCount: 0,
        errors: [],
      })
    }
  }, [user, isLoaded])

  return {
    ...syncStatus,
    hasLocalChats: localChats.length > 0,
  }
}
