import { HostListener,OnDestroy,ComponentRef,Directive,Type,OnInit,Component,ComponentFactoryResolver,ViewChild,ViewContainerRef }from '@angular/core'
import { Subject } from 'rxjs/Rx'

import { Config as NehubaViewerConfig,NehubaViewer,createNehubaViewer,vec3 } from 'nehuba/exports'

import { EventCenter,Animation,EVENTCENTER_CONST,EXTERNAL_CONTROL as gExternalControl } from './nehubaUI.services'
import { EventPacket, RegionDescriptor } from './nehuba.model'
import { CM_THRESHOLD,CM_MATLAB_HOT,CM_DEFAULT_MAP } from './nehuba.config'
import { FloatingPopOver } from 'nehubaUI/nehubaUI.floatingPopover.component';

declare var window:{
  [key:string] : any
  prototype : Window;
  new() : Window;
}

@Directive({
  selector : '[nehuba-viewer-host]'
})

export class NehubaViewerDirective{
  constructor(public viewContainerRef:ViewContainerRef){}
}

@Component({
  selector : 'NehubaViewer',
  template:`
<ng-template nehuba-viewer-host>
</ng-template>
  `
})

export class NehubaViewerInnerContainer implements OnInit{

  @ViewChild(NehubaViewerDirective) host : NehubaViewerDirective
  nehubaViewerComponent : NehubaViewerComponent
  componentRef : ComponentRef<any>
  viewContainerRef : ViewContainerRef
  templateLoaded : boolean = false
  darktheme : boolean = false

  colorMap : Map<number,{}>

