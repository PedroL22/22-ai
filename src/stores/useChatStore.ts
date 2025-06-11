import { v4 as uuid } from 'uuid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Chat as ChatType } from '@prisma/client'
import type { LocalChat, LocalMessage } from '~/types/local-data'

type ChatState = {
  activeChatId: string | null

  localChats: LocalChat[]
  databaseChats: ChatType[]

  isLoading: boolean
  // Actions for local chats
  createLocalChat: (title?: string) => LocalChat
  createLocalChatWithMessage: (content: string, modelId: string | null, title?: string) => LocalChat
  addLocalMessage: (
    chatId: string,
    role: 'user' | 'assistant',
    content: string,
    modelId?: string
  ) => LocalMessage | null
  updateLocalChatTitle: (chatId: string, title: string) => void
  deleteLocalChat: (chatId: string) => void
  clearLocalChats: () => void
  getLocalChat: (chatId: string) => LocalChat | null
  getLocalChatMessages: (chatId: string) => LocalMessage[]

  // Actions for database chats
  setDatabaseChats: (chats: ChatType[]) => void
  addDatabaseChat: (chat: ChatType) => void // General actions
  setActiveChat: (chatId: string | null) => void
  setLoading: (loading: boolean) => void
  getCurrentChat: () => LocalChat | ChatType | null
  getAllChats: (isAuthenticated: boolean) => (LocalChat | ChatType)[]
  chatExists: (chatId: string, isAuthenticated: boolean) => boolean
  // Force clear local chats and persistence
  forceCleanLocalChats: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      activeChatId: null,
      localChats: [],
      databaseChats: [],
      isLoading: false,
      createLocalChat: (title) => {
        const newChat: LocalChat = {
          id: uuid(),
          title,
          isLocal: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [],
        }

        set((state) => ({
          localChats: [newChat, ...state.localChats],
          activeChatId: newChat.id,
        }))

        return newChat
      },

      createLocalChatWithMessage: (content, modelId, title) => {
        const newChat: LocalChat = {
          id: uuid(),
          title: title || 'New chat',
          isLocal: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [
            {
              id: uuid(),
              role: 'user',
              content,
              modelId,
              createdAt: new Date(),
            },
          ],
        }

        set((state) => ({
          localChats: [newChat, ...state.localChats],
          activeChatId: newChat.id,
        }))

        return newChat
      },

      addLocalMessage: (chatId, role, content, modelId) => {
        const message: LocalMessage = {
          id: uuid(),
          role,
          content,
          modelId: modelId || null,
          createdAt: new Date(),
        }

        set((state) => ({
          localChats: state.localChats.map((chat) =>
            chat.id === chatId ? { ...chat, messages: [...chat.messages, message], updatedAt: new Date() } : chat
          ),
        }))

        return message
      },

      updateLocalChatTitle: (chatId, title) => {
        set((state) => ({
          localChats: state.localChats.map((chat) =>
            chat.id === chatId ? { ...chat, title, updatedAt: new Date() } : chat
          ),
        }))
      },

      deleteLocalChat: (chatId) => {
        set((state) => ({
          localChats: state.localChats.filter((chat) => chat.id !== chatId),
          activeChatId: state.activeChatId === chatId ? null : state.activeChatId,
        }))
      },
      clearLocalChats: () => {
        set({ localChats: [] })
      },

      getLocalChat: (chatId) => {
        const { localChats } = get()
        return localChats.find((chat) => chat.id === chatId) || null
      },

      getLocalChatMessages: (chatId) => {
        const { localChats } = get()
        const chat = localChats.find((chat) => chat.id === chatId)
        return chat?.messages || []
      },

      setDatabaseChats: (chats) => {
        set({ databaseChats: chats })
      },

      addDatabaseChat: (chat) => {
        set((state) => ({
          databaseChats: [chat, ...state.databaseChats],
          activeChatId: chat.id,
        }))
      },

      setActiveChat: (chatId) => {
        set({ activeChatId: chatId })
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      getCurrentChat: () => {
        const { activeChatId, localChats, databaseChats } = get()
        if (!activeChatId) return null

        return (
          localChats.find((chat) => chat.id === activeChatId) ||
          databaseChats.find((chat) => chat.id === activeChatId) ||
          null
        )
      },

      getAllChats: (isAuthenticated) => {
        const { localChats, databaseChats } = get()

        if (isAuthenticated) {
          return databaseChats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        }

        return localChats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      },

      chatExists: (chatId, isAuthenticated) => {
        const { localChats, databaseChats } = get()

        if (isAuthenticated) {
          return databaseChats.some((chat) => chat.id === chatId)
        }
        return localChats.some((chat) => chat.id === chatId)
      },

      forceCleanLocalChats: () => {
        set({ localChats: [] })

        // Also manually clear localStorage to ensure persistence
        try {
          const persistedState = localStorage.getItem('chat-store')
          if (persistedState) {
            const parsed = JSON.parse(persistedState)
            parsed.state.localChats = []
            localStorage.setItem('chat-store', JSON.stringify(parsed))
          }
        } catch (error) {
          console.warn('Failed to manually clear localStorage:', error)
        }
      },
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({
        // Persist both UI state and local chats
        activeChatId: state.activeChatId,
        localChats: state.localChats,
      }),
      onRehydrateStorage: () => (state) => {
        // Ensure state is properly initialized after rehydration
        if (state) {
          console.log('Chat store rehydrated with', state.localChats.length, 'local chats')
        }
      },
    }
  )
)
