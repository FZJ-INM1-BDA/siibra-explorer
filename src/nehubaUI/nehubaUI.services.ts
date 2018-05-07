import { TemplateRef, Injectable, ComponentRef, ViewContainerRef } from '@angular/core';
import { Subject,BehaviorSubject,Observable } from 'rxjs/Rx'
import { Multilevel, Landmark, WidgitiseTempRefMetaData, Dataset } from './nehuba.model'

import { TemplateDescriptor, LabComponent, RegionDescriptor, ParcellationDescriptor, LabComponentHandler } from './nehuba.model'
import { ModalHandler } from 'nehubaUI/components/modal/nehubaUI.modal.component'
import { NehubaViewer } from 'nehuba/NehubaViewer'
import { UrlHashBinding } from 'neuroglancer/ui/url_hash_binding'
import { LayerManager } from 'neuroglancer/layer'
import { WidgetComponent, FloatingWidgetView } from 'nehubaUI/components/floatingWindow/nehubaUI.widgets.component'
import { ManagedUserLayerWithSpecification } from 'neuroglancer/layer_specification'
import { SingleMeshUserLayer } from 'neuroglancer/single_mesh_user_layer'
import { MultilevelSelector } from 'nehubaUI/components/multilevel/nehubaUI.multilevel.component'
import { INTERACTIVE_VIEWER } from 'nehubaUI/exports';
import { SearchResultInterface } from 'nehubaUI/mainUI/searchResultUI/searchResultUI.component';
import { Chart } from 'chart.js'

declare var window:{
  [key:string] : any
  prototype : Window;
  new() : Window;
}

@Injectable()
export class MainController{
  private dataService : DataService = new DataService()

  /**
   * data
   */
  loadedTemplates : TemplateDescriptor[] = []

  selectedTemplate : TemplateDescriptor | undefined
  selectedParcellation : ParcellationDescriptor | undefined

  selectedRegions : RegionDescriptor[] = []

  selectedTemplateBSubject : BehaviorSubject<TemplateDescriptor|null> = new BehaviorSubject(null)
  selectedParcellationBSubject : BehaviorSubject<ParcellationDescriptor|null> = new BehaviorSubject(null)
  selectedRegionsBSubject : BehaviorSubject<RegionDescriptor[]> = new BehaviorSubject([])

  regionsLabelIndexMap: Map<number,RegionDescriptor> = new Map() // map NG segID to region descriptor
  

  viewerStateBSubject : BehaviorSubject<any|null> = new BehaviorSubject(null)

  /* viewingMode v2.0 */
  resultsFilterBSubject : BehaviorSubject<string[]> = new BehaviorSubject([])

  /* dedicated view */
  dedicatedViewBSubject : BehaviorSubject<string|null> = new BehaviorSubject(null)

  /**
   * plugins
  */
  loadedPlugins : LabComponent[] = []

  /**
   * style
   */

  darktheme : boolean
  nehubaViewer : NehubaViewer

  constructor(){
    
    if( this.testRequirement() ){
      this.init()
      this.attachInternalHooks()
      this.hookAPI()
      this.patchNG()
    }
  }

  private parseQueryString(locationSearch:string){
    const query = new URLSearchParams(locationSearch)
    
    Array.from(query.entries()).forEach(keyval=>{
      switch(keyval[0]){
        case 'dedicatedView':{
          this.dedicatedViewBSubject.next(keyval[1])
        }break;
        case 'selectedTemplate':{
          const template = this.loadedTemplates.find(template=>template.name==keyval[1])
          if(template) this.selectedTemplateBSubject.next(template)
        }break;
        case 'resultsFilter':{
          this.resultsFilterBSubject.next(keyval[1].split('_'))
        }break;
        case 'selectedRegions':{
          const selectedRegions = keyval[1].split('_')
            .map(idx=>Number(idx))
            .filter(idx=>this.regionsLabelIndexMap.get(idx))
            .map(idx=>this.regionsLabelIndexMap.get(idx)!)

          /* this is needed for now as fresh start seem to wipe selected regions */
          /* TODO properly do parse query string so this workaround is not needed */
          /* TODO get rid of the settimeout */
          this.selectedRegionsBSubject.next(selectedRegions)
        }break;
        case 'viewerState':{
          const [o,po,pz,p,z] = keyval[1].split('__')

          INTERACTIVE_VIEWER.viewerHandle.setSliceViewZoom( Number(z) )
          INTERACTIVE_VIEWER.viewerHandle.setPerspectiveViewZoom( Number(pz) )
          INTERACTIVE_VIEWER.viewerHandle.setPerspectiveViewOrientation( po.split('_').map(n=>Number(n)) )
          INTERACTIVE_VIEWER.viewerHandle.setNavigationOri( o.split('_').map(n=>Number(n)))
          INTERACTIVE_VIEWER.viewerHandle.setNavigationLoc( p.split('_').map(s=>Number(s)) ,true)
        }break;
      }
    })
  }

  createDisposableWidgets : (widgetComponent:WidgetComponent)=>any

  /* TODO reimplement modal warning */
  testRequirement():boolean{
    
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl')
    const message:any = {
      Error:['Your browser does not meet the minimum requirements to run neuroglancer.']
    }

    if(!gl){
      message['Detail'] = 'Your browser does not support WebGL.'
      
      /* TODO figure out a way to do without settimeout */
      setTimeout(()=>{
        const modalHandler = <ModalHandler>INTERACTIVE_VIEWER.uiHandle.modalControl.getModalHandler()
        modalHandler.title = `<h4>Error</h4>`
        modalHandler.body = message
        modalHandler.footer = null
        modalHandler.show()
      })
      return false
    }
    
    const drawbuffer = gl.getExtension('WEBGL_draw_buffers')
    const texturefloat = gl.getExtension('OES_texture_float')
    const indexuint = gl.getExtension('OES_element_index_uint')
    if( !(drawbuffer && texturefloat && indexuint) ){

      /* TODO figure out a way to do without settimeout */
      setTimeout(()=>{
        const detail = `Your browser does not support 
        ${ !drawbuffer ? 'WEBGL_draw_buffers' : ''} 
        ${ !texturefloat ? 'OES_texture_float' : ''} 
        ${ !indexuint ? 'OES_element_index_uint' : ''} `
        message['Detail'] = [detail]
        
        const modalHandler = <ModalHandler>INTERACTIVE_VIEWER.uiHandle.modalControl.getModalHandler()
        modalHandler.title = `<h4>Error</h4>`
        modalHandler.body = message
        modalHandler.footer = null
        modalHandler.show()
      })
      return false
    }
    return true
  }

