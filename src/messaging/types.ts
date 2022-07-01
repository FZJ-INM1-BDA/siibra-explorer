import { InjectionToken } from "@angular/core";

interface ILoadTemplateByIdPayload {
  ['@id']: string
}

interface IResourceType {
  swc: string
}

export type TVec4 = number[]
export type TVec3 = number[]
export type TMat3 = TVec3[]
export type TMat4 = TVec4[]

interface ICommonResParam {
  transform: TMat4
}

interface ILoadResource {
  ['@id']: string
  ['@type']: keyof IResourceType
  url: string
  unload: () => void
  resourceParam: ICommonResParam
}

interface IUnloadResource {
  ['@id']: string
}

interface ISetResp {
  [key: string]: any
}

export interface IMessagingActionTmpl {
  setResponse: ISetResp
  loadTemplate: ILoadTemplateByIdPayload
  loadResource: ILoadResource
  unloadResource: IUnloadResource
}

export interface IMessagingActions<TAction extends keyof IMessagingActionTmpl> {
  type: TAction
  payload: IMessagingActionTmpl[TAction]
}

export interface IWindowMessaging {
  loadTempladById(payload: IMessagingActionTmpl['loadTemplate']): void
  loadResource(payload: IMessagingActionTmpl['loadResource']): void
  unloadResource(payload: IMessagingActionTmpl['unloadResource']): void
}

export const WINDOW_MESSAGING_HANDLER_TOKEN = new InjectionToken<IWindowMessaging>('WINDOW_MESSAGING_HANDLER_TOKEN')
