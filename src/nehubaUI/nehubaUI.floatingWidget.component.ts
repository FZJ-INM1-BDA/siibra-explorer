import { Output,Type,OnInit,Input,Component,ComponentFactoryResolver,ViewChild,ViewContainerRef }from '@angular/core'
import { FloatingWidgetDirective } from './nehubaUI.floatingWidget.directive'
import { EventCenter } from './nehubaUI.services'
import { EventPacket } from './nehuba.model'
import { Subject } from 'rxjs/Subject'

@Component({
      selector : 'FloatingWidgetContainer',
      template:`
            <div id = "floating-widget-screen">
                  <ng-template floating-widget-host>
                  </ng-template>
            </div>
      `
})

export class FloatingWidget implements OnInit{

      @ViewChild(FloatingWidgetDirective) host : FloatingWidgetDirective
      floatingWidgets : FloatingWidgetUnit[]
      viewContainerRef : ViewContainerRef

      constructor(
            private componentFactoryResolver: ComponentFactoryResolver,
            private eventCenter : EventCenter
      ){
            this.eventCenter.floatingWidgetRelay.subscribe((subject:Subject<EventPacket>)=>{
                  subject.subscribe((eventPacket:EventPacket)=>{
                        switch (eventPacket.code)  {
                              case 100:{
                                    this.loadPresetShaderFloatingWidget(eventPacket)
                                          .then(newcode=>{
                                                subject.next(new EventPacket('','',200,{code:newcode}))
                                          })
                                          .catch(e=>{
                                                subject.next(new EventPacket('','',404,e))
                                          })
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
                  (<FloatingWidgetComponent>componentRef.instance).loadSelection = (code:any)=>{
                        componentRef.destroy()
                        resolve(code)
                  }
                  (<FloatingWidgetComponent>componentRef.instance).cancelSelection = ()=>{
                        componentRef.destroy()
                        reject('cancelled by user')
                  }
            })
      }
}

@Component({
      template : `
            <div [style.bottom] = "offset[1]+'px'" [style.right]="offset[0]+'px'" class = "floatingWidget">
                  <div [ngClass]="{'panel-default' : !reposition, 'panel-info' : reposition }" class = "panel panel-default">
                        <div (mouseleave)="mousemove($event)" (mousemove)="mousemove($event)" (mousedown) = "reposition = true;mousedown($event)" (mouseup) = "reposition = false" class = "panel-heading">
                              {{data.title}}
                        </div>
                        <div class = "panel-body">
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
                        <div class = "panel-footer">
                              <div (click)="loadColorMap()" [ngClass]="{disabled:!selectedColorMap}" class = "btn btn-primary">Load</div>
                              <div (click)="cancel()" class = "btn btn-defaul">Cancel</div>
                        </div>
                  </div>
            </div>
      `
})
export class FloatingWidgetComponent implements FloatingWidgetInterface{
      @Input() data:any
      @Output() cancelSelection : any
      @Output() loadSelection : any
      reposition : boolean = false
      startpos : number[] = [0,0]
      offset : number[] = [450,350] /* from bottom right */
      startOffset : number[] = [450,350]
      selectedColorMap : any 

      COLORMAPS : any[] = PRESET_COLOR_MAPS

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

      cancel(){
            this.cancelSelection()
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