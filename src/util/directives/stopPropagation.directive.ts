import { Directive, Input, ElementRef, OnDestroy, OnChanges } from "@angular/core";

const VALID_EVENTNAMES = new Set([
  'mousedown',
  'mouseup',
  'click',
  'mouseenter',
  'mouseleave',
  'touchstart',
  'touchmove',
  'touchend'
])

const stopPropagation = ev => ev.stopPropagation()

@Directive({
  selector: '[iav-stop]'
})

export class StopPropagationDirective implements OnChanges, OnDestroy{

  @Input('iav-stop') stopString: string = ''

  private destroyCb: (() => void)[] = []

  constructor(private el: ElementRef){}

  ngOnChanges(){
    
    this.ngOnDestroy()

    const element = (this.el.nativeElement as HTMLElement)
    for (const evName of this.stopString.split(' ')){
      if(VALID_EVENTNAMES.has(evName)){
        element.addEventListener(evName, stopPropagation)
        this.destroyCb.push(() => {
          element.removeEventListener(evName, stopPropagation)
        })
      } else {
        console.warn(`${evName} is not a valid event name in the supported set: `, VALID_EVENTNAMES)
      }
    }
  }

  ngOnDestroy(){
    while (this.destroyCb.length > 0) {
      this.destroyCb.pop()()
    }
  }
}