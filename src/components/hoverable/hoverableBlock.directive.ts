import { Directive, HostBinding, HostListener, Input, SecurityContext } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

@Directive({
  selector : '[hoverable]',
  host : {
    style: `
      transition :
        opacity 0.3s ease,
        box-shadow 0.3s ease,
        transform 0.3s ease;
      cursor : default;`,
  },
})

export class HoverableBlockDirective {

  @Input('hoverable')
  public config: any = {
    disable: false,
    translateY: -5,
  }

  private _disable = false
  private _translateY = -5

  public ngOnChanges() {
    this._disable = this.config && !!this.config.disable
    /**
     * 0 is evaluated as falsy, but a valid number
     * conditional tests for whether we need to fall back to default
     */
    this._translateY = this.config && this.config.translateY !== 0 && !!Number(this.config.translateY)
      ? Number(this.config.translateY)
      : -5
  }

  @HostBinding('style.opacity')
  public opacity: number = 0.9

  @HostBinding('style.transform')
  public transform = this.sanitizer.sanitize(SecurityContext.STYLE, `translateY(0px)`)

  @HostBinding('style.box-shadow')
  public boxShadow = this.sanitizer.sanitize(SecurityContext.STYLE, '0 4px 6px 0 rgba(5,5,5,0.1)')

  @HostListener('mouseenter')
  public onMouseenter() {
    if (this._disable) { return }
    this.opacity = 1.0
    this.boxShadow = this.sanitizer.sanitize(SecurityContext.STYLE, `0 4px 6px 0 rgba(5,5,5,0.25)`)
    /**
     * n.b. risk of XSS. But sincle translate Y is passed through Number, and corerced into a number,
     * and using 5 as a fallback, it should be safe
     */
    this.transform = this.sanitizer.sanitize(SecurityContext.STYLE, `translateY(${this._translateY}px)`)
  }

  @HostListener('mouseleave')
  public onmouseleave() {
    if (this._disable) { return }
    this.opacity = 0.9
    this.boxShadow = this.sanitizer.sanitize(SecurityContext.STYLE, `0 4px 6px 0 rgba(5,5,5,0.1)`)
    this.transform = this.sanitizer.sanitize(SecurityContext.STYLE, `translateY(0px)`)
  }

  constructor(private sanitizer: DomSanitizer) {

  }
}
