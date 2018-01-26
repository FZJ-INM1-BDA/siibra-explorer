import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Rx'

import { TemplateDescriptor, LabComponent, RegionDescriptor, ParcellationDescriptor, PluginDescriptor } from './nehuba.model'
import { NehubaModalService, ModalHandler } from './nehubaUI.modal.component'
import { NehubaViewer } from 'nehuba/NehubaViewer';
import { SelectTreePipe } from 'nehubaUI/nehubaUI.util.pipes';

declare var window:{
  [key:string] : any
  prototype : Window;
  new() : Window;
}

@Injectable()
export class MainController{
  private dataService : DataService
  /**
   * data
   */
  loadedTemplates : TemplateDescriptor[] = []

  selectedTemplate : TemplateDescriptor | undefined
  selectedParcellation : ParcellationDescriptor | undefined
  selectedRegions : RegionDescriptor[] = []

  regionsLabelIndexMap: Map<Number,RegionDescriptor> = new Map() // map NG segID to region descriptor

  /**
   * plugins
   */
  loadedWidgets : LabComponent[] = DEFAULT_WIDGETS.map(json=>new LabComponent(json))

  /**
   * hooks
   */

  onTemplateSelectionHook : (()=>void)[] = []
  afterTemplateSelectionHook : (()=>void)[] = []
  onParcellationSelectionHook : (()=>void)[] = []
  afterParcellationSelectionHook : (()=>void)[] = []

  /**
   * style
   */

  darktheme : boolean

  nehubaViewer : NehubaViewer
  nehubaViewerSegmentMouseOver : any

  /* to be moved to viewer or viewercontainer */
  shownSegmentsObserver : any

  constructor(){
    this.dataService = new DataService()

    if( this.testRequirement() ){
      this.init()
      this.attachInternalHooks()
      this.hookAPI()
    }

    /* TODO reconsider if this is a good idea */
    HelperFunctions.sFindRegion = this.findRegionWithId
  }

  testRequirement():boolean{
    
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl')
    const message:any = {
      Error:['Your browser does not meet the minimum requirements to run neuroglancer.']
    }
    if(!gl){
      message['Detail'] = 'Your browser does not support WebGL.'
      
      const modalHandler = <ModalHandler>UI_CONTROL.modalControl.getModalHandler()
      modalHandler.title = `<h4>Error</h4>`
      modalHandler.body = message
      modalHandler.footer = null
      modalHandler.show()
      return false
    }
    
    const drawbuffer = gl.getExtension('WEBGL_draw_buffers')
    const texturefloat = gl.getExtension('OES_texture_float')
    const indexuint = gl.getExtension('OES_element_index_uint')
    if( !(drawbuffer && texturefloat && indexuint) ){
      const detail = `Your browser does not support 
      ${ !drawbuffer ? 'WEBGL_draw_buffers' : ''} 
      ${ !texturefloat ? 'OES_texture_float' : ''} 
      ${ !indexuint ? 'OES_element_index_uint' : ''} `
      message['Detail'] = [detail]
      
      const modalHandler = <ModalHandler>UI_CONTROL.modalControl.getModalHandler()
      modalHandler.title = `<h4>Error</h4>`
      modalHandler.body = message
      modalHandler.footer = null
      modalHandler.show()
      return false
    }
    return true
  }

  init(){
    /* this will need to come from elsewhere eventually */
    // let datasetArray = [
    //   'https://neuroglancer-dev.humanbrainproject.org/res/json/bigbrain.json',
    //   'https://neuroglancer-dev.humanbrainproject.org/res/json/colin.json',
    //   'https://neuroglancer-dev.humanbrainproject.org/res/json/waxholmRatV2_0.json',
    //   'https://neuroglancer-dev.humanbrainproject.org/res/json/allenMouse.json'
    // ]

    let datasetArray = [
      'http://localhost:5080/res/json/colin.json',
      'http://localhost:5080/res/json/bigbrain.json'
    ]

    datasetArray.forEach(dataset=>{
      this.dataService.fetchJson(dataset)
        .then((json:any)=>{
          this.dataService.parseTemplateData(json)
            .then( template =>{
              this.loadedTemplates.push( template )
            })
            .catch(e=>{
              console.log(e)
            })
          })
        .catch((e:any)=>{
          console.log('fetch init dataset error',e)
        })
      })
  }

