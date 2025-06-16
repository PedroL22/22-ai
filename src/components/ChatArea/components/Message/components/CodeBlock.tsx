import { AnimatePresence, motion } from 'motion/react'
import type { HTMLAttributes, ReactNode } from 'react'
import { useRef, useState } from 'react'

import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'

type CodeBlockProps = HTMLAttributes<HTMLElement> & {
  inline?: boolean
  className?: string
  children?: ReactNode
}

export const CodeBlock = ({ inline, className, children, ...props }: CodeBlockProps) => {
  const [codeBlockCopied, setCodeBlockCopied] = useState(false)
  const codeRef = useRef<HTMLElement>(null)

  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : ''

  const copyCode = () => {
    const codeText = String(children).replace(/\n$/, '')
    navigator.clipboard.writeText(codeText)
    toast.success('Copied code to clipboard!')
    setCodeBlockCopied(true)
    setTimeout(() => setCodeBlockCopied(false), 1000)
  }

  if (inline) {
    return (
      <code className='rounded-md bg-muted px-1.5 py-0.5 font-medium font-mono text-sm' {...props}>
        {children}
      </code>
    )
  }

  return (
    <div className='relative my-4 overflow-hidden rounded-sm bg-muted/50'>
      {/* Code header with language and copy button */}
      <div className='flex items-center justify-between bg-zinc-300 px-4 py-1 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200'>
        <span className='font-mono text-sm'>{language || 'code'}</span>

        <Button
          type='button'
          variant='ghost'
          title='Copy code'
          className='aspect-square size-8 shrink-0 rounded-sm hover:bg-accent-foreground/5 dark:hover:bg-accent-foreground/5'
          onClick={copyCode}
        >
          <AnimatePresence mode='wait'>
            {codeBlockCopied ? (
              <motion.div
                key='check'
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className='flex items-center gap-1'
              >
                <Check className='size-4' />
              </motion.div>
            ) : (
              <motion.div
                key='copy'
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className='flex items-center gap-1'
              >
                <Copy className='size-4' />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </div>

      {/* Code content */}
      <pre className='overflow-x-auto bg-zinc-200 p-4 text-sm leading-[1.75] dark:bg-background/15'>
        <code ref={codeRef} className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  )
}
