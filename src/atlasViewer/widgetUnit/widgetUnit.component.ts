import { Component, ViewChild, ViewContainerRef,ComponentRef, HostBinding, HostListener, Output, EventEmitter, Input } from "@angular/core";
import { WidgetServices } from "./widgetService.service";


@Component({
  templateUrl : './widgetUnit.template.html',
  styleUrls : [
    `./widgetUnit.style.css`
  ]
})

export class WidgetUnit {
  @ViewChild('container',{read:ViewContainerRef}) container : ViewContainerRef

  @HostBinding('attr.state')
  public state : 'docked' | 'floating' = 'docked'

  @HostBinding('style.width')
  width : string = this.state === 'docked' ? null : '0px'

  @HostBinding('style.height')
  height : string = this.state === 'docked' ? null : '0px'

  @HostListener('mousedown')
  clicked(){
    this.clickedEmitter.emit(this)
  }

  @Input() title : string = 'Untitled'

  @Input() containerClass : string = ''

  @Output()
  clickedEmitter : EventEmitter<WidgetUnit> = new EventEmitter()

  public exitable : boolean = true

  public guestComponentRef : ComponentRef<any>
  public cf : ComponentRef<WidgetUnit>
  public widgetServices:WidgetServices

  /**
   * @param {boolean}
   * @description when new viewer is init, if this viewer will persist
   * @default false
   * @TODO does it make sense to tie widget persistency with WidgetUnit class?
   */
  public persistency : boolean = false

  undock(event?:Event){
    if(event){
      event.stopPropagation()
      event.preventDefault()
    }
    
    this.widgetServices.changeState(this,{
      title : this.title,
      state:'floating',
      exitable:this.exitable,
      persistency:this.persistency
    })
  }

  dock(event?:Event){
    if(event){
      event.stopPropagation()
      event.preventDefault()
    }
    
    this.widgetServices.changeState(this,{
      title : this.title,
      state:'docked',
      exitable:this.exitable,
      persistency:this.persistency
    })
  }

  exit(event?:Event){
    if(event){
      event.stopPropagation()
      event.preventDefault()
    }

    this.widgetServices.exitWidget(this)
  }

  setWidthHeight(){
    this.width = this.state === 'docked' ? null : '0px'
    this.height = this.state === 'docked' ? null : '0px'
  }

  /* floating widget specific functionalities */

  position : [number,number] = [400,100]
  reposStartViewPos : [number,number] = [0,0]
  reposStartMousePos : [number,number] = [0,0]
  repositionFlag : boolean = false

  @HostListener('document:mousemove',['$event'])
  mousemove(ev:MouseEvent){
    if(!this.repositionFlag) return

    this.position[0] = this.reposStartViewPos[0] - this.reposStartMousePos[0] + ev.clientX
    this.position[1] = this.reposStartViewPos[1] - this.reposStartMousePos[1] + ev.clientY
  }

  mousedown(ev:MouseEvent){
    this.reposStartMousePos[0] = ev.clientX
    this.reposStartMousePos[1] = ev.clientY

    this.reposStartViewPos[0] = this.position[0]
    this.reposStartViewPos[1] = this.position[1]

    this.repositionFlag = true;
    document.body.style.pointerEvents = 'none'
    document.body.style.userSelect = 'none'
  }

  @HostListener('document:mouseup',['$event'])
  mouseup(_ev:MouseEvent){
    this.repositionFlag = false;
    document.body.style.pointerEvents = 'all'
    document.body.style.userSelect = 'initial'
  }

  get transform(){
    return this.state === 'floating' ?
      `translate(${this.position[0]}px, ${this.position[1]}px)` :
      `translate(0 , 0)`
  }

}