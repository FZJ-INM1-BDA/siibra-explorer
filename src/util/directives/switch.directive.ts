import { Directive, Input, Output, EventEmitter } from "@angular/core";

@Directive({
  selector: '[iav-switch]',
  exportAs: 'iavSwitch'
})
export class SwitchDirective{
  @Input('iav-switch-initstate') switchState: boolean = false
  @Input('iav-switch-delay') delay: number = 0
  @Output('iav-switch-event') eventemitter: EventEmitter<boolean> = new EventEmitter()
  
  emit(flag){
    this.eventemitter.emit(this.switchState)
  }

  toggle(){
    this.switchState = !this.switchState
    setTimeout(this.emit.bind(this), this.delay)
  }

  close(){
    this.switchState = false
    setTimeout(this.emit.bind(this), this.delay)
  }

  open(){
    this.switchState = true
    setTimeout(this.emit.bind(this), this.delay)
  }
}