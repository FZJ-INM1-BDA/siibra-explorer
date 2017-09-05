import { Directive,HostListener,Output,Type,OnInit,Input,Component,ComponentFactoryResolver,ViewChild,ViewContainerRef }from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { EventCenter,HelperFunctions } from './nehubaUI.services'
import { EventPacket } from './nehuba.model'
import { Subject } from 'rxjs/Subject'
import { Observable } from 'rxjs/Observable'

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
      template:`
<ng-template floating-widget-host>
</ng-template>
      `
})

export class FloatingWidget implements OnInit{

      @ViewChild(FloatingWidgetDirective) host : FloatingWidgetDirective
      floatingWidgets : FloatingWidgetUnit[]
      viewContainerRef : ViewContainerRef
      zStackCounter : number = 10
      minimisedTrays : any[] = []

      constructor(
            private componentFactoryResolver: ComponentFactoryResolver,
            private eventCenter : EventCenter,
            private helperFunctions : HelperFunctions,
            private sanitizer : DomSanitizer
      ){
            this.eventCenter.floatingWidgetSubjectBroker.subscribe((subject:Subject<EventPacket>)=>{
                  subject.subscribe((eventPacket:EventPacket)=>{
                        switch (eventPacket.code)  {
                              case 100:{
                                    switch(eventPacket.target){
                                          case 'loadPresetShader':{
                                                this.loadPresetShaderFloatingWidget(eventPacket)
                                                      .then(newcode=>{
                                                            subject.next(new EventPacket('','',200,{code:newcode}))
                                                      })
                                                      .catch(e=>{
                                                            subject.next(new EventPacket('','',404,e))
                                                      })
                                          }break;
                                          case 'loadCustomFloatingWidget':{
                                                this.loadCustomWidget(eventPacket)
                                                      .then(_newCode => {
                                                            subject.next(new EventPacket('','',200,{}))
                                                      })
                                          }break;
                                          case 'lab':{
                                                this.lab(eventPacket)
                                          }break;
                                    }
                              }break;
                              case 404:
                              case 200:{
                                    subject.unsubscribe()
                              }break;
                        }
                  })
            })
      }

      ngOnInit(){
            this.viewContainerRef = this.host.viewContainerRef
      }

      loadPresetShaderFloatingWidget(msg:EventPacket):Promise<string>{
            return new Promise((resolve,reject)=>{
                  let newFloatingWidgetUnit = new FloatingWidgetUnit(FloatingWidgetComponent,{content:msg.body})
                  let floatingWidgetFactory = this.componentFactoryResolver.resolveComponentFactory( newFloatingWidgetUnit.component )
                  let componentRef = this.viewContainerRef.createComponent(floatingWidgetFactory);
                  (<FloatingWidgetComponent>componentRef.instance).data = msg.body;
                  (<FloatingWidgetComponent>componentRef.instance).presetColorFlag = true;
                  (<FloatingWidgetComponent>componentRef.instance).loadSelection = (code:any)=>{
                        componentRef.destroy()
                        resolve(code)
                  }
                  (<FloatingWidgetComponent>componentRef.instance).cancelSelection = ()=>{
                        componentRef.destroy()
                        reject('cancelled by user')
                  }
                  (<FloatingWidgetComponent>componentRef.instance).minimisedTrays = this.minimisedTrays
            })
      }

