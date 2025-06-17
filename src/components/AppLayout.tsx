'use client'

import { useParams, usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

import { ChatSearchCommand } from './ChatSearchCommand'
import { Sidebar } from './Sidebar'

type AppLayoutProps = {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const params = useParams()
  const pathname = usePathname()
  const chatId = params?.chatId as string | undefined

  // Don't show sidebar on sign-in page
  const showSidebarAndSearchCommand = !pathname.startsWith('/sign-in')

  if (!showSidebarAndSearchCommand) {
    return children
  }

  return (
    <div className='flex h-svh w-screen items-center justify-center overflow-hidden 2xl:py-5'>
      <div className='flex size-full max-w-[1500px] bg-accent 2xl:overflow-hidden 2xl:rounded-lg 2xl:shadow-sm dark:bg-accent'>
        <Sidebar selectedChatId={chatId} />
        <ChatSearchCommand />
        {children}
      </div>
    </div>
  )
}
