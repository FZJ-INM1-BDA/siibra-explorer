import { Component, Input, ViewContainerRef, TemplateRef, ViewChild } from '@angular/core'

@Component({
  templateUrl : './modalUnit.template.html',
  styleUrls : [
    './modalUnit.style.css'
  ]
})

export class ModalUnit{
  @Input() title : string
  @Input() body : string = 'Modal Body Text'
  @Input() template: TemplateRef<any>
  @Input() footer: string 

  @ViewChild('templateContainer', {read:ViewContainerRef}) templateContainer : ViewContainerRef

  constructor(public viewContainerRef : ViewContainerRef){
    
  }

  ngAfterViewInit(){
    if (this.templateContainer) {
      this.templateContainer.createEmbeddedView(this.template)
    }
  }
}