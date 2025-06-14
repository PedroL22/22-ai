import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import { Geist } from 'next/font/google'
import '~/styles/globals.css'

import { ChatSyncProvider } from '~/components/ChatSyncProvider'
import { ThemeProvider } from '~/components/ThemeProvider'

import { TRPCReactProvider } from '~/trpc/react'

export const metadata: Metadata = {
  title: '22AI',
  description: 'T3 Chat clone for cloneathon. I really like the number 22. ',
  icons: [{ rel: 'icon', url: '/images/icons/logo.svg' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '22AI',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: '22AI',
    title: '22AI',
    description: 'T3 Chat clone for cloneathon. I really like the number 22.',
  },
  twitter: {
    card: 'summary',
    title: '22AI',
    description: 'T3 Chat clone for cloneathon. I really like the number 22.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1e1e20' },
  ],
}

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang='en' className={`${geist.variable}`} suppressHydrationWarning>
        <head>
          <meta name='application-name' content='22AI' />
          <meta name='apple-mobile-web-app-capable' content='yes' />
          <meta name='apple-mobile-web-app-status-bar-style' content='default' />
          <meta name='apple-mobile-web-app-title' content='22AI' />
          <meta name='format-detection' content='telephone=no' />
          <meta name='mobile-web-app-capable' content='yes' />
          <meta name='msapplication-config' content='/browserconfig.xml' />
          <meta name='msapplication-TileColor' content='#7c3aed' />
          <meta name='msapplication-tap-highlight' content='no' />

          <link rel='apple-touch-icon' href='/images/icons/logo.svg' />
          <link rel='icon' type='image/svg+xml' href='/images/icons/logo.svg' />
          <link rel='manifest' href='/manifest.json' />
          <link rel='mask-icon' href='/images/icons/logo.svg' color='#000000' />
          <link rel='shortcut icon' href='/favicon.ico' />
        </head>
        <body>
          <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
            <main className='min-h-svh bg-[url("/images/bg/light-background.svg")] bg-center bg-cover dark:bg-[url("/images/bg/dark-background.svg")]'>
              <TRPCReactProvider>
                <ChatSyncProvider />
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
