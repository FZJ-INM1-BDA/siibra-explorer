import { Input, TemplateRef,ViewRef, ComponentRef, Renderer2, ElementRef,AfterViewInit, Directive,NgZone,HostListener,ViewContainerRef,Component,ComponentFactoryResolver,ComponentFactory,ViewChild,HostBinding, OnDestroy, EventEmitter, Output, OnInit } from '@angular/core'
import { animationFadeInOut,animateCollapseShow, showSideBar } from 'nehubaUI/util/nehubaUI.util.animations'

import { LabComponent, LabComponentHandler, WidgitiseTempRefMetaData } from 'nehubaUI/nehuba.model';
import { MainController, WidgitServices, FloatingWidgetService } from 'nehubaUI/nehubaUI.services'
import { Observable } from 'rxjs/Rx';
import { NehubaUIRegionMultilevel } from 'nehubaUI/mainUI/regionMultilevel/nehubaUI.regionMultilevel.component';
import { INTERACTIVE_VIEWER } from 'nehubaUI/exports';

/**
 * basic widget class
 */


export class WidgetComponent{

  state : 'docked' | 'minimised' | 'floating' = 'floating'

  labComponent : LabComponent
  handler : LabComponentHandler
  onShutdownCallbacks : (()=>void)[] = []
  onShutdownCleanup : ()=>void

  parentViewRef : ComponentRef<FloatingWidgetView | DockedWidgetView | MinimisedView>
  /* widget UI */
  // widgetViewRef : ComponentRef<WidgetView>
  // floatingWidgetView : FloatingWidgetView
  // dockedWidgetView : DockedWidgetView

  constructor( labcomponent:LabComponent ){
    this.labComponent = labcomponent
    this.handler = INTERACTIVE_VIEWER.pluginControl[this.labComponent.name] = new LabComponentHandler()

    this.handler.shutdown = this.shutdown
    this.handler.onShutdown = (cb) => this.onShutdownCallbacks.push(cb)
  }

  shutdown()
  {
    this.onShutdownCallbacks.forEach((cb)=>cb())

    /* execute shutdown sequence */
    if(this.onShutdownCleanup) this.onShutdownCleanup()
  }

  changeState : ( state : 'docked' | 'minimised' | 'floating' )=>void
}


@Directive({
  selector : `[host]`
})
export class DynamicViewDirective{
  constructor(public viewContainerRef:ViewContainerRef){
    
  }
}

/** 
 * Containers for different views. Has to be declared before main container
 */


@Component({
  selector : `FloatingWidgetContainer`,
  template : 
  `
  <ng-template host>
  </ng-template>
  `,
  styles : [
  ]
})
export class FloatingWidgetContainer implements AfterViewInit{
  @ViewChild(DynamicViewDirective) host : DynamicViewDirective
  viewContainerRef : ViewContainerRef

  constructor(){

  }

  ngAfterViewInit(){

    this.viewContainerRef = this.host.viewContainerRef
    
    
    // const proxyViewContainerRef = new Proxy(ViewContainerRef.prototype,{
    //   get : (_target,prop)=>{
    //     if(prop == 'createComponent'){
    //       console.log('createComponent called')
    //       Reflect.get(this.host.viewContainerRef,prop)
    //     }else{
    //       console.log('other prop called')
    //       Reflect.get(this.host.viewContainerRef,prop)
    //     }
    //   }
    // })
    // console.log(proxyViewContainerRef.clear,this.host.viewContainerRef.clear)
    // console.log(proxyViewContainerRef,this.host.viewContainerRef)

  }

  // registerFloatingWidget(componentRef:ComponentRef<any>){
  //   this.floatingWidgetsRef.push(componentRef)

  //   this.viewContainerRef.
  // }
}

@Component({
  selector : `DockedWidgetContainer`,
  template : 
  `
  <ng-template host>
  </ng-template>
  `
})
export class DockedWidgetContainer implements AfterViewInit{
  @ViewChild(DynamicViewDirective) host : DynamicViewDirective
  viewContainerRef : ViewContainerRef

  ngAfterViewInit(){
    this.viewContainerRef = this.host.viewContainerRef
  }
}


