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
  | 'google/gemini-2.5-pro:byok'
  | 'google/gemini-2.5-flash:byok'
  | 'google/gemini-2.5-flash-lite:byok'
  | 'google/gemini-2.0-flash:byok'
  | 'google/gemini-2.0-flash-lite:byok'
  | 'grok/grok-3:byok'
  | 'grok/grok-3-mini:byok'

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
  | 'Gemini 2.5 Pro'
  | 'Gemini 2.5 Flash'
  | 'Gemini 2.5 Flash Lite'
  | 'Gemini 2.0 Flash'
  | 'Gemini 2.0 Flash Lite'
  | 'Grok 3'
  | 'Grok 3 Mini'

export type ModelsDevelopers = 'OpenAI' | 'Anthropic' | 'Google' | 'Meta' | 'Grok' | 'DeepSeek' | 'Qwen'

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
      "An experimental version of Google's speed- and efficiency-optimized model. It offers rapid response times for high-frequency tasks like chat and summarization, featuring a 1 million token context window and advanced function calling.",
    isFree: true,
  },
  {
    id: 'google/gemma-3-27b-it:free',
    name: 'Gemma 3 27B',
    developer: 'Google',
    description:
      'A speculative next-generation open model from Google. Expected to feature a new architecture, enhanced reasoning, and world-class performance for its size, building upon the foundations of the Gemma and Gemini families.',
    isFree: true,
  },
  {
    id: 'deepseek/deepseek-chat-v3-0324:free',
    name: 'DeepSeek V3 0324',
    developer: 'DeepSeek',
    description:
      'A powerful 671B-parameter Mixture-of-Experts (MoE) model. It is designed for superior performance in complex reasoning, problem-solving, and tool integration, trained on a vast 14.8 trillion token dataset for high-quality text generation.',
    isFree: true,
  },
  {
    id: 'deepseek/deepseek-r1-0528:free',
    name: 'DeepSeek R1 0528',
    developer: 'DeepSeek',
    description:
      'A 671B parameter Mixture-of-Experts (MoE) model with 37B active parameters, focused on open-source reasoning. It is designed to be highly performant and efficient for tasks requiring deep, step-by-step thought processes.',
    isFree: true,
  },
  {
    id: 'meta-llama/llama-4-maverick:free',
    name: 'Llama 4 Maverick',
    developer: 'Meta',
    description:
      'A high-capacity, generalist multimodal model from Meta. Built on a 400B parameter Mixture-of-Experts (MoE) architecture, it excels at image/text understanding, reasoning, and multilingual chat, making it a powerful alternative to closed-source models.',
    isFree: true,
  },
  {
    id: 'meta-llama/llama-4-scout:free',
    name: 'Llama 4 Scout',
    developer: 'Meta',
    description:
      'A multimodal Mixture-of-Experts (MoE) model from Meta optimized for long-context tasks. With a 10 million token context window, it is ideal for multi-document summarization, code reasoning, and complex visual analysis.',
    isFree: true,
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B Instruct',
    developer: 'Meta',
    description:
      'A speculative instruction-tuned model from Meta. It is anticipated to feature improved multilingual capabilities, a larger context window, and enhanced performance on reasoning benchmarks compared to the Llama 3.1 series.',
    isFree: true,
  },
  {
    id: 'qwen/qwen3-32b:free',
    name: 'Qwen3 32B',
    developer: 'Qwen',
    description:
      'A 32B parameter language model from Alibaba Cloud, part of the Qwen3 family. Trained on 36 trillion tokens, it excels in complex reasoning and multilingual tasks, offering a "thinking" mode for deeper analysis.',
    isFree: true,
  },
  {
    id: 'qwen/qwen2.5-vl-72b-instruct:free',
    name: 'Qwen2.5 VL 72B Instruct',
    developer: 'Qwen',
    description:
      'A flagship vision-language model from Alibaba Cloud. It is highly proficient at analyzing text, charts, and graphics within images and can act as a visual agent, dynamically using tools to perform tasks based on visual input.',
    isFree: true,
  },
  {
    id: 'qwen/qwen-2.5-coder-32b-instruct:free',
    name: 'Qwen2.5 Coder 32B Instruct',
    developer: 'Qwen',
    description:
      'A specialized code language model from Alibaba Cloud. It is fine-tuned for a wide range of software development tasks, including code generation, bug fixing, and providing explanatory documentation.',
    isFree: true,
  },
  // BYOK models
  {
    id: 'openai/gpt-4o:byok',
    name: 'GPT 4o',
    developer: 'OpenAI',
    description:
      "OpenAI's flagship multimodal model that natively processes text, audio, image, and video inputs to generate text and image outputs. It is designed to be faster and more cost-effective than GPT-4 Turbo, with human-like response times in conversation.",
    isFree: false,
  },
  {
    id: 'openai/gpt-4o-mini:byok',
    name: 'GPT 4o-mini',
    developer: 'OpenAI',
    description:
      'A smaller, faster, and more affordable version of GPT-4o. It is optimized for speed and cost, outperforming GPT-3.5 Turbo while retaining strong multimodal capabilities, making it ideal for scaled applications.',
    isFree: false,
  },
  {
    id: 'openai/gpt-4.1:byok',
    name: 'GPT 4.1',
    developer: 'OpenAI',
    description:
      'An iterative update to the GPT-4 series, offering enhanced performance and accuracy for complex tasks. It is optimized for enterprise use cases like advanced code review and logical reasoning.',
    isFree: false,
  },
  {
    id: 'openai/gpt-4.1-mini:byok',
    name: 'GPT 4.1 Mini',
    developer: 'OpenAI',
    description:
      'A speculative compact model in the GPT-4.1 series, expected to offer a balance of performance and efficiency for high-throughput tasks, serving as a faster, lower-cost counterpart to the full model.',
    isFree: false,
  },
  {
    id: 'openai/gpt-4.1-nano:byok',
    name: 'GPT 4.1 Nano',
    developer: 'OpenAI',
    description:
      'A speculative, highly-optimized model in the GPT-4.1 series, designed for on-device or edge applications where computational resources and latency are critical constraints.',
    isFree: false,
  },
  {
    id: 'openai/o4-mini:byok',
    name: 'o4 mini',
    developer: 'OpenAI',
    description:
      'A powerful and efficient multimodal model from OpenAI\'s "Opus" family. It is trained to agentically use tools like web search and code execution to solve problems, setting a high standard for intelligence and utility.',
    isFree: false,
  },
  {
    id: 'openai/o3-mini:byok',
    name: 'o3 mini',
    developer: 'OpenAI',
    description:
      'A compact and fast model from OpenAI\'s "Opus" family, designed for efficiency. It supports tool use and is highly capable in tasks like code review and workflow automation, offering a cost-effective solution for scaled applications.',
    isFree: false,
  },
  {
    id: 'openai/o3:byok',
    name: 'o3',
    developer: 'OpenAI',
    description:
      'A family of models from OpenAI focused on reasoning and tool use. The standard model offers a strong balance of performance and speed for a wide range of generative and conversational tasks.',
    isFree: false,
  },
  {
    id: 'openai/o3-pro:byok',
    name: 'o3 Pro',
    developer: 'OpenAI',
    description:
      'A speculative high-performance model in OpenAI\'s "Opus" family. It is expected to offer superior reasoning, instruction following, and accuracy for the most demanding enterprise and research tasks.',
    isFree: false,
  },
  {
    id: 'openai/gpt-4.5:byok',
    name: 'GPT 4.5',
    developer: 'OpenAI',
    description:
      'A rumored next-generation model from OpenAI, anticipated to feature significant architectural improvements, a larger context window, and enhanced reasoning and multimodal capabilities, potentially setting a new industry benchmark.',
    isFree: false,
  },
  {
    id: 'anthropic/claude-4-sonnet:byok',
    name: 'Claude 4 Sonnet',
    developer: 'Anthropic',
    description:
      "A powerful and efficient model from Anthropic's Claude 4 family. It delivers superior performance in coding and reasoning with enhanced steerability, making it ideal for a balance of capability and speed in enterprise applications.",
    isFree: false,
  },
  {
    id: 'anthropic/claude-3.5-sonnet:byok',
    name: 'Claude 3.5 Sonnet',
    developer: 'Anthropic',
    description:
      'A highly capable model that outperforms Claude 3 Opus at twice the speed. It excels at complex reasoning, coding, and visual data extraction, and introduces "Artifacts" for interactive content generation.',
    isFree: false,
  },
  {
    id: 'anthropic/claude-3.7-sonnet:byok',
    name: 'Claude 3.7 Sonnet',
    developer: 'Anthropic',
    description:
      'An interim release in the Claude series, serving as the direct predecessor to the Claude 4 family. It offered industry-leading capabilities and served as a benchmark for subsequent improvements in coding and reasoning.',
    isFree: false,
  },
  {
    id: 'anthropic/claude-4-opus:byok',
    name: 'Claude 4 Opus',
    developer: 'Anthropic',
    description:
      "Anthropic's flagship model, setting a new standard for coding, advanced reasoning, and agentic workflows. It is designed to handle complex, long-running tasks, from initial planning to final execution.",
    isFree: false,
  },
  {
    id: 'google/gemini-2.5-pro:byok',
    name: 'Gemini 2.5 Pro',
    developer: 'Google',
    description:
      "Google's most advanced reasoning model, featuring a 1 million token context window and native multimodality. It excels at coding, complex problem-solving, and can analyze text, images, audio, and video.",
    isFree: false,
  },
  {
    id: 'google/gemini-2.5-flash:byok',
    name: 'Gemini 2.5 Flash',
    developer: 'Google',
    description:
      'A speed-optimized model in the Gemini 2.5 family. It provides the core capabilities of Pro, including a large context window and multimodality, but is tuned for faster performance on everyday tasks.',
    isFree: false,
  },
  {
    id: 'google/gemini-2.5-flash-lite:byok',
    name: 'Gemini 2.5 Flash Lite',
    developer: 'Google',
    description:
      'The most cost-efficient model in the Gemini 2.5 family. It is designed for high-volume, large-scale text output use cases where speed and affordability are paramount.',
    isFree: false,
  },
  {
    id: 'google/gemini-2.0-flash:byok',
    name: 'Gemini 2.0 Flash',
    developer: 'Google',
    description:
      'A fast and versatile multimodal model with a 1 million token context window. It is generally available and optimized for high performance on a wide variety of tasks with simplified, cost-effective pricing.',
    isFree: false,
  },
  {
    id: 'google/gemini-2.0-flash-lite:byok',
    name: 'Gemini 2.0 Flash Lite',
    developer: 'Google',
    description:
      'A cost-optimized variant of Gemini 2.0 Flash. This model is tailored for large-scale text generation and other high-volume applications where efficiency is the top priority.',
    isFree: false,
  },
  {
    id: 'grok/grok-3:byok',
    name: 'Grok 3',
    developer: 'Grok',
    description:
      'The flagship model from xAI, blending advanced reasoning with a vast knowledge base. It excels at complex problem-solving, coding, and instruction-following, with deep domain expertise in science and finance.',
    isFree: false,
  },
  {
    id: 'grok/grok-3-mini:byok',
    name: 'Grok 3 Mini',
    developer: 'Grok',
    description:
      'A lightweight and powerful model from xAI, optimized for logic-based tasks and efficiency. It delivers strong reasoning capabilities, powered by large-scale reinforcement learning, in a more compact package.',
    isFree: false,
  },
]