  private onViewerInitHook : (()=>void)[] = []
  private afterviewerInitHook : (()=>void)[] = []

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private eventCenter : EventCenter
  ){
    gExternalControl.viewControl
      .filter((evPk:EventPacket)=>evPk.target=='loadTemplate'&&evPk.code==101)
      .subscribe((_evPk:EventPacket)=>{
        if (this.nehubaViewerComponent) this.nehubaViewerComponent.nehubaViewer.clearCustomSegmentColors()
      })

    /* this maybecome obsolete */
    this.eventCenter.nehubaViewerRelay.subscribe((msg:EventPacket)=>{
      switch(msg.target){
        case EVENTCENTER_CONST.NEHUBAVIEWER.TARGET.LOAD_TEMPALTE:{
          this.loadNewTemplate(msg.body.nehubaConfig)
        }break;
        case EVENTCENTER_CONST.NEHUBAVIEWER.TARGET.NAVIGATE:{
          // this.navigate(msg.body.pos,msg.body.rot)
          throw new Error('api retired, update api')
        }
        case EVENTCENTER_CONST.NEHUBAVIEWER.TARGET.SHOW_SEGMENT:{
          if(msg.body.segID == 0){
            this.hideAllSegments()
          }else{
            this.showSegment(msg.body.segID)
          }
        }break;
        case EVENTCENTER_CONST.NEHUBAVIEWER.TARGET.HIDE_SEGMENT:{
          if(msg.body.segID == 0){
            this.showAllSegments()
          }else{
            this.hideSegment(msg.body.segID)
          }
        }break;
        case EVENTCENTER_CONST.NEHUBAVIEWER.TARGET.LOAD_LAYER:{
          this.loadPMap(msg)
        }
      }
    })
    this.eventCenter.globalLayoutRelay.subscribe((msg:EventPacket)=>{
      switch(msg.target){
        case EVENTCENTER_CONST.GLOBALLAYOUT.TARGET.THEME:{
          this.darktheme = msg.body.theme == 'dark' 
        }break;
      }
    })

    gExternalControl.viewControlF = this
  }

  /**
   * attaches an onViewerInit callback.
   */
  public onViewerInit = (cb:()=>void)=>{
    this.onViewerInitHook.push(cb)
  }

  /**
   * attaches an afterViewerInit callback
   */
  public afterViewerInit = (cb:()=>void)=>{
    this.afterviewerInitHook.push(cb)
  }

  /**
   * attaches an onViewerDestory callback. If no viewer is initiated, callback will be fired immediately.
   */
  public onViewerDestroy = (cb:()=>void)=>{
    if(!this.templateLoaded){
      cb()
    }else{
      this.componentRef.onDestroy(()=>{
        cb()
      })
    }
  }

  /**
   * Teleport to new location
   */
  public setNavigationLoc = (loc:number[],realSpace?:boolean)=>{
    this.nehubaViewerComponent.nehubaViewer.setPosition(vec3.fromValues(loc[0],loc[1],loc[2]),realSpace)
  }

  /**
   * teleport to a new orientation
   */
  public setNavigationOrientation = (_ori:number[])=>{
    /* waiting for proper api */
  }

  /**
   * Animation moving to new location
   */
  public moveToNavigationLoc = (loc:number[],realSpace?:boolean)=>{
    if(this.templateLoaded){
      this.nehubaViewerComponent.navigate(loc,300,realSpace?realSpace:false)
    }
  }

  ngOnInit(){
    this.viewContainerRef = this.host.viewContainerRef
  }

  private loadNewTemplate(nehubaViewerConfig:NehubaViewerConfig){
    if ( this.templateLoaded ){
      /* I'm not too sure what does the dispose method do (?) */
      /* TODO: use something other than a flag? */
      (<NehubaViewerComponent>this.componentRef.instance).nehubaViewer.dispose()
      this.componentRef.destroy()
    }

    /* TODO implement a check that each el in the hooks are still defined and are fn's */
    this.onViewerInitHook.forEach(fn=>fn())
    
    let newNehubaViewerUnit = new NehubaViewerUnit(NehubaViewerComponent,nehubaViewerConfig,this.darktheme)
    let nehubaViewerFactory = this.componentFactoryResolver.resolveComponentFactory( newNehubaViewerUnit.component )
    this.componentRef = this.viewContainerRef.createComponent( nehubaViewerFactory );
    
    this.nehubaViewerComponent = <NehubaViewerComponent>this.componentRef.instance
    this.nehubaViewerComponent.loadTemplate(nehubaViewerConfig)
    this.nehubaViewerComponent.darktheme = this.darktheme

    this.nehubaViewerComponent.nehubaViewer.mouseOver.layer.subscribe((im:any)=>{
      this.eventCenter.userViewerInteractRelay.next(new EventPacket(
        'layerMouseOver',
        Date.now().toString(),
        100,
        {layer:im}
      ))
    })
    this.templateLoaded = true

    this.afterviewerInitHook.forEach(fn=>fn())
  }

  showSegment(segID:any){
    this.nehubaViewerComponent.showSeg(segID)
  }

  hideSegment(segID:any){
    this.nehubaViewerComponent.hideSeg(segID)
  }

  showAllSegments(){
    this.nehubaViewerComponent.allSeg(true)
  }

  hideAllSegments(){
    this.nehubaViewerComponent.allSeg(false)
  }

  pMapFloatingWidget : Subject<EventPacket>
  private loadPMap(msg:EventPacket){
    let curtainModalSubject = this.eventCenter.createNewRelay(new EventPacket('curtainModal','',100,{}))
    curtainModalSubject.next(new EventPacket('curtainModal','',100,{title:'Loading PMap',body:'fetching '+msg.body.url }))
    curtainModalSubject.subscribe((evPk:EventPacket)=>{
      switch (evPk.code){
        case 101:{
          this.nehubaViewerComponent.loadLayer(msg.body.url)
          setTimeout(()=>{
            curtainModalSubject.next(new EventPacket('curtainModal','',102,{}))
            
            if(!this.pMapFloatingWidget || this.pMapFloatingWidget.closed){

              /* TODO: pMapFlatingWidget should either be with multilevel or floating widget, and not in viewer.component */
              this.pMapFloatingWidget = this.eventCenter.createNewRelay(new EventPacket('floatingWidgetRelay','',100,{}))
              this.pMapFloatingWidget.next(new EventPacket('loadCustomFloatingWidget','',100,{
                title : 'PMap for ' + msg.body.title,
                body : [
                  {
                    "_activeCell" : true,
                    "_elementTagName" : "img",
                    "_class" : "col-md-12",
                    "_src" : "http://172.104.156.15:8080/colormaps/MATLAB_hot.png"
                  },{
                    "Encoded Value":
                      {
                        "_activeCell" : true,
                        "_elementTagName" : "div",
                        "_class" : "col-md-12",
                        "_active" : "always",
                        "_id" : "pmap_value",
                        "_value" : '0'
                      }
                  },
                  "To return to normal browsing, close this Dialogue."
                ],
                eventListeners : [
                  {
                    "event" : "layerMouseOver",
                    "filters": [{
                        "layer":{
                          "layer":{
                            "name" : "PMap"
                          }
                        }
                      }],
                    "values":[{
                        "layer":{
                          "value":"pmap_value | number:'1.4-4'"
                        }
                      }],
                    "scripts" : []
                  }
                ]
              }))
              this.pMapFloatingWidget.subscribe((evPk:EventPacket)=>{
                switch (evPk.code){
                  case 200:
                  case 500:{
                    let json = this.nehubaViewerComponent.nehubaViewer.ngviewer.state.toJSON()
                    json.layers.PMap.visible = false
                    json.layers.atlas.visible = true
                    this.nehubaViewerComponent.nehubaViewer.ngviewer.state.restoreState(json)
                    this.pMapFloatingWidget.unsubscribe()
                    
                    /* TODO:temporary. need to load specific map for specific atlases */
                    this.nehubaViewerComponent.nehubaViewer.batchAddAndUpdateSegmentColors(CM_DEFAULT_MAP)
                  }break;
                }
              })
            }else{
              this.pMapFloatingWidget.next(new EventPacket('loadCustomFloatingWidget',Date.now().toString(),110,{
                title : 'PMap for ' + msg.body.title,
              }))
            }

          },3000)
        }break;
        case 200:
        case 404:{
          curtainModalSubject.unsubscribe()
        }break;
      }
    })
  }
}

