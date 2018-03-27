import { Input, Output,EventEmitter, Component,TemplateRef, Injectable } from '@angular/core';
import { Subject,BehaviorSubject } from 'rxjs/Rx'
import { Multilevel, Landmark, WidgitiseTempRefMetaData } from './nehuba.model'

import { TemplateDescriptor, LabComponent, RegionDescriptor, ParcellationDescriptor, PluginDescriptor, LabComponentHandler } from './nehuba.model'
import { NehubaModalService, ModalHandler } from 'nehubaUI/components/modal/nehubaUI.modal.component'
import { NehubaViewer } from 'nehuba/NehubaViewer';
import { SelectTreePipe } from 'nehubaUI/util/nehubaUI.util.pipes';
import { UrlHashBinding } from 'neuroglancer/ui/url_hash_binding';
import { LayerManager } from 'neuroglancer/layer'
import { SegmentationUserLayer } from 'neuroglancer/segmentation_user_layer';
import { WidgetComponent } from 'nehubaUI/components/floatingWindow/nehubaUI.widgets.component';
import { ManagedUserLayerWithSpecification } from 'neuroglancer/layer_specification';
import { SingleMeshUserLayer } from 'neuroglancer/single_mesh_user_layer';
import { MultilevelSelector } from 'nehubaUI/components/multilevel/nehubaUI.multilevel.component';
import { ImageUserLayer } from 'neuroglancer/image_user_layer';

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

  selectTemplateBSubject : BehaviorSubject<TemplateDescriptor|null> = new BehaviorSubject(null)

  selectedTemplate : TemplateDescriptor | undefined
  selectedParcellation : ParcellationDescriptor | undefined
  _selectedRegions : RegionDescriptor[] = []

  get selectedRegions(){
    return this._selectedRegions
  }

  set selectedRegions(regions:RegionDescriptor[]){
    this._selectedRegions = regions
  }

  regionsLabelIndexMap: Map<Number,RegionDescriptor> = new Map() // map NG segID to region descriptor

  /**
   * viewing 
   */
  viewingMode : string = `Select atlas regions`
  viewingModeBSubject : Subject<string> = new Subject() // cannot be a behaviourSubject, or else it will overwrite query param every time

  /**
   * hooks
   */
  /* queryChangeSubject should emit only key value of strings to be set as query */
  queryChangeSubject : Subject<any> = new Subject()

  onTemplateSelectionHook : (()=>void)[] = []
  afterTemplateSelectionHook : (()=>void)[] = []
  onParcellationSelectionHook : (()=>void)[] = []
  afterParcellationSelectionHook : (()=>void)[] = []

  /**
   * plugins
  */
  loadedPlugins : LabComponent[] = []

  /**
   * style
   */

  darktheme : boolean

  nehubaViewer : NehubaViewer
  nehubaViewerSegmentMouseOver : any
  nehubaCurrentSegment : RegionDescriptor | null = null

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

    /* required to handle back events */
    window.addEventListener('hashchange',(ev:HashChangeEvent)=>{
      
      if((<string>ev.newURL).indexOf('#') < 0){
        if(this.nehubaViewer)
        {
          this.selectTemplateBSubject.next(null)
          // this.nehubaViewer.dispose()
          // this.darktheme = false
        }

        this.selectedTemplate = undefined
      }
      history.replaceState(null,'')
    })
  }

  private parseQueryString(locationSearch:string){
    const query = new URLSearchParams(locationSearch)
    Array.from(query.entries()).forEach(keyval=>{
      switch(keyval[0]){
        case 'selectedTemplate':{
          const template = this.loadedTemplates.find(template=>template.name==keyval[1])
          if(template) this.loadTemplate(template)
        }break;
        case 'viewingMode':{
          setTimeout(()=>{
            if(this.nehubaViewer) this.setMode(keyval[1])
          })
        }break;
        case 'selectedRegions':{
          this.selectedRegions = keyval[1].split('_')
            .map(idx=>Number(idx))
            .filter(idx=>this.regionsLabelIndexMap.get(idx))
            .map(idx=>this.regionsLabelIndexMap.get(idx)!)

          /* this is needed for now as fresh start seem to wipe selected regions */
          /* TODO properly do parse query string so this workaround is not needed */
          /* TODO get rid of the settimeout */
          setTimeout(()=>{
            this.regionSelectionChanged()
          })
        }break;
      }
    })
  }

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
      
      /* hide all segments first, then selectively turn on each selected region */
      this.viewerControl.hideAllSegments()

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


    /* set state */
    switch(mode){
      case 'iEEG Recordings':
      {
        this.nehubaViewer.ngviewer.layerManager.managedLayers.filter((l:any)=>l.initialSpecification ? l.initialSpecification.type == 'segmentation' : false)
          .forEach(l=>(<SegmentationUserLayer>l.layer).displayState.selectedAlpha.restoreState(0.2))
      }
      break;
      case 'Cytoarchitectonic Probabilistic Map':
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
              shader : this.nehubaCurrentSegment && this.nehubaCurrentSegment.name == r.name ? getActiveColorMapFragmentMain() : parseRegionRgbToFragmentMain(r)
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
    this.dataService.fetchTemplates
      .then((this.dataService.fetchDatasets).bind(this.dataService))
      .then(templates=>(this.loadedTemplates = templates,Promise.resolve()))
      .then(()=>
        this.parseQueryString( window.location.search ))
      .catch((e:any)=>{
        console.error('fetching initial dataset error',e)
      })
    
    
    /* dev option, use a special endpoint to fetch all plugins */
    fetch('http://localhost:5080/collectPlugins')
      .then(res=>res.json())
      .then(arr=>this.loadedPlugins = (<Array<any>>arr).map(json=>new LabComponent(json)))
      .catch(console.warn)
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

    /* temp */
    window['unloadNG'] = (this.unloadTemplate).bind(this)
  }

  urlToPush:URL = new URL(window.location)

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
        /* reset pmap shader (if exists) */
        if(this.nehubaCurrentSegment && this.nehubaViewer && this.nehubaViewer.ngviewer.layerManager.getLayerByName(`PMap ${this.nehubaCurrentSegment.name}`)){
          const layer = this.nehubaViewer.ngviewer.layerManager.getLayerByName(`PMap ${this.nehubaCurrentSegment.name}`) as ManagedUserLayerWithSpecification
          (<ImageUserLayer>layer.layer).fragmentMain.restoreState(parseRegionRgbToFragmentMain(this.nehubaCurrentSegment))
        }

        this.nehubaCurrentSegment = this.findRegionWithId(ev.segment)

        /* highlight new highlighted segment */
        if(this.nehubaCurrentSegment && this.nehubaViewer && this.nehubaViewer.ngviewer.layerManager.getLayerByName(`PMap ${this.nehubaCurrentSegment.name}`)){
          const layer = this.nehubaViewer.ngviewer.layerManager.getLayerByName(`PMap ${this.nehubaCurrentSegment.name}`) as ManagedUserLayerWithSpecification
          (<ImageUserLayer>layer.layer).fragmentMain.restoreState(getActiveColorMapFragmentMain())
        }
        VIEWER_CONTROL.mouseOverNehuba.next({
          nehubaOutput : ev,
          foundRegion : this.findRegionWithId(ev.segment)
        })
      })
    })

    /* clear widgets and viewing mode */
    this.selectTemplateBSubject.subscribe((template)=>{
      this.queryChangeSubject.next({
        'selectedTemplate': template ? template.name : null
      })
      /* TODO temporary measure */
        
      /* loading a new template destroys all widgets. which also destroys select region widgit. */
      /* temporary bandaid, set viewing mode to something else, so that when template is selected new instances of widgets will be instantiated */
      if(this.viewingMode!='Select atlas regions') setTimeout(()=>this.setMode('Select atlas regions'))
      this.selectedRegions = []
    })

    this.queryChangeSubject.subscribe((keyval:any)=>{
      const search = new URLSearchParams( this.urlToPush.search )
      Object.keys(keyval).forEach(key=>{
        keyval[key] ? search.set(key,keyval[key]) : search.delete(key)
      })
      this.urlToPush.search = search.toString()
    })

    this.queryChangeSubject
      .debounceTime(200)
      .subscribe(()=>{
        if(this.urlToPush) history.replaceState(null,'',this.urlToPush.toString())
      })

    this.viewingModeBSubject.subscribe((mode:string)=>{
      this.queryChangeSubject.next({
        viewingMode : mode
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

  unloadTemplate():void
  {
    this.selectTemplateBSubject.next(null)
  }

  loadTemplate(templateDescriptor:TemplateDescriptor):void
  {
    /* TODO temporary measure, find permanent solution */
    /* loading a new template destroys all widgets. which also destroys select region widgit. */
    /* temporary bandaid, set viewing mode to something else, so that when template is selected new instances of widgets will be instantiated */
    this.viewingMode = ``
    
    if ( this.selectedTemplate == templateDescriptor ){
      return
    } 
    // else if( this.selectedTemplate ) {
    //   this.unloadTemplate()
    // }

    // hash needs to be reset, or else neuroglancer will take the old hash and put in new viewer
    window.location.hash = ``
    this.selectTemplateBSubject.next(templateDescriptor)
    this.onTemplateSelectionHook.forEach(cb=>cb())

    VIEWER_CONTROL.loadTemplate(templateDescriptor)
    this.selectedTemplate = templateDescriptor

    this.darktheme = this.selectedTemplate.useTheme == 'dark'
    EXTERNAL_CONTROL.metadata.selectedTemplate = this.selectedTemplate
    
    this.afterTemplateSelectionHook.forEach(cb=>cb())

    /**
     * temporary workaround. 
     */
    // setTimeout(()=>{
      this.loadParcellation( templateDescriptor.parcellations[0] )
      this.sendUISelectedRegionToViewer()
    // },5000)

    /* TODO potentially breaks. selectedRegions should be cleared after each loadParcellation */
    EXTERNAL_CONTROL.metadata.selectedRegions = []

  }

  loadParcellation(parcellation:ParcellationDescriptor):void
  {
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
  regionSelectionChanged()
  {
    this.passCheckSetMode(this.viewingMode)
  }

  updateRegionDescriptors(labelIndices:number[])
  {
    EXTERNAL_CONTROL.metadata.selectedRegions = []
    this.regionsLabelIndexMap.forEach(region=>region.enabled=false)
    labelIndices.forEach(idx=>{
      const region = this.regionsLabelIndexMap.get(idx)
      if(region) {
        region.enabled = true
        EXTERNAL_CONTROL.metadata.selectedRegions.push(region)
      }
    })
    
    this.queryChangeSubject.next({
      selectedRegions : this.selectedRegions.map(r=>r.labelIndex).join('_').toString()
    })
  }
  
  findRegionWithId(id : number|null):RegionDescriptor|null
  {
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
  
  sendUISelectedRegionToViewer()
  {
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


  /**
   * hibernating functions
   * TODO remove
   */
  
  fetchedSomething(sth:any)
  {
    switch( sth.constructor )
    {
      case TemplateDescriptor:
      {

      }
      break;
      case ParcellationDescriptor:
      {
        if (!this.selectedTemplate)
        {
          //TODO add proper feedback
          console.log('throw error: maybe you should selected a template first')
        } else 
        {
          this.selectedTemplate.parcellations.push(sth)
        }
      }
      break;
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
  selectedMultilevel : Multilevel[]

  constructor(private mainController:MainController)
  {
    
  }

  checkMultilevelVisibility(){

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

  hasVisibleChildren(m:MultilevelSelector):boolean{
    return m.childrenMultilevel && m.childrenMultilevel.length > 0 ?
      m.childrenMultilevel.some( c=> c.isVisible || this.hasVisibleChildren(c)):
      m.isVisible
  }
}

@Injectable()
export class WidgitServices
{
  constructor(private mainController:MainController)
  {
    this.mainController.selectTemplateBSubject.subscribe((_template)=>{
      if(this._unloadAll) this._unloadAll()
      this.loadedWidgets = []
      this.loadedLabComponents = []
    })
  }

  loadedWidgets : WidgetComponent[] = []
  loadedLabComponents : LabComponent[] = []

  /* tobe overwritten by view */
  _loadWidgetFromLabComponent : (labComponent:LabComponent)=>WidgetComponent

  loadWidgetFromLabComponent(labComponent:LabComponent)
  {
    if(PLUGIN_CONTROL[labComponent.name])
    {
      (<LabComponentHandler>PLUGIN_CONTROL[labComponent.name]).blink(10)
      return null
    } else {
      const newWidget = this._loadWidgetFromLabComponent(labComponent)
      this.loadedWidgets.push(newWidget)
      return newWidget
    }
  }

  /* tobe overwritten by view */
  _widgitiseTemplateRef : (templateRef:TemplateRef<any>,metadata:WidgitiseTempRefMetaData)=>WidgetComponent 
  
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
    console.log('unloading labcomponent')
    delete PLUGIN_CONTROL[labComponent.name]
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

  constructor(public mainController:MainController){

    const encoder = new TextEncoder()
    const blob = new Blob([encoder.encode(TEMP_ICOSAHEDRON_VTK)],{type:'application/octet-stream'})
    this.TEMP_icosahedronVtkUrl = URL.createObjectURL(blob)
    
    const encoder2 = new TextEncoder()
    const blob2 = new Blob([encoder2.encode(TEMP_CROSS_VTK)],{type:'application/octet-stream'})
    this.TEMP_crossVtkUrl = URL.createObjectURL(blob2)

    this.mainController.viewingModeBSubject.subscribe(_mode=>{
      this.landmarks = []
      if(this.mainController.nehubaViewer){
        this.TEMP_clearVtkLayers()
      }
    })
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

  }

  /* should always use larger for width when doing spatial querying */
  /* otherwise, some parts of the viewer will be out of bounds */
  querySpatialData : (center:[number,number,number],width:number,templateSpace:string ) => void = (center,width,templateSpace)=>
  {
    if(this.mainController.viewingMode == 'iEEG Recordings')
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
export class ModalServices{
  constructor(public mainController:MainController){

  }
  getModalHandler:()=>ModalHandler
}

class DataService {

  /* simiple fetch promise for json obj */
  /* nb: return header must contain Content-Type : application/json */
  /* nb: return header must container CORS header */

  /* TODO temporary solution fetch available template space from KG  */
  datasetArray = [
    'res/json/bigbrain.json',
    'res/json/colin.json',
    'res/json/waxholmRatV2_0.json',
    'res/json/allenMouse.json'
  ]
  COLIN_JUBRAIN_PMAP_INFO = `res/json/colinJubrainPMap.json`
  COLIN_IEEG_INFO = `res/json/colinIEEG.json`
  COLIN_JUBRAIN_RECEPTOR_INFO = `res/json/colinJubrainReceptor.json`


  // datasetArray = [
  //   'http://localhost:5080/res/json/bigbrain.json',
  //   'http://localhost:5080/res/json/colin.json',
  //   'http://localhost:5080/res/json/waxholmRatV2_0.json',
  //   'http://localhost:5080/res/json/allenMouse.json'
  // ]

  // COLIN_JUBRAIN_PMAP_INFO = `http://localhost:5080/res/json/colinJubrainPMap.json`
  // COLIN_IEEG_INFO = `http://localhost:5080/res/json/colinIEEG.json`
  // COLIN_JUBRAIN_RECEPTOR_INFO = `http://localhost:5080/res/json/colinJubrainReceptor.json`
  
  fetchTemplates:Promise<TemplateDescriptor[]> = new Promise((resolve,reject)=>{
    Promise.all(this.datasetArray.map(dataset=>
      this.fetchJson(dataset)
        .then((json:any)=>
          this.parseTemplateData(json))))
      .then(templates=>resolve(templates))
      .catch(e=>reject(e))
  })

  fetchDatasets(templates:TemplateDescriptor[]):Promise<TemplateDescriptor[]>{
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
              'iEEG Recordings' : datas[1],
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

export const parseRegionRgbToFragmentMain = (r:RegionDescriptor):string=>`void main(){float x = toNormalized(getDataValue()); ${parseRegionRgbToGlsl(r)}if(x>${CM_THRESHOLD}){emitRGBA(vec4(r,g,b,x));}else{emitTransparent();}}`
export const getActiveColorMapFragmentMain = ():string=>`void main(){float x = toNormalized(getDataValue());${CM_MATLAB_JET}if(x>${CM_THRESHOLD}){emitRGB(vec3(r,g,b));}else{emitTransparent();}}`

export const parseRegionRgbToGlsl = (r:RegionDescriptor):string => {
  return (r.rgb.map((color,idx)=>`${idx == 0 ? 'float r' : idx == 1 ? 'float g' : idx == 2 ? 'float b' : 'float a'} = ${(color/255).toFixed(3)};`).join('') + `float a = 1.0;`)
}
export const CM_MATLAB_HOT = `float r=clamp(8.0/3.0*x,0.0,1.0);float a = clamp(x,0.0,1.0);float g=clamp(8.0/3.0*x-1.0,0.0,1.0);float b=clamp(4.0*x-3.0,0.0,1.0);`
// export const CM_MATLAB_JET = `if (x < 0.7) {  float r = clamp(4.0 * x - 1.5, 0.0, 1.0);} else {  float r = clamp(-4.0 * x + 4.5, 0.0, 1.0);}if (x < 0.5) {  float g = clamp(4.0 * x - 0.5, 0.0, 1.0);} else {  float g = clamp(-4.0 * x + 3.5, 0.0, 1.0);}if (x < 0.3) {  float b = clamp(4.0 * x + 0.5, 0.0, 1.0);} else {  float b = clamp(-4.0 * x + 2.5, 0.0, 1.0);}`
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

// export const TEMP_RECEPTORDATA_BASE_URL = `http://imedv02.ime.kfa-juelich.de:5081/plugins/receptorBrowser/data/`
export const TEMP_RECEPTORDATA_BASE_URL = `http://localhost:5080/pluginDev/receptorBrowser/data/`
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
        <span (click)="popall()" clickables> root </span>
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
      class = "btn btn-block btn-default"
      (click)="popStack()" 
      *ngIf="historyStack.length != 0"
      backBtn>

      <i class = "glyphicon glyphicon-chevron-left"></i> 
      <small>
        Back
      </small>
    </div>
    <div 
      (click) = "enterStack(key)" 
      class = "btn btn-block btn-default" 
      *ngFor="let key of focusStack | keyPipe">

      <small>
        {{key}} 
        <i *ngIf="focusStack[key].constructor.name == 'String'" class = "glyphicon glyphicon-picture"></i> 
        <i *ngIf="focusStack[key].constructor.name == 'Object'" class = "glyphicon glyphicon-chevron-right"></i> 
      </small>
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
      margin:0em 0em;
      padding:0.2em 0.5em;
      background-color:rgba(0,0,0,0.2);
    }
    .btn
    {
      padding:0.2em 0.5em;
      margin:0em;
      text-align:left;
    }
    .btn[backBtn]
    {
      margin-bottom:1px;
    }
    `
  ]
})

export class TempReceptorData{
  @Input() regionName : string = ``
  @Output() receptorString : EventEmitter<string|null> = new EventEmitter()
  @Output() neurotransmitterName : EventEmitter<string|null> = new EventEmitter()
  @Output() modeName : EventEmitter<string|null> = new EventEmitter()

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
    this.neurotransmitterName.emit(null)
  }

  enterStack(key:string){
    this.historyStack.push(this.focusStack)
    this.choiceStack.push(key)
    if(typeof this.focusStack[key] == 'string'){
      const emitItem = this.focusStack[key]
      this.focusStack = []
      this.receptorString.emit(emitItem)
      this.neurotransmitterName.emit(key)
    }else{
      this.focusStack = this.focusStack[key]
      this.receptorString.emit(null)
      this.neurotransmitterName.emit(null)
    }
  }
}

export const initMultilvl = (json:any):Multilevel=>{
  const m = new Multilevel()
  m.name = json.name ? json.name : 'Untitled'
  m.children = json.children.constructor == Array ? 
    (<any[]>json.children).map(it=>
      initMultilvl(it)) : 
    []
  return m
}

export const RECEPTOR_DATASTRUCTURE_JSON = {
  name : 'Receptor Browser',
  children : [
    {
      name : 'Fingerprint',
      children : []
    },{
      name : 'Glutamate',
      children : [
        {
          name : `AMPA`,
          children : []
        },
        {
          name : `NMDA`,
          children : []
        },
        {
          name : `kainate`,
          children : []
        },
        {
          name : `mGluR2_3`,
          children : []
        }
      ]
    },{
      name : 'GABA',
      children : [
        {
          name : `GABAA`,
          children : []
        },
        {
          name : `GABAB`,
          children : []
        }
      ]
    }
  ]
}

// export const receptorBrowserMultilevel = new Multilevel();

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
