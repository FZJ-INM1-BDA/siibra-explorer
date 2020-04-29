import { Directive, ElementRef, EventEmitter, HostBinding, Input, Output, AfterContentChecked, ChangeDetectorRef, AfterViewInit } from "@angular/core";

@Directive({
  selector: '[fixedMouseContextualContainerDirective]',
  exportAs: 'iavFixedMouseCtxContainer'
})

export class FixedMouseContextualContainerDirective implements AfterContentChecked {

  private defaultPos: [number, number] = [-1e3, -1e3]
  public isShown: boolean = false

  @Input()
  public mousePos: [number, number] = this.defaultPos

  @Output()
  public onShow: EventEmitter<null> = new EventEmitter()

  @Output()
  public onHide: EventEmitter<null> = new EventEmitter()

  constructor(
    private el: ElementRef,
    private cdr: ChangeDetectorRef,
  ) {
  }

  public recalculatePosition(){
    const clientWidth = this.el.nativeElement.clientWidth
    const clientHeight = this.el.nativeElement.clientHeight

    const windowInnerWidth = window.innerWidth
    const windowInnerHeight = window.innerHeight
    if (windowInnerHeight - this.mousePos[1] < clientHeight) {
      this.mousePos[1] = windowInnerHeight - clientHeight
    }

    if ((windowInnerWidth - this.mousePos[0]) < clientWidth) {
      this.mousePos[0] = windowInnerWidth - clientWidth
    }

    this.transform = `translate(${this.mousePos.map(v => v.toString() + 'px').join(', ')})`
  }

  ngAfterContentChecked(){
    if (this.el.nativeElement.childElementCount === 0) {
      this.hide()
    }
    this.recalculatePosition()
    this.cdr.markForCheck()
  }

  public show() {
    this.styleDisplay = 'inline-block'
    this.isShown = true
    this.onShow.emit()
  }

  public hide() {
    this.transform = `translate(${this.defaultPos.map(v => v.toString() + 'px').join(', ')})`
    this.styleDisplay = 'none'
    this.isShown = false
    this.onHide.emit()
  }

  @HostBinding('style.display')
  public styleDisplay = `none`

  @HostBinding('style.transform')
  public transform = `translate(${this.mousePos.map(v => v.toString() + 'px').join(', ')})`

}
