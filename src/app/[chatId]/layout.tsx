import type { ReactNode } from 'react'

type LayoutProps = {
  children: ReactNode
  params: Promise<{ chatId: string }>
}

export default function ChatLayout({ children }: LayoutProps) {
  return <>{children}</>
}
