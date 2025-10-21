import { Directive, ElementRef, inject, Inject, TemplateRef } from '@angular/core';
import { SlServiceService } from './sl-service.service';
import { DOCUMENT } from '@angular/common';
import { DestroyDirective } from 'src/util/directives/destroy.directive';
import { concat, of, Subject, timer } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { citruslight, clearAll } from "./citruslight"

type BlinkSignal = 'add' | 'fade'

@Directive({
  selector: '[sl-spotlight]',
  exportAs: 'slSpotlight',
  hostDirectives: [
    DestroyDirective,
  ]
})
export class SlSpotlightDirective {

  #blinkSignal = new Subject()
  #ondestroy$ = inject(DestroyDirective).destroyed$

  constructor(
    private slService: SlServiceService,
    private el: ElementRef,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.#blinkSignal.pipe(
      takeUntil(this.#ondestroy$),
      switchMap(() => concat(
        of('add' as BlinkSignal),
        timer(500).pipe(
          map(() => 'fade' as BlinkSignal)
        ),
      ))
    ).subscribe(state => {
      const htmlEl = (this.el.nativeElement as HTMLElement)
      
      if (state === "add") {
        citruslight(htmlEl)
      }
      if (state === "fade") {
        clearAll()
      }
    })
  }

  showBackdrop(tmpl?: TemplateRef<any>){
    this.slService.showBackdrop(tmpl)
  }

  blink() {
    this.#blinkSignal.next(null)
  }
}