      loadCustomWidget(msg:EventPacket):Promise<string>{
            return new Promise((resolve,_reject)=>{
                  let newFloatingWidgetUnit = new FloatingWidgetUnit(FloatingWidgetComponent,{content:msg.body})
                  let floatingWidgetFactory = this.componentFactoryResolver.resolveComponentFactory( newFloatingWidgetUnit.component )
                  let componentRef = this.viewContainerRef.createComponent(floatingWidgetFactory);
                  (<FloatingWidgetComponent>componentRef.instance).customData = msg.body.body;
                  (<FloatingWidgetComponent>componentRef.instance).data = {title:msg.body.title};
                  (<FloatingWidgetComponent>componentRef.instance).presetColorFlag = false;
                  
                  if( msg.body.eventListeners && msg.body.eventListeners.length > 0 ){
                        let userViewerSubscriptions:any[] = []
                        msg.body.eventListeners.forEach((evL:any)=>{
                              userViewerSubscriptions.push(this.eventCenter.userViewerInteractRelay
                                    .filter((evPk:EventPacket)=>evPk.target==evL.event)
                                    .filter((evPk:EventPacket)=>{
                                          const filters = evL.filters as any[]
                                          return filters.length == 0 ? true : filters.some((filter:any)=>this.helperFunctions.queryJsonSubset(filter,evPk.body))
                                    })
                                    .subscribe((evPk:EventPacket)=>{
                                          evL.values.forEach((value:any)=>{
                                                const targetValue = this.helperFunctions.queryNestedJsonValue(value,evPk.body)
                                                this.helperFunctions.setValueById(
                                                      targetValue.target,
                                                      (<FloatingWidgetComponent>componentRef.instance).customData,
                                                      targetValue.value)
                                          })
                                          evL.scripts.forEach((script:any)=>{
                                                eval(script)
                                          })
                                    }))
                  })
                        componentRef.onDestroy(()=>{
                              userViewerSubscriptions.forEach(sub=>{sub.unsubscribe()})
                        });
                  }
                  (<FloatingWidgetComponent>componentRef.instance).cancelSelection = ()=>{
                        resolve('200')
                        componentRef.destroy()
                  }
                  (<FloatingWidgetComponent>componentRef.instance).minimisedTrays = this.minimisedTrays
            })
      }

      lab(msg:EventPacket){
            fetch(msg.body.templateURL)
                  .then(template=>template.text())
                  .then(text=>{
                        const newFloatingWidgetUnit = new FloatingWidgetUnit(FloatingWidgetComponent,{content:msg.body})
                        const floatingWidgetFactory = this.componentFactoryResolver.resolveComponentFactory( newFloatingWidgetUnit.component )
                        const componentRef = this.viewContainerRef.createComponent(floatingWidgetFactory);
                        (<FloatingWidgetComponent>componentRef.instance).template = this.sanitizer.bypassSecurityTrustHtml(text);
                        const data = {
                              title : msg.body.name ? msg.body.name : 'untitled',
                              icon : msg.body.icon ? msg.body.icon : undefined
                        };
                        (<FloatingWidgetComponent>componentRef.instance).data = data;
                        (<FloatingWidgetComponent>componentRef.instance).presetColorFlag = false;
                        window[msg.body.name] = (<FloatingWidgetComponent>componentRef.instance).controllerSubject

                        const script = document.createElement('script')
                        script.onload = (_s) => {
                              console.log('script loaded')
                        }
                        script.onerror = (e) => {
                              console.log('load script error',e)
                        }
                        script.src = msg.body.scriptURL
                        document.head.appendChild(script);

                        (<FloatingWidgetComponent>componentRef.instance).cancelSelection = () =>{
                              /* end of life hook */
                              window[msg.body.name] = null
                              document.head.removeChild(script);
                              (<FloatingWidgetComponent>componentRef.instance).controllerSubject.unsubscribe()
                              componentRef.destroy()
                        }
                        (<FloatingWidgetComponent>componentRef.instance).minimisedTrays = this.minimisedTrays
                  })
                  .catch(e=>console.log(e))
      }
}

export class LabComponentUnit{
      constructor(public component : Type<any>){}
}

@Component({
      template:`<span>LabComponent</span>`
})
export class LabComponent{
      public data : any
}