  init(){

    /* dev option, use a special endpoint to fetch all plugins */
    fetch('http://localhost:5080/collectPlugins')
      .then(res=>res.json())
      .then(arr=>this.loadedPlugins = (<Array<any>>arr).map(json=>new LabComponent(json)))
      .catch(console.warn)

    this.dataService.fetchTemplates
      .then((this.dataService.fetchTemplatesData).bind(this.dataService))
      .then(templates=>(this.loadedTemplates = templates,INTERACTIVE_VIEWER.metadata.loadedTemplates = templates,Promise.resolve()))
      .then(()=>this.parseQueryString( window.location.search ))
    .catch((e:any)=>{
      console.error('fetching initial dataset error',e)
    })
  }

  patchNG(){
    UrlHashBinding.prototype.setUrlHash = ()=>{
      // console.log('seturl hash')
      // console.log('setting url hash')
    }

    UrlHashBinding.prototype.updateFromUrlHash = ()=>{
      // console.log('update hash binding')
    }

    /* TODO find a more permanent fix to disable double click */
    LayerManager.prototype.invokeAction = (arg) => {
      const foundRegion = INTERACTIVE_VIEWER.viewerHandle.mouseOverNehuba.getValue().foundRegion
      if(arg=='select'&&foundRegion){
        const idx = this.selectedRegions.findIndex(r=>r.name==foundRegion.name)
        if(idx>=0){
          this.selectedRegionsBSubject.next(this.selectedRegions.filter((_,i)=>i!=idx))
        }else{
          this.selectedRegionsBSubject.next(this.selectedRegions.concat(foundRegion))
        }
      }
    }

    /* temp */
    window['unloadNG'] = (this.unloadTemplate).bind(this)
  }

  attachInternalHooks(){

    this.selectedParcellationBSubject.subscribe(parcellation=>{
      if(parcellation)this.loadParcellation(parcellation)
    })

    this.selectedTemplateBSubject.subscribe((templateDescriptor)=>{
      if(templateDescriptor){
        this.loadTemplate(templateDescriptor)
        this.selectedParcellationBSubject.next(templateDescriptor.parcellations[0])
      }
    })
    
    this.selectedTemplateBSubject
      .subscribe(()=>{
        /* 
        as new templates (and potentially new parcellations in the future) has different search results
        the filters are cleared when a new template is selected
        */
        this.resultsFilterBSubject.next([])
      })

    this.selectedRegionsBSubject.debounceTime(10).subscribe(regions=>{
      this.selectedRegions = regions
    })

    const merged = Observable.merge(
      Observable.from(this.dedicatedViewBSubject)
        .skip(1)
        .map(dedicatedView=>({'dedicatedView':dedicatedView})),
      Observable.from(this.selectedTemplateBSubject
        .skip(1)
        .map(template=>({ 'selectedTemplate' : template ? template.name: null }))),
      Observable.from(this.selectedParcellationBSubject
        .skip(1)
        .map(parcellation=>({'selectedParcellation' : parcellation ? parcellation.name : null}))),
      Observable.from(this.resultsFilterBSubject
        .skip(1)
        .map(m=>({ 'resultsFilter' : m.join('_') }))),
      Observable.from(this.selectedRegionsBSubject
        .skip(1) /* need to skip the first one, as the behaviour subject will always emit an empty array on init */
        .debounceTime(100)
        .map(regions=>({
          'selectedRegions':regions.map(region=>region.labelIndex).join('_')
        }))
      ),
      Observable.from(this.viewerStateBSubject)
        .skip(1)
        .debounceTime(150)
        .map(obj=>({
          'viewerState' : [
            obj.orientation.join('_'),
            obj.perspectiveOrientation.join('_'),
            obj.perspectiveZoom,
            obj.position.join('_'),
            obj.zoom
          ].join('__')
        }))
    )
    
    merged
      .subscribe((keyval:any)=>{
        const url = new URL( window.location )
        const search = new URLSearchParams( window.location.search )
        Object.keys(keyval).forEach(key=>{
          keyval[key] ? search.set(key,keyval[key]) : search.delete(key)
        })

        url.search = search.toString()
        history.replaceState(null,'',url.toString())
      })
      
  }

  hookAPI(){

    INTERACTIVE_VIEWER.metadata.selectedParcellationBSubject = this.selectedParcellationBSubject
    INTERACTIVE_VIEWER.metadata.selectedRegionsBSubject = this.selectedRegionsBSubject
    INTERACTIVE_VIEWER.metadata.selectedTemplateBSubject = this.selectedTemplateBSubject
    INTERACTIVE_VIEWER.metadata.viewerStateBSubject = this.viewerStateBSubject

    INTERACTIVE_VIEWER.uiHandle.filterResultBSubject = this.resultsFilterBSubject
  }

  /**
   * control functions
   */

  unloadTemplate():void
  {
    this.selectedTemplateBSubject.next(null)
  }

  loadTemplate(templateDescriptor:TemplateDescriptor):void
  {
    
    if ( this.selectedTemplate == templateDescriptor ){
      return
    } 
    
    this.selectedTemplate = templateDescriptor
    this.darktheme = templateDescriptor.useTheme == 'dark'
  }

  loadParcellation(parcellation:ParcellationDescriptor):void
  {

    this.selectedParcellation = parcellation

    /* TODO is this the best placce to clear all selected regions? */
    this.selectedRegionsBSubject.next([])

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

    INTERACTIVE_VIEWER.metadata.regionsLabelIndexMap = this.regionsLabelIndexMap
  }

