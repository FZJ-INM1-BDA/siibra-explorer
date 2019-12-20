import { Directive, Input, HostBinding, HostListener, ElementRef, OnChanges, Output, EventEmitter } from "@angular/core";

@Directive({
  selector: '[fixedMouseContextualContainerDirective]'
})

export class FixedMouseContextualContainerDirective {

  private defaultPos: [number, number] = [-1e3, -1e3]
  public isShown: boolean = false

  @Input()
  public mousePos: [number, number] = this.defaultPos

  @Output()
  public onShow: EventEmitter<null> = new EventEmitter()

  @Output()
  public onHide: EventEmitter<null> = new EventEmitter()

  constructor(
    private el: ElementRef
  ){
    
  }

  public show(){
    setTimeout(() => {
      if (window.innerHeight - this.mousePos[1] < this.el.nativeElement.clientHeight) {
        this.mousePos[1] = window.innerHeight - this.el.nativeElement.clientHeight
      }

      if ((window.innerWidth - this.mousePos[0]) < this.el.nativeElement.clientWidth) {
        this.mousePos[0] = window.innerWidth-this.el.nativeElement.clientWidth
      }

      this.transform = `translate(${this.mousePos.map(v => v.toString() + 'px').join(', ')})`
    })
    this.styleDisplay = 'block'
    this.isShown = true
    this.onShow.emit()
  }

  public hide(){
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