import { Directive, OnDestroy, Output, EventEmitter, Input, OnChanges, SimpleChanges, HostListener, ElementRef } from "@angular/core";
import { FabSpeedDialService } from "./fabSpeedDial.service";
import { Subscription } from "rxjs";
import { SCALE_ORIGIN } from './fabSpeedDial.service'
import { distinctUntilChanged } from "rxjs/operators";

@Directive({
  selector: '[iav-fab-speed-dial-container]',
  exportAs: 'iavFabSpeedDialContainer',
  providers: [
    FabSpeedDialService
  ]
})

export class FabSpeedDialContainer implements OnDestroy, OnChanges{

  private s: Subscription[] = []
  
  public isOpen = false

  @Input('iav-fab-speed-dial-scale-origin')
  scaleOrigin = 'center'

  private validOriginValues = Object.keys(SCALE_ORIGIN).map(key => SCALE_ORIGIN[key])

  @Output()
  openStateChanged: EventEmitter<boolean> =  new EventEmitter()

  constructor(
    private fabSDService: FabSpeedDialService,
  ){

    this.s.push(
      this.fabSDService.openState$.pipe(
        distinctUntilChanged()
      ).subscribe(flag => {
        this.isOpen = flag
        this.openStateChanged.emit(this.isOpen)
      })
    )
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.validOriginValues.includes(changes.scaleOrigin.currentValue)) {
      this.fabSDService.scaleOrigin$.next(
        changes.scaleOrigin.currentValue
      )
    }
  }

  ngOnDestroy(){
    while(this.s.length > 0){
      this.s.pop().unsubscribe()
    }
  }

  toggle(){
    this.fabSDService.toggle()
  }

  close(){
    this.fabSDService.close()
  }

  open(){
    this.fabSDService.open()
  }
}
