import { Component, ViewChild, ViewContainerRef,ComponentRef, HostBinding, HostListener, Output, EventEmitter, Input, ElementRef, OnInit, OnDestroy } from "@angular/core";

import { WidgetServices } from "./widgetService.service";
import { AtlasViewerConstantsServices } from "../atlasViewer.constantService.service";
import { Subscription, Observable } from "rxjs";
import { map } from "rxjs/operators";


@Component({
  templateUrl : './widgetUnit.template.html',
  styleUrls : [
    `./widgetUnit.style.css`
  ]
})

export class WidgetUnit implements OnInit, OnDestroy{
  @ViewChild('container',{read:ViewContainerRef}) container : ViewContainerRef

  @HostBinding('attr.state')
  public state : 'docked' | 'floating' = 'docked'

  @HostBinding('style.width')
  width : string = this.state === 'docked' ? null : '0px'

  @HostBinding('style.height')
  height : string = this.state === 'docked' ? null : '0px'

  @HostBinding('style.display')
  isMinimised: string

  isMinimised$: Observable<boolean>

  /**
   * Timed alternates of blinkOn property should result in attention grabbing blink behaviour
   */
  private _blinkOn: boolean = false
  get blinkOn(){
    return this._blinkOn
  }

  set blinkOn(val: boolean) {
    this._blinkOn = !!val
  }

  get showProgress(){
    return this.progressIndicator !== null
  }

  /**
   * Some plugins may like to show progress indicator for long running processes
   * If null, no progress is running
   * This value should be between 0 and 1
   */
  private _progressIndicator: number = null
  get progressIndicator(){
    return this._progressIndicator
  }

  set progressIndicator(val:number) {
    if (isNaN(val)) {
      this._progressIndicator = null
      return
    }
    if (val < 0) {
      this._progressIndicator = 0
      return
    }
    if (val > 1) {
      this._progressIndicator = 1
      return
    }
    this._progressIndicator = val
  }

  public canBeDocked: boolean = false
  @HostListener('mousedown')
  clicked(){
    this.clickedEmitter.emit(this)
    this.blinkOn = false
  }

  @Input() title : string = 'Untitled'

  @Output()
  clickedEmitter : EventEmitter<WidgetUnit> = new EventEmitter()

  @Input()
  public exitable : boolean = true

  @Input()
  public titleHTML : string = null

  public guestComponentRef : ComponentRef<any>
  public widgetServices:WidgetServices
  public cf : ComponentRef<WidgetUnit>
  private subscriptions: Subscription[] = []

  public id: string 
  constructor(
    private constantsService: AtlasViewerConstantsServices
  ){
    this.id = Date.now().toString()
  }

  ngOnInit(){
    this.canBeDocked = typeof this.widgetServices.dockedContainer !== 'undefined'

    this.isMinimised$ = this.widgetServices.minimisedWindow$.pipe(
      map(set => set.has(this))
    )
    this.subscriptions.push(
      this.isMinimised$.subscribe(flag => this.isMinimised = flag ? 'none' : null)
    )
  }

  ngOnDestroy(){
    while(this.subscriptions.length > 0){
      this.subscriptions.pop().unsubscribe()
    }
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

  @HostBinding('style.transform')
  get styleTransform() {
    return this.state === 'floating' ? `translate(${this.position.map(v => v + 'px').join(',')})` : null
  }

  position : [number,number] = [400,100]

  get isMobile(){
    return this.constantsService.mobile
  }
}