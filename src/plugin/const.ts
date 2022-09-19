import { InjectionToken } from "@angular/core"

const PLUGIN_SRC_KEY = "x-plugin-portal-src"

export function setPluginSrc(src: string, record: Record<string, unknown> = {}){
  return {
    ...record,
    [PLUGIN_SRC_KEY]: src
  }
}

export function getPluginSrc(record: Record<string, string> = {}){
  return record[PLUGIN_SRC_KEY]
}

export const SET_PLUGIN_NAME = new InjectionToken('SET_PLUGIN_NAME')