  attachInternalHooks(){


    /**
     * to be moved to viewer or viewerContainer
     */
    this.onParcellationSelectionHook.push(()=>{
      if (this.shownSegmentsObserver) this.shownSegmentsObserver.unsubscribe()
    })
    this.afterParcellationSelectionHook.push(this.applyNehubaMeshFix)
  }

  hookAPI(){
    
    UI_CONTROL.onTemplateSelection = (cb:()=>void) => this.onTemplateSelectionHook.push(cb)
    UI_CONTROL.afterTemplateSelection = (cb:()=>void) => this.afterTemplateSelectionHook.push(cb)
    UI_CONTROL.onParcellationSelection = (cb:()=>void) => this.onParcellationSelectionHook.push(cb)
    UI_CONTROL.afterParcellationSelection = (cb:()=>void) => this.onParcellationSelectionHook.push(cb)

    VIEWER_CONTROL.reapplyNehubaMeshFix = this.applyNehubaMeshFix
    VIEWER_CONTROL.mouseOverNehuba = new Subject()
  }

  /**
   * control functions
   */

  unloadTemplate():void{

  }

  loadTemplate(templateDescriptor:TemplateDescriptor):void{
    
    if ( this.selectedTemplate == templateDescriptor ){
      return
    } 
    // else if( this.selectedTemplate ) {
    //   this.unloadTemplate()
    // }

    this.onTemplateSelectionHook.forEach(cb=>cb())

    VIEWER_CONTROL.loadTemplate(templateDescriptor)
    this.selectedTemplate = templateDescriptor

    this.darktheme = this.selectedTemplate.useTheme == 'dark'
    EXTERNAL_CONTROL.metadata.selectedTemplate = this.selectedTemplate
    
    this.afterTemplateSelectionHook.forEach(cb=>cb())

    /**
     * temporary workaround. 
     */
    setTimeout(()=>{
      this.loadParcellation( templateDescriptor.parcellations[0] )
      this.sendUISelectedRegionToViewer()
    })

    /* TODO potentially breaks. selectedRegions should be cleared after each loadParcellation */
    EXTERNAL_CONTROL.metadata.selectedRegions = []
  }

  loadParcellation(parcellation:ParcellationDescriptor):void{
    if( this.selectedParcellation == parcellation ){
      return
    }
    
    this.onParcellationSelectionHook.forEach(cb=>cb())

    this.selectedParcellation = parcellation
    this.selectedRegions = []

    const mapRegions = (regions:RegionDescriptor[])=>{
      regions.forEach((region:RegionDescriptor)=>{
        if(region.labelIndex){
          this.regionsLabelIndexMap.set(region.labelIndex,region)
        }
        if(region.children){
          mapRegions(region.children)
        }
      })
    }
    this.regionsLabelIndexMap.clear()
    mapRegions(this.selectedParcellation!.regions)

    /* TODO temporary measure, until nehubaViewer has its own way of controlling layers 
    also untested for multiple parcellations
    */
    this.selectedTemplate!.parcellations.forEach((parcellation:ParcellationDescriptor)=>{
      window.viewer.layerManager.getLayerByName( parcellation.ngId ).setVisible(false)
    })

    window.viewer.layerManager.getLayerByName( this.selectedParcellation!.ngId ).setVisible(true)
    this.nehubaViewer.redraw()

    this.updateRegionDescriptors( this.nehubaViewer.getShownSegmentsNow({name:this.selectedParcellation!.ngId}) )

    /* populate the metadata object */
    EXTERNAL_CONTROL.metadata.selectedParcellation = this.selectedParcellation

    this.afterParcellationSelectionHook.forEach(cb=>cb())
  }

  updateRegionDescriptors(labelIndices:number[]){
    EXTERNAL_CONTROL.metadata.selectedRegions = []
    this.regionsLabelIndexMap.forEach(region=>region.enabled=false)
    labelIndices.forEach(idx=>{
      const region = this.regionsLabelIndexMap.get(idx)
      if(region) {
        region.enabled = true
        EXTERNAL_CONTROL.metadata.selectedRegions.push(region)
      }
    })
  }
  
  findRegionWithId(id : number|null):RegionDescriptor|null{
    if( id == null || id == 0 || !this.selectedParcellation ) return null
    const searchThroughChildren : (regions:RegionDescriptor[])=>RegionDescriptor|null = (regions:RegionDescriptor[]) => {
      const matchedRegion = regions.find(region=> region.labelIndex !== undefined && region.labelIndex == id)
      if(matchedRegion) return matchedRegion
      const searchedChildren = regions.map(region=>searchThroughChildren(region.children)).find(child=>child!==null)
      return searchedChildren ? searchedChildren : null
    }
    const searchResult = searchThroughChildren(this.selectedParcellation.regions)
    return searchResult ? searchResult : null
  }
  
