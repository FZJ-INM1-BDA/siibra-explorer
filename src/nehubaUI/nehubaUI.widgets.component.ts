import { Input, ComponentRef, Renderer2, ElementRef,AfterViewInit, Directive,NgZone,HostListener,ViewContainerRef,Component,ComponentFactoryResolver,ComponentFactory,ViewChild } from '@angular/core'
import { LabComponent, LabComponentHandler } from 'nehubaUI/nehuba.model';
import { PLUGIN_CONTROL as gPluginControl, HelperFunctions, MainController } from 'nehubaUI/nehubaUI.services'
import { Observable } from 'rxjs/Rx';

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
    this.handler = gPluginControl[this.labComponent.name] = new LabComponentHandler()

    this.handler.shutdown = this.shutdown
    this.handler.onShutdown = (cb) => this.onShutdownCallbacks.push(cb)
  }

  shutdown()
  {
    this.onShutdownCallbacks.forEach((cb)=>cb())
    delete gPluginControl[this.labComponent.name]

    /* execute shutdown sequence */
    this.onShutdownCleanup()
  }

  changeState : ( state : 'docked' | 'minimised' | 'floating' )=>void
}


@Directive({
  selector : `[host]`
})
export class DynamicViewDirective{
  constructor(public viewContainerRef:ViewContainerRef){}
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
  
  ngAfterViewInit(){
    this.viewContainerRef = this.host.viewContainerRef
  }
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

@Component({
  selector : `MinimisedContainer`,
  template :
  `
  <ng-template host>
  </ng-template>
  `,
  styles : [
  `
  div.btn
  {
    float:bottom
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
  <DockedWidgetContainer [style.display]="hasDockedComponents?'block':'none'">
  </DockedWidgetContainer>
  <FloatingWidgetContainer>
  </FloatingWidgetContainer>
  <MinimisedContainer [style.right] = "getClearRight() + 'px'">
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
    position:absolute;
    right:0em;
    width: 4em;
    bottom:0em;
  }
  DockedWidgetContainer
  {
    position:relative;
    z-index:5;
    display:block;
    width:calc(100% + 12px);
    margin-left:-11px;
    height:100%;
    overflow-y:auto;
    overflow-x:hidden;
  }
  `
  ]
})
export class WidgetsContainer{
  @Input() dockedWidgetPanelWidth : number
  @Input() hasDockedComponents : boolean = false

  @ViewChild(FloatingWidgetContainer) floatingWidgetContainer : FloatingWidgetContainer
  @ViewChild(DockedWidgetContainer) dockedWidgetContainer : DockedWidgetContainer
  @ViewChild(MinimisedWidgetContainer) minimisedWidgetContainer : MinimisedWidgetContainer
  @ViewChild('widgetContentFactory',{read:ViewContainerRef}) widgetContentViewRef : ViewContainerRef

  loadedWidget : WidgetComponent[] = []

  floatingWidgetFactory : ComponentFactory<FloatingWidgetView>
  dockedWidgetFactory : ComponentFactory<DockedWidgetView>
  minimisedWidgetFactory : ComponentFactory<MinimisedView>

  widgetFactory : ComponentFactory<WidgetView>

  constructor( 
    private componentFactoryResolver:ComponentFactoryResolver, 
    private rd2:Renderer2,
    private mainController:MainController ){
      this.floatingWidgetFactory = this.componentFactoryResolver.resolveComponentFactory( FloatingWidgetView )
      this.dockedWidgetFactory = this.componentFactoryResolver.resolveComponentFactory( DockedWidgetView )
      this.minimisedWidgetFactory = this.componentFactoryResolver.resolveComponentFactory( MinimisedView )

      this.widgetFactory = this.componentFactoryResolver.resolveComponentFactory( WidgetView )

      HelperFunctions.sLoadPlugin = (labComponent:LabComponent) => this.createNewWidget(labComponent)
  }

  createNewWidget(labComponent:LabComponent){
    const newWidget = new WidgetComponent( labComponent )
    this.mainController.launchedWidgets.push(labComponent.name)

    const widgetViewRef = this.widgetContentViewRef.createComponent( this.widgetFactory )
    const widgetView = (<WidgetView>widgetViewRef.instance)
    widgetView.widgetComponent = newWidget

    /* overwriting change state method */
    newWidget.changeState = ( state : 'docked' | 'minimised' | 'floating' )=>{
      newWidget.parentViewRef.instance.panelBody.detach( 0 )
      newWidget.parentViewRef.destroy()

      const newParentViewRef = state == 'docked' ?
        this.dockedWidgetContainer.viewContainerRef.createComponent( this.dockedWidgetFactory ) : 
        state == 'minimised' ?
          this.minimisedWidgetContainer.viewContainerRef.createComponent( this.minimisedWidgetFactory ) :
          this.floatingWidgetContainer.viewContainerRef.createComponent( this.floatingWidgetFactory )

      newParentViewRef.instance.panelBody.insert( widgetViewRef.hostView )
      newParentViewRef.instance.widgetComponent = newWidget
      newWidget.parentViewRef = newParentViewRef

      newWidget.state = state

      if( this.mainController.nehubaViewer ) this.mainController.nehubaViewer.redraw()
    }

    /* initial stage */
    const firstParentViewRef = this.floatingWidgetContainer.viewContainerRef.createComponent( this.floatingWidgetFactory )
    firstParentViewRef.instance.panelBody.insert( widgetViewRef.hostView )
    firstParentViewRef.instance.widgetComponent = newWidget
    newWidget.parentViewRef = firstParentViewRef
    newWidget.state = 'docked'

    if( this.mainController.nehubaViewer ) this.mainController.nehubaViewer.redraw()

    /* overwriting shutdown cleanup */
    newWidget.onShutdownCleanup = ()=>{
      newWidget.parentViewRef.destroy()
      widgetViewRef.destroy()
      this.rd2.removeChild(document.head,newWidget.labComponent.script)
      
      const indx = this.mainController.launchedWidgets.findIndex(widgetName=>widgetName==labComponent.name)
      this.mainController.launchedWidgets.splice(indx,1)
    }
    
    setTimeout(()=>{
      this.rd2.appendChild(document.head,newWidget.labComponent.script)
    })
  }

