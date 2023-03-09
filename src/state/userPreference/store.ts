import { createReducer, on } from "@ngrx/store"
import { environment } from "src/environments/environment"
import { COOKIE_VERSION, KG_TOS_VERSION, LOCAL_STORAGE_CONST } from "src/util/constants"
import * as actions from "./actions"
import { maxGpuLimit, CSP } from "./const"

export const defaultGpuLimit = maxGpuLimit

export type UserPreference = {
  useMobileUi: boolean
  gpuLimit: number
  useAnimation: boolean
  pluginCSP: Record<string, CSP>

  agreeCookie: boolean
  agreeKgTos: boolean

  showExperimental: boolean
}

export const defaultState: UserPreference = {
  useMobileUi: JSON.parse(localStorage.getItem(LOCAL_STORAGE_CONST.MOBILE_UI)),
  gpuLimit: Number(localStorage.getItem(LOCAL_STORAGE_CONST.GPU_LIMIT)) || defaultGpuLimit,
  useAnimation: !localStorage.getItem(LOCAL_STORAGE_CONST.ANIMATION),
  pluginCSP: {},

  agreeCookie: localStorage.getItem(LOCAL_STORAGE_CONST.AGREE_COOKIE) === COOKIE_VERSION,
  agreeKgTos: localStorage.getItem(LOCAL_STORAGE_CONST.AGREE_KG_TOS) === KG_TOS_VERSION,
  showExperimental: environment.EXPERIMENTAL_FEATURE_FLAG
}

export const reducer = createReducer(
  defaultState,
  on(
    actions.setAnimationFlag,
    (state, { flag }) => {
      if (flag) {
        localStorage.removeItem(LOCAL_STORAGE_CONST.ANIMATION)
      } else {
        localStorage.setItem(LOCAL_STORAGE_CONST.ANIMATION, "false")
      }
      
      return {
        ...state,
        useAnimation: flag
      }
    }
  ),
  on(
    actions.setGpuLimit,
    (state, { limit }) => {
      return {
        ...state,
        gpuLimit: limit
      }
    }
  ),
  on(
    actions.useMobileUi,
    (state, { flag }) => {
      return {
        ...state,
        useMobileUi: flag
      }
    }
  ),
  on(
    actions.agreeCookie,
    state => {
      return {
        ...state,
        agreeCookie: true
      }
    }
  ),
  on(
    actions.agreeKgTos,
    state => {
      return {
        ...state,
        agreeKgTos: true
      }
    }
  ),
  on(
    actions.updateCsp,
    (state, { name, csp }) => {
      return {
        ...state,
        pluginCSP: {
          ...state.pluginCSP,
          [name]: csp
        }
      }
    }
  ),
  on(
    actions.setShowExperimental,
    (state, { flag }) => ({
      ...state,
      showExperimental: flag
    })
  )
)