/* TODO hibernating class ... minimised container is becoming deprecated */
@Component({
  selector : `MinimisedContainer`,
  template :
  `
  <ng-template host>
  </ng-template>
  `,
  styles : [
  `
  :host
  {
    display:flex;
    flex-direction:column-reverse;
  }
  `
  ]
})
export class MinimisedWidgetContainer implements AfterViewInit{
  @ViewChild(DynamicViewDirective) host : DynamicViewDirective
  viewContainerRef : ViewContainerRef
  ngAfterViewInit(){
    this.viewContainerRef = this.host.viewContainerRef
  }
}

/**
 * Main Widget Container, entry point
 */

@Component({
  selector : `WidgetsContainer`,
  template : 
  `
  <DockedWidgetContainer
    (@showSideBar.done) = "showMenuDone()"
    (@showSideBar.start) = "startShowMenu()"
    [@showSideBar] = "showMenu">
  </DockedWidgetContainer>
  <FloatingWidgetContainer>
  </FloatingWidgetContainer>
  <MinimisedContainer *ngIf = "false">
  </MinimisedContainer>
  <ng-template #widgetContentFactory>
  </ng-template>
  `,
  styles : [
    `
    FloatingWidgetContainer
    {
      right:0em;
      bottom:0em;
      width:0em;
      height:0em;
      position:absolute;

      z-index:9;
    }
    MinimisedContainer
    {
      z-index:9;
      position:relative;
      
      width: 2em;
      height:100%;

      top:-100%;
      right:4em;

      pointer-events:none;
    }
    DockedWidgetContainer
    {
      position:relative;
      z-index:4;
      display:block;
      width:362px;
      margin-left:-21px;
      padding-left:21px;
      height:100%;
      overflow-y:auto;
      overflow-x:hidden;
    }
    `
  ],
  
  animations : [ showSideBar ],
  providers : [
    FloatingWidgetService
  ]
})
export class WidgetsContainer{

  @Input() showMenu : boolean
  @Output() setShowMenu : EventEmitter<boolean> = new EventEmitter()
  
  animationDone : boolean = true

  redrawViewer = () => {
    if(this.mainController.nehubaViewer){
      this.mainController.nehubaViewer.redraw()
    }
  }

  onAnimationFrameCallback = ()=>{
    this.redrawViewer()
    if(!this.animationDone){
      requestAnimationFrame(this.onAnimationFrameCallback)
    }
  }
  
  showMenuDone(){
    this.animationDone = true
  }

  startShowMenu(){
    this.animationDone = false
    this.onAnimationFrameCallback()
  }

  @ViewChild(FloatingWidgetContainer) floatingWidgetContainer : FloatingWidgetContainer
  @ViewChild(DockedWidgetContainer) dockedWidgetContainer : DockedWidgetContainer
  // @ViewChild(MinimisedWidgetContainer) minimisedWidgetContainer : MinimisedWidgetContainer
  @ViewChild('widgetContentFactory',{read:ViewContainerRef}) widgetContentViewRef : ViewContainerRef

  loadedWidget : WidgetComponent[] = []

  floatingWidgetFactory : ComponentFactory<FloatingWidgetView>
  dockedWidgetFactory : ComponentFactory<DockedWidgetView>
  minimisedWidgetFactory : ComponentFactory<MinimisedView>

  widgetFactory : ComponentFactory<WidgetView>