@Component({
      template : `
<div (click)="unminimise()" *ngIf = "minimised" [style.top]="calcMinimisedTrayPos()" [style.left]="'-50px'" class = "floatingWidget">
      <div class = "btn" [ngClass]="{'btn-success':successFlag,'btn-default':!successFlag}"
            [popoverTitle] = "data.title"
            [popover] = "popoverMessage ? popoverMessage : 'No messages.'"
            placement = "left"
            triggers = "mouseenter:mouseleave"
            >
            <span *ngIf = "data.icon" [ngClass]="'glyphicon-'+data.icon" class = "glyphicon"></span>
            <span *ngIf = "!data.icon">{{data.title.substring(0,1)}}</span>
      </div>
</div>
<div (mousedown)="stopBlinking()" [style.top] = "'-'+offset[1]+'px'" [style.left]="'-'+offset[0]+'px'" [style.visibility]= " minimised ? 'hidden' : 'visible'" class = "floatingWidget">
      <div [ngClass]="{'panel-default' : !reposition, 'panel-info' : reposition ,'panel-success':successFlag}" class = "panel">
            <div (mousedown) = "reposition = true;mousedown($event)" (mouseup) = "reposition = false" class = "moveable panel-heading">
                  <i *ngIf = "data.icon" class = "glyphicon" [ngClass] = "'glyphicon-' + data.icon"></i> {{data.title}}
                  <span (click)="cancel()" class = "pull-right close"><i class = "glyphicon glyphicon-remove"></i></span>
                  <span (click)="minimise()" class = "pull-right close"><i class = "glyphicon glyphicon-minus"></i></span>
            </div>
            <div [innerHTML]="template" *ngIf = "template" class = "panel-body">
            </div>
            <div *ngIf = "presetColorFlag && !template" class = "panel-body">
                  <span>Load a custom colour map for:<br>
                  <strong> {{data.layername}}</strong></span>
                  <hr>
                  <div class = "btn-group" dropdown>
                        <button dropdownToggle type = "button" class = "btn btn-default dropdown-toggle">
                              <span *ngIf = "!selectedColorMap">Select a preset</span>
                              <span *ngIf = "selectedColorMap">{{selectedColorMap.name}}</span>
                              <span class = "caret"></span>
                        </button>
                        <ul *dropdownMenu class = "dropdown-menu" role = "menu">
                              <li *ngFor = "let colormap of COLORMAPS" role = "menuitems">
                                    <a class = "dropdown-item" (click) = "selectedColorMap = colormap;$event.preventDefault()" href = "#">
                                          <img [src] = "colormap.previewurl">{{colormap.name}}
                                    </a>
                              </li>
                        </ul>
                  </div>
            </div>
            <div *ngIf = "!presetColorFlag && !template" class = "panel-body">
                  <multiform [data]="customData">
                  </multiform>
            </div>
            <div *ngIf = "presetColorFlag" class = "panel-footer">
                  <div (click)="loadColorMap()" [ngClass]="{disabled:!selectedColorMap}" class = "btn btn-primary">Load</div>
                  <div (click)="cancel()" class = "btn btn-defaul">Cancel</div>
            </div>
      </div>
</div>
      `
})
export class FloatingWidgetComponent implements FloatingWidgetInterface{
      @Input() data:any
      @Input() minimisedTrays : any []
      @Output() cancelSelection : any
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
      controllerSubject : Subject<EventPacket>
      
      blinkingTimer : any
      blinkingFlag : boolean = false
      successFlag : boolean = false

      minimised : boolean = false

      constructor(){
            this.controllerSubject = new Subject()
            this.controllerSubject.subscribe((evPk:EventPacket)=>{
                  if(evPk.body.blink){
                        this.blinkingFlag = true
                        let blinkingTimer = Observable.timer(0,500)
                        this.blinkingTimer = blinkingTimer.subscribe((t:any)=>{
                              this.successFlag = !this.successFlag
                              if(t>10){
                                    this.blinkingTimer.unsubscribe()
                                    this.successFlag = true
                              }
                        })
                  }
                  if(evPk.body.popoverMessage){
                        this.popoverMessage = this.popoverMessage ? this.popoverMessage + evPk.body.popoverMessage : evPk.body.popoverMessage;
                  }
            })
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
            this.cancelSelection()
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