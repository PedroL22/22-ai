import { toast } from 'sonner'

import { api } from '~/trpc/react'

export type UserSettingsInput = {
  syncWithDb?: string
  language?: string
}

export const useUserSettings = () => {
  const utils = api.useUtils()

  const { data: settings, isLoading, error } = api.user.getSettings.useQuery()

  const updateSettingsMutation = api.user.updateSettings.useMutation({
    onSuccess: (updatedSettings) => {
      // Update the cache with new data
      utils.user.getSettings.setData(undefined, updatedSettings)
      toast.success('Settings updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`)
    },
  })

  // Helper function to update settings with optimistic updates
  const updateSettings = (newSettings: UserSettingsInput) => {
    // Optimistic update - immediately update the cache
    if (settings) {
      utils.user.getSettings.setData(undefined, {
        ...settings,
        ...newSettings,
        updatedAt: new Date(),
      })
    }

    // Then send the actual mutation
    updateSettingsMutation.mutate(newSettings)
  }

  // Helper function to update a single setting
  const updateSetting = <K extends keyof UserSettingsInput>(key: K, value: UserSettingsInput[K]) => {
    updateSettings({ [key]: value })
  }

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    updateSetting,
    isUpdating: updateSettingsMutation.isPending,
  }
}