  constructor( 
    public floatingWidgetSerivce:FloatingWidgetService,
    private componentFactoryResolver:ComponentFactoryResolver, 
    private rd2:Renderer2,
    private mainController:MainController,
    private widgitServices : WidgitServices ){

      this.overridingMainController()

      this.floatingWidgetFactory = this.componentFactoryResolver.resolveComponentFactory( FloatingWidgetView )
      this.dockedWidgetFactory = this.componentFactoryResolver.resolveComponentFactory( DockedWidgetView )
      this.minimisedWidgetFactory = this.componentFactoryResolver.resolveComponentFactory( MinimisedView )

      this.widgetFactory = this.componentFactoryResolver.resolveComponentFactory( WidgetView )

      this.widgitServices.layoutChangeSubject
        .debounceTime(200)
        .subscribe(()=>{
          this.setShowMenu.emit( this.dockedWidgetContainer.viewContainerRef.length > 0 )
        })


      // this.floatingWidgetSerivce.focusFloatingViewSubject.subscribe(console.log)
      Observable
        .from(this.floatingWidgetSerivce.focusFloatingViewSubject)
        .subscribe(fw=>{
          const foundFVC = this.floatingViewComponentRefs.find(fvc=>fvc.instance==fw)
          if(foundFVC){
            const idx = this.floatingWidgetContainer.viewContainerRef.indexOf(foundFVC.hostView)
            if(idx<0){
              console.warn('error in foregrounding floating widget view. cannot find the host view in floating widget container')
              return
            }
            
            if(idx<this.floatingWidgetContainer.viewContainerRef.length -1 ){
              const viewRef = this.floatingWidgetContainer.viewContainerRef.detach(idx)
              if(viewRef)this.floatingWidgetContainer.viewContainerRef.insert(viewRef)
              else console.warn('error in foregrounding floating widget view. could not detach viewref')
            }

          }
        })
  }

  overridingMainController(){
    this.widgitServices._widgitiseTemplateRef = (templateref:TemplateRef<NehubaUIRegionMultilevel>,metadata:WidgitiseTempRefMetaData):WidgetComponent=>{
      const newLabcomponent = new LabComponent({
        name : metadata.name
      })
      const newWidget = new WidgetComponent(newLabcomponent)
      // newWidget.onShutdownCallbacks.push(()=>{
      //   this.mainController.unwidgitiseTemplateRef(templateref)
      // })
      // this.mainController.unwidgitiseTemplateRef = () =>{
      //   newWidget.parentViewRef.destroy()
      // }
      
      this.embedView(templateref,newWidget,'docked')

      newWidget.changeState = (state : 'docked' | 'minimised' | 'floating') =>{
        this.embedView(templateref,newWidget,state)
      }

      /* if metadata.onShutdownCleanup is not provided, should the widgit be able to be exited? */
      if(metadata.onShutdownCleanup){
        newWidget.onShutdownCleanup = metadata.onShutdownCleanup as ()=>void
      }

      return newWidget
    }

    this.widgitServices._loadWidgetFromLabComponent = (labComponent:LabComponent)=>{
      return this.createNewWidget(labComponent)
    }

    this.mainController.createDisposableWidgets = (widgetComponent:WidgetComponent)=>this.createWidgetView(widgetComponent)

    this.widgitServices._unloadAll = ()=>{
      /* clear the references in floatingwidgetserivces */
      this.floatingWidgetSerivce.floatingViewComponentRefs = []
      this.floatingWidgetSerivce.floatingViews = []
      
      this.floatingWidgetContainer.viewContainerRef.clear()
      this.dockedWidgetContainer.viewContainerRef.clear()
    }
  }

  private floatingViewComponentRefs : ComponentRef<FloatingWidgetView>[] = []

  /* proxy for createViewContainer, and retain a reference to all of the floatingView created */
  private createViewContainer(state:'floating'|'docked'|'minimised'):ComponentRef<FloatingWidgetView|DockedWidgetView>{
    const compref =  state == 'floating' ? 
      this.floatingWidgetContainer.viewContainerRef.createComponent(this.floatingWidgetFactory) :
      state == 'docked' ? 
        this.dockedWidgetContainer.viewContainerRef.createComponent(this.dockedWidgetFactory) :
        this.dockedWidgetContainer.viewContainerRef.createComponent(this.dockedWidgetFactory) /* should really throw an error (?) */


    if(state == 'floating'){
      this.floatingViewComponentRefs.push(compref as ComponentRef<FloatingWidgetView>)
    }
    return compref
  }

  /* removing the reference to the created floating view */
  private destroyContainer(compref:ComponentRef<FloatingWidgetView|DockedWidgetView|MinimisedView| WidgetView>){
    const idx = this.floatingViewComponentRefs.findIndex(fvc=>fvc==compref)
    if(idx>=0)this.floatingViewComponentRefs.splice(idx,1)

    compref.destroy()
  }

