import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Chat as ChatType, Message as MessageType } from '@prisma/client'

// Extended Chat type that includes messages (like in database with relations)
type ChatWithMessages = ChatType & {
  messages: MessageType[]
}

type ChatStore = {
  currentChatId?: string
  setCurrentChatId: (chatId: string) => void
  chats: ChatWithMessages[]
  streamingMessage: string
  isStreaming: boolean
  setStreamingMessage: (message: string | ((prev: string) => string)) => void
  setIsStreaming: (streaming: boolean) => void
  addChat: (chat: ChatType) => void
  renameChat: (id: string, newTitle: string) => void
  removeChat: (id: string) => void
  clearChats: () => void
  addMessage: (chatId: string, message: MessageType) => void
  getMessages: (chatId: string) => MessageType[]
  clearMessages: (chatId: string) => void
  syncChatsFromDatabase: (chats: ChatWithMessages[]) => void
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
      clearChats: () => set({ chats: [] }),
      addMessage: (chatId, message) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.id === chatId ? { ...chat, messages: [...chat.messages, message] } : chat
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
      syncChatsFromDatabase: (chats) => set({ chats, chatsDisplayMode: 'synced' }),
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
