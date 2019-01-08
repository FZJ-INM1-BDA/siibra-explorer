import { Directive, HostListener, HostBinding } from "@angular/core";

@Directive({
  selector: '[floatingMouseContextualContainerDirective]'
})

export class FloatingMouseContextualContainerDirective{
  
  private mousePos: [number, number] = [0, 0]

  @HostListener('document:mousemove', ['$event'])
  mousemove(event:MouseEvent){
    this.mousePos = [event.clientX, event.clientY]
  }

  @HostBinding('style.transform')
  get transform(){
    return `translate(${this.mousePos[0]}px,${this.mousePos[1]}px)`
  }
}