import { Inject, Injectable, Optional } from "@angular/core";
import { Observable } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { getUuid, noop } from "src/util/fn";
import { ConfirmDialogComponent } from "src/components/confirmDialog/confirmDialog.component";

import { IMessagingActions, IMessagingActionTmpl, WINDOW_MESSAGING_HANDLER_TOKEN, IWindowMessaging } from './types'
import { TYPE as NMV_TYPE, processJsonLd as nmvProcess } from './nmvSwc/index'
import { TYPE as NATIVE_TYPE, processJsonLd as nativeProcess } from './native'
import { BoothVisitor, JRPCRequest, ListenerChannel } from "src/api/jsonrpc"
import { ApiService } from "src/api";
import { ApiBoothEvents, namespace as apiNameSpace } from "src/api/service";

export const IAV_POSTMESSAGE_NAMESPACE = `ebrains:iav:`

const RECOGNISED_NAMESPACES = [
  IAV_POSTMESSAGE_NAMESPACE,
  apiNameSpace
]

export const MANAGED_METHODS = [
  'openminds:nmv:loadSwc',
  'openminds:nmv:unloadSwc'
]

class WindowOpenerListener implements ListenerChannel {
  constructor(
    public registerLeaveCb: () => void,
    public notify: (payload: JRPCRequest<unknown, unknown>) => void
  ){}
  
}

@Injectable({
  providedIn: 'root'
})

export class MessagingService {

  private originListenerMap = new Map<string, {listener: WindowOpenerListener, visitor: BoothVisitor<ApiBoothEvents>}>()

  private whiteListedOrigins = new Set()
  private pendingRequests: Map<string, Promise<boolean>> = new Map()
  private windowName: string

  private typeRegister: Map<string, (arg: any) => Observable<IMessagingActions<keyof IMessagingActionTmpl>>> = new Map()
  
  constructor(
    private dialog: MatDialog,
    private apiService: ApiService,
    @Optional() @Inject(WINDOW_MESSAGING_HANDLER_TOKEN) private messagingHandler: IWindowMessaging,
  ){
    
    if (window.opener){
      this.windowName = window.name
      window.opener.postMessage({
        id: getUuid(),
        method: `${IAV_POSTMESSAGE_NAMESPACE}onload`,
        param: {
          'window.name': this.windowName
        }
      }, '*')

      window.addEventListener('beforeunload', () => {
        window.opener.postMessage({
          id: getUuid(),
          method: `${IAV_POSTMESSAGE_NAMESPACE}beforeunload`,
          param: {
            'window.name': this.windowName
          }
        }, '*')
      })
    }

    window.addEventListener('message', async ({ data, origin, source }) => {
      if (/^webpack/.test(data.type)) return
      if (!data) return
      const { method } = data
      if (RECOGNISED_NAMESPACES.every(namespace => (method || '').indexOf(namespace) !== 0)) {
        return
      }
      const src = source as Window
      const { id } = data
      try {
        const result = await this.handleMessage({ data, origin })
        if (!this.originListenerMap.has(origin)) {
          const listener = new WindowOpenerListener(
            noop,
            val => src.postMessage(val, origin)
          )
          
          const visitor = this.apiService.booth.handshake()
          this.originListenerMap.set(origin, {listener, visitor})

          this.apiService.broadcastCh.addListener(listener)
          

          /**
           * if result was not yet populated, try populating it with 
           * siibra-explorer api
           */
        }
        if (!result) {
          const { visitor } = this.originListenerMap.get(origin)
          return await visitor.request(data)
        }
        src.postMessage({
          id,
          jsonrpc: '2.0',
          result
        }, origin)
      } catch (error) {
        if (src) {
          src.postMessage({
            id,
            jsonrpc: '2.0',
            error
          }, origin)
        }
      }
    })

    this.typeRegister.set(
      NMV_TYPE,
      nmvProcess
    )
    this.typeRegister.set(
      NATIVE_TYPE,
      nativeProcess
    )

  }

  public async handleMessage({ data, origin }) {
    const { method, param } = data
    /**
     * if ping method, respond pong method
     */
    if (method === 'ping') {
      return 'pong'
    }

    /**
     * otherwise, check permission
     */
    const allow = await this.checkOrigin({ origin })
    if (!allow) throw ({
      code: 403,
      message: 'User declined'
    })
    
    if (!method) return
    if (method.indexOf(IAV_POSTMESSAGE_NAMESPACE) !== 0) return
    const strippedMethod = method.replace(IAV_POSTMESSAGE_NAMESPACE, '')

    // TODO 
    // in future, check if in managed_methods
    // if yes, directly call processJsonld
    // if not, directly throw 

    return await this.processMessage({ method: strippedMethod, param })
  }

  processJsonld(jsonLd: any){
    const { ['@type']: type } = jsonLd
    const fn = this.typeRegister.get(type)
    if (!fn) {
      return Promise.reject(`${type} does not have a handler registered.`)
    }
    let returnValue: any = {}
    return new Promise((rs, rj) => {

      const sub = fn(jsonLd)
      sub.subscribe(
        ev => {
          if (ev.type === 'loadTemplate') {
            const payload = ev.payload as IMessagingActionTmpl['loadTemplate']
            
            this.messagingHandler.loadTempladById(payload)
          }

          if (ev.type === 'loadResource') {
            const payload = ev.payload as IMessagingActionTmpl['loadResource']
            returnValue = {
              ['@id']: payload["@id"],
              ['@type']: NATIVE_TYPE
            }
            this.messagingHandler.loadResource(payload)
          }

          if (ev.type === 'unloadResource') {
            const payload = ev.payload as IMessagingActionTmpl['unloadResource']
            this.messagingHandler.unloadResource(payload)
          }
        },
        rj,
        () => {
          rs(returnValue || {})
        }
      )
    })
  }

  async processMessage({ method, param }){

    // TODO combine api service and messaging service into one
    // and implement it properly

    if (MANAGED_METHODS.indexOf(method) >= 0) {
      return await this.processJsonld(param)
    }

    return
  }

  async checkOrigin({ origin }): Promise<boolean> {
    if (this.whiteListedOrigins.has(origin)) return true
    if (this.pendingRequests.has(origin)) return this.pendingRequests.get(origin)
    const responsePromise = this.dialog.open(
      ConfirmDialogComponent,
      {
        data: {
          title: `Cross tab messaging`,
          message: `${origin} would like to send data to siibra explorer`,
          okBtnText: `Allow`
        }
      }
    ).afterClosed().toPromise()
    this.pendingRequests.set(origin, responsePromise)
    const response = await responsePromise
    this.pendingRequests.delete(origin)
    if (response) this.whiteListedOrigins.add(origin)
    return response
  }
}
