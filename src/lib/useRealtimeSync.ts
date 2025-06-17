'use client'

import { useUser } from '@clerk/nextjs'
import { useCallback } from 'react'

import { useUserSettings } from '~/lib/useUserSettings'
import { api } from '~/trpc/react'

import type { Chat as ChatType, Message as MessageType } from '@prisma/client'

/**
 * Custom hook to handle real-time synchronization of chats and messages
 * Only syncs when the user is signed in and has sync enabled in settings.
 */
export const useRealtimeSync = () => {
  const { isSignedIn } = useUser()
  const { settings } = useUserSettings()

  const syncChatMutation = api.chat.syncChatToDatabase.useMutation({
    onError: (error) => {
      console.error('❌ Failed to sync chat to database: ', error)
    },
  })

  const syncMessageMutation = api.chat.syncMessageToDatabase.useMutation({
    onError: (error) => {
      console.error('❌ Failed to sync message to database: ', error)
    },
  })

  const deleteMessagesFromIndexMutation = api.chat.deleteMessagesFromIndex.useMutation({
    onError: (error) => {
      console.error('❌ Failed to delete messages from database: ', error)
    },
  })

  const shouldSync = isSignedIn && settings?.syncWithDb

  const syncChat = useCallback(
    async (chat: ChatType) => {
      if (!shouldSync) return

      try {
        await syncChatMutation.mutateAsync({
          chat: {
            id: chat.id,
            title: chat.title || 'New chat',
            createdAt: chat.createdAt,
            updatedAt: chat.updatedAt,
          },
        })

        console.log('✅ Chat synced to database: ', chat.id)
      } catch (error) {
        console.error('❌ Error syncing chat: ', error)
      }
    },
    [shouldSync, syncChatMutation]
  )

  const syncMessage = useCallback(
    async (message: MessageType) => {
      if (!shouldSync) return

      try {
        await syncMessageMutation.mutateAsync({
          message: {
            id: message.id,
            role: message.role,
            content: message.content,
            isError: message.isError,
            modelId: message.modelId,
            createdAt: message.createdAt,
            chatId: message.chatId,
          },
        })
        console.log('✅ Message synced to database: ', message.id)
      } catch (error) {
        console.error('❌ Error syncing message: ', error)
      }
    },
    [shouldSync, syncMessageMutation]
  )

  const deleteMessagesFromIndex = useCallback(
    async (chatId: string, messageIndex: number) => {
      if (!shouldSync) return

      try {
        await deleteMessagesFromIndexMutation.mutateAsync({
          chatId,
          messageIndex,
        })
        console.log('✅ Messages deleted from database from index: ', messageIndex)
      } catch (error) {
        console.error('❌ Error deleting messages from database: ', error)
      }
    },
    [shouldSync, deleteMessagesFromIndexMutation]
  )

  return {
    syncChat,
    syncMessage,
    deleteMessagesFromIndex,
    shouldSync,
    isSyncingChat: syncChatMutation.isPending,
    isSyncingMessage: syncMessageMutation.isPending,
    isDeletingMessages: deleteMessagesFromIndexMutation.isPending,
  }
}
