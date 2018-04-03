import { Component, OnDestroy, AfterViewInit, ViewChild, ElementRef, TemplateRef } from '@angular/core'
import { vec3,NehubaViewer,Config as NehubaViewerConfig, createNehubaViewer, sliceRenderEventType, SliceRenderEventDetail, perspectiveRenderEventType } from 'nehuba/exports';

import { Observable,Subject } from 'rxjs/Rx'
import { RegionDescriptor, ParcellationDescriptor } from 'nehubaUI/nehuba.model';
import { FloatingTooltip } from 'nehubaUI/components/floatingTooltip/nehubaUI.floatingTooltip.component';
import { MainController, SpatialSearch, LandmarkServices, InfoToUIService, VIEWER_CONTROL,EXTERNAL_CONTROL as gExternalControl, Animation } from 'nehubaUI/nehubaUI.services';
import { ManagedUserLayer } from 'neuroglancer/layer'

import template from './nehubaUI.viewerUnit.template.html'
import css from './nehubaUI.viewerUnit.style.css'

declare var window:{
  [key:string] : any
  prototype : Window;
  new() : Window;
}

@Component({
  template : template ,
  styles : [ css ]
})
export class NehubaViewerComponent implements OnDestroy,AfterViewInit{
  public nehubaViewer : NehubaViewer
  viewerConfig : NehubaViewerConfig
  darktheme : boolean
  sliceViewZoom : number
  viewerPosReal : number[] = [0,0,0]
  viewerPosVoxel : number[] = [0,0,0]
  viewerOri : number[] = [0,0,1,0]
  viewerSegment : RegionDescriptor | number | null
  mousePosReal :  number[] = [0,0,0]
  mousePosVoxel :  number[] = [0,0,0]

  // requestAnimationFrameFloatingPopoverFade : any
  // handlerFrameFloatingPopoverFade : any
  // mousemoveOverViewer : Subject<MouseEvent> = new Subject()

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
  @ViewChild('hoverRegionTemplate',{read:TemplateRef}) hoverRegionTemplate : TemplateRef<any>

  onDestroyUnsubscribe : any[] = []
  heartbeatObserver : any

