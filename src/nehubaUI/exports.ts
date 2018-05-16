import { NehubaModalService } from "nehubaUI/components/modal/nehubaUI.modal.component";
import { TemplateDescriptor, ParcellationDescriptor, RegionDescriptor } from "nehubaUI/nehuba.model";
import { Subject, BehaviorSubject } from "rxjs";
import { SearchResultInterface } from "nehubaUI/mainUI/searchResultUI/searchResultUI.component";

class PluginControl{
  loadExternalLibraries : (libraryNames:string[])=>Promise<any>  
  unloadExternalLibraries : (libraryNames:string[])=>void
  [key:string]:any
}

class UIHandle{
  modalControl : NehubaModalService
  filterResultBSubject : BehaviorSubject<string[]>
}

// export const UI_CONTROL = window['uiHandle'] = new UIHandle()

class ViewerHandle {
  setNavigationLoc : (loc:number[],realSpace?:boolean)=>void
  setNavigationOri : (ori:number[])=>void

  moveToNavigationLoc : (loc:number[],realSpace?:boolean)=>void
  moveToNavigationOri : (ori:number[])=>void

  setSliceViewZoom : (zoomlevel:number)=>void
  moveToSliceViewZoom : (zoomlevel:number)=>void

  setPerspectiveViewZoom : (zoomlevel:number)=>void
  moveToPerspectiveViewZoom : (zoomlevel:number)=>void

  setPerspectiveViewOrientation : (ori:number[])=>void
  moveToPerspectiveViewOrientation : (ori:number[])=>void

  showSegment : (labelIndex:number)=>void
  hideSegment : (labelIndex:number)=>void

  showAllSegments : ()=>void
  hideAllSegments : ()=>void

  segmentColorMap : Map<number,{red:number,green:number,blue:number}>
  reapplyColorMap : (colorMap:Map<number,{red:number,green:number,blue:number}>)=>void

  loadLayer : (layerObj:any)=>any[]
  removeLayer : (layerObj:any)=>string[]
  setLayerVisibility : (layerObj:any, visibility:boolean)=>string[]

  mouseEvent : Subject<{eventName:string,event:any}>
  mouseOverNehuba : BehaviorSubject<{nehubaOutput : any, foundRegion : RegionDescriptor | null}>
}

/** Class dealing with metadata */
class Metadata {

  /**
   * BehaviourSubject that emits a TemplateDescriptor object whenever a the template is selected (nullable)
   * 
   */
  selectedTemplateBSubject : BehaviorSubject<TemplateDescriptor|null>

  /**
   * BehaviourSubject that emits a ParcellationDescriptor object whenever a the parcellation is selected (nullable)
   * n.b. selection of template automatically causes template to be selected
   * 
   */
  selectedParcellationBSubject : BehaviorSubject<ParcellationDescriptor|null>

  /**
   * BehaviourSubject that emits an {Array} of RegionDescriptor objects whenever the list of selected regions changes
   */
  selectedRegionsBSubject : BehaviorSubject<RegionDescriptor[]>

  /**
   * Array of TemplateDescriptor objects loaded on init
   */
  loadedTemplates : TemplateDescriptor[]

  /**
   * Map mapping labelIndex (used by neuroglancer and nehuba) to the RegionDescriptor object.
   */
  regionsLabelIndexMap : Map<number,RegionDescriptor>

  /**
   * 
  */
  datasetsBSubject : BehaviorSubject<SearchResultInterface[]> = new BehaviorSubject([])

  viewerStateBSubject : BehaviorSubject<any|null>
}

const MOUSE_OVER_NEHUBA : BehaviorSubject<{nehubaOutput : any, foundRegion : RegionDescriptor | null}> = new BehaviorSubject({nehubaOutput : null, foundRegion : null})

const VIEWER_HANDLE = new ViewerHandle()
VIEWER_HANDLE.mouseOverNehuba = MOUSE_OVER_NEHUBA

const METADATA = new Metadata()
const UI_HANDLE = new UIHandle()
const PLUGIN_CONTROL = new PluginControl()

export const INTERACTIVE_VIEWER = {
  uiHandle : UI_HANDLE,
  viewerHandle : VIEWER_HANDLE,
  metadata : METADATA,
  pluginControl : PLUGIN_CONTROL
}

declare var window:{
  [key:string] : any
  prototype : Window;
  new() : Window;
}
window['interactiveViewer'] = INTERACTIVE_VIEWER