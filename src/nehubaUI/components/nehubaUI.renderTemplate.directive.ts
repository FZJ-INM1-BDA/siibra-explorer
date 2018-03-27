import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core'

@Directive({
  selector : `[renderTemplateDirective]`
})

export class RenderTemplateDirective{
  @Input() templateRef:TemplateRef<any>
  constructor(private viewContainerRef:ViewContainerRef){
    this.viewContainerRef.createEmbeddedView(this.templateRef)
  }
}