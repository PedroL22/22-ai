import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'

import { useChatStore } from '~/stores/useChatStore'
import { api } from '~/trpc/react'

import type { Chat as ChatType } from '@prisma/client'
import type { LocalChat } from '~/types/local-data'

// Type for Chat with message count from database queries
type ChatWithCount = ChatType & {
  _count?: {
    messages: number
  }
}

export function ChatList() {
  const { user } = useUser()
  const { getAllChats, setDatabaseChats, activeChatId, setActiveChat } = useChatStore()

  // Fetch database chats if user is authenticated
  const { data: dbChats, isLoading } = api.chat.getUserChats.useQuery(undefined, {
    enabled: !!user,
    refetchOnWindowFocus: false,
  })

  // Update store when database chats are fetched
  useEffect(() => {
    if (dbChats) {
      setDatabaseChats(dbChats)
    }
  }, [dbChats, setDatabaseChats])

  const chats = getAllChats(!!user)

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    return d.toLocaleDateString()
  }
  const isLocalChat = (chat: LocalChat | ChatWithCount): chat is LocalChat => {
    return 'isLocal' in chat && chat.isLocal === true
  }

  const getMessageCount = (chat: LocalChat | ChatWithCount) => {
    if (isLocalChat(chat)) {
      return chat.messages.length
    }
    return chat._count?.messages || 0
  }

  if (isLoading && user) {
    return (
      <div className='p-4'>
        <p className='text-gray-600'>Loading your chats...</p>
      </div>
    )
  }

  return (
    <div className='p-4'>
      <h2 className='mb-4 font-semibold text-xl'>{user ? 'Your Chats' : 'Local Chats'}</h2>

      {chats.length === 0 ? (
        <p className='text-gray-600'>
          {user ? 'No chats yet. Create your first chat!' : 'No local chats. Start chatting!'}
        </p>
      ) : (
        <div className='space-y-2'>
          {chats.map((chat) => (
            <button
              key={chat.id}
              type='button'
              className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                activeChatId === chat.id ? 'border-blue-300 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => setActiveChat(chat.id)}
            >
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <h3 className='truncate font-medium'>{chat.title || 'Untitled Chat'}</h3>
                  <p className='text-gray-600 text-sm'>{getMessageCount(chat)} messages</p>
                  <p className='text-gray-500 text-xs'>{formatDate(chat.updatedAt)}</p>
                </div>

                <div className='flex items-center gap-2'>
                  {isLocalChat(chat) && (
                    <span className='rounded bg-orange-100 px-2 py-1 text-orange-800 text-xs'>Local</span>
                  )}
                  {!isLocalChat(chat) && (
                    <span className='rounded bg-green-100 px-2 py-1 text-green-800 text-xs'>Synced</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {!user && chats.length > 0 && (
        <div className='mt-4 rounded border border-yellow-200 bg-yellow-50 p-3'>
          <p className='text-sm text-yellow-800'>
            💡 Sign in to sync your {chats.length} local chat{chats.length > 1 ? 's' : ''} to your account
          </p>
        </div>
      )}
    </div>
  )
}
