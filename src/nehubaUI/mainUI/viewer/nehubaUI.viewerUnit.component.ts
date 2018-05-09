import { Component, OnDestroy, AfterViewInit, ViewChild, ElementRef, TemplateRef } from '@angular/core'
import { vec3,NehubaViewer,Config as NehubaViewerConfig, createNehubaViewer, sliceRenderEventType, SliceRenderEventDetail } from 'nehuba/exports';

import { Observable,Subject } from 'rxjs/Rx'
import { RegionDescriptor, ParcellationDescriptor } from 'nehubaUI/nehuba.model';
import { FloatingTooltip } from 'nehubaUI/components/floatingTooltip/nehubaUI.floatingTooltip.component';
import { MainController, SpatialSearch, LandmarkServices, Animation, parseRegionRgbToFragmentMain, getActiveColorMapFragmentMain, TEMP_SearchDatasetService, WidgitServices } from 'nehubaUI/nehubaUI.services';
import { ManagedUserLayer } from 'neuroglancer/layer'

import template from './nehubaUI.viewerUnit.template.html'
import css from './nehubaUI.viewerUnit.style.css'
import { ImageUserLayer } from 'neuroglancer/image_user_layer';
import { ManagedUserLayerWithSpecification } from 'neuroglancer/layer_specification';
import { SegmentationUserLayer } from 'neuroglancer/segmentation_user_layer';
import { filter } from 'rxjs/operators';
import { INTERACTIVE_VIEWER } from 'nehubaUI/exports';
import { WidgetComponent } from 'nehubaUI/components/floatingWindow/nehubaUI.widgets.component';

declare var window:{
  [key:string] : any
  prototype : Window;
  new() : Window;
}

@Component({
  template : template ,
  styles : [ css ],
  providers : [ TEMP_SearchDatasetService ]
})
export class NehubaViewerComponent implements OnDestroy,AfterViewInit{
  public nehubaViewer : NehubaViewer
  viewerConfig : NehubaViewerConfig
  darktheme : boolean
  sliceViewZoom : number
  viewerPosReal : number[] = [0,0,0]
  viewerPosVoxel : number[] = [0,0,0]
  viewerOri : number[] = [0,0,0,1]
  perspectiveOri : number[] = [0,0,0,1]
  perspectiveViewZoom : number
  viewerSegment : RegionDescriptor | number | null
  mousePosReal :  number[] = [0,0,0]
  mousePosVoxel :  number[] = [0,0,0]
  
  @ViewChild('datasetsResultWidget',{read:TemplateRef}) datasetsResultWidget : TemplateRef<any>

  editingNavState : boolean = false
  textNavigateTo(string:string){
    if(string.split(/[\s|,]+/).length>=3 && string.split(/[\s|,]+/).slice(0,3).every(entry=>!isNaN(Number(entry.replace(/mm/,''))))){
      this.navigate(
        string.split(/[\s|,]+/).slice(0,3).map(entry=>Number(entry.replace(/mm/,''))*(this.statusPanelRealSpace ? 1000000 : 1)),
        0,
        this.statusPanelRealSpace
      )
    }else{
      console.log('input did not parse to coordinates ',string)
    }
  }

  navToModel(){
    return this.statusPanelRealSpace ? 
      Array.from(this.viewerPosReal.map(n=> isNaN(n) ? 0 : n/1e6))
        .map(n=>n.toFixed(3)+'mm').join(' , ') :
      Array.from(this.viewerPosVoxel.map(n=> isNaN(n) ? 0 : n)).join(' , ')
  }

  get mouseCoord(){
    return this.statusPanelRealSpace ? 
      Array.from(this.mousePosReal.map(n=> isNaN(n) ? 0 : n/1e6))
        .map(n=>n.toFixed(3)+'mm').join(' , ') : 
      this.mousePosVoxel.join(' , ')
  }

  statusPanelRealSpace : boolean = true

  segmentListener : any = {}

  spatialSearchWidth : number
  nanometersToOffsetPixelsFn : Function[] | null[] = [null,null,null]
  rotate3D : number[] | null = null

  @ViewChild(FloatingTooltip) floatingPopover : FloatingTooltip
  @ViewChild('container',{read:ElementRef}) viewerContainer : ElementRef

