import { Directive, HostListener, HostBinding } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

@Directive({
  selector : '[hoverable]',
  host : {
    'style':`
      transition : 
        opacity 0.3s ease, 
        box-shadow 0.3s ease, 
        transform 0.3s ease;
      cursor : default;`,
  }
})

export class HoverableBlockDirective{

  @HostBinding('style.opacity')
  opacity : number = 0.8

  @HostBinding('style.transform')
  transform = this.sanitizer.bypassSecurityTrustStyle(`translateY(0px)`)

  @HostBinding('style.box-shadow')
  boxShadow = this.sanitizer.bypassSecurityTrustStyle('0 4px 6px 0 rgba(5,5,5,0.1)')

  @HostListener('mouseenter')
  onMouseenter(){
    this.opacity = 1.0
    this.boxShadow = this.sanitizer.bypassSecurityTrustStyle(`0 4px 6px 0 rgba(5,5,5,0.25)`)
    this.transform = this.sanitizer.bypassSecurityTrustStyle(`translateY(-2%)`)
  }

  @HostListener('mouseleave')
  onmouseleave(){
    this.opacity = 0.8
    this.boxShadow = this.sanitizer.bypassSecurityTrustStyle(`0 4px 6px 0 rgba(5,5,5,0.1)`)
    this.transform = this.sanitizer.bypassSecurityTrustStyle(`translateY(0px)`)
  }

  constructor(private sanitizer:DomSanitizer){

  }
}