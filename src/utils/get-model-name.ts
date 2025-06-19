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
    'google/gemini-2.5-pro:byok': 'Gemini 2.5 Pro',
    'google/gemini-2.5-flash:byok': 'Gemini 2.5 Flash',
    'google/gemini-2.5-flash-lite:byok': 'Gemini 2.5 Flash Lite',
    'google/gemini-2.0-flash:byok': 'Gemini 2.0 Flash',
    'google/gemini-2.0-flash-lite:byok': 'Gemini 2.0 Flash Lite',
    'openai/gpt-4o:byok': 'GPT 4o',
    'openai/gpt-4o-mini:byok': 'GPT 4o-mini',
    'openai/gpt-4.1:byok': 'GPT 4.1',
    'openai/gpt-4.1-mini:byok': 'GPT 4.1 Mini',
    'openai/gpt-4.1-nano:byok': 'GPT 4.1 Nano',
    'openai/o4-mini:byok': 'o4 mini',
    'openai/o3-mini:byok': 'o3 mini',
    'openai/o3:byok': 'o3',
    'openai/o3-pro:byok': 'o3 Pro',
    'openai/gpt-4.5:byok': 'GPT 4.5',
    'anthropic/claude-4-sonnet:byok': 'Claude 4 Sonnet',
    'anthropic/claude-3.5-sonnet:byok': 'Claude 3.5 Sonnet',
    'anthropic/claude-3.7-sonnet:byok': 'Claude 3.7 Sonnet',
    'anthropic/claude-4-opus:byok': 'Claude 4 Opus',
  }

  return modelNames[modelId] || modelId
}
