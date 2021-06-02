import {Directive, ElementRef, HostListener} from "@angular/core";

@Directive({
  selector: '[annotation-list-key-listener]'
})
export class KeyListener {

  constructor(private elementRef: ElementRef) {}

  @HostListener('keydown', ['$event'])
  onKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' || e === 'Escape' || e.key === 'Enter') {
      e.stopPropagation()
      this.elementRef.nativeElement.blur()
    }
  }

}
