import { motion } from 'motion/react'

import { Code, Lightbulb, MessageSquare, Sparkles } from 'lucide-react'

interface EmptyStateProps {
  onSuggestionClickAction: (suggestion: string) => void
}

const suggestions = [
  {
    icon: <Sparkles className='size-4' />,
    title: 'Generate ideas',
    prompt: 'Help me brainstorm creative ideas for a new project',
  },
  {
    icon: <Code className='size-4' />,
    title: 'Code assistance',
    prompt: 'Help me debug this code or explain a programming concept',
  },
  {
    icon: <MessageSquare className='size-4' />,
    title: 'Write content',
    prompt: 'Help me write a professional email or document',
  },
  {
    icon: <Lightbulb className='size-4' />,
    title: 'Learn something',
    prompt: 'Explain a complex topic in simple terms',
  },
]

export const EmptyState = ({ onSuggestionClickAction }: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className='flex w-full max-w-3xl flex-col items-center justify-center space-y-8'
    >
      <div className='flex flex-col items-center space-y-4 text-center'>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className='relative'
        >
          <div className='rounded-full bg-gradient-to-br from-blue-500 to-[#7c3aed] p-4 shadow-lg dark:to-[#8b5cf6]'>
            <Sparkles className='size-8 text-white' />
          </div>

          <div className='-inset-2 absolute rounded-full bg-gradient-to-br from-blue-500/20 to-[#7c3aed]/20 blur-lg dark:to-[#8b5cf6]/20' />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className='space-y-2'
        >
          <h1 className='font-bold text-2xl text-foreground md:text-3xl'>Welcome to 22AI</h1>

          <p className='text-muted-foreground text-sm md:text-base'>
            Your intelligent AI assistant is ready to help. What would you like to explore today?
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className='grid w-full max-w-2xl grid-cols-1 gap-3 md:grid-cols-2'
      >
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={suggestion.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 + index * 0.1 }}
            className='group relative flex items-start space-x-3 rounded-xl border border-border/50 bg-card/50 p-4 text-left backdrop-blur-sm transition-all duration-200 hover:border-border hover:bg-card hover:shadow-md'
            onClick={() => onSuggestionClickAction(suggestion.prompt)}
          >
            <div className='flex-shrink-0 rounded-lg bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary/20'>
              {suggestion.icon}
            </div>

            <div className='min-w-0 flex-1'>
              <h3 className='font-medium text-foreground text-sm transition-colors group-hover:text-primary'>
                {suggestion.title}
              </h3>

              <p className='mt-1 line-clamp-2 text-muted-foreground text-xs'>{suggestion.prompt}</p>
            </div>

            <div className='absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-[#7c3aed]/5 opacity-0 transition-opacity group-hover:opacity-100 dark:to-[#8b5cf6]/5' />
          </motion.button>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className='text-center'
      >
        <p className='text-muted-foreground text-xs'>
          💡 Tip: Press <kbd className='rounded bg-muted px-1.5 py-0.5 font-mono text-xs'>Enter</kbd> to send,
          <kbd className='ml-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs'>Shift + Enter</kbd> for new line
        </p>
      </motion.div>
    </motion.div>
  )
}