  sendUISelectedRegionToViewer(){
    if(!this.selectedParcellation){
      return
    }
    const treePipe = new SelectTreePipe(); //oh how I hate to use semi colon
    (new Promise((resolve)=>{
      resolve( treePipe.transform(this.selectedParcellation!.regions)
        .map(region=>region.labelIndex) )
    }))
      .then((segments:number[])=>{
        if(segments.length==0){
          VIEWER_CONTROL.showAllSegments()
        }else{
          VIEWER_CONTROL.hideAllSegments()
          segments.forEach(seg=>VIEWER_CONTROL.showSegment(seg))
        }
      })
  }

  loadWidget(labComponent:LabComponent){
    HelperFunctions.sLoadPlugin(labComponent)
  }

  /**
   * hibernating functions
   */
  
  fetchedSomething(sth:any){
    switch( sth.constructor ){
      case TemplateDescriptor:{

      }break;
      case ParcellationDescriptor:{
        if (!this.selectedTemplate){
          //TODO add proper feedback
          console.log('throw error: maybe you should selected a template first')
        }else {
          this.selectedTemplate.parcellations.push(sth)
        }
      }break;
      case PluginDescriptor:{
        
      }break;
    }
  }

  /**
   * to be migrated to viewerContainer or viewer
   */
  applyNehubaMeshFix = () =>{
    
    this.nehubaViewer.clearCustomSegmentColors()
    if( this.selectedParcellation ){
      this.nehubaViewer.setMeshesToLoad( Array.from(this.selectedParcellation.colorMap.keys()) )
      this.nehubaViewer.batchAddAndUpdateSegmentColors( this.selectedParcellation.colorMap )
    }

    const shownSegmentsObservable = this.nehubaViewer.getShownSegmentsObservable()
    this.shownSegmentsObserver = shownSegmentsObservable.subscribe(segs=>{
      this.updateRegionDescriptors(segs)

      if( this.selectedParcellation ){
        if( this.selectedParcellation.surfaceParcellation ){
          //TODO need to test init condition... if selectedRegions is a subset of total regions, what happens?
          if( segs.length == 0 ){
            this.nehubaViewer.clearCustomSegmentColors()
            this.nehubaViewer.batchAddAndUpdateSegmentColors( this.selectedParcellation.colorMap )
          }else{
            const newColormap = new Map()
            const blankColor = {red:255,green:255,blue:255}
            this.selectedParcellation.colorMap.forEach((activeValue,key)=>{
              newColormap.set(key, segs.find(seg=>seg==key) ? activeValue : blankColor)
            })
            this.nehubaViewer.clearCustomSegmentColors()
            this.nehubaViewer.batchAddAndUpdateSegmentColors( newColormap )
          }
        }
      }
    })
  }

  /**
   * to be migrated to region view
   */
  
  multilvlExpansionTreeShake = (ev:any):void=>{
    /* this event should in theory not happen, but catching just in case */
    if( !this.selectedParcellation ){
      return
    }

    /* bind search term to searchTerm */
    const searchTerm = ev

    /* timeout is necessary as otherwise, treeshaking collapses based on the previous searchTerm */
    setTimeout(()=>{
      if( searchTerm != '' ){
        const propagate = (arr:RegionDescriptor[])=>arr.forEach(item=>{
          item.isExpanded = item.hasVisibleChildren()
          propagate(item.children)
        })
        if(this.selectedParcellation)propagate(this.selectedParcellation.regions)
      }
    })
  }
}

class DataService {

  /* simiple fetch promise for json obj */
  /* nb: return header must contain Content-Type : application/json */
  /* nb: return header must container CORS header */
  /* or else an error will be thrown */

  fetchJson(url:string):Promise<any>{
    return Promise.race([
      fetch( url )
        .then( response =>{
          return response.json()
        })
        .then(json => {
          return json
        }),
      new Promise((_,reject)=>{
        setTimeout(()=>{
          reject('fetch request did not receive any response. Timeout after '+TIMEOUT+'ms')
        },TIMEOUT)
      })
    ])
  }