  /* TODO figure out a more elegant way to watch array for changes */
  // regionSelectionChanged()
  // {
  //   this.passCheckSetMode(this.viewingMode)
  // }
  
  /* should really use this.regionsLabelIndexMap */
  // findRegionWithId(id : number|null):RegionDescriptor|null
  // {
  //   if( id == null || id == 0 || !this.selectedParcellation ) return null
  //   const searchThroughChildren : (regions:RegionDescriptor[])=>RegionDescriptor|null = (regions:RegionDescriptor[]) => {
  //     const matchedRegion = regions.find(region=> region.labelIndex !== undefined && region.labelIndex == id)
  //     if(matchedRegion) return matchedRegion
  //     const searchedChildren = regions.map(region=>searchThroughChildren(region.children)).find(child=>child!==null)
  //     return searchedChildren ? searchedChildren : null
  //   }
  //   const searchResult = searchThroughChildren(this.selectedParcellation.regions)
  //   return searchResult ? searchResult : null
  // }
  
  // sendUISelectedRegionToViewer()
  // {
  //   if(!this.selectedParcellation){
  //     return
  //   }

  //   /* find better way to implement this */
  //   const treePipe = new SelectTreePipe(); //oh how I hate to use semi colon
  //   (new Promise((resolve)=>{
  //     resolve( treePipe.transform(this.selectedParcellation!.regions)
  //       .map(region=>region.labelIndex) )
  //   }))
  //     .then((segments:number[])=>{
  //       segments
  //       // if(segments.length==0){
  //       //   VIEWER_CONTROL.showAllSegments()
  //       // }else{
  //       //   VIEWER_CONTROL.hideAllSegments()
  //       //   segments.forEach(seg=>VIEWER_CONTROL.showSegment(seg))
  //       // }
  //     })
  // }

  /**
   * to be migrated to viewerContainer or viewer
   */
  // applyNehubaMeshFix = () =>{
    
  //   this.nehubaViewer.clearCustomSegmentColors()
  //   if( this.selectedParcellation ){
  //     this.nehubaViewer.setMeshesToLoad( Array.from(this.selectedParcellation.colorMap.keys()) )
  //     this.nehubaViewer.batchAddAndUpdateSegmentColors( this.selectedParcellation.colorMap )
  //   }

  // }

  /**
   * to be migrated to region view
   */
  
  // multilvlExpansionTreeShake = (ev:any):void=>{
  //   /* this event should in theory not happen, but catching just in case */
  //   if( !this.selectedParcellation ){
  //     return
  //   }

  //   /* bind search term to searchTerm */
  //   const searchTerm = ev

  //   /* timeout is necessary as otherwise, treeshaking collapses based on the previous searchTerm */
  //   setTimeout(()=>{
  //     if( searchTerm != '' ){
  //       const propagate = (arr:RegionDescriptor[])=>arr.forEach(item=>{
  //         item.isExpanded = item.hasVisibleChildren()
  //         propagate(item.children)
  //       })
  //       if(this.selectedParcellation)propagate(this.selectedParcellation.regions)
  //     }
  //   })
  // }
}

@Injectable()
export class MultilevelProvider
{
  searchTerm : string = ``
  selectedMultilevel : Multilevel[] = []

  constructor()
  {
    
  }

  checkMultilevelVisibility(){

  }

  spliceRegionSelect(m:Multilevel){
    const idx = this.selectedMultilevel.findIndex(r=>r==m)
    if (idx>=0){
      this.selectedMultilevel.splice(idx,1)
    }else{
      console.warn('splice region select: cannot find region')
    }
  }

  pushRegionSelect(m:Multilevel){
    const idx = this.selectedMultilevel.findIndex(r=>r==m)
    if (idx<0){
      this.selectedMultilevel.push(<RegionDescriptor>m)
    }else{
      console.warn('push region select: region already in region select. Not pushed!')
    }
  }

  toggleRegionSelect(m:Multilevel){
    const idx = this.selectedMultilevel.findIndex(r=>r==m)
    if(idx>=0){
      this.spliceRegionSelect(m)
    }else{
      this.pushRegionSelect(m)
    }
  }

  enableSelfAndAllChildren(m:Multilevel):void{
    m.children.forEach(c=>this.enableSelfAndAllChildren(c))
    if( m.children.length == 0 )
    {
      this.pushRegionSelect(m)
    }
  }

  disableSelfAndAllChildren(m:Multilevel):void{
    m.children.forEach(c=>this.disableSelfAndAllChildren(c))
    if( m.children.length == 0 )
    {
      this.spliceRegionSelect(m)
    }
  }

  hasDisabledChildren(m:Multilevel):boolean{
    return !this.isSelected(m) ?
      true :
      m.children.length > 0 ?
        m.children.some(c=>this.hasDisabledChildren(c)) :
        false
  }

  hasEnabledChildren(m:Multilevel):boolean
  {
    return this.isSelected(m) ? 
      true :
      m.children.length > 0 ?
        m.children.some(c=>this.hasEnabledChildren(c)) :
        false
  }

  hasVisibleChildren(m:MultilevelSelector):boolean
  {
    return m.childrenMultilevel && m.childrenMultilevel.length > 0 ?
      m.childrenMultilevel.some( c=> c.isVisible || this.hasVisibleChildren(c)):
      m.isVisible
  }

  isSelected(m:Multilevel)
  {
    return this.selectedMultilevel.findIndex(sm=>sm===m) >= 0
  }
}

@Injectable()
export class FloatingWidgetService
{
  focusFloatingViewSubject : Subject<FloatingWidgetView> = new Subject()
  floatingViewContainerRef:ViewContainerRef
  floatingViews :FloatingWidgetView[] = []
  floatingViewComponentRefs : ComponentRef<FloatingWidgetView>[] = []
}

@Injectable()
export class WidgitServices
{
  constructor(private mainController:MainController)
  {
    this.mainController.selectedTemplateBSubject.subscribe((_template)=>{
      if(this._unloadAll) this._unloadAll()
      this.loadedWidgets = []
      this.loadedLabComponents = []
    })
  }

