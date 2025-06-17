'use client'
import { useState } from 'react'

import { Check, ChevronsUpDown, Info, Sparkles } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '~/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'

import { useChatStore } from '~/stores/useChatStore'

import { cn } from '~/lib/utils'
import { getDeveloperIcon } from '~/utils/get-developer-icon'
import { getModelName } from '~/utils/get-model-name'

import { MODELS, type ModelsIds } from '~/types/models'

export const ModelSelector = () => {
  const [open, setOpen] = useState(false)
  const selectedModelId = useChatStore((state) => state.selectedModelId)
  const setSelectedModelId = useChatStore((state) => state.setSelectedModelId)

  const selectedModel = MODELS.find((model) => model.id === selectedModelId)

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

            <span className='truncate'>{selectedModel ? selectedModel.name : getModelName(selectedModelId)}</span>
          </div>

          <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>

      <PopoverContent side='top' onOpenAutoFocus={(e) => e.preventDefault()} className='p-1'>
        <Command>
          <CommandInput placeholder='Search models...' />

          <CommandList className='max-h-full'>
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
                  className='flex items-center justify-between py-0 transition-all ease-in sm:space-y-1 sm:px-3 sm:py-2'
                >
                  <div className='flex items-center space-x-2'>
                    {getDeveloperIcon(model.developer)}

                    <span className='whitespace-nowrap font-medium text-muted-foreground text-xs'>{model.name}</span>

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
                      'size-4 shrink-0 text-primary transition-all ease-in',
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
