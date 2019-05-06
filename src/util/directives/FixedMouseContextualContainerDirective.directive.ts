import { Directive, Input, HostBinding, HostListener, ElementRef, OnChanges, Output, EventEmitter } from "@angular/core";
import { ConsoleReporter } from "jasmine";

@Directive({
  selector: '[fixedMouseContextualContainerDirective]'
})

export class FixedMouseContextualContainerDirective implements OnChanges{

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

  ngOnChanges(changes){
    console.log({changes})
  }

  public show(){
    this.transform = `translate(${this.mousePos.map(v => v.toString() + 'px').join(', ')})`
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

  @HostListener('document:click', ['$event'])
  documentClick(event: MouseEvent){
    if (event.which !== 3) {
      console.log(event.target);
      console.log(event.which);
      if (this.styleDisplay === 'none')
        return
      if (this.el.nativeElement.contains(event.target))
        return

      this.hide()
    }
  }

}