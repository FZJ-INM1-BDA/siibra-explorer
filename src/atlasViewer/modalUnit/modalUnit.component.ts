import { Component, Input, ViewContainerRef } from '@angular/core'

@Component({
  templateUrl : './modalUnit.template.html',
  styleUrls : [
    './modalUnit.style.css'
  ]
})

export class ModalUnit{
  @Input() title : string
  @Input() body : string = 'Modal Body Text'

  constructor(public viewContainerRef : ViewContainerRef){
    
  }
}