  constructor(
    private widgetServices : WidgitServices,
    public searchDatasetServce : TEMP_SearchDatasetService,
    private mainController : MainController,
    public spatialSearch : SpatialSearch,
    public landmarkServices : LandmarkServices){

    this.mainController.selectedParcellationBSubject
      .debounceTime(10)
      .takeUntil(this.destroySubject)
      .subscribe((parcellation)=>{
        if(parcellation) this.applyNehubaMeshFix()
      })
  }

  destroySubject : Subject<boolean> = new Subject()

  public ngOnDestroy(){
    this.nehubaViewer.dispose()
    window['nehubaViewer'] = null
    
    this.destroySubject.next(true)
    this.destroySubject.complete()
  }

  widgetComponent : WidgetComponent 
  public ngAfterViewInit(){
    this.mainController.selectedTemplateBSubject
      .takeUntil(this.destroySubject)
      .delay(0) //to avoid potential race condition with widgetService.unloadAll() call on template select
      .subscribe((template)=>{
        
        this.widgetComponent = this.widgetServices.widgitiseTemplateRef(this.datasetsResultWidget,{name:'Data Browser'})
        this.widgetComponent.changeState('docked')

        /* spatial query on tempalte select */
        this.spatialSearch.querySpatialData(this.viewerPosReal as [number,number,number],this.spatialSearchWidth,template ? template.name : '')
      })
    
  }

