import { InjectionToken } from "@angular/core";
import { Observable } from "rxjs";

/**
 * Inject click interceptor
 */
export const CLICK_INTERCEPTOR_INJECTOR = new InjectionToken<ClickInterceptor>('CLICK_INTERCEPTOR_INJECTOR')

export type TClickInterceptorConfig = {
  last?: boolean
}

/**
 * Register callbacks
 * interceptorFunction may return a truthy value. If so, no futher click interceptors will be called.
 */
export interface ClickInterceptor{
  register: (interceptorFunction: (ev: any) => boolean, config?: TClickInterceptorConfig) => void
  deregister: (interceptorFunction: (ev: any) => any) => void
}

export const HOVER_INTERCEPTOR_INJECTOR = new InjectionToken<HoverInterceptor>("HOVER_INTERCEPTOR_INJECTOR")

export type THoverConfig = {
  fontSet?: string
  fontIcon?: string
  message: string
}

export interface HoverInterceptor {
  append(message: THoverConfig): void
  remove(message: THoverConfig): void
}

export const CONTEXT_MENU_ITEM_INJECTOR = new InjectionToken('CONTEXT_MENU_ITEM_INJECTOR')

export type TContextMenu<T> = {
  register: (fn: T) => void
  deregister: (fn: (fn: T) => void) => void
}

export const DARKTHEME = new InjectionToken<Observable<boolean>>('DARKTHEME')
