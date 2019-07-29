import { Component, ViewChild, ViewContainerRef,ComponentRef, HostBinding, HostListener, Output, EventEmitter, Input, ElementRef, OnInit } from "@angular/core";
import { WidgetServices } from "./widgetService.service";
import { AtlasViewerConstantsServices } from "../atlasViewer.constantService.service";
import {WidgetMediatorService} from "src/atlasViewer/widgetUnit/widgetMediator.service";


@Component({
  templateUrl : './widgetUnit.template.html',
  styleUrls : [
    `./widgetUnit.style.css`
  ]
})

export class WidgetUnit implements OnInit{
  @ViewChild('container',{read:ViewContainerRef}) container : ViewContainerRef
  @ViewChild('emptyspan',{read:ElementRef}) emtpy : ElementRef

  @HostBinding('attr.state')
  public state : 'docked' | 'floating' = 'docked'

  @HostBinding('style.width')
  width : string = this.state === 'docked' ? null : '0px'

  @HostBinding('style.height')
  height : string = this.state === 'docked' ? null : '0px'

  @HostBinding('style.display')
  get isMinimised(){
    return this.widgetServices.minimisedWindow.has(this) ? 'none' : null
  }
  /**
   * TODO
   * upgrade to angular>=7, and use cdk to handle draggable components
   */
  get transform(){
    return this.state === 'floating' ?
      `translate(${this.position[0]}px, ${this.position[1]}px)` :
      `translate(0 , 0)`
  }

  public canBeDocked: boolean = false
  @HostListener('mousedown')
  clicked(){
    this.clickedEmitter.emit(this)
  }

  @Input() title : string = 'Untitled'

  @Input() containerClass : string = ''

  @Output()
  clickedEmitter : EventEmitter<WidgetUnit> = new EventEmitter()


  @Output()
  dataBrowserEmitter : EventEmitter<WidgetUnit> = new EventEmitter()

  @Input()
  public exitable : boolean = true

  @Input()
  public titleHTML : string = null

  public guestComponentRef : ComponentRef<any>
  public widgetServices:WidgetServices
  public cf : ComponentRef<WidgetUnit>

  titleTextBoxVisible = false
  @ViewChild('widgetTitleInput', {read: ElementRef}) widgetTitleInput: ElementRef

  public id: string 
  constructor(
    private constantsService: AtlasViewerConstantsServices,
    private widgetMediatorService: WidgetMediatorService) {
    this.id = Date.now().toString()
  }

  ngOnInit(){
    this.canBeDocked = typeof this.widgetServices.dockedContainer !== 'undefined'
  }

  isDataBrowserWidget(widgetUnit) {
    return this.widgetMediatorService.isDataBrowserWidget(widgetUnit)
  }

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

  get isMobile(){
    return this.constantsService.mobile
  }

  pinWidget(title: string = '') {
    if (title.length) {
      this.title = title
      this.titleHTML = '<i class="fas fa-search"></i> ' + title
    }
    this.titleTextBoxVisible = false
    this.widgetMediatorService.pinWidget(this)
    this.widgetServices.minimise(this)
  }

  showTitleTextBox() {
    this.titleTextBoxVisible = true
    setTimeout(() => {this.widgetTitleInput.nativeElement.focus()})
  }
}