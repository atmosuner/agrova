import { useContext } from 'react'
import { OperationSettingsContext, type OperationSettingsContextValue } from './operation-settings-context'

export function useOperationSettings(): OperationSettingsContextValue {
  const v = useContext(OperationSettingsContext)
  if (v == null) {
    throw new Error('useOperationSettings must be used within OperationSettingsProvider')
  }
  return v
}