  private embedView(templateRef:TemplateRef<any>,newWidget:WidgetComponent,state:'docked'|'minimised'|'floating'){
    const parentViewRef = this.createViewContainer(state)

    const embedView = parentViewRef.instance.panelBody.createEmbeddedView( templateRef )

    embedView.context.mainController = this.mainController
    parentViewRef.instance.widgetComponent = newWidget
    if(newWidget.parentViewRef){
      this.destroyContainer(newWidget.parentViewRef)
    }
    newWidget.parentViewRef = parentViewRef
    newWidget.state = state

    /* TODO may no longer be necessary, with animation */
    if(this.mainController.nehubaViewer){
      this.mainController.nehubaViewer.redraw()
    }
  }

  private initialInsertWidgetIntoContainer(viewRef:ViewRef,newWidget:WidgetComponent){

    /* initial stage */
    const firstParentViewRef = this.createViewContainer( 'floating' )
    firstParentViewRef.instance.panelBody.insert( viewRef )
    firstParentViewRef.instance.widgetComponent = newWidget
    newWidget.parentViewRef = firstParentViewRef
    newWidget.state = 'floating'
  }

  createWidgetView(widgetComponent:WidgetComponent){
    const widgetViewRef = this.widgetContentViewRef.createComponent( this.widgetFactory )
    const widgetView = (<WidgetView>widgetViewRef.instance)
    widgetView.widgetComponent = widgetComponent

    /* overwriting change state method */
    widgetComponent.changeState = ( state : 'docked' | 'minimised' | 'floating' )=>{
      widgetComponent.parentViewRef.instance.panelBody.detach( 0 )
      this.destroyContainer(widgetComponent.parentViewRef)

      const newParentViewRef = this.createViewContainer(state)

      newParentViewRef.instance.panelBody.insert( widgetViewRef.hostView )
      newParentViewRef.instance.widgetComponent = widgetComponent
      widgetComponent.parentViewRef = newParentViewRef

      widgetComponent.state = state

      if( this.mainController.nehubaViewer ) this.mainController.nehubaViewer.redraw()
    }

    /* initial stage */
    this.initialInsertWidgetIntoContainer(widgetViewRef.hostView,widgetComponent)

    if( this.mainController.nehubaViewer ) this.mainController.nehubaViewer.redraw()

    return widgetViewRef
  }

  /* create new widget from labcomponent for plugins */
  createNewWidget(labComponent:LabComponent){
    const newWidget = new WidgetComponent( labComponent )
    this.widgitServices.loadedLabComponents.push(labComponent)
    const widgetViewRef = this.createWidgetView( newWidget )

    /* script needs to be cloned or the script will only be executed the first time */
    /* deep needs to be true to support inline script */
    const scriptclone = labComponent.script.cloneNode(true)

    /* overwriting shutdown cleanup */
    newWidget.onShutdownCleanup = ()=>{
      this.destroyContainer(newWidget.parentViewRef)
      this.destroyContainer(widgetViewRef)

      this.rd2.removeChild(document.head,scriptclone)
      this.widgitServices.unloadLabcomponent(labComponent)
      this.widgitServices.unloadWidget(newWidget)
    }

    /* TODO this timeout may not be necessary, since loading of src is already async */
    setTimeout(()=>{
      this.rd2.appendChild(document.head,scriptclone)
    })

    return newWidget
  }
}

/**
 * base view of widget
 */

@Component({
  template : 
  `
  <div class = "panel-body" #panelBody>
  </div>
  `
})
export class WidgetView implements AfterViewInit{
  widgetComponent : WidgetComponent
  @ViewChild('panelBody')panelBody : ElementRef

  ngAfterViewInit(){
    /* use clone node to reset the template each time after user closes and reopens the widget */
    // const template = this.widgetComponent.labComponent.template
    const template = this.widgetComponent.labComponent.template.cloneNode(true)
    this.panelBody.nativeElement.appendChild(template)
  }
}

/**
 * the chassis holding instances of widgetview
 */
interface WidgetViewChassis{
  widgetComponent : WidgetComponent
  panelBody : ViewContainerRef
}

