'use client'

import { cva } from 'class-variance-authority'
import { AnimatePresence, motion } from 'motion/react'
import Image from 'next/image'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { Check, Copy, Edit, Info, RefreshCcw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Textarea } from '~/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'

import { cn } from '~/lib/utils'
import { formatMessageDateForChatHistory } from '~/utils/format-date-for-chat-history'
import { getModelName } from '~/utils/get-model-name'

import type { Message as MessageType } from '@prisma/client'
import { MODELS, type ModelsDevelopers, type ModelsIds } from '~/types/models'

const messageVariants = cva('group relative flex flex-col gap-1 rounded-2xl px-4 py-3 text-sm', {
  variants: {
    variant: {
      user: 'max-w-[70%] self-end bg-primary',
      // user: 'max-w-[70%] self-end bg-border/80', boring theme
      assistant: 'max-w-full self-start bg-transparent',
      error: 'max-w-full self-start border border-destructive/20 bg-destructive/10',
    },
  },
  defaultVariants: {
    variant: 'user',
  },
})

type MessageProps = {
  message: Omit<MessageType, 'id' | 'userId' | 'chatId'>
  messageIndex: number
  isStreaming?: boolean
  onRetry?: (messageIndex: number, modelId?: ModelsIds) => void
  onEdit?: (messageIndex: number, newContent: string) => void
}

export const Message = ({ message, messageIndex, isStreaming, onRetry, onEdit }: MessageProps) => {
  const [isCopied, setIsCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)

  const handleRetry = (modelId?: ModelsIds) => {
    if (onRetry) {
      onRetry(messageIndex, modelId)
    }
  }

  const handleEdit = () => {
    if (onEdit && editContent.trim() !== message.content) {
      onEdit(messageIndex, editContent.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditContent(message.content)
    setIsEditing(false)
  }

  const developerIcon = (developer: ModelsDevelopers) => {
    switch (developer) {
      case 'Google':
        return <Image src='/images/icons/gemini.svg' alt='Gemini Logo' width={16} height={16} className='size-4' />
      case 'DeepSeek':
        return <Image src='/images/icons/deepseek.svg' alt='DeepSeek Logo' width={16} height={16} className='size-4' />

      default:
        return <Sparkles className='size-4 text-zinc-400' />
    }
  }

  return (
    <>
      {isEditing && message.role === 'user' ? (
        <div className='max-w-[70%] space-y-2 self-end'>
          <Textarea
            value={editContent}
            className='min-h-20 resize-none bg-accent/50'
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleEdit()
              }
              if (e.key === 'Escape') {
                handleCancelEdit()
              }
            }}
          />

          <div className='flex justify-end gap-2'>
            <Button size='sm' variant='outline' onClick={handleCancelEdit}>
              Cancel
            </Button>

            <Button size='sm' variant='default' onClick={handleEdit}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className={messageVariants({ variant: message.isError ? 'error' : message.role })}>
          <div
            data-role={message.role}
            className={`max-w-none whitespace-pre-wrap break-words data-[role=user]:text-white ${message.isError ? 'text-destructive' : ''}`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary underline underline-offset-2 hover:text-primary/90'
                  />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          <div
            data-role={message.role}
            data-is-error={message.isError}
            className={cn(
              'absolute flex flex-row-reverse items-center self-start whitespace-nowrap text-muted-foreground transition-all ease-in sm:gap-1 dark:data-[role=user]:text-zinc-300',
              '-bottom-8',
              'data-[is-error=true]:-bottom-11 sm:data-[is-error=true]:-bottom-10',
              'data-[role=user]:-bottom-11 sm:data-[role=user]:-bottom-10',
              'data-[role=user]:right-0 data-[role=user]:flex-row data-[role=user]:self-end',
              // Position logic: error takes precedence over role
              message.isError ? 'left-0' : message.role === 'assistant' ? 'left-3' : '',

              isStreaming ? 'pointer-events-none opacity-0' : 'opacity-0 group-hover:opacity-100'
            )}
          >
            <p className='shrink-0 whitespace-nowrap px-1 text-xs sm:px-3'>{`${message.modelId ? `${getModelName(message.modelId as ModelsIds)} ` : ''}${formatMessageDateForChatHistory(message.createdAt.toISOString())}`}</p>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  title='Retry message'
                  data-role={message.role}
                  className='aspect-square size-8 shrink-0 rounded-sm hover:bg-accent-foreground/5 dark:hover:bg-accent-foreground/5'
                  onClick={() => onRetry?.(messageIndex, message.modelId as ModelsIds)}
                >
                  <RefreshCcw className='size-4' />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent side='top'>
                <DropdownMenuItem
                  className='flex cursor-pointer items-center space-x-0.5 px-3 py-2 text-muted-foreground text-xs transition-all ease-in'
                  onClick={() => handleRetry()}
                >
                  <RefreshCcw className='size-3' /> <span className='font-medium'>Retry same</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {MODELS.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    className='flex cursor-pointer items-center justify-between space-y-1 py-0 transition-all ease-in sm:px-3 sm:py-2'
                    onClick={() => handleRetry(model.id)}
                  >
                    <div className='flex items-center space-x-2'>
                      {developerIcon(model.developer)}

                      <div className='flex w-full items-center justify-between space-x-4'>
                        <span className='whitespace-nowrap font-medium text-muted-foreground text-xs'>
                          {model.name}
                        </span>

                        <Tooltip>
                          <TooltipTrigger className='shrink-0 cursor-pointer'>
                            <Info className='size-3' />
                          </TooltipTrigger>

                          <TooltipContent>
                            <p className='max-w-[300px]'>{model.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {message.role === 'user' && (
              <Button
                variant='ghost'
                title='Edit message'
                data-role={message.role}
                className='aspect-square size-8 shrink-0 rounded-sm hover:bg-accent-foreground/5 dark:hover:bg-accent-foreground/5'
                onClick={() => setIsEditing(true)}
              >
                <Edit className='size-4' />
              </Button>
            )}

            <Button
              variant='ghost'
              title='Copy message'
              data-role={message.role}
              className='aspect-square size-8 shrink-0 rounded-sm hover:bg-accent-foreground/5 dark:hover:bg-accent-foreground/5'
              onClick={() => {
                navigator.clipboard.writeText(message.content)
                toast.success('Copied to clipboard!')
                setIsCopied(true)
                setTimeout(() => setIsCopied(false), 1000)
              }}
            >
              <AnimatePresence mode='wait'>
                {isCopied ? (
                  <motion.div
                    key='check'
                    initial={{ scale: 0.75 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.1, ease: 'easeIn' }}
                  >
                    <Check className='size-4' />
                  </motion.div>
                ) : (
                  <motion.div
                    key='copy'
                    initial={{ scale: 0.75 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.1, ease: 'easeIn' }}
                  >
                    <Copy className='size-4' />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
