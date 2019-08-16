import {Directive, ElementRef, EventEmitter, HostListener, Output} from "@angular/core";

@Directive({
    selector: '[elementOutClick]'
})
export class ElementOutClickDirective {
    constructor(private elRef: ElementRef) { }

    @Output() outsideClick = new EventEmitter()

    @HostListener('document:click', ['$event', '$event.target'])
    public onclick(event:MouseEvent, targetElement: HTMLElement): void{
        if (!targetElement) {
            return
        }

        this.outsideClick.emit(!this.elRef.nativeElement.contains(targetElement))
    }
}
