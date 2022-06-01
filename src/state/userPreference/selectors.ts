import { createSelector } from "@ngrx/store"
import { nameSpace } from "./const"
import { UserPreference } from "./store"

const storeSelector = store => store[nameSpace] as UserPreference

export const useAnimation = createSelector(
  storeSelector,
  state => state.useAnimation
)

export const gpuLimit = createSelector(
  storeSelector,
  state => state.gpuLimit
)

export const useMobileUi = createSelector(
  storeSelector,
  state => state.useMobileUi
)

export const agreedToCookie = createSelector(
  storeSelector,
  store => store.agreeCookie
)

export const agreedToKgTos = createSelector(
  storeSelector,
  store => store.agreeKgTos
)

export const userCsp = createSelector(
  storeSelector,
  store => store.pluginCSP
)