@Component({
  template : `
<div 
  (contextmenu)="showFloatingPopover($event)"
  id = "container" 
  [ngClass]="{darktheme : darktheme}">
</div>
<div [ngClass] = "{darktheme : darktheme}" id = "viewerStatus">
  <span 
    class = "btn btn-link"
    (click)="statusPanelRealSpace = !statusPanelRealSpace">
    {{statusPanelRealSpace ? 'RealSpace(nm)' : 'VoxelSpace'}}
  </span> 
  Navigation: <small>({{statusPanelRealSpace ? viewerPosReal.join(',') : viewerPosVoxel.join(',')}})</small> 
  Mouse: <small>({{statusPanelRealSpace ? mousePosReal.join(',') : mousePosVoxel.join(',')}})</small> 
  {{!viewerSegment ? '' : viewerSegment.constructor.name == 'RegionDescriptor' ? 'Region: ' + viewerSegment.name : 'RegionID: ' + viewerSegment }}
</div>
<floatingPopover>
</floatingPopover>
  `,
  styles : [
    `
div#container{
  width:100%;
  height:100%;
}
    `
  ]
})
export class NehubaViewerComponent implements OnDestroy{
  public nehubaViewer : NehubaViewer
  viewerConfig : NehubaViewerConfig
  darktheme : boolean
  viewerPosReal : number[] = [0,0,0]
  viewerPosVoxel : number[] = [0,0,0]
  viewerOri : number[] = [0,0,1,0]
  viewerSegment : RegionDescriptor | number | null
  mousePosReal :  number[] = [0,0,0]
  mousePosVoxel :  number[] = [0,0,0]

  statusPanelRealSpace : boolean = true

  @HostListener('document:mousedown',['$event'])
  clearContextmenu(_ev:any){
    if(this.floatingPopover.contextmenuEvent)this.floatingPopover.contextmenuEvent=null
  }

  @ViewChild(FloatingPopOver) floatingPopover : FloatingPopOver

  onDestroyUnsubscribe : any[] = []
  heartbeatObserver : any

  constructor(){}

  public ngOnDestroy(){
    this.onDestroyUnsubscribe.forEach((subscription:any)=>subscription.unsubscribe())
    this.nehubaViewer.dispose()
    window['nehubaViewer'] = null
  }