/**
 * additional views based on the mode (docked, floating, minimised)
 */

@Component({
  template : 
  `
  <div 
    class = "panel" 
    [style.transform] = "transform"
    [style.zIndex] = "zIndex"
    [ngClass]="{'panel-default':!repositionFlag&&!successClassState,'panel-info':repositionFlag&&!successClassState,'panel-success':successClassState&&!repositionFlag}"
    (mousedown)="stopBlink()" floatingWidgetUnit>

    <div 
      class = "panel-heading"
      (mousedown)="mousedown($event)"
      (mouseup)="mouseup($event)">
        <span>
          {{ widgetComponent.labComponent.name.split('.')[widgetComponent.labComponent.name.split('.').length-1] }}
        </span>
        <i *ngIf = "false" (mousedown)="minimise($event)" class = "close">

          <i class = "glyphicon glyphicon-minus"></i>
        </i>
        <i (mousedown)="dock($event)" class = "close">

          <i class = "glyphicon glyphicon-log-in"></i>
        </i>
        <i *ngIf="widgetComponent.onShutdownCleanup" (mousedown)="close($event)" class = "close">

          <i class = "glyphicon glyphicon-remove"></i>
        </i>
    </div>
    <div class = "panel-body">
      <ng-template #panelBody>
      </ng-template>
    </div>
  </div>
  `,
  styles : [
    `
    div[floatingWidgetUnit]
    {
      position:absolute;
      width:25em;
    }
    div[floatingWidgetUnit] > div.panel-heading:hover
    {
      cursor:move;
    }
    div.panel-heading
    {
      display:flex;
    }

    div.panel-heading > span
    {
      flex : 1 1 auto;

      width:0px;
      overflow:hidden;
      text-overflow:ellipsis;
      display:inline-block;
      white-space:nowrap;
    }
    div.panel-heading > i
    {
      flex : 0 0 1em;
    }

    div.panel-body
    {
      max-height : 80vh;
      overflow-y : auto;
    }
    
    `
  ],
  // animations : [ animationFadeInOut ]
})
export class FloatingWidgetView implements OnDestroy,OnInit,AfterViewInit,WidgetViewChassis{
  widgetComponent : WidgetComponent
  @ViewChild('panelBody',{read:ViewContainerRef})panelBody : ViewContainerRef
  // @HostBinding('@animationFadeInOut') animationFadeInOut : any

  /* widget associated with blinking */
  blinkFlag : boolean = false
  successClassState : boolean = false
  blinkTimer : any

  /* properties associated with reposition the floating view */
  repositionFlag : boolean = false
  position : number[]  = [850,650]
  zIndex : number = 9

  reposStartMousePos : number[] = [0,0]
  reposStartViewPos : number[] = [0,0]

  constructor(
    private zone:NgZone, 
    public floatingWidgetService:FloatingWidgetService){

  }

  ngOnInit(){
    while(this.floatingWidgetService.floatingViews.findIndex(fv=>fv.position[0]==this.position[0]&&fv.position[1]==this.position[1])>=0){
      this.position = this.position.map(v=>v-10)
    }
    if(this.position[0]<=10 || this.position[1]<=10)this.position = [850,650]
    this.floatingWidgetService.floatingViews.push(this)
  }

  ngOnDestroy(){
    const idx = this.floatingWidgetService.floatingViews.findIndex(fv=>fv===this)
    if(idx>=0) this.floatingWidgetService.floatingViews.splice(idx,0)
  }

  @HostListener('mousedown',['$event'])
  floatingwidgetclick(ev:Event){
    ev.stopImmediatePropagation()
    this.floatingWidgetService.focusFloatingViewSubject.next(this)
  }

  @HostListener('document:mousemove',['$event'])
  mousemove(ev:any){
    if(!this.repositionFlag) return

    this.position[0] = this.reposStartViewPos[0] + this.reposStartMousePos[0] - ev.clientX
    this.position[1] = this.reposStartViewPos[1] + this.reposStartMousePos[1] - ev.clientY
  }

