import { Directive, Input, Output, EventEmitter } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Directive({
  selector: '[iav-switch]',
  exportAs: 'iavSwitch'
})
export class SwitchDirective{

  switchState: boolean = false

  @Input('iav-switch-delay') delay: number = 0
  @Output('iav-switch-event') eventemitter: EventEmitter<boolean> = new EventEmitter()
  
  @Input('iav-switch-state')
  set setSwitchState(val: boolean) {
    this.switchState = val
    this.emit()
  }

  public switchState$ = new BehaviorSubject(this.switchState)

  emit(){
    this.eventemitter.emit(this.switchState)
    this.switchState$.next(this.switchState)
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