  loadedWidgets : WidgetComponent[] = []
  loadedLabComponents : LabComponent[] = []

  layoutChangeSubject:Subject<any> = new Subject()

  /* tobe overwritten by view */
  _loadWidgetFromLabComponent : (labComponent:LabComponent)=>WidgetComponent

  loadWidgetFromLabComponent(labComponent:LabComponent)
  {
    if(INTERACTIVE_VIEWER.pluginControl[labComponent.name])
    {
      (<LabComponentHandler>INTERACTIVE_VIEWER.pluginControl[labComponent.name]).blink(10)
      return null
    } else {
      const newWidget = this._loadWidgetFromLabComponent(labComponent)
      this.loadedWidgets.push(newWidget)
      return newWidget
    }
  }

  /* tobe overwritten by view */
  _widgitiseTemplateRef : (templateRef:TemplateRef<any>,metadata:WidgitiseTempRefMetaData)=>WidgetComponent 
  
  /**
   * Internal call to widgetise a templateRef
   * If the widget can be dismissed, pass a function as the value of metadata.onShutdown, and inside the said function, call widgetComponent.parentRef.destroy() 
   */
  widgitiseTemplateRef : (templateRef:TemplateRef<any>,metadata:WidgitiseTempRefMetaData)=>WidgetComponent = (templateRef,metadata)=>
  {
    const widgetComponent = this._widgitiseTemplateRef(templateRef,metadata)
    this.loadedWidgets.push(widgetComponent)
    return widgetComponent
  }

  unloadWidget(widgetComponent:WidgetComponent)
  {
    widgetComponent.parentViewRef.destroy()
    const idx = this.loadedWidgets.findIndex(w=>w==widgetComponent)
    if( idx >= 0 ){
      this.loadedWidgets.splice(idx,1)
    } else {
      console.log('WidgetService unloadWidget could not find the widget')
    }
    if(this.mainController.nehubaViewer) this.mainController.nehubaViewer.redraw()
  }

  unloadLabcomponent(labComponent:LabComponent)
  {
    delete INTERACTIVE_VIEWER.pluginControl[labComponent.name]
    const idx = this.loadedLabComponents.findIndex(w=>w==labComponent)
    if( idx >= 0 ){
      this.loadedLabComponents.splice(idx,1)
    } else {
      console.log('WidgetService unloadWidget could not find the labcomponent')
    }
  }

  /* tobe overwritten by view */
  _unloadAll : ()=>void
}

@Injectable()
export class LandmarkServices{
  landmarks : Landmark[] = []

  TEMP_icosahedronVtkUrl : string
  TEMP_crossVtkUrl : string
  flatProjection : boolean = true

  constructor(public mainController:MainController){

    const encoder = new TextEncoder()
    const blob = new Blob([encoder.encode(TEMP_ICOSAHEDRON_VTK)],{type:'application/octet-stream'})
    this.TEMP_icosahedronVtkUrl = URL.createObjectURL(blob)
    
    const encoder2 = new TextEncoder()
    const blob2 = new Blob([encoder2.encode(TEMP_CROSS_VTK)],{type:'application/octet-stream'})
    this.TEMP_crossVtkUrl = URL.createObjectURL(blob2)

    /* TODO think about how to implment spatial search in this iteration */
    // this.mainController.viewingModeBSubject.subscribe(_mode=>{
    //   this.landmarks = []
    //   if(this.mainController.nehubaViewer){
    //     this.TEMP_clearVtkLayers()
    //   }
    // })
  }

  clearAllLandmarks(){
    this.landmarks = []
  }

  addLandmark(landmark:Landmark){
    this.landmarks.push(landmark)
  }
  removeLandmark(landmark:Landmark){
    const idx = this.landmarks.findIndex(l=>l.id==landmark.id)
    
    if(idx>=0){
      this.landmarks.splice(idx,1)
    }else{
      console.error('could not remove landmark')
    }
  }

  changeLandmarkNodeView(landmark:Landmark,view:any){
    this.onChangeLandmarkNodeViewCbs.forEach(cb=>cb(landmark,view))
  }

  private onChangeLandmarkNodeViewCbs : ((landmark:Landmark,view:any)=>void)[] = []
  onChangeLandmarkNodeView(callback:(landmark:Landmark,view:any)=>void){
    this.onChangeLandmarkNodeViewCbs.push(callback)
  }    

  TEMP_parseLandmarkToVtk = (landmark:Landmark,idx:number,scale?:number,mesh?:string,shader?:string) =>{
    const viewer = this.mainController.nehubaViewer.ngviewer

    const oldLayer = viewer.layerManager.getLayerByName(`vtk-landmark-meshes-${idx}`)
    if(oldLayer){
      viewer.layerManager.removeManagedLayer(oldLayer)
    }

    const _scale = !scale ? [2,2,2] : [scale,scale,scale]
    const _meshUrl = !mesh ? this.TEMP_icosahedronVtkUrl :
      mesh == 'cross' ? 
        this.TEMP_crossVtkUrl :
        mesh == 'd20' || mesh == 'icosahedron' ?
          this.TEMP_icosahedronVtkUrl :
            this.TEMP_icosahedronVtkUrl

    viewer.layerManager.addManagedLayer(viewer.layerSpecification.getLayer(`vtk-landmark-meshes-${idx}`,{
      type : 'mesh',
      source : `vtk://${_meshUrl}`,
      transform : [
        [_scale[0] , 0 , 0, landmark.pos[0]*1000000],
        [0 , _scale[1] , 0, landmark.pos[1]*1000000],
        [0 , 0 , _scale[2], landmark.pos[2]*1000000],
        [0 , 0 , 0, 1 ],
      ],
      shader
    }))
  }

  TEMP_clearVtkLayers(){
    const manager = this.mainController.nehubaViewer.ngviewer.layerManager
    let _idx = 0
    let _layer = manager.getLayerByName(`vtk-landmark-meshes-${_idx}`) as ManagedUserLayerWithSpecification
    while(_layer){
      _layer.setVisible(false)
      _idx++
      _layer = manager.getLayerByName(`vtk-landmark-meshes-${_idx}`) as ManagedUserLayerWithSpecification
    }
  }

