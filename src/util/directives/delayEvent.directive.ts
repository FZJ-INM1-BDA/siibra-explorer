import { Directive, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output } from "@angular/core";

const VALID_EVENTNAMES = new Set([
  'mousedown',
  'mouseup',
  'click',
  'mouseenter',
  'mouseleave',
  'touchstart',
  'touchmove',
  'touchend',
])

@Directive({
  selector: '[iav-delay-event]',
})

export class DelayEventDirective implements OnChanges, OnDestroy {

  private evListener = (ev: Event) => setTimeout(() => this.delayedEmit.emit(ev))

  @Input('iav-delay-event')
  public delayEvent: string = ''

  @Output()
  public delayedEmit: EventEmitter<any> = new EventEmitter()

  constructor(
    private el: ElementRef,
  ) {

  }

  private destroyCb: Array<() => void> = []
  public ngOnChanges() {
    this.ngOnDestroy()

    if (!this.delayEvent || this.delayEvent === '') { return }
    const el = this.el.nativeElement as HTMLElement
    for (const evName of this.delayEvent.split(' ')) {
      if (VALID_EVENTNAMES.has(evName)) {
        el.addEventListener(evName, this.evListener)
        this.destroyCb.push(() => el.removeEventListener(evName, this.evListener))
      } else {
        // tslint:disable-next-line
        console.warn(`${evName} is not a valid event name in the supported set`, VALID_EVENTNAMES)
      }
    }
  }

  public ngOnDestroy() {
    while (this.destroyCb.length > 0) { this.destroyCb.pop()() }
  }
}
