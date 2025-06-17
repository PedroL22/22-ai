'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { MessageCircle, Pin } from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '~/components/ui/command'

import { useChatStore } from '~/stores/useChatStore'

import { formatMessageDateForChatList } from '~/utils/format-date-for-chat-list'

export function ChatSearchCommand() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { chats } = useChatStore()

  // Filter and sort chats for search
  const searchableChats = chats
    .filter((chat) => chat.title && chat.title.trim() !== '')
    .sort((a, b) => {
      // Sort by pinned first, then by date
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Check for Ctrl+K (Cmd+K on Mac)
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const isCtrlK = (isMac ? e.metaKey : e.ctrlKey) && e.key === 'k'

      if (isCtrlK) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelect = (chatId: string) => {
    setOpen(false)
    router.push(`/${chatId}`)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title='Search Chats'
      description='Find and navigate to your chats'
    >
      <CommandInput placeholder='Search chats by title...' />

      <CommandList>
        <CommandEmpty>No chats found.</CommandEmpty>

        {searchableChats.length > 0 && (
          <CommandGroup heading='Chats'>
            {searchableChats.map((chat) => (
              <CommandItem
                key={chat.id}
                value={chat.title || ''}
                onSelect={() => handleSelect(chat.id)}
                className='flex items-center justify-between'
              >
                <div className='flex items-center gap-2'>
                  <MessageCircle className='size-3 text-muted-foreground' />
                  <span className='truncate'>{chat.title || 'Untitled'}</span>
                  {chat.isPinned && <Pin className='size-3 text-muted-foreground' />}
                </div>

                <span className='text-muted-foreground text-xs'>
                  {formatMessageDateForChatList(chat.updatedAt.toISOString())}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading='Shortcuts'>
          <CommandItem
            onSelect={() => {
              setOpen(false)
              router.push('/')
            }}
          >
            <MessageCircle className='size-3 text-muted-foreground' />
            <span>New Chat</span>
            <CommandShortcut>Enter</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
