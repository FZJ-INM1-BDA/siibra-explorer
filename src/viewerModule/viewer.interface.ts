import { EventEmitter } from "@angular/core";
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

export type TContextArg<K extends keyof IViewerCtx> = ({
  viewerType: K
  payload: IViewerCtx[K]
})

export enum EnumViewerEvt {
  VIEWERLOADED,
  VIEWER_CTX,
}

type TViewerEventViewerLoaded = {
  type: EnumViewerEvt.VIEWERLOADED
  data: boolean
}

export type TViewerEvent<T extends keyof IViewerCtx> = TViewerEventViewerLoaded |
  {
    type: EnumViewerEvt.VIEWER_CTX
    data: TContextArg<T>
  }

export type TSupportedViewers = keyof IViewerCtx

export interface IViewer<K extends keyof IViewerCtx> {
  
  selectedTemplate: any
  selectedParcellation: any
  viewerCtrlHandler?: IViewerCtrl
  viewerEvent: EventEmitter<TViewerEvent<K>>
}

export interface IGetContextInjArg {
  register: (fn: (contextArg: TContextArg<TSupportedViewers>) => void) => void
  deregister: (fn: (contextArg: TContextArg<TSupportedViewers>) => void) => void
}
