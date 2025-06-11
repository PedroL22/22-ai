import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import { Geist } from 'next/font/google'
import '~/styles/globals.css'

import { ThemeProvider } from '~/components/ThemeProvider'

import { TRPCReactProvider } from '~/trpc/react'

export const metadata: Metadata = {
  title: '22AI',
  description: 'T3 Chat clone for cloneathon. I really like the number 22. ',
  icons: [{ rel: 'icon', url: '/images/icons/logo.svg' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
}

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang='en' className={`${geist.variable}`} suppressHydrationWarning>
        <body>
          <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
            <main className='min-h-svh bg-[url("/images/bg/light-background.svg")] bg-center bg-cover dark:bg-[url("/images/bg/dark-background.svg")]'>
              <TRPCReactProvider>
                <Analytics />
                {children}
              </TRPCReactProvider>
            </main>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