  mousedown(ev:any){
    this.reposStartMousePos[0] = ev.clientX
    this.reposStartMousePos[1] = ev.clientY

    this.reposStartViewPos[0] = this.position[0]
    this.reposStartViewPos[1] = this.position[1]

    this.repositionFlag = true;
    document.body.style.pointerEvents = 'none'
    document.body.style.userSelect = 'none'
  }

  @HostListener('document:mouseup',['$event'])
  mouseup(_ev:any){
    this.repositionFlag = false;
    document.body.style.pointerEvents = 'all'
    document.body.style.userSelect = 'initial'
  }

  minimise(ev:any){
    this.widgetComponent.changeState('minimised')
    ev.stopPropagation()
  }

  dock(ev:any){
    this.widgetComponent.changeState('docked')
    ev.stopPropagation()
  }

  get transform(){
    return `translate(${-1 * this.position[0]}px, ${-1 * this.position[1]}px)`
  }

  close(ev:any){
    this.widgetComponent.shutdown()
    ev.stopPropagation()
  }

  blink(sec?:number){
    if( this.blinkFlag ){
      this.blinkTimer.unsubscribe()
    }
    this.blinkFlag = true
    const timer = Observable.timer(0,500)
    this.blinkTimer = timer.subscribe((t:any)=>{
      this.zone.run(()=>{
        this.successClassState = t%2 == 0
        if(t > (sec ? sec : 10)){
          this.blinkTimer.unsubscribe()
          this.successClassState = true
        }
      })
    })
  }

  stopBlink(){
    this.successClassState = false
    this.blinkFlag = false
    if(this.blinkTimer) this.blinkTimer.unsubscribe()
  }

  ngAfterViewInit(){
    this.widgetComponent.handler.blink = (sec?:number) =>{
      this.blink(sec)
    }
  }
}

@Component({
  template :
  `
  <div
    id = "dockedWidgetUnit"
    class = "panel"
    [ngClass] = "{'panel-default':!successClassState, 'panel-success':successClassState}"
    (mousedown) = "stopBlink()" dockedWidgetUnit>

    <div
      class = "panel-heading"
      (click) = "showBody = !showBody">
      <span>
        {{ widgetComponent.labComponent.name.split('.')[widgetComponent.labComponent.name.split('.').length-1] }}
      </span>
      <i 
        *ngIf = "false"
        (mousedown)="minimise($event)" 
        class = "pull-right close">

        <i class = "glyphicon glyphicon-minus"></i>
      </i>
      <i 
        (mousedown)="float($event)" 
        class = "pull-right close">

        <i class = "glyphicon glyphicon-new-window"></i>
      </i>
      <i 
        *ngIf="widgetComponent.onShutdownCleanup"
        (mousedown)="close($event)" 
        class = "pull-right close">

        <i class = "glyphicon glyphicon-remove"></i>
      </i>
    </div>
    <div style="overflow:hidden">
      <div 
        id = "dockedWidgetPanelBody"
        [@animateCollapseShow] = "showBody ? 'show' : 'collapse'" 
        class = "panel-body">

        <ng-template #panelBody>
        </ng-template>
      </div>
    </div>
  </div>
  `,
  styles : [
    `
    div[dockedWidgetUnit]#dockedWidgetUnit
    {
      border-radius: 0px;
      margin-bottom: 1px;
    }

    div.panel-heading
    {
      border-radius: 0px;
      display:flex;
      opacity: 0.9;
      border:none;
    }
    
      div.panel-heading:hover
      {
        opacity:1.0;
        cursor:pointer;
      }

      div.panel-heading > span
      {
        flex : 1 1 auto;

        width:0px;
        overflow:hidden;
        text-overflow:ellipsis;
        display:inline-block;
        white-space:nowrap;
      }
      div.panel-heading > i
      {
        flex : 0 0 1em;
      }
    `
  ],
  animations : [ /* animationFadeInOut, */animateCollapseShow ]
})
export class DockedWidgetView implements AfterViewInit,WidgetViewChassis,OnDestroy {
  // @HostBinding('@animationFadeInOut') animationFadeInOut : any
  @ViewChild('panelBody',{read:ViewContainerRef})panelBody : ViewContainerRef
  widgetComponent : WidgetComponent

