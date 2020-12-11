import { Directive, ElementRef, HostListener, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[iav-outsideClick]'
})
export class ClickOutsideDirective {

  constructor(private elementRef: ElementRef) { }

  @Output('iav-outsideClick')
  clickOutside: EventEmitter<any> = new EventEmitter()

  @HostListener('document:click', ['$event.target'])
  onMouseClick(targetElement) {
    const clickedInside = this.elementRef.nativeElement.contains(targetElement)
    const clickInsideCdkOverlay = document.querySelector('.cdk-overlay-container')?.contains(targetElement)
    if (!clickedInside && !clickInsideCdkOverlay) {
      this.clickOutside.emit()
    }
  }
}
