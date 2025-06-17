import { useUser } from '@clerk/nextjs'
import { motion } from 'motion/react'
import Link from 'next/link'
import { PWAInstallPrompt } from '~/components/PWAInstallPrompt'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'

import { useUserSettings } from '~/lib/useUserSettings'

export const SettingsPanel = () => {
  const { isSignedIn } = useUser()
  const { settings, isLoading, updateSetting, isUpdating } = useUserSettings()

  return (
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
          <motion.div
            key='db-sync'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'tween', duration: 0.15 }}
          >
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
              <div className='mt-3 flex w-full items-center justify-between'>
                <Label htmlFor='sync-chats'>Sync chats</Label>

                <Switch
                  id='sync-chats'
                  checked={settings?.syncWithDb}
                  onCheckedChange={(checked) => updateSetting('syncWithDb', !!checked)}
                  disabled={isUpdating || isLoading}
                />
              </div>
            ) : (
              <Button variant='outline' size='sm' className='mt-3' asChild>
                <Link href='/sign-in'>Sign in to sync</Link>
              </Button>
            )}
          </motion.div>

          {/* Keyboard Shortcuts section */}
          <motion.div
            key='keyboard-shortcuts'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'tween', duration: 0.15 }}
            className='hidden md:block'
          >
            <div className='flex items-center space-x-2'>
              <div className='font-medium text-sm'>Keyboard Shortcuts</div>

              <div className='flex size-4 items-center justify-center rounded-full bg-primary/20'>
                <div className='size-2 rounded-full bg-primary' />
              </div>
            </div>

            <div className='mt-1 text-muted-foreground text-xs leading-relaxed'>
              Speed up your workflow with these keyboard shortcuts.
            </div>

            <div className='mt-3 space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm'>Search chats</span>
                <div className='flex gap-1'>
                  <kbd className='rounded bg-muted px-2 py-1 font-mono text-xs'>
                    {typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC')
                      ? '⌘'
                      : 'Ctrl'}
                  </kbd>
                  <kbd className='rounded bg-muted px-2 py-1 font-mono text-xs'>K</kbd>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm'>New chat</span>
                <div className='flex gap-1'>
                  <kbd className='rounded bg-muted px-2 py-1 font-mono text-xs'>
                    {typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC')
                      ? '⌘'
                      : 'Ctrl'}
                  </kbd>
                  <kbd className='rounded bg-muted px-2 py-1 font-mono text-xs'>Shift</kbd>
                  <kbd className='rounded bg-muted px-2 py-1 font-mono text-xs'>O</kbd>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm'>Toggle sidebar</span>
                <div className='flex gap-1'>
                  <kbd className='rounded bg-muted px-2 py-1 font-mono text-xs'>
                    {typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC')
                      ? '⌘'
                      : 'Ctrl'}
                  </kbd>
                  <kbd className='rounded bg-muted px-2 py-1 font-mono text-xs'>B</kbd>
                </div>
              </div>

              <div className='flex items-center justify-between'>
                <span className='text-sm'>New line in message</span>
                <div className='flex gap-1'>
                  <kbd className='rounded bg-muted px-2 py-1 font-mono text-xs'>Shift</kbd>
                  <kbd className='rounded bg-muted px-2 py-1 font-mono text-xs'>Enter</kbd>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Language section - soon 🚧 */}
          {/* <div className='flex items-center justify-between'>
            <Label htmlFor='language'>Language</Label>
            <select
              id='language'
              value={settings.language || 'en'}
              onChange={(e) => updateSetting('language', e.target.value)}
              disabled={isUpdating}
              className='rounded border px-3 py-1'
            >
              <option value='en'>English</option>
              <option value='es'>Español</option>
              <option value='fr'>Français</option>
              <option value='de'>Deutsch</option>
            </select>
          </div> */}

          {/* PWA section */}
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
  )
}
