'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { type MouseEvent, useEffect, useRef, useState } from 'react'

import { Edit, MoreHorizontal, Pin, Share, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '~/components/ui/context-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'

import { useChatStore } from '~/stores/useChatStore'
import { useSidebarStore } from '~/stores/useSidebarStore'

import { cn } from '~/lib/utils'
import { api } from '~/trpc/react'
import { isMobile } from '~/utils/is-mobile'

type ChatMenuProps = {
  chatId: string
  chatTitle: string | null
  isPinned?: boolean
  isShared?: boolean
  isSelected?: boolean
}

export const ChatMenu = ({
  chatId,
  chatTitle,
  isPinned = false,
  isShared = false,
  isSelected = false,
}: ChatMenuProps) => {
  const { isSignedIn } = useUser()
  const { removeChat, pinChat, shareChat, renameChat, chatsDisplayMode } = useChatStore()
  const { setIsOpen } = useSidebarStore()
  const [isRenaming, setIsRenaming] = useState(false)
  const [newTitle, setNewTitle] = useState(chatTitle || '')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showUnshareDialog, setShowUnshareDialog] = useState(false)

  const pinChatMutation = api.chat.pinChat.useMutation()
  const shareChatMutation = api.chat.shareChat.useMutation()
  const deleteChatMutation = api.chat.deleteChat.useMutation()
  const renameChatMutation = api.chat.renameChat.useMutation()

  const { push } = useRouter()

  const inputRef = useRef<HTMLInputElement>(null)

  // Focus and select all text when entering rename mode
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  const handlePin = async (e: MouseEvent) => {
    e.stopPropagation()

    try {
      const newPinnedState = !isPinned
      pinChat(chatId, newPinnedState)

      await pinChatMutation.mutateAsync({
        chatId,
        isPinned: newPinnedState,
      })
    } catch (err) {
      console.error('❌ Failed to pin/unpin chat: ', err)
      pinChat(chatId, isPinned)
    }
  }

  const handleShare = (e: MouseEvent) => {
    e.stopPropagation()
    if (isShared) {
      setShowUnshareDialog(true)
    } else {
      setShowShareDialog(true)
    }
  }

  const confirmShare = async () => {
    try {
      const newSharedState = !isShared
      shareChat(chatId, newSharedState)

      await shareChatMutation.mutateAsync({
        chatId,
        isShared: newSharedState,
      })

      // Copy the chat link to clipboard if sharing
      if (newSharedState) {
        navigator.clipboard.writeText(`${window.location.origin}/${chatId}`)

        toast.success('Chat link copied to clipboard!')
        setShowShareDialog(false)
      } else {
        setShowUnshareDialog(false)
        location.reload()
      }
    } catch (error) {
      console.error('❌ Failed to share/unshare chat: ', error)
      shareChat(chatId, isShared)
      setShowShareDialog(false)
      setShowUnshareDialog(false)
    }
  }

  const handleRename = (e: MouseEvent) => {
    e.stopPropagation()
    setIsRenaming(true)
  }

  const handleRenameSubmit = async () => {
    if (!newTitle.trim()) return

    try {
      renameChat(chatId, newTitle.trim())

      // Only sync to server if user is authenticated and we're in synced mode
      if (isSignedIn && chatsDisplayMode === 'synced') {
        await renameChatMutation.mutateAsync({
          chatId,
          newTitle: newTitle.trim(),
        })
      }

      setIsRenaming(false)
    } catch (error) {
      console.error('❌ Failed to rename chat: ', error)
      // Revert local change if server sync failed
      if (isSignedIn && chatsDisplayMode === 'synced') {
        renameChat(chatId, chatTitle || '')
      }
    }
  }

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation()
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    try {
      removeChat(chatId)

      await deleteChatMutation.mutateAsync({
        chatId,
      })

      setShowDeleteDialog(false)
      push('/')
    } catch (error) {
      console.error('❌ Failed to delete chat: ', error)
      setShowDeleteDialog(false)
    }
  }

  const handleChatClick = () => {
    if (!isRenaming) {
      if (isMobile) {
        setIsOpen(false)
      }
      push(`/${chatId}`)
    }
  }

  const MenuItems = () => (
    <>
      <ContextMenuItem className='flex items-center gap-2' onClick={handlePin}>
        <Pin className='size-4' />
        {isPinned ? 'Unpin chat' : 'Pin chat'}
      </ContextMenuItem>

      <ContextMenuItem className='flex items-center gap-2' onClick={handleShare}>
        <Share className='size-4' />
        {isShared ? 'Unshare chat' : 'Share chat'}
      </ContextMenuItem>

      <ContextMenuItem className='flex items-center gap-2' onClick={handleRename}>
        <Edit className='size-4' />
        Rename
      </ContextMenuItem>

      <ContextMenuItem
        variant='destructive'
        className='flex items-center gap-2 text-destructive focus:text-destructive'
        onClick={handleDelete}
      >
        <Trash2 className='size-4' />
        Delete
      </ContextMenuItem>
    </>
  )

  if (isRenaming) {
    return (
      <div className='flex w-full items-center gap-2 rounded-lg bg-accent px-3 py-4 dark:bg-accent/35'>
        <input
          ref={inputRef}
          type='text'
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleRenameSubmit()
            } else if (e.key === 'Escape') {
              setIsRenaming(false)
              setNewTitle(chatTitle || '')
            }
          }}
          className='w-fit flex-1 rounded-xs border-none bg-background text-muted-foreground text-sm outline-none dark:bg-accent'
        />
      </div>
    )
  }

  return (
    <>
      <div
        aria-label={`Chat: ${chatTitle || 'Untitled'}`}
        className={cn(
          'group flex w-full cursor-pointer items-center justify-end gap-3 rounded-lg p-3 transition-all ease-in hover:bg-accent',
          {
            'bg-accent dark:bg-accent/35': isSelected,
          }
        )}
        onClick={handleChatClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleChatClick()
          }
        }}
      >
        <div className='flex w-full items-center justify-between'>
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div className='w-full cursor-pointer'>
                <span className='block max-w-54 truncate text-muted-foreground text-sm'>{chatTitle || ''}</span>
              </div>
            </ContextMenuTrigger>

            <ContextMenuContent>
              <MenuItems />
            </ContextMenuContent>
          </ContextMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='size-6 shrink-0 cursor-pointer opacity-0 hover:bg-accent/50 group-hover:opacity-100'
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <MoreHorizontal className='size-4' />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align='end'>
              <DropdownMenuItem className='flex items-center gap-2' onClick={handlePin}>
                <Pin className='size-4' />
                {isPinned ? 'Unpin chat' : 'Pin chat'}
              </DropdownMenuItem>

              <DropdownMenuItem className='flex items-center gap-2' onClick={handleShare}>
                <Share className='size-4' />
                {isShared ? 'Unshare chat' : 'Share chat'}
              </DropdownMenuItem>

              <DropdownMenuItem className='flex items-center gap-2' onClick={handleRename}>
                <Edit className='size-4' />
                Rename
              </DropdownMenuItem>

              <DropdownMenuItem
                className='flex items-center gap-2 text-destructive focus:text-destructive'
                onClick={handleDelete}
              >
                <Trash2 className='size-4' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{chatTitle || 'this chat'}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant='outline' onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>

            <Button variant='destructive' onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Confirmation Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to share "{chatTitle || 'this chat'}"? Others will be able to view this
              conversation.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant='outline' onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmShare}>Share</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unshare Confirmation Dialog */}
      <Dialog open={showUnshareDialog} onOpenChange={setShowUnshareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unshare Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to make "{chatTitle || 'this chat'}" private? Others will no longer be able to
              access it.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant='outline' onClick={() => setShowUnshareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmShare}>Unshare</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
