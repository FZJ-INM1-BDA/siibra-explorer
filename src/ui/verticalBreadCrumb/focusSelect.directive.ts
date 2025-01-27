import { Directive, ElementRef, OnDestroy } from "@angular/core";

@Directive({
  selector: '[vbc-on-focus-select]',
})

export class OnFocusSelectDirective implements OnDestroy {

  destroyCB: () => void | null = null

  constructor(private el: ElementRef){
    
    const nativeElement = el.nativeElement
    if (!(nativeElement instanceof HTMLInputElement)) {
      console.error(`vbc-on-focus-select can only bind to html input element`)
      return 
    }
    const ev = () => {
     nativeElement.select()
    }
    nativeElement.addEventListener('focus', ev)
    this.destroyCB = () => {
      nativeElement.removeEventListener('focus', ev)
    }
  }


  ngOnDestroy(): void {
    if (this.destroyCB) {
      this.destroyCB()
    }
  }
}
