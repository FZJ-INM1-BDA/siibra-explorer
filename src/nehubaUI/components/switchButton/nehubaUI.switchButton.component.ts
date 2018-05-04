import { Component, Input } from '@angular/core'

@Component({
  selector : `switch-button`,
  template : 
  `
  
  `
})

export class SwitchButton{
  @Input() textLeft : string = `Left`
  @Input() textRight : string = `Right`
  @Input() defaultState : 'left' | 'right' = 'left'
}