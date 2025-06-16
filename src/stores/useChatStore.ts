import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { env } from '~/env'

import type { Chat as ChatType, Message as MessageType } from '@prisma/client'
import type { ModelsIds } from '~/types/models'

// Extended Chat type that includes messages (like in database with relations)
type ChatWithMessages = ChatType & {
  messages: MessageType[]
}

type ChatStore = {
  currentChatId?: string
  setCurrentChatId: (chatId: string) => void
  chats: ChatWithMessages[]
  selectedModelId: ModelsIds
  setSelectedModelId: (modelId: ModelsIds) => void
  streamingMessage: string
  isStreaming: boolean
  setStreamingMessage: (message: string | ((prev: string) => string)) => void
  setIsStreaming: (streaming: boolean) => void
  addChat: (chat: ChatType) => void
  renameChat: (id: string, newTitle: string) => void
  removeChat: (id: string) => void
  pinChat: (id: string, isPinned: boolean) => void
  shareChat: (id: string, isShared: boolean) => void
  clearChats: () => void
  addMessage: (chatId: string, message: MessageType) => void
  getMessages: (chatId: string) => MessageType[]
  clearMessages: (chatId: string) => void
  replaceMessage: (chatId: string, messageIndex: number, newMessage: MessageType) => void
  removeMessagesFromIndex: (chatId: string, messageIndex: number) => void
  syncChatsFromDatabase: (chats: ChatWithMessages[]) => void
  moveDbChatsToLocal: (chats: ChatWithMessages[]) => void
  getLocalChatsForSync: () => ChatWithMessages[]
  clearLocalChatsAfterSync: () => void
  setChatsDisplayMode: (mode: 'local' | 'synced') => void
  chatsDisplayMode: 'local' | 'synced'
  isSyncing: boolean
  setSyncing: (syncing: boolean) => void
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      currentChatId: undefined,
      setCurrentChatId: (chatId) => set({ currentChatId: chatId }),
      chats: [],
      selectedModelId: env.NEXT_PUBLIC_OPENROUTER_DEFAULT_MODEL as ModelsIds,
      setSelectedModelId: (modelId) => set({ selectedModelId: modelId }),
      streamingMessage: '',
      isStreaming: false,
      chatsDisplayMode: 'local',
      isSyncing: false,
      setStreamingMessage: (message) =>
        set((state) => ({
          streamingMessage: typeof message === 'function' ? message(state.streamingMessage) : message,
        })),
      setIsStreaming: (streaming) => set({ isStreaming: streaming }),
      addChat: (chat) =>
        set((state) => ({
          chats: [...state.chats, { ...chat, messages: [] }],
        })),
      renameChat: (id, newTitle) => {
        set((state) => {
          const updatedChats = state.chats.map((chat) => (chat.id === id ? { ...chat, title: newTitle } : chat))
          return { chats: updatedChats }
        })
      },
      removeChat: (id) =>
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== id),
        })),
      pinChat: (id, isPinned) => {
        set((state) => {
          const updatedChats = state.chats.map((chat) => (chat.id === id ? { ...chat, isPinned } : chat))
          return { chats: updatedChats }
        })
      },
      shareChat: (id, isShared) => {
        set((state) => {
          const updatedChats = state.chats.map((chat) => (chat.id === id ? { ...chat, isShared } : chat))
          return { chats: updatedChats }
        })
      },
      clearChats: () => set({ chats: [] }),
      addMessage: (chatId, message) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: [...chat.messages, message],
                  updatedAt: new Date(), // Update the chat's timestamp when adding messages
                }
              : chat
          ),
        })),
      getMessages: (chatId) => {
        const chat = get().chats.find((chat) => chat.id === chatId)
        return chat?.messages || []
      },
      clearMessages: (chatId) =>
        set((state) => ({
          chats: state.chats.map((chat) => (chat.id === chatId ? { ...chat, messages: [] } : chat)),
        })),
      replaceMessage: (chatId, messageIndex, newMessage) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages.map((msg, index) => (index === messageIndex ? newMessage : msg)),
                  updatedAt: new Date(),
                }
              : chat
          ),
        })),
      removeMessagesFromIndex: (chatId, messageIndex) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages.slice(0, messageIndex),
                  updatedAt: new Date(),
                }
              : chat
          ),
        })),
      syncChatsFromDatabase: (chats) => set({ chats, chatsDisplayMode: 'synced' }),
      moveDbChatsToLocal: (chats) => set({ chats, chatsDisplayMode: 'local' }),
      getLocalChatsForSync: () => {
        const state = get()
        return state.chats.filter((chat) => chat.messages.length > 0) // Only sync chats with messages
      },
      clearLocalChatsAfterSync: () => set({ chats: [] }),
      setChatsDisplayMode: (mode) => set({ chatsDisplayMode: mode }),
      setSyncing: (syncing) => set({ isSyncing: syncing }),
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({
        // Only persist local chats and display mode
        chats: state.chatsDisplayMode === 'local' ? state.chats : [],
        chatsDisplayMode: state.chatsDisplayMode,
        currentChatId: state.currentChatId,
        selectedModelId: state.selectedModelId,
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null

          try {
            const parsed = JSON.parse(str)
            // Convert date strings back to Date objects
            if (parsed?.state?.chats) {
              parsed.state.chats = parsed.state.chats.map((chat: any) => ({
                ...chat,
                createdAt: new Date(chat.createdAt),
                updatedAt: new Date(chat.updatedAt),
                messages:
                  chat.messages?.map((message: any) => ({
                    ...message,
                    createdAt: new Date(message.createdAt),
                  })) || [],
              }))
            }
            return parsed
          } catch {
            return null
          }
        },
        setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
)
