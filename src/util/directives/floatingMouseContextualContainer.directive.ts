import { Directive, HostListener, HostBinding } from "@angular/core";
import { DomSanitizer, SafeUrl } from "@angular/platform-browser";

@Directive({
  selector: '[floatingMouseContextualContainerDirective]'
})

export class FloatingMouseContextualContainerDirective{
  
  private mousePos: [number, number] = [0, 0]

  constructor(private sanitizer: DomSanitizer){

  }

  @HostListener('document:mousemove', ['$event'])
  mousemove(event:MouseEvent){
    this.mousePos = [event.clientX, event.clientY]

    this.transform = `translate(${this.mousePos[0]}px,${this.mousePos[1]}px)`
  }

  @HostBinding('style')
  style: SafeUrl = this.sanitizer.bypassSecurityTrustStyle('position: absolute; width: 0; height: 0; top: 0; left: 0;')


  @HostBinding('style.transform')
  transform: string = `translate(${this.mousePos[0]}px,${this.mousePos[1]}px)`
}