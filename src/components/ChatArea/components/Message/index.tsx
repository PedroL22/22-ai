'use client'

import { cva } from 'class-variance-authority'
import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import './index.css'

import { Check, Copy, Edit, GitBranch, Info, RefreshCcw } from 'lucide-react'
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
import { CodeBlock } from './components/CodeBlock'
import { MarkdownLink } from './components/MarkdownLink'
import { MarkdownTable } from './components/MarkdownTable'

import { cn } from '~/lib/utils'
import { formatMessageDateForChatHistory } from '~/utils/format-date-for-chat-history'
import { getDeveloperIcon } from '~/utils/get-developer-icon'
import { getModelName } from '~/utils/get-model-name'

import type { Message as MessageType } from '@prisma/client'
import { MODELS, type ModelsIds } from '~/types/models'

const messageVariants = cva('group relative flex flex-col gap-0.5 rounded-2xl text-sm', {
  variants: {
    variant: {
      user: 'max-w-[70%] self-end bg-primary px-4 py-3',
      assistant: 'max-w-full self-start bg-transparent',
      error: 'mt-1 max-w-full self-start border border-destructive/20 bg-destructive/10 px-4 py-3',
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
  onBranch?: (messageIndex: number, modelId?: ModelsIds) => void
}

export const Message = ({ message, messageIndex, isStreaming, onRetry, onEdit, onBranch }: MessageProps) => {
  const [isCopied, setIsCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)

  const markdownOptions = useMemo(
    () => ({
      remarkPlugins: [remarkGfm, remarkMath, remarkDirective],
      rehypePlugins: [rehypeKatex, rehypeHighlight, rehypeRaw],
      components: {
        a: MarkdownLink,
        code: ({
          inline,
          className,
          children,
          ...props
        }: { inline?: boolean; className?: string; children?: ReactNode; [key: string]: any }) => {
          if (inline === true || (!className && !String(children).includes('\n'))) {
            return (
              <code
                className='select-all rounded-sm bg-zinc-200 px-1.5 py-0.5 font-medium font-mono text-sm dark:bg-zinc-700'
                {...props}
              >
                {children}
              </code>
            )
          }

          return (
            <CodeBlock className={className} {...props}>
              {children}
            </CodeBlock>
          )
        },
        pre: ({ children }: { children?: ReactNode; [key: string]: any }) => {
          return <>{children}</>
        },
        table: MarkdownTable,
        thead: ({ children, ...props }: { children?: ReactNode; [key: string]: any }) => (
          <thead className='bg-muted/50' {...props}>
            {children}
          </thead>
        ),
        th: ({ children, ...props }: { children?: ReactNode; [key: string]: any }) => (
          <th className='border-b px-4 py-2 text-left font-semibold' {...props}>
            {children}
          </th>
        ),
        td: ({ children, ...props }: { children?: ReactNode; [key: string]: any }) => (
          <td className='border-b px-4 py-2' {...props}>
            {children}
          </td>
        ),
        blockquote: ({ children, ...props }: { children?: ReactNode; [key: string]: any }) => (
          <blockquote className='my-2 border-primary border-l-4 bg-muted/50 py-2 pr-4 pl-4 italic' {...props}>
            {children}
          </blockquote>
        ),
        h1: ({ children, ...props }: { children?: ReactNode; [key: string]: any }) => (
          <h1 className='mt-4 mb-1 font-bold text-2xl' {...props}>
            {children}
          </h1>
        ),
        h2: ({ children, ...props }: { children?: ReactNode; [key: string]: any }) => (
          <h2 className='mt-3 mb-1 font-semibold text-xl' {...props}>
            {children}
          </h2>
        ),
        h3: ({ children, ...props }: { children?: ReactNode; [key: string]: any }) => (
          <h3 className='mt-2 font-semibold text-lg' {...props}>
            {children}
          </h3>
        ),
        h4: ({ children, ...props }: { children?: ReactNode; [key: string]: any }) => (
          <h4 className='mt-2 font-semibold text-base' {...props}>
            {children}
          </h4>
        ),
        ul: ({ children, ...props }: { children?: ReactNode; [key: string]: any }) => (
          <ul className='my-1 ml-4 list-disc space-y-0.5 text-sm' {...props}>
            {children}
          </ul>
        ),
        ol: ({ children, ...props }: { children?: ReactNode; [key: string]: any }) => (
          <ol className='my-1 ml-4 list-decimal space-y-0.5 text-sm' {...props}>
            {children}
          </ol>
        ),
        li: ({ children, ...props }: { children?: ReactNode; [key: string]: any }) => (
          <li className='text-sm leading-relaxed' {...props}>
            {children}
          </li>
        ),
        p: ({ children, ...props }: { children?: ReactNode; [key: string]: any }) => (
          <p className='my-1 text-sm leading-relaxed' {...props}>
            {children}
          </p>
        ),
        hr: ({ ...props }: { [key: string]: any }) => <hr className='my-3 border-border' {...props} />,
        input: ({ type, checked, ...props }: { type?: string; checked?: boolean; [key: string]: any }) => {
          if (type === 'checkbox') {
            return (
              <input type='checkbox' checked={checked} disabled className='mr-2 cursor-default text-sm' {...props} />
            )
          }
          return <input type={type} {...props} />
        },
      },
    }),
    []
  )

  const handleRetry = (modelId?: ModelsIds) => {
    if (onRetry) {
      onRetry(messageIndex, modelId)
    }
  }

  const handleBranch = (modelId?: ModelsIds) => {
    if (onBranch) {
      onBranch(messageIndex, modelId)
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
            className={cn('max-w-none whitespace-pre-wrap break-words data-[role=user]:text-white', {
              'text-destructive': message.isError,
            })}
          >
            <ReactMarkdown {...markdownOptions}>{message.content}</ReactMarkdown>
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
              (message.isError || message.role === 'assistant') && '-left-1',
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
                  className='aspect-square size-8 shrink-0 rounded-sm hover:bg-accent-foreground/5 dark:hover</DropdownMenuContent>:bg-accent-foreground/5'
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
                      {getDeveloperIcon(model.developer)}

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

            {!message.isError && message.role === 'assistant' && onBranch && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    title='Branch from here'
                    data-role={message.role}
                    className='aspect-square size-8 shrink-0 rounded-sm hover:bg-accent-foreground/5 dark:hover:bg-accent-foreground/5'
                  >
                    <GitBranch className='size-4' />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent side='top'>
                  <DropdownMenuItem
                    className='flex cursor-pointer items-center space-x-0.5 px-3 py-2 text-muted-foreground text-xs transition-all ease-in'
                    onClick={() => handleBranch()}
                  >
                    <GitBranch className='size-3' /> <span className='font-medium'>Branch same model</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  {MODELS.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      className='flex items-center justify-between space-y-1 py-0 transition-all ease-in sm:px-3 sm:py-2'
                      onClick={() => handleBranch(model.id)}
                    >
                      <div className='flex items-center space-x-2'>
                        {getDeveloperIcon(model.developer)}

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