  constructor(
    private mainController:MainController,
    public spatialSearch:SpatialSearch,
    public landmarkServices:LandmarkServices,
    public infoToUIService:InfoToUIService){

    // const metadata = gExternalControl.metadata

    // UI_CONTROL.afterParcellationSelection(()=>{
    //   /**
    //    * applying default colour map.
    //    */
    //   this.nehubaViewer.batchAddAndUpdateSegmentColors(metadata.selectedParcellation!.colorMap)
        
    //   /**
    //    * patching surface parcellation and whole mesh vs single mesh
    //   */
    //   const colorMap = (<ParcellationDescriptor>metadata.selectedParcellation).colorMap
    //   /* TODO patching in surface parcellation */
    //   try{
    //     if( this.viewerConfig.layout!.useNehubaPerspective!.mesh!.surfaceParcellation ){
    //       colorMap.set(65535,{red:255,green:255,blue:255})
    //       this.nehubaViewer.batchAddAndUpdateSegmentColors(colorMap)
    //       this.nehubaViewer.setMeshesToLoad([65535,...Array.from(colorMap.keys())])
    //     }else{
    //       this.nehubaViewer.setMeshesToLoad(Array.from(colorMap.keys()))
    //     }
    //   }catch(e){
    //     console.log('loading surface parcellation error ',e)
    //   }

    //   // const parcellationName = _evPk.body.parcellation.ngId
    //   const shownSegmentObs = this.nehubaViewer.getShownSegmentsObservable()
    //   const shownSegmentObsSubscription = shownSegmentObs.subscribe((ev:number[])=>{
    //     /**
    //      * attach regionSelection listener and update surface parcellation patch
    //      */
    //     try{
    //       const newColorMap = new Map<number,{red:number,green:number,blue:number}>()
    //       const selectedParcellation = <ParcellationDescriptor>metadata.selectedParcellation
    //       if( this.viewerConfig.layout!.useNehubaPerspective!.mesh!.surfaceParcellation ){

    //         selectedParcellation.colorMap.forEach((activeColor,key)=>{
    //           newColorMap.set(key,ev.find(segId=>segId==key)?activeColor:{red:255,green:255,blue:255})
    //         })
    //         this.nehubaViewer.clearCustomSegmentColors()
    //         this.nehubaViewer.batchAddAndUpdateSegmentColors(ev.length == 0 ? selectedParcellation.colorMap : newColorMap)
    //       }else{
    //         // this.nehubaViewer.setMeshesToLoad( ev.length == 0 ? Array.from(selectedParcellation.colorMap.keys()) : ev )
    //         // this.nehubaViewer.setMeshesToLoad(ev)
    //       }
    //     }catch(e){
    //       console.log('toggling regions error surface parcellation ')
    //       throw e
    //     }

    //     gExternalControl.viewControl.next(new EventPacket('selectRegions','',102,{source:'viewer',regions:ev.map((id:any)=>({labelIndex:id}))}))
    //   })
    //   this.onDestroyUnsubscribe.push(shownSegmentObsSubscription)
    // })

    /* TODO really? everytime viewing mode changes spatial query? */
    this.mainController.viewingModeBSubject
      .subscribe(()=>{
        this.spatialSearch.querySpatialData(this.viewerPosReal.map(num=>num/1000000) as [number,number,number],this.spatialSearchWidth,`Colin 27`)
      })

    // this.requestAnimationFrameFloatingPopoverFade = ()=>{
    //   const animation = new Animation(500,'linear')
    //   const iterator = animation.generate()
    //   let animationFrameHandler
    //   const animationFrame = ()=>{
    //     const returnedValue = iterator.next()
    //     if(!returnedValue.done){
    //       animationFrameHandler = requestAnimationFrame(animationFrame)
    //     }
    //     this.floatingPopover.overwriteStyle = {opacity : 1 - returnedValue.value}
    //   }
    //   animationFrameHandler = requestAnimationFrame(animationFrame)
    //   return animationFrameHandler
    // }

    // this.mousemoveOverViewer
    //   .filter(()=>(this.mainController.nehubaCurrentSegment != null))
    //   .subscribe(()=>{
    //     cancelAnimationFrame(this.handlerFrameFloatingPopoverFade)
    //     this.floatingPopover.overwriteStyle = {opacity : 1 }
    //   })

    // this.mousemoveOverViewer
    //   .subscribe((ev:MouseEvent)=>{
    //     this.floatingPopover.offset = [ev.clientX+10,ev.clientY+10]
    //     // this.floatingPopover.title = this.mainController.nehubaCurrentSegment ? this.mainController.nehubaCurrentSegment.name : 'no segment selected'
        
    //   })

    // this.mousemoveOverViewer
    //   .filter(()=>(this.mainController.nehubaCurrentSegment != null))
    //   .debounceTime(1500)
    //   .subscribe(()=>{
        
    //     this.handlerFrameFloatingPopoverFade = this.requestAnimationFrameFloatingPopoverFade()
    //   })

    const observable = VIEWER_CONTROL.mouseOverNehuba
      .map(ev=>ev.foundRegion ? this.hoverRegionTemplate : null)
      .takeUntil(this.destroySubject)

    // this.infoToUIService.removeAllInfoPopoverObservables.subscribe((ev:any)=>{
    //   console.log(ev)
    // })

    this.infoToUIService.getContentInfoPopoverObservable(observable)
    
      // .subscribe((ev:any)=>{
      //   this.infoToUIService.getContentInfoPopoverObservable
      //   console.log(ev)
      // })
  }

  /* TODO not very elegant way of ending getContentInfoPOpoverObservable */
  destroySubject : Subject<any> = new Subject()

  public ngOnDestroy(){
    this.onDestroyUnsubscribe.forEach((subscription:any)=>subscription.unsubscribe())
    this.nehubaViewer.dispose()
    window['nehubaViewer'] = null
    
    this.destroySubject.next()
    this.destroySubject.complete()
  }

  public ngAfterViewInit(){
    
  }

