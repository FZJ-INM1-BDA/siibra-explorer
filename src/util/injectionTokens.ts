import { InjectionToken } from "@angular/core";

export const CLICK_INTERCEPTOR_INJECTOR = new InjectionToken<ClickInterceptor>('CLICK_INTERCEPTOR_INJECTOR')

export interface ClickInterceptor{
  register: (interceptorFunction: (ev: any, next: Function) => void) => void
  deregister: (interceptorFunction: Function) => void
}
