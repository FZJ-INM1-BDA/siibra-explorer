import { EventEmitter } from "@angular/core";
import { RecursivePartial } from "./nehuba/config.service/type";
import { TNehubaContextInfo } from "./nehuba/types";
import { TThreeSurferContextInfo } from "./threeSurfer/types";

type TLayersColorMap = Map<string, Map<number, { red: number, green: number, blue: number }>>

interface IViewerCtrl {

  // navigation control
  setNavigationLoc(coord: number[], realSpace?: boolean): void
  moveToNavigationLoc(coord: number[], realSpace?: boolean): void
  setNavigationOri(quat: number[]): void
  moveToNavigationOri(quat: number[]): void

  // segment control
  showSegment(segment: any): void
  hideSegment(segment: any): void
  showAllSegments(): void
  hideAllSegments(): void

  // landmark control
  addLandmarks(landmarks: any[]): void
  removeLandmarks(landmarks: any[]): void

  // layer control
  addLayer(layerSpec: any): void
  removeLayer(layerId: string): void
  applyLayersColourMap(map: TLayersColorMap): void
  getLayersColourMap(): TLayersColorMap
}

export interface IViewerCtx {
  'nehuba': TNehubaContextInfo
  'threeSurfer': TThreeSurferContextInfo
}

export type ViewerType = "nehuba" | "threeSurfer"

export type TViewerEvtCtxData<K extends ViewerType=ViewerType> = ({
  viewerType: K
  payload: RecursivePartial<IViewerCtx[K]>
})

export enum EnumViewerEvt {
  VIEWERLOADED,
  VIEWER_CTX,
}

export type TViewerEventViewerLoaded = {
  type: EnumViewerEvt.VIEWERLOADED
  data: boolean
}

type TViewerEventCtx<T extends ViewerType=ViewerType> = {
  type: EnumViewerEvt.VIEWER_CTX
  data: TViewerEvtCtxData<T>
}

export type TViewerEvent<
  T extends ViewerType=ViewerType
> = TViewerEventViewerLoaded | TViewerEventCtx<T>

export function isViewerCtx(ev: TViewerEvent): ev is TViewerEventCtx {
  return ev.type === EnumViewerEvt.VIEWER_CTX
}

export function isNehubaVCtxEvt(ev: TViewerEvent): ev is TViewerEventCtx<"nehuba"> {
  return ev.type === EnumViewerEvt.VIEWER_CTX && ev.data.viewerType === "nehuba"
}

export function isThreeSurferVCtxEvt(ev: TViewerEvent): ev is TViewerEventCtx<"threeSurfer"> {
  return ev.type === EnumViewerEvt.VIEWER_CTX && ev.data.viewerType === "threeSurfer"
}

export type TSupportedViewers = ViewerType

export interface IViewer<K extends ViewerType> {
  viewerCtrlHandler?: IViewerCtrl
  viewerEvent: EventEmitter<TViewerEvent<K>>
}

export interface IGetContextInjArg {
  register: (fn: (contextArg: TViewerEvtCtxData<TSupportedViewers>) => void) => void
  deregister: (fn: (contextArg: TViewerEvtCtxData<TSupportedViewers>) => void) => void
}
