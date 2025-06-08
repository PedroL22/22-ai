import type { Appearance } from '@clerk/types'

/**
 * Type-safe theme configuration for Clerk components
 *
 * This function provides a type-safe way to customize Clerk's appearance.
 *
 * @param resolvedTheme - The current theme ('light', 'dark')
 * @returns Clerk appearance configuration object
 */
export const clerkThemes = (resolvedTheme: string | 'light' | 'dark'): Appearance => {
  const isDark = resolvedTheme === 'dark'

  return {
    variables: {
      colorPrimary: isDark ? '#8b5cf6' : '#7c3aed',
      colorBackground: isDark ? '#27272a' : '#ffffff',
      colorText: isDark ? '#ffffff' : '#0f0f23',
      colorTextSecondary: isDark ? '#9ca3af' : '#6b7280',
      colorNeutral: isDark ? '#ffffff' : '#0f0f23',
      colorInputBackground: isDark ? '#27272a' : '#f9fafb',
      colorInputText: isDark ? '#ffffff' : '#0f0f23',
      colorDanger: '#ef4444',
      borderRadius: '0.65rem',
    },
    elements: {
      card: {
        backgroundColor: isDark ? '#27272a' : '#ffffff',
        borderColor: isDark ? '#27272a' : '#e5e7eb',
        color: isDark ? '#ffffff' : '#0f0f23',
      },
      modalBackdrop: {
        backgroundColor: 'rgba(0, 0, 0, 0)',
      },
      formButtonPrimary: {
        backgroundColor: isDark ? '#8b5cf6' : '#7c3aed',
        color: '#ffffff',
        '&:hover': {
          opacity: '0.9',
        },
      },
    },
  }
}
