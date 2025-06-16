import { useUser } from '@clerk/nextjs'

import { toast } from 'sonner'

import { api } from '~/trpc/react'

export type UserSettingsInput = {
  syncWithDb?: boolean
  language?: string
}

export const useUserSettings = () => {
  const { isSignedIn, isLoaded } = useUser()
  const utils = api.useUtils()

  const {
    data: settings,
    isLoading,
    error,
  } = api.user.getSettings.useQuery(undefined, {
    enabled: isSignedIn && isLoaded,
  })

  const updateSettingsMutation = api.user.updateSettings.useMutation({
    onSuccess: (updatedSettings) => {
      console.log('Settings updated successfully: ', updatedSettings)
      // Update the cache with new data
      utils.user.getSettings.setData(undefined, updatedSettings)
      toast.success('✅ Settings updated successfully.')
    },
    onError: (error) => {
      console.log('Settings update error: ', error)
      // On error, invalidate and refetch to get the actual state from the server
      utils.user.getSettings.invalidate()
      toast.error(`❌ Failed to update settings: ${error.message}`)
    },
  })

  // Helper function to update settings with optimistic updates
  const updateSettings = (newSettings: UserSettingsInput) => {
    // Temporarily disable optimistic update to debug
    // if (settings) {
    //   utils.user.getSettings.setData(undefined, {
    //     ...settings,
    //     ...newSettings,
    //     updatedAt: new Date(),
    //   })
    // }

    // Send the mutation
    updateSettingsMutation.mutate(newSettings)
  }

  // Helper function to update a single setting
  const updateSetting = <K extends keyof UserSettingsInput>(key: K, value: UserSettingsInput[K]) => {
    console.log(`Updating setting ${String(key)} to:`, value)
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
