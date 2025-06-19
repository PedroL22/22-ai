'use client'
import { useEffect, useState } from 'react'

import { Check, ChevronsUpDown, Info, Sparkles } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Command, CommandItem, CommandList } from '~/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { useApiKeyStore } from '~/stores/useApiKeyStore'
import { useChatStore } from '~/stores/useChatStore'

import { cn } from '~/lib/utils'
import { getDeveloperIcon } from '~/utils/get-developer-icon'
import { getModelName } from '~/utils/get-model-name'

import { MODELS, type ModelsDevelopers, type ModelsIds } from '~/types/models'

export const ModelSelector = () => {
  const [activeDeveloper, setActiveDeveloper] = useState<ModelsDevelopers | null>(null)
  const openaiApiKey = useApiKeyStore((s) => s.openaiApiKey)
  const geminiApiKey = useApiKeyStore((s) => s.geminiApiKey)
  const anthropicApiKey = useApiKeyStore((s) => s.anthropicApiKey)

  const isModelBlocked = (model: (typeof MODELS)[number]): boolean => {
    if (model.isFree) return false
    if (model.developer === 'OpenAI') return !openaiApiKey
    if (model.developer === 'Google') return !geminiApiKey
    if (model.developer === 'Anthropic') return !anthropicApiKey
    return false
  }

  const [open, setOpen] = useState(false)
  const selectedModelId = useChatStore((state) => state.selectedModelId)
  const setSelectedModelId = useChatStore((state) => state.setSelectedModelId)

  const selectedModel = MODELS.find((model) => model.id === selectedModelId)

  // Group models by developer
  const groupedModels = MODELS.reduce<Record<string, typeof MODELS>>((acc, model) => {
    if (!acc[model.developer]) {
      acc[model.developer] = []
    }
    acc[model.developer]!.push(model)
    return acc
  }, {})

  // List of developers in desired order (always visible)
  const developerOrder: ModelsDevelopers[] = ['Google', 'OpenAI', 'Anthropic', 'Meta', 'DeepSeek', 'Qwen']

  const getBlockReason = (model: (typeof MODELS)[number]) => {
    if (model.developer === 'OpenAI') return 'Add your OpenAI API key in Settings to use this model.'
    if (model.developer === 'Google') return 'Add your Gemini API key in Settings to use this model.'
    if (model.developer === 'Anthropic') return 'Add your Anthropic API key in Settings to use this model.'
    return 'API key required.'
  }

  // When opening, default to selected model's developer
  useEffect(() => {
    if (open && selectedModel) setActiveDeveloper(selectedModel.developer)
  }, [open, selectedModel])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          aria-expanded={open}
          className='mx-1 justify-between self-start rounded-sm border-0 bg-transparent px-2 py-1 text-muted-foreground text-sm shadow-none transition-all ease-in hover:bg-muted/50 hover:text-muted-foreground'
        >
          <div className='flex items-center gap-2'>
            {selectedModel ? getDeveloperIcon(selectedModel.developer) : <Sparkles className='size-3' />}
            <span className='truncate'>
              {selectedModel ? <>{selectedModel.name}</> : <>{getModelName(selectedModelId)}</>}
            </span>

            <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side='top'
        onOpenAutoFocus={(e) => e.preventDefault()}
        className='min-w-[375px] overflow-hidden rounded-2xl border-none p-0 shadow-2xl sm:min-w-[480px]'
      >
        <div className='flex h-[435px] w-full'>
          {/* Developers list */}
          <div className='flex w-40 shrink-0 flex-col border-muted/30 border-r bg-gradient-to-b from-muted/5 to-muted/20 py-3'>
            <div className='px-4 pb-3'>
              <div className='font-semibold text-foreground text-sm'>AI Providers</div>
              <p className='text-muted-foreground text-xs'>Choose your model provider</p>
            </div>

            <div className='space-y-1 px-2'>
              {developerOrder.map((developer) => {
                const devModels = groupedModels[developer] || []
                const devBlocked = devModels.every((m) => isModelBlocked(m))
                const modelCount = devModels.length

                return (
                  <Tooltip key={developer}>
                    <TooltipTrigger asChild>
                      <button
                        disabled={devBlocked}
                        onClick={() => {
                          if (!devBlocked) setActiveDeveloper(developer)
                        }}
                        type='button'
                        className={cn(
                          'flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-all ease-in',
                          devBlocked
                            ? 'cursor-not-allowed text-muted-foreground opacity-40'
                            : activeDeveloper === developer
                              ? 'border border-primary/20 bg-primary/10 font-semibold text-primary shadow-sm'
                              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                        )}
                      >
                        <div className='flex items-center gap-2'>
                          {getDeveloperIcon(developer)}

                          <div className='flex flex-col'>
                            <span className='font-medium text-sm'>{developer}</span>

                            <span className='text-[10px] text-muted-foreground'>
                              {modelCount} model{modelCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </button>
                    </TooltipTrigger>

                    {devBlocked && (
                      <TooltipContent>
                        <span>Add your {developer} API key in Settings to use these models.</span>
                      </TooltipContent>
                    )}
                  </Tooltip>
                )
              })}
            </div>
          </div>

          {/* Models for selected company */}
          <div className='flex h-full flex-1 rounded-none p-3'>
            <Command>
              <CommandList className='scrollbar-hide max-h-full'>
                {activeDeveloper &&
                Array.isArray(groupedModels[activeDeveloper]) &&
                groupedModels[activeDeveloper].length > 0 ? (
                  <>
                    <div className='sticky top-0 z-10 bg-[#fffcfc] px-1 pb-4 backdrop-blur-sm dark:bg-[#18181b]'>
                      <div className='flex items-center gap-2 font-semibold text-foreground text-lg'>
                        {getDeveloperIcon(activeDeveloper)}
                        {activeDeveloper} Models
                      </div>

                      <p className='text-muted-foreground text-sm'>
                        Choose from {groupedModels[activeDeveloper].length} available models
                      </p>
                    </div>

                    <div className='h-full space-y-2 overflow-y-auto'>
                      {groupedModels[activeDeveloper].map((model) => {
                        const blocked = isModelBlocked(model)
                        const isSelected = selectedModelId === model.id

                        return (
                          <Tooltip key={model.id}>
                            <TooltipTrigger asChild>
                              <div>
                                <CommandItem
                                  value={model.id}
                                  onSelect={() => {
                                    if (!blocked) {
                                      setSelectedModelId(model.id as ModelsIds)
                                      setOpen(false)
                                    }
                                  }}
                                  className={cn(
                                    'flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-all ease-in',
                                    blocked
                                      ? 'pointer-events-none border-transparent opacity-40'
                                      : isSelected
                                        ? 'border-primary/30 bg-primary/10 font-medium text-primary shadow-sm'
                                        : 'border-transparent hover:border-muted hover:bg-muted/50'
                                  )}
                                  disabled={blocked}
                                >
                                  <div className='flex items-center space-x-3'>
                                    {getDeveloperIcon(model.developer)}

                                    <div className='flex flex-col space-y-1.5'>
                                      <span className='font-medium text-sm'>{model.name}</span>

                                      <div className='flex items-center gap-2'>
                                        <span
                                          className={cn(
                                            'rounded-md px-1.5 py-0.5 font-semibold text-[10px] uppercase tracking-wide',
                                            model.isFree
                                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                          )}
                                        >
                                          {model.isFree ? 'Free' : 'BYOK'}
                                        </span>

                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className='pointer-events-auto inline-flex'>
                                              <Info className='size-3 text-muted-foreground transition-colors hover:text-foreground' />
                                            </span>
                                          </TooltipTrigger>

                                          <TooltipContent className='max-w-[300px]'>{model.description}</TooltipContent>
                                        </Tooltip>
                                      </div>
                                    </div>
                                  </div>

                                  <Check
                                    className={cn(
                                      'hidden size-5 shrink-0 text-primary transition-all ease-in md:inline-flex',
                                      isSelected ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                </CommandItem>
                              </div>
                            </TooltipTrigger>

                            {blocked && (
                              <TooltipContent>
                                <span>{getBlockReason(model)}</span>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div className='flex h-full flex-col items-center justify-center p-8 text-center'>
                    <Sparkles className='mb-4 size-12 text-muted-foreground/50' />

                    <div className='mb-2 font-medium text-foreground'>Select a Provider</div>

                    <p className='max-w-xs text-muted-foreground text-sm'>
                      Choose an AI provider from the sidebar to view available models and start chatting.
                    </p>
                  </div>
                )}
              </CommandList>
            </Command>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
