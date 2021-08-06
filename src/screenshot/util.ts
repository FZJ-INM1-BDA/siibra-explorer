import { InjectionToken } from "@angular/core"

interface IScrnShot{
  x: number
  y: number
  width: number
  height: number
}

/**
 * if param is not provided, screenshot entire screen
 */
export type TypeHandleScrnShotPromise = (param?: IScrnShot) => Promise<{ revoke: Function, url: string }>
export const HANDLE_SCREENSHOT_PROMISE = new InjectionToken('HANDLE_SCREENSHOT_PROMISE')