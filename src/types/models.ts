export type ModelsIds =
  // Free models
  | 'google/gemini-2.0-flash-exp:free'
  | 'google/gemma-3-27b-it:free'
  | 'deepseek/deepseek-chat-v3-0324:free'
  | 'deepseek/deepseek-r1-0528:free'
  | 'meta-llama/llama-4-maverick:free'
  | 'meta-llama/llama-4-scout:free'
  | 'meta-llama/llama-3.3-70b-instruct:free'
  | 'qwen/qwen3-32b:free'
  | 'qwen/qwen2.5-vl-72b-instruct:free'
  | 'qwen/qwen-2.5-coder-32b-instruct:free'
  // BYOK models
  | 'google/gemini-2.5-pro:byok'
  | 'google/gemini-2.5-flash:byok'
  | 'google/gemini-2.5-flash-lite:byok'
  | 'google/gemini-2.0-flash:byok'
  | 'google/gemini-2.0-flash-lite:byok'
  | 'openai/gpt-4o:byok'
  | 'openai/gpt-4o-mini:byok'
  | 'openai/gpt-4.1:byok'
  | 'openai/gpt-4.1-mini:byok'
  | 'openai/gpt-4.1-nano:byok'
  | 'openai/o4-mini:byok'
  | 'openai/o3-mini:byok'
  | 'openai/o3:byok'
  | 'openai/o3-pro:byok'
  | 'openai/gpt-4.5:byok'
  | 'anthropic/claude-4-sonnet:byok'
  | 'anthropic/claude-3.5-sonnet:byok'
  | 'anthropic/claude-3.7-sonnet:byok'
  | 'anthropic/claude-4-opus:byok'

export type ModelsNames =
  // Free models
  | 'Gemini 2.0 Flash Experimental'
  | 'Gemma 3 27B'
  | 'DeepSeek V3 0324'
  | 'DeepSeek R1 0528'
  | 'Llama 4 Maverick'
  | 'Llama 4 Scout'
  | 'Llama 3.3 70B Instruct'
  | 'Qwen3 32B'
  | 'Qwen2.5 VL 72B Instruct'
  | 'Qwen2.5 Coder 32B Instruct'
  // BYOK models
  | 'Gemini 2.5 Pro'
  | 'Gemini 2.5 Flash'
  | 'Gemini 2.5 Flash Lite'
  | 'Gemini 2.0 Flash'
  | 'Gemini 2.0 Flash Lite'
  | 'GPT 4o'
  | 'GPT 4o-mini'
  | 'GPT 4.1'
  | 'GPT 4.1 Mini'
  | 'GPT 4.1 Nano'
  | 'o4 mini'
  | 'o3 mini'
  | 'o3'
  | 'o3 Pro'
  | 'GPT 4.5'
  | 'Claude 4 Sonnet'
  | 'Claude 3.5 Sonnet'
  | 'Claude 3.7 Sonnet'
  | 'Claude 4 Opus'
  | 'Grok 3'
  | 'Grok 3 Mini'

export type ModelsDevelopers = 'Google' | 'DeepSeek' | 'Meta' | 'Qwen' | 'OpenAI' | 'Anthropic'

export type Model = {
  id: ModelsIds
  name: ModelsNames
  developer: ModelsDevelopers
  description: string
  isFree: boolean
}

