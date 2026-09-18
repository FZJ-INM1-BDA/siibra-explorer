import { Directive, ElementRef, inject, Input, Renderer2 } from "@angular/core";
import { Subject } from "rxjs";
import { DestroyDirective } from "./destroy.directive";
import { distinctUntilChanged, skip, takeUntil } from "rxjs/operators";

const FLASH_CLASS = "sxplr-flash-element"
const FLASH_CLASS_ACTIVE = "sxplr-flash-element-active"
const TIMEOUT = 1000

@Directive({
  selector: '[sxplr-flash]',
  standalone: true,
  hostDirectives: [
    DestroyDirective
  ]
})

export class FlashDirective {

  #destroy$ = inject(DestroyDirective).destroyed$

  #value$ = new Subject()
  @Input('sxplr-flash')
  set value(val: unknown) {
    this.#value$.next(val)
  }

  #timeoutId: ReturnType<typeof setTimeout> | undefined

  constructor(el: ElementRef<HTMLElement>, renderer: Renderer2){
    renderer.addClass(el.nativeElement, FLASH_CLASS)
    this.#value$.pipe(
      takeUntil(this.#destroy$),
      distinctUntilChanged(),
      skip(1),
    ).subscribe(() => {
      renderer.removeClass(el.nativeElement, FLASH_CLASS_ACTIVE)
      this.#clearTimeout()
      renderer.addClass(el.nativeElement, FLASH_CLASS_ACTIVE)
      this.#timeoutId = setTimeout(() => {
        renderer.removeClass(el.nativeElement, FLASH_CLASS_ACTIVE)
        this.#clearTimeout()
      }, TIMEOUT)
    })
  }

  #clearTimeout(){
    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId)
      this.#timeoutId = undefined
    }
  }
}