  getClearRight(){
    return !this.hasDockedComponents ? 
      0 :
      this.dockedWidgetPanelWidth < 300 ? 
        this.dockedWidgetPanelWidth : 
        300
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
    this.panelBody.nativeElement.appendChild(this.widgetComponent.labComponent.template)
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
    [style.left] = " '-' + position[0] + 'px' "
    [style.top] = " '-' + position[1] + 'px' "
    [ngClass]="{'panel-default':!repositionFlag&&!successClassState,'panel-info':repositionFlag&&!successClassState,'panel-success':successClassState&&!repositionFlag}"
    (mousedown)="stopBlink()" floatingWidgetUnit>

    <div 
      class = "panel-heading"
      (mousedown)="mousedown($event)"
      (mouseup)="mouseup($event)">
        <span>
          {{ widgetComponent.labComponent.name.split('.')[widgetComponent.labComponent.name.split('.').length-1] }}
        </span>
        <i (mousedown)="minimise($event)" class = "close">

          <i class = "glyphicon glyphicon-minus"></i>
        </i>
        <i (mousedown)="dock($event)" class = "close">

          <i class = "glyphicon glyphicon-log-in"></i>
        </i>
        <i (mousedown)="close($event)" class = "close">

          <i class = "glyphicon glyphicon-remove"></i>
        </i>
    </div>
    <ng-template #panelBody>
    </ng-template>
  </div>
  `,
  styles : [
  `
  div[floatingWidgetUnit]
  {
    position:absolute;
    width:25em;
    z-index:9;
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
  }
  div.panel-heading > i
  {
    flex : 0 0 1em;
  }
  
  `
  ]
})
export class FloatingWidgetView implements AfterViewInit,WidgetViewChassis{
  widgetComponent : WidgetComponent
  @ViewChild('panelBody',{read:ViewContainerRef})panelBody : ViewContainerRef

  /* widget associated with blinking */
  blinkFlag : boolean = false
  successClassState : boolean = false
  blinkTimer : any

  /* properties associated with reposition the floating view */
  repositionFlag : boolean = false
  position : number[] = [850,650]
  reposStartMousePos : number[] = [0,0]
  reposStartViewPos : number[] = [0,0]

  constructor(private zone:NgZone){
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
        (mousedown)="close($event)" 
        class = "pull-right close">

        <i class = "glyphicon glyphicon-remove"></i>
      </i>
    </div>
    <div [hidden] = "!showBody">
      <ng-template #panelBody>
      </ng-template>
    </div>
  </div>
  `,
  styles : [
    `
    div[dockedWidgetUnit]
    {
      border-radius: 0px;
      margin-bottom: 0px;
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
      }
      div.panel-heading > i
      {
        flex : 0 0 1em;
      }
    `
  ]
})
export class DockedWidgetView implements AfterViewInit,WidgetViewChassis {
  @ViewChild('panelBody',{read:ViewContainerRef})panelBody : ViewContainerRef
  widgetComponent : WidgetComponent

  /* view parameters */
  showBody : boolean = true

  /* blink */
  blinkFlag : boolean = false
  blinkTimer : any
  successClassState : boolean = false

  constructor(private zone:NgZone){}

  ngAfterViewInit(){
    this.widgetComponent.handler.blink = (sec?:number) =>{
      this.blink(sec)
    }
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
    placement = "left"
    triggers = "mouseenter:mouseleave"
    [ngClass] = "{'btn-success':successClassState,'btn-default':!successClassState}"
    class = "btn" minimisedWidget>
      {{ getIcon() }}
    <div class = "hidden">
      <ng-template #panelBody>
      </ng-template>
    </div>
  </div>
  `,
  styles :[
  `
  div[minimisedWidget]
  {
    margin-bottom:0.5em;
  }
  `
  ]
})
export class MinimisedView implements AfterViewInit,WidgetViewChassis {
  @ViewChild('panelBody',{read:ViewContainerRef})panelBody : ViewContainerRef
  successClassState : boolean = false
  widgetComponent : WidgetComponent
  blinkFlag : boolean = false
  blinkTimer : any

  constructor(private zone:NgZone){}

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

