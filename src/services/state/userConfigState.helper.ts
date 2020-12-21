import { createSelector } from "@ngrx/store"

export const selectorPluginCspPermission = createSelector(
  (state: any) => state.userConfigState,
  (userConfigState: any, props: any = {}) => {
    const { key } = props as { key: string }
    return {
      value: !!userConfigState?.pluginCsp?.[key]
    } 
  }
)
