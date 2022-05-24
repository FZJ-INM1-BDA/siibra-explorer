import { Inject, Injectable, Optional } from "@angular/core";
import { select, Store } from "@ngrx/store";
import { Subject } from "rxjs";
import { distinctUntilChanged, filter, map, take } from "rxjs/operators";
import { SAPI, SapiAtlasModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel, OpenMINDSCoordinatePoint } from "src/atlasComponents/sapi";
import { SxplrCoordinatePointExtension } from "src/atlasComponents/sapi/type";
import { MainState, atlasSelection, userInteraction, annotation } from "src/state"
import { ClickInterceptor, CLICK_INTERCEPTOR_INJECTOR } from "src/util";
import { CANCELLABLE_DIALOG, CANCELLABLE_DIALOG_OPTS } from "src/util/interfaces";
import { Booth, BoothResponder, createBroadcastingJsonRpcChannel, JRPCRequest, JRPCResp } from "./jsonrpc"

export type NAMESPACE_TYPE = "sxplr"
export const namespace: NAMESPACE_TYPE = "sxplr"
const nameSpaceRegex = new RegExp(`^${namespace}`)

type AtId = {
  "@id": string
}

type RequestUserTypes = {
  region: SapiRegionModel
  point: OpenMINDSCoordinatePoint
  confirm: void
  input: string
}

type RequestUser<T extends keyof RequestUserTypes> = {
  type: T
  message: string
  promise: Promise<RequestUserTypes[T]>
  id: string
  rs: (arg: RequestUserTypes[T]) => void
  rj: (reason: string) => void
}

export type ApiBoothEvents = {
  getAllAtlases: {
    request: null
    response: SapiAtlasModel[]
  }
  getSupportedTemplates: {
    request: null
    response: SapiSpaceModel[]
  }
  getSupportedParcellations: {
    request: null
    response: SapiParcellationModel[]
  }

  selectAtlas: {
    request: AtId
    response: 'OK'
  }
  selectParcellation: {
    request: AtId
    response: 'OK'
  }
  selectTemplate: {
    request: AtId
    response: 'OK'
  }

  navigateTo: {
    request: MainState['[state.atlasSelection]']['navigation'] & { animate?: boolean }
    response: 'OK'
  }

  getUserToSelectARoi: {
    request: {
      type: 'region' | 'point'
      message: string
    }
    response: SapiRegionModel | OpenMINDSCoordinatePoint
  }
  
  addAnnotations: {
    request: {
      annotations: SxplrCoordinatePointExtension[]
    }
    response: 'OK'
  }

  rmAnnotations: {
    request: {
      annotations: AtId[]
    }
    response: 'OK'
  }

  exit: {
    request: {
      requests: JRPCRequest<keyof ApiBoothEvents, ApiBoothEvents[keyof ApiBoothEvents]['request']>[]
    }
    response: 'OK'
  }

  cancelRequest: {
    request: {
      id: string
    }
    response: 'OK'
  }
}

export type HeartbeatEvents = {
  init: {
    request: null
    response: {
      name: string
    }
  }
}

export type BroadCastingApiEvents = {
  atlasSelected: SapiAtlasModel
  templateSelected: SapiSpaceModel
  parcellationSelected: SapiParcellationModel
  allRegions: SapiRegionModel[]
  regionsSelected: SapiRegionModel[]
}

const broadCastDefault: BroadCastingApiEvents = {
  atlasSelected: null,
  templateSelected: null,
  parcellationSelected: null,
  allRegions: [],
  regionsSelected: [],
}

@Injectable({
  providedIn: 'root'
})

export class ApiService implements BoothResponder<ApiBoothEvents>{

  public broadcastCh = createBroadcastingJsonRpcChannel<`${NAMESPACE_TYPE}.on`, BroadCastingApiEvents>(`${namespace}.on`, broadCastDefault)
  public booth = new Booth<ApiBoothEvents>(this)

