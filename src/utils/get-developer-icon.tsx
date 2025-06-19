import Image from 'next/image'

import { Sparkles } from 'lucide-react'

import type { ModelsDevelopers } from '~/types/models'

export const getDeveloperIcon = (developer: ModelsDevelopers) => {
  switch (developer) {
    case 'Google':
      return <Image src='/images/icons/gemini.svg' alt='Gemini Logo' width={16} height={16} className='size-4' />
    case 'OpenAI':
      return <Image src='/images/icons/openai.svg' alt='OpenAI Logo' width={16} height={16} className='size-4' />
    case 'Anthropic':
      return <Image src='/images/icons/anthropic.svg' alt='Anthropic Logo' width={16} height={16} className='size-4' />
    case 'Meta':
      return <Image src='/images/icons/meta.svg' alt='Meta Logo' width={16} height={16} className='size-4' />
    case 'Grok':
      return <Image src='/images/icons/grok.svg' alt='Grok Logo' width={16} height={16} className='size-4' />
    case 'DeepSeek':
      return <Image src='/images/icons/deepseek.svg' alt='DeepSeek Logo' width={16} height={16} className='size-4' />
    case 'Qwen':
      return <Image src='/images/icons/qwen.svg' alt='Qwen Logo' width={16} height={16} className='size-4' />

    default:
      return <Sparkles className='size-4 text-zinc-400' />
  }
}
