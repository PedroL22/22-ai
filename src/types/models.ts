export type ModelsIds =
  | 'google/gemini-2.0-flash-exp:free'
  | 'google/gemma-3-27b-it:free'
  | 'deepseek/deepseek-chat-v3-0324:free'
  | 'deepseek/deepseek-r1-0528:free'
  | 'meta-llama/llama-4-maverick:free'
  | 'meta-llama/llama-4-scout:free'
  | 'meta-llama/llama-3.3-70b-instruct:free'

export type ModelsNames =
  | 'Gemini 2.0 Flash Experimental'
  | 'Gemma 3 27B'
  | 'DeepSeek V3 0324'
  | 'R1 0528'
  | 'Llama 4 Maverick'
  | 'Llama 4 Scout'
  | 'Llama 3.3 70B Instruct'

export type ModelsDevelopers = 'Google' | 'DeepSeek' | 'Meta'

export type Model = {
  id: ModelsIds
  name: ModelsNames
  developer: ModelsDevelopers
  description: string
}

export const MODELS: Model[] = [
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash Experimental',
    developer: 'Google',
    description:
      'Gemini Flash 2.0 offers a significantly faster time to first token (TTFT) compared to Gemini Flash 1.5, while maintaining quality on par with larger models like Gemini Pro 1.5. It introduces notable enhancements in multimodal understanding, coding capabilities, complex instruction following, and function calling. These advancements come together to deliver more seamless and robust agentic experiences.',
  },
  {
    id: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B',
    developer: 'Google',
    description:
      "Gemma 3 introduces multimodality, supporting vision-language input and text outputs. It handles context windows up to 128k tokens, understands over 140 languages, and offers improved math, reasoning, and chat capabilities, including structured outputs and function calling. Gemma 3 27B is Google's latest open source model, successor to Gemma 2.",
  },
  {
    id: 'deepseek/deepseek-chat-v3-0324:free',
    name: 'DeepSeek V3 0324',
    developer: 'DeepSeek',
    description:
      'DeepSeek V3, a 685B-parameter, mixture-of-experts model, is the latest iteration of the flagship chat model family from the DeepSeek team. It succeeds the DeepSeek V3 model and performs really well on a variety of tasks.',
  },
  {
    id: 'deepseek/deepseek-r1-0528:free',
    name: 'R1 0528',
    developer: 'DeepSeek',
    description:
      "May 28th update to the original DeepSeek R1 Performance on par with OpenAI o1, but open-sourced and with fully open reasoning tokens. It's 671B parameters in size, with 37B active in an inference pass.",
  },
  {
    id: 'meta-llama/llama-4-maverick:free',
    name: 'Llama 4 Maverick',
    developer: 'Meta',
    description:
      'Llama 4 Maverick 17B Instruct (128E) is a high-capacity multimodal language model from Meta, built on a mixture-of-experts (MoE) architecture with 128 experts and 17 billion active parameters per forward pass (400B total). It supports multilingual text and image input, and produces multilingual text and code output across 12 supported languages. Optimized for vision-language tasks, Maverick is instruction-tuned for assistant-like behavior, image reasoning, and general-purpose multimodal interaction.',
  },
  {
    id: 'meta-llama/llama-4-scout:free',
    name: 'Llama 4 Scout',
    developer: 'Meta',
    description:
      'Llama 4 Scout 17B Instruct (16E) is a mixture-of-experts (MoE) language model developed by Meta, activating 17 billion parameters out of a total of 109B. It supports native multimodal input (text and image) and multilingual output (text and code) across 12 supported languages. Designed for assistant-style interaction and visual reasoning, Scout uses 16 experts per forward pass and features a context length of 10 million tokens, with a training corpus of ~40 trillion tokens.',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B Instruct',
    developer: 'Meta',
    description:
      'The Meta Llama 3.3 multilingual large language model (LLM) is a pre-trained and instruction tuned generative model in 70B (text in/text out). The Llama 3.3 instruction tuned text only model is optimized for multilingual dialogue use cases and outperforms many of the available open source and closed chat models on common industry benchmarks.',
  },
]