  private requestUserQueue: RequestUser<keyof RequestUserTypes>[] = []
  private requestUser$ = new Subject<RequestUser<keyof RequestUserTypes>>()
  private fulfillUserRequest(error: string, result: RequestUserTypes[keyof RequestUserTypes]){
    const {
      rs, rj
    } = this.requestUserQueue.pop()
    if (!!error) {
      rj(error)
    } else {
      rs(result)
    }
    if (this.dismissDialog) {
      this.dismissDialog()
      this.dismissDialog = null
    }
    if (this.requestUserQueue.length > 0) {
      this.requestUser$.next(this.requestUserQueue[0])
    }
  }
  private dismissDialog: () => void
  private onMouseClick(): boolean {
    if (this.requestUserQueue.length === 0) return true
    
    const { type } = this.requestUserQueue[0]

    if (type === "region") {
      let moRegion: SapiRegionModel
      this.store.pipe(
        select(userInteraction.selectors.mousingOverRegions),
        filter(val => val.length > 0),
        map(val => val[0]),
        take(1)
      ).subscribe(region => moRegion = region)
      if (!!moRegion) {
        this.fulfillUserRequest(null, moRegion)
        return false
      }
    }

    if (type === "point") {
      let point: OpenMINDSCoordinatePoint
      this.store.pipe(
        select(userInteraction.selectors.mousingOverPosition),
        take(1)
      ).subscribe(p => point = p)
      if (!!point) {
        this.fulfillUserRequest(null, point)
        return false
      }
    }
    return true
  }

