import type { ModelsIds, ModelsNames } from '~/types/models'

export const getModelName = (modelId: ModelsIds): ModelsNames => {
  const modelNames: Record<ModelsIds, ModelsNames> = {
    'google/gemini-2.0-flash-exp:free': 'Gemini 2.0 Flash Experimental',
    'google/gemma-3-27b-it:free': 'Gemma 3 27B',
    'deepseek/deepseek-chat-v3-0324:free': 'DeepSeek V3 0324',
    'deepseek/deepseek-r1-0528:free': 'R1 0528',
  }

  return modelNames[modelId] || modelId
}