  public createNewNehubaViewerWithConfig(config:NehubaViewerConfig){
    this.viewerConfig = config

    this.nehubaViewer = createNehubaViewer(config,(err)=>{
      /* TODO: error handling?*/
      console.log('createnehubaviewer error handler',err)
    })
     
    this.mainController.nehubaViewer = this.nehubaViewer
    this.nehubaViewer.applyInitialNgState()

    /* handles both selectedregion change and viewing mode change */
    Observable
      .combineLatest(
        this.mainController.selectedTemplateBSubject,
        this.mainController.resultsFilterBSubject,
        this.mainController.selectedRegionsBSubject,
        this.mainController.dedicatedViewBSubject)
      .delay(10) /* seems necessary, otherwise, on start up segments won't show properly */
      .takeUntil(this.destroySubject) /* TIL, order matters. if delay was after take until, last event will fire after destroy subject fires */
      .subscribe(([_template,_mode,regions,dedicatedView])=>{

        /* TODO will need to handle showing PMaps  */
        if(regions.length == 0){
          this.allSeg(true)
        }else{
          this.allSeg(false)
          regions.map(re=>re.labelIndex).forEach((this.showSeg).bind(this))
        }

        if(dedicatedView){
          const idx = dedicatedView.indexOf('://')
          idx < 0 ? 
            console.warn('could not parse dedicated view protocol!') :
            dedicatedView.slice(0,idx) == 'nifti' ? 
              (
                this.allSeg(false),
                this.loadLayer({
                  nehubaNifti : {
                    type : 'image',
                    source : dedicatedView,
                    shader : getActiveColorMapFragmentMain()
                  }
                })
              ) : 
              console.warn('could not parse dedicated view param!')
        }else{
          this.removeLayer({
            name : 'nehubaNifti'
          })
        }

        
        
        // if(mode == 'Cytoarchitectonic Probabilistic Map'){
        //   /* turn off the visibility of all pmaps first */
        //   this.setLayerVisibility({name:/^PMap/},false)

        //   /* load pmaps that have not yet been loaded */
        //   this.loadLayer( regions
        //     .filter(r=>r.moreInfo.findIndex(info=>info.name==mode)>=0)
        //     .reduce((prev:any,r:RegionDescriptor)=>{
        //       const obj : any = {}
        //       obj[`PMap ${r.name}`] = {
        //         type : 'image',
        //         source : r.moreInfo.find(info=>info.name==mode)!.source,
        //         shader : this.viewerSegment && this.viewerSegment.constructor == RegionDescriptor && (<RegionDescriptor>this.viewerSegment).name == r.name ? getActiveColorMapFragmentMain() : parseRegionRgbToFragmentMain(r)
        //       }
        //       return Object.assign({},prev,obj)
        //     },{}))

        //   /* turn on the pmaps of the selected regions */
        //   regions.map(r=>({name : `PMap ${r.name}`})).forEach(layerObj=>this.setLayerVisibility(layerObj,true))
          
        //   /* turn off the segmentation layer */
        //   this.allSeg(false)
        // }else{
        //   this.removeLayer({name:/^PMap/})
        // }

        // if(mode == 'iEEG Recordings'){
        //   this.allSeg(false)
        //   regions.map(re=>re.labelIndex).forEach(i=>this.showSeg(i))

        //   this.spatialSearch.querySpatialData(this.viewerPosReal.map(num=>num/1000000) as [number,number,number],this.spatialSearchWidth,`Colin 27`)
        //   this.setSegmentationLayersOpacity(0.2)
        // }else{
        //   this.setSegmentationLayersOpacity(template? template.name == 'Big Brain (Histology)' ? 0.0 : 0.5 : 0.5)
        // }

        // if(mode === null || mode == 'Receptor Data'){
          
          
        // }else{

        // }
      })
    
    /**
     * map slice view event to nanometer to offset pixel fn
     */

    const filterSliceViewEvent = (left:boolean,top:boolean) => filter((ev:CustomEvent)=>{
      const el = ev.target as HTMLElement
      return  (el.offsetLeft < 5) == left && (el.offsetTop < 5) == top
    })

    /* TODO determine if this was necessary */
    const getObservableBasedonLocation = (left:boolean,top:boolean) =>
      Observable
        .fromEvent((<HTMLElement>this.viewerContainer.nativeElement),sliceRenderEventType )
        .map(ev=>ev as CustomEvent)
        .pipe(filterSliceViewEvent(left,top))
        .throttleTime(100)
        .take(1)
        // .takeUntil(this.destroySubject)

    /* top left */
    getObservableBasedonLocation(true,true)
      .subscribe(ev=>{
        const detail = ev.detail as SliceRenderEventDetail
        this.nanometersToOffsetPixelsFn[0] = detail.nanometersToOffsetPixels
      })
    
    /* bottom left */
    getObservableBasedonLocation(true,false)
      .subscribe(ev=>{
        const detail = ev.detail as SliceRenderEventDetail
        this.nanometersToOffsetPixelsFn[2] = detail.nanometersToOffsetPixels
      })

    /* top right */
    getObservableBasedonLocation(false,true)
      .subscribe(ev=>{
        const detail = ev.detail as SliceRenderEventDetail
        this.nanometersToOffsetPixelsFn[1] = detail.nanometersToOffsetPixels
      })

    /**
     * attaching the mouse/navigation real/voxel listeners
     */
    Observable
      .from(this.nehubaViewer.mousePosition.inRealSpace)
      .takeUntil(this.destroySubject)
      .subscribe((pos:any)=>
        this.mousePosReal = pos ? pos : this.mousePosReal)
    
    Observable
      .from(this.nehubaViewer.mousePosition.inVoxels)
      .takeUntil(this.destroySubject)
      .subscribe((pos:any)=>this.mousePosVoxel = pos ? pos :this.mousePosVoxel)
    
    Observable
      .from(this.nehubaViewer.navigationState.all)
      .takeUntil(this.destroySubject)
      .subscribe(ev=>{
        /* TODO fix this */
        this.mainController.viewerStateBSubject.next(ev)
      })
    
    Observable
      .combineLatest(
        this.nehubaViewer.navigationState.position.inRealSpace,
        this.mainController.selectedTemplateBSubject)
      .takeUntil(this.destroySubject)
      .subscribe((arr:any)=>{
        const [pos,template] = arr
        this.viewerPosReal = pos

        /* spatial query */
        const container = (<HTMLElement>this.viewerContainer.nativeElement)
        this.spatialSearchWidth = Math.max(container.clientHeight/4,container.clientWidth/4) * this.sliceViewZoom / 1000000
        /* width in mm */
        this.spatialSearch.querySpatialData(this.viewerPosReal.map(num=>num/1000000) as [number,number,number],this.spatialSearchWidth,template ? template.name : '')
      })
    
    Observable
      .from(this.nehubaViewer.navigationState.position.inVoxels)
      .takeUntil(this.destroySubject)
      .subscribe((pos:any)=>this.viewerPosVoxel=pos)

    Observable
      .from(this.nehubaViewer.navigationState.orientation)
      .takeUntil(this.destroySubject)
      .subscribe((ori:any)=>this.viewerOri=ori)

    Observable
      .from(this.nehubaViewer.navigationState.perspectiveOrientation)
      .takeUntil(this.destroySubject)
      .subscribe((ori:any)=>this.perspectiveOri=ori)
    
    Observable
      .combineLatest(
        this.nehubaViewer.navigationState.sliceZoom,
        this.mainController.selectedTemplateBSubject)
      .takeUntil(this.destroySubject)
      .subscribe((arr:any)=>{
        const [zoom, template] = arr
        this.sliceViewZoom = zoom
      
        /* spatial query */
        const container = (<HTMLElement>this.viewerContainer.nativeElement)
        this.spatialSearchWidth = Math.max(container.clientHeight/4,container.clientWidth/4) * this.sliceViewZoom / 1000000
        /* width in mm */
        this.spatialSearch.querySpatialData(this.viewerPosReal.map(num=>num/1000000) as [number,number,number],this.spatialSearchWidth,template ? template.name : '')
      })

    Observable
      .from(this.nehubaViewer.navigationState.perspectiveZoom)
      .takeUntil(this.destroySubject)
      .subscribe((zoom:any)=>this.perspectiveViewZoom=zoom)

    /* hibernating listener */
    Observable
      .from(this.nehubaViewer.mouseOver.image)
      .takeUntil(this.destroySubject)
      .subscribe(ev=>{
        this.segmentListener[ev.layer.name] = ev.value
      })

    /**
     * attaches viewerSegmentHover listener
     */
    Observable
      .from(this.nehubaViewer.mouseOver.segment)
      .takeUntil(this.destroySubject)
      .subscribe((seg:any)=>{
        /* seg.segment = number | 0 | null seg.layer */

        /* PMap Custom Code ... reset PMap default shader */
        if(this.viewerSegment && 
          this.viewerSegment.constructor == RegionDescriptor &&
          this.nehubaViewer.ngviewer.layerManager.getLayerByName(`PMap ${(<RegionDescriptor>this.viewerSegment).name}`)){

          const layer = this.nehubaViewer.ngviewer.layerManager.getLayerByName(`PMap ${(<RegionDescriptor>this.viewerSegment).name}`) as ManagedUserLayerWithSpecification
          (<ImageUserLayer>layer.layer).fragmentMain.restoreState(parseRegionRgbToFragmentMain(<RegionDescriptor>this.viewerSegment))
        }

        /* setting viewerSegment */
        const foundRegion = (seg.segment && seg.segment!= 0) ? 
          this.mainController.regionsLabelIndexMap.get(seg.segment) :
          undefined

        this.viewerSegment = typeof foundRegion == 'undefined' || typeof foundRegion == 'number' ? 
          null :
          foundRegion

        /* PMap Custom Code ... highlight hover region to Matlab Jet colour map */
        if(this.viewerSegment && 
          this.viewerSegment.constructor == RegionDescriptor &&
          this.nehubaViewer.ngviewer.layerManager.getLayerByName(`PMap ${(<RegionDescriptor>this.viewerSegment).name}`)){
            
          const layer = this.nehubaViewer.ngviewer.layerManager.getLayerByName(`PMap ${(<RegionDescriptor>this.viewerSegment).name}`) as ManagedUserLayerWithSpecification
          (<ImageUserLayer>layer.layer).fragmentMain.restoreState(getActiveColorMapFragmentMain())
        }

        INTERACTIVE_VIEWER.viewerHandle.mouseOverNehuba.next({
          nehubaOutput : seg,
          foundRegion : foundRegion ? foundRegion : null
        })
      })

    /* patch surface parcellation of JuBrain */
    Observable.from(this.nehubaViewer.getShownSegmentsObservable())
      .takeUntil(this.destroySubject)
      .filter(()=>
        (typeof this.mainController.selectedParcellation != 'undefined') &&
        this.mainController.selectedParcellation.surfaceParcellation)
      .subscribe(segs=>{
        if( segs.length == 0 ){
          this.nehubaViewer.clearCustomSegmentColors()
          this.nehubaViewer.batchAddAndUpdateSegmentColors( this.mainController.selectedParcellation!.colorMap )
        }else{
          const newColormap = new Map()
          const blankColor = {red:255,green:255,blue:255}
          this.mainController.selectedParcellation!.colorMap.forEach((activeValue,key)=>{
            newColormap.set(key, segs.find(seg=>seg==key) ? activeValue : blankColor)
          })
          this.nehubaViewer.clearCustomSegmentColors()
          this.nehubaViewer.batchAddAndUpdateSegmentColors( newColormap )
        }
      })

    INTERACTIVE_VIEWER.viewerHandle.segmentColorMap = this.mainController.selectedParcellation!.colorMap
    INTERACTIVE_VIEWER.viewerHandle.reapplyColorMap = (colormap)=>{ 
      this.nehubaViewer.batchAddAndUpdateSegmentColors( colormap )
    }

    window['nehubaViewer'] = this.nehubaViewer

    Observable.merge(
      this.nehubaViewer.mouseOver.segment,
      this.nehubaViewer.navigationState.sliceZoom,
      this.nehubaViewer.navigationState.perspectiveZoom)
        .takeUntil(this.destroySubject)
        .subscribe((_ev:any)=>{
          //console.log('debug heartbeat',ev)
        })
  }

