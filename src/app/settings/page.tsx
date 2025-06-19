'use client'

import { UserProfile, useUser } from '@clerk/nextjs'
import { ArrowLeft, Database, Key, Keyboard, Smartphone, Zap } from 'lucide-react'
import { motion } from 'motion/react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useState } from 'react'

import { PWAInstallPrompt } from '~/components/PWAInstallPrompt'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'

import { useApiKeyStore } from '~/stores/useApiKeyStore'

import { clerkThemes } from '~/lib/clerk-themes'
import { useUserSettings } from '~/lib/useUserSettings'

export default function SettingsPage() {
  const [manageAccountDialogOpen, setManageAccountDialogOpen] = useState(false)
  const { settings, isLoading, updateSetting, isUpdating } = useUserSettings()
  const openaiApiKey = useApiKeyStore((s) => s.openaiApiKey)
  const geminiApiKey = useApiKeyStore((s) => s.geminiApiKey)
  const anthropicApiKey = useApiKeyStore((s) => s.anthropicApiKey)
  const setOpenaiApiKey = useApiKeyStore((s) => s.setOpenaiApiKey)
  const setGeminiApiKey = useApiKeyStore((s) => s.setGeminiApiKey)
  const setAnthropicApiKey = useApiKeyStore((s) => s.setAnthropicApiKey)

  const { isSignedIn, user } = useUser()
  const { resolvedTheme } = useTheme()

  const settingSections = [
    {
      id: 'sync',
      title: 'Database Sync',
      description: 'Sync your chats with the cloud for access across devices',
      icon: Database,
      content: (
        <div className='space-y-4'>
          {isSignedIn ? (
            <div className='flex items-center justify-between rounded-lg border p-4'>
              <div className='space-y-0.5'>
                <Label htmlFor='sync-chats' className='font-medium text-sm'>
                  Sync chats
                </Label>

                <p className='text-muted-foreground text-xs'>Keep your conversations synchronized across all devices</p>
              </div>

              <Switch
                id='sync-chats'
                checked={settings?.syncWithDb}
                onCheckedChange={(checked) => updateSetting('syncWithDb', !!checked)}
                disabled={isUpdating || isLoading}
              />
            </div>
          ) : (
            <div className='rounded-lg border p-6 text-center'>
              <Database className='mx-auto mb-4 size-8 text-muted-foreground' />

              <h3 className='mb-2 font-medium'>Sign in to sync</h3>

              <p className='mb-4 text-muted-foreground text-sm'>Create an account to sync your chats across devices</p>

              <Button asChild>
                <Link href='/sign-in'>Sign in</Link>
              </Button>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'api-keys',
      title: 'API Keys (BYOK)',
      description: 'Bring your own API keys for enhanced functionality',
      icon: Key,
      content: (
        <div className='space-y-4'>
          <div className='rounded-lg border p-4'>
            <div className='mb-4 flex items-center gap-2'>
              <Key className='size-4' />

              <span className='font-medium text-sm'>Your API Keys</span>
            </div>

            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='openai_api_key' className='font-medium text-sm'>
                  OpenAI API Key
                </Label>

                <Input
                  id='openai_api_key'
                  type='password'
                  placeholder='sk-...'
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  autoComplete='off'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='gemini_api_key' className='font-medium text-sm'>
                  Gemini API Key
                </Label>

                <Input
                  id='gemini_api_key'
                  type='password'
                  placeholder='AIza...'
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  autoComplete='off'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='anthropic_api_key' className='font-medium text-sm'>
                  Anthropic API Key
                </Label>

                <Input
                  id='anthropic_api_key'
                  type='password'
                  placeholder='sk-ant-...'
                  value={anthropicApiKey}
                  onChange={(e) => setAnthropicApiKey(e.target.value)}
                  autoComplete='off'
                />
              </div>
            </div>

            <div className='mt-4 rounded-lg bg-muted/50 p-3'>
              <p className='text-muted-foreground text-xs'>
                🔒 These keys are stored locally in your browser and never leave your device.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'pwa',
      title: 'Progressive Web App',
      description: 'Install 22AI as a native app for better performance',
      icon: Smartphone,
      content: (
        <div className='flex justify-center space-y-4 rounded-lg border p-4'>
          <div className='w-full max-w-sm self-center'>
            <div className='flex items-center justify-between'>
              <div className='space-y-0.5'>
                <div className='font-medium text-sm'>Install as Native App</div>

                <p className='text-muted-foreground text-xs'>Get faster loading and a native app experience</p>
              </div>

              <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10'>
                <Smartphone className='size-5 text-primary' />
              </div>
            </div>

            <div className='mt-4'>
              <PWAInstallPrompt />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'shortcuts',
      title: 'Keyboard Shortcuts',
      description: 'Speed up your workflow with these keyboard shortcuts',
      icon: Keyboard,
      content: (
        <div className='space-y-3'>
          {[
            { action: 'Search chats', keys: ['Ctrl', 'K'] },
            { action: 'New chat', keys: ['Ctrl', 'Shift', 'O'] },
            { action: 'Toggle sidebar', keys: ['Ctrl', 'B'] },
            { action: 'New line in message', keys: ['Shift', 'Enter'] },
          ].map((shortcut) => (
            <div key={shortcut.action} className='flex items-center justify-between rounded-lg border p-3'>
              <span className='font-medium text-sm'>{shortcut.action}</span>

              <div className='flex gap-1'>
                {shortcut.keys.map((key) => (
                  <kbd key={`${shortcut.action}-${key}`} className='rounded bg-muted px-2 py-1 font-mono text-xs'>
                    {key === 'Ctrl' &&
                    typeof navigator !== 'undefined' &&
                    navigator.platform.toUpperCase().includes('MAC')
                      ? '⌘'
                      : key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ]

  return (
    <div className='min-h-screen bg-gradient-to-br from-background to-muted/20'>
      <div className='mx-auto max-w-4xl px-4 py-8 sm:px-6'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='mb-8'
        >
          <div className='mb-4'>
            <Button variant='ghost' size='sm' asChild>
              <Link href='/' className='gap-2'>
                <ArrowLeft className='size-4' />
                Back to Chat
              </Link>
            </Button>
          </div>

          <div className='space-y-2'>
            <h1 className='font-bold text-3xl tracking-tight'>Settings</h1>
            <p className='text-muted-foreground'>Customize your 22AI experience and manage your preferences</p>
          </div>

          {isSignedIn && user && (
            <div className='mt-6 flex flex-col items-center justify-between gap-4 rounded-lg border bg-card/50 p-4 backdrop-blur-sm md:flex-row'>
              <div className='flex items-center gap-3'>
                <Avatar className='size-10'>
                  <AvatarImage src={user?.imageUrl || undefined} alt={user?.fullName || undefined} />

                  <AvatarFallback>{user?.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>

                <div>
                  <p className='font-medium text-sm'>{user.firstName || user.emailAddresses[0]?.emailAddress}</p>
                  <p className='text-muted-foreground text-xs'>{user.emailAddresses[0]?.emailAddress}</p>
                </div>
              </div>

              <Button variant='outline' size='sm' onClick={() => setManageAccountDialogOpen(true)}>
                Manage account
              </Button>
            </div>
          )}
        </motion.div>

        {/* Settings Sections */}
        <div className='space-y-6'>
          {settingSections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className='rounded-xl border bg-card/50 backdrop-blur-sm'
            >
              <div className='p-6'>
                <div className='mb-4 flex items-center gap-3'>
                  <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10'>
                    <section.icon className='size-5 text-primary' />
                  </div>

                  <div>
                    <h2 className='font-semibold text-lg'>{section.title}</h2>
                    <p className='text-muted-foreground text-sm'>{section.description}</p>
                  </div>
                </div>
                {section.content}
              </div>
            </motion.div>
          ))}

          <Dialog open={manageAccountDialogOpen} onOpenChange={setManageAccountDialogOpen}>
            <DialogContent className='overflow-auto rounded-2xl border-none p-0 md:max-w-[880px]'>
              <DialogHeader className='sr-only'>
                <DialogTitle />
                <DialogDescription />
              </DialogHeader>

              <div className='flex w-full items-center justify-center overflow-hidden'>
                <UserProfile routing='hash' appearance={clerkThemes(resolvedTheme ?? 'dark')} />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className='mt-12 text-center'
        >
          <div className='inline-flex items-center gap-2 rounded-full bg-muted/50 px-4 py-2 text-muted-foreground text-xs'>
            <Zap className='size-3' />
            22AI - Powered by cutting-edge AI technology
          </div>
        </motion.div>
      </div>
    </div>
  )
}
