import {Directive, ElementRef, EventEmitter, HostListener, Output} from "@angular/core";

@Directive({
  selector: '[iav-onclick-outside]',
})
export class ElementOutClickDirective {
  constructor(private elRef: ElementRef) { }

  @Output('iav-onclick-outside')
  public outsideClick = new EventEmitter()

  @HostListener('document:click', ['$event', '$event.target'])
  public onclick(event: MouseEvent, targetElement: HTMLElement): void {
    if (!targetElement) {
      return
    }
    if (this.elRef.nativeElement.contains(targetElement)) {
      return
    }
    this.outsideClick.emit(event)
  }
}
