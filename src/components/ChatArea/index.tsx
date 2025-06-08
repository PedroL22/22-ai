'use client'

import { useEffect, useRef, useState, useTransition } from 'react'

import { ArrowUp, File, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'

export const ChatArea = () => {
  //const { userState, connectedPhone } = useAuthStore()
  //const { currentChat } = useChatStore()
  // const [chatHistoryState, setChatHistoryState] = useState<ChatHistoryState>({
  //   data: null,
  //   isLoading: true,
  //   isError: false,
  //   error: null,
  // })
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | undefined>()
  const [isInitialScroll, setIsInitialScroll] = useState(true)
  const [hasAutoScrolled, setHasAutoScrolled] = useState(false)

  const [isPending, startTransition] = useTransition()

  // const { mutateAsync: sendSupportTextMutateAsync } = useSendSupportTextQuery()
  // const { mutateAsync: sendSupportFileMutateAsync } = useSendSupportFileQuery()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isPending && message === '') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [isPending, message])

  // if (!selectedChatId) {
  //   return (
  //     <div className='relative flex w-full flex-col items-center justify-center bg-accent p-4'>
  //       <div className='text-center text-muted-foreground text-sm'>Select a chat to start.</div>
  //     </div>
  //   )
  // }

  // if (chatHistoryState.isError) {
  //   return (
  //     <div className='relative flex w-full flex-col items-center justify-center bg-accent p-4'>
  //       <div className='text-center text-muted-foreground text-sm'>{chatHistoryState.error}</div>
  //     </div>
  //   )
  // }

  // if (chatHistoryState.isLoading || !chatHistoryState.data) {
  //   return (
  //     <div className='relative flex w-full flex-col items-center justify-center bg-accent p-4'>
  //       <Loader2 className='size-4 animate-spin' />
  //     </div>
  //   )
  // }

  // if (!chatHistoryState.data.length) {
  //   return (
  //     <div className='relative flex w-full flex-col items-center justify-center bg-accent p-4'>
  //       <div className='text-center text-muted-foreground text-sm'>No messages in this chat.</div>
  //     </div>
  //   )
  // }

  const handleSendSupportText = async (text: string) => {
    if (!text || isPending) return

    const currentMessage = text

    startTransition(async () => {
      setMessage('')
    })
  }

  const handleSendMessage = () => {
    if ((!message.trim() && !file) || isPending) return

    handleSendSupportText(message)
  }

  return (
    <div className='relative flex w-full flex-col items-center bg-accent px-6 md:px-20'>
      <div
        ref={chatContainerRef}
        className='scrollbar-hide w-full flex-1 space-y-3 overflow-y-auto overscroll-contain [&:not(*:is(@supports(-moz-appearance:none)))]:py-16 [@supports(-moz-appearance:none)]:py-22'
      >
        <AnimatePresence initial={false}>
          {/* {chatHistoryState.data.map((msg) => (
            <motion.div
              key={`${msg.role}-${msg.message}-${msg.timestamp}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.2 }}
              layout='position'
              className='flex flex-col'
            >
              <Message message={msg} />
            </motion.div>
          ))} */}
        </AnimatePresence>

        <div ref={messagesEndRef} className='h-1' />
      </div>

      <div className='-translate-x-1/2 absolute bottom-0 left-1/2 flex w-full max-w-[calc(100%-3rem)] gap-2 rounded-t-xl border-6 border-background/10 border-b-0 bg-border/80 pt-2 pr-2 pb-4 pl-1 backdrop-blur-sm md:max-w-[calc(100%-10rem)] '>
        <div className='relative flex w-full items-center space-x-2'>
          <Textarea
            id='chat-message-input'
            placeholder='Type your message here...'
            title='Type your message here...'
            disabled={isPending}
            value={message}
            className='scrollbar-hide min-h-9 resize-none whitespace-nowrap rounded-t-xl border-none bg-transparent text-sm shadow-none placeholder:select-none placeholder:text-sm focus-visible:ring-0 md:text-base md:placeholder:text-base dark:bg-transparent'
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (e.shiftKey) {
                  // Allow new line when Shift+Enter is pressed
                  return
                }

                e.preventDefault()
                handleSendMessage()
              }
            }}
          />

          <Button
            title='Enviar'
            variant='default'
            size='icon'
            disabled={!message.trim() && !file}
            isLoading={isPending}
            onClick={handleSendMessage}
          >
            <ArrowUp />
          </Button>

          {file && (
            <AnimatePresence>
              <motion.div
                key='files-list'
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.2 }}
                className='absolute right-0 bottom-12.5 select-none rounded-t-xl border-6 border-background/10 bg-border pt-2 pb-4 md:max-w-[calc(100%-10rem)] dark:bg-chart-4'
              >
                <motion.div
                  key={file.name}
                  initial={{ opacity: 0, x: 32 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.18 }}
                  className='flex items-center justify-between space-x-4 px-4'
                >
                  <div className='flex items-center space-x-2'>
                    <File className='size-4' />

                    <span className='text-sm italic'>{file.name}</span>
                  </div>

                  <Button
                    variant='ghost'
                    size='icon'
                    className='hover:bg-destructive dark:hover:bg-destructive'
                    disabled={isPending}
                    onClick={() => setFile(undefined)}
                  >
                    <X />
                  </Button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}
