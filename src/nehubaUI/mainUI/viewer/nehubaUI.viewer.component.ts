import { AfterViewInit,OnDestroy,ComponentRef,Component,ComponentFactoryResolver,ViewChild,ViewContainerRef,TemplateRef, ComponentFactory }from '@angular/core'

import { Config as NehubaViewerConfig,vec3} from 'nehuba/exports'

import { TemplateDescriptor } from 'nehubaUI/nehuba.model'
import { UI_CONTROL,VIEWER_CONTROL,EXTERNAL_CONTROL as gExternalControl, MainController, SpatialSearch, LandmarkServices, WidgitServices } from 'nehubaUI/nehubaUI.services'

import { SegmentationUserLayer } from 'neuroglancer/segmentation_user_layer'
import { NehubaViewerComponent } from 'nehubaUI/mainUI/viewer/nehubaUI.viewerUnit.component';


@Component({
  selector : 'NehubaViewer',
  template:`
    <ng-template>
    </ng-template>
  `,
  styles : [  ]
})

export class NehubaViewerInnerContainer implements AfterViewInit{

  // @ViewChild(NehubaViewerDirective) host : NehubaViewerDirective
  nehubaViewerComponent : NehubaViewerComponent
  componentRef : ComponentRef<any>
  private templateLoaded : boolean = false
  darktheme : boolean = false

  colorMap : Map<number,{}>

  private nehubaViewerFactory : ComponentFactory<NehubaViewerComponent>

  private onViewerInitHook : (()=>void)[] = []
  private afterviewerInitHook : (()=>void)[] = []

  private onParcellationSelectionHook : (()=>void)[] = []
  private afterParcellationSelectionHook : (()=>void)[] = []

  constructor(
    public viewContainerRef:ViewContainerRef,
    public mainController:MainController, 
    private componentFactoryResolver: ComponentFactoryResolver ){

    this.nehubaViewerFactory = this.componentFactoryResolver.resolveComponentFactory( NehubaViewerComponent )
    
    /* TODO reduce complexity, as to not having multiple VIEW_CONTROL objects floating around */
    // this.mainController.selectTemplateBSubject.subscribe((template:TemplateDescriptor|null)=>{
    //   if(template){

    //     this.loadTemplate(template.nehubaConfig)
    //     this.templateLoaded = true

    //   }else{
    //     /* I'm not too sure what does the dispose method do (?) */
    //     /* TODO: use something other than a flag? */
        
    //     if(this.templateLoaded){
    //       (<NehubaViewerComponent>this.componentRef.instance).nehubaViewer.dispose()
    //       this.componentRef.destroy()
    //     }
    //     this.templateLoaded = false
    //   }
    // })
    VIEWER_CONTROL.loadTemplate = (templateDescriptor:TemplateDescriptor) => {
      /* TODO implement a check that each el in the hooks are still defined and are fn's */
      this.onViewerInitHook.forEach(fn=>fn())
      this.loadTemplate(templateDescriptor.nehubaConfig)
      this.afterviewerInitHook.forEach(fn=>fn())
    }
    VIEWER_CONTROL.onViewerInit = (cb:()=>void) => this.onViewerInit(cb)
    VIEWER_CONTROL.afterViewerInit = (cb:()=>void) => this.afterViewerInit(cb)
    UI_CONTROL.onParcellationSelection = (cb:()=>void) => this.onParcellationSelection(cb)
    UI_CONTROL.afterParcellationSelection = (cb:()=>void) => this.afterParcellationSelection(cb)
    VIEWER_CONTROL.showSegment = (seg) => this.showSegment(seg)
    VIEWER_CONTROL.hideSegment = (seg) => this.hideSegment(seg)
    VIEWER_CONTROL.hideAllSegments = () => this.hideAllSegments()
    VIEWER_CONTROL.showAllSegments = () => this.showAllSegments()
    VIEWER_CONTROL.moveToNavigationLoc = (loc:number[],realSpace?:boolean) => this.moveToNavigationLoc(loc,realSpace)
    VIEWER_CONTROL.loadLayer = (layerObj:Object) => this.loadLayer(layerObj)

    this.mainController.viewerControl.hideAllSegments = () => this.hideAllSegments()
    this.mainController.viewerControl.showSegment = (segId) => this.showSegment(segId)
    this.mainController.viewerControl.showAllSegments = () => this.showAllSegments()
    this.mainController.viewerControl.loadLayer = (layerObj) => this.loadLayer(layerObj)
    this.mainController.viewerControl.removeLayer = (layerObj) => this.removeLayer(layerObj)
    this.mainController.viewerControl.setLayerVisibility = (layerObj,visible) => this.setLayerVisibility(layerObj,visible)
  }

