export const MODEL_IDS = [
  'google/gemini-2.0-flash-exp:free',
  'google/gemma-3-27b-it:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'deepseek/deepseek-r1-0528:free',
  'tngtech/deepseek-r1t-chimera:free',
  'mistralai/devstral-small:free',
] as const

export type ModelsIds =
  | 'google/gemini-2.0-flash-exp:free'
  | 'google/gemma-3-27b-it:free'
  | 'deepseek/deepseek-chat-v3-0324:free'
  | 'deepseek/deepseek-r1-0528:free'
  | 'tngtech/deepseek-r1t-chimera:free'
  | 'mistralai/devstral-small:free'

export type ModelsNames =
  | 'Gemini 2.0 Flash Experimental'
  | 'Gemma 3 27B'
  | 'DeepSeek V3 0324'
  | 'R1 0528'
  | 'DeepSeek R1T Chimera'
  | 'Devstral Small'

export type ModelsDevelopers = 'Google' | 'DeepSeek'

export type Model = {
  id: ModelsIds
  name: ModelsNames
  developer: ModelsDevelopers
  description: string
}