export const MODELS: Model[] = [
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash Experimental',
    developer: 'Google',
    description:
      'Gemini Flash 2.0 offers a significantly faster time to first token (TTFT) compared to Gemini Flash 1.5, while maintaining quality on par with larger models like Gemini Pro 1.5. It introduces notable enhancements in multimodal understanding, coding capabilities, complex instruction following, and function calling. These advancements come together to deliver more seamless and robust agentic experiences.',
    isFree: true,
  },
  {
    id: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B',
    developer: 'Google',
    description:
      "Gemma 3 introduces multimodality, supporting vision-language input and text outputs. It handles context windows up to 128k tokens, understands over 140 languages, and offers improved math, reasoning, and chat capabilities, including structured outputs and function calling. Gemma 3 27B is Google's latest open source model, successor to Gemma 2.",
    isFree: true,
  },
  {
    id: 'deepseek/deepseek-chat-v3-0324:free',
    name: 'DeepSeek V3 0324',
    developer: 'DeepSeek',
    description:
      'DeepSeek V3, a 685B-parameter, mixture-of-experts model, is the latest iteration of the flagship chat model family from the DeepSeek team. It succeeds the DeepSeek V3 model and performs really well on a variety of tasks.',
    isFree: true,
  },
  {
    id: 'deepseek/deepseek-r1-0528:free',
    name: 'DeepSeek R1 0528',
    developer: 'DeepSeek',
    description:
      "May 28th update to the original DeepSeek R1 Performance on par with OpenAI o1, but open-sourced and with fully open reasoning tokens. It's 671B parameters in size, with 37B active in an inference pass.",
    isFree: true,
  },
  {
    id: 'meta-llama/llama-4-maverick:free',
    name: 'Llama 4 Maverick',
    developer: 'Meta',
    description:
      'Llama 4 Maverick 17B Instruct (128E) is a high-capacity multimodal language model from Meta, built on a mixture-of-experts (MoE) architecture with 128 experts and 17 billion active parameters per forward pass (400B total). It supports multilingual text and image input, and produces multilingual text and code output across 12 supported languages. Optimized for vision-language tasks, Maverick is instruction-tuned for assistant-like behavior, image reasoning, and general-purpose multimodal interaction.',
    isFree: true,
  },
  {
    id: 'meta-llama/llama-4-scout:free',
    name: 'Llama 4 Scout',
    developer: 'Meta',
    description:
      'Llama 4 Scout 17B Instruct (16E) is a mixture-of-experts (MoE) language model developed by Meta, activating 17 billion parameters out of a total of 109B. It supports native multimodal input (text and image) and multilingual output (text and code) across 12 supported languages. Designed for assistant-style interaction and visual reasoning, Scout uses 16 experts per forward pass and features a context length of 10 million tokens, with a training corpus of ~40 trillion tokens.',
    isFree: true,
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B Instruct',
    developer: 'Meta',
    description:
      'The Meta Llama 3.3 multilingual large language model (LLM) is a pre-trained and instruction tuned generative model in 70B (text in/text out). The Llama 3.3 instruction tuned text only model is optimized for multilingual dialogue use cases and outperforms many of the available open source and closed chat models on common industry benchmarks.',
    isFree: true,
  },
  {
    id: 'qwen/qwen3-32b:free',
    name: 'Qwen3 32B',
    developer: 'Qwen',
    description:
      'Qwen3-32B is a dense 32.8B parameter causal language model from the Qwen3 series, optimized for both complex reasoning and efficient dialogue. It supports seamless switching between a "thinking" mode for tasks like math, coding, and logical inference, and a "non-thinking" mode for faster, general-purpose conversation.',
    isFree: true,
  },
  {
    id: 'qwen/qwen2.5-vl-72b-instruct:free',
    name: 'Qwen2.5 VL 72B Instruct',
    developer: 'Qwen',
    description:
      'Qwen2.5-VL is proficient in recognizing common objects such as flowers, birds, fish, and insects. It is also highly capable of analyzing texts, charts, icons, graphics, and layouts within images.',
    isFree: true,
  },
  {
    id: 'qwen/qwen-2.5-coder-32b-instruct:free',
    name: 'Qwen2.5 Coder 32B Instruct',
    developer: 'Qwen',
    description:
      'Qwen2.5-Coder is the latest series of Code-Specific Qwen large language models (formerly known as CodeQwen).',
    isFree: true,
  },
  // BYOK models
  {
    id: 'google/gemini-2.5-pro:byok',
    name: 'Gemini 2.5 Pro',
    developer: 'Google',
    description: 'TODO: add description',
    isFree: false,
  },
  {
    id: 'google/gemini-2.5-flash:byok',
    name: 'Gemini 2.5 Flash',
    developer: 'Google',
    description: 'TODO: add description',
    isFree: false,
  },
  {
    id: 'google/gemini-2.5-flash-lite:byok',
    name: 'Gemini 2.5 Flash Lite',
    developer: 'Google',
    description: 'TODO: add description',
    isFree: false,
  },
  {
    id: 'google/gemini-2.0-flash:byok',
    name: 'Gemini 2.0 Flash',
    developer: 'Google',
    description: 'TODO: add description',
    isFree: false,
  },
  {
    id: 'google/gemini-2.0-flash-lite:byok',
    name: 'Gemini 2.0 Flash Lite',
    developer: 'Google',
    description: 'TODO: add description',
    isFree: false,
  },
  {
    id: 'openai/gpt-4o:byok',
    name: 'GPT 4o',
    developer: 'OpenAI',
    description: 'TODO: add description',
    isFree: false,
  },
  {
    id: 'openai/gpt-4o-mini:byok',
    name: 'GPT 4o-mini',
    developer: 'OpenAI',
    description: 'TODO: add description',
    isFree: false,
  },
  {
    id: 'openai/gpt-4.1:byok',
    name: 'GPT 4.1',
    developer: 'OpenAI',
    description: 'TODO: add description',
    isFree: false,
  },
  {
    id: 'openai/gpt-4.1-mini:byok',
    name: 'GPT 4.1 Mini',
    developer: 'OpenAI',
    description: 'TODO: add description',
    isFree: false,
  },
  {
    id: 'openai/gpt-4.1-nano:byok',
    name: 'GPT 4.1 Nano',
    developer: 'OpenAI',
    description: 'TODO: add description',
    isFree: false,
  },
  {
    id: 'openai/o4-mini:byok',
    name: 'o4 mini',
    developer: 'OpenAI',
    description: 'TODO: add description',
    isFree: false,
  },
  {
    id: 'openai/o3-mini:byok',
    name: 'o3 mini',
    developer: 'OpenAI',
    description: 'TODO: add description',
    isFree: false,
  },
  {
    id: 'openai/o3:byok',
    name: 'o3',
    developer: 'OpenAI',
    description: 'TODO: add description',
    isFree: false,
  },
  {
    id: 'openai/o3-pro:byok',
    name: 'o3 Pro',
    developer: 'OpenAI',
    description: 'TODO: add description',
    isFree: false,
  },
  {
    id: 'openai/gpt-4.5:byok',
    name: 'GPT 4.5',
    developer: 'OpenAI',
    description: 'TODO: add description',
    isFree: false,
  },
  {
    id: 'anthropic/claude-4-sonnet:byok',
    name: 'Claude 4 Sonnet',
    developer: 'Anthropic',
    description: 'TODO: add description',
    isFree: false,
  },
  {
    id: 'anthropic/claude-3.5-sonnet:byok',
    name: 'Claude 3.5 Sonnet',
    developer: 'Anthropic',
    description: 'TODO: add description',
    isFree: false,
  },
  {
    id: 'anthropic/claude-3.7-sonnet:byok',
    name: 'Claude 3.7 Sonnet',
    developer: 'Anthropic',
    description: 'TODO: add description',
    isFree: false,
  },
  {
    id: 'anthropic/claude-4-opus:byok',
    name: 'Claude 4 Opus',
    developer: 'Anthropic',
    description: 'TODO: add description',
    isFree: false,
  },
]
