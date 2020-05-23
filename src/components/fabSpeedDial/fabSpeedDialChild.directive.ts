import { Directive, Input, HostBinding, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { FabSpeedDialService } from "./fabSpeedDial.service";

const NORMAL = 150
const MAX_CHANGE = 70
const INDEX_FACTOR = 5

@Directive({
  selector: '[iav-fab-speed-dial-child]',
  exportAs: 'iavFabSpeedDialChild'
})

export class FabSpeedDialChild implements OnDestroy{

  private s: Subscription[] = []

  constructor(private fabService: FabSpeedDialService){
    this.s.push(
      this.fabService.openState$.subscribe(flag => {
        this.quickDialOpening(flag)
      }),
      this.fabService.scaleOrigin$.subscribe(origin => {
        this.transformOrigin = origin
      })
    )
  }
  ngOnDestroy(){
    while(this.s.length > 0) {
      this.s.pop().unsubscribe()
    }
  }
  
  @Input('iav-fab-speed-dial-child-index')
  public index: number = 0

  quickDialOpening(flag){
    const _index = Number(this.index)
    const delta = Math.atan(_index * INDEX_FACTOR) / (Math.PI / 2) * MAX_CHANGE
    this.transitionDelay = flag ? `${delta}ms` : `${MAX_CHANGE - delta}ms`
    this.transformProp = `scale(${flag ? 1 : 0})`
  }

  @HostBinding('style.transitionDelay')
  transitionDelay = '0'

  @HostBinding('style.transition')
  transitionProp = `all ${NORMAL}ms linear`

  @HostBinding('style.transform')
  transformProp = `scale(0)`

  @HostBinding('style.transformOrigin')
  transformOrigin = 'center'
}
