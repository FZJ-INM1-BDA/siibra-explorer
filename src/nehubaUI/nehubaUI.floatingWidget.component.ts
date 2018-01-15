import { AfterViewInit,Injectable,NgZone,Directive,HostListener,Output,Type,OnInit,Input,Component,ComponentFactoryResolver,ViewChild,ViewContainerRef }from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { UI_CONTROL,EXTERNAL_CONTROL as gExternalControl, HelperFunctions } from './nehubaUI.services'
import { LabComponent, LabComponentHandler } from 'nehubaUI/nehuba.model';
import { Observable } from 'rxjs/Observable';
import { OnChanges } from '@angular/core/src/metadata/lifecycle_hooks';

declare var window:{
  [key:string] : any
  prototype : Window;
  new() : Window;
}

export interface WidgetsStatus{
  totalMinimisedWidgets : number
  hasDockedWidgets : boolean
  dockedWidgetPanelWidth : number
}

@Injectable()
export class FloatingWidgetService{
  dockedWidgetStatus : WidgetsStatus = {
    totalMinimisedWidgets : 0,
    hasDockedWidgets : false,
    dockedWidgetPanelWidth : 300
  }

  relayout : ()=>void

  getDockedWidgetStatus(){
    return this.dockedWidgetStatus
  }
}

@Directive({
  selector : '[floating-widget-host]'
})
export class FloatingWidgetDirective{
  constructor(public viewContainerRef:ViewContainerRef){}
}

@Component({
  selector : 'FloatingWidgetContainer',
  template : `
<ng-template floating-widget-host>
</ng-template>
{{dockedWidgetPanelWidth}}
  `,
  providers : [FloatingWidgetService]
})

export class FloatingWidget implements OnInit,AfterViewInit,OnChanges{
  @Input() dockedWidgetPanelWidth : number = 300
  
  loadedFloatingComponents : FloatingWidgetComponent[] = []

  @ViewChild(FloatingWidgetDirective) host : FloatingWidgetDirective
  viewContainerRef : ViewContainerRef
  zStackCounter : number = 10
  minimisedTrays : any[] = []
  loadedWidgets : LabComponent[] = []
  darktheme : boolean = false

  dockedWidgetStatus : WidgetsStatus = {
    totalMinimisedWidgets : 0,
    hasDockedWidgets : this.loadedFloatingComponents.findIndex(c=>!c.floating) >= 0,
    dockedWidgetPanelWidth : this.dockedWidgetPanelWidth
  }

  constructor( 
    private componentFactoryResolver: ComponentFactoryResolver, 
    private sanitizer : DomSanitizer,
    private floatingWidgetService: FloatingWidgetService
  ){
    /* TODO figure out a new way to launch plugin */
    HelperFunctions.sLoadPlugin = (labComponent:LabComponent) => this.createFloatingComponent(labComponent)
  }

  ngOnChanges(){
    //at least this works
    // this.loadedFloatingComponents.forEach(c=>{
    //   c.rightClearance = this.loadedFloatingComponents.findIndex(c_=>!c_.floating) < 0 ? 
    //     0 :
    //     this.dockedWidgetPanelWidth < 300 ? this.dockedWidgetPanelWidth : 300
    // })
    this.floatingWidgetService.dockedWidgetStatus.dockedWidgetPanelWidth = this.dockedWidgetPanelWidth
  }

  ngOnInit(){
    this.viewContainerRef = this.host.viewContainerRef
    window['pluginControl'] = {}
  }
  ngAfterViewInit(){
    UI_CONTROL.afterTemplateSelection(()=>{
      this.darktheme = gExternalControl.metadata.selectedTemplate ? gExternalControl.metadata.selectedTemplate.useTheme == 'dark' : false      
    })
    this.darktheme = gExternalControl.metadata.selectedTemplate ? gExternalControl.metadata.selectedTemplate.useTheme == 'dark' : false
    
    this.floatingWidgetService.dockedWidgetStatus = this.dockedWidgetStatus
    this.floatingWidgetService.relayout = () =>
      this.floatingWidgetService.dockedWidgetStatus.hasDockedWidgets = (this.loadedFloatingComponents.findIndex(c=>!c.floating) >= 0)
  }

