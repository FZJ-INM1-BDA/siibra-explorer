import { Directive, Input } from "@angular/core";

@Directive({
  selector: '[iav-switch]',
  exportAs: 'iavSwitch'
})
export class SwitchDirective{
  @Input('iav-switch-initstate') switchState: boolean = false
  
  toggle(){
    this.switchState = !this.switchState
  }

  close(){
    this.switchState = false
  }

  open(){
    this.switchState = true
  }
}