  public loadParcellation(_parcellation:ParcellationDescriptor){

  }

  public perspectiveZoom(zoom:number,duration:number){

    if(duration > 0){
      let deltaZoom = zoom - this.perspectiveViewZoom
      let startZoom = this.perspectiveViewZoom
  
      let iterator = (new Animation(duration,'linear')).generate()
      let newAnimationFrame = () =>{
        let iteratedValue = iterator.next()
        this._setPerspectiveZoom(startZoom + deltaZoom*iteratedValue.value)
        if(!iteratedValue.done){
          requestAnimationFrame(newAnimationFrame)
        }
      }
      requestAnimationFrame(newAnimationFrame)
    }else{
      this._setPerspectiveZoom(zoom)
    }
  }

  /* TODO waiting for proper api to do this */
  private _setPerspectiveZoom(zoom:number){
    this.nehubaViewer.ngviewer.perspectiveNavigationState.zoomFactor.restoreState(zoom)
  }

  public sliceZoom(zoom:number,duration:number){

    if(duration > 0){
      let deltaZoom = zoom - this.sliceViewZoom
      let startZoom = this.sliceViewZoom
  
      let iterator = (new Animation(duration,'linear')).generate()
      let newAnimationFrame = () =>{
        let iteratedValue = iterator.next()
        this._setSliceZoom(startZoom + deltaZoom*iteratedValue.value)
        if(!iteratedValue.done){
          requestAnimationFrame(newAnimationFrame)
        }
      }
      requestAnimationFrame(newAnimationFrame)
    }else{
      this._setSliceZoom(zoom)
    }
  }