  createFloatingComponent(labComponent:LabComponent){
    this.loadedWidgets.push(labComponent)
    const newFloatingWidgetUnit = new FloatingWidgetUnit(FloatingWidgetComponent,{labComponent:labComponent})
    const floatingWidgetFactory = this.componentFactoryResolver.resolveComponentFactory( newFloatingWidgetUnit.component )
    const componentRef = this.viewContainerRef.createComponent(floatingWidgetFactory);
    
    const floatingWidgetComponent = (<FloatingWidgetComponent>componentRef.instance)
    floatingWidgetComponent.data = labComponent
    floatingWidgetComponent.template = this.sanitizer.bypassSecurityTrustHtml(labComponent.template ? labComponent.template.innerHTML : 'Error parsing template content!');
    floatingWidgetComponent.darktheme = this.darktheme
    floatingWidgetComponent.minimisedTrays = this.minimisedTrays
    floatingWidgetComponent.rightClearance = this.dockedWidgetPanelWidth

    // setTimeout(()=>{
    //   labComponent.name += 'just testing'
    // },1000)
    
    /** 
     * keeping a list of all floating widget components loaded
     * so that it can be easily filtered to be rendered in docked view
     */
    this.loadedFloatingComponents.push( floatingWidgetComponent )

    /* labComponentHandler : how plugin script interact with floatingWidget */
    const labComponentHandler = window['pluginControl'][labComponent.name] = new LabComponentHandler()
    labComponentHandler.blink = (sec?:number) => floatingWidgetComponent.blink(sec)
    labComponentHandler.pushMessage = (message:string) => floatingWidgetComponent.pushMessage(message)
    labComponentHandler.shutdown = ()=> floatingWidgetComponent.shutdownPlugin()
    labComponentHandler.onShutdown = (cb:()=>void)=>componentRef.onDestroy(cb)
    componentRef.onDestroy(()=>{
      delete window.pluginControl[labComponent.name]
      const idx = this.loadedFloatingComponents.findIndex(c=>c.data.name===floatingWidgetComponent.data.name)
      this.loadedFloatingComponents.splice(idx,1)
    })

    labComponent.script.onload = (_s) =>{
      console.log('script loaded')
    }
    labComponent.script.onerror = (_e)=>{
      console.log('script loading error')
    }

    floatingWidgetComponent.afterViewInitHook.push(()=>document.head.appendChild(labComponent.script))
    floatingWidgetComponent.shutdownPlugin = () => {
      componentRef.destroy()
    }
  }
}

@Component({
  selector : 'floatingwidgetcomponent',
  template : `
<div (click)="unminimise()" *ngIf = "minimised" [style.top]="calcMinimisedTrayPos()" [style.left]=" - 50 - (!widgetsStatus.hasDockedWidgets ? 0 : (widgetsStatus.dockedWidgetPanelWidth>300 ? 300 : widgetsStatus.dockedWidgetPanelWidth)) + 'px'" class = "floatingWidget" [ngClass]="{darktheme : darktheme}">
  <div class = "btn" [ngClass]="{'btn-success':successFlag,'btn-default':!successFlag}"
    [popoverTitle] = "data.name"
    [popover] = "popoverMessage ? popoverMessage : 'No messages.'"
    placement = "left"
    triggers = "mouseenter:mouseleave">
    <i>{{data.name.split('.')[data.name.split('.').length-1].substring(0,1)}}</i>
  </div>
</div>
<div (mousedown)="stopBlinking()" [style.top] = "'-'+offset[1]+'px'" [style.left]="'-'+offset[0]+'px'" [style.visibility]= " minimised || !floating ? 'hidden' : 'visible'" class = "floatingWidget"  [ngClass]="{darktheme : darktheme}">
  <div [ngClass]="{'panel-default' : !reposition && !successFlag, 'panel-info' : reposition ,'panel-success':successFlag}" class = "panel">
    <div (mousedown) = "reposition = true;mousedown($event)" (mouseup) = "reposition = false" class = "moveable panel-heading">
      {{data.name.split('.')[data.name.split('.').length-1]}}
      <i (click)="cancel()" class = "pull-right close"><i class = "glyphicon glyphicon-remove"></i></i>
      <i (click)="toTray()" class = "pull-right close"><i class = "glyphicon glyphicon-log-in"></i></i>
      <i (click)="minimise()" class = "pull-right close"><i class = "glyphicon glyphicon-minus"></i></i>
    </div>
    <div [innerHTML]="template" class = "panel-body">
    </div>
  </div>
</div>
  `
})
export class FloatingWidgetComponent implements FloatingWidgetInterface,AfterViewInit{
  @Input() data:any
  @Input() minimisedTrays : any []
  @Input() rightClearance : number = 0