  public createNewNehubaViewerWithConfig(config:NehubaViewerConfig){
    this.viewerConfig = config

    /* TODO potentially setting metadata before it was defined (?) */
    const metadata = gExternalControl.metadata
    this.nehubaViewer = createNehubaViewer(config,(err)=>{
      /* TODO: error handling?*/
      console.log('createnehubaviewer error handler',err)
    })

    this.mainController.nehubaViewer = this.nehubaViewer

    this.nehubaViewer.applyInitialNgState()

    /**
     * preventing errors such as visibleLayer of null/undefined
     */
    setTimeout(()=>{

      /* TODO are redraw and relayout necessary here? */
      this.nehubaViewer.redraw()
      this.nehubaViewer.relayout()
      
      /* redraw/relayout is async */
      setTimeout(()=>{

        /* listens to custom events from neuroglancer-panel
          whenever it fires, updates the position of existing landmarks
        */
        (<HTMLElement>this.viewerContainer.nativeElement).querySelectorAll('.neuroglancer-panel').forEach(panel=>{
          
          Observable
            .fromEvent(panel,sliceRenderEventType)
            .map(it=>it as CustomEvent)
            .throttleTime(1500) /* is this even necessary (?) */
            .subscribe(ev=>{
              const el = ev.target as HTMLElement
              const detail = ev.detail as SliceRenderEventDetail
              /* TODO this is a terrible way of identifying panels */
              el.offsetLeft < 5 ? 
                el.offsetTop < 5 ?
                  this.nanometersToOffsetPixelsFn[0] = detail.nanometersToOffsetPixels :
                  this.nanometersToOffsetPixelsFn[2] = detail.nanometersToOffsetPixels :
                el.offsetTop < 5 ?
                  this.nanometersToOffsetPixelsFn[1] = detail.nanometersToOffsetPixels :
                  (console.log('observable fired from perspective panel'))

            })
        })

        Observable.fromEvent(this.viewerContainer.nativeElement,perspectiveRenderEventType)
          .subscribe(()=>{
            /* attach pointer to 3d viewer here */
            
          })
      })
    })

    /**
     * attaching the mouse/navigation real/voxel listeners
     */
    const mouseRealSubscription = this.nehubaViewer.mousePosition.inRealSpace.subscribe((pos:any)=>this.mousePosReal = pos ? pos : this.mousePosReal)
    this.onDestroyUnsubscribe.push(mouseRealSubscription)
    const mouseVoxelSubscription = this.nehubaViewer.mousePosition.inVoxels.subscribe((pos:any)=>this.mousePosVoxel = pos ? pos :this.mousePosVoxel)
    this.onDestroyUnsubscribe.push(mouseVoxelSubscription)
    
    const navigationSubscription = this.nehubaViewer.navigationState.position.inRealSpace.subscribe((pos:any)=>{
      this.viewerPosReal = pos

      /* spatial query */
      const container = (<HTMLElement>this.viewerContainer.nativeElement)
      this.spatialSearchWidth = Math.max(container.clientHeight/4,container.clientWidth/4) * this.sliceViewZoom / 1000000
      /* width in mm */
      this.spatialSearch.querySpatialData(this.viewerPosReal.map(num=>num/1000000) as [number,number,number],this.spatialSearchWidth,`Colin 27`)
    })
    this.onDestroyUnsubscribe.push( navigationSubscription )
    const navigationSubscriptionVoxel = this.nehubaViewer.navigationState.position.inVoxels.subscribe((pos:any)=>this.viewerPosVoxel=pos)
    this.onDestroyUnsubscribe.push( navigationSubscriptionVoxel )
    
    const zoomSub = this.nehubaViewer.navigationState.sliceZoom.subscribe((zoom:any)=>{
      this.sliceViewZoom = zoom
    
      /* spatial query */
      const container = (<HTMLElement>this.viewerContainer.nativeElement)
      this.spatialSearchWidth = Math.max(container.clientHeight/4,container.clientWidth/4) * this.sliceViewZoom / 1000000
      /* width in mm */
      this.spatialSearch.querySpatialData(this.viewerPosReal.map(num=>num/1000000) as [number,number,number],this.spatialSearchWidth,`Colin 27`)
    })
    this.onDestroyUnsubscribe.push( zoomSub )

    const segmentListener = this.nehubaViewer.mouseOver.image
      .subscribe(ev=>{
        this.segmentListener[ev.layer.name] = ev.value
      })
    this.onDestroyUnsubscribe.push(segmentListener)
    /**
     * attaches viewerSegmentHover listener
     */
    const iterativeSearch = (regions:RegionDescriptor[],labelIndex:number):Promise<RegionDescriptor> => new Promise((resolve)=>{
      const find = regions.find(region=>region.labelIndex==labelIndex)
      if(find)resolve(find)
      Promise.race(regions.map(region=>iterativeSearch(region.children,labelIndex)))
        .then(region=>resolve(region))
    })
    const regionObserverSubscription = this.nehubaViewer.mouseOver.segment.subscribe((seg:any)=>{
      /* seg.segment = number | 0 | null seg.layer */

      /* TODO potentially generating some unresolvable promises here */
      if(seg.segment&&seg.segment!=0){
        this.viewerSegment=seg.segment
        iterativeSearch(metadata.selectedParcellation!.regions,seg.segment)
          .then(region=>this.viewerSegment=region)
          .catch(e=>console.log(e))
      }else{
        this.viewerSegment=null
      }
    })
    this.onDestroyUnsubscribe.push(regionObserverSubscription)

    window['nehubaViewer'] = this.nehubaViewer

    this.heartbeatObserver = 
      this.nehubaViewer.mouseOver.segment
        .merge(this.nehubaViewer.navigationState.sliceZoom)
        .merge(this.nehubaViewer.navigationState.perspectiveZoom)
        .subscribe((_ev:any)=>{
          //console.log('debug heartbeat',ev)
        })
    this.onDestroyUnsubscribe.push(this.heartbeatObserver)
  }

  public loadParcellation(_parcellation:ParcellationDescriptor){

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

}