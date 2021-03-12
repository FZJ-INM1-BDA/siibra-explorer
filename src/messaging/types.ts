import { InjectionToken } from "@angular/core";

interface ILoadTemplateByIdPayload {
  ['@id']: string
}

interface IResourceType {
  swc: string
}

interface ILoadResource {
  ['@id']: string
  ['@type']: keyof IResourceType
  url: string
  unload: () => void
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

export interface ILoadMesh {
  type: 'VTK'
  id: string
  url: string
  customFragmentColor?: string
}
export const LOAD_MESH_TOKEN = new InjectionToken<(loadMeshParam: ILoadMesh) => void>('LOAD_MESH_TOKEN')

export interface IWindowMessaging {
  loadTempladById(payload: IMessagingActionTmpl['loadTemplate']): void
  loadResource(payload: IMessagingActionTmpl['loadResource']): void
  unloadResource(payload: IMessagingActionTmpl['unloadResource']): void
}

export const WINDOW_MESSAGING_HANDLER_TOKEN = new InjectionToken<IWindowMessaging>('WINDOW_MESSAGING_HANDLER_TOKEN')
