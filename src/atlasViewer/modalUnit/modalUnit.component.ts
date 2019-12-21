import { Component, Input, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core'

@Component({
  templateUrl : './modalUnit.template.html',
  styleUrls : [
    './modalUnit.style.css',
  ],
})

export class ModalUnit {
  @Input() public title: string
  @Input() public body: string = 'Modal Body Text'
  @Input() public template: TemplateRef<any>
  @Input() public footer: string

  @ViewChild('templateContainer', {read: ViewContainerRef}) public templateContainer: ViewContainerRef

  constructor(public viewContainerRef: ViewContainerRef) {

  }

  public ngAfterViewInit() {
    if (this.templateContainer) {
      this.templateContainer.createEmbeddedView(this.template)
    }
  }
}