  /* TODO waiting for proper api to do this */
  private _setSliceZoom(zoom:number){
    this.nehubaViewer.ngviewer.navigationState.zoomFactor.restoreState(zoom)
  }

  public perspectiveRotate(ori:number[],duration:number){
    const currentPerspectiverOri = Array.from(this.perspectiveOri)
    if(duration > 0){
      let deltaOri = ([
        ori[0] - currentPerspectiverOri[0],
        ori[1] - currentPerspectiverOri[1],
        ori[2] - currentPerspectiverOri[2],
        ori[3] - currentPerspectiverOri[3]
      ]).slice()
      let startori = (currentPerspectiverOri).slice()
  
      let iterator = (new Animation(duration,'linear')).generate()
      let newAnimationFrame = () =>{
        let iteratedValue = iterator.next()
        this._setPerspectiveRotation(startori.map((ori,idx)=>ori+deltaOri[idx]*iteratedValue.value))
        if(!iteratedValue.done){
          requestAnimationFrame(newAnimationFrame)
        }
      }
      requestAnimationFrame(newAnimationFrame)
    }else{
      this._setPerspectiveRotation(ori)
    }
  }

  /* TODO waiting for proper api to do this */
  private _setPerspectiveRotation(ori:number[]){
    this.nehubaViewer.ngviewer.perspectiveNavigationState.pose.orientation.restoreState(ori)
  }

  public obliqueRotate(ori:number[],duration:number){
    const currentViewerOri = Array.from(this.viewerOri)
    if(duration > 0){
      let deltaOri = ([
        ori[0] - currentViewerOri[0],
        ori[1] - currentViewerOri[1],
        ori[2] - currentViewerOri[2],
        ori[3] - currentViewerOri[3]
      ]).slice()
      let startori = (currentViewerOri).slice()
  
      let iterator = (new Animation(duration,'linear')).generate()
      let newAnimationFrame = () =>{
        let iteratedValue = iterator.next()
        this._setObliqueRotate(startori.map((ori,idx)=>ori+deltaOri[idx]*iteratedValue.value))
        if(!iteratedValue.done){
          requestAnimationFrame(newAnimationFrame)
        }
      }
      requestAnimationFrame(newAnimationFrame)
    }else{
      this._setObliqueRotate(ori)
    }
  }

  /* TODO waiting for proper api to do this */
  private _setObliqueRotate(ori:number[]){
    this.nehubaViewer.ngviewer.navigationState.pose.orientation.restoreState(ori)
  }

