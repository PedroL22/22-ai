'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'

import { ArrowDown, ArrowUp, Share2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { EmptyState } from './components/EmptyState'
import { Message } from './components/Message'
import { ModelSelector } from './components/ModelSelector'

import { useChatStore } from '~/stores/useChatStore'
import { api } from '~/trpc/react'

import { createStreamingChatCompletion } from '~/lib/streaming'
import { useRealtimeSync } from '~/lib/useRealtimeSync'

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
    removeMessagesFromIndex,
    replaceMessage,
  } = useChatStore()

  const currentChat = chatId ? chats.find((chat) => chat.id === chatId) : null // Check if current user is the owner of this chat (only if authenticated)
  const { data: ownershipData } = api.chat.isOwnerOfChat.useQuery(
    { chatId: chatId! },
    { enabled: !!chatId && isSignedIn && isLoaded }
  )
  const { data: sharedChatData } = api.chat.getSharedChat.useQuery(
    { chatId: chatId! },
    {
      enabled: !!chatId && !currentChat,
      retry: false,
      refetchOnWindowFocus: false,
    }
  )

  // Only fetch shared messages if we confirmed the chat is shared
  const { data: sharedMessages } = api.chat.getSharedChatMessages.useQuery(
    { chatId: chatId! },
    {
      enabled: !!chatId && sharedChatData?.isShared === true,
      retry: false,
      refetchOnWindowFocus: false,
    }
  )

  const isOwner = ownershipData?.isOwner ?? false
  const isSharedChat = currentChat?.isShared || sharedChatData?.isShared || false

  const generateTitleMutation = api.chat.generateChatTitle.useMutation()
  const { syncChat, syncMessage, deleteMessagesFromIndex } = useRealtimeSync()

  const router = useRouter()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Load messages when chatId changes or component mounts
  useEffect(() => {
    if (chatId) {
      // For shared chats, use shared messages if available, otherwise use local messages
      if (isSharedChat && sharedMessages) {
        setMessages(sharedMessages)
      } else {
        const storedMessages = getMessages(chatId)
        setMessages(storedMessages)
      }
    } else {
      setMessages([])
    }
  }, [chatId, getMessages, isSharedChat, sharedMessages])

  // Sync local state with store when messages change (only for owned chats)
  useEffect(() => {
    if (chatId && !isSharedChat) {
      const storedMessages = getMessages(chatId)
      setMessages(storedMessages)
    }
  }, [chats, chatId, getMessages, isSharedChat])

  // useEffect(() => {
  //   if (!isStreaming && message === '' && messages.length > 0) {
  //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  //   }
  // }, [isStreaming, message, messages, streamingMessage])

  // Auto-scroll during streaming if user hasn't manually scrolled up
  useEffect(() => {
    if (isStreaming && !userScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [isStreaming, streamingMessage, userScrolledUp])

  const handleSuggestionClick = (suggestion: string) => {
    if (isStreaming) return
    setMessage(suggestion)
  }

  const handleSendMessage = async () => {
    if (!message.trim() || isStreaming) return

    // Only allow message sending if user is the owner or it's not a shared chat
    if (isSharedChat && !isOwner) {
      console.warn('Cannot send messages to shared chats that you do not own')
      return
    }

    const userMessage = message.trim()
    setMessage('')
    setUserScrolledUp(false) // Reset scroll tracking when sending new message

    try {
      let currentChatId = chatId

      if (!currentChatId) {
        currentChatId = uuid()

        // Navigate to the new chat immediately
        router.push(`/${currentChatId}`)

        // Create chat locally in store with empty title initially
        const newChat: ChatType = {
          id: currentChatId,
          title: '', // Empty string initially, will be updated by title generation
          isPinned: false,
          isShared: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: '', // Will be set when saved to DB
        }

        // Add chat to store immediately
        addChat(newChat)
        setCurrentChatId(currentChatId) // Sync the new chat to database immediately
        syncChat(newChat)

        // Generate title concurrently using tRPC
        generateTitleMutation
          .mutateAsync({ firstMessage: userMessage })
          .then((result) => {
            const newTitle = result.success && result.title ? result.title : 'New chat'
            renameChat(currentChatId!, newTitle)

            // Sync the updated chat with the new title
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

            // Sync the chat with fallback title
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

      // Add user message to UI immediately
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

      // Sync the user message to database
      syncMessage(tempUserMessage)

      // Update and sync chat timestamp after adding message
      const currentChat = chats.find((chat) => chat.id === currentChatId)
      if (currentChat) {
        const updatedChat = {
          ...currentChat,
          updatedAt: new Date(),
        }
        syncChat(updatedChat)
      }

      // Get all messages for context

      const allMessages = [...messages, tempUserMessage].map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))

      setIsStreaming(true)
      setStreamingMessage('')

      await createStreamingChatCompletion(
        allMessages,
        selectedModelId,
        (chunk) => {
          if (chunk.type === 'chunk' && chunk.content) {
            setStreamingMessage((prev) => {
              const newMessage = prev + chunk.content
              return newMessage
            })
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
          } // Add to store first
          addMessage(currentChatId!, assistantMessage)

          // Sync the assistant message to database
          syncMessage(assistantMessage)

          // Update and sync chat timestamp after adding assistant message
          const currentChat = chats.find((chat) => chat.id === currentChatId)
          if (currentChat) {
            const updatedChat = {
              ...currentChat,
              updatedAt: new Date(),
            }
            syncChat(updatedChat)
          }

          // Then update local state from store to ensure consistency
          setMessages(getMessages(currentChatId!))

          setStreamingMessage('')
          setIsStreaming(false)
        },
        async (error) => {
          console.error('❌ Streaming error: ', error)

          // Create error message
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

          // Add error message to store and sync to database
          addMessage(currentChatId!, errorMessage)
          syncMessage(errorMessage)

          // Update local state from store to ensure consistency
          setMessages(getMessages(currentChatId!))

          setStreamingMessage('')
          setIsStreaming(false)
        }
      )
    } catch (err) {
      console.error('❌ Error sending message: ', err)

      // Create error message for general errors
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

        // Add error message to store and sync to database
        addMessage(chatId, errorMessage)
        syncMessage(errorMessage)

        // Update local state from store to ensure consistency
        setMessages(getMessages(chatId))
      }

      setStreamingMessage('')
      setIsStreaming(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollToBottom(false)
    setUserScrolledUp(false) // Reset scroll tracking when manually scrolling to bottom
  }

  const handleEdit = async (messageIndex: number, newContent: string) => {
    if (isStreaming || !chatId) return

    const targetMessage = messages[messageIndex]
    if (!targetMessage || targetMessage.role !== 'user') return

    // Only allow editing if user is the owner or it's not a shared chat
    if (isSharedChat && !isOwner) {
      console.warn('Cannot edit messages in shared chats that you do not own')
      return
    }

    // Create updated message
    const updatedMessage: MessageType = {
      ...targetMessage,
      content: newContent,
    }

    // Replace the message in the store
    replaceMessage(chatId, messageIndex, updatedMessage)

    // Sync the updated message to database
    syncMessage(updatedMessage)

    // Remove all messages after this user message since they're no longer valid
    const nextMessageIndex = messageIndex + 1
    if (nextMessageIndex < messages.length) {
      removeMessagesFromIndex(chatId, nextMessageIndex)
      // Also remove from database
      await deleteMessagesFromIndex(chatId, nextMessageIndex)
    }

    // Update local state with the edited message
    const updatedMessages = messages.slice(0, messageIndex)
    updatedMessages[messageIndex] = updatedMessage
    setMessages(updatedMessages)

    // Update chat timestamp
    const currentChat = chats.find((chat) => chat.id === chatId)
    if (currentChat) {
      const updatedChat = {
        ...currentChat,
        updatedAt: new Date(),
      }
      syncChat(updatedChat)
    }

    // Now send the edited message to get a new AI response
    try {
      // Get all messages for context (up to and including the edited message)
      const allMessages = updatedMessages.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))

      setIsStreaming(true)
      setStreamingMessage('')

      await createStreamingChatCompletion(
        allMessages,
        selectedModelId,
        (chunk) => {
          if (chunk.type === 'chunk' && chunk.content) {
            setStreamingMessage((prev) => {
              const newMessage = prev + chunk.content
              return newMessage
            })
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

          // Add assistant message to store and sync to database
          addMessage(chatId, assistantMessage)
          syncMessage(assistantMessage)

          // Update local state
          setMessages((prev) => [...prev, assistantMessage])
          setIsStreaming(false)
          setStreamingMessage('')

          // Update chat timestamp after assistant response
          const currentChat = chats.find((chat) => chat.id === chatId)
          if (currentChat) {
            const updatedChat = {
              ...currentChat,
              updatedAt: new Date(),
            }
            syncChat(updatedChat)
          }
        },
        async (error) => {
          console.error('❌ Streaming error after edit: ', error)

          // Create error message
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

          // Add error message to store and sync to database
          addMessage(chatId, errorMessage)
          syncMessage(errorMessage)

          // Update local state
          setMessages((prev) => [...prev, errorMessage])

          setIsStreaming(false)
          setStreamingMessage('')
        }
      )
    } catch (error) {
      console.error('❌ Failed to get AI response after edit: ', error)

      // Create error message for edit failures
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

      // Add error message to store and sync to database
      addMessage(chatId, errorMessage)
      syncMessage(errorMessage)

      // Update local state
      setMessages((prev) => [...prev, errorMessage])

      setIsStreaming(false)
      setStreamingMessage('')
    }
  }

  const handleRetry = async (messageIndex: number, modelId?: ModelsIds) => {
    if (isStreaming || !chatId) return

    const targetMessage = messages[messageIndex]
    if (!targetMessage) return

    // Only allow retry if user is the owner or it's not a shared chat
    if (isSharedChat && !isOwner) {
      console.warn('Cannot retry messages in shared chats that you do not own')
      return
    }

    // Determine which model to use for retry
    const retryModelId = modelId || (targetMessage.modelId as ModelsIds) || selectedModelId

    // Update the timestamp of the message being retried
    const updatedTargetMessage: MessageType = {
      ...targetMessage,
      createdAt: new Date(),
    }
    // Replace the message with updated timestamp
    replaceMessage(chatId, messageIndex, updatedTargetMessage)
    syncMessage(updatedTargetMessage)

    // Update local state to reflect the timestamp change
    setMessages(getMessages(chatId))

    // If retrying a user message, we need to regenerate the assistant response
    // If retrying an assistant message, we just regenerate that message
    if (targetMessage.role === 'user') {
      // Find the next assistant message (if any) and remove everything from that point
      const nextAssistantIndex = messages.findIndex((msg, idx) => idx > messageIndex && msg.role === 'assistant')
      if (nextAssistantIndex !== -1) {
        removeMessagesFromIndex(chatId, nextAssistantIndex)
        await deleteMessagesFromIndex(chatId, nextAssistantIndex)
        setMessages(getMessages(chatId))
      }

      // Get all messages up to and including the user message for context
      const contextMessages = messages.slice(0, messageIndex + 1).map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))

      setIsStreaming(true)
      setStreamingMessage('')

      await createStreamingChatCompletion(
        contextMessages,
        retryModelId,
        (chunk) => {
          if (chunk.type === 'chunk' && chunk.content) {
            setStreamingMessage((prev) => prev + chunk.content)
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

          // Update chat timestamp
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

          // Create error message for retry failures
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

          // Add error message to store and sync to database
          addMessage(chatId, errorMessage)
          syncMessage(errorMessage)

          // Update local state from store
          setMessages(getMessages(chatId))

          setStreamingMessage('')
          setIsStreaming(false)
        }
      )
    } else if (targetMessage.role === 'assistant') {
      // Remove all messages from the assistant message index onwards
      removeMessagesFromIndex(chatId, messageIndex)
      await deleteMessagesFromIndex(chatId, messageIndex)
      setMessages(getMessages(chatId))

      // Get all messages up to (but not including) the assistant message for context
      const contextMessages = messages.slice(0, messageIndex).map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }))

      setIsStreaming(true)
      setStreamingMessage('')

      await createStreamingChatCompletion(
        contextMessages,
        retryModelId,
        (chunk) => {
          if (chunk.type === 'chunk' && chunk.content) {
            setStreamingMessage((prev) => prev + chunk.content)
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

          // Update chat timestamp
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

          // Create error message for assistant message retry failures
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

          // Add error message to store and sync to database
          addMessage(chatId, errorMessage)
          syncMessage(errorMessage)

          // Update local state from store
          setMessages(getMessages(chatId))

          setStreamingMessage('')
          setIsStreaming(false)
        }
      )
    }
  }

  return (
    <div className='relative flex w-full flex-col items-center bg-accent px-6 sm:px-20'>
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
        className='scrollbar-hide w-full max-w-[768px] flex-1 space-y-10 overflow-y-auto overscroll-contain [&:not(*:is(@supports(-moz-appearance:none)))]:py-36 sm:[&:not(*:is(@supports(-moz-appearance:none)))]:py-38 [@supports(-moz-appearance:none)]:py-42 sm:[@supports(-moz-appearance:none)]:py-44'
      >
        {messages.length === 0 && !isStreaming ? (
          <div className='flex items-center justify-center pb-4 sm:h-full sm:pb-0'>
            <EmptyState onSuggestionClickAction={handleSuggestionClick} />
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
                <Message
                  message={msg}
                  messageIndex={index}
                  isStreaming={isStreaming}
                  onRetry={handleRetry}
                  onEdit={handleEdit}
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

      <div className='-translate-x-1/2 absolute bottom-0 left-1/2 flex w-full max-w-[calc(100%-2rem)] flex-col gap-2 rounded-t-xl border-6 border-zinc-600/5 border-b-0 bg-border/80 pt-2 pr-2 pb-4 pl-1 shadow-2xl backdrop-blur-sm sm:max-w-[800px] dark:border-background/10 dark:bg-zinc-700/80'>
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
                  // Allow new line when Shift+Enter is pressed
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
