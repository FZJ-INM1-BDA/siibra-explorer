import { Observable } from "rxjs";

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

type TViewerEventMOAnno = {
  type: "MOUSEOVER_ANNOTATION"
  data: any
}

type TViewerEventViewerLoaded = {
  type: "VIEWERLOADED",
  data: boolean
}

export type TViewerEvent = TViewerEventMOAnno | TViewerEventViewerLoaded

export type IViewer = {
  
  selectedTemplate: any
  selectedParcellation: any
  viewerCtrlHandler?: IViewerCtrl
  viewerEvents$: Observable<TViewerEvent>
}