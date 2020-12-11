import { Directive, ElementRef, Input, OnChanges, OnDestroy } from "@angular/core";

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

const stopPropagation = (ev: Event) => ev.stopPropagation()

@Directive({
  selector: '[iav-stop]',
})

export class StopPropagationDirective implements OnChanges, OnDestroy {

  @Input('iav-stop') public stopString: string = ''

  private destroyCb: Array<() => void> = []

  constructor(private el: ElementRef) {}

  public ngOnChanges() {

    this.ngOnDestroy()

    if (!this.stopString || this.stopString === '') { return }

    const element = (this.el.nativeElement as HTMLElement)
    for (const evName of this.stopString.split(' ')) {
      if (VALID_EVENTNAMES.has(evName)) {
        element.addEventListener(evName, stopPropagation)
        this.destroyCb.push(() => {
          element.removeEventListener(evName, stopPropagation)
        })
      } else {
        // tslint:disable-next-line
        console.warn(`${evName} is not a valid event name in the supported set: `, VALID_EVENTNAMES)
      }
    }
  }

  public ngOnDestroy() {
    while (this.destroyCb.length > 0) {
      this.destroyCb.pop()()
    }
  }
}