  parseTemplateData(json:any):Promise<TemplateDescriptor>{
    return new Promise((resolve,_)=>{
      resolve(new TemplateDescriptor(json))
    })
  }

  parseJson(json:any){
    switch(json.type){
      // case 'template':{
      //   this.inputResponse += 'Adding new Template. '
      //   this.nehubaFetchData.parseTemplateData(json)
      //     .then( template =>{
      //       this.fetchedOutputToController(template)
      //     })
      //     .catch( e=>{
      //       this.inputResponse += 'Error.'
      //       this.inputResponse += e.toString()
      //       console.log(e)
      //     })
      // }break;
      // case 'parcellation':{
        
      // }break;
      // case 'plugin':{
      //   /* some sort of validation process? */
      //   this.inputResponse += 'Adding new plugin.'
      //   const newPlugin = new PluginDescriptor(json)
      //   this.fetchedOutputToController(newPlugin)
      // }break;
      // default:{
      //   this.inputResponse += '\'type\' field not found.. Unable to process this JSON.'
      // }break;
    }
  }
}

/** usage
 * 1) construct a new animation object with duration and (in the future) method
 * 2) use call generate() to return an iterator
 * 3) use requestanimationframe to get an object in the form of {value:number,done:boolean}
 * 4) number traverse from 0 - 1 corresponding to the fraction of animation completed
 * 
 * nb: do not inject. Start new instance each time. startTime is needed for each Animation.
 */
export class Animation{

  duration:number
  method:string
  startTime : number

  constructor(duration:number,method:string){
    this.duration = duration
    this.method = method
    this.startTime = Date.now()
  }

  *generate():IterableIterator<number>{
    while(( Date.now() - this.startTime ) / this.duration < 1 ){
      yield ( Date.now() - this.startTime ) / this.duration
    }
    return 1
  }
}

export class HelperFunctions{
  static sLoadPlugin : (labComponent : LabComponent)=>void
  static sFindRegion : (id : Number|null) => RegionDescriptor | null
}

let metadata : any = {}

export const EXTERNAL_CONTROL = window['nehubaUI'] = {
  metadata : metadata
}

class UIHandle{
  onTemplateSelection : (cb:()=>void)=>void
  afterTemplateSelection : (cb:()=>void)=>void
  onParcellationSelection : (cb:()=>void)=>void
  afterParcellationSelection : (cb:()=>void)=>void
  modalControl : NehubaModalService
}

export const UI_CONTROL = window['uiHandle'] = new UIHandle()

class ViewerHandle {
  loadTemplate : (TemplateDescriptor:TemplateDescriptor)=>void

  onViewerInit : (cb:()=>void)=>void
  afterViewerInit : (cb:()=>void)=>void
  onViewerDestroy : (cb:()=>void)=>void

  setNavigationLoc : (loc:number[],realSpace?:boolean)=>void
  setNavigationOrientation : (ori:number[])=>void

  moveToNavigationLoc : (loc:number[],realSpace?:boolean)=>void

  showSegment : (segId:number)=>void
  hideSegment : (segId:number)=>void
  showAllSegments : ()=>void
  hideAllSegments : ()=>void

  loadLayer : (layerObj:Object)=>void
  reapplyNehubaMeshFix : ()=>void

  mouseEvent : Subject<{eventName:string,event:any}>
  mouseOverNehuba : Subject<{nehubaOutput : any, foundRegion : RegionDescriptor | null}>
}

export const VIEWER_CONTROL = window['viewerHandle'] = new ViewerHandle()
export const PLUGIN_CONTROL : any = window['pluginControl'] = {}
export const HELP_MENU = {
  'Mouse Controls' : {
    "Left-drag" : "within a slice view to move within that plane",
    "Shift + Left-drag" : "within a slice view to change the rotation of the slice views",
    "Mouse-Wheel" : "up or down to zoom in and out.",
    "Ctrl + Mouse-Wheel" : "moves the navigation forward and backward",
    "Ctrl + Right-click" : "within a slice to teleport to that location"
    },
    'Keyboard Controls' : {
    "tobe":"completed"
    }
}

/**
 * 
 */