  fragmentMainHighlight = `void main(){emitRGBA(vec4(1.0,0.0,0.0,0.6));}`
  fragmentMainWhite = `void main(){emitRGBA(vec4(1.0,0.8,0.8,0.6));}`
  TEMP_vtkHighlight(idx:number){
    const layer = this.mainController.nehubaViewer.ngviewer.layerManager.getLayerByName(`vtk-landmark-meshes-${idx}`) as ManagedUserLayerWithSpecification
    this.setSingleMeshUserLayerColor(layer,this.fragmentMainHighlight)
  }

  TEMP_clearVtkHighlight(idx?:number){
    const manager = this.mainController.nehubaViewer.ngviewer.layerManager
    if(idx){
      let _layer = manager.getLayerByName(`vtk-landmark-meshes-${idx}`) as ManagedUserLayerWithSpecification
      this.setSingleMeshUserLayerColor(_layer,this.fragmentMainWhite)
    }else{
      let _idx = 0
      let _layer = manager.getLayerByName(`vtk-landmark-meshes-${_idx}`) as ManagedUserLayerWithSpecification
      while(_layer){
        this.setSingleMeshUserLayerColor(_layer,this.fragmentMainWhite)
        _idx++
        _layer = manager.getLayerByName(`vtk-landmark-meshes-${_idx}`) as ManagedUserLayerWithSpecification
      }
    }
  }

  private setSingleMeshUserLayerColor(layer:ManagedUserLayerWithSpecification,fragment:string){
    (<SingleMeshUserLayer>layer.layer).displayState.fragmentMain.restoreState(fragment)
  }
}

@Injectable()
export class SpatialSearch{

  pagination : number = 0
  numHits : number = 0
  RESULTS_PER_PAGE : number = 10

  /**
   * spatial search
  */

  center : [number,number,number]
  width : number
  templateSpace : string
  spatialSearchResultSubject : Subject<any> = new Subject()

  constructor(private mainController:MainController,private landmarkServices:LandmarkServices){
    this.spatialSearchResultSubject
      .throttleTime(300)
      .subscribe(({center,width,templateSpace})=>
        this.spatialSearch(center,width,templateSpace)
          .then((data:any)=>(this.landmarkServices.landmarks = [],this.parseSpatialQuery(data)))
          .catch((error:any)=>console.warn(error)))
    this.mainController.resultsFilterBSubject
      .subscribe(_filterResults=>{

      })

  }

  /* should always use larger for width when doing spatial querying */
  /* otherwise, some parts of the viewer will be out of bounds */
  querySpatialData : (center:[number,number,number],width:number,templateSpace:string ) => void = (_center,_width,_templateSpace)=>
  {
    /* TODO ipmlement spatial search in revamp of search result */

    // if(this.mainController.viewingMode == 'iEEG Recordings')
    //   this.spatialSearchResultSubject.next({center,width,templateSpace})
  }

  /* promise race timeout (?) */
  spatialSearch(center:[number,number,number],width:number,templateSpace:string){

    if(isNaN(width)){
      return Promise.reject('width is not a number')
    }

    this.center = center
    this.width = width
    this.templateSpace = templateSpace

    const SPATIAL_SEARCH_URL = `https://kg-int.humanbrainproject.org/solr/`
    const SOLR_C = `metadata/`
    const SEARCH_PATH = `select`
    const url = new URL(SPATIAL_SEARCH_URL+SOLR_C+SEARCH_PATH)
    
    /* do not set fl to get all params */
    // url.searchParams.append('fl','geometry.coordinates_0___pdouble,geometry.coordinates_1___pdouble,geometry.coordinates_2___pdouble')

    url.searchParams.append('q','*:*')
    url.searchParams.append('wt','json')
    url.searchParams.append('indent','on')
    url.searchParams.append('start',(this.pagination*this.RESULTS_PER_PAGE).toString())
    url.searchParams.append('rows',this.RESULTS_PER_PAGE.toString())
    
    /* TODO future for template space? */
    const filterTemplateSpace = templateSpace == 'Colin 27' ? 
      'datapath:metadata/sEEG-sample.json' :
        templateSpace == 'Waxholm Rat' ?
        'datapath:metadata/OSLO_sp_data_rev.json' :
          null

    if(filterTemplateSpace){
      url.searchParams.append('fq',filterTemplateSpace)
    }
    url.searchParams.append('fq',`geometry.coordinates:[${center.map(n=>n-width).join(',')}+TO+${center.map(n=>n+width).join(',')}]`)
    const fetchUrl = url.toString().replace(/\%2B/gi,'+')
    return fetch(fetchUrl).then(r=>r.json())
  }
  
  addLandmark = (pos:[number,number,number],id:string,properties:any)=>
    this.landmarkServices.landmarks.push({ pos , id , properties,hover:false})


  parseSpatialQuery = (data:any)=>{
    this.numHits = data.response.numFound
    this.pagination = data.response.start / this.RESULTS_PER_PAGE
    // this.clearAllLandmarks()
    const docs = data.response.docs as any[]

    docs
      // .filter((_,idx)=>idx<20)
      // .filter(doc=> this.landmarks.findIndex(d=>d.id==doc.id) < 0)
      .forEach(doc=>{
        const pos = [0,1,2].map(idx=>`geometry.coordinates_${idx}___pdouble`).map(key=>doc[key]) as [number,number,number]
        const { OID , ReferenceSpace, datapath, id } = doc
        this.addLandmark(pos,doc.id,{
          OID, ReferenceSpace, datapath, id,
          'geometry.coordinates' : doc['geometry.coordinates']
        })
      })

      this.landmarkServices.landmarks.forEach((l,idx)=>this.landmarkServices.TEMP_parseLandmarkToVtk(l,idx))
  }

