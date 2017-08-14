import { Type,OnInit,Input, Component,ComponentFactoryResolver,ViewChild }from '@angular/core'
import { FloatingWidgetDirective } from './nehubaUI.floatingWidget.directive'
import { EventCenter } from './nehubaUI.services'
import { EventPacket } from './nehuba.model'

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

      constructor(
            private componentFactoryResolver: ComponentFactoryResolver,
            private eventCenter : EventCenter
      ){
            this.eventCenter.floatingWidgetRelay.subscribe((msg:EventPacket)=>{
                  if ( msg.target == 'floatingWidget' ) {
                        console.log('floatingwidget',msg)
                        this.loadFloatingWidget()
                  }
            })
      }

      ngOnInit(){
            this.loadExistingFloatingWidgets()
      }

      loadFloatingWidget(){
            let viewContainerRef = this.host.viewContainerRef
            let floatingWidgetFactory = this.componentFactoryResolver.resolveComponentFactory( this.floatingWidgets[0].component )
            let componentRef = viewContainerRef.createComponent(floatingWidgetFactory);
            (<FloatingWidgetComponent>componentRef.instance).data = this.floatingWidgets[0].data
      }

      /* to be moved to service later */
      loadExistingFloatingWidgets(){
            this.floatingWidgets = [
                  new FloatingWidgetUnit(FloatingWidgetComponent,{name:"Tin tin",age:59})
            ]
      }
}

@Component({
      template : `
            <div [style.bottom] = "offset[1]+'px'" [style.right]="offset[0]+'px'" class = "floatingWidget">
                  <div [ngClass]="{'panel-default' : !reposition, 'panel-info' : reposition }" class = "panel panel-default">
                        <div (mouseleave)="mousemove($event)" (mousemove)="mousemove($event)" (mousedown) = "reposition = true;mousedown($event)" (mouseup) = "reposition = false" class = "panel-heading">Heading</div>
                        <div class = "panel-body">
                              {{data.name}} is {{data.age}} years old. {{reposition}}
                        </div>
                  </div>
            </div>
      `
})
export class FloatingWidgetComponent implements FloatingWidgetInterface{
      @Input() data:any
      reposition : boolean = false
      startpos : number[] = [0,0]
      offset : number[] = [450,350] /* from bottom right */
      startOffset : number[] = [450,350]

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
}

export class FloatingWidgetUnit{
      constructor(public component:Type<any>,public data:any){  }
}

export interface FloatingWidgetInterface{
      data:any
}

/* nehubaUI.floatingWidget.component.ts */