  @Output() shutdownPlugin : any
  @Output() loadSelection : any

  floating : boolean = true
  hasDockedSiblings : boolean = false
  
  icon : string 
  popoverMessage : string | null
  afterViewInitHook : (()=>void)[] = []

  reposition : boolean = false
  startpos : number[] = [0,0]
  offset : number[] = [850,650] /* from bottom right */
  startOffset : number[] = [450,350]

  template : any
  
  blinkingTimer : any
  blinkingFlag : boolean = false
  successFlag : boolean = false

  minimised : boolean = false
  darktheme : boolean  = false
  showbody : boolean = true

  widgetsStatus : WidgetsStatus

  constructor( 
    public zone:NgZone,
    public FloatingWidgetService:FloatingWidgetService ){
  }

  ngAfterViewInit(){
    UI_CONTROL.afterTemplateSelection(()=>{
      this.darktheme = gExternalControl.metadata.selectedTemplate ? gExternalControl.metadata.selectedTemplate.useTheme == 'dark' : false      
    })
    this.darktheme = gExternalControl.metadata.selectedTemplate ? gExternalControl.metadata.selectedTemplate.useTheme == 'dark' : false
    this.afterViewInitHook.forEach(fn=>fn())
    this.widgetsStatus = this.FloatingWidgetService.getDockedWidgetStatus()
  }

  @HostListener('document:mousemove',['$event'])
  mousemove(ev:any){
    if(!this.reposition){
      return
    }
    /* may break in chrome */
    this.offset[0] = this.startOffset[0] + this.startpos[0] - ev.clientX
    this.offset[1] = this.startOffset[1] + this.startpos[1] - ev.clientY
  }

  pushMessage(message:string){
    this.zone.run(()=>{
      this.popoverMessage = this.popoverMessage ? this.popoverMessage + message : message;
    })
  }

  blink(sec?:number){
    if( this.blinkingFlag ){
      this.blinkingTimer.unsubscribe()
    }
    this.blinkingFlag = true
    let blinkingTimer = Observable.timer(0,500)
    this.blinkingTimer = blinkingTimer.subscribe((t:any)=>{
      this.zone.run(()=>{
        this.successFlag = t%2 == 0
          if(t > (sec ? sec :10)){
            this.blinkingTimer.unsubscribe()
            this.successFlag = true
          }
      })
    })
  }

  mousedown(ev:any){
    this.startpos[0] = ev.clientX
    this.startpos[1] = ev.clientY

    this.startOffset[0] = this.offset[0]
    this.startOffset[1] = this.offset[1]
  }

  stopBlinking(){
    this.successFlag = false;
    this.blinkingFlag = false;
    if(this.blinkingTimer){
      this.blinkingTimer.unsubscribe()
    }
  }

  cancel(){
    this.shutdownPlugin()
    this.FloatingWidgetService.relayout()
  }

  toTray(){
    this.floating = false
    this.FloatingWidgetService.relayout()
  }

  offTray(){
    this.floating = true
    this.FloatingWidgetService.relayout()
  }

  minimise(){
    this.minimisedTrays.push(this)
    this.floating = true
    this.minimised = true
    this.FloatingWidgetService.relayout()
  }

  calcMinimisedTrayPos():string{
    return `-${(this.minimisedTrays.findIndex(item=>item===this)+1)*50}px`
  }

  unminimise(){
    const idx = this.minimisedTrays.findIndex(item=>item===this)
    if ( idx >= 0 ) this.minimisedTrays.splice(idx,1)
    this.minimised = false
    this.popoverMessage = null
    this.stopBlinking()
  }
}

export class FloatingWidgetUnit{
  constructor(
    public component:Type<FloatingWidgetComponent>,
    public data:FloatingWidgetInterface
  ){ 
  }
}

export interface FloatingWidgetInterface{
  
}

/* nehubaUI.floatingWidget.component.ts */