  goTo = (pageIdx:number)=>{
    const gotoPage = pageIdx < 0 ? 
      0 : 
      pageIdx > this.numHits / this.RESULTS_PER_PAGE  ?
        Math.floor(this.numHits / this.RESULTS_PER_PAGE)  :
        pageIdx
    if(gotoPage != this.pagination){
      this.pagination = gotoPage
      this.spatialSearchResultSubject.next({center : this.center, width :this.width, templateSpace : this.templateSpace})
    }
  }
}

@Injectable()
export class InfoToUIService{
  constructor(public mainController:MainController){
  }

  contextInfoPopoverTemplateRef : Map<number,TemplateRef<any>|null> = new Map()
  contextInfoPopoverObservables : Map<number,Observable<TemplateRef<any>|null>> = new Map()
  getContentInfoPopoverObservable:(templateRefToBeRendered:Observable<TemplateRef<any>|null>)=>void = (observable)=>{
    const key = Date.now()
    this.contextInfoPopoverObservables.set(key,observable)
    this.contextInfoPopoverTemplateRef.set(key,null)
    observable
      .subscribe(templateRef=>{
        /* on event */
        this.contextInfoPopoverTemplateRef.set(key,templateRef)
      },console.error,()=>{
        /* on complete */
        this.contextInfoPopoverObservables.delete(key)
        this.contextInfoPopoverTemplateRef.delete(key)
      })
    
  }

  getModalHandler:()=>ModalHandler
}

class DataService {

  // private datasetArray = [
  //   'res/json/MNIColin27_dataset.json'
  // ]

  /* simiple fetch promise for json obj */
  /* nb: return header must contain Content-Type : application/json */
  /* nb: return header must container CORS header */

  fetchDatasets:()=>Promise<Dataset[]> 

  /* TODO temporary solution fetch available template space from KG  */
  private templateArray = [
    'res/json/bigbrain.json',
    'res/json/colin.json',
    'res/json/MNI152.json',
    'res/json/waxholmRatV2_0.json',
    'res/json/allenMouse.json'
  ]
  COLIN_JUBRAIN_PMAP_INFO = `res/json/colinJubrainPMap.json`
  COLIN_IEEG_INFO = `res/json/colinIEEG.json`
  COLIN_JUBRAIN_RECEPTOR_INFO = `res/json/colinJubrainReceptor.json`


  // templateArray = [
  //   'http://localhost:5080/res/json/bigbrain.json',
  //   'http://localhost:5080/res/json/colin.json',
  //   'http://localhost:5080/res/json/waxholmRatV2_0.json',
  //   'http://localhost:5080/res/json/allenMouse.json'
  // ]

  // COLIN_JUBRAIN_PMAP_INFO = `http://localhost:5080/res/json/colinJubrainPMap.json`
  // COLIN_IEEG_INFO = `http://localhost:5080/res/json/colinIEEG.json`
  // COLIN_JUBRAIN_RECEPTOR_INFO = `http://localhost:5080/res/json/colinJubrainReceptor.json`
  
  fetchTemplates:Promise<TemplateDescriptor[]> = new Promise((resolve,reject)=>{
    Promise.all(this.templateArray.map(dataset=>
      this.fetchJson(dataset)
        .then((json:any)=>
          this.parseTemplateData(json))))
      .then(templates=>resolve(templates))
      .catch(e=>reject(e))
  })

