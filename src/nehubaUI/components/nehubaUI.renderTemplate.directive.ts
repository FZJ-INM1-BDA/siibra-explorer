import { Directive, Input, TemplateRef, ViewContainerRef, AfterViewInit } from '@angular/core'

@Directive({
  selector : `[renderTemplateDirective]`
})

export class RenderTemplateDirective implements AfterViewInit{
  @Input() templateRef:TemplateRef<any>
  constructor(private viewContainerRef:ViewContainerRef){
    
  }

  ngAfterViewInit(){
    this.viewContainerRef.createEmbeddedView(this.templateRef)
  }
}