  /**
   * attaches an onViewerInit callback.
   */
  public onViewerInit = (cb:()=>void) => this.onViewerInitHook.push(cb)

  /**
   * attaches an afterViewerInit callback
   */
  public afterViewerInit = (cb:()=>void)=> this.afterviewerInitHook.push(cb)

  /**
   * attaches an on parcellation selection callback
   */
  public onParcellationSelection = (cb:()=>void)=> this.onParcellationSelectionHook.push(cb)

  /**
   * attaches an after parcellation selection callback
   */
  public afterParcellationSelection = (cb:()=>void)=> this.afterParcellationSelectionHook.push(cb)

  /**
   * attaches an onViewerDestory callback. 
   * If no viewer is initiated, callback will be fired immediately.
   * NB onViewerInit callback will be called before onViewerDestory callback
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

  ngAfterViewInit(){
    UI_CONTROL.afterTemplateSelection(()=>{
      this.darktheme = gExternalControl.metadata.selectedTemplate ? gExternalControl.metadata.selectedTemplate.useTheme == 'dark' : false;
      (<NehubaViewerComponent>this.componentRef.instance).darktheme = this.darktheme
    })
  }

  private loadTemplate(nehubaViewerConfig:NehubaViewerConfig){
    if(this.templateLoaded){
      (<NehubaViewerComponent>this.componentRef.instance).nehubaViewer.dispose()
      this.componentRef.destroy()
    }

    this.componentRef = this.viewContainerRef.createComponent( this.nehubaViewerFactory )
    
    // let newNehubaViewerUnit = new NehubaViewerUnit(NehubaViewerComponent,nehubaViewerConfig)
    // let nehubaViewerFactory = this.componentFactoryResolver.resolveComponentFactory( newNehubaViewerUnit.component )
    // this.componentRef = this.viewContainerRef.createComponent( nehubaViewerFactory )
    
    this.nehubaViewerComponent = <NehubaViewerComponent>this.componentRef.instance
    this.nehubaViewerComponent.createNewNehubaViewerWithConfig(nehubaViewerConfig)
    this.nehubaViewerComponent.darktheme = this.darktheme
    
    this.templateLoaded = true
  }

  public showSegment(segID:any){
    this.nehubaViewerComponent.showSeg(segID)
  }

  public hideSegment(segID:any){
    this.nehubaViewerComponent.hideSeg(segID)
  }

  public showAllSegments(){
    this.nehubaViewerComponent.allSeg(true)
  }

  public hideAllSegments(){
    this.nehubaViewerComponent.allSeg(false)
  }

  public setLayerVisibility(layerObj:any,visible:boolean){
    return this.nehubaViewerComponent.setLayerVisibility(layerObj,visible)
  }

  public loadLayer(layerObj:any){
    return this.nehubaViewerComponent.loadLayer(layerObj)
  }

  public removeLayer(layerObj:any){
    return this.nehubaViewerComponent.removeLayer(layerObj)
  }
}


@Component({
  selector : 'nehubaui-landmark-list',
  template : 
  `
  <ng-template #landmarkList>
    <div class = "panel-body">
      <ng-content>
      </ng-content>
      <div 
        landmarkEntry
        (mouseenter)="landmark.hover = true"
        (mouseleave)="landmark.hover = false"
        *ngFor = "let landmark of landmarkServices.landmarks">

        position : {{ landmark.properties['geometry.coordinates'] }}
      </div>
      <ul *ngIf = "false" class = "list-group" id = "landmarkList">
        <li
          (mouseenter)="landmark.hover = true"
          (mouseleave)="landmark.hover = false"
          class = "list-group-item"
          *ngFor="let landmark of landmarkServices.landmarks">

          <small>
            <span class = "text-muted">OID :</span> {{ landmark.properties['OID']  }}<br />
            <span class = "text-muted">coordinates :</span> [{{ landmark.properties['geometry.coordinates'] }}]
          </small>
        </li>
      </ul>
      
      <div *ngIf="landmarkServices.landmarks.length>0" class = "btn-group">

        <div class = "default-control btn btn-default btn-sm" (click)="spatialSearch.goTo(0)">
          <i class = "glyphicon glyphicon-fast-backward"></i>
        </div>
        <div class = "btn btn-default btn-sm" (click)="spatialSearch.goTo(spatialSearch.pagination-1)">
          <i class = "glyphicon glyphicon-step-backward"></i>
        </div>

        <div 
          (click)="spatialSearch.goTo(pageNum)"
          [ngClass]="{'btn-primary':spatialSearch.pagination == pageNum}"
          *ngFor = "let pageNum of Array.from(Array(Math.ceil(spatialSearch.numHits / spatialSearch.RESULTS_PER_PAGE)).keys()).filter(hidePagination)"
          class = "pagination-control btn btn-default btn-sm">
          {{ pageNum + 1 }}
        </div>

        <div class = "btn btn-default btn-sm" (click)="spatialSearch.goTo(spatialSearch.pagination+1)">
          <i class = "glyphicon glyphicon-step-forward"></i>
        </div>
        <div class = "btn btn-default btn-sm" (click)="spatialSearch.goTo( spatialSearch.numHits / spatialSearch.RESULTS_PER_PAGE + 1 )">
          <i class = "glyphicon glyphicon-fast-forward"></i>
        </div>

      </div>
      
      <div style="text-align:center; margin-top:10px;">
        {{ spatialSearch.numHits ? spatialSearch.numHits : 0 }} landmarks found.
      </div>

    </div>
  </ng-template>
  `,
  styles : [
    `
    div[landmarkEntry]
    {
      padding : 0.2em 1.0em;
    }
    div[landmarkEntry]:hover
    {
      cursor:default;
      background-color:rgba(128,128,128,0.2);
    }
    .btn-group
    {
      display:flex
    }

    .btn-group > .default-control
    {
      flex : 0 0 auto;
    }

    .btn-group > .pagination-control
    {
      flex : 1 1 auto;
    }
    ul.list-group#landmarkList > li.list-group-item:hover
    {
      cursor:default;
      background-color:rgba(128,128,128,0.2);
    }
    `
  ]
})

export class NehubaLandmarkList implements AfterViewInit,OnDestroy{
  @ViewChild('landmarkList',{read:TemplateRef}) landmarkList : TemplateRef<any>

  constructor(
    public mainController:MainController,
    public spatialSearch:SpatialSearch,
    public landmarkServices:LandmarkServices,
    public widgitServices:WidgitServices){

  }

  Array = Array
  Math = Math

  hidePagination = (idx:number) => {
    const correctedPagination = this.spatialSearch.pagination < 2 ?
      2 :
      this.spatialSearch.pagination > (Math.ceil(this.spatialSearch.numHits / this.spatialSearch.RESULTS_PER_PAGE) - 3) ?
        Math.ceil(this.spatialSearch.numHits / this.spatialSearch.RESULTS_PER_PAGE) - 3 :
        this.spatialSearch.pagination
    return (Math.abs(idx-correctedPagination) < 3)
  }

  widgetComponent : any

  ngAfterViewInit(){
    this.widgetComponent = this.widgitServices.widgitiseTemplateRef(this.landmarkList,{name:'iEEG Recordings'})

    const segmentationUserLayer = this.mainController.nehubaViewer.ngviewer.layerManager.managedLayers[1].layer! as SegmentationUserLayer
    segmentationUserLayer.displayState.selectedAlpha.restoreState(0.2)
  }

  ngOnDestroy(){
    this.widgitServices.unloadWidget(this.widgetComponent)
    // this.widgetComponent.parentViewRef.destroy()
  }
}

