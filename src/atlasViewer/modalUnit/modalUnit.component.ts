import {Component, Input, ViewContainerRef, TemplateRef, ViewChild, AfterViewInit} from '@angular/core'

@Component({
  templateUrl : './modalUnit.template.html',
  styleUrls : [
    './modalUnit.style.css'
  ]
})

export class ModalUnit implements AfterViewInit{
  @Input() title : string
  @Input() body : string = 'Modal Body Text'
  @Input() template: TemplateRef<any>
  @Input() footer: string 

  @ViewChild('templateContainer', {static: false, read:ViewContainerRef}) templateContainer : ViewContainerRef

  constructor(public viewContainerRef : ViewContainerRef){
    
  }

  ngAfterViewInit(){
    if (this.templateContainer) {
      this.templateContainer.createEmbeddedView(this.template)
    }
  }
}