export const PRESET_COLOR_MAPS = 
  [{
      name : 'MATLAB_autumn',
      previewurl : "http://172.104.156.15:8080/colormaps/MATLAB_autumn.png",
      code : `vec4 colormap(float x) {float g = clamp(x,0.0,1.0);return vec4(1.0,g,0.0,1.0);}`
  },{
      name : 'MATLAB_bone',
      previewurl : 'http://172.104.156.15:8080/colormaps/MATLAB_bone.png',
      code : `float colormap_red(float x) {  if (x < 0.75) {    return 8.0 / 9.0 * x - (13.0 + 8.0 / 9.0) / 1000.0;  } else {    return (13.0 + 8.0 / 9.0) / 10.0 * x - (3.0 + 8.0 / 9.0) / 10.0;  }}float colormap_green(float x) {  if (x <= 0.375) {    return 8.0 / 9.0 * x - (13.0 + 8.0 / 9.0) / 1000.0;  } else if (x <= 0.75) {    return (1.0 + 2.0 / 9.0) * x - (13.0 + 8.0 / 9.0) / 100.0;  } else {    return 8.0 / 9.0 * x + 1.0 / 9.0;  }}float colormap_blue(float x) {  if (x <= 0.375) {    return (1.0 + 2.0 / 9.0) * x - (13.0 + 8.0 / 9.0) / 1000.0;  } else {    return 8.0 / 9.0 * x + 1.0 / 9.0;  }}vec4 colormap(float x) {  float r = clamp(colormap_red(x),0.0,1.0);  float g = clamp(colormap_green(x), 0.0, 1.0);  float b = clamp(colormap_blue(x), 0.0, 1.0);  return vec4(r, g, b, 1.0);}      `
  }]

export const CM_MATLAB_HOT = `float r=clamp(8.0/3.0*x,0.0,1.0);float g=clamp(8.0/3.0*x-1.0,0.0,1.0);float b=clamp(4.0*x-3.0,0.0,1.0);`
export const TIMEOUT = 5000;
export const CM_THRESHOLD = 0.01;
export const PMAP_WIDGET = {
  name : `PMap`,
  icon : 'picture',
  script : 
  `
  (()=>{
    window.nehubaViewer.ngviewer.layerManager.getLayerByName('PMap').setVisible(true)
    let encodedValue = document.getElementById('default.default.pmap.encodedValue')
    
    const attach = ()=>{
      const sub = window.nehubaViewer.mouseOver.image.filter(ev=>ev.layer.name=='PMap').subscribe(ev=>encodedValue.innerHTML = (!ev.value || ev.value == 0) ? '' : Math.round(ev.value * 1000)/1000)
      window.pluginControl['PMap'].onShutdown(()=>{
        sub.unsubscribe()
        window.nehubaViewer.ngviewer.layerManager.getLayerByName('PMap').setVisible(false)
        window.viewerHandle.hideSegment(0)
      })
    }
    attach()
  })()
  `,
  template : `
  <table class = "table table-sm table-bordered">
    <tbody>
      <tr>
        <td>Heat Map</td>
      </tr>
      <tr>
        <td><img class="col-md-12" src="http://172.104.156.15:8080/colormaps/MATLAB_hot.png"></td>
      </tr>
      <tr>
        <td>
          <table class = "table table-sm table-bordered">
            <tbody>
              <tr>
                <td class = "col-sm-6">Encoded Value</td>
                <td class = "col-sm-6" id = "default.default.pmap.encodedValue"></td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td>Close this dialogue to resume normal browsing.</td>
      </tr>
    </tbody>
  </table>
  `
}

/* temporary workaround for fetching plugin data */
// export const TEMP_PLUGIN_DOMAIN = `https://neuroglancer-dev.humanbrainproject.org/res/`
export const TEMP_PLUGIN_DOMAIN = `http://localhost:5080/res/`

export const DEFAULT_WIDGETS = [
  {
    name : "fzj.xg.advancedMode",
    templateURL:TEMP_PLUGIN_DOMAIN + "advancedMode/advancedMode.html",
    scriptURL:TEMP_PLUGIN_DOMAIN + "advancedMode/advancedMode.js"
  },{
    "name":"fzj.xg.meshAnimator",
    "templateURL":TEMP_PLUGIN_DOMAIN + "html/meshAnimator.html",
    "scriptURL":TEMP_PLUGIN_DOMAIN + "js/meshAnimator.js"
  },{
    "name":"fzj.xg.localNifti",
    "type":"plugin",
    "templateURL":TEMP_PLUGIN_DOMAIN + "html/localNifti.html",
    "scriptURL":TEMP_PLUGIN_DOMAIN + "js/localNifti.js"
  }
]