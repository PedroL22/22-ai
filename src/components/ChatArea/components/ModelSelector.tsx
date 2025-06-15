'use client'

import Image from 'next/image'
import { useState } from 'react'

import { Check, ChevronsUpDown, Info, Sparkles } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '~/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'

import { useChatStore } from '~/stores/useChatStore'

import { cn } from '~/lib/utils'
import { getModelName } from '~/utils/get-model-name'

import { MODELS, type ModelsDevelopers, type ModelsIds } from '~/types/models'

export const ModelSelector = () => {
  const [open, setOpen] = useState(false)
  const selectedModelId = useChatStore((state) => state.selectedModelId)
  const setSelectedModelId = useChatStore((state) => state.setSelectedModelId)

  const selectedModel = MODELS.find((model) => model.id === selectedModelId)

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          aria-expanded={open}
          className='mx-1 justify-between self-start rounded-sm border-0 bg-transparent px-2 py-1 text-muted-foreground text-sm shadow-none transition-all ease-in hover:bg-muted/50 hover:text-muted-foreground'
        >
          <div className='flex items-center gap-2'>
            {selectedModel ? developerIcon(selectedModel.developer) : <Sparkles className='size-3' />}

            <span className='truncate'>{selectedModel ? selectedModel.name : getModelName(selectedModelId)}</span>
          </div>

          <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-[300px] px-1 py-1'>
        <Command>
          <CommandInput placeholder='Search models...' />

          <CommandList className='scrollbar-hide'>
            <CommandEmpty>No models found.</CommandEmpty>

            <CommandGroup>
              {MODELS.map((model) => (
                <CommandItem
                  key={model.id}
                  value={model.id}
                  onSelect={(currentValue) => {
                    setSelectedModelId(currentValue as ModelsIds)
                    setOpen(false)
                  }}
                  className='flex items-center justify-between space-y-1 px-3 py-2 transition-all ease-in'
                >
                  <div className='flex items-center space-x-2'>
                    {developerIcon(model.developer)}

                    <span className='font-medium text-muted-foreground text-xs'>{model.name}</span>

                    <Tooltip>
                      <TooltipTrigger className='cursor-pointer '>
                        <Info className='size-3' />
                      </TooltipTrigger>

                      <TooltipContent>
                        <p className='max-w-[300px]'>{model.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <Check
                    className={cn(
                      'size-4 text-primary transition-all ease-in',
                      selectedModelId === model.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
