'use client'

import { SignIn } from '@clerk/nextjs'
import { useTheme } from 'next-themes'

import { ThemeToggle } from '~/components/ThemeToggle'

import { clerkThemes } from '~/lib/clerk-themes'

export default function SignInPage() {
  const { resolvedTheme } = useTheme()

  return (
    <>
      <div className='fixed top-4 right-4'>
        <ThemeToggle />
      </div>

      <div className='flex h-svh items-center justify-center '>
        <SignIn routing='hash' appearance={clerkThemes(resolvedTheme ?? 'dark')} />
      </div>
    </>
  )
}
