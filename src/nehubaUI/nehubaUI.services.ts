import { Input, Output,EventEmitter, Component,TemplateRef, Injectable } from '@angular/core';
import { Subject,BehaviorSubject } from 'rxjs/Rx'
import { Multilevel, Landmark, WidgitiseTempRefMetaData } from './nehuba.model'

import { TemplateDescriptor, LabComponent, RegionDescriptor, ParcellationDescriptor, PluginDescriptor, LabComponentHandler } from './nehuba.model'
import { NehubaModalService, ModalHandler } from './nehubaUI.modal.component'
import { NehubaViewer } from 'nehuba/NehubaViewer';
import { SelectTreePipe } from 'nehubaUI/nehubaUI.util.pipes';
import { UrlHashBinding } from 'neuroglancer/ui/url_hash_binding';
import { LayerManager } from 'neuroglancer/layer'
import { SegmentationUserLayer } from 'neuroglancer/segmentation_user_layer';
import { WidgetComponent } from 'nehubaUI/nehubaUI.widgets.component';

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

  regionsLabelIndexMap: Map<Number,RegionDescriptor> = new Map() // map NG segID to region descriptor

  /**
   * viewing 
   */
  viewingMode : string = `navigation (default mode)`
  viewingModeBSubject : BehaviorSubject<string> = new BehaviorSubject( this.viewingMode )

  /**
   * plugins
   */
  loadedWidgets : LabComponent[] = []
    // DEFAULT_WIDGETS.map(json=>new LabComponent(json))
  launchedWidgets : string[] = []

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
  nehubaCurrentSegment : RegionDescriptor | null

  /* to be moved to viewer or viewercontainer */
  shownSegmentsObserver : any
  viewerControl : ViewerHandle

  constructor(){

    this.viewerControl = new ViewerHandle()

    if( this.testRequirement() ){
      this.init()
      this.attachInternalHooks()
      this.hookAPI()
      this.patchNG()
    }

    /* TODO reconsider if this is a good idea */
    HelperFunctions.sFindRegion = this.findRegionWithId
  }

  receptorString : string | null

  private passCheckSetMode(mode:String){

    /* reset view state */
    if(this.nehubaViewer){

      /* turn off all pmap layers */
      this.selectedRegions.forEach(re=>{
        const pmap = this.nehubaViewer.ngviewer.layerManager.getLayerByName(`PMap ${re.name}`)
        if(pmap){
          pmap.setVisible(false)
        }else{
          //pmap layer does not yet exist
        }
      })
      
      /* turn on selected segments in parcellation */
      if(this.selectedRegions.length==0){
        this.viewerControl.showAllSegments()
      }else{
        this.selectedRegions.forEach(r=>this.viewerControl.showSegment(r.labelIndex))
      }
      
      /* restore alpha */
      this.nehubaViewer.ngviewer.layerManager.managedLayers.filter((l:any)=>l.initialSpecification ? l.initialSpecification.type == 'segmentation' : false)
        .forEach(l=>(<SegmentationUserLayer>l.layer).displayState.selectedAlpha.restoreState(0.5))

    }

    /* reset pmap */
    // if(this.nehubaViewer){
    //   this.nehubaViewer.ngviewer.layerManager.managedLayers.filter(l=>/nifti/.test((<any>l).toJSON().source))
    //     .forEach(l=>l.setVisible(false))
    // }
    /* this is already happening */

    this.receptorString = null

    /* set state */
    switch(mode){
      case 'Querying Landmarks':
      {
        this.nehubaViewer.ngviewer.layerManager.managedLayers.filter((l:any)=>l.initialSpecification ? l.initialSpecification.type == 'segmentation' : false)
          .forEach(l=>(<SegmentationUserLayer>l.layer).displayState.selectedAlpha.restoreState(0.2))
      }
      break;
      case 'Probability Map':
      {
        /* can't do this. or else the mesh becomes invisible */
        // this.nehubaViewer.ngviewer.layerManager.managedLayers.filter((l:any)=>l.initialSpecification ? l.initialSpecification.type == 'segmentation' : false)
        //   .forEach(l=>(<ManagedUserLayer>l).setVisible(false))

        this.viewerControl.hideAllSegments()
        this.viewerControl.setLayerVisibility({name:/^PMap/},false)
        this.selectedRegions.forEach(r=>{
          this.viewerControl.setLayerVisibility({name:`PMap ${r.name}`},true)
        })

        this.viewerControl.loadLayer( this.selectedRegions
          .filter(r=>r.moreInfo.findIndex(info=>info.name==mode))
          .reduce((prev:any,r:RegionDescriptor)=>{
            const obj : any = {}
            obj[`PMap ${r.name}`] = {
              type : 'image',
              source : r.moreInfo.find(info=>info.name==mode)!.source,
              shader : `void main(){float x=toNormalized(getDataValue());${CM_MATLAB_HOT}if(x>${CM_THRESHOLD}){emitRGB(vec3(r,g,b));}else{emitTransparent();}}`
            }
            return Object.assign({},prev,obj)
          },{}) )

          this.applyNehubaMeshFix()
      }
      break;
      default:
      {
        /* navigation and receptor data mode */
      }
      break;
    }
  }

  setMode(mode:string){
    if(this.viewingMode != mode){
      this.viewingMode = mode
      this.passCheckSetMode(mode)
      this.viewingModeBSubject.next(mode)
    }
  }

  widgitiseTemplateRef : (templateRef:TemplateRef<any>,metadata:WidgitiseTempRefMetaData)=>WidgetComponent
  createDisposableWidgets : (widgetComponent:WidgetComponent)=>any

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
    //   '/res/json/bigbrain.json',
    //   '/res/json/colin.json',
    //   '/res/json/waxholmRatV2_0.json',
    //   '/res/json/allenMouse.json'
    // ]

    let datasetArray = [
      'http://localhost:5080/res/json/colin.json'
    ]

    datasetArray.forEach(dataset=>{
      this.dataService.fetchJson(dataset)
        .then((json:any)=>{
          this.dataService.parseTemplateData(json)
            .then( template =>{
              this.loadedTemplates.push( template )
            })
            .catch(console.warn)
          })
        .catch((e:any)=>{
          console.log('fetch init dataset error',e)
        })
      })

    /* dev option, use a special endpoint to fetch all plugins */
    // fetch('http://localhost:5080/collectPlugins')
    //   .then(res=>res.json())
    //   .then(arr=>this.loadedWidgets = (<Array<any>>arr).map(json=>new LabComponent(json)))
    //   .catch(console.warn)
  }

  patchNG(){
    UrlHashBinding.prototype.setUrlHash = ()=>{
      // console.log('seturl hash')
    }

    UrlHashBinding.prototype.updateFromUrlHash = ()=>{
      // console.log('update hash binding')
    }

    /* TODO find a more permanent fix to disable double click */
    LayerManager.prototype.invokeAction = (arg) => {
      
      if(arg=='select'&&this.nehubaCurrentSegment){
        const idx = this.selectedRegions.findIndex(r=>r==this.nehubaCurrentSegment)
        if(idx>=0){
          this.selectedRegions.splice(idx,1)
          this.nehubaCurrentSegment.enabled = false
        }else{
          this.selectedRegions.push(this.nehubaCurrentSegment)
          this.nehubaCurrentSegment.enabled = true
        }
        this.regionSelectionChanged()
      }
    }
  }

  attachInternalHooks(){

    /**
     * to be moved to viewer or viewerContainer
     */
    this.onParcellationSelectionHook.push(()=>{
      if (this.shownSegmentsObserver) this.shownSegmentsObserver.unsubscribe()
    })
    this.onTemplateSelectionHook.push(()=>{
      if (this.nehubaViewerSegmentMouseOver) this.nehubaViewerSegmentMouseOver.unsubscribe()
    })
    this.afterParcellationSelectionHook.push(this.applyNehubaMeshFix)
    this.afterParcellationSelectionHook.push(()=>{
      this.nehubaViewerSegmentMouseOver = this.nehubaViewer.mouseOver.segment.subscribe(ev=>{
        this.nehubaCurrentSegment = this.findRegionWithId(ev.segment)
        VIEWER_CONTROL.mouseOverNehuba.next({
          nehubaOutput : ev,
          foundRegion : this.findRegionWithId(ev.segment)
        })
      })
    })
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

    this.loadParcellation( templateDescriptor.parcellations[0] )
    this.sendUISelectedRegionToViewer()

    /* TODO potentially breaks. selectedRegions should be cleared after each loadParcellation */
    EXTERNAL_CONTROL.metadata.selectedRegions = []
  }

  loadParcellation(parcellation:ParcellationDescriptor):void{
    if( this.selectedParcellation == parcellation ){
      return
    }
    
    this.onParcellationSelectionHook.forEach(cb=>cb())

    this.selectedParcellation = parcellation
    this.selectedRegions.splice(0,this.selectedRegions.length-1)

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

  /* TODO figure out a more elegant way to watch array for changes */
  regionSelectionChanged(){
    this.passCheckSetMode(this.viewingMode)
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

  loadWidget(labComponent:LabComponent)
  {
    if(PLUGIN_CONTROL[labComponent.name])
    {
      (<LabComponentHandler>PLUGIN_CONTROL[labComponent.name]).blink(10)
    } else {
      HelperFunctions.sLoadPlugin(labComponent)
    }
  }

  widgetLaunched(name:string):boolean
  {
    return this.launchedWidgets.findIndex(n=>n==name) >= 0
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

@Injectable()
export class MultilevelProvider{
  searchTerm : string = ``
  selectedMultilevel : Multilevel[]

  constructor(private mainController:MainController){
    
  }

  spliceRegionSelect(m:Multilevel){
    const idx = this.mainController.selectedRegions.findIndex(r=>r==m)
    if (idx>=0){
      this.mainController.selectedRegions.splice(idx,1)
      this.mainController.regionSelectionChanged()
    }else{
      console.warn('splice region select: cannot find region')
    }
  }

  pushRegionSelect(m:Multilevel){
    const idx = this.mainController.selectedRegions.findIndex(r=>r==m)
    if (idx<0){
      this.mainController.selectedRegions.push(<RegionDescriptor>m)
      this.mainController.regionSelectionChanged()
    }else{
      console.warn('push region select: region already in region select. Not pushed!')
    }
  }

  toggleRegionSelect(m:Multilevel){
    const idx = this.mainController.selectedRegions.findIndex(r=>r==m)
    if(idx>=0){
      this.spliceRegionSelect(m)
      m.enabled = false
    }else{
      this.pushRegionSelect(m)
      m.enabled = true
    }
  }

  enableSelfAndAllChildren(m:Multilevel):void{
    m.enabled = true
    m.children.forEach(c=>this.enableSelfAndAllChildren(c))
    if( m.children.length == 0){
      this.pushRegionSelect(m)
    }
  }

  disableSelfAndAllChildren(m:Multilevel):void{
    m.enabled = false
    m.children.forEach(c=>this.disableSelfAndAllChildren(c))
    if( m.children.length ==0 ){
      this.spliceRegionSelect(m)
    }
  }

  hasDisabledChildren(m:Multilevel):boolean{
    return m.children.length > 0?
      m.children.some(c=>this.hasDisabledChildren(c)) :
      !m.enabled
  }

  hasEnabledChildren(m:Multilevel):boolean{
    return m.children.length > 0?
      m.children.some(c=>this.hasDisabledChildren(c)) :
      m.enabled
  }

  hasVisibleChildren(m:Multilevel):boolean{
    return m.children.length > 0 ?
      m.children.some( c=> c.isVisible || this.hasDisabledChildren(c)):
      m.isVisible
  }
}

@Injectable()
export class LandmarkServices{
  landmarks : Landmark[] = []

  changeLandmarkNodeView(landmark:Landmark,view:any){
    this.onChangeLandmarkNodeViewCbs.forEach(cb=>cb(landmark,view))
  }

  private onChangeLandmarkNodeViewCbs : ((landmark:Landmark,view:any)=>void)[] = []
  onChangeLandmarkNodeView(callback:(landmark:Landmark,view:any)=>void){
    this.onChangeLandmarkNodeViewCbs.push(callback)
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

    const encoder = new TextEncoder()
    const blob = new Blob([encoder.encode(TEMP_ICOSAHEDRON_VTK)],{type:'application/octet-stream'})
    this.TEMP_vtkUrl = URL.createObjectURL(blob)

    this.mainController.viewingModeBSubject.subscribe(mode=>{
      if(mode=='Querying Landmarks'){
        
      }else{
        if(this.mainController.nehubaViewer){
          this.TEMP_clearVtkLayers()
        }
      }
    })
  }

  /* should always use larger for width when doing spatial querying */
  /* otherwise, some parts of the viewer will be out of bounds */
  querySpatialData : (center:[number,number,number],width:number,templateSpace:string ) => void = (center,width,templateSpace)=>
  {
    if(this.mainController.viewingMode == 'Querying Landmarks')
      this.spatialSearchResultSubject.next({center,width,templateSpace})
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
    
  TEMP_vtkUrl : string
  TEMP_parseLandmarkToVtk = (landmark:Landmark,idx:number) =>{
    const viewer = this.mainController.nehubaViewer.ngviewer

    const oldLayer = viewer.layerManager.getLayerByName(`vtk-landmark-meshes-${idx}`)
    if(oldLayer){
      viewer.layerManager.removeManagedLayer(oldLayer)
    }

    viewer.layerManager.addManagedLayer(viewer.layerSpecification.getLayer(`vtk-landmark-meshes-${idx}`,{
      type : 'mesh',
      source : `vtk://${this.TEMP_vtkUrl}`,
      transform : [
        [2 , 0 , 0, landmark.pos[0]*1000000],
        [0 , 2 , 0, landmark.pos[1]*1000000],
        [0 , 0 , 2, landmark.pos[2]*1000000],
        [0 , 0 , 0, 1 ]
      ]
    }))
  }

  TEMP_clearVtkLayers(){
    const layerManager = this.mainController.nehubaViewer.ngviewer.layerManager
    Array.from(Array(10).keys())
      .map(i=>`vtk-landmark-meshes-${i}`)
      .forEach(layerName=>{
        const layer = layerManager.getLayerByName(layerName)
        if( layer ) layer.setVisible(false)
      })
  }

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

      this.landmarkServices.landmarks.forEach(this.TEMP_parseLandmarkToVtk)

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

export class HelperFunctions{
  static sLoadPlugin : (labComponent : LabComponent)=>void
  static sFindRegion : (id : Number|null) => RegionDescriptor | null
}

let metadata : any = {}

export enum SUPPORTED_LIB {
  jquery2,
  jquery3,
  webcomponentsLite,
  reactRedux
}

const parseURLToElement = (urls:string[]):HTMLElement[]=>
  urls.map(url=>{
    const el = document.createElement('script')
    el.src = url
    return el
  })

export const SUPPORT_LIBRARY_MAP : Map<SUPPORTED_LIB,HTMLElement[]> = new Map([
  [(SUPPORTED_LIB.jquery3),parseURLToElement(['http://code.jquery.com/jquery-3.3.1.min.js'])],
  [(SUPPORTED_LIB.jquery2),parseURLToElement(['http://code.jquery.com/jquery-2.2.4.min.js'])],
  [(SUPPORTED_LIB.webcomponentsLite),parseURLToElement(['https://cdnjs.cloudflare.com/ajax/libs/webcomponentsjs/1.1.0/webcomponents-lite.js'])],
  [(SUPPORTED_LIB.reactRedux),parseURLToElement(['https://cdnjs.cloudflare.com/ajax/libs/react-redux/5.0.6/react-redux.min.js'])],
])

export const EXTERNAL_CONTROL = window['nehubaUI'] = {
  metadata : metadata,
  /* to be overwritten by parent */
  loadExternalLibrary : (_libraryNames:SUPPORTED_LIB[],_callback:(e:any)=>void)=>{
    
  }
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

  loadLayer : (layerObj:any)=>any[]
  removeLayer : (layerObj:any)=>string[]
  setLayerVisibility : (layerObj:any, visibility:boolean)=>string[]
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
    "templateURL":TEMP_PLUGIN_DOMAIN + "meshAnimator/meshAnimator.html",
    "scriptURL":TEMP_PLUGIN_DOMAIN + "meshAnimator/meshAnimator.js"
  },{
    "name":"fzj.xg.localNifti",
    "type":"plugin",
    "templateURL":TEMP_PLUGIN_DOMAIN + "localNifti/localNifti.html",
    "scriptURL":TEMP_PLUGIN_DOMAIN + "localNifti/localNifti.js"
  }
]

export const TEMP_RECEPTORDATA_BASE_URL = `http://imedv02.ime.kfa-juelich.de:5081/plugins/receptorBrowser/data/`
export const TEMP_RECEPTORDATA_DRIVER_DATA = 
{
  "Fingerprint":"__fingerprint.jpg",
  "Profiles":
  {
    "Glutamate":
    {
      "AMPA":"_pr_AMPA.jpg",
      "NMDA":"_pr_NMDA.jpg",
      "kainate":"_pr_kainate.jpg",
      "mGluR2/3":"_pr_mGluR2_3.jpg"
    },
    "GABA":
    {
      "GABAA":"_pr_GABAA.jpg",
      "GABAB":"_pr_GABAB.jpg"
    }
  },
  "Autoradiographs":
  {
    "Glutamate":{
      "AMPA":"_bm_AMPA.jpg",
      "NMDA":"_bm_NMDA.jpg",
      "kainate":"_bm_kainate.jpg",
      "mGluR2/3":"_bm_mGluR2_3.jpg"
    },
    "GABA":
    {
      "GABAA":"_bm_GABAA.jpg",
      "GABAB":"_bm_GABAB.jpg"
    }
  }
}

@Component({
  selector : 'receptorDataDriver',
  template : `
    <div class = "well" receptorPath>
      <small>
        <span (click)="popall()" clickables>{{ receptorName }}</span>
        <i class = "glyphicon glyphicon-chevron-right">
        </i>
        <span *ngFor = "let choice of choiceStack">
          <span (click)="popUntil(choice)" clickables>{{ choice }} </span>
          <i class = "glyphicon glyphicon-chevron-right">
          </i>
        </span>
      </small>
    </div>
    <div
      class = "btn btn-block"
      (click)="popStack()" 
      *ngIf="historyStack.length != 0"
      backBtn>

      <i class = "glyphicon glyphicon-chevron-left"></i> 
      Back

    </div>
    <div 
      (click) = "enterStack(key)" 
      class = "btn btn-block" 
      *ngFor="let key of focusStack | keyPipe">

      {{key}} 
      <i *ngIf="focusStack[key].constructor.name == 'String'" class = "glyphicon glyphicon-picture"></i> 
      <i *ngIf="focusStack[key].constructor.name == 'Object'" class = "glyphicon glyphicon-chevron-right"></i> 
    </div>
  `,
  styles : [
    `
    [clickables]:hover
    {
      cursor:pointer;
    }
    .well[receptorPath]
    {
      white-space:nowrap;
      overflow:hidden;
      background-color:rgba(0,0,0,0.2);
    }
    .btn
    {
      padding:0em;
      margin:0em;
    }
    .btn[backBtn]
    {
      margin-bottom:0.4em;
    }
    `
  ]
})

export class TempReceptorData{
  @Input() receptorName : string = ``
  @Output() receptorString : EventEmitter<string|null> = new EventEmitter()

  historyStack : any[] = []
  choiceStack : string[] = []
  focusStack : any = TEMP_RECEPTORDATA_DRIVER_DATA

  popall(){
    while(this.choiceStack.length>0){
      this.popStack()
    }
  }

  popUntil(choice:string){
    while(this.choiceStack[this.choiceStack.length-1]!=choice){
      this.popStack()
    }
  }

  popStack(){
    this.focusStack = this.historyStack.pop()
    this.choiceStack.pop()
    this.receptorString.emit(null)
  }

  enterStack(key:string){
    this.historyStack.push(this.focusStack)
    this.choiceStack.push(key)
    if(typeof this.focusStack[key] == 'string'){
      this.receptorString.emit(this.focusStack[key])
      this.focusStack = []
    }else{
      this.receptorString.emit(null)
      this.focusStack = this.focusStack[key]
    }
  }
}


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