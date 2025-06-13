'use client'

import { UserProfile, useClerk, useUser } from '@clerk/nextjs'
import { AnimatePresence, motion } from 'motion/react'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ChevronDown, Loader2, LogIn, LogOut, MessageCircle, Moon, PanelLeft, Settings, Sun, User } from 'lucide-react'
import { PWAInstallPrompt } from '~/components/PWAInstallPrompt'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'

import { useChatStore } from '~/stores/useChatStore'
import { useSidebarStore } from '~/stores/useSidebarStore'

import { clerkThemes } from '~/lib/clerk-themes'
import { formatMessageDateForChatList } from '~/utils/format-date-for-chat-list'
import { isMobile } from '~/utils/is-mobile'

import { api } from '~/trpc/react'

import type { Chat as ChatType } from '@prisma/client'

type SidebarProps = {
  selectedChatId?: string | null
}

/**
 * Sidebar component that displays the chat list and user information.
 */
export const Sidebar = ({ selectedChatId }: SidebarProps) => {
  const { isOpen, setIsOpen, selectedTab, setSelectedTab } = useSidebarStore()
  const { chats: localChats, removeChat: deleteLocalChat, clearChats } = useChatStore()
  const { isSignedIn, isLoaded, user } = useUser()
  const { signOut } = useClerk()

  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)

  const {
    data: dbChats,
    isLoading: isLoadingDbChats,
    error: dbChatsError,
    refetch: refetchChats,
  } = api.chat.getUserChats.useQuery(undefined, {
    enabled: !!isSignedIn,
    refetchOnWindowFocus: false,
  })

  const allChats: Array<ChatType & { isLocal: boolean }> = localChats.map((chat) => ({ ...chat, isLocal: true }))

  const sortedChats = allChats.sort((a, b) => {
    const dateA = new Date(a.updatedAt).getTime()
    const dateB = new Date(b.updatedAt).getTime()
    return dateB - dateA
  })

  const { theme, setTheme, resolvedTheme } = useTheme()
  const { push } = useRouter()

  // Set the initial tab to 'chat' when the sidebar opens
  useEffect(() => {
    setSelectedTab('chat')
  }, [isOpen])

  // Always close sidebar on mobile when the component mounts
  // This ensures the sidebar is closed when navigating to a new page on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    }
  }, [setIsOpen])

  // Handle Ctrl+B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC')
      const isCtrlB = (isMac ? e.metaKey : e.ctrlKey) && (e.key === 'b' || e.key === 'B')

      if (isCtrlB) {
        e.preventDefault()
        setIsOpen(!isOpen)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, setIsOpen])

  const deleteChatMutation = api.chat.deleteChat.useMutation({
    onSuccess: () => {
      // Refetch chats after deletion
      if (isSignedIn) {
        refetchChats()
      }
    },
  })

  const handleDeleteChat = (chatId: string) => {
    const isCurrentChat = selectedChatId === chatId

    if (isSignedIn) {
      deleteChatMutation.mutate({ chatId })
    } else {
      deleteLocalChat(chatId)
    }

    isCurrentChat && push('/')
  }

  const handleLogout = async () => {
    clearChats()

    await signOut()

    location.reload()
  }

  return (
    <aside className='relative'>
      {/* Floating toggle button */}
      <div className='absolute top-4 left-2.5 z-50'>
        <Button variant='ghost' size='icon' aria-label='Open sidebar' onClick={() => setIsOpen(!isOpen)}>
          <PanelLeft className='size-5' />
        </Button>
      </div>

      {/* Sidebar is open based on isOpen state */}
      <motion.div
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
        variants={{
          open: { width: '24rem' },
          closed: { width: 0 },
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className='flex h-full shrink-0 select-none flex-row overflow-hidden bg-background text-background-foreground'
      >
        {/* Left vertical button panel */}
        <div className='flex w-16 shrink-0 flex-col items-center justify-between bg-background p-2 py-4'>
          <div className='flex flex-col items-center space-y-2 pt-13'>
            <Button
              variant={selectedTab === 'chat' ? 'secondary' : 'ghost'}
              size='icon'
              aria-label='Chat'
              className='dark:text-accent-foreground'
              onClick={() => setSelectedTab('chat')}
            >
              <MessageCircle className='size-5' />
            </Button>

            <Button
              variant={selectedTab === 'settings' ? 'secondary' : 'ghost'}
              size='icon'
              aria-label='Settings'
              className='dark:text-accent-foreground'
              onClick={() => setSelectedTab('settings')}
            >
              <Settings className='size-5' />
            </Button>
          </div>

          {/* Theme switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' aria-label='Change theme' className='dark:text-accent-foreground'>
                <Sun className='dark:-rotate-90 size-5 h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:scale-0' />

                <Moon className='absolute size-5 h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />

                <span className='sr-only'>Change theme</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align='end' side='right'>
              <DropdownMenuItem
                data-selected={theme === 'system'}
                className='transition-all ease-in hover:bg-accent/10 data-[selected=true]:bg-accent'
                onClick={() => setTheme('system')}
              >
                System
              </DropdownMenuItem>

              <DropdownMenuItem
                data-selected={theme === 'dark'}
                className='transition-all ease-in hover:bg-accent/10 data-[selected=true]:bg-accent'
                onClick={() => setTheme('dark')}
              >
                Dark
              </DropdownMenuItem>

              <DropdownMenuItem
                data-selected={theme === 'light'}
                className='transition-all ease-in hover:bg-accent/10 data-[selected=true]:bg-accent'
                onClick={() => setTheme('light')}
              >
                Light
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Sidebar content */}
        <motion.div
          variants={{
            open: { opacity: 1, pointerEvents: 'auto', transition: { delay: 0.1, duration: 0.2 } },
            closed: { opacity: 0, pointerEvents: 'none', transition: { duration: 0.1 } },
          }}
          animate={isOpen ? 'open' : 'closed'}
          initial='open'
          className='flex w-full min-w-80 flex-col p-4 px-6'
        >
          <div className='mt-2 mb-4 flex w-full items-center justify-center'>
            <Image
              src={
                resolvedTheme === 'light'
                  ? '/images/icons/logotype-dark-text.svg'
                  : '/images/icons/logotype-light-text.svg'
              }
              alt='22AI'
              className='h-14'
              width={200}
              height={200}
            />
          </div>

          <AnimatePresence mode='wait'>
            {selectedTab === 'chat' && (
              <motion.div
                key='chat'
                variants={{
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  exit: { opacity: 0 },
                }}
                initial='initial'
                animate='animate'
                exit='exit'
                transition={{
                  type: 'tween',
                  duration: 0.15,
                }}
                className='flex min-h-0 flex-1 flex-col space-y-4'
              >
                <Button asChild>
                  <Link href='/'>New chat</Link>
                </Button>

                <div className='scrollbar-hide min-h-0 flex-1 flex-col items-center space-y-2.5 overflow-y-auto'>
                  {dbChatsError ? (
                    <div className='flex size-full items-center justify-center'>
                      <div className='text-center text-destructive text-sm'>
                        {dbChatsError.message || 'Failed to load chats.'}
                      </div>
                    </div>
                  ) : isLoadingDbChats && isSignedIn ? (
                    <div className='flex size-full items-center justify-center'>
                      <Loader2 className='size-4 animate-spin' />
                    </div>
                  ) : sortedChats.length > 0 ? (
                    sortedChats.map((chat) => {
                      return (
                        <Link
                          key={chat.id}
                          href={`/${chat.id}`}
                          data-selected={chat.id === selectedChatId}
                          className='flex w-full cursor-pointer items-center gap-3 rounded-lg p-3 py-4 transition-all ease-in hover:bg-accent data-[selected=true]:bg-accent dark:data-[selected=true]:bg-accent/35 dark:hover:bg-accent/35'
                        >
                          <div className='flex w-full flex-col'>
                            <div className='flex w-full items-center justify-between'>
                              <span className=' truncate text-muted-foreground text-sm'>{chat.title || ''}</span>

                              <span className='shrink-0 text-muted-foreground text-xs'>
                                <span>{formatMessageDateForChatList(chat.updatedAt.toString())}</span>
                              </span>
                            </div>
                          </div>
                        </Link>
                      )
                    })
                  ) : (
                    <div className='flex size-full items-center justify-center'>
                      <div className='text-center text-muted-foreground text-sm'>No chats yet.</div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {selectedTab === 'settings' && (
              <motion.div
                key='settings'
                variants={{
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  exit: { opacity: 0 },
                }}
                initial='initial'
                animate='animate'
                exit='exit'
                transition={{
                  type: 'tween',
                  duration: 0.15,
                }}
                className='scrollbar-hide min-h-0 flex-1 flex-col space-y-4 overflow-y-auto'
              >
                <div className='w-full space-y-4'>
                  <div className='text-center font-medium text-muted-foreground text-sm'>Settings</div>

                  <div className='space-y-8'>
                    {/* DB sync section */}
                    <div>
                      <div className='flex items-center space-x-2'>
                        <div className='font-medium text-sm'>Database Sync</div>

                        <div className='flex size-4 items-center justify-center rounded-full bg-primary/20'>
                          <div className='size-2 rounded-full bg-primary' />
                        </div>
                      </div>

                      <div className='mt-1 text-muted-foreground text-xs leading-relaxed'>
                        Sync your chats with the cloud for access across devices.
                      </div>

                      {isSignedIn ? (
                        <div className='mt-3 flex items-center space-x-2'>
                          <Switch id='sync-chats' />
                          <Label htmlFor='sync-chats'>Sync chats</Label>
                        </div>
                      ) : (
                        <Button variant='outline' size='sm' className='mt-3' asChild>
                          <Link href='/sign-in'>Sign in to sync</Link>
                        </Button>
                      )}
                    </div>

                    {/* PWA Section */}
                    <div>
                      <div className='flex items-center space-x-2'>
                        <div className='font-medium text-sm'>Progressive Web App</div>

                        <div className='flex size-4 items-center justify-center rounded-full bg-primary/20'>
                          <div className='size-2 rounded-full bg-primary' />
                        </div>
                      </div>

                      <div className='mt-1 mb-2 text-muted-foreground text-xs leading-relaxed'>
                        Install 22AI as a native app for a better experience with offline support and faster loading.
                      </div>

                      <PWAInstallPrompt />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User stuff */}
          {!isLoaded ? (
            <div className='flex justify-center pt-11 pb-3'>
              <Loader2 className='size-4 animate-spin' />
            </div>
          ) : isSignedIn ? (
            <div className='flex shrink-0 justify-center pt-4'>
              <DropdownMenu>
                <DropdownMenuTrigger className='group flex cursor-pointer items-center space-x-2 rounded-lg px-5 py-3 transition-all ease-in hover:bg-accent dark:hover:bg-accent/35'>
                  <div className='flex items-center space-x-3'>
                    <Avatar className='size-8'>
                      <AvatarImage src={user?.imageUrl || undefined} alt={user?.fullName || undefined} />

                      <AvatarFallback>{user?.fullName?.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className='max-w-40 truncate font-medium'>{user?.fullName}</div>
                  </div>

                  <ChevronDown className='mt-1 size-4 transition-all ease-in group-data-[state=open]:rotate-180' />
                </DropdownMenuTrigger>

                <DropdownMenuContent side='top'>
                  <DropdownMenuLabel>My account</DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => setIsSettingsDialogOpen(true)}>
                    <User className='size-4' />
                    <span>Manage account</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className='size-4' />

                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className='flex justify-center pt-4`shrink-0'>
              <Link
                href='/sign-in'
                className='flex items-center space-x-2 rounded-lg p-3 transition-all ease-in hover:bg-accent dark:hover:bg-accent/35'
              >
                <LogIn className='size-5' />

                <span className='font-medium'>Sign in</span>
              </Link>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Manage account dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className='overflow-auto rounded-2xl border-none p-0 sm:max-w-[880px]'>
          <DialogHeader className='sr-only'>
            <DialogTitle />
            <DialogDescription />
          </DialogHeader>

          <div className='flex w-full items-center justify-center overflow-hidden'>
            <UserProfile routing='hash' appearance={clerkThemes(resolvedTheme ?? 'dark')} />
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