  /* view parameters */
  showBody : boolean = true

  /* blink */
  blinkFlag : boolean = false
  blinkTimer : any
  successClassState : boolean = false


  constructor(private zone:NgZone,public widgetService:WidgitServices){}

  ngAfterViewInit(){
    
    this.widgetComponent.handler.blink = (sec?:number) =>{
      this.blink(sec)
    }
    /* expand side bar */
    this.widgetService.layoutChangeSubject.next()
  }

  ngOnDestroy(){
    /* check if you are the last one. if yes, collapse the side bar */
    this.widgetService.layoutChangeSubject.next()
  }
  

  minimise(ev:any){
    this.widgetComponent.changeState('minimised')
    ev.stopPropagation()
  }
  float(ev:any){
    this.widgetComponent.changeState('floating')
    ev.stopPropagation()
  }
  close(ev:any){
    this.widgetComponent.shutdown()
    ev.stopPropagation()
  }

  blink(sec?:number){

    if( this.blinkFlag ){
      this.blinkTimer.unsubscribe()
    }
    this.blinkFlag = true
    const timer = Observable.timer(0,500)
    this.blinkTimer = timer.subscribe((t:any)=>{
      this.zone.run(()=>{
        this.successClassState = t%2 == 0
        if(t > (sec ? sec : 10)){
          this.blinkTimer.unsubscribe()
          this.successClassState = true
        }
      })
    })
  }

  stopBlink(){
    this.successClassState = false
    this.blinkFlag = false
    if(this.blinkTimer) this.blinkTimer.unsubscribe()
  }
}

@Component({
  template : 
  `
  <div
    (mousedown) = "stopBlink()" 
    (click) = "unminimise()"
    [popover] = "getPopoverTitle()" 
    container = "body"
    [containerClass] = "mainController.darktheme ? 'darktheme' : 'lighttheme'"
    placement = "left"
    triggers = "mouseenter:mouseleave"
    [ngClass] = "{'btn-success':successClassState,'btn-default':!successClassState}"
    class = "btn" minimisedWidget>
      {{ getIcon() }}
  </div>
  <div class = "hidden">
    <ng-template #panelBody>
    </ng-template>
  </div>
  `,
  styles :[
  `
  div[minimisedWidget]
  {
    margin-bottom:0.5em;
    pointer-events:all;
  }
  `
  ],
  animations : [ animationFadeInOut ]
})
export class MinimisedView implements AfterViewInit,WidgetViewChassis {
  @ViewChild('panelBody',{read:ViewContainerRef})panelBody : ViewContainerRef
  successClassState : boolean = false
  widgetComponent : WidgetComponent
  blinkFlag : boolean = false
  blinkTimer : any

  @HostBinding('@animationFadeInOut') animationFadeInOut : any

  constructor(private zone:NgZone,public mainController:MainController){}
  unminimise(){
    this.widgetComponent.changeState('floating')
  }

  getPopoverTitle(){
    if(!this.widgetComponent) return '@'
    const name = this.widgetComponent.labComponent.name
    const extractedName = name.split('.')[name.split('.').length-1]
    return extractedName
  }

  getIcon(){
    if(!this.widgetComponent) return '@'
    const name = this.widgetComponent.labComponent.name
    const extractedName = name.split('.')[name.split('.').length-1]
    return extractedName.substring(0,1)
  }

  blink(sec?:number){
    if( this.blinkFlag ){
      this.blinkTimer.unsubscribe()
    }
    this.blinkFlag = true
    const timer = Observable.timer(0,500)
    this.blinkTimer = timer.subscribe((t:any)=>{
      this.zone.run(()=>{
        this.successClassState = t%2 == 0
        if(t > (sec ? sec : 10)){
          this.blinkTimer.unsubscribe()
          this.successClassState = true
        }
      })
    })
  }

  stopBlink(){
    this.successClassState = false
    this.blinkFlag = false
    if(this.blinkTimer) this.blinkTimer.unsubscribe()
  }

  ngAfterViewInit(){
    this.widgetComponent.handler.blink = (sec?:number) =>{
      this.blink(sec)
    }
  }
}

