import { AfterViewInit,NgZone,Directive,HostListener,Output,Type,OnInit,Input,Component,ComponentFactoryResolver,ViewChild,ViewContainerRef }from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { UI_CONTROL,EXTERNAL_CONTROL as gExternalControl, HelperFunctions } from './nehubaUI.services'
import { LabComponent, LabComponentHandler } from 'nehubaUI/nehuba.model';
import { Observable } from 'rxjs/Observable';

declare var window:{
  [key:string] : any
  prototype : Window;
  new() : Window;
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
  `
})

export class FloatingWidget implements OnInit,AfterViewInit{

  @ViewChild(FloatingWidgetDirective) host : FloatingWidgetDirective
  floatingWidgets : FloatingWidgetUnit[]
  viewContainerRef : ViewContainerRef
  zStackCounter : number = 10
  minimisedTrays : any[] = []
  loadedWidgets : LabComponent[] = []
  darktheme : boolean = false

  constructor( private helperFunctions:HelperFunctions, private componentFactoryResolver: ComponentFactoryResolver, private sanitizer : DomSanitizer){
    /* TODO figure out a new way to launch plugin */
    this.helperFunctions.loadPlugin = (labComponent:LabComponent) => this.lab(labComponent)
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
  }

  lab(labComponent:LabComponent){
    this.loadedWidgets.push(labComponent)
    const newFloatingWidgetUnit = new FloatingWidgetUnit(FloatingWidgetComponent,{content:labComponent})
    const floatingWidgetFactory = this.componentFactoryResolver.resolveComponentFactory( newFloatingWidgetUnit.component )
    const componentRef = this.viewContainerRef.createComponent(floatingWidgetFactory);
    const floatingWidgetComponent = (<FloatingWidgetComponent>componentRef.instance)
    floatingWidgetComponent.template = this.sanitizer.bypassSecurityTrustHtml(labComponent.template ? labComponent.template.innerHTML : 'Error parsing template content!');
    floatingWidgetComponent.data = labComponent
    floatingWidgetComponent.darktheme = this.darktheme
    floatingWidgetComponent.minimisedTrays = this.minimisedTrays

    const labComponentHandler = window['pluginControl'][labComponent.name] = new LabComponentHandler()
    labComponentHandler.blink = (sec?:number) => floatingWidgetComponent.blink(sec)
    labComponentHandler.pushMessage = (message:string) => floatingWidgetComponent.pushMessage(message)
    labComponentHandler.shutdown = ()=> floatingWidgetComponent.shutdownPlugin()
    labComponentHandler.onShutdown = (cb:()=>void)=>componentRef.onDestroy(cb)

    labComponent.script.onload = (_s) =>{
      console.log('script loaded')
    }
    labComponent.script.onerror = (_e)=>{
      console.log('script loading error')
    }
    document.head.appendChild(labComponent.script)

    floatingWidgetComponent.shutdownPlugin = () => componentRef.destroy()
  }
}

@Component({
  template : `
<div (click)="unminimise()" *ngIf = "minimised" [style.top]="calcMinimisedTrayPos()" [style.left]="'-50px'" class = "floatingWidget" [ngClass]="{darktheme : darktheme}">
  <div class = "btn" [ngClass]="{'btn-success':successFlag,'btn-default':!successFlag}"
    [popoverTitle] = "data.name"
    [popover] = "popoverMessage ? popoverMessage : 'No messages.'"
    placement = "left"
    triggers = "mouseenter:mouseleave">
    <i *ngIf = "data.icon" [ngClass]="'glyphicon-'+data.icon" class = "glyphicon"></i>
    <i *ngIf = "!data.icon">{{data.name.split('.')[data.name.split('.').length-1].substring(0,1)}}</i>
  </div>
</div>
<div (mousedown)="stopBlinking()" [style.top] = "'-'+offset[1]+'px'" [style.left]="'-'+offset[0]+'px'" [style.visibility]= " minimised ? 'hidden' : 'visible'" class = "floatingWidget"  [ngClass]="{darktheme : darktheme}">
  <div [ngClass]="{'panel-default' : !reposition && !successFlag, 'panel-info' : reposition ,'panel-success':successFlag}" class = "panel">
    <div (mousedown) = "reposition = true;mousedown($event)" (mouseup) = "reposition = false" class = "moveable panel-heading">
      <i *ngIf = "data.icon" class = "glyphicon" [ngClass] = "'glyphicon-' + data.icon"></i> {{data.name.split('.')[data.name.split('.').length-1]}}
      <i (click)="cancel()" class = "pull-right close"><i class = "glyphicon glyphicon-remove"></i></i>
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
  @Output() shutdownPlugin : any
  @Output() loadSelection : any
  
  icon : string 
  popoverMessage : string | null

  reposition : boolean = false
  startpos : number[] = [0,0]
  offset : number[] = [850,650] /* from bottom right */
  startOffset : number[] = [450,350]
  selectedColorMap : any 

  COLORMAPS : any[] = PRESET_COLOR_MAPS

  presetColorFlag : boolean = true
  customData : any = {}

  template : any
//   public controllerSubject : Subject<EventPacket>
  
  blinkingTimer : any
  blinkingFlag : boolean = false
  successFlag : boolean = false

  minimised : boolean = false
  darktheme : boolean  = false

  constructor( public zone:NgZone ){

  }

  ngAfterViewInit(){
    UI_CONTROL.afterTemplateSelection(()=>{
      this.darktheme = gExternalControl.metadata.selectedTemplate ? gExternalControl.metadata.selectedTemplate.useTheme == 'dark' : false      
    })
    this.darktheme = gExternalControl.metadata.selectedTemplate ? gExternalControl.metadata.selectedTemplate.useTheme == 'dark' : false
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

  loadColorMap(){
    if (this.selectedColorMap) { 
      this.loadSelection(this.selectedColorMap.code) 
    }
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
  }

  minimise(){
    this.minimisedTrays.push(this)
    this.minimised = true
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
  constructor(public component:Type<any>,public data:any){  }
}

export interface FloatingWidgetInterface{
  data:any
}

const PRESET_COLOR_MAPS = [
  {
    name : 'MATLAB_autumn',
    previewurl : "http://172.104.156.15:8080/colormaps/MATLAB_autumn.png",
    code : `
vec4 colormap(float x) {
    float g = clamp(x, 0.0, 1.0);
    return vec4(1.0, g, 0.0, 1.0);
}
    `
  },
   {
    name : 'MATLAB_bone',
    previewurl : 'http://172.104.156.15:8080/colormaps/MATLAB_bone.png',
    code : `
float colormap_red(float x) {
    if (x < 0.75) {
    return 8.0 / 9.0 * x - (13.0 + 8.0 / 9.0) / 1000.0;
    } else {
    return (13.0 + 8.0 / 9.0) / 10.0 * x - (3.0 + 8.0 / 9.0) / 10.0;
    }
}

float colormap_green(float x) {
    if (x <= 0.375) {
    return 8.0 / 9.0 * x - (13.0 + 8.0 / 9.0) / 1000.0;
    } else if (x <= 0.75) {
    return (1.0 + 2.0 / 9.0) * x - (13.0 + 8.0 / 9.0) / 100.0;
    } else {
    return 8.0 / 9.0 * x + 1.0 / 9.0;
    }
}

float colormap_blue(float x) {
    if (x <= 0.375) {
    return (1.0 + 2.0 / 9.0) * x - (13.0 + 8.0 / 9.0) / 1000.0;
    } else {
    return 8.0 / 9.0 * x + 1.0 / 9.0;
    }
}

vec4 colormap(float x) {
    float r = clamp(colormap_red(x), 0.0, 1.0);
    float g = clamp(colormap_green(x), 0.0, 1.0);
    float b = clamp(colormap_blue(x), 0.0, 1.0);
    return vec4(r, g, b, 1.0);
}
    `
  }
]

/* nehubaUI.floatingWidget.component.ts */