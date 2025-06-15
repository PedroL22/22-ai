'use client'

import { cva } from 'class-variance-authority'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import {} from '~/components/ui/tooltip'

import { formatMessageDateForChatHistory } from '~/utils/format-date-for-chat-history'
import { getModelName } from '~/utils/get-model-name'

import type { Message as MessageType } from '@prisma/client'
import type { ModelsIds } from '~/types/models'

const messageVariants = cva('group relative flex flex-col gap-1 rounded-2xl px-4 py-3 text-sm', {
  variants: {
    variant: {
      user: 'max-w-[70%] self-end bg-border/80 bg-primary dark:bg-zinc-700/80',
      assistant: 'max-w-full self-start bg-transparent',
    },
  },
  defaultVariants: {
    variant: 'user',
  },
})

type MessageProps = {
  message: Omit<MessageType, 'id' | 'userId' | 'chatId'>
}

export const Message = ({ message }: MessageProps) => {
  const [isCopied, setIsCopied] = useState(false)

  return (
    <div className={messageVariants({ variant: message.role })}>
      <div className='max-w-none whitespace-pre-wrap break-words'>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ node, ...props }) => <a {...props} target='_blank' rel='noopener noreferrer' />,
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>

      <div
        data-role={message.role}
        className='data-[role=user]:-bottom-9 -bottom-8 absolute flex flex-row-reverse items-center gap-1 self-start whitespace-nowrap text-muted-foreground opacity-0 transition-all ease-in group-hover:opacity-100 data-[role=user]:right-0 data-[role=assistant]:left-3 data-[role=user]:flex-row data-[role=user]:self-end data-[role=user]:text-zinc-300'
      >
        <p className='text-xs'>{`${message.modelId ? `${getModelName(message.modelId as ModelsIds)} ` : ''}${formatMessageDateForChatHistory(message.createdAt.toISOString())}`}</p>

        <Button
          variant='ghost'
          title='Copy message'
          data-role={message.role}
          className='aspect-square size-8 rounded-sm hover:bg-accent-foreground/5 dark:hover:bg-accent-foreground/5'
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
  )
}
