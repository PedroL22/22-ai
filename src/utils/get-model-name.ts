import type { ModelsIds, ModelsNames } from '~/types/models'

export const getModelName = (modelId: ModelsIds): ModelsNames => {
  const modelNames: Record<ModelsIds, ModelsNames> = {
    'google/gemini-2.0-flash-exp:free': 'Gemini 2.0 Flash Experimental',
    'google/gemma-3-27b-it:free': 'Gemma 3 27B',
    'deepseek/deepseek-chat-v3-0324:free': 'DeepSeek V3 0324',
    'deepseek/deepseek-r1-0528:free': 'DeepSeek R1 0528',
    'meta-llama/llama-4-maverick:free': 'Llama 4 Maverick',
    'meta-llama/llama-4-scout:free': 'Llama 4 Scout',
    'meta-llama/llama-3.3-70b-instruct:free': 'Llama 3.3 70B Instruct',
    'qwen/qwen3-32b:free': 'Qwen3 32B',
    'qwen/qwen2.5-vl-72b-instruct:free': 'Qwen2.5 VL 72B Instruct',
    'qwen/qwen-2.5-coder-32b-instruct:free': 'Qwen2.5 Coder 32B Instruct',
  }

  return modelNames[modelId] || modelId
}
