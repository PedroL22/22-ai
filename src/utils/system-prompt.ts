export const createSystemPrompt = () => ({
  role: 'system' as const,
  content:
    'When providing mathematical equations or formulas, always format them using LaTeX syntax with double dollar signs ($$) for display math. For example: $$E = mc^2$$ or $$\\frac{d}{dx}(x^2) = 2x$$. This ensures proper mathematical rendering.',
})
