import { InjectionToken } from "@angular/core";

export const CLICK_INTERCEPTOR_INJECTOR = new InjectionToken<ClickInterceptor>('CLICK_INTERCEPTOR_INJECTOR')

export type TClickInterceptorConfig = {
  last?: boolean
}

export interface ClickInterceptor{
  register: (interceptorFunction: (ev: any, next: Function) => void, config?: TClickInterceptorConfig) => void
  deregister: (interceptorFunction: Function) => void
}