  public navigate(pos:number[],duration:number,realSpace:boolean){
    /* TODO: waiting on nehubaViewer api to implement rotation */
    
    if( duration>0 ){
      /* slice is required to make clones of the values */
      /* or else the values (startPos/deltaPos) will change mid-animation */
      let deltaPos = ([
        pos[0]-this.viewerPosReal[0],
        pos[1]-this.viewerPosReal[1],
        pos[2]-this.viewerPosReal[2]
      ]).slice()
      let startPos = (this.viewerPosReal).slice()
  
      let iterator = (new Animation(duration,'linear')).generate()
      let newAnimationFrame = () =>{
        let iteratedValue = iterator.next()
        this.nehubaViewer.setPosition(vec3.fromValues(
          startPos[0]+deltaPos[0]*iteratedValue.value,
          startPos[1]+deltaPos[1]*iteratedValue.value,
          startPos[2]+deltaPos[2]*iteratedValue.value
        ),realSpace)
        if(!iteratedValue.done){
          requestAnimationFrame(newAnimationFrame)
        }
      }
      requestAnimationFrame(newAnimationFrame)
    }else{
      this.nehubaViewer.setPosition(vec3.fromValues(pos[0],pos[1],pos[2]),realSpace)
    }
  }

  public showSeg(id:number){
    this.nehubaViewer.showSegment(id)
  }

  public hideSeg(id:number){
    this.nehubaViewer.hideSegment(id)
  }

  public allSeg(show:boolean){
    this.nehubaViewer.getShownSegmentsNow().forEach(segID => {
      this.nehubaViewer.hideSegment(segID)
    })
    if( !show ) {
      this.nehubaViewer.showSegment(0)
    }
  }

  private filterLayers(l:any,layerObj:any):boolean{
    return Object.keys(layerObj).length == 0 && layerObj.constructor == Object ?
      true :
      Object.keys(layerObj).every(key=>
        !(<Object>l).hasOwnProperty(key) ? 
          false :
          layerObj[key] instanceof RegExp ?
            layerObj[key].test(l[key]) :
            layerObj[key] == l[key])
  }

  public removeLayer(layerObj:any){

    const viewer = this.nehubaViewer.ngviewer
    const removeLayer = (i:ManagedUserLayer) => (viewer.layerManager.removeManagedLayer(i),i.name)

    return viewer.layerManager.managedLayers
      .filter(l=>this.filterLayers(l,layerObj))
      .map(removeLayer)
  }

  public setLayerVisibility(layerObj:any,visible:boolean){

    const viewer = this.nehubaViewer.ngviewer
    const setVisibility = (i:ManagedUserLayer) => (i.setVisible(visible),i.name)

    return viewer.layerManager.managedLayers
      .filter(l=>this.filterLayers(l,layerObj))
      .map(setVisibility)
  }

  //TODO: do this properly with proper api's
  public loadLayer(layerObj:any){
    const viewer = this.nehubaViewer.ngviewer
    return Object.keys(layerObj)
      .filter(key=>
        /* if the layer exists, it will not be loaded */
        !viewer.layerManager.getLayerByName(key))
      .map(key=>{
        viewer.layerManager.addManagedLayer(
          viewer.layerSpecification.getLayer(key,layerObj[key]))

        return layerObj[key]
      })
    // const state = (<NehubaViewer>window['nehubaViewer']).ngviewer.state.toJSON()
    // Object.keys(layerObj).forEach(key=>state.layers[key]=(<any>layerObj)[key])
    // this.nehubaViewer.ngviewer.state.restoreState(state)
  }

  public setSegmentationLayersOpacity(opacity:number){
    this.nehubaViewer.ngviewer.layerManager.managedLayers.filter((l:any)=>l.initialSpecification ? l.initialSpecification.type == 'segmentation' : false)
      .forEach(l=>(<SegmentationUserLayer>l.layer).displayState.selectedAlpha.restoreState(opacity))
  }

  public applyNehubaMeshFix(){
    this.nehubaViewer.clearCustomSegmentColors()
    if(this.mainController.selectedParcellation){
      this.nehubaViewer.setMeshesToLoad( Array.from(this.mainController.selectedParcellation.colorMap.keys()) )
      this.nehubaViewer.batchAddAndUpdateSegmentColors( this.mainController.selectedParcellation.colorMap )
    }
  }
}
