'use client'

import { Check, Download, Info, Smartphone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '~/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

export const PWAInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Save the event so it can be triggered later
      setInstallPrompt(e)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
      setIsInstalling(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!installPrompt) return

    setIsInstalling(true)

    try {
      // Show the install prompt
      await installPrompt.prompt()

      // Wait for the user to respond to the prompt
      const { outcome } = await installPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
        setIsInstalling(false)
      }

      // Clear the saved prompt since it can only be used once
      setInstallPrompt(null)
    } catch (err) {
      console.error('❌ Error installing PWA: ', err)
      setIsInstalling(false)
    }
  }

  // Show installed state
  if (isInstalled) {
    return (
      <div className='flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950'>
        <Check className='h-4 w-4 text-green-600 dark:text-green-400' />

        <div className='flex-1'>
          <div className='font-medium text-green-800 text-sm dark:text-green-200'>App Installed</div>

          <div className='text-green-600 text-xs dark:text-green-400'>22AI is installed on your device</div>
        </div>
      </div>
    )
  }

  // Show info when install prompt is not available
  if (!installPrompt) {
    return (
      <div className='space-y-3'>
        <div className='flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950'>
          <Info className='h-4 w-4 text-blue-600 dark:text-blue-400' />

          <div className='flex-1'>
            <div className='font-medium text-blue-800 text-sm dark:text-blue-200'>Install Available</div>

            <div className='text-blue-600 text-xs dark:text-blue-400'>
              Use your browser's install option or add to home screen
            </div>
          </div>
        </div>

        <Button variant='outline' size='sm' className='w-full gap-2' onClick={() => setShowInfo(!showInfo)}>
          <Smartphone className='h-4 w-4' />
          How to Install
        </Button>

        {showInfo && (
          <div className='rounded-lg bg-muted p-3 text-muted-foreground text-xs'>
            <div className='space-y-2'>
              <div>
                <strong>Chrome/Edge:</strong> Click the install icon in the address bar
              </div>

              <div>
                <strong>Safari (iOS):</strong> Tap Share → Add to Home Screen
              </div>

              <div>
                <strong>Firefox:</strong> Look for "Install" in the menu
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Button onClick={handleInstallClick} variant='default' size='sm' className='w-full gap-2' disabled={isInstalling}>
      <Download className={`size-4 ${isInstalling ? 'animate-bounce' : ''}`} />

      {isInstalling ? 'Installing...' : 'Install App'}
    </Button>
  )
}
