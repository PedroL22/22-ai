'use client'

import { type ReactNode, use } from 'react'

import { Sidebar } from '~/components/Sidebar'

type LayoutProps = {
  children: ReactNode
  params: Promise<{ chatId: string }>
}

export default function ChatLayout({ children, params }: LayoutProps) {
  const { chatId } = use(params)

  return (
    <div className='flex h-svh w-screen items-center justify-center overflow-hidden 2xl:py-5'>
      <div className='flex size-full max-w-[1500px] bg-accent 2xl:overflow-hidden 2xl:rounded-lg 2xl:shadow-sm dark:bg-accent'>
        <Sidebar selectedChatId={chatId} />
        {children}
      </div>
    </div>
  )
}
