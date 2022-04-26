type JRPCBase = { jsonrpc: "2.0" }

export type JRPCRequest<Method, T> = {
  method: Method // does NOT start with rpc.
  params?: T
  id?: string // if absent, notification, does not require response
} & JRPCBase

export type JRPCSuccessResp<T> = {
  result: T
  id?: string
} & JRPCBase

export type JRPCErrorResp<T> = {
  error: {
    /**
     * 
     * -32700	Parse error	Invalid JSON was received by the server.An error occurred on the server while parsing the JSON text.
     * -32600	Invalid Request	The JSON sent is not a valid Request object.
     * -32601	Method not found	The method does not exist / is not available.
     * -32602	Invalid params	Invalid method parameter(s).
     * -32603	Internal error	Internal JSON-RPC error.
     * -32000 to -32099	Server error	Reserved for implementation-defined server-errors.
     */
    code: number
    message: string
    data?: T
  }
} & JRPCBase

export type JRPCResp<T, E> = JRPCSuccessResp<T> | JRPCErrorResp<E>

export interface ListenerChannel {
  notify: (payload: JRPCRequest<unknown, unknown>) => void
  registerLeaveCb: (cb: () => void) => void
}

export type BroadcastChannel<
  Protocols extends Record<string, unknown>,
> = {
  state: Protocols
  listeners: ListenerChannel[]
  emit: (event: keyof Protocols, payload: Protocols[keyof Protocols]) => void
  addListener: (listener: ListenerChannel) => void
}

export function createBroadcastingJsonRpcChannel<
  NameSpace extends string,
  Protocols extends Record<keyof Protocols, unknown>
>(namespace: NameSpace, defaultState: Protocols): BroadcastChannel<Protocols>{
  return {
    state: defaultState,
    listeners: [],
    emit(event: keyof Protocols, value: Protocols[keyof Protocols]) {
      const ev = `${namespace}${event as string}`
      this.state[event] = value
      const payload: Omit<JRPCRequest<string, Protocols[keyof Protocols]>, 'id'> = {
        jsonrpc: '2.0',
        method: ev,
        params: this.state[event]
      }
      for (const listener of (this.listeners as ListenerChannel[])) {
        listener.notify(payload)
      }
    },
    addListener(listener: ListenerChannel){
      if (this.listeners.indexOf(listener) < 0) {
        this.listeners.push(listener)
      }
      listener.registerLeaveCb(() => {
        this.listeners = this.listeners.filter(l => l !== listener)
      })
      for (const key in this.state) {
        const payload: Omit<JRPCRequest<string, Protocols[keyof Protocols]>,'id'> = {
          jsonrpc: '2.0',
          method: `${namespace}.${key}`,
          params: this.state[key]
        }
        listener.notify(payload)
      }
    }
  }
}

type BoothProtocol = Record<string, {
  request: unknown
  response: unknown
}>

export class BoothVisitor<T extends BoothProtocol>{
  constructor(private booth: Booth<T>){

  }
  request(event: JRPCRequest<keyof T, T[keyof T]['request']>) {
    return this.booth.responder.onRequest(event)
  }
}

export interface BoothResponder<RespParam extends BoothProtocol>{
  onRequest: (event: JRPCRequest<keyof RespParam, RespParam[keyof RespParam]['request']>) => Promise<void | JRPCResp<RespParam[keyof RespParam]['response'], string>>
}

export class Booth<T extends BoothProtocol>{
  constructor(
    public responder: BoothResponder<T>
  ){
  }
  handshake() {
    return new BoothVisitor<T>(this)
  }
}