  fetchTemplatesData(templates:TemplateDescriptor[]):Promise<TemplateDescriptor[]>{
    const arrPrm: Promise<TemplateDescriptor>[] = templates.map(template=>{
      if(template.name!=`MNI Colin 27`){
        return Promise.resolve(template)
      }
      return new Promise((resolve,reject)=>{
        Promise.all([this.COLIN_JUBRAIN_PMAP_INFO,this.COLIN_IEEG_INFO,this.COLIN_JUBRAIN_RECEPTOR_INFO].map(url=>
          this.fetchJson(url)))
          .then(datas=>{
            resolve(Object.assign({},template,{
              'Cytoarchitectonic Probabilistic Map' : datas[0],
              // 'iEEG Recordings' : datas[1],
              'Receptor Data' : datas[2]
            }) as TemplateDescriptor)
          })
          .catch(e=>reject(e))
      })
    })
    return new Promise((resolve,reject)=>{
      Promise.all(arrPrm)
        .then(templates=>resolve(templates))
        .catch(e=>reject(e))
    })
  }

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
    return new Promise((resolve,reject)=>{
      const template = new TemplateDescriptor(json)
      Promise.all(template.asyncPromises)
        .then(()=>resolve(template))
        .catch((e:any)=>reject(e))
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

  sptialPagination : number = 0

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

export enum SUPPORTED_LIB {
  jquery2 = 'jquery2',
  jquery3 = 'jquery3',
  webcomponentsLite = 'webcomponentsLite',
  react16 = 'react16',
  reactdom16 = 'reactdom16'
}

const parseURLToElement = (url:string):HTMLElement=>{
  const el = document.createElement('script')
  el.setAttribute('crossorigin','true')
  el.src = url
  return el
}

export const SUPPORT_LIBRARY_MAP : Map<SUPPORTED_LIB,HTMLElement> = new Map([
  [(SUPPORTED_LIB.jquery3),parseURLToElement('http://code.jquery.com/jquery-3.3.1.min.js')],
  [(SUPPORTED_LIB.jquery2),parseURLToElement('http://code.jquery.com/jquery-2.2.4.min.js')],
  [(SUPPORTED_LIB.webcomponentsLite),parseURLToElement('https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/1.1.0/webcomponents-lite.js')],
  [(SUPPORTED_LIB.react16),parseURLToElement('https://unpkg.com/react@16/umd/react.development.js')],
  [(SUPPORTED_LIB.reactdom16),parseURLToElement('https://unpkg.com/react-dom@16/umd/react-dom.development.js')],
])

export const checkStringAsSupportLibrary = (string:string):SUPPORTED_LIB|null=>{
  return Object.keys(SUPPORTED_LIB).find(libkey=>libkey==string) ?
    SUPPORTED_LIB[string as keyof typeof SUPPORTED_LIB] :
    null
}
export const HELP_MENU = {
  'Mouse Controls' : 
  {
    "Left-drag" : "within a slice view to move within that plane",
    "Shift + Left-drag" : "within a slice view to change the rotation of the slice views",
    "Mouse-Wheel" : "up or down to zoom in and out.",
    "Ctrl + Mouse-Wheel" : "moves the navigation forward and backward",
    "Ctrl + Right-click" : "within a slice to teleport to that location"
  },
  'Keyboard Controls' : 
  {
    "s":"toggle front octant",
    "1 - 9" : "toggle layers visibility",
    "r" : "rotate 3D view"
  }
}

export const parseRegionRgbToFragmentMain = (r:RegionDescriptor):string=>`void main(){float x = toNormalized(getDataValue()); ${parseRegionRgbToGlsl(r)}if(x>${CM_THRESHOLD}){emitRGBA(vec4(r,g,b,x));}else{emitTransparent();}}`
export const getActiveColorMapFragmentMain = ():string=>`void main(){float x = toNormalized(getDataValue());${CM_MATLAB_JET}if(x>${CM_THRESHOLD}){emitRGB(vec3(r,g,b));}else{emitTransparent();}}`
export const parseRegionRgbToGlsl = (r:RegionDescriptor):string => {
  return (r.rgb.map((color,idx)=>`${idx == 0 ? 'float r' : idx == 1 ? 'float g' : idx == 2 ? 'float b' : 'float a'} = ${(color/255).toFixed(3)};`).join('') + `float a = 1.0;`)
}
export const CM_MATLAB_HOT = `float r=clamp(8.0/3.0*x,0.0,1.0);float a = clamp(x,0.0,1.0);float g=clamp(8.0/3.0*x-1.0,0.0,1.0);float b=clamp(4.0*x-3.0,0.0,1.0);`
export const CM_MATLAB_JET = 
`
float r;
if( x < 0.7 ){
  r = 4.0 * x - 1.5;
} else {
  r = -4.0 * x + 4.5;
}

float g;
if (x < 0.5) {
    g = 4.0 * x - 0.5;
} else {
    g = -4.0 * x + 3.5;
}

float b;
if (x < 0.3) {
    b = 4.0 * x + 0.5;
} else {
    b = -4.0 * x + 2.5;
}
float a = 1.0;
`
export const TIMEOUT = 5000;
export const CM_THRESHOLD = 0.05;

/* TODO to be deprecated when the new results browser is adopted */
export const initMultilvl = (json:any):Multilevel=>{
  const m = new Multilevel()
  m.name = json.name ? json.name : 'Untitled'
  m.children = json.children.constructor == Array ? 
    (<any[]>json.children).map(it=>
      initMultilvl(it)) : 
    []
  return m
}


const TEMP_CROSS_VTK = 
`# vtk DataFile Version 2.0
Converted using https://github.com/HumanBrainProject/neuroglancer-scripts
ASCII
DATASET POLYDATA
POINTS 48 float
-1e+08 -500000.0 0.0
-1e+06 -500000.0 0.0
-1e+08 0.0218557 -500000.0
-1e+06 0.0218557 -500000.0
-1e+08 500000.0 0.0437114
-1e+06 500000.0 0.0437114
-1e+08 -0.00596244 500000.0
-1e+06 -0.00596244 500000.0
1e+06 -500000.0 0.0
1e+08 -500000.0 0.0
1e+06 0.0218557 -500000.0
1e+08 0.0218557 -500000.0
1e+06 500000.0 0.0437114
1e+08 500000.0 0.0437114
1e+06 -0.00596244 500000.0
1e+08 -0.00596244 500000.0
500000.0 -1e+08 0.0
500000.0 -1e+06 0.0
-0.0218557 -1e+08 -500000.0
-0.0218557 -1e+06 -500000.0
-500000.0 -1e+08 0.0437114
-500000.0 -1e+06 0.0437114
0.00596244 -1e+08 500000.0
0.00596244 -1e+06 500000.0
500000.0 1e+06 0.0
500000.0 1e+08 0.0
-0.0218557 1e+06 -500000.0
-0.0218557 1e+08 -500000.0
-500000.0 1e+06 0.0437114
-500000.0 1e+08 0.0437114
0.00596244 1e+06 500000.0
0.00596244 1e+08 500000.0
-500000.0 0.0 -1e+08
-500000.0 0.0 -1e+06
0.0218557 -500000.0 -1e+08
0.0218557 -500000.0 -1e+06
500000.0 0.0437114 -1e+08
500000.0 0.0437114 -1e+06
-0.00596244 500000.0 -1e+08
-0.00596244 500000.0 -1e+06
-500000.0 0.0 1e+06
-500000.0 0.0 1e+08
0.0218557 -500000.0 1e+06
0.0218557 -500000.0 1e+08
500000.0 0.0437114 1e+06
500000.0 0.0437114 1e+08
-0.00596244 500000.0 1e+06
-0.00596244 500000.0 1e+08
POLYGONS 48 192
3 0 2 1
3 1 2 3
3 2 4 3
3 3 4 5
3 4 6 5
3 5 6 7
3 6 0 7
3 7 0 1
3 8 10 9
3 9 10 11
3 10 12 11
3 11 12 13
3 12 14 13
3 13 14 15
3 14 8 15
3 15 8 9
3 16 18 17
3 17 18 19
3 18 20 19
3 19 20 21
3 20 22 21
3 21 22 23
3 22 16 23
3 23 16 17
3 24 26 25
3 25 26 27
3 26 28 27
3 27 28 29
3 28 30 29
3 29 30 31
3 30 24 31
3 31 24 25
3 32 34 33
3 33 34 35
3 34 36 35
3 35 36 37
3 36 38 37
3 37 38 39
3 38 32 39
3 39 32 33
3 40 42 41
3 41 42 43
3 42 44 43
3 43 44 45
3 44 46 45
3 45 46 47
3 46 40 47
3 47 40 41`

const TEMP_ICOSAHEDRON_VTK = 
`# vtk DataFile Version 2.0
Converted using https://github.com/HumanBrainProject/neuroglancer-scripts
ASCII
DATASET POLYDATA
POINTS 12 float
-525731.0 0.0 850651.0
525731.0 0.0 850651.0
-525731.0 0.0 -850651.0
525731.0 0.0 -850651.0
0.0 850651.0 525731.0
0.0 850651.0 -525731.0
0.0 -850651.0 525731.0
0.0 -850651.0 -525731.0
850651.0 525731.0 0.0
-850651.0 525731.0 0.0
850651.0 -525731.0 0.0
-850651.0 -525731.0 0.0
POLYGONS 20 80
3 1 4 0
3 4 9 0
3 4 5 9
3 8 5 4
3 1 8 4
3 1 10 8
3 10 3 8
3 8 3 5
3 3 2 5
3 3 7 2
3 3 10 7
3 10 6 7
3 6 11 7
3 6 0 11
3 6 1 0
3 10 1 6
3 11 0 9
3 2 11 9
3 5 2 9
3 11 2 7`

/* temporary neurorecptors array */
export const TEMP_NR = ["5-HT1A","5-HT2","alpha1","alpha2","alpha4beta2","AMPA","BZ","D1","GABAA","GABAB","kainate","M1","M2","M3","mGluR2_3","NMDA"]

@Injectable()

export class MasterCollapsableController{
  expandBSubject : BehaviorSubject<boolean> = new BehaviorSubject(false)
}

/**
 * currently only search for receptor data
 */
@Injectable()
export class TEMP_SearchDatasetService{
  // returnedSearchResults : SearchResultInterface[] = []

  returnedSearchResultsBSubject : BehaviorSubject<SearchResultInterface[]> = new BehaviorSubject([])
  
  constructor(public mainController:MainController){

    Promise.all([
      fetch('res/json/pmapsAggregatedData.json').then(res=>res.json()),
      fetch('res/json/receptorAggregatedData.json').then(res=>res.json())
    ])
      .then(arr=>{
        
        this.returnedSearchResultsBSubject.next(
          arr
            .reduce((acc,curr)=>
              acc.concat(...curr)
            ,[])
            .map((it:SearchResultInterface)=>
              Object.assign(
                {},
                it,
                { files: it.files.map(file=>Object.assign({},file,{parentDataset : it})) }
              )
            )
            /* TODO test parent dataset of thumbnail */
            .map((it:SearchResultInterface)=>
              Object.assign(
                {},
                it,
                { 
                  thumbnail : it.thumbnail ? 
                    Object.assign({},it.thumbnail,{parentDataset : it}) :
                    null 
                }
              ))
        )
      })
      .catch(console.warn)

    /**
     * Because there is no easy way to display standard deviation natively, use a plugin 
     * */
    Chart.pluginService.register({
      afterInit : function(chart){
        if(chart.config.options && chart.config.options.tooltips){
          
          chart.config.options.tooltips.callbacks = {
            label : function(tooltipItem,data){
              let sdValue
              if( data.datasets && typeof tooltipItem.datasetIndex != 'undefined' && data.datasets[tooltipItem.datasetIndex].label ){
                const sdLabel = data.datasets[tooltipItem.datasetIndex].label+'_sd'
                const sd = data.datasets.find(dataset=> typeof dataset.label != 'undefined' && dataset.label == sdLabel)
                if(sd && sd.data && typeof tooltipItem.index != 'undefined' && typeof tooltipItem.yLabel != 'undefined') sdValue = Number(sd.data[tooltipItem.index]) - Number(tooltipItem.yLabel)
              }
              return `${tooltipItem.yLabel} ${sdValue ? '('+ sdValue +')' : ''}`
            }
          }
        }
        if(chart.data.datasets){
          chart.data.datasets = chart.data.datasets
            .map(dataset=>{
              if(dataset.label && /\_sd$/.test(dataset.label)){
                const originalDS = chart.data.datasets!.find(baseDS=>typeof baseDS.label!== 'undefined' && (baseDS.label == dataset.label!.replace(/_sd$/,'')))
                if(originalDS){
                  return Object.assign({},dataset,{
                    data : (originalDS.data as number[]).map((datapoint,idx)=>(Number(datapoint) + Number((dataset.data as number[])[idx]))),
                    ... CHART_SD_STYLE
                  })
                }else{
                  return dataset
                }
              }else if (dataset.label){
                const sdDS = chart.data.datasets!.find(sdDS=>typeof sdDS.label !=='undefined' && (sdDS.label == dataset.label + '_sd'))
                if(sdDS){
                  return Object.assign({},dataset,{
                    ...CHART_BASE_STYLE
                  })
                }else{
                  return dataset
                }
              }else{
                return dataset
              }
            })
        }
      }
    })

    Observable
      .combineLatest(this.returnedSearchResultsBSubject,this.mainController.selectedParcellationBSubject)
      .subscribe(([searchResults,parcellation])=>{
        if(parcellation){
          parcellation.regions.forEach(region=>this.editAvailableDatasetOnRegion(searchResults,region))
        }
      })
  }

  private editAvailableDatasetOnRegion(newDataSets:SearchResultInterface[],region:RegionDescriptor){
    region.datasets = newDataSets
      .filter(ds=>this.checkDatasetLinkRegion(ds,region))
    region.children.forEach(c=>this.editAvailableDatasetOnRegion(newDataSets,c))
  }

  private checkDatasetLinkRegion(dataset:SearchResultInterface,region:RegionDescriptor):boolean{
    return dataset.regionName ? 
      dataset.regionName.findIndex(re=>re.regionName == region.name) >= 0 : 
      false
  }
}

/* */
const CHART_BASE_STYLE = {
  fill : 'origin'
}

/**/
const CHART_SD_STYLE = {
  fill : false,
  backgroundColor : 'rgba(0,0,0,0)',
  borderDash : [10,3],
  pointRadius : 0,
  pointHitRadius : 0,
}

// const CHART_BASE_OPTION : ChartOptions = {
//     tooltips : {
//       callbacks : {
//         label : function(tooltipItem,data){
//           console.log('tooltip callback',tooltipItem,data)
//           return 'test'
//         }
//       }
//     }
// }