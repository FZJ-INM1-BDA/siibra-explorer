import { Component,Input } from '@angular/core'

import template from './nehubaUI.multiform.template.html'

@Component({
  selector : 'multiform',
  template : template
})

export class Multiform{
  @Input() data:any|any[]
  @Input() template:any
}