  private onDestoryCb: (() => void)[] = []
  constructor(
    private store: Store,
    private sapi: SAPI,
    @Optional() @Inject(CANCELLABLE_DIALOG) openCancellableDialog: (message: string, options: CANCELLABLE_DIALOG_OPTS) => () => void,
    @Optional() @Inject(CLICK_INTERCEPTOR_INJECTOR) clickInterceptor: ClickInterceptor,
  ){

    if (clickInterceptor) {
      const { register, deregister } = clickInterceptor
      const onMouseClick = this.onMouseClick.bind(this)
      register(onMouseClick)
      this.onDestoryCb.push(() => deregister(onMouseClick))
    }

    if (openCancellableDialog) {

      const requestUsersSub = this.requestUser$.pipe(
        distinctUntilChanged((o, n) => o?.promise === n?.promise)
      ).subscribe(item => {
        if (this.dismissDialog) this.dismissDialog()
        if (!item) return
        this.dismissDialog = openCancellableDialog(item.message, {
          userCancelCallback: () => {
            this.fulfillUserRequest(`user Cancelled`, null)
            this.dismissDialog = null
          }
        })
      })
      this.onDestoryCb.push(() => requestUsersSub.unsubscribe())
    }

    this.store.pipe(
      select(atlasSelection.selectors.selectedAtlas)
    ).subscribe(atlas => {
      this.broadcastCh.emit('atlasSelected', atlas)
    })
    this.store.pipe(
      select(atlasSelection.selectors.selectedParcellation)
    ).subscribe(parcellation => {
      this.broadcastCh.emit('parcellationSelected', parcellation)
    })
    this.store.pipe(
      select(atlasSelection.selectors.selectedTemplate)
    ).subscribe(template => {
      this.broadcastCh.emit('templateSelected', template)
    })
    this.store.pipe(
      select(atlasSelection.selectors.selectedRegions)
    ).subscribe(regions => {
      this.broadcastCh.emit('regionsSelected', regions)
    })
    this.store.pipe(
      select(atlasSelection.selectors.selectedParcAllRegions)
    ).subscribe(regions => {
      this.broadcastCh.emit('allRegions', regions)
    })
  }
  async onRequest(event: JRPCRequest<keyof ApiBoothEvents, unknown>): Promise<void | JRPCResp<ApiBoothEvents[keyof ApiBoothEvents]['response'], string>> {
    /**
     * if id is not present, then it's a no-op
     */
    if (!event.id) {
      return
    }
    if (!nameSpaceRegex.test(event.method)) return

    const method = event.method.replace(nameSpaceRegex, '').replace(/^\./, '')
    switch (method) {
    case 'getAllAtlases': {
      if (!event.id) return
      const atlases = await this.sapi.atlases$.pipe(
        take(1)
      ).toPromise()
      return {
        id: event.id,
        result: atlases,
        jsonrpc: '2.0'
      }
    }
    case 'getSupportedParcellations': {
      if (!event.id) return
      const parcs = await this.store.pipe(
        atlasSelection.fromRootStore.allAvailParcs(this.sapi),
        take(1)
      ).toPromise()
      return {
        id: event.id,
        jsonrpc: '2.0',
        result: parcs
      }
    }
    case 'getSupportedTemplates': {
      if (!event.id) return
      const spaces = await this.store.pipe(
        atlasSelection.fromRootStore.allAvailSpaces(this.sapi),
        take(1)
      ).toPromise()
      return {
        id: event.id,
        jsonrpc: '2.0',
        result: spaces
      }
    }
    case 'selectAtlas': {
      const atlases = await this.sapi.atlases$.pipe(
        take(1)
      ).toPromise()
      const id = event.params as ApiBoothEvents['selectAtlas']['request']
      const atlas = atlases.find(atlas => atlas["@id"] === id?.["@id"])
      if (!atlas) {
        if (!!event.id) {
          return {
            id: event.id,
            jsonrpc: '2.0',
            error: {
              code: -32602,
              message:`atlas id ${id?.["@id"]} not found`
            }
          }
        }
        return
      }
      this.store.dispatch(
        atlasSelection.actions.selectAtlas({ atlas })
      )
      if (!!event.id) {
        return {
          jsonrpc: '2.0',
          id: event.id,
          result: null
        }
      }
      break
    }
    case 'selectParcellation': {
      if (!!event.id) {
        return {
          jsonrpc: '2.0',
          id: event.id,
          error: {
            code: -32601,
            message: `NYI`
          }
        }
      }
      break
    }
    case 'selectTemplate': {
      if (!!event.id) {
        return {
          jsonrpc: '2.0',
          id: event.id,
          error: {
            code: -32601,
            message: `NYI`
          }
        }
      }
      break
    }
    case 'navigateTo': {
      const { animate, ...navigation } = event.params as ApiBoothEvents['navigateTo']['request']
      this.store.dispatch(
        atlasSelection.actions.navigateTo({
          navigation,
          animation: !!animate
        })
      )
      if (!!event.id) {
        const timeoutDuration = !!animate
          ? 500
          : 0
        await new Promise(rs => setTimeout(rs, timeoutDuration))
        return {
          id: event.id,
          jsonrpc: '2.0',
          result: null
        }
      }
      break
    }
    case 'getUserToSelectARoi': {
      const { params, id } = event as JRPCRequest<'getUserToSelectARoi', ApiBoothEvents['getUserToSelectARoi']['request']>
      const { type, message } = params
      if (!params || (type !== "region" && type !== "point")) {
        return {
          id: event.id,
          jsonrpc: '2.0',
          error: {
            code: -32602,
            message: `type must be either region or point!`
          }
        }
      }
      let rs, rj
      const promise = new Promise<RequestUserTypes['region'] | RequestUserTypes['point']>((_rs, _rj) => {
        rs = _rs
        rj = _rj
      })
      this.requestUserQueue.push({
        message,
        promise,
        id,
        type: type as 'region' | 'point',
        rj,
        rs
      })
      this.requestUser$.next(
        this.requestUserQueue[0]
      )
      return promise.then(val => {
        return {
          id,
          jsonrpc: '2.0',
          result: val
        }
      })
    }
    case 'addAnnotations': {
      const { annotations } = event.params as ApiBoothEvents['addAnnotations']['request']
      const ann = annotations as (annotation.Annotation<'openminds'>)[]
      this.store.dispatch(
        annotation.actions.addAnnotations({
          annotations: ann
        })
      )
      if (event.id) {
        return {
          jsonrpc: '2.0',
          id: event.id,
          result: 'OK'
        }
      }
      break
    }
    case 'rmAnnotations': {
      const { annotations } = event.params as ApiBoothEvents['rmAnnotations']['request']
      this.store.dispatch(
        annotation.actions.rmAnnotations({
          annotations
        })
      )
      if (event.id){
        return {
          jsonrpc: '2.0',
          id: event.id,
          result: 'OK'
        }
      }
      break
    }
    case 'exit': {
      const { requests } = event.params as ApiBoothEvents['exit']['request']
      for (const req of requests) {
        await this.onRequest(req)
      }
      break
    }
    case 'cancelRequest': {
      const { id } = event.params as ApiBoothEvents['cancelRequest']['request']
      const idx = this.requestUserQueue.findIndex(q => q.id === id)
      if (idx < 0) {
        if (!!event.id) {
          return {
            jsonrpc: '2.0',
            id: event.id,
            error: {
              code: -1,
              message: `cancelRequest failed, request with id ${id} does not exist, or has already been resolved.`
            }
          }
        }
        return
      }
      const req = this.requestUserQueue.splice(idx, 1)
      req[0].rj(`client cancelled`)

      this.requestUser$.next(
        this.requestUserQueue[0]
      )

      if (!!event.id) {
        return {
          jsonrpc: '2.0',
          id: event.id,
          result: null
        }
      }
      break
    }
    default: {
      const message = `Method ${event.method} not found.`
      if (!!event.id) {
        return {
          jsonrpc: '2.0',
          id: event.id,
          error: {
            code: -32601,
            message
          }
        }
      }
    }
    }
  }
}