  public loadTemplate(config:NehubaViewerConfig){
    this.nehubaViewer = createNehubaViewer(config,(err)=>{
      /* TODO: error handling?*/
      console.log('createnehubaviewer error handler',err)
    })
    this.nehubaViewer.applyInitialNgState()
    this.nehubaViewer.redraw()
    this.nehubaViewer.relayout()

    /* TODO: only works for JuBrain. Workout a proper parser for rgb values */
    let testForJubrain = new RegExp('jubrain','gi')
    if(config.globals!.useCustomSegmentColors && testForJubrain.test(JSON.stringify(config.dataset!.initialNgState))){
      this.nehubaViewer.batchAddAndUpdateSegmentColors(CM_DEFAULT_MAP)
    }

    const mouseRealSubscription = this.nehubaViewer.mousePosition.inRealSpace.subscribe((pos:any)=>this.mousePosReal = pos ? pos : this.mousePosReal)
    this.onDestroyUnsubscribe.push(mouseRealSubscription)
    const mouseVoxelSubscription = this.nehubaViewer.mousePosition.inVoxels.subscribe((pos:any)=>this.mousePosVoxel = pos ? pos :this.mousePosVoxel)
    this.onDestroyUnsubscribe.push(mouseVoxelSubscription)
    
    const navigationSubscription = this.nehubaViewer.navigationState.position.inRealSpace.subscribe((pos:any)=>this.viewerPosReal = pos)
    this.onDestroyUnsubscribe.push( navigationSubscription )

    const navigationSubscriptionVoxel = this.nehubaViewer.navigationState.position.inVoxels.subscribe((pos:any)=>this.viewerPosVoxel=pos)
    this.onDestroyUnsubscribe.push( navigationSubscriptionVoxel )

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
        iterativeSearch(window['nehubaUI'].metadata.parcellation.regions,seg.segment)
          .then(region=>this.viewerSegment=region)
          .catch(e=>console.log(e))
      }else{
        this.viewerSegment=null
      }
    })
    this.onDestroyUnsubscribe.push(regionObserverSubscription)

    const loadParcellationSubscription = gExternalControl.viewControl
      .filter((evPk:EventPacket)=>evPk.target=='loadParcellation'&&evPk.code==200)
      .subscribe((_evPk:EventPacket)=>{
        /**
         * TODO: applying default colour map. move this to choose parcellation later
         */
        this.nehubaViewer.batchAddAndUpdateSegmentColors(window['nehubaUI'].metadata.template.parcellations[0].colorMap)
    
        const parcellationName = _evPk.body.parcellation.ngId
        const shownSegmentObs = this.nehubaViewer.getShownSegmentsObservable({name:parcellationName})
        const shownSegmentObsSubscription = shownSegmentObs.subscribe((ev:any)=>gExternalControl.viewControl.next(new EventPacket('selectRegions','',102,{source:'viewer',regions:ev.map((id:any)=>({labelIndex:id}))})))
        this.onDestroyUnsubscribe.push(shownSegmentObsSubscription)
      })
    this.onDestroyUnsubscribe.push(loadParcellationSubscription)

    window['nehubaViewer'] = this.nehubaViewer

    this.heartbeatObserver = 
      this.nehubaViewer.mouseOver.segment
        .merge(window['nehubaViewer'].navigationState.sliceZoom)
        .merge(window['nehubaViewer'].navigationState.perspectiveZoom)
        .subscribe((_ev:any)=>{
          //console.log('debug heartbeat',ev)
        })
    this.onDestroyUnsubscribe.push(this.heartbeatObserver)
  }

  public navigate(pos:number[],duration:number,realSpace:boolean){
    /* TODO: implement rotation somehow oO */
    
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

  //TODO: do this properly with proper api's
  public loadLayer(url:string){
    let json = this.nehubaViewer.ngviewer.state.toJSON()
    json.layers.PMap = {
      type : "image",
      source : "nifti://"+url,
      shader : `void main(){float x=toNormalized(getDataValue());${CM_MATLAB_HOT}if(x>${CM_THRESHOLD}){emitRGB(vec3(r,g,b));}else{emitTransparent();}}`
    }
    json.layers.atlas.visible = false
    this.nehubaViewer.ngviewer.state.restoreState(json)
  }

  public showFloatingPopover = (ev:any)=> {
    this.floatingPopover.cursorSegment = this.viewerSegment
    this.floatingPopover.cursorLocReal = this.mousePosReal
    this.floatingPopover.cursorLocVoxel = this.mousePosVoxel
    this.floatingPopover.contextmenuEvent = ev
  }
}

export class NehubaViewerUnit{
  viewerConfig : NehubaViewerConfig
  darktheme : boolean

  constructor(public component:Type<any>,viewerConfig:NehubaViewerConfig,darktheme:boolean){  
    this.darktheme = darktheme
    this.viewerConfig = viewerConfig
  }
}
