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
    if ((window.innerWidth - this.mousePos[0]) < 220) {
      this.mousePos[0] = window.innerWidth-220
    }
    this.transform = `translate(${this.mousePos.map(v => v.toString() + 'px').join(', ')})`
    this.styleDisplay = 'block'
    if ((window.innerHeight - this.mousePos[1]) < this.el.nativeElement.offsetHeight) {
      this.mousePos[1] = window.innerHeight-this.el.nativeElement.offsetHeight
    }
    this.transform = `translate(${this.mousePos.map(v => v.toString() + 'px').join(', ')})`
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

  @HostListener('document:click', ['$event'])
  documentClick(event: MouseEvent){
    if (event.button !== 2) {
      if (this.styleDisplay === 'none')
        return
      if (this.el.nativeElement.contains(event.target))
        return
      this.hide()
    }
  }

}