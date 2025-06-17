'use client'

import { useUser } from '@clerk/nextjs'
import throttle from 'lodash/throttle'
import { AnimatePresence, motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'

import { ArrowDown, ArrowUp, Loader2, Share2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { EmptyState } from './components/EmptyState'
import { Message } from './components/Message'
import { ModelSelector } from './components/ModelSelector'

import { useChatStore } from '~/stores/useChatStore'

import { createStreamingChatCompletion } from '~/lib/streaming'
import { useRealtimeSync } from '~/lib/useRealtimeSync'
import { api } from '~/trpc/react'
import { createSystemPrompt } from '~/utils/system-prompt'

import type { Chat as ChatType, Message as MessageType } from '@prisma/client'
import type { ModelsIds } from '~/types/models'

type ChatAreaProps = {
  chatId?: string
}

export const ChatArea = ({ chatId }: ChatAreaProps) => {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<MessageType[]>([])
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [userScrolledUp, setUserScrolledUp] = useState(false)

  const { isSignedIn, isLoaded } = useUser()

  const {
    addChat,
    setCurrentChatId,
    chats,
    addMessage,
    getMessages,
    streamingMessage,
    isStreaming,
    setStreamingMessage,
    setIsStreaming,
    renameChat,
    selectedModelId,
    setSelectedModelId,
    removeMessagesFromIndex,
    replaceMessage,
    branchChat,
    isInitialLoading,
    setIsInitialLoading,
  } = useChatStore()
  const currentChat = chatId ? chats.find((chat) => chat.id === chatId) : null
  const { data: dbMessages, isLoading: isDbMessagesLoading } = api.chat.getChatMessages.useQuery(
    { chatId: chatId! },
    {
      enabled: !!chatId && !currentChat && isSignedIn && isLoaded,
      retry: false,
    }
  )
  const { data: ownershipData } = api.chat.isOwnerOfChat.useQuery(
    { chatId: chatId! },
    { enabled: !!chatId && isSignedIn && isLoaded }
  )
  const { data: sharedChatData, isLoading: isSharedChatLoading } = api.chat.getSharedChat.useQuery(
    { chatId: chatId! },
    {
      enabled: !!chatId && !currentChat,
      retry: false,
    }
  )
  const { data: sharedMessages, isLoading: isSharedMessagesLoading } = api.chat.getSharedChatMessages.useQuery(
    { chatId: chatId! },
    {
      enabled: !!chatId && (sharedChatData?.isShared === true || !isSignedIn),
      retry: false,
    }
  )

  const generateTitleMutation = api.chat.generateChatTitle.useMutation()

  const { syncChat, syncMessage, deleteMessagesFromIndex } = useRealtimeSync()

  const isOwner = ownershipData?.isOwner ?? false
  const isSharedChat = currentChat?.isShared || sharedChatData?.isShared || false

  const router = useRouter()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const bufferRef = useRef<string>('')
  const flushBuffer = useRef(
    throttle(() => {
      setStreamingMessage((prev) => prev + bufferRef.current)
      bufferRef.current = ''
    }, 200)
  ).current

  // Reset loading state when chatId changes
  useEffect(() => {
    if (chatId) {
      setIsInitialLoading(true)
    } else {
      setIsInitialLoading(false)
    }
  }, [chatId])

  useEffect(() => {
    if (chatId) {
      if (sharedMessages) {
        setMessages(sharedMessages)
        setIsInitialLoading(false)
      } else if (dbMessages && !currentChat) {
        const transformedMessages: MessageType[] = dbMessages.map((msg) => ({
          ...msg,
          chatId: chatId,
          modelId: null,
          isError: false,
          userId: '',
        }))
        setMessages(transformedMessages)
        setIsInitialLoading(false)
      } else if (currentChat) {
        const storedMessages = getMessages(chatId)
        setMessages(storedMessages)
        setIsInitialLoading(false)
      } else {
        // Still loading or no messages found
        if (!isDbMessagesLoading && !isSharedMessagesLoading && !isSharedChatLoading) {
          setMessages([])
          setIsInitialLoading(false)
        }
      }
    } else {
      setMessages([])
      setIsInitialLoading(false)
    }

    // Only auto-scroll on initial load
    setTimeout(() => {
      const hasMessages =
        chatId &&
        ((sharedMessages && sharedMessages.length > 0) ||
          (dbMessages && dbMessages.length > 0) ||
          (currentChat && getMessages(chatId).length > 0))

      // Only scroll if user hasn't manually scrolled up and we have messages
      if (hasMessages && !userScrolledUp) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        setShowScrollToBottom(false)
        setUserScrolledUp(false)
      }
    }, 100)
  }, [
    chatId,
    sharedMessages,
    dbMessages,
    currentChat,
    userScrolledUp,
    isDbMessagesLoading,
    isSharedMessagesLoading,
    isSharedChatLoading,
  ])

  useEffect(() => {
    // Only auto-scroll during streaming if user hasn't manually scrolled up
    if (isStreaming && !userScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setShowScrollToBottom(false)
    }
  }, [isStreaming, streamingMessage, userScrolledUp])

  useEffect(() => {
    const handleScroll = () => {
      if (!chatContainerRef.current) return

      const container = chatContainerRef.current
      const { scrollTop, scrollHeight, clientHeight } = container
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50 // 50px threshold

      // If user scrolled up from bottom, mark it as intentional
      if (!isAtBottom && !userScrolledUp) {
        setShowScrollToBottom(true)
        setUserScrolledUp(true)
      } else if (isAtBottom) {
        // User is back at bottom
        setShowScrollToBottom(false)
        setUserScrolledUp(false)
      }
    }

    const container = chatContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    return () => {
      flushBuffer.cancel()
    }
  }, [flushBuffer])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollToBottom(false)
    setUserScrolledUp(false)
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (isStreaming) return
    setMessage(suggestion)
  }

  const handleSendMessage = async () => {
    if (!message.trim() || isStreaming) return

    if (isSharedChat && !isOwner) {
      console.warn('Cannot send messages to shared chats that you do not own')
      return
    }

    const userMessage = message.trim()
    setMessage('')
    setUserScrolledUp(false)

    try {
      let currentChatId = chatId

      if (!currentChatId) {
        currentChatId = uuid()

        router.push(`/${currentChatId}`)

        const newChat: ChatType = {
          id: currentChatId,
          title: '',
          isPinned: false,
          isShared: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: '',
        }

        addChat(newChat)
        setCurrentChatId(currentChatId)
        syncChat(newChat)

        generateTitleMutation
          .mutateAsync({ firstMessage: userMessage })
          .then((result) => {
            const newTitle = result.success && result.title ? result.title : 'New chat'
            renameChat(currentChatId!, newTitle)

            const updatedChat: ChatType = {
              id: currentChatId!,
              title: newTitle,
              isPinned: false,
              isShared: false,
              createdAt: newChat.createdAt,
              updatedAt: new Date(),
              userId: '',
            }
            syncChat(updatedChat)
          })
          .catch((error) => {
            console.error('❌ Failed to generate title: ', error)
            renameChat(currentChatId!, 'New chat')

            const updatedChat: ChatType = {
              id: currentChatId!,
              title: 'New chat',
              isPinned: false,
              isShared: false,
              createdAt: newChat.createdAt,
              updatedAt: new Date(),
              userId: '',
            }
            syncChat(updatedChat)
          })
      }

      const tempUserMessage: MessageType = {
        id: uuid(),
        role: 'user',
        content: userMessage,
        isError: false,
        createdAt: new Date(),
        userId: '',
        chatId: currentChatId,
        modelId: null,
      }

      setMessages((prev) => [...prev, tempUserMessage])
      addMessage(currentChatId, tempUserMessage)

      syncMessage(tempUserMessage)

      const currentChat = chats.find((chat) => chat.id === currentChatId)
      if (currentChat) {
        const updatedChat = {
          ...currentChat,
          updatedAt: new Date(),
        }
        syncChat(updatedChat)
      }

      const allMessages = [createSystemPrompt(), ...messages, tempUserMessage].map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }))

      setIsStreaming(true)
      setStreamingMessage('')
      // clean the buffer before starting the streaming
      bufferRef.current = ''

      await createStreamingChatCompletion(
        allMessages,
        selectedModelId,
        (chunk) => {
          if (chunk.type === 'chunk' && chunk.content) {
            // use buffer instead of setStreamingMessage directly
            bufferRef.current += chunk.content
            flushBuffer()
          }
        },
        async (fullMessage) => {
          const assistantMessage: MessageType = {
            id: uuid(),
            role: 'assistant',
            content: fullMessage,
            isError: false,
            createdAt: new Date(),
            userId: '',
            chatId: currentChatId!,
            modelId: selectedModelId,
          }
          addMessage(currentChatId!, assistantMessage)

          syncMessage(assistantMessage)

          const currentChat = chats.find((chat) => chat.id === currentChatId)
          if (currentChat) {
            const updatedChat = {
              ...currentChat,
              updatedAt: new Date(),
            }
            syncChat(updatedChat)
          }

          setMessages(getMessages(currentChatId!))

          // throttle cleanup on completion
          flushBuffer.cancel()
          bufferRef.current = ''
          setStreamingMessage('')
          setIsStreaming(false)
        },
        async (error) => {
          console.error('❌ Streaming error: ', error)

          const errorMessage: MessageType = {
            id: uuid(),
            role: 'assistant',
            content: error,
            isError: true,
            createdAt: new Date(),
            userId: '',
            chatId: currentChatId!,
            modelId: selectedModelId,
          }

          addMessage(currentChatId!, errorMessage)
          syncMessage(errorMessage)

          setMessages(getMessages(currentChatId!))

          // throttle cleanup on error
          flushBuffer.cancel()
          bufferRef.current = ''
          setStreamingMessage('')
          setIsStreaming(false)
        }
      )
    } catch (err) {
      console.error('❌ Error sending message: ', err)

      if (chatId) {
        const errorMessage: MessageType = {
          id: uuid(),
          role: 'assistant',
          content: err instanceof Error ? err.message : 'An unexpected error occurred while sending your message.',
          isError: true,
          createdAt: new Date(),
          userId: '',
          chatId: chatId,
          modelId: selectedModelId,
        }

        addMessage(chatId, errorMessage)
        syncMessage(errorMessage)

        setMessages(getMessages(chatId))
      }

      // throttle cleanup on error
      flushBuffer.cancel()
      bufferRef.current = ''
      setStreamingMessage('')
      setIsStreaming(false)
    }
  }

  const handleEdit = async (messageIndex: number, newContent: string) => {
    if (isStreaming || !chatId) return

    const targetMessage = messages[messageIndex]
    if (!targetMessage || targetMessage.role !== 'user') return

    if (isSharedChat && !isOwner) {
      console.warn('Cannot edit messages in shared chats that you do not own')
      return
    }

    const updatedMessage: MessageType = {
      ...targetMessage,
      content: newContent,
    }

    replaceMessage(chatId, messageIndex, updatedMessage)

    syncMessage(updatedMessage)

    const nextMessageIndex = messageIndex + 1
    if (nextMessageIndex < messages.length) {
      removeMessagesFromIndex(chatId, nextMessageIndex)
      await deleteMessagesFromIndex(chatId, nextMessageIndex)
    }

    const updatedMessages = messages.slice(0, messageIndex)
    updatedMessages[messageIndex] = updatedMessage
    setMessages(updatedMessages)

    const currentChat = chats.find((chat) => chat.id === chatId)
    if (currentChat) {
      const updatedChat = {
        ...currentChat,
        updatedAt: new Date(),
      }
      syncChat(updatedChat)
    }

    try {
      const allMessages = [createSystemPrompt(), ...updatedMessages].map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }))

      setIsStreaming(true)
      setStreamingMessage('')
      bufferRef.current = ''

      await createStreamingChatCompletion(
        allMessages,
        selectedModelId,
        (chunk) => {
          if (chunk.type === 'chunk' && chunk.content) {
            bufferRef.current += chunk.content
            flushBuffer()
          }
        },
        async (fullMessage) => {
          const assistantMessage: MessageType = {
            id: uuid(),
            role: 'assistant',
            content: fullMessage,
            isError: false,
            createdAt: new Date(),
            userId: '',
            chatId: chatId,
            modelId: selectedModelId,
          }

          addMessage(chatId, assistantMessage)
          syncMessage(assistantMessage)

          setMessages((prev) => [...prev, assistantMessage])
          setIsStreaming(false)

          flushBuffer.cancel()
          bufferRef.current = ''
          setStreamingMessage('')
        },
        async (error) => {
          console.error('❌ Streaming error after edit: ', error)

          const errorMessage: MessageType = {
            id: uuid(),
            role: 'assistant',
            content: error,
            isError: true,
            createdAt: new Date(),
            userId: '',
            chatId: chatId,
            modelId: selectedModelId,
          }

          addMessage(chatId, errorMessage)
          syncMessage(errorMessage)

          setMessages((prev) => [...prev, errorMessage])

          setIsStreaming(false)

          flushBuffer.cancel()
          bufferRef.current = ''
          setStreamingMessage('')
        }
      )
    } catch (error) {
      console.error('❌ Failed to get AI response after edit: ', error)

      const errorMessage: MessageType = {
        id: uuid(),
        role: 'assistant',
        content:
          error instanceof Error ? error.message : 'An unexpected error occurred while getting AI response after edit.',
        isError: true,
        createdAt: new Date(),
        userId: '',
        chatId: chatId,
        modelId: selectedModelId,
      }

      addMessage(chatId, errorMessage)
      syncMessage(errorMessage)

      setMessages((prev) => [...prev, errorMessage])

      setIsStreaming(false)
      setStreamingMessage('')
    }
  }

  const handleRetry = async (messageIndex: number, modelId?: ModelsIds) => {
    if (isStreaming || !chatId) return

    const targetMessage = messages[messageIndex]
    if (!targetMessage) return

    if (isSharedChat && !isOwner) {
      console.warn('Cannot retry messages in shared chats that you do not own')
      return
    }

    const retryModelId = modelId || (targetMessage.modelId as ModelsIds) || selectedModelId

    const updatedTargetMessage: MessageType = {
      ...targetMessage,
      createdAt: new Date(),
    }
    replaceMessage(chatId, messageIndex, updatedTargetMessage)
    syncMessage(updatedTargetMessage)

    setMessages(getMessages(chatId))

    if (targetMessage.role === 'user') {
      const nextAssistantIndex = messages.findIndex((msg, idx) => idx > messageIndex && msg.role === 'assistant')

      if (nextAssistantIndex !== -1) {
        removeMessagesFromIndex(chatId, nextAssistantIndex)
        await deleteMessagesFromIndex(chatId, nextAssistantIndex)
        setMessages(getMessages(chatId))
      }

      const contextMessages = [createSystemPrompt(), ...messages.slice(0, messageIndex + 1)].map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }))

      setIsStreaming(true)
      setStreamingMessage('')
      bufferRef.current = ''

      await createStreamingChatCompletion(
        contextMessages,
        retryModelId,
        (chunk) => {
          if (chunk.type === 'chunk' && chunk.content) {
            bufferRef.current += chunk.content
            flushBuffer()
          }
        },
        async (fullMessage) => {
          const assistantMessage: MessageType = {
            id: uuid(),
            role: 'assistant',
            content: fullMessage,
            isError: false,
            createdAt: new Date(),
            userId: '',
            chatId: chatId,
            modelId: retryModelId,
          }

          addMessage(chatId, assistantMessage)
          syncMessage(assistantMessage)

          const currentChat = chats.find((chat) => chat.id === chatId)
          if (currentChat) {
            const updatedChat = {
              ...currentChat,
              updatedAt: new Date(),
            }
            syncChat(updatedChat)
          }
          setMessages(getMessages(chatId))

          flushBuffer.cancel()
          bufferRef.current = ''
          setStreamingMessage('')
          setIsStreaming(false)
        },
        async (error) => {
          console.error('❌ Retry streaming error: ', error)

          const errorMessage: MessageType = {
            id: uuid(),
            role: 'assistant',
            content: error,
            isError: true,
            createdAt: new Date(),
            userId: '',
            chatId: chatId,
            modelId: retryModelId,
          }

          addMessage(chatId, errorMessage)
          syncMessage(errorMessage)

          setMessages(getMessages(chatId))

          setStreamingMessage('')
          setIsStreaming(false)
        }
      )
    } else if (targetMessage.role === 'assistant') {
      removeMessagesFromIndex(chatId, messageIndex)

      await deleteMessagesFromIndex(chatId, messageIndex)

      setMessages(getMessages(chatId))

      const contextMessages = [createSystemPrompt(), ...messages.slice(0, messageIndex)].map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }))

      setIsStreaming(true)
      setStreamingMessage('')
      bufferRef.current = ''

      await createStreamingChatCompletion(
        contextMessages,
        retryModelId,
        (chunk) => {
          if (chunk.type === 'chunk' && chunk.content) {
            bufferRef.current += chunk.content
            flushBuffer()
          }
        },
        async (fullMessage) => {
          const assistantMessage: MessageType = {
            id: uuid(),
            role: 'assistant',
            content: fullMessage,
            isError: false,
            createdAt: new Date(),
            userId: '',
            chatId: chatId,
            modelId: retryModelId,
          }

          addMessage(chatId, assistantMessage)
          syncMessage(assistantMessage)

          const currentChat = chats.find((chat) => chat.id === chatId)
          if (currentChat) {
            const updatedChat = {
              ...currentChat,
              updatedAt: new Date(),
            }
            syncChat(updatedChat)
          }
          setMessages(getMessages(chatId))
          setStreamingMessage('')
          setIsStreaming(false)
        },
        async (error) => {
          console.error('❌ Retry streaming error: ', error)

          const errorMessage: MessageType = {
            id: uuid(),
            role: 'assistant',
            content: error,
            isError: true,
            createdAt: new Date(),
            userId: '',
            chatId: chatId,
            modelId: retryModelId,
          }

          addMessage(chatId, errorMessage)
          syncMessage(errorMessage)

          setMessages(getMessages(chatId))

          setStreamingMessage('')
          setIsStreaming(false)
        }
      )
    }
  }

  const handleBranch = async (messageIndex: number, modelId?: ModelsIds) => {
    if (!chatId) return

    try {
      const { id: newChatId, chat: newChat } = branchChat(chatId, messageIndex)

      // Sync the new branched chat to the database
      await syncChat(newChat)

      // Then sync all messages in the branched chat
      for (const message of newChat.messages) {
        await syncMessage(message)
      }

      router.push(`/${newChatId}`)

      if (modelId) {
        setSelectedModelId(modelId)
      }
    } catch (error) {
      console.error('❌ Failed to branch chat: ', error)
    }
  }

  return (
    <div className='relative flex w-full flex-col items-center bg-accent'>
      {/* Shared indicator */}
      {isSharedChat && (
        <div className='absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 font-medium text-primary text-xs backdrop-blur-sm'>
          <Share2 className='size-3' />
          <span>Shared</span>

          {sharedChatData?.ownerName && (
            <span className='text-primary/70'>by {isOwner ? 'you' : sharedChatData.ownerName}</span>
          )}
        </div>
      )}

      <div
        ref={chatContainerRef}
        className='scrollbar-hide w-full max-w-[768px] flex-1 space-y-10 overflow-y-auto overscroll-contain px-6 lg:px-4 [&:not(*:is(@supports(-moz-appearance:none)))]:py-36 sm:[&:not(*:is(@supports(-moz-appearance:none)))]:py-38 [@supports(-moz-appearance:none)]:py-42 sm:[@supports(-moz-appearance:none)]:py-44'
      >
        {messages.length === 0 && !isStreaming ? (
          <div className='flex items-center justify-center pb-4 sm:h-full sm:pb-0'>
            {isInitialLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className='flex flex-col items-center justify-center'
              >
                <Loader2 className='size-8 animate-spin text-muted-foreground' />
              </motion.div>
            ) : (
              <EmptyState onSuggestionClickAction={handleSuggestionClick} />
            )}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <motion.div
                key={`${msg.role}-${msg.content}-${new Date(msg.createdAt).getTime()}-${index}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
                layout='position'
                className='flex flex-col'
              >
                {' '}
                <Message
                  message={msg}
                  messageIndex={index}
                  isStreaming={isStreaming}
                  onRetry={handleRetry}
                  onEdit={handleEdit}
                  onBranch={handleBranch}
                />
              </motion.div>
            ))}

            {isStreaming && streamingMessage && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                layout='position'
                className='flex flex-col'
              >
                <Message
                  message={{
                    role: 'assistant',
                    content: streamingMessage,
                    isError: false,
                    createdAt: new Date(),
                    modelId: selectedModelId,
                  }}
                  messageIndex={messages.length}
                  isStreaming={true}
                  onRetry={handleRetry}
                  onEdit={handleEdit}
                  onBranch={handleBranch}
                />
              </motion.div>
            )}

            {isStreaming && !streamingMessage && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                layout='position'
                className='flex flex-col'
              >
                <div className='animate-pulse p-4 text-muted-foreground text-sm'>Assistant is thinking...</div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        <div ref={messagesEndRef} className='h-1' />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollToBottom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className='absolute right-1/2 not-[@supports(-moz-appearance:none)]:bottom-32.5 z-10 translate-x-1/2 sm:not-[@supports(-moz-appearance:none)]:bottom-30 [@supports(-moz-appearance:none)]:bottom-36'
          >
            <Button
              variant='secondary'
              title='Scroll to bottom'
              className='rounded-full border-2 border-zinc-600/5 bg-border/80 text-xs shadow-2xl backdrop-blur-sm dark:border-background/10'
              onClick={scrollToBottom}
            >
              <ArrowDown className='size-3.5' /> Scroll to bottom
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className='-translate-x-1/2 absolute bottom-0 left-1/2 flex w-full max-w-[calc(100%-1rem)] flex-col gap-2 rounded-t-xl border-6 border-zinc-600/5 border-b-0 bg-border/80 pt-2 pr-2 pb-4 pl-1 shadow-2xl backdrop-blur-sm lg:max-w-[768px] dark:border-background/10 dark:bg-zinc-700/80'>
        <div className='relative flex w-full items-center space-x-2'>
          <Textarea
            id='chat-message-input'
            placeholder={
              isSharedChat && !isOwner ? 'Only the chat owner can send messages' : 'Type your message here...'
            }
            title={isSharedChat && !isOwner ? 'Only the chat owner can send messages' : 'Type your message here...'}
            disabled={isStreaming || (isSharedChat && !isOwner)}
            value={message}
            className='scrollbar-hide min-h-9 resize-none whitespace-nowrap rounded-t-xl border-none bg-transparent text-sm shadow-none placeholder:select-none placeholder:text-sm focus-visible:ring-0 sm:text-base sm:placeholder:text-base dark:bg-transparent'
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (e.shiftKey) {
                  return
                }

                e.preventDefault()
                handleSendMessage()
              }
            }}
          />

          <Button
            title='Send'
            variant='default'
            size='icon'
            disabled={isStreaming || !message.trim() || (isSharedChat && !isOwner)}
            isLoading={isStreaming}
            onClick={handleSendMessage}
          >
            <ArrowUp className='size-4' />
          </Button>
        </div>

        <ModelSelector />
      </div>
    </div>
  )
}
